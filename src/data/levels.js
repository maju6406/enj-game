import { GRID_H, TILE } from './constants.js';

function makeBuilder(w) {
  const H = GRID_H;
  const g = Array.from({ length: H }, () => new Array(w).fill(' '));
  const enemies = [];
  const api = {
    width: w, height: H, grid: g, enemies,
    start: { x: 2 * TILE, y: 11 * TILE },
    flagX: null, isBoss: false,
    set(x, y, ch) { if (x >= 0 && x < w && y >= 0 && y < H) g[y][x] = ch; },
    rect(x0, y0, x1, y1, ch) {
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) api.set(x, y, ch);
    },
    ground(x0, x1, top = 13) { api.rect(x0, top, x1, H - 1, '#'); },
    pipe(x, height) {
      const bottom = 12, topR = bottom - (height - 1);
      for (let r = topR; r <= bottom; r++) {
        if (r === topR) { api.set(x, r, '['); api.set(x + 1, r, ']'); }
        else { api.set(x, r, '{'); api.set(x + 1, r, '}'); }
      }
    },
    stairs(x, dir, n) {
      for (let i = 0; i < n; i++) {
        const col = x + i * dir;
        for (let r = 12; r >= 12 - i; r--) api.set(col, r, 'X');
      }
    },
    coins(x0, x1, row) { for (let x = x0; x <= x1; x++) api.set(x, row, 'o'); },
    enemy(type, tx, opts = {}) {
      const groundTop = (opts.row == null ? 13 : opts.row) * TILE;
      enemies.push({ type, x: tx * TILE, gy: opts.fly != null ? opts.fly * TILE : groundTop });
    },
    flag(x) { api.flagX = x; },
    setStart(tx, ty) { api.start = { x: tx * TILE, y: ty * TILE }; },
    build(meta) {
      return {
        tiles: g.map((r) => r.join('')),
        enemies,
        start: api.start,
        flagX: api.flagX,
        isBoss: api.isBoss,
        width: w,
        height: H,
        ...meta,
      };
    },
  };
  return api;
}

function level1() {
  const b = makeBuilder(212);
  b.ground(0, 211);
  b.rect(40, 13, 42, 14, ' '); b.rect(78, 13, 80, 14, ' '); b.rect(150, 13, 152, 14, ' ');
  b.setStart(2, 11);
  b.set(16, 9, 'B'); b.set(17, 9, '?'); b.set(18, 9, 'B'); b.set(19, 9, 'U'); b.set(20, 9, 'B');
  b.set(18, 5, '?'); b.set(56, 9, '?'); b.set(57, 9, '?'); b.set(58, 9, '?'); b.coins(56, 58, 6);
  b.set(96, 9, 'B'); b.set(97, 9, '?'); b.set(98, 9, 'B'); b.coins(108, 112, 8);
  b.pipe(30, 2); b.pipe(64, 3); b.pipe(120, 4); b.pipe(134, 2);
  b.enemy('grunt', 24); b.enemy('grunt', 52); b.enemy('chupacabra', 70);
  b.enemy('grunt', 100); b.enemy('grunt', 102); b.enemy('mothman', 90, { fly: 6 });
  b.enemy('mothman', 160, { fly: 5 }); b.enemy('chupacabra', 140);
  b.stairs(188, 1, 4); b.flag(200); b.rect(204, 6, 208, 12, ' ');
  return b.build({ name: 'CRYPT HOLLOW', theme: 'overworld', time: 300 });
}

function level2() {
  const b = makeBuilder(176);
  b.ground(0, 175); b.rect(0, 0, 175, 1, '#'); b.setStart(2, 11);
  for (let x = 8; x < 30; x += 3) b.set(x, 4, 'B');
  b.coins(8, 28, 6); b.set(20, 4, '?'); b.set(23, 4, 'U');
  b.rect(36, 10, 37, 12, 'X'); b.rect(54, 9, 55, 12, 'X'); b.rect(72, 8, 73, 12, 'X');
  b.rect(48, 2, 49, 4, 'X'); b.rect(66, 2, 67, 5, 'X'); b.rect(96, 2, 97, 4, 'X');
  b.rect(86, 8, 90, 8, '='); b.coins(86, 90, 7); b.rect(104, 7, 108, 7, '='); b.coins(104, 108, 6);
  b.rect(120, 9, 124, 9, '='); b.rect(60, 13, 62, 14, ' '); b.rect(112, 13, 114, 14, ' ');
  b.enemy('grunt', 30); b.enemy('chupacabra', 44); b.enemy('grunt', 58); b.enemy('grunt', 88, { row: 8 });
  b.enemy('chupacabra', 100); b.enemy('mothman', 78, { fly: 6 }); b.enemy('mothman', 130, { fly: 6 });
  b.enemy('grunt', 132); b.enemy('grunt', 134); b.pipe(150, 3); b.stairs(156, 1, 3); b.flag(166);
  return b.build({ name: 'GLOOM CAVERN', theme: 'underground', time: 300 });
}

function level3() {
  const b = makeBuilder(196);
  b.ground(0, 10); b.setStart(2, 11);
  const plats = [[14,11,3],[22,9,3],[30,12,2],[37,10,3],[46,8,3],[55,11,2],[62,9,3],[71,12,3],[80,10,2],[88,8,3],[97,11,3],[106,9,2],[114,12,3],[123,10,3],[133,8,3],[142,11,3],[151,10,4]];
  for (const [x, row, len] of plats) b.rect(x, row, x + len - 1, row, '=');
  b.coins(22, 24, 7); b.coins(46, 48, 6); b.coins(88, 90, 6); b.coins(133, 135, 6);
  b.set(38, 6, '?'); b.set(98, 7, 'U');
  b.enemy('grunt', 23, { row: 9 }); b.enemy('grunt', 72, { row: 12 }); b.enemy('grunt', 124, { row: 10 });
  b.enemy('mothman', 34, { fly: 6 }); b.enemy('mothman', 66, { fly: 5 }); b.enemy('mothman', 100, { fly: 7 });
  b.enemy('mothman', 138, { fly: 5 }); b.enemy('chupacabra', 47, { row: 8 });
  b.ground(160, 195); b.stairs(176, 1, 4); b.flag(188);
  return b.build({ name: 'SKYWARD RIDGE', theme: 'athletic', time: 300 });
}

function level4() {
  const b = makeBuilder(208);
  b.ground(0, 207, 13); b.setStart(2, 11);
  const lavaPit = (x0, x1) => { b.rect(x0, 13, x1, 14, ' '); b.rect(x0, 13, x1, 14, 'v'); };
  lavaPit(30, 34); b.rect(31, 10, 32, 10, '='); b.rect(33, 8, 34, 8, '=');
  lavaPit(52, 57); b.rect(53, 10, 54, 10, '='); b.rect(56, 9, 57, 9, '=');
  lavaPit(80, 86); b.rect(81, 10, 82, 10, '='); b.rect(84, 9, 85, 9, '=');
  b.set(44, 12, '^'); b.set(45, 12, '^'); b.set(70, 12, '^'); b.rect(64, 10, 65, 12, 'X'); b.rect(96, 9, 97, 12, 'X');
  b.set(20, 8, 'U'); for (let x = 100; x < 112; x += 2) b.set(x, 5, 'B'); b.coins(100, 110, 6);
  lavaPit(118, 124); b.rect(119, 10, 120, 10, '='); b.rect(122, 9, 123, 9, '=');
  b.enemy('chupacabra', 26); b.enemy('grunt', 48); b.enemy('grunt', 50); b.enemy('mothman', 60, { fly: 6 });
  b.enemy('chupacabra', 92); b.enemy('mothman', 110, { fly: 5 }); b.enemy('grunt', 130);
  b.rect(150, 0, 207, 1, '#'); b.enemy('boss', 180, { row: 13 }); b.isBoss = true;
  return b.build({ name: 'DEVIL KEEP', theme: 'castle', time: 300 });
}

export const LEVELS = [level1(), level2(), level3(), level4()];
