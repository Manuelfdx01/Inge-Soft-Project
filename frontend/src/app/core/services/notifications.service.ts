import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Notification {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private apiUrl = 'http://localhost:8000/api/users/notifications';
  private unreadCount = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCount.asObservable();

  constructor(private http: HttpClient) {}

  getAll(): Observable<Notification[]> {
    return this.http.get<Notification[]>(${this.apiUrl}/);
  }

  getUnreadCount(): void {
    this.http.get<{ unread_count: number }>(${this.apiUrl}/no-leidas/).subscribe({
      next: (res) => this.unreadCount.next(res.unread_count),
    });
  }

  markAsRead(id: string): Observable<Notification> {
    return this.http.patch<Notification>(${this.apiUrl}/${id}/leer/, {}).pipe(
      tap(() => this.getUnreadCount())
    );
  }

  markAllAsRead(): Observable<any> {
    return this.http.patch(${this.apiUrl}/leer-todas/, {}).pipe(
      tap(() => this.unreadCount.next(0))
    );
  }
}