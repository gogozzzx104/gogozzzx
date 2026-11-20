/* =====================================================================
   CHART ENGINE — turns a per-bar rhythm (taken straight from the score) into positioned notes.
   Every note sits on a step where the song actually plays something.
   ===================================================================== */
function buildChart(info, seed0) {
  let sd = seed0 >>> 0; const rnd = () => { sd = (sd + 0x6D2B79F5) | 0; let t = Math.imul(sd ^ (sd >>> 15), 1 | sd); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  let EV = [];
  const tap = (b, s, x, w = 3, h = null) => EV.push({ k: 0, g: b * 16 + s, x, w, h });
  const lng = (b, s, path, w, h, slide = 1) => EV.push({ k: 1, g: b * 16 + s, path: path.map(([d, x]) => [b * 16 + s + d, x]), w, h, slide });
  const mir = p => p.map(([d, x]) => [d, 16 - x]);
  let lo = 999, hi = -999; info.forEach(I => Object.values(I.pit).forEach(m => { if (m < lo) lo = m; if (m > hi) hi = m; }));
  const pitx = (b, s) => { const m = info[b].pit[s]; return m == null ? 8 : 2.4 + 11.2 * (m - lo) / Math.max(1, hi - lo); };
  const acc = (b, s) => info[b].acc.has(s);
  const st = { stair: 5, dir: 1, jl: seed0 % 6, od: seed0 % 10, sg: 0, tr: seed0 % 3, hk: seed0 % 4, sl: seed0 % 6, ds: seed0 % 5, sw: seed0 % 3, gl: 0, ce: 0, mi: seed0 % 2 };
  const pathx = (p, d) => { for (let i = 1; i < p.length; i++) if (d <= p[i][0]) { const f = (d - p[i - 1][0]) / (p[i][0] - p[i - 1][0]); return p[i - 1][1] + (p[i][1] - p[i - 1][1]) * (0.5 - 0.5 * Math.cos(Math.PI * f)); } return p[p.length - 1][1]; };
  const JL = [[8, 4.5, 11.5, 6.5], [3, 12.5, 9.5, 5.5], [10, 6, 13, 2.5], [7, 9, 4, 12], [5, 11, 8, 13.5], [12, 3.5, 6.5, 10]];
  const PAIRS = [[2.5, 7.2], [9, 13.5], [4, 11], [6, 10.6], [1.9, 6.2], [9.8, 14.1], [5, 8.8], [7.4, 12], [3, 13], [6.6, 9.4]];
  const SING = [8, 4.5, 11.5, 6.4, 9.6, 2.6, 13.4, 7.2, 10.2, 5.4];
  const HX = [[3, [11, 13, 12, 10]], [5.5, [12, 14, 11, 13]], [7.2, [12.5, 13.8, 11.5, 13]], [2.2, [8, 10, 7, 9.5]]];
  const SLP = [[[0, 2.5], [4, 7], [8, 3], [12, 8], [14, 6]], [[0, 6.5], [6, 2.2], [14, 9]], [[0, 3], [14, 10]], [[0, 8], [4, 4], [8, 8.5], [14, 2.5]], [[0, 2.2], [3, 5.5], [6, 2.2], [9, 5.5], [12, 2.2], [14, 4]], [[0, 9.5], [7, 3], [14, 7]]];
  const DS = [[[[0, 2.5], [7, 6.3], [14, 2.5]], [[0, 13.5], [7, 9.7], [14, 13.5]]], [[[0, 2.5], [7, 8], [14, 3]], [[0, 8], [7, 13.5], [14, 8.5]]], [[[0, 6], [5, 2.2], [10, 6.2], [14, 3]], [[0, 10], [5, 13.8], [10, 9.8], [14, 13]]], [[[0, 2.2], [14, 8.5]], [[0, 7.5], [14, 13.8]]], [[[0, 6.8], [7, 2.5], [14, 6.8]], [[0, 13.5], [7, 9.2], [14, 13.5]]]];
  const SW = [[[3, 7], [13, 9], [6, 2.2], [10, 13.8]], [[6.5, 2.5], [9.5, 13.5], [2.5, 6.5], [13.5, 9.5]], [[2.5, 8], [13.5, 8], [7, 3], [9, 13]]];
  const O = h => h === 'L' ? 'R' : 'L';
  const SF = {
    melody(b, S, L) { for (const s of S) { if (s % 2) tap(b, s, pitx(b, s) + (rnd() < 0.5 ? 1.6 : -1.6), 2.2); else { tap(b, s, pitx(b, s), acc(b, s) ? 3.8 : 3); if (L >= 5 && s % 8 === 0) { const x = pitx(b, s); tap(b, s, x < 8 ? x + 5.4 : x - 5.4, 2.8); } } } },
    center(b, S, L) { for (const s of S) { st.ce += 0.95; const x = 8 + 3.1 * Math.sin(st.ce); tap(b, s, x, s % 2 ? 2.2 : 2.7); if (L >= 4 && s % 8 === 0) tap(b, s, x + (x < 8 ? 5.2 : -5.2), 2.7); } },
    stairs(b, S, L) { for (const s of S) { st.stair += st.dir * (s % 2 ? 1 : 1.75); if (st.stair > 13.6) { st.stair = 13.6; st.dir = -1; } if (st.stair < 2.4) { st.stair = 2.4; st.dir = 1; } tap(b, s, st.stair, 2.8); if (L >= 5 && s % 8 === 4) tap(b, s, st.stair > 8 ? st.stair - 5 : st.stair + 5, 2.8); } },
    mirror(b, S, L) { st.mi++; const inw = st.mi % 2 === 0; S.forEach((s, k) => { const j = (k >> 1) % 4, d = inw ? j * 1.5 : (3 - j) * 1.5; if (k % 2 === 0) tap(b, s, 2 + d, 2.8, 'L'); else tap(b, s, 14 - d, 2.8, 'R'); if (L >= 4 && s % 8 === 0 && k % 2 === 0) tap(b, s, 14 - d, 2.8, 'R'); }); },
    jack(b, S, L) { const lanes = JL[st.jl++ % JL.length]; for (const s of S) { const q = s >> 2, x = lanes[q % 4], h = x < 7.5 ? 'L' : x > 8.5 ? 'R' : (q % 2 ? 'R' : 'L');
        if (s % 2) { tap(b, s, x + (h === 'L' ? 3.4 : -3.4), 2, O(h)); continue; } tap(b, s, x, 2.6, h);
        if ((s % 4 === 0 && L >= 4) || (L >= 5 && acc(b, s))) tap(b, s, Math.min(14.3, Math.max(1.7, h === 'L' ? x + 5 : x - 5)), 2.6, O(h)); } },
    trill1h(b, S, L) { st.tr++; for (const s of S) { const h = ((s >> 3) + st.tr) % 2 === 0 ? 'L' : 'R', base = [3.2, 5, 2.2][st.tr % 3], a = h === 'L' ? base : 16 - base, c = h === 'L' ? base + 2.9 : 16 - base - 2.9;
        if (s % 2) { tap(b, s, h === 'L' ? 11.5 : 4.5, 2, O(h)); continue; } tap(b, s, (s >> 1) % 2 === 0 ? a : c, 2.4, h);
        if (s % 8 === 0) tap(b, s, h === 'L' ? 12.5 : 3.5, 4.2, O(h)); else if (L >= 5 && s % 8 === 4) tap(b, s, h === 'L' ? 10.5 : 5.5, 2.6, O(h)); } },
    offdouble(b, S, L) { for (const s of S) { if (s % 2) { tap(b, s, SING[st.sg % 10] + (st.sg % 2 ? 1.3 : -1.3), 2); continue; }
        if ((s % 4 === 0 && (L >= 4 || acc(b, s))) || (L >= 5 && acc(b, s))) { const [a, c] = PAIRS[st.od++ % PAIRS.length], w = c - a < 4.5 ? 2.4 : 3; tap(b, s, a, w, 'L'); tap(b, s, c, w, 'R'); }
        else { tap(b, s, SING[st.sg++ % 10], 2.8); } } },
    hold_tap(b, S, L, jk) { st.hk++; for (const half of [0, 1]) { let [hx, tx] = HX[(st.hk + half) % HX.length]; const h = (st.hk + half) % 2 === 0 ? 'L' : 'R'; if (h === 'R') { hx = 16 - hx; tx = tx.map(v => 16 - v); }
        if (!S.includes(half * 8) && !S.includes(half * 8 + 2)) continue; lng(b, half * 8, [[0, hx], [6, hx]], Math.abs(hx - 8) > 2 ? 3.2 : 2.6, h, 0);
        let k = 0; for (const s of S) if (s > half * 8 && s < half * 8 + 8 && s % 2 === 0) { tap(b, s, jk ? tx[0] : tx[k % 4], jk ? 2.6 : 2.8, O(h)); k++; } } },
    hold_jack(b, S, L) { SF.hold_tap(b, S, L, true); },
    slide_tap(b, S, L, jk) { const p = SLP[st.sl % SLP.length], h = st.sl++ % 2 === 0 ? 'L' : 'R'; lng(b, 0, h === 'L' ? p : mir(p), 3, h, 1);
      let k = 0; for (const s of S) { if (s < 2 || s % 2) continue; const sx = pathx(p, Math.min(s, 14)); let x = jk ? 13.2 : Math.max(sx + 4.6, [11.5, 13.5, 12.4, 14][k % 4]); x = Math.min(14.4, Math.max(x, sx + 4.4)); k++; tap(b, s, h === 'L' ? x : 16 - x, 2.6, O(h)); } },
    slide_jack(b, S, L) { SF.slide_tap(b, S, L, true); },
    dual_slide(b) { const [a, c] = DS[st.ds++ % DS.length]; lng(b, 0, a, 3, 'L', 1); lng(b, 0, c, 3, 'R', 1); },
    sweep(b, S) { const sw = SW[st.sw++ % SW.length]; for (let q = 0; q < 4; q++) { const [a, c] = sw[q], h = q % 2 === 0 ? 'L' : 'R'; lng(b, q * 4, [[0, a], [3, c]], 2.8, h, 1); const s = q * 4 + 2; if (S.includes(s)) tap(b, s, (h === 'L' ? 13 : 3) + (q > 1 ? -1.5 : 0), 2.6, O(h)); } },
    glitch(b, S) { for (const s of S) { st.gl++; tap(b, s, [4, 12, 8, 6, 10][st.gl % 5], s % 4 ? 3.2 : 4.6); } },
    wide(b, S) { S.forEach((s, k) => { if (s % 8 === 0) tap(b, s, 8, 7); else tap(b, s, [4.5, 11.5, 6.5, 9.5][k % 4], 3); }); },
  };
  const LONGS = new Set(['hold_tap', 'hold_jack', 'slide_tap', 'slide_jack', 'dual_slide', 'sweep']), POOL = ['stairs', 'offdouble', 'center', 'mirror', 'melody', 'jack', 'trill1h'];
  let pa = seed0 % 7;
  info.forEach((I, b) => {
    if (!I.steps.length) return;
    let nm = I.style; const odd = I.steps.filter(s => s % 2).length;
    if (LONGS.has(nm) && (odd >= 2 || I.sus.length)) nm = POOL[pa++ % POOL.length];
    if (nm === 'dual_slide' && !I.calm) nm = 'slide_tap';
    const S = LONGS.has(nm) ? I.steps.filter(s => s % 2 === 0) : I.steps, n0 = EV.length;
    SF[nm](b, S, I.lv);
    // sustained melody notes become holds on the melody's own position
    for (const [s, len] of I.sus) { const x = Math.min(13.5, Math.max(2.5, pitx(b, s))), h = x < 8 ? 'L' : 'R';
      EV = EV.slice(0, n0).concat(EV.slice(n0).filter(e => !(e.g === b * 16 + s))); lng(b, s, [[0, x], [len, x]], 3.2, h, 0); }
    if (I.crash) { EV = EV.slice(0, n0).concat(EV.slice(n0).filter(e => !(e.k === 0 && e.g === b * 16))); if (!EV.slice(n0).some(e => e.k === 1 && e.g === b * 16)) { EV.push({ k: 0, g: b * 16, x: 4.2, w: 5, h: 'L' }, { k: 0, g: b * 16, x: 11.8, w: 5, h: 'R' }); } }
  });
  // runs of consecutive 16ths become two-hand rolls
  const on = new Set(); info.forEach((I, b) => I.steps.forEach(s => on.add(b * 16 + s)));
  { let run = 0; for (let g = 0; g < info.length * 16; g++) { if (!on.has(g)) { run = 0; continue; } run++; if (run > 32 && g % 2) { on.delete(g); EV = EV.filter(e => !(e.k === 0 && e.g === g)); run = 0; } } }
  const FIG = ['trill', 'up', 'out', 'broken', 'tight', 'down', 'in', 'wide']; let sf = seed0 % 8, lead = seed0 % 2;
  const fig = (g0, n, f, ld) => { for (let i = 0; i < n; i++) { const h = i % 2 === 0 ? ld : O(ld), j = i >> 1, r = i / Math.max(1, n - 1); let x;
      if (f === 'trill') x = h === 'L' ? 5.6 : 10.4; else if (f === 'up') x = (h === 'L' ? 3 : 7.4) + r * 5.4; else if (f === 'down') x = (h === 'L' ? 8.6 : 13) - r * 5.4;
      else if (f === 'out') x = h === 'L' ? 6.6 - r * 4.2 : 9.4 + r * 4.2; else if (f === 'in') x = h === 'L' ? 2.4 + r * 4.2 : 13.6 - r * 4.2;
      else if (f === 'broken') x = h === 'L' ? [4, 6.6, 3, 5.6][j % 4] : [10.4, 13, 9.4, 12][j % 4]; else if (f === 'tight') x = h === 'L' ? 6.7 : 9.3; else x = h === 'L' ? [2.6, 5.2][j % 2] : [13.4, 10.8][j % 2];
      EV.push({ k: 0, g: g0 + i, x, w: f === 'tight' ? 2 : 2.2, h }); } };
  const total = info.length * 16;
  for (let g = 0; g < total; g++) { if (!on.has(g) || on.has(g - 1)) continue; let g1 = g; while (on.has(g1 + 1)) g1++; const n = g1 - g + 1; if (n < 3) continue;
    if (EV.some(e => e.k === 1 && e.g <= g1 && e.path[e.path.length - 1][0] >= g)) continue;
    const keep = EV.filter(e => e.k === 0 && e.g === g && e.w >= 4.5);
    EV = EV.filter(e => !(e.k === 0 && e.g >= g && e.g <= g1));
    let pos = 0; const ld = lead++ % 2 ? 'R' : 'L';
    while (pos < n) { const ln = Math.min(n - pos <= 10 ? n - pos : 8, n - pos); fig(g + pos, ln, FIG[sf++ % FIG.length], pos % 2 === 0 ? ld : O(ld)); pos += ln; }
    if (keep.length) { EV = EV.filter(e => !(e.k === 0 && e.g === g && e.w < 4.5)).concat(keep); }
  }
  // hand solver: two thumbs, no crossing, no same-thumb 16ths
  EV.sort((a, c) => a.g - c.g || c.k - a.k || (a.x || 0) - (c.x || 0));
  const H = { L: { busy: -9, last: -9, x: 4, path: null }, R: { busy: -9, last: -9, x: 12, path: null } }, out = [];
  const hx = (h, g) => { const d = H[h]; if (d.path && g <= d.path[d.path.length - 1][0]) return pathx(d.path.map(([a, x]) => [a - d.path[0][0], x]), g - d.path[0][0]); return null; };
  for (const e of EV) { const g = e.g;
    if (e.k === 1) { const h = e.h, d = H[h], ox = hx(O(h), g), x0 = e.path[0][1];
      if (g < d.busy || g - d.last < 2) continue; if (ox != null && ((h === 'L' && x0 > ox - 2.6) || (h === 'R' && x0 < ox + 2.6))) continue;
      const end = e.path[e.path.length - 1]; d.busy = end[0] + 2; d.last = end[0]; d.path = e.path; d.x = end[1];
      out.push({ g, long: 1, slide: e.slide, w: e.w, path: e.path.map(([a, x]) => [a, Math.round(x * 100) / 100]) }); continue; }
    const ok = h => g >= H[h].busy && g - H[h].last >= 2, cand = ['L', 'R'].filter(ok); if (!cand.length) continue;
    let h, x = e.x; if (cand.includes(e.h)) h = e.h; else if (cand.length === 1) h = cand[0]; else h = x < 5.5 ? 'L' : x > 10.5 ? 'R' : H.L.last < H.R.last ? 'L' : H.R.last < H.L.last ? 'R' : x < 8 ? 'L' : 'R';
    const o = O(h); x = h === 'L' ? Math.min(x, 11) : Math.max(x, 5);
    let ox = hx(o, g); if (ox == null && H[o].last === g) ox = H[o].x;
    if (ox != null) x = h === 'L' ? Math.min(x, ox - 2.7) : Math.max(x, ox + 2.7);
    const gap = g - H[h].last, mj = gap <= 2 ? 5.5 : gap <= 4 ? 8.5 : 99; if (Math.abs(x - H[h].x) > mj) x = H[h].x + Math.sign(x - H[h].x) * mj;
    if (ox != null && ((h === 'L' && x > ox - 2.5) || (h === 'R' && x < ox + 2.5))) continue;
    x = Math.min(16 - e.w / 2 - 0.1, Math.max(e.w / 2 + 0.1, x)); H[h].last = g; H[h].x = x;
    out.push({ g, long: 0, x: Math.round(x * 100) / 100, w: e.w });
  }
  return out;
}

/* =====================================================================
   SONG BUILDER — a song is sections of bars; each bar takes its melody from a motif and its chord from a
   progression.  The same data drives the synth and the chart.
   Melody chars index the natural-minor scale ('3' = tonic, 'a' = tonic an octave up, 'h' = two octaves up),
   '-' sustains, '.' rests.
   ===================================================================== */
const MINOR = [0, 2, 3, 5, 7, 8, 10], KEYCH = '0123456789abcdefghij';
const PLAN = {
  intro: 'melody center melody wide', outro: 'melody center dual_slide melody',
  verse: 'melody offdouble hold_tap stairs slide_tap mirror center jack',
  build: 'mirror stairs offdouble center',
  drop: 'jack offdouble stairs trill1h slide_jack mirror hold_jack melody slide_tap center sweep offdouble jack stairs',
  break: 'dual_slide slide_tap hold_tap sweep dual_slide slide_tap melody sweep',
  glitch: 'glitch', half: 'offdouble jack slide_tap mirror trill1h hold_jack stairs sweep',
};
const LV = { intro: 1, outro: 1, verse: 4, build: 4, drop: 5, break: 2, glitch: 5, half: 5 };
function makeSong(def) {
  const bars = [], rot = {};
  def.sections.forEach(s => { const mot = s.m ? def.motifs[s.m] : null, pr = def.prog[s.p || 'main'], pl = PLAN[s.t].split(' '); rot[s.t] = rot[s.t] == null ? def.seed % pl.length : rot[s.t];
    for (let i = 0; i < s.n; i++) bars.push({ type: s.t, i, n: s.n, mel: mot ? mot[i % mot.length] : null, deg: pr[i % pr.length], style: pl[rot[s.t]++ % pl.length], gap: s.t === 'build' && i === s.n - 1 }); });
  const NB = bars.length, tn = def.tonic;
  const pitch = ch => { const i = KEYCH.indexOf(ch) - 3; return tn + MINOR[((i % 7) + 7) % 7] + 12 * Math.floor(i / 7); };
  const chord = d => { let n = [0, 2, 4].map(k => tn - 12 + MINOR[(d + k) % 7] + 12 * Math.floor((d + k) / 7)); if (n[0] - (tn - 12) >= 8) n = n.map(v => v - 12); return n.map(v => v + 12); };
  const root = d => tn - 24 + MINOR[d] - (MINOR[d] >= 8 ? 12 : 0);
  const parse = str => { const o = []; if (!str) return o; for (let i = 0; i < 16; i++) { const c = str[i]; if (c === '.' || c === '-') continue; let len = 1; while (i + len < 16 && str[i + len] === '-') len++; o.push({ s: i, len, m: pitch(c) }); } return o; };
  const rollStep = B => [4, 2, 1, 1][Math.min(3, Math.floor(B.i * 4 / B.n))];
  const piano = def.lead === 'piano';
  function music(b) {
    const B = bars[b], t0 = b * BAR, ty = B.type, lim = B.gap ? 12 : 16, T = i => t0 + i * STEP, ch = chord(B.deg), r = root(B.deg), ons = parse(B.mel), late = B.i >= B.n / 2;
    const pv = { intro: 0.09, verse: 0.06, build: 0.08, drop: 0.045, break: 0.1, glitch: 0, half: 0.04, outro: 0.1 }[ty];
    if (pv) { const pd = b === NB - 1 ? 2.2 * BAR : lim * STEP; ch.forEach(m => vPad(t0, pd, m, pv)); vPad(t0, pd, ch[0] + 12, pv * 0.6); }
    if (ty === 'intro' || ty === 'break' || ty === 'outro') ons.forEach(o => vBell(T(o.s), o.m, 0.2, (o.m % 5 - 2) * 0.12));
    else if (ty === 'half') ons.forEach((o, j) => vGrowl(T(o.s), Math.min(o.len, 3) * STEP * 0.9, o.m - 24, 0.9, 1 / (STEP * (j % 2 ? 2 : 4))));
    else { const lv = { verse: 0.55, drop: 0.88, build: 0.6, glitch: 0.9 }[ty];
      ons.forEach(o => { if (o.s >= lim) return; if (piano) { vPiano(T(o.s), o.m, lv * 0.34, (o.m % 5 - 2) * 0.1); if (ty === 'drop') vLead(T(o.s), STEP * 0.7, o.m, 0.3); } else vLead(T(o.s), o.len * STEP * (ty === 'glitch' ? 0.6 : o.len > 1 ? 0.95 : 0.82), o.m, lv); }); }
    const a8 = [ch[0], ch[1], ch[2], ch[0] + 12, ch[2], ch[1], ch[2], ch[0] + 12], a16 = [ch[0], ch[1], ch[2], ch[0] + 12, ch[1] + 12, ch[0] + 12, ch[2], ch[1]];
    const arp8 = v => { for (let i = 0; i < lim; i += 2) vPluck(T(i), a8[i / 2] + 12, v, (i & 2) ? 0.35 : -0.35); }, arp16 = v => { for (let i = 0; i < lim; i++) vPluck(T(i), a16[i % 8] + 12, v * (i % 2 ? 0.7 : 1), (i & 1) ? 0.4 : -0.4); };
    if (ty === 'verse' || ((ty === 'intro' || ty === 'break') && late) || (ty === 'outro' && B.i < B.n - 2)) arp8(0.09);
    if (ty === 'drop' && !piano) arp16(0.05);
    if (ty === 'verse') [2, 6, 10, 14].forEach(s => vBass(T(s), STEP * 1.7, r, 0.65, 1300, 280));
    if (ty === 'drop') [2, 6, 10, 14].forEach(s => vBass(T(s), STEP * 1.7, r + (s === 14 ? 12 : 0), 0.85, 2600, 400));
    if (ty === 'build') for (let s = 0; s < lim; s += 2) vBass(T(s), STEP * 1.7, r, 0.6, 500 + B.i / B.n * 2000, 250);
    if (ty === 'break' || ty === 'outro' || (ty === 'intro' && late) || ty === 'half') vSub(t0, b === NB - 1 ? 2 * BAR : BAR, r, 0.55);
  }
  function drums(b) {
    const B = bars[b], t0 = b * BAR, ty = B.type, lim = B.gap ? 12 : 16, T = i => t0 + i * STEP, ons = parse(B.mel), late = B.i >= B.n / 2;
    const K = (s, v, dk) => { if (s < lim) kick(T(s), v, dk); };
    if (ty === 'verse') { [0, 4, 8, 12].forEach(s => K(s, 0.9, 0.45)); vSnare(T(4), 0.8); vSnare(T(12), 0.8); [2, 6, 10, 14].forEach(s => vHat(T(s), 0.7, false, 0.1)); }
    if (ty === 'drop') { [0, 4, 8, 12].forEach(s => K(s, 1, 0.55)); vSnare(T(4), 1); vSnare(T(12), 1); for (let i = 0; i < 16; i++) vHat(T(i), 0.8 * (i % 2 ? 0.45 : 1), false, i % 2 ? 0.3 : -0.2); [2, 6, 10, 14].forEach(s => vHat(T(s), 0.35, true, 0.2)); }
    if (ty === 'build') { if (!B.gap) [0, 4, 8, 12].forEach(s => K(s, 0.85, 0.35)); const stp = rollStep(B), p = B.i / B.n; for (let i = 0; i < lim; i += stp) vSnare(T(i), 0.5 + 0.45 * (p + i / 16 / B.n)); if (B.i === 0) vRiser(t0, (B.n * 16 - 4) * STEP, 0.85); }
    if (ty === 'glitch') ons.forEach(o => { vSnare(T(o.s), 0.85); if (o.s % 4 === 0) K(o.s, 0.9, 0.3); });
    if (ty === 'half') { K(0, 1, 0.35); K(10, 0.9, 0.35); vSnare(T(8), 1.1); for (let i = 0; i < 16; i += 2) vHat(T(i), 0.5, false, 0.1); }
    if ((ty === 'break' || ty === 'intro') && late) for (let i = 0; i < 16; i += 2) vHat(T(i), 0.4, false, 0.1);
    if (B.i === 0) { if (ty === 'drop' || ty === 'half') { vCrash(t0, 1); vImpact(t0, 1); } else if (ty === 'verse' || ty === 'break' || ty === 'outro') vCrash(t0, 0.5); }
    else if (ty === 'drop' && B.i % 8 === 0) vCrash(t0, 0.7);
  }
  // rhythm the player hits = what is audible in that bar
  const info = bars.map(B => { const ons = parse(B.mel), ty = B.type, set = new Set(), pit = {}, lim = B.gap ? 12 : 16;
    ons.forEach(o => { if (o.s < lim) { pit[o.s] = o.m; } });
    if (ty === 'build') { for (let i = 0; i < lim; i += rollStep(B)) set.add(i); }
    else { ons.forEach(o => o.s < lim && set.add(o.s)); if (ty === 'verse' || ty === 'drop') for (let i = 0; i < 16; i += 2) set.add(i); if (ty === 'half') set.add(8); }
    const steps = [...set].sort((a, c) => a - c);
    steps.forEach(s => { if (pit[s] == null) { let k = s; while (k >= 0 && pit[k] == null) k--; if (k >= 0) pit[s] = pit[k]; } });
    const sus = (ty === 'verse' || ty === 'drop') ? ons.filter(o => o.len >= 5).map(o => [o.s, o.len]) : [];
    return { steps, pit, sus, acc: new Set(ty === 'verse' || ty === 'drop' ? [4, 12] : ty === 'half' ? [0, 8] : []), lv: LV[ty], style: B.style, calm: ty === 'intro' || ty === 'break' || ty === 'outro', crash: B.i === 0 && (ty === 'drop' || ty === 'half') };
  });
  return { bpm: def.bpm, nbars: NB, music, drums, notes: buildChart(info, def.seed) };
}

/* ---------------- the three new tracks ---------------- */
const BLOOM = makeSong({ bpm: 196, tonic: 64, seed: 11, lead: 'saw', prog: { main: [0, 5, 2, 6], alt: [5, 6, 0, 0, 3, 5, 6, 4], half: [0, 0, 5, 5, 3, 3, 4, 4] },
  motifs: {
    IB: ['a.......e.......', 'f.......c...a...', 'c.......g...e...', 'b...d...g.......', 'a...e...h...e...', 'f...c...a...c.f.', 'g...e...c...e.g.', 'i...g...d.b.g...'],
    V: ['a-----..c.e.h---', 'f-----..c.a.c---', 'c-----..e.g.j---', 'i---g---d---b.d.', 'a.c.e-----..h.e.', 'f.a.c-----..a.8.', 'g.e.c-----..e.g.', 'd.g.i---g.d.b.9.'],
    D1: ['h-..e.h.g-..e.c.', 'f-..c.f.e-..c.a.', 'g-..e.g.j-..g.e.', 'i-..g.i.g.d.bdgi', 'h-..e.h.g-..ehec', 'f-..c.f.e-..cfca', 'g-..e.g.j-..gjge', 'i.g.d.g.bdgbdgig'],
    D2: ['acehecaeacehe.c.', '8acfca8a8acfc.a.', '9cegec9c9cegj.g.', '9bdgdb9bgdb9bdgi', 'aceheca.ehecaceh', '8acfca8.cfca8acf', 'cegjgec.gjgecegj', 'gdb9gdb9bdgbdgi.'],
    D3: ['a.a.aaaac.c.e.h.', 'f.f.ffffa.a.c.f.', 'c.c.cccce.e.g.j.', 'g.g.ggggdddbbbgg', 'h.e.hehec.a.caca', 'f.c.fcfca.8.a8a8', 'j.g.jgjge.c.ecec', 'i.g.igigdgbdgbdg'],
    H: ['a..a..a...a.c...', 'a.aa..c.a..a..e.', 'f..f..f...f.h...', 'f.ff..h.f..f..c.', 'd..d..d...d.f...', 'd.dd..f.d..d..h.', 'e..e..e...e.g...', 'e.ee..g.e..e..i.'],
    BB: ['f...c...a...c...', 'g...d...b...d...', 'a.c.e.h.e.c.a.c.', 'e.......a.......', 'd.f.h.f.d.f.h.d.', 'f.a.c.f.c.a.f.a.', 'g.d.b.9.b.d.g.i.', 'e.......b.......'],
    OUT: ['a.......e.......', 'f.......c...a...', 'c...e...g...e...', 'b...d...g.......', 'a...e...h...e...', 'f...c...a...c...', 'g...e...c...9...', 'a...............'],
  },
  sections: [{ t: 'intro', n: 8, m: 'IB' }, { t: 'verse', n: 16, m: 'V' }, { t: 'build', n: 4 }, { t: 'drop', n: 8, m: 'D1' }, { t: 'drop', n: 8, m: 'D2' }, { t: 'break', n: 8, m: 'BB', p: 'alt' },
    { t: 'verse', n: 8, m: 'V' }, { t: 'build', n: 4 }, { t: 'drop', n: 8, m: 'D2' }, { t: 'drop', n: 8, m: 'D3' }, { t: 'half', n: 8, m: 'H', p: 'half' }, { t: 'build', n: 2 },
    { t: 'drop', n: 8, m: 'D1' }, { t: 'drop', n: 8, m: 'D3' }, { t: 'drop', n: 8, m: 'D2' }, { t: 'outro', n: 8, m: 'OUT' }] });

const FRACTURE = makeSong({ bpm: 208, tonic: 61, seed: 23, lead: 'saw', prog: { main: [0, 0, 5, 6], alt: [5, 5, 6, 6, 3, 3, 4, 4] },
  motifs: {
    IB: ['a.......a...e...', 'a...........h...', 'f.......f...c...', 'g.......b...d...'],
    V: ['a.....c.a.....e.', 'a...c.....e.c.a.', '8...a.....c.a...', '9...b...d...g.b.', 'a.....c.a...e.h.', 'h...e.....c.a.c.', 'f...a.....c.f...', 'g...d...b.d.g.i.'],
    D1: ['a.a.aaa.c.c.e...', 'a.a.aaa.h.e.c.a.', 'f.f.fff.a.c.f...', 'g.g.ggg.gdb9bdgi', 'h.h.hhh.e.e.c...', 'a.a.aaa.c.e.hehe', 'f.f.fff.c.a.fcfc', 'g.g.ggg.bdgbdgig'],
    D2: ['aaaa....eeee....', 'hhhh..e.c.a.eeee', 'ffff....cccc..a.', 'gggggggg....bdgi', 'aaaa..c.eeee..h.', 'hhhheeeeccccaaaa', 'ffff..a.cccc..f.', 'gggg....dddd9bdg'],
    D3: ['aecaecaeheceheca', 'aecaecaecaeahec.', 'fca8fca8cfacfca8', 'gdb9gdb9bdgbdgi.', 'hecahecaecaeceh.', 'acehecaeacehecae', 'fcafcafc8acfcaf.', 'gdbgdbgdbdgbdgig'],
    G: ['aa..aa..aaaa....', 'e.e.eeee........'],
    H: ['a.a.aa..a.c.a...', 'a..aa.a.e..c..a.', 'f.f.ff..f.h.f...', 'g..gg.g.i..g..d.'],
    BB: ['a...e...h...e...', 'c...e...a.......', 'f...a...c...a...', 'g...b...d.g.i...', 'd...f...h...f...', 'd...a...f.......', 'e...g...b...g...', 'e...b...e.g.b...'],
    OUT: ['a.......e...c...', 'a...............', 'f.......c...a...', 'g.......d.......', 'a...e...h.......', 'a...............'],
  },
  sections: [{ t: 'intro', n: 8, m: 'IB' }, { t: 'verse', n: 8, m: 'V' }, { t: 'build', n: 4 }, { t: 'drop', n: 8, m: 'D1' }, { t: 'drop', n: 8, m: 'D3' }, { t: 'glitch', n: 2, m: 'G' }, { t: 'break', n: 8, m: 'BB', p: 'alt' },
    { t: 'verse', n: 8, m: 'V' }, { t: 'build', n: 2 }, { t: 'drop', n: 8, m: 'D2' }, { t: 'drop', n: 8, m: 'D3' }, { t: 'half', n: 8, m: 'H' }, { t: 'glitch', n: 2, m: 'G' }, { t: 'build', n: 2 },
    { t: 'drop', n: 8, m: 'D1' }, { t: 'drop', n: 8, m: 'D3' }, { t: 'drop', n: 8, m: 'D2' }, { t: 'outro', n: 6, m: 'OUT' }] });

const SUNRISE = makeSong({ bpm: 184, tonic: 66, seed: 37, lead: 'piano', prog: { main: [5, 6, 0, 0], alt: [5, 6, 2, 4] },
  motifs: {
    IB: ['c.......a.......', 'd.......b.......', 'e...c...a...c...', 'e.......h.......', 'f...c...a...c...', 'g...d...b...d...', 'h...e...c...a...', 'e...c...a.......'],
    V: ['c...a.f.c...a.c.', 'd...b.g.d...b.d.', 'e...c.a.e...c.e.', 'h...e.c.a.c.e.h.', 'f...c.a.f...c.f.', 'g...d.b.g...d.g.', 'h...e.c.h...e.c.', 'a.c.e.h.j.h.e.c.'],
    D1: ['cfahafcfahaf.c.f', 'dgbigdbdgbig.d.g', 'acehecaeaceh.e.c', 'hecaecaehecaeceh', 'fcafhfcafcaf.a.c', 'gdbgigdbgdbg.b.d', 'hecahecaeceh.c.e', 'acehjhecaceheca.'],
    D2: ['f.c.fcaf.c.fcafc', 'g.d.gdbg.d.gdbgd', 'a.e.aecah.e.heca', 'ehecaceheh.e.c.a', 'c.f.cfac.f.cfahf', 'd.g.dgbd.g.dgbig', 'e.a.eace.a.ecehe', 'hjhecaecaceh.e.h'],
    D3: ['fcafcafcfahafcaf', 'gdbgdbgdgbigdbgd', 'ecaecaecaceheace', 'hehecacaeceheh..', 'cfahafcfahjhafca', 'dgbigdbdgbigdbg.', 'acehjhecacehjhec', 'hecaecaceheceh..'],
    BB: ['f...........c...', 'g...........d...', 'a...c...e...h...', 'e...............', 'f...c...a...c...', 'g...d...b...g...', 'e...g...j...g...', 'e...b...g.......'],
    OUT: ['c.......a.......', 'd.......b.......', 'e...c...a...c...', 'e.......h.......', 'f...c...a.......', 'g...d...b.......', 'h...e...c...a...', 'a...............'],
  },
  sections: [{ t: 'intro', n: 8, m: 'IB' }, { t: 'verse', n: 8, m: 'V' }, { t: 'build', n: 4 }, { t: 'drop', n: 8, m: 'D1' }, { t: 'drop', n: 8, m: 'D2' }, { t: 'break', n: 8, m: 'BB', p: 'alt' },
    { t: 'verse', n: 8, m: 'V' }, { t: 'build', n: 4 }, { t: 'drop', n: 8, m: 'D2' }, { t: 'drop', n: 8, m: 'D3' }, { t: 'break', n: 4, m: 'BB' }, { t: 'build', n: 2 },
    { t: 'drop', n: 8, m: 'D1' }, { t: 'drop', n: 8, m: 'D3' }, { t: 'drop', n: 8, m: 'D3' }, { t: 'outro', n: 8, m: 'OUT' }] });
