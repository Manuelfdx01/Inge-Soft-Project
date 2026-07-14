import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { MOCK_ALERTS } from '../mocks/logistics.mock';

export interface LogisticsAlert {
  id: string;
  origin_point: { id: string; name: string; capacity_pct: number; address: string };
  target_point: { id: string; name: string; capacity_pct: number; address: string };
  waste_type: string;
  priority: 'ALTA' | 'MEDIA' | 'BAJA';
  status: 'PENDIENTE' | 'ACEPTADA' | 'EN_PROCESO' | 'COMPLETADA';
  distance_km: number;
  reciclador_username: string | null;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class LogisticsService {
  private apiUrl = 'http://localhost:8000/api/logistics';
  private useMock = false;

  constructor(private http: HttpClient) {}

  getAlerts(statusFilter?: string): Observable<LogisticsAlert[]> {
    if (this.useMock) return of(MOCK_ALERTS as LogisticsAlert[]);
    let url = ${this.apiUrl}/alerts/;
    if (statusFilter) url += ?status=${statusFilter};
    return this.http.get<LogisticsAlert[]>(url);
  }

  aceptarTraslado(id: string): Observable<LogisticsAlert> {
    if (this.useMock) {
      const a = MOCK_ALERTS.find(a => a.id === id);
      if (a) a.status = 'ACEPTADA';
      return of(a as LogisticsAlert);
    }
    return this.http.patch<LogisticsAlert>(${this.apiUrl}/alerts/${id}/aceptar/, {});
  }

  completarTraslado(id: string): Observable<LogisticsAlert> {
    if (this.useMock) {
      const a = MOCK_ALERTS.find(a => a.id === id);
      if (a) a.status = 'COMPLETADA';
      return of(a as LogisticsAlert);
    }
    return this.http.patch<LogisticsAlert>(${this.apiUrl}/alerts/${id}/completar/, {});
  }
}