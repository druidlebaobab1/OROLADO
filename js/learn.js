/**
 * v2454 — Page « Apprendre à trader sur OROLADO » : une longue page qui défile, avec des dessins, dans la langue du joueur
 * (textes : js/learn-txt.js). S'ouvre avec n'importe quel bouton [data-learn-open] (connexion / inscription, conditions).
 * Affichage seulement : aucun envoi au serveur.
 */
(function (D6) {
  'use strict';
  function lang() { try { return (D6.I18N && D6.I18N.lang) || 'fr'; } catch (e) { return 'fr'; } }
  function T(k) {
    var all = D6.LEARN_TXT || {};
    var d = all[lang()] || all.en || {};
    return d[k] != null ? d[k] : ((all.en || {})[k] || '');
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // Petits mots des dessins : repris du site (déjà traduits), sinon en anglais.
  function S(k, fb) { try { var v = D6.I18N && D6.I18N.t ? D6.I18N.t(k) : ''; return v && v !== k ? v : fb; } catch (e) { return fb; } }

  // v2469 — vrais logos dessinés (plus d'images-écriture du téléphone).
  var ICO_P = {
    user: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-3.8 3.6-5.6 7-5.6s6.2 1.8 7 5.6"/><path d="M18 4.5v4M16 6.5h4"/>',
    card: '<rect x="3" y="6" width="18" height="12.5" rx="2.4"/><path d="M3 10h18M6.5 15h4"/>',
    cap: '<path d="M12 4 2.5 8.6 12 13.2l9.5-4.6z"/><path d="M6.5 10.8v4.4c1.4 1.5 3.4 2.3 5.5 2.3s4.1-.8 5.5-2.3v-4.4M21.5 8.6v5"/>',
    chart: '<path d="M3.5 19.5h17"/><path d="M5 15.5l4-4.5 3.2 2.6L18 7.2"/><path d="M14.5 7H18v3.5"/>',
    gift: '<rect x="4" y="10" width="16" height="10" rx="1.6"/><path d="M3 7h18v3H3zM12 7v13M12 7C10.6 4 7 3.6 7 5.6 7 7 9.6 7 12 7zm0 0c1.4-3 5-3.4 5-1.4C17 7 14.4 7 12 7z"/>',
    out: '<rect x="3" y="7" width="15" height="12" rx="2.2"/><path d="M3 10.5h15M14 15h1.5"/><path d="M16 4.5h5v5M21 4.5l-6 6"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.6 6.6 12 12.6l8.4-6"/>',
    check: '<path d="M5 12.5l4.4 4.4L19 7.4"/>',
    eq: '<path d="M6 9.5h12M6 14.5h12"/>',
    cross: '<path d="M7 7l10 10M17 7 7 17"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
    star: '<path d="M12 3.5l2.4 5.3 5.6.6-4.2 3.8 1.2 5.6L12 16l-5 2.8 1.2-5.6L4 9.4l5.6-.6z"/>',
    zin: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5M8 10.5h5M10.5 8v5"/>',
    zout: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5M8 10.5h5"/>',
    full: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>'
  };
  function I(n, cls) { return '<svg class="lg-i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + ICO_P[n] + '</svg>'; }
  var TROPHY = '<svg class="lg-cup" viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="lgCupG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF3C4"/><stop offset=".45" stop-color="#F5C451"/><stop offset="1" stop-color="#B8780C"/></linearGradient></defs><path d="M14 6h20v9a10 10 0 0 1-20 0z" fill="url(#lgCupG)" stroke="#7A4A06" stroke-width="1.4"/><path d="M14 9H8v3a6.5 6.5 0 0 0 7 6.4M34 9h6v3a6.5 6.5 0 0 1-7 6.4" fill="none" stroke="#F5C451" stroke-width="2.6" stroke-linecap="round"/><path d="M24 25v6M17 42h14l-1.6-6H18.6z" fill="url(#lgCupG)" stroke="#7A4A06" stroke-width="1.4" stroke-linejoin="round"/><path d="M19 9.5c.4 3.6 1.6 6 3.6 7.6" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.6" stroke-linecap="round"/><path d="M24 12.2l1.3 2.7 3 .4-2.2 2 .5 3-2.6-1.4-2.6 1.4.5-3-2.2-2 3-.4z" fill="#fff" opacity=".9"/></svg>';
  var UP = '<svg viewBox="0 0 24 24"><path d="M7 17 17 7M9 7h8v8"/></svg>';
  var DN = '<svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 9v8H9"/></svg>';

  // ---------- Dessins ----------
  function artSignup() {
    return '<div class="lg-art lg-phone">' +
      '<div class="lg-f"><span>' + esc(S('name', 'Full name / Nickname')) + '</span><i>Alex</i></div>' +
      '<div class="lg-f"><span>' + esc(S('email', 'E-mail')) + '</span><i>exemple@gmail.com</i></div>' +
      '<div class="lg-f"><span>' + esc(S('password', 'Password')) + '</span><i>••••••••</i></div>' +
      '<div class="lg-f"><span>' + esc(S('confirmPass', 'Confirm password')) + '</span><i>••••••••</i></div>' +
      '<div class="lg-check"><b>' + I('check') + '</b><span>' + esc(S('ageBefore', 'I am over 18 and I accept the ')) + '<u>' + esc(S('termsOfUse', 'terms of use')) + '</u></span></div>' +
      '<div class="lg-gold">' + esc(S('createAccount', 'Create my account')) + '</div>' +
      '<div class="lg-mail"><div class="lg-mail-h">' + I('mail') + ' ' + esc(T('s1code')) + '</div><div class="lg-code">4 8 2 9 1 3</div></div>' +
      '<div class="lg-gold lg-valid">' + I('check') + ' ' + esc(S('otpVerify', 'Verify my account')) + '</div>' +
      '</div>';
  }
  function artDeposit() {
    return '<div class="lg-art lg-row">' +
      '<div class="lg-recharge">+ ' + esc(S('recharge', 'Deposit')) + '</div>' +
      // v2469 — vrais logos (Visa / Mastercard, USDT / BTC / ETH du site) au lieu d'images-écriture.
      '<div class="lg-pay"><span class="wd-card-brands" aria-hidden="true"><span class="wd-visa">VISA</span><span class="wd-mc"></span></span><span>Visa · Mastercard</span></div>' +
      '<div class="lg-pay lg-pay-c"><span class="lg-coins" aria-hidden="true"><svg><use href="#ico-usdt"></use></svg><svg><use href="#ico-btc"></use></svg><svg><use href="#ico-eth"></use></svg></span><span>USDT · BTC · ETH</span></div>' +
      '</div>';
  }
  function artDemo() {
    return '<div class="lg-art lg-row">' +
      '<div class="lg-mode lg-demo"><small>' + esc(S('fsDemo', 'DEMO')) + '</small><b>$ 1 000 000</b></div>' +
      '<div class="lg-mode lg-real"><small>' + esc(S('fsReal', 'REAL')) + '</small><b>$ 25</b></div>' +
      '</div>';
  }
  function candles(n, up) {
    var s = '', y = 60;
    for (var i = 0; i < n; i++) {
      var d = (Math.sin(i * 1.7) * 8) + (up ? -1.6 : 1.6);
      var ny = Math.max(14, Math.min(96, y + d));
      var g = ny < y;
      s += '<rect x="' + (8 + i * 11) + '" y="' + Math.min(y, ny) + '" width="7" height="' + Math.max(3, Math.abs(ny - y)) + '" rx="1" fill="' + (g ? '#22C55E' : '#EF4444') + '"/>';
      y = ny;
    }
    return s;
  }
  function artScreen() {
    return '<div class="lg-art lg-screen">' +
      markets() +
      '<svg class="lg-chart" viewBox="0 0 300 110" preserveAspectRatio="none">' + candles(25, true) +
      '<rect x="244" y="14" width="52" height="15" rx="6" fill="rgba(14,12,40,.86)" stroke="#F5A623"/><text x="270" y="25" fill="#fff" font-size="9" font-weight="800" text-anchor="middle">9 444.40</text></svg>' +
      '</div>';
  }
  // Les 10 marchés : copie des vraies planètes de la barre des marchés (identifiants renommés pour ne pas se mélanger).
  function markets() {
    var h = '<div class="lg-mk">';
    try {
      document.querySelectorAll('#assetBar .asset-chip').forEach(function (c, i) {
        var art = c.querySelector('.mk-art'), nm = c.querySelector('.mk-name');
        if (!art) return;
        var svg = art.innerHTML.replace(/id="([^"]+)"/g, 'id="lg$1"').replace(/url\(#([^)]+)\)/g, 'url(#lg$1)').replace(/href="#([^"]+)"/g, 'href="#lg$1"');
        h += '<div class="lg-mk-i' + (i === 0 ? ' on' : '') + '"><i>' + svg + '</i><small>' + esc(nm ? nm.textContent : '') + '</small></div>';
      });
    } catch (e) { /* ignore */ }
    return h + '</div>';
  }
  function lineChart() {
    var p = 'M0 92', y = 92;
    for (var i = 1; i <= 30; i++) { y = Math.max(12, Math.min(100, y - 2.4 + Math.sin(i * 1.3) * 7)); p += ' L' + (i * 10) + ' ' + y.toFixed(1); }
    return '<svg class="lg-chart lg-chart-s" viewBox="0 0 300 110" preserveAspectRatio="none"><defs><linearGradient id="lgLn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(56,189,248,.45)"/><stop offset="1" stop-color="rgba(56,189,248,0)"/></linearGradient></defs>' +
      '<path d="' + p + ' L300 110 L0 110Z" fill="url(#lgLn)"/><path d="' + p + '" fill="none" stroke="#38BDF8" stroke-width="2.4" stroke-linejoin="round"/></svg>';
  }
  function artChartKinds() {
    return '<div class="lg-art lg-kinds"><div><svg class="lg-chart lg-chart-s" viewBox="0 0 300 110" preserveAspectRatio="none">' + candles(25, true) + '</svg></div><div>' + lineChart() + '</div></div>';
  }
  function artDuration() {
    return '<div class="lg-art lg-row"><div class="lg-dur"><i>‹</i><b>30s</b><i>›</i></div><div class="lg-durlist">5s · 10s · <b>30s</b> · 1min · 5min · 10min</div></div>';
  }
  function artStake() {
    return '<div class="lg-art lg-row"><div class="lg-stake"><i>−</i><b>$ 10</b><i>+</i></div><div class="lg-gain"><b>$ 19</b><small>Payout 90%</small></div></div>';
  }
  function artPayout() {
    return '<div class="lg-art lg-row lg-pls">' +
      // v2470 — comme sur l'écran : en échelle, du plus petit (90 %) au plus grand (5000 %), petit anneau à la base.
      '<div class="lg-pl on" style="--c:251,146,60;--s:40px">90%</div><div class="lg-pl" style="--c:56,189,248;--s:45px">500%</div><div class="lg-pl" style="--c:167,139,250;--s:50px">1000%</div><div class="lg-pl" style="--c:251,191,36;--s:55px">5000%</div></div>';
  }
  function artBuySell() {
    return '<div class="lg-art lg-bs"><div class="lg-b buy"><i>' + UP + '</i><span>' + esc(S('buyShort', 'BUY')) + '</span></div><div class="lg-b sell"><span>' + esc(S('sellShort', 'SELL')) + '</span><i>' + DN + '</i></div></div>';
  }
  function artTrade() {
    return '<div class="lg-art lg-screen"><svg class="lg-chart" viewBox="0 0 300 120" preserveAspectRatio="none">' +
      // v2470 — comme sur l'écran : bande verte près de la ligne, seulement entre l'entrée et l'arrivée, bord en tirets.
      '<defs><linearGradient id="lgZone" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="rgba(0,230,118,.32)"/><stop offset=".45" stop-color="rgba(0,230,118,.12)"/><stop offset="1" stop-color="rgba(0,230,118,0)"/></linearGradient></defs>' +
      '<rect x="160" y="30" width="102" height="32" fill="url(#lgZone)"/><line x1="160" y1="62" x2="262" y2="62" stroke="#00E676" stroke-width="1.6" stroke-dasharray="6 5"/>' +
      candles(18, true) +
      '<line x1="0" y1="62" x2="300" y2="62" stroke="#22C55E" stroke-dasharray="4 4"/>' +
      '<circle cx="160" cy="62" r="6" fill="#16C25E" stroke="#fff"/><path d="M160 58l3.4 6h-6.8z" fill="#fff"/>' +
      '<line x1="262" y1="22" x2="262" y2="120" stroke="#FFE28C" stroke-dasharray="3 4"/>' +
      '<circle cx="262" cy="13" r="8" fill="#F5C451"/><circle cx="262" cy="13" r="4.4" fill="none" stroke="#2A1600" stroke-width="1.4"/><path d="M262 13v-2.8M262 13l2 .6" stroke="#2A1600" stroke-width="1.4"/>' +
      '<circle cx="22" cy="62" r="13" fill="rgba(22,163,74,.6)"/><circle cx="22" cy="62" r="15" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="2.6"/>' +
      '<path d="M22 47 A15 15 0 1 1 9 69.5" fill="none" stroke="#4ADE80" stroke-width="2.6" stroke-linecap="round"/>' +
      '<text x="22" y="65" fill="#fff" font-size="9" font-weight="800" text-anchor="middle">18s</text></svg></div>';
  }
  function artResult() {
    function card(k, ic, amt, lbl) { return '<div class="lg-res ' + k + '"><i>' + ic + '</i><small>' + esc(T(lbl)) + '</small><b>' + amt + '</b></div>'; }
    return '<div class="lg-art lg-row lg-ress">' + card('win', I('check'), '+$ 9.00', 'lWin') + card('tie', I('eq'), '$ 10.00', 'lTie') + card('lose', I('cross'), '−$ 10.00', 'lLose') + '</div>';
  }
  function artTools() {
    return '<div class="lg-art lg-row lg-tools"><span>MA</span><span>BB</span><span>EMA</span><span>' + I('zin') + '</span><span>' + I('zout') + '</span><span class="fs">' + I('full') + '</span></div>';
  }
  // v2463 — vrais logos des 4 cadeaux (les mêmes que les onglets de la fenêtre Cadeaux).
  function gIco(k) { return '<img class="lg-gico" src="icons/ui/gift-' + k + '.svg?v=2463" alt="" aria-hidden="true">'; }
  function artGifts() {
    return '<div class="lg-art lg-row lg-gifts"><div>' + gIco('defi') + '<small>' + esc(S('defiTab', 'Daily challenge')) + '</small></div><div>' + gIco('aff') + '<small>' + esc(S('affTab', 'Invite')) + '</small></div><div>' + gIco('top') + '<small>' + esc(S('topTab', 'Tournament')) + '</small></div><div>' + gIco('bon') + '<small>' + esc(S('bonTab', 'Bonus')) + '</small></div></div>';
  }  // v2463 — les VRAIS logos de l'écran de retrait (copiés de ses cases) : crypto, PayPal, carte, banque, Revolut, Skrill.
  function artWithdraw() {
    var W = ['usdt', 'btc', 'eth', 'bnb', 'paypal', 'card', 'bank', 'revolut', 'skrill'];
    var h = '<div class="lg-art lg-wd"><div class="lg-wd-bal"><small>' + esc(S('wdBalSecure', 'Withdrawable balance')) + '</small><b>$ 120</b></div><div class="lg-wd-cards">';
    W.forEach(function (k) {
      var b = document.querySelector('#withdrawModal .wd-card[data-wd="' + k + '"]');
      if (!b) return;
      h += '<div class="' + esc(b.className) + '">' + b.innerHTML + '</div>';
    });
    return h + '</div><div class="lg-wd-more">' + esc(T('lMore')) + '</div><div class="lg-wd-ok">' + I('check') + ' ' + esc(S('wdConfirmBtn', 'Confirm withdrawal')) + '</div>' +
      '<div class="lg-wd-time">' + I('clock') + ' 24 h max</div></div>';
  }
  function gifts() {
    var G = [[gIco('defi'), 's13b'], [gIco('aff'), 's13c'], [gIco('top'), 's13d'], [gIco('bon'), 's13e']];
    return '<div class="lg-gl">' + G.map(function (g) {
      var t = T(g[1]), k = t.indexOf(':');
      return '<div class="lg-g"><i>' + g[0] + '</i><p>' + (k > 0 ? '<b>' + esc(t.slice(0, k)) + '</b>' + esc(t.slice(k)) : esc(t)) + '</p></div>';
    }).join('') + '</div><div class="lg-ex">' + I('star', 'ex') + ' ' + esc(T('s13f')) + '</div>';
  }

  // Cadres d'importance : 3 = très important, 2 = important, 1 = léger.
  var IMP = { 1: 3, 2: 3, 8: 3, 13: 3, 14: 3, 4: 2, 7: 2, 10: 1 };
  function step(n, title, lines, art, extra) {
    var h = '<section class="lg-step' + (IMP[n] ? ' lg-imp' + IMP[n] : '') + '" id="lgStep' + n + '"><div class="lg-num">' + n + '</div><h3>' + esc(title) + '</h3>';
    if (art) h += art;
    // « 90 % », « 3 $ », « 24 h » ne sont jamais coupés en fin de ligne (iPhone).
    h += '<ul>' + lines.map(function (l) { return '<li>' + esc(l).replace(/(\d) (%|\$|h\b|s\b|min\b)/g, '$1&nbsp;$2').replace(/« /g, '«&nbsp;').replace(/ »/g, '&nbsp;»') + '</li>'; }).join('') + '</ul>';
    if (extra) h += extra;
    return h + '</section>';
  }

  function render() {
    var box = document.getElementById('learnBody');
    if (!box) return;
    var h = '<div class="lg-hero"><div class="lg-hero-ico">' + ICON + '</div><h2>' + esc(T('title')) + '</h2><p>' + esc(T('intro')) + '</p>' +
      '<div class="lg-chips">' + [[1, 'user'], [2, 'card'], [3, 'cap'], [8, 'chart'], [13, 'gift'], [14, 'out']].map(function (c, i) {
        return '<a href="#lgStep' + c[0] + '" data-lg-go="' + c[0] + '">' + I(c[1]) + ' ' + esc(T('n' + (i + 1))) + '</a>';
      }).join('') + '</div></div>';
    h += '<div class="lg-part">' + esc(T('partA')) + '</div>';
    h += step(1, T('s1t'), [T('s1a'), T('s1b'), T('s1c'), T('s1d')], artSignup());
    h += step(2, T('s2t'), [T('s2a'), T('s2b'), T('s2c')], artDeposit());
    h += step(3, T('s3t'), [T('s3a'), T('s3b')], artDemo());
    h += '<div class="lg-part">' + esc(T('partB')) + '</div>';
    h += step(4, T('s4t'), [T('s4a'), T('s4b'), T('s4c'), T('s4d'), T('s4e')], artScreen() + artChartKinds());
    h += step(5, T('s5t'), [T('s5a'), T('s5b')], artDuration());
    h += step(6, T('s6t'), [T('s6a'), T('s6b'), T('s6c'), T('s6d')], artStake(), '<div class="lg-ex">' + I('bulb', 'ex') + ' ' + esc(T('s6e')) + '</div>');
    h += step(7, T('s7t'), [T('s7a'), T('s7b'), T('s7c')], artPayout());
    h += step(8, T('s8t'), [T('s8a'), T('s8b'), T('s8c'), T('s8d'), T('s8e')], artBuySell(), '<div class="lg-ex">' + I('bulb', 'ex') + ' ' + esc(T('s8ex')) + '</div>');
    h += step(9, T('s9t'), [T('s9a'), T('s9b'), T('s9c'), T('s9d'), T('s9e')], artTrade());
    h += step(10, T('s10t'), [T('s10a'), T('s10c'), T('s10d'), T('s10e'), T('s10b')], artResult());
    h += step(11, T('s11t'), [T('s11a'), T('s11b'), T('s11c')], artTools());
    h += step(12, T('s12t'), [T('s12a'), T('s12b'), T('s12c'), T('s12g'), T('s12f'), T('s12e'), T('s12d')], '');
    h += '<div class="lg-part">' + esc(T('partC')) + '</div>';
    h += step(13, T('s13t'), [T('s13a')], artGifts(), gifts());
    h += step(14, T('s14t'), [T('s14a'), T('s14b'), T('s14c'), T('s14d')], artWithdraw());
    h += '<div class="lg-end"><div class="lg-trophy">' + TROPHY + '</div><h3>' + esc(T('endT')) + '</h3><p>' + esc(T('endA')) + '</p>' +
      '<button type="button" class="lg-cta" data-learn-close>' + esc(T('endBtn')) + '</button>' +
      '<p class="lg-sign">© 2026 OROLADO.COM</p></div>';
    box.innerHTML = h;
    var ttl = document.getElementById('learnTitle');
    if (ttl) ttl.textContent = T('title');
  }

  // Icône « apprendre le trading » : chapeau de diplômé sur un livre ouvert avec une courbe qui monte.
  var ICON = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 15c-4.5-3-10.5-3.6-17-2.2v24c6.5-1.4 12.5-.8 17 2.2 4.5-3 10.5-3.6 17-2.2v-24c-6.5-1.4-12.5-.8-17 2.2z" fill="rgba(255,255,255,.14)" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><path d="M24 15v24" stroke="#fff" stroke-width="2"/><path d="M10 31l4-4 3 2 4-6" fill="none" stroke="#4ADE80" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M28 32l3-5 3 2 5-7" fill="none" stroke="#4ADE80" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M24 3 10 9l14 6 14-6z" fill="#FBBF24" stroke="#7A4A06" stroke-width="1.2" stroke-linejoin="round"/><path d="M36 10v6" stroke="#FBBF24" stroke-width="1.8" stroke-linecap="round"/><circle cx="36" cy="17" r="1.6" fill="#FBBF24"/></svg>';
  D6.LEARN_ICON = ICON;

  function ensure() {
    var m = document.getElementById('learnModal');
    if (m) return m;
    m = document.createElement('div');
    m.id = 'learnModal';
    m.className = 'learn-modal';
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
    m.innerHTML = '<div class="lg-top"><div class="lg-top-ico">' + ICON + '</div><div class="lg-top-t" id="learnTitle"></div>' +
      '<button type="button" class="btn-close lg-close" data-learn-close aria-label="Close"><svg class="x-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '<div class="lg-progress"><i id="learnProg"></i></div></div><div class="lg-scroll" id="learnScroll"><div class="lg-body" id="learnBody"></div></div>';
    document.body.appendChild(m);
    var sc = m.querySelector('#learnScroll');
    sc.addEventListener('scroll', function () {
      var p = sc.scrollHeight > sc.clientHeight ? sc.scrollTop / (sc.scrollHeight - sc.clientHeight) : 1;
      var bar = document.getElementById('learnProg');
      if (bar) bar.style.width = Math.round(p * 100) + '%';
    }, { passive: true });
    return m;
  }
  function open() {
    var m = ensure();
    render();
    m.setAttribute('dir', document.documentElement.getAttribute('dir') || 'ltr');
    m.classList.add('on');
    document.documentElement.classList.add('learn-on');
    var sc = document.getElementById('learnScroll');
    if (sc) sc.scrollTop = 0;
    var bar = document.getElementById('learnProg');
    if (bar) bar.style.width = '0%';
  }
  function close() {
    var m = document.getElementById('learnModal');
    if (m) m.classList.remove('on');
    document.documentElement.classList.remove('learn-on');
  }
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target : null;
    if (!t) return;
    if (t.closest('[data-learn-open]')) { e.preventDefault(); open(); return; }
    if (t.closest('[data-learn-close]')) { e.preventDefault(); close(); return; }
    var go = t.closest('[data-lg-go]');
    if (go) {
      e.preventDefault();
      var el = document.getElementById('lgStep' + go.getAttribute('data-lg-go')), sc = document.getElementById('learnScroll');
      if (el && sc) sc.scrollTo({ top: el.offsetTop - 18, behavior: 'smooth' });
    }
    // v2469 — écouté AVANT les fenêtres (phase de capture) : sur Android, les fenêtres (Conditions, Aide…) arrêtent
    // les clics à l'intérieur ; le bouton « Apprendre à trader » des Conditions ne répondait donc pas.
  }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.documentElement.classList.contains('learn-on')) close(); });
  document.addEventListener('oro:lang', function () { if (document.documentElement.classList.contains('learn-on')) render(); });
  D6.Learn = { open: open, close: close };
})(window.D6 = window.D6 || {});
