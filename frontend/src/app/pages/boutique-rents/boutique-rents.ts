import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Box, BoxService } from '../../services/box.service';

@Component({
  selector: 'app-boutique-rents',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './boutique-rents.html',
  styleUrl: './boutique-rents.css'
})
export class BoutiqueRentsComponent implements OnInit {
  loading = false;
  error = '';
  boxes: Box[] = [];

  filter: 'all' | 'active' | 'expired' = 'all';

  private platformId = inject(PLATFORM_ID);

  constructor(private boxService: BoxService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';

    this.boxService.getMyRents().subscribe({
      next: (boxes) => {
        this.boxes = boxes || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err?.error?.message || err?.error?.error || 'Erreur chargement loyers';
        console.error(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  isExpired(box: Box): boolean {
    if (!box?.rentExpiresAt) return true;
    const d = new Date(box.rentExpiresAt);
    if (Number.isNaN(d.getTime())) return true;
    return d.getTime() < Date.now();
  }

  getExpiresLabel(box: Box): string {
    const v = box?.rentExpiresAt;
    if (!v) return '-';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleDateString();
  }

  get filteredBoxes(): Box[] {
    const arr = this.boxes || [];
    if (this.filter === 'all') return arr;
    if (this.filter === 'active') return arr.filter((b) => !this.isExpired(b));
    return arr.filter((b) => this.isExpired(b));
  }

  getBoxTitle(box: Box): string {
    return box.name || (typeof box.number === 'number' ? `B${box.number}` : 'Box');
  }
}
