/* v2689 — CADEAUX en grandes tuiles (propriétaire) : Roue de la chance, Invitation (gagne de l'argent), Défi du jour,
   Tournoi démo, Bonus dépôt, Grande jauge. Une seule flèche retour (plus de croix).
   La roue et la jauge sont décidées et payées par le SERVEUR (api.php giftsStatus / wheelSpin, gifts_lib.php) :
   ici on affiche seulement. Décor fixe (aucune animation qui tourne en continu). */
(function (D6) {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var T = {
    fr: { home: 'Cadeaux', wheel: ['Roue de la chance', '1 tour gratuit par 10 $ déposés'], aff: ['Invite tes amis', 'Gagne de l’argent sur leurs dépôts'],
      defi: ['Défi du jour', 'Gagne 5 fois de suite'], top: ['Tournoi démo', 'Les meilleurs de la semaine'], bon: ['Bonus dépôt', '+10 % sur ton dépôt'],
      jauge: ['Grande jauge', 'Remplis-la, gros cadeau à la clé'],
      wRule: '1 tour gratuit pour chaque tranche de 10 $ déposés. Exemple : 100 $ déposés = 10 tours.', spin: 'Tourner la roue', tickets: 'Tu as {n} tour(s) à jouer', ticket1: 'Tu as 1 tour à jouer',
      noTicket: 'Fais un dépôt de 10 $ ou plus pour gagner un tour', deposit: 'Recharger', today: 'Tu as déjà tourné aujourd’hui. Reviens demain !',
      win: '🎉 Bravo ! Tu gagnes {p} $', winS: 'Ajouté à ton solde en bonus (à miser 2 fois avant retrait).', lose: 'Pas de chance cette fois…', loseS: 'Recharge 10 $ ou plus pour un nouveau tour !',
      bonusNote: 'Les gains de la roue sont des bonus : à miser 2 fois avant retrait.', test: 'Mode test (admin) : gains sur la démo.', testDep: '+ dépôt test 10 $',
      jT: 'Ta grande jauge', jS: 'Chaque vrai dépôt remplit ta jauge. Quand elle est pleine, tu reçois un gros cadeau surprise 🎁', jDone: 'Jauges déjà remplies : {n}',
      jNew: '🎉 Jauge pleine ! Ton cadeau est sur ton solde.', jFill: 'Recharger pour la remplir', jNote: 'Le cadeau est un bonus : à miser 2 fois avant retrait.',
      guestT: 'Crée ton compte pour jouer', guestBtn: 'Créer mon compte gratuit', guestHave: 'J’ai déjà un compte', busy: 'Un instant, réessaie.' },
    en: { home: 'Gifts', wheel: ['Lucky wheel', '1 free spin per $10 deposited'], aff: ['Invite your friends', 'Earn money on their deposits'],
      defi: ['Daily challenge', 'Win 5 times in a row'], top: ['Demo tournament', 'The best of the week'], bon: ['Deposit bonus', '+10% on your deposit'],
      jauge: ['Big gauge', 'Fill it up, win a big gift'],
      wRule: '1 free spin for every $10 deposited. Example: $100 deposited = 10 spins.', spin: 'Spin the wheel', tickets: 'You have {n} spin(s) to play', ticket1: 'You have 1 spin to play',
      noTicket: 'Make a deposit of $10 or more to win a spin', deposit: 'Top up', today: 'You already spun today. Come back tomorrow!',
      win: '🎉 Well done! You win ${p}', winS: 'Added to your balance as a bonus (wager 2 times before withdrawal).', lose: 'No luck this time…', loseS: 'Top up $10 or more for a new spin!',
      bonusNote: 'Wheel wins are bonuses: wager 2 times before withdrawal.', test: 'Test mode (admin): wins go to demo.', testDep: '+ test deposit $10',
      jT: 'Your big gauge', jS: 'Every real deposit fills your gauge. When it is full, you get a big surprise gift 🎁', jDone: 'Gauges already filled: {n}',
      jNew: '🎉 Gauge full! Your gift is on your balance.', jFill: 'Top up to fill it', jNote: 'The gift is a bonus: wager 2 times before withdrawal.',
      guestT: 'Create your account to play', guestBtn: 'Create my free account', guestHave: 'I already have an account', busy: 'One moment, try again.' }
  };
  T.zh = Object.assign({}, T.en, { home: '礼物', wheel: ['幸运转盘', '每充值 10 美元送 1 次'], aff: ['邀请好友', '好友充值，你赚钱'],
    defi: ['每日挑战', '连赢 5 次'], top: ['模拟锦标赛', '本周最佳'], bon: ['充值奖励', '充值加送 10%'], jauge: ['大能量条', '充满即得大礼'],
    wRule: '每充值 10 美元送 1 次免费转盘。例如：充值 100 美元 = 10 次。', spin: '转动转盘', tickets: '你有 {n} 次机会', ticket1: '你有 1 次机会',
    noTicket: '充值 10 美元或以上即可获得一次机会', deposit: '充值', today: '今天已经转过了，明天再来！',
    win: '🎉 恭喜！你赢得 {p} 美元', winS: '已作为奖励金加入余额（提现前需投注 2 倍）。', lose: '这次没中…', loseS: '充值 10 美元或以上，再转一次！',
    bonusNote: '转盘奖金为奖励金：提现前需投注 2 倍。', jT: '你的大能量条', jS: '每次真实充值都会充满能量条。充满后，你将获得一份惊喜大礼 🎁', jDone: '已充满次数：{n}',
    jNew: '🎉 能量条已满！礼物已到账。', jFill: '充值来填满它', jNote: '礼物为奖励金：提现前需投注 2 倍。',
    guestT: '创建账户即可参与', guestBtn: '免费创建账户', guestHave: '我已有账户', busy: '请稍后再试。' });
  (D6.LIVE_T = D6.LIVE_T || {}).gifts = T;
  function X() { var l = (document.documentElement.lang || 'fr').slice(0, 2); return T[l] || T.en; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmt(s, o) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return o[k] != null ? o[k] : m; }); }
  function money(v) { v = Number(v) || 0; return v % 1 ? v.toFixed(2).replace('.', (document.documentElement.lang || 'fr').slice(0, 2) === 'fr' ? ',' : '.') : String(v); }
  function guest() { return !(D6.Api && D6.Api.token && D6.Api.token()); }
  function icon(k) { return D6.LiveIcon ? D6.LiveIcon(k) : ''; }
  function color(k) { return D6.LiveColor ? D6.LiveColor(k) : '#7b3be6'; }
  async function call(a) { try { return await D6.Api.post(a, {}, 15000); } catch (e) { return null; } }

  var st = null, sub = '', rot = 0, spinning = false;
  var TILES = [
    { k: 'wheel', ico: 'wheel', big: 1 }, { k: 'defi', ico: 'target' }, { k: 'top', ico: 'record' },
    { k: 'bon', ico: 'bonus' }, { k: 'jauge', ico: 'jauge' }, { k: 'aff', ico: 'invite', big: 2 }
  ];
  function tabOk(k) { var b = document.querySelector('#portalTabs .pt-tab[data-tab="' + k + '"]'); return !!b && !b.classList.contains('hidden'); }
  function visible(k) {
    if (k === 'defi') return true;
    if (k === 'wheel' || k === 'jauge') return guest() || !st || !!st.enabled; // v2706 : affiché tout de suite (plus de tuiles qui arrivent après)
    return tabOk(k);
  }

  /* v2694 (propriétaire) : « immergé » comme le Défi du jour — la roue entière en haut, puis des planètes centrées
     au-dessus de leur titre ; plus de petites phrases sous les titres, plus de cadres. */
  // v2782 (propriétaire) : logos « verre » transparents et légers, les mêmes que dans Social
  var GLASS = { defi: 'target', top: 'record', bon: 'bonus2', jauge: 'jauge', aff: 'invite' };
  function planet(k) {
    if (D6.LiveIcon && GLASS[k]) return '<span class="cs-pl gh-glass">' + D6.LiveIcon(GLASS[k], 'free verre') + '</span>';
    return D6.CasinoArt ? D6.CasinoArt.planet('g_' + k) : icon(k);
  }
  function paintHome() {
    var x = X(), grid = $('ghGrid');
    if (!grid) return;
    grid.className = 'gh-grid gh-imm';
    var list = TILES.filter(function (t) { return visible(t.k); });
    var mids = list.filter(function (t) { return !t.big; });
    grid.innerHTML = list.map(function (t) {
      if (t.k === 'wheel') {
        var pill = st && st.enabled && st.tickets > 0 ? '<i class="gh-pill">' + esc(st.tickets) + '</i>' : '';
        return '<button type="button" class="gh-hero" data-k="wheel"><span class="gh-hero-w"><i class="gh-hero-glow"></i>' + wheelSvg(true) + '<i class="gh-hero-pin"></i></span><b>' + esc(x.wheel[0]) + pill + '</b></button>';
      }
      var last = !t.big && mids.length % 2 && t === mids[mids.length - 1];
      var extra = t.k === 'jauge' && st && st.enabled ? '<span class="gh-mini"><i style="width:' + (st.jauge || 0) + '%"></i></span>' : '';
      return '<button type="button" class="gh-p' + (t.big ? ' wide' : '') + (last ? ' wide' : '') + '" data-k="' + t.k + '">' + planet(t.k) + '<b>' + esc(x[t.k][0]) + '</b><small class="gh-sub">' + esc(x[t.k][1] || '') + '</small>' + extra + '</button>'; // v2764 : une petite phrase explique chaque tuile
    }).join('');
    grid.querySelectorAll('[data-k]').forEach(function (b) { b.addEventListener('click', function () { go(b.getAttribute('data-k')); }); });
  }

  function mode(home) {
    var m = $('portalModal');
    if (!m) return;
    m.classList.toggle('gh-home', home); m.classList.toggle('gh-sub', !home);
    $('ghTitle').textContent = home ? '' : (X()[sub] ? X()[sub][0] : '');
    var box = m.querySelector('.portal-box'); if (box) box.scrollTop = 0;
  }
  function home() { sub = ''; mode(true); paintHome(); hidePages(); }
  function hidePages() { ['ghWheel', 'ghJauge'].forEach(function (id) { if ($(id)) $(id).hidden = true; }); }
  function go(k) {
    sub = k;
    hidePages();
    if (k === 'wheel' || k === 'jauge') {
      if (D6.Portal && D6.Portal.tab) D6.Portal.tab('none');
      mode(false);
      if (k === 'wheel') paintWheel(); else paintJauge();
      return;
    }
    if (k === 'aff' && guest() && D6.Portal && D6.Portal.tab) { D6.Portal.tab('aff'); return; } // visiteur : inscription
    mode(false);
    if (D6.Portal && D6.Portal.tab) D6.Portal.tab(k);
  }

  /* ---------- La roue ---------- */
  var SEGC = { 0: ['#2a1f57', '#3a2a78'], 0.5: ['#3BA7FF', '#2563eb'], 1: ['#22C55E', '#15803d'], 2: ['#14B8A6', '#0f766e'], 3: ['#F59E0B', '#b45309'], 5: ['#F97316', '#c2410c'], 10: ['#EC4899', '#be185d'], 100: ['#FFE07A', '#E39417'], 1000: ['#ff3d6e', '#b0103a'], 10000: ['#111827', '#000'] };
  function segs() { return (st && st.segs) || [0.25, 0.5, 0.25, 5, 0.25, 1, 0.25, 10000, 0.25, 2, 0.25, 10, 0.25, 100, 0.25, 1000]; }
  function pt(r, a) { a = a * Math.PI / 180; return (r * Math.sin(a)).toFixed(2) + ' ' + (-r * Math.cos(a)).toFixed(2); }
  function wheelSvg(mini) {
    var s = segs(), n = s.length, step = 360 / n, out = '', zi = 0;
    for (var i = 0; i < n; i++) {
      var v = s[i], c = SEGC[v] || SEGC[0];
      if (v === 0.25) { c = zi % 2 ? ['#5b3fd0', '#4a2fb8'] : ['#2f7bf0', '#2563eb']; zi++; }
      var a0 = i * step, a1 = (i + 1) * step;
      // v2783 (propriétaire) : sur l'accueil Cadeaux, roue « verre » — cases de couleur transparentes, traits clairs
      out += '<path d="M0 0 L' + pt(118, a0) + ' A118 118 0 0 1 ' + pt(118, a1) + 'Z" fill="' + c[0] + '"' + (mini ? ' fill-opacity=".62" stroke="rgba(255,255,255,.7)" stroke-width="1.6"' : ' stroke="rgba(255,255,255,.18)" stroke-width="1.2"') + '/>';
      if (!mini) {
        var lab = (v < 1 ? (v === 0.25 ? '0,25' : '0,50') : (v >= 10000 ? '10 000' : v >= 1000 ? '1 000' : String(v))) + ' $';
        out += '<g transform="rotate(' + (a0 + step / 2) + ') translate(0 -78)"><text text-anchor="middle" dominant-baseline="middle" transform="rotate(90)" font-size="' + (v >= 10000 ? 13 : v >= 100 ? 16 : 15) + '" font-weight="800" fill="' + (v === 100 ? '#5a3500' : v === 10000 ? '#FFD27A' : '#fff') + '" font-family="Plus Jakarta Sans,system-ui,sans-serif">' + lab + '</text></g>';
      }
    }
    var dots = '';
    for (var d = 0; d < 24; d++) dots += '<circle cx="' + pt(125, d * 15).split(' ')[0] + '" cy="' + pt(125, d * 15).split(' ')[1] + '" r="3.4" fill="' + (d % 2 ? '#FFE07A' : '#fff') + '" stroke="#9A6A00" stroke-width=".8"/>';
    return '<svg viewBox="-134 -134 268 268" class="whl-svg"><defs><radialGradient id="whlRim' + (mini ? 'm' : '') + '" r="1"><stop offset=".86" stop-color="#F5B700"/><stop offset=".93" stop-color="#FFE9A0"/><stop offset="1" stop-color="#9A6A00"/></radialGradient>' +
      '<radialGradient id="whlHub' + (mini ? 'm' : '') + '" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#FFF4C8"/><stop offset=".6" stop-color="#F2B33D"/><stop offset="1" stop-color="#A8650A"/></radialGradient></defs>' +
      (mini ? '<circle r="119" fill="rgba(255,255,255,.05)"/><circle r="126" fill="none" stroke="url(#whlRimm)" stroke-width="13" opacity=".9"/>' : '<circle r="132" fill="url(#whlRim)"/>') + dots + '<g class="whl-segs">' + out + '</g>' +
      '<circle r="118" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="2"/><circle r="24" fill="url(#whlHub' + (mini ? 'm' : '') + ')" stroke="#fff" stroke-opacity=".6" stroke-width="2"/></svg>';
  }
  async function refresh() {
    if (guest()) { st = null; return null; }
    var r = await call('giftsStatus');
    if (r && r.ok !== false) st = r;
    return st;
  }
  function paintWheel(result) {
    var x = X(), box = $('ghWheel');
    box.hidden = false;
    var g = guest(), s = st || {};
    var line = '', btn = '';
    if (g) { line = x.wRule; btn = '<button type="button" class="gh-go" data-a="register">' + esc(x.guestBtn) + '</button><button type="button" class="gh-alt" data-a="login">' + esc(x.guestHave) + '</button>'; }
    else if (s.spunToday) { line = x.today; btn = s.tickets > 0 ? '' : '<button type="button" class="gh-alt" id="ghDep">' + esc(x.deposit) + '</button>'; }
    else if (s.tickets > 0) { line = s.tickets === 1 ? x.ticket1 : fmt(x.tickets, { n: s.tickets }); btn = '<button type="button" class="gh-go gh-spin" id="ghSpin">' + esc(x.spin) + '</button>'; }
    else { line = x.noTicket; btn = '<button type="button" class="gh-go" id="ghDep">' + esc(x.deposit) + '</button>'; }
    var res = '';
    if (result) res = result.prize > 0 ? '<div class="gh-res win"><b>' + esc(fmt(x.win, { p: money(result.prize) })) + '</b><small>' + esc(x.winS) + '</small></div>'
      : '<div class="gh-res"><b>' + esc(x.lose) + '</b><small>' + esc(x.loseS) + '</small></div>';
    box.innerHTML = '<p class="gh-lead">' + esc(x.wRule) + '</p>' +
      '<div class="whl-wrap"><i class="whl-glow"></i><div class="whl-rot" id="ghRot" style="transform:rotate(' + rot + 'deg)">' + wheelSvg(false) + '</div><i class="whl-pin"></i><b class="whl-o">O</b></div>' +
      res + '<p class="gh-line">' + esc(line) + '</p>' + btn +
      (s.test ? '<p class="gh-note">' + esc(x.test) + ' <button type="button" class="gh-link" id="ghTestDep">' + esc(x.testDep) + '</button></p>' : '') +
      '<p class="gh-note">' + esc(x.bonusNote) + '</p>';
    bindCommon(box);
    if ($('ghSpin')) $('ghSpin').addEventListener('click', spin);
  }
  async function spin() {
    if (spinning) return;
    spinning = true;
    var b = $('ghSpin'); if (b) b.disabled = true;
    var r = null;
    try { r = await D6.Api.post('wheelSpin', {}, 15000); } catch (e) { r = null; }
    if (!r || r.ok === false || !r.won) {
      spinning = false;
      if (D6.App && D6.App.toast) D6.App.toast(r && r.reason === 'today' ? X().today : (r && r.reason === 'noTicket' ? X().noTicket : X().busy), 'err');
      await refresh(); paintWheel(); return;
    }
    st = r;
    var n = segs().length, step = 360 / n, c = r.won.seg * step + step / 2;
    rot = rot - (rot % 360) + 360 * 6 + (360 - c);
    var el = $('ghRot');
    if (el) { el.style.transition = 'transform 5.2s cubic-bezier(.12,.72,.12,1)'; el.style.transform = 'rotate(' + rot + 'deg)'; }
    // v2695 : la flèche « pique » sur les cases pendant que la roue tourne, puis ralentit avec elle
    var pin = document.querySelector('#ghWheel .whl-pin');
    if (pin) { pin.classList.add('tick'); setTimeout(function () { pin.classList.add('slow'); }, 3000); setTimeout(function () { pin.classList.remove('tick', 'slow'); }, 5100); }
    setTimeout(function () {
      spinning = false;
      paintWheel(r.won);
      paintHome();
      try { if (D6.App && D6.App.onRemoteAccount) D6.App.onRemoteAccount(); } catch (e) { /* ignore */ }
    }, 5400);
  }

  /* ---------- La grande jauge ---------- */
  function paintJauge() {
    var x = X(), box = $('ghJauge'), s = st || {}, g = guest();
    box.hidden = false;
    var p = g ? 35 : (s.jauge || 0), C = 2 * Math.PI * 92, off = C * (1 - p / 100);
    box.innerHTML = '<p class="gh-lead">' + esc(x.jS) + '</p>' +
      '<div class="jg-wrap"><svg viewBox="0 0 220 220" class="jg-svg"><defs><linearGradient id="jgGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7CE7FF"/><stop offset=".55" stop-color="#9B6BFF"/><stop offset="1" stop-color="#FF7BD9"/></linearGradient></defs>' +
      '<circle cx="110" cy="110" r="92" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="18"/>' +
      '<circle cx="110" cy="110" r="92" fill="none" stroke="url(#jgGrad)" stroke-width="18" stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 110 110)"/></svg>' +
      '<div class="jg-mid"><span class="jg-gift">' + icon('gifts') + '</span><b>' + (g ? '?' : p + ' %') + '</b></div></div>' +
      (s.jaugeNew ? '<div class="gh-res win"><b>' + esc(x.jNew) + '</b></div>' : '') +
      (!g && s.jaugeDone ? '<p class="gh-line">' + esc(fmt(x.jDone, { n: s.jaugeDone })) + '</p>' : '') +
      (g ? '<button type="button" class="gh-go" data-a="register">' + esc(x.guestBtn) + '</button><button type="button" class="gh-alt" data-a="login">' + esc(x.guestHave) + '</button>'
        : '<button type="button" class="gh-go" id="ghDep">' + esc(x.jFill) + '</button>') +
      (s.test ? '<p class="gh-note"><button type="button" class="gh-link" id="ghTestDep">' + esc(x.testDep) + '</button></p>' : '') +
      '<p class="gh-note">' + esc(x.jNote) + '</p>';
    bindCommon(box);
  }

  function bindCommon(box) {
    box.querySelectorAll('[data-a]').forEach(function (b) {
      b.addEventListener('click', function () { if (D6.Portal && D6.Portal.armReturn) D6.Portal.armReturn(); close(); if (D6.App && D6.App.showAuth) D6.App.showAuth(b.getAttribute('data-a')); });
    });
    if ($('ghDep')) $('ghDep').addEventListener('click', function () { close(); if (D6.App && D6.App.openDeposit) D6.App.openDeposit(); });
    if ($('ghTestDep')) $('ghTestDep').addEventListener('click', async function () {
      try { st = await D6.Api.post('giftsTestDeposit', { amount: 10 }, 15000); } catch (e) { /* ignore */ }
      if (sub === 'wheel') paintWheel(); else paintJauge();
      paintHome();
    });
  }
  function close() { var c = $('closePortal'); if (c) c.click(); }

  function boot() {
    var m = $('portalModal'), box = m && m.querySelector('.portal-box');
    if (!box || $('ghGrid')) return;
    var bar = document.createElement('div');
    bar.className = 'gh-bar'; bar.id = 'ghBar';
    bar.innerHTML = '<button type="button" class="gh-back" id="ghBack" aria-label="Back"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button><b id="ghTitle"></b>';
    var head = box.querySelector('.portal-head');
    box.insertBefore(bar, head || box.firstChild);
    var grid = document.createElement('div'); grid.className = 'gh-grid'; grid.id = 'ghGrid';
    var tabs = $('portalTabs');
    box.insertBefore(grid, tabs || null);
    ['ghWheel', 'ghJauge'].forEach(function (id) { var s = document.createElement('section'); s.className = 'gh-page'; s.id = id; s.hidden = true; box.insertBefore(s, tabs || null); });
    var cl = $('closePortal'); if (cl) cl.style.setProperty('display', 'none', 'important');
    $('ghBack').addEventListener('click', function () { if (sub) home(); else close(); });
    // À chaque ouverture de Cadeaux : retour à l'accueil des tuiles + état de la roue relu.
    new MutationObserver(function () {
      var on = m.classList.contains('active');
      if (on && !m._ghOn) { home(); refresh().then(function () { if (!sub) paintHome(); }); }
      m._ghOn = on;
    }).observe(m, { attributes: true, attributeFilter: ['class'] });
    setTimeout(function () { if (!guest()) refresh(); }, 4000); // v2706 : état lu d'avance → Cadeaux s'affiche en entier d'un coup
    document.addEventListener('oro:livepack', function () { if (m.classList.contains('active') && !sub) paintHome(); });
    var lastLang = document.documentElement.lang;
    document.addEventListener('oro:lang', function () { if (document.documentElement.lang === lastLang) return; lastLang = document.documentElement.lang; if (!m.classList.contains('active')) return; if (!sub) paintHome(); else if (sub === 'wheel') paintWheel(); else if (sub === 'jauge') paintJauge(); else mode(false); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  D6.GiftsHome = { home: home, go: go, sub: function () { return sub; } };
})(window.D6 = window.D6 || {});
