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
  Object.assign(ICONS, {
    potion: '<defs>' + rg('IDp', '#F5D0FE', '#A855F7', '#581C87') + lg('IDl', '#86EFAC', '#15803D') + '</defs>' + sh(20) +
      '<path d="M26 6h12v14l14 22c4 7-1 16-9 16H19c-8 0-13-9-9-16l16-22z" fill="url(#IDp)" stroke="#3B0764" stroke-width="1.4"/><path d="M14 40h36" stroke="#fff" stroke-opacity=".5" stroke-width="1.6"/>' +
      '<rect x="23" y="2" width="18" height="7" rx="2.4" fill="#B45309"/><circle cx="26" cy="46" r="3.4" fill="#fff" opacity=".7"/><circle cx="37" cy="36" r="2.4" fill="#fff" opacity=".6"/><circle cx="34" cy="50" r="1.8" fill="#fff" opacity=".6"/>' + hi(22, 44, 9) + tw(54, 14, .8) + tw(10, 20, .6),
    defuse: '<defs>' + rg('IDb', '#94A3B8', '#1E293B', '#020617') + '</defs>' + sh(22) +
      '<path d="M40 14q8-12 18-6" stroke="#A16207" stroke-width="3" fill="none" stroke-linecap="round"/>' + star(58, 8, 5, '#FDE047') + '<circle cx="30" cy="36" r="22" fill="url(#IDb)"/>' +
      '<rect x="16" y="34" width="28" height="14" rx="3" fill="#0B0F19" stroke="#64748B"/><text x="30" y="45" text-anchor="middle" font-family="monospace" font-weight="900" font-size="10" fill="#EF4444">0:05</text>' +
      '<path d="M20 48q-4 8-12 10M30 48q0 8 4 12M40 48q6 6 14 6" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M20 48q-4 8-12 10" stroke="#EF4444" stroke-width="3" fill="none"/><path d="M30 48q0 8 4 12" stroke="#3B82F6" stroke-width="3" fill="none"/><path d="M40 48q6 6 14 6" stroke="#22C55E" stroke-width="3" fill="none"/>' + hi(24, 28, 12),
    stoneskip: '<defs>' + lg('IDw', '#C4B5FD', '#4C1D95') + rg('IDs', '#F5F5F4', '#78716C', '#292524') + '</defs>' +
      '<ellipse cx="32" cy="50" rx="30" ry="10" fill="url(#IDw)"/>' + [[12, 50, 6], [28, 46, 5], [42, 43, 4], [53, 41, 3]].map(function (q) { return '<ellipse cx="' + q[0] + '" cy="' + q[1] + '" rx="' + q[2] * 1.6 + '" ry="' + q[2] * .5 + '" fill="none" stroke="#fff" stroke-width="1.4" opacity=".8"/>'; }).join('') +
      '<path d="M8 40q8-18 16-4t12-4 10-2 8 0" stroke="#fff" stroke-width="1.4" stroke-dasharray="2 3" fill="none" opacity=".8"/><ellipse cx="50" cy="22" rx="11" ry="6.5" fill="url(#IDs)" stroke="#1C1917" stroke-width="1.2" transform="rotate(-14 50 22)"/>' + hi(50, 22, 9) + tw(14, 14, .8),
    tarot: '<defs>' + GOLD + lg('IDb', '#4338CA', '#1E1B4B') + '</defs>' + sh(22) +
      '<g transform="rotate(-12 22 34)"><rect x="8" y="12" width="28" height="42" rx="4" fill="url(#IDb)" stroke="url(#IDg)" stroke-width="2"/><circle cx="22" cy="33" r="6" fill="none" stroke="#FBBF24" stroke-width="1.4"/></g>' +
      '<g transform="rotate(10 42 32)"><rect x="28" y="10" width="28" height="44" rx="4" fill="#FFFBEB" stroke="url(#IDg)" stroke-width="2"/>' + [0, 1, 2, 3, 4, 5, 6, 7].map(function (j) { return '<path d="M42 21l1.6 4h-3.2z" fill="#F59E0B" transform="rotate(' + j * 45 + ' 42 32)"/>'; }).join('') + '<circle cx="42" cy="32" r="6.4" fill="url(#IDg)" stroke="#B45309"/><text x="42" y="50" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="6" fill="#92400E">XIX</text></g>' + tw(10, 10, .8),
    bottleflip: '<defs>' + lg('IDb', '#E0F2FE', '#38BDF8') + '</defs>' + sh(16) +
      '<path d="M10 22q6-16 22-16" stroke="#fff" stroke-width="1.8" stroke-dasharray="2 3" fill="none" opacity=".8"/><path d="M42 6l4 4-5 2" stroke="#fff" stroke-width="1.8" fill="none" opacity=".8"/>' +
      '<g transform="rotate(18 34 34)"><rect x="24" y="22" width="20" height="34" rx="6" fill="url(#IDb)" stroke="#0369A1" stroke-width="1.4"/><path d="M24 26q0-7 5-8h10q5 1 5 8" fill="url(#IDb)" stroke="#0369A1" stroke-width="1.4"/><rect x="29" y="12" width="10" height="6" rx="2" fill="#1D4ED8"/>' +
      '<rect x="24" y="32" width="20" height="9" fill="#F43F5E"/><rect x="25" y="44" width="18" height="11" rx="5" fill="#0EA5E9" opacity=".7"/><rect x="27" y="24" width="3" height="28" rx="1.5" fill="#fff" opacity=".5"/></g>' + tw(54, 50, .7),
    gemfusion: '<defs>' + lg('IDr', '#F43F5E', '#C084FC') + lg('IDc', '#C084FC', '#60A5FA') + '</defs>' + sh(22) +
      '<circle cx="32" cy="32" r="24" fill="none" stroke="#C4B5FD" stroke-width="1.6" stroke-dasharray="4 4" opacity=".8"/>' +
      '<path d="M22 18h20l10 11-20 22-20-22z" fill="url(#IDr)" stroke="#4C1D95" stroke-width="1.4" stroke-linejoin="round"/><path d="M12 29h40M22 18l-3 11 13 22 13-22-3-11M19 29l13-11 13 11" stroke="#fff" stroke-opacity=".6" stroke-width="1" fill="none"/>' +
      '<path d="M6 10l4 4-4 4-4-4zM58 46l4 4-4 4-4-4z" fill="url(#IDc)"/>' + tw(54, 12, .9) + tw(10, 50, .6),
    cargodrop: '<defs>' + lg('IDc', '#FCA5A5', '#DC2626') + lg('IDm', '#FFFFFF', '#94A3B8') + '</defs>' + sh(20) +
      '<path d="M8 22a24 18 0 0 1 48 0q-6-4-12 0-6-4-12 0-6-4-12 0-6-4-12 0z" fill="url(#IDc)" stroke="#7F1D1D" stroke-width="1.2"/><path d="M8 22l16 18M56 22L40 40M26 20l2 20M38 20l-2 20" stroke="#E2E8F0" stroke-width="1"/>' +
      '<path d="M22 38h20l4 14H18z" fill="url(#IDm)" stroke="#334155" stroke-width="1.4"/><circle cx="32" cy="45" r="3.6" fill="#38BDF8" stroke="#1E3A8A"/><path d="M16 52h32l-3 5H19z" fill="#F97316"/>',
    mahjong: '<defs>' + lg('IDt', '#FFFBF0', '#E7E5E4') + '</defs>' + sh(24) +
      '<g transform="rotate(-10 20 34)"><rect x="8" y="16" width="24" height="34" rx="4" fill="#15803D"/><rect x="8" y="14" width="24" height="32" rx="4" fill="url(#IDt)" stroke="#A8A29E"/><text x="20" y="37" text-anchor="middle" font-family="serif" font-weight="900" font-size="18" fill="#DC2626">中</text></g>' +
      '<g transform="rotate(8 44 32)"><rect x="32" y="14" width="24" height="34" rx="4" fill="#15803D"/><rect x="32" y="12" width="24" height="32" rx="4" fill="url(#IDt)" stroke="#A8A29E"/>' +
      [[38, 20], [44, 20], [50, 20], [38, 32], [44, 32], [50, 32]].map(function (p) { return '<rect x="' + (p[0] - 1.8) + '" y="' + (p[1] - 4.5) + '" width="3.6" height="9" rx="1.6" fill="#16A34A"/>'; }).join('') + '</g>' + tw(56, 10, .8),
    robobox: '<defs>' + lg('IDb', '#93C5FD', '#1D4ED8') + rg('IDr', '#FECACA', '#DC2626', '#7F1D1D') + '</defs>' + sh(20) +
      '<rect x="18" y="6" width="28" height="22" rx="7" fill="url(#IDb)" stroke="#1E3A8A" stroke-width="1.4"/><rect x="22" y="12" width="20" height="9" rx="4" fill="#0F172A"/><circle cx="28" cy="16.5" r="2.4" fill="#22D3EE"/><circle cx="36" cy="16.5" r="2.4" fill="#22D3EE"/><path d="M32 6V1" stroke="#94A3B8" stroke-width="2"/><circle cx="32" cy="1.5" r="2" fill="#FDE047"/>' +
      '<rect x="16" y="30" width="32" height="24" rx="8" fill="url(#IDb)" stroke="#1E3A8A" stroke-width="1.4"/><circle cx="32" cy="40" r="4" fill="#FDE047"/>' +
      '<circle cx="9" cy="34" r="8.5" fill="url(#IDr)"/><circle cx="55" cy="26" r="8.5" fill="url(#IDr)"/>' + hi(55, 26, 8) + star(56, 50, 5, '#FDE047'),
    lantern: '<defs>' + GOLD + lg('IDr', '#FDBA74', '#DC2626') + '</defs>' +
      '<circle cx="34" cy="28" r="24" fill="#FDE68A" opacity=".25"/><path d="M14 12q20-9 40 0l-6 32H20z" fill="url(#IDg)" stroke="#92400E" stroke-width="1.4"/><path d="M28 9l1 35M40 9l-1 35" stroke="#92400E" stroke-opacity=".35"/><rect x="19" y="42" width="30" height="4" rx="2" fill="#78350F"/>' +
      '<ellipse cx="34" cy="48" rx="11" ry="3" fill="#FEF08A"/><ellipse cx="34" cy="40" rx="5.4" ry="7" fill="#FFF7D6"/>' +
      '<g transform="translate(9 44) scale(.5)"><path d="M-15-14q15-6 30 0l-4 25h-22z" fill="url(#IDr)"/></g><g transform="translate(58 54) scale(.4)"><path d="M-15-14q15-6 30 0l-4 25h-22z" fill="url(#IDr)"/></g>' + tw(56, 12, .8),
    meteor: '<defs>' + lg('IDt', '#FDE68A', '#F43F5E') + rg('IDh', '#FFFFFF', '#FDE68A', '#F97316') + GOLD + '</defs>' + sh(18) +
      '<path d="M58 4L26 30l4 4z" fill="url(#IDt)" opacity=".85"/><circle cx="26" cy="32" r="7" fill="url(#IDh)"/>' +
      '<path d="M18 56l-3-12 6-6 3 18zM24 56l1-20 7 8-2 12zM32 56l4-12 5 6-3 6z" fill="url(#IDg)" stroke="#92400E" stroke-width="1.2" stroke-linejoin="round"/><path d="M44 56l2-10 5 5-1 5z" fill="#A855F7" stroke="#6B21A8"/>' + tw(10, 10, .8) + tw(46, 22, .6),
    curling: '<defs>' + rg('IDs', '#F3F4F6', '#9CA3AF', '#4B5563') + '</defs>' +
      '<ellipse cx="32" cy="46" rx="30" ry="14" fill="#2563EB"/><ellipse cx="32" cy="46" rx="20" ry="9.4" fill="#fff"/><ellipse cx="32" cy="46" rx="11" ry="5" fill="#DC2626"/><ellipse cx="32" cy="46" rx="4" ry="1.8" fill="#fff"/>' +
      '<ellipse cx="34" cy="30" rx="18" ry="11" fill="url(#IDs)" stroke="#374151" stroke-width="1.4"/><ellipse cx="34" cy="27" rx="13" ry="6.5" fill="#E5E7EB"/><rect x="26" y="20" width="16" height="5" rx="2.5" fill="#2563EB"/><path d="M38 22v-6h7" stroke="#2563EB" stroke-width="3" fill="none" stroke-linecap="round"/>' + hi(30, 28, 10) + tw(56, 10, .8)
  });
  // casd (round 8) : logos des 6 machines à sous de plus (dessins pleins, pas de rond)
  Object.assign(ICONS, {
    westgold: '<defs>' + rg('IDn', '#FDE68A', '#F59E0B', '#92400E') + '</defs>' + sh(22) +
      (function () { var d = ''; for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 12 : 28; d += (i ? 'L' : 'M') + (32 + Math.cos(a) * r).toFixed(1) + ' ' + (32 + Math.sin(a) * r).toFixed(1); } return '<path d="' + d + 'z" fill="url(#IDn)" stroke="#5C2E0E" stroke-width="2" stroke-linejoin="round"/>'; })() +
      '<circle cx="32" cy="32" r="11" fill="#78350F"/><text x="32" y="38" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="15" fill="#FDE68A">$</text>' + hi(26, 24, 8),
    piratecove: '<defs>' + rg('IDw', '#FFFFFF', '#E5E7EB', '#94A3B8') + '</defs>' +
      '<path d="M32 6C18 6 10 16 10 28c0 7 3 11 7 14v8h6v-5h5v5h8v-5h5v5h6v-8c4-3 7-7 7-14C54 16 46 6 32 6z" fill="url(#IDw)" stroke="#475569" stroke-width="1.6"/>' +
      '<circle cx="24" cy="28" r="5.5" fill="#111827"/><circle cx="40" cy="28" r="5.5" fill="#111827"/><path d="M29 40l3-5 3 5z" fill="#475569"/><path d="M8 50l48 10M8 60l48-10" stroke="#9CA3AF" stroke-width="3" stroke-linecap="round"/>',
    clover: '<defs>' + rg('IDc', '#86EFAC', '#22C55E', '#15803D') + '</defs>' + sh(18) +
      '<path d="M32 36v20" stroke="#166534" stroke-width="4" stroke-linecap="round"/>' +
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(function (q) { return '<path d="M32 32q' + (q[0] * 16) + ' ' + (q[1] * 3) + ' ' + (q[0] * 12) + ' ' + (q[1] * 16) + 'q' + (-q[0] * 3) + ' ' + (q[1] * 3) + ' ' + (-q[0] * 12) + ' ' + (-q[1] * 12) + 'z" fill="url(#IDc)" stroke="#14532D" stroke-width="1.4"/>'; }).join(''),
    candypop: '<defs>' + rg('IDl', '#FFFFFF', '#F9A8D4', '#BE185D') + '</defs>' + sh(16) +
      '<rect x="30" y="34" width="4" height="26" rx="2" fill="#F9FAFB"/><circle cx="32" cy="24" r="18" fill="url(#IDl)"/>' +
      (function () { var d = 'M32 24'; for (var i = 0; i <= 24; i++) { var a = i * 0.6, r = i * 0.6; d += 'L' + (32 + Math.cos(a) * r).toFixed(1) + ' ' + (24 + Math.sin(a) * r).toFixed(1); } return '<path d="' + d + '" fill="none" stroke="#fff" stroke-width="2.4" opacity=".85"/>'; })(),
    olympus: '<defs>' + lg('IDb', '#FEF9C3', '#FACC15') + '</defs>' + sh(16) +
      '<path d="M38 4L14 36h16l-6 24 28-34H38z" fill="url(#IDb)" stroke="#92400E" stroke-width="2" stroke-linejoin="round"/>' + hi(28, 18, 8),
    vegasneon: '<defs>' + lg('IDv', '#E879F9', '#A21CAF') + '</defs>' +
      '<rect x="8" y="16" width="48" height="32" rx="8" fill="#1A0A2E" stroke="url(#IDv)" stroke-width="2.5"/>' +
      '<text x="32" y="42" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="22" fill="#FDE047" stroke="#B45309" stroke-width="1">777</text>' +
      '<circle cx="14" cy="54" r="3" fill="#F472B6"/><circle cx="32" cy="56" r="3" fill="#67E8F9"/><circle cx="50" cy="54" r="3" fill="#FDE047"/>'
  });
  var L = [
    ['westgold', 'Gold Rush', 'casc1', ['#FED7AA', '#C2410C']], ['piratecove', 'Pirate Cove', 'casc1', ['#99F6E4', '#0D9488']], ['clover', 'Lucky Clover', 'casc1', ['#BBF7D0', '#16A34A']],
    ['candypop', 'Candy Pop', 'casc1', ['#FBCFE8', '#DB2777']], ['olympus', 'Zeus Fury', 'casc1', ['#BFDBFE', '#2563EB']], ['vegasneon', 'Vegas Nights', 'casc1', ['#E9D5FF', '#A855F7']],
    ['samurai', 'Samurai', 'casc1', ['#FFE4E6', '#BE123C']], ['mermaid', 'Mermaid Lagoon', 'casc1', ['#CCFBF1', '#0D9488']], ['carnival', 'Carnival', 'casc1', ['#FAE8FF', '#A21CAF']],
    ['jazzclub', 'Jazz Club', 'casc1', ['#FEF3C7', '#92400E']], ['oasis', 'Desert Oasis', 'casc1', ['#FFEDD5', '#C2410C']], ['arctic', 'Arctic', 'casc1', ['#E0F2FE', '#0284C7']],
    ['steampunk', 'Steampunk', 'casc1', ['#FEF3C7', '#78350F']], ['cybercity', 'Cyber City', 'casc1', ['#F3E8FF', '#7E22CE']], ['fairy', 'Fairy Forest', 'casc1', ['#ECFCCB', '#4D7C0F']],
    ['dinopark', 'Dino Park', 'casc1', ['#ECFCCB', '#3F6212']], ['sushibar', 'Sushi Bar', 'casc1', ['#FFE4E6', '#B91C1C']], ['disco', 'Disco Night', 'casc1', ['#FCE7F3', '#BE185D']],
    ['potion', 'Potion Lab', 'casc2', ['#F3E8FF', '#7E22CE']], ['defuse', 'Bomb Squad', 'casc2', ['#E2E8F0', '#334155']], ['stoneskip', 'Stone Skip', 'casc2', ['#EDE9FE', '#6D28D9']],
    ['tarot', 'Tarot', 'casc2', ['#E0E7FF', '#3730A3']], ['bottleflip', 'Bottle Flip', 'casc2', ['#E0F2FE', '#0369A1']], ['gemfusion', 'Gem Fusion', 'casc2', ['#FAE8FF', '#86198F']],
    ['cargodrop', 'Cargo Drop', 'casc3', ['#FFE4E6', '#BE123C']], ['mahjong', 'Mahjong Draw', 'casc3', ['#DCFCE7', '#15803D']], ['robobox', 'Robo Boxing', 'casc3', ['#DBEAFE', '#1D4ED8']],
    ['lantern', 'Lantern Festival', 'casc3', ['#FEF3C7', '#B45309']], ['meteor', 'Meteor Shower', 'casc3', ['#FFEDD5', '#C2410C']], ['curling', 'Curling', 'casc3', ['#E0F2FE', '#0284C7']]
  ];
  D6.CasinoCatalog.add(L.map(function (g) { return { k: g[0], name: g[1], sec: 'more', file: g[2], pal: g[3], icon: ICONS[g[0]] }; }));
})(window.D6 = window.D6 || {});
