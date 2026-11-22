// Keepsake viewer: tap a collected keepsake to look at it up close. Drag (or use the arrow keys)
// to turn it all the way around. Little Earth is a real globe; everything else is a spinning
// emoji with some thickness. Nothing is loaded from the network.
import { escapeHTML as e } from './core.js';
import { sparkle, sound, buzz } from './buddy-fx.js';

const TAU = Math.PI * 2;
export const wrapAngle = (a) => ((a % TAU) + TAU) % TAU;
export const clampPitch = (p, limit = 1.2) => Math.max(-limit, Math.min(limit, p));
// One animation step for the spin: coast with friction after a flick, drift slowly when idle.
export function stepSpin(s, dt, { idle = 0.5, friction = 2.4 } = {}) {
  const k = Math.exp(-friction * dt);
  // The turn eases back to a slow drift (or to rest when idle is 0); pitch just settles.
  const vyaw = idle + (s.vyaw - idle) * k, vpitch = s.vpitch * k;
  return { ...s, vyaw, vpitch, yaw: s.yaw + (s.dragging ? 0 : vyaw * dt), pitch: clampPitch(s.pitch + (s.dragging ? 0 : vpitch * dt)) };
}

// ---------- Globe: rough continents as [longitude, latitude] outlines ----------
const LAND = [
  [[-168, 66], [-156, 71], [-125, 70], [-95, 72], [-80, 63], [-64, 60], [-56, 52], [-66, 45], [-70, 42], [-76, 38], [-81, 31], [-80, 25], [-84, 30], [-90, 29], [-97, 26], [-97, 20], [-91, 19], [-87, 21], [-88, 16], [-83, 15], [-83, 10], [-79, 9], [-85, 10], [-92, 14], [-97, 16], [-105, 20], [-110, 24], [-115, 30], [-117, 32], [-121, 35], [-124, 40], [-124, 48], [-130, 54], [-140, 60], [-150, 61], [-158, 57], [-165, 55], [-162, 60], [-166, 64]],
  [[-73, 78], [-60, 82], [-30, 83], [-20, 75], [-22, 70], [-43, 60], [-52, 66], [-58, 75]],
  [[-78, 8], [-72, 12], [-62, 10], [-52, 5], [-50, 0], [-35, -6], [-39, -15], [-41, -22], [-48, -26], [-58, -35], [-62, -40], [-66, -47], [-69, -52], [-72, -54], [-75, -47], [-73, -37], [-71, -28], [-70, -18], [-76, -14], [-81, -5], [-80, 0], [-77, 4]],
  [[8, 58], [5, 62], [15, 69], [28, 71], [40, 67], [44, 68], [60, 70], [80, 73], [105, 78], [130, 72], [160, 70], [180, 68], [180, 65], [170, 60], [163, 58], [156, 51], [142, 54], [138, 46], [130, 42], [129, 35], [122, 40], [122, 30], [118, 24], [108, 21], [106, 10], [100, 13], [103, 2], [98, 8], [98, 16], [92, 22], [88, 22], [80, 15], [77, 8], [73, 17], [72, 21], [66, 25], [57, 25], [56, 27], [50, 30], [48, 29], [52, 24], [56, 24], [59, 22], [52, 16], [44, 13], [43, 16], [35, 28], [33, 31], [36, 36], [28, 37], [26, 40], [22, 37], [19, 41], [12, 44], [16, 38], [10, 44], [3, 43], [-1, 37], [-6, 36], [-9, 37], [-9, 43], [-2, 44], [-1, 47], [-5, 48], [2, 51], [8, 54]],
  [[-17, 21], [-10, 30], [-6, 36], [10, 37], [11, 33], [20, 31], [32, 31], [34, 28], [38, 20], [43, 12], [51, 12], [48, 4], [40, -3], [40, -15], [35, -24], [33, -28], [27, -34], [20, -35], [17, -30], [12, -17], [14, -9], [9, -1], [9, 4], [4, 6], [-8, 4], [-13, 8], [-17, 14]],
  [[114, -22], [122, -18], [130, -12], [137, -12], [142, -11], [146, -19], [153, -26], [150, -37], [141, -38], [135, -34], [129, -32], [115, -34], [113, -26]],
  [[-5, 50], [1, 51], [-2, 56], [-5, 58], [-6, 55]],
  [[130, 31], [135, 34], [141, 38], [142, 45], [140, 41], [136, 36]],
  [[109, 1], [117, 7], [119, 1], [116, -4], [110, -3]],
  [[95, 5], [98, 4], [106, -3], [105, -6], [100, -2]],
  [[44, -25], [47, -25], [50, -15], [49, -12], [44, -17]],
  [[120, 18], [122, 18], [122, 14], [124, 12], [126, 8], [125, 6], [122, 7], [121, 12], [120, 14]],
  [[-180, -70], [180, -70], [180, -90], [-180, -90]]
];
const TW = 720, TH = 360;
let landMask = null;
function mask() {
  if (landMask) return landMask;
  const c = document.createElement('canvas');
  c.width = TW; c.height = TH;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#000';
  for (const poly of LAND) {
    g.beginPath();
    poly.forEach(([lon, lat], i) => { const x = (lon + 180) * 2, y = (90 - lat) * 2; if (i) g.lineTo(x, y); else g.moveTo(x, y); });
    g.closePath(); g.fill();
  }
  const data = g.getImageData(0, 0, TW, TH).data;
  landMask = new Uint8Array(TW * TH);
  for (let i = 0; i < landMask.length; i++) landMask[i] = data[i * 4 + 3] > 127 ? 1 : 0;
  return landMask;
}

const SIZE = 176;
function drawGlobe(canvas, s) {
  const g = canvas.getContext('2d');
  const img = g.createImageData(SIZE, SIZE), px = img.data, land = mask();
  const sp = Math.sin(-s.pitch), cp = Math.cos(-s.pitch), half = SIZE / 2;
  for (let j = 0; j < SIZE; j++) {
    for (let i = 0; i < SIZE; i++) {
      const x = (i + 0.5 - half) / half, y = -(j + 0.5 - half) / half, r2 = x * x + y * y;
      if (r2 > 1) continue;
      const z = Math.sqrt(1 - r2);
      const y2 = y * cp - z * sp, z2 = y * sp + z * cp;
      const lon = (Math.atan2(x, z2) * 180) / Math.PI - (s.yaw * 180) / Math.PI;
      const lat = (Math.asin(Math.max(-1, Math.min(1, y2))) * 180) / Math.PI;
      const u = Math.floor((((lon + 180) % 360) + 360) % 360 * 2) % TW, v = Math.min(TH - 1, Math.floor((90 - lat) * 2));
      const isLand = land[v * TW + u] === 1;
      const light = 0.5 + 0.5 * Math.max(0, -0.4 * x + 0.5 * y + 0.75 * z);
      const rim = Math.pow(r2, 4) * 0.35;
      const [R, G, B] = isLand ? [86, 170, 84] : [44, 120, 196];
      const o = (j * SIZE + i) * 4;
      px[o] = Math.min(255, R * light + 255 * rim * 0.4);
      px[o + 1] = Math.min(255, G * light + 255 * rim * 0.6);
      px[o + 2] = Math.min(255, B * light + 255 * rim);
      px[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
}

// ---------- Spinning emoji with thickness ----------
const LAYERS = 9;
function buildStack(emoji) {
  const stack = document.createElement('div');
  stack.className = 'turn-stack';
  stack.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < LAYERS; i++) {
    const layer = document.createElement('span');
    layer.className = 'turn-layer';
    layer.textContent = emoji;
    const depth = (i - (LAYERS - 1) / 2) * 3;
    layer.style.transform = `translateZ(${depth}px)`;
    layer.style.filter = `brightness(${(0.62 + 0.38 * (i / (LAYERS - 1))).toFixed(2)})`;
    stack.append(layer);
  }
  return stack;
}

// ---------- Dialog ----------
export function openKeepsake(emoji, name) {
  if (typeof document === 'undefined') return;
  document.querySelector('#keepsake-view')?.remove();
  const isEarth = emoji === '🌍';
  const dialog = document.createElement('dialog');
  dialog.id = 'keepsake-view';
  dialog.className = 'sort-answer-panel reward-modal keepsake-view';
  dialog.setAttribute('aria-labelledby', 'keepsake-view-title');
  dialog.innerHTML = `<h3 id="keepsake-view-title">${e(name)}</h3><div class="keepsake-stage" tabindex="0" role="group" aria-label="Drag or use the arrow keys to turn it around"></div><p class="keepsake-hint">Drag to turn it around</p><div class="actions"><button type="button" class="secondary" data-keepsake-spin>Spin</button><button type="button" data-keepsake-close>Close</button></div>`;
  const stage = dialog.querySelector('.keepsake-stage');
  let canvas = null, stack = null;
  if (isEarth) {
    canvas = document.createElement('canvas');
    canvas.width = SIZE; canvas.height = SIZE; canvas.className = 'keepsake-globe';
    canvas.setAttribute('aria-hidden', 'true');
    stage.append(canvas);
  } else {
    stack = buildStack(emoji);
    stage.append(stack);
  }

  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let s = { yaw: isEarth ? -2.1 : 0, pitch: isEarth ? 0.35 : 0, vyaw: 0, vpitch: 0, dragging: false };
  let raf = 0, last = 0, pointer = null, lx = 0, ly = 0, lt = 0;
  const idle = calm ? 0 : 0.5;
  function paint() {
    if (isEarth) drawGlobe(canvas, s);
    else stack.style.transform = `rotateX(${(-s.pitch).toFixed(3)}rad) rotateY(${s.yaw.toFixed(3)}rad)`;
    stage.dataset.yaw = wrapAngle(s.yaw).toFixed(2);
    stage.dataset.pitch = s.pitch.toFixed(2);
  }
  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    s = stepSpin(s, dt, { idle });
    paint();
    if (dialog.isConnected && !document.hidden) raf = requestAnimationFrame(frame); else last = 0;
  }
  const start = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };

  stage.addEventListener('pointerdown', (ev) => {
    pointer = ev.pointerId; s.dragging = true; s.vyaw = 0; s.vpitch = 0;
    lx = ev.clientX; ly = ev.clientY; lt = ev.timeStamp;
    try { stage.setPointerCapture(ev.pointerId); } catch { /* optional */ }
    ev.preventDefault();
  });
  stage.addEventListener('pointermove', (ev) => {
    if (!s.dragging || ev.pointerId !== pointer) return;
    const dx = ev.clientX - lx, dy = ev.clientY - ly, dt = Math.max(1, ev.timeStamp - lt) / 1000;
    s.yaw += dx * 0.012;
    s.pitch = clampPitch(s.pitch + dy * 0.012);
    // Remember the speed so a flick keeps spinning after the finger lifts.
    s.vyaw = s.vyaw * 0.5 + ((dx * 0.012) / dt) * 0.5;
    s.vpitch = s.vpitch * 0.5 + ((dy * 0.012) / dt) * 0.5;
    lx = ev.clientX; ly = ev.clientY; lt = ev.timeStamp;
    paint();
  });
  const release = (ev) => {
    if (ev.pointerId !== pointer) return;
    s.dragging = false; pointer = null;
    if (calm) { s.vyaw = 0; s.vpitch = 0; }
    s.vyaw = Math.max(-14, Math.min(14, s.vyaw));
    s.vpitch = Math.max(-6, Math.min(6, s.vpitch));
    start();
  };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);
  stage.addEventListener('keydown', (ev) => {
    const step = 0.3, map = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const m = map[ev.key];
    if (!m) return;
    ev.preventDefault();
    s.yaw += m[0]; s.pitch = clampPitch(s.pitch + m[1]);
    paint(); start();
  });
  dialog.addEventListener('click', (ev) => {
    if (ev.target === dialog || ev.target.closest('[data-keepsake-close]')) { dialog.close(); return; }
    if (ev.target.closest('[data-keepsake-spin]')) { s.vyaw = 9; sound('unlock'); buzz(10); start(); }
  });
  dialog.addEventListener('close', () => { cancelAnimationFrame(raf); raf = 0; dialog.remove(); });
  document.body.append(dialog);
  if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
  paint();
  if (!calm) { s.vyaw = 6; start(); }
  stage.focus({ preventScroll: true });
  sparkle(stage, 6);
}
