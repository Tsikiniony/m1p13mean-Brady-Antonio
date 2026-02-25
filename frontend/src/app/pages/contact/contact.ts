import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contact.html',
  styleUrl: './contact.css'
})
export class ContactComponent implements AfterViewInit, OnDestroy {
  private observer?: IntersectionObserver;
  private map?: any;

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;

    this.initMap();

    const elements = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));

    if (!('IntersectionObserver' in window)) {
      elements.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            el.classList.add('is-visible');
          } else {
            el.classList.remove('is-visible');
          }
        }
      },
      {
        threshold: 0.15
      }
    );

    elements.forEach((el) => this.observer?.observe(el));
  }

  private initMap(): void {
    const container = document.getElementById('contact-map');
    if (!container) return;
    if (this.map) return;

    import('leaflet').then((L) => {
      const leaflet: any = (L as any).default ?? L;

      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
      });

      const antananarivo: [number, number] = [-18.8792, 47.5079];

      this.map = leaflet.map(container, {
        zoomControl: true,
        scrollWheelZoom: false,
        dragging: true
      }).setView(antananarivo, 13);

      leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(this.map);

      leaflet.marker(antananarivo).addTo(this.map);

      setTimeout(() => {
        try {
          this.map?.invalidateSize();
        } catch {
          // ignore
        }
      }, 0);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    try {
      this.map?.remove();
    } catch {
      // ignore
    }
  }
}
