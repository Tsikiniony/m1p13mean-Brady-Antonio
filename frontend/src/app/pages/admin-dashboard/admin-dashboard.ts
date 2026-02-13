import { Component } from '@angular/core';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.html'
})
export class AdminDashboardComponent {

  constructor(private auth: AuthService) {}

  logout() {
    this.auth.logout();
  }
}
