import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

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

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private API_URL = 'http://localhost:5000/api/boutiques';
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
}
