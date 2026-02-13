import { Login } from './pages/login/login';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard';
import { BoutiqueDashboardComponent } from './pages/boutique-dashboard/boutique-dashboard';
 import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'admin', component: AdminDashboardComponent },
  { path: 'boutique', component: BoutiqueDashboardComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
