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

  function star(cx, cy, r, f) { var d = ''; for (var j = 0; j < 10; j++) { var a = -Math.PI / 2 + j * Math.PI / 5, rr = j % 2 ? r * .45 : r; d += (j ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1); } return '<path d="' + d + 'z" fill="' + f + '"/>'; }
  var CARD = function (x, y, r, t, col) { return '<g transform="translate(' + x + ' ' + y + ') rotate(' + r + ')"><rect x="-11" y="-15" width="22" height="30" rx="3" fill="#fff" stroke="#CBD5E1"/><text x="0" y="5" text-anchor="middle" font-family="Arial" font-weight="900" font-size="13" fill="' + col + '">' + t + '</text></g>'; };
  Object.assign(ICONS, {
    scratchwin: '<defs>' + GOLD + lg('IDf', '#F3F4F6', '#9CA3AF') + '</defs>' + sh(24) + '<rect x="8" y="12" width="48" height="40" rx="6" fill="#F5D0FE" stroke="url(#IDg)" stroke-width="2.4"/>' +
      '<circle cx="22" cy="24" r="7" fill="url(#IDg)"/><text x="22" y="27.5" text-anchor="middle" font-family="Arial" font-weight="900" font-size="9" fill="#78350F">7</text><rect x="34" y="17" width="16" height="14" rx="7" fill="url(#IDf)"/>' +
      '<rect x="14" y="36" width="36" height="11" rx="3" fill="url(#IDf)"/><path d="M14 41h20" stroke="#fff" stroke-width="5" stroke-linecap="round"/><text x="24" y="44.5" text-anchor="middle" font-family="Arial" font-weight="900" font-size="8" fill="#7E22CE">×200</text>' +
      '<path d="M46 40l12-14 4 3-12 14z" fill="#FBBF24" stroke="#92400E" stroke-width="1"/>' + tw(56, 12, .8),
    pickbox: '<defs>' + lg('IDb', '#F9A8D4', '#BE185D') + lg('IDl', '#FBCFE8', '#DB2777') + '</defs>' + sh(22) + '<rect x="12" y="28" width="40" height="28" rx="3" fill="url(#IDb)"/><rect x="28" y="28" width="8" height="28" fill="#FEF3C7"/>' +
      '<g transform="rotate(-12 32 24)"><rect x="9" y="18" width="46" height="11" rx="3" fill="url(#IDl)"/><rect x="28" y="18" width="8" height="11" fill="#FEF3C7"/><path d="M32 18c-10-12-18-2-8 0M32 18c10-12 18-2 8 0" stroke="#FEF3C7" stroke-width="3.4" fill="none"/></g>' +
      '<text x="32" y="14" text-anchor="middle" font-family="Arial" font-weight="900" font-size="11" fill="#FDE68A" stroke="#78350F" stroke-width="2" paint-order="stroke">?</text>' + tw(54, 10, .8) + tw(10, 14, .6),
    ladder: '<defs>' + lg('IDw', '#FCD34D', '#92400E') + '</defs>' + sh(16) + '<path d="M14 58L22 10M50 58L42 10" stroke="url(#IDw)" stroke-width="5" stroke-linecap="round"/>' + [51, 42, 33, 24, 15].map(function (y) { var t = (58 - y) / 48 * 8; return '<path d="M' + (14 + t) + ' ' + y + 'H' + (50 - t) + '" stroke="url(#IDw)" stroke-width="3.6" stroke-linecap="round"/>'; }).join('') +
      star(32, 7, 7, '#FDE68A') + '<circle cx="32" cy="27" r="5" fill="#FCD34D"/><path d="M27 26a5 5 0 0 1 10 0z" fill="#1E3A8A"/><rect x="27" y="32" width="10" height="11" rx="3.4" fill="#EF4444"/><path d="M27 34l-6-6M37 34l6-6" stroke="#FCD34D" stroke-width="2.6" stroke-linecap="round"/><path d="M29 43l-2 9M35 43l2 9" stroke="#1E3A8A" stroke-width="3" stroke-linecap="round"/>',
    hilorun: '<defs>' + lg('IDa', '#86EFAC', '#15803D') + '</defs>' + sh(26) + CARD(14, 40, -12, '3', '#111827') + CARD(28, 34, -4, '7', '#DC2626') + CARD(42, 28, 4, 'J', '#111827') + CARD(54, 22, 12, 'K', '#DC2626').replace('rotate(12)', 'rotate(10)') +
      '<path d="M6 20l14-12M20 8h-8M20 8v8" stroke="url(#IDa)" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    envelope: '<defs>' + GOLD + lg('IDr', '#F87171', '#991B1B') + '</defs>' + sh(22) + '<g transform="rotate(-10 22 34)"><rect x="10" y="16" width="26" height="36" rx="3" fill="url(#IDr)"/><path d="M10 16l13 12 13-12z" fill="#B91C1C"/><circle cx="23" cy="30" r="5" fill="url(#IDg)"/></g>' +
      '<g transform="rotate(10 42 32)"><rect x="29" y="12" width="26" height="38" rx="3" fill="url(#IDr)"/><path d="M29 12l13 13 13-13z" fill="#B91C1C"/><circle cx="42" cy="28" r="6" fill="url(#IDg)"/><path d="M39 28h6M42 25v6" stroke="#92400E" stroke-width="1.4"/></g>' + tw(54, 10, .8),
    treasure: '<defs>' + lg('IDp', '#FEF3C7', '#D97706') + '</defs>' + sh(26) + '<path d="M6 14l16-6 20 6 16-6v42l-16 6-20-6-16 6z" fill="url(#IDp)" stroke="#92400E" stroke-width="1.4"/><path d="M22 8v42M42 14v42" stroke="#92400E" stroke-width="1" opacity=".5"/>' +
      '<path d="M12 44q8-14 16-6t16-16" stroke="#7F1D1D" stroke-width="1.8" stroke-dasharray="3 3" fill="none"/><path d="M40 18l8 8M48 18l-8 8" stroke="#DC2626" stroke-width="3.4" stroke-linecap="round"/><ellipse cx="14" cy="44" rx="5" ry="3" fill="#4D7C0F"/>',
    flip21: '<defs>' + GOLD + '</defs>' + sh(24) + CARD(18, 34, -14, 'A', '#DC2626') + CARD(32, 30, 0, 'Q', '#111827') + CARD(46, 34, 14, '7', '#DC2626') +
      '<circle cx="32" cy="54" r="8" fill="url(#IDg)" stroke="#78350F"/><text x="32" y="57.5" text-anchor="middle" font-family="Arial" font-weight="900" font-size="9" fill="#78350F">21</text>',
    popdarts: '<defs>' + GOLD + '</defs>' + sh(20) + '<path d="M22 44q-1 8 2 14" stroke="#E5E7EB" stroke-width="1" fill="none"/><path d="M22 10c10 0 16 8 16 17S30 44 22 44 6 36 6 27 12 10 22 10z" fill="#F43F5E"/>' +
      '<path d="M44 26c8 0 13 6 13 14s-6 14-13 14-13-6-13-14 5-14 13-14z" fill="url(#IDg)"/><ellipse cx="16" cy="20" rx="3" ry="5" fill="#fff" opacity=".5" transform="rotate(-25 16 20)"/>' +
      '<g transform="rotate(40 38 22)"><path d="M38 22l-2-20h4z" fill="#E5E7EB"/><path d="M35 2l3-6 3 6z" fill="#2563EB"/></g>' + star(48, 40, 5, '#fff'),
    egghunt: '<defs>' + GOLD + lg('IDs', '#FFFFFF', '#64748B') + '</defs>' + '<ellipse cx="32" cy="54" rx="28" ry="8" fill="#15803D"/><circle cx="12" cy="48" r="9" fill="#22C55E"/><circle cx="52" cy="48" r="9" fill="#22C55E"/>' +
      '<path d="M24 22c6 0 9 10 9 15 0 6-4 9-9 9s-9-3-9-9c0-5 3-15 9-15z" fill="url(#IDs)" stroke="#475569"/><path d="M40 16c7 0 11 11 11 17 0 7-5 11-11 11s-11-4-11-11c0-6 4-17 11-17z" fill="url(#IDg)" stroke="#92400E"/>' +
      '<path d="M30 33l5-3 5 3 5-3 5 3" stroke="#fff" stroke-width="1.6" fill="none" opacity=".7"/>' + tw(54, 10, .8),
    shells: '<defs>' + lg('IDs', '#FFEDD5', '#C2410C') + rg('IDp', '#FFFFFF', '#F5F3FF', '#A5B4FC') + '</defs>' + sh(26) +
      '<g transform="translate(20 40)"><path d="M-14 6C-15-7-8-15 0-15S15-7 14 6z" fill="url(#IDs)" stroke="#9A3412"/><path d="M0 6L-8-13M0 6L0-15M0 6L8-13" stroke="#9A3412" opacity=".5"/></g>' +
      '<g transform="translate(46 40)"><path d="M-14 6C-15-7-8-15 0-15S15-7 14 6z" fill="url(#IDs)" stroke="#9A3412" transform="translate(0 -12) rotate(-14)"/></g><circle cx="46" cy="44" r="5.4" fill="url(#IDp)" stroke="#A5B4FC"/>' +
      '<g transform="translate(32 18)"><ellipse rx="9" ry="6" fill="#DC2626"/><path d="M-9-2q-7-7-2-11 2 4 5 2zM9-2q7-7 2-11-2 4-5 2z" fill="#EF4444"/><circle cx="-3" cy="-6" r="1.6" fill="#fff"/><circle cx="3" cy="-6" r="1.6" fill="#fff"/></g>',
    colorwheel: '<defs>' + GOLD + '</defs>' + sh(22) + (function () { var o = '', C = ['#FBBF24', '#EF4444', '#3B82F6', '#EF4444', '#22C55E', '#EF4444', '#3B82F6', '#EF4444', '#22C55E', '#3B82F6']; for (var j = 0; j < 10; j++) { var a0 = (j * 36 - 108) * Math.PI / 180, a1 = ((j + 1) * 36 - 108) * Math.PI / 180; o += '<path d="M32 32L' + (32 + Math.cos(a0) * 24).toFixed(1) + ' ' + (32 + Math.sin(a0) * 24).toFixed(1) + 'A24 24 0 0 1 ' + (32 + Math.cos(a1) * 24).toFixed(1) + ' ' + (32 + Math.sin(a1) * 24).toFixed(1) + 'z" fill="' + C[j] + '" stroke="#fff" stroke-width=".8"/>'; } return o; })() +
      '<circle cx="32" cy="32" r="24" fill="none" stroke="url(#IDg)" stroke-width="3"/><circle cx="32" cy="32" r="5" fill="#1E1B4B" stroke="#FDE68A" stroke-width="1.4"/><path d="M32 12l-5-9h10z" fill="#FDE68A" stroke="#78350F"/>',
    luckyten: '<defs>' + GOLD + rg('IDc', '#FFFFFF', '#E0F2FE', '#7DD3FC') + '</defs>' + sh(20) + '<path d="M22 46h20l-3 10H25z" fill="url(#IDg)"/><circle cx="32" cy="26" r="21" fill="#0B1222"/>' +
      [[24, 30, '#EF4444', '3'], [38, 34, '#3B82F6', '7'], [31, 18, '#22C55E', '1'], [40, 22, '#A855F7', '9']].map(function (b) { return '<circle cx="' + b[0] + '" cy="' + b[1] + '" r="6" fill="' + b[2] + '"/><circle cx="' + b[0] + '" cy="' + b[1] + '" r="3.2" fill="#fff"/><text x="' + b[0] + '" y="' + (b[1] + 1.8) + '" text-anchor="middle" font-family="Arial" font-weight="900" font-size="4.6" fill="#111">' + b[3] + '</text>'; }).join('') +
      '<circle cx="32" cy="26" r="21" fill="url(#IDc)" opacity=".25" stroke="#E0F2FE" stroke-width="1.6"/>' + hi(32, 26, 21)
  });
  var L = [
    ['scarab', 'Scarab Sun', 'casa1', ['#FEF3C7', '#B45309']], ['kraken', 'Kraken Deep', 'casa1', ['#FAE8FF', '#A21CAF']], ['donut', 'Donut Shop', 'casa1', ['#FCE7F3', '#DB2777']],
    ['cherrybar', 'Cherry Bar', 'casa1', ['#FEE2E2', '#B91C1C']], ['ufo', 'UFO Invasion', 'casa1', ['#DCFCE7', '#16A34A']], ['koi', 'Koi Fortune', 'casa1', ['#FFE4E6', '#DC2626']],
    ['goldtrain', 'Gold Train', 'casa1', ['#FFEDD5', '#C2410C']], ['viking', 'Viking Raid', 'casa1', ['#E2E8F0', '#475569']], ['safari', 'Safari King', 'casa1', ['#FEF9C3', '#CA8A04']],
    ['rubymine', 'Ruby Mine', 'casa1', ['#FFE4E6', '#BE123C']], ['pumpkin', 'Pumpkin Night', 'casa1', ['#FFEDD5', '#EA580C']], ['medusa', 'Medusa', 'casa1', ['#D1FAE5', '#047857']],
    ['scratchwin', 'Win Numbers', 'casa2', ['#F3E8FF', '#7E22CE']], ['pickbox', 'Mystery Boxes', 'casa2', ['#FCE7F3', '#BE185D']], ['ladder', 'Lucky Ladder', 'casa2', ['#E0F2FE', '#0369A1']],
    ['hilorun', 'Hi-Lo Run', 'casa2', ['#DCFCE7', '#15803D']], ['envelope', 'Red Envelopes', 'casa2', ['#FEE2E2', '#B91C1C']], ['treasure', 'Pirate Map', 'casa2', ['#FEF3C7', '#92400E']],
    ['flip21', 'Lucky 21', 'casa3', ['#DBEAFE', '#1D4ED8']], ['popdarts', 'Balloon Darts', 'casa3', ['#FFE4E6', '#E11D48']], ['egghunt', 'Egg Hunt', 'casa3', ['#DCFCE7', '#16A34A']],
    ['shells', 'Crab Shells', 'casa3', ['#E0F2FE', '#0284C7']], ['colorwheel', 'Color Wheel', 'casa3', ['#EDE9FE', '#6D28D9']], ['luckyten', 'Lucky Numbers', 'casa3', ['#E0E7FF', '#4338CA']]
  ];
  D6.CasinoCatalog.add(L.map(function (g) { return { k: g[0], name: g[1], sec: 'more', file: g[2], pal: g[3], icon: ICONS[g[0]] }; }));
})(window.D6 = window.D6 || {});
