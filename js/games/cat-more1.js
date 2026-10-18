/* v2805 — more1 catalogue: 15 instant games for the list « All games » (server fiches: casino_ext/more1.php). */
(function (D6) {
  if (!D6.CasinoCatalog) return;
  var RC = ' stroke-linecap="round"';
  function lg(id, a, b, c, d) { return '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (d ? 1 : 0) + '" y2="1"><stop offset="0" stop-color="' + a + '"/>' + (c ? '<stop offset=".5" stop-color="' + b + '"/><stop offset="1" stop-color="' + c + '"/>' : '<stop offset="1" stop-color="' + b + '"/>') + '</linearGradient>'; }
  function rg(id, a, b, c) { return '<radialGradient id="' + id + '" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="' + a + '"/><stop offset=".55" stop-color="' + b + '"/><stop offset="1" stop-color="' + c + '"/></radialGradient>'; }
  function spark(x, y, s) { return '<path d="M' + x + ' ' + (y - s) + 'Q' + x + ' ' + y + ' ' + (x + s) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y + s) + 'Q' + x + ' ' + y + ' ' + (x - s) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y - s) + 'z" fill="#fff"/>'; }
  var SU = { h: 'M0 4C-3 1.5-5 0-5-2.2-5-3.8-3.8-5-2.4-5-1.4-5-.5-4.4 0-3.5.5-4.4 1.4-5 2.4-5 3.8-5 5-3.8 5-2.2 5 0 3 1.5 0 4z',
    s: 'M0-5C-2-2.5-5-1-5 1.3-5 2.8-3.8 3.7-2.6 3.7-1.7 3.7-1 3.2-.6 2.6L-1.4 5H1.4L.6 2.6C1 3.2 1.7 3.7 2.6 3.7 3.8 3.7 5 2.8 5 1.3 5-1 2-2.5 0-5z', d: 'M0-5L3.6 0 0 5-3.6 0z' };
  // carte blanche (rang + couleur), tournée de r degrés autour de son centre
  function card(x, y, r, rk, su, w) {
    w = w || 22; var h = w * 1.42, red = su !== 's', c = red ? '#E11D48' : '#1E1B3A';
    return '<g transform="rotate(' + r + ' ' + (x + w / 2) + ' ' + (y + h / 2) + ')"><rect x="' + (x + 1) + '" y="' + (y + 2) + '" width="' + w + '" height="' + h + '" rx="3.5" fill="#000" opacity=".3"/>' +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="3.5" fill="url(#IDw)" stroke="#CFC7EA" stroke-width=".8"/>' +
      '<text x="' + (x + 5.5) + '" y="' + (y + 9.5) + '" text-anchor="middle" font-size="8.5" font-weight="900" font-family="system-ui,sans-serif" fill="' + c + '">' + rk + '</text>' +
      '<path d="' + SU[su] + '" fill="' + c + '" transform="translate(' + (x + w / 2) + ' ' + (y + h * 0.6) + ') scale(' + (w / 16) + ')"/></g>';
  }
  var W = lg('IDw', '#FFFFFF', '#E9E4F7');
  function ball(x, y, r, a, b, c, id) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="url(#' + id + ')"/><circle cx="' + (x - r * .35) + '" cy="' + (y - r * .38) + '" r="' + (r * .28) + '" fill="#fff" opacity=".6"/>'; }
  function die(x, y, s, n, red) {
    var P = { 1: [[.5, .5]], 3: [[.25, .25], [.5, .5], [.75, .75]], 4: [[.27, .27], [.73, .27], [.27, .73], [.73, .73]], 5: [[.25, .25], [.75, .25], [.5, .5], [.25, .75], [.75, .75]], 6: [[.27, .22], [.73, .22], [.27, .5], [.73, .5], [.27, .78], [.73, .78]] }[n];
    return '<rect x="' + (x + 1.2) + '" y="' + (y + 2) + '" width="' + s + '" height="' + s + '" rx="' + s * .22 + '" fill="#000" opacity=".3"/><rect x="' + x + '" y="' + y + '" width="' + s + '" height="' + s + '" rx="' + s * .22 + '" fill="url(#' + (red ? 'IDr' : 'IDw') + ')" stroke="' + (red ? '#881337' : '#BDB4DD') + '" stroke-width=".8"/>' +
      P.map(function (p) { return '<circle cx="' + (x + p[0] * s).toFixed(1) + '" cy="' + (y + p[1] * s).toFixed(1) + '" r="' + (s * .085).toFixed(1) + '" fill="' + (red ? '#fff' : '#1E1B3A') + '"/>'; }).join('');
  }
  function wheel(cx, cy, R, cols, n) {
    var s = ''; for (var i = 0; i < n; i++) { var a0 = i * 2 * Math.PI / n, a1 = (i + 1) * 2 * Math.PI / n; s += '<path d="M' + cx + ' ' + cy + 'L' + (cx + R * Math.sin(a0)).toFixed(1) + ' ' + (cy - R * Math.cos(a0)).toFixed(1) + 'A' + R + ' ' + R + ' 0 0 1 ' + (cx + R * Math.sin(a1)).toFixed(1) + ' ' + (cy - R * Math.cos(a1)).toFixed(1) + 'z" fill="' + cols[i % cols.length] + '"/>'; }
    return s;
  }
  var GOLD = rg('IDg', '#FFF6C8', '#F5B700', '#9A6A00');
  var ICONS = {
    plinko2: function () {
      var p = ''; for (var r = 0; r < 5; r++) for (var c = 0; c < r + 3; c++) p += '<circle cx="' + (32 + (c - (r + 2) / 2) * 8.4).toFixed(1) + '" cy="' + (12 + r * 7.4) + '" r="1.9" fill="#F5F3FF"/>';
      var bins = ['#F43F5E', '#FB923C', '#FACC15', '#4ADE80', '#FACC15', '#FB923C', '#F43F5E'].map(function (c, i) { return '<rect x="' + (4.5 + i * 8) + '" y="50" width="7" height="8" rx="2" fill="' + c + '"/>'; }).join('');
      return '<defs>' + rg('IDb', '#fff', '#FF7AB6', '#BE185D') + lg('IDt', '#3B1D8F', '#140B38') + '</defs><path d="M32 3L61 47H3z" fill="url(#IDt)" stroke="#A78BFA" stroke-opacity=".6"/>' + p + bins + ball(37, 29, 5.6, 0, 0, 0, 'IDb') + spark(54, 10, 3.4);
    },
    goal: function () {
      var n = ''; for (var i = 0; i < 7; i++) n += 'M' + (10 + i * 7.3) + ' 14V44'; for (var j = 0; j < 5; j++) n += 'M8 ' + (16 + j * 7) + 'H56';
      return '<defs>' + lg('IDp', '#FFFFFF', '#94A3B8') + rg('IDb', '#fff', '#E2E8F0', '#64748B') + lg('IDf', '#4ADE80', '#14532D') + '</defs><ellipse cx="32" cy="52" rx="29" ry="7" fill="url(#IDf)"/>' +
        '<path d="' + n + '" stroke="#E2E8F0" stroke-width=".7" opacity=".55"/><path d="M7 47V12H57V47" fill="none" stroke="url(#IDp)" stroke-width="3.6" stroke-linejoin="round"/>' +
        '<circle cx="36" cy="44" r="10" fill="url(#IDb)" stroke="#334155" stroke-width=".8"/><path d="M36 38.6l4.6 3.4-1.8 5.3h-5.6l-1.8-5.3z" fill="#1E293B"/><path d="M29 41a8 8 0 0 1 4.6-5" stroke="#fff" stroke-width="1.6" fill="none"' + RC + '/>' +
        '<path d="M24 47q-8 2-14 0" stroke="#FDE68A" stroke-width="1.4" fill="none" opacity=".8"' + RC + '/>' + spark(52, 7, 3.4);
    },
    miniroul: function () {
      return '<defs>' + GOLD + rg('IDh', '#000', '#000', '#000') + rg('IDc', '#FDE68A', '#B45309', '#5B2408') + '</defs><circle cx="32" cy="34" r="27" fill="#2A0E02" opacity=".5"/><circle cx="32" cy="32" r="27" fill="url(#IDg)"/>' +
        wheel(32, 32, 23, ['#16A34A', '#DC2626', '#111827', '#DC2626', '#111827', '#DC2626', '#111827', '#DC2626', '#111827', '#DC2626', '#111827', '#DC2626', '#111827'], 13) +
        '<circle cx="32" cy="32" r="12" fill="url(#IDc)" stroke="#FDE68A"/><path d="M27 27l10 10M37 27L27 37" stroke="url(#IDg)" stroke-width="2.4"' + RC + '/><circle cx="32" cy="32" r="4" fill="url(#IDg)"/>' +
        '<circle cx="42" cy="13.5" r="3.2" fill="#fff" stroke="#94A3B8" stroke-width=".6"/><path d="M9 24A24 24 0 0 1 22 9" stroke="#fff" stroke-width="2" fill="none" opacity=".5"' + RC + '/>';
    },
    keno80: function () {
      var g = ''; for (var r = 0; r < 4; r++) for (var c = 0; c < 5; c++) { var on = [1, 7, 8, 13, 19].indexOf(r * 5 + c) >= 0; g += '<rect x="' + (9 + c * 8.4) + '" y="' + (12 + r * 8.4) + '" width="7" height="7" rx="1.8" fill="' + (on ? '#FBBF24' : 'rgba(255,255,255,.16)') + '"/>'; }
      return '<defs>' + lg('IDt', '#4338CA', '#1E1B4B') + rg('IDb', '#fff', '#60A5FA', '#1D4ED8') + rg('IDr', '#fff', '#F87171', '#B91C1C') + '</defs><rect x="5" y="7" width="46" height="44" rx="7" fill="url(#IDt)" stroke="#A5B4FC" stroke-width="1.2"/>' + g +
        ball(47, 47, 9, 0, 0, 0, 'IDb') + '<text x="47" y="50.4" text-anchor="middle" font-size="9" font-weight="900" font-family="system-ui" fill="#fff">80</text>' + ball(53, 23, 6, 0, 0, 0, 'IDr') + spark(12, 56, 3);
    },
    thimbles: function () {
      var th = function (x, y, s) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path d="M-10 0C-10-10-8-19-6-23Q0-26 6-23C8-19 10-10 10 0z" fill="url(#IDa)" stroke="#7A4A00" stroke-width=".6"/><path d="M-11 0Q0 3 11 0V-2.6Q0 .4-11-2.6z" fill="url(#IDg)"/><path d="M-6.5-20C-8-14-8.4-8-8-3" stroke="#FFF7D6" stroke-width="1.6" fill="none" opacity=".75"' + RC + '/></g>'; };
      return '<defs>' + lg('IDa', '#8A5600', '#FFE08A', '#7A4A00', 1) + GOLD + rg('IDc', '#fff', '#A5F3FC', '#0E7490') + '</defs><ellipse cx="32" cy="54" rx="28" ry="5" fill="#000" opacity=".3"/>' +
        th(16, 52, 1.05) + '<g transform="translate(0 -12)">' + th(46, 52, 1.05) + '</g>' + ball(46, 46, 6, 0, 0, 0, 'IDc') + spark(30, 10, 3.6);
    },
    cups: function () {
      return '<defs>' + lg('IDa', '#7F1D1D', '#FB7185', '#5F0B1E', 1) + GOLD + rg('IDc', '#fff', '#A5F3FC', '#0E7490') + '</defs><ellipse cx="32" cy="56" rx="27" ry="5" fill="#000" opacity=".3"/>' +
        '<g transform="translate(26 50)"><path d="M-17 0L-12-32Q0-36 12-32L17 0z" fill="url(#IDa)" stroke="#4C0519" stroke-width=".8"/><ellipse cy="-32.5" rx="12" ry="2.8" fill="url(#IDg)"/><path d="M-15-9H15M-14-18H14" stroke="#FDE68A" stroke-width="1.4" opacity=".85"/><path d="M-18 0Q0 4 18 0V-3Q0 1-18-3z" fill="url(#IDg)"/><path d="M-9-29l-4 24" stroke="#fff" stroke-width="2.2" opacity=".45"' + RC + '/></g>' +
        ball(50, 49, 7, 0, 0, 0, 'IDc') + spark(53, 14, 3.6) + spark(10, 20, 2.4);
    },
    highcard: function () {
      return '<defs>' + W + lg('IDu', '#86EFAC', '#16A34A') + lg('IDd', '#FDA4AF', '#E11D48') + '</defs>' + card(8, 12, -8, '7', 'd', 26) + card(26, 16, 9, 'K', 's', 26) +
        '<path d="M53 22l6 8h-4v8h-4v-8h-4z" fill="url(#IDu)" stroke="#14532D" stroke-width=".7"/><path d="M53 58l6-8h-4v-8h-4v8h-4z" fill="url(#IDd)" stroke="#881337" stroke-width=".7"/>' + spark(10, 8, 3.2);
    },
    reddog: function () {
      return '<defs>' + W + rg('IDr', '#FDA4AF', '#E11D48', '#7F1D1D') + '</defs>' + card(4, 16, -14, '4', 's') + card(38, 16, 14, 'J', 'h') +
        '<g transform="translate(32 32)"><rect x="-11" y="-16" width="22" height="31" rx="3.5" fill="url(#IDr)" stroke="#FECDD3" stroke-width="1"/><path d="M-6-3c-2 0-3-2-2-3.6s3-.6 3 1.2zM6-3c2 0 3-2 2-3.6s-3-.6-3 1.2zM-2.6-7.4c-1.6 0-2.4-1.8-1.6-3.2s2.8-.6 2.8 1.2zM2.6-7.4c1.6 0 2.4-1.8 1.6-3.2s-2.8-.6-2.8 1.2zM0 7c-4 0-6-2.4-5-5 .8-2.2 3-3 5-3s4.2.8 5 3c1 2.6-1 5-5 5z" fill="#fff"/></g>' + spark(54, 8, 3.4);
    },
    war: function () {
      return '<defs>' + W + GOLD + lg('IDs', '#F8FAFC', '#94A3B8') + '</defs>' + card(3, 14, -16, 'A', 's', 25) + card(36, 14, 16, 'A', 'h', 25) +
        '<g transform="rotate(45 32 30)"><rect x="30.4" y="6" width="3.2" height="34" rx="1.4" fill="url(#IDs)" stroke="#475569" stroke-width=".5"/><rect x="25" y="38" width="14" height="3.4" rx="1.6" fill="url(#IDg)"/><rect x="30.6" y="41" width="2.8" height="8" rx="1.2" fill="#7C2D12"/><circle cx="32" cy="50.5" r="2.2" fill="url(#IDg)"/></g>' +
        '<g transform="rotate(-45 32 30)"><rect x="30.4" y="6" width="3.2" height="34" rx="1.4" fill="url(#IDs)" stroke="#475569" stroke-width=".5"/><rect x="25" y="38" width="14" height="3.4" rx="1.6" fill="url(#IDg)"/><rect x="30.6" y="41" width="2.8" height="8" rx="1.2" fill="#7C2D12"/><circle cx="32" cy="50.5" r="2.2" fill="url(#IDg)"/></g>';
    },
    andar: function () {
      return '<defs>' + W + lg('IDa', '#38BDF8', '#1D4ED8') + lg('IDb', '#FB7185', '#BE123C') + GOLD + '</defs>' +
        '<rect x="3" y="8" width="18" height="25" rx="3" fill="url(#IDa)" stroke="#BFDBFE"/><rect x="3" y="35" width="18" height="25" rx="3" fill="url(#IDb)" stroke="#FECDD3"/>' +
        '<text x="12" y="25" text-anchor="middle" font-size="12" font-weight="900" font-family="system-ui" fill="#fff">A</text><text x="12" y="52" text-anchor="middle" font-size="12" font-weight="900" font-family="system-ui" fill="#fff">B</text>' +
        card(30, 12, 6, 'Q', 'h', 28) + '<circle cx="51" cy="13" r="6" fill="url(#IDg)" stroke="#7A4A00" stroke-width=".7"/><path d="M51 9.4l1 2.4 2.6.2-2 1.6.7 2.5-2.3-1.4-2.3 1.4.7-2.5-2-1.6 2.6-.2z" fill="#7A4A00"/>';
    },
    teenpatti: function () {
      return '<defs>' + W + rg('IDc', '#FDE68A', '#F59E0B', '#92400E') + '</defs>' + card(5, 15, -20, 'A', 's', 24) + card(20, 9, 0, 'A', 'h', 24) + card(35, 15, 20, 'A', 'd', 24) +
        '<circle cx="32" cy="54" r="8" fill="url(#IDc)" stroke="#7A4A00"/><circle cx="32" cy="54" r="5" fill="none" stroke="#FFF7D6" stroke-width="1.2" stroke-dasharray="2 1.6"/>';
    },
    vpoker: function () {
      var c = ''; [['10', 'h'], ['J', 'h'], ['Q', 'h'], ['K', 'h'], ['A', 'h']].forEach(function (k, i) { c += card(6 + i * 10.4, 22, (i - 2) * 6, k[0], k[1], 15); });
      return '<defs>' + W + lg('IDm', '#4338CA', '#1E1B4B') + GOLD + '</defs><rect x="2" y="6" width="60" height="50" rx="8" fill="url(#IDm)" stroke="url(#IDg)" stroke-width="2"/>' +
        '<rect x="7" y="10" width="50" height="7" rx="2" fill="rgba(0,0,0,.35)"/><path d="M10 13.5h18M38 13.5h16" stroke="#FDE68A" stroke-width="2"' + RC + '/>' + c + spark(56, 50, 3.4);
    },
    colorpred: function () {
      return '<defs>' + rg('IDa', '#BBF7D0', '#22C55E', '#14532D') + rg('IDb', '#FECDD3', '#F43F5E', '#881337') + rg('IDc', '#E9D5FF', '#A855F7', '#4C1D95') + GOLD + '</defs>' +
        '<circle cx="32" cy="32" r="27" fill="none" stroke="url(#IDg)" stroke-width="2.2" stroke-dasharray="4 3"/>' + ball(20, 40, 12, 0, 0, 0, 'IDa') + ball(44, 40, 12, 0, 0, 0, 'IDb') + ball(32, 21, 12.5, 0, 0, 0, 'IDc') + spark(55, 9, 3.4);
    },
    luckydice: function () {
      return '<defs>' + W + lg('IDr', '#FB7185', '#9F1239', 0, 1) + GOLD + '</defs><g transform="rotate(-12 20 30)">' + die(6, 16, 24, 3) + '</g><g transform="rotate(10 44 36)">' + die(32, 24, 24, 4, 1) + '</g>' +
        '<circle cx="50" cy="13" r="9" fill="url(#IDg)" stroke="#7A4A00"/><text x="50" y="17.3" text-anchor="middle" font-size="12" font-weight="900" font-family="system-ui" fill="#5B2408">7</text>';
    },
    wheel2: function () {
      return '<defs>' + GOLD + lg('IDp', '#FF8A9B', '#DC2626') + '</defs><circle cx="32" cy="34" r="27" fill="#3B0764" opacity=".5"/><circle cx="32" cy="32" r="27" fill="url(#IDg)"/>' +
        wheel(32, 32, 23, ['#FACC15', '#3B82F6', '#FACC15', '#EC4899', '#FACC15', '#3B82F6', '#22C55E', '#FACC15', '#3B82F6', '#F97316', '#FACC15', '#3B82F6', '#A855F7', '#3B82F6'], 14) +
        '<circle cx="32" cy="32" r="8" fill="#1E1B4B" stroke="url(#IDg)" stroke-width="2"/><text x="32" y="35.2" text-anchor="middle" font-size="8" font-weight="900" font-family="system-ui" fill="#FDE68A">$</text>' +
        '<path d="M32 11L27 2Q32 0 37 2z" fill="url(#IDp)" stroke="#FDE68A" stroke-width="1"/><path d="M10 22A24 24 0 0 1 22 10" stroke="#fff" stroke-width="2" fill="none" opacity=".5"' + RC + '/>';
    }
  };
  var L = [
    ['plinko2', 'Plinko', 'board1', ['#FCE7F3', '#DB2777']], ['goal', 'Goal', 'pick1', ['#DCFCE7', '#16A34A']], ['miniroul', 'Mini Roulette', 'board1', ['#D1FAE5', '#047857']],
    ['keno80', 'Keno 80', 'board1', ['#E0E7FF', '#4338CA']], ['thimbles', 'Thimbles', 'pick1', ['#FEF3C7', '#B45309']], ['cups', 'Cups & Balls', 'pick1', ['#FFE4E6', '#BE123C']],
    ['highcard', 'Higher Card', 'cards1', ['#E0F2FE', '#0369A1']], ['reddog', 'Red Dog', 'cards1', ['#FEE2E2', '#B91C1C']], ['war', 'Casino War', 'cards1', ['#E2E8F0', '#475569']],
    ['andar', 'Andar Bahar', 'cards1', ['#FCE7F3', '#9D174D']], ['teenpatti', 'Teen Patti', 'cards1', ['#FEF3C7', '#C2410C']], ['vpoker', 'Video Poker', 'cards1', ['#EDE9FE', '#5B21B6']],
    ['colorpred', 'Color Game', 'pick1', ['#F3E8FF', '#7E22CE']], ['luckydice', 'Lucky Dice', 'pick1', ['#FFE4E6', '#E11D48']], ['wheel2', 'Money Wheel', 'board1', ['#FEF9C3', '#CA8A04']]
  ];
  D6.CasinoCatalog.add(L.map(function (g) { return { k: g[0], name: g[1], sec: 'more', file: g[2], pal: g[3], icon: ICONS[g[0]]() }; }));
})(window.D6 = window.D6 || {});
