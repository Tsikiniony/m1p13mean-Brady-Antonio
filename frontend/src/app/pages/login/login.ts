import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  email: string = '';
  password: string = '';

  constructor(private auth: AuthService, private router: Router) {}

  onLogin() {
    this.auth.login({ email: this.email, password: this.password })
      .subscribe((res: any) => {

        // Sauvegarder le token
        this.auth.saveToken(res.token);

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

      }, err => {
        alert('Email ou mot de passe incorrect');
      });
  }

}
