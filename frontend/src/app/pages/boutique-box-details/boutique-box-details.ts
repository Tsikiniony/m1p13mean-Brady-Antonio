import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Box, BoxService } from '../../services/box.service';

@Component({
  selector: 'app-boutique-box-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './boutique-box-details.html',
  styleUrl: './boutique-box-details.css'
})
export class BoutiqueBoxDetailsComponent implements OnInit {
  loading = false;
  error = '';
  box: Box | null = null;

  private platformId = inject(PLATFORM_ID);

  constructor(
    private route: ActivatedRoute,
    private boxService: BoxService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.loading = false;
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID box manquant';
      return;
    }

    this.loading = true;
    this.error = '';

    // On réutilise l'endpoint public car il ne nécessite pas d'être admin.
    // Les champs image/description sont inclus dans la box.
    this.boxService.getPublicBoxById(id).subscribe({
      next: (b) => {
        this.box = b || null;
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

  getStatusLabel(): string {
    if (!this.box) return '-';
    return (this.box.status || (this.box.boutique ? 'prise' : 'non prise'));
  }

  getRentExpiresAtLabel(): string {
    const v = this.box?.rentExpiresAt;
    if (!v) return '-';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleString();
  }
}
