import * as Phaser from 'phaser';
import { VIEW_H, VIEW_W } from './data/constants.js';
import { BootScene } from './scenes/BootScene.js';
import { GameOverScene, SelectScene, TitleScene, WinScene } from './scenes/TitleScene.js';
import { LevelScene } from './scenes/LevelScene.js';

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
  scene: [BootScene, TitleScene, SelectScene, LevelScene, GameOverScene, WinScene],
};

const game = new Phaser.Game(config);
window.cryptidGame = game;
