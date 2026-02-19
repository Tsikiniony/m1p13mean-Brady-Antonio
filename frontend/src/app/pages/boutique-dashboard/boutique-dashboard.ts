import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Box, BoxService } from '../../services/box.service';
import { Boutique, BoutiquesService } from '../../services/boutiques.service';

@Component({
  selector: 'app-boutique-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './boutique-dashboard.html',
  styleUrl: './boutique-dashboard.css',
})
export class BoutiqueDashboardComponent implements OnInit {
  boutiques: Boutique[] = [];
  selectedBoutiqueId: string | null = null;

  profileName = '';
  profileCategory: string | null = null;

  newBoutiqueName = '';
  newBoutiqueCategory: string | null = null;
  creatingBoutique = false;

  categories = ['Informatique', 'Restaurant', 'Electronique', 'Mode', 'Sport', 'Beauté'];

  boxes: Box[] = [];
  loading = false;
  savingProfile = false;
  requestingBoxId: string | null = null;
  error = '';
  info = '';

  private platformId = inject(PLATFORM_ID);

  constructor(
    private boutiquesService: BoutiquesService,
    private boxService: BoxService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.loadBoutiques();
    this.loadBoxes();
  }

  loadBoutiques(): void {
    this.error = '';

    this.boutiquesService.listMine().subscribe({
      next: (boutiques) => {
        this.boutiques = boutiques || [];

        if (!this.selectedBoutiqueId && this.boutiques.length > 0) {
          this.selectedBoutiqueId = this.boutiques[0]._id;
        }

        this.syncProfileWithSelected();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error?.error || 'Erreur lors du chargement des boutiques';
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }

  onSelectedBoutiqueChange(): void {
    this.syncProfileWithSelected();
  }

  private syncProfileWithSelected(): void {
    const b = this.selectedBoutique;
    this.profileName = b?.name || '';
    this.profileCategory = b?.category ?? null;
  }

  get selectedBoutique(): Boutique | null {
    if (!this.selectedBoutiqueId) return null;
    return this.boutiques.find((b) => b._id === this.selectedBoutiqueId) || null;
  }

  saveProfile(): void {
    if (!this.selectedBoutiqueId) {
      this.error = 'Sélectionne une boutique';
      return;
    }

    this.savingProfile = true;
    this.error = '';
    this.info = '';

    this.boutiquesService
      .updateMineById(this.selectedBoutiqueId, { name: this.profileName, category: this.profileCategory })
      .subscribe({
        next: (boutique) => {
          this.boutiques = this.boutiques.map((b) => (b._id === boutique._id ? boutique : b));
          this.info = 'Profil mis à jour';
          this.savingProfile = false;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          this.error = err?.error?.message || err?.error?.error || 'Erreur lors de la mise à jour du profil';
          console.error(err);
          this.savingProfile = false;
          this.cdr.detectChanges();
        }
      });
  }

  createBoutique(): void {
    if (typeof this.newBoutiqueName !== 'string' || !this.newBoutiqueName.trim()) {
      this.error = 'Le nom de la boutique est requis';
      return;
    }

    this.creatingBoutique = true;
    this.error = '';
    this.info = '';

    this.boutiquesService
      .create({ name: this.newBoutiqueName.trim(), category: this.newBoutiqueCategory })
      .subscribe({
        next: (boutique) => {
          this.boutiques = [boutique, ...this.boutiques];
          this.selectedBoutiqueId = boutique._id;
          this.newBoutiqueName = '';
          this.newBoutiqueCategory = null;
          this.creatingBoutique = false;
          this.syncProfileWithSelected();
          this.info = 'Boutique créée';
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          this.error = err?.error?.message || err?.error?.error || 'Erreur lors de la création de la boutique';
          console.error(err);
          this.creatingBoutique = false;
          this.cdr.detectChanges();
        }
      });
  }

  loadBoxes(): void {
    this.loading = true;
    this.error = '';
    this.info = '';

    this.boxService.getBoxesForRequest().subscribe({
      next: (boxes) => {
        this.boxes = boxes;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error?.error || 'Erreur lors du chargement des box';
        console.error(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get availableBoxes(): Box[] {
    return (this.boxes || []).filter((b) => (b.status || (b.boutique ? 'prise' : 'non prise')) === 'non prise');
  }

  requestBox(box: Box): void {
    if (!box._id) return;
    if (!this.selectedBoutiqueId) {
      this.error = 'Sélectionne une boutique avant de demander une box';
      return;
    }

    if (this.hasPendingRequestForSelectedBoutique(box)) {
      this.error = 'Demande déjà en cours pour cette box';
      return;
    }

    this.requestingBoxId = box._id;
    this.error = '';
    this.info = '';

    this.boxService.requestBox(box._id, this.selectedBoutiqueId).subscribe({
      next: () => {
        this.info = 'Demande envoyée. Attente de validation admin.';
        this.requestingBoxId = null;
        this.loadBoxes();
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error?.error || 'Erreur lors de la demande';
        console.error(err);
        this.requestingBoxId = null;
        this.cdr.detectChanges();
      }
    });
  }

  isRequesting(boxId: string | undefined): boolean {
    return !!boxId && boxId === this.requestingBoxId;
  }

  hasPendingRequestForSelectedBoutique(box: Box): boolean {
    if (!this.selectedBoutiqueId) return false;
    const requests = Array.isArray(box.requests) ? box.requests : [];
    return requests.some(
      (r) => String(r.boutique) === String(this.selectedBoutiqueId) && r.status === 'pending'
    );
  }

  isButtonDisabled(box: Box): boolean {
    const boxStatus = box.status || (box.boutique ? 'prise' : 'non prise');
    // Si le statut de la box est "non prise", on peut toujours demander
    if (boxStatus === 'non prise') {
      return (
        this.isRequesting(box._id) ||
        this.hasPendingRequestForSelectedBoutique(box) ||
        !this.selectedBoutiqueId
      );
    }
    // Pour les autres statuts, on désactive
    return true;
  }
}
