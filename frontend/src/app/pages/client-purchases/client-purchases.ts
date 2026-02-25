import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Purchase, PurchasesService } from '../../services/purchases.service';

@Component({
  selector: 'app-client-purchases',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './client-purchases.html',
  styleUrl: './client-purchases.css'
})
export class ClientPurchasesComponent implements OnInit {
  loading = false;
  error = '';
  purchases: Purchase[] = [];
  expandedPurchaseIds = new Set<string>();

  private platformId = inject(PLATFORM_ID);

  constructor(private purchasesService: PurchasesService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.fetch();
  }

  fetch(): void {
    this.loading = true;
    this.error = '';

    this.purchasesService.listMine().subscribe({
      next: (items) => {
        this.purchases = items || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error?.error || 'Erreur lors du chargement de l\'historique';
        this.loading = false;
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }

  getBoutiqueName(p: Purchase): string {
    const b: any = p.boutique;
    return typeof b === 'string' ? '' : (b?.name || '');
  }

  getItemsCount(p: Purchase): number {
    return (p.items || []).reduce((acc, it) => acc + (it.quantity || 0), 0);
  }

  toggleExpanded(p: Purchase, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.expandedPurchaseIds.has(p._id)) {
      this.expandedPurchaseIds.delete(p._id);
    } else {
      this.expandedPurchaseIds.add(p._id);
    }
  }

  isExpanded(p: Purchase): boolean {
    return this.expandedPurchaseIds.has(p._id);
  }

  getItemSubtotal(price: number, quantity: number): number {
    return (Number(price) || 0) * (Number(quantity) || 0);
  }

  trackById(_: number, p: Purchase): string {
    return p._id;
  }
}
