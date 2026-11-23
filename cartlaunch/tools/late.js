// Experiment: on a late save, max one late upgrade at a time and measure gold and distance against the same seeds.
const C = require('../core.js'); const { play, career } = require('./bots.js');
const mode = process.argv[2] || 'trick', c = career(mode, +(process.argv[3] || 240)), s = c.s; s.rebirths = 9;
const avg = t => { let g = 0, d = 0; for (let j = 0; j < 50; j++) { const r = play(t, 9000 + j * 11, mode); g += C.payout(r, JSON.parse(JSON.stringify(t))).total; d += r.maxX; } return [g / 50, d / 50]; }, [g0, d0] = avg(s);
console.log(mode, 'zone', s.zone, 'gold', g0.toExponential(2));
for (const id of ['turbine', 'draft', 'pslam', 'pit', 'jspring', 'burn', 'streak', 'ctime', 'multi', 'allr', 'leap', 'crater', 'amp']) { const t = JSON.parse(JSON.stringify(s)); for (const [r, n] of C.UP[id].req) t.lv[r] = Math.max(t.lv[r] || 0, n); const [ga, da] = avg(t); t.lv[id] = C.UP[id].max; const [g1, d1] = avg(t); console.log(id.padEnd(8), 'gold', ((g1 / ga - 1) * 100).toFixed(0).padStart(4) + '%', 'dist', ((d1 / da - 1) * 100).toFixed(0).padStart(4) + '%'); }
