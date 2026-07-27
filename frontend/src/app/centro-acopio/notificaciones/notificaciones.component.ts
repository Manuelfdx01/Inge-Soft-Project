import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsService, Notification } from '../../core/services/notifications.service';

@Component({
  selector: 'app-centro-notificaciones',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="header">
        <h2>🔔 Notificaciones</h2>
        <button class="btn" (click)="marcarTodas()">Marcar todas como leídas</button>
      </div>

      <div *ngIf="loading">Cargando notificaciones...</div>

      <div *ngIf="!loading" class="notif-list">
        <div *ngFor="let item of notifications" class="card" [class.unread]="!item.is_read" (click)="marcarLeida(item)">
          <div class="msg">{{ item.message }}</div>
          <span class="date">{{ item.created_at | date:'short' }}</span>
        </div>

        <div *ngIf="notifications.length === 0" class="empty">
          No tienes notificaciones.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 24px; font-family: sans-serif; }
    .header { display: flex; justify-content: space-between; align-items: center; max-width: 600px; margin-bottom: 16px; }
    .btn { padding: 6px 12px; border-radius: 8px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer; }
    .notif-list { display: flex; flex-direction: column; gap: 10px; max-width: 600px; }
    .card { background: #fff; padding: 14px; border-radius: 12px; border: 1px solid #e2e8f0; cursor: pointer; }
    .card.unread { border-left: 4px solid #10b981; background: #f0fdf4; }
    .msg { font-size: 13px; color: #0f172a; margin-bottom: 4px; }
    .date { font-size: 11px; color: #94a3b8; }
    .empty { color: #94a3b8; font-style: italic; }
  `]
})
export class NotificacionesComponent implements OnInit {
  notifications: Notification[] = [];
  loading = true;

  constructor(private notifService: NotificationsService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.notifService.getAll().subscribe({
      next: (data) => {
        this.notifications = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  marcarLeida(item: Notification): void {
    if (item.is_read) return;
    this.notifService.markAsRead(item.id).subscribe(() => {
      item.is_read = true;
    });
  }

  marcarTodas(): void {
    this.notifService.markAllAsRead().subscribe(() => {
      this.notifications.forEach(n => n.is_read = true);
    });
  }
}
