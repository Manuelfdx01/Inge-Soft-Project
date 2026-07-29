import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  CollectionPointsService,
  CollectionPoint
} from '../../core/services/collection-points.service';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './report.component.html',
  styleUrl: './report.component.scss'
})
export class ReportComponent implements OnInit {

  loading = false;
  success = false;
  error = '';

  points: CollectionPoint[] = [];

  report = {
    point: '' as string | number,
    type: 'OTRO',
    description: ''
  };

  readonly reportTypes = [
    { value: 'DANO',           label: '🔨 Daño en contenedor' },
    { value: 'MAL_USO',        label: '⚠️ Mal uso' },
    { value: 'DESBORDAMIENTO', label: '🌊 Desbordamiento' },
    { value: 'OTRO',           label: '📋 Otro' },
  ];

  constructor(
    private pointsService: CollectionPointsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPoints();
  }

  loadPoints(): void {
    this.pointsService.getAll().subscribe({
      next: (data) => {
        this.points = data;
        if (data.length) {
          this.report.point = data[0].id;
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'No fue posible cargar los centros de reciclaje.';
        this.cdr.markForCheck();
      }
    });
  }

  submit(): void {
    if (!this.report.point) {
      this.error = 'Por favor selecciona un centro de reciclaje.';
      return;
    }
    if (!this.report.description.trim()) {
      this.error = 'Por favor describe el problema.';
      return;
    }

    this.loading = true;
    this.success = false;
    this.error = '';

    this.pointsService.createReport(
      this.report.point.toString(),
      this.report.type,
      this.report.description
    ).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        this.report.description = '';
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err.error?.error || 'No fue posible enviar el reporte.';
        this.cdr.markForCheck();
      }
    });
  }
}
