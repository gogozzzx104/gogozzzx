/* 작은 세상 (chapter 2 of the cart game) - rules only, no DOM.
   The player rides a bubble capsule through a channel that flows to the right and into ever smaller worlds, from a crack in the
   shop floor down to the Planck floor, looking for the decimal point the cashier dropped.
   Progress is measured in zones (p = X / LEN).  The capsule's raw speed V is set by upgrades; the speed it actually moves at in the
   local world is V / BASE^p, so every zone deeper is a world BASE times bigger compared with the capsule: fast through the shallow
   zones, slowing at the frontier.  Above the break speed it smashes through obstacles; below it, hits cost hull and momentum, so the
   frontier is where steering matters.  A run ends when the energy runs out or the hull breaks. */
const MCORE = (() => {
  'use strict';
  const LEN = 1500, HH = 9, CW = 10, ZN = 24, RB = 0.9;

  // zones: name, log10 of the size of things around the capsule at the zone's start (metres), style, palette [deep, mid, glow, accent],
  // music, a short fact about that scale
  const ZONES = [
    ['마트 바닥 틈', -2, 'tile', ['#2a2230', '#5a4a52', '#ffd9a0', '#ffb347'], 'mtile', '계산대 앞 바닥 타일 사이, 1센티미터 남짓한 틈이에요.'],
    ['먼지 숲', -3, 'fiber', ['#2b2a3a', '#6a6478', '#e8e0ff', '#c9b8ff'], 'mfiber', '먼지 한 톨은 0.1밀리미터 안팎. 옷에서 빠진 섬유가 숲처럼 얽혀 있어요.'],
    ['진드기 마을', -3.6, 'mite', ['#2d2418', '#6e5636', '#ffe3b0', '#ff9f5a'], 'mfiber', '집먼지진드기는 0.25밀리미터. 눈으로는 거의 안 보여요.'],
    ['꽃가루 들판', -4.4, 'pollen', ['#2e2a12', '#7a6a1e', '#fff3a0', '#ffd23a'], 'mpollen', '꽃가루 한 알은 약 40마이크로미터, 머리카락 굵기의 절반쯤이에요.'],
    ['세포의 바다', -5, 'cell', ['#10283a', '#1e5a7a', '#bfefff', '#5ad1ff'], 'mcell', '사람 세포 하나는 약 10마이크로미터. 몸속엔 37조 개쯤 있어요.'],
    ['세균 왕국', -5.7, 'bact', ['#0f2a1c', '#226a42', '#c8ffd8', '#4dff9a'], 'mcell', '대장균 한 마리는 2마이크로미터. 꼬리(편모)를 돌려 헤엄쳐요.'],
    ['미토콘드리아 공장', -6.3, 'mito', ['#2a1420', '#6e2a48', '#ffd0e4', '#ff6fae'], 'mcell', '세포의 발전소, 미토콘드리아는 0.5마이크로미터 크기예요.'],
    ['바이러스 성채', -7, 'virus', ['#1e1430', '#4a2a78', '#e6d0ff', '#b46bff'], 'mvirus', '바이러스는 100나노미터 안팎. 빛의 파장보다도 작아요.'],
    ['단백질 숲', -8, 'protein', ['#14202e', '#2a4a6a', '#d0e8ff', '#6fb4ff'], 'mvirus', '단백질 한 덩이는 10나노미터쯤. 접힌 모양이 곧 하는 일이에요.'],
    ['DNA 나선 계단', -8.7, 'dna', ['#101a2a', '#1e3e66', '#cfe4ff', '#ff7ad0'], 'mdna', 'DNA 가닥의 폭은 2나노미터. 펴면 세포 하나에 2미터나 돼요.'],
    ['분자 구름', -9.4, 'molecule', ['#0e1c26', '#1a4656', '#d0fbff', '#5af0e8'], 'mdna', '물 분자 하나는 0.3나노미터. 한 방울에 1,500해 개가 들어 있어요.'],
    ['원자의 바깥 껍질', -10, 'atom', ['#0c1024', '#202a66', '#d8e0ff', '#7a8cff'], 'matom', '원자 하나는 0.1나노미터(100피코미터). 대부분이 텅 비어 있어요.'],
    ['전자 구름', -10.7, 'electron', ['#0a0c1e', '#1c1e5a', '#c8d0ff', '#9a7bff'], 'matom', '전자는 정해진 자리가 없어요. 있을 법한 곳이 구름처럼 퍼져 있죠.'],
    ['텅 빈 원자 속', -12, 'void', ['#06060e', '#141430', '#a8b0ff', '#ff5a8a'], 'mvoid', '원자가 축구장이라면 원자핵은 가운데 놓인 개미 한 마리예요.'],
    ['원자핵', -14, 'nucleus', ['#200a0a', '#5a1a1a', '#ffd0c0', '#ff6a4a'], 'mnuc', '원자핵은 10펨토미터. 원자 질량의 99.9%가 여기 모여 있어요.'],
    ['양성자 안', -15, 'proton', ['#1a0a18', '#4a1a46', '#ffd0f4', '#ff4ad0'], 'mnuc', '양성자(1펨토미터) 안에는 쿼크 셋이 글루온으로 묶여 있어요.'],
    ['쿼크의 바다', -16, 'quark', ['#0a1416', '#16444a', '#c8fff4', '#3affd0'], 'mquark', '쿼크는 혼자서는 절대 꺼낼 수 없어요. 당기면 새 쿼크가 생겨요.'],
    ['글루온 폭풍', -17, 'gluon', ['#160e06', '#4a3010', '#ffe8c0', '#ffaa2a'], 'mquark', '글루온의 힘은 멀어질수록 세져요. 고무줄처럼요.'],
    ['약력의 문', -18, 'weak', ['#0c0c16', '#2a2a4a', '#e0e0ff', '#a0a8ff'], 'mweak', '약력은 10⁻¹⁸미터 안에서만 닿아요. 별이 타는 데 꼭 필요한 힘이에요.'],
    ['힉스 들판', -19, 'higgs', ['#0e0a16', '#2e2048', '#f0e0ff', '#ffd84a'], 'mweak', '힉스 장은 입자에 질량을 줘요. 꿀 속을 걷는 것처럼 무거워지죠.'],
    ['끈의 골짜기', -24, 'string', ['#06101a', '#103048', '#d0f0ff', '#3ad8ff'], 'mstring', '여기부터는 가설의 세계. 모든 입자가 떨리는 끈이라는 생각이에요.'],
    ['대통일의 벽', -30, 'gut', ['#140614', '#3a103a', '#ffe0ff', '#ff6aff'], 'mstring', '아주 높은 에너지에선 세 힘이 하나였을지도 몰라요.'],
    ['양자 거품', -33, 'foam', ['#04040a', '#16162a', '#ffffff', '#b0f0ff'], 'mfoam', '시공간 자체가 끓는 거품처럼 생겼다 사라진대요.'],
    ['플랑크 바닥', -34.8, 'planck', ['#000000', '#101010', '#ffffff', '#ffe27a'], 'mfoam', '1.6×10⁻³⁵미터. 이보다 작은 길이는 의미가 없다고 해요.']
  ].map(([name, lg, style, pal, tune, fact], i) => ({ i, name, lg, style, pal, tune, fact }));
  const END_LG = -34.8 - 0.4;
  // the size of things around the capsule at progress p (log10 metres)
  const lgAt = p => { if (p <= 0) return ZONES[0].lg; if (p >= ZN) return END_LG; const k = Math.floor(p), f = p - k, a = ZONES[k].lg, b = k + 1 < ZN ? ZONES[k + 1].lg : END_LG; return a + (b - a) * f; };

  // hashing: deterministic object layout per run seed and cell
  const hash = n => { let h = Math.imul((n | 0) ^ 0x9e3779b9, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  const H2 = (a, b) => hash(Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663));

  /* ---------- upgrades (bought with light ✦) ---------- */
  // id, tab, name, max, base cost, growth, description, zone needed (index reached before it can be bought)
  const UPS = [
    ['u_power', 'gear', '축소 출력', 90, 10, 2.1, '방울이 나아가는 힘 ×1.22씩', 0],
    ['u_lens', 'gear', '집속 렌즈', 10, 40, 2.2, '완벽 축소 구간이 넓어지고 보너스 증가', 0],
    ['u_pre', 'gear', '예열 코일', 15, 60, 1.9, '출발할 때 가속 +8%씩', 1],
    ['u_flow', 'hull', '유선형 막', 60, 25, 2.2, '나아가는 힘 ×1.12씩', 0],
    ['u_fin', 'hull', '조향 지느러미', 15, 30, 1.8, '위아래로 움직이는 속도 +8%씩', 0],
    ['u_hull', 'hull', '막 두께', 4, 150, 12, '부딪혀도 버티는 막 +1', 2],
    ['u_tens', 'hull', '표면 장력', 6, 120, 4, '부딪혔을 때 잃는 속도가 줄고 무적 시간이 늘어요', 1],
    ['u_ram', 'hull', '충격 돌파', 12, 200, 2.6, '이 속도부터는 부딪혀도 뚫고 나가요 (돌파 속도 −6%씩)', 2],
    ['u_tank', 'tech', '추진 탱크', 12, 50, 2.0, '추진(Space) 연료 +0.5초씩', 0],
    ['u_noz', 'tech', '추진 노즐', 15, 70, 2.0, '추진 세기 +12%씩', 0],
    ['u_pulse', 'tech', '펄스 셀', 6, 100, 5, '펄스(E) +1회: 순간 가속하며 잠깐 무적', 0],
    ['u_pamp', 'tech', '펄스 증폭', 10, 150, 2.4, '펄스 세기 +20%씩', 1],
    ['u_blink', 'tech', '양자 도약', 5, 800, 7, '양자 도약(Q) +1회: 앞으로 순간 이동', 4],
    ['u_blinkd', 'tech', '도약 거리', 10, 600, 2.5, '양자 도약 거리 +15%씩', 4],
    ['u_shrink', 'tech', '수축', 4, 2000, 8, '수축(R) +1회: 방울이 절반으로 작아져요', 7],
    ['u_shrinkt', 'tech', '수축 시간', 8, 1500, 2.6, '수축이 0.5초씩 더 오래', 7],
    ['u_lux', 'gain', '빛 렌즈', 70, 20, 2.3, '얻는 빛 ×1.25씩', 0],
    ['u_mag', 'gain', '자기장', 10, 80, 2.2, '빛 알갱이를 끌어오는 범위', 1],
    ['u_en', 'gain', '에너지 탱크', 10, 100, 2.5, '출발 에너지 +1.5초씩', 0],
    ['u_eng', 'gain', '에너지 흡수', 10, 150, 2.3, '에너지 방울 하나에 +0.4초씩', 2],
    ['u_graze', 'gain', '스침 감각', 10, 90, 2.3, '스침 판정 범위·보너스 +20%씩', 1],
    ['u_combo', 'gain', '연쇄 회로', 10, 120, 2.3, '연쇄가 끊기지 않는 시간 +0.12초씩', 1],
    ['u_scout', 'gain', '개척 보상', 10, 300, 3, '새 구역 첫 도달 보상 +50%씩', 3]
  ].map(([id, tab, name, max, c0, gr, desc, zone]) => ({ id, tab, name, max, c0, gr, desc, zone }));
  const UP = Object.fromEntries(UPS.map(u => [u.id, u]));
  const TABS = [['gear', '축소기'], ['hull', '방울'], ['tech', '기술'], ['gain', '수집']];

  /* ---------- reconstruction perks (bought with crystals ◈) ---------- */
  const PERKS = [
    ['k_reso', '결정 공명', 15, 3, 1.9, '얻는 빛 ×2씩'],
    ['k_cata', '가속 촉매', 15, 3, 1.9, '나아가는 힘 ×1.6씩'],
    ['k_amp', '결정 증폭', 10, 12, 2.4, '재구성 때 얻는 결정 ×1.3씩'],
    ['k_comp', '차원 압축', 5, 30, 3.5, '구역이 깊어질 때 느려지는 정도를 줄여요'],
    ['k_mem', '형태 기억', 5, 10, 3, '재구성해도 업그레이드 레벨 10%씩 유지'],
    ['k_time', '시간 결정', 5, 8, 2.5, '출발 에너지 +3초씩'],
    ['k_graze', '스침의 달인', 5, 10, 2.6, '스침 보너스 ×1.5씩, 스칠 때 가속 증가'],
    ['k_shell', '결정 껍질', 2, 25, 6, '막 +1'],
    ['k_super', '양자 중첩', 2, 40, 8, '막이 다 깨져도 한 번 더 살아나요'],
    ['k_kit', '출발 장비', 3, 20, 4, '펄스·양자 도약 +1회씩 (도약은 배운 뒤)'],
    ['k_auto', '자동 조립', 1, 30, 1, '판이 끝날 때마다 업그레이드 자동 구매']
  ].map(([id, name, max, c0, gr, desc]) => ({ id, name, max, c0, gr, desc }));
  const PK = Object.fromEntries(PERKS.map(q => [q.id, q]));
  const RECON_Z = 9;   // reconstruction opens once the DNA zone has been reached

  /* ---------- achievements: each one +3% light ---------- */
  const ACH = [];
  const A = (id, name, desc, test) => ACH.push({ id, name, desc, test });
  A('m_first', '첫 축소', '처음으로 작은 세상에 들어가기', (M, r) => M.runs >= 1);
  A('m_z3', '꽃밭의 손님', '꽃가루 들판 도달', M => M.zone >= 3);
  A('m_z5', '세균과 악수', '세균 왕국 도달', M => M.zone >= 5);
  A('m_z8', '단백질 산책', '단백질 숲 도달', M => M.zone >= 8);
  A('m_z11', '원자의 문지기', '원자의 바깥 껍질 도달', M => M.zone >= 11);
  A('m_z14', '핵심에 닿다', '원자핵 도달', M => M.zone >= 14);
  A('m_z17', '폭풍의 눈', '글루온 폭풍 도달', M => M.zone >= 17);
  A('m_z20', '가설 너머', '끈의 골짜기 도달', M => M.zone >= 20);
  A('m_z23', '바닥의 바닥', '플랑크 바닥 도달', M => M.zone >= 23);
  A('m_graze30', '아슬아슬', '한 판에 스침 30회', (M, r) => r && r.nearN >= 30);
  A('m_graze100', '종이 한 장 차이', '한 판에 스침 100회', (M, r) => r && r.nearN >= 100);
  A('m_ring', '고리 명사수', '한 판에 고리 정확 통과 10회', (M, r) => r && r.perfRingN >= 10);
  A('m_clean', '흠집 하나 없이', '한 번도 안 부딪히고 세균 왕국 도달', (M, r) => r && r.hits === 0 && r.pmax >= 5);
  A('m_perf', '정밀 축소', '완벽 축소 누적 10회', M => (M.perfects || 0) >= 10);
  A('m_light', '빛 수집가', '한 판에 빛 알갱이 200개', (M, r) => r && r.grains >= 200);
  A('m_smash', '거침없이', '한 판에 돌파 100회', (M, r) => r && r.smashN >= 100);
  A('m_super', '두 갈래의 나', '양자 중첩으로 다시 살아나기', (M, r) => r && r.revived > 0);
  A('m_recon', '다시 조립', '첫 재구성', M => (M.recons || 0) >= 1);
  A('m_recon5', '조립의 달인', '재구성 5회', M => (M.recons || 0) >= 5);
  A('m_maxall', '연구 완료', '업그레이드 모두 최대 레벨', M => UPS.every(u => lvl(M, u.id) >= u.max));
  A('m_found', '잃어버린 소수점', '플랑크 바닥에서 소수점 찾기', M => (M.ended || 0) >= 1);

  /* ---------- save ---------- */
  function newSave() { return { v: 1, open: 1, light: 0, lightLife: 0, lv: {}, crys: 0, crysTotal: 0, perks: {}, runs: 0, zone: 0, zoneEver: 0, best: 0, bestCyc: 0, perfects: 0, recons: 0, ended: 0, ach: {}, introSeen: 0, seenZone: 0 }; }
  function fix(M) { const d = newSave(); for (const k in d) if (M[k] == null) M[k] = d[k]; return M; }
  const lvl = (M, id) => (M.lv && M.lv[id]) || 0, pl = (M, id) => (M.perks && M.perks[id]) || 0;
  const achN = M => { let n = 0; for (const a of ACH) if (M.ach[a.id]) n++; return n; };

  /* ---------- derived stats ---------- */
  function stats(M) {
    const L = id => lvl(M, id), P = id => pl(M, id), an = achN(M);
    return {
      V0: 50 * Math.pow(1.22, L('u_power')) * Math.pow(1.12, L('u_flow')) * Math.pow(1.6, P('k_cata')),
      base: 2.2 - 0.04 * P('k_comp'),
      perfW: 0.035 + 0.004 * L('u_lens'), perfB: 0.6 + 0.08 * L('u_lens'), preB: 0.08 * L('u_pre'),
      steer: 22 * (1 + 0.08 * L('u_fin')),
      hp: 2 + L('u_hull') + P('k_shell'), hitKeep: 0.62 + 0.045 * L('u_tens'), invT: 0.9 + 0.12 * L('u_tens'),
      brk: 110 * Math.pow(0.94, L('u_ram')),
      fuel: 2.5 + 0.5 * L('u_tank'), thrust: 0.6 * (1 + 0.12 * L('u_noz')), refuel: 0.04,
      pulses: 1 + L('u_pulse') + P('k_kit'), pulseP: 0.9 * (1 + 0.2 * L('u_pamp')),
      blinks: L('u_blink') ? L('u_blink') + P('k_kit') : 0, blinkD: 30 * (1 + 0.15 * L('u_blinkd')),
      shrinks: L('u_shrink'), shrinkT: 2.5 + 0.5 * L('u_shrinkt'),
      lux: Math.pow(1.25, L('u_lux')) * Math.pow(2, P('k_reso')) * (1 + 0.03 * an),
      mag: L('u_mag') ? 1.2 + 0.6 * L('u_mag') : 0,
      energy: 18 + 1.5 * L('u_en') + 3 * P('k_time'), enGain: 2.5 + 0.4 * L('u_eng'),
      graze: 1.1 * (1 + 0.2 * L('u_graze')), grazeB: (1 + 0.2 * L('u_graze')) * Math.pow(1.5, P('k_graze')), grazeV: 0.05 * (1 + 0.5 * P('k_graze')),
      comboT: 1.2 + 0.12 * L('u_combo'), scout: 1 + 0.5 * L('u_scout'),
      revive: P('k_super'), crysK: Math.pow(1.3, P('k_amp'))
    };
  }

  /* ---------- costs and buying ---------- */
  const cost = (id, l) => { const u = UP[id]; return Math.ceil(u.c0 * Math.pow(u.gr, l) * (1 + 0.004 * l * l)); };
  const perkCost = (id, l) => { const q = PK[id]; return Math.ceil(q.c0 * Math.pow(q.gr, l)); };
  const lockReason = (M, id) => { const u = UP[id]; return M.zoneEver >= u.zone ? '' : ZONES[u.zone].name + ' 도달 필요'; };
  const canBuy = (M, id) => { const u = UP[id], l = lvl(M, id); return l < u.max && !lockReason(M, id) && M.light >= cost(id, l); };
  function buy(M, id) { if (!canBuy(M, id)) return false; M.light -= cost(id, lvl(M, id)); M.lv[id] = lvl(M, id) + 1; return true; }
  // spends light on whichever upgrade is cheapest right now, again and again (the automatic buy and the 'buy all' button)
  function buyAll(M) { let n = 0; for (let k = 0; k < 4000; k++) { let best = null, bc = Infinity; for (const u of UPS) { const l = lvl(M, u.id); if (l >= u.max || lockReason(M, u.id)) continue; const c = cost(u.id, l); if (c < bc) { bc = c; best = u.id; } } if (!best || bc > M.light) break; buy(M, best); n++; } return n; }
  const canPerk = (M, id) => { const q = PK[id], l = pl(M, id); return l < q.max && M.crys >= perkCost(id, l); };
  function buyPerk(M, id) { if (!canPerk(M, id)) return false; M.crys -= perkCost(id, pl(M, id)); M.perks[id] = pl(M, id) + 1; return true; }

  /* ---------- reconstruction ---------- */
  const reconOpen = M => M.zoneEver >= RECON_Z || (M.recons || 0) > 0;
  const crysFor = M => { const p = M.bestCyc || 0; if (p < RECON_Z) return 0; return Math.floor(5 * Math.pow(TUNE.crys, p - RECON_Z) * (1 + 0.05 * (M.recons || 0)) * stats(M).crysK); };
  function reconstruct(M) { const g = crysFor(M); if (!g) return 0; M.crys += g; M.crysTotal += g; M.recons = (M.recons || 0) + 1; const keep = 0.1 * pl(M, 'k_mem'), lv = {};
    for (const u of UPS) { const l = Math.floor(lvl(M, u.id) * keep); if (l) lv[u.id] = l; } M.lv = lv; M.light = 0; M.bestCyc = 0; M.zone = 0; return g; }

  /* ---------- a run ---------- */
  // quality: 2 perfect shrink, 1 good, 0 off
  function newRun(M, quality, seed) {
    const st = stats(M);
    return { st, seed: seed == null ? Math.floor(Math.random() * 1e9) : seed, X: 0, y: 0, vy: 0, V: st.V0, m: 1 + st.preB + (quality === 2 ? st.perfB : quality === 1 ? st.perfB * 0.4 : 0), pf: 0,
      E: st.energy, Emax: st.energy, hp: st.hp, fuel: st.fuel, pulses: st.pulses, blinks: st.blinks, shrinks: st.shrinks, shT: 0, inv: 0, revives: st.revive, revived: 0,
      tr: 0, used: new Set(), passed: new Set(), mag: [], grainV: 0, grains: 0, crystals: 0, nearN: 0, nearV: 0, ringN: 0, perfRingN: 0, ringV: 0, smashN: 0, smashV: 0, hits: 0,
      combo: 0, comboT: -9, maxCombo: 0, pmax: 0, p: 0, v: 0, quality, boosting: false, over: false, why: '', found: false, ev: [], zone: 0 };
  }
  const F = (st, p) => Math.pow(st.base, p);
  // light value of one grain at progress p (before the light multipliers)
  const TUNE = { gv: 1.7, depth: 20, first: 60, crys: 1.5 };
  const gv = p => Math.pow(TUNE.gv, p);
  const zoneOf = X => Math.max(0, Math.min(ZN - 1, Math.floor(X / LEN)));

  // objects in cell i (deterministic): b blocker circle, rod spinning bar, gate wall with a gap, ring, lt grain, big crystal, en energy
  function cellObjs(r, i) {
    if (!r.cache) r.cache = new Map(); let c = r.cache.get(i); if (c) return c; c = [];
    if (r.cache.size > 400) r.cache.clear();
    const h = k => H2(r.seed + i * 31, k), x0 = i * CW, z = zoneOf(x0 + CW / 2), d = Math.min(1, z / 18), pz = x0 / LEN;
    if (i < 4) { r.cache.set(i, c); return c; }   // a clear stretch right after the start
    // a gate every few cells: a wall across the channel with one gap
    const gateEvery = z < 1 ? 0 : Math.max(5, 11 - Math.floor(z / 3));
    if (gateEvery && i % gateEvery === 0) { const gw = Math.max(2.4, 5.2 - 0.12 * z), gy = (h(1) * 2 - 1) * (HH - gw - 0.5); c.push({ id: i * 16, t: 'gate', x: x0 + 5, y: gy, gw, r: 0.7, z });
      // grains through the gap
      for (let k = 0; k < 3; k++) c.push({ id: i * 16 + 8 + k, t: 'lt', x: x0 + 2 + k * 3, y: gy, r: 0.55, z });
      r.cache.set(i, c); return c; }
    // blockers: 1-4 per cell, some drifting up and down, some spinning bars from the third zone
    const nb = Math.floor(1 + d * 2.6 + h(2) * 1.4);
    for (let k = 0; k < nb; k++) { const x = x0 + CW * (0.1 + 0.8 * h(10 + k)), y = (h(20 + k) * 2 - 1) * (HH - 1), rod = z >= 3 && h(30 + k) < 0.12 + 0.12 * d;
      if (rod) c.push({ id: i * 16 + 1 + k, t: 'rod', x, y, L: 2.2 + 2 * h(40 + k), a0: h(50 + k) * 6.28, w: (h(60 + k) < 0.5 ? -1 : 1) * (0.8 + 1.6 * h(70 + k) * (0.5 + d)), r: 0.45, z });
      else { const mv = h(80 + k) < 0.25 + 0.35 * d; c.push({ id: i * 16 + 1 + k, t: 'b', x, y, r: 0.9 + 1.5 * h(90 + k), amp: mv ? 1.5 + 3 * h(100 + k) : 0, w: 0.6 + 1.2 * h(110 + k), ph: h(120 + k) * 6.28, z, k: Math.floor(h(130 + k) * 4) }); } }
    // a ring now and then
    if (h(3) < 0.16) c.push({ id: i * 16 + 6, t: 'ring', x: x0 + CW * 0.5, y: (h(4) * 2 - 1) * (HH - 2.5), r: 1.9, z });
    // a short arc of light grains, an energy bubble, a crystal
    if (h(5) < 0.55) { const n = 3 + Math.floor(h(6) * 3), y0 = (h(7) * 2 - 1) * (HH - 2), tl = (h(8) - 0.5) * 0.9; for (let k = 0; k < n; k++) c.push({ id: i * 16 + 9 + k, t: 'lt', x: x0 + 1 + k * 1.6, y: Math.max(-HH + 0.8, Math.min(HH - 0.8, y0 + Math.sin(k * 0.8) * 1.2 + k * tl)), r: 0.55, z }); }
    if (h(9) < 0.07) c.push({ id: i * 16 + 14, t: 'en', x: x0 + CW * 0.7, y: (h(11) * 2 - 1) * (HH - 1.5), r: 0.8, z });
    if (h(12) < 0.035 + 0.01 * d) c.push({ id: i * 16 + 15, t: 'big', x: x0 + CW * 0.3, y: (h(13) * 2 - 1) * (HH - 1.5), r: 0.9, z });
    r.cache.set(i, c); return c;
  }
  const objY = (o, t) => o.amp ? o.y + o.amp * Math.sin(o.w * t + o.ph) : o.y;
  const clampY = y => Math.max(-HH, Math.min(HH, y));
  // distance from the capsule to an obstacle's surface (negative = overlapping)
  function gap(o, x, y, t, rb) {
    if (o.t === 'b') return Math.hypot(o.x - x, clampY(objY(o, t)) - y) - o.r - rb;
    if (o.t === 'rod') { const a = o.a0 + o.w * t, ux = Math.cos(a), uy = Math.sin(a), dx = x - o.x, dy = y - o.y, s = Math.max(-o.L, Math.min(o.L, dx * ux + dy * uy)); return Math.hypot(dx - s * ux, dy - s * uy) - o.r - rb; }
    if (o.t === 'gate') { if (Math.abs(x - o.x) > o.r + rb) return Infinity; return o.gw - Math.abs(y - o.y) - rb; }
    return Infinity;
  }

  function step(r, dt, inp) {
    r.ev.length = 0; if (r.over) return;
    const st = r.st;
    // skills
    if (inp.pulse && r.pulses > 0) { r.pulses--; r.pf = Math.max(r.pf, st.pulseP); r.inv = Math.max(r.inv, 0.7); r.ev.push({ k: 'pulse' }); }
    if (inp.blink && r.blinks > 0) { r.blinks--; const x0 = r.X; r.X += st.blinkD; r.inv = Math.max(r.inv, 0.35); for (let i = Math.floor(x0 / CW); i <= Math.floor(r.X / CW); i++) for (const o of cellObjs(r, i)) if (o.x > x0 && o.x <= r.X) r.passed.add(o.id); r.ev.push({ k: 'blink', from: x0 }); }
    if (inp.shrink && r.shrinks > 0 && r.shT <= 0) { r.shrinks--; r.shT = st.shrinkT; r.ev.push({ k: 'shrink' }); }
    r.boosting = !!(inp.boost && r.fuel > 0);
    // vertical steering: keys give a direction, a finger gives a target height
    const tv = inp.ty != null ? Math.max(-st.steer, Math.min(st.steer, (inp.ty - r.y) * 7)) : (inp.dir || 0) * st.steer;
    r.vy += (tv - r.vy) * Math.min(1, dt * 12);
    // the local speed falls as the world grows around the capsule: dX/dt = A / base^(X/LEN), integrated exactly so a fast frame in the
    // shallow zones cannot skip ahead at the speed it had where it started
    const A = st.V0 * r.m * (1 + r.pf) * (r.boosting ? 1 + st.thrust : 1), lb = Math.log(st.base), v = A / F(st, r.X / LEN);
    r.v = v;
    const n = Math.max(1, Math.min(60, Math.ceil(v * dt / 0.45))), h = dt / n, rb = RB * (r.shT > 0 ? 0.5 : 1), brk = v >= st.brk, adv = X => LEN * Math.log(Math.exp(X / LEN * lb) + A * h * lb / LEN) / lb;
    for (let s = 0; s < n && !r.over; s++) {
      const xp = r.X; r.X = adv(xp); r.y = clampY(r.y + r.vy * h); r.tr += h;
      // warping: a sub-step longer than a few cells passes everything without touching it
      if (r.X - xp > 40) { const p = r.X / LEN; if (p > r.pmax) r.pmax = p; const z = Math.min(ZN - 1, Math.floor(p)); if (z > r.zone) { r.zone = z; r.ev.push({ k: 'zone', z }); } if (p >= ZN) { r.over = true; r.found = true; r.why = '소수점을 찾았어요!'; r.ev.push({ k: 'found' }); } r.warp = true; continue; }
      r.warp = false;
      if (r.y >= HH || r.y <= -HH) r.vy *= -0.3;
      const i0 = Math.floor((xp - 6) / CW), i1 = Math.floor((r.X + 6) / CW);
      for (let i = i0; i <= i1; i++) for (const o of cellObjs(r, i)) {
        if (r.used.has(o.id)) continue;
        if (o.t === 'lt' || o.t === 'big' || o.t === 'en') { const R = rb + o.r + 0.3 + (o.t === 'en' ? 0 : st.mag);
          if (Math.abs(o.x - r.X) < R && Math.hypot(o.x - r.X, o.y - r.y) < R) { r.used.add(o.id); pick(r, o); } continue; }
        if (o.t === 'ring') { if (!r.passed.has(o.id) && xp < o.x && r.X >= o.x) { r.passed.add(o.id); const d = Math.abs(r.y - o.y); if (d < o.r) { const pf = d < 0.6; r.m = Math.min(3, r.m + (pf ? 0.45 : 0.22)); r.ringN++; if (pf) r.perfRingN++; const val = gv(r.X / LEN) * (pf ? 3 : 1); r.ringV += val; chain(r); r.ev.push({ k: 'ring', pf, x: o.x, y: o.y }); } } continue; }
        const gp = gap(o, r.X, r.y, r.tr, rb);
        if (gp < 0) { r.used.add(o.id);
          if (brk || r.inv > 0) { r.smashN++; r.smashV += 0.3 * gv(r.X / LEN); if (r.inv <= 0) r.m *= 0.985; r.ev.push({ k: 'smash', x: o.x, y: o.t === 'gate' ? r.y : objY(o, r.tr), t: o.t, z: o.z }); }
          else { r.hits++; r.hp--; r.m *= st.hitKeep; r.inv = st.invT; r.combo = 0; r.ev.push({ k: 'hit', x: o.x, y: r.y, t: o.t });
            if (r.hp <= 0) { if (r.revives > 0) { r.revives--; r.revived++; r.hp = 1; r.inv = 2.2; r.m = Math.max(r.m, 1); r.ev.push({ k: 'super' }); } else { r.over = true; r.why = '방울이 터졌어요'; r.ev.push({ k: 'pop' }); } } }
          continue; }
        // near miss: judged once, when the capsule passes the obstacle
        if (!r.passed.has(o.id) && xp < o.x && r.X >= o.x) { r.passed.add(o.id); if (gp < st.graze * (r.shT > 0 ? 1.5 : 1)) { r.nearN++; const val = 0.5 * gv(r.X / LEN) * st.grazeB * (r.shT > 0 ? 2 : 1); r.nearV += val; r.m = Math.min(3, r.m + st.grazeV); chain(r); r.ev.push({ k: 'near', x: o.x, y: r.y, gp }); } }
      }
      const p = r.X / LEN; if (p > r.pmax) r.pmax = p;
      const z = Math.min(ZN - 1, Math.floor(p)); if (z > r.zone) { r.zone = z; r.ev.push({ k: 'zone', z }); }
      if (p >= ZN) { r.over = true; r.found = true; r.why = '소수점을 찾았어요!'; r.ev.push({ k: 'found' }); }
    }
    // momentum relaxes toward 1, the pulse fades, timers run
    r.m += (1 - r.m) * (1 - Math.exp(-dt / (r.m < 1 ? 1.8 : 2.4)));
    r.pf *= Math.exp(-dt / 0.45); if (r.pf < 0.01) r.pf = 0;
    if (r.boosting) r.fuel = Math.max(0, r.fuel - dt);
    r.inv = Math.max(0, r.inv - dt); r.shT = Math.max(0, r.shT - dt);
    if (!r.over) { r.E -= dt; if (r.E <= 0) { r.E = 0; r.over = true; r.why = '에너지가 다 됐어요'; r.ev.push({ k: 'out' }); } }
    r.p = r.X / LEN;
  }
  function chain(r) { r.combo = r.tr - r.comboT < r.st.comboT ? r.combo + 1 : 1; r.comboT = r.tr; if (r.combo > r.maxCombo) r.maxCombo = r.combo; }
  function pick(r, o) { const st = r.st, val = gv(r.X / LEN);
    if (o.t === 'en') { r.E = Math.min(r.Emax + 10, r.E + st.enGain); r.ev.push({ k: 'en', x: o.x, y: o.y }); return; }
    chain(r); const cm = 1 + Math.min(1, 0.02 * r.combo);
    if (o.t === 'big') { r.crystals++; r.grainV += 15 * val * cm; r.ev.push({ k: 'big', x: o.x, y: o.y, g: 15 * val * cm * st.lux }); }
    else { r.grains++; r.grainV += val * cm; r.fuel = Math.min(st.fuel, r.fuel + st.refuel); r.ev.push({ k: 'lt', x: o.x, y: o.y, g: val * cm * st.lux }); } }

  /* ---------- the end of a run ---------- */
  function payout(r, M) { const st = r.st, lux = st.lux, P = r.pmax;
    const grains = r.grainV * lux, near = r.nearV * lux, rings = r.ringV * lux, smash = r.smashV * lux, depth = TUNE.depth * gv(P) * lux;
    const z = Math.min(ZN - 1, Math.floor(P)); let first = 0; for (let k = M.zoneEver + 1; k <= z; k++) first += TUNE.first * gv(k) * st.scout * lux;
    const perfect = r.quality === 2 ? 0.3 : 0, combo = Math.min(1, 0.01 * r.maxCombo);
    const total = (grains + near + rings + smash + depth + first) * (1 + perfect + combo);
    return { grains, near, rings, smash, depth, first, perfect, combo, total }; }
  function finish(r, M) { const p = payout(r, M); M.light += p.total; M.lightLife += p.total; M.runs++; if (r.quality === 2) M.perfects = (M.perfects || 0) + 1;
    const z = Math.min(ZN - 1, Math.floor(r.pmax)), newZone = z > M.zoneEver; if (r.pmax > M.best) M.best = r.pmax; if (r.pmax > M.bestCyc) M.bestCyc = r.pmax; if (z > M.zone) M.zone = z; if (z > M.zoneEver) M.zoneEver = z;
    if (r.found) M.ended = (M.ended || 0) + 1;
    const ach = checkAch(M, r); if (pl(M, 'k_auto')) buyAll(M); return Object.assign(p, { ach, newZone, zone: z }); }
  function checkAch(M, r) { const out = []; for (const a of ACH) if (!M.ach[a.id] && a.test(M, r)) { M.ach[a.id] = 1; out.push(a); } return out; }

  // the size label for a log10 length: SI name and the old East Asian name for that power of ten
  const SI = [[-1, '데시미터', 1], [-2, '센티미터', 1], [-3, '밀리미터', 1], [-6, '마이크로미터', 1], [-9, '나노미터', 1], [-12, '피코미터', 1], [-15, '펨토미터', 1], [-18, '아토미터', 1], [-21, '젭토미터', 1], [-24, '욕토미터', 1], [-27, '론토미터', 1], [-30, '퀙토미터', 1]];
  const EAST = { '-1': '분(分)', '-2': '리(厘)', '-3': '모(毛)', '-4': '사(絲)', '-5': '홀(忽)', '-6': '미(微)', '-7': '섬(纖)', '-8': '사(沙)', '-9': '진(塵)', '-10': '애(埃)', '-11': '묘(渺)', '-12': '막(漠)', '-13': '모호(模糊)', '-14': '준순(逡巡)', '-15': '수유(須臾)', '-16': '순식(瞬息)', '-17': '탄지(彈指)', '-18': '찰나(刹那)', '-19': '육덕(六德)', '-20': '허공(虛空)', '-21': '청정(淸淨)' };
  const SUP = n => String(n).split('').map(c => c === '-' ? '⁻' : '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]).join('');
  function sizeLabel(lg) { if (lg <= -34.6) return { num: '1.6', unit: '×10⁻³⁵ m', east: '플랑크 길이' };
    if (lg < -30) { const e = Math.floor(lg), v = Math.pow(10, lg - e); return { num: v.toFixed(2), unit: '×10' + SUP(e) + ' m', east: '' }; }
    let u = SI[SI.length - 1]; for (const s of SI) if (lg >= s[0]) { u = s; break; } const v = Math.pow(10, lg - u[0]);
    const e = EAST[String(Math.floor(lg + 1e-9))] || ''; return { num: v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2), unit: u[1], east: e }; }

  return { LEN, HH, CW, ZN, RB, ZONES, lgAt, sizeLabel, UPS, UP, TABS, PERKS, PK, ACH, RECON_Z, newSave, fix, lvl, pl, achN, stats, cost, perkCost, lockReason, canBuy, buy, buyAll, canPerk, buyPerk,
    reconOpen, crysFor, reconstruct, newRun, cellObjs, TUNE, objY, gap, step, payout, finish, checkAch, gv, zoneOf, hash };
})();
if (typeof module !== 'undefined') module.exports = MCORE;
