// Entropy Type — dot matrix
// A fixed grid of dots samples the current text's glyph fill (rasterized via
// the uploaded font, or the default font as a fallback). At zero entropy every
// dot just sits at its grid slot at its base size. Turning up the entropy
// slider doesn't move the dots at all — instead it grows the amplitude of a
// sine-wave size oscillation, with each dot's phase offset by its grid
// position, so the whole matrix reads as a wave of dots swelling and
// shrinking as it sweeps across the letterforms.

const FONT_SIZE = 200;
const SAMPLE_STEP = 7; // grid spacing in pixels — the matrix pitch
const MAX_PTS = 9000;
const WAVE_SPEED = 0.05; // radians/frame the sine wave advances
const WAVE_SPATIAL_FREQ = 0.04; // how fast phase shifts across space (wave "wavelength")

let particles = [];
let pg;
let customFont = null;
let defaultFont = null;
let entropyLevel = 0.5; // 0 = static grid, 1 = full grow/shrink sine wave
let particleSize = 3; // base size for each dot
let particleShape = "line"; // 'ellipse' | 'square' | 'point' | 'line' — how each particle is drawn

// Geometry shared by every particle renderer (live canvas, PNG export buffer,
// SVG export) so the line-angle/dot/rect math — and which shapes are stroked
// vs filled — lives in exactly one place instead of drifting across paths.
function particleGeometry(x, y, size, shape, angle) {
  if (shape === "line") {
    let len = size * 1.5;
    let dx = (Math.cos(angle) * len) / 2;
    let dy = (Math.sin(angle) * len) / 2;
    return { type: "line", strokeOnly: true, x1: x - dx, y1: y - dy, x2: x + dx, y2: y + dy };
  }
  if (shape === "point") return { type: "point", strokeOnly: true, x, y, size };
  if (shape === "square") return { type: "rect", strokeOnly: false, x, y, size };
  return { type: "dot", strokeOnly: false, x, y, size }; // 'ellipse'
}

// Sets the current stroke/fill mode for a shape's geometry. Shared so the
// live canvas and PNG export buffer can't disagree about which shapes stroke.
function applyParticleStyle(ctx, g, size) {
  if (g.strokeOnly) {
    ctx.stroke(0);
    ctx.strokeWeight(size);
    ctx.noFill();
  } else {
    ctx.noStroke();
    ctx.fill(0);
  }
}

// ctx is either the global p5 instance (`window`, in global mode) or a
// createGraphics() buffer, both of which expose the same rect/ellipse/etc API.
function drawParticleShape(ctx, x, y, size, shape, angle) {
  const g = particleGeometry(x, y, size, shape, angle);
  applyParticleStyle(ctx, g, size);
  if (g.type === "line") ctx.line(g.x1, g.y1, g.x2, g.y2);
  else if (g.type === "point") ctx.point(g.x, g.y);
  else if (g.type === "rect") ctx.rect(g.x, g.y, g.size, g.size);
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
    this.home = home.copy(); // fixed grid slot — doubles as current draw position
    this.targetHome = home.copy();
    // Phase offset by grid position — this is what makes the size oscillation
    // read as a wave traveling across the matrix rather than everything
    // pulsing in unison.
    this.phase = (home.x + home.y) * WAVE_SPATIAL_FREQ;
    this.size = particleSize;
  }

  // Soft retarget — used when the text changes, so a dot glides to its new
  // grid slot instead of snapping (which reads as a jump cut while typing).
  setTarget(h) {
    this.targetHome.set(h.x, h.y);
  }

  update() {
    this.home.lerp(this.targetHome, 0.2);

    let wave = Math.sin(frameCount * WAVE_SPEED + this.phase);
    this.size = Math.max(0.4, particleSize + wave * entropyLevel * particleSize);
  }

  show() {
    drawParticleShape(window, this.home.x, this.home.y, this.size, particleShape, this.phase);
  }
}

// ── textToPoints ──────────────────────────────────────────────────────────────

// Rasterizes txt into the offscreen buffer, then samples a regular grid
// (pitch = SAMPLE_STEP) over it — every grid cell landing on a lit pixel
// becomes a dot. That regular grid is the "matrix" the whole piece is built
// from: dots never sit at arbitrary glyph-outline positions, only at fixed
// lattice points, so text changes just toggle which lattice points are lit.
function textToPoints(txt) {
  txt = txt || " ";
  let f = customFont || defaultFont;

  let fontSize = FONT_SIZE;
  if (f) {
    textFont(f);
    textSize(fontSize);
    let bounds = f.textBounds(txt, 0, 0, fontSize);
    // Multi-line text needs a height check too, not just width — a few short
    // lines can still overflow the canvas vertically.
    let scale = Math.min(
      (width * 0.92) / bounds.w,
      (height * 0.7) / bounds.h,
      1,
    );
    if (scale < 1) fontSize *= scale;
  }

  pg.background(0);
  pg.fill(255);
  pg.noStroke();
  pg.textSize(fontSize);
  pg.textStyle(BOLD);
  if (f) pg.textFont(f);
  pg.textAlign(CENTER, CENTER);
  pg.text(txt, pg.width / 2, pg.height / 2);
  pg.loadPixels();

  let pts = [];
  for (let x = 0; x < pg.width; x += SAMPLE_STEP) {
    for (let y = 0; y < pg.height; y += SAMPLE_STEP) {
      if (pg.pixels[(x + y * pg.width) * 4] > 128) {
        pts.push(createVector(x, y));
      }
    }
  }

  return pts;
}

// ── rebuild ───────────────────────────────────────────────────────────────────

function rebuildParticles(txt) {
  let pts = textToPoints(txt || " ");
  if (pts.length > MAX_PTS) {
    // Fisher-Yates shuffle then truncate — O(n), unlike repeatedly splicing
    // out a random element (O(n) per removal, O(n·overflow) overall).
    for (let i = pts.length - 1; i > 0; i--) {
      const j = Math.floor(random(i + 1));
      [pts[i], pts[j]] = [pts[j], pts[i]];
    }
    pts.length = MAX_PTS;
  }

  // Stable left-to-right, top-to-bottom order so re-assignment on text change
  // is visually coherent rather than random.
  pts.sort((a, b) => (a.y !== b.y ? a.y - b.y : a.x - b.x));

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
  rectMode(CENTER);
  ellipseMode(CENTER);

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
function shapeToSVG(x, y, size, shape, angle) {
  const g = particleGeometry(x, y, size, shape, angle);
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
      shapeToSVG(p.home.x, p.home.y, p.size, particleShape, p.phase) + "\n";
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

  for (const p of particles) {
    drawParticleShape(
      g,
      p.home.x * EXPORT_SCALE,
      p.home.y * EXPORT_SCALE,
      p.size * EXPORT_SCALE,
      particleShape,
      p.phase,
    );
  }

  g.save("entropy-type.png");
  g.remove();
}

function draw() {
  background(255);

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
