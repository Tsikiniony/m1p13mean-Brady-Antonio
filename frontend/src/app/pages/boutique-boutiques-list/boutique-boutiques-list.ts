import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BoutiqueWithBoxFlag, BoutiquesService } from '../../services/boutiques.service';

@Component({
  selector: 'app-boutique-boutiques-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './boutique-boutiques-list.html',
  styleUrl: './boutique-boutiques-list.css'
})
export class BoutiqueBoutiquesListComponent implements OnInit {
  boutiques: BoutiqueWithBoxFlag[] = [];
  loading = false;
  error = '';

  rowErrorId: string | null = null;
  rowErrorMsg = '';

  filter: 'all' | 'withBox' | 'withoutBox' = 'all';

  newName = '';
  newCategory: string | null = null;
  creating = false;

  categories = ['Informatique', 'Restaurant', 'Electronique', 'Mode', 'Sport', 'Beauté'];

  private platformId = inject(PLATFORM_ID);

  constructor(private boutiquesService: BoutiquesService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.rowErrorId = null;
    this.rowErrorMsg = '';

    this.boutiquesService.listMineWithBoxFlag().subscribe({
      next: (data) => {
        this.boutiques = data || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err?.error?.message || err?.error?.error || 'Erreur lors du chargement des boutiques';
        this.loading = false;
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }

  get filteredBoutiques(): BoutiqueWithBoxFlag[] {
    if (this.filter === 'withBox') return this.boutiques.filter((b) => b.hasBox);
    if (this.filter === 'withoutBox') return this.boutiques.filter((b) => !b.hasBox);
    return this.boutiques;
  }

  create(): void {
    this.rowErrorId = null;
    this.rowErrorMsg = '';
    if (!this.newName.trim()) {
      this.error = 'Le nom est requis';
      return;
    }

    this.creating = true;
    this.error = '';

    this.boutiquesService.create({ name: this.newName.trim(), category: this.newCategory }).subscribe({
      next: () => {
        this.newName = '';
        this.newCategory = null;
        this.creating = false;
        this.load();
      },
      error: (err) => {
        this.error = err?.error?.message || err?.error?.error || 'Erreur lors de la création';
        this.creating = false;
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }

  editBoutique(b: BoutiqueWithBoxFlag): void {
    this.rowErrorId = null;
    this.rowErrorMsg = '';
    const nextName = prompt('Nouveau nom de la boutique :', b.name);
    if (nextName === null) return;

    const trimmedName = nextName.trim();
    if (!trimmedName) {
      this.error = 'Le nom est requis';
      return;
    }

    const currentCategory = (b.category ?? '') as string;
    const catHint = this.categories.length ? `\nCatégories: ${this.categories.join(', ')}` : '';
    const nextCategoryRaw = prompt(`Nouvelle catégorie (optionnel). Laisser vide pour supprimer.${catHint}`, String(currentCategory));
    if (nextCategoryRaw === null) return;

    const nextCategory = nextCategoryRaw.trim();

    this.error = '';
    this.boutiquesService
      .updateMineById(b._id, { name: trimmedName, category: nextCategory ? nextCategory : null })
      .subscribe({
        next: () => this.load(),
        error: (err) => {
          this.rowErrorId = b._id;
          this.rowErrorMsg = err?.error?.message || err?.error?.error || 'Erreur lors de la modification';
          console.error(err);
          this.cdr.detectChanges();
        }
      });
  }

  deleteBoutique(b: BoutiqueWithBoxFlag): void {
    if (b.hasBox) {
      this.rowErrorId = b._id;
      this.rowErrorMsg = "vous ne pouvez pas supprimer qu'a la fin de l'abonnement";
      return;
    }

    if (!confirm(`Supprimer la boutique "${b.name}" ?`)) {
      return;
    }

    this.rowErrorId = null;
    this.rowErrorMsg = '';
    this.boutiquesService.deleteMineById(b._id).subscribe({
      next: () => this.load(),
      error: (err) => {
        this.rowErrorId = b._id;
        this.rowErrorMsg = err?.error?.message || err?.error?.error || 'Erreur lors de la suppression';
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }
}
