import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    SidebarComponent
  ],
  template: `
    <div class="app-shell">
      <app-sidebar></app-sidebar>
      <div class="main">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .app-shell { display: flex; height: 100vh; overflow: hidden; }
    .main { flex: 1; overflow-y: auto; background: #F8F9FA; }
  `],
})
export class ShellComponent {}
