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
  gravity: 760,
  runAccel: 30,
  friction: 30,
  maxRun: 142,
  jumpVelocity: -300,
  jumpCutMultiplier: 0.5,
  coyoteMs: 100,
  jumpBufferMs: 100,
  stompBounce: -250,
  stompBounceHeld: -285,
  hurtKnockX: 120,
  hurtKnockY: -210,
};
