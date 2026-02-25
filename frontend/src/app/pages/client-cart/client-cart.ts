import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CartItem, CartService } from '../../services/cart.service';

@Component({
  selector: 'app-client-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './client-cart.html',
  styleUrl: './client-cart.css'
})
export class ClientCartComponent implements OnInit {
  items: CartItem[] = [];
  checkingOut = false;
  error = '';
  success = '';
  private platformId = inject(PLATFORM_ID);

  constructor(
    private cart: CartService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.refresh();

    window.addEventListener('storage', this.onStorage);
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    window.removeEventListener('storage', this.onStorage);
  }

  private onStorage = (e: StorageEvent) => {
    if (e.key === 'cart') {
      this.refresh();
      this.cdr.detectChanges();
    }
  };

  refresh(): void {
    this.items = this.cart.getItems();
  }

  checkout(): void {
    if (this.items.length === 0) return;
    this.router.navigate(['/client/delivery']);
  }

  inc(i: CartItem): void {
    this.cart.updateQuantity(i.articleId, i.quantity + 1);
    this.refresh();
  }

  dec(i: CartItem): void {
    this.cart.updateQuantity(i.articleId, i.quantity - 1);
    this.refresh();
  }

  remove(i: CartItem): void {
    this.cart.removeItem(i.articleId);
    this.refresh();
  }

  clear(): void {
    this.cart.clear();
    this.refresh();
  }

  getTotal(): number {
    return this.cart.getTotal();
  }

  trackById(_: number, i: CartItem): string {
    return i.articleId;
  }
}
