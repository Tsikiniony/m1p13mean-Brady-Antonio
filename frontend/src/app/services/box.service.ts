import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Box {
  _id?: string;
  name?: string;
  number?: number;
  rent: number;
  status?: 'prise' | 'non prise';
  rentExpiresAt?: string | null;
  boutique?:
    | string
    | null
    | {
        _id: string;
        name: string;
        email: string;
        role: string;
      };
  createdAt?: string;
  updatedAt?: string;
}

export type CreateBoxPayload = {
  rent: number;
};

@Injectable({
  providedIn: 'root'
})
export class BoxService {
  private API_URL = 'http://localhost:5000/api/boxes';
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

  getAllBoxes(): Observable<Box[]> {
    return this.http.get<Box[]>(this.API_URL, { headers: this.getHeaders() });
  }

  getPublicBoxes(): Observable<Box[]> {
    return this.http.get<Box[]>(`${this.API_URL}/public`);
  }

  getPublicBoxById(id: string): Observable<Box> {
    return this.http.get<Box>(`${this.API_URL}/public/${id}`);
  }

  getBoxById(id: string): Observable<Box> {
    return this.http.get<Box>(`${this.API_URL}/${id}`, { headers: this.getHeaders() });
  }

  createBox(box: CreateBoxPayload): Observable<Box> {
    return this.http.post<Box>(this.API_URL, box, { headers: this.getHeaders() });
  }

  updateBox(id: string, box: Partial<Box>): Observable<Box> {
    return this.http.put<Box>(`${this.API_URL}/${id}`, box, { headers: this.getHeaders() });
  }

  deleteBox(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`, { headers: this.getHeaders() });
  }

  requestBox(boxId: string): Observable<any> {
    return this.http.post(`${this.API_URL}/${boxId}/request`, {}, { headers: this.getHeaders() });
  }

  approveRequest(boxId: string, requestId: string): Observable<Box> {
    return this.http.put<Box>(`${this.API_URL}/${boxId}/requests/${requestId}/approve`, {}, { headers: this.getHeaders() });
  }

  rejectRequest(boxId: string, requestId: string): Observable<Box> {
    return this.http.put<Box>(`${this.API_URL}/${boxId}/requests/${requestId}/reject`, {}, { headers: this.getHeaders() });
  }
}
