export const TILE = 16;
export const VIEW_W = 384;
export const VIEW_H = 240;
export const GRID_H = 15;
export const START_LIVES = 3;
export const HERO_DISPLAY = {
  title: 58,
  gameplay: 58,
  powered: 74,
  select: 92,
  win: 74,
};

export const SOLID = new Set(['#', 'B', '?', 'U', '[', ']', '{', '}', '=', 'X', 'D']);
export const HAZARD = new Set(['^', 'v']);

export const PHYSICS = {
  gravity: 760,
  runAccel: 38,
  friction: 34,
  maxRun: 196,
  jumpVelocity: -300,
  jumpCutMultiplier: 0.5,
  coyoteMs: 100,
  jumpBufferMs: 100,
  stompBounce: -250,
  stompBounceHeld: -285,
  hurtKnockX: 150,
  hurtKnockY: -210,
};
