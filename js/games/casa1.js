/* casa1 (owner request, round 6) — 12 video slots on one small engine, each with its own theme, art and machine kind:
   L5  5 reels × 3 rows, 10 lines, 3-4-5 from the left + golden scatters anywhere (Scarab Sun, Gold Train, Safari King, Medusa) ;
   W5  5 × 3, 243 ways: same symbol on neighbouring reels from the left, 2 on a reel = ×2 (Kraken Deep, Viking Raid, Pumpkin Night) ;
   A   pays anywhere: enough of a symbol anywhere on the grid (UFO Invasion 5×4, Ruby Mine 6×5) ;
   R33 3 × 3, 5 lines (Donut Shop, Koi Fortune) ;  R3  classic 3 reels, 1 line, cherries pay (Cherry Bar).
   The server draws the line (casino_ext/casa.php, same ROWS rule as here); the screen is built to pay EXACTLY that line and a
   losing screen never shows a winning combination (each grid is checked by the same evaluator). All symbols are SVG drawn here. */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit, $ = K ? K.$ : null;
  var GONE = { gone: 1 };
  function lite() { return document.documentElement.classList.contains('oro-lite'); }
  function Lx(T) { return Object.assign({}, T.en, T[K.lang()] || {}); }
  function xm(v) { return '×' + String(v).replace('.', K.dec()); }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function r2(v) { return Math.round(v * 100) / 100; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function wait(box, ms) { return K.sleep(lite() ? Math.round(ms * 0.6) : ms).then(function () { if (!box.isConnected) throw GONE; }); }
  function amb(k, on, x) { try { if (D6.Sfx && D6.Sfx.amb) D6.Sfx.amb(k, on, x); } catch (e) { /* ignore */ } }
  function snd(ev, a, k) { try { if (D6.Sfx && D6.Sfx.play) D6.Sfx.play(ev, a, k); } catch (e) { /* ignore */ } }

  /* ====================================================================== drawing kit */
  function hx(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function mix(a, b, t) { var A = hx(a), B = hx(b); return '#' + A.map(function (v, i) { var x = Math.round(v + (B[i] - v) * t); return (x < 16 ? '0' : '') + x.toString(16); }).join(''); }
  function stops(s) { return s.map(function (c, i) { return '<stop offset="' + (i / (s.length - 1)).toFixed(2) + '" stop-color="' + c + '"/>'; }).join(''); }
  function mk(p) {
    var n = 0, d = '';
    return {
      lg: function (s, dir) { var id = p + (n++).toString(36); d += '<linearGradient id="' + id + '" x1="0" y1="0" ' + (dir === 'h' ? 'x2="1" y2="0"' : dir === 'd' ? 'x2="1" y2="1"' : 'x2="0" y2="1"') + '>' + stops(s) + '</linearGradient>'; return 'url(#' + id + ')'; },
      rg: function (s, cx, cy, r) { var id = p + (n++).toString(36); d += '<radialGradient id="' + id + '" cx="' + (cx || '38%') + '" cy="' + (cy || '32%') + '" r="' + (r || '70%') + '">' + stops(s) + '</radialGradient>'; return 'url(#' + id + ')'; },
      defs: function () { return d; }
    };
  }
  function sp(x, y, s, o) { return '<path d="M' + x + ' ' + (y - s) + 'Q' + x + ' ' + y + ' ' + (x + s) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y + s) + 'Q' + x + ' ' + y + ' ' + (x - s) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y - s) + 'z" fill="#fff"' + (o ? ' opacity="' + o + '"' : '') + '/>'; }
  function gl(cx, cy, rx, ry, rot, o) { return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="#fff" opacity="' + (o || 0.5) + '"' + (rot ? ' transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')"' : '') + '/>'; }
  function shd(w) { return '<ellipse cx="50" cy="92" rx="' + (w || 30) + '" ry="5" fill="#000" opacity=".25"/>'; }
  var RC = ' stroke-linecap="round" stroke-linejoin="round"';
  // royal letters, engraved, in the theme colours
  function royal(B, ch, c) {
    var sz = ch.length > 1 ? 54 : 70, y = ch.length > 1 ? 70 : 76;
    return '<text x="50" y="' + (y + 3) + '" text-anchor="middle" font-family="Georgia,\'Times New Roman\',serif" font-weight="900" font-size="' + sz + '" fill="#000" opacity=".3">' + ch + '</text>' +
      '<text x="50" y="' + y + '" text-anchor="middle" font-family="Georgia,\'Times New Roman\',serif" font-weight="900" font-size="' + sz + '" fill="' + B.lg(c) + '" stroke="' + mix(c[2], '#000000', 0.45) + '" stroke-width="3" paint-order="stroke"' + RC + '>' + ch + '</text>' + sp(76, 24, 6, 0.9);
  }
  // faceted gem (light from the top-left) from a polygon
  function ngon(n, rx, ry, rot, cx, cy) { var p = []; for (var i = 0; i < n; i++) { var a = (rot + i * 360 / n) * Math.PI / 180; p.push([cx + rx * Math.sin(a), cy - ry * Math.cos(a)]); } return p; }
  function gem(B, o, c) {
    var n = o.length, cx = 0, cy = 0; o.forEach(function (q) { cx += q[0] / n; cy += q[1] / n; });
    var I = o.map(function (q) { return [cx + (q[0] - cx) * 0.55, cy - 3 + (q[1] - cy) * 0.55]; }), f = function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); };
    var s = '<polygon points="' + o.map(function (q) { return q[0].toFixed(1) + ',' + (q[1] + 4).toFixed(1); }).join(' ') + '" fill="#000" opacity=".25"/>';
    for (var i = 0; i < n; i++) {
      var j = (i + 1) % n, mx = (o[i][0] + o[j][0]) / 2 - cx, my = (o[i][1] + o[j][1]) / 2 - cy, l = Math.sqrt(mx * mx + my * my) || 1, t = 0.5 + 0.5 * ((mx / l) * 0.6 + (my / l) * 0.8);
      s += '<polygon points="' + [o[i], o[j], I[j], I[i]].map(f).join(' ') + '" fill="' + (t < 0.5 ? mix(c[0], c[1], t * 2) : mix(c[1], c[2], (t - 0.5) * 2)) + '"/>';
    }
    return s + '<polygon points="' + I.map(f).join(' ') + '" fill="' + B.rg([c[0], c[1], mix(c[1], c[2], 0.4)]) + '"/><polygon points="' + o.map(f).join(' ') + '" fill="none" stroke="' + mix(c[2], '#000000', 0.3) + '" stroke-width="2.2" stroke-linejoin="round"/>' +
      sp(Math.round(cx - 13), Math.round(cy - 14), 7);
  }
  function coinS(B, c, inner) {
    return '<circle cx="50" cy="54" r="38" fill="#000" opacity=".25"/><circle cx="50" cy="50" r="38" fill="' + B.lg(c) + '" stroke="' + mix(c[2], '#000000', 0.3) + '" stroke-width="2.4"/>' +
      '<circle cx="50" cy="50" r="29" fill="' + B.rg([c[0], c[1], mix(c[1], c[2], 0.5)]) + '" stroke="' + c[2] + '" stroke-width="2"/>' + (inner || '') + '<path d="M22 36a31 31 0 0 1 20-20" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".6"/>';
  }
  var GOLD = ['#FFF4C2', '#FBBF24', '#92400E'], LAPIS = ['#C7D7FF', '#2563EB', '#172554'], TURQ = ['#CCFBF1', '#14B8A6', '#134E4A'], RUBY = ['#FFD1D9', '#E11D48', '#6B0F24'],
    EMER = ['#D1FAE5', '#10B981', '#064E3B'], AMET = ['#F1E3FF', '#A855F7', '#3B0764'], SILV = ['#FFFFFF', '#C7CFDB', '#4B5563'], ORNG = ['#FFE7C7', '#F97316', '#7C2D12'];

  /* ====================================================================== themes */
  // pays/scat MUST be the same as casino_ext/casa.php (scripts/test-cg-casa.php compares them)
  var TH = {
    scarab: { kind: 'L5', pays: [[6, 30, 200], [4, 15, 80], [3, 10, 40], [2, 6, 20], [1.2, 4, 12], [0.6, 2, 8], [0.4, 1.5, 5]], scat: [10, 50],
      bg: 'radial-gradient(90% 60% at 50% 0%,rgba(251,191,36,.35),transparent 70%),linear-gradient(180deg,#3B1D0B,#1C1027)', fr: ['#FDE68A', '#B45309', '#451A03'], cell: '#2A1708',
      art: function (B) {
        return [
          // winged sun
          shd(36) + '<path d="M50 50C34 38 16 36 4 40c10 4 16 8 20 14-8-1-14 1-18 4 12 2 22 2 30-2zM50 50c16-12 34-14 46-10-10 4-16 8-20 14 8-1 14 1 18 4-12 2-22 2-30-2z" fill="' + B.lg(GOLD) + '" stroke="#78350F" stroke-width="1.6"/>' +
            '<circle cx="50" cy="44" r="17" fill="' + B.rg(['#FFF7D6', '#F59E0B', '#B91C1C']) + '" stroke="#78350F" stroke-width="2"/><path d="M38 66q12 8 24 0" stroke="' + B.lg(LAPIS) + '" stroke-width="6" fill="none" stroke-linecap="round"/>' + gl(44, 38, 6, 3.5, -30) + sp(78, 22, 6),
          // Anubis head
          shd(26) + '<path d="M34 90V64l-6-10 4-38 12 22h12l12-22 4 38-6 10v26z" fill="' + B.lg(['#4B5563', '#1F2937', '#030712']) + '" stroke="#FBBF24" stroke-width="2"/>' +
            '<path d="M36 70h28v6H36zM36 80h28v6H36z" fill="' + B.lg(LAPIS) + '"/><path d="M40 52l8 2M60 52l-8 2" stroke="#FDE68A" stroke-width="3"' + RC + '/><path d="M44 64l6 6 6-6" fill="#111827" stroke="#FBBF24" stroke-width="1.4"/>' + gl(40, 30, 3, 8, 15, 0.3),
          // Bastet cat
          shd(22) + '<path d="M36 90c-4-18 0-30 6-36-4-6-6-16-4-30l8 10h8l8-10c2 14 0 24-4 30 8 6 12 18 8 36z" fill="' + B.lg(['#57534E', '#1C1917', '#0C0A09']) + '" stroke="#FBBF24" stroke-width="1.6"/>' +
            '<path d="M38 58q12 8 24 0" stroke="' + B.lg(GOLD) + '" stroke-width="5" fill="none"/><circle cx="50" cy="66" r="4" fill="' + B.lg(TURQ) + '"/><path d="M44 38l3 1M56 38l-3 1" stroke="#34D399" stroke-width="3"' + RC + '/><path d="M64 84q14-6 10-20" stroke="#1C1917" stroke-width="5" fill="none" stroke-linecap="round"/>',
          // pyramid with sun
          shd(38) + '<circle cx="72" cy="26" r="11" fill="' + B.rg(['#FFF7D6', '#F59E0B', '#C2410C']) + '"/><path d="M50 18L90 88H10z" fill="' + B.lg(['#FDE68A', '#D97706', '#78350F'], 'd') + '" stroke="#78350F" stroke-width="2"/>' +
            '<path d="M50 18L62 88H90z" fill="#78350F" opacity=".35"/><path d="M30 62h40M22 76h56M38 48h24" stroke="#78350F" stroke-width="1.4" opacity=".5"/><path d="M50 18l-5 9h10z" fill="#FFF7D6"/>',
          royal(B, 'A', LAPIS), royal(B, 'K', TURQ), royal(B, 'Q', ['#FFE4C7', '#EA580C', '#7C2D12']),
          // scatter: golden scarab
          '<circle cx="50" cy="50" r="44" fill="' + B.rg(['#FFF7D6', '#FBBF24', '#7C2D12'], '50%', '50%', '60%') + '" opacity=".35"/>' + '<path d="M50 22c-14 0-22 12-22 30s10 30 22 30 22-12 22-30-8-30-22-30z" fill="' + B.lg(GOLD, 'd') + '" stroke="#78350F" stroke-width="2"/>' +
            '<path d="M50 34V82M28 50h44" stroke="#78350F" stroke-width="2"/><path d="M40 22q10-12 20 0" fill="' + B.lg(TURQ) + '" stroke="#78350F" stroke-width="1.6"/>' +
            '<path d="M28 40L12 30M28 58L10 60M30 74L16 86M72 40l16-10M72 58l18 2M70 74l14 12" stroke="#78350F" stroke-width="3"' + RC + '/>' + gl(40, 44, 6, 12, 20, 0.45) + sp(80, 18, 7) + sp(18, 80, 5, 0.8)
        ];
      } },
    kraken: { kind: 'W5', pays: [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 3, 12], [0.6, 2, 8], [0.4, 1.2, 5]], scat: [],
      bg: 'radial-gradient(80% 50% at 50% 0%,rgba(56,189,248,.35),transparent 70%),linear-gradient(180deg,#05324A,#020B24)', fr: ['#99F6E4', '#0E7490', '#042F2E'], cell: '#062033',
      art: function (B) {
        var t = function (x, d) { return '<path d="M' + x + ' 56' + d + '" stroke="' + B.lg(['#F0ABFC', '#A21CAF']) + '" stroke-width="9" fill="none" stroke-linecap="round"/>'; };
        return [
          // kraken
          shd(34) + t(26, 'q-16 14-6 30t-14 6') + t(40, 'q-6 18 4 26') + t(60, 'q6 18-4 26') + t(74, 'q16 14 6 30t14 6') +
            '<path d="M20 52c0-26 14-42 30-42s30 16 30 42c-10 8-50 8-60 0z" fill="' + B.rg(['#F5D0FE', '#C026D3', '#581C87']) + '" stroke="#3B0764" stroke-width="2"/>' +
            '<ellipse cx="38" cy="42" rx="7" ry="9" fill="#FEF08A"/><ellipse cx="62" cy="42" rx="7" ry="9" fill="#FEF08A"/><path d="M38 36v12M62 36v12" stroke="#111" stroke-width="4" stroke-linecap="round"/>' + gl(38, 22, 9, 4, -20, 0.4),
          // anchor
          shd(26) + '<g fill="none" stroke="' + B.lg(GOLD) + '" stroke-width="8"' + RC + '><circle cx="50" cy="18" r="8"/><path d="M50 26V86M34 38h32M18 62q4 24 32 24 28 0 32-24"/></g><path d="M12 64l8-8 6 10zM88 64l-8-8-6 10z" fill="#FBBF24"/>' + sp(76, 20, 6),
          // jellyfish
          shd(22) + '<path d="M34 54q-4 16 2 34M44 56q4 16-2 32M56 56q-4 16 2 32M66 54q4 16-2 34" stroke="#67E8F9" stroke-width="3" fill="none" opacity=".85" stroke-linecap="round"/>' +
            '<path d="M22 54c0-22 12-36 28-36s28 14 28 36q-6 6-14 0-7 6-14 0-7 6-14 0-8 6-14 0z" fill="' + B.rg(['#ECFEFF', '#22D3EE', '#155E75']) + '" stroke="#0E7490" stroke-width="2"/>' + gl(38, 30, 9, 5, -25, 0.55),
          royal(B, 'A', ['#CFFAFE', '#06B6D4', '#164E63']), royal(B, 'K', ['#E0E7FF', '#6366F1', '#1E1B4B']), royal(B, 'Q', ['#DCFCE7', '#22C55E', '#14532D'])
        ];
      } },
    donut: { kind: 'R33', pays: [50, 20, 10, 6, 4, 2], scat: [],
      bg: 'radial-gradient(80% 60% at 50% 0%,rgba(244,114,182,.4),transparent 70%),linear-gradient(180deg,#4A0D3A,#24082E)', fr: ['#FBCFE8', '#DB2777', '#500724'], cell: '#3A0A2E',
      art: function (B) {
        var sprinkles = function (cx, cy, r) { var s = '', C = ['#fff', '#60A5FA', '#FDE047', '#34D399', '#F472B6']; for (var i = 0; i < 12; i++) { var a = i * 2.4, rr = r * (0.55 + (i % 3) * 0.17); s += '<rect x="-3" y="-1.2" width="6" height="2.4" rx="1.2" fill="' + C[i % 5] + '" transform="translate(' + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr * 0.8).toFixed(1) + ') rotate(' + (i * 47) + ')"/>'; } return s; };
        return [
          // golden donut
          shd(32) + '<ellipse cx="50" cy="54" rx="38" ry="32" fill="' + B.lg(['#FEF3C7', '#F59E0B', '#92400E']) + '"/><path d="M14 50c4-20 18-30 36-30s32 10 36 30c-6 8-10 2-16 8-6-6-12 4-20-2-8 6-14-4-20 2-6-6-10 0-16-8z" fill="' + B.lg(GOLD) + '" stroke="#B45309" stroke-width="1.6"/>' +
            '<ellipse cx="50" cy="50" rx="11" ry="8" fill="#3A0A2E" stroke="#B45309" stroke-width="2"/>' + sprinkles(50, 46, 26) + gl(30, 36, 8, 4, -25, 0.6) + sp(82, 18, 7) + sp(18, 76, 4, 0.8),
          // cupcake
          shd(24) + '<path d="M26 56h48l-7 34H33z" fill="' + B.lg(['#93C5FD', '#2563EB']) + '"/><path d="M34 58l3 30M44 58l1 30M56 58l-1 30M66 58l-3 30" stroke="#BFDBFE" stroke-width="2" opacity=".6"/>' +
            '<path d="M22 58c-4-12 6-20 14-18 0-12 10-20 20-14 10-6 20 4 16 14 10 0 14 10 6 18z" fill="' + B.rg(['#FFF1F7', '#F9A8D4', '#BE185D']) + '" stroke="#BE185D" stroke-width="1.4"/><circle cx="54" cy="20" r="7" fill="' + B.rg(['#FECACA', '#DC2626', '#7F1D1D']) + '"/><path d="M54 13q4-8 10-8" stroke="#15803D" stroke-width="2" fill="none"/>' + gl(40, 36, 7, 4, -20, 0.6),
          // ice cream cone
          shd(16) + '<path d="M32 50h36L50 94z" fill="' + B.lg(['#FDE68A', '#D97706']) + '" stroke="#92400E" stroke-width="1.4"/><path d="M36 58l22 20M44 52l18 16M40 66l14-14M46 76l14-14" stroke="#92400E" stroke-width="1.4" opacity=".55"/>' +
            '<circle cx="38" cy="44" r="14" fill="' + B.rg(['#FFF', '#FBCFE8', '#DB2777']) + '"/><circle cx="62" cy="44" r="14" fill="' + B.rg(['#FFF', '#BBF7D0', '#16A34A']) + '"/><circle cx="50" cy="28" r="15" fill="' + B.rg(['#FFF', '#FDE68A', '#D97706']) + '"/>' + gl(44, 22, 5, 3, -25, 0.7),
          // macaron
          shd(30) + '<ellipse cx="50" cy="64" rx="34" ry="14" fill="' + B.lg(['#C4B5FD', '#7C3AED']) + '"/><ellipse cx="50" cy="54" rx="31" ry="7" fill="#FEF3C7"/><ellipse cx="50" cy="42" rx="34" ry="16" fill="' + B.rg(['#EDE9FE', '#A78BFA', '#6D28D9']) + '"/>' + gl(38, 36, 10, 4, -10, 0.55),
          // lollipop
          shd(14) + '<path d="M50 56V94" stroke="#F8FAFC" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="36" r="26" fill="' + B.rg(['#FFF', '#5EEAD4', '#0F766E']) + '"/><path d="M50 36m-4 0a4 4 0 1 1 8 0a10 10 0 1 1-18 0a16 16 0 1 1 30 0a20 20 0 0 1-20 20" stroke="#fff" stroke-width="4" fill="none" opacity=".8"/>' + gl(40, 24, 7, 4, -25, 0.6),
          // wrapped candy
          shd(30) + '<path d="M28 50L8 34l4 16-4 16zM72 50l20-16-4 16 4 16z" fill="' + B.lg(['#FECACA', '#EF4444']) + '"/><ellipse cx="50" cy="50" rx="24" ry="18" fill="' + B.rg(['#FFE4E6', '#F43F5E', '#881337']) + '"/><path d="M38 36l8 28M52 34l8 30" stroke="#fff" stroke-width="4" opacity=".7"/>' + gl(42, 40, 6, 3, -20, 0.6)
        ];
      } },
    cherrybar: { kind: 'R3', pays: [100, 40, 20, 10, 6, 4], scat: [2, 0.5],
      bg: 'radial-gradient(80% 60% at 50% 0%,rgba(239,68,68,.35),transparent 70%),linear-gradient(180deg,#3A0A0A,#140616)', fr: ['#FDE68A', '#B91C1C', '#450A0A'], cell: '#FFF8EC',
      art: function (B) {
        var bar = function (y, h) { return '<rect x="12" y="' + y + '" width="76" height="' + h + '" rx="6" fill="' + B.lg(['#374151', '#030712']) + '" stroke="' + B.lg(GOLD) + '" stroke-width="3"/><text x="50" y="' + (y + h * 0.78) + '" text-anchor="middle" font-family="Impact,\'Arial Black\',sans-serif" font-weight="900" font-size="' + (h * 0.8) + '" fill="#FDE68A" letter-spacing="2">BAR</text>'; };
        return [
          '<path d="M20 16h62v15L50 92H28l32-58H20z" fill="#000" opacity=".25" transform="translate(0 4)"/><path d="M20 16h62v15L50 92H28l32-58H20z" fill="' + B.lg(['#FECACA', '#DC2626', '#7F1D1D']) + '" stroke="' + B.lg(GOLD) + '" stroke-width="5" stroke-linejoin="round"/><path d="M26 22h48" stroke="#fff" stroke-width="3" opacity=".55" stroke-linecap="round"/>' + sp(80, 76, 7),
          bar(14, 22) + bar(39, 22) + bar(64, 22),
          bar(34, 32),
          // bell
          shd(26) + '<path d="M50 12c-18 0-24 16-24 34 0 14-6 20-12 28h72c-6-8-12-14-12-28 0-18-6-34-24-34z" fill="' + B.lg(GOLD, 'd') + '" stroke="#92400E" stroke-width="2"/><circle cx="50" cy="82" r="8" fill="#B45309"/><path d="M36 30q4-10 12-12" stroke="#fff" stroke-width="4" fill="none" opacity=".6" stroke-linecap="round"/>',
          // plum
          shd(26) + '<path d="M50 20q4-10 14-12" stroke="#4D7C0F" stroke-width="3" fill="none"/><ellipse cx="50" cy="56" rx="30" ry="34" fill="' + B.rg(['#E9D5FF', '#7E22CE', '#2E1065']) + '"/><path d="M50 24q-6 32 0 64" stroke="#3B0764" stroke-width="2" fill="none" opacity=".5"/><path d="M58 18q10-8 20-2-8 8-20 2z" fill="#65A30D"/>' + gl(38, 40, 8, 5, -30, 0.55),
          // cherries
          shd(30) + '<path d="M32 62Q40 30 62 12M68 62Q66 34 62 12" stroke="#15803D" stroke-width="3.4" fill="none"/><path d="M62 12q14-4 22 6-12 4-22-6z" fill="#22C55E"/>' +
            '<circle cx="30" cy="70" r="18" fill="' + B.rg(['#FECACA', '#DC2626', '#7F1D1D']) + '"/><circle cx="70" cy="70" r="18" fill="' + B.rg(['#FECACA', '#DC2626', '#7F1D1D']) + '"/>' + gl(24, 64, 5, 3, -30, 0.7) + gl(64, 64, 5, 3, -30, 0.7)
        ];
      } },
    ufo: { kind: 'A', cols: 5, rows: 4, bands: [6, 8, 10], pays: [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 4, 12], [0.8, 2.5, 8], [0.5, 1.5, 5], [0.3, 1, 3]],
      bg: 'radial-gradient(70% 50% at 50% 10%,rgba(74,222,128,.25),transparent 70%),linear-gradient(180deg,#071330,#020617)', fr: ['#BBF7D0', '#16A34A', '#052E16'], cell: '#0A1631',
      art: function (B) {
        var alien = function (c, eyes) { return shd(22) + '<path d="M30 92q0-24 20-24t20 24z" fill="' + B.lg(c) + '"/><ellipse cx="50" cy="44" rx="26" ry="30" fill="' + B.rg(c) + '" stroke="' + c[2] + '" stroke-width="2"/>' +
          (eyes === 3 ? '<ellipse cx="36" cy="44" rx="7" ry="9" fill="#111"/><ellipse cx="50" cy="34" rx="7" ry="9" fill="#111"/><ellipse cx="64" cy="44" rx="7" ry="9" fill="#111"/>' : '<ellipse cx="39" cy="44" rx="9" ry="12" fill="#111" transform="rotate(-20 39 44)"/><ellipse cx="61" cy="44" rx="9" ry="12" fill="#111" transform="rotate(20 61 44)"/>') +
          '<path d="M42 62q8 5 16 0" stroke="#111" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M36 16l-6-10M64 16l6-10" stroke="' + c[2] + '" stroke-width="3"/><circle cx="30" cy="6" r="4" fill="' + c[1] + '"/><circle cx="70" cy="6" r="4" fill="' + c[1] + '"/>' + gl(38, 26, 7, 4, -25, 0.5); };
        return [
          // flying saucer with beam
          '<path d="M34 56L18 96h64L66 56z" fill="#A7F3D0" opacity=".3"/><ellipse cx="50" cy="56" rx="44" ry="14" fill="' + B.lg(SILV) + '" stroke="#475569" stroke-width="2"/><path d="M28 50c0-18 10-28 22-28s22 10 22 28z" fill="' + B.rg(['#ECFEFF', '#67E8F9', '#0E7490']) + '" opacity=".9"/>' +
            [18, 34, 50, 66, 82].map(function (x) { return '<circle cx="' + x + '" cy="58" r="3.4" fill="#FDE047"/>'; }).join('') + gl(40, 32, 7, 4, -25, 0.7) + sp(84, 18, 7),
          alien(['#DCFCE7', '#22C55E', '#14532D'], 2),
          // ringed planet
          shd(30) + '<circle cx="50" cy="50" r="28" fill="' + B.rg(['#FFEDD5', '#F97316', '#7C2D12']) + '"/><ellipse cx="50" cy="52" rx="46" ry="12" fill="none" stroke="' + B.lg(['#FDE68A', '#D97706'], 'h') + '" stroke-width="5" transform="rotate(-16 50 52)"/><path d="M28 40q22 8 44-2" stroke="#FDBA74" stroke-width="4" fill="none" opacity=".7"/>' + gl(40, 36, 8, 4, -25, 0.5),
          // rocket
          '<path d="M44 76l6 18 6-18z" fill="#FDE047"/><path d="M50 8c14 12 18 34 14 60H36C32 42 36 20 50 8z" fill="' + B.lg(['#FFFFFF', '#CBD5E1', '#64748B'], 'h') + '" stroke="#334155" stroke-width="2"/><path d="M36 54l-12 16 12 0zM64 54l12 16-12 0z" fill="' + B.lg(RUBY) + '"/><circle cx="50" cy="38" r="8" fill="' + B.rg(['#E0F2FE', '#38BDF8', '#075985']) + '" stroke="#334155" stroke-width="2"/><path d="M50 8c6 5 9 10 11 16H39c2-6 5-11 11-16z" fill="#E11D48"/>',
          alien(['#F3E8FF', '#A855F7', '#3B0764'], 3),
          // star
          shd(22) + '<path d="M50 8l11 26 28 2-22 18 8 28-25-16-25 16 8-28-22-18 28-2z" fill="' + B.lg(['#FEF9C3', '#FACC15', '#A16207'], 'd') + '" stroke="#854D0E" stroke-width="2" stroke-linejoin="round"/>' + gl(42, 36, 6, 3, -30, 0.6),
          // moon
          shd(22) + '<path d="M62 12a40 40 0 1 0 22 62A32 32 0 1 1 62 12z" fill="' + B.lg(['#F1F5F9', '#94A3B8', '#334155'], 'd') + '" stroke="#475569" stroke-width="2"/><circle cx="38" cy="58" r="5" fill="#64748B" opacity=".5"/><circle cx="48" cy="76" r="3.4" fill="#64748B" opacity=".5"/>'
        ];
      } },
    koi: { kind: 'R33', pays: [60, 25, 12, 6, 3, 1.5], scat: [],
      bg: 'radial-gradient(80% 60% at 50% 0%,rgba(239,68,68,.35),transparent 70%),linear-gradient(180deg,#3B0710,#0B1A2E)', fr: ['#FDE68A', '#DC2626', '#450A0A'], cell: '#0F2A3A',
      art: function (B) {
        return [
          // golden koi
          shd(30) + '<path d="M14 50c10-20 34-26 54-14l20-14-6 28 6 28-20-14C48 76 24 70 14 50z" fill="' + B.lg(GOLD, 'd') + '" stroke="#92400E" stroke-width="2"/><path d="M40 40q10-10 22-4M40 60q10 10 22 4" stroke="#DC2626" stroke-width="5" fill="none" stroke-linecap="round"/>' +
            '<circle cx="26" cy="46" r="4" fill="#111"/><path d="M14 52q-6 2-8 8M16 54q-4 6-2 12" stroke="#B45309" stroke-width="2" fill="none"/>' + gl(30, 40, 8, 3, -20, 0.6) + sp(80, 80, 6),
          // red lantern
          '<path d="M50 4v10" stroke="#FBBF24" stroke-width="3"/><rect x="36" y="12" width="28" height="8" rx="2" fill="#B45309"/><ellipse cx="50" cy="50" rx="32" ry="32" fill="' + B.rg(['#FECACA', '#DC2626', '#7F1D1D']) + '"/>' +
            '<path d="M50 18q-20 32 0 64M50 18q20 32 0 64M50 18v64" stroke="#7F1D1D" stroke-width="2" fill="none" opacity=".6"/><rect x="36" y="80" width="28" height="8" rx="2" fill="#B45309"/><path d="M44 88v8M50 88v10M56 88v8" stroke="#FBBF24" stroke-width="2"/>' + gl(38, 34, 7, 4, -30, 0.5),
          // lucky cat
          shd(28) + '<path d="M24 90V54h52v36z" fill="' + B.lg(['#FFFFFF', '#E5E7EB']) + '" stroke="#9CA3AF" stroke-width="2"/><circle cx="50" cy="40" r="26" fill="' + B.lg(['#FFFFFF', '#F3F4F6']) + '" stroke="#9CA3AF" stroke-width="2"/>' +
            '<path d="M28 26l-2-18 16 10zM72 26l2-18-16 10z" fill="#fff" stroke="#9CA3AF" stroke-width="2"/><path d="M38 40q4-4 8 0M54 40q4-4 8 0" stroke="#111" stroke-width="2.4" fill="none"/><path d="M48 50l2 2 2-2" stroke="#F472B6" stroke-width="2" fill="none"/>' +
            '<path d="M72 52V24" stroke="#fff" stroke-width="12" stroke-linecap="round"/><path d="M28 64h44" stroke="#DC2626" stroke-width="5"/><circle cx="50" cy="70" r="6" fill="' + B.lg(GOLD) + '"/><ellipse cx="50" cy="82" rx="12" ry="6" fill="' + B.lg(GOLD) + '"/>',
          // folding fan
          shd(30) + '<path d="M50 84L8 46A50 50 0 0 1 92 46z" fill="' + B.lg(['#FECDD3', '#E11D48', '#881337'], 'h') + '" stroke="#7F1D1D" stroke-width="2"/>' + [0, 1, 2, 3, 4, 5, 6].map(function (i) { var a = (-130 + i * 13.3) * Math.PI / 180; return '<path d="M50 84L' + (50 + Math.cos(a) * 58).toFixed(1) + ' ' + (84 + Math.sin(a) * 58).toFixed(1) + '" stroke="#FDE68A" stroke-width="1.4" opacity=".7"/>'; }).join('') +
            '<path d="M24 46q14-14 30-8" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/><circle cx="50" cy="84" r="5" fill="#FBBF24"/>',
          // jade coin
          coinS(B, EMER, '<rect x="42" y="42" width="16" height="16" fill="#064E3B" stroke="#A7F3D0" stroke-width="2"/>'),
          // bamboo
          shd(28) + [30, 50, 70].map(function (x, i) { var y0 = 12 + i * 6; return '<rect x="' + (x - 7) + '" y="' + y0 + '" width="14" height="' + (80 - y0) + '" rx="5" fill="' + B.lg(['#BBF7D0', '#22C55E', '#14532D'], 'h') + '"/><path d="M' + (x - 7) + ' ' + (y0 + 26) + 'h14M' + (x - 7) + ' ' + (y0 + 52) + 'h14" stroke="#14532D" stroke-width="2.4"/>'; }).join('') + '<path d="M70 30q14-6 20 2-10 4-20-2z" fill="#4ADE80"/>'
        ];
      } },
    goldtrain: { kind: 'L5', pays: [[8, 40, 250], [5, 15, 75], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], scat: [8, 40],
      bg: 'radial-gradient(90% 60% at 50% 0%,rgba(251,146,60,.4),transparent 70%),linear-gradient(180deg,#43180A,#1A0A06)', fr: ['#FED7AA', '#9A3412', '#431407'], cell: '#2B140A',
      art: function (B) {
        return [
          // locomotive
          shd(40) + '<rect x="50" y="24" width="38" height="44" rx="4" fill="' + B.lg(RUBY) + '" stroke="#450A0A" stroke-width="2"/><rect x="56" y="30" width="26" height="16" rx="2" fill="#FDE68A"/><rect x="8" y="42" width="46" height="26" rx="6" fill="' + B.lg(['#4B5563', '#111827']) + '" stroke="#FBBF24" stroke-width="2"/>' +
            '<path d="M16 42V22h12v20" fill="#1F2937"/><path d="M12 22h20l-4-8h-12z" fill="#111827"/><circle cx="22" cy="10" r="5" fill="#E5E7EB" opacity=".7"/><circle cx="32" cy="5" r="3.4" fill="#E5E7EB" opacity=".5"/>' +
            '<circle cx="22" cy="78" r="12" fill="' + B.lg(GOLD) + '" stroke="#78350F" stroke-width="2"/><circle cx="48" cy="80" r="10" fill="' + B.lg(GOLD) + '" stroke="#78350F" stroke-width="2"/><circle cx="74" cy="78" r="12" fill="' + B.lg(GOLD) + '" stroke="#78350F" stroke-width="2"/><path d="M4 66l8-6v12z" fill="#FBBF24"/>',
          // sheriff star
          shd(24) + '<path d="M50 6l11 22 24-6-10 22 18 16-24 4 2 24-21-12-21 12 2-24-24-4 18-16-10-22 24 6z" fill="' + B.lg(GOLD, 'd') + '" stroke="#78350F" stroke-width="2" stroke-linejoin="round"/>' +
            [[50, 6], [85, 22], [93, 60], [50, 88], [7, 60], [15, 22]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4.6" fill="#FDE68A" stroke="#78350F" stroke-width="1.4"/>'; }).join('') + '<circle cx="50" cy="50" r="14" fill="none" stroke="#92400E" stroke-width="2"/>' + sp(72, 36, 6),
          // gold bag
          shd(30) + '<path d="M38 26q-10-14 4-16 8 6 16 0 14 2 4 16 26 14 26 40c0 18-16 24-32 24s-32-6-32-24c0-26 14-40 14-40z" fill="' + B.lg(['#E7D3B0', '#A16207', '#5B3A12'], 'd') + '" stroke="#422006" stroke-width="2"/>' +
            '<path d="M38 26h24" stroke="#422006" stroke-width="4"/><text x="50" y="72" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="30" fill="#FDE68A" stroke="#422006" stroke-width="1.4">$</text>',
          // horseshoe
          shd(26) + '<path d="M24 86C10 60 14 18 50 16s40 44 26 70l-14-4c10-22 8-50-12-50S28 60 38 82z" fill="' + B.lg(SILV, 'd') + '" stroke="#334155" stroke-width="2"/>' + [[22, 74], [18, 54], [24, 34], [76, 34], [82, 54], [78, 74]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="2.6" fill="#334155"/>'; }).join(''),
          royal(B, 'A', ORNG), royal(B, 'K', ['#FDE68A', '#CA8A04', '#422006']), royal(B, 'Q', ['#FECACA', '#B91C1C', '#450A0A']),
          // scatter: dynamite
          '<circle cx="50" cy="50" r="44" fill="' + B.rg(['#FFF7D6', '#F97316', '#7C2D12'], '50%', '50%', '60%') + '" opacity=".35"/>' + [30, 50, 70].map(function (x) { return '<rect x="' + (x - 9) + '" y="34" width="18" height="54" rx="4" fill="' + B.lg(['#FCA5A5', '#DC2626', '#7F1D1D'], 'h') + '" stroke="#450A0A" stroke-width="1.6"/>'; }).join('') +
            '<path d="M18 56h64" stroke="#1F2937" stroke-width="6"/><path d="M50 34Q46 18 60 12" stroke="#78350F" stroke-width="3" fill="none"/><path d="M60 12l6-8 2 8 8-2-6 8" fill="#FDE047" stroke="#F97316" stroke-width="1.6"/>' + sp(80, 20, 6)
        ];
      } },
    viking: { kind: 'W5', pays: [[6, 25, 120], [3, 10, 50], [2, 6, 25], [1.2, 4, 12], [0.8, 2, 8], [0.4, 1.2, 5]], scat: [],
      bg: 'radial-gradient(90% 60% at 50% 0%,rgba(148,163,184,.35),transparent 70%),linear-gradient(180deg,#0F2333,#05080F)', fr: ['#E2E8F0', '#64748B', '#0F172A'], cell: '#0C1A26',
      art: function (B) {
        var rune = function (c, d) { return shd(28) + '<path d="M22 90L18 26Q20 10 50 8 80 10 82 26L78 90z" fill="' + B.lg(['#9CA3AF', '#4B5563', '#1F2937'], 'd') + '" stroke="#111827" stroke-width="2"/><path d="' + d + '" stroke="' + c + '" stroke-width="7" fill="none"' + RC + '/><path d="' + d + '" stroke="#fff" stroke-width="2" fill="none" opacity=".6"' + RC + '/>'; };
        return [
          // longship
          '<path d="M6 92q44 8 88 0" stroke="#38BDF8" stroke-width="4" fill="none" opacity=".6"/><path d="M50 10v58" stroke="#78350F" stroke-width="4"/><path d="M50 14q30 10 26 44-14-6-26 0z" fill="' + B.lg(['#FEE2E2', '#DC2626'], 'h') + '"/><path d="M50 14q-30 10-26 44 14-6 26 0z" fill="' + B.lg(['#FFFFFF', '#E5E7EB'], 'h') + '"/>' +
            '<path d="M6 66h88l-10 18H18z" fill="' + B.lg(['#D97706', '#78350F']) + '" stroke="#451A03" stroke-width="2"/><path d="M6 66q-6-14 6-22 6 4 2 10" stroke="#78350F" stroke-width="5" fill="none"/><path d="M94 66q6-14-6-22" stroke="#78350F" stroke-width="5" fill="none"/>' +
            [24, 40, 56, 72].map(function (x) { return '<circle cx="' + x + '" cy="72" r="5" fill="' + B.lg(GOLD) + '" stroke="#451A03"/>'; }).join(''),
          // horned helmet
          shd(30) + '<path d="M24 46Q8 40 8 16q10 14 22 18zM76 46q16-6 16-30-10 14-22 18z" fill="' + B.lg(['#FFFBEB', '#E7D3B0', '#92400E']) + '" stroke="#78350F" stroke-width="2"/>' +
            '<path d="M22 66c0-30 12-44 28-44s28 14 28 44z" fill="' + B.lg(SILV, 'd') + '" stroke="#1F2937" stroke-width="2"/><path d="M20 64h60v10H20z" fill="' + B.lg(GOLD) + '" stroke="#78350F"/><path d="M46 74h8v18h-8z" fill="' + B.lg(SILV) + '"/><path d="M50 22v42" stroke="#94A3B8" stroke-width="3"/>' + gl(36, 38, 6, 10, 20, 0.5),
          // round shield
          shd(30) + '<circle cx="50" cy="50" r="40" fill="' + B.lg(['#93C5FD', '#1D4ED8', '#172554']) + '" stroke="' + B.lg(['#E2E8F0', '#64748B']) + '" stroke-width="6"/><path d="M50 12v76M12 50h76" stroke="#FDE68A" stroke-width="6"/><circle cx="50" cy="50" r="10" fill="' + B.rg(SILV) + '" stroke="#334155" stroke-width="2"/>' + gl(36, 32, 10, 5, -30, 0.35),
          // axe
          shd(22) + '<path d="M44 90L56 12" stroke="' + B.lg(['#D97706', '#78350F']) + '" stroke-width="7" stroke-linecap="round"/><path d="M54 20C66 10 84 14 90 26 84 40 70 48 52 42z" fill="' + B.lg(SILV, 'd') + '" stroke="#1F2937" stroke-width="2"/><path d="M66 18q16 4 20 12" stroke="#fff" stroke-width="2.4" fill="none" opacity=".7"/>',
          rune('#38BDF8', 'M38 24V80M38 30l22 14M38 48l22 14'), rune('#F59E0B', 'M36 24V80M36 24l26 14-26 14 26 28')
        ];
      } },
    safari: { kind: 'L5', pays: [[6, 30, 150], [4, 15, 60], [3, 10, 40], [2, 6, 20], [1, 4, 12], [0.6, 2, 6], [0.4, 1.5, 5]], scat: [10, 40],
      bg: 'radial-gradient(90% 60% at 50% 0%,rgba(250,204,21,.35),transparent 70%),linear-gradient(180deg,#3A2A0B,#122012)', fr: ['#FEF08A', '#A16207', '#3F2A06'], cell: '#2A230D',
      art: function (B) {
        return [
          // lion
          '<circle cx="50" cy="50" r="42" fill="' + B.rg(['#FDBA74', '#C2410C', '#7C2D12'], '50%', '50%', '60%') + '"/>' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (i) { var a = i * 30 * Math.PI / 180; return '<circle cx="' + (50 + Math.cos(a) * 36).toFixed(1) + '" cy="' + (52 + Math.sin(a) * 36).toFixed(1) + '" r="10" fill="#9A3412"/>'; }).join('') +
            '<ellipse cx="50" cy="54" rx="26" ry="28" fill="' + B.rg(['#FEF3C7', '#FBBF24', '#B45309']) + '"/><circle cx="40" cy="48" r="3.6" fill="#111"/><circle cx="60" cy="48" r="3.6" fill="#111"/><path d="M44 62h12l-6 7z" fill="#7C2D12"/><path d="M50 69v5M42 76q8 5 16 0" stroke="#7C2D12" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
          // elephant
          shd(32) + '<ellipse cx="22" cy="46" rx="18" ry="24" fill="' + B.lg(['#CBD5E1', '#64748B']) + '"/><ellipse cx="78" cy="46" rx="18" ry="24" fill="' + B.lg(['#CBD5E1', '#64748B']) + '"/><ellipse cx="50" cy="44" rx="24" ry="26" fill="' + B.rg(['#E2E8F0', '#94A3B8', '#475569']) + '"/>' +
            '<path d="M44 58q-4 20 4 30 4 2 6-2-6-8 0-28z" fill="#94A3B8" stroke="#475569" stroke-width="1.6"/><path d="M38 64q-8 4-10 12M62 64q8 4 10 12" stroke="#FFFBEB" stroke-width="5" stroke-linecap="round"/><circle cx="40" cy="42" r="3.4" fill="#111"/><circle cx="60" cy="42" r="3.4" fill="#111"/>',
          // giraffe
          shd(18) + '<path d="M36 92V48l6-30h16l6 6-6 6-4 18v44z" fill="' + B.lg(['#FDE68A', '#F59E0B']) + '" stroke="#92400E" stroke-width="1.6"/><path d="M42 18l-2-10M52 18l2-10" stroke="#92400E" stroke-width="3"/><circle cx="40" cy="7" r="3" fill="#92400E"/><circle cx="54" cy="7" r="3" fill="#92400E"/><circle cx="54" cy="22" r="2.4" fill="#111"/>' +
            [[42, 34], [48, 46], [40, 58], [48, 70], [42, 82], [50, 30]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.6" fill="#B45309"/>'; }).join(''),
          // zebra stripes head → keep simple: acacia-free zebra face
          shd(22) + '<path d="M30 30q20-30 40 0l-6 54q-14 10-28 0z" fill="#F8FAFC" stroke="#111827" stroke-width="2"/><path d="M34 34l14 6M66 34l-14 6M33 50l16 4M67 50l-16 4M36 66l12 2M64 66l-12 2" stroke="#111827" stroke-width="4" stroke-linecap="round"/><ellipse cx="50" cy="80" rx="12" ry="8" fill="#334155"/><path d="M36 22l-6-14 12 8zM64 22l6-14-12 8z" fill="#111827"/><circle cx="40" cy="44" r="3" fill="#111"/><circle cx="60" cy="44" r="3" fill="#111"/>',
          royal(B, 'A', ['#FEF9C3', '#EAB308', '#713F12']), royal(B, 'K', EMER), royal(B, 'Q', ORNG),
          // scatter: savanna sunset
          '<circle cx="50" cy="50" r="42" fill="' + B.lg(['#FDE68A', '#F97316', '#9D174D']) + '" stroke="#FDE68A" stroke-width="3"/><circle cx="50" cy="58" r="18" fill="#FEF3C7" opacity=".9"/><path d="M8 66h84v4H8z" fill="#7C2D12" opacity=".6"/>' +
            '<path d="M30 70V54M30 54q-16-4-18-10 18 0 36 0-2 6-18 10z" fill="#1C1917" stroke="#1C1917" stroke-width="3"/><path d="M60 70l4-10h12l4 10M64 60l-4-6" stroke="#1C1917" stroke-width="3" fill="none"/>' + sp(80, 22, 7)
        ];
      } },
    rubymine: { kind: 'A', cols: 6, rows: 5, bands: [8, 10, 12], pays: [[6, 25, 120], [4, 12, 50], [2.5, 8, 25], [1.5, 5, 15], [1, 3, 10], [0.6, 2, 6], [0.4, 1.2, 4]],
      bg: 'radial-gradient(80% 50% at 50% 0%,rgba(225,29,72,.35),transparent 70%),linear-gradient(180deg,#2A1410,#0B0605)', fr: ['#FCA5A5', '#7F1D1D', '#1C0A08'], cell: '#1C110D',
      art: function (B) {
        return [
          gem(B, (function () { var p = []; for (var i = 0; i < 16; i++) { var t = i / 16 * 2 * Math.PI, x = 16 * Math.pow(Math.sin(t), 3), y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t); p.push([50 + x * 2.6, 48 - y * 2.6]); } return p; })(), RUBY),
          gem(B, ngon(8, 36, 42, 22.5, 50, 50), EMER),
          gem(B, ngon(6, 42, 40, 0, 50, 50), ['#DBEAFE', '#3B82F6', '#1E3A8A']),
          gem(B, ngon(3, 46, 44, 180, 50, 44), AMET),
          gem(B, ngon(10, 32, 42, 0, 50, 50), ['#FEF3C7', '#F59E0B', '#78350F']),
          gem(B, ngon(4, 40, 40, 45, 50, 50), ['#FFFFFF', '#BAE6FD', '#0369A1']),
          // pickaxe
          shd(26) + '<path d="M28 90L66 30" stroke="' + B.lg(['#D97706', '#78350F']) + '" stroke-width="7" stroke-linecap="round"/><path d="M38 16q34 0 50 30-26-16-50-18z" fill="' + B.lg(SILV, 'd') + '" stroke="#1F2937" stroke-width="2"/><path d="M38 16q-12 6-16 18 10-8 22-10z" fill="' + B.lg(SILV) + '" stroke="#1F2937" stroke-width="2"/>'
        ];
      } },
    pumpkin: { kind: 'W5', pays: [[5, 20, 100], [3, 12, 40], [2, 6, 20], [1, 3, 10], [0.6, 2, 8], [0.4, 1.2, 4]], scat: [],
      bg: 'radial-gradient(80% 50% at 50% 0%,rgba(249,115,22,.35),transparent 70%),linear-gradient(180deg,#1E0B33,#05030C)', fr: ['#FDBA74', '#7C2D12', '#1C0A04'], cell: '#160A26',
      art: function (B) {
        return [
          // jack-o'-lantern
          shd(36) + '<path d="M50 22q-2-12 8-16" stroke="#3F6212" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="32" cy="56" rx="22" ry="32" fill="' + B.lg(ORNG, 'd') + '"/><ellipse cx="68" cy="56" rx="22" ry="32" fill="' + B.lg(ORNG, 'd') + '"/><ellipse cx="50" cy="56" rx="22" ry="34" fill="' + B.rg(['#FED7AA', '#F97316', '#9A3412']) + '"/>' +
            '<path d="M32 44l10 10H24zM68 44l8 10H58zM28 66q22 14 44 0l-6 10-6-4-6 6-6-6-6 6-6-6-4 4z" fill="#FDE047"/>',
          // witch hat
          shd(36) + '<ellipse cx="50" cy="80" rx="44" ry="10" fill="' + B.lg(['#6D28D9', '#1E1B4B']) + '"/><path d="M28 80L52 8q4-2 4 4L74 80z" fill="' + B.lg(['#7C3AED', '#2E1065'], 'h') + '"/><path d="M28 72h46v8H28z" fill="#F97316"/><rect x="44" y="70" width="12" height="12" rx="2" fill="none" stroke="#FDE047" stroke-width="3"/>',
          // ghost
          shd(24) + '<path d="M24 88V42c0-18 12-30 26-30s26 12 26 30v46l-8-8-9 8-9-8-9 8-9-8z" fill="' + B.lg(['#FFFFFF', '#E0E7FF', '#A5B4FC']) + '" stroke="#6366F1" stroke-width="1.6"/><ellipse cx="40" cy="44" rx="5" ry="7" fill="#1E1B4B"/><ellipse cx="60" cy="44" rx="5" ry="7" fill="#1E1B4B"/><ellipse cx="50" cy="62" rx="6" ry="8" fill="#1E1B4B"/>',
          // bat
          '<path d="M50 40c-10-14-26-18-44-10 8 4 10 10 10 16 6-6 12-4 14 2 4-6 10-4 12 2 4-4 6-6 8-10 2 4 4 6 8 10 2-6 8-8 12-2 2-6 8-8 14-2 0-6 2-12 10-16-18-8-34-4-44 10z" fill="' + B.lg(['#4B5563', '#111827']) + '" stroke="#000" stroke-width="1.4"/><circle cx="50" cy="50" r="12" fill="#1F2937"/><path d="M42 40l2-8 4 6M58 40l-2-8-4 6" fill="#1F2937"/><circle cx="46" cy="48" r="2.4" fill="#F97316"/><circle cx="54" cy="48" r="2.4" fill="#F97316"/>',
          // potion
          shd(26) + '<rect x="42" y="8" width="16" height="10" rx="2" fill="#92400E"/><path d="M42 18h16v14c16 6 22 18 22 30 0 18-14 28-30 28S20 80 20 62c0-12 6-24 22-30z" fill="' + B.rg(['#DCFCE7', '#22C55E', '#14532D'], '45%', '60%') + '" stroke="#E0E7FF" stroke-width="2.4"/>' +
            '<path d="M24 60q26-8 52 0" stroke="#BBF7D0" stroke-width="2" fill="none"/><circle cx="40" cy="70" r="4" fill="#fff" opacity=".6"/><circle cx="56" cy="76" r="2.6" fill="#fff" opacity=".6"/>' + gl(32, 52, 4, 9, 20, 0.5),
          // candy corn
          shd(22) + '<path d="M50 8C34 30 24 60 26 84q24 10 48 0C76 60 66 30 50 8z" fill="#FFF7ED" stroke="#C2410C" stroke-width="2"/><path d="M28 60q22 6 44 0l2 24q-24 10-48 0z" fill="#FDE047"/><path d="M34 38q16 4 32 0l6 22q-22 6-44 0z" fill="#F97316"/>' + gl(40, 28, 4, 9, 20, 0.5)
        ];
      } },
    medusa: { kind: 'L5', pays: [[10, 50, 300], [5, 20, 80], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], scat: [12, 60],
      bg: 'radial-gradient(90% 60% at 50% 0%,rgba(52,211,153,.3),transparent 70%),linear-gradient(180deg,#0A2A24,#05101A)', fr: ['#FDE68A', '#047857', '#022C22'], cell: '#0A1F1C',
      art: function (B) {
        var snake = function (d) { return '<path d="' + d + '" stroke="' + B.lg(['#86EFAC', '#15803D']) + '" stroke-width="7" fill="none" stroke-linecap="round"/>'; };
        return [
          // Medusa
          snake('M30 30Q14 22 10 8') + snake('M40 22Q36 8 44 2') + snake('M60 22Q64 8 56 2') + snake('M70 30Q86 22 90 8') + snake('M26 46Q10 48 6 36') + snake('M74 46q16 2 20-10') +
            '<ellipse cx="50" cy="52" rx="24" ry="30" fill="' + B.rg(['#D1FAE5', '#6EE7B7', '#047857']) + '" stroke="#065F46" stroke-width="2"/><path d="M38 46q4-4 8 0M54 46q4-4 8 0" stroke="#064E3B" stroke-width="2.4" fill="none"/><circle cx="42" cy="49" r="2.6" fill="#FDE047"/><circle cx="58" cy="49" r="2.6" fill="#FDE047"/>' +
            '<path d="M44 68q6 4 12 0" stroke="#9F1239" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M28 30q22-16 44 0" stroke="' + B.lg(GOLD) + '" stroke-width="5" fill="none"/>' + sp(84, 80, 6),
          // winged helmet
          shd(30) + '<path d="M26 40Q6 30 4 12q14 8 24 10zM74 40q20-10 22-28-14 8-24 10z" fill="' + B.lg(['#FFFFFF', '#E2E8F0', '#94A3B8']) + '" stroke="#475569" stroke-width="1.6"/><path d="M24 70c0-34 12-50 26-50s26 16 26 50l-10 4V56H34v18z" fill="' + B.lg(GOLD, 'd') + '" stroke="#78350F" stroke-width="2"/>' +
            '<path d="M50 10q-20 2-24 20h48Q70 12 50 10z" fill="' + B.lg(RUBY) + '"/><path d="M46 56h8v30h-8z" fill="' + B.lg(GOLD) + '" stroke="#78350F"/>',
          // lyre
          shd(26) + '<path d="M28 86h44M32 86C14 60 18 30 30 14M68 86c18-26 14-56 2-72" stroke="' + B.lg(GOLD) + '" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M26 30h48" stroke="' + B.lg(GOLD) + '" stroke-width="5"/>' + [40, 47, 54, 61].map(function (x) { return '<path d="M' + x + ' 30V86" stroke="#FEF3C7" stroke-width="1.6"/>'; }).join(''),
          // amphora
          shd(22) + '<path d="M40 10h20v8c14 6 20 20 18 36-2 18-14 30-28 34-14-4-26-16-28-34-2-16 4-30 18-36z" fill="' + B.lg(['#FDBA74', '#C2410C', '#7C2D12'], 'h') + '" stroke="#431407" stroke-width="2"/><path d="M40 22Q24 22 24 40M60 22q16 0 16 18" stroke="#431407" stroke-width="4" fill="none"/>' +
            '<path d="M26 52h48M28 62h44" stroke="#111827" stroke-width="3"/><path d="M34 56h6l-2 4h6l-2-4h6l-2 4h6l-2-4h6l-2 4" stroke="#111827" stroke-width="1.6" fill="none"/>',
          royal(B, 'A', EMER), royal(B, 'K', GOLD), royal(B, 'Q', ['#E0E7FF', '#6366F1', '#1E1B4B']),
          // scatter: golden temple
          '<circle cx="50" cy="50" r="44" fill="' + B.rg(['#FFF7D6', '#FBBF24', '#78350F'], '50%', '50%', '60%') + '" opacity=".35"/><path d="M10 34L50 10l40 24z" fill="' + B.lg(GOLD) + '" stroke="#78350F" stroke-width="2"/><rect x="12" y="34" width="76" height="8" fill="' + B.lg(GOLD) + '" stroke="#78350F"/>' +
            [20, 36, 52, 68].map(function (x) { return '<rect x="' + x + '" y="42" width="10" height="38" fill="' + B.lg(['#FFFBEB', '#FDE68A', '#B45309'], 'h') + '" stroke="#78350F"/>'; }).join('') + '<rect x="8" y="80" width="84" height="10" fill="' + B.lg(GOLD) + '" stroke="#78350F"/>' + sp(84, 16, 7)
        ];
      } }
  };
  Object.keys(TH).forEach(function (k) { TH[k].scat = TH[k].scat || []; });
  var ORDER = ['scarab', 'kraken', 'donut', 'cherrybar', 'ufo', 'koi', 'goldtrain', 'viking', 'safari', 'rubymine', 'pumpkin', 'medusa'];
  var DIM = { L5: [5, 3], W5: [5, 3], R33: [3, 3], R3: [3, 3] };
  function dims(d) { return d.kind === 'A' ? [d.cols, d.rows] : DIM[d.kind]; }
  function nSym(d) { return d.kind === 'L5' ? d.pays.length + (d.scat.length ? 1 : 0) : d.pays.length; }

  /* ====================================================================== lines = same rule as casino_ext/casa.php */
  function rowsOf(d) {
    var R = [{ m: 0 }];
    if (d.kind === 'L5') { d.pays.forEach(function (p, s) { p.forEach(function (v, j) { R.push({ m: v, s: s, n: 3 + j }); }); }); d.scat.forEach(function (v, j) { R.push({ m: v, sc: 3 + j }); }); }
    else if (d.kind === 'W5') d.pays.forEach(function (p, s) { p.forEach(function (v, j) { [1, 2, 4].forEach(function (w) { R.push({ m: r2(v * w), s: s, n: 3 + j, w: w }); }); }); });
    else if (d.kind === 'A') d.pays.forEach(function (p, s) { p.forEach(function (v, b) { R.push({ m: v, s: s, b: b }); }); });
    else if (d.kind === 'R33') d.pays.forEach(function (v, s) { R.push({ m: v, s: s }); });
    else { d.pays.forEach(function (v, s) { R.push({ m: v, s: s }); }); d.scat.forEach(function (v, j) { R.push({ m: v, ch: 2 - j }); }); }
    return R;
  }
  var LINES5 = [[1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2], [0, 1, 2, 1, 0], [2, 1, 0, 1, 2], [0, 0, 1, 2, 2], [2, 2, 1, 0, 0], [1, 0, 0, 0, 1], [1, 2, 2, 2, 1], [1, 0, 1, 2, 1]];
  var LINES3 = [[1, 1, 1], [0, 0, 0], [2, 2, 2], [0, 1, 2], [2, 1, 0]];
  /* every win on a grid g[col][row] */
  function evalGrid(d, g) {
    var W = [], C = g.length, Rw = g[0].length, i, s, n;
    if (d.kind === 'L5' || d.kind === 'R33') {
      var LL = d.kind === 'L5' ? LINES5 : LINES3, SC = d.kind === 'L5' && d.scat.length ? d.pays.length : -1;
      LL.forEach(function (L, li) {
        s = g[0][L[0]]; if (s === SC) return;
        n = 1; while (n < C && g[n][L[n]] === s) n++;
        if (d.kind === 'L5' && n >= 3) W.push({ m: d.pays[s][n - 3], s: s, n: n, li: li, cells: L.slice(0, n).map(function (r, c) { return [c, r]; }) });
        if (d.kind === 'R33' && n === 3) W.push({ m: d.pays[s], s: s, li: li, cells: L.map(function (r, c) { return [c, r]; }) });
      });
      if (SC >= 0) {
        var cs = []; for (i = 0; i < C; i++) for (var r = 0; r < Rw; r++) if (g[i][r] === SC) cs.push([i, r]);
        if (cs.length >= 3) W.push({ m: cs.length <= 4 ? d.scat[cs.length - 3] : -1, sc: cs.length, cells: cs });
      }
    } else if (d.kind === 'W5') {
      for (s = 0; s < d.pays.length; s++) {
        var ways = 1, cells = []; n = 0;
        while (n < C) { var k = 0; for (i = 0; i < Rw; i++) if (g[n][i] === s) { k++; cells.push([n, i]); } if (!k) break; ways *= k; n++; }
        if (n >= 3) W.push({ m: r2(d.pays[s][n - 3] * ways), s: s, n: n, w: ways, cells: cells.filter(function (q) { return q[0] < n; }) });
      }
    } else if (d.kind === 'A') {
      for (s = 0; s < d.pays.length; s++) {
        var cc = []; for (i = 0; i < C; i++) for (var r3 = 0; r3 < Rw; r3++) if (g[i][r3] === s) cc.push([i, r3]);
        var b = cc.length >= d.bands[2] ? 2 : cc.length >= d.bands[1] ? 1 : cc.length >= d.bands[0] ? 0 : -1;
        if (b >= 0) W.push({ m: d.pays[s][b], s: s, b: b, cells: cc });
      }
    } else { // R3: the middle line only
      var a = g[0][1], b2 = g[1][1], c3 = g[2][1], CH = 5;
      if (a === b2 && b2 === c3) W.push({ m: d.pays[a], s: a, cells: [[0, 1], [1, 1], [2, 1]] });
      else {
        var ch = [a, b2, c3].map(function (v, j) { return v === CH ? [j, 1] : null; }).filter(Boolean);
        if (ch.length) W.push({ m: d.scat[ch.length >= 2 ? 0 : 1], ch: ch.length, cells: ch });
      }
    }
    return W;
  }
  function same(w, row) {
    if (Math.abs(w.m - row.m) > 1e-9) return false;
    if (row.sc) return w.sc === row.sc;
    if (row.ch) return w.ch === row.ch;
    if (w.s !== row.s) return false;
    if (row.n && w.n !== row.n) return false;
    if (row.w && w.w !== row.w) return false;
    if (row.b != null && w.b !== row.b) return false;
    return true;
  }
  /* a grid that shows exactly this line (and nothing else) */
  function buildGrid(d, row) {
    var D = dims(d), C = D[0], Rw = D[1], ns = nSym(d), np = d.pays.length, SC = d.kind === 'L5' && d.scat.length ? np : -1;
    var pickS = function (avoid) { var s; do { s = d.kind === 'A' ? rnd(np) : Math.min(np - 1, Math.floor(Math.pow(Math.random(), 0.75) * np)); } while (avoid && avoid.indexOf(s) >= 0); return s; };
    for (var tries = 0; tries < 600; tries++) {
      var g = [], c, r, i;
      for (c = 0; c < C; c++) { g.push([]); for (r = 0; r < Rw; r++) g[c].push(SC >= 0 && Math.random() < 0.06 ? SC : pickS()); }
      if (row.m > 0) {
        if (d.kind === 'L5' && row.sc) {
          for (c = 0; c < C; c++) for (r = 0; r < Rw; r++) if (g[c][r] === SC) g[c][r] = pickS();
          shuffle([0, 1, 2, 3, 4]).slice(0, row.sc).forEach(function (cc) { g[cc][rnd(Rw)] = SC; });
        } else if (d.kind === 'L5' || d.kind === 'R33') {
          var L = (d.kind === 'L5' ? LINES5 : LINES3)[rnd(d.kind === 'L5' ? 10 : 5)], n = row.n || 3;
          for (c = 0; c < n; c++) g[c][L[c]] = row.s;
          if (n < C) g[n][L[n]] = pickS([row.s]);
        } else if (d.kind === 'W5') {
          var cnt = [1, 1, 1, 1, 1], two = shuffle([0, 1, 2, 3, 4].slice(0, row.n)).slice(0, row.w === 4 ? 2 : row.w === 2 ? 1 : 0);
          two.forEach(function (q) { cnt[q] = 2; });
          for (c = 0; c < C; c++) {
            for (r = 0; r < Rw; r++) if (g[c][r] === row.s) g[c][r] = pickS([row.s]);
            if (c < row.n) shuffle([0, 1, 2]).slice(0, cnt[c]).forEach(function (rr) { g[c][rr] = row.s; });
          }
        } else if (d.kind === 'A') {
          var lo = d.bands[row.b], hi = row.b < 2 ? d.bands[row.b + 1] - 1 : d.bands[2] + 2, k = lo + rnd(hi - lo + 1), all = [];
          for (c = 0; c < C; c++) for (r = 0; r < Rw; r++) { all.push([c, r]); if (g[c][r] === row.s) g[c][r] = pickS([row.s]); }
          shuffle(all).slice(0, k).forEach(function (q) { g[q[0]][q[1]] = row.s; });
        } else { // R3
          if (row.ch) { var pos = shuffle([0, 1, 2]); for (i = 0; i < 3; i++) g[pos[i]][1] = i < row.ch ? 5 : pickS([5]); }
          else for (i = 0; i < 3; i++) g[i][1] = row.s;
        }
      } else if (d.kind === 'A') { // keep every symbol under the first band
        var cap = d.bands[0] - 1, used = []; for (i = 0; i < np; i++) used.push(0);
        for (c = 0; c < C; c++) for (r = 0; r < Rw; r++) { var s0 = g[c][r], t = 0; while (used[s0] >= cap && t++ < 20) s0 = rnd(np); g[c][r] = s0; used[s0]++; }
      }
      var W = evalGrid(d, g);
      if (row.m > 0 ? (W.length === 1 && same(W[0], row)) : !W.length) return { g: g, win: W[0] || null };
    }
    return null;
  }

  /* ====================================================================== texts */
  var SPIN = { en: 'Spin', fr: 'Tourner', es: 'Girar', pt: 'Girar', ar: 'دوّر', tr: 'Çevir', vi: 'Quay', id: 'Putar', ru: 'Крутить', de: 'Drehen', hi: 'घुमाएं', zh: '旋转' };
  var RT = {
    L5: {
      en: '1. Set your stake and tap “Spin”: 5 reels, 3 rows, 10 lines.\n2. 3, 4 or 5 same symbols on a line, starting from the left reel, win. 3 golden symbols anywhere ×{s3}, 4 ×{s4}.\n3. Tap the pay table above the reels to see every symbol (up to ×{max}).',
      fr: '1. Choisis ta mise et touche « Tourner » : 5 rouleaux, 3 rangées, 10 lignes.\n2. 3, 4 ou 5 symboles pareils sur une ligne, depuis le rouleau de gauche, gagnent. 3 symboles dorés n’importe où ×{s3}, 4 ×{s4}.\n3. Touche le tableau au-dessus des rouleaux pour voir chaque symbole (jusqu’à ×{max}).',
      es: '1. Elige tu apuesta y toca «Girar»: 5 rodillos, 3 filas, 10 líneas.\n2. 3, 4 o 5 símbolos iguales en una línea, desde el rodillo izquierdo, ganan. 3 símbolos dorados en cualquier lugar ×{s3}, 4 ×{s4}.\n3. Toca la tabla sobre los rodillos para ver cada símbolo (hasta ×{max}).',
      pt: '1. Escolha o valor e toque em «Girar»: 5 rolos, 3 linhas, 10 linhas de pagamento.\n2. 3, 4 ou 5 símbolos iguais numa linha, a partir do rolo esquerdo, ganham. 3 símbolos dourados em qualquer lugar ×{s3}, 4 ×{s4}.\n3. Toque na tabela acima dos rolos para ver cada símbolo (até ×{max}).',
      ar: '1. اختر رهانك والمس «دوّر»: 5 بكرات و3 صفوف و10 خطوط.\n2. 3 أو 4 أو 5 رموز متطابقة على خط، بدءًا من البكرة اليسرى، تربح. 3 رموز ذهبية في أي مكان ×{s3}، و4 ×{s4}.\n3. المس جدول الأرباح فوق البكرات لرؤية كل رمز (حتى ×{max}).',
      tr: '1. Bahsini seç ve “Çevir”e dokun: 5 makara, 3 sıra, 10 çizgi.\n2. Soldaki makaradan başlayarak bir çizgide 3, 4 veya 5 aynı sembol kazanır. Herhangi bir yerde 3 altın sembol ×{s3}, 4 ×{s4}.\n3. Her sembolü görmek için makaraların üstündeki tabloya dokun (×{max}’e kadar).',
      vi: '1. Chọn mức cược rồi chạm «Quay»: 5 cuộn, 3 hàng, 10 đường.\n2. 3, 4 hoặc 5 biểu tượng giống nhau trên một đường, tính từ cuộn trái, sẽ thắng. 3 biểu tượng vàng ở bất kỳ đâu ×{s3}, 4 ×{s4}.\n3. Chạm bảng thưởng phía trên cuộn để xem từng biểu tượng (tới ×{max}).',
      id: '1. Atur taruhan lalu sentuh «Putar»: 5 gulungan, 3 baris, 10 garis.\n2. 3, 4 atau 5 simbol sama di satu garis, mulai gulungan kiri, menang. 3 simbol emas di mana saja ×{s3}, 4 ×{s4}.\n3. Sentuh tabel di atas gulungan untuk melihat setiap simbol (hingga ×{max}).',
      ru: '1. Выберите ставку и нажмите «Крутить»: 5 барабанов, 3 ряда, 10 линий.\n2. 3, 4 или 5 одинаковых символов на линии, начиная с левого барабана, выигрывают. 3 золотых символа в любом месте ×{s3}, 4 ×{s4}.\n3. Нажмите на таблицу над барабанами, чтобы увидеть каждый символ (до ×{max}).',
      de: '1. Wähle deinen Einsatz und tippe auf „Drehen“: 5 Walzen, 3 Reihen, 10 Linien.\n2. 3, 4 oder 5 gleiche Symbole auf einer Linie ab der linken Walze gewinnen. 3 goldene Symbole irgendwo ×{s3}, 4 ×{s4}.\n3. Tippe auf die Gewinntabelle über den Walzen, um jedes Symbol zu sehen (bis ×{max}).',
      hi: '1. राशि चुनें और «घुमाएं» छुएं: 5 रील, 3 पंक्तियां, 10 लाइनें।\n2. बाईं रील से शुरू होकर एक लाइन पर 3, 4 या 5 एक जैसे चिह्न जीतते हैं। कहीं भी 3 सुनहरे चिह्न ×{s3}, 4 ×{s4}।\n3. हर चिह्न देखने के लिए रीलों के ऊपर की तालिका छुएं (×{max} तक)।',
      zh: '1. 设定金额并点击“旋转”：5 个转轴、3 行、10 条线。\n2. 一条线上从最左转轴起 3、4 或 5 个相同图案即赢。任意位置 3 个金色图案 ×{s3}，4 个 ×{s4}。\n3. 点击转轴上方的赔付表查看每个图案（最高 ×{max}）。'
    },
    W5: {
      en: '1. Set your stake and tap “Spin”: 5 reels, 3 rows, 243 ways — no lines.\n2. The same symbol on 3, 4 or 5 neighbouring reels from the left wins, anywhere on each reel. 2 of it on a reel doubles the win.\n3. Tap the pay table above the reels to see every symbol (up to ×{max}).',
      fr: '1. Choisis ta mise et touche « Tourner » : 5 rouleaux, 3 rangées, 243 façons de gagner — pas de lignes.\n2. Le même symbole sur 3, 4 ou 5 rouleaux voisins depuis la gauche gagne, à n’importe quelle place du rouleau. 2 fois sur un rouleau = gain doublé.\n3. Touche le tableau au-dessus des rouleaux pour voir chaque symbole (jusqu’à ×{max}).',
      es: '1. Elige tu apuesta y toca «Girar»: 5 rodillos, 3 filas, 243 formas — sin líneas.\n2. El mismo símbolo en 3, 4 o 5 rodillos vecinos desde la izquierda gana, en cualquier posición del rodillo. 2 en un rodillo duplican el premio.\n3. Toca la tabla sobre los rodillos para ver cada símbolo (hasta ×{max}).',
      pt: '1. Escolha o valor e toque em «Girar»: 5 rolos, 3 linhas, 243 maneiras — sem linhas fixas.\n2. O mesmo símbolo em 3, 4 ou 5 rolos vizinhos a partir da esquerda ganha, em qualquer posição. 2 num rolo dobram o prêmio.\n3. Toque na tabela acima dos rolos para ver cada símbolo (até ×{max}).',
      ar: '1. اختر رهانك والمس «دوّر»: 5 بكرات و3 صفوف و243 طريقة للفوز — بدون خطوط.\n2. الرمز نفسه على 3 أو 4 أو 5 بكرات متجاورة من اليسار يربح، في أي مكان على البكرة. رمزان على بكرة واحدة يضاعفان الربح.\n3. المس جدول الأرباح فوق البكرات لرؤية كل رمز (حتى ×{max}).',
      tr: '1. Bahsini seç ve “Çevir”e dokun: 5 makara, 3 sıra, 243 yol — çizgi yok.\n2. Soldan yan yana 3, 4 veya 5 makarada aynı sembol, makaranın herhangi bir yerinde kazanır. Bir makarada 2 tane kazancı ikiye katlar.\n3. Her sembolü görmek için makaraların üstündeki tabloya dokun (×{max}’e kadar).',
      vi: '1. Chọn mức cược rồi chạm «Quay»: 5 cuộn, 3 hàng, 243 cách thắng — không có đường.\n2. Cùng một biểu tượng trên 3, 4 hoặc 5 cuộn liền nhau từ trái sẽ thắng, ở bất kỳ vị trí nào. 2 cái trên một cuộn nhân đôi tiền thắng.\n3. Chạm bảng thưởng phía trên cuộn để xem từng biểu tượng (tới ×{max}).',
      id: '1. Atur taruhan lalu sentuh «Putar»: 5 gulungan, 3 baris, 243 cara — tanpa garis.\n2. Simbol sama di 3, 4 atau 5 gulungan berdampingan dari kiri menang, di posisi mana pun. 2 di satu gulungan menggandakan kemenangan.\n3. Sentuh tabel di atas gulungan untuk melihat setiap simbol (hingga ×{max}).',
      ru: '1. Выберите ставку и нажмите «Крутить»: 5 барабанов, 3 ряда, 243 способа — без линий.\n2. Один и тот же символ на 3, 4 или 5 соседних барабанах слева выигрывает в любом месте барабана. 2 на одном барабане удваивают выигрыш.\n3. Нажмите на таблицу над барабанами, чтобы увидеть каждый символ (до ×{max}).',
      de: '1. Wähle deinen Einsatz und tippe auf „Drehen“: 5 Walzen, 3 Reihen, 243 Wege — keine Linien.\n2. Dasselbe Symbol auf 3, 4 oder 5 benachbarten Walzen ab links gewinnt, egal wo auf der Walze. 2 auf einer Walze verdoppeln den Gewinn.\n3. Tippe auf die Gewinntabelle über den Walzen, um jedes Symbol zu sehen (bis ×{max}).',
      hi: '1. राशि चुनें और «घुमाएं» छुएं: 5 रील, 3 पंक्तियां, जीतने के 243 तरीके — कोई लाइन नहीं।\n2. बाईं ओर से लगातार 3, 4 या 5 रीलों पर वही चिह्न, रील में कहीं भी, जीतता है। एक रील पर 2 हों तो जीत दोगुनी।\n3. हर चिह्न देखने के लिए रीलों के ऊपर की तालिका छुएं (×{max} तक)।',
      zh: '1. 设定金额并点击“旋转”：5 个转轴、3 行、243 种中奖方式——没有固定线。\n2. 从左起相邻 3、4 或 5 个转轴上出现同一图案即赢，位置不限。同一转轴上出现 2 个，奖金翻倍。\n3. 点击转轴上方的赔付表查看每个图案（最高 ×{max}）。'
    },
    A: {
      en: '1. Set your stake and tap “Spin”: a {g} grid of symbols falls.\n2. {t} or more of the same symbol anywhere on the grid win; {t2}+ and {t3}+ pay more.\n3. Tap the pay table above the grid to see every symbol (up to ×{max}).',
      fr: '1. Choisis ta mise et touche « Tourner » : une grille de {g} symboles tombe.\n2. {t} symboles pareils ou plus, n’importe où sur la grille, gagnent ; {t2}+ et {t3}+ paient plus.\n3. Touche le tableau au-dessus de la grille pour voir chaque symbole (jusqu’à ×{max}).',
      es: '1. Elige tu apuesta y toca «Girar»: cae una cuadrícula de {g} símbolos.\n2. {t} o más símbolos iguales en cualquier lugar ganan; {t2}+ y {t3}+ pagan más.\n3. Toca la tabla sobre la cuadrícula para ver cada símbolo (hasta ×{max}).',
      pt: '1. Escolha o valor e toque em «Girar»: cai uma grade de {g} símbolos.\n2. {t} ou mais símbolos iguais em qualquer lugar da grade ganham; {t2}+ e {t3}+ pagam mais.\n3. Toque na tabela acima da grade para ver cada símbolo (até ×{max}).',
      ar: '1. اختر رهانك والمس «دوّر»: تسقط شبكة من الرموز {g}.\n2. {t} رموز متطابقة أو أكثر في أي مكان على الشبكة تربح؛ و{t2}+ و{t3}+ تربح أكثر.\n3. المس جدول الأرباح فوق الشبكة لرؤية كل رمز (حتى ×{max}).',
      tr: '1. Bahsini seç ve “Çevir”e dokun: {g} sembollük bir ızgara düşer.\n2. Izgaranın herhangi bir yerinde {t} veya daha fazla aynı sembol kazanır; {t2}+ ve {t3}+ daha çok öder.\n3. Her sembolü görmek için ızgaranın üstündeki tabloya dokun (×{max}’e kadar).',
      vi: '1. Chọn mức cược rồi chạm «Quay»: một lưới {g} biểu tượng rơi xuống.\n2. Từ {t} biểu tượng giống nhau trở lên ở bất kỳ đâu trên lưới sẽ thắng; {t2}+ và {t3}+ trả nhiều hơn.\n3. Chạm bảng thưởng phía trên lưới để xem từng biểu tượng (tới ×{max}).',
      id: '1. Atur taruhan lalu sentuh «Putar»: kisi {g} simbol jatuh.\n2. {t} atau lebih simbol sama di mana saja pada kisi menang; {t2}+ dan {t3}+ membayar lebih.\n3. Sentuh tabel di atas kisi untuk melihat setiap simbol (hingga ×{max}).',
      ru: '1. Выберите ставку и нажмите «Крутить»: падает сетка символов {g}.\n2. {t} и больше одинаковых символов в любом месте сетки выигрывают; {t2}+ и {t3}+ платят больше.\n3. Нажмите на таблицу над сеткой, чтобы увидеть каждый символ (до ×{max}).',
      de: '1. Wähle deinen Einsatz und tippe auf „Drehen“: ein Raster aus {g} Symbolen fällt.\n2. {t} oder mehr gleiche Symbole irgendwo im Raster gewinnen; {t2}+ und {t3}+ zahlen mehr.\n3. Tippe auf die Gewinntabelle über dem Raster, um jedes Symbol zu sehen (bis ×{max}).',
      hi: '1. राशि चुनें और «घुमाएं» छुएं: {g} चिह्नों का ग्रिड गिरता है।\n2. ग्रिड में कहीं भी एक जैसे {t} या अधिक चिह्न जीतते हैं; {t2}+ और {t3}+ ज़्यादा देते हैं।\n3. हर चिह्न देखने के लिए ग्रिड के ऊपर की तालिका छुएं (×{max} तक)।',
      zh: '1. 设定金额并点击“旋转”：落下 {g} 的图案网格。\n2. 网格任意位置出现 {t} 个或更多相同图案即赢；{t2}+ 和 {t3}+ 赔得更多。\n3. 点击网格上方的赔付表查看每个图案（最高 ×{max}）。'
    },
    R33: {
      en: '1. Set your stake and tap “Spin”: 3 reels, 3 rows, 5 lines (3 rows + 2 diagonals).\n2. 3 same symbols on a line win.\n3. Tap the pay table above the reels to see every symbol (up to ×{max}).',
      fr: '1. Choisis ta mise et touche « Tourner » : 3 rouleaux, 3 rangées, 5 lignes (3 rangées + 2 diagonales).\n2. 3 symboles pareils sur une ligne gagnent.\n3. Touche le tableau au-dessus des rouleaux pour voir chaque symbole (jusqu’à ×{max}).',
      es: '1. Elige tu apuesta y toca «Girar»: 3 rodillos, 3 filas, 5 líneas (3 filas + 2 diagonales).\n2. 3 símbolos iguales en una línea ganan.\n3. Toca la tabla sobre los rodillos para ver cada símbolo (hasta ×{max}).',
      pt: '1. Escolha o valor e toque em «Girar»: 3 rolos, 3 linhas, 5 linhas de pagamento (3 retas + 2 diagonais).\n2. 3 símbolos iguais numa linha ganham.\n3. Toque na tabela acima dos rolos para ver cada símbolo (até ×{max}).',
      ar: '1. اختر رهانك والمس «دوّر»: 3 بكرات و3 صفوف و5 خطوط (3 صفوف + قطران).\n2. 3 رموز متطابقة على خط تربح.\n3. المس جدول الأرباح فوق البكرات لرؤية كل رمز (حتى ×{max}).',
      tr: '1. Bahsini seç ve “Çevir”e dokun: 3 makara, 3 sıra, 5 çizgi (3 sıra + 2 çapraz).\n2. Bir çizgide 3 aynı sembol kazanır.\n3. Her sembolü görmek için makaraların üstündeki tabloya dokun (×{max}’e kadar).',
      vi: '1. Chọn mức cược rồi chạm «Quay»: 3 cuộn, 3 hàng, 5 đường (3 hàng + 2 đường chéo).\n2. 3 biểu tượng giống nhau trên một đường sẽ thắng.\n3. Chạm bảng thưởng phía trên cuộn để xem từng biểu tượng (tới ×{max}).',
      id: '1. Atur taruhan lalu sentuh «Putar»: 3 gulungan, 3 baris, 5 garis (3 baris + 2 diagonal).\n2. 3 simbol sama di satu garis menang.\n3. Sentuh tabel di atas gulungan untuk melihat setiap simbol (hingga ×{max}).',
      ru: '1. Выберите ставку и нажмите «Крутить»: 3 барабана, 3 ряда, 5 линий (3 ряда + 2 диагонали).\n2. 3 одинаковых символа на линии выигрывают.\n3. Нажмите на таблицу над барабанами, чтобы увидеть каждый символ (до ×{max}).',
      de: '1. Wähle deinen Einsatz und tippe auf „Drehen“: 3 Walzen, 3 Reihen, 5 Linien (3 Reihen + 2 Diagonalen).\n2. 3 gleiche Symbole auf einer Linie gewinnen.\n3. Tippe auf die Gewinntabelle über den Walzen, um jedes Symbol zu sehen (bis ×{max}).',
      hi: '1. राशि चुनें और «घुमाएं» छुएं: 3 रील, 3 पंक्तियां, 5 लाइनें (3 पंक्तियां + 2 तिरछी)।\n2. एक लाइन पर 3 एक जैसे चिह्न जीतते हैं।\n3. हर चिह्न देखने के लिए रीलों के ऊपर की तालिका छुएं (×{max} तक)।',
      zh: '1. 设定金额并点击“旋转”：3 个转轴、3 行、5 条线（3 横 + 2 斜）。\n2. 一条线上 3 个相同图案即赢。\n3. 点击转轴上方的赔付表查看每个图案（最高 ×{max}）。'
    },
    R3: {
      en: '1. Set your stake and tap “Spin”: 3 classic reels, one line in the middle.\n2. 3 same symbols win: 7 7 7 ×100, triple BAR ×40, BAR ×20, bells ×10, plums ×6, cherries ×4.\n3. Cherries also pay alone: 2 cherries ×2, 1 cherry ×0.5.',
      fr: '1. Choisis ta mise et touche « Tourner » : 3 rouleaux classiques, une ligne au milieu.\n2. 3 symboles pareils gagnent : 7 7 7 ×100, triple BAR ×40, BAR ×20, cloches ×10, prunes ×6, cerises ×4.\n3. Les cerises paient aussi seules : 2 cerises ×2, 1 cerise ×0.5.',
      es: '1. Elige tu apuesta y toca «Girar»: 3 rodillos clásicos, una línea en el centro.\n2. 3 símbolos iguales ganan: 7 7 7 ×100, triple BAR ×40, BAR ×20, campanas ×10, ciruelas ×6, cerezas ×4.\n3. Las cerezas también pagan solas: 2 cerezas ×2, 1 cereza ×0.5.',
      pt: '1. Escolha o valor e toque em «Girar»: 3 rolos clássicos, uma linha no meio.\n2. 3 símbolos iguais ganham: 7 7 7 ×100, BAR triplo ×40, BAR ×20, sinos ×10, ameixas ×6, cerejas ×4.\n3. As cerejas também pagam sozinhas: 2 cerejas ×2, 1 cereja ×0.5.',
      ar: '1. اختر رهانك والمس «دوّر»: 3 بكرات كلاسيكية وخط واحد في الوسط.\n2. 3 رموز متطابقة تربح: 7 7 7 ×100، BAR ثلاثي ×40، BAR ×20، أجراس ×10، خوخ ×6، كرز ×4.\n3. الكرز يربح وحده أيضًا: حبتا كرز ×2، حبة واحدة ×0.5.',
      tr: '1. Bahsini seç ve “Çevir”e dokun: 3 klasik makara, ortada tek çizgi.\n2. 3 aynı sembol kazanır: 7 7 7 ×100, üçlü BAR ×40, BAR ×20, çan ×10, erik ×6, kiraz ×4.\n3. Kirazlar tek başına da öder: 2 kiraz ×2, 1 kiraz ×0.5.',
      vi: '1. Chọn mức cược rồi chạm «Quay»: 3 cuộn cổ điển, một đường ở giữa.\n2. 3 biểu tượng giống nhau thắng: 7 7 7 ×100, BAR ba ×40, BAR ×20, chuông ×10, mận ×6, anh đào ×4.\n3. Anh đào cũng thắng riêng: 2 quả ×2, 1 quả ×0.5.',
      id: '1. Atur taruhan lalu sentuh «Putar»: 3 gulungan klasik, satu garis di tengah.\n2. 3 simbol sama menang: 7 7 7 ×100, BAR tiga ×40, BAR ×20, lonceng ×10, plum ×6, ceri ×4.\n3. Ceri juga membayar sendiri: 2 ceri ×2, 1 ceri ×0.5.',
      ru: '1. Выберите ставку и нажмите «Крутить»: 3 классических барабана, одна линия в центре.\n2. 3 одинаковых символа выигрывают: 7 7 7 ×100, тройной BAR ×40, BAR ×20, колокольчики ×10, сливы ×6, вишни ×4.\n3. Вишни платят и сами: 2 вишни ×2, 1 вишня ×0.5.',
      de: '1. Wähle deinen Einsatz und tippe auf „Drehen“: 3 klassische Walzen, eine Linie in der Mitte.\n2. 3 gleiche Symbole gewinnen: 7 7 7 ×100, dreifach BAR ×40, BAR ×20, Glocken ×10, Pflaumen ×6, Kirschen ×4.\n3. Kirschen zahlen auch allein: 2 Kirschen ×2, 1 Kirsche ×0.5.',
      hi: '1. राशि चुनें और «घुमाएं» छुएं: 3 क्लासिक रील, बीच में एक लाइन।\n2. 3 एक जैसे चिह्न जीतते हैं: 7 7 7 ×100, तिहरा BAR ×40, BAR ×20, घंटी ×10, आलूबुखारा ×6, चेरी ×4।\n3. चेरी अकेले भी देती है: 2 चेरी ×2, 1 चेरी ×0.5।',
      zh: '1. 设定金额并点击“旋转”：3 个经典转轴，中间一条线。\n2. 3 个相同图案即赢：7 7 7 ×100、三条 BAR ×40、BAR ×20、铃铛 ×10、李子 ×6、樱桃 ×4。\n3. 樱桃单独也赔：2 个樱桃 ×2，1 个樱桃 ×0.5。'
    }
  };
  function rulesFor(k) {
    var d = TH[k], o = {}, mx = 0, D = dims(d);
    rowsOf(d).forEach(function (r) { mx = Math.max(mx, r.m); });
    Object.keys(RT[d.kind]).forEach(function (lg) {
      var s = RT[d.kind][lg].replace('{max}', mx).replace('{s3}', d.scat[0]).replace('{s4}', d.scat[1]).replace('{g}', D[0] + '×' + D[1]);
      if (d.bands) s = s.replace('{t}', d.bands[0]).replace('{t2}', d.bands[1]).replace('{t3}', d.bands[2]);
      if (['fr', 'es', 'pt', 'tr', 'vi', 'id', 'ru', 'de'].indexOf(lg) >= 0) s = s.replace(/(\d)\.(\d)/g, '$1,$2');
      o[lg] = s;
    });
    return o;
  }

  /* ====================================================================== the machine */
  var CS = 100; // cell size in the SVG
  function game(key) {
    var d = TH[key], ROWS = rowsOf(d), D = dims(d), C = D[0], Rw = D[1], NS = nSym(d);
    return function (box) {
      var B = mk('czg' + key.slice(0, 3) + '_'), art = d.art(B), busy = false;
      var W = C * CS, H = Rw * CS, P = 14;
      var defs = '<defs>' + B.defs() + art.map(function (s, i) { return '<symbol id="czs' + key + i + '" viewBox="0 0 100 100" overflow="visible">' + s + '</symbol>'; }).join('') +
        '<clipPath id="czClip' + key + '"><rect x="0" y="0" width="' + W + '" height="' + H + '" rx="10"/></clipPath>' +
        '<linearGradient id="czFr' + key + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + d.fr[0] + '"/><stop offset=".5" stop-color="' + d.fr[1] + '"/><stop offset="1" stop-color="' + d.fr[2] + '"/></linearGradient>' +
        '<linearGradient id="czSh' + key + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".18" stop-color="#000" stop-opacity="0"/><stop offset=".82" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient></defs>';
      var use = function (s, x, y) { return '<use href="#czs' + key + s + '" x="' + x + '" y="' + y + '" width="' + CS + '" height="' + CS + '"/>'; };
      // pay table chips: the 4 best payouts
      var chips = [];
      if (d.kind === 'L5') { chips = [[0, '5 ' + xm(d.pays[0][2])], [1, '5 ' + xm(d.pays[1][2])], [2, '5 ' + xm(d.pays[2][2])]]; if (d.scat.length) chips.push([NS - 1, '3 ' + xm(d.scat[0])]); }
      else if (d.kind === 'W5') chips = [0, 1, 2, 3].map(function (s) { return [s, '5 ' + xm(d.pays[s][2])]; });
      else if (d.kind === 'A') chips = [0, 1, 2].map(function (s) { return [s, d.bands[2] + '+ ' + xm(d.pays[s][2])]; });
      else chips = [0, 1, 2, 3].map(function (s) { return [s, xm(d.pays[s])]; });
      var icon = function (s) { return '<svg viewBox="0 0 100 100" aria-hidden="true"><use href="#czs' + key + s + '"/></svg>'; };
      // full pay table (numbers only: no words to translate)
      var ptRows = '';
      for (var s = 0; s < NS; s++) {
        var t = '';
        if (d.kind === 'L5') t = s < d.pays.length ? [5, 4, 3].map(function (n) { return n + ' ' + xm(d.pays[s][n - 3]); }).join(' · ') : [4, 3].map(function (n) { return n + ' ' + xm(d.scat[n - 3]); }).join(' · ');
        else if (d.kind === 'W5') t = [5, 4, 3].map(function (n) { return n + ' ' + xm(d.pays[s][n - 3]); }).join(' · ');
        else if (d.kind === 'A') t = [2, 1, 0].map(function (b) { return d.bands[b] + '+ ' + xm(d.pays[s][b]); }).join(' · ');
        else t = '3 ' + xm(d.pays[s]);
        ptRows += '<div class="cz-pr">' + icon(s) + '<b class="fit" dir="ltr">' + t + '</b></div>';
      }
      if (d.kind === 'R3') ptRows += '<div class="cz-pr">' + icon(5) + icon(5) + '<b class="fit" dir="ltr">' + xm(d.scat[0]) + '</b></div><div class="cz-pr">' + icon(5) + '<b class="fit" dir="ltr">' + xm(d.scat[1]) + '</b></div>';
      var l = { verb: SPIN[K.lang()] || SPIN.en };
      box.classList.add('cg-game', 'cz', 'cz-' + key, 'cz-' + d.kind);
      box.style.setProperty('--czbg', d.bg);
      box.innerHTML = '<div class="cg-stage cz-stage"><button type="button" class="cz-pay" aria-label="i">' + chips.map(function (c) { return '<span>' + icon(c[0]) + '<b class="fit" dir="ltr">' + c[1] + '</b></span>'; }).join('') + '<i class="cz-i">i</i></button>' +
        '<div class="cz-scene"><svg class="cz-svg" viewBox="' + (-P) + ' ' + (-P) + ' ' + (W + 2 * P) + ' ' + (H + 2 * P) + '" preserveAspectRatio="xMidYMid meet" dir="ltr" aria-hidden="true">' + defs +
          '<rect x="' + (-P) + '" y="' + (-P) + '" width="' + (W + 2 * P) + '" height="' + (H + 2 * P) + '" rx="22" fill="url(#czFr' + key + ')"/>' +
          '<rect x="-3" y="-3" width="' + (W + 6) + '" height="' + (H + 6) + '" rx="12" fill="#000" opacity=".5"/>' +
          '<g clip-path="url(#czClip' + key + ')"><rect width="' + W + '" height="' + H + '" fill="' + d.cell + '"/>' +
            Array.apply(null, Array(C)).map(function (_, c) { return '<rect x="' + (c * CS + (c ? 1 : 0)) + '" width="' + (CS - 2) + '" height="' + H + '" fill="#fff" opacity="' + (d.kind === 'R3' ? '0' : '.04') + '"/><g class="cz-reel" id="czR' + c + '"></g>'; }).join('') +
            '<rect width="' + W + '" height="' + H + '" fill="url(#czSh' + key + ')" pointer-events="none"/></g>' +
          Array.apply(null, Array(C - 1)).map(function (_, c) { return '<path d="M' + ((c + 1) * CS) + ' 0V' + H + '" stroke="#000" stroke-opacity=".35" stroke-width="2"/>'; }).join('') +
          (d.kind === 'R3' ? '<path d="M-10 150H310" stroke="#DC2626" stroke-width="3" stroke-dasharray="10 8" opacity=".55"/>' : '') +
          '<g id="czWin"></g><g id="czBig" opacity="0"><rect x="' + (W / 2 - 150) + '" y="' + (H / 2 - 44) + '" width="300" height="88" rx="22" fill="#000" opacity=".72"/><text id="czBigT" x="' + (W / 2) + '" y="' + (H / 2 + 20) + '" text-anchor="middle" font-family="var(--cg-font),Arial,sans-serif" font-weight="900" font-size="58" fill="#FDE68A" stroke="#78350F" stroke-width="3" paint-order="stroke"></text></g>' +
        '</svg><div class="cz-pt" hidden><div class="cz-ptin">' + ptRows + '</div></div></div><div class="cz-tab" hidden>' + ptRows + '</div></div>' + K.stakePanel(l.verb);
      K.bindStake(box);
      var reels = [].slice.call(box.querySelectorAll('.cz-reel')), win = box.querySelector('#czWin'), big = box.querySelector('#czBig'), bigT = box.querySelector('#czBigT');
      var pt = box.querySelector('.cz-pt'), cur = null;
      box.querySelector('.cz-pay').addEventListener('click', function () { pt.hidden = !pt.hidden; if (!pt.hidden) K.fitAll(pt); });
      pt.addEventListener('click', function () { pt.hidden = true; });
      // tall screens: the machine keeps its shape and the full pay table shows under it (no empty space)
      var stage = box.querySelector('.cz-stage'), scene = box.querySelector('.cz-scene'), tab = box.querySelector('.cz-tab'), chipsEl = box.querySelector('.cz-pay');
      function layout() {
        if (!box.isConnected) return;
        scene.style.removeProperty('flex'); tab.hidden = true; chipsEl.hidden = false;
        var cs = getComputedStyle(stage), avail = stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - chipsEl.offsetHeight - 6;
        var want = scene.clientWidth * (H + 2 * P) / (W + 2 * P);
        if (avail - want < 70) return;
        tab.hidden = false; chipsEl.hidden = true; K.fitAll(tab);
        var room = avail + chipsEl.offsetHeight + 6 - want - 8;
        if (tab.scrollHeight > room) { tab.hidden = true; chipsEl.hidden = false; return; }
        scene.style.setProperty('flex', '0 0 ' + Math.floor(want) + 'px');
      }
      requestAnimationFrame(layout); setTimeout(layout, 300);
      if (window.ResizeObserver) { var ro = new ResizeObserver(function () { if (!box.isConnected) { ro.disconnect(); return; } layout(); }); ro.observe(stage); }
      function paint(g) { cur = g; reels.forEach(function (R, c) { R.removeAttribute('transform'); R.innerHTML = g[c].map(function (s, r) { return use(s, c * CS, r * CS); }).join(''); }); }
      function randGrid() { var g = []; for (var c = 0; c < C; c++) { g.push([]); for (var r = 0; r < Rw; r++) g[c].push(rnd(NS)); } return g; }
      var first = buildGrid(d, ROWS[0]); paint(first ? first.g : randGrid());
      function clearWin() { win.innerHTML = ''; big.setAttribute('opacity', '0'); box.classList.remove('cz-won'); }
      /* spin: every reel turns at full speed until the result is known, then stops one after the other on the final grid */
      function spin(resP, demo) {
        return new Promise(function (res, rej) {
          var t0 = performance.now(), spd = 2.6 * CS / 100, res0 = null, stops = null, last = t0, tick = 0;
          var fill = reels.map(function () { var a = []; for (var i = 0; i < Rw + 8; i++) a.push(rnd(NS)); return a; });
          var off = reels.map(function () { return 0; });
          reels.forEach(function (R, c) { R.innerHTML = fill[c].map(function (s, r) { return use(s, c * CS, (r - 8) * CS); }).join(''); });
          if (!demo) amb(key, true, 0.6);
          resP.then(function (x) { res0 = x || { fail: 1 }; }, function () { res0 = { fail: 1 }; });
          var step = function (now) {
            if (!box.isConnected) { amb(key, false); rej(GONE); return; }
            var dt = Math.min(50, now - last); last = now;
            if (res0 && !stops) {
              if (res0.fail) { amb(key, false); paint(cur); res(null); return; }
              var lt = lite() ? 0.6 : 1, base = Math.max(now, t0 + 380 * lt);
              stops = reels.map(function (R, c) {
                var dur = (480 + c * (d.kind === 'A' ? 120 : 230)) * lt, F = Math.round(spd * dur / CS / 3) + 2, strip = res0.g[c].slice();
                for (var i = 0; i < F; i++) strip.push(rnd(NS));
                strip = strip.concat(cur ? cur[c] : []);
                R.innerHTML = strip.map(function (s2, r) { return use(s2, c * CS, r * CS); }).join('');
                return { t: base, dur: dur, dist: (strip.length - Rw) * CS, done: false };
              });
            }
            var alive = false;
            reels.forEach(function (R, c) {
              if (stops) {
                var st = stops[c]; if (st.done) return;
                var k = Math.max(0, Math.min(1, (now - st.t) / st.dur)), e = 1 - Math.pow(1 - k, 3), back = k > 0.86 ? Math.sin((k - 0.86) / 0.14 * Math.PI) * 9 : 0;
                R.setAttribute('transform', 'translate(0 ' + (-st.dist * (1 - e) + back).toFixed(1) + ')');
                if (k >= 1) { st.done = true; R.removeAttribute('transform'); if (!demo) snd('reel', { k: c }, key); else return; }
                else alive = true;
              } else {
                off[c] = (off[c] + spd * dt) % (8 * CS);
                R.setAttribute('transform', 'translate(0 ' + off[c].toFixed(1) + ')');
                alive = true;
              }
            });
            if (!demo && (tick += dt) > 90) { tick = 0; K.sfx('tick'); }
            if (stops && !alive) { amb(key, false); cur = res0.g; reels.forEach(function (R, c) { R.innerHTML = cur[c].map(function (s3, r) { return use(s3, c * CS, r * CS); }).join(''); }); res(res0); return; }
            K.S.raf = requestAnimationFrame(step);
          };
          K.S.raf = requestAnimationFrame(step);
        });
      }
      function showWin(w, m, demo) {
        if (!w) return Promise.resolve();
        box.classList.add('cz-won');
        var h = w.cells.map(function (q) { return '<rect class="cz-hit" x="' + (q[0] * CS + 4) + '" y="' + (q[1] * CS + 4) + '" width="' + (CS - 8) + '" height="' + (CS - 8) + '" rx="14"/>'; }).join('');
        if (w.li != null) { var L = (d.kind === 'L5' ? LINES5 : LINES3)[w.li]; h = '<polyline class="cz-line" points="' + L.map(function (r, c) { return (c * CS + 50) + ',' + (r * CS + 50); }).join(' ') + '"/>' + h; }
        win.innerHTML = h;
        if (m >= 10 && !demo) {
          big.setAttribute('opacity', '1');
          return new Promise(function (res) {
            var t0 = performance.now(), dur = lite() ? 700 : 1300;
            (function f(now) {
              if (!box.isConnected) { res(); return; }
              var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 2.4);
              bigT.textContent = '×' + (m * e).toFixed(2).replace('.', K.dec());
              K.sfxBeat(big, 'n', Math.floor(e * 8), 'rise', { n: Math.floor(e * 8) });
              if (k < 1) K.S.raf = requestAnimationFrame(f); else { snd('coin', { k: 3 }, key); setTimeout(res, 500); }
            })(t0);
          });
        }
        return Promise.resolve();
      }
      function rowIndex(r) {
        var i = r.view && typeof r.view.i === 'number' ? r.view.i : -1;
        if (ROWS[i] && Math.abs(ROWS[i].m - r.mult) < 1e-9) return i;
        for (var j = 0; j < ROWS.length; j++) if (Math.abs(ROWS[j].m - r.mult) < 1e-9) return j; // older table: same payout
        return 0;
      }
      var go = $('csGo');
      go.addEventListener('click', async function () {
        if (busy) return;
        if (K.guest()) { K.play(key, {}); return; }
        busy = true; go.disabled = true;
        if (demoP) { stopDemo = true; await demoP; demoP = null; } // the visitor just signed in: the demo ends first box.classList.add('cz-busy'); clearWin(); pt.hidden = true;
        var r = null;
        try {
          var pr = K.play(key, {}).then(function (x) {
            r = x; if (!x) return null;
            var row = ROWS[rowIndex(x)], b = buildGrid(d, row) || buildGrid(d, ROWS[0]);
            return b;
          });
          var b = await spin(pr, false);
          if (!r || !b || !box.isConnected) return;
          await showWin(b.win, r.mult, false);
          K.resultLine(box, r);
        } catch (e) { if (e !== GONE) { try { console.warn(e); } catch (e2) { /* ignore */ } if (r && box.isConnected) K.resultLine(box, r); } }
        finally { busy = false; if (box.isConnected) { go.disabled = false; box.classList.remove('cz-busy'); } }
      });
      // visitor: the machine plays by itself (no money, no sound) so the game is alive before signing up
      var stopDemo = false, demoP = null;
      if (K.guest()) {
        demoP = (async function attract() {
          try {
            await wait(box, 900);
            while (!stopDemo && K.guest()) {
              var won = Math.random() < 0.45, cand = ROWS.filter(function (x) { return won ? x.m >= 1 && x.m <= 40 : x.m === 0; });
              var b2 = buildGrid(d, cand[rnd(cand.length)]);
              clearWin();
              await spin(Promise.resolve(b2), true);
              if (b2) await showWin(b2.win, 0, true);
              if (!stopDemo) await wait(box, 2600);
            }
          } catch (e) { /* left the game */ }
        })();
      }
    };
  }
  D6.CasaSlots = { TH: TH, rowsOf: rowsOf, buildGrid: buildGrid, evalGrid: evalGrid, ORDER: ORDER, rulesFor: rulesFor }; // for tests
  if (!K) return;
  ORDER.forEach(function (k) { K.register(k, game(k), { rules: rulesFor(k) }); });
})(window.D6 = window.D6 || {});
