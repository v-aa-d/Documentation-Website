/*
  Quantum Grid Typography — Bloch Sphere Model
  ─────────────────────────────────────────────
  Each circle is a qubit with a genuine two-state superposition:

    |ψ(t)⟩ = cos(θ/2)|0⟩ + e^(iφ)·sin(θ/2)|1⟩

  Two independent physical processes drive each qubit:

    θ(t) = θ₀ + ωᵣ·t   — Rabi rotation: transfers population between |0⟩ and |1⟩
    φ(t) = φ₀ + ωz·t   — Larmor precession: evolves the complex phase

  P(filled) = sin²(θ/2)  — oscillates between 0 and 1 (full Rabi cycle)
  P(empty)  = cos²(θ/2)  = 1 − P(filled)

  Both eigenstates are shown through a visible Y-axis rotation (coin spin):
    • Front face visible (cos θ > 0) → empty circle     — the |0⟩ component
    • Back face visible  (cos θ < 0) → filled black disc — the |1⟩ component
    • Squish = |cos θ|: thin line at θ=π/2 = maximum superposition (50/50)
  ~8 adjacent cell pairs are Bell-entangled: |Φ+⟩ = (|00⟩ + |11⟩)/√2
    Entangled cells always collapse to the same outcome when measured.
    A faint blue line links each pair while in superposition.

  SPACE — wavefunction collapse → projects onto the next letter pointer state (A→B→C…)
  CLICK — toggle any circle (auto-collapses first if needed)
*/

// ┌─────────────────────────────────────────────────────────────────────────────
// │  GRID CONFIG — edit these values and reload
// ├─────────────────────────────────────────────────────────────────────────────
// │  COLS / ROWS   number of circles
// │  R             circle radius in pixels
// │  OVERLAP       spacing fraction (0.5 = touching, <0.5 = gap, >0.5 = overlap)
// │
// │  GRID_SHAPE    layout of rows:
// │    'square'    — no row offset, orthogonal grid
// │    'triangle'  — alternating half-step offset (hex / brick lattice)
// │    'quad'      — each row shifts by half a step → parallelogram
// │
// │  CELL_SHAPE    shape drawn at each cell position:
// │    'circle'    — disc / ellipse (default)
// │    'square'    — rectangle
// │    'triangle'  — upward-pointing triangle
// │    'diamond'   — upright rhombus (squishes horizontally)
// │    'rhombus'   — parallelogram (flat top/bottom, slants right)
// └─────────────────────────────────────────────────────────────────────────────
const COLS = 5;
const ROWS = 10;
const R          = 46;
const OVERLAP    = 0.62;
const GRID_SHAPE = 'square';     // 'square' | 'triangle' | 'quad'
const CELL_SHAPE = 'square';   // 'circle' | 'square' | 'triangle' | 'diamond' | 'rhombus'

const TWO_PI = Math.PI * 2;

let cells          = [];
let entangledPairs = [];
let collapsed      = false;

// Each letter is a pointer state for the decoherence channel — a 5×8 pixel-font
// pattern. Collapse always projects onto the current letter, then advances the
// sequence A→B→C→…→Z→A.  Rows are strings of length 5; 'X' = filled cell.
const ALPHABET_PATTERNS = [
  ['.XXX.', '.X.X.', 'X...X', 'X...X', 'XXXXX', 'X...X', 'X...X', 'X...X'], // A
  ['XXXX.', 'X...X', 'X...X', 'XXXX.', 'X...X', 'X...X', 'X...X', 'XXXX.'], // B
  ['.XXXX', 'X....', 'X....', 'X....', 'X....', 'X....', 'X....', '.XXXX'], // C
  ['XXXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', 'XXXX.'], // D
  ['XXXXX', 'X....', 'X....', 'XXXX.', 'X....', 'X....', 'X....', 'XXXXX'], // E
  ['XXXXX', 'X....', 'X....', 'XXXX.', 'X....', 'X....', 'X....', 'X....'], // F
  ['.XXXX', 'X....', 'X....', 'X.XXX', 'X...X', 'X...X', 'X...X', '.XXXX'], // G
  ['X...X', 'X...X', 'X...X', 'XXXXX', 'X...X', 'X...X', 'X...X', 'X...X'], // H
  ['XXXXX', '..X..', '..X..', '..X..', '..X..', '..X..', '..X..', 'XXXXX'], // I
  ['....X', '....X', '....X', '....X', '....X', 'X...X', 'X...X', '.XXX.'], // J
  ['X...X', 'X..X.', 'X.X..', 'XX...', 'XX...', 'X.X..', 'X..X.', 'X...X'], // K
  ['X....', 'X....', 'X....', 'X....', 'X....', 'X....', 'X....', 'XXXXX'], // L
  ['X...X', 'XX.XX', 'X.X.X', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X'], // M
  ['X...X', 'XX..X', 'XX..X', 'X.X.X', 'X.X.X', 'X..XX', 'X..XX', 'X...X'], // N
  ['.XXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.'], // O
  ['XXXX.', 'X...X', 'X...X', 'XXXX.', 'X....', 'X....', 'X....', 'X....'], // P
  ['.XXX.', 'X...X', 'X...X', 'X...X', 'X.X.X', 'X..XX', 'X...X', '.XXXX'], // Q
  ['XXXX.', 'X...X', 'X...X', 'XXXX.', 'X.X..', 'X..X.', 'X...X', 'X...X'], // R
  ['.XXXX', 'X....', 'X....', '.XXX.', '....X', '....X', '....X', 'XXXX.'], // S
  ['XXXXX', '..X..', '..X..', '..X..', '..X..', '..X..', '..X..', '..X..'], // T
  ['X...X', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.'], // U
  ['X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.X.X.', '.X.X.', '..X..'], // V
  ['X...X', 'X...X', 'X...X', 'X.X.X', 'X.X.X', 'X.X.X', 'XX.XX', 'X...X'], // W
  ['X...X', 'X...X', '.X.X.', '.X.X.', '..X..', '.X.X.', 'X...X', 'X...X'], // X
  ['X...X', 'X...X', '.X.X.', '.X.X.', '..X..', '..X..', '..X..', '..X..'], // Y
  ['XXXXX', '....X', '...X.', '..X..', '.X...', 'X....', 'X....', 'XXXXX'], // Z
];

// Scale each 5×8 pattern to fill the full COLS×ROWS grid via nearest-neighbor sampling.
const PAT_COLS = ALPHABET_PATTERNS[0][0].length; // 5
const PAT_ROWS = ALPHABET_PATTERNS[0].length;    // 8

const ALPHABET_SETS = ALPHABET_PATTERNS.map(function(pattern) {
  const s = new Set();
  for (let gr = 0; gr < ROWS; gr++) {
    const pr = Math.floor(gr * PAT_ROWS / ROWS);
    for (let gc = 0; gc < COLS; gc++) {
      const pc = Math.floor(gc * PAT_COLS / COLS);
      if (pattern[pr][pc] === 'X') s.add(gr * COLS + gc);
    }
  }
  return s;
});

let letterIndex = 0;

const hint = document.createElement('div');
hint.id = 'hint';
hint.textContent = 'SUPERPOSITION — SPACE to collapse   ·   CLICK to toggle';
document.body.appendChild(hint);

const exportBtn = document.createElement('button');
exportBtn.id = 'export-btn';
exportBtn.textContent = 'Export PNG';
exportBtn.disabled = true;
document.body.appendChild(exportBtn);

new p5(function(p) {
  const dx  = R * 2 * OVERLAP;
  const dy  = R * Math.sqrt(3) * OVERLAP;
  const PAD = R * 1.2;

  function rowOffset(row) {
    if (GRID_SHAPE === 'triangle') return (row % 2 === 1) ? dx * 0.5 : 0;
    if (GRID_SHAPE === 'quad')     return row * dx * 0.5;
    return 0; // 'square'
  }

  const maxOff = GRID_SHAPE === 'quad' ? (ROWS - 1) * dx * 0.5
               : GRID_SHAPE === 'triangle' ? dx * 0.5
               : 0;
  const CW = (COLS - 1) * dx + 2 * R + PAD * 2 + maxOff;
  const CH = (ROWS - 1) * dy + 2 * R + PAD * 2;

  // ── Setup ───────────────────────────────────────────────────────────────────
  p.setup = function() {
    p.createCanvas(CW, CH).parent(document.body);
    p.smooth();
    exportBtn.addEventListener('click', exportPNG);
    buildGrid();
    buildEntanglement();
  };

  function buildGrid() {
    cells = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const xOff = rowOffset(row);
        cells.push({
          x:      PAD + R + col * dx + xOff,
          y:      PAD + R + row * dy,
          row, col,
          // Bloch sphere angles
          theta0: p.random(TWO_PI),          // initial polar angle
          omegaR: p.random(0.0005, 0.0022),  // Rabi frequency (|0⟩↔|1⟩ oscillation)
          phi0:   p.random(TWO_PI),          // initial azimuthal phase
          omegaZ: p.random(0.0009, 0.003),   // Larmor precession frequency
          // Post-collapse
          partner: -1,
          filled:  false,
        });
      }
    }
  }

  function buildEntanglement() {
    entangledPairs = [];
    // Collect all adjacent cell pairs
    const adj = [];
    for (let i = 0; i < cells.length; i++) {
      for (let j = i + 1; j < cells.length; j++) {
        if (p.dist(cells[i].x, cells[i].y, cells[j].x, cells[j].y) < R * 2.6) {
          adj.push([i, j]);
        }
      }
    }
    p.shuffle(adj, true);
    const used = new Set();
    for (const [i, j] of adj) {
      if (entangledPairs.length >= 8) break;
      if (!used.has(i) && !used.has(j)) {
        cells[i].partner = j;
        cells[j].partner = i;
        entangledPairs.push([i, j]);
        used.add(i);
        used.add(j);
      }
    }
  }

  // ── Draw ────────────────────────────────────────────────────────────────────
  p.draw = function() {
    p.background(245, 245, 240);
    const t = p.millis();

    // Entanglement links — drawn behind circles, visible only in superposition
    if (!collapsed) {
      p.strokeWeight(0.7);
      for (const [i, j] of entangledPairs) {
        p.stroke(55, 80, 220, 55);
        p.line(cells[i].x, cells[i].y, cells[j].x, cells[j].y);
      }
    }

    for (const c of cells) {
      collapsed ? drawCollapsed(c) : drawSuperposition(c, t);
    }
  };

  // Draws the cell shape with Y-axis squish applied (widthScale 0–1).
  // ctx is a p5 instance or p5.Graphics; fill/stroke must be set before calling.
  function drawShape(ctx, x, y, widthScale) {
    const w = R * widthScale;
    if (CELL_SHAPE === 'square') {
      ctx.rectMode(ctx.CENTER);
      ctx.rect(x, y, w * 2, R * 2);
    } else if (CELL_SHAPE === 'triangle') {
      ctx.triangle(x, y - R, x - w, y + R, x + w, y + R);
    } else if (CELL_SHAPE === 'diamond') {
      ctx.quad(x, y - R, x + w, y, x, y + R, x - w, y);
    } else if (CELL_SHAPE === 'rhombus') {
      const lean = w * 0.45;
      ctx.quad(x - w + lean, y - R, x + w + lean, y - R,
               x + w - lean, y + R, x - w - lean, y + R);
    } else {
      ctx.ellipse(x, y, w * 2, R * 2);  // 'circle' default
    }
  }

  function drawCollapsed(c) {
    const widthScale = Math.abs(Math.cos(c.collapseFrom));
    p.strokeWeight(1.2);
    p.stroke(30);
    c.filled ? p.fill(20) : p.noFill();
    drawShape(p, c.x, c.y, widthScale);
  }

  function drawSuperposition(c, t) {
    const theta      = c.theta0 + c.omegaR * t;
    const cosT       = Math.cos(theta);
    const widthScale = Math.abs(cosT);
    const backFace   = cosT < 0;

    p.strokeWeight(1.2);
    p.stroke(30);
    backFace ? p.fill(20) : p.noFill();
    drawShape(p, c.x, c.y, widthScale);
  }

  function exportPNG() {
    const g = p.createGraphics(CW, CH);
    g.background(245, 245, 240);
    g.strokeWeight(1.2);
    g.stroke(30);
    g.fill(20);
    for (const c of cells) {
      if (!c.filled) continue;
      const widthScale = Math.abs(Math.cos(c.collapseFrom));
      drawShape(g, c.x, c.y, widthScale);
    }
    p.save(g, 'letter.png');
    g.remove();
  }

  // ── Measurement (Born rule) ─────────────────────────────────────────────────

  function recordCollapse(c, t) {
    c.collapseFrom = c.theta0 + c.omegaR * t;
  }

  function measureAll() {
    const t      = p.millis();
    const done   = new Set();
    const letter = ALPHABET_SETS[letterIndex];

    for (const [i, j] of entangledPairs) {
      cells[i].filled = letter.has(i);
      cells[j].filled = letter.has(j);
      recordCollapse(cells[i], t);
      recordCollapse(cells[j], t);
      done.add(i);
      done.add(j);
    }

    for (let k = 0; k < cells.length; k++) {
      if (done.has(k)) continue;
      cells[k].filled = letter.has(k);
      recordCollapse(cells[k], t);
    }

  }

  function enterSuperposition() {
    collapsed = false;
    for (const c of cells) {
      c.theta0 = p.random(TWO_PI);
      c.phi0   = p.random(TWO_PI);
    }
    hint.textContent = '';
    exportBtn.disabled = true;
  }

  function collapseToLetter(idx) {
    letterIndex = idx;
    collapsed   = true;
    measureAll();
    const ch = String.fromCharCode(65 + idx);
    hint.textContent = ch;
    exportBtn.disabled = false;
  }

  // ── Keyboard ────────────────────────────────────────────────────────────────
  p.keyPressed = function() {
    if (p.key === ' ') {
      collapsed ? enterSuperposition() : collapseToLetter(letterIndex);
      return;
    }

    const code = p.key.toUpperCase().charCodeAt(0);
    if (code >= 65 && code <= 90) {
      collapseToLetter(code - 65);
    }
  };

  // ── Mouse — toggle circle ───────────────────────────────────────────────────
  p.mousePressed = function() {
    for (const c of cells) {
      if (p.dist(p.mouseX, p.mouseY, c.x, c.y) < R) {
        if (!collapsed) collapseToLetter(letterIndex);
        c.filled = !c.filled;
        break;
      }
    }
  };
});
