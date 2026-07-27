import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CentroAcopioService, CentroReporte } from '../../core/services/centro-acopio.service';

@Component({
  selector: 'app-centro-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <h2>📋 Reportes Recibidos</h2>
      <div *ngIf="loading">Cargando reportes...</div>

      <div *ngIf="!loading" class="reports-list">
        <div *ngFor="let item of reports" class="card">
          <div class="card-header">
            <strong>📢 {{ item.type }}</strong>
            <div class="status-wrap">
              <select [ngModel]="item.status" (ngModelChange)="changeStatus(item.id, $event)">
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="EN_REVISION">EN REVISION</option>
                <option value="RESUELTO">RESUELTO</option>
              </select>
            </div>
          </div>
          <p class="desc">{{ item.description }}</p>
          <div class="card-footer">
            <span class="user">Por: {{ item.user || 'Ciudadano' }}</span>
            <span class="date">{{ item.created_at | date:'short' }}</span>
          </div>
        </div>

        <div *ngIf="reports.length === 0" class="empty">
          No hay reportes asignados a tu centro.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; font-family: sans-serif; }
    .reports-list { display: flex; flex-direction: column; gap: 12px; max-width: 600px; }
    .card { background: #fff; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    select { padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 12px; }
    .desc { font-size: 13px; color: #475569; margin: 0 0 8px 0; }
    .card-footer { display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; }
    .empty { color: #94a3b8; font-style: italic; }
  `]
})
export class ReportesComponent implements OnInit {
  reports: CentroReporte[] = [];
  loading = true;

  constructor(private centroService: CentroAcopioService) {}

  ngOnInit(): void {
    this.centroService.getReportes().subscribe({
      next: (data) => {
        this.reports = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  changeStatus(reportId: number, newStatus: string): void {
    this.centroService.updateReporteEstado(reportId, newStatus).subscribe({
      next: () => {
        const found = this.reports.find(r => r.id === reportId);
        if (found) found.status = newStatus;
      }
    });
  }
}
