import * as Phaser from 'phaser';
import { VIEW_H, VIEW_W } from './data/constants.js';
import { BootScene } from './scenes/BootScene.js';
import { CastScene, GameOverScene, SelectScene, TitleScene, WinScene } from './scenes/TitleScene.js';
import { LevelScene } from './scenes/LevelScene.js';
import { UI_FONT_FAMILY } from './ui/textStyle.js';

if (document.fonts?.load) {
  await document.fonts.load(`16px ${UI_FONT_FAMILY}`);
  await document.fonts.ready;
}

const config = {
  type: Phaser.CANVAS,
  parent: 'game-wrap',
  canvas: document.getElementById('game'),
  width: VIEW_W,
  height: VIEW_H,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#5c94fc',
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 760 },
      debug: false,
    },
  },
  scene: [BootScene, TitleScene, CastScene, SelectScene, LevelScene, GameOverScene, WinScene],
};

const game = new Phaser.Game(config);
window.cryptidGame = game;

const canvas = document.getElementById('game');
const gameWrap = document.getElementById('game-wrap');
const fullscreenButton = document.getElementById('fullscreen-button');

async function toggleFullscreen() {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }
  await (gameWrap || canvas).requestFullscreen();
}

fullscreenButton?.addEventListener('click', () => {
  toggleFullscreen().catch((error) => {
    console.warn('Fullscreen request failed:', error);
  });
});

window.addEventListener('keydown', (event) => {
  if (event.code !== 'KeyF' || event.repeat) return;
  const activeTag = document.activeElement?.tagName;
  if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'BUTTON') return;
  event.preventDefault();
  toggleFullscreen().catch((error) => {
    console.warn('Fullscreen request failed:', error);
  });
});
