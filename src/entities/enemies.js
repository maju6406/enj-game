export function spawnEnemy(scene, def) {
  const key = def.type === 'boss' ? 'enemy-boss' : def.type === 'mothman' ? 'enemy-mothman' : def.type === 'chupacabra' ? 'enemy-chupacabra' : 'enemy-grunt';
  const e = scene.physics.add.sprite(def.x + 8, def.gy, key).setOrigin(0.5, 1).setDepth(8);
  e.kind = def.type;
  e.spawnY = def.gy;
  e.baseX = def.x + 8;
  e.hp = def.type === 'boss' ? 3 : 1;
  e.shell = false;
  e.dead = false;
  e.body.setSize(Math.max(10, e.displayWidth * 0.75), Math.max(10, e.displayHeight * 0.75));
  if (def.type === 'mothman') {
    e.body.allowGravity = false;
    e.setVelocityX(40);
  } else if (def.type === 'boss') {
    e.setDisplaySize(38, 38);
    e.body.setSize(26, 30);
    e.setVelocityX(-50);
  } else {
    e.setVelocityX(def.type === 'chupacabra' ? -45 : -35);
  }
  scene.enemies.add(e);
  return e;
}

export function updateEnemy(scene, e, time) {
  if (!e.active || e.dead) return;
  if (e.kind === 'mothman') {
    e.y = e.spawnY + Math.sin(time / 360 + e.baseX) * 18;
    if (e.x < scene.cameras.main.scrollX - 40) e.setVelocityX(45);
    if (e.x > scene.cameras.main.scrollX + 420) e.setVelocityX(-45);
  } else {
    if (e.body.blocked.left) e.setVelocityX(Math.abs(e.body.velocity.x || 45));
    if (e.body.blocked.right) e.setVelocityX(-Math.abs(e.body.velocity.x || 45));
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
    e.setVelocityX(0);
    e.setDisplaySize(18, 10);
    e.body.setSize(16, 8);
    return true;
  }
  if (e.kind === 'chupacabra' && e.shell && Math.abs(e.body.velocity.x) < 5) {
    e.setVelocityX(scene.player.sprite.x < e.x ? 180 : -180);
    return true;
  }
  e.dead = true;
  e.disableBody(true, true);
  scene.time.delayedCall(150, () => e.destroy());
  return true;
}
