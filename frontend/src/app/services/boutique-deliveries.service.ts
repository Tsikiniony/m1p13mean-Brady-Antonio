import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type DeliveryLocation = { lat: number; lng: number };

export interface DeliveryBoutique {
  _id: string;
  name: string;
  category?: string | null;
}

export interface DeliveryClient {
  _id: string;
  name: string;
  email: string;
}

export interface DeliveryPurchaseItem {
  article: any;
  articleId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
}

export interface DeliveryPurchase {
  _id: string;
  items: DeliveryPurchaseItem[];
  total: number;
  createdAt: string;
}

export interface Delivery {
  _id: string;
  client: string | DeliveryClient;
  boutique: string | DeliveryBoutique;
  purchase: string | DeliveryPurchase;
  mobile: string;
  location: DeliveryLocation;
  status: 'en_attente' | 'en_cours' | 'livre';
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class BoutiqueDeliveriesService {
  private API_URL = `${environment.apiBaseUrl}/api/boutique-deliveries`;
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

  listMine(): Observable<Delivery[]> {
    return this.http.get<Delivery[]>(`${this.API_URL}/mine`, { headers: this.getHeaders() });
  }

  getMineById(id: string): Observable<Delivery> {
    return this.http.get<Delivery>(`${this.API_URL}/mine/${id}`, { headers: this.getHeaders() });
  }

  advanceStatusMine(id: string): Observable<{ status: Delivery['status'] }> {
    return this.http.patch<{ status: Delivery['status'] }>(`${this.API_URL}/mine/${id}/status`, {}, { headers: this.getHeaders() });
  }
}
