/* v2850 — live3 catalogue (owner request, round 6): 12 new LIVE games (shared rounds, casino_lib.php CASINO_LIVE3),
   module js/games/live3.js. Logos drawn here (64×64, same style as the other live logos). */
(function (D6) {
  if (!D6.CasinoCatalog) return;
  function rg(id, a, b, c) { return '<radialGradient id="' + id + '" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="' + a + '"/><stop offset=".55" stop-color="' + b + '"/><stop offset="1" stop-color="' + c + '"/></radialGradient>'; }
  function lg(id, a, b) { return '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient>'; }
  var sp = function (x, y, s) { return '<path d="M' + x + ' ' + (y - s) + 'l' + (s * .3) + ' ' + (s * .7) + ' ' + (s * .7) + ' ' + (s * .3) + '-' + (s * .7) + ' ' + (s * .3) + '-' + (s * .3) + ' ' + (s * .7) + '-' + (s * .3) + '-' + (s * .7) + '-' + (s * .7) + '-' + (s * .3) + ' ' + (s * .7) + '-' + (s * .3) + 'z" fill="#FFF7D6"/>'; };
  var sh = function (rx) { return '<ellipse cx="32" cy="57" rx="' + (rx || 21) + '" ry="3.6" fill="#000" opacity=".28"/>'; };
  var card = function (x, y, r, rank, red, id) { return '<g transform="translate(' + x + ' ' + y + ') rotate(' + r + ')"><rect x="-10" y="-14" width="20" height="28" rx="3" fill="url(#' + id + ')" stroke="#CBD5E1" stroke-width=".6"/><text x="-5" y="-5" text-anchor="middle" font-size="7" font-weight="900" font-family="Arial,sans-serif" fill="' + (red ? '#DC2626' : '#111827') + '">' + rank + '</text><path d="M0 1C-3 4-5 6-3 8.5C-1.5 10 0 9 0 7.6C0 9 1.5 10 3 8.5C5 6 3 4 0 1Z" fill="' + (red ? '#DC2626' : '#111827') + '" transform="translate(0 -2)"/></g>'; };
  var ICONS = {
    // red dragon emblem and orange tiger emblem facing each other
    dtlive: '<defs>' + rg('IDr', '#FCA5A5', '#DC2626', '#7F1D1D') + rg('IDt', '#FED7AA', '#F97316', '#7C2D12') + '</defs>' + sh(24) +
      '<g transform="translate(20 34)"><circle r="14" fill="url(#IDr)" stroke="#FDE68A" stroke-width="1.4"/><path d="M-8-8q-3-7 2-9q-1 5 3 7zM8-8q3-7-2-9q1 5-3 7z" fill="#FBBF24"/><path d="M-6-2l4 1.2M6-2l-4 1.2" stroke="#FDE68A" stroke-width="2" stroke-linecap="round"/><path d="M-3 6q3 2.4 6 0" stroke="#FDE68A" stroke-width="1.3" fill="none"/><path d="M-5 4q-7 1-9 7" stroke="#FBBF24" stroke-width="1.1" fill="none"/></g>' +
      '<g transform="translate(44 34)"><circle r="14" fill="url(#IDt)" stroke="#FDE68A" stroke-width="1.4"/><path d="M-10-9l-2-6 7 3zM10-9l2-6-7 3z" fill="#EA580C"/><path d="M-12-1l5 1.6M-12 4h5M12-1l-5 1.6M12 4h-5M0-13v4" stroke="#1C1917" stroke-width="1.7" stroke-linecap="round"/><circle cx="-5" cy="-2.6" r="1.2" fill="#14532D"/><circle cx="5" cy="-2.6" r="1.2" fill="#14532D"/><ellipse cy="6" rx="6" ry="4" fill="#FFF7ED"/><path d="M-1.6 3.4h3.2l-1.6 2z" fill="#1C1917"/></g>' +
      '<text x="32" y="56" text-anchor="middle" font-size="9" font-weight="900" font-family="Arial,sans-serif" fill="#FDE68A" stroke="#7C2D12" stroke-width=".6">VS</text>' + sp(32, 12, 4),
    // base card + up / down arrows
    hilolive: '<defs>' + lg('IDw', '#FFFFFF', '#E2E8F0') + lg('IDb', '#3B82F6', '#1E3A8A') + '</defs>' + sh() +
      '<g transform="translate(36 33) rotate(10)"><rect x="-12" y="-17" width="24" height="34" rx="3.5" fill="url(#IDb)" stroke="#FDE68A" stroke-width="1"/><path d="M0-7l6 7-6 7-6-7z" fill="#FDE68A"/></g>' +
      '<g transform="scale(1.2) translate(-4 -4)">' + card(26, 33, -10, 'K', true, 'IDw') + '</g>' +
      '<circle cx="51" cy="16" r="8" fill="#16A34A" stroke="#fff" stroke-width="1.2"/><path d="M51 11.5l4.5 6h-9z" fill="#fff"/><circle cx="51" cy="44" r="8" fill="#DC2626" stroke="#fff" stroke-width="1.2"/><path d="M51 48.5l4.5-6h-9z" fill="#fff"/>',
    // glass dome on three dice
    sicbolive: '<defs>' + lg('IDd', '#FFFFFF', '#CBD5E1') + rg('IDp', '#FEF3C7', '#D97706', '#78350F') + '<radialGradient id="IDg" cx="40%" cy="30%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#38BDF8" stop-opacity=".25"/></radialGradient></defs>' + sh(24) +
      '<ellipse cx="32" cy="52" rx="25" ry="6" fill="url(#IDp)"/>' +
      '<g transform="translate(20 44) rotate(-12)"><rect x="-7" y="-7" width="14" height="14" rx="3" fill="url(#IDd)"/><circle r="2" fill="#DC2626"/></g>' +
      '<g transform="translate(32 41)"><rect x="-7" y="-7" width="14" height="14" rx="3" fill="url(#IDd)"/><circle cx="-3" cy="-3" r="1.5" fill="#111"/><circle cx="3" cy="3" r="1.5" fill="#111"/><circle r="1.5" fill="#111"/></g>' +
      '<g transform="translate(44 44) rotate(14)"><rect x="-7" y="-7" width="14" height="14" rx="3" fill="url(#IDd)"/><circle cx="-3" cy="-3" r="1.5" fill="#DC2626"/><circle cx="3" cy="3" r="1.5" fill="#DC2626"/><circle cx="3" cy="-3" r="1.5" fill="#DC2626"/><circle cx="-3" cy="3" r="1.5" fill="#DC2626"/></g>' +
      '<path d="M9 50Q9 12 32 12T55 50" fill="url(#IDg)" stroke="#E0F2FE" stroke-width="1.4"/><path d="M15 38Q16 22 26 17" stroke="#fff" stroke-opacity=".7" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="32" cy="10" r="3.6" fill="url(#IDp)"/>',
    // number grid with lit cells and a ball
    kenolive: '<defs>' + rg('IDb', '#FFFFFF', '#FDE68A', '#D97706') + lg('IDg', '#1E3A8A', '#0B2245') + '</defs>' + sh() +
      '<rect x="8" y="14" width="40" height="36" rx="6" fill="url(#IDg)" stroke="#7DD3FC" stroke-opacity=".6"/>' +
      (function () { var s = ''; for (var r = 0; r < 4; r++) for (var c = 0; c < 5; c++) { var on = [1, 7, 8, 12, 18].indexOf(r * 5 + c) >= 0; s += '<rect x="' + (11 + c * 7.2) + '" y="' + (17 + r * 7.8) + '" width="6" height="6.4" rx="1.6" fill="' + (on ? (r < 2 ? '#FBBF24' : '#38BDF8') : 'rgba(255,255,255,.14)') + '"/>'; } return s; })() +
      '<circle cx="46" cy="44" r="12" fill="url(#IDb)" stroke="#92400E" stroke-width=".8"/><circle cx="46" cy="44" r="6.5" fill="#fff"/><text x="46" y="47" text-anchor="middle" font-size="8" font-weight="900" font-family="Arial,sans-serif" fill="#78350F">80</text>' + sp(54, 14, 4),
    // air-mix globe with numbered balls
    lucky10: '<defs><radialGradient id="IDg" cx="40%" cy="30%" r="70%"><stop offset="0" stop-color="#E0F2FE" stop-opacity=".5"/><stop offset="1" stop-color="#0EA5E9" stop-opacity=".2"/></radialGradient>' + rg('IDp', '#FEF3C7', '#F59E0B', '#78350F') + '</defs>' + sh() +
      '<rect x="22" y="47" width="20" height="9" rx="2.5" fill="url(#IDp)"/>' +
      '<circle cx="32" cy="29" r="20" fill="#1E1B4B"/>' +
      '<circle cx="24" cy="36" r="5" fill="#EF4444"/><circle cx="35" cy="39" r="5" fill="#22C55E"/><circle cx="41" cy="28" r="5" fill="#3B82F6"/><circle cx="27" cy="25" r="5" fill="#EAB308"/><circle cx="34" cy="19" r="5" fill="#D946EF"/>' +
      '<circle cx="32" cy="29" r="20" fill="url(#IDg)" stroke="#BAE6FD" stroke-width="1.4"/><path d="M18 22Q20 14 28 11" stroke="#fff" stroke-opacity=".7" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
      '<circle cx="50" cy="12" r="8" fill="#F97316" stroke="#fff" stroke-width="1"/><circle cx="50" cy="12" r="4.4" fill="#fff"/><text x="50" y="14.6" text-anchor="middle" font-size="6.5" font-weight="900" font-family="Arial,sans-serif" fill="#111">10</text>',
    // big money wheel with pointer
    moneywheel: '<defs>' + rg('IDh', '#FFF7D6', '#F59E0B', '#78350F') + '</defs>' + sh(18) +
      '<circle cx="32" cy="33" r="23" fill="#2A1203" stroke="url(#IDh)" stroke-width="3"/>' +
      (function () { var s = '', C = ['#CA8A04', '#2563EB', '#FDE68A', '#7C3AED', '#CA8A04', '#16A34A', '#FDE68A', '#EA580C', '#CA8A04', '#93C5FD', '#FDE68A', '#DC2626']; for (var k = 0; k < 12; k++) { var a0 = (k * 30 - 105) * Math.PI / 180, a1 = ((k + 1) * 30 - 105) * Math.PI / 180; s += '<path d="M32 33L' + (32 + Math.cos(a0) * 20).toFixed(1) + ' ' + (33 + Math.sin(a0) * 20).toFixed(1) + 'A20 20 0 0 1 ' + (32 + Math.cos(a1) * 20).toFixed(1) + ' ' + (33 + Math.sin(a1) * 20).toFixed(1) + 'Z" fill="' + C[k] + '"/>'; } return s; })() +
      '<circle cx="32" cy="33" r="7" fill="url(#IDh)" stroke="#78350F"/><path d="M27 5h10l-5 9z" fill="#F8FAFC" stroke="#DC2626" stroke-width="1.6" stroke-linejoin="round"/>' + sp(55, 52, 3.5),
    // three coins, one flipping
    coinlive: '<defs>' + rg('IDg', '#FEF9C3', '#F59E0B', '#92400E') + rg('IDs', '#FFFFFF', '#CBD5E1', '#475569') + '</defs>' + sh(24) +
      '<circle cx="18" cy="44" r="10" fill="url(#IDg)" stroke="#92400E"/><path d="M13 46l-1-6 3 2 3-4 3 4 3-2-1 6z" fill="#FEF3C7"/>' +
      '<circle cx="46" cy="44" r="10" fill="url(#IDs)" stroke="#334155"/><path d="M46 38.5l1.6 3.4 3.6.4-2.7 2.5.7 3.6-3.2-1.8-3.2 1.8.7-3.6-2.7-2.5 3.6-.4z" fill="#F8FAFC" stroke="#475569" stroke-width=".5"/>' +
      '<ellipse cx="32" cy="20" rx="11" ry="4.5" fill="url(#IDg)" stroke="#92400E"/><path d="M21 20v2.4q11 5 22 0V20" fill="#B45309"/>' +
      '<path d="M18 30q-4-8 4-14M46 30q4-8-4-14" stroke="#FDE68A" stroke-width="1.6" fill="none" stroke-dasharray="2 2.4" stroke-linecap="round"/>' + sp(32, 8, 3.5),
    // triangle of pegs, falling ball, coloured boxes
    pegdrop: '<defs>' + rg('IDb', '#FFFFFF', '#E0E7FF', '#6366F1') + '</defs>' + sh(24) +
      (function () { var s = ''; for (var r = 0; r < 4; r++) for (var j = 0; j <= r; j++) s += '<circle cx="' + (32 + (j - r / 2) * 9) + '" cy="' + (18 + r * 8) + '" r="1.9" fill="#C7D2FE"/>'; var C = ['#DC2626', '#CA8A04', '#16A34A', '#CA8A04', '#DC2626']; for (var b = 0; b < 5; b++) s += '<rect x="' + (12 + b * 8.2) + '" y="' + (b === 2 ? 46 : 49) + '" width="7" height="' + (b === 2 ? 9 : 6) + '" rx="1.6" fill="' + C[b] + '"/>'; return s; })() +
      '<path d="M32 6Q27 14 32 18Q38 24 36 34" stroke="#A5B4FC" stroke-width="1" stroke-dasharray="1.6 2" fill="none"/><circle cx="36" cy="37" r="4.6" fill="url(#IDb)"/>' + sp(51, 14, 4),
    // football in front of a goal net
    football: '<defs>' + rg('IDb', '#FFFFFF', '#F1F5F9', '#64748B') + lg('IDg', '#22C55E', '#15803D') + '</defs>' + sh(24) +
      '<path d="M6 50L14 18H50L58 50Z" fill="url(#IDg)" opacity=".55"/><path d="M14 18H50V36H14Z" fill="none" stroke="#fff" stroke-width="2"/><path d="M18 18v18M23 18v18M28 18v18M33 18v18M38 18v18M43 18v18M14 24h36M14 30h36" stroke="#fff" stroke-opacity=".35" stroke-width=".7"/>' +
      '<circle cx="34" cy="43" r="11" fill="url(#IDb)" stroke="#0F172A" stroke-width=".6"/><path d="M30 40.5l4-3 4 3-1.5 4.5h-5z" fill="#0F172A"/><path d="M30 40.5l-4.5-.5M38 40.5l4.5-.5M32.5 45l-2 4M35.5 45l2 4" stroke="#0F172A" stroke-width=".9"/>' +
      '<path d="M16 46l-6 2M14 41l-7-1" stroke="#fff" stroke-opacity=".7" stroke-width="1.4" stroke-linecap="round"/>' + sp(52, 10, 4),
    // target with an arrow in the gold
    bullseye: '<defs>' + lg('IDw', '#A16207', '#713F12') + '</defs>' + sh(20) +
      '<path d="M22 56l6-14M42 56l-6-14" stroke="url(#IDw)" stroke-width="3.4" stroke-linecap="round"/>' +
      '<circle cx="32" cy="30" r="22" fill="#78350F"/><circle cx="32" cy="30" r="20" fill="#F8FAFC"/><circle cx="32" cy="30" r="16" fill="#1F2937"/><circle cx="32" cy="30" r="12" fill="#3B82F6"/><circle cx="32" cy="30" r="8" fill="#EF4444"/><circle cx="32" cy="30" r="4" fill="#FACC15"/>' +
      '<path d="M33 29L55 9" stroke="#F8FAFC" stroke-width="2"/><path d="M33 29l5-1.4-3.4 4z" fill="#CBD5E1"/><path d="M55 9l3-5M55 9l5-2M52 12l3-5M52 12l5-2" stroke="#EF4444" stroke-width="1.6" stroke-linecap="round"/>',
    // ladder with rungs and a glowing ball
    ladder: '<defs>' + rg('IDb', '#FFFFFF', '#FDE68A', '#D97706') + '</defs>' + sh() +
      '<path d="M20 10V52M44 10V52" stroke="#E2E8F0" stroke-width="3.6" stroke-linecap="round"/><path d="M20 20H44M20 31H44M20 42H44" stroke="#FBBF24" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="20" cy="7" r="4.4" fill="#22D3EE" stroke="#fff" stroke-width=".8"/><circle cx="44" cy="55" r="4.4" fill="#F472B6" stroke="#fff" stroke-width=".8"/>' +
      '<path d="M20 11V20H44V31H20V36" stroke="#FDE68A" stroke-width="1.2" stroke-dasharray="2 2" fill="none"/><circle cx="20" cy="37" r="5" fill="url(#IDb)"/>' + sp(54, 16, 4) + sp(9, 40, 3),
    // rocket shooting toward the moon
    moonshot: '<defs>' + rg('IDm', '#FFFFFF', '#E2E8F0', '#94A3B8') + lg('IDr', '#F8FAFC', '#94A3B8') + rg('IDf', '#FFF7D6', '#FB923C', '#DC2626') + '</defs>' + sh(18) +
      '<circle cx="48" cy="15" r="10" fill="url(#IDm)"/><circle cx="45" cy="12" r="2" fill="#CBD5E1"/><circle cx="51" cy="18" r="1.5" fill="#CBD5E1"/>' +
      '<g transform="translate(26 36) rotate(35)"><path d="M-4 13Q0 30 4 13Z" fill="url(#IDf)"/><path d="M0-18Q8-8 7 10H-7Q-8-8 0-18Z" fill="url(#IDr)" stroke="#475569" stroke-width=".6"/><path d="M0-18Q4-13 6-8H-6Q-4-13 0-18Z" fill="#DC2626"/><circle cy="-2" r="3.2" fill="#38BDF8" stroke="#0C4A6E"/><path d="M-7 4L-12 12L-6 10ZM7 4L12 12L6 10Z" fill="#DC2626"/></g>' +
      '<text x="48" y="44" text-anchor="middle" font-size="9" font-weight="900" font-family="Arial,sans-serif" fill="#86EFAC" stroke="#14532D" stroke-width=".5">×10</text>' + sp(10, 12, 3) + sp(58, 34, 2.6)
  };
  D6.CasinoCatalog.add([
    { k: 'dtlive', name: 'Dragon Duel', sec: 'live', file: 'live3', pal: ['#FEE2E2', '#B91C1C'], icon: ICONS.dtlive },
    { k: 'moneywheel', name: 'Money Wheel', sec: 'live', file: 'live3', pal: ['#FEF3C7', '#B45309'], icon: ICONS.moneywheel },
    { k: 'football', name: 'Goal Rush', sec: 'live', file: 'live3', pal: ['#DCFCE7', '#15803D'], icon: ICONS.football },
    { k: 'kenolive', name: 'Keno Live', sec: 'live', file: 'live3', pal: ['#E0F2FE', '#0369A1'], icon: ICONS.kenolive },
    { k: 'moonshot', name: 'Moon Shot', sec: 'live', file: 'live3', pal: ['#EDE9FE', '#5B21B6'], icon: ICONS.moonshot },
    { k: 'sicbolive', name: 'Big Small', sec: 'live', file: 'live3', pal: ['#F3E8FF', '#7E22CE'], icon: ICONS.sicbolive },
    { k: 'pegdrop', name: 'Peg Drop', sec: 'live', file: 'live3', pal: ['#E0E7FF', '#4338CA'], icon: ICONS.pegdrop },
    { k: 'hilolive', name: 'Hi-Lo Live', sec: 'live', file: 'live3', pal: ['#CCFBF1', '#0F766E'], icon: ICONS.hilolive },
    { k: 'bullseye', name: 'Bullseye', sec: 'live', file: 'live3', pal: ['#FEF9C3', '#A16207'], icon: ICONS.bullseye },
    { k: 'lucky10', name: 'Lucky Ten', sec: 'live', file: 'live3', pal: ['#E0F2FE', '#0284C7'], icon: ICONS.lucky10 },
    { k: 'ladder', name: 'Lucky Ladder', sec: 'live', file: 'live3', pal: ['#F5F3FF', '#6D28D9'], icon: ICONS.ladder },
    { k: 'coinlive', name: 'Coin Toss', sec: 'live', file: 'live3', pal: ['#FFEDD5', '#C2410C'], icon: ICONS.coinlive }
  ]);
})(window.D6 = window.D6 || {});
