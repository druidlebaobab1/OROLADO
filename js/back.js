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
    if (skip > 0) { skip--; return; }
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
})(window.D6 = window.D6 || {});
