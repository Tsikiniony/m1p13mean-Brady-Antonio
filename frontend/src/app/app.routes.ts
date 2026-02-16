import { Login } from './pages/login/login';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard';
import { BoutiqueDashboardComponent } from './pages/boutique-dashboard/boutique-dashboard';
import { UsersManagementComponent } from './pages/users-management/users-management';
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'login', component: Login },
  { 
    path: 'admin', 
    component: AdminDashboardComponent,
    children: [
      { path: 'users', component: UsersManagementComponent },
      { path: 'boutique', component: BoutiqueDashboardComponent },
      { path: '', redirectTo: 'users', pathMatch: 'full' }
    ]
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
