import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-client-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './client-home.html',
  styleUrl: './client-home.css'
})
export class ClientHomeComponent {
  constructor(private cart: CartService) {}

  getCartCount(): number {
    return this.cart.getCount();
  }
}
