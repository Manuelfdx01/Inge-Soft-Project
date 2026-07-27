import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CentroAcopioService } from '../../core/services/centro-acopio.service';
import { CollectionPoint } from '../../core/services/collection-points.service';

@Component({
  selector: 'app-centro-estado',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <h2>🔄 Cambiar Estado del Centro</h2>
      <div *ngIf="loading">Cargando centro...</div>
      <div *ngIf="!loading && centro" class="card">
        <h3>{{ centro.name }}</h3>
        <p><strong>Estado Actual:</strong> <span class="badge">{{ centro.status }}</span></p>

        <div class="form-group">
          <label>Selecciona nuevo estado:</label>
          <select [(ngModel)]="selectedStatus">
            <option value="DISPONIBLE">🟢 Disponible</option>
            <option value="LLENO">🔴 Lleno</option>
            <option value="MANTENIMIENTO">🛠️ Mantenimiento</option>
            <option value="NORMAL">🟡 Normal</option>
          </select>
        </div>

        <button class="btn btn-primary" (click)="guardarEstado()">Actualizar Estado</button>
        <p class="success" *ngIf="successMsg">✅ {{ successMsg }}</p>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; font-family: sans-serif; }
    .card { background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 500px; }
    .badge { background: #10b981; color: #fff; padding: 4px 10px; border-radius: 12px; font-weight: bold; }
    .form-group { margin: 16px 0; display: flex; flex-direction: column; gap: 8px; }
    select { padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; }
    .btn-primary { padding: 10px 18px; border-radius: 8px; border: none; background: #10b981; color: #fff; cursor: pointer; }
    .success { color: #10b981; font-weight: bold; margin-top: 10px; }
  `]
})
export class EstadoComponent implements OnInit {
  centro: CollectionPoint | null = null;
  selectedStatus = 'DISPONIBLE';
  loading = true;
  successMsg = '';

  constructor(private centroService: CentroAcopioService) {}

  ngOnInit(): void {
    this.centroService.getMiCentro().subscribe({
      next: (data) => {
        this.centro = data;
        this.selectedStatus = data.status;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  guardarEstado(): void {
    if (!this.centro) return;
    this.centroService.updateEstado(this.centro.id, this.selectedStatus).subscribe({
      next: (res) => {
        this.centro!.status = res.status;
        this.successMsg = 'Estado cambiado y recicladores notificados.';
      }
    });
  }
}
