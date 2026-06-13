import * as Phaser from 'phaser';
import { PHYSICS, TILE, VIEW_H } from '../data/constants.js';
import { sfx } from '../systems/sfx.js';

export class Player {
  constructor(scene, who, x, y) {
    this.scene = scene;
    this.who = who;
    this.big = false;
    this.invulnUntil = 0;
    this.jumpBufferedUntil = 0;
    this.coyoteUntil = 0;
    this.sprite = scene.physics.add.sprite(x, y, `hero-${who}`)
      .setOrigin(0.5, 1)
      .setDepth(10);
    this.setHeroDisplay(false);
    this.setBody(12, 20);
    this.sprite.body.setMaxVelocity(PHYSICS.maxRun, 620);
  }

  aspect() {
    const img = this.scene.textures.get(`hero-${this.who}`).getSourceImage();
    return img.width / img.height;
  }

  setHeroDisplay(big) {
    const height = big ? 58 : 42;
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
    this.setBody(big ? 14 : 12, big ? 30 : 20);
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

  update(cursors, keys) {
    const body = this.sprite.body;
    const left = cursors.left.isDown;
    const right = cursors.right.isDown;
    const jumpDown = cursors.up.isDown || keys.space.isDown;
    const jumpPressed = Phaser.Input.Keyboard.JustDown(cursors.up) || Phaser.Input.Keyboard.JustDown(keys.space);

    if (left) { body.setAccelerationX(-PHYSICS.runAccel * 10); this.sprite.setFlipX(true); }
    else if (right) { body.setAccelerationX(PHYSICS.runAccel * 10); this.sprite.setFlipX(false); }
    else {
      body.setAccelerationX(0);
      const drag = PHYSICS.friction * 10;
      if (Math.abs(body.velocity.x) <= drag / 60) body.setVelocityX(0);
      else body.setVelocityX(body.velocity.x + (body.velocity.x > 0 ? -drag / 60 : drag / 60));
    }
    body.velocity.x = Phaser.Math.Clamp(body.velocity.x, -PHYSICS.maxRun, PHYSICS.maxRun);

    if (body.blocked.down || body.touching.down) this.coyoteUntil = this.scene.time.now + PHYSICS.coyoteMs;
    if (jumpPressed) this.jumpBufferedUntil = this.scene.time.now + PHYSICS.jumpBufferMs;
    if (this.scene.time.now < this.jumpBufferedUntil && this.scene.time.now < this.coyoteUntil) {
      body.setVelocityY(PHYSICS.jumpVelocity);
      this.jumpBufferedUntil = 0; this.coyoteUntil = 0;
      sfx('jump');
    }
    if (!jumpDown && body.velocity.y < 0) body.setVelocityY(body.velocity.y * PHYSICS.jumpCutMultiplier);

    this.sprite.setAlpha(this.scene.time.now < this.invulnUntil && Math.floor(this.scene.time.now / 80) % 2 === 0 ? 0.35 : 1);
    if (this.sprite.y > VIEW_H + 64) this.scene.killPlayer();
  }

  bounce(held) { this.sprite.setVelocityY(held ? PHYSICS.stompBounceHeld : PHYSICS.stompBounce); }
  get foot() { return this.sprite.y; }
}
