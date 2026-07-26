import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  LogisticsService,
  DashboardPoint
} from '../../core/services/logistics.service';

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

  points: DashboardPoint[] = [];

  report = {
    point: 0,
    waste_type: 'PLASTICO',
    capacity_current: 80,
    notes: ''
  };

  wasteTypes = [
    { value: 'PLASTICO', label: 'Plástico' },
    { value: 'PAPEL', label: 'Papel' },
    { value: 'VIDRIO', label: 'Vidrio' },
    { value: 'METAL', label: 'Metal' },
    { value: 'ORGANICO', label: 'Orgánico' },
    { value: 'MIXTO', label: 'Mixto' }
  ];

  constructor(private logistics: LogisticsService) {}

  ngOnInit(): void {
    this.loadPoints();
  }

  loadPoints(): void {
    this.logistics.getNearbyPoints().subscribe({
      next: (points) => {
        this.points = points;
        if (points.length) {
          this.report.point = points[0].id;
        }
      },
      error: () => {
        this.error = 'No fue posible cargar los puntos de reciclaje.';
      }
    });
  }

  get capacityColor(): string {
    const val = this.report.capacity_current;
    if (val >= 86) return '#EF5350';
    if (val >= 61) return '#FFA726';
    return '#2E7D32';
  }

  submit(): void {
    if (!this.report.point) {
      this.error = 'Por favor selecciona un punto de reciclaje.';
      return;
    }

    this.loading = true;
    this.success = false;
    this.error = '';

    this.logistics.updateCapacity(
      Number(this.report.point),
      {
        capacity_current: Number(this.report.capacity_current),
        waste_type: this.report.waste_type,
        notes: this.report.notes
      }
    ).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        this.report.notes = '';
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err.error?.error || 'No fue posible enviar el reporte.';
      }
    });
  }
}
