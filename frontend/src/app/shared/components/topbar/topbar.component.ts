import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import {
  Notification,
  NotificationsService
} from '../../../core/services/notifications.service';
import { AuthService, User } from '../../../core/services/auth.service';
import { ProfileModalComponent } from '../profile-modal/profile-modal.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    CommonModule,
    ProfileModalComponent
  ],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent implements OnInit, OnDestroy {

  @Input() title = '';

  user: User | null = null;
  notifications: Notification[] = [];
  unreadCount = 0;
  showDropdown = false;
  showProfileModal = false;

  private userSub?: Subscription;
  private notifSub?: Subscription;

  constructor(
    private notificationsService: NotificationsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.userSub = this.authService.currentUser$.subscribe(u => {
      this.user = u;
    });

    this.notifSub = this.notificationsService.unreadCount$
      .subscribe(count => this.unreadCount = count);

    // Start polling every 30s so badge updates automatically
    this.notificationsService.startPolling(30000);
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
    this.notifSub?.unsubscribe();
    this.notificationsService.stopPolling();
  }

  get avatarUrl(): string | null {
    return this.authService.getAvatarUrl(this.user?.avatar);
  }

  get initials(): string {
    if (!this.user?.username) return '👤';
    return this.user.username.charAt(0).toUpperCase();
  }

  openProfileModal(): void {
    this.showProfileModal = true;
  }

  closeProfileModal(): void {
    this.showProfileModal = false;
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
