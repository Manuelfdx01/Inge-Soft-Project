import { Component, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamificationService } from '../../core/services/gamification.service';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game.component.html',
  styleUrl: './game.component.scss',
})
export class GameComponent implements AfterViewInit, OnDestroy {
  private gamificationService = inject(GamificationService);
  private cleanup: (() => void) | null = null;

  ngAfterViewInit(): void {
    // Defer one tick so Angular has finished rendering the template
    setTimeout(() => {
      this.cleanup = initMemoriaReciclable(this.gamificationService);
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
  }
}

/* =====================================================================
   MEMORIA RECICLABLE — lógica del juego (adaptada para Angular)

   Cambios respecto a docs/v6/script.js:
     · Todos los IDs tienen el prefijo "mr-" para evitar colisiones con
       el resto de la aplicación.
     · Las rutas de audio apuntan a /sounds/ (servidas desde
       frontend/public/sounds/).
     · document.getElementById → helper local getElementById (mismo doc).
     · document.querySelectorAll(".bin") → scoped a #mr-app.
     · La función se exporta como initMemoriaReciclable() y devuelve
       un destructor para que Angular pueda limpiarlo en ngOnDestroy.
   ===================================================================== */

function initMemoriaReciclable(gamificationService: GamificationService): () => void {
  'use strict';

  const PREFIX = 'mr-';
  function el(id: string): HTMLElement {
    return document.getElementById(PREFIX + id) as HTMLElement;
  }

  /* ==================================================================
     0. AUDIO MANAGER
     ================================================================== */

  class AudioManager {
    SETTINGS_KEY = 'memoriaReciclable.audioSettings';
    SOUND_FILES: Record<string, string> = {
      click:       'sounds/click.wav',
      memoryStart: 'sounds/memory-start.wav',
      memoryEnd:   'sounds/memory-end.wav',
      pickup:      'sounds/pickup.wav',
      drop:        'sounds/drop.wav',
      correct:     'sounds/correct.wav',
      wrong:       'sounds/wrong.wav',
      levelUp:     'sounds/level-up.wav',
      gameOver:    'sounds/game-over.wav',
      highScore:   'sounds/high-score.wav',
      menuBack:    'sounds/menu-back.wav',
    };
    MUSIC_FILE = 'sounds/background-music.wav';
    SFX_RELATIVE_VOLUME: Record<string, number> = {
      click: 0.7, memoryStart: 0.6, memoryEnd: 0.6, pickup: 0.65,
      drop: 0.7, correct: 0.8, wrong: 0.8, levelUp: 0.85,
      gameOver: 0.85, highScore: 0.9, menuBack: 0.6,
    };
    MUSIC_RELATIVE_VOLUME = 0.35;

    settings: { musicEnabled: boolean; sfxEnabled: boolean; volume: number };
    sfxElements: Record<string, HTMLAudioElement> = {};
    music: HTMLAudioElement;

    constructor() {
      this.settings = this.loadSettings();

      Object.keys(this.SOUND_FILES).forEach(key => {
        const audio = new Audio(this.SOUND_FILES[key]);
        audio.preload = 'auto';
        audio.addEventListener('error', () =>
          console.warn(`[AudioManager] No se pudo cargar "${this.SOUND_FILES[key]}".`)
        );
        this.sfxElements[key] = audio;
      });

      this.music = new Audio(this.MUSIC_FILE);
      this.music.loop = true;
      this.music.preload = 'auto';
      this.music.addEventListener('error', () =>
        console.warn(`[AudioManager] No se pudo cargar la música de fondo.`)
      );
      this.applyVolumes();
    }

    loadSettings() {
      const defaults = { musicEnabled: true, sfxEnabled: true, volume: 70 };
      try {
        const raw = localStorage.getItem(this.SETTINGS_KEY);
        if (!raw) return defaults;
        const p = JSON.parse(raw);
        return {
          musicEnabled: typeof p.musicEnabled === 'boolean' ? p.musicEnabled : defaults.musicEnabled,
          sfxEnabled:   typeof p.sfxEnabled   === 'boolean' ? p.sfxEnabled   : defaults.sfxEnabled,
          volume:       Number.isFinite(p.volume) ? Math.min(100, Math.max(0, p.volume)) : defaults.volume,
        };
      } catch { return defaults; }
    }

    saveSettings() {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.settings));
    }

    play(key: string) {
      if (!this.settings.sfxEnabled) return;
      const audio = this.sfxElements[key];
      if (!audio) return;
      try {
        audio.currentTime = 0;
        const p = audio.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch { /* noop */ }
    }

    playMusic() {
      if (!this.settings.musicEnabled) return;
      if (!this.music.paused) return;
      this.music.currentTime = 0;
      const p = this.music.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }

    stopMusic() {
      if (this.music.paused) return;
      this.music.pause();
      this.music.currentTime = 0;
    }

    applyVolumes() {
      const master = this.settings.volume / 100;
      this.music.volume = this.settings.musicEnabled ? master * this.MUSIC_RELATIVE_VOLUME : 0;
      Object.keys(this.sfxElements).forEach(key => {
        const rel = this.SFX_RELATIVE_VOLUME[key] || 0.75;
        this.sfxElements[key].volume = master * rel;
      });
    }

    setMusicEnabled(enabled: boolean) {
      this.settings.musicEnabled = enabled;
      this.saveSettings(); this.applyVolumes();
      if (enabled) this.playMusic(); else this.stopMusic();
    }

    setSfxEnabled(enabled: boolean) {
      this.settings.sfxEnabled = enabled;
      this.saveSettings();
    }

    setVolume(value: number) {
      this.settings.volume = Math.min(100, Math.max(0, value));
      this.saveSettings(); this.applyVolumes();
    }

    destroy() { this.stopMusic(); }
  }

  const audio = new AudioManager();

  /* ==================================================================
     1. DATOS DE RESIDUOS
     ================================================================== */

  interface Residuo { nombre: string; emoji: string; categoria: string; dificultad: number; }

  const RESIDUOS: Residuo[] = [
    { nombre: 'Cáscara de banano',              emoji: '🍌', categoria: 'organicos',       dificultad: 1 },
    { nombre: 'Restos de fruta',                emoji: '🍎', categoria: 'organicos',       dificultad: 1 },
    { nombre: 'Cáscara de naranja',             emoji: '🍊', categoria: 'organicos',       dificultad: 1 },
    { nombre: 'Restos de comida',               emoji: '🍚', categoria: 'organicos',       dificultad: 1 },
    { nombre: 'Cáscara de huevo',               emoji: '🥚', categoria: 'organicos',       dificultad: 2 },
    { nombre: 'Hojas secas',                    emoji: '🍂', categoria: 'organicos',       dificultad: 2 },
    { nombre: 'Café molido usado',              emoji: '☕', categoria: 'organicos',       dificultad: 2 },
    { nombre: 'Restos de verduras',             emoji: '🥕', categoria: 'organicos',       dificultad: 1 },
    { nombre: 'Botella plástica',               emoji: '🧴', categoria: 'aprovechables',   dificultad: 1 },
    { nombre: 'Lata de aluminio',               emoji: '🥫', categoria: 'aprovechables',   dificultad: 1 },
    { nombre: 'Caja de cartón',                 emoji: '📦', categoria: 'aprovechables',   dificultad: 1 },
    { nombre: 'Periódico',                      emoji: '📰', categoria: 'aprovechables',   dificultad: 1 },
    { nombre: 'Botella de vidrio',              emoji: '🍾', categoria: 'aprovechables',   dificultad: 2 },
    { nombre: 'Papel de oficina limpio',        emoji: '📄', categoria: 'aprovechables',   dificultad: 2 },
    { nombre: 'Revista',                        emoji: '📖', categoria: 'aprovechables',   dificultad: 2 },
    { nombre: 'Tapa metálica',                  emoji: '🪙', categoria: 'aprovechables',   dificultad: 2 },
    { nombre: 'Papel higiénico usado',          emoji: '🧻', categoria: 'no_aprovechables', dificultad: 1 },
    { nombre: 'Servilleta usada',               emoji: '🍽️', categoria: 'no_aprovechables', dificultad: 1 },
    { nombre: 'Colilla de cigarrillo',          emoji: '🚬', categoria: 'no_aprovechables', dificultad: 2 },
    { nombre: 'Pañal desechable',               emoji: '👶', categoria: 'no_aprovechables', dificultad: 1 },
    { nombre: 'Chicle usado',                   emoji: '🍬', categoria: 'no_aprovechables', dificultad: 2 },
    { nombre: 'Icopor sucio',                   emoji: '🥡', categoria: 'no_aprovechables', dificultad: 3 },
    { nombre: 'Envoltura plastificada de dulce',emoji: '🍭', categoria: 'no_aprovechables', dificultad: 3 },
    { nombre: 'Papel aluminio con grasa',       emoji: '🫓', categoria: 'no_aprovechables', dificultad: 3 },
    { nombre: 'Cartón de pizza grasoso',        emoji: '🍕', categoria: 'no_aprovechables', dificultad: 3 },
    { nombre: 'Vaso plástico con residuos',     emoji: '🥤', categoria: 'no_aprovechables', dificultad: 3 },
  ];

  const CATEGORIA_LABEL: Record<string, string> = {
    organicos:       'Orgánicos',
    aprovechables:   'Aprovechables',
    no_aprovechables:'No aprovechables',
  };

  /* ==================================================================
     2. ESTADO
     ================================================================== */

  const state = {
    level: 1, score: 0,
    queue: [] as Residuo[], currentIndex: 0,
    dragging: null as any, busy: false,
  };

  const HIGH_SCORE_KEY = 'memoriaReciclable.highScore';

  function getHighScore(): number {
    const v = parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10);
    return Number.isFinite(v) ? v : 0;
  }
  function setHighScore(v: number) { localStorage.setItem(HIGH_SCORE_KEY, String(v)); }

  /* ==================================================================
     4. NAVEGACIÓN
     ================================================================== */

  const screens: Record<string, HTMLElement> = {
    menu:     el('screen-menu'),
    game:     el('screen-game'),
    gameover: el('screen-gameover'),
  };

  function showScreen(name: string) {
    Object.values(screens).forEach(s => s.classList.remove('mr-active'));
    screens[name].classList.add('mr-active');
  }

  function goToMenu() {
    el('high-score-display').textContent = String(getHighScore());
    showScreen('menu');
  }

  /* ==================================================================
     5. NIVELES
     ================================================================== */

  function poolForLevel(level: number): Residuo[] {
    const max = level >= 8 ? 3 : level >= 4 ? 2 : 1;
    return RESIDUOS.filter(r => r.dificultad <= max);
  }

  function shuffle<T>(arr: T[]): T[] {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function generateLevelQueue(level: number): Residuo[] {
    const pool = shuffle(poolForLevel(level));
    const queue: Residuo[] = [];
    for (let i = 0; i < level; i++) {
      if (queue.length > 0 && queue.length % pool.length === 0)
        pool.push(...shuffle(pool));
      queue.push(pool[i % pool.length]);
    }
    return queue;
  }

  function startLevel(level: number) {
    state.level = level;
    state.queue = generateLevelQueue(level);
    state.currentIndex = 0;
    el('hud-level').textContent = String(state.level);
    el('hud-score').textContent = String(state.score);
    runMemoryPhase();
  }

  function startNewGame() {
    state.level = 1; state.score = 0;
    showScreen('game');
    startLevel(1);
  }

  /* ==================================================================
     6. FASE DE MEMORIA
     ================================================================== */

  const memoryPhaseEl  = el('memory-phase');
  const playPhaseEl    = el('play-phase');
  const memoryListEl   = el('memory-list');
  const memoryTimerBar = el('memory-timer-bar');

  function runMemoryPhase() {
    audio.play('memoryStart');
    state.busy = true;
    playPhaseEl.classList.add('mr-hidden');
    memoryPhaseEl.classList.remove('mr-hidden');
    memoryListEl.classList.remove('mr-hiding');
    memoryListEl.innerHTML = '';

    state.queue.forEach((residuo, i) => {
      const item = document.createElement('div');
      item.className = 'mr-memory-item';
      item.style.animationDelay = `${i * 0.15}s`;
      item.innerHTML = `
        <span class="mr-memory-item__order">${i + 1}</span>
        <span class="mr-memory-item__emoji">${residuo.emoji}</span>
        <span class="mr-memory-item__name">${residuo.nombre}</span>
      `;
      memoryListEl.appendChild(item);
    });

    const duration = 1800 + state.queue.length * 1300;

    (memoryTimerBar as HTMLElement).style.transition = 'none';
    (memoryTimerBar as HTMLElement).style.transform = 'scaleX(1)';
    void (memoryTimerBar as HTMLElement).offsetWidth;
    (memoryTimerBar as HTMLElement).style.transition = `transform ${duration}ms linear`;
    (memoryTimerBar as HTMLElement).style.transform = 'scaleX(0)';

    setTimeout(() => {
      audio.play('memoryEnd');
      memoryListEl.classList.add('mr-hiding');
      setTimeout(() => {
        memoryPhaseEl.classList.add('mr-hidden');
        beginPlayPhase();
      }, 480);
    }, duration);
  }

  /* ==================================================================
     7. FASE DE JUEGO — CINTA
     ================================================================== */

  const conveyorTrack    = el('conveyor-track');
  const feedbackToast    = el('feedback-toast');
  const revealStage      = el('reveal-stage');
  const levelTransition  = el('level-transition');
  const levelTransitionSub = el('level-transition-sub');

  function beginPlayPhase() {
    playPhaseEl.classList.remove('mr-hidden');
    conveyorTrack.innerHTML = '';

    state.queue.forEach((residuo, i) => {
      const pkg = document.createElement('div');
      pkg.className = 'mr-package ' + (i === 0 ? 'mr-package--active' : 'mr-package--pending');
      pkg.dataset['index'] = String(i);
      pkg.textContent = '📦';
      conveyorTrack.appendChild(pkg);
    });

    attachDragHandlers();
    state.busy = false;
  }

  function refreshActivePackage() {
    conveyorTrack.querySelectorAll('.mr-package').forEach(pkg => {
      const idx = parseInt((pkg as HTMLElement).dataset['index'] || '0', 10);
      pkg.classList.remove('mr-package--active', 'mr-package--pending');
      if (idx === state.currentIndex) pkg.classList.add('mr-package--active');
      else if (idx > state.currentIndex) pkg.classList.add('mr-package--pending');
    });
  }

  /* ==================================================================
     8. ARRASTRAR Y SOLTAR
     ================================================================== */

  let onDocPointerMove:   ((e: PointerEvent) => void) | null = null;
  let onDocPointerUp:     ((e: PointerEvent) => void) | null = null;
  let onDocPointerCancel: ((e: PointerEvent) => void) | null = null;

  function attachDragHandlers() {
    conveyorTrack.querySelectorAll('.mr-package').forEach(pkg => {
      pkg.addEventListener('pointerdown', onPackagePointerDown as EventListener);
    });
  }

  function onPackagePointerDown(e: PointerEvent) {
    if (state.busy || state.dragging) return;
    const pkg = e.currentTarget as HTMLElement;
    const idx = parseInt(pkg.dataset['index'] || '0', 10);
    if (idx !== state.currentIndex) return;

    e.preventDefault();
    audio.play('pickup');

    const rect = pkg.getBoundingClientRect();
    state.dragging = {
      el: pkg,
      pointerId: e.pointerId,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      originRect: rect,
      originParent: pkg.parentElement,
      originNext: pkg.nextSibling,
    };

    pkg.classList.remove('mr-package--active');
    pkg.classList.add('mr-package--dragging');
    pkg.style.width  = rect.width + 'px';
    pkg.style.height = rect.height + 'px';
    pkg.style.left   = rect.left + 'px';
    pkg.style.top    = rect.top + 'px';
    document.body.appendChild(pkg);

    onDocPointerMove   = handleDragMove;
    onDocPointerUp     = (evt: PointerEvent) => finishDrag(evt, false);
    onDocPointerCancel = (evt: PointerEvent) => finishDrag(evt, true);

    document.addEventListener('pointermove',   onDocPointerMove);
    document.addEventListener('pointerup',     onDocPointerUp);
    document.addEventListener('pointercancel', onDocPointerCancel);
  }

  function handleDragMove(e: PointerEvent) {
    const d = state.dragging;
    if (!d || e.pointerId !== d.pointerId) return;
    d.el.style.left = e.clientX - d.offsetX + 'px';
    d.el.style.top  = e.clientY - d.offsetY + 'px';
    highlightBinUnderPoint(e.clientX, e.clientY);
  }

  function getBinAtPoint(x: number, y: number): HTMLElement | null {
    const bins = document.querySelectorAll('.mr-bin');
    for (const bin of Array.from(bins)) {
      const r = bin.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom)
        return bin as HTMLElement;
    }
    return null;
  }

  function highlightBinUnderPoint(x: number, y: number) {
    const hovered = getBinAtPoint(x, y);
    document.querySelectorAll('.mr-bin').forEach(bin =>
      bin.classList.toggle('mr-drop-hover', bin === hovered)
    );
  }

  function finishDrag(e: PointerEvent, wasCancelled: boolean) {
    const d = state.dragging;
    if (!d || e.pointerId !== d.pointerId) return;

    document.removeEventListener('pointermove',   onDocPointerMove!);
    document.removeEventListener('pointerup',     onDocPointerUp!);
    document.removeEventListener('pointercancel', onDocPointerCancel!);
    onDocPointerMove = onDocPointerUp = onDocPointerCancel = null;

    document.querySelectorAll('.mr-bin').forEach(bin => bin.classList.remove('mr-drop-hover'));

    const pkg = d.el as HTMLElement;
    state.dragging = null;

    const bin = wasCancelled ? null : getBinAtPoint(e.clientX, e.clientY);
    if (bin) dropOnBin(pkg, bin.dataset['category']!, bin);
    else returnPackageToConveyor(pkg, d);
  }

  function returnPackageToConveyor(pkg: HTMLElement, d: any) {
    state.busy = true;
    pkg.style.transition = 'left 0.25s ease, top 0.25s ease';
    pkg.style.left = d.originRect.left + 'px';
    pkg.style.top  = d.originRect.top  + 'px';

    const cleanup = () => {
      pkg.style.transition = '';
      pkg.style.position = '';
      pkg.style.left = '';
      pkg.style.top  = '';
      pkg.style.width  = '';
      pkg.style.height = '';
      pkg.classList.remove('mr-package--dragging');
      pkg.classList.add('mr-package--active');
      if (d.originNext && (d.originNext as Node).parentElement === d.originParent)
        (d.originParent as HTMLElement).insertBefore(pkg, d.originNext);
      else
        (d.originParent as HTMLElement).appendChild(pkg);
      state.busy = false;
    };

    let done = false;
    const finish = () => { if (done) return; done = true; cleanup(); };
    pkg.addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, 320);
  }

  /* ==================================================================
     9. CLASIFICACIÓN, REVELACIÓN Y PUNTUACIÓN
     ================================================================== */

  function dropOnBin(pkg: HTMLElement, category: string, binEl: HTMLElement) {
    state.busy = true;
    audio.play('drop');
    const residuo = state.queue[state.currentIndex];
    const correcto = residuo.categoria === category;

    const binRect = binEl.getBoundingClientRect();
    pkg.classList.add('mr-package--falling');
    pkg.style.left      = binRect.left + binRect.width / 2 - pkg.offsetWidth / 2 + 'px';
    pkg.style.top       = binRect.top + 'px';
    pkg.style.transform = 'translateY(18px) scale(0.35) rotate(15deg)';
    pkg.style.opacity   = '0';

    setTimeout(() => { pkg.remove(); showReveal(residuo, correcto); }, 420);
  }

  function showReveal(residuo: Residuo, correcto: boolean) {
    revealStage.innerHTML = `
      <div class="mr-reveal-card">
        <span class="mr-reveal-card__emoji">${residuo.emoji}</span>
        <span class="mr-reveal-card__name">${residuo.nombre}</span>
      </div>
    `;
    if (correcto) { audio.play('correct'); showToast('✅ ¡Correcto!', 'correct'); }
    else          { audio.play('wrong');   showToast('❌ ¡Clasificación incorrecta!', 'incorrect'); }

    setTimeout(() => {
      revealStage.innerHTML = '';
      hideToast();
      if (correcto) handleCorrectClassification();
      else handleIncorrectClassification(residuo);
    }, 1000);
  }

  function showToast(message: string, kind: string) {
    feedbackToast.textContent = message;
    feedbackToast.className = 'mr-feedback-toast mr-show ' + kind;
  }
  function hideToast() { feedbackToast.className = 'mr-feedback-toast'; }

  function handleCorrectClassification() {
    state.score += 10 + state.level * 2;
    el('hud-score').textContent = String(state.score);
    state.currentIndex++;
    if (state.currentIndex >= state.queue.length) completeLevel();
    else { refreshActivePackage(); state.busy = false; }
  }

  function completeLevel() {
    audio.play('levelUp');
    const bonus = state.level * 20 + 15;
    state.score += bonus;
    el('hud-score').textContent = String(state.score);
    levelTransitionSub.textContent = `+${bonus} puntos de bono · siguiente nivel: ${state.queue.length + 1} residuos`;
    levelTransition.classList.remove('mr-hidden');
    setTimeout(() => {
      levelTransition.classList.add('mr-hidden');
      startLevel(state.level + 1);
    }, 1400);
  }

  function handleIncorrectClassification(residuo: Residuo) { gameOver(residuo); }

  /* ==================================================================
     10. GAME OVER
     ================================================================== */

  function gameOver(residuoFallado: Residuo | null) {
    audio.stopMusic();
    const previousHigh = getHighScore();
    const isNewRecord  = state.score > previousHigh;
    if (isNewRecord) setHighScore(state.score);

    // Record action in backend
    if (state.score > 0) {
      gamificationService.recordAction('jugar_juego', { score: state.score }).subscribe({
        next: (res) => console.log('Gamification updated:', res),
        error: (err) => console.error('Failed to update gamification:', err)
      });
    }

    audio.play('gameOver');
    if (isNewRecord) setTimeout(() => audio.play('highScore'), 350);

    el('go-level').textContent     = String(state.level);
    el('go-score').textContent     = String(state.score);
    el('go-highscore').textContent = String(Math.max(state.score, previousHigh));
    el('go-new-record').classList.toggle('mr-hidden', !isNewRecord);

    const errorBox = el('gameover-error');
    if (residuoFallado) {
      errorBox.innerHTML = `
        El residuo era: <strong>${residuoFallado.emoji} ${residuoFallado.nombre}</strong>.<br>
        La clasificación correcta era: <strong>${CATEGORIA_LABEL[residuoFallado.categoria]}</strong>.
      `;
      errorBox.classList.remove('mr-hidden');
    } else {
      errorBox.classList.add('mr-hidden');
    }
    showScreen('gameover');
  }

  /* ==================================================================
     11. ARRANQUE Y EVENTOS
     ================================================================== */

  el('btn-play').addEventListener('click', () => {
    audio.play('click');
    audio.playMusic();
    startNewGame();
  });

  el('btn-retry').addEventListener('click', () => {
    audio.play('click');
    audio.playMusic();
    startNewGame();
  });

  el('btn-menu').addEventListener('click', () => {
    audio.play('menuBack');
    goToMenu();
  });

  /* ---- Panel de audio ---- */
  const audioToggleBtn  = el('btn-audio-toggle');
  const audioToggleIcon = el('audio-toggle-icon');
  const audioPanel      = el('audio-panel');
  const toggleMusicInput= el('toggle-music') as HTMLInputElement;
  const toggleSfxInput  = el('toggle-sfx')   as HTMLInputElement;
  const volumeSlider    = el('volume-slider') as HTMLInputElement;

  function refreshAudioUI() {
    toggleMusicInput.checked = audio.settings.musicEnabled;
    toggleSfxInput.checked   = audio.settings.sfxEnabled;
    volumeSlider.value       = String(audio.settings.volume);
    const anyOn = audio.settings.musicEnabled || audio.settings.sfxEnabled;
    audioToggleIcon.textContent = anyOn ? '🔊' : '🔇';
  }

  audioToggleBtn.addEventListener('click', () => {
    const isHidden = audioPanel.classList.toggle('mr-hidden');
    audioToggleBtn.setAttribute('aria-expanded', String(!isHidden));
  });

  const closePanelOnOutsideClick = (e: PointerEvent) => {
    if (!el('audio-control').contains(e.target as Node)) {
      audioPanel.classList.add('mr-hidden');
      audioToggleBtn.setAttribute('aria-expanded', 'false');
    }
  };
  document.addEventListener('pointerdown', closePanelOnOutsideClick);

  toggleMusicInput.addEventListener('change', () => {
    audio.setMusicEnabled(toggleMusicInput.checked);
    refreshAudioUI();
  });

  toggleSfxInput.addEventListener('change', () => {
    audio.setSfxEnabled(toggleSfxInput.checked);
    refreshAudioUI();
  });

  volumeSlider.addEventListener('input', () => {
    audio.setVolume(parseInt(volumeSlider.value, 10));
  });

  refreshAudioUI();
  goToMenu();

  /* ==================================================================
     DESTRUCTOR — llamado por ngOnDestroy
     ================================================================== */
  return function destroy() {
    audio.destroy();
    document.removeEventListener('pointerdown', closePanelOnOutsideClick);
    if (onDocPointerMove)   document.removeEventListener('pointermove',   onDocPointerMove);
    if (onDocPointerUp)     document.removeEventListener('pointerup',     onDocPointerUp);
    if (onDocPointerCancel) document.removeEventListener('pointercancel', onDocPointerCancel);
  };
}
