import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CentroAcopioService } from '../../core/services/centro-acopio.service';
import { CollectionPoint } from '../../core/services/collection-points.service';

@Component({
  selector: 'app-centro-precios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <h2>💰 Gestionar Precios por Kilogramo</h2>
      <div *ngIf="loading">Cargando precios...</div>
      <div *ngIf="!loading && centro" class="card">
        <h3>{{ centro.name }}</h3>
        
        <div class="material-row" *ngFor="let item of materiales">
          <label><strong>{{ item.name }}:</strong></label>
          <input type="number" [(ngModel)]="precios[item.name]" placeholder="Precio en $" />
        </div>

        <button class="btn btn-primary" (click)="guardarPrecios()">Guardar Precios</button>
        <p class="success" *ngIf="successMsg">✅ {{ successMsg }}</p>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; font-family: sans-serif; }
    .card { background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 500px; }
    .material-row { display: flex; justify-content: space-between; align-items: center; margin: 12px 0; }
    input { width: 120px; padding: 6px 10px; border-radius: 6px; border: 1px solid #cbd5e1; }
    .btn-primary { padding: 10px 18px; border-radius: 8px; border: none; background: #10b981; color: #fff; cursor: pointer; margin-top: 12px; }
    .success { color: #10b981; font-weight: bold; margin-top: 10px; }
  `]
})
export class PreciosComponent implements OnInit {
  centro: CollectionPoint | null = null;
  loading = true;
  precios: Record<string, number> = {};
  successMsg = '';

  materiales = [
    { name: 'PLASTICO' },
    { name: 'VIDRIO' },
    { name: 'PAPEL' },
    { name: 'METAL' },
    { name: 'ORGANICO' }
  ];

  constructor(private centroService: CentroAcopioService) {}

  ngOnInit(): void {
    this.centroService.getMiCentro().subscribe({
      next: (data) => {
        this.centro = data;
        this.precios = data.precio_kg || {};
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  guardarPrecios(): void {
    if (!this.centro) return;
    this.centroService.updatePrecios(this.centro.id, this.precios).subscribe({
      next: (res) => {
        this.centro!.precio_kg = res.precio_kg;
        this.successMsg = 'Precios actualizados y recicladores notificados.';
      }
    });
  }
}
