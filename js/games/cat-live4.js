/* v2900 — live4 catalogue (owner request, round 5): 12 new LIVE games "cards, dice & draws" (shared rounds, casino_live4.php
   CASINO_LIVE4), module js/games/live4.js. Logos drawn here (64×64, same glossy style as the other live logos). */
(function (D6) {
  if (!D6.CasinoCatalog) return;
  function rg(id, a, b, c) { return '<radialGradient id="' + id + '" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="' + a + '"/><stop offset=".55" stop-color="' + b + '"/><stop offset="1" stop-color="' + c + '"/></radialGradient>'; }
  function lg(id, a, b) { return '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient>'; }
  var F = ' font-family="Arial,sans-serif" font-weight="900"';
  var sp = function (x, y, s) { return '<path d="M' + x + ' ' + (y - s) + 'l' + (s * .3) + ' ' + (s * .7) + ' ' + (s * .7) + ' ' + (s * .3) + '-' + (s * .7) + ' ' + (s * .3) + '-' + (s * .3) + ' ' + (s * .7) + '-' + (s * .3) + '-' + (s * .7) + '-' + (s * .7) + '-' + (s * .3) + ' ' + (s * .7) + '-' + (s * .3) + 'z" fill="#FFF7D6"/>'; };
  var sh = function (rx) { return '<ellipse cx="32" cy="57" rx="' + (rx || 21) + '" ry="3.6" fill="#000" opacity=".28"/>'; };
  var HE = 'M0 5C-3.6 2.6-5.2.3-5.2-1.8C-5.2-3.7-3.7-5-2.3-5C-1.1-5-.3-4.4 0-3.6C.3-4.4 1.1-5 2.3-5C3.7-5 5.2-3.7 5.2-1.8C5.2.3 3.6 2.6 0 5Z';
  var SP = 'M0-5.4C2.1-2.8 5-.8 5 1.8C5 3.9 2.8 4.9 1 3.6L1.8 6H-1.8L-1 3.6C-2.8 4.9-5 3.9-5 1.8C-5-.8-2.1-2.8 0-5.4Z';
  // face-up card (rank, red?, suit path) at x,y rotated r, scale s
  var card = function (x, y, r, rank, red, suit, s, id) {
    var c = red ? '#DC2626' : '#111827';
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + r + ') scale(' + (s || 1) + ')"><rect x="-11" y="-15" width="22" height="30" rx="3" fill="url(#' + (id || 'IDw') + ')" stroke="#94A3B8" stroke-width=".6"/>' +
      '<text x="-5.5" y="-5" text-anchor="middle" font-size="8"' + F + ' fill="' + c + '">' + rank + '</text><path d="' + (suit || HE) + '" fill="' + c + '" transform="translate(1.5 5) scale(.95)"/></g>';
  };
  var back = function (x, y, r, a, b, s) { return '<g transform="translate(' + x + ' ' + y + ') rotate(' + r + ') scale(' + (s || 1) + ')"><rect x="-11" y="-15" width="22" height="30" rx="3" fill="' + a + '" stroke="#FDE68A" stroke-width="1"/><rect x="-7.5" y="-11.5" width="15" height="23" rx="2" fill="' + b + '" stroke="#FDE68A" stroke-opacity=".6" stroke-width=".6"/><circle r="3.4" fill="none" stroke="#FDE68A" stroke-width="1"/></g>'; };
  var W = lg('IDw', '#FFFFFF', '#E2E8F0');
  var die = function (x, y, s, r, fill, pips, pc) {
    var P = { 1: [[0, 0]], 2: [[-4, -4], [4, 4]], 3: [[-4, -4], [0, 0], [4, 4]], 4: [[-4, -4], [4, -4], [-4, 4], [4, 4]], 5: [[-4, -4], [4, -4], [0, 0], [-4, 4], [4, 4]], 6: [[-4, -4], [4, -4], [-4, 0], [4, 0], [-4, 4], [4, 4]] }[pips] || [];
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + r + ') scale(' + s + ')"><rect x="-9" y="-9" width="18" height="18" rx="4.5" fill="' + fill + '" stroke="#fff" stroke-opacity=".7" stroke-width=".8"/><rect x="-7" y="-8" width="9" height="4" rx="2" fill="#fff" opacity=".35"/>' +
      P.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.8" fill="' + (pc || '#fff') + '"/>'; }).join('') + '</g>';
  };
  var ball = function (x, y, r, id, t, fs, tc) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="url(#' + id + ')"/><circle cx="' + x + '" cy="' + y + '" r="' + (r * .55) + '" fill="#fff"/><text x="' + x + '" y="' + (y + fs * .36) + '" text-anchor="middle" font-size="' + fs + '"' + F + ' fill="' + (tc || '#111827') + '">' + t + '</text>'; };
  var ICONS = {
    // two baccarat cards (natural 9) over a blue and a red chip
    baccaratlive: '<defs>' + W + rg('IDp', '#93C5FD', '#2563EB', '#1E3A8A') + rg('IDb', '#FCA5A5', '#DC2626', '#7F1D1D') + '</defs>' + sh(22) +
      card(24, 26, -12, '9', true, HE, 1.25) + card(40, 25, 10, 'K', false, SP, 1.25) +
      '<g transform="translate(18 47)"><circle r="9" fill="url(#IDp)" stroke="#fff" stroke-width="1.4" stroke-dasharray="3 2.4"/><text y="3.6" text-anchor="middle" font-size="10"' + F + ' fill="#fff">P</text></g>' +
      '<g transform="translate(46 47)"><circle r="9" fill="url(#IDb)" stroke="#fff" stroke-width="1.4" stroke-dasharray="3 2.4"/><text y="3.6" text-anchor="middle" font-size="10"' + F + ' fill="#fff">B</text></g>' + sp(32, 50, 3) + sp(56, 10, 2.6),
    // the joker in the middle, Andar (left) and Bahar (right) piles
    andarlive: '<defs>' + W + rg('IDj', '#FEF3C7', '#F59E0B', '#92400E') + '</defs>' + sh(23) +
      back(12, 34, -14, '#7C2D12', '#C2410C', 1) + back(52, 34, 14, '#5B21B6', '#7C3AED', 1) +
      '<g transform="translate(32 30) scale(1.45)"><rect x="-11" y="-15" width="22" height="30" rx="3" fill="url(#IDw)" stroke="#B45309" stroke-width=".9"/><path d="M-7-3L-5-10L-2-5L0-11L2-5L5-10L7-3Z" fill="url(#IDj)" stroke="#92400E" stroke-width=".5"/><rect x="-7" y="-3" width="14" height="3" rx="1" fill="#B45309"/><text y="11" text-anchor="middle" font-size="8.5"' + F + ' fill="#B91C1C">J</text></g>' +
      '<text x="9" y="56" text-anchor="middle" font-size="9"' + F + ' fill="#FDBA74" stroke="#431407" stroke-width=".6">A</text><text x="55" y="56" text-anchor="middle" font-size="9"' + F + ' fill="#C4B5FD" stroke="#2E1065" stroke-width=".6">B</text>',
    // a trail: three aces fanned
    teenpattilive: '<defs>' + W + rg('IDg', '#FEF3C7', '#FBBF24', '#B45309') + '</defs>' + sh(22) +
      card(19, 33, -22, 'A', false, SP, 1.3) + card(32, 29, 0, 'A', true, HE, 1.3) + card(45, 33, 22, 'A', true, 'M0-5.4L4.2 0L0 5.4L-4.2 0Z', 1.3) +
      '<path d="M18 52h28l-3 6H21z" fill="url(#IDg)" stroke="#92400E" stroke-width=".6"/><text x="32" y="57.4" text-anchor="middle" font-size="5.6"' + F + ' fill="#7C2D12">3 PATTI</text>' + sp(55, 11, 3) + sp(8, 14, 2.4),
    // red hand vs blue hand: a royal flush fan between two coloured chips
    pokerlive: '<defs>' + W + rg('IDr', '#FCA5A5', '#DC2626', '#7F1D1D') + rg('IDb', '#93C5FD', '#2563EB', '#1E3A8A') + '</defs>' + sh(23) +
      card(16, 30, -24, '10', false, SP, 1.05) + card(24, 26, -12, 'J', false, SP, 1.05) + card(32, 25, 0, 'Q', false, SP, 1.05) + card(40, 26, 12, 'K', false, SP, 1.05) + card(48, 30, 24, 'A', false, SP, 1.05) +
      '<circle cx="13" cy="50" r="7.5" fill="url(#IDr)" stroke="#fff" stroke-width="1.2" stroke-dasharray="2.6 2"/><circle cx="51" cy="50" r="7.5" fill="url(#IDb)" stroke="#fff" stroke-width="1.2" stroke-dasharray="2.6 2"/>' +
      '<text x="32" y="54" text-anchor="middle" font-size="9"' + F + ' fill="#FDE68A" stroke="#422006" stroke-width=".5">VS</text>',
    // a card split red / black with a heart and a spade
    redblacklive: '<defs><linearGradient id="IDs" x1="0" y1="0" x2="1" y2="1"><stop offset=".5" stop-color="#DC2626"/><stop offset=".5" stop-color="#111827"/></linearGradient>' + lg('IDe', '#FDE68A', '#B45309') + '</defs>' + sh(18) +
      '<g transform="translate(32 31) rotate(-8)"><rect x="-17" y="-23" width="34" height="46" rx="5" fill="url(#IDs)" stroke="url(#IDe)" stroke-width="2"/><path d="' + HE + '" fill="#fff" transform="translate(-6 -8) scale(1.25)"/><path d="' + SP + '" fill="#fff" transform="translate(6 9) scale(1.25)"/></g>' +
      sp(53, 12, 3.2) + sp(10, 46, 2.6),
    // the big lucky 7 card
    lucky7live: '<defs>' + W + lg('IDs', '#FDE047', '#DC2626') + '</defs>' + sh(18) +
      '<g transform="translate(32 30) rotate(6)"><rect x="-17" y="-23" width="34" height="46" rx="5" fill="url(#IDw)" stroke="#B45309" stroke-width="1.6"/><text y="13" text-anchor="middle" font-size="36"' + F + ' fill="url(#IDs)" stroke="#7F1D1D" stroke-width="1">7</text><path d="' + HE + '" fill="#DC2626" transform="translate(-10 -15) scale(.7)"/></g>' +
      sp(9, 14, 3.4) + sp(55, 44, 3) + sp(54, 12, 2.2),
    // red die vs blue die colliding
    diceduellive: '<defs>' + lg('IDr', '#F87171', '#991B1B') + lg('IDb', '#60A5FA', '#1E3A8A') + rg('IDx', '#FFFFFF', '#FDE047', '#F59E0B') + '</defs>' + sh(22) +
      '<path d="M32 18l3 9 9-2-6 7 6 7-9-2-3 9-3-9-9 2 6-7-6-7 9 2z" fill="url(#IDx)" opacity=".95"/>' +
      die(19, 34, 1.15, -16, 'url(#IDr)', 5) + die(45, 34, 1.15, 16, 'url(#IDb)', 6),
    // perya: three colour dice
    peryalive: '<defs>' + lg('IDy', '#FEF08A', '#CA8A04') + lg('IDp', '#F9A8D4', '#BE185D') + lg('IDb', '#7DD3FC', '#0369A1') + '</defs>' + sh(23) +
      die(17, 40, 1.05, -12, 'url(#IDy)', 0) + die(46, 40, 1.05, 14, 'url(#IDb)', 0) + die(32, 22, 1.1, 6, 'url(#IDp)', 0) +
      '<circle cx="17" cy="40" r="3.2" fill="#fff" opacity=".85"/><circle cx="46" cy="40" r="3.2" fill="#fff" opacity=".85"/><circle cx="32" cy="22" r="3.4" fill="#fff" opacity=".85"/>' + sp(55, 13, 2.8) + sp(8, 16, 2.4),
    // bingo card with daubs and a ball
    bingolive: '<defs>' + W + rg('IDb', '#FDBA74', '#EA580C', '#7C2D12') + '</defs>' + sh(22) +
      '<g transform="translate(25 31) rotate(-6)"><rect x="-17" y="-20" width="34" height="40" rx="4" fill="url(#IDw)" stroke="#EA580C" stroke-width="1.6"/><rect x="-17" y="-20" width="34" height="9" rx="3" fill="#EA580C"/><text y="-13" text-anchor="middle" font-size="6.6"' + F + ' fill="#fff" letter-spacing=".6">BINGO</text>' +
      [[-10, -4], [0, 3], [10, 10], [-10, 10], [10, -4]].map(function (p, i) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4" fill="' + (i < 3 ? '#DC2626' : '#CBD5E1') + '" opacity="' + (i < 3 ? '.9' : '.8') + '"/>'; }).join('') + '<path d="M-14-6L14 13" stroke="#DC2626" stroke-width="1.4" stroke-linecap="round" opacity=".7"/></g>' +
      ball(46, 40, 11, 'IDb', '75', 8.5) + sp(54, 12, 2.8),
    // lottery globe with balls and 6/49 plate
    lotto649live: '<defs>' + rg('IDg', '#FFFFFF', '#BAE6FD', '#0369A1') + rg('IDa', '#FDE68A', '#F59E0B', '#92400E') + rg('IDc', '#BBF7D0', '#22C55E', '#14532D') + rg('IDd', '#FBCFE8', '#EC4899', '#831843') + '</defs>' + sh(18) +
      '<circle cx="32" cy="26" r="19" fill="url(#IDg)" opacity=".55" stroke="#E0F2FE" stroke-width="1.4"/>' + ball(25, 30, 6, 'IDa', '6', 5.5) + ball(38, 22, 6, 'IDc', '49', 4.6) + ball(36, 35, 5.5, 'IDd', '7', 5) + ball(25, 18, 4.6, 'IDc', '', 4) +
      '<path d="M24 14Q30 9 37 11" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/><rect x="16" y="45" width="32" height="11" rx="3" fill="#0C4A6E" stroke="#FDE68A" stroke-width="1"/><text x="32" y="53.5" text-anchor="middle" font-size="8"' + F + ' fill="#FDE68A">6/49</text>',
    // the giant glowing mega ball
    megaballlive: '<defs>' + rg('IDm', '#FFF7D6', '#FBBF24', '#B45309') + rg('IDh', '#F0ABFC', '#C026D3', '#4A044E') + '</defs>' + sh(20) +
      '<circle cx="32" cy="29" r="23" fill="none" stroke="url(#IDh)" stroke-width="3" opacity=".85"/><circle cx="32" cy="29" r="18" fill="url(#IDm)" stroke="#FEF3C7" stroke-width="1"/><circle cx="32" cy="29" r="10.5" fill="#fff"/>' +
      '<text x="32" y="34" text-anchor="middle" font-size="13"' + F + ' fill="#7C2D12">51</text><path d="M20 19Q25 12 33 12" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".75"/>' +
      '<circle cx="9" cy="12" r="4" fill="url(#IDh)"/><circle cx="56" cy="46" r="3.4" fill="url(#IDh)"/>' + sp(55, 11, 3) + sp(9, 47, 2.4),
    // dealer bust: K + 6 + 9 with a red burst
    bustlive: '<defs>' + W + rg('IDx', '#FECACA', '#EF4444', '#7F1D1D') + '</defs>' + sh(22) +
      card(16, 30, -16, 'K', false, SP, 1.2) + card(29, 28, -4, '6', true, HE, 1.2) + card(42, 29, 10, '9', false, SP, 1.2) +
      '<path d="M49 36l3 6 6-2-3 6 5 4-7 1v6l-5-4-4 5-1-6-6 1 4-5-4-4 6-1-1-6 5 3z" fill="url(#IDx)" stroke="#FEE2E2" stroke-width=".8"/><text x="49" y="51.5" text-anchor="middle" font-size="8"' + F + ' fill="#fff">25</text>'
  };
  var A = function (k, name, pal) { return { k: k, name: name, sec: 'live', file: 'live4', pal: pal, icon: ICONS[k] }; };
  D6.CasinoCatalog.add([
    A('baccaratlive', 'Baccarat Live', ['#DCFCE7', '#047857']),
    A('andarlive', 'Andar Bahar', ['#FFEDD5', '#B45309']),
    A('teenpattilive', 'Teen Patti Live', ['#F3E8FF', '#6D28D9']),
    A('pokerlive', 'Poker Live', ['#D1FAE5', '#065F46']),
    A('redblacklive', 'Red or Black', ['#FEE2E2', '#991B1B']),
    A('lucky7live', 'Lucky 7 Live', ['#FEF9C3', '#B91C1C']),
    A('diceduellive', 'Dice Duel', ['#E0E7FF', '#1D4ED8']),
    A('peryalive', 'Color Game', ['#FCE7F3', '#BE185D']),
    A('bingolive', 'Bingo Live', ['#FFEDD5', '#C2410C']),
    A('lotto649live', 'Lotto 6/49', ['#E0F2FE', '#0369A1']),
    A('megaballlive', 'Mega Ball', ['#FAE8FF', '#86198F']),
    A('bustlive', 'Dealer Bust', ['#FEE2E2', '#7F1D1D'])
  ]);
})(window.D6 = window.D6 || {});
