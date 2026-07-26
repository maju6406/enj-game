export const TILE = 16;
export const VIEW_W = 384;
export const VIEW_H = 240;
export const GRID_H = 15;
export const START_LIVES = 3;
export const GAMEPLAY_ZOOM = 1.5;
export const CAMERA = {
  followLerpX: 0.12,
  followLerpY: 0.1,
  deadzoneWidth: 56,
  deadzoneHeight: 48,
};
export const HERO_DISPLAY = {
  title: 58,
  gameplay: 39,
  powered: 50,
  select: 76,
  win: 74,
};

export const HEROES = [
  { id: 'jack', name: 'JACK', tagline: 'BRAVE EXPLORER' },
  { id: 'evee', name: 'EVEE', tagline: 'CRYPTID SLEUTH' },
  { id: 'curtis', name: 'CURTIS', tagline: 'RELIC HUNTER' },
  { id: 'toby', name: 'TOBY', tagline: 'TRAIL SCOUT' },
];

export const HERO_SOURCES = [
  { key: 'characters-source', path: 'assets/characters-source.png', heroIds: ['jack', 'evee'] },
  { key: 'curtis-toby-source', path: 'assets/curtis-toby-source.png', heroIds: ['curtis', 'toby'] },
];

export const SOLID = new Set(['#', 'B', '?', 'U', '[', ']', '{', '}', '=', 'X', 'D']);
export const HAZARD = new Set(['^', 'v']);

export const PHYSICS = {
  gravity: 600,
  maxRun: 100,
  groundAcceleration: 850,
  airAcceleration: 480,
  groundDrag: 700,
  airDrag: 60,
  jumpVelocity: -350,
  jumpCutMultiplier: 0.55,
  jumpBufferMs: 120,
  coyoteTimeMs: 100,
  enemySpeed: 40,
  powerupSpeed: 42,
  shellSpeed: 120,
  stompBounce: -144,
  hurtKnockX: 90,
  hurtKnockY: -170,
};

export const SCORE = {
  relic: 100,
  shinyRelic: 500,
  brickCache: 300,
  enemy: 200,
  item: 1000,
  levelComplete: 1000,
  bossDefeat: 3000,
};
