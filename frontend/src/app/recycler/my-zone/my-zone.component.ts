import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  LogisticsService,
  DashboardPoint
} from '../../core/services/logistics.service';

@Component({
  selector: 'app-my-zone',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './my-zone.component.html',
  styleUrl: './my-zone.component.scss'
})
export class MyZoneComponent implements OnInit {

  loading = false;

  points: DashboardPoint[] = [];

  constructor(
    private logistics: LogisticsService
  ) {}

  ngOnInit(): void {
    this.loadPoints();
  }

  loadPoints(): void {

    this.loading = true;

    this.logistics.getDashboard().subscribe({

      next: (dashboard) => {

        this.points = dashboard.nearby_points;

        this.loading = false;

      },

      error: () => {

        this.loading = false;

      }

    });

  }

}
