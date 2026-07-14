import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { MOCK_POINTS } from '../mocks/collection-points.mock';

export interface CollectionPoint {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  capacity_max: number;
  capacity_current: number;
  capacity_pct: number;
  waste_types: { id: string; name: string; icon: string; color: string }[];
  status: 'NORMAL' | 'ALERTA' | 'CRITICO';
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class CollectionPointsService {
  private apiUrl = 'http://localhost:8000/api/collection-points';
  private useMock = true; // cambiar a false cuando el backend esté listo

  constructor(private http: HttpClient) {}

  getAll(wasteType?: string, status?: string): Observable<CollectionPoint[]> {
    if (this.useMock) return of(MOCK_POINTS as CollectionPoint[]);
    let url = this.apiUrl + '/';
    const params: string[] = [];
    if (wasteType) params.push(waste_type=${wasteType});
    if (status)    params.push(status=${status});
    if (params.length) url += '?' + params.join('&');
    return this.http.get<CollectionPoint[]>(url);
  }

  getById(id: string): Observable<CollectionPoint> {
    if (this.useMock) {
      return of(MOCK_POINTS.find(p => p.id === id) as CollectionPoint);
    }
    return this.http.get<CollectionPoint>(${this.apiUrl}/${id}/);
  }

  updateCapacity(id: string, capacity_current: number, waste_type = '', notes = '') {
    return this.http.patch(${this.apiUrl}/${id}/capacidad/, {
      capacity_current, waste_type, notes,
    });
  }
}