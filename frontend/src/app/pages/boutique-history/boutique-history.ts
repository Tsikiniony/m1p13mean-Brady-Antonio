import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PendingBoxRequest, BoxService } from '../../services/box.service';

@Component({
  selector: 'app-boutique-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './boutique-history.html',
  styleUrl: './boutique-history.css'
})
export class BoutiqueHistoryComponent implements OnInit {
  history: PendingBoxRequest[] = [];
  loading = false;
  error = '';

  filter: 'all' | 'approved' | 'rejected' = 'all';

  private platformId = inject(PLATFORM_ID);

  constructor(
    private boxService: BoxService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading = true;
    this.error = '';

    this.boxService.getMyRequestsHistory().subscribe({
      next: (data) => {
        this.history = data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err?.error?.message || err?.error?.error || 'Erreur chargement historique';
        this.loading = false;
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }

  get filteredHistory(): PendingBoxRequest[] {
    if (this.filter === 'all') return this.history;
    return this.history.filter((h) => h.status === this.filter);
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'approved': return 'Validé';
      case 'rejected': return 'Refusé';
      default: return status;
    }
  }

  statusClass(status: string): string {
    switch (status) {
      case 'approved': return 'approved';
      case 'rejected': return 'rejected';
      default: return '';
    }
  }

  formatDate(dateStr?: string | null): string {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString();
  }
}
