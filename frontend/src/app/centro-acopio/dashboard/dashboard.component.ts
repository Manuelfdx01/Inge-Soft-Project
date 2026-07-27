import { Component, OnInit, signal } from '@angular/core';
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
  readonly dashboardData = signal<CentroDashboard | null>(null);
  readonly loading = signal(true);

  constructor(private centroService: CentroAcopioService) {}

  ngOnInit(): void {
    this.centroService.getDashboard().subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando dashboard:', err);
        this.loading.set(false);
      }
    });
  }

  getBarColor(pct: number): string {
    if (pct >= 86) return '#EF5350';
    if (pct >= 61) return '#FFA726';
    return '#2E7D32';
  }
}
