import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type CartItem = {
  articleId: string;
  name: string;
  price: number;
  image?: string | null;
  quantity: number;
};

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private platformId = inject(PLATFORM_ID);
  private storageKey = 'cart';

  private canUseStorage(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  getItems(): CartItem[] {
    if (!this.canUseStorage()) return [];

    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((x) => x && typeof x.articleId === 'string')
        .map((x) => ({
          articleId: String(x.articleId),
          name: String(x.name || ''),
          price: Number(x.price) || 0,
          image: typeof x.image === 'string' ? x.image : (x.image ?? null),
          quantity: Math.max(1, Number(x.quantity) || 1)
        }));
    } catch {
      return [];
    }
  }

  private setItems(items: CartItem[]): void {
    if (!this.canUseStorage()) return;
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  addItem(input: Omit<CartItem, 'quantity'>, quantity = 1): void {
    const q = Number(quantity);
    if (!Number.isFinite(q) || q <= 0) return;

    const items = this.getItems();
    const idx = items.findIndex((i) => i.articleId === input.articleId);

    if (idx >= 0) {
      items[idx] = {
        ...items[idx],
        quantity: items[idx].quantity + q
      };
    } else {
      items.push({
        ...input,
        quantity: q
      });
    }

    this.setItems(items);
  }

  updateQuantity(articleId: string, quantity: number): void {
    const q = Math.floor(Number(quantity));
    if (!Number.isFinite(q)) return;

    const items = this.getItems();
    const idx = items.findIndex((i) => i.articleId === articleId);
    if (idx < 0) return;

    if (q <= 0) {
      items.splice(idx, 1);
      this.setItems(items);
      return;
    }

    items[idx] = { ...items[idx], quantity: q };
    this.setItems(items);
  }

  removeItem(articleId: string): void {
    const items = this.getItems().filter((i) => i.articleId !== articleId);
    this.setItems(items);
  }

  getCount(): number {
    return this.getItems().reduce((acc, i) => acc + (i.quantity || 0), 0);
  }

  getTotal(): number {
    return this.getItems().reduce((acc, i) => acc + (Number(i.price) || 0) * (i.quantity || 0), 0);
  }

  clear(): void {
    this.setItems([]);
  }
}
