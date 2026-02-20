import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Box, BoxService } from '../../services/box.service';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-home.html',
  styleUrl: './admin-home.css'
})
export class AdminHomeComponent implements OnInit {
  loading = false;
  error = '';

  totalBoxes = 0;
  takenBoxes = 0;

  boxes: Box[] = [];

  private platformId = inject(PLATFORM_ID);

  constructor(private boxService: BoxService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.error = '';
    this.boxService.getAllBoxes().subscribe({
      next: (boxes) => {
        this.boxes = boxes || [];
        this.totalBoxes = this.boxes.length;
        this.takenBoxes = this.boxes.filter(b => !!b.boutique).length;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err?.error?.message || err?.error?.error || 'Erreur chargement stats';
        this.loading = false;
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }

  // KPI Abonnements
  get totalSubscriptions(): number {
    return (this.boxes || []).filter(b => !!b.boutique).length;
  }

  get totalPaidThisMonth(): number {
    const now = new Date();
    return (this.boxes || [])
      .filter(b => !!b.boutique && b.rentExpiresAt)
      .filter(b => {
        const exp = new Date(b.rentExpiresAt!);
        // On considère comme payé ce mois si l'expiration est dans le mois prochain
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);
        return exp >= nextMonth && exp <= endOfNextMonth;
      })
      .reduce((sum, b) => sum + (Number(b.rent) || 0), 0);
  }

  get totalUnpaidThisMonth(): number {
    const now = new Date();
    // On considère comme non payé ce mois si l'expiration est ce mois-ci ou antérieure
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return (this.boxes || [])
      .filter(b => !!b.boutique && b.rentExpiresAt)
      .filter(b => {
        const exp = new Date(b.rentExpiresAt!);
        return exp <= endOfCurrentMonth;
      })
      .reduce((sum, b) => sum + (Number(b.rent) || 0), 0);
  }

  // Pie chart helpers
  get chartData(): { paid: number; unpaid: number; total: number } {
    const paid = this.totalPaidThisMonth;
    const unpaid = this.totalUnpaidThisMonth;
    const total = paid + unpaid;
    return { paid, unpaid, total };
  }

  get paidPercentage(): number {
    const { paid, total } = this.chartData;
    return total > 0 ? Math.round((paid / total) * 100) : 0;
  }

  get unpaidPercentage(): number {
    const { unpaid, total } = this.chartData;
    return total > 0 ? Math.round((unpaid / total) * 100) : 0;
  }
}
