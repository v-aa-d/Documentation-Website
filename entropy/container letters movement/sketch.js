// Entropy Type

const FONT_SIZE   = 200;
const SAMPLE_STEP = 6;
const MAX_PTS     = 3000;
const RES         = 8;
const SURFACE     = 6.0;
const CA_CELL     = 16;   // cellular automaton grid resolution (px per cell)

let particles     = [];
let pg;
let customFont    = null;
let defaultFont   = null;
let entropyLevel  = 0.5;
let particleR     = 18;
let showStrokes   = true;
let particleShape = 'circle';

let field, cols, rows;
let caGrid, caNext, caCols, caRows, caCellSize;

// ── preload ───────────────────────────────────────────────────────────────────

function preload() {
  loadFont('diatype copy/ABCDiatypeSemi-Mono-Bold-Trial.otf',
    f => { defaultFont = f; },
    () => { defaultFont = null; }); // fine to fail — falls back to pixel-sampled fill only
}

// ── Particle ──────────────────────────────────────────────────────────────────

class Particle {
  constructor(home) {
    this.home       = home.copy();
    this.targetHome = home.copy();
    this.pos        = home.copy();
    this.vel        = createVector(0, 0);
    this.smoothVel  = createVector(0, 0);  // low-pass filtered velocity, used to orient the ellipse shape
    this.angle      = random(TWO_PI);
    this.speed      = random(0.018, 0.06);
    this.rx         = random(5, 16);
    this.ry         = random(3, 12);
    this.seed       = random(10000);
    this.caState    = 0; // smoothed 0..1 — how "alive" this particle's CA cell currently is
  }

  setHome(h) { this.targetHome = h.copy(); }

  show() {
    fill(255);
    stroke(0);
    strokeWeight(1);

    switch (particleShape) {

      case 'circle':
        circle(this.pos.x, this.pos.y, particleR * 2);
        break;

      case 'square':
        rectMode(CENTER);
        rect(this.pos.x, this.pos.y, particleR * 2, particleR * 2);
        break;

      case 'ellipse':
        push();
        translate(this.pos.x, this.pos.y);
        if (this.smoothVel.mag() > 0.01) rotate(atan2(this.smoothVel.y, this.smoothVel.x));
        ellipse(0, 0, particleR * 2.6, particleR * 0.9);
        pop();
        break;
    }
  }

  update() {
    this.home.x += (this.targetHome.x - this.home.x) * 0.08;
    this.home.y += (this.targetHome.y - this.home.y) * 0.08;

    this.angle += this.speed;

    // Look up whether this particle's home cell is "alive" in the cellular automaton.
    // Smoothing avoids single-frame flicker when a cell flips state.
    let ci    = constrain(floor(this.home.x / caCellSize), 0, caCols - 1);
    let cj    = constrain(floor(this.home.y / caCellSize), 0, caRows - 1);
    let alive = caGrid[ci + cj * caCols];
    this.caState += (alive - this.caState) * 0.15;

    // Amplitude is driven by entropy AND by the automaton's local activity —
    // at zero entropy the grid is forced empty, caState decays to 0, and rxN/ryN
    // (and thermalMag below) go to exactly 0, so particles settle back onto home.
    let e     = noise(this.seed + frameCount * 0.003);
    let ampScale = map(entropyLevel, 0, 1, 0, 4.5) * this.caState;
    let rxN  = this.rx * e * ampScale;
    let ryN  = this.ry * e * ampScale;

    let tx = this.home.x + cos(this.angle) * rxN;
    let ty = this.home.y + sin(this.angle) * ryN;

    let fx = (tx - this.pos.x) * 0.12;
    let fy = (ty - this.pos.y) * 0.12;

    let thermalAngle = noise(this.seed * 0.5, frameCount * 0.009) * TWO_PI * 4;
    let thermalMag   = noise(this.seed * 1.3, frameCount * 0.006) * 1.4 * entropyLevel * this.caState;
    fx += cos(thermalAngle) * thermalMag;
    fy += sin(thermalAngle) * thermalMag;

    this.vel.x = (this.vel.x + fx) * 0.80;
    this.vel.y = (this.vel.y + fy) * 0.80;
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;

    // Smooth velocity — lerp toward actual vel at 10% per frame so direction is stable
    this.smoothVel.x += (this.vel.x - this.smoothVel.x) * 0.10;
    this.smoothVel.y += (this.vel.y - this.smoothVel.y) * 0.10;
  }
}

// ── textToPoints ──────────────────────────────────────────────────────────────

function textToPoints(txt) {
  txt = txt || ' ';
  let f = customFont || defaultFont;

  // Multi-line input: shrink the font so all lines (and the longest line)
  // fit on the canvas instead of overflowing past FONT_SIZE's single-line default.
  let fontSize = FONT_SIZE;
  let bounds = null;
  if (f) {
    // f.textBounds/f.textToPoints read line-spacing off the font's own parent
    // renderer (the main canvas), not off `pg` — keep the main canvas's textSize
    // in sync or multi-line leading falls back to its stale 15px default, which
    // desyncs from pg's leading more and more with each added line.
    textFont(f);
    let lineCount = txt.split(/\r?\n/).length;
    fontSize = min(FONT_SIZE, (height * 0.82) / lineCount);
    textSize(fontSize);
    bounds = f.textBounds(txt, 0, 0, fontSize);
    if (bounds.w > width * 0.92) {
      fontSize *= (width * 0.92) / bounds.w;
      textSize(fontSize);
    }
    bounds = f.textBounds(txt, 0, 0, fontSize); // re-measure at the final size for accurate centering
  }

  pg.background(0);
  pg.fill(255);
  pg.noStroke();
  pg.textSize(fontSize);
  pg.textStyle(BOLD);
  if (f) pg.textFont(f);

  let ox, oy;
  if (f) {
    // Anchor the pixel fill and the glyph outline to the exact same baseline-left
    // origin — font.textToPoints positions text as a LEFT/BASELINE pen origin, so
    // rendering the fill with CENTER/CENTER (a different alignment system) would
    // make the two point sets land on slightly different geometry.
    ox = pg.width  / 2 - bounds.w / 2 - bounds.x;
    oy = pg.height / 2 - bounds.h / 2 - bounds.y;
    pg.textAlign(LEFT, BASELINE);
    pg.text(txt, ox, oy);
  } else {
    pg.textAlign(CENTER, CENTER);
    pg.text(txt, pg.width / 2, pg.height / 2);
  }
  pg.loadPixels();

  let pts = [];
  for (let x = 0; x < pg.width; x += SAMPLE_STEP) {
    for (let y = 0; y < pg.height; y += SAMPLE_STEP) {
      if (pg.pixels[(x + y * pg.width) * 4] > 128)
        pts.push(createVector(x, y));
    }
  }

  // Outline — p5's Font.textToPoints traces the actual glyph contours,
  // giving crisp points along the outer and inner (counter) edges of each letter.
  if (f) {
    try {
      let outline = f.textToPoints(txt, ox, oy, fontSize, { sampleFactor: 0.35, simplifyThreshold: 0 });
      for (let p of outline) pts.push(createVector(p.x, p.y));
    } catch {
      // Some fonts/environments can't extract outlines — fill points above still cover it.
    }
  }

  return pts;
}

// ── rebuild ───────────────────────────────────────────────────────────────────

function rebuildParticles(txt) {
  let pts = textToPoints(txt || ' ');
  while (pts.length > MAX_PTS) pts.splice(floor(random(pts.length)), 1);

  const byPos = (a, b) => a.x !== b.x ? a.x - b.x : a.y - b.y;
  pts.sort(byPos);
  particles.sort((a, b) => byPos(a.home, b.home));

  for (let i = 0; i < pts.length; i++) {
    if (i < particles.length) particles[i].setHome(pts[i]);
    else particles.push(new Particle(pts[i]));
  }
  particles.length = pts.length;
}

// ── marching squares ──────────────────────────────────────────────────────────

function initField() {
  cols  = ceil(width  / RES) + 2;
  rows  = ceil(height / RES) + 2;
  field = new Float32Array(cols * rows);
}

function edgeLerp(v0, v1, x0, y0, x1, y1) {
  let denom = v1 - v0;
  let t = abs(denom) < 1e-5 ? 0.5 : (SURFACE - v0) / denom;
  return { x: x0 + constrain(t, 0, 1) * (x1 - x0), y: y0 + constrain(t, 0, 1) * (y1 - y0) };
}

function drawMetaballs() {
  field.fill(0);

  let cellR = ceil(particleR / RES) + 1;
  let r2    = particleR * particleR;

  for (let p of particles) {
    let cx = floor(p.pos.x / RES);
    let cy = floor(p.pos.y / RES);
    for (let di = -cellR; di <= cellR; di++) {
      let i = cx + di;
      if (i < 0 || i >= cols) continue;
      let dx = i * RES - p.pos.x;
      for (let dj = -cellR; dj <= cellR; dj++) {
        let j = cy + dj;
        if (j < 0 || j >= rows) continue;
        let dy = j * RES - p.pos.y;
        let dSq = max(dx * dx + dy * dy, 1);
        field[i + j * cols] += r2 / dSq;
      }
    }
  }

  stroke(0);
  strokeWeight(1.5);
  noFill();

  for (let i = 0; i < cols - 1; i++) {
    for (let j = 0; j < rows - 1; j++) {
      let v_tl = field[i     +  j      * cols];
      let v_tr = field[i + 1 +  j      * cols];
      let v_br = field[i + 1 + (j + 1) * cols];
      let v_bl = field[i     + (j + 1) * cols];

      let state = 0;
      if (v_tl > SURFACE) state |= 8;
      if (v_tr > SURFACE) state |= 4;
      if (v_br > SURFACE) state |= 2;
      if (v_bl > SURFACE) state |= 1;
      if (state === 0 || state === 15) continue;

      let x = i * RES, y = j * RES, x1 = x + RES, y1 = y + RES;
      let a = edgeLerp(v_tl, v_tr, x,  y,  x1, y);
      let b = edgeLerp(v_tr, v_br, x1, y,  x1, y1);
      let c = edgeLerp(v_bl, v_br, x,  y1, x1, y1);
      let d = edgeLerp(v_tl, v_bl, x,  y,  x,  y1);

      switch (state) {
        case  1: case 14: line(c.x,c.y, d.x,d.y); break;
        case  2: case 13: line(b.x,b.y, c.x,c.y); break;
        case  3: case 12: line(b.x,b.y, d.x,d.y); break;
        case  4: case 11: line(a.x,a.y, b.x,b.y); break;
        case  5: case 10: line(a.x,a.y, d.x,d.y); line(b.x,b.y, c.x,c.y); break;
        case  6: case  9: line(a.x,a.y, c.x,c.y); break;
        case  7: case  8: line(a.x,a.y, d.x,d.y); break;
      }
    }
  }
}

// ── cellular automaton ──────────────────────────────────────────────────────────

function initCA() {
  // Clamp so a tiny/zero CA_CELL can't blow the grid up to millions of cells
  // (stepCA is O(cells), so that freezes the draw loop and blanks the canvas).
  caCellSize = max(CA_CELL, 4);
  caCols = max(1, ceil(width  / caCellSize));
  caRows = max(1, ceil(height / caCellSize));
  caGrid = new Uint8Array(caCols * caRows);
  caNext = new Uint8Array(caCols * caRows);
  for (let k = 0; k < caGrid.length; k++) caGrid[k] = random() < 0.12 ? 1 : 0;
}

// Conway's Game of Life (B3/S23) with entropy-scaled spontaneous births —
// higher entropy keeps seeding new live cells so the pattern stays active
// instead of dying out or settling into a static shape.
function stepCA() {
  let seedProb = entropyLevel * 0.05;
  for (let i = 0; i < caCols; i++) {
    for (let j = 0; j < caRows; j++) {
      let idx = i + j * caCols;
      let n = 0;
      for (let di = -1; di <= 1; di++) {
        for (let dj = -1; dj <= 1; dj++) {
          if (di === 0 && dj === 0) continue;
          let ni = (i + di + caCols) % caCols;
          let nj = (j + dj + caRows) % caRows;
          n += caGrid[ni + nj * caCols];
        }
      }
      let alive = caGrid[idx];
      let next  = alive ? (n === 2 || n === 3 ? 1 : 0) : (n === 3 ? 1 : 0);
      if (!next && random() < seedProb) next = 1;
      caNext[idx] = next;
    }
  }
  let tmp = caGrid; caGrid = caNext; caNext = tmp;
}

// Ticks the automaton faster as entropy rises; at (near) zero entropy the
// grid is forced fully dead so every particle relaxes back to its home point.
function updateCA() {
  if (entropyLevel <= 0.015) {
    caGrid.fill(0);
    return;
  }
  let interval = floor(map(entropyLevel, 0, 1, 45, 2, true));
  if (frameCount % interval === 0) stepCA();
}

// ── setup / draw ──────────────────────────────────────────────────────────────

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  initField();
  initCA();

  pg = createGraphics(width, height);
  pg.pixelDensity(1);

  document.getElementById('txt-input')
    .addEventListener('input', e => rebuildParticles(e.target.value));

  document.getElementById('entropy-slider')
    .addEventListener('input', e => { entropyLevel = e.target.value / 100; });

  document.getElementById('size-slider')
    .addEventListener('input', e => {
      particleR = map(parseFloat(e.target.value), 1, 12, 1, 50);
    });

  document.getElementById('stroke-toggle')
    .addEventListener('click', function () {
      showStrokes = !showStrokes;
      this.classList.toggle('active', showStrokes);
    });

  document.querySelectorAll('.shape-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      particleShape = this.dataset.shape;
      document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });

  document.getElementById('save-btn')
    .addEventListener('click', () => saveCanvas('entropy-type', 'png'));

  document.getElementById('font-upload')
    .addEventListener('change', function () {
      let file = this.files[0];
      if (!file) return;
      let label = document.getElementById('font-label');
      label.dataset.name = file.name.replace(/\.[^.]+$/, '');
      label.classList.add('loaded');
      loadFont(URL.createObjectURL(file), font => {
        customFont = font;
        rebuildParticles(document.getElementById('txt-input').value || 'TYPE');
      });
    });

  rebuildParticles('[type here]');
}

function draw() {
  background(255);

  updateCA();

  for (let p of particles) p.update();

  // Individual shapes (toggled)
  if (showStrokes) {
    for (let p of particles) p.show();
  }

  // Metaball join layer — always on
  drawMetaballs();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initField();
  initCA();
  pg = createGraphics(width, height);
  pg.pixelDensity(1);
  rebuildParticles(document.getElementById('txt-input').value || '[type here]');
}
