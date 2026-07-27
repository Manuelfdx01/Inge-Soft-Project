import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CentroAcopioService, CentroDashboard } from '../../core/services/centro-acopio.service';

@Component({
  selector: 'app-centro-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class CentroDashboardComponent implements OnInit {
  dashboardData: CentroDashboard | null = null;
  loading = true;

  constructor(private centroService: CentroAcopioService) {}

  ngOnInit(): void {

  console.log('🚀 CentroDashboardComponent iniciado');

  this.centroService.getDashboard().subscribe({
    next: (data) => {
      console.log('✅ Respuesta del dashboard:', data);

      this.dashboardData = data;
      this.loading = false;

      console.log('loading =', this.loading);
      console.log('dashboardData =', this.dashboardData);
    },
    error: (err) => {
      console.error('❌ Error cargando dashboard:', err);
      this.loading = false;
    }
  });

}

  getBarColor(pct: number): string {
    if (pct >= 86) return '#EF5350';
    if (pct >= 61) return '#FFA726';
    return '#2E7D32';
  }
}
