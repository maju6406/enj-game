import * as Phaser from 'phaser';
import { GAMEPLAY_ZOOM, HAZARD, HERO_DISPLAY, PHYSICS, SCORE, SOLID, START_LIVES, TILE, VIEW_H, VIEW_W } from '../data/constants.js';
import { LEVELS } from '../data/levels.js';
import { Player } from '../entities/Player.js';
import { spawnEnemy, stompEnemy, updateEnemy } from '../entities/enemies.js';
import { sfx } from '../systems/sfx.js';
import { flashTint, loopPulse, loopShimmer, loopWobble, rememberBase } from '../ui/animationUi.js';
import { uiTextStyle } from '../ui/textStyle.js';

const TILE_KEY = {
  '#': 'tile-ground', X: 'tile-stone', B: 'tile-brick', '?': 'tile-question', U: 'tile-question',
  D: 'tile-used', '=': 'tile-platform', '[': 'tile-pipe', ']': 'tile-pipe', '{': 'tile-pipe', '}': 'tile-pipe',
  '^': 'tile-spikes', v: 'tile-lava',
};

function label(scene, txt, x, y, size = 10) {
  return scene.add.text(Math.round(x), Math.round(y), txt, uiTextStyle(size, '#ffffff'))
    .setScrollFactor(0)
    .setDepth(50)
    .setResolution(1);
}

export class LevelScene extends Phaser.Scene {
  constructor() { super('Level'); }

  init(data) {
    this.who = data.who || 'jack';
    this.levelIndex = Phaser.Math.Clamp(data.levelIndex || 0, 0, LEVELS.length - 1);
    this.lives = data.lives ?? START_LIVES;
    this.relics = data.relics || 0;
    this.score = data.score || 0;
    this.respawn = data.respawn || null;
    this.demo = !!data.demo;
    this.cheatInfiniteLives = !!data.cheatInfiniteLives;
    this.dying = false;
    this.clearing = false;
    this.pausedByOverlay = false;
  }

  create() {
    if (!LEVELS[this.levelIndex]) {
      this.scene.start('Win', { who: this.who, score: this.score });
      return;
    }
    this.level = LEVELS[this.levelIndex];
    this.cameras.main.setBackgroundColor(this.bgColor());
    this.cameras.main.setZoom(GAMEPLAY_ZOOM);
    this.physics.world.gravity.y = PHYSICS.gravity;
    this.physics.world.setBounds(0, 0, this.level.width * TILE, VIEW_H);

    this.solids = this.physics.add.staticGroup();
    this.hazards = this.physics.add.staticGroup();
    this.coins = this.physics.add.staticGroup();
    this.items = this.physics.add.group();
    this.enemies = this.physics.add.group();
    this.blockSprites = new Map();
    this.touch = { left: false, right: false, jump: false };
    this.addDecorations();
    this.buildWorld();

    const spawn = this.respawn || this.defaultSpawn();
    this.player = new Player(this, this.who, spawn.x, spawn.y);
    if (this.respawn) {
      this.player.invulnUntil = this.time.now + 1800;
      this.addSparkle(spawn.x, spawn.y - HERO_DISPLAY.gameplay / 2, 0xfff2c0);
    }
    this.cameras.main.startFollow(this.player.sprite, true, 1, 1);
    this.cameras.main.setBounds(0, 0, this.level.width * TILE, VIEW_H);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
      c: Phaser.Input.Keyboard.KeyCodes.C,
      p: Phaser.Input.Keyboard.KeyCodes.P,
      esc: Phaser.Input.Keyboard.KeyCodes.ESC,
    });
    this.input.keyboard.on('keydown-C', () => this.toggleCheatMode());

    this.physics.add.collider(this.player.sprite, this.solids, (_player, block) => this.handleBlockBump(block));
    this.physics.add.collider(this.enemies, this.solids);
    this.physics.add.collider(this.items, this.solids);
    this.physics.add.overlap(this.player.sprite, this.coins, (_, coin) => this.collectRelic(coin));
    this.physics.add.overlap(this.player.sprite, this.items, (_, item) => this.collectItem(item));
    this.physics.add.overlap(this.player.sprite, this.hazards, () => this.killPlayer('hazard'));
    this.physics.add.overlap(this.player.sprite, this.enemies, (_, enemy) => this.touchEnemy(enemy));
    this.physics.add.overlap(this.enemies, this.enemies, (a, b) => this.enemyTouchesEnemy(a, b));

    if (this.level.flagX != null) {
      this.flag = this.add.rectangle(this.level.flagX * TILE, 96, 4, 112, 0xffffff).setOrigin(0, 0).setDepth(4);
      this.flagZone = this.add.zone(this.level.flagX * TILE, 0, 24, VIEW_H).setOrigin(0, 0);
      this.physics.add.existing(this.flagZone, true);
      this.physics.add.overlap(this.player.sprite, this.flagZone, () => this.levelClear());
    }

    for (const def of this.level.enemies) {
      const enemy = spawnEnemy(this, def);
      if (enemy.kind === 'boss') this.boss = enemy;
    }
    this.uiCamera = this.cameras.add(0, 0, VIEW_W, VIEW_H).setScroll(0, 0).setZoom(1);
    this.uiCamera.ignore(this.children.list);
    this.createHud();
    this.createBossHud();
    this.createTouchControls();
    this.createPauseControls();
    this.showLevelIntro();
    if (this.demo) this.createDemoHud();
    this.timeLeft = this.level.time;
    this.timerEvent = this.time.addEvent({ delay: 1000, loop: true, callback: () => {
      if (this.pausedByOverlay) return;
      this.timeLeft -= 1; if (this.timeLeft <= 0) this.killPlayer('timeout');
    } });
    if (this.demo) {
      this.demoStartedAt = this.time.now;
      this.time.delayedCall(28000, () => this.endDemo());
      const play = () => {
        this.input.keyboard?.resetKeys();
        this.scene.start('Select');
      };
      this.input.keyboard.once('keydown-ENTER', play);
      this.input.keyboard.once('keydown-SPACE', play);
      this.input.keyboard.once('keydown-UP', play);
    }
  }

  bgColor() {
    return this.level.theme === 'underground' ? '#101020' : this.level.theme === 'castle' ? '#181420' : '#5c94fc';
  }

  addDecorations() {
    if (this.level.theme === 'underground' || this.level.theme === 'castle') return;
    const width = this.level.width * TILE;
    for (let x = 20; x < width; x += 360) {
      this.add.image(x, VIEW_H - 70, 'scenery-ridge')
        .setOrigin(0.5, 1)
        .setScrollFactor(0.12)
        .setAlpha(0.74)
        .setDepth(-24)
        .setScale(1.25);
    }
    for (let x = 40; x < width; x += 280) {
      this.add.image(x, Phaser.Math.Between(30, 84), 'scenery-cloud')
        .setScrollFactor(0.18)
        .setAlpha(0.85)
        .setDepth(-20)
        .setScale(Phaser.Math.FloatBetween(0.8, 1.25));
    }
    for (let x = 120; x < width; x += 420) {
      this.add.image(x, VIEW_H - 48, 'scenery-hills')
        .setOrigin(0.5, 1)
        .setScrollFactor(0.35)
        .setDepth(-15)
        .setScale(Phaser.Math.FloatBetween(0.95, 1.35));
    }
    for (let x = 80; x < width; x += 210) {
      this.add.image(x, VIEW_H - 32, 'scenery-bush')
        .setOrigin(0.5, 1)
        .setScrollFactor(0.65)
        .setDepth(-10)
        .setScale(Phaser.Math.FloatBetween(0.95, 1.2));
    }
  }

  buildWorld() {
    for (let y = 0; y < this.level.tiles.length; y++) {
      const row = this.level.tiles[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === ' ') continue;
        if (ch === 'o') {
          const coin = this.coins.create(x * TILE + 8, y * TILE + 8, 'relic');
          const shiny = (x * 7 + y * 13 + this.levelIndex * 17) % 29 === 0;
          coin.setData('tile', { x, y });
          coin.setData('shiny', shiny);
          if (shiny) coin.setTint(0xfff2c0).setScale(1.25);
          this.ignoreUi(coin);
          this.tweens.add({
            targets: coin,
            y: coin.y - 4,
            angle: shiny ? 8 : 5,
            duration: 650,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
          this.tweens.add({
            targets: coin,
            scaleX: coin.scaleX * (shiny ? 1.14 : 1.06),
            duration: shiny ? 420 : 760,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
        } else if (SOLID.has(ch)) {
          const s = this.ignoreUi(this.solids.create(x * TILE + 8, y * TILE + 8, TILE_KEY[ch] || 'tile-block'));
          s.setData('tile', { x, y, ch });
          this.blockSprites.set(`${x},${y}`, s);
          this.animateBlockAmbient(s, ch, x, y);
        } else if (HAZARD.has(ch)) {
          const hazard = this.ignoreUi(this.hazards.create(x * TILE + 8, y * TILE + 8, TILE_KEY[ch]));
          this.animateHazard(hazard, ch, x);
        }
      }
    }
  }

  animateBlockAmbient(block, ch, x, y) {
    rememberBase(block);
    if (ch === '?' || ch === 'U') {
      loopShimmer(this, block, 0.74, 720, { delay: (x + y) * 17 });
      loopWobble(this, block, 0.7, 860, { delay: x * 9 });
    } else if (ch === 'B') {
      this.tweens.add({
        targets: block,
        alpha: 0.88,
        duration: 1200 + ((x + y) % 5) * 90,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else if (ch === '=') {
      loopShimmer(this, block, 0.86, 1400, { delay: x * 11 });
    }
  }

  animateHazard(hazard, ch, x) {
    this.tweens.add({
      targets: hazard,
      alpha: ch === 'v' ? 0.68 : 0.82,
      duration: ch === 'v' ? 360 : 820,
      delay: (x % 4) * 45,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    if (ch === 'v') loopWobble(this, hazard, 1.2, 420, { delay: (x % 3) * 40 });
  }

  handleBlockBump(block) {
    const body = this.player.sprite.body;
    if (!block?.getData || !block.body) return;
    const hitFromBelow = body.velocity.y <= 25
      && body.top >= block.body.bottom - 8
      && body.center.x >= block.body.left - 8
      && body.center.x <= block.body.right + 8;
    if (!hitFromBelow) return;
    const tile = block.getData('tile');
    const ch = tile?.ch;
    if (!['?', 'U', 'B'].includes(ch)) return;
    if (ch === 'B' && !this.player.big) return;
    if (ch === 'B') {
      this.tweens.killTweensOf(block);
      flashTint(this, block, 0xffdca0, 80);
      this.addBurst(block.x, block.y, 0xd69249);
      this.addDust(block.x, block.y);
      this.revealBrickCache(block, tile);
      block.destroy();
      this.blockSprites.delete(`${tile.x},${tile.y}`);
      sfx('stomp');
      return;
    }
    this.tweens.killTweensOf(block);
    block.setAlpha(1).setAngle(0).setScale(1);
    this.tweens.add({
      targets: block,
      y: block.y - 3,
      yoyo: true,
      duration: 55,
      ease: 'Quad.easeOut',
    });
    this.addDust(block.x, block.y + 4);
    block.setTexture('tile-used');
    block.setData('tile', { x: tile.x, y: tile.y, ch: 'D' });
    flashTint(this, block, 0xfff2c0, 80);
    this.tweens.add({
      targets: block,
      scaleX: 1.08,
      scaleY: 0.92,
      duration: 70,
      yoyo: true,
      ease: 'Back.easeOut',
    });
    if (ch === '?') {
      sfx('coin');
      this.addRelic();
      this.popRelic(block.x, block.y - TILE);
      this.scorePop(block.x, block.y - 10, `+${SCORE.relic}`);
    }
    if (ch === 'U') {
      sfx('power');
      this.spawnPowerUp(block.x, block.y);
    }
  }

  spawnPowerUp(x, y) {
    const item = this.ignoreUi(this.items.create(x, y - 6, 'journal'));
    item.setDepth(7);
    item.body.allowGravity = false;
    item.body.checkCollision.none = true;
    item.setData('direction', 1);
    item.setVelocity(0, 0);
    this.tweens.add({
      targets: item,
      y: y - TILE,
      duration: 320,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (!item.active) return;
        item.body.allowGravity = true;
        item.body.checkCollision.none = false;
        item.setVelocityX(PHYSICS.powerupSpeed);
        this.animatePowerUpItem(item);
      },
    });
  }

  animatePowerUpItem(item) {
    rememberBase(item);
    this.tweens.add({
      targets: item,
      angle: 5,
      scaleX: item.scaleX * 1.08,
      scaleY: item.scaleY * 0.95,
      duration: 360,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    const sparkleEvent = this.time.addEvent({
      delay: 520,
      loop: true,
      callback: () => {
        if (!item.active) {
          sparkleEvent.remove(false);
          return;
        }
        this.addSparkle(item.x, item.y - 8, 0xbff5ff);
      },
    });
  }

  collectRelic(coin) {
    const shiny = !!coin.getData('shiny');
    const value = shiny ? SCORE.shinyRelic : SCORE.relic;
    this.scorePop(coin.x, coin.y - 8, shiny ? `SHINY ${value}` : `+${value}`);
    this.addSparkle(coin.x, coin.y, shiny ? 0xfff2c0 : 0xffd34d);
    coin.destroy();
    sfx(shiny ? 'power' : 'coin');
    this.addRelic(shiny ? 5 : 1, value);
  }
  collectItem(item) {
    this.scorePop(item.x, item.y - 10, `${SCORE.item}`);
    this.addSparkle(item.x, item.y - 10, 0xffd34d);
    this.addBurst(this.player.sprite.x, this.player.sprite.y - this.player.sprite.displayHeight / 2, 0xffd34d);
    item.destroy(); this.player.grow(); sfx('power'); this.score += SCORE.item; this.updateHud();
    this.cameras.main.flash(90, 255, 230, 120);
  }
  addRelic(amount = 1, scoreValue = SCORE.relic) {
    this.relics += amount; this.score += scoreValue;
    if (this.relics >= 100) {
      this.relics -= 100;
      this.lives += 1;
      sfx('power');
      this.animateHearts();
    }
    this.updateHud();
  }

  touchEnemy(enemy) {
    if (!enemy.active || enemy.dead) return;
    const falling = this.player.sprite.body.velocity.y > 20;
    const enemyTop = enemy.body?.top ?? enemy.y - enemy.displayHeight;
    const stompGrace = enemy.kind === 'boss' ? 18 : 10;
    const above = this.player.sprite.body.bottom <= enemyTop + stompGrace;
    if (falling && above && enemy.kind === 'boss' && this.time.now < (enemy.invulnUntil || 0)) {
      this.player.bounce(false);
      this.addSparkle(enemy.x, enemyTop + 8, 0xffffff);
      return;
    }
    if (falling && above && stompEnemy(this, enemy)) {
      this.player.bounce(this.cursors.up.isDown || this.keys.space.isDown);
      sfx(enemy.kind === 'boss' ? 'hurt' : 'stomp');
      this.score += enemy.kind === 'boss' ? 0 : SCORE.enemy;
      this.cameras.main.shake(enemy.kind === 'boss' ? 180 : 90, enemy.kind === 'boss' ? 0.01 : 0.006);
      this.addBurst(enemy.x, enemy.y - enemy.displayHeight / 2, enemy.kind === 'boss' ? 0xff6a6a : 0x9adf4a);
      if (enemy.kind !== 'boss') this.scorePop(enemy.x, enemy.y - enemy.displayHeight, `${SCORE.enemy}`);
      this.updateHud();
      return;
    }
    if (enemy.kind === 'chupacabra' && enemy.shell && Math.abs(enemy.body.velocity.x) < 5) {
      enemy.setVelocityX(this.player.sprite.x < enemy.x ? PHYSICS.shellSpeed : -PHYSICS.shellSpeed);
      this.player.bounce(false);
      return;
    }
    if (this.player.damage(enemy.x)) this.killPlayer('enemy');
  }

  enemyTouchesEnemy(a, b) {
    if (!a.active || !b.active || a.dead || b.dead || a === b) return;
    const shell = this.isSlidingShell(a) ? a : this.isSlidingShell(b) ? b : null;
    const target = shell === a ? b : shell === b ? a : null;
    if (!shell || !target || target.kind === 'boss') return;
    target.dead = true;
    target.disableBody(true, false);
    this.score += SCORE.enemy;
    this.scorePop(target.x, target.y - target.displayHeight, `${SCORE.enemy}`);
    this.addBurst(target.x, target.y - target.displayHeight / 2, 0x9adf4a);
    this.tweens.add({
      targets: target,
      scaleX: target.scaleX * 1.2,
      scaleY: target.scaleY * 0.2,
      alpha: 0,
      angle: target.angle + 140,
      duration: 180,
      ease: 'Quad.easeIn',
      onComplete: () => target.destroy(),
    });
    sfx('stomp');
    this.updateHud();
  }

  isSlidingShell(enemy) {
    return enemy.kind === 'chupacabra' && enemy.shell && Math.abs(enemy.body.velocity.x) >= 80;
  }

  killPlayer(reason = 'damage') {
    if (this.dying) return;
    this.dying = true;
    if (!this.cheatInfiniteLives) this.lives -= 1;
    this.nextRespawn = this.findRespawnPoint(reason);
    sfx('die');
    this.playDeathSequence();
    this.time.delayedCall(1600, () => {
      this.input.keyboard?.resetKeys();
      if (this.demo) {
        this.scene.start('Cast', { attract: true });
        return;
      }
      if (this.lives <= 0 && !this.cheatInfiniteLives) this.scene.start('GameOver', { score: this.score });
      else this.scene.start('Level', this.levelState({ respawn: this.nextRespawn }));
    });
  }

  levelState(overrides = {}) {
    return {
      who: this.who,
      levelIndex: this.levelIndex,
      lives: this.lives,
      relics: this.relics,
      score: this.score,
      cheatInfiniteLives: this.cheatInfiniteLives,
      ...overrides,
    };
  }

  defaultSpawn() {
    return { x: this.level.start.x + 8, y: this.level.start.y + 20 };
  }

  findRespawnPoint(reason) {
    if (!this.player?.sprite || !this.level) return this.defaultSpawn();
    const tx = Phaser.Math.Clamp(Math.floor(this.player.sprite.x / TILE), 1, this.level.width - 2);
    const searchRightFirst = reason === 'fall' || reason === 'hazard';
    const preferred = searchRightFirst ? this.findSafeSpawn(tx + 1, 1) : this.findNearestSafeSpawn(tx);
    const fallback = searchRightFirst ? this.findNearestSafeSpawn(tx) : this.findSafeSpawn(tx + 1, 1);
    return preferred || fallback || this.defaultSpawn();
  }

  findNearestSafeSpawn(tx) {
    for (let offset = 0; offset < 24; offset++) {
      const right = this.findSafeSpawn(tx + offset, 1, 1);
      if (right) return right;
      const left = this.findSafeSpawn(tx - offset, -1, 1);
      if (left) return left;
    }
    return null;
  }

  findSafeSpawn(startTx, direction, maxSteps = 48) {
    const minTx = 1;
    const maxTx = this.level.width - 2;
    let steps = 0;
    for (let tx = Phaser.Math.Clamp(startTx, minTx, maxTx); tx >= minTx && tx <= maxTx && steps < maxSteps; tx += direction, steps++) {
      const spawn = this.safeSpawnAtColumn(tx);
      if (spawn) return spawn;
    }
    return null;
  }

  safeSpawnAtColumn(tx) {
    for (let y = 1; y < this.level.height; y++) {
      const tile = this.tileAt(tx, y);
      if (!SOLID.has(tile) || HAZARD.has(tile)) continue;
      const head = this.tileAt(tx, y - 2);
      const body = this.tileAt(tx, y - 1);
      if (SOLID.has(head) || SOLID.has(body) || HAZARD.has(head) || HAZARD.has(body)) continue;
      return {
        x: tx * TILE + TILE / 2,
        y: (y - 1) * TILE + 4,
      };
    }
    return null;
  }

  tileAt(tx, ty) {
    if (ty < 0 || ty >= this.level.height || tx < 0 || tx >= this.level.width) return ' ';
    return this.level.tiles[ty]?.[tx] || ' ';
  }

  playDeathSequence() {
    const sprite = this.player.sprite;
    const camera = this.cameras.main;
    const deathX = Phaser.Math.Clamp(sprite.x, camera.worldView.x + 24, camera.worldView.right - 24);
    const deathY = Math.min(sprite.y, camera.worldView.bottom - 26);

    sprite.body.checkCollision.none = true;
    sprite.setPosition(deathX, deathY);
    sprite.setVelocity(0, -360);
    sprite.setAcceleration(0, 0);
    sprite.setDepth(80);
    sprite.setAlpha(1);
    sprite.setTint(0xfff2c0);

    this.cameras.main.flash(160, 255, 245, 190);
    this.cameras.main.shake(380, 0.018);
    this.addBurst(deathX, deathY - sprite.displayHeight / 2, 0xffd34d);
    this.addBurst(deathX, deathY - sprite.displayHeight / 2, 0xff6a6a);

    this.tweens.add({
      targets: sprite,
      angle: sprite.flipX ? -720 : 720,
      scaleX: sprite.scaleX * 1.12,
      scaleY: sprite.scaleY * 1.12,
      duration: 420,
      ease: 'Back.easeOut',
      yoyo: true,
      onComplete: () => sprite.clearTint(),
    });

    this.tweens.add({
      targets: sprite,
      alpha: 0.2,
      duration: 90,
      yoyo: true,
      repeat: 5,
    });

    const banner = [
      this.add.rectangle(VIEW_W / 2, 91, 156, 24, 0x101020, 0.78).setScrollFactor(0).setDepth(95),
      label(this, this.cheatInfiniteLives ? 'CHEAT SAVE!' : this.lives <= 0 ? 'FINAL LIFE LOST' : 'LOST A LIFE', VIEW_W / 2, 85, 10).setDepth(96),
    ];
    this.cameras.main.ignore(banner);
    this.tweens.add({
      targets: banner,
      alpha: 0,
      delay: 920,
      duration: 360,
      ease: 'Quad.easeIn',
    });
  }

  endDemo() {
    if (!this.demo || this.dying || this.clearing) return;
    this.killPlayer();
  }

  levelClear() {
    if (this.clearing || this.level.isBoss) return;
    this.clearing = true;
    sfx('flag');
    this.score += SCORE.levelComplete;
    const timeBonus = Math.max(0, this.timeLeft | 0) * 10;
    this.score += timeBonus;
    this.updateHud();
    this.addBurst(this.player.sprite.x, this.player.sprite.y - 24, 0xffd34d);
    if (timeBonus > 0) this.scorePop(this.player.sprite.x, this.player.sprite.y - 44, `TIME ${timeBonus}`);
    this.showCenterBanner('LEVEL CLEAR!', `TIME BONUS ${timeBonus}`);
    this.time.delayedCall(900, () => {
      if (this.demo) {
        this.scene.start('Cast', { attract: true });
        return;
      }
      const next = this.levelIndex + 1;
      if (next >= LEVELS.length) this.scene.start('Win', { who: this.who, score: this.score });
      else this.scene.start('Level', this.levelState({ levelIndex: next, respawn: null }));
    });
  }

  winGame() {
    if (this.clearing) return;
    this.clearing = true;
    sfx('win');
    this.score += SCORE.levelComplete + SCORE.bossDefeat;
    this.addBurst(this.player.sprite.x, this.player.sprite.y - 26, 0xffd34d);
    this.scorePop(this.player.sprite.x, this.player.sprite.y - 48, `BOSS ${SCORE.bossDefeat}`);
    this.showCenterBanner('BIGFOOT CATALOGED!', `BOSS BONUS ${SCORE.bossDefeat}`);
    this.time.delayedCall(500, () => this.scene.start('Win', { who: this.who, score: this.score }));
  }

  createBossHud() {
    if (!this.boss || !this.level.isBoss) return;
    this.bossHud = [
      this.add.rectangle(VIEW_W / 2, 50, 132, 24, 0x101020, 0.7).setScrollFactor(0).setDepth(58).setStrokeStyle(1, 0xff6a6a),
      label(this, 'BIGFOOT', VIEW_W / 2 - 50, 44, 8).setDepth(59),
      label(this, '3 HITS', VIEW_W / 2 + 12, 44, 8).setDepth(59),
    ];
    this.bossHudHearts = [];
    for (let i = 0; i < 3; i++) {
      this.bossHudHearts.push(this.add.image(VIEW_W / 2 + 21 + i * 12, 57, 'heart').setScrollFactor(0).setDepth(59).setTint(0xff6a6a));
    }
    this.cameras.main.ignore([...this.bossHud, ...this.bossHudHearts]);
  }

  onBossDamaged(boss) {
    if (!boss?.active) return;
    const hp = Math.max(0, boss.hp);
    this.bossHudHearts?.forEach((heart, index) => {
      heart.setVisible(index < hp);
      this.tweens.add({
        targets: heart,
        scale: index < hp ? 1.25 : 0,
        alpha: index < hp ? 1 : 0,
        duration: 120,
        yoyo: index < hp,
        ease: 'Sine.easeInOut',
      });
    });
    this.scorePop(boss.x, boss.y - boss.displayHeight - 8, hp > 0 ? `${hp} HITS LEFT` : 'BIGFOOT DOWN!');
    if (hp > 0) this.showCenterBanner('BIGFOOT HIT!', `${hp} MORE TO WIN`);
  }

  createHud() {
    this.hudPanels = [
      this.add.rectangle(58, 20, 106, 34, 0x101020, 0.62).setScrollFactor(0).setDepth(49).setStrokeStyle(1, 0xd9f3ff),
      this.add.rectangle(144, 20, 70, 34, 0x101020, 0.62).setScrollFactor(0).setDepth(49).setStrokeStyle(1, 0xd9f3ff),
      this.add.rectangle(218, 20, 58, 34, 0x101020, 0.62).setScrollFactor(0).setDepth(49).setStrokeStyle(1, 0xd9f3ff),
      this.add.rectangle(291, 20, 72, 34, 0x101020, 0.62).setScrollFactor(0).setDepth(49).setStrokeStyle(1, 0xd9f3ff),
      this.add.rectangle(355, 20, 48, 34, 0x101020, 0.62).setScrollFactor(0).setDepth(49).setStrokeStyle(1, 0xd9f3ff),
    ];
    this.hud = {
      hearts: [],
      score: label(this, '', 58, 23, 10).setOrigin(0.5),
      relics: label(this, '', 144, 23, 10).setOrigin(0.5),
      world: label(this, `1-${this.levelIndex + 1}`, 218, 23, 10).setOrigin(0.5),
      time: label(this, '', 355, 23, 10).setOrigin(0.5),
      name: label(this, this.level.name, 58, 35, 6).setOrigin(0.5),
      scoreLabel: label(this, 'SCORE', 58, 10, 8).setOrigin(0.5),
      relicLabel: label(this, 'RELICS', 144, 10, 8).setOrigin(0.5),
      worldLabel: label(this, 'WORLD', 218, 10, 8).setOrigin(0.5),
      livesLabel: label(this, 'LIVES', 291, 10, 8).setOrigin(0.5),
      timeLabel: label(this, 'TIME', 355, 10, 8).setOrigin(0.5),
    };
    for (let i = 0; i < 3; i++) {
      const heart = this.add.image(279 + i * 12, 23, 'heart').setScrollFactor(0).setDepth(50);
      loopPulse(this, heart, 1.08, 780, { delay: i * 90 });
      this.hud.hearts.push(heart);
    }
    this.cameras.main.ignore([
      ...this.hudPanels,
      ...this.hud.hearts,
      ...Object.values(this.hud).filter((entry) => !Array.isArray(entry)),
    ]);
    this.updateHud();
  }

  toggleCheatMode() {
    if (this.demo) return;
    this.cheatInfiniteLives = !this.cheatInfiniteLives;
    sfx(this.cheatInfiniteLives ? 'power' : 'select');
    this.updateHud();
    this.showCheatBanner();
  }

  showCheatBanner() {
    this.cheatBanner?.forEach((entry) => entry.destroy());
    this.cheatBanner = [
      this.add.rectangle(VIEW_W / 2, 55, 126, 20, this.cheatInfiniteLives ? 0x203050 : 0x101020, 0.78).setScrollFactor(0).setDepth(116).setStrokeStyle(1, this.cheatInfiniteLives ? 0xffd34d : 0xffffff),
      label(this, this.cheatInfiniteLives ? 'CHEAT MODE ON' : 'CHEAT MODE OFF', VIEW_W / 2 - 52, 50, 7).setDepth(117),
    ];
    this.cameras.main.ignore(this.cheatBanner);
    this.tweens.add({
      targets: this.cheatBanner,
      alpha: 0,
      delay: 780,
      duration: 300,
      onComplete: () => {
        this.cheatBanner?.forEach((entry) => entry.destroy());
        this.cheatBanner = null;
      },
    });
  }

  createDemoHud() {
    const banner = [
      this.add.rectangle(VIEW_W / 2, 54, 136, 18, 0x101020, 0.72).setScrollFactor(0).setDepth(60),
      label(this, 'DEMO MODE', VIEW_W / 2 - 40, 50, 8).setDepth(61),
    ];
    this.cameras.main.ignore(banner);
  }

  createTouchControls() {
    if (!window.matchMedia?.('(pointer: coarse)').matches) return;
    const makeButton = (x, y, text, fill, onDown, onUp, width = 42) => {
      const button = this.add.rectangle(x, y, width, 36, fill, 0.28)
        .setScrollFactor(0)
        .setDepth(90)
        .setStrokeStyle(2, fill)
        .setInteractive({ useHandCursor: true });
      const glyph = label(this, text, x, y - 1, text.length > 1 ? 7 : 16).setOrigin(0.5).setDepth(91);
      button.on('pointerdown', onDown);
      button.on('pointerup', onUp);
      button.on('pointerout', onUp);
      this.cameras.main.ignore([button, glyph]);
      return [button, glyph];
    };
    makeButton(37, VIEW_H - 28, 'LEFT', 0xffffff, () => { this.touch.left = true; }, () => { this.touch.left = false; }, 56);
    makeButton(100, VIEW_H - 28, 'RIGHT', 0xffffff, () => { this.touch.right = true; }, () => { this.touch.right = false; }, 58);
    makeButton(VIEW_W - 47, VIEW_H - 28, 'JUMP', 0xffd34d, () => { this.touch.jump = true; }, () => { this.touch.jump = false; }, 64);
    const hint = label(this, 'TAP BUTTONS TO MOVE', VIEW_W / 2 - 70, VIEW_H - 49, 6).setDepth(91);
    this.cameras.main.ignore(hint);
    this.tweens.add({ targets: hint, alpha: 0, delay: 2600, duration: 600, onComplete: () => hint.destroy() });
  }

  createPauseControls() {
    this.input.keyboard.on('keydown-P', () => this.togglePauseOverlay());
    this.input.keyboard.on('keydown-ESC', () => this.togglePauseOverlay());
    if (!window.matchMedia?.('(pointer: coarse)').matches) return;
    const button = this.add.rectangle(VIEW_W - 32, 56, 54, 22, 0x101020, 0.62)
      .setScrollFactor(0)
      .setDepth(92)
      .setStrokeStyle(1, 0xffffff)
      .setInteractive({ useHandCursor: true });
    const glyph = label(this, 'PAUSE', VIEW_W - 32, 55, 6).setOrigin(0.5).setDepth(93);
    button.on('pointerup', () => this.togglePauseOverlay());
    this.cameras.main.ignore([button, glyph]);
  }

  ignoreUi(target) {
    this.uiCamera?.ignore(target);
    return target;
  }

  updateHud() {
    if (!this.hud) return;
    this.hud.score.setText(String(this.score).padStart(6, '0'));
    this.hud.relics.setText(`x${String(this.relics).padStart(2, '0')}`);
    this.hud.time.setText(`${Math.max(0, this.timeLeft | 0)}`);
    this.hud.time.setColor(this.timeLeft <= 60 && Math.floor(this.time.now / 250) % 2 === 0 ? '#ff6a6a' : '#ffffff');
    this.hud.livesLabel.setText(this.cheatInfiniteLives ? 'MAX' : 'LIVES');
    this.hud.hearts.forEach((h, i) => {
      h.setVisible(this.cheatInfiniteLives || i < this.lives);
      if (this.cheatInfiniteLives) h.setTint(0xfff2c0);
      else h.clearTint();
    });
  }

  popRelic(x, y) {
    const relic = this.ignoreUi(this.add.image(x, y, 'relic').setDepth(35));
    this.addSparkle(x, y, 0xffd34d);
    this.tweens.add({
      targets: relic,
      y: y - 32,
      alpha: 0,
      duration: 520,
      ease: 'Quad.easeOut',
      onComplete: () => relic.destroy(),
    });
  }

  scorePop(x, y, value) {
    const pop = this.ignoreUi(this.add.text(x, y, value, uiTextStyle(9, '#ffffff', 2))
      .setOrigin(0.5)
      .setDepth(40)
      .setResolution(1));
    this.tweens.add({
      targets: pop,
      y: y - 16,
      alpha: 0,
      duration: 600,
      ease: 'Quad.easeOut',
      onComplete: () => pop.destroy(),
    });
  }

  addBurst(x, y, color) {
    for (let i = 0; i < 7; i++) {
      const dot = this.ignoreUi(this.add.rectangle(x, y, 2, 2, color).setDepth(35));
      this.tweens.add({
        targets: dot,
        x: x + Phaser.Math.Between(-16, 16),
        y: y + Phaser.Math.Between(-16, 8),
        alpha: 0,
        duration: 360,
        ease: 'Quad.easeOut',
        onComplete: () => dot.destroy(),
      });
    }
  }

  addSparkle(x, y, color) {
    for (let i = 0; i < 5; i++) {
      const star = this.ignoreUi(this.add.star(x, y, 4, 1, 4, color, 0.9).setDepth(36));
      this.tweens.add({
        targets: star,
        x: x + Phaser.Math.Between(-18, 18),
        y: y + Phaser.Math.Between(-24, 4),
        angle: Phaser.Math.Between(-180, 180),
        scale: 0,
        alpha: 0,
        duration: 460,
        ease: 'Quad.easeOut',
        onComplete: () => star.destroy(),
      });
    }
  }

  addDust(x, y) {
    for (let i = 0; i < 5; i++) {
      const puff = this.ignoreUi(this.add.circle(x + Phaser.Math.Between(-5, 5), y + Phaser.Math.Between(0, 6), 3, 0xd9c6a3, 0.42).setDepth(34));
      this.tweens.add({
        targets: puff,
        x: puff.x + Phaser.Math.Between(-10, 10),
        y: puff.y + Phaser.Math.Between(-10, 1),
        scale: 1.8,
        alpha: 0,
        duration: 420,
        ease: 'Quad.easeOut',
        onComplete: () => puff.destroy(),
      });
    }
  }

  revealBrickCache(block, tile) {
    if ((tile.x + this.levelIndex * 5) % 6 !== 0) return;
    const x = block.x;
    const y = block.y;
    this.score += SCORE.brickCache;
    this.scorePop(x, y - 12, `CACHE ${SCORE.brickCache}`);
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 90, () => {
        this.addRelic(1, 0);
        this.popRelic(x + (i - 1) * 7, y - TILE);
      });
    }
  }

  animateHearts() {
    if (!this.hud?.hearts) return;
    this.tweens.add({
      targets: this.hud.hearts,
      scale: 1.35,
      duration: 120,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
    });
  }

  showCenterBanner(title, subtitle) {
    const elements = [
      this.add.rectangle(VIEW_W / 2, 92, 194, 44, 0x101020, 0.76).setScrollFactor(0).setDepth(96).setStrokeStyle(2, 0xffd34d),
      label(this, title, VIEW_W / 2 - 72, 78, 11).setDepth(97),
      label(this, subtitle, VIEW_W / 2 - 70, 98, 7).setDepth(97),
    ];
    this.cameras.main.ignore(elements);
    this.tweens.add({ targets: elements, alpha: 0, delay: 760, duration: 300, onComplete: () => elements.forEach((e) => e.destroy()) });
  }

  showLevelIntro() {
    const elements = [
      this.add.rectangle(VIEW_W / 2, 87, 230, 58, 0x101020, 0.78).setScrollFactor(0).setDepth(94).setStrokeStyle(2, 0xd9f3ff),
      label(this, `WORLD 1-${this.levelIndex + 1}`, VIEW_W / 2 - 48, 66, 13).setDepth(95),
      label(this, this.level.name, VIEW_W / 2 - 66, 88, 9).setDepth(95),
      label(this, `${this.who.toUpperCase()} VS THE CRYPTIDS`, VIEW_W / 2 - 88, 108, 6).setDepth(95),
    ];
    this.cameras.main.ignore(elements);
    this.tweens.add({ targets: elements, alpha: 0, delay: 1200, duration: 360, onComplete: () => elements.forEach((e) => e.destroy()) });
  }

  togglePauseOverlay() {
    if (this.dying || this.clearing) return;
    if (this.pausedByOverlay) {
      this.closePauseOverlay();
      return;
    }
    this.pausedByOverlay = true;
    this.physics.world.pause();
    const overlay = [
      this.add.rectangle(VIEW_W / 2, VIEW_H / 2, 250, 142, 0x101020, 0.88).setScrollFactor(0).setDepth(120).setStrokeStyle(2, 0xffd34d),
      label(this, 'PAUSED', VIEW_W / 2 - 38, 62, 16).setDepth(121),
      label(this, 'ARROWS / BUTTONS MOVE', VIEW_W / 2 - 78, 91, 7).setDepth(121),
      label(this, 'UP / SPACE / JUMP HOPS', VIEW_W / 2 - 86, 106, 7).setDepth(121),
    ];
    const resume = this.pauseButton('RESUME', VIEW_W / 2 - 62, 136, () => this.closePauseOverlay());
    const restart = this.pauseButton('RESTART', VIEW_W / 2, 166, () => this.scene.start('Level', this.levelState({ respawn: null })));
    const title = this.pauseButton('TITLE', VIEW_W / 2 + 64, 136, () => this.scene.start('Title'));
    this.pauseOverlay = [...overlay, ...resume, ...restart, ...title];
    this.cameras.main.ignore(this.pauseOverlay);
  }

  pauseButton(text, x, y, onTap) {
    const button = this.add.rectangle(x, y, 58, 22, 0x203050, 0.9)
      .setScrollFactor(0)
      .setDepth(122)
      .setStrokeStyle(1, 0xffffff)
      .setInteractive({ useHandCursor: true });
    const caption = label(this, text, x - 21, y - 5, 6).setDepth(123);
    button.on('pointerup', onTap);
    return [button, caption];
  }

  closePauseOverlay() {
    this.pausedByOverlay = false;
    this.physics.world.resume();
    this.pauseOverlay?.forEach((entry) => entry.destroy());
    this.pauseOverlay = null;
  }

  update(time) {
    if (!this.player || this.dying || this.clearing || this.pausedByOverlay) return;
    if (this.demo && time - (this.demoStartedAt || 0) > 28000) {
      this.endDemo();
      return;
    }
    const touch = this.demo ? this.demoInput(time) : this.touch;
    this.player.update(this.cursors, this.keys, touch);
    this.updatePowerUps();
    this.enemies.children.each((e) => {
      if (e.y > VIEW_H + 96) {
        e.destroy();
        return;
      }
      updateEnemy(this, e, time);
    });
    this.updateHud();
  }

  updatePowerUps() {
    this.items.children.each((item) => {
      if (!item.active) return;
      if (item.y > VIEW_H + 96) {
        item.destroy();
        return;
      }
      if (item.body.checkCollision.none) return;
      if (item.body.blocked.left) item.setData('direction', 1);
      if (item.body.blocked.right) item.setData('direction', -1);
      item.setVelocityX((item.getData('direction') || 1) * PHYSICS.powerupSpeed);
    });
  }

  demoInput(time) {
    const body = this.player.sprite.body;
    const x = this.player.sprite.x;
    const y = this.player.foot;
    const ahead = x + 18;
    let jump = false;

    if (body.blocked.right) jump = true;
    if (body.blocked.down || body.touching.down) {
      this.enemies.children.each((enemy) => {
        if (!enemy.active || enemy.dead) return;
        const dx = enemy.x - x;
        if (dx > 8 && dx < 60 && Math.abs(enemy.y - y) < 42) jump = true;
      });
      this.items.children.each((item) => {
        if (item.active && item.x > x && item.x - x < 34) jump = true;
      });
      this.solids.children.each((block) => {
        if (!block.active) return;
        const dx = block.x - ahead;
        if (dx > 0 && dx < 18 && block.y < y - 18) jump = true;
      });
      if (Math.floor(time / 2100) !== Math.floor((time - 16) / 2100)) jump = true;
    }

    return { left: false, right: true, jump };
  }
}
