import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';

import {
  LogisticsService,
  DashboardPoint
} from '../../core/services/logistics.service';

@Component({
  selector: 'app-my-zone',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './my-zone.component.html',
  styleUrl: './my-zone.component.scss'
})
export class MyZoneComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  loading = true;
  points: DashboardPoint[] = [];
  filteredPoints: DashboardPoint[] = [];
  selectedPoint: DashboardPoint | null = null;
  searchTerm = '';
  statusFilter = '';

  private map!: L.Map;
  private markersLayer = L.layerGroup();
  private markerMap = new Map<number, L.Marker>();

  constructor(private logistics: LogisticsService) {}

  ngOnInit(): void {
    this.loadPoints();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 100);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  loadPoints(): void {
    this.loading = true;
    this.logistics.getNearbyPoints().subscribe({
      next: (points: any[]) => {
        this.points = points.map(p => ({
          id: p.id,
          name: p.name,
          address: p.address,
          capacity: p.capacity ?? p.capacity_pct ?? 0,
          status: p.status || 'NORMAL',
          latitude: p.latitude ?? 7.1193,
          longitude: p.longitude ?? -73.1227,
        }));
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando puntos de mi zona:', err);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let result = [...this.points];

    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      result = result.filter(
        p => p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q)
      );
    }

    if (this.statusFilter) {
      result = result.filter(p => p.status === this.statusFilter);
    }

    this.filteredPoints = result;
    this.renderMarkers();
  }

  private initMap(): void {
    if (!this.mapContainer) return;

    this.map = L.map(this.mapContainer.nativeElement, {
      center: [7.1193, -73.1227],
      zoom: 13,
      zoomControl: false
    });

    L.control.zoom({ position: 'topright' }).addTo(this.map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19
    }).addTo(this.map);

    this.markersLayer.addTo(this.map);
    this.renderMarkers();
  }

  private renderMarkers(): void {
    if (!this.map) return;

    this.markersLayer.clearLayers();
    this.markerMap.clear();

    const source = this.filteredPoints.length ? this.filteredPoints : this.points;

    source.forEach(point => {
      if (!point.latitude || !point.longitude) return;

      const color = this.getBarColor(point.capacity);

      const icon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div class="pin-wrapper" style="--pin-color: ${color}">
            <div class="pin-head">
              <div class="pin-inner">${point.capacity}%</div>
            </div>
            <div class="pin-tail"></div>
          </div>`,
        iconSize: [36, 48],
        iconAnchor: [18, 48],
        popupAnchor: [0, -50]
      });

      const marker = L.marker([point.latitude, point.longitude], { icon })
        .addTo(this.markersLayer);

      marker.on('click', () => this.selectPoint(point));

      const popupHtml = `
        <div class="map-popup-card">
          <div class="popup-header">
            <span class="popup-name">${point.name}</span>
            <span class="popup-status popup-${(point.status || '').toLowerCase()}">${point.status}</span>
          </div>
          <div class="popup-address">📍 ${point.address}</div>
          <div class="popup-capacity-row">
            <span>Capacidad</span>
            <strong style="color: ${color}">${point.capacity}%</strong>
          </div>
          <div class="popup-progress">
            <div class="popup-progress-fill" style="width: ${point.capacity}%; background: ${color}"></div>
          </div>
        </div>`;

      marker.bindPopup(popupHtml, {
        className: 'modern-popup',
        maxWidth: 260,
        minWidth: 200,
        closeButton: true
      });

      this.markerMap.set(point.id, marker);
    });

    if (source.length) {
      const coords = source
        .filter(p => p.latitude && p.longitude)
        .map(p => [p.latitude, p.longitude] as L.LatLngTuple);

      if (coords.length) {
        this.map.fitBounds(L.latLngBounds(coords), { padding: [40, 40], maxZoom: 15 });
      }
    }
  }

  selectPoint(point: DashboardPoint): void {
    this.selectedPoint = point;

    if (point.latitude && point.longitude) {
      this.map?.flyTo([point.latitude, point.longitude], 16, { duration: 0.8 });
      const m = this.markerMap.get(point.id);
      if (m) {
        setTimeout(() => m.openPopup(), 300);
      }
    }
  }

  openOSM(point: DashboardPoint): void {
    if (point.latitude && point.longitude) {
      window.open(
        `https://www.openstreetmap.org/?mlat=${point.latitude}&mlon=${point.longitude}#map=17/${point.latitude}/${point.longitude}`,
        '_blank'
      );
    }
  }

  getBarColor(pct: number): string {
    if (pct >= 86) return '#EF5350';
    if (pct >= 61) return '#FFA726';
    return '#2E7D32';
  }

  @HostListener('window:resize')
  onResize(): void {
    this.map?.invalidateSize();
  }
}
