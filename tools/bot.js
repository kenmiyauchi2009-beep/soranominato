// バランス確認用の自動プレイ。ブラウザのコンソールで
//   const m = await import('./tools/bot.js'); m.runBot(40)
// のように使う（今のセーブは上書きされる）。
export function runBot(days, every = 5) {
  const T = window.T, W = T.api; T.newGame(); const s = T.S; const log = [];
  const TURN = [0, 50, 70, 95, 120], GHMUL = [1, .88, .78, .68];
  const turn = z => Math.round(TURN[z] * GHMUL[s.gh || 0]);
  const ZM = { land: 'p', sec: 's', air: 'd', arr: 'a' };
  const free = (zone, k) => { const z = ZM[zone] || zone, [a, b] = W.colRange(); for (const f of z === 'a' ? [0, 1] : [1, 0]) for (let r = 0; r < 6; r++) for (let c = a; c <= b; c++) if (W.zoneAt(f, r, c) === z && W.canBuildAt(f, r, c, k)) return [f, r, c]; return null; };
  const load = e => { let need = 0; for (const c of [...s.contracts, ...(e ? [e] : [])]) need += c.perDay * (turn(c.size) + 8); return need / (s.gates.filter(g => g).length * 900); };
  const rwNeed = e => [...s.contracts, ...(e ? [e] : [])].reduce((a, c) => a + c.perDay * 2, 0) / 15;
  const RW = W.RUNWAY, GH = W.GH, GC = W.GATE_COST, GR = W.GATE_RANK;
  const C = () => W.C, cnt = k => C().counts[k] || 0, FAC = W.FAC;
  const put = (zone, k, extra) => { const p = free(zone, k); if (!p || s.money < FAC[k].cost || FAC[k].rank > s.rank) return false; const m = s.money; T.build(p[0], p[1], p[2], k, extra); return s.money < m; };
  const lvl = k => { for (let f = 0; f < 2; f++) for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++) { const b = W.cellAt(f, r, c); if (b && b.k === k && (b.lv || 1) < 3 && W.isOpen(c)) { const cost = FAC[k].cost * W.LV_COST[(b.lv || 1) + 1]; if (s.money < cost) return false; W.levelUp(f, r, c); return true; } } return false; };
  const ranks = [], pk = { ci: 0, sec: 0, bag: 0, ciq: 0, flow: 0 };
  for (let d = 0; d < days; d++) {
    // ゲートが混んできたら、ゲート時間あたりの旅客が少ない路線を大きい便に入れ替える
    const eff = c => c.pax / (turn(c.size) + 8);
    for (const o of [...s.offers]) if (o.size >= 3 && s.gates.some(g => g >= o.size) && load(o) >= .72 && (!o.intl || cnt('ciq'))) {
      const worst = [...s.contracts].sort((a, b) => eff(a) - eff(b))[0];
      if (worst && eff(worst) * 1.5 < eff(o)) { W.dropContract(worst.id); W.closeSheet(); }
    }
    for (const o of [...s.offers]) if (s.gates.some(g => g >= o.size) && load(o) < .72 && rwNeed(o) < RW[s.runway].cap * .6 && (!o.intl || cnt('ciq'))) { T.acceptOffer(o.id); W.closeSheet(); }
    for (let guard = 0; guard < 60; guard++) {
      const res = 300 * s.rank, L = pk;
      const lacking = s.contracts.find(c => !C().airCap[c.name]);
      if (lacking && put('land', 'checkin', { air: lacking.name })) continue;
      if ((!C().secCap || L.sec > .85) && (put('sec', 'security') || lvl('security'))) continue;
      if ((!C().bagCap || L.bag > .85) && (put('arr', 'baggage') || lvl('baggage'))) continue;
      if (L.ci > .85 && (put('land', s.rank >= 2 ? 'selfcheck' : 'checkin') || lvl('selfcheck'))) continue;
      if (cnt('ciq') && L.ciq > .85 && (put('sec', 'ciq') || put('arr', 'ciq') || lvl('ciq'))) continue;
      const nr = RW[s.runway + 1];
      if (nr && (rwNeed() > RW[s.runway].cap * .5 || (s.rank >= 4 && s.runway < 4)) && s.money >= nr.cost && s.rank >= nr.rank) { W.upgradeRunway(); W.closeSheet(); continue; }
      if (load() > .6) {
        const i = s.gates.findIndex((g, i) => g === 0 && W.isOpen(i));
        if (i >= 0 && s.money >= GC[1]) { T.upgradeGate(i); W.closeSheet(); continue; }
        if (i < 0 && s.wings < 2 && s.rank >= W.WING_RANK[s.wings + 1] && s.money >= W.WING_COST[s.wings + 1] + res) { W.buildWing(); continue; }
        const ng = GH[(s.gh || 0) + 1];
        if (i < 0 && ng && s.rank >= ng.rank && s.money >= ng.cost + res) { W.upgradeGH(); W.closeSheet(); continue; }
      }
      const tgt = s.rank >= 5 ? 4 : s.rank >= 3 ? 3 : s.rank >= 2 ? 2 : 1;
      const gi = s.gates.findIndex(g => g > 0 && g < tgt && s.rank >= GR[g + 1]);
      if (gi >= 0 && s.money >= GC[s.gates[gi] + 1] + res * 3) { T.upgradeGate(gi); W.closeSheet(); continue; }
      const need = 2 + pk.flow / 40;
      if (W.C.comfort < need && (put('land', 'toilet') || put('air', 'bench') || put('arr', 'bench'))) continue;
      let built = false;
      for (const k of ['kiosk', 'cafe', 'souvenir', 'lounge', 'restaurant', 'deck', 'dutyfree', 'spa', 'museum']) if (!cnt(k) && s.money >= FAC[k].cost + res && put('air', k)) { built = true; break; }
      if (built) continue;
      if (s.rank >= 3 && !cnt('ciq') && s.money >= 15000 + res && put('sec', 'ciq')) continue;
      for (const k of ['parking', 'station', 'hotel']) if (!s.sites[k] && s.rank >= FAC[k].rank && s.money >= FAC[k].cost + res) { W.buildSite(k); W.closeSheet(); built = true; break; }
      if (built) continue;
      const ng = GH[(s.gh || 0) + 1];
      if (ng && s.rank >= ng.rank && s.money >= ng.cost * 1.5) { W.upgradeGH(); W.closeSheet(); continue; }
      break;
    }
    for (const k in pk) pk[k] = 0;
    while (!s.dayOver) { window.stepMinute(); for (const k of ['ci', 'sec', 'bag', 'ciq']) pk[k] = Math.max(pk[k], s.load[k]); pk.flow = Math.max(pk.flow, s.ema.flow); }
    W.closeSheet();
    const L = s.last;
    if (!ranks[s.rank]) ranks[s.rank] = d + 1;
    if (d % every === every - 1 || d < 3) log.push(`D${L.day} r${s.rank} ¥${Math.round(s.money)} pax${Math.round(L.pax)} fl${L.flights} can${L.cancels} fee${L.fees} shop${Math.round(L.shop)} up${Math.round(L.upkeep)} rep${L.rep.toFixed(0)} g${s.gates.join('')} w${s.wings} rw${s.runway} gh${s.gh} con${s.contracts.length} pk ci${pk.ci.toFixed(2)} sec${pk.sec.toFixed(2)} bag${pk.bag.toFixed(2)} ciq${pk.ciq.toFixed(2)}`);
    T.startDay();
  }
  log.push('rank days: ' + JSON.stringify(ranks) + ' missions: ' + Object.keys(s.missions).length);
  return log.join('\n');
}
