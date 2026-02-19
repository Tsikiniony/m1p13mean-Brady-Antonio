import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Box, BoxService } from '../../services/box.service';
import { BoutiqueWithBoxFlag, BoutiquesService } from '../../services/boutiques.service';

@Component({
  selector: 'app-boutique-request-box',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './boutique-request-box.html',
  styleUrl: './boutique-request-box.css'
})
export class BoutiqueRequestBoxComponent implements OnInit {
  boutiques: BoutiqueWithBoxFlag[] = [];
  selectedBoutiqueId: string | null = null;

  boxes: Box[] = [];
  loading = false;
  loadingBoutiques = false;
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
    this.loadingBoutiques = true;
    this.boutiquesService.listMineWithBoxFlag().subscribe({
      next: (data) => {
        this.boutiques = data || [];
        if (!this.selectedBoutiqueId) {
          const firstAvailable = this.boutiques.find((b) => !b.hasBox);
          this.selectedBoutiqueId = firstAvailable?._id || null;
        }
        this.loadingBoutiques = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err?.error?.message || err?.error?.error || 'Erreur chargement boutiques';
        this.loadingBoutiques = false;
        console.error(err);
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
        this.boxes = boxes || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err?.error?.message || err?.error?.error || 'Erreur chargement box';
        this.loading = false;
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }

  get availableBoxes(): Box[] {
    return (this.boxes || []).filter((b) => (b.status || (b.boutique ? 'prise' : 'non prise')) === 'non prise');
  }

  get selectedBoutique(): BoutiqueWithBoxFlag | null {
    if (!this.selectedBoutiqueId) return null;
    return this.boutiques.find((b) => b._id === this.selectedBoutiqueId) || null;
  }

  requestBox(box: Box): void {
    if (!box._id) return;
    if (!this.selectedBoutiqueId) {
      this.error = 'Choisis une boutique';
      return;
    }

    if (this.hasPendingRequestForSelectedBoutique(box)) {
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
        this.loadBoutiques();
      },
      error: (err) => {
        this.error = err?.error?.message || err?.error?.error || 'Erreur demande';
        this.requestingBoxId = null;
        console.error(err);
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

  getButtonLabel(box: Box): string {
    if (this.isRequesting(box._id)) return 'Demande...';
    if (this.hasPendingRequestForSelectedBoutique(box)) return 'Demande en cours';
    return 'Demander';
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
    // Pour les autres statuts, garder la logique existante
    return (
      this.isRequesting(box._id) ||
      this.hasPendingRequestForSelectedBoutique(box) ||
      !this.selectedBoutiqueId ||
      (this.selectedBoutique?.hasBox ?? false)
    );
  }
}
