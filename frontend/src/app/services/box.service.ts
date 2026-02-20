import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Box {
  _id?: string;
  name?: string;
  number?: number;
  rent: number;
  description?: string;
  image?: string;
  status?: 'prise' | 'non prise' | 'resilié';
  rentExpiresAt?: string | null;
  rentCancelAt?: string | null;
  requests?: Array<{
    _id?: string;
    boutique: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt?: string;
  }>;
  cancelRequests?: Array<{
    _id?: string;
    boutique: string;
    type: 'at_expiry' | 'immediate';
    status: 'pending' | 'approved' | 'rejected';
    createdAt?: string;
    decidedAt?: string | null;
  }>;
  boutique?:
    | string
    | null
    | {
        _id: string;
        name: string;
        category?: string | null;
        owner?:
          | string
          | {
              _id?: string;
              name?: string;
              email?: string;
            };
      };
  createdAt?: string;
  updatedAt?: string;
}

export interface PendingBoxRequest {
  boxId: string;
  boxName?: string;
  boxNumber?: number;
  requestId: string;
  boutique:
    | string
    | {
        _id: string;
        name: string;
        category?: string | null;
        owner?:
          | string
          | {
              _id?: string;
              name?: string;
              email?: string;
            };
      };
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
  decidedAt?: string | null;
}

export interface PendingCancelRequest {
  boxId: string;
  boxName?: string;
  boxNumber?: number;
  cancelRequestId: string;
  boutique:
    | string
    | {
        _id: string;
        name: string;
        category?: string | null;
        owner?:
          | string
          | {
              _id?: string;
              name?: string;
              email?: string;
            };
      };
  type: 'at_expiry' | 'immediate';
  createdAt?: string;
}

export type CreateBoxPayload = {
  rent: number;
  description?: string;
  image?: string;
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

  private getAuthOnlyHeaders(): HttpHeaders {
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

  getAllBoxes(): Observable<Box[]> {
    return this.http.get<Box[]>(this.API_URL, { headers: this.getHeaders() });
  }

  getPublicBoxes(): Observable<Box[]> {
    return this.http.get<Box[]>(`${this.API_URL}/public`);
  }

  getBoxesForRequest(): Observable<Box[]> {
    return this.http.get<Box[]>(`${this.API_URL}/for-request`, { headers: this.getHeaders() });
  }

  getMyRents(): Observable<Box[]> {
    return this.http.get<Box[]>(`${this.API_URL}/my-rents`, { headers: this.getHeaders() });
  }

  getPublicBoxById(id: string): Observable<Box> {
    return this.http.get<Box>(`${this.API_URL}/public/${id}`);
  }

  getBoxById(id: string): Observable<Box> {
    return this.http.get<Box>(`${this.API_URL}/${id}`, { headers: this.getHeaders() });
  }

  extendRent(boxId: string): Observable<Box> {
    return this.http.put<Box>(`${this.API_URL}/${boxId}/rent/extend`, {}, { headers: this.getHeaders() });
  }

  requestCancel(boxId: string, boutiqueId: string, type: 'at_expiry' | 'immediate'): Observable<any> {
    return this.http.post(
      `${this.API_URL}/${boxId}/cancel/request`,
      { boutiqueId, type: type === 'immediate' ? 'immediate' : 'at_expiry' },
      { headers: this.getHeaders() }
    );
  }

  getPendingCancelRequests(): Observable<PendingCancelRequest[]> {
    return this.http.get<PendingCancelRequest[]>(`${this.API_URL}/cancel-requests/pending`, { headers: this.getHeaders() });
  }

  approveCancelRequest(boxId: string, cancelRequestId: string): Observable<Box> {
    return this.http.put<Box>(
      `${this.API_URL}/${boxId}/cancel-requests/${cancelRequestId}/approve`,
      {},
      { headers: this.getHeaders() }
    );
  }

  rejectCancelRequest(boxId: string, cancelRequestId: string): Observable<Box> {
    return this.http.put<Box>(
      `${this.API_URL}/${boxId}/cancel-requests/${cancelRequestId}/reject`,
      {},
      { headers: this.getHeaders() }
    );
  }

  createBox(box: CreateBoxPayload): Observable<Box> {
    return this.http.post<Box>(this.API_URL, box, { headers: this.getHeaders() });
  }

  createBoxForm(form: FormData): Observable<Box> {
    return this.http.post<Box>(this.API_URL, form, { headers: this.getAuthOnlyHeaders() });
  }

  updateBox(id: string, box: Partial<Box>): Observable<Box> {
    return this.http.put<Box>(`${this.API_URL}/${id}`, box, { headers: this.getHeaders() });
  }

  updateBoxForm(id: string, form: FormData): Observable<Box> {
    return this.http.put<Box>(`${this.API_URL}/${id}`, form, { headers: this.getAuthOnlyHeaders() });
  }

  deleteBox(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`, { headers: this.getHeaders() });
  }

  requestBox(boxId: string, boutiqueId: string): Observable<any> {
    return this.http.post(
      `${this.API_URL}/${boxId}/request`,
      { boutiqueId },
      { headers: this.getHeaders() }
    );
  }

  getPendingRequests(): Observable<PendingBoxRequest[]> {
    return this.http.get<PendingBoxRequest[]>(`${this.API_URL}/requests/pending`, { headers: this.getHeaders() });
  }

  getMyRequestsHistory(): Observable<PendingBoxRequest[]> {
    return this.http.get<PendingBoxRequest[]>(`${this.API_URL}/requests/my-history`, { headers: this.getHeaders() });
  }

  approveRequest(boxId: string, requestId: string): Observable<Box> {
    return this.http.put<Box>(`${this.API_URL}/${boxId}/requests/${requestId}/approve`, {}, { headers: this.getHeaders() });
  }

  rejectRequest(boxId: string, requestId: string): Observable<Box> {
    return this.http.put<Box>(`${this.API_URL}/${boxId}/requests/${requestId}/reject`, {}, { headers: this.getHeaders() });
  }
}
