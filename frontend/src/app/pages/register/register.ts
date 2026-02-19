import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  isBoutique = false;

  loading = false;
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  onRegister() {
    this.error = '';

    if (!this.name.trim()) {
      this.error = 'Le nom est requis';
      return;
    }

    if (!this.email.trim()) {
      this.error = 'Email requis';
      return;
    }

    if (!this.password) {
      this.error = 'Mot de passe requis';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Les mots de passe ne correspondent pas';
      return;
    }

    this.loading = true;

    this.auth
      .register({
        name: this.name,
        email: this.email,
        password: this.password,
        role: this.isBoutique ? 'boutique' : 'client'
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/login']);
        },
        error: (err: any) => {
          this.error = err.error?.message || err.error?.error || "Erreur lors de l'inscription";
          console.error(err);
          this.loading = false;
        }
      });
  }
}
