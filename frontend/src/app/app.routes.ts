import { Login } from './pages/login/login';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard';
import { BoutiqueDashboardComponent } from './pages/boutique-dashboard/boutique-dashboard';
import { UsersManagementComponent } from './pages/users-management/users-management';
import { BoxesManagementComponent } from './pages/boxes-management/boxes-management';
import { BoxDetailsComponent } from './pages/box-details/box-details';
import { AdminBoxDetailsComponent } from './pages/admin-box-details/admin-box-details';
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'boxes/:id', component: BoxDetailsComponent },
  { 
    path: 'admin', 
    component: AdminDashboardComponent,
    children: [
      { path: 'users', component: UsersManagementComponent },
      { path: 'boxes/:id', component: AdminBoxDetailsComponent },
      { path: 'boxes', component: BoxesManagementComponent },
      { path: 'boutique', component: BoutiqueDashboardComponent },
      { path: '', redirectTo: 'users', pathMatch: 'full' }
    ]
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
