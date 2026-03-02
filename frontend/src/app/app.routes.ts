import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard';
import { BoutiqueDashboardComponent } from './pages/boutique-dashboard/boutique-dashboard';
import { BoutiqueLayoutComponent } from './pages/boutique-layout/boutique-layout';
import { BoutiqueBoutiquesListComponent } from './pages/boutique-boutiques-list/boutique-boutiques-list';
import { BoutiqueRequestBoxComponent } from './pages/boutique-request-box/boutique-request-box';
import { BoutiqueBoutiqueDetailsComponent } from './pages/boutique-boutique-details/boutique-boutique-details';
import { BoutiqueHistoryComponent } from './pages/boutique-history/boutique-history';
import { BoutiqueBoxDetailsComponent } from './pages/boutique-box-details/boutique-box-details';
import { BoutiqueRentsComponent } from './pages/boutique-rents/boutique-rents';
import { UsersManagementComponent } from './pages/users-management/users-management';
import { BoxesManagementComponent } from './pages/boxes-management/boxes-management';
import { AdminRentsComponent } from './pages/admin-rents/admin-rents';
import { BoxDetailsComponent } from './pages/box-details/box-details';
import { AdminBoxDetailsComponent } from './pages/admin-box-details/admin-box-details';
import { AdminHomeComponent } from './pages/admin-home/admin-home';
import { ClientHomeComponent } from './pages/client-home/client-home';
import { ClientProductsComponent } from './pages/client-products/client-products';
import { ClientProductDetailsComponent } from './pages/client-product-details/client-product-details';
import { ClientCartComponent } from './pages/client-cart/client-cart';
import { ClientPurchasesComponent } from './pages/client-purchases/client-purchases';
import { ClientDeliveryComponent } from './pages/client-delivery/client-delivery';
import { BoutiqueSalesComponent } from './pages/boutique-sales/boutique-sales';
import { BoutiqueDeliveriesComponent } from './pages/boutique-deliveries/boutique-deliveries';
import { BoutiqueDeliveryDetailsComponent } from './pages/boutique-delivery-details/boutique-delivery-details';
import { AboutComponent } from './pages/about/about';
import { ContactComponent } from './pages/contact/contact';
import { ProfileComponent } from './pages/profile/profile';
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'about', component: AboutComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'client/profile', component: ProfileComponent },
  { path: 'client', component: ClientHomeComponent },
  { path: 'client/products', component: ClientProductsComponent },
  { path: 'client/products/:id', component: ClientProductDetailsComponent },
  { path: 'client/cart', component: ClientCartComponent },
  { path: 'client/delivery', component: ClientDeliveryComponent },
  { path: 'client/purchases', component: ClientPurchasesComponent },
  {
    path: 'boutique',
    component: BoutiqueLayoutComponent,
    children: [
      { path: 'dashboard', component: BoutiqueDashboardComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'boutiques', component: BoutiqueBoutiquesListComponent },
      { path: 'boutiques/:id', component: BoutiqueBoutiqueDetailsComponent },
      { path: 'sales', component: BoutiqueSalesComponent },
      { path: 'deliveries', component: BoutiqueDeliveriesComponent },
      { path: 'deliveries/:id', component: BoutiqueDeliveryDetailsComponent },
      { path: 'boxes/:id', component: BoutiqueBoxDetailsComponent },
      { path: 'demande-box', component: BoutiqueRequestBoxComponent },
      { path: 'rents', component: BoutiqueRentsComponent },
      { path: 'history', component: BoutiqueHistoryComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
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
      { path: 'rents', component: AdminRentsComponent },
      { path: 'boutique', component: BoutiqueDashboardComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '', redirectTo: 'client', pathMatch: 'full' }
];
