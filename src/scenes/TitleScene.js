import * as Phaser from 'phaser';
import { HERO_DISPLAY, VIEW_H, VIEW_W } from '../data/constants.js';
import { sfx, unlockSfx } from '../systems/sfx.js';
import { uiTextStyle } from '../ui/textStyle.js';

function text(scene, value, x, y, size = 18, color = '#ffffff') {
  return scene.add.text(x, y, value, uiTextStyle(size, color, 3)).setOrigin(0.5).setResolution(1);
}

function hero(scene, who, x, footY, height, flip = false) {
  const key = `hero-${who}`;
  const img = scene.textures.get(key).getSourceImage();
  return scene.add.image(x, footY, key)
    .setOrigin(0.5, 1)
    .setDisplaySize(Math.round(height * (img.width / img.height)), height)
    .setFlipX(flip);
}

function sprite(scene, key, x, footY, height, flip = false) {
  const img = scene.textures.get(key).getSourceImage();
  return scene.add.image(x, footY, key)
    .setOrigin(0.5, 1)
    .setDisplaySize(Math.round(height * (img.width / img.height)), height)
    .setFlipX(flip);
}

export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }
  create() {
    this.cameras.main.setBackgroundColor('#5c94fc');
    this.add.rectangle(VIEW_W / 2, VIEW_H - 18, VIEW_W, 36, 0x6b4a23);
    this.add.rectangle(VIEW_W / 2, VIEW_H - 40, VIEW_W, 12, 0x58a840);
    hero(this, 'jack', 88, VIEW_H - 40, HERO_DISPLAY.title);
    hero(this, 'evee', VIEW_W - 88, VIEW_H - 40, HERO_DISPLAY.title, true);
    text(this, 'CRYPTID', VIEW_W / 2, 58, 34, '#ffd34d');
    text(this, 'QUEST', VIEW_W / 2, 98, 34, '#ff8a3a');
    text(this, 'JACK & EVEE', VIEW_W / 2, 139, 11, '#fff2c0');
    const prompt = text(this, 'PRESS ENTER', VIEW_W / 2, 172, 16);
    this.tweens.add({ targets: prompt, alpha: 0.25, yoyo: true, repeat: -1, duration: 600 });
    const start = () => { unlockSfx(); sfx('select'); this.scene.start('Cast'); };
    this.input.keyboard.once('keydown-ENTER', start);
    this.input.keyboard.once('keydown-SPACE', start);
    this.input.keyboard.once('keydown-UP', start);
  }
}

export class CastScene extends Phaser.Scene {
  constructor() { super('Cast'); }

  create() {
    this.cameras.main.setBackgroundColor('#5c94fc');
    this.add.rectangle(VIEW_W / 2, VIEW_H - 18, VIEW_W, 36, 0x6b4a23);
    this.add.rectangle(VIEW_W / 2, VIEW_H - 40, VIEW_W, 12, 0x58a840);

    text(this, 'THE CAST', VIEW_W / 2, 21, 18, '#ffd34d');
    text(this, 'HEROES', 68, 47, 8, '#fff2c0');
    text(this, 'CRYPTIDS', 291, 47, 8, '#fff2c0');

    this.add.rectangle(66, 98, 92, 96, 0x203050, 0.72).setStrokeStyle(2, 0xffffff);
    this.add.rectangle(166, 98, 92, 96, 0x203050, 0.72).setStrokeStyle(2, 0xffffff);
    hero(this, 'jack', 66, 119, 62);
    hero(this, 'evee', 166, 119, 62);
    text(this, 'JACK', 66, 139, 8);
    text(this, 'EVEE', 166, 139, 8);

    const cryptids = [
      ['enemy-grunt', 'GRUNT', 250, 105, 33],
      ['enemy-chupacabra', 'CHUPA', 330, 105, 32],
      ['enemy-mothman', 'MOTHMAN', 250, 181, 36],
      ['enemy-boss', 'BIGFOOT', 330, 181, 50],
    ];

    for (const [key, name, x, footY, height] of cryptids) {
      this.add.rectangle(x, footY - 24, 70, 58, 0x101020, 0.5).setStrokeStyle(1, 0xd9f3ff);
      sprite(this, key, x, footY, height);
      text(this, name, x, footY + 19, name.length > 6 ? 6 : 7, '#ffffff');
    }

    text(this, 'PRESS ENTER TO CHOOSE', VIEW_W / 2, 225, 8, '#ffe060');

    const next = () => { sfx('select'); this.scene.start('Select'); };
    this.input.keyboard.once('keydown-ENTER', next);
    this.input.keyboard.once('keydown-SPACE', next);
    this.input.keyboard.once('keydown-UP', next);
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
    hero(this, 'jack', 112, 145, HERO_DISPLAY.select);
    hero(this, 'evee', 272, 145, HERO_DISPLAY.select);
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
    text(this, 'PRESS ENTER / SPACE', VIEW_W / 2, 170, 14, '#ffe060');
    const restart = () => { sfx('select'); this.scene.start('Title'); };
    this.input.keyboard.once('keydown-ENTER', restart);
    this.input.keyboard.once('keydown-SPACE', restart);
    this.input.keyboard.once('keydown-UP', restart);
  }
}

export class WinScene extends Phaser.Scene {
  constructor() { super('Win'); }
  create(data) {
    this.cameras.main.setBackgroundColor('#5c94fc');
    this.add.rectangle(VIEW_W / 2, VIEW_H - 18, VIEW_W, 36, 0x6b4a23);
    hero(this, data.who || 'jack', 154, VIEW_H - 40, HERO_DISPLAY.win);
    hero(this, data.who === 'evee' ? 'jack' : 'evee', 230, VIEW_H - 40, HERO_DISPLAY.win, true);
    text(this, 'CRYPTIDS CATALOGED!', VIEW_W / 2, 54, 18, '#ffe060');
    text(this, `FINAL SCORE ${data.score || 0}`, VIEW_W / 2, 96, 12, '#ffffff');
    text(this, 'PRESS ENTER', VIEW_W / 2, 168, 14, '#ffffff');
    sfx('win');
    this.input.keyboard.once('keydown-ENTER', () => { sfx('select'); this.scene.start('Title'); });
  }
}
