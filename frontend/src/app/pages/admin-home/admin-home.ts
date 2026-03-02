import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Box, BoxService } from '../../services/box.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

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

  topBoutiquesRevenue: Array<{ boutiqueId: string; name?: string; category?: string | null; revenue: number; salesCount: number }> = [];

  private platformId = inject(PLATFORM_ID);

  constructor(private boxService: BoxService, private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.loadStats();
    this.loadTopBoutiquesRevenue();
  }

  private getAuthHeaders(): HttpHeaders {
    let token: string | null = null;
    if (isPlatformBrowser(this.platformId)) {
      token = localStorage.getItem('token');
    }
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    return headers;
  }

  loadTopBoutiquesRevenue(): void {
    this.http
      .get<
        Array<{ boutiqueId: string; name?: string; category?: string | null; revenue: number; salesCount: number }>
      >(`${environment.apiBaseUrl}/api/users/stats/top-boutiques-revenue?limit=5`, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (rows) => {
          this.topBoutiquesRevenue = rows || [];
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          // Ne pas bloquer le dashboard si stats indisponibles
        }
      });
  }

  get topRevenueMax(): number {
    return Math.max(0, ...(this.topBoutiquesRevenue || []).map((r) => Number(r.revenue) || 0));
  }

  barWidthPct(revenue: number): number {
    const max = this.topRevenueMax;
    if (max <= 0) return 0;
    return Math.round(((Number(revenue) || 0) / max) * 100);
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
