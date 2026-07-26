import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  LogisticsService,
  LogisticsAlert
} from '../../core/services/logistics.service';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alerts.component.html',
  styleUrl: './alerts.component.scss'
})
export class AlertsComponent implements OnInit {

  loading = true;
  activeAlerts: LogisticsAlert[] = [];
  isAvailable = false;
  activeFilter: 'TODOS' | 'PENDIENTE' | 'ACEPTADA' | 'EN_PROCESO' = 'TODOS';
  actionLoading: number | null = null;

  filters = [
    { label: 'Todos', value: 'TODOS' },
    { label: 'Pendientes', value: 'PENDIENTE' },
    { label: 'Aceptadas', value: 'ACEPTADA' },
    { label: 'En proceso', value: 'EN_PROCESO' },
  ] as const;

  constructor(private logistics: LogisticsService) {}

  ngOnInit(): void {
    this.loadAvailability();
    this.loadAlerts();
  }

  loadAlerts(): void {
    this.loading = true;
    this.logistics.getAlerts().subscribe({
      next: (alerts) => {
        this.activeAlerts = alerts.filter(a =>
          a.status === 'PENDIENTE' || a.status === 'ACEPTADA' || a.status === 'EN_PROCESO'
        );
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  loadAvailability(): void {
    this.logistics.getAvailability().subscribe({
      next: (res) => { this.isAvailable = res.is_available; },
      error: (err) => console.error(err)
    });
  }

  toggleDisponibilidad(): void {
    const newVal = !this.isAvailable;
    this.isAvailable = newVal;
    this.logistics.setAvailability(newVal).subscribe({
      next: (res) => { this.isAvailable = res.is_available; },
      error: (err) => {
        console.error(err);
        this.isAvailable = !newVal;
      }
    });
  }

  setFilter(filter: 'TODOS' | 'PENDIENTE' | 'ACEPTADA' | 'EN_PROCESO'): void {
    this.activeFilter = filter;
  }

  get filteredAlerts(): LogisticsAlert[] {
    if (this.activeFilter === 'TODOS') return this.activeAlerts;
    return this.activeAlerts.filter(a => a.status === this.activeFilter);
  }

  countByStatus(status: string): number {
    if (status === 'TODOS') return this.activeAlerts.length;
    return this.activeAlerts.filter(a => a.status === status).length;
  }

  aceptar(alert: LogisticsAlert): void {
    this.actionLoading = alert.id;
    this.logistics.aceptarTraslado(alert.id).subscribe({
      next: () => { this.actionLoading = null; this.loadAlerts(); },
      error: (err) => { console.error(err); this.actionLoading = null; }
    });
  }

  completar(alert: LogisticsAlert): void {
    this.actionLoading = alert.id;
    this.logistics.completarTraslado(alert.id).subscribe({
      next: () => { this.actionLoading = null; this.loadAlerts(); },
      error: (err) => { console.error(err); this.actionLoading = null; }
    });
  }

  openOSM(alert: LogisticsAlert): void {
    const target = alert.target_point?.address || alert.origin_point?.address || '';
    window.open(`https://www.openstreetmap.org/search?query=${encodeURIComponent(target)}`, '_blank');
  }

  priorityLabel(p: string): string {
    return { ALTA: 'Alta', MEDIA: 'Media', BAJA: 'Baja' }[p] ?? p;
  }

  priorityClass(p: string): string {
    return { ALTA: 'priority-high', MEDIA: 'priority-medium', BAJA: 'priority-low' }[p] ?? 'priority-low';
  }

  statusLabel(s: string): string {
    return {
      PENDIENTE: 'Pendiente', ACEPTADA: 'Aceptada',
      EN_PROCESO: 'En proceso', COMPLETADA: 'Completada'
    }[s] ?? s;
  }

  statusClass(s: string): string {
    return {
      PENDIENTE: 'badge-amber', ACEPTADA: 'badge-blue',
      EN_PROCESO: 'badge-blue', COMPLETADA: 'badge-green'
    }[s] ?? 'badge-gray';
  }

  timeAgo(date: string): string {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return 'Hace unos segundos';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    return `Hace ${Math.floor(diff / 86400)} días`;
  }
}
