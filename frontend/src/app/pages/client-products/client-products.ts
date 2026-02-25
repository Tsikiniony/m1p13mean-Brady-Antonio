import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PublicArticlesService, PublicArticle, PublicBoutique } from '../../services/public-articles.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-client-products',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './client-products.html',
  styleUrl: './client-products.css'
})
export class ClientProductsComponent implements OnInit {
  loading = false;
  error = '';
  articles: PublicArticle[] = [];
  cartCount = 0;

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
