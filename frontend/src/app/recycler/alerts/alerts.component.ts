import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  LogisticsService,
  LogisticsAlert
} from '../../core/services/logistics.service';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './alerts.component.html',
  styleUrl: './alerts.component.scss'
})
export class AlertsComponent implements OnInit {

  loading = false;

  activeAlerts: LogisticsAlert[] = [];

  isAvailable = false;

  constructor(
    private logistics: LogisticsService
  ) {}

  ngOnInit(): void {

    this.loadAvailability();

    this.loadAlerts();

  }

  // =====================================
  // Alertas
  // =====================================

  loadAlerts(): void {

    this.loading = true;

    this.logistics.getAlerts().subscribe({

      next: (alerts) => {

        this.activeAlerts = alerts.filter(alert =>
          alert.status === 'PENDIENTE' ||
          alert.status === 'ACEPTADA' ||
          alert.status === 'EN_PROCESO'
        );

        this.loading = false;

      },

      error: (err: any) => {

        console.error(err);

        this.loading = false;

      }

    });

  }

  // =====================================
  // Disponibilidad
  // =====================================

  loadAvailability(): void {

    this.logistics.getAvailability().subscribe({

      next: (response: { is_available: boolean }) => {

        this.isAvailable = response.is_available;

      },

      error: (err: any) => {

        console.error(err);

      }

    });

  }

  toggleDisponibilidad(): void {

    this.logistics
      .setAvailability(!this.isAvailable)
      .subscribe({

        next: (response: { is_available: boolean }) => {

          this.isAvailable = response.is_available;

        },

        error: (err: any) => {

          console.error(err);

        }

      });

  }

  // =====================================
  // Acciones
  // =====================================

  aceptar(alert: LogisticsAlert): void {

    this.logistics
      .aceptarTraslado(alert.id)
      .subscribe({

        next: () => {

          this.loadAlerts();

        },

        error: (err: any) => {

          console.error(err);

        }

      });

  }

  completar(alert: LogisticsAlert): void {

    this.logistics
      .completarTraslado(alert.id)
      .subscribe({

        next: () => {

          this.loadAlerts();

        },

        error: (err: any) => {

          console.error(err);

        }

      });

  }

  // =====================================
  // Helpers
  // =====================================

  getPriorityColor(priority: string): string {

    switch (priority) {

      case 'ALTA':
        return '#E53935';

      case 'MEDIA':
        return '#FB8C00';

      case 'BAJA':
        return '#43A047';

      default:
        return '#9E9E9E';

    }

  }

  timeAgo(date: string): string {

    const now = new Date().getTime();

    const created = new Date(date).getTime();

    const diff = Math.floor((now - created) / 1000);

    if (diff < 60) {
      return 'Hace unos segundos';
    }

    if (diff < 3600) {
      return `Hace ${Math.floor(diff / 60)} min`;
    }

    if (diff < 86400) {
      return `Hace ${Math.floor(diff / 3600)} h`;
    }

    return `Hace ${Math.floor(diff / 86400)} días`;

  }

}
