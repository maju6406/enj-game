import * as Phaser from 'phaser';
import { extractHeroTextures, fallbackHeroTextures, generateTextures } from '../art/textureFactory.js';
import { HERO_SOURCES } from '../data/constants.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    for (const source of HERO_SOURCES) this.load.image(source.key, source.path);
  }
  create() {
    for (const source of HERO_SOURCES) {
      try {
        extractHeroTextures(this, source.key, source.heroIds);
      } catch (e) {
        console.warn(`${source.key} texture extraction failed; using fallback sprites`, e);
        fallbackHeroTextures(this, source.heroIds);
      }
    }
    generateTextures(this);
    const go = new URLSearchParams(location.search).get('go');
    if (/^play[1-4]$/.test(go || '')) {
      this.scene.start('Level', { who: 'jack', levelIndex: Number(go.slice(4)) - 1, lives: 3, relics: 0, score: 0 });
    } else if (go === 'select') {
      this.scene.start('Select');
    } else if (go === 'cast') {
      this.scene.start('Cast');
    } else if (go === 'cryptids') {
      this.scene.start('Cryptids');
    } else if (go === 'powerups') {
      this.scene.start('Powerups');
    } else if (go === 'demo') {
      this.scene.start('Cast', { attract: true });
    } else if (go === 'win') {
      this.scene.start('Win', { who: 'evee', score: 12000 });
    } else {
      this.scene.start('Title');
    }
  }
}
