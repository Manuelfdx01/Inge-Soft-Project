import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CollectionPoint } from './collection-points.service';

export interface CentroDashboard {
  centro: CollectionPoint;
  avg_rating: number | null;
  total_reviews: number;
  calificaciones_recientes: CentroCalificacion[];
  alertas_recientes: { id: number; message: string; created_at: string }[];
  alertas_activas: number;
}

export interface CentroCalificacion {
  id: number;
  user: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface CentroAlerta {
  id: number;
  message: string;
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

  /** Actualizar información completa del centro */
  updateMiCentro(data: Partial<CollectionPoint> & { waste_type_ids?: number[] }): Observable<CollectionPoint> {
    return this.http.patch<CollectionPoint>(`${this.base}/mi-centro/`, data);
  }

  /** Actualizar capacidad máxima del centro */
  updateCapacidadMax(id: string | number, capacity_max: number): Observable<any> {
    return this.http.patch(`${this.base}/${id}/`, { capacity_max });
  }

  /** Actualizar capacidad actual */
  updateCapacidadActual(id: string | number, capacity_current: number, notes = ''): Observable<any> {
    return this.http.patch(`${this.base}/${id}/capacidad/`, { capacity_current, notes });
  }

  /** Cambiar estado del centro (DISPONIBLE / LLENO / MANTENIMIENTO) */
  updateEstado(id: string | number, status: string): Observable<any> {
    return this.http.patch(`${this.base}/${id}/estado/`, { status });
  }

  /** Actualizar precios por kilogramo */
  updatePrecios(id: string | number, precio_kg: Record<string, number>): Observable<any> {
    return this.http.patch(`${this.base}/${id}/precios/`, { precio_kg });
  }

  /** Actualizar materiales aceptados */
  updateMateriales(id: string | number, waste_type_ids: number[]): Observable<any> {
    return this.http.patch(`${this.base}/${id}/materiales/`, { waste_type_ids });
  }

  /** Consultar calificaciones del centro */
  getCalificaciones(): Observable<CentroCalificacion[]> {
    return this.http.get<CentroCalificacion[]>(`${this.base}/mi-centro/calificaciones/`);
  }

  /** Consultar alertas del centro */
  getAlertas(): Observable<CentroAlerta[]> {
    return this.http.get<CentroAlerta[]>(`${this.base}/mi-centro/alertas/`);
  }

  /** Publicar nueva alerta/aviso a los recicladores */
  publicarAlerta(tipo: string, message: string): Observable<any> {
    return this.http.post(`${this.base}/mi-centro/alertas/`, { tipo, message });
  }
}
