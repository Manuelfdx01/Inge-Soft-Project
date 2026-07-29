import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CentroAcopioService } from '../../core/services/centro-acopio.service';
import { CollectionPoint } from '../../core/services/collection-points.service';
import { ToastService } from '../../core/services/toast.service';

interface MaterialRow {
  key: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-centro-precios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './precios.component.html',
  styleUrl: './precios.component.scss'
})
export class PreciosComponent implements OnInit {
  readonly centro = signal<CollectionPoint | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMsg = signal('');
  readonly successMsg = signal('');

  precios: Record<string, number> = {};

  readonly materiales: MaterialRow[] = [
    { key: 'PLASTICO',  label: 'Plástico',    icon: '🧴' },
    { key: 'VIDRIO',    label: 'Vidrio',       icon: '🫙' },
    { key: 'PAPEL',     label: 'Papel / Cartón', icon: '📄' },
    { key: 'METAL',     label: 'Metal',        icon: '⚙️' },
    { key: 'ORGANICO',  label: 'Orgánico',     icon: '🌿' },
    { key: 'ELECTRONICO', label: 'Electrónico', icon: '💻' },
  ];

  constructor(
    private centroService: CentroAcopioService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.centroService.getMiCentro().subscribe({
      next: (data) => {
        this.centro.set(data);
        for (const m of this.materiales) {
          this.precios[m.key] = data.precio_kg?.[m.key] ?? 0;
        }
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('No se pudo cargar la información del centro.');
        this.loading.set(false);
        this.toast.error('No se pudo cargar la información del centro.');
      }
    });
  }

  guardarPrecios(): void {
    const c = this.centro();
    if (!c) return;
    this.saving.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');
    const payload: Record<string, number> = {};
    for (const [key, val] of Object.entries(this.precios)) {
      if (val > 0) payload[key] = val;
    }
    this.centroService.updatePrecios(c.id, payload).subscribe({
      next: (res) => {
        this.centro.update(prev => prev ? { ...prev, precio_kg: res.precio_kg } : null);
        this.saving.set(false);
        const msg = 'Precios actualizados. Los recicladores verán las tarifas actualizadas.';
        this.successMsg.set(msg);
        this.toast.success(msg);
      },
      error: () => {
        this.errorMsg.set('Error al guardar los precios. Intenta de nuevo.');
        this.saving.set(false);
        this.toast.error('Error al guardar los precios.');
      }
    });
  }
}
