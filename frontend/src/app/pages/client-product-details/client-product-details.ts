import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PublicArticlesService, PublicArticle } from '../../services/public-articles.service';

@Component({
  selector: 'app-client-product-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './client-product-details.html',
  styleUrl: './client-product-details.css'
})
export class ClientProductDetailsComponent implements OnInit {
  loading = false;
  error = '';
  article: PublicArticle | null = null;

  private platformId = inject(PLATFORM_ID);

  constructor(
    private route: ActivatedRoute,
    private publicArticles: PublicArticlesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.loading = false;
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID produit manquant';
      return;
    }

    this.loading = true;
    this.publicArticles.getById(id).subscribe({
      next: (a) => {
        this.article = a;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error?.error || 'Erreur lors du chargement du produit';
        this.loading = false;
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }

  getBoutiqueName(): string {
    const b: any = this.article?.boutique;
    return typeof b === 'string' ? '' : (b?.name || '');
  }

  getBoutiqueCategory(): string {
    const b: any = this.article?.boutique;
    return typeof b === 'string' ? '' : (b?.category || '');
  }

  getImage(): string {
    return this.article?.image || 'https://via.placeholder.com/1200x800?text=Produit';
  }
}
