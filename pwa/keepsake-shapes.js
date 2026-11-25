// Building blocks and hand-built models for the keepsake viewer. Every model is a list of faces
// { pts: [[x, y, z], ...], color: [r, g, b], spec?, bias?, alpha? } in a box of about -1.2 to 1.2.
// Y is up and the camera looks down -Z. Nothing here touches the page, so it is unit tested.
export const TAU = Math.PI * 2;
export const ring = (n, r, y, off = 0) => Array.from({ length: n }, (_, i) => [Math.cos(off + (i / n) * TAU) * r, y, Math.sin(off + (i / n) * TAU) * r]);

export const C = {
  green: [64, 164, 84], dgreen: [34, 118, 60], lgreen: [120, 204, 104], brown: [132, 86, 48], dbrown: [92, 58, 36], soil: [98, 64, 42],
  red: [222, 60, 56], dred: [170, 36, 40], orange: [244, 140, 40], yellow: [250, 212, 72], white: [246, 246, 240], cream: [250, 236, 204],
  blue: [64, 142, 222], dblue: [38, 94, 170], lblue: [150, 205, 250], teal: [48, 170, 168], pink: [242, 150, 182], gray: [150, 156, 162],
  silver: [208, 213, 220], black: [44, 36, 36], purple: [150, 102, 200], terra: [204, 112, 70], gold: [236, 188, 40], tan: [208, 168, 110], sand: [236, 206, 120]
};

// ---------- Transform ----------
export function xf(faces, { t = [0, 0, 0], s = 1, rx = 0, ry = 0, rz = 0 } = {}) {
  const [sx, sy, sz] = Array.isArray(s) ? s : [s, s, s];
  const cx = Math.cos(rx), sxn = Math.sin(rx), cy = Math.cos(ry), syn = Math.sin(ry), cz = Math.cos(rz), szn = Math.sin(rz);
  return faces.map((f) => ({
    ...f,
    pts: f.pts.map(([x, y, z]) => {
      x *= sx; y *= sy; z *= sz;
      let a = x * cz - y * szn, b = x * szn + y * cz; x = a; y = b;
      a = y * cx - z * sxn; b = y * sxn + z * cx; y = a; z = b;
      a = x * cy + z * syn; b = -x * syn + z * cy; x = a; z = b;
      return [x + t[0], y + t[1], z + t[2]];
    })
  }));
}
export const at = (faces, x, y, z, extra = {}) => xf(faces, { t: [x, y, z], ...extra });

// ---------- Primitives ----------
// Surface of revolution around the Y axis. profile = [[radius, y], ...]; paint(k, i) picks a colour.
export function lathe(profile, { seg = 14, color = C.gray, paint, spec = 0.15, bias = 0, alpha, caps = true, off = 0 } = {}) {
  const rings = profile.map(([r, y]) => ring(seg, r, y, off)), out = [];
  const pick = (k, i) => (paint ? paint(k, i) : color), extra = { spec, bias, ...(alpha ? { alpha } : {}) };
  for (let k = 0; k < rings.length - 1; k++) {
    for (let i = 0; i < seg; i++) {
      const j = (i + 1) % seg;
      out.push({ pts: [rings[k][i], rings[k][j], rings[k + 1][j], rings[k + 1][i]], color: pick(k, i), ...extra });
    }
  }
  if (caps && profile[0][0] > 0) out.push({ pts: rings[0].slice().reverse(), color: pick(0, 0), ...extra });
  if (caps && profile.at(-1)[0] > 0) out.push({ pts: rings.at(-1), color: pick(rings.length - 2, 0), ...extra });
  return out;
}
export const cyl = (r, h, color, o = {}) => lathe([[r, -h / 2], [r, h / 2]], { color, ...o });
export const cone = (r, h, color, o = {}) => lathe([[r, 0], [0, h]], { color, ...o });
export function ball(r, color, { sc = [1, 1, 1], seg = 10, rings = 6, ...o } = {}) {
  const profile = Array.from({ length: rings + 1 }, (_, j) => { const a = -Math.PI / 2 + (j / rings) * Math.PI; return [Math.max(0, r * Math.cos(a)), r * Math.sin(a)]; });
  return xf(lathe(profile, { seg, color, spec: 0.5, ...o }), { s: sc });
}
export function dome(r, h, color, { seg = 14, rings = 5, ...o } = {}) {
  const profile = Array.from({ length: rings + 1 }, (_, j) => { const a = (j / rings) * (Math.PI / 2); return [r * Math.cos(a), h * Math.sin(a)]; });
  return lathe(profile, { seg, color, spec: 0.5, ...o });
}
export function box(w, h, d, color, o = {}) {
  const x = w / 2, y = h / 2, z = d / 2, p = [[-x, -y, -z], [x, -y, -z], [x, y, -z], [-x, y, -z], [-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]];
  const q = [[4, 5, 6, 7], [1, 0, 3, 2], [5, 1, 2, 6], [0, 4, 7, 3], [7, 6, 2, 3], [0, 1, 5, 4]];
  return q.map((ix) => ({ pts: ix.map((i) => p[i]), color, spec: 0.2, ...o }));
}
// A flat 2D outline pushed out to a solid of the given thickness (centred on z = 0).
export function extrude(poly, th, color, { side, spec = 0.25, bias = 0, alpha } = {}) {
  const h = th / 2, out = [], extra = { spec, bias, ...(alpha ? { alpha } : {}) };
  out.push({ pts: poly.map(([x, y]) => [x, y, h]), color, ...extra }, { pts: poly.map(([x, y]) => [x, y, -h]).reverse(), color, ...extra });
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    out.push({ pts: [[a[0], a[1], -h], [b[0], b[1], -h], [b[0], b[1], h], [a[0], a[1], h]], color: side || color, ...extra });
  }
  return out;
}
export function arcPoly(r0, r1, a0, a1, n = 10) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; pts.push([Math.cos(a) * r1, Math.sin(a) * r1]); }
  for (let i = n; i >= 0; i--) { const a = a0 + ((a1 - a0) * i) / n; pts.push([Math.cos(a) * r0, Math.sin(a) * r0]); }
  return pts;
}
export function leafPoly(len, w, n = 9) {
  const top = [], bot = [];
  for (let i = 0; i <= n; i++) { const x = (len * i) / n, y = w * Math.pow(Math.sin((Math.PI * i) / n), 0.8) * (1 - 0.25 * (i / n)); top.push([x, y]); if (i && i < n) bot.unshift([x, -y]); }
  return [...top, ...bot];
}
export function leafGroup(len, w, color = C.green, rib = C.lgreen) {
  return [
    ...extrude(leafPoly(len, w), 0.05, color, { spec: 0.3 }),
    ...at(box(len * 0.92, 0.035, 0.03, rib, { bias: 0.1 }), len * 0.47, 0, 0.03),
    ...at(box(0.22, 0.05, 0.05, C.dgreen), -0.08, 0, 0)
  ];
}
export function starPoly(R, r, points = 5, rot = Math.PI / 2) {
  return Array.from({ length: points * 2 }, (_, i) => { const a = rot + (i * Math.PI) / points, k = i % 2 ? r : R; return [Math.cos(a) * k, Math.sin(a) * k]; });
}
const rainbowCols = [[226, 62, 60], [246, 150, 40], [250, 214, 70], [80, 180, 90], [70, 140, 220]];

// ---------- Models ----------
const MAPLE = (() => {
  const lobes = [[90, 1], [40, 0.85], [140, 0.85], [-5, 0.62], [185, 0.62], [-60, 0.38], [240, 0.38]];
  const sorted = lobes.map(([d, r]) => [(d * Math.PI) / 180, r]).sort((a, b) => a[0] - b[0]);
  const pts = [];
  sorted.forEach(([a, r], i) => {
    const next = sorted[(i + 1) % sorted.length], mid = (a + (i === sorted.length - 1 ? next[0] + TAU : next[0])) / 2;
    pts.push([Math.cos(a) * r, Math.sin(a) * r], [Math.cos(mid) * 0.32, Math.sin(mid) * 0.32]);
  });
  return pts;
})();

export const SHAPES = {
  'Little seed': () => [
    ...at(lathe([[0, 0], [0.8, 0], [0.7, 0.18], [0.4, 0.32], [0, 0.35]], { color: C.soil, bias: -0.3 }), 0, -0.95, 0),
    ...at(cyl(0.05, 0.85, C.green), 0, -0.45, 0),
    ...at(leafGroup(0.8, 0.36, C.green), 0.03, -0.1, 0, { rz: 0.45 }),
    ...at(leafGroup(0.8, 0.36, C.lgreen), -0.03, -0.1, 0, { rz: 0.45, ry: Math.PI })
  ],
  'Fresh leaf': () => [
    ...at(leafGroup(1.9, 0.85, C.green), -0.7, -0.7, 0, { rz: 0.9 }),
    ...at(extrude(leafPoly(0.8, 0.3), 0.04, C.lgreen), -0.45, -0.2, 0.02, { rz: 0.4, ry: 0.2 })
  ],
  'Potted plant': () => [
    ...lathe([[0, -1], [0.46, -1], [0.66, -0.3], [0.78, -0.3], [0.78, -0.1], [0.66, -0.1]], { color: C.terra, spec: 0.2, seg: 16 }),
    ...lathe([[0, -0.12], [0.62, -0.12]], { color: C.soil, bias: -0.2, seg: 16 }),
    ...[0, 1, 2, 3].flatMap((k) => at(leafGroup(0.95, 0.4, k % 2 ? C.lgreen : C.green), 0, -0.1, 0, { rz: 0.9 + (k % 2) * 0.35, ry: k * 1.6 }))
  ],
  'Recycle badge': () => [0, 1, 2].flatMap((k) => {
    const a0 = 0.25, a1 = 1.65, head = [[Math.cos(a1) * 1.15, Math.sin(a1) * 1.15], [Math.cos(a1 + 0.5) * 0.79, Math.sin(a1 + 0.5) * 0.79], [Math.cos(a1) * 0.43, Math.sin(a1) * 0.43]];
    const outer = arcPoly(0.62, 0.95, a0, a1, 8), cut = outer.length / 2;
    const poly = [...outer.slice(0, cut), ...head, ...outer.slice(cut)];
    return xf(extrude(poly, 0.24, k === 1 ? C.lgreen : C.green, { side: C.dgreen, spec: 0.35 }), { rz: k * (TAU / 3), t: [0, 0, 0] });
  }),
  'Refill bottle': () => [
    ...lathe([[0, -1], [0.45, -1], [0.52, -0.9], [0.52, 0.2], [0.36, 0.55], [0.19, 0.64], [0.19, 0.84]], { color: C.blue, spec: 0.85, seg: 16 }),
    ...lathe([[0.525, -0.65], [0.525, -0.1]], { color: C.white, caps: false, seg: 16, bias: 0.05 }),
    ...lathe([[0, 0.84], [0.25, 0.84], [0.25, 1.08], [0, 1.08]], { color: C.white, spec: 0.5, seg: 12 }),
    ...at(ball(0.16, C.blue, { sc: [1, 1.5, 0.3] }), 0, -0.38, 0.53, { s: [1, 1, 1] })
  ],
  'Lunchbox': () => [
    ...at(box(1.7, 0.7, 1.1, C.teal), 0, -0.4, 0), ...at(box(1.78, 0.3, 1.18, [90, 200, 196], { spec: 0.4 }), 0, 0.1, 0),
    ...at(box(0.3, 0.3, 0.1, C.yellow), 0, -0.12, 0.62), ...at(box(1.0, 0.1, 0.1, C.gray), 0, 0.33, 0), ...at(box(0.1, 0.22, 0.1, C.gray), -0.5, 0.26, 0), ...at(box(0.1, 0.22, 0.1, C.gray), 0.5, 0.26, 0),
    ...at(box(1.2, 0.08, 0.04, C.white, { bias: 0.1 }), 0, -0.45, 0.57)
  ],
  'Reusable fork': () => [
    ...at(box(0.2, 1.1, 0.07, C.silver, { spec: 0.8 }), 0, -0.55, 0), ...at(box(0.12, 0.3, 0.07, C.silver, { spec: 0.8 }), 0, 0.12, 0),
    ...at(box(0.72, 0.34, 0.07, C.silver, { spec: 0.8 }), 0, 0.3, 0),
    ...[-0.3, -0.1, 0.1, 0.3].flatMap((x) => at(box(0.1, 0.7, 0.07, C.silver, { spec: 0.8 }), x, 0.82, 0)),
    ...at(ball(0.14, C.silver, { sc: [1.3, 1, 0.5] }), 0, -1.1, 0)
  ],
  'Compost pail': () => [
    ...lathe([[0, -0.95], [0.55, -0.95], [0.72, 0.5], [0.78, 0.5], [0.78, 0.6], [0.7, 0.6]], { color: C.teal, spec: 0.35, seg: 16 }),
    ...lathe([[0, 0.5], [0.68, 0.5]], { color: C.soil, seg: 16, bias: 0.1 }),
    ...at(extrude(arcPoly(0.82, 0.9, 0, Math.PI, 12), 0.07, C.gray, { spec: 0.6 }), 0, 0.58, 0),
    ...at(ball(0.2, C.yellow, { sc: [1.5, 0.6, 0.7] }), -0.2, 0.56, 0.1), ...at(ball(0.16, C.red), 0.25, 0.58, 0.2), ...at(ball(0.14, C.lgreen), 0.1, 0.55, -0.3), ...at(ball(0.13, C.cream, { sc: [1.3, 0.6, 1] }), -0.3, 0.55, -0.2)
  ],
  'Compost worm': (t = 0) => [
    ...lathe([[0, -0.75], [1.0, -0.75], [0.85, -0.5], [0.45, -0.35], [0, -0.33]], { color: C.soil, bias: -0.3, seg: 16 }),
    ...Array.from({ length: 10 }, (_, i) => {
      const u = i / 9, x = -0.75 + u * 1.5, y = -0.15 + 0.14 * Math.sin(u * 7 - t * 4) + 0.18 * Math.sin(u * Math.PI), r = 0.17 - 0.05 * Math.abs(u - 0.5) * 0.4 + (i === 9 ? 0.05 : 0);
      return at(ball(r, i % 2 ? C.pink : [248, 176, 196], { sc: [1, 1, 1.1], seg: 8, rings: 4 }), x, y, 0.1 * Math.sin(u * 5 - t * 3));
    }).flat(),
    ...at(ball(0.04, C.white), 0.8, 0.12, 0.13), ...at(ball(0.04, C.white), 0.8, 0.12, -0.05), ...at(ball(0.02, C.black), 0.83, 0.12, 0.13)
  ],
  'Autumn leaf': () => [
    ...at(extrude(MAPLE, 0.06, C.orange, { spec: 0.3, side: C.dred }), 0, 0.2, 0, { s: 1.1 }),
    ...at(extrude(MAPLE.map(([x, y]) => [x * 0.55, y * 0.55]), 0.06, C.red, { bias: 0.05 }), 0, 0.2, 0.02, { s: 1.1 }),
    ...at(box(0.07, 0.7, 0.06, C.dbrown), 0, -0.65, 0)
  ],
  'Water drop': () => {
    const prof = Array.from({ length: 15 }, (_, i) => { const p = (i / 14) * Math.PI; return [Math.sin(p) * Math.pow(Math.sin(p / 2), 1.2) * 0.75, Math.cos(p) * 0.95 + 0.1]; }).reverse();
    return [
      ...lathe(prof, { color: C.blue, spec: 0.95, seg: 16 }),
      ...lathe([[0.55, -0.95], [0.85, -0.95]], { color: C.lblue, caps: false, seg: 18, bias: -0.2, spec: 0.5 }),
      ...lathe([[0.9, -0.95], [1.05, -0.95]], { color: C.lblue, caps: false, seg: 18, bias: -0.2 }),
      ...at(ball(0.12, C.white, { sc: [0.5, 1.6, 0.5] }), -0.28, 0.05, 0.4, { rz: -0.15 })
    ];
  },
  'Sunshine': () => [
    ...Array.from({ length: 12 }, (_, k) => xf(extrude([[-0.14, 0.7], [0.14, 0.7], [0, 1.1]], 0.14, k % 2 ? C.orange : C.yellow, { spec: 0.35 }), { rz: k * (TAU / 12) })).flat(),
    ...xf(cyl(0.68, 0.3, C.yellow, { spec: 0.5, seg: 20 }), { rx: Math.PI / 2 }),
    ...at(ball(0.07, C.black), -0.22, 0.12, 0.17), ...at(ball(0.07, C.black), 0.22, 0.12, 0.17),
    ...at(extrude(arcPoly(0.28, 0.35, Math.PI * 1.15, Math.PI * 1.85, 8), 0.04, C.orange, { bias: 0.2 }), 0, 0.05, 0.16),
    ...at(ball(0.1, C.pink, { sc: [1, 0.7, 0.3] }), -0.4, -0.08, 0.17), ...at(ball(0.1, C.pink, { sc: [1, 0.7, 0.3] }), 0.4, -0.08, 0.17)
  ],
  'Rainbow': () => [
    ...rainbowCols.flatMap((c, k) => at(extrude(arcPoly(1.12 - k * 0.16 - 0.16, 1.12 - k * 0.16, 0, Math.PI, 16), 0.3, c, { spec: 0.35 }), 0, -0.55, 0)),
    ...[[-0.95, 0.1], [0.95, -0.05]].flatMap(([x, z]) => [...at(ball(0.3, C.white, { spec: 0.1 }), x, -0.55, z + 0.25), ...at(ball(0.24, C.white, { spec: 0.1 }), x + (x < 0 ? 0.28 : -0.28), -0.62, z + 0.28), ...at(ball(0.22, C.white, { spec: 0.1 }), x + (x < 0 ? -0.26 : 0.26), -0.62, z + 0.25)])
  ],
  'Busy bee': (t = 0) => {
    const flap = 0.55 * Math.sin(t * 28), prof = Array.from({ length: 11 }, (_, j) => { const a = -Math.PI / 2 + (j / 10) * Math.PI; return [Math.max(0, 0.5 * Math.cos(a)), 0.82 * Math.sin(a)]; });
    return [
      ...xf(lathe(prof, { seg: 12, paint: (k) => (k % 3 === 1 ? C.black : C.yellow), spec: 0.4 }), { rz: -Math.PI / 2, t: [-0.15, 0, 0] }),
      ...at(ball(0.36, C.black), 0.82, 0.02, 0), ...at(ball(0.08, C.white), 1.05, 0.12, 0.17), ...at(ball(0.08, C.white), 1.05, 0.12, -0.17),
      ...at(cone(0.1, 0.34, C.black), -1.02, -0.02, 0, { rz: Math.PI / 2 }),
      ...at(box(0.03, 0.4, 0.03, C.black), 1.0, 0.45, 0.14, { rz: -0.4 }), ...at(box(0.03, 0.4, 0.03, C.black), 1.0, 0.45, -0.14, { rz: -0.4 }),
      ...at(ball(0.55, C.lblue, { sc: [0.55, 0.06, 0.32], alpha: 0.75, spec: 0.7 }), -0.05, 0.62, 0.35, { rx: flap }),
      ...at(ball(0.55, C.lblue, { sc: [0.55, 0.06, 0.32], alpha: 0.75, spec: 0.7 }), -0.05, 0.62, -0.35, { rx: -flap })
    ];
  },
  'Ladybug': () => {
    const spots = [[0.3, 0.5], [2.0, 0.55], [3.4, 0.55], [4.8, 0.5], [1.2, 0.95], [5.6, 0.95], [3.0, 0.95], [0.0, 0.0]].map(([th, ph]) => [0.97 * Math.sin(ph) * Math.cos(th) * 0.95, 0.82 * Math.cos(ph) + 0.01, 0.97 * Math.sin(ph) * Math.sin(th)]);
    return [
      ...dome(0.97, 0.82, C.red, { seg: 18, rings: 6, spec: 0.85 }), ...lathe([[0.97, 0], [0.92, -0.12], [0, -0.12]], { color: C.black, seg: 18 }),
      ...at(box(1.95, 0.02, 0.025, C.black, { bias: 0.4 }), 0, 0.83, 0, { ry: 0 }),
      ...spots.flatMap(([x, y, z]) => at(ball(0.15, C.black, { sc: [1, 0.55, 1] }), x, y, z)),
      ...at(ball(0.36, C.black), 1.0, 0.1, 0), ...at(ball(0.08, C.white), 1.28, 0.22, 0.17), ...at(ball(0.08, C.white), 1.28, 0.22, -0.17)
    ];
  },
  'Mushroom': () => [
    ...lathe([[0, -1], [0.3, -1], [0.23, -0.5], [0.2, 0.05], [0.27, 0.2], [0, 0.2]], { color: C.cream, spec: 0.2, seg: 14 }),
    ...lathe([[0, -1.02], [0.95, -1.02], [0.7, -0.9], [0, -0.88]], { color: C.green, bias: -0.3, seg: 16 }),
    ...at(dome(1.0, 0.85, C.red, { seg: 16, rings: 6 }), 0, 0.15, 0),
    ...lathe([[0.99, 0.15], [0.1, 0.15]], { color: C.cream, caps: false, seg: 16, bias: -0.1 }),
    ...[[0.4, 0.5, 0.28], [-0.45, 0.45, 0.4], [0.05, 0.9, 0.0], [0.3, 0.45, -0.55], [-0.4, 0.4, -0.5], [0.0, 0.5, 0.65]].flatMap(([x, y, z]) => at(ball(0.13, C.white, { sc: [1, 0.55, 1] }), x, y, z))
  ],
  'Nest': () => [
    ...lathe([[0, -0.6], [0.5, -0.55], [0.8, -0.3], [0.85, -0.1], [0.55, -0.15], [0, -0.3]], { color: C.dbrown, seg: 14 }),
    ...Array.from({ length: 34 }, (_, i) => { const a = i * 0.37, r = 0.74 + 0.1 * Math.sin(i * 2.3), y = -0.28 + 0.1 * Math.sin(i * 1.7) + 0.07 * (i % 3); return at(box(0.55, 0.05, 0.05, i % 2 ? C.brown : C.tan), Math.cos(a) * r, y, Math.sin(a) * r, { ry: -a + (i % 2 ? 0.6 : -0.6), rz: 0.2 * Math.sin(i) }); }).flat(),
    ...[[0.18, -0.12, 0.0], [-0.22, -0.14, 0.15], [0.02, -0.1, -0.25]].flatMap(([x, y, z]) => at(ball(0.2, [190, 224, 230], { sc: [0.8, 1.1, 0.8] }), x, y, z, { rz: x * 0.6 }))
  ],
  'Sea shell': () => {
    const H = [0, -0.9, 0.1], N = 8, R = 1.75, P = (a, z) => [Math.sin(a) * R * 0.78, -0.9 + Math.cos(a) * R * 0.78, z], out = [];
    const a0 = -0.95, da = 1.9 / (N * 2);
    for (let i = 0; i < N * 2; i++) {
      const ca = a0 + i * da, cb = ca + da, za = i % 2 ? 0.42 : 0.08, zb = i % 2 ? 0.08 : 0.42, col = i % 4 < 2 ? [246, 178, 170] : [252, 220, 196];
      out.push({ pts: [H, P(ca, za), P(cb, zb)], color: col, spec: 0.5 }, { pts: [[0, -0.9, -0.1], P(cb, -zb), P(ca, -za)], color: [220, 150, 150], spec: 0.3 });
      out.push({ pts: [P(ca, za), P(cb, zb), P(cb, -zb), P(ca, -za)], color: [232, 160, 150], spec: 0.3 });
    }
    out.push(...at(ball(0.22, C.cream, { sc: [1.3, 0.8, 0.8] }), 0, -0.88, 0));
    return out;
  },
  'Basket': () => [
    ...lathe([[0, -0.85], [0.7, -0.85], [0.77, -0.6], [0.84, -0.35], [0.9, -0.1], [0.97, 0.15]], { seg: 16, paint: (k, i) => ((k + i) % 2 ? [196, 146, 84] : [160, 112, 60]), spec: 0.1 }),
    ...lathe([[1.03, 0.15], [1.03, 0.28], [0.97, 0.28]], { seg: 16, color: [140, 96, 52] }),
    ...at(extrude(arcPoly(0.86, 0.98, 0, Math.PI, 14), 0.12, [150, 104, 56]), 0, 0.28, 0),
    ...lathe([[0, 0.2], [0.9, 0.2]], { color: C.dgreen, seg: 16, bias: -0.1 }),
    ...[[0.35, 0.4, 0.15, C.red], [-0.35, 0.4, 0.2, C.red], [0.05, 0.45, -0.35, C.lgreen], [-0.1, 0.5, 0.4, C.orange], [0.45, 0.4, -0.3, C.red]].flatMap(([x, y, z, c]) => at(ball(0.27, c), x, y, z))
  ],
  'School bag': () => [
    ...at(box(1.3, 1.6, 0.75, C.blue), 0, 0, 0), ...at(box(1.1, 0.7, 0.3, [90, 164, 236]), 0, -0.4, 0.5), ...at(box(0.9, 0.04, 0.04, C.yellow, { bias: 0.1 }), 0, -0.07, 0.66),
    ...at(box(1.34, 0.25, 0.8, C.dblue), 0, 0.72, 0), ...at(box(0.14, 0.2, 0.06, C.yellow), 0, -0.2, 0.67), ...at(box(0.16, 1.2, 0.08, C.dblue), -0.35, 0.05, -0.4), ...at(box(0.16, 1.2, 0.08, C.dblue), 0.35, 0.05, -0.4),
    ...at(extrude(arcPoly(0.3, 0.38, 0, Math.PI, 8), 0.08, C.gray), 0, 0.82, 0)
  ],
  // ---- Linggo ng Wika ----
  'Basura': () => [
    ...lathe([[0, -1], [0.5, -1], [0.66, 0.55], [0, 0.55]], { seg: 14, paint: (k, i) => (i % 2 ? [92, 156, 120] : [80, 140, 108]), spec: 0.2 }),
    ...lathe([[0, 0.56], [0.74, 0.56], [0.72, 0.68], [0.24, 0.72], [0.22, 0.82], [0, 0.82]], { color: [66, 120, 92], seg: 14 }),
    ...at(ball(0.12, C.gray), 0, 0.88, 0), ...at(box(0.6, 0.03, 0.03, C.white, { bias: 0.1 }), 0, -0.1, 0.64), ...at(ball(0.1, C.red), 0.45, 0.65, 0.3)
  ],
  'Kalikasan': () => [
    ...lathe([[0, 0], [0.8, 0], [0.7, 0.16], [0.4, 0.3], [0, 0.32]], { color: C.soil, bias: -0.3 }).map((f) => ({ ...f, pts: f.pts.map(([x, y, z]) => [x, y - 1, z]) })),
    ...at(cyl(0.05, 1.7, C.green), 0, -0.2, 0),
    ...[0, 1, 2, 3, 4].flatMap((k) => at(leafGroup(0.7 - k * 0.05, 0.3, k % 2 ? C.lgreen : C.green), 0, -0.7 + k * 0.3, 0, { rz: 0.7 + (k % 2) * 0.4, ry: k * 2.2 })),
    ...at(leafGroup(0.6, 0.26, C.lgreen), 0, 0.62, 0, { rz: 1.3 })
  ],
  'Malinis': () => [
    ...at(box(1.5, 0.55, 0.95, C.pink, { spec: 0.5 }), 0, -0.55, 0), ...at(box(1.2, 0.08, 0.7, [255, 190, 210], { spec: 0.6 }), 0, -0.24, 0),
    ...[[-0.4, 0.2, 0.2, 0.34], [0.35, 0.5, -0.1, 0.26], [0.0, 0.05, 0.1, 0.22], [0.6, -0.05, 0.3, 0.16], [-0.7, 0.55, -0.1, 0.18], [0.1, 0.8, 0.0, 0.14]].flatMap(([x, y, z, r]) => at(ball(r, C.lblue, { alpha: 0.6, spec: 0.9 }), x, y, z)),
    ...[[-0.4, 0.28, 0.4], [0.35, 0.56, 0.1]].flatMap(([x, y, z]) => at(ball(0.07, C.white, { sc: [1.5, 0.6, 0.5] }), x - 0.05, y + 0.06, z))
  ],
  'Muling gamitin': () => [0, 1].flatMap((k) => {
    const a0 = 0.35, a1 = 2.6, head = [[Math.cos(a1) * 1.15, Math.sin(a1) * 1.15], [Math.cos(a1 + 0.5) * 0.79, Math.sin(a1 + 0.5) * 0.79], [Math.cos(a1) * 0.43, Math.sin(a1) * 0.43]];
    const outer = arcPoly(0.62, 0.95, a0, a1, 10), cut = outer.length / 2;
    return xf(extrude([...outer.slice(0, cut), ...head, ...outer.slice(cut)], 0.26, k ? C.lblue : C.blue, { side: C.dblue, spec: 0.4 }), { rz: k * Math.PI });
  }),
  'Bayanihan': () => [
    ...[[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]].flatMap(([x, z]) => at(cyl(0.07, 0.8, C.dbrown), x, -0.7, z)),
    ...at(box(1.55, 0.1, 1.55, C.brown), 0, -0.3, 0), ...at(box(1.3, 0.8, 1.3, C.tan), 0, 0.15, 0), ...at(box(0.4, 0.55, 0.05, C.dbrown), 0, 0.02, 0.66), ...at(box(0.3, 0.3, 0.05, C.dbrown), -0.4, 0.3, 0.66),
    ...lathe([[1.25, 0.55], [0, 1.4]], { seg: 4, off: Math.PI / 4, paint: (k, i) => (i % 2 ? C.sand : [214, 178, 90]), spec: 0.1 }),
    ...at(box(0.08, 0.9, 0.05, C.brown), 0.2, -0.75, 0.9, { rx: -0.35 }), ...at(box(0.08, 0.9, 0.05, C.brown), -0.2, -0.75, 0.9, { rx: -0.35 })
  ],
  'Tubig': () => [
    ...at(box(0.4, 1.9, 0.3, C.gray), -0.95, 0, 0),     ...xf(cyl(0.16, 1.4, C.silver, { spec: 0.8 }), { rz: Math.PI / 2, t: [-0.2, 0.55, 0] }),
    ...at(cyl(0.17, 0.5, C.silver, { spec: 0.8 }), 0.5, 0.32, 0), ...at(cyl(0.06, 0.3, C.silver), 0, 0.9, 0), ...at(box(0.7, 0.1, 0.12, C.red), 0, 1.07, 0),
    ...at(ball(0.13, C.blue, { sc: [0.7, 1.2, 0.7], spec: 0.9 }), 0.5, -0.2, 0), ...at(ball(0.1, C.blue, { sc: [0.7, 1.2, 0.7], spec: 0.9 }), 0.5, -0.65, 0),
    ...lathe([[0.2, -1.05], [0.65, -1.05]], { color: C.lblue, caps: false, seg: 16, bias: -0.2 }).map((f) => ({ ...f, pts: f.pts.map(([x, y, z]) => [x + 0.5, y, z]) }))
  ],
  'Pag-asa': () => [
    ...lathe([[0, -0.5], [1.15, -0.5]], { color: [60, 130, 200], seg: 20, bias: -0.3, spec: 0.5 }), ...lathe([[0.3, -0.49], [0.7, -0.49]], { color: [250, 210, 120], caps: false, seg: 20, bias: -0.2 }),
    ...Array.from({ length: 9 }, (_, k) => at(xf(extrude([[-0.1, 0.8], [0.1, 0.8], [0, 1.1]], 0.1, k % 2 ? C.orange : C.yellow), { rz: (k - 4) * (Math.PI / 8) }), 0, -0.5, 0)).flat(),
    ...at(dome(0.75, 0.75, [255, 168, 60], { seg: 18, spec: 0.5 }), 0, -0.5, 0.05),
    ...at(cone(0.5, 0.75, [48, 110, 76]), -0.85, -0.5, 0.2), ...at(cone(0.4, 0.55, [40, 96, 66]), 0.85, -0.5, 0.1)
  ],
  'Wika champion': () => [
    ...at(extrude([[-0.3, 0.55], [0.05, 0.55], [-0.3, 1.5], [-0.65, 1.5]], 0.08, C.red), 0, 0, -0.06), ...at(extrude([[0.3, 0.55], [-0.05, 0.55], [0.3, 1.5], [0.65, 1.5]], 0.08, C.blue), 0, 0, -0.06),
    ...xf(cyl(0.72, 0.16, C.gold, { spec: 0.7, seg: 22 }), { rx: Math.PI / 2, t: [0, -0.1, 0] }), ...xf(cyl(0.54, 0.2, [250, 218, 100], { spec: 0.7, seg: 22 }), { rx: Math.PI / 2, t: [0, -0.1, 0] }),
    ...at(extrude(starPoly(0.4, 0.17), 0.22, C.red, { spec: 0.5, bias: 0.3 }), 0, -0.1, 0)
  ],
  // ---- Christmas week ----
  'Cloth wrap': () => [
    ...at(box(1.3, 1.0, 1.3, C.red, { spec: 0.3 }), 0, -0.4, 0), ...at(box(1.36, 1.04, 0.24, C.white), 0, -0.4, 0), ...at(box(0.24, 1.04, 1.36, C.white), 0, -0.4, 0),
    ...at(ball(0.2, C.white), 0, 0.2, 0), ...at(ball(0.34, C.red, { sc: [1.1, 0.7, 0.6] }), -0.3, 0.3, 0, { rz: 0.5 }), ...at(ball(0.34, C.red, { sc: [1.1, 0.7, 0.6] }), 0.3, 0.3, 0, { rz: -0.5 }),
    ...at(extrude([[-0.1, 0], [0.1, 0], [0.16, -0.5], [0, -0.38], [-0.16, -0.5]], 0.05, C.white), 0.1, 0.1, 0.68)
  ],
  'Parol': () => {
    const outer = starPoly(1, 0.5), T = 0.55, out = [];
    const front = starPoly(0.82, 0.4).map(([x, y]) => [x, y, T]), mid = outer.map(([x, y]) => [x, y, T * 0.4]), back = outer.map(([x, y]) => [x, y, -T * 0.4]), bf = starPoly(0.82, 0.4).map(([x, y]) => [x, y, -T]);
    out.push({ pts: front, color: C.yellow, spec: 0.7 }, { pts: bf.slice().reverse(), color: C.yellow, spec: 0.7 });
    for (let i = 0; i < 10; i++) {
      const j = (i + 1) % 10, col = Math.floor(i / 2) % 2 ? C.red : [236, 150, 40];
      out.push({ pts: [front[i], front[j], mid[j], mid[i]], color: col, spec: 0.5 }, { pts: [bf[j], bf[i], back[i], back[j]], color: col, spec: 0.5 }, { pts: [mid[i], mid[j], back[j], back[i]], color: [180, 60, 40], spec: 0.3 });
    }
    return [...out, ...at(ball(0.1, C.gold), 0, 1.08, 0), ...[-0.5, 0, 0.5].flatMap((x) => at(cone(0.09, -0.6, C.yellow), x, -1.0, 0.0).concat(at(ball(0.07, C.red), x, -1.62, 0)))];
  },
  'Market bag': () => [
    ...lathe([[0, -0.9], [0.8, -0.9], [1.0, 0.45], [0, 0.45]], { seg: 4, off: Math.PI / 4, paint: (k, i) => (i % 2 ? C.green : C.lgreen), spec: 0.2 }).map((f) => ({ ...f, pts: f.pts.map(([x, y, z]) => [x * 0.85, y, z * 0.55]) })),
    ...[0.3, -0.3].flatMap((z) => at(extrude(arcPoly(0.38, 0.5, 0, Math.PI, 10), 0.08, C.dgreen), 0, 0.45, z * 0.95)),
    ...at(cone(0.13, -0.6, C.orange), 0.3, 0.8, 0.1), ...at(ball(0.3, C.dgreen, { sc: [1, 0.8, 1] }), -0.2, 0.65, 0), ...at(ball(0.2, C.red), 0.05, 0.6, 0.15)
  ],
  'Noche Buena plate': () => [
    ...lathe([[0, -0.52], [0.55, -0.52], [0.98, -0.4], [1.04, -0.34], [0.98, -0.33], [0.6, -0.45], [0, -0.45]], { color: C.white, spec: 0.7, seg: 20 }),
    ...at(ball(0.5, [200, 110, 90], { sc: [1.1, 0.7, 0.85] }), -0.15, -0.15, 0), ...at(extrude([[-0.12, -0.3], [0.12, -0.3], [0.1, 0.3], [-0.1, 0.3]], 0.05, C.cream), 0.55, -0.34, 0.2, { rx: -Math.PI / 2 }),
    ...[[0.4, -0.3, -0.35, C.lgreen], [0.55, -0.3, 0.0, C.red], [-0.6, -0.3, 0.35, C.lgreen], [0.0, -0.3, 0.5, C.red]].flatMap(([x, y, z, c]) => at(ball(0.18, c), x, y, z)),
    ...at(ball(0.12, C.yellow, { sc: [1, 1, 1] }), -0.2, 0.1, 0.1), ...at(box(0.1, 1.2, 0.04, C.silver, { spec: 0.8 }), -1.28, -0.4, 0, { rx: -Math.PI / 2, ry: 0.1 }), ...at(box(0.1, 1.2, 0.04, C.silver, { spec: 0.8 }), 1.28, -0.4, 0, { rx: -Math.PI / 2 })
  ],
  'Ribbon': () => [
    ...at(extrude(leafPoly(1.0, 0.5), 0.14, C.pink, { spec: 0.5, side: C.dred }), 0, 0.15, 0, { rz: 0.5 }), ...at(extrude(leafPoly(1.0, 0.5), 0.14, C.pink, { spec: 0.5, side: C.dred }), 0, 0.15, 0, { rz: Math.PI - 0.5 }),
    ...at(extrude(leafPoly(0.7, 0.28), 0.1, [250, 190, 210], { bias: 0.05 }), 0, 0.15, 0.06, { rz: 0.5 }), ...at(extrude(leafPoly(0.7, 0.28), 0.1, [250, 190, 210], { bias: 0.05 }), 0, 0.15, 0.06, { rz: Math.PI - 0.5 }),
    ...at(extrude([[-0.14, 0], [0.14, 0], [0.34, -0.95], [0.1, -0.75], [-0.1, -0.95]], 0.08, C.dred, { spec: 0.4 }), -0.2, 0.1, -0.04, { rz: 0.15 }), ...at(extrude([[-0.14, 0], [0.14, 0], [0.1, -0.95], [-0.1, -0.75], [-0.34, -0.95]], 0.08, C.dred, { spec: 0.4 }), 0.2, 0.1, -0.04, { rz: -0.15 }),
    ...at(ball(0.2, C.red, { sc: [1, 1.1, 0.9] }), 0, 0.15, 0.1)
  ],
  'Real spoon': () => [
    ...at(box(0.16, 1.2, 0.05, C.silver, { spec: 0.8 }), 0, -0.55, 0), ...at(ball(0.13, C.silver, { sc: [1.3, 1, 0.4], spec: 0.8 }), 0, -1.15, 0),
    ...at(ball(0.5, C.silver, { sc: [0.8, 1.15, 0.3], spec: 0.85 }), 0, 0.6, 0), ...at(ball(0.4, [150, 156, 166], { sc: [0.75, 1.1, 0.2], spec: 0.5, bias: 0.1 }), 0, 0.6, 0.07)
  ],
  'Gift of time': () => [
    ...at(cyl(0.7, 0.12, C.brown, { seg: 14 }), 0, -1.05, 0), ...at(cyl(0.7, 0.12, C.brown, { seg: 14 }), 0, 1.05, 0),
    ...ring(4, 0.6, 0, Math.PI / 4).flatMap(([x, , z]) => at(cyl(0.05, 2.05, C.dbrown), x, 0, z)),
    ...lathe([[0.55, 0.98], [0.5, 0.7], [0.3, 0.3], [0.06, 0.04], [0.3, -0.3], [0.5, -0.7], [0.55, -0.98]], { color: C.lblue, alpha: 0.35, spec: 0.9, seg: 14, caps: false }),
    ...lathe([[0.02, 0.1], [0.22, 0.34], [0.34, 0.5], [0.4, 0.62], [0, 0.62]], { color: C.sand, seg: 12 }),
    ...lathe([[0.05, -0.9], [0.46, -0.9], [0.4, -0.7], [0.2, -0.5], [0.02, -0.04]], { color: C.sand, seg: 12 }), ...at(cyl(0.025, 0.7, C.sand), 0, -0.25, 0)
  ],
  'Christmas star': () => {
    const T = 0.34, outer = starPoly(1.05, 0.46), front = starPoly(0.84, 0.37).map(([x, y]) => [x, y, T]), mid = outer.map(([x, y]) => [x, y, T * 0.55]), back = outer.map(([x, y]) => [x, y, -T * 0.55]), bf = starPoly(0.84, 0.37).map(([x, y]) => [x, y, -T]), out = [];
    out.push({ pts: front, color: [255, 236, 130], spec: 0.8 }, { pts: bf.slice().reverse(), color: [255, 236, 130], spec: 0.8 });
    for (let i = 0; i < 10; i++) { const j = (i + 1) % 10; out.push({ pts: [front[i], front[j], mid[j], mid[i]], color: C.gold, spec: 0.6 }, { pts: [bf[j], bf[i], back[i], back[j]], color: C.gold, spec: 0.6 }, { pts: [mid[i], mid[j], back[j], back[i]], color: [196, 140, 20], spec: 0.3 }); }
    return [...out, ...starPoly(1.05, 0.46).filter((_, i) => i % 2 === 0).flatMap(([x, y]) => at(ball(0.09, C.red), x * 0.96, y * 0.96, 0.34))];
  }
};
