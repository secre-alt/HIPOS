// Keepsake viewer: tap a collected keepsake to look at it up close. Drag (or use the arrow keys)
// to turn it all the way around. Little Earth is a real globe; everything else is a spinning
// emoji with some thickness. Nothing is loaded from the network.
import { escapeHTML as e } from './core.js';
import { sparkle, sound, buzz } from './buddy-fx.js';
import { landMask, LAND_W, LAND_H } from './land-mask.js';
import { KEEPSAKE_INFO } from './keepsake-info.js';
import { EVENTS } from './events.js';
import { buildScene, lightScene } from './keepsake-scene.js';
import { MODELS, drawModel } from './keepsake-model.js';

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

// ---------- Globe: land and sea from a bundled quarter-degree bitmap (pwa/land-mask.js) ----------
const SIZE = 240;
function sample(land, lon, lat) {
  // Bilinear, so coastlines are smooth instead of stair-stepped.
  const fx = (((lon + 180) % 360) + 360) % 360 * 4 - 0.5, fy = Math.min(LAND_H - 1, Math.max(0, (90 - lat) * 4 - 0.5));
  const x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
  const xa = (x0 + LAND_W) % LAND_W, xb = (x0 + 1) % LAND_W, ya = y0 * LAND_W, yb = Math.min(LAND_H - 1, y0 + 1) * LAND_W;
  return (land[ya + xa] * (1 - tx) + land[ya + xb] * tx) * (1 - ty) + (land[yb + xa] * (1 - tx) + land[yb + xb] * tx) * ty;
}
const mix = (a, b, t) => a + (b - a) * t;
function drawGlobe(canvas, s) {
  const g = canvas.getContext('2d');
  const img = g.createImageData(SIZE, SIZE), px = img.data, land = landMask();
  const sp = Math.sin(-s.pitch), cp = Math.cos(-s.pitch), half = SIZE / 2;
  for (let j = 0; j < SIZE; j++) {
    for (let i = 0; i < SIZE; i++) {
      const x = (i + 0.5 - half) / half, y = -(j + 0.5 - half) / half, r2 = x * x + y * y;
      if (r2 > 1) continue;
      const z = Math.sqrt(1 - r2);
      const y2 = y * cp - z * sp, z2 = y * sp + z * cp;
      const lon = (Math.atan2(x, z2) * 180) / Math.PI - (s.yaw * 180) / Math.PI;
      const lat = (Math.asin(Math.max(-1, Math.min(1, y2))) * 180) / Math.PI;
      const t = sample(land, lon, lat);
      // Greener near the equator, paler toward the poles, white ice at the very top and bottom.
      const polar = Math.min(1, Math.max(0, (Math.abs(lat) - 62) / 14));
      const warm = Math.max(0, 1 - Math.abs(lat) / 50);
      const landRGB = [mix(mix(70, 118, 1 - warm), 238, polar), mix(mix(160, 165, 1 - warm), 244, polar), mix(mix(82, 96, 1 - warm), 246, polar)];
      const depth = 0.75 + 0.25 * Math.min(1, z * 1.4);
      const sea = [40 * depth + 4, 112 * depth + 8, 190 * depth + 6];
      const light = 0.5 + 0.5 * Math.max(0, -0.4 * x + 0.5 * y + 0.75 * z);
      const rim = Math.pow(r2, 4) * 0.35;
      const o = (j * SIZE + i) * 4;
      px[o] = Math.min(255, mix(sea[0], landRGB[0], t) * light + 100 * rim);
      px[o + 1] = Math.min(255, mix(sea[1], landRGB[1], t) * light + 150 * rim);
      px[o + 2] = Math.min(255, mix(sea[2], landRGB[2], t) * light + 255 * rim);
      px[o + 3] = r2 > 0.985 ? Math.round(255 * (1 - r2) / 0.015) : 255;
    }
  }
  g.putImageData(img, 0, 0);
}

// ---------- Spinning emoji with thickness ----------
const LAYERS = 13;
function buildStack(emoji) {
  const stack = document.createElement('div');
  stack.className = 'turn-stack';
  stack.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < LAYERS; i++) {
    const layer = document.createElement('span');
    layer.className = 'turn-layer';
    layer.textContent = emoji;
    const depth = (i - (LAYERS - 1) / 2) * 2.5;
    layer.style.transform = `translateZ(${depth}px)`;
    layer.style.filter = `brightness(${(0.62 + 0.38 * (i / (LAYERS - 1))).toFixed(2)})`;
    stack.append(layer);
  }
  return stack;
}

// ---------- Details shown under the name ----------
// Daily-gift keepsakes use KEEPSAKE_INFO; event keepsakes show what the event item taught.
export function detailsHTML(name) {
  const plain = KEEPSAKE_INFO[name];
  if (plain) return `<p class="keepsake-about">${e(plain.about)}</p><p class="keepsake-tip"><strong>Try this:</strong> <span>${e(plain.tip)}</span></p>`;
  for (const ev of EVENTS) {
    const it = ev.items.find((x) => x.name === name);
    if (!it) continue;
    if (ev.kind === 'word') return `<p class="keepsake-about">${e(it.meaning)}</p><p class="keepsake-fil" lang="fil" data-no-translate>“${e(it.example)}”</p><p class="keepsake-tip"><strong>In English:</strong> <span data-no-translate>${e(it.english)}</span></p>`;
    return `<p class="keepsake-about">${e(it.detail)}</p><p class="keepsake-tip"><strong>Try this:</strong> <span>${e(it.title)}</span></p>`;
  }
  return '';
}

// ---------- Dialog ----------
export function openKeepsake(emoji, name) {
  if (typeof document === 'undefined') return;
  document.querySelector('#keepsake-view')?.remove();
  const isEarth = emoji === '🌍', model = MODELS[name] || null;
  const dialog = document.createElement('dialog');
  dialog.id = 'keepsake-view';
  dialog.className = 'sort-answer-panel reward-modal keepsake-view';
  dialog.setAttribute('aria-labelledby', 'keepsake-view-title');
  dialog.innerHTML = `<h3 id="keepsake-view-title">${e(name)}</h3><div class="keepsake-stage" tabindex="0" role="group" aria-label="Drag or use the arrow keys to turn it around"></div><p class="keepsake-hint">Drag to turn it around</p>${detailsHTML(name)}<div class="actions"><button type="button" class="secondary" data-keepsake-spin>Spin</button><button type="button" data-keepsake-close>Close</button></div>`;
  const stage = dialog.querySelector('.keepsake-stage');
  const scene = buildScene(name);
  stage.append(scene);
  let canvas = null, stack = null;
  if (isEarth || model) {
    canvas = document.createElement('canvas');
    canvas.width = SIZE; canvas.height = SIZE; canvas.className = isEarth ? 'keepsake-globe' : 'keepsake-model';
    canvas.setAttribute('aria-hidden', 'true');
    stage.append(canvas);
  } else {
    stack = buildStack(emoji);
    const light = document.createElement('div');
    light.className = 'keepsake-light';
    light.append(stack);
    stage.append(light);
  }

  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let s = { yaw: isEarth ? -2.1 : model?.yaw || 0, pitch: isEarth ? 0.35 : model?.pitch || 0, vyaw: 0, vpitch: 0, dragging: false };
  let raf = 0, last = 0, pointer = null, lx = 0, ly = 0, lt = 0;
  const idle = calm ? 0 : 0.5;
  function paint() {
    if (isEarth) drawGlobe(canvas, s);
    else if (model) drawModel(canvas, model, s, performance.now() / 1000);
    else stack.style.transform = `rotateX(${(-s.pitch).toFixed(3)}rad) rotateY(${s.yaw.toFixed(3)}rad)`;
    lightScene(scene, s.yaw);
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
