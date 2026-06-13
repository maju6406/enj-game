// Level runtime: wraps level data with a mutable tile grid, items, particles.
(function () {
  class Level {
    constructor(data) {
      this.name = data.name;
      this.theme = data.theme;
      this.time = data.time;
      this.width = data.width;
      this.height = data.height;
      this.tiles = data.tiles.map((r) => r.split(''));
      this.flagX = data.flagX;
      this.isBoss = data.isBoss;
      this.start = data.start;
      this.pixelWidth = this.width * TILE;
      this.enemies = data.enemies.map((s) => window.Enemies.spawn(s.type, s.x, s.gy));
      this.items = [];
      this.particles = [];
      this.flagBaseY = 13 * TILE;
      this.flagHeight = 11 * TILE;
    }

    tileChar(tx, ty) {
      if (ty < 0 || ty >= this.height || tx < 0 || tx >= this.width) return ' ';
      return this.tiles[ty][tx];
    }
    setTile(tx, ty, ch) {
      if (ty >= 0 && ty < this.height && tx >= 0 && tx < this.width) this.tiles[ty][tx] = ch;
    }

    spawnItem(type, x, y) { this.items.push({ type, x, y, w: 14, h: 14, vx: 0.7, vy: 0, onGround: false, t: 0 }); }

    spawnParticles(x, y, color, count, spread) {
      spread = spread || 1.6;
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x, y, vx: (Math.random() - 0.5) * spread * 2, vy: -Math.random() * 2 - 0.5,
          life: 24 + Math.random() * 14, color, size: 1 + (Math.random() * 2 | 0),
        });
      }
    }
    scorePop(x, y, text) {
      this.particles.push({ x, y, vx: 0, vy: -0.5, life: 40, text, color: '#fff' });
    }

    updateDynamics(player, game) {
      // power-up items
      for (let i = this.items.length - 1; i >= 0; i--) {
        const it = this.items[i];
        it.t++;
        it.vy = Math.min(it.vy + Physics.GRAVITY, Physics.MAX_FALL);
        if (Physics.moveX(it, this)) it.vx *= -1;
        Physics.moveY(it, this);
        if (it.x < 0) { it.x = 0; it.vx *= -1; }
        if (Physics.overlap(it, player)) {
          this.items.splice(i, 1);
          game.collectPower(it);
        }
      }
      // particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const pt = this.particles[i];
        pt.x += pt.vx; pt.y += pt.vy;
        if (!pt.text) pt.vy += 0.14;
        pt.life--;
        if (pt.life <= 0) this.particles.splice(i, 1);
      }
    }

    draw(ctx, camX, t) {
      Sprites.drawBackground(ctx, this.theme, camX, t);
      const x0 = Math.max(0, (camX / TILE | 0) - 1);
      const x1 = Math.min(this.width - 1, x0 + (VIEW_W / TILE) + 2);
      for (let ty = 0; ty < this.height; ty++) {
        const row = this.tiles[ty];
        for (let tx = x0; tx <= x1; tx++) {
          const ch = row[tx];
          if (ch !== ' ') Sprites.drawTile(ctx, ch, tx * TILE - camX, ty * TILE, this.theme, t);
        }
      }
      if (this.flagX != null)
        Sprites.drawFlag(ctx, this.flagX * TILE - camX, this.flagBaseY, this.flagHeight, t);
    }

    drawItems(ctx, camX, t) {
      for (const it of this.items)
        if (it.type === 'journal') Sprites.drawJournal(ctx, it.x - camX, it.y, t);
    }

    drawParticles(ctx, camX) {
      for (const pt of this.particles) {
        if (pt.text) {
          const a = Math.min(1, pt.life / 30);
          Sprites.drawText(ctx, pt.text, Math.round(pt.x - camX), Math.round(pt.y), `rgba(255,255,255,${a})`, 1);
        } else {
          ctx.globalAlpha = Math.min(1, pt.life / 20);
          ctx.fillStyle = pt.color;
          ctx.fillRect(Math.round(pt.x - camX), Math.round(pt.y), pt.size, pt.size);
          ctx.globalAlpha = 1;
        }
      }
    }
  }

  window.Level = Level;
})();
