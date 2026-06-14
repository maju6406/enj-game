import { PHYSICS } from '../data/constants.js';
import { flashTint, rememberBase, squash } from '../ui/animationUi.js';

export function spawnEnemy(scene, def) {
  const key = def.type === 'boss' ? 'enemy-boss' : def.type === 'mothman' ? 'enemy-mothman' : def.type === 'chupacabra' ? 'enemy-chupacabra' : 'enemy-grunt';
  const e = scene.physics.add.sprite(def.x + 8, def.gy, key).setOrigin(0.5, 1).setDepth(8);
  e.kind = def.type;
  e.spawnY = def.gy;
  e.baseX = def.x + 8;
  e.hp = def.type === 'boss' ? 3 : 1;
  e.shell = false;
  e.dead = false;
  e.patrolDir = -1;
  e.patrolSpeed = PHYSICS.enemySpeed;
  e.animSeed = (def.x + def.gy) * 0.017;
  setBody(e, Math.max(10, e.width * 0.75), Math.max(10, e.height * 0.75));
  if (def.type === 'mothman') {
    e.body.allowGravity = false;
    e.patrolDir = 1;
    e.setVelocityX(e.patrolSpeed);
  } else if (def.type === 'boss') {
    e.setDisplaySize(38, 38);
    setBody(e, 26, 30);
    e.setVelocityX(-e.patrolSpeed);
  } else {
    e.setVelocityX(-e.patrolSpeed);
  }
  setEnemyBase(e);
  scene.enemies.add(e);
  return e;
}

function setEnemyBase(e) {
  e.animBaseScaleX = Math.abs(e.scaleX) || 1;
  e.animBaseScaleY = Math.abs(e.scaleY) || 1;
  rememberBase(e);
}

function setBody(e, w, h) {
  const scaleX = Math.abs(e.scaleX) || 1;
  const scaleY = Math.abs(e.scaleY) || 1;
  const bodyW = w / scaleX;
  const bodyH = h / scaleY;
  e.body.setSize(bodyW, bodyH);
  e.body.setOffset((e.width - bodyW) / 2, e.height - bodyH);
}

export function updateEnemy(scene, e, time) {
  if (!e.active || e.dead) return;
  if (e.kind === 'mothman') {
    e.y = e.spawnY + Math.sin(time / 360 + e.baseX) * 18;
    if (e.x < scene.cameras.main.scrollX - 40) e.patrolDir = 1;
    if (e.x > scene.cameras.main.scrollX + 420) e.patrolDir = -1;
    e.setVelocityX(e.patrolDir * e.patrolSpeed);
    animateMothman(e, time);
  } else {
    if (e.body.blocked.left) e.patrolDir = 1;
    if (e.body.blocked.right) e.patrolDir = -1;
    if (e.kind === 'chupacabra' && e.shell) {
      if (Math.abs(e.body.velocity.x) >= 5) e.patrolDir = Math.sign(e.body.velocity.x) || e.patrolDir;
      animateShell(e, time);
      return;
    }
    e.setVelocityX(e.patrolDir * e.patrolSpeed);
    if (e.kind === 'boss') animateBoss(e, time);
    else if (e.kind === 'chupacabra') animateChupacabra(e, time);
    else animateGrunt(e, time);
  }
}

function animateGrunt(e, time) {
  const step = Math.sin(time / 115 + e.animSeed);
  e.setFlipX(e.patrolDir > 0);
  e.setScale(e.animBaseScaleX * (1 + Math.abs(step) * 0.035), e.animBaseScaleY * (1 - Math.abs(step) * 0.025));
  e.setAngle(step * 2.4);
  e.setAlpha(Math.sin(time / 1400 + e.animSeed) > 0.985 ? 0.72 : 1);
}

function animateChupacabra(e, time) {
  const step = Math.sin(time / 72 + e.animSeed);
  e.setFlipX(e.patrolDir > 0);
  e.setScale(e.animBaseScaleX * (1 + Math.abs(step) * 0.025), e.animBaseScaleY * (1 - Math.abs(step) * 0.02));
  e.setAngle(step * 3.4);
}

function animateShell(e, time) {
  if (Math.abs(e.body.velocity.x) >= 5) e.setAngle(e.angle + Math.sign(e.body.velocity.x) * 14);
  else e.setAngle(Math.sin(time / 130 + e.animSeed) * 4);
  e.setScale(e.animBaseScaleX, e.animBaseScaleY);
}

function animateMothman(e, time) {
  const flap = Math.sin(time / 82 + e.animSeed);
  e.setFlipX(e.patrolDir < 0);
  e.setScale(e.animBaseScaleX * (1 + Math.abs(flap) * 0.045), e.animBaseScaleY * (1 - Math.abs(flap) * 0.025));
  e.setAngle(Math.sin(time / 180 + e.animSeed) * 4);
  if (Math.sin(time / 310 + e.animSeed) > 0.92) e.setTint(0xff6a6a);
  else e.clearTint();
}

function animateBoss(e, time) {
  const stomp = Math.sin(time / 155 + e.animSeed);
  e.setFlipX(e.patrolDir > 0);
  e.setScale(e.animBaseScaleX * (1 + Math.abs(stomp) * 0.025), e.animBaseScaleY * (1 - Math.abs(stomp) * 0.018));
  e.setAngle(stomp * 1.2);
}

export function stompEnemy(scene, e) {
  if (e.kind === 'boss') {
    if (scene.time.now < (e.invulnUntil || 0)) return false;
    e.hp -= 1;
    e.invulnUntil = scene.time.now + 650;
    flashTint(scene, e, 0xffffff, 120);
    squash(scene, e, 0.12, 130);
    if (e.hp <= 0) {
      e.dead = true;
      e.disableBody(true, false);
      scene.tweens.add({
        targets: e,
        angle: e.angle + 720,
        scaleY: e.animBaseScaleY * 0.2,
        alpha: 0,
        duration: 520,
        ease: 'Back.easeIn',
        onComplete: () => { e.destroy(); scene.winGame(); },
      });
    }
    return true;
  }
  if (e.kind === 'chupacabra' && !e.shell) {
    e.shell = true;
    e.setTexture('enemy-chupacabra-shell');
    e.setVelocityX(0);
    e.setDisplaySize(22, 12);
    setBody(e, 18, 9);
    setEnemyBase(e);
    squash(scene, e, 0.16, 140);
    return true;
  }
  if (e.kind === 'chupacabra' && e.shell && Math.abs(e.body.velocity.x) < 5) {
    e.setVelocityX(scene.player.sprite.x < e.x ? PHYSICS.shellSpeed : -PHYSICS.shellSpeed);
    return true;
  }
  e.dead = true;
  e.disableBody(true, false);
  scene.tweens.add({
    targets: e,
    scaleX: e.animBaseScaleX * 1.25,
    scaleY: e.animBaseScaleY * 0.18,
    alpha: 0,
    angle: e.angle + (e.flipX ? -80 : 80),
    duration: 180,
    ease: 'Quad.easeIn',
    onComplete: () => e.destroy(),
  });
  return true;
}
