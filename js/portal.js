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

  function openPortal() {
    var m = $('portalModal');
    if (!m) return;
    m.classList.add('active');
    m.style.removeProperty('visibility');
    m.style.setProperty('display', 'block', 'important');
    m.style.setProperty('pointer-events', 'auto', 'important');
    refresh();
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

  function render() {
    var s = state;
    var on = !!(s && s.enabled);
    show($('btnPortal'), on);
    document.documentElement.classList.toggle('portal-on', on);
    layoutTopbar(on);
    show($('defiChip'), false);
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
      go.textContent = t('defiGo', { m: mk });
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
      st.textContent = s.finished && !s.won ? t('defiLost') : '';
      st.className = 'defi-state';
      show(act, !!s.canActivate);
      show(go, false);
    }
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
        return '<span class="hc-globe" style="--p1:' + p1 + ';--p2:' + p2 + ';--pg:' + pg + '">' + art.innerHTML + '</span>';
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
    if (wasActive && r.won) celebrate(r);
    else if (r.won && r.paid) celebrate(r);
    schedule();
  }

  function schedule() {
    clearTimeout(pollT);
    if (!state || !state.enabled) return;
    // Pendant un défi : toutes les 8 s (pour suivre la série) ; sinon toutes les 60 s.
    pollT = setTimeout(function () { if (!document.hidden) refresh(); else schedule(); }, state.active ? 8000 : 60000);
  }

  function bind() {
    var b = $('btnPortal');
    if (b) b.addEventListener('click', openPortal);
    if ($('closePortal')) $('closePortal').addEventListener('click', closePortal);
    var m = $('portalModal');
    if (m) m.addEventListener('click', function (e) { if (e.target === m) closePortal(); });
    if ($('defiActivate')) $('defiActivate').addEventListener('click', async function () {
      var btn = this;
      btn.disabled = true;
      await refresh(true);
      btn.disabled = false;
    });
    if ($('defiTrade')) $('defiTrade').addEventListener('click', function () {
      closePortal();
      if (state && state.market && window.oroUi && window.oroUi.asset) {
        var id = state.market;
        window.oroUi.asset({ getAttribute: function () { return id; } });
      }
    });
    if ($('defiChip')) {
      $('defiChip').addEventListener('click', openPortal);
    }
    clearInterval(tickT);
    tickT = setInterval(function () { if (state && state.enabled && (state.active || state.won)) render(); }, 1000);
    // Connexion / déconnexion / retour sur l'onglet : on relit l'état.
    document.addEventListener('visibilitychange', function () { if (!document.hidden) refresh(); });
    var lastTok = '';
    setInterval(function () {
      var tok = (D6.Api && D6.Api.token && D6.Api.token()) || '';
      if (tok !== lastTok) { lastTok = tok; state = null; render(); if (tok) refresh(); }
    }, 1500);
  }

  D6.Portal = { refresh: refresh, open: openPortal };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})(window.D6 = window.D6 || {});
