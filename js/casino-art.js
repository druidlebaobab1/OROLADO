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
    penalty: function () {
      return '<defs><clipPath id="IDm"><circle cx="32" cy="33" r="26.5"/></clipPath><linearGradient id="IDg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF7D6"/><stop offset=".45" stop-color="#4ADE80"/><stop offset="1" stop-color="#14532D"/></linearGradient>' +
        '<linearGradient id="IDs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
        '<circle cx="32" cy="35" r="28.5" fill="#000" opacity=".38"/><circle cx="32" cy="33" r="28.5" fill="url(#IDg)"/>' +
        '<image href="img/games/penalty.webp?v=2866" x="5.5" y="6.5" width="53" height="53" clip-path="url(#IDm)" preserveAspectRatio="xMidYMid slice"/>' +
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
  OBJ.rps = function () {
    return '<g transform="translate(-2 20) scale(.52)">' + rpsSvg(0) + '</g><g transform="translate(17 -2) scale(.52)">' + rpsSvg(1) + '</g><g transform="translate(34 22) scale(.52)">' + rpsSvg(2) + '</g>';
  };
  function obj(k) {
    var f = OBJ[k] || OBJ.coin, id = 'ca' + (++n);
    return '<svg class="cs-obj" viewBox="0 0 64 64" aria-hidden="true">' + f().replace(/ID/g, id) + '</svg>';
  }
  /* planète + objet posé dessus (sans carré) */
  function planet(k, cls) {
    var p = PAL[k] || PAL.coin;
    return '<span class="cs-pl' + (cls ? ' ' + cls : '') + '" style="--p1:' + p[0] + ';--p2:' + p[1] + '"><i></i>' + obj(k) + '</span>';
  }
  // v2804 : les nouveaux jeux apportent leur logo (SVG 64×64, sans balise <svg>) et leurs couleurs — js/games/cat-*.js
  function addObj(k, svgInner, pal) { if (!k || OBJ[k]) return; OBJ[k] = function () { return String(svgInner || ''); }; if (pal && !PAL[k]) PAL[k] = pal; }
  D6.CasinoArt = { PAL: PAL, obj: obj, planet: planet, sym: sym, car: car, addObj: addObj, rps: function (i) { return rpsSvg(i, true); } };
})(window.D6 = window.D6 || {});
