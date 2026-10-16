/* v2694 — CASINO : logos « planète » (propriétaire) — chaque jeu = SON objet (avion, pomme, dés…) posé sur une planète
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
    balloon: ['#E0F2FE', '#0EA5E9'], penalty: ['#DCFCE7', '#15803D'], race: ['#FEE2E2', '#DC2626'], colors: ['#F3E8FF', '#9333EA'],
    darts: ['#FEF3C7', '#B45309'], sports: ['#E0F2FE', '#0284C7'],
    g_defi: ['#FFE4E6', '#E11D48'], g_top: ['#FEF3C7', '#CA8A04'], g_bon: ['#DCFCE7', '#16A34A'], g_jauge: ['#E0F2FE', '#2563EB'], g_aff: ['#F3E8FF', '#9333EA'], g_send: ['#CCFBF1', '#0D9488']
  };
  var n = 0;
  // dégradés réutilisés (ID remplacé par un identifiant unique à chaque dessin)
  var G = {
    gold: '<radialGradient id="IDg" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#FFF6C8"/><stop offset=".5" stop-color="#F5B700"/><stop offset="1" stop-color="#9A6A00"/></radialGradient>',
    silver: '<radialGradient id="IDs" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#CBD5E1"/><stop offset="1" stop-color="#64748B"/></radialGradient>',
    red: '<linearGradient id="IDr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF8FA3"/><stop offset=".5" stop-color="#EF233C"/><stop offset="1" stop-color="#9D0208"/></linearGradient>',
    shine: '<linearGradient id="IDw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'
  };
  function ball(cx, cy, r, c1, c2, txt) {
    var id = 'b' + (++n);
    return '<radialGradient id="' + id + '" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset=".25" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></radialGradient>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="url(#' + id + ')"/>' +
      (txt ? '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.5) + '" fill="#fff"/><text x="' + cx + '" y="' + (cy + r * 0.22) + '" text-anchor="middle" font-size="' + (r * 0.62) + '" font-weight="900" font-family="system-ui" fill="#111">' + txt + '</text>' : '');
  }
  function card(x, y, rot, rank, suit, red) {
    return '<g transform="rotate(' + rot + ' ' + (x + 11) + ' ' + (y + 15) + ')"><rect x="' + x + '" y="' + y + '" width="22" height="30" rx="3.5" fill="#fff" stroke="#E2E8F0"/>' +
      '<text x="' + (x + 11) + '" y="' + (y + 15) + '" text-anchor="middle" font-size="12" font-weight="900" font-family="system-ui" fill="' + (red ? '#DC2626' : '#111827') + '">' + rank + '</text>' +
      '<text x="' + (x + 11) + '" y="' + (y + 26) + '" text-anchor="middle" font-size="10" font-family="system-ui" fill="' + (red ? '#DC2626' : '#111827') + '">' + suit + '</text></g>';
  }
  function die(x, y, s, rot, pips, body, pip) {
    var P = { 1: [[.5, .5]], 2: [[.28, .28], [.72, .72]], 3: [[.25, .25], [.5, .5], [.75, .75]], 4: [[.28, .28], [.72, .28], [.28, .72], [.72, .72]], 5: [[.25, .25], [.75, .25], [.5, .5], [.25, .75], [.75, .75]], 6: [[.28, .22], [.72, .22], [.28, .5], [.72, .5], [.28, .78], [.72, .78]] }[pips];
    var id = 'd' + (++n);
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + body[0] + '"/><stop offset="1" stop-color="' + body[1] + '"/></linearGradient>' +
      '<g transform="rotate(' + rot + ' ' + (x + s / 2) + ' ' + (y + s / 2) + ')"><rect x="' + x + '" y="' + (y + 2) + '" width="' + s + '" height="' + s + '" rx="' + (s * 0.22) + '" fill="#000" opacity=".25"/>' +
      '<rect x="' + x + '" y="' + y + '" width="' + s + '" height="' + s + '" rx="' + (s * 0.22) + '" fill="url(#' + id + ')"/>' +
      '<rect x="' + (x + 2) + '" y="' + (y + 1.5) + '" width="' + (s - 4) + '" height="' + (s * 0.35) + '" rx="' + (s * 0.16) + '" fill="#fff" opacity=".22"/>' +
      P.map(function (p) { return '<circle cx="' + (x + p[0] * s) + '" cy="' + (y + p[1] * s) + '" r="' + (s * 0.085) + '" fill="' + pip + '"/>'; }).join('') + '</g>';
  }
  var OBJ = {
    // avion rouge brillant qui décolle, traînée
    crash: function () {
      return '<defs><linearGradient id="IDf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#E2E8F0"/><stop offset="1" stop-color="#94A3B8"/></linearGradient></defs>' +
        '<g transform="rotate(-22 32 34)"><path d="M14 33.5L2 36l12 2.5z" fill="#F97316"/><path d="M14 34.6L7 36l7 1.4z" fill="#FDE047"/>' +
        '<path d="M13 32.5l8-11h6l-2 11.5zM13 39.5l5 6h5l1-6z" fill="#DC2626"/>' +
        '<path d="M12 32.5h30c8 0 15 1.6 19 3.5-4 1.9-11 3.5-19 3.5H12z" fill="url(#IDf)"/><path d="M12 36h46" stroke="#DC2626" stroke-width="2"/>' +
        '<path d="M28 37l12 0-8 11h-7z" fill="#B91C1C"/><path d="M40 32.6c3-3.4 8-3.6 12-.2" fill="#38BDF8" stroke="#0F172A" stroke-width="1"/><path d="M43 31.2c2-1.4 4-1.4 6-.4" stroke="#fff" stroke-width="1.2" opacity=".8"/></g>';
    },
    // Jet Man : combinaison violette, casque, flammes
    jet: function () {
      return '<path d="M24 44c-3 7-2 13 2 17 1-6 3-10 3-15zM36 44c3 7 2 13-2 17-1-6-3-10-3-15z" fill="#F59E0B"/><path d="M25 44c-1.5 4 0 8 2 10 1-4 2-6 2-9zM35 44c1.5 4 0 8-2 10-1-4-2-6-2-9z" fill="#FDE68A"/>' +
        '<rect x="19" y="26" width="22" height="20" rx="7" fill="#7C3AED"/><rect x="21" y="27" width="18" height="6" rx="3" fill="#fff" opacity=".2"/><rect x="16" y="31" width="6" height="14" rx="3" fill="#5B21B6"/><rect x="38" y="31" width="6" height="14" rx="3" fill="#5B21B6"/>' +
        '<circle cx="30" cy="18" r="10" fill="#EDE9FE"/><path d="M22 17a8 7 0 0 1 16 0v3H22z" fill="#38BDF8"/><path d="M24 15c2-3 6-4 9-3" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>' +
        '';
    },
    // fusée blanche, hublot, ailerons rouges, flamme
    rocket: function () {
      return '<defs>' + G.silver + '</defs><g transform="rotate(32 32 32)"><path d="M32 4c9 7 12 18 12 30v12H20V34c0-12 3-23 12-30z" fill="url(#IDs)"/><path d="M32 4c9 7 12 18 12 30H32z" fill="#94A3B8" opacity=".35"/>' +
        '<circle cx="32" cy="24" r="6" fill="#0EA5E9" stroke="#334155" stroke-width="2.4"/><circle cx="30" cy="22" r="2" fill="#fff" opacity=".8"/>' +
        '<path d="M20 36l-7 14h7zM44 36l7 14h-7z" fill="#EF4444"/><path d="M26 46h12l-2 5h-8z" fill="#475569"/><path d="M27 51c1 6 3 9 5 12 2-3 4-6 5-12z" fill="#F97316"/><path d="M29.5 51c.8 4 1.6 6 2.5 8 .9-2 1.7-4 2.5-8z" fill="#FDE68A"/></g>';
    },
    // diamant bleu + bombe
    mines: function () {
      return '<linearGradient id="IDm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A5F3FC"/><stop offset="1" stop-color="#0284C7"/></linearGradient>' +
        '<path d="M10 24l10-13h24l10 13-22 30z" fill="url(#IDm)"/><path d="M10 24h44M20 11l6 13 6-13 6 13 6-13M26 24l6 30M38 24l-6 30" stroke="#fff" stroke-width="1.2" opacity=".6" fill="none"/><path d="M22 14l4 8" stroke="#fff" stroke-width="2.6" opacity=".85" stroke-linecap="round"/>';
    },
    // pomme d'or brillante
    apple: function () {
      return '<defs>' + G.gold + '</defs><path d="M32 18c-5-5-17-5-20 6s4 28 13 28c3 0 4.5-1.5 7-1.5s4 1.5 7 1.5c9 0 16-17 13-28s-15-11-20-6z" fill="url(#IDg)"/>' +
        '<path d="M32 18c0-5 2-9 6-12" stroke="#78350F" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M35 12c5-4 11-4 13-1-4 5-9 5-13 1z" fill="#22C55E"/>' +
        '<ellipse cx="20" cy="28" rx="3.5" ry="6" fill="#fff" opacity=".55" transform="rotate(20 20 28)"/><g transform="translate(38 28) scale(.42)">' + SYM.worm + '</g>';
    },
    // tour de pierre, toit rouge, drapeau
    tower: function () {
      return '<linearGradient id="IDt" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#E7E5E4"/><stop offset="1" stop-color="#A8A29E"/></linearGradient>' +
        '<path d="M20 60V28h24v32z" fill="url(#IDt)"/><path d="M17 28h30l-15-18z" fill="#DC2626"/><path d="M32 10l15 18h-6z" fill="#991B1B"/><path d="M32 10V2" stroke="#78350F" stroke-width="2"/><path d="M32 2h10l-3 3 3 3H32z" fill="#FACC15"/>' +
        '<g stroke="#78716C" stroke-width="1" opacity=".6"><path d="M20 36h24M20 44h24M20 52h24M28 28v8M36 36v8M28 44v8M36 52v8"/></g><path d="M27 60V51a5 5 0 0 1 10 0v9z" fill="#78350F"/><rect x="29" y="33" width="6" height="8" rx="3" fill="#1E293B"/>';
    },
    // pièce d'or OROLADO + pièce d'argent
    coin: function () {
      return '<defs>' + G.gold + G.silver + '</defs><circle cx="44" cy="40" r="15" fill="url(#IDs)"/><circle cx="44" cy="40" r="11" fill="none" stroke="#64748B" stroke-width="1.5" opacity=".6"/>' +
        '<circle cx="27" cy="29" r="21" fill="#9A6A00"/><circle cx="27" cy="27" r="21" fill="url(#IDg)"/><circle cx="27" cy="27" r="16" fill="none" stroke="#9A6A00" stroke-width="2" opacity=".6"/>' +
        '<circle cx="27" cy="27" r="8.5" fill="none" stroke="#9A6A00" stroke-width="4.5"/><path d="M27 13v5M27 36v5" stroke="#9A6A00" stroke-width="3" stroke-linecap="round"/><path d="M14 18c4-6 10-8 16-7" stroke="#fff" stroke-width="2.4" opacity=".6" fill="none" stroke-linecap="round"/>';
    },
    // 2 dés : rouge et blanc
    dice: function () {
      return die(8, 20, 26, -16, 5, ['#FF6B81', '#C9184A'], '#fff') + die(30, 26, 26, 12, 3, ['#FFFFFF', '#CBD5E1'], '#1F2937');
    },
    // roue de la chance colorée avec ampoules et flèche
    wheel: function () {
      var c = ['#EF4444', '#F59E0B', '#22C55E', '#3B82F6', '#A855F7', '#EC4899', '#FACC15', '#14B8A6'], s = '';
      for (var i = 0; i < 8; i++) { var a0 = i * 45 * Math.PI / 180, a1 = (i + 1) * 45 * Math.PI / 180; s += '<path d="M32 34L' + (32 + 22 * Math.sin(a0)).toFixed(2) + ' ' + (34 - 22 * Math.cos(a0)).toFixed(2) + 'A22 22 0 0 1 ' + (32 + 22 * Math.sin(a1)).toFixed(2) + ' ' + (34 - 22 * Math.cos(a1)).toFixed(2) + 'Z" fill="' + c[i] + '"/>'; }
      var bulbs = ''; for (var j = 0; j < 12; j++) { var a = j * 30 * Math.PI / 180; bulbs += '<circle cx="' + (32 + 25.5 * Math.sin(a)).toFixed(2) + '" cy="' + (34 - 25.5 * Math.cos(a)).toFixed(2) + '" r="1.5" fill="#FFF7D6"/>'; }
      return '<defs>' + G.gold + '</defs><circle cx="32" cy="34" r="28" fill="url(#IDg)"/>' + bulbs + s + '<circle cx="32" cy="34" r="22" fill="none" stroke="#fff" stroke-width="1" opacity=".5"/><circle cx="32" cy="34" r="5.5" fill="url(#IDg)" stroke="#9A6A00"/><path d="M32 14l-5-10h10z" fill="#fff" stroke="#9A6A00" stroke-width="1.2"/>';
    },
    // roulette : cylindre bois, cases rouges / noires, centre doré, bille
    roulette: function () {
      var s = ''; for (var i = 0; i < 18; i++) { var a0 = i * 20 * Math.PI / 180, a1 = (i + 1) * 20 * Math.PI / 180; s += '<path d="M32 32L' + (32 + 22 * Math.sin(a0)).toFixed(2) + ' ' + (32 - 22 * Math.cos(a0)).toFixed(2) + 'A22 22 0 0 1 ' + (32 + 22 * Math.sin(a1)).toFixed(2) + ' ' + (32 - 22 * Math.cos(a1)).toFixed(2) + 'Z" fill="' + (i % 2 ? '#DC2626' : '#111827') + '"/>'; }
      return '<defs>' + G.gold + '</defs><circle cx="32" cy="32" r="29" fill="#7C2D12"/><circle cx="32" cy="32" r="26" fill="#B45309"/>' + s + '<circle cx="32" cy="32" r="13" fill="#78350F"/><circle cx="32" cy="32" r="9" fill="url(#IDg)"/>' +
        '<path d="M32 22v20M22 32h20" stroke="#9A6A00" stroke-width="2.4" stroke-linecap="round"/><circle cx="32" cy="32" r="3" fill="#FFF6C8"/><circle cx="47" cy="17" r="3.4" fill="#fff"/><circle cx="46" cy="16" r="1.2" fill="#fff" opacity=".9"/>';
    },
    // machine à sous 777
    slots: function () {
      return '<defs>' + G.red + G.gold + '</defs><rect x="8" y="12" width="44" height="44" rx="8" fill="url(#IDr)"/><rect x="8" y="12" width="44" height="10" rx="8" fill="#fff" opacity=".18"/>' +
        '<rect x="12" y="24" width="36" height="20" rx="4" fill="#fff"/><g font-family="system-ui" font-weight="900" font-size="15" text-anchor="middle" fill="#DC2626"><text x="18.5" y="39.5">7</text><text x="30" y="39.5">7</text><text x="41.5" y="39.5">7</text></g>' +
        '<path d="M24 25v18M36 25v18" stroke="#E5E7EB" stroke-width="1.4"/><rect x="14" y="48" width="32" height="4" rx="2" fill="#7F1D1D"/><path d="M54 30v-14" stroke="#9CA3AF" stroke-width="3" stroke-linecap="round"/><circle cx="54" cy="13" r="4.6" fill="url(#IDg)"/>' +
        '<rect x="16" y="5" width="28" height="8" rx="4" fill="url(#IDg)"/><text x="30" y="11.4" text-anchor="middle" font-size="6" font-weight="900" font-family="system-ui" fill="#7C2D12">JACKPOT</text>';
    },
    // cascade : pyramide de clous, bille rose, cases en bas
    plinko: function () {
      var p = ''; for (var r = 0; r < 5; r++) for (var c = 0; c <= r; c++) p += '<circle cx="' + (32 + (c - r / 2) * 9) + '" cy="' + (12 + r * 8) + '" r="2" fill="#E0E7FF"/>';
      var bins = ['#EF4444', '#F97316', '#FACC15', '#84CC16', '#FACC15', '#F97316', '#EF4444'].map(function (col, i) { return '<rect x="' + (2.5 + i * 8.5) + '" y="52" width="7.5" height="7" rx="2" fill="' + col + '"/>'; }).join('');
      return '<path d="M32 4L60 50H4z" fill="#134E4A" opacity=".55"/>' + p + bins + ball(36.5, 24, 5, '#FF7AB6', '#BE185D');
    },
    // cible + fléchette
    limbo: function () {
      return '<circle cx="28" cy="36" r="24" fill="#DC2626"/><circle cx="28" cy="36" r="19" fill="#fff"/><circle cx="28" cy="36" r="14" fill="#DC2626"/><circle cx="28" cy="36" r="9" fill="#fff"/><circle cx="28" cy="36" r="4.5" fill="#DC2626"/>' +
        '<path d="M28 36L52 12" stroke="#334155" stroke-width="2.6" stroke-linecap="round"/><path d="M50 8l8-2-2 8-4 1-3-3z" fill="#FACC15"/><path d="M48 10l6 6" stroke="#CA8A04" stroke-width="1"/>';
    },
    // boules de loterie numérotées
    keno: function () {
      return ball(20, 40, 13, '#F87171', '#B91C1C', '7') + ball(44, 40, 13, '#60A5FA', '#1D4ED8', '21') + ball(32, 21, 13, '#FDE047', '#CA8A04', '3');
    },
    // ticket à gratter doré, zone argent grattée, pièce
    scratch: function () {
      return '<defs>' + G.gold + G.silver + '</defs><g transform="rotate(-8 30 32)"><rect x="4" y="14" width="50" height="34" rx="5" fill="#7C3AED"/><rect x="4" y="14" width="50" height="8" rx="5" fill="#fff" opacity=".18"/>' +
        '<rect x="9" y="25" width="40" height="17" rx="3" fill="url(#IDs)"/><path d="M12 36c5-6 8 2 13-4s8 2 12-3" fill="none" stroke="#FDE68A" stroke-width="5" stroke-linecap="round"/><text x="22" y="37" font-size="9" font-weight="900" font-family="system-ui" fill="#9A3412">$</text></g>' +
        '<circle cx="50" cy="46" r="10" fill="url(#IDg)"/><circle cx="50" cy="46" r="6.5" fill="none" stroke="#9A6A00" stroke-width="1.5"/>';
    },
    // 2 cartes + flèches haut / bas
    hilo: function () {
      return card(10, 16, -12, 'A', '♠', false) + card(32, 16, 12, 'K', '♥', true);
    },
    // dragon (rouge) contre tigre (orange)
    dragon: function () {
      return '<radialGradient id="IDp" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#7DD3FC"/><stop offset="1" stop-color="#1D4ED8"/></radialGradient>' +
        '<g transform="rotate(-12 18 32)"><rect x="5" y="12" width="27" height="38" rx="5" fill="#1E40AF" stroke="#93C5FD" stroke-width="2"/>' +
        '<path d="M18.5 22c4 0 7 3 7 7 0 3-2 5.5-4.5 6.5 1.5-3-2-5-3-2-1 4-6 3-6-1 0-6 3-10.5 6.5-10.5z" fill="#FACC15" opacity=".55"/><circle cx="18.5" cy="31" r="6.5" fill="url(#IDp)"/><circle cx="16.5" cy="28.8" r="1.8" fill="#fff" opacity=".9"/></g>' +
        '<g transform="rotate(12 46 32)"><rect x="32" y="12" width="27" height="38" rx="5" fill="#EA580C" stroke="#FED7AA" stroke-width="2"/>' +
        '<path d="M38 22c3 5 4 10 3 17M44.5 20c3 6 4 12 3 20M51 22c3 5 4 10 3 17" stroke="#7C2D12" stroke-width="3.2" stroke-linecap="round" fill="none"/><path d="M38.6 22.4c2.4 4.4 3.2 8.6 2.6 13M45.1 20.6c2.4 5 3.2 10 2.6 15" stroke="#FFF7ED" stroke-width="1" stroke-linecap="round" fill="none" opacity=".7"/></g>' +
        '<circle cx="32" cy="50" r="8" fill="#111827" stroke="#FACC15" stroke-width="1.8"/><text x="32" y="53.4" text-anchor="middle" font-size="8.5" font-weight="900" font-family="system-ui" fill="#FACC15">VS</text>';
    },
    // baccara : 9 + K et jeton
    baccarat: function () {
      return card(8, 12, -12, '9', '♦', true) + card(26, 12, 8, 'K', '♣', false) +
        '<circle cx="48" cy="48" r="11" fill="#16A34A"/><circle cx="48" cy="48" r="11" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="4 4"/><circle cx="48" cy="48" r="6" fill="#fff"/><text x="48" y="50.6" text-anchor="middle" font-size="7" font-weight="900" font-family="system-ui" fill="#16A34A">$</text>';
    },
    // 3 dés
    sicbo: function () {
      return '<defs>' + G.gold + '</defs><path d="M8 46h48l-5 9H13z" fill="url(#IDg)"/><ellipse cx="32" cy="46" rx="24" ry="5" fill="#9A6A00"/><ellipse cx="32" cy="44.5" rx="21" ry="4" fill="#065F46"/>' +
        die(14, 33, 12, -12, 4, ['#FFFFFF', '#CBD5E1'], '#1F2937') + die(38, 33, 12, 10, 6, ['#FFFFFF', '#CBD5E1'], '#1F2937') + die(26, 29, 12, 4, 1, ['#FFFFFF', '#CBD5E1'], '#DC2626') +
        '<path d="M11 45c0-20 9-34 21-34s21 14 21 34" fill="#BAE6FD" opacity=".28" stroke="#E0F2FE" stroke-width="1.6"/><path d="M18 34c1-10 6-17 12-19" stroke="#fff" stroke-width="2.4" opacity=".7" fill="none" stroke-linecap="round"/><circle cx="32" cy="9" r="3.5" fill="url(#IDg)"/>';
    },
    // coffre ouvert plein d'or
    chests: function () {
      return '<defs>' + G.gold + '</defs><path d="M10 26L16 8h32l6 18z" fill="#B45309"/><path d="M14 22l4-10h28l4 10z" fill="#78350F" opacity=".5"/>' +
        '<circle cx="24" cy="27" r="6" fill="url(#IDg)"/><circle cx="34" cy="25" r="6.5" fill="url(#IDg)"/><circle cx="43" cy="28" r="5.5" fill="url(#IDg)"/><path d="M33 12l2 4 4.5.6-3.2 3 .8 4.4-4.1-2.2-4.1 2.2.8-4.4-3.2-3 4.5-.6z" fill="#fff" opacity=".95"/>' +
        '<path d="M8 28h48v24a5 5 0 0 1-5 5H13a5 5 0 0 1-5-5z" fill="#92400E"/><path d="M8 28h48v6H8z" fill="#78350F"/><path d="M8 28h48" stroke="#FACC15" stroke-width="3"/><path d="M32 28v29" stroke="#FACC15" stroke-width="3" opacity=".75"/><rect x="27" y="31" width="10" height="10" rx="2" fill="url(#IDg)"/>';
    },
    // ballon rouge brillant
    balloon: function () {
      return '<radialGradient id="IDb" cx="34%" cy="28%" r="78%"><stop offset="0" stop-color="#FFEDD5"/><stop offset=".35" stop-color="#FB923C"/><stop offset=".8" stop-color="#EA580C"/><stop offset="1" stop-color="#9A3412"/></radialGradient>' +
        '<path d="M32 4c11 0 19 8.5 19 19.5C51 37 40 46 32 48 24 46 13 37 13 23.5 13 12.5 21 4 32 4z" fill="url(#IDb)"/>' +
        '<path d="M32 4c-5 6-6 30 0 44M32 4c5 6 6 30 0 44" stroke="#9A3412" stroke-width=".8" opacity=".35" fill="none"/>' +
        '<path d="M20 15c2.5-5 7-8 11-8" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".8" fill="none"/><ellipse cx="21" cy="23" rx="2.2" ry="4.4" fill="#fff" opacity=".45"/>' +
        '<path d="M29 48.5l3 4 3-4z" fill="#C2410C"/><path d="M32 52.5c-3 3 3 5 0 8s2 3 1 4" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round"/>';
    },
    // but avec filet + ballon
    penalty: function () {
      var net = ''; for (var i = 1; i < 8; i++) net += '<path d="M' + (6 + i * 6.5) + ' 12V36"/>'; for (var j = 1; j < 4; j++) net += '<path d="M6 ' + (12 + j * 6) + 'H58"/>';
      return '<g stroke="#fff" stroke-width=".8" opacity=".55">' + net + '</g><path d="M6 38V12h52v26" fill="none" stroke="#fff" stroke-width="3.4" stroke-linejoin="round"/>' +
        '<g transform="translate(18 28) scale(.5)">' + OBJ.sports() + '</g>';
    },
    // voiture de course rouge (vue de 3/4), traits de vitesse
    race: function () {
      return '<defs>' + G.red + '</defs><path d="M2 30h10M4 37h8M2 44h9" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>' +
        '<path d="M12 42l3-9c1-2.5 3-4 5.5-4H38c2 0 4 1 5.5 2.5L49 37h7c2 0 4 2 4 4v3c0 1-1 2-2 2H14c-1.1 0-2-.9-2-2z" fill="url(#IDr)"/>' +
        '<path d="M22 31h14l5 6H19z" fill="#0F172A"/><path d="M24 32.5h10l3 3.5H22z" fill="#7DD3FC" opacity=".75"/><rect x="10" y="30" width="5" height="10" rx="1.5" fill="#B91C1C"/>' +
        '<circle cx="22" cy="46" r="6" fill="#111"/><circle cx="22" cy="46" r="2.6" fill="#CBD5E1"/><circle cx="50" cy="46" r="6" fill="#111"/><circle cx="50" cy="46" r="2.6" fill="#CBD5E1"/>' +
        '<circle cx="32" cy="40" r="3.6" fill="#fff"/><text x="32" y="42" text-anchor="middle" font-size="5" font-weight="900" font-family="system-ui" fill="#111">1</text>';
    },
    // 3 boules : vert, rouge, violet
    colors: function () {
      return ball(20, 40, 13, '#4ADE80', '#15803D') + ball(44, 40, 13, '#F87171', '#B91C1C') + ball(32, 21, 13, '#C084FC', '#6D28D9');
    },
    // cible de fléchettes + fléchette plantée
    darts: function () {
      var s = ''; for (var i = 0; i < 20; i++) { var a0 = (i * 18 - 9) * Math.PI / 180, a1 = (i * 18 + 9) * Math.PI / 180; s += '<path d="M30 34L' + (30 + 24 * Math.sin(a0)).toFixed(2) + ' ' + (34 - 24 * Math.cos(a0)).toFixed(2) + 'A24 24 0 0 1 ' + (30 + 24 * Math.sin(a1)).toFixed(2) + ' ' + (34 - 24 * Math.cos(a1)).toFixed(2) + 'Z" fill="' + (i % 2 ? '#F5F5DC' : '#111827') + '"/>'; }
      return '<circle cx="30" cy="34" r="28" fill="#1F2937"/>' + s + '<circle cx="30" cy="34" r="24" fill="none" stroke="#DC2626" stroke-width="2.6" stroke-dasharray="7.5 7.5"/><circle cx="30" cy="34" r="15" fill="none" stroke="#16A34A" stroke-width="2.4" stroke-dasharray="4.7 4.7"/>' +
        '<circle cx="30" cy="34" r="4.5" fill="#16A34A"/><circle cx="30" cy="34" r="2" fill="#DC2626"/><path d="M31 33l18-18" stroke="#94A3B8" stroke-width="2.4" stroke-linecap="round"/><path d="M47 13l3-9 4 6 6 2-7 5z" fill="#F59E0B"/><path d="M49 15l7-7" stroke="#fff" stroke-width="1" opacity=".7"/>';
    },
    // Cadeaux : défi (cible + flamme)
    g_defi: function () {
      return '<rect x="8" y="12" width="48" height="44" rx="7" fill="#fff"/><rect x="8" y="12" width="48" height="14" rx="7" fill="#E11D48"/><rect x="8" y="20" width="48" height="6" fill="#E11D48"/>' +
        '<rect x="18" y="6" width="5" height="12" rx="2.5" fill="#9F1239"/><rect x="41" y="6" width="5" height="12" rx="2.5" fill="#9F1239"/>' +
        '' +
        '<g fill="#22C55E"><circle cx="16" cy="40" r="4"/><circle cx="24" cy="40" r="4"/><circle cx="32" cy="40" r="4"/><circle cx="40" cy="40" r="4"/></g><circle cx="48" cy="40" r="4" fill="none" stroke="#CBD5E1" stroke-width="2"/>' +
        '<path d="M14 40l1.6 1.6 3-3M22 40l1.6 1.6 3-3M30 40l1.6 1.6 3-3M38 40l1.6 1.6 3-3" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round"/><text x="32" y="53" text-anchor="middle" font-size="6.5" font-weight="900" font-family="system-ui" fill="#9F1239">5 ×</text>';
    },
    // Cadeaux : tournoi (coupe d'or)
    g_top: function () {
      return '<defs>' + G.gold + '</defs><path d="M14 12h-8v6c0 8 6 13 12 13M50 12h8v6c0 8-6 13-12 13" fill="none" stroke="#CA8A04" stroke-width="4"/><path d="M16 8h32v12c0 10-7 18-16 18S16 30 16 20z" fill="url(#IDg)"/>' +
        '<rect x="28" y="38" width="8" height="8" fill="#CA8A04"/><rect x="20" y="46" width="24" height="8" rx="2" fill="url(#IDg)"/><rect x="16" y="54" width="32" height="5" rx="2" fill="#92400E"/><path d="M32 14l2.4 5 5.4.6-4 3.6 1.1 5.3L32 25.8l-4.9 2.7 1.1-5.3-4-3.6 5.4-.6z" fill="#fff" opacity=".9"/><path d="M20 12v8" stroke="#fff" stroke-width="2.4" opacity=".6" stroke-linecap="round"/>';
    },
    // Cadeaux : bonus dépôt (paquet cadeau + %)
    g_bon: function () {
      return '<rect x="10" y="26" width="44" height="30" rx="4" fill="#22C55E"/><rect x="7" y="18" width="50" height="11" rx="3" fill="#16A34A"/><rect x="28" y="18" width="8" height="38" fill="#FDE047"/><path d="M32 18c-6-10-17-10-15-3 1 4 9 4 15 3zM32 18c6-10 17-10 15-3-1 4-9 4-15 3z" fill="#FDE047" stroke="#CA8A04" stroke-width="1.4"/>' +
        '<circle cx="48" cy="44" r="11" fill="#fff"/><text x="48" y="48.5" text-anchor="middle" font-size="12" font-weight="900" font-family="system-ui" fill="#16A34A">%</text><rect x="12" y="28" width="14" height="4" rx="2" fill="#fff" opacity=".3"/>';
    },
    // Cadeaux : grande jauge (cadran coloré + aiguille)
    g_jauge: function () {
      return '<path d="M8 44a24 24 0 0 1 48 0" fill="none" stroke="#1E293B" stroke-width="12" stroke-linecap="round"/><path d="M8 44a24 24 0 0 1 12-20.8" fill="none" stroke="#22C55E" stroke-width="8" stroke-linecap="round"/><path d="M22 22.4a24 24 0 0 1 20 0" fill="none" stroke="#FACC15" stroke-width="8"/><path d="M44 23.2A24 24 0 0 1 56 44" fill="none" stroke="#EF4444" stroke-width="8" stroke-linecap="round"/>' +
        '<path d="M32 44L47 27" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/><circle cx="32" cy="44" r="5" fill="#fff"/><rect x="18" y="50" width="28" height="9" rx="4.5" fill="#2563EB"/><path d="M30 53.5h4" stroke="#fff" stroke-width="2" stroke-linecap="round"/>';
    },
    // Cadeaux : invitation (enveloppe + pièces)
    g_aff: function () {
      return '<defs>' + G.gold + '</defs><rect x="6" y="22" width="40" height="28" rx="4" fill="#A855F7"/><path d="M6 25l20 14 20-14" fill="none" stroke="#fff" stroke-width="2.6"/><rect x="9" y="24" width="12" height="3" rx="1.5" fill="#fff" opacity=".35"/>' +
        '<circle cx="48" cy="44" r="10" fill="url(#IDg)"/><circle cx="52" cy="28" r="8" fill="url(#IDg)"/><text x="48" y="47.6" text-anchor="middle" font-size="10" font-weight="900" font-family="system-ui" fill="#9A6A00">$</text><text x="52" y="31" text-anchor="middle" font-size="8" font-weight="900" font-family="system-ui" fill="#9A6A00">$</text>';
    },
    // Envoyer de l'argent (logo du transfert : deux flèches qui s'échangent + billet)
    g_send: function () {
      return '<rect x="8" y="18" width="40" height="26" rx="5" fill="#10B981"/><rect x="12" y="22" width="32" height="18" rx="3" fill="none" stroke="#D1FAE5" stroke-width="1.6"/><circle cx="28" cy="31" r="6" fill="#D1FAE5"/><text x="28" y="34.4" text-anchor="middle" font-size="9" font-weight="900" font-family="system-ui" fill="#047857">$</text>' +
        '<circle cx="46" cy="44" r="13" fill="#fff"/><path d="M40 41h11l-3-3M52 47H41l3 3" fill="none" stroke="#0D9488" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>';
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
    gem: '<path d="M10 24l9-12h26l9 12-22 28z" fill="#38BDF8"/><path d="M10 24h44L32 52z" fill="#0284C7"/><path d="M19 12l6 12 7-12 7 12 6-12" fill="none" stroke="#E0F2FE" stroke-width="1.4"/><path d="M21 15l4 7" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>',
    seven: '<path d="M14 12h36v8L32 54H21l17-32H14z" fill="#DC2626" stroke="#7F1D1D" stroke-width="2.4" stroke-linejoin="round"/><path d="M17 14h30" stroke="#FCA5A5" stroke-width="2" stroke-linecap="round"/>',
    bell: '<path d="M32 10c-10 0-15 8-15 18v9l-5 7h40l-5-7v-9c0-10-5-18-15-18z" fill="#FACC15" stroke="#A16207" stroke-width="2"/><circle cx="32" cy="49" r="5" fill="#A16207"/><path d="M22 26c0-6 3-10 8-11" stroke="#fff" stroke-width="2.4" opacity=".7" fill="none" stroke-linecap="round"/>',
    lemon: '<ellipse cx="32" cy="34" rx="20" ry="15" fill="#FDE047" stroke="#CA8A04" stroke-width="2" transform="rotate(-20 32 34)"/><ellipse cx="25" cy="29" rx="6" ry="3" fill="#fff" opacity=".6" transform="rotate(-20 25 29)"/><path d="M48 20c3-4 7-5 9-4-1 4-5 6-9 4z" fill="#22C55E"/>',
    cherry: '<path d="M22 40c4-14 10-24 20-28M42 40c-2-12 0-22 0-28" stroke="#15803D" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M42 12c6-3 11-2 13 1-5 3-9 3-13-1z" fill="#22C55E"/><circle cx="21" cy="45" r="10" fill="#DC2626"/><circle cx="43" cy="45" r="10" fill="#B91C1C"/><circle cx="18" cy="41" r="2.6" fill="#fff" opacity=".7"/><circle cx="40" cy="41" r="2.6" fill="#fff" opacity=".7"/>',
    star: '<path d="M32 8l7 15 16 2-12 11 3 16-14-8-14 8 3-16L9 25l16-2z" fill="#FACC15" stroke="#CA8A04" stroke-width="2" stroke-linejoin="round"/><path d="M26 24l6-11" stroke="#fff" stroke-width="2.4" opacity=".7" stroke-linecap="round"/>',
    crown: '<path d="M10 46l-2-26 13 11 11-17 11 17 13-11-2 26z" fill="#FACC15" stroke="#A16207" stroke-width="2" stroke-linejoin="round"/><rect x="10" y="46" width="44" height="7" rx="2" fill="#EAB308" stroke="#A16207" stroke-width="2"/><circle cx="32" cy="38" r="4" fill="#DC2626"/><circle cx="20" cy="40" r="2.6" fill="#2563EB"/><circle cx="44" cy="40" r="2.6" fill="#16A34A"/>',
    clover: '<g fill="#22C55E"><circle cx="24" cy="24" r="10"/><circle cx="40" cy="24" r="10"/><circle cx="24" cy="38" r="10"/><circle cx="40" cy="38" r="10"/></g><path d="M32 32c2 10 6 16 12 20" stroke="#15803D" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="21" cy="21" r="3" fill="#fff" opacity=".5"/>',
    coin: '<circle cx="32" cy="32" r="22" fill="#F5B700" stroke="#9A6A00" stroke-width="2.4"/><circle cx="32" cy="32" r="15" fill="none" stroke="#9A6A00" stroke-width="2" opacity=".6"/><circle cx="32" cy="32" r="7" fill="none" stroke="#9A6A00" stroke-width="4"/><path d="M20 22c3-4 8-6 12-6" stroke="#fff" stroke-width="2.4" opacity=".7" fill="none" stroke-linecap="round"/>',
    heart: '<path d="M32 52S10 38 10 24c0-7 5-12 11-12 5 0 9 3 11 7 2-4 6-7 11-7 6 0 11 5 11 12 0 14-22 28-22 28z" fill="#EF4444" stroke="#991B1B" stroke-width="2"/><ellipse cx="21" cy="22" rx="4" ry="3" fill="#fff" opacity=".6"/>',
    worm: '<path d="M18 50c0-8 10-8 10-17s-10-10-3-18" stroke="#F472B6" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M18 50c0-8 10-8 10-17s-10-10-3-18" stroke="#FBCFE8" stroke-width="2" fill="none" stroke-linecap="round" stroke-dasharray="1 6"/><circle cx="22.5" cy="13" r="1.8" fill="#111"/><circle cx="27.5" cy="15" r="1.8" fill="#111"/>',
    bomb: '<circle cx="30" cy="38" r="17" fill="#1F2937"/><circle cx="24" cy="31" r="5" fill="#fff" opacity=".22"/><path d="M41 25l6-8" stroke="#57534E" stroke-width="3.4" stroke-linecap="round"/><circle cx="48" cy="15" r="4" fill="#FBBF24"/><circle cx="48" cy="15" r="1.8" fill="#fff"/>',
    goldapple: '<path d="M32 18c-5-5-17-5-20 6s4 28 13 28c3 0 4.5-1.5 7-1.5s4 1.5 7 1.5c9 0 16-17 13-28s-15-11-20-6z" fill="#F5B700" stroke="#9A6A00" stroke-width="1.6"/><path d="M32 18c0-5 2-9 6-12" stroke="#78350F" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M35 12c5-4 11-4 13-1-4 5-9 5-13 1z" fill="#22C55E"/><ellipse cx="20" cy="28" rx="3.5" ry="6" fill="#fff" opacity=".6" transform="rotate(20 20 28)"/>',
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
  function obj(k) {
    var f = OBJ[k] || OBJ.coin, id = 'ca' + (++n);
    return '<svg class="cs-obj" viewBox="0 0 64 64" aria-hidden="true">' + f().replace(/ID/g, id) + '</svg>';
  }
  /* planète + objet posé dessus (sans carré) */
  function planet(k, cls) {
    var p = PAL[k] || PAL.coin;
    return '<span class="cs-pl' + (cls ? ' ' + cls : '') + '" style="--p1:' + p[0] + ';--p2:' + p[1] + '"><i></i>' + obj(k) + '</span>';
  }
  D6.CasinoArt = { PAL: PAL, obj: obj, planet: planet, sym: sym, car: car };
})(window.D6 = window.D6 || {});
