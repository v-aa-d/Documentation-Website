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

  Both eigenstates are rendered simultaneously at their probability weights:
    • Black filled disc  at opacity = P(filled)   — the |1⟩ component
    • Circle outline     at opacity = P(empty)    — the |0⟩ component
    • Blue dot on rim    orbiting at φ(t)         — the complex phase (unobservable
                                                     directly, but real and evolving)

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
    p.circle(c.x, c.y, R * 2);
  }

  function drawSuperposition(c, t) {
    const theta = c.theta0 + c.omegaR * t;
    const phi   = c.phi0   + c.omegaZ * t;

    // Born rule probabilities
    const p1 = Math.pow(Math.sin(theta / 2), 2); // P(|1⟩ = filled)
    const p0 = 1 - p1;                           // P(|0⟩ = empty)

    // |1⟩ component: filled disc at its probability weight
    p.noStroke();
    p.fill(20, 20, 20, p1 * 255);
    p.circle(c.x, c.y, R * 2);

    // |0⟩ component: outline at its probability weight
    // (minimum opacity keeps the grid readable even when p0 ≈ 0)
    p.noFill();
    p.strokeWeight(1.2);
    p.stroke(30, 30, 30, Math.max(p0 * 220, 40));
    p.circle(c.x, c.y, R * 2);

    // Complex phase φ(t): blue dot orbiting the circumference
    // This is the e^(iφ) factor — real, evolving, but unmeasurable directly
    const dotR = R * 0.14;
    const dotX = c.x + (R - dotR) * Math.cos(phi);
    const dotY = c.y + (R - dotR) * Math.sin(phi);
    p.noStroke();
    p.fill(50, 85, 215, 205);
    p.circle(dotX, dotY, dotR * 2);
  }

  // ── Measurement (Born rule) ─────────────────────────────────────────────────
  function measureAll() {
    const t    = p.millis();
    const done = new Set();

    // Entangled pairs collapse to correlated outcomes (Bell |Φ+⟩: always same)
    for (const [i, j] of entangledPairs) {
      const outcome = Math.random() < 0.5;
      cells[i].filled = outcome;
      cells[j].filled = outcome;
      done.add(i);
      done.add(j);
    }

    // Independent qubits: Born rule — P(filled) = sin²(θ/2)
    for (let k = 0; k < cells.length; k++) {
      if (done.has(k)) continue;
      const c   = cells[k];
      const p1  = Math.pow(Math.sin((c.theta0 + c.omegaR * t) / 2), 2);
      c.filled  = Math.random() < p1;
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
