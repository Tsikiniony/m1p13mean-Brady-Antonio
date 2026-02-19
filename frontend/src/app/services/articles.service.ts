import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Article {
  _id: string;
  boutique: string;
  name: string;
  description?: string;
  price: number;
  image?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateArticlePayload = {
  name: string;
  price: number;
  description?: string;
  image?: File | null;
};

export type UpdateArticlePayload = Partial<{
  name: string;
  price: number;
  description: string;
  image: File | null;
}>;

@Injectable({
  providedIn: 'root'
})
export class ArticlesService {
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

  private getAuthHeadersOnly(): HttpHeaders {
    let token: string | null = null;
    if (isPlatformBrowser(this.platformId)) {
      token = localStorage.getItem('token');
    }

    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  listMineForBoutique(boutiqueId: string): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.API_URL}/${boutiqueId}/articles`, { headers: this.getHeaders() });
  }

  createForBoutique(boutiqueId: string, payload: CreateArticlePayload): Observable<Article> {
    const form = new FormData();
    form.append('name', payload.name);
    form.append('price', String(payload.price));
    form.append('description', payload.description || '');
    if (payload.image) {
      form.append('image', payload.image);
    }

    return this.http.post<Article>(`${this.API_URL}/${boutiqueId}/articles`, form, {
      headers: this.getAuthHeadersOnly()
    });
  }

  getMineArticle(boutiqueId: string, articleId: string): Observable<Article> {
    return this.http.get<Article>(`${this.API_URL}/${boutiqueId}/articles/${articleId}`, { headers: this.getHeaders() });
  }

  updateMineArticle(boutiqueId: string, articleId: string, payload: UpdateArticlePayload): Observable<Article> {
    const form = new FormData();

    if (typeof payload.name !== 'undefined') form.append('name', payload.name);
    if (typeof payload.price !== 'undefined') form.append('price', String(payload.price));
    if (typeof payload.description !== 'undefined') form.append('description', payload.description);
    if (typeof payload.image !== 'undefined' && payload.image) form.append('image', payload.image);

    return this.http.put<Article>(`${this.API_URL}/${boutiqueId}/articles/${articleId}`, form, {
      headers: this.getAuthHeadersOnly()
    });
  }

  deleteMineArticle(boutiqueId: string, articleId: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${boutiqueId}/articles/${articleId}`, { headers: this.getHeaders() });
  }
}
