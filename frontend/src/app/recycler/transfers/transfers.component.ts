import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  LogisticsService,
  LogisticsDashboard,
  LogisticsAlert,
} from '../../core/services/logistics.service';

@Component({
  selector: 'app-transfers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transfers.component.html',
  styleUrl: './transfers.component.scss'
})
export class TransfersComponent implements OnInit {

  dashboard!: LogisticsDashboard;

  loading = false;

  constructor(
    private logistics: LogisticsService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  // ===========================================
  // Cargar información
  // ===========================================

  loadData(): void {

    this.loading = true;

    this.logistics.getDashboard().subscribe({

      next: (data) => {

        this.dashboard = data;

        this.loading = false;

      },

      error: (err) => {

        console.error(err);

        this.loading = false;

      }

    });

  }

  // ===========================================
  // Aceptar traslado
  // ===========================================

  acceptTrip(alert: LogisticsAlert): void {

    this.logistics.aceptarTraslado(alert.id).subscribe({

      next: () => {

        this.loadData();

      },

      error: err => console.error(err)

    });

  }

  // ===========================================
  // Completar traslado
  // ===========================================

  completeTrip(alert: LogisticsAlert): void {

    this.logistics.completarTraslado(alert.id).subscribe({

      next: () => {

        this.loadData();

      },

      error: err => console.error(err)

    });

  }

  // ===========================================
  // Abrir Google Maps
  // ===========================================

  openMap(alert: LogisticsAlert): void {

    const url =
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(alert.target_point.address)}`;

    window.open(url, '_blank');

  }

  // ===========================================
  // Color prioridad
  // ===========================================

  priorityColor(priority: string): string {

    switch (priority) {

      case 'ALTA':
        return '#ef4444';

      case 'MEDIA':
        return '#f59e0b';

      case 'BAJA':
        return '#22c55e';

      default:
        return '#94a3b8';

    }

  }

  // ===========================================
  // Texto estado
  // ===========================================

  statusLabel(status: string): string {

    switch (status) {

      case 'PENDIENTE':
        return 'Pendiente';

      case 'ACEPTADA':
        return 'Aceptada';

      case 'EN_PROCESO':
        return 'En proceso';

      case 'COMPLETADA':
        return 'Completada';

      default:
        return status;

    }

  }

  // ===========================================
  // Fecha bonita
  // ===========================================

  formatDate(date?: string | null): string {

    if (!date) {
      return '-';
    }

    return new Date(date).toLocaleString('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

  }

}
