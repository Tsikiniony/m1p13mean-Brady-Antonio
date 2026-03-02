import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PublicArticlesService, PublicArticle, PublicBoutique } from '../../services/public-articles.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-client-products',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './client-products.html',
  styleUrl: './client-products.css'
})
export class ClientProductsComponent implements OnInit {
  loading = false;
  error = '';
  articles: PublicArticle[] = [];
  cartCount = 0;

  nameQuery = '';
  boutiqueQuery = '';
  selectedCategory = '';
  nameAutocompleteOpen = false;
  boutiqueAutocompleteOpen = false;

  toastOpen = false;
  toastMessage = '';
  toastKind: 'success' | 'error' = 'success';
  private toastTimer: any = null;
  private toastSeq = 0;
  private addToCartBusy = new Set<string>();

  private platformId = inject(PLATFORM_ID);

  constructor(
    private publicArticles: PublicArticlesService,
    private cdr: ChangeDetectorRef,
    private cart: CartService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.loading = false;
      return;
    }
    this.refreshCartCount();
    this.fetch();
  }

  get categories(): string[] {
    const cats = new Set<string>();
    for (const a of this.articles || []) {
      const c = (this.getBoutiqueCategory(a) || '').trim();
      if (c) cats.add(c);
    }
    return Array.from(cats).sort((a, b) => a.localeCompare(b));
  }

  get filteredArticles(): PublicArticle[] {
    const q = (this.nameQuery || '').trim().toLowerCase();
    const bq = (this.boutiqueQuery || '').trim().toLowerCase();
    const cat = (this.selectedCategory || '').trim().toLowerCase();

    return (this.articles || []).filter((a) => {
      const nameOk = !q || (a?.name || '').toLowerCase().includes(q);
      if (!nameOk) return false;

      const bName = (this.getBoutiqueName(a) || '').trim().toLowerCase();
      const boutiqueOk = !bq || bName.includes(bq);
      if (!boutiqueOk) return false;

      const aCat = (this.getBoutiqueCategory(a) || '').trim().toLowerCase();
      const catOk = !cat || aCat === cat;
      return catOk;
    });
  }

  get nameSuggestions(): string[] {
    const q = (this.nameQuery || '').trim().toLowerCase();
    if (!q) return [];
    const out: string[] = [];
    const seen = new Set<string>();
    for (const a of this.articles || []) {
      const n = (a?.name || '').trim();
      if (!n) continue;
      const nl = n.toLowerCase();
      if (!nl.includes(q)) continue;
      if (seen.has(nl)) continue;
      seen.add(nl);
      out.push(n);
      if (out.length >= 8) break;
    }
    return out;
  }

  onNameInput(): void {
    this.nameAutocompleteOpen = true;
  }

  onNameFocus(): void {
    this.nameAutocompleteOpen = true;
  }

  onNameBlur(): void {
    setTimeout(() => {
      this.nameAutocompleteOpen = false;
      this.cdr.detectChanges();
    }, 120);
  }

  selectSuggestion(name: string): void {
    this.nameQuery = name;
    this.nameAutocompleteOpen = false;
  }

  get boutiqueSuggestions(): string[] {
    const q = (this.boutiqueQuery || '').trim().toLowerCase();
    if (!q) return [];
    const out: string[] = [];
    const seen = new Set<string>();
    for (const a of this.articles || []) {
      const n = (this.getBoutiqueName(a) || '').trim();
      if (!n) continue;
      const nl = n.toLowerCase();
      if (!nl.includes(q)) continue;
      if (seen.has(nl)) continue;
      seen.add(nl);
      out.push(n);
      if (out.length >= 8) break;
    }
    return out;
  }

  onBoutiqueInput(): void {
    this.boutiqueAutocompleteOpen = true;
  }

  onBoutiqueFocus(): void {
    this.boutiqueAutocompleteOpen = true;
  }

  onBoutiqueBlur(): void {
    setTimeout(() => {
      this.boutiqueAutocompleteOpen = false;
      this.cdr.detectChanges();
    }, 120);
  }

  selectBoutiqueSuggestion(name: string): void {
    this.boutiqueQuery = name;
    this.boutiqueAutocompleteOpen = false;
  }

  clearFilters(): void {
    this.nameQuery = '';
    this.boutiqueQuery = '';
    this.selectedCategory = '';
    this.nameAutocompleteOpen = false;
    this.boutiqueAutocompleteOpen = false;
  }

  refreshCartCount(): void {
    this.cartCount = this.cart.getCount();
  }

  fetch(): void {
    this.loading = true;
    this.error = '';

    this.publicArticles.listAll().subscribe({
      next: (items) => {
        this.articles = items || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error?.error || 'Erreur lors du chargement des produits';
        this.loading = false;
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }

  trackById(_: number, a: PublicArticle): string {
    return a._id;
  }

  getBoutiqueName(a: PublicArticle): string {
    const b = a.boutique as any;
    return typeof b === 'string' ? '' : (b?.name || '');
  }

  getBoutiqueCategory(a: PublicArticle): string {
    const b = a.boutique as any;
    return typeof b === 'string' ? '' : (b?.category || '');
  }

  getImage(a: PublicArticle): string {
    return a.image || 'https://via.placeholder.com/800x600?text=Produit';
  }

  addToCart(a: PublicArticle, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.addToCartBusy.has(a._id)) return;
    this.addToCartBusy.add(a._id);

    const user = this.auth.getUser();
    if (!user || user.role !== 'client' || !this.auth.getToken()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/client/products' }
      });
      return;
    }

    const currentInCart = this.cart.getItems().find((i) => i.articleId === a._id)?.quantity || 0;
    const wanted = currentInCart + 1;

    this.publicArticles.getStock(a._id).subscribe({
      next: (s) => {
        const available = Number(s?.quantity) || 0;
        if (available <= 0 || wanted > available) {
          this.showToast(`Stock insuffisant (disponible: ${available}).`, 'error');
          this.addToCartBusy.delete(a._id);
          return;
        }

        this.cart.addItem({
          articleId: a._id,
          name: a.name,
          price: a.price,
          image: a.image || null
        });
        this.refreshCartCount();
        this.showToast('Ajouté au panier', 'success');
        this.addToCartBusy.delete(a._id);
      },
      error: () => {
        this.showToast('Impossible de vérifier le stock.', 'error');
        this.addToCartBusy.delete(a._id);
      }
    });
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

    this.toastOpen = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      if (seq !== this.toastSeq) return;
      this.toastOpen = false;
      this.cdr.detectChanges();
    }, 1800);
    this.cdr.detectChanges();
  }
}
