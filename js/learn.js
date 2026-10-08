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

  var UP = '<svg viewBox="0 0 24 24"><path d="M7 17 17 7M9 7h8v8"/></svg>';
  var DN = '<svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 9v8H9"/></svg>';

  // ---------- Dessins ----------
  function artSignup() {
    return '<div class="lg-art lg-phone">' +
      '<div class="lg-f"><span>' + esc(S('name', 'Full name / Nickname')) + '</span><i>Alex</i></div>' +
      '<div class="lg-f"><span>' + esc(S('email', 'E-mail')) + '</span><i>exemple@gmail.com</i></div>' +
      '<div class="lg-f"><span>' + esc(S('password', 'Password')) + '</span><i>••••••••</i></div>' +
      '<div class="lg-f"><span>' + esc(S('confirmPass', 'Confirm password')) + '</span><i>••••••••</i></div>' +
      '<div class="lg-check"><b>✓</b><span>' + esc(S('ageBefore', 'I am over 18 and I accept the ')) + '<u>' + esc(S('termsOfUse', 'terms of use')) + '</u></span></div>' +
      '<div class="lg-gold">' + esc(S('createAccount', 'Create my account')) + '</div>' +
      '<div class="lg-mail"><div class="lg-mail-h">✉ ' + esc(T('s1code')) + '</div><div class="lg-code">4 8 2 9 1 3</div></div>' +
      '<div class="lg-gold lg-valid">✓ ' + esc(S('otpVerify', 'Verify my account')) + '</div>' +
      '</div>';
  }
  function artDeposit() {
    return '<div class="lg-art lg-row">' +
      '<div class="lg-recharge">+ ' + esc(S('recharge', 'Deposit')) + '</div>' +
      '<div class="lg-pay"><b>💳</b><span>Visa · Mastercard</span></div>' +
      '<div class="lg-pay lg-pay-c"><b>₿</b><span>USDT · BTC · ETH</span></div>' +
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
        var svg = art.innerHTML.replace(/id="([^"]+)"/g, 'id="lg$1"').replace(/url\(#([^)]+)\)/g, 'url(#lg$1)');
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
      '<div class="lg-pl on" style="--c:251,146,60">90%</div><div class="lg-pl" style="--c:56,189,248">500%</div><div class="lg-pl" style="--c:167,139,250">1000%</div><div class="lg-pl" style="--c:251,191,36">5000%</div></div>';
  }
  function artBuySell() {
    return '<div class="lg-art lg-bs"><div class="lg-b buy"><i>' + UP + '</i><span>' + esc(S('buyShort', 'BUY')) + '</span></div><div class="lg-b sell"><span>' + esc(S('sellShort', 'SELL')) + '</span><i>' + DN + '</i></div></div>';
  }
  function artTrade() {
    return '<div class="lg-art lg-screen"><svg class="lg-chart" viewBox="0 0 300 120" preserveAspectRatio="none">' +
      '<rect x="0" y="0" width="300" height="62" fill="rgba(34,197,94,.14)"/>' +
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
    return '<div class="lg-art lg-row lg-ress">' + card('win', '✓', '+$ 9.00', 'lWin') + card('tie', '=', '$ 10.00', 'lTie') + card('lose', '✕', '−$ 10.00', 'lLose') + '</div>';
  }
  function artTools() {
    return '<div class="lg-art lg-row lg-tools"><span>MA</span><span>BB</span><span>EMA</span><span>＋</span><span>－</span><span class="fs">⛶</span></div>';
  }
  function artGifts() {
    return '<div class="lg-art lg-row lg-gifts"><div><i>🎯</i><small>' + esc(S('defiTab', 'Daily challenge')) + '</small></div><div><i>✉️</i><small>' + esc(S('affTab', 'Invite')) + '</small></div><div><i>🏆</i><small>' + esc(S('topTab', 'Tournament')) + '</small></div><div><i>🎁</i><small>' + esc(S('bonTab', 'Bonus')) + '</small></div></div>';
  }
  function artWithdraw() {
    var M = [
      ['c-btc', '₿', 'Bitcoin'], ['c-usdt', '₮', 'USDT'], ['c-eth', 'Ξ', 'Ethereum'],
      ['c-pp', '<b>P</b>', 'PayPal'], ['c-visa', 'VISA', 'Visa'], ['c-mc', '<span></span><span></span>', 'Mastercard'],
      ['c-bank', '🏦', 'Bank'], ['c-rev', 'R', 'Revolut'], ['c-sk', 'S', 'Skrill']
    ];
    var h = '<div class="lg-art lg-wd"><div class="lg-wd-bal"><small>' + esc(S('wdBalSecure', 'Withdrawable balance')) + '</small><b>$ 120</b></div><div class="lg-wd-logos">';
    M.forEach(function (m) { h += '<i class="' + m[0] + '" title="' + m[2] + '">' + m[1] + '</i>'; });
    return h + '</div><div class="lg-wd-more">' + esc(T('lMore')) + '</div><div class="lg-wd-ok">✓ ' + esc(S('wdConfirmBtn', 'Confirm withdrawal')) + '</div>' +
      '<div class="lg-wd-time">⏱ 24 h max</div></div>';
  }

  function gifts() {
    var G = [['🎯', 's13b'], ['✉️', 's13c'], ['🏆', 's13d'], ['🎁', 's13e']];
    return '<div class="lg-gl">' + G.map(function (g) {
      var t = T(g[1]), k = t.indexOf(':');
      return '<div class="lg-g"><i>' + g[0] + '</i><p>' + (k > 0 ? '<b>' + esc(t.slice(0, k)) + '</b>' + esc(t.slice(k)) : esc(t)) + '</p></div>';
    }).join('') + '</div><div class="lg-ex">✨ ' + esc(T('s13f')) + '</div>';
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
      '<div class="lg-chips">' + [[1, '📝'], [2, '💳'], [3, '🎓'], [8, '📈'], [13, '🎁'], [14, '💸']].map(function (c, i) {
        return '<a href="#lgStep' + c[0] + '" data-lg-go="' + c[0] + '">' + c[1] + ' ' + esc(T('n' + (i + 1))) + '</a>';
      }).join('') + '</div></div>';
    h += '<div class="lg-part">' + esc(T('partA')) + '</div>';
    h += step(1, T('s1t'), [T('s1a'), T('s1b'), T('s1c'), T('s1d')], artSignup());
    h += step(2, T('s2t'), [T('s2a'), T('s2b'), T('s2c')], artDeposit());
    h += step(3, T('s3t'), [T('s3a'), T('s3b')], artDemo());
    h += '<div class="lg-part">' + esc(T('partB')) + '</div>';
    h += step(4, T('s4t'), [T('s4a'), T('s4b'), T('s4c'), T('s4d'), T('s4e')], artScreen() + artChartKinds());
    h += step(5, T('s5t'), [T('s5a'), T('s5b')], artDuration());
    h += step(6, T('s6t'), [T('s6a'), T('s6b'), T('s6c'), T('s6d')], artStake(), '<div class="lg-ex">💡 ' + esc(T('s6e')) + '</div>');
    h += step(7, T('s7t'), [T('s7a'), T('s7b'), T('s7c')], artPayout());
    h += step(8, T('s8t'), [T('s8a'), T('s8b'), T('s8c'), T('s8d'), T('s8e')], artBuySell(), '<div class="lg-ex">💡 ' + esc(T('s8ex')) + '</div>');
    h += step(9, T('s9t'), [T('s9a'), T('s9b'), T('s9c'), T('s9d'), T('s9e')], artTrade());
    h += step(10, T('s10t'), [T('s10a'), T('s10c'), T('s10d'), T('s10e'), T('s10b')], artResult());
    h += step(11, T('s11t'), [T('s11a'), T('s11b'), T('s11c')], artTools());
    h += step(12, T('s12t'), [T('s12a'), T('s12b'), T('s12c'), T('s12g'), T('s12f'), T('s12e'), T('s12d')], '');
    h += '<div class="lg-part">' + esc(T('partC')) + '</div>';
    h += step(13, T('s13t'), [T('s13a')], artGifts(), gifts());
    h += step(14, T('s14t'), [T('s14a'), T('s14b'), T('s14c'), T('s14d')], artWithdraw());
    h += '<div class="lg-end"><div class="lg-trophy">🏆</div><h3>' + esc(T('endT')) + '</h3><p>' + esc(T('endA')) + '</p>' +
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
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.documentElement.classList.contains('learn-on')) close(); });
  document.addEventListener('oro:lang', function () { if (document.documentElement.classList.contains('learn-on')) render(); });
  D6.Learn = { open: open, close: close };
})(window.D6 = window.D6 || {});
