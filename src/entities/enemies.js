import { PHYSICS } from '../data/constants.js';

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
  scene.enemies.add(e);
  return e;
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
  } else {
    if (e.body.blocked.left) e.patrolDir = 1;
    if (e.body.blocked.right) e.patrolDir = -1;
    if (e.kind === 'chupacabra' && e.shell) {
      if (Math.abs(e.body.velocity.x) >= 5) e.patrolDir = Math.sign(e.body.velocity.x) || e.patrolDir;
      return;
    }
    e.setVelocityX(e.patrolDir * e.patrolSpeed);
  }
}

export function stompEnemy(scene, e) {
  if (e.kind === 'boss') {
    if (scene.time.now < (e.invulnUntil || 0)) return false;
    e.hp -= 1;
    e.invulnUntil = scene.time.now + 650;
    e.setTint(0xffffff);
    scene.time.delayedCall(120, () => e.clearTint());
    if (e.hp <= 0) { e.destroy(); scene.winGame(); }
    return true;
  }
  if (e.kind === 'chupacabra' && !e.shell) {
    e.shell = true;
    e.setTexture('enemy-chupacabra-shell');
    e.setVelocityX(0);
    e.setDisplaySize(22, 12);
    setBody(e, 18, 9);
    return true;
  }
  if (e.kind === 'chupacabra' && e.shell && Math.abs(e.body.velocity.x) < 5) {
    e.setVelocityX(scene.player.sprite.x < e.x ? PHYSICS.shellSpeed : -PHYSICS.shellSpeed);
    return true;
  }
  e.dead = true;
  e.disableBody(true, true);
  scene.time.delayedCall(150, () => e.destroy());
  return true;
}
