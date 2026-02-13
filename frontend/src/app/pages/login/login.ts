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

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  onLogin() {
    this.auth.login({
      email: this.email,
      password: this.password
    }).subscribe((res: any) => {

      this.auth.saveToken(res.token);

      if (res.user.role === 'admin') {
        this.router.navigate(['/admin']);
      }

    }, err => {
      alert("Erreur login");
    });
  }
}
