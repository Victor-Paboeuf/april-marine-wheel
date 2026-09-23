/* ===================== ÉTAT ===================== */
const DEFAULT_SEGMENTS = [
  { label: "🎁 Cadeau", weight: 1 },
  { label: "😢 Perdu", weight: 3 },
  { label: "💰 Jackpot", weight: 1 },
  { label: "🎯 Rejoue", weight: 2 },
  { label: "🍀 Chance", weight: 2 },
  { label: "🔥 Bonus", weight: 1 },
];

// Réglages fixes (non configurables par l'utilisateur)
const SETTINGS = {
  duration: 6,
  minTurns: 6,
  sound: true,
  confetti: true,
  shake: true,
};

let state = load() || {
  segments: JSON.parse(JSON.stringify(DEFAULT_SEGMENTS)),
};

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

/* ===================== MODALE PARAMÈTRES ===================== */
settingsBtn.addEventListener("click", () => {
  settingsModal.classList.add("show");
});
closeSettingsBtn.addEventListener("click", () => settingsModal.classList.remove("show"));
settingsModal.addEventListener("click", (e) => {
  if (e.target === settingsModal) settingsModal.classList.remove("show");
});

/* ===================== SEGMENTS UI ===================== */
function renderSegments() {
  segmentsList.innerHTML = "";
  state.segments.forEach((seg, i) => {
    const row = document.createElement("div");
    row.className = "segment-row";
    row.innerHTML = `
      <input type="text" value="${seg.label}" data-i="${i}" data-field="label" placeholder="Nom du segment" />
      <input type="number" value="${seg.weight}" min="1" max="20" data-i="${i}" data-field="weight" title="Poids (probabilité)" />
      <button class="remove-btn" data-i="${i}" title="Supprimer">✕</button>
    `;
    segmentsList.appendChild(row);
  });
  drawWheel();
}

segmentsList.addEventListener("input", (e) => {
  const i = e.target.dataset.i;
  const field = e.target.dataset.field;
  if (i === undefined) return;
  if (field === "weight") {
    state.segments[i].weight = Math.max(1, parseInt(e.target.value || "1", 10));
  } else {
    state.segments[i][field] = e.target.value;
  }
  save();
  drawWheel();
});

segmentsList.addEventListener("click", (e) => {
  if (e.target.classList.contains("remove-btn")) {
    const i = parseInt(e.target.dataset.i, 10);
    if (state.segments.length <= 2) {
      flashMessage("Il faut au moins 2 segments !");
      return;
    }
    state.segments.splice(i, 1);
    save();
    renderSegments();
  }
});

document.getElementById("addSegmentBtn").addEventListener("click", () => {
  state.segments.push({ label: "Nouveau", weight: 1 });
  save();
  renderSegments();
});

document.getElementById("resetBtn").addEventListener("click", () => {
  state.segments = JSON.parse(JSON.stringify(DEFAULT_SEGMENTS));
  save();
  renderSegments();
});

/* ===================== WHEEL DRAWING ===================== */
let rotation = 0; // radians actuels de la roue

function totalWeight() {
  return state.segments.reduce((s, seg) => s + seg.weight, 0);
}

// Couleur générée automatiquement pour chaque segment (non personnalisable)
// const WHEEL_COLORS = ["#f6a936", "#629d30", "#ffffff"];
const WHEEL_COLORS = ["#0a3c5e","#ffffff"];
function colorForIndex(i) {
  return WHEEL_COLORS[i % WHEEL_COLORS.length];
}

function drawWheel() {
  const size = canvas.width;
  const radius = size / 2;
  const cx = radius, cy = radius;
  ctx.clearRect(0, 0, size, size);

  const total = totalWeight();
  let startAngle = rotation;

  state.segments.forEach((seg, i) => {
    const angle = (seg.weight / total) * Math.PI * 2;
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
    ctx.textAlign = "right";
    ctx.fillStyle = getContrastColor(color);
    ctx.font = "bold " + Math.max(13, Math.min(22, 300 / state.segments.length)) + "px 'Segoe UI', sans-serif";
    ctx.fillText(seg.label, radius - 24, 6);
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
  osc.frequency.value = 620;
  gain.gain.setValueAtTime(0.08, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.08);
  osc.connect(gain).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + 0.08);
}

function playFanfare() {
  if (!SETTINGS.sound) return;
  const ac = getAudioCtx();
  const notes = [523.25, 659.25, 783.99, 1046.5];
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
  const total = totalWeight();
  let start = 0;
  for (let i = 0; i < index; i++) start += state.segments[i].weight;
  const segAngle = (state.segments[index].weight / total) * Math.PI * 2;
  return start / total * Math.PI * 2 + segAngle / 2; // milieu du segment (angle relatif, sans rotation)
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

  function frame(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    const eased = t < 1 ? 1 - Math.pow(1 - t, 4) : 1; // ease-out quart pour ralentissement doux
    rotation = startRotation + totalRotation * eased;
    drawWheel();

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
  const total = totalWeight();
  let acc = 0;
  for (let i = 0; i < state.segments.length; i++) {
    acc += (state.segments[i].weight / total) * Math.PI * 2;
    if (angle <= acc) return i;
  }
  return state.segments.length - 1;
}

function finishSpin(winnerIndex) {
  spinning = false;
  spinBtn.disabled = false;
  wheelWrapper.classList.remove("spinning");

  const winner = state.segments[winnerIndex];
  const winnerColor = colorForIndex(winnerIndex);

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
  winnerLabel.textContent = winner.label;
  winnerModal.classList.add("show");
}
closeWinnerBtn.addEventListener("click", () => winnerModal.classList.remove("show"));
winnerModal.addEventListener("click", (e) => {
  if (e.target === winnerModal) winnerModal.classList.remove("show");
});

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
  const count = Math.floor((bgCanvas.width * bgCanvas.height) / 18000);
  for (let i = 0; i < count; i++) {
    bgParticles.push({
      x: Math.random() * bgCanvas.width,
      y: Math.random() * bgCanvas.height,
      r: Math.random() * 100 + 0.4,
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

/* ===================== INIT ===================== */
renderSegments();
buildLights();
drawWheel();
