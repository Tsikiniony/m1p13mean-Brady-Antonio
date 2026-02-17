import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BoutiqueMe {
  _id: string;
  name: string;
  email: string;
  role: string;
  category?: string | null;
  isApproved?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BoutiqueService {
  private API_URL = 'http://localhost:5000/api/boutique';
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

  getMe(): Observable<BoutiqueMe> {
    return this.http.get<BoutiqueMe>(`${this.API_URL}/me`, { headers: this.getHeaders() });
  }

  updateMe(payload: Partial<Pick<BoutiqueMe, 'name' | 'category'>>): Observable<BoutiqueMe> {
    return this.http.put<BoutiqueMe>(`${this.API_URL}/me`, payload, { headers: this.getHeaders() });
  }
}
