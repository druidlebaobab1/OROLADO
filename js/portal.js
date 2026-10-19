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
    // v2422 — on rouvre sur le Tournoi : classement relu tout de suite (les trades démo joués entre-temps comptent).
    if (curTab === 'top' && D6.Portal && D6.Portal.refreshTop) D6.Portal.refreshTop();
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
  // v2423 — le visiteur voit les 4 pages ; quand il appuie sur une action : belle notification « Inscription gratuite »,
  // puis la page d'inscription s'ouvre.
  var needT = 0;
  // v2763 (propriétaire) : le visiteur qui part s'inscrire depuis Cadeaux revient sur la MÊME page s'il touche « Retour »
  function armReturn() {
    var m = document.getElementById('portalModal'), atHome = !!(m && m.classList.contains('gh-home')), tb = curTab;
    var gs = D6.GiftsHome && D6.GiftsHome.sub ? D6.GiftsHome.sub() : '';
    if (D6.App && D6.App.authReturn) D6.App.authReturn(function () {
      openPortal();
      setTimeout(function () { if (!D6.GiftsHome) return; if (atHome) D6.GiftsHome.home(); else D6.GiftsHome.go(gs || tb); }, 60);
    });
  }
  function needAccount() {
    if (!guestGift()) return false;
    if (needT) return true;
    bigToast(ICO_LOCK, t('guestJoin'), '', 'dw-start dw-lock dw-one');
    needT = setTimeout(function () {
      needT = 0;
      armReturn();
      closePortal();
      var b = document.getElementById('btnGoRegister');
      if (b) b.click();
    }, 1400);
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
    // Nom du marché jamais coupé en fin de ligne (« ORO 999 »).
    var mk = marketName(s.market).replace(/ /g, ' ');
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
    } else if (s.won && !s.canActivate && now < Number(s.expiresAt || 0)) {
      tm.textContent = '';
      st.innerHTML = ICO_TROPHY + '<span></span>';
      st.lastChild.textContent = t('defiWonMsg', { r: money(s.reward) }) + ' · ' + t('defiNext') + ' ' + left(s.expiresAt - now);
      st.className = 'defi-state won';
      show(act, false);
      show(go, false);
    } else {
      // v2465 — compte à rebours fini (ou aucun défi en cours) : « Nouveau défi disponible ! » + le bouton,
      // au lieu de « Défi perdu. Nouveau défi dans 00:00:00 ».
      var ready = !!s.canActivate || (!s.active && now >= Number(s.expiresAt || 0));
      tm.textContent = '';
      if (ready) {
        st.textContent = t('defiReady');
        st.className = 'defi-state ready';
      } else {
        st.textContent = s.finished && !s.won ? t('defiLost') + ' ' + left(s.expiresAt - now) : '';
        st.className = 'defi-state';
      }
      act.textContent = t('defiStart', { m: mk });
      show(act, ready);
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
        // v2426 : nom unique à chaque copie (la carte du défi ET la notification affichent le même logo).
        var sfx = '_pg' + Math.random().toString(36).slice(2, 7);
        var html = art.innerHTML.replace(/id="([^"]+)"/g, 'id="$1' + sfx + '"').replace(/url\(#([^)]+)\)/g, 'url(#$1' + sfx + ')').replace(/href="#([^"]+)"/g, 'href="#$1' + sfx + '"');
        // v2422 — la PLANÈTE entière (fond, reflet, ombre de la case du marché) avec son logo dessus.
        var acs = getComputedStyle(art);
        var planet = 'background-image:' + acs.backgroundImage.replace(/"/g, "'") + ';box-shadow:' + acs.boxShadow + ';border-radius:50%';
        return '<span class="hc-globe hc-planet" style="--p1:' + p1 + ';--p2:' + p2 + ';--pg:' + pg + ';' + planet + '">' + html + '</span>';
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
    var portal = $('btnPortal'), help = $('btnHelp'), casino = $('btnCasino');
    var actions = row && row.querySelector('.topbar-actions');
    if (!row || !portal || !help || !actions) return;
    var left = row.querySelector('.tb-left');
    if (on) {
      if (!left) { left = document.createElement('div'); left.className = 'tb-left'; row.insertBefore(left, row.firstChild); }
      if (portal.parentNode !== left) left.appendChild(portal);
      // v2690 (propriétaire) : à gauche Cadeaux + Casino ; Live reste à droite, à côté du profil.
      if (casino && casino.parentNode !== left) left.appendChild(casino);
      if (help.parentNode !== actions) actions.insertBefore(help, actions.firstChild);
    } else if (left) {
      if (casino && casino.parentNode === left) row.insertBefore(casino, left);
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
    box.innerHTML = '<div class="dw-in"><div class="dw-rays"></div><div class="dw-cup">' + ICO_TROPHY + '</div><div class="dw-t"></div><div class="dw-a"></div></div>';
    sparkle(box);
    box.querySelector('.dw-t').textContent = t('defiWon');
    box.querySelector('.dw-a').textContent = '+' + money(s.reward);
    document.body.appendChild(box);
    setTimeout(function () { box.classList.add('out'); }, 2600);
    setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 3200);
  }

  // v2426 — étincelles et rayons dorés derrière les grandes notifications (rien si « animations réduites »).
  function sparkle(box) {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var sp = document.createElement('div');
    sp.className = 'dw-sp';
    var html = '';
    for (var i = 0; i < 22; i++) {
      var a = Math.round(i * 360 / 22 + Math.random() * 12), d = Math.round(90 + Math.random() * 90), z = (Math.random() * 0.35).toFixed(2);
      html += '<i style="--a:' + a + 'deg;--d:' + d + 'px;--z:' + z + 's"></i>';
    }
    sp.innerHTML = html;
    var inn = box.querySelector('.dw-in');
    if (inn) inn.insertBefore(sp, inn.firstChild);
  }
  // v2416 — grande notification au centre de l'écran (« Le défi a commencé ! », « C'est parti ! »…).
  function bigToast(ico, title, sub, cls) {
    var box = document.createElement('div');
    box.className = 'defi-win ' + (cls || '');
    box.innerHTML = '<div class="dw-in"><div class="dw-rays"></div><div class="dw-cup">' + ico + '</div><div class="dw-t"></div><div class="dw-s"></div></div>';
    sparkle(box);
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
  var ICO_ORO = '<svg class="oro-coin" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12.6" r="11" class="oc-edge"/><circle cx="12" cy="11.4" r="11" class="oc-out"/><circle cx="12" cy="11.4" r="8.6" class="oc-in"/><path d="M12 5.4 17.6 16.2H6.4z" class="oc-pyr"/><path d="M12 5.4 17.6 16.2H12z" class="oc-pyr2"/><path d="M8.4 12.6h7.2M7.4 14.4h9.2" class="oc-line"/><path d="M5.5 7.2A8.2 8.2 0 0 1 9.4 3.9" class="oc-shine"/></svg>';
  var ICO_TARGET = '<svg class="pi" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r="1.6" class="pi-fill"/></svg>';
  // Ferme les Récompenses et ouvre le marché du défi (démo pour le compte admin en test, réel sinon).
  function goDefiMarket() {
    closePortal();
    if (!state || !state.market) return;
    try { if (window.oroUi && window.oroUi.mode) window.oroUi.mode(state.mode === 'demo' ? 'demo' : 'real'); } catch (e) { /* ignore */ }
    var id = state.market;
    if (window.oroUi && window.oroUi.asset) window.oroUi.asset({ getAttribute: function () { return id; } });
  }

  async function call(action, data) {
    if (!loggedIn() || !D6.Api || !D6.Api.post) return null;
    try { return await D6.Api.post(action, data || {}, 15000); } catch (e) { return null; }
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
    // v2463 — la fête « Défi gagné » seulement au moment où le défi suivi se termine gagné. Avant, un ancien défi
    // déjà payé était refêté sur un autre téléphone / l'application installée (on croyait recevoir un nouveau cadeau).
    if (wasActive && r.won) celebrate(r);
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

  // v2427 — scène de l'univers en bas de chaque page des Cadeaux (galaxie qui tourne, planète, lunes, étoiles filantes).
  function scenes() {
    ['defiCard', 'affCard', 'topCard', 'bonCard'].forEach(function (id) {
      var c = $(id);
      if (!c || c.querySelector(':scope > .gift-scene')) return;
      var sc = document.createElement('div');
      sc.className = 'gift-scene';
      sc.setAttribute('aria-hidden', 'true');
      sc.innerHTML = '<i class="gs-neb"></i><i class="gs-gal"></i><i class="gs-core"></i><i class="gs-planet"><b></b></i><i class="gs-ring"></i><i class="gs-moon m1"></i><i class="gs-moon m2"></i><i class="gs-shoot s1"></i><i class="gs-shoot s2"></i><i class="gs-dust"></i>';
      c.appendChild(sc);
    });
  }
  function bind() {
    scenes();
    // v2429 — changement de langue : les textes construits ici (cases, listes, classement) sont refaits aussitôt.
    document.addEventListener('oro:lang', function () {
      try { render(); renderAff(); renderTop(); renderBon(); } catch (eL) { /* ignore */ }
    });
    var b = $('btnPortal');
    // v2660 (propriétaire) : visiteur PAS encore inscrit qui touche « Cadeaux » → belle notification
    // « Inscription gratuite », puis la page d'inscription s'ouvre (au lieu des pages cadeaux).
    // v2662 : Cadeaux remis pour les visiteurs (Défi, Tournoi, Bonus visibles ; Invitation demande l'inscription).
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
        bigToast(globeHtml(state.market) || ICO_TARGET, t('defiStartedT'), t('defiStartedS', { m: marketName(state.market) }), 'dw-start dw-planet');
      }
    });
    if ($('defiTrade')) $('defiTrade').addEventListener('click', goDefiMarket);
    if ($('defiChip')) {
      $('defiChip').addEventListener('click', openPortal);
    }
    clearInterval(tickT);
    tickT = setInterval(function () { if (state && state.enabled && (state.active || state.won || state.finished)) render(); }, 1000);
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
  var affSortBy = 'new';
  var curTab = 'defi';
  var ICO_GIFT = '<svg class="pi" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13"/><path d="M12 7c-1.5-3-5-3.5-5-1.2C7 7 10 7 12 7zm0 0c1.5-3 5-3.5 5-1.2C17 7 14 7 12 7z"/></svg>';
  var ICO_MEDAL = '<svg viewBox="0 0 40 48" aria-hidden="true"><path d="M12 2h6l4 12h-6zM28 2h-6l-4 12h6z" class="rb"/><circle cx="20" cy="30" r="14" class="md"/><circle cx="20" cy="30" r="10" class="mi"/></svg>';
  function esc(x) {
    return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  // v2428 — lien court et propre : orolado.com/r/CODE (sans « www », sans mot français).
  function affLink() { return aff && aff.code ? 'https://orolado.com/r/' + aff.code : ''; }
  function nowSrv() { return Date.now() / 1000 + skew; }
  // Compte à rebours qui tourne chaque seconde : « 358j 04:12:33 ».
  function daysLeft(until) {
    var s = Math.max(0, Math.floor(until - nowSrv()));
    var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
    return d + t('defiD') + ' ' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(x).padStart(2, '0');
  }
  // v2422 — liste des amis : seulement les jours restants (« Reste 364 jours »), pas de secondes qui défilent.
  function daysOnly(until) {
    var n = Math.ceil((until - nowSrv()) / 86400);
    return n <= 1 ? t('affLeft1') : t('affLeftN', { n: n });
  }
  // Points du tournoi : « 1 000 000 [pièce] ORO ».
  // v2438 — signe bien visible : « + » vert au-dessus de 0, « − » rouge en dessous (ce n'est plus un simple tiret).
  function oroAmt(p) {
    var n = Math.round(Number(p) || 0);
    var v = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
    var sign = n > 0 ? '<i class="oa-s pos">+</i>' : n < 0 ? '<i class="oa-s neg">\u2212</i>' : '';
    return '<span class="oro-amt' + (n > 0 ? ' pos' : n < 0 ? ' neg' : '') + '">' + sign + '<span class="oa-n">' + v + '</span>' + ICO_ORO + '<span class="oa-u">ORO</span></span>';
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
    // v2517 — visiteur : la phrase « Inscris-toi pour avoir ton lien » passe à la ligne au lieu d'être coupée (PT, RU, DE).
    $('affUrl').classList.toggle('aff-url-msg', !!aff.guest);
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
  var affFound = null, affSearchT = 0;
  async function affServerSearch(q) {
    var r = await call('affStatus', { tz: new Date().getTimezoneOffset(), q: q });
    if (r && r.ok !== false && Array.isArray(r.found)) { affFound = { q: q, rows: r.found }; renderAffList(); }
  }
  function affInt(n) { try { return Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 }); } catch (e) { return String(Math.round(Number(n || 0))); } }
  function affN(r) { return r.n != null ? Number(r.n) || 0 : (Number(r.deposit || 0) > 0 ? 1 : 0); }
  function affRowHtml(r) {
    var when = new Date(r.at * 1000).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: '2-digit' });
    return '<div class="aff-row"><div class="ar-id"><b>' + esc(String(r.id || '').replace(/^ORO-(\d+)$/, 'ORO$1')) + '</b><span>' + esc(when) + (r.played ? ' · <i>' + esc(t('affPlayedOne')) + '</i>' : '') + '</span></div>' +
      '<div class="ar-dep"><b>' + esc(money(r.deposit)) + '</b><span>' + esc(t('affColDep')) + '</span></div>' +
      // v2489 — nombre de dépôts de l'ami.
      '<div class="ar-n"><b>' + affN(r) + '</b><span>' + esc(t('affColN')) + '</span></div>' +
      '<div class="ar-gain"><b>+' + esc(money(r.gift)) + '</b><span class="ar-left" data-until="' + Number(r.until || 0) + '">' + esc(daysOnly(r.until)) + '</span></div></div>';
  }
  // v2491 — petit graphique des gains de celui qui invite (barres). 7 jours (Aujourd'hui / 7 jours) avec le nom du jour,
  // 30 jours avec la date, « Tout » = par semaine (12 dernières). Affichage seulement.
  // v2491 — un montant trop long (ex. 125 430,50 $) rétrécit un peu pour rester dans sa case, sur tous les téléphones et toutes les langues.
  function fitAffNumbers() {
    var els = document.querySelectorAll('#affSum b, #affSum2 b, #affGraph .ag-h b, #affRowsAll .aff-row b, #affRows .aff-row b, #affMain .aff-stats b');
    for (var i = 0; i < els.length; i++) {
      var el = els[i], box = el.parentElement;
      el.style.fontSize = '';
      var fs = parseFloat(getComputedStyle(el).fontSize) || 14, guard = 0;
      while (box && el.scrollWidth > box.clientWidth - 6 && fs > 9 && guard++ < 12) { fs -= 0.5; el.style.fontSize = fs + 'px'; }
    }
  }
  function renderAffGraph() {
    var box = $('affGraph');
    if (!box || !aff) return;
    var gains = (aff.gains || []).map(function (g) { return [Number(g[0]) || 0, Number(g[1]) || 0]; });
    var lang = document.documentElement.lang || undefined;
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var b = [], i, ref;
    // Le propriétaire veut les NOMS DES JOURS (lundi, mardi…), jamais des dates.
    // Aujourd'hui / 7 jours : les 7 derniers jours, aujourd'hui à droite.
    // 30 jours / Tout : total de chaque jour de la semaine (lundi → dimanche) sur la période.
    if (affFilter === 'day' || affFilter === 'week') {
      for (i = 6; i >= 0; i--) {
        var ds = new Date(today); ds.setDate(ds.getDate() - i);
        var de = new Date(ds); de.setDate(de.getDate() + 1);
        b.push({ s: ds.getTime(), e: de.getTime(), l: ds.toLocaleDateString(lang, { weekday: 'short' }).replace(/\.$/, ''), hot: i === 0 });
      }
    } else {
      var from = affFilter === 'month' ? new Date(today).setDate(today.getDate() - 29) : 0;
      ref = new Date(2024, 0, 1); // un lundi
      for (i = 0; i < 7; i++) {
        var dn = new Date(ref); dn.setDate(ref.getDate() + i);
        b.push({ wd: (i + 1) % 7, from: from, l: dn.toLocaleDateString(lang, { weekday: 'short' }).replace(/\.$/, ''), hot: ((i + 1) % 7) === today.getDay() });
      }
    }
    b.forEach(function (x) { x.show = true; });
    var tot = 0, max = 0;
    b.forEach(function (x) {
      x.v = 0;
      gains.forEach(function (g) {
        var ms = g[0] * 1000;
        if (x.wd != null) { if (ms >= x.from && new Date(ms).getDay() === x.wd) x.v += g[1]; }
        else if (ms >= x.s && ms < x.e) x.v += g[1];
      });
      tot += x.v; if (x.v > max) max = x.v;
    });
    // v2491 — chaque barre porte son montant au-dessus (ce que tu as gagné ce jour-là) ; le chiffre en haut à
    // droite = total de toutes les barres. Dessin à la vraie largeur de la case (texte jamais étiré).
    var W = Math.max(220, Math.round((box.clientWidth || 320) - 22)), H = 34, TOP = 13, n2 = b.length, gap = 6, bw = (W - gap * (n2 - 1)) / n2, svg = '';
    var short = function (v) {
      if (v >= 10000) return '+' + Math.round(v / 1000) + 'k';
      if (v >= 1000) return '+' + (Math.round(v / 100) / 10).toLocaleString() + 'k';
      return '+' + (Math.round(v * 100) / 100).toLocaleString(undefined, { maximumFractionDigits: v >= 100 ? 0 : 2 });
    };
    b.forEach(function (x, k) {
      var h = max > 0 ? Math.max(x.v > 0 ? 4 : 2, x.v / max * H) : 2;
      var X = k * (bw + gap);
      svg += '<rect x="' + X.toFixed(1) + '" y="' + (TOP + H - h).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="' + Math.min(4, bw / 3).toFixed(1) +
        '" fill="' + (x.hot ? '#3DDC97' : (x.v > 0 ? 'rgba(61,220,151,.5)' : 'rgba(255,255,255,.10)')) + '"/>';
      // Montant écrit petit ; il rétrécit encore s'il est plus large que sa barre (jamais de chevauchement).
      if (x.v > 0) { var lab = short(x.v), fsz = Math.max(6, Math.min(8, (bw + gap - 3) / (lab.length * 0.58)));
        svg += '<text x="' + (X + bw / 2).toFixed(1) + '" y="' + (TOP + H - h - 3).toFixed(1) + '" fill="' + (x.hot ? '#3DDC97' : '#C9F5E2') + '" font-size="' + fsz.toFixed(1) + '" font-weight="700" text-anchor="middle" direction="ltr" unicode-bidi="embed">' + esc(lab) + '</text>'; }
      svg += '<text x="' + (X + bw / 2).toFixed(1) + '" y="' + (TOP + H + 12) + '" fill="' + (x.hot ? '#3DDC97' : '#9AA4CC') + '" font-size="' + Math.max(6.5, Math.min(9, (bw + gap - 2) / (String(x.l).length * 0.55))).toFixed(1) + '" text-anchor="middle">' + esc(x.l) + '</text>';
    });
    var sub = affFilter === 'all' ? t('affGW') : (affFilter === 'month' ? t('affG30') : t('affG7'));
    box.innerHTML = '<div class="ag-h"><span>' + esc(t('affGT')) + ' · ' + esc(sub) + '</span><b>+' + esc(money(tot)) + '</b></div>' +
      '<svg viewBox="0 0 ' + W + ' ' + (TOP + H + 15) + '" width="100%" height="' + (TOP + H + 15) + '" aria-hidden="true">' + svg + '</svg>';
  }
  // Aperçu (3 derniers amis) sous les carrés + page complète « Voir plus » (filtre, totaux, tous les amis).
  function renderAffList() {
    if (!aff || !$('affRows')) return;
    var all = (aff.list || []).filter(function (r) { return Number(r.deposit || 0) > 0; });
    $('affRows').innerHTML = all.length ? all.slice(0, 2).map(affRowHtml).join('') : '<p class="aff-empty">' + esc(t('affEmptyAll')) + '</p>';
    show($('affMore'), all.length > 0);
    if (!$('affRowsAll')) return;
    // v2491 : périodes en jours entiers (aujourd'hui, les 7 / 30 derniers jours depuis minuit), comme le graphique.
    var midnight = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
    var from = affFilter === 'day' ? midnight
      : affFilter === 'week' ? midnight - 6 * 86400 : affFilter === 'month' ? midnight - 29 * 86400 : 0;
    var rows = all.filter(function (r) { return r.at >= from; });
    var dep = 0, gain = 0;
    rows.forEach(function (r) { dep += Number(r.deposit || 0); gain += Number(r.gift || 0); });
    // v2491 : « Tu as gagné » = gains vraiment reçus pendant la période (même chiffre que le graphique)
    // ; « Tout » = tout ce qui a été gagné depuis le début.
    if (Array.isArray(aff.gains)) {
      gain = affFilter === 'all' ? Number(aff.earned || 0) : aff.gains.reduce(function (s, g) { return s + (Number(g[0]) >= from ? Number(g[1]) || 0 : 0); }, 0);
    }
    // v2491 — page « Voir plus » rangée comme la page Invitation :
    // ligne 1 : clics · amis inscrits · amis qui ont déposé ; ligne 2 : total déposé · nombre de dépôts · tu as gagné ;
    // ligne 3 : dépôt moyen · plus gros dépôt ; puis le petit graphique des gains (suit la période choisie).
    var signed = (aff.list || []).filter(function (r) { return r.at >= from; }).length;
    var nDep = rows.reduce(function (s, r) { return s + affN(r); }, 0);
    var nPaid = rows.length;
    // v2492 : totaux de la période calculés par le serveur sur TOUS les amis (aucune limite).
    var P = aff.periods && aff.periods[affFilter];
    if (P) { signed = Number(P.signed) || 0; nPaid = Number(P.paid) || 0; dep = Number(P.dep) || 0; nDep = Number(P.n) || 0; gain = Number(P.gain) || 0; }
    if ($('affSum')) $('affSum').innerHTML = '<div><b>' + affInt(aff.clicks) + '</b><span>' + esc(t('affClicks')) + '</span></div>' +
      '<div><b>' + affInt(signed) + '</b><span>' + esc(t('affFriends')) + '</span></div>' +
      '<div><b>' + affInt(nPaid) + '</b><span>' + esc(t('affDeposited')) + '</span></div>' +
      '<div><b>' + esc(money(dep)) + '</b><span>' + esc(t('affTotal')) + '</span></div>' +
      '<div class="gold"><b>' + affInt(nDep) + '</b><span>' + esc(t('affNDepS')) + '</span></div>' +
      '<div class="gold"><b>+' + esc(money(gain)) + '</b><span>' + esc(t('affEarned')) + '</span></div>';
    var biggest = 0;
    rows.forEach(function (r) { biggest = Math.max(biggest, Number(r.deposit || 0)); });
    if (P) biggest = Number(P.big) || 0;
    if ($('affSum2')) $('affSum2').innerHTML = '<div><span>' + esc(t('affAvg')) + '</span><b>' + esc(money(nPaid ? dep / nPaid : 0)) + '</b></div>' +
      '<div><span>' + esc(t('affBiggest')) + '</span><b>' + esc(money(biggest)) + '</b></div>';
    renderAffGraph();
    fitAffNumbers();
    // Recherche par numéro ORO (« 7030 », « oro-703098 »…) et tri choisi.
    var q = String(($('affSearch') && $('affSearch').value) || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    var shown = rows.filter(function (r) { return !q || String(r.id || '').toUpperCase().replace(/[^A-Z0-9]/g, '').indexOf(q) >= 0; });
    // v2492 : plus de 2 000 amis → la recherche se fait sur le serveur, parmi TOUS les amis.
    if (q && aff.more) {
      if (affFound && affFound.q === q) shown = affFound.rows.slice();
      else { clearTimeout(affSearchT); affSearchT = setTimeout(function () { affServerSearch(q); }, 450); }
    }
    shown.sort(function (a, b) {
      if (affSortBy === 'dep') return Number(b.deposit || 0) - Number(a.deposit || 0);
      if (affSortBy === 'gain') return Number(b.gift || 0) - Number(a.gift || 0);
      return Number(b.at || 0) - Number(a.at || 0);
    });
    $('affRowsAll').innerHTML = shown.length ? shown.map(affRowHtml).join('') : '<p class="aff-empty">' + esc(t(q ? 'affNoMatch' : 'affEmpty')) + '</p>';
  }
  function tickLists() {
    var els = document.querySelectorAll('#affRows .ar-left, #affRowsAll .ar-left');
    for (var i = 0; i < els.length; i++) els[i].textContent = daysOnly(Number(els[i].getAttribute('data-until')));
    if (bon && bon.enabled && $('bonTimer')) $('bonTimer').innerHTML = ICO_CLOCK + '<span>' + esc(daysLeft(bon.phase === 'filling' ? bon.until : bon.weekEnd)) + '</span>';
    if (top && top.enabled && $('topTimer')) $('topTimer').innerHTML = ICO_CLOCK + '<span>' + esc(top.prev ? t('topEnded') : daysLeft(top.endsAt)) + '</span>';
  }
  function giftPopup(amount) {
    var box = document.createElement('div');
    box.className = 'defi-win';
    box.innerHTML = '<div class="dw-in"><div class="dw-rays"></div><div class="dw-cup">' + ICO_GIFT + '</div><div class="dw-t"></div><div class="dw-a"></div></div>';
    sparkle(box);
    box.querySelector('.dw-t').textContent = t('affGiftTitle');
    box.querySelector('.dw-a').textContent = '+' + money(amount);
    document.body.appendChild(box);
    setTimeout(function () { box.classList.add('out'); }, 3200);
    setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 3800);
  }
  async function refreshAff() {
    clearTimeout(affT);
    if (!loggedIn()) { if (!guestGift()) aff = null; renderAff(); return; }
    var r = await call('affStatus', { tz: new Date().getTimezoneOffset() });
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
      return '<div class="tp tp' + place + (r.me ? ' me' : '') + '"><div class="tp-medal">' + ICO_MEDAL + '<em>' + place + '</em></div><b>' + esc(String(r.id || '').replace(/^ORO-(\d+)$/, 'ORO$1')) + '</b>' +
        oroAmt(r.points) + '<div class="tp-step"></div></div>';
    }).join('');
    var rest = list.slice(3);
    if (!list.length) $('topRows').innerHTML = '<p class="aff-empty">' + esc(t('topEmpty')) + '</p>';
    else {
      // v2436 — classement en 4 groupes bien distincts (donner envie de monter) : Top 10 (or), 11–20, 21–30, 31–50.
      var lastTier = 0;
      $('topRows').innerHTML = rest.map(function (r) {
        var tier = r.rank <= 10 ? 1 : r.rank <= 20 ? 2 : r.rank <= 30 ? 3 : 4;
        var head = '';
        if (tier !== lastTier) {
          lastTier = tier;
          head = '<div class="tr-tier tt' + tier + '"><span>' + ['', 'TOP 10', '11 – 20', '21 – 30', '31 – 50'][tier] + '</span></div>';
        }
        return head + '<div class="tr tt' + tier + (r.me ? ' me' : '') + '"><em>' + r.rank + '</em><b>' + esc(String(r.id || '').replace(/^ORO-(\d+)$/, 'ORO$1')) + '</b>' + oroAmt(r.points) + '</div>';
      }).join('');
    }
    var me = top.me || {};
    var txt;
    if (top.guest) txt = t('topGuest');
    else if (topPrev) txt = me.rank ? t('topPrevMe', { r: me.rank, p: me.points }) : t('topPrevNone');
    else if (me.rank) txt = t('topMeRank', { r: me.rank, p: me.points });
    else if (me.need > 0) txt = t('topMeNeed', { n: me.need });
    else txt = t('topMeOut', { p: me.points });
    $('topMe').innerHTML = '<svg class="pi" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-3.6 3.6-5.6 7-5.6s6.2 2 7 5.6"/></svg><span></span>';
    $('topMe').lastChild.innerHTML = esc(txt).replace(/([-\u2212]\s?)?(\d[\d\u00a0.,]*(?:\s\d{3})*)\s?ORO/g, function (m0, neg, num) { return oroAmt((neg ? '-' : '') + num.replace(/[^\d]/g, '')); });
    $('topMe').classList.toggle('in', !!me.rank && me.rank <= (top.show || 25));
    // v2450 — visiteur : seulement « Joue 20 trades démo pour entrer ! » (le 2e message « Inscris-toi… » est retiré).
    $('topMe').style.display = top.guest ? 'none' : '';
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
    // v2764 (propriétaire) : le VISITEUR voit aussi le Top 50 de la semaine (lecture seule, top-public.php)
    if (!loggedIn()) {
      var g = null;
      try { var rq = await fetch('top-public.php' + (topPrev ? '?prev=1' : ''), { cache: 'no-store' }); g = await rq.json(); } catch (eG) { g = null; }
      if (g && g.ok && g.enabled) { if (g.now) skew = g.now - Date.now() / 1000; top = g; } else if (!guestGift()) top = null;
      renderTop(); return;
    }
    var r = null;
    try { r = await D6.Api.post('topStatus', topPrev ? { prev: 1 } : {}, 15000); } catch (e) { r = null; }
    if (r && r.ok !== false) {
      if (r.now) skew = r.now - Date.now() / 1000;
      top = r;
      renderTop();
    }
    // v2518 — mise à jour du classement SEULEMENT quand le joueur le regarde (Cadeaux ouvert, onglet Tournoi, page visible).
    // Avant : chaque joueur connecté interrogeait le serveur toutes les ~3 min, même sans jamais ouvrir les Cadeaux.
    // Ouvrir les Cadeaux / l'onglet Tournoi recharge déjà le classement (openPortal, setTab).
    if (r && r.enabled) topT = setTimeout(function () { if (!document.hidden && portalOpen() && curTab === 'top') refreshTop(); }, 60000);
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
        // v2465 (demande du propriétaire) : l'argent du bonus arrive petit à petit dans le solde SANS message à chaque fois ;
        // un seul message « Bonus complet ! » quand il est entièrement rempli.
        if (r.phase === 'full') {
          // v2463 — compte admin (mode test, argent DÉMO seulement) : c'est écrit dessus, pour ne pas le prendre pour du vrai argent.
          bigToast(ICO_GIFT, t('bonDoneT'), '+' + money(Number(r.credited)) + (r.test ? ' · TEST ADMIN (DÉMO)' : ''), 'dw-start');
        }
        if (D6.Supabase && D6.Supabase.pullVault) { try { D6.Supabase.pullVault(); } catch (eV) { /* ignore */ } }
      }
    }
    // Pendant le remplissage : on revérifie toutes les 20 s (le bonus monte pendant que le joueur joue).
    // Bonus en train de se remplir : toutes les 45 s (pour verser les paliers) ; sinon seulement Récompenses ouvertes.
    if (r && r.enabled && (r.phase === 'filling' || portalOpen())) bonT = setTimeout(function () { if (!document.hidden) refreshBon(); else bonT = setTimeout(refreshBon, 60000); }, r.phase === 'filling' ? 45000 : 60000);
  }

  var ICO_LOCK = '<svg class="pi" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.2"/><path d="M8.5 10.5V7.8a3.5 3.5 0 0 1 7 0v2.7"/><circle cx="12" cy="15.4" r="1.3" class="pi-fill"/></svg>';
  function setTab(name) {
    // v2662 (propriétaire) : visiteur → Invitation réservée aux inscrits (ni lien ni explication) : notification puis inscription.
    if (name === 'aff' && guestGift()) { needAccount(); return; }
    curTab = name;
    show($('defiCard'), name === 'defi');
    show($('affCard'), name === 'aff');
    show($('topCard'), name === 'top');
    show($('bonCard'), name === 'bon');
    if ($('portalModal')) {
      $('portalModal').classList.toggle('aff-on', name === 'aff');
      $('portalModal').classList.toggle('top-on', name === 'top');
      $('portalModal').classList.toggle('bon-on', name === 'bon');
      $('portalModal').classList.toggle('defi-on', name === 'defi');
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
    if (full) { affFilter = 'all'; document.querySelectorAll('#affFilter button').forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-f') === 'all'); }); }
    // v2437 — page des amis : pas de grande planète (place pour la liste, la recherche et le tri).
    if ($('affCard')) $('affCard').classList.toggle('full-on', !!full);
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
  // Clic sur un lien d'ami (orolado.com/r/CODE) : envoyé une fois ; le serveur filtre par téléphone et par jour.
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
      // v2490 (propriétaire) : « Partager » ouvre directement WhatsApp (plus le menu du téléphone avec SMS…).
      var wa = 'https://wa.me/?text=' + encodeURIComponent(t('affShareText') + ' ' + link);
      var win = null;
      try { win = window.open(wa, '_blank'); if (win) win.opener = null; } catch (e) { win = null; }
      if (!win) location.href = wa;
    });
    if ($('affMore')) $('affMore').addEventListener('click', function () { showAffList(true); });
    // v2437 — recherche (à chaque lettre) et tri.
    if ($('affSearch')) $('affSearch').addEventListener('input', renderAffList);
    document.querySelectorAll('#affSort button').forEach(function (bt) {
      bt.addEventListener('click', function () {
        affSortBy = bt.getAttribute('data-s') || 'new';
        document.querySelectorAll('#affSort button').forEach(function (x) { x.classList.toggle('on', x === bt); });
        renderAffList();
      });
    });
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
      armReturn();
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
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { refreshAff(); if (portalOpen() && curTab === 'top') refreshTop(); } });
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
  // v2422 — lignes propres dans toutes les langues : un texte qui déborde d'à peine sur une ligne de plus
  // (dernier mot presque seul) est très légèrement réduit (jusqu'à -10 %) pour tenir sur une ligne de moins ;
  // sinon les lignes sont équilibrées (pas de mot orphelin). Aucun texte ne peut en chevaucher un autre.
  var FIT_SEL = 'p, small, li > span, .aff-big b, .top-me > span, .bon-state, .bm-top span, .aff-stats span, .ar-id span';
  function lineInfo(el) {
    var r = document.createRange();
    r.selectNodeContents(el);
    var rects = r.getClientRects(), tops = [], lastL = 1e9, lastR = -1e9, lastTop = -1e9;
    for (var i = 0; i < rects.length; i++) {
      var q = rects[i];
      if (q.width < 1) continue;
      var tp = Math.round(q.top);
      if (tops.every(function (x) { return Math.abs(x - tp) > 3; })) tops.push(tp);
      if (tp > lastTop + 3) { lastTop = tp; lastL = q.left; lastR = q.right; }
      else if (Math.abs(tp - lastTop) <= 3) { lastL = Math.min(lastL, q.left); lastR = Math.max(lastR, q.right); }
    }
    var w = el.clientWidth || 1;
    return { n: tops.length, fill: (lastR - lastL) / w };
  }
  function fitLines(box) {
    var els = box.querySelectorAll(FIT_SEL);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (!el.offsetParent || !el.textContent.trim()) continue;
      el.style.fontSize = '';
      el.style.letterSpacing = '';
      el.style.textWrap = '';
      var a = lineInfo(el);
      if (a.n < 2 || a.fill > 0.45) continue;
      var base = parseFloat(getComputedStyle(el).fontSize) || 13, done = false;
      for (var k = 0.97; k >= 0.885; k -= 0.02) {
        el.style.setProperty('font-size', (base * k).toFixed(2) + 'px', 'important');
        el.style.setProperty('letter-spacing', '-0.01em', 'important');
        if (lineInfo(el).n < a.n) { done = true; break; }
      }
      if (!done) { el.style.fontSize = ''; el.style.letterSpacing = ''; el.style.textWrap = a.n === 2 ? 'balance' : 'pretty'; }
    }
  }
  function fitPortal() {
    clearTimeout(fitT);
    fitT = setTimeout(function () {
      var box = document.querySelector('#portalModal .portal-box');
      var m = $('portalModal');
      if (box && m && m.classList.contains('active')) fitLines(box);
      if (!box || !m || !m.classList.contains('active') || window.innerWidth >= 860) return;
      // v2419 : plus de resserrage (zoom) : les cartes ont toutes la même taille et défilent si besoin.
      for (var z = 0; z < box.children.length; z++) if (box.children[z].id !== 'ghGrid') box.children[z].style.zoom = '';
      // v2808 : l'accueil Cadeaux (tuiles) se resserre juste assez pour tenir dans l'écran (js/gifts-home.js)
      if (D6.GiftsHome && D6.GiftsHome.fit && m.classList.contains('gh-home')) D6.GiftsHome.fit();
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

  D6.Portal = { armReturn: armReturn, refresh: refresh, open: openPortal, refreshAff: refreshAff, refreshTop: refreshTop, refreshBon: refreshBon, tab: setTab, fit: fitPortal };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})(window.D6 = window.D6 || {});
