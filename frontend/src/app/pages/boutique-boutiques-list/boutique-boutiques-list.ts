import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoutiqueWithBoxFlag, BoutiquesService } from '../../services/boutiques.service';

@Component({
  selector: 'app-boutique-boutiques-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './boutique-boutiques-list.html',
  styleUrl: './boutique-boutiques-list.css'
})
export class BoutiqueBoutiquesListComponent implements OnInit {
  boutiques: BoutiqueWithBoxFlag[] = [];
  loading = false;
  error = '';

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
}
