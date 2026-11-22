// quick what-if runner: node tools/tune.js 'push.cm=1.24,ad.cm=1.27' [runs] [lives]
const C = require('../core.js');
for (const kv of (process.argv[2] || '').split(',').filter(Boolean)) { const [k, v] = kv.split('='), [id, f] = k.split('.'); if (id === 'ALL') { for (const u of C.UPS) u[f] *= +v; } else if (id === 'GATED') { for (const u of C.UPS) if (u.zone) u[f] *= +v; } else C.UP[id][f] = +v; }
process.argv = [process.argv[0], process.argv[1], 'runs=' + (process.argv[3] || 800), 'lives=' + (process.argv[4] || 1)];
require.main = module; // run sim's main with patched core
const src = require('fs').readFileSync(__dirname + '/sim.js', 'utf8').replace("require.main === module", "true");
new Function('require', 'module', 'process', src)(p => p === '../core.js' ? C : require(p), { exports: {} }, process);
