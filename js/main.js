// Main game: state machine, fixed-timestep loop, camera, collision resolution,
// and all screens (title, character select, play, clear, death, game over, win).
(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const Game = {
    state: 'title',
    who: 'jack',
    selectIndex: 0,
    lives: START_LIVES,
    relics: 0,
    score: 0,
    levelIndex: 0,
    level: null,
    player: null,
    camX: 0,
    t: 0,
    timeLeft: 400,
    timer: 0,        // generic transition timer (frames)
    inputLock: 0,

    init() {
      Input.init();
      this.player = Player.create(this.who);
      Sprites.load().then(() => {
        if (/[?&]selftest=1/i.test(location.search)) { this.runSelfTest(); return; }
        this.applyDebugHash();
        let last = performance.now(), acc = 0;
        const STEP = 1000 / 60;
        const frame = (now) => {
          acc += now - last; last = now;
          let steps = 0;
          while (acc >= STEP && steps < 5) { this.update(1 / 60); acc -= STEP; steps++; }
          if (steps === 0 && acc > STEP) acc = 0;
          Input.clearEdges();
          this.render();
          requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      });
    },

    /* ---------------- flow ---------------- */
    newGame() {
      this.lives = START_LIVES; this.relics = 0; this.score = 0;
      this.player = Player.create(this.who);
      this.loadLevel(0);
    },
    loadLevel(idx) {
      this.levelIndex = idx;
      this.level = new window.Level(LEVELS[idx]);
      const p = this.player;
      p.big = false; p.w = 12; p.h = 20; p.alive = true; p.invuln = 70;
      Player.place(p, this.level.start.x, this.level.start.y);
      this.timeLeft = this.level.time;
      this.camX = 0;
      this.state = 'play';
      this.inputLock = 8;
    },
    respawn() {
      // reload current level, keep score/relics, small player
      this.loadLevel(this.levelIndex);
    },
    levelComplete() {
      if (this.state !== 'play') return;
      this.state = 'levelclear'; this.timer = 150; Audio2.flag();
      this.score += Math.ceil(this.timeLeft) * 10;
    },
    win() {
      this.state = 'win'; this.timer = 0; Audio2.win();
    },
    playerDie() {
      if (this.state !== 'play') return;
      this.lives--; Audio2.die();
      this.state = 'dead'; this.timer = 100;
      this.player.alive = false; this.player.vy = -7; this.player.invuln = 0;
    },
    hurtPlayer(sourceX) {
      const p = this.player;
      if (p.invuln > 0 || !p.alive) return;
      if (p.big) {
        const playerMid = p.x + p.w / 2;
        const dir = (sourceX == null) ? (p.facing >= 0 ? -1 : 1) : (playerMid < sourceX ? -1 : 1);
        Player.shrink(p);
        p.vx = dir * Physics.HURT_KNOCKBACK_X;
        p.vy = Physics.HURT_KNOCKBACK_Y;
        p.onGround = false;
        p.x += dir * 4;
        Audio2.shrink();
      }
      else this.playerDie();
    },

    /* ---------------- pickups ---------------- */
    addRelic() { this.relics++; if (this.relics >= 100) { this.relics -= 100; this.lives++; } }
    ,
    collectCoin(tx, ty) {
      this.addRelic(); this.score += 50; Audio2.coin();
      this.level.spawnParticles(tx * TILE + 8, ty * TILE + 8, '#ffe060', 4);
    },
    bumpCoinBlock(tx, ty) {
      this.addRelic(); this.score += 50; Audio2.coin();
      this.level.scorePop(tx * TILE + 2, ty * TILE - 6, '+50');
      this.level.spawnParticles(tx * TILE + 8, ty * TILE, '#ffe060', 5);
    },
    collectPower(it) {
      const p = this.player;
      if (!p.big) { Player.grow(p); Audio2.power(); }
      else Audio2.power();
      this.score += 1000;
      this.level.scorePop(it.x, it.y - 6, '1000');
    },

    /* ---------------- update ---------------- */
    update(dt) {
      this.t++;
      if (this.inputLock > 0) this.inputLock--;
      switch (this.state) {
        case 'title': this.updateTitle(); break;
        case 'select': this.updateSelect(); break;
        case 'play': this.updatePlay(dt); break;
        case 'levelclear': if (--this.timer <= 0) {
            const next = this.levelIndex + 1;
            if (next >= LEVELS.length) this.win(); else this.loadLevel(next);
          } break;
        case 'dead': this.updateDead(); break;
        case 'gameover': if (this.inputLock <= 0 && Input.pressed('confirm')) this.toTitle(); break;
        case 'win': if (this.inputLock <= 0 && Input.pressed('confirm')) this.toTitle(); break;
      }
    },
    toTitle() { this.state = 'title'; this.inputLock = 10; },

    // Headless self-test (?selftest=1): exercises the loop, physics, AI, collisions,
    // pickups, transitions and all draw paths, then reports PASS/FAIL on the canvas.
    runSelfTest() {
      const results = [];
      const check = (name, fn) => {
        try { fn(); results.push([name, true, '']); }
        catch (e) { results.push([name, false, String(e && e.message || e)]); }
      };
      const key = (code, down) => window.dispatchEvent(
        new KeyboardEvent(down ? 'keydown' : 'keyup', { code, bubbles: true }));

      // Sprite assets extracted from the reference image.
      check('heroes extracted', () => {
        if (!Sprites.heroes || !Sprites.heroes.jack || !Sprites.heroes.evee)
          throw new Error('missing hero sprites');
        if (!(Sprites.heroes.jack.width > 4) || !(Sprites.heroes.evee.width > 4))
          throw new Error('hero canvas empty');
      });

      // Drive each level for a while: hold right, tap jump, no exceptions, time advances.
      for (let i = 0; i < LEVELS.length; i++) {
        check('level ' + (i + 1) + ' simulation', () => {
          this.who = 'jack'; this.lives = START_LIVES; this.relics = 0; this.score = 0;
          this.player = Player.create('jack');
          this.loadLevel(i);
          const startX = this.player.x;
          key('ArrowRight', true);
          for (let s = 0; s < 900; s++) {
            const jumping = (s % 38) < 6;
            key('ArrowUp', jumping);
            this.update(1 / 60);
            Input.clearEdges();
            this.render();
            if (this.state === 'win' || this.state === 'gameover') break;
          }
          key('ArrowUp', false); key('ArrowRight', false);
          if (!(this.player.x !== startX)) throw new Error('player never moved');
        });
      }

      // Pickups, power states, damage and transitions.
      check('pickups + power states', () => {
        this.who = 'jack'; this.player = Player.create('jack'); this.loadLevel(0);
        this.collectCoin(3, 11);
        this.bumpCoinBlock(3, 10);
        const before = this.relics;
        if (!(before >= 2)) throw new Error('relics not counted');
        Player.grow(this.player);
        if (!this.player.big) throw new Error('grow failed');
        this.player.invuln = 0;
        this.hurtPlayer(); // big -> shrink
        if (this.player.big) throw new Error('shrink failed');
        Player.grow(this.player);
        this.collectPower({ x: this.player.x, y: this.player.y });
      });

      check('stomp kills', () => {
        this.loadLevel(0);
        const mk = (type) => ({ type, x: 40, y: 40, w: 14, h: 14, vx: 0, vy: 0,
          state: 'walk', points: 100, flash: 0, hp: 3 });
        this.stompKill(mk('grunt'), 'grunt');
        this.stompKill(mk('mothman'), 'mothman');
      });

      check('death + respawn + gameover', () => {
        this.who = 'jack'; this.lives = 2; this.player = Player.create('jack');
        this.loadLevel(0);
        this.playerDie();
        if (this.state !== 'dead') throw new Error('not dead state');
        this.timer = 1; this.updateDead(); // -> respawn (lives 1 left)
        this.lives = 1; this.playerDie(); this.timer = 1; this.updateDead();
        if (this.state !== 'gameover') throw new Error('no gameover');
      });

      check('level clear chain', () => {
        this.loadLevel(0);
        this.levelComplete();
        if (this.state !== 'levelclear') throw new Error('not levelclear');
        this.timer = 1; this.update(1 / 60);
        if (this.levelIndex !== 1) throw new Error('did not advance');
      });

      check('boss defeat -> win', () => {
        this.who = 'evee'; this.player = Player.create('evee'); this.loadLevel(3);
        const boss = this.level.enemies.find((e) => e.type === 'boss');
        if (!boss) throw new Error('no boss in level 4');
        const p = this.player;
        for (let h = 0; h < 3; h++) {
          boss.flash = 0;
          p.x = boss.x; p.y = boss.y - p.h + 4; p.vy = 3;
          this.state = 'play';
          this.resolveEnemies();
        }
        if (this.state !== 'win') throw new Error('boss not defeated');
      });

      check('all screens render', () => {
        this.state = 'title'; this.drawTitle();
        this.state = 'select'; this.selectIndex = 0; this.drawSelect();
        this.selectIndex = 1; this.drawSelect();
        this.who = 'jack'; this.loadLevel(0); this.drawWorld(); HUD.draw(ctx, this);
        this.state = 'win'; this.drawWin();
      });

      // Report.
      const pass = results.filter((r) => r[1]).length;
      const fail = results.length - pass;
      this.selfTestResults = results;
      document.title = (fail === 0 ? 'SELFTEST PASS ' : 'SELFTEST FAIL ') + pass + '/' + results.length;
      console.log(document.title);
      results.forEach((r) => console.log((r[1] ? 'PASS ' : 'FAIL ') + r[0] + (r[2] ? ' :: ' + r[2] : '')));

      const drawReport = () => {
        ctx.fillStyle = '#0a0a16'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
        Sprites.drawTextC(ctx, fail === 0 ? 'SELFTEST PASS' : 'SELFTEST FAIL',
          VIEW_W / 2, 10, fail === 0 ? '#7fdc5a' : '#ff6a6a', 2);
        let y = 34;
        results.forEach((r) => {
          Sprites.drawText(ctx, (r[1] ? 'OK  ' : 'XX  ') + r[0], 8, y, r[1] ? '#bfe9b0' : '#ff9a9a', 1);
          y += 11;
          if (!r[1] && r[2]) { Sprites.drawText(ctx, '    ' + r[2].slice(0, 40), 8, y, '#ffd0a0', 1); y += 11; }
        });
      };
      drawReport();
      requestAnimationFrame(drawReport);
    },

    // Optional dev hook: ?go=select|win|play1..play4 to jump to a state for testing.
    applyDebugHash() {
      const m = /[?&]go=([a-z0-9]+)/i.exec(location.search);
      if (!m) return;
      const g = m[1].toLowerCase();
      if (g === 'select') { this.state = 'select'; }
      else if (g === 'win') { this.who = 'evee'; this.win(); }
      else if (/^play[1-4]$/.test(g)) {
        this.who = 'jack'; this.lives = START_LIVES; this.relics = 0; this.score = 0;
        this.player = Player.create(this.who);
        this.loadLevel(parseInt(g.slice(4), 10) - 1);
      }
    },
    updateTitle() {
      if (this.inputLock <= 0 && (Input.pressed('confirm') || Input.pressed('jump'))) {
        this.state = 'select'; this.selectIndex = 0; this.inputLock = 10; Audio2.select();
      }
    },
    updateSelect() {
      if (this.inputLock > 0) return;
      if (Input.pressed('left') && this.selectIndex !== 0) { this.selectIndex = 0; Audio2.select(); }
      if (Input.pressed('right') && this.selectIndex !== 1) { this.selectIndex = 1; Audio2.select(); }
      if (Input.pressed('confirm') || Input.pressed('jump')) {
        this.who = this.selectIndex === 0 ? 'jack' : 'evee';
        Audio2.start(); this.inputLock = 10; this.newGame();
      }
    },
    updateDead() {
      const p = this.player;
      p.y += p.vy; p.vy += 0.4;
      if (--this.timer <= 0) {
        if (this.lives <= 0) { this.state = 'gameover'; this.inputLock = 30; }
        else this.respawn();
      }
    },
    updatePlay(dt) {
      const lvl = this.level, p = this.player;
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) { this.timeLeft = 0; this.playerDie(); return; }

      Player.update(p, lvl, this);
      if (this.state !== 'play') return; // died/cleared during player update

      for (const e of lvl.enemies) Enemies.update(e, lvl, p, this);
      this.resolveEnemies();
      if (this.state !== 'play') return;

      lvl.updateDynamics(p, this);
      lvl.enemies = lvl.enemies.filter((e) => !e.remove);

      const maxCam = Math.max(0, lvl.pixelWidth - VIEW_W);
      this.camX = Math.round(Math.max(0, Math.min(maxCam, p.x + p.w / 2 - VIEW_W / 2)));
    },

    resolveEnemies() {
      const p = this.player;
      if (!p.alive) return;
      const pFoot = p.y + p.h;
      for (const e of this.level.enemies) {
        if (e.dead || e.remove) continue;
        if (!Physics.overlap(p, e)) continue;
        const stomp = p.vy > 0 && (pFoot - e.y) < e.h * 0.6;

        if (e.type === 'grunt') {
          if (stomp) this.stompKill(e, 'grunt');
          else this.hurtPlayer(e.x + e.w / 2);
        } else if (e.type === 'mothman') {
          if (stomp) this.stompKill(e, 'mothman');
          else this.hurtPlayer(e.x + e.w / 2);
        } else if (e.type === 'chupacabra') {
          if (e.state === 'shell') {
            // idle shell: kick it
            e.state = 'slide';
            e.vx = (p.x + p.w / 2 < e.x + e.w / 2) ? 2.6 : -2.6;
            Audio2.kick();
            if (stomp) this.bounce();
            else p.invuln = Math.max(p.invuln, 8);
          } else if (e.state === 'slide') {
            if (stomp) { e.state = 'shell'; e.vx = 0; this.bounce(); Audio2.stomp(); }
            else this.hurtPlayer(e.x + e.w / 2);
          } else { // walking
            if (stomp) {
              e.state = 'shell'; e.vx = 0; e.h = 12; e.y += 10;
              this.bounce(); Audio2.stomp(); this.score += e.points;
              this.level.spawnParticles(e.x + e.w / 2, e.y, '#7fdcae', 5);
            } else this.hurtPlayer(e.x + e.w / 2);
          }
        } else if (e.type === 'boss') {
          if (stomp && e.flash <= 0) {
            e.hp--; e.flash = 45; this.bounce(); Audio2.bossHit();
            this.level.spawnParticles(e.x + e.w / 2, e.y + 6, '#d8c8e8', 10, 2.4);
            if (e.hp <= 0) {
              e.dead = true; e.timer = 1; e.remove = true; this.score += e.points;
              this.win();
            }
          } else if (e.flash <= 0) this.hurtPlayer(e.x + e.w / 2);
        }
        if (this.state !== 'play') return;
      }
    },
    bounce() {
      this.player.vy = Input.held('jump') ? Physics.STOMP_BOUNCE_HELD : Physics.STOMP_BOUNCE;
      this.player.onGround = false;
    },
    stompKill(e, kind) {
      e.dead = true; e.state = 'squished'; e.timer = (kind === 'mothman') ? 18 : 26;
      this.bounce(); Audio2.stomp(); this.score += e.points;
      this.level.spawnParticles(e.x + e.w / 2, e.y + e.h / 2,
        kind === 'mothman' ? '#6a6a8a' : '#9adf4a', 7);
    },

    /* ---------------- render ---------------- */
    render() {
      switch (this.state) {
        case 'title': this.drawTitle(); break;
        case 'select': this.drawSelect(); break;
        case 'play': this.drawWorld(); HUD.draw(ctx, this); break;
        case 'levelclear': this.drawWorld(); HUD.draw(ctx, this); this.banner('LEVEL CLEAR!', '#ffe060'); break;
        case 'dead': this.drawWorld(); HUD.draw(ctx, this); break;
        case 'gameover': this.drawWorld(); this.overlay(); this.banner('GAME OVER', '#ff6a6a', 'PRESS ENTER'); break;
        case 'win': this.drawWin(); break;
      }
    },
    drawWorld() {
      const lvl = this.level, cam = this.camX;
      lvl.draw(ctx, cam, this.t);
      lvl.drawItems(ctx, cam, this.t);
      for (const e of lvl.enemies) Enemies.draw(ctx, e, cam, this.t);
      if (this.player.alive || this.state === 'dead') Player.draw(this.player, ctx, cam);
      lvl.drawParticles(ctx, cam);
    },
    overlay() { ctx.fillStyle = 'rgba(0,0,8,.55)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H); },
    banner(txt, col, sub) {
      Sprites.drawTextC(ctx, txt, VIEW_W / 2, VIEW_H / 2 - 16, col, 3);
      if (sub && Math.floor(this.t / 30) % 2 === 0)
        Sprites.drawTextC(ctx, sub, VIEW_W / 2, VIEW_H / 2 + 16, '#fff', 1);
    },

    groundStrip(theme) {
      for (let tx = 0; tx <= VIEW_W / TILE; tx++) {
        Sprites.drawTile(ctx, '#', tx * TILE, 13 * TILE, theme, this.t);
        Sprites.drawTile(ctx, '#', tx * TILE, 14 * TILE, theme, this.t);
      }
    },
    drawTitle() {
      Sprites.drawBackground(ctx, 'overworld', this.t * 0.4, this.t);
      this.groundStrip('overworld');
      // heroes flanking the title
      const fy = 13 * TILE;
      Sprites.drawHero(ctx, 'jack', 96, fy, 30, 52, 1, 1 + Math.sin(this.t / 24) * 0.02, 1);
      Sprites.drawHero(ctx, 'evee', VIEW_W - 96, fy, 30, 52, -1, 1, 1 + Math.sin(this.t / 24 + 1) * 0.02);
      // title
      Sprites.drawTextC(ctx, 'CRYPTID', VIEW_W / 2, 54, '#1a1a2a', 5);
      Sprites.drawTextC(ctx, 'CRYPTID', VIEW_W / 2 - 1, 53, '#ffd34d', 5);
      Sprites.drawTextC(ctx, 'QUEST', VIEW_W / 2, 96, '#1a1a2a', 5);
      Sprites.drawTextC(ctx, 'QUEST', VIEW_W / 2 - 1, 95, '#ff8a3a', 5);
      Sprites.drawTextC(ctx, 'JACK & EVEE', VIEW_W / 2, 140, '#fff2c0', 1);
      if (Math.floor(this.t / 30) % 2 === 0)
        Sprites.drawTextC(ctx, 'PRESS ENTER', VIEW_W / 2, 170, '#fff', 2);
    },
    drawSelect() {
      Sprites.drawBackground(ctx, 'overworld', this.t * 0.4, this.t);
      this.groundStrip('overworld');
      Sprites.drawTextC(ctx, 'CHOOSE YOUR HERO', VIEW_W / 2, 30, '#ffffff', 2);
      const fy = 13 * TILE;
      const slots = [{ who: 'jack', name: 'JACK', x: VIEW_W / 2 - 80 }, { who: 'evee', name: 'EVEE', x: VIEW_W / 2 + 80 }];
      slots.forEach((s, i) => {
        const sel = i === this.selectIndex;
        // pedestal
        ctx.fillStyle = sel ? 'rgba(255,220,80,.18)' : 'rgba(0,0,0,.25)';
        ctx.fillRect(s.x - 36, 60, 72, fy - 60);
        if (sel) { ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 2; ctx.strokeRect(s.x - 36, 60, 72, fy - 60); }
        const sc = sel ? 1 + Math.sin(this.t / 12) * 0.03 : 1;
        Sprites.drawHero(ctx, s.who, s.x, fy, 36, 64, i === 0 ? 1 : -1, sc, sc);
        Sprites.drawTextC(ctx, s.name, s.x, fy + 6, sel ? '#ffd34d' : '#cfcfe6', 2);
        if (sel) Sprites.drawTextC(ctx, '\u25B2', s.x, 50, '#ffd34d', 1);
      });
      if (Math.floor(this.t / 30) % 2 === 0)
        Sprites.drawTextC(ctx, 'ARROWS TO CHOOSE   ENTER TO START', VIEW_W / 2, 214, '#fff', 1);
    },
    drawWin() {
      Sprites.drawBackground(ctx, 'athletic', this.t * 0.4, this.t);
      this.groundStrip('athletic');
      const fy = 13 * TILE;
      Sprites.drawHero(ctx, this.who, VIEW_W / 2, fy, 38, 66, 1, 1 + Math.sin(this.t / 14) * 0.04, 1);
      Sprites.drawTextC(ctx, 'YOU WIN!', VIEW_W / 2, 40, '#1a1a2a', 4);
      Sprites.drawTextC(ctx, 'YOU WIN!', VIEW_W / 2 - 1, 39, '#ffd34d', 4);
      Sprites.drawTextC(ctx, 'THE CRYPTIDS ARE TAMED', VIEW_W / 2, 80, '#fff', 1);
      Sprites.drawTextC(ctx, 'SCORE ' + this.score, VIEW_W / 2, 96, '#ffe060', 1);
      // confetti
      for (let i = 0; i < 30; i++) {
        const px = (i * 53 + this.t * 2) % VIEW_W;
        const py = (i * 37 + this.t * 3) % 140 + 16;
        ctx.fillStyle = ['#ff6a6a', '#ffd34d', '#6affb0', '#6ab8ff'][i % 4];
        ctx.fillRect(px, py, 2, 2);
      }
      if (Math.floor(this.t / 30) % 2 === 0)
        Sprites.drawTextC(ctx, 'PRESS ENTER', VIEW_W / 2, 200, '#fff', 1);
    },
  };

  window.Game = Game;
  window.addEventListener('load', () => Game.init());
})();
