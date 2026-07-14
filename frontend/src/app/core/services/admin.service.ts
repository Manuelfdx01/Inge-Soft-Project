import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { MOCK_METRICS } from '../mocks/admin.mock';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = 'http://localhost:8000/api';
  private useMock = false;

  constructor(private http: HttpClient) {}

  getMetrics(): Observable<any> {
    if (this.useMock) return of(MOCK_METRICS);
    return this.http.get(${this.apiUrl}/admin/metrics/);
  }

  getUsers(role?: string): Observable<any[]> {
    if (this.useMock) return of([]);
    let url = ${this.apiUrl}/users/;
    if (role) url += ?role=${role};
    return this.http.get<any[]>(url);
  }

  updateProposalStatus(id: string, status: string, response: string): Observable<any> {
    return this.http.patch(${this.apiUrl}/proposals/${id}/estado/, {
      status, admin_response: response,
    });
  }

  updateReportStatus(id: string, status: string): Observable<any> {
    return this.http.patch(${this.apiUrl}/reports/${id}/estado/, { status });
  }
}
