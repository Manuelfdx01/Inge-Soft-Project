import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  Notification,
  NotificationsService
} from '../../../core/services/notifications.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent implements OnInit {

  @Input() title = '';

  notifications: Notification[] = [];

  unreadCount = 0;

  showDropdown = false;

  constructor(
    private notificationsService: NotificationsService
  ) {}

  ngOnInit(): void {

    this.notificationsService.unreadCount$
      .subscribe(count => this.unreadCount = count);

    this.notificationsService.getUnreadCount();

  }

  toggleDropdown(): void {

    this.showDropdown = !this.showDropdown;

    if (this.showDropdown) {
      this.loadNotifications();
    }

  }

  loadNotifications(): void {

    this.notificationsService.getAll().subscribe({
      next: (notifications) => {
        this.notifications = notifications.slice(0, 10);
      },
      error: (err) => {
        console.error(err);
      }
    });

  }

  markRead(notification: Notification): void {

    if (notification.is_read) {
      return;
    }

    this.notificationsService.markAsRead(notification.id).subscribe({
      next: () => {

        notification.is_read = true;

        if (this.unreadCount > 0) {
          this.unreadCount--;
        }

      }
    });

  }

  markAllRead(): void {

    this.notificationsService.markAllAsRead().subscribe({

      next: () => {

        this.notifications.forEach(notification => {
          notification.is_read = true;
        });

        this.unreadCount = 0;

      }

    });

  }

}
