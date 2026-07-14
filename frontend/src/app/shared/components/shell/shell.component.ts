import { Component } from '@angular/core';

@Component({
  selector: 'app-shell',
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