/* v2819 — "You're in control" catalogue, group 4 (round 5): 8 new games (modules js/games/skill4.js and skill5.js).
   Air Strike (war), Zombie Siege, Brick Breaker, Neon Snake, Helix Drop, Color Jump, Cupcake Party, Princess Rush.
   Each icon shows the same objects and colours as inside its game. Also warms the two modules once the lobby shows
   the "You're in control" list (same ?v= as this file), so the first opening is instant. */
(function (D6) { if (!D6.CasinoCatalog) return;
  /* v2860 (owner: the logos must match the new game art): a round medallion showing the game's own scene and hero (an image
     rendered from the game drawing, img/games/<key>.webp) in a glossy ring. Same 64×64 frame. */
  var RUN = '<g transform="translate(42 2)"><rect width="20" height="12" rx="6" fill="#FBBF24" stroke="#FFF7ED" stroke-width="1.2"/><path d="M6 3.4l3 2.6-3 2.6M11 3.4l3 2.6-3 2.6" stroke="#3B2300" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>';
  function medal(k, c1, c2, run) {
    return '<defs><clipPath id="IDm"><circle cx="32" cy="33" r="26.5"/></clipPath><linearGradient id="IDg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF7D6"/><stop offset=".45" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient>' +
      '<linearGradient id="IDs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
      '<circle cx="32" cy="35" r="28.5" fill="#000" opacity=".38"/><circle cx="32" cy="33" r="28.5" fill="url(#IDg)"/>' +
      '<image href="img/games/' + k + '.webp?v=2863" x="5.5" y="6.5" width="53" height="53" clip-path="url(#IDm)" preserveAspectRatio="xMidYMid slice"/>' +
      '<circle cx="32" cy="33" r="26.5" fill="url(#IDs)"/><circle cx="32" cy="33" r="26.5" fill="none" stroke="#000" stroke-opacity=".35" stroke-width=".8"/>' + (run ? RUN : '');
  }
  D6.CasinoCatalog.add([
  { k: 'airstrike', name: 'Air Strike', sec: 'skill', file: 'skill4', pal: ['#DBEAFE', '#1D4ED8'], icon: medal('airstrike', '#60A5FA', '#1E3A8A', 0) },
  { k: 'zombiesiege', name: 'Zombie Siege', sec: 'skill', file: 'skill4', pal: ['#DCFCE7', '#166534'], icon: medal('zombiesiege', '#F87171', '#7F1D1D', 0) },
  { k: 'brickbreak', name: 'Brick Breaker', sec: 'skill', file: 'skill4', pal: ['#FCE7F3', '#DB2777'], icon: '<defs><linearGradient id="IDp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBCFE8"/><stop offset=".5" stop-color="#EC4899"/><stop offset="1" stop-color="#9D174D"/></linearGradient><radialGradient id="IDo" cx="35%" cy="35%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#FDE68A"/><stop offset="1" stop-color="#F59E0B"/></radialGradient></defs>' +
    '<g stroke="#fff" stroke-opacity=".45" stroke-width=".8"><rect x="4" y="6" width="13" height="7" rx="2" fill="#DB2777"/><rect x="18" y="6" width="13" height="7" rx="2" fill="#EA580C"/><rect x="32" y="6" width="13" height="7" rx="2" fill="#CA8A04"/><rect x="46" y="6" width="13" height="7" rx="2" fill="#16A34A"/>' +
    '<rect x="4" y="14" width="13" height="7" rx="2" fill="#0891B2"/><rect x="32" y="14" width="13" height="7" rx="2" fill="#7C3AED"/><rect x="46" y="14" width="13" height="7" rx="2" fill="#DB2777"/><rect x="11" y="22" width="13" height="7" rx="2" fill="#16A34A"/><rect x="39" y="22" width="13" height="7" rx="2" fill="#EA580C"/></g>' +
    '<path d="M25 17l-2-1M27 14l1-2M22 19l-3 1" stroke="#FDE68A" stroke-width="1.6" stroke-linecap="round"/>' +
    '<path d="M32 50L26 22" stroke="#FDE68A" stroke-width="3" stroke-linecap="round" opacity=".35"/><circle cx="33" cy="47" r="5" fill="url(#IDo)"/>' +
    '<rect x="14" y="53" width="36" height="8" rx="4" fill="url(#IDp)"/><rect x="18" y="54" width="28" height="2" rx="1" fill="#fff" opacity=".6"/><circle cx="18" cy="57" r="2" fill="#FDE68A"/><circle cx="46" cy="57" r="2" fill="#FDE68A"/>' },
  { k: 'neonsnake', name: 'Neon Snake', sec: 'skill', file: 'skill4', pal: ['#D1FAE5', '#059669'], icon: '<defs><linearGradient id="IDm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FCE7F3"/><stop offset=".5" stop-color="#E879F9"/><stop offset="1" stop-color="#86198F"/></linearGradient></defs>' +
    '<rect x="4" y="4" width="56" height="56" rx="6" fill="#06141E" opacity=".55" stroke="#F472B6" stroke-width="2"/>' +
    '<path d="M14 52V40h22V26H18V16h28" fill="none" stroke="#4ADE80" stroke-opacity=".3" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M14 52V40h22V26H18V16h28" fill="none" stroke="#4ADE80" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 52V40h22V26H18V16h28" fill="none" stroke="#BBF7D0" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<circle cx="47" cy="16" r="5.6" fill="#22C55E"/><circle cx="49" cy="13.6" r="1.8" fill="#fff"/><circle cx="49" cy="18.4" r="1.8" fill="#fff"/><circle cx="49.7" cy="13.6" r=".9" fill="#052E16"/><circle cx="49.7" cy="18.4" r=".9" fill="#052E16"/>' +
    '<path d="M51 46l6 5-6 7-6-7z" fill="url(#IDm)"/><path d="M51 46l6 5h-12z" fill="#fff" opacity=".35"/>' },
  { k: 'helixdrop', name: 'Helix Drop', sec: 'skill', file: 'skill5', pal: ['#EDE9FE', '#7C3AED'], icon: '<defs><linearGradient id="IDp" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#A78BFA"/><stop offset=".45" stop-color="#F5F3FF"/><stop offset="1" stop-color="#6D28D9"/></linearGradient><radialGradient id="IDb" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#FDBA74"/><stop offset="1" stop-color="#C2410C"/></radialGradient></defs>' +
    '<path d="M6 16a26 7 0 0 0 52 0v4a26 7 0 0 1-52 0z" fill="#9D174D"/><path d="M6 16a26 7 0 0 1 52 0a26 7 0 0 1-52 0z" fill="#F9A8D4"/><path d="M40 21a26 7 0 0 0 16-3v4a26 7 0 0 1-16 3z" fill="#7F1D1D"/><path d="M58 16a26 7 0 0 1-18 6.6L36 17z" fill="#EF4444"/>' +
    '<path d="M6 38a26 7 0 0 0 52 0v4a26 7 0 0 1-52 0z" fill="#155E75"/><path d="M6 38a26 7 0 0 1 52 0a26 7 0 0 1-52 0z" fill="#67E8F9"/><path d="M20 44.4a26 7 0 0 0 16 .4L33 38h-6z" fill="#120B33"/>' +
    '<rect x="27" y="2" width="10" height="62" fill="url(#IDp)"/><path d="M27 16h10M27 38h10" stroke="#6D28D9" stroke-width="1" opacity=".4"/>' +
    '<path d="M6 60a26 7 0 0 1 52 0" fill="#C4B5FD"/><circle cx="31" cy="31" r="5.5" fill="url(#IDb)"/><path d="M31 23v-3M27 24l-1.5-2.5M35 24l1.5-2.5" stroke="#FDE68A" stroke-width="1.4" stroke-linecap="round"/>' },
  { k: 'colorjump', name: 'Color Jump', sec: 'skill', file: 'skill5', pal: ['#FCE7F3', '#9333EA'], icon: '<defs><radialGradient id="IDb" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#FACC15"/></radialGradient></defs>' +
    '<g fill="none" stroke-width="6"><path d="M32 6a20 20 0 0 1 20 20" stroke="#F43F5E"/><path d="M52 26a20 20 0 0 1-20 20" stroke="#FACC15"/><path d="M32 46a20 20 0 0 1-20-20" stroke="#22D3EE"/><path d="M12 26a20 20 0 0 1 20-20" stroke="#A855F7"/></g>' +
    '<path d="M32 50l1.6 3.4 3.7.5-2.7 2.6.7 3.7-3.3-1.8-3.3 1.8.7-3.7-2.7-2.6 3.7-.5z" fill="#fff"/><path d="M32 50l1.6 3.4 3.7.5-2.7 2.6L32 56z" fill="#F43F5E"/><path d="M32 56l2.6 0 .7 3.7-3.3-1.8z" fill="#22D3EE"/><path d="M32 56l-2.6 0-.7 3.7 3.3-1.8z" fill="#FACC15"/><path d="M32 50l-1.6 3.4-3.7.5 2.7 2.6L32 56z" fill="#A855F7"/>' +
    '<circle cx="32" cy="35" r="6" fill="url(#IDb)"/><circle cx="30" cy="33" r="1.6" fill="#fff" opacity=".85"/><circle cx="32" cy="43" r="2.6" fill="#FACC15" opacity=".35"/>' },
  { k: 'cupcake', name: 'Cupcake Party', sec: 'skill', file: 'skill5', pal: ['#FFE4E6', '#E11D48'], icon: '<defs><linearGradient id="IDw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F472B6"/><stop offset="1" stop-color="#BE185D"/></linearGradient><linearGradient id="IDf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF1F2"/><stop offset=".5" stop-color="#F9A8D4"/><stop offset="1" stop-color="#DB2777"/></linearGradient><radialGradient id="IDc" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#FECACA"/><stop offset=".6" stop-color="#DC2626"/><stop offset="1" stop-color="#7F1D1D"/></radialGradient></defs>' +
    '<path d="M26 0h12l-4 9h-4z" fill="#F9A8D4"/><path d="M29.5 9h5l-1 3h-3z" fill="#D1D5DB"/><path d="M32 13v4" stroke="#fff" stroke-width="1.6" stroke-dasharray="1.5 2"/>' +
    '<path d="M12 40h40l-5 22H17z" fill="url(#IDw)"/><path d="M18 41l3 20M25 41l1.5 20M32 41v20M39 41l-1.5 20M46 41l-3 20" stroke="#fff" stroke-opacity=".45" stroke-width="1.4"/>' +
    '<ellipse cx="32" cy="40" rx="21" ry="5" fill="#C98A4B"/><ellipse cx="32" cy="37" rx="19" ry="6" fill="url(#IDf)"/><ellipse cx="32" cy="31" rx="14.5" ry="5.5" fill="url(#IDf)"/><ellipse cx="32" cy="25.5" rx="10" ry="4.5" fill="url(#IDf)"/><path d="M28 22h8l-3-5z" fill="#F9A8D4"/>' +
    '<circle cx="34" cy="18" r="4" fill="url(#IDc)"/><path d="M34 14q2-4 6-3" stroke="#166534" stroke-width="1.4" fill="none"/>' +
    '<path d="M19 36l3-1M43 35l3 1M26 31l2 1.4M38 30l-2 1.6M31 37h3" stroke-width="1.6" stroke-linecap="round" stroke="#FACC15"/><path d="M23 33l1.6 1.4M40 37l2-1M33 27l1.8.6" stroke="#22D3EE" stroke-width="1.6" stroke-linecap="round"/>' },
  { k: 'princess', name: 'Princess Rush', sec: 'skill', file: 'skill5', pal: ['#FAE8FF', '#C026D3'], icon: '<defs><linearGradient id="IDd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBCFE8"/><stop offset=".55" stop-color="#EC4899"/><stop offset="1" stop-color="#9D174D"/></linearGradient><linearGradient id="IDh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FDE68A"/><stop offset="1" stop-color="#D97706"/></linearGradient><linearGradient id="IDr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9D5FF"/><stop offset="1" stop-color="#FDF2F8"/></linearGradient></defs>' +
    '<path d="M24 16h4v-5l2-3 2 3v5h4v-4l2 -3 2 3v4h4V24H20z" fill="#DDD6FE"/><path d="M22 12l2-4 2 4zM38 12l2-4 2 4zM28 11l2-4 2 4z" fill="#EC4899"/>' +
    '<path d="M26 24h12l22 40H4z" fill="url(#IDr)"/><path d="M32 24v40" stroke="#D97706" stroke-width="1.2" stroke-dasharray="3 3" opacity=".6"/>' +
    '<path d="M4 46V26a10 10 0 0 1 20 0v20" fill="#EC4899" fill-opacity=".3" stroke="#16A34A" stroke-width="3"/><circle cx="7" cy="22" r="2.2" fill="#EC4899"/><circle cx="14" cy="16.6" r="2.2" fill="#EC4899"/><circle cx="21" cy="22" r="2.2" fill="#EC4899"/>' +
    '<circle cx="14" cy="31" r="5" fill="#fff"/><path d="M14 34.6c-3.4-2.2-4.2-4.8-2.2-6 1-.5 1.8 0 2.2.7.4-.7 1.2-1.2 2.2-.7 2 1.2 1.2 3.8-2.2 6z" fill="#EC4899"/>' +
    '<path d="M40 46V26a10 10 0 0 1 20 0v20" fill="#14B8A6" fill-opacity=".3" stroke="#16A34A" stroke-width="3"/><circle cx="43" cy="22" r="2.2" fill="#14B8A6"/><circle cx="50" cy="16.6" r="2.2" fill="#14B8A6"/><circle cx="57" cy="22" r="2.2" fill="#14B8A6"/><circle cx="50" cy="31" r="5" fill="#fff"/><path d="M50 35l-3.6-3.6 1.6-2h4l1.6 2z" fill="#14B8A6"/>' +
    '<path d="M29 40q-8 10-11 22q14 3 28 0q-3-12-11-22z" fill="url(#IDd)"/><path d="M27 62q5 1.6 10 0M24 52l2 9M40 52l-2 9" stroke="#fff" stroke-opacity=".45" stroke-width="1.2" fill="none"/>' +
    '<path d="M28.6 31h6.8l-.6 10h-5.6z" fill="#BE185D"/><path d="M29 32l-3 9M35 32l3 9" stroke="#E8B48A" stroke-width="1.8" stroke-linecap="round"/>' +
    '<path d="M27.5 27a4.5 4.5 0 0 1 9 0l.6 9c-2.6 1.4-7.6 1.4-10.2 0z" fill="url(#IDh)"/><path d="M28.5 23.6l1.4-2 1.2 1.4 1-2 1 2 1.2-1.4 1.4 2z" fill="#FACC15"/>' }
]);
  var V = ''; try { V = ((document.currentScript && document.currentScript.src) || '').split('?v=')[1] || ''; } catch (e) { V = ''; }
  var warmed = false, warmT = 0;
  function warm() {
    if (warmed) return; warmed = true; clearInterval(warmT);
    ['skill4', 'skill5'].forEach(function (f, i) {
      setTimeout(function () {
        var q = V ? '?v=' + V : '', h = document.head;
        if (!document.querySelector('link[href^="css/games/' + f + '.css"]')) { var c = document.createElement('link'); c.rel = 'stylesheet'; c.href = 'css/games/' + f + '.css' + q; h.appendChild(c); }
        if (!document.querySelector('script[src^="js/games/' + f + '.js"]')) { var s = document.createElement('script'); s.src = 'js/games/' + f + '.js' + q; s.async = true; h.appendChild(s); }
      }, 900 + i * 250);
    });
  }
  function check() { if (document.querySelector('#casinoModal .cs-sec-skill')) { if (window.requestIdleCallback) requestIdleCallback(warm, { timeout: 800 }); else setTimeout(warm, 300); clearInterval(warmT); } }
  warmT = setInterval(check, 1200); check();
})(window.D6 = window.D6 || {});
