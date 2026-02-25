import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PurchaseBoutique {
  _id: string;
  name: string;
  category?: string | null;
}

export interface PurchaseItem {
  article: string;
  articleId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
}

export interface Purchase {
  _id: string;
  client: string;
  boutique: string | PurchaseBoutique;
  items: PurchaseItem[];
  total: number;
  createdAt: string;
  updatedAt: string;
}

export type CheckoutPayload = {
  items: Array<{ articleId: string; quantity: number }>;
};

@Injectable({
  providedIn: 'root'
})
export class PurchasesService {
  private API_URL = 'http://localhost:5000/api/purchases';
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

  checkout(payload: CheckoutPayload): Observable<{ purchases: Purchase[] }> {
    return this.http.post<{ purchases: Purchase[] }>(`${this.API_URL}/checkout`, payload, {
      headers: this.getHeaders()
    });
  }

  listMine(): Observable<Purchase[]> {
    return this.http.get<Purchase[]>(`${this.API_URL}/mine`, { headers: this.getHeaders() });
  }

  getMineById(id: string): Observable<Purchase> {
    return this.http.get<Purchase>(`${this.API_URL}/mine/${id}`, { headers: this.getHeaders() });
  }
}
