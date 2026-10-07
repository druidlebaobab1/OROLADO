(function (D6) {
  'use strict';
  // v2409 — Le Portail OROLADO (bouton fenêtre en haut) : le Défi (5 victoires d'affilée).
  // Tout est décidé par le serveur (api.php defiStatus / defiActivate, defi_lib.php) ; ici on
  // affiche seulement. Invisible tant que le serveur ne dit pas « enabled » (admin pendant les tests).
  var state = null;
  var pollT = 0;
  var tickT = 0;
  var lastWonRef = '';

  function $(id) { return document.getElementById(id); }
  function t(k, vars) {
    var s = (D6.I18N && D6.I18N.t) ? D6.I18N.t(k) : k;
    if (vars) Object.keys(vars).forEach(function (n) { s = String(s).split('{' + n + '}').join(vars[n]); });
    return s;
  }
  function loggedIn() {
    var u = D6.Auth && D6.Auth.current && D6.Auth.current();
    return !!(u && !u.guest && D6.Api && D6.Api.token && D6.Api.token());
  }
  function marketName(id) {
    var a = D6.CONFIG && D6.CONFIG.ASSETS && D6.CONFIG.ASSETS[id];
    return (a && (a.name || a.short)) || String(id || '').toUpperCase();
  }
  function money(n) {
    var v = Math.round(Number(n || 0) * 100) / 100;
    return v.toLocaleString(undefined, { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' $';
  }
  function left(sec) {
    sec = Math.max(0, Math.floor(sec));
    var d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    if (d > 0) return d + t('defiD') + ' ' + String(h).padStart(2, '0') + t('defiH') + ' ' + String(m).padStart(2, '0') + t('defiM');
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }
  var skew = 0;

  function show(el, on) { if (el) el.classList.toggle('hidden', !on); }

  function portalOpen() { var m = document.getElementById('portalModal'); return !!(m && m.classList.contains('active')); }
  function openPortal() {
    var m = $('portalModal');
    if (!m) return;
    m.classList.add('active');
    m.style.removeProperty('visibility');
    m.style.setProperty('display', 'block', 'important');
    m.style.setProperty('pointer-events', 'auto', 'important');
    refresh();
    if (D6.Portal && D6.Portal.refreshAff) { D6.Portal.refreshAff(); D6.Portal.refreshBon(); }
    setTimeout(function () { sky(true); }, 30);
  }
  function closePortal() {
    var m = $('portalModal');
    if (!m) return;
    m.classList.remove('active');
    m.style.setProperty('display', 'none', 'important');
    m.style.setProperty('pointer-events', 'none', 'important');
    m.style.setProperty('visibility', 'hidden', 'important');
  }

  // v2415 — visiteur NON inscrit : la case dorée « Cadeaux » s'affiche et invite à créer un compte.
  // Seulement quand les cadeaux sont ouverts à tous (CONFIG.GIFTS_PUBLIC), ou en aperçu : orolado.com/?cadeaux=1.
  (function () {
    try { if (/[?&]cadeaux=1(?:&|$)/.test(location.search || '')) sessionStorage.setItem('oro_gift_prev', '1'); } catch (e) { /* ignore */ }
  })();
  function nextMonday() {
    var d = new Date(); d.setUTCHours(0, 0, 0, 0);
    var add = (8 - (d.getUTCDay() || 7)) % 7 || 7;
    return Math.floor(d.getTime() / 1000) + add * 86400 - 1;
  }
  // Visiteur qui veut agir : on ferme et on ouvre l'inscription. Renvoie true si c'était un visiteur.
  function needAccount() {
    if (!guestGift()) return false;
    closePortal();
    var b = document.getElementById('btnGoRegister');
    if (b) b.click();
    return true;
  }
  function guestGift() {
    if (loggedIn()) return false;
    var pub = !!(D6.CONFIG && D6.CONFIG.GIFTS_PUBLIC);
    try { if (sessionStorage.getItem('oro_gift_prev') === '1') pub = true; } catch (e) { /* ignore */ }
    return pub;
  }

  function render() {
    var s = state;
    var guest = guestGift();
    var on = !!(s && s.enabled) || guest;
    show($('btnPortal'), on);
    if (!on || guest) hud(null);
    document.documentElement.classList.toggle('portal-on', on);
    document.documentElement.classList.toggle('gift-guest-on', guest);
    layoutTopbar(on);
    show($('defiChip'), false);
    show($('giftGuest'), false);
    if ($('portalModal')) $('portalModal').classList.toggle('is-guest', guest);
    // v2416 — visiteur : il voit TOUTES les pages (exemple du défi, invitation, tournoi) ; chaque bouton
    // d'action lui demande de créer un compte (needAccount).
    if (guest) {
      s = { enabled: true, active: false, canActivate: true, market: 'v100', streak: 0, need: 5, guest: true };
      if (!aff || !aff.guest) aff = { enabled: true, guest: true, code: '', clicks: 0, friends: 0, deposited: 0, played: 0, total: 0, earned: 0, list: [] };
      if (!top || !top.guest) top = { enabled: true, guest: true, top: [], me: { need: 20, rank: 0, points: 0 }, endsAt: nextMonday(), show: 25 };
      if (!bon || !bon.guest) bon = { enabled: true, guest: true, phase: 'off', weekEnd: nextMonday() };
      setTimeout(function () { renderAff(); renderTop(); renderBon(); }, 0);
    }
    if (!on) return;
    // Progression du défi affichée SUR la maison (« 3/5 ») : aucune pastille sur le graphique.
    var prog = $('btnPortal').querySelector('.pw-prog');
    if (!prog) { prog = document.createElement('span'); prog.className = 'pw-prog'; $('btnPortal').appendChild(prog); }
    prog.textContent = s.active ? (s.streak || 0) + '/' + (s.need || 5) : '';
    $('btnPortal').classList.toggle('has-prog', !!s.active);
    var mk = marketName(s.market);
    $('defiMarket').textContent = mk;
    $('defiRule').textContent = t('defiRule', { m: mk });
    var dots = $('defiDots').children;
    for (var i = 0; i < dots.length; i++) dots[i].classList.toggle('on', i < (s.streak || 0));
    drawRing(s.streak || 0, s.need || 5);
    $('defiGlobe').innerHTML = globeHtml(s.market);
    $('defiCount').textContent = (s.streak || 0) + ' / ' + (s.need || 5);
    var now = Date.now() / 1000 + skew;
    var st = $('defiState'), act = $('defiActivate'), go = $('defiTrade'), tm = $('defiTimer');
    if (s.active) {
      tm.innerHTML = ICO_CLOCK + '<span></span>';
      tm.lastChild.textContent = left(s.expiresAt - now);
      st.textContent = '';
      st.className = 'defi-state';
      show(act, false);
      go.textContent = t('defiContinue', { m: mk });
      show(go, true);
    } else if (s.won && !s.canActivate) {
      tm.textContent = '';
      st.innerHTML = ICO_TROPHY + '<span></span>';
      st.lastChild.textContent = t('defiWonMsg', { r: money(s.reward) }) + ' · ' + t('defiNext') + ' ' + left(s.expiresAt - now);
      st.className = 'defi-state won';
      show(act, false);
      show(go, false);
    } else {
      tm.textContent = '';
      st.textContent = s.finished && !s.won ? t('defiLost') + ' ' + left(s.expiresAt - now) : '';
      st.className = 'defi-state' + (s.finished && !s.won ? ' lost' : '');
      st.className = 'defi-state';
      act.textContent = t('defiStart', { m: mk });
      show(act, !!s.canActivate);
      show(go, false);
    }
    hud(s);
  }

  // Le globe du marché : le même dessin que sur les cases des marchés du site.
  function globeHtml(id) {
    try {
      var chip = document.querySelector('.asset-chip[data-asset="' + id + '"]');
      var art = chip && chip.querySelector('.mk-art');
      if (art && art.querySelector('svg')) {
        var cs = getComputedStyle(chip);
        var p1 = (cs.getPropertyValue('--p1') || '').trim() || '#C9B8FF';
        var p2 = (cs.getPropertyValue('--p2') || '').trim() || '#3B1D8F';
        var pg = (cs.getPropertyValue('--pg') || '').trim() || 'rgba(167,139,250,.45)';
        // v2419 — les dégradés du dessin sont renommés (sinon ils pointent vers une copie cachée → logo gris).
        var html = art.innerHTML.replace(/id="([^"]+)"/g, 'id="$1_pg"').replace(/url\(#([^)]+)\)/g, 'url(#$1_pg)').replace(/href="#([^"]+)"/g, 'href="#$1_pg"');
        return '<span class="hc-globe" style="--p1:' + p1 + ';--p2:' + p2 + ';--pg:' + pg + '">' + html + '</span>';
      }
    } catch (e) { /* ignore */ }
    return '';
  }

  // Anneau de 5 arcs autour du globe : chaque victoire allume un arc doré.
  function drawRing(n, need) {
    var g = $('defiRing');
    if (!g) return;
    var out = '', R = 54, cx = 60, cy = 60, gap = 7;
    for (var i = 0; i < need; i++) {
      var a0 = (-90 + i * 360 / need + gap / 2) * Math.PI / 180;
      var a1 = (-90 + (i + 1) * 360 / need - gap / 2) * Math.PI / 180;
      var x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0), x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1);
      out += '<path class="' + (i < n ? 'on' : '') + '" d="M' + x0.toFixed(2) + ' ' + y0.toFixed(2) + ' A' + R + ' ' + R + ' 0 0 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2) + '"/>';
    }
    g.innerHTML = out;
  }

  // Ciel étoilé animé derrière le Portail (seulement quand il est ouvert).
  var skyRaf = 0, stars = [];
  function sky(on) {
    var c = $('portalSky');
    cancelAnimationFrame(skyRaf);
    if (!c || !on) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    function size() { c.width = c.clientWidth * dpr; c.height = c.clientHeight * dpr; }
    size();
    if (!stars.length) for (var i = 0; i < 90; i++) stars.push({ x: Math.random(), y: Math.random(), r: Math.random() * 1.2 + .3, t: Math.random() * 6 });
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    function frame(ts) {
      if (c.clientWidth * dpr !== c.width) size();
      var x = c.getContext('2d'), w = c.width, h = c.height;
      x.clearRect(0, 0, w, h);
      stars.forEach(function (s) {
        x.globalAlpha = .25 + .45 * (0.5 + 0.5 * Math.sin(s.t + ts / 1100));
        x.fillStyle = '#fff';
        x.beginPath(); x.arc(s.x * w, s.y * h, s.r * dpr, 0, 6.3); x.fill();
      });
      x.globalAlpha = 1;
      if (!reduce && $('portalModal').classList.contains('active')) skyRaf = requestAnimationFrame(frame);
    }
    skyRaf = requestAnimationFrame(frame);
  }

  // Icônes dessinées (pas d'émojis) : horloge, trophée.
  var ICO_CLOCK = '<svg class="pi" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>';
  var ICO_TROPHY = '<svg class="pi" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v3M8.5 20h7M10 16h4l.6 4H9.4z"/></svg>';

  // Barre du haut équilibrée quand la Maison est là : [Maison][Aide] · Recharger au centre · [Langue][Profil].
  function layoutTopbar(on) {
    var row = document.querySelector('.topbar .topbar-row');
    var portal = $('btnPortal'), help = $('btnHelp');
    var actions = row && row.querySelector('.topbar-actions');
    if (!row || !portal || !help || !actions) return;
    var left = row.querySelector('.tb-left');
    if (on) {
      if (!left) { left = document.createElement('div'); left.className = 'tb-left'; row.insertBefore(left, row.firstChild); }
      if (portal.parentNode !== left) left.appendChild(portal);
      if (help.parentNode !== left) left.appendChild(help);
    } else if (left) {
      if (help.parentNode === left) actions.insertBefore(help, actions.firstChild);
      if (portal.parentNode === left) row.insertBefore(portal, left);
      left.parentNode.removeChild(left);
    }
  }

  function celebrate(s) {
    var key = String(s.activatedAt) + '|' + s.reward;
    if (!s.won || !s.paid || lastWonRef === key) return;
    var seen = '';
    try { seen = localStorage.getItem('oro_defi_seen') || ''; } catch (e) { seen = ''; }
    lastWonRef = key;
    if (seen === key) return;
    try { localStorage.setItem('oro_defi_seen', key); } catch (e2) { /* ignore */ }
    var box = document.createElement('div');
    box.className = 'defi-win';
    box.innerHTML = '<div class="dw-in"><div class="dw-cup">' + ICO_TROPHY + '</div><div class="dw-t"></div><div class="dw-a"></div></div>';
    box.querySelector('.dw-t').textContent = t('defiWon');
    box.querySelector('.dw-a').textContent = '+' + money(s.reward);
    document.body.appendChild(box);
    setTimeout(function () { box.classList.add('out'); }, 2600);
    setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 3200);
  }

  // v2416 — grande notification au centre de l'écran (« Le défi a commencé ! », « C'est parti ! »…).
  function bigToast(ico, title, sub, cls) {
    var box = document.createElement('div');
    box.className = 'defi-win ' + (cls || '');
    box.innerHTML = '<div class="dw-in"><div class="dw-cup">' + ico + '</div><div class="dw-t"></div><div class="dw-s"></div></div>';
    box.querySelector('.dw-t').textContent = title;
    box.querySelector('.dw-s').textContent = sub || '';
    document.body.appendChild(box);
    setTimeout(function () { box.classList.add('out'); }, 2600);
    setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 3200);
  }

  // v2416 — petit compteur discret sur le graphique pendant le défi : « BAAL ●●●○○ 3/5 ».
  // « Défi perdu » s'affiche un instant quand la série retombe à 0 ; on peut recommencer jusqu'à minuit.
  var hudLast = -1;
  function hud(s) {
    var stage = $('chartStage');
    if (!stage) return;
    var el = $('defiHud');
    var on = !!(s && s.enabled && s.active && !guestGift());
    if (!on) {
      // Défi perdu (une seule défaite) : le compteur devient rouge « Défi perdu », puis disparaît.
      if (el && !el.classList.contains('hidden') && s && s.finished && !s.won && !el.classList.contains('lost')) {
        el.classList.add('lost');
        el.setAttribute('data-lost', t('defiLostHud'));
        setTimeout(function () { el.classList.remove('lost'); el.classList.add('hidden'); }, 3000);
      } else if (el && !el.classList.contains('lost')) el.classList.add('hidden');
      hudLast = -1;
      return;
    }
    if (!el) {
      el = document.createElement('button');
      el.type = 'button';
      el.id = 'defiHud';
      el.className = 'defi-hud';
      el.addEventListener('click', function () { openPortal(); setTimeout(function () { if (D6.Portal.tab) D6.Portal.tab('defi'); }, 30); });
      stage.appendChild(el);
    }
    var n = s.streak || 0, need = s.need || 5, dots = '';
    for (var i = 0; i < need; i++) dots += '<i class="' + (i < n ? 'on' : '') + '"></i>';
    el.innerHTML = '<svg class="pi" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r="1.6" class="pi-fill"/></svg><b></b><span class="dh-dots">' + dots + '</span><em>' + n + '/' + need + '</em>';
    el.querySelector('b').textContent = marketName(s.market);
    el.classList.remove('hidden');
    if (hudLast > 0 && n === 0) {
      el.classList.add('lost');
      el.setAttribute('data-lost', t('defiLostHud'));
      setTimeout(function () { el.classList.remove('lost'); }, 2600);
    }
    hudLast = n;
  }

  // Pièce ORO (monnaie des points du site) : pièce dorée avec la pyramide OROLADO.
  var ICO_ORO = '<svg class="oro-coin" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" class="oc-out"/><circle cx="10" cy="10" r="6.8" class="oc-in"/><path d="M10 5.2 14.2 13.6H5.8z" class="oc-pyr"/><circle cx="10" cy="10.6" r="1.1" class="oc-eye"/></svg>';
  var ICO_TARGET = '<svg class="pi" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r="1.6" class="pi-fill"/></svg>';
  // Ferme les Récompenses et ouvre le marché du défi (démo pour le compte admin en test, réel sinon).
  function goDefiMarket() {
    closePortal();
    if (!state || !state.market) return;
    try { if (window.oroUi && window.oroUi.mode) window.oroUi.mode(state.mode === 'demo' ? 'demo' : 'real'); } catch (e) { /* ignore */ }
    var id = state.market;
    if (window.oroUi && window.oroUi.asset) window.oroUi.asset({ getAttribute: function () { return id; } });
  }

  async function call(action) {
    if (!loggedIn() || !D6.Api || !D6.Api.post) return null;
    try { return await D6.Api.post(action, {}, 15000); } catch (e) { return null; }
  }

  async function refresh(activate) {
    if (!loggedIn()) { state = null; render(); return; }
    var r = await call(activate ? 'defiActivate' : 'defiStatus');
    if (!r || r.ok === false) return;
    if (r.now) skew = r.now - Date.now() / 1000;
    var wasActive = state && state.active;
    state = r;
    render();
    fitPortal();
    if (wasActive && r.won) celebrate(r);
    else if (r.won && r.paid) celebrate(r);
    schedule();
  }

  function schedule() {
    clearTimeout(pollT);
    if (!state || !state.enabled) return;
    // Pendant un défi : toutes les 8 s (pour suivre la série) ; sinon toutes les 60 s.
    // v2420 (charge serveur) : défi en cours → toutes les 15 s ; sinon seulement si les Récompenses sont ouvertes.
    if (!state.active && !portalOpen()) return;
    pollT = setTimeout(function () { if (!document.hidden) refresh(); else schedule(); }, state.active ? 15000 : 60000);
  }

  function bind() {
    var b = $('btnPortal');
    if (b) b.addEventListener('click', openPortal);
    if ($('closePortal')) $('closePortal').addEventListener('click', closePortal);
    var m = $('portalModal');
    if (m) m.addEventListener('click', function (e) { if (e.target === m) closePortal(); });
    if ($('defiActivate')) $('defiActivate').addEventListener('click', async function () {
      if (needAccount()) return;
      var btn = this;
      btn.disabled = true;
      await refresh(true);
      btn.disabled = false;
      // v2416 : le défi démarre → grande notification puis direction le marché du défi.
      if (state && state.active) {
        goDefiMarket();
        bigToast(ICO_TARGET, t('defiStartedT'), t('defiStartedS', { m: marketName(state.market) }), 'dw-start');
      }
    });
    if ($('defiTrade')) $('defiTrade').addEventListener('click', goDefiMarket);
    if ($('defiChip')) {
      $('defiChip').addEventListener('click', openPortal);
    }
    clearInterval(tickT);
    tickT = setInterval(function () { if (state && state.enabled && (state.active || state.won)) render(); }, 1000);
    // Connexion / déconnexion / retour sur l'onglet : on relit l'état.
    document.addEventListener('visibilitychange', function () { if (!document.hidden) refresh(); });
    var lastTok = '';
    // Visiteur non inscrit : la case dorée s'affiche dès le chargement (si les cadeaux sont ouverts).
    setTimeout(render, 800);
    setInterval(function () {
      var tok = (D6.Api && D6.Api.token && D6.Api.token()) || '';
      if (tok !== lastTok) { lastTok = tok; state = null; render(); if (tok) refresh(); }
    }, 1500);
  }

  // v2413/v2414 — Inviter un ami + Top 25 démo : tout est décidé et payé par le serveur
  // (api.php affStatus / affClick / topStatus, aff_lib.php, top_lib.php). Ici on affiche seulement.
  var aff = null;
  var affT = 0;
  var top = null;
  var topT = 0;
  var topPrev = false;
  var affFilter = 'all';
  var curTab = 'defi';
  var ICO_GIFT = '<svg class="pi" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13"/><path d="M12 7c-1.5-3-5-3.5-5-1.2C7 7 10 7 12 7zm0 0c1.5-3 5-3.5 5-1.2C17 7 14 7 12 7z"/></svg>';
  var ICO_MEDAL = '<svg viewBox="0 0 40 48" aria-hidden="true"><path d="M12 2h6l4 12h-6zM28 2h-6l-4 12h6z" class="rb"/><circle cx="20" cy="30" r="14" class="md"/><circle cx="20" cy="30" r="10" class="mi"/></svg>';
  function esc(x) {
    return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function affLink() { return aff && aff.code ? location.origin + '/?ami=' + aff.code : ''; }
  function nowSrv() { return Date.now() / 1000 + skew; }
  // Compte à rebours qui tourne chaque seconde : « 358j 04:12:33 ».
  function daysLeft(until) {
    var s = Math.max(0, Math.floor(until - nowSrv()));
    var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
    return d + t('defiD') + ' ' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(x).padStart(2, '0');
  }
  function tabsOn() {
    var a = !!(aff && aff.enabled && (aff.code || aff.guest)), b = !!(top && top.enabled), c = !!(bon && bon.enabled);
    show($('portalTabs'), a || b || c);
    var bs = document.querySelectorAll('#portalTabs .pt-tab');
    for (var i = 0; i < bs.length; i++) {
      var k = bs[i].getAttribute('data-tab');
      show(bs[i], k === 'defi' || (k === 'aff' && a) || (k === 'top' && b) || (k === 'bon' && c));
    }
    if ($('portalTabs')) $('portalTabs').style.gridTemplateColumns = 'repeat(' + (1 + (a ? 1 : 0) + (b ? 1 : 0) + (c ? 1 : 0)) + ',1fr)';
    if ($('portalModal')) $('portalModal').classList.toggle('tabs-on', a || b || c);
    if ((curTab === 'aff' && !a) || (curTab === 'top' && !b) || (curTab === 'bon' && !c)) setTab('defi');
  }
  function renderAff() {
    tabsOn();
    if (!(aff && aff.enabled && (aff.code || aff.guest))) return;
    $('affUrl').textContent = aff.guest ? t('affGuestLink') : affLink().replace(/^https?:\/\//, '');
    $('affClicks').textContent = String(aff.clicks || 0);
    $('affFriends').textContent = String(aff.friends || 0);
    $('affDeposited').textContent = String(aff.deposited || 0);
    $('affPlayed').textContent = String(aff.played || 0);
    $('affTotal').textContent = money(aff.total || 0);
    $('affEarned').textContent = money(aff.earned || 0);
    $('affListCount').textContent = String(aff.deposited || 0);
    renderAffList();
    fitPortal();
  }
  function affRowHtml(r) {
    var when = new Date(r.at * 1000).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: '2-digit' });
    return '<div class="aff-row"><div class="ar-id"><b>' + esc(r.id) + '</b><span>' + esc(when) + (r.played ? ' · <i>' + esc(t('affPlayedOne')) + '</i>' : '') + '</span></div>' +
      '<div class="ar-dep"><b>' + esc(money(r.deposit)) + '</b><span>' + esc(t('affColDep')) + '</span></div>' +
      '<div class="ar-gain"><b>+' + esc(money(r.gift)) + '</b><span class="ar-left" data-until="' + Number(r.until || 0) + '">' + esc(t('affLeft')) + ' ' + esc(daysLeft(r.until)) + '</span></div></div>';
  }
  // Aperçu (3 derniers amis) sous les carrés + page complète « Voir plus » (filtre, totaux, tous les amis).
  function renderAffList() {
    if (!aff || !$('affRows')) return;
    var all = (aff.list || []).filter(function (r) { return Number(r.deposit || 0) > 0; });
    $('affRows').innerHTML = all.length ? all.slice(0, 2).map(affRowHtml).join('') : '<p class="aff-empty">' + esc(t('affEmptyAll')) + '</p>';
    show($('affMore'), all.length > 0);
    if (!$('affRowsAll')) return;
    var now = nowSrv();
    var from = affFilter === 'day' ? Math.floor(new Date().setHours(0, 0, 0, 0) / 1000)
      : affFilter === 'week' ? now - 7 * 86400 : affFilter === 'month' ? now - 30 * 86400 : 0;
    var rows = all.filter(function (r) { return r.at >= from; });
    var dep = 0, gain = 0;
    rows.forEach(function (r) { dep += Number(r.deposit || 0); gain += Number(r.gift || 0); });
    if ($('affSum')) $('affSum').innerHTML = '<div><b>' + rows.length + '</b><span>' + esc(t('affDeposited')) + '</span></div>' +
      '<div><b>' + esc(money(dep)) + '</b><span>' + esc(t('affColDep')) + '</span></div>' +
      '<div class="gold"><b>+' + esc(money(gain)) + '</b><span>' + esc(t('affEarned')) + '</span></div>';
    $('affRowsAll').innerHTML = rows.length ? rows.map(affRowHtml).join('') : '<p class="aff-empty">' + esc(t('affEmpty')) + '</p>';
  }
  function tickLists() {
    var els = document.querySelectorAll('#affRows .ar-left, #affRowsAll .ar-left');
    for (var i = 0; i < els.length; i++) els[i].textContent = t('affLeft') + ' ' + daysLeft(Number(els[i].getAttribute('data-until')));
    if (bon && bon.enabled && $('bonTimer')) $('bonTimer').innerHTML = ICO_CLOCK + '<span>' + esc(daysLeft(bon.phase === 'filling' ? bon.until : bon.weekEnd)) + '</span>';
    if (top && top.enabled && $('topTimer')) $('topTimer').innerHTML = ICO_CLOCK + '<span>' + esc(top.prev ? t('topEnded') : daysLeft(top.endsAt)) + '</span>';
  }
  function giftPopup(amount) {
    var box = document.createElement('div');
    box.className = 'defi-win';
    box.innerHTML = '<div class="dw-in"><div class="dw-cup">' + ICO_GIFT + '</div><div class="dw-t"></div><div class="dw-a"></div></div>';
    box.querySelector('.dw-t').textContent = t('affGiftTitle');
    box.querySelector('.dw-a').textContent = '+' + money(amount);
    document.body.appendChild(box);
    setTimeout(function () { box.classList.add('out'); }, 3200);
    setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 3800);
  }
  async function refreshAff() {
    clearTimeout(affT);
    if (!loggedIn()) { if (!guestGift()) aff = null; renderAff(); return; }
    var r = await call('affStatus');
    if (r && r.ok !== false) {
      if (r.now) skew = r.now - Date.now() / 1000;
      aff = r;
      renderAff();
      if (r.invited && r.invited.justPaid && r.invited.gift > 0) {
        giftPopup(r.invited.gift);
        if (D6.Supabase && D6.Supabase.pullVault) { try { D6.Supabase.pullVault(); } catch (eW) { /* ignore */ } }
      }
    }
    // Ami invité qui n'a pas encore reçu son cadeau, ou celui qui invite : on revérifie chaque minute.
    if (r && ((r.invited && !r.invited.paid) || r.enabled)) {
      // Celui qui invite : seulement quand les Récompenses sont ouvertes. L'ami en attente de son cadeau : chaque minute.
      if (!(r.invited && !r.invited.paid) && !portalOpen()) return;
      affT = setTimeout(function () { if (!document.hidden) refreshAff(); else affT = setTimeout(refreshAff, 60000); }, 60000);
    }
  }
  function flag(cc) {
    cc = String(cc || '').toUpperCase();
    return /^[A-Z]{2}$/.test(cc) ? '<i class="tf">' + cc + '</i>' : '<i class="tf"></i>';
  }
  function renderTop() {
    tabsOn();
    if (!top || !top.enabled) return;
    var list = top.top || [];
    var pod = [list[1], list[0], list[2]];
    $('topPodium').innerHTML = pod.map(function (r, i) {
      var place = [2, 1, 3][i];
      if (!r) return '<div class="tp tp' + place + ' empty"><div class="tp-medal">' + ICO_MEDAL + '<em>' + place + '</em></div><b>—</b><span>&nbsp;</span><div class="tp-step"></div></div>';
      return '<div class="tp tp' + place + (r.me ? ' me' : '') + '"><div class="tp-medal">' + ICO_MEDAL + '<em>' + place + '</em></div><b>' + esc(r.id) + '</b>' +
        '<span class="oro-amt">' + esc(r.points) + ' ORO</span><div class="tp-step"></div></div>';
    }).join('');
    var rest = list.slice(3);
    if (!list.length) $('topRows').innerHTML = '<p class="aff-empty">' + esc(t('topEmpty')) + '</p>';
    else $('topRows').innerHTML = rest.map(function (r) {
      return '<div class="tr' + (r.me ? ' me' : '') + '"><em>' + r.rank + '</em><b>' + esc(r.id) + '</b><span class="oro-amt">' + esc(r.points) + ' ORO</span></div>';
    }).join('');
    var me = top.me || {};
    var txt;
    if (top.guest) txt = t('topGuest');
    else if (topPrev) txt = me.rank ? t('topPrevMe', { r: me.rank, p: me.points }) : t('topPrevNone');
    else if (me.rank) txt = t('topMeRank', { r: me.rank, p: me.points });
    else if (me.need > 0) txt = t('topMeNeed', { n: me.need });
    else txt = t('topMeOut', { p: me.points });
    $('topMe').innerHTML = '<svg class="pi" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-3.6 3.6-5.6 7-5.6s6.2 2 7 5.6"/></svg><span></span>';
    $('topMe').lastChild.textContent = txt;
    $('topMe').classList.toggle('in', !!me.rank && me.rank <= (top.show || 25));
    // Bouton « Semaine dernière » : seulement pour l'admin (il voit les numéros ORO pour récompenser).
    var isAdmin = !!top.admin || topPrev;
    show($('topPrev'), isAdmin);
    if ($('topPrevLbl')) $('topPrevLbl').textContent = topPrev ? t('topThis') : t('topPrev');
    // Semaine dernière : un écran « terminé » (titre, bandeau, ton résultat final, pas de bouton Jouer).
    show($('topEnded'), !!topPrev);
    show($('topPlay'), !topPrev);
    var ttl = document.querySelector('#topCard .top-title b');
    if (ttl) ttl.textContent = topPrev ? t('topPrevTitle') : t('topTitle');
    if ($('topCard')) $('topCard').classList.toggle('is-prev', !!topPrev);
    tickLists();
    fitPortal();
  }
  async function refreshTop() {
    clearTimeout(topT);
    if (!loggedIn()) { if (!guestGift()) top = null; renderTop(); return; }
    var r = null;
    try { r = await D6.Api.post('topStatus', topPrev ? { prev: 1 } : {}, 15000); } catch (e) { r = null; }
    if (r && r.ok !== false) {
      if (r.now) skew = r.now - Date.now() / 1000;
      top = r;
      renderTop();
    }
    if (r && r.enabled) topT = setTimeout(function () { if (!document.hidden && curTab === 'top') refreshTop(); else topT = setTimeout(refreshTop, 120000); }, 60000);
  }
  // v2417 — Bonus dépôt de la semaine : tout est décidé et payé par le serveur (bonus_lib.php).
  var bon = null;
  var bonT = 0;
  function renderBon() {
    tabsOn();
    if (!bon || !bon.enabled || !$('bonCard')) return;
    var ph = bon.phase || 'off';
    var target = Number(bon.target || 0), got = Number(bon.credited || 0);
    show($('bonMeter'), ph === 'filling' || ph === 'full' || ph === 'expired');
    $('bonMeterTxt').textContent = '+' + money(got) + ' / ' + money(target);
    $('bonMeterFill').style.width = (target > 0 ? Math.min(100, got / target * 100) : 0) + '%';
    $('bonMeterSub').textContent = t('bonToWin', { r: money(target) });
    var st = '';
    if (ph === 'waiting') st = t('bonWaiting');
    else if (ph === 'filling') st = t('bonFilling', { d: money(bon.deposit || 0) });
    else if (ph === 'full') st = t('bonFull', { r: money(target) });
    else if (ph === 'expired') st = t('bonExpired');
    $('bonState').textContent = st;
    $('bonState').className = 'bon-state ' + ph;
    show($('bonActivate'), ph === 'off');
    show($('bonDeposit'), ph === 'waiting' || ph === 'off' && !!bon.guest);
    if (bon.guest) show($('bonDeposit'), false);
    show($('bonTest'), !!bon.test && ph === 'waiting');
    tickLists();
    fitPortal();
  }
  async function refreshBon(action, extra) {
    clearTimeout(bonT);
    if (!loggedIn()) { if (!guestGift()) bon = null; renderBon(); return; }
    var r = null;
    try { r = await D6.Api.post(action || 'bonusStatus', extra || {}, 15000); } catch (e) { r = null; }
    if (r && r.ok !== false) {
      if (r.now) skew = r.now - Date.now() / 1000;
      var before = bon ? Number(bon.credited || 0) : -1;
      bon = r;
      renderBon();
      // Un nouveau morceau de bonus vient d'arriver : petite notification + solde à jour.
      if (before >= 0 && Number(r.credited || 0) > before + 0.009) {
        bigToast(ICO_GIFT, t('bonGotT'), '+' + money(Number(r.credited) - before), 'dw-start');
        if (D6.Supabase && D6.Supabase.pullVault) { try { D6.Supabase.pullVault(); } catch (eV) { /* ignore */ } }
      }
    }
    // Pendant le remplissage : on revérifie toutes les 20 s (le bonus monte pendant que le joueur joue).
    // Bonus en train de se remplir : toutes les 45 s (pour verser les paliers) ; sinon seulement Récompenses ouvertes.
    if (r && r.enabled && (r.phase === 'filling' || portalOpen())) bonT = setTimeout(function () { if (!document.hidden) refreshBon(); else bonT = setTimeout(refreshBon, 60000); }, r.phase === 'filling' ? 45000 : 60000);
  }

  function setTab(name) {
    curTab = name;
    show($('defiCard'), name === 'defi');
    show($('affCard'), name === 'aff');
    show($('topCard'), name === 'top');
    show($('bonCard'), name === 'bon');
    if ($('portalModal')) {
      $('portalModal').classList.toggle('aff-on', name === 'aff');
      $('portalModal').classList.toggle('top-on', name === 'top');
    }
    var bs = document.querySelectorAll('#portalTabs .pt-tab');
    for (var i = 0; i < bs.length; i++) bs[i].classList.toggle('on', bs[i].getAttribute('data-tab') === name);
    if (name === 'aff') { showAffList(false); refreshAff(); }
    if (name === 'top') refreshTop();
    if (name === 'bon') refreshBon();
    fitPortal();
  }
  // v2415 : la liste des amis est toujours affichée sous les carrés (plus de bouton « Voir mes amis »).
  function showAffList(full) {
    show($('affMain'), !full);
    show($('affListView'), !full);
    show($('affFull'), !!full);
    renderAffList();
    fitPortal();
  }
  async function copyLink() {
    var link = affLink();
    if (!link) return false;
    try { await navigator.clipboard.writeText(link); return true; } catch (e) { /* repli ci-dessous */ }
    try {
      var ta = document.createElement('textarea');
      ta.value = link; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
      return true;
    } catch (e2) { return false; }
  }
  // Clic sur un lien d'ami (orolado.com/?ami=CODE) : envoyé une fois ; le serveur filtre par téléphone et par jour.
  function sendClick() {
    try {
      var o = JSON.parse(localStorage.getItem('oro_ami') || 'null');
      if (!o || !o.c || o.sent || Date.now() - (o.t || 0) > 600000 || !D6.Api || !D6.Api.post) return;
      var dev = localStorage.getItem('oro_dev');
      if (!dev) { dev = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('oro_dev', dev); }
      o.sent = 1;
      localStorage.setItem('oro_ami', JSON.stringify(o));
      Promise.resolve(D6.Api.post('affClick', { ami: o.c, device: dev }, 10000)).catch(function () { /* ignore */ });
    } catch (e) { /* ignore */ }
  }
  function bindAff() {
    var tabs = document.querySelectorAll('#portalTabs .pt-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].addEventListener('click', function () { setTab(this.getAttribute('data-tab')); });
    if ($('affCopy')) $('affCopy').addEventListener('click', async function () {
      if (needAccount()) return;
      var btn = this, lbl = btn.querySelector('span');
      if (await copyLink()) {
        btn.classList.add('done');
        lbl.textContent = t('affCopied');
        setTimeout(function () { btn.classList.remove('done'); lbl.textContent = t('affCopy'); }, 1800);
      }
    });
    if ($('affShare')) $('affShare').addEventListener('click', async function () {
      if (needAccount()) return;
      var link = affLink();
      if (!link) return;
      if (navigator.share) {
        try { await navigator.share({ title: 'OROLADO', text: t('affShareText'), url: link }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
      }
      if (await copyLink() && $('affCopy')) $('affCopy').click();
    });
    if ($('affMore')) $('affMore').addEventListener('click', function () { showAffList(true); });
    if ($('affBack')) $('affBack').addEventListener('click', function () { showAffList(false); });
    var fb = document.querySelectorAll('#affFilter button');
    for (var j = 0; j < fb.length; j++) fb[j].addEventListener('click', function () {
      affFilter = this.getAttribute('data-f');
      for (var k = 0; k < fb.length; k++) fb[k].classList.toggle('on', fb[k] === this);
      renderAffList();
    });
    if ($('topPlay')) $('topPlay').addEventListener('click', function () {
      if (needAccount()) return;
      closePortal();
      if (window.oroUi && window.oroUi.mode) window.oroUi.mode('demo');
      bigToast(ICO_TROPHY, t('topGoT'), t('topGoS'), 'dw-start');
    });
    var goAuth = function (which) {
      closePortal();
      var b = $(which === 'login' ? 'btnGoLogin' : 'btnGoRegister');
      if (b) b.click();
    };
    if ($('giftGuestGo')) $('giftGuestGo').addEventListener('click', function () { goAuth('register'); });
    if ($('giftGuestLogin')) $('giftGuestLogin').addEventListener('click', function () { goAuth('login'); });
    if ($('bonActivate')) $('bonActivate').addEventListener('click', async function () {
      if (needAccount()) return;
      this.disabled = true;
      await refreshBon('bonusActivate');
      this.disabled = false;
      if (bon && bon.phase === 'waiting') bigToast(ICO_GIFT, t('bonOnT'), t('bonOnS'), 'dw-start');
    });
    if ($('bonDeposit')) $('bonDeposit').addEventListener('click', function () {
      if (needAccount()) return;
      closePortal();
      if (window.oroUi && window.oroUi.deposit) window.oroUi.deposit();
    });
    if ($('bonTest')) $('bonTest').addEventListener('click', function () { refreshBon('bonusTestDeposit', { amount: 200 }); });
    if ($('topPrev')) $('topPrev').addEventListener('click', function () { topPrev = !topPrev; refreshTop(); });
    setInterval(function () { if ($('portalModal') && $('portalModal').classList.contains('active')) tickLists(); }, 1000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) refreshAff(); });
    var lastTok = '';
    setInterval(function () {
      var tok = (D6.Api && D6.Api.token && D6.Api.token()) || '';
      if (tok !== lastTok) { lastTok = tok; aff = null; top = null; bon = null; setTab('defi'); renderAff(); renderTop(); renderBon(); if (tok) { refreshAff(); refreshTop(); refreshBon(); } }
    }, 1500);
    setTimeout(sendClick, 1500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindAff);
  else bindAff();

  // v2414 — la page du Portail tient TOUJOURS sur l'écran visible (barre Safari, petits téléphones) :
  // si le contenu dépasse, il est resserré d'un coup (zoom) au lieu de défiler. Jamais en dessous de 78 %.
  var fitT = 0;
  function fitPortal() {
    clearTimeout(fitT);
    fitT = setTimeout(function () {
      var box = document.querySelector('#portalModal .portal-box');
      var m = $('portalModal');
      if (!box || !m || !m.classList.contains('active') || window.innerWidth >= 860) return;
      // v2419 : plus de resserrage (zoom) : les cartes ont toutes la même taille et défilent si besoin.
      for (var z = 0; z < box.children.length; z++) box.children[z].style.zoom = '';
      return;
      var kids = [];
      for (var i = 0; i < box.children.length; i++) {
        var k = box.children[i];
        if (k.classList.contains('portal-sky') || k.classList.contains('btn-close') || k.classList.contains('hidden')) continue;
        kids.push(k);
      }
      kids.forEach(function (k) { k.style.zoom = ''; });
      var cs = getComputedStyle(box);
      var avail = box.clientHeight - (parseFloat(cs.paddingTop) || 0) - (parseFloat(cs.paddingBottom) || 0);
      var need = 0;
      kids.forEach(function (k) { var r = k.getBoundingClientRect(), s = getComputedStyle(k); if (s.display === 'none') return; need += r.height + (parseFloat(s.marginTop) || 0) + (parseFloat(s.marginBottom) || 0); });
      if (need > avail + 1) {
        var z = Math.max(0.78, Math.floor((avail / need) * 1000) / 1000);
        kids.forEach(function (k) { k.style.zoom = String(z); });
      }
    }, 40);
  }
  window.addEventListener('resize', fitPortal);
  document.addEventListener('click', function (e) { if (e.target && e.target.closest && e.target.closest('#portalModal')) fitPortal(); }, true);
  setInterval(function () { var m = $('portalModal'); if (m && m.classList.contains('active')) fitPortal(); }, 2000);

  D6.Portal = { refresh: refresh, open: openPortal, refreshAff: refreshAff, refreshTop: refreshTop, refreshBon: refreshBon, tab: setTab, fit: fitPortal };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})(window.D6 = window.D6 || {});
