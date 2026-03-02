import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Box, BoxService } from '../../services/box.service';
import { Boutique, BoutiquesService } from '../../services/boutiques.service';
import { BoutiqueDashboardStats, SalesService } from '../../services/sales.service';

@Component({
  selector: 'app-boutique-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './boutique-dashboard.html',
  styleUrl: './boutique-dashboard.css',
})
export class BoutiqueDashboardComponent implements OnInit {
  boutiques: Boutique[] = [];
  selectedBoutiqueId: string | null = null;

  profileName = '';
  profileCategory: string | null = null;

  newBoutiqueName = '';
  newBoutiqueCategory: string | null = null;
  creatingBoutique = false;

  categories = ['Informatique', 'Restaurant', 'Electronique', 'Mode', 'Sport', 'Beauté'];

  boxes: Box[] = [];
  loading = false;
  loadingStats = false;
  savingProfile = false;
  requestingBoxId: string | null = null;
  error = '';
  info = '';

  dashboardMonths = 6;
  dashboard: BoutiqueDashboardStats | null = null;
  dashboardBoutiqueId: string | null = null;

  // KPI Abonnements
  get totalSubscriptions(): number {
    return (this.boxes || []).filter(b => !!b.boutique).length;
  }

  get totalPaidThisMonth(): number {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
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

  private platformId = inject(PLATFORM_ID);

  constructor(
    private boutiquesService: BoutiquesService,
    private boxService: BoxService,
    private salesService: SalesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.loadBoutiques();
    this.loadBoxes();
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loadingStats = true;
    this.salesService.getBoutiqueDashboardFor(this.dashboardBoutiqueId, this.dashboardMonths).subscribe({
      next: (data) => {
        this.dashboard = data || null;
        this.loadingStats = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.loadingStats = false;
        this.cdr.detectChanges();
      }
    });
  }

  onDashboardMonthsChange(): void {
    this.loadDashboard();
  }

  onDashboardBoutiqueChange(): void {
    this.loadDashboard();
  }

  get hasDashboardData(): boolean {
    return !!(this.dashboard && (this.dashboard.series?.length || this.dashboard.topProducts?.length));
  }

  get totalRevenue(): number {
    return Number(this.dashboard?.kpis?.totalRevenue) || 0;
  }

  get totalOrders(): number {
    return Number(this.dashboard?.kpis?.totalOrders) || 0;
  }

  get totalItemsSold(): number {
    return Number(this.dashboard?.kpis?.totalItems) || 0;
  }

  get avgOrderValue(): number {
    const orders = this.totalOrders;
    return orders > 0 ? this.totalRevenue / orders : 0;
  }

  get revenueMax(): number {
    return Math.max(0, ...((this.dashboard?.series || []).map((p) => Number(p.revenue) || 0)));
  }

  revenueBarWidthPct(revenue: number): number {
    const max = this.revenueMax;
    if (max <= 0) return 0;
    return Math.round(((Number(revenue) || 0) / max) * 100);
  }

  get revenueLinePoints(): string {
    const series = this.dashboard?.series || [];
    if (series.length === 0) return '';

    const w = 640;
    const h = 180;
    const pad = 18;
    const innerW = w - pad * 2;
    const innerH = h - pad * 2;

    const max = Math.max(1, ...series.map((p) => Number(p.revenue) || 0));
    const n = series.length;

    const pts = series.map((p, i) => {
      const x = pad + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
      const y = pad + (1 - (Number(p.revenue) || 0) / max) * innerH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return pts.join(' ');
  }

  get revenueLineAreaPath(): string {
    const pts = this.revenueLinePoints;
    if (!pts) return '';
    const w = 640;
    const h = 180;
    const pad = 18;
    const baseY = h - pad;

    const first = pts.split(' ')[0];
    const last = pts.split(' ').at(-1);
    if (!first || !last) return '';

    const [fx] = first.split(',');
    const [lx] = last.split(',');
    return `M ${fx} ${baseY} L ${pts.replaceAll(',', ' ')} L ${lx} ${baseY} Z`;
  }

  loadBoutiques(): void {
    this.error = '';

    this.boutiquesService.listMine().subscribe({
      next: (boutiques) => {
        this.boutiques = boutiques || [];

        if (!this.selectedBoutiqueId && this.boutiques.length > 0) {
          this.selectedBoutiqueId = this.boutiques[0]._id;
        }

        this.syncProfileWithSelected();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error?.error || 'Erreur lors du chargement des boutiques';
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }

  onSelectedBoutiqueChange(): void {
    this.syncProfileWithSelected();
  }

  private syncProfileWithSelected(): void {
    const b = this.selectedBoutique;
    this.profileName = b?.name || '';
    this.profileCategory = b?.category ?? null;
  }

  get selectedBoutique(): Boutique | null {
    if (!this.selectedBoutiqueId) return null;
    return this.boutiques.find((b) => b._id === this.selectedBoutiqueId) || null;
  }

  saveProfile(): void {
    if (!this.selectedBoutiqueId) {
      this.error = 'Sélectionne une boutique';
      return;
    }

    this.savingProfile = true;
    this.error = '';
    this.info = '';

    this.boutiquesService
      .updateMineById(this.selectedBoutiqueId, { name: this.profileName, category: this.profileCategory })
      .subscribe({
        next: (boutique) => {
          this.boutiques = this.boutiques.map((b) => (b._id === boutique._id ? boutique : b));
          this.info = 'Profil mis à jour';
          this.savingProfile = false;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          this.error = err?.error?.message || err?.error?.error || 'Erreur lors de la mise à jour du profil';
          console.error(err);
          this.savingProfile = false;
          this.cdr.detectChanges();
        }
      });
  }

  createBoutique(): void {
    if (typeof this.newBoutiqueName !== 'string' || !this.newBoutiqueName.trim()) {
      this.error = 'Le nom de la boutique est requis';
      return;
    }

    this.creatingBoutique = true;
    this.error = '';
    this.info = '';

    this.boutiquesService
      .create({ name: this.newBoutiqueName.trim(), category: this.newBoutiqueCategory })
      .subscribe({
        next: (boutique) => {
          this.boutiques = [boutique, ...this.boutiques];
          this.selectedBoutiqueId = boutique._id;
          this.newBoutiqueName = '';
          this.newBoutiqueCategory = null;
          this.creatingBoutique = false;
          this.syncProfileWithSelected();
          this.info = 'Boutique créée';
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          this.error = err?.error?.message || err?.error?.error || 'Erreur lors de la création de la boutique';
          console.error(err);
          this.creatingBoutique = false;
          this.cdr.detectChanges();
        }
      });
  }

  loadBoxes(): void {
    this.loading = true;
    this.error = '';
    this.info = '';

    this.boxService.getBoxesForRequest().subscribe({
      next: (boxes) => {
        this.boxes = boxes;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error?.error || 'Erreur lors du chargement des box';
        console.error(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  get availableBoxes(): Box[] {
    return (this.boxes || []).filter((b) => (b.status || (b.boutique ? 'prise' : 'non prise')) === 'non prise');
  }

  requestBox(box: Box): void {
    if (!box._id) return;
    if (!this.selectedBoutiqueId) {
      this.error = 'Sélectionne une boutique avant de demander une box';
      return;
    }

    if (this.hasPendingRequestForSelectedBoutique(box)) {
      this.error = 'Demande déjà en cours pour cette box';
      return;
    }

    this.requestingBoxId = box._id;
    this.error = '';
    this.info = '';

    this.boxService.requestBox(box._id, this.selectedBoutiqueId).subscribe({
      next: () => {
        this.info = 'Demande envoyée. Attente de validation admin.';
        this.requestingBoxId = null;
        this.loadBoxes();
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error?.error || 'Erreur lors de la demande';
        console.error(err);
        this.requestingBoxId = null;
        this.cdr.detectChanges();
      }
    });
  }

  isRequesting(boxId: string | undefined): boolean {
    return !!boxId && boxId === this.requestingBoxId;
  }

  hasPendingRequestForSelectedBoutique(box: Box): boolean {
    if (!this.selectedBoutiqueId) return false;
    const requests = Array.isArray(box.requests) ? box.requests : [];
    return requests.some(
      (r) => String(r.boutique) === String(this.selectedBoutiqueId) && r.status === 'pending'
    );
  }

  isButtonDisabled(box: Box): boolean {
    const boxStatus = box.status || (box.boutique ? 'prise' : 'non prise');
    // Si le statut de la box est "non prise", on peut toujours demander
    if (boxStatus === 'non prise') {
      return (
        this.isRequesting(box._id) ||
        this.hasPendingRequestForSelectedBoutique(box) ||
        !this.selectedBoutiqueId
      );
    }
    // Pour les autres statuts, on désactive
    return true;
  }

  isBoxCancelled(box: Box): boolean {
    if (!box?.rentCancelAt) return false;
    const d = new Date(box.rentCancelAt);
    if (Number.isNaN(d.getTime())) return false;
    return d.getTime() > Date.now();
  }

  getCancelAvailableDate(box: Box): string {
    if (!box?.rentCancelAt) return '-';
    const d = new Date(box.rentCancelAt);
    if (Number.isNaN(d.getTime())) return String(box.rentCancelAt);
    return d.toLocaleDateString();
  }
}
