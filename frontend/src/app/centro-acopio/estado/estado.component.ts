import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CentroAcopioService } from '../../core/services/centro-acopio.service';
import { CollectionPoint } from '../../core/services/collection-points.service';

interface StatusOption {
  value: string;
  label: string;
  icon: string;
  description: string;
  color: string;
}

@Component({
  selector: 'app-centro-estado',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estado.component.html',
  styleUrl: './estado.component.scss'
})
export class EstadoComponent implements OnInit {
  readonly centro = signal<CollectionPoint | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly successMsg = signal('');
  readonly errorMsg = signal('');

  selectedStatus = 'DISPONIBLE';

  readonly statusOptions: StatusOption[] = [
    {
      value: 'DISPONIBLE',
      label: 'Disponible',
      icon: '🟢',
      description: 'El centro está abierto y recibe material normalmente.',
      color: '#10b981'
    },
    {
      value: 'LLENO',
      label: 'Lleno',
      icon: '🔴',
      description: 'Capacidad al máximo. No se recibe material hasta liberar espacio.',
      color: '#ef4444'
    },
    {
      value: 'MANTENIMIENTO',
      label: 'Mantenimiento',
      icon: '🛠️',
      description: 'Temporalmente fuera de servicio por tareas de mantenimiento.',
      color: '#f59e0b'
    },
    {
      value: 'NORMAL',
      label: 'Normal',
      icon: '🟡',
      description: 'Operación normal con capacidad parcial disponible.',
      color: '#3b82f6'
    },
  ];

  constructor(private centroService: CentroAcopioService) {}

  ngOnInit(): void {
    this.centroService.getMiCentro().subscribe({
      next: (data) => {
        this.centro.set(data);
        this.selectedStatus = data.status;
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('No se pudo cargar el estado del centro.');
        this.loading.set(false);
      }
    });
  }

  get currentOption(): StatusOption {
    return this.statusOptions.find(o => o.value === this.selectedStatus)
      ?? this.statusOptions[0];
  }

  guardarEstado(): void {
    const c = this.centro();
    if (!c) return;
    this.saving.set(true);
    this.successMsg.set('');
    this.errorMsg.set('');
    this.centroService.updateEstado(c.id, this.selectedStatus).subscribe({
      next: (res) => {
        this.centro.update(prev => prev ? { ...prev, status: res.status } : null);
        this.successMsg.set('Estado actualizado a "' + res.status + '". Los recicladores han sido notificados.');
        this.saving.set(false);
      },
      error: () => {
        this.errorMsg.set('Error al actualizar el estado.');
        this.saving.set(false);
      }
    });
  }
}
