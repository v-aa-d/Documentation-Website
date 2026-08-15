// Entropy Type
// Particles orbit their letter-home positions in elliptical paths (à la mySketch.js)
// Perlin noise modulates orbit radius, creating chemical-entropy disorder/order cycling.
//
// The particle <-> letter-point assignment is itself a permutation that is animated
// with a running bubble sort: every frame a bubble-sort comparison pass pulls the
// permutation back toward identity (the formed letter), while entropy injects random
// adjacent transpositions that fight it. The slider therefore controls disorder the
// same way it's classically defined — as a tug-of-war between an ordering process and
// randomizing noise — rather than just scaling a wiggle amplitude.

const FONT_SIZE   = 200;
const SAMPLE_STEP = 5;
const MAX_PTS     = 9000;

let particles     = [];
let letterPoints  = [];   // fixed reference set of glyph points for the current text
let order         = [];   // order[i] = index into letterPoints currently targeted by particles[i]
let letterRanges  = [];   // [start, end) index ranges into order/letterPoints, one per character —
                           // bubble-sort passes and entropy swaps never cross a range boundary
let pg;
let customFont    = null;
let defaultFont   = null;
let entropyLevel  = 0.5;   // 0 = ordered, 1 = maximum chaos
let particleSize  = 3;     // stroke weight for each dot

// ── preload ──────────────────────────────────────────────────────────────────

function preload() {
  loadFont('fonts/Arial-Bold.ttf',
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

    this.angle = random(TWO_PI);
    this.speed = random(0.018, 0.06);
    this.rx    = random(5, 16);
    this.ry    = random(3, 12);
    this.seed  = random(10000);
  }

  // Hard reset — used when the text itself changes, so the particle snaps
  // straight to its new slot instead of bubble-sorting in from the old text.
  setHome(h) {
    this.home.set(h.x, h.y);
    this.targetHome.set(h.x, h.y);
  }

  // Soft retarget — used every frame as the bubble-sort permutation evolves,
  // so a swap reads as the two particles gliding past each other.
  setTarget(h) {
    this.targetHome.set(h.x, h.y);
  }

  update() {
    this.home.x += (this.targetHome.x - this.home.x) * 0.15;
    this.home.y += (this.targetHome.y - this.home.y) * 0.15;

    this.angle += this.speed;

    let e    = noise(this.seed + frameCount * 0.003);
    let maxR = map(entropyLevel, 0, 1, 0.3, 4.5);
    let rxN  = this.rx * map(e, 0, 1, 0.15, maxR);
    let ryN  = this.ry * map(e, 0, 1, 0.15, maxR);

    let tx = this.home.x + cos(this.angle) * rxN;
    let ty = this.home.y + sin(this.angle) * ryN;

    let fx = (tx - this.pos.x) * 0.12;
    let fy = (ty - this.pos.y) * 0.12;

    let thermalAngle = noise(this.seed * 0.5, frameCount * 0.009) * TWO_PI * 4;
    let thermalMag   = noise(this.seed * 1.3, frameCount * 0.006) * 1.4 * entropyLevel;
    fx += cos(thermalAngle) * thermalMag;
    fy += sin(thermalAngle) * thermalMag;

    this.vel.x = (this.vel.x + fx) * 0.80;
    this.vel.y = (this.vel.y + fy) * 0.80;
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;
  }

  show() {
    rect(this.pos.x, this.pos.y, particleSize, particleSize);
  }
}

// ── textToPoints ──────────────────────────────────────────────────────────────

function textToPoints(txt) {
  txt = txt || ' ';
  let lines = txt.split('\n');
  let f = customFont || defaultFont;

  let fontSize = FONT_SIZE;
  let bounds = null;
  if (f) {
    textFont(f);
    textSize(fontSize);
    bounds = f.textBounds(txt, 0, 0, fontSize);
    // Multi-line text needs a height check too, not just width — a few short
    // lines can still overflow the canvas vertically.
    let scale = Math.min((width * 0.92) / bounds.w, (height * 0.7) / bounds.h, 1);
    if (scale < 1) {
      fontSize *= scale;
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

  // Per-character x/y-ranges in pg space, so every sampled point can be tagged with
  // which letter it belongs to — that tag is what keeps bubble-sort entropy from
  // ever swapping a point across a letter boundary. Lines stack downward using the
  // font's own leading, matching how pg.text()/font.textToPoints() lay out the
  // same \n-joined string, so the bands line up with what's actually drawn.
  let ox, oy, leading, charBounds = [];
  if (f) {
    // Anchor the pixel fill and the glyph outline to the exact same baseline-left
    // origin — font.textToPoints positions text as a LEFT/BASELINE pen origin, so
    // rendering the fill with CENTER/CENTER (a different alignment system) would
    // make the two point sets land on slightly different geometry.
    ox = pg.width  / 2 - bounds.w / 2 - bounds.x;
    oy = pg.height / 2 - bounds.h / 2 - bounds.y;
    leading = pg.textLeading();
    pg.textAlign(LEFT, BASELINE);
    pg.text(txt, ox, oy);

    for (let li = 0; li < lines.length; li++) {
      let lineY = oy + li * leading;
      let cum = 0;
      for (let i = 0; i < lines[li].length; i++) {
        let w = pg.textWidth(lines[li][i]);
        charBounds.push({ x0: ox + cum, x1: ox + cum + w, y0: lineY - leading / 2, y1: lineY + leading / 2 });
        cum += w;
      }
    }
  } else {
    pg.textAlign(CENTER, CENTER);
    pg.text(txt, pg.width / 2, pg.height / 2);
    leading = pg.textLeading();

    let startY = pg.height / 2 - (leading * (lines.length - 1)) / 2;
    for (let li = 0; li < lines.length; li++) {
      let lineY = startY + li * leading;
      let startX = pg.width / 2 - pg.textWidth(lines[li]) / 2;
      let cum = 0;
      for (let i = 0; i < lines[li].length; i++) {
        let w = pg.textWidth(lines[li][i]);
        charBounds.push({ x0: startX + cum, x1: startX + cum + w, y0: lineY - leading / 2, y1: lineY + leading / 2 });
        cum += w;
      }
    }
  }
  pg.loadPixels();

  const letterOf = (x, y) => {
    for (let i = 0; i < charBounds.length; i++) {
      const c = charBounds[i];
      if (x >= c.x0 && x < c.x1 && y >= c.y0 && y < c.y1) return i;
    }
    // Serif/italic overhang can land just outside a char's measured box —
    // fall back to whichever range is closest instead of losing the point.
    let best = 0, bestD = Infinity;
    for (let i = 0; i < charBounds.length; i++) {
      const c = charBounds[i];
      let dx = x < c.x0 ? c.x0 - x : (x >= c.x1 ? x - c.x1 : 0);
      let dy = y < c.y0 ? c.y0 - y : (y >= c.y1 ? y - c.y1 : 0);
      let d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  };

  let pts = [];
  for (let x = 0; x < pg.width; x += SAMPLE_STEP) {
    for (let y = 0; y < pg.height; y += SAMPLE_STEP) {
      if (pg.pixels[(x + y * pg.width) * 4] > 128) {
        let v = createVector(x, y);
        v.li = letterOf(x, y);
        pts.push(v);
      }
    }
  }

  // Outline — p5's Font.textToPoints traces the actual glyph contours,
  // giving crisp points along the outer and inner (counter) edges of each letter.
  if (f) {
    try {
      let outline = f.textToPoints(txt, ox, oy, fontSize, { sampleFactor: 0.35, simplifyThreshold: 0 });
      for (let p of outline) {
        let v = createVector(p.x, p.y);
        v.li = letterOf(p.x, p.y);
        pts.push(v);
      }
    } catch {
      // Some fonts/environments can't extract outlines — fill points above still cover it.
    }
  }

  return pts;
}

// ── bubble-sort entropy ─────────────────────────────────────────────────────────

function resetOrder(n) {
  order = new Array(n);
  for (let i = 0; i < n; i++) order[i] = i;
}

// Classic bubble-sort inner pass: compare each adjacent pair and swap it into
// order if it isn't. This is the "cooling" force constantly pulling the particle
// <-> point assignment back toward identity, i.e. the letter re-forming. Because
// bubble sort only ever swaps neighbors, an element that's badly out of place
// needs many passes to walk home — so run several passes per frame, otherwise
// the letter would take minutes to visibly resolve.
//
// Every pass (and the entropy injection below) is confined to a single
// letterRanges entry, so a swap can only ever trade two points belonging to
// the same character — entropy scrambles a letter internally, never bleeds
// points across into a neighboring letter.
const PASSES_PER_FRAME = 12;

function bubbleSortPass() {
  for (const [start, end] of letterRanges) {
    for (let i = start; i < end - 1; i++) {
      if (order[i] > order[i + 1]) {
        const tmp = order[i];
        order[i] = order[i + 1];
        order[i + 1] = tmp;
      }
    }
  }
}

// Entropy's "heating" force: random long-range transpositions injected at a
// rate driven by the slider, fighting the bubble sort passes above so the
// permutation settles into an equilibrium disorder proportional to entropyLevel.
// (Adjacent-only swaps here would barely be visible, since each letter's points
// are themselves sorted spatially — neighboring indices already sit next to
// each other.)
function injectEntropy() {
  for (const [start, end] of letterRanges) {
    const n = end - start;
    if (n < 2) continue;
    const swaps = floor(entropyLevel * entropyLevel * n * 0.03);
    for (let s = 0; s < swaps; s++) {
      const i = start + floor(random(n));
      const j = start + floor(random(n));
      const tmp = order[i];
      order[i] = order[j];
      order[j] = tmp;
    }
  }
}

function updateOrder() {
  for (let k = 0; k < PASSES_PER_FRAME; k++) bubbleSortPass();
  injectEntropy();
  for (let i = 0; i < order.length; i++) {
    particles[i].setTarget(letterPoints[order[i]]);
  }
}

// ── rebuild ───────────────────────────────────────────────────────────────────

function rebuildParticles(txt) {
  let pts = textToPoints(txt || ' ');
  while (pts.length > MAX_PTS) pts.splice(floor(random(pts.length)), 1);

  // Group by character first, then by position within the character — this
  // makes each letter's points a contiguous index range, which is what lets
  // bubbleSortPass/injectEntropy stay confined to a single letter.
  const byGroup = (a, b) => a.li !== b.li ? a.li - b.li : (a.x !== b.x ? a.x - b.x : a.y - b.y);
  pts.sort(byGroup);

  letterPoints = pts;
  resetOrder(pts.length);

  letterRanges = [];
  for (let i = 0, start = 0; i <= pts.length; i++) {
    if (i === pts.length || pts[i].li !== pts[start].li) {
      if (i > start) letterRanges.push([start, i]);
      start = i;
    }
  }

  for (let i = 0; i < pts.length; i++) {
    if (i < particles.length) particles[i].setHome(pts[i]);
    else particles.push(new Particle(pts[i]));
  }
  particles.length = pts.length;
}

// ── setup / draw ──────────────────────────────────────────────────────────────

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  pg = createGraphics(width, height);
  pg.pixelDensity(1);

  // Text input
  document.getElementById('txt-input')
    .addEventListener('input', e => rebuildParticles(e.target.value));

  // Entropy slider
  document.getElementById('entropy-slider')
    .addEventListener('input', e => { entropyLevel = e.target.value / 100; });

  // Size slider
  document.getElementById('size-slider')
    .addEventListener('input', e => { particleSize = parseFloat(e.target.value); });

  // Font upload — load via blob URL so p5 loadFont can handle it
  document.getElementById('font-upload')
    .addEventListener('change', function () {
      let file = this.files[0];
      if (!file) return;
      let label = document.getElementById('font-label');
      label.dataset.name = file.name.replace(/\.[^.]+$/, '');
      label.classList.add('loaded');
      let url = URL.createObjectURL(file);
      loadFont(url, font => {
        customFont = font;
        let txt = document.getElementById('txt-input').value || 'TYPE';
        rebuildParticles(txt);
      });
    });

  rebuildParticles('TYPE');
}

function draw() {
  background(255);
  noStroke();
  fill(0);
  rectMode(CENTER);

  updateOrder();

  for (let p of particles) {
    p.update();
    p.show();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  pg = createGraphics(width, height);
  pg.pixelDensity(1);
  rebuildParticles(document.getElementById('txt-input').value || 'TYPE');
}
