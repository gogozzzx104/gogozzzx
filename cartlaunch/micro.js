/* 작은 세상 - the screen: an overlay on the cart game's stage with its own canvas, controls, HUD, result card and lab shop.
   It talks to the cart game through window.CARTB (save, sound, music, layout) and is driven by window.MICRO. */
(() => {
'use strict';
const B = window.CARTB; if (!B || typeof MCORE === 'undefined' || typeof MART === 'undefined') return;
const C = MCORE, A = MART, $ = s => document.querySelector(s), root = document.getElementById('root');
const fmt = B.fmt, FONT = B.FONT, f2 = n => n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : fmt(n);
/* Money in the small world is 'minus money': the smaller an amount, the more it is worth.  Inside, light still counts up as before
   (value v); on screen every amount is shown as 1/v won, in coined units below the won, one every ten thousandth (like 만·억·조 the
   other way): 톨 (a speck of dust), 올 (a thread), 티 (a mote), 낟 (a grain), 찰 (an instant), 숨 (a breath), 결 (a ripple), 무 (next to
   nothing).  Earning makes the wallet smaller; a price can be paid when the wallet is at or below it; prices shrink level by level. */
const MONEY = [[-4, '톨', '먼지 한 톨'], [-8, '올', '실 한 올'], [-12, '티', '티끌 하나'], [-16, '낟', '낟알 하나'], [-20, '찰', '찰나의 반짝임'], [-24, '숨', '숨결 한 번'], [-28, '결', '물결 한 줄'], [-32, '무', '거의 없음(無)']];
const nfmt = n => n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : Math.round(n).toLocaleString('ko-KR');
// an amount in won, written with the small units
function won(a) { if (!isFinite(a) || a > 1e12) return '텅 빔'; if (a >= 1) return nfmt(a) + '원'; for (const [e, u] of MONEY) if (a >= Math.pow(10, e)) return nfmt(a / Math.pow(10, e)) + u; const n = a / 1e-32; return (n > 0 ? n.toExponential(1) : '0') + '무'; }
// a value of light as minus money
const mny = v => won(v > 1e-12 ? 1 / v : Infinity);

/* ---------------- DOM ---------------- */
const css = document.createElement('style');
css.textContent = `
#micro{position:absolute;inset:0;z-index:4;overflow:hidden;background:#141024;transition:transform .45s cubic-bezier(.6,0,.3,1)}
#micro.slideR{transform:translateX(100%)} #micro.slideL{transform:translateX(-100%)}
#micro canvas{position:absolute;left:0;top:0;width:100%;height:100%;touch-action:none}
.micro-on #shopBtn,.micro-on #optBtn{display:none}
.micro-on #topbar{z-index:6}
#mTop{position:absolute;left:10px;top:8px;display:flex;gap:6px;align-items:center;z-index:2;zoom:var(--hk,1)}
#mTop .goldv{font-size:17px}
#mTop .goldv.cr{color:#bff4ff}#mTop .goldv.cr::before{background:radial-gradient(circle at 35% 30%,#fff,#9ae8ff 60%);border-radius:3px;transform:rotate(45deg)}
.mlight::before{content:"⊖"!important;background:none!important;border:0!important;width:auto!important;height:auto!important;color:#ffe27a;margin-right:5px!important;vertical-align:0!important}
#mBack{position:absolute;left:0;top:50%;transform:translateY(-50%);z-index:2;border:3px solid #2b2233;border-left:0;border-radius:0 16px 16px 0;background:linear-gradient(#ffd75e,#f5a614);color:#2b2233;font:20px var(--disp);padding:14px 10px 14px 6px;box-shadow:3px 4px 0 #2b2233;display:flex;flex-direction:column;align-items:center;gap:2px;zoom:var(--hk,1)}
#mBack small{font:700 10px var(--body);writing-mode:vertical-rl;letter-spacing:1px}
#mBack:active{transform:translateY(-50%) translateX(-3px)}
#mBoost{right:18px;bottom:20px;width:96px;height:96px;background:#2aa7d8;color:#fff}
#mBoost small{color:#dff5ff}
#mPulse{right:32px;bottom:130px;width:70px;height:70px;background:#ff8a2a;color:#fff;font-size:15px}
#mPulse small{color:#fff0dc}
#mBlink{left:18px;bottom:20px;width:84px;height:84px;background:#8a4dff;color:#fff;font-size:15px}
#mBlink small{color:#eadcff}
#mShrink{left:28px;bottom:116px;width:66px;height:66px;background:#12a594;color:#fff;font-size:14px}
#mShrink small{color:#d3fff7}
#micro .hbtn{zoom:var(--hk,1)}
#mResult h2{color:#2aa7d8}
#mResult .big{font:28px var(--disp);color:#2b2233}
#mResult .big small{display:block;font:700 12px var(--body);color:#7a6f80}
#mShop{position:absolute;left:0;top:0;width:calc(100% / var(--k,1));height:calc(100% / var(--k,1));transform:scale(var(--k,1));transform-origin:0 0;display:grid;grid-template-rows:auto 1fr;color:#e8f6ff;background:radial-gradient(120% 90% at 25% 0%,#1e3a5a 0%,#122238 55%,#0a1424 100%);z-index:3}
#mShop .shead{background:linear-gradient(#1c3352,#152740);border-bottom-color:#2e5a86}
#mShop .shead h2{color:#9ae8ff}
#mShop .pill{background:linear-gradient(#9ae8ff,#4ab8e8);border-color:#0d0a1c;box-shadow:0 3px 0 #0d0a1c;white-space:nowrap}
#mShop .goldv{background:#0a1424;border-color:#2e5a86}
.msb{display:grid;grid-template-columns:auto 1fr;min-height:0}
.mtabs{display:flex;flex-direction:column;gap:6px;padding:8px;overflow:auto;border-right:2px solid #1e3a5a}
.mtabs button{border:2px solid #2e5a86;border-radius:10px;background:#13263e;color:#cfe8ff;font:15px var(--disp);padding:6px 12px;text-align:left;white-space:nowrap;position:relative}
.mtabs button.on{background:#9ae8ff;color:#0d0a1c;border-color:#0d0a1c}
.mtabs button i{position:absolute;right:-5px;top:-6px;background:#ff5a5a;color:#fff;font:700 10px sans-serif;border-radius:9px;padding:1px 5px;font-style:normal}
.mlist{overflow:auto;padding:10px 12px;display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:8px;align-content:start}
.mlist .bh{grid-column:1/-1;font:16px var(--disp);color:#9ae8ff;margin:4px 0 0}
.mlist .note{grid-column:1/-1;margin:0;font-size:12px;color:#9ab8d0;line-height:1.45}
.mc{border:2px solid #2e5a86;border-radius:10px;background:linear-gradient(160deg,#16304e,#0f2038);padding:7px 9px;display:flex;flex-direction:column;gap:3px;min-width:0}
.mc h3{margin:0;font:15px/1.15 var(--disp);color:#fff;display:flex;gap:6px;align-items:baseline}
.mc h3 small{margin-left:auto;font:700 10.5px var(--body);color:#9ae8ff;white-space:nowrap}
.mc p{margin:0;font-size:11px;line-height:1.35;color:#a8c4dc}
.mc .ev{color:#fff;font-weight:700;font-size:11.5px}
.mc button{margin-top:auto;border:2px solid #0d0a1c;border-radius:8px;background:linear-gradient(#ffd75e,#f5a614);font:14px var(--disp);color:#2b2233;padding:4px 6px;box-shadow:0 3px 0 #0d0a1c}
.mc button:disabled{background:#3a4a5e;color:#8aa0b8;box-shadow:none}
.mc.can{border-color:#ffd24a;box-shadow:0 0 10px rgba(255,210,74,.25)}
.mc.lock{opacity:.55;border-style:dashed}
.mc.mx{border-color:#5affc0}
.mc.zone{border-left:6px solid var(--zc,#9ae8ff)}
.mc.cr button{background:linear-gradient(#dff8ff,#7fd8ff)}
.mbar{height:5px;border-radius:3px;background:#0a1424;overflow:hidden}.mbar b{display:block;height:100%;background:#9ae8ff}
#mCard{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:5;text-align:center;color:#fff;pointer-events:none;opacity:0;transition:opacity .6s}
#mCard.show{opacity:1}
#mCard h1{font:min(56px,7vw) var(--disp);white-space:nowrap;margin:0;color:#ffe27a;text-shadow:0 4px 0 #2b2233,0 0 24px rgba(255,220,120,.5)}
#mCard p{font:min(20px,3.2vw) var(--disp);margin:8px 0 0;text-shadow:0 2px 0 #2b2233}
#mCard p.s{font:700 13px var(--body);opacity:.85}
#mHint{position:absolute;left:50%;bottom:5%;transform:translateX(-50%);z-index:2;font:16px var(--disp);color:#fff;text-shadow:0 2px 0 #2b2233;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .4s;zoom:var(--hk,1)}
#mHint.show{opacity:1}
#mOpen{position:absolute;right:10px;top:46px;z-index:2;zoom:var(--hk,1);display:flex;gap:6px}
`;
document.head.appendChild(css);
const el = document.createElement('div'); el.id = 'micro'; el.hidden = true;
el.innerHTML = `<canvas id="mcv"></canvas>
<div id="mTop"><span class="goldv mlight" id="mLight"></span><span class="goldv cr" id="mCrys" hidden></span></div>
<div id="mOpen"><button class="pill" id="mShopBtn" type="button">연구소</button></div>
<button id="mBack" type="button" title="카트 발사대로">◀<small>카트 발사대</small></button>
<button class="hbtn" id="mBoost" type="button" data-key="Space" hidden>추진<small></small></button>
<button class="hbtn" id="mPulse" type="button" data-key="E" hidden>펄스<small></small></button>
<button class="hbtn" id="mBlink" type="button" data-key="Q" hidden>도약<small></small></button>
<button class="hbtn" id="mShrink" type="button" data-key="R" hidden>수축<small></small></button>
<div id="mHint"></div>
<section class="card" id="mResult" hidden><div class="rtop"><h2 id="mWhy"></h2><div class="big" id="mDist"></div></div><div class="rbody"><div class="tags" id="mTags"></div><div class="rows" id="mRows"></div></div><div class="btns"><button class="go alt" id="mRShop" type="button">연구소</button><button class="go" id="mAgain" type="button">다시 축소</button></div></section>
<section id="mShop" hidden><div class="shead"><h2>축소 연구소</h2><span class="goldv mlight" id="mSL"></span><span class="goldv cr" id="mSC" hidden></span><button class="pill" id="mAll" type="button">모두 구매</button><button class="pill" id="mClose" type="button">돌아가기</button></div><div class="msb"><div class="mtabs" id="mTabs"></div><div class="mlist" id="mList"></div></div></section>
<div id="mCard"></div>`;
root.appendChild(el);
const cv = $('#mcv'); let g = cv.getContext('2d'); A.use(g);
const bBoost = $('#mBoost'), bPulse = $('#mPulse'), bBlink = $('#mBlink'), bShrink = $('#mShrink'), card = $('#mCard'), hint = $('#mHint');

/* ---------------- save ---------------- */
const M = () => { const S = B.S; if (!S.micro) S.micro = C.newSave(); return C.fix(S.micro); };
const save = () => { try { B.save(); } catch (e) {} };

/* ---------------- sound and music ---------------- */
Object.assign(B.MUS.T, {
  mlab: [50, 'lyd', 84, [0, 4, 1, 5], 'sine', 'sine', 0, 0.35, 1], mtile: [48, 'maj', 112, [0, 3, 4, 0], 'triangle', 'triangle', 1, 0.45], mfiber: [50, 'dor', 104, [0, 3, 0, 4], 'sine', 'triangle', 1, 0.4],
  mpollen: [55, 'maj', 120, [0, 4, 5, 3], 'triangle', 'triangle', 2, 0.5, 1], mcell: [47, 'lyd', 96, [0, 1, 4, 0], 'sine', 'sine', 1, 0.4, 1], mvirus: [45, 'phr', 118, [0, 1, 0, 5], 'square', 'sawtooth', 2, 0.5],
  mdna: [52, 'mix', 126, [0, 6, 3, 4], 'triangle', 'sawtooth', 2, 0.55, 1], matom: [49, 'lyd', 100, [0, 4, 1, 4], 'sine', 'sine', 1, 0.45, 1], mvoid: [45, 'min', 66, [0, 3, 5, 4], 'sine', 'sine', 0, 0.3, 1],
  mnuc: [44, 'har', 134, [0, 3, 4, 0], 'sawtooth', 'sawtooth', 2, 0.55], mquark: [51, 'dor', 140, [0, 3, 6, 4], 'square', 'sawtooth', 2, 0.6, 1], mweak: [47, 'phr', 110, [0, 1, 3, 1], 'sawtooth', 'sine', 1, 0.4, 1],
  mstring: [53, 'lyd', 90, [0, 2, 4, 1], 'sine', 'sine', 0, 0.4, 1], mfoam: [48, 'lyd', 72, [0, 4, 5, 1], 'triangle', 'sine', 0, 0.35, 1] });
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
const SND = {
  grain: n => { const f = 880 * Math.pow(2, PENTA[Math.min(PENTA.length - 1, n % 11)] / 12); B.tone(f, f * 1.01, 0.09, 0.035, 'sine'); },
  big: () => { [0, 4, 7, 12].forEach((s, i) => B.tone(660 * Math.pow(2, s / 12), 660 * Math.pow(2, s / 12), 0.18, 0.05, 'triangle', i * 0.05)); },
  en: () => { B.tone(420, 840, 0.22, 0.06, 'sine'); },
  near: () => { B.noise(0.12, 0.05, 2600); B.tone(1300, 1700, 0.06, 0.02, 'sine'); },
  ring: pf => { B.tone(pf ? 1046 : 784, pf ? 1568 : 1046, 0.22, 0.06, 'triangle'); if (pf) B.tone(2093, 2093, 0.3, 0.03, 'sine', 0.06); },
  smash: () => { B.noise(0.07, 0.07, 900); },
  hit: () => { B.noise(0.25, 0.25, 500); B.tone(180, 60, 0.25, 0.18, 'sine'); try { B.buzz(40); } catch (e) {} },
  pulse: () => { B.noise(0.3, 0.12, 1800); B.tone(300, 1200, 0.25, 0.08, 'sawtooth'); },
  blink: () => { B.tone(2200, 300, 0.18, 0.07, 'square'); B.noise(0.15, 0.08, 4000); },
  shrink: () => { B.tone(900, 300, 0.22, 0.08, 'sine'); },
  zone: () => { [0, 7, 12].forEach((s, i) => B.tone(523 * Math.pow(2, s / 12), 523 * Math.pow(2, s / 12), 0.35, 0.05, 'sine', i * 0.09)); },
  charge: c => B.tone(300 + 900 * c, 310 + 900 * c, 0.05, 0.02, 'sine'),
  fire: () => { B.tone(1800, 120, 0.6, 0.12, 'sawtooth'); B.noise(0.5, 0.18, 3000); },
  perfect: () => { [0, 4, 7, 12, 16].forEach((s, i) => B.tone(784 * Math.pow(2, s / 12), 784 * Math.pow(2, s / 12), 0.25, 0.05, 'triangle', i * 0.04)); },
  pop: () => { B.tone(600, 1400, 0.08, 0.1, 'sine'); B.noise(0.2, 0.15, 3000); },
  out: () => { B.tone(500, 200, 0.6, 0.08, 'sine'); },
  super: () => { [0, 4, 7, 11, 14].forEach((s, i) => B.tone(440 * Math.pow(2, s / 12), 880 * Math.pow(2, s / 12), 0.3, 0.05, 'triangle', i * 0.05)); },
  buy: () => B.tone(700, 1100, 0.1, 0.06, 'triangle'),
  found: () => { [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => B.tone(523 * Math.pow(2, s / 12), 523 * Math.pow(2, s / 12), 0.9, 0.05, 'triangle', i * 0.11)); B.noise(1.4, 0.2, 2400); }
};

/* ---------------- layout ---------------- */
let W = 800, H = 400, DPR = 1;
function size() { W = B.W; H = B.H; DPR = B.DPR; cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); }
addEventListener('resize', () => setTimeout(size, 30));

/* ---------------- state ---------------- */
// mode: lab, charge, fire, run, over (short pause before the card), result, shop, intro, found (the trip back up)
let on = false, mode = 'lab', run = null, charge = 0, fireT = 0, quality = 0, last = 0, T0 = performance.now(), shopTab = 'gear', confirmRecon = false;
let fx = [], pops = [], shake = 0, flash = 0, flashCol = '#fff', scroll = 0, zk = 1, camY = 0, banner = null, lightPop = { v: 0, t: -9 }, introT = 0, foundT = 0, overT = 0, tunT = -9, trail = [];
let keys = new Set(), ptrY = null, boostHeld = false, tapPulse = false, tapBlink = false, tapShrink = false, seenHint = {};
const now = () => performance.now() / 1000;

function showHint(t, ms = 2600) { hint.textContent = t; hint.classList.add('show'); clearTimeout(showHint.h); showHint.h = setTimeout(() => hint.classList.remove('show'), ms); }
function bigCard(h, p, s, ms) { card.innerHTML = `<h1>${h}</h1>${p ? `<p>${p}</p>` : ''}${s ? `<p class="s">${s}</p>` : ''}`; card.classList.add('show'); clearTimeout(bigCard.h); if (ms) bigCard.h = setTimeout(() => card.classList.remove('show'), ms); }
function hud() { const m = M(); $('#mLight').textContent = mny(m.light); const cr = $('#mCrys'); cr.hidden = !(m.crys > 0 || m.recons > 0); cr.textContent = fmt(m.crys); }
function flyUI(v) { for (const b of [bBoost, bPulse, bBlink, bShrink]) b.hidden = !v; $('#mBack').hidden = v || mode === 'intro'; $('#mOpen').hidden = v; $('#mTop').hidden = v; if (v) hint.classList.remove('show'); }

/* ---------------- enter / leave ---------------- */
function enter(o) { o = o || {}; if (on && !o.intro) return; on = true; size(); root.classList.add('micro-on'); el.hidden = false; const m = M(); m.open = 1;
  try { localStorage.setItem('cart.mode', 'micro'); } catch (e) {}
  $('#mResult').hidden = true; $('#mShop').hidden = true; card.classList.remove('show');
  if (o.intro) { mode = 'intro'; introT = now(); flyUI(false); $('#mBack').hidden = true; $('#mOpen').hidden = true; $('#mTop').hidden = true; }
  else { toLab(); if (o.slide) { el.classList.add('slideR'); void el.offsetWidth; el.classList.remove('slideR'); } }
  if (o.returned) setTimeout(() => bigCard('찾아 주셔서 고마워요!', '작은 세상 · 완료', '계속 더 깊이, 더 빠르게 내려가 볼 수 있어요', 4200), 400);
  hud(); last = performance.now(); save(); requestAnimationFrame(loop); }
function leave() { if (!on) return; el.classList.add('slideR'); setTimeout(() => { on = false; el.hidden = true; el.classList.remove('slideR'); root.classList.remove('micro-on'); try { localStorage.setItem('cart.mode', 'cart'); } catch (e) {} try { B.toAim(); } catch (e) {} }, 430); }
function toLab() { mode = 'lab'; run = null; charge = 0; fireT = 0; flyUI(false); $('#mResult').hidden = true; $('#mShop').hidden = true; B.MUS.want('mlab'); hud();
  const m = M(); if (!seenHint.lab && m.runs < 2) { seenHint.lab = 1; setTimeout(() => showHint(B.portrait || !matchMedia('(pointer: fine)').matches ? '화면을 누르고 있다가, 고리가 점선에 겹칠 때 떼세요' : 'Space를 누르고 있다가, 고리가 점선에 겹칠 때 떼세요', 4200), 600); } }

/* ---------------- charge and launch ---------------- */
function startCharge() { if (mode !== 'lab') return; mode = 'charge'; charge = 0; }
function release() { if (mode !== 'charge') return; const st = C.stats(M()), mid = 0.86, d = Math.abs(charge - mid); quality = d <= st.perfW ? 2 : d <= 0.1 ? 1 : 0; mode = 'fire'; fireT = now(); SND.fire();
  if (quality === 2) { SND.perfect(); bigCard('완벽 축소!', '', '', 900); } else if (quality === 1) bigCard('좋아요', '', '', 700); }
function begin() { const m = M(); run = C.newRun(m, quality); mode = 'run'; tunT = now(); fx = []; pops = []; trail = []; scroll = 0; zk = 1; banner = null; lightPop = { v: 0, t: -9 }; flyUI(true); updBtns();
  B.MUS.want(C.ZONES[0].tune); showZone(0, true); if (m.runs < 3) setTimeout(() => showHint(matchMedia('(pointer: fine)').matches ? '↑↓(W·S)로 위아래 · Space 추진 · E 펄스' : '화면을 눌러 끄는 쪽으로 움직여요 · 버튼으로 추진·펄스', 4200), 900); }
function showZone(z, first) { const Z = C.ZONES[z], m = M(), fresh = z > (m.seenZone || 0); if (fresh) m.seenZone = z; banner = { z, t: now(), fresh, first }; if (!first) SND.zone(); B.MUS.want(Z.tune); }
function updBtns() { if (!run) return; const st = run.st; bPulse.querySelector('small').textContent = run.pulses + '회'; bPulse.disabled = !run.pulses;
  bBlink.hidden = mode !== 'run' || !st.blinks; bBlink.querySelector('small').textContent = run.blinks + '회'; bBlink.disabled = !run.blinks;
  bShrink.hidden = mode !== 'run' || !st.shrinks; bShrink.querySelector('small').textContent = run.shT > 0 ? run.shT.toFixed(1) + '초' : run.shrinks + '회'; bShrink.disabled = !run.shrinks && run.shT <= 0;
  bBoost.querySelector('small').textContent = Math.round(100 * run.fuel / st.fuel) + '%'; }

/* ---------------- input ---------------- */
const locX = e => B.locX(e), locY = e => B.locY(e);
cv.addEventListener('pointerdown', e => { e.preventDefault(); try { B.snd(); } catch (er) {} try { cv.setPointerCapture(e.pointerId); } catch (er) {}
  if (mode === 'intro' && now() - introT > 17.4) { finishIntro(); return; } if (mode === 'lab') { startCharge(); return; } if (mode === 'run') ptrY = locY(e); });
cv.addEventListener('pointermove', e => { if (mode === 'run' && ptrY != null) ptrY = locY(e); });
const up = () => { ptrY = null; if (mode === 'charge') release(); };
cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
const hold = (b, on2, off) => { b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); b.classList.add('down'); on2(); }); const o2 = e => { b.classList.remove('down'); if (off) off(); }; b.addEventListener('pointerup', o2); b.addEventListener('pointercancel', o2); b.addEventListener('pointerleave', o2); };
hold(bBoost, () => { boostHeld = true; }, () => { boostHeld = false; }); hold(bPulse, () => { tapPulse = true; }); hold(bBlink, () => { tapBlink = true; }); hold(bShrink, () => { tapShrink = true; });
addEventListener('keydown', e => { if (!on) return; if (e.target && e.target.closest && e.target.closest('textarea, input')) return; if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault(); keys.add(e.code); if (e.repeat) return;
  if (mode === 'intro') { if (now() - introT > 17.4) finishIntro(); return; }
  if (!$('#mShop').hidden) { if (e.code === 'Escape') closeShop(); return; }
  if (e.code === 'Space') { if (mode === 'lab') startCharge(); else if (mode === 'run') boostHeld = true; else if (mode === 'result') again(); }
  if (mode === 'run') { if (e.code === 'KeyE') tapPulse = true; if (e.code === 'KeyQ') tapBlink = true; if (e.code === 'KeyR') tapShrink = true; }
  if (mode === 'result' && e.code === 'KeyU') openShop(); if (mode === 'lab' && e.code === 'KeyU') openShop(); if (mode === 'lab' && e.code === 'ArrowLeft') leave(); });
addEventListener('keyup', e => { if (!on) return; keys.delete(e.code); if (e.code === 'Space') { boostHeld = false; if (mode === 'charge') release(); } });
$('#mBack').addEventListener('click', e => { e.stopPropagation(); leave(); });
$('#mShopBtn').addEventListener('click', e => { e.stopPropagation(); openShop(); });
$('#mRShop').addEventListener('click', openShop); $('#mAgain').addEventListener('click', again);
$('#mClose').addEventListener('click', closeShop); $('#mAll').addEventListener('click', () => { const n = C.buyAll(M()); if (n) { SND.buy(); save(); } renderShop(); hud(); });
function again() { toLab(); }

/* ---------------- the loop ---------------- */
function loop(t) { if (!on) return; requestAnimationFrame(loop); if (!$('#mShop').hidden) { last = t; return; }
  const dt = Math.min(0.05, (t - last) / 1000); last = t; const tm = now() - T0 / 1000;
  g.setTransform(DPR, 0, 0, DPR, 0, 0); A.use(g);
  if (mode === 'intro') { drawIntro(now() - introT); return; }
  if (mode === 'found') { drawFound(now() - foundT, dt); return; }
  if (mode === 'lab' || mode === 'charge' || mode === 'fire') { labStep(dt, tm); return; }
  if (run) runStep(dt, tm);
}
function labStep(dt, tm) {
  if (mode === 'charge') { const c0 = charge; charge += dt / 1.1; if (Math.floor(c0 * 12) !== Math.floor(charge * 12)) SND.charge(charge); if (charge >= 1.12) release(); }
  const st = C.stats(M()), fire = mode === 'fire' ? Math.min(1, (now() - fireT) / 0.9) : 0;
  g.save(); if (shake > 0.3) { g.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake); shake *= 0.9; }
  A.lab(W, H, tm, mode === 'charge' ? charge : -1, [0.86 - st.perfW, 0.86 + st.perfW], fire, { rb: rbOn(), behind: G => A.director(W * DIR_X, G.fy, G.u * 1.15, tm, { face: -1, wave: mode === 'fire' }) }); g.restore();
  // a few lines on the wall: where the run stands
  const m = M();
  const bz = Math.min(C.ZN - 1, Math.floor(m.best)), sl = C.sizeLabel(C.lgAt(m.best)); txt(m.best > 0 ? `최고 깊이 · ${C.ZONES[bz].name}` : '축소 연구소', W * 0.5, H * 0.12, 'center', Math.min(24, H * 0.055), '#ffe27a');
  if (m.best > 0) txt(`${sl.num} ${sl.unit}${sl.east ? ' · ' + sl.east : ''}`, W * 0.5, H * 0.12 + Math.min(26, H * 0.06), 'center', Math.min(15, H * 0.04), '#cfe8ff');
  drawFx(dt);
  if (mode === 'fire' && fire >= 1) begin();
}
function txt(s, x, y, al, sz, col) { g.textAlign = al; g.font = `${sz}px ${FONT}`; g.lineJoin = 'round'; g.lineWidth = Math.max(3, sz * 0.22); g.strokeStyle = '#2b2233'; g.strokeText(s, x, y); g.fillStyle = col; g.fillText(s, x, y); }
const RBC = ['#ff5fbf', '#ffc93a', '#3dff9a', '#38c8ff', '#c45cff'];
const rbOn = () => { try { return !!B.rbOn(); } catch (e) { return false; } };

/* ---------------- a run ---------------- */
function runStep(dt, tm) {
  const r = run, st = r.st;
  if (mode === 'run') {
    const dir = (keys.has('ArrowDown') || keys.has('KeyS') ? 1 : 0) - (keys.has('ArrowUp') || keys.has('KeyW') ? 1 : 0);
    const ppm0 = ppmNow(), ty = ptrY != null ? (ptrY - H / 2) / ppm0 + camY : null;
    C.step(r, dt, { dir, ty, boost: boostHeld, pulse: tapPulse, blink: tapBlink, shrink: tapShrink }); tapPulse = tapBlink = tapShrink = false;
    for (const e of r.ev) onEv(e);
    updBtns();
    if (r.over) { if (r.found) { startFound(); return; } mode = 'over'; overT = now(); flyUI(false); boostHeld = false; }
  } else if (mode === 'over' && now() - overT > 1.1) { showResult(); }
  drawRun(dt, tm);
}
const ppmNow = () => (H * 0.84) / (2 * C.HH) / zk;
function onEv(e) { const r = run, sx = e.x != null ? SX(e.x) : bx(), sy = e.y != null ? SY(e.y) : by();
  switch (e.k) {
    case 'lt': SND.grain(r.combo); burst(sx, sy, 4, rbOn() ? ['#ff5fbf', '#ffc93a', '#3dff9a', '#38c8ff'] : ['#fff3b0', '#ffd24a'], 140, 0.35); gain(e.g); break;
    case 'big': SND.big(); burst(sx, sy, 14, ['#ffffff', '#9ae8ff', '#c28cff'], 260, 0.7); ringFx(sx, sy, '#9ae8ff', 60); gain(e.g); break;
    case 'en': SND.en(); ringFx(sx, sy, '#5affc0', 40); pop('+에너지', '#7affc8'); break;
    case 'near': SND.near(); pop('스침!', '#bff4ff', 0.6); streak(); break;
    case 'ring': SND.ring(e.pf); ringFx(sx, sy, e.pf ? '#ffffff' : '#8cf0ff', e.pf ? 90 : 60); if (e.pf) pop('정확 통과!', '#ffffff'); break;
    case 'smash': SND.smash(); burst(sx, sy, 6, C.ZONES[e.z || 0].pal.slice(1), 260, 0.45); shake = Math.max(shake, 2); break;
    case 'hit': SND.hit(); flash = 0.45; flashCol = '#ff4a4a'; shake = 12; burst(bx(), by(), 12, ['#ffffff', '#9ae8ff'], 260, 0.5); pop('쿵!', '#ff8a8a'); break;
    case 'pulse': SND.pulse(); ringFx(bx(), by(), '#ffb05a', 120, 0.5); flash = 0.18; flashCol = '#ffd0a0'; break;
    case 'blink': SND.blink(); flash = 0.35; flashCol = '#d0b0ff'; fx.push({ k: 'beam', t: 0, life: 0.4, x0: SX(e.from), y: by() }); break;
    case 'shrink': SND.shrink(); ringFx(bx(), by(), '#5affc0', 50, 0.4); break;
    case 'zone': showZone(e.z, false); flash = 0.25; flashCol = C.ZONES[e.z].pal[2]; break;
    case 'super': SND.super(); flash = 0.6; flashCol = '#ffffff'; pop('양자 중첩!', '#ffe27a'); ringFx(bx(), by(), '#ffe27a', 160, 0.7); break;
    case 'pop': SND.pop(); burst(bx(), by(), 22, ['#ffffff', '#bfefff'], 320, 0.8); break;
    case 'out': SND.out(); break;
    case 'found': break;
  } }
function gain(v) { const t = now(); if (t - lightPop.t > 0.5) lightPop.v = 0; lightPop.v += v; lightPop.t = t; }
let nearStreak = 0, nearT = 0; function streak() { const t = now(); nearStreak = t - nearT < 1.5 ? nearStreak + 1 : 1; nearT = t; if (nearStreak >= 5 && nearStreak % 5 === 0) pop(`스침 ${nearStreak}연속!`, '#ffe27a'); }
const bx = () => W * 0.24, by = () => H / 2 + (run.y - camY) * ppmNow();
const SX = x => bx() + (x - run.X) * ppmNow(), SY = y => H / 2 + (y - camY) * ppmNow();
function pop(s, col, life = 0.9) { pops.push({ s, col, t: 0, life, x: bx() + 30, y: by() - 30 - pops.length % 3 * 16 }); if (pops.length > 8) pops.shift(); }
function burst(x, y, n, cols, spd, life) { if (fx.length > 380) return; for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = spd * (0.3 + Math.random() * 0.7); fx.push({ k: 's', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: life * (0.6 + Math.random() * 0.6), c: cols[i % cols.length], z: 2 + Math.random() * 3 }); } }
function ringFx(x, y, c, r1, life = 0.45) { fx.push({ k: 'r', x, y, c, r1, t: 0, life }); }
function drawFx(dt) { g.save(); g.globalCompositeOperation = 'lighter';
  for (const f of fx) { f.t += dt; const q = 1 - f.t / f.life; if (q <= 0) continue;
    if (f.k === 's') { f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 1 - dt * 2; f.vy *= 1 - dt * 2; g.globalAlpha = q; g.fillStyle = f.c; g.fillRect(f.x - f.z / 2, f.y - f.z / 2, f.z, f.z); }
    else if (f.k === 'r') { g.globalAlpha = q; g.strokeStyle = f.c; g.lineWidth = 2 + 4 * q; g.beginPath(); g.arc(f.x, f.y, 8 + f.r1 * (1 - q * q), 0, 6.283); g.stroke(); }
    else if (f.k === 'beam') { g.globalAlpha = q; g.strokeStyle = '#d0b0ff'; g.lineWidth = 14 * q; g.beginPath(); g.moveTo(Math.max(-20, f.x0), f.y); g.lineTo(bx(), f.y); g.stroke(); } }
  g.restore(); g.globalAlpha = 1; fx = fx.filter(f => f.t < f.life);
  for (const p of pops) { p.t += dt; const a = Math.max(0, Math.min(1, (p.life - p.t) * 3)); g.globalAlpha = a; txt(p.s, p.x, p.y - p.t * 40, 'left', 16, p.col); } g.globalAlpha = 1; pops = pops.filter(p => p.t < p.life);
  if (flash > 0.01) { g.globalAlpha = Math.min(0.6, flash); g.fillStyle = flashCol; g.fillRect(0, 0, W, H); g.globalAlpha = 1; flash *= Math.pow(0.002, dt); } }

function drawRun(dt, tm) {
  const r = run, st = r.st, p = r.X / C.LEN, z = Math.min(C.ZN - 1, Math.floor(p)), Z = C.ZONES[z], fr = p - z, Zn = C.ZONES[Math.min(C.ZN - 1, z + 1)];
  // the view widens with speed so there is time to react; the camera follows the capsule's height loosely
  const zt = Math.max(1, Math.min(1.6, 1 + (r.v - 45) / 150)); zk += (zt - zk) * Math.min(1, dt * 2.5);
  const ppm = ppmNow(), half = (H / 2) / ppm; camY += (Math.max(-C.HH + half * 0.75, Math.min(C.HH - half * 0.75, r.y * 0.5)) - camY) * Math.min(1, dt * 4); if (half >= C.HH) camY = 0;
  scroll += Math.min(r.v, 400) * ppm * dt;
  const pal = fr > 0.92 ? Z.pal.map((c, i) => A.mixc(c, Zn.pal[i], (fr - 0.92) / 0.08)) : Z.pal;
  g.save(); if (shake > 0.3) { g.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake); shake *= Math.pow(0.02, dt); }
  const top = SY(-C.HH) - C.RB * ppm, bot = SY(C.HH) + C.RB * ppm;
  A.backdrop(W, H, Z, pal, scroll, tm, top, bot, 1);
  // objects across the view
  const x0 = r.X - bx() / ppm - 4, x1 = r.X + (W - bx()) / ppm + 4;
  for (let i = Math.floor(x0 / C.CW); i <= Math.floor(x1 / C.CW); i++) for (const o of C.cellObjs(r, i)) { if (r.used.has(o.id)) continue; const sx = SX(o.x); if (sx < -80 || sx > W + 80) continue; const oz = C.ZONES[o.z], op = oz.pal;
    if (o.t === 'b') A.blocker(oz.style, o, sx, SY(C.objY(o, r.tr)), o.r * ppm, ppm, tm, op);
    else if (o.t === 'rod') A.rod(oz.style, o, sx, SY(o.y), o.L * ppm, o.r * ppm, o.a0 + o.w * r.tr, op, tm);
    else if (o.t === 'gate') A.gate(oz.style, sx, top, bot, SY(o.y), o.gw * ppm, o.r * ppm, op, tm);
    else if (o.t === 'ring') A.ring(sx, SY(o.y), o.r * ppm, tm, r.passed.has(o.id));
    else if (o.t === 'lt') A.grain(sx, SY(o.y), o.r * ppm, tm, o.id, rbOn() ? RBC[o.id % 5] : null);
    else if (o.t === 'big') A.crystal(sx, SY(o.y), o.r * ppm, tm);
    else if (o.t === 'en') A.energy(sx, SY(o.y), o.r * ppm, tm); }
  // trail, thrust and the capsule
  const X = bx(), Y = by(), R = C.RB * ppm * (r.shT > 0 ? 0.5 : 1);
  trail.push([r.X, r.y]); if (trail.length > 26) trail.shift();
  g.save(); g.globalCompositeOperation = 'lighter'; for (let k = 0; k < trail.length; k++) { const [tx, ty] = trail[k], f = k / trail.length; g.fillStyle = `rgba(160,230,255,${0.25 * f})`; g.beginPath(); g.arc(SX(tx), SY(ty), R * (0.25 + 0.5 * f), 0, 6.283); g.fill(); } g.restore();
  if (r.boosting) A.thrust(X, Y, R, tm, 1.2, '#5ad1ff'); if (r.pf > 0.05) A.thrust(X, Y, R, tm, 1 + r.pf * 2, '#ffb05a');
  if (r.v >= st.brk || r.inv > 0) { g.save(); g.globalCompositeOperation = 'lighter'; A.glow(X + R * 0.6, Y, R * 2.2, r.inv > 0 && r.pf > 0 ? '#ffb05a' : '#9ae8ff', 0.35); g.restore(); }
  A.bubble(X, Y, R, tm, { inv: r.inv > 0 && r.pf <= 0.05, tilt: r.vy * 0.012, hp: r.hp, hpMax: st.hp, rb: rbOn(), cap: true });
  // speed lines when fast
  const q = Math.min(1, Math.max(0, (r.v - 60) / 300)); if (q > 0) { g.save(); g.globalCompositeOperation = 'lighter'; for (let k = 0; k < 14 * q + 2; k++) { const yy = (A.hs(k * 3.3) * H), ph = (tm * (2 + A.hs(k)) + A.hs(k * 7)) % 1, xx = W * (1 - ph * 1.3), L = 40 + 160 * q; g.strokeStyle = `rgba(255,255,255,${0.25 * q * Math.sin(ph * Math.PI)})`; g.lineWidth = 1.5; g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + L, yy); g.stroke(); } g.restore(); }
  g.restore();
  drawFx(dt);
  drawHud(r, tm);
  if (now() - tunT < 0.7) { const f = (now() - tunT) / 0.7; g.globalAlpha = 1 - f; A.tunnel(W, H, 0.3 + f * 0.7, [['#2c2a40', '#3e3a58', '#9ae8ff', '#ffffff'], C.ZONES[0].pal], tm, 1); g.globalAlpha = 1; }
}
function drawHud(r, tm) {
  const st = r.st, p = r.X / C.LEN, z = Math.min(C.ZN - 1, Math.floor(p)), sl = C.sizeLabel(C.lgAt(p)), s = Math.min(1.5, Math.max(0.8, H / 420));
  // top-left: the size of the world around the capsule, the zone and how far through it
  txt(sl.num, 14, 44 * s, 'left', 34 * s, '#ffffff'); g.font = `${34 * s}px ${FONT}`; const w1 = g.measureText(sl.num).width;
  txt(sl.unit, 20 + w1, 44 * s, 'left', 17 * s, '#cfe8ff'); txt(`${C.ZONES[z].name}${sl.east ? ' · ' + sl.east : ''}`, 14, 66 * s, 'left', 14 * s, '#ffe27a');
  { const bw = 160 * s, y = 74 * s; g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(14, y, bw, 5 * s); g.fillStyle = C.ZONES[z].pal[3]; g.fillRect(14, y, bw * Math.min(1, p - z), 5 * s); if (z + 1 < C.ZN) { g.font = `700 ${10 * s}px sans-serif`; g.fillStyle = 'rgba(255,255,255,.7)'; g.textAlign = 'left'; g.fillText('다음: ' + (z + 1 > M().zoneEver + 1 ? '???' : C.ZONES[z + 1].name), 14, y + 17 * s); } }
  // top centre: light this run, combo
  const pay = C.payout(r, M()); const V0 = M().light; txt('지갑 ' + mny(V0 + pay.total), W / 2, 30 * s, 'center', 22 * s, '#ffe27a');
  if (lightPop.v > 0 && now() - lightPop.t < 0.9) { g.globalAlpha = Math.min(1, (0.9 - (now() - lightPop.t)) * 3); txt('−' + won(1 / Math.max(1e-12, V0 + pay.total - lightPop.v) - 1 / Math.max(1e-12, V0 + pay.total)), W / 2, 52 * s, 'center', 15 * s, '#fff3b0'); g.globalAlpha = 1; }
  if (r.combo >= 3 && r.tr - r.comboT < st.comboT) txt(`연쇄 ${r.combo}`, W / 2, 74 * s, 'center', 16 * s, '#9ae8ff');
  // bottom centre: energy, and the thrust gauge above it
  const bw = Math.min(320, W * 0.34), bx2 = W / 2 - bw / 2, y = H - 30 * s, ef = Math.min(1, r.E / r.Emax), low = r.E < 4;
  g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.roundRect(bx2 - 3, y - 3, bw + 6, 14 * s + 6, 8); g.fill(); g.fillStyle = low && Math.floor(tm * 4) % 2 ? '#ff6a6a' : '#5affc0'; g.beginPath(); g.roundRect(bx2, y, Math.max(2, bw * ef), 14 * s, 6); g.fill();
  txt(`에너지 ${r.E.toFixed(1)}초`, W / 2, y - 6 * s, 'center', 13 * s, low ? '#ff9a9a' : '#d0fff0');
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(bx2, y + 17 * s, bw, 4 * s); g.fillStyle = '#5ad1ff'; g.fillRect(bx2, y + 17 * s, bw * r.fuel / st.fuel, 4 * s);
  // the zone banner: name, size, and the fact the first time
  if (banner && now() - banner.t < (banner.fresh ? 4.2 : 2)) { const a = Math.min(1, (now() - banner.t) * 3, ((banner.fresh ? 4.2 : 2) - (now() - banner.t)) * 2), Zb = C.ZONES[banner.z]; g.globalAlpha = a;
    txt(Zb.name, W / 2, H * 0.3, 'center', 34 * s, Zb.pal[2]); if (banner.fresh) { g.font = `${14 * s}px ${FONT}`; txt(Zb.fact, W / 2, H * 0.3 + 28 * s, 'center', 14 * s, '#ffffff'); } g.globalAlpha = 1; }
  if (r.v >= st.brk) txt('돌파!', bx(), by() - C.RB * ppmNow() - 14, 'center', 13 * s, '#bff4ff');
}

/* ---------------- result ---------------- */
function showResult() { const r = run, m = M(), p = C.finish(r, m); save(); mode = 'result'; hud(); hint.classList.remove('show'); $('#mTop').hidden = false;
  const sl = C.sizeLabel(C.lgAt(r.pmax)), z = Math.min(C.ZN - 1, Math.floor(r.pmax));
  $('#mWhy').textContent = r.why; $('#mDist').innerHTML = `${sl.num} ${sl.unit}<small>${C.ZONES[z].name}${sl.east ? ' · ' + sl.east : ''}까지</small>`;
  const tags = []; for (const a of p.ach) tags.push('업적: ' + a.name); if (p.newZone) tags.push(C.ZONES[p.zone].name + ' 첫 도달'); if (r.quality === 2) tags.push('완벽 축소');
  $('#mTags').innerHTML = tags.map((t, i) => `<span class="tagx" style="--i:${i}">${t}</span>`).join('');
  const rows = [['빛 알갱이 · 결정 (' + (r.grains + r.crystals) + '개)', mny(p.grains)], ['깊이 보상', mny(p.depth)]];
  if (p.near) rows.push([`스침 (${r.nearN}회)`, mny(p.near)]); if (p.rings) rows.push([`고리 (${r.ringN}회 · 정확 ${r.perfRingN})`, mny(p.rings)]); if (p.smash) rows.push([`돌파 (${r.smashN}회)`, mny(p.smash)]); if (p.first) rows.push(['새 구역 발견', mny(p.first)]);
  if (p.perfect) rows.push(['완벽 축소', '+30%']); if (p.combo) rows.push([`연쇄 (최고 ${r.maxCombo})`, '+' + Math.round(p.combo * 100) + '%']);
  $('#mRows').innerHTML = rows.map((x, i) => `<span style="--i:${i}">${x[0]}</span><b style="--i:${i}">${x[1]}</b>`).join('') + `<span class="tot" style="--i:${rows.length}">지갑</span><b class="tot" style="--i:${rows.length}">${mny(m.light - p.total)} → ${mny(m.light)}</b>`;
  const c = $('#mResult'); c.classList.remove('in'); c.hidden = false; void c.offsetWidth; c.classList.add('in'); if (p.newZone) SND.zone();
  if (p.ach.length) setTimeout(() => showHint('업적 달성 · 빛 +3%', 2200), 600); }

/* ---------------- the lab shop ---------------- */
const EFX = {
  u_power: s => `힘 ×${f2(s.V0 / 50)}`, u_flow: s => `힘 ×${f2(s.V0 / 50)}`, u_lens: s => `완벽 구간 ±${(s.perfW * 100).toFixed(1)} · 보너스 +${Math.round(s.perfB * 100)}%`, u_pre: s => `출발 가속 +${Math.round(s.preB * 100)}%`,
  u_fin: s => `조향 ${s.steer.toFixed(0)}`, u_hull: s => `막 ${s.hp}칸`, u_tens: s => `부딪힐 때 속도 ${Math.round(s.hitKeep * 100)}% 유지 · 무적 ${s.invT.toFixed(1)}초`, u_ram: s => `돌파 속도 ${s.brk.toFixed(0)}`,
  u_tank: s => `연료 ${s.fuel.toFixed(1)}초`, u_noz: s => `추진 +${Math.round(s.thrust * 100)}%`, u_pulse: s => `펄스 ${s.pulses}회`, u_pamp: s => `펄스 +${Math.round(s.pulseP * 100)}%`, u_blink: s => `도약 ${s.blinks}회`, u_blinkd: s => `도약 ${s.blinkD.toFixed(0)}칸`,
  u_shrink: s => `수축 ${s.shrinks}회`, u_shrinkt: s => `수축 ${s.shrinkT.toFixed(1)}초`, u_lux: s => `빛 ×${f2(s.lux)}`, u_mag: s => s.mag ? `끌어오는 범위 ${s.mag.toFixed(1)}칸` : '없음', u_en: s => `에너지 ${s.energy.toFixed(1)}초`, u_eng: s => `방울 하나 +${s.enGain.toFixed(1)}초`,
  u_graze: s => `스침 범위 ${s.graze.toFixed(2)} · 보너스 ×${s.grazeB.toFixed(1)}`, u_combo: s => `연쇄 ${s.comboT.toFixed(2)}초`, u_scout: s => `첫 도달 ×${s.scout.toFixed(1)}` };
function openShop() { if (mode === 'run' || mode === 'charge' || mode === 'fire') return; $('#mResult').hidden = true; $('#mShop').hidden = false; confirmRecon = false; renderShop(); flyUI(false); }
function closeShop() { $('#mShop').hidden = true; toLab(); }
function renderShop() { const m = M(); $('#mSL').textContent = mny(m.light); const sc = $('#mSC'); sc.hidden = !(m.crys > 0 || m.recons > 0 || C.reconOpen(m)); sc.textContent = fmt(m.crys);
  const tabs = C.TABS.map(t => [t[0], t[1], C.UPS.filter(u => u.tab === t[0] && C.canBuy(m, u.id)).length]).concat(C.reconOpen(m) ? [['recon', '재구성', C.PERKS.filter(q => C.canPerk(m, q.id)).length]] : []).concat([['book', '도감', 0], ['rec', '기록', 0]]);
  if (!tabs.some(t => t[0] === shopTab)) shopTab = 'gear';
  $('#mTabs').innerHTML = tabs.map(([id, n, c]) => `<button type="button" data-t="${id}" class="${id === shopTab ? 'on' : ''}">${n}${c ? `<i>${c}</i>` : ''}</button>`).join('');
  const L = $('#mList'), st = C.stats(m);
  if (C.TABS.some(t => t[0] === shopTab)) { L.innerHTML = `<p class="note">작은 세상의 돈은 <b>작을수록 값져요.</b> 지갑(${mny(m.light)})이 가격보다 작거나 같으면 살 수 있고, 사고 나면 지갑이 커져요. 레벨이 오를수록 가격은 점점 작아져요.</p>` + C.UPS.filter(u => u.tab === shopTab).map(u => { const l = C.lvl(m, u.id), mx = l >= u.max, lk = C.lockReason(m, u.id), c = C.cost(u.id, l), can = C.canBuy(m, u.id);
      let nx = ''; if (!mx && !lk) { m.lv[u.id] = l + 1; nx = EFX[u.id](C.stats(m)); m.lv[u.id] = l; if (!l) delete m.lv[u.id]; }
      return `<div class="mc ${can ? 'can' : ''} ${lk ? 'lock' : ''} ${mx ? 'mx' : ''}"><h3>${u.name}<small>Lv ${l} / ${u.max}</small></h3><p>${u.desc}</p><p class="ev">${lk ? '🔒 ' + lk : EFX[u.id](st) + (nx ? ' → ' + nx : '')}</p><div class="mbar"><b style="width:${100 * l / u.max}%"></b></div><button type="button" data-buy="${u.id}" ${can ? '' : 'disabled'}>${mx ? '최대' : lk ? '잠김' : mny(c)}</button></div>`; }).join(''); }
  else if (shopTab === 'recon') { const gn = C.crysFor(m);
    L.innerHTML = `<div class="bh">재구성 · 결정 ◈</div><p class="note">방울을 처음부터 다시 조립해요. 업그레이드와 빛은 처음으로 돌아가지만, 이번 주기에 내려간 가장 깊은 곳에 따라 결정을 얻고, 결정으로 산 능력은 영원히 남아요. DNA 나선 계단부터 결정이 생기고, 깊을수록 훨씬 많아요.</p>
      <div class="mc cr ${gn ? 'can' : ''}"><h3>지금 재구성하면<small>${fmt(m.recons)}회 함</small></h3><p>이번 주기 최고 깊이: ${C.ZONES[Math.min(C.ZN - 1, Math.floor(m.bestCyc))].name}</p><p class="ev">◈ +${fmt(gn)}</p><button type="button" data-recon="1" ${gn ? '' : 'disabled'}>${confirmRecon ? '정말요? 한 번 더' : gn ? '재구성하기' : 'DNA 나선 계단까지 가 보세요'}</button></div>` +
      C.PERKS.map(q => { const l = C.pl(m, q.id), mx = l >= q.max, c = C.perkCost(q.id, l), can = C.canPerk(m, q.id); return `<div class="mc cr ${can ? 'can' : ''} ${mx ? 'mx' : ''}"><h3>${q.name}<small>Lv ${l} / ${q.max}</small></h3><p>${q.desc}</p><div class="mbar"><b style="width:${100 * l / q.max}%"></b></div><button type="button" data-perk="${q.id}" ${can ? '' : 'disabled'}>${mx ? '최대' : '◈ ' + fmt(c)}</button></div>`; }).join(''); }
  else if (shopTab === 'book') { const far = m.zoneEver; L.innerHTML = `<div class="bh">도감 · 지금까지 가 본 크기</div><p class="note">마트 바닥에서 시작해 한 구역마다 세상이 몇 배씩 커져요. 숫자는 그 구역에서 방울 둘레의 물체 크기예요.</p>` +
      C.ZONES.map((Z, i) => { if (i > far + 1) return ''; if (i === far + 1) return `<div class="mc lock zone"><h3>???<small>다음 구역</small></h3><p>더 작은 세상이 기다려요.</p></div>`; const sl = C.sizeLabel(Z.lg); return `<div class="mc zone" style="--zc:${Z.pal[3]}"><h3>${i + 1}. ${Z.name}<small>${sl.num} ${sl.unit}</small></h3><p>${sl.east ? sl.east + ' · ' : ''}${Z.fact}</p></div>`; }).join('') + `<div class="bh">작은 세상의 돈 · 원보다 작은 단위</div><p class="note">숫자가 작을수록 큰돈이에요. 단위는 만분의 1씩 작아져요.</p>` + MONEY.map(([e, u, why]) => `<div class="mc zone" style="--zc:#ffd24a"><h3>1${u}<small>10<sup>${e}</sup>원</small></h3><p>${why} · 1${u} = 1만분의 1${e === -4 ? '원' : MONEY.find(x => x[0] === e + 4)[1]}</p></div>`).join(''); }
  else { const n = C.achN(m); L.innerHTML = `<div class="bh">기록</div><div class="mc"><h3>최고 깊이<small>${fmt(m.runs)}판</small></h3><p>${C.ZONES[Math.min(C.ZN - 1, Math.floor(m.best))].name} · ${(() => { const s2 = C.sizeLabel(C.lgAt(m.best)); return s2.num + ' ' + s2.unit; })()}</p><p>재구성 ${fmt(m.recons)}회 · 완벽 축소 ${fmt(m.perfects)}회 · 소수점 ${fmt(m.ended)}번 찾음</p><p class="ev">업적 ${n}개 → 빛 +${n * 3}%</p></div><div class="bh">업적 · 하나당 빛 +3%</div>` +
      C.ACH.map(a => `<div class="ac${m.ach[a.id] ? ' done' : ' off'}${n >= C.ACH.length ? ' rb' : ''}"><h3>${a.name}</h3><p>${a.desc}</p></div>`).join(''); }
}
$('#mTabs').addEventListener('click', e => { const b = e.target.closest('button[data-t]'); if (!b) return; shopTab = b.dataset.t; confirmRecon = false; renderShop(); $('#mList').scrollTop = 0; });
$('#mList').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const m = M();
  if (b.dataset.buy && C.buy(m, b.dataset.buy)) { SND.buy(); save(); }
  if (b.dataset.perk && C.buyPerk(m, b.dataset.perk)) { SND.buy(); save(); }
  if (b.dataset.recon) { if (!confirmRecon) { confirmRecon = true; renderShop(); return; } const gn = C.reconstruct(m); confirmRecon = false; if (gn) { SND.super(); save(); B.toast(`재구성 · ◈ +${fmt(gn)}`, 2200); } }
  const sc = $('#mList').scrollTop; renderShop(); $('#mList').scrollTop = sc; hud(); });

/* ---------------- intro: through the little door, into the lab, to meet the director ---------------- */
// the director stands by the platform in the lab; in the intro he walks over to greet the passenger who comes in through the door
const DIR_X = 0.68, INTRO_LINES = [[3.6, 6.0, '어서 오게! 계산원 73번에게 이야기 들었네.'], [6.0, 8.4, '그 빨간 모자가 우리 연구소 출입증이지. 허허.'], [8.4, 11.2, '떨어진 건 영수증의 소수점이라네. 너무 작아서 아주아주 작은 세상까지 굴러갔을 거야.'], [11.2, 13.4, '이 방울을 타고 내려가 찾아 주겠나?']];
function say(x, y, t, k, a) { g.save(); g.globalAlpha = a; g.font = `${15 * k}px ${FONT}`; const w = Math.min(W * 0.5, g.measureText(t).width + 28 * k), lines = []; let cur = '';
  for (const ch of t.split(' ')) { const nx = cur ? cur + ' ' + ch : ch; if (g.measureText(nx).width > w - 24 * k && cur) { lines.push(cur); cur = ch; } else cur = nx; } lines.push(cur);
  const h = lines.length * 19 * k + 14 * k, bx = Math.max(8, Math.min(W - w - 8, x - w / 2)), by = y - h;
  g.fillStyle = '#fff'; g.strokeStyle = '#2b2233'; g.lineWidth = 2.5; g.beginPath(); g.roundRect(bx, by, w, h, 12 * k); g.fill(); g.stroke(); g.beginPath(); g.moveTo(x - 8 * k, by + h - 1); g.lineTo(x + 2 * k, by + h + 12 * k); g.lineTo(x + 10 * k, by + h - 1); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.fillRect(x - 7 * k, by + h - 3, 16 * k, 4);
  g.fillStyle = '#2b2233'; g.textAlign = 'center'; lines.forEach((l, q) => g.fillText(l, bx + w / 2, by + 20 * k + q * 19 * k)); g.restore(); }
const sm = v => { v = Math.max(0, Math.min(1, v)); return v * v * (3 - 2 * v); };
function drawIntro(t) { const tm = now(), k = Math.min(1.4, H / 420);
  if (!drawIntro.s1) { drawIntro.s1 = 1; B.MUS.want('mlab'); B.tone(400, 900, 0.5, 0.05, 'sine'); }
  // where the passenger and the director are
  const pf = sm((t - 0.6) / 2.8), pf2 = sm((t - 13.4) / 1.2), bubS = sm((t - 14.6) / 0.8), df = sm((t - 1.2) / 2.4), df2 = sm((t - 15.4) / 2.0);
  let geo = null; const inside = bubS > 0.6;
  A.lab(W, H, tm, -1, [0.8, 0.9], 0, { rb: rbOn(), door: t < 4 ? 1 - sm((t - 3) / 1) : 0, bubbleS: bubS, behind: G => { geo = G; const dx = W * (0.12 + (0.38 - 0.12) * df + (DIR_X - 0.38) * df2), walking = (df > 0 && df < 1) || (df2 > 0 && df2 < 1);
      const L = INTRO_LINES.find(l => t >= l[0] && t < l[1]); A.director(dx, G.fy, G.u * 1.15, tm, { ph: walking ? dx / (8 * G.u) : null, face: df2 > 0 && df2 < 1 ? 1 : t < 13.4 ? 1 : -1, talk: !!L, wave: t > 3 && t < 3.6 });
      drawIntro.dx = dx; } });
  // the passenger: in from the door, then onto the platform where the bubble forms around them
  if (!inside && geo) { const u = geo.u, x0 = geo.dx, x1 = W * 0.6, x = pf2 > 0 ? x1 + (W * 0.5 - x1) * pf2 : x0 + (x1 - x0) * pf, walking = (pf > 0 && pf < 1) || (pf2 > 0 && pf2 < 1); A.walker(x, geo.fy, u * 1.1, tm, { ph: walking ? x / (6 * u) : null, face: -1, cap: true }); }
  if (bubS > 0 && bubS < 1) { g.save(); g.globalCompositeOperation = 'lighter'; for (let q = 0; q < 10; q++) { const an = q * 0.628 + tm * 3, rr = 40 * (1 - bubS) + 10; g.fillStyle = `rgba(190,240,255,${1 - bubS})`; g.beginPath(); g.arc(W * 0.5 + Math.cos(an) * rr, (geo ? geo.ty : H * 0.6) + Math.sin(an) * rr, 2.5, 0, 6.3); g.fill(); } g.restore(); if (!drawIntro.s4) { drawIntro.s4 = 1; SND.shrink(); B.tone(500, 1500, 0.6, 0.05, 'sine'); } }
  const L = INTRO_LINES.find(l => t >= l[0] && t < l[1]); if (L && geo) { const f = Math.min(1, (t - L[0]) * 5, (L[1] - t) * 5); say(drawIntro.dx, geo.fy - 96 * geo.u * 1.15, L[2], k, f); if (!drawIntro['l' + L[0]]) { drawIntro['l' + L[0]] = 1; B.tone(330, 360, 0.09, 0.06, 'triangle'); B.tone(440, 420, 0.09, 0.05, 'triangle', 0.1); } }
  if (t < 0.9) { g.fillStyle = `rgba(255,255,255,${1 - t / 0.9})`; g.fillRect(0, 0, W, H); }
  if (t > 15.6 && !drawIntro.s3) { drawIntro.s3 = 1; SND.zone(); bigCard('2장 · 작은 세상', '연구소장님의 부탁: 영수증의 소수점을 찾아 주세요', '방울을 타고 점점 더 작은 세상으로 · 왼쪽 벽 화살표로 카트 발사대에 돌아갈 수 있어요'); }
  if (t > 17.4) txt('눌러서 시작', W / 2, H * 0.94, 'center', 18, `rgba(255,255,255,${0.6 + 0.4 * Math.sin(tm * 4)})`); }
function finishIntro() { for (const k2 in drawIntro) delete drawIntro[k2]; card.classList.remove('show'); const m = M(); m.introSeen = 1; save(); toLab(); $('#mTop').hidden = false; }

/* ---------------- the end: the decimal point, then the long way back up ---------------- */
function startFound() { mode = 'found'; foundT = now(); flyUI(false); boostHeld = false; $('#mBack').hidden = true; $('#mOpen').hidden = true; $('#mTop').hidden = true; hint.classList.remove('show'); const m = M(); C.finish(run, m); save(); SND.found(); B.MUS.want('mfoam'); }
const UP_PALS = C.ZONES.map(Z => Z.pal).reverse().concat([['#3a2f26', '#8a6a48', '#ffe3a0', '#ffb347'], ['#fffdf2', '#ffe3a0', '#ffffff', '#ffd24a']]);
function drawFound(t, dt) { const tm = now();
  if (t < 3.2) { // the dot in the dark, the capsule drifting to it
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H); const f = Math.min(1, t / 2.4), cx = W * 0.62, cy = H / 2;
    A.dot(cx, cy, 10 + 10 * f, tm); const bx2 = W * 0.24 + (cx - 40 - W * 0.24) * f * f; A.bubble(bx2, cy, 28, tm, { rb: rbOn(), cap: true });
    if (t > 2.3) { txt('찾았다!', W / 2, H * 0.24, 'center', 44, '#ffe27a'); txt('잃어버린 소수점 ( . )', W / 2, H * 0.24 + 34, 'center', 20, '#ffffff'); }
    return; }
  if (t < 9) { // growing back: every world rushing past the other way, the size climbing back to the shop floor
    const f = Math.min(1, (t - 3.2) / 5.4); A.tunnel(W, H, f, UP_PALS, tm, -1); const lg = -34.8 + f * 33; const sl = C.sizeLabel(Math.min(-1.01, lg)); txt(f > 0.97 ? '마트 바닥' : `${sl.num} ${sl.unit}`, W / 2, H - 46, 'center', 26, '#ffffff');
    txt('다시 커지는 중…', W / 2, 46, 'center', 20, '#ffe27a'); A.dot(W / 2, H / 2, 8, tm);
    if (t > 8.2) { g.fillStyle = `rgba(255,255,255,${(t - 8.2) / 0.8})`; g.fillRect(0, 0, W, H); } return; }
  g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
  if (!drawFound.done) { drawFound.done = 1; on = false; el.hidden = true; root.classList.remove('micro-on'); try { B.epilogue(); } catch (e) { enter({}); } setTimeout(() => { drawFound.done = 0; }, 1000); } }

/* ---------------- public ---------------- */
// eligible for the chapter: every cart achievement before reaching the last checkout again
window.MICRO = { get on() { return on; }, enter, leave, get mode() { return mode; }, open: () => !!(B.S.micro && B.S.micro.open), get run() { return run; }, C, finishIntro,
  test: { setRun: f => f(run), found: () => { if (run) { run.X = C.LEN * C.ZN + 1; } }, release: (c) => { charge = c; release(); }, M } };
// came back to the page while in the small world last time
try { if (localStorage.getItem('cart.mode') === 'micro' && B.S.micro && B.S.micro.open) setTimeout(() => enter({}), 50); } catch (e) {}
})();
