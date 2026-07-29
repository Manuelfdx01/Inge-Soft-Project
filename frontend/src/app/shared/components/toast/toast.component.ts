import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" aria-live="polite" aria-atomic="false">
      <div
        *ngFor="let toast of toastService.toasts(); trackBy: trackById"
        class="toast"
        [class]="'toast-' + toast.type"
        role="alert">
        <span class="toast-icon">{{ icon(toast.type) }}</span>
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close" (click)="toastService.remove(toast.id)" aria-label="Cerrar">✕</button>
      </div>
    </div>
  `,
  styleUrl: './toast.component.scss'
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}

  trackById(_: number, t: Toast): number {
    return t.id;
  }

  icon(type: string): string {
    const icons: Record<string, string> = {
      success: '✅',
      error:   '❌',
      warning: '⚠️',
      info:    'ℹ️'
    };
    return icons[type] ?? 'ℹ️';
  }
}
