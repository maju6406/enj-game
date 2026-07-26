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
    this.visualStride = this.visualPhase;
    this.squashStart = 0;
    this.squashDuration = 0;
    this.squashAmount = 0;
    this.jumpBufferUntil = 0;
    this.coyoteUntil = 0;
    this.jumpWasHeld = false;
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
    this.visualScaleX = Math.abs(this.sprite.scaleX);
    this.visualScaleY = Math.abs(this.sprite.scaleY);
    this.visualAngle = 0;
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

  update(cursors, keys, touch = {}, delta = 1000 / 60) {
    const body = this.sprite.body;
    const left = cursors.left.isDown || touch.left;
    const right = cursors.right.isDown || touch.right;
    const direction = Number(right) - Number(left);
    const jumpHeld = cursors.up.isDown || keys.space.isDown || !!touch.jump;
    const touchJumpPressed = touch.jump && !this.touchJumpWasDown;
    const jumpPressed = Phaser.Input.Keyboard.JustDown(cursors.up) || Phaser.Input.Keyboard.JustDown(keys.space) || touchJumpPressed;
    this.touchJumpWasDown = touch.jump;

    const grounded = body.blocked.down || body.touching.down;
    if (grounded) this.coyoteUntil = this.scene.time.now + PHYSICS.coyoteTimeMs;
    if (jumpPressed) this.jumpBufferUntil = this.scene.time.now + PHYSICS.jumpBufferMs;

    const acceleration = grounded ? PHYSICS.groundAcceleration : PHYSICS.airAcceleration;
    body.setAccelerationX(direction * acceleration);
    body.setDragX(grounded ? PHYSICS.groundDrag : PHYSICS.airDrag);
    if (direction < 0) this.sprite.setFlipX(true);
    else if (direction > 0) this.sprite.setFlipX(false);

    if (this.scene.time.now <= this.jumpBufferUntil && this.scene.time.now <= this.coyoteUntil) {
      body.setVelocityY(PHYSICS.jumpVelocity);
      this.jumpBufferUntil = 0;
      this.coyoteUntil = 0;
      this.triggerSquash(0.05, 150);
      sfx('jump');
    }
    if (!jumpHeld && this.jumpWasHeld && body.velocity.y < 0) {
      body.setVelocityY(body.velocity.y * PHYSICS.jumpCutMultiplier);
    }
    this.jumpWasHeld = jumpHeld;

    this.sprite.setAlpha(this.scene.time.now < this.invulnUntil && Math.floor(this.scene.time.now / 80) % 2 === 0 ? 0.35 : 1);
    this.animateVisual(body, grounded && body.velocity.y >= 0, delta);
    if (grounded && !this.wasGrounded) this.triggerSquash(0.07, 160);
    this.wasGrounded = grounded;
    if (this.sprite.y > VIEW_H + 64) this.scene.killPlayer('fall');
  }

  bounce() { this.sprite.setVelocityY(PHYSICS.stompBounce); }
  get foot() { return this.sprite.y; }

  animateVisual(body, grounded, delta) {
    const baseScaleX = this.sprite.getData('__baseScaleX') || Math.abs(this.sprite.scaleX);
    const baseScaleY = this.sprite.getData('__baseScaleY') || Math.abs(this.sprite.scaleY);
    const time = this.scene.time.now;
    const speedRatio = Phaser.Math.Clamp(Math.abs(body.velocity.x) / PHYSICS.maxRun, 0, 1);
    const smoothing = 1 - Math.exp(-delta / 55);
    let targetScaleX = baseScaleX;
    let targetScaleY = baseScaleY;
    let targetAngle = 0;

    if (!grounded) {
      targetScaleX *= 0.985;
      targetScaleY *= 1.015;
      targetAngle = body.velocity.y < 0 ? (this.sprite.flipX ? -1.2 : 1.2) : (this.sprite.flipX ? 1.6 : -1.6);
    } else if (speedRatio > 0.05) {
      this.visualStride += delta * 0.014 * speedRatio;
      const stride = Math.sin(this.visualStride);
      targetScaleX *= 1 + Math.abs(stride) * 0.008 * speedRatio;
      targetScaleY *= 1 - Math.abs(stride) * 0.006 * speedRatio;
      targetAngle = (this.sprite.flipX ? -1 : 1) * stride * 0.7 * speedRatio;
    } else {
      const idle = Math.sin(time / 430 + this.visualPhase);
      targetScaleY *= 1 + idle * 0.004;
    }

    if (this.squashDuration > 0) {
      const t = Phaser.Math.Clamp((time - this.squashStart) / this.squashDuration, 0, 1);
      const strength = Math.sin(Math.PI * t) * this.squashAmount;
      targetScaleX *= 1 + strength;
      targetScaleY *= 1 - strength;
      if (t >= 1) this.squashDuration = 0;
    }

    this.visualScaleX = Phaser.Math.Linear(this.visualScaleX, targetScaleX, smoothing);
    this.visualScaleY = Phaser.Math.Linear(this.visualScaleY, targetScaleY, smoothing);
    this.visualAngle = Phaser.Math.Linear(this.visualAngle, targetAngle, smoothing);
    this.sprite.setScale(this.visualScaleX, this.visualScaleY);
    this.sprite.setAngle(this.visualAngle);
  }

  triggerSquash(amount, duration) {
    this.squashStart = this.scene.time.now;
    this.squashDuration = duration;
    this.squashAmount = amount;
  }
}
