export const TILE = 16;
export const VIEW_W = 384;
export const VIEW_H = 240;
export const GRID_H = 15;
export const START_LIVES = 3;
export const GAMEPLAY_ZOOM = 1.5;
export const HERO_DISPLAY = {
  title: 58,
  gameplay: 39,
  powered: 50,
  select: 92,
  win: 74,
};

export const SOLID = new Set(['#', 'B', '?', 'U', '[', ']', '{', '}', '=', 'X', 'D']);
export const HAZARD = new Set(['^', 'v']);

export const PHYSICS = {
  gravity: 600,
  maxRun: 100,
  jumpVelocity: -240,
  enemySpeed: 40,
  shellSpeed: 120,
  stompBounce: -144,
  hurtKnockX: 90,
  hurtKnockY: -170,
};

export const SCORE = {
  relic: 100,
  enemy: 200,
  item: 1000,
  levelComplete: 1000,
};
