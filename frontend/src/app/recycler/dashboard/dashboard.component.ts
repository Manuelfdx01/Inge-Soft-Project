import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  LogisticsService,
  LogisticsDashboard,
  LogisticsAlert,
  DashboardStats
} from '../../core/services/logistics.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  loading = true;
  error = '';
  togglingAvailability = false;
  dashboard: LogisticsDashboard | null = null;

  constructor(
    private logistics: LogisticsService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.error = '';
    this.logistics.getDashboard().subscribe({
      next: (data) => {
        this.dashboard = data;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error cargando dashboard:', err);
        this.error = err.error?.error || err.message || 'No fue posible cargar el dashboard.';
        this.loading = false;
      }
    });
  }

  toggleAvailability(): void {
    if (this.togglingAvailability || !this.dashboard) return;
    const newValue = !this.dashboard.is_available;
    this.togglingAvailability = true;
    this.dashboard.is_available = newValue;

    this.logistics.setAvailability(newValue).subscribe({
      next: (res) => {
        if (this.dashboard) {
          this.dashboard.is_available = res.is_available;
        }
        this.togglingAvailability = false;
      },
      error: (err: any) => {
        console.error('Error actualizando disponibilidad:', err);
        if (this.dashboard) {
          this.dashboard.is_available = !newValue;
        }
        this.togglingAvailability = false;
      }
    });
  }

  acceptTransfer(id: number): void {
    this.logistics.aceptarTraslado(id).subscribe({
      next: () => this.loadDashboard(),
      error: (err: any) => {
        console.error('Error aceptando traslado:', err);
        this.error = err.error?.error || 'No se pudo aceptar el traslado.';
      }
    });
  }

  completeTransfer(id: number): void {
    this.logistics.completarTraslado(id).subscribe({
      next: () => this.loadDashboard(),
      error: (err: any) => {
        console.error('Error completando traslado:', err);
        this.error = err.error?.error || 'No se pudo completar el traslado.';
      }
    });
  }

  openOSM(trip: any): void {
    if (!trip) return;
    const target = trip.target_point?.address || trip.origin_point?.address || '';
    const url = `https://www.openstreetmap.org/search?query=${encodeURIComponent(target)}`;
    window.open(url, '_blank');
  }

  // ── Safe Getters ──

  get stats(): DashboardStats {
    return this.dashboard?.stats ?? {
      completed_today: 0,
      pending: 0,
      distance_today: 0,
      level: 1
    };
  }

  get currentTrip(): LogisticsAlert | null {
    return this.dashboard?.current_trip ?? null;
  }

  get pendingAlerts(): LogisticsAlert[] {
    return this.dashboard?.pending_alerts ?? [];
  }

  get history(): LogisticsAlert[] {
    return this.dashboard?.history ?? [];
  }

  // ── Helpers ──

  priorityClass(priority: string): string {
    return { ALTA: 'badge-red', MEDIA: 'badge-amber', BAJA: 'badge-green' }[priority] ?? 'badge-gray';
  }

  priorityLabel(priority: string): string {
    return { ALTA: 'Alta', MEDIA: 'Media', BAJA: 'Baja' }[priority] ?? priority;
  }

  statusClass(status: string): string {
    return {
      PENDIENTE: 'badge-amber',
      ACEPTADA: 'badge-blue',
      EN_PROCESO: 'badge-blue',
      COMPLETADA: 'badge-green'
    }[status] ?? 'badge-gray';
  }

  statusLabel(status: string): string {
    return {
      PENDIENTE: 'Pendiente',
      ACEPTADA: 'Aceptada',
      EN_PROCESO: 'En proceso',
      COMPLETADA: 'Completada'
    }[status] ?? status;
  }

  formatDate(date: string | null): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
  }

  timeAgo(date: string): string {
    if (!date) return '-';
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return 'Hace unos segundos';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    return `Hace ${Math.floor(diff / 86400)} días`;
  }

  capacityBarColor(pct: number): string {
    if (pct >= 86) return '#EF5350';
    if (pct >= 61) return '#FFA726';
    return '#2E7D32';
  }
}
