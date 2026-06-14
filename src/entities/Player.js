import * as Phaser from 'phaser';
import { HERO_DISPLAY, PHYSICS, TILE, VIEW_H } from '../data/constants.js';
import { sfx } from '../systems/sfx.js';

export class Player {
  constructor(scene, who, x, y) {
    this.scene = scene;
    this.who = who;
    this.big = false;
    this.invulnUntil = 0;
    this.sprite = scene.physics.add.sprite(x, y, `hero-${who}`)
      .setOrigin(0.5, 1)
      .setDepth(10);
    this.setHeroDisplay(false);
    this.setBody(13, 25);
    this.sprite.body.setMaxVelocity(PHYSICS.maxRun, 620);
  }

  aspect() {
    const img = this.scene.textures.get(`hero-${this.who}`).getSourceImage();
    return img.width / img.height;
  }

  setHeroDisplay(big) {
    const height = big ? HERO_DISPLAY.powered : HERO_DISPLAY.gameplay;
    this.sprite.setDisplaySize(Math.round(height * this.aspect()), height);
  }

  setBody(displayW, displayH) {
    const scaleX = Math.abs(this.sprite.scaleX) || 1;
    const scaleY = Math.abs(this.sprite.scaleY) || 1;
    const bodyW = displayW / scaleX;
    const bodyH = displayH / scaleY;
    this.sprite.body.setSize(bodyW, bodyH);
    this.sprite.body.setOffset((this.sprite.width - bodyW) / 2, this.sprite.height - bodyH);
  }

  setBig(big) {
    if (this.big === big) return;
    this.big = big;
    this.setHeroDisplay(big);
    this.setBody(big ? 17 : 13, big ? 34 : 25);
  }

  grow() { this.setBig(true); }
  shrink(sourceX) {
    this.setBig(false);
    this.invulnUntil = this.scene.time.now + 1500;
    const dir = this.sprite.x < sourceX ? -1 : 1;
    this.sprite.setVelocity(dir * PHYSICS.hurtKnockX, PHYSICS.hurtKnockY);
    sfx('hurt');
  }

  damage(sourceX) {
    if (this.scene.time.now < this.invulnUntil) return false;
    if (this.big) { this.shrink(sourceX); return false; }
    return true;
  }

  update(cursors, keys, touch = {}) {
    const body = this.sprite.body;
    const left = cursors.left.isDown || touch.left;
    const right = cursors.right.isDown || touch.right;
    const touchJumpPressed = touch.jump && !this.touchJumpWasDown;
    const jumpPressed = Phaser.Input.Keyboard.JustDown(cursors.up) || Phaser.Input.Keyboard.JustDown(keys.space) || touchJumpPressed;
    this.touchJumpWasDown = touch.jump;

    body.setAccelerationX(0);
    if (left) {
      body.setVelocityX(-PHYSICS.maxRun);
      this.sprite.setFlipX(true);
    } else if (right) {
      body.setVelocityX(PHYSICS.maxRun);
      this.sprite.setFlipX(false);
    } else {
      body.setVelocityX(0);
    }

    if (jumpPressed && (body.blocked.down || body.touching.down)) {
      body.setVelocityY(PHYSICS.jumpVelocity);
      sfx('jump');
    }

    this.sprite.setAlpha(this.scene.time.now < this.invulnUntil && Math.floor(this.scene.time.now / 80) % 2 === 0 ? 0.35 : 1);
    if (this.sprite.y > VIEW_H + 64) this.scene.killPlayer();
  }

  bounce() { this.sprite.setVelocityY(PHYSICS.stompBounce); }
  get foot() { return this.sprite.y; }
}
