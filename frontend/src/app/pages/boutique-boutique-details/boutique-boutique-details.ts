import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Box } from '../../services/box.service';
import { Boutique, BoutiquesService } from '../../services/boutiques.service';

@Component({
  selector: 'app-boutique-boutique-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './boutique-boutique-details.html',
  styleUrl: './boutique-boutique-details.css'
})
export class BoutiqueBoutiqueDetailsComponent implements OnInit {
  boutique: Boutique | null = null;
  box: Box | null = null;

  loading = false;
  error = '';

  private platformId = inject(PLATFORM_ID);

  constructor(
    private route: ActivatedRoute,
    private boutiquesService: BoutiquesService,
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

  load(id: string): void {
    this.loading = true;
    this.error = '';

    this.boutiquesService.getMineById(id).subscribe({
      next: (b) => {
        this.boutique = b;
        this.cdr.detectChanges();
      },
      error: (err) => {
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
      error: (err) => {
        this.error = err?.error?.message || err?.error?.error || 'Erreur chargement box';
        this.loading = false;
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }

  getBoxStatusLabel(): string {
    if (!this.box) return 'Aucune box';
    return this.box.boutique ? 'prise' : 'non prise';
  }
}
