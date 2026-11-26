/* 작은 세상 - drawing: zone backdrops, the obstacles of every scale, pickups, the bubble capsule, the shrink lab and the zoom tunnels.
   Everything draws on the context handed to MART.use(); sizes are in screen pixels. */
const MART = (() => {
  'use strict';
  let g = null; const use = c => { g = c; };
  const TAU = Math.PI * 2, INK = '#2b2233';
  const hs = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const hex = (h, a) => `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})`;
  const mixc = (a, b, f) => { const p = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)], A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * f).toString(16).padStart(2, '0')).join(''); };
  const circ = (x, y, r) => { g.beginPath(); g.arc(x, y, Math.max(0.1, r), 0, TAU); };
  const glow = (x, y, r, col, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, hex(col, a)); gr.addColorStop(1, hex(col, 0)); g.fillStyle = gr; circ(x, y, r); g.fill(); };

  /* ---------- backdrop: gradient, far shapes, drifting motes, the channel's walls ---------- */
  // pal: [deep, mid, glow, accent]; scroll in pixels; top/bot: the channel's screen edges
  function backdrop(W, H, Z, pal, scroll, t, top, bot, fx) {
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, pal[0]); gr.addColorStop(0.5, mixc(pal[0], pal[1], 0.55)); gr.addColorStop(1, pal[0]); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const st = Z.style, K = fx;
    // far layer: big soft shapes typical of the zone, slow parallax
    g.save(); const far = scroll * 0.15;
    for (let k = 0; k < 7; k++) { const span = W * 1.6, x = ((hs(k * 3 + Z.i) * span - far) % span + span) % span - W * 0.3, y = H * (0.15 + 0.7 * hs(k * 7 + Z.i * 5)), R = H * (0.12 + 0.22 * hs(k * 11 + Z.i));
      farShape(st, x, y, R, pal, t + k, k); }
    g.restore();
    // motes: small particles drifting by at mid speed
    const mid = scroll * 0.45, n = Math.round(46 * K);
    for (let k = 0; k < n; k++) { const span = W + 80, x = ((hs(k * 5.3 + 1) * span - mid * (0.6 + 0.8 * hs(k))) % span + span) % span - 40, y = (hs(k * 9.1 + 2) * H + Math.sin(t * 0.7 + k) * 6), r = 1 + 2.2 * hs(k * 2.7);
      g.fillStyle = hex(pal[2], 0.12 + 0.2 * hs(k * 4.1)); mote(st, x, y, r, k, t); }
    // channel walls: membranes above and below the channel
    for (const [y0, dir] of [[top, -1], [bot, 1]]) { g.fillStyle = hex(pal[1], 0.55); g.beginPath(); g.moveTo(0, dir < 0 ? 0 : H); for (let x = 0; x <= W + 20; x += 20) g.lineTo(x, y0 + dir * (6 + 5 * Math.sin((x + scroll) * 0.02 + t * 1.4) + 3 * Math.sin((x + scroll) * 0.053))); g.lineTo(W, dir < 0 ? 0 : H); g.closePath(); g.fill();
      g.strokeStyle = hex(pal[2], 0.5); g.lineWidth = 2; g.beginPath(); for (let x = 0; x <= W + 20; x += 20) { const yy = y0 + dir * (6 + 5 * Math.sin((x + scroll) * 0.02 + t * 1.4) + 3 * Math.sin((x + scroll) * 0.053)); x ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke(); }
  }
  function mote(st, x, y, r, k, t) {
    if (st === 'quark' || st === 'gluon') { g.fillStyle = ['rgba(255,90,90,.35)', 'rgba(90,255,140,.35)', 'rgba(90,150,255,.35)'][k % 3]; }
    if (st === 'planck') { g.fillRect(Math.round(x / 6) * 6, Math.round(y / 6) * 6, 4, 4); return; }
    if (st === 'foam' || st === 'cell') { g.lineWidth = 1; g.strokeStyle = g.fillStyle; circ(x, y, r * 1.6); g.stroke(); return; }
    circ(x, y, r); g.fill(); }
  function farShape(st, x, y, R, pal, t, k) {
    g.globalAlpha = 0.16;
    if (st === 'tile') { g.strokeStyle = pal[2]; g.lineWidth = R * 0.08; g.beginPath(); g.moveTo(x - R * 2, y); g.lineTo(x + R * 2, y + R * 0.2); g.stroke(); }
    else if (st === 'fiber' || st === 'mite') { g.strokeStyle = pal[2]; g.lineWidth = R * 0.06; g.beginPath(); g.moveTo(x - R * 1.5, y - R); g.bezierCurveTo(x - R * 0.4, y + R, x + R * 0.4, y - R, x + R * 1.5, y + R * 0.6); g.stroke(); }
    else if (st === 'dna') { g.strokeStyle = pal[3]; g.lineWidth = R * 0.05; for (let s = 0; s < 2; s++) { g.beginPath(); for (let q = 0; q <= 30; q++) { const xx = x - R * 1.5 + q * R * 0.1, yy = y + Math.sin(q * 0.4 + t * 0.4 + s * Math.PI) * R * 0.4; q ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.stroke(); } }
    else if (st === 'atom' || st === 'electron' || st === 'void') { g.strokeStyle = pal[2]; g.lineWidth = 1.5; for (let q = 0; q < 3; q++) { g.beginPath(); g.ellipse(x, y, R, R * 0.35, q * 1.05 + t * 0.05, 0, TAU); g.stroke(); } }
    else if (st === 'string') { g.strokeStyle = pal[3]; g.lineWidth = 2; g.beginPath(); for (let q = 0; q <= 40; q++) { const a = q / 40 * TAU, rr = R * (1 + 0.15 * Math.sin(a * 5 + t * 2)); q ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.stroke(); }
    else if (st === 'higgs') { g.strokeStyle = pal[3]; g.lineWidth = 1.5; for (let q = 1; q <= 4; q++) { circ(x, y, R * q * 0.3 * (1 + 0.1 * Math.sin(t + q))); g.stroke(); } }
    else if (st === 'gut') { g.strokeStyle = pal[3]; g.lineWidth = 1.5; g.beginPath(); for (let q = 0; q <= 12; q++) { const a = q / 12 * TAU, rr = q % 2 ? R * 0.5 : R; q ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + rr, y); } g.stroke(); }
    else if (st === 'planck') { g.fillStyle = pal[2]; g.fillRect(Math.round(x / 16) * 16, Math.round(y / 16) * 16, R * 0.3, R * 0.3); }
    else { glow(x, y, R, pal[2], 0.6); }
    g.globalAlpha = 1; }

  /* ---------- obstacles ---------- */
  // o: the object, x/y its screen centre, R its radius in pixels, u pixels per world unit, t time, ang for spinning bars
  function blocker(st, o, x, y, R, u, t, pal) {
    const k = o.k || 0, a = pal[3], c = pal[2];
    g.lineJoin = 'round'; g.lineCap = 'round';
    switch (st) {
      case 'tile': if (k === 0) { // dust bunny
          g.fillStyle = '#8d8590'; circ(x, y, R); g.fill(); g.strokeStyle = '#b8b0bc'; g.lineWidth = 1.2; for (let q = 0; q < 14; q++) { const an = q * 0.45 + o.id, rr = R * (0.9 + 0.35 * hs(q + o.id)); g.beginPath(); g.moveTo(x + Math.cos(an) * R * 0.5, y + Math.sin(an) * R * 0.5); g.lineTo(x + Math.cos(an + 0.3) * rr, y + Math.sin(an + 0.3) * rr); g.stroke(); } }
        else if (k === 1) { g.fillStyle = '#d9a35a'; g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); for (let q = 0; q < 7; q++) { const an = q / 7 * TAU, rr = R * (0.75 + 0.3 * hs(q * 3 + o.id)); q ? g.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr) : g.moveTo(x + rr, y); } g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#f2c98a'; circ(x - R * 0.25, y - R * 0.25, R * 0.25); g.fill(); }
        else if (k === 2) { g.fillStyle = '#c9a04a'; g.strokeStyle = INK; g.lineWidth = 2; circ(x, y, R); g.fill(); g.stroke(); g.strokeStyle = '#8a6418'; circ(x, y, R * 0.7); g.stroke(); g.fillStyle = '#8a6418'; g.font = `${R * 0.8}px sans-serif`; g.textAlign = 'center'; g.fillText('10', x, y + R * 0.28); }
        else { g.fillStyle = '#5a525e'; g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(x - R, y + R * 0.4); g.lineTo(x - R * 0.4, y - R * 0.9); g.lineTo(x + R * 0.8, y - R * 0.5); g.lineTo(x + R, y + R * 0.6); g.closePath(); g.fill(); g.stroke(); }
        break;
      case 'fiber': g.strokeStyle = k % 2 ? '#c9b8ff' : '#e8e0ff'; g.lineWidth = Math.max(1.5, R * 0.12); for (let q = 0; q < 6; q++) { const an = hs(o.id + q) * TAU; g.beginPath(); g.moveTo(x + Math.cos(an) * R, y + Math.sin(an) * R); g.quadraticCurveTo(x + Math.cos(an + 2) * R * 0.3, y + Math.sin(an + 2) * R * 0.3, x + Math.cos(an + 3.3) * R, y + Math.sin(an + 3.3) * R); g.stroke(); } glow(x, y, R * 1.1, c, 0.18); break;
      case 'mite': { const w = Math.sin(t * 9 + o.id) * 0.25; g.strokeStyle = INK; g.lineWidth = Math.max(1.5, R * 0.09); for (let q = 0; q < 4; q++) for (const sd of [-1, 1]) { const an = (q - 1.5) * 0.45 + w * (q % 2 ? 1 : -1); g.beginPath(); g.moveTo(x + sd * R * 0.4, y + (q - 1.5) * R * 0.3); g.lineTo(x + sd * R * 1.05, y + (q - 1.5) * R * 0.4 + an * R * 0.3); g.lineTo(x + sd * R * 1.25, y + (q - 1.5) * R * 0.55); g.stroke(); }
        g.fillStyle = '#e8c89a'; g.beginPath(); g.ellipse(x, y, R * 0.6, R * 0.8, 0, 0, TAU); g.fill(); g.lineWidth = 2; g.stroke(); g.fillStyle = '#c89a6a'; g.beginPath(); g.ellipse(x, y - R * 0.75, R * 0.3, R * 0.22, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = INK; circ(x - R * 0.1, y - R * 0.8, R * 0.06); g.fill(); circ(x + R * 0.1, y - R * 0.8, R * 0.06); g.fill(); break; }
      case 'pollen': g.fillStyle = k % 2 ? '#ffd23a' : '#ffe680'; g.strokeStyle = '#8a6a10'; g.lineWidth = 1.5; for (let q = 0; q < 16; q++) { const an = q / 16 * TAU + t * 0.3; g.beginPath(); g.moveTo(x + Math.cos(an) * R * 0.8, y + Math.sin(an) * R * 0.8); g.lineTo(x + Math.cos(an) * R * 1.15, y + Math.sin(an) * R * 1.15); g.stroke(); } circ(x, y, R * 0.85); g.fill(); g.stroke(); g.fillStyle = 'rgba(138,106,16,.35)'; for (let q = 0; q < 6; q++) { circ(x + Math.cos(q) * R * 0.45, y + Math.sin(q * 1.7) * R * 0.45, R * 0.12); g.fill(); } break;
      case 'cell': { g.fillStyle = hex(a, 0.22); g.strokeStyle = hex(c, 0.85); g.lineWidth = Math.max(1.5, R * 0.08); g.beginPath(); for (let q = 0; q <= 24; q++) { const an = q / 24 * TAU, rr = R * (1 + 0.06 * Math.sin(an * 3 + t * 2 + o.id)); q ? g.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr) : g.moveTo(x + rr, y); } g.closePath(); g.fill(); g.stroke();
        g.fillStyle = hex('#7a5aff', 0.55); circ(x + R * 0.15, y - R * 0.1, R * 0.38); g.fill(); g.fillStyle = hex('#ffffff', 0.5); circ(x + R * 0.1, y - R * 0.15, R * 0.12); g.fill(); g.fillStyle = hex('#ffd060', 0.6); for (let q = 0; q < 3; q++) { g.beginPath(); g.ellipse(x - R * 0.45 + q * R * 0.2, y + R * 0.45 - q * R * 0.15, R * 0.12, R * 0.06, q, 0, TAU); g.fill(); } break; }
      case 'bact': { g.save(); g.translate(x, y); g.rotate(o.id % 3 - 1 + Math.sin(t + o.id) * 0.2); g.strokeStyle = hex(c, 0.7); g.lineWidth = 1.5; g.beginPath(); for (let q = 0; q <= 16; q++) { const xx = R * 0.9 + q * R * 0.08, yy = Math.sin(q * 0.9 - t * 12) * R * 0.15; q ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.stroke();
        g.fillStyle = k % 2 ? '#4dff9a' : '#3ad07a'; g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.roundRect(-R, -R * 0.45, R * 1.9, R * 0.9, R * 0.45); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.roundRect(-R * 0.75, -R * 0.3, R * 1.2, R * 0.2, R * 0.1); g.fill(); g.restore(); break; }
      case 'mito': { g.save(); g.translate(x, y); g.rotate(o.id * 0.7); g.fillStyle = '#ff8fbf'; g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.ellipse(0, 0, R, R * 0.55, 0, 0, TAU); g.fill(); g.stroke(); g.strokeStyle = '#b8306a'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-R * 0.8, 0); for (let q = 0; q < 6; q++) { const xx = -R * 0.7 + q * R * 0.28; g.lineTo(xx, (q % 2 ? 1 : -1) * R * 0.38); } g.stroke(); g.restore(); break; }
      case 'virus': { g.strokeStyle = '#e6d0ff'; g.lineWidth = Math.max(1.4, R * 0.08); for (let q = 0; q < 12; q++) { const an = q / 12 * TAU + t * 0.4; g.beginPath(); g.moveTo(x + Math.cos(an) * R * 0.75, y + Math.sin(an) * R * 0.75); g.lineTo(x + Math.cos(an) * R * 1.2, y + Math.sin(an) * R * 1.2); g.stroke(); g.fillStyle = a; circ(x + Math.cos(an) * R * 1.22, y + Math.sin(an) * R * 1.22, R * 0.1); g.fill(); }
        g.fillStyle = '#8a4ae0'; g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); for (let q = 0; q < 6; q++) { const an = q / 6 * TAU + t * 0.4; q ? g.lineTo(x + Math.cos(an) * R * 0.8, y + Math.sin(an) * R * 0.8) : g.moveTo(x + Math.cos(an) * R * 0.8, y + Math.sin(an) * R * 0.8); } g.closePath(); g.fill(); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(x - R * 0.4, y - R * 0.4); g.lineTo(x + R * 0.4, y + R * 0.4); g.moveTo(x + R * 0.4, y - R * 0.4); g.lineTo(x - R * 0.4, y + R * 0.4); g.stroke(); break; }
      case 'protein': { g.lineWidth = Math.max(2, R * 0.22); for (let s = 0; s < 3; s++) { g.strokeStyle = ['#6fb4ff', '#ff9ad0', '#9affc0'][(s + k) % 3]; g.beginPath(); for (let q = 0; q <= 14; q++) { const an = q * 0.7 + s * 2 + o.id, rr = R * (0.35 + 0.55 * hs(q + s * 9 + o.id)); q ? g.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr) : g.moveTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); } g.stroke(); } break; }
      case 'dna': { g.fillStyle = ['#ff7ad0', '#5ad1ff', '#ffd23a', '#7affa0'][k]; g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.roundRect(x - R * 0.9, y - R * 0.5, R * 1.8, R, R * 0.4); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(x - R * 0.6, y - R * 0.3, R * 0.5, R * 0.18); break; }
      case 'molecule': { const an = t * 0.8 + o.id; g.strokeStyle = '#dfe'; g.lineWidth = Math.max(2, R * 0.16); const h1 = [x + Math.cos(an) * R * 0.95, y + Math.sin(an) * R * 0.95], h2 = [x + Math.cos(an + 1.82) * R * 0.95, y + Math.sin(an + 1.82) * R * 0.95]; g.beginPath(); g.moveTo(...h1); g.lineTo(x, y); g.lineTo(...h2); g.stroke();
        g.fillStyle = '#ff5a5a'; g.strokeStyle = INK; g.lineWidth = 2; circ(x, y, R * 0.6); g.fill(); g.stroke(); g.fillStyle = '#ffffff'; for (const p of [h1, h2]) { circ(p[0], p[1], R * 0.36); g.fill(); g.stroke(); } g.fillStyle = 'rgba(255,255,255,.45)'; circ(x - R * 0.2, y - R * 0.2, R * 0.18); g.fill(); break; }
      case 'atom': { g.strokeStyle = hex(c, 0.75); g.lineWidth = 1.4; for (let q = 0; q < 3; q++) { g.beginPath(); g.ellipse(x, y, R, R * 0.32, q * 1.05 + o.id, 0, TAU); g.stroke(); const ea = t * 3 + q * 2, an = q * 1.05 + o.id, ex = Math.cos(ea) * R, ey = Math.sin(ea) * R * 0.32; g.fillStyle = '#9adfff'; circ(x + ex * Math.cos(an) - ey * Math.sin(an), y + ex * Math.sin(an) + ey * Math.cos(an), Math.max(2, R * 0.1)); g.fill(); }
        glow(x, y, R * 0.45, '#ff8a6a', 0.9); g.fillStyle = '#ff6a4a'; circ(x, y, R * 0.18); g.fill(); break; }
      case 'electron': { glow(x, y, R * 1.3, a, 0.5); glow(x + Math.sin(t * 5 + o.id) * R * 0.3, y + Math.cos(t * 4 + o.id) * R * 0.3, R * 0.5, '#ffffff', 0.9); break; }
      case 'void': { glow(x, y, R * 1.2, '#ff5a8a', 0.35); g.fillStyle = '#ffd0e0'; circ(x, y, R * 0.35); g.fill(); break; }
      case 'nucleus': { const n = 7; for (let q = 0; q < n; q++) { const an = q * 2.4 + o.id, rr = q ? R * 0.55 : 0; g.fillStyle = q % 2 ? '#ff6a4a' : '#7aa8ff'; g.strokeStyle = INK; g.lineWidth = 1.8; circ(x + Math.cos(an + t * 0.5) * rr, y + Math.sin(an + t * 0.5) * rr, R * 0.42); g.fill(); g.stroke(); } break; }
      case 'proton': { const pts = [0, 1, 2].map(q => [x + Math.cos(q * 2.09 + t) * R * 0.55, y + Math.sin(q * 2.09 + t) * R * 0.55]); g.strokeStyle = '#ffd04a'; g.lineWidth = 2; for (let q = 0; q < 3; q++) { const [ax, ay] = pts[q], [bx, by] = pts[(q + 1) % 3]; g.beginPath(); for (let s = 0; s <= 12; s++) { const f = s / 12, px = ax + (bx - ax) * f, py = ay + (by - ay) * f + Math.sin(f * 18 + t * 8) * R * 0.08; s ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); }
        pts.forEach((p, q) => { g.fillStyle = ['#ff5a5a', '#5aff8a', '#5a8aff'][q]; g.strokeStyle = INK; g.lineWidth = 1.8; circ(p[0], p[1], R * 0.3); g.fill(); g.stroke(); }); g.strokeStyle = hex(c, 0.5); g.lineWidth = 1.5; circ(x, y, R); g.stroke(); break; }
      case 'quark': { const col = ['#ff5a5a', '#5aff8a', '#5a8aff'][k % 3]; glow(x, y, R * 1.4, col, 0.45); g.fillStyle = col; g.strokeStyle = INK; g.lineWidth = 2; circ(x, y, R * 0.6); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,.5)'; circ(x - R * 0.2, y - R * 0.2, R * 0.18); g.fill(); break; }
      case 'gluon': { g.strokeStyle = '#ffaa2a'; g.lineWidth = Math.max(2, R * 0.14); g.beginPath(); for (let q = 0; q <= 40; q++) { const an = q / 40 * TAU * 3, rr = R * (0.2 + 0.8 * q / 40); q ? g.lineTo(x + Math.cos(an + t * 3) * rr, y + Math.sin(an + t * 3) * rr) : g.moveTo(x, y); } g.stroke(); glow(x, y, R, '#ffcc66', 0.3); break; }
      case 'weak': { const fl = 0.6 + 0.4 * Math.sin(t * 13 + o.id); g.globalAlpha = fl; g.fillStyle = k % 2 ? '#a0a8ff' : '#e0e0ff'; g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); for (let q = 0; q < 6; q++) { const an = q / 6 * TAU; q ? g.lineTo(x + Math.cos(an) * R, y + Math.sin(an) * R) : g.moveTo(x + R, y); } g.closePath(); g.fill(); g.stroke(); g.fillStyle = INK; g.font = `${R * 0.9}px sans-serif`; g.textAlign = 'center'; g.fillText(k % 2 ? 'W' : 'Z', x, y + R * 0.32); g.globalAlpha = 1; break; }
      case 'higgs': { for (let q = 3; q >= 1; q--) { g.strokeStyle = hex('#ffd84a', 0.25 * q); g.lineWidth = 2; circ(x, y, R * q / 3 * (1 + 0.1 * Math.sin(t * 3 - q))); g.stroke(); } g.fillStyle = '#ffd84a'; circ(x, y, R * 0.3); g.fill(); break; }
      case 'string': { g.strokeStyle = '#3ad8ff'; g.lineWidth = Math.max(2, R * 0.12); g.beginPath(); for (let q = 0; q <= 48; q++) { const an = q / 48 * TAU, rr = R * (0.8 + 0.22 * Math.sin(an * (3 + k) + t * 6)); q ? g.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr) : g.moveTo(x + rr, y); } g.stroke(); glow(x, y, R * 0.8, '#3ad8ff', 0.25); break; }
      case 'gut': { g.fillStyle = hex('#ff6aff', 0.8); g.strokeStyle = '#ffe0ff'; g.lineWidth = 2; g.beginPath(); for (let q = 0; q <= 16; q++) { const an = q / 16 * TAU + t * 0.6, rr = q % 2 ? R * 0.45 : R; q ? g.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr) : g.moveTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); } g.closePath(); g.fill(); g.stroke(); break; }
      case 'foam': { const life = (t * 0.6 + hs(o.id)) % 1; g.strokeStyle = hex('#ffffff', 0.85 - 0.5 * life); g.lineWidth = 2; circ(x, y, R * (0.7 + 0.3 * life)); g.stroke(); g.fillStyle = hex('#b0f0ff', 0.18); g.fill(); g.strokeStyle = hex('#b0f0ff', 0.6); circ(x + R * 0.3, y - R * 0.3, R * 0.25); g.stroke(); break; }
      case 'planck': { const s = Math.max(3, R / 3); for (let qx = -3; qx < 3; qx++) for (let qy = -3; qy < 3; qy++) { if (hs(qx * 7 + qy * 13 + o.id + Math.floor(t * 6)) < 0.45) continue; g.fillStyle = hs(qx + qy * 5 + o.id) < 0.5 ? '#ffffff' : '#ffe27a'; g.fillRect(x + qx * s, y + qy * s, s - 1, s - 1); } break; }
      default: glow(x, y, R, c, 0.8);
    }
  }
  // a spinning bar: fibers, hairs, DNA strands, gluon springs
  function rod(st, o, x, y, L, r, ang, pal, t) {
    const dx = Math.cos(ang) * L, dy = Math.sin(ang) * L;
    g.lineCap = 'round';
    if (st === 'dna') { for (let s = 0; s < 2; s++) { g.strokeStyle = s ? '#5ad1ff' : '#ff7ad0'; g.lineWidth = Math.max(2, r * 0.9); g.beginPath(); for (let q = 0; q <= 20; q++) { const f = q / 20 * 2 - 1, w = Math.sin(f * 6 + s * Math.PI + t * 2) * r * 1.6; const px = x + dx * f - Math.sin(ang) * w, py = y + dy * f + Math.cos(ang) * w; q ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); }
      g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1.5; for (let q = 0; q <= 8; q++) { const f = q / 8 * 2 - 1, w = Math.sin(f * 6 + t * 2) * r * 1.6; g.beginPath(); g.moveTo(x + dx * f - Math.sin(ang) * w, y + dy * f + Math.cos(ang) * w); g.lineTo(x + dx * f + Math.sin(ang) * w, y + dy * f - Math.cos(ang) * w); g.stroke(); } return; }
    if (st === 'gluon' || st === 'proton' || st === 'quark') { g.strokeStyle = '#ffaa2a'; g.lineWidth = Math.max(2, r * 0.8); g.beginPath(); for (let q = 0; q <= 30; q++) { const f = q / 30 * 2 - 1, w = Math.sin(f * 14 + t * 10) * r * 1.2; const px = x + dx * f - Math.sin(ang) * w, py = y + dy * f + Math.cos(ang) * w; q ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); return; }
    const col = st === 'tile' ? '#a89aa8' : st === 'mite' || st === 'fiber' ? '#e8e0ff' : pal[3];
    g.strokeStyle = INK; g.lineWidth = r * 2 + 3; g.beginPath(); g.moveTo(x - dx, y - dy); g.lineTo(x + dx, y + dy); g.stroke();
    g.strokeStyle = col; g.lineWidth = r * 2; g.stroke(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = Math.max(1, r * 0.5); g.beginPath(); g.moveTo(x - dx * 0.8, y - dy * 0.8 - r * 0.3); g.lineTo(x + dx * 0.8, y + dy * 0.8 - r * 0.3); g.stroke();
  }
  // a wall across the channel with one gap; top/bot are the channel's screen edges, gy the gap centre, gw its half height (pixels)
  function gate(st, x, top, bot, gy, gw, w, pal, t) {
    const a = pal[3], c = pal[2];
    for (const [y0, y1] of [[top - 30, gy - gw], [gy + gw, bot + 30]]) { if (y1 <= y0) continue; g.fillStyle = hex(a, 0.5); g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath(); g.roundRect(x - w, y0, w * 2, y1 - y0, w * 0.8); g.fill(); g.stroke();
      g.fillStyle = hex(c, 0.25); for (let yy = y0 + 8; yy < y1 - 6; yy += 14) { circ(x + Math.sin(yy * 0.3 + t) * w * 0.3, yy, w * 0.28); g.fill(); } }
    g.strokeStyle = hex(c, 0.6 + 0.3 * Math.sin(t * 6)); g.lineWidth = 3; for (const yy of [gy - gw, gy + gw]) { g.beginPath(); g.moveTo(x - w - 4, yy); g.lineTo(x + w + 4, yy); g.stroke(); }
  }
  function ring(x, y, R, t, hit) { g.lineWidth = Math.max(3, R * 0.14); g.strokeStyle = hit ? '#ffffff' : 'rgba(140,240,255,.95)'; g.beginPath(); g.ellipse(x, y, R * 0.42, R, 0, 0, TAU); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(x, y, R * 0.3, R * 0.82, 0, 0, TAU); g.stroke();
    g.fillStyle = 'rgba(140,240,255,.85)'; for (let q = 0; q < 3; q++) { const f = (t * 1.5 + q / 3) % 1, xx = x - R * 0.6 + f * R * 1.2; g.globalAlpha = Math.sin(f * Math.PI); g.beginPath(); g.moveTo(xx + 5, y); g.lineTo(xx - 3, y - 5); g.lineTo(xx - 3, y + 5); g.fill(); } g.globalAlpha = 1; }
  function grain(x, y, R, t, id, rb) { const tw = 0.75 + 0.25 * Math.sin(t * 6 + id), col = rb || '#fff3b0'; glow(x, y, R * 2.4, rb ? rb : '#ffd24a', 0.35 * tw);
    g.fillStyle = col; g.beginPath(); for (let q = 0; q < 8; q++) { const an = q / 8 * TAU + t, rr = q % 2 ? R * 0.38 : R * tw; q ? g.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr) : g.moveTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); } g.closePath(); g.fill(); }
  function crystal(x, y, R, t) { glow(x, y, R * 2.6, '#9ae8ff', 0.4); g.save(); g.translate(x, y); g.rotate(Math.sin(t * 1.5) * 0.25); const gr = g.createLinearGradient(-R, -R, R, R); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, '#9ae8ff'); gr.addColorStop(1, '#c28cff'); g.fillStyle = gr; g.strokeStyle = INK; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, -R * 1.3); g.lineTo(R * 0.8, -R * 0.2); g.lineTo(R * 0.45, R * 1.1); g.lineTo(-R * 0.45, R * 1.1); g.lineTo(-R * 0.8, -R * 0.2); g.closePath(); g.fill(); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, -R * 1.3); g.lineTo(0, R * 1.1); g.moveTo(-R * 0.8, -R * 0.2); g.lineTo(R * 0.8, -R * 0.2); g.stroke(); g.restore(); }
  function energy(x, y, R, t) { const pu = 1 + 0.08 * Math.sin(t * 5); glow(x, y, R * 2, '#5affc0', 0.35); g.fillStyle = 'rgba(90,255,192,.35)'; g.strokeStyle = '#bfffe8'; g.lineWidth = 2; circ(x, y, R * pu); g.fill(); g.stroke(); g.strokeStyle = '#ffffff'; g.lineWidth = Math.max(2, R * 0.2); g.beginPath(); g.moveTo(x - R * 0.45, y); g.lineTo(x + R * 0.45, y); g.moveTo(x, y - R * 0.45); g.lineTo(x, y + R * 0.45); g.stroke(); }

  /* ---------- the capsule: a glossy bubble with the stick passenger inside ---------- */
  // st: { boost, inv, shrink, pulse, hurt, tilt, k (fx scale) }
  function bubble(x, y, R, t, o) {
    o = o || {};
    if (o.inv && Math.floor(t * 18) % 2) g.globalAlpha = 0.55;
    // passenger: body leaning into the flow, scarf flapping
    g.save(); g.translate(x, y); g.rotate(o.tilt || 0); const u = R / 22;
    g.strokeStyle = INK; g.lineWidth = Math.max(1.5, 2.6 * u); g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(-2 * u, 8 * u); g.lineTo(0, -4 * u); g.moveTo(-2 * u, 8 * u); g.lineTo(-7 * u, 15 * u); g.moveTo(-2 * u, 8 * u); g.lineTo(4 * u, 15 * u); g.moveTo(0, 0); g.lineTo(8 * u, -2 * u + Math.sin(t * 8) * 1.5 * u); g.moveTo(0, 0); g.lineTo(-7 * u, 3 * u); g.stroke();
    g.fillStyle = '#fff'; circ(1 * u, -9 * u, 5.2 * u); g.fill(); g.stroke(); g.fillStyle = INK; circ(3 * u, -9.5 * u, 1 * u); g.fill();
    if (o.cap) cap(1 * u, -9 * u, 5.2 * u, 1);
    g.strokeStyle = '#f0452f'; g.lineWidth = 2.4 * u; g.beginPath(); g.moveTo(-1 * u, -4 * u); g.quadraticCurveTo(-8 * u, -3 * u + Math.sin(t * 14) * 2 * u, -14 * u, -5 * u + Math.sin(t * 11) * 3 * u); g.stroke();
    g.restore();
    // the bubble shell: tinted body, rim, highlight
    const gr = g.createRadialGradient(x - R * 0.35, y - R * 0.4, R * 0.1, x, y, R); gr.addColorStop(0, 'rgba(255,255,255,.28)'); gr.addColorStop(0.7, o.rb ? 'rgba(255,200,255,.12)' : 'rgba(170,230,255,.12)'); gr.addColorStop(1, o.rb ? 'rgba(255,150,230,.45)' : 'rgba(150,220,255,.5)'); g.fillStyle = gr; circ(x, y, R); g.fill();
    if (o.rb) { const cg = g.createConicGradient ? g.createConicGradient(t * 2, x, y) : null; if (cg) { ['#ff5fbf', '#ffc93a', '#3dff9a', '#38c8ff', '#c45cff', '#ff5fbf'].forEach((c2, i) => cg.addColorStop(i / 5, c2)); g.strokeStyle = cg; } else g.strokeStyle = '#ffb0f0'; }
    else g.strokeStyle = 'rgba(220,245,255,.95)';
    g.lineWidth = Math.max(2, R * 0.09); circ(x, y, R); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = Math.max(1.5, R * 0.07); g.beginPath(); g.arc(x, y, R * 0.78, -2.5, -1.7); g.stroke(); g.fillStyle = 'rgba(255,255,255,.9)'; circ(x - R * 0.42, y - R * 0.48, R * 0.09); g.fill();
    // hull pips sit on the rim
    if (o.hp != null) for (let q = 0; q < o.hpMax; q++) { const an = Math.PI * 0.75 + q * 0.32; g.fillStyle = q < o.hp ? '#7affc8' : 'rgba(255,255,255,.18)'; circ(x + Math.cos(an) * R * 1.12, y + Math.sin(an) * R * 1.12, Math.max(2, R * 0.08)); g.fill(); }
    g.globalAlpha = 1;
  }
  // jet of the thrust behind the bubble
  function thrust(x, y, R, t, k, col) { g.save(); g.globalCompositeOperation = 'lighter'; for (let q = 0; q < 3; q++) { const L = R * (1.6 + q * 0.5 + Math.random() * 0.6) * k, w = R * (0.5 - q * 0.12); g.fillStyle = q === 0 ? hex(col || '#5ad1ff', 0.55) : q === 1 ? 'rgba(160,240,255,.6)' : 'rgba(255,255,255,.8)'; g.beginPath(); g.moveTo(x - R * 0.8, y - w); g.quadraticCurveTo(x - R * 0.8 - L * 0.6, y - w * 0.8, x - R * 0.8 - L, y); g.quadraticCurveTo(x - R * 0.8 - L * 0.6, y + w * 0.8, x - R * 0.8, y + w); g.fill(); } g.restore(); }


  /* ---------- characters: the passenger on foot, the cashier's cap, the lab director ---------- */
  // the cashier's red cap on a head of radius r centred at x,y, brim toward face (1 right, -1 left)
  function cap(x, y, r, face) { g.save(); g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = Math.max(1.2, r * 0.22); g.fillStyle = '#f0452f';
    g.beginPath(); g.ellipse(x, y - r * 0.45, r * 1.06, r * 0.78, 0, Math.PI, 0); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(x + face * r * 0.6, y - r * 0.5); g.quadraticCurveTo(x + face * r * 1.7, y - r * 0.55, x + face * r * 1.9, y - r * 0.15); g.lineTo(x + face * r * 0.6, y - r * 0.25); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#fff'; circ(x, y - r * 0.85, r * 0.3); g.fill(); g.restore(); }
  // the stick passenger standing or walking: feet at x,y, unit u, phase ph (null = standing), face 1/-1, s scale
  function walker(x, y, u, t, o) { o = o || {}; const s = (o.s == null ? 1 : o.s) * u, f = o.face || 1, ph = o.ph;
    if (s < 0.05) return;
    const sw = ph == null ? 0 : Math.sin(ph) * 0.55, hip = [x, y - 13 * s], neck = [x + f * 1.2 * s, y - 25 * s], hd = [x + f * 1.8 * s, y - 31 * s], R = 5.6 * s;
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = Math.max(1, 3.2 * s);
    const leg = a => { const kx = hip[0] + Math.sin(a) * 6.5 * s, ky = hip[1] + Math.cos(a) * 6.5 * s, fx = kx + Math.sin(a * 0.6) * 6.5 * s, fy = y - Math.max(0, Math.sin(a) * f) * 1.5 * s; g.beginPath(); g.moveTo(...hip); g.lineTo(kx, ky); g.lineTo(fx, fy); g.stroke(); g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx + f * 2.5 * s, fy); g.stroke(); };
    leg(sw); leg(-sw);
    g.lineWidth = Math.max(1, 4 * s); g.beginPath(); g.moveTo(...hip); g.lineTo(...neck); g.stroke(); g.lineWidth = Math.max(1, 3.2 * s);
    const arm = a => { const ex = neck[0] + Math.sin(a) * 6 * s, ey = neck[1] + 2 * s + Math.cos(a) * 6 * s; g.beginPath(); g.moveTo(neck[0], neck[1] + 2 * s); g.lineTo(ex, ey); g.lineTo(ex + Math.sin(a * 1.4) * 5 * s, ey + 5 * s); g.stroke(); };
    if (o.wave) { arm(-sw); g.beginPath(); g.moveTo(neck[0], neck[1] + 2 * s); g.lineTo(neck[0] + f * 6 * s, neck[1] - 5 * s); g.lineTo(neck[0] + f * (7 + Math.sin(t * 9) * 2) * s, neck[1] - 12 * s); g.stroke(); } else { arm(-sw * 0.8); arm(sw * 0.8); }
    // scarf: a red knot under the chin and a tail streaming behind
    g.strokeStyle = '#f0452f'; g.lineWidth = Math.max(1, 2.4 * s); g.beginPath(); g.moveTo(neck[0], neck[1] - 1 * s); g.quadraticCurveTo(neck[0] - f * 6 * s, neck[1] - 1 * s + Math.sin(t * 9) * 1.5 * s, neck[0] - f * (11 + (ph == null ? 0 : 3)) * s, neck[1] + 2 * s + Math.sin(t * 7) * 2.5 * s); g.stroke();
    g.fillStyle = '#fff6e6'; g.strokeStyle = INK; g.lineWidth = Math.max(1, 2.6 * s); circ(hd[0], hd[1], R); g.fill(); g.stroke();
    if (R > 2.5) { g.fillStyle = INK; const blink = (t % 3.1) < 0.12; for (const e of [0.6, 3.1]) { const ex = hd[0] + f * e * s, ey = hd[1] - 0.9 * s; if (blink) g.fillRect(ex - s, ey, 2 * s, 0.6 * s); else { circ(ex, ey, 0.95 * s); g.fill(); } }
      g.strokeStyle = INK; g.lineWidth = Math.max(1, 1.1 * s); g.beginPath(); g.arc(hd[0] + f * 2 * s, hd[1] + 1.8 * s, 1.5 * s, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); }
    if (o.cap) cap(hd[0], hd[1], R, f);
    g.restore(); }
  // the lab director: white coat, round glasses, white tufts of hair and a moustache, a clipboard; feet at x,y
  function director(x, y, u, t, o) { o = o || {}; const f = o.face || 1, ph = o.ph, sw = ph == null ? 0 : Math.sin(ph) * 0.45, bob = ph == null ? Math.sin(t * 2) * 0.6 * u : Math.abs(Math.sin(ph)) * -1.5 * u;
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = INK;
    const hipY = y - 20 * u + bob, shY = y - 44 * u + bob, hy = shY - 12 * u;
    // legs in dark trousers, brown shoes
    for (const a of [sw, -sw]) { const fx = x + Math.sin(a) * 9 * u; g.lineWidth = 6.5 * u; g.strokeStyle = INK; g.beginPath(); g.moveTo(x + (a > 0 ? 2 : -2) * u, hipY); g.lineTo(fx, y - 3 * u); g.stroke(); g.lineWidth = 6.5 * u - 3; g.strokeStyle = '#3a3a52'; g.stroke(); g.fillStyle = '#6a4424'; g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.ellipse(fx + f * 2.5 * u, y - 2 * u, 5 * u, 2.6 * u, 0, 0, 7); g.fill(); g.stroke(); }
    // white coat over a blue shirt and a red tie
    g.fillStyle = '#ffffff'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(x - 14 * u, hipY + 4 * u); g.lineTo(x - 11 * u, shY + 2 * u); g.quadraticCurveTo(x, shY - 3 * u, x + 11 * u, shY + 2 * u); g.lineTo(x + 14 * u, hipY + 4 * u); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#9ad0ff'; g.beginPath(); g.moveTo(x - 4 * u, shY); g.lineTo(x + 4 * u, shY); g.lineTo(x + 2.5 * u, hipY - 2 * u); g.lineTo(x - 2.5 * u, hipY - 2 * u); g.closePath(); g.fill(); g.lineWidth = 1.5; g.stroke();
    g.fillStyle = '#d8304a'; g.beginPath(); g.moveTo(x - 1.4 * u, shY + 1 * u); g.lineTo(x + 1.4 * u, shY + 1 * u); g.lineTo(x + 1.8 * u, shY + 12 * u); g.lineTo(x, shY + 14 * u); g.lineTo(x - 1.8 * u, shY + 12 * u); g.closePath(); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(43,34,51,.5)'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(x - 5 * u, shY + 2 * u); g.lineTo(x - 4 * u, hipY + 3 * u); g.moveTo(x + 5 * u, shY + 2 * u); g.lineTo(x + 4 * u, hipY + 3 * u); g.stroke();
    g.fillStyle = '#9ad0ff'; g.fillRect(x + 6 * u, shY + 8 * u, 4 * u, 1.5 * u);
    // arms: one holds the clipboard, the other gestures while talking or waves
    const arm = (sx, sy, ex, ey, hx, hy2) => { g.strokeStyle = INK; g.lineWidth = 6.5 * u; g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.lineTo(hx, hy2); g.stroke(); g.strokeStyle = '#ffffff'; g.lineWidth = 6.5 * u - 3.6; g.stroke(); g.fillStyle = '#ffd9b8'; g.strokeStyle = INK; g.lineWidth = 1.8; circ(hx, hy2, 2.9 * u); g.fill(); g.stroke(); };
    const bx = x - f * 13 * u, by = shY + 4 * u; arm(bx, by, bx - f * 3 * u, by + 9 * u, x - f * 4 * u, by + 15 * u);
    g.save(); g.translate(x - f * 5 * u, by + 13 * u); g.rotate(-0.25 * f); g.fillStyle = '#c98b3c'; g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.roundRect(-5 * u, -8 * u, 10 * u, 13 * u, 1.5 * u); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.fillRect(-4 * u, -6 * u, 8 * u, 10 * u); g.fillStyle = 'rgba(43,34,51,.5)'; for (let q = 0; q < 4; q++) g.fillRect(-3 * u, -4.5 * u + q * 2.2 * u, 6 * u, 0.7 * u); g.restore();
    const ax = x + f * 13 * u, ay = shY + 4 * u;
    if (o.wave) arm(ax, ay, ax + f * 6 * u, ay - 6 * u, ax + f * (7 + Math.sin(t * 9) * 2.5) * u, ay - 16 * u);
    else if (o.talk) arm(ax, ay, ax + f * 7 * u, ay + 5 * u, ax + f * (12 + Math.sin(t * 5) * 2) * u, ay - 2 * u + Math.sin(t * 4) * 2 * u);
    else arm(ax, ay, ax + f * 2 * u, ay + 10 * u, ax + f * (1 - sw * 6) * u, ay + 19 * u);
    // head: skin, ears, bald top with white tufts at the sides, round glasses, a moustache
    g.fillStyle = '#ffd9b8'; g.strokeStyle = INK; g.lineWidth = 2.2; for (const sd of [-1, 1]) { circ(x + sd * 10.5 * u, hy + 1.5 * u, 2.6 * u); g.fill(); g.stroke(); }
    g.beginPath(); g.ellipse(x, hy, 10.5 * u, 11.5 * u, 0, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#f4f4f8'; for (const sd of [-1, 1]) for (let q = 0; q < 4; q++) { circ(x + sd * (10 + q * 1.4) * u, hy - (6 - q * 2.5) * u + Math.sin(t * 3 + q) * 0.4 * u, (3.4 - q * 0.3) * u); g.fill(); }
    g.strokeStyle = 'rgba(43,34,51,.35)'; g.lineWidth = 1.2; g.beginPath(); g.arc(x - 2 * u, hy - 7 * u, 3 * u, Math.PI * 1.15, Math.PI * 1.7); g.stroke();
    const lx = f * 1.4 * u, blink = (t % 3.6) < 0.13;
    g.strokeStyle = INK; g.lineWidth = 1.6; g.fillStyle = 'rgba(220,240,255,.55)'; for (const ex0 of [-4.2, 3.6]) { circ(x + ex0 * u + lx, hy + 0.5 * u, 3.4 * u); g.fill(); g.stroke(); g.fillStyle = INK; if (blink) g.fillRect(x + ex0 * u + lx - 1.4 * u, hy + 0.4 * u, 2.8 * u, 0.7 * u); else { circ(x + ex0 * u + lx * 1.4, hy + 0.7 * u, 1.2 * u); g.fill(); } g.fillStyle = 'rgba(220,240,255,.55)'; }
    g.beginPath(); g.moveTo(x - 0.8 * u + lx, hy + 0.5 * u); g.lineTo(x + 0.4 * u + lx, hy + 0.5 * u); g.stroke();
    g.fillStyle = '#f4f4f8'; g.beginPath(); g.ellipse(x - 2.2 * u + lx, hy + 6 * u, 3.6 * u, 1.8 * u, 0.2, 0, 7); g.ellipse(x + 2.2 * u + lx, hy + 6 * u, 3.6 * u, 1.8 * u, -0.2, 0, 7); g.fill(); g.lineWidth = 1.1; g.stroke();
    if (o.talk && Math.floor(t * 7) % 2) { g.fillStyle = '#7a2230'; g.beginPath(); g.ellipse(x + lx, hy + 9 * u, 2 * u, 1.4 * u, 0, 0, 7); g.fill(); }
    g.restore(); }

  /* ---------- the shrink lab under the shop: the stopped screen ---------- */
  // c: charge 0-1 (or -1), win: [lo, hi] of the perfect window, t time, fire 0-1 after release
  function lab(W, H, t, c, win, fire, opt) {
    opt = opt || {};
    const fy = H * 0.78, u = Math.min(1.6, H / 400);
    // back wall: warm tiles, a strip light, posters, shelves with specimen jars
    const wg = g.createLinearGradient(0, 0, 0, fy); wg.addColorStop(0, '#2c2a40'); wg.addColorStop(1, '#3e3a58'); g.fillStyle = wg; g.fillRect(0, 0, W, fy);
    g.strokeStyle = 'rgba(255,255,255,.04)'; g.lineWidth = 1; for (let x = 0; x < W; x += 36 * u) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, fy); g.stroke(); } for (let y = 0; y < fy; y += 36 * u) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    g.fillStyle = '#fffbe0'; g.fillRect(W * 0.2, H * 0.04, W * 0.6, 6 * u); glow(W * 0.5, H * 0.06, W * 0.35, '#fff3c0', 0.12);
    // poster: the scale ladder from the shop floor to the Planck floor
    { const px = W * 0.06, py = H * 0.14, pw = 120 * u, ph = 150 * u; g.fillStyle = '#f4efe0'; g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.roundRect(px, py, pw, ph, 4); g.fill(); g.stroke(); g.fillStyle = INK; g.font = `${11 * u}px sans-serif`; g.textAlign = 'center'; g.fillText('크기의 사다리', px + pw / 2, py + 16 * u);
      const L = ['1cm 바닥', '1mm 먼지', '10μm 세포', '100nm 바이러스', '0.1nm 원자', '10fm 원자핵', '10⁻³⁵m ?']; g.font = `${9 * u}px sans-serif`; g.textAlign = 'left'; L.forEach((s, i) => { g.fillStyle = i === L.length - 1 ? '#c0306a' : '#5a5270'; g.fillText(s, px + 18 * u, py + 34 * u + i * 16 * u); g.fillStyle = mixc('#ffb347', '#7a5aff', i / 6); circ(px + 10 * u, py + 31 * u + i * 16 * u, 3 * u); g.fill(); }); }
    // shelves with jars
    for (let s = 0; s < 2; s++) { const sy = H * (0.22 + s * 0.2), sx = W * 0.54, sw = W * 0.27; g.fillStyle = '#6a5a48'; g.fillRect(sx, sy, sw, 6 * u);
      for (let q = 0; q < 6; q++) { const jx = sx + 12 * u + q * sw / 6, jh = (22 + 10 * hs(q + s * 7)) * u, jw = 16 * u; g.fillStyle = hex(['#5ad1ff', '#4dff9a', '#ff7ad0', '#ffd23a', '#b46bff', '#ff6a4a'][(q + s * 2) % 6], 0.35); g.strokeStyle = 'rgba(220,240,255,.6)'; g.lineWidth = 1.5; g.beginPath(); g.roundRect(jx, sy - jh, jw, jh, 3); g.fill(); g.stroke(); g.fillStyle = '#8a7a68'; g.fillRect(jx - 1, sy - jh - 4 * u, jw + 2, 4 * u);
        g.fillStyle = 'rgba(255,255,255,.55)'; circ(jx + jw * 0.5, sy - jh * 0.45, 2.5 * u + Math.sin(t * 2 + q) * 0.8); g.fill(); } }
    // the entrance from the shop: a wooden door on the back wall, its little sign, open and glowing while someone comes through
    { const dw = 58 * u, dh = 104 * u, dx = W * 0.905 - dw / 2, dy = fy - dh, op = opt.door || 0; g.fillStyle = '#5a3a22'; g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath(); g.roundRect(dx - 6 * u, dy - 6 * u, dw + 12 * u, dh + 6 * u, [10 * u, 10 * u, 0, 0]); g.fill(); g.stroke();
      if (op > 0) { const lg = g.createLinearGradient(0, dy, 0, fy); lg.addColorStop(0, '#fff8e0'); lg.addColorStop(1, '#ffe3a0'); g.fillStyle = lg; g.fillRect(dx, dy, dw, dh); glow(dx + dw / 2, fy - dh * 0.4, dh * 0.9, '#fff3c0', 0.35 * op); }
      g.fillStyle = '#c98b3c'; g.beginPath(); g.moveTo(dx, dy); g.lineTo(dx + dw * (1 - 0.75 * op), dy + 8 * u * op); g.lineTo(dx + dw * (1 - 0.75 * op), fy - 4 * u * op); g.lineTo(dx, fy); g.closePath(); g.fill(); g.stroke();
      if (op < 0.5) { g.fillStyle = '#ffd24a'; circ(dx + dw * 0.8, fy - dh * 0.45, 3 * u); g.fill(); g.stroke(); }
      g.fillStyle = '#f4efe0'; g.beginPath(); g.roundRect(dx + dw / 2 - 30 * u, dy - 30 * u, 60 * u, 18 * u, 4 * u); g.fill(); g.stroke(); g.fillStyle = INK; g.font = `${10 * u}px sans-serif`; g.textAlign = 'center'; g.fillText('마트 출입구', dx + dw / 2, dy - 17.5 * u); }
    // floor: checker tiles in perspective, with the glowing crack on the right
    const fg = g.createLinearGradient(0, fy, 0, H); fg.addColorStop(0, '#5a5470'); fg.addColorStop(1, '#2c2840'); g.fillStyle = fg; g.fillRect(0, fy, W, H - fy);
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1.5; for (let q = -12; q <= 12; q++) { g.beginPath(); g.moveTo(W * 0.5 + q * 50 * u, fy); g.lineTo(W * 0.5 + q * 140 * u, H); g.stroke(); } for (const f of [0.12, 0.32, 0.62]) { const y = fy + (H - fy) * f; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    const crx = W * 0.8, cry = fy + (H - fy) * 0.42;
    { const pu = 0.7 + 0.3 * Math.sin(t * 3); glow(crx, cry, 70 * u, '#9ae8ff', 0.35 * pu + fire * 0.4); g.strokeStyle = '#d0f6ff'; g.lineWidth = 3 * u; g.beginPath(); g.moveTo(crx - 46 * u, cry - 4 * u); g.lineTo(crx - 18 * u, cry + 3 * u); g.lineTo(crx + 2 * u, cry - 3 * u); g.lineTo(crx + 26 * u, cry + 4 * u); g.lineTo(crx + 50 * u, cry - 2 * u); g.stroke();
      g.fillStyle = '#fff'; g.font = `${12 * u}px sans-serif`; g.textAlign = 'center'; g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 2); g.fillText('바닥 틈', crx, cry + 26 * u); g.globalAlpha = 1; }
    if (opt.behind) opt.behind({ fy, u, crx, cry, tx: W * 0.5, ty: fy - 30 * u, dx: W * 0.905 });
    // the shrink ray: a tripod, a barrel with coils, a lens that charges
    const bx = W * 0.2, by = fy - 64 * u;
    g.strokeStyle = INK; g.lineWidth = 4 * u; g.beginPath(); g.moveTo(bx, by + 10 * u); g.lineTo(bx - 26 * u, fy + 4 * u); g.moveTo(bx, by + 10 * u); g.lineTo(bx + 22 * u, fy + 4 * u); g.moveTo(bx, by + 10 * u); g.lineTo(bx, fy + 6 * u); g.stroke();
    g.save(); g.translate(bx, by); g.rotate(0.06); g.fillStyle = '#d8dce6'; g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath(); g.roundRect(-34 * u, -16 * u, 78 * u, 32 * u, 10 * u); g.fill(); g.stroke();
    for (let q = 0; q < 4; q++) { const on = c > 0 && c * 4 > q; g.fillStyle = on ? '#5ad1ff' : '#8a8fa0'; g.beginPath(); g.roundRect(-24 * u + q * 13 * u, -19 * u, 8 * u, 38 * u, 3 * u); g.fill(); g.stroke(); if (on) glow(-20 * u + q * 13 * u, 0, 16 * u, '#5ad1ff', 0.5); }
    g.fillStyle = '#7a8090'; g.beginPath(); g.roundRect(42 * u, -10 * u, 20 * u, 20 * u, 4 * u); g.fill(); g.stroke(); const lc = c > 0 ? c : 0; glow(64 * u, 0, (14 + 30 * lc) * u, '#9ae8ff', 0.3 + 0.6 * lc); g.fillStyle = mixc('#9ae8ff', '#ffffff', lc); circ(64 * u, 0, 8 * u); g.fill(); g.stroke(); g.restore();
    // the target platform with the capsule, and the aiming reticle while charging
    const tx = W * 0.5, ty = fy - 30 * u;
    g.fillStyle = '#4a4660'; g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath(); g.ellipse(tx, fy + 4 * u, 46 * u, 10 * u, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#5ad1ff'; g.globalAlpha = 0.5; g.beginPath(); g.ellipse(tx, fy + 2 * u, 34 * u, 6 * u, 0, 0, TAU); g.fill(); g.globalAlpha = 1;
    const sc = fire > 0 ? Math.max(0, 1 - fire * 1.4) : 1, bob = Math.sin(t * 2) * 3 * u;
    const bs = sc * (opt.bubbleS == null ? 1 : opt.bubbleS); if (bs > 0.02) bubble(tx + (fire > 0 ? fire * fire * (crx - tx) : 0), ty + bob + (fire > 0 ? fire * (cry - ty) : 0), 26 * u * bs, t, { rb: opt.rb, cap: true });
    if (c > 0) { const R = (90 - 70 * Math.min(1.15, c)) * u, inWin = c >= win[0] && c <= win[1];
      g.strokeStyle = inWin ? '#ffd24a' : 'rgba(160,240,255,.9)'; g.lineWidth = inWin ? 4 : 2.5; circ(tx, ty, Math.max(4, R)); g.stroke(); g.setLineDash([6, 6]); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.5; circ(tx, ty, (90 - 70 * (win[0] + win[1]) / 2) * u); g.stroke(); g.setLineDash([]);
      g.strokeStyle = 'rgba(160,240,255,.5)'; g.lineWidth = 2 + 3 * c; g.beginPath(); g.moveTo(bx + 64 * u, by + 4 * u); g.lineTo(tx, ty); g.stroke(); }
    if (fire > 0 && fire < 0.5) { g.strokeStyle = `rgba(200,250,255,${1 - fire * 2})`; g.lineWidth = 10 * u * (1 - fire * 2); g.beginPath(); g.moveTo(bx + 64 * u, by + 4 * u); g.lineTo(tx, ty); g.stroke(); }
    return { crx, cry, tx, ty, fy, u };
  }

  /* ---------- zoom tunnel: nested worlds rushing outward, used for the intro, each launch, and the trip back up ---------- */
  // f 0-1 progress, list of zone palettes to pass through, dir 1 = shrinking (things grow toward the viewer), -1 = growing back
  function tunnel(W, H, f, pals, t, dir) {
    const n = pals.length, pos = Math.min(n - 1.0001, f * (n - 1)), k = Math.floor(pos), fr = pos - k;
    const A = pals[k], B = pals[k + 1] || A, cx = W / 2, cy = H / 2, R = Math.hypot(W, H) / 2;
    g.fillStyle = mixc(A[0], B[0], fr); g.fillRect(0, 0, W, H);
    // rings of the two neighbouring worlds, scaling with the zoom
    for (let L = 0; L < 2; L++) { const P = L ? B : A, base = L ? fr - 1 : fr; for (let q = 0; q < 14; q++) { const s = Math.pow(2.4, q * 0.5 + (dir > 0 ? base : -base) * 7 - 4); const rr = R * s * 0.12; if (rr < 2 || rr > R * 1.4) continue; const a = Math.max(0, Math.min(1, (L ? fr : 1 - fr))) * 0.55;
        g.strokeStyle = hex(q % 2 ? P[2] : P[3], a); g.lineWidth = Math.max(1, rr * 0.05); g.beginPath(); for (let s2 = 0; s2 <= 36; s2++) { const an = s2 / 36 * TAU, w = 1 + 0.08 * Math.sin(an * (3 + q % 4) + t * 2 + q); s2 ? g.lineTo(cx + Math.cos(an) * rr * w, cy + Math.sin(an) * rr * w) : g.moveTo(cx + rr * w, cy); } g.stroke(); } }
    // streaks flying outward
    g.save(); g.globalCompositeOperation = 'lighter'; for (let q = 0; q < 70; q++) { const an = hs(q * 3.1) * TAU, sp = (t * (0.6 + hs(q) * 1.2) * dir + hs(q * 7)) % 1, f1 = dir > 0 ? sp : 1 - sp, r0 = R * Math.pow(f1, 2.2), r1 = r0 * 1.25 + 4;
      g.strokeStyle = hex(B[2], 0.5 * f1); g.lineWidth = 1 + 2 * f1; g.beginPath(); g.moveTo(cx + Math.cos(an) * r0, cy + Math.sin(an) * r0); g.lineTo(cx + Math.cos(an) * r1, cy + Math.sin(an) * r1); g.stroke(); } g.restore();
    glow(cx, cy, R * 0.35, B[2], 0.5);
  }

  // the decimal point at the bottom of everything: a warm, slowly breathing dot with a halo and tiny orbiting sparks
  function dot(x, y, R, t) { glow(x, y, R * 5, '#ffe27a', 0.45); glow(x, y, R * 2.2, '#ffffff', 0.8); g.fillStyle = '#fffbe8'; circ(x, y, R * (1 + 0.06 * Math.sin(t * 3))); g.fill();
    for (let q = 0; q < 6; q++) { const an = t * 1.4 + q * 1.047; g.fillStyle = 'rgba(255,240,180,.9)'; circ(x + Math.cos(an) * R * 2.6, y + Math.sin(an) * R * 1.6, R * 0.16); g.fill(); } }

  return { use, cap, walker, director, backdrop, blocker, rod, gate, ring, grain, crystal, energy, bubble, thrust, lab, tunnel, dot, glow, hex, mixc, hs };
})();
