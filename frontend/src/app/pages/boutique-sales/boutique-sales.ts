import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SalesService, Sale } from '../../services/sales.service';

@Component({
  selector: 'app-boutique-sales',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './boutique-sales.html',
  styleUrl: './boutique-sales.css'
})
export class BoutiqueSalesComponent implements OnInit {
  loading = false;
  error = '';

  sales: Sale[] = [];
  expandedIds = new Set<string>();

  private platformId = inject(PLATFORM_ID);

  constructor(
    private salesService: SalesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.fetch();
  }

  fetch(): void {
    this.loading = true;
    this.error = '';

    this.salesService.listMineSales().subscribe({
      next: (items) => {
        this.sales = items || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error?.error || 'Erreur lors du chargement des ventes';
        this.loading = false;
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }

  toggleExpanded(s: Sale, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.expandedIds.has(s._id)) this.expandedIds.delete(s._id);
    else this.expandedIds.add(s._id);
  }

  isExpanded(s: Sale): boolean {
    return this.expandedIds.has(s._id);
  }

  getClientLabel(s: Sale): string {
    const c: any = s.client;
    if (typeof c === 'string') return '';
    return c?.name || c?.email || 'Client';
  }

  getBoutiqueName(s: Sale): string {
    const b: any = s.boutique;
    if (typeof b === 'string') return '';
    return b?.name || '';
  }

  getItemsCount(s: Sale): number {
    return (s.items || []).reduce((acc, it) => acc + (it.quantity || 0), 0);
  }

  getItemSubtotal(price: number, quantity: number): number {
    return (Number(price) || 0) * (Number(quantity) || 0);
  }

  trackById(_: number, s: Sale): string {
    return s._id;
  }
}
