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
    shamrock: '<defs>' + rg('IDc', '#86EFAC', '#22C55E', '#15803D') + '</defs>' + sh(18) +
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
  // case (round 9) : logos travaillés des 6 machines à sous de plus
  Object.assign(ICONS, {
    phoenix: '<defs>' + rg('IDf', '#FFF3C7', '#F97316', '#B91C1C') + '</defs>' + sh(16) +
      '<path d="M32 14c-3 4-4 8-3 12-6-6-16-6-21 0 5 2 9 7 14 9-8 1-14 7-15 15 7-3 13-3 19-1-3 3-5 7-5 11 4-2 8-6 11-11 3 5 7 9 11 11 0-4-2-8-5-11 6-2 12-2 19 1-1-8-7-14-15-15 5-2 9-7 14-9-5-6-15-6-21 0 1-4 0-8-3-12z" fill="url(#IDf)" stroke="#7F1D1D" stroke-width="1.3"/><circle cx="32" cy="20" r="2" fill="#1A0505"/>' + tw(52, 14, .7),
    buffalo: '<defs>' + rg('IDb', '#8B5A2B', '#5C3A1A', '#2E1C0C') + GOLD + '</defs>' + sh(22) +
      '<path d="M14 18C8 18 6 24 8 30c-4 1-5 6-2 10 3-1 4-5 4-5 2 7 9 11 22 11s20-4 22-11c0 0 1 4 4 5 3-4 2-9-2-10 2-6 0-12-6-12-4 0-6 3-8 5-2-3-5-5-8-5s-6 2-8 5c-2-2-4-5-8-5z" fill="url(#IDb)" stroke="#1C1206" stroke-width="1.6"/>' +
      '<path d="M14 18q-8-2-12 2 6 0 8 4M50 18q8-2 12 2-6 0-8 4" stroke="url(#IDg)" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="26" cy="30" r="2.6" fill="#FDE68A"/><circle cx="38" cy="30" r="2.6" fill="#FDE68A"/><path d="M28 40q4 3 8 0" stroke="#1C1206" stroke-width="1.6" fill="none"/>' + hi(22, 26, 6),
    joker: '<defs>' + lg('IDj', '#A855F7', '#6D28D9') + GOLD + '</defs>' + sh(20) +
      '<path d="M18 16q14-7 28 0-3 12-14 12T18 16z" fill="url(#IDj)" stroke="#2E1065" stroke-width="1.4"/><circle cx="15" cy="14" r="4.5" fill="url(#IDg)"/><circle cx="49" cy="14" r="4.5" fill="#F472B6"/><circle cx="32" cy="9" r="4.5" fill="#34D399"/>' +
      '<ellipse cx="32" cy="38" rx="15" ry="16" fill="#FFF7ED" stroke="#92400E" stroke-width="1.2"/><circle cx="27" cy="35" r="2.4" fill="#111"/><circle cx="37" cy="35" r="2.4" fill="#111"/><path d="M26 44q6 5 12 0" stroke="#B91C1C" stroke-width="2" fill="none" stroke-linecap="round"/>',
    bookgold: '<defs>' + GOLD + '</defs>' + sh(20) +
      '<path d="M10 18q22-9 44 0v32q-22-8-44 0z" fill="url(#IDg)" stroke="#5C3A0A" stroke-width="1.8"/><path d="M32 18v32" stroke="#5C3A0A" stroke-width="2.4"/><ellipse cx="32" cy="34" rx="7" ry="5" fill="#1C1206"/><circle cx="32" cy="34" r="2.4" fill="#FDE68A"/><path d="M18 26q6-3 10 0M36 26q6-3 10 0" stroke="#FFF7D6" stroke-width="1.4" fill="none" opacity=".7"/>' + tw(52, 12, .7),
    lotus: '<defs>' + rg('IDl', '#FBCFE8', '#F472B6', '#BE185D') + lg('IDw', '#5EEAD4', '#0D9488') + '</defs>' + sh(16) +
      '<ellipse cx="32" cy="50" rx="26" ry="7" fill="url(#IDw)"/>' + (function () { var s = ''; for (var i = 0; i < 7; i++) { var a = (i - 3) * 0.42; s += '<path d="M32 48q' + (Math.sin(a) * 22).toFixed(1) + ' -18 ' + (Math.sin(a) * 7).toFixed(1) + ' -26q' + (-Math.sin(a) * 7).toFixed(1) + ' 8 ' + (-Math.sin(a) * 14).toFixed(1) + ' 26z" fill="url(#IDl)" stroke="#9D174D" stroke-width=".6"/>'; } return s; })() + '<circle cx="32" cy="42" r="4" fill="#FDE68A"/>',
    inferno: '<defs>' + rg('IDd', '#F87171', '#B91C1C', '#450A0A') + lg('IDh', '#FCA5A5', '#B91C1C') + '</defs>' + sh(20) +
      '<path d="M16 14q-5-9-2-14 5 5 7 12M48 14q5-9 2-14-5 5-7 12z" fill="url(#IDh)" stroke="#7F1D1D"/><path d="M14 20c-3 13 2 32 18 32s21-19 18-32c-5 6-9 6-13 2-3 7-13 7-16 0-4 4-7 4-13-2z" fill="url(#IDd)" stroke="#450A0A" stroke-width="1.6"/>' +
      '<path d="M24 32l5 4-5 2zM44 32l-5 4 5 2z" fill="#1A0505"/><path d="M26 44q6 5 12 0l-3 5h-6z" fill="#1A0505"/><path d="M29 46l1 3M32 46v3M35 46l-1 3" stroke="#fff" stroke-width="1"/>'
  });
  Object.assign(ICONS, {
    aztecsun: '<defs>' + rg('IDas', '#FFF4C2', '#D97706', '#5C2E0E') + GOLD + '</defs>' + sh(22) +
      '<circle cx="32" cy="30" r="22" fill="url(#IDas)" stroke="#5C2E0E" stroke-width="1.6"/>' + (function () { var s = ''; for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4; s += '<path d="M' + (32 + Math.cos(a) * 22).toFixed(1) + ' ' + (30 + Math.sin(a) * 22).toFixed(1) + 'l' + (Math.cos(a) * 6).toFixed(1) + ' ' + (Math.sin(a) * 6).toFixed(1) + '" stroke="url(#IDg)" stroke-width="4" stroke-linecap="round"/>'; } return s; })() + '<circle cx="32" cy="30" r="11" fill="url(#IDg)" stroke="#5C2E0E" stroke-width="1.2"/><rect x="27" y="25" width="3.5" height="4.5" fill="#2A1206"/><rect x="33.5" y="25" width="3.5" height="4.5" fill="#2A1206"/><path d="M29 35h6l-3 4z" fill="#2A1206"/>',
    dragongold: '<defs>' + rg('IDdg', '#FDE68A', '#D97706', '#7C2D12') + GOLD + '</defs>' + sh(20) +
      '<path d="M43 22c7-5 14-5 20-1-5-1-10 0-14 4zM47 27c7-4 14-3 19 1-5-1-10 0-14 3z" fill="url(#IDg)" stroke="#5C1A0A" stroke-width=".8" stroke-linejoin="round"/>' +
      '<path d="M46 26c-4-4-10-5-16-3-7 2-12 8-12 16 0 3 1 6 3 8-5 1-9 0-12-3 1 6 6 9 11 9-3 3-7 4-11 3 3 5 9 6 14 4 3 6 11 7 17 3-5 0-9-3-10-7 7-1 13-7 13-16 0-7-4-13-10-16 4-1 8 0 11 3-1-5-4-8-8-9 3-1 6-1 9 1-2-4-6-6-9-6z" fill="url(#IDdg)" stroke="#5C1A0A" stroke-width="1.4"/>' +
      '<circle cx="30" cy="30" r="3.4" fill="#FEF08A"/><circle cx="30" cy="30" r="1.6" fill="#1A0505"/><circle cx="21" cy="34" r="1.3" fill="#5C1A0A"/><path d="M16 39l4 1M22 41l3 2" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/><path d="M15 31q-7-1-9-6" stroke="#B91C1C" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
    fruitburst: '<defs>' + rg('IDfb', '#FF8FA3', '#E11D48', '#881337') + '</defs>' + sh(18) +
      '<path d="M28 18q3-9 11-11M40 20q3-9 11-11" stroke="#15803D" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="24" cy="40" r="12" fill="url(#IDfb)" stroke="#881337" stroke-width="1.2"/><circle cx="44" cy="43" r="12" fill="url(#IDfb)" stroke="#881337" stroke-width="1.2"/>' + hi(20, 35, 5) + hi(40, 38, 5),
    horuseye: '<defs>' + lg('IDph', '#FDE68A', '#D97706') + lg('IDpb', '#60A5FA', '#1D4ED8') + '</defs>' + sh(20) +
      '<path d="M14 24q0-14 18-14t18 14l-3 22q-2 14-15 20-13-6-15-20z" fill="url(#IDph)" stroke="#5C2E0E" stroke-width="1.4"/><path d="M14 24q18-9 36 0l-2 8q-16-7-32 0z" fill="url(#IDpb)"/><rect x="24" y="30" width="5.5" height="5" rx="1" fill="#0C1428"/><rect x="34.5" y="30" width="5.5" height="5" rx="1" fill="#0C1428"/><path d="M27 42h10l-5 5z" fill="#B45309"/><rect x="29" y="50" width="6" height="9" fill="url(#IDpb)"/>',
    cosmicgems: '<defs>' + lg('IDcg', '#E9D5FF', '#A855F7') + '</defs>' + sh(18) +
      '<path d="M32 10l16 14-16 28-16-28z" fill="url(#IDcg)" stroke="#6D28D9" stroke-width="1.4" stroke-linejoin="round"/><path d="M16 24h32M32 10v42M24 24l8 28M40 24l-8 28" stroke="#F5F3FF" stroke-width="1" opacity=".7" fill="none"/>' + tw(50, 14, .7),
    savanna: '<defs>' + lg('IDsf', '#FCD34D', '#B45309') + '</defs>' + sh(22) +
      (function () { var s = ''; for (var i = 0; i < 11; i++) { var a = i * Math.PI / 5.5; s += '<circle cx="' + (32 + Math.cos(a) * 18).toFixed(1) + '" cy="' + (30 + Math.sin(a) * 18).toFixed(1) + '" r="7" fill="#92400E"/>'; } return s; })() +
      '<circle cx="20" cy="19" r="5" fill="#B45309"/><circle cx="44" cy="19" r="5" fill="#B45309"/><circle cx="20" cy="19" r="2.2" fill="#78350F"/><circle cx="44" cy="19" r="2.2" fill="#78350F"/>' +
      '<circle cx="32" cy="30" r="15" fill="url(#IDsf)" stroke="#78350F" stroke-width="1.4"/>' +
      '<circle cx="26" cy="27" r="2.2" fill="#1A1206"/><circle cx="38" cy="27" r="2.2" fill="#1A1206"/>' +
      '<ellipse cx="32" cy="38" rx="9" ry="7" fill="#FEF3C7"/><path d="M32 33l-3.5 4.5h7z" fill="#7C2D12"/><path d="M32 38v4M32 42q-3.5 2-6 0M32 42q3.5 2 6 0" stroke="#7C2D12" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
      '<path d="M23 37l-9-1M23 40l-8 2M41 37l9-1M41 40l8 2" stroke="#78350F" stroke-width="1" opacity=".55"/>'
  });
  Object.assign(ICONS, {
    valhalla: '<defs>' + lg('IDvh', '#E5E7EB', '#6B7280') + GOLD + '</defs>' + sh(20) +
      '<path d="M12 10l-5 11 5-2-3 10 11-13-5 1 3-8z" fill="url(#IDg)"/><rect x="18" y="16" width="30" height="20" rx="4" fill="url(#IDvh)" stroke="#374151" stroke-width="1.6"/><rect x="29" y="34" width="6" height="24" rx="2.5" fill="#A16207" stroke="#5C3A0A"/><path d="M22 22h22M22 30h22" stroke="#9CA3AF" stroke-width="1.2" opacity=".7"/>' + hi(26, 22, 6),
    tigergold: '<defs>' + lg('IDtg', '#FB923C', '#C2410C') + '</defs>' + sh(20) +
      '<path d="M18 16l2 13-10-4z" fill="#C2410C" stroke="#7C2D12"/><path d="M46 16l-2 13 10-4z" fill="#C2410C" stroke="#7C2D12"/><circle cx="16" cy="19" r="2.6" fill="#1A0E06"/><circle cx="48" cy="19" r="2.6" fill="#1A0E06"/>' +
      '<path d="M32 13c-13 0-20 10-20 22 0 11 9 18 20 18s20-7 20-18c0-12-7-22-20-22z" fill="url(#IDtg)" stroke="#7C2D12" stroke-width="1.4"/>' +
      '<path d="M15 27l7 3M49 27l-7 3M13 37l8 1M51 37l-8 1M17 45l7-2M47 45l-7-2M32 14v7" stroke="#1A0E06" stroke-width="2.6" stroke-linecap="round"/>' +
      '<ellipse cx="32" cy="39" rx="13" ry="10" fill="#FEF3C7"/><circle cx="26" cy="32" r="2.4" fill="#1A0E06"/><circle cx="38" cy="32" r="2.4" fill="#1A0E06"/><path d="M32 37l-3 4h6z" fill="#7C2D12"/><path d="M32 41v4M32 45q-4 2-7 0M32 45q4 2 7 0" stroke="#7C2D12" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
    honeypot: '<defs>' + lg('IDhp', '#FBBF24', '#B45309') + '</defs>' + sh(18) +
      '<ellipse cx="22" cy="24" rx="9" ry="6" fill="#E0F2FE" opacity=".75" stroke="#7DD3FC" transform="rotate(-25 22 24)"/><ellipse cx="42" cy="24" rx="9" ry="6" fill="#E0F2FE" opacity=".75" stroke="#7DD3FC" transform="rotate(25 42 24)"/><ellipse cx="32" cy="37" rx="15" ry="13" fill="url(#IDhp)" stroke="#78350F" stroke-width="1.4"/><path d="M23 31h18M21 38h22M24 45h16" stroke="#1A1206" stroke-width="3.2" stroke-linecap="round"/><circle cx="28" cy="28" r="2" fill="#1A1206"/><circle cx="36" cy="28" r="2" fill="#1A1206"/><path d="M27 23l-3-6M37 23l3-6" stroke="#1A1206" stroke-width="1.6" stroke-linecap="round"/><circle cx="24" cy="16" r="1.8" fill="#FBBF24" stroke="#1A1206"/><circle cx="40" cy="16" r="1.8" fill="#FBBF24" stroke="#1A1206"/>',
    piggybank: '<defs>' + lg('IDpb2', '#F9A8D4', '#DB2777') + '</defs>' + sh(22) +
      '<ellipse cx="32" cy="34" rx="20" ry="16" fill="url(#IDpb2)" stroke="#831843" stroke-width="1.6"/><ellipse cx="19" cy="36" rx="7" ry="6" fill="#F9A8D4" stroke="#831843" stroke-width="1.2"/><circle cx="17" cy="35" r="1.4" fill="#831843"/><circle cx="21" cy="35" r="1.4" fill="#831843"/><circle cx="38" cy="30" r="2.4" fill="#1A0714"/><path d="M26 20l-3-8 8 5M42 20l3-8-8 5" fill="#F9A8D4" stroke="#831843"/><rect x="28" y="22" width="10" height="3.4" rx="1.7" fill="#FACC15" stroke="#B45309" stroke-width=".6"/><path d="M50 32q5 1 5 7" stroke="#831843" stroke-width="2.2" fill="none" stroke-linecap="round"/><rect x="22" y="48" width="5" height="7" fill="#9D174D"/><rect x="38" y="48" width="5" height="7" fill="#9D174D"/>' + hi(26, 30, 6),
    atlantis: '<defs>' + GOLD + '</defs>' + sh(16) +
      '<rect x="30" y="20" width="4" height="38" rx="2" fill="url(#IDg)" stroke="#78350F" stroke-width=".8"/><path d="M16 24V12M32 20V8M48 24V12" stroke="url(#IDg)" stroke-width="4.5" stroke-linecap="round"/><path d="M14 24q18-10 36 0" fill="none" stroke="url(#IDg)" stroke-width="4.5"/><path d="M16 12l-3-5M48 12l3-5M32 8V3" stroke="url(#IDg)" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="54" r="4" fill="url(#IDg)" stroke="#78350F"/>' + hi(26, 18, 5),
    wizard: '<defs>' + lg('IDwz', '#A78BFA', '#5B21B6') + GOLD + '</defs>' + sh(20) +
      '<path d="M32 8l14 36H18z" fill="url(#IDwz)" stroke="#2E1065" stroke-width="1.6"/><path d="M16 44h32l-2 6H18z" fill="#4C1D95" stroke="#2E1065" stroke-width="1.2"/>' + star(32, 21, 4, 'url(#IDg)') + star(26, 33, 2.6, '#FDE68A') + star(39, 31, 3, '#FDE68A') + star(10, 16, 3, '#C4B5FD') + star(54, 18, 3, '#C4B5FD') + '<circle cx="46" cy="11" r="1.5" fill="#fff"/><circle cx="18" cy="27" r="1.3" fill="#fff"/>'
  });
  Object.assign(ICONS, {
    royalcrown: '<defs>' + GOLD + '</defs>' + sh(22) +
      '<path d="M10 42l-3-22 12 11 9-19 9 19 12-11-3 22z" fill="url(#IDg)" stroke="#78350F" stroke-width="1.6" stroke-linejoin="round"/><rect x="10" y="42" width="44" height="9" rx="2.5" fill="url(#IDg)" stroke="#78350F"/><circle cx="18" cy="22" r="3" fill="#E11D48"/><circle cx="32" cy="18" r="3.4" fill="#10B981"/><circle cx="46" cy="22" r="3" fill="#2563EB"/><circle cx="22" cy="47" r="1.8" fill="#E11D48"/><circle cx="32" cy="47" r="1.8" fill="#10B981"/><circle cx="42" cy="47" r="1.8" fill="#2563EB"/>' + hi(24, 30, 6),
    luckycat: '<defs>' + GOLD + '</defs>' + sh(20) +
      '<path d="M18 54V34c0-9 6-16 14-16s14 7 14 16v20z" fill="#fff" stroke="#9CA3AF" stroke-width="1.4"/><path d="M22 20l-3-9 9 5M42 20l3-9-9 5" fill="#fff" stroke="#9CA3AF"/><path d="M24 15l-1.5-4 4 2M40 15l1.5-4-4 2" fill="#FB7185"/><circle cx="27" cy="30" r="2.2" fill="#1A0505"/><circle cx="37" cy="30" r="2.2" fill="#1A0505"/><circle cx="32" cy="35" r="1.8" fill="#FB7185"/><path d="M20 33l-8-1M20 37l-8 2M44 33l8-1M44 37l8 2" stroke="#9CA3AF" stroke-width="1"/><rect x="26" y="44" width="12" height="9" rx="2" fill="url(#IDg)" stroke="#78350F"/><ellipse cx="48" cy="24" rx="5" ry="7" fill="#fff" stroke="#9CA3AF" transform="rotate(20 48 24)"/>',
    wolfmoon: '<defs>' + lg('IDwm', '#9CA3AF', '#374151') + '</defs>' + sh(20) +
      '<circle cx="46" cy="18" r="11" fill="#FDE68A" opacity=".85"/><circle cx="42" cy="15" r="3" fill="#E5D9A8" opacity=".6"/><path d="M14 26l-1-10 8 7c3-1 8-1 11 0l8-7-1 10c3 3 4 7 4 11 0 10-7 17-17 17s-17-7-17-17c0-4 1-8 4-11z" fill="url(#IDwm)" stroke="#111827" stroke-width="1.4"/><path d="M14 26l1-7 6 6M40 26l-1-7-6 6" fill="#4B5563"/><circle cx="24" cy="36" r="2.2" fill="#FCD34D"/><circle cx="34" cy="36" r="2.2" fill="#FCD34D"/><path d="M29 42l-3 4h6z" fill="#111827"/>',
    vampire: '<defs>' + lg('IDvm', '#F8FAFC', '#CBD5E1') + '</defs>' + sh(20) +
      '<path d="M16 50l-2-16q-2-4-2-9c0-10 8-16 20-16s20 6 20 16q0 5-2 9l-2 16-6-4-5 4-5-4-5 4z" fill="#1F2937" stroke="#000"/><ellipse cx="32" cy="30" rx="12" ry="13" fill="url(#IDvm)" stroke="#94A3B8"/><path d="M24 26q3-2 6 0M34 26q3-2 6 0" stroke="#0B1020" stroke-width="1.4" fill="none"/><circle cx="27" cy="29" r="1.6" fill="#B91C1C"/><circle cx="37" cy="29" r="1.6" fill="#B91C1C"/><path d="M28 36q4 3 8 0" stroke="#9F1239" stroke-width="1.4" fill="none"/><path d="M29 37l1.5 4 1.5-4M33 37l1.5 4 1.5-4" fill="#fff" stroke="#94A3B8" stroke-width=".4"/>',
    peacock: '<defs>' + lg('IDpc', '#2DD4BF', '#0F766E') + '</defs>' + sh(20) +
      (function () { var s = ''; for (var i = 0; i < 5; i++) { var a = (i - 2) * 0.5, ex = 32 + Math.sin(a) * 22, ey = 26 - Math.cos(a) * 20; s += '<path d="M32 42Q' + (32 + Math.sin(a) * 12).toFixed(1) + ' ' + (34 - Math.cos(a) * 12).toFixed(1) + ' ' + ex.toFixed(1) + ' ' + ey.toFixed(1) + '" stroke="#14B8A6" stroke-width="1.6" fill="none"/><circle cx="' + ex.toFixed(1) + '" cy="' + ey.toFixed(1) + '" r="4.5" fill="#0D9488"/><circle cx="' + ex.toFixed(1) + '" cy="' + ey.toFixed(1) + '" r="2" fill="#4F46E5"/>'; } return s; })() +
      '<ellipse cx="32" cy="44" rx="7" ry="11" fill="url(#IDpc)" stroke="#063B38"/><circle cx="32" cy="34" r="5" fill="#34D399"/><circle cx="30" cy="33" r="1.4" fill="#fff"/><path d="M32 31v-4M30 27h4" stroke="#0D9488" stroke-width="1.6"/><path d="M32 37l-4 1.5 4 1.5z" fill="#F59E0B"/>',
    knight: '<defs>' + lg('IDkn', '#E2E8F0', '#64748B') + GOLD + '</defs>' + sh(20) +
      '<path d="M20 26c0-9 5-14 12-14s12 5 12 14v22a6 6 0 0 1-6 6H26a6 6 0 0 1-6-6z" fill="url(#IDkn)" stroke="#334155" stroke-width="1.6"/><rect x="30" y="22" width="4" height="32" fill="#1E293B"/><path d="M23 30l7-2v3l-7 2zM41 30l-7-2v3l7 2z" fill="#1E293B"/><path d="M32 8q5 2 5 8H27q0-6 5-8z" fill="url(#IDg)" stroke="#78350F"/>' + hi(26, 28, 6)
  });
  Object.assign(ICONS, {
    tikigods: '<defs>' + lg('IDtk', '#A16207', '#44220A') + '</defs>' + sh(18) +
      '<path d="M20 12h24v38a8 8 0 0 1-8 8h-8a8 8 0 0 1-8-8z" fill="url(#IDtk)" stroke="#2E1606" stroke-width="1.6"/><path d="M18 16h28l-3 6H21z" fill="#C2773B"/><path d="M22 26q6-5 10 0M32 26q6-5 10 0" fill="#1A0E04"/><circle cx="27" cy="26" r="3" fill="#FDE68A"/><circle cx="37" cy="26" r="3" fill="#FDE68A"/><circle cx="27" cy="26" r="1.3" fill="#1A0E04"/><circle cx="37" cy="26" r="1.3" fill="#1A0E04"/><path d="M28 34q4 3 8 0" stroke="#2E1606" stroke-width="1.6" fill="none"/><path d="M24 40h16l-3 8H27z" fill="#1A0E04"/><path d="M28 40v8M32 40v8M36 40v8" stroke="#FDE68A" stroke-width="1.2"/>',
    icequeen: '<defs>' + lg('IDiq', '#E0F2FE', '#38BDF8') + '</defs>' + sh(16) +
      (function () { var s = ''; for (var i = 0; i < 6; i++) { var a = i * Math.PI / 3, x2 = 32 + Math.cos(a) * 24, y2 = 32 + Math.sin(a) * 24, bx = 32 + Math.cos(a) * 14, by = 32 + Math.sin(a) * 14; s += '<path d="M32 32L' + x2.toFixed(1) + ' ' + y2.toFixed(1) + '" stroke="url(#IDiq)" stroke-width="3" stroke-linecap="round"/><path d="M' + bx.toFixed(1) + ' ' + by.toFixed(1) + 'l' + (Math.cos(a + 1) * 7).toFixed(1) + ' ' + (Math.sin(a + 1) * 7).toFixed(1) + 'M' + bx.toFixed(1) + ' ' + by.toFixed(1) + 'l' + (Math.cos(a - 1) * 7).toFixed(1) + ' ' + (Math.sin(a - 1) * 7).toFixed(1) + '" stroke="url(#IDiq)" stroke-width="2.2" stroke-linecap="round"/>'; } return s; })() + '<circle cx="32" cy="32" r="4.5" fill="#F0F9FF" stroke="#38BDF8"/>',
    caishen: '<defs>' + GOLD + '</defs>' + sh(22) +
      '<circle cx="32" cy="32" r="24" fill="url(#IDg)" stroke="#78350F" stroke-width="2"/><circle cx="32" cy="32" r="18" fill="#B91C1C" stroke="#78350F" stroke-width="1.4"/><text x="32" y="40" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="20" fill="#FDE68A">福</text>' + hi(24, 24, 7),
    luchador: '<defs>' + lg('IDlu', '#EF4444', '#B91C1C') + GOLD + '</defs>' + sh(20) +
      '<path d="M14 32c0-13 8-21 18-21s18 8 18 21c0 9-4 15-9 20H23c-5-5-9-11-9-20z" fill="url(#IDlu)" stroke="#450A0A" stroke-width="1.6"/><path d="M32 11v41M15 30h34" stroke="url(#IDg)" stroke-width="1.6" opacity=".5"/><path d="M19 28q7-5 13 0 6-5 13 0l-3 6q-5-3-10 0-5-3-10 0z" fill="url(#IDg)" stroke="#78350F"/><ellipse cx="26" cy="30" rx="3.4" ry="4.2" fill="#1A0810"/><ellipse cx="38" cy="30" rx="3.4" ry="4.2" fill="#1A0810"/><path d="M26 44h12l-3 6h-6z" fill="#1A0810"/><path d="M29 44v6M35 44v6" stroke="#fff" stroke-width="1"/>',
    fiesta: '<defs>' + lg('IDfs', '#FCD34D', '#B45309') + '</defs>' + sh(24) +
      '<ellipse cx="32" cy="42" rx="28" ry="11" fill="url(#IDfs)" stroke="#5C2E0E" stroke-width="1.6"/><path d="M20 42c0-14 5-24 12-24s12 10 12 24z" fill="url(#IDfs)" stroke="#5C2E0E" stroke-width="1.4"/><ellipse cx="32" cy="20" rx="8" ry="4" fill="#B45309"/><path d="M8 42q24 8 48 0" fill="none" stroke="#E11D48" stroke-width="2.6"/><path d="M24 32q8-3 16 0" stroke="#15803D" stroke-width="2" fill="none"/>' + hi(26, 26, 6),
    genie: '<defs>' + GOLD + '</defs>' + sh(20) +
      '<path d="M8 44q0-9 18-11 2-6 8-6t8 6q16 2 16 11-4 4-12 4H20q-8 0-12-4z" fill="url(#IDg)" stroke="#78350F" stroke-width="1.8"/><path d="M50 40q10-2 13-9-2 7-7 11" fill="none" stroke="url(#IDg)" stroke-width="3" stroke-linecap="round"/><ellipse cx="26" cy="39" rx="12" ry="4.5" fill="url(#IDg)"/><circle cx="32" cy="29" r="3" fill="url(#IDg)"/>' + hi(20, 40, 7) + '<path d="M48 18l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill="#C4B5FD"/>'
  });
  Object.assign(ICONS, {
    bandits: '<defs>' + GOLD + '</defs>' + sh(22) +
      '<path d="' + (function () { var d = ''; for (var i = 0; i < 12; i++) { var a = -Math.PI / 2 + i * Math.PI / 6, r = i % 2 ? 12 : 24; d += (i ? 'L' : 'M') + (32 + Math.cos(a) * r).toFixed(1) + ' ' + (32 + Math.sin(a) * r).toFixed(1); } return d; })() + 'z" fill="url(#IDg)" stroke="#78350F" stroke-width="1.6" stroke-linejoin="round"/><circle cx="32" cy="32" r="9" fill="none" stroke="#78350F" stroke-width="1.4"/>' + (function () { var s = ''; for (var i = 0; i < 6; i++) { var a = -Math.PI / 2 + i * Math.PI / 3; s += '<circle cx="' + (32 + Math.cos(a) * 18).toFixed(1) + '" cy="' + (32 + Math.sin(a) * 18).toFixed(1) + '" r="1.6" fill="#78350F"/>'; } return s; })() + hi(26, 26, 6),
    farm: '<defs>' + lg('IDbn', '#EF4444', '#B91C1C') + '</defs>' + sh(22) +
      '<path d="M12 32l20-18 20 18v24H12z" fill="url(#IDbn)" stroke="#450A0A" stroke-width="1.6"/><path d="M12 32l20-18 20 18" fill="none" stroke="#450A0A" stroke-width="1.6"/><rect x="26" y="38" width="12" height="18" fill="#FDE68A" stroke="#78350F"/><path d="M32 38v18M26 47h12" stroke="#78350F" stroke-width="1.4"/><path d="M16 36h8v8h-8z" fill="#FDE68A" stroke="#78350F"/>',
    gladiator: '<defs>' + lg('IDgl', '#E5E7EB', '#64748B') + '</defs>' + sh(20) +
      '<path d="M32 10c6 0 8 4 8 9l-2 14h-12l-2-14c0-5 2-9 8-9z" fill="#EF4444" stroke="#991B1B"/><path d="M20 54V34c0-11 5-18 12-18s12 7 12 18v20h-6V38h-3v14h-6V38h-3v16z" fill="url(#IDgl)" stroke="#334155" stroke-width="1.6"/><path d="M22 32h20" stroke="#334155" stroke-width="1.6"/><rect x="28" y="34" width="8" height="3" fill="#1F2937"/>' + hi(24, 26, 6),
    santa: '<defs>' + lg('IDst', '#EF4444', '#B91C1C') + '</defs>' + sh(20) +
      '<circle cx="32" cy="32" r="16" fill="#FFE4C7" stroke="#D1A878"/><path d="M14 30c0-10 8-18 18-18s18 8 18 14l-1 3c-5-3-10-1-10-1-1-4-9-4-10 0 0 0-5-2-10 1z" fill="url(#IDst)" stroke="#7F1D1D"/><path d="M48 14q6-2 7 3-4 0-6 3z" fill="#EF4444"/><circle cx="56" cy="16" r="3" fill="#fff"/><path d="M16 30h32v3H16z" fill="#fff"/><path d="M22 38c0 8 5 14 10 14s10-6 10-14c-4 3-7 3-10 1-3 2-6 2-10-1z" fill="#F8FAFC"/><circle cx="27" cy="33" r="1.8" fill="#1F2937"/><circle cx="37" cy="33" r="1.8" fill="#1F2937"/><circle cx="32" cy="38" r="2.4" fill="#FB7185"/>',
    alien: '<defs>' + lg('IDal', '#86EFAC', '#15803D') + '</defs>' + sh(20) +
      '<path d="M32 12c-11 0-16 8-16 19 0 10 7 17 16 17s16-7 16-17c0-11-5-19-16-19z" fill="url(#IDal)" stroke="#14532D" stroke-width="1.4"/><ellipse cx="25" cy="30" rx="5" ry="8" fill="#0A0A0A" transform="rotate(20 25 30)"/><ellipse cx="39" cy="30" rx="5" ry="8" fill="#0A0A0A" transform="rotate(-20 39 30)"/><ellipse cx="26" cy="28" rx="1.4" ry="2.2" fill="#86EFAC"/><ellipse cx="38" cy="28" rx="1.4" ry="2.2" fill="#86EFAC"/><path d="M28 42q4 2 8 0" stroke="#14532D" stroke-width="1.4" fill="none"/>',
    goblin: '<defs>' + lg('IDgb', '#4ADE80', '#15803D') + '</defs>' + sh(20) +
      '<path d="M32 12c-10 0-16 7-16 17 0 9 7 18 16 18s16-9 16-18c0-10-6-17-16-17z" fill="url(#IDgb)" stroke="#14532D" stroke-width="1.4"/><path d="M16 28q-9-4-12 2 6 1 7 6zM48 28q9-4 12 2-6 1-7 6z" fill="#4ADE80" stroke="#14532D"/><path d="M24 30l7 4-7 2zM40 30l-7 4 7 2z" fill="#FDE047"/><circle cx="27" cy="32" r="1.3" fill="#1A0505"/><circle cx="37" cy="32" r="1.3" fill="#1A0505"/><path d="M25 40q7 4 14 0l-2 4-3-2-4 2-3-2z" fill="#1A0505"/><path d="M30 24l2-4 2 4z" fill="#4ADE80"/>'
  });
  Object.assign(ICONS, {
    circus: '<defs>' + lg('IDci', '#EF4444', '#B91C1C') + GOLD + '</defs>' + sh(22) +
      '<path d="M12 28c0-9 9-16 20-16s20 7 20 16l-4 28H16z" fill="url(#IDci)" stroke="#7F1D1D" stroke-width="1.6"/><path d="M32 12v44M20 28l3 28M44 28l-3 28" fill="none" stroke="#FEF2F2" stroke-width="3"/><path d="M32 12l-6-6h12z" fill="url(#IDg)"/><path d="M24 56h16l-8-14z" fill="#FDE68A"/>',
    soccer: '<defs></defs>' + sh(20) +
      '<circle cx="32" cy="32" r="22" fill="#F8FAFC" stroke="#1F2937" stroke-width="1.6"/><path d="M32 22l9 6-3 11H26l-3-11z" fill="#1F2937"/><path d="M32 12l6 6M16 26l6 2M48 26l-6 2M24 50l3-8M40 50l-3-8" stroke="#1F2937" stroke-width="2"/>' + hi(26, 26, 6),
    butterfly: '<defs></defs>' + sh(18) +
      '<ellipse cx="24" cy="26" rx="12" ry="11" fill="#EC4899" stroke="#831843"/><ellipse cx="40" cy="26" rx="12" ry="11" fill="#EC4899" stroke="#831843"/><ellipse cx="26" cy="44" rx="9" ry="9" fill="#8B5CF6" stroke="#4C1D95"/><ellipse cx="38" cy="44" rx="9" ry="9" fill="#8B5CF6" stroke="#4C1D95"/><rect x="30" y="20" width="4" height="30" rx="2" fill="#1A0714"/><circle cx="24" cy="25" r="2.4" fill="#FEF9C3"/><circle cx="40" cy="25" r="2.4" fill="#FEF9C3"/><path d="M30 20q-4-7-9-7M34 20q4-7 9-7" stroke="#1A0714" stroke-width="1.4" fill="none"/>',
    pizza: '<defs>' + lg('IDpz', '#FBBF24', '#D97706') + '</defs>' + sh(20) +
      '<path d="M32 10l22 44H10z" fill="url(#IDpz)" stroke="#78350F" stroke-width="1.6"/><path d="M32 18l16 32H16z" fill="#FDE047"/><circle cx="27" cy="34" r="3.4" fill="#EF4444"/><circle cx="38" cy="38" r="3.4" fill="#EF4444"/><circle cx="31" cy="44" r="3.4" fill="#EF4444"/><circle cx="32" cy="26" r="2.2" fill="#15803D"/>',
    beach: '<defs></defs>' + sh(20) +
      '<path d="M30 30c2 10 0 22-3 28h10c-3-6-5-18-3-28z" fill="#A16207" stroke="#5C3A0A"/><path d="M32 28q-14-8-24-2 8 1 12 8M32 28q14-8 24-2-8 1-12 8M32 26q-6-13-18-13 6 5 9 15M32 26q6-13 18-13-6 5-9 15" fill="#22C55E" stroke="#14532D" stroke-width="1"/><circle cx="32" cy="28" r="3" fill="#B45309"/><path d="M8 58h48" stroke="#FDE68A" stroke-width="3"/>',
    owl: '<defs>' + lg('IDow', '#A16207', '#5C3A0A') + '</defs>' + sh(20) +
      '<path d="M32 12c-11 0-18 8-18 21 0 11 8 19 18 19s18-8 18-19c0-13-7-21-18-21z" fill="url(#IDow)" stroke="#2E1606" stroke-width="1.4"/><path d="M16 16l3-8 6 7M48 16l-3-8-6 7" fill="#A16207" stroke="#2E1606"/><circle cx="25" cy="28" r="8" fill="#FEF3C7" stroke="#78350F"/><circle cx="39" cy="28" r="8" fill="#FEF3C7" stroke="#78350F"/><circle cx="25" cy="28" r="3.6" fill="#1A0E04"/><circle cx="39" cy="28" r="3.6" fill="#1A0E04"/><path d="M32 32l-3 4h6z" fill="#FBBF24"/>'
  });
  Object.assign(ICONS, {
    ninja: '<defs>' + lg('IDnj', '#334155', '#0B0E18') + '</defs>' + sh(20) +
      '<path d="M14 30c0-11 8-18 18-18s18 7 18 18c0 5-2 8-2 8l2 14H14l2-14s-2-3-2-8z" fill="url(#IDnj)" stroke="#000" stroke-width="1.2"/><path d="M11 28h42l-2 7c-5 2-10-1-10-1-3 3-16 3-19 0 0 0-5 3-11 1z" fill="#DC2626" stroke="#7F1D1D"/><rect x="21" y="27" width="9" height="5" rx="2.5" fill="#CBD5E1"/><rect x="34" y="27" width="9" height="5" rx="2.5" fill="#CBD5E1"/><circle cx="25.5" cy="29.5" r="1.4" fill="#0B0E18"/><circle cx="38.5" cy="29.5" r="1.4" fill="#0B0E18"/>',
    unicorn: '<defs>' + GOLD + '</defs>' + sh(20) +
      '<path d="M32 6l5 16h-10z" fill="url(#IDg)" stroke="#78350F" stroke-width=".8"/><path d="M30 20l1-5 2 4 1-4 1 5" stroke="#D97706" stroke-width="1" fill="none"/>' +
      '<path d="M18 26l2-10 7 8zM46 26l-2-10-7 8z" fill="#F5F3FF" stroke="#A855F7"/><path d="M20 24l1-5 3 4zM44 24l-1-5-3 4z" fill="#F9A8D4"/>' +
      '<path d="M20 20q-8 2-9 12 5-2 8 0M44 20q8 2 9 12-5-2-8 0" fill="#C4B5FD" stroke="#8B5CF6" stroke-width=".8"/>' +
      '<path d="M20 28c0-6 5-10 12-10s12 4 12 10c0 10-6 20-12 20s-12-10-12-20z" fill="#F5F3FF" stroke="#A855F7" stroke-width="1.4"/>' +
      '<path d="M25 32q2-3 4 0M35 32q2-3 4 0" stroke="#4C1D95" stroke-width="2" fill="none" stroke-linecap="round"/><ellipse cx="32" cy="42" rx="5" ry="3.5" fill="#FBCFE8"/><circle cx="30" cy="42" r="1" fill="#9D174D"/><circle cx="34" cy="42" r="1" fill="#9D174D"/>',
    turbo: '<defs>' + lg('IDtb', '#EF4444', '#B91C1C') + '</defs>' + sh(22) +
      '<path d="M8 38c0-4 3-7 7-7l4-8c1-3 4-4 7-4h12c4 0 7 3 8 5l3 7c4 0 7 3 7 7v4H8z" fill="url(#IDtb)" stroke="#450A0A" stroke-width="1.4"/><path d="M26 23h12l2 7H24z" fill="#7DD3FC" stroke="#1E3A8A"/><circle cx="20" cy="44" r="6" fill="#1F2937" stroke="#000"/><circle cx="44" cy="44" r="6" fill="#1F2937" stroke="#000"/><circle cx="20" cy="44" r="2.4" fill="#9CA3AF"/><circle cx="44" cy="44" r="2.4" fill="#9CA3AF"/>',
    astro: '<defs>' + lg('IDas2', '#F8FAFC', '#94A3B8') + '</defs>' + sh(20) +
      '<circle cx="32" cy="30" r="20" fill="url(#IDas2)" stroke="#64748B" stroke-width="1.6"/><rect x="17" y="22" width="30" height="18" rx="9" fill="#0B1020" stroke="#334155" stroke-width="1.2"/><rect x="21" y="25" width="8" height="5" rx="2.5" fill="#60A5FA" opacity=".6"/><path d="M19 40q13 5 26 0" stroke="#CBD5E1" stroke-width="1.4" fill="none" opacity=".5"/>',
    puppy: '<defs>' + lg('IDpu', '#FDE68A', '#D97706') + '</defs>' + sh(22) +
      '<ellipse cx="32" cy="32" rx="18" ry="16" fill="url(#IDpu)" stroke="#5C2E0E" stroke-width="1.4"/><path d="M16 18q-8-1-11 6 2 9 11 9zM48 18q8-1 11 6-2 9-11 9z" fill="#A16207" stroke="#2E1606"/><ellipse cx="32" cy="42" rx="9" ry="7" fill="#FEF3C7"/><circle cx="32" cy="38" r="3" fill="#1A1206"/><circle cx="26" cy="30" r="2.6" fill="#1A1206"/><circle cx="38" cy="30" r="2.6" fill="#1A1206"/><circle cx="27" cy="29" r="1" fill="#fff"/><circle cx="39" cy="29" r="1" fill="#fff"/><path d="M32 41v4M28 46q4 2 8 0" stroke="#5C2E0E" stroke-width="1.4" fill="none"/>',
    sweets: '<defs>' + lg('IDsw', '#D97706', '#92400E') + '</defs>' + sh(16) +
      '<path d="M22 32h20L32 58z" fill="url(#IDsw)" stroke="#5C2E0E" stroke-width="1.2"/><path d="M24 36h16M27 44h10" stroke="#5C2E0E" stroke-width="1" opacity=".5"/><circle cx="25" cy="26" r="9" fill="#F472B6" stroke="#9D174D"/><circle cx="39" cy="26" r="9" fill="#FBBF24" stroke="#92400E"/><circle cx="32" cy="18" r="9" fill="#5EEAD4" stroke="#0D9488"/><circle cx="32" cy="11" r="2.6" fill="#EF4444"/>'
  });
  Object.assign(ICONS, {
    rocketcash: '<defs>' + lg('IDrk', '#F8FAFC', '#94A3B8') + GOLD + '</defs>' + sh(18) +
      '<path d="M32 8c7 6 10 18 10 30H22c0-12 3-24 10-30z" fill="url(#IDrk)" stroke="#475569" stroke-width="1.6"/><circle cx="32" cy="24" r="6" fill="#7DD3FC" stroke="#1E3A8A"/><path d="M22 38l-9 11 9-2M42 38l9 11-9-2z" fill="#DC2626"/><path d="M26 40q6 16 6 18 0-2 6-18z" fill="url(#IDg)"/>',
    golddig: '<defs>' + rg('IDgd', '#FEF3C7', '#FBBF24', '#92400E') + '</defs>' + sh(20) +
      '<path d="M16 46q-2-12 10-16 6-2 10 2 4-4 10 0 10 6 6 16-4 8-16 8H24q-6 0-8-10z" fill="url(#IDgd)" stroke="#78350F" stroke-width="1.6"/><path d="M24 36l4 4-4 3M40 34l-4 4 5 3" stroke="#B45309" stroke-width="1.4" fill="none" opacity=".6"/><circle cx="30" cy="30" r="2" fill="#FFF7D6"/>' + star(48, 18, 5, '#FDE047') + star(16, 22, 3, '#FDE047'),
    giftrush: '<defs>' + lg('IDgf', '#F87171', '#B91C1C') + GOLD + '</defs>' + sh(20) +
      '<rect x="14" y="28" width="36" height="28" rx="4" fill="url(#IDgf)" stroke="#7F1D1D" stroke-width="1.6"/><rect x="28" y="28" width="8" height="28" fill="url(#IDg)"/><rect x="12" y="22" width="40" height="10" rx="3" fill="url(#IDgf)" stroke="#7F1D1D"/><rect x="28" y="22" width="8" height="10" fill="url(#IDg)"/><path d="M32 22q-10-12-16-6t16 6q10-12 16-6t-16 6z" fill="url(#IDg)" stroke="#B45309"/>',
    cannonx: '<defs>' + lg('IDcn', '#475569', '#1F2937') + '</defs>' + sh(22) +
      '<circle cx="18" cy="46" r="7" fill="#374151" stroke="#0B1020"/><circle cx="46" cy="46" r="7" fill="#374151" stroke="#0B1020"/><g transform="translate(20 38) rotate(-38)"><rect x="-10" y="-10" width="40" height="20" rx="9" fill="url(#IDcn)" stroke="#0B1020" stroke-width="1.6"/><rect x="26" y="-8" width="8" height="16" rx="3" fill="#111827"/></g><circle cx="48" cy="16" r="5" fill="#111827" stroke="#0B1020"/><path d="M53 11l3-4M54 16h5M53 21l3 4" stroke="#FBBF24" stroke-width="1.6"/>',
    luckylift: '<defs>' + GOLD + '</defs>' + sh(20) +
      '<rect x="16" y="12" width="32" height="44" rx="4" fill="#141C34" stroke="#334155" stroke-width="1.6"/><rect x="22" y="22" width="20" height="28" rx="2" fill="url(#IDg)" stroke="#78350F"/><rect x="31" y="22" width="2" height="28" fill="#78350F"/><path d="M32 10l-7 8h5v2h4v-2h5z" fill="url(#IDg)" stroke="#78350F" stroke-width=".6"/>',
    magichat: '<defs>' + lg('IDmh', '#4C1D95', '#2E1065') + GOLD + '</defs>' + sh(22) +
      '<ellipse cx="30" cy="52" rx="24" ry="6" fill="#2E1065"/><path d="M18 52q12 4 24 0l-4-30q-8-4-16 0z" fill="url(#IDmh)" stroke="#1A0A3E" stroke-width="1.6"/><rect x="18" y="36" width="24" height="6" fill="#7C3AED"/><rect x="27" y="36" width="6" height="6" fill="url(#IDg)"/><rect x="47" y="20" width="2.6" height="16" rx="1" fill="#1C1206" transform="rotate(20 48 28)"/>' + star(52, 15, 6, 'url(#IDg)')
  });
  var L = [
    ['phoenix', 'Phoenix Rising', 'casc1', ['#FED7AA', '#DC2626']], ['buffalo', 'Buffalo Gold', 'casc1', ['#FDE68A', '#B45309']], ['joker', 'Jokers Wild', 'casc1', ['#E9D5FF', '#9333EA']],
    ['bookgold', 'Book of Gold', 'casc1', ['#FDE68A', '#A16207']], ['lotus', 'Lotus Zen', 'casc1', ['#99F6E4', '#0D9488']], ['inferno', 'Inferno', 'casc1', ['#FECACA', '#DC2626']],
    ['aztecsun', 'Aztec Sun', 'casc1', ['#FDE68A', '#B45309']], ['dragongold', 'Golden Dragon', 'casc1', ['#FDE68A', '#B91C1C']], ['fruitburst', 'Fruit Burst', 'casc1', ['#FECACA', '#E11D48']],
    ['horuseye', 'Eye of Pharaoh', 'casc1', ['#BAE6FD', '#2563EB']], ['cosmicgems', 'Cosmic Gems', 'casc1', ['#E9D5FF', '#7C3AED']], ['savanna', 'Wild Safari', 'casc1', ['#FDE68A', '#A16207']],
    ['valhalla', 'Valhalla Gold', 'casc1', ['#BAE6FD', '#1D4ED8']], ['tigergold', 'Tiger Fortune', 'casc1', ['#FDBA74', '#C2410C']], ['honeypot', 'Honey Money', 'casc1', ['#FDE68A', '#CA8A04']],
    ['piggybank', 'Piggy Bank', 'casc1', ['#FBCFE8', '#DB2777']], ['atlantis', 'Atlantis Deep', 'casc1', ['#99F6E4', '#0D9488']], ['wizard', 'Wizard Magic', 'casc1', ['#DDD6FE', '#7C3AED']],
    ['royalcrown', 'Royal Crown', 'casc1', ['#FDE68A', '#A16207']], ['luckycat', 'Lucky Cat', 'casc1', ['#FECACA', '#DC2626']], ['wolfmoon', 'Wolf Moon', 'casc1', ['#C7D2FE', '#4F46E5']],
    ['vampire', 'Vampire Night', 'casc1', ['#FBCFE8', '#9F1239']], ['peacock', 'Jade Peacock', 'casc1', ['#99F6E4', '#0D9488']], ['knight', 'Dragon Knight', 'casc1', ['#CBD5E1', '#475569']],
    ['tikigods', 'Tiki Gods', 'casc1', ['#FDBA74', '#C2410C']], ['icequeen', 'Frozen Queen', 'casc1', ['#BAE6FD', '#0EA5E9']], ['caishen', 'God of Wealth', 'casc1', ['#FECACA', '#B91C1C']],
    ['luchador', 'Lucha Legends', 'casc1', ['#FECACA', '#DC2626']], ['fiesta', 'Fiesta Mariachi', 'casc1', ['#FDBA74', '#EA580C']], ['genie', 'Magic Genie', 'casc1', ['#E9D5FF', '#9333EA']],
    ['bandits', 'Wild Bandits', 'casc1', ['#FDBA74', '#B45309']], ['farm', 'Farm Fortune', 'casc1', ['#BBF7D0', '#16A34A']], ['gladiator', 'Gladiator Arena', 'casc1', ['#FDE68A', '#A16207']],
    ['santa', 'Santa Riches', 'casc1', ['#FECACA', '#DC2626']], ['alien', 'Alien Invasion', 'casc1', ['#86EFAC', '#22C55E']], ['goblin', 'Goblin Gold', 'casc1', ['#BBF7D0', '#16A34A']],
    ['circus', 'Big Top Circus', 'casc1', ['#FECACA', '#DC2626']], ['soccer', 'Soccer Star', 'casc1', ['#BBF7D0', '#16A34A']], ['butterfly', 'Butterfly Garden', 'casc1', ['#FBCFE8', '#EC4899']],
    ['pizza', 'Pizza Party', 'casc1', ['#FDBA74', '#EA580C']], ['beach', 'Beach Party', 'casc1', ['#7DD3FC', '#0EA5E9']], ['owl', 'Night Owl', 'casc1', ['#C7D2FE', '#4F46E5']],
    ['ninja', 'Ninja Master', 'casc1', ['#CBD5E1', '#DC2626']], ['unicorn', 'Unicorn Magic', 'casc1', ['#FBCFE8', '#A855F7']], ['turbo', 'Turbo Racing', 'casc1', ['#FECACA', '#DC2626']],
    ['astro', 'Moon Explorer', 'casc1', ['#C7D2FE', '#6366F1']], ['puppy', 'Lucky Puppy', 'casc1', ['#FDE68A', '#D97706']], ['sweets', 'Sweet Treats', 'casc1', ['#FBCFE8', '#EC4899']],
    ['rocketcash', 'Rocket Cash', 'casc4', ['#C7D2FE', '#4F46E5']], ['golddig', 'Gold Digger', 'casc4', ['#FDE68A', '#A16207']], ['giftrush', 'Gift Rush', 'casc4', ['#FECACA', '#DC2626']],
    ['cannonx', 'Treasure Cannon', 'casc4', ['#CBD5E1', '#334155']], ['luckylift', 'Lucky Lift', 'casc4', ['#FDE68A', '#B45309']], ['magichat', 'Magic Hat', 'casc4', ['#DDD6FE', '#7C3AED']],
    ['chestgold', 'Treasure Chest', 'casc4', ['#FDE68A', '#B45309']], ['fortunewheel', 'Fortune Wheel', 'casc4', ['#FCA5A5', '#B91C1C']], ['goldenegg', 'Golden Egg', 'casc4', ['#FDE68A', '#A16207']],
    ['mysterybox', 'Mystery Box', 'casc4', ['#DDD6FE', '#6D28D9']], ['crystalorb', 'Crystal Orb', 'casc4', ['#A5F3FC', '#0E7490']], ['diamondvault', 'Diamond Vault', 'casc4', ['#CBD5E1', '#0891B2']],
    ['diceroll', 'Dice Roll', 'casc4', ['#FEF3C7', '#15803D']], ['royalcard', 'Royal Card', 'casc4', ['#FDE68A', '#4C1D95']], ['genielamp', 'Genie Lamp', 'casc4', ['#FDE68A', '#B45309']],
    ['jackpotbell', 'Jackpot Bell', 'casc4', ['#FDE68A', '#B45309']], ['oysterpearl', 'Oyster Pearl', 'casc4', ['#E0F2FE', '#0E7490']], ['crownjewel', 'Crown Jewel', 'casc4', ['#FDE68A', '#B91C1C']],
    ['westgold', 'Gold Rush', 'casc1', ['#FED7AA', '#C2410C']], ['piratecove', 'Pirate Cove', 'casc1', ['#99F6E4', '#0D9488']], ['shamrock', 'Clover Riches', 'casc1', ['#BBF7D0', '#16A34A']],
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
