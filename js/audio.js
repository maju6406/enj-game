// Minimal WebAudio sound effects + tiny music blips. No external files.
(function () {
  let ctx = null;
  let master = null;
  let unlocked = false;

  function ensure() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
  }

  // Play a tone. type: waveform, f0->f1 frequency glide, dur seconds.
  function tone(f0, f1, dur, type, vol) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(f0, t);
    o.frequency.linearRampToValueAtTime(f1 == null ? f0 : f1, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol == null ? 0.6 : vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function seq(notes) { // notes: [[f,dur,delay],...]
    if (!ctx) return;
    let acc = 0;
    for (const [f, dur, gap] of notes) {
      setTimeout(() => tone(f, f, dur, 'square', 0.5), acc * 1000);
      acc += (gap == null ? dur : gap);
    }
  }

  const Audio2 = {
    unlock() {
      if (unlocked) return;
      ensure();
      if (ctx && ctx.state === 'suspended') ctx.resume();
      unlocked = true;
    },
    jump()  { tone(420, 760, 0.16, 'square', 0.4); },
    coin()  { tone(988, 1319, 0.10, 'square', 0.4); },
    stomp() { tone(300, 90, 0.12, 'square', 0.5); },
    bump()  { tone(160, 120, 0.07, 'square', 0.4); },
    power() { seq([[523,0.08],[659,0.08],[784,0.08],[1047,0.14]]); },
    shrink(){ seq([[700,0.07],[500,0.07],[350,0.12]]); },
    hurt()  { tone(380, 120, 0.3, 'sawtooth', 0.5); },
    die()   { seq([[523,0.12],[392,0.12],[330,0.12],[262,0.28]]); },
    kick()  { tone(220, 520, 0.08, 'square', 0.4); },
    flag()  { seq([[392,0.1],[523,0.1],[659,0.1],[784,0.1],[1047,0.2]]); },
    bossHit(){ tone(140, 60, 0.18, 'sawtooth', 0.6); },
    win()   { seq([[523,0.14],[659,0.14],[784,0.14],[1047,0.16],[784,0.1],[1047,0.3]]); },
    select(){ tone(660, 880, 0.07, 'square', 0.35); },
    start() { seq([[523,0.1],[659,0.1],[784,0.18]]); },
  };

  window.Audio2 = Audio2;
})();
