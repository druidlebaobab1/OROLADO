/**
 * v2465 — Bouton RETOUR du téléphone (Android, geste retour d'iPhone, retour du navigateur) : comme dans les grandes
 * applications, quand une fenêtre est ouverte (reçu, historique, profil, guide, cadeaux…), le retour FERME la fenêtre
 * au lieu de quitter le site. Affichage seulement : rien n'est envoyé au serveur.
 */
(function (D6) {
  'use strict';
  if (!window.history || !history.pushState) return;
  var guard = false;   // une entrée « fenêtre ouverte » est dans l'historique du navigateur
  var skip = 0;        // retours lancés par nous-mêmes (à ignorer)

  function rcpt() { var m = document.getElementById('rcptModal'); return m && m.classList.contains('on') ? m : null; }
  function learn() { var m = document.getElementById('learnModal'); return m && m.classList.contains('on') ? m : null; }
  function modals() {
    var list = document.querySelectorAll('.modal-backdrop.active');
    var out = [];
    for (var i = 0; i < list.length; i++) if (getComputedStyle(list[i]).display !== 'none') out.push(list[i]);
    return out;
  }
  function drawer() { var d = document.getElementById('drawerProfile'); return d && d.classList.contains('on') ? d : null; }
  function anyOpen() { return !!(rcpt() || learn() || modals().length || drawer()); }

  // Ferme la fenêtre du dessus, avec ses propres boutons (les réglages du site s'appliquent normalement).
  function closeTop() {
    var r = rcpt();
    if (r) { var b = r.querySelector('.rc-back'); if (b) b.click(); else r.classList.remove('on'); return; }
    if (learn()) { if (D6.Learn && D6.Learn.close) D6.Learn.close(); return; }
    var ms = modals();
    if (ms.length) {
      var top = ms[ms.length - 1], best = -1;
      ms.forEach(function (m) { var z = parseInt(getComputedStyle(m).zIndex, 10) || 0; if (z >= best) { best = z; top = m; } });
      var x = top.querySelector('.btn-close, [data-close], .modal-close');
      if (x) x.click();
      else top.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return;
    }
    var d = drawer();
    if (d) { var c = document.getElementById('btnCloseDrawer'); if (c) c.click(); }
  }

  var t = 0;
  function sync() {
    clearTimeout(t);
    t = setTimeout(function () {
      var open = anyOpen();
      if (open && !guard) {
        try { history.pushState({ oroLayer: 1 }, ''); guard = true; } catch (e) { /* ignore */ }
      } else if (!open && guard) {
        // Fenêtre fermée par un clic : on retire l'entrée ajoutée, sans quitter le site.
        guard = false;
        if (history.state && history.state.oroLayer) { skip++; try { history.back(); } catch (e2) { skip--; } }
      }
    }, 60);
  }

  window.addEventListener('popstate', function () {
    if (skip > 0) { skip--; return; }
    if (!guard) return;
    guard = false;
    if (anyOpen()) closeTop();
    sync();
  });

  try {
    new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) {
        var el = list[i].target;
        if (el.id === 'rcptModal' || el.id === 'learnModal' || el.id === 'drawerProfile' || (el.classList && el.classList.contains('modal-backdrop'))) { sync(); return; }
      }
    }).observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true });
  } catch (e) { /* ignore */ }
})(window.D6 = window.D6 || {});
