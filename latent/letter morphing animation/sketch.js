// ─────────────────────────────────────────────────────────────────────────────
// Global state
// ─────────────────────────────────────────────────────────────────────────────
let letters = ['H', 'A', 'W'];
let numPts = 200;
let pointSets = [];   // one array of {x,y} per letter, normalized to [-0.5, 0.5]
let playing = true;
let showLines = false;
let showFilled = false;
let animT = 0;

// ─────────────────────────────────────────────────────────────────────────────
// Hershey simplex stroke data
// Each entry: array of strokes, each stroke: array of [x, y] pairs.
// Coordinate system: y up, cap height = 21, baseline = 0.
// ─────────────────────────────────────────────────────────────────────────────
const HERSHEY = {
  'A': [
    [[-5,0],[0,21],[5,0]],
    [[-3,10],[3,10]]
  ],
  'B': [
    [[-5,21],[-5,0]],
    [[-5,21],[0,21],[3,19],[4,17],[4,15],[3,13],[0,12],[-5,12]],
    [[-5,12],[1,12],[4,9],[5,7],[5,4],[4,2],[1,0],[-5,0]]
  ],
  'C': [
    [[6,17],[4,20],[1,21],[-2,21],[-5,18],[-6,15],[-6,6],[-5,3],[-2,0],[1,0],[4,2],[6,5]]
  ],
  'D': [
    [[-5,21],[-5,0]],
    [[-5,21],[0,21],[3,19],[5,16],[6,12],[6,9],[5,5],[3,2],[0,0],[-5,0]]
  ],
  'E': [
    [[-5,21],[-5,0]],
    [[-5,21],[5,21]],
    [[-5,12],[2,12]],
    [[-5,0],[5,0]]
  ],
  'F': [
    [[-5,21],[-5,0]],
    [[-5,21],[5,21]],
    [[-5,12],[2,12]]
  ],
  'G': [
    [[6,17],[4,20],[1,21],[-2,21],[-5,18],[-6,15],[-6,6],[-5,3],[-2,0],[1,0],[4,2],[6,5],[6,12],[2,12]]
  ],
  'H': [
    [[-5,21],[-5,0]],
    [[5,21],[5,0]],
    [[-5,11],[5,11]]
  ],
  'I': [
    [[0,21],[0,0]],
    [[-3,21],[3,21]],
    [[-3,0],[3,0]]
  ],
  'J': [
    [[2,21],[2,4],[1,1],[-1,0],[-3,0],[-5,1],[-5,4]]
  ],
  'K': [
    [[-5,21],[-5,0]],
    [[5,21],[-5,9]],
    [[-2,13],[5,0]]
  ],
  'L': [
    [[-5,21],[-5,0],[5,0]]
  ],
  'M': [
    [[-6,0],[-6,21],[0,9],[6,21],[6,0]]
  ],
  'N': [
    [[-5,0],[-5,21],[5,0],[5,21]]
  ],
  'O': [
    [[-1,21],[-4,20],[-6,17],[-6,4],[-4,1],[-1,0],[1,0],[4,1],[6,4],[6,17],[4,20],[1,21],[-1,21]]
  ],
  'P': [
    [[-5,21],[-5,0]],
    [[-5,21],[0,21],[3,19],[4,17],[4,14],[3,12],[0,11],[-5,11]]
  ],
  'Q': [
    [[-1,21],[-4,20],[-6,17],[-6,4],[-4,1],[-1,0],[1,0],[4,1],[6,4],[6,17],[4,20],[1,21],[-1,21]],
    [[2,5],[6,0]]
  ],
  'R': [
    [[-5,21],[-5,0]],
    [[-5,21],[0,21],[3,19],[4,17],[4,14],[3,12],[0,11],[-5,11]],
    [[0,11],[5,0]]
  ],
  'S': [
    [[6,17],[4,20],[1,21],[-2,21],[-5,18],[-5,15],[-2,12],[3,9],[6,6],[6,3],[3,0],[-1,0],[-4,1],[-6,4]]
  ],
  'T': [
    [[0,21],[0,0]],
    [[-6,21],[6,21]]
  ],
  'U': [
    [[-5,21],[-5,4],[-4,1],[-1,0],[1,0],[4,1],[5,4],[5,21]]
  ],
  'V': [
    [[-6,21],[0,0],[6,21]]
  ],
  'W': [
    [[-8,21],[-5,0],[0,10],[5,0],[8,21]]
  ],
  'X': [
    [[-5,21],[5,0]],
    [[5,21],[-5,0]]
  ],
  'Y': [
    [[-6,21],[0,11]],
    [[6,21],[0,11],[0,0]]
  ],
  'Z': [
    [[-6,21],[6,21],[-6,0],[6,0]]
  ],
  '0': [
    [[-4,21],[-6,18],[-6,3],[-4,0],[4,0],[6,3],[6,18],[4,21],[-4,21]]
  ],
  '1': [
    [[-2,17],[0,21],[0,0]],
    [[-3,0],[3,0]]
  ],
  '2': [
    [[-5,18],[-4,21],[-1,21],[2,18],[2,14],[-5,0],[6,0]]
  ],
  '3': [
    [[-5,21],[5,21],[0,12],[3,12],[5,9],[5,4],[3,1],[0,0],[-3,0],[-5,2]]
  ],
  '4': [
    [[3,21],[-5,8],[6,8]],
    [[3,21],[3,0]]
  ],
  '5': [
    [[5,21],[-5,21],[-5,12],[0,12],[3,11],[5,8],[5,4],[3,1],[0,0],[-3,0],[-5,2]]
  ],
  '6': [
    [[4,20],[2,21],[-1,21],[-4,19],[-6,15],[-6,5],[-5,2],[-2,0],[1,0],[4,2],[5,5],[5,8],[4,10],[2,11],[-1,11],[-4,8],[-5,5]]
  ],
  '7': [
    [[-5,21],[6,21],[0,0]]
  ],
  '8': [
    [[0,21],[-3,20],[-5,17],[-5,14],[-3,12],[0,11],[3,12],[5,14],[5,17],[3,20],[0,21]],
    [[0,11],[-3,9],[-5,6],[-5,3],[-3,1],[0,0],[3,1],[5,4],[5,7],[3,9],[0,11]]
  ],
  '9': [
    [[-4,2],[-2,0],[1,0],[4,2],[5,5],[5,16],[4,19],[2,21],[-1,21],[-4,19],[-5,16],[-5,12],[-4,9],[-2,8],[1,8],[4,9],[5,12]]
  ],
  '?': [
    [[-4,18],[-4,21],[-1,21],[2,19],[2,15],[0,12],[0,7]],
    [[0,3],[0,0]]
  ],
  '!': [
    [[0,21],[0,7]],
    [[0,3],[0,0]]
  ],
  '.': [
    [[0,3],[0,0]]
  ],
  ',': [
    [[1,3],[1,0],[0,-2],[-1,-3]]
  ],
  '-': [
    [[-4,11],[4,11]]
  ],
  '+': [
    [[-5,11],[5,11]],
    [[0,16],[0,6]]
  ],
  ' ': []
};

// ─────────────────────────────────────────────────────────────────────────────
// Sample n evenly-spaced points along an open polyline [{x,y},...]
// ─────────────────────────────────────────────────────────────────────────────
function sampleStroke(pts, n) {
  if (n <= 1) return [{ ...pts[0] }];
  const segs = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1].x - pts[i].x, dy = pts[i + 1].y - pts[i].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    segs.push(len);
    total += len;
  }
  if (total < 1e-6) return Array(n).fill({ ...pts[0] });

  const result = [];
  let acc = 0, si = 0;
  for (let i = 0; i < n; i++) {
    const target = (i / (n - 1)) * total;
    while (si < segs.length - 1 && acc + segs[si] < target) {
      acc += segs[si];
      si++;
    }
    const t = segs[si] > 1e-6 ? Math.min((target - acc) / segs[si], 1) : 0;
    result.push({
      x: pts[si].x + (pts[si + 1].x - pts[si].x) * t,
      y: pts[si].y + (pts[si + 1].y - pts[si].y) * t,
    });
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Glyph sampling → n normalized points in [-0.5, 0.5]
// ─────────────────────────────────────────────────────────────────────────────
function sampleGlyph(char, n) {
  const key = char.toUpperCase();
  const raw = HERSHEY[key] || HERSHEY['?'];
  if (!raw || raw.length === 0) return Array(n).fill({ x: 0, y: 0 });

  const polylines = raw.map(s => s.map(([x, y]) => ({ x, y })));

  // Arc length of each stroke
  const lengths = polylines.map(pl => {
    let len = 0;
    for (let i = 0; i < pl.length - 1; i++) {
      const dx = pl[i + 1].x - pl[i].x, dy = pl[i + 1].y - pl[i].y;
      len += Math.sqrt(dx * dx + dy * dy);
    }
    return len;
  });
  const total = lengths.reduce((a, b) => a + b, 0);
  if (total < 1e-6) return Array(n).fill({ x: 0, y: 0 });

  // Distribute point budget proportionally across strokes
  let pts = [];
  for (let si = 0; si < polylines.length; si++) {
    const count = Math.max(2, Math.round(n * lengths[si] / total));
    pts = pts.concat(sampleStroke(polylines[si], count));
  }

  // Trim / pad to exactly n
  while (pts.length < n) pts.push({ ...pts[pts.length - 1] });
  pts = pts.slice(0, n);

  // Center and scale to [-0.5, 0.5]
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
  }
  const cX = (minX + maxX) / 2, cY = (minY + maxY) / 2;
  const scale = Math.max(maxX - minX, maxY - minY, 1);
  // Negate y: Hershey y increases upward, screen y increases downward
  return pts.map(p => ({ x: (p.x - cX) / scale, y: -(p.y - cY) / scale }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Easing functions  (t ∈ [0,1] → [0,1])
// ─────────────────────────────────────────────────────────────────────────────
const ease = {
  linear:     t => t,
  smoothstep: t => t * t * (3 - 2 * t),
  cosine:     t => (1 - Math.cos(t * Math.PI)) / 2,
  cubic:      t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  elastic:    t => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
  },
  bounce: t => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1)     return n1 * t * t;
    if (t < 2 / d1)     return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1)   return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
  back:   t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  expo:   t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, 10 * t - 10),
  poly5:  t => t * t * t * (t * (t * 6 - 15) + 10),
};

// Catmull-Rom scalar
function cr1(p0, p1, p2, p3, t) {
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Multi-letter interpolation
// t ∈ [0, letters.length − 1]
// ─────────────────────────────────────────────────────────────────────────────
function interpolate(sets, t, type) {
  const n = sets.length;
  if (n === 0) return [];
  if (n === 1) return sets[0];

  const seg = Math.min(Math.floor(t), n - 2);
  const lt  = t - seg;

  if (type === 'catmullrom') {
    const i0 = Math.max(0, seg - 1);
    const i1 = seg;
    const i2 = Math.min(n - 1, seg + 1);
    const i3 = Math.min(n - 1, seg + 2);
    const s0 = sets[i0], s1 = sets[i1], s2 = sets[i2], s3 = sets[i3];
    return s1.map((_, i) => ({
      x: cr1(s0[i].x, s1[i].x, s2[i].x, s3[i].x, lt),
      y: cr1(s0[i].y, s1[i].y, s2[i].y, s3[i].y, lt),
    }));
  }

  const ef = (ease[type] || ease.linear)(lt);
  const a = sets[seg], b = sets[seg + 1];
  return a.map((pa, i) => ({
    x: pa.x + (b[i].x - pa.x) * ef,
    y: pa.y + (b[i].y - pa.y) * ef,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Build point sets from current UI state
// ─────────────────────────────────────────────────────────────────────────────
function buildPointSets() {
  const parsed = document.getElementById('lettersInput').value
    .split(',').map(s => s.trim()).filter(Boolean);
  letters = parsed;
  numPts  = parseInt(document.getElementById('nPts').value);
  pointSets = letters.map(l => sampleGlyph(l[0] || '?', numPts));

  const maxT = Math.max(1, letters.length - 1);
  const tSlider = document.getElementById('tManual');
  tSlider.max = maxT;
  animT = Math.min(animT, maxT);

  document.getElementById('status').textContent =
    `${letters.length} letters · ${numPts} pts each · ${maxT} segment(s)`;
}

// ─────────────────────────────────────────────────────────────────────────────
// p5 sketch
// ─────────────────────────────────────────────────────────────────────────────
new p5(function(p) {

  p.setup = function() {
    const cnv = p.createCanvas(880, 420);
    cnv.parent('sketch');
    p.colorMode(p.HSB, 360, 100, 100, 100);
    buildPointSets();
    bindUI();
  };

  // ── UI bindings ─────────────────────────────────────────────────────────────
  function bindUI() {
    const bindVal = (id, dispId) =>
      document.getElementById(id).addEventListener('input', function() {
        document.getElementById(dispId).textContent = this.value;
      });
    bindVal('nPts',    'nPtsVal');
    bindVal('speed',   'speedVal');
    bindVal('dotSize', 'dotVal');
    bindVal('trail',   'trailVal');

    document.getElementById('applyBtn').addEventListener('click', buildPointSets);

    document.getElementById('playBtn').addEventListener('click', function() {
      playing = !playing;
      this.textContent = playing ? 'Pause' : 'Play';
      this.classList.toggle('on', !playing);
    });

    document.getElementById('linesBtn').addEventListener('click', function() {
      showLines = !showLines;
      this.textContent = 'Lines: ' + (showLines ? 'On' : 'Off');
      this.classList.toggle('on', showLines);
    });

    document.getElementById('filledBtn').addEventListener('click', function() {
      showFilled = !showFilled;
      this.classList.toggle('on', showFilled);
    });

    document.getElementById('tManual').addEventListener('input', function() {
      if (!playing) {
        animT = parseFloat(this.value);
        document.getElementById('tDisp').textContent = animT.toFixed(3);
      }
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function toScreen(pt) {
    return [
      p.width / 2  + pt.x * p.height * 0.78,
      p.height / 2 + pt.y * p.height * 0.78,
    ];
  }

  function drawPoints(pts, alpha) {
    const dot = parseInt(document.getElementById('dotSize').value);
    p.noStroke();
    for (let i = 0; i < pts.length; i++) {
      const [sx, sy] = toScreen(pts[i]);
      p.fill(0, 0, 0, alpha);
      p.ellipse(sx, sy, dot, dot);
    }
  }

  function drawFilled(pts, alpha) {
    p.fill(0, 0, 0, alpha);
    p.noStroke();
    p.beginShape();
    for (const pt of pts) {
      const [sx, sy] = toScreen(pt);
      p.vertex(sx, sy);
    }
    p.endShape(p.CLOSE);
  }

  function drawLines(pts, alpha) {
    p.strokeWeight(0.8);
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = toScreen(pts[i]);
      const [bx, by] = toScreen(pts[i + 1]);
      p.stroke(0, 0, 0, alpha * 0.5);
      p.line(ax, ay, bx, by);
    }
    p.noStroke();
  }

  // ── Main draw loop ───────────────────────────────────────────────────────────
  p.draw = function() {
    const trailV = parseInt(document.getElementById('trail').value);
    p.background(0, 0, 100, trailV);

    if (pointSets.length === 0) {
      p.fill(0, 0, 0); p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(13);
      p.text('No letters defined.', p.width / 2, p.height / 2);
      return;
    }

    const speedV  = parseInt(document.getElementById('speed').value) / 1000;
    const interpT = document.getElementById('interp').value;
    const maxT    = Math.max(1, letters.length - 1);

    // Advance animation
    if (playing) {
      animT += speedV;
      if (animT >= maxT) animT = 0;
      document.getElementById('tManual').value = animT;
      document.getElementById('tDisp').textContent = animT.toFixed(3);
    }

    // Interpolated point cloud / filled shape
    const pts = interpolate(pointSets, animT, interpT);
    if (pts && pts.length) {
      if (showFilled) {
        drawFilled(pts, 88);
      } else {
        if (showLines) drawLines(pts, 80);
        drawPoints(pts, 85);
      }
    }

    // ── HUD ─────────────────────────────────────────────────────────────────────
    const seg  = Math.min(Math.floor(animT), letters.length - 2);
    const from = letters[seg]       || '?';
    const to   = letters[seg + 1]   || '?';
    const lt   = animT - seg;

    p.noStroke();
    p.fill(0, 0, 0, 90);
    p.textAlign(p.LEFT);
    p.textSize(10);
    p.text(
      `${from} → ${to}  |  t: ${animT.toFixed(3)}  |  local: ${lt.toFixed(3)}  |  ${interpT}  |  ${numPts} pts`,
      10, p.height - 10
    );

    // Letter markers along top
    for (let i = 0; i < letters.length; i++) {
      const fx    = p.map(i, 0, letters.length - 1, 60, p.width - 60);
      const dist  = Math.abs(animT - i);
      const alpha = p.map(Math.max(0, 1 - dist), 0, 1, 20, 95);
      const sz    = p.map(Math.max(0, 1 - dist), 0, 1, 2, 7);

      p.fill(0, 0, 0, alpha);
      p.ellipse(fx, 28, sz, sz);
      p.fill(0, 0, 0, alpha);
      p.textAlign(p.CENTER);
      p.textSize(11);
      p.text(letters[i], fx, 15);
    }

    // Progress bar
    const barX = 60, barW = p.width - 120;
    p.fill(0, 0, 80, 70);
    p.noStroke();
    p.rect(barX, 33, barW, 2, 1);
    p.fill(0, 0, 0, 80);
    p.rect(barX, 33, barW * (animT / maxT), 2, 1);
  };
});
