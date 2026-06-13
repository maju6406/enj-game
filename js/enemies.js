// Cryptid enemies: spawn, update (movement/AI), and draw. Player collisions
// are resolved centrally in main.js so shells/stomps stay consistent.
(function () {
  const G = Physics.GRAVITY, MAXF = Physics.MAX_FALL;

  function spawn(type, x, gy) {
    const e = { type, x, vx: 0, vy: 0, facing: -1, onGround: false, state: 'walk',
                dead: false, remove: false, timer: 0, t: Math.random() * 100 };
    if (type === 'grunt') { e.w = 16; e.h = 16; e.y = gy - 16; e.vx = -0.5; e.points = 100; }
    else if (type === 'chupacabra') { e.w = 14; e.h = 22; e.y = gy - 22; e.vx = -0.5; e.points = 200; }
    else if (type === 'mothman') { e.w = 16; e.h = 16; e.baseY = gy; e.y = gy; e.state = 'fly'; e.points = 150; }
    else if (type === 'boss') { e.w = 48; e.h = 44; e.y = gy - 44; e.vx = 0.8; e.hp = 3; e.flash = 0; e.points = 2000; }
    return e;
  }

  function walker(e, level, player) {
    e.vy = Math.min(e.vy + G, MAXF);
    if (Physics.moveX(e, level)) { e.vx *= -1; e.facing = e.vx < 0 ? -1 : 1; }
    if (e.x <= 0 && e.vx < 0) { e.vx *= -1; e.facing = 1; }
    Physics.moveY(e, level);
    // turn around at ledges so they stay on platforms
    if (e.onGround) {
      const aheadX = e.vx < 0 ? e.x - 1 : e.x + e.w;
      const footTy = Math.floor((e.y + e.h + 1) / TILE);
      const aheadTx = Math.floor(aheadX / TILE);
      if (!Physics.solid(level.tileChar(aheadTx, footTy))) {
        e.vx *= -1; e.facing = e.vx < 0 ? -1 : 1;
      }
    }
  }

  function update(e, level, player, game) {
    e.t++;
    if (e.dead) { e.timer--; if (e.timer <= 0) e.remove = true; return; }

    if (e.type === 'grunt') {
      e.facing = e.vx < 0 ? -1 : 1;
      walker(e, level, player);
    } else if (e.type === 'chupacabra') {
      if (e.state === 'shell') {
        // idle shell, settle on ground
        e.vy = Math.min(e.vy + G, MAXF); Physics.moveY(e, level);
      } else if (e.state === 'slide') {
        e.vx = 2.6 * Math.sign(e.vx || 1);
        if (Physics.moveX(e, level)) e.vx *= -1;
        if (e.x <= 0) { e.x = 0; e.vx *= -1; }
        e.vy = Math.min(e.vy + G, MAXF); Physics.moveY(e, level);
        // sliding shell kills other enemies
        for (const o of level.enemies) {
          if (o !== e && !o.dead && o.type !== 'boss' && Physics.overlap(e, o)) {
            o.dead = true; o.state = 'squished'; o.timer = 24; o.vy = -2;
            level.spawnParticles(o.x + o.w / 2, o.y, '#9adf4a', 6);
          }
        }
      } else {
        e.facing = e.vx < 0 ? -1 : 1;
        walker(e, level, player);
      }
    } else if (e.type === 'mothman') {
      e.t += 0; // already bumped
      const dir = Math.sign(player.x - e.x);
      e.x += dir * 0.45;
      e.facing = dir < 0 ? -1 : 1;
      e.y = e.baseY + Math.sin(e.t / 16) * 12;
      if (e.x < 0) e.x = 0;
    } else if (e.type === 'boss') {
      if (e.flash > 0) e.flash--;
      e.vy = Math.min(e.vy + G, MAXF);
      const speed = 0.8 + (3 - e.hp) * 0.5;
      e.vx = speed * (e.facing);
      if (Physics.moveX(e, level)) e.facing *= -1;
      if (e.x <= 0) { e.x = 0; e.facing = 1; }
      if (e.x + e.w >= level.pixelWidth) e.facing = -1;
      // chase player horizontally a bit
      if (Math.random() < 0.01) e.facing = Math.sign(player.x - e.x) || e.facing;
      Physics.moveY(e, level);
    }
  }

  function draw(ctx, e, camX, t) {
    const cam = Math.round(camX);
    const X = Math.round(e.x) - cam, Y = Math.round(e.y);
    if (e.type === 'grunt') Sprites.drawGrunt(ctx, X, Y, t, e.dead ? 'squished' : null);
    else if (e.type === 'chupacabra') Sprites.drawChupacabra(ctx, X, Y, t, e.dead ? 'shell' : e.state, e.facing);
    else if (e.type === 'mothman') Sprites.drawMothman(ctx, X, Y, e.t);
    else if (e.type === 'boss') Sprites.drawBoss(ctx, X, Y, t, e.flash > 0);
  }

  window.Enemies = { spawn, update, draw };
})();
