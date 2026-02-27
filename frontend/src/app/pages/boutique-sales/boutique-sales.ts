import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SalesService, Sale, SaleClient, SaleItem } from '../../services/sales.service';

interface Filters {
  client: string;
  article: string;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
}

@Component({
  selector: 'app-boutique-sales',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './boutique-sales.html',
  styleUrl: './boutique-sales.css'
})
export class BoutiqueSalesComponent implements OnInit {
  loading = false;
  error = '';

  sales: Sale[] = [];
  filteredSales: Sale[] = [];
  expandedIds = new Set<string>();

  // Filters
  filters: Filters = {
    client: '',
    article: '',
    dateFrom: '',
    dateTo: '',
    minAmount: ''
  };

  // Autocomplete suggestions
  clientSuggestions: string[] = [];
  articleSuggestions: string[] = [];
  filteredClientSuggestions: string[] = [];
  filteredArticleSuggestions: string[] = [];
  showClientAutocomplete = false;
  showArticleAutocomplete = false;

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;

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
        this.extractSuggestions();
        this.applyFilters();
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

  extractSuggestions(): void {
    const clients = new Set<string>();
    const articles = new Set<string>();

    this.sales.forEach(s => {
      const cName = this.getClientLabel(s);
      if (cName && cName !== 'Client') clients.add(cName);
      
      s.items?.forEach(item => {
        if (item.name) articles.add(item.name);
      });
    });

    this.clientSuggestions = Array.from(clients).sort();
    this.articleSuggestions = Array.from(articles).sort();
    this.filteredClientSuggestions = [...this.clientSuggestions];
    this.filteredArticleSuggestions = [...this.articleSuggestions];
  }

  applyFilters(): void {
    let result = [...this.sales];

    if (this.filters.client.trim()) {
      const search = this.filters.client.toLowerCase();
      result = result.filter(s => {
        const cName = this.getClientLabel(s).toLowerCase();
        return cName.includes(search);
      });
    }

    if (this.filters.article.trim()) {
      const search = this.filters.article.toLowerCase();
      result = result.filter(s => {
        return s.items?.some(item => item.name?.toLowerCase().includes(search));
      });
    }

    if (this.filters.dateFrom) {
      const fromDate = new Date(this.filters.dateFrom);
      result = result.filter(s => new Date(s.createdAt) >= fromDate);
    }

    if (this.filters.dateTo) {
      const toDate = new Date(this.filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter(s => new Date(s.createdAt) <= toDate);
    }

    if (this.filters.minAmount) {
      const min = Number(this.filters.minAmount);
      if (!isNaN(min) && min > 0) {
        result = result.filter(s => s.total >= min);
      }
    }

    this.filteredSales = result;
    this.currentPage = 1;
  }

  onFilterChange(): void {
    this.applyFilters();
    this.cdr.detectChanges();
  }

  onClientInput(): void {
    const search = this.filters.client.toLowerCase();
    this.filteredClientSuggestions = this.clientSuggestions.filter(name => 
      name.toLowerCase().includes(search)
    );
    this.showClientAutocomplete = this.filters.client.length > 0 && this.filteredClientSuggestions.length > 0;
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

  selectClient(name: string): void {
    this.filters.client = name;
    this.showClientAutocomplete = false;
    this.onFilterChange();
  }

  selectArticle(name: string): void {
    this.filters.article = name;
    this.showArticleAutocomplete = false;
    this.onFilterChange();
  }

  clearFilters(): void {
    this.filters = {
      client: '',
      article: '',
      dateFrom: '',
      dateTo: '',
      minAmount: ''
    };
    this.showClientAutocomplete = false;
    this.showArticleAutocomplete = false;
    this.applyFilters();
  }

  // Pagination
  get paginatedSales(): Sale[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredSales.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredSales.length / this.itemsPerPage);
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
