/* =====================================================================
   PRISM CASCADE — future bass, 160 BPM, hand-charted.
   Every string divides one bar evenly, so its length sets the grid: 16 = sixteenths, 12 = triplet eighths,
   24 = triplet sixteenths, 32 = thirty-seconds.
     k  supersaw chord stabs ('x' hit, '-' sustain)      m  lead   p  piano pluck   hh  hats ('x' closed)
     c  chart layers: [source, positions(, width)] — one position per onset of that source ('.' skips it),
        so a chart note can only ever sit on a sound.   t  extra taps [step,pos] on drum hits
     h  holds [step,len,pos]   s  slides [step,[[dstep,pos]...]]   x  mirror the whole bar's chart
   ===================================================================== */
const PRISM = (() => {
  const HB = 'x...x...x...x...x...x...x.x.xxxx', HC = 'x..x..x..x..x..x..xxxxxx', DOT = 'x..x..x..x..x..x', TR12 = 'xxxxxxxxxxxx';
  const A = [ // stab phrase
    { d: 5, k: 'x..x..x...x.x...', m: '....a...e.....hg', c: [['k', '34543'], ['k', 'cbabc'], ['m', '7896', 2.4]] },
    { d: 6, k: 'x..x..x..x..x.x.x.x.x.x.', hh: HC, c: [['k', '34343c4b5a'], ['k', 'cbcb......']] },
    { d: 0, k: 'x.xx..x.x.xx..x.', m: '....e.......h...', c: [['k', '3c4b3c4b'], ['k', 'c...c...'], ['m', '87', 2.4]] },
    { d: 4, k: 'x...x...x.x.xxxx', hh: HB, c: [['k', '345a4b3c'], ['k', 'cb......']] },
  ];
  const A2 = [ // same music, lopsided doubles
    { d: 5, k: 'x..x..x...x.x...', m: '....a...e.....hg', c: [['k', '65456'], ['k', '9abc9'], ['m', '3c2d', 2.4]] },
    A[1], A[2],
    { d: 4, k: 'x...x...xxxxxxxx', hh: HB, c: [['k', '345a4b3c2d'], ['k', 'cb........']] },
  ];
  const B = [ // lead phrase with 32nd hat rolls, then 3-against-4
    { d: 5, k: 'x.......x.......', m: '..a.c.e...h.g.e.', hh: 'x.x.x.x.x.x.xxxxx.x.x.x.x.x.xxxx', c: [['k', '45', 4.5], ['k', 'cb', 4.5], ['m', '3b4c5d'], ['h', '.......b4........5c.', 2]] },
    { d: 6, k: 'x.......x.......', m: '..b.d.g...i.g.d.', hh: 'x.x.x.x.x.x.xxxxx.x.x.x.x.x.xxxx', x: 1, c: [['k', '45', 4.5], ['k', 'cb', 4.5], ['m', '3b4c5d'], ['h', '.......b4........5c.', 2]] },
    { d: 0, k: DOT, c: [['k', '345654']], t: [[0, 12], [4, 11], [8, 12], [12, 11]] },
    { d: 4, k: 'xxxxxxxxxxxx............', m: '........e.g.b.ig', c: [['k', '3c4b5a695a4b', 2.2], ['m', '3c4b5']] },
  ];
  const C = [ // harder stab phrase
    A2[0],
    { d: 6, k: 'x.x.x.x.x.x.x..x..x..x..', hh: HC, c: [['k', '3c4b5a3434'], ['k', '......cbcb']] },
    { d: 0, k: 'x.xx..x.x.xx..x.', m: '....e.......h...', c: [['k', 'c4b3c4b3'], ['k', '3...3...'], ['m', '98', 2.4]] },
    { d: 4, k: 'x.......x.......x...x...xxxxxxxx', c: [['k', '34345a5a696.', 2.2], ['k', 'cbcb........']] },
  ];
  const D = [ // shuffle + triplet-sixteenth rolls
    { d: 5, k: 'x.xx.xx.xx.x', c: [['k', '3c4b3c4b'], ['k', 'c.......']] },
    { d: 6, k: 'x.xx.xx.xxxx', c: [['k', 'c4b3c4b3c']] },
    { d: 0, k: 'x..x..xxxxxxx..x..xxxxxx', c: [['k', '3c4b4b4b4c3c3c3.', 2.2]] },
    { d: 4, k: 'x...x...x.x.xxxx', hh: HB, c: [['k', 'cb5a4b3c'], ['k', '34......']] },
  ];
  const mir = b => Object.assign({}, b, { x: b.x ? 0 : 1 });
  const bars = [
    // intro 0-7
    { sec: 'calm', d: 5, p: 'a.....e.....c...', c: [['p', '4b6']] }, { sec: 'calm', d: 6, p: 'b.....g.....d...', c: [['p', 'c4a']] },
    { sec: 'calm', d: 0, p: 'c...e...h.....e.', c: [['p', '3ad5']] }, { sec: 'calm', d: 4, p: 'g.....e...b.g.e.', c: [['p', 'c4a75']] },
    { sec: 'calm', d: 5, p: 'a.c.e.....h.e.c.', c: [['p', '35bd94']] }, { sec: 'calm', d: 6, p: 'b.d.g.....i.g.d.', c: [['p', 'c4b3a5']] },
    { sec: 'calm', d: 0, p: 'c.e.h.e.c.e.h.j.', c: [['p', '3b4c5d6e']] }, { sec: 'calm', d: 4, p: 'g...e...b.......', c: [['p', 'c4.']], h: [[8, 6, 7.5]], riser: 1 },
    // verse 8-15: half-time, plucks, hat rolls
    { sec: 'verse', d: 5, p: 'a..c..e.a..c..e.', c: [['p', '3b4c3b']] },
    { sec: 'verse', d: 6, p: 'b..d..g.b..d..g.', hh: HB, c: [['p', 'c4b3c4'], ['h', '......5b.b5c', 2]] },
    { sec: 'verse', d: 0, p: 'c..e..h.c..e..h.', c: [['p', '4a5b4c']], t: [[8, 3]] },
    { sec: 'verse', d: 4, p: 'g..e..b.g.e.b.g.', hh: HC, c: [['p', 'c4b3a4b'], ['h', '.......a5.5.', 2]] },
    { sec: 'verse', d: 5, p: 'a..c..e.a..c..e.', c: [['p', '.cb.43']], h: [[0, 6, 3], [8, 6, 12]] },
    { sec: 'verse', d: 6, p: 'b..d..g.b..d..g.', hh: HB, x: 1, c: [['p', 'c4b3c4'], ['h', '......5b.b5c', 2]] },
    { sec: 'verse', d: 0, p: 'c..e..h.c..e..h.', x: 1, c: [['p', '4a5b4c']], t: [[8, 3]] },
    { sec: 'verse', d: 4, p: 'g..e..b.g.e.b.g.', hh: HC, x: 1, c: [['p', 'c4b3a4b'], ['h', '.......a5.5.', 2]] },
    // build 16-23: the gate keeps changing subdivision
    { sec: 'build', d: 5, k: 'x...x...x...x...', c: [['k', '4343', 3.6], ['k', 'cbcb', 3.6]], riser: 7.6 },
    { sec: 'build', d: 6, k: 'x.x.x.x.x.x.x.x.', c: [['k', '3c4b5a69']] },
    { sec: 'build', d: 0, k: TR12, c: [['k', '3c4b5a4b3c4b']] },
    { sec: 'build', d: 4, k: 'x.x.x.x.xxxxxxxx', c: [['k', '3c3c4b5a4b5a']] },
    { sec: 'build', d: 5, k: 'x..x..x..x..x.x.', c: [['k', '3b4c5d'], ['k', 'c.....']] },
    { sec: 'build', d: 6, k: 'x..x..x..x..xxxxxxxxxxxx', c: [['k', '3c4b5a5a69694b4b', 2.2]] },
    { sec: 'build', d: 0, k: 'xxxxxxxxxxxxxxxx', c: [['k', '3c3c4b4b5a5a6969', 2.2]] },
    { sec: 'build', d: 4, k: 'x.x.x.x.x.x.x.x.xxxxxxxx........', gap: 1, c: [['k', '2d3c4b5a69697878', 2]] },
    // drop 1 24-39
    ...A.map((b, i) => Object.assign({ sec: 'drop', first: i === 0 }, b)), ...A.map(b => Object.assign({ sec: 'drop' }, mir(b))),
    ...B.map(b => Object.assign({ sec: 'drop' }, b)), ...A2.map(b => Object.assign({ sec: 'drop' }, b)),
    // break 40-47
    { sec: 'calm', d: 5, p: 'a...c...e...h...', crash: 1, c: [['p', '.cbd']], s: [[0, [[0, 3], [8, 7], [16, 3]]]] },
    { sec: 'calm', d: 6, p: 'b...d...g...i...', x: 1, c: [['p', '.cbd']], s: [[0, [[0, 3], [8, 7], [15, 3]]]] },
    { sec: 'calm', d: 0, p: 'c.e.h.e.c.e.', c: [['p', '3b4c5d']] },
    { sec: 'calm', d: 0, p: 'e.......a.......', s: [[0, [[0, 2], [8, 6], [14, 2]]], [0, [[0, 13], [8, 9], [14, 13]]]] },
    { sec: 'calm', d: 5, p: 'f.h.c.h.f.h.c.e.', hat: 1, c: [['p', '.b.d.c.d']], s: [[0, [[0, 2], [4, 5], [8, 2], [12, 5], [15, 3]]]] },
    { sec: 'calm', d: 6, p: 'g.i.d.i.g.i.d.g.', hat: 1, x: 1, c: [['p', '.b.d.c.d']], s: [[0, [[0, 2], [4, 5], [8, 2], [12, 5], [15, 3]]]] },
    { sec: 'calm', d: 0, p: 'c.e.h.e.c.e.h.j.', hat: 1, c: [['p', '3b4c5d6e']] },
    { sec: 'calm', d: 4, p: 'g.......b.......', h: [[0, 7, 3], [0, 7, 12]] },
    // build 48-51
    { sec: 'build', d: 5, k: 'x.x.x.x.x.x.x.x.', c: [['k', '3c4b5a69']], riser: 3.6 },
    { sec: 'build', d: 6, k: TR12, c: [['k', 'c3b4a5b4c3b4']] },
    { sec: 'build', d: 0, k: 'xxxxxxxxxxxxxxxx', c: [['k', '3c4b5a695a4b3c2d', 2.2]] },
    { sec: 'build', d: 4, k: 'xxxxxxxxxxxxxxxxxx......', gap: 1, c: [['k', '3c3c4b4b5a5a69695a', 2]] },
    // drop 2 52-67
    ...C.map((b, i) => Object.assign({ sec: 'drop', first: i === 0 }, b)), ...B.map(b => Object.assign({ sec: 'drop' }, mir(b))),
    ...D.map(b => Object.assign({ sec: 'drop' }, b)), ...C.map(b => Object.assign({ sec: 'drop' }, mir(b))),
    // bridge 68-75: polyrhythm
    { sec: 'bridge', first: 1, d: 3, k: DOT, c: [['k', '345654']], t: [[0, 12], [4, 11], [8, 12], [12, 11]] },
    { sec: 'bridge', d: 5, k: DOT, x: 1, c: [['k', '345654']], t: [[0, 12], [4, 11], [8, 12], [12, 11]] },
    { sec: 'bridge', d: 6, k: 'x....x....x....x', c: [['k', 'cdcb']], t: [[0, 3], [4, 4], [8, 3], [12, 4]] },
    { sec: 'bridge', d: 4, k: TR12, c: [['k', '3c4b5a4b3c4b']] },
    { sec: 'bridge', d: 3, k: 'x-----x-----', p: 'acehecacehec', c: [['p', '.cbcbc.34343', 2.4]], h: [[0, 7, 3], [8, 7, 12]] },
    { sec: 'bridge', d: 5, k: 'x-----x-----', p: 'fhcehcfhcehc', x: 1, c: [['p', '.cbcbc.34343', 2.4]], h: [[0, 7, 3], [8, 7, 12]] },
    { sec: 'bridge', d: 6, k: 'x.x.x.x.x.x.x.x.', roll: 1, c: [['k', '3c4b5a69'], ['k', 'c3b4a596']], riser: 1.6 },
    { sec: 'bridge', d: 4, k: 'xxxxxxxxxxxxxxxxxx......', roll: 1, gap: 1, c: [['k', '3c3c4b4b5a5a69695a', 2]] },
    // final drop 76-91
    ...C.map((b, i) => Object.assign({ sec: 'drop', first: i === 0 }, b)), ...B.map(b => Object.assign({ sec: 'drop' }, b)),
    ...D.map(b => Object.assign({ sec: 'drop' }, mir(b))), ...C.map(b => Object.assign({ sec: 'drop' }, mir(b))),
    // outro 92-95
    { sec: 'calm', d: 5, p: 'a.....e.....c...', crash: 1, c: [['p', '4b6']] }, { sec: 'calm', d: 6, p: 'b.....g.....d...', c: [['p', 'c4a']] },
    { sec: 'calm', d: 0, p: 'c...e...h.......', c: [['p', '3a.']], t: [[8, 7.5, 6]] }, { sec: 'calm', d: 0, last: 1, h: [[0, 14, 3], [0, 14, 12]] },
  ];
  const NB = bars.length, tn = 65, SC = [0, 2, 3, 5, 7, 8, 10], KC = '0123456789abcdefghij';
  const pitch = ch => { const i = KC.indexOf(ch) - 3; return tn + SC[((i % 7) + 7) % 7] + 12 * Math.floor(i / 7); };
  const chord = d => { let n = [0, 2, 4, 6].map(k => tn - 12 + SC[(d + k) % 7] + 12 * Math.floor((d + k) / 7)); if (n[0] - (tn - 12) >= 8) n = n.map(v => v - 12); return n.map(v => v + 12); };
  const root = d => tn - 24 + SC[d] - (SC[d] >= 8 ? 12 : 0);
  // onsets of a string, in 16th-step units
  const ons = str => { const o = []; if (!str) return o; const u = 16 / str.length; for (let i = 0; i < str.length; i++) { const c = str[i]; if (c === '.' || c === '-') continue; let len = 1; while (i + len < str.length && str[i + len] === '-') len++; o.push({ s: i * u, len: len * u, u, c }); } return o; };
  const hatStr = B => B.hh || (B.sec === 'verse' || B.sec === 'drop' || B.sec === 'bridge' ? 'x.x.x.x.x.x.x.x.' : B.hat ? 'x.x.x.x.x.x.x.x.' : '');
  function music(b) {
    const B = bars[b], t0 = b * BAR, T = s => t0 + s * STEP, ch = chord(B.d), r = root(B.d), calm = B.sec === 'calm';
    if (calm || B.sec === 'verse') { const pd = B.last ? 2.2 * BAR : BAR; ch.forEach(m => vPad(t0, pd, m, calm ? 0.085 : 0.06)); vPad(t0, pd, ch[0] + 12, 0.05); }
    ons(B.k).forEach(o => { const du = o.len * STEP * (o.len > o.u ? 0.97 : 0.8), v = B.sec === 'build' ? 0.34 : 0.4; ch.forEach((m, j) => vLead(T(o.s), du, m, j === 3 ? v * 0.8 : v)); vLead(T(o.s), du, ch[0] - 12, v * 0.9); });
    ons(B.m).forEach(o => vLead(T(o.s), o.len * STEP * 0.85, pitch(o.c), 0.95));
    ons(B.p).forEach(o => vPiano(T(o.s), pitch(o.c), 0.3, (pitch(o.c) % 5 - 2) * 0.1));
    if (B.sec === 'verse' || B.sec === 'drop' || B.sec === 'bridge') { vSub(T(0), STEP * 6, r, 0.95); vSub(T(10), STEP * 5, r, 0.85); }
    if (calm) vSub(t0, B.last ? 2 * BAR : BAR, r, 0.5);
  }
  function drums(b) {
    const B = bars[b], t0 = b * BAR, T = s => t0 + s * STEP, lim = B.gap ? 12 : 16;
    if (B.sec === 'verse') { kick(T(0), 0.9, 0.5); kick(T(10), 0.8, 0.5); vSnare(T(8), 0.95); }
    if (B.sec === 'drop' || B.sec === 'bridge') { kick(T(0), 1, 0.6); kick(T(6), 0.85, 0.5); kick(T(10), 0.95, 0.6); if (!B.roll) { vSnare(T(8), 1.1); vSnare(T(8) + 0.012, 0.6); } }
    if (B.sec === 'build' || B.roll) { const n = ons(B.k); n.forEach((o, i) => vSnare(T(o.s), 0.55 + 0.4 * i / n.length)); if (B.sec === 'build' && !B.gap) [0, 4, 8, 12].forEach(s => kick(T(s), 0.8, 0.35)); }
    ons(hatStr(B)).forEach(o => { if (o.s < lim) vHat(T(o.s), (o.s % 2 === 0 ? 0.85 : 0.55) * (B.sec === 'calm' ? 0.5 : 1), false, (o.s * 2) % 2 ? 0.3 : -0.15); });
    if (B.sec === 'drop') { vHat(T(4), 0.4, true, 0.2); vHat(T(12), 0.4, true, 0.2); }
    if (B.first) { vCrash(t0, 1); vImpact(t0, 1); } if (B.crash) vCrash(t0, 0.5);
    if (B.riser) vRiser(t0, B.riser * BAR, 0.85);
  }
  // chart
  const notes = [];
  bars.forEach((B, b) => {
    const g0 = b * 16, mx = p => B.x ? 15 - p : p, cx = (p, w) => Math.max(w / 2 + 0.1, Math.min(16 - w / 2 - 0.1, mx(p) + 0.5));
    const SRC = { k: B.k, m: B.m, p: B.p, h: hatStr(B) };
    (B.c || []).forEach(([src, pos, w = 3]) => { const o = ons(SRC[src]); if (o.length !== pos.length) throw new Error(`prism bar ${b}: layer ${src} has ${o.length} onsets, chart gives ${pos.length}`);
      o.forEach((q, i) => { if (pos[i] !== '.') notes.push({ g: g0 + q.s, long: 0, x: cx(parseInt(pos[i], 16), w), w }); }); });
    (B.t || []).forEach(([s, p, w = 3]) => notes.push({ g: g0 + s, long: 0, x: cx(p, w), w }));
    (B.h || []).forEach(([s, len, p]) => notes.push({ g: g0 + s, long: 1, slide: 0, w: 3, path: [[g0 + s, cx(p, 3)], [g0 + s + len, cx(p, 3)]] }));
    (B.s || []).forEach(([s, path]) => notes.push({ g: g0 + s, long: 1, slide: 1, w: 3, path: path.map(([ds, p]) => [g0 + s + ds, cx(p, 3)]) }));
  });
  notes.sort((a, c) => a.g - c.g);
  return { bpm: 160, nbars: NB, music, drums, notes };
})();
