import * as Phaser from 'phaser';
import { VIEW_H, VIEW_W } from '../data/constants.js';
import { sfx, unlockSfx } from '../systems/sfx.js';

function text(scene, value, x, y, size = 18, color = '#ffffff') {
  return scene.add.text(x, y, value, {
    fontFamily: 'Courier New, monospace',
    fontSize: `${size}px`,
    color,
    stroke: '#101020',
    strokeThickness: 3,
  }).setOrigin(0.5).setResolution(1);
}

export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }
  create() {
    this.cameras.main.setBackgroundColor('#5c94fc');
    this.add.rectangle(VIEW_W / 2, VIEW_H - 18, VIEW_W, 36, 0x6b4a23);
    this.add.rectangle(VIEW_W / 2, VIEW_H - 40, VIEW_W, 12, 0x58a840);
    this.add.image(88, VIEW_H - 40, 'hero-jack').setOrigin(0.5, 1).setDisplaySize(30, 52);
    this.add.image(VIEW_W - 88, VIEW_H - 40, 'hero-evee').setOrigin(0.5, 1).setDisplaySize(30, 52).setFlipX(true);
    text(this, 'CRYPTID', VIEW_W / 2, 58, 34, '#ffd34d');
    text(this, 'QUEST', VIEW_W / 2, 98, 34, '#ff8a3a');
    text(this, 'JACK & EVEE', VIEW_W / 2, 139, 11, '#fff2c0');
    const prompt = text(this, 'PRESS ENTER', VIEW_W / 2, 172, 16);
    this.tweens.add({ targets: prompt, alpha: 0.25, yoyo: true, repeat: -1, duration: 600 });
    const start = () => { unlockSfx(); sfx('select'); this.scene.start('Select'); };
    this.input.keyboard.once('keydown-ENTER', start);
    this.input.keyboard.once('keydown-SPACE', start);
    this.input.keyboard.once('keydown-UP', start);
  }
}

export class SelectScene extends Phaser.Scene {
  constructor() { super('Select'); }
  create() {
    this.pick = 0;
    this.cameras.main.setBackgroundColor('#1c244a');
    text(this, 'CHOOSE YOUR HERO', VIEW_W / 2, 28, 18, '#ffe060');
    this.cards = [
      this.add.rectangle(112, 118, 112, 138, 0x203050).setStrokeStyle(2, 0xffffff),
      this.add.rectangle(272, 118, 112, 138, 0x203050).setStrokeStyle(2, 0x505060),
    ];
    this.add.image(112, 145, 'hero-jack').setOrigin(0.5, 1).setDisplaySize(48, 86);
    this.add.image(272, 145, 'hero-evee').setOrigin(0.5, 1).setDisplaySize(48, 86);
    text(this, 'JACK', 112, 174, 14, '#ffffff');
    text(this, 'EVEE', 272, 174, 14, '#ffffff');
    text(this, 'LEFT / RIGHT  ENTER', VIEW_W / 2, 214, 10, '#b9b9d6');
    this.input.keyboard.on('keydown-LEFT', () => this.setPick(0));
    this.input.keyboard.on('keydown-RIGHT', () => this.setPick(1));
    this.input.keyboard.on('keydown-ENTER', () => this.start());
    this.input.keyboard.on('keydown-SPACE', () => this.start());
  }
  setPick(i) {
    if (this.pick !== i) sfx('select');
    this.pick = i;
    this.cards[0].setStrokeStyle(2, i === 0 ? 0xffffff : 0x505060);
    this.cards[1].setStrokeStyle(2, i === 1 ? 0xffffff : 0x505060);
  }
  start() {
    unlockSfx();
    sfx('power');
    this.scene.start('Level', { who: this.pick === 0 ? 'jack' : 'evee', levelIndex: 0, lives: 3, relics: 0, score: 0 });
  }
}

export class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }
  create(data) {
    this.cameras.main.setBackgroundColor('#0b0b16');
    text(this, 'GAME OVER', VIEW_W / 2, 92, 28, '#ff6a6a');
    text(this, `SCORE ${data.score || 0}`, VIEW_W / 2, 128, 12, '#ffffff');
    text(this, 'PRESS ENTER', VIEW_W / 2, 170, 14, '#ffe060');
    this.input.keyboard.once('keydown-ENTER', () => { sfx('select'); this.scene.start('Title'); });
  }
}

export class WinScene extends Phaser.Scene {
  constructor() { super('Win'); }
  create(data) {
    this.cameras.main.setBackgroundColor('#5c94fc');
    this.add.rectangle(VIEW_W / 2, VIEW_H - 18, VIEW_W, 36, 0x6b4a23);
    this.add.image(154, VIEW_H - 40, `hero-${data.who || 'jack'}`).setOrigin(0.5, 1).setDisplaySize(38, 68);
    this.add.image(230, VIEW_H - 40, data.who === 'evee' ? 'hero-jack' : 'hero-evee').setOrigin(0.5, 1).setDisplaySize(38, 68).setFlipX(true);
    text(this, 'CRYPTIDS CATALOGED!', VIEW_W / 2, 54, 18, '#ffe060');
    text(this, `FINAL SCORE ${data.score || 0}`, VIEW_W / 2, 96, 12, '#ffffff');
    text(this, 'PRESS ENTER', VIEW_W / 2, 168, 14, '#ffffff');
    sfx('win');
    this.input.keyboard.once('keydown-ENTER', () => { sfx('select'); this.scene.start('Title'); });
  }
}
