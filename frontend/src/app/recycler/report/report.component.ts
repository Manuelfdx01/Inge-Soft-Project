import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  LogisticsService,
  CollectionPoint
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

  // Puntos disponibles
  points: CollectionPoint[] = [];

  report = {
    point: 0,
    waste_type: 'PLASTICO',
    capacity_current: 80,
    notes: ''
  };

  wasteTypes = [
    {
      value: 'PLASTICO',
      label: 'Plástico'
    },
    {
      value: 'PAPEL',
      label: 'Papel'
    },
    {
      value: 'VIDRIO',
      label: 'Vidrio'
    },
    {
      value: 'METAL',
      label: 'Metal'
    },
    {
      value: 'ORGANICO',
      label: 'Orgánico'
    },
    {
      value: 'MIXTO',
      label: 'Mixto'
    }
  ];

  constructor(
    private logistics: LogisticsService
  ) {}

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
        this.error = 'No fue posible cargar los puntos.';
      }

    });

  }

  submit(): void {

    this.loading = true;
    this.success = false;
    this.error = '';

    this.logistics.updateCapacity(

      this.report.point,

      {
        capacity_current: this.report.capacity_current,
        waste_type: this.report.waste_type,
        notes: this.report.notes
      }

    ).subscribe({

      next: () => {

        this.loading = false;
        this.success = true;

        this.report.capacity_current = 80;
        this.report.notes = '';

      },

      error: () => {

        this.loading = false;
        this.error = 'No fue posible enviar el reporte.';

      }

    });

  }

}
