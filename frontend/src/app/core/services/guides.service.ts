import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RecyclingGuide {
  id: number;
  title: string;
  content: string;
  waste_type: string;
  category: string;
  difficulty: 'FACIL' | 'MEDIO' | 'AVANZADO';
  tips: string[];
  reading_time_min: number;
  icon: string;
  created_by_username: string | null;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class GuidesService {
  private apiUrl = `${environment.apiUrl}/gamification/guides/`;

  constructor(private http: HttpClient) {}

  getGuides(wasteType?: string, search?: string): Observable<RecyclingGuide[]> {
    let params = new HttpParams();
    if (wasteType) params = params.set('waste_type', wasteType);
    if (search)    params = params.set('search', search);
    return this.http.get<RecyclingGuide[]>(this.apiUrl, { params });
  }

  getGuide(id: number): Observable<RecyclingGuide> {
    return this.http.get<RecyclingGuide>(`${this.apiUrl}${id}/`);
  }
}
