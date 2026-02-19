import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PublicArticlesService, PublicArticle, PublicBoutique } from '../../services/public-articles.service';

@Component({
  selector: 'app-client-products',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './client-products.html',
  styleUrl: './client-products.css'
})
export class ClientProductsComponent implements OnInit {
  loading = false;
  error = '';
  articles: PublicArticle[] = [];

  constructor(private publicArticles: PublicArticlesService) {}

  ngOnInit(): void {
    this.fetch();
  }

  fetch(): void {
    this.loading = true;
    this.error = '';

    this.publicArticles.listAll().subscribe({
      next: (items) => {
        this.articles = items || [];
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error?.error || 'Erreur lors du chargement des produits';
        this.loading = false;
        console.error(err);
      }
    });
  }

  trackById(_: number, a: PublicArticle): string {
    return a._id;
  }

  getBoutiqueName(a: PublicArticle): string {
    const b = a.boutique as any;
    return typeof b === 'string' ? '' : (b?.name || '');
  }

  getBoutiqueCategory(a: PublicArticle): string {
    const b = a.boutique as any;
    return typeof b === 'string' ? '' : (b?.category || '');
  }

  getImage(a: PublicArticle): string {
    return a.image || 'https://via.placeholder.com/800x600?text=Produit';
  }
}
