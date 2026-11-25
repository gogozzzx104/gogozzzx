/* =====================================================================
   CORE v3 — zones, tech tree, rebirth tree and flight physics.  No DOM, so the same code runs in the game
   and in the balance simulator (tools/sim.js).

   Everything in a run is measured against that run's own scale U (set by the launch speed): hill size, where the
   coins float, how far apart things are, the camera width and the time warp.  A stronger cart therefore plays the
   same game at a bigger scale instead of flying past a world it can no longer touch.
   ===================================================================== */
const CORE = (() => {
  // ---- zones --------------------------------------------------------------------------------
  // g gravity · drag air multiplier · amp/wl/la hill shape in units of U · mu/e/loss surface multipliers
  // rough: 광폭 타이어 helps · water: 부력 튜브 needed · spec: zone-only ground objects
  const ZONES = [
    { id: 'lot', name: '마트 주차장', at: 0, g: 9.8, drag: 1, amp: 0, wl: 20, mu: 1, e: 1, loss: 1, sky: ['#8fc4ff', '#dff1ff'], ground: '#55585f', deco: 'lot' },
    { id: 'city', name: '도심 도로', at: 200, g: 9.8, drag: 1, amp: 0.22, wl: 22, sk: 0.3, mu: 0.9, e: 1.05, loss: 1, spec: ['car'], sky: ['#7db2f0', '#f6e3c8'], ground: '#3d4048', deco: 'city' },
    { id: 'hill', name: '교외 언덕', at: 1000, g: 9.8, drag: 1, amp: 0.74, wl: 26, sk: 0.35, la: 0.5, mu: 1.3, e: 0.95, loss: 1.1, sky: ['#6fb7e8', '#eaf7d0'], ground: '#4f9a4a', deco: 'hill' },
    { id: 'forest', name: '깊은 숲', at: 2500, g: 9.8, drag: 1, amp: 0.67, wl: 22, sk: 0.4, la: 0.8, mu: 1.9, e: 0.85, loss: 1.3, rough: 1, spec: ['tramp'], sky: ['#4f9c78', '#dcf2c4'], ground: '#2f6b3a', deco: 'forest' },
    { id: 'sand', name: '모래 사막', at: 6000, g: 9.8, drag: 1, amp: 0.86, wl: 30, sk: 0.55, la: 1, mu: 3, e: 0.55, loss: 1.8, rough: 1, sky: ['#f2b25c', '#ffe9b8'], ground: '#d9a653', deco: 'sand' },
    { id: 'canyon', name: '붉은 대협곡', at: 15000, g: 9.8, drag: 1, amp: 1.39, wl: 34, sk: 0.85, la: 1.5, mu: 1.1, e: 1, loss: 1, sky: ['#e0843f', '#ffdcae'], ground: '#b5562f', deco: 'canyon' },
    { id: 'sea', name: '망망대해', at: 35000, g: 9.8, drag: 1, amp: 2.0, wl: 40, mu: 1, e: 1, loss: 1, water: 1, spec: ['boat'], sky: ['#3d8fd6', '#bfe9ff'], ground: '#1f6fb5', deco: 'sea' },
    { id: 'ice', name: '만년 설산', at: 80000, g: 9.8, drag: 1, amp: 0.78, wl: 28, sk: 0.6, la: 2, mu: 0.3, e: 0.9, loss: 0.5, sky: ['#9fc3e8', '#ffffff'], ground: '#e8f1fa', deco: 'ice' },
    { id: 'lava', name: '용암 지대', at: 200000, g: 9.8, drag: 1.2, amp: 1.06, wl: 30, sk: 0.75, la: 2, mu: 1.2, e: 0.9, loss: 1, spec: ['geyser', 'pool'], sky: ['#3a1410', '#c2451e'], ground: '#33211f', deco: 'lava' },
    { id: 'cloud', name: '구름 왕국', at: 500000, g: 8, drag: 0.9, amp: 0.83, wl: 36, sk: 0.2, la: 2.4, mu: 0.5, e: 1.12, loss: 0.6, spec: ['tramp'], sky: ['#ff9ec7', '#fff0c9'], ground: '#fff3fa', deco: 'cloud' },
    // beyond the clouds the zones follow real distance from Earth: Moon, Sun, Mars, asteroid belt, Jupiter, Saturn, Kuiper belt, Alpha Centauri (4.4 ly),
    // Pleiades (~440 ly), Orion Nebula (~1,300-1,500 ly), Crab Nebula (~6,500 ly), the Milky Way's centre (~26,000 ly), the Magellanic Clouds (~160,000-200,000 ly),
    // Andromeda (~2.5 million ly), the Virgo Cluster (~54 million ly), the edge of the observable universe, and then what lies outside it
    { id: 'moon', name: '달 기지', at: 1200000, g: 5.5, drag: 0.6, amp: 0.84, wl: 24, sk: -0.5, la: 1.5, mu: 0.8, e: 1.03, loss: 0.8, sky: ['#05060d', '#141a33'], ground: '#9a9aa6', deco: 'moon' },
    { id: 'sun', fx: 'sun', name: '태양 표면', at: 3000000, g: 12, drag: 1.3, amp: 1.3, wl: 30, sk: 0.7, la: 2.5, mu: 1.2, e: 0.9, loss: 1.1, spec: ['pool', 'geyser'], sky: ['#ff7a1a', '#ffe27a'], ground: '#7a2a0a', deco: 'lava' },
    { id: 'mars', fx: 'mars', name: '화성 협곡', at: 7500000, g: 6, drag: 0.7, amp: 1.2, wl: 32, sk: 0.8, la: 1.5, mu: 1.6, e: 0.85, loss: 1.3, rough: 1, sky: ['#c98a5a', '#f2c79a'], ground: '#a8502d', deco: 'canyon' },
    { id: 'rock', name: '소행성대', at: 20000000, g: 4.5, drag: 0.6, amp: 0.72, wl: 20, sk: -0.7, la: 2, mu: 1.8, e: 0.9, loss: 1.4, rough: 1, sky: ['#070812', '#221a38'], ground: '#6b6258', deco: 'rock' },
    { id: 'jupiter', fx: 'jupiter', name: '목성 폭풍', at: 5e7, g: 13, drag: 1.2, amp: 0.9, wl: 40, sk: 0.2, la: 2.5, mu: 0.5, e: 1.1, loss: 0.6, spec: ['tramp'], sky: ['#3a2416', '#d9a066'], ground: '#e8c9a0', deco: 'cloud' },
    { id: 'saturn', fx: 'saturn', name: '토성 고리', at: 1.2e8, g: 8, drag: 0.7, amp: 0.8, wl: 22, sk: -0.6, la: 2, mu: 1.6, e: 0.95, loss: 1.2, rough: 1, sky: ['#0a0a18', '#3a3350'], ground: '#cfc3a0', deco: 'rock' },
    { id: 'crystal', fx: 'crystal', name: '카이퍼 얼음띠', at: 3e8, g: 7, drag: 0.8, amp: 1.1, wl: 26, sk: 0.4, la: 2.5, mu: 0.3, e: 1.05, loss: 0.6, spec: ['tramp'], sky: ['#0b3a4a', '#7ff0e0'], ground: '#bff5ee', deco: 'ice' },
    { id: 'centauri', fx: 'centauri', name: '알파 센타우리', at: 1.2e9, g: 9, drag: 1, amp: 1.1, wl: 30, sk: 0.5, la: 2.5, mu: 1, e: 1, loss: 1, spec: ['pool', 'geyser'], sky: ['#1a0a05', '#a8431a'], ground: '#3a1a12', deco: 'lava' },
    { id: 'pleiades', fx: 'pleiades', name: '플레이아데스 성단', at: 5e9, g: 6, drag: 0.8, amp: 1, wl: 30, sk: 0.3, la: 2.5, mu: 0.4, e: 1.05, loss: 0.7, sky: ['#030818', '#1a3a7a'], ground: '#b9d2f5', deco: 'ice' },
    { id: 'nebula', fx: 'nebula', name: '오리온 성운', at: 2e10, g: 6, drag: 0.8, amp: 1, wl: 38, sk: 0.2, la: 3, mu: 0.5, e: 1.1, loss: 0.6, spec: ['tramp'], sky: ['#3a1a6a', '#ff9ec7'], ground: '#e8d9ff', deco: 'cloud' },
    { id: 'crab', fx: 'crab', name: '게 성운', at: 8e10, g: 10, drag: 1.1, amp: 1.4, wl: 34, sk: 0.6, la: 3, mu: 1.3, e: 0.95, loss: 1.2, rough: 1, spec: ['pool'], sky: ['#06040f', '#2a1038'], ground: '#3a2a30', deco: 'rock' },
    { id: 'star', name: '은하 고속도로', at: 3e11, g: 7, drag: 0.8, amp: 0.93, wl: 44, sk: 0.35, la: 3, mu: 0.6, e: 1.05, loss: 0.7, sky: ['#0a0220', '#3a0f66'], ground: '#5b2bd6', deco: 'star' },
    { id: 'hole', name: '궁수자리 블랙홀', at: 1.2e12, g: 14, drag: 1.3, amp: 1.69, wl: 36, sk: 0.5, la: 3, mu: 1.2, e: 0.9, loss: 1.2, rough: 1, spec: ['pool', 'geyser'], sky: ['#000000', '#3a0a16'], ground: '#1a1020', deco: 'hole' },
    { id: 'magellan', fx: 'magellan', name: '마젤란 은하', at: 5e12, g: 6, drag: 0.8, amp: 1, wl: 36, sk: 0.2, la: 3, mu: 0.5, e: 1.1, loss: 0.6, spec: ['tramp'], sky: ['#0a1030', '#5a3a8a'], ground: '#d6e2ff', deco: 'cloud' },
    { id: 'andromeda', fx: 'andromeda', name: '안드로메다 은하', at: 2e13, g: 5, drag: 0.7, amp: 0.9, wl: 28, sk: -0.4, la: 2.5, mu: 0.8, e: 1.03, loss: 0.8, sky: ['#02030a', '#101a3a'], ground: '#8f94b8', deco: 'moon' },
    { id: 'virgo', fx: 'virgo', name: '처녀자리 은하단', at: 8e13, g: 8, drag: 0.9, amp: 1.3, wl: 26, sk: -0.6, la: 3, mu: 1.5, e: 0.95, loss: 1.3, rough: 1, sky: ['#050208', '#2a1a12'], ground: '#6a5a4a', deco: 'rock' },
    { id: 'end', name: '우주의 끝', at: 3e14, g: 6, drag: 0.9, amp: 1.6, wl: 40, sk: 0.3, la: 3.5, mu: 1.5, e: 0.95, loss: 1.3, rough: 1, spec: ['pool'], sky: ['#b8e8ff', '#f6f0ff'], ground: '#2b2233', deco: 'end' },
    { id: 'rift', fx: 'rift', name: '차원의 틈', at: 1.2e15, g: 9, drag: 1, amp: 1.4, wl: 34, sk: 0.6, la: 3, mu: 1.3, e: 0.95, loss: 1.2, rough: 1, spec: ['geyser'], sky: ['#12002b', '#6a1fb5'], ground: '#2a0f4a', deco: 'hole' },
    { id: 'multi', fx: 'multi', name: '멀티버스', at: 5e15, g: 7, drag: 0.9, amp: 1.2, wl: 36, sk: 0.3, la: 3, mu: 0.6, e: 1.1, loss: 0.7, spec: ['tramp', 'geyser'], sky: ['#0a0220', '#103a4a'], ground: '#c9f0e8', deco: 'cloud' },
    { id: 'omega', fx: 'omega', name: '시간의 끝', at: 2e16, g: 8, drag: 1, amp: 1.6, wl: 42, sk: 0.3, la: 3.5, mu: 1, e: 1, loss: 1, rough: 1, spec: ['pool'], sky: ['#000010', '#1a3a6a'], ground: '#101830', deco: 'star' },
  ];
  const LAST = ZONES.length - 1, DEEP = 73;
  // Beyond the named universe: five uncharted realms of ten zones (three skies each: zones 1-3, 4-7, 8-10), two named layers of ten zones
  // (two skies each) and three last places.  Terrain rules still cycle through ten earlier zones; sky, ground, edge colour and music are new.
  // FAR: log10 of the distance of the last three, set so a fully maxed cart only reaches the very last by holding its top speed.
  const FAR = [61.3, 62.2, 62.7];
  { const look = ['crab', 'pleiades', 'multi', 'rift', 'nebula', 'andromeda', 'virgo', 'magellan', 'centauri', 'omega'],
      V = { u00: [['#01131c', '#064a5a'], '#082a36', '#5af0e0'], u01: [['#021a2a', '#0a6a6a'], '#0a3a40', '#8affd0'], u02: [['#000c14', '#0b3a5c'], '#06202e', '#6ac8ff'],
        u10: [['#0c0420', '#3a1a7a'], '#241046', '#c9a0ff'], u11: [['#100630', '#5a2aa0'], '#2e1660', '#f0b0ff'], u12: [['#080218', '#7a3ac0'], '#1c0c3a', '#a0e0ff'],
        u20: [['#140204', '#5a0a14'], '#2a060a', '#ff5a6a'], u21: [['#1a0206', '#7a1420'], '#33080c', '#ff8a5a'], u22: [['#0c0002', '#8a2a10'], '#240404', '#ffc04a'],
        u30: [['#120c02', '#5a4210'], '#2e2208', '#ffd24a'], u31: [['#181004', '#7a5a1a'], '#3a2c0c', '#ffe9a0'], u32: [['#0e0a02', '#8a6a20'], '#2a2006', '#fff0c0'],
        u40: [['#c8d0dc', '#f4f6fa'], '#2a2e38', '#ffffff'], u41: [['#dfe4ec', '#ffffff'], '#3a3e48', '#ffffff'], u42: [['#b8c0d0', '#eef0f6'], '#1e222a', '#ffffff'],
        h0: [['#0a0618', '#2a1a5a'], '#1a1238', '#ffd98a'], h1: [['#060a20', '#1a3a7a'], '#0e1a3c', '#a0d8ff'],
        g0: [['#04141a', '#1a6a5a'], '#0c3a30', '#b0ffd0'], g1: [['#1a0a24', '#a04a7a'], '#3a1438', '#ffc0e0'],
        f1: [['#02020a', '#1a1a4a'], '#0a0a22', '#c0d0ff'], f2: [['#0a0204', '#4a1a3a'], '#1c0a16', '#ffb0d0'], f3: [['#ffc860', '#fff8e0'], '#7a4a12', '#ffffff'] };
    for (let n = 1; n <= DEEP; n++) { const k = (n - 1) % 10 + 1, t = Math.floor((n - 1) / 10), fx = n <= 50 ? 'u' + t + (k <= 3 ? 0 : k <= 7 ? 1 : 2) : n <= 60 ? 'h' + (k <= 5 ? 0 : 1) : n <= 70 ? 'g' + (k <= 5 ? 0 : 1) : 'f' + (n - 70), v = V[fx],
        src = ZONES.find(z => z.id === (n <= 70 ? look[(n - 1) % look.length] : ['omega', 'rift', 'multi'][n - 71]));
      ZONES.push(Object.assign({}, src, { id: 'deep' + n, name: n <= 50 ? '미지의 영역 ' + n : n <= 60 ? '영원의 회랑 ' + (n - 50) : n <= 70 ? '창세의 정원 ' + (n - 60) : ['태초의 문', '무한의 옥좌', '최후의 계산대'][n - 71],
        at: n <= 70 ? ZONES[LAST].at * Math.pow(4, n) : Math.pow(10, FAR[n - 71]), deep: n, fx, deco: 'void', sky: v[0], ground: v[1], edge: v[2], mus: n <= 50 ? 'u' + 'abcde'[t] : n <= 60 ? 'hall' : n <= 70 ? 'garden' : n <= 72 ? 'gate' : 'final' })); } }
  const ZI = id => ZONES.findIndex(z => z.id === id);
  const zoneAt = x => { let lo = 0, hi = ZONES.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (x >= ZONES[m].at) lo = m; else hi = m - 1; } return lo; };   // zones are sorted by distance
  // continuous zone progress, e.g. 6.5 = half way (on a log scale) through zone 6
  function zoneProg(d) { const z = zoneAt(d); if (z === 0) return Math.max(0, d) / ZONES[1].at; const a = ZONES[z].at, b = z + 1 < ZONES.length ? ZONES[z + 1].at : a * 3; return z + Math.min(1.999, Math.log(d / a) / Math.log(b / a)); }
  function blend(x) { const z = zoneAt(x); if (z === 0) return [0, 0, 0]; const w = Math.max(40, ZONES[z].at * 0.06), f = (x - ZONES[z].at) / w; return f >= 1 ? [z, z, 0] : [z - 1, z, f * f * (3 - 2 * f)]; }
  const lerpZ = (x, k) => { const [a, b, f] = blend(x); return ZONES[a][k] + (ZONES[b][k] - ZONES[a][k]) * f; };
  function hz(z, x, U) { const Z = ZONES[z]; if (!Z.amp) return 0; const p = 6.2832 * x / (Z.wl * U);
    const h = U * (Z.amp * (0.75 * Math.sin(p + (Z.sk || 0) * Math.sin(p)) + 0.25 * Math.sin(2 * p + 1.3)) + (Z.la || 0) * Math.sin(p / 4.3 + 0.7));
    return Z.water ? Math.max(0, h - U * Z.amp * 0.5) : h; }
  function ground(x, U) { if (x < 30) return 0; const [a, b, f] = blend(x), ha = hz(a, x, U), hb = a === b ? ha : hz(b, x, U), s = Math.min(1, (x - 30) / (40 * U)); return (ha + (hb - ha) * f) * s; }
  const isWater = (x, U) => { const [a, b, f] = blend(x); return (f > 0.5 ? !!ZONES[b].water : !!ZONES[a].water) && ground(x, U) < 0.02 * U; };

  // ---- tech tree --------------------------------------------------------------------------------
  // Economy.  Gold per run follows distance (gd) times a bounded set of multipliers, so prices can be planned per zone:
  // every bounded upgrade starts at about PRICE.first runs' worth of gold of the zone where it becomes relevant (zs)
  // and its last level costs about PRICE.last runs' worth `span` zones later.  Only 근력 훈련 has no ceiling.
  const gd = (d, zi) => 9 * Math.pow(d, 0.55) * Math.pow(1.15, zi);
  // typical gold of one run while working in zone z (measured with tools/sim.js; beyond the last zone it keeps growing)
  const GT = [40, 330, 1100, 3300, 8500, 2.2e4, 4.8e4, 2.2e5, 6e5, 3.4e6, 1.1e7, 5e7, 1.2e8, 5e8, 1.6e9];
  const gref = z => { const f = k => k < GT.length ? GT[Math.max(0, k)] : GT[GT.length - 1] * Math.pow(2.6, Math.min(k, 16) - GT.length + 1) * Math.pow(5, Math.max(0, k - 16)), a = Math.floor(z), t = z - a; return Math.exp(Math.log(f(a)) * (1 - t) + Math.log(f(a + 1)) * t); };
  // prices in "runs of gold": the first level of an upgrade costs about PRICE.first runs, its last level PRICE.last runs; past the sea everything gets steeper
  const PRICE = { first: 3, last: 12, late: 1.9, from: 5 };
  const pr = z => Math.pow(PRICE.late, Math.max(0, Math.min(z, 14) - PRICE.from)) * Math.pow(0.75, Math.max(0, z - 14)) * (1 + 1.4 * Math.max(0, 1 - Math.abs(z - 7.5) / 3.5));   // steeper up to zone 14, then easing so the far zones stay reachable
  const U_ = (id, br, name, max, zs, span, desc, req, zone, re) => ({ id, br, name, max, zs, span, desc, req: req || [], zone: zone ? ZI(zone) : 0, re: re || 0 });
  // levels past an upgrade's original cap: each costs 1.7x the one before
  const EXT = { anti: 40, singu: 45, bang: 50, runup: 50, sling: 35, cannon: 35, rail: 35, warp: 35, frame: 30, aero: 60, gyro: 20, rubber: 25, float: 25, heat: 25, wide: 25, fuel: 40, nozzle: 40, spring: 30, dash: 25, dashpow: 40, dive: 24, airjump: 15, jet: 50, grav: 20, refuel: 30, leap: 25, crater: 25, amp: 30, tail: 25,
    ad: 100, coin: 100, magnet: 30, style: 50, combo: 40, alt: 50, sponsor: 40, trickpay: 40, lucky: 20, crate: 25, streak: 25, encore: 40 };
  const UPS = [
    { id: 'push', br: 'launch', name: '근력 훈련', max: 400, c0: 8, cm: 1.1, q: 1.0008, q2: 1.006, l2: 50, desc: '발사 속도 ×1.05 · 한도 없음', req: [], zone: 0 },
    U_('ramp', 'launch', '발사 경사로', 10, 0, 2.5, '발사 각도 +2.8°', [['push', 3]]),
    U_('runup', 'launch', '도움닫기', 30, 0.5, 4, '발사 속도 +2%', [['push', 5]]),
    U_('timing', 'launch', '타이밍 감각', 10, 0.8, 3, '퍼펙트 구간이 넓어지고 더 세게 발사', [['runup', 3]]),
    U_('rail2', 'launch', '가속 레일', 10, 1.2, 3, '킥으로 얻는 발사 속도 증가', [['push', 6]]),
    U_('sling', 'launch', '대형 새총', 20, 2, 4, '발사 속도 +3%', [['ramp', 5]], 'hill'),
    U_('cannon', 'launch', '화약 대포', 20, 5, 4, '발사 속도 +3%', [['sling', 10]], 'canyon'),
    U_('rail', 'launch', '레일건', 20, 9, 5, '발사 속도 +3%', [['cannon', 10]], 'cloud'),

    U_('warp', 'launch', '워프 코일', 20, 11, 6, '발사 속도 +4%', [['rail', 10]], 'moon', 1),

    U_('anti', 'launch', '반물질 사출기', 25, 15, 5, '발사 속도 +5%', [['warp', 20]], 'saturn', 3),
    U_('singu', 'launch', '특이점 엔진', 30, 18.5, 5, '발사 속도 +6%', [['anti', 25]], 'pleiades', 5),
    U_('bang', 'launch', '빅뱅 점화', 30, 22, 5, '발사 속도 +7%', [['singu', 30]], 'hole', 8),
    U_('cosmos', 'launch', '우주 가속기', 60, 26, 4, '발사 속도 +8%', [['bang', 30]], 'end', 8),
    U_('wheel', 'body', '바퀴 윤활', 18, 0, 2.5, '땅에서 굴러갈 때 덜 느려짐'),
    U_('tire', 'body', '탄성 타이어', 20, 0.3, 3.5, '땅에서 더 높이 튕김', [['wheel', 3]]),
    U_('frame', 'body', '경량 프레임', 20, 0.6, 4, '착지 때 잃는 속도 -14%', [['wheel', 5]]),
    U_('aero', 'body', '공기역학 커버', 40, 1, 12, '공기 저항 -8%', [['frame', 3]]),
    U_('bumper', 'body', '강화 범퍼', 10, 1.5, 5, '충돌 손실 감소 · Lv6부터 부수고 골드', [['frame', 5]]),
    U_('gyro', 'body', '자이로 안정기', 10, 2, 5, '회전이 빨라지고 착지 판정이 넓어짐', [['frame', 3]]),
    U_('rubber', 'body', '초탄성 서스펜션', 10, 2.5, 5, '트램펄린·패드·링 효과 +5%', [['tire', 6]]),
    U_('wide', 'body', '광폭 타이어', 10, 3, 6, '숲·모래·바위에서 덜 느려짐 · 지날 때 가속', [['tire', 5]], 'forest'),
    U_('float', 'body', '부력 튜브', 10, 6, 5, '물 위에서 튕김 · 바다를 지날 때 가속', [], 'sea'),
    U_('hover', 'body', '호버 스커트', 15, 6.5, 7, '튕기는 힘의 최대치가 올라감', [['tire', 15]], 'sea'),
    U_('heat', 'body', '내열 코팅', 10, 8, 5, '용암에서 덜 느려짐 · 지날 때 가속', [], 'lava'),

    U_('turbine', 'body', '연속 착지 터빈', 10, 13.5, 6, '완벽 착지를 이어가면 잃은 속도 회복', [['gyro', 10]], 'mars', 1),
    U_('draft', 'body', '콤보 기류', 10, 10.5, 6, '콤보 중에는 속도가 덜 줄어듦', [['aero', 20]], 'sun'),

    U_('rocket', 'gear', '로켓 부스터', 30, 1, 8, '부스트 추진력 증가', [['push', 8]]),
    U_('fuel', 'gear', '연료 탱크', 15, 1.5, 7, '부스트 시간 +0.15초', [['rocket', 1]]),
    U_('nozzle', 'gear', '벡터 노즐', 15, 2, 7, '부스트가 앞으로 미는 힘 +5%', [['rocket', 3]]),
    U_('spring', 'gear', '스프링 점퍼', 20, 1, 6, '도약 세기 증가 · 4Lv마다 +1회', [['tire', 3]]),
    U_('wing', 'gear', '글라이더 날개', 10, 2, 5, '공중 중력 -3.5%', [['aero', 3]], 'hill'),
    U_('dash', 'gear', '에어 대시', 15, 3, 7, '급가속 · 5Lv마다 +1회', [['wing', 3]], 'forest'),
    U_('dashpow', 'gear', '대시 증폭기', 15, 4, 7, '대시 세기 +12%', [['dash', 1]], 'sand'),
    U_('convert', 'gear', '활공 전환 날개', 15, 4, 7, '낙하 속도를 전진 속도로 전환', [['wing', 5]], 'sand'),
    U_('airjump', 'gear', '공중 스프링', 10, 4.5, 6, '공중에서도 도약 · 위력 +6%', [['spring', 6]], 'sand'),
    U_('dive', 'gear', '급강하 장치', 12, 5, 7, '내리꽂아 튕김 · 슬램마다 콤보 +1과 골드', [['tire', 8]], 'canyon'),
    U_('jet', 'gear', '제트 엔진', 20, 7, 6, '부스트 추진력 +3%', [['rocket', 15]], 'ice'),
    U_('grav', 'gear', '반중력 코어', 15, 10, 4, '중력 -3%', [['wing', 10]], 'moon'),

    U_('refuel', 'gear', '재급유 장치', 20, 3, 10, '좋은·완벽 착지 때 부스트 연료 회복', [['fuel', 5]]),
    U_('leap', 'gear', '추진 스프링', 15, 10, 6, '공중 도약하면 앞으로도 밀어줌', [['airjump', 10]], 'moon'),
    U_('crater', 'gear', '충격 추진기', 15, 10, 6, '슬램 직후 앞으로 밀어줌', [['dive', 12]], 'moon'),
    U_('amp', 'gear', '증폭 코어', 20, 14.5, 6, '부스트·대시 힘 +4%', [['jet', 15], ['dashpow', 15]], 'rock', 2),
    U_('pslam', 'gear', '정밀 슬램', 10, 10, 6, '바퀴로 내리꽂으면 더 높이 튕김', [['dive', 12]], 'moon'),
    U_('pit', 'gear', '정비 착지', 5, 13.5, 6, '좋은 착지 3연속마다 대시 1회 충전', [['dash', 10]], 'mars', 2),
    U_('jspring', 'gear', '저스트 스프링', 10, 10, 6, '착지 직후 도약이 쉬워지고 앞으로 밀어줌', [['spring', 20]], 'moon'),
    U_('burn', 'gear', '과급 연소', 10, 10.5, 6, '부스트가 세지는 대신 연료를 더 씀', [['fuel', 15]], 'moon'),
    U_('tail', 'gear', '순풍 장치', 15, 10, 7, '시간이 지나도 속도가 덜 줄어듦', [['wing', 10]], 'cloud', 1),
    U_('over', 'gear', '오버클럭', 10, 12, 6, '5Lv마다 도약·대시·급강하 +1회', [['dash', 10]], 'sun', 3),

    U_('ad', 'money', '전단지 광고', 60, 0, 13, '모든 골드 +6%'),
    U_('coin', 'money', '코인 감정사', 60, 0.5, 12, '코인·상자 가치 +8%', [['ad', 3]]),
    U_('magnet', 'money', '코인 자석', 10, 1, 6, '가까운 코인·상자를 끌어당김', [['coin', 3]]),
    U_('style', 'money', '묘기 보너스', 20, 1, 7, '튕길 때마다 골드 +0.25%', [['ad', 8]]),
    U_('combo', 'money', '콤보 미터', 15, 1.5, 7, '3초 안에 이어 먹으면 콤보 · 60콤보부터는 덜 오름', [['coin', 5]]),
    U_('alt', 'money', '고도 수당', 20, 2, 7, '높이 올라갈수록 골드 증가', [['style', 3]]),
    U_('sponsor', 'money', '스폰서 계약', 20, 2, 11, '도달 구역당 골드 +1%', [['ad', 12]], 'hill'),
    U_('trickpay', 'money', '묘기 전속 계약', 15, 2.5, 6, '공중제비 보너스 +20%', [['style', 2]]),
    U_('lucky', 'money', '황금 카트', 10, 3, 9, '2% 확률로 골드 3배 판', [['ad', 15]], 'forest'),
    U_('crate', 'money', '보물 드론', 10, 4, 8, '상자 등장 +30%', [['coin', 10]], 'sand'),
    U_('streak', 'money', '연승 착지', 15, 12, 6, '좋은 착지를 연속으로 이을수록 골드 증가 · 40번까지', [['style', 10]], 'sun', 1),
    U_('ctime', 'money', '콤보 타이머', 10, 12.5, 6, '콤보 유지 시간 +0.15초', [['combo', 10]], 'sun', 1),
    U_('multi', 'money', '다회전 계약', 10, 12, 6, '한 번에 2바퀴 이상 돌면 골드 추가', [['trickpay', 10]], 'sun'),
    U_('allr', 'money', '만능 곡예단', 10, 13, 6, '슬램·공중제비·완벽 착지·콤보를 골고루', [['combo', 10], ['trickpay', 10]], 'mars', 3),
    U_('tractor', 'money', '견인 광선', 10, 14, 6, '화면에 보이는 골드 상자를 하나씩 끌어옴', [['magnet', 15], ['crate', 10]], 'rock', 2),
    U_('haul', 'money', '장거리 수당', 60, 6, 16, '거리 수익 +25%', [['sponsor', 10]], 'ice'),
    U_('encore', 'money', '앙코르', 20, 11, 7, '묘기·착지·콤보·퍼펙트 보너스 +5%', [['style', 10]], 'moon', 2),
  ];
  // the first purchases are priced by hand (gold in the first minutes does not follow the zone rule); their last level still does
  const EARLY = { ramp: 25, runup: 100, timing: 300, rail2: 1500, wheel: 10, tire: 30, frame: 120, aero: 300, bumper: 1200, rocket: 500, fuel: 1500, nozzle: 3000, spring: 800, ad: 12, coin: 80, magnet: 400, style: 900, combo: 2500 };
  // price of level l = the price of the zone that level is scheduled for (zs .. zs+span), so early levels stay cheap and late ones follow the late game
  for (const u of UPS) if (u.zs != null) { u.tab = []; const base = u.max, k0 = EARLY[u.id] ? EARLY[u.id] / (PRICE.first * pr(u.zs) * gref(u.zs)) : 1;
    for (let l = 0; l < base; l++) { const t = base > 1 ? l / (base - 1) : 0, z = u.zs + u.span * t; u.tab.push(PRICE.first * Math.pow(PRICE.last / PRICE.first, t) * pr(z) * gref(z) * Math.pow(k0, 1 - t)); }
    if (EXT[u.id]) { u.base = base; u.max = EXT[u.id]; const gr = u.max - base > 12 ? 1.45 : 1.7; for (let l = base; l < u.max; l++) u.tab.push(u.tab[l - 1] * gr); } }   // long extensions climb a little more gently
  const UP = Object.fromEntries(UPS.map(u => [u.id, u]));
  // the last two launchers form one ladder: the big bang's extra levels climb gently, and every level of the cosmic accelerator costs more than any big-bang level
  { const b = UP.bang, c = UP.cosmos; for (let l = b.base; l < b.max; l++) b.tab[l] = b.tab[l - 1] * 1.12; const c0 = b.tab[b.max - 1] * 1.3; c.tab = Array.from({ length: c.max }, (_, l) => c0 * Math.pow(1.04, l)); }
  const BRANCH = [['launch', '발사'], ['body', '차체'], ['gear', '장치'], ['money', '수익']];

  // ---- rebirth tree (bought with stars) ----------------------------------------------------------------
  const K = (id, br, name, max, desc, req, cap) => ({ id, br, name, max, desc, req: req || [], cap: cap || 0 });
  const PERKS = [
    K('p_power', 'might', '전설의 팔뚝', 30, '발사 속도 +5%'),
    K('p_meter', 'might', '느긋한 호흡', 5, '퍼펙트 구간 +15%', [['p_power', 1]]),
    K('r_focus', 'might', '무아지경', 5, '퍼펙트 보너스 +3%', [['p_meter', 2]]),
    K('r_mem', 'might', '전생의 기억', 10, '환생 때 레벨 8% 유지 · Lv6부터 구역 도달 필요', [['p_power', 2]]),
    K('r_skip', 'might', '개척 지도', 10, '새 구역 개척 골드 +50%', [['p_power', 3]]),
    K('r_double', 'might', '2단 발사', 1, '첫 정점에서 한 번 더 가속', [['p_power', 5], ['r_focus', 2]], 12),
    K('r_perf', 'might', '승부사', 10, '퍼펙트 발사·킥 보너스가 50% 커짐', [['p_power', 2]]),
    K('p_fuel', 'flight', '예비 연료', 8, '부스트 +0.5초'),
    K('r_trick', 'flight', '타고난 곡예사', 20, '공중제비 보너스 +50%', [['p_fuel', 1]]),
    K('r_spring', 'flight', '여분 스프링', 3, '도약 +1회', [['r_trick', 2]]),
    K('r_dash', 'flight', '여분 추진기', 3, '대시 +1회', [['r_spring', 1]]),
    K('r_feather', 'flight', '깃털 몸', 5, '공기 저항 -6%', [['p_fuel', 3]]),
    K('r_phoenix', 'flight', '불사조', 1, '멈추면 한 번 힘차게 다시 날아오름 · 지친 속도 회복 · 도약·대시 +1', [['r_trick', 5], ['r_feather', 2]], 12),
    K('r_land', 'flight', '고양이 착지', 10, '착지·슬램 보너스가 50% 커짐', [['r_trick', 2]]),
    K('r_time', 'flight', '끈기', 5, '한 판 제한 시간 +10초', [['p_fuel', 2]]),
    K('p_gold', 'wealth', '프랜차이즈 본사', 30, '모든 골드 +25%'),
    K('p_seed', 'wealth', '창업 자금', 5, '환생 직후 골드 · 지난 생 최고 판 수익의 일부 · 레벨마다 구역 도달 필요', [['r_disc', 2]]),
    K('r_coin', 'wealth', '황금 손', 10, '코인·상자 가치 +40%', [['p_gold', 2]]),
    K('r_disc', 'wealth', '단골 할인', 5, '업그레이드 가격 -5%', [['p_gold', 1]]),
    K('r_bless', 'wealth', '별의 축복', 1, '별 보너스 1.5배', [['p_gold', 5], ['p_seed', 2]], 15),
  ];
  const PK = Object.fromEntries(PERKS.map(p => [p.id, p]));
  const PBRANCH = [['might', '힘의 길'], ['flight', '비행의 길'], ['wealth', '부의 길']];
  const perkCost = (p, lvl) => p.cap || lvl + 1;
  // Some perk levels also need a zone to have been reached once.  "Reached" counts every life and every cycle, so the condition
  // stays met after a rebirth or a transcendence.  PGATE[id][l] is the zone needed to buy level l + 1.
  // 전생의 기억 is free up to level 5; 창업 자금 opens one step behind it on the same ladder, its last level just before the end of time.
  const PGATE = { r_mem: [0, 0, 0, 0, 0, 'mars', 'saturn', 'pleiades', 'star', 'andromeda'], p_seed: ['crystal', 'nebula', 'hole', 'virgo', 'multi'] };
  const reached = s => Math.max(s.zone || 0, s.zoneEver || 0, zoneAt(s.best || 0));
  const perkGate = (id, l) => { const g = PGATE[id] && PGATE[id][l]; return g ? ZI(g) : 0; };
  const perkLock = (s, id) => { for (const [r, n] of PK[id].req) if ((s.perks[r] || 0) < n) return `${PK[r].name} Lv${n} 필요`; const z = perkGate(id, s.perks[id] || 0); if (z && reached(s) < z) return `${ZONES[z].name} 도달 필요`; return ''; };
  // 창업 자금: share of the best run of the life just ended that is handed over as starting gold, by level
  const SEED = [0, 0.1, 0.2, 0.35, 0.6, 1];
  const STAR_GOLD = 0.04;
  const SEA = ZI('sea');
  // stars for a rebirth: 2 on reaching the sea, then more for every zone (and part of a zone) beyond it
  const starsFor = best => best < ZONES[SEA].at ? 0 : Math.floor(2 * Math.pow(zoneProg(best) - (SEA - 1), 1.4) + 4 * Math.pow(Math.max(0, zoneProg(best) - 16), 1.3));
  // distance at which the next star is earned; Infinity once the star count can no longer grow (past the last zone it would loop forever otherwise)
  function nextStarAt(best) { const n = starsFor(best) + 1; let lo = Math.max(best, ZONES[SEA].at * 0.999), hi = lo * 2, k = 0; while (starsFor(hi) < n) { hi *= 2; if (++k > 200) return Infinity; } for (let i = 0; i < 40; i++) { const m = Math.sqrt(lo * hi); if (starsFor(m) >= n) hi = m; else lo = m; } return hi; }

  // gate: deepest uncharted zone that must have been reached once before the ability can be bought
  const TK = (id, name, max, desc, gate) => ({ id, name, max, desc, gate: gate || 0 });
  const TPERKS = [
    TK('t_speed', '차원 엔진', 150, '발사 속도 ×1.25'), TK('t_gold', '차원 금고', 150, '모든 골드 ×2'), TK('t_star', '별의 기억', 75, '환생 때 받는 별 증가 · 레벨이 오를수록 더 크게'),
    TK('t_cap', '한계 돌파', 50, '최고 속도 한도 증가 · 레벨이 오를수록 더 크게'), TK('t_time', '지구력', 10, '최고 속도가 10% 더 천천히 줄어듦'), TK('t_keep', '전생 각인', 5, '초월 때 환생 트리 유지 +10% (기본 50%)'), TK('t_auto', '자동 구매', 1, '판이 끝날 때마다 살 수 있는 업그레이드 자동 구매'),
    TK('t_land', '완벽주의', 20, '착지·슬램 골드 보너스 +50%', 3), TK('t_multi', '다중 광선', 20, '견인 광선이 한 번에 상자·코인을 1개 더 끌어옴', 5), TK('t_beam', '견인 강화', 25, '견인 광선 주기 -8%', 8),
    TK('t_starpow', '별의 힘', 50, '지금까지 받은 별이 많을수록 발사 속도 증가 · 초월해도 유지 · 레벨이 오를수록 더 크게', 10), TK('t_rekindle', '재점화', 10, '깔끔한 착지마다 최고 속도 한도가 올라가고 그만큼 바로 가속 (완벽 착지는 3배)', 12), TK('t_deep', '심연 개척', 50, '미지의 영역에서 받는 차원석 +10%', 15),
    TK('t_gauge', '급속 충전', 20, '발사 게이지가 빨리 참 (Lv20에 3배) · Lv10부터 퍼펙트 구간에서 자동 발사'), TK('t_spin', '초회전', 50, '2초 넘게 계속 돌리면 회전 속도 증가 · 레벨이 오를수록 더 크게', 16), TK('t_sphx', '슈퍼 불사조', 3, '즉시 슈퍼 불사조로 언제든 변신 가능 · 발사 직후 최고 속도 한도의 1.1/1.3/1.5배로 2/3/4초 질주 · 불사조 도약·대시·급강하 2회씩과 불사조 부스터 50%', 7), TK('t_judge', '수호 보호막', 50, '착지 판정이 넓어짐 · 판정 범위가 보호막으로 보임 · Lv50은 어느 방향이든 완벽 착지', 18),
  ];
  // TW: the strongest abilities cost a multiple of the base price; the 50-level ones climb faster in each band of ten levels (10, 20, 30, 40)
  // TV: what each level of the growing abilities is worth (every level adds more than the one before)
  const TS = { t_cap: 1, t_deep: 1, t_starpow: 1, t_star: 1, t_spin: 1, t_judge: 1 }, TV = { cap: l => 3 + 0.2 * l + 0.004 * l * l, star: l => 0.5 * l * (1 + 0.02 * l), spin: l => 0.04 * l + 0.0016 * l * l, starpow: l => 0.034181 * l * (1 + 0.02 * l) };
  const TP = Object.fromEntries(TPERKS.map(q => [q.id, q])), TW = { t_starpow: 3, t_deep: 3, t_cap: 1.45, t_beam: 2, t_judge: 2 }, tStep = l => Math.pow(1.03, Math.max(0, Math.min(10, l - 10))) * Math.pow(1.06, Math.max(0, Math.min(10, l - 20))) * Math.pow(1.09, Math.max(0, Math.min(10, l - 30))) * Math.pow(1.12, Math.max(0, Math.min(10, l - 40))), tCost = (q, l) => q.id === 't_auto' ? 3 : q.id === 't_sphx' ? [200, 5000, 100000][l] : q.id === 't_multi' ? Math.ceil(30 * Math.pow(1.3, l) * Math.pow(1.1, Math.max(0, l - 10))) : Math.ceil((TW[q.id] || 1) * (l + 1) * Math.pow(1.05, l) * (TS[q.id] ? tStep(l) : TW[q.id] ? Math.pow(1.15, Math.max(0, l - 10)) : 1)), deepEver = s => Math.max(s.deepEver || 0, zoneAt(s.best || 0) - LAST, 0), tGate = (id, l) => id === 't_sphx' ? [7, 15, 30][Math.min(2, l)] : TP[id].gate, tLock = (s, id) => { const g = tGate(id, tl(s, id)); return deepEver(s) < g ? `${tl(s, id) ? 'Lv' + (tl(s, id) + 1) + ' · ' : ''}미지의 영역 ${g} 도달 시 열림` : ''; }, tl = (s, id) => (s.tperks || {})[id] || 0;
  const starsEver = s => Math.max(s.starsEver || 0, s.starsTotal || 0);   // every star ever earned; transcending does not reset it
  const cycleBest = s => Math.max(s.bestT || 0, s.bestLife || 0);
  // shards for a transcendence: 5 for reaching the end of time, more for every uncharted zone beyond it
  // past uncharted zone 20 every further zone pays a growing extra; the whole amount is then multiplied by the step of the deepest zone
  // reached (SHARD_M: [first zone of the step, multiplier]).  Set by the player: uncharted 1-50 in steps of five, then steps of three.
  const SHARD_M = [[6, 1.3], [11, 1.6], [16, 2], [21, 2.3], [26, 2.6], [31, 3], [36, 3.5], [41, 4], [46, 5], [51, 6], [54, 7], [57, 8], [60, 9], [63, 10], [66, 12], [69, 14], [72, 16]];
  const shardMult = z => { let m = 1; for (const [k, v] of SHARD_M) if (z >= k) m = v; return m; };
  const shardsFor = s => { const d = cycleBest(s); if (d < ZONES[LAST].at) return 0; const z = zoneProg(d) - LAST, m = shardMult(z);
    return Math.floor(5 + (3 * Math.pow(z, 1.2) + 6 * Math.pow(Math.max(0, z - 20), 1.5)) * (1 + 0.1 * tl(s, 't_deep')) * m); };
  function buyT(s, id) { const q = TP[id], l = tl(s, id); if (!q || l >= q.max || tLock(s, id) || (s.shards || 0) < tCost(q, l)) return false; s.shards -= tCost(q, l); s.tperks = s.tperks || {}; s.tperks[id] = l + 1; return true; }
  // farT: the deepest zone a transcendence was ever made from (opens the late carts)
  function transcend(s) { const g = shardsFor(s); if (!g) return 0; s.farT = Math.max(s.farT || 0, zoneAt(cycleBest(s)) - LAST); s.shards = (s.shards || 0) + g; s.shardsTotal = (s.shardsTotal || 0) + g; s.trans = (s.trans || 0) + 1; const keep = Math.min(1, 0.5 + 0.1 * tl(s, 't_keep')), pk = {};   // half of the rebirth tree always survives, so the new cycle does not start from nothing
    if (keep) for (const k in s.perks) { const n = Math.floor(s.perks[k] * keep); if (n) pk[k] = n; } s.perks = pk; s.gold = 0; s.lv = {}; s.stars = 0; s.starsTotal = 0; s.bestLife = 0; s.bestT = 0; s.lifeGold = 0; s.zone = 0; checkAch(s, null); return g; }
  const starGain = s => Math.floor(starsFor(s.bestLife) * (1 + TV.star(tl(s, 't_star'))));
  const newSave = () => ({ shards: 0, shardsTotal: 0, trans: 0, tperks: {}, bestT: 0, gold: 0, lv: {}, best: 0, bestLife: 0, zone: 0, runs: 0, stars: 0, starsTotal: 0, perks: {}, rebirths: 0, ach: {}, perfects: 0, slams: 0, v: 3 });
  // saves from before the rebalance: upgrade levels and gold no longer mean the same thing, so they are turned into stars (like a free rebirth)
  // retired shard abilities hand their shards back
  function refundT(s) { for (const id of ['t_combo', 't_fuel']) { const l = (s.tperks || {})[id]; if (l) { let b = 0; for (let i = 0; i < l; i++) b += Math.ceil((i + 1) * Math.pow(1.05, i)); s.shards = (s.shards || 0) + b; delete s.tperks[id]; } } return s; }
  function migrate(s) { refundT(s); if (s.v === 3) return s; const gain = starsFor(s.bestLife || 0); s.stars = (s.stars || 0) + gain; s.starsTotal = (s.starsTotal || 0) + gain; s.lv = {}; s.gold = 0; s.bestLife = 0; s.zone = 0;
    for (const k in s.perks) if (!PK[k]) delete s.perks[k]; else s.perks[k] = Math.min(s.perks[k], PK[k].max); s.ach = s.ach || {}; s.migrated = gain; s.v = 3; return s; }
  const lvl = (s, id) => s.lv[id] || 0;
  const total = s => { let n = 0; for (const k in s.lv) n += s.lv[k]; return n; };
  // past level 250 the price climbs faster than gold income can follow without a full vault; the last forty levels flatten out so
  // they are bought one by one with gold farmed beyond the Garden of Genesis
  const pushCost = (u, l) => { const k = Math.min(l, 90); return u.c0 * Math.pow(u.cm, k) * Math.pow(u.q, k * k) * Math.pow(u.q2, Math.pow(Math.max(0, k - u.l2), 2)) * Math.pow(1.8, Math.max(0, Math.min(l, 250) - 90)) * Math.pow(2.664, Math.max(0, Math.min(l, 360) - 250)) * Math.pow(1.155, Math.max(0, l - 360)); };
  const cost = (s, id) => { const u = UP[id], l = lvl(s, id), base = u.tab ? u.tab[Math.min(l, u.max - 1)] : pushCost(u, l); return Math.ceil(base * (1 - 0.05 * (s.perks.r_disc || 0))); };
  const gateZone = s => Math.max(s.zone, (s.rebirths || 0) >= 3 ? Math.max(s.zoneEver || 0, zoneAt(s.best || 0)) : 0);
  function lockReason(s, id) { const u = UP[id]; if (u.re && (s.rebirths || 0) < u.re) return `환생 ${u.re}회 필요`; if (gateZone(s) < u.zone) return `${ZONES[u.zone].name} 도달 필요`; for (const [r, n] of u.req) if (lvl(s, r) < n) return `${UP[r].name} Lv${n} 필요`; return ''; }
  const canBuy = (s, id) => lvl(s, id) < UP[id].max && !lockReason(s, id) && s.gold >= cost(s, id);
  function buy(s, id) { if (!canBuy(s, id)) return false; s.gold -= cost(s, id); s.lv[id] = lvl(s, id) + 1; return true; }

  // achievements: each is worth +3% gold forever
  const A = (id, name, desc, test) => ({ id, name, desc, test }), FIN_T = 60;   // seconds from reaching the Last Checkout to the ending
  const ACH = [
    A('a_100m', '첫 걸음', '100m 돌파', (s, r) => s.best >= 100), A('a_1km', '동네 한 바퀴', '1km 돌파', (s, r) => s.best >= 1000), A('a_10km', '시 경계 돌파', '10km 돌파', (s, r) => s.best >= 1e4),
    A('a_100km', '도 경계 돌파', '100km 돌파', (s, r) => s.best >= 1e5), A('a_1000km', '대륙 횡단', '1,000km 돌파', (s, r) => s.best >= 1e6), A('a_10000km', '지구 반 바퀴', '10,000km 돌파', (s, r) => s.best >= 1e7),
    A('a_b10', '통통 튀는', '한 판에 10번 튕기기', (s, r) => r && r.bounces >= 10), A('a_b25', '고무공', '한 판에 25번 튕기기', (s, r) => r && r.bounces >= 25),
    A('a_alt100', '구름 위로', '고도 100m 도달', (s, r) => r && r.maxAlt >= 100), A('a_alt10k', '성층권', '고도 10km 도달', (s, r) => r && r.maxAlt >= 1e4),
    A('a_flip1', '첫 공중제비', '묘기 착지 1회', (s, r) => r && r.tricks >= 1), A('a_flip5', '서커스 단원', '한 판에 묘기 5바퀴', (s, r) => r && r.tricks >= 5), A('a_flip15', '인간 팽이', '한 판에 묘기 15바퀴', (s, r) => r && r.tricks >= 15),
    A('a_perf', '칼타이밍', '퍼펙트 발사 10회 누적', (s, r) => (s.perfects || 0) >= 10), A('a_nob', '맨몸 승부', '부스트 없이 1km (로켓 보유 상태)', (s, r) => r && r.st.thrust > 0 && !r.usedBoost && r.maxX >= 1000),
    A('a_coin20', '수금원', '한 판에 코인 20개', (s, r) => r && r.coins >= 20), A('a_coin60', '골드 러시', '한 판에 코인 60개', (s, r) => r && r.coins >= 60), A('a_smash', '철거반', '한 판에 장애물 10개 파괴', (s, r) => r && r.broke >= 10),
    A('a_combo', '줄줄이 사탕', '한 판에 20콤보', (s, r) => r && r.maxCombo >= 20), A('a_slam', '운석 낙하', '급강하 착지 5회 누적', (s, r) => (s.slams || 0) >= 5), A('a_gold', '황금빛 하루', '황금 판을 한 번 달리기', (s, r) => r && r.golden),
    A('a_sea', '바다를 건넌 카트', '만년 설산 도달', (s, r) => s.zone >= ZI('ice')), A('a_cloud', '구름 위 산책', '구름 왕국 도달', (s, r) => s.zone >= ZI('cloud')), A('a_moon', '달 착륙', '달 기지 도달', (s, r) => s.zone >= ZI('moon')),
    A('a_star', '은하 여행자', '은하 고속도로 도달', (s, r) => s.zone >= ZI('star')), A('a_hole', '사건의 지평선', '블랙홀 가장자리 도달', (s, r) => s.zone >= ZI('hole')), A('a_end', '끝을 본 자', '우주의 끝 도달', (s, r) => s.zone >= ZI('end')), A('a_rift', '틈새 여행자', '차원의 틈 도달', (s, r) => s.zone >= ZI('rift')), A('a_sun', '태양에 닿다', '태양 표면 도달', (s, r) => s.zone >= ZI('sun')), A('a_omega', '시간의 끝', '시간의 끝 도달', (s, r) => s.zone >= ZI('omega')), A('a_andro', '이웃 은하', '안드로메다 은하 도달', (s, r) => s.zone >= ZI('andromeda')), A('a_multi', '우주 밖으로', '멀티버스 도달', (s, r) => s.zone >= ZI('multi')),
    A('a_lv100', '단골 손님', '업그레이드 100레벨', (s, r) => total(s) >= 100), A('a_lv300', 'VIP 고객', '업그레이드 300레벨', (s, r) => total(s) >= 300),
    A('a_tr1', '차원을 넘어', '첫 초월', (s, r) => (s.trans || 0) >= 1), A('a_deep5', '미지의 개척자', '미지의 영역 5 도달', (s, r) => s.zone >= LAST + 5), A('a_deep20', '끝없는 여정', '미지의 영역 20 도달', (s, r) => s.zone >= LAST + 20),
    A('a_deep50', '미지의 끝', '미지의 영역 50 도달', (s, r) => s.zone >= LAST + 50), A('a_hall', '영원을 걷는 자', '영원의 회랑 10 도달', (s, r) => s.zone >= LAST + 60), A('a_garden', '창세의 목격자', '창세의 정원 10 도달', (s, r) => s.zone >= LAST + 70),
    A('a_gate', '문을 연 자', '태초의 문 도달', (s, r) => s.zone >= LAST + 71), A('a_throne', '옥좌 앞에서', '무한의 옥좌 도달', (s, r) => s.zone >= LAST + 72), A('a_last', '마지막 손님', '최후의 계산대 도달', (s, r) => s.zone >= LAST + 73),
    A('a_tr10', '차원 방랑자', '초월 10회', (s, r) => (s.trans || 0) >= 10), A('a_tr50', '윤회의 끝', '초월 50회', (s, r) => (s.trans || 0) >= 50), A('a_re50', '쉰 번의 생', '환생 50회', (s, r) => s.rebirths >= 50),
    A('a_push', '한계 없는 근력', '근력 훈련 최대 레벨', (s, r) => lvl(s, 'push') >= UP.push.max), A('a_engine', '엔진 완성', '차원 엔진 최대 레벨', (s, r) => tl(s, 't_speed') >= TP.t_speed.max), A('a_vault', '금고 완성', '차원 금고 최대 레벨', (s, r) => tl(s, 't_gold') >= TP.t_gold.max),
    A('a_stars', '별의 바다', '지금까지 받은 별 3,000만 개', (s, r) => starsEver(s) >= 3e7), A('a_combo1k', '천 번의 박자', '한 판에 1,000콤보', (s, r) => r && r.maxCombo >= 1000), A('a_perf50', '빈틈없는 착지', '한 판에 완벽 착지 50회', (s, r) => r && r.perfLands >= 50),
    A('a_fin', '계산 완료', '최후의 계산대에서 빛에 닿아 엔딩을 보기', (s, r) => (s.ended || 0) >= 1), A('a_fin5', '단골의 귀환', '엔딩 5번 보기', (s, r) => (s.ended || 0) >= 5),
    A('a_re1', '새 출발', '첫 환생', (s, r) => s.rebirths >= 1), A('a_re5', '윤회', '환생 5회', (s, r) => s.rebirths >= 5),
  ];
  function checkAch(s, r) { const got = []; for (const a of ACH) if (!s.ach[a.id] && a.test(s, r)) { s.ach[a.id] = 1; got.push(a); } return got; }
  const achCount = s => { let n = 0; for (const a of ACH) if (s.ach && s.ach[a.id]) n++; return n; };

  function stats(s) {
    const L = id => lvl(s, id), P = id => s.perks[id] || 0, bless = P('r_bless') ? 1.5 : 1;
    const power = 7 * Math.pow(1.05, L('push')) * (1 + 0.02 * L('runup')) * (1 + 0.03 * L('sling')) * (1 + 0.03 * L('cannon')) * (1 + 0.03 * L('rail')) * (1 + 0.04 * L('warp')) * (1 + 0.05 * L('anti')) * (1 + 0.06 * L('singu')) * (1 + 0.07 * L('bang')) * (1 + 0.08 * L('cosmos')) * (1 + 0.05 * P('p_power')) * Math.pow(1.25, tl(s, 't_speed')) * (1 + TV.starpow(tl(s, 't_starpow')) * Math.log2(1 + starsEver(s)));
    const eCap = 0.80 + 0.008 * L('hover'), thrust = L('rocket') ? (3 + 0.4 * L('rocket') + power * (0.05 + 0.004 * L('rocket'))) * (1 + 0.03 * L('jet')) * (1 + 0.04 * L('amp')) * (1 + 0.05 * L('burn')) : 0;
    return {
      power, angle: (14 + 2.8 * L('ramp')) * Math.PI / 180,
      perfect: 1.10 + 0.02 * L('timing') + 0.03 * P('r_focus'), window: (0.025 + 0.006 * L('timing')) * (1 + 0.15 * P('p_meter')), meter: 1.6 / (1 + 0.1 * tl(s, 't_gauge')), autoFire: tl(s, 't_gauge') >= 10, kickB: 0.01 * L('rail2'),
      mu: Math.max(0.06, 0.35 * Math.pow(0.9, L('wheel'))), e: Math.min(eCap, 0.28 + 0.026 * L('tire') + 0.004 * L('float') + 0.008 * L('hover')), eCap, loss: 0.30 * Math.pow(0.86, L('frame')) * (1 - 0.02 * L('wide')),
      wear: (1 - 0.02 * L('wheel')) * (1 - 0.03 * L('tail')), drag: 0.012 * Math.pow(0.92, L('aero')) * (1 - 0.03 * L('heat')) * (1 - 0.06 * P('r_feather')), bumper: L('bumper'), wide: L('wide'), float: L('float'), heat: L('heat'), gyro: L('gyro'), rubber: 1 + 0.05 * L('rubber'),
      thrust, fuel: L('rocket') ? 1.5 + 0.15 * L('fuel') + 0.5 * P('p_fuel') : 0, nozzle: 0.05 * L('nozzle'),
      spring: L('spring'), springN: L('spring') ? 1 + Math.floor(L('spring') / 4) + P('r_spring') + Math.floor(L('over') / 5) : 0, airjump: L('airjump') ? Math.min(1, 0.4 + 0.06 * L('airjump')) : 0,
      dash: L('dash'), dashN: L('dash') ? 1 + Math.floor(L('dash') / 5) + P('r_dash') + Math.floor(L('over') / 5) : 0, dashpow: (1 + 0.12 * L('dashpow')) * (1 + 0.04 * L('amp')),
      dive: L('dive'), diveN: L('dive') ? 1 + Math.floor(L('dive') / 3) + Math.floor(L('over') / 5) : 0, glide: Math.min(0.35, 0.035 * L('wing')), convert: 0.08 * L('convert'), grav: Math.max(0.4, 1 - 0.03 * L('grav')), haul: 1 + 0.25 * L('haul'),
      pioneer: 1 + 0.5 * P('r_skip'), double: P('r_double'), phoenix: P('r_phoenix'), sphx: tl(s, 't_sphx'), encore: 1 + 0.05 * L('encore'), refuel: (0.1 + 0.02 * L('refuel')), tractor: L('tractor') ? (8 - 0.5 * L('tractor')) * Math.pow(0.92, tl(s, 't_beam')) : 0, ampP: 4 * L('amp'), burnP: 5 * L('burn'), turbine: 0.02 * L('turbine'), pit: L('pit'), pslam: 0.012 * L('pslam'), jspring: L('jspring'), draft: 0.02 * L('draft'), streakB: 0.006 * L('streak'), burnK: 1 + 0.04 * L('burn'), comboT: 3 + 0.15 * L('ctime'), beamN: 1 + tl(s, 't_multi'), multi: 0.15 * L('multi'), allB: 0.012 * L('allr'),
      leap: 0.02 + 0.01 * L('leap'), crater: 0.02 + 0.008 * L('crater'), time: 10 * P('r_time'),
      perfB: 0.3 * (1 + 0.5 * P('r_perf')), landG: 0.03 * (1 + 0.5 * P('r_land')) * (1 + 0.5 * tl(s, 't_land')), landP: 0.08 * (1 + 0.5 * P('r_land')) * (1 + 0.5 * tl(s, 't_land')), slamB: 0.08 * (1 + 0.5 * P('r_land')) * (1 + 0.5 * tl(s, 't_land')),
      vcap: TV.cap(tl(s, 't_cap')), tire: 30 * (1 + 0.1 * tl(s, 't_time')), rekindle: 0.005 * tl(s, 't_rekindle'), spinK: 1 + 0.08 * L('gyro'), spinUp: TV.spin(tl(s, 't_spin')), judgeG: 0.26 + 0.01 * L('gyro') + 0.0606 * tl(s, 't_judge'), judgeP: 0.11 + 0.004 * L('gyro') + 0.0606 * tl(s, 't_judge'), judgeT: 0.7 + 0.04 * L('gyro') + 0.0606 * tl(s, 't_judge'),
      rate: Math.pow(2, tl(s, 't_gold')) * (1 + 0.06 * L('ad')) * (1 + 0.25 * P('p_gold')) * (1 + STAR_GOLD * bless * s.starsTotal) * (1 + 0.01 * L('sponsor') * s.zone) * (1 + 0.03 * achCount(s)),
      coin: (1 + 0.08 * L('coin')) * (1 + 0.4 * P('r_coin')), magnet: L('magnet'), magR: L('magnet') ? 0.9 + 0.3 * L('magnet') : 0, style: 0.0025 * L('style'), alt: 0.01 * L('alt'), crate: L('crate'), combo: 0.002 * L('combo'),
      trick: 0.03 * (1 + 0.5 * P('r_trick')) * (1 + 0.2 * L('trickpay')), lucky: 0.02 * L('lucky'),
    };
  }

  // ---- one run ------------------------------------------------------------------------------------
  const hash = n => { let t = (n + 0x6D2B79F5) | 0; t = Math.imul(t ^ (t >>> 15), 1 | t); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const RAMP = 4, WEAR = 0.12, VCAP = 3, PHX_T = 0.7, PDIVE_T = 0.38; let TIRE = 30;
  // top speed allowed at a moment of the run: three times launch speed at first, tiring as the run goes on, so even a maxed cart's run winds down
  // the top-speed cap fades with time since launch (r.fresh).  Holding the boost does not win it back, it only slows the fade: fatigue builds
  // at 1 - BOOST_SLOW of the normal rate (with the endurance perk maxed, -1% of the cap a second instead of -1.65%); the phoenix booster
  // still winds fatigue back by PBOOST_REST seconds per second.  A dash wins back DASH_REST of the fatigue built up so far, a phoenix
  // dash PDASH_REST, a phoenix spring PSPRING_REST
  const BOOST_SLOW = 0.397, PBOOST_REST = 1.25, DASH_REST = 0.01, PDASH_REST = 0.05;
  const vcap = r => { const c = r.st.vcap * r.v0 * Math.max(0.085, (1 + (r.rew || 0)) * Math.exp(-(r.tr - (r.fresh || 0)) / r.st.tire)); return r.sphxT > 0 ? Math.max(c, sphxSpeed(r) * 1.02) : c; };
  // super phoenix: the sprint speed is a multiple of the cap right after launch
  const sphxSpeed = r => r.sphxM * r.st.vcap * r.v0 * (1 + (r.rew || 0));
  // super phoenix, used once a run: either at any moment of the flight (the player transforms; the cart then no longer rises when it stops)
  // or, if not used by then, in place of the phoenix rise when the cart stops.  Its effect: the sprint, the level's phoenix skills and booster share,
  // and every normal skill held turned into phoenix skills (3 springs / 2 dives / 2 dashes make one, a short last group still makes one: 11 -> 4, 9 -> 5)
  const CONV = { spring: 3, dive: 2, dash: 2 }, convOf = r => ({ spring: Math.ceil(r.spring / CONV.spring), dive: Math.ceil(r.dive / CONV.dive), dash: Math.ceil(r.dash / CONV.dash) });
  const canSphx = r => !!(r && !r.over && !r.risen && r.st.sphx);
  const sphxGo = r => { const st = r.st, L = SPHX[Math.min(3, st.sphx)], o = convOf(r); r.sphxM = L.m; r.sphxT = L.t; r.fresh = r.tr;
    r.pspring += o.spring + L.n; r.pdive += o.dive + L.n; r.pdash += o.dash + L.n; r.spring = r.dive = r.dash = 0; if (st.fuel) r.pfuel += L.f * st.fuel; };
  // super phoenix by level: sprint multiple, sprint seconds, and phoenix dashes, springs, booster share and dives granted on rising
  const SPHX = [null, { m: 1.1, t: 2, n: 2, f: 0.5 }, { m: 1.3, t: 3, n: 3, f: 0.7 }, { m: 1.5, t: 4, n: 5, f: 1 }];
  // fatigue won back: a phoenix dash and the phoenix booster 2.5x the plain ones, a phoenix spring 10% of the built-up fatigue
  const PSPRING_REST = 0.05;
  // scale of a launch at speed v: U (length unit), c (height of the coin stream), S (object size), cw (cell width), tw (time warp)
  function scaleOf(st, v) { const U = Math.max(1, v * v / 588), apex = Math.pow(v * Math.sin(st.angle), 2) / 19.6, c = Math.min(4.5 * U, Math.max(0.6, 0.5 * apex)); return { U, c, S: Math.max(1, 0.7 * U), cw: 5 * U, tw: Math.max(1, 0.03 * v) }; }
  function newRun(st, meter, kick, seed) {   // meter 0..1 from the charge gauge (>= 1-window is perfect); kick = multiplier from the ramp-edge tap
    const perfect = meter >= 1 - st.window, m = perfect ? st.perfect : 0.55 + 0.45 * meter / (1 - st.window), dbl = perfect && (kick || 1) > 1.05, v = st.power * m * (kick || 1) * (dbl ? 1.03 : 1), sc = scaleOf(st, v), sd = seed == null ? Math.floor(Math.random() * 1e6) : seed;
    return Object.assign({ st, kick: kick || 1, seed: sd, x: 0, y: RAMP * Math.tan(st.angle) + 0.3, vx: v * Math.cos(st.angle), vy: v * Math.sin(st.angle), v0: v, perfect, dbl, airT: 0, fuel: st.fuel, spring: st.springN, dash: st.dashN, dive: st.diveN,
      t: 0, tr: 0, air: true, rest: 0, back: 0, maxX: 0, maxAlt: 0, maxV: v, bounces: 0, coins: 0, crates: 0, coinGold: 0, broke: 0, used: new Set(), over: false, why: '', ev: [], boosting: false,
      tops: 0, capT: -9, mag: [], tracT: 2, zc: 0, slam: false, slams: 0, combo: 0, comboT: -9, maxCombo: 0, golden: hash(sd * 13 + 5) < st.lucky, ph: hash(sd) * 6.283, ph2: hash(sd + 1) * 6.283,
      ang: st.angle, spin: 0, rotAcc: 0, tricks: 0, crashes: 0, refills: 0, cleans: 0, perfLands: 0, landStreak: 0, maxStreak: 0, spinT: -9, usedBoost: false, doubled: false, risen: false, lastBounce: -9, pspring: 0, pdash: 0, pdive: 0, pfuel: 0, sphxT: 0, sphxM: 1, pdc: 0, fdive: false }, sc);
  }
  // height of the coin stream above the ground at x
  const river = (r, x) => Math.max(0.6 * r.S, r.c * (1 + 0.45 * Math.sin(x / (9 * r.U) + r.ph) + 0.18 * Math.sin(x / (3.7 * r.U) + r.ph2)));
  // objects in cell i (cells are cw wide and start a little after the ramp)
  function cellObjs(r, i) {
    const out = [], cw = r.cw, xa = cw * (1.2 + i), h = k => hash(r.seed * 7919 + i * 31 + k), xm = xa + cw * 0.5, z = zoneAt(xm), Z = ZONES[z], S = r.S;
    const hg = h(1); let gt = hg < 0.10 ? 'pad' : hg < 0.19 ? 'tramp' : hg < 0.31 ? 'haz' : hg < 0.40 ? 'spec' : null;
    if (gt === 'spec') gt = Z.spec ? Z.spec[Math.floor(h(2) * Z.spec.length)] : null;
    if (gt) { const x = xa + cw * (0.15 + 0.7 * h(3)); if (isWater(x, r.U)) gt = gt === 'boat' || h(7) < 0.4 ? 'boat' : null; else if (gt === 'boat') gt = null; if (gt) out.push({ id: i * 8, type: gt, x, y: ground(x, r.U), grounded: true, rad: S, z }); }
    // air: small groups of coins hung at heights across the whole flight envelope (not a line to follow) - worth chasing, easy to miss
    const far = Math.max(0, Math.min(1, (z - 10) / 12)), ha = h(4), lo = 1.8 * S * (1 + 1.2 * far), hi = Math.max(3.5 * S, 2 * r.c) * (1 + 0.6 * far), at = (k, x) => ground(x, r.U) + lo + (hi - lo) * Math.pow(h(k), 1.6 - 0.7 * far);
    if (ha < 0.30) { const n = h(8) < 0.5 ? 2 : 3, x0 = xa + cw * (0.25 + 0.3 * h(9)), y0 = at(10, x0) - ground(x0, r.U), tilt = (h(11) - 0.5) * 0.8; for (let k = 0; k < n; k++) { const x = x0 + k * 1.5 * S; out.push({ id: i * 8 + 1 + k, type: 'coin', x, y: ground(x, r.U) + Math.max(lo, y0 + k * tilt * S), rad: 0.6 * S, z }); } }
    else if (ha < 0.37) { const x = xm; out.push({ id: i * 8 + 4, type: 'ring', x, y: at(12, x), rad: 1.0 * S, z }); }
    if (h(5) < 0.03 * (1 + 0.3 * r.st.crate)) { const x = xa + cw * 0.8; out.push({ id: i * 8 + 5, type: 'crate', x, y: ground(x, r.U) + lo + (hi * (1 + Math.min(1.2, 0.06 * (Z.deep || 0))) - lo) * (0.55 + 0.45 * h(6)), rad: 0.8 * S, z }); }
    return out;
  }
  function hit(r, o) {
    const st = r.st, sp = Math.hypot(r.vx, r.vy), cv = 0.03 * gd(Math.max(30, r.v0 * r.v0 / 9.8), o.z) * st.coin;
    const vr = Math.min(sp, 1.2 * r.v0); r.used.add(o.id);
    if (o.type !== 'haz' && o.type !== 'pool') { r.combo = r.tr - r.comboT < st.comboT ? r.combo + 1 : 1; r.comboT = r.tr; if (r.combo > r.maxCombo) r.maxCombo = r.combo; }
    if (o.type === 'coin') { r.coins++; r.coinGold += cv; r.ev.push({ k: 'coin', x: o.x, y: o.y, g: cv }); }
    else if (o.type === 'crate') { r.crates++; r.coinGold += cv * 12; r.ev.push({ k: 'crate', x: o.x, y: o.y, g: cv * 12 }); }
    else if (o.type === 'pad') { r.vx += Math.max(sp * 0.02, 0.35 * (1.15 * r.v0 * Math.pow(0.94, r.tops++) - sp)) * st.rubber; r.ev.push({ k: 'pad', x: o.x, y: o.y }); }
    else if (o.type === 'tramp' || o.type === 'car' || o.type === 'boat') { r.vy = Math.min(0.8 * r.v0 + 8, Math.max(r.vy, 0) + (7 + vr * (o.type === 'tramp' ? 0.34 : 0.24)) * st.rubber); r.vx *= 1.02; r.air = true; r.bounces++; r.ev.push({ k: 'tramp', x: o.x, y: o.y }); }
    else if (o.type === 'ring') { r.vx += Math.max(sp * 0.015, 0.25 * (1.1 * r.v0 * Math.pow(0.94, r.tops++) - sp)) * st.rubber; r.vy = r.vy * 0.6 + 4 + vr * 0.06; r.ev.push({ k: 'ring', x: o.x, y: o.y }); }
    else if (o.type === 'geyser') { r.vy = Math.min(0.85 * r.v0 + 8, Math.max(r.vy, 0) + 30 + vr * 0.45); r.air = true; r.ev.push({ k: 'geyser', x: o.x, y: o.y }); }
    else if (o.type === 'pool') { const k = 0.55 + 0.044 * st.heat; r.vx *= k; r.vy *= k; r.ev.push({ k: 'burn', x: o.x, y: o.y }); }
    else if (o.type === 'haz') { if (st.bumper >= 6) { r.coinGold += cv * 2; r.broke++; r.vx *= 0.99; r.ev.push({ k: 'smash', x: o.x, y: o.y, g: cv * 2 }); } else { const k = 0.72 + 0.045 * st.bumper; r.vx *= k; r.vy *= k; r.ev.push({ k: 'bonk', x: o.x, y: o.y }); } }
  }
  function objects(r, x0, x1) {
    const i0 = Math.max(0, Math.floor(x0 / r.cw - 1.2)), i1 = Math.min(i0 + 12, Math.floor(x1 / r.cw - 1.2));
    for (let i = i0; i <= i1; i++) for (const o of cellObjs(r, i)) { if (r.used.has(o.id) || o.x <= x0 || o.x > x1) continue;
      if (o.grounded) { if (r.y - ground(o.x, r.U) < 0.6 * r.S) hit(r, o); }
      else if (Math.abs(r.y + 0.5 * r.S - o.y) < o.rad + 0.3 * r.S) hit(r, o); }
  }
  // advance by dt real seconds.  inp = { boost, spring, dash, dive, spin(+1 back / -1 front), skill (context: spring on the ground, dash in the air) }
  function step(r, dtReal, inp) {
    if (r.over) return; const st = r.st, U = r.U; r.ev.length = 0;
    const gZ = lerpZ(r.x, 'g') * st.grav, sp0 = Math.hypot(r.vx, r.vy);
    // one time warp for the whole run (set by the launch speed); only gravity changes stretch it, and rolling is hurried along
    const dt = dtReal * r.tw * Math.sqrt(9.8 / (gZ * (1 - st.glide))) * (r.air ? 1 : 1.4) * Math.min(2, Math.max(1, 0.2 * r.v0 / (sp0 + 0.01 * r.v0)));
    const n = Math.min(80, Math.max(1, Math.ceil(Math.max(sp0 * dt / (0.25 * U), dtReal * 120)))), h = dt / n;
    r.boosting = !!(inp.boost && r.fuel + r.pfuel > 0);
    const gk = Math.sqrt(gZ * (1 - st.glide) / 9.8), alt0 = r.y - ground(r.x, U), grounded0 = alt0 < Math.max(1.2, 0.5 * r.S), vRef = Math.min(1.2 * r.v0, Math.max(sp0, 0.5 * r.v0));
    const dashAdd = () => (6 + st.dash + Math.min(1.2 * r.v0, Math.max(sp0, 0.8 * r.v0)) * (0.08 + 0.006 * st.dash)) * (st.dashpow || 1);
    const doSpring = k => { const pf = k === 1 && r.tr - r.lastBounce < 0.22 + 0.008 * st.jspring ? 1.35 : 1; if (pf > 1 && st.jspring) r.vx += 0.008 * st.jspring * r.v0 * Math.pow(0.94, r.tops++); const fire = r.pspring > 0; if (fire) r.pspring--; else r.spring--; let up = (5 + 0.5 * st.spring + Math.min(1.2 * r.v0, Math.max(sp0, 0.8 * r.v0)) * (0.26 + 0.012 * st.spring)) * pf * k; if (k === 1) up = Math.max(up, Math.sqrt(2.3 * gZ * river(r, r.x + 0.5 * r.cw)) * pf); r.vy = Math.min(0.85 * r.v0 * gk + 8, Math.max(r.vy, 0) + up); r.vx *= 1.03; if (k < 1) r.vx += st.leap * r.v0; if (fire) { r.vx += 0.8 * dashAdd(); r.fresh = (r.fresh || 0) + (r.tr - (r.fresh || 0)) * PSPRING_REST; } r.air = true; if (k === 1) r.rotAcc = 0; r.ev.push({ k: k < 1 ? 'airspring' : pf > 1 ? 'pspring' : 'spring', x: r.x, y: r.y }); if (fire) r.ev.push({ k: 'fspring', x: r.x, y: r.y }); };
    const doDash = () => { const fire = r.pdash > 0; if (fire) r.pdash--; else r.dash--; r.fresh = (r.fresh || 0) + (r.tr - (r.fresh || 0)) * (fire ? PDASH_REST : DASH_REST); const add = dashAdd(); r.vx += add; r.vy = grounded0 ? Math.max(r.vy, 0.18 * r.v0 + 3) : Math.max(r.vy, -0.12 * sp0); if (grounded0) r.air = true; r.ev.push({ k: fire ? 'fdash' : 'dash', x: r.x, y: r.y }); };
    if (inp.sphx && canSphx(r)) { r.risen = true; sphxGo(r); r.ev.push({ k: 'sphxon', x: r.x, y: r.y, sup: st.sphx }); }
    const nSpring = r.spring + r.pspring, nDash = r.dash + r.pdash;
    if (inp.skill) { if (grounded0 && nSpring > 0) doSpring(1); else if (nDash > 0 && !grounded0) doDash(); else if (!grounded0 && st.airjump && nSpring > 0) doSpring(st.airjump); }
    if (inp.spring && nSpring > 0) { if (grounded0) doSpring(1); else if (st.airjump) doSpring(st.airjump); }
    if (inp.dash && r.dash + r.pdash > 0) doDash();
    // dive: a hard push straight down plus some forward speed; from very high it starts fast enough to cover the drop in about 1.2 real seconds
    if (inp.dive && r.pdive > 0 && !grounded0 && r.pdc <= 0 && !r.fdive) { r.pdive--; r.pdc = PDIVE_T; r.ev.push({ k: 'fdivecharge', x: r.x, y: r.y }); }
    else if (inp.dive && r.dive > 0 && !grounded0 && r.pdc <= 0) { r.dive--; r.slam = true; r.vy = -Math.max(Math.abs(r.vy), 0.9 * r.v0, alt0 / (1.1 * r.tw * Math.sqrt(9.8 / (gZ * (1 - st.glide))))); r.vx += vRef * (0.05 + 0.02 * st.dive) + 4; r.spin = 0; r.ev.push({ k: 'dive', x: r.x, y: r.y }); }
    // phoenix dive wind-up: the cart hangs in the air (vertical motion held) but keeps all of its forward speed
    if (r.pdc > 0) { r.pdc -= dtReal; r.vy *= Math.exp(-dtReal * 9); r.spin = 0;
      if (r.pdc <= 0) { r.pdc = 0; r.slam = true; r.fdive = true; r.vy = -Math.max(1.2 * r.v0, alt0 / (0.55 * r.tw * Math.sqrt(9.8 / (gZ * (1 - st.glide))))); r.vx += vRef * (0.08 + 0.02 * st.dive) + 4; r.ev.push({ k: 'fdive', x: r.x, y: r.y }); } }
    if (!r.slam) r.fdive = false;
    if (r.air) r.airT += dtReal; else r.airT = 0;
    if (r.air) { const sd = inp.spin || 0;
      // hyper spin only kicks in after the stick has been held one way for 2 s, so short taps stay easy to aim
      if (sd) { r.spinH = sd === r.spinD ? (r.spinH || 0) + dtReal : 0; r.spinD = sd; const up = 1 + st.spinUp * Math.max(0, Math.min(1, (r.spinH - 2) / 0.4)), mx = 9 * up; r.spin += sd * 16 * st.spinK * up * up * dtReal; r.spin = Math.max(-mx, Math.min(mx, r.spin)); r.spinT = r.tr; r.spinUp = up; }
      else { r.spinD = 0; r.spinH = 0; r.spin *= Math.pow(0.02, dtReal); if (Math.abs(r.rotAcc) < 0.6 && r.tr - r.spinT > 1) { const want = Math.max(-0.9, Math.min(0.9, Math.atan2(r.vy, Math.max(1, r.vx)))); let d = want - r.ang; d = Math.atan2(Math.sin(d), Math.cos(d)); r.ang += d * Math.min(1, dtReal * 4); } }
      r.ang += r.spin * dtReal; r.rotAcc += r.spin * dtReal;
      if (st.double && !r.doubled && !r.slam && r.vy < 0 && r.tr > 0.3) { r.doubled = true; const add = 0.25 * r.v0; r.vx += add * 0.92; r.vy += add * 0.4 + Math.max(0, -r.vy) * 0.5; r.ev.push({ k: 'double', x: r.x, y: r.y }); } }
    // phoenix: for a moment after rising the cart is thrown forward with what three seconds of holding the boost would give
    // (a cart without a rocket gets 25% of its launch speed instead)
    if (r.sphxT > 0) { r.sphxT -= dtReal; const sp = Math.hypot(r.vx, r.vy), T = sphxSpeed(r), k = Math.min(1, dtReal * 10), ns = sp + (T - sp) * k; if (sp > 1e-9) { r.vx *= ns / sp; r.vy *= ns / sp; } else r.vx = ns;
      if (r.sphxT <= 0) { r.sphxT = 0; r.fresh = r.tr; r.ev.push({ k: 'sphxend', x: r.x, y: r.y }); } }
    if (r.phx > 0) { const k = Math.min(dtReal, r.phx) / PHX_T, dv = (st.thrust ? 3 * 1.15 * st.thrust * (1 + st.nozzle) : 0.25 * r.v0) * k; r.phx -= dtReal; r.vx += dv; r.vy += dv * 0.16; }
    if (r.boosting) { r.usedBoost = true; const fireB = r.pfuel > 0; r.fresh = Math.min(r.tr, (r.fresh || 0) + dtReal * (fireB ? 1 + PBOOST_REST : BOOST_SLOW)); let burn = dtReal * st.burnK; if (fireB) { const u = Math.min(r.pfuel, burn); r.pfuel -= u; burn -= u; } r.fuel = Math.max(0, r.fuel - burn); const dv = st.thrust * dtReal * 1.15; r.vx += dv * (1 + st.nozzle); r.vy += dv * (grounded0 ? 0.45 : 0.16) + (r.vy < 0 ? Math.min(-r.vy, dv * 0.5) : 0); if (grounded0 && r.vy > 0) r.air = true; }
    const xPrev = r.x, dg = 0.1 * U;
    for (let i = 0; i < n; i++) {
      const g = gZ * (r.air && !r.slam ? 1 - st.glide * Math.min(1, Math.abs(r.vx) / (0.05 * r.v0 + 1)) : 1), dk = (st.drag * lerpZ(r.x, 'drag') * Math.min(1, 300 / r.tw) + WEAR * st.wear * (1 + (r.tr - (r.fresh || 0)) * (r.tr - (r.fresh || 0)) / 1600) * 9.8 / (r.v0 + 20)) * (st.draft && r.tr - r.comboT < st.comboT ? 1 - st.draft * Math.min(r.combo, 10) / 10 : 1);
      r.vy -= g * h; const d = Math.exp(-dk * h); r.vx *= d; r.vy *= d;
      // a dive keeps its fall speed: the fatigue cap only trims forward speed then, and the wing's lift and the altitude converter wait until the slam lands
      { const s2 = Math.hypot(r.vx, r.vy), cap = vcap(r); if (r.slam && r.vy < 0) { if (Math.abs(r.vx) > cap) { r.vx = Math.sign(r.vx) * cap; r.capT = r.tr; } } else if (s2 > cap) { r.vx *= cap / s2; r.vy *= cap / s2; r.capT = r.tr; } }
      if (st.convert && r.air && r.vy < 0 && !r.slam) { const f = 1 - Math.exp(-st.convert * h * gZ / (r.v0 + 1)), vy0 = r.vy; r.vy *= 1 - f; r.vx = Math.sqrt(Math.max(0, r.vx) * Math.max(0, r.vx) + (vy0 * vy0 - r.vy * r.vy) * 0.8); }
      r.x += r.vx * h; r.y += r.vy * h;
      const gy = ground(r.x, U);
      if (r.y <= gy) {
        r.y = gy; const sl = (ground(r.x + dg, U) - ground(r.x - dg, U)) / (2 * dg); let nl = Math.hypot(sl, 1), nx = -sl / nl, ny = 1 / nl, tx = ny, ty = -nx;
        let vn = r.vx * nx + r.vy * ny, vt = r.vx * tx + r.vy * ty;
        if (vn < -(0.05 * r.v0 + 0.8 + Math.abs(vt) * 0.02) || (r.slam && vn < 0)) { nl = Math.hypot(sl * 0.5, 1); nx = -sl * 0.5 / nl; ny = 1 / nl; tx = ny; ty = -nx; vn = r.vx * nx + r.vy * ny; vt = r.vx * tx + r.vy * ty; }
        if (vn < 0) {
          let al = 0; const imp = -vn, water = isWater(r.x, U), Z = ZONES[zoneAt(r.x)], soft = Math.max(0.15, 1 - 0.085 * st.wide);
          if (r.air) { const sa = Math.atan(sl), dd = Math.atan2(Math.sin(r.ang - sa), Math.cos(r.ang - sa)), flips = Math.round(Math.abs(r.rotAcc) / 6.2832);
            // flips and landing attitude are judged separately: a flip that ends wheels-down earns the trick bonus and the landing bonus
            const trick = flips >= 1 && Math.abs(dd) < st.judgeT, crash = !trick && Math.abs(r.rotAcc) > 1.2 && Math.abs(dd) > Math.max(1.4, st.judgeG), long = r.airT > 0.35;
            if (trick) { r.tricks += flips + st.multi * (Math.min(flips, 5) - 1); vt *= 1 + Math.min(0.25, 0.05 * flips); r.ev.push({ k: 'trick', x: r.x, y: r.y, n: flips, clean: Math.abs(dd) < 0.2 }); }
            if (crash) { vt *= 0.75; r.crashes++; r.ev.push({ k: 'crash', x: r.x, y: r.y }); }
            if (long && Math.abs(dd) < st.judgeG) { const pf = Math.abs(dd) < st.judgeP; al = pf ? 2 : 1; r.cleans++; if (pf) r.perfLands++; if (st.rekindle) { const up = Math.min(st.rekindle * (pf ? 3 : 1), 10 * st.rekindle - (r.rew || 0)); r.rew = (r.rew || 0) + up; r.vx *= 1 + up; r.vy *= 1 + up; if (up > 0) r.ev.push({ k: 'rekindle', x: r.x, y: r.y }); } r.landStreak++; if (r.landStreak > r.maxStreak) r.maxStreak = r.landStreak;
              const fu = (pf ? st.refuel : st.refuel / 2) * (r.slam ? (pf ? 2 : 1.5) : 1); if (st.fuel) r.fuel = Math.min(st.fuel, r.fuel + fu); r.ev.push({ k: 'clean', x: r.x, y: r.y, pf, n: r.landStreak, f: fu, slam: r.slam }); if (st.pit && r.landStreak % 3 === 0 && r.refills < st.pit && r.dash < st.dashN) { r.dash++; r.refills++; r.ev.push({ k: 'recharge', x: r.x, y: r.y }); } }
            else if (long && !crash && Math.abs(dd) > 1.1) { al = -1; r.landStreak = 0; r.ev.push({ k: 'badland', x: r.x, y: r.y }); }
            else if (long && !trick) r.landStreak = 0;
            r.airT = 0; r.rotAcc = 0; r.spin = 0; r.ang = sa; r.lastBounce = r.tr; }
          if (water && !st.float) { if (Math.abs(vt) > 0.25 * r.v0 && imp < Math.abs(vt) * 0.55) { vn = imp * 0.45; vt *= 0.86; r.bounces++; r.air = true; r.ev.push({ k: 'skip', x: r.x, y: r.y }); } else { r.over = true; r.why = '물에 빠졌어요'; r.ev.push({ k: 'sink', x: r.x, y: r.y }); break; } }
          else {
            const rough = Z.loss > 1 ? 1 + (Z.loss - 1) * soft : Z.loss, eZ = Z.e < 1 ? 1 - (1 - Z.e) * soft : Z.e, e = water ? 0.4 + 0.035 * st.float : Math.min(st.eCap + 0.02, st.e * eZ);
            if (r.slam && !water) { r.slam = false; r.slams++; r.combo = r.tr - r.comboT < st.comboT ? r.combo + 1 : 1; r.comboT = r.tr; if (r.combo > r.maxCombo) r.maxCombo = r.combo; vn = Math.min(0.85 * r.v0 * gk, imp * Math.min(0.99, e + 0.08 + 0.02 * st.dive + (al > 1 ? st.pslam : al > 0 ? st.pslam / 2 : 0))); vt = vt * 1.02 + st.crater * r.v0; r.bounces++; r.air = true; r.ev.push({ k: 'slam', x: r.x, y: r.y, imp, combo: r.combo }); }
            else if (imp > 0.05 * r.v0 + 0.8 + Math.abs(vt) * 0.02) { vn = Math.min(0.72 * r.v0 * gk + 2, imp * e); vt *= (1 - Math.min(0.9, (water ? 0.16 - 0.01 * st.float : st.loss * rough) * (al > 0 ? 0.35 : 1) * Math.min(1, imp / (Math.abs(vt) + 1) * 3 + 0.25))) ; r.bounces++; r.air = true; r.ev.push({ k: 'bounce', x: r.x, y: r.y, imp }); }
            else { vn = 0; r.air = false; r.slam = false; r.ang = Math.atan(sl); const muZ = Z.mu > 1 ? 1 + (Z.mu - 1) * soft : Z.mu, mu = water ? 0.5 / (1 + 0.6 * st.float) : st.mu * muZ, dec = mu * g * h; vt = Math.abs(vt) <= dec ? 0 : vt - Math.sign(vt) * dec; }
          }
          if (al) vt *= al > 1 ? 1.03 : al > 0 ? 1.01 : 0.88; if (al > 1 && st.turbine && vt > 0) vt += Math.max(0, 1.1 * r.v0 - vt) * st.turbine * Math.min(r.landStreak, 5) / 5;
          r.vx = vn * nx + vt * tx; r.vy = vn * ny + vt * ty;
        }
      } else if (r.y - gy > 0.3 * r.S) r.air = true;
      if (r.y - gy > r.maxAlt) r.maxAlt = r.y - gy;
    }
    if (!r.over && r.x > xPrev) objects(r, xPrev, r.x);
    if (st.magR && !r.over) { const R = st.magR * r.S, cy = r.y + 0.5 * r.S, i0 = Math.max(0, Math.floor((xPrev - R) / r.cw - 1.2)), i1 = Math.floor((r.x + R) / r.cw - 1.2);
      for (let i = i0; i <= i1; i++) for (const o of cellObjs(r, i)) { if ((o.type !== 'coin' && o.type !== 'crate') || r.used.has(o.id)) continue; const dx = o.x < xPrev ? xPrev - o.x : o.x > r.x ? o.x - r.x : 0;
        if (Math.hypot(dx, o.y - cy) < R) { r.used.add(o.id); r.mag.push({ o, t0: r.tr }); r.ev.push({ k: 'pull', x: o.x, y: o.y }); } } }
    // tractor beam: every few seconds one gold crate anywhere on screen is reeled in, however far above or below it is
    if (st.tractor && !r.over && r.tr >= r.tracT) { const c = [], i0 = Math.max(0, Math.floor((r.x - 4 * U) / r.cw - 1.2)), i1 = Math.floor((r.x + (15 + 6 * (st.beamN - 1)) * U) / r.cw - 1.2);
      const g = [];
      for (let i = i0; i <= i1; i++) for (const o of cellObjs(r, i)) if (!r.used.has(o.id)) { if (o.type === 'crate') c.push(o); else if (o.type === 'coin' && st.beamN > 1) g.push(o); }
      // one crate as before; the extra beams take more crates first, then coins
      for (let n = 0; n < st.beamN && c.length + g.length; n++) { const a = c.length ? c : g, o = a.splice(Math.floor(hash(r.seed + Math.floor(r.tr * 20) + n * 7.3) * a.length), 1)[0]; r.used.add(o.id); r.mag.push({ o, t0: r.tr, d: 0.6, beam: 1 }); r.tracT = r.tr + st.tractor; if (!n) r.ev.push({ k: 'tractor', x: o.x, y: o.y }); } }
    for (let k = r.mag.length - 1; k >= 0; k--) if (r.over || r.tr - r.mag[k].t0 >= (r.mag[k].d || 0.3)) { hit(r, Object.assign({}, r.mag[k].o, { x: r.x, y: r.y + 0.5 * r.S })); r.mag.splice(k, 1); }
    if (r.fin == null && !r.over && r.x >= ZONES[LAST + DEEP].at) { r.fin = r.tr; r.ev.push({ k: 'finale', x: r.x, y: r.y }); }
    if (r.fin != null && !r.over) { const m = 0.3 * r.v0; if (r.vx < m) r.vx = m; if (r.tr - r.fin >= FIN_T) { r.finDone = true; r.over = true; r.why = '계산 완료'; r.ev.push({ k: 'ending', x: r.x, y: r.y }); } }
    for (let z = zoneAt(r.x); r.zc < z;) { const Z = ZONES[++r.zc], lv = Math.max(Z.water ? st.float : 0, Z.spec && Z.spec.includes('pool') ? st.heat : 0, Z.rough ? st.wide : 0); if (lv) { const add = 0.012 * lv * r.v0 * Math.pow(0.94, r.tops++); r.vx += add; r.ev.push({ k: 'zboost', x: r.x, y: r.y, z: r.zc, pct: Math.round(1.2 * lv) }); } }
    { const s2 = Math.hypot(r.vx, r.vy), cap = vcap(r); if (s2 > cap) { r.vx *= cap / s2; r.vy *= cap / s2; r.capT = r.tr; } }   // pads, rings and zone boosts obey the ceiling too
    r.t += dt; r.tr += dtReal; if (r.x > r.maxX) r.maxX = r.x;
    const sp = Math.hypot(r.vx, r.vy); if (sp > r.maxV) r.maxV = sp;
    if (!r.over && r.fin == null) {
      // the run ends when the cart has lost nearly all of its launch speed on the ground, or starts rolling back down a slope
      if (!r.air && sp < Math.max(0.35, 0.04 * r.v0)) r.rest += dtReal; else r.rest = 0;
      if (!r.air && r.vx < 0) r.back += dtReal; else r.back = 0;
      if (r.rest > 0.5 || r.back > 0.7) { if ((st.phoenix || st.sphx) && !r.risen) { r.risen = true; r.rest = r.back = 0; r.fresh = Math.max(r.fresh || 0, r.tr - st.tire * Math.log(1 / 0.7)); r.vx = 0.75 * r.v0; r.vy = 1.05 * r.v0 * Math.sqrt(gZ * (1 - st.glide) / 9.8); r.y += 0.5; r.air = true; r.phx = PHX_T; r.slam = false; r.fdive = false; r.pdc = 0;
        if (st.sphx) sphxGo(r);
        else { r.spring++; r.dash++; }
        r.ev.push({ k: 'phoenix', x: r.x, y: r.y, sup: st.sphx || 0 }); } else { r.over = true; r.why = r.back > 0.7 ? '언덕을 넘지 못했어요' : '멈췄어요'; } }
      if (r.tr > 100 + st.time + (r.risen ? 30 : 0) + Math.min(100, 10 * Math.max(0, zoneAt(r.maxX) - 8))) { r.over = true; r.why = '시간 초과'; } }
  }
  function payout(r, s) {
    const st = r.st, D = r.maxX, z = zoneAt(D), dist = gd(D, z) * st.rate * st.haul, coins = r.coinGold * st.rate;
    const style = st.style * r.bounces, alt = st.alt * Math.log2(1 + r.maxAlt / (2 * r.U)), perfect = r.perfect ? st.perfB : 0, kickB = r.kick > 1.05 ? st.perfB : r.kick > 1 ? st.perfB / 3 : 0, dbl = r.dbl ? 2 * st.perfB : 0, land = st.landG * (r.cleans - r.perfLands) + st.landP * r.perfLands, slam = st.slamB * r.slams + st.streakB * Math.min(40, r.maxStreak) + st.allB * Math.min(2 * r.slams, r.tricks, r.perfLands, Math.floor(r.maxCombo / 5), 15), trick = st.trick * r.tricks, combo = st.combo * (r.maxCombo <= 60 ? r.maxCombo : 60 + 8 * Math.sqrt(r.maxCombo - 60)), gold = r.golden ? 3 : 1;
    let first = 0; for (let i = zoneAt(s.bestLife || 0) + 1; i <= z; i++) first += 3 * gd(ZONES[i].at, i) * st.rate * st.pioneer;   // base gold for zones reached for the first time this life; bonuses multiply it too
    const mult = 1 + (style + alt + perfect + kickB + dbl + land + slam + trick + combo) * st.encore;
    return { dist, coins, style, alt, perfect, kickB, dbl, land, slam, trick, combo, gold, first, mult, total: Math.floor((dist + coins + first) * mult * gold), zone: z };
  }
  function finish(r, s) { const p = payout(r, s); s.gold += p.total; s.runs++; if (r.finDone) s.ended = (s.ended || 0) + 1; if (p.total > (s.lifeGold || 0)) s.lifeGold = p.total; if (r.maxX > (s.bestT || 0)) s.bestT = r.maxX; if (r.perfect) s.perfects = (s.perfects || 0) + 1; if (r.slams) s.slams = (s.slams || 0) + r.slams;
    p.record = r.maxX > s.best; if (r.maxX > s.best) s.best = r.maxX; if (r.maxX > s.bestLife) s.bestLife = r.maxX; p.newZone = p.zone > s.zone; if (p.zone > s.zone) s.zone = p.zone; if (s.zone > (s.zoneEver || 0)) s.zoneEver = s.zone; if (s.zone - LAST > (s.deepEver || 0)) s.deepEver = s.zone - LAST; p.ach = checkAch(s, r); return p; }
  function rebirth(s) { const gain = starGain(s); if (gain <= 0) return 0; const seed = (s.perks.p_seed || 0) ? 100 * Math.pow(10, s.perks.p_seed) + SEED[Math.min(5, s.perks.p_seed)] * (s.lifeGold || 0) : 0, keep = 0.08 * (s.perks.r_mem || 0);
    s.starsEver = starsEver(s) + gain; s.stars += gain; s.starsTotal += gain; s.rebirths++; s.gold = seed;
    // once auto rebirth is owned, a rebirth keeps every upgrade level (only transcending resets them); before that the memory perk keeps a share
    if (!s.autoReb) { const lv = {}; if (keep) for (const k in s.lv) { const n = Math.floor(s.lv[k] * keep); if (n) lv[k] = n; } s.lv = lv; } s.bestLife = 0; s.lifeGold = 0; s.zone = 0; checkAch(s, null); return gain; }
  function buyAll(s) { let n = 0; for (; n < 20000;) { let best = null, bc = Infinity; for (const u of UPS) if (canBuy(s, u.id)) { const c = cost(s, u.id); if (c < bc) { bc = c; best = u.id; } } if (!best) break; buy(s, best); n++; } return n; }
  function buyAllPerks(s) { let n = 0; for (; n < 2000;) { let best = null, bc = Infinity; for (const q of PERKS) { const l = s.perks[q.id] || 0, c = perkCost(q, l); if (l < q.max && !perkLock(s, q.id) && c <= s.stars && c < bc) { bc = c; best = q.id; } } if (!best) break; buyPerk(s, best); n++; } return n; }
  function buyPerk(s, id) { const p = PK[id], l = s.perks[id] || 0; if (!p || l >= p.max || perkLock(s, id) || s.stars < perkCost(p, l)) return false; s.stars -= perkCost(p, l); s.perks[id] = l + 1; return true; }
  return { ZONES, ZI, zoneAt, zoneProg, lerpZ, ground, isWater, UPS, UP, BRANCH, PERKS, PK, PBRANCH, perkCost, perkLock, perkGate, reached, SEED, STAR_GOLD, starsFor, nextStarAt, ACH, checkAch, achCount, FIN_T,
    setTire: v => { TIRE = v; }, vcap, newSave, migrate, lvl, total, cost, lockReason, canBuy, buy, stats, RAMP, scaleOf, newRun, PDIVE_T, tGate, river, cellObjs, step, payout, finish, canSphx, convOf, CONV, rebirth, buyPerk, buyAll, buyAllPerks, gateZone, LAST, TPERKS, TP, tCost, tl, TV, shardsFor, shardMult, SHARD_M, buyT, tLock, deepEver, starsEver, transcend, starGain, cycleBest, gd, gref };
})();
if (typeof module !== 'undefined') module.exports = CORE;
