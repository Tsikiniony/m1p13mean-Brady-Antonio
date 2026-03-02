import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SaleClient {
  _id: string;
  name?: string;
  email?: string;
}

export interface SaleBoutique {
  _id: string;
  name: string;
  category?: string | null;
}

export interface SaleItem {
  article: string;
  articleId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
}

export interface Sale {
  _id: string;
  client: string | SaleClient;
  boutique: string | SaleBoutique;
  items: SaleItem[];
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardTopProduct {
  articleId: string;
  name: string;
  image?: string | null;
  quantity: number;
  revenue: number;
}

export interface DashboardRevenuePoint {
  ym: string;
  label: string;
  revenue: number;
  orders: number;
}

export interface BoutiqueDashboardStats {
  months: number;
  series: DashboardRevenuePoint[];
  topProducts: DashboardTopProduct[];
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    totalItems: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private API_URL = `${environment.apiBaseUrl}/api/boutiques`;
  private platformId = inject(PLATFORM_ID);

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    let token: string | null = null;
    if (isPlatformBrowser(this.platformId)) {
      token = localStorage.getItem('token');
    }

    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  listMineSalesForBoutique(boutiqueId: string): Observable<Sale[]> {
    return this.http.get<Sale[]>(`${this.API_URL}/${boutiqueId}/sales`, { headers: this.getHeaders() });
  }

  listMineSales(): Observable<Sale[]> {
    return this.http.get<Sale[]>(`${this.API_URL}/sales/mine`, { headers: this.getHeaders() });
  }

  getBoutiqueDashboard(months = 6): Observable<BoutiqueDashboardStats> {
    return this.http.get<BoutiqueDashboardStats>(`${this.API_URL}/dashboard?months=${months}`, {
      headers: this.getHeaders()
    });
  }

  getBoutiqueDashboardFor(boutiqueId: string | null, months = 6): Observable<BoutiqueDashboardStats> {
    const q = new URLSearchParams();
    q.set('months', String(months));
    if (boutiqueId) q.set('boutiqueId', boutiqueId);
    return this.http.get<BoutiqueDashboardStats>(`${this.API_URL}/dashboard?${q.toString()}`, {
      headers: this.getHeaders()
    });
  }
}
