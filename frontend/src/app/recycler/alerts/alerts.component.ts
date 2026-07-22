import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogisticsService, LogisticsAlert } from '../../core/services/logistics.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alerts.component.html',
})
export class AlertsComponent implements OnInit {
  activeAlerts: LogisticsAlert[] = [];
  completedAlerts: LogisticsAlert[] = [];
  isAvailable = false;
  loading = false;

  constructor(
    private logistics: LogisticsService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.isAvailable = this.auth.getUser()?.is_available ?? false;
    this.loadAlerts();
  }

  loadAlerts(): void {
    this.loading = true;

    this.logistics.getAlerts().subscribe({
      next: (alerts) => {
        this.activeAlerts = alerts.filter(
          a => ['PENDIENTE', 'ACEPTADA', 'EN_PROCESO'].includes(a.status)
        );

        this.completedAlerts = alerts.filter(
          a => a.status === 'COMPLETADA'
        );

        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  toggleDisponibilidad(): void {
    this.auth.currentUser$.subscribe(user => {
      if (!user) return;
    });

    this.isAvailable = !this.isAvailable;
  }

  aceptar(alert: LogisticsAlert): void {
    this.logistics.aceptarTraslado(alert.id).subscribe({
      next: () => this.loadAlerts(),
    });
  }

  completar(alert: LogisticsAlert): void {
    this.logistics.completarTraslado(alert.id).subscribe({
      next: () => this.loadAlerts(),
    });
  }

  getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
      ALTA: '#EF5350',
      MEDIA: '#FFA726',
      BAJA: '#7CC96A',
    };

    return colors[priority] ?? '#9AA0A6';
  }

  timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();

    const mins = Math.floor(diff / 60000);

    if (mins < 60) {
      return `hace ${mins} min`;
    }

    const hrs = Math.floor(mins / 60);

    if (hrs < 24) {
      return `hace ${hrs}h`;
    }

    return `hace ${Math.floor(hrs / 24)} días`;
  }
}
