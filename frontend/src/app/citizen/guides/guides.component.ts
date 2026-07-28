import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { GuidesService, RecyclingGuide } from '../../core/services/guides.service';
import { GamificationService } from '../../core/services/gamification.service';

interface Category {
  label: string;
  waste_type: string | null;
  icon: string;
}

@Component({
  selector: 'app-guides',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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

  constructor(
    private guidesService: GuidesService,
    private gamificationService: GamificationService
  ) {}

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

  // ── Quiz Interactivo ──
  quizAnswers: Record<number, number> = {};
  quizSubmitted = false;
  quizSuccess = false;
  quizMessage = '';

  getCompletedQuizzes(): number[] {
    try {
      const raw = localStorage.getItem('gomi_completed_quizzes');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  isQuizCompleted(guideId: number): boolean {
    return this.getCompletedQuizzes().includes(guideId);
  }

  getQuizForGuide(guide: RecyclingGuide) {
    const type = (guide.waste_type || '').toUpperCase();
    if (type === 'PLASTICO') {
      return [
        {
          q: '¿Qué se debe hacer con una botella plástica antes de reciclarla?',
          opts: ['Lavarla, secarla y aplastarla', 'Desecharla llena de líquido', 'Quemarla'],
          ans: 0
        },
        {
          q: '¿El plástico PET 1 es reciclabre en contenedores blancos?',
          opts: ['Sí, totalmente', 'No, nunca', 'Solo en compost'],
          ans: 0
        }
      ];
    }
    if (type === 'PAPEL') {
      return [
        {
          q: '¿Las cajas de pizza grasosas se pueden reciclar con el papel limpio?',
          opts: ['Solo las partes totalmente limpias', 'Sí, la grasa no importa', 'Sí, todo se recicla junto'],
          ans: 0
        },
        {
          q: '¿En qué caneca va el papel limpio y seco?',
          opts: ['Blanca (Aprovechables)', 'Verde (Orgánicos)', 'Negra (No aprovechables)'],
          ans: 0
        }
      ];
    }
    if (type === 'VIDRIO') {
      return [
        {
          q: '¿Cómo debe entregarse el vidrio roto para proteger a los recicladores?',
          opts: ['Empacado y marcado visiblemente', 'Suelto en bolsa plástica', 'Mezclado con comida'],
          ans: 0
        },
        {
          q: '¿Los espejos y cristales planos van en la misma caneca que las botellas de vidrio?',
          opts: ['No, son tipos de vidrio distintos', 'Sí, es exactamente igual', 'No se recicla ningún vidrio'],
          ans: 0
        }
      ];
    }
    return [
      {
        q: '¿Cuál es el propósito principal de separar en la fuente?',
        opts: ['Dignificar el trabajo del reciclador y reaprovechar materia prima', 'Gastar bolsas de colores', 'Ninguno'],
        ans: 0
      },
      {
        q: '¿Cuál es el color del contenedor de residuos aprovechables secos?',
        opts: ['Blanco', 'Negro', 'Verde'],
        ans: 0
      }
    ];
  }

  submitQuiz(guide: RecyclingGuide): void {
    // Reintentar si ya se envió pero no se aprobó
    if (this.quizSubmitted && !this.quizSuccess) {
      this.quizAnswers = {};
      this.quizSubmitted = false;
      this.quizMessage = '';
      return;
    }
    // Bloquear si ya aprobó
    if (this.quizSubmitted && this.quizSuccess) return;

    const questions = this.getQuizForGuide(guide);
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (this.quizAnswers[idx] === q.ans) {
        correctCount++;
      }
    });

    this.quizSubmitted = true;
    if (correctCount === questions.length) {
      this.quizSuccess = true;
      this.quizMessage = '🎉 ¡Felicidades! Has aprobado el test con 100% de aciertos. (+50 pts | +50 XP)';

      const completed = this.getCompletedQuizzes();
      if (!completed.includes(guide.id)) {
        completed.push(guide.id);
        localStorage.setItem('gomi_completed_quizzes', JSON.stringify(completed));
      }

      this.gamificationService.recordAction('aprobar_quiz_guia', { guide_id: guide.id }).subscribe({
        next: () => {},
        error: () => {}
      });
    } else {
      this.quizSuccess = false;
      this.quizMessage = `⚠️ Tuviste ${correctCount} de ${questions.length} respuestas correctas. Revisa las opciones resaltadas e inténtalo de nuevo.`;
    }
  }

  toggle(guide: RecyclingGuide): void {
    const isOpening = this.selectedGuide?.id !== guide.id;
    this.selectedGuide = isOpening ? guide : null;
    this.quizAnswers = {};
    this.quizSubmitted = false;
    this.quizMessage = '';

    if (isOpening) {
      this.gamificationService.recordAction('leer_guia').subscribe({
        next: () => {},
        error: () => {}
      });
    }
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
