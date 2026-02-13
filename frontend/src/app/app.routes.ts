import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'admin', component: AdminDashboardComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
