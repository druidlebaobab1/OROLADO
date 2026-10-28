/* casc1 (owner request, round 7) — 12 more video slots on the casa1 engine (same rules, new themes and art):
   L5  5 × 3, 10 lines + golden scatters (Samurai, Carnival, Steampunk, Dino Park) ;  W5  243 ways (Mermaid Lagoon, Jazz Club, Arctic) ;
   A   pays anywhere (Cyber City 6×5, Fairy Forest 5×4) ;  R33 3 × 3, 5 lines (Desert Oasis, Sushi Bar, Disco Night).
   The server draws the line (casino_ext/casc.php, same ROWS rule as here); the screen pays exactly that line and a losing
   screen never shows a winning combination (each grid is checked by the same evaluator). All symbols are SVG drawn here. */
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
  // pays/scat MUST be the same as casino_ext/casc.php (scripts/test-cg-casc.php compares them)
  var COPPER = ['#FFE4C7', '#C2773B', '#5C2E0E'], ICE = ['#F0F9FF', '#7DD3FC', '#0C4A6E'], NEON = ['#F5F3FF', '#C084FC', '#4C1D95'], PINK = ['#FFE4F2', '#EC4899', '#831843'], TEAL = ['#D5FFF6', '#0FB39A', '#064B44'];
  var TH = {
    samurai: { kind: 'L5', pays: [[8, 40, 250], [5, 15, 80], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], scat: [10, 50],
      bg: 'radial-gradient(90% 60% at 50% 0%,rgba(244,63,94,.35),transparent 70%),linear-gradient(180deg,#2A0A12,#0B0B14)', fr: ['#FECDD3', '#BE123C', '#3F0712'], cell: '#1A0B10',
      art: function (B) {
        return [
          // kabuto helmet
          shd(34) + '<path d="M18 62c0-28 14-42 32-42s32 14 32 42z" fill="' + B.lg(['#4B5563', '#111827', '#030712'], 'd') + '" stroke="#FBBF24" stroke-width="2"/>' +
            '<path d="M50 20C38 6 20 6 12 16c12-2 22 2 28 10zM50 20c12-14 30-14 38-4-12-2-22 2-28 10z" fill="' + B.lg(GOLD) + '" stroke="#78350F" stroke-width="1.6"/><circle cx="50" cy="34" r="7" fill="' + B.rg(RUBY) + '" stroke="#FBBF24" stroke-width="1.6"/>' +
            '<path d="M10 62h80l-6 14H16z" fill="' + B.lg(RUBY) + '" stroke="#450A0A" stroke-width="1.6"/><path d="M16 76l-6 14M84 76l6 14M30 76v14M70 76v14" stroke="#7F1D1D" stroke-width="5" stroke-linecap="round"/>' + gl(34, 40, 6, 10, 20, 0.3) + sp(84, 26, 6),
          // crossed katanas
          shd(30) + '<g stroke-linecap="round"><path d="M18 86L80 14" stroke="' + B.lg(SILV, 'd') + '" stroke-width="7"/><path d="M82 86L20 14" stroke="' + B.lg(SILV, 'd') + '" stroke-width="7"/>' +
            '<path d="M18 86l14-16M82 86L68 70" stroke="#111827" stroke-width="9"/><path d="M28 66l12 12M72 66L60 78" stroke="' + B.lg(GOLD) + '" stroke-width="6"/></g><path d="M78 16l4-6M22 16l-4-6" stroke="#fff" stroke-width="2" opacity=".8"/>',
          // sakura branch
          shd(28) + '<path d="M10 80Q40 64 52 40T88 18" stroke="#57534E" stroke-width="5" fill="none" stroke-linecap="round"/>' +
            [[34, 60, 13], [62, 32, 15], [80, 22, 10], [50, 74, 9]].map(function (f) { var p = ''; for (var i = 0; i < 5; i++) p += '<ellipse cx="' + f[0] + '" cy="' + (f[1] - f[2] * 0.55) + '" rx="' + (f[2] * 0.42) + '" ry="' + (f[2] * 0.6) + '" fill="' + B.rg(['#FFF1F7', '#F9A8D4', '#DB2777']) + '" transform="rotate(' + (i * 72) + ' ' + f[0] + ' ' + f[1] + ')"/>'; return p + '<circle cx="' + f[0] + '" cy="' + f[1] + '" r="' + (f[2] * 0.22) + '" fill="#FDE047"/>'; }).join(''),
          // torii gate
          shd(36) + '<path d="M8 18q42 10 84 0l-2 12q-40 6-80 0z" fill="' + B.lg(RUBY) + '" stroke="#450A0A" stroke-width="1.6"/><rect x="16" y="38" width="68" height="8" fill="' + B.lg(RUBY) + '" stroke="#450A0A"/>' +
            '<rect x="24" y="30" width="9" height="62" fill="' + B.lg(['#F87171', '#991B1B'], 'h') + '"/><rect x="67" y="30" width="9" height="62" fill="' + B.lg(['#F87171', '#991B1B'], 'h') + '"/><rect x="45" y="30" width="10" height="8" fill="#111827"/>',
          royal(B, 'A', GOLD), royal(B, 'K', RUBY), royal(B, 'Q', SILV),
          // scatter: rising sun
          '<circle cx="50" cy="50" r="44" fill="#fff" stroke="' + B.lg(GOLD) + '" stroke-width="4"/>' + [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { return '<path d="M50 50L' + (50 + Math.cos(i * Math.PI / 4) * 44).toFixed(1) + ' ' + (50 + Math.sin(i * Math.PI / 4) * 44).toFixed(1) + 'L' + (50 + Math.cos(i * Math.PI / 4 + 0.25) * 44).toFixed(1) + ' ' + (50 + Math.sin(i * Math.PI / 4 + 0.25) * 44).toFixed(1) + 'z" fill="#FCA5A5"/>'; }).join('') +
            '<circle cx="50" cy="50" r="20" fill="' + B.rg(['#FECACA', '#DC2626', '#7F1D1D']) + '"/>' + sp(82, 16, 7)
        ];
      } },
    mermaid: { kind: 'W5', pays: [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 3, 12], [0.6, 2, 8], [0.4, 1.2, 5]], scat: [],
      bg: 'radial-gradient(80% 50% at 50% 0%,rgba(45,212,191,.35),transparent 70%),linear-gradient(180deg,#083344,#020617)', fr: ['#A5F3FC', '#0891B2', '#083344'], cell: '#062A36',
      art: function (B) {
        return [
          // mermaid tail
          shd(30) + '<path d="M44 8c14 10 18 26 10 44-6 14-4 24 4 32-14 0-28 2-36 8 6-10 18-14 22-20-6-14-10-40 0-64z" fill="' + B.lg(['#99F6E4', '#14B8A6', '#134E4A'], 'd') + '" stroke="#134E4A" stroke-width="1.6"/>' +
            '<path d="M58 84c10-4 22 0 30 8-10 2-20 0-30-8zM58 84c-2 8-8 12-14 14" fill="' + B.lg(['#F5D0FE', '#C084FC']) + '" stroke="#6B21A8" stroke-width="1.4"/>' +
            [[46, 22], [50, 34], [46, 46], [44, 58]].map(function (p) { return '<path d="M' + (p[0] - 6) + ' ' + p[1] + 'q6 6 12 0" stroke="#CCFBF1" stroke-width="2" fill="none" opacity=".8"/>'; }).join('') + sp(78, 24, 6) + sp(20, 30, 4, 0.8),
          // pearl in an open shell
          shd(32) + '<path d="M10 62c0-26 18-44 40-44s40 18 40 44z" fill="' + B.lg(['#FBCFE8', '#F472B6', '#9D174D'], 'd') + '" stroke="#831843" stroke-width="1.6"/>' + [22, 36, 50, 64, 78].map(function (x) { return '<path d="M50 62L' + x + ' 22" stroke="#831843" stroke-width="1.4" opacity=".5"/>'; }).join('') +
            '<path d="M8 62h84q-6 22-42 22T8 62z" fill="' + B.lg(['#FCE7F3', '#F9A8D4']) + '" stroke="#831843" stroke-width="1.6"/><circle cx="50" cy="64" r="12" fill="' + B.rg(['#FFFFFF', '#F5F3FF', '#A5B4FC']) + '"/>' + gl(46, 60, 4, 2.6, -30, 0.9),
          // seahorse
          shd(18) + '<path d="M54 12c12 0 18 10 12 18l-8 4c6 10 8 22 0 34-6 8-4 16 4 18-10 6-22-2-18-16 2-8 8-14 4-24-4-6-12-8-12-16 0-10 8-18 18-18z" fill="' + B.lg(GOLD, 'd') + '" stroke="#92400E" stroke-width="1.6"/>' +
            '<path d="M66 22l14 2-12 6z" fill="#F59E0B"/><circle cx="56" cy="20" r="3" fill="#111"/><path d="M42 40q-8 6-6 14" stroke="#FDE68A" stroke-width="4" fill="none" stroke-linecap="round"/>',
          royal(B, 'A', TEAL), royal(B, 'K', PINK), royal(B, 'Q', AMET)
        ];
      } },
    carnival: { kind: 'L5', pays: [[6, 30, 200], [4, 15, 75], [3, 10, 40], [2, 6, 20], [1.2, 4, 12], [0.6, 2, 6], [0.4, 1.5, 5]], scat: [10, 40],
      bg: 'radial-gradient(90% 60% at 50% 0%,rgba(217,70,239,.4),transparent 70%),linear-gradient(180deg,#3B0764,#0F0520)', fr: ['#F5D0FE', '#A21CAF', '#3B0764'], cell: '#22082F',
      art: function (B) {
        return [
          // golden Venetian mask
          shd(34) + '<path d="M8 40c10-8 28-10 42 0 14-10 32-8 42 0-2 24-14 34-28 32-6-1-10-6-14-6s-8 5-14 6C22 74 10 64 8 40z" fill="' + B.lg(GOLD, 'd') + '" stroke="#78350F" stroke-width="2"/>' +
            '<path d="M22 46q8-8 18 0-8 8-18 0zM60 46q8-8 18 0-8 8-18 0z" fill="#1E1B4B"/><path d="M82 34Q96 10 86 2q-2 16-12 26" fill="' + B.lg(PINK) + '"/><path d="M76 30Q80 6 70 0q2 16-4 26" fill="' + B.lg(AMET) + '"/>' + sp(16, 22, 6) + '<circle cx="50" cy="40" r="4" fill="' + B.rg(RUBY) + '"/>',
          // jester hat
          shd(30) + '<path d="M20 70Q10 40 4 26q20 4 26 26M80 70q10-30 16-44-20 4-26 26M30 70Q34 30 50 12q16 18 20 58z" fill="' + B.lg(AMET) + '" stroke="#3B0764" stroke-width="1.6"/><path d="M30 70Q34 30 50 12q16 18 20 58z" fill="' + B.lg(['#FDE68A', '#F59E0B']) + '" stroke="#78350F" stroke-width="1.6"/>' +
            '<circle cx="4" cy="26" r="6" fill="' + B.lg(GOLD) + '"/><circle cx="96" cy="26" r="6" fill="' + B.lg(GOLD) + '"/><circle cx="50" cy="12" r="6" fill="' + B.lg(GOLD) + '"/><path d="M18 70h64v12H18z" fill="' + B.lg(RUBY) + '" stroke="#450A0A"/>',
          // feather plume
          shd(16) + '<path d="M50 92C40 70 30 30 52 6c18 24 10 64-2 86z" fill="' + B.lg(['#A5F3FC', '#0EA5E9', '#1E3A8A'], 'd') + '" stroke="#1E3A8A" stroke-width="1.4"/><path d="M50 92Q48 50 52 8" stroke="#E0F2FE" stroke-width="2" fill="none"/>' +
            [20, 32, 44, 56].map(function (y) { return '<path d="M50 ' + (y + 10) + 'l-10-8M51 ' + (y + 6) + 'l10-8" stroke="#E0F2FE" stroke-width="1.4" opacity=".7"/>'; }).join('') + '<circle cx="50" cy="40" r="7" fill="' + B.rg(['#FDE68A', '#F59E0B', '#78350F']) + '"/>',
          // drum
          shd(32) + '<ellipse cx="50" cy="34" rx="36" ry="12" fill="' + B.lg(['#FFFFFF', '#E5E7EB']) + '" stroke="#78350F" stroke-width="2"/><path d="M14 34v40q36 22 72 0V34q-36 22-72 0z" fill="' + B.lg(RUBY, 'h') + '" stroke="#450A0A" stroke-width="2"/>' +
            '<path d="M14 40l14 30 14-26 14 28 14-28 16 26" stroke="' + B.lg(GOLD) + '" stroke-width="3" fill="none"/><path d="M60 10l-16 22M76 14L56 30" stroke="#78350F" stroke-width="4" stroke-linecap="round"/>',
          royal(B, 'A', PINK), royal(B, 'K', GOLD), royal(B, 'Q', TEAL),
          // scatter: big top tent
          '<circle cx="50" cy="50" r="44" fill="' + B.rg(['#FFF7D6', '#FBBF24', '#78350F'], '50%', '50%', '60%') + '" opacity=".35"/><path d="M14 80L50 18l36 62z" fill="#fff" stroke="#7F1D1D" stroke-width="2"/>' +
            [0, 1, 2].map(function (i) { return '<path d="M50 18L' + (22 + i * 24) + ' 80h12z" fill="#DC2626"/>'; }).join('') + '<path d="M50 18V6l12 4-12 4" fill="#FBBF24" stroke="#FBBF24" stroke-width="1.4"/><path d="M42 80q8-16 16 0z" fill="#1E1B4B"/>' + sp(84, 18, 7)
        ];
      } },
    jazzclub: { kind: 'W5', pays: [[6, 25, 120], [3, 10, 50], [2, 6, 25], [1.2, 4, 12], [0.8, 2, 8], [0.4, 1.2, 5]], scat: [],
      bg: 'radial-gradient(70% 50% at 50% 0%,rgba(250,204,21,.25),transparent 70%),linear-gradient(180deg,#1E1B2E,#05040A)', fr: ['#FDE68A', '#7C2D12', '#1C0A04'], cell: '#14111F',
      art: function (B) {
        return [
          // saxophone
          shd(26) + '<path d="M60 8l4 4-6 6v44c0 18-12 28-26 28-12 0-18-8-18-16 0-6 4-10 10-10l4 10c-2 0-4 2-4 4 0 4 4 6 8 6 8 0 14-6 14-16V22z" fill="' + B.lg(GOLD, 'd') + '" stroke="#78350F" stroke-width="1.6"/>' +
            '<path d="M60 8l14-4 2 6-14 4z" fill="#111827"/>' + [30, 40, 50, 60].map(function (y) { return '<circle cx="54" cy="' + y + '" r="3.4" fill="#FEF3C7" stroke="#92400E"/>'; }).join('') + '<ellipse cx="22" cy="72" rx="8" ry="4" fill="#78350F" transform="rotate(-30 22 72)"/>' + sp(82, 30, 6),
          // vintage microphone
          shd(22) + '<path d="M50 62v24M36 90h28" stroke="' + B.lg(SILV) + '" stroke-width="5" stroke-linecap="round"/><rect x="30" y="8" width="40" height="58" rx="20" fill="' + B.lg(SILV, 'h') + '" stroke="#334155" stroke-width="2"/>' +
            [18, 26, 34, 42, 50].map(function (y) { return '<path d="M34 ' + y + 'h32" stroke="#475569" stroke-width="1.6"/>'; }).join('') + '<rect x="30" y="34" width="40" height="8" fill="' + B.lg(GOLD) + '"/>',
          // vinyl record
          shd(32) + '<circle cx="50" cy="50" r="40" fill="' + B.rg(['#4B5563', '#111827', '#000000']) + '"/>' + [32, 26, 20].map(function (r) { return '<circle cx="50" cy="50" r="' + r + '" fill="none" stroke="#374151" stroke-width="1.4"/>'; }).join('') +
            '<circle cx="50" cy="50" r="13" fill="' + B.lg(RUBY) + '"/><circle cx="50" cy="50" r="2.4" fill="#000"/><path d="M24 26a36 36 0 0 1 22-12" stroke="#fff" stroke-width="3" fill="none" opacity=".3" stroke-linecap="round"/>',
          royal(B, 'A', GOLD), royal(B, 'K', ['#FFE4E6', '#E11D48', '#4C0519']), royal(B, 'Q', ['#E0E7FF', '#6366F1', '#1E1B4B'])
        ];
      } },
    oasis: { kind: 'R33', pays: [50, 20, 10, 6, 3, 2], scat: [],
      bg: 'radial-gradient(90% 60% at 50% 0%,rgba(251,146,60,.4),transparent 70%),linear-gradient(180deg,#5A2A0B,#1C0F06)', fr: ['#FED7AA', '#C2410C', '#431407'], cell: '#2B1508',
      art: function (B) {
        return [
          // golden camel
          shd(34) + '<path d="M14 54c0-10 8-14 14-10 4-14 14-18 20-6 6-8 14-6 16 6l6-14c4-6 12-6 14 2l4 4-6 2-4 10c-2 14-10 20-22 20H34c-12 0-20-6-20-14z" fill="' + B.lg(GOLD, 'd') + '" stroke="#78350F" stroke-width="1.6"/>' +
            '<path d="M24 68v22M36 70v20M58 70v20M68 66v24" stroke="#B45309" stroke-width="5" stroke-linecap="round"/><circle cx="82" cy="34" r="2" fill="#111"/>' + sp(16, 22, 6) + sp(84, 80, 5),
          // palm tree
          shd(30) + '<path d="M50 90Q46 60 52 34" stroke="' + B.lg(['#D97706', '#78350F'], 'h') + '" stroke-width="8" fill="none" stroke-linecap="round"/>' +
            ['M52 34Q30 18 10 30q22-4 40 10', 'M52 34Q74 18 92 30q-22-4-40 10', 'M52 34Q40 10 22 8q20 8 28 26', 'M52 34Q66 8 84 8q-20 8-30 26', 'M52 34q-24 4-34 26 14-14 34-22'].map(function (d) { return '<path d="' + d + '" fill="' + B.lg(EMER) + '" stroke="#064E3B" stroke-width="1.2"/>'; }).join('') + '<circle cx="48" cy="38" r="4" fill="#78350F"/><circle cx="56" cy="38" r="4" fill="#78350F"/>',
          // genie lamp
          shd(34) + '<path d="M16 60c0-10 12-14 26-14h16c10 0 14-6 22-10 6-2 12 2 10 8l-14 4c-4 8-12 16-26 16H34c-10 0-18-2-18-4z" fill="' + B.lg(GOLD, 'd') + '" stroke="#78350F" stroke-width="2"/>' +
            '<path d="M36 46q14-14 28 0z" fill="' + B.lg(GOLD) + '" stroke="#78350F" stroke-width="1.6"/><circle cx="50" cy="34" r="4" fill="' + B.lg(GOLD) + '"/><path d="M34 70h32l4 10H30z" fill="#B45309"/><path d="M84 40q4-12-4-20 10 4 8 18" fill="#A78BFA" opacity=".7"/>',
          // dates bowl
          shd(30) + '<path d="M14 54h72q-4 30-36 30T14 54z" fill="' + B.lg(['#93C5FD', '#1D4ED8']) + '" stroke="#1E3A8A" stroke-width="1.6"/>' + [[30, 46], [44, 42], [58, 44], [72, 48], [38, 52], [52, 50], [64, 52]].map(function (p) { return '<ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="8" ry="5" fill="' + B.rg(['#FDBA74', '#9A3412', '#431407']) + '"/>'; }).join('') + '<path d="M18 62h64" stroke="#FDE68A" stroke-width="2.4"/>',
          // water jar
          shd(24) + '<path d="M40 10h20v8c14 6 22 18 20 36-2 20-14 34-30 34S22 74 20 54c-2-18 6-30 20-36z" fill="' + B.lg(['#FDBA74', '#C2410C', '#7C2D12'], 'h') + '" stroke="#431407" stroke-width="2"/><path d="M26 44h48M24 58h52" stroke="' + B.lg(TURQ) + '" stroke-width="5"/>' + gl(36, 34, 5, 10, 20, 0.35),
          // desert sun
          '<circle cx="50" cy="50" r="22" fill="' + B.rg(['#FEF9C3', '#FBBF24', '#EA580C']) + '"/>' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (i) { var a = i * Math.PI / 6; return '<path d="M' + (50 + Math.cos(a) * 28).toFixed(1) + ' ' + (50 + Math.sin(a) * 28).toFixed(1) + 'L' + (50 + Math.cos(a) * 40).toFixed(1) + ' ' + (50 + Math.sin(a) * 40).toFixed(1) + '" stroke="#F59E0B" stroke-width="5" stroke-linecap="round"/>'; }).join('')
        ];
      } },
    arctic: { kind: 'W5', pays: [[5, 20, 100], [3, 12, 40], [2, 6, 20], [1, 3, 10], [0.6, 2, 8], [0.4, 1.2, 4]], scat: [],
      bg: 'radial-gradient(80% 50% at 50% 0%,rgba(125,211,252,.4),transparent 70%),linear-gradient(180deg,#0C2A4A,#020817)', fr: ['#F0F9FF', '#38BDF8', '#0C4A6E'], cell: '#0B2238',
      art: function (B) {
        return [
          // polar bear
          shd(32) + '<circle cx="24" cy="26" r="10" fill="#F8FAFC" stroke="#94A3B8" stroke-width="1.6"/><circle cx="76" cy="26" r="10" fill="#F8FAFC" stroke="#94A3B8" stroke-width="1.6"/><circle cx="24" cy="26" r="5" fill="#CBD5E1"/><circle cx="76" cy="26" r="5" fill="#CBD5E1"/>' +
            '<ellipse cx="50" cy="54" rx="34" ry="32" fill="' + B.rg(['#FFFFFF', '#F1F5F9', '#94A3B8']) + '" stroke="#94A3B8" stroke-width="1.6"/><ellipse cx="50" cy="66" rx="14" ry="11" fill="#E2E8F0"/><ellipse cx="50" cy="60" rx="6" ry="4.4" fill="#111827"/>' +
            '<circle cx="38" cy="48" r="3.6" fill="#111827"/><circle cx="62" cy="48" r="3.6" fill="#111827"/><path d="M50 64v6M44 72q6 4 12 0" stroke="#111827" stroke-width="2" fill="none" stroke-linecap="round"/>' + sp(86, 80, 6),
          // penguin
          shd(22) + '<ellipse cx="50" cy="54" rx="26" ry="36" fill="' + B.lg(['#334155', '#0F172A']) + '"/><ellipse cx="50" cy="62" rx="17" ry="26" fill="#F8FAFC"/><circle cx="42" cy="34" r="4" fill="#fff"/><circle cx="58" cy="34" r="4" fill="#fff"/><circle cx="43" cy="35" r="2" fill="#111"/><circle cx="57" cy="35" r="2" fill="#111"/>' +
            '<path d="M44 42h12l-6 7z" fill="#F59E0B"/><path d="M38 90h10M52 90h10" stroke="#F59E0B" stroke-width="5" stroke-linecap="round"/><path d="M24 52q-10 14-6 24M76 52q10 14 6 24" stroke="#1E293B" stroke-width="7" stroke-linecap="round" fill="none"/>' +
            '<path d="M30 22q20-14 40 0" stroke="#DC2626" stroke-width="6" fill="none"/>',
          // igloo
          shd(38) + '<path d="M10 82c0-30 18-50 40-50s40 20 40 50z" fill="' + B.lg(ICE, 'd') + '" stroke="#0C4A6E" stroke-width="2"/>' + [48, 62, 74].map(function (y) { return '<path d="M' + (14 + (y - 48) * 0.1) + ' ' + y + 'h' + (72 - (y - 48) * 0.2) + '" stroke="#0369A1" stroke-width="1.4" opacity=".5"/>'; }).join('') +
            '<path d="M38 82c0-12 5-18 12-18s12 6 12 18z" fill="#0C4A6E"/><path d="M26 44l4 4M50 34v6M74 44l-4 4" stroke="#fff" stroke-width="2" opacity=".8"/>',
          royal(B, 'A', ICE), royal(B, 'K', ['#EDE9FE', '#8B5CF6', '#2E1065']), royal(B, 'Q', TEAL)
        ];
      } },
    steampunk: { kind: 'L5', pays: [[10, 50, 300], [5, 20, 80], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], scat: [12, 60],
      bg: 'radial-gradient(90% 60% at 50% 0%,rgba(234,179,8,.3),transparent 70%),linear-gradient(180deg,#2A1A0B,#0C0805)', fr: ['#FDE68A', '#92400E', '#1C1206'], cell: '#1E150A',
      art: function (B) {
        var cog = function (cx, cy, r, c) { var d = ''; for (var i = 0; i < 16; i++) { var a = i * Math.PI / 8, rr = i % 2 ? r : r * 0.8; d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1); } return '<path d="' + d + 'z" fill="' + B.lg(c, 'd') + '" stroke="#422006" stroke-width="1.4"/><circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.35) + '" fill="#1C1206"/>'; };
        return [
          // airship
          shd(36) + '<ellipse cx="50" cy="34" rx="42" ry="20" fill="' + B.lg(COPPER, 'd') + '" stroke="#422006" stroke-width="2"/><path d="M10 34h80M50 14v40" stroke="#422006" stroke-width="1.4" opacity=".6"/>' +
            '<path d="M86 30l10-10v28z" fill="' + B.lg(COPPER) + '" stroke="#422006"/><path d="M32 52l-4 14h44l-4-14" stroke="#422006" stroke-width="2" fill="none"/><rect x="28" y="66" width="44" height="14" rx="4" fill="' + B.lg(GOLD) + '" stroke="#422006"/>' +
            '<circle cx="40" cy="73" r="3" fill="#1C1206"/><circle cx="52" cy="73" r="3" fill="#1C1206"/><circle cx="64" cy="73" r="3" fill="#1C1206"/>' + cog(16, 74, 9, SILV) + gl(36, 24, 12, 4, -10, 0.4),
          // top hat with goggles
          shd(36) + '<rect x="26" y="12" width="48" height="50" rx="4" fill="' + B.lg(['#4B5563', '#111827'], 'h') + '" stroke="#000" stroke-width="1.6"/><ellipse cx="50" cy="64" rx="44" ry="10" fill="' + B.lg(['#374151', '#0B0F19']) + '"/>' +
            '<path d="M26 48h48" stroke="#92400E" stroke-width="7"/><circle cx="38" cy="40" r="10" fill="' + B.rg(['#FEF9C3', '#38BDF8', '#0C4A6E']) + '" stroke="' + B.lg(GOLD) + '" stroke-width="4"/><circle cx="62" cy="40" r="10" fill="' + B.rg(['#FEF9C3', '#38BDF8', '#0C4A6E']) + '" stroke="' + B.lg(GOLD) + '" stroke-width="4"/>',
          // gears
          cog(38, 56, 28, GOLD) + cog(72, 30, 18, COPPER) + cog(74, 72, 12, SILV),
          // pocket watch
          shd(28) + '<path d="M50 14V4M42 4h16" stroke="' + B.lg(GOLD) + '" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="54" r="36" fill="' + B.lg(GOLD, 'd') + '" stroke="#78350F" stroke-width="2"/><circle cx="50" cy="54" r="28" fill="#FFFBEB" stroke="#92400E" stroke-width="2"/>' +
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (i) { var a = i * Math.PI / 6; return '<circle cx="' + (50 + Math.cos(a) * 23).toFixed(1) + '" cy="' + (54 + Math.sin(a) * 23).toFixed(1) + '" r="1.8" fill="#78350F"/>'; }).join('') + '<path d="M50 54V36M50 54l12 8" stroke="#1C1206" stroke-width="3" stroke-linecap="round"/>',
          royal(B, 'A', COPPER), royal(B, 'K', GOLD), royal(B, 'Q', SILV),
          // scatter: golden key
          '<circle cx="50" cy="50" r="44" fill="' + B.rg(['#FFF7D6', '#FBBF24', '#78350F'], '50%', '50%', '60%') + '" opacity=".35"/><circle cx="32" cy="50" r="18" fill="none" stroke="' + B.lg(GOLD) + '" stroke-width="8"/><path d="M50 50h40M78 50v14M88 50v10" stroke="' + B.lg(GOLD) + '" stroke-width="8" stroke-linecap="round"/>' + cog(32, 50, 8, COPPER) + sp(82, 20, 7)
        ];
      } },
    cybercity: { kind: 'A', cols: 6, rows: 5, bands: [8, 10, 12], pays: [[6, 25, 120], [4, 12, 50], [2.5, 8, 25], [1.5, 5, 15], [1, 3, 10], [0.6, 2, 6], [0.4, 1.2, 4]],
      bg: 'radial-gradient(80% 50% at 50% 0%,rgba(232,121,249,.35),transparent 70%),linear-gradient(180deg,#140A2E,#04020C)', fr: ['#F0ABFC', '#7E22CE', '#1E0533'], cell: '#0D0820',
      art: function (B) {
        var ne = function (d, c, w) { return '<path d="' + d + '" stroke="' + c + '" stroke-width="' + ((w || 5) + 5) + '" fill="none" opacity=".25"' + RC + '/><path d="' + d + '" stroke="' + c + '" stroke-width="' + (w || 5) + '" fill="none"' + RC + '/><path d="' + d + '" stroke="#fff" stroke-width="1.6" fill="none" opacity=".8"' + RC + '/>'; };
        return [
          // robot head
          '<rect x="18" y="22" width="64" height="56" rx="14" fill="' + B.lg(['#E0E7FF', '#818CF8', '#312E81'], 'd') + '" stroke="#1E1B4B" stroke-width="2"/><rect x="26" y="36" width="48" height="20" rx="10" fill="#0B1020"/>' +
            '<circle cx="40" cy="46" r="5" fill="#22D3EE"/><circle cx="60" cy="46" r="5" fill="#22D3EE"/><path d="M38 66h24" stroke="#1E1B4B" stroke-width="4" stroke-linecap="round"/><path d="M50 22V10" stroke="#818CF8" stroke-width="3"/><circle cx="50" cy="8" r="5" fill="#F472B6"/><rect x="10" y="40" width="8" height="18" rx="3" fill="#6366F1"/><rect x="82" y="40" width="8" height="18" rx="3" fill="#6366F1"/>',
          // microchip
          '<rect x="24" y="24" width="52" height="52" rx="8" fill="' + B.lg(['#4B5563', '#111827'], 'd') + '" stroke="#22D3EE" stroke-width="2"/>' + [32, 44, 56, 68].map(function (q) { return '<path d="M' + q + ' 24V12M' + q + ' 76v12M24 ' + q + 'H12M76 ' + q + 'h12" stroke="' + B.lg(GOLD) + '" stroke-width="4" stroke-linecap="round"/>'; }).join('') + '<rect x="36" y="36" width="28" height="28" rx="4" fill="none" stroke="#22D3EE" stroke-width="2"/><circle cx="50" cy="50" r="5" fill="#22D3EE"/>',
          ne('M50 82L18 50a16 16 0 0 1 32-22 16 16 0 0 1 32 22z', '#F472B6'),
          ne('M56 10L26 54h22l-6 36 32-48H52z', '#FDE047'),
          ne('M20 60h60M30 60l-6-22h52l-6 22M40 38V28h20v10M14 28h14M72 28h14', '#22D3EE', 4),
          ne('M50 14L84 80H16z', '#4ADE80'),
          ne('M50 16a34 34 0 1 1 0 68 34 34 0 1 1 0-68zM42 36h12a8 8 0 0 1 0 16H42zM42 52v16M38 36v32', '#FB923C', 4)
        ];
      } },
    fairy: { kind: 'A', cols: 5, rows: 4, bands: [6, 8, 10], pays: [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 4, 12], [0.8, 2.5, 8], [0.5, 1.5, 5], [0.3, 1, 3]],
      bg: 'radial-gradient(80% 60% at 50% 0%,rgba(134,239,172,.3),transparent 70%),linear-gradient(180deg,#0B2A1C,#04120B)', fr: ['#D9F99D', '#4D7C0F', '#1A2E05'], cell: '#0D2418',
      art: function (B) {
        return [
          // fairy wand
          '<path d="M24 86L58 40" stroke="' + B.lg(['#FBCFE8', '#DB2777']) + '" stroke-width="6" stroke-linecap="round"/><path d="M66 10l7 15 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2z" fill="' + B.lg(GOLD, 'd') + '" stroke="#92400E" stroke-width="1.6" stroke-linejoin="round"/>' +
            sp(30, 30, 7) + sp(86, 66, 6) + sp(44, 60, 4, 0.8) + sp(16, 54, 4, 0.8),
          // mushroom house
          shd(30) + '<path d="M32 56h36v34H32z" fill="' + B.lg(['#FFFBEB', '#FDE68A']) + '" stroke="#92400E" stroke-width="1.6"/><path d="M44 90V74q6-6 12 0v16z" fill="#92400E"/><circle cx="60" cy="66" r="4" fill="#38BDF8" stroke="#92400E"/>' +
            '<path d="M8 58C10 30 28 14 50 14s40 16 42 44z" fill="' + B.rg(['#FECACA', '#EF4444', '#7F1D1D']) + '" stroke="#7F1D1D" stroke-width="2"/><circle cx="30" cy="38" r="6" fill="#fff"/><circle cx="56" cy="28" r="5" fill="#fff"/><circle cx="74" cy="44" r="6" fill="#fff"/>',
          // butterfly
          '<path d="M50 50C34 20 10 18 10 36s20 20 40 14zM50 50c16-30 40-32 40-14S70 56 50 50zM50 52c-14 4-30 14-24 28 6 10 20 0 24-28zM50 52c14 4 30 14 24 28-6 10-20 0-24-28z" fill="' + B.lg(['#E9D5FF', '#A855F7', '#581C87'], 'd') + '" stroke="#3B0764" stroke-width="1.4"/>' +
            '<circle cx="28" cy="36" r="6" fill="#FDE68A"/><circle cx="72" cy="36" r="6" fill="#FDE68A"/><rect x="47" y="34" width="6" height="36" rx="3" fill="#1E1B4B"/><path d="M48 34q-6-12-12-14M52 34q6-12 12-14" stroke="#1E1B4B" stroke-width="2" fill="none"/>',
          // flower
          shd(16) + '<path d="M50 56V94" stroke="#15803D" stroke-width="5"/><path d="M50 80q-16-4-20-16 16 2 20 16z" fill="#22C55E"/>' + [0, 1, 2, 3, 4, 5].map(function (i) { return '<ellipse cx="50" cy="20" rx="10" ry="16" fill="' + B.lg(['#FFE4E6', '#FB7185']) + '" transform="rotate(' + (i * 60) + ' 50 38)"/>'; }).join('') + '<circle cx="50" cy="38" r="10" fill="' + B.rg(['#FEF9C3', '#FACC15', '#A16207']) + '"/>',
          // ladybug
          shd(28) + '<circle cx="50" cy="26" r="12" fill="#111827"/><path d="M44 16l-8-10M56 16l8-10" stroke="#111827" stroke-width="2.4"/><ellipse cx="50" cy="56" rx="34" ry="32" fill="' + B.rg(['#FECACA', '#DC2626', '#7F1D1D']) + '" stroke="#450A0A" stroke-width="2"/><path d="M50 24v64" stroke="#111827" stroke-width="3"/>' +
            [[34, 46], [66, 46], [30, 66], [70, 66], [42, 80], [58, 80]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="6" fill="#111827"/>'; }).join('') + gl(36, 38, 6, 3, -30, 0.5),
          // acorn
          shd(20) + '<path d="M28 44h44c0 26-10 44-22 44S28 70 28 44z" fill="' + B.lg(['#FDBA74', '#B45309', '#78350F'], 'h') + '" stroke="#431407" stroke-width="1.6"/><path d="M22 46c0-14 12-24 28-24s28 10 28 24z" fill="' + B.lg(['#A16207', '#422006']) + '" stroke="#1C1206" stroke-width="1.6"/><path d="M50 22q2-12 10-14" stroke="#422006" stroke-width="4" fill="none" stroke-linecap="round"/>',
          // leaf
          shd(22) + '<path d="M14 84C14 40 44 14 88 12c0 44-26 72-74 72z" fill="' + B.lg(EMER, 'd') + '" stroke="#064E3B" stroke-width="2"/><path d="M14 84L76 24M36 62l-4-18M50 48l-2-18M36 62l18 2M50 48l18 2" stroke="#A7F3D0" stroke-width="2" fill="none" opacity=".8"/>'
        ];
      } },
    dinopark: { kind: 'L5', pays: [[6, 30, 200], [4, 15, 80], [3, 10, 40], [2, 6, 20], [1.2, 4, 12], [0.6, 2, 8], [0.4, 1.5, 5]], scat: [10, 50],
      bg: 'radial-gradient(90% 60% at 50% 0%,rgba(132,204,22,.35),transparent 70%),linear-gradient(180deg,#1C2A0B,#080C04)', fr: ['#D9F99D', '#4D7C0F', '#1A2E05'], cell: '#162008',
      art: function (B) {
        return [
          // T-rex head
          shd(34) + '<path d="M10 40c0-18 18-30 44-28 22 2 36 14 36 30 0 10-6 16-16 16H50l-6 20c-2 8-12 10-18 4L18 66C12 60 10 50 10 40z" fill="' + B.lg(['#BEF264', '#65A30D', '#1A2E05'], 'd') + '" stroke="#1A2E05" stroke-width="2"/>' +
            '<path d="M50 58h24M54 58v6M62 58v6M70 58v6" stroke="#fff" stroke-width="3"/><circle cx="66" cy="30" r="5" fill="#FDE047" stroke="#1A2E05" stroke-width="1.6"/><path d="M66 27v6" stroke="#111" stroke-width="2.4"/><path d="M60 22q6-6 14-2" stroke="#1A2E05" stroke-width="3" fill="none"/>' +
            [[30, 30], [40, 22], [24, 46]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" fill="#3F6212" opacity=".6"/>'; }).join('') + sp(86, 80, 6),
          // volcano
          shd(40) + '<path d="M6 90L36 34h28l30 56z" fill="' + B.lg(['#78716C', '#292524'], 'd') + '" stroke="#1C1917" stroke-width="2"/><path d="M36 34q14 10 28 0l-4 12-6-4-6 8-4-8-6 6z" fill="#F97316"/>' +
            '<path d="M50 30q-10-14 0-26 4 10 14 6-6 10-14 20z" fill="' + B.lg(['#FDE047', '#F97316', '#B91C1C']) + '"/><circle cx="30" cy="12" r="4" fill="#78716C" opacity=".7"/><circle cx="72" cy="10" r="5" fill="#78716C" opacity=".6"/>',
          // dino egg
          shd(24) + '<path d="M50 8c18 0 30 30 30 52S66 92 50 92 20 82 20 60 32 8 50 8z" fill="' + B.rg(['#ECFCCB', '#A3E635', '#3F6212']) + '" stroke="#365314" stroke-width="2"/>' +
            [[38, 40, 6], [60, 30, 5], [56, 62, 7], [36, 70, 4]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + p[2] + '" fill="#4D7C0F" opacity=".7"/>'; }).join('') + '<path d="M30 52l8 6 6-8 8 8 6-6 8 6 6-6" stroke="#365314" stroke-width="2" fill="none"/>' + gl(40, 28, 5, 10, 20, 0.4),
          // bone
          shd(32) + '<g transform="rotate(-30 50 50)"><rect x="22" y="42" width="56" height="16" rx="4" fill="' + B.lg(['#FFFBEB', '#E7D3B0']) + '" stroke="#78716C" stroke-width="1.6"/>' + [[22, 42], [22, 58], [78, 42], [78, 58]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="10" fill="' + B.lg(['#FFFBEB', '#E7D3B0']) + '" stroke="#78716C" stroke-width="1.6"/>'; }).join('') + '<rect x="24" y="44" width="52" height="12" fill="#FFFBEB"/></g>',
          royal(B, 'A', ['#ECFCCB', '#65A30D', '#1A2E05']), royal(B, 'K', ORNG), royal(B, 'Q', ['#E7E5E4', '#78716C', '#1C1917']),
          // scatter: amber with a mosquito
          '<circle cx="50" cy="50" r="44" fill="' + B.rg(['#FFF7D6', '#FBBF24', '#78350F'], '50%', '50%', '60%') + '" opacity=".35"/>' + gem(B, ngon(7, 36, 38, 10, 50, 50), ['#FEF3C7', '#F59E0B', '#7C2D12']) +
            '<path d="M44 48l12 4M50 44v14M42 56l16-8M46 42l-6-6M54 42l6-6" stroke="#1C1917" stroke-width="2" stroke-linecap="round" opacity=".8"/>'
        ];
      } },
    sushibar: { kind: 'R33', pays: [60, 25, 12, 6, 3, 1.5], scat: [],
      bg: 'radial-gradient(80% 60% at 50% 0%,rgba(248,113,113,.3),transparent 70%),linear-gradient(180deg,#2A1410,#0B0605)', fr: ['#FECACA', '#991B1B', '#2A0A0A'], cell: '#1F1310',
      art: function (B) {
        var rice = function (x, y, w, h) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (h / 2) + '" fill="' + B.lg(['#FFFFFF', '#E5E7EB']) + '" stroke="#9CA3AF" stroke-width="1.2"/>'; };
        return [
          // golden nigiri
          shd(34) + rice(14, 52, 72, 26) + '<path d="M10 52c4-18 24-24 40-22s34 4 40 22c-6 6-74 6-80 0z" fill="' + B.lg(['#FEF3C7', '#FBBF24', '#B45309'], 'd') + '" stroke="#92400E" stroke-width="1.6"/>' +
            '<path d="M26 40q6 8 4 14M42 34q6 8 4 18M58 34q6 8 4 18M74 40q4 6 2 12" stroke="#FFFBEB" stroke-width="3" fill="none" opacity=".8"/><rect x="44" y="40" width="12" height="38" fill="#14532D"/>' + sp(84, 22, 7),
          // maki roll
          shd(30) + '<ellipse cx="50" cy="66" rx="34" ry="18" fill="#14532D"/><path d="M16 46v20q34 22 68 0V46z" fill="#166534"/><ellipse cx="50" cy="46" rx="34" ry="18" fill="#fff" stroke="#14532D" stroke-width="4"/>' +
            '<ellipse cx="50" cy="46" rx="16" ry="9" fill="' + B.rg(['#FFE4E6', '#FB7185', '#BE123C']) + '"/><circle cx="48" cy="46" r="4" fill="#4ADE80"/>',
          // onigiri
          shd(30) + '<path d="M50 10C62 10 92 70 86 80S14 90 14 80 38 10 50 10z" fill="' + B.lg(['#FFFFFF', '#E5E7EB']) + '" stroke="#9CA3AF" stroke-width="1.6"/><path d="M30 64h40v26H30z" fill="#14532D"/><circle cx="42" cy="44" r="3" fill="#111"/><circle cx="58" cy="44" r="3" fill="#111"/><path d="M46 52q4 4 8 0" stroke="#111" stroke-width="2" fill="none"/><ellipse cx="36" cy="52" rx="4" ry="2.4" fill="#FDA4AF"/><ellipse cx="64" cy="52" rx="4" ry="2.4" fill="#FDA4AF"/>',
          // dumpling
          shd(32) + '<path d="M10 66c0-26 18-40 40-40s40 14 40 40c0 8-80 8-80 0z" fill="' + B.rg(['#FFFFFF', '#FEF3C7', '#D6D3D1']) + '" stroke="#A8A29E" stroke-width="1.6"/>' + [24, 36, 50, 64, 76].map(function (x) { return '<path d="M' + x + ' 34q0 12 ' + (x < 50 ? 4 : -4) + ' 22" stroke="#D6D3D1" stroke-width="2" fill="none"/>'; }).join('') + gl(36, 42, 8, 4, -20, 0.6),
          // tea cup
          shd(28) + '<path d="M18 40h60l-6 40c-2 8-8 10-24 10S28 88 26 80z" fill="' + B.lg(['#D1FAE5', '#34D399', '#065F46'], 'h') + '" stroke="#064E3B" stroke-width="1.6"/><ellipse cx="48" cy="40" rx="30" ry="7" fill="#A3E635" stroke="#064E3B" stroke-width="1.6"/>' +
            '<path d="M40 30q-6-10 0-18M54 30q-6-10 0-18" stroke="#fff" stroke-width="3" fill="none" opacity=".6" stroke-linecap="round"/><path d="M30 60h36" stroke="#FDE68A" stroke-width="3"/>',
          // chopsticks
          shd(26) + '<path d="M20 86L72 10M34 90L86 18" stroke="' + B.lg(['#FCD34D', '#B45309']) + '" stroke-width="6" stroke-linecap="round"/><path d="M58 30l8 4M70 34l8 4" stroke="#DC2626" stroke-width="5"/>'
        ];
      } },
    disco: { kind: 'R33', pays: [50, 20, 10, 6, 4, 2], scat: [],
      bg: 'radial-gradient(80% 60% at 50% 0%,rgba(236,72,153,.4),transparent 70%),linear-gradient(180deg,#2E0A3A,#0A0312)', fr: ['#FBCFE8', '#BE185D', '#3B0722'], cell: '#1E0827',
      art: function (B) {
        return [
          // disco ball
          '<path d="M50 4v10" stroke="#9CA3AF" stroke-width="2"/><circle cx="50" cy="54" r="38" fill="' + B.rg(['#FFFFFF', '#CBD5E1', '#334155']) + '"/>' +
            (function () { var s = ''; for (var r = 0; r < 7; r++) for (var c = 0; c < 7; c++) { var x = 22 + c * 9.4, y = 26 + r * 9.4, dx = x - 50, dy = y - 54; if (dx * dx + dy * dy > 33 * 33) continue; s += '<rect x="' + (x - 3.8).toFixed(1) + '" y="' + (y - 3.8).toFixed(1) + '" width="7.6" height="7.6" fill="' + ['#F9A8D4', '#C4B5FD', '#FFFFFF', '#67E8F9', '#E2E8F0'][(r * 3 + c) % 5] + '" opacity=".75"/>'; } return s; })() +
            '<circle cx="50" cy="54" r="38" fill="none" stroke="#475569" stroke-width="2"/>' + sp(30, 34, 8) + sp(84, 20, 6) + sp(14, 80, 5, 0.8),
          // roller skate
          shd(36) + '<path d="M22 16h26l4 34h30c8 0 10 8 10 14v6H18V24c0-4 2-8 4-8z" fill="' + B.lg(PINK, 'd') + '" stroke="#831843" stroke-width="2"/><path d="M24 30h22M24 40h24" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' +
            [28, 48, 68, 84].map(function (x) { return '<circle cx="' + x + '" cy="82" r="8" fill="' + B.rg(['#FEF9C3', '#FACC15', '#A16207']) + '" stroke="#713F12" stroke-width="1.6"/>'; }).join('') + '<rect x="88" y="62" width="8" height="8" rx="2" fill="#F472B6"/>',
          // cassette
          shd(36) + '<rect x="8" y="22" width="84" height="56" rx="8" fill="' + B.lg(['#C4B5FD', '#7C3AED', '#2E1065'], 'd') + '" stroke="#1E1B4B" stroke-width="2"/><rect x="18" y="30" width="64" height="18" rx="3" fill="#FDE68A"/>' +
            '<rect x="26" y="52" width="48" height="16" rx="8" fill="#1E1B4B"/><circle cx="36" cy="60" r="5" fill="#fff"/><circle cx="64" cy="60" r="5" fill="#fff"/><path d="M22 38h56" stroke="#F472B6" stroke-width="3"/>',
          // star sunglasses
          shd(36) + '<path d="M30 30l6 13 14 1-11 9 4 14-13-8-12 8 3-14-11-9 14-1zM70 30l6 13 14 1-11 9 4 14-13-8-12 8 3-14-11-9 14-1z" fill="' + B.lg(['#FDE68A', '#F59E0B', '#B45309'], 'd') + '" stroke="#78350F" stroke-width="1.6" stroke-linejoin="round"/><path d="M44 46q6-6 12 0" stroke="#78350F" stroke-width="3" fill="none"/>' +
            '<path d="M24 48q6-4 8 2M64 48q6-4 8 2" stroke="#fff" stroke-width="2.4" opacity=".7" fill="none"/>',
          // lips
          shd(30) + '<path d="M8 50c10-16 22-22 30-16 4 3 8 4 12 0s8-3 12 0c8-6 20 0 30 16-14 22-30 28-42 28S22 72 8 50z" fill="' + B.lg(['#FECDD3', '#E11D48', '#881337'], 'd') + '" stroke="#4C0519" stroke-width="1.6"/><path d="M10 50q40 8 80 0" stroke="#4C0519" stroke-width="2.4" fill="none"/>' + gl(36, 60, 8, 3, 0, 0.5),
          // lightning bolt
          shd(18) + '<path d="M60 6L22 56h24l-8 40 40-54H52z" fill="' + B.lg(['#CFFAFE', '#22D3EE', '#155E75'], 'd') + '" stroke="#164E63" stroke-width="2" stroke-linejoin="round"/>' + gl(48, 30, 4, 10, 35, 0.5)
        ];
      } },
    /* ---- casd (round 8) : 6 machines à sous de plus (mêmes helpers, pay tables = casino_ext/casc.php) ---- */
    westgold: { kind: 'L5', pays: [[8, 40, 250], [5, 15, 80], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], scat: [10, 50],
      bg: 'radial-gradient(90% 60% at 50% 0%,rgba(234,88,12,.32),transparent 70%),linear-gradient(180deg,#2A1406,#0B0905)', fr: ['#FED7AA', '#C2410C', '#3B1A06'], cell: '#1A0F06',
      art: function (B) {
        return [
          shd(28) + '<path d="M22 40q-6-16 10-20 10-3 18 4 14-4 20 8 6 14-6 22-10 7-22 4-12 3-18-8-6-10 8-10z" fill="' + B.rg(GOLD) + '" stroke="#78350F" stroke-width="2"/>' + gl(38, 38, 8, 5, -20, 0.5) + sp(66, 30, 5),
          shd(26) + '<g transform="rotate(-10 50 56)">' + [36, 50, 64].map(function (x) { return '<rect x="' + (x - 7) + '" y="40" width="14" height="40" rx="3" fill="' + B.lg(['#F87171', '#B91C1C', '#7F1D1D'], 'h') + '" stroke="#450A0A" stroke-width="1.4"/><rect x="' + (x - 7) + '" y="48" width="14" height="5" fill="#FDE68A"/>'; }).join('') + '</g><path d="M52 40q5-12 14-14" stroke="#78350F" stroke-width="2.4" fill="none"/>' + sp(70, 20, 5),
          shd(28) + '<path d="M12 32q38-16 76 0-11 7-19 4-19-6-38 0-11 3-19-4z" fill="' + B.lg(SILV, 'd') + '" stroke="#374151" stroke-width="1.6"/><rect x="46" y="30" width="8" height="58" rx="3" fill="' + B.lg(COPPER, 'h') + '" stroke="#5C2E0E" stroke-width="1.4"/>' + gl(34, 28, 8, 3, -10, 0.5),
          shd(30) + '<path d="M14 44h72l-8 26H22z" fill="' + B.lg(['#9CA3AF', '#4B5563', '#1F2937'], 'd') + '" stroke="#111827" stroke-width="2"/>' + [30, 42, 54, 66].map(function (x) { return '<circle cx="' + x + '" cy="40" r="5" fill="' + B.rg(GOLD) + '"/>'; }).join('') + [32, 68].map(function (x) { return '<circle cx="' + x + '" cy="76" r="8" fill="#1F2937" stroke="#9CA3AF" stroke-width="2"/>'; }).join(''),
          royal(B, 'A', GOLD), royal(B, 'K', RUBY), royal(B, 'Q', SILV),
          '<circle cx="50" cy="50" r="44" fill="' + B.rg(['#FEF3C7', '#F59E0B', '#78350F'], '50%', '50%', '60%') + '" opacity=".3"/>' + (function () { var d = ''; for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 17 : 42; d += (i ? 'L' : 'M') + (50 + Math.cos(a) * r).toFixed(1) + ' ' + (50 + Math.sin(a) * r).toFixed(1); } return '<path d="' + d + 'z" fill="' + B.lg(GOLD) + '" stroke="#78350F" stroke-width="2" stroke-linejoin="round"/>'; })() + '<circle cx="50" cy="50" r="9" fill="#78350F"/>' + sp(80, 22, 6)
        ];
      } },
    piratecove: { kind: 'W5', pays: [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 3, 12], [0.6, 2, 8], [0.4, 1.2, 5]], scat: [],
      bg: 'radial-gradient(90% 60% at 50% 0%,rgba(13,148,136,.3),transparent 70%),linear-gradient(180deg,#07201F,#050A12)', fr: ['#99F6E4', '#0D9488', '#063B38'], cell: '#071A1A',
      art: function (B) {
        return [
          shd(28) + '<path d="M50 14c-18 0-28 12-28 26 0 8 4 13 8 16v10h8v-6h8v6h8v-6h8v6h8V56c4-3 8-8 8-16 0-14-10-26-28-26z" fill="' + B.rg(['#FFFFFF', '#E5E7EB', '#9CA3AF']) + '" stroke="#374151" stroke-width="1.6"/><circle cx="40" cy="44" r="6" fill="#111827"/><circle cx="60" cy="44" r="6" fill="#111827"/><path d="M34 62q16 8 32 0" stroke="#111827" stroke-width="2" fill="none"/><path d="M14 30l24 10M86 30L62 40" stroke="#1F2937" stroke-width="4" stroke-linecap="round"/>',
          shd(30) + '<path d="M14 40q36-14 72 0v34H14z" fill="' + B.lg(COPPER, 'd') + '" stroke="#5C2E0E" stroke-width="2"/><rect x="12" y="38" width="76" height="12" rx="4" fill="' + B.lg(GOLD) + '" stroke="#5C2E0E"/><rect x="44" y="48" width="12" height="18" rx="2" fill="' + B.lg(GOLD) + '"/><circle cx="50" cy="56" r="2.6" fill="#5C2E0E"/>' + [[26, 30], [40, 28], [60, 28], [74, 30]].map(function (c) { return '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="4" fill="' + B.rg(GOLD) + '"/>'; }).join(''),
          shd(24) + '<path d="M58 14q18 2 20 22 2 22-18 40-6-2-6-8 14-14 12-30-2-14-14-16z" fill="' + B.lg(['#FBBF24', '#EA580C', '#7C2D12'], 'd') + '" stroke="#7C2D12" stroke-width="1.6"/><circle cx="56" cy="30" r="5" fill="#fff"/><circle cx="56" cy="30" r="2.4" fill="#111827"/><path d="M48 34l-10 2 10 3z" fill="#F59E0B"/><path d="M62 44q10 2 16 10-8 0-16-4z" fill="' + B.lg(RUBY, 'd') + '"/>',
          royal(B, 'A', GOLD), royal(B, 'K', EMER), royal(B, 'Q', SILV)
        ];
      } },
    shamrock: { kind: 'R33', pays: [50, 20, 10, 6, 3, 2], scat: [],
      bg: 'radial-gradient(80% 60% at 50% 0%,rgba(22,163,74,.34),transparent 70%),linear-gradient(180deg,#07240F,#050A07)', fr: ['#BBF7D0', '#16A34A', '#064E26'], cell: '#071A0C',
      art: function (B) {
        return [
          shd(30) + '<path d="M22 46h56l-6 30H28z" fill="' + B.lg(['#1F2937', '#111827', '#030712'], 'd') + '" stroke="#FBBF24" stroke-width="2"/><ellipse cx="50" cy="46" rx="30" ry="8" fill="#FBBF24"/>' + [[38, 40], [50, 38], [62, 40], [44, 44], [56, 44]].map(function (c) { return '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="5" fill="' + B.rg(GOLD) + '"/>'; }).join(''),
          shd(22) + (function () { var s = '<path d="M50 54v22" stroke="#166534" stroke-width="4" stroke-linecap="round"/>'; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { s += '<path d="M50 50q' + (q[0] * 18) + ' ' + (q[1] * 4) + ' ' + (q[0] * 14) + ' ' + (q[1] * 18) + 'q' + (-q[0] * 4) + ' ' + (q[1] * 4) + ' ' + (-q[0] * 14) + ' ' + (-q[1] * 14) + 'z" fill="' + B.rg(['#86EFAC', '#22C55E', '#15803D']) + '" stroke="#14532D" stroke-width="1.2"/>'; }); return s; })(),
          shd(24) + '<path d="M28 78V44a22 22 0 0 1 44 0v34h-10V44a12 12 0 0 0-24 0v34z" fill="' + B.lg(GOLD) + '" stroke="#78350F" stroke-width="2"/>' + [34, 66].map(function (x) { return '<circle cx="' + x + '" cy="78" r="4" fill="#FEF3C7"/>'; }).join('') + gl(40, 40, 6, 3, -20, 0.5),
          shd(22) + '<path d="M22 76q0-26 10-34l-4-10h44l-4 10q10 8 10 34z" fill="' + B.lg(['#4ADE80', '#15803D', '#064E26'], 'd') + '" stroke="#052E16" stroke-width="2"/><rect x="24" y="64" width="52" height="10" rx="2" fill="#052E16"/><rect x="44" y="64" width="12" height="10" fill="#FBBF24"/>',
          '<circle cx="50" cy="50" r="30" fill="' + B.rg(GOLD) + '" stroke="#78350F" stroke-width="2"/><text x="50" y="62" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="34" fill="#78350F">$</text>' + gl(40, 40, 8, 4, -20, 0.5),
          shd(20) + '<path d="M28 34h44l-4 32a18 10 0 0 1-36 0z" fill="' + B.lg(['#FDE68A', '#D97706', '#78350F'], 'd') + '" stroke="#78350F" stroke-width="1.6"/><ellipse cx="50" cy="34" rx="22" ry="6" fill="#FFFBEB"/><path d="M72 42q10 0 10 10t-10 8" fill="none" stroke="#78350F" stroke-width="3"/>'
        ];
      } },
    candypop: { kind: 'A', cols: 5, rows: 4, bands: [6, 8, 10], pays: [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 4, 12], [0.8, 2.5, 8], [0.5, 1.5, 5], [0.3, 1, 3]], scat: [],
      bg: 'radial-gradient(85% 60% at 50% 0%,rgba(236,72,153,.34),transparent 70%),linear-gradient(180deg,#2A0A2E,#0A0312)', fr: ['#FBCFE8', '#DB2777', '#500724'], cell: '#1C0820',
      art: function (B) {
        return [
          shd(22) + '<rect x="47" y="48" width="6" height="40" rx="3" fill="#F9FAFB"/><circle cx="50" cy="38" r="26" fill="' + B.rg(['#FFFFFF', '#F9A8D4', '#BE185D']) + '"/>' + (function () { var d = 'M50 38'; for (var i = 0; i <= 28; i++) { var a = i * 0.6, r = i * 0.85; d += 'L' + (50 + Math.cos(a) * r).toFixed(1) + ' ' + (38 + Math.sin(a) * r).toFixed(1); } return '<path d="' + d + '" fill="none" stroke="#fff" stroke-width="2.6" opacity=".85"/>'; })(),
          shd(18) + '<ellipse cx="50" cy="52" rx="24" ry="20" fill="' + B.rg(['#FDE68A', '#F59E0B', '#B45309']) + '" stroke="#92400E" stroke-width="1.6"/>' + gl(40, 44, 8, 5, -20, 0.6) + sp(66, 40, 5),
          shd(20) + '<circle cx="50" cy="50" r="24" fill="' + B.rg(['#FFE4C7', '#C2773B', '#5C2E0E']) + '"/><circle cx="50" cy="50" r="9" fill="#2A0A2E"/><path d="M50 26a24 24 0 0 1 0 48" fill="none" stroke="' + B.lg(['#F9A8D4', '#DB2777']) + '" stroke-width="7" stroke-linecap="round"/>' + [[34, 40], [64, 44], [44, 70], [68, 62]].map(function (c) { return '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="2.4" fill="#67E8F9"/>'; }).join(''),
          shd(16) + '<path d="M38 82q-10-2-10-14 0-30 22-54 6-6 14 0-16 22-16 46 0 10-10 22z" fill="' + B.lg(['#FFFFFF', '#F87171'], 'd') + '" stroke="#991B1B" stroke-width="1.6"/>' + [30, 42, 54, 64].map(function (y) { return '<path d="M' + (46 - (y - 30) * 0.3) + ' ' + y + 'q6-4 10 0" stroke="#EF4444" stroke-width="3.4" fill="none"/>'; }).join(''),
          shd(18) + '<path d="M30 70q-6-22 20-30 26 8 20 30z" fill="' + B.rg(['#C4B5FD', '#8B5CF6', '#4C1D95']) + '" stroke="#3B0764" stroke-width="1.6"/><ellipse cx="50" cy="42" rx="18" ry="5" fill="#fff" opacity=".4"/>',
          (function () { var d = ''; for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 14 : 32; d += (i ? 'L' : 'M') + (50 + Math.cos(a) * r).toFixed(1) + ' ' + (50 + Math.sin(a) * r).toFixed(1); } return shd(16) + '<path d="' + d + 'z" fill="' + B.rg(['#FEF9C3', '#FACC15', '#A16207']) + '" stroke="#78350F" stroke-width="1.6" stroke-linejoin="round"/>'; })() + gl(42, 42, 5, 3, 0, 0.6),
          shd(16) + '<path d="M50 78C30 62 24 50 24 40c0-9 7-15 14-15 5 0 9 3 12 7 3-4 7-7 12-7 7 0 14 6 14 15 0 10-6 22-26 38z" fill="' + B.rg(['#FECDD3', '#F43F5E', '#881337']) + '" stroke="#4C0519" stroke-width="1.6"/>' + gl(40, 40, 7, 4, -20, 0.6)
        ];
      } },
    olympus: { kind: 'L5', pays: [[10, 50, 300], [5, 20, 80], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], scat: [12, 60],
      bg: 'radial-gradient(90% 60% at 50% 0%,rgba(37,99,235,.3),transparent 70%),linear-gradient(180deg,#0A1330,#05070F)', fr: ['#BFDBFE', '#2563EB', '#111E4A'], cell: '#0A0F22',
      art: function (B) {
        return [
          shd(28) + '<path d="M30 86q-6-24 6-40 4-16 14-16t14 16q12 16 6 40z" fill="' + B.rg(['#F8FAFC', '#CBD5E1', '#64748B']) + '" stroke="#334155" stroke-width="1.6"/><circle cx="42" cy="46" r="3" fill="#1E293B"/><circle cx="58" cy="46" r="3" fill="#1E293B"/><path d="M34 58q16 10 32 0q-6 16-16 16t-16-16z" fill="' + B.rg(['#FFFFFF', '#E2E8F0', '#94A3B8']) + '"/><path d="M44 12l6 8 6-8" stroke="' + B.lg(GOLD) + '" stroke-width="3" fill="none"/>',
          shd(18) + '<path d="M58 8L26 54h22l-10 38 42-56H56z" fill="' + B.lg(['#FEF9C3', '#FACC15', '#A16207'], 'd') + '" stroke="#78350F" stroke-width="2" stroke-linejoin="round"/>' + gl(46, 30, 4, 12, 35, 0.6),
          shd(32) + '<path d="M14 36L50 16l36 20z" fill="' + B.lg(['#FDE68A', '#F59E0B', '#B45309'], 'd') + '" stroke="#78350F" stroke-width="1.6"/>' + [22, 36, 50, 64, 78].map(function (x) { return '<rect x="' + (x - 4) + '" y="40" width="8" height="34" fill="' + B.lg(['#F8FAFC', '#CBD5E1', '#64748B'], 'h') + '" stroke="#475569" stroke-width="1"/>'; }).join('') + '<rect x="14" y="74" width="72" height="8" fill="' + B.lg(['#E2E8F0', '#94A3B8']) + '" stroke="#475569"/>',
          shd(26) + (function () { var s = '<circle cx="50" cy="52" r="26" fill="none" stroke="' + B.lg(['#4ADE80', '#15803D']) + '" stroke-width="7"/>'; for (var i = 0; i < 14; i++) { var a = i / 14 * Math.PI * 2, cx = (50 + Math.cos(a) * 26).toFixed(1), cy = (52 + Math.sin(a) * 26).toFixed(1); s += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="5" ry="2.4" fill="' + B.rg(['#86EFAC', '#16A34A', '#064E26']) + '" transform="rotate(' + (a * 180 / Math.PI).toFixed(0) + ' ' + cx + ' ' + cy + ')"/>'; } return s; })(),
          royal(B, 'A', GOLD), royal(B, 'K', LAPIS), royal(B, 'Q', SILV),
          '<circle cx="50" cy="50" r="44" fill="' + B.rg(['#FEF3C7', '#F59E0B', '#78350F'], '50%', '50%', '60%') + '" opacity=".3"/><path d="M50 22q18 4 24 20-14-8-24-6-10-2-24 6 6-16 24-20z" fill="' + B.lg(GOLD) + '" stroke="#78350F" stroke-width="1.6"/><path d="M50 36q14 6 22 24-12-10-22-10-10 0-22 10 8-18 22-24z" fill="' + B.lg(GOLD) + '" stroke="#78350F" stroke-width="1.6"/><path d="M42 30l8 8 8-8-4 14h-8z" fill="#78350F"/>' + sp(80, 22, 6)
        ];
      } },
    vegasneon: { kind: 'W5', pays: [[6, 25, 120], [3, 10, 50], [2, 6, 25], [1.2, 4, 12], [0.8, 2, 8], [0.4, 1.2, 5]], scat: [],
      bg: 'radial-gradient(90% 60% at 50% 0%,rgba(168,85,247,.3),transparent 70%),linear-gradient(180deg,#1A0A2E,#06040F)', fr: ['#E9D5FF', '#A855F7', '#3B0764'], cell: '#130824',
      art: function (B) {
        return [
          shd(26) + '<path d="M50 10l10 20 22 3-16 15 4 22-20-11-20 11 4-22-16-15 22-3z" fill="' + B.lg(['#FDF4FF', '#E879F9', '#A21CAF'], 'd') + '" stroke="#701A75" stroke-width="2" stroke-linejoin="round"/><text x="50" y="56" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="20" fill="#fff">7</text>',
          shd(22) + '<path d="M28 20h44L52 50v24h10v6H38v-6h10V50z" fill="' + B.lg(['#CFFAFE', '#22D3EE', '#155E75'], 'd') + '" stroke="#164E63" stroke-width="1.6"/><ellipse cx="50" cy="26" rx="18" ry="4" fill="#F9A8D4"/><circle cx="62" cy="24" r="3" fill="#EF4444"/><path d="M62 24v-10h8" stroke="#86EFAC" stroke-width="2.4" fill="none"/>',
          shd(26) + [66, 56, 46].map(function (y, i) { return '<ellipse cx="50" cy="' + y + '" rx="22" ry="7" fill="' + B.lg([['#F472B6', '#9D174D'], ['#60A5FA', '#1E3A8A'], ['#FBBF24', '#92400E']][i], 'h') + '" stroke="#1E1B4B" stroke-width="1.4"/><ellipse cx="50" cy="' + (y - 2) + '" rx="12" ry="3" fill="#fff" opacity=".45"/>'; }).join(''),
          royal(B, 'A', GOLD), royal(B, 'K', AMET), royal(B, 'Q', SILV)
        ];
      } },
    /* ---- case (round 9) : 6 machines à sous de plus ---- */
    phoenix: { kind: 'L5', pays: [[10, 50, 300], [5, 20, 80], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], scat: [12, 60],
      bg: 'radial-gradient(90% 60% at 50% 0%,rgba(244,63,94,.35),transparent 70%),linear-gradient(180deg,#2A0A08,#0B0505)', fr: ['#FED7AA', '#DC2626', '#3B0A06'], cell: '#1A0A08',
      art: function (B) {
        return [
          shd(32) + '<path d="M50 14c-12 0-18 8-18 16 0 6 4 10 4 14-6-2-14-10-18-6 3 8 10 12 16 13-4 3-10 10-8 18 6-3 10-9 12-14 2 5 6 11 12 14 2-8-4-15-8-18 6-1 13-5 16-13-4-4-12 4-18 6 0-4 4-8 4-14 0-8-6-16-18-16z" fill="' + B.rg(['#FFF3C7', '#F97316', '#B91C1C']) + '" stroke="#7F1D1D" stroke-width="1.6"/><circle cx="44" cy="34" r="3" fill="#1A0A08"/><path d="M50 30l10-4-8 8z" fill="' + B.lg(GOLD) + '"/>' + sp(72, 22, 6),
          shd(18) + '<path d="M50 10c8 14 18 20 18 36 0 16-10 28-18 28S32 62 32 46c0-16 10-22 18-36z" fill="' + B.lg(['#FFF2A8', '#F97316', '#B91C1C'], 'd') + '" stroke="#7F1D1D" stroke-width="1.4"/><path d="M50 30c4 8 10 10 10 20 0 9-5 16-10 16s-10-7-10-16c0-10 6-12 10-20z" fill="' + B.rg(['#FFF7D6', '#FBBF24', '#EA580C']) + '"/>',
          shd(24) + '<ellipse cx="50" cy="56" rx="22" ry="24" fill="' + B.rg(GOLD) + '" stroke="#78350F" stroke-width="2"/>' + gl(42, 46, 8, 5, -20, 0.55) + '<path d="M38 50q12-8 24 0" stroke="#FFF7D6" stroke-width="2" fill="none" opacity=".7"/>',
          shd(14) + '<path d="M50 14c-10 10-16 28-14 54 10-6 18-24 20-40 1-8-2-11-6-14z" fill="' + B.lg(['#FFE4C7', '#F97316', '#7C2D12'], 'd') + '" stroke="#7C2D12" stroke-width="1.2"/><path d="M48 24q2 20-6 38" stroke="#FFF7D6" stroke-width="1.4" fill="none" opacity=".6"/>',
          royal(B, 'A', GOLD), royal(B, 'K', RUBY), royal(B, 'Q', ORNG),
          '<circle cx="50" cy="50" r="44" fill="' + B.rg(['#FFF7D6', '#FBBF24', '#78350F'], '50%', '50%', '60%') + '" opacity=".3"/>' + (function () { var s = '<circle cx="50" cy="50" r="22" fill="' + B.rg(['#FFF7D6', '#FBBF24', '#EA580C']) + '"/>'; for (var i = 0; i < 12; i++) { var a = i * Math.PI / 6; s += '<path d="M' + (50 + Math.cos(a) * 24).toFixed(1) + ' ' + (50 + Math.sin(a) * 24).toFixed(1) + 'L' + (50 + Math.cos(a) * 42).toFixed(1) + ' ' + (50 + Math.sin(a) * 42).toFixed(1) + '" stroke="' + B.lg(GOLD) + '" stroke-width="4" stroke-linecap="round"/>'; } return s; })() + sp(80, 22, 6)
        ];
      } },
    buffalo: { kind: 'A', cols: 5, rows: 4, bands: [6, 8, 10], pays: [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 4, 12], [0.8, 2.5, 8], [0.5, 1.5, 5], [0.3, 1, 3]], scat: [],
      bg: 'radial-gradient(85% 60% at 50% 0%,rgba(217,119,6,.32),transparent 70%),linear-gradient(180deg,#2A1A08,#0B0905)', fr: ['#FDE68A', '#B45309', '#3B2406'], cell: '#1A1206',
      art: function (B) {
        return [
          shd(26) + '<path d="M26 20C14 20 10 30 12 40c-6 2-8 10-4 16 6-2 8-8 8-8 4 10 14 16 34 16s30-6 34-16c0 0 2 6 8 8 4-6 2-14-4-16 2-10-2-20-14-20-6 0-10 4-12 8-2-4-6-8-12-8s-10 4-12 8c-2-4-6-8-12-8z" fill="' + B.lg(['#8B5A2B', '#5C3A1A', '#2E1C0C'], 'd') + '" stroke="#1C1206" stroke-width="1.6"/><circle cx="38" cy="40" r="3.4" fill="#FDE68A"/><circle cx="62" cy="40" r="3.4" fill="#FDE68A"/><path d="M42 52q8 5 16 0" stroke="#1C1206" stroke-width="2" fill="none"/>' + gl(34, 30, 8, 4, -20, 0.3),
          shd(22) + '<path d="M50 16l-14 8 6 4-8 6 8 2-6 6 12-2v18l8-6 8 6V42l12 2-6-6 8-2-8-6 6-4z" fill="' + B.lg(['#E5E7EB', '#9CA3AF', '#4B5563'], 'd') + '" stroke="#374151" stroke-width="1.4"/><circle cx="46" cy="30" r="2.6" fill="#FBBF24"/><circle cx="54" cy="30" r="2.6" fill="#FBBF24"/><path d="M44 40h12l-6 8z" fill="#F59E0B"/>',
          shd(24) + '<path d="M30 30c-8-4-16-2-18 2 6 0 8 4 8 4-6 6-4 16 2 22 2-4 6-6 6-6 2 10 10 14 16 14s14-4 16-14c0 0 4 2 6 6 6-6 8-16 2-22 0 0 2-4 8-4-2-4-10-6-18-2-2-6-10-10-14-10s-12 4-14 10z" fill="' + B.lg(['#9CA3AF', '#4B5563', '#1F2937'], 'd') + '" stroke="#111827" stroke-width="1.4"/><circle cx="42" cy="44" r="3" fill="#FCD34D"/><circle cx="58" cy="44" r="3" fill="#FCD34D"/><path d="M46 54l4 4 4-4z" fill="#111827"/>',
          shd(20) + '<path d="M50 24c-6 0-10 5-10 11s4 13 10 25c6-12 10-19 10-25s-4-11-10-11z" fill="' + B.lg(['#C2773B', '#7C3F14'], 'd') + '" stroke="#3B2406" stroke-width="1.4"/><path d="M40 30q-14-8-22 0 8 0 16 10M60 30q14-8 22 0-8 0-16 10M42 24q-6-12-16-12 4 6 10 16M58 24q6-12 16-12-4 6-10 16" fill="none" stroke="' + B.lg(GOLD) + '" stroke-width="3" stroke-linecap="round"/>',
          royal(B, 'A', GOLD), royal(B, 'K', COPPER), royal(B, 'Q', EMER)
        ];
      } },
    joker: { kind: 'R33', pays: [50, 20, 10, 6, 3, 2], scat: [],
      bg: 'radial-gradient(80% 60% at 50% 0%,rgba(147,51,234,.34),transparent 70%),linear-gradient(180deg,#1E0A33,#070312)', fr: ['#E9D5FF', '#9333EA', '#3B0764'], cell: '#130824',
      art: function (B) {
        return [
          shd(24) + '<path d="M28 20q22-10 44 0-4 18-22 18T28 20z" fill="' + B.lg(['#A855F7', '#6D28D9', '#3B0764'], 'd') + '" stroke="#2E1065" stroke-width="1.4"/><circle cx="24" cy="18" r="6" fill="' + B.lg(GOLD) + '"/><circle cx="76" cy="18" r="6" fill="' + B.lg(['#F472B6', '#BE185D']) + '"/><circle cx="50" cy="12" r="6" fill="' + B.lg(['#34D399', '#15803D']) + '"/>' +
            '<ellipse cx="50" cy="52" rx="20" ry="22" fill="' + B.rg(['#FFF7ED', '#FDE68A', '#D97706']) + '" stroke="#92400E" stroke-width="1.4"/><circle cx="42" cy="48" r="3" fill="#1C1206"/><circle cx="58" cy="48" r="3" fill="#1C1206"/><path d="M40 60q10 8 20 0" stroke="#B91C1C" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
          shd(18) + '<path d="M50 10l12 24 26 3-18 18 5 26-25-14-25 14 5-26-18-18 26-3z" fill="' + B.lg(['#FECACA', '#EF4444', '#991B1B'], 'd') + '" stroke="#7F1D1D" stroke-width="1.6" stroke-linejoin="round"/><text x="50" y="58" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="26" fill="#fff">7</text>',
          shd(20) + '<path d="M30 70V42a20 20 0 0 1 40 0v28z" fill="' + B.lg(GOLD) + '" stroke="#78350F" stroke-width="2"/><rect x="26" y="68" width="48" height="8" rx="3" fill="' + B.lg(GOLD) + '" stroke="#78350F"/><circle cx="50" cy="22" r="5" fill="' + B.lg(GOLD) + '" stroke="#78350F"/><circle cx="50" cy="80" r="4" fill="#78350F"/>' + gl(42, 40, 6, 3, -20, 0.5),
          shd(18) + '<path d="M44 24q-4-10 4-14 2 6-2 12M56 24q4-10-4-14-2 6 2 12" stroke="#2F7D2F" stroke-width="3" fill="none"/><circle cx="40" cy="44" r="15" fill="' + B.rg(['#FF8FA3', '#E11D48', '#881337']) + '"/><circle cx="62" cy="50" r="15" fill="' + B.rg(['#FF8FA3', '#E11D48', '#881337']) + '"/>' + gl(36, 38, 5, 3, -20, 0.5),
          '<circle cx="50" cy="50" r="30" fill="' + B.rg(GOLD) + '" stroke="#78350F" stroke-width="2"/><text x="50" y="62" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="30" fill="#78350F">$</text>' + gl(40, 40, 8, 4, -20, 0.5),
          '<path d="' + (function () { var d = ''; for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 14 : 34; d += (i ? 'L' : 'M') + (50 + Math.cos(a) * r).toFixed(1) + ' ' + (50 + Math.sin(a) * r).toFixed(1); } return d; })() + 'z" fill="' + B.rg(['#FEF9C3', '#FACC15', '#A16207']) + '" stroke="#78350F" stroke-width="2" stroke-linejoin="round"/>' + gl(42, 42, 5, 3, 0, 0.6)
        ];
      } },
    bookgold: { kind: 'L5', pays: [[8, 40, 250], [5, 15, 80], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], scat: [10, 50],
      bg: 'radial-gradient(90% 60% at 50% 0%,rgba(202,138,4,.3),transparent 70%),linear-gradient(180deg,#2A1E06,#0B0805)', fr: ['#FDE68A', '#A16207', '#3B2A06'], cell: '#1A1306',
      art: function (B) {
        return [
          shd(24) + '<path d="M26 18h40l8 10v44H34l-8-10z" fill="' + B.lg(['#FDE68A', '#D97706', '#78350F'], 'd') + '" stroke="#5C3A0A" stroke-width="1.6"/><ellipse cx="48" cy="40" rx="12" ry="16" fill="#1C1206"/><circle cx="48" cy="34" r="6" fill="' + B.rg(['#FFE4C7', '#C2773B']) + '"/><path d="M40 52q8-6 16 0" stroke="' + B.lg(GOLD) + '" stroke-width="3" fill="none"/>',
          shd(22) + '<path d="M30 76V40l20-22 20 22v36z" fill="' + B.lg(GOLD) + '" stroke="#78350F" stroke-width="1.6"/><ellipse cx="50" cy="40" rx="9" ry="13" fill="#1C1206"/><circle cx="50" cy="36" r="4.5" fill="' + B.rg(GOLD) + '"/><path d="M40 60h20M42 68h16" stroke="#78350F" stroke-width="2"/>' + gl(42, 34, 6, 3, -20, 0.5),
          shd(22) + '<ellipse cx="50" cy="44" rx="20" ry="24" fill="' + B.rg(['#A7F3D0', '#10B981', '#065F46']) + '" stroke="#064E3B" stroke-width="1.6"/><path d="M50 20v-8M38 24l-4-6M62 24l4-6" stroke="#065F46" stroke-width="3" stroke-linecap="round"/><ellipse cx="50" cy="40" rx="11" ry="9" fill="#064E3B"/><circle cx="45" cy="38" r="2.4" fill="#A7F3D0"/><circle cx="55" cy="38" r="2.4" fill="#A7F3D0"/>' + gl(42, 36, 7, 4, -20, 0.5),
          shd(16) + '<path d="M50 14q-6-8 0-12 6 4 0 12z" fill="' + B.lg(GOLD) + '" stroke="#5C3A0A"/><circle cx="50" cy="26" r="9" fill="none" stroke="' + B.lg(GOLD) + '" stroke-width="4"/><path d="M50 34v48M34 50h32" stroke="' + B.lg(GOLD) + '" stroke-width="5" stroke-linecap="round"/>',
          royal(B, 'A', GOLD), royal(B, 'K', TURQ), royal(B, 'Q', RUBY),
          '<circle cx="50" cy="50" r="44" fill="' + B.rg(['#FFF7D6', '#FBBF24', '#78350F'], '50%', '50%', '60%') + '" opacity=".3"/><path d="M20 26q30-12 60 0v42q-30-10-60 0z" fill="' + B.lg(['#FDE68A', '#D97706', '#78350F'], 'd') + '" stroke="#5C3A0A" stroke-width="2"/><path d="M50 28v38" stroke="#5C3A0A" stroke-width="2.6"/><path d="M28 36q10-4 18 0M54 36q10-4 18 0" stroke="#FFF7D6" stroke-width="1.6" fill="none" opacity=".6"/>' + sp(80, 22, 6)
        ];
      } },
    lotus: { kind: 'W5', pays: [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 3, 12], [0.6, 2, 8], [0.4, 1.2, 5]], scat: [],
      bg: 'radial-gradient(90% 60% at 50% 0%,rgba(20,184,166,.3),transparent 70%),linear-gradient(180deg,#07211F,#050B12)', fr: ['#99F6E4', '#0D9488', '#063B38'], cell: '#071A1A',
      art: function (B) {
        return [
          shd(26) + '<path d="M30 78V58c0-14 9-26 20-26s20 12 20 26v20z" fill="' + B.lg(GOLD) + '" stroke="#78350F" stroke-width="1.6"/><circle cx="50" cy="40" r="15" fill="' + B.rg(['#FFF3C7', '#F5B700', '#8A5A08']) + '" stroke="#78350F" stroke-width="1.4"/><circle cx="45" cy="40" r="2.2" fill="#78350F"/><circle cx="55" cy="40" r="2.2" fill="#78350F"/><path d="M45 46q5 4 10 0" stroke="#78350F" stroke-width="1.6" fill="none"/><circle cx="50" cy="26" r="3" fill="' + B.lg(GOLD) + '"/>',
          shd(22) + (function () { var s = '<ellipse cx="50" cy="56" rx="24" ry="7" fill="' + B.lg(['#5EEAD4', '#0D9488'], 'h') + '"/>'; for (var i = 0; i < 7; i++) { var a = (i - 3) * 0.42; s += '<path d="M50 56q' + (Math.sin(a) * 30).toFixed(1) + ' ' + (-24 + Math.abs(a) * 6).toFixed(1) + ' ' + (Math.sin(a) * 10).toFixed(1) + ' -30q' + (-Math.sin(a) * 10).toFixed(1) + ' 6 ' + (-Math.sin(a) * 20).toFixed(1) + ' 30z" fill="' + B.rg(['#FBCFE8', '#F472B6', '#BE185D']) + '" stroke="#9D174D" stroke-width=".7"/>'; } return s; })() + '<circle cx="50" cy="50" r="5" fill="' + B.lg(GOLD) + '"/>',
          shd(20) + '<path d="M22 44c10-14 28-14 40-4 6 5 12 4 16-2-2 14-14 20-26 18 2 4 2 10-2 14-4-4-6-10-4-14-14-2-24-12-24-12z" fill="' + B.lg(['#FFB38A', '#F97316', '#B45309'], 'd') + '" stroke="#7C2D12" stroke-width="1.4"/><circle cx="30" cy="42" r="3" fill="#fff"/><circle cx="30" cy="42" r="1.4" fill="#111"/>' + [[40, 46], [52, 48], [62, 44]].map(function (p) { return '<path d="M' + p[0] + ' ' + p[1] + 'q4 4 8 0" stroke="#FFF7ED" stroke-width="1.2" fill="none"/>'; }).join(''),
          royal(B, 'A', GOLD), royal(B, 'K', TEAL), royal(B, 'Q', PINK)
        ];
      } },
    inferno: { kind: 'L5', pays: [[10, 50, 300], [5, 20, 80], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], scat: [12, 60],
      bg: 'radial-gradient(90% 60% at 50% 70%,rgba(239,68,68,.4),transparent 70%),linear-gradient(180deg,#1A0505,#070202)', fr: ['#FECACA', '#DC2626', '#3B0606'], cell: '#180505',
      art: function (B) {
        return [
          shd(26) + '<path d="M28 18q-6-10-2-16 6 6 8 14M72 18q6-10 2-16-6 6-8 14z" fill="' + B.lg(['#FCA5A5', '#B91C1C'], 'd') + '" stroke="#7F1D1D"/><path d="M26 24c-4 14 2 34 24 34s28-20 24-34c-6 6-10 6-14 2-4 8-16 8-20 0-4 4-8 4-14-2z" fill="' + B.rg(['#F87171', '#B91C1C', '#450A0A']) + '" stroke="#450A0A" stroke-width="1.6"/><path d="M38 36l6 4-6 3zM62 36l-6 4 6 3z" fill="#1A0505"/><path d="M40 48q10 6 20 0l-4 6h-12z" fill="#1A0505"/><path d="M44 50l1 4M50 51v4M56 50l-1 4" stroke="#fff" stroke-width="1.2"/>',
          shd(16) + '<path d="M50 10c8 14 18 20 18 36 0 16-10 28-18 28S32 62 32 46c0-16 10-22 18-36z" fill="' + B.lg(['#FFF2A8', '#F97316', '#B91C1C'], 'd') + '" stroke="#7F1D1D" stroke-width="1.4"/><path d="M50 32c4 8 9 12 9 22 0 9-4 14-9 14s-9-5-9-14c0-10 5-14 9-22z" fill="' + B.rg(['#FFF7D6', '#FBBF24', '#EA580C']) + '"/>',
          shd(22) + '<path d="M28 42c0-14 10-24 22-24s22 10 22 24c0 8-4 12-4 12l4 6-8 2v8H36v-8l-8-2 4-6s-4-4-4-12z" fill="' + B.rg(['#F3F4F6', '#D1D5DB', '#6B7280']) + '" stroke="#374151" stroke-width="1.6"/><ellipse cx="41" cy="44" rx="5" ry="6" fill="#111827"/><ellipse cx="59" cy="44" rx="5" ry="6" fill="#111827"/><path d="M44 62h12M46 68h8" stroke="#374151" stroke-width="2"/>',
          shd(16) + '<path d="M50 20v50M36 30q14 6 28 0M34 44q16 6 32 0" fill="none" stroke="' + B.lg(GOLD) + '" stroke-width="4" stroke-linecap="round"/><path d="M34 30l-2-8M50 20l0-10M66 30l2-8" stroke="' + B.lg(GOLD) + '" stroke-width="4" stroke-linecap="round"/><rect x="47" y="68" width="6" height="14" rx="2" fill="' + B.lg(GOLD) + '"/>',
          royal(B, 'A', GOLD), royal(B, 'K', RUBY), royal(B, 'Q', SILV),
          '<circle cx="50" cy="52" r="26" fill="' + B.rg(['#FFF7D6', '#F97316', '#B91C1C']) + '" stroke="#7F1D1D" stroke-width="2"/>' + (function () { var s = ''; for (var i = 0; i < 10; i++) { var a = i * Math.PI / 5; s += '<path d="M' + (50 + Math.cos(a) * 24).toFixed(1) + ' ' + (52 + Math.sin(a) * 24).toFixed(1) + 'q' + (Math.cos(a) * 10).toFixed(1) + ' ' + (Math.sin(a) * 10).toFixed(1) + ' 0 ' + (16).toFixed(1) + '" fill="' + B.lg(['#FBBF24', '#EA580C']) + '" opacity=".8"/>'; } return s; })() + gl(42, 44, 7, 4, -20, 0.5) + sp(80, 22, 6)
        ];
      } },
    aztecsun: { kind: 'L5', pays: [[10, 50, 300], [5, 20, 80], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], scat: [12, 60],
      bg: 'radial-gradient(90% 60% at 50% 0%,rgba(217,119,6,.34),transparent 70%),linear-gradient(180deg,#2A1C06,#0B0805)', fr: ['#FDE68A', '#B45309', '#3B2406'], cell: '#1A1206',
      art: function (B) {
        return [
          shd(30) + '<circle cx="50" cy="48" r="34" fill="' + B.rg(['#FFF4C2', '#D97706', '#5C2E0E']) + '" stroke="#5C2E0E" stroke-width="2.5"/>' + (function () { var s = ''; for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4; s += '<path d="M' + (50 + Math.cos(a) * 26).toFixed(1) + ' ' + (48 + Math.sin(a) * 26).toFixed(1) + 'l' + (Math.cos(a) * 8).toFixed(1) + ' ' + (Math.sin(a) * 8).toFixed(1) + '" stroke="' + B.lg(GOLD) + '" stroke-width="5" stroke-linecap="round"/>'; } return s; })() + '<circle cx="50" cy="48" r="16" fill="' + B.lg(['#FBBF24', '#92400E']) + '" stroke="#5C2E0E" stroke-width="1.6"/><rect x="42" y="40" width="5" height="6" rx="1" fill="#2A1206"/><rect x="53" y="40" width="5" height="6" rx="1" fill="#2A1206"/><path d="M45 54h10l-5 7z" fill="#2A1206"/>' + gl(40, 36, 7, 4, -20, 0.4),
          shd(22) + '<path d="M34 20h32l-4 44a12 12 0 0 1-24 0z" fill="' + B.lg(['#FDE68A', '#D97706', '#78350F'], 'd') + '" stroke="#5C2E0E" stroke-width="1.6"/><rect x="40" y="13" width="20" height="9" rx="2" fill="' + B.lg(GOLD) + '" stroke="#5C2E0E"/><rect x="41" y="34" width="6" height="7" fill="#2A1206"/><rect x="53" y="34" width="6" height="7" fill="#2A1206"/><path d="M42 50q8 6 16 0" stroke="#2A1206" stroke-width="2.4" fill="none"/>' + gl(40, 30, 6, 3, -20, 0.3),
          shd(22) + '<path d="M30 68c-5-18 7-32 22-32 11 0 17 7 17 15 0 7-5 11-11 11-5 0-7-3-7-7 0-3 2-5 5-5" fill="none" stroke="' + B.lg(['#6EE7B7', '#059669', '#064E3B']) + '" stroke-width="10" stroke-linecap="round"/><path d="M30 68l-7 7 11 2z" fill="' + B.lg(['#34D399', '#065F46']) + '"/><circle cx="54" cy="42" r="2.4" fill="#064E3B"/>',
          shd(24) + '<path d="M22 72l28-46 28 46z" fill="' + B.lg(['#FDE68A', '#B45309', '#5C2E0E'], 'd') + '" stroke="#3B2406" stroke-width="1.6"/><path d="M33 72l17-28 17 28M44 72l6-10 6 10" fill="none" stroke="#3B2406" stroke-width="1.4" opacity=".7"/><rect x="46" y="22" width="8" height="8" rx="1" fill="' + B.lg(GOLD) + '" stroke="#3B2406"/>',
          royal(B, 'A', GOLD), royal(B, 'K', EMER), royal(B, 'Q', RUBY),
          '<circle cx="50" cy="50" r="44" fill="' + B.rg(['#FFF7D6', '#FBBF24', '#78350F'], '50%', '50%', '60%') + '" opacity=".3"/><circle cx="50" cy="50" r="30" fill="' + B.rg(['#FFF4C2', '#F59E0B', '#B45309']) + '" stroke="#78350F" stroke-width="2"/>' + (function () { var s = ''; for (var i = 0; i < 16; i++) { var a = i * Math.PI / 8; s += '<path d="M' + (50 + Math.cos(a) * 30).toFixed(1) + ' ' + (50 + Math.sin(a) * 30).toFixed(1) + 'L' + (50 + Math.cos(a) * 44).toFixed(1) + ' ' + (50 + Math.sin(a) * 44).toFixed(1) + '" stroke="' + B.lg(GOLD) + '" stroke-width="3" stroke-linecap="round"/>'; } return s; })() + sp(50, 50, 10, 0.9)
        ];
      } },
    dragongold: { kind: 'W5', pays: [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 3, 12], [0.6, 2, 8], [0.4, 1.2, 5]], scat: [],
      bg: 'radial-gradient(90% 60% at 50% 0%,rgba(220,38,38,.3),transparent 70%),linear-gradient(180deg,#2A0A0A,#0B0505)', fr: ['#FDE68A', '#B91C1C', '#3B0606'], cell: '#1A0808',
      art: function (B) {
        return [
          shd(26) + '<path d="M26 60c-6-8-6-20 2-28 6-6 16-6 20 2 2-6 10-8 14-4 4 4 2 10-2 12 6 2 8 10 4 14-4-2-8-2-10 2 2 6-2 12-8 12-2 6-10 8-14 2-6 2-12-4-10-10-4 0-8-6-6-10 4 0 8-2 8-6-4-2-2-8 2-8z" fill="' + B.rg(['#FDE68A', '#D97706', '#7C2D12']) + '" stroke="#5C1A0A" stroke-width="1.6"/><circle cx="40" cy="40" r="3.4" fill="#FEF08A"/><circle cx="40" cy="40" r="1.6" fill="#1A0505"/><path d="M28 34q-8-4-12 2M30 28q-4-8 2-12" stroke="' + B.lg(GOLD) + '" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M52 50q10 2 16-4" stroke="#B91C1C" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
          shd(18) + '<circle cx="50" cy="48" r="20" fill="' + B.rg(['#FFF7ED', '#FCD34D', '#D97706']) + '" stroke="#B45309" stroke-width="2"/>' + (function () { var s = ''; for (var i = 0; i < 12; i++) { var a = i * Math.PI / 6; s += '<path d="M' + (50 + Math.cos(a) * 20).toFixed(1) + ' ' + (48 + Math.sin(a) * 20).toFixed(1) + 'q' + (Math.cos(a) * 8).toFixed(1) + ' ' + (Math.sin(a) * 8).toFixed(1) + ' 0 14" fill="' + B.lg(['#F97316', '#B91C1C']) + '" opacity=".65"/>'; } return s; })() + gl(42, 40, 7, 4, -20, 0.6),
          shd(22) + coinS(B, GOLD, '<rect x="42" y="42" width="16" height="16" fill="#1A0808"/><path d="M50 36v8M50 56v8M36 50h8M56 50h8" stroke="#78350F" stroke-width="2.4"/>'),
          royal(B, 'A', GOLD), royal(B, 'K', RUBY), royal(B, 'Q', EMER)
        ];
      } },
    fruitburst: { kind: 'R33', pays: [50, 20, 10, 6, 3, 2], scat: [],
      bg: 'radial-gradient(80% 60% at 50% 0%,rgba(239,68,68,.3),transparent 70%),linear-gradient(180deg,#1A0A14,#070306)', fr: ['#FECACA', '#E11D48', '#4C0519'], cell: '#190810',
      art: function (B) {
        return [
          shd(20) + '<path d="M50 12l13 27 29 4-21 20 5 29-26-14-26 14 5-29-21-20 29-4z" fill="' + B.lg(['#FECACA', '#EF4444', '#991B1B'], 'd') + '" stroke="#7F1D1D" stroke-width="1.6" stroke-linejoin="round"/><text x="50" y="60" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="30" fill="#fff">7</text>',
          shd(22) + '<path d="M24 44a26 26 0 0 0 52 0z" fill="' + B.lg(['#16A34A', '#166534'], 'd') + '" stroke="#14532D" stroke-width="1.4"/><path d="M27 44a23 23 0 0 0 46 0z" fill="' + B.rg(['#FB7185', '#E11D48', '#881337']) + '"/>' + [[38, 52], [50, 56], [62, 52], [44, 60], [56, 60]].map(function (p) { return '<ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="1.6" ry="3" fill="#1A0505"/>'; }).join(''),
          shd(20) + '<path d="M30 72V46a20 20 0 0 1 40 0v26z" fill="' + B.lg(GOLD) + '" stroke="#78350F" stroke-width="2"/><rect x="26" y="70" width="48" height="8" rx="3" fill="' + B.lg(GOLD) + '" stroke="#78350F"/><circle cx="50" cy="24" r="5" fill="' + B.lg(GOLD) + '" stroke="#78350F"/><circle cx="50" cy="80" r="4" fill="#78350F"/>' + gl(42, 42, 6, 3, -20, 0.5),
          shd(18) + '<path d="M44 28q4-12 14-14M56 30q4-12 14-14" stroke="#15803D" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="40" cy="58" r="15" fill="' + B.rg(['#FF8FA3', '#E11D48', '#881337']) + '" stroke="#881337"/><circle cx="62" cy="62" r="15" fill="' + B.rg(['#FF8FA3', '#E11D48', '#881337']) + '" stroke="#881337"/>' + gl(35, 52, 5, 3, -20, 0.5),
          shd(18) + '<ellipse cx="50" cy="52" rx="24" ry="20" fill="' + B.rg(['#FEF9C3', '#FACC15', '#A16207']) + '" stroke="#854D0E" stroke-width="1.6"/><path d="M70 38q8-4 10-10" stroke="#65A30D" stroke-width="3" fill="none" stroke-linecap="round"/>' + gl(40, 44, 8, 5, -20, 0.5),
          shd(16) + '<rect x="22" y="42" width="56" height="16" rx="3" fill="' + B.lg(GOLD) + '" stroke="#78350F" stroke-width="1.6"/><text x="50" y="55" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="13" fill="#78350F">BAR</text>'
        ];
      } },
    horuseye: { kind: 'L5', pays: [[8, 40, 250], [5, 15, 80], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], scat: [10, 50],
      bg: 'radial-gradient(90% 60% at 50% 0%,rgba(37,99,235,.28),transparent 70%),linear-gradient(180deg,#0A1430,#060812)', fr: ['#BAE6FD', '#D97706', '#172554'], cell: '#0C1428',
      art: function (B) {
        return [
          shd(26) + '<path d="M28 30q0-14 22-14t22 14l-4 26q-2 18-18 24-16-6-18-24z" fill="' + B.lg(['#FDE68A', '#D97706', '#78350F'], 'd') + '" stroke="#5C2E0E" stroke-width="1.6"/><path d="M28 30q22-10 44 0l-3 10q-19-8-38 0z" fill="' + B.lg(LAPIS) + '"/><rect x="40" y="40" width="7" height="6" rx="1" fill="#0C1428"/><rect x="53" y="40" width="7" height="6" rx="1" fill="#0C1428"/><path d="M42 39l-6-2M58 39l6-2" stroke="#0C1428" stroke-width="2"/><path d="M44 54h12l-6 6z" fill="#B45309"/><rect x="47" y="66" width="6" height="12" fill="' + B.lg(LAPIS) + '"/>',
          shd(22) + '<path d="M50 16c-8 0-10 8-10 14l-14 6 14 4v30h20V44l14-4-14-6c0-6-2-14-10-14z" fill="' + B.lg(['#374151', '#111827'], 'd') + '" stroke="#000" stroke-width="1.2"/><path d="M40 20q-8-6-14-2 4 2 6 8M60 20q8-6 14-2-4 2-6 8" fill="' + B.lg(['#4B5563', '#111827']) + '"/><circle cx="46" cy="30" r="2.2" fill="#FCD34D"/><path d="M40 72h20l-4 8H44z" fill="' + B.lg(GOLD) + '"/>',
          shd(22) + '<ellipse cx="50" cy="48" rx="20" ry="24" fill="' + B.rg(['#7DD3FC', '#2563EB', '#172554']) + '" stroke="#0C1428" stroke-width="1.6"/><path d="M50 24v-8M40 28l-6-6M60 28l6-6" stroke="' + B.lg(GOLD) + '" stroke-width="3" stroke-linecap="round"/><path d="M50 30v40M34 44q16 8 32 0M34 56q16 8 32 0" stroke="#0C1428" stroke-width="2" fill="none"/>' + gl(42, 38, 7, 4, -20, 0.4),
          shd(16) + '<path d="M50 20a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" fill="none" stroke="' + B.lg(GOLD) + '" stroke-width="5"/><path d="M50 40v40M36 54h28" stroke="' + B.lg(GOLD) + '" stroke-width="5" stroke-linecap="round"/>',
          royal(B, 'A', GOLD), royal(B, 'K', LAPIS), royal(B, 'Q', TURQ),
          '<circle cx="50" cy="50" r="42" fill="' + B.rg(['#BAE6FD', '#2563EB', '#172554'], '50%', '50%', '60%') + '" opacity=".3"/><path d="M20 46q10-18 30-18t30 18q-6 4-12 2-4 10-18 10t-18-10q-6 2-12-2z" fill="' + B.lg(GOLD) + '" stroke="#78350F" stroke-width="1.6"/><circle cx="50" cy="44" r="8" fill="#fff"/><circle cx="50" cy="44" r="4.5" fill="#2563EB"/><circle cx="50" cy="44" r="2" fill="#0C1428"/><path d="M58 52q8 2 12 10M42 54l-4 14" stroke="#78350F" stroke-width="3" fill="none" stroke-linecap="round"/>' + sp(50, 46, 8, 0.9)
        ];
      } },
    cosmicgems: { kind: 'A', cols: 5, rows: 4, bands: [6, 8, 10], pays: [[6, 25, 120], [4, 12, 50], [2.5, 8, 25], [1.5, 5, 15], [1, 3, 10], [0.6, 2, 6], [0.4, 1.2, 4]], scat: [],
      bg: 'radial-gradient(90% 70% at 50% 30%,rgba(168,85,247,.32),transparent 70%),linear-gradient(180deg,#140A2E,#05030F)', fr: ['#E9D5FF', '#7C3AED', '#2E1065'], cell: '#100826',
      art: function (B) {
        return [
          shd(24) + gem(B, ngon(6, 26, 30, 0, 50, 48), SILV),
          shd(24) + gem(B, ngon(6, 26, 30, 30, 50, 48), RUBY),
          shd(24) + gem(B, ngon(6, 26, 30, 0, 50, 48), EMER),
          shd(22) + gem(B, ngon(5, 26, 28, 0, 50, 48), LAPIS),
          shd(22) + gem(B, ngon(5, 26, 28, 36, 50, 48), AMET),
          shd(20) + gem(B, ngon(4, 24, 28, 45, 50, 48), GOLD),
          shd(20) + gem(B, ngon(8, 24, 26, 0, 50, 48), ORNG)
        ];
      } },
    savanna: { kind: 'A', cols: 5, rows: 4, bands: [6, 8, 10], pays: [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 4, 12], [0.8, 2.5, 8], [0.5, 1.5, 5], [0.3, 1, 3]], scat: [],
      bg: 'radial-gradient(85% 60% at 50% 0%,rgba(234,179,8,.3),transparent 70%),linear-gradient(180deg,#241A08,#0A0805)', fr: ['#FDE68A', '#A16207', '#3B2A06'], cell: '#1A1306',
      art: function (B) {
        return [
          shd(26) + (function () { var s = ''; for (var i = 0; i < 12; i++) { var a = i * Math.PI / 6; s += '<circle cx="' + (50 + Math.cos(a) * 28).toFixed(1) + '" cy="' + (48 + Math.sin(a) * 28).toFixed(1) + '" r="11" fill="#92400E"/>'; } return s; })() + '<circle cx="31" cy="30" r="8" fill="#B45309"/><circle cx="69" cy="30" r="8" fill="#B45309"/><circle cx="31" cy="30" r="3.6" fill="#78350F"/><circle cx="69" cy="30" r="3.6" fill="#78350F"/><circle cx="50" cy="48" r="24" fill="' + B.lg(['#FCD34D', '#B45309'], 'd') + '" stroke="#78350F" stroke-width="1.6"/><circle cx="41" cy="44" r="3.2" fill="#1A1206"/><circle cx="59" cy="44" r="3.2" fill="#1A1206"/><ellipse cx="50" cy="60" rx="14" ry="11" fill="#FEF3C7"/><path d="M50 52l-5 7h10z" fill="#7C2D12"/><path d="M50 59v7M50 66q-6 3-10 0M50 66q6 3 10 0" stroke="#7C2D12" stroke-width="2" fill="none" stroke-linecap="round"/>',
          shd(24) + '<path d="M26 36c0-12 10-18 24-18s24 6 24 18c0 10-6 16-6 16l2 20H56l-2-14q-4 2-8 0l-2 14H30l2-20s-6-6-6-16z" fill="' + B.lg(['#9CA3AF', '#6B7280', '#374151'], 'd') + '" stroke="#1F2937" stroke-width="1.4"/><path d="M50 50q-2 10 0 26" stroke="#1F2937" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="40" cy="38" r="2.4" fill="#111827"/><circle cx="60" cy="38" r="2.4" fill="#111827"/><path d="M42 58l-6 6M58 58l6 6" stroke="#E5E7EB" stroke-width="3" stroke-linecap="round"/>',
          shd(22) + '<ellipse cx="50" cy="46" rx="18" ry="24" fill="#F3F4F6" stroke="#111827" stroke-width="1.4"/><path d="M38 28l4 8M50 24v10M62 28l-4 8M34 42h10M56 42h10M36 54h12M52 54h12" stroke="#111827" stroke-width="3" stroke-linecap="round"/><path d="M40 20l-4-8M60 20l4-8" stroke="#111827" stroke-width="4" stroke-linecap="round"/><circle cx="44" cy="46" r="2.4" fill="#111827"/><circle cx="56" cy="46" r="2.4" fill="#111827"/><path d="M44 62h12l-6 6z" fill="#111827"/>',
          shd(24) + '<path d="M24 54c0-14 12-24 26-24s26 10 26 24c0 8-4 14-4 14l2 10H58l-2-8h-12l-2 8H26l2-10s-4-6-4-14z" fill="' + B.lg(['#A8A29E', '#78716C', '#44403C'], 'd') + '" stroke="#292524" stroke-width="1.4"/><path d="M34 36l-6-16 10 10M66 36l6-16-10 10" fill="' + B.lg(['#E7E5E4', '#A8A29E']) + '" stroke="#292524" stroke-width="1"/><circle cx="40" cy="48" r="2.4" fill="#1C1917"/><circle cx="60" cy="48" r="2.4" fill="#1C1917"/>',
          royal(B, 'A', GOLD), royal(B, 'K', ORNG), royal(B, 'Q', EMER)
        ];
      } },
    valhalla: { kind: 'L5', pays: [[10, 50, 300], [5, 20, 80], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], scat: [12, 60],
      bg: 'radial-gradient(90% 60% at 50% 0%,rgba(37,99,235,.3),transparent 70%),linear-gradient(180deg,#0E1A2E,#060A12)', fr: ['#BAE6FD', '#1D4ED8', '#0A1628'], cell: '#0C1524',
      art: function (B) {
        return [
          shd(24) + '<path d="M20 12l-7 14 7-2-5 14 14-18-7 2 5-12z" fill="' + B.lg(GOLD) + '" opacity=".9"/><rect x="30" y="20" width="40" height="26" rx="5" fill="' + B.lg(['#E5E7EB', '#9CA3AF', '#4B5563'], 'd') + '" stroke="#374151" stroke-width="2"/><rect x="46" y="44" width="8" height="34" rx="3" fill="' + B.lg(['#A16207', '#5C3A0A']) + '" stroke="#3B2406"/><path d="M36 28h28M36 38h28" stroke="#6B7280" stroke-width="1.4" opacity=".6"/>' + gl(40, 28, 8, 5, -20, 0.4),
          shd(26) + '<path d="M12 54h76l-11 16H23z" fill="' + B.lg(['#A16207', '#5C3A0A'], 'd') + '" stroke="#3B2406" stroke-width="1.6"/><path d="M14 54q-6-7-4-15 8 2 12 9M86 54q6-7 4-15-8 2-12 9" fill="none" stroke="' + B.lg(GOLD) + '" stroke-width="3" stroke-linecap="round"/><rect x="48" y="18" width="4" height="36" fill="#5C3A0A"/><path d="M52 22h22l-6 9 6 9H52z" fill="' + B.rg(RUBY) + '" stroke="#6B0F24" stroke-width="1.2"/><path d="M62 22v18" stroke="#6B0F24" stroke-width="1.4"/>',
          shd(22) + '<path d="M26 48c0-16 10-24 24-24s24 8 24 24c0 4-2 8-2 8H28s-2-4-2-8z" fill="' + B.lg(['#D1D5DB', '#9CA3AF', '#4B5563'], 'd') + '" stroke="#374151" stroke-width="1.6"/><path d="M50 24v-8M44 26l-4-6M56 26l4-6" stroke="#374151" stroke-width="2"/><path d="M26 44q-12-4-16 4 6 2 8 8 4-4 8-4M74 44q12-4 16 4-6 2-8 8-4-4-8-4" fill="' + B.lg(['#F3F4F6', '#D1D5DB']) + '" stroke="#6B7280" stroke-width="1.2"/><rect x="40" y="40" width="20" height="18" rx="2" fill="#1F2937"/><circle cx="46" cy="49" r="2" fill="#93C5FD"/><circle cx="54" cy="49" r="2" fill="#93C5FD"/>',
          shd(18) + '<path d="M22 24c14 2 34 8 44 26 3 6 2 12-2 16-6 4-14 2-18-4-2-4-2-8 0-10-10-10-20-16-26-22z" fill="' + B.lg(['#FDE68A', '#D97706', '#78350F'], 'd') + '" stroke="#5C3A0A" stroke-width="1.6"/><path d="M22 24q-6-2-8-8 8 0 14 4" fill="' + B.lg(GOLD) + '" stroke="#5C3A0A"/><ellipse cx="54" cy="56" rx="8" ry="6" fill="#78350F"/>',
          royal(B, 'A', GOLD), royal(B, 'K', LAPIS), royal(B, 'Q', RUBY),
          '<circle cx="50" cy="50" r="44" fill="' + B.rg(['#BAE6FD', '#2563EB', '#0A1628'], '50%', '50%', '60%') + '" opacity=".3"/><circle cx="50" cy="50" r="30" fill="' + B.rg(['#E5E7EB', '#9CA3AF', '#4B5563']) + '" stroke="#374151" stroke-width="2.4"/><circle cx="50" cy="50" r="30" fill="none" stroke="' + B.lg(GOLD) + '" stroke-width="3"/>' + (function () { var s = ''; for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4; s += '<path d="M' + (50 + Math.cos(a) * 10).toFixed(1) + ' ' + (50 + Math.sin(a) * 10).toFixed(1) + 'L' + (50 + Math.cos(a) * 26).toFixed(1) + ' ' + (50 + Math.sin(a) * 26).toFixed(1) + '" stroke="#4B5563" stroke-width="2.4"/>'; } return s; })() + '<circle cx="50" cy="50" r="7" fill="' + B.lg(GOLD) + '" stroke="#78350F"/>' + sp(80, 22, 6)
        ];
      } },
    tigergold: { kind: 'W5', pays: [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 3, 12], [0.6, 2, 8], [0.4, 1.2, 5]], scat: [],
      bg: 'radial-gradient(90% 60% at 50% 0%,rgba(234,88,12,.32),transparent 70%),linear-gradient(180deg,#2A1406,#0B0604)', fr: ['#FDBA74', '#C2410C', '#3B1A06'], cell: '#1A0E06',
      art: function (B) {
        return [
          shd(26) + '<path d="M30 22l5 20-18-7z" fill="#9A3412" stroke="#7C2D12"/><path d="M70 22l-5 20 18-7z" fill="#9A3412" stroke="#7C2D12"/><circle cx="26" cy="27" r="4" fill="#1A0E06"/><circle cx="74" cy="27" r="4" fill="#1A0E06"/><path d="M50 18c-18 0-28 14-28 30 0 15 12 24 28 24s28-9 28-24c0-16-10-30-28-30z" fill="' + B.lg(['#FB923C', '#C2410C'], 'd') + '" stroke="#7C2D12" stroke-width="1.6"/><path d="M24 40l11 4M76 40l-11 4M20 54l12 2M80 54l-12 2M28 66l10-3M72 66l-10-3M50 20v10" stroke="#1A0E06" stroke-width="3.2" stroke-linecap="round"/><ellipse cx="50" cy="56" rx="18" ry="14" fill="#FEF3C7"/><circle cx="41" cy="46" r="3.4" fill="#1A0E06"/><circle cx="59" cy="46" r="3.4" fill="#1A0E06"/><path d="M50 54l-4 5h8z" fill="#7C2D12"/><path d="M50 59v5M50 64q-6 3-10 0M50 64q6 3 10 0" stroke="#7C2D12" stroke-width="2" fill="none" stroke-linecap="round"/>',
          shd(22) + '<path d="M22 40q4-12 28-12t28 12l-8 20H30z" fill="' + B.lg(GOLD) + '" stroke="#78350F" stroke-width="1.6"/><ellipse cx="50" cy="40" rx="18" ry="6" fill="' + B.rg(['#FFF7D6', '#FBBF24', '#D97706']) + '"/><path d="M34 48h32M38 54h24" stroke="#78350F" stroke-width="1.4" opacity=".6"/>' + gl(40, 40, 8, 4, -20, 0.5),
          shd(20) + '<path d="M34 16h32l-4 8h-24z" fill="' + B.lg(GOLD) + '" stroke="#78350F"/><path d="M30 26h40l-4 34a16 16 0 0 1-32 0z" fill="' + B.rg(['#FF8FA3', '#E11D48', '#881337']) + '" stroke="#6B0F24" stroke-width="1.6"/><path d="M50 26v40" stroke="#78350F" stroke-width="1.4" opacity=".5"/><ellipse cx="50" cy="44" rx="10" ry="12" fill="' + B.lg(GOLD) + '" opacity=".85"/><rect x="47" y="66" width="6" height="10" fill="#78350F"/>' + gl(42, 36, 6, 3, -20, 0.5),
          royal(B, 'A', GOLD), royal(B, 'K', RUBY), royal(B, 'Q', ORNG)
        ];
      } },
    honeypot: { kind: 'A', cols: 5, rows: 4, bands: [6, 8, 10], pays: [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 4, 12], [0.8, 2.5, 8], [0.5, 1.5, 5], [0.3, 1, 3]], scat: [],
      bg: 'radial-gradient(85% 60% at 50% 0%,rgba(234,179,8,.34),transparent 70%),linear-gradient(180deg,#2A2006,#0B0905)', fr: ['#FDE68A', '#CA8A04', '#3B2E06'], cell: '#1A1506',
      art: function (B) {
        return [
          shd(22) + '<ellipse cx="50" cy="48" rx="24" ry="20" fill="' + B.lg(['#FBBF24', '#B45309'], 'd') + '" stroke="#78350F" stroke-width="1.6"/><path d="M38 34q12-8 24 0M34 44h32M36 54q14 8 28 0" stroke="#1A1206" stroke-width="3"/><ellipse cx="50" cy="40" rx="8" ry="7" fill="#1A1206"/><circle cx="46" cy="38" r="2" fill="#FDE68A"/><path d="M30 34q-10-8-18-4 6 4 8 10M70 34q10-8 18-4-6 4-8 10" fill="#E5E7EB" opacity=".5" stroke="#9CA3AF"/><path d="M40 22l-4-8M60 22l4-8" stroke="#1A1206" stroke-width="2" stroke-linecap="round"/><circle cx="36" cy="14" r="2.5" fill="#1A1206"/><circle cx="64" cy="14" r="2.5" fill="#1A1206"/>',
          shd(22) + (function () { var s = ''; var cells = [[50, 32], [38, 42], [62, 42], [50, 52], [38, 62], [62, 62], [50, 72]]; cells.forEach(function (c) { var p = ngon(6, 11, 11, 0, c[0], c[1]); s += '<polygon points="' + p.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' ') + '" fill="' + B.rg(['#FFF7D6', '#FBBF24', '#B45309']) + '" stroke="#78350F" stroke-width="1.4"/>'; }); return s; })(),
          shd(22) + '<path d="M32 30h36l-3 8a6 6 0 0 1-6 4H41a6 6 0 0 1-6-4z" fill="' + B.lg(GOLD) + '" stroke="#78350F" stroke-width="1.4"/><path d="M34 42h32l3 28a6 6 0 0 1-6 6H37a6 6 0 0 1-6-6z" fill="' + B.rg(['#FFF7D6', '#FBBF24', '#B45309']) + '" stroke="#78350F" stroke-width="1.6"/><rect x="44" y="18" width="12" height="14" rx="2" fill="#A16207"/><path d="M40 54q10 6 20 0" stroke="#78350F" stroke-width="2" fill="none" opacity=".5"/>' + gl(42, 50, 7, 4, -20, 0.4),
          shd(20) + '<circle cx="50" cy="48" r="13" fill="' + B.rg(['#FEF08A', '#FACC15', '#A16207']) + '" stroke="#854D0E" stroke-width="1.4"/>' + (function () { var s = ''; for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4; s += '<ellipse cx="' + (50 + Math.cos(a) * 24).toFixed(1) + '" cy="' + (48 + Math.sin(a) * 24).toFixed(1) + '" rx="10" ry="6" fill="' + B.lg(['#FDE68A', '#D97706']) + '" stroke="#92400E" stroke-width="1" transform="rotate(' + (a * 180 / Math.PI) + ' ' + (50 + Math.cos(a) * 24).toFixed(1) + ' ' + (48 + Math.sin(a) * 24).toFixed(1) + ')"/>'; } return s; })() + '<circle cx="50" cy="48" r="13" fill="' + B.rg(['#FEF08A', '#FACC15', '#A16207']) + '"/>',
          royal(B, 'A', GOLD), royal(B, 'K', ORNG), royal(B, 'Q', EMER)
        ];
      } },
    piggybank: { kind: 'R33', pays: [50, 20, 10, 6, 3, 2], scat: [],
      bg: 'radial-gradient(80% 60% at 50% 0%,rgba(236,72,153,.3),transparent 70%),linear-gradient(180deg,#2A0A20,#0B030A)', fr: ['#FBCFE8', '#DB2777', '#500724'], cell: '#1A0714',
      art: function (B) {
        return [
          shd(26) + '<ellipse cx="50" cy="50" rx="30" ry="24" fill="' + B.lg(['#F9A8D4', '#EC4899', '#9D174D'], 'd') + '" stroke="#831843" stroke-width="1.6"/><ellipse cx="30" cy="52" rx="10" ry="9" fill="' + B.lg(['#F9A8D4', '#DB2777']) + '" stroke="#831843" stroke-width="1.2"/><circle cx="28" cy="50" r="2" fill="#831843"/><circle cx="32" cy="50" r="2" fill="#831843"/><circle cx="56" cy="44" r="3" fill="#1A0714"/><path d="M40 28l-4-10 10 6M60 28l4-10-10 6" fill="' + B.lg(['#F9A8D4', '#DB2777']) + '" stroke="#831843"/><rect x="44" y="30" width="12" height="4" rx="2" fill="#FACC15"/><path d="M72 46q6 2 6 8" stroke="#831843" stroke-width="2.4" fill="none"/><rect x="36" y="70" width="6" height="8" fill="#9D174D"/><rect x="58" y="70" width="6" height="8" fill="#9D174D"/>',
          shd(22) + '<circle cx="50" cy="50" r="30" fill="' + B.lg(GOLD) + '" stroke="#78350F" stroke-width="2.4"/><circle cx="50" cy="50" r="23" fill="' + B.rg(['#FFF7D6', '#FBBF24', '#B45309']) + '" stroke="#92400E" stroke-width="1.6"/><text x="50" y="63" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="30" fill="#92400E">$</text>' + gl(40, 40, 9, 5, -20, 0.6),
          shd(24) + '<rect x="22" y="22" width="56" height="52" rx="5" fill="' + B.lg(['#9CA3AF', '#4B5563', '#1F2937'], 'd') + '" stroke="#111827" stroke-width="2"/><rect x="28" y="28" width="44" height="40" rx="3" fill="#374151"/><circle cx="50" cy="48" r="11" fill="none" stroke="' + B.lg(GOLD) + '" stroke-width="3"/><circle cx="50" cy="48" r="4" fill="' + B.lg(GOLD) + '"/><path d="M50 48l8 8" stroke="' + B.lg(GOLD) + '" stroke-width="3" stroke-linecap="round"/>' + gl(36, 34, 6, 10, -20, 0.2),
          gem(B, ngon(6, 24, 28, 0, 50, 48), EMER),
          shd(18) + '<rect x="22" y="40" width="56" height="26" rx="3" fill="' + B.lg(['#86EFAC', '#16A34A', '#14532D'], 'd') + '" stroke="#14532D" stroke-width="1.4"/><circle cx="50" cy="53" r="10" fill="none" stroke="#DCFCE7" stroke-width="1.6"/><text x="50" y="58" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="12" fill="#DCFCE7">$</text><rect x="26" y="34" width="56" height="26" rx="3" fill="' + B.lg(['#4ADE80', '#15803D']) + '" stroke="#14532D" stroke-width="1.2"/><circle cx="54" cy="47" r="9" fill="none" stroke="#DCFCE7" stroke-width="1.6"/>',
          '<path d="' + (function () { var d = ''; for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 14 : 34; d += (i ? 'L' : 'M') + (50 + Math.cos(a) * r).toFixed(1) + ' ' + (50 + Math.sin(a) * r).toFixed(1); } return d; })() + 'z" fill="' + B.rg(['#FEF9C3', '#FACC15', '#A16207']) + '" stroke="#78350F" stroke-width="2" stroke-linejoin="round"/>' + gl(42, 42, 5, 3, 0, 0.6)
        ];
      } },
    atlantis: { kind: 'W5', pays: [[6, 25, 120], [3, 10, 50], [2, 6, 25], [1.2, 4, 12], [0.8, 2, 8], [0.4, 1.2, 5]], scat: [],
      bg: 'radial-gradient(90% 60% at 50% 0%,rgba(13,148,136,.32),transparent 70%),linear-gradient(180deg,#07211F,#04111A)', fr: ['#99F6E4', '#0D9488', '#063B38'], cell: '#071A1A',
      art: function (B) {
        return [
          shd(16) + '<rect x="47" y="20" width="6" height="58" rx="2" fill="' + B.lg(GOLD) + '" stroke="#78350F"/><path d="M30 28v-12M50 24v-14M70 28v-12" stroke="' + B.lg(GOLD) + '" stroke-width="5" stroke-linecap="round"/><path d="M26 28q24-12 48 0" fill="none" stroke="' + B.lg(GOLD) + '" stroke-width="5"/><path d="M28 16l-4-6M72 16l4-6M50 10l0-6" stroke="' + B.lg(GOLD) + '" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="70" r="4" fill="' + B.lg(GOLD) + '"/>',
          shd(24) + '<path d="M22 44h56v26a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4z" fill="' + B.lg(['#A16207', '#5C3A0A'], 'd') + '" stroke="#3B2406" stroke-width="1.6"/><path d="M22 44q6-16 28-16t28 16z" fill="' + B.lg(['#FDE68A', '#D97706', '#78350F']) + '" stroke="#3B2406" stroke-width="1.6"/><rect x="44" y="40" width="12" height="12" rx="2" fill="' + B.lg(GOLD) + '" stroke="#78350F"/><circle cx="50" cy="46" r="2.4" fill="#3B2406"/><circle cx="34" cy="60" r="4" fill="' + B.lg(GOLD) + '"/><circle cx="50" cy="62" r="4" fill="' + B.lg(['#FF8FA3', '#E11D48']) + '"/><circle cx="66" cy="60" r="4" fill="' + B.lg(['#7DD3FC', '#2563EB']) + '"/>',
          shd(18) + '<path d="M44 76c-2-10 2-18 2-26 0-8-6-10-6-18 0-6 4-12 12-12s12 6 12 12c0 4-2 6-4 6-3 0-4-2-4-4 0-1 1-2 2-2" fill="none" stroke="' + B.lg(['#5EEAD4', '#0D9488', '#063B38']) + '" stroke-width="8" stroke-linecap="round"/><circle cx="58" cy="26" r="2.4" fill="#063B38"/><path d="M44 50q-8 2-10 8 6 0 8 4M44 62q-7 2-9 8 6 0 8 4" fill="' + B.lg(['#99F6E4', '#0D9488']) + '"/>',
          royal(B, 'A', GOLD), royal(B, 'K', TURQ), royal(B, 'Q', LAPIS)
        ];
      } },
    wizard: { kind: 'L5', pays: [[8, 40, 250], [5, 15, 80], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], scat: [10, 50],
      bg: 'radial-gradient(90% 60% at 50% 0%,rgba(124,58,237,.32),transparent 70%),linear-gradient(180deg,#160A30,#06030F)', fr: ['#DDD6FE', '#7C3AED', '#2E1065'], cell: '#120826',
      art: function (B) {
        return [
          shd(24) + '<path d="M50 10l16 34H34z" fill="' + B.lg(['#A78BFA', '#6D28D9', '#2E1065'], 'd') + '" stroke="#2E1065" stroke-width="1.6"/>' + tw(50, 20, .8) + '<path d="M36 44h28l-2 8H38z" fill="' + B.lg(['#8B5CF6', '#4C1D95']) + '"/><path d="M38 52h24v6c0 10-5 18-12 18s-12-8-12-18z" fill="' + B.lg(['#F5F3FF', '#D1D5DB', '#9CA3AF'], 'd') + '" stroke="#6B7280" stroke-width="1.2"/><circle cx="44" cy="60" r="2.2" fill="#1F2937"/><circle cx="56" cy="60" r="2.2" fill="#1F2937"/><path d="M42 68q8 8 16 0l-2 10h-12z" fill="#E5E7EB" stroke="#9CA3AF"/>',
          shd(22) + '<circle cx="50" cy="44" r="22" fill="' + B.rg(['#DDD6FE', '#A78BFA', '#5B21B6']) + '" stroke="#4C1D95" stroke-width="1.6"/><path d="M36 72h28l-3 6H39z" fill="' + B.lg(GOLD) + '" stroke="#78350F"/><path d="M40 64h20l-2 8H42z" fill="' + B.lg(['#C4B5FD', '#7C3AED']) + '"/>' + gl(42, 36, 9, 6, -20, 0.6) + (function () { var s = ''; for (var i = 0; i < 5; i++) s += sp(36 + i * 7, 30 + (i % 2) * 8, 2, 0.8); return s; })(),
          shd(18) + '<rect x="42" y="14" width="16" height="8" rx="2" fill="#4C1D95"/><path d="M44 22h12l8 40a14 14 0 0 1-28 0z" fill="' + B.rg(['#C4B5FD', '#8B5CF6', '#4C1D95']) + '" stroke="#2E1065" stroke-width="1.6"/><ellipse cx="50" cy="52" rx="12" ry="14" fill="' + B.lg(['#34D399', '#059669', '#064E3B']) + '" opacity=".8"/>' + gl(44, 44, 6, 4, -20, 0.5) + sp(70, 28, 4, 0.8),
          shd(22) + '<path d="M24 24h44a6 6 0 0 1 6 6v44l-6-4H24z" fill="' + B.lg(['#8B5CF6', '#5B21B6', '#2E1065'], 'd') + '" stroke="#2E1065" stroke-width="1.6"/><rect x="30" y="30" width="38" height="36" rx="2" fill="' + B.rg(['#DDD6FE', '#A78BFA', '#6D28D9']) + '"/><path d="' + (function () { var d = ''; for (var i = 0; i < 5; i++) { var a = -Math.PI / 2 + i * 4 * Math.PI / 5; d += (i ? 'L' : 'M') + (49 + Math.cos(a) * 12).toFixed(1) + ' ' + (48 + Math.sin(a) * 12).toFixed(1); } return d; })() + 'z" fill="none" stroke="' + B.lg(GOLD) + '" stroke-width="2"/>',
          royal(B, 'A', GOLD), royal(B, 'K', AMET), royal(B, 'Q', EMER),
          '<circle cx="50" cy="50" r="44" fill="' + B.rg(['#DDD6FE', '#7C3AED', '#2E1065'], '50%', '50%', '60%') + '" opacity=".3"/><path d="' + (function () { var d = ''; for (var i = 0; i < 5; i++) { var a = -Math.PI / 2 + i * 4 * Math.PI / 5; d += (i ? 'L' : 'M') + (50 + Math.cos(a) * 34).toFixed(1) + ' ' + (50 + Math.sin(a) * 34).toFixed(1); } return d; })() + 'z" fill="' + B.rg(['#FFF7D6', '#FBBF24', '#B45309']) + '" stroke="#78350F" stroke-width="2" stroke-linejoin="round"/><circle cx="50" cy="50" r="10" fill="' + B.lg(['#C4B5FD', '#7C3AED']) + '"/>' + sp(50, 50, 7, 0.9) + sp(78, 24, 5)
        ];
      } },
    royalcrown: { kind: 'L5', pays: [[8, 40, 250], [5, 15, 80], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], scat: [10, 50],
      bg: 'radial-gradient(90% 60% at 50% 0%,rgba(202,138,4,.3),transparent 70%),linear-gradient(180deg,#1E1206,#0A0604)', fr: ['#FDE68A', '#A16207', '#3B2A06'], cell: '#1A1206',
      art: function (B) {
        return [
          shd(26) + '<path d="M18 58l-4-30 16 14 10-24 10 24 16-14-4 30z" fill="' + B.lg(GOLD) + '" stroke="#78350F" stroke-width="1.6" stroke-linejoin="round"/><rect x="18" y="58" width="64" height="12" rx="3" fill="' + B.lg(['#FBBF24', '#92400E']) + '" stroke="#78350F"/><circle cx="30" cy="30" r="4" fill="' + B.rg(RUBY) + '"/><circle cx="50" cy="24" r="4.5" fill="' + B.rg(EMER) + '"/><circle cx="70" cy="30" r="4" fill="' + B.rg(LAPIS) + '"/><circle cx="34" cy="64" r="2.4" fill="' + B.rg(RUBY) + '"/><circle cx="50" cy="64" r="2.4" fill="' + B.rg(EMER) + '"/><circle cx="66" cy="64" r="2.4" fill="' + B.rg(LAPIS) + '"/>' + gl(36, 40, 8, 4, -20, 0.4),
          shd(14) + '<rect x="47" y="30" width="6" height="48" rx="3" fill="' + B.lg(GOLD) + '" stroke="#78350F"/><circle cx="50" cy="24" r="11" fill="' + B.rg(['#FFF7D6', '#FBBF24', '#B45309']) + '" stroke="#78350F" stroke-width="1.6"/><path d="M50 13v22M39 24h22" stroke="#78350F" stroke-width="1.6" opacity=".5"/>' + gl(45, 20, 5, 3, -20, 0.6),
          shd(18) + '<circle cx="50" cy="56" r="20" fill="none" stroke="' + B.lg(GOLD) + '" stroke-width="7"/><path d="M42 30l8-14 8 14z" fill="' + B.rg(['#DBEAFE', '#60A5FA', '#1D4ED8']) + '" stroke="#1E3A8A" stroke-width="1.4"/><path d="M42 30h16l-8 10z" fill="' + B.rg(['#93C5FD', '#2563EB', '#172554']) + '"/>' + gl(46, 22, 4, 2, -20, 0.7),
          shd(20) + '<path d="M34 24h32l-4 14a12 12 0 0 1-24 0z" fill="' + B.rg(['#FFF7D6', '#FBBF24', '#B45309']) + '" stroke="#78350F" stroke-width="1.6"/><rect x="46" y="50" width="8" height="18" fill="' + B.lg(GOLD) + '"/><rect x="38" y="68" width="24" height="8" rx="2" fill="' + B.lg(GOLD) + '" stroke="#78350F"/><ellipse cx="50" cy="30" rx="14" ry="4" fill="' + B.lg(['#FF8FA3', '#E11D48']) + '" opacity=".8"/>',
          royal(B, 'A', GOLD), royal(B, 'K', RUBY), royal(B, 'Q', LAPIS),
          '<circle cx="50" cy="50" r="42" fill="' + B.rg(['#FFF7D6', '#FBBF24', '#78350F'], '50%', '50%', '60%') + '" opacity=".3"/>' + gem(B, ngon(6, 26, 30, 0, 50, 50), RUBY) + sp(80, 22, 6)
        ];
      } },
    luckycat: { kind: 'W5', pays: [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 3, 12], [0.6, 2, 8], [0.4, 1.2, 5]], scat: [],
      bg: 'radial-gradient(90% 60% at 50% 0%,rgba(220,38,38,.28),transparent 70%),linear-gradient(180deg,#2A0A0A,#0B0505)', fr: ['#FECACA', '#DC2626', '#3B0606'], cell: '#1A0808',
      art: function (B) {
        return [
          shd(26) + '<path d="M28 78V46c0-14 10-24 22-24s22 10 22 24v32z" fill="#fff" stroke="#9CA3AF" stroke-width="1.4"/><path d="M34 26l-4-12 12 6M66 26l4-12-12 6" fill="#fff" stroke="#9CA3AF"/><path d="M36 18l-2-5 5 3M64 18l2-5-5 3" fill="#FB7185"/><circle cx="42" cy="40" r="2.6" fill="#1A0505"/><circle cx="58" cy="40" r="2.6" fill="#1A0505"/><circle cx="50" cy="46" r="2.2" fill="#FB7185"/><path d="M50 48v3M44 50q6 4 12 0" stroke="#9CA3AF" stroke-width="1.2" fill="none"/><path d="M30 44l-10-2M30 50l-10 2M70 44l10-2M70 50l10 2" stroke="#9CA3AF" stroke-width="1"/><rect x="40" y="58" width="20" height="14" rx="3" fill="' + B.lg(GOLD) + '" stroke="#78350F"/><text x="50" y="69" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="9" fill="#78350F">金</text><path d="M72 40c6-6 14-4 16 4-6-2-10 0-12 4z" fill="' + B.lg(GOLD) + '" stroke="#78350F"/>',
          shd(20) + '<path d="M22 50c0-10 12-18 28-18s28 8 28 18-12 18-28 18c-8 0-15-3-20-8l-8 8 2-10c0-2-2-4-2-8z" fill="' + B.lg(['#FB923C', '#EA580C', '#9A3412'], 'd') + '" stroke="#7C2D12" stroke-width="1.4"/><circle cx="40" cy="46" r="3" fill="#1A0505"/><path d="M60 40q10 2 14 10M60 56q10-2 14-10" stroke="#C2410C" stroke-width="2" fill="none"/>' + gl(36, 42, 6, 3, -20, 0.5),
          shd(20) + coinS(B, GOLD, '<text x="50" y="58" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="20" fill="#92400E">福</text>'),
          royal(B, 'A', GOLD), royal(B, 'K', RUBY), royal(B, 'Q', EMER)
        ];
      } },
    wolfmoon: { kind: 'A', cols: 5, rows: 4, bands: [6, 8, 10], pays: [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 4, 12], [0.8, 2.5, 8], [0.5, 1.5, 5], [0.3, 1, 3]], scat: [],
      bg: 'radial-gradient(85% 60% at 50% 0%,rgba(99,102,241,.3),transparent 70%),linear-gradient(180deg,#0E1428,#05060F)', fr: ['#C7D2FE', '#4F46E5', '#1E1B4B'], cell: '#0C1024',
      art: function (B) {
        return [
          shd(24) + '<path d="M26 28l-2-14 12 10c4-2 12-2 16 0l12-10-2 14c4 4 6 10 6 16 0 14-10 24-24 24s-24-10-24-24c0-6 2-12 6-16z" fill="' + B.lg(['#9CA3AF', '#4B5563', '#1F2937'], 'd') + '" stroke="#111827" stroke-width="1.6"/><path d="M26 28l2-10 8 8M74 28l-2-10-8 8" fill="' + B.lg(['#6B7280', '#374151']) + '"/><circle cx="41" cy="44" r="3" fill="#FCD34D"/><circle cx="59" cy="44" r="3" fill="#FCD34D"/><path d="M50 52l-5 6h10z" fill="#111827"/><path d="M50 58v6M44 62q6 4 12 0" stroke="#111827" stroke-width="2" fill="none"/>',
          shd(22) + '<circle cx="50" cy="48" r="26" fill="' + B.rg(['#FFFDE7', '#FDE68A', '#A16207']) + '" stroke="#854D0E" stroke-width="1.2"/><circle cx="40" cy="40" r="5" fill="#E5D9A8" opacity=".55"/><circle cx="60" cy="54" r="7" fill="#E5D9A8" opacity=".45"/><circle cx="54" cy="36" r="3.5" fill="#E5D9A8" opacity=".5"/>' + gl(40, 38, 8, 5, -20, 0.4),
          shd(18) + '<ellipse cx="50" cy="58" rx="12" ry="10" fill="' + B.lg(['#E5E7EB', '#9CA3AF']) + '"/><ellipse cx="40" cy="42" rx="5" ry="7" fill="' + B.lg(['#E5E7EB', '#9CA3AF']) + '"/><ellipse cx="50" cy="38" rx="5" ry="7" fill="' + B.lg(['#E5E7EB', '#9CA3AF']) + '"/><ellipse cx="60" cy="42" rx="5" ry="7" fill="' + B.lg(['#E5E7EB', '#9CA3AF']) + '"/><ellipse cx="66" cy="52" rx="4" ry="6" fill="' + B.lg(['#E5E7EB', '#9CA3AF']) + '"/>',
          shd(16) + '<rect x="46" y="60" width="8" height="18" fill="#5C3A0A"/><path d="M50 14l16 22H34zM50 28l18 24H32zM50 42l20 26H30z" fill="' + B.lg(['#34D399', '#059669', '#064E3B'], 'd') + '" stroke="#064E3B" stroke-width="1.2"/>',
          royal(B, 'A', ICE), royal(B, 'K', LAPIS), royal(B, 'Q', SILV)
        ];
      } },
    vampire: { kind: 'L5', pays: [[10, 50, 300], [5, 20, 80], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], scat: [12, 60],
      bg: 'radial-gradient(90% 60% at 50% 0%,rgba(190,18,60,.3),transparent 70%),linear-gradient(180deg,#1A0714,#070309)', fr: ['#FBCFE8', '#9F1239', '#2B0512'], cell: '#160611',
      art: function (B) {
        return [
          shd(24) + '<path d="M28 76l-4-22q-4-6-4-14c0-16 12-24 30-24s30 8 30 24q0 8-4 14l-4 22-10-6-8 6-8-6z" fill="' + B.lg(['#1F2937', '#0B1020'], 'd') + '" stroke="#000" stroke-width="1.2"/><ellipse cx="50" cy="40" rx="16" ry="18" fill="' + B.lg(['#F8FAFC', '#CBD5E1']) + '" stroke="#94A3B8"/><path d="M38 34q4-3 8 0M54 34q4-3 8 0" stroke="#0B1020" stroke-width="1.6" fill="none"/><circle cx="43" cy="38" r="2" fill="#B91C1C"/><circle cx="57" cy="38" r="2" fill="#B91C1C"/><path d="M50 30v3M44 46q6 4 12 0" stroke="#9F1239" stroke-width="1.6" fill="none"/><path d="M45 48l2 5 2-5M55 48l-2 5-2-5" fill="#fff" stroke="#94A3B8" stroke-width=".5"/>',
          shd(24) + '<path d="M50 34c-4-8-14-12-24-10 4 2 6 6 4 10-6-2-10 0-12 4 8 0 12 4 12 4-4 0-8 4-8 8 6-4 12-2 16 0-2 2-2 6 0 8 4-4 8-6 12-6s8 2 12 6c2-2 2-6 0-8 4-2 10-4 16 0 0-4-4-8-8-8 0 0 4-4 12-4-2-4-6-6-12-4 2-4 0-8 4-10-10-2-20 2-24 10z" fill="' + B.lg(['#4B5563', '#1F2937', '#0B1020'], 'd') + '" stroke="#000" stroke-width="1.2"/><circle cx="50" cy="40" r="5" fill="' + B.lg(['#6B7280', '#374151']) + '"/><circle cx="48" cy="39" r="1.4" fill="#B91C1C"/><circle cx="52" cy="39" r="1.4" fill="#B91C1C"/>',
          shd(22) + '<path d="M30 30h40l-4 44a8 8 0 0 1-8 6H42a8 8 0 0 1-8-6z" fill="' + B.lg(['#7C2D12', '#450A0A'], 'd') + '" stroke="#2B0512" stroke-width="1.6"/><path d="M50 18l4 12h-8z" fill="' + B.lg(['#7C2D12', '#450A0A']) + '"/><path d="M50 30v44M38 44h24" stroke="' + B.lg(GOLD) + '" stroke-width="2.4"/>' + gl(40, 42, 5, 10, -20, 0.15),
          shd(18) + '<path d="M50 30c-10-8-22-2-22 8 0 8 10 14 22 24 12-10 22-16 22-24 0-10-12-16-22-8z" fill="' + B.rg(['#FB7185', '#E11D48', '#881337']) + '" stroke="#6B0F24" stroke-width="1.4"/><path d="M50 36q6-4 12 0M50 36q-6-4-12 0" stroke="#FFF" stroke-width="1" opacity=".4" fill="none"/><rect x="47" y="60" width="6" height="18" fill="#15803D"/>',
          royal(B, 'A', GOLD), royal(B, 'K', RUBY), royal(B, 'Q', AMET),
          '<circle cx="50" cy="48" r="28" fill="' + B.rg(['#FFFDE7', '#FDE68A', '#A16207']) + '" stroke="#854D0E" stroke-width="1.4"/><circle cx="40" cy="40" r="5" fill="#E5D9A8" opacity=".55"/><circle cx="60" cy="54" r="7" fill="#E5D9A8" opacity=".45"/><path d="M28 60q22 8 44 0" stroke="#4B5563" stroke-width="2" fill="none" opacity=".3"/>' + sp(80, 22, 6)
        ];
      } },
    peacock: { kind: 'W5', pays: [[6, 25, 120], [3, 10, 50], [2, 6, 25], [1.2, 4, 12], [0.8, 2, 8], [0.4, 1.2, 5]], scat: [],
      bg: 'radial-gradient(90% 60% at 50% 0%,rgba(13,148,136,.3),transparent 70%),linear-gradient(180deg,#07231F,#04121A)', fr: ['#99F6E4', '#0D9488', '#063B38'], cell: '#071A1A',
      art: function (B) {
        return [
          shd(26) + (function () { var s = ''; for (var i = 0; i < 7; i++) { var a = (i - 3) * 0.4, ex = 50 + Math.sin(a) * 34, ey = 40 - Math.cos(a) * 30; s += '<path d="M50 60Q' + (50 + Math.sin(a) * 18).toFixed(1) + ' ' + (50 - Math.cos(a) * 18).toFixed(1) + ' ' + ex.toFixed(1) + ' ' + ey.toFixed(1) + '" stroke="' + B.lg(['#14B8A6', '#0D9488']) + '" stroke-width="2" fill="none"/><circle cx="' + ex.toFixed(1) + '" cy="' + ey.toFixed(1) + '" r="6" fill="' + B.rg(['#5EEAD4', '#0D9488', '#063B38']) + '"/><circle cx="' + ex.toFixed(1) + '" cy="' + ey.toFixed(1) + '" r="3" fill="' + B.rg(['#C7D2FE', '#4F46E5']) + '"/>'; } return s; })() + '<ellipse cx="50" cy="64" rx="9" ry="14" fill="' + B.lg(['#2DD4BF', '#0F766E', '#063B38'], 'd') + '" stroke="#063B38"/><circle cx="50" cy="50" r="6" fill="' + B.lg(['#34D399', '#065F46']) + '"/><circle cx="48" cy="49" r="1.6" fill="#fff"/><path d="M50 46v-6M47 40h6" stroke="#0D9488" stroke-width="2"/><path d="M50 54l-5 2 5 2z" fill="#F59E0B"/>',
          shd(18) + gem(B, ngon(6, 22, 26, 0, 50, 48), EMER),
          shd(18) + '<path d="M50 78Q40 50 44 28q2-12 6-14 4 2 6 14 4 22-6 50z" fill="' + B.lg(['#5EEAD4', '#0D9488', '#063B38'], 'd') + '" stroke="#063B38" stroke-width="1.2"/>' + (function () { var s = ''; for (var i = 0; i < 8; i++) { var y = 30 + i * 5; s += '<path d="M50 ' + y + 'q-8 2-10 6M50 ' + y + 'q8 2 10 6" stroke="#2DD4BF" stroke-width="1.2" fill="none" opacity=".7"/>'; } return s; })() + '<circle cx="50" cy="26" r="4" fill="' + B.rg(['#C7D2FE', '#4F46E5']) + '"/>',
          royal(B, 'A', GOLD), royal(B, 'K', TURQ), royal(B, 'Q', LAPIS)
        ];
      } },
    knight: { kind: 'R33', pays: [50, 20, 10, 6, 3, 2], scat: [],
      bg: 'radial-gradient(80% 60% at 50% 0%,rgba(100,116,139,.32),transparent 70%),linear-gradient(180deg,#131A28,#06080F)', fr: ['#CBD5E1', '#475569', '#1E293B'], cell: '#0E1420',
      art: function (B) {
        return [
          shd(24) + '<path d="M32 28c0-10 8-16 18-16s18 6 18 16v30a8 8 0 0 1-8 8H40a8 8 0 0 1-8-8z" fill="' + B.lg(['#E2E8F0', '#94A3B8', '#475569'], 'd') + '" stroke="#334155" stroke-width="1.6"/><rect x="48" y="24" width="4" height="40" fill="#1E293B"/><path d="M38 34l10-3v4l-10 3zM62 34l-10-3v4l10 3z" fill="#1E293B"/><path d="M50 10q6 2 6 10H44q0-8 6-10z" fill="' + B.lg(GOLD) + '" stroke="#78350F"/>' + gl(40, 30, 7, 4, -20, 0.5),
          shd(22) + '<path d="M30 20l34 44M70 20L36 64" stroke="' + B.lg(['#E2E8F0', '#94A3B8']) + '" stroke-width="7" stroke-linecap="round"/><path d="M30 20l34 44M70 20L36 64" stroke="#334155" stroke-width="2"/><rect x="24" y="60" width="18" height="6" rx="2" fill="' + B.lg(GOLD) + '" transform="rotate(45 33 63)"/><rect x="58" y="60" width="18" height="6" rx="2" fill="' + B.lg(GOLD) + '" transform="rotate(-45 67 63)"/>',
          shd(22) + '<path d="M50 20l26 8v18c0 16-12 26-26 32-14-6-26-16-26-32V28z" fill="' + B.lg(['#CBD5E1', '#64748B', '#334155'], 'd') + '" stroke="#1E293B" stroke-width="1.6"/><path d="M50 20v60M24 44h52" stroke="#334155" stroke-width="2.4"/><path d="M42 36l8-6 8 6-8 6z" fill="' + B.rg(RUBY) + '"/>' + gl(38, 34, 6, 4, -20, 0.4),
          shd(18) + '<path d="M22 54c-4-8-4-18 2-24 5-5 14-4 17 2 2-5 9-6 12-2 3 3 1 8-2 9 5 2 6 8 3 11-3-2-6-1-8 2 2 10-6 16-16 16-11 0-22-9-25-14z" fill="' + B.lg(['#34D399', '#059669', '#064E3B'], 'd') + '" stroke="#064E3B" stroke-width="1.4"/><circle cx="34" cy="36" r="3" fill="#FCD34D"/><circle cx="34" cy="36" r="1.4" fill="#1A0505"/>',
          '<path d="M18 56l-4-28 16 12 10-22 10 22 16-12-4 28z" fill="' + B.lg(GOLD) + '" stroke="#78350F" stroke-width="1.6" stroke-linejoin="round"/><rect x="18" y="56" width="64" height="12" rx="3" fill="' + B.lg(['#FBBF24', '#92400E']) + '" stroke="#78350F"/><circle cx="50" cy="26" r="4" fill="' + B.rg(RUBY) + '"/>',
          '<path d="' + (function () { var d = ''; for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 14 : 34; d += (i ? 'L' : 'M') + (50 + Math.cos(a) * r).toFixed(1) + ' ' + (50 + Math.sin(a) * r).toFixed(1); } return d; })() + 'z" fill="' + B.rg(['#DBEAFE', '#60A5FA', '#1D4ED8']) + '" stroke="#1E3A8A" stroke-width="2" stroke-linejoin="round"/>' + gl(42, 42, 5, 3, 0, 0.6)
        ];
      } },
    tikigods: { kind: 'L5', pays: [[10, 50, 300], [5, 20, 80], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], scat: [12, 60],
      bg: 'radial-gradient(90% 60% at 50% 0%,rgba(234,88,12,.3),transparent 70%),linear-gradient(180deg,#1A0E06,#070402)', fr: ['#FDBA74', '#C2410C', '#3B1A06'], cell: '#160A04',
      art: function (B) {
        return [
          shd(24) + '<path d="M30 14h40v56a10 10 0 0 1-10 10H40a10 10 0 0 1-10-10z" fill="' + B.lg(['#A16207', '#7C3A0A', '#44220A'], 'd') + '" stroke="#2E1606" stroke-width="1.6"/><path d="M28 20h44l-4 8H32z" fill="' + B.lg(['#C2773B', '#7C3A0A']) + '"/><path d="M34 34q8-6 14 0M52 34q8-6 14 0" fill="#1A0E04"/><circle cx="41" cy="34" r="4" fill="#FDE68A"/><circle cx="59" cy="34" r="4" fill="#FDE68A"/><circle cx="41" cy="34" r="1.8" fill="#1A0E04"/><circle cx="59" cy="34" r="1.8" fill="#1A0E04"/><path d="M44 46q6 4 12 0" stroke="#2E1606" stroke-width="2" fill="none"/><path d="M36 54h28l-4 10H40z" fill="#1A0E04"/><path d="M40 54v10M48 54v10M56 54v10" stroke="#FDE68A" stroke-width="1.6"/>',
          shd(26) + '<path d="M18 74l16-38h8l16 38z" fill="' + B.lg(['#6B7280', '#374151', '#1F2937'], 'd') + '" stroke="#111827" stroke-width="1.4"/><path d="M34 36q-2-14 4-22 2 8 6 10 2-6 6-4-2 10 2 16 2-4 6-2-4 10-4 14q-10 4-20-2z" fill="' + B.rg(['#FDE047', '#F97316', '#DC2626']) + '"/><circle cx="36" cy="22" r="2" fill="#FDE047"/><circle cx="48" cy="18" r="2" fill="#F97316"/>',
          shd(20) + (function () { var s = ''; for (var i = 0; i < 5; i++) { var a = i * 2 * Math.PI / 5 - Math.PI / 2, cx = 50 + Math.cos(a) * 16, cy = 48 + Math.sin(a) * 16; s += '<ellipse cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" rx="12" ry="9" fill="' + B.rg(['#FDA4AF', '#F43F5E', '#9F1239']) + '" stroke="#881337" stroke-width="1" transform="rotate(' + (a * 180 / Math.PI + 90).toFixed(0) + ' ' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ')"/>'; } return s; })() + '<circle cx="50" cy="48" r="7" fill="' + B.lg(['#FEF08A', '#F59E0B']) + '"/>',
          shd(14) + '<rect x="46" y="40" width="8" height="40" rx="2" fill="' + B.lg(['#A16207', '#5C3A0A']) + '" stroke="#2E1606"/><path d="M44 40h12l-2 6H46z" fill="' + B.lg(['#78350F', '#44220A']) + '"/><path d="M50 14c-4 6-6 10-4 16-4-4-8-2-8 4 0 8 6 12 12 12s12-4 12-12c0-6-4-8-8-4 2-6 0-10-4-16z" fill="' + B.rg(['#FFF7D6', '#F97316', '#DC2626']) + '"/>',
          royal(B, 'A', GOLD), royal(B, 'K', ORNG), royal(B, 'Q', RUBY),
          '<circle cx="50" cy="50" r="42" fill="' + B.rg(['#FFF7D6', '#FBBF24', '#78350F'], '50%', '50%', '60%') + '" opacity=".3"/><path d="M34 18h32v48a14 14 0 0 1-32 0z" fill="' + B.lg(GOLD) + '" stroke="#78350F" stroke-width="1.6"/><circle cx="43" cy="38" r="4" fill="#78350F"/><circle cx="57" cy="38" r="4" fill="#78350F"/><path d="M40 52h20l-3 8H43z" fill="#78350F"/>' + sp(80, 22, 6)
        ];
      } },
    icequeen: { kind: 'W5', pays: [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 3, 12], [0.6, 2, 8], [0.4, 1.2, 5]], scat: [],
      bg: 'radial-gradient(90% 60% at 50% 0%,rgba(56,189,248,.3),transparent 70%),linear-gradient(180deg,#0A1E2E,#05101A)', fr: ['#BAE6FD', '#0EA5E9', '#0C3B52'], cell: '#081826',
      art: function (B) {
        return [
          shd(24) + '<path d="M50 20c-12 0-18 10-18 22 0 14 8 26 18 34 10-8 18-20 18-34 0-12-6-22-18-22z" fill="' + B.lg(['#F0F9FF', '#BAE6FD', '#7DD3FC'], 'd') + '" stroke="#0EA5E9" stroke-width="1.4"/><path d="M34 26l6-14 4 10 6-12 6 12 4-10 6 14z" fill="' + B.lg(['#E0F2FE', '#38BDF8']) + '" stroke="#0284C7" stroke-width="1.2"/><circle cx="36" cy="18" r="2" fill="#7DD3FC"/><circle cx="50" cy="14" r="2.4" fill="#38BDF8"/><circle cx="64" cy="18" r="2" fill="#7DD3FC"/><circle cx="43" cy="42" r="2.4" fill="#0C3B52"/><circle cx="57" cy="42" r="2.4" fill="#0C3B52"/><path d="M45 52q5 3 10 0" stroke="#0EA5E9" stroke-width="1.6" fill="none"/>',
          shd(18) + (function () { var s = ''; for (var i = 0; i < 6; i++) { var a = i * Math.PI / 3, x2 = 50 + Math.cos(a) * 30, y2 = 48 + Math.sin(a) * 30, bx = 50 + Math.cos(a) * 18, by = 48 + Math.sin(a) * 18; s += '<path d="M50 48L' + x2.toFixed(1) + ' ' + y2.toFixed(1) + '" stroke="' + B.lg(['#E0F2FE', '#38BDF8']) + '" stroke-width="3" stroke-linecap="round"/><path d="M' + bx.toFixed(1) + ' ' + by.toFixed(1) + 'l' + (Math.cos(a + 1) * 8).toFixed(1) + ' ' + (Math.sin(a + 1) * 8).toFixed(1) + 'M' + bx.toFixed(1) + ' ' + by.toFixed(1) + 'l' + (Math.cos(a - 1) * 8).toFixed(1) + ' ' + (Math.sin(a - 1) * 8).toFixed(1) + '" stroke="' + B.lg(['#E0F2FE', '#38BDF8']) + '" stroke-width="2.4" stroke-linecap="round"/>'; } return s; })() + '<circle cx="50" cy="48" r="5" fill="' + B.rg(['#F0F9FF', '#7DD3FC', '#0284C7']) + '"/>',
          shd(16) + '<path d="M50 14l14 20-14 46-14-46z" fill="' + B.rg(['#E0F2FE', '#7DD3FC', '#0C4A6E']) + '" stroke="#0284C7" stroke-width="1.4" stroke-linejoin="round"/><path d="M36 34h28M50 14v64M43 24l7 10 7-10" fill="none" stroke="#F0F9FF" stroke-width="1" opacity=".7"/>' + gl(44, 30, 4, 8, -15, 0.4),
          royal(B, 'A', ICE), royal(B, 'K', LAPIS), royal(B, 'Q', SILV)
        ];
      } },
    caishen: { kind: 'L5', pays: [[8, 40, 250], [5, 15, 80], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], scat: [10, 50],
      bg: 'radial-gradient(90% 60% at 50% 0%,rgba(220,38,38,.3),transparent 70%),linear-gradient(180deg,#2A0A0A,#0B0404)', fr: ['#FECACA', '#B91C1C', '#3B0606'], cell: '#1A0808',
      art: function (B) {
        return [
          shd(26) + '<path d="M26 40c0-16 10-26 24-26s24 10 24 26c0 6-2 10-2 10l4 24H24l4-24s-2-4-2-10z" fill="' + B.lg(['#FDE68A', '#D97706', '#78350F'], 'd') + '" stroke="#5C2E0E" stroke-width="1.6"/><path d="M30 16h40l-6 10H36z" fill="' + B.lg(GOLD) + '" stroke="#78350F"/><circle cx="50" cy="8" r="4" fill="' + B.rg(RUBY) + '"/><ellipse cx="50" cy="36" rx="16" ry="14" fill="#FFE4C7"/><circle cx="43" cy="34" r="2.4" fill="#1A0808"/><circle cx="57" cy="34" r="2.4" fill="#1A0808"/><path d="M44 30q3-2 5 0M51 30q3-2 5 0" stroke="#78350F" stroke-width="1.4" fill="none"/><path d="M44 42q6 4 12 0" stroke="#B91C1C" stroke-width="2" fill="none"/><path d="M40 48q10 10 20 0l-2 18H42z" fill="#fff" stroke="#9CA3AF"/>',
          shd(22) + '<path d="M18 60q10-14 32-14t32 14q-14 6-32 6t-32-6z" fill="' + B.lg(GOLD) + '" stroke="#78350F" stroke-width="1.6"/><ellipse cx="50" cy="46" rx="12" ry="6" fill="' + B.rg(['#FFF7D6', '#FBBF24', '#D97706']) + '" stroke="#78350F"/><path d="M44 44q6-4 12 0" stroke="#78350F" stroke-width="1.4" fill="none"/>' + gl(38, 52, 8, 4, -20, 0.5),
          shd(22) + '<rect x="30" y="20" width="40" height="56" rx="4" fill="' + B.lg(['#EF4444', '#B91C1C', '#7F1D1D'], 'd') + '" stroke="#450A0A" stroke-width="1.6"/><path d="M30 20q20 14 40 0" fill="' + B.lg(['#DC2626', '#991B1B']) + '"/><circle cx="50" cy="46" r="11" fill="' + B.lg(GOLD) + '" stroke="#78350F"/><path d="M46 42h8M50 40v12M46 48h8" stroke="#78350F" stroke-width="2"/>' + gl(40, 34, 6, 3, -20, 0.3),
          shd(16) + (function () { var s = ''; for (var i = 0; i < 4; i++) { var x = 38 + i * 8; s += '<rect x="' + x + '" y="30" width="6" height="30" rx="2" fill="' + B.lg(['#EF4444', '#991B1B']) + '" stroke="#450A0A"/><path d="M' + (x + 3) + ' 30v-8" stroke="#78350F" stroke-width="1.4"/>'; } return s; })() + '<path d="M38 22q12-6 24 0" stroke="#FACC15" stroke-width="2" fill="none"/>' + sp(66, 24, 4, 0.8),
          royal(B, 'A', GOLD), royal(B, 'K', RUBY), royal(B, 'Q', ORNG),
          '<circle cx="50" cy="50" r="42" fill="' + B.rg(['#FFF7D6', '#FBBF24', '#78350F'], '50%', '50%', '60%') + '" opacity=".3"/>' + coinS(B, GOLD, '<rect x="42" y="42" width="16" height="16" fill="#B91C1C"/><text x="50" y="62" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="16" fill="#FDE68A">財</text>') + sp(80, 22, 6)
        ];
      } },
    luchador: { kind: 'A', cols: 5, rows: 4, bands: [6, 8, 10], pays: [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 4, 12], [0.8, 2.5, 8], [0.5, 1.5, 5], [0.3, 1, 3]], scat: [],
      bg: 'radial-gradient(85% 60% at 50% 0%,rgba(220,38,38,.3),transparent 70%),linear-gradient(180deg,#2A0A14,#0B030A)', fr: ['#FECACA', '#DC2626', '#3B0612'], cell: '#1A0810',
      art: function (B) {
        return [
          shd(24) + '<path d="M26 40c0-16 10-26 24-26s24 10 24 26c0 10-4 18-10 24H36c-6-6-10-14-10-24z" fill="' + B.lg(['#EF4444', '#B91C1C', '#7F1D1D'], 'd') + '" stroke="#450A0A" stroke-width="1.6"/><path d="M50 14v50M30 38h40" stroke="' + B.lg(GOLD) + '" stroke-width="2" opacity=".5"/><path d="M34 34q8-6 14 0 6-6 14 0l-4 8q-6-4-10 0-4-4-10 0z" fill="' + B.lg(GOLD) + '" stroke="#78350F"/><ellipse cx="42" cy="37" rx="4" ry="5" fill="#1A0810"/><ellipse cx="58" cy="37" rx="4" ry="5" fill="#1A0810"/><path d="M40 52h20l-4 8H44z" fill="#1A0810"/><path d="M44 52v8M50 52v8M56 52v8" stroke="#fff" stroke-width="1.2"/>',
          shd(20) + '<rect x="14" y="42" width="72" height="14" rx="4" fill="' + B.lg(['#7C2D12', '#44220A'], 'd') + '" stroke="#2E1606"/><circle cx="50" cy="49" r="16" fill="' + B.lg(GOLD) + '" stroke="#78350F" stroke-width="1.6"/><circle cx="50" cy="49" r="10" fill="' + B.rg(['#FFF7D6', '#FBBF24', '#D97706']) + '"/><path d="M50 43l1.8 4.5h5l-4 3 1.5 5-4.3-3-4.3 3 1.5-5-4-3h5z" fill="#78350F"/><rect x="20" y="46" width="8" height="6" rx="1" fill="' + B.lg(GOLD) + '"/><rect x="72" y="46" width="8" height="6" rx="1" fill="' + B.lg(GOLD) + '"/>',
          shd(22) + '<path d="M28 44c0-12 8-20 20-20 10 0 16 6 16 14 0 2 0 4-2 6l4 2c4 2 6 6 6 10 0 8-6 14-16 14H40c-8 0-12-6-12-14z" fill="' + B.lg(['#EF4444', '#B91C1C', '#7F1D1D'], 'd') + '" stroke="#450A0A" stroke-width="1.6"/><rect x="34" y="62" width="28" height="8" rx="2" fill="#FFF" opacity=".8"/>' + gl(38, 38, 8, 5, -20, 0.4),
          shd(20) + '<path d="M50 20c-14 0-22 10-22 22 0 8 4 12 4 12v10a4 4 0 0 0 4 4h4l2-6h2l2 6h4l2-6h2l2 6h4a4 4 0 0 0 4-4V66s4-4 4-12c0-12-8-22-22-22z" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.4"/><circle cx="40" cy="42" r="6" fill="' + B.rg(['#FDA4AF', '#E11D48', '#881337']) + '"/><circle cx="60" cy="42" r="6" fill="' + B.rg(['#A7F3D0', '#10B981', '#065F46']) + '"/><path d="M50 50l-3 5h6z" fill="#1F2937"/><path d="M44 62h12M46 58v8M50 58v8M54 58v8" stroke="#1F2937" stroke-width="1.4"/><circle cx="50" cy="30" r="3" fill="' + B.lg(GOLD) + '"/>',
          royal(B, 'A', GOLD), royal(B, 'K', RUBY), royal(B, 'Q', EMER)
        ];
      } },
    fiesta: { kind: 'R33', pays: [50, 20, 10, 6, 3, 2], scat: [],
      bg: 'radial-gradient(80% 60% at 50% 0%,rgba(234,88,12,.3),transparent 70%),linear-gradient(180deg,#2A1406,#0B0604)', fr: ['#FDBA74', '#EA580C', '#3B1A06'], cell: '#1A0E06',
      art: function (B) {
        return [
          shd(26) + '<ellipse cx="50" cy="60" rx="38" ry="14" fill="' + B.lg(['#FBBF24', '#B45309', '#78350F'], 'd') + '" stroke="#5C2E0E" stroke-width="1.6"/><path d="M34 60c0-18 6-30 16-30s16 12 16 30z" fill="' + B.lg(['#FCD34D', '#B45309']) + '" stroke="#5C2E0E" stroke-width="1.4"/><ellipse cx="50" cy="32" rx="10" ry="5" fill="' + B.lg(['#FBBF24', '#92400E']) + '"/><path d="M18 60q32 10 64 0" fill="none" stroke="' + B.rg(['#FF8FA3', '#E11D48']) + '" stroke-width="3"/><path d="M38 44q12-4 24 0" stroke="#15803D" stroke-width="2.4" fill="none"/>',
          shd(18) + '<ellipse cx="42" cy="34" rx="15" ry="17" fill="' + B.rg(['#FDA4AF', '#E11D48', '#881337']) + '" stroke="#6B0F24" stroke-width="1.4"/><rect x="38" y="48" width="8" height="26" rx="3" fill="' + B.lg(['#A16207', '#5C3A0A']) + '" stroke="#2E1606" transform="rotate(12 42 60)"/><circle cx="36" cy="30" r="2" fill="#FEF08A"/><circle cx="46" cy="36" r="2" fill="#FEF08A"/><circle cx="42" cy="26" r="2" fill="#34D399"/>' + gl(36, 28, 6, 4, -20, 0.5),
          shd(20) + '<rect x="44" y="30" width="12" height="46" rx="6" fill="' + B.lg(['#4ADE80', '#15803D', '#14532D'], 'd') + '" stroke="#14532D" stroke-width="1.4"/><path d="M44 50h-8a6 6 0 0 0-6 6v8a6 6 0 0 0 6-6v-2M56 44h8a6 6 0 0 1 6 6v12a6 6 0 0 1-6-6v-6" fill="' + B.lg(['#4ADE80', '#15803D']) + '" stroke="#14532D" stroke-width="1.4"/><circle cx="50" cy="30" r="4" fill="' + B.rg(['#FF8FA3', '#E11D48']) + '"/>',
          shd(18) + '<ellipse cx="44" cy="56" rx="18" ry="20" fill="' + B.lg(['#D97706', '#92400E', '#5C2E0E'], 'd') + '" stroke="#2E1606" stroke-width="1.6"/><circle cx="44" cy="56" r="7" fill="#1A0E04"/><rect x="40" y="10" width="8" height="34" rx="2" fill="' + B.lg(['#A16207', '#5C3A0A']) + '" transform="rotate(-20 44 27)"/><path d="M30 46h28" stroke="#FDE68A" stroke-width="1" opacity=".6"/>' + gl(38, 48, 6, 4, -20, 0.4),
          shd(16) + '<path d="M34 24q4-8 10-6-2 6 2 10c10 2 20 14 18 30-2 14-14 18-22 12-10-8-16-30-8-46z" fill="' + B.lg(['#EF4444', '#B91C1C', '#7F1D1D'], 'd') + '" stroke="#450A0A" stroke-width="1.4"/><path d="M34 24q-4-6-10-4 2 6-2 10 8-2 12-6z" fill="' + B.lg(['#4ADE80', '#15803D']) + '" stroke="#14532D"/>' + gl(40, 40, 5, 8, -30, 0.4),
          '<path d="' + (function () { var d = ''; for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 14 : 34; d += (i ? 'L' : 'M') + (50 + Math.cos(a) * r).toFixed(1) + ' ' + (50 + Math.sin(a) * r).toFixed(1); } return d; })() + 'z" fill="' + B.rg(['#FEF9C3', '#FACC15', '#A16207']) + '" stroke="#78350F" stroke-width="2" stroke-linejoin="round"/>' + gl(42, 42, 5, 3, 0, 0.6)
        ];
      } },
    genie: { kind: 'W5', pays: [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 3, 12], [0.6, 2, 8], [0.4, 1.2, 5]], scat: [],
      bg: 'radial-gradient(90% 60% at 50% 0%,rgba(147,51,234,.3),transparent 70%),linear-gradient(180deg,#1A0A2E,#06030F)', fr: ['#E9D5FF', '#9333EA', '#3B0764'], cell: '#120826',
      art: function (B) {
        return [
          shd(26) + '<path d="M50 14c-8 0-14 6-14 14 0 4 2 7 4 9-8 2-14 10-14 20 0 2 0 4 1 5 6-4 14-6 23-6s17 2 23 6c1-1 1-3 1-5 0-10-6-18-14-20 2-2 4-5 4-9 0-8-6-14-14-14z" fill="' + B.lg(['#C4B5FD', '#8B5CF6', '#5B21B6'], 'd') + '" stroke="#4C1D95" stroke-width="1.4"/><path d="M38 20q12-6 24 0l-2-6q-10-4-20 0z" fill="' + B.lg(GOLD) + '"/><circle cx="50" cy="12" r="3" fill="' + B.rg(RUBY) + '"/><circle cx="44" cy="26" r="2.2" fill="#1A0514"/><circle cx="56" cy="26" r="2.2" fill="#1A0514"/><path d="M44 32q6 4 12 0" stroke="#4C1D95" stroke-width="1.6" fill="none"/>',
          shd(22) + '<path d="M20 58q0-10 20-12 2-6 10-6t10 6q18 2 18 12-4 4-14 4H34q-10 0-14-4z" fill="' + B.lg(GOLD) + '" stroke="#78350F" stroke-width="1.6"/><path d="M72 54q10-2 14-10-2 8-8 12" fill="none" stroke="' + B.lg(GOLD) + '" stroke-width="3" stroke-linecap="round"/><ellipse cx="44" cy="52" rx="14" ry="5" fill="' + B.rg(['#FFF7D6', '#FBBF24', '#D97706']) + '"/><circle cx="50" cy="40" r="3" fill="' + B.lg(GOLD) + '"/>' + gl(34, 54, 8, 3, -20, 0.5),
          shd(18) + gem(B, ngon(6, 22, 26, 0, 50, 48), AMET),
          royal(B, 'A', GOLD), royal(B, 'K', AMET), royal(B, 'Q', TURQ)
        ];
      } }
  };
  Object.keys(TH).forEach(function (k) { TH[k].scat = TH[k].scat || []; });
  var ORDER = ['samurai', 'mermaid', 'carnival', 'jazzclub', 'oasis', 'arctic', 'steampunk', 'cybercity', 'fairy', 'dinopark', 'sushibar', 'disco', 'westgold', 'piratecove', 'shamrock', 'candypop', 'olympus', 'vegasneon', 'phoenix', 'buffalo', 'joker', 'bookgold', 'lotus', 'inferno', 'aztecsun', 'dragongold', 'fruitburst', 'horuseye', 'cosmicgems', 'savanna', 'valhalla', 'tigergold', 'honeypot', 'piggybank', 'atlantis', 'wizard', 'royalcrown', 'luckycat', 'wolfmoon', 'vampire', 'peacock', 'knight', 'tikigods', 'icequeen', 'caishen', 'luchador', 'fiesta', 'genie'];
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
  D6.CascSlots = { TH: TH, rowsOf: rowsOf, buildGrid: buildGrid, evalGrid: evalGrid, ORDER: ORDER, rulesFor: rulesFor }; // for tests
  if (!K) return;
  ORDER.forEach(function (k) { K.register(k, game(k), { rules: rulesFor(k) }); });
})(window.D6 = window.D6 || {});
