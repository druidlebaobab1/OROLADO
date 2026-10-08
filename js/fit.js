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

  // v2430 — fenêtres d'argent en mode univers (retrait enregistré, recharge réussie) : étincelles à l'ouverture.
  var COSMO = { wdConfirmModal: 1, depositSuccessModal: 1, helpModal: 1 };
  function burst(modal) {
    try {
      if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      var box = modal.querySelector('.modal-box');
      if (!box) return;
      var old = box.querySelector('.cosmo-sp');
      if (old) old.remove();
      var sp = document.createElement('div');
      sp.className = 'cosmo-sp';
      sp.setAttribute('aria-hidden', 'true');
      var html = '';
      for (var i = 0; i < 22; i++) {
        var a = Math.round(i * 360 / 22 + Math.random() * 12), d = Math.round(80 + Math.random() * 80), z = (Math.random() * 0.35).toFixed(2);
        html += '<i style="--a:' + a + 'deg;--d:' + d + 'px;--z:' + z + 's"></i>';
      }
      sp.innerHTML = html;
      box.insertBefore(sp, box.firstChild);
      box.classList.remove('cosmo-pop');
      void box.offsetWidth;
      box.classList.add('cosmo-pop');
    } catch (e) { /* ignore */ }
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
        if (m.type === 'attributes' && m.target.classList && m.target.classList.contains('modal-backdrop')) {
          if (m.target.classList.contains('active') && COSMO[m.target.id]) burst(m.target);
          fitOpen();
          return;
        }
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
  // v2438 — MONTANTS ÉLASTIQUES partout : si un montant (10 000 $, 30 000 $, 1 250 000 ORO…) dépasse de sa case,
  // il rétrécit juste assez pour tenir (jusqu'à 55 % de sa taille) ; s'il redevient petit, sa taille revient.
  // [case qui ne doit pas déborder, montant à réduire dedans]
  var NUMS = [
    ['.topbar-mode .mode-btn', '.mb-amt'],
    ['#balanceCard .bal-stack', '.bal'],
    ['#portalModal .aff-stats > div', 'b'],
    ['#portalModal .aff-sum > div', 'b'],
    ['#portalModal .aff-sum2 > div', 'b'],
    ['#portalModal .aff-row .ar-dep', 'b'],
    ['#portalModal .aff-row .ar-gain', 'b'],
    ['#portalModal .tr', '.oro-amt'],
    ['#portalModal .tp', '.oro-amt'],
    ['#portalModal .top-me', '.oro-amt'],
    ['#portalModal .bm-top', 'b'],
    ['#portalModal .aff-big', 'b'],
    ['.modal-box', '#depositSuccessAmt'],
    ['#wdConfirmModal .wd-confirm-row', 'strong'],
    // v2450 — « Carte & paiement instantané » (toutes les langues) : rétrécit pour tenir sur une ligne.
    ['#payMethodCard .pay-method-top', '.pay-method-title'],
    // v2457 — nouveau terminal : textes des planètes payout, gain et durée élastiques (jamais de débordement).
    ['#oddsRow .odds-chip', '.odds-mult'],
    ['#oddsRow .odds-chip', '.odds-pct'],
    ['#tradeWrap .win-preview', '.amount'],
    ['#tradeWrap .win-preview', '.mult'],
    ['#tradeWrap .dur-row', '.dur-chip.on'],
    // v2460 — ACHETER / VENDRE (longs mots, ex. « VERKAUFEN ») : rétrécit seul si le bouton est étroit.
    ['#btnCall', '.bt-txt'],
    ['#btnPut', '.bt-txt']
  ];
  function fitNums() {
    if (document.hidden) return;
    for (var i = 0; i < NUMS.length; i++) {
      var boxes = document.querySelectorAll(NUMS[i][0]);
      for (var j = 0; j < boxes.length; j++) {
        var box = boxes[j];
        if (!box.offsetParent && getComputedStyle(box).position !== 'fixed') continue;
        var el = box.querySelector(NUMS[i][1]);
        if (!el) continue;
        var txt = el.textContent;
        // Texte changé ou case agrandie : on repart de la taille normale.
        if (el.getAttribute('data-fit-t') !== txt || (el.style.fontSize && box.scrollWidth < box.clientWidth * 0.85)) {
          el.style.removeProperty('font-size');
          el.setAttribute('data-fit-t', txt);
        }
        // v2458 — on compare aussi le montant à l'INTÉRIEUR réel de sa case (sans les marges intérieures).
        var bcs = getComputedStyle(box);
        var avail = box.clientWidth - (parseFloat(bcs.paddingLeft) || 0) - (parseFloat(bcs.paddingRight) || 0);
        var tooWide = function () { return box.scrollWidth > box.clientWidth + 1 || el.getBoundingClientRect().width > avail + 0.5 || (el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1); };
        if (!tooWide()) continue;
        var base = parseFloat(el.getAttribute('data-fit-fs') || '') || parseFloat(getComputedStyle(el).fontSize) || 14;
        el.setAttribute('data-fit-fs', String(base));
        var fs = parseFloat(getComputedStyle(el).fontSize) || base, guard = 0;
        while (tooWide() && fs > base * 0.55 && guard < 40) {
          fs -= 0.5;
          el.style.setProperty('font-size', fs + 'px', 'important');
          guard++;
        }
      }
    }
  }
  setInterval(fitNums, 1000);
  window.addEventListener('resize', function () { setTimeout(fitNums, 120); });

  D6.Fit = { box: fitBox, open: fitOpen, nums: fitNums };
})(window.D6 = window.D6 || {});
