/* v2796 — logos redessinés façon lobby premium (voir plus bas). v2694 — CASINO : logos « planète » (propriétaire) — chaque jeu = SON objet (avion, pomme, dés…) posé sur une planète
   brillante de sa couleur, sans carré autour, comme le logo du marché dans « Défi du jour ». Dessins vectoriels, légers, fixes. */
(function (D6) {
  'use strict';
  // couleur de la planète [clair, principal] — chaque jeu a la sienne
  var PAL = {
    crash: ['#FFD1DC', '#E5334B'], jet: ['#EBD9FF', '#7C3AED'], rocket: ['#D5FAFF', '#0891B2'], mines: ['#DBEAFE', '#1D4ED8'],
    apple: ['#DCFCE7', '#15803D'], tower: ['#FFE2C6', '#C2410C'], coin: ['#FFF3B0', '#CA8A04'], dice: ['#E4DEFF', '#5B3FD0'],
    wheel: ['#FFE6EC', '#E11D74'], roulette: ['#D1FAE5', '#047857'], slots: ['#FFD9EC', '#BE185D'], plinko: ['#CCFBF1', '#0D9488'],
    limbo: ['#FFE4E6', '#BE123C'], keno: ['#E0E7FF', '#4338CA'], scratch: ['#EDE9FE', '#6D28D9'], hilo: ['#FFEDD5', '#EA580C'],
    dragon: ['#DBEAFE', '#1E40AF'], baccarat: ['#DBEAFE', '#1E3A8A'], sicbo: ['#FEE2E2', '#9F1239'], chests: ['#CFFAFE', '#0E7490'],
    balloon: ['#E0F2FE', '#0EA5E9'], penalty: ['#DCFCE7', '#15803D'], race: ['#FEE2E2', '#DC2626'], colors: ['#F3E8FF', '#9333EA'], cryptox: ['#FFEDD5', '#F7931A'], horses: ['#FEF3C7', '#B45309'], rps: ['#E0E7FF', '#6366F1'], lotto: ['#FEF3C7', '#D97706'],
    darts: ['#FEF3C7', '#B45309'], sports: ['#E0F2FE', '#0284C7'],
    g_defi: ['#FFE4E6', '#E11D48'], g_top: ['#FEF3C7', '#CA8A04'], g_bon: ['#DCFCE7', '#16A34A'], g_jauge: ['#E0F2FE', '#2563EB'], g_aff: ['#F3E8FF', '#9333EA'], g_send: ['#CCFBF1', '#0D9488']
  };
  var n = 0, RC = ' stroke-linecap="round"';
  // dégradés réutilisés (ID remplacé par un identifiant unique à chaque dessin)
  var G = {
    gold: '<radialGradient id="IDg" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#FFF6C8"/><stop offset=".5" stop-color="#F5B700"/><stop offset="1" stop-color="#9A6A00"/></radialGradient>'
  };
  function ball(cx, cy, r, c1, c2, txt) {
    var id = 'b' + (++n);
    return '<radialGradient id="' + id + '" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset=".25" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></radialGradient>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="url(#' + id + ')"/>' +
      (txt ? '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.5) + '" fill="#fff"/><text x="' + cx + '" y="' + (cy + r * 0.22) + '" text-anchor="middle" font-size="' + (r * 0.62) + '" font-weight="900" font-family="system-ui" fill="#111">' + txt + '</text>' : '');
  }
  /* v2796 — logos redessinés (qualité « lobby » des grands casinos) : dégradés riches, reflets en haut à gauche,
     ombres douces, relief 3D (dés isométriques, pièces avec tranche, cartes, jetons). Petits outils de dessin : */
  var f = function (v) { return +v.toFixed(2); };
  function st(s) { // couleurs réparties de 0 à 1 ; « #fff@.5 » = opacité
    return s.map(function (c, i) { var p = c.split('@'); return '<stop offset="' + f(i / (s.length - 1)) + '" stop-color="' + p[0] + '"' + (p[1] ? ' stop-opacity="' + p[1] + '"' : '') + '/>'; }).join('');
  }
  function lg(id, s, dir) { // v = haut→bas, h = gauche→droite, d = diagonale
    return '<linearGradient id="' + id + '" x1="0" y1="0" ' + (dir === 'h' ? 'x2="1" y2="0"' : dir === 'd' ? 'x2="1" y2="1"' : 'x2="0" y2="1"') + '>' + st(s) + '</linearGradient>';
  }
  function rg(id, s, cx, cy, r) { return '<radialGradient id="' + id + '" cx="' + (cx || '35%') + '" cy="' + (cy || '30%') + '" r="' + (r || '75%') + '">' + st(s) + '</radialGradient>'; }
  function uid() { return 'u' + (++n); }
  // étincelle à 4 branches
  function spark(x, y, s, o) {
    var q = 'Q' + x + ' ' + y + ' ';
    return '<path d="M' + x + ' ' + f(y - s) + q + f(x + s) + ' ' + y + q + x + ' ' + f(y + s) + q + f(x - s) + ' ' + y + q + x + ' ' + f(y - s) + 'Z" fill="#fff" opacity="' + (o || 1) + '"/>';
  }
  function star(cx, cy, ro, ri) {
    var d = ''; for (var i = 0; i < 10; i++) { var a = i * Math.PI / 5, r = i % 2 ? ri : ro; d += (i ? 'L' : 'M') + f(cx + r * Math.sin(a)) + ' ' + f(cy - r * Math.cos(a)); }
    return d + 'Z';
  }
  // enseignes des cartes (dessinées, pas de police), centrées sur 0,0, ~10 unités
  var SUIT = {
    h: 'M0 4.6C-6 .2-5.4-5-2.6-4.8-1.2-4.7-.3-3.8 0-2.6.3-3.8 1.2-4.7 2.6-4.8 5.4-5 6 .2 0 4.6z',
    d: 'M0-5.2L4 0 0 5.2-4 0z',
    s: 'M0-5.2C2 -2.4 5 -.6 5 1.9 5 3.9 2.6 4.6 1.1 3.1L1.9 5.4H-1.9L-1.1 3.1C-2.6 4.6-5 3.9-5 1.9-5-.6-2-2.4 0-5.2z',
    c: 'M-1 1.2C-2.4 3.4-5 3-5 .8-5-1.3-2.7-1.8-1.6-.8-2.6-2.2-1.8-5 0-5 1.8-5 2.6-2.2 1.6-.8 2.7-1.8 5-1.3 5 .8 5 3 2.4 3.4 1 1.2L1.9 5.4H-1.9z'
  };
  // carte à jouer avec relief : grand chiffre + enseigne, petit coin
  function card(x, y, rot, rank, suit, red, w, h) {
    w = w || 22; h = h || 31;
    var g = uid(), col = red ? '#DC2626' : '#111827', cx = x + w / 2;
    return '<defs>' + lg(g, ['#FFFFFF', '#F1F5F9', '#CBD5E1']) + '</defs><g transform="rotate(' + rot + ' ' + cx + ' ' + (y + h / 2) + ')">' +
      '<rect x="' + (x + .8) + '" y="' + (y + 1.6) + '" width="' + w + '" height="' + h + '" rx="3.6" fill="#000" opacity=".3"/>' +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="3.6" fill="url(#' + g + ')" stroke="#94A3B8" stroke-width=".7"/>' +
      '<text x="' + cx + '" y="' + f(y + h * .47) + '" text-anchor="middle" font-size="' + f(h * .4) + '" font-weight="900" font-family="system-ui,sans-serif" fill="' + col + '">' + rank + '</text>' +
      '<path d="' + SUIT[suit] + '" fill="' + col + '" transform="translate(' + cx + ' ' + f(y + h * .73) + ') scale(' + f(w / 18) + ')"/>' +
      '<path d="M' + (x + 2) + ' ' + (y + 3.5) + 'q0-1.5 1.5-1.5h' + (w - 7) + '" stroke="#fff" stroke-width="1.2" fill="none"' + RC + '/></g>';
  }
  // dé en 3D isométrique (3 faces visibles), c = [dessus, gauche, droite], pips = [dessus, gauche, droite]
  var PIP = { 1: [[.5, .5]], 2: [[.27, .27], [.73, .73]], 3: [[.25, .25], [.5, .5], [.75, .75]], 4: [[.27, .27], [.73, .27], [.27, .73], [.73, .73]], 5: [[.25, .25], [.75, .25], [.5, .5], [.25, .75], [.75, .75]], 6: [[.27, .22], [.73, .22], [.27, .5], [.73, .5], [.27, .78], [.73, .78]] };
  function cube(cx, cy, s, c, pips, pc, rot) {
    var a = .866 * s, h = s / 2, P = function (x, y) { return f(x) + ' ' + f(y); };
    var TL = [cx - a, cy - h], T = [cx, cy - s], TR = [cx + a, cy - h], C = [cx, cy], BL = [cx - a, cy + h], B = [cx, cy + s], BR = [cx + a, cy + h];
    var face = function (pts, fill) { return '<path d="M' + pts.map(function (p) { return P(p[0], p[1]); }).join('L') + 'Z" fill="' + fill + '" stroke="' + fill + '" stroke-width="' + f(s * .16) + '" stroke-linejoin="round"/>'; };
    var dots = function (o, u, v, k) { return '<g transform="matrix(' + [f(u[0]), f(u[1]), f(v[0]), f(v[1]), f(o[0]), f(o[1])].join(' ') + ')" fill="' + pc + '">' + PIP[k].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r=".1"/>'; }).join('') + '</g>'; };
    return '<g' + (rot ? ' transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')"' : '') + '><ellipse cx="' + cx + '" cy="' + f(cy + s * 1.05) + '" rx="' + f(a * 1.05) + '" ry="' + f(s * .22) + '" fill="#000" opacity=".3"/>' +
      face([T, TR, C, TL], c[0]) + face([TL, C, B, BL], c[1]) + face([C, TR, BR, B], c[2]) +
      '<path d="M' + P(TL[0], TL[1]) + 'L' + P(T[0], T[1]) + 'L' + P(TR[0], TR[1]) + '" stroke="#fff" stroke-opacity=".7" stroke-width="' + f(s * .07) + '" fill="none" stroke-linejoin="round"' + RC + '/>' +
      dots(TL, [a, -h], [a, h], pips[0]) + dots(TL, [a, h], [0, s], pips[1]) + dots(C, [a, -h], [0, s], pips[2]) + '</g>';
  }
  // pièce avec tranche (relief), c = [clair, principal, sombre], inner = dessin centré sur 0,0 (échelle r/13)
  function coin3(cx, cy, r, c, inner) {
    var g = uid();
    return '<defs>' + rg(g, [c[0], c[1], c[2]], '34%', '28%', '80%') + '</defs><circle cx="' + cx + '" cy="' + f(cy + r * .16) + '" r="' + r + '" fill="' + c[2] + '"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="url(#' + g + ')"/><circle cx="' + cx + '" cy="' + cy + '" r="' + f(r * .8) + '" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="' + f(r * .07) + '"/>' +
      '<g transform="translate(' + cx + ' ' + cy + ') scale(' + f(r / 13) + ')">' + inner + '</g>' +
      '<path d="M' + f(cx - r * .72) + ' ' + f(cy - r * .2) + 'A' + f(r * .75) + ' ' + f(r * .75) + ' 0 0 1 ' + f(cx + r * .1) + ' ' + f(cy - r * .74) + '" stroke="#fff" stroke-opacity=".75" stroke-width="' + f(r * .12) + '" fill="none"' + RC + '/>';
  }
  // jeton de casino (tranche + rayures)
  function chip(cx, cy, r, c, mark) {
    var g = uid();
    return '<defs>' + rg(g, [c[0], c[1], c[2]], '35%', '30%', '80%') + '</defs><circle cx="' + cx + '" cy="' + f(cy + r * .18) + '" r="' + r + '" fill="' + c[2] + '"/><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="url(#' + g + ')"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + f(r * .84) + '" fill="none" stroke="#fff" stroke-width="' + f(r * .3) + '" stroke-dasharray="' + f(r * .66) + ' ' + f(r * .66) + '"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + f(r * .56) + '" fill="#fff"/><circle cx="' + cx + '" cy="' + cy + '" r="' + f(r * .46) + '" fill="none" stroke="' + c[1] + '" stroke-width="' + f(r * .06) + '"/>' +
      (mark || '<path d="' + star(cx, cy, r * .34, r * .15) + '" fill="' + c[1] + '"/>');
  }
  var OBJ = {
    // Sky Rush : avion rouge brillant qui grimpe, hélice, traînée
    crash: function () {
      return '<defs>' + lg('IDb', ['#FFB3BE', '#F0233F', '#8F0B1E']) + lg('IDw', ['#FF7084', '#C8102E', '#7A0718'], 'd') + lg('IDc', ['#E0F7FF', '#38BDF8', '#075985']) + lg('IDt', ['#fff@0', '#fff@.85'], 'h') + G.gold + '</defs>' +
        '<path d="M1 61C12 58 20 52 27 44" stroke="url(#IDt)" stroke-width="4.5"' + RC + ' fill="none"/>' +
        '<g transform="rotate(-24 34 34)"><path d="M30 30h5.5l-4.5-13.5h-5z" fill="#7A0718"/>' +
        '<path d="M9.5 31L5.5 17.5Q5.3 15.5 7.3 15.5H11.5L21 30z" fill="url(#IDw)"/><path d="M8.5 33.5L1.5 36.5 3.5 39 15 35.5z" fill="#9B0D22"/>' +
        '<path d="M7 33.5C7 29.5 12 27.5 20 27.5H46C54 27.5 59 30 60.5 33.5 59 37 54 39.5 46 39.5H20C12 39.5 7 37.5 7 33.5z" fill="url(#IDb)" stroke="#6B0716" stroke-width=".8"/>' +
        '<path d="M9 35.6C22 36.4 44 36.4 59.4 34.8" stroke="#fff" stroke-width="2" fill="none"/><path d="M14 29.8C24 29 40 29 50 29.6" stroke="#fff" stroke-width="1.5"' + RC + ' opacity=".6" fill="none"/>' +
        '<path d="M37 28C39.5 22.5 47 22 51.5 28.6z" fill="url(#IDc)" stroke="#6B0716" stroke-width=".8"/><path d="M40.5 26.4C42 24.6 44 24.2 46 24.7" stroke="#fff" stroke-width="1.2"' + RC + ' fill="none"/>' +
        '<g fill="#FFE8A3"><circle cx="21" cy="31.8" r="1.2"/><circle cx="25.5" cy="31.8" r="1.2"/><circle cx="30" cy="31.8" r="1.2"/></g>' +
        '<path d="M26.5 36H41.5L33.5 52.5Q32.6 54 30.8 54H25z" fill="url(#IDw)" stroke="#6B0716" stroke-width=".8"/><path d="M28.5 37.5H38.5" stroke="#fff" stroke-width="1.2" opacity=".55"/>' +
        '<ellipse cx="62" cy="33.5" rx="1.8" ry="12" fill="#fff" opacity=".3"/><path d="M62 24v19" stroke="#fff" stroke-width="1.4" opacity=".7"/><circle cx="61.2" cy="33.5" r="2.6" fill="url(#IDg)"/></g>' +
        spark(14, 14, 3.2, .9);
    },
    // Mines : gros diamant à facettes + bombe
    mines: function () {
      var t = function (p, c) { return '<path d="' + p + 'z" fill="' + c + '"/>'; };
      return '<defs>' + rg('IDk', ['#6B7280', '#1F2937', '#030712']) + '</defs>' +
        '<circle cx="51" cy="48" r="10" fill="url(#IDk)"/><ellipse cx="47.5" cy="44" rx="3" ry="2" fill="#fff" opacity=".35" transform="rotate(-35 47.5 44)"/><rect x="53" y="36" width="5" height="4" rx="1" fill="#475569" transform="rotate(35 55.5 38)"/>' +
        '<path d="M57.5 36.5Q59.5 32 62 31.5" stroke="#D6B47A" stroke-width="1.6" fill="none"/>' + '<path d="' + star(61.5, 30.5, 3.4, 1.3) + '" fill="#FDE047"/>' +
        '<path d="M7 24L18 10H46L57 24 32 57z" fill="#0C4A6E"/>' +
        t('M8 24L18 11 21 24', '#BAE6FD') + t('M18 11H26L21 24', '#7DD3FC') + t('M26 11L32 24H21', '#E0F7FF') + t('M26 11H38L32 24', '#F0FBFF') + t('M38 11L43 24H32', '#BAE6FD') + t('M38 11H46L43 24', '#7DD3FC') + t('M46 11L56 24H43', '#38BDF8') +
        t('M8 24H21L32 56', '#7DD3FC') + t('M21 24H32V56', '#BAE6FD') + t('M32 24H43L32 56', '#38BDF8') + t('M43 24H56L32 56', '#0284C7') +
        '<path d="M8 24L18 11H46L56 24 32 56z" fill="none" stroke="#E0F7FF" stroke-width="1" stroke-linejoin="round"/><path d="M8 24H56" stroke="#fff" stroke-width=".8" opacity=".8"/>' +
        '<path d="M20 14.5L24 21" stroke="#fff" stroke-width="2.4"' + RC + '/>' + spark(14, 13, 4.5) + spark(41, 36, 2.6, .8);
    },
    // Penalty — v2860 (owner: logos must match the new game art): a round medallion with the redrawn keeper in his goal and the ball
    // (image rendered from the game itself: img/games/penalty.webp), glossy green ring, same 64×64 frame.
    // v3046 (propriétaire) : gardien à la peau claire, maillot rouge (ni orange, ni blanc, ni vert), anneau bleu
    penalty: function () {
      return '<defs><clipPath id="IDm"><circle cx="32" cy="33" r="26.5"/></clipPath><linearGradient id="IDg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#DBEAFE"/><stop offset=".45" stop-color="#3B82F6"/><stop offset="1" stop-color="#1E3A8A"/></linearGradient>' +
        '<linearGradient id="IDs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
        '<circle cx="32" cy="35" r="28.5" fill="#000" opacity=".38"/><circle cx="32" cy="33" r="28.5" fill="url(#IDg)"/>' +
        '<image href="img/games/penalty.webp?v=3046" x="5.5" y="6.5" width="53" height="53" clip-path="url(#IDm)" preserveAspectRatio="xMidYMid slice"/>' +
        '<circle cx="32" cy="33" r="26.5" fill="url(#IDs)"/><circle cx="32" cy="33" r="26.5" fill="none" stroke="#000" stroke-opacity=".35" stroke-width=".8"/>';
    },
    // Golden Orchard : pomme-bijou en or à facettes, cœur rubis, 2 feuilles, étincelles
    apple: function () {
      return '<defs>' + rg('IDa', ['#FFFBE0', '#FFD54A', '#E9A100', '#8A5600'], '36%', '30%', '78%') + lg('IDl', ['#BBF7D0', '#22C55E', '#14532D'], 'd') +
        rg('IDr', ['#FFC2D1', '#E11D48', '#7F1D1D'], '40%', '35%', '70%') + '</defs>' +
        '<path d="M32 19c-5-5-18-5-21 7s4 29 13.5 29c3 0 5-1.6 7.5-1.6s4.5 1.6 7.5 1.6C49 55 56 38 53 26S37 14 32 19z" fill="url(#IDa)" stroke="#7A4A00" stroke-width="1.4"/>' +
        // v2873 (propriétaire) : pomme dorée + seulement le losange rouge au centre (plus de traits blancs)
        '<path d="M32 27l6 7.5-6 8.5-6-8.5z" fill="url(#IDr)" stroke="#FFE4E6" stroke-width=".8"/>' +
        '<path d="M32 19c0-6 2-10 6.5-13" stroke="#5B3A12" stroke-width="3" fill="none"' + RC + '/>' +
        '<path d="M36 12c6-5 13-4 15-1-5 6-11 6-15 1z" fill="url(#IDl)"/><path d="M38 11.6c4-2 8-2.4 11-.8" stroke="#DCFCE7" stroke-width=".9" fill="none"/><path d="M33 13c-5-4-11-4-13-1 4 5 9 5 13 1z" fill="url(#IDl)" opacity=".85"/>' +
        '<ellipse cx="20" cy="29" rx="3.6" ry="7" fill="#fff" opacity=".75" transform="rotate(22 20 29)"/>' + spark(47, 21, 4) + spark(13, 46, 2.6, .8);
    },
    // Lucky 777 : machine à sous rouge et or, rouleaux 7-7-7, levier
    slots: function () {
      var seven = function (x) { return '<path d="M' + x + ' 28.5h10v2.8L' + (x + 4.8) + ' 42.5h-3.6l5.3-11.2H' + x + 'z" fill="#E11D48" stroke="#7F1D1D" stroke-width=".9" stroke-linejoin="round"/><path d="M' + (x + 1) + ' 29.6h7.8" stroke="#FDA4AF" stroke-width=".9"/>'; };
      var bulbs = ''; for (var i = 0; i < 7; i++) { var a = (-60 + i * 20) * Math.PI / 180; bulbs += '<circle cx="' + f(30 + 15 * Math.sin(a)) + '" cy="' + f(19 - 8.5 * Math.cos(a)) + '" r="1.3" fill="' + (i % 2 ? '#FFF7D6' : '#FB7185') + '"/>'; }
      return '<defs>' + lg('IDr', ['#FF8A9B', '#E11D48', '#7F0F2C']) + G.gold + lg('IDw', ['#8A97AB', '#FFFFFF', '#FFFFFF', '#8A97AB']) + lg('IDs', ['#F8FAFC', '#94A3B8'], 'h') + '</defs>' +
        '<path d="M51 38V19" stroke="#475569" stroke-width="4"' + RC + '/><path d="M51 38V19" stroke="url(#IDs)" stroke-width="2.6"' + RC + '/>' + ball(51, 15, 4.6, '#FB7185', '#9F1239') +
        '<path d="M9 19C11 5 49 5 51 19z" fill="url(#IDg)" stroke="#8A5600" stroke-width="1"/>' + bulbs +
        '<rect x="7" y="17" width="46" height="42" rx="7" fill="url(#IDg)"/><rect x="9" y="19" width="42" height="38" rx="5.5" fill="url(#IDr)"/>' +
        '<path d="M12 21.5h36" stroke="#fff" stroke-width="1.6" opacity=".45"' + RC + '/>' +
        '<rect x="12" y="25" width="36" height="21" rx="3.5" fill="url(#IDw)" stroke="#8A5600" stroke-width="1.4"/><path d="M24 25.5v20M36 25.5v20" stroke="#94A3B8" stroke-width="1.2"/>' +
        seven(13) + seven(25) + seven(37) + '<path d="M12 35.5h36" stroke="#F59E0B" stroke-width=".9" opacity=".7"/>' +
        '<rect x="14" y="49" width="32" height="5" rx="2.5" fill="#4C0519"/><rect x="16" y="50" width="12" height="2.6" rx="1.3" fill="url(#IDg)"/>' + spark(14, 9, 3.4);
    },
    // Oro Lotto : globe de verre, boules numérotées, socle doré
    lotto: function () {
      return '<defs>' + G.gold + rg('IDv', ['#fff@.6', '#C7D2FE@.15', '#6366F1@.45'], '38%', '30%', '75%') + lg('IDb', ['#FFE08A', '#D99A00', '#7A4A00']) + '</defs>' +
        '<ellipse cx="32" cy="60" rx="18" ry="2.6" fill="#000" opacity=".3"/><path d="M16 51h32l3.5 8h-39z" fill="url(#IDb)" stroke="#6B3F00" stroke-width="1"/><path d="M17.5 53h29" stroke="#FFF3BF" stroke-width="1" opacity=".8"/><rect x="27" y="44" width="10" height="8" fill="url(#IDb)"/>' +
        '<circle cx="32" cy="26" r="21.5" fill="url(#IDv)" stroke="#E0E7FF" stroke-width="2"/>' +
        ball(23, 35, 7, '#F87171', '#B91C1C', '7') + ball(40, 35.5, 7, '#60A5FA', '#1D4ED8', '21') + ball(31, 23, 7.6, '#FDE047', '#CA8A04', '3') + ball(43, 21, 5.4, '#4ADE80', '#15803D', '') + ball(20, 22, 4.6, '#C084FC', '#7E22CE', '') +
        '<circle cx="32" cy="26" r="21.5" fill="none" stroke="#6366F1" stroke-opacity=".5" stroke-width="1"/>' +
        '<path d="M16.5 17a17.5 17.5 0 0 1 12-9.5" stroke="#fff" stroke-width="2.8"' + RC + ' fill="none" opacity=".9"/><circle cx="47" cy="38" r="1.6" fill="#fff" opacity=".7"/>' + spark(53, 9, 3.4);
    },
    // Crypto Live : 3 pièces en relief BTC / ETH / USDT
    cryptox: function () {
      var btc = '<text x="0" y="5.6" text-anchor="middle" font-size="16" font-weight="900" font-family="system-ui,sans-serif" fill="#fff">B</text><path d="M-1.8-8v3M1.6-8v3M-1.8 5v3M1.6 5v3" stroke="#fff" stroke-width="1.7"/>';
      var eth = '<path d="M0-9L6 1 0 4.4-6 1z" fill="#fff"/><path d="M0-9V4.4L-6 1z" fill="#fff" opacity=".7"/><path d="M0 5.8L6 2.4 0 10-6 2.4z" fill="#fff"/>';
      var usdt = '<path d="M-6.5-7.5H6.5V-3.8H1.9V8.5H-1.9V-3.8H-6.5z" fill="#fff"/><ellipse cx="0" cy="-1" rx="7.5" ry="2.4" fill="none" stroke="#fff" stroke-width="1.3"/>';
      return coin3(19, 41, 13, ['#9BF0D5', '#26A17B', '#0E5640'], usdt) + coin3(45, 41, 13, ['#C9D4FF', '#627EEA', '#2F3D9C'], eth) + coin3(32, 23, 17.5, ['#FFE0B0', '#F7931A', '#A3530A'], btc) + spark(54, 12, 3.6) + spark(9, 22, 2.6, .8);
    },
    // Lucky Wheel : roue lumineuse sur pied, cadran or, ampoules, flèche
    wheel: function () {
      var c = ['#EF4444', '#F59E0B', '#22C55E', '#3B82F6', '#A855F7', '#EC4899', '#FACC15', '#14B8A6'], s = '', b = '';
      for (var i = 0; i < 8; i++) { var a0 = (i * 45 - 22.5) * Math.PI / 180, a1 = ((i + 1) * 45 - 22.5) * Math.PI / 180; s += '<path d="M32 30L' + f(32 + 20.5 * Math.sin(a0)) + ' ' + f(30 - 20.5 * Math.cos(a0)) + 'A20.5 20.5 0 0 1 ' + f(32 + 20.5 * Math.sin(a1)) + ' ' + f(30 - 20.5 * Math.cos(a1)) + 'Z" fill="' + c[i] + '" stroke="#FFF7D6" stroke-width=".9"/>'; }
      for (var j = 0; j < 16; j++) { var a = j * 22.5 * Math.PI / 180; b += '<circle cx="' + f(32 + 24 * Math.sin(a)) + '" cy="' + f(30 - 24 * Math.cos(a)) + '" r="1.5" fill="' + (j % 2 ? '#FFFBEB' : '#FDE047') + '"/>'; }
      return '<defs>' + G.gold + rg('IDh', ['#000@0', '#000@0', '#000@.35'], '50%', '50%', '50%') + lg('IDp', ['#FF8A9B', '#DC2626', '#7F1D1D']) + '</defs>' +
        '<path d="M22 50L16 61H48L42 50z" fill="url(#IDg)" stroke="#7A4A00" stroke-width="1"/><ellipse cx="32" cy="61" rx="17" ry="2.4" fill="#7A4A00"/>' +
        '<circle cx="32" cy="31.5" r="27" fill="#5B3A00" opacity=".6"/><circle cx="32" cy="30" r="27" fill="url(#IDg)"/><circle cx="32" cy="30" r="21.6" fill="#5B3A00"/>' + b + s +
        '<circle cx="32" cy="30" r="20.5" fill="url(#IDh)"/><path d="M17 22a17 17 0 0 1 11-9" stroke="#fff" stroke-width="2.2" opacity=".55" fill="none"' + RC + '/>' +
        '<circle cx="32" cy="30" r="6" fill="url(#IDg)" stroke="#7A4A00" stroke-width="1"/><circle cx="30.5" cy="28.5" r="1.8" fill="#fff" opacity=".8"/>' +
        '<path d="M32 12.5L26.5 2.5Q32 0 37.5 2.5z" fill="url(#IDp)" stroke="#FDE68A" stroke-width="1.2" stroke-linejoin="round"/>';
    },
    // Dragon Tiger : carte bleue (dragon) contre carte rouge (tigre), badge VS
    dragon: function () {
      var drg = '<path d="M-4.5-6C-6.5-10-8.5-13-12-15-8-15-5-12.5-2.5-8zM4.5-6C6.5-10 8.5-13 12-15 8-15 5-12.5 2.5-8z" fill="url(#IDg)" stroke="#7A4A00" stroke-width=".6"/>' +
        '<path d="M-8.5-4L-13.5-2-10 1-14 4-9.5 5.5-12.5 9-7 7zM8.5-4L13.5-2 10 1 14 4 9.5 5.5 12.5 9 7 7z" fill="#22C55E" stroke="#14532D" stroke-width=".5"/>' +
        '<path d="M-9-5.5C-7-10.5 7-10.5 9-5.5L7.5 3.5C6.5 9 3.5 12.5 0 12.5S-6.5 9-7.5 3.5z" fill="url(#IDd)" stroke="#5F0B0B" stroke-width=".7"/>' +
        '<path d="M-5.2 3C-5 .8 5 .8 5.2 3L4.4 8.4C3.6 11-3.6 11-4.4 8.4z" fill="#FCA5A5" opacity=".9"/><path d="M-2.6 5.2l1.2 1.2M2.6 5.2L1.4 6.4" stroke="#5F0B0B" stroke-width="1"' + RC + '/>' +
        '<path d="M-3 9.6L-2 13-1 10zM3 9.6L2 13 1 10z" fill="#fff"/>' +
        '<path d="M-6.8-2.6L-1.8-1.2-5.4.4zM6.8-2.6L1.8-1.2 5.4.4z" fill="#FDE047" stroke="#5F0B0B" stroke-width=".5"/><path d="M-4.4-1.8v1.6M4.4-1.8v1.6" stroke="#111" stroke-width=".9"/>' +
        '<path d="M-8-4.6L-1.5-2.6M8-4.6L1.5-2.6" stroke="#450A0A" stroke-width="1.5"' + RC + '/><path d="M-5 7.5C-10 7-12 10.5-14.5 8.5M5 7.5C10 7 12 10.5 14.5 8.5" stroke="#FDE047" stroke-width="1.2" fill="none"' + RC + '/>';
      var tgr = '<circle cx="-7" cy="-7" r="3.8" fill="#F97316" stroke="#7C2D12" stroke-width=".6"/><circle cx="7" cy="-7" r="3.8" fill="#F97316" stroke="#7C2D12" stroke-width=".6"/><circle cx="-7" cy="-7" r="1.9" fill="#FDA4AF"/><circle cx="7" cy="-7" r="1.9" fill="#FDA4AF"/>' +
        '<ellipse cx="0" cy="1" rx="10.5" ry="9.5" fill="url(#IDo)" stroke="#7C2D12" stroke-width=".7"/>' +
        '<path d="M0-8.3V-4.5M-3.4-7.8L-2.2-4.6M3.4-7.8L2.2-4.6M-10.4-.5H-6.6M-10 3.4H-7M10.4-.5H6.6M10 3.4H7" stroke="#1C1917" stroke-width="1.4"' + RC + '/>' +
        '<ellipse cx="-3.5" cy="5" rx="4" ry="3.1" fill="#FFF7ED"/><ellipse cx="3.5" cy="5" rx="4" ry="3.1" fill="#FFF7ED"/><ellipse cx="0" cy="8.4" rx="3" ry="1.6" fill="#FFF7ED"/>' +
        '<path d="M-2.2 2H2.2L0 4.6z" fill="#BE185D"/><ellipse cx="-4" cy="-1.4" rx="2.1" ry="1.7" fill="#A3E635"/><ellipse cx="4" cy="-1.4" rx="2.1" ry="1.7" fill="#A3E635"/><ellipse cx="-4" cy="-1.4" rx=".6" ry="1.4" fill="#111"/><ellipse cx="4" cy="-1.4" rx=".6" ry="1.4" fill="#111"/>';
      var cardBack = function (x, rot, g, fc) { return '<g transform="rotate(' + rot + ' ' + (x + 13) + ' 32)"><rect x="' + (x + 1) + '" y="14" width="26" height="38" rx="4.5" fill="#000" opacity=".35"/><rect x="' + x + '" y="12" width="26" height="38" rx="4.5" fill="url(#' + g + ')" stroke="#FCD34D" stroke-width="1.6"/>' +
        '<rect x="' + (x + 2.6) + '" y="14.6" width="20.8" height="32.8" rx="3" fill="none" stroke="#FDE68A" stroke-opacity=".5" stroke-width=".7"/><path d="M' + (x + 3) + ' 16.5q0-1.6 1.6-1.6h12" stroke="#fff" stroke-width="1.2" opacity=".5" fill="none"' + RC + '/>' +
        '<g transform="translate(' + (x + 13) + ' 30) scale(.92)">' + fc + '</g></g>'; };
      return '<defs>' + lg('IDb', ['#60A5FA', '#1D4ED8', '#172554'], 'd') + lg('IDt', ['#FB7185', '#BE123C', '#4C0519'], 'd') + lg('IDd', ['#FCA5A5', '#DC2626', '#7F1D1D']) + lg('IDo', ['#FED7AA', '#F97316', '#C2410C']) + G.gold + '</defs>' +
        cardBack(4, -12, 'IDb', drg) + cardBack(34, 12, 'IDt', tgr) +
        '<circle cx="32" cy="51.5" r="9" fill="#7A4A00"/><circle cx="32" cy="50" r="9" fill="url(#IDg)" stroke="#FFF3BF" stroke-width="1"/><circle cx="32" cy="50" r="6.8" fill="#1F0A3A"/>' +
        '<text x="32" y="53" text-anchor="middle" font-size="7.6" font-weight="900" font-family="system-ui,sans-serif" fill="#FDE047">VS</text>';
    },
    // Roulette : cylindre en bois, cases rouges / noires / 0 vert, cône doré, bille
    roulette: function () {
      var s = ''; for (var i = 0; i < 18; i++) { var a0 = i * 20 * Math.PI / 180, a1 = (i + 1) * 20 * Math.PI / 180; s += '<path d="M32 32L' + f(32 + 24 * Math.sin(a0)) + ' ' + f(32 - 24 * Math.cos(a0)) + 'A24 24 0 0 1 ' + f(32 + 24 * Math.sin(a1)) + ' ' + f(32 - 24 * Math.cos(a1)) + 'Z" fill="' + (i === 0 ? '#16A34A' : i % 2 ? '#DC2626' : '#111827') + '"/>'; }
      var sp = ''; for (var k = 0; k < 4; k++) { var a = (k * 90 + 45) * Math.PI / 180; sp += '<circle cx="' + f(32 + 7.8 * Math.sin(a)) + '" cy="' + f(32 - 7.8 * Math.cos(a)) + '" r="2" fill="url(#IDg)"/>'; }
      return '<defs>' + G.gold + rg('IDw', ['#D97706', '#92400E', '#451A03'], '40%', '35%', '70%') + rg('IDc', ['#FDE68A', '#B45309', '#5B2408'], '40%', '35%', '70%') + rg('IDh', ['#000@0', '#000@0', '#000@.25'], '50%', '50%', '50%') + '</defs>' +
        '<circle cx="32" cy="34" r="30" fill="#2A0E02" opacity=".55"/><circle cx="32" cy="32" r="30" fill="url(#IDw)"/><circle cx="32" cy="32" r="26.5" fill="none" stroke="url(#IDg)" stroke-width="2"/>' + s +
        '<circle cx="32" cy="32" r="24" fill="url(#IDh)"/><circle cx="32" cy="32" r="24" fill="none" stroke="#FDE68A" stroke-width=".8"/><circle cx="32" cy="32" r="14.5" fill="#FDE68A"/>' +
        '<circle cx="32" cy="32" r="13.5" fill="url(#IDc)"/><path d="M26.5 26.5l11 11M37.5 26.5l-11 11" stroke="url(#IDg)" stroke-width="2.6"' + RC + '/>' + sp +
        '<circle cx="32" cy="32" r="4.6" fill="url(#IDg)" stroke="#7A4A00" stroke-width=".8"/>' + ball(41.5, 13.2, 3.2, '#fff', '#94A3B8') +
        '<path d="M8 24A25 25 0 0 1 22 8" stroke="#fff" stroke-width="2"' + RC + ' fill="none" opacity=".45"/>';
    },
    // Dice : 2 dés 3D (rouge et noir, le duel)
    dice: function () {
      return cube(22, 29, 15, ['#FFA3B1', '#E11D48', '#9F1239'], [5, 3, 2], '#fff', -6) + cube(43, 38, 13.5, ['#6B7280', '#374151', '#111827'], [6, 1, 4], '#fff', 8) + spark(52, 12, 3.8) + spark(9, 50, 2.4, .7);
    },
    // Tower : tour de château crénelée, fenêtre allumée, drapeau
    tower: function () {
      var mer = 'M16 27V15.5H22.5V20H28V15.5H36V20H41.5V15.5H48V27z';
      return '<defs>' + lg('IDt', ['#FAFAF9', '#D6D3D1', '#78716C'], 'h') + lg('IDf', ['#FF8A9B', '#E11D48'], 'd') + rg('IDl', ['#FFFBEB', '#FDE047', '#F59E0B'], '50%', '60%', '70%') + '</defs>' +
        '<ellipse cx="32" cy="59.5" rx="18" ry="2.6" fill="#000" opacity=".35"/><path d="M32 16V2.5" stroke="#78350F" stroke-width="1.8"/><path d="M32 2.5H45L41.5 6.5 45 10.5H32z" fill="url(#IDf)"/>' +
        '<path d="M19.5 59V27H44.5V59z" fill="url(#IDt)" stroke="#57534E" stroke-width=".8"/><path d="' + mer + '" fill="url(#IDt)" stroke="#57534E" stroke-width=".8" stroke-linejoin="round"/>' +
        '<path d="M16 27H48" stroke="#57534E" stroke-width="1.6"/><g stroke="#78716C" stroke-width=".8" opacity=".55"><path d="M20 35h24M20 43h24M20 51h24M27 27v8M37 35v8M27 43v8M37 51v8M24 15.5v4.5M44 15.5v4.5"/></g>' +
        '<path d="M26 59V50.5a6 6 0 0 1 12 0V59z" fill="#5B3A1A" stroke="#3B2410" stroke-width=".8"/><path d="M32 45v14" stroke="#3B2410" stroke-width=".8"/><circle cx="34.5" cy="53.5" r=".9" fill="#FDE047"/>' +
        '<path d="M28.5 38V32.5a3.5 3.5 0 0 1 7 0V38z" fill="url(#IDl)" stroke="#57534E" stroke-width=".8"/><path d="M21 28.5V57" stroke="#fff" stroke-width="1.4" opacity=".6"/>' + spark(52, 20, 3.4) + spark(11, 40, 2.4, .7);
    },
    // Baccarat : 9 + K et jeton vert
    baccarat: function () {
      return card(6, 10, -13, '9', 'd', true, 23, 33) + card(25, 9, 7, 'K', 'c', false, 23, 33) + chip(47, 48, 11.5, ['#4ADE80', '#16A34A', '#0B4D24']) + spark(54, 12, 3.4);
    },
    // Target : cible en relief + flèche plantée au centre
    limbo: function () {
      return '<defs>' + rg('IDr', ['#FF8A8A', '#DC2626', '#8F1111'], '40%', '35%', '75%') + lg('IDw', ['#FFFFFF', '#E5E7EB']) + lg('IDs', ['#94A3B8', '#F8FAFC', '#475569'], 'h') + G.gold + '</defs>' +
        '<circle cx="28" cy="39" r="24.5" fill="#5F0B0B"/><circle cx="28" cy="36" r="24.5" fill="url(#IDr)"/><circle cx="28" cy="36" r="19" fill="url(#IDw)"/><circle cx="28" cy="36" r="14" fill="url(#IDr)"/><circle cx="28" cy="36" r="9" fill="url(#IDw)"/><circle cx="28" cy="36" r="4.6" fill="url(#IDr)"/>' +
        '<path d="M8.5 29A20.5 20.5 0 0 1 21 15.5" stroke="#fff" stroke-width="2.4"' + RC + ' fill="none" opacity=".6"/>' +
        '<path d="M29 35L52 12" stroke="#1F2937" stroke-width="3.2"' + RC + '/><path d="M29.5 34L51.5 12" stroke="#CBD5E1" stroke-width="1"' + RC + '/>' +
        '<path d="M50 14L52.5 4 56.5 8.5z" fill="url(#IDg)" stroke="#8A5600" stroke-width=".6"/><path d="M50 14L60 11.5 55.5 7.5z" fill="#E11D48" stroke="#7F1D1D" stroke-width=".6"/>' +
        '<g stroke="#FDE047" stroke-width="1.6"' + RC + '><path d="M22 27l-2.5-3M20 35h-4M23 43l-2.5 3"/></g>' + spark(58, 26, 3);
    },
    // Coin Flip : grosse pièce d'or en relief (étoile) + pièce d'argent qui tourne
    coin: function () {
      return '<defs>' + rg('IDs', ['#FFFFFF', '#CBD5E1', '#64748B'], '35%', '30%', '80%') + '</defs>' +
        '<g transform="rotate(20 46 19)"><ellipse cx="47.8" cy="20" rx="10" ry="13.5" fill="#475569"/><ellipse cx="46" cy="19" rx="10" ry="13.5" fill="url(#IDs)"/><ellipse cx="46" cy="19" rx="7.4" ry="10.4" fill="none" stroke="#64748B" stroke-width="1.2" opacity=".7"/><path d="M39.5 14c1-3.5 3-6 5.5-7" stroke="#fff" stroke-width="1.6"' + RC + ' fill="none"/></g>' +
        '<path d="M34 5C38 1.5 44 .8 49 2.4M60 24c2.5 3 3 7 2 10" stroke="#fff" stroke-width="1.4" fill="none"' + RC + ' opacity=".55"/>' +
        coin3(27, 37, 22, ['#FFF6C8', '#F5B700', '#8A5600'], '<path d="' + star(0, .4, 8.4, 3.6) + '" fill="#C98A00"/><path d="' + star(0, -.4, 8.4, 3.6) + '" fill="#FFE27A" stroke="#B07800" stroke-width=".5"/>') + spark(10, 14, 3.6);
    },
    // Jet Man : héros à réacteurs dorsaux, casque à visière, flammes
    jet: function () {
      return '<defs>' + lg('IDs', ['#7C5CFF', '#6D28D9', '#3B0D8C'], 'd') + lg('IDm', ['#FFFFFF', '#CBD5E1', '#64748B'], 'h') + lg('IDv', ['#A5F3FC', '#0EA5E9', '#0C2A5B'], 'd') + lg('IDf', ['#FFF7D6', '#FDE047', '#F97316', '#DC2626@0']) + G.gold + '</defs>' +
        '<g transform="rotate(-14 32 34)"><path d="M14 45C13 52 16 58 19.5 63 23 58 26 52 25 45zM39 45C38 52 41 58 44.5 63 48 58 51 52 50 45z" fill="url(#IDf)"/>' +
        '<rect x="13" y="22" width="12" height="25" rx="6" fill="url(#IDm)" stroke="#475569" stroke-width=".8"/><rect x="39" y="22" width="12" height="25" rx="6" fill="url(#IDm)" stroke="#475569" stroke-width=".8"/>' +
        '<rect x="14.5" y="43" width="9" height="4" rx="1.5" fill="#334155"/><rect x="40.5" y="43" width="9" height="4" rx="1.5" fill="#334155"/><path d="M16 25v14M42 25v14" stroke="#fff" stroke-width="1.6"' + RC + ' opacity=".8"/>' +
        '<rect x="23" y="44" width="7.5" height="13" rx="3.7" fill="#4C1D95"/><rect x="33.5" y="44" width="7.5" height="13" rx="3.7" fill="#3B0D8C"/>' +
        '<rect x="20.5" y="25" width="23" height="23" rx="9" fill="url(#IDs)" stroke="#2E0B6B" stroke-width=".8"/><rect x="21" y="42" width="22" height="3.2" fill="url(#IDg)"/>' +
        '<path d="' + star(32, 34, 4.4, 1.9) + '" fill="url(#IDg)"/><path d="M24 29c2-1.8 5-2.5 8-2.5" stroke="#fff" stroke-width="1.6" opacity=".45" fill="none"' + RC + '/>' +
        '<circle cx="32" cy="15.5" r="11.5" fill="url(#IDm)" stroke="#475569" stroke-width=".8"/><rect x="23.5" y="10" width="17" height="11" rx="5.5" fill="url(#IDv)" stroke="#1E293B" stroke-width="1"/>' +
        '<path d="M26 14c1.2-1.6 3-2.2 5-2.2" stroke="#fff" stroke-width="1.6"' + RC + ' fill="none"/><circle cx="36.5" cy="18" r="1" fill="#fff" opacity=".7"/></g>' + spark(55, 10, 3.4) + spark(8, 22, 2.4, .7);
    },
    // Horse Race : tête de cheval de course (bride dorée, liste blanche)
    horses: function () {
      return '<defs>' + lg('IDh', ['#E8A465', '#B45309', '#5B2408'], 'd') + lg('IDm', ['#7C2D12', '#1C1917'], 'h') + G.gold + '</defs>' +
        '<path d="M18 61C16 48 18 35 24 25 26 19 28 14.5 30 11L31.5 3.5 35.5 11C40 13 46 19.5 52 29 55.5 34.5 56.5 38 54 41.5 52 44 48.5 44.5 45 42.5 42.5 41 40.5 40.5 38.5 41.5 36.5 46 38.5 53 41 61z" fill="url(#IDh)" stroke="#431407" stroke-width="1"/>' +
        '<path d="M26 7.5L27 3.5 30.5 11z" fill="#7C2D12"/>' +
        '<path d="M30.5 10C22 14 16 24 14 34 12.5 43 13.5 52 15.5 61H20.5C18.5 50 19.5 37 25 25.5 27 20 29 15 31.5 11.5z" fill="url(#IDm)"/><path d="M30.5 10C27 14 26 18 27.5 21" stroke="#1C1917" stroke-width="3" fill="none"' + RC + '/>' +
        '<path d="M36.5 14C41 17 45.5 22.5 49.5 30 51 33 51.5 35.5 50.5 37 48 34 45 27 40 20z" fill="#fff" opacity=".92"/>' +
        '<ellipse cx="38.5" cy="22.5" rx="2.4" ry="2" fill="#1C1917"/><circle cx="37.8" cy="21.8" r=".7" fill="#fff"/><ellipse cx="51.5" cy="38.5" rx="1.5" ry="1" fill="#2A0E02" transform="rotate(30 51.5 38.5)"/>' +
        '<path d="M34 30C39 30 45 34 47.5 39M47.5 39L38 43" stroke="url(#IDg)" stroke-width="2" fill="none"' + RC + '/><path d="M31 18.5C35 25 36 30 34 30" stroke="url(#IDg)" stroke-width="2" fill="none"/><circle cx="34" cy="30" r="2.2" fill="url(#IDg)"/>' +
        '<path d="M22 32C23 27 25 23 27 20" stroke="#FDE68A" stroke-width="1.4" opacity=".5" fill="none"' + RC + '/>' + spark(10, 14, 3.4) + spark(55, 54, 2.8, .8);
    },
    // Balloon : ballon gonflé brillant, nœud, ficelle
    balloon: function () {
      return '<defs>' + rg('IDb', ['#FFF1E6', '#FB923C', '#EA580C', '#7C2D12'], '34%', '28%', '80%') + '</defs>' +
        '<path d="M32 4c11.5 0 20 8.8 20 20.2C52 38 41 47 32 49 23 47 12 38 12 24.2 12 12.8 20.5 4 32 4z" fill="url(#IDb)"/>' +
        '<path d="M32 4c-5 6-6.5 31 0 45M32 4c5 6 6.5 31 0 45" stroke="#9A3412" stroke-width=".8" opacity=".3" fill="none"/>' +
        '<path d="M19.5 15.5c2.6-5.4 7-8.4 11.4-8.4" stroke="#fff" stroke-width="3.6"' + RC + ' opacity=".85" fill="none"/><ellipse cx="19.5" cy="24" rx="2.3" ry="4.6" fill="#fff" opacity=".5"/>' +
        '<path d="M28.5 49.5l3.5 4.5 3.5-4.5z" fill="#C2410C"/><path d="M32 54c-3 3 3 5 0 8s2 3 1 4" stroke="#fff" stroke-width="1.4" fill="none"' + RC + ' opacity=".9"/>' + spark(51, 8, 3.6) + spark(11, 44, 2.4, .7);
    },
    // Sic Bo : 3 dés 3D sous une cloche de verre, plateau doré
    sicbo: function () {
      return '<defs>' + G.gold + lg('IDf', ['#10B981', '#065F46']) + rg('IDv', ['#fff@.35', '#BAE6FD@.1', '#7DD3FC@.35'], '40%', '30%', '75%') + '</defs>' +
        '<path d="M6 47h52l-5 10H11z" fill="url(#IDg)" stroke="#7A4A00" stroke-width="1"/><ellipse cx="32" cy="47" rx="26" ry="5.5" fill="#8A5600"/><ellipse cx="32" cy="45.8" rx="22.5" ry="4.2" fill="url(#IDf)"/>' +
        cube(32, 33, 6.4, ['#FFFFFF', '#E2E8F0', '#94A3B8'], [1, 2, 3], '#DC2626') + cube(21.5, 38.5, 6.4, ['#FFFFFF', '#E2E8F0', '#94A3B8'], [4, 5, 6], '#1F2937', -8) + cube(42.5, 38.5, 6.4, ['#FFFFFF', '#E2E8F0', '#94A3B8'], [6, 3, 2], '#1F2937', 8) +
        '<path d="M10 46C10 25 19 11 32 11S54 25 54 46" fill="url(#IDv)" stroke="#E0F2FE" stroke-width="1.6"/><path d="M17 35c1-10 6-17 12-19.5" stroke="#fff" stroke-width="2.6" opacity=".75" fill="none"' + RC + '/>' +
        '<circle cx="32" cy="9" r="3.6" fill="url(#IDg)" stroke="#7A4A00" stroke-width=".8"/>' + spark(53, 14, 3.2);
    },
    // Racing : monoplace rouge de profil, pilote, ailerons, traits de vitesse
    race: function () {
      var wh = function (x, r) { return '<circle cx="' + x + '" cy="45" r="' + r + '" fill="#111827"/><circle cx="' + x + '" cy="45" r="' + f(r * .55) + '" fill="url(#IDm)"/><circle cx="' + x + '" cy="45" r="' + f(r * .18) + '" fill="#334155"/><path d="M' + f(x - r * .7) + ' ' + f(45 - r * .45) + 'a' + r + ' ' + r + ' 0 0 1 ' + f(r * .9) + ' ' + f(-r * .5) + '" stroke="#fff" stroke-width="1" opacity=".5" fill="none"/>'; };
      return '<defs>' + lg('IDr', ['#FF8A9B', '#E11D48', '#7F0F2C']) + lg('IDm', ['#F8FAFC', '#94A3B8']) + G.gold + '</defs>' +
        '<g stroke="#fff"' + RC + ' opacity=".75"><path d="M1 30h9M3 37h7" stroke-width="2.2"/><path d="M2 44h5" stroke-width="1.6"/></g>' +
        '<ellipse cx="33" cy="52" rx="28" ry="2.6" fill="#000" opacity=".35"/>' +
        '<path d="M9 21h10v4H9z" fill="#1F2937"/><path d="M13 25v8" stroke="#1F2937" stroke-width="2.6"/>' +
        '<path d="M8 43V34.5L21 32 27 28.5C30.5 26.5 36 26.5 38.5 29.5L42.5 33.5 57.5 36.5C61 37.3 62.5 40 61 43z" fill="url(#IDr)" stroke="#5F0B1E" stroke-width=".9" stroke-linejoin="round"/>' +
        '<path d="M14 35.5L24 33.5M42 35.5L56 38.2" stroke="#fff" stroke-width="1.4" opacity=".6"' + RC + '/><path d="M8 40.5H60.5" stroke="#FDE047" stroke-width="1.6"/>' +
        '<circle cx="32.5" cy="28" r="4.4" fill="url(#IDg)" stroke="#7A4A00" stroke-width=".7"/><path d="M33 26.5h4.2v2.6H33z" fill="#0F172A"/>' +
        '<path d="M53 43.5h9.5v2.5H52z" fill="#1F2937"/>' + wh(17, 7.5) + wh(50, 6.5) +
        '<circle cx="29" cy="37.6" r="3.3" fill="#fff"/><text x="29" y="39.6" text-anchor="middle" font-size="5.2" font-weight="900" font-family="system-ui,sans-serif" fill="#111">1</text>' + spark(54, 18, 3.4);
    },
    // Scratch Card : ticket violet et or, zone argent à moitié grattée (étoiles), pièce grattoir
    scratch: function () {
      return '<defs>' + lg('IDp', ['#B39BFF', '#7C3AED', '#3B0D8C'], 'd') + lg('IDs', ['#F8FAFC', '#CBD5E1', '#94A3B8']) + lg('IDy', ['#FFFBEB', '#FDE68A']) + G.gold + '</defs>' +
        '<g transform="rotate(-9 30 32)"><rect x="5" y="15" width="51" height="37" rx="5" fill="#2E0B6B"/><rect x="4" y="12" width="51" height="37" rx="5" fill="url(#IDp)" stroke="#FCD34D" stroke-width="1.4"/>' +
        '<rect x="9" y="15.5" width="41" height="5" rx="2.5" fill="url(#IDg)"/><path d="M11 17h18" stroke="#fff" stroke-width="1" opacity=".6"/>' +
        '<rect x="9" y="24" width="41" height="20" rx="3" fill="url(#IDs)"/><path d="M10.5 25.5h18c3 0 3.5 4 .5 5 3.5.5 3.5 5 0 5.6 3 .6 3 5.5-1 6.4H10.5z" fill="url(#IDy)"/>' +
        '<path d="' + star(16, 34, 5, 2.2) + '" fill="url(#IDg)" stroke="#A16207" stroke-width=".5"/><path d="' + star(26, 34, 5, 2.2) + '" fill="url(#IDg)" stroke="#A16207" stroke-width=".5"/>' +
        '<g fill="#94A3B8"><circle cx="34" cy="28" r=".9"/><circle cx="33" cy="40" r=".7"/><circle cx="36" cy="34" r=".6"/></g><path d="M38 28h9M38 34h9M38 40h9" stroke="#fff" stroke-width="1.4" opacity=".55"' + RC + '/></g>' +
        coin3(51, 48, 9.5, ['#FFF6C8', '#F5B700', '#8A5600'], '<text x="0" y="5.2" text-anchor="middle" font-size="15" font-weight="900" font-family="system-ui,sans-serif" fill="#A16207">$</text>') + spark(55, 9, 3.4);
    },
    // Hi-Lo : A♠ et K♥ + flèche verte (plus haut) et rouge (plus bas)
    hilo: function () {
      return '<defs>' + lg('IDu', ['#86EFAC', '#16A34A']) + lg('IDd', ['#FCA5A5', '#DC2626']) + '</defs>' + card(12, 15, -11, 'A', 's', false, 21, 31) + card(30, 15, 11, 'K', 'h', true, 21, 31) +
        '<path d="M53.5 4.5L62 15H57.5V25H49.5V15H45z" fill="url(#IDu)" stroke="#14532D" stroke-width="1.1" stroke-linejoin="round"/><path d="M53.5 7.5L58 13" stroke="#fff" stroke-width="1.2" opacity=".7"' + RC + '/>' +
        '<path d="M10.5 60L2 49.5H6.5V39.5H14.5V49.5H19z" fill="url(#IDd)" stroke="#7F1D1D" stroke-width="1.1" stroke-linejoin="round"/><path d="M8 41.5v7" stroke="#fff" stroke-width="1.2" opacity=".6"' + RC + '/>';
    },
    // Rocket : fusée argent, nez rouge, hublot doré, flamme
    rocket: function () {
      return '<defs>' + lg('IDs', ['#FFFFFF', '#E2E8F0', '#94A3B8', '#64748B'], 'h') + lg('IDr', ['#FF8A9B', '#E11D48', '#7F0F2C'], 'h') + lg('IDf', ['#FFF7D6', '#FDE047', '#F97316', '#DC2626@0']) + rg('IDw', ['#E0F7FF', '#38BDF8', '#0C4A6E']) + G.gold + '</defs>' +
        '<g transform="rotate(38 32 32)"><path d="M24.5 46C24 54 28 60 32 65 36 60 40 54 39.5 46z" fill="url(#IDf)"/><path d="M28.5 46c0 5 1.6 8.5 3.5 11.5 1.9-3 3.5-6.5 3.5-11.5z" fill="#FFFBEB"/>' +
        '<path d="M21 32L12 46Q11 50 14.5 49L22 45.5zM43 32L52 46Q53 50 49.5 49L42 45.5z" fill="url(#IDr)" stroke="#5F0B1E" stroke-width=".8"/>' +
        '<path d="M32 3C42 10 45 21 45 33V45.5H19V33C19 21 22 10 32 3z" fill="url(#IDs)" stroke="#475569" stroke-width=".8"/>' +
        '<path d="M32 3C37.5 7 41 12 43 18H21C23 12 26.5 7 32 3z" fill="url(#IDr)" stroke="#5F0B1E" stroke-width=".8"/>' +
        '<path d="M23.5 46H40.5L38.5 50.5H25.5z" fill="#334155"/><rect x="19" y="40" width="26" height="3" fill="#94A3B8" opacity=".7"/><path d="M30.5 44.5H33.5V54H30.5z" fill="#9F1239"/>' +
        '<circle cx="32" cy="28" r="7" fill="url(#IDg)" stroke="#7A4A00" stroke-width=".8"/><circle cx="32" cy="28" r="5" fill="url(#IDw)"/><path d="M29.2 26.5a3.4 3.4 0 0 1 3-2.6" stroke="#fff" stroke-width="1.4"' + RC + ' fill="none"/>' +
        '<path d="M24.5 20C24 27 24 34 24.5 40" stroke="#fff" stroke-width="2"' + RC + ' opacity=".85"/></g>' + spark(12, 12, 3.6) + spark(56, 50, 2.6, .8);
    },
    // Treasure : coffre ouvert, lumière dorée, pièces et pierres
    chests: function () {
      return '<defs>' + lg('IDl', ['#C2410C', '#7C2D12']) + lg('IDb', ['#D9661B', '#92400E', '#4A1D06']) + G.gold + rg('IDo', ['#FFF7D6@.95', '#FDE047@.6', '#F59E0B@0'], '50%', '60%', '55%') + '</defs>' +
        '<path d="M9 30L12.5 11C13 8.5 15 7 17.5 7H46.5C49 7 51 8.5 51.5 11L55 30z" fill="url(#IDl)" stroke="#431407" stroke-width=".9"/><path d="M14 28L16.5 12.5H47.5L50 28z" fill="#2A0E02"/>' +
        '<path d="M12.5 11L9 30M51.5 11L55 30M31 7v5.5M33 7v5.5" stroke="url(#IDg)" stroke-width="3"/>' +
        '<ellipse cx="32" cy="27" rx="27" ry="17" fill="url(#IDo)"/>' +
        ball(20, 29, 5.6, '#FFE27A', '#B07800') + ball(44, 29, 5.6, '#FFE27A', '#B07800') + ball(27.5, 25.5, 6.2, '#FFE27A', '#B07800') + ball(37, 25, 6.2, '#FFE27A', '#B07800') +
        '<path d="M30 19.5l3.5-4.5 3.5 4.5-3.5 5z" fill="#38BDF8" stroke="#E0F7FF" stroke-width=".7"/><path d="M21 22.5l2.6-3.4 2.6 3.4-2.6 3.8z" fill="#E11D48" stroke="#FFE4E6" stroke-width=".7"/>' +
        '<path d="M7.5 31H56.5V53C56.5 56 54.5 58 51.5 58H12.5C9.5 58 7.5 56 7.5 53z" fill="url(#IDb)" stroke="#431407" stroke-width=".9"/>' +
        '<path d="M8 41.5H56M8 49.5H56" stroke="#4A1D06" stroke-width=".8" opacity=".6"/><rect x="7.5" y="31" width="49" height="5" fill="url(#IDg)"/><path d="M14 36V58M50 36V58" stroke="url(#IDg)" stroke-width="3.6"/>' +
        '<rect x="26.5" y="33" width="11" height="12" rx="2.4" fill="url(#IDg)" stroke="#7A4A00" stroke-width=".8"/><path d="M32 37.2a1.7 1.7 0 1 0 .01 0zM31.2 38.5h1.6l.6 4h-2.8z" fill="#2A0E02"/>' +
        '<path d="M10 33.5H25" stroke="#fff" stroke-width="1" opacity=".6"/>' + spark(52, 15, 3.6) + spark(12, 18, 2.6, .9) + spark(33, 10, 2.2, .8);
    },
    // cascade : pyramide de clous, bille rose, cases en bas
    plinko: function () {
      var p = ''; for (var r = 0; r < 5; r++) for (var c = 0; c <= r; c++) p += '<circle cx="' + (32 + (c - r / 2) * 9) + '" cy="' + (12 + r * 8) + '" r="2" fill="#E0E7FF"/>';
      var bins = ['#EF4444', '#F97316', '#FACC15', '#84CC16', '#FACC15', '#F97316', '#EF4444'].map(function (col, i) { return '<rect x="' + (2.5 + i * 8.5) + '" y="52" width="7.5" height="7" rx="2" fill="' + col + '"/>'; }).join('');
      return '<path d="M32 4L60 50H4z" fill="#134E4A" opacity=".55"/>' + p + bins + ball(36.5, 24, 5, '#FF7AB6', '#BE185D');
    },
    // cible + fléchette
    // boules de loterie numérotées
    keno: function () {
      return ball(20, 40, 13, '#F87171', '#B91C1C', '7') + ball(44, 40, 13, '#60A5FA', '#1D4ED8', '21') + ball(32, 21, 13, '#FDE047', '#CA8A04', '3');
    },
    // ticket à gratter doré, zone argent grattée, pièce
    // 3 boules : vert, rouge, violet
    colors: function () {
      return ball(20, 40, 13, '#4ADE80', '#15803D') + ball(44, 40, 13, '#F87171', '#B91C1C') + ball(32, 21, 13, '#C084FC', '#6D28D9');
    },
    // cible de fléchettes + fléchette plantée
    darts: function () {
      var s = ''; for (var i = 0; i < 20; i++) { var a0 = (i * 18 - 9) * Math.PI / 180, a1 = (i * 18 + 9) * Math.PI / 180; s += '<path d="M30 34L' + (30 + 24 * Math.sin(a0)).toFixed(2) + ' ' + (34 - 24 * Math.cos(a0)).toFixed(2) + 'A24 24 0 0 1 ' + (30 + 24 * Math.sin(a1)).toFixed(2) + ' ' + (34 - 24 * Math.cos(a1)).toFixed(2) + 'Z" fill="' + (i % 2 ? '#F5F5DC' : '#111827') + '"/>'; }
      return '<circle cx="30" cy="34" r="28" fill="#1F2937"/>' + s + '<circle cx="30" cy="34" r="24" fill="none" stroke="#DC2626" stroke-width="2.6" stroke-dasharray="7.5 7.5"/><circle cx="30" cy="34" r="15" fill="none" stroke="#16A34A" stroke-width="2.4" stroke-dasharray="4.7 4.7"/>' +
        '<circle cx="30" cy="34" r="4.5" fill="#16A34A"/><circle cx="30" cy="34" r="2" fill="#DC2626"/><path d="M31 33l18-18" stroke="#94A3B8" stroke-width="2.4"' + RC + '/><path d="M47 13l3-9 4 6 6 2-7 5z" fill="#F59E0B"/><path d="M49 15l7-7" stroke="#fff" stroke-width="1" opacity=".7"/>';
    },
    // Cadeaux : défi (cible + flamme)
    g_defi: function () {
      return '<rect x="8" y="12" width="48" height="44" rx="7" fill="#fff"/><rect x="8" y="12" width="48" height="14" rx="7" fill="#E11D48"/><rect x="8" y="20" width="48" height="6" fill="#E11D48"/>' +
        '<rect x="18" y="6" width="5" height="12" rx="2.5" fill="#9F1239"/><rect x="41" y="6" width="5" height="12" rx="2.5" fill="#9F1239"/>' +
        '' +
        '<g fill="#22C55E"><circle cx="16" cy="40" r="4"/><circle cx="24" cy="40" r="4"/><circle cx="32" cy="40" r="4"/><circle cx="40" cy="40" r="4"/><circle cx="48" cy="40" r="4"/></g>' +
        '<path d="M14 40l1.6 1.6 3-3M22 40l1.6 1.6 3-3M30 40l1.6 1.6 3-3M38 40l1.6 1.6 3-3M46 40l1.6 1.6 3-3" stroke="#fff" stroke-width="1.4" fill="none"' + RC + '/><text x="32" y="53" text-anchor="middle" font-size="6.5" font-weight="900" font-family="system-ui" fill="#9F1239">5 ×</text>';
    },
    // Cadeaux : tournoi (coupe d'or)
    g_top: function () {
      return '<defs>' + G.gold + '</defs><path d="M14 12h-8v6c0 8 6 13 12 13M50 12h8v6c0 8-6 13-12 13" fill="none" stroke="#CA8A04" stroke-width="4"/><path d="M16 8h32v12c0 10-7 18-16 18S16 30 16 20z" fill="url(#IDg)"/>' +
        '<rect x="28" y="38" width="8" height="8" fill="#CA8A04"/><rect x="20" y="46" width="24" height="8" rx="2" fill="url(#IDg)"/><rect x="16" y="54" width="32" height="5" rx="2" fill="#92400E"/><path d="M32 14l2.4 5 5.4.6-4 3.6 1.1 5.3L32 25.8l-4.9 2.7 1.1-5.3-4-3.6 5.4-.6z" fill="#fff" opacity=".9"/><path d="M20 12v8" stroke="#fff" stroke-width="2.4" opacity=".6"' + RC + '/>';
    },
    // Cadeaux : bonus dépôt (paquet cadeau + %)
    g_bon: function () {
      return '<rect x="10" y="26" width="44" height="30" rx="4" fill="#22C55E"/><rect x="7" y="18" width="50" height="11" rx="3" fill="#16A34A"/><rect x="28" y="18" width="8" height="38" fill="#FDE047"/><path d="M32 18c-6-10-17-10-15-3 1 4 9 4 15 3zM32 18c6-10 17-10 15-3-1 4-9 4-15 3z" fill="#FDE047" stroke="#CA8A04" stroke-width="1.4"/>' +
        '<circle cx="48" cy="44" r="11" fill="#fff"/><text x="48" y="48.5" text-anchor="middle" font-size="12" font-weight="900" font-family="system-ui" fill="#16A34A">%</text><rect x="12" y="28" width="14" height="4" rx="2" fill="#fff" opacity=".3"/>';
    },
    // Cadeaux : grande jauge (cadran coloré + aiguille)
    g_jauge: function () {
      return '<path d="M8 44a24 24 0 0 1 48 0" fill="none" stroke="#1E293B" stroke-width="12"' + RC + '/><path d="M8 44a24 24 0 0 1 12-20.8" fill="none" stroke="#22C55E" stroke-width="8"' + RC + '/><path d="M22 22.4a24 24 0 0 1 20 0" fill="none" stroke="#FACC15" stroke-width="8"/><path d="M44 23.2A24 24 0 0 1 56 44" fill="none" stroke="#EF4444" stroke-width="8"' + RC + '/>' +
        '<path d="M32 44L47 27" stroke="#fff" stroke-width="3.4"' + RC + '/><circle cx="32" cy="44" r="5" fill="#fff"/><rect x="18" y="50" width="28" height="9" rx="4.5" fill="#2563EB"/><path d="M30 53.5h4" stroke="#fff" stroke-width="2"' + RC + '/>';
    },
    // Cadeaux : invitation (enveloppe + pièces)
    g_aff: function () { // v2759 (propriétaire) : deux amis + un « + » (plus de pièces ni de dollars)
      return '<defs>' + G.gold + '<linearGradient id="IDp1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A78BFA"/><stop offset="1" stop-color="#7C3AED"/></linearGradient><linearGradient id="IDp2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F9A8D4"/><stop offset="1" stop-color="#DB2777"/></linearGradient></defs>' +
        '<circle cx="41" cy="20" r="7.5" fill="url(#IDp2)"/><path d="M27 48c0-8.6 6.3-15 14-15s14 6.4 14 15z" fill="url(#IDp2)"/>' +
        '<circle cx="25" cy="25" r="9" fill="url(#IDp1)" stroke="#1E1B3A" stroke-opacity=".25" stroke-width="1.5"/><path d="M8 56c0-10 7.6-17.5 17-17.5S42 46 42 56z" fill="url(#IDp1)" stroke="#1E1B3A" stroke-opacity=".25" stroke-width="1.5"/>' +
        '<circle cx="21.5" cy="21.5" r="2.6" fill="#fff" opacity=".4"/>' +
        '<circle cx="49" cy="47" r="11.5" fill="#9A6A00"/><circle cx="49" cy="45.5" r="11.5" fill="url(#IDg)" stroke="#fff" stroke-width="1.6"/><circle cx="49" cy="45.5" r="8" fill="none" stroke="#9A6A00" stroke-width="1.2" opacity=".6"/><text x="49" y="50" text-anchor="middle" font-size="12" font-weight="900" font-family="system-ui" fill="#7C4A00">$</text>' +
        '<circle cx="56" cy="33.5" r="5.6" fill="#22C55E" stroke="#fff" stroke-width="1.6"/><path d="M56 30.8v5.4M53.3 33.5h5.4" stroke="#fff" stroke-width="2"' + RC + '/>';
    },

    // Envoyer de l'argent (logo du transfert : deux flèches qui s'échangent + billet)
    g_send: function () {
      return '<rect x="8" y="18" width="40" height="26" rx="5" fill="#10B981"/><rect x="12" y="22" width="32" height="18" rx="3" fill="none" stroke="#D1FAE5" stroke-width="1.6"/><circle cx="28" cy="31" r="6" fill="#D1FAE5"/><text x="28" y="34.4" text-anchor="middle" font-size="9" font-weight="900" font-family="system-ui" fill="#047857">$</text>' +
        '<circle cx="46" cy="44" r="13" fill="#fff"/><path d="M40 41h11l-3-3M52 47H41l3 3" fill="none" stroke="#0D9488" stroke-width="2.6"' + RC + ' stroke-linejoin="round"/>';
    },
    // v2696 — vrai ballon de foot (onglet Paris sportifs) : sphère brillante, pentagone central, pentagones coupés au bord, coutures
    sports: function () {
      var pent = function (cx, cy, r, rot) { var p = ''; for (var i = 0; i < 5; i++) { var an = (rot + i * 72) * Math.PI / 180; p += (i ? 'L' : 'M') + (cx + r * Math.sin(an)).toFixed(2) + ' ' + (cy - r * Math.cos(an)).toFixed(2); } return p + 'Z'; };
      var outer = '', seams = '';
      for (var i = 0; i < 5; i++) {
        var an = (i * 72) * Math.PI / 180;
        outer += '<path d="' + pent(32 + 19.5 * Math.sin(an), 32 - 19.5 * Math.cos(an), 6.6, i * 72 + 36) + '" fill="#111827"/>';
        seams += '<path d="M' + (32 + 7.8 * Math.sin(an)).toFixed(2) + ' ' + (32 - 7.8 * Math.cos(an)).toFixed(2) + 'L' + (32 + 13.4 * Math.sin(an)).toFixed(2) + ' ' + (32 - 13.4 * Math.cos(an)).toFixed(2) + '" stroke="#334155" stroke-width="1.3"/>';
      }
      return '<radialGradient id="IDf" cx="36%" cy="30%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset=".7" stop-color="#E2E8F0"/><stop offset="1" stop-color="#94A3B8"/></radialGradient><clipPath id="IDc"><circle cx="32" cy="32" r="24"/></clipPath>' +
        '<circle cx="32" cy="34" r="24" fill="#000" opacity=".25"/><circle cx="32" cy="32" r="24" fill="url(#IDf)"/><g clip-path="url(#IDc)">' + outer + '</g>' + seams +
        '<path d="' + pent(32, 32, 8, 0) + '" fill="#111827"/><circle cx="32" cy="32" r="24" fill="none" stroke="#64748B" stroke-width="1.2"/><ellipse cx="23" cy="20" rx="6" ry="3.2" fill="#fff" opacity=".85" transform="rotate(-32 23 20)"/>';
    }
  };
  /* symboles des rouleaux, du grattage, des mines, du verger (dessinés, pas d'émojis) */
  var SYM = {
    gem: '<path d="M10 24l9-12h26l9 12-22 28z" fill="#38BDF8"/><path d="M10 24h44L32 52z" fill="#0284C7"/><path d="M19 12l6 12 7-12 7 12 6-12" fill="none" stroke="#E0F2FE" stroke-width="1.4"/><path d="M21 15l4 7" stroke="#fff" stroke-width="2.4"' + RC + '/>',
    seven: '<path d="M14 12h36v8L32 54H21l17-32H14z" fill="#DC2626" stroke="#7F1D1D" stroke-width="2.4" stroke-linejoin="round"/><path d="M17 14h30" stroke="#FCA5A5" stroke-width="2"' + RC + '/>',
    bell: '<path d="M32 10c-10 0-15 8-15 18v9l-5 7h40l-5-7v-9c0-10-5-18-15-18z" fill="#FACC15" stroke="#A16207" stroke-width="2"/><circle cx="32" cy="49" r="5" fill="#A16207"/><path d="M22 26c0-6 3-10 8-11" stroke="#fff" stroke-width="2.4" opacity=".7" fill="none"' + RC + '/>',
    lemon: '<ellipse cx="32" cy="34" rx="20" ry="15" fill="#FDE047" stroke="#CA8A04" stroke-width="2" transform="rotate(-20 32 34)"/><ellipse cx="25" cy="29" rx="6" ry="3" fill="#fff" opacity=".6" transform="rotate(-20 25 29)"/><path d="M48 20c3-4 7-5 9-4-1 4-5 6-9 4z" fill="#22C55E"/>',
    cherry: '<path d="M22 40c4-14 10-24 20-28M42 40c-2-12 0-22 0-28" stroke="#15803D" stroke-width="2.6" fill="none"' + RC + '/><path d="M42 12c6-3 11-2 13 1-5 3-9 3-13-1z" fill="#22C55E"/><circle cx="21" cy="45" r="10" fill="#DC2626"/><circle cx="43" cy="45" r="10" fill="#B91C1C"/><circle cx="18" cy="41" r="2.6" fill="#fff" opacity=".7"/><circle cx="40" cy="41" r="2.6" fill="#fff" opacity=".7"/>',
    star: '<path d="M32 8l7 15 16 2-12 11 3 16-14-8-14 8 3-16L9 25l16-2z" fill="#FACC15" stroke="#CA8A04" stroke-width="2" stroke-linejoin="round"/><path d="M26 24l6-11" stroke="#fff" stroke-width="2.4" opacity=".7"' + RC + '/>',
    crown: '<path d="M10 46l-2-26 13 11 11-17 11 17 13-11-2 26z" fill="#FACC15" stroke="#A16207" stroke-width="2" stroke-linejoin="round"/><rect x="10" y="46" width="44" height="7" rx="2" fill="#EAB308" stroke="#A16207" stroke-width="2"/><circle cx="32" cy="38" r="4" fill="#DC2626"/><circle cx="20" cy="40" r="2.6" fill="#2563EB"/><circle cx="44" cy="40" r="2.6" fill="#16A34A"/>',
    clover: '<g fill="#22C55E"><circle cx="24" cy="24" r="10"/><circle cx="40" cy="24" r="10"/><circle cx="24" cy="38" r="10"/><circle cx="40" cy="38" r="10"/></g><path d="M32 32c2 10 6 16 12 20" stroke="#15803D" stroke-width="3" fill="none"' + RC + '/><circle cx="21" cy="21" r="3" fill="#fff" opacity=".5"/>',
    coin: '<circle cx="32" cy="32" r="22" fill="#F5B700" stroke="#9A6A00" stroke-width="2.4"/><circle cx="32" cy="32" r="15" fill="none" stroke="#9A6A00" stroke-width="2" opacity=".6"/><circle cx="32" cy="32" r="7" fill="none" stroke="#9A6A00" stroke-width="4"/><path d="M20 22c3-4 8-6 12-6" stroke="#fff" stroke-width="2.4" opacity=".7" fill="none"' + RC + '/>',
    heart: '<path d="M32 52S10 38 10 24c0-7 5-12 11-12 5 0 9 3 11 7 2-4 6-7 11-7 6 0 11 5 11 12 0 14-22 28-22 28z" fill="#EF4444" stroke="#991B1B" stroke-width="2"/><ellipse cx="21" cy="22" rx="4" ry="3" fill="#fff" opacity=".6"/>',
    worm: '<path d="M18 50c0-8 10-8 10-17s-10-10-3-18" stroke="#F472B6" stroke-width="10" fill="none"' + RC + '/><path d="M18 50c0-8 10-8 10-17s-10-10-3-18" stroke="#FBCFE8" stroke-width="2" fill="none"' + RC + ' stroke-dasharray="1 6"/><circle cx="22.5" cy="13" r="1.8" fill="#111"/><circle cx="27.5" cy="15" r="1.8" fill="#111"/>',
    bomb: '<circle cx="30" cy="38" r="17" fill="#1F2937"/><circle cx="24" cy="31" r="5" fill="#fff" opacity=".22"/><path d="M41 25l6-8" stroke="#57534E" stroke-width="3.4"' + RC + '/><circle cx="48" cy="15" r="4" fill="#FBBF24"/><circle cx="48" cy="15" r="1.8" fill="#fff"/>',
    goldapple: '<path d="M32 18c-5-5-17-5-20 6s4 28 13 28c3 0 4.5-1.5 7-1.5s4 1.5 7 1.5c9 0 16-17 13-28s-15-11-20-6z" fill="#F5B700" stroke="#9A6A00" stroke-width="1.6"/><path d="M32 18c0-5 2-9 6-12" stroke="#78350F" stroke-width="3" fill="none"' + RC + '/><path d="M35 12c5-4 11-4 13-1-4 5-9 5-13 1z" fill="#22C55E"/><ellipse cx="20" cy="28" rx="3.5" ry="6" fill="#fff" opacity=".6" transform="rotate(20 20 28)"/>',
    skull: '<path d="M32 10c-12 0-20 8-20 19 0 7 3 11 7 13v8h26v-8c4-2 7-6 7-13 0-11-8-19-20-19z" fill="#F1F5F9" stroke="#64748B" stroke-width="2"/><circle cx="24" cy="30" r="5.5" fill="#1F2937"/><circle cx="40" cy="30" r="5.5" fill="#1F2937"/><path d="M30 40l2-4 2 4z" fill="#1F2937"/><path d="M26 50v-5M32 50v-5M38 50v-5" stroke="#64748B" stroke-width="2"/>'
  };
  SYM.diamond = SYM.gem;
  function sym(k) { return '<svg viewBox="0 0 64 64" aria-hidden="true">' + (SYM[k] || SYM.star) + '</svg>'; }
  /* voiture de course vue de côté (la même que le logo), couleur au choix, numéro */
  function car(c, num) {
    return '<svg viewBox="8 26 56 26" aria-hidden="true"><path d="M12 42l3-9c1-2.5 3-4 5.5-4H38c2 0 4 1 5.5 2.5L49 37h7c2 0 4 2 4 4v3c0 1-1 2-2 2H14c-1.1 0-2-.9-2-2z" fill="' + c + '"/>' +
      '<path d="M14 36c8-1 20-2 30-1" stroke="#fff" stroke-width="1.4" opacity=".45" fill="none"/><path d="M22 31h14l5 6H19z" fill="#0F172A"/><path d="M24 32.5h10l3 3.5H22z" fill="#7DD3FC" opacity=".75"/><rect x="10" y="30" width="5" height="10" rx="1.5" fill="' + c + '" opacity=".8"/>' +
      '<circle cx="22" cy="46" r="5.5" fill="#111"/><circle cx="22" cy="46" r="2.4" fill="#CBD5E1"/><circle cx="50" cy="46" r="5.5" fill="#111"/><circle cx="50" cy="46" r="2.4" fill="#CBD5E1"/>' +
      '<circle cx="32" cy="40" r="3.8" fill="#fff"/><text x="32" y="42.2" text-anchor="middle" font-size="5.4" font-weight="900" font-family="system-ui" fill="#111">' + (num || '') + '</text></svg>';
  }
  /* l'objet seul (SVG 64×64) */
  // v2718 : Crypto Live (3 pièces BTC / ETH / USDT) et Horse Race (fer à cheval doré + étoiles)
  // v2738 : Pierre-Feuille-Ciseaux — les 3 dessins (aussi utilisés en grand dans le jeu : D6.CasinoArt.rps(i))
  function rpsSvg(i, vb) {
    var d = [
      '<path d="M14 40c-3-9 2-19 11-22 6-6 17-5 22 1 8 2 12 11 9 19-1 9-9 14-18 14H24c-6 0-9-5-10-12z" fill="#94A3B8"/><path d="M18 38c0-7 4-13 11-15M33 22c6-2 12 0 15 5" stroke="#E2E8F0" stroke-width="2.4" fill="none"' + RC + ' opacity=".8"/><path d="M22 47c6 3 18 3 26-2" stroke="#475569" stroke-width="2" fill="none" opacity=".55"/><circle cx="40" cy="36" r="2" fill="#64748B"/><circle cx="27" cy="33" r="1.5" fill="#64748B"/>',
      '<path d="M15 10h26l9 9v35H15z" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="1.6"/><path d="M41 10v9h9" fill="#E2E8F0" stroke="#CBD5E1" stroke-width="1.6"/><path d="M21 26h22M21 32h22M21 38h22M21 44h15" stroke="#93C5FD" stroke-width="2.2"' + RC + '/>',
      '<path d="M30 33L49 9" stroke="#CBD5E1" stroke-width="5"' + RC + '/><path d="M34 33L15 9" stroke="#E2E8F0" stroke-width="5"' + RC + '/><circle cx="32" cy="33" r="2.6" fill="#475569"/><circle cx="22" cy="46" r="8" fill="none" stroke="#EF4444" stroke-width="5"/><circle cx="42" cy="46" r="8" fill="none" stroke="#EF4444" stroke-width="5"/>'
    ][i] || '';
    return vb ? '<svg viewBox="4 4 56 56" aria-hidden="true">' + d + '</svg>' : d;
  }
  /* ===== LOGOS « LOT B » (2026-10-21, propriétaire : « les logos de beaucoup de jeux sont moches ») — BLOC À PART =====
     Personnages bien dessinés (peau claire), couleurs vives, scène qui montre le jeu, dans un médaillon brillant 64×64
     (même cadre que les autres logos). Un logo déclaré ici passe AVANT celui du catalogue (js/games/cat-*.js, voir addObj). */
  (function () {
    var C = ' stroke-linecap="round" stroke-linejoin="round" fill="none"';
    function L(d, c, w, o) { return '<path d="' + d + '" stroke="' + c + '" stroke-width="' + w + '"' + C + (o ? ' opacity="' + o + '"' : '') + '/>'; }
    function P(d, c, o) { return '<path d="' + d + '" fill="' + c + '"' + (o ? ' opacity="' + o + '"' : '') + '/>'; }
    function O(x, y, r, c, o) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + c + '"' + (o ? ' opacity="' + o + '"' : '') + '/>'; }
    function E(x, y, rx, ry, c, o) { return '<ellipse cx="' + x + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + c + '"' + (o ? ' opacity="' + o + '"' : '') + '/>'; }
    function G(id, a, b, c, h) { return '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (h ? 1 : 0) + '" y2="' + (h ? 0 : 1) + '"><stop offset="0" stop-color="' + a + '"/>' + (c ? '<stop offset=".5" stop-color="' + b + '"/><stop offset="1" stop-color="' + c + '"/>' : '<stop offset="1" stop-color="' + b + '"/>') + '</linearGradient>'; }
    function R(id, a, b, c) { return '<radialGradient id="' + id + '" cx="36%" cy="30%" r="75%"><stop offset="0" stop-color="' + a + '"/><stop offset=".55" stop-color="' + b + '"/><stop offset="1" stop-color="' + c + '"/></radialGradient>'; }
    function tw(x, y, s, o) { return '<path d="M' + x + ' ' + f(y - s) + 'Q' + x + ' ' + y + ' ' + f(x + s) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + f(y + s) + 'Q' + x + ' ' + y + ' ' + f(x - s) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + f(y - s) + 'Z" fill="#fff" opacity="' + (o || 1) + '"/>'; }
    var SK = 'url(#IDsk)';
    // médaillon : ombre, anneau brillant, décor rond (à dessiner dans <g clip-path="url(#IDc)">) ; fin() = reflet + liseré
    function med(s1, s2, r1, r2, defs) {
      return '<defs><clipPath id="IDc"><circle cx="32" cy="33" r="26.5"/></clipPath>' + G('IDbg', s1, s2) + G('IDrg', '#FFF7D6', r1, r2, 1) +
        R('IDsk', '#FFF3EA', '#FFD9C0', '#EBB394') +
        '<linearGradient id="IDgl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' + (defs || '') + '</defs>' +
        '<circle cx="32" cy="35" r="28.5" fill="#000" opacity=".38"/><circle cx="32" cy="33" r="28.5" fill="url(#IDrg)"/><circle cx="32" cy="33" r="26.5" fill="url(#IDbg)"/>';
    }
    function fin() { return '<path d="M8.6 30A23.5 23.5 0 0 1 55.4 30Q32 19 8.6 30z" fill="url(#IDgl)"/><circle cx="32" cy="33" r="26.5" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width=".9"/>'; }
    // visage clair : yeux (regard dx −1…1), joues roses, sourire ; m = bouche à part ('' = aucune)
    function face(x, y, r, dx, m) {
      var e = r * .34, ey = y + r * .02, ox = x + (dx || 0) * r * .3;
      return O(x, y, r, SK) + E(f(ox - e), f(ey), f(r * .12), f(r * .17), '#1F2937') + E(f(ox + e), f(ey), f(r * .12), f(r * .17), '#1F2937') +
        O(f(ox - e + r * .05), f(ey - r * .07), f(r * .05), '#fff') + O(f(ox + e + r * .05), f(ey - r * .07), f(r * .05), '#fff') +
        O(f(ox - e * 1.35), f(ey + r * .34), f(r * .15), '#FB7185', .35) + O(f(ox + e * 1.35), f(ey + r * .34), f(r * .15), '#FB7185', .35) +
        (m != null ? m : L('M' + f(ox - r * .2) + ' ' + f(y + r * .42) + 'Q' + f(ox) + ' ' + f(y + r * .62) + ' ' + f(ox + r * .2) + ' ' + f(y + r * .42), '#9F1239', f(r * .11)));
    }
    // dalle isométrique (Tower Stack) : centre du dessus, demi-largeur a, épaisseur h, couleurs [dessus, gauche, droite]
    function slab(x, y, a, h, c) {
      var b = a / 2;
      return P('M' + f(x - a) + ' ' + y + 'L' + x + ' ' + f(y + b) + 'L' + x + ' ' + f(y + b + h) + 'L' + f(x - a) + ' ' + f(y + h) + 'Z', c[1]) +
        P('M' + x + ' ' + f(y + b) + 'L' + f(x + a) + ' ' + y + 'L' + f(x + a) + ' ' + f(y + h) + 'L' + x + ' ' + f(y + b + h) + 'Z', c[2]) +
        P('M' + x + ' ' + f(y - b) + 'L' + f(x + a) + ' ' + y + 'L' + x + ' ' + f(y + b) + 'L' + f(x - a) + ' ' + y + 'Z', c[0]) +
        L('M' + f(x - a + 1) + ' ' + y + 'L' + x + ' ' + f(y - b + .5) + 'L' + f(x + a - 1) + ' ' + y, '#fff', .7, .7);
    }
    var B = {};
    // Commando Run : soldat qui court et tire dans la jungle
    B.commando = med('#7DD3FC', '#1D4ED8', '#FBBF24', '#92400E', G('IDcm', '#84CC16', '#3F6212') + G('IDhm', '#65A30D', '#365314')) +
      '<g clip-path="url(#IDc)">' + O(14, 18, 5, '#FEF9C3', .9) +
      P('M4 46Q10 34 18 42Q24 30 34 41Q44 31 52 40Q58 34 62 38V64H4z', '#15803D') + P('M4 49Q16 42 30 49T62 47V64H4z', '#166534') +
      P('M4 54H62V64H4z', '#7C4A1E') + P('M4 54H62V56H4z', '#A16207') +
      L('M7 30H16M5 36H14M9 42H17', '#fff', 1.6, .55) +
      L('M30 42L24 47L19 50.5', '#3F6212', 5) + P('M14.5 49.5h6a2.4 2.4 0 0 1 0 4h-6z', '#1F2937') +
      L('M28 31L33 35.5L39 34.5', '#4D7C0F', 4) + O(39.8, 34.3, 2, SK) +
      '<rect x="26" y="28" width="11" height="15" rx="4" fill="url(#IDcm)"/>' + P('M27.5 30.5l3 1.4-1 3-2.4-.6zM33 36l2.6-.8.6 2.6-2.4.6z', '#365314') +
      '<rect x="26" y="38.5" width="11" height="2.6" rx="1" fill="#422006"/>' +
      L('M33 42L39 46.5L40 53', '#4D7C0F', 5) + P('M37 52.5h6.5a2.2 2.2 0 0 1 0 3.8H37z', '#1F2937') +
      '<rect x="31" y="30.6" width="23" height="3.6" rx="1.3" fill="#1F2937"/><rect x="28.5" y="30" width="6" height="5" rx="1.6" fill="#57534E"/><rect x="38" y="33.8" width="3" height="5.4" rx="1" fill="#111827"/>' + L('M34 31.4H52', '#94A3B8', .7) +
      L('M34 30.5L39 33L44 33.4', '#65A30D', 4) + '<rect x="40" y="30.4" width="15" height="3.2" rx="1.2" fill="#1F2937"/>' + L('M42 31.2H54', '#94A3B8', .7) + O(44.6, 33, 2, SK) +
      face(31, 23, 5.4, .9) +
      P('M25.1 22.4C24.6 16.4 28 14.4 31.5 14.4C35.6 14.4 38.6 16.8 38.1 22Z', 'url(#IDhm)') + L('M24.4 22.2H38.8', '#365314', 1.7) + L('M27.5 17.5Q30 15.6 33 15.8', '#BEF264', 1, .7) +
      '</g>' + '<path d="M54 26.5l2 3.6 4-1.2-2.3 3.4 3.6 2.1-4 .5.3 4-2.6-3-2.7 3 .4-4-4-.6 3.6-2-2.3-3.4 4 1.2z" fill="#FDE047"/>' + O(55.6, 32.4, 2, '#fff') + fin();
    // Skate Tricks : skateur en l'air au-dessus de la rampe, coucher de soleil
    B.skatetricks = med('#F9A8D4', '#6D28D9', '#22D3EE', '#0E7490', G('IDhp', '#67E8F9', '#0891B2') + G('IDbd', '#FDE047', '#EAB308', 0, 1)) +
      '<g clip-path="url(#IDc)">' + O(46, 22, 7, '#FEF08A', .85) +
      P('M4 44h6v-8h5v8h4v-12h6v12h4v-6h5v6h5v-10h6v10h5v-7h5v7h7v20H4z', '#4C1D95', .55) +
      P('M4 47H13Q18 59 32 59Q46 59 51 47H62V64H4z', 'url(#IDhp)') + L('M4 47H13M51 47H62', '#E0F2FE', 1.6) + L('M17 53Q24 57 32 57', '#fff', 1, .5) +
      '<g transform="rotate(-14 32 45)"><rect x="19.5" y="43.2" width="25" height="3.4" rx="1.7" fill="url(#IDbd)"/><rect x="19.5" y="43.2" width="25" height="1.1" rx=".55" fill="#1F2937" opacity=".6"/>' + O(24, 48.2, 1.9, '#E11D48') + O(40, 48.2, 1.9, '#E11D48') + '</g>' +
      L('M29 35.5L25 39.5L26.5 43.8', '#1D4ED8', 4.2) + L('M34.5 35.5L38.5 38.5L37.5 41.8', '#2563EB', 4.2) +
      E(26.5, 44.3, 2.6, 1.3, '#111827') + E(38, 42.2, 2.6, 1.3, '#111827') +
      '<rect x="27" y="23.5" width="10.4" height="13.5" rx="4" fill="#EF4444"/>' + L('M32.2 25V36', '#B91C1C', 1) + P('M27 32h10.4v2H27z', '#FDE047', .9) +
      L('M28.5 26.5L23 23.5L18.6 24.2', '#EF4444', 3.6) + O(18, 24.2, 1.9, SK) + L('M36 26.5L41.5 22.5L45.5 19.6', '#DC2626', 3.6) + O(46.2, 19.2, 1.9, SK) +
      face(32.2, 18.2, 5.2, 0) + P('M26.9 17C27.1 12.4 29.8 11.3 32.3 11.3C35.4 11.3 37.6 13.3 37.5 16.6Z', '#1E3A8A') + L('M27 16.4L23.6 18', '#1E3A8A', 1.9) + L('M29 13.2Q32 12 35 13.2', '#60A5FA', 1, .8) +
      '</g>' + tw(13, 22, 3, .9) + tw(52, 40, 2.4, .8) + fin();
    // Ski Jump : sauteur à skis en vol (style V) au-dessus du tremplin
    B.skijump = med('#BAE6FD', '#2563EB', '#E0F2FE', '#1D4ED8', G('IDsu', '#F87171', '#B91C1C', 0, 1)) +
      '<g clip-path="url(#IDc)">' + O(48, 17, 5, '#FEF9C3') +
      P('M4 44L16 30L24 38L34 26L46 40L54 33L62 41V64H4z', '#E0E7FF') + P('M16 30L19 34L17 36L13 34zM34 26L38 31L35 32L31 30z', '#fff') +
      P('M4 47Q18 48 28 56L28 64H4z', '#F8FAFC') + L('M4 47Q18 48 28 56', '#93C5FD', 1.4) + L('M28 56V64', '#1E3A8A', 3) +
      L('M10 53Q20 54 26 59', '#BFDBFE', 1, .8) +
      L('M18 44L48 26', '#1E3A8A', 2.4) + L('M20 47L52 36', '#1E3A8A', 2.4) + L('M46 27L49.5 25M50 36.6L53.5 35.6', '#FACC15', 2.4) +
      L('M27 42L39.5 33.5', 'url(#IDsu)', 7) + L('M28 42L25 44.5', '#B91C1C', 4.6) + L('M38 35L30 38.6', '#991B1B', 3) +
      face(44.6, 29.4, 4.5, 1, '') + P('M40 29.4C40 25 42.4 24.4 44.6 24.4C47.4 24.4 49.2 26 49.1 28.4L40.4 30.4Z', '#1D4ED8') +
      '<rect x="43.6" y="27.4" width="6.2" height="2.6" rx="1.3" fill="#FACC15" stroke="#1F2937" stroke-width=".6"/>' + L('M43 32.4Q45 33.6 47 32.6', '#9F1239', .6) +
      L('M8 30H17M6 36H14', '#fff', 1.4, .7) + '</g>' + tw(54, 46, 2.5, .9) + fin();
    // Snowboard Jump : surfeur des neiges qui attrape sa planche en plein saut
    B.snowjump = med('#C4B5FD', '#3730A3', '#F0ABFC', '#7E22CE', G('IDbd', '#FB7185', '#BE123C', 0, 1) + G('IDjk', '#22D3EE', '#0E7490')) +
      '<g clip-path="url(#IDc)">' + O(15, 18, 1, '#fff') + O(50, 14, .9, '#fff') + O(22, 12, .8, '#fff') +
      P('M4 50L18 34L26 42L38 28L50 42L56 37L62 44V64H4z', '#A5B4FC') + P('M18 34L21.5 38L19 39L15.5 37.5zM38 28L42 33L39 34.5L35 32z', '#fff') +
      P('M4 52Q30 46 62 54V64H4z', '#F1F5F9') + L('M4 52Q30 46 62 54', '#C7D2FE', 1.2) +
      '<g transform="rotate(-18 32 45)"><rect x="17.5" y="42.6" width="29" height="5" rx="2.5" fill="url(#IDbd)"/>' + L('M21 45.1H43', '#FDE047', 1.3) + '</g>' +
      L('M29 35.5L24 40L26 43.5', '#334155', 4.4) + L('M35 35.5L40 39L38.5 42', '#1E293B', 4.4) +
      '<rect x="26.5" y="23.5" width="11" height="13.5" rx="4" fill="url(#IDjk)"/>' + L('M32 24.5V36', '#164E63', .9) + L('M27 30.5h10.5', '#FDE047', 1.2) +
      L('M28 27.5L23.5 34L26.5 41', '#0891B2', 3.6) + O(26.8, 41.2, 1.9, SK) + L('M36.5 26.5L42 21L45.5 16.8', '#06B6D4', 3.6) + O(46, 16.2, 1.9, SK) +
      face(32, 18, 5, 0) + P('M26.8 17.1C26.8 12.1 29.5 11 32 11C34.5 11 37.2 12.1 37.2 17.1Z', '#E11D48') + '<rect x="26.6" y="15.2" width="10.8" height="2.2" rx="1.1" fill="#FDE047"/>' + O(32, 10.6, 1.9, '#FEF3C7') +
      O(16, 52, 1.6, '#fff') + O(20, 49, 1.1, '#fff') + O(13, 47.5, .9, '#fff') + '</g>' + tw(52, 26, 2.6, .9) + fin();
    // Rooftop Ninja : ninja qui saute d'un toit à l'autre devant la grande lune
    B.rooftopninja = med('#6366F1', '#0F172A', '#A78BFA', '#4C1D95', R('IDmn', '#FFFBEB', '#FDE68A', '#F59E0B')) +
      '<g clip-path="url(#IDc)">' + O(38, 25, 13, 'url(#IDmn)') + O(34, 21, 2, '#FCD34D', .6) + O(43, 29, 2.6, '#FCD34D', .5) + O(12, 15, .9, '#fff') + O(20, 11, .7, '#fff') + O(55, 42, .8, '#fff') +
      P('M4 46H22V64H4z', '#0B0B24') + P('M3 44H23L22 47H4z', '#3730A3') + P('M44 42H62V64H44z', '#0B0B24') + P('M43 40H63L62 43H44z', '#3730A3') +
      P('M8 50h3v3H8zM14 50h3v3h-3zM8 57h3v3H8zM48 46h3v3h-3zM54 46h3v3h-3zM54 53h3v3h-3z', '#FDE047', .85) +
      L('M24 22L36 36', '#E2E8F0', 1.6) + L('M22.5 20.5L25.2 23.3', '#7C3AED', 2.4) +
      L('M28.5 36.5L22.5 37.5L18.5 41.5', '#334155', 4.2) + L('M32.5 36.5L37 41L34 45', '#475569', 4.2) + E(18, 42, 1.8, 1.2, '#7C3AED') + E(33.6, 45.6, 1.8, 1.2, '#7C3AED') +
      L('M28.5 36L33.5 28.5', '#475569', 8) + P('M27 33.5l7.2-3.8.8 1.6-7.2 3.8z', '#7C3AED') +
      L('M33.5 29L39.5 27.5L44.5 24', '#334155', 3.4) + L('M30.5 30L24.5 27L20 27.6', '#475569', 3.4) +
      O(36.2, 21.6, 5.2, '#334155') + '<rect x="32.4" y="19.6" width="8" height="3.4" rx="1.7" fill="url(#IDsk)"/>' + O(35, 21.3, .75, '#111827') + O(38.4, 21.3, .75, '#111827') +
      L('M31.5 18.4L41 17.6', '#EF4444', 1.8) + L('M31.6 18.6Q27 17.4 23.5 19.6', '#EF4444', 1.5) + L('M31.6 18.8Q27.6 20.6 25 23.4', '#DC2626', 1.3) +
      '</g>' + tw(14, 28, 2.6, .9) + tw(53, 18, 2.2, .8) + fin();
    // Star Archer : astronaute archer qui vise la cible lumineuse
    B.archer = med('#7C3AED', '#0F172A', '#FB7185', '#9F1239', G('IDsu', '#FFFFFF', '#A5B4FC') + R('IDtg', '#FFFFFF', '#FDE68A', '#F59E0B')) +
      '<g clip-path="url(#IDc)">' + O(12, 20, .9, '#fff') + O(24, 11, .7, '#fff') + O(58, 44, .8, '#fff') + O(40, 52, .7, '#fff') +
      O(10, 66, 16, '#3B82F6', .9) + O(10, 66, 16, 'none') + P('M-4 58Q10 50 26 56', '#93C5FD', .5) +
      '<g transform="translate(51 20)">' + O(0, 0, 8.4, '#E11D48') + O(0, 0, 6.4, '#fff') + O(0, 0, 4.4, '#E11D48') + O(0, 0, 2.4, 'url(#IDtg)') + '</g>' +
      L('M20 40L18 48L16 54', '#CBD5E1', 4.8) + L('M25 40L28.5 47L29.5 54', '#E2E8F0', 4.8) + E(15.6, 55, 3, 1.6, '#4F46E5') + E(30.4, 55, 3, 1.6, '#4F46E5') +
      '<rect x="16.5" y="27" width="11" height="14" rx="4.5" fill="url(#IDsu)"/>' + '<rect x="19" y="30" width="6" height="4" rx="1.2" fill="#4F46E5"/>' + O(20.5, 32, .8, '#22D3EE') + O(23, 32, .8, '#F472B6') +
      '<g transform="rotate(-20 31 30)">' + L('M33.5 16.5Q43 30 33.5 43.5', '#FBBF24', 2.4) + L('M33.5 16.5L26.5 30L33.5 43.5', '#fff', .7) +
      L('M26 30H47', '#FDE047', 1.5) + P('M50 30l-4-2.6v5.2z', '#FDE047') + P('M26 30l-2.6-2h3l2 2-2 2h-3z', '#22D3EE') + L('M30 30H47', '#fff', .5, .9) + '</g>' +
      L('M25.5 29.6L31.5 27.5', '#E2E8F0', 3.6) + L('M19 29.5L22 33L26.6 31.6', '#CBD5E1', 3.6) +
      O(22.4, 21, 6.6, '#E2E8F0') + O(22.4, 21, 6.6, 'none') + O(23.2, 21.4, 5, '#1E1B4B') + face(23.4, 21.6, 4.3, .8) + L('M19.6 18.8Q21.6 16.8 24.6 17', '#fff', 1, .8) +
      '</g>' + tw(42, 44, 2.6, .9) + tw(14, 30, 1.8, .7) + fin();
    // Penalty Live : gardien qui plonge, ballon qui file dans la lucarne
    B.penaltylive = med('#1E40AF', '#0B1026', '#38BDF8', '#1E3A8A', G('IDj', '#C084FC', '#6D28D9') + G('IDpt', '#4ADE80', '#15803D')) +
      '<g clip-path="url(#IDc)">' + O(12, 12, 6, '#FEF9C3', .35) + O(52, 12, 6, '#FEF9C3', .35) + O(12, 12, 2.2, '#fff') + O(52, 12, 2.2, '#fff') +
      P('M4 44H62V64H4z', 'url(#IDpt)') + P('M4 50H62V54H4zM4 58H62V62H4z', '#166534', .35) +
      '<path d="M11 44V18H53V44" stroke="#F8FAFC" stroke-width="2.4" fill="none"/>' +
      L('M15 18V44M20 18V44M25 18V44M30 18V44M35 18V44M40 18V44M45 18V44M50 18V44M11 23H53M11 28H53M11 33H53M11 38H53', '#CBD5E1', .5, .55) +
      L('M35 37.5L41 40.5L47 40', '#1E293B', 4.2) + L('M35 38.5L39 44L44.5 45.5', '#1E293B', 4.2) + E(48.5, 39.8, 2.4, 1.4, '#F43F5E') + E(46, 45.8, 2.4, 1.4, '#F43F5E') +
      L('M36 37L26 29', 'url(#IDj)', 9) + L('M33 32.5L29 30', '#FDE047', 1.2, .9) +
      L('M27 28L20 23.5L16.5 20', '#7C3AED', 3.4) + O(16, 19.6, 2.8, '#FDE047') + L('M26 30L19.5 27.5L15.5 27', '#6D28D9', 3.4) + O(15, 27, 2.8, '#FACC15') +
      face(25.5, 34.5, 4.6, -.8) + P('M21 33.2C20.5 29.6 23.2 29.4 25.4 29.6C28.2 29.8 30 31.4 29.6 33.2C27.6 31.6 24.5 31.8 21 33.2Z', '#78350F') +
      '</g>' + L('M30 26Q38 21 44 20.5', '#fff', 1.4, .55) + '<g transform="translate(48 21)">' + O(0, 0, 4.6, '#fff') + P('M0-1.7l1.6 1.2-.6 1.9h-2l-.6-1.9z', '#111827') + P('M-4.4-.8l1.6-.6.8 1.6-1 1.4-1.5-.3zM4.4-.8l-1.6-.6-.8 1.6 1 1.4 1.5-.3zM-1.4 4.4l.4-1.6h2l.4 1.6zM0-4.6l-1.6.9.2 1.2 1.4-.4 1.4.4.2-1.2z', '#111827', .85) + O(-1.4, -1.6, 1.1, '#fff', .9) + '</g>' + fin();
    // Ace Serve : joueuse qui sert, balle lancée en l'air
    B.tennis = med('#7DD3FC', '#1D4ED8', '#F9A8D4', '#BE185D', R('IDbl', '#F7FEE7', '#D9F99D', '#65A30D')) +
      '<g clip-path="url(#IDc)">' + P('M4 46H62V64H4z', '#2563EB') + P('M10 64L18 46H46L54 64', '#3B82F6') + L('M10 64L18 46H46L54 64M14 55H50', '#E0F2FE', 1) + P('M4 42H62V47H4z', '#1E3A8A', .8) + L('M4 42H62', '#fff', 1.2) + L('M8 44h48', '#93C5FD', .4) +
      L('M29.5 43L27.5 53.5', SK, 3.6) + L('M34 43L37 53', SK, 3.6) + E(27, 54.5, 2.4, 1.3, '#F8FAFC') + E(37.6, 54, 2.4, 1.3, '#F8FAFC') +
      P('M27.2 38.5H36.2L38.6 45H24.8Z', '#F8FAFC') + L('M26 44.6H37.6', '#F9A8D4', 1) +
      '<rect x="27.5" y="28" width="8.6" height="11.5" rx="3.6" fill="#EC4899"/>' + L('M29.5 30H34', '#FBCFE8', 1) +
      L('M28.5 30.5L23.5 25.5L22.6 20.5', SK, 3) + L('M35 30.5L40.5 25L42 20', SK, 3) +
      L('M42 20L43 15.6', '#1F2937', 2) + '<g transform="rotate(14 44.5 10.5)"><ellipse cx="44.5" cy="10.5" rx="4.2" ry="5.4" fill="#FCE7F3" fill-opacity=".45" stroke="#DB2777" stroke-width="1.6"/>' + L('M42 8.5h5M41.6 11h5.8M42 13.5h5M43 6v9.4M46 6v9.4', '#BE185D', .4, .8) + '</g>' +
      face(31.8, 23, 4.6, .3) + P('M27.1 22.4C26.4 17.6 29.4 17.4 31.8 17.4C34.6 17.4 36.9 19 36.4 22C34.6 20.3 30.2 20.2 27.1 22.4Z', '#5B3A1E') + L('M27.6 20.4Q23 19.6 22 24.4', '#5B3A1E', 2.4) + L('M27.4 20.4Q31.8 18.8 36.2 20.4', '#F472B6', 1.2) +
      '</g>' + O(20.5, 13.6, 3.4, 'url(#IDbl)') + L('M18 12.4Q20.5 14.6 23 12.4', '#fff', .7) + tw(13, 26, 2, .8) + fin();
    // Wild West : cow-boy souriant, chapeau, foulard, étoile de shérif, désert au soleil couchant
    B.wildwest = med('#F0ABFC', '#6D28D9', '#FBBF24', '#92400E', G('IDht', '#B45309', '#5C2E0E') + R('IDst', '#FFFBEB', '#FDE047', '#CA8A04')) +
      '<g clip-path="url(#IDc)">' + O(50, 30, 6, '#FDE68A', .9) + P('M4 44h8l2-6h9l2 6h10V40h9l2 4h16v20H4z', '#7E22CE', .6) +
      P('M13 64Q14 49 32 48Q50 49 51 64Z', '#2563EB') + P('M13 64Q14 50 23 48.6L27 64ZM51 64Q50 50 41 48.6L37 64Z', '#78350F') +
      P('M25.5 46.5L32 55L38.5 46.5Z', '#DC2626') + O(30, 49, .7, '#FEE2E2') + O(34, 49, .7, '#FEE2E2') + O(32, 52, .7, '#FEE2E2') +
      P('M42 54l1.2 2.6 2.8.3-2.1 1.9.6 2.8-2.5-1.4-2.5 1.4.6-2.8-2.1-1.9 2.8-.3z', 'url(#IDst)') +
      P('M27.5 44h9v4h-9z', SK) + face(32, 35, 8.6, 0, '') + L('M28.6 39.4Q32 41.8 35.4 39.4', '#9F1239', .9) + L('M26.5 32L30 31.4M37.5 32L34 31.4', '#5C2E0E', 1.1) + P('M29.6 38.4Q32 36.6 34.4 38.4Q32 39.2 29.6 38.4Z', '#78350F') +
      P('M23.6 33C23.4 30 24.6 28.6 26 28.4L25.6 35ZM40.4 33C40.6 30 39.4 28.6 38 28.4L38.4 35Z', '#78350F') +
      P('M10 28.6Q12 25.4 18 26.6Q32 29.4 46 26.6Q52 25.4 54 28.6Q50 31.4 32 31Q14 31.4 10 28.6Z', 'url(#IDht)') +
      P('M21.5 27.6C21 17.6 25 13.4 28.6 15.4L32 17L35.4 15.4C39 13.4 43 17.6 42.5 27.6Q32 29.6 21.5 27.6Z', 'url(#IDht)') + P('M21.8 24.6Q32 26.6 42.2 24.6L42.4 27.4Q32 29.4 21.6 27.4Z', '#FBBF24') + L('M25 18.6Q27 16.4 29 17.2', '#FDE68A', 1, .6) +
      '</g>' + fin();
    // Samouraï : guerrier au casque laqué, armure rouge, katana, soleil rouge et fleurs de cerisier
    B.samurai = med('#312E81', '#1E1B4B', '#FCA5A5', '#991B1B', G('IDar', '#EF4444', '#991B1B') + G('IDkb', '#475569', '#0F172A')) +
      '<g clip-path="url(#IDc)">' + O(32, 26, 15, '#DC2626', .9) +
      L('M12 58L50 13', '#E2E8F0', 2.4) + L('M13 56.6L50 13', '#fff', .6) + E(13.6, 56.6, 2.8, 1.2, '#FBBF24') + L('M8 63L12.6 57.6', '#1F2937', 3) +
      P('M13 64Q13 50 32 49Q51 50 51 64Z', 'url(#IDar)') + L('M16 55H48M14.6 59.4H49.4', '#FBBF24', .9) + L('M22 50.5V64M32 49V64M42 50.5V64', '#7F1D1D', .7, .8) +
      P('M27.5 44h9v5.5h-9z', SK) + face(32, 37.6, 8.2, 0, '') + L('M29.5 42.4H34.5', '#9F1239', 1) + L('M26 34.4L30 35.6M38 34.4L34 35.6', '#111827', 1.5) +
      P('M20.6 37C19.6 27 24.6 21.6 32 21.6C39.4 21.6 44.4 27 43.4 37L47 39.6L43.2 42C42 35.6 39.4 31.8 32 31.8C24.6 31.8 22 35.6 20.8 42L17 39.6Z', 'url(#IDkb)') +
      L('M21 33Q32 28.6 43 33', '#FBBF24', 1.1) + P('M32 23.4L22.6 9.4Q26.4 19 29.6 23.4ZM32 23.4L41.4 9.4Q37.6 19 34.4 23.4Z', '#FBBF24') + O(32, 24.6, 2.4, '#FDE047') + O(32, 24.6, 1.1, '#DC2626') +
      '</g>' + P('M51 44c1.6-1.6 3.6 0 2 1.6 1.6 1.6-.4 3.6-2 2-1.6 1.6-3.6-.4-2-2-1.6-1.6.4-3.6 2-1.6z', '#F9A8D4') + P('M12 21c1.2-1.2 2.7 0 1.5 1.2 1.2 1.2-.3 2.7-1.5 1.5-1.2 1.2-2.7-.3-1.5-1.5-1.2-1.2.3-2.7 1.5-1.5z', '#FBCFE8') + fin();
    // Viking Raid : viking blond au casque à cornes, bouclier, mer et drakkar
    B.viking = med('#7DD3FC', '#1E3A8A', '#FDE68A', '#A16207', G('IDhl', '#E2E8F0', '#64748B') + G('IDhn', '#FFFBEB', '#D6D3D1')) +
      '<g clip-path="url(#IDc)">' + P('M4 46Q18 42 32 46T62 46V64H4z', '#1D4ED8', .8) + P('M42 41h14l-2 4H44z', '#78350F') + L('M48 41V32', '#78350F', 1) + P('M48.4 32.4l6 4.6-6 1.4z', '#DC2626') +
      O(13, 50, 10, '#B91C1C') + O(13, 50, 7.4, '#1D4ED8') + L('M13 40v20M3 50h20', '#FBBF24', 1.6) + O(13, 50, 2.4, '#FDE047') +
      P('M16 64Q17 50 32 49Q47 50 48 64Z', '#7C2D12') + P('M16 64Q17 52 24 50.4L26 64ZM48 64Q47 52 40 50.4L38 64Z', '#57534E') +
      face(32, 36.6, 8.2, 0, '') + L('M27 33.6L30.2 34.2M37 33.6L33.8 34.2', '#A16207', 1.2) +
      P('M23.8 38Q24 49 32 53Q40 49 40.2 38Q37 42.4 32 42.4Q27 42.4 23.8 38Z', '#FCD34D') + P('M28 40.4Q32 38 36 40.4Q32 42 28 40.4Z', '#EAB308') + L('M29.4 43.6Q32 45 34.6 43.6', '#9F1239', .9) + L('M28 46.5V51M36 46.5V51', '#CA8A04', .8) +
      P('M22.6 34.6C22 25.6 26 21 32 21C38 21 42 25.6 41.4 34.6Z', 'url(#IDhl)') + '<rect x="22" y="31.6" width="20" height="3.4" rx="1.4" fill="#A16207"/>' + L('M32 21.4V35', '#94A3B8', 1.6) + L('M25 26Q27.6 22.8 30.6 22.6', '#fff', 1.1, .7) +
      P('M23.4 28.6Q15 28 13.6 18Q18 24.6 24.4 25Z', 'url(#IDhn)') + P('M40.6 28.6Q49 28 50.4 18Q46 24.6 39.6 25Z', 'url(#IDhn)') +
      '</g>' + tw(53, 22, 2.2, .9) + fin();
    // Mermaid Lagoon : sirène aux cheveux roses, queue turquoise, bulles et rayons de lumière
    B.mermaid = med('#67E8F9', '#1E3A8A', '#F0ABFC', '#86198F', G('IDtl', '#5EEAD4', '#0F766E') + G('IDhr', '#F472B6', '#9D174D')) +
      '<g clip-path="url(#IDc)">' + P('M16 6L24 6L14 64H4zM34 6L40 6L36 64H28z', '#fff', .1) +
      P('M4 56Q14 50 22 56T42 54T62 56V64H4z', '#FDE68A', .85) + P('M46 56Q47 46 51 44Q54 48 54 56z', '#EC4899') + P('M51 44Q55 40 57 44', '#F472B6') +
      P('M27.2 26C21.4 29 17 36 19.4 45.6L23 44C21.8 37 24 32 29.4 30Z', 'url(#IDhr)') +
      '<path d="M33 37Q34 46 40 50Q46 53 50 50" stroke="url(#IDtl)" stroke-width="7.6"' + C + '/>' + L('M35 41.6l2 1.4M37.6 45.6l2 1.2M41.6 48.8l1.8.8', '#99F6E4', .8, .9) +
      P('M49 50.6Q52 42.6 57.6 44.6Q54 48 53.6 51.6Q56.6 55.6 55 60.6Q50.6 55 49 50.6Z', '#2DD4BF') +
      '<rect x="27.6" y="27" width="9" height="11.6" rx="4" fill="' + SK + '"/>' + E(30, 30.4, 2.2, 1.8, '#A855F7') + E(34.4, 30.4, 2.2, 1.8, '#A855F7') +
      L('M28.6 29.6L23.6 35.2L24 39.6', SK, 2.8) + L('M36 29L41 24.4L43.6 20.6', SK, 2.8) +
      face(32, 21.6, 5.4, 0) + P('M26.4 22C25.6 15.6 29.2 14.6 32 14.6C35.6 14.6 38.6 16.6 37.6 22C36.4 18.6 33.6 18.4 32 19.4C30 18.4 27.6 19 26.4 22Z', 'url(#IDhr)') +
      P('M37.4 20.6C40 24 40 28.4 37.6 31L36.2 27.6C37.6 25.6 37.4 23 36.4 21.2Z', 'url(#IDhr)') + O(28, 16.4, 1.3, '#FDE047') +
      '</g>' + O(48, 22, 2.2, '#fff', .35) + O(51, 16, 1.4, '#fff', .45) + O(47.4, 12.6, 1, '#fff', .55) + O(16, 18, 1.4, '#fff', .4) + fin();
    // Zombie Siege : zombie de dessin animé (vert) dans le viseur, nuit, lune et tombes
    B.zombiesiege = med('#8B5CF6', '#1E1B4B', '#F87171', '#7F1D1D', R('IDzb', '#D9F99D', '#86EFAC', '#15803D') + G('IDsh', '#60A5FA', '#1E3A8A')) +
      '<g clip-path="url(#IDc)">' + O(48, 18, 6, '#FEF3C7', .9) +
      P('M4 52Q20 48 32 51T62 50V64H4z', '#3B0764') + P('M8 52v-6a3.6 3.6 0 0 1 7.2 0v6zM47 52v-7a4 4 0 0 1 8 0v7z', '#6B7280') + L('M11.6 46.6v3M10 48h3.2M51 46v3.4M49.4 47.6h3.2', '#374151', .9) +
      P('M18 64Q19 49 32 48Q45 49 46 64Z', 'url(#IDsh)') + P('M24 52l3 3-3 3M40 54l-3 2 3 3', '#1E3A8A') +
      L('M21.5 52L16.6 46.6', '#2563EB', 4.2) + L('M42.5 52L47.4 46.6', '#2563EB', 4.2) + O(15.6, 45.4, 2.6, '#4ADE80') + O(48.4, 45.4, 2.6, '#4ADE80') + L('M13.6 43.6l-1-1.4M15.4 42.8l-.4-1.6M17.2 43.2l.4-1.4M50.4 43.6l1-1.4M48.6 42.8l.4-1.6M46.8 43.2l-.4-1.4', '#4ADE80', 1.2) +
      O(32, 34, 10.4, 'url(#IDzb)') + P('M22.8 31C22 24 26.6 22 30 23L32 21.4L34.6 23.2C38.6 22 42.4 25 41.2 31C39.6 27.4 35.6 26.6 32 27.6C28 26.4 24.6 27.6 22.8 31Z', '#3F3F46') +
      O(27.8, 33.6, 3.2, '#fff') + O(36.6, 33.2, 2.4, '#fff') + O(28.3, 34, 1.4, '#B91C1C') + O(36.9, 33.6, 1.1, '#B91C1C') +
      L('M27.4 40.6Q32 43.8 36.8 40.4', '#14532D', 1.2) + P('M29.4 41.6l1 1.4 1-1.2zM33.4 41.6l1 1.2.8-1.4z', '#fff') + L('M38.6 27.6L41 30.6M39 29.6L40.6 28.4M39.8 30.6L41.2 29.6', '#14532D', .7) +
      '</g>' + '<g opacity=".95">' + '<circle cx="32" cy="34" r="12.6" fill="none" stroke="#EF4444" stroke-width="1.6"/>' + L('M32 18.4V24M32 44V49.6M16.4 34H22M42 34H47.6', '#EF4444', 1.6) + O(32, 34, 1, '#EF4444') + '</g>' + fin();
    // Chicken Road : poule astronaute qui saute d'une voie à l'autre entre les vaisseaux
    B.chicken = med('#3B82F6', '#0B1026', '#FDE047', '#A16207', R('IDck', '#FFFFFF', '#F1F5F9', '#CBD5E1') + G('IDsp', '#F472B6', '#9D174D', 0, 1)) +
      '<g clip-path="url(#IDc)">' + O(14, 16, .9, '#fff') + O(50, 12, .8, '#fff') + O(56, 30, .7, '#fff') + O(10, 34, .7, '#fff') +
      P('M4 44H62V54H4zM4 24H62V27H4z', '#334155') + L('M6 49H14M22 49H30M38 49H46M54 49H62', '#FDE047', 1.2) + P('M4 44H62V45H4zM4 53H62V54H4z', '#64748B') +
      '<g transform="translate(8 46)">' + P('M0 3Q2-1 10-1L18 1.6Q20 3 18 4.4L10 7Q2 7 0 3Z', 'url(#IDsp)') + E(10, 2, 3, 1.8, '#7DD3FC') + L('M-1 3H-6', '#22D3EE', 1.6, .8) + '</g>' +
      L('M30 41l-1 4.6M35 41l1 4.6', '#FACC15', 1.4) + L('M27.6 45.6h3M34.6 45.6h3', '#FACC15', 1.2) +
      E(32.5, 33.4, 9.6, 8.6, 'url(#IDck)') + P('M27 33.4Q24 38.6 29 40Q32.6 37.6 31 33.4Z', '#E2E8F0') + P('M41 30q4-2 3.6 3-2.4-.6-3.6-3z', '#F1F5F9') +
      O(31, 22.6, 6.6, 'url(#IDck)') + P('M27.6 16.6q1-3.4 2.6-1.2 1-3 2.6-.6 1.6-2.4 2.4 1.4-2.2 1.6-7.6.4z', '#EF4444') +
      P('M36.6 23.4l4.4 1.4-4.4 1.6z', '#FACC15') + P('M35.4 26.4q1.4 2.6-.4 3.6-1.2-1.6.4-3.6z', '#EF4444') + O(33.6, 21.6, 1.3, '#111827') + O(34, 21.2, .45, '#fff') + O(35, 24.6, 1, '#FB7185', .4) +
      '<circle cx="31.4" cy="22.6" r="8.6" fill="#BAE6FD" fill-opacity=".18" stroke="#E0F2FE" stroke-width=".9"/>' + L('M25.6 18.6Q27.6 15.6 31 15', '#fff', 1.1, .8) +
      '</g>' + tw(48, 18, 2.4, .9) + fin();
    // Tower Stack : tour de dalles brillantes, la dernière tombe pile au-dessus
    B.stack = med('#C4B5FD', '#4C1D95', '#F0ABFC', '#86198F') +
      '<g clip-path="url(#IDc)">' + O(14, 20, .9, '#fff') + O(50, 16, .8, '#fff') + O(52, 30, .7, '#fff') +
      slab(32, 50, 15, 5, ['#93C5FD', '#2563EB', '#1E40AF']) + slab(32, 44, 15, 5, ['#86EFAC', '#16A34A', '#166534']) + slab(32, 38, 15, 5, ['#FDE047', '#CA8A04', '#A16207']) +
      slab(32, 32, 15, 5, ['#F9A8D4', '#DB2777', '#9D174D']) + slab(32, 26, 15, 5, ['#C4B5FD', '#7C3AED', '#5B21B6']) +
      '</g>' + slab(35, 13, 15, 5, ['#67E8F9', '#0891B2', '#155E75']) + L('M18 18v4M50 18v4', '#fff', .9, .6) + tw(53, 10, 2.6) + tw(11, 32, 2, .8) + fin();
    // Sky Hopper : petit héros qui rebondit de nuage en nuage (ressort)
    B.skyhopper = med('#BAE6FD', '#0284C7', '#FDE047', '#CA8A04', G('IDpl', '#F472B6', '#BE185D')) +
      '<g clip-path="url(#IDc)">' + P('M8 26a4 4 0 0 1 6-3.4 5 5 0 0 1 9 1.4 3.4 3.4 0 0 1 0 6.6H10a3.4 3.4 0 0 1-2-4.6z', '#fff', .7) + P('M44 46a4 4 0 0 1 6-3.4 5 5 0 0 1 9 1.4 3.4 3.4 0 0 1 0 6.6H46a3.4 3.4 0 0 1-2-4.6z', '#fff', .8) +
      '<rect x="40" y="18" width="14" height="3.6" rx="1.8" fill="#A78BFA"/>' + '<rect x="12" y="52" width="16" height="4" rx="2" fill="#A78BFA"/>' +
      '<rect x="20" y="47" width="22" height="4.4" rx="2.2" fill="url(#IDpl)"/>' + L('M27.4 47L30 46L24.8 44.6L30 43.2L24.8 41.8L27.4 40.8', '#CBD5E1', 1.5) +
      L('M30 34.6L27.6 38.6', '#1D4ED8', 3.6) + L('M34 34.6L37 38', '#2563EB', 3.6) + E(27.4, 39.4, 2.4, 1.3, '#DC2626') + E(37.6, 38.6, 2.4, 1.3, '#DC2626') +
      '<rect x="27.4" y="24.6" width="9.4" height="11" rx="4" fill="#FACC15"/>' + L('M32 25.6v9', '#CA8A04', .8) +
      L('M28.4 27L23.6 21.6L22.8 18', '#FACC15', 3.2) + O(22.6, 17.4, 1.8, SK) + L('M35.8 27L40.6 21.6L41.4 18', '#EAB308', 3.2) + O(41.6, 17.4, 1.8, SK) +
      face(32, 19, 5.4, 0, L('M29.8 21Q32 24.4 34.2 21Z', '#9F1239', .9)) + P('M26.6 18.6C26 13 29.4 12.6 32 12.6C35 12.6 38.4 13.6 37.4 18.6C36 16.4 34.2 15.8 32.6 16.6C30.4 15.4 28.2 16 26.6 18.6Z', '#7C2D12') +
      '<rect x="27.6" y="14.8" width="8.8" height="2.6" rx="1.3" fill="#22D3EE" stroke="#0E7490" stroke-width=".5"/>' +
      L('M17 44v-4M47 42v-5M14 36v-3', '#fff', 1.1, .7) + '</g>' + tw(51, 30, 2.4, .9) + fin();
    // City Shield : bouclier d'énergie en dôme qui protège la ville colorée des météores
    B.cityshield = med('#4338CA', '#0B1026', '#67E8F9', '#0E7490', R('IDfb', '#FFFFFF', '#FDE047', '#EF4444') + '<linearGradient id="IDtr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F43F5E" stop-opacity="0"/><stop offset="1" stop-color="#FDE047"/></linearGradient>') +
      '<g clip-path="url(#IDc)">' + O(14, 14, .8, '#fff') + O(28, 10, .7, '#fff') + O(50, 24, .8, '#fff') +
      P('M12 60V44h6v16zM26 60V46h5v14zM40 60V42h6v18z', '#7C3AED') + P('M19 60V38h6v22zM32 60V34h7v26zM47 60V47h6v13z', '#4F46E5') +
      P('M13 46h1.6v1.6H13zM15.6 50h1.6v1.6h-1.6zM20.4 40h1.6v1.6h-1.6zM22.6 45h1.6v1.6h-1.6zM20.4 50h1.6v1.6h-1.6zM33.6 37h1.6v1.6h-1.6zM36.4 41h1.6v1.6h-1.6zM33.6 46h1.6v1.6h-1.6zM36.4 51h1.6v1.6h-1.6zM41.6 45h1.6v1.6h-1.6zM43.6 50h1.6v1.6h-1.6zM48.6 50h1.6v1.6h-1.6zM27.6 49h1.6v1.6h-1.6z', '#FDE047') +
      P('M19 38h6v2h-6zM32 34h7v2h-7z', '#EC4899') + P('M40 42h6v2h-6zM12 44h6v2h-6z', '#22D3EE') + P('M4 59H62V64H4z', '#1E1B4B') +
      '<path d="M7 59A25 25 0 0 1 57 59" fill="#22D3EE" fill-opacity=".2" stroke="#67E8F9" stroke-width="2"/>' + '<path d="M11 57A21 21 0 0 1 30 37" stroke="#fff" stroke-opacity=".55" stroke-width="1" fill="none"/>' +
      P('M12 7L23.4 23.6L25.8 22L15 6Z', 'url(#IDtr)') + P('M55 5L44 24L46.6 25L57 6.6Z', 'url(#IDtr)') + O(24.6, 26, 2.6, '#FDE047', .5) + '</g>' +
      '<g transform="translate(45 26)">' + P('M0-7l1.8 4.4 4.6-1.6-2.8 3.8 4.2 2.6-4.8.4.4 4.8-3.4-3.4-3.4 3.4.4-4.8-4.8-.4 4.2-2.6-2.8-3.8 4.6 1.6z', 'url(#IDfb)') + '</g>' + O(24.6, 26, 2.2, '#A8A29E') + O(24, 25.4, .8, '#E7E5E4') + fin();
    // Meteor Blaster : vaisseau qui pulvérise un météore au laser
    B.meteorblast = med('#6D28D9', '#0B1026', '#C4B5FD', '#5B21B6', G('IDsh', '#F8FAFC', '#94A3B8', 0, 1) + R('IDrk', '#D6D3D1', '#78716C', '#3F3F46') + R('IDfb', '#FFFFFF', '#FDE047', '#F43F5E')) +
      '<g clip-path="url(#IDc)">' + O(12, 24, .9, '#fff') + O(22, 12, .7, '#fff') + O(54, 40, .8, '#fff') + O(46, 54, .7, '#fff') +
      O(14, 42, 5, 'url(#IDrk)') + O(12.6, 41, 1.2, '#57534E') + O(16, 44, .9, '#57534E') + O(52, 30, 3.4, 'url(#IDrk)') +
      L('M32 40V18', '#22D3EE', 3.6, .5) + L('M32 40V18', '#fff', 1.4) +
      '<g transform="translate(32 16)">' + P('M0-9l2.4 5.6 6-2-3.6 4.8 5.6 3.2-6.4.6.6 6.2-4.6-4.4-4.6 4.4.6-6.2-6.4-.6 5.6-3.2-3.6-4.8 6 2z', 'url(#IDfb)') + '</g>' + O(22, 12, 1.6, '#A8A29E') + O(42, 10, 1.3, '#78716C') + O(41, 20, 1.1, '#A8A29E') +
      P('M32 36Q37 41 37 50H27Q27 41 32 36Z', 'url(#IDsh)') + P('M27 46l-6 6 1 3 5-2zM37 46l6 6-1 3-5-2z', '#E11D48') + E(32, 44, 2.2, 3, '#38BDF8') + O(31.4, 43, .8, '#fff') +
      P('M28.6 50h6.8l-1.6 6.4h-3.6z', '#FDE047') + P('M30.2 50h3.6l-1 4h-1.6z', '#fff') + '</g>' + fin();
    // Strongman : hercule moustachu qui abat le maillet, la palette monte jusqu'à la cloche
    B.striker = med('#FDA4AF', '#9F1239', '#FDE047', '#A16207', G('IDtw', '#FDE047', '#22C55E', '#3B82F6') + R('IDbl', '#FFFBEB', '#FBBF24', '#A16207')) +
      '<g clip-path="url(#IDc)">' + P('M4 52H62V64H4z', '#7F1D1D') + O(14, 16, 1, '#fff') + O(24, 10, .8, '#fff') +
      '<rect x="44" y="14" width="7" height="40" rx="2" fill="url(#IDtw)"/>' + L('M45.6 20h3.8M45.6 26h3.8M45.6 32h3.8M45.6 38h3.8M45.6 44h3.8', '#fff', .7, .8) + '<rect x="43" y="17" width="9" height="3" rx="1.4" fill="#F43F5E"/>' +
      '<rect x="39" y="51" width="17" height="4" rx="1.4" fill="#78350F"/>' +
      L('M23 42L20 52', SK, 3.8) + L('M28 42L31 52', SK, 3.8) + '<rect x="20.4" y="37.4" width="9.6" height="6" rx="2" fill="#1E3A8A"/>' + E(19.6, 53, 2.6, 1.3, '#111827') + E(31.4, 53, 2.6, 1.3, '#111827') +
      '<rect x="19.4" y="26.6" width="11.6" height="12" rx="4.4" fill="' + SK + '"/>' + P('M21 27h8.4v11.4H21z', '#DC2626') + L('M21 30h8.4M21 33h8.4M21 36h8.4', '#FEE2E2', 1) +
      L('M21 28.6L16.6 22.6L20 15.6', SK, 4) + L('M29.4 28.6L33 22.6L28 15.6', SK, 4) + O(19.4, 21.4, 2.2, '#FFD9C0') +
      L('M24 16V9', '#92400E', 1.8) +
      face(25.2, 21.4, 4.6, 0, L('M23.2 23.8Q25.2 22.6 27.2 23.8', '#3F1D0B', 1.3)) + P('M20.6 20.2C20 15.6 22.6 16 25.2 16C28 16 30.4 16.6 29.8 20.2C28.4 18.4 22.2 18.4 20.6 20.2Z', '#3F1D0B') +
      '</g>' + '<rect x="17.6" y="4.6" width="12.8" height="5.6" rx="1.8" fill="#64748B"/><rect x="17.6" y="4.6" width="12.8" height="1.8" rx=".9" fill="#CBD5E1"/>' + L('M14.6 5.6l-2-1M14.6 9l-2 1M33.4 5.6l2-1M33.4 9l2 1', '#FDE047', 1) + O(47.5, 10.4, 4.2, 'url(#IDbl)') + L('M41 7l-2-2M54 7l2-2M47.5 4.6V2.6', '#FDE047', 1.2) + E(47.5, 30, 3.6, 1.6, '#fff') + fin();
    // Jungle Dash : explorateur qui court vers nous sur le chemin du temple (pastille dorée « » » des jeux de course)
    B.jungledash = med('#99F6E4', '#065F46', '#FBBF24', '#92400E', G('IDtp', '#D6D3D1', '#78716C') + G('IDsh', '#38BDF8', '#0369A1')) +
      '<g clip-path="url(#IDc)">' + P('M20 31h24v-4h-3v-4h-3v-4H26v4h-3v4h-3z', 'url(#IDtp)') + P('M29.5 31v-5a2.5 2.5 0 0 1 5 0v5z', '#292524') + L('M21 27h22M24 23h16', '#57534E', .6) +
      P('M4 20Q12 18 16 26Q10 24 8 30Q14 30 18 36Q10 36 4 40z', '#15803D') + P('M60 18Q52 18 47 26Q54 24 56 30Q50 30 46 36Q54 36 60 42z', '#166534') +
      P('M26 31H38L54 64H10Z', '#E7E5E4') + L('M24 38H40M21 46H43M17 55H47M32 31V64', '#A8A29E', .8) + P('M4 44Q10 40 14 46L10 64H4zM60 44Q54 40 50 46L54 64H60z', '#14532D') +
      L('M29.4 41L26.6 45.6', SK, 3.8) + L('M26.6 45.6L29 49.6', SK, 3.4) + E(29.6, 50.4, 2.4, 1.4, '#57534E') +
      L('M34.6 41L35.8 47.6L35.4 53.6', SK, 3.6) + E(35.6, 54.6, 2.6, 1.5, '#57534E') +
      '<rect x="27" y="37.6" width="10" height="5" rx="1.6" fill="#A16207"/>' +
      '<rect x="27" y="28" width="10" height="11" rx="4" fill="url(#IDsh)"/>' + L('M28.6 28.6L30 38.6M35.4 28.6L34 38.6', '#78350F', 1.1) +
      L('M28 30.6L23.6 35.6L24.6 39.6', SK, 3) + L('M36 30.6L40.4 26.6L41.4 22.6', SK, 3) +
      face(32, 23, 5, 0, L('M30 25Q32 27.2 34 25Z', '#9F1239', .8)) +
      E(32, 19.4, 8.6, 2, '#B08442') + P('M26.8 19.6C26.8 14.4 29.4 13.6 32 13.6C34.6 13.6 37.2 14.4 37.2 19.6Z', '#C9A063') + '<rect x="26.8" y="17.6" width="10.4" height="1.8" fill="#78350F"/>' +
      '</g>' + coinB(42, 19.6, 3.2) + '<g transform="translate(42 2)"><rect width="20" height="12" rx="6" fill="#FBBF24" stroke="#FFF7ED" stroke-width="1.2"/><path d="M6 3.4l3 2.6-3 2.6M11 3.4l3 2.6-3 2.6" stroke="#3B2300" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>' + fin();
    function coinB(x, y, r) { return O(x, f(y + r * .2), r, '#A16207') + O(x, y, r, '#FDE047') + O(x, y, f(r * .62), 'none') + '<circle cx="' + x + '" cy="' + y + '" r="' + f(r * .64) + '" fill="none" stroke="#CA8A04" stroke-width="' + f(r * .16) + '"/>' + O(f(x - r * .35), f(y - r * .35), f(r * .2), '#fff', .9); }
    // Beat Tap : 4 couloirs néon, notes qui descendent vers la ligne à toucher
    B.beattap = med('#9D174D', '#1E1B4B', '#F472B6', '#7E22CE') +
      '<g clip-path="url(#IDc)">' + P('M26 8H38L56 62H8Z', '#0F0A2E', .7) + L('M26 8L8 62M29 8L22 62M32 8V62M35 8L42 62M38 8L56 62', '#A78BFA', .7, .7) +
      '<g transform="translate(0 0)">' + '<rect x="27.4" y="15" width="3.6" height="2.4" rx="1.2" fill="#22D3EE"/><rect x="33.6" y="21" width="5" height="3" rx="1.5" fill="#FDE047"/><rect x="22" y="30" width="7" height="3.6" rx="1.8" fill="#F472B6"/><rect x="37" y="36" width="8.4" height="4" rx="2" fill="#A3E635"/><rect x="24.4" y="42" width="7.4" height="4.2" rx="2.1" fill="#22D3EE"/></g>' +
      L('M8 52H56', '#fff', 1.2, .8) + '<ellipse cx="18" cy="52" rx="6" ry="2.6" fill="none" stroke="#F472B6" stroke-width="1.6"/><ellipse cx="27" cy="52" rx="5" ry="2.4" fill="none" stroke="#22D3EE" stroke-width="1.4"/><ellipse cx="37" cy="52" rx="5" ry="2.4" fill="#FDE047" stroke="#fff" stroke-width="1.4"/><ellipse cx="46" cy="52" rx="6" ry="2.6" fill="none" stroke="#A3E635" stroke-width="1.6"/>' +
      L('M37 49l-3-4M37 49l3-4M37 49v-5', '#FDE047', 1, .9) + '</g>' +
      P('M46.6 11v10.6a3.4 2.8 0 1 1-2-2.4V9.4h1.2q1 3.6 5.4 4.4v1.6q-3-.2-4.6-2z', '#fff') + tw(14, 22, 2.4, .9) + fin();
    // Piano Keys : rangées de touches noires qui tombent, une touchée qui brille, notes de musique
    B.pianokeys = med('#C7D2FE', '#4338CA', '#E2E8F0', '#475569', G('IDtk', '#475569', '#0F172A') + G('IDhi', '#67E8F9', '#0891B2')) +
      '<g clip-path="url(#IDc)">' + P('M14 4H50V64H14z', '#F8FAFC') + L('M23 4V64M32 4V64M41 4V64', '#CBD5E1', .8) +
      '<rect x="14.6" y="6" width="7.8" height="13" rx="1.4" fill="url(#IDtk)"/><rect x="32.6" y="16" width="7.8" height="13" rx="1.4" fill="url(#IDtk)"/><rect x="23.6" y="30" width="7.8" height="13" rx="1.4" fill="url(#IDtk)"/><rect x="41.6" y="42" width="7.8" height="13" rx="1.4" fill="url(#IDhi)"/>' +
      L('M16 8h4M34 18h4M25 32h4', '#94A3B8', .9, .8) + '<circle cx="45.5" cy="48.5" r="6.5" fill="none" stroke="#fff" stroke-width="1.2" opacity=".8"/>' + O(45.5, 48.5, 2, '#fff') +
      P('M4 54H62V64H4z', '#1E1B4B') + L('M14 54H50', '#F43F5E', 1.6) + '</g>' +
      P('M52 16v9.4a3 2.6 0 1 1-1.6-2.2V18.6l-5 1.4v7.4a3 2.6 0 1 1-1.6-2.2V17.6z', '#FDE047') + P('M12.6 30v7a2.6 2.2 0 1 1-1.4-1.9V30z', '#F472B6') + fin();
    // Two-Up : deux pièces d'or lancées au-dessus de la palette en bois (« kip »)
    B.twoup = med('#F0ABFC', '#6B21A8', '#FDE047', '#A16207', R('IDcn', '#FFFBEB', '#FACC15', '#A16207') + G('IDkp', '#D6A06B', '#78350F', 0, 1)) +
      '<g clip-path="url(#IDc)">' + O(14, 16, .9, '#fff') + O(50, 44, .8, '#fff') + P('M4 52Q32 44 62 52V64H4z', '#4C1D95', .6) +
      '<g transform="rotate(-14 32 50)"><rect x="12" y="47" width="34" height="6" rx="3" fill="url(#IDkp)"/><rect x="44" y="48.4" width="12" height="3.2" rx="1.6" fill="#78350F"/>' + O(23, 50, 2.6, '#FDE047', .8) + O(33, 50, 2.6, '#FDE047', .8) + '</g>' +
      L('M23 44L22 36M34 42L38 32', '#fff', 1, .5) + '</g>' +
      O(22, f(26.6), 9, '#A16207') + O(22, 25, 9, 'url(#IDcn)') + '<circle cx="22" cy="25" r="6.6" fill="none" stroke="#CA8A04" stroke-width="1"/>' + P('M17.6 27.6l1-5.4 2.2 2.4 1.2-3.6 1.2 3.6 2.2-2.4 1 5.4z', '#A16207') + L('M16 21Q18.4 17.6 22 17.4', '#fff', 1.2, .8) +
      '<g transform="rotate(24 43 22)">' + E(43, 23.4, 9, 4, '#A16207') + E(43, 22, 9, 4, 'url(#IDcn)') + '<ellipse cx="43" cy="22" rx="6.4" ry="2.6" fill="none" stroke="#CA8A04" stroke-width=".9"/>' + '</g>' + tw(51, 10, 2.4) + tw(10, 38, 1.8, .8) + fin();
    /* --- lot B, 2e série (2026-10-21) --- */
    // cheval au galop / en saut (repère : centre du corps en 0,0, tourné vers la droite), c = [robe, robe ombrée, crinière]
    function horse(c) {
      return P('M-11-2Q-18 0-19.5 8Q-15 4.6-10.6 2Z', c[2]) +
        L('M-6 4L-11.6 9.6L-15.6 11', c[1], 3) + L('M-8.6 3L-14.6 7L-18.6 7.6', c[0], 3.2) + E(-19, 7.6, 1.5, 1.1, '#1F2937') + E(-16, 11.2, 1.5, 1.1, '#1F2937') +
        L('M6 4L10 9L7.4 12.4', c[1], 3) + E(0, 0, 12.4, 6.6, c[0]) + L('M8.6 3L13.6 7L11.6 11', c[0], 3.2) + E(7, 12.8, 1.5, 1.1, '#1F2937') + E(11.2, 11.6, 1.5, 1.1, '#1F2937') +
        P('M5.6-3.6Q9.6-12 15-15.4L19-11Q14-8 11.6-.6Z', c[0]) + '<ellipse cx="18.4" cy="-12.6" rx="5.8" ry="3.1" transform="rotate(32 18.4 -12.6)" fill="' + c[0] + '"/>' +
        P('M13.8-16.2l.4-3.6 2.2 3z', c[1]) + L('M7.4-5Q10.6-12 14.6-15.6', c[2], 2.4) + O(16.8, -14, .85, '#111827') + O(21.4, -9.6, .6, '#111827') + L('M-6-4.6Q0-6.4 6-4.6', '#fff', .8, .35);
    }
    // cavalier assis (même repère que le cheval), j = veste, h = casque
    function rider(j, h, br) {
      return L('M1.4-6L4.6-1L3.4 2.4', br || '#F1F5F9', 2.8) + E(3.6, 3, 1.7, 1.1, '#111827') + L('M1.4-6L4.2-13', j, 4.6) +
        L('M4.2-12L8-9.4L11-8.4', j, 2) + O(11.4, -8.2, 1.1, SK) + L('M11.4-8.2L16.6-12', '#78350F', .5) +
        face(6, -17.2, 3.3, 1, '') + P('M2.6-17.4C2.4-21.8 9.4-21.8 9.4-17.8Z', h) + L('M9.2-17.8L11.2-17.2', h, 1.1);
    }
    // Horse Jumper : cheval bai et cavalière au-dessus de l'obstacle
    B.horsejump = med('#BAE6FD', '#0369A1', '#FDE047', '#A16207') +
      '<g clip-path="url(#IDc)">' + O(48, 16, 4, '#FEF9C3') + P('M8 22a3 3 0 0 1 5-2.4 4 4 0 0 1 7 1.4 2.6 2.6 0 0 1 0 5H9.6a2.6 2.6 0 0 1-1.6-4z', '#fff', .75) +
      P('M4 50Q32 44 62 50V64H4z', '#22C55E') + P('M4 55Q32 50 62 55V64H4z', '#16A34A') +
      '<rect x="20" y="38" width="2.6" height="16" rx="1" fill="#E2E8F0"/><rect x="42" y="38" width="2.6" height="16" rx="1" fill="#E2E8F0"/>' +
      '<rect x="19" y="40" width="27" height="2.6" rx="1.3" fill="#DC2626"/>' + P('M24 40h3v2.6h-3zM31 40h3v2.6h-3zM38 40h3v2.6h-3z', '#fff') + '<rect x="19" y="46" width="27" height="2.6" rx="1.3" fill="#2563EB"/>' + P('M24 46h3v2.6h-3zM31 46h3v2.6h-3zM38 46h3v2.6h-3z', '#fff') +
      '<g transform="translate(31 28) rotate(-12)">' + horse(['#7B4A2E', '#5B3520', '#1F1410']) + '<g transform="translate(-1 2)">' + rider('#1E3A8A', '#111827') + '</g></g>' +
      '</g>' + tw(12, 34, 2.2, .9) + fin();
    // Dice Derby : jockey en casaque rose au galop, gros dé rouge
    B.derby = med('#BAE6FD', '#1D4ED8', '#FDE047', '#A16207', R('IDdi', '#FFFFFF', '#FCA5A5', '#B91C1C')) +
      '<g clip-path="url(#IDc)">' + P('M4 44Q32 40 62 44V64H4z', '#6B3E1F') + L('M4 46Q32 42 62 46', '#FDE047', 1.2) + L('M4 56Q32 52 62 56', '#8B5A2B', .8, .7) +
      L('M6 30H15M8 35H16', '#fff', 1.3, .7) +
      '<g transform="translate(28 32) rotate(-4)">' + horse(['#4A2F22', '#33201A', '#0F0A08']) + '<g transform="translate(-1 2)">' + rider('#EC4899', '#EC4899', '#F8FAFC') + '</g></g>' +
      '</g>' + '<g transform="rotate(-12 48 47)"><rect x="40" y="39.6" width="15" height="15" rx="3.6" fill="#7F1D1D"/><rect x="40" y="38" width="15" height="15" rx="3.6" fill="url(#IDdi)"/>' + O(44, 42, 1.4, '#fff') + O(47.5, 45.5, 1.4, '#fff') + O(51, 49, 1.4, '#fff') + '</g>' + fin();
    // Cricket Live : batteur au casque bleu qui frappe la balle rouge, guichet, stade de nuit
    B.cricketlive = med('#1E40AF', '#0B1026', '#38BDF8', '#1E3A8A', G('IDfd', '#4ADE80', '#15803D')) +
      '<g clip-path="url(#IDc)">' + O(12, 14, 5, '#FEF9C3', .35) + O(52, 14, 5, '#FEF9C3', .35) + O(12, 14, 1.8, '#fff') + O(52, 14, 1.8, '#fff') +
      P('M4 42Q32 36 62 42V64H4z', 'url(#IDfd)') + P('M22 64L27 40H37L42 64Z', '#D9C9A0') +
      L('M15 38V52M18 38V52M21 38V52', '#FDE68A', 1.4) + L('M14.6 37.6h3.2M18 37.6h3.4', '#FBBF24', 1) +
      L('M29 44L27 54.6', '#F8FAFC', 4.6) + L('M34 44L36.4 54.6', '#F8FAFC', 4.6) + L('M26 48h3.6M26 51h3.4M34.6 48h3.6M35.2 51h3.4', '#CBD5E1', .6) + E(26.6, 55.4, 2.4, 1.2, '#1F2937') + E(37, 55.4, 2.4, 1.2, '#1F2937') +
      '<rect x="26.6" y="30" width="10.6" height="15" rx="4" fill="#2563EB"/>' + L('M27 36h10', '#FDE047', 1.2) +
      L('M28 33L35 30.6L40 26.6', '#1D4ED8', 3.2) + L('M36 33L39.4 29L40.6 26.4', '#2563EB', 3.2) + O(40.6, 25.8, 1.9, '#F8FAFC') +
      L('M40.8 25.6L43.6 21.6', '#1F2937', 1.8) + '<rect x="-2.6" y="-14" width="5.2" height="14" rx="2" fill="#FDE68A" stroke="#CA8A04" stroke-width=".5" transform="translate(43.6 21.6) rotate(38)"/>' +
      face(31.8, 24, 4.8, .6, L('M31.4 26.6Q33 27.6 34.6 26.6', '#9F1239', .6)) + P('M26.8 23.4C26.4 17.6 29.6 17.4 32 17.4C35 17.4 37.4 19 37 23.2Z', '#1E3A8A') + L('M26.6 23.2H38.6', '#1E3A8A', 1.4) + L('M33.6 24.6V28.2M36 24.4V27.6M33 27.8h3.6', '#94A3B8', .5, .9) +
      '</g>' + L('M44 31Q48 31 51 29.6', '#fff', 1.2, .5) + O(53.4, 28.6, 2.8, '#DC2626') + L('M52 26.6Q53.6 28.6 52.4 30.6', '#FEE2E2', .5) + tw(54, 44, 2, .8) + fin();
    // Boxing Live : boxeur, gants rouges levés, ring et projecteurs
    B.boxinglive = med('#FB7185', '#4C0519', '#FDE047', '#A16207', R('IDgv', '#FECACA', '#EF4444', '#7F1D1D')) +
      '<g clip-path="url(#IDc)">' + P('M20 4L32 40L44 4Z', '#fff', .12) +
      L('M4 44H62M4 50H62M4 56H62', '#F8FAFC', 1.2, .8) + '<rect x="8" y="40" width="3" height="24" fill="#2563EB"/><rect x="53" y="40" width="3" height="24" fill="#2563EB"/>' +
      P('M18 64Q18 45 32 43.6Q46 45 46 64Z', SK) + P('M24 64V48Q32 51.6 40 48V64Z', '#1D4ED8') + L('M24 48Q32 51.6 40 48', '#FDE047', 1) +
      L('M22.6 49L20 42', SK, 4.6) + L('M41.4 49L44 42', SK, 4.6) +
      '<rect x="28.4" y="37" width="7.2" height="6" fill="' + SK + '"/>' + face(32, 31.6, 7.4, 0, L('M29.6 35.4H34.4', '#9F1239', 1)) + L('M27.4 28.6L30.4 29.6M36.6 28.6L33.6 29.6', '#3F1D0B', 1.3) +
      P('M24.6 30C23.6 23 27.6 22.4 32 22.4C36.6 22.4 40.6 23.4 39.4 30C38 26.6 35.6 25.8 32 26.2C28.6 25.6 26 26.4 24.6 30Z', '#4A2C1A') +
      '</g>' + '<rect x="15.6" y="40" width="7" height="4" rx="1.4" fill="#F8FAFC"/><rect x="41.4" y="40" width="7" height="4" rx="1.4" fill="#F8FAFC"/>' +
      O(18.6, 34, 7, 'url(#IDgv)') + O(45.4, 34, 7, 'url(#IDgv)') + L('M14.6 30.6Q16.6 28 19.6 28.2M41.4 30.6Q43.4 28 46.4 28.2', '#fff', 1.1, .75) + tw(52, 18, 2.6) + tw(12, 20, 1.8, .8) + fin();
    // Maze Muncher : petit monstre violet, grande bouche, qui avale les points du labyrinthe néon
    B.mazechomp = med('#312E81', '#0B1026', '#60A5FA', '#1E3A8A', R('IDmo', '#F5D0FE', '#C084FC', '#6B21A8')) +
      '<g clip-path="url(#IDc)">' + L('M10 16H26V24M38 10V20H54M10 50H22V58M42 46H58M46 46V58', '#3B82F6', 2.6) + L('M10 16H26V24M38 10V20H54M10 50H22V58M42 46H58M46 46V58', '#93C5FD', .8) +
      O(44, 33, 1.6, '#FDE047') + O(50, 33, 1.6, '#FDE047') + O(56, 33, 1.6, '#FDE047') + O(32, 14, 1.4, '#FDE047') + O(16, 30, 1.4, '#FDE047') + O(32, 54, 2.6, '#F472B6') +
      '</g>' + E(29, 46, 10, 2, '#000', .3) + O(29, 34, 11.4, 'url(#IDmo)') + P('M20 26l-2-4 4 2zM38 26l2-4-4 2z', '#A855F7') +
      O(24.8, 28.6, 3.4, '#fff') + O(33.4, 28.6, 3.4, '#fff') + O(25.6, 29, 1.6, '#1F2937') + O(34.2, 29, 1.6, '#1F2937') + O(26, 28.4, .5, '#fff') + O(34.6, 28.4, .5, '#fff') +
      E(29.4, 38.6, 6.4, 4.4, '#3B0764') + E(29.4, 41, 3.6, 1.8, '#F472B6') + P('M25.4 34.6h2.6l-1.3 2.4zM30.8 34.6h2.6l-1.3 2.4z', '#fff') + L('M19.6 27Q22 22.4 27 22', '#fff', 1.1, .6) + fin();
    // Memory Flip : 4 cartes, deux retournées identiques (cœur-diamant), une en train de tourner
    B.memoflip = med('#A5B4FC', '#312E81', '#F0ABFC', '#86198F', G('IDcb', '#8B5CF6', '#4C1D95') + G('IDcf', '#FFFFFF', '#E2E8F0')) +
      '<g clip-path="url(#IDc)">' + O(14, 18, .9, '#fff') + O(52, 50, .8, '#fff') + '</g>' +
      '<g transform="rotate(-8 22 22)"><rect x="13" y="10" width="17" height="22" rx="3" fill="url(#IDcf)" stroke="#CBD5E1" stroke-width=".6"/>' + P('M21.5 26C15.6 22 16.4 16.6 19.4 16.8 20.6 16.9 21.2 17.8 21.5 18.8 21.8 17.8 22.4 16.9 23.6 16.8 26.6 16.6 27.4 22 21.5 26Z', '#E11D48') + '</g>' +
      '<g transform="rotate(8 42 22)"><rect x="34" y="10" width="17" height="22" rx="3" fill="url(#IDcf)" stroke="#CBD5E1" stroke-width=".6"/>' + P('M42.5 26C36.6 22 37.4 16.6 40.4 16.8 41.6 16.9 42.2 17.8 42.5 18.8 42.8 17.8 43.4 16.9 44.6 16.8 47.6 16.6 48.4 22 42.5 26Z', '#E11D48') + '</g>' +
      '<g transform="rotate(-6 22 45)"><rect x="13" y="34" width="17" height="22" rx="3" fill="url(#IDcb)" stroke="#FDE047" stroke-width="1"/>' + P('M21.5 39l4 6-4 6-4-6z', '#FDE047') + P('M21.5 42l2 3-2 3-2-3z', '#7C3AED') + '</g>' +
      '<g transform="rotate(6 42 45)"><rect x="38.6" y="34" width="8" height="22" rx="2" fill="url(#IDcb)" stroke="#FDE047" stroke-width="1"/>' + L('M36 45h-2M50 45h2', '#fff', 1, .7) + '</g>' +
      L('M32 6.6l1 2.6M26 8l1.6 2.2M38 8l-1.6 2.2', '#FDE047', 1.2) + tw(32, 33, 2.4) + fin();
    // Dominoes : deux grands dominos ivoire sur le tapis
    function domB(x, y, rot, a, b) {
      var pp = function (k, oy) { return PIP[k].map(function (q) { return O(f(x + 2 + q[0] * 10), f(y + oy + 2 + q[1] * 10), 1.25, '#111827'); }).join(''); };
      return '<g transform="rotate(' + rot + ' ' + (x + 7) + ' ' + (y + 14) + ')"><rect x="' + (x + .6) + '" y="' + (y + 1.6) + '" width="14" height="28" rx="2.8" fill="#000" opacity=".35"/><rect x="' + x + '" y="' + y + '" width="14" height="28" rx="2.8" fill="url(#IDdm)" stroke="#CBD5E1" stroke-width=".6"/>' +
        L('M' + (x + 2) + ' ' + (y + 14) + 'h10', '#64748B', .8) + O(x + 7, y + 14, 1, '#CA8A04') + pp(a, 0) + pp(b, 14) + L('M' + (x + 2) + ' ' + (y + 2.6) + 'h7', '#fff', .9, .9) + '</g>';
    }
    B.domino = med('#22D3EE', '#164E63', '#FDE047', '#A16207', G('IDdm', '#FFFFFF', '#FEF3C7', '#E7E5E4')) +
      '<g clip-path="url(#IDc)">' + P('M4 50Q32 44 62 50V64H4z', '#155E75', .6) + '</g>' + domB(34, 16, 18, 3, 6) + domB(16, 13, -14, 6, 5) + tw(52, 14, 2.4) + tw(12, 44, 1.8, .8) + fin();
    // Fan-Tan : plateau laqué rouge, tas de perles, gobelet doré soulevé, baguette qui compte par 4
    B.fantan = med('#FCA5A5', '#7F1D1D', '#FDE047', '#A16207', R('IDcu', '#FFFBEB', '#FBBF24', '#92400E') + R('IDbn', '#FFFFFF', '#F1F5F9', '#94A3B8')) +
      '<g clip-path="url(#IDc)">' + '<rect x="11" y="30" width="42" height="26" rx="4" fill="#991B1B" transform="rotate(0)"/><rect x="13" y="32" width="38" height="22" rx="3" fill="#DC2626" stroke="#FBBF24" stroke-width="1"/>' +
      [[22, 44], [25, 42], [28, 45], [24, 47], [31, 43], [29, 48], [34, 46], [26, 45.2], [32, 49], [21, 48]].map(function (q) { return E(q[0], q[1], 1.8, 1.4, 'url(#IDbn)'); }).join('') +
      L('M38 50L50 38', '#D6A06B', 1.6) + E(42, 47, 1.8, 1.4, 'url(#IDbn)') + E(45, 49, 1.8, 1.4, 'url(#IDbn)') + E(47, 46, 1.8, 1.4, 'url(#IDbn)') + E(44.6, 44, 1.8, 1.4, 'url(#IDbn)') +
      '<text x="48" y="54" font-size="6" font-weight="900" font-family="system-ui,sans-serif" fill="#FDE047">4</text>' + '</g>' +
      '<g transform="rotate(-18 34 20)">' + E(34, 27, 11, 3.2, '#92400E') + P('M23 27L26 12H42L45 27Z', 'url(#IDcu)') + E(34, 12, 8, 2.2, '#FDE68A') + L('M26.6 16L28 25', '#fff', 1, .6) + '</g>' + tw(52, 14, 2.4) + fin();
    /* --- lot B, 3e série (2026-10-21) --- */
    // 30 & 40 : deux rangées de cartes « noir » / « rouge » et leurs grands losanges, chiffres dorés
    B.trente = med('#BE123C', '#3B0764', '#FDE047', '#A16207', G('IDrd', '#FB7185', '#9F1239') + G('IDbk', '#64748B', '#0F172A')) +
      card(13, 9, -14, 'K', 's', false, 16, 22) + card(24, 7, 0, '9', 'h', true, 16, 22) + card(35, 9, 14, 'Q', 'd', true, 16, 22) +
      P('M20 34l8 9-8 9-8-9z', 'url(#IDbk)') + P('M44 34l8 9-8 9-8-9z', 'url(#IDrd)') + L('M14.4 42.4l5.6-6.2M38.4 42.4l5.6-6.2', '#fff', .9, .6) +
      '<text x="20" y="46" text-anchor="middle" font-size="7.4" font-weight="900" font-family="system-ui,sans-serif" fill="#FDE047">30</text>' +
      '<text x="44" y="46" text-anchor="middle" font-size="7.4" font-weight="900" font-family="system-ui,sans-serif" fill="#FDE047">40</text>' +
      '<g transform="translate(32 53)">' + P('M-4.2 0l4.2-4.2 4.2 4.2-4.2 4.2z', '#FDE047') + '</g>' + tw(54, 26, 2) + fin();
    // Lucky Ladder : enfant qui grimpe l'échelle dorée vers l'étoile, multiplicateurs sur les barreaux
    B.ladder = med('#7DD3FC', '#4338CA', '#FDE047', '#A16207', G('IDld', '#FDE68A', '#CA8A04', 0, 1) + R('IDst', '#FFFFFF', '#FDE047', '#CA8A04')) +
      '<g clip-path="url(#IDc)">' + P('M8 50a4 4 0 0 1 6-3.4 5 5 0 0 1 9 1.4 3.4 3.4 0 0 1 0 6.6H10a3.4 3.4 0 0 1-2-4.6z', '#fff', .7) + P('M42 54a4 4 0 0 1 6-3.4 5 5 0 0 1 9 1.4 3.4 3.4 0 0 1 0 6.6H44a3.4 3.4 0 0 1-2-4.6z', '#fff', .8) +
      L('M22 64L27 12M42 64L37 12', 'url(#IDld)', 2.6) + L('M23.4 52H40.6M24.6 41H39.4M25.6 30H38.4M26.6 20H37.4', '#FBBF24', 2) +
      '<text x="48" y="43" font-size="5.6" font-weight="900" font-family="system-ui,sans-serif" fill="#fff">×5</text><text x="9" y="33" font-size="5.6" font-weight="900" font-family="system-ui,sans-serif" fill="#FDE047">×10</text>' +
      L('M30 44L28.6 51.6', '#1D4ED8', 3.2) + L('M34 44L36 40.6', '#2563EB', 3.2) + E(28.4, 52.2, 2, 1.1, '#E11D48') + E(36.6, 40.4, 2, 1.1, '#E11D48') +
      '<rect x="27.6" y="33" width="8.8" height="12" rx="3.6" fill="#EC4899"/>' + L('M28.6 35L27 30.4M35.4 35L37.2 23', SK, 2.6) + O(27, 30, 1.5, SK) + O(37.2, 22.4, 1.5, SK) +
      face(32, 28.4, 4.6, .4) + P('M27.2 28C26.6 23 29.6 22.8 32 22.8C34.6 22.8 37.2 24 36.6 27.6C35 26 33 25.6 31.6 26.4C30 25.6 28.4 26.2 27.2 28Z', '#5B3A1E') +
      '</g>' + '<path d="' + star(32, 9.6, 6.4, 2.8) + '" fill="url(#IDst)" stroke="#fff" stroke-width=".6"/>' + tw(46, 16, 2) + fin();
    // Cups & Balls : trois gobelets rouges, celui du milieu soulevé sur la balle jaune, baguette magique
    function cupB(x, y, c1, c2) { return E(x, y + 12, 7.4, 1.8, '#000', .3) + P('M' + (x - 7) + ' ' + (y + 12) + 'L' + (x - 4.6) + ' ' + y + 'H' + (x + 4.6) + 'L' + (x + 7) + ' ' + (y + 12) + 'Z', c1) + E(x, y + 12, 7, 1.6, c2) + E(x, y, 4.6, 1.2, c2) + L('M' + (x - 6) + ' ' + (y + 8.6) + 'H' + (x + 6), '#FDE047', 1) + L('M' + (x - 3.6) + ' ' + (y + 2) + 'L' + (x - 4.8) + ' ' + (y + 9), '#fff', .9, .6); }
    B.cups = med('#93C5FD', '#1E3A8A', '#FDE047', '#A16207', G('IDcp', '#F87171', '#991B1B', 0, 1) + R('IDbl', '#FFFFFF', '#FDE047', '#CA8A04')) +
      '<g clip-path="url(#IDc)">' + P('M4 46H62V64H4z', '#1E40AF') + L('M4 46H62', '#60A5FA', 1) + '</g>' +
      cupB(15, 33, 'url(#IDcp)', '#7F1D1D') + cupB(49, 33, 'url(#IDcp)', '#7F1D1D') + O(32, 42.6, 3.6, 'url(#IDbl)') + E(32, 46.2, 3.6, .9, '#000', .3) +
      '<g transform="rotate(-10 32 24)">' + cupB(32, 18, 'url(#IDcp)', '#7F1D1D') + '</g>' +
      L('M40 58L54 46', '#111827', 2.4) + L('M52.4 47.4L54 46', '#fff', 2.4) + L('M28 36l-2-2M36 36l2-2M32 35v-3', '#FDE047', 1, .9) + tw(12, 18, 2.2) + tw(52, 20, 1.8, .8) + fin();
    // Thimbles : trois dés à coudre dorés sur le velours, l'un soulevé sur la perle bleue
    function thB(x, y) { return E(x, y + 11, 6, 1.5, '#000', .3) + P('M' + (x - 5.6) + ' ' + (y + 11) + 'Q' + (x - 6) + ' ' + y + ' ' + x + ' ' + (y - 1) + 'Q' + (x + 6) + ' ' + y + ' ' + (x + 5.6) + ' ' + (y + 11) + 'Z', 'url(#IDth)') + E(x, y + 11, 5.6, 1.4, '#A16207') + '<g fill="#92400E" opacity=".55">' + [[-2.4, 3], [0, 2.4], [2.4, 3], [-3, 6], [-1, 5.6], [1, 5.6], [3, 6], [-2, 8.6], [0, 8.4], [2, 8.6]].map(function (q) { return '<circle cx="' + f(x + q[0]) + '" cy="' + f(y + q[1]) + '" r=".55"/>'; }).join('') + '</g>' + L('M' + (x - 3.6) + ' ' + (y + 2) + 'Q' + (x - 4.4) + ' ' + (y + 5) + ' ' + (x - 4.2) + ' ' + (y + 9), '#fff', .9, .7); }
    B.thimbles = med('#C084FC', '#3B0764', '#FDE047', '#A16207', G('IDth', '#FEF9C3', '#FACC15', '#A16207', 1) + R('IDpl', '#FFFFFF', '#7DD3FC', '#1D4ED8')) +
      '<g clip-path="url(#IDc)">' + P('M4 44H62V64H4z', '#6B21A8') + L('M4 44H62', '#C084FC', 1) + '</g>' +
      thB(15, 32) + thB(49, 32) + O(32, 42.4, 3.2, 'url(#IDpl)') + E(32, 45.6, 3.2, .8, '#000', .3) + '<g transform="rotate(12 32 22)">' + thB(32, 16) + '</g>' +
      L('M27 37l-2-2M37 37l2-2', '#FDE047', 1) + tw(12, 20, 2.2) + tw(52, 18, 2) + fin();
    // Crab Shells : crabe rouge souriant, trois coquillages, l'un soulevé sur la perle
    function shB(x, y, c) { return E(x, y + 7, 7, 1.6, '#000', .25) + P('M' + (x - 7) + ' ' + (y + 6) + 'Q' + (x - 7) + ' ' + (y - 5) + ' ' + x + ' ' + (y - 5) + 'Q' + (x + 7) + ' ' + (y - 5) + ' ' + (x + 7) + ' ' + (y + 6) + 'Z', c) + L('M' + x + ' ' + (y - 4.4) + 'V' + (y + 6) + 'M' + x + ' ' + (y - 4) + 'L' + (x - 4.6) + ' ' + (y + 6) + 'M' + x + ' ' + (y - 4) + 'L' + (x + 4.6) + ' ' + (y + 6), '#BE185D', .6, .6) + '<rect x="' + (x - 3) + '" y="' + (y + 5) + '" width="6" height="2.4" rx="1" fill="#F9A8D4"/>'; }
    B.shells = med('#67E8F9', '#1E40AF', '#FDE047', '#A16207', G('IDsh', '#FBCFE8', '#EC4899') + R('IDcr', '#FECACA', '#EF4444', '#991B1B') + R('IDpl', '#FFFFFF', '#F1F5F9', '#C4B5FD')) +
      '<g clip-path="url(#IDc)">' + P('M4 46Q32 40 62 46V64H4z', '#FDE68A') + O(12, 52, .8, '#CA8A04') + O(50, 56, .8, '#CA8A04') + O(30, 58, .7, '#CA8A04') +
      shB(15, 45, 'url(#IDsh)') + shB(49, 45, 'url(#IDsh)') + O(32, 49.6, 2.8, 'url(#IDpl)') + '</g>' + '<g transform="rotate(-16 36 42)">' + shB(36, 39, 'url(#IDsh)') + '</g>' +
      L('M22 26L14 20M42 26L50 20', '#DC2626', 2.4) + P('M14 20q-6-2-4-8 3 4 6 3-2 3-2 5zM50 20q6-2 4-8-3 4-6 3 2 3 2 5z', 'url(#IDcr)') +
      L('M24 30l-5 3M24 33l-5 4M40 30l5 3M40 33l5 4', '#B91C1C', 1.6) + E(32, 30, 9.6, 6.6, 'url(#IDcr)') + L('M28 24l-1-5M36 24l1-5', '#B91C1C', 1.2) + O(27, 18.6, 2.2, '#fff') + O(37, 18.6, 2.2, '#fff') + O(27.4, 18.8, 1.1, '#111827') + O(37.4, 18.8, 1.1, '#111827') +
      L('M29 31.6Q32 34 35 31.6', '#7F1D1D', 1) + O(26.6, 30, 1.2, '#FDA4AF', .7) + O(37.4, 30, 1.2, '#FDA4AF', .7) + L('M25.6 27Q28 25 31 25', '#fff', .9, .6) + fin();
    // Lucky Nails : main claire aux ongles roses brillants, flacon de vernis, paillettes
    B.nails = med('#FBCFE8', '#9D174D', '#FDE047', '#A16207', G('IDnl', '#F9A8D4', '#BE185D') + G('IDbt', '#F472B6', '#831843')) +
      '<g clip-path="url(#IDc)">' + O(14, 18, .9, '#fff') + O(50, 50, .9, '#fff') +
      '<rect x="40" y="30" width="12" height="18" rx="3.4" fill="url(#IDbt)"/><rect x="42.6" y="20" width="6.8" height="10.6" rx="1.6" fill="#1F2937"/>' + L('M42.4 33V45', '#fff', 1.2, .55) + '<rect x="40" y="38" width="12" height="3" fill="#FDE047" opacity=".85"/>' +
      P('M14 58Q12 46 16 40L18 30Q18.6 27.6 20.6 28.2Q22.2 28.8 22 31L21.4 37 23 24Q23.6 21.6 25.6 22 27.6 22.4 27.4 25L26.6 36 28.4 22Q29 19.6 31 20 33 20.4 32.8 23L31.6 36.4 33.6 25.6Q34.2 23.4 36 23.8 37.8 24.4 37.4 26.6L35.6 40Q38 37 40.6 37.6 42 38.6 40.6 40.6L35 48Q32 54 30 58Z', SK) +
      [[20.3, 29.6, -8], [25.3, 23.6, -6], [30.6, 21.6, 0], [35.6, 25.4, 6]].map(function (q) { return '<ellipse cx="' + q[0] + '" cy="' + q[1] + '" rx="1.8" ry="2.6" transform="rotate(' + q[2] + ' ' + q[0] + ' ' + q[1] + ')" fill="url(#IDnl)"/>' + O(f(q[0] - .5), f(q[1] - 1), .5, '#fff', .9); }).join('') +
      L('M18 44Q22 42 26 44', '#EBB394', .6, .7) + '</g>' + tw(48, 14, 2.4) + tw(12, 30, 2, .9) + tw(54, 54, 1.6, .8) + fin();
    // Koi Fortune : deux carpes (rouge et blanche / dorée) qui tournent dans l'étang bleu, fleur de lotus rose
    function koiB(c, spot) { return P('M-11 0L-17.6-5.4Q-15.2 0-17.6 5.4Z', c) + P('M-12 0Q-4-6.4 6-4.4Q12.4-2.6 12.4 0Q12.4 2.6 6 4.4Q-4 6.4-12 0Z', c) + P('M-2-4.6Q0-8.6 4-9Q3-6 2-4.4zM-2 4.6Q0 8.6 4 9Q3 6 2 4.4z', c, .85) + (spot || '') + O(8, -1.6, 1, '#111827') + L('M12.2 1.4L14 2.6', '#B91C1C', .6) + L('M-6-2.6Q0-4.6 6-3.4', '#fff', .8, .55); }
    B.koi = med('#7DD3FC', '#1E3A8A', '#FDE047', '#A16207', G('IDgk', '#FEF9C3', '#FACC15')) +
      '<g clip-path="url(#IDc)">' + '<circle cx="32" cy="33" r="18" fill="none" stroke="#BAE6FD" stroke-width=".8" opacity=".5"/><circle cx="32" cy="33" r="11" fill="none" stroke="#BAE6FD" stroke-width=".6" opacity=".4"/>' + '</g>' +
      '<g transform="translate(26 22) rotate(-160)">' + koiB('#F8FAFC', P('M-6-3.6Q0-1 2-4.6Q-2-6-6-3.6zM2 1Q5 4 8 1.6Q5-1 2 1z', '#DC2626')) + '</g>' +
      '<g transform="translate(38 44) rotate(20)">' + koiB('url(#IDgk)', P('M-5 2Q0 4.6 4 1.6Q0-1-5 2z', '#E11D48', .8)) + '</g>' +
      '<g transform="translate(47 22)">' + [0, 72, 144, 216, 288].map(function (a) { return '<ellipse cx="0" cy="-4" rx="2.6" ry="4.4" fill="#F9A8D4" transform="rotate(' + a + ')"/>'; }).join('') + O(0, 0, 2.2, '#FDE047') + '</g>' +
      O(16, 44, 1.4, '#fff', .5) + O(19, 48, 1, '#fff', .5) + tw(14, 30, 1.8, .8) + fin();
    // Dreidel : toupie bleu et argent qui tourne, lettre dorée, pièces en chocolat
    B.dreidel = med('#93C5FD', '#1E3A8A', '#E2E8F0', '#475569', G('IDdl', '#60A5FA', '#1D4ED8', 0, 1) + G('IDdr', '#1E40AF', '#172554', 0, 1) + R('IDgc', '#FFFBEB', '#FBBF24', '#A16207')) +
      '<g clip-path="url(#IDc)">' + O(14, 18, .9, '#fff') + O(50, 14, .8, '#fff') + L('M10 48Q32 58 54 48', '#BFDBFE', 1.4, .5) + L('M14 53Q32 61 50 53', '#BFDBFE', 1, .4) + '</g>' +
      '<g transform="rotate(10 32 32)">' + '<rect x="30.4" y="8" width="3.2" height="8" rx="1.4" fill="#CBD5E1"/>' + P('M22 16H32V36H22z', 'url(#IDdl)') + P('M32 16H42V36H32z', 'url(#IDdr)') + P('M22 36H32L32 50Z', '#2563EB') + P('M32 36H42L32 50Z', '#1E3A8A') +
      L('M22 16H42', '#BFDBFE', 1.2) + '<path d="M24.6 21.6H29.4V31.4M24.6 31.4H29.4" stroke="#FDE047" stroke-width="1.8" fill="none" stroke-linecap="round"/>' + L('M23.6 18v15', '#fff', .9, .5) + '</g>' +
      O(15, 50, 5, '#A16207') + O(15, 49, 5, 'url(#IDgc)') + '<circle cx="15" cy="49" r="3.4" fill="none" stroke="#A16207" stroke-width=".7"/>' + O(49, 51, 4.4, '#A16207') + O(49, 50, 4.4, 'url(#IDgc)') + '<circle cx="49" cy="50" r="3" fill="none" stroke="#A16207" stroke-width=".7"/>' + tw(50, 24, 2.2) + fin();
    /* --- lot B, 4e série (2026-10-21) --- */
    // Robo Boxing : petit robot argenté aux gros gants qui frappe, « POW » doré
    B.robobox = med('#38BDF8', '#312E81', '#FDE047', '#A16207', G('IDrb', '#F1F5F9', '#94A3B8') + R('IDgr', '#FECACA', '#EF4444', '#7F1D1D') + R('IDgb', '#BFDBFE', '#3B82F6', '#1E3A8A')) +
      '<g clip-path="url(#IDc)">' + L('M4 46H62M4 52H62', '#F8FAFC', 1.2, .7) + '<rect x="6" y="42" width="3" height="22" fill="#E11D48"/><rect x="55" y="42" width="3" height="22" fill="#E11D48"/>' +
      L('M26 46V56M36 46V56', '#64748B', 4) + E(25.6, 57, 3, 1.4, '#334155') + E(36.4, 57, 3, 1.4, '#334155') +
      '<rect x="22" y="33" width="18" height="15" rx="4" fill="url(#IDrb)"/>' + O(31, 40, 3, '#0EA5E9') + O(31, 40, 1.4, '#E0F2FE') +
      L('M23 37L17 40L13 38', '#94A3B8', 3) + L('M39 37L44 33L49 30', '#94A3B8', 3) + '</g>' +
      L('M31 14V9', '#64748B', 1.2) + O(31, 8.4, 1.8, '#EF4444') + '<rect x="21" y="14" width="20" height="16" rx="5" fill="url(#IDrb)"/>' + '<rect x="24" y="18" width="14" height="7" rx="3.4" fill="#0F172A"/>' + O(28, 21.6, 1.8, '#22D3EE') + O(34, 21.6, 1.8, '#22D3EE') + L('M28.4 27.4H33.6', '#475569', 1) + L('M23 16.4Q26 15 30 15.2', '#fff', 1, .7) +
      O(12, 39, 5.4, 'url(#IDgb)') + O(50, 28, 6.4, 'url(#IDgr)') + L('M46.6 25Q48 23 51 23.2M9.6 36.6Q10.6 35 12.6 35', '#fff', 1, .7) +
      '<g transform="translate(51 46)">' + P('M0-7l2 4.6 5-1.4-3 4 4.4 2.8-5 .4.2 5-3.6-3.6-3.6 3.6.2-5-5-.4 4.4-2.8-3-4 5 1.4z', '#FDE047') + '<text x="0" y="1.8" text-anchor="middle" font-size="4" font-weight="900" font-family="system-ui,sans-serif" fill="#B91C1C">POW</text></g>' + fin();
    // Oracle Ball : voyante au foulard violet, mains autour de la boule de cristal lumineuse
    B.oracle = med('#7C3AED', '#1E1B4B', '#F0ABFC', '#86198F', R('IDcb', '#FFFFFF', '#A5F3FC', '#6366F1') + G('IDsc', '#C026D3', '#581C87')) +
      '<g clip-path="url(#IDc)">' + O(14, 16, .9, '#fff') + O(52, 20, .8, '#fff') + O(46, 10, .7, '#fff') +
      P('M14 64Q14 44 32 42Q50 44 50 64Z', 'url(#IDsc)') + L('M20 52H44', '#FDE047', 1, .7) +
      face(32, 28, 7.4, 0, L('M29.6 31.6Q32 33.6 34.4 31.6', '#9F1239', .9)) + L('M27.6 26.4Q29 25.4 30.4 26.4M33.6 26.4Q35 25.4 36.4 26.4', '#111827', .9) +
      P('M23 31C21.6 20 26 16.6 32 16.6C38 16.6 42.4 20 41 31C40.4 25 37.4 22 32 22C26.6 22 23.6 25 23 31Z', 'url(#IDsc)') + P('M22.6 30Q20 40 23 44L26 36Z', '#581C87') + P('M41.4 30Q44 40 41 44L38 36Z', '#581C87') +
      '<rect x="24" y="20.6" width="16" height="2.4" rx="1.2" fill="#FDE047"/>' + O(32, 21.8, 1.6, '#22D3EE') +
      '</g>' + '<rect x="23" y="55" width="18" height="4" rx="1.6" fill="#A16207"/>' + O(32, 46, 10, '#A5F3FC', .25) + O(32, 47, 8.6, 'url(#IDcb)') + L('M27.4 44.4Q28.6 41 32 40.4', '#fff', 1.2, .85) + tw(34, 48, 2) +
      L('M21 52Q22 46 25 47M43 52Q42 46 39 47', SK, 3) + tw(52, 34, 2.2) + tw(12, 30, 1.8, .8) + fin();
    // Steampunk : dirigeable en laiton, hélice et engrenages, ciel cuivré
    function gear(x, y, r, c) { var d = ''; for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4; d += '<rect x="' + f(x - r * .2) + '" y="' + f(y - r * 1.25) + '" width="' + f(r * .4) + '" height="' + f(r * .5) + '" fill="' + c + '" transform="rotate(' + (i * 45) + ' ' + x + ' ' + y + ')"/>'; } return d + O(x, y, r, c) + O(x, y, f(r * .4), '#1E1B4B'); }
    B.steampunk = med('#C4B5FD', '#4C1D95', '#FDE047', '#A16207', G('IDbz', '#FDE68A', '#B45309', '#78350F') + G('IDbr', '#CA8A04', '#713F12')) +
      '<g clip-path="url(#IDc)">' + P('M6 26a4 4 0 0 1 6-3.4 5 5 0 0 1 9 1.4 3.4 3.4 0 0 1 0 6.6H8a3.4 3.4 0 0 1-2-4.6z', '#fff', .55) + gear(14, 52, 6, '#A16207') + gear(50, 54, 5, '#CA8A04') + '</g>' +
      E(32, 24, 19, 9, 'url(#IDbz)') + L('M15 24H49M18 19Q32 16 46 19M18 29Q32 32 46 29', '#78350F', .8, .7) + L('M20 19Q28 16.4 36 17', '#fff', 1.1, .6) +
      P('M12 24L7 18V30Z', '#92400E') + L('M24 32L26 38M40 32L38 38', '#78350F', .9) + '<rect x="24" y="37" width="16" height="7" rx="2.4" fill="url(#IDbr)"/>' + O(28, 40.4, 1.4, '#7DD3FC') + O(32, 40.4, 1.4, '#7DD3FC') + O(36, 40.4, 1.4, '#7DD3FC') +
      L('M51 24H54', '#57534E', 1.4) + E(55, 24, 1.4, 6, '#CBD5E1') + gear(32, 52, 4.4, '#FBBF24') + P('M44 40a2 2 0 0 1 3-1.6 2.6 2.6 0 0 1 4.4.8 1.6 1.6 0 0 1 0 3.2H45a1.6 1.6 0 0 1-1-2.4z', '#E7E5E4', .8) + tw(50, 12, 2.2) + fin();
    // Gold Train : locomotive rouge et wagon plein de lingots d'or, fumée, rails
    B.goldtrain = med('#7DD3FC', '#1D4ED8', '#FDE047', '#A16207', G('IDlo', '#F87171', '#991B1B', 0, 1) + G('IDgb', '#FEF08A', '#CA8A04', 0, 1)) +
      '<g clip-path="url(#IDc)">' + P('M4 48Q32 44 62 48V64H4z', '#6D28D9', .55) + L('M4 54H62', '#57534E', 2) + L('M8 55.6V58M14 55.6V58M20 55.6V58M26 55.6V58M32 55.6V58M38 55.6V58M44 55.6V58M50 55.6V58M56 55.6V58', '#78350F', 1.6) + '</g>' +
      O(17, 14, 3.4, '#F1F5F9', .9) + O(13, 9, 2.6, '#F1F5F9', .7) + O(22, 11, 2.2, '#F1F5F9', .7) +
      '<rect x="15" y="17" width="5" height="9" rx="1" fill="#1F2937"/><rect x="13.6" y="16" width="7.8" height="2.4" rx="1" fill="#334155"/>' +
      '<rect x="10" y="26" width="22" height="14" rx="4" fill="url(#IDlo)"/>' + '<rect x="24" y="18" width="10" height="22" rx="2" fill="#B91C1C"/><rect x="26" y="21" width="6" height="6" rx="1.2" fill="#BAE6FD"/>' + '<rect x="9" y="38" width="27" height="4" rx="1.4" fill="#1F2937"/>' + P('M6 42L10 36V42Z', '#FDE047') + O(11, 31, 2.4, '#FDE047') +
      O(15, 45, 3.6, '#1F2937') + O(15, 45, 1.6, '#FBBF24') + O(29, 45, 3.6, '#1F2937') + O(29, 45, 1.6, '#FBBF24') +
      '<rect x="37" y="30" width="20" height="10" rx="2" fill="#1E40AF"/>' + P('M38 30l3-4h4l2 4zM44 30l3-5h4l2 5zM40 26.4l3-3.6h4l1.6 3.6z', 'url(#IDgb)') + '<rect x="36" y="38" width="22" height="4" rx="1.4" fill="#1F2937"/>' + O(42, 45, 3.2, '#1F2937') + O(42, 45, 1.4, '#FBBF24') + O(52, 45, 3.2, '#1F2937') + O(52, 45, 1.4, '#FBBF24') + tw(52, 18, 2.4) + tw(44, 14, 1.6, .8) + fin();
    // Horseshoes : fer à cheval doré qui tourne autour du piquet, étoiles
    B.horseshoe = med('#A5B4FC', '#3730A3', '#FDE047', '#A16207', G('IDhs', '#FEF9C3', '#FACC15', '#A16207', 1)) +
      '<g clip-path="url(#IDc)">' + E(32, 52, 22, 6, '#D6B98C') + E(32, 52, 14, 3.6, '#B08F5E') + '</g>' +
      '<rect x="30.4" y="30" width="3.2" height="23" rx="1.4" fill="#78716C"/>' + L('M31.4 31V51', '#D6D3D1', .8) +
      '<path d="M18 46A14 6 0 0 1 46 46" stroke="#fff" stroke-width="1" fill="none" stroke-dasharray="2 2" opacity=".6"/>' +
      '<g transform="translate(6 9) scale(.78)"><g transform="rotate(-24 28 22)"><path d="M20 30C17 20 20 11 28 11C36 11 39 20 36 30" stroke="url(#IDhs)" stroke-width="5.4" fill="none" stroke-linecap="round"/>' + '<g fill="#92400E">' + [[19.6, 26], [19.6, 20], [22.6, 14.6], [36.4, 26], [36.4, 20], [33.4, 14.6]].map(function (q) { return '<circle cx="' + q[0] + '" cy="' + q[1] + '" r=".8"/>'; }).join('') + '</g>' + L('M20.6 22Q21 14 26 12.4', '#fff', 1, .7) + '</g></g>' +
      tw(48, 18, 2.6) + tw(14, 36, 2, .9) + tw(46, 34, 1.6, .7) + fin();
    // Lantern Festival : lanternes rouges qui s'envolent au-dessus du fleuve de nuit
    function lanB(x, y, s) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' + '<rect x="-5" y="-6" width="10" height="12" rx="4" fill="url(#IDln)"/>' + L('M-5-2H5M-5 2H5', '#7F1D1D', .5, .6) + '<rect x="-3" y="-7" width="6" height="1.6" rx=".6" fill="#FBBF24"/><rect x="-3" y="5.6" width="6" height="1.6" rx=".6" fill="#FBBF24"/>' + L('M0 7V10', '#FBBF24', .8) + O(-1.6, -2, 1.4, '#fff', .45) + '</g>'; }
    B.lantern = med('#312E81', '#0B1026', '#FCA5A5', '#991B1B', R('IDln', '#FEF3C7', '#F43F5E', '#991B1B')) +
      '<g clip-path="url(#IDc)">' + O(46, 14, 4, '#FEF9C3') + O(14, 22, .8, '#fff') + O(22, 12, .7, '#fff') +
      P('M4 46h6l3-4 3 4h4l3-6 4 6h6l3-3 3 3h6l3-5 4 5h6v4H4z', '#1E1B4B') + P('M4 50H62V64H4z', '#1E3A8A') + L('M10 54h8M24 57h10M40 54h8M18 60h6M44 60h8', '#FDE047', .9, .6) +
      lanB(20, 22, .9) + lanB(42, 30, .7) + lanB(14, 38, .55) + lanB(51, 42, .45) + '</g>' + lanB(31, 18, 1.15) + fin();
    // Big Catch : pêcheur au ciré jaune dans sa barque, canne pliée, gros poisson qui saute
    B.fishing = med('#7DD3FC', '#1E40AF', '#FDE047', '#A16207', G('IDfs', '#5EEAD4', '#0F766E') + G('IDbt', '#B45309', '#78350F', 0, 1)) +
      '<g clip-path="url(#IDc)">' + O(48, 16, 4, '#FEF9C3') + P('M4 42Q12 40 20 42T36 42T52 42T62 42V64H4z', '#2563EB') + P('M4 48Q14 46 24 48T44 48T62 48V64H4z', '#1E3A8A') +
      P('M8 40H30L27 47H11Z', 'url(#IDbt)') + L('M8 40H30', '#FDE68A', 1) +
      L('M19 39L20.6 33', '#1D4ED8', 3.4) + '<rect x="15" y="27" width="8.4" height="10" rx="3.4" fill="#FACC15"/>' + L('M21.6 30L25 28L27.6 25.6', '#FACC15', 2.8) + O(27.8, 25.4, 1.5, SK) +
      face(19, 22.6, 4.4, .6) + P('M13.6 21.6Q14 15.6 19 15.6Q24 15.6 24.4 21.6Q19 19.6 13.6 21.6Z', '#FACC15') + L('M13 21.4H25', '#EAB308', 1.2) +
      '<path d="M27 26.6Q40 8 48 22" stroke="#78350F" stroke-width="1.2" fill="none"/>' + L('M48 22L46 32', '#E2E8F0', .5) + '</g>' +
      '<g transform="translate(46 37) rotate(-30)">' + P('M-9 0Q-2-6 7-3.6Q11-1.6 11 0Q11 1.6 7 3.6Q-2 6-9 0Z', 'url(#IDfs)') + P('M-8 0L-14-5Q-12 0-14 5Z', '#14B8A6') + P('M-1-4.4Q1-8 5-8Q3-5.6 2-3.8Z', '#2DD4BF') + O(6, -1.2, 1, '#111827') + L('M-5-2Q0-4 5-2.6', '#fff', .7, .6) + '</g>' +
      O(52, 46, 1.4, '#fff', .7) + O(40, 46, 1, '#fff', .7) + O(55, 41, .9, '#fff', .7) + fin();
    // Goal : attaquant qui frappe, ballon qui file dans les filets
    B.goal = med('#38BDF8', '#1E3A8A', '#FDE047', '#A16207', G('IDpt', '#4ADE80', '#15803D')) +
      '<g clip-path="url(#IDc)">' + P('M4 44Q32 40 62 44V64H4z', 'url(#IDpt)') + P('M4 52Q32 48 62 52V56Q32 52 4 56z', '#166534', .35) +
      '<path d="M36 44V20H58" stroke="#F8FAFC" stroke-width="2" fill="none"/>' + L('M40 20V44M44 20V44M48 20V44M52 20V44M56 20V44M36 25H60M36 30H60M36 35H60M36 40H60', '#CBD5E1', .45, .55) +
      L('M19 41L14 47L10 46', SK, 3.4) + L('M21 41L25.6 47.6', SK, 3.4) + E(9.6, 46.4, 2.2, 1.2, '#111827') + E(26.4, 48.4, 2.2, 1.2, '#111827') +
      '<rect x="16" y="35.6" width="8.6" height="6" rx="2" fill="#F8FAFC"/>' + '<rect x="15.6" y="25" width="9.4" height="12" rx="3.6" fill="#DC2626"/>' + '<text x="20.3" y="33.6" text-anchor="middle" font-size="5" font-weight="900" font-family="system-ui,sans-serif" fill="#fff">9</text>' +
      L('M16.6 27.6L12 32L10.6 35', SK, 2.6) + L('M24 27.6L28 25L31 26.6', SK, 2.6) +
      face(20.6, 20, 4.6, .6) + P('M15.8 19.4C15.2 14.4 18.4 14 20.8 14C23.6 14 26 15.4 25.4 19C24 17.4 22 17 20.4 17.6C18.8 17 17 17.6 15.8 19.4Z', '#3F2A1A') + '</g>' +
      L('M28 48Q38 40 44 31', '#fff', 1.2, .5) + '<g transform="translate(46 29)">' + O(0, 0, 4.2, '#fff') + P('M0-1.6l1.5 1.1-.6 1.8h-1.8l-.6-1.8z', '#111827') + P('M-4-.8l1.5-.5.7 1.5-.9 1.3-1.4-.3zM4-.8l-1.5-.5-.7 1.5.9 1.3 1.4-.3zM0-4.2l-1.4.8.2 1.1 1.2-.4 1.2.4.2-1.1z', '#111827', .85) + '</g>' + tw(52, 14, 2.2) + fin();
    Object.keys(B).forEach(function (k) { var s = B[k]; OBJ[k] = function () { return s; }; });
  })();
  OBJ.rps = function () {
    return '<g transform="translate(-2 20) scale(.52)">' + rpsSvg(0) + '</g><g transform="translate(17 -2) scale(.52)">' + rpsSvg(1) + '</g><g transform="translate(34 22) scale(.52)">' + rpsSvg(2) + '</g>';
  };
  // 2026-10-22 (propriétaire : « certains logos ne rentrent pas dans le rond ») : le dessin posé SUR le médaillon (après son
  // contour r = 26,5) est ramené à 86 % autour du centre — voiture, badges, cases du bas restent dans le rond. Médaillon inchangé.
  var FIT_MK = /<circle cx="32" cy="33" r="26\.5" fill="none"[^>]*\/>/;
  // seulement les logos qui débordaient (les autres restent exactement comme avant)
  var FIT_D = { mines: [5, 2.5] }; // dessin décalé : recentré (dx, dy)
  var FIT_X = { mines: 0.92, race: 0.86, cryptox: 0.86, pegdrop: 0.86, plinko: 0.86, plinko2: 0.86, wheel2: 0.74, moneywheel: 0.8, claw: 0.8 };
  function fitIn(s, k) {
    if (!FIT_X[k]) return s;
    var m = FIT_MK.exec(s); if (!m) return s;
    var i = m.index + m[0].length, tail = s.slice(i);
    if ((tail.match(/<g[\s>]/g) || []).length !== (tail.match(/<\/g>/g) || []).length) return s; // contour dans un groupe : on ne touche pas
    return s.slice(0, i) + '<g transform="translate(' + (32 + (FIT_D[k] ? FIT_D[k][0] : 0)) + ' ' + (33 + (FIT_D[k] ? FIT_D[k][1] : 0)) + ') scale(' + FIT_X[k] + ') translate(-32 -33)">' + tail + '</g>';
  }
  // 2026-11-01 (propriétaire : « des vrais logos réalistes comme les grands sites ») — PHOTOS : certains jeux ont une
  // vraie image (img/games/<clé>.webp) au lieu d'un dessin. On force ici (passe AVANT tous les setObj/addObj, quel que
  // soit l'ordre de chargement). Même cadre rond que penalty.webp. Ajouter une clé + 2 couleurs d'anneau = logo-photo.
  var PHOTO_V = '3380';
  var PHOTO = {
    acorncatch:['#FDBA74','#7C2D12'], airraid:['#FCA5A5','#7F1D1D'], airstrike:['#FDE68A','#78350F'], alienwave:['#BAE6FD','#0C4A6E'], applecatch:['#C4B5FD','#312E81'], archer:['#86EFAC','#14532D'],
    balloonup:['#93C5FD','#1E3A8A'], basket:['#F9A8D4','#831843'], beattap:['#A5B4FC','#312E81'], beefly:['#FDE047','#854D0E'], blockfall:['#67E8F9','#155E75'], brickbreak:['#FCA5A5','#7C2D12'],
    bubblepop:['#FDBA74','#7C2D12'], bubblesub:['#FCA5A5','#7F1D1D'], burgercatch:['#FDE68A','#78350F'], candycatch:['#BAE6FD','#0C4A6E'], canyon:['#C4B5FD','#312E81'], cavebat:['#86EFAC','#14532D'],
    chicken:['#93C5FD','#1E3A8A'], cityscoot:['#F9A8D4','#831843'], cityshield:['#A5B4FC','#312E81'], coffeecatch:['#FDE047','#854D0E'], coincatch:['#67E8F9','#155E75'], colorjump:['#FCA5A5','#7C2D12'],
    commando:['#FDBA74','#7C2D12'], copterflight:['#FCA5A5','#7F1D1D'], coralfish:['#FDE68A','#78350F'], cupcake:['#BAE6FD','#0C4A6E'], cupidaim:['#C4B5FD','#312E81'], dartspro:['#86EFAC','#14532D'],
    desertrally:['#93C5FD','#1E3A8A'], dodge:['#F9A8D4','#831843'], dogfight:['#A5B4FC','#312E81'], donutcatch:['#FDE047','#854D0E'], dragonfly:['#67E8F9','#155E75'], driftking:['#FCA5A5','#7C2D12'],
    dunebuggy:['#FDBA74','#7C2D12'], echopads:['#FCA5A5','#7F1D1D'], eggcatch:['#FDE68A','#78350F'], fireflylight:['#BAE6FD','#0C4A6E'], flappyrock:['#C4B5FD','#312E81'], fruitcatch:['#86EFAC','#14532D'],
    fruitpunch:['#93C5FD','#1E3A8A'], gemcatch:['#F9A8D4','#831843'], gemswap:['#A5B4FC','#312E81'], ghostdash:['#FDE047','#854D0E'], gifthaul:['#67E8F9','#155E75'], grenade:['#FCA5A5','#7C2D12'],
    gunship:['#FDBA74','#7C2D12'], hamster:['#FCA5A5','#7F1D1D'], helixdrop:['#FDE68A','#78350F'], highway:['#BAE6FD','#0C4A6E'], horsejump:['#C4B5FD','#312E81'], icecreamcatch:['#86EFAC','#14532D'],
    jetpack:['#93C5FD','#1E3A8A'], jetskirace:['#F9A8D4','#831843'], jungledash:['#A5B4FC','#312E81'], kartdash:['#FDE047','#854D0E'], kayakrush:['#67E8F9','#155E75'], knifehit:['#FCA5A5','#7C2D12'],
    lavaescape:['#FDBA74','#7C2D12'], lavarun:['#FCA5A5','#7F1D1D'], lovecatch:['#FDE68A','#78350F'], mazechomp:['#BAE6FD','#0C4A6E'], memoflip:['#C4B5FD','#312E81'], merge2048:['#86EFAC','#14532D'],
    meteorblast:['#93C5FD','#1E3A8A'], metrodash:['#F9A8D4','#831843'], minigolf:['#A5B4FC','#312E81'], moonrover:['#FDE047','#854D0E'], motowheelie:['#67E8F9','#155E75'], neonpong:['#FCA5A5','#7C2D12'],
    neonrider:['#FDBA74','#7C2D12'], neonsnake:['#FCA5A5','#7F1D1D'], orbit:['#FDE68A','#78350F'], owlflight:['#BAE6FD','#0C4A6E'], paperplane:['#C4B5FD','#312E81'], pearlcatch:['#86EFAC','#14532D'],
    penguinslide:['#93C5FD','#1E3A8A'], petalcatch:['#F9A8D4','#831843'], pianokeys:['#A5B4FC','#312E81'], pizzacatch:['#FDE047','#854D0E'], popcorncatch:['#67E8F9','#155E75'], princess:['#FCA5A5','#7C2D12'],
    raindash:['#FDBA74','#7C2D12'], roadrace:['#FCA5A5','#7F1D1D'], rocketcave:['#FDE68A','#78350F'], rooftopninja:['#BAE6FD','#0C4A6E'], ropeswing:['#C4B5FD','#312E81'], seagull:['#86EFAC','#14532D'],
    sharkbay:['#93C5FD','#1E3A8A'], skatetricks:['#F9A8D4','#831843'], skislalom:['#A5B4FC','#312E81'], skyhopper:['#FDE047','#854D0E'], slicer:['#67E8F9','#155E75'], sniper:['#FCA5A5','#7C2D12'],
    snowcatch:['#FDBA74','#7C2D12'], snowdash:['#FCA5A5','#7F1D1D'], snowjump:['#FDE68A','#78350F'], spacedash:['#BAE6FD','#0C4A6E'], spacerun:['#C4B5FD','#312E81'], speedboat:['#86EFAC','#14532D'],
    stack:['#93C5FD','#1E3A8A'], starbridge:['#F9A8D4','#831843'], starcatch:['#A5B4FC','#312E81'], subwaydash:['#FDE047','#854D0E'], surfrider:['#67E8F9','#155E75'], sushicatch:['#FCA5A5','#7C2D12'],
    tacocatch:['#FDBA74','#7C2D12'], tankbattle:['#FCA5A5','#7F1D1D'], tankrush:['#FDE68A','#78350F'], toxicrun:['#BAE6FD','#0C4A6E'], trenchdef:['#C4B5FD','#312E81'], ufoflight:['#86EFAC','#14532D'],
    veggiecatch:['#93C5FD','#1E3A8A'], zombiesiege:['#F9A8D4','#831843'],
    /* --- Casino (232) --- */
    mines:['#FDBA74','#7C2D12'], penalty:['#FCA5A5','#7F1D1D'], coinpush:['#FDE68A','#78350F'], candy:['#BAE6FD','#0C4A6E'], dragon:['#C4B5FD','#312E81'], limbo:['#86EFAC','#14532D'],
    cluster:['#93C5FD','#1E3A8A'], plinko2:['#F9A8D4','#831843'], nails:['#A5B4FC','#312E81'], golf:['#FDE047','#854D0E'], gatesgold:['#67E8F9','#155E75'], dice:['#FCA5A5','#7C2D12'],
    wheel:['#FDBA74','#7C2D12'], safe:['#FCA5A5','#7F1D1D'], coinlink:['#FDE68A','#78350F'], fishing:['#BAE6FD','#0C4A6E'], baccarat:['#C4B5FD','#312E81'], fruitparty:['#86EFAC','#14532D'],
    snakes:['#93C5FD','#1E3A8A'], lotto:['#F9A8D4','#831843'], megaways:['#A5B4FC','#312E81'], daisy:['#FDE047','#854D0E'], apple:['#67E8F9','#155E75'], pinball:['#FCA5A5','#7C2D12'],
    bookstars:['#FDBA74','#7C2D12'], sicbo:['#FCA5A5','#7F1D1D'], thimbles:['#FDE68A','#78350F'], cricket:['#BAE6FD','#0C4A6E'], pharaoh:['#C4B5FD','#312E81'], scratch:['#86EFAC','#14532D'],
    tower:['#93C5FD','#1E3A8A'], spacegems:['#F9A8D4','#831843'], teenpatti:['#A5B4FC','#312E81'], fireworks:['#FDE047','#854D0E'], coin:['#67E8F9','#155E75'], wildwest:['#FCA5A5','#7C2D12'],
    striker:['#FDBA74','#7C2D12'], colorpred:['#FCA5A5','#7F1D1D'], jewelbox:['#FDE68A','#78350F'], aztec:['#BAE6FD','#0C4A6E'], checkers:['#C4B5FD','#312E81'], keno80:['#86EFAC','#14532D'],
    pool:['#93C5FD','#1E3A8A'], ocean:['#F9A8D4','#831843'], andar:['#A5B4FC','#312E81'], gumball:['#FDE047','#854D0E'], dragonf:['#67E8F9','#155E75'], bouquet:['#FCA5A5','#7C2D12'],
    balloon:['#FDBA74','#7C2D12'], panda:['#FCA5A5','#7F1D1D'], moles:['#FDE68A','#78350F'], miniroul:['#BAE6FD','#0C4A6E'], tennis:['#C4B5FD','#312E81'], clover:['#86EFAC','#14532D'],
    hilo:['#93C5FD','#1E3A8A'], goldpan:['#F9A8D4','#831843'], connect4:['#A5B4FC','#312E81'], cosmic7:['#FDE047','#854D0E'], cups:['#67E8F9','#155E75'], craps:['#FCA5A5','#7C2D12'],
    slots:['#FDBA74','#7C2D12'], skijump:['#FCA5A5','#7F1D1D'], chests:['#FDE68A','#78350F'], vpoker:['#BAE6FD','#0C4A6E'], diamond:['#C4B5FD','#312E81'], luckyshoe:['#86EFAC','#14532D'],
    wheel2:['#93C5FD','#1E3A8A'], bingo:['#F9A8D4','#831843'], jungle:['#A5B4FC','#312E81'], domino:['#FDE047','#854D0E'], bowling:['#67E8F9','#155E75'], pinata:['#FCA5A5','#7C2D12'],
    cometqueen:['#FDBA74','#7C2D12'], blackjack:['#FCA5A5','#7F1D1D'], yatzy:['#FDE68A','#78350F'], pachinko:['#BAE6FD','#0C4A6E'], dblroul:['#C4B5FD','#312E81'], tcpoker:['#86EFAC','#14532D'],
    derby:['#93C5FD','#1E3A8A'], ducks:['#F9A8D4','#831843'], acerace:['#A5B4FC','#312E81'], twoup:['#FDE047','#854D0E'], skeeball:['#67E8F9','#155E75'], ceelo:['#FCA5A5','#7C2D12'],
    niuniu:['#FDBA74','#7C2D12'], oracle:['#FCA5A5','#7F1D1D'], twinwheel:['#FDE68A','#78350F'], crownanchor:['#BAE6FD','#0C4A6E'], holdem:['#C4B5FD','#312E81'], amida:['#86EFAC','#14532D'],
    fantan:['#93C5FD','#1E3A8A'], shipcrew:['#F9A8D4','#831843'], clocksol:['#A5B4FC','#312E81'], dreidel:['#FDE047','#854D0E'], rpsduel:['#67E8F9','#155E75'], trente:['#FCA5A5','#7C2D12'],
    hilorun:['#FDBA74','#7C2D12'], scarab:['#FCA5A5','#7F1D1D'], pickbox:['#FDE68A','#78350F'], kraken:['#BAE6FD','#0C4A6E'], colorwheel:['#C4B5FD','#312E81'], cherrybar:['#86EFAC','#14532D'],
    egghunt:['#93C5FD','#1E3A8A'], ufo:['#F9A8D4','#831843'], flip21:['#A5B4FC','#312E81'], goldtrain:['#FDE047','#854D0E'], envelope:['#67E8F9','#155E75'], koi:['#FCA5A5','#7C2D12'],
    shells:['#FDBA74','#7C2D12'], viking:['#FCA5A5','#7F1D1D'], ladder:['#FDE68A','#78350F'], safari:['#BAE6FD','#0C4A6E'], luckyten:['#C4B5FD','#312E81'], donut:['#86EFAC','#14532D'],
    popdarts:['#93C5FD','#1E3A8A'], rubymine:['#F9A8D4','#831843'], treasure:['#A5B4FC','#312E81'], pumpkin:['#FDE047','#854D0E'], scratchwin:['#67E8F9','#155E75'], medusa:['#FCA5A5','#7C2D12'],
    potion:['#FDBA74','#7C2D12'], mermaid:['#FCA5A5','#7F1D1D'], robobox:['#FDE68A','#78350F'], samurai:['#BAE6FD','#0C4A6E'], bottleflip:['#C4B5FD','#312E81'], oasis:['#86EFAC','#14532D'],
    tarot:['#93C5FD','#1E3A8A'], cybercity:['#F9A8D4','#831843'], curling:['#A5B4FC','#312E81'], carnival:['#FDE047','#854D0E'], lantern:['#67E8F9','#155E75'], jazzclub:['#FCA5A5','#7C2D12'],
    cargodrop:['#FDBA74','#7C2D12'], sushibar:['#FCA5A5','#7F1D1D'], gemfusion:['#FDE68A','#78350F'], fairy:['#BAE6FD','#0C4A6E'], mahjong:['#C4B5FD','#312E81'], steampunk:['#86EFAC','#14532D'],
    stoneskip:['#93C5FD','#1E3A8A'], arctic:['#F9A8D4','#831843'], meteor:['#A5B4FC','#312E81'], disco:['#FDE047','#854D0E'], defuse:['#67E8F9','#155E75'], dinopark:['#FCA5A5','#7C2D12'],
    westgold:['#FDBA74','#7C2D12'], piratecove:['#FCA5A5','#7F1D1D'], shamrock:['#FDE68A','#78350F'], candypop:['#BAE6FD','#0C4A6E'], olympus:['#C4B5FD','#312E81'], vegasneon:['#86EFAC','#14532D'],
    phoenix:['#93C5FD','#1E3A8A'], buffalo:['#F9A8D4','#831843'], joker:['#A5B4FC','#312E81'], bookgold:['#FDE047','#854D0E'], lotus:['#67E8F9','#155E75'], inferno:['#FCA5A5','#7C2D12'],
    aztecsun:['#FDBA74','#7C2D12'], dragongold:['#FCA5A5','#7F1D1D'], fruitburst:['#FDE68A','#78350F'], horuseye:['#BAE6FD','#0C4A6E'], cosmicgems:['#C4B5FD','#312E81'], savanna:['#86EFAC','#14532D'],
    valhalla:['#93C5FD','#1E3A8A'], tigergold:['#F9A8D4','#831843'], honeypot:['#A5B4FC','#312E81'], piggybank:['#FDE047','#854D0E'], atlantis:['#67E8F9','#155E75'], wizard:['#FCA5A5','#7C2D12'],
    royalcrown:['#FDBA74','#7C2D12'], luckycat:['#FCA5A5','#7F1D1D'], wolfmoon:['#FDE68A','#78350F'], vampire:['#BAE6FD','#0C4A6E'], peacock:['#C4B5FD','#312E81'], knight:['#86EFAC','#14532D'],
    tikigods:['#93C5FD','#1E3A8A'], icequeen:['#F9A8D4','#831843'], caishen:['#A5B4FC','#312E81'], luchador:['#FDE047','#854D0E'], fiesta:['#67E8F9','#155E75'], genie:['#FCA5A5','#7C2D12'],
    bandits:['#FDBA74','#7C2D12'], farm:['#FCA5A5','#7F1D1D'], gladiator:['#FDE68A','#78350F'], santa:['#BAE6FD','#0C4A6E'], alien:['#C4B5FD','#312E81'], goblin:['#86EFAC','#14532D'],
    circus:['#93C5FD','#1E3A8A'], soccer:['#F9A8D4','#831843'], butterfly:['#A5B4FC','#312E81'], pizza:['#FDE047','#854D0E'], beach:['#67E8F9','#155E75'], owl:['#FCA5A5','#7C2D12'],
    ninja:['#FDBA74','#7C2D12'], unicorn:['#FCA5A5','#7F1D1D'], turbo:['#FDE68A','#78350F'], astro:['#BAE6FD','#0C4A6E'], puppy:['#C4B5FD','#312E81'], sweets:['#86EFAC','#14532D'],
    rocketcash:['#93C5FD','#1E3A8A'], golddig:['#F9A8D4','#831843'], giftrush:['#A5B4FC','#312E81'], cannonx:['#FDE047','#854D0E'], luckylift:['#67E8F9','#155E75'], magichat:['#FCA5A5','#7C2D12'],
    chestgold:['#FDBA74','#7C2D12'], fortunewheel:['#FCA5A5','#7F1D1D'], goldenegg:['#FDE68A','#78350F'], mysterybox:['#BAE6FD','#0C4A6E'], crystalorb:['#C4B5FD','#312E81'], diamondvault:['#86EFAC','#14532D'],
    diceroll:['#93C5FD','#1E3A8A'], royalcard:['#F9A8D4','#831843'], genielamp:['#A5B4FC','#312E81'], jackpotbell:['#FDE047','#854D0E'], oysterpearl:['#67E8F9','#155E75'], crownjewel:['#FCA5A5','#7C2D12'],
    geodegem:['#FDBA74','#7C2D12'], moneytree:['#FCA5A5','#7F1D1D'], lotteryball:['#FDE68A','#78350F'], dragoncoin:['#BAE6FD','#0C4A6E'], fireworkgold:['#C4B5FD','#312E81'], treasuremap:['#86EFAC','#14532D'],
    goldbars:['#93C5FD','#1E3A8A'], pokerchip:['#F9A8D4','#831843'], luckyclover:['#A5B4FC','#312E81'], rubyheart:['#FDE047','#854D0E'], moneybag:['#67E8F9','#155E75'], diamondring:['#FCA5A5','#7C2D12'],
    goldtrophy:['#FDBA74','#7C2D12'], sunburst:['#FCA5A5','#7F1D1D'], gemtrio:['#FDE68A','#78350F'], horseshoe:['#BAE6FD','#0C4A6E'],
    /* --- Live (52) --- */
    crash:['#FDBA74','#7C2D12'], cryptox:['#FCA5A5','#7F1D1D'], roulette:['#FDE68A','#78350F'], jet:['#BAE6FD','#0C4A6E'], horses:['#C4B5FD','#312E81'], race:['#86EFAC','#14532D'],
    rocket:['#93C5FD','#1E3A8A'], planets:['#F9A8D4','#831843'], catwalk:['#A5B4FC','#312E81'], fleets:['#FDE047','#854D0E'], gemcount:['#67E8F9','#155E75'], claw:['#FCA5A5','#7C2D12'],
    dtlive:['#FDBA74','#7C2D12'], moneywheel:['#FCA5A5','#7F1D1D'], football:['#FDE68A','#78350F'], kenolive:['#BAE6FD','#0C4A6E'], moonshot:['#C4B5FD','#312E81'], sicbolive:['#86EFAC','#14532D'],
    pegdrop:['#93C5FD','#1E3A8A'], hilolive:['#F9A8D4','#831843'], bullseye:['#A5B4FC','#312E81'], lucky10:['#FDE047','#854D0E'], ladderlive:['#67E8F9','#155E75'], coinlive:['#FCA5A5','#7C2D12'],
    baccaratlive:['#FDBA74','#7C2D12'], bingolive:['#FCA5A5','#7F1D1D'], diceduellive:['#FDE68A','#78350F'], andarlive:['#BAE6FD','#0C4A6E'], lotto649live:['#C4B5FD','#312E81'], redblacklive:['#86EFAC','#14532D'],
    pokerlive:['#93C5FD','#1E3A8A'], peryalive:['#F9A8D4','#831843'], bustlive:['#A5B4FC','#312E81'], teenpattilive:['#FDE047','#854D0E'], megaballlive:['#67E8F9','#155E75'], lucky7live:['#FCA5A5','#7C2D12'],
    dogracelive:['#FDBA74','#7C2D12'], penaltylive:['#FCA5A5','#7F1D1D'], camelracelive:['#FDE68A','#78350F'], boxinglive:['#BAE6FD','#0C4A6E'], monsterlive:['#C4B5FD','#312E81'], basketlive:['#86EFAC','#14532D'],
    snailracelive:['#93C5FD','#1E3A8A'], volcanolive:['#F9A8D4','#831843'], boatracelive:['#A5B4FC','#312E81'], tennislive:['#FDE047','#854D0E'], chickenracelive:['#67E8F9','#155E75'], archerylive:['#FCA5A5','#7C2D12'],
    spaceracelive:['#FDBA74','#7C2D12'], cricketlive:['#FCA5A5','#7F1D1D'], balloonlive:['#FDE68A','#78350F'], fishinglive:['#BAE6FD','#0C4A6E']
  };
  function photoFrame(k) {
    var c = PHOTO[k] || ['#334155', '#0F172A'];
    return '<defs><clipPath id="IDm"><circle cx="32" cy="33" r="26.5"/></clipPath>' +
      '<linearGradient id="IDg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[1] + '"/></linearGradient>' +
      '<linearGradient id="IDs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
      '<circle cx="32" cy="35" r="28.5" fill="#000" opacity=".38"/><circle cx="32" cy="33" r="28.5" fill="url(#IDg)"/>' +
      '<image href="img/games/' + k + '.webp?v=' + PHOTO_V + '" x="5.5" y="6.5" width="53" height="53" clip-path="url(#IDm)" preserveAspectRatio="xMidYMid slice"/>' +
      '<circle cx="32" cy="33" r="26.5" fill="url(#IDs)"/><circle cx="32" cy="33" r="26.5" fill="none" stroke="#000" stroke-opacity=".35" stroke-width=".8"/>';
  }
  function obj(k) {
    if (PHOTO[k]) { var ip = 'ca' + (++n); return '<svg class="cs-obj" viewBox="0 0 64 64" aria-hidden="true">' + photoFrame(k).replace(/ID/g, ip) + '</svg>'; }
    var f = OBJ[k] || OBJ.coin, id = 'ca' + (++n);
    return '<svg class="cs-obj" viewBox="0 0 64 64" aria-hidden="true">' + fitIn(f(), OBJ[k] ? k : 'coin').replace(/ID/g, id) + '</svg>';
  }
  /* objDraw : TOUJOURS le dessin SVG (jamais la photo) — pour les jeux qui dessinent leur logo DANS la partie
     (cible du Limbo, pomme révélée…) : la vignette du lobby montre la photo, mais le jeu garde son dessin. */
  function objDraw(k) {
    var f = OBJ[k] || OBJ.coin, id = 'ca' + (++n);
    return '<svg class="cs-obj" viewBox="0 0 64 64" aria-hidden="true">' + fitIn(f(), OBJ[k] ? k : 'coin').replace(/ID/g, id) + '</svg>';
  }
  /* v-games (propriétaire : « enlève les ronds, le dessin prend tout le carré ») — les logos « médaillon » sont en fait
     une SCÈNE découpée en rond (fond + objets). On remplace le découpage rond par un carré : la scène remplit la vignette,
     l'anneau doré (dessiné dessous) est recouvert par le fond. Les logos non-médaillon ne sont pas touchés. */
  function deround(s) {
    s = s.replace(/<clipPath id="([^"]+)"><circle cx="32" cy="33" r="26\.5"\/><\/clipPath>/g, '<clipPath id="$1"><rect x="0" y="0" width="64" height="64" rx="5"/></clipPath>');
    s = s.replace(/<circle cx="32" cy="3[0-9](?:\.[0-9]+)?" r="28\.5"[^>]*\/>/g, '');      // anneau + ombre du médaillon
    s = s.replace(/<circle cx="32" cy="33" r="26\.5" fill="none"[^>]*\/>/g, '');            // liseré rond intérieur
    s = s.replace(/<path d="M8 27A24\.5 24\.5 0 0 1 56 27Q32 20 8 27z"[^>]*\/>/g, '');       // reflet en dôme (haut du médaillon)
    return s;
  }
  function objFull(k) {
    var id = 'ca' + (++n);
    if (PHOTO[k]) return '<svg class="cs-obj cs-objf" viewBox="0 0 64 64" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + deround(photoFrame(k).replace(/ID/g, id)) + '</svg>';
    var f = OBJ[k] || OBJ.coin;
    var inner = fitIn(f(), OBJ[k] ? k : 'coin').replace(/ID/g, id);
    return '<svg class="cs-obj cs-objf" viewBox="0 0 64 64" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + deround(inner) + '</svg>';
  }
  /* planète + objet posé dessus (sans carré) */
  function planet(k, cls) {
    var p = PAL[k] || PAL.coin;
    return '<span class="cs-pl' + (cls ? ' ' + cls : '') + '" style="--p1:' + p[0] + ';--p2:' + p[1] + '"><i></i>' + photo(obj(k)) + '</span>';
  }
  // 2026-10-21 (propriétaire : « les logos des jeux Action s'actualisent et montrent un fond bleu / jaune avant l'image ») :
  // l'image du médaillon (img/games/<jeu>.webp) était une <image> SVG, dessinée en différé à chaque affichage (fond coloré
  // visible un instant). Elle devient une vraie image (<img>, affichée tout de suite depuis la mémoire), posée entre le dessous
  // du médaillon (ombre, anneau) et son dessus (reflet, contour, badge) ; sous l'image, un disque sombre au lieu du dégradé coloré.
  var IMG_RE = /<image href="(img\/games\/[^"]+)" x="5\.5" y="6\.5" width="53" height="53" clip-path="url\(#[^)]*\)" preserveAspectRatio="xMidYMid slice"\s*\/?>(<\/image>)?/;
  function photo(svg) {
    var m = IMG_RE.exec(svg);
    if (!m) return svg;
    var head = svg.slice(0, m.index), tail = svg.slice(m.index + m[0].length);
    return head + '<circle cx="32" cy="33" r="26.5" fill="#120F2E"/></svg>' +
      '<img class="cs-photo" src="' + m[1] + '" alt="" decoding="sync" draggable="false">' +
      '<svg class="cs-obj cs-obj-top" viewBox="0 0 64 64" aria-hidden="true">' + tail;
  }
  // v2804 : les nouveaux jeux apportent leur logo (SVG 64×64, sans balise <svg>) et leurs couleurs — js/games/cat-*.js
  function addObj(k, svgInner, pal) { if (!k || OBJ[k]) return; OBJ[k] = function () { return String(svgInner || ''); }; if (pal && !PAL[k]) PAL[k] = pal; }
  // 2026-10-21 (propriétaire : logos plus beaux) : un logo redessiné (js/games/logos-*.js) remplace celui du catalogue
  function setObj(k, svgInner, pal) { if (!k) return; OBJ[k] = function () { return String(svgInner || ''); }; if (pal) PAL[k] = pal; }
  /* v-games — SALLE EN GRANDES VIGNETTES (style 1xBet) : certains jeux ont une scène PLEIN CADRE (SVG 160×112,
     js/games/scenes.js). scene(k) la renvoie telle quelle ; hasScene(k) dit si elle existe. Les jeux sans scène
     gardent une vignette « médaillon » (fond dégradé de leur couleur + leur logo rond au centre) : jamais un rond recadré. */
  var SCN = {};
  function setScene(k, svg) { if (k) SCN[k] = String(svg || ''); }
  function hasScene(k) { return !PHOTO[k] && !!SCN[k]; } // 2026-11-01 : un jeu-photo passe par objFull (sa vraie image gagne sur la scène)
  function scene(k) { return SCN[k] || ''; }
  // vignette de repli : panneau dégradé (couleur du jeu) + logo rond centré, pour les jeux sans scène dédiée
  function poster(k) {
    var p = PAL[k] || PAL.coin, id = 'po' + (++n);
    return '<svg class="cs-poster" viewBox="0 0 160 112" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<defs><radialGradient id="' + id + '" cx="50%" cy="34%" r="82%"><stop offset="0" stop-color="' + p[0] + '"/><stop offset=".55" stop-color="' + p[1] + '"/><stop offset="1" stop-color="#0d0a24"/></radialGradient>' +
      '<radialGradient id="' + id + 'v" cx="50%" cy="42%" r="70%"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient></defs>' +
      '<rect width="160" height="112" fill="url(#' + id + ')"/><rect width="160" height="112" fill="url(#' + id + 'v)"/></svg>';
  }
  D6.CasinoArt = { PAL: PAL, obj: obj, objDraw: objDraw, objFull: objFull, planet: planet, sym: sym, car: car, addObj: addObj, setObj: setObj, setScene: setScene, hasScene: hasScene, scene: scene, poster: poster, rps: function (i) { return rpsSvg(i, true); } };
})(window.D6 = window.D6 || {});
