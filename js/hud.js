// HUD: top status bar with portrait, lives, relics, world, and time.
(function () {
  function portrait(ctx, who, X, Y) {
    const c = Sprites.heroes[who];
    if (c) {
      const prev = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = true;
      // sample the head region (top ~32% of the sprite) into a 11x11 thumb
      ctx.drawImage(c, 0, 0, c.width, c.height * 0.34, X, Y, 11, 11);
      ctx.imageSmoothingEnabled = prev;
    } else {
      ctx.fillStyle = who === 'jack' ? '#7a4a1e' : '#8a4a22';
      ctx.fillRect(X, Y, 11, 11);
    }
  }

  function coinIcon(ctx, X, Y) {
    ctx.fillStyle = '#a8740a'; ctx.fillRect(X + 1, Y, 5, 8);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(X + 2, Y, 3, 8);
    ctx.fillStyle = '#fff0a0'; ctx.fillRect(X + 2, Y + 1, 1, 6);
  }
  function heart(ctx, X, Y, full) {
    const c = full ? '#e8405a' : '#5a2a33';
    ctx.fillStyle = c;
    ctx.fillRect(X, Y + 1, 3, 2); ctx.fillRect(X + 4, Y + 1, 3, 2);
    ctx.fillRect(X, Y + 1, 7, 3); ctx.fillRect(X + 1, Y + 4, 5, 1); ctx.fillRect(X + 2, Y + 5, 3, 1);
    ctx.fillRect(X + 3, Y + 6, 1, 1);
    if (full) { ctx.fillStyle = '#ff8a9c'; ctx.fillRect(X + 1, Y + 1, 1, 1); }
  }

  function draw(ctx, game) {
    ctx.fillStyle = 'rgba(8,8,20,.55)'; ctx.fillRect(0, 0, VIEW_W, 16);
    ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(0, 16, VIEW_W, 1);

    portrait(ctx, game.who, 3, 2);
    // lives as hearts
    for (let i = 0; i < 3; i++) heart(ctx, 17 + i * 10, 4, i < game.lives);

    coinIcon(ctx, 92, 4);
    Sprites.drawTextS(ctx, String(game.relics).padStart(2, '0'), 100, 5, '#ffe060', 1);

    Sprites.drawTextS(ctx, 'WORLD 1-' + (game.levelIndex + 1), 150, 5, '#ffffff', 1);

    const tleft = Math.max(0, Math.ceil(game.timeLeft));
    Sprites.drawTextS(ctx, 'TIME ' + String(tleft).padStart(3, '0'), 300, 5, '#ffffff', 1);
  }

  window.HUD = { draw };
})();
