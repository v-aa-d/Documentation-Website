// Entropy Type
// Particles orbit their letter-home positions in elliptical paths (à la mySketch.js)
// Perlin noise modulates orbit radius, creating chemical-entropy disorder/order cycling

const FONT_SIZE   = 200;
const SAMPLE_STEP = 5;
const MAX_PTS     = 5000;

let particles    = [];
let pg;
let customFont   = null;
let entropyLevel = 0.5;   // 0 = ordered, 1 = maximum chaos
let particleSize = 3;     // stroke weight for each dot

// ── Particle ──────────────────────────────────────────────────────────────────

class Particle {
  constructor(home) {
    this.home = home.copy();
    this.pos  = home.copy();
    this.vel  = createVector(0, 0);

    this.angle = random(TWO_PI);
    this.speed = random(0.018, 0.06);
    this.rx    = random(5, 16);
    this.ry    = random(3, 12);
    this.seed  = random(10000);
  }

  setHome(h) { this.home = h.copy(); }

  update() {
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
    let d   = dist(this.pos.x, this.pos.y, this.home.x, this.home.y);
    let bri = map(d, 0, 40, 255, 120, true);
    stroke(bri);
    point(this.pos.x, this.pos.y);
  }
}

// ── textToPoints ──────────────────────────────────────────────────────────────

function textToPoints(txt) {
  pg.background(0);
  pg.fill(255);
  pg.noStroke();
  pg.textSize(FONT_SIZE);
  pg.textStyle(BOLD);
  pg.textAlign(CENTER, CENTER);
  if (customFont) pg.textFont(customFont);
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
  let pts = textToPoints(txt || ' ');
  while (pts.length > MAX_PTS) pts.splice(floor(random(pts.length)), 1);

  // Sort both sets by x then y so each particle travels the shortest distance
  // when the centered text layout shifts (e.g. a new character is typed).
  const byPos = (a, b) => a.x !== b.x ? a.x - b.x : a.y - b.y;
  pts.sort(byPos);
  particles.sort((a, b) => byPos(a.home, b.home));

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
  background(0);
  strokeWeight(particleSize);

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
