import { ChangeDetectorRef, Component, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Box, BoxService } from '../../services/box.service';
import { Subject, of } from 'rxjs';
import { catchError, distinctUntilChanged, finalize, map, switchMap, takeUntil, tap, timeout } from 'rxjs/operators';

@Component({
  selector: 'app-admin-box-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-box-details.html',
  styleUrl: './admin-box-details.css'
})
export class AdminBoxDetailsComponent implements OnInit, OnDestroy {
  box: Box | null = null;
  loading = false;
  error = '';

  private destroyed$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private boxService: BoxService,
    private cdr: ChangeDetectorRef
  ) {}

  private platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.route.paramMap
      .pipe(
        map((params) => params.get('id')),
        distinctUntilChanged(),
        tap((id) => {
          if (!id) {
            this.error = 'ID box manquant';
          }
        }),
        switchMap((id) => {
          if (!id) {
            return of(null as Box | null);
          }

          this.loading = true;
          this.error = '';
          this.box = null;

          const token = isPlatformBrowser(this.platformId) ? localStorage.getItem('token') : null;
          console.log('[AdminBoxDetails] token present?', !!token);
          console.log('[AdminBoxDetails] loading box', id);

          if (!token) {
            this.error = 'Non autorisé: token manquant. Reconnecte-toi.';
            this.loading = false;
            return of(null as Box | null);
          }

          return this.boxService.getBoxById(id).pipe(
            timeout(8000),
            catchError((err) => {
              if (err?.name === 'TimeoutError') {
                this.error =
                  'La requête a expiré. Vérifie que le backend tourne et que GET /api/boxes/:id répond.';
                return of(null as Box | null);
              }

              if (err?.status === 0) {
                this.error = 'Impossible de contacter le serveur (backend non démarré ou bloqué).';
                console.error(err);
                return of(null as Box | null);
              }

              this.error = err.error?.message || err.error?.error || `Erreur (${err.status})`;
              console.error(err);
              return of(null as Box | null);
            }),
            finalize(() => {
              this.loading = false;
              this.cdr.detectChanges();
            })
          );
        }),
        takeUntil(this.destroyed$)
      )
      .subscribe((box) => {
        this.box = box;
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }


  getStatusLabel(): string {
    if (!this.box) return '-';
    return this.box.boutique ? 'prise' : 'non prise';
  }

  getBoutiqueLabel(): string {
    if (!this.box || !this.box.boutique) return '-';
    if (typeof this.box.boutique === 'object') {
      return `${this.box.boutique.name} (${this.box.boutique.email})`;
    }
    return String(this.box.boutique);
  }

  getRentExpiresAtLabel(): string {
    const rentExpiresAt = this.box?.rentExpiresAt;
    if (!rentExpiresAt) return '-';
    const d = new Date(rentExpiresAt);
    if (Number.isNaN(d.getTime())) return String(rentExpiresAt);
    return d.toLocaleString();
  }
}
