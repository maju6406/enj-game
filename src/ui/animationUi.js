const BASE = new WeakMap();

export function rememberBase(target) {
  if (!target) return null;
  const base = {
    x: target.x,
    y: target.y,
    scaleX: target.scaleX,
    scaleY: target.scaleY,
    angle: target.angle || 0,
    alpha: target.alpha == null ? 1 : target.alpha,
  };
  BASE.set(target, base);
  return base;
}

export function baseOf(target) {
  return BASE.get(target) || rememberBase(target);
}

export function loopBob(scene, targets, distance = 2, duration = 720, options = {}) {
  const list = Array.isArray(targets) ? targets : [targets];
  for (const target of list) {
    const base = baseOf(target);
    scene.tweens.add({
      targets: target,
      y: base.y - distance,
      duration,
      delay: options.delay || 0,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}

export function loopPulse(scene, targets, amount = 1.04, duration = 640, options = {}) {
  const list = Array.isArray(targets) ? targets : [targets];
  for (const target of list) {
    const base = baseOf(target);
    scene.tweens.add({
      targets: target,
      scaleX: base.scaleX * amount,
      scaleY: base.scaleY * amount,
      duration,
      delay: options.delay || 0,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}

export function loopWobble(scene, targets, degrees = 2, duration = 520, options = {}) {
  const list = Array.isArray(targets) ? targets : [targets];
  for (const target of list) {
    const base = baseOf(target);
    scene.tweens.add({
      targets: target,
      angle: base.angle + degrees,
      duration,
      delay: options.delay || 0,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}

export function loopShimmer(scene, targets, alpha = 0.72, duration = 760, options = {}) {
  const list = Array.isArray(targets) ? targets : [targets];
  for (const target of list) {
    const base = baseOf(target);
    scene.tweens.add({
      targets: target,
      alpha,
      duration,
      delay: options.delay || 0,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onYoyo: () => target.setAlpha(base.alpha),
    });
  }
}

export function squash(scene, target, amount = 0.1, duration = 90) {
  const base = baseOf(target);
  scene.tweens.killTweensOf(target);
  target.setScale(base.scaleX * (1 + amount), base.scaleY * (1 - amount));
  scene.tweens.add({
    targets: target,
    scaleX: base.scaleX,
    scaleY: base.scaleY,
    duration,
    ease: 'Back.easeOut',
  });
}

export function flashTint(scene, target, tint = 0xffffff, duration = 90) {
  target.setTint(tint);
  scene.time.delayedCall(duration, () => {
    if (target.active !== false) target.clearTint();
  });
}
