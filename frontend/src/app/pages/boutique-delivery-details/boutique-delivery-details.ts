import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BoutiqueDeliveriesService, Delivery } from '../../services/boutique-deliveries.service';

declare const window: any;

@Component({
  selector: 'app-boutique-delivery-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './boutique-delivery-details.html',
  styleUrl: './boutique-delivery-details.css'
})
export class BoutiqueDeliveryDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
  loading = false;
  error = '';
  delivery: Delivery | null = null;

  private platformId = inject(PLATFORM_ID);
  private map: any = null;
  private marker: any = null;
  private leaflet: any = null;

  constructor(
    private route: ActivatedRoute,
    private api: BoutiqueDeliveriesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID livraison manquant';
      return;
    }

    this.loading = true;
    this.api.getMineById(id).subscribe({
      next: (d) => {
        this.delivery = d;
        this.loading = false;
        this.cdr.detectChanges();
        this.tryInitMap();
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error?.error || 'Erreur chargement livraison';
        this.loading = false;
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.tryInitMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private async tryInitMap(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    if (!this.delivery) return;
    if (this.map) return;

    const lat = Number((this.delivery as any)?.location?.lat);
    const lng = Number((this.delivery as any)?.location?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    if (!this.leaflet) {
      const mod: any = await import('leaflet');
      this.leaflet = mod?.default || mod;
    }

    const L = this.leaflet;

    this.map = (L as any).map('boutiqueDeliveryMap', { zoomControl: true, dragging: true }).setView([lat, lng], 15);
    (L as any).tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(this.map);

    this.marker = (L as any).marker([lat, lng]).addTo(this.map);
    this.cdr.detectChanges();
  }

  getBoutiqueName(): string {
    const b: any = this.delivery?.boutique;
    return typeof b === 'string' ? '' : (b?.name || '');
  }

  getClientName(): string {
    const c: any = this.delivery?.client;
    return typeof c === 'string' ? '' : (c?.name || '');
  }

  getClientEmail(): string {
    const c: any = this.delivery?.client;
    return typeof c === 'string' ? '' : (c?.email || '');
  }

  getItems(): any[] {
    const p: any = this.delivery?.purchase;
    return typeof p === 'string' ? [] : (p?.items || []);
  }

  getTotal(): number {
    const p: any = this.delivery?.purchase;
    return typeof p === 'string' ? 0 : Number(p?.total) || 0;
  }

  getPurchaseDate(): any {
    const p: any = this.delivery?.purchase;
    return typeof p === 'string' ? null : (p?.createdAt || null);
  }
}
