import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard';
import { BoutiqueDashboardComponent } from './pages/boutique-dashboard/boutique-dashboard';
import { BoutiqueLayoutComponent } from './pages/boutique-layout/boutique-layout';
import { BoutiqueBoutiquesListComponent } from './pages/boutique-boutiques-list/boutique-boutiques-list';
import { BoutiqueRequestBoxComponent } from './pages/boutique-request-box/boutique-request-box';
import { BoutiqueBoutiqueDetailsComponent } from './pages/boutique-boutique-details/boutique-boutique-details';
import { BoutiqueHistoryComponent } from './pages/boutique-history/boutique-history';
import { UsersManagementComponent } from './pages/users-management/users-management';
import { BoxesManagementComponent } from './pages/boxes-management/boxes-management';
import { BoxDetailsComponent } from './pages/box-details/box-details';
import { AdminBoxDetailsComponent } from './pages/admin-box-details/admin-box-details';
import { AdminHomeComponent } from './pages/admin-home/admin-home';
import { ClientHomeComponent } from './pages/client-home/client-home';
import { ClientProductsComponent } from './pages/client-products/client-products';
import { ClientProductDetailsComponent } from './pages/client-product-details/client-product-details';
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'client', component: ClientHomeComponent },
  { path: 'client/products', component: ClientProductsComponent },
  { path: 'client/products/:id', component: ClientProductDetailsComponent },
  {
    path: 'boutique',
    component: BoutiqueLayoutComponent,
    children: [
      { path: 'boutiques', component: BoutiqueBoutiquesListComponent },
      { path: 'boutiques/:id', component: BoutiqueBoutiqueDetailsComponent },
      { path: 'demande-box', component: BoutiqueRequestBoxComponent },
      { path: 'history', component: BoutiqueHistoryComponent },
      { path: '', redirectTo: 'boutiques', pathMatch: 'full' }
    ]
  },
  { path: 'boxes/:id', component: BoxDetailsComponent },
  { 
    path: 'admin', 
    component: AdminDashboardComponent,
    children: [
      { path: 'dashboard', component: AdminHomeComponent },
      { path: 'users', component: UsersManagementComponent },
      { path: 'boxes/:id', component: AdminBoxDetailsComponent },
      { path: 'boxes', component: BoxesManagementComponent },
      { path: 'boutique', component: BoutiqueDashboardComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];
