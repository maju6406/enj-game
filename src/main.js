import * as Phaser from 'phaser';
import { VIEW_H, VIEW_W } from './data/constants.js';
import { BootScene } from './scenes/BootScene.js';
import { CastScene, CryptidsScene, GameOverScene, PowerupsScene, SelectScene, TitleScene, WinScene } from './scenes/TitleScene.js';
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
  scene: [BootScene, TitleScene, CastScene, CryptidsScene, PowerupsScene, SelectScene, LevelScene, GameOverScene, WinScene],
};

const game = new Phaser.Game(config);
window.cryptidGame = game;

const canvas = document.getElementById('game');
const gameWrap = document.getElementById('game-wrap');
const fullscreenButton = document.getElementById('fullscreen-button');
const coarsePointerQuery = window.matchMedia?.('(pointer: coarse)');
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = window.matchMedia?.('(display-mode: standalone)')?.matches
  || window.navigator.standalone === true;

if (isIOS && !isStandalone) document.documentElement.classList.add('ios-browser');

function isFullscreenLike() {
  return document.fullscreenElement === gameWrap
    || document.fullscreenElement === canvas
    || document.body.classList.contains('fullscreen-fallback');
}

function viewportSize() {
  const viewport = window.visualViewport;
  const visualWidth = Math.max(1, Math.floor(viewport?.width || window.innerWidth));
  const visualHeight = Math.max(1, Math.floor(viewport?.height || window.innerHeight));
  const isLandscape = visualWidth > visualHeight;
  if (isIOS && !isStandalone && isLandscape && screen?.width && screen?.height) {
    return {
      width: Math.max(1, Math.max(screen.width, screen.height)),
      height: Math.max(1, Math.min(screen.width, screen.height)),
    };
  }
  return {
    width: visualWidth,
    height: visualHeight,
  };
}

function collapseMobileBrowserChrome() {
  if (!isIOS || isStandalone) return;
  window.scrollTo(0, 1);
  window.setTimeout(() => window.scrollTo(0, 1), 250);
}

function resizeCanvasToCrispScale() {
  if (!canvas) return;
  const fullscreen = isFullscreenLike();
  const isTouchLayout = coarsePointerQuery?.matches || fullscreen;
  const viewport = viewportSize();
  const chromeHeight = fullscreen || isTouchLayout ? 0 : 90;
  const horizontalPadding = fullscreen || isTouchLayout ? 0 : 28;
  const availableW = Math.max(1, viewport.width - horizontalPadding);
  const availableH = Math.max(1, viewport.height - chromeHeight);
  const fitScale = Math.min(availableW / VIEW_W, availableH / VIEW_H);
  const integerScale = Math.floor(fitScale);

  if (!isTouchLayout && integerScale >= 1) {
    canvas.style.width = `${VIEW_W * integerScale}px`;
    canvas.style.height = `${VIEW_H * integerScale}px`;
    return;
  }

  canvas.style.width = `${Math.floor(VIEW_W * fitScale)}px`;
  canvas.style.height = `${Math.floor(VIEW_H * fitScale)}px`;
}

resizeCanvasToCrispScale();
collapseMobileBrowserChrome();
window.addEventListener('resize', resizeCanvasToCrispScale);
window.visualViewport?.addEventListener('resize', resizeCanvasToCrispScale);
window.visualViewport?.addEventListener('scroll', resizeCanvasToCrispScale);
coarsePointerQuery?.addEventListener?.('change', resizeCanvasToCrispScale);
document.addEventListener('fullscreenchange', resizeCanvasToCrispScale);
window.addEventListener('orientationchange', () => {
  window.setTimeout(() => {
    collapseMobileBrowserChrome();
    resizeCanvasToCrispScale();
  }, 250);
});
document.addEventListener('pointerup', collapseMobileBrowserChrome, { passive: true });

async function toggleFullscreen() {
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }
  if (document.body.classList.contains('fullscreen-fallback')) {
    document.body.classList.remove('fullscreen-fallback');
    resizeCanvasToCrispScale();
    return;
  }
  const target = gameWrap || canvas;
  if (!target?.requestFullscreen) {
    document.body.classList.add('fullscreen-fallback');
    collapseMobileBrowserChrome();
    resizeCanvasToCrispScale();
    return;
  }
  try {
    await target.requestFullscreen();
  } catch (error) {
    document.body.classList.add('fullscreen-fallback');
    collapseMobileBrowserChrome();
    resizeCanvasToCrispScale();
    throw error;
  }
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
