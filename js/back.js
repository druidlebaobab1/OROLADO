/**
 * v2465 — Bouton RETOUR du téléphone (Android, geste retour d'iPhone, retour du navigateur) : comme dans les grandes
 * applications, quand une fenêtre est ouverte (reçu, historique, profil, guide, cadeaux…), le retour ne quitte pas le site.
 * v2808 (propriétaire) — le retour remonte d'UN niveau à la fois, exactement comme la flèche ‹ de la page :
 * conversation → liste Social → accueil ; étape crypto → choix du dépôt → accueil ; jeu → salle de jeux → accueil ;
 * page Cadeaux → accueil Cadeaux → accueil ; inscription ouverte depuis une page → cette page.
 * Une seule entrée dans l'historique du navigateur (jamais d'empilement), remise après chaque retour tant qu'une
 * fenêtre reste ouverte. Affichage seulement : rien n'est envoyé au serveur.
 */
(function (D6) {
  'use strict';
  if (!window.history || !history.pushState) return;
  var guard = false;   // une entrée « fenêtre ouverte » est dans l'historique du navigateur
  var skip = 0;        // retours lancés par nous-mêmes (à ignorer)

  function $(id) { return document.getElementById(id); }
  function shown(e) {
    if (!e || e.hidden || !e.getClientRects().length) return false;
    var cs = getComputedStyle(e);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.pointerEvents !== 'none';
  }
  function rcpt() { var m = $('rcptModal'); return m && m.classList.contains('on') ? m : null; }
  function learn() { var m = $('learnModal'); return m && m.classList.contains('on') ? m : null; }
  function coach() { var m = $('coachModal'); return m && m.classList.contains('on') ? m : null; }
  function modals() {
    var list = document.querySelectorAll('.modal-backdrop.active');
    var out = [];
    for (var i = 0; i < list.length; i++) if (getComputedStyle(list[i]).display !== 'none') out.push(list[i]);
    return out;
  }
  function drawer() { var d = $('drawerProfile'); return d && d.classList.contains('on') ? d : null; }
  // Page d'inscription ouverte par-dessus le site (avec sa flèche « Retour ») : un niveau elle aussi.
  function auth() { var a = $('screenAuth'), b = $('btnAuthBack'); return a && getComputedStyle(a).display !== 'none' && b && shown(b) ? a : null; }
  function anyOpen() { return !!(rcpt() || learn() || coach() || modals().length || drawer() || auth()); }

  // Boutons « retour d'un niveau » (en premier) puis « fermer », dans une fenêtre.
  var BACK = '.sx-bk,#sxClose,#lfBack,.lf-back,#liveBack,.live-back,.lgu-back,.cs-back,.gh-back,.crypto-back,.aff-back,.t-back,[data-back]';
  var CLOSE = '.btn-close,[data-close],.modal-close';
  // Le bouton est-il vraiment visible et touchable (pas caché sous une autre page) ?
  function tappable(b) {
    if (!shown(b)) return false;
    var r = b.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return false;
    var x = Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1), y = Math.min(Math.max(r.top + r.height / 2, 1), innerHeight - 1);
    var hit = document.elementFromPoint(x, y);
    return !hit || hit === b || b.contains(hit) || hit.contains(b);
  }
  function pick(root, sel) {
    var list = root.querySelectorAll(sel), best = null;
    for (var i = 0; i < list.length; i++) if (tappable(list[i])) best = list[i]; // le dernier = la page la plus profonde
    return best;
  }
  // Remonte d'un niveau dans une fenêtre : petite feuille / photo agrandie d'abord, puis la flèche ‹, puis la croix.
  function stepBack(m) {
    var sh = m.querySelector('.sx-lb:not([hidden]), .sx-sheet:not([hidden])');
    if (sh && shown(sh)) { sh.dispatchEvent(new MouseEvent('click', { bubbles: true })); return true; }
    var cs = $('csSheet');
    if (cs && m.contains(cs) && !cs.hidden && shown(cs)) { var cb = pick(m, '.cs-back'); if (cb) { cb.click(); return true; } }
    var b = pick(m, BACK) || pick(m, CLOSE);
    if (b) { b.click(); return true; }
    var any = m.querySelector(CLOSE);
    if (any) { any.click(); return true; }
    return false;
  }

  // Ferme (ou remonte d'un niveau dans) la fenêtre du dessus, avec ses propres boutons.
  function closeTop() {
    var c = coach();
    if (c) { var later = c.querySelector('.coach-later'); if (later) later.click(); else c.classList.remove('on'); return; }
    var r = rcpt();
    if (r) { var b = r.querySelector('.rc-back'); if (b) b.click(); else r.classList.remove('on'); return; }
    if (learn()) { if (D6.Learn && D6.Learn.close) D6.Learn.close(); return; }
    var ms = modals();
    if (ms.length) {
      var top = ms[ms.length - 1], best = -1;
      ms.forEach(function (m) { var z = parseInt(getComputedStyle(m).zIndex, 10) || 0; if (z >= best) { best = z; top = m; } });
      if (!stepBack(top)) top.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return;
    }
    if (auth()) { $('btnAuthBack').click(); return; }
    var d = drawer();
    if (d) { var cl = $('btnCloseDrawer'); if (cl) cl.click(); }
  }

  function push() { try { history.pushState({ oroLayer: 1 }, ''); guard = true; } catch (e) { /* ignore */ } }
  var t = 0;
  function sync() {
    clearTimeout(t);
    t = setTimeout(function () {
      var open = anyOpen();
      if (open && !guard) push();
      else if (!open && guard) {
        // Fenêtre fermée par un clic : on retire l'entrée ajoutée, sans quitter le site.
        guard = false;
        if (history.state && history.state.oroLayer) { skip++; try { history.back(); } catch (e2) { skip--; } }
      }
    }, 60);
  }

  var busyAt = 0;
  window.addEventListener('popstate', function () {
    if (skip > 0) { skip--; sync(); return; } // une fenêtre a pu s'ouvrir pendant ce retour : on remet l'entrée
    if (!guard) return;
    guard = false;
    if (!anyOpen()) return;
    // Deux retours très rapprochés (geste répété) : un seul niveau, et le site reste ouvert.
    var now = Date.now();
    if (now - busyAt > 250) { busyAt = now; closeTop(); }
    // Encore une page ouverte : la prochaine flèche du téléphone remontera encore d'un niveau (sans quitter le site).
    setTimeout(function () { if (anyOpen() && !guard) push(); else sync(); }, 0);
  });

  try {
    new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) {
        var el = list[i].target;
        if (el.id === 'rcptModal' || el.id === 'learnModal' || el.id === 'drawerProfile' || el.id === 'coachModal' || el.id === 'screenAuth' || (el.classList && el.classList.contains('modal-backdrop'))) { sync(); return; }
      }
    }).observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true });
    // La page d'inscription s'affiche par son style (display) : observée seule (léger).
    var sa = $('screenAuth');
    if (sa) new MutationObserver(sync).observe(sa, { attributes: true, attributeFilter: ['style', 'class'] });
  } catch (e) { /* ignore */ }
  D6.Back = { step: closeTop, open: anyOpen };

  /* ======================================================================================================
     v2812 (propriétaire, round 4) — ANTI DOUBLE-TOUCHER GLOBAL. Quand une page s'ouvre, se ferme ou change de niveau
     (jeu ↔ salle de jeux, Social menu ↔ discussion, Cadeaux accueil ↔ page, profil…), ou quand on touche une flèche ‹ / ✕,
     les touchers des 0,35 s suivants sont ignorés : un double / triple toucher rapide agit UNE seule fois et ne « traverse »
     jamais vers ce qui se trouve dessous (autre menu, bouton « Miser » du jeu qui vient de s'ouvrir…).
     Seuls les vrais touchers sont filtrés (les clics lancés par le code passent).
     ====================================================================================================== */
  var NAV_MS = 350, navUntil = 0;
  function navLock(ms) { var u = Date.now() + (ms || NAV_MS); if (u > navUntil) navUntil = u; }
  var GUARD_SEL = BACK + ',' + CLOSE + ',#closeLive,#liveBack,#ghBack,#csBack,#sxClose,#sxCBack,#sxPBack,#btnCloseDrawer,#btnAuthBack,.rc-back';
  function tapGuard(e) {
    if (!e.isTrusted) return;
    var now = Date.now();
    if (now < navUntil) {
      // la saisie au clavier n'est jamais bloquée
      var t = e.target;
      if (t && t.closest && t.closest('input, textarea, select, [contenteditable="true"]')) return;
      e.stopImmediatePropagation(); e.stopPropagation();
      if (e.type === 'click' || e.type === 'touchend' || e.type === 'mouseup' || e.type === 'pointerup' || e.type === 'dblclick') { try { if (e.cancelable) e.preventDefault(); } catch (x) { /* ignore */ } }
      return;
    }
    // toucher sur une flèche ‹ / ✕ : les touchers suivants (geste répété) sont ignorés un instant
    if (e.type === 'click') {
      var b = e.target && e.target.closest ? e.target.closest(GUARD_SEL) : null;
      if (b) setTimeout(function () { navLock(); }, 0);
    }
  }
  ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'click', 'dblclick'].forEach(function (ty) {
    window.addEventListener(ty, tapGuard, { capture: true, passive: false });
  });
  // Changement de « niveau » d'une page (ouverte / fermée / jeu ↔ salle…) → verrou court
  var SIG_CLS = ['active', 'on', 'in-game', 'sx-on', 'lv-at-home', 'gh-home', 'gh-sub', 'pred-only'];
  function sigOf(el) {
    var out = '';
    for (var i = 0; i < SIG_CLS.length; i++) if (el.classList.contains(SIG_CLS[i])) out += SIG_CLS[i] + ' ';
    return out + (el.getAttribute('data-g') || '');
  }
  function watchLevels() {
    try {
      var mo = new MutationObserver(function (list) {
        for (var i = 0; i < list.length; i++) {
          var el = list[i].target;
          if (!el || !el.classList) continue;
          var sg = sigOf(el);
          if (el._oroSig !== sg) { el._oroSig = sg; navLock(); saveSoon(); }
        }
      });
      var hook = function () {
        document.querySelectorAll('.modal-backdrop, #drawerProfile, #rcptModal, #learnModal, #coachModal').forEach(function (el) {
          if (el._oroLv) return; el._oroLv = 1; el._oroSig = sigOf(el);
          if (/\b(active|on)\b/.test(el._oroSig)) navLock(); // page créée et ouverte d'un coup (1re ouverture des Jeux…)
          mo.observe(el, { attributes: true, attributeFilter: ['class', 'data-g'] });
        });
      };
      hook();
      new MutationObserver(hook).observe(document.body, { childList: true });
    } catch (e) { /* ignore */ }
  }

  /* ======================================================================================================
     v2812 (propriétaire, round 4) — L'ACTUALISATION GARDE TA PLACE. On retient (dans cet onglet seulement, sessionStorage)
     la page où l'on est : jeu du casino ouvert, salle de jeux, Paris / Mes paris, Social (menu, messagerie, discussion,
     page), Cadeaux (et sa page), Apprendre, Profil, Recharger. Après une actualisation (ou une coupure réseau qui
     recharge la page), on y revient tout seul au lieu d'atterrir sur le trading. Fermer une page → on retient « trading ».
     Affichage seulement : rien n'est envoyé au serveur.
     ====================================================================================================== */
  var RKEY = 'oro_route', restoring = false, restoredAt = 0;
  function isOn(id, cls) { var e = $(id); return !!(e && e.classList.contains(cls || 'active')); }
  function authShown() { var a = $('screenAuth'); return !!(a && getComputedStyle(a).display !== 'none' && !a.classList.contains('hidden')); }
  function route() {
    var r = { s: 'trade' };
    if (authShown()) return { s: 'auth' };
    if (isOn('learnModal', 'on')) r = { s: 'learn' };
    else if (isOn('portalModal')) {
      r = { s: 'gifts', sub: '' };
      if (isOn('liveModal')) r.under = 'social'; // Cadeaux ouvert depuis Social : Social reste dessous
      try { if (D6.GiftsHome && D6.GiftsHome.sub) r.sub = D6.GiftsHome.sub() || ''; } catch (e) { /* ignore */ }
    } else if (isOn('liveModal')) {
      r = { s: 'social' };
      try { var st = D6.Live && D6.Live.state ? D6.Live.state() : null; if (st) { r.tab = st.tab; r.sub = st.sub || ''; } } catch (e) { /* ignore */ }
      try { if (D6.Social2 && D6.Social2.active && D6.Social2.active() && $('liveModal').classList.contains('sx-on')) r.sx = D6.Social2.state(); } catch (e) { /* ignore */ }
    } else if (isOn('casinoModal')) {
      var cm = $('casinoModal');
      r = { s: 'casino', v: cm.classList.contains('pred-only') ? 'pred' : 'games', g: '' };
      var tab = cm.querySelector('.cs-tabs2 [data-v].on');
      if (r.v !== 'pred' && tab) r.v = tab.getAttribute('data-v') === 'sports' ? 'sports' : 'games';
      if (cm.classList.contains('in-game')) {
        r.g = cm.getAttribute('data-g') || '';
        if (!r.g) { try { r.g = sessionStorage.getItem('oro_cg') || ''; } catch (e) { /* ignore */ } }
      }
      r.mine = !!cm.querySelector('.sp2-tabs [data-sv="mine"].on');
    } else if (isOn('drawerProfile', 'on')) r = { s: 'profile' };
    if (isOn('depositModal') && r.s !== 'learn') r.dep = 1;
    if (r.s === 'trade' && r.dep) r = { s: 'deposit' };
    return r;
  }
  function save() {
    if (restoring) return;
    try { var r = route(); r.t = Date.now(); sessionStorage.setItem(RKEY, JSON.stringify(r)); } catch (e) { /* ignore */ }
  }
  var saveT = 0;
  function saveSoon() { if (restoring) return; clearTimeout(saveT); saveT = setTimeout(save, 250); }
  window.addEventListener('pagehide', save);
  window.addEventListener('beforeunload', save);
  document.addEventListener('visibilitychange', function () { if (document.hidden) save(); });
  document.addEventListener('click', function () { setTimeout(saveSoon, 30); }, true);

  function wait(test, ms) {
    return new Promise(function (res) {
      var t0 = Date.now();
      (function loop() { var ok = false; try { ok = !!test(); } catch (e) { ok = false; } if (ok) return res(true); if (Date.now() - t0 > ms) return res(false); setTimeout(loop, 80); })();
    });
  }
  function ready() {
    var h = document.documentElement, st = $('screenTrade');
    return h.classList.contains('oro-booted') && st && !st.classList.contains('hidden') && D6.App && D6.App.openModal;
  }
  function unveil() { try { document.documentElement.classList.remove('oro-restoring'); } catch (e) { /* ignore */ } }
  async function restore(r) {
    restoring = true;
    setTimeout(unveil, 2500); // jamais plus longtemps : au pire on voit le trading
    try {
      if (r.s === 'casino') {
        if (!(await wait(function () { return D6.Casino && D6.Casino.open; }, 6000))) return;
        if (r.v === 'pred' && !r.g) D6.Casino.openPred();
        else if (r.g) {
          for (var i = 0; i < 6; i++) {
            D6.Casino.open(r.g);
            var ok = await wait(function () { var m = $('casinoModal'); return m && m.classList.contains('in-game') && m.getAttribute('data-g') === r.g; }, 1200);
            if (ok || !isOn('casinoModal')) break;
          }
          if (!isOn('casinoModal', 'in-game') && isOn('casinoModal') && D6.Casino.home) D6.Casino.home('games'); // jeu retiré : la salle de jeux
        } else { D6.Casino.open(null, 'games'); if (r.v === 'sports' && D6.Casino.home) D6.Casino.home('sports'); }
        if (r.mine) {
          await wait(function () { return document.querySelector('#casinoModal .sp2-tabs [data-sv="mine"]'); }, 4000);
          var mb = document.querySelector('#casinoModal .sp2-tabs [data-sv="mine"]'); if (mb && !mb.classList.contains('on')) mb.click();
        }
      } else if (r.s === 'social') {
        if (!(D6.Live && D6.Live.open)) return;
        if (r.sx) {
          D6.Live.open('grid');
          if (await wait(function () { return D6.Social2 && D6.Social2.open; }, 6000)) {
            var w = r.sx.seg === 'groups' ? 'groups' : r.sx.seg === 'friends' ? 'friends' : '';
            if (r.sx.k === 'team') w = 'chat'; else if (r.sx.k === 'news') w = 'news';
            await D6.Social2.open(w, true);
            if (r.sx.k && r.sx.k !== 'team' && r.sx.k !== 'news' && D6.Social2.openConv) D6.Social2.openConv(r.sx.k);
          }
        } else {
          D6.Live.open('grid');
          if (r.tab && r.tab !== 'home' && D6.Live.show) D6.Live.show(r.tab, r.sub || undefined);
        }
      } else if (r.s === 'gifts') {
        if (!(D6.Portal && D6.Portal.open)) return;
        if (r.under === 'social' && D6.Live && D6.Live.open) D6.Live.open('grid');
        D6.Portal.open();
        if (r.sub && D6.GiftsHome && D6.GiftsHome.go) { await wait(function () { return isOn('portalModal'); }, 2000); await new Promise(function (z) { setTimeout(z, 120); }); D6.GiftsHome.go(r.sub); }
      } else if (r.s === 'learn') {
        if (D6.Learn && D6.Learn.open) D6.Learn.open();
      } else if (r.s === 'profile') {
        var pb = $('btnProfile'); if (pb && pb.offsetWidth) pb.click();
      }
      if ((r.dep || r.s === 'deposit') && D6.App.openDeposit) setTimeout(function () { D6.App.openDeposit(); }, 250);
    } catch (e) { /* ignore */ }
    finally { setTimeout(unveil, 60); setTimeout(function () { restoring = false; restoredAt = Date.now(); save(); }, 900); }
  }
  async function boot() {
    watchLevels();
    var r = null;
    try { r = JSON.parse(sessionStorage.getItem(RKEY) || 'null'); } catch (e) { r = null; }
    // lien avec une intention précise (notification, retour de paiement, casino=1…) : il passe avant
    var q = location.search || '';
    if (/[?&](live|casino|deposit|payment|tx_ref|transaction_id|status|reset|verify|r|ref)=/i.test(q)) return unveil();
    if (!r || !r.s || r.s === 'trade' || r.s === 'auth' || !r.t || Date.now() - r.t > 12 * 3600 * 1000) return unveil();
    if (!(await wait(ready, 9000))) return unveil();
    if (authShown() || anyOpen()) return unveil(); // une autre page s'est déjà ouverte (inscription, reçu…)
    restore(r);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  D6.Route = { save: save, get: route, lock: navLock, navMs: function (v) { if (v > 0 && v < 5000) NAV_MS = v; } }; // navMs : pour les tests seulement
})(window.D6 = window.D6 || {});
