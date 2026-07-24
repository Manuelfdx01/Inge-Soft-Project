import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  metrics: any = null;
  loading = true;

  constructor(private admin: AdminService) {}

  ngOnInit(): void {
    this.admin.getMetrics().subscribe({
      next: (data) => {
        this.metrics = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      CRITICO:     'badge-red',
      ALERTA:      'badge-amber',
      NORMAL:      'badge-green',
      PENDIENTE:   'badge-red',
      EN_REVISION: 'badge-amber',
      RESUELTO:    'badge-green',
      RECIBIDA:    'badge-gray',
      APROBADA:    'badge-green',
      RECHAZADA:   'badge-red',
    };

    return classes[status] ?? 'badge-gray';
  }

  getBarHeight(pct: number): string {
    return `${pct}%`;
  }

  getBarColor(pct: number): string {
    if (pct >= 86) return '#EF5350';
    if (pct >= 61) return '#FFA726';
    return '#7CC96A';
  }
}
