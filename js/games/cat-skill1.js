/* v2812 — "You're in control" catalogue: ALL 16 games in ONE file, in the owner's order (one file = a fixed order;
   two async files used to arrive in any order). First row = the 4 RUNNERS (Hamster Run, Highway Rush, Jungle Dash,
   Metro Dash: a small gold "»" run badge makes them a family), then the 12 others. Modules: js/games/skill1.js,
   skill2.js, skill3.js. (js/games/cat-skill2.js is now empty: its games are listed here.)
   Penalty Kicker (kicker) left the list in v2807 (owner: two penalty games confused players). */
(function (D6) { if (!D6.CasinoCatalog) return;
  /* v2860 (owner: the logos must match the new game art): a round medallion showing the game's own scene and hero (an image
     rendered from the game drawing, img/games/<key>.webp) in a glossy ring; runners keep the gold "»" badge. Same 64×64 frame. */
  var RUN = '<g transform="translate(42 2)"><rect width="20" height="12" rx="6" fill="#FBBF24" stroke="#FFF7ED" stroke-width="1.2"/><path d="M6 3.4l3 2.6-3 2.6M11 3.4l3 2.6-3 2.6" stroke="#3B2300" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>';
  function medal(k, c1, c2, run) {
    return '<defs><clipPath id="IDm"><circle cx="32" cy="33" r="26.5"/></clipPath><linearGradient id="IDg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF7D6"/><stop offset=".45" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient>' +
      '<linearGradient id="IDs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
      '<circle cx="32" cy="35" r="28.5" fill="#000" opacity=".38"/><circle cx="32" cy="33" r="28.5" fill="url(#IDg)"/>' +
      '<image href="img/games/' + k + '.webp?v=2878" x="5.5" y="6.5" width="53" height="53" clip-path="url(#IDm)" preserveAspectRatio="xMidYMid slice"/>' +
      '<circle cx="32" cy="33" r="26.5" fill="url(#IDs)"/><circle cx="32" cy="33" r="26.5" fill="none" stroke="#000" stroke-opacity=".35" stroke-width=".8"/>' + (run ? RUN : '');
  }
  D6.CasinoCatalog.add([
  { k: 'hamster', name: 'Hamster Run', sec: 'skill', file: 'skill2', pal: ['#FFEDD5', '#EA580C'], icon: medal('hamster', '#FB923C', '#9A3412', 1) },
  { k: 'highway', name: 'Highway Rush', sec: 'skill', file: 'skill3', pal: ['#FCE7F3', '#DB2777'], icon: medal('highway', '#F472B6', '#831843', 1) },
  { k: 'jungledash', name: 'Jungle Dash', sec: 'skill', file: 'skill3', pal: ['#DCFCE7', '#15803D'], icon: medal('jungledash', '#4ADE80', '#14532D', 1) },
  { k: 'metrodash', name: 'Metro Dash', sec: 'skill', file: 'skill3', pal: ['#CFFAFE', '#0891B2'], icon: medal('metrodash', '#22D3EE', '#155E75', 1) },
  { k: 'spacerun', name: 'Space Runner', sec: 'skill', file: 'skill1', pal: ['#DCFCE7', '#16A34A'], icon: medal('spacerun', '#A78BFA', '#4C1D95', 0) },
  { k: 'flappyrock', name: 'Flappy Rocket', sec: 'skill', file: 'skill1', pal: ['#FFE4E6', '#E11D48'], icon: medal('flappyrock', '#FB7185', '#881337', 0) },
  { k: 'stack', name: 'Tower Stack', sec: 'skill', file: 'skill1', pal: ['#FEF3C7', '#D97706'], icon: medal('stack', '#E879F9', '#701A75', 0) },
  { k: 'knifehit', name: 'Star Blades', sec: 'skill', file: 'skill1', pal: ['#E0F2FE', '#0284C7'], icon: medal('knifehit', '#38BDF8', '#0C4A6E', 0) },
  { k: 'basket', name: 'Basket Shot', sec: 'skill', file: 'skill1', pal: ['#FFEDD5', '#EA580C'], icon: medal('basket', '#FB923C', '#7C2D12', 0) },
  { k: 'starbridge', name: 'Star Bridge', sec: 'skill', file: 'skill1', pal: ['#F3E8FF', '#9333EA'], icon: medal('starbridge', '#C084FC', '#4C1D95', 0) },
  { k: 'archer', name: 'Star Archer', sec: 'skill', file: 'skill2', pal: ['#FFE4E6', '#E11D48'], icon: medal('archer', '#FB7185', '#4C1D95', 0) },
  { k: 'slicer', name: 'Fruit Slicer', sec: 'skill', file: 'skill2', pal: ['#DCFCE7', '#16A34A'], icon: medal('slicer', '#4ADE80', '#14532D', 0) },
  { k: 'chicken', name: 'Chicken Road', sec: 'skill', file: 'skill2', pal: ['#FEF3C7', '#D97706'], icon: medal('chicken', '#FBBF24', '#92400E', 0) },
  { k: 'dodge', name: 'Asteroid Dodge', sec: 'skill', file: 'skill2', pal: ['#E0F2FE', '#0284C7'], icon: medal('dodge', '#A78BFA', '#312E81', 0) },
  { k: 'dartspro', name: 'Darts Pro', sec: 'skill', file: 'skill2', pal: ['#EDE9FE', '#7C3AED'], icon: medal('dartspro', '#F87171', '#7F1D1D', 0) },
  { k: 'orbit', name: 'Orbit Switch', sec: 'skill', file: 'skill3', pal: ['#E0F2FE', '#2563EB'], icon: '<defs><radialGradient id="IDp" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#E0F2FE"/><stop offset=".5" stop-color="#38BDF8"/><stop offset="1" stop-color="#0B1A4A"/></radialGradient><radialGradient id="IDs" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#FDE68A"/><stop offset="1" stop-color="#D97706"/></radialGradient><radialGradient id="IDr" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#FBCFE8"/><stop offset=".6" stop-color="#A855F7"/><stop offset="1" stop-color="#3B0764"/></radialGradient></defs>' +
    '<circle cx="32" cy="32" r="28" fill="none" stroke="#C4B5FD" stroke-width="1.6" stroke-dasharray="3 4"/><circle cx="32" cy="32" r="18" fill="none" stroke="#FDE68A" stroke-width="2.2"/>' +
    '<circle cx="32" cy="32" r="10" fill="url(#IDp)"/><path d="M24 30h16M23.5 34h17" stroke="#fff" stroke-width="1.2" opacity=".35"/><path d="M26 27a7 7 0 0 1 5-3" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none" opacity=".8"/>' +
    '<path d="M50 39l4.5-1 3 3-1 4.5-4.5 1-3-3z" fill="url(#IDr)"/><path d="M12 48l4-1.5 3 2.5-.5 4-4 1.5-3-2.5z" fill="url(#IDr)"/>' +
    '<path d="M45 18a18 18 0 0 0-10-4" stroke="#FDE68A" stroke-width="3" stroke-linecap="round" fill="none" opacity=".5"/><rect x="38.5" y="9.5" width="5" height="3.2" fill="#38BDF8" transform="rotate(30 48 15)"/><rect x="51.5" y="17" width="5" height="3.2" fill="#38BDF8" transform="rotate(30 48 15)"/><circle cx="48" cy="15" r="4.6" fill="url(#IDs)"/><circle cx="48" cy="14.6" r="1.8" fill="#0E7490"/>' }
]);
  /* v2812 (owner: "black screen the first time") — warm the 3 "You're in control" modules as soon as the casino lobby is
     on screen, so a game opens at once (same ?v= as this file → the same cached files the frame asks for). Light: only
     when the casino is open, once, after the browser is idle. */
  var V = ''; try { V = ((document.currentScript && document.currentScript.src) || '').split('?v=')[1] || ''; } catch (e) { V = ''; }
  var warmed = false, warmT = 0;
  function warm() {
    if (warmed) return; warmed = true; clearInterval(warmT);
    ['skill3', 'skill2', 'skill1'].forEach(function (f, i) {
      setTimeout(function () {
        var q = V ? '?v=' + V : '', h = document.head;
        if (!document.querySelector('link[href^="css/games/' + f + '.css"]')) { var c = document.createElement('link'); c.rel = 'stylesheet'; c.href = 'css/games/' + f + '.css' + q; h.appendChild(c); }
        if (!document.querySelector('script[src^="js/games/' + f + '.js"]')) { var s = document.createElement('script'); s.src = 'js/games/' + f + '.js' + q; s.async = true; h.appendChild(s); }
      }, i * 250);
    });
  }
  function check() { if (document.querySelector('#casinoModal .cs-sec-skill')) { if (window.requestIdleCallback) requestIdleCallback(warm, { timeout: 800 }); else setTimeout(warm, 300); clearInterval(warmT); } }
  warmT = setInterval(check, 1200); check();
})(window.D6 = window.D6 || {});
