// ─────────────────────────────────────────────────────────────────────────────
// Global state
// ─────────────────────────────────────────────────────────────────────────────
let letters = ['H', 'A', 'W'];
let numPts = 200;
let pointSets = [];   // one array of {x,y} per letter, normalized to [-0.5, 0.5]
let playing = true;
let showLines = false;
let showGhost = false;
let colorMode = 'hue'; // 'hue' | 'mono'
let showFilled = false;
let animT = 0;
let bgDark = true;
let isRecording = false;
let recordedFrames = [];

// ─────────────────────────────────────────────────────────────────────────────
// Hershey simplex stroke data
// Each entry: array of strokes, each stroke: array of [x, y] pairs.
// Coordinate system: y up, cap height = 21, baseline = 0.
// ─────────────────────────────────────────────────────────────────────────────
const HERSHEY = {
  'A': [
    [[-5,0],[0,21],[5,0]],
    [[-3,10],[3,10]]
  ],
  'B': [
    [[-5,21],[-5,0]],
    [[-5,21],[0,21],[3,19],[4,17],[4,15],[3,13],[0,12],[-5,12]],
    [[-5,12],[1,12],[4,9],[5,7],[5,4],[4,2],[1,0],[-5,0]]
  ],
  'C': [
    [[6,17],[4,20],[1,21],[-2,21],[-5,18],[-6,15],[-6,6],[-5,3],[-2,0],[1,0],[4,2],[6,5]]
  ],
  'D': [
    [[-5,21],[-5,0]],
    [[-5,21],[0,21],[3,19],[5,16],[6,12],[6,9],[5,5],[3,2],[0,0],[-5,0]]
  ],
  'E': [
    [[-5,21],[-5,0]],
    [[-5,21],[5,21]],
    [[-5,12],[2,12]],
    [[-5,0],[5,0]]
  ],
  'F': [
    [[-5,21],[-5,0]],
    [[-5,21],[5,21]],
    [[-5,12],[2,12]]
  ],
  'G': [
    [[6,17],[4,20],[1,21],[-2,21],[-5,18],[-6,15],[-6,6],[-5,3],[-2,0],[1,0],[4,2],[6,5],[6,12],[2,12]]
  ],
  'H': [
    [[-5,21],[-5,0]],
    [[5,21],[5,0]],
    [[-5,11],[5,11]]
  ],
  'I': [
    [[0,21],[0,0]],
    [[-3,21],[3,21]],
    [[-3,0],[3,0]]
  ],
  'J': [
    [[2,21],[2,4],[1,1],[-1,0],[-3,0],[-5,1],[-5,4]]
  ],
  'K': [
    [[-5,21],[-5,0]],
    [[5,21],[-5,9]],
    [[-2,13],[5,0]]
  ],
  'L': [
    [[-5,21],[-5,0],[5,0]]
  ],
  'M': [
    [[-6,0],[-6,21],[0,9],[6,21],[6,0]]
  ],
  'N': [
    [[-5,0],[-5,21],[5,0],[5,21]]
  ],
  'O': [
    [[-1,21],[-4,20],[-6,17],[-6,4],[-4,1],[-1,0],[1,0],[4,1],[6,4],[6,17],[4,20],[1,21],[-1,21]]
  ],
  'P': [
    [[-5,21],[-5,0]],
    [[-5,21],[0,21],[3,19],[4,17],[4,14],[3,12],[0,11],[-5,11]]
  ],
  'Q': [
    [[-1,21],[-4,20],[-6,17],[-6,4],[-4,1],[-1,0],[1,0],[4,1],[6,4],[6,17],[4,20],[1,21],[-1,21]],
    [[2,5],[6,0]]
  ],
  'R': [
    [[-5,21],[-5,0]],
    [[-5,21],[0,21],[3,19],[4,17],[4,14],[3,12],[0,11],[-5,11]],
    [[0,11],[5,0]]
  ],
  'S': [
    [[6,17],[4,20],[1,21],[-2,21],[-5,18],[-5,15],[-2,12],[3,9],[6,6],[6,3],[3,0],[-1,0],[-4,1],[-6,4]]
  ],
  'T': [
    [[0,21],[0,0]],
    [[-6,21],[6,21]]
  ],
  'U': [
    [[-5,21],[-5,4],[-4,1],[-1,0],[1,0],[4,1],[5,4],[5,21]]
  ],
  'V': [
    [[-6,21],[0,0],[6,21]]
  ],
  'W': [
    [[-8,21],[-5,0],[0,10],[5,0],[8,21]]
  ],
  'X': [
    [[-5,21],[5,0]],
    [[5,21],[-5,0]]
  ],
  'Y': [
    [[-6,21],[0,11]],
    [[6,21],[0,11],[0,0]]
  ],
  'Z': [
    [[-6,21],[6,21],[-6,0],[6,0]]
  ],
  '0': [
    [[-4,21],[-6,18],[-6,3],[-4,0],[4,0],[6,3],[6,18],[4,21],[-4,21]]
  ],
  '1': [
    [[-2,17],[0,21],[0,0]],
    [[-3,0],[3,0]]
  ],
  '2': [
    [[-5,18],[-4,21],[-1,21],[2,18],[2,14],[-5,0],[6,0]]
  ],
  '3': [
    [[-5,21],[5,21],[0,12],[3,12],[5,9],[5,4],[3,1],[0,0],[-3,0],[-5,2]]
  ],
  '4': [
    [[3,21],[-5,8],[6,8]],
    [[3,21],[3,0]]
  ],
  '5': [
    [[5,21],[-5,21],[-5,12],[0,12],[3,11],[5,8],[5,4],[3,1],[0,0],[-3,0],[-5,2]]
  ],
  '6': [
    [[4,20],[2,21],[-1,21],[-4,19],[-6,15],[-6,5],[-5,2],[-2,0],[1,0],[4,2],[5,5],[5,8],[4,10],[2,11],[-1,11],[-4,8],[-5,5]]
  ],
  '7': [
    [[-5,21],[6,21],[0,0]]
  ],
  '8': [
    [[0,21],[-3,20],[-5,17],[-5,14],[-3,12],[0,11],[3,12],[5,14],[5,17],[3,20],[0,21]],
    [[0,11],[-3,9],[-5,6],[-5,3],[-3,1],[0,0],[3,1],[5,4],[5,7],[3,9],[0,11]]
  ],
  '9': [
    [[-4,2],[-2,0],[1,0],[4,2],[5,5],[5,16],[4,19],[2,21],[-1,21],[-4,19],[-5,16],[-5,12],[-4,9],[-2,8],[1,8],[4,9],[5,12]]
  ],
  '?': [
    [[-4,18],[-4,21],[-1,21],[2,19],[2,15],[0,12],[0,7]],
    [[0,3],[0,0]]
  ],
  '!': [
    [[0,21],[0,7]],
    [[0,3],[0,0]]
  ],
  '.': [
    [[0,3],[0,0]]
  ],
  ',': [
    [[1,3],[1,0],[0,-2],[-1,-3]]
  ],
  '-': [
    [[-4,11],[4,11]]
  ],
  '+': [
    [[-5,11],[5,11]],
    [[0,16],[0,6]]
  ],
  ' ': []
};

// ─────────────────────────────────────────────────────────────────────────────
// Sample n evenly-spaced points along an open polyline [{x,y},...]
// ─────────────────────────────────────────────────────────────────────────────
function sampleStroke(pts, n) {
  if (n <= 1) return [{ ...pts[0] }];
  const segs = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1].x - pts[i].x, dy = pts[i + 1].y - pts[i].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    segs.push(len);
    total += len;
  }
  if (total < 1e-6) return Array(n).fill({ ...pts[0] });

  const result = [];
  let acc = 0, si = 0;
  for (let i = 0; i < n; i++) {
    const target = (i / (n - 1)) * total;
    while (si < segs.length - 1 && acc + segs[si] < target) {
      acc += segs[si];
      si++;
    }
    const t = segs[si] > 1e-6 ? Math.min((target - acc) / segs[si], 1) : 0;
    result.push({
      x: pts[si].x + (pts[si + 1].x - pts[si].x) * t,
      y: pts[si].y + (pts[si + 1].y - pts[si].y) * t,
    });
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Glyph sampling → n normalized points in [-0.5, 0.5]
// ─────────────────────────────────────────────────────────────────────────────
function sampleGlyph(char, n) {
  const key = char.toUpperCase();
  const raw = HERSHEY[key] || HERSHEY['?'];
  if (!raw || raw.length === 0) return Array(n).fill({ x: 0, y: 0 });

  const polylines = raw.map(s => s.map(([x, y]) => ({ x, y })));

  // Arc length of each stroke
  const lengths = polylines.map(pl => {
    let len = 0;
    for (let i = 0; i < pl.length - 1; i++) {
      const dx = pl[i + 1].x - pl[i].x, dy = pl[i + 1].y - pl[i].y;
      len += Math.sqrt(dx * dx + dy * dy);
    }
    return len;
  });
  const total = lengths.reduce((a, b) => a + b, 0);
  if (total < 1e-6) return Array(n).fill({ x: 0, y: 0 });

  // Distribute point budget proportionally across strokes
  let pts = [];
  for (let si = 0; si < polylines.length; si++) {
    const count = Math.max(2, Math.round(n * lengths[si] / total));
    pts = pts.concat(sampleStroke(polylines[si], count));
  }

  // Trim / pad to exactly n
  while (pts.length < n) pts.push({ ...pts[pts.length - 1] });
  pts = pts.slice(0, n);

  // Center and scale to [-0.5, 0.5]
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
  }
  const cX = (minX + maxX) / 2, cY = (minY + maxY) / 2;
  const scale = Math.max(maxX - minX, maxY - minY, 1);
  return pts.map(p => ({ x: (p.x - cX) / scale, y: (p.y - cY) / scale }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Easing functions  (t ∈ [0,1] → [0,1])
// ─────────────────────────────────────────────────────────────────────────────
const ease = {
  linear:     t => t,
  smoothstep: t => t * t * (3 - 2 * t),
  cosine:     t => (1 - Math.cos(t * Math.PI)) / 2,
  cubic:      t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  elastic:    t => {
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
  },
  bounce: t => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1)     return n1 * t * t;
    if (t < 2 / d1)     return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1)   return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  },
  back:   t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  expo:   t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, 10 * t - 10),
  poly5:  t => t * t * t * (t * (t * 6 - 15) + 10),
};

// Catmull-Rom scalar
function cr1(p0, p1, p2, p3, t) {
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Multi-letter interpolation
// t ∈ [0, letters.length − 1]
// ─────────────────────────────────────────────────────────────────────────────
function interpolate(sets, t, type) {
  const n = sets.length;
  if (n === 0) return [];
  if (n === 1) return sets[0];

  const seg = Math.min(Math.floor(t), n - 2);
  const lt  = t - seg;

  if (type === 'catmullrom') {
    const i0 = Math.max(0, seg - 1);
    const i1 = seg;
    const i2 = Math.min(n - 1, seg + 1);
    const i3 = Math.min(n - 1, seg + 2);
    const s0 = sets[i0], s1 = sets[i1], s2 = sets[i2], s3 = sets[i3];
    return s1.map((_, i) => ({
      x: cr1(s0[i].x, s1[i].x, s2[i].x, s3[i].x, lt),
      y: cr1(s0[i].y, s1[i].y, s2[i].y, s3[i].y, lt),
    }));
  }

  const ef = (ease[type] || ease.linear)(lt);
  const a = sets[seg], b = sets[seg + 1];
  return a.map((pa, i) => ({
    x: pa.x + (b[i].x - pa.x) * ef,
    y: pa.y + (b[i].y - pa.y) * ef,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Save animation frames to array
// frameCount: number of frames to capture across the full animation
// ─────────────────────────────────────────────────────────────────────────────
function startRecording(frameCount = 60) {
  isRecording = true;
  recordedFrames = [];
  
  const wasPlaying = playing;
  playing = false;
  const origT = animT;
  
  const maxT = Math.max(1, letters.length - 1);
  const interpT = document.getElementById('interp').value;
  
  for (let i = 0; i < frameCount; i++) {
    const t = (i / frameCount) * maxT;
    animT = t;
    
    const pts = interpolate(pointSets, t, interpT);
    recordedFrames.push({
      t: t,
      points: pts ? JSON.parse(JSON.stringify(pts)) : [],
      frameIndex: i
    });
  }
  
  playing = wasPlaying;
  animT = origT;
  isRecording = false;
  
  console.log(`Recorded ${frameCount} frames of animation`);
  return recordedFrames;
}

// ─────────────────────────────────────────────────────────────────────────
// Export recorded frames as JSON
// ─────────────────────────────────────────────────────────────────────────
function exportFramesJSON() {
  if (recordedFrames.length === 0) {
    console.warn('No frames recorded. Call startRecording() first.');
    return;
  }
  
  const data = {
    metadata: {
      letters: letters,
      numPoints: numPts,
      interpolation: document.getElementById('interp').value,
      frameCount: recordedFrames.length,
      timestamp: new Date().toISOString()
    },
    frames: recordedFrames
  };
  
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `letter-morph-frames-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log('Frames exported as JSON');
}

// ─────────────────────────────────────────────────────────────────────────
// Get frame data as array of point arrays
// ─────────────────────────────────────────────────────────────────────────
function getFrameData() {
  if (recordedFrames.length === 0) {
    console.warn('No frames recorded. Call startRecording() first.');
    return [];
  }
  
  return recordedFrames.map(frame => ({
    t: frame.t,
    points: frame.points
  }));
}

// ─────────────────────────────────────────────────────────────────────────
// Export recorded frames as PNG files
// ─────────────────────────────────────────────────────────────────────────
function exportFramesPNG() {
  if (recordedFrames.length === 0) {
    console.warn('No frames recorded. Call startRecording() first.');
    return;
  }

  const timestamp = Date.now();
  const folderName = `letter-morph-png-${timestamp}`;
  
  // Create a temporary container for rendering
  const tempContainer = document.createElement('div');
  tempContainer.style.display = 'none';
  document.body.appendChild(tempContainer);
  
  let framesProcessed = 0;
  
  // Process each frame
  recordedFrames.forEach((frame, index) => {
    // Create temporary canvas
    const canvas = document.createElement('canvas');
    canvas.width = 880;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');
    
    // Set background
    ctx.fillStyle = 'hsl(230, 30%, 5%)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw points
    const dot = 3;
    frame.points.forEach((pt, i) => {
      const sx = canvas.width / 2 + pt.x * canvas.height * 0.78;
      const sy = canvas.height / 2 - pt.y * canvas.height * 0.78;
      
      // Color points with hue gradient
      const hue = (i / frame.points.length * 300 + 160) % 360;
      ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
      ctx.beginPath();
      ctx.arc(sx, sy, dot / 2, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Download PNG
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `frame-${String(index).padStart(4, '0')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      framesProcessed++;
      if (framesProcessed === recordedFrames.length) {
        document.body.removeChild(tempContainer);
        console.log(`Exported ${recordedFrames.length} frames as PNG`);
      }
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Export recorded frames as SVG files
// ─────────────────────────────────────────────────────────────────────────
function exportFramesSVG() {
  if (recordedFrames.length === 0) {
    console.warn('No frames recorded. Call startRecording() first.');
    return;
  }

  const timestamp = Date.now();
  
  recordedFrames.forEach((frame, index) => {
    // Create SVG
    let svg = '<svg width="880" height="420" xmlns="http://www.w3.org/2000/svg">';
    svg += '<rect width="880" height="420" fill="hsl(230, 30%, 5%)"/>';
    
    // Add points as circles
    frame.points.forEach((pt, i) => {
      const sx = 880 / 2 + pt.x * 420 * 0.78;
      const sy = 420 / 2 - pt.y * 420 * 0.78;
      const hue = (i / frame.points.length * 300 + 160) % 360;
      const color = `hsl(${hue}, 70%, 50%)`;
      
      svg += `<circle cx="${sx}" cy="${sy}" r="1.5" fill="${color}"/>`;
    });
    
    svg += '</svg>';
    
    // Download SVG
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `frame-${String(index).padStart(4, '0')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
  
  console.log(`Exported ${recordedFrames.length} frames as SVG`);
}

// ─────────────────────────────────────────────────────────────────────────
// Build point sets from current UI state
// ─────────────────────────────────────────────────────────────────────────
function buildPointSets() {
  const parsed = document.getElementById('lettersInput').value
    .split(',').map(s => s.trim()).filter(Boolean);
  letters = parsed;
  numPts  = parseInt(document.getElementById('nPts').value);
  pointSets = letters.map(l => sampleGlyph(l[0] || '?', numPts));

  const maxT = Math.max(1, letters.length - 1);
  const tSlider = document.getElementById('tManual');
  tSlider.max = maxT;
  animT = Math.min(animT, maxT);

  document.getElementById('status').textContent =
    `${letters.length} letters · ${numPts} pts each · ${maxT} segment(s)`;
}

// ─────────────────────────────────────────────────────────────────────────────
// p5 sketch
// ─────────────────────────────────────────────────────────────────────────────
new p5(function(p) {
  let barDragging = false;

  p.setup = function() {
    const cnv = p.createCanvas(880, 420);
    cnv.parent('sketch');
    p.colorMode(p.HSB, 360, 100, 100, 100);
    buildPointSets();
    bindUI();
  };

  // ── UI bindings ─────────────────────────────────────────────────────────────
  function bindUI() {
    const bindVal = (id, dispId) =>
      document.getElementById(id).addEventListener('input', function() {
        document.getElementById(dispId).textContent = this.value;
      });
    bindVal('nPts',    'nPtsVal');
    bindVal('speed',   'speedVal');
    bindVal('dotSize', 'dotVal');
    bindVal('trail',   'trailVal');
    bindVal('frameCount', 'frameCountVal');

    document.getElementById('applyBtn').addEventListener('click', buildPointSets);

    document.getElementById('playBtn').addEventListener('click', function() {
      playing = !playing;
      this.textContent = playing ? 'Pause' : 'Play';
      this.classList.toggle('on', !playing);
    });

    document.getElementById('linesBtn').addEventListener('click', function() {
      showLines = !showLines;
      this.textContent = 'Lines: ' + (showLines ? 'On' : 'Off');
      this.classList.toggle('on', showLines);
    });

    document.getElementById('ghostBtn').addEventListener('click', function() {
      showGhost = !showGhost;
      this.textContent = 'Ghost: ' + (showGhost ? 'On' : 'Off');
      this.classList.toggle('on', showGhost);
    });

    document.getElementById('colorBtn').addEventListener('click', function() {
      colorMode = colorMode === 'hue' ? 'mono' : 'hue';
      this.textContent = 'Color: ' + (colorMode === 'hue' ? 'Hue' : 'Mono');
      this.classList.toggle('on', colorMode !== 'hue');
    });

    document.getElementById('filledBtn').addEventListener('click', function() {
      showFilled = !showFilled;
      this.textContent = 'Filled: ' + (showFilled ? 'On' : 'Off');
      this.classList.toggle('on', showFilled);
    });

    document.getElementById('bgBtn').addEventListener('click', function() {
      bgDark = !bgDark;
      this.textContent = bgDark ? 'White BG' : 'Black BG';
      this.classList.toggle('on', !bgDark);
      document.body.classList.toggle('light', !bgDark);
    });

    document.getElementById('saveFramesBtn').addEventListener('click', function() {
      const frameCount = parseInt(document.getElementById('frameCount').value);
      startRecording(frameCount);
      exportFramesJSON();
      this.textContent = 'Saved!';
      setTimeout(() => { this.textContent = 'JSON'; }, 2000);
    });

    document.getElementById('savePngBtn').addEventListener('click', function() {
      const frameCount = parseInt(document.getElementById('frameCount').value);
      startRecording(frameCount);
      exportFramesPNG();
      this.textContent = '...';
      setTimeout(() => { this.textContent = 'PNG'; }, 3000);
    });

    document.getElementById('saveSvgBtn').addEventListener('click', function() {
      const frameCount = parseInt(document.getElementById('frameCount').value);
      startRecording(frameCount);
      exportFramesSVG();
      this.textContent = '...';
      setTimeout(() => { this.textContent = 'SVG'; }, 3000);
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function toScreen(pt) {
    return [
      p.width / 2  + pt.x * p.height * 0.78,
      p.height / 2 - pt.y * p.height * 0.78,
    ];
  }

  function drawPoints(pts, alpha) {
    const dot = parseInt(document.getElementById('dotSize').value);
    p.noStroke();
    for (let i = 0; i < pts.length; i++) {
      const [sx, sy] = toScreen(pts[i]);
      if (colorMode === 'hue') {
        p.fill((i / pts.length * 300 + 160) % 360, 70, 100, alpha);
      } else {
        p.fill(0, 0, bgDark ? 88 : 12, alpha);
      }
      p.ellipse(sx, sy, dot, dot);
    }
  }

  function drawFilled(pts, alpha) {
    if (colorMode === 'hue') {
      p.fill(200, 55, 90, alpha);
    } else {
      p.fill(0, 0, bgDark ? 88 : 12, alpha);
    }
    p.noStroke();
    p.beginShape();
    for (const pt of pts) {
      const [sx, sy] = toScreen(pt);
      p.vertex(sx, sy);
    }
    p.endShape(p.CLOSE);
  }

  function drawLines(pts, alpha) {
    p.strokeWeight(0.8);
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = toScreen(pts[i]);
      const [bx, by] = toScreen(pts[i + 1]);
      if (colorMode === 'hue') {
        p.stroke((i / pts.length * 280 + 160) % 360, 50, 80, alpha * 0.6);
      } else {
        p.stroke(0, 0, bgDark ? 70 : 30, alpha * 0.5);
      }
      p.line(ax, ay, bx, by);
    }
    p.noStroke();
  }

  // ── Main draw loop ───────────────────────────────────────────────────────────
  p.draw = function() {
    const trailV = parseInt(document.getElementById('trail').value);
    if (bgDark) {
      p.background(230, 30, 5, trailV);
    } else {
      p.background(0, 0, 100, trailV);
    }

    if (pointSets.length === 0) {
      p.fill(0, 0, bgDark ? 35 : 65); p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(13);
      p.text('No letters defined.', p.width / 2, p.height / 2);
      return;
    }

    const speedV  = parseInt(document.getElementById('speed').value) / 1000;
    const interpT = document.getElementById('interp').value;
    const maxT    = Math.max(1, letters.length - 1);

    // Advance animation
    if (playing) {
      animT += speedV;
      if (animT >= maxT) animT = 0;
      document.getElementById('tManual').value = animT;
      document.getElementById('tDisp').textContent = animT.toFixed(3);
    }

    // Ghost: show source/target letter outlines faintly
    if (showGhost) {
      const seg = Math.min(Math.floor(animT), letters.length - 2);
      if (pointSets[seg])     drawPoints(pointSets[seg],     12);
      if (pointSets[seg + 1]) drawPoints(pointSets[seg + 1], 12);
    }

    // Interpolated point cloud / filled shape
    const pts = interpolate(pointSets, animT, interpT);
    if (pts && pts.length) {
      if (showFilled) {
        drawFilled(pts, 88);
      } else {
        if (showLines) drawLines(pts, 80);
        drawPoints(pts, 85);
      }
    }

    // ── HUD ─────────────────────────────────────────────────────────────────────
    const seg  = Math.min(Math.floor(animT), letters.length - 2);
    const from = letters[seg]       || '?';
    const to   = letters[seg + 1]   || '?';
    const lt   = animT - seg;

    p.noStroke();
    p.fill(0, 0, bgDark ? 45 : 55, 90);
    p.textAlign(p.LEFT);
    p.textSize(10);
    p.text(
      `${from} → ${to}  |  t: ${animT.toFixed(3)}  |  local: ${lt.toFixed(3)}  |  ${interpT}  |  ${numPts} pts`,
      10, p.height - 10
    );

    // ── Interactive scrubber ─────────────────────────────────────────────────
    const barX = 44, barW = p.width - 88, barY = 36, barH = 5;
    const overBar = p.mouseX >= barX - 10 && p.mouseX <= barX + barW + 10 &&
                    p.mouseY >= 6 && p.mouseY <= barY + barH + 14;

    p.cursor(overBar || barDragging ? p.HAND : p.ARROW);

    // Letter labels and tick marks
    for (let i = 0; i < letters.length; i++) {
      const fx   = p.map(i, 0, Math.max(1, letters.length - 1), barX, barX + barW);
      const dist = Math.abs(animT - i);
      const alph = p.map(p.constrain(1 - dist, 0, 1), 0, 1, 22, 98);

      p.noStroke();
      p.fill(0, 0, bgDark ? 60 : 40, alph);
      p.textAlign(p.CENTER);
      p.textSize(11);
      p.text(letters[i], fx, 14);

      // Tick
      p.fill(200, 35, bgDark ? 80 : 45, alph);
      p.rect(fx - 0.5, barY - 7, 1, barH + 7);
    }

    // Track
    p.noStroke();
    p.fill(0, 0, bgDark ? 14 : 86, 80);
    p.rect(barX, barY, barW, barH, barH / 2);

    // Fill
    const fillW = barW * (animT / maxT);
    p.fill(190, 55, bgDark ? 88 : 55, 88);
    p.rect(barX, barY, fillW, barH, barH / 2);

    // Handle
    const handleX = barX + fillW;
    p.fill(overBar || barDragging ? 190 : 200, 40, bgDark ? 100 : 70, 95);
    p.noStroke();
    p.ellipse(handleX, barY + barH / 2, 11, 11);
  };

  // ── Scrubber mouse interaction ───────────────────────────────────────────────
  function scrubFromMouse() {
    const barX = 44, barW = p.width - 88;
    const maxT = Math.max(1, letters.length - 1);
    animT = p.constrain(p.map(p.mouseX, barX, barX + barW, 0, maxT), 0, maxT);
    document.getElementById('tManual').value = animT;
    document.getElementById('tDisp').textContent = animT.toFixed(3);
  }

  p.mousePressed = function() {
    const barX = 44, barW = p.width - 88, barY = 36, barH = 5;
    if (p.mouseX >= barX - 10 && p.mouseX <= barX + barW + 10 &&
        p.mouseY >= 6 && p.mouseY <= barY + barH + 14) {
      barDragging = true;
      scrubFromMouse();
      playing = false;
      const btn = document.getElementById('playBtn');
      btn.textContent = 'Play';
      btn.classList.add('on');
    }
  };

  p.mouseDragged = function() {
    if (barDragging) scrubFromMouse();
  };

  p.mouseReleased = function() {
    barDragging = false;
  };
});