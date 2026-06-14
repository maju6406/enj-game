import { TILE } from '../data/constants.js';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
}

function add(scene, key, c) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  scene.textures.addCanvas(key, c);
}

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function outline(ctx, x, y, w, h, light, dark) {
  rect(ctx, x, y, w, 2, light); rect(ctx, x, y, 2, h, light);
  rect(ctx, x, y + h - 2, w, 2, dark); rect(ctx, x + w - 2, y, 2, h, dark);
}

function tile(scene, key, base, light, dark, accent = null) {
  const [c, ctx] = canvas(TILE, TILE);
  rect(ctx, 0, 0, TILE, TILE, base);
  outline(ctx, 0, 0, TILE, TILE, light, dark);
  if (accent) {
    rect(ctx, 3, 3, 3, 3, accent);
    rect(ctx, 10, 8, 3, 3, accent);
  }
  add(scene, key, c);
}

function hazard(scene, key, color) {
  const [c, ctx] = canvas(TILE, TILE);
  rect(ctx, 0, 12, TILE, 4, '#301020');
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(1, 14); ctx.lineTo(5, 3); ctx.lineTo(9, 14);
  ctx.moveTo(7, 14); ctx.lineTo(12, 2); ctx.lineTo(15, 14);
  ctx.fill();
  add(scene, key, c);
}

function questionTile(scene) {
  const [c, ctx] = canvas(TILE, TILE);
  rect(ctx, 0, 0, TILE, TILE, '#d8892c');
  outline(ctx, 0, 0, TILE, TILE, '#ffd66e', '#7a3c08');
  rect(ctx, 6, 3, 5, 2, '#fff5a0');
  rect(ctx, 10, 5, 2, 3, '#fff5a0');
  rect(ctx, 7, 8, 4, 2, '#fff5a0');
  rect(ctx, 7, 12, 3, 2, '#fff5a0');
  rect(ctx, 5, 3, 1, 1, '#7a3c08');
  rect(ctx, 11, 9, 1, 1, '#7a3c08');
  add(scene, 'tile-question', c);
}

function coin(scene) {
  const [c, ctx] = canvas(10, 14);
  rect(ctx, 3, 1, 4, 12, '#ffb51f');
  rect(ctx, 1, 3, 8, 8, '#ffe060');
  rect(ctx, 4, 3, 2, 8, '#fff5a0');
  outline(ctx, 1, 3, 8, 8, '#fff5a0', '#b86e00');
  add(scene, 'relic', c);
}

function journal(scene) {
  const [c, ctx] = canvas(14, 14);
  rect(ctx, 2, 1, 10, 12, '#7ad6ff');
  outline(ctx, 2, 1, 10, 12, '#d9fbff', '#205a86');
  rect(ctx, 5, 3, 1, 8, '#205a86');
  rect(ctx, 8, 5, 2, 1, '#205a86');
  add(scene, 'journal', c);
}

function enemies(scene) {
  let c, ctx;
  [c, ctx] = canvas(20, 18);
  rect(ctx, 5, 4, 10, 9, '#151515');
  rect(ctx, 4, 6, 12, 8, '#151515');
  rect(ctx, 6, 3, 8, 8, '#254814');
  rect(ctx, 7, 3, 7, 7, '#b7ee58');
  rect(ctx, 7, 7, 8, 6, '#78b83f');
  rect(ctx, 8, 5, 2, 2, '#ffffff');
  rect(ctx, 13, 5, 2, 2, '#ffffff');
  rect(ctx, 9, 6, 1, 1, '#111111');
  rect(ctx, 13, 6, 1, 1, '#111111');
  rect(ctx, 7, 10, 7, 2, '#4b2f18');
  rect(ctx, 5, 14, 5, 3, '#2d1a0a');
  rect(ctx, 12, 14, 5, 3, '#2d1a0a');
  rect(ctx, 5, 14, 3, 1, '#8a5a2b');
  rect(ctx, 12, 14, 3, 1, '#8a5a2b');
  add(scene, 'enemy-grunt', c);

  [c, ctx] = canvas(24, 18);
  rect(ctx, 4, 8, 16, 7, '#143827');
  rect(ctx, 5, 7, 14, 7, '#7fdcae');
  rect(ctx, 6, 8, 12, 3, '#c3ffd8');
  rect(ctx, 3, 6, 4, 5, '#d8bd53');
  rect(ctx, 17, 6, 4, 5, '#d8bd53');
  rect(ctx, 7, 3, 10, 7, '#143827');
  rect(ctx, 8, 4, 9, 5, '#315c3b');
  rect(ctx, 8, 6, 3, 2, '#ffef92');
  rect(ctx, 14, 6, 3, 2, '#ffef92');
  rect(ctx, 10, 7, 1, 1, '#111111');
  rect(ctx, 14, 7, 1, 1, '#111111');
  rect(ctx, 4, 14, 5, 3, '#205a40');
  rect(ctx, 15, 14, 5, 3, '#205a40');
  rect(ctx, 6, 15, 3, 1, '#c3ffd8');
  rect(ctx, 15, 15, 3, 1, '#c3ffd8');
  add(scene, 'enemy-chupacabra', c);

  [c, ctx] = canvas(22, 12);
  rect(ctx, 3, 5, 16, 5, '#143827');
  rect(ctx, 4, 4, 14, 5, '#7fdcae');
  rect(ctx, 6, 3, 10, 4, '#c3ffd8');
  rect(ctx, 5, 7, 12, 2, '#315c3b');
  rect(ctx, 8, 5, 2, 2, '#d8bd53');
  rect(ctx, 13, 5, 2, 2, '#d8bd53');
  rect(ctx, 2, 9, 5, 2, '#205a40');
  rect(ctx, 15, 9, 5, 2, '#205a40');
  add(scene, 'enemy-chupacabra-shell', c);

  [c, ctx] = canvas(30, 22);
  ctx.fillStyle = '#151526';
  ctx.beginPath(); ctx.moveTo(13, 8); ctx.lineTo(1, 2); ctx.lineTo(4, 17); ctx.lineTo(12, 14); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(17, 8); ctx.lineTo(29, 2); ctx.lineTo(26, 17); ctx.lineTo(18, 14); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#3c365f';
  ctx.beginPath(); ctx.moveTo(13, 9); ctx.lineTo(4, 4); ctx.lineTo(6, 14); ctx.lineTo(12, 12); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(17, 9); ctx.lineTo(26, 4); ctx.lineTo(24, 14); ctx.lineTo(18, 12); ctx.closePath(); ctx.fill();
  rect(ctx, 11, 7, 8, 11, '#1b1b2f');
  rect(ctx, 12, 5, 6, 5, '#5a527a');
  rect(ctx, 13, 6, 2, 2, '#ff3b3b');
  rect(ctx, 16, 6, 2, 2, '#ff3b3b');
  rect(ctx, 13, 17, 2, 3, '#111111');
  rect(ctx, 17, 17, 2, 3, '#111111');
  rect(ctx, 7, 5, 3, 2, '#70679a');
  rect(ctx, 21, 5, 3, 2, '#70679a');
  add(scene, 'enemy-mothman', c);

  [c, ctx] = canvas(44, 44);
  ctx.fillStyle = '#1b0710';
  ctx.beginPath(); ctx.moveTo(14, 19); ctx.lineTo(2, 5); ctx.lineTo(6, 34); ctx.lineTo(17, 30); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(30, 19); ctx.lineTo(42, 5); ctx.lineTo(38, 34); ctx.lineTo(27, 30); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#5a2332';
  ctx.beginPath(); ctx.moveTo(15, 20); ctx.lineTo(6, 9); ctx.lineTo(8, 28); ctx.lineTo(17, 27); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(29, 20); ctx.lineTo(38, 9); ctx.lineTo(36, 28); ctx.lineTo(27, 27); ctx.closePath(); ctx.fill();
  rect(ctx, 12, 14, 20, 23, '#250911');
  rect(ctx, 13, 13, 18, 23, '#7a3448');
  rect(ctx, 15, 16, 14, 7, '#b44a5a');
  rect(ctx, 17, 6, 11, 11, '#250911');
  rect(ctx, 18, 5, 9, 10, '#8f3c52');
  rect(ctx, 19, 8, 3, 3, '#ffd34d');
  rect(ctx, 25, 8, 3, 3, '#ffd34d');
  rect(ctx, 20, 9, 1, 1, '#111111');
  rect(ctx, 26, 9, 1, 1, '#111111');
  rect(ctx, 21, 13, 5, 2, '#250911');
  rect(ctx, 11, 35, 9, 5, '#1b0710');
  rect(ctx, 25, 35, 9, 5, '#1b0710');
  rect(ctx, 13, 35, 5, 2, '#b44a5a');
  rect(ctx, 25, 35, 5, 2, '#b44a5a');
  add(scene, 'enemy-boss', c);
}

function hud(scene) {
  const [heart, hctx] = canvas(9, 8);
  rect(hctx, 1, 1, 3, 3, '#ff6a8a'); rect(hctx, 5, 1, 3, 3, '#ff6a8a');
  rect(hctx, 0, 3, 9, 2, '#ff3b60'); rect(hctx, 2, 5, 5, 2, '#c71f46'); rect(hctx, 4, 7, 1, 1, '#8d102d');
  add(scene, 'heart', heart);
}

function scenery(scene) {
  let c, ctx;

  [c, ctx] = canvas(48, 22);
  rect(ctx, 8, 10, 30, 8, '#ffffff');
  rect(ctx, 14, 5, 12, 8, '#ffffff');
  rect(ctx, 25, 7, 12, 9, '#ffffff');
  rect(ctx, 2, 14, 42, 5, '#d9f3ff');
  rect(ctx, 10, 18, 24, 2, '#9bc8f0');
  add(scene, 'scenery-cloud', c);

  [c, ctx] = canvas(72, 36);
  ctx.fillStyle = '#4c9f44';
  ctx.beginPath();
  ctx.moveTo(0, 36); ctx.lineTo(18, 10); ctx.lineTo(36, 30); ctx.lineTo(54, 6); ctx.lineTo(72, 36);
  ctx.closePath(); ctx.fill();
  rect(ctx, 17, 14, 3, 3, '#2d6c2d');
  rect(ctx, 53, 10, 3, 3, '#2d6c2d');
  add(scene, 'scenery-hills', c);

  [c, ctx] = canvas(42, 18);
  rect(ctx, 2, 10, 38, 6, '#1d6b2c');
  rect(ctx, 7, 5, 12, 10, '#2ea043');
  rect(ctx, 18, 3, 14, 12, '#34b455');
  rect(ctx, 30, 7, 8, 8, '#2ea043');
  add(scene, 'scenery-bush', c);
}

export function fallbackHeroTextures(scene) {
  const make = (key, hair, outfit) => {
    const [c, ctx] = canvas(18, 32);
    rect(ctx, 6, 3, 7, 6, hair);
    rect(ctx, 5, 8, 9, 9, '#f3b98c');
    rect(ctx, 4, 16, 11, 10, outfit);
    rect(ctx, 5, 26, 3, 5, '#263858');
    rect(ctx, 10, 26, 3, 5, '#263858');
    rect(ctx, 4, 30, 4, 2, '#d43c30');
    rect(ctx, 10, 30, 4, 2, '#d43c30');
    add(scene, key, c);
  };
  make('hero-jack', '#6b3a1e', '#15151c');
  make('hero-evee', '#a34a28', '#b06ad8');
}

export function generateTextures(scene) {
  tile(scene, 'tile-ground', '#7c5a28', '#b98b3c', '#352010', '#5ea63e');
  tile(scene, 'tile-block', '#8b5a2b', '#d69249', '#43230d');
  tile(scene, 'tile-brick', '#a04d22', '#e29b58', '#4a1f0c');
  questionTile(scene);
  tile(scene, 'tile-used', '#796552', '#a89986', '#33291f');
  tile(scene, 'tile-platform', '#91693a', '#d3a05a', '#3d2810');
  tile(scene, 'tile-pipe', '#237a34', '#62d66b', '#0d3518');
  tile(scene, 'tile-stone', '#56586b', '#9ca0b8', '#202231');
  hazard(scene, 'tile-spikes', '#e5e8ef');
  hazard(scene, 'tile-lava', '#ff5a1f');
  coin(scene); journal(scene); enemies(scene); hud(scene); scenery(scene);
}

export function extractHeroTextures(scene) {
  const img = scene.textures.get('characters-source').getSourceImage();
  const [work, ctx] = canvas(img.width, img.height);
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, work.width, work.height);
  const pix = data.data;
  const q = [];
  const seen = new Uint8Array(work.width * work.height);
  const nearWhite = (i) => pix[i] >= 230 && pix[i + 1] >= 230 && pix[i + 2] >= 230;
  const push = (x, y) => { if (x >= 0 && y >= 0 && x < work.width && y < work.height) q.push([x, y]); };
  for (let x = 0; x < work.width; x++) { push(x, 0); push(x, work.height - 1); }
  for (let y = 0; y < work.height; y++) { push(0, y); push(work.width - 1, y); }
  while (q.length) {
    const [x, y] = q.pop();
    const n = y * work.width + x, i = n * 4;
    if (seen[n] || !nearWhite(i)) continue;
    seen[n] = 1; pix[i + 3] = 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
  ctx.putImageData(data, 0, 0);

  const cols = [];
  for (let x = 0; x < work.width; x++) {
    let count = 0;
    for (let y = 0; y < work.height; y++) if (pix[(y * work.width + x) * 4 + 3] > 10) count++;
    cols[x] = count;
  }
  const runs = [];
  for (let x = 0; x < cols.length;) {
    while (x < cols.length && cols[x] < 5) x++;
    const start = x;
    while (x < cols.length && cols[x] >= 5) x++;
    if (x - start > 20) runs.push([start, x - 1]);
  }
  runs.sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]));
  const two = runs.slice(0, 2).sort((a, b) => a[0] - b[0]);
  if (two.length < 2) throw new Error('could not find two hero figures in reference art');
  const crop = ([x0, x1], key) => {
    let y0 = work.height, y1 = 0;
    for (let y = 0; y < work.height; y++) for (let x = x0; x <= x1; x++) {
      if (pix[(y * work.width + x) * 4 + 3] > 10) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    }
    x0 = Math.max(0, x0 - 3); x1 = Math.min(work.width - 1, x1 + 3);
    y0 = Math.max(0, y0 - 3); y1 = Math.min(work.height - 1, y1 + 3);
    const [out, octx] = canvas(x1 - x0 + 1, y1 - y0 + 1);
    octx.drawImage(work, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
    add(scene, key, out);
  };
  crop(two[0], 'hero-jack');
  crop(two[1], 'hero-evee');
}
