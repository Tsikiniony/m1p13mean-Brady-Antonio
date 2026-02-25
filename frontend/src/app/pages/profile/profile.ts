import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { User, UserService } from '../../services/user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {
  user: any = null;

  private platformId = inject(PLATFORM_ID);

  private userId: string | null = null;

  name = '';
  email = '';

  password = '';
  confirmPassword = '';

  savingProfile = false;
  savingPassword = false;

  errorProfile = '';
  errorPassword = '';

  constructor(private auth: AuthService, private users: UserService, private router: Router) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.user = this.auth.getUser();
    this.userId = (this.user?._id || this.user?.id || null) as string | null;

    if (!this.userId) {
      if (!this.auth.getToken()) {
        this.router.navigate(['/login']);
        return;
      }

      this.errorProfile = 'Session invalide: utilisateur introuvable. Veuillez vous reconnecter.';
      return;
    }

    this.name = this.user?.name || '';
    this.email = this.user?.email || '';
  }

  saveProfile(): void {
    this.errorProfile = '';

    if (!this.userId) {
      this.errorProfile = 'Session invalide: veuillez vous reconnecter.';
      return;
    }

    if (!this.name.trim()) {
      this.errorProfile = 'Le nom est requis';
      return;
    }

    if (!this.email.trim()) {
      this.errorProfile = 'Email requis';
      return;
    }

    this.savingProfile = true;

    this.users.updateMe({ name: this.name.trim(), email: this.email.trim() }).subscribe({
      next: (updated: User) => {
        const merged = { ...(this.user || {}), ...(updated || {}) };
        this.auth.saveUser(merged);
        this.user = merged;
        this.userId = (this.user?._id || this.user?.id || this.userId) as string;
        this.savingProfile = false;
      },
      error: (err: any) => {
        this.errorProfile = err?.error?.message || err?.error?.error || 'Erreur lors de la mise à jour du profil';
        this.savingProfile = false;
        console.error(err);
      }
    });
  }

  savePassword(): void {
    this.errorPassword = '';

    if (!this.userId) {
      this.errorPassword = 'Session invalide: veuillez vous reconnecter.';
      return;
    }

    if (!this.password) {
      this.errorPassword = 'Mot de passe requis';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorPassword = 'Les mots de passe ne correspondent pas';
      return;
    }

    this.savingPassword = true;

    this.users.updateMe({ password: this.password } as Partial<User>).subscribe({
      next: (updated: User) => {
        const merged = { ...(this.user || {}), ...(updated || {}) };
        this.auth.saveUser(merged);
        this.user = merged;
        this.password = '';
        this.confirmPassword = '';
        this.savingPassword = false;
      },
      error: (err: any) => {
        this.errorPassword = err?.error?.message || err?.error?.error || 'Erreur lors de la mise à jour du mot de passe';
        this.savingPassword = false;
        console.error(err);
      }
    });
  }
}
