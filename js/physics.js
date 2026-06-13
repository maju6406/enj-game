// Physics + tile collision helpers shared by player and enemies.
(function () {
  const SOLID = new Set(['#', 'B', '?', 'U', '[', ']', '{', '}', '=', 'X', 'D', 'L', 'O']);
  const HAZARD = new Set(['^', 'v']); // ^ spikes, v lava

  const Physics = {
    GRAVITY: 0.5,
    MAX_FALL: 9,
    WALK_ACCEL: 0.32,
    RUN_ACCEL: 0.45,
    FRICTION: 0.28,
    MAX_WALK: 1.8,
    MAX_RUN: 3.0,
    JUMP_VEL: -8.3,
    JUMP_HOLD_GRAV: 0.24, // reduced gravity while jump held & rising

    solid(code) { return SOLID.has(code); },
    hazard(code) { return HAZARD.has(code); },

    // Tile char at tile coords. Out-of-bounds: left wall solid, others air.
    tile(level, tx, ty) {
      if (tx < 0) return '#';
      if (ty < 0 || ty >= level.height || tx >= level.width) return ' ';
      const row = level.tiles[ty];
      return row[tx] || ' ';
    },

    // Resolve horizontal movement. Returns true if hit a wall.
    moveX(e, level) {
      e.x += e.vx;
      const top = Math.floor(e.y / TILE);
      const bottom = Math.floor((e.y + e.h - 1) / TILE);
      let hit = false;
      if (e.vx > 0) {
        const tx = Math.floor((e.x + e.w - 1) / TILE);
        for (let ty = top; ty <= bottom; ty++) {
          if (this.solid(this.tile(level, tx, ty))) {
            e.x = tx * TILE - e.w; e.vx = 0; hit = true; break;
          }
        }
      } else if (e.vx < 0) {
        const tx = Math.floor(e.x / TILE);
        for (let ty = top; ty <= bottom; ty++) {
          if (this.solid(this.tile(level, tx, ty))) {
            e.x = (tx + 1) * TILE; e.vx = 0; hit = true; break;
          }
        }
      }
      return hit;
    },

    // Resolve vertical movement. Returns {landed, bumped:[[tx,ty,code]]}.
    moveY(e, level) {
      e.y += e.vy;
      const left = Math.floor(e.x / TILE);
      const right = Math.floor((e.x + e.w - 1) / TILE);
      let landed = false;
      const bumped = [];
      if (e.vy > 0) {
        const ty = Math.floor((e.y + e.h - 1) / TILE);
        for (let tx = left; tx <= right; tx++) {
          if (this.solid(this.tile(level, tx, ty))) {
            e.y = ty * TILE - e.h; e.vy = 0; landed = true; break;
          }
        }
      } else if (e.vy < 0) {
        const ty = Math.floor(e.y / TILE);
        for (let tx = left; tx <= right; tx++) {
          const code = this.tile(level, tx, ty);
          if (this.solid(code)) {
            bumped.push([tx, ty, code]);
            e.y = (ty + 1) * TILE; e.vy = 0; break;
          }
        }
      }
      e.onGround = landed;
      return { landed, bumped };
    },

    // True if entity overlaps any hazard tile.
    touchesHazard(e, level) {
      const x0 = Math.floor((e.x + 2) / TILE), x1 = Math.floor((e.x + e.w - 3) / TILE);
      const y0 = Math.floor(e.y / TILE), y1 = Math.floor((e.y + e.h - 1) / TILE);
      for (let ty = y0; ty <= y1; ty++)
        for (let tx = x0; tx <= x1; tx++)
          if (this.hazard(this.tile(level, tx, ty))) return true;
      return false;
    },

    // Is there ground in the tile just below this point? (enemy ledge check)
    groundBelow(level, px, py) {
      return this.solid(this.tile(level, Math.floor(px / TILE), Math.floor(py / TILE)));
    },
  };

  // AABB overlap test for two entities {x,y,w,h}.
  Physics.overlap = function (a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  };

  window.Physics = Physics;
})();
