let seed = 987654321; const reseed = () => { seed = 987654321; }; const rnd = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; };
const mtof = m => 440 * Math.pow(2, (m - 69) / 12), TAU = Math.PI * 2;
function saw(ph, dt) { let v = 2 * ph - 1; if (ph < dt) { const x = ph / dt; v -= x + x - x * x - 1; } else if (ph > 1 - dt) { const x = (ph - 1) / dt; v -= x * x + x + x + 1; } return v; }

function vKick(t, v) { const i0 = Math.round(t * SR), n = (0.3 * SR) | 0; let ph = 0;
  for (let i = 0; i < n; i++) { const tt = i / SR; ph += (46 + 175 * Math.exp(-tt * 36)) / SR; let s = Math.sin(TAU * ph) * Math.exp(-tt * 8);
    if (i < 64) s += (1 - i / 64) * 0.4 * (rnd() * 2 - 1); if (i > n - 300) s *= (n - i) / 300; s = Math.tanh(s * 1.6) * 0.85 * v; L[i0 + i] += s; R[i0 + i] += s; } }
function vSnare(t, v) { if (DRY) return; const i0 = Math.round(t * SR), n = (0.2 * SR) | 0; let lp = 0, ph = 0;
  for (let i = 0; i < n; i++) { const tt = i / SR, w = rnd() * 2 - 1; lp += 0.35 * (w - lp); ph += (180 + 70 * Math.exp(-tt * 45)) / SR;
    let s = ((w - lp) * 0.75 * Math.exp(-tt * 20) + Math.sin(TAU * ph) * 0.6 * Math.exp(-tt * 32)) * v * 0.6; if (i > n - 200) s *= (n - i) / 200; L[i0 + i] += s; R[i0 + i] += s; } }
function vHat(t, v, open, pan) { if (DRY) return; const i0 = Math.round(t * SR), n = ((open ? 0.16 : 0.04) * SR) | 0, k = open ? 24 : 120; let p1 = 0, p2 = 0;
  for (let i = 0; i < n; i++) { const w = rnd() * 2 - 1, h1 = w - p1; p1 = w; const h2 = h1 - p2; p2 = h1; const s = h2 * 0.2 * Math.exp(-i / SR * k) * v; L[i0 + i] += s * (1 - pan); R[i0 + i] += s * (1 + pan); } }
function vCrash(t, v) { if (DRY) return; const i0 = Math.round(t * SR), n = (1.8 * SR) | 0; let a = 0, b = 0;
  for (let i = 0; i < n; i++) { const e = Math.exp(-i / SR * 2.6) * v * 0.3 * Math.min(1, (n - i) / 2000), w1 = rnd() * 2 - 1, w2 = rnd() * 2 - 1; L[i0 + i] += (w1 - a) * e; R[i0 + i] += (w2 - b) * e; a = w1; b = w2; } }
function vRiser(t, dur, v) { if (DRY) return; const i0 = Math.round(t * SR), n = (dur * SR) | 0; let ic1 = 0, ic2 = 0, g = 0, a1 = 0, a2 = 0, a3 = 0; const k = 0.5;
  for (let i = 0; i < n; i++) { const p = i / n; if ((i & 31) === 0) { g = Math.tan(Math.PI * 400 * Math.pow(16, p) / SR); a1 = 1 / (1 + g * (g + k)); a2 = g * a1; a3 = g * a2; }
    const x = rnd() * 2 - 1, v3 = x - ic2, v1 = a1 * ic1 + a2 * v3, v2 = ic2 + a2 * ic1 + a3 * v3; ic1 = 2 * v1 - ic1; ic2 = 2 * v2 - ic2;
    const s = v1 * p * p * v * 0.5 * Math.min(1, (n - i) / 300); L[i0 + i] += s; R[i0 + i] += s; } }
function vImpact(t, v) { if (DRY) return; const i0 = Math.round(t * SR), n = (1.4 * SR) | 0; let ph = 0, lp = 0;
  for (let i = 0; i < n; i++) { const tt = i / SR; ph += (38 + 60 * Math.exp(-tt * 12)) / SR; lp += 0.08 * ((rnd() * 2 - 1) - lp);
    const s = (Math.sin(TAU * ph) * Math.exp(-tt * 3.2) + lp * 1.2 * Math.exp(-tt * 9)) * v * 0.7 * Math.min(1, (n - i) / 2000); L[i0 + i] += s; R[i0 + i] += s; } }
function vBass(t, dur, m, v, c0, c1) { const i0 = Math.round(t * SR), nd = dur * SR, rel = 0.03 * SR, n = (nd + rel) | 0, f = mtof(m), d1 = f * 1.007 / SR, d2 = f / 1.007 / SR, ds = f / SR;
  let p1 = 0, p2 = 0.5, ps = 0, ic1 = 0, ic2 = 0, g = 0, a1 = 0, a2 = 0, a3 = 0; const k = 0.9;
  for (let i = 0; i < n; i++) { if ((i & 31) === 0) { g = Math.tan(Math.PI * (c1 + (c0 - c1) * Math.exp(-i / SR * 9)) / SR); a1 = 1 / (1 + g * (g + k)); a2 = g * a1; a3 = g * a2; }
    p1 += d1; if (p1 >= 1) p1 -= 1; p2 += d2; if (p2 >= 1) p2 -= 1; ps += ds;
    const x = (saw(p1, d1) + saw(p2, d2)) * 0.5, v3 = x - ic2, v1 = a1 * ic1 + a2 * v3, v2 = ic2 + a2 * ic1 + a3 * v3; ic1 = 2 * v1 - ic1; ic2 = 2 * v2 - ic2;
    let e = 1; if (i < 128) e = i / 128; if (i > nd) e = Math.max(0, 1 - (i - nd) / rel);
    const s = (Math.tanh(v2 * 1.8) * 0.6 + Math.sin(TAU * ps) * 0.7) * e * v * 0.4; L[i0 + i] += s; R[i0 + i] += s; } }
function vGrowl(t, dur, m, v, rate) { const i0 = Math.round(t * SR), nd = dur * SR, rel = 0.03 * SR, n = (nd + rel) | 0, f = mtof(m); let pc = 0, pm = 0, ps = 0, lp = 0;
  for (let i = 0; i < n; i++) { const tt = i / SR; pc += f / SR; pm += f * 0.5 / SR; ps += f * 0.5 / SR; const I = 3 + 2.6 * Math.sin(TAU * rate * tt - 1.57);
    const x = Math.tanh(Math.sin(TAU * pc + I * Math.sin(TAU * pm)) * 2.2); lp += 0.45 * (x - lp);
    let e = 1; if (i < 96) e = i / 96; if (i > nd) e = Math.max(0, 1 - (i - nd) / rel);
    const s = (lp * 0.5 + Math.sin(TAU * ps) * 0.6) * e * v * 0.42; L[i0 + i] += s; R[i0 + i] += s; } }
function vSub(t, dur, m, v) { const i0 = Math.round(t * SR), nd = dur * SR, rel = 0.1 * SR, n = (nd + rel) | 0, d = mtof(m) / SR; let ph = 0;
  for (let i = 0; i < n; i++) { ph += d; let e = Math.min(1, i / (0.05 * SR)); if (i > nd) e *= Math.max(0, 1 - (i - nd) / rel); const s = Math.sin(TAU * ph) * e * v * 0.4; L[i0 + i] += s; R[i0 + i] += s; } }
function vLead(t, dur, m, v) { const i0 = Math.round(t * SR), nd = dur * SR, rel = 0.06 * SR, n = (nd + rel) | 0, f = mtof(m), d1 = f * 0.9945 / SR, d2 = f / SR, d3 = f * 1.0055 / SR;
  let p1 = 0.1, p2 = 0.5, p3 = 0.8, l1 = 0, l2 = 0, r1 = 0, r2 = 0, g = 0, a1 = 0, a2 = 0, a3 = 0; const k = 1.1;
  for (let i = 0; i < n; i++) { const tt = i / SR; if ((i & 31) === 0) { g = Math.tan(Math.PI * Math.min(12000, 900 + 1400 * v + 5200 * v * Math.exp(-tt * 5)) / SR); a1 = 1 / (1 + g * (g + k)); a2 = g * a1; a3 = g * a2; }
    p1 += d1; if (p1 >= 1) p1 -= 1; p2 += d2; if (p2 >= 1) p2 -= 1; p3 += d3; if (p3 >= 1) p3 -= 1;
    const s2 = saw(p2, d2) * 0.7, xl = saw(p1, d1) + s2, xr = saw(p3, d3) + s2;
    let v3 = xl - l2, v1 = a1 * l1 + a2 * v3, v2 = l2 + a2 * l1 + a3 * v3; l1 = 2 * v1 - l1; l2 = 2 * v2 - l2; const ol = v2;
    v3 = xr - r2; v1 = a1 * r1 + a2 * v3; v2 = r2 + a2 * r1 + a3 * v3; r1 = 2 * v1 - r1; r2 = 2 * v2 - r2;
    let e = (i < 96 ? i / 96 : 1) * (0.72 + 0.28 * Math.exp(-tt * 10)); if (i > nd) e *= Math.max(0, 1 - (i - nd) / rel);
    const a = e * v * 0.15; L[i0 + i] += ol * a; R[i0 + i] += v2 * a; SND[i0 + i] += (ol + v2) * a * 0.22; } }
function vPluck(t, m, v, pan) { const i0 = Math.round(t * SR), n = (0.22 * SR) | 0, d = mtof(m) / SR; let p = 0, lp = 0;
  for (let i = 0; i < n; i++) { const tt = i / SR; p += d; if (p >= 1) p -= 1; const x = saw(p, d) * 0.6 + (p < 0.5 ? 0.4 : -0.4); lp += (0.08 + 0.5 * Math.exp(-tt * 18)) * (x - lp);
    const s = lp * Math.exp(-tt * 13) * v * Math.min(1, i / 32) * Math.min(1, (n - i) / 200); L[i0 + i] += s * (1 - pan); R[i0 + i] += s * (1 + pan); SND[i0 + i] += s * 0.3; } }
function vPad(t, dur, m, v) { const i0 = Math.round(t * SR), nd = dur * SR, att = 0.12 * SR, rel = 0.3 * SR, n = (nd + rel) | 0, f = mtof(m), d1 = f * 1.004 / SR, d2 = f / 1.004 / SR; let p1 = 0, p2 = 0.37, a = 0, a2 = 0, b = 0, b2 = 0;
  for (let i = 0; i < n; i++) { p1 += d1; if (p1 >= 1) p1 -= 1; p2 += d2; if (p2 >= 1) p2 -= 1; a += 0.17 * (saw(p1, d1) - a); a2 += 0.17 * (a - a2); b += 0.17 * (saw(p2, d2) - b); b2 += 0.17 * (b - b2);
    let e = Math.min(1, i / att); if (i > nd) e *= Math.max(0, 1 - (i - nd) / rel); L[i0 + i] += a2 * e * v; R[i0 + i] += b2 * e * v; } }
function vBell(t, m, v, pan) { const i0 = Math.round(t * SR), n = (1.5 * SR) | 0, f = mtof(m); let pc = 0, pm = 0;
  for (let i = 0; i < n; i++) { const tt = i / SR; pc += f / SR; pm += f * 4 / SR;
    const s = (Math.sin(TAU * pc + (1.6 * Math.exp(-tt * 9) + 0.2) * Math.sin(TAU * pm)) * Math.exp(-tt * 3) + Math.sin(TAU * pc * 2) * 0.2 * Math.exp(-tt * 6)) * v * Math.min(1, i / 64) * Math.min(1, (n - i) / 1500);
    L[i0 + i] += s * (1 - pan); R[i0 + i] += s * (1 + pan); SND[i0 + i] += s * 0.45; } }

function vPiano(t, m, v, pan) { const i0 = Math.round(t * SR), n = (0.75 * SR) | 0, f = mtof(m); let pc = 0, pm = 0;
  for (let i = 0; i < n; i++) { const tt = i / SR; pc += f / SR; pm += f * 3 / SR;
    const s = (Math.sin(TAU * pc + (2.2 * Math.exp(-tt * 14) + 0.35) * Math.sin(TAU * pm)) * Math.exp(-tt * 5.5) + Math.sin(TAU * pc * 2) * 0.25 * Math.exp(-tt * 9)) * v * Math.min(1, i / 48) * Math.min(1, (n - i) / 1200);
    L[i0 + i] += s * (1 - pan); R[i0 + i] += s * (1 + pan); SND[i0 + i] += s * 0.3; } }
const kick = (t, v, dk) => { if (DRY) kicks.push([t, dk]); else vKick(t, v); };