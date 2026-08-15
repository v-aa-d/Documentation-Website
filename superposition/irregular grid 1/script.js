/*
  Quantum Grid Typography
  ───────────────────────
  8 rows × 5 columns of overlapping circles arranged in an offset (brick) grid.
  Each circle is in quantum superposition: its fill probability oscillates as a
  complex wave function (amplitude × phase). Pressing SPACE collapses all wave
  functions — each circle is "measured" and snaps to filled or empty based on
  its instantaneous probability. Pressing SPACE again re-enters superposition.
  Click any circle to manually toggle it while collapsed.
*/

// ── Grid parameters ──────────────────────────────────────────────────────────
const COLS = 5;
const ROWS = 8;
const R    = 46;          // circle radius
const OVERLAP = 0.62;     // fraction of 2R between circle centres (< 1 = overlap)

// ── Quantum wave parameters ───────────────────────────────────────────────────
// Each cell gets independent frequency and phase so superposition looks alive.
const BASE_FREQ  = 0.0007;  // slowest oscillation (radians / ms)
const FREQ_SPREAD = 0.0009; // random spread added per cell

let cells = [];   // array of cell objects
let collapsed = false;

// ── Hint element ──────────────────────────────────────────────────────────────
const hint = document.createElement('div');
hint.id = 'hint';
hint.textContent = 'SPACE — collapse / superpose   ·   CLICK — toggle cell';
document.body.appendChild(hint);

// ── p5 sketch ────────────────────────────────────────────────────────────────
new p5(function(p) {

  // Spacing between circle centres
  const dx = R * 2 * OVERLAP;          // horizontal step
  const dy = R * Math.sqrt(3) * OVERLAP; // vertical step (keeps hex-like overlap)

  // Total canvas size with padding
  const PAD   = R * 1.2;
  const CW    = (COLS - 1) * dx + 2 * R + PAD * 2;
  const CH    = (ROWS - 1) * dy + 2 * R + PAD * 2;

  // ── Setup ─────────────────────────────────────────────────────────────────
  p.setup = function() {
    p.createCanvas(CW, CH).parent(document.body);
    p.smooth();

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const offset = (row % 2 === 1) ? dx * 0.5 : 0;  // brick offset on odd rows
        cells.push({
          x:      PAD + R + col * dx + offset,
          y:      PAD + R + row * dy,
          row, col,
          // Wave function: probability = 0.5 + 0.5*sin(freq*t + phase)
          freq:   BASE_FREQ + Math.random() * FREQ_SPREAD,
          phase:  Math.random() * Math.PI * 2,
          filled: false,
        });
      }
    }
  };

  // ── Draw ──────────────────────────────────────────────────────────────────
  p.draw = function() {
    p.background(245, 245, 240);

    const t = p.millis();

    for (const c of cells) {
      let fillAmt;

      if (collapsed) {
        fillAmt = c.filled ? 1 : 0;
      } else {
        fillAmt = 0.5 + 0.5 * Math.sin(c.freq * t + c.phase);
      }

      // Draw outline circle
      p.stroke(30);
      p.strokeWeight(1.2);
      p.noFill();
      p.circle(c.x, c.y, R * 2);

      // Draw filled overlay (opacity driven by wave probability)
      if (fillAmt > 0.01) {
        p.noStroke();
        p.fill(20, 20, 20, fillAmt * 255);
        p.circle(c.x, c.y, R * 2);
      }
    }
  };

  // ── Keyboard ──────────────────────────────────────────────────────────────
  p.keyPressed = function() {
    if (p.key === ' ') {
      collapsed = !collapsed;

      if (collapsed) {
        // Measure: collapse each cell's wave function
        const t = p.millis();
        for (const c of cells) {
          const prob = 0.5 + 0.5 * Math.sin(c.freq * t + c.phase);
          c.filled = Math.random() < prob;
        }
        hint.textContent = 'COLLAPSED — SPACE to return to superposition   ·   CLICK to toggle';
      } else {
        // Re-enter superposition: re-randomise phases so the wave starts fresh
        for (const c of cells) {
          c.phase = Math.random() * Math.PI * 2;
        }
        hint.textContent = 'SUPERPOSITION — SPACE to collapse   ·   CLICK to toggle';
      }
    }
  };

  // ── Mouse click — toggle cell ─────────────────────────────────────────────
  p.mousePressed = function() {
    for (const c of cells) {
      if (p.dist(p.mouseX, p.mouseY, c.x, c.y) < R) {
        if (!collapsed) {
          // Auto-collapse when user clicks during superposition
          collapsed = true;
          const t = p.millis();
          for (const cc of cells) {
            const prob = 0.5 + 0.5 * Math.sin(cc.freq * t + cc.phase);
            cc.filled = Math.random() < prob;
          }
          hint.textContent = 'COLLAPSED — SPACE to return to superposition   ·   CLICK to toggle';
        }
        c.filled = !c.filled;
        break;
      }
    }
  };
});
