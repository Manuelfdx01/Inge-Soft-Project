import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { MOCK_ALERTS } from '../mocks/logistics.mock';

/* ==========================================================
   MODELOS
========================================================== */

export interface CollectionPoint {
  id: number;
  name: string;
  address: string;
  capacity_pct: number;
}

export interface LogisticsAlert {
  id: number;
  origin_point: CollectionPoint;
  target_point: CollectionPoint;

  waste_type: string;

  priority: 'ALTA' | 'MEDIA' | 'BAJA';

  status:
    | 'PENDIENTE'
    | 'ACEPTADA'
    | 'EN_PROCESO'
    | 'COMPLETADA';

  distance_km: number;

  reciclador_username: string | null;

  created_at: string;

  resolved_at: string | null;
}

export interface DashboardPoint {
  id: number;
  name: string;
  address: string;
  capacity: number;
  status: string;
  latitude: number;
  longitude: number;
}

export interface DashboardStats {
  completed_today: number;
  pending: number;
  distance_today: number;
  level: number;
}

export interface LogisticsDashboard {
  is_available: boolean;

  stats: DashboardStats;

  current_trip: LogisticsAlert | null;

  pending_alerts: LogisticsAlert[];

  history: LogisticsAlert[];

  nearby_points: DashboardPoint[];
}

export interface AvailabilityResponse {
  is_available: boolean;
}

export interface CapacityUpdateRequest {
  capacity_current: number;
  waste_type: string;
  notes: string;
}

export interface CapacityUpdateResponse {
  id: number;
  capacity_current: number;
  capacity_pct: number;
  status: string;
  alert_triggered: boolean;
  alert_id: number | null;
}

/* ==========================================================
   SERVICE
========================================================== */

@Injectable({
  providedIn: 'root'
})
export class LogisticsService {

  private apiUrl = 'http://localhost:8000/api/logistics';

  /**
   * true = usa mocks
   * false = backend Django
   */
  private useMock = false;

  constructor(
    private http: HttpClient
  ) {}

  // ==========================================================
  // ALERTAS
  // ==========================================================

  getAlerts(
    statusFilter?: string
  ): Observable<LogisticsAlert[]> {

    if (this.useMock) {

      let alerts = [...MOCK_ALERTS];

      if (statusFilter) {
        alerts = alerts.filter(
          alert => alert.status === statusFilter
        );
      }

      return of(alerts);

    }

    let url = `${this.apiUrl}/alerts/`;

    if (statusFilter) {
      url += `?status=${statusFilter}`;
    }

    return this.http.get<LogisticsAlert[]>(url);

  }

  // ==========================================================
  // DASHBOARD
  // ==========================================================

  getDashboard(): Observable<LogisticsDashboard> {

    if (this.useMock) {

      return of({

        is_available: true,

        stats: {
          completed_today: 3,
          pending: 4,
          distance_today: 7.2,
          level: 2
        },

        current_trip: null,

        pending_alerts: MOCK_ALERTS.filter(
          a => a.status === 'PENDIENTE'
        ),

        history: MOCK_ALERTS.filter(
          a => a.status === 'COMPLETADA'
        ),

        nearby_points: []

      });

    }

    return this.http.get<LogisticsDashboard>(
      `${this.apiUrl}/dashboard/`
    );

  }

  // ==========================================================
  // MI ZONA
  // ==========================================================

  getNearbyPoints(): Observable<CollectionPoint[]> {

    if (this.useMock) {

      return of([

        {
          id: 1,
          name: 'Parque Central',
          address: 'Cra 12 #10-20',
          capacity_pct: 92
        },

        {
          id: 2,
          name: 'Centro Comercial',
          address: 'Av 5 #20-15',
          capacity_pct: 66
        },

        {
          id: 3,
          name: 'Universidad',
          address: 'Calle 40 #8-25',
          capacity_pct: 41
        }

      ]);

    }

    return this.http.get<CollectionPoint[]>(
      `${this.apiUrl}/my-zone/`
    );

  }

  // ==========================================================
  // REPORTAR CAPACIDAD
  // ==========================================================

  updateCapacity(
    pointId: number,
    data: CapacityUpdateRequest
  ): Observable<CapacityUpdateResponse> {

    if (this.useMock) {

      return of({

        id: pointId,

        capacity_current: data.capacity_current,

        capacity_pct: data.capacity_current,

        status: 'ACTIVO',

        alert_triggered: data.capacity_current >= 85,

        alert_id: null

      });

    }

    return this.http.patch<CapacityUpdateResponse>(
      `${this.apiUrl}/points/${pointId}/capacidad/`,
      data
    );

  }

  // ==========================================================
  // ACEPTAR TRASLADO
  // ==========================================================

  aceptarTraslado(
    id: number
  ): Observable<LogisticsAlert> {

    if (this.useMock) {

      const alert = MOCK_ALERTS.find(
        item => item.id === id
      );

      if (!alert) {

        return throwError(
          () => new Error('Alerta no encontrada')
        );

      }

      alert.status = 'ACEPTADA';

      return of(alert);

    }

    return this.http.patch<LogisticsAlert>(
      `${this.apiUrl}/alerts/${id}/aceptar/`,
      {}
    );

  }

  // ==========================================================
  // COMPLETAR TRASLADO
  // ==========================================================

  completarTraslado(
    id: number
  ): Observable<LogisticsAlert> {

    if (this.useMock) {

      const alert = MOCK_ALERTS.find(
        item => item.id === id
      );

      if (!alert) {

        return throwError(
          () => new Error('Alerta no encontrada')
        );

      }

      alert.status = 'COMPLETADA';

      alert.resolved_at = new Date().toISOString();

      return of(alert);

    }

    return this.http.patch<LogisticsAlert>(
      `${this.apiUrl}/alerts/${id}/completar/`,
      {}
    );

  }

  // ==========================================================
  // DISPONIBILIDAD
  // ==========================================================

  setAvailability(
    available: boolean
  ): Observable<AvailabilityResponse> {

    if (this.useMock) {

      return of({
        is_available: available
      });

    }

    return this.http.patch<AvailabilityResponse>(
      `${this.apiUrl}/availability/`,
      {
        is_available: available
      }
    );
  }

  // ==========================================================
// OBTENER DISPONIBILIDAD
// ==========================================================

  getAvailability(): Observable<AvailabilityResponse> {

    if (this.useMock) {

      return of({
        is_available: true
      });

    }

    return this.http.get<AvailabilityResponse>(
      `${this.apiUrl}/availability/`
    );
  }
}
