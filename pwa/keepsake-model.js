// Small hand-built 3D models for a few favourite keepsakes, drawn on a canvas with a tiny
// software renderer (flat-shaded faces, sorted back to front). No libraries or images.
import { SHAPES } from './keepsake-shapes.js';
const TAU = Math.PI * 2;
const ring = (n, r, y, off = 0) => Array.from({ length: n }, (_, i) => [Math.cos(off + (i / n) * TAU) * r, y, Math.sin(off + (i / n) * TAU) * r]);

// A face is { pts: [[x, y, z], ...], color: [r, g, b], spec?: 0..1, bias?: number }.
function starFaces() {
  const out = [], T = 0.3, gold = [236, 188, 40], light = [255, 222, 100], dark = [196, 140, 20];
  const star = (scale, z) => Array.from({ length: 10 }, (_, i) => { const a = Math.PI / 2 + (i * Math.PI) / 5, r = (i % 2 ? 0.45 : 1) * scale; return [Math.cos(a) * r, Math.sin(a) * r, z]; });
  const outerFront = star(1, T * 0.55), innerFront = star(0.8, T), outerBack = star(1, -T * 0.55), innerBack = star(0.8, -T);
  out.push({ pts: innerFront, color: light, spec: 0.7 }, { pts: innerBack.slice().reverse(), color: light, spec: 0.7 });
  for (let i = 0; i < 10; i++) {
    const j = (i + 1) % 10;
    out.push({ pts: [innerFront[i], innerFront[j], outerFront[j], outerFront[i]], color: gold, spec: 0.5 });
    out.push({ pts: [innerBack[j], innerBack[i], outerBack[i], outerBack[j]], color: gold, spec: 0.5 });
    out.push({ pts: [outerFront[i], outerFront[j], outerBack[j], outerBack[i]], color: dark, spec: 0.3 });
  }
  return out;
}
function treeFaces() {
  const out = [], greens = [[38, 138, 70], [50, 158, 80], [68, 178, 92]], bark = [120, 78, 44];
  const trunkTop = ring(10, 0.17, -0.5), trunkBottom = ring(10, 0.17, -1);
  for (let i = 0; i < 10; i++) { const j = (i + 1) % 10; out.push({ pts: [trunkBottom[i], trunkBottom[j], trunkTop[j], trunkTop[i]], color: bark }); }
  [[-0.6, 0.9, -0.02], [-0.22, 0.7, 0.4], [0.14, 0.5, 0.86]].forEach(([y, r, top], k) => {
    const base = ring(14, r, y, k * 0.2);
    out.push({ pts: base.slice().reverse(), color: [30, 100, 55] });
    for (let i = 0; i < 14; i++) out.push({ pts: [[0, top + 0.28, 0], base[i], base[(i + 1) % 14]], color: greens[k], spec: 0.15 });
  });
  // Red ornaments sit on the branches: [which cone, height fraction, angle].
  const cones = [[-0.6, 0.9, -0.02], [-0.22, 0.7, 0.4], [0.14, 0.5, 0.86]];
  [[0, 0.3, 0.2], [0, 0.35, 2.6], [0, 0.3, 4.6], [1, 0.3, 1.2], [1, 0.35, 3.6], [1, 0.3, 5.5], [2, 0.3, 0.5], [2, 0.3, 3.3], [2, 0.35, 5.2]].forEach(([k, f, a]) => {
    const [y0, r0, top] = cones[k], apex = top + 0.28, y = y0 + (apex - y0) * f, r = r0 * (1 - f) + 0.07;
    const cx = Math.cos(a) * r, cz = Math.sin(a) * r, d = 0.085, v = [[d, 0, 0], [-d, 0, 0], [0, d, 0], [0, -d, 0], [0, 0, d], [0, 0, -d]].map(([x, yy, z]) => [x + cx, yy + y, z + cz]);
    [[2, 0, 4], [2, 4, 1], [2, 1, 5], [2, 5, 0], [3, 4, 0], [3, 1, 4], [3, 5, 1], [3, 0, 5]].forEach((t) => out.push({ pts: t.map((i) => v[i]), color: k === 1 ? [240, 200, 60] : [225, 60, 60], spec: 0.9, bias: 0.3 }));
  });
  return out;
}
function butterflyFaces(t) {
  const out = [], phi = 0.5 * Math.sin(t * 7) + 0.25, cp = Math.cos(phi), sp = Math.sin(phi);
  const wing = (pts, side, color, bias, spec = 0.25) => out.push({ pts: pts.map(([x, y]) => [side * x * cp, y, x * sp]), color, bias, spec });
  const scale = (pts, k, ox = 0.06, oy = 0) => pts.map(([x, y]) => [ox + (x - ox) * k, oy + (y - oy) * k]);
  const upper = [[0.06, 0.05], [0.35, 0.58], [0.85, 0.98], [1.05, 0.62], [0.92, 0.1], [0.1, -0.02]];
  const lower = [[0.06, -0.02], [0.88, -0.06], [0.82, -0.5], [0.46, -0.78], [0.12, -0.46]];
  for (const side of [1, -1]) {
    wing(upper, side, [48, 28, 20], 0); wing(scale(upper, 0.86), side, [244, 132, 28], 0.05);
    wing(lower, side, [48, 28, 20], 0); wing(scale(lower, 0.86, 0.06, -0.1), side, [250, 160, 50], 0.05);
    wing(scale(upper, 0.14).map(([x, y]) => [x + 0.78, y + 0.55]), side, [255, 255, 255], 0.1, 0.1);
    wing(scale(lower, 0.12).map(([x, y]) => [x + 0.5, y - 0.45]), side, [255, 255, 255], 0.1, 0.1);
  }
  const top = ring(6, 0.07, 0.62), bottom = ring(6, 0.07, -0.7);
  const rot = (p) => [p[0], p[1], p[2]];
  for (let i = 0; i < 6; i++) { const j = (i + 1) % 6; out.push({ pts: [bottom[i], bottom[j], top[j], top[i]].map(rot), color: [40, 28, 24], bias: 0.02, spec: 0.3 }); }
  out.push({ pts: top.map(rot), color: [60, 40, 34], bias: 0.02 });
  // Antennae
  out.push({ pts: [[0.03, 0.62, 0], [0.4, 1.12, 0], [0.43, 1.1, 0], [0.07, 0.62, 0]], color: [40, 28, 24], bias: 0.3 });
  out.push({ pts: [[-0.03, 0.62, 0], [-0.4, 1.12, 0], [-0.43, 1.1, 0], [-0.07, 0.62, 0]], color: [40, 28, 24], bias: 0.3 });
  return out;
}

const MOVING = new Set(['Busy bee', 'Compost worm']);
const PITCH = { 'Ladybug': 0.55, 'Nest': 0.55, 'Noche Buena plate': 0.5, 'Sea shell': 0.1, 'Rainbow': 0.1, 'Pag-asa': 0.3, 'Compost worm': 0.5, 'Malinis': 0.4, 'Lunchbox': 0.35, 'Basket': 0.3, 'Mushroom': 0.15, 'Sunshine': 0.1, 'Wika champion': 0.1, 'Recycle badge': 0.1, 'Muling gamitin': 0.1, 'Mushroom': 0.2 };
export const MODELS = {
  'Gold star': { faces: () => starFaces(), pitch: 0.15, yaw: 0.6, scale: 0.4 },
  'Tiny tree': { faces: () => treeFaces(), pitch: 0.18, yaw: 0.5, scale: 0.4 },
  'Butterfly': { faces: (t) => butterflyFaces(t), pitch: 0.25, yaw: 0, scale: 0.33, animated: true },
  ...Object.fromEntries(Object.entries(SHAPES).map(([name, faces]) => [name, { faces, pitch: PITCH[name] ?? 0.22, yaw: 0.55, animated: MOVING.has(name) }]))
};

// ---------- Renderer ----------
const L = (() => { const v = [-0.4, 0.6, 0.7], n = Math.hypot(...v); return v.map((x) => x / n); })();
const H = (() => { const v = [L[0], L[1], L[2] + 1], n = Math.hypot(...v); return v.map((x) => x / n); })();
export function projectFaces(faces, { yaw, pitch }, center = [0, 0, 0]) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
  return faces.map((f) => {
    const pts = f.pts.map(([x0, y0, z0]) => {
      const x = x0 - center[0], y = y0 - center[1], z = z0 - center[2];
      const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
      return [x1, y * cp - z1 * sp, y * sp + z1 * cp];
    });
    // Normal by Newell's method; faces are two-sided, so flip it to face the viewer.
    let nx = 0, ny = 0, nz = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); nz += (a[0] - b[0]) * (a[1] + b[1]);
    }
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len; ny /= len; nz /= len;
    if (nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
    const depth = pts.reduce((s, p) => s + p[2], 0) / pts.length + (f.bias || 0);
    const diff = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]);
    const spec = (f.spec || 0) * Math.pow(Math.max(0, nx * H[0] + ny * H[1] + nz * H[2]), 24);
    const shade = 0.5 + 0.5 * diff;
    const color = f.color.map((c) => Math.min(255, Math.round(c * shade + 255 * spec * 0.9)));
    return { pts, depth, color, alpha: f.alpha };
  }).sort((a, b) => a.depth - b.depth);
}
// Centres each model on its own middle and sizes it so it never leaves the canvas while turning.
function prepare(model) {
  if (model.fit) return;
  const pts = model.faces(0.4).flatMap((f) => f.pts), lo = [0, 1, 2].map((a) => Math.min(...pts.map((p) => p[a]))), hi = [0, 1, 2].map((a) => Math.max(...pts.map((p) => p[a])));
  model.center = lo.map((v, a) => (v + hi[a]) / 2);
  const R = Math.max(...pts.map((p) => Math.hypot(p[0] - model.center[0], p[1] - model.center[1], p[2] - model.center[2]))) * (model.animated ? 1.1 : 1);
  model.fit = Math.min(0.4, 0.4 / R);
}
export function drawModel(canvas, model, s, time = 0) {
  prepare(model);
  const g = canvas.getContext('2d'), size = canvas.width, c = size / 2, k = size * model.fit;
  g.clearRect(0, 0, size, size);
  g.lineJoin = 'round'; g.lineWidth = 1; g.globalAlpha = 1;
  // Still models are built once; moving ones are rebuilt every frame.
  const faces = model.animated ? model.faces(time) : (model.cache ||= model.faces(0));
  for (const f of projectFaces(faces, s, model.center)) {
    g.beginPath();
    f.pts.forEach(([x, y, z], i) => { const p = 4 / (4 - z), px = c + x * p * k, py = c - y * p * k; if (i) g.lineTo(px, py); else g.moveTo(px, py); });
    g.closePath();
    const css = `rgb(${f.color[0]}, ${f.color[1]}, ${f.color[2]})`;
    g.globalAlpha = f.alpha || 1;
    g.fillStyle = css; g.strokeStyle = css; g.fill(); if (!f.alpha) g.stroke();
  }
  g.globalAlpha = 1;
}
