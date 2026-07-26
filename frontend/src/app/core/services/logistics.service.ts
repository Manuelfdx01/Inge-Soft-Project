import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

/* ==========================================================
   MODELOS
========================================================== */

export interface CollectionPoint {
  id: number;
  name: string;
  address: string;
  capacity_pct: number;
  capacity?: number;
  status?: string;
  latitude?: number;
  longitude?: number;
}

export interface LogisticsAlert {
  id: number;
  origin_point: CollectionPoint;
  target_point: CollectionPoint;
  waste_type: string;
  priority: 'ALTA' | 'MEDIA' | 'BAJA';
  status: 'PENDIENTE' | 'ACEPTADA' | 'EN_PROCESO' | 'COMPLETADA';
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

  private readonly apiUrl = `${environment.apiUrl}/logistics`;

  constructor(private http: HttpClient) {}

  // ==========================================================
  // ALERTAS
  // ==========================================================

  getAlerts(statusFilter?: string): Observable<LogisticsAlert[]> {
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
    return this.http.get<LogisticsDashboard>(`${this.apiUrl}/dashboard/`);
  }

  // ==========================================================
  // MI ZONA
  // ==========================================================

  getNearbyPoints(): Observable<DashboardPoint[]> {
    return this.http.get<DashboardPoint[]>(`${this.apiUrl}/my-zone/`);
  }

  // ==========================================================
  // REPORTAR CAPACIDAD
  // ==========================================================

  updateCapacity(pointId: number, data: CapacityUpdateRequest): Observable<CapacityUpdateResponse> {
    return this.http.patch<CapacityUpdateResponse>(
      `${environment.apiUrl}/collection-points/${pointId}/capacidad/`,
      data
    );
  }

  // ==========================================================
  // ACEPTAR TRASLADO
  // ==========================================================

  aceptarTraslado(id: number): Observable<LogisticsAlert> {
    return this.http.patch<LogisticsAlert>(`${this.apiUrl}/alerts/${id}/aceptar/`, {});
  }

  // ==========================================================
  // COMPLETAR TRASLADO
  // ==========================================================

  completarTraslado(id: number): Observable<LogisticsAlert> {
    return this.http.patch<LogisticsAlert>(`${this.apiUrl}/alerts/${id}/completar/`, {});
  }

  // ==========================================================
  // DISPONIBILIDAD
  // ==========================================================

  setAvailability(available: boolean): Observable<AvailabilityResponse> {
    return this.http.patch<AvailabilityResponse>(
      `${this.apiUrl}/availability/`,
      { is_available: available }
    );
  }

  getAvailability(): Observable<AvailabilityResponse> {
    return this.http.get<AvailabilityResponse>(`${this.apiUrl}/availability/`);
  }
}
