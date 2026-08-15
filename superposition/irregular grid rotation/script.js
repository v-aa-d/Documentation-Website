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

  SPACE — wavefunction collapse (Born rule measurement)
  CLICK — toggle any circle (auto-collapses first if needed)
*/

const COLS   = 5;
const ROWS   = 8;
const R      = 46;
const OVERLAP = 0.62;
const TWO_PI = Math.PI * 2;

let cells          = [];
let entangledPairs = [];
let collapsed      = false;

const hint = document.createElement('div');
hint.id = 'hint';
hint.textContent = 'SUPERPOSITION — SPACE to collapse   ·   CLICK to toggle';
document.body.appendChild(hint);

new p5(function(p) {
  const dx  = R * 2 * OVERLAP;
  const dy  = R * Math.sqrt(3) * OVERLAP;
  const PAD = R * 1.2;
  const CW  = (COLS - 1) * dx + 2 * R + PAD * 2;
  const CH  = (ROWS - 1) * dy + 2 * R + PAD * 2;

  // ── Setup ───────────────────────────────────────────────────────────────────
  p.setup = function() {
    p.createCanvas(CW, CH).parent(document.body);
    p.smooth();
    buildGrid();
    buildEntanglement();
  };

  function buildGrid() {
    cells = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const xOff = (row % 2 === 1) ? dx * 0.5 : 0;
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

  function drawCollapsed(c) {
    p.strokeWeight(1.2);
    p.stroke(30);
    c.filled ? p.fill(20) : p.noFill();
    p.ellipse(c.x, c.y, R * 2 * c.collapseWidthScale, R * 2);
  }

  function drawSuperposition(c, t) {
    // theta: Bloch polar angle — drives Y-axis rotation (Rabi oscillation)
    const theta = c.theta0 + c.omegaR * t;

    // Y-axis rotation: cos(theta) is the Bloch Z-component
    // > 0 → front face (|0⟩, empty)   < 0 → back face (|1⟩, filled)
    const cosT       = Math.cos(theta);
    const widthScale = Math.abs(cosT);          // 1 = full circle, 0 = edge-on line
    const backFace   = cosT < 0;               // seeing the |1⟩ face

    p.strokeWeight(1.2);
    p.stroke(30);
    backFace ? p.fill(20) : p.noFill();
    p.ellipse(c.x, c.y, R * 2 * widthScale, R * 2);
  }

  // ── Measurement (Born rule) ─────────────────────────────────────────────────

  function freeze(c, t) {
    const theta = c.theta0 + c.omegaR * t;
    c.collapseWidthScale = Math.abs(Math.cos(theta));
    return Math.cos(theta) < 0; // backFace at the instant of measurement
  }

  function measureAll() {
    const t    = p.millis();
    const done = new Set();

    for (const [i, j] of entangledPairs) {
      const outcome = freeze(cells[i], t);
      freeze(cells[j], t);
      cells[i].filled = outcome;
      cells[j].filled = outcome;
      done.add(i);
      done.add(j);
    }

    for (let k = 0; k < cells.length; k++) {
      if (done.has(k)) continue;
      const c = cells[k];
      c.filled = freeze(c, t);
    }
  }

  // ── Keyboard ────────────────────────────────────────────────────────────────
  p.keyPressed = function() {
    if (p.key !== ' ') return;
    collapsed = !collapsed;

    if (collapsed) {
      measureAll();
      hint.textContent = 'COLLAPSED — SPACE to superpose   ·   CLICK to toggle';
    } else {
      // Re-enter superposition: fresh Bloch sphere angles, keep entanglement
      for (const c of cells) {
        c.theta0 = p.random(TWO_PI);
        c.phi0   = p.random(TWO_PI);
      }
      hint.textContent = 'SUPERPOSITION — SPACE to collapse   ·   CLICK to toggle';
    }
  };

  // ── Mouse — toggle circle ───────────────────────────────────────────────────
  p.mousePressed = function() {
    for (const c of cells) {
      if (p.dist(p.mouseX, p.mouseY, c.x, c.y) < R) {
        if (!collapsed) {
          collapsed = true;
          measureAll();
          hint.textContent = 'COLLAPSED — SPACE to superpose   ·   CLICK to toggle';
        }
        c.filled = !c.filled;
        break;
      }
    }
  };
});
