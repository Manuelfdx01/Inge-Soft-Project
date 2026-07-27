import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CentroAcopioService, CentroCalificacion } from '../../core/services/centro-acopio.service';

@Component({
  selector: 'app-centro-calificaciones',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <h2>⭐ Calificaciones y Comentarios Recibidos</h2>
      <div *ngIf="loading">Cargando opiniones...</div>

      <div *ngIf="!loading" class="reviews-list">
        <div *ngFor="let item of reviews" class="card">
          <div class="card-header">
            <strong>👤 {{ item.user }}</strong>
            <span class="stars">★ {{ item.rating }}/5</span>
          </div>
          <p class="comment">{{ item.comment || 'Sin comentario.' }}</p>
          <span class="date">{{ item.created_at | date:'short' }}</span>
        </div>

        <div *ngIf="reviews.length === 0" class="empty">
          No has recibido calificaciones aún.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; font-family: sans-serif; }
    .reviews-list { display: flex; flex-direction: column; gap: 12px; max-width: 600px; }
    .card { background: #fff; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; }
    .card-header { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
    .stars { color: #f59e0b; font-weight: bold; }
    .comment { font-size: 13px; color: #475569; margin: 0 0 6px 0; }
    .date { font-size: 11px; color: #94a3b8; }
    .empty { color: #94a3b8; font-style: italic; }
  `]
})
export class CalificacionesComponent implements OnInit {
  reviews: CentroCalificacion[] = [];
  loading = true;

  constructor(private centroService: CentroAcopioService) {}

  ngOnInit(): void {
    this.centroService.getCalificaciones().subscribe({
      next: (data) => {
        this.reviews = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }
}
