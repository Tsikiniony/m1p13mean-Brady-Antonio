import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PublicBoutique {
  _id: string;
  name: string;
  category?: string | null;
}

export interface PublicArticle {
  _id: string;
  boutique: string | PublicBoutique;
  name: string;
  description?: string;
  price: number;
  image?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PublicArticlesService {
  private API_URL = 'http://localhost:5000/api/articles';

  constructor(private http: HttpClient) {}

  listAll(): Observable<PublicArticle[]> {
    return this.http.get<PublicArticle[]>(this.API_URL);
  }

  getById(id: string): Observable<PublicArticle> {
    return this.http.get<PublicArticle>(`${this.API_URL}/${id}`);
  }
}
