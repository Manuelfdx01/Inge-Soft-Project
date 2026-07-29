import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { ToastComponent } from '../toast/toast.component';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    SidebarComponent,
    TopbarComponent,
    ToastComponent,
  ],
  template: `
    <div class="app-shell" [class.dark-mode]="theme.isDark()">

      <!-- Overlay for mobile sidebar -->
      <div
        class="sidebar-overlay"
        [class.visible]="sidebarOpen()"
        (click)="closeSidebar()">
      </div>

      <app-sidebar
        [class.sidebar-open]="sidebarOpen()"
        (sidebarClose)="closeSidebar()">
      </app-sidebar>

      <div class="main">

        <app-topbar
          title="Panel"
          (menuToggle)="toggleSidebar()">
        </app-topbar>

        <div class="content">
          <router-outlet></router-outlet>
        </div>

      </div>

      <app-toast></app-toast>

    </div>
  `,
  styleUrl: './shell.component.scss'
})
export class ShellComponent {
  readonly sidebarOpen = signal(false);

  constructor(public theme: ThemeService) {}

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
}
