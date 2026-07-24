import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsService, Notification } from '../../../core/services/notifications.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent implements OnInit {
  @Input() title = '';
  notifications: Notification[] = [];
  unreadCount = 0;
  showDropdown = false;

  constructor(private notifService: NotificationsService) {}

  ngOnInit(): void {
    this.notifService.unreadCount$.subscribe(n => this.unreadCount = n);
    this.notifService.getUnreadCount();
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown) this.loadNotifications();
  }

  loadNotifications(): void {
    this.notifService.getAll().subscribe({
      next: (data) => { this.notifications = data.slice(0, 10); },
    });
  }

  markRead(notif: Notification): void {
    if (notif.is_read) return;
    this.notifService.markAsRead(notif.id).subscribe({
      next: () => { notif.is_read = true; },
    });
  }

  markAllRead(): void {
    this.notifService.markAllAsRead().subscribe({
      next: () => { this.notifications.forEach(n => n.is_read = true); },
    });
  }
}
