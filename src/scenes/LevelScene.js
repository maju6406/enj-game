import * as Phaser from 'phaser';
import { GAMEPLAY_ZOOM, HAZARD, PHYSICS, SCORE, SOLID, START_LIVES, TILE, VIEW_H, VIEW_W } from '../data/constants.js';
import { LEVELS } from '../data/levels.js';
import { Player } from '../entities/Player.js';
import { spawnEnemy, stompEnemy, updateEnemy } from '../entities/enemies.js';
import { sfx } from '../systems/sfx.js';

const TILE_KEY = {
  '#': 'tile-ground', X: 'tile-stone', B: 'tile-brick', '?': 'tile-question', U: 'tile-question',
  D: 'tile-used', '=': 'tile-platform', '[': 'tile-pipe', ']': 'tile-pipe', '{': 'tile-pipe', '}': 'tile-pipe',
  '^': 'tile-spikes', v: 'tile-lava',
};

function label(scene, txt, x, y, size = 10) {
  return scene.add.text(x, y, txt, {
    fontFamily: 'Courier New, monospace', fontSize: `${size}px`, color: '#fff',
    stroke: '#101020', strokeThickness: 2,
  }).setScrollFactor(0).setDepth(50).setResolution(1);
}

export class LevelScene extends Phaser.Scene {
  constructor() { super('Level'); }

  init(data) {
    this.who = data.who || 'jack';
    this.levelIndex = Phaser.Math.Clamp(data.levelIndex || 0, 0, LEVELS.length - 1);
    this.lives = data.lives ?? START_LIVES;
    this.relics = data.relics || 0;
    this.score = data.score || 0;
    this.dying = false;
    this.clearing = false;
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
    this.items = this.physics.add.group({ allowGravity: false });
    this.enemies = this.physics.add.group();
    this.blockSprites = new Map();
    this.touch = { left: false, right: false, jump: false };
    this.addDecorations();
    this.buildWorld();

    this.player = new Player(this, this.who, this.level.start.x + 8, this.level.start.y + 20);
    this.cameras.main.startFollow(this.player.sprite, true, 1, 1);
    this.cameras.main.setBounds(0, 0, this.level.width * TILE, VIEW_H);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({ space: Phaser.Input.Keyboard.KeyCodes.SPACE, enter: Phaser.Input.Keyboard.KeyCodes.ENTER });

    this.physics.add.collider(this.player.sprite, this.solids, (_player, block) => this.handleBlockBump(block));
    this.physics.add.collider(this.enemies, this.solids);
    this.physics.add.collider(this.items, this.solids);
    this.physics.add.overlap(this.player.sprite, this.coins, (_, coin) => this.collectRelic(coin));
    this.physics.add.overlap(this.player.sprite, this.items, (_, item) => this.collectItem(item));
    this.physics.add.overlap(this.player.sprite, this.hazards, () => this.killPlayer());
    this.physics.add.overlap(this.player.sprite, this.enemies, (_, enemy) => this.touchEnemy(enemy));
    this.physics.add.overlap(this.enemies, this.enemies, (a, b) => this.enemyTouchesEnemy(a, b));

    if (this.level.flagX != null) {
      this.flag = this.add.rectangle(this.level.flagX * TILE, 96, 4, 112, 0xffffff).setOrigin(0, 0).setDepth(4);
      this.flagZone = this.add.zone(this.level.flagX * TILE, 0, 24, VIEW_H).setOrigin(0, 0);
      this.physics.add.existing(this.flagZone, true);
      this.physics.add.overlap(this.player.sprite, this.flagZone, () => this.levelClear());
    }

    for (const def of this.level.enemies) spawnEnemy(this, def);
    this.uiCamera = this.cameras.add(0, 0, VIEW_W, VIEW_H).setScroll(0, 0).setZoom(1);
    this.uiCamera.ignore(this.children.list);
    this.createHud();
    this.createTouchControls();
    this.timeLeft = this.level.time;
    this.timerEvent = this.time.addEvent({ delay: 1000, loop: true, callback: () => {
      this.timeLeft -= 1; if (this.timeLeft <= 0) this.killPlayer();
    } });
  }

  bgColor() {
    return this.level.theme === 'underground' ? '#101020' : this.level.theme === 'castle' ? '#181420' : '#5c94fc';
  }

  addDecorations() {
    if (this.level.theme === 'underground' || this.level.theme === 'castle') return;
    const width = this.level.width * TILE;
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
        .setScale(Phaser.Math.FloatBetween(1, 1.6));
    }
    for (let x = 80; x < width; x += 210) {
      this.add.image(x, VIEW_H - 32, 'scenery-bush')
        .setOrigin(0.5, 1)
        .setScrollFactor(0.65)
        .setDepth(-10);
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
          coin.setData('tile', { x, y });
          this.ignoreUi(coin);
          this.tweens.add({
            targets: coin,
            y: coin.y - 4,
            duration: 650,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
        } else if (SOLID.has(ch)) {
          const s = this.ignoreUi(this.solids.create(x * TILE + 8, y * TILE + 8, TILE_KEY[ch] || 'tile-block'));
          s.setData('tile', { x, y, ch });
          this.blockSprites.set(`${x},${y}`, s);
        } else if (HAZARD.has(ch)) {
          this.ignoreUi(this.hazards.create(x * TILE + 8, y * TILE + 8, TILE_KEY[ch]));
        }
      }
    }
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
      this.addBurst(block.x, block.y, 0xd69249);
      block.destroy();
      this.blockSprites.delete(`${tile.x},${tile.y}`);
      sfx('stomp');
      return;
    }
    this.tweens.add({
      targets: block,
      y: block.y - 3,
      yoyo: true,
      duration: 55,
      ease: 'Quad.easeOut',
    });
    block.setTexture('tile-used');
    block.setData('tile', { x: tile.x, y: tile.y, ch: 'D' });
    if (ch === '?') {
      sfx('coin');
      this.addRelic();
      this.popRelic(block.x, block.y - TILE);
      this.scorePop(block.x, block.y - 10, `+${SCORE.relic}`);
    }
    if (ch === 'U') {
      sfx('power');
      this.ignoreUi(this.items.create(tile.x * TILE + 8, tile.y * TILE - 8, 'journal'));
    }
  }

  collectRelic(coin) { this.scorePop(coin.x, coin.y - 8, `+${SCORE.relic}`); coin.destroy(); sfx('coin'); this.addRelic(); }
  collectItem(item) {
    this.scorePop(item.x, item.y - 10, `${SCORE.item}`);
    item.destroy(); this.player.grow(); sfx('power'); this.score += SCORE.item; this.updateHud();
  }
  addRelic() {
    this.relics += 1; this.score += SCORE.relic;
    if (this.relics >= 100) { this.relics -= 100; this.lives += 1; }
    this.updateHud();
  }

  touchEnemy(enemy) {
    if (!enemy.active || enemy.dead) return;
    const falling = this.player.sprite.body.velocity.y > 20;
    const above = this.player.foot - enemy.y < enemy.displayHeight * 0.65;
    if (falling && above && stompEnemy(this, enemy)) {
      this.player.bounce(this.cursors.up.isDown || this.keys.space.isDown);
      sfx(enemy.kind === 'boss' ? 'hurt' : 'stomp');
      this.score += enemy.kind === 'boss' ? 0 : SCORE.enemy;
      if (enemy.kind !== 'boss') this.scorePop(enemy.x, enemy.y - enemy.displayHeight, `${SCORE.enemy}`);
      this.updateHud();
      return;
    }
    if (enemy.kind === 'chupacabra' && enemy.shell && Math.abs(enemy.body.velocity.x) < 5) {
      enemy.setVelocityX(this.player.sprite.x < enemy.x ? PHYSICS.shellSpeed : -PHYSICS.shellSpeed);
      this.player.bounce(false);
      return;
    }
    if (this.player.damage(enemy.x)) this.killPlayer();
  }

  enemyTouchesEnemy(a, b) {
    if (!a.active || !b.active || a.dead || b.dead || a === b) return;
    const shell = this.isSlidingShell(a) ? a : this.isSlidingShell(b) ? b : null;
    const target = shell === a ? b : shell === b ? a : null;
    if (!shell || !target || target.kind === 'boss') return;
    target.dead = true;
    target.disableBody(true, true);
    this.score += SCORE.enemy;
    this.scorePop(target.x, target.y - target.displayHeight, `${SCORE.enemy}`);
    this.addBurst(target.x, target.y - target.displayHeight / 2, 0x9adf4a);
    sfx('stomp');
    this.updateHud();
  }

  isSlidingShell(enemy) {
    return enemy.kind === 'chupacabra' && enemy.shell && Math.abs(enemy.body.velocity.x) >= 80;
  }

  killPlayer() {
    if (this.dying) return;
    this.dying = true;
    this.lives -= 1;
    sfx('die');
    this.player.sprite.setVelocity(0, -260);
    this.player.sprite.body.checkCollision.none = true;
    this.time.delayedCall(900, () => {
      this.input.keyboard?.resetKeys();
      if (this.lives <= 0) this.scene.start('GameOver', { score: this.score });
      else this.scene.start('Level', { who: this.who, levelIndex: this.levelIndex, lives: this.lives, relics: this.relics, score: this.score });
    });
  }

  levelClear() {
    if (this.clearing || this.level.isBoss) return;
    this.clearing = true;
    sfx('flag');
    this.score += SCORE.levelComplete;
    this.updateHud();
    this.addBurst(this.player.sprite.x, this.player.sprite.y - 24, 0xffd34d);
    this.time.delayedCall(900, () => {
      const next = this.levelIndex + 1;
      if (next >= LEVELS.length) this.scene.start('Win', { who: this.who, score: this.score });
      else this.scene.start('Level', { who: this.who, levelIndex: next, lives: this.lives, relics: this.relics, score: this.score });
    });
  }

  winGame() {
    if (this.clearing) return;
    this.clearing = true;
    sfx('win');
    this.score += SCORE.levelComplete;
    this.time.delayedCall(500, () => this.scene.start('Win', { who: this.who, score: this.score }));
  }

  createHud() {
    this.hud = {
      hearts: [],
      score: label(this, '', 10, 18, 10),
      relics: label(this, '', 98, 18, 10),
      world: label(this, `1-${this.levelIndex + 1}`, 190, 18, 10),
      time: label(this, '', 322, 18, 10),
      name: label(this, this.level.name, 10, 34, 9),
      scoreLabel: label(this, 'SCORE', 10, 6, 8),
      relicLabel: label(this, 'RELICS', 98, 6, 8),
      worldLabel: label(this, 'WORLD', 190, 6, 8),
      livesLabel: label(this, 'LIVES', 254, 6, 8),
      timeLabel: label(this, 'TIME', 322, 6, 8),
    };
    for (let i = 0; i < 3; i++) this.hud.hearts.push(this.add.image(254 + i * 12, 23, 'heart').setScrollFactor(0).setDepth(50));
    this.cameras.main.ignore([
      ...this.hud.hearts,
      ...Object.values(this.hud).filter((entry) => !Array.isArray(entry)),
    ]);
    this.updateHud();
  }

  createTouchControls() {
    if (!window.matchMedia?.('(pointer: coarse)').matches) return;
    const makeButton = (x, y, text, fill, onDown, onUp) => {
      const circle = this.add.circle(x, y, 18, fill, 0.32)
        .setScrollFactor(0)
        .setDepth(90)
        .setInteractive({ useHandCursor: true });
      const glyph = label(this, text, x, y - 1, 16).setDepth(91);
      circle.on('pointerdown', onDown);
      circle.on('pointerup', onUp);
      circle.on('pointerout', onUp);
      this.cameras.main.ignore([circle, glyph]);
      return [circle, glyph];
    };
    makeButton(34, VIEW_H - 28, '<', 0xffffff, () => { this.touch.left = true; }, () => { this.touch.left = false; });
    makeButton(78, VIEW_H - 28, '>', 0xffffff, () => { this.touch.right = true; }, () => { this.touch.right = false; });
    makeButton(VIEW_W - 42, VIEW_H - 28, '^', 0xffd34d, () => { this.touch.jump = true; }, () => { this.touch.jump = false; });
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
    this.hud.hearts.forEach((h, i) => h.setVisible(i < this.lives));
  }

  popRelic(x, y) {
    const relic = this.ignoreUi(this.add.image(x, y, 'relic').setDepth(35));
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
    const pop = this.ignoreUi(this.add.text(x, y, value, {
      fontFamily: 'Courier New, monospace',
      fontSize: '9px',
      color: '#ffffff',
      stroke: '#101020',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(40).setResolution(1));
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

  update(time) {
    if (!this.player || this.dying || this.clearing) return;
    this.player.update(this.cursors, this.keys, this.touch);
    this.enemies.children.each((e) => {
      if (e.y > VIEW_H + 96) {
        e.destroy();
        return;
      }
      updateEnemy(this, e, time);
    });
    this.updateHud();
  }
}
