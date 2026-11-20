const INDIGO = (() => {
/* Per-bar data.  m = lead melody, p = bell melody, c = tap rows, h = holds [step,len,pos], s = slides [step,[[dstep,pos]...]]
   Melody chars index the D-minor scale from A3 ("0123456789abcdefghij"), '-' sustains, '.' rests.
   Chart chars are hex positions 0-f across the field (left thumb ~1-6, right thumb ~9-e). */
const D = [];
const B = (o) => D.push(o);
// --- Intro (0-7): bells over pads
B({p:'a.......e.......',c:['4.......b.......']});
B({p:'c.......a...8...',c:['3.......c...5...']});
B({p:'9...c...e.......',c:['4...a...d.......']});
B({p:'d.......b...9.b.',h:[[0,8,11]],c:['........5...3.5.']});
B({p:'a...c.e.h...e.c.',c:['3...5.b.d...b.4.']});
B({p:'f...c.a.c...a.8.',c:['c...a.4.5...3.2.']});
B({p:'g...e.c.e...g.e.',s:[[0,[[0,3],[8,6]]]],c:['....b.c.....b.d.']});
B({p:'d.b.9.b.d.g.i...',c:['2.4.6.9.b.d.e...']});
// --- Build A (8-15): half-time drums, 3-3-2 lead
B({m:'a..a..c.e..d..c.',c:['3..b..4.c..3..b.']});
B({m:'f..d..c.a..c..d.',c:['c..4..b.3..c..5.']});
B({m:'c..e..g.e..c..9.',c:['4..b..d.b..5..3.']});
B({m:'b..d..g.d.b.9.b.',c:['3..c..e.c.a.6.4.']});
B({m:'a..a..c.e.h.e.c.',h:[[0,8,2]],c:['...b..c.d.4.c.5.']});
B({m:'f..f..d.c.a.c.d.',h:[[0,8,13]],c:['...3..4.5.b.3.c.']});
B({m:'c.e.g.e.c.e.g.j.',c:['4.b.5.c.3.a.4.d.']});
B({m:'d.b.d.g.b.d.g.i.',c:['3.c.4.d.5.b.3.e.','c.......e.......']});
// --- Build-up (16-19): snare roll
B({c:['3...4...3...4...','c...b...c...b...']});
B({c:['3.c.4.b.5.a.6.9.']});
B({c:['3c3c4b4b5a5a6969']});
B({c:['2d3c4b5a6978....']});
// --- Drop 1 (20-35)
B({m:'a-.a.c.e-.d.c.a.',c:['3..b.4.c..3.b.4.','c...........4...']});
B({m:'f-.f.d.c-.a.c.d.',c:['c..4.b.3..c.4.b.','3...........c...']});
B({m:'c-.c.e.g-.e.c.9.',c:['4..a.5.d..4.c.3.','b...........5...']});
B({m:'b-.b.d.g-.b.9bdg',c:['c..3.b.4..c.3b5d','3...............']});
B({m:'a-.a.c.e-.d.c.a.',c:['d..4.c.3..d.4.c.','2...........b...']});
B({m:'f-.f.d.c-.acdfdc',c:['3..c.4.b..3c4b5a','c...............']});
B({m:'c-.c.e.g-.e.c.9.',c:['b..5.c.4..b.5.d.','4...........c...']});
B({m:'d.d.b.b.9.9.9bdg',c:['c.4.b.5.a.6.3b5d','3.......4.......']});
B({m:'ace-eca.ace-h.e.',c:['3b4.c5d.4c5.e.3.','............2...']});
B({m:'8ac-ca8.8acfc.a.',c:['c4b.3c4.b3c4b.3.']});
B({m:'9ce-ec9.9ceg-.e.',c:['2a4.d5b.3b5d..c.','..............4.']});
B({m:'9bd-db9.gdb9gdb9',c:['3b5.d4c.e5c3d4b2']});
B({m:'ace-eca.ace-h.e.',c:['c4b.3a2.b3a.1.c.','............d...']});
B({m:'8ac-ca8.fcafca8a',c:['3c4.b5a.d4c3b5a6']});
B({m:'ceg-gec.cegj-.g.',c:['4b5.c6d.3a4b..5.','..............d.']});
B({m:'gdb9gdb9g.g.g...',c:['d4c3b5a63.4.5...','........c.b.a...']});
// --- Break (36-43): slides and holds over bells
B({p:'f...d...c...a...',s:[[0,[[0,12],[8,10],[16,13]]]],c:['....3...5...2...']});
B({p:'g...b...d...g.b.',s:[[0,[[0,3],[8,6],[16,2]]]],c:['....c...a...d.b.']});
B({p:'a.c.e.h.e.c.a.c.',h:[[0,7,13],[8,7,2]],c:['..3.5.2...b.d.a.']});
B({p:'e.......a.......',s:[[0,[[0,2],[8,6],[14,2]]],[0,[[0,13],[8,9],[14,13]]]]});
B({p:'d.g.8.d.g.a.d.g.',s:[[0,[[0,2],[4,5],[8,2],[12,5],[15,3]]]],c:['..b.d.b.e.c.a.c.']});
B({p:'f.d.8.d.f.a.d.f.',s:[[0,[[0,13],[4,10],[8,13],[12,10],[15,12]]]],c:['..4.2.4.1.3.5.3.']});
B({p:'g.d.b.9.b.d.g.i.',c:['3.b.4.c.5.d.3.e.','c.......b.......']});
B({p:'e.......b.......',h:[[0,7,3],[0,7,12]],c:['........b.4.c.5.']});
// --- Build 2 (44-51): four-on-the-floor, 16th arp
B({c:['3.b.4.cc3.b.44c.']});
B({c:['c.4.b.33c.4.bb3.']});
B({c:['3b4.c.5d3.b4c.5.']});
B({c:['c4b.3.a5c.4b3.a.']});
B({m:'a-.a.c.e-.d.c.a.',h:[[0,6,2]],c:['...b.c.d..3.b.4.']});
B({m:'f-.f.d.c-.a.c.d.',h:[[0,6,13]],c:['...4.3.2..c.4.b.']});
B({m:'c.e.g.e.cegecege',c:['4.b.4.b.4b4b4b4b']});
B({m:'b.d.g.b.9bdg....',c:['3.4.5.6.5a4b....','c.b.a.9.........']});
// --- Drop 2 (52-67)
B({m:'a-.a.c.e-.d.c.a.',c:['3..b4c5d..3.b.4.','c...........4...']});
B({m:'f-.f.d.c-.a.c.d.',c:['c..4b3a2..c.4.b.','3...........c...']});
B({m:'c-.c.e.g-.e.c.9.',s:[[0,[[0,3],[3,5],[7,2]]]],c:['...b.c.d..4.c.3.','............5...']});
B({m:'b-.b.d.g-.b.9bdg',s:[[0,[[0,12],[3,10],[7,13]]]],c:['...4.3.2..c.3b5d']});
B({m:'a-.a.c.e-.d.c.a.',c:['3b4c5d4c..3.b.4.','............4...']});
B({m:'f-.f.d.c-.acdfdc',c:['c4b3a2b3..c4b3a2']});
B({m:'c-.c.e.g-.e.c.9.',c:['3.4.5.4.3.4.5.6.','c.b.a.b.c.d.c.b.']});
B({m:'d.d.b.b.9.9.9bdg',c:['c.c.4.4.b.b.3b5d','3...b...4.......']});
B({m:'aceacehecaecaeca',c:['3b4c5d6e5d4c3b2a']});
B({m:'8acf8acfcfa8cfa8',c:['c4b3c4b3a2b3c4d5']});
B({m:'ceg-gec.ceg-j.g.',c:['3b4.c5d.4c5.e.c.','............3.4.']});
B({m:'gdb9gdb9bdgbdgi.',c:['d4c3b5a6b4c5d6e.']});
B({m:'aceacehecaecaeca',c:['33bb44cc55dd44cc']});
B({m:'8acf8acfcfa8cfa8',c:['44cc33bb44cc3b4c']});
B({m:'cegjgecegjgecgcj',h:[[0,7,3],[8,7,12]],c:['..b.cc....4.33.2']});
B({m:'gdb9gdb9g.g.gggg',c:['d4c3b5a63.4.3c3c','........c.b.....']});
// --- Bridge (68-75): half-time bass stabs
B({c:['3..4..5...4.3...','c..b..a...b.c...']});
B({c:['3.b4..c.3..b..4.','c.......b.......']});
B({s:[[0,[[0,3],[3,6],[6,3],[10,6],[12,3],[15,5]]]],c:['...c..b...c.d...']});
B({s:[[0,[[0,12],[3,9],[6,12],[8,9],[11,12],[14,10],[15,11]]]],c:['..34..2.4..3..5.']});
B({c:['2..3..4...6.5...','9..a..b...d.c...']});
B({c:['d.4c..3.d..4..c.','3.......4.......']});
B({c:['3.c.4.b.3c4b3c4b']});
B({c:['33cc44bb55aa....']});
// --- Final drop (76-99), one whole tone up
B({m:'a-.a.c.e-.d.c.a.',c:['3..b4c5d..3b4.c.','c...........d...']});
B({m:'f-.f.d.c-.a.c.d.',c:['c..4b3a2..c4b.3.','3...........2...']});
B({m:'c-.c.e.g-.e.c.9.',c:['33.bb.44.cc.3b4c']});
B({m:'b-.b.d.g-.b.9bdg',c:['3..4.5.6..4.3b5d','c..b.a.9..b.....']});
B({m:'a-.a.c.e-.d.c.a.',h:[[0,7,2],[8,7,13]],c:['..b.cb....4.34.2']});
B({m:'f-.f.d.c-.acdfdc',c:['c..4.b.3..c4b3a2','3......c........']});
B({m:'c-.c.e.g-.e.c.9.',s:[[0,[[0,3],[4,6]]],[4,[[0,12],[4,9]]],[8,[[0,3],[4,6]]],[12,[[0,12],[3,9]]]],c:['..b...4...c...3.']});
B({m:'d.d.b.b.9.9.9bdg',c:['c.4.b.5.a.6.3b5d','3.c.4.b.5.a.....']});
B({m:'aceacehecaecaeca',c:['3b4c5d6e5d4c3b2a']});
B({m:'8acf8acfcfa8cfa8',c:['c4b3a2b3c4d5c4b3']});
B({m:'9cegc9cegecgec9c',c:['bb33cc44dd55ee66']});
B({m:'gdb9gdb9bdgbdgi.',c:['e5d4c3b2a3b4c5d.']});
B({m:'aceacehecaecaeca',c:['3b4c5d4c3b4c5d4c','c...............']});
B({m:'8acf8acfcfa8cfa8',c:['c4b3a2b3c4b3a2b3','3...............']});
B({m:'cegjgecegjgecgcj',s:[[0,[[0,13],[8,9],[15,13]]]],c:['3.4.33.2..3.44.2']});
B({m:'gdb9gdb9gdb9bdgi',s:[[0,[[0,2],[6,6],[10,3]]]],c:['c.b.cc.d..c.3c4b']});
B({m:'ace-eca.ace-h.e.',c:['3b4.c5d.4c5.e.3.','........d...2.c.']});
B({m:'8ac-ca8.8acfc.a.',c:['c4b.3c4.b3c4b.3.','........4.....c.']});
B({m:'9ce-ec9.9ceg-.e.',c:['33b.cc4.3b5d..c.','..............4.']});
B({m:'9bd-db9.gdb9gdb9',c:['3b5.d4c.e5c3d4b2','c...............']});
B({m:'ace-eca.ace-h.e.',c:['c4b.3a2.b3a.1.c.','............d...']});
B({m:'8ac-ca8.fcafca8a',c:['3c4.b5a.d4c3b5a6']});
B({m:'ceg-gec.cegj-.g.',c:['cc4.dd5.3a4b..5.','..............d.']});
B({m:'gdb9gdb9bdgbdgij',c:['e5d4c3b2a3b4c5d6']});
// --- Outro (100-107)
B({p:'a.......e.......',c:['3.......b.......','c...............']});
B({p:'c.......a...8...',c:['4.......c...5...']});
B({p:'9...c...e...g...',c:['3...6...9...c...']});
B({p:'d.......b.......',c:['c.......4.......']});
B({p:'a...c.e.h...e.c.',c:['3...5.b.d...b.4.']});
B({p:'f...c.a.c...a.8.',c:['c...a.4.5...3.2.']});
B({p:'9.c.e.g.e.c.9.c.',c:['3.5.a.c.d.b.4.2.']});
B({p:'a...............',h:[[0,14,3],[0,14,12]]});
// Harmony
const Dm = { r: 38, n: [62, 65, 69] }, Bb = { r: 34, n: [58, 62, 65] }, F = { r: 41, n: [60, 65, 69] }, C = { r: 36, n: [60, 64, 67] }, Gm = { r: 43, n: [58, 62, 67] }, A = { r: 33, n: [61, 64, 69] };
const PROG = [Dm, Bb, F, C];
const chordAt = b => b >= 36 && b < 44 ? [Bb, C, Dm, Dm, Gm, Bb, C, A][b - 36] : b >= 68 && b < 76 ? [Dm, Dm, Bb, Bb, Gm, Gm, A, A][b - 68] : PROG[b % 4];
const sec = b => b < 8 ? 0 : b < 16 ? 1 : b < 20 ? 2 : b < 36 ? 3 : b < 44 ? 4 : b < 52 ? 5 : b < 68 ? 6 : b < 76 ? 7 : b < 100 ? 8 : 9;
const SCALE = [0, 1, 3, 5, 7, 8, 10], KEYS = '0123456789abcdefghij';
const deg = ch => { const i = KEYS.indexOf(ch); return 57 + SCALE[i % 7] + 12 * Math.floor(i / 7); };
const GAP = b => b === 19 || b === 51 || b === 75; // last beat of these bars is silent before the drop


function musicBar(b) {
  const t0 = b * BAR, s = sec(b), ch = chordAt(b), tr = b >= 76 ? 2 : 0, lim = GAP(b) ? 12 : 16, T = i => t0 + i * STEP, d = D[b];
  // pads
  const pv = [0.09, 0.07, 0.08, 0.045, 0.1, 0.06, 0.045, 0.04, 0.045, 0.1][s], pd = (b === 107 ? 2.2 * BAR : lim * STEP);
  ch.n.forEach(m => vPad(t0, pd, m + tr, pv)); vPad(t0, pd, ch.n[0] + 12 + tr, pv * 0.6);
  // melodies
  const melody = (str, fn) => { if (!str) return; for (let i = 0; i < 16; i++) { const c = str[i]; if (c === '.' || c === '-') continue; let len = 1; while (i + len < 16 && str[i + len] === '-') len++; fn(T(i), len, deg(c) + tr); } };
  const lv = [0, 0.55, 0, 0.8, 0, 0.55, 0.85, 0, 0.92, 0][s];
  melody(d.m, (t, len, m) => vLead(t, len * STEP * (len > 1 ? 0.95 : 0.82), m, lv));
  melody(d.p, (t, len, m) => vBell(t, m, 0.2, (m % 5 - 2) * 0.12));
  // arps
  const n = ch.n, a8 = [n[0], n[1], n[2], n[0] + 12, n[2], n[1], n[2], n[0] + 12], a16 = [n[0], n[1], n[2], n[0] + 12, n[1] + 12, n[0] + 12, n[2], n[1]];
  const arp8 = v => { for (let i = 0; i < lim; i += 2) vPluck(T(i), a8[i / 2] + 12 + tr, v, (i & 2) ? 0.35 : -0.35); };
  const arp16 = v => { for (let i = 0; i < lim; i++) vPluck(T(i), a16[i % 8] + 12 + tr, v * (i % 2 ? 0.7 : 1), (i & 1) ? 0.4 : -0.4); };
  if ((s === 0 && b >= 4) || s === 1 || (s === 4 && b >= 40)) arp8(0.1);
  if (s === 9 && b < 106) arp8(0.08);
  if (s === 5) arp16(0.1); if (s === 6 || s === 8) arp16(0.05);
  // bass
  const r = ch.r + tr, seq = (steps, fn) => steps.forEach((st, j) => { if (st >= lim) return; const nx = Math.min(lim, j + 1 < steps.length ? steps[j + 1] : 16); fn(T(st), (nx - st) * STEP * 0.92, st, j); });
  if (s === 0 && b >= 4) vSub(t0, BAR, r, 0.5);
  if (s === 1) seq([0, 3, 6, 8, 11, 14], (t, du) => vBass(t, du, r, 0.55, 600, 220));
  if (s === 2) seq([0, 2, 4, 6, 8, 10, 12, 14], (t, du) => vBass(t, du, r, 0.6, 500 + (b - 16) * 500, 250));
  if (s === 3 || s === 6) seq([0, 3, 6, 8, 11, 14], (t, du, st) => vBass(t, du, r + (st === 6 ? 12 : st === 14 ? 7 : 0), 0.85, 2400, 380));
  if (s === 8) seq([0, 2, 3, 5, 6, 8, 10, 11, 13, 14, 15], (t, du, st) => vBass(t, du, r + (st === 3 || st === 11 ? 12 : st === 6 || st === 14 ? 7 : 0), 0.85, 2800, 420));
  if (s === 4) vSub(t0, BAR, r, 0.6);
  if (s === 5) seq([2, 6, 10, 14], (t) => vBass(t, STEP * 1.7, r, 0.7, 1500 + (b - 44) * 150, 300));
  if (s === 7) { const W = b === 75 ? [0, 2, 4, 6, 8, 10] : (b % 2 === 0 ? [0, 3, 6, 10, 12] : [0, 2, 3, 6, 8, 11, 14]);
    seq(W, (t, du, st, j) => vGrowl(t, Math.min(du, STEP * 2.8), r + 12 + (j % 3 === 2 ? 7 : j % 3 === 1 ? 12 : 0), 0.9, 1 / (STEP * (j % 2 ? 2 : 4)))); }
  if (s === 9) vSub(t0, b === 107 ? 2 * BAR : BAR, r, 0.5);
}
function drumBar(b) {
  const t0 = b * BAR, s = sec(b), T = i => t0 + i * STEP, lim = GAP(b) ? 12 : 16;
  const K = (st, v = 1, dk = 0.5) => { if (st < lim) kick(T(st), v, dk); }, S = (st, v = 1) => { if (st < lim) vSnare(T(st), v); };
  const hats16 = v => { for (let i = 0; i < lim; i++) vHat(T(i), v * (i % 2 ? 0.45 : 1), false, i % 2 ? 0.3 : -0.2); };
  const hats8 = v => { for (let i = 0; i < lim; i += 2) vHat(T(i), v, false, 0.1); };
  if (s === 0 && b >= 4) for (let i = 0; i < 16; i += 4) vHat(T(i), 0.5, false, 0);
  if (s === 1) { K(0, 0.9, 0.35); K(10, 0.8, 0.35); S(8, 0.9); hats8(0.6); }
  if (s === 2) { [0, 4, 8, 12].forEach(i => K(i, 0.85, 0.35)); const stp = b === 16 ? 4 : b === 17 ? 2 : 1; for (let i = 0; i < lim; i += stp) S(i, 0.45 + 0.5 * ((b - 16) * 16 + i) / 60); }
  if (s === 3) { if (b === 35) { K(0); S(4); K(6); [8, 10, 12].forEach(i => { K(i, 0.9); S(i); }); for (let i = 0; i < 8; i++) vHat(T(i), 0.8, false, 0); }
    else { K(0); K(10); S(4); S(12); hats16(0.8); vHat(T(14), 0.5, true, 0.2); } }
  if (s === 4 && b >= 40) hats8(0.4);
  if (s === 5) { [0, 4, 8, 12].forEach(i => K(i, 0.9, 0.5)); [2, 6, 10, 14].forEach(i => i < lim && vHat(T(i), 0.7, true, 0.15));
    if (b >= 48 && b < 50) { S(4, 0.8); S(12, 0.8); }
    if (b === 50) { for (let i = 0; i < 8; i += 2) S(i, 0.6 + i * 0.02); for (let i = 8; i < 16; i++) S(i, 0.65 + i * 0.02); }
    if (b === 51) [0, 2, 4, 6, 8, 9, 10, 11].forEach(i => S(i, 0.9)); }
  if (s === 6) { if (b === 67) { K(0); S(4); K(6); [8, 10].forEach(i => { K(i, 0.9); S(i); }); for (let i = 12; i < 16; i++) S(i, 0.85); for (let i = 0; i < 8; i++) vHat(T(i), 0.8, false, 0); }
    else { K(0); K(6, 0.85); K(10); S(4); S(12); hats16(0.85); vHat(T(14), 0.5, true, 0.2); } }
  if (s === 7) { if (b === 74) { K(0, 1, 0.35); for (let i = 0; i < 8; i += 2) S(i, 0.7); for (let i = 8; i < 16; i++) S(i, 0.7 + i * 0.015); }
    else if (b === 75) { for (let i = 0; i < 12; i++) S(i, 0.8 + i * 0.015); }
    else { K(0, 1, 0.35); K(3, 0.8, 0.35); K(10, 0.9, 0.35); S(8, 1.1); hats8(0.5); } }
  if (s === 8) { K(0); K(6, 0.85); K(10); K(13, 0.8); S(4); S(12); hats16(0.9); vHat(T(14), 0.5, true, 0.2); if (b === 99) for (let i = 8; i < 16; i++) S(i, 0.7 + i * 0.02); }
  // transitions
  if ([20, 52, 76, 100].includes(b)) { vCrash(t0, 1); vImpact(t0, 1); }
  if ([28, 60, 84, 92].includes(b)) vCrash(t0, 0.7);
  if (b === 36) vCrash(t0, 0.5);
  if (b === 16) vRiser(t0, 3.75 * BAR, 0.8); if (b === 50) vRiser(t0, 1.75 * BAR, 0.9); if (b === 74) vRiser(t0, 1.75 * BAR, 0.9); if (b === 99) vRiser(t0, BAR, 0.6); if (b === 43) vRiser(t0, BAR, 0.3);
}
  const cx = p => Math.max(1.6, Math.min(14.4, p + 0.5)), cn = [];
  D.forEach((d, bi) => { const g0 = bi * 16;
    (d.c || []).forEach(row => { for (let i = 0; i < 16; i++) { const ch = row[i]; if (ch && ch !== '.') cn.push({ g: g0 + i, long: 0, x: cx(parseInt(ch, 16)), w: 3 }); } });
    (d.h || []).forEach(([st, len, pos]) => cn.push({ g: g0 + st, long: 1, slide: 0, w: 3, path: [[g0 + st, cx(pos)], [g0 + st + len, cx(pos)]] }));
    (d.s || []).forEach(([st, path]) => cn.push({ g: g0 + st, long: 1, slide: 1, w: 3, path: path.map(([ds, pos]) => [g0 + st + ds, cx(pos)]) })); });
  return { bpm: 174, nbars: D.length, music: musicBar, drums: drumBar, notes: cn };
})();