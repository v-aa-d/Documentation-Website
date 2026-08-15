let m = 0;
let TILE   = 70; // change this to set the number of columns and rows
let CORNER = 0;  // corner radius in pixels — 0 = square, higher = more rounded
const XSPD = 7000, YSPD = 7000;
let lines = [''];
let waveType = 'sine';
let paused = false;

const FONT = {
  ' ': ['00000','00000','00000','00000','00000','00000','00000'],
  'A': ['01110','10001','10001','11111','10001','10001','10001'],
  'B': ['11110','10001','10001','11110','10001','10001','11110'],
  'C': ['01111','10000','10000','10000','10000','10000','01111'],
  'D': ['11110','10001','10001','10001','10001','10001','11110'],
  'E': ['11111','10000','10000','11110','10000','10000','11111'],
  'F': ['11111','10000','10000','11110','10000','10000','10000'],
  'G': ['01111','10000','10000','10011','10001','10001','01111'],
  'H': ['10001','10001','10001','11111','10001','10001','10001'],
  'I': ['11111','00100','00100','00100','00100','00100','11111'],
  'J': ['11111','00010','00010','00010','00010','10010','01100'],
  'K': ['10001','10010','10100','11000','10100','10010','10001'],
  'L': ['10000','10000','10000','10000','10000','10000','11111'],
  'M': ['10001','11011','10101','10001','10001','10001','10001'],
  'N': ['10001','11001','10101','10011','10001','10001','10001'],
  'O': ['01110','10001','10001','10001','10001','10001','01110'],
  'P': ['11110','10001','10001','11110','10000','10000','10000'],
  'Q': ['01110','10001','10001','10001','10101','10010','01101'],
  'R': ['11110','10001','10001','11110','10100','10010','10001'],
  'S': ['01111','10000','10000','01110','00001','00001','11110'],
  'T': ['11111','00100','00100','00100','00100','00100','00100'],
  'U': ['10001','10001','10001','10001','10001','10001','01110'],
  'V': ['10001','10001','10001','10001','01010','01010','00100'],
  'W': ['10001','10001','10001','10101','10101','11011','10001'],
  'X': ['10001','10001','01010','00100','01010','10001','10001'],
  'Y': ['10001','10001','01010','00100','00100','00100','00100'],
  'Z': ['11111','00001','00010','00100','01000','10000','11111'],
  '0': ['01110','10011','10101','11001','10001','10001','01110'],
  '1': ['00100','01100','00100','00100','00100','00100','01110'],
  '2': ['01110','10001','00001','00110','01000','10000','11111'],
  '3': ['11111','00001','00001','01110','00001','00001','11111'],
  '4': ['10001','10001','10001','11111','00001','00001','00001'],
  '5': ['11111','10000','10000','11110','00001','00001','11110'],
  '6': ['01111','10000','10000','11110','10001','10001','01110'],
  '7': ['11111','00001','00010','00100','01000','01000','01000'],
  '8': ['01110','10001','10001','01110','10001','10001','01110'],
  '9': ['01110','10001','10001','01111','00001','00001','01110'],
  '!': ['00100','00100','00100','00100','00100','00000','00100'],
  '?': ['01110','10001','00001','00110','00100','00000','00100'],
  '.': ['00000','00000','00000','00000','00000','00000','00100'],
  '-': ['00000','00000','00000','11111','00000','00000','00000'],
};

function wave(a) {
  switch (waveType) {
    case 'triangle': return asin(sin(a)) / 90;
    case 'pulse':    return sin(a) >= 0 ? 1 : -1;
    case 'sawtooth': return (((a % 360) + 360) % 360) / 180 - 1;
    case 'complex':  return (sin(a) + sin(2*a)*0.5 + sin(3*a)*0.33 + sin(5*a)*0.2) / 2.03;
    default:         return sin(a);
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);

  const sel = createSelect();
  ['Sine', 'Triangle', 'Pulse', 'Sawtooth', 'Complex'].forEach(w => sel.option(w));
  sel.changed(() => { waveType = sel.value().toLowerCase(); });

  const btn = createButton('Save PNG');
  btn.mousePressed(() => saveCanvas('quantic-grid', 'png'));
  btn.class('save-btn');

  const btnFont = createButton('Save Font');
  btnFont.mousePressed(saveFont);
  btnFont.class('save-btn');

  const btnPause = createButton('Pause');
  btnPause.mousePressed(() => {
    paused = !paused;
    btnPause.html(paused ? 'Resume' : 'Pause');
  });
  btnPause.class('save-btn');
}

function keyPressed() {
  if (keyCode === ESCAPE) { lines = ['']; return false; }
  if (keyCode === ENTER)  { lines.push(''); return false; }
  if (keyCode === BACKSPACE) {
    if (lines[lines.length - 1].length > 0) {
      lines[lines.length - 1] = lines[lines.length - 1].slice(0, -1);
    } else if (lines.length > 1) {
      lines.pop();
    }
    return false;
  }
  const c = key.toUpperCase();
  if (key.length === 1 && FONT[c]) lines[lines.length - 1] += c;
  return false;
}

function isLit(gx, gy) {
  if (!lines.some(l => l.length > 0)) return false;
  const L = lines.length;
  const lineH = (TILE - (L - 1)) / L; // 1-unit gap between each line
  const blockH = lineH + 1;
  const lineIdx = min(floor(gy / blockH), L - 1);
  const localGy = gy - lineIdx * blockH;
  if (localGy >= lineH) return false; // inside a gap
  const line = lines[lineIdx];
  if (!line || line.length === 0) return false;
  const n = line.length;
  const charW = (TILE - (n - 1)) / n; // 1-unit gap between each char
  const blockW = charW + 1;
  const charIdx = floor(gx / blockW);
  const localGx = gx - charIdx * blockW;
  if (localGx >= charW) return false;  // inside a gap
  const bx = floor(localGx * 5 / charW);
  const by = floor(localGy * 7 / lineH);
  const p = FONT[line[charIdx]];
  return p && by < 7 ? p[by][bx] === '1' : false;
}

function draw() {
  const wid = width, hei = height;
  background(0);

  const upp = 360 / TILE;
  push();
  translate(floor(wave(m) * -XSPD) / 100, floor(wave(m + 90) * -YSPD) / 100);
  for (let x = 0; x < TILE; x++) {
    for (let y = 0; y < TILE; y++) {
      fill(lines.some(l => l.length > 0) && !isLit(x, y) ? 20 : 255);
      noStroke();
      const xx = x * (wid / TILE);
      const n = floor(wave(m + x * upp) * XSPD) / 100;
      const o = floor(wave(m + (x + 1) * upp) * XSPD) / 100;
      const p = floor(wave(m + y * upp + 90) * YSPD) / 100;
      const q = floor(wave(m + (y + 1) * upp + 90) * YSPD) / 100;
      const yy = y * (hei / TILE);
      rectMode(CORNERS);
      rect(xx + n, yy + p, xx + o - 1 + wid / TILE, yy + q - 1 + hei / TILE, CORNER);
    }
  }
  pop();
  if (!paused) m++;
}

function saveFont() {
  const wid = width, hei = height;
  const upp = 360 / TILE;
  const tileUW = 1000 / TILE;   // tile width in font units
  const tileUH = 800  / TILE;   // tile height in font units
  const ampX   = XSPD / 100 * tileUW / (wid  / TILE); // wave amplitude scaled to font space
  const ampY   = YSPD / 100 * tileUH / (hei / TILE);
  const RAD    = Math.PI / 180;
  const snap   = m; // freeze the current animation frame

  // Pure-JS wave — avoids p5 angleMode dependency
  function wv(deg) {
    const a = deg * RAD;
    switch (waveType) {
      case 'triangle': return Math.asin(Math.sin(a)) / (Math.PI / 2);
      case 'pulse':    return Math.sin(a) >= 0 ? 1 : -1;
      case 'sawtooth': return (((deg % 360) + 360) % 360) / 180 - 1;
      case 'complex':  return (Math.sin(a) + Math.sin(2*a)*0.5 + Math.sin(3*a)*0.33 + Math.sin(5*a)*0.2) / 2.03;
      default:         return Math.sin(a);
    }
  }

  // 4 corners of tile (gx, gy) in font units with wave baked in
  function tileCorners(gx, gy) {
    const n = wv(snap + gx       * upp) * ampX;
    const o = wv(snap + (gx + 1) * upp) * ampX;
    const p = wv(snap + gy       * upp + 90) * ampY;
    const q = wv(snap + (gy + 1) * upp + 90) * ampY;
    const x1 = gx       * tileUW + n;
    const x2 = (gx + 1) * tileUW + o;
    const y1 = (TILE - gy)       * tileUH - p; // y flipped (font y = up)
    const y2 = (TILE - gy - 1)   * tileUH - q;
    return [[x1,y1],[x2,y1],[x2,y2],[x1,y2]]; // TL TR BR BL
  }

  // CORNER scaled from screen pixels to font units
  const cornerR = CORNER * Math.min(tileUW / (wid / TILE), tileUH / (hei / TILE));
  const K = 0.5523; // cubic bezier approximation of a quarter circle

  function buildGlyphPath(c) {
    const path = new opentype.Path();
    for (let gx = 0; gx < TILE; gx++) {
      for (let gy = 0; gy < TILE; gy++) {
        if (FONT[c][Math.floor(gy * 7 / TILE)][Math.floor(gx * 5 / TILE)] !== '1') continue;
        const cs = tileCorners(gx, gy);
        const x1 = cs[0][0], y1 = cs[0][1]; // top-left  (y1 > y2 in font coords)
        const x2 = cs[1][0], y2 = cs[2][1]; // bottom-right
        const r = Math.min(cornerR, Math.abs(x2 - x1) / 2, Math.abs(y1 - y2) / 2);
        if (r <= 0) {
          path.moveTo(x1, y1); path.lineTo(x1, y2);
          path.lineTo(x2, y2); path.lineTo(x2, y1); path.close();
        } else {
          // CCW rounded rectangle with bezier corners
          path.moveTo(x1,      y1 - r);
          path.lineTo(x1,      y2 + r);
          path.bezierCurveTo(x1,      y2+r*K, x1+r*K, y2,      x1+r,  y2);
          path.lineTo(x2 - r,  y2);
          path.bezierCurveTo(x2-r*K,  y2,     x2,     y2+r*K,  x2,    y2+r);
          path.lineTo(x2,      y1 - r);
          path.bezierCurveTo(x2,      y1-r*K, x2-r*K, y1,      x2-r,  y1);
          path.lineTo(x1 + r,  y1);
          path.bezierCurveTo(x1+r*K,  y1,     x1,     y1-r*K,  x1,    y1-r);
          path.close();
        }
      }
    }
    return path;
  }

  const NAMES = {
    ' ':'space','!':'exclam','?':'question','.':'period','-':'hyphen',
    '0':'zero','1':'one','2':'two','3':'three','4':'four',
    '5':'five','6':'six','7':'seven','8':'eight','9':'nine',
  };

  const glyphs = [
    new opentype.Glyph({ name:'.notdef', unicode:0, advanceWidth:500, path:new opentype.Path() }),
  ];
  for (const c of Object.keys(FONT)) {
    glyphs.push(new opentype.Glyph({
      name: NAMES[c] || c,
      unicode: c.charCodeAt(0),
      advanceWidth: Math.round(tileUW * TILE * 1.1),
      path: c === ' ' ? new opentype.Path() : buildGlyphPath(c),
    }));
  }

  new opentype.Font({
    familyName: `QuanticGrid-T${TILE}-${snap}`,
    styleName: 'Regular',
    unitsPerEm: 1000,
    ascender: 800,
    descender: -200,
    glyphs,
  }).download(`quantic-grid-T${TILE}-${snap}.otf`);
}
