import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Box, BoxService, PendingCancelRequest } from '../../services/box.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-admin-rents',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-rents.html',
  styleUrl: './admin-rents.css'
})
export class AdminRentsComponent implements OnInit {
  loading = false;
  error = '';
  info = '';

  pendingCancelRequests: PendingCancelRequest[] = [];
  loadingCancelRequests = false;
  handlingCancelRequestId: string | null = null;

  boxes: Box[] = [];
  filter: 'all' | 'active' | 'expired' = 'all';

  extendingRentBoxId: string | null = null;

  private platformId = inject(PLATFORM_ID);

  constructor(private boxService: BoxService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.load();
    this.loadPendingCancelRequests();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.info = '';

    this.boxService.getAllBoxes().subscribe({
      next: (boxes) => {
        this.boxes = boxes || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err?.error?.message || err?.error?.error || 'Erreur chargement loyers';
        this.loading = false;
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }

  get rentedBoxes(): Box[] {
    return (this.boxes || []).filter((b) => !!b.boutique);
  }

  isExpired(box: Box): boolean {
    if (!box?.rentExpiresAt) return true;
    const d = new Date(box.rentExpiresAt);
    if (Number.isNaN(d.getTime())) return true;
    return d.getTime() < Date.now();
  }

  isCancelled(box: Box): boolean {
    if (!box?.rentCancelAt) return false;
    const d = new Date(box.rentCancelAt);
    if (Number.isNaN(d.getTime())) return false;
    return d.getTime() > Date.now();
  }

  getExpiresLabel(box: Box): string {
    const v = box?.rentExpiresAt;
    if (!v) return '-';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleDateString();
  }

  get filteredBoxes(): Box[] {
    const arr = this.rentedBoxes;
    if (this.filter === 'all') return arr;
    if (this.filter === 'active') return arr.filter((b) => !this.isExpired(b));
    return arr.filter((b) => this.isExpired(b));
  }

  getStatusBadgeClass(box: Box): string {
    if (this.isCancelled(box)) return 'badge-resilie-echeance';
    if (this.isExpired(box)) return 'badge-expired';
    return 'badge';
  }

  getStatusLabel(box: Box): string {
    if (this.isCancelled(box)) return 'Résilié (échéance)';
    if (this.isExpired(box)) return 'Expiré';
    return 'Actif';
  }

  getBoxTitle(box: Box): string {
    return box.name || (typeof box.number === 'number' ? `B${box.number}` : 'Box');
  }

  getBoutiqueLabel(box: Box): string {
    if (!box?.boutique) return '-';
    if (typeof box.boutique === 'object') {
      return box.boutique.name || '-';
    }
    return String(box.boutique);
  }

  isExtendingRent(id: string | undefined): boolean {
    return !!id && id === this.extendingRentBoxId;
  }

  extendRent(box: Box): void {
    if (!box?._id) return;
    if (!box?.boutique) return;

    const ok = confirm('Valider le paiement et prolonger le loyer de +1 mois ?');
    if (!ok) return;

    this.extendingRentBoxId = box._id;
    this.error = '';
    this.info = '';

    this.boxService
      .extendRent(box._id)
      .pipe(
        finalize(() => {
          this.extendingRentBoxId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.info = 'Paiement validé';
          this.load();
        },
        error: (err) => {
          this.error = err?.error?.message || err?.error?.error || 'Erreur validation paiement';
          console.error(err);
        }
      });
  }

  loadPendingCancelRequests(): void {
    this.loadingCancelRequests = true;
    this.boxService.getPendingCancelRequests().subscribe({
      next: (reqs) => {
        this.pendingCancelRequests = reqs || [];
        this.loadingCancelRequests = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.loadingCancelRequests = false;
        this.cdr.detectChanges();
      }
    });
  }

  isHandlingCancelRequest(id: string | undefined): boolean {
    return !!id && id === this.handlingCancelRequestId;
  }

  getCancelBoutiqueLabel(req: PendingCancelRequest): string {
    if (!req?.boutique) return '-';
    if (typeof req.boutique === 'object') {
      return req.boutique.name || '-';
    }
    return String(req.boutique);
  }

  getCancelTypeLabel(req: PendingCancelRequest): string {
    return req.type === 'immediate' ? 'Immédiate' : "À l'échéance";
  }

  approveCancel(req: PendingCancelRequest): void {
    this.handlingCancelRequestId = req.cancelRequestId;
    this.error = '';
    this.info = '';

    this.boxService
      .approveCancelRequest(req.boxId, req.cancelRequestId)
      .pipe(
        finalize(() => {
          this.handlingCancelRequestId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.info = 'Résiliation validée';
          this.load();
          this.loadPendingCancelRequests();
        },
        error: (err) => {
          this.error = err?.error?.message || err?.error?.error || 'Erreur validation résiliation';
          console.error(err);
        }
      });
  }

  rejectCancel(req: PendingCancelRequest): void {
    this.handlingCancelRequestId = req.cancelRequestId;
    this.error = '';
    this.info = '';

    this.boxService
      .rejectCancelRequest(req.boxId, req.cancelRequestId)
      .pipe(
        finalize(() => {
          this.handlingCancelRequestId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.info = 'Résiliation refusée';
          this.loadPendingCancelRequests();
        },
        error: (err) => {
          this.error = err?.error?.message || err?.error?.error || 'Erreur refus résiliation';
          console.error(err);
        }
      });
  }
}
