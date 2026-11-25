// バランス確認用の自動プレイ。ブラウザのコンソールで
//   const m = await import('./tools/bot.js'); m.runBot(40)
// のように使う（今のセーブは上書きされる）。
export function runBot(days, every = 5) {
  const T = window.T, W = T.api; T.newGame(); const s = T.S; const log = [];
  const TURN = [0, 50, 70, 95];
  const free = zone => { const [a, b] = W.colRange(); for (let r = 1; r < 6; r++) if (W.zoneOf(r) === zone) for (let c = a; c <= b; c++) if (!s.grid[r * 8 + c]) return [r, c]; return null; };
  const load = e => { let need = 0; for (const c of [...s.contracts, ...(e ? [e] : [])]) need += c.perDay * (TURN[c.size] + 8); return need / (s.gates.filter(g => g).length * 900); };
  const rwNeed = e => [...s.contracts, ...(e ? [e] : [])].reduce((a, c) => a + c.perDay * 2, 0) / 15;
  const RWCAP = [0, 6, 10, 16, 28], RWCOST = [0, 0, 4000, 20000, 90000], RWR = [0, 0, 2, 3, 4];
  const GC = [0, 500, 2500, 9000];
  const C = () => W.C, cnt = k => C().counts[k] || 0, FAC = W.FAC;
  const put = (zone, k, extra) => { const p = free(zone); if (!p || s.money < FAC[k].cost || FAC[k].rank > s.rank) return false; const m = s.money; T.build(p[0], p[1], k, extra); W.closeSheet(); return s.money < m; };
  const ranks = [];
  for (let d = 0; d < days; d++) {
    for (const o of [...s.offers]) if (s.gates.some(g => g >= o.size) && load(o) < .72 && rwNeed(o) < RWCAP[s.runway] * .6 && (!o.intl || cnt('ciq'))) { T.acceptOffer(o.id); W.closeSheet(); }
    for (let guard = 0; guard < 50; guard++) {
      const res = 300, L = s.load;
      const lacking = s.contracts.find(c => !C().airCap[c.name]);
      if (lacking && put('land', 'checkin', { air: lacking.name })) continue;
      if ((!C().secCap || L.sec > .85) && put('sec', 'security')) continue;
      if ((!C().bagCap || L.bag > .85) && put('sec', 'baggage')) continue;
      if (L.ci > .85 && put('land', s.rank >= 2 ? 'selfcheck' : 'checkin')) continue;
      if (cnt('ciq') && L.ciq > .85 && put('sec', 'ciq')) continue;
      if (rwNeed() > RWCAP[s.runway] * .5 && s.runway < 4 && s.money >= RWCOST[s.runway + 1] && s.rank >= RWR[s.runway + 1]) { s.money -= RWCOST[s.runway + 1]; s.runway++; T.recalc(); continue; }
      if (load() > .6) {
        const i = s.gates.findIndex((g, i) => g === 0 && W.isOpen(i));
        if (i >= 0 && s.money >= 500) { T.upgradeGate(i); W.closeSheet(); continue; }
        if (i < 0 && s.wings < 2 && s.rank >= W.WING_RANK[s.wings + 1] && s.money >= W.WING_COST[s.wings + 1] + res) { W.buildWing(); continue; }
      }
      const tgt = s.rank >= 3 ? 3 : s.rank >= 2 ? 2 : 1;
      const gi = s.gates.findIndex(g => g > 0 && g < tgt);
      if (gi >= 0 && s.money >= GC[s.gates[gi] + 1] + res * 3) { T.upgradeGate(gi); W.closeSheet(); continue; }
      const need = 2 + s.ema.flow / 40;
      if (W.C.comfort < need && (put('land', 'toilet') || put('air', 'bench'))) continue;
      let built = false;
      for (const k of ['kiosk', 'cafe', 'souvenir', 'lounge', 'restaurant', 'deck', 'dutyfree']) if (!cnt(k) && s.money >= FAC[k].cost + res && put('air', k)) { built = true; break; }
      if (built) continue;
      if (s.rank >= 3 && !cnt('ciq') && s.money >= 15000 + res && put('sec', 'ciq')) continue;
      for (const k of ['parking', 'station', 'hotel']) if (!s.sites[k] && s.rank >= FAC[k].rank && s.money >= FAC[k].cost + res) { W.buildSite(k); W.closeSheet(); built = true; break; }
      if (built) continue;
      break;
    }
    T.day(); W.closeSheet();
    const L = s.last;
    if (!ranks[s.rank]) ranks[s.rank] = d + 1;
    if (d % every === every - 1 || d < 3) log.push(`D${L.day} r${s.rank} ¥${Math.round(s.money)} pax${Math.round(L.pax)} fl${L.flights} can${L.cancels} fee${L.fees} shop${Math.round(L.shop)} rent${L.rent} up${Math.round(L.upkeep)} rep${L.rep.toFixed(0)} g${s.gates.join('')} w${s.wings} rw${s.runway} con${s.contracts.length} load ci${s.load.ci.toFixed(2)} sec${s.load.sec.toFixed(2)} bag${s.load.bag.toFixed(2)}`);
    T.startDay();
  }
  log.push('rank days: ' + JSON.stringify(ranks));
  return log.join('\n');
}
