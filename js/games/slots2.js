/* v2805 — more2 : 15 video slots on ONE shared engine (owner request), Pragmatic-style gameplay in OROLADO's space style.
   Three machine kinds, each drawn from the server's table line (view.i) so the screen ALWAYS pays exactly the server's
   multiplier and a losing screen never shows a winning combination:
   - 'L5' : 5 reels × 3 rows, 10 fixed lines, 3-4-5 same symbols from the left pay (Book of Ra / Wolf Gold look) ;
   - 'L3' : 3 reels × 3 rows, 5 lines (3 rows + 2 diagonals), classic fruit machine look ;
   - 'S'  : 6×5 (or 7×5) « pays anywhere » grid, 8+ same symbols win, they burst and the grid TUMBLES, multiplier orbs /
            bombs add up (Gates of Olympus / Sweet Bonanza look).
   Spin: motion blur, staggered stops with bounce, quick stop on 2nd tap, win lines drawn and symbols pulsing, wordless big-win
   count-up for ×10 and more. All symbols are SVG drawn here (no images). Table weights + RTP: casino_ext/more2.php. */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit, $ = K ? K.$ : null;

  /* ====================================================================== small drawing kit */
  function f1(v) { return Math.round(v * 10) / 10; }
  function hx(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function mix(a, b, t) {
    var A = hx(a), B = hx(b);
    return '#' + A.map(function (v, i) { var x = Math.round(v + (B[i] - v) * t); return (x < 16 ? '0' : '') + x.toString(16); }).join('');
  }
  function stops(s) {
    return s.map(function (c, i) { var p = c.split('@'); return '<stop offset="' + f1(i / (s.length - 1) * 100) / 100 + '" stop-color="' + p[0] + '"' + (p[1] ? ' stop-opacity="' + p[1] + '"' : '') + '/>'; }).join('');
  }
  /* B = gradient builder for one theme (ids prefixed, defs collected once) */
  function mk(p) {
    var n = 0, d = '';
    return {
      lg: function (s, dir) {
        var id = p + (n++).toString(36);
        d += '<linearGradient id="' + id + '" x1="0" y1="0" ' + (dir === 'h' ? 'x2="1" y2="0"' : dir === 'd' ? 'x2="1" y2="1"' : 'x2="0" y2="1"') + '>' + stops(s) + '</linearGradient>';
        return 'url(#' + id + ')';
      },
      rg: function (s, cx, cy, r) {
        var id = p + (n++).toString(36);
        d += '<radialGradient id="' + id + '" cx="' + (cx || '38%') + '" cy="' + (cy || '32%') + '" r="' + (r || '70%') + '">' + stops(s) + '</radialGradient>';
        return 'url(#' + id + ')';
      },
      defs: function () { return d; }
    };
  }
  var RC = ' stroke-linecap="round" stroke-linejoin="round"';
  function spark(x, y, s, o) {
    return '<path d="M' + x + ' ' + (y - s) + 'Q' + x + ' ' + y + ' ' + (x + s) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y + s) + 'Q' + x + ' ' + y + ' ' + (x - s) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y - s) + 'z" fill="#fff"' + (o ? ' opacity="' + o + '"' : '') + '/>';
  }
  function gloss(cx, cy, rx, ry, rot, o) { return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="#fff" opacity="' + (o || 0.55) + '"' + (rot ? ' transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')"' : '') + '/>'; }
  var PALS = {
    gold: ['#FFF7CF', '#FBBF24', '#A16207'], red: ['#FFC2C2', '#E11D48', '#7F1028'], blue: ['#CFF3FF', '#2B8CEB', '#0B2E86'], green: ['#D9FFD0', '#22C55E', '#0B5D2A'],
    purple: ['#F3D9FF', '#A855F7', '#4C1D95'], pink: ['#FFE0F2', '#F0449A', '#8B1050'], orange: ['#FFE6C2', '#F97316', '#8A2E05'], cyan: ['#D8FFFB', '#14C8C0', '#075E66'],
    yellow: ['#FFFBD6', '#FACC15', '#9A6A00'], white: ['#FFFFFF', '#CFE7FF', '#6C86B8'], jade: ['#E2FFF0', '#10B981', '#064E3B'], silver: ['#FFFFFF', '#B8C4D6', '#4B5563'],
    bronze: ['#FFE2C2', '#C2773B', '#5C2E0E'], teal: ['#D5FFF6', '#0FB39A', '#064B44'], rose: ['#FFE4E6', '#FB7185', '#9F1239'], violet: ['#E9DDFF', '#7C3AED', '#2E1065']
  };

  /* ---- faceted gem from any outline (light from the top-left) ---- */
  function ngon(n, rx, ry, rot, cx, cy) {
    var p = []; for (var i = 0; i < n; i++) { var a = (rot + i * 360 / n) * Math.PI / 180; p.push([cx + rx * Math.sin(a), cy - ry * Math.cos(a)]); }
    return p;
  }
  function heartPts() {
    var p = []; for (var i = 0; i < 16; i++) {
      var t = i / 16 * 2 * Math.PI, x = 16 * Math.pow(Math.sin(t), 3), y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      p.push([50 + x * 2.55, 47 - y * 2.55]);
    }
    return p;
  }
  var SHAPES = {
    oct: function () { return ngon(8, 42, 42, 22.5, 50, 50); }, hex: function () { return ngon(6, 44, 42, 0, 50, 50); },
    sq: function () { return ngon(4, 46, 46, 0, 50, 50); }, rect: function () { return ngon(8, 40, 46, 22.5, 50, 50); },
    tri: function () { return ngon(3, 50, 48, 180, 50, 42); }, oval: function () { return ngon(10, 34, 45, 0, 50, 50); },
    round: function () { return ngon(12, 43, 43, 15, 50, 50); }, heart: heartPts, pent: function () { return ngon(5, 45, 45, 0, 50, 53); },
    cush: function () { return ngon(8, 44, 40, 22.5, 50, 50); }
  };
  function gem(B, shape, c) {
    var o = SHAPES[shape](), n = o.length, cx = 0, cy = 0;
    o.forEach(function (q) { cx += q[0] / n; cy += q[1] / n; });
    var tb = shape === 'tri' ? 0.42 : shape === 'heart' ? 0.45 : 0.55;
    var I = o.map(function (q) { return [cx + (q[0] - cx) * tb, cy - 3 + (q[1] - cy) * tb]; });
    var s = '<polygon points="' + o.map(function (q) { return f1(q[0]) + ',' + f1(q[1] + 3); }).join(' ') + '" fill="#000" opacity=".28"/>';
    for (var i = 0; i < n; i++) {
      var j = (i + 1) % n, mx = (o[i][0] + o[j][0]) / 2 - cx, my = (o[i][1] + o[j][1]) / 2 - cy, l = Math.sqrt(mx * mx + my * my) || 1;
      var t = 0.5 + 0.5 * ((mx / l) * 0.6 + (my / l) * 0.8), fill = t < 0.5 ? mix(c[0], c[1], t * 2) : mix(c[1], c[2], (t - 0.5) * 2);
      s += '<polygon points="' + [o[i], o[j], I[j], I[i]].map(function (q) { return f1(q[0]) + ',' + f1(q[1]); }).join(' ') + '" fill="' + fill + '"/>';
    }
    s += '<polygon points="' + I.map(function (q) { return f1(q[0]) + ',' + f1(q[1]); }).join(' ') + '" fill="' + B.rg([c[0], c[1], mix(c[1], c[2], 0.35)], '35%', '30%', '80%') + '"/>';
    s += '<polygon points="' + o.map(function (q) { return f1(q[0]) + ',' + f1(q[1]); }).join(' ') + '" fill="none" stroke="' + mix(c[2], '#000000', 0.25) + '" stroke-width="2.4" stroke-linejoin="round"/>';
    s += '<polygon points="' + I.map(function (q) { return f1(q[0]) + ',' + f1(q[1]); }).join(' ') + '" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.2"/>';
    var a = I[Math.floor(n * 0.8) % n], b2 = I[Math.floor(n * 0.95) % n];
    return s + '<path d="M' + f1(a[0] + 4) + ' ' + f1(a[1] + 3) + 'L' + f1(b2[0] + 2) + ' ' + f1(b2[1] + 5) + '" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".8"/>' + spark(f1(cx - 14), f1(cy - 16), 7);
  }
  /* classic side-view diamond */
  function diamond(B, c) {
    var g = B.lg([c[0], c[1], c[2]], 'd');
    return '<path d="M8 38L28 14h44l20 24-42 50z" fill="#000" opacity=".25" transform="translate(0 3)"/>' +
      '<path d="M8 38L28 14h44l20 24-42 50z" fill="' + g + '" stroke="' + mix(c[2], '#000000', 0.3) + '" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<path d="M8 38h84L50 88z" fill="' + mix(c[1], c[2], 0.25) + '"/><path d="M8 38l42 50 -16-50z" fill="' + mix(c[1], c[2], 0.55) + '"/><path d="M92 38L50 88l16-50z" fill="' + mix(c[0], c[1], 0.4) + '"/>' +
      '<path d="M28 14l6 24 16-24 16 24 6-24M34 38l16 50 16-50" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M28 14h44l20 24H8z" fill="#fff" opacity=".18"/><path d="M33 19l-6 10" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>' + spark(70, 22, 8) + spark(24, 60, 4, 0.8);
  }
  /* coin with an emblem */
  function coin(B, c, emb) {
    return '<circle cx="50" cy="53" r="41" fill="#000" opacity=".25"/><circle cx="50" cy="50" r="41" fill="' + B.lg([c[0], c[1], c[2]]) + '"/>' +
      '<circle cx="50" cy="50" r="41" fill="none" stroke="' + mix(c[2], '#000000', 0.3) + '" stroke-width="2.4"/>' +
      '<circle cx="50" cy="50" r="32" fill="' + B.rg([c[0], c[1], mix(c[1], c[2], 0.5)], '40%', '35%', '75%') + '" stroke="' + c[2] + '" stroke-width="2.2"/>' +
      (emb || '') + '<path d="M20 36a33 33 0 0 1 22-22" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".7"/>' + spark(74, 24, 6);
  }
  /* royal letters (A K Q J 10), engraved look */
  function royal(B, ch, c) {
    var g = B.lg([c[0], c[1], c[2]]), sz = ch.length > 1 ? 54 : 72;
    return '<text x="50" y="' + (ch.length > 1 ? 70 : 77) + '" text-anchor="middle" font-family="Georgia,\'Times New Roman\',serif" font-weight="900" font-size="' + sz + '" fill="#000" opacity=".3" transform="translate(0 3)">' + ch + '</text>' +
      '<text x="50" y="' + (ch.length > 1 ? 70 : 77) + '" text-anchor="middle" font-family="Georgia,\'Times New Roman\',serif" font-weight="900" font-size="' + sz + '" fill="' + g + '" stroke="' + mix(c[2], '#000000', 0.45) + '" stroke-width="3" paint-order="stroke" stroke-linejoin="round">' + ch + '</text>' +
      spark(74, 26, 6, 0.9);
  }
  function seven(B, c, edge) {
    return '<path d="M18 14h66v16L52 90H29l33-58H18z" fill="#000" opacity=".28" transform="translate(0 3)"/>' +
      '<path d="M18 14h66v16L52 90H29l33-58H18z" fill="' + B.lg([c[0], c[1], c[2]]) + '" stroke="' + B.lg(edge || PALS.gold) + '" stroke-width="5" stroke-linejoin="round"/>' +
      '<path d="M25 20h50" stroke="#fff" stroke-opacity=".55" stroke-width="3.5" stroke-linecap="round"/>';
  }
  function bar(B, c) {
    return '<rect x="8" y="30" width="84" height="42" rx="9" fill="#000" opacity=".3" transform="translate(0 3)"/><rect x="8" y="30" width="84" height="42" rx="9" fill="' + B.lg(['#3A3A4A', '#111118']) + '" stroke="' + B.lg(PALS.gold) + '" stroke-width="4"/>' +
      '<text x="50" y="62" text-anchor="middle" font-family="Impact,\'Arial Black\',sans-serif" font-weight="900" font-size="28" letter-spacing="2" fill="' + B.lg([c[0], c[1], c[2]]) + '">BAR</text><path d="M15 36h70" stroke="#fff" stroke-opacity=".35" stroke-width="2.5" stroke-linecap="round"/>';
  }
  function bell(B) {
    return '<path d="M50 12c-18 0-27 14-27 32v14l-9 12h72l-9-12V44c0-18-9-32-27-32z" fill="' + B.lg(PALS.gold) + '" stroke="#92400E" stroke-width="3" stroke-linejoin="round"/><circle cx="50" cy="80" r="9" fill="#B45309"/><circle cx="50" cy="10" r="5" fill="#B45309"/>' +
      '<path d="M34 30c3-7 8-10 14-11" stroke="#fff" stroke-opacity=".75" stroke-width="4" stroke-linecap="round" fill="none"/><rect x="18" y="62" width="64" height="8" rx="3" fill="#B45309" opacity=".55"/>';
  }
  function star(B, c) {
    return '<path d="M50 6l12 28 30 3-23 20 7 30-26-16-26 16 7-30-23-20 30-3z" fill="' + B.rg([c[0], c[1], c[2]], '45%', '40%', '65%') + '" stroke="' + mix(c[2], '#000000', 0.3) + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M50 14l-6 18" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>' + gloss(41, 38, 6, 4, -30, 0.5);
  }
  /* ---- fruits ---- */
  function cherry(B) {
    var g = B.rg(['#FFB4BC', '#E5122A', '#6E0614']);
    return '<path d="M30 60C36 40 50 22 66 12M72 62C70 42 68 26 66 12" fill="none" stroke="#3F6212" stroke-width="5" stroke-linecap="round"/><path d="M66 12c8-6 20-5 26 2-9 6-19 6-26-2z" fill="#4ADE80" stroke="#166534" stroke-width="2"/>' +
      '<circle cx="30" cy="68" r="20" fill="' + g + '" stroke="#6E0614" stroke-width="2"/><circle cx="72" cy="70" r="20" fill="' + g + '" stroke="#6E0614" stroke-width="2"/>' + gloss(23, 61, 6, 4, -20, 0.75) + gloss(65, 63, 6, 4, -20, 0.75);
  }
  function lemon(B) {
    return '<path d="M10 52C10 30 29 18 50 18s40 12 40 34-19 32-40 32S10 74 10 52z" fill="' + B.rg(['#FFFBD1', '#FDE047', '#B7791F']) + '" stroke="#A16207" stroke-width="2.5"/><path d="M8 52l-5 2 5 3M92 52l5-2-5-3" fill="#CA8A04"/>' +
      '<path d="M50 18c4-8 12-11 18-9-3 7-10 10-18 9z" fill="#4ADE80" stroke="#166534" stroke-width="2"/>' + gloss(34, 37, 11, 5, -20);
  }
  function orange(B) {
    return '<circle cx="50" cy="55" r="36" fill="' + B.rg(['#FFE3B3', '#FB923C', '#C2410C'], '36%', '32%', '75%') + '" stroke="#9A3412" stroke-width="2.5"/>' +
      '<path d="M50 20c-2-8 3-12 8-13M52 19c8-8 20-8 26-2-8 7-18 7-26 2z" fill="#22C55E" stroke="#166534" stroke-width="2"/>' +
      '<g fill="#C2410C" opacity=".35"><circle cx="62" cy="48" r="1.6"/><circle cx="70" cy="60" r="1.6"/><circle cx="56" cy="70" r="1.6"/><circle cx="40" cy="72" r="1.6"/><circle cx="74" cy="44" r="1.6"/></g>' + gloss(36, 40, 10, 6, -30);
  }
  function plum(B) {
    return '<path d="M50 22c22 0 38 14 38 34S72 88 50 88 12 76 12 56s16-34 38-34z" fill="' + B.rg(['#E9D5FF', '#9333EA', '#3B0764']) + '" stroke="#3B0764" stroke-width="2.5"/>' +
      '<path d="M50 24c-6 20-6 44 2 62" stroke="#3B0764" stroke-width="2" fill="none" opacity=".45"/><path d="M50 24c0-8 4-14 10-16M54 18c8-6 20-4 24 2-9 5-17 5-24-2z" fill="#4ADE80" stroke="#166534" stroke-width="2"/>' + gloss(32, 44, 9, 6, -30, 0.6);
  }
  function grape(B) {
    var g = B.rg(['#DDD6FE', '#7C3AED', '#2E1065']), s = '<path d="M50 20V8" stroke="#713F12" stroke-width="5" stroke-linecap="round"/><path d="M52 14c10-8 24-6 30 2-11 6-22 5-30-2z" fill="#4ADE80" stroke="#166534" stroke-width="2"/>';
    [[34, 30], [50, 28], [66, 30], [26, 46], [42, 45], [58, 45], [74, 46], [34, 61], [50, 61], [66, 61], [42, 76], [58, 76], [50, 89]].forEach(function (q) {
      s += '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="10.5" fill="' + g + '" stroke="#2E1065" stroke-width="1.6"/><circle cx="' + (q[0] - 3.5) + '" cy="' + (q[1] - 3.5) + '" r="2.8" fill="#fff" opacity=".6"/>';
    });
    return s;
  }
  function melon(B) {
    return '<path d="M6 40a44 44 0 0 0 88 0z" fill="#15803D"/><path d="M11 40a39 39 0 0 0 78 0z" fill="#ECFCCB"/><path d="M15 40a35 35 0 0 0 70 0z" fill="' + B.lg(['#FB7185', '#E11D48']) + '"/>' +
      '<path d="M6 40h88" stroke="#14532D" stroke-width="3" stroke-linecap="round"/><g fill="#1F2937"><ellipse cx="32" cy="52" rx="2.4" ry="4"/><ellipse cx="50" cy="60" rx="2.4" ry="4"/><ellipse cx="68" cy="52" rx="2.4" ry="4"/><ellipse cx="42" cy="68" rx="2.4" ry="4"/><ellipse cx="58" cy="68" rx="2.4" ry="4"/></g>' +
      '<path d="M22 46c4 8 10 14 18 18" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".45" fill="none"/>';
  }
  function strawberry(B) {
    var s = '<path d="M50 92C26 76 12 58 14 40c2-14 16-20 36-14 20-6 34 0 36 14 2 18-12 36-36 52z" fill="' + B.rg(['#FFC4C4', '#EF4444', '#7F1D1D'], '40%', '35%', '75%') + '" stroke="#7F1D1D" stroke-width="2.5"/>';
    [[30, 44], [44, 40], [58, 40], [72, 44], [36, 56], [50, 54], [64, 56], [42, 68], [58, 68], [50, 80], [24, 52], [76, 52]].forEach(function (q) { s += '<ellipse cx="' + q[0] + '" cy="' + q[1] + '" rx="1.8" ry="2.8" fill="#FDE68A"/>'; });
    return s + '<path d="M50 28L36 16l4 12-14-2 14 8 10-2 10 2 14-8-14 2 4-12z" fill="#22C55E" stroke="#166534" stroke-width="2" stroke-linejoin="round"/><path d="M50 26V10" stroke="#166534" stroke-width="4" stroke-linecap="round"/>' + gloss(30, 46, 7, 4, -40, 0.5);
  }
  function apple(B, c) {
    c = c || ['#FFC2C2', '#DC2626', '#7F1D1D'];
    return '<path d="M50 28c-8-8-28-8-34 8s6 48 22 50c5 1 8-2 12-2s7 3 12 2c16-2 28-34 22-50s-26-16-34-8z" fill="' + B.rg(c, '35%', '30%', '80%') + '" stroke="' + c[2] + '" stroke-width="2.5"/>' +
      '<path d="M50 28c0-8 3-14 9-18" stroke="#78350F" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M55 18c8-7 18-7 22-2-6 7-15 8-22 2z" fill="#4ADE80" stroke="#166534" stroke-width="2"/>' + gloss(30, 44, 6, 10, 20, 0.55);
  }
  /* ---- candies ---- */
  function wrapped(B, c) {
    var g = B.rg([c[0], c[1], c[2]], '40%', '35%', '70%');
    return '<path d="M30 50L6 30l6 20-6 20zM70 50l24-20-6 20 6 20z" fill="' + B.lg([c[0], c[1]], 'h') + '" stroke="' + c[2] + '" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<ellipse cx="50" cy="50" rx="26" ry="22" fill="' + g + '" stroke="' + c[2] + '" stroke-width="2.6"/><path d="M36 34c-6 10-6 22 0 32M50 28v44M64 34c6 10 6 22 0 32" stroke="#fff" stroke-width="4" opacity=".5" fill="none"/>' + gloss(40, 38, 8, 4, -25, 0.8);
  }
  function lolli(B, c) {
    return '<path d="M50 60v34" stroke="#F1F5F9" stroke-width="7" stroke-linecap="round"/><circle cx="50" cy="42" r="34" fill="' + B.rg([c[0], c[1], c[2]]) + '" stroke="' + c[2] + '" stroke-width="2.6"/>' +
      '<path d="M50 42m-4 0a4 4 0 1 1 8 0a10 10 0 1 1-20 0a16 16 0 1 1 32 0a22 22 0 1 1-44 0a28 28 0 1 1 56 0" fill="none" stroke="#fff" stroke-width="5" opacity=".8" stroke-linecap="round"/>' + gloss(36, 26, 8, 4, -30, 0.8);
  }
  function hcandy(B, c) {
    var h = heartPts().map(function (q) { return f1(q[0]) + ',' + f1(q[1] + 4); }).join(' ');
    return '<polygon points="' + h + '" fill="' + B.rg([c[0], c[1], c[2]], '40%', '35%', '70%') + '" stroke="' + c[2] + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M30 30c-6 4-8 12-6 18" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".75"/>' + spark(66, 30, 6);
  }
  function gummy(B, c) {
    return '<rect x="14" y="16" width="72" height="72" rx="20" fill="' + B.rg([c[0], c[1], c[2]], '35%', '30%', '80%') + '" stroke="' + c[2] + '" stroke-width="2.6"/>' +
      '<rect x="24" y="26" width="52" height="52" rx="14" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="2.4" stroke-dasharray="4 6"/>' + gloss(34, 30, 10, 5, -20, 0.7) + spark(70, 70, 5, 0.7);
  }
  function bomb(B) {
    return '<circle cx="50" cy="56" r="34" fill="' + B.rg(['#FFFFFF', '#F472B6', '#A855F7', '#3B82F6', '#1E1B4B'], '38%', '32%', '78%') + '" stroke="#1E1B4B" stroke-width="2.5"/>' +
      '<path d="M26 44a26 26 0 0 1 48 0" stroke="#FDE047" stroke-width="5" fill="none" opacity=".75"/><path d="M22 58a28 28 0 0 0 56 0" stroke="#4ADE80" stroke-width="5" fill="none" opacity=".6"/>' +
      '<path d="M64 26l8-10" stroke="#78350F" stroke-width="5" stroke-linecap="round"/><circle cx="74" cy="13" r="7" fill="#FDE047"/><circle cx="74" cy="13" r="3" fill="#fff"/>' + gloss(38, 40, 9, 5, -30, 0.7);
  }
  function orb(B, c) {
    return '<circle cx="50" cy="50" r="44" fill="' + B.rg([c[1] + '@.7', c[1] + '@0'], '50%', '50%', '50%') + '"/><circle cx="50" cy="50" r="33" fill="' + B.rg(['#FFFFFF', c[0], c[1], c[2]], '40%', '34%', '72%') + '" stroke="' + c[0] + '" stroke-width="2"/>' +
      '<path d="M28 40a24 24 0 0 1 18-16" stroke="#fff" stroke-width="4.5" stroke-linecap="round" fill="none" opacity=".85"/>' + spark(76, 20, 7) + spark(20, 78, 4, 0.8);
  }
  /* ---- objects ---- */
  function crown(B) {
    return '<path d="M12 70L8 28l22 18 20-30 20 30 22-18-4 42z" fill="' + B.lg(PALS.gold) + '" stroke="#78350F" stroke-width="3" stroke-linejoin="round"/>' +
      '<rect x="10" y="68" width="80" height="14" rx="4" fill="' + B.lg(['#FDE68A', '#D97706', '#92400E']) + '" stroke="#78350F" stroke-width="3"/>' +
      '<circle cx="50" cy="56" r="7" fill="' + B.rg(PALS.red) + '" stroke="#7F1D1D" stroke-width="2"/><circle cx="28" cy="60" r="4.5" fill="' + B.rg(PALS.blue) + '"/><circle cx="72" cy="60" r="4.5" fill="' + B.rg(PALS.green) + '"/>' +
      '<circle cx="8" cy="26" r="5" fill="#FDE68A"/><circle cx="50" cy="14" r="5.5" fill="#FDE68A"/><circle cx="92" cy="26" r="5" fill="#FDE68A"/><path d="M20 72h60" stroke="#fff" stroke-opacity=".5" stroke-width="2.5"/>';
  }
  function chalice(B) {
    return '<path d="M18 16h64c0 26-12 40-32 42C30 56 18 42 18 16z" fill="' + B.lg(PALS.gold, 'h') + '" stroke="#78350F" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M44 56h12v18H44z" fill="' + B.lg(PALS.gold, 'h') + '" stroke="#78350F" stroke-width="2.5"/><path d="M26 88c0-10 10-14 24-14s24 4 24 14z" fill="' + B.lg(PALS.gold) + '" stroke="#78350F" stroke-width="3" stroke-linejoin="round"/>' +
      '<ellipse cx="50" cy="17" rx="32" ry="5" fill="#92400E" stroke="#78350F" stroke-width="2"/><circle cx="50" cy="34" r="7" fill="' + B.rg(PALS.green) + '" stroke="#064E3B" stroke-width="2"/><circle cx="32" cy="30" r="3.5" fill="#E11D48"/><circle cx="68" cy="30" r="3.5" fill="#2563EB"/>' +
      '<path d="M26 22c1 10 4 18 9 24" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".6" fill="none"/>';
  }
  function ring(B) {
    return '<ellipse cx="50" cy="64" rx="30" ry="26" fill="none" stroke="#7A4A06" stroke-width="13"/><ellipse cx="50" cy="64" rx="30" ry="26" fill="none" stroke="' + B.lg(PALS.gold) + '" stroke-width="9"/>' +
      '<path d="M26 54a28 24 0 0 1 14-14" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7" fill="none"/>' + '<g transform="translate(26 -2) scale(.48)">' + gem(B, 'oct', PALS.purple) + '</g>';
  }
  function hourglass(B) {
    return '<rect x="20" y="8" width="60" height="10" rx="4" fill="' + B.lg(PALS.gold) + '" stroke="#78350F" stroke-width="2.5"/><rect x="20" y="82" width="60" height="10" rx="4" fill="' + B.lg(PALS.gold) + '" stroke="#78350F" stroke-width="2.5"/>' +
      '<path d="M28 18h44c0 18-16 24-16 32s16 14 16 32H28c0-18 16-24 16-32S28 36 28 18z" fill="' + B.lg(['#E0F2FE@.9', '#7DD3FC@.5']) + '" stroke="#0C4A6E" stroke-width="2.5"/>' +
      '<path d="M36 30h28c-4 8-12 12-14 16-2-4-10-8-14-16zM34 80c2-10 12-14 16-16 4 2 14 6 16 16z" fill="' + B.lg(['#FDE68A', '#F59E0B']) + '"/><path d="M50 48v20" stroke="#F59E0B" stroke-width="2"/>' +
      '<path d="M33 22c2 8 6 12 10 16" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7" fill="none"/>';
  }
  function planet(B, c, rc) {
    return '<ellipse cx="50" cy="54" rx="46" ry="14" fill="none" stroke="' + (rc || '#FDE68A') + '" stroke-width="5" opacity=".75" transform="rotate(-18 50 54)"/>' +
      '<circle cx="50" cy="50" r="30" fill="' + B.rg([c[0], c[1], c[2]], '36%', '30%', '78%') + '" stroke="' + c[2] + '" stroke-width="2"/>' +
      '<path d="M24 44c16 6 36 6 52-2M22 56c18 6 40 6 56-2" stroke="' + c[0] + '" stroke-width="3" opacity=".45" fill="none"/>' +
      '<path d="M8 66a46 14-18 0 0 84-26" fill="none" stroke="' + (rc || '#FDE68A') + '" stroke-width="5" transform="rotate(-2 50 54)"/>' + gloss(38, 34, 8, 5, -30, 0.6) + spark(84, 16, 6);
  }
  function book(B) {
    return '<path d="M14 22l34-8 38 8v64l-38-8-34 8z" fill="#3B0764" transform="translate(0 4)" opacity=".4"/>' +
      '<path d="M18 18h60a6 6 0 0 1 6 6v58a6 6 0 0 1-6 6H18z" fill="' + B.lg(['#7C2D12', '#451A03']) + '" stroke="#FBBF24" stroke-width="3"/>' +
      '<path d="M84 26v56l-6 6V22z" fill="#FEF3C7"/><path d="M80 28v52M82 28v52" stroke="#D6B98C" stroke-width="1"/>' +
      '<rect x="24" y="24" width="50" height="58" rx="3" fill="none" stroke="#FBBF24" stroke-width="2" stroke-dasharray="3 3" opacity=".7"/>' +
      '<path d="M49 32l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill="' + B.lg(PALS.gold) + '" stroke="#78350F" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<circle cx="49" cy="70" r="4" fill="#22D3EE"/><path d="M22 22v62" stroke="#fff" stroke-opacity=".3" stroke-width="2"/>' + spark(80, 16, 7);
  }
  function astro(B) {
    return '<path d="M20 92c0-16 12-24 30-24s30 8 30 24z" fill="' + B.lg(['#F8FAFC', '#94A3B8']) + '" stroke="#475569" stroke-width="2.5"/>' +
      '<circle cx="50" cy="44" r="34" fill="' + B.rg(['#FFFFFF', '#E2E8F0', '#64748B']) + '" stroke="#475569" stroke-width="2.5"/>' +
      '<rect x="26" y="28" width="48" height="34" rx="16" fill="' + B.lg(['#1E3A8A', '#0F172A']) + '" stroke="#FBBF24" stroke-width="3"/>' +
      '<path d="M32 36c6-4 14-5 22-4" stroke="#7DD3FC" stroke-width="4" stroke-linecap="round" opacity=".85" fill="none"/><circle cx="62" cy="50" r="3" fill="#C4B5FD" opacity=".7"/><rect x="40" y="76" width="20" height="8" rx="2" fill="#E11D48"/>';
  }
  function alien(B) {
    return '<path d="M50 10C26 10 14 28 14 44c0 22 18 44 36 46 18-2 36-24 36-46 0-16-12-34-36-34z" fill="' + B.rg(['#ECFCCB', '#84CC16', '#365314']) + '" stroke="#1A2E05" stroke-width="2.5"/>' +
      '<path d="M22 44c4-8 14-10 22-4 2 8-4 16-12 16-8 0-12-6-10-12zM78 44c-4-8-14-10-22-4-2 8 4 16 12 16 8 0 12-6 10-12z" fill="#0F172A"/>' +
      '<ellipse cx="32" cy="45" rx="4" ry="2.5" fill="#fff" opacity=".7"/><ellipse cx="68" cy="45" rx="4" ry="2.5" fill="#fff" opacity=".7"/><path d="M44 72c4 2 8 2 12 0" stroke="#1A2E05" stroke-width="2.5" stroke-linecap="round" fill="none"/>' +
      '<path d="M30 10c-4-6-2-8 0-8M70 10c4-6 2-8 0-8" stroke="#FBBF24" stroke-width="3" fill="none"/>' + gloss(34, 24, 9, 5, -25, 0.5);
  }
  function pharaoh(B) {
    return '<path d="M50 6C30 6 18 18 16 34L8 92h84l-8-58C82 18 70 6 50 6z" fill="' + B.lg(['#60A5FA', '#1D4ED8', '#172554']) + '" stroke="#78350F" stroke-width="2.5"/>' +
      '<path d="M18 40h64M14 56h72M12 72h76M10 86h80M22 26h56" stroke="' + B.lg(PALS.gold, 'h') + '" stroke-width="6"/>' +
      '<path d="M32 30c0-10 8-16 18-16s18 6 18 16v26c0 12-8 20-18 20s-18-8-18-20z" fill="' + B.lg(PALS.gold) + '" stroke="#78350F" stroke-width="2.5"/>' +
      '<path d="M37 38h10M53 38h10" stroke="#1E1B4B" stroke-width="3.4" stroke-linecap="round"/><path d="M36 37c3 3 8 3 11 0M53 37c3 3 8 3 11 0" stroke="#1E1B4B" stroke-width="1.4" fill="none"/>' +
      '<path d="M46 62h8M50 44v12" stroke="#92400E" stroke-width="2.5" stroke-linecap="round"/><path d="M45 76h10l-2 16h-6z" fill="' + B.lg(PALS.gold) + '" stroke="#78350F" stroke-width="2"/>' +
      '<path d="M44 14c3-4 9-4 12 0l-6 8z" fill="#E11D48" stroke="#78350F" stroke-width="1.5"/>' + gloss(40, 24, 6, 3, -20, 0.6);
  }
  function horus(B) {
    return '<path d="M8 44C24 22 74 20 92 40 74 58 28 60 8 44z" fill="' + B.lg(['#FFFFFF', '#E2E8F0']) + '" stroke="#1E3A8A" stroke-width="5" stroke-linejoin="round"/>' +
      '<circle cx="50" cy="42" r="14" fill="' + B.rg(['#93C5FD', '#1D4ED8', '#0B1B4D']) + '"/><circle cx="50" cy="42" r="6" fill="#0B1020"/><circle cx="45" cy="37" r="3" fill="#fff"/>' +
      '<path d="M10 22C30 10 70 10 90 22" stroke="#1E3A8A" stroke-width="6" stroke-linecap="round" fill="none"/>' +
      '<path d="M42 56c-4 12-10 22-6 30 4 6 12 4 12-2M58 58l18 26" stroke="' + B.lg(PALS.gold, 'h') + '" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M42 56c-4 12-10 22-6 30 4 6 12 4 12-2M58 58l18 26" stroke="#78350F" stroke-width="1.4" fill="none" opacity=".6"/>';
  }
  function scarab(B) {
    return '<path d="M30 30L14 16M70 30l16-14M26 56H8M74 56h18M30 76L16 90M70 76l14 14" stroke="#78350F" stroke-width="5" stroke-linecap="round"/>' +
      '<ellipse cx="50" cy="24" rx="14" ry="10" fill="' + B.rg(PALS.gold) + '" stroke="#78350F" stroke-width="2.5"/>' +
      '<path d="M50 32c-20 0-28 14-28 30s12 28 28 28 28-12 28-28-8-30-28-30z" fill="' + B.rg(['#99F6E4', '#0D9488', '#042F2E'], '40%', '30%', '75%') + '" stroke="#042F2E" stroke-width="2.5"/>' +
      '<path d="M50 34v54" stroke="#042F2E" stroke-width="2.5"/><path d="M50 40c-10 0-18 6-20 16M50 40c10 0 18 6 20 16" stroke="#FDE68A" stroke-width="2.5" fill="none"/>' + gloss(38, 48, 5, 9, 20, 0.5) + '<circle cx="50" cy="20" r="3" fill="#E11D48"/>';
  }
  function ankh(B) {
    var g = B.lg(PALS.gold, 'h');
    return '<path d="M50 8c-14 0-22 10-22 22 0 10 6 18 14 24H14v14h29v24h14V68h29V54H58c8-6 14-14 14-24 0-12-8-22-22-22zm0 14c6 0 9 4 9 9 0 7-4 13-9 17-5-4-9-10-9-17 0-5 3-9 9-9z" fill="' + g + '" stroke="#78350F" stroke-width="3" stroke-linejoin="round"/>' +
      '<circle cx="50" cy="61" r="4" fill="' + B.rg(PALS.red) + '"/><path d="M32 22c2-6 6-9 12-10" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7" fill="none"/>';
  }
  function badge(B) {
    var p = ngon(12, 44, 44, 0, 50, 50).map(function (q, i) { return i % 2 ? [50 + (q[0] - 50) * 0.55, 50 + (q[1] - 50) * 0.55] : q; });
    var pts = p.map(function (q) { return f1(q[0]) + ',' + f1(q[1]); }).join(' '), balls = '';
    p.forEach(function (q, i) { if (!(i % 2)) balls += '<circle cx="' + f1(q[0]) + '" cy="' + f1(q[1]) + '" r="5.5" fill="' + B.rg(PALS.gold) + '" stroke="#78350F" stroke-width="1.6"/>'; });
    return '<polygon points="' + pts + '" fill="' + B.lg(PALS.gold, 'd') + '" stroke="#78350F" stroke-width="3" stroke-linejoin="round"/>' + balls +
      '<circle cx="50" cy="50" r="17" fill="' + B.rg(['#FFF7CF', '#D97706', '#78350F']) + '" stroke="#78350F" stroke-width="2"/><path d="M50 40l3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1z" fill="#FFF7CF"/>' + spark(26, 28, 6);
  }
  function hat(B, c) {
    c = c || ['#F0C48A', '#B8642A', '#4A2511'];
    return '<path d="M6 66c10 14 78 14 88 0-6 12-82 12-88 0z" fill="#000" opacity=".3" transform="translate(0 4)"/>' +
      '<path d="M28 60c-2-18 0-40 8-44 6-2 10 4 14 4s8-6 14-4c8 4 10 26 8 44z" fill="' + B.lg([c[0], c[1], c[2]]) + '" stroke="' + c[2] + '" stroke-width="2.5"/>' +
      '<path d="M4 58c12 18 80 18 92 0 0 10-20 18-46 18S4 68 4 58z" fill="' + B.lg([c[0], c[1]]) + '" stroke="' + c[2] + '" stroke-width="2.5"/>' +
      '<path d="M29 52c14 4 28 4 42 0v8c-14 4-28 4-42 0z" fill="#7F1D1D"/><circle cx="62" cy="56" r="3.5" fill="#FBBF24"/><path d="M36 24c-3 8-4 18-3 26" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".45" fill="none"/>';
  }
  function shoe(B) {
    return '<path d="M24 14C10 30 8 58 22 76c8 10 20 14 28 14s20-4 28-14c14-18 12-46-2-62l-12 8c8 12 10 30 2 42-4 6-10 10-16 10s-12-4-16-10c-8-12-6-30 2-42z" fill="' + B.lg(['#F1F5F9', '#94A3B8', '#475569'], 'h') + '" stroke="#1E293B" stroke-width="3" stroke-linejoin="round"/>' +
      '<g fill="#1E293B"><circle cx="20" cy="40" r="2.6"/><circle cx="22" cy="58" r="2.6"/><circle cx="32" cy="74" r="2.6"/><circle cx="80" cy="40" r="2.6"/><circle cx="78" cy="58" r="2.6"/><circle cx="68" cy="74" r="2.6"/></g>' +
      '<path d="M20 28c-4 10-4 22 0 32" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7" fill="none"/>' + spark(84, 14, 6);
  }
  function cactus(B) {
    var g = B.lg(['#86EFAC', '#16A34A', '#14532D'], 'h');
    return '<path d="M40 94V20c0-8 4-12 10-12s10 4 10 12v74z" fill="' + g + '" stroke="#14532D" stroke-width="2.5"/>' +
      '<path d="M40 60H26c-6 0-10-4-10-10V32c0-4 2-6 5-6s5 2 5 6v16h14M60 50h14V28c0-4 2-6 5-6s5 2 5 6v24c0 6-4 10-10 10H60" fill="' + g + '" stroke="#14532D" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M46 24v66M54 24v66" stroke="#14532D" stroke-width="1.4" opacity=".5"/><circle cx="50" cy="10" r="5" fill="#F472B6"/><path d="M44 18c-1 8-1 18 0 26" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".5"/>' +
      '<path d="M30 94h40" stroke="#B45309" stroke-width="6" stroke-linecap="round"/>';
  }
  function sunmask(B) {
    var rays = '';
    for (var i = 0; i < 12; i++) { var a = i * 30 * Math.PI / 180, x1 = 50 + 30 * Math.sin(a), y1 = 50 - 30 * Math.cos(a), x2 = 50 + 46 * Math.sin(a), y2 = 50 - 46 * Math.cos(a), x3 = 50 + 30 * Math.sin(a + 0.26), y3 = 50 - 30 * Math.cos(a + 0.26); rays += f1(x1) + ',' + f1(y1) + ' ' + f1(x2) + ',' + f1(y2) + ' ' + f1(x3) + ',' + f1(y3) + ' '; }
    return '<polygon points="' + rays + '" fill="' + B.lg(['#FDE68A', '#EA580C']) + '" stroke="#7C2D12" stroke-width="2"/>' +
      '<circle cx="50" cy="50" r="31" fill="' + B.rg(PALS.gold) + '" stroke="#78350F" stroke-width="3"/>' +
      '<path d="M34 44h10M56 44h10" stroke="#78350F" stroke-width="5" stroke-linecap="round"/><circle cx="39" cy="44" r="2.4" fill="#0F766E"/><circle cx="61" cy="44" r="2.4" fill="#0F766E"/>' +
      '<path d="M50 46v12h-4M38 66c8 6 16 6 24 0" stroke="#78350F" stroke-width="3.5" stroke-linecap="round" fill="none"/><path d="M26 50h6M68 50h6" stroke="#E11D48" stroke-width="4" stroke-linecap="round"/>' + gloss(38, 32, 8, 4, -25, 0.6);
  }
  function jademask(B) {
    return '<path d="M20 14h60l6 30-8 46H22l-8-46z" fill="' + B.lg(['#A7F3D0', '#059669', '#064E3B'], 'd') + '" stroke="#022C22" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M26 40h18v8H26zM56 40h18v8H56z" fill="#FDE68A" stroke="#022C22" stroke-width="2"/><circle cx="35" cy="44" r="3" fill="#022C22"/><circle cx="65" cy="44" r="3" fill="#022C22"/>' +
      '<path d="M46 50l-4 14h16l-4-14M34 74h32v8H34z" fill="#047857" stroke="#022C22" stroke-width="2.5" stroke-linejoin="round"/><path d="M38 74v8M46 74v8M54 74v8M62 74v8" stroke="#FDE68A" stroke-width="2"/>' +
      '<path d="M20 14L12 4M80 14l8-10M50 14V4" stroke="#FBBF24" stroke-width="5" stroke-linecap="round"/><path d="M26 20h48" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".5"/>';
  }
  function pyramid(B) {
    var s = '', g = B.lg(['#FDE68A', '#D97706', '#78350F']);
    for (var i = 0; i < 5; i++) { var w = 84 - i * 15, y = 84 - i * 14; s += '<rect x="' + f1(50 - w / 2) + '" y="' + y + '" width="' + w + '" height="14" fill="' + g + '" stroke="#78350F" stroke-width="2"/>'; }
    return '<ellipse cx="50" cy="96" rx="44" ry="4" fill="#000" opacity=".3"/>' + s + '<rect x="40" y="14" width="20" height="14" fill="#B91C1C" stroke="#78350F" stroke-width="2"/><path d="M44 28h12v70H44z" fill="#92400E" opacity=".55"/>' +
      '<path d="M44 28v70M56 28v70" stroke="#78350F" stroke-width="1.5"/><path d="M12 92h76" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>' + spark(78, 22, 7);
  }
  function chest(B) {
    return '<path d="M10 50h80v38H10z" fill="' + B.lg(['#A16207', '#713F12', '#3B1D06']) + '" stroke="#1C0F03" stroke-width="2.5"/>' +
      '<path d="M10 50c0-24 16-34 40-34s40 10 40 34z" fill="' + B.lg(['#B45309', '#78350F']) + '" stroke="#1C0F03" stroke-width="2.5"/>' +
      '<circle cx="34" cy="46" r="7" fill="' + B.rg(PALS.gold) + '"/><circle cx="52" cy="42" r="7" fill="' + B.rg(PALS.gold) + '"/><circle cx="66" cy="47" r="6" fill="' + B.rg(PALS.gold) + '"/>' +
      '<path d="M22 50V22M78 50V22M22 50v38M78 50v38" stroke="' + B.lg(PALS.gold, 'h') + '" stroke-width="7"/><path d="M8 50h84" stroke="' + B.lg(PALS.gold) + '" stroke-width="6"/>' +
      '<rect x="42" y="54" width="16" height="18" rx="3" fill="' + B.lg(PALS.gold) + '" stroke="#78350F" stroke-width="2"/><circle cx="50" cy="62" r="3" fill="#1C0F03"/>' + spark(40, 30, 7) + spark(74, 34, 4, 0.8);
  }
  function shell(B) {
    var ribs = '';
    for (var i = 0; i < 7; i++) { var a = (-60 + i * 20) * Math.PI / 180; ribs += 'M50 84L' + f1(50 + 44 * Math.sin(a)) + ' ' + f1(84 - 60 * Math.cos(a)) + ' '; }
    return '<path d="M50 84L8 54C10 26 28 14 50 14s40 12 42 40z" fill="' + B.lg(['#FFE4E6', '#FB7185', '#9F1239']) + '" stroke="#881337" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="' + ribs + '" stroke="#881337" stroke-width="2" opacity=".55" fill="none"/><path d="M40 84h20l-4 8H44z" fill="#FDA4AF" stroke="#881337" stroke-width="2"/>' +
      '<circle cx="50" cy="58" r="14" fill="' + B.rg(['#FFFFFF', '#F5F3FF', '#C4B5FD'], '35%', '30%', '75%') + '" stroke="#A78BFA" stroke-width="1.6"/>' + gloss(45, 53, 4, 3, -20, 0.9) + spark(80, 22, 6);
  }
  function fish(B) {
    return '<path d="M70 50l24-20v40z" fill="' + B.lg(['#FDBA74', '#EA580C']) + '" stroke="#7C2D12" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M8 50c10-20 30-28 48-26 12 2 18 14 18 26s-6 24-18 26C38 78 18 70 8 50z" fill="' + B.lg(['#FDE68A', '#F97316', '#9A3412']) + '" stroke="#7C2D12" stroke-width="2.5"/>' +
      '<path d="M44 26c4 16 4 32 0 48M56 26c4 16 4 32 0 48" stroke="#fff" stroke-width="5" opacity=".85" fill="none"/>' +
      '<circle cx="24" cy="44" r="6" fill="#fff"/><circle cx="23" cy="44" r="3" fill="#0F172A"/><path d="M40 22l10-12 8 14z" fill="#F97316" stroke="#7C2D12" stroke-width="2" stroke-linejoin="round"/>' + gloss(30, 34, 8, 3, -20, 0.6);
  }
  function starfish(B) {
    var p = ngon(10, 46, 46, 0, 50, 52).map(function (q, i) { return i % 2 ? [50 + (q[0] - 50) * 0.42, 52 + (q[1] - 52) * 0.42] : q; });
    var d = 'M' + p.map(function (q) { return f1(q[0]) + ' ' + f1(q[1]); }).join('L') + 'z', dots = '';
    for (var i = 0; i < 5; i++) { var a = i * 72 * Math.PI / 180; for (var k = 1; k <= 2; k++) dots += '<circle cx="' + f1(50 + 13 * k * Math.sin(a)) + '" cy="' + f1(52 - 13 * k * Math.cos(a)) + '" r="2.4" fill="#FFF7ED"/>'; }
    return '<path d="' + d + '" fill="' + B.rg(['#FED7AA', '#F97316', '#9A3412'], '45%', '40%', '65%') + '" stroke="#7C2D12" stroke-width="3" stroke-linejoin="round"/>' + dots + '<circle cx="50" cy="52" r="3" fill="#FFF7ED"/>';
  }
  function ingot(B) {
    return '<path d="M8 50c8 4 20 6 26 4 4-16 28-16 32 0 6 2 18 0 26-4-4 22-20 36-42 36S12 72 8 50z" fill="' + B.lg(PALS.gold) + '" stroke="#78350F" stroke-width="2.6" stroke-linejoin="round"/>' +
      '<ellipse cx="50" cy="50" rx="17" ry="13" fill="' + B.rg(['#FFFBEB', '#FBBF24', '#B45309']) + '" stroke="#78350F" stroke-width="2"/>' +
      '<path d="M18 62c8 10 20 16 32 16" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55" fill="none"/>' + spark(44, 44, 6) + spark(84, 34, 5, 0.8);
  }
  function lantern(B) {
    return '<path d="M50 4v10" stroke="#78350F" stroke-width="3"/><rect x="32" y="12" width="36" height="9" rx="3" fill="' + B.lg(PALS.gold) + '" stroke="#78350F" stroke-width="2"/>' +
      '<ellipse cx="50" cy="50" rx="34" ry="30" fill="' + B.rg(['#FECACA', '#DC2626', '#7F1D1D'], '40%', '40%', '70%') + '" stroke="#7F1D1D" stroke-width="2.5"/>' +
      '<path d="M50 20c-12 8-12 52 0 60M50 20c12 8 12 52 0 60M50 20c-28 8-28 52 0 60M50 20c28 8 28 52 0 60" stroke="#FBBF24" stroke-width="1.8" fill="none" opacity=".8"/>' +
      '<rect x="32" y="78" width="36" height="9" rx="3" fill="' + B.lg(PALS.gold) + '" stroke="#78350F" stroke-width="2"/><path d="M50 87v10M44 88v8M56 88v8" stroke="#FBBF24" stroke-width="2.5" stroke-linecap="round"/>' + gloss(36, 36, 6, 9, 20, 0.45);
  }
  function jadecoin(B) {
    return '<circle cx="50" cy="53" r="42" fill="#000" opacity=".25"/><circle cx="50" cy="50" r="42" fill="' + B.rg(['#D1FAE5', '#10B981', '#064E3B']) + '" stroke="#022C22" stroke-width="2.5"/>' +
      '<rect x="38" y="38" width="24" height="24" fill="#0B0620" stroke="#FBBF24" stroke-width="3"/><circle cx="50" cy="50" r="33" fill="none" stroke="#FBBF24" stroke-width="2" stroke-dasharray="6 5"/>' +
      '<path d="M22 34a32 32 0 0 1 18-16" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6" fill="none"/>';
  }
  function dragon(B) {
    return '<circle cx="50" cy="50" r="46" fill="' + B.rg(['#FECACA', '#DC2626', '#450A0A'], '45%', '40%', '65%') + '" stroke="#FBBF24" stroke-width="3"/>' +
      '<path d="M22 70c0-20 10-34 26-40 6-10 18-14 28-8l-6 6c8 2 12 8 12 14-8-4-14-2-18 2 4 6 2 16-6 20 2-6 0-10-4-12-4 8-14 14-24 14 6-4 8-8 8-12-6 4-10 10-16 16z" fill="' + B.lg(PALS.gold) + '" stroke="#78350F" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<path d="M48 30c-2-8-8-14-16-16 6 8 6 12 4 18M70 22c4-6 10-8 16-6-4 4-8 8-12 10" fill="' + B.lg(PALS.gold) + '" stroke="#78350F" stroke-width="2" stroke-linejoin="round"/>' +
      '<circle cx="66" cy="32" r="3" fill="#7F1D1D"/><path d="M78 40c6 4 10 10 8 18M60 50c8 6 6 16 2 22" stroke="#FDE68A" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '<circle cx="30" cy="30" r="7" fill="' + B.rg(['#FFFFFF', '#FDE68A', '#F59E0B']) + '"/>' + spark(80, 76, 6);
  }
  function panda(B) {
    return '<circle cx="22" cy="24" r="14" fill="#111827"/><circle cx="78" cy="24" r="14" fill="#111827"/>' +
      '<circle cx="50" cy="54" r="40" fill="' + B.rg(['#FFFFFF', '#F1F5F9', '#94A3B8']) + '" stroke="#334155" stroke-width="2.5"/>' +
      '<ellipse cx="34" cy="50" rx="11" ry="14" fill="#111827" transform="rotate(25 34 50)"/><ellipse cx="66" cy="50" rx="11" ry="14" fill="#111827" transform="rotate(-25 66 50)"/>' +
      '<circle cx="36" cy="48" r="4.5" fill="#fff"/><circle cx="64" cy="48" r="4.5" fill="#fff"/><circle cx="37" cy="49" r="2.4" fill="#111827"/><circle cx="63" cy="49" r="2.4" fill="#111827"/>' +
      '<ellipse cx="50" cy="66" rx="7" ry="5" fill="#111827"/><path d="M44 74c4 4 8 4 12 0" stroke="#111827" stroke-width="2.5" stroke-linecap="round" fill="none"/>' +
      '<circle cx="26" cy="66" r="6" fill="#FDA4AF" opacity=".6"/><circle cx="74" cy="66" r="6" fill="#FDA4AF" opacity=".6"/>' + gloss(34, 26, 10, 5, -20, 0.8);
  }
  function lotus(B) {
    var g1 = B.lg(['#FFE4E6', '#F472B6', '#9D174D']), g2 = B.lg(['#FFF1F2', '#FB7185']);
    return '<ellipse cx="50" cy="84" rx="40" ry="8" fill="#15803D"/><path d="M50 82C20 82 6 62 8 50c14 2 30 12 42 32zM50 82c30 0 44-20 42-32-14 2-30 12-42 32z" fill="' + g1 + '" stroke="#831843" stroke-width="2"/>' +
      '<path d="M50 82C30 70 24 46 30 30c12 8 20 26 20 52zM50 82c20-12 26-36 20-52-12 8-20 26-20 52z" fill="' + g2 + '" stroke="#831843" stroke-width="2"/>' +
      '<path d="M50 82c-10-18-10-50 0-70 10 20 10 52 0 70z" fill="' + g1 + '" stroke="#831843" stroke-width="2"/><circle cx="50" cy="70" r="5" fill="#FDE047"/>' + spark(76, 20, 6);
  }
  function bamboo(B) {
    var g = B.lg(['#BEF264', '#4D7C0F', '#1A2E05'], 'h'), s = '';
    [[28, 10, 86], [52, 4, 92], [74, 16, 80]].forEach(function (q) {
      s += '<rect x="' + (q[0] - 8) + '" y="' + q[1] + '" width="16" height="' + (q[2] - q[1]) + '" rx="5" fill="' + g + '" stroke="#1A2E05" stroke-width="2"/>';
      for (var y = q[1] + 22; y < q[2] - 6; y += 24) s += '<path d="M' + (q[0] - 9) + ' ' + y + 'h18" stroke="#1A2E05" stroke-width="3" stroke-linecap="round"/>';
    });
    return s + '<path d="M60 30c10-8 24-8 32-2-10 6-22 6-32 2zM40 50C30 42 16 42 8 48c10 6 22 6 32 2z" fill="#65A30D" stroke="#1A2E05" stroke-width="2"/>';
  }
  function fan(B) {
    var s = '';
    for (var i = 0; i <= 8; i++) { var a = (-70 + i * 17.5) * Math.PI / 180; s += '<path d="M50 84L' + f1(50 + 46 * Math.sin(a)) + ' ' + f1(84 - 46 * Math.cos(a)) + '" stroke="#7F1D1D" stroke-width="1.8"/>'; }
    return '<path d="M50 84L6.8 68.3A46 46 0 0 1 93.2 68.3z" fill="' + B.lg(['#FCA5A5', '#DC2626', '#7F1D1D']) + '" stroke="#7F1D1D" stroke-width="2.5" stroke-linejoin="round"/>' + s +
      '<path d="M22 58a34 34 0 0 1 56 0" stroke="#FBBF24" stroke-width="4" fill="none"/><circle cx="50" cy="84" r="6" fill="' + B.rg(PALS.gold) + '" stroke="#78350F" stroke-width="2"/><path d="M50 90v8" stroke="#FBBF24" stroke-width="3"/>' +
      '<circle cx="50" cy="56" r="7" fill="#FDE68A" opacity=".85"/>';
  }
  function idol(B) {
    return '<path d="M24 92V40c0-20 12-32 26-32s26 12 26 32v52z" fill="' + B.lg(PALS.gold, 'h') + '" stroke="#78350F" stroke-width="3"/>' +
      '<path d="M30 36h16v12H30zM54 36h16v12H54z" fill="#78350F"/><circle cx="38" cy="42" r="3.5" fill="#22D3EE"/><circle cx="62" cy="42" r="3.5" fill="#22D3EE"/>' +
      '<path d="M44 52h12l4 14H40z" fill="#B45309" stroke="#78350F" stroke-width="2"/><path d="M34 72h32v10H34z" fill="#78350F"/><path d="M38 72v10M46 72v10M54 72v10M62 72v10" stroke="#FDE68A" stroke-width="2.4"/>' +
      '<path d="M24 24L12 14M76 24l12-10" stroke="#16A34A" stroke-width="6" stroke-linecap="round"/><path d="M32 18c4-4 8-6 12-6" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6" fill="none"/>' + spark(84, 34, 6);
  }
  function toucan(B) {
    return '<path d="M30 90c-10-12-12-34-2-50 6-12 20-18 30-14l-4 64z" fill="' + B.lg(['#334155', '#0F172A']) + '" stroke="#020617" stroke-width="2.5"/>' +
      '<path d="M40 30c-6 6-8 18-4 26 8 0 14-6 16-14z" fill="#FEF3C7"/><path d="M50 26c14-6 34-4 44 6-12 0-26 8-42 10z" fill="' + B.lg(['#FDE047', '#F97316', '#DC2626'], 'h') + '" stroke="#7C2D12" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M52 40c12-2 26-6 40-8" stroke="#7C2D12" stroke-width="1.6" fill="none"/><circle cx="44" cy="30" r="5" fill="#fff"/><circle cx="45" cy="30" r="2.6" fill="#0F172A"/><circle cx="44" cy="30" r="7" fill="none" stroke="#22D3EE" stroke-width="2"/>' +
      '<path d="M54 80h30" stroke="#78350F" stroke-width="6" stroke-linecap="round"/><path d="M64 54c4 8 2 18-4 24" stroke="#DC2626" stroke-width="5" stroke-linecap="round" fill="none"/>' + gloss(60, 30, 8, 3, -10, 0.6);
  }
  function compass(B) {
    return '<circle cx="50" cy="52" r="42" fill="' + B.lg(['#FDE68A', '#B45309', '#5C2E0E']) + '" stroke="#3B1D06" stroke-width="2.5"/>' +
      '<circle cx="50" cy="52" r="33" fill="' + B.rg(['#FFFBEB', '#FDE68A', '#D6A770']) + '" stroke="#78350F" stroke-width="2"/>' +
      '<path d="M50 22l7 30-7 30-7-30z" fill="#DC2626"/><path d="M50 52l7 0-7 30-7-30z" fill="#1E293B"/><path d="M20 52l30-6 30 6-30 6z" fill="#475569" opacity=".5"/>' +
      '<circle cx="50" cy="52" r="4" fill="#FBBF24" stroke="#78350F" stroke-width="1.5"/><rect x="44" y="4" width="12" height="8" rx="3" fill="#B45309" stroke="#3B1D06" stroke-width="2"/>' + gloss(34, 36, 9, 5, -30, 0.6);
  }
  function flower(B) {
    var s = '', g = B.rg(['#FFE4E6', '#F43F5E', '#881337'], '50%', '50%', '60%');
    for (var i = 0; i < 5; i++) s += '<ellipse cx="50" cy="28" rx="16" ry="24" fill="' + g + '" stroke="#881337" stroke-width="2" transform="rotate(' + (i * 72) + ' 50 52)"/>';
    return s + '<circle cx="50" cy="52" r="10" fill="' + B.rg(PALS.gold) + '" stroke="#78350F" stroke-width="2"/><path d="M50 52l18-26" stroke="#FDE047" stroke-width="2.4"/><circle cx="68" cy="26" r="3" fill="#FDE047"/>';
  }
  function rainbow(B) {
    var c = ['#EF4444', '#F97316', '#FACC15', '#22C55E', '#3B82F6', '#8B5CF6'], s = '';
    c.forEach(function (k, i) { s += '<path d="M' + (8 + i * 5) + ' 72a' + (42 - i * 5) + ' ' + (42 - i * 5) + ' 0 0 1 ' + (84 - i * 10) + ' 0" stroke="' + k + '" stroke-width="5.5" fill="none"/>'; });
    return s + '<path d="M2 76c0-8 6-12 14-12 2-6 12-8 16 0 6-2 12 2 12 12z" fill="#fff" stroke="#CBD5E1" stroke-width="2"/><path d="M56 76c0-8 6-12 14-12 2-6 12-8 16 0 6-2 12 2 12 12z" fill="#fff" stroke="#CBD5E1" stroke-width="2"/>';
  }
  function pot(B) {
    var cs = '';
    [[34, 30], [46, 24], [58, 28], [70, 32], [40, 36], [54, 34], [64, 38], [28, 38]].forEach(function (q) { cs += '<ellipse cx="' + q[0] + '" cy="' + q[1] + '" rx="9" ry="6" fill="' + B.rg(PALS.gold) + '" stroke="#92400E" stroke-width="1.6"/>'; });
    return cs + '<path d="M14 40h72c4 8 4 30-8 42-8 8-48 8-56 0C10 70 10 48 14 40z" fill="' + B.lg(['#475569', '#1E293B', '#020617']) + '" stroke="#020617" stroke-width="2.5"/>' +
      '<rect x="10" y="36" width="80" height="10" rx="5" fill="' + B.lg(['#64748B', '#1E293B']) + '" stroke="#020617" stroke-width="2.5"/><path d="M22 54c0 10 2 18 8 24" stroke="#fff" stroke-width="3" opacity=".35" stroke-linecap="round" fill="none"/>' + spark(80, 16, 7) + spark(18, 20, 4, 0.8);
  }
  function clover(B, c) {
    c = c || ['#BBF7D0', '#16A34A', '#14532D'];
    var g = B.rg([c[0], c[1], c[2]], '40%', '35%', '70%'), s = '';
    for (var i = 0; i < 4; i++) s += '<g transform="rotate(' + (i * 90 + 45) + ' 50 48)"><path d="M50 48c-6-12-6-26 4-30 8-3 14 3 14 10 6-2 12 2 12 9 0 9-14 13-30 11z" fill="' + g + '" stroke="' + c[2] + '" stroke-width="2.4" stroke-linejoin="round"/></g>';
    return '<path d="M50 50c4 16 10 30 22 42" stroke="' + c[2] + '" stroke-width="6" stroke-linecap="round" fill="none"/>' + s +
      '<circle cx="50" cy="48" r="5" fill="' + B.rg(PALS.gold) + '"/>' + spark(30, 22, 6);
  }
  function lhat(B) {
    return '<path d="M8 76c0-6 18-10 42-10s42 4 42 10-18 10-42 10S8 82 8 76z" fill="' + B.lg(['#22C55E', '#14532D']) + '" stroke="#052E16" stroke-width="2.5"/>' +
      '<path d="M26 74L30 18h40l4 56c-14 4-34 4-48 0z" fill="' + B.lg(['#4ADE80', '#15803D', '#052E16'], 'h') + '" stroke="#052E16" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M28 58c14 3 30 3 44 0l1 10c-15 3-31 3-46 0z" fill="#111827"/><rect x="42" y="56" width="16" height="14" rx="2" fill="none" stroke="#FBBF24" stroke-width="3.5"/>' +
      '<path d="M34 24l-2 30" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".45"/>' + '<g transform="translate(58 12) scale(.3)">' + clover(B) + '</g>';
  }
  function nova(B) {
    var p = ngon(16, 46, 46, 0, 50, 50).map(function (q, i) { return i % 2 ? [50 + (q[0] - 50) * 0.4, 50 + (q[1] - 50) * 0.4] : q; });
    return '<circle cx="50" cy="50" r="46" fill="' + B.rg(['#FFFFFF@.9', '#22D3EE@.5', '#7C3AED@0'], '50%', '50%', '50%') + '"/>' +
      '<polygon points="' + p.map(function (q) { return f1(q[0]) + ',' + f1(q[1]); }).join(' ') + '" fill="' + B.rg(['#FFFFFF', '#A5F3FC', '#7C3AED'], '50%', '50%', '60%') + '"/><circle cx="50" cy="50" r="15" fill="#fff"/>';
  }
  function crystal(B) {
    return '<path d="M50 4l20 30-20 62-20-62z" fill="' + B.lg(['#FFFFFF', '#67E8F9', '#7C3AED'], 'd') + '" stroke="#312E81" stroke-width="2.5" stroke-linejoin="round"/>' +
      '<path d="M50 4v92M30 34h40" stroke="#fff" stroke-width="1.6" opacity=".7"/><path d="M50 4l20 30H50z" fill="#fff" opacity=".35"/>' +
      '<path d="M22 40l12 8-6 30-14-20zM78 40l-12 8 6 30 14-20z" fill="' + B.lg(['#F0ABFC', '#A21CAF']) + '" stroke="#4A044E" stroke-width="2" stroke-linejoin="round"/>' + spark(70, 16, 8) + spark(24, 22, 5, 0.8);
  }
  function seven2(B) { // cosmic seven: violet with stars
    return seven(B, ['#F5D0FE', '#A855F7', '#3B0764'], ['#FFFFFF', '#67E8F9', '#0E7490']) + spark(64, 22, 6) + spark(42, 72, 4) + '<circle cx="74" cy="58" r="2" fill="#fff"/>';
  }

  /* ====================================================================== themes */
  // pay tables (× total stake) — must stay identical to the rows generated into casino_ext/more2.php (scripts/test-cg-more2.php)
  function pay5(top) { return [[0.2, 0.5, 1.5], [0.2, 0.5, 1.5], [0.3, 0.8, 2], [0.3, 0.8, 2], [0.5, 1.5, 5], [0.8, 2, 8], [1, 4, 15], [2, 10, top]]; }
  function pay3(top) { return [0.5, 1, 2, 5, 10, 25, top]; }
  var PAYS = [[0.25, 0.75, 2], [0.4, 0.9, 4], [0.5, 1, 5], [0.8, 1.2, 8], [1, 1.5, 10], [1.5, 2, 12], [2, 5, 15], [10, 25, 50]];
  var LINES5 = [[1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2], [0, 1, 2, 1, 0], [2, 1, 0, 1, 2], [0, 0, 1, 2, 2], [2, 2, 1, 0, 0], [1, 0, 0, 0, 1], [1, 2, 2, 2, 1], [1, 0, 1, 2, 1]];
  var LINES3 = [[1, 1, 1], [0, 0, 0], [2, 2, 2], [0, 1, 2], [2, 1, 0]];
  var LCOL = ['#FDE047', '#F472B6', '#34D399', '#60A5FA', '#FB923C', '#C084FC', '#F87171', '#22D3EE', '#A3E635', '#FDBA74'];
  function R4(B, pal) { return [royal(B, 'J', pal[0]), royal(B, 'Q', pal[1]), royal(B, 'K', pal[2]), royal(B, 'A', pal[3])]; }
  var P = PALS;
  /* scenery: [sky top, sky bottom, frame light, frame dark, reel tint, silhouette svg (0 0 400 120)] */
  var THEMES = {
    candy: { mode: 'S', cols: 6, rows: 5, name: 'Sweet Candy', sp: 'bomb', look: ['#FF8AD8', '#6D28D9', '#FFD1EC', '#DB2777', '#2A0A3D'],
      hill: '<path d="M0 120V70c30-30 60-30 90 0s60 30 90 0 60-40 100-10 70 20 120-10v70z" fill="#F9A8D4" opacity=".35"/><path d="M0 120V90c40-20 80-20 120 0s80 20 120 0 100-20 160 0v30z" fill="#C084FC" opacity=".35"/>',
      art: function (B) { return [grape(B), plum(B), apple(B, ['#D9F99D', '#65A30D', '#365314']), melon(B), wrapped(B, P.blue), gummy(B, P.green), lolli(B, P.purple), hcandy(B, P.red)]; }, spArt: bomb },
    gatesgold: { mode: 'S', cols: 6, rows: 5, name: 'Gates of Gold', sp: 'orb', look: ['#60A5FA', '#1E1B4B', '#FFF1B8', '#B7791F', '#0B1238'],
      hill: '<path d="M60 120V40h30v80zM310 120V40h30v80z" fill="#FDE68A" opacity=".25"/><path d="M50 40h50M300 40h50" stroke="#FDE68A" stroke-width="8" opacity=".3"/><path d="M0 120c60-30 340-30 400 0z" fill="#E0E7FF" opacity=".25"/>',
      art: function (B) { return [gem(B, 'oct', P.blue), gem(B, 'sq', P.green), gem(B, 'hex', P.yellow), gem(B, 'oval', P.purple), gem(B, 'heart', P.red), hourglass(B), ring(B), crown(B)]; }, spArt: orb },
    fruitparty: { mode: 'S', cols: 7, rows: 5, name: 'Fruit Party', sp: 'star', look: ['#FDBA74', '#9D174D', '#FFF7CF', '#EA580C', '#2B0A1E'],
      hill: '<g fill="#FDE68A" opacity=".35"><circle cx="40" cy="30" r="4"/><circle cx="120" cy="18" r="3"/><circle cx="210" cy="34" r="4"/><circle cx="300" cy="16" r="3"/><circle cx="370" cy="36" r="4"/></g><path d="M0 120V92c50-16 100-16 150 0s100 16 150 0 70-12 100 0v28z" fill="#FB923C" opacity=".3"/>',
      art: function (B) { return [grape(B), orange(B), lemon(B), plum(B), apple(B), cherry(B), melon(B), strawberry(B)]; }, spArt: function (B) { return star(B, P.gold); } },
    spacegems: { mode: 'S', cols: 6, rows: 5, name: 'Space Gems', sp: 'nova', look: ['#22D3EE', '#1E1B4B', '#E0F2FE', '#0E7490', '#060A24'],
      hill: '<circle cx="330" cy="40" r="26" fill="#A78BFA" opacity=".3"/><ellipse cx="330" cy="40" rx="44" ry="8" fill="none" stroke="#C4B5FD" stroke-width="3" opacity=".35"/><circle cx="60" cy="90" r="40" fill="#22D3EE" opacity=".15"/>',
      art: function (B) { return [gem(B, 'tri', P.cyan), gem(B, 'oct', P.pink), gem(B, 'hex', P.green), gem(B, 'sq', P.orange), gem(B, 'round', P.violet), gem(B, 'heart', P.rose), planet(B, P.blue, '#FDE68A'), crystal(B)]; }, spArt: nova },
    bookstars: { mode: 'L5', name: 'Book of Stars', pay: pay5(60), look: ['#C084FC', '#2E1065', '#FDE68A', '#92400E', '#170A2E'],
      hill: '<path d="M0 120l70-60 50 40 60-70 70 70 50-40 100 60z" fill="#FDE68A" opacity=".18"/>',
      art: function (B) { return R4(B, [P.cyan, P.pink, P.green, P.gold]).concat([planet(B, P.orange, '#C4B5FD'), alien(B), astro(B), book(B)]); } },
    pharaoh: { mode: 'L5', name: 'Pharaoh’s Gold', pay: pay5(75), look: ['#FBBF24', '#3B1D6E', '#FFF1B8', '#A16207', '#1A0E2E'],
      hill: '<path d="M20 120l70-80 70 80zM130 120l50-56 50 56zM250 120l80-90 80 90z" fill="#FDE68A" opacity=".22"/>',
      art: function (B) { return R4(B, [P.blue, P.red, P.green, P.gold]).concat([ankh(B), scarab(B), horus(B), pharaoh(B)]); } },
    wildwest: { mode: 'L5', name: 'Wild West', pay: pay5(50), look: ['#FB923C', '#4A1D2E', '#FFE2C2', '#9A3412', '#24100A'],
      hill: '<path d="M0 120V80h40V60h50v20h40v40zM260 120V70h30V50h60v20h50v50z" fill="#7C2D12" opacity=".45"/><circle cx="200" cy="40" r="24" fill="#FDBA74" opacity=".35"/>',
      art: function (B) { return R4(B, [P.bronze, P.red, P.blue, P.gold]).concat([cactus(B), shoe(B), hat(B), badge(B)]); } },
    aztec: { mode: 'L5', name: 'Aztec Coins', pay: pay5(60), look: ['#34D399', '#14213D', '#FDE68A', '#065F46', '#071A16'],
      hill: '<path d="M140 120V96h20V80h20V64h40v16h20v16h20v24z" fill="#34D399" opacity=".22"/><path d="M0 120c40-40 80-40 120-10M280 110c40-30 80-30 120 0v10H280z" fill="#065F46" opacity=".5"/>',
      art: function (B) { return R4(B, [P.jade, P.red, P.blue, P.gold]).concat([coin(B, P.gold, '<path d="M50 32a18 18 0 1 0 0 36 10 10 0 1 0 0-20 4 4 0 1 0 0 8" stroke="#78350F" stroke-width="4" fill="none" stroke-linecap="round"/>'), pyramid(B), jademask(B), sunmask(B)]); } },
    ocean: { mode: 'L5', name: 'Ocean Treasure', pay: pay5(60), look: ['#38BDF8', '#0C1E5B', '#CFFAFE', '#0369A1', '#04122E'],
      hill: '<path d="M0 60c40-14 60 14 100 0s60-14 100 0 60 14 100 0 60-14 100 0" stroke="#7DD3FC" stroke-width="4" fill="none" opacity=".3"/><path d="M0 120V96c30-10 50 4 80-6s40-20 70-4 60 14 100 0 80-6 150 10v24z" fill="#0EA5E9" opacity=".22"/>',
      art: function (B) { return R4(B, [P.cyan, P.pink, P.green, P.gold]).concat([starfish(B), fish(B), shell(B), chest(B)]); } },
    dragonf: { mode: 'L5', name: 'Dragon Fortune', pay: pay5(100), look: ['#F87171', '#3B0A1E', '#FFE0A3', '#B91C1C', '#1F0610'],
      hill: '<path d="M60 120V70l-30-8h100l-30 8v50zM280 120V60l-36-10h120l-36 10v60z" fill="#F87171" opacity=".22"/><circle cx="200" cy="36" r="22" fill="#FDE68A" opacity=".25"/>',
      art: function (B) { return R4(B, [P.jade, P.red, P.blue, P.gold]).concat([jadecoin(B), lantern(B), ingot(B), dragon(B)]); } },
    panda: { mode: 'L5', name: 'Panda Luck', pay: pay5(50), look: ['#86EFAC', '#153B2E', '#E9FCE9', '#15803D', '#06180F'],
      hill: '<path d="M30 120V20M50 120V40M350 120V10M372 120V36" stroke="#4ADE80" stroke-width="8" opacity=".22"/><path d="M0 120c60-30 120-30 200-10s140 10 200-10v20z" fill="#14532D" opacity=".5"/>',
      art: function (B) { return R4(B, [P.green, P.red, P.blue, P.gold]).concat([fan(B), bamboo(B), lotus(B), panda(B)]); } },
    jungle: { mode: 'L5', name: 'Jungle Gold', pay: pay5(75), look: ['#A3E635', '#1A2E1A', '#FEF3C7', '#4D7C0F', '#0B160B'],
      hill: '<path d="M0 0c40 20 60 50 50 90M400 0c-40 20-60 50-50 90" stroke="#4ADE80" stroke-width="10" fill="none" opacity=".2"/><path d="M0 120c50-30 100-30 150-10s100 10 150-10 70-10 100 0v20z" fill="#166534" opacity=".5"/>',
      art: function (B) { return R4(B, [P.teal, P.red, P.orange, P.gold]).concat([flower(B), compass(B), toucan(B), idol(B)]); } },
    cosmic7: { mode: 'L3', name: 'Cosmic Sevens', pay: pay3(200), look: ['#F472B6', '#2E1065', '#FFE4F1', '#BE185D', '#14062B'],
      hill: '<circle cx="70" cy="40" r="20" fill="#F472B6" opacity=".25"/><circle cx="330" cy="70" r="30" fill="#818CF8" opacity=".2"/>',
      art: function (B) { return [cherry(B), lemon(B), plum(B), bell(B), bar(B, P.red), seven(B, P.red), seven2(B)]; } },
    diamond: { mode: 'L3', name: 'Diamond Deluxe', pay: pay3(100), look: ['#93C5FD', '#172554', '#F0F9FF', '#1D4ED8', '#081230'],
      hill: '<path d="M0 120l60-30 40 20 60-40 60 40 40-20 60 30 80-20v20z" fill="#BFDBFE" opacity=".15"/>',
      art: function (B) { return [gem(B, 'oval', P.green), gem(B, 'sq', P.blue), gem(B, 'hex', P.purple), gem(B, 'cush', P.yellow), gem(B, 'heart', P.red), gem(B, 'rect', P.pink), diamond(B, P.white)]; } },
    clover: { mode: 'L3', name: 'Lucky Clover', pay: pay3(150), look: ['#4ADE80', '#0F2E25', '#FEF9C3', '#15803D', '#06160F'],
      hill: '<path d="M0 120V96c40-12 80-12 120 0s80 12 120 0 80-12 160 0v24z" fill="#22C55E" opacity=".25"/>',
      art: function (B) { return [coin(B, P.gold, '<path d="M40 38h20l-4 12 6 14H38l6-14z" fill="#78350F" opacity=".6"/>'), shoe(B), lhat(B), rainbow(B), bell(B), pot(B), clover(B, ['#FEF9C3', '#EAB308', '#713F12'])]; } }
  };
  var ORDER = ['candy', 'gatesgold', 'fruitparty', 'bookstars', 'pharaoh', 'spacegems', 'wildwest', 'aztec', 'ocean', 'dragonf', 'panda', 'clover', 'cosmic7', 'diamond', 'jungle'];
  var SPV = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 50, 100]; // multiplier orb / bomb values

  /* the server's table lines (generated with the weights into casino_ext/more2.php — same order) */
  var ROWS = /*ROWS*/{
    candy: [[0],[0.25,"S",[[0,8]]],[0.75,"S",[[0,10]]],[2,"S",[[0,12]]],[0.4,"S",[[1,8]]],[0.9,"S",[[1,10]]],[4,"S",[[1,12]]],[0.5,"S",[[2,8]]],[1,"S",[[2,10]]],[5,"S",[[2,12]]],[0.8,"S",[[3,8]]],[1.2,"S",[[3,10]]],[8,"S",[[3,12]]],[1,"S",[[4,8]]],[1.5,"S",[[4,10]]],[10,"S",[[4,12]]],[1.5,"S",[[5,8]]],[2,"S",[[5,10]]],[12,"S",[[5,12]]],[2,"S",[[6,8]]],[5,"S",[[6,10]]],[15,"S",[[6,12]]],[10,"S",[[7,8]]],[25,"S",[[7,10]]],[50,"S",[[7,12]]],[0.65,"S",[[0,8],[1,8]]],[1.3,"S",[[2,8],[3,8]]],[1.75,"S",[[0,10],[4,8]]],[2.4,"S",[[1,8],[6,8]]],[3.5,"S",[[5,8],[6,8]]],[3.2,"S",[[3,10],[5,10]]],[10.25,"S",[[7,8],[0,8]]],[0.5,"S",[[0,8]],2],[1.2,"S",[[1,8]],3],[2.5,"S",[[2,8]],5],[4,"S",[[4,8]],4],[8,"S",[[3,8]],10],[10,"S",[[6,8]],5],[20,"S",[[5,10]],10],[50,"S",[[6,10]],10],[100,"S",[[7,8]],10],[300,"S",[[6,12]],20],[500,"S",[[7,10]],20],[1000,"S",[[7,12]],20]],
    gatesgold: [[0],[0.25,"S",[[0,8]]],[0.75,"S",[[0,10]]],[2,"S",[[0,12]]],[0.4,"S",[[1,8]]],[0.9,"S",[[1,10]]],[4,"S",[[1,12]]],[0.5,"S",[[2,8]]],[1,"S",[[2,10]]],[5,"S",[[2,12]]],[0.8,"S",[[3,8]]],[1.2,"S",[[3,10]]],[8,"S",[[3,12]]],[1,"S",[[4,8]]],[1.5,"S",[[4,10]]],[10,"S",[[4,12]]],[1.5,"S",[[5,8]]],[2,"S",[[5,10]]],[12,"S",[[5,12]]],[2,"S",[[6,8]]],[5,"S",[[6,10]]],[15,"S",[[6,12]]],[10,"S",[[7,8]]],[25,"S",[[7,10]]],[50,"S",[[7,12]]],[0.65,"S",[[0,8],[1,8]]],[1.3,"S",[[2,8],[3,8]]],[1.75,"S",[[0,10],[4,8]]],[2.4,"S",[[1,8],[6,8]]],[3.5,"S",[[5,8],[6,8]]],[3.2,"S",[[3,10],[5,10]]],[10.25,"S",[[7,8],[0,8]]],[0.5,"S",[[0,8]],2],[1.2,"S",[[1,8]],3],[2.5,"S",[[2,8]],5],[4,"S",[[4,8]],4],[8,"S",[[3,8]],10],[10,"S",[[6,8]],5],[20,"S",[[5,10]],10],[50,"S",[[6,10]],10],[100,"S",[[7,8]],10],[300,"S",[[6,12]],20],[500,"S",[[7,10]],20],[1000,"S",[[7,12]],20]],
    fruitparty: [[0],[0.25,"S",[[0,8]]],[0.75,"S",[[0,10]]],[2,"S",[[0,12]]],[0.4,"S",[[1,8]]],[0.9,"S",[[1,10]]],[4,"S",[[1,12]]],[0.5,"S",[[2,8]]],[1,"S",[[2,10]]],[5,"S",[[2,12]]],[0.8,"S",[[3,8]]],[1.2,"S",[[3,10]]],[8,"S",[[3,12]]],[1,"S",[[4,8]]],[1.5,"S",[[4,10]]],[10,"S",[[4,12]]],[1.5,"S",[[5,8]]],[2,"S",[[5,10]]],[12,"S",[[5,12]]],[2,"S",[[6,8]]],[5,"S",[[6,10]]],[15,"S",[[6,12]]],[10,"S",[[7,8]]],[25,"S",[[7,10]]],[50,"S",[[7,12]]],[0.65,"S",[[0,8],[1,8]]],[1.3,"S",[[2,8],[3,8]]],[1.75,"S",[[0,10],[4,8]]],[2.4,"S",[[1,8],[6,8]]],[3.5,"S",[[5,8],[6,8]]],[3.2,"S",[[3,10],[5,10]]],[10.25,"S",[[7,8],[0,8]]],[0.5,"S",[[0,8]],2],[1.2,"S",[[1,8]],3],[2.5,"S",[[2,8]],5],[4,"S",[[4,8]],4],[8,"S",[[3,8]],10],[10,"S",[[6,8]],5],[20,"S",[[5,10]],10],[50,"S",[[6,10]],10],[100,"S",[[7,8]],10],[150,"S",[[6,12]],10],[250,"S",[[7,10]],10],[500,"S",[[7,12]],10]],
    bookstars: [[0],[0.2,"L",[[[0,1],3]]],[0.5,"L",[[[0,1],4]]],[1.5,"L",[[[0,1],5]]],[0.3,"L",[[[2,3],3]]],[0.8,"L",[[[2,3],4]]],[2,"L",[[[2,3],5]]],[0.5,"L",[[[4],3]]],[1.5,"L",[[[4],4]]],[5,"L",[[[4],5]]],[0.8,"L",[[[5],3]]],[2,"L",[[[5],4]]],[8,"L",[[[5],5]]],[1,"L",[[[6],3]]],[4,"L",[[[6],4]]],[15,"L",[[[6],5]]],[2,"L",[[[7],3]]],[10,"L",[[[7],4]]],[60,"L",[[[7],5]]],[0.4,"L",[[[0,1],3],[[0,1],3]]],[0.5,"L",[[[2,3],3],[[0,1],3]]],[0.8,"L",[[[4],3],[[2,3],3]]],[2.5,"L",[[[5],4],[[4],3]]],[1.8,"L",[[[6],3],[[5],3]]],[3,"L",[[[7],3],[[6],3]]],[5.5,"L",[[[6],4],[[4],4]]],[11,"L",[[[7],4],[[6],3]]],[1,"L",[[[2,3],3],[[0,1],3],[[4],3]]],[80,"F",5],[150,"F",6],[600,"F",7]],
    pharaoh: [[0],[0.2,"L",[[[0,1],3]]],[0.5,"L",[[[0,1],4]]],[1.5,"L",[[[0,1],5]]],[0.3,"L",[[[2,3],3]]],[0.8,"L",[[[2,3],4]]],[2,"L",[[[2,3],5]]],[0.5,"L",[[[4],3]]],[1.5,"L",[[[4],4]]],[5,"L",[[[4],5]]],[0.8,"L",[[[5],3]]],[2,"L",[[[5],4]]],[8,"L",[[[5],5]]],[1,"L",[[[6],3]]],[4,"L",[[[6],4]]],[15,"L",[[[6],5]]],[2,"L",[[[7],3]]],[10,"L",[[[7],4]]],[75,"L",[[[7],5]]],[0.4,"L",[[[0,1],3],[[0,1],3]]],[0.5,"L",[[[2,3],3],[[0,1],3]]],[0.8,"L",[[[4],3],[[2,3],3]]],[2.5,"L",[[[5],4],[[4],3]]],[1.8,"L",[[[6],3],[[5],3]]],[3,"L",[[[7],3],[[6],3]]],[5.5,"L",[[[6],4],[[4],4]]],[11,"L",[[[7],4],[[6],3]]],[1,"L",[[[2,3],3],[[0,1],3],[[4],3]]],[80,"F",5],[150,"F",6],[750,"F",7]],
    spacegems: [[0],[0.25,"S",[[0,8]]],[0.75,"S",[[0,10]]],[2,"S",[[0,12]]],[0.4,"S",[[1,8]]],[0.9,"S",[[1,10]]],[4,"S",[[1,12]]],[0.5,"S",[[2,8]]],[1,"S",[[2,10]]],[5,"S",[[2,12]]],[0.8,"S",[[3,8]]],[1.2,"S",[[3,10]]],[8,"S",[[3,12]]],[1,"S",[[4,8]]],[1.5,"S",[[4,10]]],[10,"S",[[4,12]]],[1.5,"S",[[5,8]]],[2,"S",[[5,10]]],[12,"S",[[5,12]]],[2,"S",[[6,8]]],[5,"S",[[6,10]]],[15,"S",[[6,12]]],[10,"S",[[7,8]]],[25,"S",[[7,10]]],[50,"S",[[7,12]]],[0.65,"S",[[0,8],[1,8]]],[1.3,"S",[[2,8],[3,8]]],[1.75,"S",[[0,10],[4,8]]],[2.4,"S",[[1,8],[6,8]]],[3.5,"S",[[5,8],[6,8]]],[3.2,"S",[[3,10],[5,10]]],[10.25,"S",[[7,8],[0,8]]],[0.5,"S",[[0,8]],2],[1.2,"S",[[1,8]],3],[2.5,"S",[[2,8]],5],[4,"S",[[4,8]],4],[8,"S",[[3,8]],10],[10,"S",[[6,8]],5],[20,"S",[[5,10]],10],[50,"S",[[6,10]],10],[100,"S",[[7,8]],10],[225,"S",[[6,12]],15],[375,"S",[[7,10]],15],[750,"S",[[7,12]],15]],
    wildwest: [[0],[0.2,"L",[[[0,1],3]]],[0.5,"L",[[[0,1],4]]],[1.5,"L",[[[0,1],5]]],[0.3,"L",[[[2,3],3]]],[0.8,"L",[[[2,3],4]]],[2,"L",[[[2,3],5]]],[0.5,"L",[[[4],3]]],[1.5,"L",[[[4],4]]],[5,"L",[[[4],5]]],[0.8,"L",[[[5],3]]],[2,"L",[[[5],4]]],[8,"L",[[[5],5]]],[1,"L",[[[6],3]]],[4,"L",[[[6],4]]],[15,"L",[[[6],5]]],[2,"L",[[[7],3]]],[10,"L",[[[7],4]]],[50,"L",[[[7],5]]],[0.4,"L",[[[0,1],3],[[0,1],3]]],[0.5,"L",[[[2,3],3],[[0,1],3]]],[0.8,"L",[[[4],3],[[2,3],3]]],[2.5,"L",[[[5],4],[[4],3]]],[1.8,"L",[[[6],3],[[5],3]]],[3,"L",[[[7],3],[[6],3]]],[5.5,"L",[[[6],4],[[4],4]]],[11,"L",[[[7],4],[[6],3]]],[1,"L",[[[2,3],3],[[0,1],3],[[4],3]]],[80,"F",5],[150,"F",6],[500,"F",7]],
    aztec: [[0],[0.2,"L",[[[0,1],3]]],[0.5,"L",[[[0,1],4]]],[1.5,"L",[[[0,1],5]]],[0.3,"L",[[[2,3],3]]],[0.8,"L",[[[2,3],4]]],[2,"L",[[[2,3],5]]],[0.5,"L",[[[4],3]]],[1.5,"L",[[[4],4]]],[5,"L",[[[4],5]]],[0.8,"L",[[[5],3]]],[2,"L",[[[5],4]]],[8,"L",[[[5],5]]],[1,"L",[[[6],3]]],[4,"L",[[[6],4]]],[15,"L",[[[6],5]]],[2,"L",[[[7],3]]],[10,"L",[[[7],4]]],[60,"L",[[[7],5]]],[0.4,"L",[[[0,1],3],[[0,1],3]]],[0.5,"L",[[[2,3],3],[[0,1],3]]],[0.8,"L",[[[4],3],[[2,3],3]]],[2.5,"L",[[[5],4],[[4],3]]],[1.8,"L",[[[6],3],[[5],3]]],[3,"L",[[[7],3],[[6],3]]],[5.5,"L",[[[6],4],[[4],4]]],[11,"L",[[[7],4],[[6],3]]],[1,"L",[[[2,3],3],[[0,1],3],[[4],3]]],[80,"F",5],[150,"F",6],[600,"F",7]],
    ocean: [[0],[0.2,"L",[[[0,1],3]]],[0.5,"L",[[[0,1],4]]],[1.5,"L",[[[0,1],5]]],[0.3,"L",[[[2,3],3]]],[0.8,"L",[[[2,3],4]]],[2,"L",[[[2,3],5]]],[0.5,"L",[[[4],3]]],[1.5,"L",[[[4],4]]],[5,"L",[[[4],5]]],[0.8,"L",[[[5],3]]],[2,"L",[[[5],4]]],[8,"L",[[[5],5]]],[1,"L",[[[6],3]]],[4,"L",[[[6],4]]],[15,"L",[[[6],5]]],[2,"L",[[[7],3]]],[10,"L",[[[7],4]]],[60,"L",[[[7],5]]],[0.4,"L",[[[0,1],3],[[0,1],3]]],[0.5,"L",[[[2,3],3],[[0,1],3]]],[0.8,"L",[[[4],3],[[2,3],3]]],[2.5,"L",[[[5],4],[[4],3]]],[1.8,"L",[[[6],3],[[5],3]]],[3,"L",[[[7],3],[[6],3]]],[5.5,"L",[[[6],4],[[4],4]]],[11,"L",[[[7],4],[[6],3]]],[1,"L",[[[2,3],3],[[0,1],3],[[4],3]]],[80,"F",5],[150,"F",6],[600,"F",7]],
    dragonf: [[0],[0.2,"L",[[[0,1],3]]],[0.5,"L",[[[0,1],4]]],[1.5,"L",[[[0,1],5]]],[0.3,"L",[[[2,3],3]]],[0.8,"L",[[[2,3],4]]],[2,"L",[[[2,3],5]]],[0.5,"L",[[[4],3]]],[1.5,"L",[[[4],4]]],[5,"L",[[[4],5]]],[0.8,"L",[[[5],3]]],[2,"L",[[[5],4]]],[8,"L",[[[5],5]]],[1,"L",[[[6],3]]],[4,"L",[[[6],4]]],[15,"L",[[[6],5]]],[2,"L",[[[7],3]]],[10,"L",[[[7],4]]],[100,"L",[[[7],5]]],[0.4,"L",[[[0,1],3],[[0,1],3]]],[0.5,"L",[[[2,3],3],[[0,1],3]]],[0.8,"L",[[[4],3],[[2,3],3]]],[2.5,"L",[[[5],4],[[4],3]]],[1.8,"L",[[[6],3],[[5],3]]],[3,"L",[[[7],3],[[6],3]]],[5.5,"L",[[[6],4],[[4],4]]],[11,"L",[[[7],4],[[6],3]]],[1,"L",[[[2,3],3],[[0,1],3],[[4],3]]],[80,"F",5],[150,"F",6],[1000,"F",7]],
    panda: [[0],[0.2,"L",[[[0,1],3]]],[0.5,"L",[[[0,1],4]]],[1.5,"L",[[[0,1],5]]],[0.3,"L",[[[2,3],3]]],[0.8,"L",[[[2,3],4]]],[2,"L",[[[2,3],5]]],[0.5,"L",[[[4],3]]],[1.5,"L",[[[4],4]]],[5,"L",[[[4],5]]],[0.8,"L",[[[5],3]]],[2,"L",[[[5],4]]],[8,"L",[[[5],5]]],[1,"L",[[[6],3]]],[4,"L",[[[6],4]]],[15,"L",[[[6],5]]],[2,"L",[[[7],3]]],[10,"L",[[[7],4]]],[50,"L",[[[7],5]]],[0.4,"L",[[[0,1],3],[[0,1],3]]],[0.5,"L",[[[2,3],3],[[0,1],3]]],[0.8,"L",[[[4],3],[[2,3],3]]],[2.5,"L",[[[5],4],[[4],3]]],[1.8,"L",[[[6],3],[[5],3]]],[3,"L",[[[7],3],[[6],3]]],[5.5,"L",[[[6],4],[[4],4]]],[11,"L",[[[7],4],[[6],3]]],[1,"L",[[[2,3],3],[[0,1],3],[[4],3]]],[80,"F",5],[150,"F",6],[500,"F",7]],
    clover: [[0],[0.5,"L",[[[0],3]]],[1,"L",[[[1],3]]],[2,"L",[[[2],3]]],[5,"L",[[[3],3]]],[10,"L",[[[4],3]]],[25,"L",[[[5],3]]],[150,"L",[[[6],3]]],[1,"L",[[[0],3],[[0],3]]],[1.5,"L",[[[1],3],[[0],3]]],[3,"L",[[[2],3],[[1],3]]],[7,"L",[[[3],3],[[2],3]]],[15,"L",[[[4],3],[[3],3]]],[50,"F",4],[125,"F",5],[750,"F",6]],
    cosmic7: [[0],[0.5,"L",[[[0],3]]],[1,"L",[[[1],3]]],[2,"L",[[[2],3]]],[5,"L",[[[3],3]]],[10,"L",[[[4],3]]],[25,"L",[[[5],3]]],[200,"L",[[[6],3]]],[1,"L",[[[0],3],[[0],3]]],[1.5,"L",[[[1],3],[[0],3]]],[3,"L",[[[2],3],[[1],3]]],[7,"L",[[[3],3],[[2],3]]],[15,"L",[[[4],3],[[3],3]]],[50,"F",4],[125,"F",5],[1000,"F",6]],
    diamond: [[0],[0.5,"L",[[[0],3]]],[1,"L",[[[1],3]]],[2,"L",[[[2],3]]],[5,"L",[[[3],3]]],[10,"L",[[[4],3]]],[25,"L",[[[5],3]]],[100,"L",[[[6],3]]],[1,"L",[[[0],3],[[0],3]]],[1.5,"L",[[[1],3],[[0],3]]],[3,"L",[[[2],3],[[1],3]]],[7,"L",[[[3],3],[[2],3]]],[15,"L",[[[4],3],[[3],3]]],[50,"F",4],[125,"F",5],[500,"F",6]],
    jungle: [[0],[0.2,"L",[[[0,1],3]]],[0.5,"L",[[[0,1],4]]],[1.5,"L",[[[0,1],5]]],[0.3,"L",[[[2,3],3]]],[0.8,"L",[[[2,3],4]]],[2,"L",[[[2,3],5]]],[0.5,"L",[[[4],3]]],[1.5,"L",[[[4],4]]],[5,"L",[[[4],5]]],[0.8,"L",[[[5],3]]],[2,"L",[[[5],4]]],[8,"L",[[[5],5]]],[1,"L",[[[6],3]]],[4,"L",[[[6],4]]],[15,"L",[[[6],5]]],[2,"L",[[[7],3]]],[10,"L",[[[7],4]]],[75,"L",[[[7],5]]],[0.4,"L",[[[0,1],3],[[0,1],3]]],[0.5,"L",[[[2,3],3],[[0,1],3]]],[0.8,"L",[[[4],3],[[2,3],3]]],[2.5,"L",[[[5],4],[[4],3]]],[1.8,"L",[[[6],3],[[5],3]]],[3,"L",[[[7],3],[[6],3]]],[5.5,"L",[[[6],4],[[4],4]]],[11,"L",[[[7],4],[[6],3]]],[1,"L",[[[2,3],3],[[0,1],3],[[4],3]]],[80,"F",5],[150,"F",6],[750,"F",7]]
  }/*END*/;

  /* ====================================================================== maths: evaluate & compose screens */
  function rnd(n) { return Math.floor(Math.random() * n); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function r2(v) { return Math.round(v * 100) / 100; }
  function linesOf(th) { return th.mode === 'L3' ? LINES3 : LINES5; }
  function colsOf(th) { return th.mode === 'L3' ? 3 : th.mode === 'L5' ? 5 : th.cols; }
  function rowsOf(th) { return th.mode === 'S' ? th.rows : 3; }
  /* line games: g[col][row] = symbol → wins [{l, s, n, m}] */
  function evalL(th, g) {
    var out = [], L = linesOf(th), cols = colsOf(th);
    L.forEach(function (ln, li) {
      var s = g[0][ln[0]], n = 1;
      while (n < cols && g[n][ln[n]] === s) n++;
      var m = th.mode === 'L3' ? (n === 3 ? th.pay[s] : 0) : (n >= 3 ? th.pay[s][n - 3] : 0);
      if (m > 0) out.push({ l: li, s: s, n: n, m: m });
    });
    return out;
  }
  /* pays anywhere: g[col][row] = symbol (-1 = multiplier orb) → wins [{s, n, m}] */
  function bracket(n) { return n >= 12 ? 2 : n >= 10 ? 1 : n >= 8 ? 0 : -1; }
  function evalS(g) {
    var cnt = {}, out = [];
    g.forEach(function (col) { col.forEach(function (s) { if (s >= 0) cnt[s] = (cnt[s] || 0) + 1; }); });
    Object.keys(cnt).forEach(function (k) { var b = bracket(cnt[k]); if (b >= 0) out.push({ s: +k, n: cnt[k], m: PAYS[+k][b] }); });
    return out;
  }
  function sum(w) { var t = 0; w.forEach(function (x) { t += x.m; }); return r2(t); }
  function grid(cols, rows, fill) { var g = []; for (var c = 0; c < cols; c++) { g.push([]); for (var r = 0; r < rows; r++) g[c].push(fill(c, r)); } return g; }
  function lossL(th) {
    var cols = colsOf(th), ns = th.mode === 'L3' ? 7 : 8;
    for (var t = 0; t < 400; t++) { var g = grid(cols, 3, function () { return rnd(ns); }); if (!evalL(th, g).length) return g; }
    return grid(cols, 3, function (c, r) { return (c * 3 + r * 2 + c) % ns; });
  }
  function composeL(th, row) {
    var cols = colsOf(th), L = linesOf(th), ns = th.mode === 'L3' ? 7 : 8;
    if (!row || !row[0]) return { g: lossL(th), w: [] };
    if (row[1] === 'F') { var gf = grid(cols, 3, function () { return row[2]; }); return { g: gf, w: evalL(th, gf) }; }
    for (var t = 0; t < 600; t++) {
      var g = grid(cols, 3, function () { return rnd(ns); }), used = {}, ok = true, lines = shuffle(L.map(function (x, i) { return i; }));
      row[2].forEach(function (w) {
        if (!ok) return;
        var s = w[0][rnd(w[0].length)], n = w[1], li = -1;
        for (var q = 0; q < lines.length && li < 0; q++) {
          var cand = L[lines[q]], free = true;
          for (var c = 0; c < Math.min(cols, n + 1); c++) if (used[c + ':' + cand[c]]) free = false;
          if (free) li = lines[q];
        }
        if (li < 0) { ok = false; return; }
        lines.splice(lines.indexOf(li), 1);
        for (var c2 = 0; c2 < n; c2++) { g[c2][L[li][c2]] = s; used[c2 + ':' + L[li][c2]] = 1; }
        if (n < cols) { var o; do { o = rnd(ns); } while (o === s); g[n][L[li][n]] = o; used[n + ':' + L[li][n]] = 1; }
      });
      if (!ok) continue;
      var w2 = evalL(th, g);
      if (w2.length === row[2].length && Math.abs(sum(w2) - row[0]) < 1e-6) return { g: g, w: w2 };
    }
    return null;
  }
  function splitMult(M) { // 1 to 3 orb values that add up to M
    for (var t = 0; t < 200; t++) {
      var k = 1 + rnd(M >= 6 ? 3 : 2), a = [], left = M;
      for (var i = 0; i < k - 1; i++) { var c = SPV.filter(function (v) { return v < left - 1; }); if (!c.length) break; var v = c[rnd(Math.min(c.length, 6))]; a.push(v); left -= v; }
      if (SPV.indexOf(left) >= 0) { a.push(left); return shuffle(a); }
    }
    return [M];
  }
  /* pays anywhere: first screen (with the wins) + the screen after the tumble (no win left) */
  function composeS(th, row) {
    var cols = th.cols, rows = th.rows, N = cols * rows, cells = [], cnt = [0, 0, 0, 0, 0, 0, 0, 0], win = {}, sp = [];
    var wins = row && row[0] ? row[2] : [], M = row && row[0] ? (row[3] || 1) : 1;
    wins.forEach(function (w) { var n = w[1] + (w[1] >= 12 ? rnd(2) : rnd(2)); win[w[0]] = 1; cnt[w[0]] = n; for (var i = 0; i < n; i++) cells.push(w[0]); });
    if (M > 1) sp = splitMult(M); else if (!wins.length && Math.random() < 0.12) sp = [SPV[rnd(7)]]; // a lonely orb on a losing screen (pays nothing)
    sp.forEach(function () { cells.push(-1); });
    while (cells.length < N) {
      var ok = [], s;
      for (s = 0; s < 8; s++) if (!win[s] && cnt[s] < 7) ok.push(s);
      s = ok[rnd(ok.length)]; cnt[s]++; cells.push(s);
    }
    shuffle(cells);
    var g = grid(cols, rows, function (c, r) { return cells[c * rows + r]; }), vals = {}, k = 0;
    g.forEach(function (col, c) { col.forEach(function (s, r) { if (s === -1) vals[c + ':' + r] = sp[k++]; }); });
    var w = evalS(g);
    // tumble: winners burst, the others fall, new symbols drop in (never a new win: each symbol stays ≤ 7)
    var after = null, moves = null;
    if (w.length) {
      var c2 = [0, 0, 0, 0, 0, 0, 0, 0]; after = []; moves = [];
      g.forEach(function (col) { col.forEach(function (s) { if (s >= 0 && !win[s]) c2[s]++; }); });
      g.forEach(function (col, c) {
        var keep = []; col.forEach(function (s, r) { if (!(s >= 0 && win[s])) keep.push(r); });
        var nNew = rows - keep.length, nc = [], mv = [];
        for (var i = 0; i < nNew; i++) {
          var ok2 = []; for (var s2 = 0; s2 < 8; s2++) if (c2[s2] < 7) ok2.push(s2);
          var pick = ok2[rnd(ok2.length)]; c2[pick]++; nc.push(pick); mv.push({ from: -1, to: i });
        }
        keep.forEach(function (r, i) { nc.push(col[r]); mv.push({ from: r, to: nNew + i }); });
        after.push(nc); moves.push(mv);
      });
    }
    return { g: g, w: w, vals: vals, M: M, after: after, moves: moves, base: sum(w) };
  }
  function compose(key, i) {
    var th = THEMES[key], row = (ROWS[key] || [])[i];
    if (th.mode === 'S') return composeS(th, row);
    return composeL(th, row) || { g: lossL(th), w: [] };
  }

  D6.Slots2 = { THEMES: THEMES, ORDER: ORDER, ROWS: ROWS, PAYS: PAYS, LINES5: LINES5, LINES3: LINES3, compose: compose, evalL: evalL, evalS: evalS, mk: mk, sum: sum };
  if (!K) return; // (maths & drawings also load in the test tools)
  /* ====================================================================== the game screen */
  var T = {
    en: { spin: 'Spin', win: 'Win', max: 'Max' }, fr: { spin: 'Lancer', win: 'Gain', max: 'Max' }, es: { spin: 'Girar', win: 'Premio', max: 'Máx' },
    pt: { spin: 'Girar', win: 'Prêmio', max: 'Máx' }, ar: { spin: 'دوران', win: 'ربح', max: 'حتى' }, tr: { spin: 'Çevir', win: 'Kazanç', max: 'Maks' },
    vi: { spin: 'Quay', win: 'Thắng', max: 'Tối đa' }, id: { spin: 'Putar', win: 'Menang', max: 'Maks' }, ru: { spin: 'Крутить', win: 'Выигрыш', max: 'Макс' },
    de: { spin: 'Drehen', win: 'Gewinn', max: 'Max' }, hi: { spin: 'स्पिन', win: 'जीत', max: 'अधिकतम' }, zh: { spin: '旋转', win: '赢', max: '最高' }
  };
  function L() { return Object.assign({}, T.en, T[K.lang()] || {}); }
  var RULES = {
    L5: {
      en: '1. Choose your stake and tap “Spin”. Tap again to stop the reels at once.\n2. 10 lines pay from the left reel: 3, 4 or 5 same symbols in a row on a line. The ⓘ button shows the paytable and the lines.\n3. Wins are multiples of your stake and add up — up to ×{max} with a screen full of the top symbol.',
      fr: '1. Choisis ta mise et touche « Lancer ». Touche encore pour arrêter les rouleaux d’un coup.\n2. 10 lignes paient depuis le rouleau de gauche : 3, 4 ou 5 symboles pareils à la suite sur une ligne. Le bouton ⓘ montre les gains et les lignes.\n3. Les gains sont des multiples de ta mise et s’additionnent — jusqu’à ×{max} avec un écran rempli du meilleur symbole.',
      es: '1. Elige tu apuesta y toca «Girar». Toca otra vez para parar los rodillos de golpe.\n2. 10 líneas pagan desde el rodillo izquierdo: 3, 4 o 5 símbolos iguales seguidos en una línea. El botón ⓘ muestra los premios y las líneas.\n3. Los premios son múltiplos de tu apuesta y se suman — hasta ×{max} con la pantalla llena del mejor símbolo.',
      pt: '1. Escolha a aposta e toque em «Girar». Toque de novo para parar os rolos de uma vez.\n2. 10 linhas pagam a partir do rolo da esquerda: 3, 4 ou 5 símbolos iguais seguidos numa linha. O botão ⓘ mostra os prêmios e as linhas.\n3. Os prêmios são múltiplos da aposta e se somam — até ×{max} com a tela cheia do melhor símbolo.',
      ar: '1. اختر رهانك واضغط «دوران». اضغط مرة أخرى لإيقاف البكرات فورًا.\n2. تربح 10 خطوط بدءًا من البكرة اليسرى: 3 أو 4 أو 5 رموز متشابهة متتالية على خط. زر ⓘ يعرض جدول الأرباح والخطوط.\n3. الأرباح مضاعفات لرهانك وتُجمع — حتى ×{max} عندما تمتلئ الشاشة بأفضل رمز.',
      tr: '1. Bahsini seç ve «Çevir»e dokun. Makaraları hemen durdurmak için tekrar dokun.\n2. 10 çizgi soldaki makaradan başlayarak öder: bir çizgide art arda 3, 4 veya 5 aynı sembol. ⓘ düğmesi ödeme tablosunu ve çizgileri gösterir.\n3. Kazançlar bahsinin katlarıdır ve toplanır — ekran en iyi sembolle dolarsa ×{max}’e kadar.',
      vi: '1. Chọn mức cược rồi chạm «Quay». Chạm lần nữa để dừng cuộn ngay.\n2. 10 đường trả thưởng từ cuộn bên trái: 3, 4 hoặc 5 biểu tượng giống nhau liên tiếp trên một đường. Nút ⓘ hiện bảng thưởng và các đường.\n3. Tiền thắng là bội số tiền cược và được cộng dồn — tới ×{max} khi cả màn hình là biểu tượng cao nhất.',
      id: '1. Pilih taruhan lalu ketuk «Putar». Ketuk lagi untuk langsung menghentikan gulungan.\n2. 10 garis membayar dari gulungan kiri: 3, 4 atau 5 simbol sama berurutan di satu garis. Tombol ⓘ menampilkan tabel bayaran dan garis.\n3. Kemenangan adalah kelipatan taruhan dan dijumlahkan — hingga ×{max} jika layar penuh simbol teratas.',
      ru: '1. Выбери ставку и нажми «Крутить». Нажми ещё раз, чтобы сразу остановить барабаны.\n2. 10 линий платят с левого барабана: 3, 4 или 5 одинаковых символов подряд на линии. Кнопка ⓘ показывает выплаты и линии.\n3. Выигрыши кратны ставке и складываются — до ×{max}, если весь экран заполнен лучшим символом.',
      de: '1. Wähle deinen Einsatz und tippe auf „Drehen“. Nochmal tippen stoppt die Walzen sofort.\n2. 10 Linien zahlen ab der linken Walze: 3, 4 oder 5 gleiche Symbole hintereinander auf einer Linie. Der ⓘ-Knopf zeigt Gewinne und Linien.\n3. Gewinne sind Vielfache deines Einsatzes und werden addiert — bis ×{max} bei einem Bildschirm voll mit dem Top-Symbol.',
      hi: '1. अपना दांव चुनें और «स्पिन» दबाएँ। रील तुरंत रोकने के लिए फिर से दबाएँ।\n2. 10 लाइनें बाईं रील से जीतती हैं: एक लाइन पर लगातार 3, 4 या 5 एक जैसे चिह्न। ⓘ बटन जीत की तालिका और लाइनें दिखाता है।\n3. जीत आपके दांव का गुणक है और जुड़ती है — सबसे ऊँचे चिह्न से भरी स्क्रीन पर ×{max} तक।',
      zh: '1. 选择投注额，点击“旋转”。再点一次可立即停止转轴。\n2. 10 条线从最左边的转轴开始派彩：一条线上连续 3、4 或 5 个相同图案。ⓘ 按钮显示赔付表和线路。\n3. 奖金是投注额的倍数并可累加——满屏最高图案最高 ×{max}。'
    },
    L3: {
      en: '1. Choose your stake and tap “Spin”. Tap again to stop the reels at once.\n2. 5 lines pay: the 3 rows and the 2 diagonals. 3 same symbols on a line win. The ⓘ button shows the paytable.\n3. Wins are multiples of your stake and add up — up to ×{max} with a screen full of the top symbol.',
      fr: '1. Choisis ta mise et touche « Lancer ». Touche encore pour arrêter les rouleaux d’un coup.\n2. 5 lignes paient : les 3 rangées et les 2 diagonales. 3 symboles pareils sur une ligne gagnent. Le bouton ⓘ montre les gains.\n3. Les gains sont des multiples de ta mise et s’additionnent — jusqu’à ×{max} avec un écran rempli du meilleur symbole.',
      es: '1. Elige tu apuesta y toca «Girar». Toca otra vez para parar los rodillos de golpe.\n2. Pagan 5 líneas: las 3 filas y las 2 diagonales. 3 símbolos iguales en una línea ganan. El botón ⓘ muestra los premios.\n3. Los premios son múltiplos de tu apuesta y se suman — hasta ×{max} con la pantalla llena del mejor símbolo.',
      pt: '1. Escolha a aposta e toque em «Girar». Toque de novo para parar os rolos de uma vez.\n2. 5 linhas pagam: as 3 fileiras e as 2 diagonais. 3 símbolos iguais numa linha ganham. O botão ⓘ mostra os prêmios.\n3. Os prêmios são múltiplos da aposta e se somam — até ×{max} com a tela cheia do melhor símbolo.',
      ar: '1. اختر رهانك واضغط «دوران». اضغط مرة أخرى لإيقاف البكرات فورًا.\n2. تربح 5 خطوط: الصفوف الثلاثة والقطران. ثلاثة رموز متشابهة على خط تربح. زر ⓘ يعرض جدول الأرباح.\n3. الأرباح مضاعفات لرهانك وتُجمع — حتى ×{max} عندما تمتلئ الشاشة بأفضل رمز.',
      tr: '1. Bahsini seç ve «Çevir»e dokun. Makaraları hemen durdurmak için tekrar dokun.\n2. 5 çizgi öder: 3 sıra ve 2 çapraz. Bir çizgide 3 aynı sembol kazanır. ⓘ düğmesi ödeme tablosunu gösterir.\n3. Kazançlar bahsinin katlarıdır ve toplanır — ekran en iyi sembolle dolarsa ×{max}’e kadar.',
      vi: '1. Chọn mức cược rồi chạm «Quay». Chạm lần nữa để dừng cuộn ngay.\n2. 5 đường trả thưởng: 3 hàng và 2 đường chéo. 3 biểu tượng giống nhau trên một đường là thắng. Nút ⓘ hiện bảng thưởng.\n3. Tiền thắng là bội số tiền cược và được cộng dồn — tới ×{max} khi cả màn hình là biểu tượng cao nhất.',
      id: '1. Pilih taruhan lalu ketuk «Putar». Ketuk lagi untuk langsung menghentikan gulungan.\n2. 5 garis membayar: 3 baris dan 2 diagonal. 3 simbol sama di satu garis menang. Tombol ⓘ menampilkan tabel bayaran.\n3. Kemenangan adalah kelipatan taruhan dan dijumlahkan — hingga ×{max} jika layar penuh simbol teratas.',
      ru: '1. Выбери ставку и нажми «Крутить». Нажми ещё раз, чтобы сразу остановить барабаны.\n2. Платят 5 линий: 3 ряда и 2 диагонали. 3 одинаковых символа на линии выигрывают. Кнопка ⓘ показывает выплаты.\n3. Выигрыши кратны ставке и складываются — до ×{max}, если весь экран заполнен лучшим символом.',
      de: '1. Wähle deinen Einsatz und tippe auf „Drehen“. Nochmal tippen stoppt die Walzen sofort.\n2. 5 Linien zahlen: die 3 Reihen und die 2 Diagonalen. 3 gleiche Symbole auf einer Linie gewinnen. Der ⓘ-Knopf zeigt die Gewinne.\n3. Gewinne sind Vielfache deines Einsatzes und werden addiert — bis ×{max} bei einem Bildschirm voll mit dem Top-Symbol.',
      hi: '1. अपना दांव चुनें और «स्पिन» दबाएँ। रील तुरंत रोकने के लिए फिर से दबाएँ।\n2. 5 लाइनें जीतती हैं: 3 पंक्तियाँ और 2 तिरछी लाइनें। एक लाइन पर 3 एक जैसे चिह्न जीतते हैं। ⓘ बटन जीत की तालिका दिखाता है।\n3. जीत आपके दांव का गुणक है और जुड़ती है — सबसे ऊँचे चिह्न से भरी स्क्रीन पर ×{max} तक।',
      zh: '1. 选择投注额，点击“旋转”。再点一次可立即停止转轴。\n2. 5 条线派彩：3 行和 2 条对角线。一条线上 3 个相同图案即中奖。ⓘ 按钮显示赔付表。\n3. 奖金是投注额的倍数并可累加——满屏最高图案最高 ×{max}。'
    },
    S: {
      en: '1. Choose your stake and tap “Spin”.\n2. Pays anywhere: 8 or more same symbols anywhere on the screen win, then they burst and new symbols tumble down. The ⓘ button shows the paytable.\n3. Multiplier symbols (×2 to ×100) add up and multiply the win of the spin — up to ×{max}.',
      fr: '1. Choisis ta mise et touche « Lancer ».\n2. Gains partout : 8 symboles pareils ou plus, n’importe où sur l’écran, gagnent ; ils éclatent et de nouveaux symboles tombent. Le bouton ⓘ montre les gains.\n3. Les symboles multiplicateurs (×2 à ×100) s’additionnent et multiplient le gain du tour — jusqu’à ×{max}.',
      es: '1. Elige tu apuesta y toca «Girar».\n2. Paga en cualquier lugar: 8 o más símbolos iguales en cualquier parte de la pantalla ganan; luego explotan y caen símbolos nuevos. El botón ⓘ muestra los premios.\n3. Los símbolos multiplicadores (×2 a ×100) se suman y multiplican el premio del giro — hasta ×{max}.',
      pt: '1. Escolha a aposta e toque em «Girar».\n2. Paga em qualquer lugar: 8 ou mais símbolos iguais em qualquer parte da tela ganham; depois explodem e caem símbolos novos. O botão ⓘ mostra os prêmios.\n3. Os símbolos multiplicadores (×2 a ×100) se somam e multiplicam o prêmio da rodada — até ×{max}.',
      ar: '1. اختر رهانك واضغط «دوران».\n2. ربح في أي مكان: 8 رموز متشابهة أو أكثر في أي مكان على الشاشة تربح، ثم تنفجر وتسقط رموز جديدة. زر ⓘ يعرض جدول الأرباح.\n3. رموز المضاعف (×2 إلى ×100) تُجمع وتضاعف ربح الدورة — حتى ×{max}.',
      tr: '1. Bahsini seç ve «Çevir»e dokun.\n2. Her yerde öder: ekranın herhangi bir yerinde 8 veya daha fazla aynı sembol kazanır; sonra patlar ve yeni semboller düşer. ⓘ düğmesi ödeme tablosunu gösterir.\n3. Çarpan sembolleri (×2 ile ×100 arası) toplanır ve turun kazancını çarpar — ×{max}’e kadar.',
      vi: '1. Chọn mức cược rồi chạm «Quay».\n2. Thắng mọi vị trí: từ 8 biểu tượng giống nhau trở lên ở bất kỳ đâu trên màn hình là thắng, rồi chúng nổ và biểu tượng mới rơi xuống. Nút ⓘ hiện bảng thưởng.\n3. Biểu tượng hệ số (×2 đến ×100) cộng lại và nhân tiền thắng của lượt quay — tới ×{max}.',
      id: '1. Pilih taruhan lalu ketuk «Putar».\n2. Bayar di mana saja: 8 simbol sama atau lebih di mana pun di layar menang, lalu meledak dan simbol baru berjatuhan. Tombol ⓘ menampilkan tabel bayaran.\n3. Simbol pengali (×2 hingga ×100) dijumlahkan dan mengalikan kemenangan putaran — hingga ×{max}.',
      ru: '1. Выбери ставку и нажми «Крутить».\n2. Выплаты в любом месте: 8 и более одинаковых символов в любом месте экрана выигрывают, затем лопаются, и падают новые символы. Кнопка ⓘ показывает выплаты.\n3. Символы-множители (от ×2 до ×100) складываются и умножают выигрыш вращения — до ×{max}.',
      de: '1. Wähle deinen Einsatz und tippe auf „Drehen“.\n2. Gewinne überall: 8 oder mehr gleiche Symbole irgendwo auf dem Bildschirm gewinnen, dann platzen sie und neue Symbole fallen nach. Der ⓘ-Knopf zeigt die Gewinne.\n3. Multiplikator-Symbole (×2 bis ×100) werden addiert und vervielfachen den Gewinn der Drehung — bis ×{max}.',
      hi: '1. अपना दांव चुनें और «स्पिन» दबाएँ।\n2. कहीं भी जीत: स्क्रीन पर कहीं भी 8 या ज़्यादा एक जैसे चिह्न जीतते हैं, फिर वे फूटते हैं और नए चिह्न गिरते हैं। ⓘ बटन जीत की तालिका दिखाता है।\n3. गुणक चिह्न (×2 से ×100) जुड़ते हैं और स्पिन की जीत को गुणा करते हैं — ×{max} तक।',
      zh: '1. 选择投注额，点击“旋转”。\n2. 任意位置派彩：屏幕任意位置出现 8 个或以上相同图案即中奖，随后爆开，新图案落下。ⓘ 按钮显示赔付表。\n3. 倍数图案（×2 至 ×100）相加并乘以本次旋转的奖金——最高 ×{max}。'
    }
  };
  function maxOf(key) { var m = 0; (ROWS[key] || []).forEach(function (r) { if (r[0] > m) m = r[0]; }); return m; }
  function rulesFor(key) {
    var o = {}, src = RULES[THEMES[key].mode], mx = maxOf(key);
    Object.keys(src).forEach(function (lg) { o[lg] = src[lg].replace('{max}', String(mx)); });
    return o;
  }
  function mxs(v) { return '×' + String(r2(v)).replace('.', K.dec()); }
  var LEN = 14; // cells per reel ring
  var DEFS = {};
  function themeDefs(key) {
    if (DEFS[key]) return DEFS[key];
    var th = THEMES[key], B = mk('q' + key), a = th.art(B), s = '';
    a.forEach(function (m, i) { s += '<symbol id="q' + key + 's' + i + '" viewBox="0 0 100 100">' + m + '</symbol>'; });
    if (th.mode === 'S') {
      var sp = th.sp === 'orb' ? [orb(B, P.green), orb(B, P.blue), orb(B, P.purple), orb(B, P.red)] : [th.spArt(B)];
      sp.forEach(function (m, i) { s += '<symbol id="q' + key + 'p' + i + '" viewBox="0 0 100 100">' + m + '</symbol>'; });
    }
    DEFS[key] = '<defs>' + B.defs() + '</defs>' + s;
    return DEFS[key];
  }
  function symId(key, s, v) {
    if (s >= 0) return '#q' + key + 's' + s;
    return '#q' + key + 'p' + (THEMES[key].sp === 'orb' ? (v >= 25 ? 3 : v >= 10 ? 2 : v >= 5 ? 1 : 0) : 0);
  }
  function svgUse(href) { return '<svg class="s2-sy" viewBox="0 0 100 100" aria-hidden="true"><use href="' + href + '"/></svg>'; }

  /* paytable sheet (pictures + numbers only: no language needed) */
  function payTable(key) {
    var th = THEMES[key], h = '', i;
    if (th.mode === 'L5') {
      for (i = 7; i >= 0; i--) {
        if (i === 0 || i === 2) continue; // J = Q and K = A pay the same: shown in pairs
        var pp = th.pay[i], pic = svgUse(symId(key, i)) + (i === 1 || i === 3 ? svgUse(symId(key, i - 1)) : '');
        h += '<div class="s2-pr"><i>' + pic + '</i><b class="fit" dir="ltr">5 ' + mxs(pp[2]) + ' · 4 ' + mxs(pp[1]) + ' · 3 ' + mxs(pp[0]) + '</b></div>';
      }
      var mini = LINES5.map(function (ln, li) {
        var d = ln.map(function (r, c) { return (c ? 'L' : 'M') + (c * 10 + 5) + ' ' + (r * 10 + 5); }).join('');
        return '<svg viewBox="0 0 50 30" aria-hidden="true"><rect x=".5" y=".5" width="49" height="29" rx="4" fill="rgba(0,0,0,.35)" stroke="rgba(255,255,255,.2)"/><path d="' + d + '" stroke="' + LCOL[li] + '" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      }).join('');
      return '<div class="s2-pg s2-pg5">' + h + '</div><div class="s2-pl">' + mini + '</div>';
    }
    if (th.mode === 'L3') {
      for (i = 6; i >= 0; i--) h += '<div class="s2-pr"><i>' + svgUse(symId(key, i)) + svgUse(symId(key, i)) + svgUse(symId(key, i)) + '</i><b class="fit" dir="ltr">' + mxs(th.pay[i]) + '</b></div>';
      var mini3 = LINES3.map(function (ln, li) {
        var d = ln.map(function (r, c) { return (c ? 'L' : 'M') + (c * 10 + 5) + ' ' + (r * 10 + 5); }).join('');
        return '<svg viewBox="0 0 30 30" aria-hidden="true"><rect x=".5" y=".5" width="29" height="29" rx="4" fill="rgba(0,0,0,.35)" stroke="rgba(255,255,255,.2)"/><path d="' + d + '" stroke="' + LCOL[li] + '" stroke-width="3" fill="none" stroke-linecap="round"/></svg>';
      }).join('');
      return '<div class="s2-pg s2-pg3">' + h + '<div class="s2-pr"><i>' + svgUse(symId(key, 6)) + '</i><b class="fit" dir="ltr">9 → ' + mxs(maxOf(key)) + '</b></div></div><div class="s2-pl">' + mini3 + '</div>';
    }
    for (i = 7; i >= 0; i--) h += '<div class="s2-pr"><i>' + svgUse(symId(key, i)) + '</i><b class="fit" dir="ltr">12+ ' + mxs(PAYS[i][2]) + ' · 10 ' + mxs(PAYS[i][1]) + ' · 8 ' + mxs(PAYS[i][0]) + '</b></div>';
    return '<div class="s2-pg s2-pgs">' + h + '<div class="s2-pr s2-prw"><i>' + svgUse(symId(key, -1, 2)) + svgUse(symId(key, -1, 50)) + '</i><b class="fit" dir="ltr">×2 … ×100 → ' + mxs(maxOf(key)) + '</b></div></div>';
  }

  /* small strip of the 4 best symbols under the machine (portrait screens with spare height) */
  function miniPay(key) {
    var th = THEMES[key], h = '', top = th.mode === 'L3' ? 6 : 7;
    for (var i = top; i > top - 4; i--) {
      var v = th.mode === 'L5' ? th.pay[i][2] : th.mode === 'L3' ? th.pay[i] : PAYS[i][2];
      h += '<span><i>' + svgUse(symId(key, i)) + '</i><b class="fit" dir="ltr">' + (th.mode === 'L5' ? '5 ' : th.mode === 'S' ? '12+ ' : '') + mxs(v) + '</b></span>';
    }
    return '<div class="s2-mini" dir="ltr" hidden>' + h + '</div>';
  }
  function game(key) {
    return function (box) {
      var th = THEMES[key], l = L(), lite = document.documentElement.classList.contains('oro-lite');
      var mode = th.mode, cols = colsOf(th), rows = rowsOf(th), isS = mode === 'S', lk = th.look, MAX = maxOf(key);
      box.classList.add('cg-game', 'cg-slots2', 's2-' + mode.toLowerCase());
      var inner = '';
      if (isS) inner = '<div class="s2-grid"></div>';
      else {
        for (var r0 = 0; r0 < cols; r0++) {
          var cl = ''; for (var c0 = 0; c0 < LEN + 3; c0++) cl += '<i class="s2-c">' + svgUse('#') + '</i>';
          inner += '<div class="s2-reel"><div class="s2-strip" style="height:' + ((LEN + 3) / 3 * 100) + '%">' + cl + '</div></div>';
        }
        inner = '<div class="s2-reels" style="grid-template-columns:repeat(' + cols + ',minmax(0,1fr))">' + inner + '</div>';
      }
      box.innerHTML = '<div class="cg-stage s2-stage" style="--a1:' + lk[0] + ';--a2:' + lk[1] + ';--f1:' + lk[2] + ';--f2:' + lk[3] + ';--rb:' + lk[4] + '">' +
        '<svg class="s2-defs" width="0" height="0" aria-hidden="true" focusable="false">' + themeDefs(key) + '</svg>' +
        '<svg class="s2-hill" viewBox="0 0 400 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' + th.hill + '</svg>' +
        '<div class="s2-bar"><span class="s2-stat"><b class="fit"></b></span><button type="button" class="s2-ib" aria-label="i"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 11v6M12 7.2v.1"/></svg></button></div>' +
        '<div class="s2-host"><div class="s2-mach" dir="ltr"><div class="s2-win">' + inner +
        '<svg class="s2-lines" viewBox="0 0 ' + cols * 100 + ' ' + rows * 100 + '" preserveAspectRatio="none" aria-hidden="true"></svg></div></div>' + miniPay(key) + '</div>' +
        '<div class="s2-big" hidden><i class="s2-rays"></i><i class="s2-glow"></i><b class="s2-bigv fit" dir="ltr"></b><div class="s2-coins"></div></div>' +
        '<div class="s2-pt" hidden><div class="s2-ptin" dir="ltr">' + payTable(key) + '</div></div>' +
        '</div>' + K.stakePanel(l.spin);
      K.bindStake(box);
      var stage = box.querySelector('.s2-stage'), host = box.querySelector('.s2-host'), mach = box.querySelector('.s2-mach'), win = box.querySelector('.s2-win');
      var mini = box.querySelector('.s2-mini'), linesSvg = box.querySelector('.s2-lines'), statB = box.querySelector('.s2-stat b'), big = box.querySelector('.s2-big'), pt = box.querySelector('.s2-pt');
      var go = $('csGo');
      function stat(word, v) {
        statB.innerHTML = (word ? '<span>' + K.esc(word) + '</span> ' : '') + '<em dir="ltr">' + K.esc(v) + '</em>';
        K.fitEl(statB);
      }
      function idle() { stat(l.max, mxs(MAX)); stage.classList.remove('s2-won'); }
      idle();
      box.querySelector('.s2-ib').addEventListener('click', function () { pt.hidden = !pt.hidden; if (!pt.hidden) K.fitAll(pt); });
      pt.addEventListener('click', function () { pt.hidden = true; });

      /* the machine keeps its proportions and fills the free space */
      var cw = 60, ch = 60, fitT = 0;
      function fit() {
        if (!mach.isConnected) { if (ro) ro.disconnect(); return; }
        var W = host.clientWidth, H0 = host.clientHeight, H = H0; if (!W || !H) return;
        var pad = Math.max(5, Math.min(14, W * 0.022));
        // spare height (portrait phones): the strip of best symbols goes under the machine
        var cw0 = Math.min((W - 2 * pad) / cols, isS ? 120 : 150), need = rows * cw0 * (isS ? 1 : 1.12) + 2 * pad, mH = Math.min(58, Math.max(40, W * 0.12));
        var showMini = H - need > mH + 24 && W >= 320;
        mini.hidden = !showMini; if (showMini) H = H - mH - 12;
        cw = Math.min((W - 2 * pad) / cols, (H - 2 * pad) / rows / 0.8, isS ? 120 : 150);
        ch = Math.min((H - 2 * pad) / rows, cw * (isS ? 1.0 : 1.12));
        var mh = rows * ch + 2 * pad;
        mach.style.width = (cols * cw + 2 * pad) + 'px'; mach.style.height = mh + 'px';
        if (showMini) {
          var y0 = Math.max(0, (H0 - mh - mH - 12) / 2);
          mach.style.top = (y0 + mh / 2) + 'px'; mini.style.top = (y0 + mh + 12) + 'px'; mini.style.height = mH + 'px'; mini.style.setProperty('--mh', mH + 'px'); mini.style.width = Math.min(W, cols * cw + 2 * pad) + 'px';
          K.fitAll(mini); clearTimeout(fitT); fitT = setTimeout(function () { if (mini.isConnected) K.fitAll(mini); }, 400);
        } else mach.style.top = '50%';
        mach.style.setProperty('--pad', pad + 'px'); mach.style.setProperty('--cw', cw + 'px'); mach.style.setProperty('--ch', ch + 'px');
      }
      var ro = window.ResizeObserver ? new ResizeObserver(fit) : null;
      if (ro) ro.observe(host); else window.addEventListener('resize', fit);
      fit();

      var busy = false, slam = false, res = null;
      function wait(ms) { return new Promise(function (ok) { setTimeout(ok, slam ? ms * 0.4 : ms); }); }
      function clearWin() {
        clearInterval(K.S.timer); K.S.timer = 0;
        box.querySelectorAll('.win,.hot').forEach(function (c) { c.classList.remove('win', 'hot'); });
        mach.classList.remove('dim', 'won');
        linesSvg.innerHTML = '';
        var t = stage.querySelectorAll('.cs-toast'); for (var i = 0; i < t.length; i++) t[i].remove();
      }

      /* ------------------------------------------------ reels (line games) */
      var reels = [];
      if (!isS) {
        reels = Array.prototype.map.call(box.querySelectorAll('.s2-reel'), function (el) {
          var strip = el.firstChild, cells = strip.children, R = { el: el, strip: strip, cells: cells, ks: [], pos: 0, v: 0, mode: 'idle', stopAt: 0 };
          for (var j = 0; j < LEN; j++) put(R, j, rnd(mode === 'L3' ? 7 : 8));
          return R;
        });
        var g0 = compose(key, 0).g;
        reels.forEach(function (R, i) { for (var r = 0; r < 3; r++) put(R, r, g0[i][r]); draw(R); });
      }
      function put(R, j, k) {
        j = ((j % LEN) + LEN) % LEN; R.ks[j] = k;
        R.cells[j].firstChild.firstChild.setAttribute('href', symId(key, k));
        if (j < 3) R.cells[j + LEN].firstChild.firstChild.setAttribute('href', symId(key, k));
      }
      function draw(R) { var p = ((R.pos % LEN) + LEN) % LEN; R.strip.style.transform = 'translate3d(0,' + (-p / (LEN + 3) * 100).toFixed(3) + '%,0)'; }
      function land(R, col) { var t = Math.floor(R.pos) + 4 + (R.mode === 'spin' ? 1 : 0); for (var r = 0; r < 3; r++) put(R, t + r, col[r]); return t; }
      function easeBack(k) { var c1 = 1.1, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); }
      var last = 0, SPEED = 26, onStop = null;
      function loop(now) {
        if (!box.isConnected) return;
        var dt = Math.min(0.05, (now - last) / 1000); last = now;
        var moving = false;
        reels.forEach(function (R, i) {
          if (R.mode === 'spin') {
            R.v = Math.min(SPEED, R.v + SPEED * dt * 6);
            R.pos += R.v * dt; if (R.pos >= LEN) R.pos -= LEN;
            moving = true;
            if (res && now >= R.stopAt) {
              R.p0 = R.pos; R.P = land(R, res.g[i]);
              R.t0 = now; R.d = Math.max(220, 3.6 * (R.P - R.p0) / SPEED * 1000 * (slam ? 0.55 : 1));
              R.mode = 'stop';
            }
          } else if (R.mode === 'stop') {
            moving = true;
            var k = Math.min(1, (now - R.t0) / R.d);
            R.pos = R.p0 + (R.P - R.p0) * easeBack(k);
            if (k > 0.5) R.strip.classList.remove('blur');
            if (k >= 1) { R.pos = R.P % LEN; R.mode = 'idle'; K.sfx('stop'); R.el.classList.add('thud'); setTimeout(function () { R.el.classList.remove('thud'); }, 240); }
          }
          draw(R);
          var fp = Math.floor(R.pos); if (R.mode !== 'idle' && fp !== R.fp) K.sfx('tick'); R.fp = fp; // v2832 : tic des symboles qui défilent
        });
        if (moving) K.S.raf = requestAnimationFrame(loop); else if (onStop) { var f = onStop; onStop = null; f(); }
      }
      function cellAt(c, r) { var R = reels[c]; return R.cells[Math.round(R.pos) % LEN + r]; }
      function linePath(li) {
        var ln = linesOf(th)[li], pts = ln.map(function (r, c) { return [c * 100 + 50, r * 100 + 50]; });
        pts.unshift([0, pts[0][1]]); pts.push([cols * 100, pts[pts.length - 1][1]]);
        var d = 'M' + pts.map(function (q) { return q[0] + ' ' + q[1]; }).join('L');
        return '<path d="' + d + '" class="s2-lg"/><path d="' + d + '" class="s2-lp" stroke="' + LCOL[li] + '"/>';
      }
      async function spinLines(r) {
        var t0 = performance.now();
        res = null;
        reels.forEach(function (R) { R.mode = 'spin'; R.v = 0; R.stopAt = Infinity; if (!lite) R.strip.classList.add('blur'); });
        last = t0; cancelAnimationFrame(K.S.raf || 0); K.S.raf = requestAnimationFrame(loop);
        var stopped = new Promise(function (ok) { onStop = ok; });
        r = await r;
        if (!box.isConnected) return null;
        var c = r ? compose(key, rowIndex(r)) : { g: lossL(th), w: [] };
        res = c;
        var base = Math.max(performance.now(), t0 + (slam ? 200 : 600)), gap = slam ? 70 : (mode === 'L3' ? 380 : 230);
        reels.forEach(function (R, i) { R.stopAt = base + i * gap; });
        // anticipation: the last reel turns longer when a big line is coming
        if (!slam && c.w.length && c.w[0].n >= 4 && mode === 'L5') reels[4].stopAt += 650;
        await stopped;
        reels.forEach(function (R) { R.strip.classList.remove('blur'); });
        if (!box.isConnected || !r) return r;
        if (c.w.length) {
          var all = '', cells = {};
          c.w.forEach(function (w) {
            all += linePath(w.l);
            for (var k = 0; k < w.n; k++) { var cc = cellAt(k, linesOf(th)[w.l][k]); cells[k + ':' + linesOf(th)[w.l][k]] = cc; }
          });
          linesSvg.innerHTML = all;
          Object.keys(cells).forEach(function (q) { cells[q].classList.add('win'); });
          mach.classList.add('dim', 'won'); stage.classList.add('s2-won');
          stat(l.win, mxs(r2(c.w.reduce(function (a, w) { return a + w.m; }, 0))));
          if (c.w.length > 1 && c.w.length < 10) { // the lines then show one after the other
            var q = 0;
            K.S.timer = setInterval(function () {
              if (!box.isConnected) { clearInterval(K.S.timer); return; }
              var w = c.w[q++ % c.w.length]; linesSvg.innerHTML = linePath(w.l);
              box.querySelectorAll('.s2-c.win').forEach(function (e) { e.classList.remove('win'); });
              for (var k = 0; k < w.n; k++) cellAt(k, linesOf(th)[w.l][k]).classList.add('win');
            }, 1300);
          }
          await wait(500);
        }
        return r;
      }

      /* ------------------------------------------------ pays-anywhere grid (tumble) */
      var gridEl = box.querySelector('.s2-grid'), G = [];
      function cellPos(o, c, r) { o.c = c; o.r = r; o.el.style.left = (c * 100 / cols) + '%'; o.el.style.top = (r * 100 / rows) + '%'; }
      function setSym(o, s, v) {
        o.s = s; o.v = v || 0; o.use.setAttribute('href', symId(key, s, v));
        o.el.classList.toggle('sp', s < 0); o.lab.textContent = s < 0 ? '×' + v : '';
      }
      function anim(el, kf, o) {
        if (!el.animate) return { finished: Promise.resolve(), cancel: function () {} };
        var a = el.animate(kf, o); if (!a.finished) a.finished = new Promise(function (ok) { a.onfinish = ok; });
        return a;
      }
      if (isS) {
        var gh = '';
        for (var gc = 0; gc < cols; gc++) for (var gr = 0; gr < rows; gr++) gh += '<div class="s2-g" style="width:' + (100 / cols) + '%;height:' + (100 / rows) + '%">' + svgUse('#') + '<b class="s2-v"></b></div>';
        gridEl.innerHTML = gh;
        var els = gridEl.children, start = compose(key, 0);
        for (var c1 = 0; c1 < cols; c1++) {
          G.push([]);
          for (var r1 = 0; r1 < rows; r1++) {
            var e1 = els[c1 * rows + r1], o1 = { el: e1, use: e1.firstChild.firstChild, lab: e1.lastChild, a: null };
            cellPos(o1, c1, r1); setSym(o1, start.g[c1][r1], start.vals[c1 + ':' + r1]); G[c1].push(o1);
          }
        }
      }
      function setA(o, a) { if (o.a) o.a.cancel(); o.a = a; return a.finished; }
      var cascN = 0;
      async function spinGrid(r) {
        var t0 = performance.now(), fall = []; cascN = 0;
        G.forEach(function (col, c) {
          col.forEach(function (o) {
            fall.push(setA(o, anim(o.el, [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(' + (rows * 100 + 40) + '%)', opacity: 1 }],
              { duration: 300, delay: c * 45, easing: 'cubic-bezier(.5,0,.9,.6)', fill: 'forwards' })));
          });
        });
        r = await r;
        if (!box.isConnected) return null;
        var c = r ? compose(key, rowIndex(r)) : composeS(th, null);
        await Promise.all(fall);
        var land2 = [];
        G.forEach(function (col, ci) { setTimeout(function () { if (box.isConnected) K.sfx('stop', { as: 'thunk' }); }, (slam ? 20 : 75) * ci + (slam ? 170 : 330)); }); // v2832 : chaque colonne se pose
        G.forEach(function (col, ci) {
          col.forEach(function (o, ri) {
            setSym(o, c.g[ci][ri], c.vals[ci + ':' + ri]);
            land2.push(setA(o, anim(o.el, [{ transform: 'translateY(-' + (rows * 100 + 20) + '%)' }, { transform: 'translateY(0)' }],
              { duration: slam ? 220 : 430, delay: (slam ? 20 : 75) * ci + (rows - 1 - ri) * (slam ? 10 : 28), easing: 'cubic-bezier(.3,1.25,.55,1)', fill: 'backwards' })));
          });
        });
        await Promise.all(land2);
        if (!box.isConnected || !r) return r;
        if (!c.w.length) return r;
        // the winning symbols glow, burst, and the grid tumbles
        var winS = {}; c.w.forEach(function (w) { winS[w.s] = 1; });
        G.forEach(function (col) { col.forEach(function (o) { if (o.s >= 0 && winS[o.s]) o.el.classList.add('win'); }); });
        mach.classList.add('dim', 'won'); stage.classList.add('s2-won');
        stat(l.win, mxs(c.base));
        await wait(950);
        if (!box.isConnected) return r;
        var pops = [];
        G.forEach(function (col) { col.forEach(function (o) {
          if (!o.el.classList.contains('win')) return;
          pops.push(setA(o, anim(o.el, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.3)', opacity: 1, offset: 0.35 }, { transform: 'scale(.1)', opacity: 0 }],
            { duration: 320, easing: 'ease-in', fill: 'forwards' })));
        }); });
        if (!lite) burst();
        K.sfx('reveal', { as: 'gem', k: (cascN = (cascN || 0) + 1) }); // v2832 : chaque cascade sonne un peu plus haut
        await Promise.all(pops);
        if (!box.isConnected) return r;
        mach.classList.remove('dim');
        var drops = [];
        G = G.map(function (col, ci) {
          var kept = col.filter(function (o) { return !o.el.classList.contains('win'); }), gone = col.filter(function (o) { return o.el.classList.contains('win'); });
          var nc = [], mv = c.moves[ci], nNew = gone.length;
          mv.forEach(function (m) {
            var o = m.from < 0 ? gone.shift() : col[m.from];
            o.el.classList.remove('win');
            if (m.from < 0) setSym(o, c.after[ci][m.to]);
            var dist = m.from < 0 ? (nNew + 0.3) * 100 : (m.to - m.from) * 100;
            cellPos(o, ci, m.to); nc[m.to] = o;
            if (dist > 0) drops.push(setA(o, anim(o.el, [{ transform: 'translateY(-' + dist + '%)', opacity: 1 }, { transform: 'translateY(0)', opacity: 1 }],
              { duration: 360, delay: ci * 40 + (m.from < 0 ? 90 : 0), easing: 'cubic-bezier(.3,1.25,.55,1)', fill: 'backwards' })));
            else if (o.a) { o.a.cancel(); o.a = null; }
          });
          void kept;
          return nc;
        });
        await Promise.all(drops);
        if (!box.isConnected) return r;
        if (c.M > 1) { // multiplier orbs light up and add up
          G.forEach(function (col) { col.forEach(function (o) { if (o.s < 0) o.el.classList.add('hot'); }); });
          stat('', mxs(c.base) + ' × ' + c.M);
          await wait(1100);
          stat(l.win, mxs(r2(c.base * c.M)));
        }
        return r;
      }
      function burst() {
        var b = document.createElement('div'); b.className = 's2-burst';
        var h = '';
        G.forEach(function (col) { col.forEach(function (o) {
          if (!o.el.classList.contains('win')) return;
          for (var i = 0; i < 3; i++) h += '<i style="left:' + ((o.c + 0.5) * 100 / cols).toFixed(2) + '%;top:' + ((o.r + 0.5) * 100 / rows).toFixed(2) + '%;--x:' + (rnd(80) - 40) + 'px;--y:' + (rnd(80) - 50) + 'px"></i>';
        }); });
        b.innerHTML = h; win.appendChild(b);
        setTimeout(function () { if (b.parentNode) b.remove(); }, 700);
      }

      /* ------------------------------------------------ big win (wordless count-up, coins) */
      function bigWin(m) {
        return new Promise(function (done) {
          var tier = m >= 200 ? 'epic' : m >= 50 ? 'mega' : 'big', v = big.querySelector('.s2-bigv'), dur = lite ? 900 : Math.min(4200, 1500 + Math.log(m) / Math.LN10 * 900), t0 = performance.now(), fin = false;
          big.className = 's2-big ' + tier; big.hidden = false;
          if (!lite) coins(tier === 'big' ? 18 : tier === 'mega' ? 30 : 42);
          function end() {
            if (fin) return; fin = true; K.setText(v, mxs(m)); big.classList.add('done');
            setTimeout(function () { big.classList.add('out'); setTimeout(function () { big.hidden = true; big.className = 's2-big'; big.querySelector('.s2-coins').innerHTML = ''; done(); }, 350); }, 1100);
          }
          big.onclick = end;
          (function step(now) {
            if (!box.isConnected) { done(); return; }
            if (fin) return;
            var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 2.2);
            K.sfxBeat(big, 'cnt', Math.floor(e * 9), 'rise', { n: Math.floor(e * 9) }); // v2832 : le compteur monte en notes
            v.textContent = '×' + (m * e).toFixed(2).replace('.', K.dec()); if (k >= 1) { end(); return; }
            K.S.raf = requestAnimationFrame(step);
          })(t0);
          K.fitEl(v);
        });
      }
      function coins(n) {
        var wrap = big.querySelector('.s2-coins'), h = '';
        for (var i = 0; i < n; i++) h += '<i style="left:' + (3 + Math.random() * 94).toFixed(1) + '%;--d:' + (1 + Math.random() * 1.1).toFixed(2) + 's;--w:' + (Math.random() * 1.2).toFixed(2) + 's;--r:' + rnd(720) + 'deg"></i>';
        wrap.innerHTML = h;
      }

      /* ------------------------------------------------ play */
      function rowIndex(r) {
        var rows2 = ROWS[key] || [], i = r.view && typeof r.view.i === 'number' ? r.view.i : -1;
        if (rows2[i] && Math.abs(rows2[i][0] - r.mult) < 1e-9) return i;
        for (var j = 0; j < rows2.length; j++) if (Math.abs(rows2[j][0] - r.mult) < 1e-9) return j; // (old cached table: same payout, other picture)
        return 0;
      }
      go.addEventListener('click', async function () {
        if (busy) { // 2nd tap = quick stop
          if (!slam) { slam = true; if (res) { var t = performance.now(); reels.forEach(function (R, i) { if (R.mode === 'spin') R.stopAt = Math.min(R.stopAt, t + i * 70); }); } }
          return;
        }
        if (K.guest()) { K.play(key, {}); return; }
        busy = true; slam = false; pt.hidden = true; clearWin(); idle();
        go.classList.add('stop'); go.innerHTML = '<svg class="s2-sq" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2.5"/></svg>';
        var p = K.play(key, {}), r = isS ? await spinGrid(p) : await spinLines(p);
        if (!box.isConnected) return;
        if (r && r.mult >= 10) await bigWin(r.mult);
        if (!box.isConnected) return;
        busy = false; go.classList.remove('stop'); go.innerHTML = ''; K.setText(go, l.spin);
        if (!r) { idle(); return; }
        if (!(r.win > 0)) idle();
        K.resultLine(box, r);
      });
    };
  }

  ORDER.forEach(function (k) { K.register(k, game(k), { rules: rulesFor(k) }); });
})(window.D6 = window.D6 || {});
