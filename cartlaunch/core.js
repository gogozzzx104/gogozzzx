/* =====================================================================
   CORE — zones, tech tree, stats and flight physics.  No DOM in here, so the same code runs in the
   balance simulator (tools/sim.js) and in the game.
   ===================================================================== */
const CORE = (() => {
  // ---- zones: terrain, surface and gravity change with distance -------------------------------------
  // sc = world scale (object size / spacing), amp+wl = hills, mu/e/loss = surface multipliers, g = gravity
  const ZONES = [
    { id: 'lot', name: '마트 주차장', at: 0, sc: 1, amp: 0, wl: 100, mu: 1, e: 1, loss: 1, g: 9.8, drag: 1, sky: ['#8fc4ff', '#dff1ff'], ground: '#55585f', deco: 'lot' },
    { id: 'city', name: '도심 도로', at: 200, sc: 1.5, amp: 2.6, wl: 170, sk: 0.3, mu: 0.9, e: 1.05, loss: 1, g: 9.8, drag: 1, sky: ['#7db2f0', '#f6e3c8'], ground: '#3d4048', deco: 'city' },
    { id: 'hill', name: '교외 언덕', at: 1000, sc: 3, amp: 14, wl: 320, sk: 0.35, la: 10, mu: 1.35, e: 0.95, loss: 1.1, g: 9.8, drag: 1, sky: ['#6fb7e8', '#eaf7d0'], ground: '#4f9a4a', deco: 'hill' },
    { id: 'forest', name: '깊은 숲', at: 2500, sc: 5, amp: 18, wl: 420, sk: 0.4, la: 16, mu: 1.9, e: 0.85, loss: 1.3, g: 9.8, drag: 1, sky: ['#4f9c78', '#dcf2c4'], ground: '#2f6b3a', deco: 'forest' },
    { id: 'sand', name: '모래 사막', at: 6000, sc: 12, amp: 28, wl: 900, sk: 0.55, la: 30, mu: 3.2, e: 0.5, loss: 1.8, g: 9.8, drag: 1, sky: ['#f2b25c', '#ffe9b8'], ground: '#d9a653', deco: 'sand' },
    { id: 'canyon', name: '붉은 대협곡', at: 14000, sc: 22, amp: 70, wl: 1700, sk: 0.85, la: 110, mu: 1.1, e: 1, loss: 1, g: 9.8, drag: 1, sky: ['#e0843f', '#ffdcae'], ground: '#b5562f', deco: 'canyon' },
    { id: 'sea', name: '망망대해', at: 25000, sc: 40, amp: 80, wl: 3200, mu: 1, e: 1, loss: 1, g: 9.8, drag: 1, sky: ['#3d8fd6', '#bfe9ff'], ground: '#1f6fb5', deco: 'sea', water: true },
    { id: 'ice', name: '만년 설산', at: 60000, sc: 100, amp: 170, wl: 3600, sk: 0.6, la: 260, mu: 0.12, e: 0.9, loss: 0.5, g: 9.8, drag: 1, sky: ['#9fc3e8', '#ffffff'], ground: '#e8f1fa', deco: 'ice' },
    { id: 'lava', name: '용암 지대', at: 150000, sc: 250, amp: 250, wl: 6000, sk: 0.75, la: 420, mu: 1.2, e: 0.9, loss: 1, g: 9.8, drag: 1.2, sky: ['#3a1410', '#c2451e'], ground: '#33211f', deco: 'lava' },
    { id: 'cloud', name: '구름 왕국', at: 400000, sc: 400, amp: 300, wl: 8000, sk: 0.2, la: 520, mu: 0.5, e: 1.15, loss: 0.5, g: 7.4, drag: 0.8, sky: ['#ff9ec7', '#fff0c9'], ground: '#fff3fa', deco: 'cloud' },
    { id: 'moon', name: '달 기지', at: 1200000, sc: 700, amp: 330, wl: 9000, sk: -0.5, la: 520, mu: 0.8, e: 1.05, loss: 0.8, g: 1.62, drag: 0.25, sky: ['#05060d', '#141a33'], ground: '#9a9aa6', deco: 'moon' },
    { id: 'rock', name: '소행성대', at: 8000000, sc: 1600, amp: 700, wl: 12000, sk: -0.7, la: 650, mu: 1, e: 1, loss: 1, g: 0.9, drag: 0.15, sky: ['#070812', '#221a38'], ground: '#6b6258', deco: 'rock' },
    { id: 'star', name: '은하 고속도로', at: 30000000, sc: 3000, amp: 650, wl: 18000, sk: 0.35, la: 950, mu: 0.7, e: 1.05, loss: 0.7, g: 3.2, drag: 0.3, sky: ['#0a0220', '#3a0f66'], ground: '#5b2bd6', deco: 'star' },
    { id: 'hole', name: '블랙홀 가장자리', at: 80000000, sc: 5000, amp: 1500, wl: 42000, sk: 0.5, la: 2600, mu: 0.6, e: 0.95, loss: 0.9, g: 16, drag: 0.5, sky: ['#000000', '#3a0a16'], ground: '#1a1020', deco: 'hole' },
    { id: 'end', name: '우주의 끝', at: 250000000, sc: 9000, amp: 2600, wl: 75000, sk: 0.3, la: 4200, mu: 0.5, e: 1.1, loss: 0.5, g: 2.2, drag: 0.2, sky: ['#b8e8ff', '#f6f0ff'], ground: '#2b2233', deco: 'end' },
  ];
  const ZI = id => ZONES.findIndex(z => z.id === id);

  const zoneAt = x => { let z = 0; for (let i = 1; i < ZONES.length; i++) if (x >= ZONES[i].at) z = i; return z; };
  // smooth blend between neighbouring zones over the first 6% of the new zone (min 40 m)
  function blend(x) { const z = zoneAt(x); if (z === 0) return [0, 0, 0]; const w = Math.max(40, ZONES[z].at * 0.06), f = (x - ZONES[z].at) / w; return f >= 1 ? [z, z, 0] : [z - 1, z, f * f * (3 - 2 * f)]; }
  const lerpZ = (x, k) => { const [a, b, f] = blend(x); return ZONES[a][k] + (ZONES[b][k] - ZONES[a][k]) * f; };
  // one zone's height profile: a skewed ridge (steep on one side) + a faster ripple + a long swell; in water zones only island tops stay above sea level
  function hz(z, x) { const Z = ZONES[z]; if (!Z.amp) return 0; const p = 6.2832 * x / Z.wl;
    const h = Z.amp * (0.6 * Math.sin(p + (Z.sk || 0) * Math.sin(p)) + 0.4 * Math.sin(p / 0.37 + 1.3)) + (Z.la || 0) * Math.sin(6.2832 * x / (Z.wl * 4.3) + 0.7);
    return Z.water ? Math.max(0, h - Z.amp * 0.5) : h; }
  function ground(x) { if (x < 30) return 0; const [a, b, f] = blend(x), ha = hz(a, x), hb = a === b ? ha : hz(b, x), s = Math.min(1, (x - 30) / 60); return (ha + (hb - ha) * f) * s; }
  const isWater = x => { const [a, b, f] = blend(x); return (f > 0.5 ? !!ZONES[b].water : !!ZONES[a].water) && ground(x) < 0.05; };

  // ---- tech tree --------------------------------------------------------------------------------
  // br: branch, max, c0/cm: cost = c0 * cm^level, req: [id, level] pairs, zone: furthest zone that must have been reached
  const U = (id, br, name, max, c0, cm, desc, req, zone) => ({ id, br, name, max, c0, cm, desc, req: req || [], zone: zone ? ZI(zone) : 0 });
  const UPS = [
    U('push', 'launch', '근력 훈련', 60, 8, 1.121, '미는 힘 +5%'),
    U('ramp', 'launch', '발사 경사로', 10, 25, 1.405, '발사 각도 +2.8°', [['push', 3]]),
    U('runup', 'launch', '도움닫기', 20, 120, 1.248, '발사 속도 +2.5%', [['push', 5]]),
    U('rail2', 'launch', '가속 레일', 10, 3000, 1.4, '발사대 킥 보너스 +1%p (굿 킥은 절반)', [['push', 6]]),
    U('timing', 'launch', '타이밍 감각', 10, 400, 1.405, '퍼펙트 구간 확대, 퍼펙트 보너스 +2%', [['runup', 3]]),
    U('sling', 'launch', '대형 새총', 25, 4e4, 1.27, '발사 속도 +5%', [['ramp', 5]], 'sand'),
    U('cannon', 'launch', '화약 대포', 25, 3e6, 1.292, '발사 속도 +5%', [['sling', 10]], 'ice'),
    U('rail', 'launch', '레일건', 30, 1e9, 1.315, '발사 속도 +4.5%', [['cannon', 10]], 'moon'),

    U('wheel', 'body', '바퀴 윤활', 25, 10, 1.144, '굴러갈 때 마찰 -12%'),
    U('tire', 'body', '탄성 타이어', 20, 40, 1.202, '튕길 때 반발력 증가', [['wheel', 3]]),
    U('frame', 'body', '경량 프레임', 20, 200, 1.27, '착지 충격으로 잃는 속도 -14%', [['wheel', 5]]),
    U('aero', 'body', '공기역학 커버', 30, 500, 1.248, '공기 저항 -10%', [['frame', 3]]),
    U('bumper', 'body', '강화 범퍼', 10, 2000, 1.45, '장애물 충돌 손실 감소, Lv6부터 부수고 골드 획득', [['frame', 5]]),
    U('wide', 'body', '광폭 타이어', 10, 3e4, 1.405, '진흙·모래·험지에서 잃는 속도 감소', [['tire', 5]], 'forest'),
    U('float', 'body', '부력 튜브', 10, 2e5, 1.45, '물에 가라앉지 않고 물수제비를 뜸', [], 'sea'),
    U('gyro', 'body', '자이로 안정기', 10, 2e4, 1.36, '공중 회전이 빨라지고 착지 판정이 너그러워짐', [['frame', 3]]),
    U('rubber', 'body', '초탄성 서스펜션', 10, 5e4, 1.36, '트램펄린·자동차·버섯 등 발판 반발 +5%', [['tire', 6]]),
    U('heat', 'body', '내열 코팅', 10, 2e8, 1.45, '용암 웅덩이 피해 감소', [], 'lava'),

    U('rocket', 'gear', '로켓 부스터', 30, 800, 1.225, '부스트 추진력 증가 (BOOST 버튼)', [['push', 8]]),
    U('fuel', 'gear', '연료 탱크', 15, 3000, 1.315, '부스트 시간 +0.15초', [['rocket', 1]]),
    U('spring', 'gear', '스프링 점퍼', 20, 1500, 1.248, '땅에서 SKILL로 다시 도약 (4레벨마다 횟수 +1)', [['tire', 3]]),
    U('wing', 'gear', '글라이더 날개', 20, 8000, 1.27, '공중에서 덜 떨어짐 (중력 -3.5%)', [['aero', 3]], 'hill'),
    U('dash', 'gear', '에어 대시', 15, 6e4, 1.315, '공중에서 SKILL로 급가속 (5레벨마다 횟수 +1)', [['wing', 3]]),
    U('hover', 'gear', '호버 스커트', 15, 1e6, 1.36, '지면 마찰 추가 -20%', [['wheel', 15]], 'sea'),
    U('jet', 'gear', '제트 엔진', 20, 5e7, 1.315, '부스트 추진력 +4%', [['rocket', 15]], 'ice'),
    U('nozzle', 'gear', '벡터 노즐', 15, 5000, 1.27, '부스트가 앞으로 미는 힘 +8%', [['rocket', 3]]),
    U('dashpow', 'gear', '대시 증폭기', 15, 2e5, 1.3, '대시의 전진 가속 +12%', [['dash', 1]]),
    U('airjump', 'gear', '공중 스프링', 10, 5e5, 1.4, '공중에서도 도약 사용 (지상 위력의 40% +6%/Lv)', [['spring', 6]], 'sand'),
    U('convert', 'gear', '활공 전환 날개', 15, 1e5, 1.3, '떨어질 때 낙하 속도를 전진 속도로 바꿈 (초당 0.4%씩)', [['wing', 5]]),
    U('dive', 'gear', '급강하 장치', 12, 3e5, 1.4, '공중에서 급강하: 내리꽂으며 전진 가속, 착지 시 강하게 튐 (3Lv마다 횟수 +1)', [['tire', 8]], 'sand'),
    U('relay', 'gear', '중계 대포', 10, 2e6, 1.5, '하늘에 카트를 다시 쏴 주는 대포통이 더 자주 등장', [['rocket', 8]], 'canyon'),
    U('grav', 'gear', '반중력 코어', 15, 5e10, 1.405, '모든 구역의 중력 -3%', [['wing', 10]], 'moon'),

    U('ad', 'money', '전단지 광고', 60, 12, 1.135, '거리당 골드 +9%'),
    U('coin', 'money', '코인 감정사', 30, 100, 1.202, '코인 가치 +15%', [['ad', 3]]),
    U('magnet', 'money', '코인 자석', 10, 500, 1.45, '코인을 끌어오는 범위 증가', [['coin', 3]]),
    U('style', 'money', '묘기 보너스', 20, 2000, 1.27, '튕길 때마다 골드 +0.25% (최대 12회)', [['ad', 8]]),
    U('alt', 'money', '고도 수당', 20, 1e4, 1.27, '최고 고도에 따라 골드 보너스', [['style', 3]]),
    U('sponsor', 'money', '스폰서 계약', 20, 5e4, 1.36, '도달한 구역 하나당 골드 +5%', [['ad', 15]], 'hill'),
    U('combo', 'money', '콤보 미터', 15, 8000, 1.3, '3초 안에 연달아 먹으면 콤보, 최고 콤보당 골드 +0.2% (최대 50콤보)', [['coin', 5]]),
    U('trickpay', 'money', '묘기 전속 계약', 15, 3e4, 1.3, '공중 묘기 보너스 +20%', [['style', 2]]),
    U('lucky', 'money', '황금 카트', 10, 5e5, 1.5, '판마다 2% 확률로 황금 판 (획득 골드 3배)', [['ad', 20]], 'forest'),
    U('crate', 'money', '보물 드론', 10, 1e6, 1.54, '하늘에 큰 골드 상자가 더 자주 등장', [['coin', 10]], 'sand'),
  ];
  const UP = Object.fromEntries(UPS.map(u => [u.id, u]));
  const BRANCH = [['launch', '발사'], ['body', '차체'], ['gear', '장치'], ['money', '수익']];
  // prestige perks, bought with stars
  // rebirth tree, bought with stars.  br: branch, cost: stars for the next level, req: [id, level]
  const K = (id, br, name, max, desc, req, cap) => ({ id, br, name, max, desc, req: req || [], cap: cap || 0 });
  const PERKS = [
    K('p_power', 'might', '전설의 팔뚝', 10, '발사 속도 +4%'),
    K('p_meter', 'might', '느긋한 호흡', 5, '발사 게이지가 느려짐', [['p_power', 1]]),
    K('r_focus', 'might', '무아지경', 5, '퍼펙트 발사 보너스 +3%', [['p_meter', 2]]),
    K('r_skip', 'might', '지름길 지도', 4, '환생해도 구역 도달 기록을 2개씩 유지', [['p_power', 3]]),
    K('r_double', 'might', '2단 발사', 1, '첫 정점에서 발사 속도의 25%로 한 번 더 가속', [['p_power', 5], ['r_focus', 2]], 12),
    K('p_fuel', 'flight', '예비 연료', 5, '부스트 시간 +0.5초'),
    K('r_trick', 'flight', '타고난 곡예사', 10, '공중 묘기 보너스 +50%', [['p_fuel', 1]]),
    K('r_spring', 'flight', '여분 스프링', 3, '도약 횟수 +1 (스프링 점퍼 보유 시)', [['r_trick', 2]]),
    K('r_dash', 'flight', '여분 추진기', 3, '대시 횟수 +1 (에어 대시 보유 시)', [['r_spring', 1]]),
    K('r_feather', 'flight', '깃털 몸', 5, '모든 구역의 중력 -2%', [['p_fuel', 3]]),
    K('r_phoenix', 'flight', '불사조', 1, '멈추는 순간 발사 속도의 40%로 한 번 다시 날아오름', [['r_trick', 5], ['r_feather', 2]], 12),
    K('p_gold', 'wealth', '프랜차이즈 본사', 10, '모든 골드 +25%'),
    K('p_seed', 'wealth', '창업 자금', 5, '환생 직후 골드 지급 (×10씩 증가)', [['p_gold', 1]]),
    K('r_coin', 'wealth', '황금 손', 5, '코인·상자 가치 +50%', [['p_gold', 2]]),
    K('r_disc', 'wealth', '단골 할인', 5, '물가 상승률 -0.1%p', [['p_seed', 2]]),
    K('r_bless', 'wealth', '별의 축복', 1, '별 하나당 보너스가 2배 (수익 +20%, 발사 +2%)', [['p_gold', 5], ['r_disc', 2]], 15),
  ];
  const total = s => { let n = 0; for (const k in s.lv) n += s.lv[k]; return n; };
  const PK = Object.fromEntries(PERKS.map(p => [p.id, p]));
  const PBRANCH = [['might', '힘의 길'], ['flight', '비행의 길'], ['wealth', '부의 길']];
  const perkCost = (p, lvl) => p.cap || lvl + 1;
  const perkLock = (s, id) => { for (const [r, n] of PK[id].req) if ((s.perks[r] || 0) < n) return `${PK[r].name} Lv${n} 필요`; return ''; };
  // achievements: each one is worth +3% gold forever
  const A = (id, name, desc, test) => ({ id, name, desc, test });
  const ACH = [
    A('a_100m', '첫 걸음', '100m 돌파', (s, r) => s.best >= 100), A('a_1km', '동네 한 바퀴', '1km 돌파', (s, r) => s.best >= 1000), A('a_10km', '시 경계 돌파', '10km 돌파', (s, r) => s.best >= 1e4),
    A('a_100km', '도 경계 돌파', '100km 돌파', (s, r) => s.best >= 1e5), A('a_1000km', '대륙 횡단', '1,000km 돌파', (s, r) => s.best >= 1e6), A('a_10000km', '지구 반 바퀴', '10,000km 돌파', (s, r) => s.best >= 1e7),
    A('a_b10', '통통 튀는', '한 판에 10번 튕기기', (s, r) => r && r.bounces >= 10), A('a_b25', '고무공', '한 판에 25번 튕기기', (s, r) => r && r.bounces >= 25),
    A('a_alt100', '구름 위로', '고도 100m 도달', (s, r) => r && r.maxAlt >= 100), A('a_alt10k', '성층권', '고도 10km 도달', (s, r) => r && r.maxAlt >= 1e4),
    A('a_flip1', '첫 공중제비', '묘기 착지 1회', (s, r) => r && r.tricks >= 1), A('a_flip5', '서커스 단원', '한 판에 묘기 5바퀴', (s, r) => r && r.tricks >= 5), A('a_flip15', '인간 팽이', '한 판에 묘기 15바퀴', (s, r) => r && r.tricks >= 15),
    A('a_perf', '칼타이밍', '퍼펙트 발사 10회 누적', (s, r) => (s.perfects || 0) >= 10), A('a_nob', '맨몸 승부', '부스트 없이 1km (로켓 보유 상태)', (s, r) => r && r.st.thrust > 0 && !r.usedBoost && r.maxX >= 1000),
    A('a_coin20', '수금원', '한 판에 코인 20개', (s, r) => r && r.coins >= 20), A('a_smash', '철거반', '한 판에 장애물 10개 파괴', (s, r) => r && r.broke >= 10),
    A('a_sea', '바다를 건넌 카트', '만년 설산 도달', (s, r) => s.zone >= ZI('ice')), A('a_cloud', '구름 위 산책', '구름 왕국 도달', (s, r) => s.zone >= ZI('cloud')), A('a_moon', '달 착륙', '달 기지 도달', (s, r) => s.zone >= ZI('moon')), A('a_star', '은하 여행자', '은하 고속도로 도달', (s, r) => s.zone >= ZI('star')),
    A('a_hole', '사건의 지평선', '블랙홀 가장자리 도달', (s, r) => s.zone >= ZI('hole')), A('a_end', '끝을 본 자', '우주의 끝 도달', (s, r) => s.zone >= ZI('end')),
    A('a_lv100', '단골 손님', '업그레이드 100레벨', (s, r) => total(s) >= 100), A('a_lv300', 'VIP 고객', '업그레이드 300레벨', (s, r) => total(s) >= 300),
    A('a_combo', '줄줄이 사탕', '한 판에 20콤보', (s, r) => r && r.maxCombo >= 20), A('a_slam', '운석 낙하', '급강하 착지 5회 누적', (s, r) => (s.slams || 0) >= 5), A('a_barrel', '환승입니다', '대포통에 들어가기', (s, r) => r && r.barrels >= 1), A('a_gold', '황금빛 하루', '황금 판을 한 번 달리기', (s, r) => r && r.golden),
    A('a_re1', '새 출발', '첫 환생', (s, r) => s.rebirths >= 1), A('a_re5', '윤회', '환생 5회', (s, r) => s.rebirths >= 5),
  ];
  function checkAch(s, r) { const got = []; for (const a of ACH) if (!s.ach[a.id] && a.test(s, r)) { s.ach[a.id] = 1; got.push(a); } return got; }
  const achCount = s => Object.keys(s.ach || {}).length;
  const newSave = () => ({ gold: 0, lv: {}, best: 0, bestLife: 0, zone: 0, runs: 0, stars: 0, starsTotal: 0, perks: {}, rebirths: 0, seen: {}, ach: {}, perfects: 0, v: 2 });
  const lvl = (s, id) => s.lv[id] || 0;
  const CFG = { infl: 1.015 };
  const cost = (s, id) => { const u = UP[id]; return Math.ceil(u.c0 * Math.pow(u.cm, lvl(s, id)) * Math.pow(CFG.infl - 0.001 * (s.perks.r_disc || 0), total(s))); };
  function lockReason(s, id) { const u = UP[id]; if (s.zone < u.zone) return `${ZONES[u.zone].name} 도달 필요`; for (const [r, n] of u.req) if (lvl(s, r) < n) return `${UP[r].name} Lv${n} 필요`; return ''; }
  const canBuy = (s, id) => lvl(s, id) < UP[id].max && !lockReason(s, id) && s.gold >= cost(s, id);
  function buy(s, id) { if (!canBuy(s, id)) return false; s.gold -= cost(s, id); s.lv[id] = lvl(s, id) + 1; return true; }
  const starsFor = best => best < 25000 ? 0 : Math.max(1, Math.floor(3 * Math.pow(Math.log10(best / 3000), 1.6)));

  function stats(s) {
    const L = id => lvl(s, id), P = id => s.perks[id] || 0;
    const power = 7 * Math.pow(1.05, L('push')) * Math.pow(1.025, L('runup')) * Math.pow(1.05, L('sling')) * Math.pow(1.05, L('cannon')) * Math.pow(1.045, L('rail')) * (1 + 0.04 * P('p_power')) * (1 + 0.01 * s.starsTotal * (P('r_bless') ? 2 : 1));
    return {
      power, angle: (14 + 2.8 * L('ramp')) * Math.PI / 180,
      perfect: 1.10 + 0.02 * L('timing') + 0.03 * P('r_focus'), window: 0.06 + 0.012 * L('timing'), meter: 1.6 / (1 + 0.15 * P('p_meter')),
      mu: 0.35 * Math.pow(0.88, L('wheel')) * Math.pow(0.8, L('hover')), e: 0.28 + 0.026 * L('tire'), loss: 0.30 * Math.pow(0.86, L('frame')),
      drag: 0.02 * Math.pow(0.9, L('aero')), bumper: L('bumper'), wide: L('wide'), float: L('float'), heat: L('heat'),
      thrust: L('rocket') ? (3 + 0.4 * L('rocket') + power * (0.04 + 0.004 * L('rocket'))) * (1 + 0.04 * L('jet')) : 0, fuel: L('rocket') ? 1.5 + 0.15 * L('fuel') + 0.5 * P('p_fuel') : 0,
      spring: L('spring'), springN: L('spring') ? 1 + Math.floor(L('spring') / 4) + P('r_spring') : 0, dash: L('dash'), dashN: L('dash') ? 1 + Math.floor(L('dash') / 5) + P('r_dash') : 0,
      glide: Math.min(0.72, 0.035 * L('wing')), grav: (1 - 0.03 * L('grav')) * (1 - 0.02 * P('r_feather')), trick: 0.03 * (1 + 0.5 * P('r_trick')) * (1 + 0.2 * L('trickpay')), gyro: L('gyro'), rubber: 1 + 0.05 * L('rubber'), kickB: 0.01 * L('rail2'), nozzle: 0.08 * L('nozzle'), dashpow: 1 + 0.12 * L('dashpow'),
      airjump: L('airjump') ? 0.4 + 0.06 * L('airjump') : 0, convert: 0.004 * L('convert'), dive: L('dive'), diveN: L('dive') ? 1 + Math.floor(L('dive') / 3) : 0, relay: L('relay'), combo: 0.002 * L('combo'), lucky: 0.02 * L('lucky'), double: P('r_double'), phoenix: P('r_phoenix'),
      rate: Math.pow(1.09, L('ad')) * (1 + 0.25 * P('p_gold')) * (1 + 0.1 * s.starsTotal * (P('r_bless') ? 2 : 1)) * (1 + 0.05 * L('sponsor') * s.zone) * (1 + 0.03 * achCount(s)),
      coin: Math.pow(1.15, L('coin')) * (1 + 0.5 * P('r_coin')), magnet: L('magnet'), style: 0.0025 * L('style'), alt: 0.005 * L('alt'), crate: L('crate'),
    };
  }

  // ---- world objects: one per cell, decided by a hash so the course is the same every run -------------
  const hash = n => { let t = (n + 0x6D2B79F5) | 0; t = Math.imul(t ^ (t >>> 15), 1 | t); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const CELL = 34;
  function cellObj(z, i, crate, relay) {
    const Z = ZONES[z], cs = CELL * Z.sc, x = Z.at + (i + 0.25 + 0.5 * hash(z * 9973 + i * 7 + 1)) * cs, id = z * 1e6 + i, r = hash(z * 9973 + i * 7 + 2), h = hash(z * 9973 + i * 7 + 3);
    if (x < 26 || (z + 1 < ZONES.length && x >= ZONES[z + 1].at)) return null;
    const air = (lo, hi) => ground(x) + (lo + (hi - lo) * h) * Z.sc;
    let type;
    if (r < 0.30) type = 'coin'; else if (r < 0.42) type = 'pad'; else if (r < 0.52) type = 'tramp'; else if (r < 0.64) type = 'ring'; else if (r < 0.80) type = 'haz'; else if (r < 0.80 + 0.012 * (1 + crate)) type = 'crate'; else if (r < 0.90) type = 'spec'; else if (z >= 2 && r > 0.985 - 0.006 * (relay || 0)) type = 'barrel'; else return null;
    if (type === 'spec') { if (Z.id === 'lava') type = h < 0.5 ? 'geyser' : 'pool'; else if (Z.id === 'city') type = 'car'; else if (Z.id === 'sea') type = 'boat'; else if (Z.id === 'star' || Z.id === 'moon' || Z.id === 'canyon' || Z.id === 'hole') type = 'ring'; else if (Z.id === 'forest' || Z.id === 'cloud') type = 'tramp'; else if (Z.id === 'rock') type = 'haz'; else type = 'coin'; }
    if (Z.water && (type === 'pad' || type === 'haz')) type = h < 0.5 ? 'boat' : 'coin';
    const grounded = type === 'pad' || type === 'tramp' || type === 'haz' || type === 'geyser' || type === 'pool' || type === 'car' || type === 'boat';
    const y = grounded ? ground(x) : type === 'coin' ? air(2, 26) : type === 'ring' ? air(8, 40) : air(20, 60);
    return { id, type, x, y, z, sc: Z.sc, grounded };
  }

  // ---- one run ------------------------------------------------------------------------------------
  const RAMP = 4;   // launch ramp length in metres; the cart leaves from its top edge
  function newRun(st, meter, kick) {   // meter 0..1 from the charge gauge (>= 1-window is perfect); kick = extra multiplier from the ramp-edge tap
    const perfect = meter >= 1 - st.window, m = perfect ? st.perfect : 0.55 + 0.45 * meter / (1 - st.window), v = st.power * m * (kick || 1);
    return { st, kick: kick || 1, x: 0, y: RAMP * Math.tan(st.angle) + 0.3, vx: v * Math.cos(st.angle), vy: v * Math.sin(st.angle), v0: v, perfect, fuel: st.fuel, spring: st.springN, dash: st.dashN, t: 0, tr: 0, air: true, rest: 0,
      maxX: 0, maxAlt: 0, maxV: v, bounces: 0, coins: 0, coinGold: 0, broke: 0, used: new Set(), cell: [-1, -1], over: false, why: '', ev: [], tw: 1, boosting: false,
      dive: st.diveN, slam: false, combo: 0, comboT: -9, maxCombo: 0, golden: Math.random() < st.lucky,
      ang: st.angle, spin: 0, rotAcc: 0, tricks: 0, crashes: 0, usedBoost: false, doubled: false, risen: false, lastBounce: -9 };
  }
  function hit(r, o) {
    const st = r.st, sp = Math.hypot(r.vx, r.vy), zc = Math.pow(1.9, o.z);
    r.used.add(o.id);
    if (o.type !== 'haz' && o.type !== 'pool') { r.combo = r.tr - r.comboT < 3 ? r.combo + 1 : 1; r.comboT = r.tr; if (r.combo > r.maxCombo) r.maxCombo = r.combo; }
    if (o.type === 'coin') { const g = 5 * zc * st.coin; r.coins++; r.coinGold += g; r.ev.push({ k: 'coin', x: o.x, y: o.y, g }); }
    else if (o.type === 'barrel') { const s2 = sp + 0.4 * r.v0 + 8; r.vx = s2 * 0.88; r.vy = s2 * 0.47; r.air = true; r.rotAcc = 0; r.x = o.x; r.y = o.y; r.barrels = (r.barrels || 0) + 1; r.ev.push({ k: 'barrel', x: o.x, y: o.y }); }
    else if (o.type === 'crate') { const g = 120 * zc * st.coin; r.coinGold += g; r.ev.push({ k: 'crate', x: o.x, y: o.y, g }); }
    else if (o.type === 'pad') { const add = Math.max(sp * 0.02, 0.35 * (1.15 * r.v0 - sp)); r.vx += add; r.ev.push({ k: 'pad', x: o.x, y: o.y }); }
    else if (o.type === 'tramp' || o.type === 'car' || o.type === 'boat') { r.vy = Math.max(r.vy, 0) + (7 + sp * (o.type === 'tramp' ? 0.34 : 0.24)) * st.rubber; r.vx *= 1.02; r.air = true; r.bounces++; r.ev.push({ k: 'tramp', x: o.x, y: o.y }); }
    else if (o.type === 'ring') { r.vx += Math.max(sp * 0.015, 0.25 * (1.1 * r.v0 - sp)); r.vy = r.vy * 0.6 + 4 + sp * 0.06; r.ev.push({ k: 'ring', x: o.x, y: o.y }); }
    else if (o.type === 'geyser') { r.vy = Math.max(r.vy, 0) + 30 + sp * 0.45; r.air = true; r.ev.push({ k: 'geyser', x: o.x, y: o.y }); }
    else if (o.type === 'pool') { const k = 0.55 + 0.044 * st.heat; r.vx *= k; r.vy *= k; r.ev.push({ k: 'burn', x: o.x, y: o.y }); }
    else if (o.type === 'haz') { if (st.bumper >= 6) { const g = 20 * zc * st.coin; r.coinGold += g; r.broke++; r.vx *= 0.99; r.ev.push({ k: 'smash', x: o.x, y: o.y, g }); } else { const k = 0.72 + 0.045 * st.bumper; r.vx *= k; r.vy *= k; r.ev.push({ k: 'bonk', x: o.x, y: o.y }); } }
  }
  function objects(r, x0, x1) {
    for (let z = zoneAt(x0); z <= zoneAt(x1); z++) { const Z = ZONES[z], cs = CELL * Z.sc, i0 = Math.max(0, Math.floor((x0 - Z.at) / cs) - 1), i1 = Math.floor((x1 - Z.at) / cs);
      for (let i = i0; i <= i1; i++) { const o = cellObj(z, i, r.st.crate, r.st.relay); if (!o || r.used.has(o.id) || o.x < x0 || o.x > x1) continue;
        const alt = r.y - ground(o.x);
        if (o.grounded) { if (alt < 2.2 * o.sc) hit(r, o); }
        else { const rad = (o.type === 'coin' ? 3.2 + 0.9 * r.st.magnet : o.type === 'ring' ? 6 : 5) * o.sc; if (Math.abs(r.y - o.y) < rad) hit(r, o); } } }
  }
  // advance by dt real seconds; inp = { boost: bool, skill: bool (edge) }
  function step(r, dtReal, inp) {
    if (r.over) return; const st = r.st; r.ev.length = 0;
    const sp0 = Math.hypot(r.vx, r.vy), gE = lerpZ(r.x, 'g') * st.grav * (1 - st.glide), altW = r.y - ground(r.x), twT = Math.min(1500, Math.max(r.air ? 1 : 3, sp0 / (2.8 * gE), r.air && r.vy < 0 ? altW / (1 - r.vy) / 4 : 0)); r.tw += (twT - r.tw) * Math.min(1, dtReal * 3);
    const dt = dtReal * r.tw, n = Math.min(400, Math.max(1, Math.ceil(Math.max(sp0 * dt / Math.max(1.2, 0.35 * lerpZ(r.x, 'sc')), dtReal * 120)))), h = dt / n;
    r.boosting = !!(inp.boost && r.fuel > 0);
    const alt0 = r.y - ground(r.x);
    const grounded0 = alt0 < 1.5 + sp0 * 0.01;
    const doSpring = k => { const pf = k === 1 && r.tr - r.lastBounce < 0.22 ? 1.35 : 1; r.spring--; r.vy = Math.max(r.vy, 0) + (5 + 0.5 * st.spring + sp0 * (0.26 + 0.008 * st.spring)) * pf * k; r.vx *= 1.03; r.air = true; r.rotAcc = 0; r.ev.push({ k: k < 1 ? 'airspring' : pf > 1 ? 'pspring' : 'spring', x: r.x, y: r.y }); };
    const doDash = () => { r.dash--; const add = (6 + st.dash + sp0 * (0.08 + 0.006 * st.dash)) * st.dashpow; r.vx += add; r.vy = Math.max(r.vy, -sp0 * 0.1) + add * 0.12; r.ev.push({ k: 'dash', x: r.x, y: r.y }); };
    if (inp.skill) { if (grounded0 && r.spring > 0) doSpring(1); else if (r.dash > 0 && !grounded0) doDash(); else if (!grounded0 && st.airjump && r.spring > 0) doSpring(st.airjump); }
    if (inp.spring && r.spring > 0) { if (grounded0) doSpring(1); else if (st.airjump) doSpring(st.airjump); }
    if (inp.dash && r.dash > 0 && !grounded0) doDash();
    if (inp.dive && r.dive > 0 && !grounded0) { r.dive--; r.slam = true; r.vy = -Math.max(Math.abs(r.vy), sp0 * 0.7); r.vx += sp0 * (0.05 + 0.02 * st.dive) + 4; r.spin = 0; r.ev.push({ k: 'dive', x: r.x, y: r.y }); }
    // air control: inp.spin = +1 back flip, -1 front flip.  With no input the cart settles along its flight path.
    if (r.air) { const sd = inp.spin || 0;
      if (sd) { r.spin += sd * 16 * (1 + 0.08 * st.gyro) * dtReal; r.spin = Math.max(-9, Math.min(9, r.spin)); }
      else { r.spin *= Math.pow(0.02, dtReal); if (Math.abs(r.rotAcc) < 0.6) { const want = Math.max(-0.9, Math.min(0.9, Math.atan2(r.vy, Math.max(1, r.vx)))); let d = want - r.ang; d = Math.atan2(Math.sin(d), Math.cos(d)); r.ang += d * Math.min(1, dtReal * 4); } }
      r.ang += r.spin * dtReal; r.rotAcc += r.spin * dtReal;
      if (st.double && !r.doubled && r.vy < 0 && r.tr > 0.3) { r.doubled = true; const sp = Math.hypot(r.vx, r.vy) || 1, add = 0.25 * r.v0; r.vx += add * 0.92; r.vy += add * 0.4 + Math.max(0, -r.vy) * 0.5; r.ev.push({ k: 'double', x: r.x, y: r.y }); } }
    if (r.boosting) { r.usedBoost = true; r.fuel -= dtReal; const sp = Math.hypot(r.vx, r.vy) || 1; let ux = r.vx / sp, uy = r.vy / sp + 0.38; const m = Math.hypot(ux, uy) || 1; if (sp < 2) { ux = 0.94; uy = 0.34; } else { ux /= m; uy /= m; } const dv = st.thrust * dtReal; r.vx += ux * dv + dv * st.nozzle; r.vy += uy * dv; }
    const xPrev = r.x;
    for (let i = 0; i < n; i++) {
      const g = lerpZ(r.x, 'g') * st.grav * (r.air ? 1 - st.glide * Math.min(1, Math.abs(r.vx) / 12) : 1), dk = st.drag * lerpZ(r.x, 'drag');
      r.vy -= g * h; const d = Math.exp(-dk * h); r.vx *= d; r.vy *= d;
      if (st.convert && r.air && r.vy < 0) { const f = 1 - Math.exp(-st.convert * h), vy0 = r.vy; r.vy *= 1 - f; r.vx = Math.sqrt(Math.max(0, r.vx) * Math.max(0, r.vx) + (vy0 * vy0 - r.vy * r.vy) * 0.75); }   // wings bend the fall forward: sink speed becomes forward speed, no free energy
      r.x += r.vx * h; r.y += r.vy * h;
      const gy = ground(r.x);
      if (r.y <= gy) {
        r.y = gy; const sl = (ground(r.x + 0.5) - ground(r.x - 0.5)), nl = Math.hypot(sl, 1), nx = -sl / nl, ny = 1 / nl, tx = ny, ty = -nx;
        let vn = r.vx * nx + r.vy * ny, vt = r.vx * tx + r.vy * ty;
        if (vn < 0) {
          const imp = -vn, water = isWater(r.x), z = zoneAt(r.x), Z = ZONES[z];
          if (r.air) { // landing: clean flips pay out, a botched one costs speed
            const sa = Math.atan(sl), dd = Math.atan2(Math.sin(r.ang - sa), Math.cos(r.ang - sa)), flips = Math.round(Math.abs(r.rotAcc) / 6.2832);
            if (flips >= 1 && Math.abs(dd) < 0.7 + 0.04 * st.gyro) { r.tricks += flips; vt *= 1 + Math.min(0.25, 0.05 * flips); r.ev.push({ k: 'trick', x: r.x, y: r.y, n: flips, clean: Math.abs(dd) < 0.2 }); }
            else if (Math.abs(r.rotAcc) > 1.2 && Math.abs(dd) > 1.4) { vt *= 0.75; r.crashes++; r.ev.push({ k: 'crash', x: r.x, y: r.y }); }
            r.rotAcc = 0; r.spin = 0; r.ang = sa; r.lastBounce = r.tr; }
          if (water && !st.float) { if (Math.abs(vt) > 24 && imp < Math.abs(vt) * 0.55) { vn = imp * 0.45; vt *= 0.86; r.bounces++; r.air = true; r.ev.push({ k: 'skip', x: r.x, y: r.y }); } else { r.over = true; r.why = '물에 빠졌어요'; r.ev.push({ k: 'sink', x: r.x, y: r.y }); break; } }
          else {
            const rough = Z.loss > 1 ? 1 + (Z.loss - 1) * Math.max(0.15, 1 - 0.085 * st.wide) : Z.loss, eZ = Z.e < 1 ? 1 - (1 - Z.e) * Math.max(0.15, 1 - 0.085 * st.wide) : Z.e;
            const e = water ? 0.4 + 0.035 * st.float : Math.min(0.92, st.e * eZ);
            if (r.slam && !water) { r.slam = false; vn = imp * Math.min(0.97, e + 0.08 + 0.02 * st.dive); vt *= 1.02; r.bounces++; r.air = true; r.slams = (r.slams || 0) + 1; r.ev.push({ k: 'slam', x: r.x, y: r.y, imp }); }
            else if (imp > 1.4 + Math.abs(vt) * 0.012) { vn = imp * e; vt *= 1 - Math.min(0.9, (water ? 0.16 - 0.01 * st.float : st.loss * rough) * Math.min(1, imp / (Math.abs(vt) + 1) * 3 + 0.25)); r.bounces++; r.air = true; r.ev.push({ k: 'bounce', x: r.x, y: r.y, imp }); }
            else { vn = 0; r.air = false; r.ang = Math.atan(sl); const muZ = Z.mu > 1 ? 1 + (Z.mu - 1) * Math.max(0.15, 1 - 0.085 * st.wide) : Z.mu, mu = water ? 0.5 / (1 + 0.6 * st.float) : st.mu * muZ, dec = mu * g * h; vt = Math.abs(vt) <= dec ? 0 : vt - Math.sign(vt) * dec; }
          }
          r.vx = vn * nx + vt * tx; r.vy = vn * ny + vt * ty;
        }
      } else if (r.y - gy > 0.3) r.air = true;
      if (r.y - gy > r.maxAlt) r.maxAlt = r.y - gy;
    }
    if (!r.over && r.x > xPrev) objects(r, xPrev, r.x);
    r.t += dt; r.tr += dtReal; if (r.x > r.maxX) r.maxX = r.x;
    const sp = Math.hypot(r.vx, r.vy); if (sp > r.maxV) r.maxV = sp;
    if (!r.over) { if (sp < 0.35 && !r.air) { r.rest += dt; if (r.rest > 0.5) { if (st.phoenix && !r.risen) { r.risen = true; r.rest = 0; const v = 0.4 * r.v0; r.vx = v * Math.cos(st.angle); r.vy = v * Math.sin(st.angle); r.y += 0.5; r.air = true; r.ev.push({ k: 'phoenix', x: r.x, y: r.y }); } else { r.over = true; r.why = '멈췄어요'; } } } else r.rest = 0;
      if (r.vx < -0.5 && r.x < r.maxX - 25 * lerpZ(r.x, 'sc')) { r.over = true; r.why = '언덕을 넘지 못했어요'; }
      if (r.tr > 100) { r.over = true; r.why = '측정 한계(100초)에 도달했어요'; } }
  }
  // gold for a finished run
  function payout(r, s) {
    const st = r.st, D = r.maxX, z = zoneAt(D), gd = (d, zi) => 9 * Math.pow(d, 0.55) * Math.pow(1.15, zi) * st.rate;
    const dist = gd(D, z);
    const style = st.style * Math.min(12, r.bounces), alt = st.alt * Math.log2(1 + r.maxAlt / 8), perfect = r.perfect ? 0.1 : 0, trick = st.trick * Math.min(30, r.tricks), combo = st.combo * Math.min(50, r.maxCombo), gold = r.golden ? 3 : 1;
    let first = 0; for (let i = s.zone + 1; i <= z; i++) first += 3 * gd(ZONES[i].at, i);
    const coins = r.coinGold * st.rate * 0.6, mult = 1 + style + alt + perfect + trick + combo;
    return { dist, coins, style, alt, perfect, trick, combo, gold, first, mult, total: Math.floor(((dist + coins) * mult + first) * gold), zone: z };
  }
  function finish(r, s) { const p = payout(r, s); s.gold += p.total; s.runs++; if (r.perfect) s.perfects = (s.perfects || 0) + 1; if (r.slams) s.slams = (s.slams || 0) + r.slams; p.record = r.maxX > s.best; if (r.maxX > s.best) s.best = r.maxX; if (r.maxX > s.bestLife) s.bestLife = r.maxX; p.newZone = p.zone > s.zone; if (p.zone > s.zone) s.zone = p.zone; p.ach = checkAch(s, r); return p; }
  function rebirth(s) { const gain = starsFor(s.bestLife); if (s.bestLife < ZONES[ZI('sea')].at) return 0; const seed = (s.perks.p_seed || 0) ? 100 * Math.pow(10, s.perks.p_seed) : 0;
    s.stars += gain; s.starsTotal += gain; s.rebirths++; s.gold = seed; s.lv = {}; s.bestLife = 0; s.zone = Math.min(s.zone, 2 * (s.perks.r_skip || 0)); checkAch(s, null); return gain; }
  function buyPerk(s, id) { const p = PK[id], l = s.perks[id] || 0; if (!p || l >= p.max || perkLock(s, id) || s.stars < perkCost(p, l)) return false; s.stars -= perkCost(p, l); s.perks[id] = l + 1; return true; }
  return { ZI, RAMP, CFG, total, ZONES, UPS, UP, BRANCH, PERKS, PK, PBRANCH, perkCost, perkLock, ACH, checkAch, achCount, zoneAt, lerpZ, ground, isWater, cellObj, CELL, newSave, lvl, cost, lockReason, canBuy, buy, stats, newRun, step, payout, finish, rebirth, buyPerk, starsFor };
})();
if (typeof module !== 'undefined') module.exports = CORE;
