import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {

  loginType: 'client' | 'boutique' | 'admin' = 'client';
  animating = false;

  email: string = '';
  password: string = '';

  constructor(private auth: AuthService, private router: Router) {}

  presets: Record<'client' | 'boutique' | 'admin', { email: string; password: string; label: string }> = {
    client: { email: 'client@gmail.com', password: '123456', label: 'Client' },
    boutique: { email: 'boutique@gmail.com', password: '123456', label: 'Boutique' },
    admin: { email: 'admin@admin.com', password: '123456', label: 'Admin' }
  };

  ngOnInit(): void {
    this.applyPreset(this.loginType, false);
  }

  setLoginType(type: 'client' | 'boutique' | 'admin'): void {
    if (this.loginType === type) return;
    this.loginType = type;
    this.applyPreset(type, true);
  }

  private applyPreset(type: 'client' | 'boutique' | 'admin', animate: boolean): void {
    const p = this.presets[type];
    this.email = p.email;
    this.password = p.password;

    if (animate) {
      this.animating = false;
      setTimeout(() => {
        this.animating = true;
        setTimeout(() => {
          this.animating = false;
        }, 450);
      }, 0);
    }
  }

  onLogin() {
    this.auth.login({ email: this.email, password: this.password })
      .subscribe((res: any) => {

        // Sauvegarder le token
        this.auth.saveToken(res.token);
        this.auth.saveUser(res.user);

        // Redirection selon rôle
        switch(res.user.role){
          case 'admin':
            this.router.navigate(['/admin']);
            break;
          case 'client':
            this.router.navigate(['/client']);
            break;
          case 'boutique':
            this.router.navigate(['/boutique']);
            break;
          default:
            alert('Rôle inconnu');
        }

      }, (err: any) => {
        const msg = err?.error?.message || err?.error?.error || 'Email ou mot de passe incorrect';
        alert(msg);
      });
  }

}
