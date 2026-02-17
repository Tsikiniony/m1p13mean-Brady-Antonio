import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BoutiqueOwner {
  _id?: string;
  name?: string;
  email?: string;
}

export interface Boutique {
  _id: string;
  owner?: string | BoutiqueOwner;
  name: string;
  category?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type BoutiqueWithBoxFlag = Boutique & {
  hasBox: boolean;
};

export type CreateBoutiquePayload = {
  name: string;
  category?: string | null;
};

@Injectable({
  providedIn: 'root'
})
export class BoutiquesService {
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

  listMine(): Observable<Boutique[]> {
    return this.http.get<Boutique[]>(`${this.API_URL}/`, { headers: this.getHeaders() });
  }

  listMineWithBoxFlag(): Observable<BoutiqueWithBoxFlag[]> {
    return this.http.get<BoutiqueWithBoxFlag[]>(`${this.API_URL}/with-box-flag`, { headers: this.getHeaders() });
  }

  create(payload: CreateBoutiquePayload): Observable<Boutique> {
    return this.http.post<Boutique>(`${this.API_URL}/`, payload, { headers: this.getHeaders() });
  }

  updateMineById(id: string, payload: Partial<Pick<Boutique, 'name' | 'category'>>): Observable<Boutique> {
    return this.http.put<Boutique>(`${this.API_URL}/${id}`, payload, { headers: this.getHeaders() });
  }
}
