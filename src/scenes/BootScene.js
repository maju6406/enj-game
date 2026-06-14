import * as Phaser from 'phaser';
import { extractHeroTextures, fallbackHeroTextures, generateTextures } from '../art/textureFactory.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() { this.load.image('characters-source', 'assets/characters-source.png'); }
  create() {
    try {
      extractHeroTextures(this);
    } catch (e) {
      console.warn('hero texture extraction failed; using fallback sprites', e);
      fallbackHeroTextures(this);
    }
    generateTextures(this);
    const go = new URLSearchParams(location.search).get('go');
    if (/^play[1-4]$/.test(go || '')) {
      this.scene.start('Level', { who: 'jack', levelIndex: Number(go.slice(4)) - 1, lives: 3, relics: 0, score: 0 });
    } else if (go === 'select') {
      this.scene.start('Select');
    } else if (go === 'cast') {
      this.scene.start('Cast');
    } else if (go === 'win') {
      this.scene.start('Win', { who: 'evee', score: 12000 });
    } else {
      this.scene.start('Title');
    }
  }
}
