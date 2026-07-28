import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CentroAcopioService, CentroDashboard } from '../../core/services/centro-acopio.service';
import { CollectionPointsService, WasteType } from '../../core/services/collection-points.service';

interface MaterialOption {
  key: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-centro-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class CentroDashboardComponent implements OnInit {
  readonly dashboardData = signal<CentroDashboard | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly successMsg = signal('');
  readonly errorMsg = signal('');

  readonly allWasteTypes = signal<WasteType[]>([]);
  readonly selectedWasteTypeIds = signal<(number | string)[]>([]);

  // Campos editables del Centro
  formName = '';
  formAddress = '';
  formLat = 4.6097;
  formLng = -74.0817;
  formSchedule = '';
  formPhone = '';
  formStatus = 'DISPONIBLE';
  formCapacityMax = 2000;
  formCapacityCurrent = 0;

  // Precios por material ($/kg)
  precios: Record<string, number> = {
    PLASTICO: 0,
    VIDRIO: 0,
    PAPEL: 0,
    METAL: 0,
    ORGANICO: 0,
    ELECTRONICO: 0,
  };

  readonly materialesList: MaterialOption[] = [
    { key: 'PLASTICO',    label: 'Plástico',      icon: '🧴' },
    { key: 'VIDRIO',      label: 'Vidrio',         icon: '🫙' },
    { key: 'PAPEL',       label: 'Papel / Cartón', icon: '📄' },
    { key: 'METAL',       label: 'Metal',          icon: '⚙️' },
    { key: 'ORGANICO',    label: 'Orgánico',       icon: '🌿' },
    { key: 'ELECTRONICO', label: 'Electrónico',   icon: '💻' },
  ];

  readonly statusOptions = [
    { value: 'DISPONIBLE',   label: '🟢 Disponible',   color: '#10b981' },
    { value: 'LLENO',        label: '🔴 Lleno',        color: '#ef4444' },
    { value: 'MANTENIMIENTO', label: '🟡 Mantenimiento', color: '#f59e0b' },
    { value: 'NORMAL',       label: '🔵 Normal',       color: '#3b82f6' },
  ];

  activeTab: 'general' | 'capacidad' | 'materiales' | 'precios' = 'general';

  constructor(
    private centroService: CentroAcopioService,
    private pointsService: CollectionPointsService
  ) {}

  ngOnInit(): void {
    this.cargarDashboard();
    this.cargarWasteTypes();
  }

  cargarDashboard(): void {
    this.centroService.getDashboard().subscribe({
      next: (data: CentroDashboard) => {
        this.dashboardData.set(data);
        if (data.centro) {
          const c = data.centro;
          this.formName = c.name || '';
          this.formAddress = c.address || '';
          this.formLat = c.latitude || 4.6097;
          this.formLng = c.longitude || -74.0817;
          this.formSchedule = c.schedule || '';
          this.formPhone = c.phone || '';
          this.formStatus = c.status || 'DISPONIBLE';
          this.formCapacityMax = c.capacity_max || 2000;
          this.formCapacityCurrent = c.capacity_current || 0;

          if (c.waste_types) {
            this.selectedWasteTypeIds.set(c.waste_types.map((w: WasteType) => w.id));
          }

          if (c.precio_kg) {
            for (const m of this.materialesList) {
              this.precios[m.key] = c.precio_kg[m.key] ?? 0;
            }
          }
        }
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error cargando dashboard:', err);
        this.errorMsg.set('No se pudo cargar la información del centro.');
        this.loading.set(false);
      }
    });
  }

  cargarWasteTypes(): void {
    this.pointsService.getWasteTypes().subscribe({
      next: (types: WasteType[]) => this.allWasteTypes.set(types),
      error: (err: any) => console.error('Error cargando tipos de residuo:', err)
    });
  }

  toggleWasteType(id: number | string): void {
    const current = this.selectedWasteTypeIds();
    if (current.includes(id)) {
      this.selectedWasteTypeIds.set(current.filter((i: number | string) => i !== id));
    } else {
      this.selectedWasteTypeIds.set([...current, id]);
    }
  }

  isWasteTypeSelected(id: number | string): boolean {
    return this.selectedWasteTypeIds().includes(id);
  }

  get capacityPct(): number {
    if (!this.formCapacityMax || this.formCapacityMax <= 0) return 0;
    return Math.round((this.formCapacityCurrent / this.formCapacityMax) * 100);
  }

  getBarColor(pct: number): string {
    if (pct >= 86) return '#EF5350';
    if (pct >= 61) return '#FFA726';
    return '#2E7D32';
  }

  guardarTodo(): void {
    this.saving.set(true);
    this.successMsg.set('');
    this.errorMsg.set('');

    const payload = {
      name: this.formName,
      address: this.formAddress,
      latitude: Number(this.formLat),
      longitude: Number(this.formLng),
      schedule: this.formSchedule,
      phone: this.formPhone,
      status: this.formStatus,
      capacity_max: Number(this.formCapacityMax),
      capacity_current: Number(this.formCapacityCurrent),
      waste_type_ids: this.selectedWasteTypeIds(),
      precio_kg: this.precios,
    };

    this.centroService.updateMiCentro(payload as any).subscribe({
      next: (updatedPoint: any) => {
        this.successMsg.set('¡Información pública del centro actualizada exitosamente! Todos los cambios se reflejan inmediatamente en el mapa y otros módulos.');
        this.saving.set(false);
        this.cargarDashboard();
      },
      error: (err: any) => {
        console.error('Error guardando cambios del centro:', err);
        this.errorMsg.set('Hubo un error al guardar los cambios. Revisa los datos ingresados.');
        this.saving.set(false);
      }
    });
  }
}
