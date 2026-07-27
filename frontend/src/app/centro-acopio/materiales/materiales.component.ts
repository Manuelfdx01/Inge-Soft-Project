import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { CentroAcopioService } from '../../core/services/centro-acopio.service';
import { CollectionPoint, CollectionPointsService, WasteType } from '../../core/services/collection-points.service';

@Component({
  selector: 'app-centro-materiales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './materiales.component.html',
  styleUrl: './materiales.component.scss'
})
export class MaterialesComponent implements OnInit {
  readonly centro = signal<CollectionPoint | null>(null);
  readonly allWasteTypes = signal<WasteType[]>([]);
  readonly selectedIds = signal<number[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly successMsg = signal('');
  readonly errorMsg = signal('');

  constructor(
    private centroService: CentroAcopioService,
    private pointsService: CollectionPointsService
  ) {}

  ngOnInit(): void {
    forkJoin({
      types: this.pointsService.getWasteTypes(),
      centro: this.centroService.getMiCentro()
    }).subscribe({
      next: ({ types, centro }) => {
        this.allWasteTypes.set(types);
        this.centro.set(centro);
        this.selectedIds.set(centro.waste_types.map((w: any) => Number(w.id)));
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('Error al cargar los datos. Intenta de nuevo.');
        this.loading.set(false);
      }
    });
  }

  isAccepted(id: any): boolean {
    return this.selectedIds().includes(Number(id));
  }

  toggle(id: any): void {
    const numId = Number(id);
    if (this.isAccepted(numId)) {
      this.selectedIds.update(ids => ids.filter(i => i !== numId));
    } else {
      this.selectedIds.update(ids => [...ids, numId]);
    }
  }

  guardarMateriales(): void {
    const c = this.centro();
    if (!c) return;
    this.saving.set(true);
    this.successMsg.set('');
    this.errorMsg.set('');
    this.centroService.updateMateriales(c.id, this.selectedIds()).subscribe({
      next: (res) => {
        this.centro.set(res);
        this.selectedIds.set(res.waste_types.map((w: any) => Number(w.id)));
        this.successMsg.set('Materiales actualizados. La lista de aceptados es visible para los recicladores.');
        this.saving.set(false);
      },
      error: () => {
        this.errorMsg.set('Error al guardar los materiales.');
        this.saving.set(false);
      }
    });
  }
}
