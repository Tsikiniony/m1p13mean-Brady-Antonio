import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private API_URL = 'http://localhost:5000/api/auth';
  private platformId = inject(PLATFORM_ID);

  constructor(private http: HttpClient, private router: Router) {}

  login(data: any) {
    return this.http.post(`${this.API_URL}/login`, data);
  }

  register(data: any) {
    return this.http.post(`${this.API_URL}/register`, data);
  }

  saveToken(token: string) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('token', token);
    }
  }

  saveUser(user: any) {
    if (isPlatformBrowser(this.platformId)) {
      const normalized = user && typeof user === 'object' ? { ...user } : user;
      if (normalized && typeof normalized === 'object' && (normalized as any).id && !(normalized as any)._id) {
        (normalized as any)._id = (normalized as any).id;
      }
      localStorage.setItem('user', JSON.stringify(normalized || null));
    }
  }

  getUser(): any {
    if (isPlatformBrowser(this.platformId)) {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      try {
        const u = JSON.parse(raw);
        if (u && typeof u === 'object' && u.id && !u._id) {
          u._id = u.id;
        }
        return u;
      } catch {
        return null;
      }
    }
    return null;
  }

  getToken() {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
