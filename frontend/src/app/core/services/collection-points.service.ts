import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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
  status: 'NORMAL' | 'ALERTA' | 'CRITICO' | 'INACTIVO';
  distance_km?: number | null;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CollectionPointsService {

  private readonly apiUrl = `${environment.apiUrl}/collection-points`;

  constructor(private http: HttpClient) {}

  getAll(
    wasteType?: string,
    status?: string,
    search?: string,
    lat?: number,
    lng?: number
  ): Observable<CollectionPoint[]> {

    let params = new HttpParams();

    if (wasteType && wasteType !== 'TODOS') {
      params = params.set('waste_type', wasteType);
    }

    if (status && status !== 'TODOS') {
      params = params.set('status', status);
    }

    if (search) {
      params = params.set('search', search);
    }

    if (lat !== undefined && lng !== undefined) {
      params = params.set('lat', lat.toString()).set('lng', lng.toString());
    }

    return this.http.get<CollectionPoint[]>(`${this.apiUrl}/`, { params });
  }

  getById(id: string): Observable<CollectionPoint> {
    return this.http.get<CollectionPoint>(`${this.apiUrl}/${id}/`);
  }

  getWasteTypes(): Observable<WasteType[]> {
    return this.http.get<WasteType[]>(`${this.apiUrl}/waste-types/`);
  }

  updateCapacity(
    id: string,
    capacity_current: number,
    waste_type = '',
    notes = ''
  ): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/${id}/capacidad/`,
      { capacity_current, waste_type, notes }
    );
  }
}
