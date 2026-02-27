import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Purchase, PurchasesService, PurchaseBoutique, PurchaseItem } from '../../services/purchases.service';

interface Filters {
  boutique: string;
  article: string;
  dateFrom: string;
  dateTo: string;
}

@Component({
  selector: 'app-client-purchases',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './client-purchases.html',
  styleUrl: './client-purchases.css'
})
export class ClientPurchasesComponent implements OnInit {
  loading = false;
  error = '';
  purchases: Purchase[] = [];
  filteredPurchases: Purchase[] = [];
  expandedPurchaseIds = new Set<string>();

  // Filters
  filters: Filters = {
    boutique: '',
    article: '',
    dateFrom: '',
    dateTo: ''
  };

  // Autocomplete suggestions
  boutiqueSuggestions: string[] = [];
  articleSuggestions: string[] = [];
  filteredBoutiqueSuggestions: string[] = [];
  filteredArticleSuggestions: string[] = [];
  showBoutiqueAutocomplete = false;
  showArticleAutocomplete = false;

  // Pagination
  currentPage = 1;
  itemsPerPage = 5;

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
        this.extractSuggestions();
        this.applyFilters();
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

  extractSuggestions(): void {
    const boutiques = new Set<string>();
    const articles = new Set<string>();

    this.purchases.forEach(p => {
      const bName = this.getBoutiqueName(p);
      if (bName) boutiques.add(bName);
      
      p.items?.forEach(item => {
        if (item.name) articles.add(item.name);
      });
    });

    this.boutiqueSuggestions = Array.from(boutiques).sort();
    this.articleSuggestions = Array.from(articles).sort();
    this.filteredBoutiqueSuggestions = [...this.boutiqueSuggestions];
    this.filteredArticleSuggestions = [...this.articleSuggestions];
  }

  applyFilters(): void {
    let result = [...this.purchases];

    if (this.filters.boutique.trim()) {
      const search = this.filters.boutique.toLowerCase();
      result = result.filter(p => {
        const bName = this.getBoutiqueName(p).toLowerCase();
        return bName.includes(search);
      });
    }

    if (this.filters.article.trim()) {
      const search = this.filters.article.toLowerCase();
      result = result.filter(p => {
        return p.items?.some(item => item.name?.toLowerCase().includes(search));
      });
    }

    if (this.filters.dateFrom) {
      const fromDate = new Date(this.filters.dateFrom);
      result = result.filter(p => new Date(p.createdAt) >= fromDate);
    }

    if (this.filters.dateTo) {
      const toDate = new Date(this.filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter(p => new Date(p.createdAt) <= toDate);
    }

    this.filteredPurchases = result;
    this.currentPage = 1;
  }

  onFilterChange(): void {
    this.applyFilters();
    this.cdr.detectChanges();
  }

  onBoutiqueInput(): void {
    const search = this.filters.boutique.toLowerCase();
    this.filteredBoutiqueSuggestions = this.boutiqueSuggestions.filter(name => 
      name.toLowerCase().includes(search)
    );
    this.showBoutiqueAutocomplete = this.filters.boutique.length > 0 && this.filteredBoutiqueSuggestions.length > 0;
    this.onFilterChange();
  }

  onArticleInput(): void {
    const search = this.filters.article.toLowerCase();
    this.filteredArticleSuggestions = this.articleSuggestions.filter(name => 
      name.toLowerCase().includes(search)
    );
    this.showArticleAutocomplete = this.filters.article.length > 0 && this.filteredArticleSuggestions.length > 0;
    this.onFilterChange();
  }

  selectBoutique(name: string): void {
    this.filters.boutique = name;
    this.showBoutiqueAutocomplete = false;
    this.onFilterChange();
  }

  selectArticle(name: string): void {
    this.filters.article = name;
    this.showArticleAutocomplete = false;
    this.onFilterChange();
  }

  clearFilters(): void {
    this.filters = {
      boutique: '',
      article: '',
      dateFrom: '',
      dateTo: ''
    };
    this.showBoutiqueAutocomplete = false;
    this.showArticleAutocomplete = false;
    this.applyFilters();
  }

  // Pagination
  get paginatedPurchases(): Purchase[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredPurchases.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredPurchases.length / this.itemsPerPage);
  }

  get pages(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.cdr.detectChanges();
    }
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
