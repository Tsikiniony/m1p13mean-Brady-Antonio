import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BoutiqueDeliveriesService, Delivery } from '../../services/boutique-deliveries.service';

@Component({
  selector: 'app-boutique-deliveries',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './boutique-deliveries.html',
  styleUrl: './boutique-deliveries.css'
})
export class BoutiqueDeliveriesComponent implements OnInit {
  loading = false;
  error = '';
  deliveries: Delivery[] = [];

  toastOpen = false;
  toastMessage = '';
  toastKind: 'success' | 'error' = 'success';
  private toastTimer: any = null;
  private toastSeq = 0;
  private busy = new Set<string>();

  private platformId = inject(PLATFORM_ID);

  constructor(private api: BoutiqueDeliveriesService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.fetch();
  }

  advanceStatus(d: Delivery): void {
    if (this.busy.has(d._id)) return;
    if (d.status === 'livre') return;

    this.busy.add(d._id);
    this.api.advanceStatusMine(d._id).subscribe({
      next: (r) => {
        d.status = r.status;
        this.busy.delete(d._id);
        this.showToast('Statut mis à jour', 'success');
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.busy.delete(d._id);
        const msg = err?.error?.message || err?.error?.error || 'Erreur mise à jour statut';
        this.showToast(msg, 'error');
      }
    });
  }

  getStatusLabel(d: Delivery): string {
    if (d.status === 'en_attente') return 'En attente';
    if (d.status === 'en_cours') return 'En cours';
    return 'Livré';
  }

  getActionLabel(d: Delivery): string {
    if (d.status === 'en_attente') return 'Livrer';
    if (d.status === 'en_cours') return 'Achever';
    return '';
  }

  isBusy(d: Delivery): boolean {
    return this.busy.has(d._id);
  }

  private showToast(message: string, kind: 'success' | 'error'): void {
    const seq = ++this.toastSeq;
    this.toastMessage = message;
    this.toastKind = kind;

    this.toastOpen = false;
    this.cdr.detectChanges();

    setTimeout(() => {
      if (seq !== this.toastSeq) return;
      this.toastOpen = true;
      this.cdr.detectChanges();
    }, 0);

    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      if (seq !== this.toastSeq) return;
      this.toastOpen = false;
      this.cdr.detectChanges();
    }, 1800);

    this.cdr.detectChanges();
  }

  fetch(): void {
    this.loading = true;
    this.error = '';

    this.api.listMine().subscribe({
      next: (items) => {
        this.deliveries = items || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error?.error || 'Erreur chargement livraisons';
        this.loading = false;
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }

  getBoutiqueName(d: Delivery): string {
    const b: any = d.boutique;
    return typeof b === 'string' ? '' : (b?.name || '');
  }

  getClientName(d: Delivery): string {
    const c: any = d.client;
    return typeof c === 'string' ? '' : (c?.name || '');
  }

  trackById(_: number, d: Delivery): string {
    return d._id;
  }
}
