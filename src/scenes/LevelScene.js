import * as Phaser from 'phaser';
import { HAZARD, PHYSICS, SOLID, START_LIVES, TILE, VIEW_H, VIEW_W } from '../data/constants.js';
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
    this.levelIndex = data.levelIndex || 0;
    this.lives = data.lives ?? START_LIVES;
    this.relics = data.relics || 0;
    this.score = data.score || 0;
  }

  create() {
    this.level = LEVELS[this.levelIndex];
    this.cameras.main.setBackgroundColor(this.bgColor());
    this.physics.world.gravity.y = PHYSICS.gravity;
    this.physics.world.setBounds(0, 0, this.level.width * TILE, VIEW_H);

    this.solids = this.physics.add.staticGroup();
    this.hazards = this.physics.add.staticGroup();
    this.coins = this.physics.add.staticGroup();
    this.items = this.physics.add.group({ allowGravity: false });
    this.enemies = this.physics.add.group();
    this.blockSprites = new Map();
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

    if (this.level.flagX != null) {
      this.flag = this.add.rectangle(this.level.flagX * TILE, 96, 4, 112, 0xffffff).setOrigin(0, 0).setDepth(4);
      this.flagZone = this.add.zone(this.level.flagX * TILE, 0, 24, VIEW_H).setOrigin(0, 0);
      this.physics.add.existing(this.flagZone, true);
      this.physics.add.overlap(this.player.sprite, this.flagZone, () => this.levelClear());
    }

    for (const def of this.level.enemies) spawnEnemy(this, def);
    this.createHud();
    this.timeLeft = this.level.time;
    this.timerEvent = this.time.addEvent({ delay: 1000, loop: true, callback: () => {
      this.timeLeft -= 1; if (this.timeLeft <= 0) this.killPlayer();
    } });
  }

  bgColor() {
    return this.level.theme === 'underground' ? '#101020' : this.level.theme === 'castle' ? '#181420' : '#5c94fc';
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
        } else if (SOLID.has(ch)) {
          const s = this.solids.create(x * TILE + 8, y * TILE + 8, TILE_KEY[ch] || 'tile-block');
          s.setData('tile', { x, y, ch });
          this.blockSprites.set(`${x},${y}`, s);
        } else if (HAZARD.has(ch)) {
          this.hazards.create(x * TILE + 8, y * TILE + 8, TILE_KEY[ch]);
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
    if (ch === '?') { sfx('coin'); this.addRelic(50); }
    if (ch === 'U') { sfx('power'); this.items.create(tile.x * TILE + 8, tile.y * TILE - 8, 'journal'); }
  }

  collectRelic(coin) { coin.destroy(); sfx('coin'); this.addRelic(50); }
  collectItem(item) { item.destroy(); this.player.grow(); sfx('power'); this.score += 1000; this.updateHud(); }
  addRelic(points = 50) {
    this.relics += 1; this.score += points;
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
      this.score += enemy.kind === 'boss' ? 0 : 100;
      this.updateHud();
      return;
    }
    if (enemy.kind === 'chupacabra' && enemy.shell && Math.abs(enemy.body.velocity.x) < 5) {
      enemy.setVelocityX(this.player.sprite.x < enemy.x ? 180 : -180);
      this.player.bounce(false);
      return;
    }
    if (this.player.damage(enemy.x)) this.killPlayer();
  }

  killPlayer() {
    if (this.dying) return;
    this.dying = true;
    this.lives -= 1;
    sfx('die');
    this.player.sprite.setVelocity(0, -260);
    this.player.sprite.body.checkCollision.none = true;
    this.time.delayedCall(900, () => {
      if (this.lives <= 0) this.scene.start('GameOver', { score: this.score });
      else this.scene.restart({ who: this.who, levelIndex: this.levelIndex, lives: this.lives, relics: this.relics, score: this.score });
    });
  }

  levelClear() {
    if (this.clearing || this.level.isBoss) return;
    this.clearing = true;
    sfx('flag');
    this.score += this.timeLeft * 10;
    this.updateHud();
    this.time.delayedCall(900, () => this.scene.restart({
      who: this.who, levelIndex: this.levelIndex + 1, lives: this.lives, relics: this.relics, score: this.score,
    }));
  }

  winGame() {
    if (this.clearing) return;
    this.clearing = true;
    sfx('win');
    this.score += this.timeLeft * 10;
    this.time.delayedCall(500, () => this.scene.start('Win', { who: this.who, score: this.score }));
  }

  createHud() {
    this.hud = {
      hearts: [], score: label(this, '', 10, 8), relics: label(this, '', 94, 8),
      world: label(this, `WORLD 1-${this.levelIndex + 1}`, 190, 8), time: label(this, '', 310, 8),
      name: label(this, this.level.name, 10, 24, 9),
    };
    for (let i = 0; i < 3; i++) this.hud.hearts.push(this.add.image(70 + i * 12, 15, 'heart').setScrollFactor(0).setDepth(50));
    this.updateHud();
  }

  updateHud() {
    if (!this.hud) return;
    this.hud.score.setText(String(this.score).padStart(6, '0'));
    this.hud.relics.setText(`RELIC ${String(this.relics).padStart(2, '0')}`);
    this.hud.time.setText(`TIME ${Math.max(0, this.timeLeft | 0)}`);
    this.hud.hearts.forEach((h, i) => h.setVisible(i < this.lives));
  }

  update(time) {
    if (!this.player || this.dying || this.clearing) return;
    this.player.update(this.cursors, this.keys);
    this.enemies.children.each((e) => updateEnemy(this, e, time));
    this.updateHud();
  }
}
