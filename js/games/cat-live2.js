/* v2830 — live2 catalogue (owner request, round 5): 4 new LIVE games (shared rounds, casino_lib.php CASINO_LIVE2),
   module js/games/live2.js : Queen's Catwalk (women theme), Star Fleets, Gem Count, Lucky Claw. */
(function (D6) {
  if (!D6.CasinoCatalog) return;
  function rg(id, a, b, c) { return '<radialGradient id="' + id + '" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="' + a + '"/><stop offset=".55" stop-color="' + b + '"/><stop offset="1" stop-color="' + c + '"/></radialGradient>'; }
  function lg(id, a, b) { return '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient>'; }
  var sp = function (x, y, s) { return '<path d="M' + x + ' ' + (y - s) + 'l' + (s * .3) + ' ' + (s * .7) + ' ' + (s * .7) + ' ' + (s * .3) + '-' + (s * .7) + ' ' + (s * .3) + '-' + (s * .3) + ' ' + (s * .7) + '-' + (s * .3) + '-' + (s * .7) + '-' + (s * .7) + '-' + (s * .3) + ' ' + (s * .7) + '-' + (s * .3) + 'z" fill="#FFF7D6"/>'; };
  var ICONS = {
    // stiletto + crown: queen of the runway
    catwalk: '<defs>' + lg('IDa', '#FBCFE8', '#BE185D') + lg('IDc', '#FFF3C4', '#D97706') + rg('IDg', '#fff', '#F9A8D4', '#DB2777') + '</defs>' +
      '<ellipse cx="32" cy="56" rx="23" ry="4" fill="#000" opacity=".28"/>' +
      '<path d="M9 50c9-1 17-6 23-15 3-5 7-8 11-8 6 0 10 5 11 12l1 13h-5l-2-9c-1-3-3-4-5-2-6 7-15 11-27 12-5 0-9-2-7-3z" fill="url(#IDa)" stroke="#FCE7F3" stroke-width=".8"/>' +
      '<path d="M50 39l2 15h4l-1-13z" fill="#831843"/>' +
      '<path d="M13 48c8-1 15-5 20-12" stroke="#fff" stroke-opacity=".6" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '<path d="M16 22l-3-12 8 6 6-9 6 9 8-6-3 12z" fill="url(#IDc)" stroke="#FEF3C7" stroke-width=".8"/>' +
      '<circle cx="27" cy="18" r="2.2" fill="url(#IDg)"/><circle cx="19.5" cy="19" r="1.4" fill="#F472B6"/><circle cx="34.5" cy="19" r="1.4" fill="#F472B6"/>' + sp(50, 14, 5) + sp(56, 27, 3),
    // two fleets and a crossing laser
    fleets: '<defs>' + lg('IDa', '#FFF3C4', '#D97706') + lg('IDb', '#EDE9FE', '#6D28D9') + rg('IDx', '#fff', '#FDE68A', '#F97316') + '</defs>' +
      '<ellipse cx="32" cy="57" rx="22" ry="3.6" fill="#000" opacity=".25"/>' +
      '<path d="M24 41l9-5M37 33l6-3.5" stroke="#FDE68A" stroke-width="2.6" stroke-linecap="round"/><path d="M40 39l-8 4" stroke="#C4B5FD" stroke-width="2.6" stroke-linecap="round"/>' +
      '<circle cx="35" cy="34.6" r="4.5" fill="url(#IDx)" opacity=".9"/>' +
      '<g transform="translate(15 44) rotate(-30) scale(1.25)"><path d="M13 0L-4-9L-9-11L-6-3L-9 0L-6 3L-9 11L-4 9z" fill="url(#IDa)" stroke="#FEF3C7" stroke-width=".7"/><ellipse cx="2" cy="0" rx="4" ry="2" fill="#E0F2FE"/><path d="M-9-2.5L-15 0L-9 2.5z" fill="#FDBA74"/></g>' +
      '<g transform="translate(50 21) rotate(150) scale(1.25)"><path d="M13 0L-4-9L-9-11L-6-3L-9 0L-6 3L-9 11L-4 9z" fill="url(#IDb)" stroke="#EDE9FE" stroke-width=".7"/><ellipse cx="2" cy="0" rx="4" ry="2" fill="#E0F2FE"/><path d="M-9-2.5L-15 0L-9 2.5z" fill="#C4B5FD"/></g>' + sp(12, 14, 3.5) + sp(55, 46, 3),
    // golden cloche lifting over a pile of gems
    gemcount: '<defs>' + lg('IDd', '#FFF7D6', '#B45309') + lg('IDr', '#FFE4E6', '#E11D48') + lg('IDe', '#D1FAE5', '#059669') + lg('IDs', '#DBEAFE', '#2563EB') + '</defs>' +
      '<ellipse cx="32" cy="55" rx="25" ry="5" fill="#0F766E" opacity=".55"/>' +
      '<path d="M18 50l5-4 5 4-2 4h-6z" fill="url(#IDs)"/><path d="M28 51l5-5 5 5-2.5 4.5h-5z" fill="url(#IDr)"/><path d="M38 50l5-4 5 4-2 4h-6z" fill="url(#IDe)"/><path d="M23 44l5-4 5 4-2 4h-6z" fill="url(#IDe)"/><path d="M33 44l5-4 5 4-2 4h-6z" fill="url(#IDs)"/>' +
      '<g transform="rotate(-14 32 30)"><path d="M12 32q0-20 20-20t20 20z" fill="url(#IDd)"/><rect x="9" y="31" width="46" height="4" rx="2" fill="#92400E"/><circle cx="32" cy="10" r="3.4" fill="url(#IDd)"/><path d="M18 28q1-10 11-13" stroke="#fff" stroke-opacity=".6" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>' + sp(53, 44, 3.5) + sp(11, 44, 2.6),
    // the claw holding a diamond
    claw: '<defs>' + lg('IDm', '#F8FAFC', '#475569') + lg('IDd', '#ECFEFF', '#0891B2') + '</defs>' +
      '<ellipse cx="32" cy="57" rx="20" ry="3.6" fill="#000" opacity=".25"/>' +
      '<path d="M8 6H56" stroke="#FBBF24" stroke-width="3" stroke-linecap="round"/><rect x="25" y="3" width="14" height="7" rx="2.5" fill="url(#IDm)"/><path d="M32 10v10" stroke="#CBD5E1" stroke-width="1.6"/>' +
      '<circle cx="32" cy="22" r="4.4" fill="url(#IDm)"/>' +
      '<path d="M29 25q-9 6-8 16q0 3 3 4M35 25q9 6 8 16q0 3-3 4" stroke="#E2E8F0" stroke-width="3.2" fill="none" stroke-linecap="round"/>' +
      '<path d="M21 38l5-6h12l5 6-11 15z" fill="url(#IDd)" stroke="#CFFAFE" stroke-width=".8"/><path d="M21 38h22M28 32l-1.5 6L32 53l5.5-15L36 32" stroke="#fff" stroke-opacity=".55" stroke-width=".7" fill="none"/>' + sp(51, 30, 4) + sp(13, 44, 3)
  };
  D6.CasinoCatalog.add([
    // v2860 (owner: logos must match the new art): medallion rendered from the redrawn runway show (img/games/catwalk.webp)
    { k: 'catwalk', name: 'Miss Catwalk', sec: 'live', file: 'live2', pal: ['#FCE7F3', '#DB2777'], icon: '<defs><clipPath id="IDm"><circle cx="32" cy="33" r="26.5"/></clipPath><linearGradient id="IDq" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF7D6"/><stop offset=".45" stop-color="#F472B6"/><stop offset="1" stop-color="#831843"/></linearGradient>' +
      '<linearGradient id="IDw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
      '<circle cx="32" cy="35" r="28.5" fill="#000" opacity=".38"/><circle cx="32" cy="33" r="28.5" fill="url(#IDq)"/>' +
      '<image href="img/games/catwalk.webp?v=2867" x="5.5" y="6.5" width="53" height="53" clip-path="url(#IDm)" preserveAspectRatio="xMidYMid slice"/>' +
      '<circle cx="32" cy="33" r="26.5" fill="url(#IDw)"/><circle cx="32" cy="33" r="26.5" fill="none" stroke="#000" stroke-opacity=".35" stroke-width=".8"/>' },
    { k: 'fleets', name: 'Star Fleets', sec: 'live', file: 'live2', pal: ['#E0E7FF', '#4F46E5'], icon: ICONS.fleets },
    { k: 'gemcount', name: 'Gem Count', sec: 'live', file: 'live2', pal: ['#CCFBF1', '#0D9488'], icon: ICONS.gemcount },
    { k: 'claw', name: 'Lucky Claw', sec: 'live', file: 'live2', pal: ['#FAE8FF', '#C026D3'], icon: ICONS.claw }
  ]);
})(window.D6 = window.D6 || {});
