let audioCtx = null;

function ctx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

export function sfx(type) {
  const ac = ctx();
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const table = {
    jump: [520, 760, 0.12],
    coin: [980, 1320, 0.10],
    stomp: [180, 90, 0.12],
    power: [420, 980, 0.24],
    hurt: [220, 120, 0.18],
    die: [180, 70, 0.35],
    flag: [620, 1040, 0.35],
    win: [520, 1240, 0.55],
    select: [360, 620, 0.09],
  };
  const [a, b, len] = table[type] || table.coin;
  osc.type = type === 'hurt' || type === 'die' ? 'square' : 'triangle';
  osc.frequency.setValueAtTime(a, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(40, b), now + len);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + len);
  osc.connect(gain).connect(ac.destination);
  osc.start(now);
  osc.stop(now + len + 0.02);
}

export function unlockSfx() { ctx(); }
