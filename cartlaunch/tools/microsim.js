// Balance simulation for 작은 세상: a steering bot plays runs, buys the cheapest upgrades, reconstructs when progress stalls.
// node cartlaunch/tools/microsim.js [maxRuns] [skill 0-1]
const C = require('../microcore.js'); if (process.env.T) Object.assign(C.TUNE, JSON.parse(process.env.T)); if (process.env.G) for (const [id, g] of Object.entries(JSON.parse(process.env.G))) C.UP[id].gr = g;
const MAXR = +(process.argv[2] || 600), SKILL = +(process.argv[3] || 0.8);
function bot(r, dt) {
  // look ahead: candidate heights, score by clearance against obstacles arriving soon, plus grains and rings
  const st = r.st, rb = C.RB * (r.shT > 0 ? 0.5 : 1), look = Math.min(40, Math.max(8, r.v * 0.55 * SKILL + 4)); if (r.warp) return { ty: 0, boost: true };
  let best = r.y, bs = -1e9;
  for (let k = -6; k <= 6; k++) { const y = k / 6 * (C.HH - 0.8); let s = -Math.abs(y - r.y) * 0.08, danger = 0;
    for (let i = Math.floor(r.X / C.CW); i <= Math.floor((r.X + look) / C.CW); i++) for (const o of C.cellObjs(r, i)) { if (r.used.has(o.id) || o.x < r.X - 1) continue; const tA = (o.x - r.X) / Math.max(1, r.v), t = r.tr + tA;
      if (o.t === 'lt' || o.t === 'big') { if (Math.abs(o.y - y) < 1.4) s += o.t === 'big' ? 6 : 1.2; continue; }
      if (o.t === 'en') { if (Math.abs(o.y - y) < 1.4) s += 3; continue; }
      if (o.t === 'ring') { if (Math.abs(o.y - y) < 1.5) s += 2; continue; }
      const g = C.gap(o, o.x, y, t, rb); if (g < 0.3) danger += 30 / (1 + tA * 2); else if (g < 1) s += 0.5; }
    s -= danger; if (s > bs) { bs = s; best = y; } }
  if (Math.random() > SKILL) best = r.y + (Math.random() - 0.5) * 6;
  const inp = { ty: best, boost: r.fuel > 0 && r.v < st.brk * 1.5, pulse: false, blink: false, shrink: false };
  // emergency skills
  if (bs < -10 && r.inv <= 0 && r.v < st.brk) { if (r.pulses > 0) inp.pulse = true; else if (r.blinks > 0) inp.blink = true; else if (r.shrinks > 0) inp.shrink = true; }
  return inp;
}
function play(M) { const q = Math.random() < SKILL * 0.6 ? 2 : Math.random() < 0.8 ? 1 : 0, r = C.newRun(M, q); let t = 0; while (!r.over && t < 400) { C.step(r, 1 / 20, bot(r, 1 / 20)); t += 1 / 20; } return { r, t }; }
const M = C.newSave(); let time = 0, stall = 0, last = 0; const firstAt = {};
for (let n = 1; n <= MAXR; n++) {
  const { r, t } = play(M); time += t + 6; const p = C.finish(r, M); C.buyAll(M);
  for (let z = 0; z <= M.zoneEver; z++) if (!firstAt[z]) firstAt[z] = { run: n, min: (time / 60).toFixed(1), recons: M.recons };
  if (M.bestCyc > last + 0.05) { last = M.bestCyc; stall = 0; } else stall++;
  if (C.reconOpen(M) && C.crysFor(M) > 0 && stall >= 6) { const g = C.reconstruct(M); last = 0; stall = 0; for (let k = 0; k < 200; k++) { let b = null, bc = Infinity; for (const q of C.PERKS) { const l = C.pl(M, q.id); if (l >= q.max || C.perkLock(M, q.id)) continue; const c = C.perkCost(q.id, l); if (c < bc) { bc = c; b = q.id; } } if (!b || bc > M.crys) break; C.buyPerk(M, b); } }
  if (n % 25 === 0 || r.found || n <= +(process.env.DBG || 0)) console.log(`run ${n} ${(time / 60).toFixed(0)}분 p=${r.pmax.toFixed(2)} best=${M.best.toFixed(2)} hits=${r.hits} near=${r.nearN} v=${r.v.toFixed(0)} why=${r.why} t=${t.toFixed(0)}s light=${M.light.toExponential(2)} recons=${M.recons} crys=${M.crys} power=${C.lvl(M, 'u_power')} lux=${C.lvl(M, 'u_lux')}`);
  if (r.found) break;
}
console.log('first reach:', Object.entries(firstAt).map(([z, o]) => `${z}:${o.run}판/${o.min}분/재${o.recons}`).join(' '));
