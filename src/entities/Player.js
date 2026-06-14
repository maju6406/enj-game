import * as Phaser from 'phaser';
import { HERO_DISPLAY, PHYSICS, TILE, VIEW_H } from '../data/constants.js';
import { sfx } from '../systems/sfx.js';
import { rememberBase } from '../ui/animationUi.js';

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
    this.wasGrounded = true;
    this.visualPhase = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.squashStart = 0;
    this.squashDuration = 0;
    this.squashAmount = 0;
  }

  aspect() {
    const img = this.scene.textures.get(`hero-${this.who}`).getSourceImage();
    return img.width / img.height;
  }

  setHeroDisplay(big) {
    const height = big ? HERO_DISPLAY.powered : HERO_DISPLAY.gameplay;
    this.sprite.setDisplaySize(Math.round(height * this.aspect()), height);
    this.sprite.setData('__baseScaleX', Math.abs(this.sprite.scaleX));
    this.sprite.setData('__baseScaleY', Math.abs(this.sprite.scaleY));
    rememberBase(this.sprite);
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

    const grounded = body.blocked.down || body.touching.down;
    if (jumpPressed && grounded) {
      body.setVelocityY(PHYSICS.jumpVelocity);
      this.triggerSquash(0.08, 120);
      sfx('jump');
    }

    this.sprite.setAlpha(this.scene.time.now < this.invulnUntil && Math.floor(this.scene.time.now / 80) % 2 === 0 ? 0.35 : 1);
    this.animateVisual(body, grounded, left || right);
    if (grounded && !this.wasGrounded) this.triggerSquash(0.12, 110);
    this.wasGrounded = grounded;
    if (this.sprite.y > VIEW_H + 64) this.scene.killPlayer('fall');
  }

  bounce() { this.sprite.setVelocityY(PHYSICS.stompBounce); }
  get foot() { return this.sprite.y; }

  animateVisual(body, grounded, moving) {
    const baseScaleX = this.sprite.getData('__baseScaleX') || Math.abs(this.sprite.scaleX);
    const baseScaleY = this.sprite.getData('__baseScaleY') || Math.abs(this.sprite.scaleY);
    this.sprite.setData('__baseScaleX', baseScaleX);
    this.sprite.setData('__baseScaleY', baseScaleY);
    const time = this.scene.time.now;
    let scaleX = baseScaleX;
    let scaleY = baseScaleY;
    let angle = 0;

    if (!grounded) {
      scaleX *= 0.96;
      scaleY *= 1.04;
      angle = body.velocity.y < 0 ? (this.sprite.flipX ? -2 : 2) : (this.sprite.flipX ? 3 : -3);
    } else if (moving) {
      const stride = Math.sin(time / 70 + this.visualPhase);
      scaleX *= 1 + Math.abs(stride) * 0.035;
      scaleY *= 1 - Math.abs(stride) * 0.025;
      angle = (this.sprite.flipX ? -1 : 1) * stride * 1.8;
    } else {
      const idle = Math.sin(time / 430 + this.visualPhase);
      scaleY *= 1 + idle * 0.012;
    }

    if (this.squashDuration > 0) {
      const t = Phaser.Math.Clamp((time - this.squashStart) / this.squashDuration, 0, 1);
      const strength = (1 - t) * this.squashAmount;
      scaleX *= 1 + strength;
      scaleY *= 1 - strength;
    }

    this.sprite.setScale(scaleX, scaleY);
    this.sprite.setAngle(angle);
  }

  triggerSquash(amount, duration) {
    this.squashStart = this.scene.time.now;
    this.squashDuration = duration;
    this.squashAmount = amount;
  }
}
