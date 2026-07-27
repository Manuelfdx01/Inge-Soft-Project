import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CentroAcopioService } from '../../core/services/centro-acopio.service';
import { CollectionPoint } from '../../core/services/collection-points.service';

@Component({
  selector: 'app-centro-capacidad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <h2>⚖️ Actualizar Capacidad del Centro</h2>
      <div *ngIf="loading">Cargando datos...</div>
      <div *ngIf="!loading && centro" class="card">
        <h3>{{ centro.name }}</h3>
        <p><strong>Capacidad Actual:</strong> {{ centro.capacity_current }} / {{ centro.capacity_max }} kg ({{ centro.capacity_pct }}%)</p>

        <div class="form-group">
          <label>Nueva Capacidad Máxima (kg):</label>
          <input type="number" [(ngModel)]="newMax" min="1" />
          <button class="btn" (click)="saveMax()">Guardar Capacidad Máxima</button>
        </div>

        <hr />

        <div class="form-group">
          <label>Nueva Capacidad Actual (kg):</label>
          <input type="number" [(ngModel)]="newCurrent" min="0" [max]="newMax" />
          <button class="btn btn-primary" (click)="saveCurrent()">Actualizar Capacidad Actual</button>
        </div>

        <p class="success" *ngIf="successMsg">✅ {{ successMsg }}</p>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; font-family: sans-serif; }
    .card { background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 500px; }
    .form-group { margin: 16px 0; display: flex; flex-direction: column; gap: 8px; }
    input { padding: 8px 12px; border-radius: 8px; border: 1px solid #cbd5e1; }
    .btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; background: #e2e8f0; }
    .btn-primary { background: #10b981; color: #fff; }
    .success { color: #10b981; font-weight: bold; }
  `]
})
export class CapacidadComponent implements OnInit {
  centro: CollectionPoint | null = null;
  loading = true;
  newMax = 100;
  newCurrent = 0;
  successMsg = '';

  constructor(private centroService: CentroAcopioService) {}

  ngOnInit(): void {
    this.centroService.getMiCentro().subscribe({
      next: (data) => {
        this.centro = data;
        this.newMax = data.capacity_max;
        this.newCurrent = data.capacity_current;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  saveMax(): void {
    if (!this.centro) return;
    this.centroService.updateCapacidadMax(this.centro.id, this.newMax).subscribe({
      next: (res) => {
        this.centro = res;
        this.successMsg = 'Capacidad máxima actualizada.';
      }
    });
  }

  saveCurrent(): void {
    if (!this.centro) return;
    this.centroService.updateCapacidadActual(this.centro.id, this.newCurrent).subscribe({
      next: (res) => {
        this.centro!.capacity_current = res.capacity_current;
        this.centro!.capacity_pct = res.capacity_pct;
        this.centro!.status = res.status;
        this.successMsg = 'Capacidad actualizada correctamente.';
      }
    });
  }
}
