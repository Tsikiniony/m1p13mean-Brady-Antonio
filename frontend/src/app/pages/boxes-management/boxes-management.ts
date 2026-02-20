import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoxService, Box, PendingBoxRequest } from '../../services/box.service';
import { finalize } from 'rxjs/operators';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-boxes-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './boxes-management.html',
  styleUrl: './boxes-management.css'
})
export class BoxesManagementComponent implements OnInit {
  boxes: Box[] = [];

  selectedImageFile: File | null = null;

  pendingRequests: PendingBoxRequest[] = [];
  loadingRequests = false;
  handlingRequestId: string | null = null;

  searchName = '';
  rentMin: number | null = null;
  rentMax: number | null = null;
  statusFilter: '' | 'prise' | 'non prise' = '';

  showModal = false;
  isEditMode = false;
  currentBox: Box = this.getEmptyBox();

  loading = false;
  savingBox = false;
  deletingBoxId: string | null = null;
  error = '';

  private platformId = inject(PLATFORM_ID);

  constructor(
    private boxService: BoxService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.loadBoxes();
        this.loadPendingRequests();
      });
    }
  }

  getEmptyBox(): Box {
    return {
      rent: 0,
      description: '',
      image: ''
    };
  }

  loadBoxes() {
    this.loading = true;
    this.error = '';

    this.boxService.getAllBoxes().subscribe({
      next: (boxes) => {
        this.boxes = boxes;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors du chargement des box';
        console.error(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadPendingRequests() {
    this.loadingRequests = true;

    this.boxService.getPendingRequests().subscribe({
      next: (requests) => {
        this.pendingRequests = requests;
        this.loadingRequests = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.loadingRequests = false;
        this.cdr.detectChanges();
      }
    });
  }

  approvePendingRequest(req: PendingBoxRequest) {
    this.handlingRequestId = req.requestId;
    this.error = '';

    this.boxService
      .approveRequest(req.boxId, req.requestId)
      .pipe(
        finalize(() => {
          this.handlingRequestId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.loadBoxes();
          this.loadPendingRequests();
        },
        error: (err) => {
          this.error = err.error?.message || err.error?.error || 'Erreur lors de la validation';
          console.error(err);
        }
      });
  }

  rejectPendingRequest(req: PendingBoxRequest) {
    this.handlingRequestId = req.requestId;
    this.error = '';

    this.boxService
      .rejectRequest(req.boxId, req.requestId)
      .pipe(
        finalize(() => {
          this.handlingRequestId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.loadPendingRequests();
        },
        error: (err) => {
          this.error = err.error?.message || err.error?.error || 'Erreur lors du refus';
          console.error(err);
        }
      });
  }

  isHandlingRequest(id: string | undefined): boolean {
    return !!id && id === this.handlingRequestId;
  }

  getRequestBoutiqueLabel(req: PendingBoxRequest): string {
    if (!req?.boutique) return '-';
    if (typeof req.boutique === 'object') {
      const cat = req.boutique.category ? ` - ${req.boutique.category}` : '';

      let ownerEmail = '';
      if (req.boutique.owner && typeof req.boutique.owner === 'object' && req.boutique.owner.email) {
        ownerEmail = req.boutique.owner.email;
      }

      const ownerPart = ownerEmail ? ` (${ownerEmail})` : '';
      return `${req.boutique.name}${ownerPart}${cat}`;
    }
    return String(req.boutique);
  }

  openAddModal() {
    this.isEditMode = false;
    this.currentBox = this.getEmptyBox();
    this.selectedImageFile = null;
    this.error = '';
    this.showModal = true;
  }

  openEditModal(box: Box) {
    this.isEditMode = true;
    this.currentBox = { ...box };
    this.selectedImageFile = null;
    this.error = '';
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.currentBox = this.getEmptyBox();
    this.selectedImageFile = null;
    this.error = '';
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] || null;
    this.selectedImageFile = file;
  }

  saveBox() {
    if (typeof this.currentBox.rent === 'undefined') {
      this.error = 'Le loyer est requis';
      return;
    }

    const rentNumber = Number(this.currentBox.rent);
    if (Number.isNaN(rentNumber)) {
      this.error = 'Le loyer est invalide';
      return;
    }

    if (rentNumber < 0) {
      this.error = 'Le loyer doit être positif';
      return;
    }

    this.savingBox = true;
    this.error = '';

    const desc = typeof this.currentBox.description === 'string' ? this.currentBox.description : '';

    const form = new FormData();
    form.append('rent', String(rentNumber));
    form.append('description', desc);
    if (this.selectedImageFile) {
      form.append('image', this.selectedImageFile);
    }

    const request$ =
      this.isEditMode && this.currentBox._id
        ? this.boxService.updateBoxForm(this.currentBox._id, form)
        : this.boxService.createBoxForm(form);

    request$
      .pipe(
        finalize(() => {
          this.savingBox = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.loadBoxes();
          this.closeModal();
        },
        error: (err) => {
          this.error =
            err.error?.message ||
            err.error?.error ||
            `Erreur lors de ${this.isEditMode ? 'la mise à jour' : 'la création'} (${err.status})`;
          console.error(err);
        }
      });
  }

  deleteBox(id: string | undefined) {
    if (!id) return;

    if (confirm('Êtes-vous sûr de vouloir supprimer ce box ?')) {
      this.deletingBoxId = id;
      this.boxService.deleteBox(id).subscribe({
        next: () => {
          this.loadBoxes();
          this.deletingBoxId = null;
        },
        error: (err) => {
          this.error = err.error?.message || 'Erreur lors de la suppression';
          console.error(err);
          this.deletingBoxId = null;
        }
      });
    }
  }

  isDeleting(id: string | undefined): boolean {
    return id === this.deletingBoxId;
  }

  getBoutiqueLabel(box: Box): string {
    if (!box?.boutique) return '-';
    if (typeof box.boutique === 'object') {
      const cat = box.boutique.category ? ` - ${box.boutique.category}` : '';

      let ownerEmail = '';
      if (box.boutique.owner && typeof box.boutique.owner === 'object' && box.boutique.owner.email) {
        ownerEmail = box.boutique.owner.email;
      }

      const ownerPart = ownerEmail ? ` (${ownerEmail})` : '';
      return `${box.boutique.name}${ownerPart}${cat}`;
    }
    // Si c'est encore un string (ID), le backend n'a pas peuplé la boutique
    return '-';
  }

  getStatusLabel(box: Box): string {
    return box.boutique ? 'prise' : 'non prise';
  }

  get filteredBoxes(): Box[] {
    const nameTerm = (this.searchName || '').trim().toLowerCase();

    return (this.boxes || []).filter((b) => {
      const name = (b.name || '').toLowerCase();
      const status = this.getStatusLabel(b);

      if (nameTerm && !name.includes(nameTerm)) return false;

      if (this.statusFilter && status !== this.statusFilter) return false;

      if (this.rentMin !== null && this.rentMin !== undefined) {
        if (Number(b.rent) < Number(this.rentMin)) return false;
      }

      if (this.rentMax !== null && this.rentMax !== undefined) {
        if (Number(b.rent) > Number(this.rentMax)) return false;
      }

      return true;
    });
  }

  openDetails(box: Box) {
    if (!box._id) return;
    this.router.navigate(['/admin/boxes', box._id]);
  }

}
