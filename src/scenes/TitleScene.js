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

function tapZone(scene, x, y, width, height, onTap) {
  return scene.add.zone(x, y, width, height)
    .setInteractive({ useHandCursor: true })
    .on('pointerup', onTap);
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
    const prompt = text(this, 'PRESS ENTER / TAP', VIEW_W / 2, 172, 13);
    const countdown = text(this, 'DEMO STARTS IN 30', VIEW_W / 2, 196, 7, '#fff2c0');
    this.tweens.add({ targets: prompt, alpha: 0.25, yoyo: true, repeat: -1, duration: 600 });
    let started = false;
    let remaining = 30;
    const start = () => {
      if (started) return;
      started = true;
      unlockSfx();
      sfx('select');
      this.scene.start('Select');
    };
    this.input.keyboard.once('keydown-ENTER', start);
    this.input.keyboard.once('keydown-SPACE', start);
    this.input.keyboard.once('keydown-UP', start);
    tapZone(this, VIEW_W / 2, VIEW_H / 2, VIEW_W, VIEW_H, start);
    this.time.addEvent({
      delay: 1000,
      repeat: 29,
      callback: () => {
        if (started) return;
        remaining -= 1;
        countdown.setText(`DEMO STARTS IN ${remaining}`);
      },
    });
    this.time.delayedCall(30000, () => {
      if (started) return;
      started = true;
      this.scene.start('Cast', { attract: true });
    });
  }
}

export class CastScene extends Phaser.Scene {
  constructor() { super('Cast'); }

  create(data = {}) {
    this.isAttract = !!data.attract;
    this.cameras.main.setBackgroundColor('#5c94fc');
    this.add.rectangle(VIEW_W / 2, VIEW_H - 18, VIEW_W, 36, 0x6b4a23);
    this.add.rectangle(VIEW_W / 2, VIEW_H - 40, VIEW_W, 12, 0x58a840);

    text(this, 'THE CAST', VIEW_W / 2, 25, 20, '#ffd34d');
    text(this, 'JACK & EVEE', VIEW_W / 2, 51, 10, '#fff2c0');

    this.add.rectangle(119, 124, 112, 136, 0x203050, 0.72).setStrokeStyle(2, 0xffffff);
    this.add.rectangle(265, 124, 112, 136, 0x203050, 0.72).setStrokeStyle(2, 0xffffff);
    hero(this, 'jack', 119, 156, 92);
    hero(this, 'evee', 265, 156, 92);
    text(this, 'JACK', 119, 183, 11);
    text(this, 'EVEE', 265, 183, 11);

    text(this, this.isAttract ? 'PRESS ENTER / TAP TO PLAY' : 'PRESS ENTER / TAP TO CHOOSE', VIEW_W / 2, 225, 8, '#ffe060');

    let advanced = false;
    const next = () => {
      if (advanced) return;
      advanced = true;
      unlockSfx();
      sfx('select');
      this.scene.start('Select');
    };
    this.input.keyboard.once('keydown-ENTER', next);
    this.input.keyboard.once('keydown-SPACE', next);
    this.input.keyboard.once('keydown-UP', next);
    tapZone(this, VIEW_W / 2, VIEW_H / 2, VIEW_W, VIEW_H, next);
    if (this.isAttract) {
      this.time.delayedCall(20000, () => {
        if (!advanced) this.scene.start('Cryptids', { attract: true });
      });
    }
  }
}

export class CryptidsScene extends Phaser.Scene {
  constructor() { super('Cryptids'); }

  create(data = {}) {
    this.cameras.main.setBackgroundColor('#101020');
    this.add.rectangle(VIEW_W / 2, VIEW_H - 18, VIEW_W, 36, 0x6b4a23);
    this.add.rectangle(VIEW_W / 2, VIEW_H - 40, VIEW_W, 12, 0x58a840);

    text(this, 'CRYPTID FIELD GUIDE', VIEW_W / 2, 22, 14, '#ffd34d');

    const cryptids = [
      ['enemy-grunt', 'GRUNT', 105, 75, 78, 32],
      ['enemy-chupacabra', 'CHUPA', 279, 75, 78, 32],
      ['enemy-mothman', 'MOTHMAN', 105, 157, 158, 36],
      ['enemy-boss', 'BIGFOOT', 279, 157, 158, 43],
    ];

    for (const [key, name, x, cardY, footY, height] of cryptids) {
      this.add.rectangle(x, cardY, 112, 70, 0x203050, 0.76).setStrokeStyle(2, 0xd9f3ff);
      sprite(this, key, x, footY, height);
      text(this, name, x, cardY + 25, name.length > 6 ? 7 : 8, '#ffffff');
    }

    text(this, 'PRESS ENTER / TAP TO PLAY', VIEW_W / 2, 230, 8, '#ffe060');

    let advanced = false;
    const play = () => {
      if (advanced) return;
      advanced = true;
      unlockSfx();
      sfx('select');
      this.scene.start('Select');
    };
    this.input.keyboard.once('keydown-ENTER', play);
    this.input.keyboard.once('keydown-SPACE', play);
    this.input.keyboard.once('keydown-UP', play);
    tapZone(this, VIEW_W / 2, VIEW_H / 2, VIEW_W, VIEW_H, play);
    if (data.attract) {
      this.time.delayedCall(20000, () => {
        if (!advanced) this.scene.start('Powerups', { attract: true });
      });
    }
  }
}

export class PowerupsScene extends Phaser.Scene {
  constructor() { super('Powerups'); }

  create(data = {}) {
    this.cameras.main.setBackgroundColor('#101020');
    this.add.rectangle(VIEW_W / 2, VIEW_H - 18, VIEW_W, 36, 0x6b4a23);
    this.add.rectangle(VIEW_W / 2, VIEW_H - 40, VIEW_W, 12, 0x58a840);

    text(this, 'POWER UPS', VIEW_W / 2, 22, 18, '#ffd34d');

    const powerups = [
      ['tile-question', 'POWER BLOCK', 105, 75, 38],
      ['journal', 'JOURNAL', 279, 75, 34],
      ['relic', 'RELIC', 105, 157, 30],
      ['heart', 'LIFE HEART', 279, 157, 28],
    ];

    for (const [key, name, x, cardY, height] of powerups) {
      this.add.rectangle(x, cardY, 112, 70, 0x203050, 0.76).setStrokeStyle(2, 0xd9f3ff);
      sprite(this, key, x, cardY + 7, height);
      text(this, name, x, cardY + 25, name.length > 8 ? 6 : 8, '#ffffff');
    }

    text(this, 'PRESS ENTER / TAP TO PLAY', VIEW_W / 2, 230, 8, '#ffe060');

    let advanced = false;
    const play = () => {
      if (advanced) return;
      advanced = true;
      unlockSfx();
      sfx('select');
      this.scene.start('Select');
    };
    this.input.keyboard.once('keydown-ENTER', play);
    this.input.keyboard.once('keydown-SPACE', play);
    this.input.keyboard.once('keydown-UP', play);
    tapZone(this, VIEW_W / 2, VIEW_H / 2, VIEW_W, VIEW_H, play);
    if (data.attract) {
      this.time.delayedCall(20000, () => {
        if (!advanced) this.scene.start('Title');
      });
    }
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
    text(this, 'TAP HERO OR ENTER', VIEW_W / 2, 214, 10, '#b9b9d6');
    this.input.keyboard.on('keydown-LEFT', () => this.setPick(0));
    this.input.keyboard.on('keydown-RIGHT', () => this.setPick(1));
    this.input.keyboard.on('keydown-ENTER', () => this.start());
    this.input.keyboard.on('keydown-SPACE', () => this.start());
    this.cards[0]
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.tapHero(0));
    this.cards[1]
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => this.tapHero(1));
  }
  setPick(i) {
    if (this.pick !== i) sfx('select');
    this.pick = i;
    this.cards[0].setStrokeStyle(2, i === 0 ? 0xffffff : 0x505060);
    this.cards[1].setStrokeStyle(2, i === 1 ? 0xffffff : 0x505060);
  }
  tapHero(i) {
    this.setPick(i);
    this.start();
  }
  start() {
    if (this.started) return;
    this.started = true;
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
