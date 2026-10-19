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
      '<image href="img/games/' + k + '.webp?v=2874" x="5.5" y="6.5" width="53" height="53" clip-path="url(#IDm)" preserveAspectRatio="xMidYMid slice"/>' +
      '<circle cx="32" cy="33" r="26.5" fill="url(#IDs)"/><circle cx="32" cy="33" r="26.5" fill="none" stroke="#000" stroke-opacity=".35" stroke-width=".8"/>' + (run ? RUN : '');
  }
  D6.CasinoCatalog.add([
  { k: 'hamster', name: 'Hamster Run', sec: 'skill', file: 'skill2', pal: ['#FFEDD5', '#EA580C'], icon: medal('hamster', '#FB923C', '#9A3412', 1) },
  { k: 'highway', name: 'Highway Rush', sec: 'skill', file: 'skill3', pal: ['#FCE7F3', '#DB2777'], icon: medal('highway', '#F472B6', '#831843', 1) },
  { k: 'jungledash', name: 'Jungle Dash', sec: 'skill', file: 'skill3', pal: ['#DCFCE7', '#15803D'], icon: medal('jungledash', '#4ADE80', '#14532D', 1) },
  { k: 'metrodash', name: 'Metro Dash', sec: 'skill', file: 'skill3', pal: ['#CFFAFE', '#0891B2'], icon: medal('metrodash', '#22D3EE', '#155E75', 1) },
  { k: 'spacerun', name: 'Space Runner', sec: 'skill', file: 'skill1', pal: ['#DCFCE7', '#16A34A'], icon: medal('spacerun', '#A78BFA', '#4C1D95', 0) },
  { k: 'flappyrock', name: 'Flappy Rocket', sec: 'skill', file: 'skill1', pal: ['#FFE4E6', '#E11D48'], icon: medal('flappyrock', '#FB7185', '#881337', 0) },
  { k: 'stack', name: 'Tower Stack', sec: 'skill', file: 'skill1', pal: ['#FEF3C7', '#D97706'], icon: '<defs><linearGradient id="IDa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C4B5FD"/><stop offset="1" stop-color="#6D28D9"/></linearGradient><linearGradient id="IDb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F9A8D4"/><stop offset="1" stop-color="#BE185D"/></linearGradient><linearGradient id="IDc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FDE68A"/><stop offset="1" stop-color="#D97706"/></linearGradient></defs>' +
    '<ellipse cx="32" cy="58" rx="24" ry="4" fill="#78350F" opacity=".45"/><rect x="12" y="45" width="40" height="11" rx="2" fill="url(#IDa)"/><rect x="14" y="34" width="37" height="11" rx="2" fill="url(#IDb)"/><rect x="16" y="23" width="34" height="11" rx="2" fill="url(#IDc)"/>' +
    '<path d="M14 47h22M16 36h18M18 25h16" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>' +
    '<g transform="rotate(-8 30 12)"><rect x="9" y="6" width="30" height="11" rx="2" fill="url(#IDc)"/><path d="M11 8h14" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/></g><path d="M44 10h12M46 15h8" stroke="#FDE68A" stroke-width="2" stroke-linecap="round"/>' },
  { k: 'knifehit', name: 'Star Blades', sec: 'skill', file: 'skill1', pal: ['#E0F2FE', '#0284C7'], icon: '<defs><radialGradient id="IDp" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#E0F2FE"/><stop offset=".45" stop-color="#38BDF8"/><stop offset="1" stop-color="#0C2D57"/></radialGradient><linearGradient id="IDk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F0F9FF"/><stop offset="1" stop-color="#0EA5E9"/></linearGradient></defs>' +
    '<g transform="rotate(10 32 30)"><path d="M32 2l3 6v11h-6V8z" fill="url(#IDk)"/><rect x="28" y="19" width="8" height="2.4" rx="1" fill="#FBBF24"/></g>' +
    '<g transform="rotate(130 32 30)"><path d="M32 2l3 6v11h-6V8z" fill="url(#IDk)"/><rect x="28" y="19" width="8" height="2.4" rx="1" fill="#FBBF24"/></g><g transform="rotate(-120 32 30)"><path d="M32 2l3 6v11h-6V8z" fill="url(#IDk)"/><rect x="28" y="19" width="8" height="2.4" rx="1" fill="#FBBF24"/></g>' +
    '<circle cx="32" cy="30" r="15" fill="url(#IDp)" stroke="#FDE68A" stroke-width="1.2"/><circle cx="37" cy="27" r="3.4" fill="#0C2D57" opacity=".35"/><circle cx="27" cy="35" r="2.4" fill="#0C2D57" opacity=".35"/><path d="M22 24a11 11 0 0 1 7-6" stroke="#fff" stroke-width="2.2" stroke-linecap="round" fill="none" opacity=".8"/>' +
    '<path d="M32 49l2.6 4.6V61h-5.2v-7.4z" fill="url(#IDk)"/><rect x="29" y="61" width="6" height="3" rx="1" fill="#7C3AED"/>' },
  { k: 'basket', name: 'Basket Shot', sec: 'skill', file: 'skill1', pal: ['#FFEDD5', '#EA580C'], icon: '<defs><radialGradient id="IDb" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#FED7AA"/><stop offset=".55" stop-color="#F97316"/><stop offset="1" stop-color="#7C2D12"/></radialGradient></defs>' +
    '<rect x="14" y="4" width="36" height="24" rx="3" fill="#BAE6FD" fill-opacity=".25" stroke="#E0F2FE" stroke-width="1.6"/><rect x="25" y="13" width="14" height="10" fill="none" stroke="#FB923C" stroke-width="1.4"/>' +
    '<circle cx="34" cy="22" r="11" fill="url(#IDb)"/><path d="M23 22h22M34 11v22M26 14c4 4 4 12 0 16M42 14c-4 4-4 12 0 16" stroke="#431407" stroke-width="1.1" fill="none"/><ellipse cx="29.5" cy="16.5" rx="3" ry="1.8" fill="#fff" opacity=".45" transform="rotate(-35 29.5 16.5)"/>' +
    '<path d="M18 33l4 18h20l4-18M22 33l5 18M42 33l-5 18M32 33v18M20 41h24M21 46h22" stroke="#fff" stroke-width="1.1" fill="none" opacity=".85"/><ellipse cx="32" cy="33" rx="15" ry="3.2" fill="none" stroke="#EA580C" stroke-width="3"/>' },
  { k: 'starbridge', name: 'Star Bridge', sec: 'skill', file: 'skill1', pal: ['#F3E8FF', '#9333EA'], icon: '<defs><linearGradient id="IDp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C4B5FD"/><stop offset=".5" stop-color="#6D28D9"/><stop offset="1" stop-color="#2E1065"/></linearGradient><linearGradient id="IDs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#94A3B8"/></linearGradient><linearGradient id="IDv" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FDE68A"/><stop offset="1" stop-color="#B45309"/></linearGradient></defs>' +
    '<path d="M50 6v11M44.5 11.5h11" stroke="#FDE68A" stroke-width="1.6" stroke-linecap="round"/><circle cx="36" cy="10" r="1.5" fill="#FDE68A"/><circle cx="58" cy="24" r="1.1" fill="#fff"/><circle cx="28" cy="6" r="1" fill="#fff"/>' +
    '<rect x="3" y="37" width="19" height="27" rx="2" fill="url(#IDp)"/><rect x="44" y="37" width="17" height="27" rx="2" fill="url(#IDp)"/><rect x="3" y="37" width="19" height="3" rx="1" fill="#FBBF24"/><rect x="44" y="37" width="17" height="3" rx="1" fill="#FBBF24"/><rect x="51" y="37" width="3" height="1.8" fill="#F43F5E"/>' +
    '<path d="M5 42v18M46 42v18" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".3"/><rect x="20" y="33.5" width="26" height="7" rx="3.5" fill="#FDE68A" opacity=".3"/><rect x="21" y="35.6" width="24" height="2.8" rx="1.4" fill="#FEF3C7"/>' +
    '<path d="M11.5 32.5l-.5 4M16 32.5l.5 4" stroke="#CBD5E1" stroke-width="2.6" stroke-linecap="round"/><rect x="6.5" y="24" width="4.5" height="8" rx="1.6" fill="#94A3B8"/><rect x="9" y="23" width="10" height="10.5" rx="3.5" fill="url(#IDs)"/><rect x="10" y="27.5" width="8" height="1.8" fill="#A855F7"/>' +
    '<circle cx="14.5" cy="17.5" r="6.5" fill="url(#IDs)"/><rect x="14.5" y="13.8" width="7" height="5.4" rx="2.6" fill="url(#IDv)"/><path d="M16.5 15.6a2 2 0 0 1 2-1" stroke="#fff" stroke-width="1.2" stroke-linecap="round" fill="none"/>' },
  { k: 'archer', name: 'Star Archer', sec: 'skill', file: 'skill2', pal: ['#FFE4E6', '#E11D48'], icon: medal('archer', '#FB7185', '#4C1D95', 0) },
  { k: 'slicer', name: 'Fruit Slicer', sec: 'skill', file: 'skill2', pal: ['#DCFCE7', '#16A34A'], icon: '<defs><radialGradient id="IDf" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#ECFCCB"/><stop offset=".55" stop-color="#4ADE80"/><stop offset="1" stop-color="#14532D"/></radialGradient><radialGradient id="IDp" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#FCE7F3"/><stop offset=".6" stop-color="#F472B6"/><stop offset="1" stop-color="#831843"/></radialGradient></defs>' +
    '<path d="M8 36a18 18 0 0 1 32-11L14 51A18 18 0 0 1 8 36z" fill="url(#IDf)"/><path d="M19 55l26-26a18 18 0 0 1-26 26z" fill="url(#IDf)"/><path d="M14 51l26-26M19 55l26-26" stroke="#FEF9C3" stroke-width="2.4"/>' +
    '<circle cx="47" cy="17" r="10" fill="url(#IDp)"/><path d="M6 58L58 6" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".9"/><path d="M13 30c2-5 6-8 11-9" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".7"/>' },
  { k: 'chicken', name: 'Chicken Road', sec: 'skill', file: 'skill2', pal: ['#FEF3C7', '#D97706'], icon: medal('chicken', '#FBBF24', '#92400E', 0) },
  { k: 'dodge', name: 'Asteroid Dodge', sec: 'skill', file: 'skill2', pal: ['#E0F2FE', '#0284C7'], icon: '<defs><linearGradient id="IDs" x1="0" x2="1"><stop offset="0" stop-color="#5B21B6"/><stop offset=".45" stop-color="#F5F3FF"/><stop offset="1" stop-color="#4C1D95"/></linearGradient><radialGradient id="IDr" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#E4DCF2"/><stop offset=".6" stop-color="#8B7FA8"/><stop offset="1" stop-color="#2A2142"/></radialGradient></defs>' +
    '<path d="M44 4l9 2 6 8-1 9-9 5-9-3-4-9z" fill="url(#IDr)"/><circle cx="46" cy="14" r="2.6" fill="#3B3055" opacity=".6"/><path d="M10 26l6-3 4 4-2 6-6 1-3-4z" fill="url(#IDr)"/>' +
    '<path d="M32 24l13 26-5 6-8-4-8 4-5-6z" fill="#F59E0B"/><path d="M32 18c5 6 6 20 5 34H27c-1-14 0-28 5-34z" fill="url(#IDs)"/><ellipse cx="32" cy="34" rx="2.8" ry="4.5" fill="#38BDF8"/>' +
    '<path d="M29 54h6l-3 8z" fill="#FB923C"/>' },
  { k: 'dartspro', name: 'Darts Pro', sec: 'skill', file: 'skill2', pal: ['#EDE9FE', '#7C3AED'], icon: '<defs><radialGradient id="IDd" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#FDE68A"/><stop offset=".6" stop-color="#D97706"/><stop offset="1" stop-color="#451A03"/></radialGradient></defs>' +
    '<circle cx="30" cy="34" r="27" fill="url(#IDd)"/><circle cx="30" cy="34" r="22" fill="#1E1B4B"/><circle cx="30" cy="34" r="19" fill="none" stroke="#F43F5E" stroke-width="3" stroke-dasharray="6 6"/><circle cx="30" cy="34" r="12" fill="none" stroke="#22C55E" stroke-width="3" stroke-dasharray="4 4"/><circle cx="30" cy="34" r="3.4" fill="#F43F5E"/>' +
    '<circle cx="40" cy="25" r="7" fill="none" stroke="#4ADE80" stroke-width="2.4"/><path d="M40 14v6M40 30v6M29 25h6M45 25h6" stroke="#4ADE80" stroke-width="2.4" stroke-linecap="round"/><path d="M14 22c3-5 7-8 12-9" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none" opacity=".6"/>' },
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
