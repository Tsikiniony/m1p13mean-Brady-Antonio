import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { BoxService } from '../../services/box.service';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-home.html',
  styleUrl: './admin-home.css'
})
export class AdminHomeComponent implements OnInit {
  loading = false;
  error = '';

  totalBoxes = 0;
  takenBoxes = 0;

  private platformId = inject(PLATFORM_ID);

  constructor(private boxService: BoxService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.error = '';

    this.boxService.getAllBoxes().subscribe({
      next: (boxes) => {
        this.totalBoxes = boxes.length;
        this.takenBoxes = boxes.filter((b) => !!b.boutique).length;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors du chargement du dashboard';
        console.error(err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
