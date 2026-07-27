import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CentroAcopioService, CentroCalificacion } from '../../core/services/centro-acopio.service';

@Component({
  selector: 'app-centro-calificaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calificaciones.component.html',
  styleUrl: './calificaciones.component.scss'
})
export class CalificacionesComponent implements OnInit {
  readonly reviews = signal<CentroCalificacion[]>([]);
  readonly loading = signal(true);
  readonly errorMsg = signal('');

  readonly avgRating = computed(() => {
    const r = this.reviews();
    if (!r.length) return null;
    return (r.reduce((acc, cur) => acc + cur.rating, 0) / r.length).toFixed(1);
  });

  readonly distribution = computed(() => {
    const r = this.reviews();
    return [5, 4, 3, 2, 1].map(star => ({
      star,
      count: r.filter(rev => rev.rating === star).length,
      pct: r.length ? Math.round((r.filter(rev => rev.rating === star).length / r.length) * 100) : 0
    }));
  });

  constructor(private centroService: CentroAcopioService) {}

  ngOnInit(): void {
    this.centroService.getCalificaciones().subscribe({
      next: (data) => {
        this.reviews.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('No se pudieron cargar las calificaciones.');
        this.loading.set(false);
      }
    });
  }

  stars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }
}
