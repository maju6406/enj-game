// Keyboard input: tracks held keys and per-frame "pressed" edges.
(function () {
  const ACTIONS = {
    left:  ['ArrowLeft', 'KeyA'],
    right: ['ArrowRight', 'KeyD'],
    up:    ['ArrowUp', 'KeyW'],
    down:  ['ArrowDown', 'KeyS'],
    jump:  ['ArrowUp', 'KeyW', 'Space', 'KeyZ'],
    confirm: ['Enter', 'Space', 'KeyZ'],
    back:  ['Escape'],
  };

  const held = {};   // code -> bool
  const edge = {};   // code -> bool (pressed since last clear)

  function anyHeld(codes) { return codes.some((c) => held[c]); }
  function anyEdge(codes) { return codes.some((c) => edge[c]); }

  const Input = {
    init() {
      window.addEventListener('keydown', (e) => {
        if (e.repeat) { e.preventDefault(); return; }
        // prevent page scroll for game keys
        if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code)) {
          e.preventDefault();
        }
        if (!held[e.code]) edge[e.code] = true;
        held[e.code] = true;
        if (window.Audio2) window.Audio2.unlock();
      });
      window.addEventListener('keyup', (e) => { held[e.code] = false; });
      window.addEventListener('blur', () => { for (const k in held) held[k] = false; });
    },
    held(action)    { return anyHeld(ACTIONS[action] || []); },
    pressed(action) { return anyEdge(ACTIONS[action] || []); },
    get anyPressed() { return Object.keys(edge).some((k) => edge[k]); },
    clearEdges() { for (const k in edge) edge[k] = false; },
  };

  window.Input = Input;
})();
