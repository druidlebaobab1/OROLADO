/**
 * v2429 — Textes propres sur TOUT le site (même méthode que dans les Cadeaux, js/portal.js) :
 *  - quand une fenêtre s'ouvre (dépôt, retrait, profil, aide, conditions, reçu…) ou que la langue / la taille
 *    de l'écran change, chaque texte qui déborde d'à peine une ligne (dernier mot presque seul) est très
 *    légèrement réduit (au plus −10 %) pour tenir sur une ligne de moins ; sinon ses lignes sont équilibrées.
 *  - Affichage seulement : rien n'est envoyé au serveur, aucun bouton de l'écran de trading n'est touché.
 */
(function (D6) {
  'use strict';
  // Textes concernés : paragraphes, listes, petites notes, titres et étiquettes, SEULEMENT dans les fenêtres.
  var SEL = 'p, li > span, li, small, h2, h3, h4, label > span, .hint, .note';
  var SKIP = 'button, input, select, textarea, .btn-trade, .dur-chip, .odds-chip, #portalModal';

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
    return { n: tops.length, fill: (lastR - lastL) / (el.clientWidth || 1) };
  }

  function fitBox(box) {
    if (!box) return;
    var els = box.querySelectorAll(SEL);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (!el.offsetParent || el.closest(SKIP) || el.querySelector('p, li, div, button, input')) continue;
      if (!el.textContent.trim() || el.clientWidth < 80) continue;
      el.style.removeProperty('font-size');
      el.style.removeProperty('letter-spacing');
      el.style.textWrap = '';
      var a = lineInfo(el);
      if (a.n < 2 || a.fill > 0.45) continue;
      var base = parseFloat(getComputedStyle(el).fontSize) || 13, done = false;
      for (var k = 0.97; k >= 0.885; k -= 0.02) {
        el.style.setProperty('font-size', (base * k).toFixed(2) + 'px', 'important');
        el.style.setProperty('letter-spacing', '-0.01em', 'important');
        if (lineInfo(el).n < a.n) { done = true; break; }
      }
      if (!done) {
        el.style.removeProperty('font-size');
        el.style.removeProperty('letter-spacing');
        el.style.textWrap = a.n === 2 ? 'balance' : 'pretty';
      }
    }
  }

  var t = 0;
  function fitOpen() {
    clearTimeout(t);
    t = setTimeout(function () {
      try {
        var open = document.querySelectorAll('.modal-backdrop.active, .modal-backdrop.open, .toast, #screenAuth');
        for (var i = 0; i < open.length; i++) if (open[i].offsetParent || getComputedStyle(open[i]).position === 'fixed') fitBox(open[i]);
      } catch (e) { /* ignore */ }
    }, 120);
  }

  // Une fenêtre s'ouvre (classe « active »), un texte change (langue), l'écran tourne : on règle.
  try {
    var mo = new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) {
        var m = list[i];
        if (m.type === 'attributes' && m.target.classList && m.target.classList.contains('modal-backdrop')) { fitOpen(); return; }
      }
    });
    var start = function () {
      document.querySelectorAll('.modal-backdrop').forEach(function (b) { mo.observe(b, { attributes: true, attributeFilter: ['class'] }); });
      fitOpen();
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  } catch (e) { /* ignore */ }
  window.addEventListener('resize', fitOpen);
  window.addEventListener('orientationchange', fitOpen);
  document.addEventListener('oro:lang', fitOpen);
  D6.Fit = { box: fitBox, open: fitOpen };
})(window.D6 = window.D6 || {});
