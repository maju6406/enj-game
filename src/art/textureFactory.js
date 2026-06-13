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
  [c, ctx] = canvas(16, 14);
  rect(ctx, 2, 5, 12, 8, '#6b4524'); rect(ctx, 4, 2, 8, 7, '#9adf4a');
  rect(ctx, 5, 5, 2, 2, '#111'); rect(ctx, 10, 5, 2, 2, '#111');
  rect(ctx, 2, 11, 4, 2, '#2d1a0a'); rect(ctx, 10, 11, 4, 2, '#2d1a0a');
  add(scene, 'enemy-grunt', c);

  [c, ctx] = canvas(18, 16);
  rect(ctx, 3, 5, 12, 8, '#7fdcae'); outline(ctx, 3, 5, 12, 8, '#c3ffd8', '#226448');
  rect(ctx, 1, 7, 3, 4, '#d6c060'); rect(ctx, 14, 7, 3, 4, '#d6c060');
  rect(ctx, 5, 3, 8, 5, '#315c3b'); rect(ctx, 6, 5, 2, 2, '#111'); rect(ctx, 11, 5, 2, 2, '#111');
  add(scene, 'enemy-chupacabra', c);

  [c, ctx] = canvas(24, 18);
  rect(ctx, 10, 4, 4, 10, '#343450');
  ctx.fillStyle = '#2a2a40';
  ctx.beginPath(); ctx.moveTo(10, 7); ctx.lineTo(1, 0); ctx.lineTo(4, 14); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(14, 7); ctx.lineTo(23, 0); ctx.lineTo(20, 14); ctx.closePath(); ctx.fill();
  rect(ctx, 9, 2, 6, 4, '#5a527a'); rect(ctx, 10, 4, 1, 1, '#ff4040'); rect(ctx, 13, 4, 1, 1, '#ff4040');
  add(scene, 'enemy-mothman', c);

  [c, ctx] = canvas(34, 34);
  rect(ctx, 9, 10, 16, 20, '#5a2332'); outline(ctx, 9, 10, 16, 20, '#b44a5a', '#250911');
  ctx.fillStyle = '#3a1420';
  ctx.beginPath(); ctx.moveTo(9, 16); ctx.lineTo(1, 5); ctx.lineTo(5, 27); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(25, 16); ctx.lineTo(33, 5); ctx.lineTo(29, 27); ctx.closePath(); ctx.fill();
  rect(ctx, 13, 5, 8, 8, '#7a3448'); rect(ctx, 14, 8, 2, 2, '#ffd34d'); rect(ctx, 19, 8, 2, 2, '#ffd34d');
  add(scene, 'enemy-boss', c);
}

function hud(scene) {
  const [heart, hctx] = canvas(9, 8);
  rect(hctx, 1, 1, 3, 3, '#ff6a8a'); rect(hctx, 5, 1, 3, 3, '#ff6a8a');
  rect(hctx, 0, 3, 9, 2, '#ff3b60'); rect(hctx, 2, 5, 5, 2, '#c71f46'); rect(hctx, 4, 7, 1, 1, '#8d102d');
  add(scene, 'heart', heart);
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
  tile(scene, 'tile-question', '#d8892c', '#ffd66e', '#7a3c08');
  tile(scene, 'tile-used', '#796552', '#a89986', '#33291f');
  tile(scene, 'tile-platform', '#91693a', '#d3a05a', '#3d2810');
  tile(scene, 'tile-pipe', '#237a34', '#62d66b', '#0d3518');
  tile(scene, 'tile-stone', '#56586b', '#9ca0b8', '#202231');
  hazard(scene, 'tile-spikes', '#e5e8ef');
  hazard(scene, 'tile-lava', '#ff5a1f');
  coin(scene); journal(scene); enemies(scene); hud(scene);
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
