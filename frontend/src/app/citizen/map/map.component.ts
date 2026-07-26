import {
  Component, OnInit, OnDestroy,
  ElementRef, ViewChild, AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import {
  CollectionPointsService,
  CollectionPoint
} from '../../core/services/collection-points.service';

// Fix de íconos de Leaflet cuando se usa con Webpack/Angular
const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl       = 'assets/marker-icon.png';
const shadowUrl     = 'assets/marker-shadow.png';
const defaultIcon   = L.icon({
  iconRetinaUrl, iconUrl, shadowUrl,
  iconSize:    [25, 41],
  iconAnchor:  [12, 41],
  popupAnchor: [1, -34],
  shadowSize:  [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapCanvas', { static: false }) mapCanvasRef!: ElementRef;

  // ── Datos ──
  points: CollectionPoint[]         = [];
  filteredPoints: CollectionPoint[] = [];
  selectedPoint: CollectionPoint | null = null;

  // ── Filtros ──
  activeWasteFilter  = 'TODOS';
  activeStatusFilter = 'TODOS';
  searchQuery        = '';

  // ── Estado UI ──
  loading   = true;
  mobileTab: 'MAP' | 'LIST' = 'MAP';

  // ── Reporte modal ──
  isReportModalOpen = false;
  reportNotes       = '';
  reportWasteType   = 'PLASTICO';
  reportSuccess     = false;
  reporting         = false;

  // ── Leaflet internos ──
  private map!: L.Map;
  private markers: L.Marker[]     = [];
  private userMarker: L.Marker | null = null;
  private userLocation: { lat: number; lng: number } | null = null;
  private resizeObserver?: ResizeObserver;

  // ── Configuración de filtros ──
  wasteFilters = [
    { label: 'Todos',     value: 'TODOS',    icon: '♻️' },
    { label: 'Plástico',  value: 'PLASTICO', icon: '🟠' },
    { label: 'Vidrio',    value: 'VIDRIO',   icon: '🔵' },
    { label: 'Papel',     value: 'PAPEL',    icon: '🟣' },
    { label: 'Metal',     value: 'METAL',    icon: '⚪' },
    { label: 'Orgánico',  value: 'ORGANICO', icon: '🟢' },
  ];

  statusFilters = [
    { label: 'Todos los estados', value: 'TODOS'  },
    { label: '🟢 Normal (<61%)', value: 'NORMAL'  },
    { label: '🟠 Alerta (61-85%)', value: 'ALERTA' },
    { label: '🔴 Crítico (>85%)', value: 'CRITICO' },
    { label: '⚪ Inactivo', value: 'INACTIVO' },
  ];

  constructor(private pointsService: CollectionPointsService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    // Inicializar mapa de Leaflet
    setTimeout(() => {
      this.initMap();
      this.setupResizeObserver();
    }, 150);
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.map) {
      this.map.remove();
    }
  }

  private setupResizeObserver(): void {
    if (this.mapCanvasRef?.nativeElement && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      });
      this.resizeObserver.observe(this.mapCanvasRef.nativeElement);
    }
  }

  // ════════════════════════════════════════
  // MAPA
  // ════════════════════════════════════════

  private initMap(): void {
    if (!this.mapCanvasRef?.nativeElement) return;

    // Centro por defecto: Bogotá
    this.map = L.map(this.mapCanvasRef.nativeElement, {
      center:    [4.6580, -74.0721],
      zoom:      13,
      zoomControl: true,
    });

    // Capa OpenStreetMap — 100% libre y profesional
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this.map);

    // Event listener para acciones dentro de popups de Leaflet
    this.map.on('popupopen', (e: L.PopupEvent) => {
      const popupEl = e.popup.getElement();
      if (!popupEl) return;

      const osmBtn = popupEl.querySelector('.popup-btn-osm');
      if (osmBtn) {
        osmBtn.addEventListener('click', (ev) => {
          ev.preventDefault();
          const pId = osmBtn.getAttribute('data-point-id');
          const point = this.points.find(p => p.id.toString() === pId?.toString());
          if (point) this.openInOSM(point);
        });
      }

      const reportBtn = popupEl.querySelector('.popup-btn-report');
      if (reportBtn) {
        reportBtn.addEventListener('click', (ev) => {
          ev.preventDefault();
          const pId = reportBtn.getAttribute('data-point-id');
          const point = this.points.find(p => p.id.toString() === pId?.toString());
          if (point) this.openReportModal(point);
        });
      }
    });

    // Renderizar markers cuando la vista esté lista
    this.map.whenReady(() => {
      this.renderMarkers();
      if (this.userLocation) {
        this.renderUserMarker();
      }
    });
  }

  private renderMarkers(): void {
    if (!this.map) return;

    // Limpiar markers anteriores
    this.markers.forEach(m => m.remove());
    this.markers = [];

    this.filteredPoints.forEach(point => {
      const color = this.getPinColor(point);
      const isCritical = point.status === 'CRITICO';
      const alertIndicator = isCritical
        ? `<span class="alert-indicator" title="¡Punto crítico por alta ocupación!">⚠️</span>`
        : '';

      const pinClass = `leaflet-pin ${isCritical ? 'critical-alert' : ''}`;

      // SVG/HTML personalizado para ícono de pin Leaflet
      const svgIcon = L.divIcon({
        className: 'leaflet-pin-wrapper',
        html: `
          <div class="${pinClass}" style="--pin-color: ${color}">
            ${alertIndicator}
            <div class="pin-inner">${point.capacity_pct}%</div>
            <div class="pin-tail"></div>
          </div>
        `,
        iconSize:   [46, 54],
        iconAnchor: [23, 54],
        popupAnchor: [0, -56],
      });

      const wasteTagsHtml = point.waste_types?.map(w =>
        `<span class="popup-tag" style="background: ${(w.color || '#2E7D32')}22; color: ${w.color || '#2E7D32'}">
          ${w.icon || '♻️'} ${w.name}
        </span>`
      ).join('') || '';

      const distanceHtml = point.distance_km != null
        ? `<div class="popup-distance">📏 <strong>${point.distance_km} km</strong> de tu ubicación</div>`
        : '';

      const popupHtml = `
        <div class="leaflet-custom-popup">
          <div class="popup-header">
            <span class="popup-status-badge" style="background:${color}">${point.status}</span>
            <h4 class="popup-title">${point.name}</h4>
          </div>
          <p class="popup-address">📍 ${point.address}</p>
          ${distanceHtml}
          <div class="popup-capacity">
            <div class="popup-capacity-label">
              <span>Nivel de ocupación</span>
              <strong style="color: ${this.getBarColor(point.capacity_pct)}">${point.capacity_pct}%</strong>
            </div>
            <div class="popup-progress-bar">
              <div class="popup-progress-fill" style="width: ${point.capacity_pct}%; background: ${this.getBarColor(point.capacity_pct)}"></div>
            </div>
          </div>
          <div class="popup-waste-tags">${wasteTagsHtml}</div>
          <div class="popup-actions">
            <button class="popup-btn popup-btn-osm" data-point-id="${point.id}">🗺️ Cómo llegar</button>
            <button class="popup-btn popup-btn-report" data-point-id="${point.id}">📢 Reportar</button>
          </div>
        </div>
      `;

      const marker = L.marker(
        [Number(point.latitude), Number(point.longitude)],
        { icon: svgIcon }
      );

      marker.bindPopup(popupHtml, {
        maxWidth: 300,
        className: 'gomi-leaflet-popup'
      });

      marker.on('click', () => {
        this.selectPoint(point, false);
      });

      marker.addTo(this.map);
      this.markers.push(marker);
    });

    // Ajustar vista a los markers si no hay ubicación de usuario y hay puntos
    if (this.filteredPoints.length > 0 && !this.userLocation && this.map) {
      const bounds = L.latLngBounds(
        this.filteredPoints.map(p => [Number(p.latitude), Number(p.longitude)])
      );
      this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }

  // ════════════════════════════════════════
  // DATOS backend
  // ════════════════════════════════════════

  loadData(): void {
    this.loading = true;
    this.pointsService.getAll(
      this.activeWasteFilter,
      this.activeStatusFilter,
      this.searchQuery,
      this.userLocation?.lat,
      this.userLocation?.lng,
    ).subscribe({
      next: (data) => {
        this.points         = data;
        this.filteredPoints = data;
        this.loading        = false;
        this.renderMarkers();
      },
      error: (err) => {
        console.error('Error al cargar puntos de recolección desde backend Django:', err);
        this.loading = false;
      },
    });
  }

  // ════════════════════════════════════════
  // GEOLOCALIZACIÓN
  // ════════════════════════════════════════

  getCurrentLocation(): void {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.userLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        this.centerMapOn(this.userLocation.lat, this.userLocation.lng, 15);
        this.renderUserMarker();
        this.loadData();
      },
      (error) => {
        console.warn('Geolocalización denegada o con error:', error);
        alert('No se pudo acceder a tu ubicación. Verifica los permisos de tu navegador.');
      }
    );
  }

  private renderUserMarker(): void {
    if (!this.map || !this.userLocation) return;

    if (this.userMarker) this.userMarker.remove();

    const userIcon = L.divIcon({
      className: 'user-location-pin-wrap',
      html: `<div class="user-location-dot" title="Tu ubicación actual"></div>`,
      iconSize:   [24, 24],
      iconAnchor: [12, 12],
    });

    this.userMarker = L.marker(
      [this.userLocation.lat, this.userLocation.lng],
      { icon: userIcon, zIndexOffset: 1000 }
    ).addTo(this.map);
  }

  private centerMapOn(lat: number, lng: number, zoom = 15): void {
    if (this.map) {
      this.map.setView([lat, lng], zoom, { animate: true });
    }
  }

  // ════════════════════════════════════════
  // SELECCIÓN DE PUNTO
  // ════════════════════════════════════════

  selectPoint(point: CollectionPoint, openPopup = true): void {
    this.selectedPoint = point;
    this.centerMapOn(Number(point.latitude), Number(point.longitude), 15);

    if (openPopup) {
      const targetMarker = this.markers.find(m => {
        const latLng = m.getLatLng();
        return Math.abs(latLng.lat - Number(point.latitude)) < 0.0001 &&
               Math.abs(latLng.lng - Number(point.longitude)) < 0.0001;
      });
      if (targetMarker) {
        targetMarker.openPopup();
      }
    }
  }

  closePopup(): void {
    this.selectedPoint = null;
    if (this.map) {
      this.map.closePopup();
    }
  }

  openInOSM(point: CollectionPoint): void {
    const originLat = this.userLocation?.lat ?? 4.6580;
    const originLng = this.userLocation?.lng ?? -74.0721;
    const url = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${originLat}%2C${originLng}%3B${point.latitude}%2C${point.longitude}`;
    window.open(url, '_blank');
  }

  setMobileTab(tab: 'MAP' | 'LIST'): void {
    this.mobileTab = tab;
    if (tab === 'MAP' && this.map) {
      setTimeout(() => this.map.invalidateSize(), 100);
    }
  }

  // ════════════════════════════════════════
  // FILTROS
  // ════════════════════════════════════════

  applyWasteFilter(value: string): void {
    this.activeWasteFilter = value;
    this.applyFilters();
  }

  applyStatusFilter(value: string): void {
    this.activeStatusFilter = value;
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.points];

    if (this.activeWasteFilter !== 'TODOS') {
      result = result.filter(p =>
        p.waste_types?.some(w => w.name.toUpperCase() === this.activeWasteFilter)
      );
    }

    if (this.activeStatusFilter !== 'TODOS') {
      result = result.filter(p => p.status === this.activeStatusFilter);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q)
      );
    }

    this.filteredPoints = result;
    this.renderMarkers();
  }

  // ════════════════════════════════════════
  // MODAL REPORTE DE NOVEDADES
  // ════════════════════════════════════════

  openReportModal(point: CollectionPoint): void {
    this.selectedPoint     = point;
    this.isReportModalOpen = true;
    this.reportSuccess     = false;
    this.reportNotes       = '';
  }

  closeReportModal(): void {
    this.isReportModalOpen = false;
  }

  submitReport(): void {
    if (!this.selectedPoint) return;
    this.reporting = true;

    this.pointsService.updateCapacity(
      this.selectedPoint.id.toString(),
      this.selectedPoint.capacity_current,
      this.reportWasteType,
      this.reportNotes,
    ).subscribe({
      next: () => {
        this.reporting     = false;
        this.reportSuccess = true;
        setTimeout(() => {
          this.closeReportModal();
          this.loadData();
        }, 1500);
      },
      error: (err) => {
        console.error('Error al enviar reporte:', err);
        this.reporting = false;
      },
    });
  }

  // ════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════

  getPinColor(point: CollectionPoint): string {
    return {
      NORMAL:   '#2E7D32',
      ALERTA:   '#FFA726',
      CRITICO:  '#EF5350',
      INACTIVO: '#9E9E9E'
    }[point.status] ?? '#2E7D32';
  }

  getBarColor(pct: number): string {
    if (pct >= 86) return '#EF5350';
    if (pct >= 61) return '#FFA726';
    return '#2E7D32';
  }

  get pointsSorted(): CollectionPoint[] {
    return [...this.filteredPoints].sort((a, b) => {
      if (a.distance_km != null && b.distance_km != null) {
        return a.distance_km - b.distance_km;
      }
      return b.capacity_pct - a.capacity_pct;
    });
  }
}
