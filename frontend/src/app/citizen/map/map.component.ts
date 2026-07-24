import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CollectionPointsService, CollectionPoint } from '../../core/services/collection-points.service';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './map.component.html',
})
export class MapComponent implements OnInit {
  points: CollectionPoint[] = [];
  filteredPoints: CollectionPoint[] = [];
  selectedPoint: CollectionPoint | null = null;
  activeFilter = 'TODOS';
  loading = true;

  filters = [
    { label: 'Todos',     value: 'TODOS' },
    { label: '🔵 Vidrio', value: 'VIDRIO' },
    { label: '🟠 Plástico', value: 'PLASTICO' },
    { label: '🟣 Papel',  value: 'PAPEL' },
    { label: '⚪ Metal',  value: 'METAL' },
    { label: '🟢 Orgánico', value: 'ORGANICO' },
  ];

  mapCenter = { lat: 4.7110, lng: -74.0721 };
  mapZoom = 13;

  constructor(private pointsService: CollectionPointsService) {}

  ngOnInit(): void {
    this.loadPoints();
  }

  loadPoints(): void {
    this.loading = true;
    this.pointsService.getAll().subscribe({
      next: (data) => {
        this.points = data;
        this.filteredPoints = data;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  applyFilter(filter: string): void {
    this.activeFilter = filter;
    if (filter === 'TODOS') {
      this.filteredPoints = this.points;
      return;
    }
    this.filteredPoints = this.points.filter(p =>
      p.waste_types.some(w => w.name === filter)
    );
  }

  selectPoint(point: CollectionPoint): void {
    this.selectedPoint = point;
  }

  closePopup(): void {
    this.selectedPoint = null;
  }

  getPinColor(point: CollectionPoint): string {
    const colors: Record<string, string> = {
      NORMAL:  '#2E7D32',
      ALERTA:  '#FFA726',
      CRITICO: '#EF5350',
    };
    return colors[point.status] ?? '#2E7D32';
  }

  getBarColor(pct: number): string {
    if (pct >= 86) return '#EF5350';
    if (pct >= 61) return '#FFA726';
    return '#2E7D32';
  }

  get pointsSortedByCapacity(): CollectionPoint[] {
    return [...this.filteredPoints].sort((a, b) => b.capacity_pct - a.capacity_pct);
  }
}
