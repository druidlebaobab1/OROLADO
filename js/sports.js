/* v2690 — PARIS SPORTIFS (dans le Casino) : matchs créés par l'admin avec ses cotes, COUPON d'1 à 10 matchs
   (les cotes se multiplient), dès 0,10 $, argent réel. Le serveur vérifie tout (api.php spList / spBet / spMine). */
(function (D6) {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var T = {
    fr: { none: 'Pas encore de prédiction. Les prochaines questions arrivent bientôt ici.', coupon: 'Coupon', sel: '{n} sélection(s)', odd: 'Cote', stake: 'Mise', pot: 'Gain possible', bet: 'Parier', clear: 'Vider',
      placed: '✅ Pari enregistré · gain possible {p} $', mine: 'Mes paris', noBets: 'Aucun pari pour l’instant.', open: 'En cours', won: 'Gagné', lost: 'Perdu', void: 'Annulé',
      closed: 'Paris fermés', result: 'Résultat', starts: 'Début', today: 'Aujourd’hui', tomorrow: 'Demain', draw: 'Nul', max10: '10 matchs au maximum dans un coupon.',
      e_min: 'Mise minimum 1 $.', e_max: 'Mise trop élevée pour ce match.', e_maxWin: 'Gain trop élevé : baisse la mise.', e_closed: 'Ce match a déjà commencé.', e_insufficient: 'Solde insuffisant.', e_unavailable: 'Indisponible, réessaie.', e_param: 'Coupon invalide.', e_login: 'Connecte-toi pour parier.', e_busy: 'Un instant…', e_suspended: 'Compte suspendu.',
      myCoupon: 'Mon coupon', clearAll: 'Tout supprimer', confirmClear: 'Sûr ? Touche encore', comboT: 'Combiné :', combo: 'tous tes choix doivent être gagnants. Les cotes se multiplient.', singleT: 'Simple :', single: 'un seul choix.', totalOdd: 'Cote totale', see: 'Voir', minNote: 'Mise minimum 1 $', done: 'Pari enregistré !', cont: 'Continuer', emptySlip: 'Ton coupon est vide. Touche une cote pour commencer.',
      betsTab: 'Paris', guestMine: 'Crée ton compte pour parier : tous tes paris s’afficheront ici, avec leur résultat.', guestBtn: 'Créer mon compte', seeBets: 'Voir les paris', stakeL: 'Mise', oddL: 'Cote', potL: 'Gain possible', wonL: 'Gagné', lostL: 'Perdu', voidL: 'Remboursé', loading: 'Un instant…',
      all: 'Tous', drawCode: 'N', sport: { foot: 'Football', basket: 'Basket', boxe: 'Boxe', tennis: 'Tennis', mma: 'MMA', event: 'Prédictions', crypto: 'Crypto', politique: 'Politique', autre: 'Sport' } },
    en: { none: 'No match right now. Big matches are coming here soon.', coupon: 'Bet slip', sel: '{n} selection(s)', odd: 'Odds', stake: 'Stake', pot: 'Potential win', bet: 'Place bet', clear: 'Clear',
      placed: '✅ Bet placed! Potential win: ${p}', mine: 'My bets', noBets: 'No bet yet.', open: 'Open', won: 'Won', lost: 'Lost', void: 'Void',
      closed: 'Betting closed', result: 'Result', starts: 'Starts', today: 'Today', tomorrow: 'Tomorrow', draw: 'Draw', max10: 'Maximum 10 matches in a slip.',
      e_min: 'Minimum stake $1.', e_max: 'Stake too high for this match.', e_maxWin: 'Win too high: lower the stake.', e_closed: 'This match has already started.', e_insufficient: 'Insufficient balance.', e_unavailable: 'Unavailable, try again.', e_param: 'Invalid slip.', e_login: 'Log in to bet.', e_busy: 'One moment…', e_suspended: 'Account suspended.',
      myCoupon: 'My bet slip', clearAll: 'Remove all', confirmClear: 'Sure? Tap again', comboT: 'Multiple:', combo: 'all your picks must win. The odds multiply.', singleT: 'Single:', single: 'one pick.', totalOdd: 'Total odds', see: 'Open', minNote: 'Minimum stake $1', done: 'Bet placed!', cont: 'Continue', emptySlip: 'Your bet slip is empty. Tap an odd to start.',
      betsTab: 'Bets', guestMine: 'Create your account to bet: all your bets will show here, with their result.', guestBtn: 'Create my account', seeBets: 'See the bets', stakeL: 'Stake', oddL: 'Odds', potL: 'Potential win', wonL: 'Won', lostL: 'Lost', voidL: 'Refunded', loading: 'One moment…',
      all: 'All', drawCode: 'X', sport: { foot: 'Football', basket: 'Basketball', boxe: 'Boxing', tennis: 'Tennis', mma: 'MMA', event: 'Predictions', crypto: 'Crypto', politique: 'Politics', autre: 'Sport' } }
  };
  T.zh = Object.assign({}, T.en, { none: '暂无比赛，重大赛事即将上线。', coupon: '投注单', sel: '已选 {n} 场', odd: '赔率', stake: '投注', pot: '可赢', bet: '确认投注', clear: '清空',
    myCoupon: '我的投注单', clearAll: '全部删除', confirmClear: '确定？再点一次', comboT: '串关：', combo: '所有选择都必须赢，赔率相乘。', singleT: '单关：', single: '只有一个选择。', totalOdd: '总赔率', see: '查看', minNote: '最低投注 1 美元', done: '投注成功！', cont: '继续', emptySlip: '投注单是空的，点击赔率开始。',
    betsTab: '投注', guestMine: '注册后即可投注：你的所有投注和结果都会显示在这里。', guestBtn: '创建账户', seeBets: '查看投注', stakeL: '投注', oddL: '赔率', potL: '可赢', wonL: '已赢', lostL: '输', voidL: '已退款', loading: '请稍候…',
    placed: '✅ 投注成功！可赢：{p} 美元', mine: '我的投注', noBets: '暂无投注。', open: '进行中', won: '赢', lost: '输', void: '取消', closed: '已停止投注', result: '结果', starts: '开始', today: '今天', tomorrow: '明天', draw: '平局',
    sport: { foot: '足球', basket: '篮球', boxe: '拳击', tennis: '网球', mma: '综合格斗', event: '预测', crypto: '加密货币', politique: '政治', autre: '体育' } });
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
    autre: '<path d="M7 4h10v4c0 3-2 5.5-5 5.5S7 11 7 8zM9.5 13.5h5v2.5h-5zM7 18h10v2.5H7z" fill="#FACC15"/>',
    // v2706 : événements
    event: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5" fill="#fff"/><path d="M3.5 7.5a2.5 2.5 0 0 1 2.5-2.5h12a2.5 2.5 0 0 1 2.5 2.5V10h-17z" fill="#EF4444"/><path d="M8 3.2v3.6M16 3.2v3.6" stroke="#334155" stroke-width="1.8" stroke-linecap="round"/><path d="M12 11.6l1.3 2.6 2.9.4-2.1 2 .5 2.8-2.6-1.4-2.6 1.4.5-2.8-2.1-2 2.9-.4z" fill="#F59E0B"/>',
    crypto: '<circle cx="12" cy="12" r="9.5" fill="#F7931A"/><path d="M10 7.2v9.6M12.4 7.2V6M12.4 18v-1.2M9 7.6h4.3c1.5 0 2.5.9 2.5 2.1s-1 2.1-2.5 2.1H9.6m0 0h4.2c1.7 0 2.7.9 2.7 2.2s-1 2.2-2.7 2.2H9" stroke="#fff" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    politique: '<path d="M4 11h16v9.5H4z" fill="#3B82F6"/><path d="M4 11h16v2.5H4z" fill="#1D4ED8"/><rect x="8" y="3.5" width="8" height="9.5" rx="1" fill="#fff" transform="rotate(-8 12 8)"/><path d="M9.6 8.3l1.6 1.6 3.2-3.4" stroke="#16A34A" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="9" y="11" width="6" height="1.4" rx=".7" fill="#0F172A"/>'
  };
  var CRYSTAL = '<svg viewBox="0 0 64 60" aria-hidden="true"><defs><radialGradient id="spCrG" cx="36%" cy="30%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".55" stop-color="#C4B5FD" stop-opacity=".25"/><stop offset="1" stop-color="#8B5CF6" stop-opacity=".12"/></radialGradient></defs><path d="M19 55l4-8h18l4 8z" fill="rgba(139,92,246,.14)" stroke="#A78BFA" stroke-width="2.4" stroke-linejoin="round"/><circle cx="32" cy="26" r="19" fill="url(#spCrG)" stroke="#A78BFA" stroke-width="2.6"/><path d="M22 17a12 12 0 0 1 7-4" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none"/><path d="M37.5 24l1.4 3 3.2.4-2.4 2.2.6 3.2-2.8-1.6-2.8 1.6.6-3.2-2.4-2.2 3.2-.4z" fill="#A78BFA"/></svg>';
  var EVK = { event: 1, crypto: 1, politique: 1 }; // questions (pas d'équipes) : on montre le texte de chaque réponse
  // v2734 : une seule catégorie « Prédictions » (boule de cristal) pour toutes les questions
  SICO.event = '<circle cx="12" cy="10.5" r="7.5" fill="#8B5CF6"/><circle cx="9.5" cy="8" r="2.4" fill="#fff" opacity=".55"/><path d="M14 13l.8 1.6 1.7.2-1.3 1.2.3 1.7-1.5-.8-1.5.8.3-1.7-1.3-1.2 1.7-.2z" fill="#FDE68A"/><path d="M6 19h12l-1.5-2.4h-9z" fill="#B45309"/><rect x="5" y="19" width="14" height="2.6" rx="1" fill="#92400E"/>';
  // v2759 (propriétaire) : un VRAI ballon de foot bien dessiné (pentagone noir au centre + 5 morceaux sur les bords)
  var BALL = (function () {
    var P = function (cx, cy, r, rot) { var s = ''; for (var i = 0; i < 5; i++) { var a = (rot + i * 72) * Math.PI / 180; s += (i ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(2) + ' ' + (cy + r * Math.sin(a)).toFixed(2); } return s + 'Z'; };
    var g = '', seams = '';
    for (var i = 0; i < 5; i++) {
      var a = (-90 + i * 72) * Math.PI / 180, ox = 12 + 10.3 * Math.cos(a), oy = 12 + 10.3 * Math.sin(a);
      g += '<path d="' + P(ox, oy, 3.1, -54 + i * 72) + '"/>';
      seams += 'M' + (12 + 3.9 * Math.cos(a)).toFixed(2) + ' ' + (12 + 3.9 * Math.sin(a)).toFixed(2) + 'L' + (12 + 7.3 * Math.cos(a)).toFixed(2) + ' ' + (12 + 7.3 * Math.sin(a)).toFixed(2);
      var b1 = (-90 + i * 72 - 24) * Math.PI / 180, b2 = (-90 + i * 72 + 24) * Math.PI / 180;
      seams += 'M' + (12 + 7.3 * Math.cos(a)).toFixed(2) + ' ' + (12 + 7.3 * Math.sin(a)).toFixed(2) + 'L' + (12 + 8.4 * Math.cos(b1)).toFixed(2) + ' ' + (12 + 8.4 * Math.sin(b1)).toFixed(2);
      seams += 'M' + (12 + 7.3 * Math.cos(a)).toFixed(2) + ' ' + (12 + 7.3 * Math.sin(a)).toFixed(2) + 'L' + (12 + 8.4 * Math.cos(b2)).toFixed(2) + ' ' + (12 + 8.4 * Math.sin(b2)).toFixed(2);
    }
    return '<defs><radialGradient id="spBallG" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset=".7" stop-color="#EEF0F6"/><stop offset="1" stop-color="#C9CEDC"/></radialGradient><clipPath id="spBallC"><circle cx="12" cy="12" r="10.6"/></clipPath></defs>' +
      '<circle cx="12" cy="12" r="10.6" fill="url(#spBallG)"/><g clip-path="url(#spBallC)" fill="#1F2433">' + '<path d="' + P(12, 12, 3.9, -90) + '"/>' + g + '</g>' +
      '<path d="' + seams + '" stroke="#9AA1B4" stroke-width=".7" stroke-linecap="round" fill="none" clip-path="url(#spBallC)"/><circle cx="12" cy="12" r="10.6" fill="none" stroke="rgba(15,23,42,.35)" stroke-width=".8"/>';
  })();
  SICO.foot = BALL;
  // la catégorie d'une question vient de son image : ballon = Football, Bitcoin = Crypto, drapeau / urne = Politique
  function qKind(e) {
    if (!EVK[e.sport]) return e.sport || 'autre';
    var l = (e.logos || [])[0] || '';
    return l === 'q:ball' ? 'foot' : l === 'q:btc' ? 'crypto' : (l === 'q:us' || l === 'q:vote') ? 'politique' : 'event';
  }
  function sico(k) { return '<svg class="sp-ico" viewBox="0 0 24 24" aria-hidden="true">' + (SICO[k] || SICO.autre) + '</svg>'; }
  var CREST = ['#2563EB', '#DC2626', '#16A34A', '#F59E0B', '#7C3AED', '#0891B2', '#DB2777', '#EA580C'];
  // v2755 : images des questions (Bitcoin, drapeau des États-Unis, ballon, urne…) et logos rangés dans le site
  var QIMG = {
    btc: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#F7931A"/><g transform="rotate(14 16 16)"><path d="M12.2 9.4h5.2c2.1 0 3.6 1.1 3.6 2.9 0 1.3-.8 2.2-1.9 2.5 1.5.3 2.5 1.3 2.5 2.9 0 2.1-1.7 3.3-4 3.3h-5.4zm2.5 2v3.2h2.5c1 0 1.6-.6 1.6-1.6s-.6-1.6-1.6-1.6zm0 5.2v3.4h2.8c1.1 0 1.8-.6 1.8-1.7s-.7-1.7-1.8-1.7z" fill="#fff"/><path d="M14 7.6v2M16.4 7.6v2M14 21v2M16.4 21v2" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></g></svg>',
    us: '<svg viewBox="0 0 38 26"><rect width="38" height="26" rx="3" fill="#fff"/><g fill="#DC2626"><rect y="0" width="38" height="2"/><rect y="4" width="38" height="2"/><rect y="8" width="38" height="2"/><rect y="12" width="38" height="2"/><rect y="16" width="38" height="2"/><rect y="20" width="38" height="2"/><rect y="24" width="38" height="2"/></g><rect width="17" height="14" fill="#1E3A8A"/><g fill="#fff">' + (function () { var s = ''; for (var r = 0; r < 4; r++) for (var c = 0; c < 5; c++) s += '<circle cx="' + (2 + c * 3.2 + (r % 2) * 1.6) + '" cy="' + (2 + r * 3.2) + '" r=".7"/>'; return s; })() + '</g></svg>',
    ball: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#fff" stroke="#CBD5E1"/><path d="M12 6.5l3.6 2.6-1.4 4.3H9.8L8.4 9.1z" fill="#111"/><path d="M12 6.5V2M15.6 9.1l4.3-1.4M14.2 13.4l2.7 3.6M9.8 13.4l-2.7 3.6M8.4 9.1L4.1 7.7" stroke="#111" stroke-width="1.2"/></svg>',
    vote: '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="10" rx="2" fill="#3B82F6"/><rect x="7" y="3" width="10" height="11" rx="1" fill="#fff" transform="rotate(-8 12 8)"/><path d="M9.5 8.3l1.6 1.6 3.2-3.4" stroke="#16A34A" stroke-width="1.6" fill="none"/></svg>'
  };
  QIMG.ball = '<svg viewBox="0 0 24 24">' + BALL + '</svg>';
  function logoHtml(lg, cls) {
    if (!lg) return '';
    if (/^q:[a-z]+$/.test(lg)) return QIMG[lg.slice(2)] ? '<span class="' + cls + ' sp-qsvg">' + QIMG[lg.slice(2)] + '</span>' : '';
    if (/^img\/teams\/[a-z0-9-]+\.png$/.test(lg)) return '<img class="' + cls + '" src="' + lg + '" alt="" loading="lazy">';
    if (/^[a-f0-9]{16}$/.test(lg)) return '<img class="' + cls + '" src="sp-logo.php?k=' + lg + '" alt="" loading="lazy">';
    return '';
  }
  function crest(n, lg) {
    if (lg && /^img\/teams\//.test(lg)) return logoHtml(lg, 'sp-crest sp-logo');
    if (lg && /^[a-f0-9]{16}$/.test(lg)) return '<img class="sp-crest sp-logo" src="sp-logo.php?k=' + lg + '" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'">'; // v2713 : vrai logo
    var h = 0; String(n || '').split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) % 997; }); return '<i class="sp-crest" style="--cc:' + CREST[h % CREST.length] + '">' + esc(String(n || '?').trim().charAt(0).toUpperCase()) + '</i>'; }
  // « Équipe A - Équipe B » / « A vs B » → deux lignes ; sinon le titre tel quel
  function teams(t) { var m = String(t || '').split(/\s+(?:-|–|—|vs\.?|VS|contre)\s+/); return m.length === 2 ? m : null; }
  var flt = 'all';
  var ctx = null, events = [], slip = [], stake = 1, box = null;
  try { stake = Math.max(1, +(localStorage.getItem('oro_sp_stake') || 1)); } catch (e) { /* ignore */ }

  function when(t) {
    var x = X(), d = new Date(t * 1000), now = new Date(), tm = new Date(now.getTime() + 86400000);
    var hm = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (d.toDateString() === now.toDateString()) return x.today + ' · ' + hm;
    if (d.toDateString() === tm.toDateString()) return x.tomorrow + ' · ' + hm;
    return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + hm;
  }
  function inSlip(ev, k) { return slip.some(function (s) { return s.ev === ev && s.k === k; }); }
  function totalOdd() { return Math.floor(slip.reduce(function (a, s) { return a * s.odd; }, 1) * 100 + 1e-6) / 100; } // v2765 : 2,30 reste 2,30

  async function paint(container, c) {
    box = container; ctx = c || {};
    if (!box) return;
    // v2763 (propriétaire) : Paris s'affiche TOUT DE SUITE (dernière liste gardée en mémoire), puis se met à jour en silence
    if (lastList) { events = lastList; render(); }
    var r = await fetchList();
    if (!r) { if (!lastList) { events = []; render(); } return; }
    var same = lastJson === JSON.stringify(r);
    lastList = r; lastJson = JSON.stringify(r);
    if (box !== container || !box.isConnected) return;
    if (!same || !events.length) { events = r; render(); }
  }
  var lastList = null, lastJson = '', fetching = null;
  function fetchList() {
    if (fetching) return fetching;
    fetching = (async function () {
      var r = null;
      try { r = await D6.Api.post('spList', {}, 15000); } catch (e) { r = null; }
      fetching = null;
      return r && r.ok ? (r.events || []) : null;
    })();
    return fetching;
  }
  // pré-chargement discret, 4 s après l'ouverture du site (une seule petite lecture)
  setTimeout(function () { if (D6.Api && D6.Api.post) fetchList().then(function (r) { if (r) { lastList = r; lastJson = JSON.stringify(r); } }); }, 4000);
  // v2765 (propriétaire) : deux onglets en HAUT de la page — « Paris » (les matchs) et « Mes paris » (mes reçus)
  var view = 'list', mineCache = null;
  function tabs() {
    var x = X();
    return '<div class="sp-tabs"><button type="button" data-sv="list" class="' + (view === 'list' ? 'on' : '') + '">' + esc(x.betsTab) + '</button>' +
      '<button type="button" data-sv="mine" class="' + (view === 'mine' ? 'on' : '') + '">' + esc(x.mine) + '</button></div>';
  }
  function bindTabs() {
    box.querySelectorAll('.sp-tabs [data-sv]').forEach(function (b) { b.addEventListener('click', function () { var v = b.getAttribute('data-sv'); if (v === view) return; view = v; render(); }); });
  }
  function when2(t) { var d = new Date(t * 1000); return d.toLocaleDateString([], { day: 'numeric', month: 'short' }) + ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  function receipts(bets) {
    var x = X();
    if (!bets.length) return '<div class="sp-empty sp-mine-empty"><span class="sp-empty-ball">' + CRYSTAL + '</span><b>' + esc(x.noBets) + '</b><button type="button" class="sp-cta" data-sv="list">' + esc(x.seeBets) + '</button></div>';
    var ST = { open: x.open, won: x.won, lost: x.lost, void: x.voidL };
    return bets.map(function (bt) {
      var big = bt.status === 'won' ? '+' + m2(bt.win) + ' $' : bt.status === 'lost' ? '−' + m2(bt.stake) + ' $' : m2(bt.status === 'void' ? bt.stake : bt.pot) + ' $';
      var lab = bt.status === 'won' ? x.wonL : bt.status === 'lost' ? x.lostL : bt.status === 'void' ? x.voidL : x.potL;
      return '<div class="sp-rc ' + esc(bt.status) + '"><div class="sp-rc-h"><i>' + esc(ST[bt.status] || bt.status) + '</i><small>' + esc(bt.at ? when2(bt.at) : '') + '</small></div>' +
        bt.sel.map(function (s) { return '<div class="sp-rc-s ' + (s.r || '') + '"><span>' + esc(s.t) + '</span><em>' + esc(s.l) + ' · ' + Number(s.odd).toFixed(2) + '</em></div>'; }).join('') +
        '<div class="sp-rc-f"><span>' + esc(x.stakeL) + ' <b>' + m2(bt.stake) + ' $</b></span><span>' + esc(x.oddL) + ' <b>' + Number(bt.odd).toFixed(2) + '</b></span><span class="sp-rc-big"><small>' + esc(lab) + '</small><b>' + big + '</b></span></div>' +
        '<div class="sp-rc-id">#' + esc(String(bt.id || '').slice(-8).toUpperCase()) + '</div></div>';
    }).join('');
  }
  async function renderMine() {
    var x = X();
    if (ctx.guest) {
      box.innerHTML = tabs() + '<div class="sp-empty sp-mine-empty"><span class="sp-empty-ball">' + CRYSTAL + '</span><b>' + esc(x.guestMine) + '</b><button type="button" class="sp-cta" id="spMineSign">' + esc(x.guestBtn) + '</button></div>';
      bindTabs(); if ($('spMineSign')) $('spMineSign').addEventListener('click', function () { if (ctx.signup) ctx.signup(); });
      return;
    }
    box.innerHTML = tabs() + '<div class="sp-rcs" id="spRcs">' + (mineCache ? receipts(mineCache) : '<p class="sp-none">' + esc(x.loading) + '</p>') + '</div>';
    bindTabs(); bindRc();
    var r = null; try { r = await D6.Api.post('spMine', {}, 15000); } catch (e) { r = null; }
    if (view !== 'mine' || !$('spRcs')) return;
    if (r && r.ok) { mineCache = r.bets || []; $('spRcs').innerHTML = receipts(mineCache); bindRc(); }
    else if (!mineCache) $('spRcs').innerHTML = '<p class="sp-none">' + esc(x.e_unavailable) + '</p>';
  }
  function bindRc() { box.querySelectorAll('.sp-cta[data-sv]').forEach(function (b) { b.addEventListener('click', function () { view = 'list'; render(); }); }); }
  function render() {
    if (!box) return;
    var x = X();
    if (view === 'mine') { renderMine(); return; }
    if (view === 'slip') { renderSlip(); return; }
    if (!events.length) {
      box.innerHTML = tabs() + '<div class="sp-empty"><span class="sp-empty-ball">' + CRYSTAL + '</span><b>' + esc(x.none) + '</b></div>'; bindTabs(); return;
    }
    // pastilles de sport (seulement les sports qui ont des matchs)
    var kinds = []; events.forEach(function (e) { var k = EVK[e.sport] ? 'event' : (e.sport || 'autre'); if (kinds.indexOf(k) < 0) kinds.push(k); });
    flt = 'all';
    var chips = ''; // v2747 (propriétaire) : plus de filtres foot / basket… — toutes les prédictions ensemble
    box.innerHTML = tabs() + chips + events.filter(function (e) { return flt === 'all' || (EVK[e.sport] ? 'event' : (e.sport || 'autre')) === flt; }).map(function (e) {
      var three = e.opts.length === 3;
      var opts = e.opts.map(function (o, i) {
        var on = inSlip(e.id, o.k), res = e.status === 'settled' && e.result === o.k;
        var code = EVK[e.sport] ? '' : (three ? ['1', x.drawCode || 'N', '2'][i] : (e.opts.length === 2 ? String(i + 1) : ''));
        return '<button type="button" class="sp-o' + (on ? ' on' : '') + (res ? ' res' : '') + '" data-ev="' + esc(e.id) + '" data-k="' + esc(o.k) + '"' + (e.open ? '' : ' disabled') + '><small>' + esc(code || o.label) + '</small><b>' + o.odd.toFixed(2) + '</b></button>';
      }).join('');
      var tm = EVK[e.sport] ? null : teams(e.title);
      var qImg = EVK[e.sport] && e.logos && e.logos[0] !== 'q:ball' ? logoHtml(e.logos[0] || '', 'sp-qimg') : ''; // v2765 : plus de gros ballon
      var head = tm ? '<div class="sp-teams"><p>' + crest(tm[0], (e.logos || [])[0]) + '<span>' + esc(tm[0]) + '</span></p><p>' + crest(tm[1], (e.logos || [])[1]) + '<span>' + esc(tm[1]) + '</span></p></div>' : '<b class="sp-t">' + qImg + esc(e.title) + '</b>';
      return '<div class="sp-ev' + (e.open ? '' : ' shut') + '"><div class="sp-top"><span>' + sico(qKind(e)) + esc((x.sport[qKind(e)] || x.sport.autre) + (e.league ? ' · ' + e.league : '')) + '</span><em>' + esc(e.open ? when(e.start) : (e.status === 'settled' ? x.result : x.closed)) + '</em></div>' +
        head + '<div class="sp-os n' + e.opts.length + (EVK[e.sport] ? ' q' : '') + '">' + opts + '</div></div>';
    }).join('') + slipBar();
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
    bindTabs(); bindSlip();
  }
  /* v2766 (propriétaire) — COUPON comme les grands sites : une barre en bas « Coupon · n choix · cote », qui s'ouvre
     en GRANDE PAGE : chaque choix avec sa croix, « Tout supprimer » (avec confirmation), simple / combiné expliqué,
     mises rapides, gain possible en grand, puis un REÇU après le pari. Mise minimum 1 $ (vérifiée aussi par le serveur). */
  var lastBet = null, clearArm = 0;
  function slipBar() {
    if (!slip.length || view !== 'list') return '';
    var x = X();
    return '<button type="button" class="sp-sbar" id="spSbar"><span class="sp-sbar-n">' + slip.length + '</span><span class="sp-sbar-t"><b>' + esc(x.coupon) + '</b><small>' + esc(fmt(x.sel, { n: slip.length })) + '</small></span>' +
      '<span class="sp-sbar-o"><small>' + esc(x.totalOdd) + '</small><b>' + totalOdd().toFixed(2) + '</b></span><em>' + esc(x.see) + ' ›</em></button>';
  }
  function bindSlip() {
    var b = $('spSbar'); if (b) b.addEventListener('click', function () { view = 'slip'; render(); });
  }
  function renderSlip() {
    var x = X();
    var head = '<div class="sp-cp-h"><button type="button" class="sp-cp-back" id="spCpBack" aria-label="‹">‹</button><b>' + esc(x.myCoupon) + (slip.length ? ' <i>' + slip.length + '</i>' : '') + '</b>' +
      (slip.length ? '<button type="button" class="sp-cp-clear" id="spCpClear">' + esc(x.clearAll) + '</button>' : '<span></span>') + '</div>';
    if (lastBet) {
      var lb = lastBet;
      box.innerHTML = head + '<div class="sp-done"><span class="sp-done-ok">✓</span><b>' + esc(x.done) + '</b><div class="sp-done-r"><span>' + esc(x.stakeL) + ' <b>' + m2(lb.stake) + ' $</b></span><span>' + esc(x.oddL) + ' <b>' + Number(lb.odd).toFixed(2) + '</b></span><span>' + esc(x.potL) + ' <b>' + m2(lb.pot) + ' $</b></span></div>' +
        '<small class="sp-done-id">#' + esc(String(lb.id || '').slice(-8).toUpperCase()) + '</small><button type="button" class="sp-cta" id="spSeeMine">' + esc(x.mine) + '</button><button type="button" class="sp-cta2" id="spCont">' + esc(x.cont) + '</button></div>';
      $('spCpBack').addEventListener('click', function () { lastBet = null; view = 'list'; render(); });
      $('spSeeMine').addEventListener('click', function () { lastBet = null; view = 'mine'; render(); });
      $('spCont').addEventListener('click', function () { lastBet = null; view = 'list'; render(); });
      return;
    }
    if (!slip.length) {
      box.innerHTML = head + '<div class="sp-empty sp-mine-empty"><span class="sp-empty-ball">' + CRYSTAL + '</span><b>' + esc(x.emptySlip) + '</b><button type="button" class="sp-cta" id="spCont">' + esc(x.seeBets) + '</button></div>';
      $('spCpBack').addEventListener('click', function () { view = 'list'; render(); });
      $('spCont').addEventListener('click', function () { view = 'list'; render(); });
      return;
    }
    var odd = totalOdd();
    box.innerHTML = head +
      '<p class="sp-cp-type ' + (slip.length > 1 ? 'combo' : 'single') + '"><b>' + esc(slip.length > 1 ? x.comboT : x.singleT) + '</b> ' + esc(slip.length > 1 ? x.combo : x.single) + '</p>' +
      '<div class="sp-cp-list">' + slip.map(function (z, i) {
        return '<div class="sp-cp-s"><div><small>' + esc(z.t) + '</small><b>' + esc(z.l) + '</b></div><em>' + Number(z.odd).toFixed(2) + '</em><button type="button" class="sp-cp-x" data-i="' + i + '" aria-label="×">×</button></div>';
      }).join('') + '</div>' +
      '<div class="sp-cp-tot"><span>' + esc(x.totalOdd) + '</span><b>' + odd.toFixed(2) + '</b></div>' +
      '<div class="sp-cp-stake"><label>' + esc(x.stakeL) + '</label><div class="sp-cp-in"><input id="spStake" inputmode="decimal" value="' + m2(stake) + '"><span>$</span></div>' +
      '<div class="sp-cp-chips">' + [1, 5, 10, 25].map(function (v) { return '<button type="button" data-v="' + v + '" class="' + (stake === v ? 'on' : '') + '">' + v + ' $</button>'; }).join('') + '</div>' +
      '<small class="sp-cp-min">' + esc(x.minNote) + '</small></div>' +
      '<div class="sp-cp-pot"><span>' + esc(x.potL) + '</span><b id="spPot">' + m2(stake * odd) + ' $</b></div>' +
      '<button type="button" class="sp-cp-go" id="spGo">' + esc(x.bet) + ' · <span id="spGoAmt">' + m2(stake) + ' $</span></button>';
    $('spCpBack').addEventListener('click', function () { view = 'list'; render(); });
    $('spCpClear').addEventListener('click', function () {
      var bt = this;
      if (Date.now() - clearArm > 3000) { clearArm = Date.now(); bt.textContent = x.confirmClear; bt.classList.add('arm'); return; }
      clearArm = 0; slip = []; view = 'list'; render();
    });
    box.querySelectorAll('.sp-cp-x').forEach(function (bt) { bt.addEventListener('click', function () { slip.splice(+bt.getAttribute('data-i'), 1); if (!slip.length) view = 'list'; render(); }); });
    var upd = function () {
      $('spPot').textContent = m2(stake * totalOdd()) + ' $'; $('spGoAmt').textContent = m2(stake) + ' $';
      box.querySelectorAll('.sp-cp-chips [data-v]').forEach(function (c) { c.classList.toggle('on', +c.getAttribute('data-v') === stake); });
    };
    $('spStake').addEventListener('input', function () {
      var v = parseFloat(String(this.value).replace(',', '.')); if (!(v > 0)) return;
      stake = Math.round(v * 100) / 100; try { localStorage.setItem('oro_sp_stake', String(stake)); } catch (e) { /* ignore */ }
      upd();
    });
    box.querySelectorAll('.sp-cp-chips [data-v]').forEach(function (c) { c.addEventListener('click', function () { stake = +c.getAttribute('data-v'); $('spStake').value = m2(stake); try { localStorage.setItem('oro_sp_stake', String(stake)); } catch (e) { /* ignore */ } upd(); }); });
    $('spGo').addEventListener('click', async function () {
      if (ctx.guest) { if (ctx.signup) ctx.signup(); return; }
      if (stake < 1) { if (ctx.toast) ctx.toast(x.e_min); return; }
      var bt = this; if (bt.disabled) return; bt.disabled = true;
      var r = null; try { r = await D6.Api.post('spBet', { mode: 'real', stake: stake, sel: slip.map(function (z) { return { ev: z.ev, k: z.k }; }) }, 15000); } catch (e) { r = null; }
      bt.disabled = false;
      if (!r || !r.ok) { if (ctx.toast) ctx.toast(x['e_' + ((r && r.reason) || 'unavailable')] || x.e_unavailable); return; }
      if (ctx.afterPlay) ctx.afterPlay({ mode: (r.bet && r.bet.mode) || 'real', bal: r.bal, win: 0, stake: r.bet.stake });
      slip = []; mineCache = null; lastBet = r.bet; render();
    });
  }
  D6.Sports = { paint: paint };
})(window.D6 = window.D6 || {});
