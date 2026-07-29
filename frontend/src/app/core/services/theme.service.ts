import { Injectable, signal, effect, computed } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'gomi-dark-mode';

  readonly isDark = signal<boolean>(this.loadPreference());

  constructor(@Inject(DOCUMENT) private document: Document) {
    // Apply theme on creation
    this.applyTheme(this.isDark());

    effect(() => {
      const dark = this.isDark();
      this.applyTheme(dark);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dark));
    });
  }

  toggle(): void {
    this.isDark.update(v => !v);
  }

  private loadPreference(): boolean {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored !== null) return JSON.parse(stored);
    } catch {}
    // Respect OS preference as fallback
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }

  private applyTheme(dark: boolean): void {
    if (dark) {
      this.document.documentElement.classList.add('dark-mode');
    } else {
      this.document.documentElement.classList.remove('dark-mode');
    }
  }
}
