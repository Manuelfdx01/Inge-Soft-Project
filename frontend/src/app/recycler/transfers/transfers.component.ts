import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  LogisticsService,
  LogisticsAlert
} from '../../core/services/logistics.service';

@Component({
  selector: 'app-transfers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transfers.component.html',
  styleUrl: './transfers.component.scss'
})
export class TransfersComponent implements OnInit {

  loading = true;
  error = '';
  transfers: LogisticsAlert[] = [];

  constructor(private logistics: LogisticsService) {}

  ngOnInit(): void {
    this.loadTransfers();
  }

  loadTransfers(): void {
    this.loading = true;
    this.error = '';
    this.logistics.getAlerts().subscribe({
      next: (alerts) => {
        this.transfers = alerts || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando traslados:', err);
        this.error = err.error?.error || err.message || 'No fue posible cargar los traslados.';
        this.loading = false;
      }
    });
  }

  openOSM(t: LogisticsAlert): void {
    const target = t.target_point?.address || t.origin_point?.address || '';
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
    if (!date) return '-';
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return 'Hace unos segundos';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`;
    return `Hace ${Math.floor(diff / 86400)} días`;
  }
}
