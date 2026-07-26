import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { GuidesService, RecyclingGuide } from '../../core/services/guides.service';

interface Category {
  label: string;
  waste_type: string | null;
  icon: string;
}

@Component({
  selector: 'app-guides',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './guides.component.html',
  styleUrl: './guides.component.scss',
})
export class GuidesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchInput$ = new Subject<string>();

  /** All guides fetched from backend once */
  private allGuides: RecyclingGuide[] = [];

  /** Guides shown after client-side filtering */
  guides: RecyclingGuide[] = [];
  selectedGuide: RecyclingGuide | null = null;
  loading = false;
  error = false;

  searchQuery = '';
  activeCategory: string | null = null;

  categories: Category[] = [
    { label: 'Todos',        waste_type: null,          icon: '♻️' },
    { label: 'Plástico',     waste_type: 'PLASTICO',    icon: '🟠' },
    { label: 'Papel',        waste_type: 'PAPEL',       icon: '🟣' },
    { label: 'Vidrio',       waste_type: 'VIDRIO',      icon: '🔵' },
    { label: 'Orgánicos',    waste_type: 'ORGANICO',    icon: '🟢' },
    { label: 'Electrónicos', waste_type: 'ELECTRONICO', icon: '🖥️' },
    { label: 'Metal',        waste_type: 'METAL',       icon: '⚙️' },
    { label: 'Textiles',     waste_type: 'TEXTIL',      icon: '👕' },
    { label: 'Peligrosos',   waste_type: 'PELIGROSO',   icon: '⚠️' },
  ];

  difficultyLabels: Record<string, { label: string; cls: string }> = {
    FACIL:    { label: 'Fácil',      cls: 'diff-easy' },
    MEDIO:    { label: 'Intermedio', cls: 'diff-medium' },
    AVANZADO: { label: 'Avanzado',   cls: 'diff-hard' },
  };

  constructor(private guidesService: GuidesService) {}

  ngOnInit(): void {
    // Debounced client-side search — no extra HTTP call
    this.searchInput$
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this.applyFilters());

    this.loadAll();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** One-time fetch of all guides from backend */
  loadAll(): void {
    this.loading = true;
    this.error = false;
    this.selectedGuide = null;

    this.guidesService
      .getGuides()                        // no params → fetch everything
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.allGuides = data;
          this.applyFilters();
          this.loading = false;
        },
        error: () => {
          this.error = true;
          this.loading = false;
        },
      });
  }

  /** Client-side filtering — instant, no HTTP round-trip */
  applyFilters(): void {
    let result = [...this.allGuides];

    if (this.activeCategory) {
      result = result.filter(
        (g) => g.waste_type.toUpperCase() === this.activeCategory!.toUpperCase()
      );
    }

    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.content.toLowerCase().includes(q) ||
          (g.category ?? '').toLowerCase().includes(q)
      );
    }

    this.guides = result;
  }

  selectCategory(wt: string | null): void {
    this.activeCategory = wt;
    this.applyFilters();
  }

  onSearchChange(): void {
    this.searchInput$.next(this.searchQuery);
  }

  toggle(guide: RecyclingGuide): void {
    this.selectedGuide = this.selectedGuide?.id === guide.id ? null : guide;
  }

  isExpanded(guide: RecyclingGuide): boolean {
    return this.selectedGuide?.id === guide.id;
  }

  getDifficulty(d: string) {
    return this.difficultyLabels[d] ?? { label: d, cls: '' };
  }

  retry(): void {
    this.loadAll();
  }

  trackGuide(_: number, guide: RecyclingGuide): number {
    return guide.id;
  }

  get totalCount(): number  { return this.allGuides.length; }
  get filteredCount(): number { return this.guides.length; }
}
