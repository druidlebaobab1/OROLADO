/* casb — catalogue (owner request, round 6): table, card, dice and arcade-chance games + Comet Queen (crash) for the Casino list
   (server fiches: casino_ext/casb.php; modules js/games/casb1…7.js). Icons = the game's own object, same style as cat-more4.js. */
(function (D6) {
  if (!D6.CasinoCatalog) return;
  function rg(id, a, b, c) { return '<radialGradient id="' + id + '" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="' + a + '"/><stop offset=".55" stop-color="' + b + '"/><stop offset="1" stop-color="' + c + '"/></radialGradient>'; }
  function lg(id, a, b) { return '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient>'; }
  function hi(x, y, r) { return '<ellipse cx="' + (x - r * .34) + '" cy="' + (y - r * .4) + '" rx="' + (r * .34) + '" ry="' + (r * .22) + '" fill="#fff" opacity=".6" transform="rotate(-30 ' + (x - r * .34) + ' ' + (y - r * .4) + ')"/>'; }
  function sh(w) { return '<ellipse cx="32" cy="57.5" rx="' + (w || 24) + '" ry="4.3" fill="#000" opacity=".28"/>'; }
  function tw(x, y, s) { s = s || 1; return '<path d="M' + x + ' ' + (y - 5 * s) + 'l' + (1.3 * s) + ' ' + (3.7 * s) + ' ' + (3.7 * s) + ' ' + (1.3 * s) + '-' + (3.7 * s) + ' ' + (1.3 * s) + '-' + (1.3 * s) + ' ' + (3.7 * s) + '-' + (1.3 * s) + '-' + (3.7 * s) + '-' + (3.7 * s) + '-' + (1.3 * s) + ' ' + (3.7 * s) + '-' + (1.3 * s) + 'z" fill="#FDE68A"/>'; }
  var GOLD = lg('IDg', '#FEF3C7', '#D97706');
  var SUIT = ['M0-6C-3-2-7 0-6 3.4-5 6.4-1.6 6-0.8 4.2L-2 7.6H2L0.8 4.2C1.6 6 5 6.4 6 3.4 7 0 3-2 0-6z', 'M0 6.4C-8 0-7.6-6.4-3.4-6.4-1.4-6.4 0-4.6 0-3.6 0-4.6 1.4-6.4 3.4-6.4 7.6-6.4 8 0 0 6.4z',
    'M0-7L5.4 0 0 7-5.4 0z', 'M0-6.6A2.9 2.9 0 0 1 2.4-2.2 2.9 2.9 0 1 1 1 2.6L2 6.6H-2L-1 2.6A2.9 2.9 0 1 1-2.4-2.2 2.9 2.9 0 0 1 0-6.6z'];
  function su(s, x, y, k) { return '<path d="' + SUIT[s] + '" transform="translate(' + x + ' ' + y + ') scale(' + k + ')" fill="' + (s === 1 || s === 2 ? '#DC2626' : '#111827') + '"/>'; }
  // carte 22 × 30 tournée de a degrés autour de (x, y)
  function cd(x, y, a, rk, s, back) {
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + a + ')">' + (back ? '<rect x="-11" y="-15" width="22" height="30" rx="3" fill="#6D28D9" stroke="#EDE9FE" stroke-width="1.2"/><path d="M0-7l5 7-5 7-5-7z" fill="#C4B5FD"/>' :
      '<rect x="-11" y="-15" width="22" height="30" rx="3" fill="#FFFDF7" stroke="#94A3B8" stroke-width=".8"/><text x="-7.5" y="-6" font-size="8" font-weight="900" fill="' + (s === 1 || s === 2 ? '#DC2626' : '#111827') + '" font-family="Arial">' + rk + '</text>' + su(s, 2, 5, .95)) + '</g>';
  }
  function die(x, y, v, r, a, col) {
    var P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[v];
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + (a || 0) + ')"><rect x="' + -r + '" y="' + -r + '" width="' + 2 * r + '" height="' + 2 * r + '" rx="' + r * .3 + '" fill="' + (col || 'url(#IDd)') + '" stroke="#CBD5E1"/>' +
      P.map(function (p) { return '<circle cx="' + (p[0] * r * .52).toFixed(1) + '" cy="' + (p[1] * r * .52).toFixed(1) + '" r="' + (r * .18).toFixed(1) + '" fill="' + (v === 1 ? '#DC2626' : '#1F2937') + '"/>'; }).join('') + '</g>';
  }
  var DIE = lg('IDd', '#FFFFFF', '#E2E8F0');
  var ICONS = {
    blackjack: '<defs>' + GOLD + '</defs>' + sh(22) + cd(23, 34, -14, 'A', 0) + cd(40, 32, 12, 'K', 1) +
      '<circle cx="50" cy="50" r="9" fill="#111827" stroke="url(#IDg)" stroke-width="2.4"/><text x="50" y="53.5" text-anchor="middle" font-size="9" font-weight="900" fill="#FDE68A" font-family="Arial">21</text>' + tw(12, 12),
    tcpoker: sh(24) + cd(18, 36, -18, '7', 2) + cd(32, 32, 0, '7', 0) + cd(46, 36, 18, '7', 1) + '<path d="M22 10h20" stroke="#93C5FD" stroke-width="3" stroke-linecap="round"/>' + tw(54, 12, .8),
    holdem: '<defs>' + lg('IDf', '#B91C1C', '#450A0A') + '</defs>' + '<ellipse cx="32" cy="46" rx="29" ry="13" fill="url(#IDf)" stroke="#FDE68A" stroke-width="1.6"/>' + cd(14, 44, -4, 'A', 1).replace('scale', 'scale') + cd(32, 44, 0, 'K', 1) + cd(50, 44, 4, 'Q', 1) + cd(25, 18, -10, 'J', 1) + cd(41, 18, 10, '10', 1),
    niuniu: '<defs>' + lg('IDh', '#F59E0B', '#78350F') + '</defs>' + sh(22) + '<path d="M10 20Q2 4 18 6Q14 14 22 18M54 20Q62 4 46 6Q50 14 42 18" fill="#FEF3C7" stroke="#92400E" stroke-width="1.2"/><path d="M18 14Q32 6 46 14L44 42Q32 56 20 42z" fill="url(#IDh)" stroke="#78350F" stroke-width="1.2"/>' +
      '<ellipse cx="32" cy="42" rx="11" ry="7.5" fill="#FDBA74"/><circle cx="28" cy="42" r="1.8" fill="#78350F"/><circle cx="36" cy="42" r="1.8" fill="#78350F"/><circle cx="25" cy="26" r="2.6" fill="#111"/><circle cx="39" cy="26" r="2.6" fill="#111"/>' + cd(52, 50, 16, 'K', 1),
    acerace: '<defs>' + GOLD + '</defs>' + sh(26) + '<path d="M54 6v48" stroke="#fff" stroke-width="3" stroke-dasharray="4 3"/>' + cd(16, 16, -6, 'A', 0) + cd(30, 26, -6, 'A', 1) + cd(22, 38, -6, 'A', 2) + cd(40, 46, -6, 'A', 3) + '<path d="M2 26h8M6 38h6M18 48h8" stroke="#FDE68A" stroke-width="2" stroke-linecap="round" opacity=".7"/>',
    trente: '<defs>' + lg('IDn', '#334155', '#0F172A') + lg('IDr', '#F87171', '#991B1B') + '</defs>' + sh(24) + '<rect x="6" y="10" width="52" height="20" rx="6" fill="url(#IDn)"/><rect x="6" y="34" width="52" height="20" rx="6" fill="url(#IDr)"/>' +
      '<text x="32" y="25" text-anchor="middle" font-size="13" font-weight="900" fill="#E2E8F0" font-family="Arial">31</text><text x="32" y="49" text-anchor="middle" font-size="13" font-weight="900" fill="#FEF3C7" font-family="Arial">40</text>' + su(0, 13, 20, .8) + su(1, 13, 44, .8).replace('#DC2626', '#FEF3C7'),
    clocksol: '<defs>' + rg('IDc', '#FFFFFF', '#E0E7FF', '#818CF8') + GOLD + '</defs>' + sh(22) + '<circle cx="32" cy="31" r="25" fill="url(#IDc)" stroke="url(#IDg)" stroke-width="3"/>' +
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (j) { var a = j * Math.PI / 6, x = 32 + Math.sin(a) * 19, y = 31 - Math.cos(a) * 19; return '<rect x="' + (x - 2.6).toFixed(1) + '" y="' + (y - 3.5).toFixed(1) + '" width="5.2" height="7" rx="1" fill="' + (j % 3 ? '#fff' : '#6D28D9') + '" stroke="#64748B" stroke-width=".5"/>'; }).join('') +
      '<path d="M32 31V17M32 31l9 5" stroke="#1E1B4B" stroke-width="2.6" stroke-linecap="round"/>' + cd(32, 31, 0, 'K', 3).replace('translate(32 31)', 'translate(32 31) scale(.5)'),
    yatzy: '<defs>' + DIE + '</defs>' + sh(26) + die(14, 44, 6, 9, -10) + die(32, 46, 6, 9, 6) + die(50, 44, 6, 9, 14) + die(22, 24, 6, 9, 18) + die(42, 22, 6, 9, -12) + tw(54, 6, .8),
    crownanchor: '<defs>' + GOLD + DIE + '</defs>' + sh(22) + '<g transform="translate(22 34) rotate(-10)"><rect x="-14" y="-14" width="28" height="28" rx="6" fill="url(#IDd)" stroke="#CBD5E1"/><path d="M-9 5h18l2-12-6 5-5-8-5 8-6-5z" fill="url(#IDg)" stroke="#92400E" stroke-width=".8"/></g>' +
      '<g transform="translate(44 30) rotate(12)"><rect x="-13" y="-13" width="26" height="26" rx="6" fill="url(#IDd)" stroke="#CBD5E1"/><path d="M0-8v15M-6-4h12M-8 2q8 10 16 0" stroke="#1D4ED8" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cy="-9" r="2.2" fill="none" stroke="#1D4ED8" stroke-width="1.6"/></g>',
    derby: '<defs>' + DIE + lg('IDh', '#A16207', '#422006') + '</defs>' + sh(24) + '<path d="M4 50h56M4 40h56" stroke="#86EFAC" stroke-width="1.4" opacity=".7"/>' +
      '<g transform="translate(26 30)"><path d="M-16 6q2-12 14-12h10l6-8 4 3-3 7q4 3 2 9l-4 2-2-5-4 6h-4l1-6h-10l-3 9h-4l1-9q-5-1-4-2z" fill="url(#IDh)"/><circle cx="12" cy="-12" r="1" fill="#000"/><path d="M-4-6q0-6 6-6" stroke="#EF4444" stroke-width="3" fill="none"/></g>' + die(50, 46, 5, 8, 12),
    ceelo: '<defs>' + DIE + '</defs>' + sh(26) + '<ellipse cx="32" cy="48" rx="26" ry="9" fill="#1E293B"/>' + die(18, 40, 4, 9, -12) + die(34, 30, 5, 9, 8) + die(48, 44, 6, 9, 20) + '<path d="M8 14l4 3M56 12l-4 4M32 6v5" stroke="#FDE68A" stroke-width="2" stroke-linecap="round"/>',
    shipcrew: '<defs>' + DIE + lg('IDs', '#60A5FA', '#1E3A8A') + '</defs>' + '<path d="M2 50Q32 42 62 50V60H2z" fill="url(#IDs)"/><path d="M14 42h36l-6 9H20z" fill="#92400E"/><path d="M32 10v32" stroke="#78350F" stroke-width="2.4"/><path d="M33 12l16 14H33z" fill="#F8FAFC"/><path d="M31 14L18 30h13z" fill="#E2E8F0"/>' + die(14, 18, 6, 7, -12) + die(50, 40, 5, 6, 10),
    dblroul: '<defs>' + GOLD + rg('IDb', '#FFFFFF', '#E2E8F0', '#94A3B8') + '</defs>' + sh(24) + '<circle cx="32" cy="31" r="26" fill="url(#IDg)"/><circle cx="32" cy="31" r="21" fill="#111827"/>' +
      (function () { var s = ''; for (var j = 0; j < 18; j++) { var a0 = j * Math.PI / 9, a1 = (j + 1) * Math.PI / 9; s += '<path d="M32 31L' + (32 + Math.cos(a0) * 21).toFixed(1) + ' ' + (31 + Math.sin(a0) * 21).toFixed(1) + 'A21 21 0 0 1 ' + (32 + Math.cos(a1) * 21).toFixed(1) + ' ' + (31 + Math.sin(a1) * 21).toFixed(1) + 'z" fill="' + (j === 0 ? '#16A34A' : j % 2 ? '#DC2626' : '#111827') + '"/>'; } return s; })() +
      '<circle cx="32" cy="31" r="10" fill="url(#IDg)"/><circle cx="20" cy="17" r="3.6" fill="url(#IDb)"/><circle cx="46" cy="44" r="3.6" fill="url(#IDb)"/>',
    twinwheel: '<defs>' + GOLD + '</defs>' + sh(24) + '<circle cx="32" cy="31" r="26" fill="#4C1D95" stroke="url(#IDg)" stroke-width="2.5"/>' +
      (function () { var s = ''; for (var j = 0; j < 12; j++) { var a = j * Math.PI / 6; s += '<path d="M' + (32 + Math.cos(a) * 15).toFixed(1) + ' ' + (31 + Math.sin(a) * 15).toFixed(1) + 'L' + (32 + Math.cos(a) * 25).toFixed(1) + ' ' + (31 + Math.sin(a) * 25).toFixed(1) + '" stroke="#C4B5FD" stroke-width="1.2"/>'; } for (j = 0; j < 8; j++) { var b = j * Math.PI / 4 + .3; s += '<path d="M32 31L' + (32 + Math.cos(b) * 14).toFixed(1) + ' ' + (31 + Math.sin(b) * 14).toFixed(1) + '" stroke="#FDE68A" stroke-width="1"/>'; } return s; })() +
      '<circle cx="32" cy="31" r="14" fill="none" stroke="url(#IDg)" stroke-width="2.5"/><circle cx="32" cy="31" r="5" fill="url(#IDg)"/><path d="M32 2l-5 8h10z" fill="#F43F5E"/>',
    twoup: '<defs>' + rg('IDc', '#FEF3C7', '#F59E0B', '#92400E') + lg('IDk', '#D6A36A', '#78350F') + '</defs>' + sh(22) + '<rect x="6" y="44" width="52" height="7" rx="3.5" fill="url(#IDk)" transform="rotate(-8 32 47)"/>' +
      '<circle cx="22" cy="22" r="11" fill="url(#IDc)" stroke="#92400E"/><text x="22" y="26.5" text-anchor="middle" font-size="12" font-weight="900" fill="#78350F" font-family="Arial">H</text>' + hi(22, 22, 11) +
      '<ellipse cx="44" cy="30" rx="11" ry="5" fill="url(#IDc)" stroke="#92400E"/><path d="M14 10l3 3M50 8l-2 4" stroke="#FDE68A" stroke-width="2" stroke-linecap="round"/>',
    fantan: '<defs>' + lg('IDb', '#F8FAFC', '#CBD5E1') + lg('IDs', '#FBBF24', '#92400E') + '</defs>' + sh(26) + '<ellipse cx="30" cy="44" rx="24" ry="9" fill="#14532D"/>' +
      [[20, 42], [26, 40], [32, 43], [38, 41], [24, 46], [30, 47], [36, 46], [42, 44], [28, 37], [34, 38]].map(function (b) { return '<ellipse cx="' + b[0] + '" cy="' + b[1] + '" rx="3.2" ry="2.3" fill="url(#IDb)" stroke="#94A3B8" stroke-width=".5"/>'; }).join('') +
      '<path d="M44 40L60 8" stroke="url(#IDs)" stroke-width="3.4" stroke-linecap="round"/><text x="14" y="22" font-size="16" font-weight="900" fill="#FDE68A" font-family="Arial">4</text>',
    pachinko: '<defs>' + lg('IDp', '#F472B6', '#7E22CE') + rg('IDb', '#FFFFFF', '#E2E8F0', '#64748B') + GOLD + '</defs>' + sh(22) + '<rect x="10" y="4" width="44" height="54" rx="10" fill="url(#IDp)" stroke="url(#IDg)" stroke-width="2"/>' +
      [[20, 14], [32, 14], [44, 14], [26, 22], [38, 22], [20, 30], [44, 30]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.6" fill="#FDE68A"/>'; }).join('') +
      '<rect x="22" y="34" width="20" height="12" rx="3" fill="#0F172A"/><text x="32" y="44" text-anchor="middle" font-size="9" font-weight="900" fill="#FDE68A" font-family="Arial">777</text><circle cx="32" cy="26" r="4" fill="url(#IDb)"/>' + hi(32, 26, 4),
    amida: '<defs>' + GOLD + '</defs>' + sh(24) + '<g stroke="#E0E7FF" stroke-width="2.6" stroke-linecap="round"><path d="M12 6v42M24 6v42M36 6v42M48 6v42"/><path d="M12 14h12M36 18h12M24 26h12M12 32h12M36 38h12" stroke="#FDE68A"/></g>' +
      '<path d="M24 6V26H36V48" stroke="#F43F5E" stroke-width="3.2" fill="none" stroke-linejoin="round"/>' + [12, 24, 36, 48].map(function (x, j) { return '<circle cx="' + x + '" cy="53" r="5" fill="' + (j === 2 ? 'url(#IDg)' : '#475569') + '"/>'; }).join(''),
    skeeball: '<defs>' + rg('IDb', '#FFFFFF', '#FDE68A', '#B45309') + lg('IDr', '#1D4ED8', '#0B1437') + '</defs>' + sh(24) + '<path d="M8 58L18 8h28l10 50z" fill="url(#IDr)"/>' +
      [[32, 44, 9, '10'], [32, 30, 6.5, '30'], [32, 18, 4.5, '50'], [22, 12, 3, ''], [42, 12, 3, '']].map(function (h) { return '<circle cx="' + h[0] + '" cy="' + h[1] + '" r="' + h[2] + '" fill="#020617" stroke="#FDE68A" stroke-width="1.2"/>'; }).join('') +
      '<circle cx="46" cy="50" r="7" fill="url(#IDb)"/>' + hi(46, 50, 7),
    ducks: '<defs>' + lg('IDw', '#38BDF8', '#1E3A8A') + rg('IDy', '#FEF9C3', '#FACC15', '#A16207') + '</defs>' + '<path d="M2 44Q32 36 62 44V60H2z" fill="url(#IDw)"/>' +
      '<g transform="translate(30 30)"><path d="M-14 6q0 10 14 10t16-10q-2-6-10-6h-4q2-4 2-8a8 8 0 0 0-16 0q0 4 4 6q-6 2-6 8z" fill="url(#IDy)" stroke="#A16207" stroke-width="1"/><path d="M-16-6l-8 2 8 3z" fill="#F97316"/><circle cx="-10" cy="-10" r="1.6" fill="#111"/></g>' +
      '<path d="M54 2Q56 16 46 22" stroke="#E2E8F0" stroke-width="1.2" fill="none"/><path d="M46 22q-3 2-1 5" stroke="#CBD5E1" stroke-width="1.6" fill="none"/>' + tw(54, 34, .8),
    dreidel: '<defs>' + lg('IDd', '#93C5FD', '#1E40AF') + GOLD + '</defs>' + sh(16) + '<rect x="29" y="4" width="6" height="12" rx="2" fill="url(#IDg)"/><path d="M14 16h36v22L32 58 14 38z" fill="url(#IDd)" stroke="#BFDBFE" stroke-width="1.2"/>' +
      '<path d="M32 16v42" stroke="#1E3A8A" stroke-width="1" opacity=".5"/><path d="M20 24h8v10M20 34h8" stroke="#FDE68A" stroke-width="2.6" fill="none" stroke-linecap="round"/>' + tw(52, 10),
    oracle: '<defs>' + rg('IDo', '#4B5563', '#111827', '#000000') + lg('IDt', '#60A5FA', '#1E3A8A') + '</defs>' + sh(22) + '<circle cx="32" cy="31" r="25" fill="url(#IDo)"/>' + hi(32, 31, 25) +
      '<circle cx="32" cy="33" r="12" fill="#0B1437" stroke="#334155"/><path d="M24 28h16l-8 13z" fill="url(#IDt)"/><path d="M14 8l3 3M50 8l-3 3" stroke="#C4B5FD" stroke-width="2" stroke-linecap="round"/>' + tw(54, 52, .8),
    rpsduel: '<defs>' + lg('IDs', '#FDE1D3', '#F3CDAE') + lg('IDr', '#C4B5FD', '#5B21B6') + '</defs>' + sh(24) +
      '<g transform="translate(18 34) rotate(-12)"><rect x="-11" y="-10" width="22" height="20" rx="7" fill="url(#IDs)" stroke="#92400E" stroke-width="1"/><path d="M-6-10v6M0-10v6M6-10v6" stroke="#92400E" stroke-width="1"/></g>' +
      '<g transform="translate(46 30) rotate(14)"><rect x="-10" y="-6" width="20" height="18" rx="6" fill="url(#IDr)"/><path d="M-6-6l-4-14M0-6l2-15" stroke="url(#IDr)" stroke-width="5.4" stroke-linecap="round"/></g>' +
      '<path d="M32 8l3 6-3 6-3-6z" fill="#FDE68A"/>',
    cometqueen: '<defs>' + rg('IDc', '#FFFFFF', '#FDE68A', '#F59E0B') + lg('IDt', '#F472B6', '#A855F7') + lg('IDd', '#F9A8D4', '#BE185D') + '</defs>' +
      '<path d="M4 58Q18 40 40 28" stroke="url(#IDt)" stroke-width="9" stroke-linecap="round" opacity=".55"/><path d="M8 56Q20 42 40 30" stroke="#FDE68A" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>' +
      '<circle cx="44" cy="26" r="9" fill="url(#IDc)"/>' +
      '<g transform="translate(40 18)"><path d="M-6 2q6-3 12 0l3 12h-18z" fill="url(#IDd)"/><circle cy="-5" r="4.4" fill="#FCD9C0"/><path d="M-5-7q5-6 10 0l2 9q-3-4-4-6-3 1-6 0-1 3-4 6z" fill="#7C2D12"/><path d="M-3-11l1.5-3 1.5 2 1.5-2 1.5 3z" fill="#FDE68A"/></g>' + tw(14, 12) + tw(54, 52, .8)
  };
  var L = [
    ['blackjack', 'Blackjack', 'casb1', ['#DCFCE7', '#15803D']], ['tcpoker', 'Three Card Poker', 'casb1', ['#DBEAFE', '#1D4ED8']], ['holdem', 'Casino Hold’em', 'casb1', ['#FEE2E2', '#B91C1C']], ['niuniu', 'Niu Niu', 'casb1', ['#FEF3C7', '#B45309']],
    ['acerace', 'Ace Race', 'casb2', ['#E0E7FF', '#4338CA']], ['trente', '30 & 40', 'casb2', ['#FFE4E6', '#9F1239']], ['clocksol', 'Clock Patience', 'casb2', ['#EDE9FE', '#6D28D9']],
    ['yatzy', 'Yatzy', 'casb3', ['#F1F5F9', '#475569']], ['crownanchor', 'Crown & Anchor', 'casb3', ['#FEF3C7', '#1D4ED8']], ['derby', 'Dice Derby', 'casb3', ['#DCFCE7', '#166534']],
    ['ceelo', 'Cee-Lo', 'casb3', ['#E2E8F0', '#334155']], ['shipcrew', 'Ship & Crew', 'casb3', ['#E0F2FE', '#0369A1']],
    ['dblroul', 'Double Roulette', 'casb4', ['#DCFCE7', '#15803D']], ['twinwheel', 'Twin Wheel', 'casb4', ['#EDE9FE', '#6D28D9']], ['twoup', 'Two-Up', 'casb4', ['#FEF3C7', '#B45309']], ['fantan', 'Fan-Tan', 'casb4', ['#DCFCE7', '#166534']],
    ['pachinko', 'Pachinko', 'casb5', ['#FCE7F3', '#A21CAF']], ['amida', 'Ladder Lottery', 'casb5', ['#E0E7FF', '#4338CA']], ['skeeball', 'Skee-Ball', 'casb5', ['#DBEAFE', '#1D4ED8']], ['ducks', 'Lucky Ducks', 'casb5', ['#FEF9C3', '#CA8A04']],
    ['dreidel', 'Dreidel', 'casb6', ['#DBEAFE', '#1E40AF']], ['oracle', 'Oracle Ball', 'casb6', ['#EDE9FE', '#4C1D95']], ['rpsduel', 'RPS Duel', 'casb6', ['#F3E8FF', '#7E22CE']],
    ['cometqueen', 'Comet Queen', 'casb7', ['#FCE7F3', '#BE185D']]
  ];
  D6.CasinoCatalog.add(L.map(function (g) { return { k: g[0], name: g[1], sec: 'more', file: g[2], pal: g[3], icon: ICONS[g[0]] }; }));
})(window.D6 = window.D6 || {});
