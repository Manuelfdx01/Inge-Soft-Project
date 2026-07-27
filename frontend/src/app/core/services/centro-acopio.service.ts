import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CollectionPoint } from './collection-points.service';

export interface CentroDashboard {
  centro: CollectionPoint;
  ocupacion_semanal: { dia: string; promedio_pct: number }[];
  avg_rating: number | null;
  total_reviews: number;
  calificaciones_recientes: CentroCalificacion[];
  reportes_recientes: CentroReporte[];
  alertas_activas: number;
}

export interface CentroCalificacion {
  id: number;
  user: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface CentroReporte {
  id: number;
  type: string;
  description: string;
  status: string;
  user?: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class CentroAcopioService {
  private readonly base = `${environment.apiUrl}/collection-points`;

  constructor(private http: HttpClient) {}

  /** Dashboard completo del centro de acopio autenticado */
  getDashboard(): Observable<CentroDashboard> {
    return this.http.get<CentroDashboard>(`${this.base}/mi-centro/dashboard/`);
  }

  /** Datos básicos del centro */
  getMiCentro(): Observable<CollectionPoint> {
    return this.http.get<CollectionPoint>(`${this.base}/mi-centro/`);
  }

  /** Actualizar capacidad máxima del centro */
  updateCapacidadMax(id: string, capacity_max: number): Observable<any> {
    return this.http.patch(`${this.base}/${id}/`, { capacity_max });
  }

  /** Actualizar capacidad actual */
  updateCapacidadActual(id: string, capacity_current: number, notes = ''): Observable<any> {
    return this.http.patch(`${this.base}/${id}/capacidad/`, { capacity_current, notes });
  }

  /** Cambiar estado del centro (DISPONIBLE / LLENO / MANTENIMIENTO) */
  updateEstado(id: string, status: string): Observable<any> {
    return this.http.patch(`${this.base}/${id}/estado/`, { status });
  }

  /** Actualizar precios por kilogramo */
  updatePrecios(id: string, precio_kg: Record<string, number>): Observable<any> {
    return this.http.patch(`${this.base}/${id}/precios/`, { precio_kg });
  }

  /** Actualizar materiales aceptados */
  updateMateriales(id: string, waste_type_ids: number[]): Observable<any> {
    return this.http.patch(`${this.base}/${id}/materiales/`, { waste_type_ids });
  }

  /** Consultar calificaciones del centro */
  getCalificaciones(): Observable<CentroCalificacion[]> {
    return this.http.get<CentroCalificacion[]>(`${this.base}/mi-centro/calificaciones/`);
  }

  /** Consultar reportes del centro */
  getReportes(): Observable<CentroReporte[]> {
    return this.http.get<CentroReporte[]>(`${this.base}/mi-centro/reportes/`);
  }

  /** Cambiar estado de un reporte (usa el endpoint real del ReportViewSet) */
  updateReporteEstado(reportId: number, status: string): Observable<any> {
    return this.http.patch(`${environment.apiUrl}/reports/${reportId}/estado/`, { status });
  }
}
