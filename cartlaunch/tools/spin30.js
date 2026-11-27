// Hold spin for the whole flight, mixing dash / dive / leap, and log every reset of the turn counter with its cause.
const fs = require('fs'); let src = fs.readFileSync(require('path').join(__dirname, '../core.js'), 'utf8');
const LOG = [];
src = src.replace("r.air = true; if (k === 1) r.rotAcc = 0;", "r.air = true; if (k === 1) { if (Math.abs(r.rotAcc) > 3) globalThis.LOG.push({ t: r.tr, why: '땅 근처 도약', turns: r.rotAcc / 6.2832, alt: alt0 / r.S }); r.rotAcc = 0; }");
src = src.replace("r.airT = 0; r.rotAcc = 0; r.spin = 0; r.ang = sa;", "if (Math.abs(r.rotAcc) > 3 || flips) globalThis.LOG.push({ t: r.tr, why: '땅에 닿음', turns: r.rotAcc / 6.2832, flips, trick, dd: +dd.toFixed(2), vn: +vn.toFixed(1), slam: r.slam, airT: +r.airT.toFixed(2) }); r.airT = 0; r.rotAcc = 0; r.spin = 0; r.ang = sa;");
globalThis.LOG = LOG; const m = { exports: {} }; new Function('module', 'exports', src)(m, m.exports); const C = m.exports;
function save(full) { const s = C.newSave(); for (const u of C.UPS) s.lv[u.id] = full ? u.max : Math.ceil(u.max * 0.6); for (const q of C.PERKS) s.perks[q.id] = q.max; if (full) for (const q of C.TPERKS) s.tperks[q.id] = q.max; s.zone = 25; return s; }
for (const [name, full, mode] of [['끝판 · 회전만', 1, 'spin'], ['끝판 · 회전+대시·급강하·도약', 1, 'mix'], ['중반 · 회전+대시·급강하·도약', 0, 'mix']]) {
  LOG.length = 0; const st = C.stats(save(full)), r = C.newRun(st, 0.995, 1.06, 7); let t = 0;
  while (!r.over && t < 60) { const inp = { spin: 1, boost: r.fuel > 0 }; if (mode === 'mix') { const k = Math.floor(t * 20) % 60; if (k === 10) inp.dash = true; if (k === 30) inp.dive = true; if (k === 45) inp.spring = true; } C.step(r, 1 / 20, inp); t += 1 / 20; }
  const sum = LOG.reduce((a, e) => a + Math.abs(e.turns), 0);
  console.log(`\n== ${name}: 비행 ${t.toFixed(0)}초, 총 회전 ${sum.toFixed(0)}바퀴, 인정된 묘기 ${r.tricks}바퀴, 땅에 닿음 ${LOG.filter(e => e.why === '땅에 닿음').length}번, 도약 초기화 ${LOG.filter(e => e.why !== '땅에 닿음').length}번`);
  for (const e of LOG.slice(0, 12)) console.log(' ', JSON.stringify(e)); }
