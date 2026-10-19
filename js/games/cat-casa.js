/* casa catalogue (owner request, round 6): 24 new Casino games — 12 video slots (js/games/casa1.js) and 12 instant-win games
   (js/games/casa2.js, casa3.js); server fiches: casino_ext/casa.php. Logos = the game's own object, same style as the others. */
(function (D6) {
  if (!D6.CasinoCatalog) return;
  function rg(id, a, b, c) { return '<radialGradient id="' + id + '" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="' + a + '"/><stop offset=".55" stop-color="' + b + '"/><stop offset="1" stop-color="' + c + '"/></radialGradient>'; }
  function lg(id, a, b) { return '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient>'; }
  function hi(x, y, r) { return '<ellipse cx="' + (x - r * .34) + '" cy="' + (y - r * .4) + '" rx="' + (r * .34) + '" ry="' + (r * .22) + '" fill="#fff" opacity=".6" transform="rotate(-30 ' + (x - r * .34) + ' ' + (y - r * .4) + ')"/>'; }
  function sh(w) { return '<ellipse cx="32" cy="57.5" rx="' + (w || 24) + '" ry="4.3" fill="#000" opacity=".28"/>'; }
  function tw(x, y, s) { s = s || 1; return '<path d="M' + x + ' ' + (y - 5 * s) + 'l' + (1.3 * s) + ' ' + (3.7 * s) + ' ' + (3.7 * s) + ' ' + (1.3 * s) + '-' + (3.7 * s) + ' ' + (1.3 * s) + '-' + (1.3 * s) + ' ' + (3.7 * s) + '-' + (1.3 * s) + '-' + (3.7 * s) + '-' + (3.7 * s) + '-' + (1.3 * s) + ' ' + (3.7 * s) + '-' + (1.3 * s) + 'z" fill="#FDE68A"/>'; }
  var GOLD = lg('IDg', '#FEF3C7', '#D97706');
  var ICONS = {
    scarab: '<defs>' + GOLD + rg('IDt', '#CCFBF1', '#14B8A6', '#134E4A') + '</defs>' + sh(20) +
      '<path d="M19 22L8 14M18 34L5 35M20 46L10 54M45 22l11-8M46 34l13 1M44 46l10 8" stroke="#92400E" stroke-width="2.6" stroke-linecap="round"/>' +
      '<path d="M32 14c-9 0-14 8-14 20s6 21 14 21 14-9 14-21-5-20-14-20z" fill="url(#IDg)" stroke="#78350F" stroke-width="1.4"/><path d="M32 23v32M18 33h28" stroke="#78350F" stroke-width="1.4"/>' +
      '<path d="M25 14q7-9 14 0" fill="url(#IDt)" stroke="#78350F" stroke-width="1.2"/><circle cx="32" cy="8" r="5" fill="#F59E0B" stroke="#B91C1C" stroke-width="1.2"/>' + hi(26, 32, 10) + tw(54, 52, .8),
    kraken: '<defs>' + rg('IDk', '#F5D0FE', '#C026D3', '#581C87') + lg('IDl', '#F0ABFC', '#A21CAF') + '</defs>' +
      '<g stroke="url(#IDl)" stroke-width="5.4" fill="none" stroke-linecap="round"><path d="M17 36q-10 10-4 20t-8 4"/><path d="M26 38q-4 12 2 18"/><path d="M38 38q4 12-2 18"/><path d="M47 36q10 10 4 20t8 4"/></g>' +
      '<path d="M12 34c0-17 9-27 20-27s20 10 20 27c-6 6-34 6-40 0z" fill="url(#IDk)" stroke="#3B0764" stroke-width="1.4"/><ellipse cx="24" cy="27" rx="4.4" ry="5.6" fill="#FEF08A"/><ellipse cx="40" cy="27" rx="4.4" ry="5.6" fill="#FEF08A"/><path d="M24 23v8M40 23v8" stroke="#111" stroke-width="2.6" stroke-linecap="round"/>' + hi(26, 18, 12),
    donut: '<defs>' + lg('IDd', '#FDE68A', '#B45309') + rg('IDf', '#FFF1F7', '#F472B6', '#9D174D') + '</defs>' + sh(24) +
      '<ellipse cx="32" cy="35" rx="26" ry="21" fill="url(#IDd)"/><path d="M8 32c3-13 12-20 24-20s21 7 24 20c-4 5-7 1-11 5-4-4-8 3-13-1-5 4-9-3-13 1-4-4-7 0-11-5z" fill="url(#IDf)"/>' +
      '<ellipse cx="32" cy="32" rx="7.5" ry="5.4" fill="#4A0D3A"/>' + [[18, 24, '#fff', 30], [24, 18, '#60A5FA', -20], [40, 18, '#FDE047', 50], [46, 26, '#34D399', -40], [16, 34, '#FDE047', 70], [44, 36, '#fff', 10], [30, 42, '#60A5FA', 80]].map(function (q) { return '<rect x="-2.4" y="-1" width="4.8" height="2" rx="1" fill="' + q[2] + '" transform="translate(' + q[0] + ' ' + q[1] + ') rotate(' + q[3] + ')"/>'; }).join('') + hi(20, 24, 10) + tw(55, 10, .8),
    cherrybar: '<defs>' + rg('IDc', '#FECACA', '#DC2626', '#7F1D1D') + GOLD + '</defs>' + sh(24) +
      '<rect x="6" y="40" width="52" height="16" rx="4" fill="#111827" stroke="url(#IDg)" stroke-width="2"/><text x="32" y="53" text-anchor="middle" font-family="Impact,Arial Black,sans-serif" font-weight="900" font-size="13" fill="#FDE68A" letter-spacing="1">BAR</text>' +
      '<path d="M22 30Q26 12 40 4M42 30Q42 14 40 4" stroke="#15803D" stroke-width="2.4" fill="none"/><path d="M40 4q9-3 14 4-8 3-14-4z" fill="#22C55E"/>' +
      '<circle cx="20" cy="32" r="10" fill="url(#IDc)"/><circle cx="43" cy="32" r="10" fill="url(#IDc)"/>' + hi(20, 32, 10) + hi(43, 32, 10),
    ufo: '<defs>' + lg('IDs', '#FFFFFF', '#64748B') + rg('IDd', '#ECFEFF', '#67E8F9', '#0E7490') + '</defs>' +
      '<path d="M22 36L12 60h40L42 36z" fill="#A7F3D0" opacity=".35"/><ellipse cx="32" cy="34" rx="28" ry="9" fill="url(#IDs)" stroke="#334155" stroke-width="1.2"/><path d="M18 30c0-11 6-18 14-18s14 7 14 18z" fill="url(#IDd)"/>' +
      '<ellipse cx="32" cy="24" rx="5" ry="6" fill="#4ADE80"/><circle cx="30" cy="23" r="1.4" fill="#111"/><circle cx="34" cy="23" r="1.4" fill="#111"/>' + [12, 22, 32, 42, 52].map(function (x) { return '<circle cx="' + x + '" cy="36" r="2.2" fill="#FDE047"/>'; }).join('') + hi(26, 20, 8) + tw(55, 10, .8) + tw(8, 12, .6),
    koi: '<defs>' + GOLD + rg('IDw', '#BAE6FD', '#0284C7', '#0C4A6E') + '</defs>' + '<ellipse cx="32" cy="50" rx="28" ry="9" fill="url(#IDw)" opacity=".8"/>' +
      '<g transform="rotate(-20 32 32)"><path d="M6 32c7-13 22-17 35-9l13-9-4 18 4 18-13-9C28 49 13 45 6 32z" fill="url(#IDg)" stroke="#92400E" stroke-width="1.3"/><path d="M22 26q7-6 14-2M22 38q7 6 14 2" stroke="#DC2626" stroke-width="3.4" fill="none" stroke-linecap="round"/><circle cx="14" cy="30" r="2.4" fill="#111"/></g>' + hi(18, 26, 9) + tw(54, 12, .8),
    goldtrain: '<defs>' + GOLD + lg('IDr', '#FB7185', '#9F1239') + lg('IDb', '#4B5563', '#111827') + '</defs>' + sh(28) +
      '<rect x="32" y="16" width="26" height="28" rx="3" fill="url(#IDr)"/><rect x="36" y="20" width="18" height="10" rx="1.5" fill="#FDE68A"/><rect x="6" y="26" width="30" height="18" rx="4" fill="url(#IDb)" stroke="#FBBF24" stroke-width="1.4"/>' +
      '<path d="M11 26V14h8v12" fill="#1F2937"/><path d="M8 14h14l-3-5h-8z" fill="#111827"/><circle cx="15" cy="5" r="3.4" fill="#E5E7EB" opacity=".7"/>' +
      '<circle cx="15" cy="50" r="7.4" fill="url(#IDg)" stroke="#78350F" stroke-width="1.2"/><circle cx="31" cy="51" r="6" fill="url(#IDg)" stroke="#78350F" stroke-width="1.2"/><circle cx="48" cy="50" r="7.4" fill="url(#IDg)" stroke="#78350F" stroke-width="1.2"/><path d="M2 42l6-4v8z" fill="#FBBF24"/>',
    viking: '<defs>' + lg('IDh', '#FFFBEB', '#B45309') + lg('IDm', '#FFFFFF', '#64748B') + GOLD + '</defs>' + sh(22) +
      '<path d="M16 30Q4 26 3 8q8 9 15 12zM48 30q12-4 13-22-8 9-15 12z" fill="url(#IDh)" stroke="#78350F" stroke-width="1.3"/>' +
      '<path d="M14 44c0-20 8-30 18-30s18 10 18 30z" fill="url(#IDm)" stroke="#1F2937" stroke-width="1.4"/><path d="M12 42h40v7H12z" fill="url(#IDg)" stroke="#78350F"/><path d="M29 49h6v10h-6z" fill="url(#IDm)"/><path d="M32 14v28" stroke="#94A3B8" stroke-width="2"/>' + hi(24, 28, 9),
    safari: '<defs>' + rg('IDm', '#FDBA74', '#C2410C', '#7C2D12') + rg('IDf', '#FEF3C7', '#FBBF24', '#B45309') + '</defs>' + sh(22) +
      '<circle cx="32" cy="32" r="26" fill="url(#IDm)"/>' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (i) { var a = i * 36 * Math.PI / 180; return '<circle cx="' + (32 + Math.cos(a) * 22).toFixed(1) + '" cy="' + (33 + Math.sin(a) * 22).toFixed(1) + '" r="7" fill="#9A3412"/>'; }).join('') +
      '<ellipse cx="32" cy="34" rx="16" ry="17" fill="url(#IDf)"/><circle cx="26" cy="30" r="2.3" fill="#111"/><circle cx="38" cy="30" r="2.3" fill="#111"/><path d="M28 38h8l-4 4.6z" fill="#7C2D12"/><path d="M27 46q5 3 10 0" stroke="#7C2D12" stroke-width="1.6" fill="none" stroke-linecap="round"/>' + hi(26, 26, 9),
    rubymine: '<defs>' + lg('IDr', '#FFD1D9', '#BE123C') + lg('IDc', '#D97706', '#78350F') + lg('IDm', '#FFFFFF', '#64748B') + '</defs>' + sh(24) +
      '<path d="M16 58L40 18" stroke="url(#IDc)" stroke-width="4.4" stroke-linecap="round"/><path d="M24 10q22 0 32 20-17-10-32-12z" fill="url(#IDm)" stroke="#1F2937" stroke-width="1.2"/>' +
      '<path d="M30 30h22l6 9-17 19-17-19z" fill="url(#IDr)" stroke="#7F1D1D" stroke-width="1.4"/><path d="M24 39h34M35 30l-3 9 9 19 9-19-3-9" stroke="#fff" stroke-opacity=".6" stroke-width="1.1" fill="none"/>' + tw(54, 12, .8) + tw(14, 40, .6),
    pumpkin: '<defs>' + lg('IDo', '#FED7AA', '#C2410C') + rg('IDp', '#FED7AA', '#F97316', '#9A3412') + '</defs>' + sh(24) +
      '<path d="M32 14q-1-8 6-11" stroke="#3F6212" stroke-width="3.6" fill="none" stroke-linecap="round"/><ellipse cx="20" cy="36" rx="14" ry="20" fill="url(#IDo)"/><ellipse cx="44" cy="36" rx="14" ry="20" fill="url(#IDo)"/><ellipse cx="32" cy="36" rx="14" ry="21" fill="url(#IDp)"/>' +
      '<path d="M20 28l6 6H15zM44 28l5 6H38zM18 42q14 9 28 0l-4 6-4-3-4 4-4-4-4 4-4-4-3 3z" fill="#FDE047"/>' + tw(55, 10, .8),
    medusa: '<defs>' + rg('IDf', '#D1FAE5', '#6EE7B7', '#047857') + lg('IDs', '#86EFAC', '#15803D') + GOLD + '</defs>' + sh(20) +
      '<g stroke="url(#IDs)" stroke-width="4.4" fill="none" stroke-linecap="round"><path d="M20 20Q9 15 7 5"/><path d="M27 15q-3-9 2-13"/><path d="M37 15q3-9-2-13"/><path d="M44 20q11-5 13-15"/><path d="M17 30Q6 32 4 24"/><path d="M47 30q11 2 13-6"/></g>' +
      '<ellipse cx="32" cy="34" rx="15" ry="19" fill="url(#IDf)" stroke="#065F46" stroke-width="1.3"/><path d="M24 30q3-3 6 0M34 30q3-3 6 0" stroke="#064E3B" stroke-width="1.8" fill="none"/><circle cx="27" cy="32" r="1.8" fill="#FDE047"/><circle cx="37" cy="32" r="1.8" fill="#FDE047"/>' +
      '<path d="M28 44q4 3 8 0" stroke="#9F1239" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M19 20q13-10 26 0" stroke="url(#IDg)" stroke-width="3.4" fill="none"/>'
  };
  var L = [
    ['scarab', 'Scarab Sun', 'casa1', ['#FEF3C7', '#B45309']], ['kraken', 'Kraken Deep', 'casa1', ['#FAE8FF', '#A21CAF']], ['donut', 'Donut Shop', 'casa1', ['#FCE7F3', '#DB2777']],
    ['cherrybar', 'Cherry Bar', 'casa1', ['#FEE2E2', '#B91C1C']], ['ufo', 'UFO Invasion', 'casa1', ['#DCFCE7', '#16A34A']], ['koi', 'Koi Fortune', 'casa1', ['#FFE4E6', '#DC2626']],
    ['goldtrain', 'Gold Train', 'casa1', ['#FFEDD5', '#C2410C']], ['viking', 'Viking Raid', 'casa1', ['#E2E8F0', '#475569']], ['safari', 'Safari King', 'casa1', ['#FEF9C3', '#CA8A04']],
    ['rubymine', 'Ruby Mine', 'casa1', ['#FFE4E6', '#BE123C']], ['pumpkin', 'Pumpkin Night', 'casa1', ['#FFEDD5', '#EA580C']], ['medusa', 'Medusa', 'casa1', ['#D1FAE5', '#047857']]
  ];
  D6.CasinoCatalog.add(L.map(function (g) { return { k: g[0], name: g[1], sec: 'more', file: g[2], pal: g[3], icon: ICONS[g[0]] }; }));
})(window.D6 = window.D6 || {});
