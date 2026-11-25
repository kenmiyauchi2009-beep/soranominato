// バランス確認用の自動プレイ。ブラウザのコンソールで
//   const m = await import('./tools/bot.js'); m.runBot(40)
// のように使う（今のセーブは上書きされる）。
export function runBot(days, every = 5) {
  const T = window.T; T.newGame(); const s = T.S; const log = [];
  const TURN = [0, 50, 70, 95];
  const free = () => { for (let r = 0; r < s.land; r++) for (let c = 0; c < 8; c++) if (!s.grid[r * 8 + c]) return [r, c]; return null; };
  const nfree = () => { let n = 0; for (let r = 0; r < s.land; r++) for (let c = 0; c < 8; c++) if (!s.grid[r * 8 + c]) n++; return n; };
  const load = e => { let need = 0; for (const c of [...s.contracts, ...(e ? [e] : [])]) need += c.perDay * (TURN[c.size] + 8); return need / (s.gates.filter(g => g).length * 900); };
  const rwNeed = e => [...s.contracts, ...(e ? [e] : [])].reduce((a, c) => a + c.perDay * 2, 0) / 15;
  const RWCAP = [0, 6, 10, 16, 28], RWCOST = [0, 0, 4000, 20000, 90000], RWR = [0, 0, 2, 3, 4], LANDC = [0, 0, 0, 1500, 6000, 18000, 45000];
  const GC = [0, 500, 2500, 9000];
  const cnt = k => T.C().counts[k] || 0;
  const tryBuild = k => { const p = free(); if (!p) return false; const b = s.money; T.build(p[0], p[1], k); return s.money < b; };
  const FC = { counter: 300, kiosk: 400, bench: 80, plant: 50, toilet: 250, parking: 600, cafe: 1500, souvenir: 2500, lounge: 5000, restaurant: 8000, deck: 10000, station: 25000, ciq: 15000, dutyfree: 30000, hotel: 80000 };
  const RR = { cafe: 2, souvenir: 2, lounge: 2, restaurant: 3, deck: 3, station: 3, ciq: 3, dutyfree: 4, hotel: 5 };
  const ranks = [];
  for (let d = 0; d < days; d++) {
    for (const o of [...s.offers]) if (s.gates.some(g => g >= o.size) && load(o) < .72 && rwNeed(o) < RWCAP[s.runway] * .6 && (!o.intl || cnt('ciq'))) T.acceptOffer(o.id);
    for (let guard = 0; guard < 40; guard++) {
      const res = 300;
      if (rwNeed() > RWCAP[s.runway] * .5 && s.runway < 4 && s.money >= RWCOST[s.runway + 1] && s.rank >= RWR[s.runway + 1]) { s.money -= RWCOST[s.runway + 1]; s.runway++; T.recalc(); continue; }
      if (load() > .6) { const i = s.gates.findIndex(g => g === 0); if (i >= 0 && s.money >= 500) { T.upgradeGate(i); continue; } }
      // 小さいゲートから順に大きく
      const tgt = s.rank >= 3 ? 3 : s.rank >= 2 ? 2 : 1;
      const gi = s.gates.findIndex(g => g > 0 && g < tgt);
      if (gi >= 0 && s.money >= GC[s.gates[gi] + 1] + res * 3) { T.upgradeGate(gi); continue; }
      const peak = s.last ? s.last.peak : 100;
      if (T.C().ccap < peak * 1.1 && s.money >= 300 + res) { if (tryBuild('counter')) continue; }
      if (cnt('ciq') && T.C().ciqCap < peak * .4 && s.money >= 15000) { if (tryBuild('ciq')) continue; }
      if (nfree() < 2 && s.land < 7 && s.money >= LANDC[s.land] + res) { s.money -= LANDC[s.land]; s.land++; T.recalc(); continue; }
      const need = 2 + s.ema.flow / 40;
      if (T.C().comfort < need) { if (s.money >= 250 + res && cnt('toilet') < cnt('bench')) { if (tryBuild('toilet')) continue; } if (s.money >= 80 + res) { if (tryBuild('bench')) continue; } }
      let built = false;
      for (const k of ['kiosk', 'parking', 'cafe', 'souvenir', 'lounge', 'ciq', 'restaurant', 'deck', 'station', 'dutyfree', 'hotel'])
        if (cnt(k) === 0 && s.rank >= (RR[k] || 1) && s.money >= FC[k] + res) { if (tryBuild(k)) { built = true; break; } }
      if (built) continue;
      for (const k of ['kiosk', 'cafe', 'souvenir', 'restaurant', 'dutyfree']) {
        const sh = { kiosk: [.3, 80], cafe: [.22, 60], souvenir: [.15, 50], restaurant: [.14, 50], dutyfree: [.3, 60] }[k];
        if (cnt(k) > 0 && peak * sh[0] > cnt(k) * sh[1] * 1.2 && s.money >= FC[k] * 2) { if (tryBuild(k)) { built = true; break; } }
      }
      if (built) continue;
      break;
    }
    T.day();
    const L = s.last;
    if (!ranks[s.rank]) ranks[s.rank] = d + 1;
    if (d % every === every - 1 || d < 3) log.push(`D${L.day} r${s.rank} ¥${Math.round(s.money)} pax${Math.round(L.pax)} fl${L.flights} can${L.cancels} fee${L.fees} shop${Math.round(L.shop)} up${Math.round(L.upkeep)} rep${L.rep.toFixed(0)} g${s.gates.join('')} rw${s.runway} land${s.land} con${s.contracts.length}`);
    T.startDay();
  }
  log.push('rank days: ' + JSON.stringify(ranks));
  return log.join('\n');
}
