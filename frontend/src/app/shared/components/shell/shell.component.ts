import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    SidebarComponent,
    TopbarComponent
  ],
  template: `
    <div class="app-shell">

      <app-sidebar></app-sidebar>

      <div class="main">

        <app-topbar
          title="Panel">
        </app-topbar>

        <div class="content">
          <router-outlet></router-outlet>
        </div>

      </div>

    </div>
  `,
  styleUrl: './shell.component.scss'
})
export class ShellComponent {}
