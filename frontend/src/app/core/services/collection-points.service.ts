import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { MOCK_POINTS } from '../mocks/collection-points.mock';

export interface WasteType {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
}

export interface CollectionPoint {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  capacity_max: number;
  capacity_current: number;
  capacity_pct: number;
  waste_types: WasteType[];
  status: 'NORMAL' | 'ALERTA' | 'CRITICO';
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class CollectionPointsService {

  private readonly apiUrl =
    'http://localhost:8000/api/collection-points';

  private readonly useMock = false;

  constructor(
    private http: HttpClient
  ) {}

  getAll(
    wasteType?: string,
    status?: string
  ): Observable<CollectionPoint[]> {

    if (this.useMock) {
      return of(MOCK_POINTS as CollectionPoint[]);
    }

    let params = new HttpParams();

    if (wasteType) {
      params = params.set('waste_type', wasteType);
    }

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<CollectionPoint[]>(
      `${this.apiUrl}/`,
      { params }
    );
  }

  getById(
    id: string
  ): Observable<CollectionPoint> {

    if (this.useMock) {
      return of(
        MOCK_POINTS.find(p => p.id === id) as CollectionPoint
      );
    }

    return this.http.get<CollectionPoint>(
      `${this.apiUrl}/${id}/`
    );
  }

  getWasteTypes(): Observable<WasteType[]> {

    return this.http.get<WasteType[]>(
      `${this.apiUrl}/waste-types/`
    );
  }

  updateCapacity(
    id: string,
    capacity_current: number,
    waste_type = '',
    notes = ''
  ): Observable<any> {

    return this.http.patch(
      `${this.apiUrl}/${id}/capacidad/`,
      {
        capacity_current,
        waste_type,
        notes
      }
    );
  }

}
