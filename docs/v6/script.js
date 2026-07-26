/* =====================================================================
   MEMORIA RECICLABLE — lógica del juego
   Organizado en secciones:
     0. AudioManager (música y efectos de sonido)
     1. Datos de residuos
     2. Estado del juego
     3. LocalStorage (récord)
     4. Navegación entre pantallas
     5. Sistema de niveles (generación de residuos por nivel)
     6. Fase de memoria
     7. Fase de juego (cinta transportadora)
     8. Arrastrar y soltar (pointer events)
     9. Clasificación, revelación y puntuación
     10. Game Over
     11. Arranque
   ===================================================================== */

(function () {
  "use strict";

  /* ===================================================================
     0. AUDIO MANAGER
     Sistema centralizado de audio: música de fondo + efectos de
     sonido, con preferencias persistidas en localStorage.

     Todos los archivos se cargan desde /sounds. Actualmente son
     sonidos sintetizados (placeholder, generados con Python/stdlib —
     ver generate_sounds.py) para que el juego suene "de fábrica" sin
     depender de librerías externas. Se pueden reemplazar en cualquier
     momento por archivos .wav o .mp3 propios, siempre que conserven
     estos mismos nombres de archivo dentro de /sounds:

       sounds/background-music.wav  música de fondo (loop)
       sounds/click.wav             botón JUGAR / jugar de nuevo
       sounds/memory-start.wav      inicio de la fase de memoria
       sounds/memory-end.wav        fin de la cuenta regresiva
       sounds/pickup.wav            agarrar un paquete
       sounds/drop.wav              soltar un paquete sobre una caneca
       sounds/correct.wav           clasificación correcta
       sounds/wrong.wav             clasificación incorrecta
       sounds/level-up.wav          nivel completado
       sounds/game-over.wav         game over
       sounds/high-score.wav        nuevo puntaje más alto
       sounds/menu-back.wav         volver al menú

     Si se prefieren archivos .mp3, basta con cambiar SOUND_FILES /
     MUSIC_FILE más abajo — el resto del sistema no necesita cambios.
     =================================================================== */

  class AudioManager {
    constructor() {
      this.SETTINGS_KEY = "memoriaReciclable.audioSettings";

      this.SOUND_FILES = {
        click: "sounds/click.wav",
        memoryStart: "sounds/memory-start.wav",
        memoryEnd: "sounds/memory-end.wav",
        pickup: "sounds/pickup.wav",
        drop: "sounds/drop.wav",
        correct: "sounds/correct.wav",
        wrong: "sounds/wrong.wav",
        levelUp: "sounds/level-up.wav",
        gameOver: "sounds/game-over.wav",
        highScore: "sounds/high-score.wav",
        menuBack: "sounds/menu-back.wav",
      };
      this.MUSIC_FILE = "sounds/background-music.wav";

      // Volumen relativo de cada efecto (0-1) respecto al volumen
      // maestro, para que ningún sonido resulte más molesto que otro.
      this.SFX_RELATIVE_VOLUME = {
        click: 0.7,
        memoryStart: 0.6,
        memoryEnd: 0.6,
        pickup: 0.65,
        drop: 0.7,
        correct: 0.8,
        wrong: 0.8,
        levelUp: 0.85,
        gameOver: 0.85,
        highScore: 0.9,
        menuBack: 0.6,
      };
      this.MUSIC_RELATIVE_VOLUME = 0.35; // la música siempre suena más baja que los efectos

      this.settings = this.loadSettings();

      // Un <audio> por efecto: se reinicia (`currentTime = 0`) en
      // cada reproducción en lugar de crear elementos nuevos, así se
      // evita acumular nodos y las descargas quedan cacheadas.
      this.sfxElements = {};
      Object.keys(this.SOUND_FILES).forEach((key) => {
        const el = new Audio(this.SOUND_FILES[key]);
        el.preload = "auto";
        // Si el archivo no existe o no puede decodificarse, lo
        // dejamos constar en consola pero el juego sigue funcionando
        // en silencio para ese efecto (no rompe la partida).
        el.addEventListener("error", () => {
          console.warn(`[AudioManager] No se pudo cargar "${this.SOUND_FILES[key]}". El juego sigue funcionando sin ese sonido.`);
        });
        this.sfxElements[key] = el;
      });

      this.music = new Audio(this.MUSIC_FILE);
      this.music.loop = true;
      this.music.preload = "auto";
      this.music.addEventListener("error", () => {
        console.warn(`[AudioManager] No se pudo cargar la música de fondo "${this.MUSIC_FILE}".`);
      });

      this.applyVolumes();
    }

    // --- Preferencias (localStorage) --------------------------------

    loadSettings() {
      const defaults = { musicEnabled: true, sfxEnabled: true, volume: 70 };
      try {
        const raw = localStorage.getItem(this.SETTINGS_KEY);
        if (!raw) return defaults;
        const parsed = JSON.parse(raw);
        return {
          musicEnabled: typeof parsed.musicEnabled === "boolean" ? parsed.musicEnabled : defaults.musicEnabled,
          sfxEnabled: typeof parsed.sfxEnabled === "boolean" ? parsed.sfxEnabled : defaults.sfxEnabled,
          volume: Number.isFinite(parsed.volume) ? Math.min(100, Math.max(0, parsed.volume)) : defaults.volume,
        };
      } catch (err) {
        return defaults;
      }
    }

    saveSettings() {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(this.settings));
    }

    // --- Reproducción de efectos -------------------------------------

    play(key) {
      if (!this.settings.sfxEnabled) return;
      const el = this.sfxElements[key];
      if (!el) return;
      try {
        el.currentTime = 0;
        const promise = el.play();
        if (promise && typeof promise.catch === "function") {
          // Ignora rechazos por políticas de autoplay: el primer
          // sonido siempre se dispara desde un gesto del usuario
          // (clic), así que en la práctica no debería bloquearse.
          promise.catch(() => {});
        }
      } catch (err) {
        /* noop: un efecto de sonido nunca debe romper el juego */
      }
    }

    // --- Música de fondo ----------------------------------------------

    playMusic() {
      if (!this.settings.musicEnabled) return;
      if (!this.music.paused) return; // ya está sonando, no reiniciar
      this.music.currentTime = 0;
      const promise = this.music.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(() => {});
      }
    }

    stopMusic() {
      if (this.music.paused) return;
      this.music.pause();
      this.music.currentTime = 0;
    }

    // --- Ajustes de volumen / activación ------------------------------

    applyVolumes() {
      const master = this.settings.volume / 100;
      this.music.volume = this.settings.musicEnabled ? master * this.MUSIC_RELATIVE_VOLUME : 0;
      Object.keys(this.sfxElements).forEach((key) => {
        const rel = this.SFX_RELATIVE_VOLUME[key] || 0.75;
        this.sfxElements[key].volume = master * rel;
      });
    }

    setMusicEnabled(enabled) {
      this.settings.musicEnabled = enabled;
      this.saveSettings();
      this.applyVolumes();
      if (enabled) this.playMusic();
      else this.stopMusic();
    }

    setSfxEnabled(enabled) {
      this.settings.sfxEnabled = enabled;
      this.saveSettings();
    }

    setVolume(value) {
      this.settings.volume = Math.min(100, Math.max(0, value));
      this.saveSettings();
      this.applyVolumes();
    }
  }

  const audio = new AudioManager();

  /* ===================================================================
     1. DATOS DE RESIDUOS
     Cada residuo tiene nombre, emoji, categoría correcta y una
     "dificultad" (1 = fácil/obvio, 2 = intermedio, 3 = engañoso) que se
     usa para ir ampliando el catálogo a medida que suben los niveles.
     =================================================================== */

  const RESIDUOS = [
    // --- Orgánicos ---
    { nombre: "Cáscara de banano", emoji: "🍌", categoria: "organicos", dificultad: 1 },
    { nombre: "Restos de fruta", emoji: "🍎", categoria: "organicos", dificultad: 1 },
    { nombre: "Cáscara de naranja", emoji: "🍊", categoria: "organicos", dificultad: 1 },
    { nombre: "Restos de comida", emoji: "🍚", categoria: "organicos", dificultad: 1 },
    { nombre: "Cáscara de huevo", emoji: "🥚", categoria: "organicos", dificultad: 2 },
    { nombre: "Hojas secas", emoji: "🍂", categoria: "organicos", dificultad: 2 },
    { nombre: "Café molido usado", emoji: "☕", categoria: "organicos", dificultad: 2 },
    { nombre: "Restos de verduras", emoji: "🥕", categoria: "organicos", dificultad: 1 },

    // --- Aprovechables ---
    { nombre: "Botella plástica", emoji: "🧴", categoria: "aprovechables", dificultad: 1 },
    { nombre: "Lata de aluminio", emoji: "🥫", categoria: "aprovechables", dificultad: 1 },
    { nombre: "Caja de cartón", emoji: "📦", categoria: "aprovechables", dificultad: 1 },
    { nombre: "Periódico", emoji: "📰", categoria: "aprovechables", dificultad: 1 },
    { nombre: "Botella de vidrio", emoji: "🍾", categoria: "aprovechables", dificultad: 2 },
    { nombre: "Papel de oficina limpio", emoji: "📄", categoria: "aprovechables", dificultad: 2 },
    { nombre: "Revista", emoji: "📖", categoria: "aprovechables", dificultad: 2 },
    { nombre: "Tapa metálica", emoji: "🪙", categoria: "aprovechables", dificultad: 2 },

    // --- No aprovechables ---
    { nombre: "Papel higiénico usado", emoji: "🧻", categoria: "no_aprovechables", dificultad: 1 },
    { nombre: "Servilleta usada", emoji: "🍽️", categoria: "no_aprovechables", dificultad: 1 },
    { nombre: "Colilla de cigarrillo", emoji: "🚬", categoria: "no_aprovechables", dificultad: 2 },
    { nombre: "Pañal desechable", emoji: "👶", categoria: "no_aprovechables", dificultad: 1 },
    { nombre: "Chicle usado", emoji: "🍬", categoria: "no_aprovechables", dificultad: 2 },
    { nombre: "Icopor sucio", emoji: "🥡", categoria: "no_aprovechables", dificultad: 3 },
    { nombre: "Envoltura plastificada de dulce", emoji: "🍭", categoria: "no_aprovechables", dificultad: 3 },
    { nombre: "Papel aluminio con grasa", emoji: "🫓", categoria: "no_aprovechables", dificultad: 3 },
    { nombre: "Cartón de pizza grasoso", emoji: "🍕", categoria: "no_aprovechables", dificultad: 3 },
    { nombre: "Vaso plástico con residuos de comida", emoji: "🥤", categoria: "no_aprovechables", dificultad: 3 },
  ];

  const CATEGORIA_LABEL = {
    organicos: "Orgánicos",
    aprovechables: "Aprovechables",
    no_aprovechables: "No aprovechables",
  };

  /* ===================================================================
     2. ESTADO DEL JUEGO
     =================================================================== */

  const state = {
    level: 1,
    score: 0,
    queue: [],        // residuos del nivel actual, en orden
    currentIndex: 0,  // índice del paquete activo dentro de la cola
    dragging: null,   // info del drag en curso
    busy: false,       // bloquea interacción durante animaciones
  };

  const HIGH_SCORE_KEY = "memoriaReciclable.highScore";

  /* ===================================================================
     3. LOCALSTORAGE
     =================================================================== */

  function getHighScore() {
    const raw = localStorage.getItem(HIGH_SCORE_KEY);
    const value = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(value) ? value : 0;
  }

  function setHighScore(value) {
    localStorage.setItem(HIGH_SCORE_KEY, String(value));
  }

  /* ===================================================================
     4. NAVEGACIÓN ENTRE PANTALLAS
     =================================================================== */

  const screens = {
    menu: document.getElementById("screen-menu"),
    game: document.getElementById("screen-game"),
    gameover: document.getElementById("screen-gameover"),
  };

  function showScreen(name) {
    Object.values(screens).forEach((el) => el.classList.remove("active"));
    screens[name].classList.add("active");
  }

  function goToMenu() {
    document.getElementById("high-score-display").textContent = getHighScore();
    showScreen("menu");
  }

  /* ===================================================================
     5. SISTEMA DE NIVELES
     A medida que sube el nivel se amplía el catálogo disponible:
     nivel 1-3  -> solo dificultad 1
     nivel 4-7  -> dificultad 1 y 2
     nivel 8+   -> todas las dificultades
     =================================================================== */

  function poolForLevel(level) {
    const maxDificultad = level >= 8 ? 3 : level >= 4 ? 2 : 1;
    return RESIDUOS.filter((r) => r.dificultad <= maxDificultad);
  }

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function generateLevelQueue(level) {
    const pool = shuffle(poolForLevel(level));
    const queue = [];
    for (let i = 0; i < level; i++) {
      // Si el nivel pide más residuos de los que hay en el pool sin
      // repetir, se vuelve a barajar y se continúa (permite niveles altos).
      if (queue.length > 0 && queue.length % pool.length === 0) {
        pool.push(...shuffle(pool));
      }
      queue.push(pool[i % pool.length]);
    }
    return queue;
  }

  function startLevel(level) {
    state.level = level;
    state.queue = generateLevelQueue(level);
    state.currentIndex = 0;
    document.getElementById("hud-level").textContent = state.level;
    document.getElementById("hud-score").textContent = state.score;
    runMemoryPhase();
  }

  function startNewGame() {
    state.level = 1;
    state.score = 0;
    showScreen("game");
    startLevel(1);
  }

  /* ===================================================================
     6. FASE DE MEMORIA
     =================================================================== */

  const memoryPhaseEl = document.getElementById("memory-phase");
  const playPhaseEl = document.getElementById("play-phase");
  const memoryListEl = document.getElementById("memory-list");
  const memoryTimerBar = document.getElementById("memory-timer-bar");

  function runMemoryPhase() {
    audio.play("memoryStart");
    state.busy = true;
    playPhaseEl.classList.add("hidden");
    memoryPhaseEl.classList.remove("hidden");
    memoryListEl.classList.remove("hiding");
    memoryListEl.innerHTML = "";

    state.queue.forEach((residuo, i) => {
      const item = document.createElement("div");
      item.className = "memory-item";
      item.style.animationDelay = `${i * 0.15}s`;
      item.innerHTML = `
        <span class="memory-item__order">${i + 1}</span>
        <span class="memory-item__emoji">${residuo.emoji}</span>
        <span class="memory-item__name">${residuo.nombre}</span>
      `;
      memoryListEl.appendChild(item);
    });

    // Tiempo de memorización: crece con la cantidad de residuos.
    const duration = 1800 + state.queue.length * 1300;

    // Reinicia y anima la barra de tiempo restante.
    memoryTimerBar.style.transition = "none";
    memoryTimerBar.style.transform = "scaleX(1)";
    // Forzar reflow para que la siguiente transición se aplique.
    void memoryTimerBar.offsetWidth;
    memoryTimerBar.style.transition = `transform ${duration}ms linear`;
    memoryTimerBar.style.transform = "scaleX(0)";

    setTimeout(() => {
      audio.play("memoryEnd");
      memoryListEl.classList.add("hiding");
      setTimeout(() => {
        memoryPhaseEl.classList.add("hidden");
        beginPlayPhase();
      }, 480);
    }, duration);
  }

  /* ===================================================================
     7. FASE DE JUEGO — CINTA TRANSPORTADORA
     =================================================================== */

  const conveyorTrack = document.getElementById("conveyor-track");
  const feedbackToast = document.getElementById("feedback-toast");
  const revealStage = document.getElementById("reveal-stage");
  const levelTransition = document.getElementById("level-transition");
  const levelTransitionSub = document.getElementById("level-transition-sub");

  function beginPlayPhase() {
    playPhaseEl.classList.remove("hidden");
    conveyorTrack.innerHTML = "";

    state.queue.forEach((residuo, i) => {
      const pkg = document.createElement("div");
      pkg.className = "package " + (i === 0 ? "package--active" : "package--pending");
      pkg.dataset.index = String(i);
      pkg.textContent = "📦";
      conveyorTrack.appendChild(pkg);
    });

    attachDragHandlers();
    state.busy = false;
  }

  function refreshActivePackage() {
    const packages = conveyorTrack.querySelectorAll(".package");
    packages.forEach((pkg) => {
      const idx = parseInt(pkg.dataset.index, 10);
      pkg.classList.remove("package--active", "package--pending");
      if (idx === state.currentIndex) pkg.classList.add("package--active");
      else if (idx > state.currentIndex) pkg.classList.add("package--pending");
    });
  }

  /* ===================================================================
     8. ARRASTRAR Y SOLTAR (pointer events — funciona con mouse y táctil)

     Estrategia: al iniciar el arrastre (pointerdown sobre el paquete
     activo) se reparenta el paquete a <body> como position:fixed y,
     a partir de ahí, TODO el seguimiento se hace con listeners en
     `document` (no en el propio paquete). Esto evita el problema de
     perder el puntero al reparentar un elemento que tenía
     setPointerCapture: los listeners de document siguen recibiendo
     pointermove/pointerup/pointercancel sin importar qué elemento
     esté debajo del cursor o si el nodo fue movido en el DOM.

     `state.dragging` y `state.busy` se limpian siempre a través de un
     único punto de salida (endDrag), tanto si el arrastre termina
     sobre una caneca, fuera de las canecas, o es cancelado por el
     navegador (pointercancel).
     =================================================================== */

  // Referencias a los handlers ligados a document, para poder
  // añadirlos/quitarlos de forma simétrica y evitar fugas de listeners.
  let onDocPointerMove = null;
  let onDocPointerUp = null;
  let onDocPointerCancel = null;

  function attachDragHandlers() {
    conveyorTrack.querySelectorAll(".package").forEach((pkg) => {
      pkg.addEventListener("pointerdown", onPackagePointerDown);
    });
  }

  function onPackagePointerDown(e) {
    // Ignora si el juego está ocupado (animando) o si ya hay un
    // arrastre en curso (evita arrastres múltiples/superpuestos).
    if (state.busy || state.dragging) return;

    const pkg = e.currentTarget;
    const idx = parseInt(pkg.dataset.index, 10);
    if (idx !== state.currentIndex) return; // solo el paquete activo se puede arrastrar

    e.preventDefault();
    audio.play("pickup");

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

    pkg.classList.remove("package--active");
    pkg.classList.add("package--dragging");
    pkg.style.width = rect.width + "px";
    pkg.style.height = rect.height + "px";
    pkg.style.left = rect.left + "px";
    pkg.style.top = rect.top + "px";
    document.body.appendChild(pkg);

    // Listeners temporales en `document`, no en el paquete: así el
    // arrastre se sigue detectando aunque el puntero salga del
    // elemento original o el nodo cambie de posición en el DOM.
    onDocPointerMove = handleDragMove;
    onDocPointerUp = (evt) => finishDrag(evt, false);
    onDocPointerCancel = (evt) => finishDrag(evt, true);

    document.addEventListener("pointermove", onDocPointerMove);
    document.addEventListener("pointerup", onDocPointerUp);
    document.addEventListener("pointercancel", onDocPointerCancel);
  }

  function handleDragMove(e) {
    const d = state.dragging;
    if (!d || e.pointerId !== d.pointerId) return;
    d.el.style.left = e.clientX - d.offsetX + "px";
    d.el.style.top = e.clientY - d.offsetY + "px";
    highlightBinUnderPoint(e.clientX, e.clientY);
  }

  function getBinAtPoint(x, y) {
    const bins = document.querySelectorAll(".bin");
    for (const bin of bins) {
      const r = bin.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        return bin;
      }
    }
    return null;
  }

  function highlightBinUnderPoint(x, y) {
    const hovered = getBinAtPoint(x, y);
    document.querySelectorAll(".bin").forEach((bin) => {
      bin.classList.toggle("drop-hover", bin === hovered);
    });
  }

  // Punto único de salida del arrastre: se llama tanto desde
  // pointerup como desde pointercancel, y siempre deja el estado
  // (`state.dragging`, listeners de document) limpio.
  function finishDrag(e, wasCancelled) {
    const d = state.dragging;
    if (!d || e.pointerId !== d.pointerId) return;

    document.removeEventListener("pointermove", onDocPointerMove);
    document.removeEventListener("pointerup", onDocPointerUp);
    document.removeEventListener("pointercancel", onDocPointerCancel);
    onDocPointerMove = onDocPointerUp = onDocPointerCancel = null;

    document.querySelectorAll(".bin").forEach((bin) => bin.classList.remove("drop-hover"));

    const pkg = d.el;
    state.dragging = null;

    // Si el navegador canceló el gesto (p. ej. un scroll del sistema
    // o una interrupción táctil), no intentamos soltar sobre una
    // caneca: simplemente devolvemos el paquete a la cinta.
    const bin = wasCancelled ? null : getBinAtPoint(e.clientX, e.clientY);

    if (bin) {
      dropOnBin(pkg, bin.dataset.category, bin);
    } else {
      returnPackageToConveyor(pkg, d);
    }
  }

  function returnPackageToConveyor(pkg, d) {
    // Bloquea nuevos arrastres mientras el paquete vuelve a su sitio,
    // para que no se pueda "re-agarrar" a mitad de la animación.
    state.busy = true;
    pkg.style.transition = "left 0.25s ease, top 0.25s ease";
    pkg.style.left = d.originRect.left + "px";
    pkg.style.top = d.originRect.top + "px";

    const cleanup = () => {
      pkg.style.transition = "";
      pkg.style.position = "";
      pkg.style.left = "";
      pkg.style.top = "";
      pkg.style.width = "";
      pkg.style.height = "";
      pkg.classList.remove("package--dragging");
      pkg.classList.add("package--active");
      if (d.originNext && d.originNext.parentElement === d.originParent) {
        d.originParent.insertBefore(pkg, d.originNext);
      } else {
        d.originParent.appendChild(pkg);
      }
      state.busy = false;
    };

    // setTimeout como respaldo por si `transitionend` no llega a
    // dispararse (por ejemplo, si el navegador ignora la transición).
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      cleanup();
    };
    pkg.addEventListener("transitionend", finish, { once: true });
    setTimeout(finish, 320);
  }

  /* ===================================================================
     9. CLASIFICACIÓN, REVELACIÓN Y PUNTUACIÓN
     =================================================================== */

  function dropOnBin(pkg, category, binEl) {
    state.busy = true;
    audio.play("drop");
    const residuo = state.queue[state.currentIndex];
    const correcto = residuo.categoria === category;

    // Animación de caída: el paquete se mueve hacia la caneca y se desvanece.
    const binRect = binEl.getBoundingClientRect();
    pkg.classList.add("package--falling");
    pkg.style.left = binRect.left + binRect.width / 2 - pkg.offsetWidth / 2 + "px";
    pkg.style.top = binRect.top + "px";
    pkg.style.transform = "translateY(18px) scale(0.35) rotate(15deg)";
    pkg.style.opacity = "0";

    setTimeout(() => {
      pkg.remove();
      showReveal(residuo, correcto, binEl);
    }, 420);
  }

  function showReveal(residuo, correcto, binEl) {
    revealStage.innerHTML = `
      <div class="reveal-card">
        <span class="reveal-card__emoji">${residuo.emoji}</span>
        <span class="reveal-card__name">${residuo.nombre}</span>
      </div>
    `;

    if (correcto) {
      audio.play("correct");
      showToast("✅ ¡Correcto!", "correct");
    } else {
      audio.play("wrong");
      const correctLabel = CATEGORIA_LABEL[residuo.categoria];
      showToast("❌ ¡Clasificación incorrecta!", "incorrect");
    }

    setTimeout(() => {
      revealStage.innerHTML = "";
      hideToast();
      if (correcto) {
        handleCorrectClassification();
      } else {
        handleIncorrectClassification(residuo);
      }
    }, 1000);
  }

  function showToast(message, kind) {
    feedbackToast.textContent = message;
    feedbackToast.className = "feedback-toast show " + kind;
  }

  function hideToast() {
    feedbackToast.className = "feedback-toast";
  }

  function handleCorrectClassification() {
    // Puntos por clasificar correctamente: crecen levemente con el nivel.
    state.score += 10 + state.level * 2;
    document.getElementById("hud-score").textContent = state.score;

    state.currentIndex++;

    if (state.currentIndex >= state.queue.length) {
      completeLevel();
    } else {
      refreshActivePackage();
      state.busy = false;
    }
  }

  function completeLevel() {
    audio.play("levelUp");
    // Bono por completar el nivel sin errores.
    const bonus = state.level * 20 + 15;
    state.score += bonus;
    document.getElementById("hud-score").textContent = state.score;

    levelTransitionSub.textContent = `+${bonus} puntos de bono · siguiente nivel: ${state.queue.length + 1} residuos`;
    levelTransition.classList.remove("hidden");

    setTimeout(() => {
      levelTransition.classList.add("hidden");
      startLevel(state.level + 1);
    }, 1400);
  }

  function handleIncorrectClassification(residuo) {
    gameOver(residuo);
  }

  /* ===================================================================
     10. GAME OVER
     =================================================================== */

  function gameOver(residuoFallado) {
    audio.stopMusic();

    const previousHigh = getHighScore();
    const isNewRecord = state.score > previousHigh;
    if (isNewRecord) setHighScore(state.score);

    audio.play("gameOver");
    // El sonido de nuevo récord suena un instante después del de
    // game over, para que no se superpongan de forma confusa.
    if (isNewRecord) {
      setTimeout(() => audio.play("highScore"), 350);
    }

    document.getElementById("go-level").textContent = state.level;
    document.getElementById("go-score").textContent = state.score;
    document.getElementById("go-highscore").textContent = Math.max(state.score, previousHigh);
    document.getElementById("go-new-record").classList.toggle("hidden", !isNewRecord);

    const errorBox = document.getElementById("gameover-error");
    if (residuoFallado) {
      errorBox.innerHTML = `
        El residuo era: <strong>${residuoFallado.emoji} ${residuoFallado.nombre}</strong>.<br>
        La clasificación correcta era: <strong>${CATEGORIA_LABEL[residuoFallado.categoria]}</strong>.
      `;
      errorBox.classList.remove("hidden");
    } else {
      errorBox.classList.add("hidden");
    }

    showScreen("gameover");
  }

  /* ===================================================================
     11. ARRANQUE Y EVENTOS DE NAVEGACIÓN
     =================================================================== */

  document.getElementById("btn-play").addEventListener("click", () => {
    audio.play("click");
    audio.playMusic(); // primer play() disparado por un gesto del usuario: cumple las políticas de autoplay
    startNewGame();
  });

  document.getElementById("btn-retry").addEventListener("click", () => {
    audio.play("click");
    audio.playMusic();
    startNewGame();
  });

  document.getElementById("btn-menu").addEventListener("click", () => {
    audio.play("menuBack");
    goToMenu();
  });

  /* ---- Control de audio: botón flotante + panel ---------------------- */

  const audioToggleBtn = document.getElementById("btn-audio-toggle");
  const audioToggleIcon = document.getElementById("audio-toggle-icon");
  const audioPanel = document.getElementById("audio-panel");
  const toggleMusicInput = document.getElementById("toggle-music");
  const toggleSfxInput = document.getElementById("toggle-sfx");
  const volumeSlider = document.getElementById("volume-slider");

  function refreshAudioUI() {
    toggleMusicInput.checked = audio.settings.musicEnabled;
    toggleSfxInput.checked = audio.settings.sfxEnabled;
    volumeSlider.value = audio.settings.volume;
    const anySoundOn = audio.settings.musicEnabled || audio.settings.sfxEnabled;
    audioToggleIcon.textContent = anySoundOn ? "🔊" : "🔇";
  }

  audioToggleBtn.addEventListener("click", () => {
    const isHidden = audioPanel.classList.toggle("hidden");
    audioToggleBtn.setAttribute("aria-expanded", String(!isHidden));
  });

  // Cierra el panel si el usuario hace clic fuera de él.
  document.addEventListener("pointerdown", (e) => {
    if (!document.getElementById("audio-control").contains(e.target)) {
      audioPanel.classList.add("hidden");
      audioToggleBtn.setAttribute("aria-expanded", "false");
    }
  });

  toggleMusicInput.addEventListener("change", () => {
    audio.setMusicEnabled(toggleMusicInput.checked);
    refreshAudioUI();
  });

  toggleSfxInput.addEventListener("change", () => {
    audio.setSfxEnabled(toggleSfxInput.checked);
    refreshAudioUI();
  });

  volumeSlider.addEventListener("input", () => {
    audio.setVolume(parseInt(volumeSlider.value, 10));
  });

  refreshAudioUI();
  goToMenu();
})();
