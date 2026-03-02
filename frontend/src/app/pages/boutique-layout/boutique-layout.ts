import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-boutique-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './boutique-layout.html',
  styleUrl: './boutique-layout.css'
})
export class BoutiqueLayoutComponent {
  menuOpen = false;
  userMenuOpen = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.closeMenu();
        this.userMenuOpen = false;
      }
    });
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  getBoutiqueLabel(): string {
    const u: any = this.auth.getUser();
    return u?.name || u?.email || 'Boutique';
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: Event): void {
    if (!this.menuOpen) return;
    (event as KeyboardEvent).preventDefault();
    this.closeMenu();
  }

  logout() {
    this.closeMenu();
    this.userMenuOpen = false;
    this.auth.logout();
  }
}
