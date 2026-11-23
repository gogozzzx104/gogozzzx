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
    { id: 'moon', name: '달 기지', at: 1200000, g: 5.5, drag: 0.6, amp: 0.84, wl: 24, sk: -0.5, la: 1.5, mu: 0.8, e: 1.03, loss: 0.8, sky: ['#05060d', '#141a33'], ground: '#9a9aa6', deco: 'moon' },
    { id: 'rock', name: '소행성대', at: 3000000, g: 4.5, drag: 0.6, amp: 0.72, wl: 20, sk: -0.7, la: 2, mu: 1.8, e: 0.9, loss: 1.4, rough: 1, sky: ['#070812', '#221a38'], ground: '#6b6258', deco: 'rock' },
    { id: 'star', name: '은하 고속도로', at: 7500000, g: 7, drag: 0.8, amp: 0.93, wl: 44, sk: 0.35, la: 3, mu: 0.6, e: 1.05, loss: 0.7, sky: ['#0a0220', '#3a0f66'], ground: '#5b2bd6', deco: 'star' },
    { id: 'hole', name: '블랙홀 가장자리', at: 20000000, g: 14, drag: 1.3, amp: 1.69, wl: 36, sk: 0.5, la: 3, mu: 1.2, e: 0.9, loss: 1.2, rough: 1, spec: ['pool', 'geyser'], sky: ['#000000', '#3a0a16'], ground: '#1a1020', deco: 'hole' },
    { id: 'end', name: '우주의 끝', at: 50000000, g: 6, drag: 0.9, amp: 1.6, wl: 40, sk: 0.3, la: 3.5, mu: 1.5, e: 0.95, loss: 1.3, rough: 1, spec: ['pool'], sky: ['#b8e8ff', '#f6f0ff'], ground: '#2b2233', deco: 'end' },
    { id: 'rift', fx: 'rift', name: '차원의 틈', at: 1.2e8, g: 9, drag: 1, amp: 1.4, wl: 34, sk: 0.6, la: 3, mu: 1.3, e: 0.95, loss: 1.2, rough: 1, spec: ['geyser'], sky: ['#12002b', '#6a1fb5'], ground: '#2a0f4a', deco: 'hole' },
    { id: 'crystal', fx: 'crystal', name: '수정 행성', at: 3e8, g: 7, drag: 0.8, amp: 1.1, wl: 26, sk: 0.4, la: 2.5, mu: 0.3, e: 1.05, loss: 0.6, spec: ['tramp'], sky: ['#0b3a4a', '#7ff0e0'], ground: '#bff5ee', deco: 'ice' },
    { id: 'sun', fx: 'sun', name: '태양 표면', at: 7.5e8, g: 12, drag: 1.3, amp: 1.3, wl: 30, sk: 0.7, la: 2.5, mu: 1.2, e: 0.9, loss: 1.1, spec: ['pool', 'geyser'], sky: ['#ff7a1a', '#ffe27a'], ground: '#7a2a0a', deco: 'lava' },
    { id: 'nebula', fx: 'nebula', name: '무지개 성운', at: 2e9, g: 6, drag: 0.8, amp: 1, wl: 38, sk: 0.2, la: 3, mu: 0.5, e: 1.1, loss: 0.6, spec: ['tramp'], sky: ['#3a1a6a', '#ff9ec7'], ground: '#e8d9ff', deco: 'cloud' },
    { id: 'omega', fx: 'omega', name: '시간의 끝', at: 5e9, g: 8, drag: 1, amp: 1.6, wl: 42, sk: 0.3, la: 3.5, mu: 1, e: 1, loss: 1, rough: 1, spec: ['pool'], sky: ['#000010', '#1a3a6a'], ground: '#101830', deco: 'star' },
  ];
  const ZI = id => ZONES.findIndex(z => z.id === id);
  const zoneAt = x => { let z = 0; for (let i = 1; i < ZONES.length; i++) if (x >= ZONES[i].at) z = i; return z; };
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
  const GT = [40, 330, 1100, 3300, 8500, 2.2e4, 4.8e4, 1.4e5, 3.7e5, 1.9e6, 6e6, 3.2e7, 8.5e7, 5e8, 1.6e9];
  const gref = z => { const f = k => k < GT.length ? GT[Math.max(0, k)] : GT[GT.length - 1] * Math.pow(2.6, k - GT.length + 1), a = Math.floor(z), t = z - a; return Math.exp(Math.log(f(a)) * (1 - t) + Math.log(f(a + 1)) * t); };
  // prices in "runs of gold": the first level of an upgrade costs about PRICE.first runs, its last level PRICE.last runs; past the sea everything gets steeper
  const PRICE = { first: 3, last: 12, late: 1.9, from: 5 };
  const pr = z => Math.pow(PRICE.late, Math.max(0, z - PRICE.from));
  const U_ = (id, br, name, max, zs, span, desc, req, zone, re) => ({ id, br, name, max, zs, span, desc, req: req || [], zone: zone ? ZI(zone) : 0, re: re || 0 });
  // levels past an upgrade's original cap: each costs 1.7x the one before
  const EXT = { magnet: 20, style: 30, combo: 25, trickpay: 25, alt: 30, fuel: 25, dashpow: 25, dive: 18, airjump: 15, gyro: 15, rubber: 15, float: 15, heat: 15, wide: 15, crate: 15, lucky: 15, nozzle: 25, jet: 30 };
  const UPS = [
    { id: 'push', br: 'launch', name: '근력 훈련', max: 400, c0: 8, cm: 1.1, q: 1.0008, q2: 1.006, l2: 50, desc: '발사 속도 ×1.05 · 한도 없음', req: [], zone: 0 },
    U_('ramp', 'launch', '발사 경사로', 10, 0, 2.5, '발사 각도 +2.8°', [['push', 3]]),
    U_('runup', 'launch', '도움닫기', 30, 0.5, 4, '발사 속도 +2%', [['push', 5]]),
    U_('timing', 'launch', '타이밍 감각', 10, 0.8, 3, '퍼펙트 구간 확대 · 보너스 +2%', [['runup', 3]]),
    U_('rail2', 'launch', '가속 레일', 10, 1.2, 3, '킥 보너스 +1%p', [['push', 6]]),
    U_('sling', 'launch', '대형 새총', 20, 2, 4, '발사 속도 +3%', [['ramp', 5]], 'hill'),
    U_('cannon', 'launch', '화약 대포', 20, 5, 4, '발사 속도 +3%', [['sling', 10]], 'canyon'),
    U_('rail', 'launch', '레일건', 20, 9, 5, '발사 속도 +3%', [['cannon', 10]], 'cloud'),

    U_('warp', 'launch', '워프 코일', 20, 11, 6, '발사 속도 +4%', [['rail', 10]], 'moon', 1),

    U_('wheel', 'body', '바퀴 윤활', 18, 0, 2.5, '굴림 마찰 -10% · 자연 감속 -2%'),
    U_('tire', 'body', '탄성 타이어', 20, 0.3, 3.5, '반발력 +2.6%p', [['wheel', 3]]),
    U_('frame', 'body', '경량 프레임', 20, 0.6, 4, '착지 때 잃는 속도 -14%', [['wheel', 5]]),
    U_('aero', 'body', '공기역학 커버', 40, 1, 12, '공기 저항 -8%', [['frame', 3]]),
    U_('bumper', 'body', '강화 범퍼', 10, 1.5, 5, '충돌 손실 감소 · Lv6부터 부수고 골드', [['frame', 5]]),
    U_('gyro', 'body', '자이로 안정기', 10, 2, 5, '회전이 빨라지고 착지 판정이 넓어짐', [['frame', 3]]),
    U_('rubber', 'body', '초탄성 서스펜션', 10, 2.5, 5, '트램펄린·패드·링 효과 +5%', [['tire', 6]]),
    U_('wide', 'body', '광폭 타이어', 10, 3, 6, '험지 페널티 감소 · 험지 구역을 지날 때 가속', [['tire', 5]], 'forest'),
    U_('float', 'body', '부력 튜브', 10, 6, 5, '물 위에서 튕김 · 바다를 지날 때 가속', [], 'sea'),
    U_('hover', 'body', '호버 스커트', 15, 6.5, 7, '반발력과 한도 +0.8%p', [['tire', 15]], 'sea'),
    U_('heat', 'body', '내열 코팅', 10, 8, 5, '용암 피해 감소 · 용암 구역을 지날 때 가속', [], 'lava'),

    U_('rocket', 'gear', '로켓 부스터', 30, 1, 8, '부스트 추진력 증가', [['push', 8]]),
    U_('fuel', 'gear', '연료 탱크', 15, 1.5, 7, '부스트 시간 +0.15초', [['rocket', 1]]),
    U_('nozzle', 'gear', '벡터 노즐', 15, 2, 7, '부스트 전진력 +5%', [['rocket', 3]]),
    U_('spring', 'gear', '스프링 점퍼', 20, 1, 6, '도약 세기 증가 · 4Lv마다 +1회', [['tire', 3]]),
    U_('wing', 'gear', '글라이더 날개', 10, 2, 5, '공중 중력 -3.5%', [['aero', 3]], 'hill'),
    U_('dash', 'gear', '에어 대시', 15, 3, 7, '급가속 · 5Lv마다 +1회', [['wing', 3]], 'forest'),
    U_('dashpow', 'gear', '대시 증폭기', 15, 4, 7, '대시 세기 +12%', [['dash', 1]], 'sand'),
    U_('convert', 'gear', '활공 전환 날개', 15, 4, 7, '낙하 속도를 전진 속도로 전환', [['wing', 5]], 'sand'),
    U_('airjump', 'gear', '공중 스프링', 10, 4.5, 6, '공중에서도 도약 · 위력 +6%', [['spring', 6]], 'sand'),
    U_('dive', 'gear', '급강하 장치', 12, 5, 7, '내리꽂아 강하게 튕김 · 슬램마다 콤보 +1, 골드 보너스 · 3Lv마다 +1회', [['tire', 8]], 'canyon'),
    U_('jet', 'gear', '제트 엔진', 20, 7, 6, '부스트 추진력 +3%', [['rocket', 15]], 'ice'),
    U_('grav', 'gear', '반중력 코어', 15, 10, 4, '중력 -2%', [['wing', 10]], 'moon'),

    U_('refuel', 'gear', '재급유 장치', 20, 3, 10, '완벽 착지 연료 회복 +0.02초 (좋은 착지는 절반)', [['fuel', 5]]),
    U_('tail', 'gear', '순풍 장치', 15, 10, 7, '자연 감속 -3%', [['wing', 10]], 'cloud', 1),
    U_('over', 'gear', '오버클럭', 10, 12, 6, '5Lv마다 도약·대시·급강하 +1회', [['dash', 10]], 'rock', 3),

    U_('ad', 'money', '전단지 광고', 60, 0, 13, '모든 골드 +6%'),
    U_('coin', 'money', '코인 감정사', 60, 0.5, 12, '코인·상자 가치 +8%', [['ad', 3]]),
    U_('magnet', 'money', '코인 자석', 10, 1, 6, '가까운 코인·상자를 끌어당김 · Lv마다 범위 증가', [['coin', 3]]),
    U_('style', 'money', '묘기 보너스', 20, 1, 7, '튕길 때마다 골드 +0.25%', [['ad', 8]]),
    U_('combo', 'money', '콤보 미터', 15, 1.5, 7, '3초 안에 이어 먹으면 콤보 · 콤보당 +0.2%', [['coin', 5]]),
    U_('alt', 'money', '고도 수당', 20, 2, 7, '최고 고도만큼 골드 보너스', [['style', 3]]),
    U_('sponsor', 'money', '스폰서 계약', 20, 2, 11, '도달 구역당 골드 +1%', [['ad', 12]], 'hill'),
    U_('trickpay', 'money', '묘기 전속 계약', 15, 2.5, 6, '공중제비 보너스 +20%', [['style', 2]]),
    U_('lucky', 'money', '황금 카트', 10, 3, 9, '2% 확률로 골드 3배 판', [['ad', 15]], 'forest'),
    U_('crate', 'money', '보물 드론', 10, 4, 8, '상자 등장 +30%', [['coin', 10]], 'sand'),
    U_('encore', 'money', '앙코르', 20, 11, 7, '묘기·착지·콤보·퍼펙트 보너스 +5%', [['style', 10]], 'moon', 2),
  ];
  // the first purchases are priced by hand (gold in the first minutes does not follow the zone rule); their last level still does
  const EARLY = { ramp: 25, runup: 100, timing: 300, rail2: 1500, wheel: 10, tire: 30, frame: 120, aero: 300, bumper: 1200, rocket: 500, fuel: 1500, nozzle: 3000, spring: 800, ad: 12, coin: 80, magnet: 400, style: 900, combo: 2500 };
  // price of level l = the price of the zone that level is scheduled for (zs .. zs+span), so early levels stay cheap and late ones follow the late game
  for (const u of UPS) if (u.zs != null) { u.tab = []; const base = u.max, k0 = EARLY[u.id] ? EARLY[u.id] / (PRICE.first * pr(u.zs) * gref(u.zs)) : 1;
    for (let l = 0; l < base; l++) { const t = base > 1 ? l / (base - 1) : 0, z = u.zs + u.span * t; u.tab.push(PRICE.first * Math.pow(PRICE.last / PRICE.first, t) * pr(z) * gref(z) * Math.pow(k0, 1 - t)); }
    if (EXT[u.id]) { u.base = base; u.max = EXT[u.id]; for (let l = base; l < u.max; l++) u.tab.push(u.tab[l - 1] * 1.7); } }
  const UP = Object.fromEntries(UPS.map(u => [u.id, u]));
  const BRANCH = [['launch', '발사'], ['body', '차체'], ['gear', '장치'], ['money', '수익']];

  // ---- rebirth tree (bought with stars) ----------------------------------------------------------------
  const K = (id, br, name, max, desc, req, cap) => ({ id, br, name, max, desc, req: req || [], cap: cap || 0 });
  const PERKS = [
    K('p_power', 'might', '전설의 팔뚝', 20, '발사 속도 +5%'),
    K('p_meter', 'might', '느긋한 호흡', 5, '차지 게이지 15% 느려짐', [['p_power', 1]]),
    K('r_focus', 'might', '무아지경', 5, '퍼펙트 보너스 +3%', [['p_meter', 2]]),
    K('r_mem', 'might', '전생의 기억', 5, '환생 때 레벨 8% 유지', [['p_power', 2]]),
    K('r_skip', 'might', '지름길 지도', 4, '환생 때 구역 기록 2개 유지', [['p_power', 3]]),
    K('r_double', 'might', '2단 발사', 1, '첫 정점에서 한 번 더 가속', [['p_power', 5], ['r_focus', 2]], 12),
    K('r_perf', 'might', '승부사', 10, '퍼펙트·킥 보너스 +50%', [['p_power', 2]]),
    K('p_fuel', 'flight', '예비 연료', 8, '부스트 +0.5초'),
    K('r_trick', 'flight', '타고난 곡예사', 20, '공중제비 보너스 +50%', [['p_fuel', 1]]),
    K('r_spring', 'flight', '여분 스프링', 3, '도약 +1회', [['r_trick', 2]]),
    K('r_dash', 'flight', '여분 추진기', 3, '대시 +1회', [['r_spring', 1]]),
    K('r_feather', 'flight', '깃털 몸', 5, '공기 저항 -6%', [['p_fuel', 3]]),
    K('r_phoenix', 'flight', '불사조', 1, '멈추면 한 번 다시 날아오름', [['r_trick', 5], ['r_feather', 2]], 12),
    K('r_land', 'flight', '고양이 착지', 10, '착지·슬램 보너스 +50%', [['r_trick', 2]]),
    K('r_time', 'flight', '끈기', 5, '한 판 제한 시간 +10초', [['p_fuel', 2]]),
    K('p_gold', 'wealth', '프랜차이즈 본사', 20, '모든 골드 +25%'),
    K('p_seed', 'wealth', '창업 자금', 5, '환생 직후 시작 골드', [['p_gold', 1]]),
    K('r_coin', 'wealth', '황금 손', 10, '코인·상자 가치 +40%', [['p_gold', 2]]),
    K('r_disc', 'wealth', '단골 할인', 5, '업그레이드 가격 -5%', [['p_seed', 2]]),
    K('r_bless', 'wealth', '별의 축복', 1, '별 보너스 1.5배', [['p_gold', 5], ['r_disc', 2]], 15),
  ];
  const PK = Object.fromEntries(PERKS.map(p => [p.id, p]));
  const PBRANCH = [['might', '힘의 길'], ['flight', '비행의 길'], ['wealth', '부의 길']];
  const perkCost = (p, lvl) => p.cap || lvl + 1;
  const perkLock = (s, id) => { for (const [r, n] of PK[id].req) if ((s.perks[r] || 0) < n) return `${PK[r].name} Lv${n} 필요`; return ''; };
  const STAR_GOLD = 0.04;
  const SEA = ZI('sea');
  // stars for a rebirth: 2 on reaching the sea, then more for every zone (and part of a zone) beyond it
  const starsFor = best => best < ZONES[SEA].at ? 0 : Math.floor(2 * Math.pow(zoneProg(best) - (SEA - 1), 1.4));
  function nextStarAt(best) { const n = starsFor(best) + 1; let lo = Math.max(best, ZONES[SEA].at * 0.999), hi = lo * 2; while (starsFor(hi) < n) hi *= 2; for (let i = 0; i < 40; i++) { const m = Math.sqrt(lo * hi); if (starsFor(m) >= n) hi = m; else lo = m; } return hi; }

  const newSave = () => ({ gold: 0, lv: {}, best: 0, bestLife: 0, zone: 0, runs: 0, stars: 0, starsTotal: 0, perks: {}, rebirths: 0, ach: {}, perfects: 0, slams: 0, v: 3 });
  // saves from before the rebalance: upgrade levels and gold no longer mean the same thing, so they are turned into stars (like a free rebirth)
  function migrate(s) { if (s.v === 3) return s; const gain = starsFor(s.bestLife || 0); s.stars = (s.stars || 0) + gain; s.starsTotal = (s.starsTotal || 0) + gain; s.lv = {}; s.gold = 0; s.bestLife = 0; s.zone = 0;
    for (const k in s.perks) if (!PK[k]) delete s.perks[k]; else s.perks[k] = Math.min(s.perks[k], PK[k].max); s.ach = s.ach || {}; s.migrated = gain; s.v = 3; return s; }
  const lvl = (s, id) => s.lv[id] || 0;
  const total = s => { let n = 0; for (const k in s.lv) n += s.lv[k]; return n; };
  const cost = (s, id) => { const u = UP[id], l = lvl(s, id), base = u.tab ? u.tab[Math.min(l, u.max - 1)] : u.c0 * Math.pow(u.cm, l) * Math.pow(u.q, l * l) * Math.pow(u.q2, Math.pow(Math.max(0, l - u.l2), 2)); return Math.ceil(base * (1 - 0.05 * (s.perks.r_disc || 0))); };
  function lockReason(s, id) { const u = UP[id]; if (u.re && (s.rebirths || 0) < u.re) return `환생 ${u.re}회 필요`; if (s.zone < u.zone) return `${ZONES[u.zone].name} 도달 필요`; for (const [r, n] of u.req) if (lvl(s, r) < n) return `${UP[r].name} Lv${n} 필요`; return ''; }
  const canBuy = (s, id) => lvl(s, id) < UP[id].max && !lockReason(s, id) && s.gold >= cost(s, id);
  function buy(s, id) { if (!canBuy(s, id)) return false; s.gold -= cost(s, id); s.lv[id] = lvl(s, id) + 1; return true; }

  // achievements: each is worth +3% gold forever
  const A = (id, name, desc, test) => ({ id, name, desc, test });
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
    A('a_star', '은하 여행자', '은하 고속도로 도달', (s, r) => s.zone >= ZI('star')), A('a_hole', '사건의 지평선', '블랙홀 가장자리 도달', (s, r) => s.zone >= ZI('hole')), A('a_end', '끝을 본 자', '우주의 끝 도달', (s, r) => s.zone >= ZI('end')), A('a_rift', '틈새 여행자', '차원의 틈 도달', (s, r) => s.zone >= ZI('rift')), A('a_sun', '태양에 닿다', '태양 표면 도달', (s, r) => s.zone >= ZI('sun')), A('a_omega', '시간의 끝', '시간의 끝 도달', (s, r) => s.zone >= ZI('omega')),
    A('a_lv100', '단골 손님', '업그레이드 100레벨', (s, r) => total(s) >= 100), A('a_lv300', 'VIP 고객', '업그레이드 300레벨', (s, r) => total(s) >= 300),
    A('a_re1', '새 출발', '첫 환생', (s, r) => s.rebirths >= 1), A('a_re5', '윤회', '환생 5회', (s, r) => s.rebirths >= 5),
  ];
  function checkAch(s, r) { const got = []; for (const a of ACH) if (!s.ach[a.id] && a.test(s, r)) { s.ach[a.id] = 1; got.push(a); } return got; }
  const achCount = s => { let n = 0; for (const a of ACH) if (s.ach && s.ach[a.id]) n++; return n; };

  function stats(s) {
    const L = id => lvl(s, id), P = id => s.perks[id] || 0, bless = P('r_bless') ? 1.5 : 1;
    const power = 7 * Math.pow(1.05, L('push')) * (1 + 0.02 * L('runup')) * (1 + 0.03 * L('sling')) * (1 + 0.03 * L('cannon')) * (1 + 0.03 * L('rail')) * (1 + 0.04 * L('warp')) * (1 + 0.05 * P('p_power'));
    const eCap = 0.80 + 0.008 * L('hover'), thrust = L('rocket') ? (3 + 0.4 * L('rocket') + power * (0.05 + 0.004 * L('rocket'))) * (1 + 0.03 * L('jet')) : 0;
    return {
      power, angle: (14 + 2.8 * L('ramp')) * Math.PI / 180,
      perfect: 1.10 + 0.02 * L('timing') + 0.03 * P('r_focus'), window: 0.06 + 0.012 * L('timing'), meter: 1.6 / (1 + 0.15 * P('p_meter')), kickB: 0.01 * L('rail2'),
      mu: Math.max(0.06, 0.35 * Math.pow(0.9, L('wheel'))), e: Math.min(eCap, 0.28 + 0.026 * L('tire') + 0.004 * L('float') + 0.008 * L('hover')), eCap, loss: 0.30 * Math.pow(0.86, L('frame')) * (1 - 0.02 * L('wide')),
      wear: (1 - 0.02 * L('wheel')) * (1 - 0.03 * L('tail')), drag: 0.012 * Math.pow(0.92, L('aero')) * (1 - 0.03 * L('heat')) * (1 - 0.06 * P('r_feather')), bumper: L('bumper'), wide: L('wide'), float: L('float'), heat: L('heat'), gyro: L('gyro'), rubber: 1 + 0.05 * L('rubber'),
      thrust, fuel: L('rocket') ? 1.5 + 0.15 * L('fuel') + 0.5 * P('p_fuel') : 0, nozzle: 0.05 * L('nozzle'),
      spring: L('spring'), springN: L('spring') ? 1 + Math.floor(L('spring') / 4) + P('r_spring') + Math.floor(L('over') / 5) : 0, airjump: L('airjump') ? Math.min(1, 0.4 + 0.06 * L('airjump')) : 0,
      dash: L('dash'), dashN: L('dash') ? 1 + Math.floor(L('dash') / 5) + P('r_dash') + Math.floor(L('over') / 5) : 0, dashpow: 1 + 0.12 * L('dashpow'),
      dive: L('dive'), diveN: L('dive') ? 1 + Math.floor(L('dive') / 3) + Math.floor(L('over') / 5) : 0, glide: Math.min(0.35, 0.035 * L('wing')), convert: 0.08 * L('convert'), grav: Math.max(0.6, 1 - 0.02 * L('grav')),
      double: P('r_double'), phoenix: P('r_phoenix'), encore: 1 + 0.05 * L('encore'), refuel: 0.1 + 0.02 * L('refuel'), time: 10 * P('r_time'),
      perfB: 0.3 * (1 + 0.5 * P('r_perf')), landG: 0.03 * (1 + 0.5 * P('r_land')), landP: 0.08 * (1 + 0.5 * P('r_land')), slamB: 0.08 * (1 + 0.5 * P('r_land')),
      rate: (1 + 0.06 * L('ad')) * (1 + 0.25 * P('p_gold')) * (1 + STAR_GOLD * bless * s.starsTotal) * (1 + 0.01 * L('sponsor') * s.zone) * (1 + 0.03 * achCount(s)),
      coin: (1 + 0.08 * L('coin')) * (1 + 0.4 * P('r_coin')), magnet: L('magnet'), magR: L('magnet') ? 0.9 + 0.3 * L('magnet') : 0, style: 0.0025 * L('style'), alt: 0.005 * L('alt'), crate: L('crate'), combo: 0.002 * L('combo'),
      trick: 0.03 * (1 + 0.5 * P('r_trick')) * (1 + 0.2 * L('trickpay')), lucky: 0.02 * L('lucky'),
    };
  }

  // ---- one run ------------------------------------------------------------------------------------
  const hash = n => { let t = (n + 0x6D2B79F5) | 0; t = Math.imul(t ^ (t >>> 15), 1 | t); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const RAMP = 4, WEAR = 0.12;
  // scale of a launch at speed v: U (length unit), c (height of the coin stream), S (object size), cw (cell width), tw (time warp)
  function scaleOf(st, v) { const U = Math.max(1, v * v / 588), apex = Math.pow(v * Math.sin(st.angle), 2) / 19.6, c = Math.min(4.5 * U, Math.max(0.6, 0.5 * apex)); return { U, c, S: Math.max(1, 0.7 * U), cw: 5 * U, tw: Math.max(1, 0.03 * v) }; }
  function newRun(st, meter, kick, seed) {   // meter 0..1 from the charge gauge (>= 1-window is perfect); kick = multiplier from the ramp-edge tap
    const perfect = meter >= 1 - st.window, m = perfect ? st.perfect : 0.55 + 0.45 * meter / (1 - st.window), dbl = perfect && (kick || 1) > 1.05, v = st.power * m * (kick || 1) * (dbl ? 1.03 : 1), sc = scaleOf(st, v), sd = seed == null ? Math.floor(Math.random() * 1e6) : seed;
    return Object.assign({ st, kick: kick || 1, seed: sd, x: 0, y: RAMP * Math.tan(st.angle) + 0.3, vx: v * Math.cos(st.angle), vy: v * Math.sin(st.angle), v0: v, perfect, dbl, airT: 0, fuel: st.fuel, spring: st.springN, dash: st.dashN, dive: st.diveN,
      t: 0, tr: 0, air: true, rest: 0, back: 0, maxX: 0, maxAlt: 0, maxV: v, bounces: 0, coins: 0, crates: 0, coinGold: 0, broke: 0, used: new Set(), over: false, why: '', ev: [], boosting: false,
      tops: 0, mag: [], zc: 0, slam: false, slams: 0, combo: 0, comboT: -9, maxCombo: 0, golden: hash(sd * 13 + 5) < st.lucky, ph: hash(sd) * 6.283, ph2: hash(sd + 1) * 6.283,
      ang: st.angle, spin: 0, rotAcc: 0, tricks: 0, crashes: 0, cleans: 0, perfLands: 0, landStreak: 0, maxStreak: 0, spinT: -9, usedBoost: false, doubled: false, risen: false, lastBounce: -9 }, sc);
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
    const ha = h(4), lo = 1.8 * S, hi = Math.max(3.5 * S, 2 * r.c), at = (k, x) => ground(x, r.U) + lo + (hi - lo) * Math.pow(h(k), 1.6);
    if (ha < 0.30) { const n = h(8) < 0.5 ? 2 : 3, x0 = xa + cw * (0.25 + 0.3 * h(9)), y0 = at(10, x0) - ground(x0, r.U), tilt = (h(11) - 0.5) * 0.8; for (let k = 0; k < n; k++) { const x = x0 + k * 1.5 * S; out.push({ id: i * 8 + 1 + k, type: 'coin', x, y: ground(x, r.U) + Math.max(lo, y0 + k * tilt * S), rad: 0.6 * S, z }); } }
    else if (ha < 0.37) { const x = xm; out.push({ id: i * 8 + 4, type: 'ring', x, y: at(12, x), rad: 1.0 * S, z }); }
    if (h(5) < 0.03 * (1 + 0.3 * r.st.crate)) { const x = xa + cw * 0.8; out.push({ id: i * 8 + 5, type: 'crate', x, y: ground(x, r.U) + lo + (hi - lo) * (0.55 + 0.45 * h(6)), rad: 0.8 * S, z }); }
    return out;
  }
  function hit(r, o) {
    const st = r.st, sp = Math.hypot(r.vx, r.vy), cv = 0.03 * gd(Math.max(30, r.v0 * r.v0 / 9.8), o.z) * st.coin;
    const vr = Math.min(sp, 1.2 * r.v0); r.used.add(o.id);
    if (o.type !== 'haz' && o.type !== 'pool') { r.combo = r.tr - r.comboT < 3 ? r.combo + 1 : 1; r.comboT = r.tr; if (r.combo > r.maxCombo) r.maxCombo = r.combo; }
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
    const i0 = Math.max(0, Math.floor(x0 / r.cw - 1.2)), i1 = Math.floor(x1 / r.cw - 1.2);
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
    r.boosting = !!(inp.boost && r.fuel > 0);
    const gk = Math.sqrt(gZ * (1 - st.glide) / 9.8), alt0 = r.y - ground(r.x, U), grounded0 = alt0 < Math.max(1.2, 0.5 * r.S), vRef = Math.max(sp0, 0.5 * r.v0);
    const doSpring = k => { const pf = k === 1 && r.tr - r.lastBounce < 0.22 ? 1.35 : 1; r.spring--; let up = (5 + 0.5 * st.spring + Math.min(1.2 * r.v0, Math.max(sp0, 0.8 * r.v0)) * (0.26 + 0.012 * st.spring)) * pf * k; if (k === 1) up = Math.max(up, Math.sqrt(2.3 * gZ * river(r, r.x + 0.5 * r.cw)) * pf); r.vy = Math.min(0.85 * r.v0 * gk + 8, Math.max(r.vy, 0) + up); r.vx *= 1.03; if (k < 1) r.vx += 0.02 * r.v0; r.air = true; if (k === 1) r.rotAcc = 0; r.ev.push({ k: k < 1 ? 'airspring' : pf > 1 ? 'pspring' : 'spring', x: r.x, y: r.y }); };
    const doDash = () => { r.dash--; const add = (6 + st.dash + Math.max(sp0, 0.8 * r.v0) * (0.08 + 0.006 * st.dash)) * st.dashpow; r.vx += add; r.vy = grounded0 ? Math.max(r.vy, 0.18 * r.v0 + 3) : Math.max(r.vy, -0.12 * sp0); if (grounded0) r.air = true; r.ev.push({ k: 'dash', x: r.x, y: r.y }); };
    if (inp.skill) { if (grounded0 && r.spring > 0) doSpring(1); else if (r.dash > 0 && !grounded0) doDash(); else if (!grounded0 && st.airjump && r.spring > 0) doSpring(st.airjump); }
    if (inp.spring && r.spring > 0) { if (grounded0) doSpring(1); else if (st.airjump) doSpring(st.airjump); }
    if (inp.dash && r.dash > 0) doDash();
    // dive: a hard push straight down (always enough to reach the ground quickly, whatever the altitude) plus some forward speed
    if (inp.dive && r.dive > 0 && !grounded0) { r.dive--; r.slam = true; r.vy = -Math.max(Math.abs(r.vy), 0.9 * r.v0); r.vx += vRef * (0.05 + 0.02 * st.dive) + 4; r.spin = 0; r.ev.push({ k: 'dive', x: r.x, y: r.y }); }
    if (r.air) r.airT += dtReal; else r.airT = 0;
    if (r.air) { const sd = inp.spin || 0;
      if (sd) { r.spin += sd * 16 * (1 + 0.08 * st.gyro) * dtReal; r.spin = Math.max(-9, Math.min(9, r.spin)); r.spinT = r.tr; }
      else { r.spin *= Math.pow(0.02, dtReal); if (Math.abs(r.rotAcc) < 0.6 && r.tr - r.spinT > 1) { const want = Math.max(-0.9, Math.min(0.9, Math.atan2(r.vy, Math.max(1, r.vx)))); let d = want - r.ang; d = Math.atan2(Math.sin(d), Math.cos(d)); r.ang += d * Math.min(1, dtReal * 4); } }
      r.ang += r.spin * dtReal; r.rotAcc += r.spin * dtReal;
      if (st.double && !r.doubled && r.vy < 0 && r.tr > 0.3) { r.doubled = true; const add = 0.25 * r.v0; r.vx += add * 0.92; r.vy += add * 0.4 + Math.max(0, -r.vy) * 0.5; r.ev.push({ k: 'double', x: r.x, y: r.y }); } }
    if (r.boosting) { r.usedBoost = true; r.fuel -= dtReal; const dv = st.thrust * dtReal; r.vx += dv * (1 + st.nozzle); r.vy += dv * (grounded0 ? 0.45 : 0.16) + (r.vy < 0 ? Math.min(-r.vy, dv * 0.5) : 0); if (grounded0 && r.vy > 0) r.air = true; }
    const xPrev = r.x, dg = 0.1 * U;
    for (let i = 0; i < n; i++) {
      const g = gZ * (r.air ? 1 - st.glide * Math.min(1, Math.abs(r.vx) / (0.05 * r.v0 + 1)) : 1), dk = st.drag * lerpZ(r.x, 'drag') + WEAR * st.wear * (1 + r.tr * r.tr / 1600) * 9.8 / (r.v0 + 20);
      r.vy -= g * h; const d = Math.exp(-dk * h); r.vx *= d; r.vy *= d;
      if (st.convert && r.air && r.vy < 0) { const f = 1 - Math.exp(-st.convert * h * gZ / (r.v0 + 1)), vy0 = r.vy; r.vy *= 1 - f; r.vx = Math.sqrt(Math.max(0, r.vx) * Math.max(0, r.vx) + (vy0 * vy0 - r.vy * r.vy) * 0.8); }
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
            const trick = flips >= 1 && Math.abs(dd) < 0.7 + 0.04 * st.gyro, crash = !trick && Math.abs(r.rotAcc) > 1.2 && Math.abs(dd) > 1.4, long = r.airT > 0.35;
            if (trick) { r.tricks += flips; vt *= 1 + Math.min(0.25, 0.05 * flips); r.ev.push({ k: 'trick', x: r.x, y: r.y, n: flips, clean: Math.abs(dd) < 0.2 }); }
            if (crash) { vt *= 0.75; r.crashes++; r.ev.push({ k: 'crash', x: r.x, y: r.y }); }
            if (long && Math.abs(dd) < 0.26 + 0.01 * st.gyro) { const pf = Math.abs(dd) < 0.11 + 0.004 * st.gyro; al = pf ? 2 : 1; r.cleans++; if (pf) r.perfLands++; r.landStreak++; if (r.landStreak > r.maxStreak) r.maxStreak = r.landStreak;
              if (st.fuel) r.fuel = Math.min(st.fuel, r.fuel + (pf ? st.refuel : st.refuel / 2)); r.ev.push({ k: 'clean', x: r.x, y: r.y, pf, n: r.landStreak }); }
            else if (long && !crash && Math.abs(dd) > 1.1) { al = -1; r.landStreak = 0; r.ev.push({ k: 'badland', x: r.x, y: r.y }); }
            else if (long && !trick) r.landStreak = 0;
            r.airT = 0; r.rotAcc = 0; r.spin = 0; r.ang = sa; r.lastBounce = r.tr; }
          if (water && !st.float) { if (Math.abs(vt) > 0.25 * r.v0 && imp < Math.abs(vt) * 0.55) { vn = imp * 0.45; vt *= 0.86; r.bounces++; r.air = true; r.ev.push({ k: 'skip', x: r.x, y: r.y }); } else { r.over = true; r.why = '물에 빠졌어요'; r.ev.push({ k: 'sink', x: r.x, y: r.y }); break; } }
          else {
            const rough = Z.loss > 1 ? 1 + (Z.loss - 1) * soft : Z.loss, eZ = Z.e < 1 ? 1 - (1 - Z.e) * soft : Z.e, e = water ? 0.4 + 0.035 * st.float : Math.min(st.eCap + 0.02, st.e * eZ);
            if (r.slam && !water) { r.slam = false; r.slams++; r.combo = r.tr - r.comboT < 3 ? r.combo + 1 : 1; r.comboT = r.tr; if (r.combo > r.maxCombo) r.maxCombo = r.combo; vn = Math.min(0.85 * r.v0 * gk, imp * Math.min(0.97, e + 0.08 + 0.02 * st.dive)); vt = vt * 1.02 + 0.02 * r.v0; r.bounces++; r.air = true; r.ev.push({ k: 'slam', x: r.x, y: r.y, imp, combo: r.combo }); }
            else if (imp > 0.05 * r.v0 + 0.8 + Math.abs(vt) * 0.02) { vn = Math.min(0.72 * r.v0 * gk + 2, imp * e); vt *= (1 - Math.min(0.9, (water ? 0.16 - 0.01 * st.float : st.loss * rough) * (al > 0 ? 0.35 : 1) * Math.min(1, imp / (Math.abs(vt) + 1) * 3 + 0.25))) ; r.bounces++; r.air = true; r.ev.push({ k: 'bounce', x: r.x, y: r.y, imp }); }
            else { vn = 0; r.air = false; r.slam = false; r.ang = Math.atan(sl); const muZ = Z.mu > 1 ? 1 + (Z.mu - 1) * soft : Z.mu, mu = water ? 0.5 / (1 + 0.6 * st.float) : st.mu * muZ, dec = mu * g * h; vt = Math.abs(vt) <= dec ? 0 : vt - Math.sign(vt) * dec; }
          }
          if (al) vt *= al > 1 ? 1.03 : al > 0 ? 1.01 : 0.88;
          r.vx = vn * nx + vt * tx; r.vy = vn * ny + vt * ty;
        }
      } else if (r.y - gy > 0.3 * r.S) r.air = true;
      if (r.y - gy > r.maxAlt) r.maxAlt = r.y - gy;
    }
    if (!r.over && r.x > xPrev) objects(r, xPrev, r.x);
    if (st.magR && !r.over) { const R = st.magR * r.S, cy = r.y + 0.5 * r.S, i0 = Math.max(0, Math.floor((xPrev - R) / r.cw - 1.2)), i1 = Math.floor((r.x + R) / r.cw - 1.2);
      for (let i = i0; i <= i1; i++) for (const o of cellObjs(r, i)) { if ((o.type !== 'coin' && o.type !== 'crate') || r.used.has(o.id)) continue; const dx = o.x < xPrev ? xPrev - o.x : o.x > r.x ? o.x - r.x : 0;
        if (Math.hypot(dx, o.y - cy) < R) { r.used.add(o.id); r.mag.push({ o, t0: r.tr }); r.ev.push({ k: 'pull', x: o.x, y: o.y }); } } }
    for (let k = r.mag.length - 1; k >= 0; k--) if (r.over || r.tr - r.mag[k].t0 >= 0.3) { hit(r, Object.assign({}, r.mag[k].o, { x: r.x, y: r.y + 0.5 * r.S })); r.mag.splice(k, 1); }
    for (let z = zoneAt(r.x); r.zc < z;) { const Z = ZONES[++r.zc], lv = Math.max(Z.water ? st.float : 0, Z.spec && Z.spec.includes('pool') ? st.heat : 0, Z.rough ? st.wide : 0); if (lv) { const add = 0.012 * lv * r.v0 * Math.pow(0.94, r.tops++); r.vx += add; r.ev.push({ k: 'zboost', x: r.x, y: r.y, z: r.zc, pct: Math.round(1.2 * lv) }); } }
    r.t += dt; r.tr += dtReal; if (r.x > r.maxX) r.maxX = r.x;
    const sp = Math.hypot(r.vx, r.vy); if (sp > r.maxV) r.maxV = sp;
    if (!r.over) {
      // the run ends when the cart has lost nearly all of its launch speed on the ground, or starts rolling back down a slope
      if (!r.air && sp < Math.max(0.35, 0.04 * r.v0)) r.rest += dtReal; else r.rest = 0;
      if (!r.air && r.vx < 0) r.back += dtReal; else r.back = 0;
      if (r.rest > 0.5 || r.back > 0.7) { if (st.phoenix && !r.risen) { r.risen = true; r.rest = r.back = 0; const v = 0.4 * r.v0; r.vx = v * Math.cos(st.angle); r.vy = v * Math.sin(st.angle); r.y += 0.5; r.air = true; r.ev.push({ k: 'phoenix', x: r.x, y: r.y }); } else { r.over = true; r.why = r.back > 0.7 ? '언덕을 넘지 못했어요' : '멈췄어요'; } }
      if (r.tr > 100 + st.time + 10 * Math.max(0, zoneAt(r.maxX) - 8)) { r.over = true; r.why = '시간 초과'; } }
  }
  function payout(r, s) {
    const st = r.st, D = r.maxX, z = zoneAt(D), dist = gd(D, z) * st.rate, coins = r.coinGold * st.rate;
    const style = st.style * r.bounces, alt = st.alt * Math.log2(1 + r.maxAlt / (2 * r.U)), perfect = r.perfect ? st.perfB : 0, kickB = r.kick > 1.05 ? st.perfB : r.kick > 1 ? st.perfB / 3 : 0, dbl = r.dbl ? 2 * st.perfB : 0, land = st.landG * (r.cleans - r.perfLands) + st.landP * r.perfLands, slam = st.slamB * r.slams, trick = st.trick * r.tricks, combo = st.combo * r.maxCombo, gold = r.golden ? 3 : 1;
    let first = 0; for (let i = s.zone + 1; i <= z; i++) first += 3 * gd(ZONES[i].at, i) * st.rate;
    const mult = 1 + (style + alt + perfect + kickB + dbl + land + slam + trick + combo) * st.encore;
    return { dist, coins, style, alt, perfect, kickB, dbl, land, slam, trick, combo, gold, first, mult, total: Math.floor(((dist + coins) * mult + first) * gold), zone: z };
  }
  function finish(r, s) { const p = payout(r, s); s.gold += p.total; s.runs++; if (r.perfect) s.perfects = (s.perfects || 0) + 1; if (r.slams) s.slams = (s.slams || 0) + r.slams;
    p.record = r.maxX > s.best; if (r.maxX > s.best) s.best = r.maxX; if (r.maxX > s.bestLife) s.bestLife = r.maxX; p.newZone = p.zone > s.zone; if (p.zone > s.zone) s.zone = p.zone; p.ach = checkAch(s, r); return p; }
  function rebirth(s) { const gain = starsFor(s.bestLife); if (gain <= 0) return 0; const seed = (s.perks.p_seed || 0) ? 100 * Math.pow(10, s.perks.p_seed) : 0, keep = 0.08 * (s.perks.r_mem || 0);
    s.stars += gain; s.starsTotal += gain; s.rebirths++; s.gold = seed; const lv = {}; if (keep) for (const k in s.lv) { const n = Math.floor(s.lv[k] * keep); if (n) lv[k] = n; } s.lv = lv; s.bestLife = 0; s.zone = Math.min(s.zone, 2 * (s.perks.r_skip || 0)); checkAch(s, null); return gain; }
  function buyPerk(s, id) { const p = PK[id], l = s.perks[id] || 0; if (!p || l >= p.max || perkLock(s, id) || s.stars < perkCost(p, l)) return false; s.stars -= perkCost(p, l); s.perks[id] = l + 1; return true; }
  return { ZONES, ZI, zoneAt, zoneProg, lerpZ, ground, isWater, UPS, UP, BRANCH, PERKS, PK, PBRANCH, perkCost, perkLock, STAR_GOLD, starsFor, nextStarAt, ACH, checkAch, achCount,
    newSave, migrate, lvl, total, cost, lockReason, canBuy, buy, stats, RAMP, scaleOf, newRun, river, cellObjs, step, payout, finish, rebirth, buyPerk, gd, gref };
})();
if (typeof module !== 'undefined') module.exports = CORE;
