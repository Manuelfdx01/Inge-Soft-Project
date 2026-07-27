import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CentroAcopioService, CentroReporte } from '../../core/services/centro-acopio.service';

@Component({
  selector: 'app-centro-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss'
})
export class ReportesComponent implements OnInit {
  readonly reports = signal<CentroReporte[]>([]);
  readonly loading = signal(true);
  readonly errorMsg = signal('');
  readonly filter = signal<string>('TODOS');

  readonly statusOptions = ['TODOS', 'PENDIENTE', 'EN_REVISION', 'RESUELTO'];

  readonly filteredReports = signal<CentroReporte[]>([]);

  constructor(private centroService: CentroAcopioService) {}

  ngOnInit(): void {
    this.centroService.getReportes().subscribe({
      next: (data) => {
        this.reports.set(data);
        this.filteredReports.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('No se pudieron cargar los reportes.');
        this.loading.set(false);
      }
    });
  }

  setFilter(status: string): void {
    this.filter.set(status);
    const all = this.reports();
    this.filteredReports.set(
      status === 'TODOS' ? all : all.filter(r => r.status === status)
    );
  }

  changeStatus(reportId: number, newStatus: string): void {
    this.centroService.updateReporteEstado(reportId, newStatus).subscribe({
      next: () => {
        this.reports.update(list =>
          list.map(r => r.id === reportId ? { ...r, status: newStatus } : r)
        );
        // Re-apply filter
        this.setFilter(this.filter());
      }
    });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      EN_REVISION: 'En revisión',
      RESUELTO: 'Resuelto'
    };
    return map[status] ?? status;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      PENDIENTE: 'badge--pending',
      EN_REVISION: 'badge--review',
      RESUELTO: 'badge--done'
    };
    return map[status] ?? '';
  }
}
