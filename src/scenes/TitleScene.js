import * as Phaser from 'phaser';
import { HERO_DISPLAY, VIEW_H, VIEW_W } from '../data/constants.js';
import { sfx, unlockSfx } from '../systems/sfx.js';
import { loopBob, loopPulse, loopWobble, rememberBase } from '../ui/animationUi.js';
import { menuPanel, menuPrompt, menuText as text, pulse, tapRipple, tapZone } from '../ui/menuUi.js';

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

function scheduleAttract(scene, nextScene, data = {}) {
  scene.time.addEvent({
    delay: 20000,
    callback: () => scene.scene.start(nextScene, data),
  });
}

function addTitleScenery(scene) {
  scene.add.image(58, 48, 'scenery-cloud')
    .setScale(0.72)
    .setAlpha(0.78)
    .setDepth(-30);
  scene.add.image(304, 36, 'scenery-cloud')
    .setScale(0.88)
    .setAlpha(0.72)
    .setDepth(-30);
  scene.add.image(190, VIEW_H - 70, 'scenery-ridge')
    .setOrigin(0.5, 1)
    .setScale(1.55, 1.05)
    .setAlpha(0.42)
    .setDepth(-28);
  scene.add.image(314, VIEW_H - 45, 'scenery-hills')
    .setOrigin(0.5, 1)
    .setScale(0.95)
    .setAlpha(0.55)
    .setDepth(-26);
  scene.add.image(198, VIEW_H - 40, 'scenery-castle')
    .setOrigin(0.5, 1)
    .setScale(0.88)
    .setAlpha(0.78)
    .setDepth(-12);
}

export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }
  create() {
    this.cameras.main.setBackgroundColor('#5c94fc');
    addTitleScenery(this);
    this.add.rectangle(VIEW_W / 2, VIEW_H - 18, VIEW_W, 36, 0x6b4a23);
    this.add.rectangle(VIEW_W / 2, VIEW_H - 40, VIEW_W, 12, 0x58a840);
    const jack = hero(this, 'jack', 88, VIEW_H - 40, HERO_DISPLAY.title);
    const evee = hero(this, 'evee', VIEW_W - 88, VIEW_H - 40, HERO_DISPLAY.title, true);
    loopBob(this, jack, 3, 920);
    loopBob(this, evee, 3, 940, { delay: 180 });
    loopWobble(this, [jack, evee], 1.5, 1180);
    const logo = [
      text(this, 'CRYPTID', VIEW_W / 2, 58, 34, '#ffd34d'),
      text(this, 'QUEST', VIEW_W / 2, 98, 34, '#ff8a3a'),
    ];
    text(this, 'JACK & EVEE', VIEW_W / 2, 139, 11, '#fff2c0');
    menuPrompt(this, 'PRESS ENTER / TAP', VIEW_W / 2, 172, 13);
    menuPanel(this, VIEW_W / 2, 200, 168, 8, { fill: 0x101020, alpha: 0.55, stroke: 0xffffff, strokeWidth: 1 });
    const countdownFill = this.add.rectangle(VIEW_W / 2 - 82, 200, 164, 4, 0xffd34d).setOrigin(0, 0.5);
    this.tweens.add({ targets: logo, y: '+=2', duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
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
        countdownFill.displayWidth = Math.max(0, Math.round(164 * (remaining / 30)));
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

    menuPanel(this, 119, 124, 112, 136, { stroke: 0xffffff });
    menuPanel(this, 265, 124, 112, 136, { stroke: 0xffffff });
    const jack = hero(this, 'jack', 119, 156, 92);
    const evee = hero(this, 'evee', 265, 156, 92);
    text(this, 'JACK', 119, 183, 11);
    text(this, 'EVEE', 265, 183, 11);
    text(this, 'BRAVE EXPLORER', 119, 199, 6, '#fff2c0');
    text(this, 'CRYPTID SLEUTH', 265, 199, 6, '#fff2c0');
    pulse(this, [jack, evee], 1.03, 720);
    loopWobble(this, jack, 1.2, 920);
    loopWobble(this, evee, -1.2, 880);

    menuPrompt(this, this.isAttract ? 'PRESS ENTER / TAP TO PLAY' : 'PRESS ENTER / TAP TO CHOOSE', VIEW_W / 2, 225, 8);

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
      scheduleAttract(this, 'Cryptids', { attract: true });
    }
  }
}

export class CryptidsScene extends Phaser.Scene {
  constructor() { super('Cryptids'); }

  create(data = {}) {
    this.cameras.main.setBackgroundColor('#101020');
    this.add.rectangle(VIEW_W / 2, VIEW_H - 18, VIEW_W, 36, 0x6b4a23);
    this.add.rectangle(VIEW_W / 2, VIEW_H - 40, VIEW_W, 12, 0x58a840);

    text(this, 'CRYPTID FIELD GUIDE', VIEW_W / 2, 18, 13, '#ffd34d');

    const cryptids = [
      ['enemy-grunt', 'GRUNT', 105, 75, 32],
      ['enemy-chupacabra', 'CHUPA', 279, 75, 32],
      ['enemy-mothman', 'MOTHMAN', 105, 157, 36],
      ['enemy-boss', 'BIGFOOT', 279, 157, 43],
    ];

    for (const [key, name, x, cardY, height] of cryptids) {
      menuPanel(this, x, cardY, 126, 70);
      const img = sprite(this, key, x, cardY + 12, height);
      text(this, name, x, cardY + 24, name.length > 6 ? 7 : 8, '#ffffff');
      loopBob(this, img, key === 'enemy-mothman' ? 2 : 1, key === 'enemy-chupacabra' ? 420 : 760, { delay: x });
      loopWobble(this, img, key === 'enemy-boss' ? 1 : 2, key === 'enemy-chupacabra' ? 360 : 840, { delay: cardY });
      if (key === 'enemy-mothman') loopPulse(this, img, 1.04, 320);
    }

    menuPrompt(this, 'PRESS ENTER / TAP TO PLAY', VIEW_W / 2, 230, 8);

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
      scheduleAttract(this, 'Powerups', { attract: true });
    }
  }
}

export class PowerupsScene extends Phaser.Scene {
  constructor() { super('Powerups'); }

  create(data = {}) {
    this.cameras.main.setBackgroundColor('#101020');
    this.add.rectangle(VIEW_W / 2, VIEW_H - 18, VIEW_W, 36, 0x6b4a23);
    this.add.rectangle(VIEW_W / 2, VIEW_H - 40, VIEW_W, 12, 0x58a840);

    text(this, 'POWER UPS', VIEW_W / 2, 18, 18, '#ffd34d');

    const powerups = [
      ['tile-question', 'POWER BLOCK', 'BUMP FOR SURPRISES', 105, 76, 34],
      ['journal', 'JOURNAL', 'GROW AND TAKE A HIT', 279, 76, 32],
      ['relic', 'RELIC', '100 EARNS A LIFE', 105, 157, 28],
      ['heart', 'LIFE HEART', 'TRACKS 3 CHANCES', 279, 157, 26],
    ];

    for (const [key, name, desc, x, cardY, height] of powerups) {
      menuPanel(this, x, cardY, 126, 74);
      const img = sprite(this, key, x, cardY + 4, height);
      text(this, name, x, cardY + 21, name.length > 8 ? 6 : 8, '#ffffff');
      text(this, desc, x, cardY + 30, 6, '#fff2c0');
      loopBob(this, img, 2, key === 'relic' ? 520 : 680, { delay: x });
      loopPulse(this, img, key === 'heart' ? 1.12 : 1.06, key === 'tile-question' ? 520 : 740);
      if (key === 'relic' || key === 'journal') loopWobble(this, img, 5, key === 'relic' ? 460 : 620);
    }

    menuPrompt(this, 'PRESS ENTER / TAP TO PLAY', VIEW_W / 2, 230, 8);

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
      scheduleAttract(this, 'Title');
    }
  }
}

export class SelectScene extends Phaser.Scene {
  constructor() { super('Select'); }
  create() {
    this.pick = 0;
    this.cameras.main.setBackgroundColor('#1c244a');
    text(this, 'CHOOSE YOUR HERO', VIEW_W / 2, 24, 17, '#ffe060');
    this.cards = [
      menuPanel(this, 112, 119, 122, 142, { stroke: 0xffffff }),
      menuPanel(this, 272, 119, 122, 142, { stroke: 0x505060 }),
    ];
    this.heroSprites = [
      hero(this, 'jack', 112, 143, HERO_DISPLAY.select),
      hero(this, 'evee', 272, 143, HERO_DISPLAY.select),
    ];
    this.heroSprites.forEach((entry, i) => {
      rememberBase(entry);
      loopBob(this, entry, i === 0 ? 2 : 3, i === 0 ? 720 : 680, { delay: i * 120 });
      loopWobble(this, entry, i === 0 ? 1.2 : -1.2, i === 0 ? 840 : 780);
    });
    text(this, 'JACK', 112, 171, 13, '#ffffff');
    text(this, 'EVEE', 272, 171, 13, '#ffffff');
    text(this, 'BRAVE EXPLORER', 112, 190, 6, '#fff2c0');
    text(this, 'CRYPTID SLEUTH', 272, 190, 6, '#fff2c0');
    menuPrompt(this, 'TAP HERO OR ENTER', VIEW_W / 2, 216, 9);
    this.input.keyboard.on('keydown-LEFT', () => this.setPick(0));
    this.input.keyboard.on('keydown-RIGHT', () => this.setPick(1));
    this.input.keyboard.on('keydown-ENTER', () => this.start());
    this.input.keyboard.on('keydown-SPACE', () => this.start());
    this.cards[0]
      .setInteractive({ useHandCursor: true })
      .on('pointerup', (pointer) => this.tapHero(0, pointer));
    this.cards[1]
      .setInteractive({ useHandCursor: true })
      .on('pointerup', (pointer) => this.tapHero(1, pointer));
    this.setPick(0, true);
  }
  setPick(i, silent = false) {
    if (this.pick !== i && !silent) sfx('select');
    this.pick = i;
    this.cards[0].setStrokeStyle(2, i === 0 ? 0xffffff : 0x505060);
    this.cards[1].setStrokeStyle(2, i === 1 ? 0xffffff : 0x505060);
    this.cards[0].setScale(i === 0 ? 1.04 : 1);
    this.cards[1].setScale(i === 1 ? 1.04 : 1);
    this.heroSprites[0].setTint(i === 0 ? 0xffffff : 0xb9b9d6);
    this.heroSprites[1].setTint(i === 1 ? 0xffffff : 0xb9b9d6);
  }
  tapHero(i, pointer) {
    tapRipple(this, pointer.worldX, pointer.worldY);
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
    const winner = hero(this, data.who || 'jack', 154, VIEW_H - 40, HERO_DISPLAY.win);
    const pal = hero(this, data.who === 'evee' ? 'jack' : 'evee', 230, VIEW_H - 40, HERO_DISPLAY.win, true);
    loopBob(this, winner, 4, 520);
    loopBob(this, pal, 3, 620, { delay: 140 });
    loopWobble(this, [winner, pal], 2, 700);
    text(this, 'CRYPTIDS CATALOGED!', VIEW_W / 2, 54, 18, '#ffe060');
    text(this, `FINAL SCORE ${data.score || 0}`, VIEW_W / 2, 96, 12, '#ffffff');
    text(this, 'PRESS ENTER', VIEW_W / 2, 168, 14, '#ffffff');
    sfx('win');
    this.input.keyboard.once('keydown-ENTER', () => { sfx('select'); this.scene.start('Title'); });
  }
}
