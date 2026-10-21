/* v2901 — live5 catalogue (owner request, round 5): 16 new LIVE games "races & sports" (shared rounds, casino_live5.php
   CASINO_LIVE5), module js/games/live5.js. Logos drawn here (64×64, same glossy style as the other live logos). */
(function (D6) {
  if (!D6.CasinoCatalog) return;
  function rg(id, a, b, c) { return '<radialGradient id="' + id + '" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="' + a + '"/><stop offset=".55" stop-color="' + b + '"/><stop offset="1" stop-color="' + c + '"/></radialGradient>'; }
  function lg(id, a, b) { return '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient>'; }
  var F = ' font-family="Arial,sans-serif" font-weight="900"';
  var sp = function (x, y, s) { return '<path d="M' + x + ' ' + (y - s) + 'l' + (s * .3) + ' ' + (s * .7) + ' ' + (s * .7) + ' ' + (s * .3) + '-' + (s * .7) + ' ' + (s * .3) + '-' + (s * .3) + ' ' + (s * .7) + '-' + (s * .3) + '-' + (s * .7) + '-' + (s * .7) + '-' + (s * .3) + ' ' + (s * .7) + '-' + (s * .3) + 'z" fill="#FFF7D6"/>'; };
  var sh = function (rx) { return '<ellipse cx="32" cy="57" rx="' + (rx || 21) + '" ry="3.6" fill="#000" opacity=".28"/>'; };
  var hl = function (d) { return '<path d="' + d + '" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".6"/>'; };
  var num = function (x, y, r, col, t, tc) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + col + '" stroke="#fff" stroke-width="1.2"/><text x="' + x + '" y="' + (y + r * .42) + '" text-anchor="middle" font-size="' + (r * 1.2) + '"' + F + ' fill="' + (tc || '#fff') + '">' + t + '</text>'; };
  var flag = function (x, y) { var h = '<path d="M' + x + ' ' + y + 'v22" stroke="#E2E8F0" stroke-width="1.6"/>'; for (var i = 0; i < 3; i++) for (var j = 0; j < 4; j++) h += '<rect x="' + (x + 1 + i * 3.4) + '" y="' + (y + j * 3) + '" width="3.4" height="3" fill="' + ((i + j) % 2 ? '#DC2626' : '#fff') + '"/>'; return h; };
  var ICONS = {
    // greyhound in red jacket n°1, leaping, with a checkered flag
    dogracelive: '<defs>' + lg('IDb', '#D6A77A', '#8B5E34') + rg('IDr', '#FCA5A5', '#DC2626', '#7F1D1D') + '</defs>' + sh(24) + flag(46, 9) +
      '<path d="M8 40L2 52M12 41L10 53" stroke="#7C5A3C" stroke-width="3.4" stroke-linecap="round"/><path d="M36 40L46 49M33 41L38 52" stroke="#8B6646" stroke-width="3.2" stroke-linecap="round"/>' +
      '<path d="M7 36Q-1 33-2 41" stroke="#9A7350" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
      '<path d="M6 38C5 28 18 26 26 28C31 29 33 26 36 22C39 19 44 19 46 22L56 27L54 31L44 30C40 33 38 37 35 40C27 45 9 47 6 38Z" fill="url(#IDb)"/><path d="M39 21L32 18L36 24Z" fill="#7C5A3C"/><circle cx="44" cy="24" r="1.3" fill="#111"/><circle cx="55.5" cy="28.6" r="1.1" fill="#1F2937"/>' +
      '<path d="M13 29h16l1 12H13z" fill="url(#IDr)" stroke="#fff" stroke-opacity=".5" stroke-width=".8"/><text x="21.5" y="39" text-anchor="middle" font-size="9"' + F + ' fill="#fff">1</text>' + hl('M14 31Q20 29 26 30') + sp(10, 12, 3),
    // camel with jockey under the desert sun
    camelracelive: '<defs>' + rg('IDs', '#FFF7D6', '#FDBA74', '#EA580C') + lg('IDc', '#E9B872', '#A16207') + '</defs>' + sh(24) +
      '<circle cx="8" cy="9" r="5.5" fill="url(#IDs)"/><path d="M3 51Q17 43 32 48T61 47Q60 56 32 57Q5 56 3 51Z" fill="#C2410C" opacity=".45"/>' +
      '<path d="M14 40L11 55M18 40L17 55" stroke="#A16207" stroke-width="3" stroke-linecap="round"/><path d="M36 40L40 55M33 40L34 55" stroke="#B4832F" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M8 38C7 30 12 27 17 27C19 19 27 19 29 27C33 28 36 31 38 30L41 18C42 14 48 14 49 18L50 21L47 23L45 23L42 34C40 41 32 42 26 42C18 42 9 44 8 38Z" fill="url(#IDc)" stroke="#78350F" stroke-width=".8"/>' +
      '<path d="M18 22h10l1 6H17z" fill="#2563EB"/><circle cx="23" cy="18" r="4" fill="#FDE2C4"/><path d="M19 16.5a4 4 0 0 1 8 0z" fill="#2563EB"/><circle cx="46" cy="19" r="1.1" fill="#111"/>' + hl('M20 28Q24 23 28 28'),
    // racing snail with a spiral shell and a speed trail
    snailracelive: '<defs>' + rg('IDs', '#FDA4AF', '#F43F5E', '#881337') + lg('IDb', '#FDE7C8', '#D6A570') + '</defs>' + sh(24) +
      '<path d="M2 50H22" stroke="#7DD3FC" stroke-width="4" stroke-linecap="round" opacity=".55"/><path d="M4 44H16" stroke="#7DD3FC" stroke-width="2.6" stroke-linecap="round" opacity=".45"/>' +
      '<path d="M12 52C12 46 24 45 36 45L46 42C48 34 52 31 54 33L54 40L51 47C48 52 40 54 30 54Z" fill="url(#IDb)" stroke="#A16207" stroke-width=".8"/>' +
      '<path d="M50 36L53 24M47 37L46 25" stroke="#A16207" stroke-width="1.6"/><circle cx="53.5" cy="23" r="2.4" fill="#1F2937"/><circle cx="46" cy="24" r="2.4" fill="#1F2937"/>' +
      '<circle cx="31" cy="34" r="15" fill="url(#IDs)" stroke="#FFE4E6" stroke-width="1.2"/><path d="M31 34m0 0a3.6 3.6 0 1 1 3.6 3.6a7.4 7.4 0 1 1-7.4-7.4a11 11 0 1 1 11 11" fill="none" stroke="#FFE4E6" stroke-width="2" opacity=".85"/>' + hl('M21 26Q25 21 31 20') + sp(10, 14, 3),
    // white hen sprinting, with a number bandana
    chickenracelive: '<defs>' + rg('IDw', '#FFFFFF', '#F5F5F4', '#A8A29E') + rg('IDr', '#FCA5A5', '#EF4444', '#991B1B') + '</defs>' + sh(22) +
      '<path d="M26 46L20 56h-5M32 46L38 56h5" stroke="#F59E0B" stroke-width="2.8" stroke-linecap="round" fill="none"/>' +
      '<path d="M10 28L3 17L12 23L8 12L17 22Z" fill="#E7E5E4"/><ellipse cx="27" cy="36" rx="18" ry="13" fill="url(#IDw)"/>' +
      '<path d="M23 34C14 31 11 41 19 44C24 45 28 40 23 34Z" fill="#E7E5E4" stroke="#D6D3D1"/>' +
      '<circle cx="44" cy="22" r="8.5" fill="url(#IDw)"/><path d="M39 14q3-7 6-2q3-5 5 2z" fill="url(#IDr)"/><path d="M52 21l7 2.5-7 2.5z" fill="#F59E0B"/><path d="M49 28q2 5-1 6q-2-3 1-6z" fill="#EF4444"/><circle cx="46" cy="20" r="1.4" fill="#111"/>' +
      '<path d="M34 30q6 5 12 0l1 4q-7 5-14 0z" fill="#2563EB"/>' + sp(55, 44, 2.6) + sp(9, 46, 2.4),
    // monster truck in mid-air over a crushed car
    monsterlive: '<defs>' + lg('IDg', '#4ADE80', '#15803D') + rg('IDf', '#FDE68A', '#F97316', '#7C2D12') + '</defs>' + sh(24) +
      '<path d="M4 56L22 44L24 56Z" fill="url(#IDf)"/><g transform="translate(46 54) scale(1 .6)"><path d="M-12 0v-4l3-1 3-3h9l3 3h4v5z" fill="#3B82F6" stroke="#0F172A" stroke-width=".7"/></g>' +
      '<g transform="translate(32 28) rotate(-10)"><path d="M-20-8h24l6-9h11l3 9h4v11h-48z" fill="url(#IDg)" stroke="#052E16" stroke-width="1.2"/><path d="M8-16h8l2 7h-12z" fill="#BAE6FD"/><path d="M-18-3h20" stroke="#FDE047" stroke-width="2.6"/>' +
      '<circle cx="-12" cy="8" r="9.5" fill="#334155" stroke="#94A3B8" stroke-width="2.4"/><circle cx="16" cy="8" r="9.5" fill="#334155" stroke="#94A3B8" stroke-width="2.4"/><circle cx="-12" cy="8" r="3" fill="#94A3B8"/><circle cx="16" cy="8" r="3" fill="#94A3B8"/></g>' +
      hl('M14 18Q24 13 34 14') + sp(54, 10, 3) + sp(8, 14, 2.4),
    // speedboat slicing the waves
    boatracelive: '<defs>' + lg('IDw', '#38BDF8', '#0369A1') + lg('IDh', '#F87171', '#B91C1C') + '</defs>' + sh(24) +
      '<path d="M2 44Q12 40 22 44T42 44T62 44V54Q32 60 2 54Z" fill="url(#IDw)"/><path d="M4 40L16 36L14 44Z" fill="#E0F2FE" opacity=".85"/>' +
      '<path d="M10 30H46L58 36L46 43H12Z" fill="url(#IDh)" stroke="#fff" stroke-width="1.2"/><path d="M12 38H48" stroke="#fff" stroke-opacity=".7" stroke-width="1.6"/>' +
      '<path d="M26 30L31 21H42L44 30Z" fill="#BAE6FD" stroke="#0369A1" stroke-width=".8"/><circle cx="35" cy="25" r="3.2" fill="#FDE2C4"/><path d="M31.8 24a3.2 3.2 0 0 1 6.4 0z" fill="#DC2626"/>' +
      '<text x="20" y="38.6" text-anchor="middle" font-size="8"' + F + ' fill="#fff">1</text>' + hl('M14 32H40') + sp(54, 12, 3),
    // rocket racing towards a ringed planet
    spaceracelive: '<defs>' + rg('IDp', '#FDE68A', '#F97316', '#7C2D12') + lg('IDr', '#F8FAFC', '#94A3B8') + '</defs>' + sh(22) +
      '<circle cx="48" cy="18" r="11" fill="url(#IDp)"/><ellipse cx="48" cy="18" rx="17" ry="4" fill="none" stroke="#FDE68A" stroke-width="1.6" transform="rotate(-18 48 18)"/>' +
      '<g transform="translate(30 38) rotate(-30)"><path d="M-20 0L-32-5Q-36 0-32 5Z" fill="#FDBA74"/><path d="M-20 0L-27-3Q-29 0-27 3Z" fill="#FEF3C7"/>' +
      '<path d="M-18-6L-23-14L-11-6Z" fill="#06B6D4"/><path d="M-18 6L-23 14L-11 6Z" fill="#06B6D4"/><path d="M-20-7H2Q12-7 17 0Q12 7 2 7H-20Z" fill="url(#IDr)" stroke="#475569" stroke-width=".8"/>' +
      '<path d="M2-7Q12-7 17 0Q12 7 2 7Z" fill="#06B6D4"/><circle cx="-4" cy="0" r="3.4" fill="#0EA5E9" stroke="#334155" stroke-width="1"/></g>' + sp(10, 12, 2.6) + sp(16, 52, 2) + sp(58, 46, 2.4),
    // ball flying into the top corner of a goal
    penaltylive: '<defs>' + lg('IDg', '#22C55E', '#14532D') + rg('IDb', '#FFFFFF', '#E2E8F0', '#94A3B8') + '</defs>' + sh(24) +
      '<rect x="8" y="12" width="48" height="38" fill="#38BDF8" opacity=".55"/><path d="M4 50H60V56H4Z" fill="url(#IDg)"/><g stroke="#fff" stroke-opacity=".35" stroke-width=".8"><path d="M16 14V48M24 14V48M32 14V48M40 14V48M48 14V48M8 22H56M8 30H56M8 38H56"/></g>' +
      '<path d="M8 50V12H56V50" stroke="#F8FAFC" stroke-width="3.4" fill="none" stroke-linejoin="round"/>' +
      '<g transform="translate(22 40) rotate(20)"><rect x="-4" y="-14" width="8" height="12" rx="3" fill="#FACC15"/><circle cy="-17" r="3.4" fill="#FDE2C4"/><path d="M-4-11L-12-4M4-11L10-18" stroke="#FACC15" stroke-width="3" stroke-linecap="round"/></g>' +
      '<circle cx="45" cy="21" r="7.5" fill="url(#IDb)" stroke="#1E3A8A" stroke-width=".8"/><path d="M45 17.6L48 19.8 47 23.2H43L42 19.8Z" fill="#1E3A8A"/><path d="M30 44Q38 34 40 26" stroke="#fff" stroke-width="1.4" stroke-dasharray="2 2" fill="none" opacity=".7"/>' + sp(58, 6, 2.6),
    // basketball dropping through a hoop
    basketlive: '<defs>' + rg('IDb', '#FDBA74', '#EA580C', '#7C2D12') + lg('IDg', '#F8FAFC', '#CBD5E1') + '</defs>' + sh(20) +
      '<rect x="14" y="6" width="36" height="24" rx="3" fill="url(#IDg)" stroke="#94A3B8"/><rect x="25" y="13" width="14" height="10" fill="none" stroke="#EF4444" stroke-width="1.6"/>' +
      '<circle cx="32" cy="27" r="10" fill="url(#IDb)"/><path d="M22 27H42M32 17V37M25 20Q32 27 25 34M39 20Q32 27 39 34" stroke="#431407" stroke-width="1.1" fill="none"/>' +
      '<path d="M18 32L23 52H41L46 32" stroke="#F8FAFC" stroke-width="1.4" fill="none"/><path d="M20 38L44 46M44 38L20 46M21 44H43" stroke="#F8FAFC" stroke-width="1" opacity=".7"/>' +
      '<path d="M16 32H48" stroke="#EF4444" stroke-width="3.6" stroke-linecap="round"/>' + hl('M26 21Q29 18 33 18') + sp(56, 14, 3) + sp(8, 44, 2.4),
    // two boxing gloves clashing
    boxinglive: '<defs>' + rg('IDr', '#FCA5A5', '#DC2626', '#7F1D1D') + rg('IDb', '#93C5FD', '#2563EB', '#1E3A8A') + '</defs>' + sh(24) +
      '<g transform="translate(20 34) rotate(-18)"><path d="M-12-6C-12-16 8-18 12-8C15 0 12 10 2 12H-8C-12 10-13 4-12-6Z" fill="url(#IDr)" stroke="#fff" stroke-opacity=".5"/><path d="M-12 4C-18 2-18-8-12-8" fill="url(#IDr)"/><rect x="-11" y="11" width="13" height="8" rx="2" fill="#F8FAFC"/></g>' +
      '<g transform="translate(44 34) rotate(18) scale(-1 1)"><path d="M-12-6C-12-16 8-18 12-8C15 0 12 10 2 12H-8C-12 10-13 4-12-6Z" fill="url(#IDb)" stroke="#fff" stroke-opacity=".5"/><path d="M-12 4C-18 2-18-8-12-8" fill="url(#IDb)"/><rect x="-11" y="11" width="13" height="8" rx="2" fill="#F8FAFC"/></g>' +
      '<path d="M32 10l3 8 7-3-4 7 7 3-8 2 2 7-7-4-3 7-2-7-7 3 4-7-7-3 8-1-2-8 7 4z" fill="#FDE047" opacity=".9"/>' + hl('M12 26Q16 20 22 20'),
    // tennis ball and racket
    tennislive: '<defs>' + rg('IDt', '#ECFCCB', '#A3E635', '#4D7C0F') + lg('IDr', '#C084FC', '#6D28D9') + '</defs>' + sh(22) +
      '<g transform="translate(26 28) rotate(-35)"><ellipse rx="13" ry="17" fill="none" stroke="url(#IDr)" stroke-width="4"/><path d="M-9-10H9M-12-4H12M-12 2H12M-10 8H10M-5-15V15M0-17V17M5-15V15" stroke="#E9D5FF" stroke-width=".8" opacity=".8"/><rect x="-3" y="17" width="6" height="18" rx="2" fill="#7C3AED"/></g>' +
      '<circle cx="44" cy="40" r="11" fill="url(#IDt)"/><path d="M35 34Q44 40 36 48M53 33Q44 40 52 47" stroke="#fff" stroke-width="1.6" fill="none"/>' + hl('M38 33Q41 30 45 30') + sp(54, 12, 3),
    // cricket bat, red ball and stumps
    cricketlive: '<defs>' + lg('IDw', '#FDE68A', '#B45309') + rg('IDb', '#FCA5A5', '#DC2626', '#7F1D1D') + '</defs>' + sh(22) +
      '<path d="M40 54V22M45 54V22M50 54V22" stroke="#FEF3C7" stroke-width="3" stroke-linecap="round"/><path d="M38 21H52" stroke="#F59E0B" stroke-width="2.6" stroke-linecap="round"/>' +
      '<g transform="translate(22 32) rotate(-30)"><rect x="-6" y="-20" width="12" height="34" rx="4" fill="url(#IDw)" stroke="#78350F" stroke-width=".8"/><rect x="-2" y="-34" width="4" height="15" rx="1.5" fill="#B91C1C"/></g>' +
      '<circle cx="32" cy="46" r="7" fill="url(#IDb)"/><path d="M26 44Q32 47 38 44" stroke="#FEE2E2" stroke-width="1" stroke-dasharray="1.4 1.4" fill="none"/>' + sp(10, 12, 2.6) + sp(56, 10, 2.4),
    // drawn longbow with a nocked arrow, a small target in the background
    archerylive: '<defs>' + lg('IDs', '#F59E0B', '#92400E') + lg('IDw', '#FDE68A', '#B45309') + '</defs>' + sh(22) +
      '<g transform="translate(46 16)"><circle r="11" fill="#F8FAFC" stroke="#94A3B8"/><circle r="8.4" fill="#2563EB"/><circle r="5.6" fill="#DC2626"/><circle r="2.8" fill="#FACC15"/></g>' +
      '<path d="M14 6Q38 30 14 56" stroke="url(#IDw)" stroke-width="4.4" fill="none" stroke-linecap="round"/><path d="M14 6Q38 30 14 56" stroke="#FEF3C7" stroke-width="1" fill="none" opacity=".6" transform="translate(-1 0)"/>' +
      '<path d="M14 6L8 31L14 56" stroke="#F8FAFC" stroke-width="1" fill="none"/><rect x="21" y="27" width="5" height="8" rx="2" fill="#7C3AED"/>' +
      '<path d="M8 31L44 18" stroke="url(#IDs)" stroke-width="2.4" stroke-linecap="round"/><path d="M44 18L39 17.5L41 22Z" fill="#CBD5E1"/><path d="M9 31L4 28M9 31L5 35M12 30L7 27M12 30L8 34" stroke="#EF4444" stroke-width="2" stroke-linecap="round"/>' + sp(56, 46, 3) + sp(50, 56, 2),
    // golden fish leaping on a fishing line
    fishinglive: '<defs>' + rg('IDf', '#FEF9C3', '#FACC15', '#B45309') + lg('IDw', '#38BDF8', '#075985') + '</defs>' + sh(22) +
      '<path d="M2 46Q16 40 32 46T62 46V54Q32 60 2 54Z" fill="url(#IDw)"/><path d="M20 4Q30 10 34 20" stroke="#E2E8F0" stroke-width="1" fill="none"/>' +
      '<g transform="translate(34 32) rotate(-28)"><path d="M-17 0Q-3-13 15-1Q16 0 15 1Q-3 13-17 0Z" fill="url(#IDf)" stroke="#92400E" stroke-width="1"/><path d="M-17 0L-27-9L-24 0L-27 9Z" fill="#F59E0B"/><path d="M-4-9L2-14L5-7" fill="#F59E0B"/><circle cx="8" cy="-2" r="2" fill="#111"/><path d="M-9-4Q-5 0-9 4M-3-6Q1 0-3 6" stroke="#FEF3C7" stroke-width="1.2" fill="none"/></g>' +
      '<path d="M8 44q4-6 8 0M44 48q4-5 8 0" stroke="#E0F2FE" stroke-width="1.4" fill="none"/>' + sp(54, 10, 3) + sp(10, 16, 2.4),
    // bunch of balloons with a dart
    balloonlive: '<defs>' + rg('IDr', '#FECACA', '#EF4444', '#991B1B') + rg('IDb', '#BFDBFE', '#3B82F6', '#1E3A8A') + rg('IDg', '#FEF9C3', '#FACC15', '#A16207') + '</defs>' + sh(18) +
      '<path d="M22 38L30 54M42 36L32 54M32 30V54" stroke="#E2E8F0" stroke-width=".9"/>' +
      '<ellipse cx="20" cy="26" rx="11" ry="13" fill="url(#IDb)"/><ellipse cx="44" cy="25" rx="11" ry="13" fill="url(#IDr)"/><ellipse cx="32" cy="18" rx="12" ry="14" fill="url(#IDg)"/>' +
      '<ellipse cx="28" cy="12" rx="3" ry="5" fill="#fff" opacity=".55"/><path d="M58 52L46 40" stroke="#94A3B8" stroke-width="2"/><path d="M46 40L43 34L50 38Z" fill="#E5E7EB"/><path d="M58 52L62 50M58 52L60 56" stroke="#EF4444" stroke-width="2.2"/>' + sp(8, 10, 2.6),
    // erupting volcano
    volcanolive: '<defs>' + lg('IDm', '#C2410C', '#7C2D12') + rg('IDl', '#FEF08A', '#F97316', '#B91C1C') + '</defs>' + sh(26) +
      '<path d="M2 56L24 26H40L62 56Z" fill="url(#IDm)"/><path d="M24 26H40L36 32H28Z" fill="#EA580C"/><path d="M28 32L25 44L31 38L30 50L35 36L38 42L36 32Z" fill="#F97316" opacity=".85"/>' +
      '<path d="M26 26Q22 10 32 4Q42 10 38 26Z" fill="url(#IDl)"/><circle cx="14" cy="14" r="4" fill="url(#IDl)"/><circle cx="52" cy="12" r="3.4" fill="url(#IDl)"/><circle cx="46" cy="4" r="2.2" fill="url(#IDl)"/>' +
      '<path d="M14 14Q22 6 30 8M52 12Q44 4 36 8" stroke="#FDBA74" stroke-width="1" fill="none" stroke-dasharray="2 2"/>'
  };
  var A = function (k, name, pal) { return { k: k, name: name, sec: 'live', file: 'live5', pal: pal, icon: ICONS[k] }; };
  D6.CasinoCatalog.add([
    A('dogracelive', 'Dog Race', ['#FEE2E2', '#B91C1C']),
    A('camelracelive', 'Camel Race', ['#FFEDD5', '#C2410C']),
    A('snailracelive', 'Snail Race', ['#FFE4E6', '#BE123C']),
    A('chickenracelive', 'Chicken Race', ['#FEF9C3', '#CA8A04']),
    A('monsterlive', 'Monster Truck', ['#DCFCE7', '#15803D']),
    A('boatracelive', 'Boat Race', ['#E0F2FE', '#0369A1']),
    A('spaceracelive', 'Space Race', ['#E0E7FF', '#4338CA']),
    A('penaltylive', 'Penalty Live', ['#DCFCE7', '#166534']),
    A('basketlive', 'Basketball', ['#FFEDD5', '#C2410C']),
    A('boxinglive', 'Boxing Live', ['#FEE2E2', '#1D4ED8']),
    A('tennislive', 'Tennis Live', ['#ECFCCB', '#4D7C0F']),
    A('cricketlive', 'Cricket Live', ['#FEF3C7', '#166534']),
    A('archerylive', 'Archery Live', ['#ECFCCB', '#3F6212']),
    A('fishinglive', 'Fishing Live', ['#E0F2FE', '#0369A1']),
    A('balloonlive', 'Balloon Pop', ['#F3E8FF', '#7C3AED']),
    A('volcanolive', 'Volcano Live', ['#FFEDD5', '#B91C1C'])
  ].filter(function (e) { return e.icon; }));
})(window.D6 = window.D6 || {});
