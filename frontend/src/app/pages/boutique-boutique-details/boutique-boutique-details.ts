import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Box } from '../../services/box.service';
import { Boutique, BoutiquesService } from '../../services/boutiques.service';
import { Article, ArticlesService } from '../../services/articles.service';

@Component({
  selector: 'app-boutique-boutique-details',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './boutique-boutique-details.html',
  styleUrl: './boutique-boutique-details.css'
})
export class BoutiqueBoutiqueDetailsComponent implements OnInit {
  boutique: Boutique | null = null;
  box: Box | null = null;
  articles: Article[] = [];

  loading = false;
  error = '';

  creating = false;
  creatingModalOpen = false;
  newName = '';
  newPrice: number | null = null;
  newDescription = '';
  newImageFile: File | null = null;
  newImagePreview: string | null = null;

  selectedArticle: Article | null = null;

  editingArticleId: string | null = null;
  editingArticle: Article | null = null;
  editName = '';
  editPrice: number | null = null;
  editDescription = '';
  editImageFile: File | null = null;
  editImagePreview: string | null = null;
  updating = false;

  private platformId = inject(PLATFORM_ID);

  constructor(
    private route: ActivatedRoute,
    private boutiquesService: BoutiquesService,
    private articlesService: ArticlesService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID boutique manquant';
      return;
    }
    this.load(id);
  }

  openCreateModal(): void {
    this.creatingModalOpen = true;
  }

  closeCreateModal(): void {
    if (this.creating) return;
    this.creatingModalOpen = false;
    this.newName = '';
    this.newPrice = null;
    this.newDescription = '';
    this.newImageFile = null;
    this.newImagePreview = null;
  }

  openDetails(a: Article): void {
    this.selectedArticle = a;
  }

  closeDetails(): void {
    this.selectedArticle = null;
  }

  startEdit(a: Article): void {
    this.editingArticleId = a._id;
    this.editingArticle = a;
    this.editName = a.name;
    this.editPrice = a.price;
    this.editDescription = a.description || '';
    this.editImageFile = null;
    this.editImagePreview = null;
  }

  cancelEdit(): void {
    this.editingArticleId = null;
    this.editingArticle = null;
    this.editName = '';
    this.editPrice = null;
    this.editDescription = '';
    this.editImageFile = null;
    this.editImagePreview = null;
  }

  onPickEditImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length ? input.files[0] : null;
    this.editImageFile = file;

    if (!file) {
      this.editImagePreview = null;
      this.cdr.detectChanges();
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.editImagePreview = typeof reader.result === 'string' ? reader.result : null;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  saveEdit(a: Article): void {
    const boutiqueId = this.route.snapshot.paramMap.get('id');
    if (!boutiqueId) {
      this.error = 'ID boutique manquant';
      return;
    }

    if (!this.editName.trim()) {
      this.error = 'Le nom du produit est requis';
      return;
    }

    const price = Number(this.editPrice);
    if (!Number.isFinite(price) || price < 0) {
      this.error = 'Prix invalide';
      return;
    }

    this.updating = true;
    this.error = '';

    this.articlesService
      .updateMineArticle(boutiqueId, a._id, {
        name: this.editName.trim(),
        price,
        description: this.editDescription,
        image: this.editImageFile
      })
      .subscribe({
        next: () => {
          this.updating = false;
          this.cancelEdit();
          this.load(boutiqueId);
        },
        error: (err: any) => {
          this.error = err?.error?.message || err?.error?.error || 'Erreur lors de la modification';
          this.updating = false;
          console.error(err);
          this.cdr.detectChanges();
        }
      });
  }

  saveCurrentEdit(): void {
    if (!this.editingArticle) {
      this.error = 'Aucun produit sélectionné pour modification';
      return;
    }
    this.saveEdit(this.editingArticle);
  }

  deleteArticle(a: Article): void {
    const boutiqueId = this.route.snapshot.paramMap.get('id');
    if (!boutiqueId) {
      this.error = 'ID boutique manquant';
      return;
    }

    if (!confirm(`Supprimer le produit "${a.name}" ?`)) {
      return;
    }

    this.error = '';
    this.articlesService.deleteMineArticle(boutiqueId, a._id).subscribe({
      next: () => {
        if (this.selectedArticle?._id === a._id) {
          this.selectedArticle = null;
        }
        if (this.editingArticleId === a._id) {
          this.cancelEdit();
        }
        this.load(boutiqueId);
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error?.error || 'Erreur lors de la suppression';
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }

  load(id: string): void {
    this.loading = true;
    this.error = '';

    this.boutiquesService.getMineById(id).subscribe({
      next: (b) => {
        this.boutique = b;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error?.error || 'Erreur chargement boutique';
        this.loading = false;
        console.error(err);
        this.cdr.detectChanges();
      }
    });

    this.boutiquesService.getMineBox(id).subscribe({
      next: (box) => {
        this.box = box;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error?.error || 'Erreur chargement box';
        this.loading = false;
        console.error(err);
        this.cdr.detectChanges();
      }
    });

    this.articlesService.listMineForBoutique(id).subscribe({
      next: (articles) => {
        this.articles = articles || [];
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.error?.error || 'Erreur chargement produits';
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }

  createArticle(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID boutique manquant';
      return;
    }

    if (!this.newName.trim()) {
      this.error = 'Le nom du produit est requis';
      return;
    }

    const price = Number(this.newPrice);
    if (!Number.isFinite(price) || price < 0) {
      this.error = 'Prix invalide';
      return;
    }

    this.creating = true;
    this.error = '';

    this.articlesService
      .createForBoutique(id, {
        name: this.newName.trim(),
        price,
        description: this.newDescription,
        image: this.newImageFile
      })
      .subscribe({
        next: () => {
          this.creating = false;
          this.closeCreateModal();
          this.load(id);
        },
        error: (err: any) => {
          this.error = err?.error?.message || err?.error?.error || 'Erreur lors de la création du produit';
          this.creating = false;
          console.error(err);
          this.cdr.detectChanges();
        }
      });
  }

  onPickImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length ? input.files[0] : null;
    this.newImageFile = file;

    if (!file) {
      this.newImagePreview = null;
      this.cdr.detectChanges();
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.newImagePreview = typeof reader.result === 'string' ? reader.result : null;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  getBoxStatusLabel(): string {
    if (!this.box) return 'Aucune box';
    return this.box.boutique ? 'prise' : 'non prise';
  }
}
