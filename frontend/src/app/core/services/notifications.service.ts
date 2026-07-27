import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, interval } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Notification {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationsService implements OnDestroy {
  private readonly apiUrl = `${environment.apiUrl}/users/notifications`;

  private unreadCount = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCount.asObservable();

  private pollingSubscription?: Subscription;

  constructor(private http: HttpClient) {}

  /**
   * Inicia el polling automático de notificaciones no leídas.
   * Llámalo desde el topbar o shell una única vez por sesión.
   */
  startPolling(intervalMs = 30000): void {
    this.stopPolling();
    // Carga inmediata al iniciar
    this.getUnreadCount();
    // Polling cada intervalMs ms
    this.pollingSubscription = interval(intervalMs).subscribe(() => {
      this.getUnreadCount();
    });
  }

  stopPolling(): void {
    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = undefined;
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  getAll(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/`);
  }

  getUnreadCount(): void {
    this.http
      .get<{ unread_count: number }>(`${this.apiUrl}/no-leidas/`)
      .subscribe({
        next: (res) => this.unreadCount.next(res.unread_count),
        error: () => {} // silenciar errores de red en polling
      });
  }

  /** Actualiza el contador localmente (uso interno) */
  setUnreadCount(count: number): void {
    this.unreadCount.next(count);
  }

  markAsRead(id: string): Observable<Notification> {
    return this.http
      .patch<Notification>(`${this.apiUrl}/${id}/leer/`, {})
      .pipe(
        tap(() => this.getUnreadCount())
      );
  }

  markAllAsRead(): Observable<any> {
    return this.http
      .patch(`${this.apiUrl}/leer-todas/`, {})
      .pipe(
        tap(() => this.unreadCount.next(0))
      );
  }
}
