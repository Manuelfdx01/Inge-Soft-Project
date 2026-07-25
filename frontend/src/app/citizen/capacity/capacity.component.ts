import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  CollectionPoint,
  CollectionPointsService
} from '../../core/services/collection-points.service';

@Component({
  selector: 'app-capacity',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './capacity.component.html',
  styleUrl: './capacity.component.scss'
})
export class CapacityComponent implements OnInit {

  loading = true;
  error = '';

  points: CollectionPoint[] = [];

  constructor(
    private collectionPointsService: CollectionPointsService
  ) {}

  ngOnInit(): void {
    this.loadPoints();
  }

  loadPoints(): void {
    this.loading = true;
    this.error = '';

    this.collectionPointsService.getAll().subscribe({
      next: (points) => {
        this.points = points;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'No fue posible cargar los puntos de reciclaje.';
        this.loading = false;
      }
    });
  }

  getProgressColor(point: CollectionPoint): string {

    switch (point.status) {
      case 'NORMAL':
        return '#4CAF50';

      case 'ALERTA':
        return '#FF9800';

      case 'CRITICO':
        return '#F44336';

      default:
        return '#9E9E9E';
    }
  }

  getStatusText(status: string): string {

    switch (status) {
      case 'NORMAL':
        return 'Normal';

      case 'ALERTA':
        return 'Alerta';

      case 'CRITICO':
        return 'Crítico';

      default:
        return status;
    }
  }

}
