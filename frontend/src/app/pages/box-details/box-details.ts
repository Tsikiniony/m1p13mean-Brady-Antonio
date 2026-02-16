import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Box, BoxService } from '../../services/box.service';

@Component({
  selector: 'app-box-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './box-details.html',
  styleUrl: './box-details.css'
})
export class BoxDetailsComponent implements OnInit {
  box: Box | null = null;
  loading = false;
  error = '';

  private platformId = inject(PLATFORM_ID);

  constructor(private route: ActivatedRoute, private boxService: BoxService) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'ID box manquant';
      return;
    }
    this.loadBox(id);
  }

  loadBox(id: string) {
    this.loading = true;
    this.error = '';

    this.boxService.getPublicBoxById(id).subscribe({
      next: (box) => {
        this.box = box;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors du chargement des détails';
        this.loading = false;
        console.error(err);
      }
    });
  }

  getBoutiqueLabel(): string {
    if (!this.box || !this.box.boutique) return '-';
    if (typeof this.box.boutique === 'object') {
      return `${this.box.boutique.name} (${this.box.boutique.email})`;
    }
    return String(this.box.boutique);
  }

  getRentExpiresAtLabel(): string {
    if (!this.box || !this.box.rentExpiresAt) return '-';
    const d = new Date(this.box.rentExpiresAt);
    if (Number.isNaN(d.getTime())) return String(this.box.rentExpiresAt);
    return d.toLocaleString();
  }
}
