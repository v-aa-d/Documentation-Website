// Entropy Type
// Particles orbit their letter-home positions in elliptical paths (à la mySketch.js)
// Perlin noise modulates orbit radius, creating chemical-entropy disorder/order cycling.
//
// The particle <-> letter-point assignment is itself a permutation that is animated
// with a running bubble sort: every frame a bubble-sort comparison pass pulls the
// permutation back toward identity (the formed letter), while a per-letter
// elementary cellular automaton (Wolfram Rule 30) injects the adjacent
// transpositions that fight it. Each letter owns its own CA row — the row's
// live-cell pattern *is* that letter's local disorder, so entropy is generated
// by an actual automaton rather than by calling random(). The slider controls
// how often each row steps forward (heating) versus how often live cells die
// off (cooling), so it's still a tug-of-war between order and disorder — just
// with the disorder now coming from genuine CA dynamics.

const FONT_SIZE = 200;
const SAMPLE_STEP = 5;
const MAX_PTS = 9000;

let particles = [];
let letterPoints = []; // fixed reference set of glyph points for the current text
let order = []; // order[i] = index into letterPoints currently targeted by particles[i]
let letterRanges = []; // [start, end) index ranges into order/letterPoints, one per character —
// bubble-sort passes and entropy swaps never cross a range boundary
let caRows = []; // one Rule-30 cellular-automaton row per letterRanges entry — the row's
// live-cell pattern is that letter's local entropy source
let pg;
let customFont = null;
let defaultFont = null;
let entropyLevel = 0.5; // 0 = ordered, 1 = maximum chaos
let particleSize = 3; // stroke weight for each dot
let particleShape = "line"; // 'ellipse' | 'square' | 'point' | 'line' — how each particle is drawn

// Geometry shared by every particle renderer (live canvas, PNG export buffer,
// SVG export) so the line-angle/dot/rect math lives in exactly one place.
function particleGeometry(x, y, size, shape, vel, fallbackAngle) {
  if (shape === "line") {
    let a = vel.magSq() > 0.0001 ? Math.atan2(vel.y, vel.x) : fallbackAngle;
    let len = size * 1.5;
    let dx = (Math.cos(a) * len) / 2;
    let dy = (Math.sin(a) * len) / 2;
    return { type: "line", x1: x - dx, y1: y - dy, x2: x + dx, y2: y + dy };
  }
  if (shape === "square") return { type: "rect", x, y, size };
  return { type: "dot", x, y, size }; // 'point' and 'ellipse' both render as a round dot
}

// ctx is either the global p5 instance (`window`, in global mode) or a
// createGraphics() buffer, both of which expose the same rect/ellipse/etc API.
function drawParticleShape(ctx, x, y, size, shape, vel, fallbackAngle) {
  const g = particleGeometry(x, y, size, shape, vel, fallbackAngle);
  if (g.type === "line") ctx.line(g.x1, g.y1, g.x2, g.y2);
  else if (g.type === "rect") ctx.rect(g.x, g.y, g.size, g.size);
  else if (shape === "point") ctx.point(g.x, g.y);
  else ctx.ellipse(g.x, g.y, g.size, g.size);
}

// ── preload ──────────────────────────────────────────────────────────────────

function preload() {
  loadFont(
    "fonts/Arial-Bold.ttf",
    (f) => {
      defaultFont = f;
    },
    () => {
      defaultFont = null;
    },
  ); // fine to fail — falls back to pixel-sampled fill only
}

// ── Particle ──────────────────────────────────────────────────────────────────

class Particle {
  constructor(home) {
    this.home = home.copy();
    this.targetHome = home.copy();
    this.pos = home.copy();
    this.vel = createVector(0, 0);

    this.angle = random(TWO_PI);
    this.speed = random(0.018, 0.06);
    this.rx = random(5, 16);
    this.ry = random(3, 12);
    this.seed = random(10000);
  }

  // Soft retarget — used both when the bubble-sort permutation evolves and
  // when the text itself changes, so a particle always glides to its new
  // slot instead of snapping (which reads as a jump cut while typing).
  setTarget(h) {
    this.targetHome.set(h.x, h.y);
  }

  update() {
    this.home.x += (this.targetHome.x - this.home.x) * 0.15;
    this.home.y += (this.targetHome.y - this.home.y) * 0.15;

    this.angle += this.speed;

    let e = noise(this.seed + frameCount * 0.003);
    let maxR = map(entropyLevel, 0, 1, 0.3, 4.5);
    let rxN = this.rx * map(e, 0, 1, 0.15, maxR);
    let ryN = this.ry * map(e, 0, 1, 0.15, maxR);

    let tx = this.home.x + cos(this.angle) * rxN;
    let ty = this.home.y + sin(this.angle) * ryN;

    let fx = (tx - this.pos.x) * 0.12;
    let fy = (ty - this.pos.y) * 0.12;

    let thermalAngle = noise(this.seed * 0.5, frameCount * 0.009) * TWO_PI * 4;
    let thermalMag =
      noise(this.seed * 1.3, frameCount * 0.006) * 1.4 * entropyLevel;
    fx += cos(thermalAngle) * thermalMag;
    fy += sin(thermalAngle) * thermalMag;

    this.vel.x = (this.vel.x + fx) * 0.8;
    this.vel.y = (this.vel.y + fy) * 0.8;
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;
  }

  show() {
    drawParticleShape(
      window,
      this.pos.x,
      this.pos.y,
      particleSize,
      particleShape,
      this.vel,
      this.angle,
    );
  }
}

// ── textToPoints ──────────────────────────────────────────────────────────────

function textToPoints(txt) {
  txt = txt || " ";
  let lines = txt.split("\n");
  let f = customFont || defaultFont;

  let fontSize = FONT_SIZE;
  let bounds = null;
  if (f) {
    textFont(f);
    textSize(fontSize);
    bounds = f.textBounds(txt, 0, 0, fontSize);
    // Multi-line text needs a height check too, not just width — a few short
    // lines can still overflow the canvas vertically.
    let scale = Math.min(
      (width * 0.92) / bounds.w,
      (height * 0.7) / bounds.h,
      1,
    );
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
  let ox,
    oy,
    leading,
    charBounds = [];
  if (f) {
    // Anchor the pixel fill and the glyph outline to the exact same baseline-left
    // origin — font.textToPoints positions text as a LEFT/BASELINE pen origin, so
    // rendering the fill with CENTER/CENTER (a different alignment system) would
    // make the two point sets land on slightly different geometry.
    ox = pg.width / 2 - bounds.w / 2 - bounds.x;
    oy = pg.height / 2 - bounds.h / 2 - bounds.y;
    leading = pg.textLeading();
    pg.textAlign(LEFT, BASELINE);
    pg.text(txt, ox, oy);

    for (let li = 0; li < lines.length; li++) {
      let lineY = oy + li * leading;
      let cum = 0;
      for (let i = 0; i < lines[li].length; i++) {
        let w = pg.textWidth(lines[li][i]);
        charBounds.push({
          x0: ox + cum,
          x1: ox + cum + w,
          y0: lineY - leading / 2,
          y1: lineY + leading / 2,
        });
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
        charBounds.push({
          x0: startX + cum,
          x1: startX + cum + w,
          y0: lineY - leading / 2,
          y1: lineY + leading / 2,
        });
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
    let best = 0,
      bestD = Infinity;
    for (let i = 0; i < charBounds.length; i++) {
      const c = charBounds[i];
      let dx = x < c.x0 ? c.x0 - x : x >= c.x1 ? x - c.x1 : 0;
      let dy = y < c.y0 ? c.y0 - y : y >= c.y1 ? y - c.y1 : 0;
      let d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
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
      let outline = f.textToPoints(txt, ox, oy, fontSize, {
        sampleFactor: 0.35,
        simplifyThreshold: 0,
      });
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

// ── cellular automaton (Wolfram elementary CA, Rule 30) ─────────────────────────

// Rule 30's lookup table: for each 3-cell neighborhood (left, center, right),
// packed as a 3-bit index, the bit of 30 at that index gives the next state.
// Rule 30 is the canonical chaotic elementary CA — a single seed cell grows
// into an irregular, high-entropy pattern, which is exactly the disorder
// source each letter needs.
function ruleTable(ruleNumber) {
  const table = new Array(8);
  for (let n = 0; n < 8; n++) table[n] = (ruleNumber >> n) & 1;
  return table;
}
const CA_RULE = ruleTable(30);

function makeCaRow(n) {
  const row = new Array(n).fill(0);
  row[Math.floor(n / 2)] = 1; // classic single-seed start
  return row;
}

// One generation of the automaton, wrapping at the row's edges so a letter
// with few points doesn't just die out against a zero boundary.
function caStep(row) {
  const n = row.length;
  const next = new Array(n);
  for (let i = 0; i < n; i++) {
    const left = row[(i - 1 + n) % n];
    const center = row[i];
    const right = row[(i + 1) % n];
    next[i] = CA_RULE[(left << 2) | (center << 1) | right];
  }
  return next;
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

// Entropy's "heating" force, now sourced from each letter's own Rule-30 CA row
// instead of random() calls. Every frame, each row either steps forward
// (spreading its live-cell pattern, i.e. generating more disorder) or cools
// (live cells probabilistically die, relaxing the row back toward all-dead —
// the identity permutation). The slider sets both probabilities, so it still
// fights the bubble sort passes above and settles into an equilibrium disorder
// proportional to entropyLevel — but the disorder pattern itself is genuine
// cellular-automaton output: wherever a cell is alive, that letter-local pair
// of points gets transposed.
function injectEntropy() {
  for (let gi = 0; gi < letterRanges.length; gi++) {
    const [start, end] = letterRanges[gi];
    const n = end - start;
    if (n < 2) continue;

    let row = caRows[gi];

    if (random() < entropyLevel) {
      row = caStep(row); // heating: advance the automaton a generation
    }
    if (random() > entropyLevel) {
      const deaths = Math.ceil(n * 0.05); // cooling: kill off some live cells
      for (let d = 0; d < deaths; d++) row[floor(random(n))] = 0;
    }

    caRows[gi] = row;

    for (let i = 0; i < n - 1; i++) {
      if (row[i]) {
        const a = start + i,
          b = start + i + 1;
        const tmp = order[a];
        order[a] = order[b];
        order[b] = tmp;
      }
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
  let pts = textToPoints(txt || " ");
  while (pts.length > MAX_PTS) pts.splice(floor(random(pts.length)), 1);

  // Group by character first, then by position within the character — this
  // makes each letter's points a contiguous index range, which is what lets
  // bubbleSortPass/injectEntropy stay confined to a single letter.
  const byGroup = (a, b) =>
    a.li !== b.li ? a.li - b.li : a.x !== b.x ? a.x - b.x : a.y - b.y;
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
  caRows = letterRanges.map(([s, e]) => makeCaRow(e - s));

  for (let i = 0; i < pts.length; i++) {
    if (i < particles.length) particles[i].setTarget(pts[i]);
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
  document
    .getElementById("txt-input")
    .addEventListener("input", (e) => rebuildParticles(e.target.value));

  // Entropy slider
  document.getElementById("entropy-slider").addEventListener("input", (e) => {
    entropyLevel = e.target.value / 100;
  });

  // Size slider
  document.getElementById("size-slider").addEventListener("input", (e) => {
    particleSize = parseFloat(e.target.value);
  });

  // Font upload — load via blob URL so p5 loadFont can handle it
  document
    .getElementById("font-upload")
    .addEventListener("change", function () {
      let file = this.files[0];
      if (!file) return;
      let label = document.getElementById("font-label");
      label.dataset.name = file.name.replace(/\.[^.]+$/, "");
      label.classList.add("loaded");
      let url = URL.createObjectURL(file);
      loadFont(url, (font) => {
        customFont = font;
        let txt = document.getElementById("txt-input").value || "TYPE";
        rebuildParticles(txt);
      });
    });

  // Export
  document.getElementById("export-png").addEventListener("click", exportPNG);
  document.getElementById("export-svg").addEventListener("click", exportSVG);

  rebuildParticles("TYPE");
}

// ── export ────────────────────────────────────────────────────────────────────

// Canvas is raster-only, so an SVG export has to be built by hand: one shape
// element per currently visible particle, mirroring drawParticleShape() above.
// The shape name is stamped as a data-shape attribute (and a leading comment)
// on the root <svg> so the file itself records which particleShape produced it.
function shapeToSVG(x, y, size, shape, vel, fallbackAngle) {
  const g = particleGeometry(x, y, size, shape, vel, fallbackAngle);
  if (g.type === "line") {
    return `<line x1="${g.x1.toFixed(2)}" y1="${g.y1.toFixed(2)}" x2="${g.x2.toFixed(2)}" y2="${g.y2.toFixed(2)}" stroke="#000" stroke-width="${size.toFixed(2)}"/>`;
  }
  if (g.type === "rect") {
    return `<rect x="${(g.x - g.size / 2).toFixed(2)}" y="${(g.y - g.size / 2).toFixed(2)}" width="${g.size.toFixed(2)}" height="${g.size.toFixed(2)}" fill="#000"/>`;
  }
  return `<circle cx="${g.x.toFixed(2)}" cy="${g.y.toFixed(2)}" r="${(g.size / 2).toFixed(2)}" fill="#000"/>`;
}

function exportSVG() {
  let shapes = "";
  for (const p of particles) {
    shapes +=
      shapeToSVG(
        p.pos.x,
        p.pos.y,
        particleSize,
        particleShape,
        p.vel,
        p.angle,
      ) + "\n";
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" data-shape="${particleShape}">\n<!-- particleShape: ${particleShape} -->\n<rect width="100%" height="100%" fill="#fff"/>\n${shapes}</svg>`;

  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "entropy-type.svg";
  a.click();
  URL.revokeObjectURL(url);
}

// Raster canvas exports at the screen's 1x/2x pixel density, which lands well
// under print-quality 300dpi. Redraw the current frame into an offscreen buffer
// scaled up to hit 300dpi (at CSS 96dpi baseline) before saving, so the PNG holds
// up in print rather than just on-screen.
const EXPORT_DPI = 300;
const SCREEN_DPI = 96;
const EXPORT_SCALE = EXPORT_DPI / SCREEN_DPI;

function exportPNG() {
  const g = createGraphics(
    Math.round(width * EXPORT_SCALE),
    Math.round(height * EXPORT_SCALE),
  );
  g.pixelDensity(1);
  g.background(255);
  g.rectMode(CENTER);
  g.ellipseMode(CENTER);

  if (particleShape === "point" || particleShape === "line") {
    g.stroke(0);
    g.strokeWeight(particleSize * EXPORT_SCALE);
    g.noFill();
  } else {
    g.noStroke();
    g.fill(0);
  }

  for (const p of particles) {
    drawParticleShape(
      g,
      p.pos.x * EXPORT_SCALE,
      p.pos.y * EXPORT_SCALE,
      particleSize * EXPORT_SCALE,
      particleShape,
      p.vel,
      p.angle,
    );
  }

  g.save("entropy-type.png");
  g.remove();
}

function draw() {
  background(255);
  rectMode(CENTER);
  ellipseMode(CENTER);

  if (particleShape === "point" || particleShape === "line") {
    stroke(0);
    strokeWeight(particleSize);
    noFill();
  } else {
    noStroke();
    fill(0);
  }

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
  rebuildParticles(document.getElementById("txt-input").value || "TYPE");
}
