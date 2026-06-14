import { uiTextStyle } from './textStyle.js';

export function menuText(scene, value, x, y, size = 18, color = '#ffffff') {
  return scene.add.text(Math.round(x), Math.round(y), value, uiTextStyle(size, color))
    .setOrigin(0.5)
    .setResolution(1);
}

export function menuPanel(scene, x, y, width, height, options = {}) {
  const {
    fill = 0x203050,
    alpha = 0.76,
    stroke = 0xd9f3ff,
    strokeWidth = 2,
  } = options;
  return scene.add.rectangle(x, y, width, height, fill, alpha)
    .setStrokeStyle(strokeWidth, stroke);
}

export function menuPrompt(scene, value, x, y, size = 8) {
  const prompt = menuText(scene, value, x, y, size, '#ffe060');
  scene.tweens.add({ targets: prompt, alpha: 0.28, yoyo: true, repeat: -1, duration: 620 });
  return prompt;
}

export function tapZone(scene, x, y, width, height, onTap) {
  return scene.add.zone(x, y, width, height)
    .setInteractive({ useHandCursor: true })
    .on('pointerup', onTap);
}

export function tapRipple(scene, x, y, color = 0xffd34d) {
  const ring = scene.add.circle(x, y, 4, color, 0.24)
    .setStrokeStyle(1, color)
    .setDepth(100);
  scene.tweens.add({
    targets: ring,
    scale: 6,
    alpha: 0,
    duration: 360,
    ease: 'Quad.easeOut',
    onComplete: () => ring.destroy(),
  });
}

export function pulse(scene, targets, amount = 1.05, duration = 520) {
  const list = Array.isArray(targets) ? targets : [targets];
  for (const target of list) {
    const baseScaleX = target.scaleX;
    const baseScaleY = target.scaleY;
    scene.tweens.add({
      targets: target,
      scaleX: baseScaleX * amount,
      scaleY: baseScaleY * amount,
      duration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
