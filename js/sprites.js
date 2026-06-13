// Sprites: bitmap font, character-art extraction, and all procedural art.
(function () {
  function p(ctx, c, X, Y, w, h) { ctx.fillStyle = c; ctx.fillRect(X | 0, Y | 0, w | 0, h | 0); }

  /* ---------------- 5x7 bitmap font ---------------- */
  const FONT = {
    A:[" ### ","#   #","#   #","#####","#   #","#   #","#   #"],
    B:["#### ","#   #","#### ","#   #","#   #","#   #","#### "],
    C:[" ####","#    ","#    ","#    ","#    ","#    "," ####"],
    D:["#### ","#   #","#   #","#   #","#   #","#   #","#### "],
    E:["#####","#    ","#### ","#    ","#    ","#    ","#####"],
    F:["#####","#    ","#### ","#    ","#    ","#    ","#    "],
    G:[" ####","#    ","#    ","#  ##","#   #","#   #"," ####"],
    H:["#   #","#   #","#   #","#####","#   #","#   #","#   #"],
    I:["#####","  #  ","  #  ","  #  ","  #  ","  #  ","#####"],
    J:["  ###","   # ","   # ","   # ","#  # ","#  # "," ##  "],
    K:["#   #","#  # ","# #  ","##   ","# #  ","#  # ","#   #"],
    L:["#    ","#    ","#    ","#    ","#    ","#    ","#####"],
    M:["#   #","## ##","# # #","# # #","#   #","#   #","#   #"],
    N:["#   #","##  #","# # #","# # #","#  ##","#   #","#   #"],
    O:[" ### ","#   #","#   #","#   #","#   #","#   #"," ### "],
    P:["#### ","#   #","#   #","#### ","#    ","#    ","#    "],
    Q:[" ### ","#   #","#   #","#   #","# # #","#  # "," ## #"],
    R:["#### ","#   #","#   #","#### ","# #  ","#  # ","#   #"],
    S:[" ####","#    ","#    "," ### ","    #","    #","#### "],
    T:["#####","  #  ","  #  ","  #  ","  #  ","  #  ","  #  "],
    U:["#   #","#   #","#   #","#   #","#   #","#   #"," ### "],
    V:["#   #","#   #","#   #","#   #","#   #"," # # ","  #  "],
    W:["#   #","#   #","#   #","# # #","# # #","## ##","#   #"],
    X:["#   #","#   #"," # # ","  #  "," # # ","#   #","#   #"],
    Y:["#   #","#   #"," # # ","  #  ","  #  ","  #  ","  #  "],
    Z:["#####","    #","   # ","  #  "," #   ","#    ","#####"],
    "0":[" ### ","#   #","#  ##","# # #","##  #","#   #"," ### "],
    "1":["  #  "," ##  ","  #  ","  #  ","  #  ","  #  "," ### "],
    "2":[" ### ","#   #","    #","   # ","  #  "," #   ","#####"],
    "3":["#####","   # ","  #  ","   # ","    #","#   #"," ### "],
    "4":["   # ","  ## "," # # ","#  # ","#####","   # ","   # "],
    "5":["#####","#    ","#### ","    #","    #","#   #"," ### "],
    "6":["  ## "," #   ","#    ","#### ","#   #","#   #"," ### "],
    "7":["#####","    #","   # ","  #  "," #   "," #   "," #   "],
    "8":[" ### ","#   #","#   #"," ### ","#   #","#   #"," ### "],
    "9":[" ### ","#   #","#   #"," ####","    #","   # "," ##  "],
    "x":["     ","     ","#   #"," # # ","  #  "," # # ","#   #"],
    "-":["     ","     ","     ","#####","     ","     ","     "],
    ".":["     ","     ","     ","     ","     "," ##  "," ##  "],
    "!":["  #  ","  #  ","  #  ","  #  ","  #  ","     ","  #  "],
    ":":["     "," ##  "," ##  ","     "," ##  "," ##  ","     "],
    " ":["     ","     ","     ","     ","     ","     ","     "],
  };

  function drawText(ctx, str, X, Y, col, sc) {
    sc = sc || 1; str = ('' + str).toUpperCase();
    for (let i = 0; i < str.length; i++) {
      const g = FONT[str[i]] || FONT[' '];
      for (let r = 0; r < 7; r++)
        for (let c = 0; c < 5; c++)
          if (g[r][c] === '#') p(ctx, col, X + i * 6 * sc + c * sc, Y + r * sc, sc, sc);
    }
  }
  function textWidth(str, sc) { sc = sc || 1; return ('' + str).length * 6 * sc; }
  function drawTextC(ctx, str, cx, Y, col, sc) {
    drawText(ctx, str, Math.round(cx - textWidth(str, sc) / 2), Y, col, sc);
  }
  function drawTextS(ctx, str, X, Y, col, sc) { // shadowed
    drawText(ctx, str, X + sc, Y + sc, 'rgba(0,0,0,.65)', sc);
    drawText(ctx, str, X, Y, col, sc);
  }

  /* ---------------- character art extraction ---------------- */
  const heroes = { jack: null, evee: null };

  function nearWhite(d, i) { return d[i] >= 230 && d[i + 1] >= 230 && d[i + 2] >= 230; }

  function processImage(img) {
    const w = img.naturalWidth, h = img.naturalHeight;
    const off = document.createElement('canvas');
    off.width = w; off.height = h;
    const o = off.getContext('2d');
    o.drawImage(img, 0, 0);
    const id = o.getImageData(0, 0, w, h);
    const d = id.data;
    const n = w * h;
    // Flood fill near-white background from borders -> transparent.
    const bg = new Uint8Array(n);
    const stack = [];
    function push(x, y) {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const idx = y * w + x;
      if (bg[idx]) return;
      if (!nearWhite(d, idx * 4)) return;
      bg[idx] = 1; stack.push(idx);
    }
    for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
    for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
    while (stack.length) {
      const idx = stack.pop();
      const x = idx % w, y = (idx / w) | 0;
      push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
    }
    for (let i = 0; i < n; i++) if (bg[i]) d[i * 4 + 3] = 0;
    o.putImageData(id, 0, 0);

    // Column ink occupancy to split the two figures.
    const col = new Int32Array(w);
    for (let x = 0; x < w; x++) {
      let cnt = 0;
      for (let y = 0; y < h; y++) if (d[(y * w + x) * 4 + 3] > 16) cnt++;
      col[x] = cnt;
    }
    // Find contiguous runs with ink.
    const runs = [];
    let s = -1;
    for (let x = 0; x < w; x++) {
      if (col[x] > 3) { if (s < 0) s = x; }
      else { if (s >= 0) { runs.push([s, x - 1]); s = -1; } }
    }
    if (s >= 0) runs.push([s, w - 1]);
    runs.sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]));
    const two = runs.slice(0, 2).sort((a, b) => a[0] - b[0]);
    if (two.length < 2) return false;

    function crop(x0, x1) {
      let y0 = h, y1 = 0;
      for (let x = x0; x <= x1; x++)
        for (let y = 0; y < h; y++)
          if (d[(y * w + x) * 4 + 3] > 16) { if (y < y0) y0 = y; if (y > y1) y1 = y; }
      const pad = 2;
      x0 = Math.max(0, x0 - pad); x1 = Math.min(w - 1, x1 + pad);
      y0 = Math.max(0, y0 - pad); y1 = Math.min(h - 1, y1 + pad);
      const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
      const cc = document.createElement('canvas');
      cc.width = cw; cc.height = ch;
      cc.getContext('2d').drawImage(off, x0, y0, cw, ch, 0, 0, cw, ch);
      return cc;
    }
    heroes.jack = crop(two[0][0], two[0][1]);
    heroes.evee = crop(two[1][0], two[1][1]);
    return true;
  }

  function load() {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { try { processImage(img); } catch (e) { console.warn('art', e); } resolve(); };
      img.onerror = () => { console.warn('character art failed to load'); resolve(); };
      img.src = 'assets/characters-source.png';
    });
  }

  function drawHero(ctx, who, cx, footY, w, h, facing, sx, sy) {
    const img = heroes[who];
    ctx.save();
    ctx.translate(cx, footY);
    ctx.scale(facing < 0 ? -1 : 1, 1);
    ctx.scale(sx || 1, sy || 1);
    if (img) {
      const prev = ctx.imageSmoothingEnabled;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(img, -w / 2, -h, w, h);
      ctx.imageSmoothingEnabled = prev;
    } else {
      p(ctx, who === 'jack' ? '#15151c' : '#b06ad8', -w / 2, -h, w, h);
    }
    ctx.restore();
  }

  /* ---------------- tiles ---------------- */
  const THEME = {
    overworld: { grassy: true, brick: ['#c4702e','#e09a55','#9c4c14','#5f2c09'] },
    athletic:  { grassy: true, brick: ['#c4702e','#e09a55','#9c4c14','#5f2c09'] },
    underground:{ grassy: false, top:'#26c0e8', face:'#1577a8', hi:'#7fe0f6', lo:'#0e4f78', edge:'#08344f',
                  brick:['#1577a8','#7fe0f6','#0e4f78','#08344f'] },
    castle:    { grassy: false, top:'#a6a6b6', face:'#6e6e80', hi:'#c8c8d6', lo:'#46465a', edge:'#2c2c3a',
                  brick:['#6e6e80','#c8c8d6','#46465a','#2c2c3a'] },
  };

  function grassGround(ctx, X, Y) {
    p(ctx,'#2aa82a',X,Y,16,5); p(ctx,'#54d836',X,Y,16,2); p(ctx,'#1f8c1f',X,Y+4,16,1);
    p(ctx,'#54d836',X+2,Y+1,1,2); p(ctx,'#54d836',X+7,Y+1,1,2); p(ctx,'#54d836',X+12,Y+1,1,2);
    p(ctx,'#b8631f',X,Y+5,16,11); p(ctx,'#d07f33',X+1,Y+5,14,4); p(ctx,'#9c4c14',X,Y+12,16,4);
    p(ctx,'#8a3f10',X,Y+5,1,11); p(ctx,'#d68a45',X+1,Y+5,1,9);
    p(ctx,'#e0a060',X+3,Y+7,2,2); p(ctx,'#7a3a0e',X+9,Y+8,2,2);
    p(ctx,'#e0a060',X+11,Y+11,2,2); p(ctx,'#7a3a0e',X+5,Y+12,2,2);
  }
  function blockGround(ctx, X, Y, th) {
    p(ctx,th.edge,X,Y,16,16); p(ctx,th.face,X+1,Y+1,14,14);
    p(ctx,th.hi,X+1,Y+1,14,2); p(ctx,th.hi,X+1,Y+1,2,14);
    p(ctx,th.lo,X+2,Y+13,13,2); p(ctx,th.lo,X+13,Y+2,2,12);
    p(ctx,th.edge,X+7,Y+3,1,10); p(ctx,th.edge,X+3,Y+7,10,1);
  }
  function ground(ctx, X, Y, theme) {
    const th = THEME[theme]; if (th.grassy) grassGround(ctx, X, Y); else blockGround(ctx, X, Y, th);
  }
  function brick(ctx, X, Y, theme) {
    const b = THEME[theme].brick;
    p(ctx,b[3],X,Y,16,16);
    p(ctx,b[0],X+1,Y+1,14,6); p(ctx,b[0],X+1,Y+9,6,6); p(ctx,b[0],X+9,Y+9,6,6);
    p(ctx,b[1],X+1,Y+1,14,1); p(ctx,b[1],X+1,Y+9,6,1); p(ctx,b[1],X+9,Y+9,6,1);
    p(ctx,b[2],X+1,Y+6,14,1); p(ctx,b[2],X+1,Y+14,14,1);
    p(ctx,b[3],X+7,Y+1,1,6); p(ctx,b[3],X+8,Y+9,1,6);
  }
  function platform(ctx, X, Y, theme) {
    const th = THEME[theme];
    const face = th.face || '#b06a30', hi = th.hi || '#e0a060', lo = th.lo || '#7a3a0e', edge = th.edge || '#4a2208';
    p(ctx,edge,X,Y,16,16); p(ctx,face,X+1,Y+1,14,13);
    p(ctx,hi,X+1,Y+1,14,2); p(ctx,lo,X+1,Y+12,14,2);
    p(ctx,hi,X+1,Y+1,2,13); p(ctx,lo,X+13,Y+1,2,13);
    p(ctx,'rgba(0,0,0,.18)',X+5,Y+6,6,3);
  }
  function qblock(ctx, X, Y, t, special) {
    const pulse = (Math.sin(t / 14) + 1) / 2;
    const a = special ? `rgb(${90+(pulse*40|0)},${180+(pulse*40|0)},120)`
                      : `rgb(${224+(pulse*28|0)},${150+(pulse*40|0)},20)`;
    p(ctx,'#7a4400',X,Y,16,16); p(ctx,a,X+1,Y+1,14,14);
    p(ctx,special?'#bfffd0':'#ffd86a',X+1,Y+1,14,2); p(ctx,'#fff',X+1,Y+1,5,1);
    p(ctx,'#a85f00',X+1,Y+13,14,1);
    p(ctx,'#ffe9a8',X+2,Y+2,1,1); p(ctx,'#ffe9a8',X+13,Y+2,1,1);
    p(ctx,'#ffe9a8',X+2,Y+13,1,1); p(ctx,'#ffe9a8',X+13,Y+13,1,1);
    if (special) { // star icon
      p(ctx,'#fff7b0',X+7,Y+4,2,2); p(ctx,'#fff7b0',X+5,Y+7,6,2); p(ctx,'#fff7b0',X+6,Y+9,4,2);
      p(ctx,'#ffd24a',X+7,Y+5,2,1);
    } else { // "?"
      p(ctx,'#5a2e00',X+6,Y+5,4,1); p(ctx,'#5a2e00',X+10,Y+6,1,2); p(ctx,'#5a2e00',X+8,Y+8,1,2);
      p(ctx,'#5a2e00',X+7,Y+11,2,2); p(ctx,'#fff4c0',X+6,Y+4,4,1);
    }
  }
  function usedBlock(ctx, X, Y) {
    p(ctx,'#5f3410',X,Y,16,16); p(ctx,'#8a4f1c',X+1,Y+1,14,14); p(ctx,'#a96a2c',X+1,Y+1,14,2);
    p(ctx,'#5f3410',X+1,Y+13,14,2);
    p(ctx,'#caa060',X+2,Y+2,2,2); p(ctx,'#caa060',X+12,Y+2,2,2);
    p(ctx,'#caa060',X+2,Y+12,2,2); p(ctx,'#caa060',X+12,Y+12,2,2);
  }
  function pipe(ctx, code, X, Y) {
    // code: [ ] top corners ; { } body. X,Y tile origin.
    const G='#0a7a3a', GH='#2adf76', GM='#19c46a', GL='#0a5a2a', GE='#0d3f20';
    if (code === '[' || code === ']') {
      p(ctx,G,X,Y,16,16);
      if (code==='[') { p(ctx,GH,X+2,Y+2,12,3); p(ctx,GM,X+2,Y+5,12,2); p(ctx,GE,X,Y,2,16); p(ctx,GE,X+2,Y,1,16);}
      else { p(ctx,GH,X+2,Y+2,12,3); p(ctx,GM,X+2,Y+5,12,2); p(ctx,GE,X+14,Y,2,16); p(ctx,GE,X+13,Y,1,16);}
      p(ctx,GL,X,Y+14,16,2);
    } else { // body
      if (code==='{') { p(ctx,G,X+2,Y,14,16); p(ctx,GH,X+5,Y,4,16); p(ctx,GM,X+9,Y,2,16); p(ctx,GE,X+2,Y,1,16);}
      else { p(ctx,G,X,Y,14,16); p(ctx,GL,X+8,Y,4,16); p(ctx,GE,X+12,Y,2,16); p(ctx,GH,X+3,Y,3,16);}
    }
  }
  function spikes(ctx, X, Y) {
    p(ctx,'#3a3a48',X,Y+10,16,6); p(ctx,'#23232e',X,Y+14,16,2);
    for (let i = 0; i < 4; i++) {
      const sx = X + i * 4;
      p(ctx,'#c8c8d6',sx+1,Y+4,2,8); p(ctx,'#9a9aac',sx,Y+10,4,2); p(ctx,'#fff',sx+1,Y+5,1,3);
    }
  }
  function lava(ctx, X, Y, t) {
    const o = Math.sin((X + t * 2) / 9) * 1.5;
    p(ctx,'#7a0e0e',X,Y,16,16); p(ctx,'#e23a0e',X,Y+3+o,16,13); p(ctx,'#ff8a1e',X,Y+5+o,16,4);
    p(ctx,'#ffd24a',X+2,Y+6+o,3,1); p(ctx,'#ffd24a',X+10,Y+7+o,3,1);
    p(ctx,'#ffeca0',X+5,Y+9+o,2,2);
  }
  function coin(ctx, X, Y, t) {
    const w = 4 + Math.round(Math.abs(Math.sin(t / 9)) * 6);
    const cx = X + 8;
    p(ctx,'#a8740a',cx - w / 2 - 1, Y + 2, w + 2, 12);
    p(ctx,'#ffd24a',cx - w / 2, Y + 2, w, 12);
    p(ctx,'#fff0a0',cx - w / 2, Y + 3, Math.max(1, w / 3 | 0), 9);
    p(ctx,'#a8740a',cx - 1, Y + 6, Math.max(1, w / 4 | 0), 3);
  }

  function drawTile(ctx, code, X, Y, theme, t) {
    switch (code) {
      case '#': ground(ctx, X, Y, theme); break;
      case 'X': blockGround(ctx, X, Y, THEME[theme].grassy ?
                  { edge:'#5f2c09', face:'#9c5a1e', hi:'#caa060', lo:'#6f3a10' } : THEME[theme]); break;
      case '=': platform(ctx, X, Y, theme); break;
      case 'B': brick(ctx, X, Y, theme); break;
      case '?': qblock(ctx, X, Y, t, false); break;
      case 'U': qblock(ctx, X, Y, t, true); break;
      case 'D': usedBlock(ctx, X, Y); break;
      case '[': case ']': case '{': case '}': pipe(ctx, code, X, Y); break;
      case '^': spikes(ctx, X, Y); break;
      case 'v': lava(ctx, X, Y, t); break;
      case 'o': coin(ctx, X, Y, t); break;
      default: break;
    }
  }

  /* ---------------- cryptids ---------------- */
  function drawGrunt(ctx, X, Y, t, state) {
    if (state === 'squished') {
      p(ctx,'#4a7320',X+1,Y+10,14,5); p(ctx,'#6fa838',X+2,Y+11,12,3);
      p(ctx,'#000',X+4,Y+12,2,1); p(ctx,'#000',X+10,Y+12,2,1); return;
    }
    const step = Math.sin(t / 6) > 0 ? 1 : 0;
    p(ctx,'#2f4a14',X+1+step,Y+11,5,4); p(ctx,'#2f4a14',X+10-step,Y+11,5,4);
    p(ctx,'#4a7320',X+1,Y+1,14,11); p(ctx,'#6fa838',X+2,Y+2,12,8);
    p(ctx,'#8ec84e',X+3,Y+2,10,3);
    p(ctx,'#3a5a18',X+3,Y-1,2,3); p(ctx,'#3a5a18',X+11,Y-1,2,3); // horns
    p(ctx,'#fff',X+4,Y+4,3,3); p(ctx,'#fff',X+9,Y+4,3,3);
    p(ctx,'#000',X+5,Y+5,2,2); p(ctx,'#000',X+10,Y+5,2,2);
    p(ctx,'#243a0e',X+4,Y+3,3,1); p(ctx,'#243a0e',X+9,Y+3,3,1);
    p(ctx,'#243a0e',X+5,Y+9,6,1);
  }

  function drawChupacabra(ctx, X, Y, t, state, facing) {
    if (state === 'shell') {
      p(ctx,'#2a4a3a',X+1,Y+6,14,9); p(ctx,'#3f7a5a',X+2,Y+7,12,6);
      p(ctx,'#7fdcae',X+3,Y+8,4,2);
      for (let i = 0; i < 3; i++) p(ctx,'#cfe',X+3+i*4,Y+5,2,2); // spikes
      p(ctx,'#1c3326',X+1,Y+13,14,2); return;
    }
    const f = facing < 0 ? -1 : 1;
    const step = Math.sin(t / 6) > 0 ? 1 : 0;
    // legs
    p(ctx,'#2a5a3a',X+3+step,Y+17,3,4); p(ctx,'#2a5a3a',X+10-step,Y+17,3,4);
    // body
    p(ctx,'#3f7a5a',X+3,Y+8,10,10); p(ctx,'#56a878',X+4,Y+9,8,7);
    p(ctx,'#2a4a3a',X+3,Y+8,10,1);
    // back spikes
    p(ctx,'#cfe',X+4,Y+6,2,2); p(ctx,'#cfe',X+7,Y+5,2,2); p(ctx,'#cfe',X+10,Y+6,2,2);
    // head
    p(ctx,'#3f7a5a',X+ (f>0?9:3),Y+5,5,6); p(ctx,'#56a878',X+(f>0?10:4),Y+6,3,3);
    p(ctx,'#ff3030',X+(f>0?11:4),Y+6,2,2); // red eye
    p(ctx,'#ffd0d0',X+(f>0?11:4),Y+6,1,1);
    p(ctx,'#1c3326',X+(f>0?9:6),Y+10,4,1); // mouth
  }

  function drawMothman(ctx, X, Y, t) {
    const wy = Math.round(Math.sin(t / 7) * 2);
    p(ctx,'#2b2b40',X-5,Y+3+wy,8,11); p(ctx,'#2b2b40',X+13,Y+3+wy,8,11);
    p(ctx,'#3d3d5a',X-4,Y+5+wy,6,8); p(ctx,'#3d3d5a',X+14,Y+5+wy,6,8);
    p(ctx,'#53536f',X-3,Y+7+wy,3,5); p(ctx,'#53536f',X+16,Y+7+wy,3,5);
    p(ctx,'#1c1c2a',X+3,Y+2,10,14); p(ctx,'#33334a',X+4,Y+3,8,11);
    p(ctx,'#43435e',X+5,Y+4,2,7);
    p(ctx,'#15151f',X+5,Y+14,2,3); p(ctx,'#15151f',X+9,Y+14,2,3);
    p(ctx,'#222232',X+4,Y,8,4); p(ctx,'#222232',X+4,Y-2,1,2); p(ctx,'#222232',X+11,Y-2,1,2);
    p(ctx,'rgba(255,40,40,.35)',X+3,Y+1,10,5);
    p(ctx,'#ff2a2a',X+4,Y+2,3,3); p(ctx,'#ff2a2a',X+9,Y+2,3,3);
    p(ctx,'#ffd0d0',X+5,Y+2,1,1); p(ctx,'#ffd0d0',X+10,Y+2,1,1);
    p(ctx,'#0a0a12',X+6,Y+8,4,4);
  }

  // Boss: The Jersey Devil (~48 wide x 44 tall).
  function drawBoss(ctx, X, Y, t, flash) {
    const body = flash ? '#ffffff' : '#3a2440';
    const wy = Math.round(Math.sin(t / 9) * 3);
    // wings
    p(ctx,'#241730',X-6,Y+6+wy,12,22); p(ctx,'#241730',X+42,Y+6+wy,12,22);
    p(ctx,'#3a2a4e',X-4,Y+9+wy,9,16); p(ctx,'#3a2a4e',X+43,Y+9+wy,9,16);
    p(ctx,'#52406e',X-2,Y+12+wy,4,10); p(ctx,'#52406e',X+46,Y+12+wy,4,10);
    // body
    p(ctx,body,X+8,Y+8,32,30); p(ctx,flash?'#fff':'#4a2f54',X+10,Y+10,28,24);
    p(ctx,flash?'#fff':'#5e3d6a',X+12,Y+12,10,8);
    // legs/hooves
    p(ctx,'#1c1226',X+12,Y+36,7,8); p(ctx,'#1c1226',X+29,Y+36,7,8);
    p(ctx,'#000',X+12,Y+42,7,2); p(ctx,'#000',X+29,Y+42,7,2);
    // head + horns
    p(ctx,body,X+14,Y-4,20,16); p(ctx,flash?'#fff':'#4a2f54',X+16,Y-2,16,12);
    p(ctx,'#d8d0e0',X+13,Y-12,4,10); p(ctx,'#d8d0e0',X+31,Y-12,4,10); // horns
    p(ctx,'#b8a8c8',X+13,Y-12,4,3); p(ctx,'#b8a8c8',X+31,Y-12,4,3);
    // glowing eyes + grin
    p(ctx,'rgba(255,210,40,.4)',X+15,Y,18,8);
    p(ctx,'#ffd24a',X+18,Y+2,4,4); p(ctx,'#ffd24a',X+26,Y+2,4,4);
    p(ctx,'#fff',X+19,Y+2,1,1); p(ctx,'#fff',X+27,Y+2,1,1);
    p(ctx,'#1a0e22',X+18,Y+9,12,2);
    for (let i = 0; i < 5; i++) p(ctx,'#fff',X+19+i*2,Y+9,1,1); // fangs
  }

  /* ---------------- items / props ---------------- */
  function drawJournal(ctx, X, Y, t) {
    const g = (Math.sin(t / 8) + 1) / 2;
    p(ctx,'#5a2f12',X+1,Y+1,13,13);                 // cover
    p(ctx,'#7a431c',X+2,Y+2,11,11);
    p(ctx,'#f4e8c8',X+11,Y+2,2,11);                 // pages
    p(ctx,'#caa86a',X+3,Y+3,7,1); p(ctx,'#caa86a',X+3,Y+11,7,1);
    p(ctx,`rgba(120,220,255,${.4 + g * .5})`,X+4,Y+5,5,4); // glowing rune
    p(ctx,'#bfefff',X+6,Y+5,1,4); p(ctx,'#bfefff',X+4,Y+6,5,1);
  }

  function drawFlag(ctx, X, baseY, heightPx, t) {
    const topY = baseY - heightPx;
    p(ctx,'#bfc4cc',X+6,topY,3,heightPx);            // pole
    p(ctx,'#8e93a0',X+7,topY,1,heightPx);
    p(ctx,'#ffd24a',X+5,topY-3,5,4);                 // ball top
    p(ctx,'#fff0a0',X+6,topY-2,2,1);
    // pennant with our blue emblem
    const f = Math.sin(t / 12) * 2;
    p(ctx,'#2f8bdf',X+9,topY+4,12 + f, 10);
    p(ctx,'#7cc4ff',X+9,topY+4,12 + f, 2);
    p(ctx,'#fff',X+13,topY+7,3,3);
    // base block
    p(ctx,'#7a7f8c',X+2,baseY-4,12,4); p(ctx,'#9aa0ac',X+2,baseY-4,12,1);
  }

  /* ---------------- backgrounds ---------------- */
  function vgrad(ctx, c0, c1, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, c0); g.addColorStop(1, c1);
    ctx.fillStyle = g; ctx.fillRect(0, 0, VIEW_W, h);
  }
  function cloud(ctx, X, Y) {
    p(ctx,'#dff0ff',X,Y+9,40,4); p(ctx,'#fff',X+3,Y+4,34,8);
    p(ctx,'#fff',X+10,Y,16,9); p(ctx,'#fff',X+22,Y+1,12,8); p(ctx,'#c6e6ff',X+3,Y+11,34,2);
  }
  function hill(ctx, X, Y, c1, c2) {
    p(ctx,c1,X+8,Y,40,8); p(ctx,c1,X,Y+8,56,12); p(ctx,c2,X,Y+18,56,2);
  }

  function drawBackground(ctx, theme, camX, t) {
    if (theme === 'overworld') {
      vgrad(ctx, '#4a82f0', '#bfe3ff', VIEW_H);
      const mx = -(camX * 0.25) % VIEW_W;
      for (let i = -1; i < 3; i++) hill(ctx, mx + i * VIEW_W + 40, 150, '#3aa83a', '#2e8c00');
      for (let i = -1; i < 3; i++) hill(ctx, mx + i * VIEW_W + 230, 162, '#54c81e', '#3aa83a');
      const cx = -(camX * 0.4) % (VIEW_W + 80);
      cloud(ctx, cx + 40, 26); cloud(ctx, cx + 200, 44); cloud(ctx, cx + 330, 18);
    } else if (theme === 'athletic') {
      vgrad(ctx, '#f0894a', '#ffd9a0', VIEW_H * 0.7); // sunset
      ctx.fillStyle = '#ffd9a0'; ctx.fillRect(0, VIEW_H * 0.7, VIEW_W, VIEW_H * 0.3);
      const cx = -(camX * 0.3) % (VIEW_W + 80);
      cloud(ctx, cx + 60, 30); cloud(ctx, cx + 230, 50);
      const mx = -(camX * 0.2) % VIEW_W;
      for (let i = -1; i < 3; i++) hill(ctx, mx + i * VIEW_W + 60, 168, '#9a5fa0', '#7a3f80');
    } else if (theme === 'underground') {
      ctx.fillStyle = '#06121a'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.fillStyle = '#0c2230';
      const ox = -(camX * 0.3) % 64;
      for (let x = -64; x < VIEW_W + 64; x += 64)
        for (let y = 0; y < VIEW_H; y += 64) {
          p(ctx,'#0c2230',ox + x + 8, y + 8, 20, 14);
          p(ctx,'#0c2230',ox + x + 40, y + 36, 18, 12);
        }
    } else { // castle
      ctx.fillStyle = '#120a12'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      const ox = -(camX * 0.3) % 32;
      for (let x = -32; x < VIEW_W + 32; x += 32)
        for (let y = 0; y < VIEW_H; y += 16) {
          const off = ((y / 16) & 1) ? 16 : 0;
          p(ctx,'#241420',ox + x + off, y, 14, 14);
        }
      p(ctx,'rgba(255,80,20,.05)',0,VIEW_H-40,VIEW_W,40);
    }
  }

  window.Sprites = {
    load, heroes, drawHero,
    drawText, drawTextC, drawTextS, textWidth,
    drawTile, drawBackground,
    drawGrunt, drawChupacabra, drawMothman, drawBoss,
    drawJournal, drawFlag,
  };
})();
