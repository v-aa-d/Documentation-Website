// Entropy Type
// Particles orbit letter-home positions; rendered as metaball contours via marching squares.

const FONT_SIZE   = 200;
const SAMPLE_STEP = 6;
const MAX_PTS     = 3000;
const RES         = 8;      // marching squares grid resolution (px)
const SURFACE     = 1.0;    // isosurface threshold

let particles    = [];
let pg;
let customFont   = null;
let entropyLevel = 0.5;
let particleR    = 18;      // blob influence radius → mapped from size slider

let field, cols, rows;
let showStrokes = true;

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

  setHome(h) { this.targetHome = h.copy(); }

  show() {
    //noFill();
    stroke(255, 60);
    circle(this.pos.x, this.pos.y, particleR * 2);
  }

  update() {
    // Gradually slide home toward target so text changes don't cause a sudden lurch
    this.home.x += (this.targetHome.x - this.home.x) * 0.08;
    this.home.y += (this.targetHome.y - this.home.y) * 0.08;

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

  const byPos = (a, b) => a.x !== b.x ? a.x - b.x : a.y - b.y;
  pts.sort(byPos);
  particles.sort((a, b) => byPos(a.home, b.home));

  for (let i = 0; i < pts.length; i++) {
    if (i < particles.length) particles[i].setHome(pts[i]);
    else particles.push(new Particle(pts[i]));
  }
  particles.length = pts.length;
}

// ── marching squares helpers ──────────────────────────────────────────────────

function edgeLerp(v0, v1, x0, y0, x1, y1) {
  let denom = v1 - v0;
  let t = abs(denom) < 1e-5 ? 0.5 : (SURFACE - v0) / denom;
  t = constrain(t, 0, 1);
  return { x: x0 + t * (x1 - x0), y: y0 + t * (y1 - y0) };
}

// ── setup / draw ──────────────────────────────────────────────────────────────

function initField() {
  cols  = ceil(width  / RES) + 2;
  rows  = ceil(height / RES) + 2;
  field = new Float32Array(cols * rows);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  initField();

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

  rebuildParticles('TYPE');
}

function draw() {
  background(0);

  // Update particles
  for (let p of particles) p.update();

  // Clear scalar field
  field.fill(0);

  // Splat each particle's influence onto the grid (forward splatting — O(particles × cellR²))
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
        let dSq = dx * dx + dy * dy;
        if (dSq < 1) dSq = 1;
        field[i + j * cols] += r2 / dSq;
      }
    }
  }

  // Individual particle circles (toggled)
  if (showStrokes) {
    for (let p of particles) p.show();
  }

  // Marching squares — draw contour at SURFACE level
  stroke(255);
  strokeWeight(1.5);
  //noFill();

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

      let x  = i * RES, y  = j * RES;
      let x1 = x + RES, y1 = y + RES;

      let a = edgeLerp(v_tl, v_tr, x,  y,  x1, y);   // top
      let b = edgeLerp(v_tr, v_br, x1, y,  x1, y1);  // right
      let c = edgeLerp(v_bl, v_br, x,  y1, x1, y1);  // bottom
      let d = edgeLerp(v_tl, v_bl, x,  y,  x,  y1);  // left

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

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initField();
  pg = createGraphics(width, height);
  pg.pixelDensity(1);
  rebuildParticles(document.getElementById('txt-input').value || 'TYPE');
}
