import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { PurchasesService } from '../../services/purchases.service';
import { DeliveriesService } from '../../services/deliveries.service';

@Component({
  selector: 'app-client-delivery',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './client-delivery.html',
  styleUrl: './client-delivery.css'
})
export class ClientDeliveryComponent implements OnInit, AfterViewInit, OnDestroy {
  mobile = '';
  lat: number | null = null;
  lng: number | null = null;

  loading = false;
  error = '';
  toastOpen = false;
  toastMessage = '';
  toastKind: 'success' | 'error' = 'success';
  private toastTimer: any = null;
  private toastSeq = 0;

  private platformId = inject(PLATFORM_ID);
  private map: any = null;
  private marker: any = null;
  private leaflet: any = null;

  constructor(
    private cart: CartService,
    private purchases: PurchasesService,
    private deliveries: DeliveriesService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.cart.getItems().length === 0) {
      this.router.navigate(['/client/cart']);
    }
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initLeaflet();
  }

  ngOnDestroy(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private async initLeaflet(): Promise<void> {
    const defaultLat = -18.8792;
    const defaultLng = 47.5079;

    if (!this.leaflet) {
      const mod: any = await import('leaflet');
      this.leaflet = mod?.default || mod;
    }

    const L = this.leaflet;

    this.map = (L as any).map('deliveryMap').setView([defaultLat, defaultLng], 13);
    (L as any).tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(this.map);

    this.map.on('click', (e: any) => {
      const p = e?.latlng;
      if (!p) return;
      this.setPoint(p.lat, p.lng);
    });

    this.cdr.detectChanges();
  }

  private setPoint(lat: number, lng: number): void {
    if (!this.leaflet) return;
    const L = this.leaflet;

    this.lat = Number(lat);
    this.lng = Number(lng);

    if (this.marker) {
      this.marker.setLatLng([this.lat, this.lng]);
    } else {
      this.marker = (L as any).marker([this.lat, this.lng]).addTo(this.map);
    }

    this.cdr.detectChanges();
  }

  submit(): void {
    if (this.loading) return;

    const items = this.cart.getItems();
    if (items.length === 0) {
      this.showToast('Panier vide', 'error');
      return;
    }

    if (!this.mobile.trim()) {
      this.showToast('Numéro mobile requis', 'error');
      return;
    }

    if (this.lat === null || this.lng === null) {
      this.showToast('Choisis ton lieu de livraison sur la carte', 'error');
      return;
    }

    this.loading = true;
    this.error = '';

    const payload = {
      items: items.map((i) => ({ articleId: i.articleId, quantity: i.quantity }))
    };

    this.purchases.checkout(payload).subscribe({
      next: (res) => {
        const purchaseIds = (res?.purchases || []).map((p: any) => String(p._id));

        this.deliveries
          .createMine({
            purchaseIds,
            mobile: this.mobile.trim(),
            lat: this.lat as number,
            lng: this.lng as number
          })
          .subscribe({
            next: () => {
              this.cart.clear();
              this.loading = false;
              this.showToast('Commande validée. Merci !', 'success');
              setTimeout(() => {
                this.router.navigate(['/client/purchases']);
              }, 800);
            },
            error: (err: any) => {
              this.loading = false;
              const msg = err?.error?.message || err?.error?.error || 'Erreur enregistrement livraison';
              this.showToast(msg, 'error');
            }
          });
      },
      error: (err: any) => {
        this.loading = false;
        const msg = err?.error?.message || err?.error?.error || 'Erreur lors de la validation du panier';
        this.showToast(msg, 'error');
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

    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      if (seq !== this.toastSeq) return;
      this.toastOpen = false;
      this.cdr.detectChanges();
    }, 2200);

    this.cdr.detectChanges();
  }
}
