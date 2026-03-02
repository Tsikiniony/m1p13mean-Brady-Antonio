import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type CreateDeliveryPayload = {
  purchaseIds: string[];
  mobile: string;
  lat: number;
  lng: number;
};

@Injectable({
  providedIn: 'root'
})
export class DeliveriesService {
  private API_URL = `${environment.apiBaseUrl}/api/deliveries`;
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

  createMine(payload: CreateDeliveryPayload): Observable<any> {
    return this.http.post(`${this.API_URL}/mine`, payload, { headers: this.getHeaders() });
  }
}
