import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from './services/auth';


@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, FormsModule, HttpClientModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
  showPublicNavbar = signal(true);
  currentUser = signal<any>(null);
  userMenuOpen = signal(false);

  constructor(private router: Router, private auth: AuthService) {
    this.updateNavbarVisibility(router.url);
    this.currentUser.set(this.auth.getUser());
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) {
        this.updateNavbarVisibility(e.urlAfterRedirects);
        this.currentUser.set(this.auth.getUser());
        this.userMenuOpen.set(false);
      }
    });
  }

  private updateNavbarVisibility(url: string): void {
    const path = (url || '').split('?')[0];
    const hide = path.startsWith('/admin') || path.startsWith('/boutique');
    this.showPublicNavbar.set(!hide);
  }

  isClientLoggedIn(): boolean {
    const u = this.currentUser();
    return !!u && u.role === 'client';
  }

  getClientName(): string {
    const u = this.currentUser();
    return u?.name || 'Client';
  }

  toggleUserMenu(): void {
    this.userMenuOpen.set(!this.userMenuOpen());
  }

  logout(): void {
    this.auth.logout();
    this.currentUser.set(null);
    this.userMenuOpen.set(false);
  }
}
