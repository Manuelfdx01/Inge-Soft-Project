import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  getMetrics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/metrics/`);
  }

  getUsers(role?: string): Observable<any[]> {
    let url = `${this.apiUrl}/users/`;

    if (role) {
      url += `?role=${role}`;
    }

    return this.http.get<any[]>(url);
  }

  updateProposalStatus(
    id: string,
    status: string,
    response: string
  ): Observable<any> {
    return this.http.patch(`${this.apiUrl}/proposals/${id}/estado/`, {
      status,
      admin_response: response,
    });
  }

  updateReportStatus(
    id: string,
    status: string
  ): Observable<any> {
    return this.http.patch(`${this.apiUrl}/reports/${id}/estado/`, {
      status,
    });
  }
}
