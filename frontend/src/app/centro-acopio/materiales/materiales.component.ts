import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CentroAcopioService } from '../../core/services/centro-acopio.service';
import { CollectionPoint, CollectionPointsService, WasteType } from '../../core/services/collection-points.service';

@Component({
  selector: 'app-centro-materiales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <h2>♻️ Gestionar Materiales Aceptados</h2>
      <div *ngIf="loading">Cargando materiales...</div>
      <div *ngIf="!loading && centro" class="card">
        <h3>{{ centro.name }}</h3>

        <div class="checkbox-group">
          <label *ngFor="let type of allWasteTypes" class="checkbox-label">
            <input type="checkbox" [checked]="isAccepted(type.id)" (change)="toggle(type.id)" />
            <span>{{ type.icon }} {{ type.name }}</span>
          </label>
        </div>

        <button class="btn btn-primary" (click)="guardarMateriales()">Guardar Materiales</button>
        <p class="success" *ngIf="successMsg">✅ {{ successMsg }}</p>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; font-family: sans-serif; }
    .card { background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 500px; }
    .checkbox-group { display: flex; flex-direction: column; gap: 12px; margin: 16px 0; }
    .checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; }
    .btn-primary { padding: 10px 18px; border-radius: 8px; border: none; background: #10b981; color: #fff; cursor: pointer; }
    .success { color: #10b981; font-weight: bold; margin-top: 10px; }
  `]
})
export class MaterialesComponent implements OnInit {
  centro: CollectionPoint | null = null;
  allWasteTypes: WasteType[] = [];
  selectedIds: number[] = [];
  loading = true;
  successMsg = '';

  constructor(
    private centroService: CentroAcopioService,
    private pointsService: CollectionPointsService
  ) {}

  ngOnInit(): void {
    this.pointsService.getWasteTypes().subscribe((types: any) => {
      this.allWasteTypes = types;
      this.centroService.getMiCentro().subscribe({
        next: (data) => {
          this.centro = data;
          this.selectedIds = data.waste_types.map((w: any) => Number(w.id));
          this.loading = false;
        },
        error: () => this.loading = false
      });
    });
  }

  isAccepted(id: any): boolean {
    return this.selectedIds.includes(Number(id));
  }

  toggle(id: any): void {
    const numId = Number(id);
    if (this.isAccepted(numId)) {
      this.selectedIds = this.selectedIds.filter(i => i !== numId);
    } else {
      this.selectedIds.push(numId);
    }
  }

  guardarMateriales(): void {
    if (!this.centro) return;
    this.centroService.updateMateriales(this.centro.id, this.selectedIds).subscribe({
      next: (res) => {
        this.centro = res;
        this.successMsg = 'Materiales actualizados.';
      }
    });
  }
}
