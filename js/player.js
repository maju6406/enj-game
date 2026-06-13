// Player: input-driven movement, jumping, small/big states, block bumping,
// coin/hazard checks, and animated rendering using the extracted character art.
(function () {
  const P = Physics;

  function create(who) {
    return {
      who, x: 0, y: 0, w: 12, h: 20, vx: 0, vy: 0,
      facing: 1, onGround: false, big: false, invuln: 0,
      jumpHeld: false, jumpBuffer: 0, coyote: 0, state: 'idle', animT: 0, alive: true,
    };
  }

  function place(p, x, y) {
    p.x = x; p.y = y; p.vx = 0; p.vy = 0;
    p.onGround = false; p.jumpHeld = false; p.jumpBuffer = 0; p.coyote = 0;
  }

  function grow(p) {
    if (p.big) return;
    const bottom = p.y + p.h;
    p.big = true; p.w = 14; p.h = 30; p.y = bottom - p.h;
  }
  function shrink(p) {
    const bottom = p.y + p.h;
    p.big = false; p.w = 12; p.h = 20; p.y = bottom - p.h;
    p.invuln = 96;
  }

  function update(p, level, game) {
    if (!p.alive) return;
    p.animT++;

    // ---- horizontal ----
    let move = 0;
    if (Input.held('left')) move -= 1;
    if (Input.held('right')) move += 1;
    if (move !== 0) {
      p.vx += move * P.RUN_ACCEL;
      p.facing = move;
    } else {
      if (p.vx > 0) p.vx = Math.max(0, p.vx - P.FRICTION);
      else if (p.vx < 0) p.vx = Math.min(0, p.vx + P.FRICTION);
    }
    p.vx = Math.max(-P.MAX_RUN, Math.min(P.MAX_RUN, p.vx));

    // ---- jump ----
    if (p.onGround) p.coyote = P.COYOTE_FRAMES;
    else if (p.coyote > 0) p.coyote--;

    if (Input.pressed('jump')) p.jumpBuffer = P.JUMP_BUFFER_FRAMES;
    else if (p.jumpBuffer > 0) p.jumpBuffer--;

    const jumpHeldNow = Input.held('jump');
    if (p.jumpBuffer > 0 && (p.onGround || p.coyote > 0)) {
      p.vy = P.JUMP_VEL;
      p.onGround = false;
      p.coyote = 0;
      p.jumpBuffer = 0;
      p.jumpHeld = jumpHeldNow;
      Audio2.jump();
    } else if (p.jumpHeld && !jumpHeldNow && p.vy < 0) {
      p.vy *= P.JUMP_CUT_MULT;
      p.jumpHeld = false;
    } else if (!jumpHeldNow) {
      p.jumpHeld = false;
    }

    const rising = p.vy < 0;
    const grav = (p.jumpHeld && rising)
      ? P.JUMP_HOLD_GRAV
      : (!jumpHeldNow && rising ? P.JUMP_RELEASE_GRAV : P.GRAVITY);
    p.vy = Math.min(p.vy + grav, P.MAX_FALL);

    // ---- move + collide ----
    P.moveX(p, level);
    if (p.x < 0) p.x = 0;
    const res = P.moveY(p, level);
    for (const [tx, ty, code] of res.bumped) {
      if (code === '?') { level.setTile(tx, ty, 'D'); game.bumpCoinBlock(tx, ty); }
      else if (code === 'U') {
        level.setTile(tx, ty, 'D');
        level.spawnItem('journal', tx * TILE + 1, ty * TILE - 14);
        Audio2.bump();
      } else if (code === 'B') {
        if (p.big) { level.setTile(tx, ty, ' '); level.spawnParticles(tx * TILE + 8, ty * TILE + 8, '#c4702e', 8, 2.4); Audio2.stomp(); }
        else Audio2.bump();
      } else Audio2.bump();
    }

    // ---- coins ----
    const cx0 = Math.floor(p.x / TILE), cx1 = Math.floor((p.x + p.w - 1) / TILE);
    const cy0 = Math.floor(p.y / TILE), cy1 = Math.floor((p.y + p.h - 1) / TILE);
    for (let ty = cy0; ty <= cy1; ty++)
      for (let tx = cx0; tx <= cx1; tx++)
        if (level.tileChar(tx, ty) === 'o') { level.setTile(tx, ty, ' '); game.collectCoin(tx, ty); }

    // ---- hazards / pit ----
    if (p.invuln > 0) p.invuln--;
    if (P.touchesHazard(p, level)) { game.playerDie(); return; }
    if (p.y > VIEW_H + 48) { game.playerDie(); return; }

    // ---- flag ----
    if (level.flagX != null && (p.x + p.w / 2) >= level.flagX * TILE) { game.levelComplete(); return; }

    // ---- animation state ----
    if (!p.onGround) p.state = 'jump';
    else if (Math.abs(p.vx) > 0.4) p.state = 'walk';
    else p.state = 'idle';
  }

  function aspect(who) {
    const c = Sprites.heroes[who];
    return c ? c.width / c.height : 0.52;
  }

  function draw(p, ctx, camX) {
    if (p.invuln > 0 && (Math.floor(p.invuln / 4) % 2 === 0)) return; // blink
    const h = p.big ? 44 : 30;
    const w = Math.round(h * aspect(p.who));
    const sx = 1, sy = 1;
    const cx = Math.round(p.x + p.w / 2 - camX);
    const footY = Math.round(p.y + p.h);
    Sprites.drawHero(ctx, p.who, cx, footY, w, h, p.facing, sx, sy);
  }

  window.Player = { create, place, grow, shrink, update, draw };
})();
