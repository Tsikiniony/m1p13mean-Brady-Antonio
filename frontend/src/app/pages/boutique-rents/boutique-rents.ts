import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Box, BoxService } from '../../services/box.service';

@Component({
  selector: 'app-boutique-rents',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './boutique-rents.html',
  styleUrl: './boutique-rents.css'
})
export class BoutiqueRentsComponent implements OnInit {
  loading = false;
  error = '';
  info = '';
  boxes: Box[] = [];

  filter: 'all' | 'active' | 'expired' = 'all';

  requestingCancelBoxId: string | null = null;

  private platformId = inject(PLATFORM_ID);

  constructor(private boxService: BoxService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.info = '';

    this.boxService.getMyRents().subscribe({
      next: (boxes) => {
        this.boxes = boxes || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err?.error?.message || err?.error?.error || 'Erreur chargement loyers';
        console.error(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private getBoxBoutiqueId(box: Box): string | null {
    const b = box?.boutique;
    if (!b) return null;
    if (typeof b === 'object' && b._id) return b._id;
    if (typeof b === 'string') return b;
    return null;
  }

  isRequestingCancel(boxId: string | undefined): boolean {
    return !!boxId && boxId === this.requestingCancelBoxId;
  }

  hasPendingCancelRequest(box: Box): boolean {
    const boutiqueId = this.getBoxBoutiqueId(box);
    if (!boutiqueId) return false;
    const reqs = Array.isArray(box.cancelRequests) ? box.cancelRequests : [];
    return reqs.some((r) => String(r.boutique) === String(boutiqueId) && r.status === 'pending');
  }

  requestCancel(box: Box, type: 'at_expiry' | 'immediate'): void {
    if (!box?._id) return;
    const boutiqueId = this.getBoxBoutiqueId(box);
    if (!boutiqueId) {
      this.error = 'Boutique introuvable pour cette box';
      return;
    }

    if (this.hasPendingCancelRequest(box)) {
      this.error = 'Demande de résiliation déjà envoyée';
      return;
    }

    const msg =
      type === 'immediate'
        ? "Demander une résiliation immédiate ? (l'admin doit valider)"
        : "Demander une résiliation à l'échéance ? (l'admin doit valider)";
    const ok = confirm(msg);
    if (!ok) return;

    this.requestingCancelBoxId = box._id;
    this.error = '';
    this.info = '';

    this.boxService.requestCancel(box._id, boutiqueId, type).subscribe({
      next: () => {
        this.info = 'Demande envoyée. Attente de validation admin.';
        this.requestingCancelBoxId = null;
        this.load();
      },
      error: (err) => {
        this.error = err?.error?.message || err?.error?.error || 'Erreur demande résiliation';
        console.error(err);
        this.requestingCancelBoxId = null;
        this.cdr.detectChanges();
      }
    });
  }

  isExpired(box: Box): boolean {
    if (!box?.rentExpiresAt) return true;
    const d = new Date(box.rentExpiresAt);
    if (Number.isNaN(d.getTime())) return true;
    return d.getTime() < Date.now();
  }

  getExpiresLabel(box: Box): string {
    const v = box?.rentExpiresAt;
    if (!v) return '-';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleDateString();
  }

  getStatusLabel(box: Box): string {
    const s = box?.status || (box?.boutique ? 'prise' : 'non prise');
    if (s === 'resilié') return 'Résilié';
    return this.isExpired(box) ? 'Expiré' : 'Actif';
  }

  get filteredBoxes(): Box[] {
    const arr = this.boxes || [];
    if (this.filter === 'all') return arr;
    if (this.filter === 'active') return arr.filter((b) => !this.isExpired(b));
    return arr.filter((b) => this.isExpired(b));
  }

  getBoxTitle(box: Box): string {
    return box.name || (typeof box.number === 'number' ? `B${box.number}` : 'Box');
  }
}
