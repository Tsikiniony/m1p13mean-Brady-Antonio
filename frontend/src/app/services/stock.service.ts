import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StockService {
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

  setMineStockForArticle(boutiqueId: string, articleId: string, quantity: number): Observable<{ quantity: number }> {
    return this.http.put<{ quantity: number }>(
      `${this.API_URL}/${boutiqueId}/articles/${articleId}/stock`,
      { quantity },
      { headers: this.getHeaders() }
    );
  }

  getMineStockForArticle(boutiqueId: string, articleId: string): Observable<{ quantity: number }> {
    return this.http.get<{ quantity: number }>(`${this.API_URL}/${boutiqueId}/articles/${articleId}/stock`, {
      headers: this.getHeaders()
    });
  }
}
