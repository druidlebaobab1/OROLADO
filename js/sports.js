/* v2690 — PARIS SPORTIFS (dans le Casino) : matchs créés par l'admin avec ses cotes, COUPON d'1 à 10 matchs
   (les cotes se multiplient), dès 0,10 $, argent réel. Le serveur vérifie tout (api.php spList / spBet / spMine). */
(function (D6) {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var T = {
    fr: { none: 'Pas de match pour le moment. Les grands matchs arrivent bientôt ici.', coupon: 'Coupon', sel: '{n} sélection(s)', odd: 'Cote', stake: 'Mise', pot: 'Gain possible', bet: 'Parier', clear: 'Vider',
      placed: '✅ Pari enregistré ! Gain possible : {p} $', mine: 'Mes paris', noBets: 'Aucun pari pour l’instant.', open: 'En cours', won: 'Gagné', lost: 'Perdu', void: 'Annulé',
      closed: 'Paris fermés', result: 'Résultat', starts: 'Début', today: 'Aujourd’hui', tomorrow: 'Demain', draw: 'Nul', max10: '10 matchs au maximum dans un coupon.',
      e_min: 'Mise minimum 0,10 $.', e_max: 'Mise trop élevée pour ce match.', e_maxWin: 'Gain trop élevé : baisse la mise.', e_closed: 'Ce match a déjà commencé.', e_insufficient: 'Solde insuffisant.', e_unavailable: 'Indisponible, réessaie.', e_param: 'Coupon invalide.', e_login: 'Connecte-toi pour parier.', e_busy: 'Un instant…', e_suspended: 'Compte suspendu.',
      all: 'Tous', drawCode: 'N', sport: { foot: 'Football', basket: 'Basket', boxe: 'Boxe', tennis: 'Tennis', mma: 'MMA', autre: 'Sport' } },
    en: { none: 'No match right now. Big matches are coming here soon.', coupon: 'Bet slip', sel: '{n} selection(s)', odd: 'Odds', stake: 'Stake', pot: 'Potential win', bet: 'Place bet', clear: 'Clear',
      placed: '✅ Bet placed! Potential win: ${p}', mine: 'My bets', noBets: 'No bet yet.', open: 'Open', won: 'Won', lost: 'Lost', void: 'Void',
      closed: 'Betting closed', result: 'Result', starts: 'Starts', today: 'Today', tomorrow: 'Tomorrow', draw: 'Draw', max10: 'Maximum 10 matches in a slip.',
      e_min: 'Minimum stake $0.10.', e_max: 'Stake too high for this match.', e_maxWin: 'Win too high: lower the stake.', e_closed: 'This match has already started.', e_insufficient: 'Insufficient balance.', e_unavailable: 'Unavailable, try again.', e_param: 'Invalid slip.', e_login: 'Log in to bet.', e_busy: 'One moment…', e_suspended: 'Account suspended.',
      all: 'All', drawCode: 'X', sport: { foot: 'Football', basket: 'Basketball', boxe: 'Boxing', tennis: 'Tennis', mma: 'MMA', autre: 'Sport' } }
  };
  T.zh = Object.assign({}, T.en, { none: '暂无比赛，重大赛事即将上线。', coupon: '投注单', sel: '已选 {n} 场', odd: '赔率', stake: '投注', pot: '可赢', bet: '确认投注', clear: '清空',
    placed: '✅ 投注成功！可赢：{p} 美元', mine: '我的投注', noBets: '暂无投注。', open: '进行中', won: '赢', lost: '输', void: '取消', closed: '已停止投注', result: '结果', starts: '开始', today: '今天', tomorrow: '明天', draw: '平局',
    sport: { foot: '足球', basket: '篮球', boxe: '拳击', tennis: '网球', mma: '综合格斗', autre: '体育' } });
  (D6.LIVE_T = D6.LIVE_T || {}).sports = T;
  function X() { var l = (document.documentElement.lang || 'fr').slice(0, 2); return Object.assign({}, T.en, T[l] || {}); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmt(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
  function m2(v) { return (Number(v) || 0).toFixed(2); }
  // v2696 : petites icônes de sport dessinées (plus d'émojis)
  var SICO = {
    foot: '<circle cx="12" cy="12" r="9" fill="#fff"/><path d="M12 7.5l3.2 2.3-1.2 3.8h-4l-1.2-3.8z" fill="#111"/><path d="M12 7.5V3.3M15.2 9.8l3.9-1.3M14 13.6l2.4 3.4M10 13.6l-2.4 3.4M8.8 9.8L4.9 8.5" stroke="#111" stroke-width="1.2"/>',
    basket: '<circle cx="12" cy="12" r="9" fill="#F97316"/><path d="M3 12h18M12 3v18M5.6 5.6c3.6 3.6 3.6 9.2 0 12.8M18.4 5.6c-3.6 3.6-3.6 9.2 0 12.8" stroke="#7C2D12" stroke-width="1.3" fill="none"/>',
    boxe: '<path d="M6 10c0-4 3-6 7-6s6 2.5 6 6v4c0 2-1.5 3.5-3.5 3.5H9.5C7.5 17.5 6 16 6 14z" fill="#DC2626"/><rect x="7" y="17.5" width="10" height="3.5" rx="1" fill="#fff"/><path d="M10 9c1.5-1 3.5-1 5 0" stroke="#fff" stroke-width="1.2" opacity=".7" fill="none"/>',
    tennis: '<circle cx="12" cy="12" r="9" fill="#D9F99D"/><path d="M5 6c3 3 3 9 0 12M19 6c-3 3-3 9 0 12" stroke="#fff" stroke-width="1.6" fill="none"/>',
    mma: '<path d="M5 9c0-3 2.5-5 6-5h2c3.5 0 6 2 6 5v5c0 2-1.5 3.5-3.5 3.5h-7C6.5 17.5 5 16 5 14z" fill="#111827"/><path d="M8 8.5h8M8 11h8" stroke="#FACC15" stroke-width="1.3"/><rect x="7" y="17.5" width="10" height="3.5" rx="1" fill="#FACC15"/>',
    autre: '<path d="M7 4h10v4c0 3-2 5.5-5 5.5S7 11 7 8zM9.5 13.5h5v2.5h-5zM7 18h10v2.5H7z" fill="#FACC15"/>'
  };
  function sico(k) { return '<svg class="sp-ico" viewBox="0 0 24 24" aria-hidden="true">' + (SICO[k] || SICO.autre) + '</svg>'; }
  var CREST = ['#2563EB', '#DC2626', '#16A34A', '#F59E0B', '#7C3AED', '#0891B2', '#DB2777', '#EA580C'];
  function crest(n) { var h = 0; String(n || '').split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) % 997; }); return '<i class="sp-crest" style="--cc:' + CREST[h % CREST.length] + '">' + esc(String(n || '?').trim().charAt(0).toUpperCase()) + '</i>'; }
  // « Équipe A - Équipe B » / « A vs B » → deux lignes ; sinon le titre tel quel
  function teams(t) { var m = String(t || '').split(/\s+(?:-|–|—|vs\.?|VS|contre)\s+/); return m.length === 2 ? m : null; }
  var flt = 'all';
  var ctx = null, events = [], slip = [], stake = 1, box = null;
  try { stake = Math.max(0.1, +(localStorage.getItem('oro_sp_stake') || 1)); } catch (e) { /* ignore */ }

  function when(t) {
    var x = X(), d = new Date(t * 1000), now = new Date(), tm = new Date(now.getTime() + 86400000);
    var hm = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (d.toDateString() === now.toDateString()) return x.today + ' · ' + hm;
    if (d.toDateString() === tm.toDateString()) return x.tomorrow + ' · ' + hm;
    return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + hm;
  }
  function inSlip(ev, k) { return slip.some(function (s) { return s.ev === ev && s.k === k; }); }
  function totalOdd() { return Math.floor(slip.reduce(function (a, s) { return a * s.odd; }, 1) * 100) / 100; }

  async function paint(container, c) {
    box = container; ctx = c || {};
    if (!box) return;
    var r = null;
    try { r = await D6.Api.post('spList', {}, 15000); } catch (e) { r = null; }
    events = (r && r.ok && r.events) || [];
    render();
  }
  function render() {
    if (!box) return;
    var x = X();
    if (!events.length) {
      box.innerHTML = '<div class="sp-empty"><span class="sp-empty-ball">' + (D6.CasinoArt ? D6.CasinoArt.obj('sports') : '') + '</span><b>' + esc(x.none) + '</b></div>' + mineBtn(); bindMine(); return;
    }
    // pastilles de sport (seulement les sports qui ont des matchs)
    var kinds = []; events.forEach(function (e) { var k = e.sport || 'autre'; if (kinds.indexOf(k) < 0) kinds.push(k); });
    if (flt !== 'all' && kinds.indexOf(flt) < 0) flt = 'all';
    var chips = kinds.length > 1 ? '<div class="sp-chips"><button type="button" data-f="all" class="' + (flt === 'all' ? 'on' : '') + '">' + esc(x.all || 'Tous') + '</button>' + kinds.map(function (k) { return '<button type="button" data-f="' + k + '" class="' + (flt === k ? 'on' : '') + '">' + sico(k) + esc(x.sport[k] || x.sport.autre) + '</button>'; }).join('') + '</div>' : '';
    box.innerHTML = chips + events.filter(function (e) { return flt === 'all' || (e.sport || 'autre') === flt; }).map(function (e) {
      var three = e.opts.length === 3;
      var opts = e.opts.map(function (o, i) {
        var on = inSlip(e.id, o.k), res = e.status === 'settled' && e.result === o.k;
        var code = three ? ['1', x.drawCode || 'N', '2'][i] : (e.opts.length === 2 ? String(i + 1) : '');
        return '<button type="button" class="sp-o' + (on ? ' on' : '') + (res ? ' res' : '') + '" data-ev="' + esc(e.id) + '" data-k="' + esc(o.k) + '"' + (e.open ? '' : ' disabled') + '><small>' + esc(code || o.label) + '</small><b>' + o.odd.toFixed(2) + '</b></button>';
      }).join('');
      var tm = teams(e.title);
      var head = tm ? '<div class="sp-teams"><p>' + crest(tm[0]) + '<span>' + esc(tm[0]) + '</span></p><p>' + crest(tm[1]) + '<span>' + esc(tm[1]) + '</span></p></div>' : '<b class="sp-t">' + esc(e.title) + '</b>';
      return '<div class="sp-ev' + (e.open ? '' : ' shut') + '"><div class="sp-top"><span>' + sico(e.sport) + esc((x.sport[e.sport] || x.sport.autre) + (e.league ? ' · ' + e.league : '')) + '</span><em>' + esc(e.open ? when(e.start) : (e.status === 'settled' ? x.result : x.closed)) + '</em></div>' +
        head + '<div class="sp-os n' + e.opts.length + '">' + opts + '</div></div>';
    }).join('') + mineBtn() + slipBar();
    box.querySelectorAll('.sp-chips [data-f]').forEach(function (b) { b.addEventListener('click', function () { flt = b.getAttribute('data-f'); render(); }); });
    box.querySelectorAll('.sp-o').forEach(function (b) {
      b.addEventListener('click', function () {
        var ev = b.getAttribute('data-ev'), k = b.getAttribute('data-k'), e = events.filter(function (z) { return z.id === ev; })[0];
        if (!e || !e.open) return;
        var o = e.opts.filter(function (z) { return z.k === k; })[0];
        var had = inSlip(ev, k);
        slip = slip.filter(function (s) { return s.ev !== ev; }); // un seul choix par match
        if (!had) { if (slip.length >= 10) { if (ctx.toast) ctx.toast(x.max10); return; } slip.push({ ev: ev, k: k, odd: o.odd, t: e.title, l: o.label }); }
        render();
      });
    });
    bindMine(); bindSlip();
  }
  function mineBtn() { return '<button type="button" class="sp-mine" id="spMineBtn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4z"/><path d="M14 6v12" stroke-dasharray="2 2"/></svg>' + esc(X().mine) + '</button><div id="spMine"></div>'; }
  function bindMine() {
    var b = $('spMineBtn'); if (!b) return;
    b.addEventListener('click', async function () {
      var x = X(), out = $('spMine');
      if (ctx.guest) { if (ctx.signup) ctx.signup(); return; }
      if (out.innerHTML) { out.innerHTML = ''; return; }
      var r = null; try { r = await D6.Api.post('spMine', {}, 15000); } catch (e) { r = null; }
      var bets = (r && r.ok && r.bets) || [];
      out.innerHTML = bets.length ? bets.map(function (bt) {
        return '<div class="sp-bt ' + bt.status + '"><div class="sp-bt-h"><b>' + esc(x[bt.status] || bt.status) + '</b><span>' + m2(bt.stake) + ' $ × ' + bt.odd.toFixed(2) + ' = <i>' + m2(bt.status === 'won' ? bt.win : bt.pot) + ' $</i></span></div>' +
          bt.sel.map(function (s) { return '<div class="sp-bt-s ' + (s.r || '') + '"><span>' + esc(s.t) + '</span><em>' + esc(s.l) + ' · ' + s.odd.toFixed(2) + '</em></div>'; }).join('') + '</div>';
      }).join('') : '<p class="sp-none">' + esc(x.noBets) + '</p>';
    });
  }
  function slipBar() {
    if (!slip.length) return '';
    var x = X(), odd = totalOdd();
    return '<div class="sp-slip" id="spSlip"><div class="sp-slip-h"><b>' + esc(x.coupon) + '</b><span>' + esc(fmt(x.sel, { n: slip.length })) + '</span><button type="button" id="spClear">' + esc(x.clear) + '</button></div>' +
      slip.map(function (s) { return '<div class="sp-sl"><span>' + esc(s.t) + '</span><em>' + esc(s.l) + ' · ' + s.odd.toFixed(2) + '</em></div>'; }).join('') +
      '<div class="sp-slip-r"><span>' + esc(x.odd) + ' <b>' + odd.toFixed(2) + '</b></span><label>' + esc(x.stake) + ' <input id="spStake" inputmode="decimal" value="' + m2(stake) + '"></label></div>' +
      '<button type="button" class="cs-go sp-go" id="spGo">' + esc(x.bet) + ' · ' + esc(x.pot) + ' ' + m2(stake * odd) + ' $</button></div>';
  }
  function bindSlip() {
    if (!$('spSlip')) return;
    var x = X();
    $('spClear').addEventListener('click', function () { slip = []; render(); });
    $('spStake').addEventListener('input', function () {
      var v = parseFloat(String(this.value).replace(',', '.')); if (!(v > 0)) return;
      stake = Math.round(v * 100) / 100; try { localStorage.setItem('oro_sp_stake', String(stake)); } catch (e) { /* ignore */ }
      $('spGo').textContent = x.bet + ' · ' + x.pot + ' ' + m2(stake * totalOdd()) + ' $';
    });
    $('spGo').addEventListener('click', async function () {
      if (ctx.guest) { if (ctx.toast) ctx.toast(X().e_login); if (ctx.signup) ctx.signup(); return; }
      var b = this; b.disabled = true;
      var r = null; try { r = await D6.Api.post('spBet', { mode: 'real', stake: stake, sel: slip.map(function (s) { return { ev: s.ev, k: s.k }; }) }, 15000); } catch (e) { r = null; }
      b.disabled = false;
      if (!r || !r.ok) { if (ctx.toast) ctx.toast(x['e_' + ((r && r.reason) || 'unavailable')] || x.e_unavailable); return; }
      if (ctx.toast) ctx.toast(fmt(x.placed, { p: m2(r.bet.pot) }), 'ok');
      if (ctx.afterPlay) ctx.afterPlay({ mode: 'real', bal: r.bal, win: 0, stake: r.bet.stake });
      slip = []; render();
    });
  }
  D6.Sports = { paint: paint };
})(window.D6 = window.D6 || {});
