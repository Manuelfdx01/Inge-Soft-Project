import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsService, Notification } from '../../core/services/notifications.service';

@Component({
  selector: 'app-centro-notificaciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notificaciones.component.html',
  styleUrl: './notificaciones.component.scss'
})
export class NotificacionesComponent implements OnInit {
  readonly notifications = signal<Notification[]>([]);
  readonly loading = signal(true);
  readonly errorMsg = signal('');
  readonly markingAll = signal(false);

  readonly unreadCount = computed(() =>
    this.notifications().filter(n => !n.is_read).length
  );

  constructor(private notifService: NotificationsService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.notifService.getAll().subscribe({
      next: (data) => {
        this.notifications.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('No se pudieron cargar las notificaciones.');
        this.loading.set(false);
      }
    });
  }

  marcarLeida(item: Notification): void {
    if (item.is_read) return;
    this.notifService.markAsRead(item.id).subscribe({
      next: () => {
        this.notifications.update(list =>
          list.map(n => n.id === item.id ? { ...n, is_read: true } : n)
        );
      }
    });
  }

  marcarTodas(): void {
    if (this.unreadCount() === 0) return;
    this.markingAll.set(true);
    this.notifService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update(list => list.map(n => ({ ...n, is_read: true })));
        this.markingAll.set(false);
      },
      error: () => this.markingAll.set(false)
    });
  }

  typeIcon(type: string): string {
    const map: Record<string, string> = {
      ALERTA: '🚨',
      CAPACIDAD: '⚖️',
      REPORTE: '📋',
      CALIFICACION: '⭐',
      SISTEMA: '🔧',
    };
    return map[type?.toUpperCase()] ?? '🔔';
  }
}
