/* ===================== ÉTAT ===================== */
// Ordre des 20 prix sur la roue (correspond aux probabilités demandées :
// 6 Kit ustensiles (30%), 5 Bouteille d'eau ACI (25%), 4 Carnet ACI (20%),
// 3 Tumbler (15%), 2 Beachbag (10%))
// Les segments par défaut référencent une "key" traduisible (voir PRIZE_LABELS)
// plutôt qu'un libellé figé, afin de supporter le switch de langue FR/EN.
const DEFAULT_SEGMENTS = [
  { key: "kit", weight: 1 },
  { key: "bottle", weight: 1 },
  { key: "kit", weight: 1 },
  { key: "notebook", weight: 1 },
  { key: "bottle", weight: 1 },
  { key: "kit", weight: 1 },
  { key: "tumbler", weight: 1 },
  { key: "notebook", weight: 1 },
  { key: "bottle", weight: 1 },
  { key: "kit", weight: 1 },
  { key: "beachbag", weight: 1 },
  { key: "tumbler", weight: 1 },
  { key: "notebook", weight: 1 },
  { key: "bottle", weight: 1 },
  { key: "kit", weight: 1 },
  { key: "beachbag", weight: 1 },
  { key: "tumbler", weight: 1 },
  { key: "notebook", weight: 1 },
  { key: "kit", weight: 1 },
  { key: "bottle", weight: 1 },
];

// Réglages fixes (non configurables par l'utilisateur)
const SETTINGS = {
  duration: 6,
  minTurns: 6,
  sound: true,
  confetti: true,
  shake: true,
};

/* ===================== I18N (FR / EN) ===================== */
const I18N = {
  fr: {
    settings: "Paramètres",
    fullscreenEnter: "Plein écran",
    fullscreenExit: "Quitter le plein écran",
    configTitle: "Configuration",
    close: "Fermer",
    addSegment: "+ Ajouter un segment",
    reset: "Réinitialiser",
    dragHandle: "Glisser pour réordonner",
    moveSegmentAria: "Déplacer le segment",
    segmentNamePlaceholder: "Nom du segment",
    weightTitle: "Poids (probabilité)",
    moveUp: "Monter",
    moveDown: "Descendre",
    remove: "Supprimer",
    minSegmentsWarning: "Il faut au moins 2 segments !",
    newSegmentDefault: "Nouveau",
  },
  en: {
    settings: "Settings",
    fullscreenEnter: "Fullscreen",
    fullscreenExit: "Exit fullscreen",
    configTitle: "Configuration",
    close: "Close",
    addSegment: "+ Add a segment",
    reset: "Reset",
    dragHandle: "Drag to reorder",
    moveSegmentAria: "Move segment",
    segmentNamePlaceholder: "Segment name",
    weightTitle: "Weight (probability)",
    moveUp: "Move up",
    moveDown: "Move down",
    remove: "Remove",
    minSegmentsWarning: "You need at least 2 segments!",
    newSegmentDefault: "New",
  },
};

// Libellés des lots par défaut, traduits (sans icônes).
const PRIZE_LABELS = {
  kit: { fr: "Kit ustensiles", en: "Utensil kit" },
  bottle: { fr: "Bouteille d'eau ACI", en: "ACI water bottle" },
  notebook: { fr: "Carnet ACI", en: "ACI notebook" },
  tumbler: { fr: "Tumbler", en: "Tumbler" },
  beachbag: { fr: "Beachbag", en: "Beach bag" },
};

function t(key) {
  return (I18N[state.lang] && I18N[state.lang][key]) || I18N.fr[key] || key;
}

// Renvoie le libellé affiché d'un segment : traduit s'il référence un lot
// connu (key), sinon le texte libre saisi par l'utilisateur.
function getSegmentLabel(seg) {
  if (seg.key && PRIZE_LABELS[seg.key]) {
    return PRIZE_LABELS[seg.key][state.lang] || PRIZE_LABELS[seg.key].fr;
  }
  return seg.label || "";
}

let state = load() || {
  segments: JSON.parse(JSON.stringify(DEFAULT_SEGMENTS)),
  lang: "fr",
};
if (!state.lang) state.lang = "fr";

function save() {
  localStorage.setItem("wheel-state", JSON.stringify(state));
}
function load() {
  try {
    return JSON.parse(localStorage.getItem("wheel-state"));
  } catch {
    return null;
  }
}

/* ===================== DOM ===================== */
const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const wheelWrapper = document.getElementById("wheelWrapper");
const spinBtn = document.getElementById("spinBtn");
const segmentsList = document.getElementById("segmentsList");
const lightsEl = document.getElementById("lights");
const flashOverlay = document.getElementById("flashOverlay");
const winnerModal = document.getElementById("winnerModal");
const winnerLabel = document.getElementById("winnerLabel");
const closeWinnerBtn = document.getElementById("closeWinnerBtn");
const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const langButtons = document.querySelectorAll(".lang-btn");

/* ===================== MODALE PARAMÈTRES ===================== */
settingsBtn.addEventListener("click", () => {
  settingsModal.classList.add("show");
});
closeSettingsBtn.addEventListener("click", () => settingsModal.classList.remove("show"));
settingsModal.addEventListener("click", (e) => {
  if (e.target === settingsModal) settingsModal.classList.remove("show");
});

/* ===================== PLEIN ÉCRAN ===================== */
const ICON_ENTER_FULLSCREEN = `<path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M21 8V5a2 2 0 0 0-2-2h-3"></path><path d="M3 16v3a2 2 0 0 0 2 2h3"></path><path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>`;
const ICON_EXIT_FULLSCREEN = `<path d="M8 3v3a2 2 0 0 1-2 2H3"></path><path d="M21 8h-3a2 2 0 0 1-2-2V3"></path><path d="M3 16h3a2 2 0 0 1 2 2v3"></path><path d="M16 21v-3a2 2 0 0 1 2-2h3"></path>`;

function updateFullscreenIcon() {
  const isFullscreen = !!document.fullscreenElement;
  fullscreenBtn.querySelector("svg").innerHTML = isFullscreen ? ICON_EXIT_FULLSCREEN : ICON_ENTER_FULLSCREEN;
  const label = isFullscreen ? t("fullscreenExit") : t("fullscreenEnter");
  fullscreenBtn.title = label;
  fullscreenBtn.setAttribute("aria-label", label);
}

fullscreenBtn.addEventListener("click", () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
});
document.addEventListener("fullscreenchange", updateFullscreenIcon);

/* ===================== SWITCH DE LANGUE FR / EN ===================== */
function applyLanguage() {
  document.documentElement.lang = state.lang;

  langButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === state.lang);
  });

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.title = t(el.dataset.i18nTitle);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", t(el.dataset.i18nAria));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });

  updateFullscreenIcon();
  renderSegments();
}

langButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (state.lang === btn.dataset.lang) return;
    state.lang = btn.dataset.lang;
    save();
    applyLanguage();
  });
});

/* ===================== TOAST (petits messages) ===================== */
function flashMessage(msg) {
  let toast = document.getElementById("toastMsg");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toastMsg";
    toast.className = "toast-msg";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.remove("show");
  void toast.offsetWidth;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

/* ===================== SEGMENTS UI ===================== */
function renderSegments() {
  segmentsList.innerHTML = "";
  state.segments.forEach((seg, i) => {
    const row = document.createElement("div");
    row.className = "segment-row";
    row.draggable = true;
    row.dataset.i = i;
    row.innerHTML = `
      <button type="button" class="drag-handle" title="${t("dragHandle")}" aria-label="${t("moveSegmentAria")}" data-i="${i}">☰</button>
      <input type="text" value="${getSegmentLabel(seg)}" data-i="${i}" data-field="label" placeholder="${t("segmentNamePlaceholder")}" />
      <input type="number" value="${seg.weight}" min="1" max="20" data-i="${i}" data-field="weight" title="${t("weightTitle")}" />
      <div class="move-buttons">
        <button type="button" class="move-up-btn" data-i="${i}" title="${t("moveUp")}" aria-label="${t("moveUp")}" ${i === 0 ? "disabled" : ""}>▲</button>
        <button type="button" class="move-down-btn" data-i="${i}" title="${t("moveDown")}" aria-label="${t("moveDown")}" ${i === state.segments.length - 1 ? "disabled" : ""}>▼</button>
      </div>
      <button class="remove-btn" data-i="${i}" title="${t("remove")}">✕</button>
    `;
    segmentsList.appendChild(row);
  });
  drawWheel();
}

function moveSegment(from, to) {
  if (to < 0 || to >= state.segments.length || from === to) return;
  const [item] = state.segments.splice(from, 1);
  state.segments.splice(to, 0, item);
  save();
  renderSegments();
}

/* ---- Réordonnancement par glisser-déposer (souris) ---- */
let dragFromIndex = null;

segmentsList.addEventListener("dragstart", (e) => {
  const row = e.target.closest(".segment-row");
  if (!row) return;
  dragFromIndex = parseInt(row.dataset.i, 10);
  row.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", String(dragFromIndex));
});

segmentsList.addEventListener("dragend", (e) => {
  const row = e.target.closest(".segment-row");
  if (row) row.classList.remove("dragging");
  segmentsList.querySelectorAll(".drag-over").forEach((el) => el.classList.remove("drag-over"));
  dragFromIndex = null;
});

segmentsList.addEventListener("dragover", (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  const row = e.target.closest(".segment-row");
  segmentsList.querySelectorAll(".drag-over").forEach((el) => el.classList.remove("drag-over"));
  if (row) row.classList.add("drag-over");
});

segmentsList.addEventListener("drop", (e) => {
  e.preventDefault();
  const row = e.target.closest(".segment-row");
  segmentsList.querySelectorAll(".drag-over").forEach((el) => el.classList.remove("drag-over"));
  if (!row || dragFromIndex === null) return;
  const toIndex = parseInt(row.dataset.i, 10);
  moveSegment(dragFromIndex, toIndex);
});

segmentsList.addEventListener("input", (e) => {
  const i = e.target.dataset.i;
  const field = e.target.dataset.field;
  if (i === undefined) return;
  if (field === "weight") {
    state.segments[i].weight = Math.max(1, parseInt(e.target.value || "1", 10));
  } else {
    // Une édition manuelle du libellé remplace la traduction automatique :
    // on retire la référence "key" pour que le texte saisi soit conservé
    // tel quel, même après un changement de langue.
    delete state.segments[i].key;
    state.segments[i][field] = e.target.value;
  }
  save();
  drawWheel();
});

segmentsList.addEventListener("click", (e) => {
  if (e.target.classList.contains("remove-btn")) {
    const i = parseInt(e.target.dataset.i, 10);
    if (state.segments.length <= 2) {
      flashMessage(t("minSegmentsWarning"));
      return;
    }
    state.segments.splice(i, 1);
    save();
    renderSegments();
    return;
  }
  if (e.target.classList.contains("move-up-btn")) {
    const i = parseInt(e.target.dataset.i, 10);
    moveSegment(i, i - 1);
    return;
  }
  if (e.target.classList.contains("move-down-btn")) {
    const i = parseInt(e.target.dataset.i, 10);
    moveSegment(i, i + 1);
    return;
  }
});

document.getElementById("addSegmentBtn").addEventListener("click", () => {
  state.segments.push({ label: t("newSegmentDefault"), weight: 1 });
  save();
  renderSegments();
});

document.getElementById("resetBtn").addEventListener("click", () => {
  state.segments = JSON.parse(JSON.stringify(DEFAULT_SEGMENTS));
  save();
  renderSegments();
});

/* ===================== WHEEL DRAWING ===================== */
let rotation = 0; // radians actuels de la roue (appliqués via transform CSS, pas redessinés)
let wheelDisplaySize = 560; // taille CSS (px) du canvas, mise à jour au resize

// La rotation est appliquée en CSS (accéléré GPU) plutôt qu'en redessinant le
// canvas à chaque frame : c'est ce qui rend l'animation fluide même si le
// thread JS est occupé (sons, confettis, gouttelettes...).
function setWheelRotation(rad) {
  canvas.style.transform = `rotate(${rad}rad)`;
}

// Redimensionne le bitmap du canvas selon le devicePixelRatio pour un rendu
// net sur écrans HiDPI, sans impacter les perfs (dessiné une seule fois).
function resizeWheelCanvas() {
  const rect = canvas.getBoundingClientRect();
  const size = Math.max(1, Math.round(rect.width || wheelDisplaySize));
  const dpr = window.devicePixelRatio || 1;
  wheelDisplaySize = size;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawWheel();
}

function totalWeight() {
  return state.segments.reduce((s, seg) => s + seg.weight, 0);
}

// Couleur générée automatiquement pour chaque segment (non personnalisable)
// Motif alterné officiel APRIL Marine, répété tous les 10 segments :
// Bleu marin / Blanc / Vert / Blanc / Orange / Blanc / Bleu ciel / Blanc / Rose / Blanc
const WHEEL_COLORS = [
  "#004161", // Bleu marin
  "#FFFFFF", // Blanc
  "#639E30", // Vert
  "#FFFFFF", // Blanc
  "#F7AA36", // Orange
  "#FFFFFF", // Blanc
  "#3EAAC4", // Bleu ciel
  "#FFFFFF", // Blanc
  "#D7488F", // Rose
  "#FFFFFF", // Blanc
];
function colorForIndex(i) {
  return WHEEL_COLORS[i % WHEEL_COLORS.length];
}

function drawWheel() {
  const size = wheelDisplaySize;
  const radius = size / 2;
  const cx = radius, cy = radius;
  ctx.clearRect(0, 0, size, size);

  const angle = (Math.PI * 2) / state.segments.length;
  // La roue est toujours dessinée à l'angle 0 : la rotation visuelle est
  // appliquée séparément via CSS transform (voir setWheelRotation).
  let startAngle = 0;

  state.segments.forEach((seg, i) => {
    const endAngle = startAngle + angle;
    const color = colorForIndex(i);

    // segment
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius - 6, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // séparateur
    ctx.strokeStyle = "rgba(0,36,58,.45)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // texte
    const mid = startAngle + angle / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(mid);
    ctx.textAlign = "center";
    ctx.fillStyle = getContrastColor(color);
    const fontSize = Math.max(17, Math.min(32, 380 / state.segments.length));
    ctx.font = "bold " + fontSize + "px 'Segoe UI', sans-serif";

    const textX = radius - 48;
    const maxTextWidth = Math.max(60, textX - 66); // espace dispo avant le moyeu
    const lines = wrapText(ctx, getSegmentLabel(seg), maxTextWidth);
    const lineHeight = fontSize * 1.15;
    // centre chaque ligne par rapport à sa propre largeur, ancré près du bord extérieur
    const longestLineWidth = Math.max(...lines.map((l) => ctx.measureText(l).width));
    const centerX = textX - longestLineWidth / 2;
    lines.forEach((line, li) => {
      const y = 6 + (li - (lines.length - 1) / 2) * lineHeight;
      ctx.fillText(line, centerX, y);
    });
    ctx.restore();

    startAngle = endAngle;
  });

  // moyeu central décoratif
  ctx.beginPath();
  ctx.arc(cx, cy, 58, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(cx - 15, cy - 15, 5, cx, cy, 58);
  grad.addColorStop(0, "#0a5a86");
  grad.addColorStop(1, "#00243a");
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.15)";
  ctx.lineWidth = 3;
  ctx.stroke();
}

// Découpe un texte en plusieurs lignes pour qu'il tienne dans maxWidth (canvas 2D).
// Découpe d'abord par mots ; si un mot seul dépasse maxWidth, il est coupé caractère par caractère.
function wrapText(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  const lines = [];
  let line = "";

  const pushLongWord = (word) => {
    let chunk = "";
    for (const ch of word) {
      const test = chunk + ch;
      if (ctx.measureText(test).width > maxWidth && chunk) {
        lines.push(chunk);
        chunk = ch;
      } else {
        chunk = test;
      }
    }
    return chunk;
  };

  words.forEach((word) => {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width <= maxWidth) {
      line = test;
      return;
    }
    if (line) {
      lines.push(line);
      line = "";
    }
    if (ctx.measureText(word).width > maxWidth) {
      line = pushLongWord(word);
    } else {
      line = word;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function getContrastColor(color) {
  // extrait la luminosité (hsl ou hex) pour choisir un texte clair ou sombre
  const hslMatch = /hsl\(\s*[\d.]+,\s*[\d.]+%,\s*([\d.]+)%\s*\)/.exec(color);
  if (hslMatch) {
    return parseFloat(hslMatch[1]) >= 55 ? "#0a3c5e" : "#fff";
  }
  const hexMatch = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(color);
  if (hexMatch) {
    const [r, g, b] = hexMatch.slice(1).map((h) => parseInt(h, 16));
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance >= 0.6 ? "#0a3c5e" : "#fff";
  }
  return "#fff";
}

/* ===================== LUMIÈRES AUTOUR DE LA ROUE ===================== */
function buildLights() {
  lightsEl.innerHTML = "";
  const count = 24;
  const radius = 50; // en %
  const colors = ["#639e30", "#f7aa36", "#004161", "#8bc34a"];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const tx = Math.cos(angle) * radius;
    const ty = Math.sin(angle) * radius;
    const span = document.createElement("span");
    span.style.setProperty("--tx", `${tx}%`);
    span.style.setProperty("--ty", `${ty}%`);
    span.style.color = colors[i % colors.length];
    span.style.animationDelay = `${(i % 6) * 0.15}s`;
    lightsEl.appendChild(span);
  }
}

/* ===================== AUDIO (WebAudio, sans fichiers) ===================== */
let audioCtx;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTick() {
  if (!SETTINGS.sound) return;
  const ac = getAudioCtx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "square";
  osc.frequency.value = 280;
  gain.gain.setValueAtTime(0.08, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.08);
  osc.connect(gain).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + 0.08);
}

function playFanfare() {
  if (!SETTINGS.sound) return;
  const ac = getAudioCtx();
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const t = ac.currentTime + i * 0.12;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.15, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  });
}

/* ===================== SPIN LOGIC ===================== */
let spinning = false;

function pickWinnerIndex() {
  const total = totalWeight();
  let r = Math.random() * total;
  for (let i = 0; i < state.segments.length; i++) {
    r -= state.segments[i].weight;
    if (r <= 0) return i;
  }
  return state.segments.length - 1;
}

function angleForIndex(index) {
  const angle = (Math.PI * 2) / state.segments.length;
  return index * angle + angle / 2; // milieu visuel du segment (angle relatif, sans rotation)
}

spinBtn.addEventListener("click", () => {
  if (spinning) return;
  spinning = true;
  spinBtn.disabled = true;
  wheelWrapper.classList.add("spinning");

  const winnerIndex = pickWinnerIndex();
  const targetMid = angleForIndex(winnerIndex);
  // Le pointeur est en haut (angle -PI/2 dans repère canvas où 0 = droite, sens horaire).
  // On veut que targetMid + rotationFinale ≡ -PI/2 (mod 2PI)
  const pointerAngle = -Math.PI / 2;
  // Nombre ENTIER de tours complets (une fraction de tour décalerait l'angle final
  // par rapport au segment ciblé, car elle ne s'annule pas modulo 2π).
  const extraTurns = SETTINGS.minTurns + Math.floor(Math.random() * 3);
  const currentMod = ((rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  let delta = pointerAngle - (currentMod + targetMid);
  delta = ((delta % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const totalRotation = extraTurns * Math.PI * 2 + delta;

  const duration = SETTINGS.duration * 1000;
  const startRotation = rotation;
  const startTime = performance.now();
  let lastTickSegment = -1;
  let lastRotationForDroplets = rotation;
  let lastFrameTime = startTime;

  function frame(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    const eased = t < 1 ? 1 - Math.pow(1 - t, 4) : 1; // ease-out quart pour ralentissement doux
    rotation = startRotation + totalRotation * eased;
    setWheelRotation(rotation);

    // gouttelettes d'eau projetées selon la vitesse angulaire
    const dt = Math.max(1, now - lastFrameTime);
    const angularSpeed = (rotation - lastRotationForDroplets) / dt; // rad / ms
    spawnDroplets(angularSpeed);
    lastRotationForDroplets = rotation;
    lastFrameTime = now;

    // tick sound quand on change de segment
    const modRot = ((rotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const relativeAngle = ((pointerAngle - modRot) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const currentSeg = segmentAtAngle(relativeAngle);
    if (currentSeg !== lastTickSegment) {
      playTick();
      lastTickSegment = currentSeg;
    }

    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      finishSpin(winnerIndex);
    }
  }
  requestAnimationFrame(frame);
});

function segmentAtAngle(angle) {
  const segmentAngle = (Math.PI * 2) / state.segments.length;
  return Math.min(Math.floor(angle / segmentAngle), state.segments.length - 1);
}

function finishSpin(winnerIndex) {
  spinning = false;
  spinBtn.disabled = false;
  wheelWrapper.classList.remove("spinning");

  const winner = state.segments[winnerIndex];

  // effets woah
  playFanfare();
  if (SETTINGS.shake) doShake();
  if (SETTINGS.confetti) launchConfetti();
  flashScreen();
  showWinnerModal(winner);
}

function doShake() {
  document.body.classList.add("shake");
  setTimeout(() => document.body.classList.remove("shake"), 400);
}

function flashScreen() {
  flashOverlay.classList.remove("flash");
  void flashOverlay.offsetWidth;
  flashOverlay.classList.add("flash");
}

function showWinnerModal(winner) {
  winnerLabel.textContent = getSegmentLabel(winner);
  winnerModal.classList.add("show");
}
closeWinnerBtn.addEventListener("click", () => winnerModal.classList.remove("show"));
winnerModal.addEventListener("click", (e) => {
  if (e.target === winnerModal) winnerModal.classList.remove("show");
});

/* ===================== GOUTTELETTES D'EAU ===================== */
const dropletsCanvas = document.getElementById("dropletsCanvas");
const dctx = dropletsCanvas.getContext("2d");
let dropletParticles = [];
let dropletsAnimId = null;
const MAX_DROPLETS = 260;

function resizeDropletsCanvas() {
  dropletsCanvas.width = window.innerWidth;
  dropletsCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeDropletsCanvas);
resizeDropletsCanvas();

const WATER_COLORS = [
  "rgba(180,225,255,0.95)",
  "rgba(120,195,240,0.9)",
  "rgba(210,240,255,0.9)",
  "rgba(60,150,210,0.85)",
];

// Émet des gouttelettes projetées depuis le pourtour de la roue en fonction de la vitesse angulaire.
function spawnDroplets(angularSpeed) {
  const speed = Math.abs(angularSpeed); // rad / ms
  if (speed < 0.0006) return; // trop lent, pas d'éclaboussures

  const rect = canvas.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const radius = rect.width / 2;
  const dir = angularSpeed >= 0 ? 1 : -1;

  // nombre de gouttes proportionnel à la vitesse (plafonné)
  const count = Math.min(6, Math.round(speed * 2500));
  for (let i = 0; i < count; i++) {
    if (dropletParticles.length >= MAX_DROPLETS) break;
    const angle = Math.random() * Math.PI * 2;
    const rim = radius - Math.random() * 10;
    const px = cx + Math.cos(angle) * rim;
    const py = cy + Math.sin(angle) * rim;

    // vitesse tangentielle (sens de rotation) + un peu de radial vers l'extérieur
    const tangentX = -Math.sin(angle) * dir;
    const tangentY = Math.cos(angle) * dir;
    const radialX = Math.cos(angle);
    const radialY = Math.sin(angle);
    const speedFactor = Math.min(18, speed * 4500) * (0.6 + Math.random() * 0.6);

    dropletParticles.push({
      x: px,
      y: py,
      vx: tangentX * speedFactor + radialX * speedFactor * 0.35,
      vy: tangentY * speedFactor + radialY * speedFactor * 0.35,
      size: Math.random() * 3 + 2,
      color: WATER_COLORS[Math.floor(Math.random() * WATER_COLORS.length)],
      life: 0,
      maxLife: 40 + Math.random() * 30,
      gravity: 0.35 + Math.random() * 0.25,
    });
  }
  if (!dropletsAnimId) dropletsLoop();
}

function dropletsLoop() {
  dctx.clearRect(0, 0, dropletsCanvas.width, dropletsCanvas.height);
  dropletParticles.forEach((p) => {
    p.vy += p.gravity;
    p.x += p.vx;
    p.y += p.vy;
    p.life++;
    const alpha = Math.max(0, 1 - p.life / p.maxLife);
    const speedMag = Math.hypot(p.vx, p.vy);
    const stretch = Math.min(3, 1 + speedMag / 10);
    const angle = Math.atan2(p.vy, p.vx);

    dctx.save();
    dctx.translate(p.x, p.y);
    dctx.rotate(angle);
    dctx.scale(stretch, 1);
    dctx.globalAlpha = alpha;

    // corps de la goutte
    dctx.beginPath();
    dctx.arc(0, 0, p.size, 0, Math.PI * 2);
    dctx.fillStyle = p.color;
    dctx.fill();

    // reflet spéculaire
    dctx.beginPath();
    dctx.arc(-p.size * 0.3, -p.size * 0.3, p.size * 0.35, 0, Math.PI * 2);
    dctx.fillStyle = "rgba(255,255,255,0.85)";
    dctx.fill();

    dctx.restore();
  });
  dropletParticles = dropletParticles.filter(
    (p) => p.life < p.maxLife && p.y < dropletsCanvas.height + 50
  );
  if (dropletParticles.length > 0) {
    dropletsAnimId = requestAnimationFrame(dropletsLoop);
  } else {
    dropletsAnimId = null;
  }
}

/* ===================== CONFETTIS ===================== */
const confettiCanvas = document.getElementById("confettiCanvas");
const cctx = confettiCanvas.getContext("2d");
let confettiParticles = [];
let confettiAnimId = null;

function resizeConfettiCanvas() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeConfettiCanvas);
resizeConfettiCanvas();

function launchConfetti() {
  const colors = ["#639e30", "#f7aa36", "#004161", "#8bc34a", "#fbbf24", "#005a87"];
  const count = 160;
  for (let i = 0; i < count; i++) {
    confettiParticles.push({
      x: confettiCanvas.width / 2,
      y: confettiCanvas.height * 0.35,
      vx: (Math.random() - 0.5) * 14,
      vy: Math.random() * -14 - 4,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.3,
      shape: Math.random() > 0.5 ? "rect" : "circle",
      gravity: 0.35 + Math.random() * 0.15,
      life: 0,
      maxLife: 140 + Math.random() * 60,
    });
  }
  if (!confettiAnimId) confettiLoop();
}

function confettiLoop() {
  cctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confettiParticles.forEach((p) => {
    p.vy += p.gravity;
    p.x += p.vx;
    p.y += p.vy;
    p.rotation += p.rotSpeed;
    p.life++;
    const alpha = Math.max(0, 1 - p.life / p.maxLife);
    cctx.save();
    cctx.translate(p.x, p.y);
    cctx.rotate(p.rotation);
    cctx.globalAlpha = alpha;
    cctx.fillStyle = p.color;
    if (p.shape === "rect") {
      cctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    } else {
      cctx.beginPath();
      cctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      cctx.fill();
    }
    cctx.restore();
  });
  confettiParticles = confettiParticles.filter((p) => p.life < p.maxLife && p.y < confettiCanvas.height + 50);
  if (confettiParticles.length > 0) {
    confettiAnimId = requestAnimationFrame(confettiLoop);
  } else {
    confettiAnimId = null;
  }
}

/* ===================== PARTICULES DE FOND ===================== */
// Désactivées : le canvas #bg-particles est masqué (display:none) en CSS,
// donc faire tourner une boucle requestAnimationFrame en continu ne servait
// à rien et consommait du CPU inutilement, ce qui pouvait nuire à la
// fluidité de l'animation de la roue.
/*
const bgCanvas = document.getElementById("bg-particles");
const bctx = bgCanvas.getContext("2d");
let bgParticles = [];

function resizeBgCanvas() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeBgCanvas);
resizeBgCanvas();

function initBgParticles() {
  bgParticles = [];
  const colors = ["98,157,48", "246,169,54"]; // vert / orange
  const count = Math.floor((bgCanvas.width * bgCanvas.height) / 60000);
  for (let i = 0; i < count; i++) {
    bgParticles.push({
      x: Math.random() * bgCanvas.width,
      y: Math.random() * bgCanvas.height,
      r: Math.random() * 150 + 0.4,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      alpha: Math.random() * 0.6 + 0.2,
      color: colors[i % colors.length],
    });
  }
}
initBgParticles();
window.addEventListener("resize", initBgParticles);

function bgLoop() {
  bctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  bgParticles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0) p.x = bgCanvas.width;
    if (p.x > bgCanvas.width) p.x = 0;
    if (p.y < 0) p.y = bgCanvas.height;
    if (p.y > bgCanvas.height) p.y = 0;
    bctx.beginPath();
    bctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    bctx.fillStyle = `rgba(${p.color},${p.alpha})`;
    bctx.fill();
  });
  requestAnimationFrame(bgLoop);
}
bgLoop();
*/

/* ===================== RACCOURCIS CLAVIER (Entrée / Espace) ===================== */
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " " && e.code !== "Space") return;

  // Ignore si l'utilisateur est en train de taper dans un champ
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;

  e.preventDefault(); // évite le scroll de la page avec la barre d'espace

  if (winnerModal.classList.contains("show")) {
    winnerModal.classList.remove("show");
    return;
  }
  if (settingsModal.classList.contains("show")) {
    settingsModal.classList.remove("show");
    return;
  }
  if (!spinning) {
    spinBtn.click();
  }
});

/* ===================== INIT ===================== */
applyLanguage();
buildLights();
window.addEventListener("resize", resizeWheelCanvas);
resizeWheelCanvas();
setWheelRotation(rotation);
