// ─── State ───────────────────────────────────────────────────────────────────
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
let pointSets    = {};
let selected     = [];
let letterPos    = {};
let dotPos       = { x: 0.5, y: 0.5 };
let interpMethod = 'linear';
let dragging     = null;
let numPts       = 200;
let dotSize      = 3;
let numStrokes   = 1;
let strokeSpacing = 0.034; // fraction of sc between copies
let showLines    = false;
let redrawSketch = () => {};

// ─── Auto-placement presets ──────────────────────────────────────────────────
const AUTO_POS = [
  [],
  [[.5,.5]],
  [[.1,.5],[.9,.5]],
  [[.1,.15],[.9,.15],[.5,.85]],
  [[.1,.1],[.9,.1],[.1,.9],[.9,.9]],
  [[.1,.1],[.9,.1],[.5,.5],[.1,.9],[.9,.9]],
  [[.1,.1],[.5,.1],[.9,.1],[.1,.9],[.5,.9],[.9,.9]],
  [[.1,.1],[.5,.1],[.9,.1],[.1,.5],[.9,.5],[.1,.9],[.9,.9]],
  [[.1,.1],[.5,.1],[.9,.1],[.1,.5],[.9,.5],[.1,.9],[.5,.9],[.9,.9]],
  [[.1,.1],[.5,.1],[.9,.1],[.1,.5],[.5,.5],[.9,.5],[.1,.9],[.5,.9],[.9,.9]],
];

function autoArrange() {
  const n = Math.min(selected.length, AUTO_POS.length - 1);
  AUTO_POS[n].forEach(([x, y], i) => { letterPos[selected[i]] = { x, y }; });
}

// ─── Hershey stroke data (A–Z + 0–9 + symbols) ───────────────────────────────
const HERSHEY = {
  'A': [[[-5,0],[0,21],[5,0]],[[-3,10],[3,10]]],
  'B': [[[-5,21],[-5,0]],[[-5,21],[0,21],[3,19],[4,17],[4,15],[3,13],[0,12],[-5,12]],[[-5,12],[1,12],[4,9],[5,7],[5,4],[4,2],[1,0],[-5,0]]],
  'C': [[[6,17],[4,20],[1,21],[-2,21],[-5,18],[-6,15],[-6,6],[-5,3],[-2,0],[1,0],[4,2],[6,5]]],
  'D': [[[-5,21],[-5,0]],[[-5,21],[0,21],[3,19],[5,16],[6,12],[6,9],[5,5],[3,2],[0,0],[-5,0]]],
  'E': [[[-5,21],[-5,0]],[[-5,21],[5,21]],[[-5,12],[2,12]],[[-5,0],[5,0]]],
  'F': [[[-5,21],[-5,0]],[[-5,21],[5,21]],[[-5,12],[2,12]]],
  'G': [[[6,17],[4,20],[1,21],[-2,21],[-5,18],[-6,15],[-6,6],[-5,3],[-2,0],[1,0],[4,2],[6,5],[6,12],[2,12]]],
  'H': [[[-5,21],[-5,0]],[[5,21],[5,0]],[[-5,11],[5,11]]],
  'I': [[[0,21],[0,0]],[[-3,21],[3,21]],[[-3,0],[3,0]]],
  'J': [[[2,21],[2,4],[1,1],[-1,0],[-3,0],[-5,1],[-5,4]]],
  'K': [[[-5,21],[-5,0]],[[5,21],[-5,9]],[[-2,13],[5,0]]],
  'L': [[[-5,21],[-5,0],[5,0]]],
  'M': [[[-6,0],[-6,21],[0,9],[6,21],[6,0]]],
  'N': [[[-5,0],[-5,21],[5,0],[5,21]]],
  'O': [[[-1,21],[-4,20],[-6,17],[-6,4],[-4,1],[-1,0],[1,0],[4,1],[6,4],[6,17],[4,20],[1,21],[-1,21]]],
  'P': [[[-5,21],[-5,0]],[[-5,21],[0,21],[3,19],[4,17],[4,14],[3,12],[0,11],[-5,11]]],
  'Q': [[[-1,21],[-4,20],[-6,17],[-6,4],[-4,1],[-1,0],[1,0],[4,1],[6,4],[6,17],[4,20],[1,21],[-1,21]],[[2,5],[6,0]]],
  'R': [[[-5,21],[-5,0]],[[-5,21],[0,21],[3,19],[4,17],[4,14],[3,12],[0,11],[-5,11]],[[0,11],[5,0]]],
  'S': [[[6,17],[4,20],[1,21],[-2,21],[-5,18],[-5,15],[-2,12],[3,9],[6,6],[6,3],[3,0],[-1,0],[-4,1],[-6,4]]],
  'T': [[[0,21],[0,0]],[[-6,21],[6,21]]],
  'U': [[[-5,21],[-5,4],[-4,1],[-1,0],[1,0],[4,1],[5,4],[5,21]]],
  'V': [[[-6,21],[0,0],[6,21]]],
  'W': [[[-8,21],[-5,0],[0,10],[5,0],[8,21]]],
  'X': [[[-5,21],[5,0]],[[5,21],[-5,0]]],
  'Y': [[[-6,21],[0,11]],[[6,21],[0,11],[0,0]]],
  'Z': [[[-6,21],[6,21],[-6,0],[6,0]]],
  // Digits
  ' ': [],
  '0': [[[-3,0],[-4,4],[-4,17],[-3,21],[3,21],[4,17],[4,4],[3,0],[-3,0]]],
  '1': [[[-2,18],[0,21],[0,0]],[[-3,0],[3,0]]],
  '2': [[[-4,16],[-3,21],[3,21],[4,17],[4,13],[-4,4],[-4,0],[4,0]]],
  '3': [[[-4,21],[4,21],[4,14],[0,12]],[[0,10],[4,8],[4,3],[3,0],[-4,0]]],
  '4': [[[3,21],[3,0]],[[-4,8],[4,8]],[[-4,21],[-4,8]]],
  '5': [[[4,21],[-4,21],[-4,12],[2,12],[4,9],[4,3],[3,0],[-4,0]]],
  '6': [[[3,21],[-3,21],[-4,17],[-4,3],[-3,0],[3,0],[4,3],[4,10],[3,12],[-4,12]]],
  '7': [[[-4,21],[4,21],[0,0]]],
  '8': [
    [[-3,12],[3,12],[4,9],[4,3],[3,0],[-3,0],[-4,3],[-4,9],[-3,12]],
    [[-3,12],[3,12],[4,15],[4,18],[3,21],[-3,21],[-4,18],[-4,15],[-3,12]]
  ],
  '9': [
    [[-3,9],[-4,12],[-4,18],[-3,21],[3,21],[4,18],[4,12],[3,9],[-3,9]],
    [[3,9],[4,3],[3,0],[-2,0]]
  ],
  '-': [[[-3,10],[3,10]]],
  '.': [[[-1,2],[1,2],[1,0],[-1,0],[-1,2]]],
};

// ─── Sampling ─────────────────────────────────────────────────────────────────
function sampleStroke(pts, n) {
  if (n <= 1) return [{ ...pts[0] }];
  const segs = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i+1].x - pts[i].x, dy = pts[i+1].y - pts[i].y;
    const len = Math.sqrt(dx*dx + dy*dy);
    segs.push(len); total += len;
  }
  if (total < 1e-6) return Array(n).fill({ ...pts[0] });
  const result = [];
  let acc = 0, si = 0;
  for (let i = 0; i < n; i++) {
    const target = (i / (n - 1)) * total;
    while (si < segs.length - 1 && acc + segs[si] < target) { acc += segs[si]; si++; }
    const t = segs[si] > 1e-6 ? Math.min((target - acc) / segs[si], 1) : 0;
    result.push({
      x: pts[si].x + (pts[si+1].x - pts[si].x) * t,
      y: pts[si].y + (pts[si+1].y - pts[si].y) * t,
    });
  }
  return result;
}

function sampleGlyph(char, n) {
  const raw = HERSHEY[char.toUpperCase()];
  if (!raw || !raw.length) return Array(n).fill({ x: 0, y: 0 });
  const polylines = raw.map(s => s.map(([x, y]) => ({ x, y })));
  const lengths = polylines.map(pl => {
    let len = 0;
    for (let i = 0; i < pl.length - 1; i++) {
      const dx = pl[i+1].x - pl[i].x, dy = pl[i+1].y - pl[i].y;
      len += Math.sqrt(dx*dx + dy*dy);
    }
    return len;
  });
  const total = lengths.reduce((a, b) => a + b, 0);
  if (total < 1e-6) return Array(n).fill({ x: 0, y: 0 });
  let pts = [];
  for (let si = 0; si < polylines.length; si++) {
    pts = pts.concat(sampleStroke(polylines[si], Math.max(2, Math.round(n * lengths[si] / total))));
  }
  while (pts.length < n) pts.push({ ...pts[pts.length - 1] });
  pts = pts.slice(0, n);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
  }
  const cX = (minX + maxX) / 2, cY = (minY + maxY) / 2;
  const scale = Math.max(maxX - minX, maxY - minY, 1);
  return pts.map(p => ({ x: (p.x - cX) / scale, y: (p.y - cY) / scale }));
}

// ─── Interpolation helpers ────────────────────────────────────────────────────
function weightedBlend(anchors, weights, n) {
  const sumW = weights.reduce((s, w) => s + w, 0);
  return Array.from({ length: n }, (_, i) => ({
    x: anchors.reduce((s, a, ai) => s + a.pts[i].x * weights[ai], 0) / sumW,
    y: anchors.reduce((s, a, ai) => s + a.pts[i].y * weights[ai], 0) / sumW,
  }));
}

function idwBlend(anchors, dx, dy, n, power) {
  const dists = anchors.map(a => Math.hypot(a.pos.x - dx, a.pos.y - dy));
  const minD  = Math.min(...dists);
  if (minD < 0.006) return anchors[dists.indexOf(minD)].pts;
  return weightedBlend(anchors, dists.map(d => 1 / Math.pow(d, power)), n);
}

function smoothBlend(anchors, dx, dy, n) {
  const dists = anchors.map(a => Math.hypot(a.pos.x - dx, a.pos.y - dy));
  const maxD  = Math.max(...dists, 1e-6);
  const ws    = dists.map(d => { const u = 1 - d / maxD; return u * u * (3 - 2 * u); });
  const sumW  = ws.reduce((s, w) => s + w, 0);
  if (sumW < 1e-10) return anchors[0].pts;
  return weightedBlend(anchors, ws, n);
}

function gaussianBlend(anchors, dx, dy, n) {
  const sigma = 0.38;
  const ws = anchors.map(a => {
    const d2 = (a.pos.x - dx) ** 2 + (a.pos.y - dy) ** 2;
    return Math.exp(-d2 / (2 * sigma * sigma));
  });
  const sumW = ws.reduce((s, w) => s + w, 0);
  if (sumW < 1e-10) return idwBlend(anchors, dx, dy, n, 2);
  return weightedBlend(anchors, ws, n);
}

function logBlend(anchors, dx, dy, n) {
  const dists = anchors.map(a => Math.hypot(a.pos.x - dx, a.pos.y - dy));
  const minD  = Math.min(...dists);
  if (minD < 0.006) return anchors[dists.indexOf(minD)].pts;
  const ws   = dists.map(d => Math.max(0, -Math.log(Math.min(d, 1))));
  const sumW = ws.reduce((s, w) => s + w, 0);
  if (sumW < 1e-10) return idwBlend(anchors, dx, dy, n, 1);
  return weightedBlend(anchors, ws, n);
}

// ─── Extrapolation helpers ────────────────────────────────────────────────────
// Gaussian elimination for 3×3 system M·x = b
function solve3x3(M, b) {
  const A = M.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < 3; col++) {
    let maxR = col;
    for (let r = col + 1; r < 3; r++) if (Math.abs(A[r][col]) > Math.abs(A[maxR][col])) maxR = r;
    [A[col], A[maxR]] = [A[maxR], A[col]];
    if (Math.abs(A[col][col]) < 1e-12) return null;
    for (let r = 0; r < 3; r++) {
      if (r === col) continue;
      const f = A[r][col] / A[col][col];
      for (let c = col; c <= 3; c++) A[r][c] -= f * A[col][c];
    }
  }
  return [A[0][3] / A[0][0], A[1][3] / A[1][1], A[2][3] / A[2][2]];
}

// Unclamped weights that sum to 1 and reconstruct dotPos linearly.
// Negative weights are allowed — that's the extrapolation.
function computeExtrapWeights(anchors, dx, dy) {
  const m = anchors.length;
  if (m === 1) return [1];
  if (m === 2) {
    const a = anchors[0].pos, b = anchors[1].pos;
    const abx = b.x - a.x, aby = b.y - a.y;
    const len2 = abx * abx + aby * aby;
    if (len2 < 1e-10) return [0.5, 0.5];
    const t = ((dx - a.x) * abx + (dy - a.y) * aby) / len2;
    return [1 - t, t];
  }
  // 3+ anchors: minimum-norm least-squares via pseudoinverse A^T(AA^T)^{-1}b
  const xs = anchors.map(a => a.pos.x);
  const ys = anchors.map(a => a.pos.y);
  const sX = xs.reduce((s, x) => s + x, 0),    sY = ys.reduce((s, y) => s + y, 0);
  const sX2 = xs.reduce((s, x) => s + x * x, 0), sY2 = ys.reduce((s, y) => s + y * y, 0);
  const sXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
  const AAT = [[m, sX, sY], [sX, sX2, sXY], [sY, sXY, sY2]];
  const lam = solve3x3(AAT, [1, dx, dy]);
  if (!lam) return anchors.map(() => 1 / m);
  return anchors.map((_, i) => lam[0] + lam[1] * xs[i] + lam[2] * ys[i]);
}

// amp=1 → raw linear extrapolation; amp>1 → amplify deviation from uniform
function extrapBlend(anchors, dx, dy, n, amp) {
  const base = computeExtrapWeights(anchors, dx, dy);
  const mean = 1 / anchors.length;
  const weights = base.map(w => mean + amp * (w - mean));
  return Array.from({ length: n }, (_, i) => ({
    x: anchors.reduce((s, a, ai) => s + a.pts[i].x * weights[ai], 0),
    y: anchors.reduce((s, a, ai) => s + a.pts[i].y * weights[ai], 0),
  }));
}

function projectT() {
  const a = letterPos[selected[0]], b = letterPos[selected[selected.length - 1]];
  const abx = b.x - a.x, aby = b.y - a.y;
  const len2 = abx * abx + aby * aby;
  if (len2 < 1e-10) return 0.5;
  return Math.max(0, Math.min(1, ((dotPos.x - a.x) * abx + (dotPos.y - a.y) * aby) / len2));
}

function catmullRomPt(t, sets, i) {
  const n   = sets.length;
  const seg = Math.min(Math.floor(t * (n - 1)), n - 2);
  const lt  = t * (n - 1) - seg;
  const t2  = lt * lt, t3 = lt * t2;
  const s0 = sets[Math.max(0, seg - 1)];
  const s1 = sets[seg], s2 = sets[seg + 1];
  const s3 = sets[Math.min(n - 1, seg + 2)];
  const m1x = (s2[i].x - s0[i].x) * 0.5, m1y = (s2[i].y - s0[i].y) * 0.5;
  const m2x = (s3[i].x - s1[i].x) * 0.5, m2y = (s3[i].y - s1[i].y) * 0.5;
  const h00 = 2*t3 - 3*t2 + 1, h10 = t3 - 2*t2 + lt, h01 = -2*t3 + 3*t2, h11 = t3 - t2;
  return {
    x: h00*s1[i].x + h10*m1x + h01*s2[i].x + h11*m2x,
    y: h00*s1[i].y + h10*m1y + h01*s2[i].y + h11*m2y,
  };
}

function lagrangePt(t, sets, i) {
  const n = sets.length;
  let x = 0, y = 0;
  for (let k = 0; k < n; k++) {
    let L = 1;
    for (let j = 0; j < n; j++) {
      if (j !== k) L *= (t - j / (n - 1)) / ((k - j) / (n - 1));
    }
    x += L * sets[k][i].x;
    y += L * sets[k][i].y;
  }
  return { x, y };
}

function getInterpolated() {
  if (!selected.length) return [];
  const sets    = selected.map(l => pointSets[l]);
  const anchors = selected.map(l => ({ pts: pointSets[l], pos: letterPos[l] || { x: .5, y: .5 } }));
  const n       = sets[0].length;
  const dx      = dotPos.x, dy = dotPos.y;
  if (selected.length === 1) return sets[0];
  switch (interpMethod) {
    case 'nearest': {
      let ni = 0, minD = Infinity;
      anchors.forEach((a, i) => { const d = Math.hypot(a.pos.x-dx, a.pos.y-dy); if (d<minD){minD=d;ni=i;} });
      return sets[ni];
    }
    case 'linear':   return idwBlend(anchors, dx, dy, n, 1);
    case 'smooth':   return smoothBlend(anchors, dx, dy, n);
    case 'log':      return logBlend(anchors, dx, dy, n);
    case 'idw':      return idwBlend(anchors, dx, dy, n, 2);
    case 'cubic':    return idwBlend(anchors, dx, dy, n, 3);
    case 'gaussian': return gaussianBlend(anchors, dx, dy, n);
    case 'spline':   { const t = projectT(); return Array.from({length:n}, (_,i) => catmullRomPt(t, sets, i)); }
    case 'poly':     { const t = projectT(); return Array.from({length:n}, (_,i) => lagrangePt(t, sets, i)); }
    case 'extrap':   return extrapBlend(anchors, dx, dy, n, 1);
    case 'extrap2':  return extrapBlend(anchors, dx, dy, n, 2);
    case 'extrap4':  return extrapBlend(anchors, dx, dy, n, 4);
    case 'extrap8':  return extrapBlend(anchors, dx, dy, n, 8);
    default:         return idwBlend(anchors, dx, dy, n, 1);
  }
}

// ─── Hershey text utilities ───────────────────────────────────────────────────

// Returns { minX, maxX } for a character's stroke data, or null for space/unknown
function _charExtent(ch) {
  const raw = HERSHEY[ch.toUpperCase()];
  if (!raw || !raw.length) return null;
  let minX = Infinity, maxX = -Infinity;
  for (const stroke of raw) {
    for (const [px] of stroke) {
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
    }
  }
  return isFinite(minX) ? { minX, maxX } : null;
}

// Generate an inline SVG string for the given text at pixelH height.
// Uses stroke="currentColor" so CSS color property drives the stroke.
// y=0 is cap height, y=pixelH is baseline in the SVG coordinate space.
function hersheyTextSVG(text, pixelH) {
  const scale = pixelH / 21;
  const sw    = Math.max(1, pixelH / 14);
  const str   = text.toUpperCase();
  const parts = [];
  let cx      = 0;

  for (const ch of str) {
    if (ch === ' ') { cx += 7 * scale; continue; }
    const ext = _charExtent(ch);
    if (!ext) { cx += 7 * scale; continue; }
    const { minX, maxX } = ext;
    const ox  = -minX;
    const raw = HERSHEY[ch.toUpperCase()];
    for (const stroke of raw) {
      if (stroke.length < 2) continue;
      const pts = stroke.map(([px, py]) =>
        `${(cx + (px + ox) * scale).toFixed(2)},${((21 - py) * scale).toFixed(2)}`
      ).join(' ');
      parts.push(`<polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="${sw.toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`);
    }
    cx += (maxX - minX + 3) * scale;
  }

  const w = Math.max(cx, 1);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w.toFixed(1)}" height="${pixelH}" style="display:block;overflow:visible">${parts.join('')}</svg>`;
}

// Draw Hershey text on a p5 canvas.
// (x, y): anchor point. y is the BASELINE — text renders above it.
// col: [r, g, b]   align: 'left' | 'center' | 'right'
function drawHersheyText(p, text, x, y, pixelH, col, align) {
  const scale = pixelH / 21;
  const sw    = Math.max(0.8, pixelH / 14);
  const str   = text.toUpperCase();

  // Compute total width for alignment
  let totalW = 0;
  for (const ch of str) {
    const ext = _charExtent(ch);
    totalW += ext ? (ext.maxX - ext.minX + 3) * scale : 7 * scale;
  }

  let cx = align === 'center' ? x - totalW / 2
         : align === 'right'  ? x - totalW
         : x;

  p.push();
  p.noFill();
  p.stroke(col[0], col[1], col[2]);
  p.strokeWeight(sw);
  p.strokeCap(p.ROUND);
  p.strokeJoin(p.ROUND);

  for (const ch of str) {
    if (ch === ' ') { cx += 7 * scale; continue; }
    const ext = _charExtent(ch);
    if (!ext) { cx += 7 * scale; continue; }
    const { minX, maxX } = ext;
    const ox  = -minX;
    const raw = HERSHEY[ch.toUpperCase()];
    for (const stroke of raw) {
      if (stroke.length < 2) continue;
      for (let i = 0; i < stroke.length - 1; i++) {
        p.line(
          cx + (stroke[i][0]   + ox) * scale,  y - stroke[i][1]   * scale,
          cx + (stroke[i+1][0] + ox) * scale,  y - stroke[i+1][1] * scale
        );
      }
    }
    cx += (maxX - minX + 3) * scale;
  }
  p.pop();
}

// ─── Interpolation method list ────────────────────────────────────────────────
const INTERP_METHODS = [
  { val: 'nearest',  label: 'NEAREST'  },
  { val: 'linear',   label: 'LINEAR'   },
  { val: 'smooth',   label: 'SMOOTH'   },
  { val: 'log',      label: 'LOG'      },
  { val: 'idw',      label: 'IDW'      },
  { val: 'cubic',    label: 'IDW 3'    },
  { val: 'gaussian', label: 'GAUSS'    },
  { val: 'poly',     label: 'POLY'     },
  { val: 'spline',   label: 'SPLINE'   },
  { val: 'extrap',   label: 'EXTRAP'   },
  { val: 'extrap2',  label: 'EXTRAP 2' },
  { val: 'extrap4',  label: 'EXTRAP 4' },
  { val: 'extrap8',  label: 'EXTRAP 8' },
];

// ─── HTML UI ──────────────────────────────────────────────────────────────────
function buildLetterGrid() {
  const panel = document.getElementById('grid-panel');
  for (const ch of LETTERS) {
    const btn    = document.createElement('button');
    btn.dataset.letter = ch;
    const chSpan = document.createElement('span'); chSpan.className = 'ch';
    chSpan.innerHTML = hersheyTextSVG(ch, 12);
    const ordSpan = document.createElement('span'); ordSpan.className = 'ord';
    btn.appendChild(chSpan); btn.appendChild(ordSpan);
    btn.addEventListener('click', () => {
      const idx = selected.indexOf(ch);
      if (idx !== -1) { selected.splice(idx, 1); delete letterPos[ch]; }
      else if (selected.length < 9) { selected.push(ch); }
      autoArrange();
      dotPos = { x: 0.5, y: 0.5 };
      refreshGrid();
      redrawSketch();
    });
    panel.appendChild(btn);
  }
}

function refreshGrid() {
  document.querySelectorAll('#grid-panel button').forEach(btn => {
    const ch  = btn.dataset.letter;
    const idx = selected.indexOf(ch);
    btn.classList.toggle('sel', idx !== -1);
    btn.querySelector('.ord').innerHTML = idx !== -1 ? hersheyTextSVG(String(idx + 1), 6) : '';
  });
}

function buildInterpList() {
  const list = document.getElementById('interp-list');
  list.innerHTML = '';
  for (const m of INTERP_METHODS) {
    const div = document.createElement('div');
    div.className   = 'interp-opt' + (interpMethod === m.val ? ' active' : '');
    div.innerHTML   = hersheyTextSVG(m.label, 8);
    div.addEventListener('click', () => {
      interpMethod = m.val;
      document.querySelectorAll('.interp-opt').forEach(d => d.classList.remove('active'));
      div.classList.add('active');
      redrawSketch();
    });
    list.appendChild(div);
  }
}

function initHTMLLabels() {
  document.getElementById('lbl-pts').innerHTML      = hersheyTextSVG('NO. OF POINTS', 10);
  document.getElementById('linesBtn').innerHTML     = hersheyTextSVG('LINES OFF', 10);
  document.getElementById('val-pts').innerHTML      = hersheyTextSVG('200', 10);
  document.getElementById('lbl-dot').innerHTML      = hersheyTextSVG('DOT SIZE', 10);
  document.getElementById('val-dot').innerHTML      = hersheyTextSVG('3', 10);
  document.getElementById('lbl-strokes').innerHTML  = hersheyTextSVG('STROKES', 10);
  document.getElementById('val-strokes').innerHTML  = hersheyTextSVG('1', 10);
  document.getElementById('lbl-spacing').innerHTML  = hersheyTextSVG('STROKE GAP', 10);
  document.getElementById('val-spacing').innerHTML  = hersheyTextSVG('3', 10);
  document.getElementById('lbl-interp').innerHTML   = hersheyTextSVG('INTERPOLATION TYPE', 10);
  document.getElementById('exportSvgBtn').innerHTML  = hersheyTextSVG('EXPORT SVG', 10);
  document.getElementById('exportPngBtn').innerHTML  = hersheyTextSVG('EXPORT PNG', 10);
  buildInterpList();
}

// ─── Export ───────────────────────────────────────────────────────────────────

function exportSVG(p) {
  const pts = getInterpolated();
  if (!pts.length) return;

  const size = p.height;
  const cx   = size / 2, cy = size / 2, sc = size * 0.72;
  const strokeGap = sc * strokeSpacing;
  const bg   = '#f5f5f0';
  const fg   = '#1e1e1e';
  const sw   = dotSize;

  let body = `<rect width="${size}" height="${size}" fill="${bg}"/>`;

  for (let k = 0; k < numStrokes; k++) {
    const s = sc + (k - (numStrokes - 1) / 2) * strokeGap;
    if (showLines) {
      const d = pts.map((pt, i) =>
        `${i === 0 ? 'M' : 'L'}${(cx + pt.x * s).toFixed(2)},${(cy - pt.y * s).toFixed(2)}`
      ).join(' ');
      body += `<path d="${d}" fill="none" stroke="${fg}" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    const circles = pts.map(pt =>
      `<circle cx="${(cx + pt.x * s).toFixed(2)}" cy="${(cy - pt.y * s).toFixed(2)}" r="${(sw / 2).toFixed(2)}" fill="${fg}"/>`
    ).join('');
    body += circles;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${body}</svg>`;
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'letter-morph.svg';
  a.click();
  URL.revokeObjectURL(a.href);
}

function exportPNG(p) {
  const pts = getInterpolated();
  if (!pts.length) return;

  const size   = p.height * 2;   // 2× for higher res
  const cx     = size / 2, cy = size / 2, sc = size * 0.72;
  const strokeGap = sc * strokeSpacing;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx    = canvas.getContext('2d');

  ctx.fillStyle = '#f5f5f0';
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle   = '#1e1e1e';
  ctx.strokeStyle = '#1e1e1e';

  for (let k = 0; k < numStrokes; k++) {
    const s = sc + (k - (numStrokes - 1) / 2) * strokeGap;
    if (showLines) {
      ctx.beginPath();
      pts.forEach((pt, i) => {
        const x = cx + pt.x * s, y = cy - pt.y * s;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.lineWidth = 1.6;
      ctx.lineCap   = 'round';
      ctx.stroke();
    }
    const r = dotSize;
    for (const pt of pts) {
      ctx.beginPath();
      ctx.arc(cx + pt.x * s, cy - pt.y * s, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = 'letter-morph.png';
  a.click();
}

// ─── p5 sketch ────────────────────────────────────────────────────────────────
new p5(function(p) {
  const PAD = 34;

  function halfSize() {
    return Math.min(Math.floor((window.innerWidth - 358) / 2), window.innerHeight - 40, 560);
  }

  function n2s(nx, ny) {
    const inner = p.height - 2 * PAD;
    return [PAD + nx * inner, PAD + ny * inner];
  }
  function s2n(sx, sy) {
    const inner = p.height - 2 * PAD;
    return [(sx - PAD) / inner, (sy - PAD) / inner];
  }

  // ── Nav grid ────────────────────────────────────────────────────────────────
  function drawNavGrid() {
    const h     = p.height;
    const inner = h - 2 * PAD;

    p.noFill();
    p.stroke(210, 210, 205);
    p.strokeWeight(1);
    p.rect(PAD, PAD, inner, inner);

    if (!selected.length) {
      const hc = [178, 176, 170];
      drawHersheyText(p, 'SELECT 2 OR MORE LETTERS', h / 2, h / 2 + 5, 9, hc, 'center');
      return;
    }

    // Grid lines
    p.stroke(225, 225, 218);
    p.strokeWeight(1);
    for (const ch of selected) {
      const pos = letterPos[ch]; if (!pos) continue;
      const [sx, sy] = n2s(pos.x, pos.y);
      p.line(sx, PAD, sx, PAD + inner);
      p.line(PAD, sy, PAD + inner, sy);
    }

    // Axis labels — sorted by position
    const lc  = [158, 163, 182];
    const byX = [...selected].sort((a, b) => (letterPos[a]?.x ?? 0) - (letterPos[b]?.x ?? 0));
    const byY = [...selected].sort((a, b) => (letterPos[a]?.y ?? 0) - (letterPos[b]?.y ?? 0));

    for (const ch of byX) {
      const [sx] = n2s(letterPos[ch].x, 0);
      drawHersheyText(p, ch, sx, PAD - 4, 9, lc, 'center');
    }
    for (const ch of byY) {
      const [, sy] = n2s(0, letterPos[ch].y);
      drawHersheyText(p, ch, PAD - 5, sy + 5, 9, lc, 'right');
    }

    // Letter handles (draggable)
    const handleBg = p.color(200, 210, 240);
    const handleFg = [34, 51, 187];
    for (const ch of selected) {
      const pos = letterPos[ch]; if (!pos) continue;
      const [sx, sy] = n2s(pos.x, pos.y);
      p.fill(handleBg); p.noStroke(); p.ellipse(sx, sy, 13, 13);
      drawHersheyText(p, ch, sx, sy + 4, 8, handleFg, 'center');
    }

    // Control dot
    const dotCol = p.color(30, 30, 40);
    const [dsx, dsy] = n2s(dotPos.x, dotPos.y);
    p.fill(dotCol); p.noStroke(); p.ellipse(dsx, dsy, 9, 9);
  }

  // ── Viewport ────────────────────────────────────────────────────────────────
  function drawViewport() {
    const h  = p.height;
    const cx = h + h / 2;
    const cy = h / 2;
    const sc = h * 0.72;
    const strokeGap = sc * strokeSpacing; // spacing between parallel copies

    const pts = getInterpolated();
    if (!pts.length) {
      const hc = [178, 176, 170];
      drawHersheyText(p, 'SELECT 2 OR MORELETTERS', cx, cy + 5, 9, hc, 'center');
      return;
    }

    for (let k = 0; k < numStrokes; k++) {
      const s = sc + (k - (numStrokes - 1) / 2) * strokeGap;
      if (showLines) {
        p.stroke(30);
        p.strokeWeight(0.8); p.noFill();
        p.beginShape();
        for (const pt of pts) p.vertex(cx + pt.x * s, cy - pt.y * s);
        p.endShape();
      }
      p.noStroke();
      p.fill(30);
      for (const pt of pts) {
        p.ellipse(cx + pt.x * s, cy - pt.y * s, dotSize, dotSize);
      }
    }
  }

  // ── Setup & draw ────────────────────────────────────────────────────────────
  p.setup = function() {
    const h = halfSize();
    p.createCanvas(h * 2, h).parent('sketch');
    p.noLoop();
    redrawSketch = () => p.redraw();

    for (const ch of LETTERS) pointSets[ch] = sampleGlyph(ch, numPts);
    buildLetterGrid();
    initHTMLLabels();

    document.getElementById('nPts').addEventListener('input', function() {
      numPts = parseInt(this.value);
      document.getElementById('val-pts').innerHTML = hersheyTextSVG(String(numPts), 10);
      for (const ch of LETTERS) pointSets[ch] = sampleGlyph(ch, numPts);
      p.redraw();
    });

    document.getElementById('dotSize').addEventListener('input', function() {
      dotSize = parseInt(this.value);
      document.getElementById('val-dot').innerHTML = hersheyTextSVG(String(dotSize), 10);
      p.redraw();
    });

    document.getElementById('numStrokes').addEventListener('input', function() {
      numStrokes = parseInt(this.value);
      document.getElementById('val-strokes').innerHTML = hersheyTextSVG(String(numStrokes), 10);
      p.redraw();
    });

    document.getElementById('strokeSpacing').addEventListener('input', function() {
      strokeSpacing = parseInt(this.value) / 100;
      document.getElementById('val-spacing').innerHTML = hersheyTextSVG(String(this.value), 10);
      p.redraw();
    });

    document.getElementById('linesBtn').addEventListener('click', function() {
      showLines = !showLines;
      this.innerHTML = hersheyTextSVG(showLines ? 'LINES ON' : 'LINES OFF', 10);
      p.redraw();
    });

    document.getElementById('exportSvgBtn').addEventListener('click', () => exportSVG(p));
    document.getElementById('exportPngBtn').addEventListener('click', () => exportPNG(p));

    p.redraw();
  };

  p.draw = function() {
    p.background(245, 245, 240);
    drawNavGrid();
    p.stroke(210, 210, 205);
    p.strokeWeight(1); p.line(p.height, 0, p.height, p.height);
    drawViewport();
  };

  // ── Mouse interaction ────────────────────────────────────────────────────────
  p.mousePressed = function() {
    if (p.mouseX < 0 || p.mouseX >= p.height || p.mouseY < 0 || p.mouseY >= p.height) return;
    for (const ch of selected) {
      const pos = letterPos[ch]; if (!pos) continue;
      const [sx, sy] = n2s(pos.x, pos.y);
      if (Math.hypot(p.mouseX - sx, p.mouseY - sy) < 12) { dragging = ch; return; }
    }
    dragging = 'dot';
    const [nx, ny] = s2n(p.mouseX, p.mouseY);
    dotPos = { x: nx, y: ny };
    p.redraw();
  };

  p.mouseDragged = function() {
    if (!dragging) return;
    const [nx, ny] = s2n(p.mouseX, p.mouseY);
    if (dragging === 'dot') dotPos = { x: nx, y: ny };
    else if (letterPos[dragging]) letterPos[dragging] = { x: nx, y: ny };
    p.redraw();
  };

  p.mouseReleased = function() { dragging = null; };

  p.windowResized = function() {
    const h = halfSize(); p.resizeCanvas(h * 2, h); p.redraw();
  };
});
