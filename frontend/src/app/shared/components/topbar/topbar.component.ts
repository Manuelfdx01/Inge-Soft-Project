import { Component, Input, OnInit, OnDestroy, signal, computed } from '@angular/core';
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

  readonly user = signal<User | null>(null);
  readonly notifications = signal<Notification[]>([]);
  readonly unreadCount = signal<number>(0);
  readonly showDropdown = signal<boolean>(false);
  readonly showProfileModal = signal<boolean>(false);

  private userSub?: Subscription;
  private notifSub?: Subscription;

  readonly avatarUrl = computed(() => {
    const u = this.user();
    return this.authService.getAvatarUrl(u?.avatar);
  });

  readonly initials = computed(() => {
    const u = this.user();
    if (!u?.username) return '👤';
    return u.username.charAt(0).toUpperCase();
  });

  constructor(
    private notificationsService: NotificationsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.userSub = this.authService.currentUser$.subscribe(u => {
      this.user.set(u);
    });

    this.notifSub = this.notificationsService.unreadCount$
      .subscribe(count => this.unreadCount.set(count));

    // Start polling every 30s so badge updates automatically
    this.notificationsService.startPolling(30000);
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
    this.notifSub?.unsubscribe();
    this.notificationsService.stopPolling();
  }

  openProfileModal(): void {
    this.showProfileModal.set(true);
  }

  closeProfileModal(): void {
    this.showProfileModal.set(false);
  }

  toggleDropdown(): void {
    const current = this.showDropdown();
    this.showDropdown.set(!current);
    if (!current) {
      this.loadNotifications();
    }
  }

  loadNotifications(): void {
    this.notificationsService.getAll().subscribe({
      next: (notifications) => {
        this.notifications.set(notifications.slice(0, 10));
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
        const currentCount = this.unreadCount();
        if (currentCount > 0) {
          this.unreadCount.set(currentCount - 1);
        }
      }
    });
  }

  markAllRead(): void {
    this.notificationsService.markAllAsRead().subscribe({
      next: () => {
        const list = this.notifications();
        list.forEach(n => n.is_read = true);
        this.notifications.set([...list]);
        this.unreadCount.set(0);
      }
    });
  }

}
