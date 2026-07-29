import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CentroAcopioService } from '../../core/services/centro-acopio.service';
import { CollectionPoint } from '../../core/services/collection-points.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-centro-capacidad',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './capacidad.component.html',
  styleUrl: './capacidad.component.scss'
})
export class CapacidadComponent implements OnInit {
  readonly centro = signal<CollectionPoint | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMsg = signal('');
  readonly successMsg = signal('');

  newMax = 100;
  newCurrent = 0;

  constructor(
    private centroService: CentroAcopioService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.centroService.getMiCentro().subscribe({
      next: (data) => {
        this.centro.set(data);
        this.newMax = data.capacity_max;
        this.newCurrent = data.capacity_current;
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('No se pudo cargar el centro. Intenta de nuevo.');
        this.loading.set(false);
        this.toast.error('No se pudo cargar el centro.');
      }
    });
  }

  get pct(): number {
    const c = this.centro();
    if (!c || c.capacity_max === 0) return 0;
    return Math.round((this.newCurrent / this.newMax) * 100);
  }

  get barColor(): string {
    const p = this.pct;
    if (p >= 86) return '#EF5350';
    if (p >= 61) return '#FFA726';
    return '#2E7D32';
  }

  saveMax(): void {
    const c = this.centro();
    if (!c) return;
    this.saving.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');
    this.centroService.updateCapacidadMax(c.id, this.newMax).subscribe({
      next: (res) => {
        this.centro.set(res);
        this.newMax = res.capacity_max;
        this.newCurrent = res.capacity_current;
        this.saving.set(false);
        this.successMsg.set('Capacidad máxima actualizada correctamente.');
        this.toast.success('Capacidad máxima actualizada correctamente.');
      },
      error: () => {
        this.errorMsg.set('Error al guardar. Intenta de nuevo.');
        this.saving.set(false);
        this.toast.error('Error al guardar la capacidad máxima.');
      }
    });
  }

  saveCurrent(): void {
    const c = this.centro();
    if (!c) return;
    this.saving.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');
    this.centroService.updateCapacidadActual(c.id, this.newCurrent).subscribe({
      next: (res) => {
        this.centro.update(prev => prev ? {
          ...prev,
          capacity_current: res.capacity_current,
          capacity_pct: res.capacity_pct,
          status: res.status
        } : null);
        this.saving.set(false);
        const msg = `Capacidad actual registrada. Estado: ${res.status}`;
        this.successMsg.set(msg);
        this.toast.success(msg);
      },
      error: () => {
        this.errorMsg.set('Error al actualizar la capacidad.');
        this.saving.set(false);
        this.toast.error('Error al actualizar la capacidad actual.');
      }
    });
  }
}
