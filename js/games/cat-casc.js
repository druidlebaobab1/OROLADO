/* casc catalogue (owner request, round 7): 24 more Casino games — 12 video slots (js/games/casc1.js) and 12 instant games
   (js/games/casc2.js, casc3.js); server fiches: casino_ext/casc.php. Logos = the game's own object, same style as the others. */
(function (D6) {
  if (!D6.CasinoCatalog) return;
  function rg(id, a, b, c) { return '<radialGradient id="' + id + '" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="' + a + '"/><stop offset=".55" stop-color="' + b + '"/><stop offset="1" stop-color="' + c + '"/></radialGradient>'; }
  function lg(id, a, b) { return '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient>'; }
  function hi(x, y, r) { return '<ellipse cx="' + (x - r * .34) + '" cy="' + (y - r * .4) + '" rx="' + (r * .34) + '" ry="' + (r * .22) + '" fill="#fff" opacity=".6" transform="rotate(-30 ' + (x - r * .34) + ' ' + (y - r * .4) + ')"/>'; }
  function sh(w) { return '<ellipse cx="32" cy="57.5" rx="' + (w || 24) + '" ry="4.3" fill="#000" opacity=".28"/>'; }
  function tw(x, y, s) { s = s || 1; return '<path d="M' + x + ' ' + (y - 5 * s) + 'l' + (1.3 * s) + ' ' + (3.7 * s) + ' ' + (3.7 * s) + ' ' + (1.3 * s) + '-' + (3.7 * s) + ' ' + (1.3 * s) + '-' + (1.3 * s) + ' ' + (3.7 * s) + '-' + (1.3 * s) + '-' + (3.7 * s) + '-' + (3.7 * s) + '-' + (1.3 * s) + ' ' + (3.7 * s) + '-' + (1.3 * s) + 'z" fill="#FDE68A"/>'; }
  function star(cx, cy, r, f) { var d = ''; for (var j = 0; j < 10; j++) { var a = -Math.PI / 2 + j * Math.PI / 5, rr = j % 2 ? r * .45 : r; d += (j ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1); } return '<path d="' + d + 'z" fill="' + f + '"/>'; }
  var GOLD = lg('IDg', '#FEF3C7', '#D97706');
  var ICONS = {
    samurai: '<defs>' + GOLD + lg('IDk', '#4B5563', '#030712') + lg('IDr', '#F87171', '#991B1B') + '</defs>' + sh(24) +
      '<path d="M12 40c0-18 9-28 20-28s20 10 20 28z" fill="url(#IDk)" stroke="#FBBF24" stroke-width="1.4"/><path d="M32 12C24 2 12 2 6 9c8-1 15 2 19 7zM32 12c8-10 20-10 26-3-8-1-15 2-19 7z" fill="url(#IDg)" stroke="#78350F" stroke-width="1.2"/>' +
      '<circle cx="32" cy="21" r="4.6" fill="url(#IDr)" stroke="#FBBF24"/><path d="M6 40h52l-4 9H10z" fill="url(#IDr)" stroke="#450A0A"/><path d="M10 49l-4 8M54 49l4 8M20 49v8M44 49v8" stroke="#7F1D1D" stroke-width="3.4" stroke-linecap="round"/>' + tw(56, 26, .8),
    mermaid: '<defs>' + lg('IDt', '#99F6E4', '#0F766E') + lg('IDf', '#F5D0FE', '#A855F7') + '</defs>' + sh(20) +
      '<path d="M28 4c10 6 13 17 7 29-4 9-3 15 3 20-9 0-18 1-24 5 4-6 12-9 15-13-5-9-7-26-1-41z" fill="url(#IDt)" stroke="#134E4A" stroke-width="1.2"/>' +
      '<path d="M38 53c7-3 15 0 21 6-7 1-14 0-21-6z" fill="url(#IDf)" stroke="#6B21A8"/><path d="M14 58c3-6 9-8 15-6-4 3-9 5-15 6z" fill="url(#IDf)" stroke="#6B21A8"/>' + [[28, 14], [31, 22], [29, 30], [27, 38]].map(function (p) { return '<path d="M' + (p[0] - 4) + ' ' + p[1] + 'q4 4 8 0" stroke="#CCFBF1" stroke-width="1.4" fill="none"/>'; }).join('') +
      '<circle cx="50" cy="20" r="5" fill="#E0F2FE" opacity=".8"/><circle cx="54" cy="10" r="3" fill="#E0F2FE" opacity=".6"/>' + tw(10, 14, .7),
    carnival: '<defs>' + GOLD + lg('IDp', '#F9A8D4', '#BE185D') + lg('IDv', '#C4B5FD', '#6D28D9') + '</defs>' + sh(24) +
      '<path d="M50 24Q60 6 54 0q0 12-8 20M44 22Q48 4 40 0q2 12-3 20" fill="none" stroke="url(#IDp)" stroke-width="4.4" stroke-linecap="round"/>' +
      '<path d="M4 28c7-6 18-7 28 0 10-7 21-6 28 0-1 16-9 23-18 22-4-1-7-4-10-4s-6 3-10 4C13 51 5 44 4 28z" fill="url(#IDg)" stroke="#78350F" stroke-width="1.4"/>' +
      '<path d="M13 32q5-5 11 0-5 5-11 0zM40 32q5-5 11 0-5 5-11 0z" fill="#1E1B4B"/><circle cx="32" cy="28" r="2.6" fill="#E11D48"/>' + tw(10, 10, .8),
    jazzclub: '<defs>' + GOLD + '</defs>' + sh(20) +
      '<path d="M40 4l3 3-4 4v30c0 12-8 19-17 19-8 0-12-5-12-11 0-4 3-7 7-7l3 7c-1 0-3 1-3 3 0 3 3 4 5 4 6 0 9-4 9-11V14z" fill="url(#IDg)" stroke="#78350F" stroke-width="1.3"/>' +
      '<path d="M40 4l10-3 1 4-10 3z" fill="#111827"/>' + [18, 25, 32, 39].map(function (y) { return '<circle cx="36" cy="' + y + '" r="2.4" fill="#FEF3C7" stroke="#92400E" stroke-width=".8"/>'; }).join('') +
      '<path d="M50 20v14l-2 2M56 16v14l-2 2" stroke="#E5E7EB" stroke-width="2" fill="none"/><circle cx="47" cy="37" r="3" fill="#E5E7EB"/><circle cx="53" cy="33" r="3" fill="#E5E7EB"/>',
    oasis: '<defs>' + GOLD + lg('IDw', '#67E8F9', '#0E7490') + lg('IDl', '#86EFAC', '#15803D') + '</defs>' +
      '<circle cx="46" cy="16" r="9" fill="#FDE68A"/><path d="M0 50Q32 38 64 50V64H0z" fill="url(#IDg)"/><ellipse cx="34" cy="52" rx="16" ry="4" fill="url(#IDw)"/>' +
      '<path d="M22 50Q20 34 24 22" stroke="#92400E" stroke-width="4" fill="none" stroke-linecap="round"/>' + ['M24 22Q12 14 2 20q12-2 22 6', 'M24 22Q36 12 46 18q-12-2-22 6', 'M24 22Q18 8 8 6q12 4 16 16', 'M24 22Q32 6 42 6q-12 4-18 16'].map(function (d) { return '<path d="' + d + '" fill="url(#IDl)" stroke="#14532D" stroke-width=".8"/>'; }).join('') + tw(56, 36, .7),
    arctic: '<defs>' + rg('IDb', '#FFFFFF', '#F1F5F9', '#94A3B8') + '</defs>' + sh(24) +
      '<circle cx="14" cy="16" r="7" fill="#F8FAFC" stroke="#94A3B8"/><circle cx="50" cy="16" r="7" fill="#F8FAFC" stroke="#94A3B8"/><circle cx="14" cy="16" r="3.4" fill="#CBD5E1"/><circle cx="50" cy="16" r="3.4" fill="#CBD5E1"/>' +
      '<ellipse cx="32" cy="34" rx="22" ry="21" fill="url(#IDb)" stroke="#94A3B8" stroke-width="1.2"/><ellipse cx="32" cy="43" rx="9" ry="7" fill="#E2E8F0"/><ellipse cx="32" cy="39" rx="4" ry="3" fill="#111827"/>' +
      '<circle cx="24" cy="30" r="2.4" fill="#111827"/><circle cx="40" cy="30" r="2.4" fill="#111827"/><path d="M29 47q3 2 6 0" stroke="#111827" stroke-width="1.4" fill="none"/>' + star(54, 46, 5, '#BAE6FD') + star(8, 44, 3.6, '#E0F2FE'),
    steampunk: '<defs>' + GOLD + lg('IDc', '#FFE4C7', '#7C3F14') + '</defs>' + sh(24) +
      (function () { var cog = function (cx, cy, r, f) { var d = ''; for (var i = 0; i < 16; i++) { var a = i * Math.PI / 8, rr = i % 2 ? r : r * .8; d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1); } return '<path d="' + d + 'z" fill="' + f + '" stroke="#422006" stroke-width="1"/><circle cx="' + cx + '" cy="' + cy + '" r="' + (r * .34) + '" fill="#1C1206"/>'; }; return cog(24, 36, 19, 'url(#IDg)') + cog(48, 20, 13, 'url(#IDc)') + cog(50, 46, 8, '#CBD5E1'); })() +
      hi(20, 30, 12),
    cybercity: '<defs>' + lg('IDm', '#E0E7FF', '#4338CA') + '</defs>' + '<path d="M2 58V30h8v-8h8v36M22 58V14h10v44M36 58V26h8v-6h8v38M54 58V34h8v24" fill="#1E1B4B" stroke="#C084FC" stroke-width="1.4"/>' +
      [[6, 36], [26, 20], [26, 30], [40, 32], [48, 26], [58, 40], [14, 30], [26, 44]].map(function (p, i) { return '<rect x="' + p[0] + '" y="' + p[1] + '" width="3" height="3" fill="' + ['#22D3EE', '#F472B6', '#FDE047'][i % 3] + '"/>'; }).join('') +
      '<rect x="18" y="4" width="28" height="22" rx="6" fill="url(#IDm)" stroke="#1E1B4B" stroke-width="1.2"/><rect x="22" y="10" width="20" height="8" rx="4" fill="#0B1020"/><circle cx="28" cy="14" r="2.4" fill="#22D3EE"/><circle cx="36" cy="14" r="2.4" fill="#22D3EE"/>' +
      '<path d="M0 60h64" stroke="#F472B6" stroke-width="2"/>',
    fairy: '<defs>' + GOLD + rg('IDr', '#FECACA', '#EF4444', '#7F1D1D') + lg('IDh', '#FFFBEB', '#FDE68A') + '</defs>' + sh(20) +
      '<path d="M22 36h20v22H22z" fill="url(#IDh)" stroke="#92400E" stroke-width="1"/><path d="M28 58V48q4-4 8 0v10z" fill="#92400E"/><circle cx="37" cy="42" r="2.4" fill="#38BDF8" stroke="#92400E" stroke-width=".8"/>' +
      '<path d="M8 38C9 20 19 10 32 10s23 10 24 28z" fill="url(#IDr)" stroke="#7F1D1D" stroke-width="1.3"/><circle cx="20" cy="24" r="3.6" fill="#fff"/><circle cx="35" cy="17" r="3" fill="#fff"/><circle cx="45" cy="28" r="3.6" fill="#fff"/>' +
      tw(56, 10, .9) + tw(8, 10, .6) + '<circle cx="54" cy="24" r="1.6" fill="#FDE68A"/>',
    dinopark: '<defs>' + lg('IDd', '#BEF264', '#3F6212') + '</defs>' + sh(26) +
      '<path d="M4 26c0-12 12-20 30-19 14 1 24 9 24 20 0 7-4 11-11 11H34l-4 13c-1 5-8 7-12 3L10 44C6 40 4 33 4 26z" fill="url(#IDd)" stroke="#1A2E05" stroke-width="1.4"/>' +
      '<path d="M34 38h16M37 38v4M42 38v4M47 38v4" stroke="#fff" stroke-width="2"/><circle cx="44" cy="20" r="3.6" fill="#FDE047" stroke="#1A2E05"/><path d="M44 18v4" stroke="#111" stroke-width="1.6"/><path d="M39 14q4-4 10-1" stroke="#1A2E05" stroke-width="2" fill="none"/>' +
      '<circle cx="18" cy="20" r="2.6" fill="#3F6212" opacity=".6"/><circle cx="26" cy="14" r="2.6" fill="#3F6212" opacity=".6"/>' + tw(56, 50, .7),
    sushibar: '<defs>' + lg('IDs', '#FED7AA', '#EA580C') + lg('IDw', '#FFFFFF', '#E5E7EB') + '</defs>' + sh(24) +
      '<rect x="8" y="30" width="48" height="18" rx="9" fill="url(#IDw)" stroke="#9CA3AF"/><path d="M5 30c3-12 16-16 27-15s23 3 27 15c-4 4-50 4-54 0z" fill="url(#IDs)" stroke="#9A3412" stroke-width="1.2"/>' +
      '<path d="M16 22q4 5 3 9M27 18q4 5 3 12M38 18q4 5 3 12M49 22q3 4 2 8" stroke="#FFF7ED" stroke-width="2" fill="none"/><rect x="28" y="22" width="8" height="26" fill="#14532D"/>' +
      '<path d="M44 6L60 2M46 10l16-4" stroke="#B45309" stroke-width="2.4" stroke-linecap="round"/>',
    disco: '<defs>' + rg('IDb', '#FFFFFF', '#CBD5E1', '#334155') + '</defs>' + '<path d="M32 0v8" stroke="#9CA3AF" stroke-width="1.4"/><circle cx="32" cy="32" r="24" fill="url(#IDb)"/>' +
      (function () { var s = ''; for (var r = 0; r < 6; r++) for (var c = 0; c < 6; c++) { var x = 14.5 + c * 7, y = 14.5 + r * 7, dx = x - 32, dy = y - 32; if (dx * dx + dy * dy > 21 * 21) continue; s += '<rect x="' + (x - 2.9).toFixed(1) + '" y="' + (y - 2.9).toFixed(1) + '" width="5.8" height="5.8" fill="' + ['#F9A8D4', '#C4B5FD', '#FFFFFF', '#67E8F9', '#E2E8F0'][(r * 3 + c) % 5] + '" opacity=".8"/>'; } return s; })() +
      '<circle cx="32" cy="32" r="24" fill="none" stroke="#475569" stroke-width="1.2"/>' + hi(32, 32, 24) + tw(56, 50, .8) + tw(8, 50, .6)
  };
  var L = [
    ['samurai', 'Samurai', 'casc1', ['#FFE4E6', '#BE123C']], ['mermaid', 'Mermaid Lagoon', 'casc1', ['#CCFBF1', '#0D9488']], ['carnival', 'Carnival', 'casc1', ['#FAE8FF', '#A21CAF']],
    ['jazzclub', 'Jazz Club', 'casc1', ['#FEF3C7', '#92400E']], ['oasis', 'Desert Oasis', 'casc1', ['#FFEDD5', '#C2410C']], ['arctic', 'Arctic', 'casc1', ['#E0F2FE', '#0284C7']],
    ['steampunk', 'Steampunk', 'casc1', ['#FEF3C7', '#78350F']], ['cybercity', 'Cyber City', 'casc1', ['#F3E8FF', '#7E22CE']], ['fairy', 'Fairy Forest', 'casc1', ['#ECFCCB', '#4D7C0F']],
    ['dinopark', 'Dino Park', 'casc1', ['#ECFCCB', '#3F6212']], ['sushibar', 'Sushi Bar', 'casc1', ['#FFE4E6', '#B91C1C']], ['disco', 'Disco Night', 'casc1', ['#FCE7F3', '#BE185D']]
  ];
  D6.CasinoCatalog.add(L.map(function (g) { return { k: g[0], name: g[1], sec: 'more', file: g[2], pal: g[3], icon: ICONS[g[0]] }; }));
})(window.D6 = window.D6 || {});
