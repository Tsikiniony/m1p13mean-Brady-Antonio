import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-boutique-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './boutique-layout.html',
  styleUrl: './boutique-layout.css'
})
export class BoutiqueLayoutComponent {}
