/* v2811 — Penalty (owner request): 9 aim zones (3×3), tap a target OR swipe the ball, a new articulated goalkeeper
   (proper proportions, kit, gloves, ready stance, real dives to each of the 9 zones), a classic panelled ball with shading/spin.
   Server v2811: K.multi('penalty','shoot',{z: 0..8}) (old {aim, h} still accepted) — same 2/3 goal chance, same payouts.
   v2807 — Penalty rebuilt again (owner request: "like the big providers' Penalty Shoot-Out"): night stadium in perspective
   (floodlights, stands, LED boards, striped pitch, goal with 3-D net), a real goalkeeper drawn in SVG who dives to the
   side the server drew (high / low, then falls on the grass), curved ball flight with spin + shadow, net shake on goals,
   6 clean aim zones, a series of up to 8 shots on the multiplier ladder, cash out between shots.
   Server unchanged: K.multi('penalty', 'start' | 'shoot' {aim: 0..2, h: 0|2} | 'cash' | 'state') — same payouts. */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit, $ = K.$;
  var T = {
    en: { bet: 'Bet', cash: 'Cash out', pick: 'Tap a target or swipe the ball', goal: 'Goal!', save: 'Saved!' },
    fr: { bet: 'Miser', cash: 'Encaisser', pick: 'Touchez une cible ou glissez le ballon', goal: 'But !', save: 'Arrêt !' },
    es: { bet: 'Apostar', cash: 'Retirar', pick: 'Toque un objetivo o deslice el balón', goal: '¡Gol!', save: '¡Parada!' },
    pt: { bet: 'Apostar', cash: 'Sacar', pick: 'Toque num alvo ou deslize a bola', goal: 'Gol!', save: 'Defesa!' },
    ar: { bet: 'راهن', cash: 'اسحب', pick: 'المس هدفًا أو اسحب الكرة', goal: 'هدف!', save: 'تصدّى!' },
    tr: { bet: 'Bahis', cash: 'Bozdur', pick: 'Bir hedefe dokunun ya da topu kaydırın', goal: 'Gol!', save: 'Kurtardı!' },
    vi: { bet: 'Cược', cash: 'Rút tiền', pick: 'Chạm mục tiêu hoặc vuốt quả bóng', goal: 'Vào!', save: 'Cản phá!' },
    id: { bet: 'Pasang', cash: 'Tarik', pick: 'Ketuk sasaran atau usap bola', goal: 'Gol!', save: 'Ditepis!' },
    ru: { bet: 'Ставка', cash: 'Забрать', pick: 'Нажмите на цель или смахните мяч', goal: 'Гол!', save: 'Отбил!' },
    de: { bet: 'Setzen', cash: 'Auszahlen', pick: 'Ziel antippen oder Ball wischen', goal: 'Tor!', save: 'Gehalten!' },
    hi: { bet: 'दांव', cash: 'कैश आउट', pick: 'निशाना छुएँ या गेंद को स्वाइप करें', goal: 'गोल!', save: 'बचाव!' },
    zh: { bet: '下注', cash: '兑现', pick: '点击目标或滑动足球', goal: '进球！', save: '扑救！' }
  };
  function L() { return Object.assign({}, T.en, T[K.lang()] || {}); }
  var ROWS = 8;
  // même échelle que le serveur : floor(0,96 × 1,5^k × 100) / 100
  var LADDER = []; for (var i = 1; i <= ROWS; i++) LADDER.push(Math.floor(0.96 * Math.pow(1.5, i) * 100 + 1e-6) / 100);
  /* scène 360 × 300 : but (cadre avant) x 72→288, y 72→168 ; point de penalty (180, 262) */
  var GX0 = 72, GX1 = 288, GY0 = 72, GY1 = 168, SPOT = [180, 262], BR = 12;
  // v2811 : 9 cibles, zone = hauteur × 3 + colonne : [colonne 0..2, hauteur 0 (haut) · 1 (milieu) · 2 (bas), x, y]
  var ZONES = []; [88, 120, 152].forEach(function (y, r) { [108, 180, 252].forEach(function (x, c) { ZONES.push([c, r, x, y]); }); });
  var D2R = Math.PI / 180;
  function nf(v, d) { return Number(v).toFixed(d).replace('.', K.dec()); }
  function fitGo(el) {
    if (!el || !el.isConnected) return;
    el.style.removeProperty('font-size');
    var fs = parseFloat(getComputedStyle(el).fontSize) || 20, min = fs * 0.5, n = 0;
    while (el.scrollWidth > el.clientWidth + 1 && fs > min && n++ < 30) { fs *= 0.93; el.style.setProperty('font-size', fs.toFixed(1) + 'px', 'important'); }
  }
  window.addEventListener('resize', function () { setTimeout(function () { if (document.querySelector('.cg-penalty')) fitGo($('csGo')); }, 200); });

  /* ------------------------------------------------------------------ décor (dessiné une fois) */
  function netPath() {
    // cadre arrière (plus petit, plus haut : la profondeur) : x 88→272, y 80→152
    var bx0 = 88, bx1 = 272, by0 = 80, by1 = 152, d = '', k, t;
    for (k = 1; k < 24; k++) { t = k / 24; var x = bx0 + (bx1 - bx0) * t; d += 'M' + x.toFixed(1) + ' ' + by0 + 'V' + by1; }
    for (k = 1; k < 9; k++) { t = k / 9; var y = by0 + (by1 - by0) * t; d += 'M' + bx0 + ' ' + y.toFixed(1) + 'H' + bx1; }
    // filets de côté (avant ↔ arrière)
    for (k = 1; k < 10; k++) {
      t = k / 10;
      var yf = GY0 + (GY1 - GY0) * t, yb = by0 + (by1 - by0) * t;
      d += 'M' + GX0 + ' ' + yf.toFixed(1) + 'L' + bx0 + ' ' + yb.toFixed(1) + 'M' + GX1 + ' ' + yf.toFixed(1) + 'L' + bx1 + ' ' + yb.toFixed(1);
    }
    for (k = 1; k < 3; k++) { t = k / 3; d += 'M' + (GX0 + (bx0 - GX0) * t).toFixed(1) + ' ' + (GY0 + (by0 - GY0) * t).toFixed(1) + 'V' + (GY1 + (by1 - GY1) * t).toFixed(1); d += 'M' + (GX1 + (bx1 - GX1) * t).toFixed(1) + ' ' + (GY0 + (by0 - GY0) * t).toFixed(1) + 'V' + (GY1 + (by1 - GY1) * t).toFixed(1); }
    // toit du filet
    for (k = 1; k < 24; k++) { t = k / 24; d += 'M' + (GX0 + (GX1 - GX0) * t).toFixed(1) + ' ' + GY0 + 'L' + (bx0 + (bx1 - bx0) * t).toFixed(1) + ' ' + by0; }
    return d;
  }
  function scene() {
    var stars = '';
    for (var s = 0; s < 34; s++) stars += '<circle cx="' + (-180 + K.seeded(s, 1) * 720).toFixed(0) + '" cy="' + (-260 + K.seeded(s, 2) * 290).toFixed(0) + '" r="' + (0.4 + K.seeded(s, 3) * 0.9).toFixed(1) + '"/>';
    var ads = '';
    [-420, -230, -40, 400, 590, 780].forEach(function (ax) { ads += '<text x="' + ax + '" y="160.2" text-anchor="middle">OROLADO</text>'; }); // jamais derrière le but
    var zones = ZONES.map(function (z, j) {
      return '<g class="pk-z" data-z="' + j + '"><rect x="' + (z[2] - 34) + '" y="' + (z[3] - 15) + '" width="68" height="30" rx="7"/>' +
        '<g transform="translate(' + z[2] + ' ' + z[3] + ')"><g class="pk-ret"><circle r="7.5"/><circle r="2" class="pk-dot"/><path d="M0-11.5v4M0 7.5v4M-11.5 0h4M7.5 0h4"/></g></g></g>';
    }).join('');
    var stripes = '';
    for (var b = 0; b < 7; b++) { var y0 = 168 + b * b * 3.2 + b * 6, y1 = 168 + (b + 1) * (b + 1) * 3.2 + (b + 1) * 6; if (b % 2) stripes += '<rect x="-600" y="' + y0.toFixed(1) + '" width="1560" height="' + (y1 - y0).toFixed(1) + '"/>'; }
    return '<svg class="pn-svg" viewBox="0 0 360 300" preserveAspectRatio="xMidYMid meet" dir="ltr">' +
      '<defs>' +
        '<linearGradient id="pkSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#090619"/><stop offset=".7" stop-color="#1D1250"/><stop offset="1" stop-color="#3B1F7A"/></linearGradient>' +
        '<linearGradient id="pkGrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14532D"/><stop offset=".25" stop-color="#1A7A3F"/><stop offset="1" stop-color="#0E4A27"/></linearGradient>' +
        '<radialGradient id="pkFl" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".25" stop-color="#E9D5FF" stop-opacity=".45"/><stop offset="1" stop-color="#C4B5FD" stop-opacity="0"/></radialGradient>' +
        '<radialGradient id="pkSpot" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
        '<linearGradient id="pkBeam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EDE9FE" stop-opacity=".22"/><stop offset="1" stop-color="#EDE9FE" stop-opacity="0"/></linearGradient>' +
        '<pattern id="pkCrowd" width="7" height="6" patternUnits="userSpaceOnUse"><rect width="7" height="6" fill="#1A1240"/><circle cx="1.8" cy="2" r="1.5" fill="#6D5BD0"/><circle cx="5.3" cy="4.2" r="1.5" fill="#F59E0B" opacity=".55"/><circle cx="5.2" cy="1" r=".9" fill="#E9D5FF" opacity=".5"/></pattern>' +
        '<linearGradient id="pkTier" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05030F" stop-opacity=".75"/><stop offset="1" stop-color="#05030F" stop-opacity="0"/></linearGradient>' +
        '<linearGradient id="pkLed" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FDE68A"/><stop offset=".5" stop-color="#F59E0B"/><stop offset="1" stop-color="#FDE68A"/></linearGradient>' +
        '<linearGradient id="pkPost" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#CBD5E1"/><stop offset=".45" stop-color="#fff"/><stop offset="1" stop-color="#94A3B8"/></linearGradient>' +
        '<linearGradient id="pkBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#94A3B8"/></linearGradient>' +
        '<linearGradient id="pkNetBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B0720" stop-opacity=".7"/><stop offset="1" stop-color="#0B0720" stop-opacity=".45"/></linearGradient>' +
        '<linearGradient id="pkShirt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FDE047"/><stop offset="1" stop-color="#F59E0B"/></linearGradient>' +
        '<radialGradient id="pkSkin" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#D9A066"/><stop offset="1" stop-color="#A86A35"/></radialGradient>' +
        '<radialGradient id="pkGBall" cx="36%" cy="30%" r="74%"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset=".85" stop-color="#1E293B" stop-opacity=".32"/><stop offset="1" stop-color="#0F172A" stop-opacity=".6"/></radialGradient>' +
        '<clipPath id="pkBc"><circle r="' + BR + '"/></clipPath>' +
        '<linearGradient id="pkShortG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#312E81"/><stop offset="1" stop-color="#1E1B4B"/></linearGradient>' +
        '<radialGradient id="pkPl" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#FDE68A"/><stop offset=".6" stop-color="#F59E0B"/><stop offset="1" stop-color="#7C2D12"/></radialGradient>' +
      '</defs>' +
      // ciel, étoiles, planète
      '<rect x="-600" y="-400" width="1560" height="560" fill="url(#pkSky)"/><g fill="#fff" opacity=".7" class="pk-stars">' + stars + '</g>' +
      '<g class="pk-planet"><circle cx="318" cy="-6" r="16" fill="url(#pkPl)"/><ellipse cx="318" cy="-6" rx="27" ry="6" fill="none" stroke="#FDE68A" stroke-opacity=".55" stroke-width="1.6" transform="rotate(-16 318 -6)"/></g>' +
      // toit du stade + projecteurs
      '<path d="M-600 30Q180 -8 960 30V44Q180 8-600 44z" fill="#120B2E"/><path d="M-600 44Q180 8 960 44" stroke="#8B5CF6" stroke-opacity=".5" stroke-width="1.2" fill="none"/>' +
      '<g class="pk-fl"><path d="M14 26L-60 170H120z" fill="url(#pkBeam)"/><path d="M346 26L240 170H420z" fill="url(#pkBeam)"/>' +
        '<rect x="2" y="18" width="24" height="9" rx="2" fill="#2E2266"/><rect x="334" y="18" width="24" height="9" rx="2" fill="#2E2266"/>' +
        '<circle cx="8" cy="22.5" r="2" fill="#fff"/><circle cx="14" cy="22.5" r="2" fill="#fff"/><circle cx="20" cy="22.5" r="2" fill="#fff"/><circle cx="340" cy="22.5" r="2" fill="#fff"/><circle cx="346" cy="22.5" r="2" fill="#fff"/><circle cx="352" cy="22.5" r="2" fill="#fff"/>' +
        '<circle class="pk-glow" cx="14" cy="22" r="30" fill="url(#pkFl)"/><circle class="pk-glow" cx="346" cy="22" r="30" fill="url(#pkFl)"/></g>' +
      // tribunes (3 étages)
      '<path d="M-600 50Q180 26 960 50V146H-600z" fill="url(#pkCrowd)"/><path d="M-600 50Q180 26 960 50V146H-600z" fill="url(#pkTier)"/>' +
      '<path d="M-600 86Q180 66 960 86M-600 118Q180 102 960 118" stroke="#05030F" stroke-opacity=".7" stroke-width="3" fill="none"/>' +
      // panneaux LED
      '<rect x="-600" y="148" width="1560" height="16" fill="#0B0720"/><rect x="-600" y="149.5" width="1560" height="13" fill="#170F3A"/>' +
      '<g class="pk-led" fill="url(#pkLed)" font-family="system-ui,-apple-system,sans-serif" font-weight="900" font-size="10" letter-spacing="2">' + ads + '</g>' +
      // pelouse en perspective + lignes
      '<rect x="-600" y="164" width="1560" height="500" fill="url(#pkGrass)"/><g fill="#fff" opacity=".045">' + stripes + '</g>' +
      '<ellipse cx="180" cy="200" rx="240" ry="70" fill="url(#pkSpot)"/>' +
      '<g fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.4"><path d="M-600 168H960"/><path d="M40 168L22 196H338L320 168"/><path d="M-30 168L-120 262H480L390 168"/>' +
        '<path d="M120 262Q180 292 240 262" stroke-opacity=".35"/></g>' +
      '<ellipse cx="' + SPOT[0] + '" cy="' + (SPOT[1] + 9) + '" rx="4.5" ry="1.8" fill="#fff" opacity=".75"/>' +
      // but : fond, filet (secoué quand il y a but), poteaux
      '<g id="pkNet"><path d="M72 72L88 80V152L72 168zM288 72L272 80V152L288 168z" fill="#0B0720" opacity=".35"/><rect x="88" y="80" width="184" height="72" fill="url(#pkNetBg)"/>' +
        '<path d="' + netPath() + '" stroke="#fff" stroke-opacity=".32" stroke-width=".6" fill="none"/><path d="M88 80H272V152H88z" stroke="#CBD5E1" stroke-opacity=".5" stroke-width="1.2" fill="none"/>' +
        '<path d="M72 168L88 152M288 168L272 152M72 72L88 80M288 72L272 80" stroke="#CBD5E1" stroke-opacity=".55" stroke-width="1.2"/></g>' +
      '<ellipse cx="180" cy="169" rx="118" ry="3.5" fill="#000" opacity=".25"/>' +
      // gardien
      keeperSvg() +
      // poteaux et barre (devant le filet et le gardien)
      '<rect x="67.5" y="69" width="5" height="100" rx="2" fill="url(#pkPost)"/><rect x="287.5" y="69" width="5" height="100" rx="2" fill="url(#pkPost)"/><rect x="67.5" y="67.5" width="225" height="5" rx="2.5" fill="url(#pkBar)"/>' +
      // zones de tir
      '<g class="pk-zones">' + zones + '</g>' +
      // ballon + ombre + traînée
      '<g id="pkBShadow" transform="translate(' + SPOT[0] + ' ' + (SPOT[1] + 10) + ')"><ellipse rx="11" ry="3" fill="#000" opacity=".4"/></g>' +
      '<g id="pkTrail" opacity="0"><circle r="' + BR + '" fill="#fff" opacity=".18"/><circle r="' + BR + '" fill="#fff" opacity=".1"/><circle r="' + BR + '" fill="#fff" opacity=".05"/></g>' +
      '<path id="pkAim" class="pk-aim" d=""/>' +
      '<g id="pkBall" transform="translate(' + SPOT[0] + ' ' + SPOT[1] + ')">' + ballSvg() + '</g>' +
      '<text id="pnFlash" class="pn-flash" x="180" y="58" text-anchor="middle"></text>' +
      '</svg>';
  }

  /* ------------------------------------------------------------------ petites aides d'animation */
  function ease(k) { return 1 - Math.pow(1 - k, 3); }
  function easeIn(k) { return k * k; }
  function easeIO(k) { return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
  function bez(a, c, b, t) { var u = 1 - t; return u * u * a + 2 * u * t * c + t * t * b; }
  function anim(box, ms, fn) {
    return new Promise(function (res) {
      var t0 = performance.now();
      var step = function (now) {
        if (!box.isConnected) { res(); return; }
        var k = Math.min(1, (now - t0) / ms); fn(k);
        if (k < 1) K.S.raf = requestAnimationFrame(step); else res();
      };
      K.S.raf = requestAnimationFrame(step);
    });
  }
  /* ------------------------------------------------------------------ le gardien : squelette articulé
     Repère du corps : origine = bassin, axe « haut » = colonne. Angles en degrés depuis le haut, sens horaire.
     Pose = { x, y (bassin dans la scène), rot (inclinaison du corps), a: [bras G, avant-bras G, bras D, avant-bras D,
              cuisse G, tibia G, cuisse D, tibia D] }. On passe d'une pose à l'autre en douceur (interpolation). */
  var SEG = { ua: 14, fa: 13, th: 17, sn: 17 };
  var READY = { x: 180, y: 136, rot: 0, a: [-138, -108, 138, 108, -162, 174, 162, -174] };
  function dirA(a) { var r = a * D2R; return [Math.sin(r), -Math.cos(r)]; }
  function off(p, a, L) { var d = dirA(a); return [p[0] + d[0] * L, p[1] + d[1] * L]; }
  function lerpPose(A, B, k) {
    var o = { x: A.x + (B.x - A.x) * k, y: A.y + (B.y - A.y) * k, rot: A.rot + (B.rot - A.rot) * k, a: [] };
    for (var i = 0; i < 8; i++) o.a.push(A.a[i] + (B.a[i] - A.a[i]) * k);
    return o;
  }
  // pose finale du plongeon vers la zone (colonne 0..2, hauteur 0 haut · 1 milieu · 2 bas) : les gants arrivent sur la cible
  function divePose(col, row) {
    var z = ZONES[row * 3 + col], tx = z[2], ty = z[3];
    if (col === 1) {
      if (row === 0) return { x: 180, y: Math.min(132, ty + 47), rot: 0, a: [-12, -4, 12, 4, -172, 176, 172, -176] };      // détente verticale, bras en l'air
      if (row === 1) return { x: 180, y: 135, rot: 0, a: [-160, 40, 160, -40, -164, 172, 164, -172] };                  // ballon bloqué contre la poitrine
      return { x: 180, y: 146, rot: 0, a: [-172, 176, 172, -176, -112, 178, 112, -178] };                                // il plonge au sol devant lui
    }
    var sg = col === 0 ? -1 : 1, R = [52, 74, 96][row] * sg, d = dirA(R);
    return { x: tx - d[0] * 49, y: ty - d[1] * 49, rot: R, a: [-4, 2, 4, -2, -172, -176, 168, 174] };
  }
  function fallPose(p) {
    if (!p.rot) return p;
    var sg = p.rot > 0 ? 1 : -1;
    return { x: p.x + sg * 8, y: 157, rot: sg * 96, a: [-10, 4, 10, -4, -176, -178, 176, 178] };
  }
  function gloveD() { return 'M-4.6 3C-5.6-2.5-4.6-8.6 0-9.4C4.6-8.6 5.6-2.5 4.6 3Z'; }
  function keeperSvg() {
    var leg = function (s) {
      return '<path id="kTh' + s + '" class="kp-skin" stroke-width="6.6"/><path id="kSn' + s + '" class="kp-skin" stroke-width="5.6"/>' +
        '<path id="kSk' + s + '" class="kp-sock" stroke-width="6.6"/><path id="kSh' + s + '" class="kp-short" stroke-width="10"/>' +
        '<g id="kBt' + s + '"><path d="M-3.6-1.6H3.6L4.6 3.2Q0 4.6-4.6 3.2Z" fill="#0F0F14"/><path d="M-3-0.2H3" stroke="#F8FAFC" stroke-width=".9"/></g>';
    };
    var arm = function (s) {
      return '<path id="kUa' + s + '" class="kp-sleeve" stroke-width="6.8"/><path id="kFa' + s + '" class="kp-sleeve2" stroke-width="5.8"/>' +
        '<g id="kGl' + s + '"><path d="' + gloveD() + '" fill="#F8FAFC" stroke="#94A3B8" stroke-width=".5"/><path d="M-4.4 1.4H4.4" stroke="#16A34A" stroke-width="2.4"/>' +
        '<path d="M-1.6-8V-2M1.6-8V-2" stroke="#CBD5E1" stroke-width=".6"/><ellipse cx="' + (s === 'L' ? 4.6 : -4.6) + '" cy="-2.6" rx="1.7" ry="3" fill="#E2E8F0" transform="rotate(' + (s === 'L' ? 28 : -28) + ' ' + (s === 'L' ? 4.6 : -4.6) + ' -2.6)"/></g>';
    };
    return '<g id="pkShadow"><ellipse rx="20" ry="3.4" fill="#000" opacity=".38"/></g>' +
      '<g id="pkK" class="kp">' + leg('L') + leg('R') +
        // short et maillot (fixes dans le repère du corps)
        '<path d="M-10-4H10L11 6Q6 7.6 2.2 6.4L0 3.4L-2.2 6.4Q-6 7.6-11 6Z" fill="url(#pkShortG)"/><path d="M-10-3.4H10" stroke="#FBBF24" stroke-width="1"/>' +
        '<path d="M-12-23Q-6-25.8 0-25.8Q6-25.8 12-23L11-12Q10.6-5 9.6-3.2H-9.6Q-10.6-5-11-12Z" fill="url(#pkShirt)"/>' +
        '<path d="M-11.6-21.5L-10.2-4M11.6-21.5L10.2-4" stroke="#7C3AED" stroke-width="1.6" opacity=".85"/>' +
        '<path d="M-5.6-12.5H5.6M-6-9.4H6" stroke="#7C3AED" stroke-width="1.2" opacity=".35"/>' +
        '<path d="M-3.6-25.6L0-21.6L3.6-25.6" fill="none" stroke="#5B21B6" stroke-width="1.8" stroke-linejoin="round"/>' +
        '<text x="0" y="-12.6" text-anchor="middle" font-size="7" font-weight="900" font-family="system-ui,sans-serif" fill="#5B21B6" opacity=".9">1</text>' +
        '<path d="M-11-6Q0-3.6 11-6" stroke="#000" stroke-opacity=".12" stroke-width="2" fill="none"/>' +
        // cou + tête
        '<path d="M-2.6-28.5H2.6V-24.5H-2.6Z" fill="url(#pkSkin)"/><path d="M-2.6-26H2.6" stroke="#7A4A22" stroke-opacity=".35" stroke-width="1"/>' +
        '<g id="kHead"><ellipse cx="-6" cy="-35.4" rx="1.3" ry="2" fill="#A86A35"/><ellipse cx="6" cy="-35.4" rx="1.3" ry="2" fill="#A86A35"/>' +
          '<ellipse cx="0" cy="-35.6" rx="5.9" ry="6.8" fill="url(#pkSkin)"/>' +
          '<path d="M-6-36.6Q-6.6-43.6 0-43.8Q6.6-43.6 6-36.6Q5.4-40 2.4-40.6Q-1.6-39-4.4-40.4Q-5.6-39.4-6-36.6Z" fill="#1F130A"/>' +
          '<path d="M-3.6-36.8h2M1.6-36.8h2" stroke="#2A1608" stroke-width=".9" stroke-linecap="round"/><circle cx="-2.6" cy="-35.2" r=".75" fill="#111"/><circle cx="2.6" cy="-35.2" r=".75" fill="#111"/>' +
          '<path d="M-1.6-31.4Q0-30.6 1.6-31.4" stroke="#7A3E14" stroke-width=".7" fill="none" stroke-linecap="round"/><path d="M0-35v2.2" stroke="#9A5C2B" stroke-width=".6"/></g>' +
        arm('L') + arm('R') +
      '</g>';
  }
  /* ------------------------------------------------------------------ le ballon : panneaux classiques, ombré, qui tourne */
  function pent(cx, cy, r, rot) { var d = ''; for (var i = 0; i < 5; i++) { var a = (rot + i * 72) * D2R; d += (i ? 'L' : 'M') + (cx + r * Math.sin(a)).toFixed(2) + ' ' + (cy - r * Math.cos(a)).toFixed(2); } return d + 'Z'; }
  function ballSvg() {
    var pan = pent(0, 0, 4.4, 0), seams = '';
    for (var i = 0; i < 5; i++) {
      var a = i * 72, c = off([0, 0], a + 36, 11.6);
      pan += pent(c[0], c[1], 4.6, a + 36 + 180);
      var p0 = off([0, 0], a, 4.4), p1 = off([0, 0], a, 8.6);
      seams += 'M' + p0[0].toFixed(2) + ' ' + p0[1].toFixed(2) + 'L' + p1[0].toFixed(2) + ' ' + p1[1].toFixed(2);
      var q = off([0, 0], a, 8.6), q1 = off(q, a - 60, 3.4), q2 = off(q, a + 60, 3.4);
      seams += 'M' + q[0].toFixed(2) + ' ' + q[1].toFixed(2) + 'L' + q1[0].toFixed(2) + ' ' + q1[1].toFixed(2) + 'M' + q[0].toFixed(2) + ' ' + q[1].toFixed(2) + 'L' + q2[0].toFixed(2) + ' ' + q2[1].toFixed(2);
    }
    return '<circle r="' + BR + '" fill="#F8FAFC"/><g clip-path="url(#pkBc)"><g id="pkSpin"><path d="' + pan + '" fill="#111827"/><path d="' + seams + '" stroke="#64748B" stroke-width=".7" fill="none"/></g></g>' +
      '<circle r="' + BR + '" fill="url(#pkGBall)"/><ellipse cx="-4.4" cy="-5.6" rx="3.8" ry="2.4" fill="#fff" opacity=".75" transform="rotate(-30 -4.4 -5.6)"/>' +
      '<circle r="' + BR + '" fill="none" stroke="#0F172A" stroke-opacity=".45" stroke-width=".8"/>';
  }

  K.register('penalty', function (box, x) {
    var l = L(), g = null, busy = false, nShot = 0;
    box.classList.add('cg-game', 'cg-penalty');
    box.innerHTML = '<div class="cg-stage pn-stage">' +
        '<div class="pn-lad" id="pnLad">' + LADDER.map(function (m, k) { return '<span data-k="' + k + '"><i>' + (k + 1) + '</i><b class="fit">×' + nf(m, 2) + '</b></span>'; }).join('') + '</div>' +
        '<div class="pn-field">' + scene() + '<div class="pn-tip"><b class="fit" id="pnTip"></b></div></div>' +
      '</div>' + K.stakePanel(l.bet);
    K.bindStake(box);
    var go = $('csGo'), kSh = $('pkShadow'), kG = $('pkK'), ball = $('pkBall'), spin = $('pkSpin'), bSh = $('pkBShadow'), trail = $('pkTrail'), net = $('pkNet'), aimL = $('pkAim');
    var lite = function () { return document.documentElement.classList.contains('oro-lite'); };
    function live() { return g && !g.done; }
    var svg = box.querySelector('.pn-svg');
    function fitView() {
      if (!svg.isConnected) return;
      var w = svg.clientWidth, h = svg.clientHeight; if (!w || !h) return;
      var cx = 50, cy = 30, cw = 260, ch = 256, ar = w / h, vx, vy, vw, vh;
      if (ar > cw / ch) { vh = ch; vw = ch * ar; vx = 180 - vw / 2; vy = cy; }
      else { vw = cw; vh = cw / ar; vx = cx; vy = cy + ch - vh + (vh - ch) * 0.35; }
      svg.setAttribute('viewBox', vx.toFixed(1) + ' ' + vy.toFixed(1) + ' ' + vw.toFixed(1) + ' ' + vh.toFixed(1));
    }
    if (window.ResizeObserver) new ResizeObserver(fitView).observe(svg); else window.addEventListener('resize', fitView);
    requestAnimationFrame(fitView);

    /* ---- le gardien (rendu d'une pose) ---- */
    var KE = {}; ['ThL', 'SnL', 'SkL', 'ShL', 'BtL', 'ThR', 'SnR', 'SkR', 'ShR', 'BtR', 'UaL', 'FaL', 'GlL', 'UaR', 'FaR', 'GlR'].forEach(function (k) { KE[k] = $('k' + k); });
    var seg = function (el, a, b) { el.setAttribute('d', 'M' + a[0].toFixed(2) + ' ' + a[1].toFixed(2) + 'L' + b[0].toFixed(2) + ' ' + b[1].toFixed(2)); };
    var mid = function (a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; };
    var cur = READY;
    function drawK(P) {
      cur = P;
      kG.setAttribute('transform', 'translate(' + P.x.toFixed(2) + ' ' + P.y.toFixed(2) + ') rotate(' + P.rot.toFixed(2) + ')');
      var A = P.a;
      [['L', -1, 0], ['R', 1, 2]].forEach(function (s) {
        var sh = [s[1] * 10, -22], el = off(sh, A[s[2]], SEG.ua), ha = off(el, A[s[2] + 1], SEG.fa);
        seg(KE['Ua' + s[0]], sh, el); seg(KE['Fa' + s[0]], el, ha);
        KE['Gl' + s[0]].setAttribute('transform', 'translate(' + ha[0].toFixed(2) + ' ' + ha[1].toFixed(2) + ') rotate(' + A[s[2] + 1].toFixed(1) + ')');
        var hp = [s[1] * 5, -1], kn = off(hp, A[s[2] + 4], SEG.th), an = off(kn, A[s[2] + 5], SEG.sn);
        seg(KE['Th' + s[0]], hp, kn); seg(KE['Sh' + s[0]], hp, mid(hp, kn, 0.62));
        seg(KE['Sn' + s[0]], kn, an); seg(KE['Sk' + s[0]], mid(kn, an, 0.22), an);
        KE['Bt' + s[0]].setAttribute('transform', 'translate(' + an[0].toFixed(2) + ' ' + an[1].toFixed(2) + ') rotate(' + (A[s[2] + 5] - 180).toFixed(1) + ')');
      });
      // ombre au sol : plus petite et plus pâle quand il est en l'air
      var lift = Math.max(0, 136 - P.y), w = 1 + Math.abs(Math.sin(P.rot * D2R)) * 1.4;
      kSh.setAttribute('transform', 'translate(' + P.x.toFixed(1) + ' 168) scale(' + (w * Math.max(0.5, 1 - lift / 60)).toFixed(2) + ' 1)');
      kSh.style.opacity = String(Math.max(0.35, 1 - lift / 50).toFixed(2));
    }

    function paintLadder() {
      var k = g ? g.k || 0 : 0;
      box.querySelectorAll('#pnLad span').forEach(function (s, i) {
        var c = '';
        if (g && i < k) c = 'ok';
        if (live() && i === k) c = 'cur';
        if (g && g.done && !(g.win > 0) && g.boom === i) c = 'miss';
        s.className = c;
      });
    }
    function paint() {
      paintLadder();
      var on = live() && !busy;
      box.classList.toggle('aim', !!on);
      K.setText($('pnTip'), on ? l.pick : '');
      if (live()) {
        go.classList.add('cash'); go.disabled = busy || !(g.k > 0);
        K.setText(go, g.k > 0 ? l.cash + ' $ ' + K.m2(g.stake * g.mult) : l.cash);
      } else { go.classList.remove('cash'); go.disabled = busy; K.setText(go, l.bet); }
      fitGo(go);
    }
    /* ---- pièces mobiles ---- */
    function setBall(x, y, s, rot) {
      ball.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + s.toFixed(3) + ')');
      spin.setAttribute('transform', 'rotate(' + (rot || 0).toFixed(0) + ')');
    }
    function setBShadow(x, y, s, o) { bSh.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + s.toFixed(3) + ')'); bSh.style.opacity = o; }
    function reset() {
      drawK(READY); setBall(SPOT[0], SPOT[1], 1, 0); setBShadow(SPOT[0], SPOT[1] + 10, 1, 1);
      trail.setAttribute('opacity', '0'); net.removeAttribute('transform'); ball.style.opacity = '';
    }
    function flash(txt, cls) {
      var f = $('pnFlash');
      f.setAttribute('class', 'pn-flash'); f.textContent = txt; f.style.fontSize = '34px';
      try { var w = f.getComputedTextLength(); if (w > 200) f.style.fontSize = (34 * 200 / w).toFixed(1) + 'px'; } catch (e) { /* ignore */ }
      void f.getBoundingClientRect(); f.setAttribute('class', 'pn-flash on ' + cls);
    }
    // attente : le gardien se balance d'un pied sur l'autre, gants prêts (très léger)
    var idleT = 0;
    function idle(now) {
      if (!box.isConnected) return;
      if (!busy && !lite()) {
        var t = (now || 0) / 1000, s1 = Math.sin(t * 1.7), s2 = Math.sin(t * 3.4);
        drawK({ x: 180 + s1 * 3, y: 136 + Math.abs(s2) * 0.9, rot: s1 * 1.5, a: [-138 + s2 * 3, -108 + s2 * 4, 138 - s2 * 3, 108 - s2 * 4, -162 + s1 * 2, 174, 162 + s1 * 2, -174] });
      }
      idleT = requestAnimationFrame(idle); K.S.raf = idleT;
    }

    async function shoot(zi) {
      if (!live() || busy) return;
      busy = true; paint(); cancelAnimationFrame(idleT); aimL.setAttribute('d', '');
      var z = ZONES[zi], col = zi % 3, row = Math.floor(zi / 3);
      box.querySelectorAll('.pk-z').forEach(function (t) { t.classList.toggle('sel', +t.getAttribute('data-z') === zi); t.classList.remove('hov'); });
      // z : 9 zones (serveur v2811) ; aim/h : lu par un serveur plus ancien pendant la mise en ligne
      var r = await K.multi('penalty', 'shoot', { z: zi, aim: col, h: row });
      if (!box.isConnected) return;
      if (!r) { busy = false; paint(); K.S.raf = idleT = requestAnimationFrame(idle); return; }
      nShot++;
      var shot = (r.shots || [])[(r.shots || []).length - 1] || [col, row, 1, 1];
      var kcol = +shot[2], goal = !!+shot[3];
      var krow = shot.length > 4 ? +shot[4] : (kcol === col ? row : Math.floor(K.seeded(nShot, zi + 3) * 3) % 3);
      var target = divePose(kcol, krow), from = cur;
      var fast = lite(), TB = fast ? 320 : 620, TK = fast ? 280 : 520, delay = fast ? 0 : 90;
      var tx = z[2], ty = z[3], cxp = (SPOT[0] + tx) / 2 + (tx - 180) * 0.32 + (col === 1 ? 14 : 0), cyp = Math.min(SPOT[1], ty) - 34 - (row === 0 ? 24 : row === 1 ? 10 : 0);
      var endS = 0.42, trailOn = !fast, side = target.rot !== 0;
      var hist = [];
      await anim(box, TB, function (k) {
        var t = ease(k), bx = bez(SPOT[0], cxp, tx, t), by = bez(SPOT[1], cyp, ty, t), s = 1 - (1 - endS) * t;
        setBall(bx, by, s, k * 1080);
        var gy = SPOT[1] + 10 + (168 - SPOT[1] - 10) * t;
        setBShadow(bx, gy, s, Math.max(0.15, 1 - (gy - by) / 120));
        if (trailOn) {
          hist.unshift([bx, by, s]); if (hist.length > 9) hist.pop();
          trail.setAttribute('opacity', '1');
          [2, 5, 8].forEach(function (h, j) { var p = hist[Math.min(h, hist.length - 1)]; trail.children[j].setAttribute('transform', 'translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ') scale(' + p[2].toFixed(3) + ')'); });
        }
        var kk = Math.max(0, Math.min(1, (k * TB - delay) / TK)), e = easeIO(kk), P = lerpPose(from, target, e);
        if (side) P.y -= 12 * Math.sin(Math.PI * e) * (krow === 2 ? 0.4 : 1); // l'élan : il décolle puis s'allonge
        else if (krow !== 1) P.y -= 5 * Math.sin(Math.PI * e);
        drawK(P);
      });
      trail.setAttribute('opacity', '0');
      if (!box.isConnected) return;
      g = r;
      // suite : il retombe sur la pelouse ; filet qui tremble (but) ou ballon repoussé (arrêt)
      var land = fallPose(target);
      var fall = side ? anim(box, fast ? 220 : 480, function (k) { drawK(lerpPose(target, land, easeIn(k))); }) : anim(box, fast ? 150 : 360, function (k) { drawK(lerpPose(target, READY, easeIO(k) * 0.5)); });
      if (goal) {
        flash(l.goal, 'goal');
        await anim(box, fast ? 260 : 720, function (k) {
          var s1 = Math.min(1, k * 4), bx = tx + (tx - 180) * 0.07 * s1, by = ty + 5 * s1 + (k > 0.25 ? (150 - ty) * easeIn((k - 0.25) / 0.75) : 0);
          setBall(bx, Math.min(by, 150), endS - 0.05 * s1, 1080 + k * 160);
          setBShadow(bx, 154, endS, 0.5);
          if (!fast) { var d = Math.exp(-k * 4.2) * Math.cos(k * 26); net.setAttribute('transform', 'translate(' + ((tx - 180) * 0.02 * d).toFixed(2) + ' ' + (2.6 * d).toFixed(2) + ')'); }
        });
        net.removeAttribute('transform');
      } else {
        flash(l.save, 'save');
        var sd = col === 0 ? -1 : col === 2 ? 1 : (K.seeded(nShot, 9) < 0.5 ? -1 : 1), central = col === 1;
        var ex = central ? 180 + sd * 54 : tx + sd * 84, ey = central ? 228 : 178, ec = central ? 0.9 : 0.5, pk = central ? ty - 30 : ty - 26;
        await anim(box, fast ? 260 : 660, function (k) {
          var bx = tx + (ex - tx) * k, by = bez(ty, pk, ey, k), s = endS + (ec - endS) * k;
          setBall(bx, by, s, 1080 - k * 600); setBShadow(bx, central ? 168 + (ey + 10 - 168) * k : 168 + 8 * k, s, 0.5);
          ball.style.opacity = String(1 - Math.max(0, k - 0.7) / 0.3);
        });
      }
      await fall;
      if (!box.isConnected) return;
      paintLadder();
      if (r.done) K.resultLine(box, r);
      await K.sleep(fast ? 220 : 700);
      if (!box.isConnected) return;
      // il se relève et revient au centre ; le ballon revient sur le point
      var back = cur;
      await anim(box, fast ? 1 : 420, function (k) { drawK(lerpPose(back, READY, easeIO(k))); });
      reset();
      if (ball.animate) ball.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220 });
      box.querySelectorAll('.pk-z.sel').forEach(function (t) { t.classList.remove('sel'); });
      busy = false; paint();
      K.S.raf = idleT = requestAnimationFrame(idle);
    }
    box.querySelectorAll('.pk-z').forEach(function (t) { t.addEventListener('click', function () { if (!swiped) shoot(+t.getAttribute('data-z')); }); });

    /* ---- tir au doigt : glisser le ballon vers une zone (comme les grands jeux de penalty) ---- */
    var sw = null, swiped = false;
    var toSvg = function (e) { var m = svg.getScreenCTM(); if (!m) return null; var p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; p = p.matrixTransform(m.inverse()); return [p.x, p.y]; };
    var zoneOf = function (a, b) {
      var dy = a[1] - b[1]; if (dy < 10 || Math.hypot(b[0] - a[0], dy) < 16) return -1;
      var cl, rw;
      if (b[1] <= 174) { // relâché sur le but : la zone sous le doigt
        cl = b[0] < 144 ? 0 : b[0] > 216 ? 2 : 1; rw = b[1] < 104 ? 0 : b[1] < 136 ? 1 : 2;
      } else { // relâché avant le but : la direction donne le côté, la longueur du geste la hauteur
        var xg = SPOT[0] + (b[0] - a[0]) / dy * (SPOT[1] - 120), f = dy / (SPOT[1] - 168);
        cl = xg < 144 ? 0 : xg > 216 ? 2 : 1; rw = f < 0.42 ? 2 : f < 0.8 ? 1 : 0;
      }
      return rw * 3 + cl;
    };
    svg.addEventListener('pointerdown', function (e) {
      swiped = false;
      if (!live() || busy || e.target.closest('.pk-z')) return;
      var p = toSvg(e); if (!p || p[1] < 172) return;
      sw = { a: p, id: e.pointerId, z: -1 };
      try { svg.setPointerCapture(e.pointerId); } catch (er) { /* ignore */ }
    });
    svg.addEventListener('pointermove', function (e) {
      if (!sw || e.pointerId !== sw.id) return;
      var p = toSvg(e); if (!p) return;
      var z = zoneOf(sw.a, p); sw.z = z;
      box.querySelectorAll('.pk-z').forEach(function (t) { t.classList.toggle('hov', +t.getAttribute('data-z') === z); });
      if (z >= 0) { var Z = ZONES[z]; aimL.setAttribute('d', 'M' + SPOT[0] + ' ' + SPOT[1] + 'Q' + ((SPOT[0] + Z[2]) / 2 + (Z[2] - 180) * 0.32).toFixed(1) + ' ' + (Math.min(SPOT[1], Z[3]) - 34).toFixed(1) + ' ' + Z[2] + ' ' + Z[3]); }
      else aimL.setAttribute('d', '');
    });
    var endSw = function (e) {
      if (!sw || (e && e.pointerId !== sw.id)) return;
      var p = e && e.type === 'pointerup' ? toSvg(e) : null, z = p ? zoneOf(sw.a, p) : -1;
      sw = null; aimL.setAttribute('d', '');
      box.querySelectorAll('.pk-z.hov').forEach(function (t) { t.classList.remove('hov'); });
      if (z >= 0) { swiped = true; setTimeout(function () { swiped = false; }, 350); shoot(z); }
    };
    svg.addEventListener('pointerup', endSw);
    svg.addEventListener('pointercancel', endSw);

    go.addEventListener('click', async function () {
      if (busy) return;
      busy = true; paint();
      var r = await K.multi('penalty', live() ? 'cash' : 'start');
      if (!box.isConnected) return;
      busy = false;
      if (r) { g = r; if (r.done) K.resultLine(box, r); else $('pnFlash').setAttribute('class', 'pn-flash'); }
      paint();
    });
    box._pk = { drawK: drawK, pose: divePose, lerp: lerpPose, fall: fallPose, ready: READY, setBall: setBall, stop: function () { busy = true; cancelAnimationFrame(idleT); } }; // essais (aperçu des poses)
    reset(); paint();
    requestAnimationFrame(function () { K.fitAll(box.querySelector('#pnLad')); });
    K.S.raf = idleT = requestAnimationFrame(idle);
    K.multi('penalty', 'state', null, true).then(function (r) { if (r && !r.done && box.isConnected && !g) { g = r; paint(); } });
  }, { rules: {
    en: '1. Tap “Bet”, then tap one of the 9 targets in the goal (3 left, 3 centre, 3 right — high, middle or low), or swipe the ball towards it.\n2. The keeper guards one side (left, centre or right): 2 shots in 3 go in. Each goal climbs the ladder: ×1.44, ×2.16, ×3.24 … up to ×24.60 after 8 goals.\n3. Cash out between shots whenever you want. If the keeper saves, the stake is lost.',
    fr: '1. Touche « Miser », puis une des 9 cibles du but (3 à gauche, 3 au centre, 3 à droite — en haut, au milieu ou en bas), ou glisse le ballon vers elle.\n2. Le gardien couvre un côté (gauche, centre ou droite) : 2 tirs sur 3 rentrent. Chaque but fait monter l’échelle : ×1,44, ×2,16, ×3,24 … jusqu’à ×24,60 après 8 buts.\n3. Encaisse entre deux tirs quand tu veux. Si le gardien arrête, la mise est perdue.',
    es: '1. Toca «Apostar» y luego uno de los 9 objetivos de la portería (3 a la izquierda, 3 al centro, 3 a la derecha — arriba, medio o abajo), o desliza el balón hacia él.\n2. El portero cubre un lado (izquierda, centro o derecha): entran 2 tiros de 3. Cada gol sube la escalera: ×1,44, ×2,16, ×3,24 … hasta ×24,60 tras 8 goles.\n3. Retira entre tiros cuando quieras. Si el portero para, pierdes la apuesta.',
    pt: '1. Toque em «Apostar» e depois num dos 9 alvos do gol (3 à esquerda, 3 no centro, 3 à direita — alto, meio ou baixo), ou deslize a bola até ele.\n2. O goleiro cobre um lado (esquerda, centro ou direita): 2 chutes em 3 entram. Cada gol sobe a escada: ×1,44, ×2,16, ×3,24 … até ×24,60 após 8 gols.\n3. Saque entre os chutes quando quiser. Se o goleiro defender, a aposta é perdida.',
    ar: '1. اضغط «راهن» ثم أحد الأهداف التسعة في المرمى (3 يسارًا و3 في الوسط و3 يمينًا — أعلى أو وسط أو أسفل)، أو اسحب الكرة نحوه.\n2. يغطي الحارس جهة واحدة (يسار أو وسط أو يمين): تدخل تسديدتان من كل 3. كل هدف يرفعك في السلّم: ×1.44، ×2.16، ×3.24 … حتى ×24.60 بعد 8 أهداف.\n3. اسحب بين التسديدات متى شئت. إذا صدّ الحارس تخسر الرهان.',
    tr: '1. «Bahis»e dokun, sonra kaledeki 9 hedeften birine dokun (3 sol, 3 orta, 3 sağ — üst, orta ya da alt) ya da topu ona doğru kaydır.\n2. Kaleci bir tarafı korur (sol, orta ya da sağ): 3 şuttan 2’si gol olur. Her gol seni merdivende yükseltir: ×1,44, ×2,16, ×3,24 … 8 golde ×24,60’a kadar.\n3. Şutlar arasında istediğin an bozdur. Kaleci kurtarırsa bahis kaybedilir.',
    vi: '1. Chạm «Cược», rồi chạm một trong 9 mục tiêu trong khung thành (3 trái, 3 giữa, 3 phải — cao, giữa hoặc thấp), hoặc vuốt quả bóng về phía đó.\n2. Thủ môn chắn một phía (trái, giữa hoặc phải): cứ 3 cú sút thì 2 cú vào. Mỗi bàn thắng leo thang: ×1,44, ×2,16, ×3,24 … đến ×24,60 sau 8 bàn.\n3. Rút tiền giữa các cú sút bất cứ lúc nào. Thủ môn cản được thì mất tiền cược.',
    id: '1. Ketuk «Pasang», lalu ketuk salah satu dari 9 sasaran di gawang (3 kiri, 3 tengah, 3 kanan — atas, tengah atau bawah), atau usap bola ke arahnya.\n2. Kiper menjaga satu sisi (kiri, tengah, atau kanan): 2 dari 3 tendangan masuk. Tiap gol menaikkan tangga: ×1,44, ×2,16, ×3,24 … sampai ×24,60 setelah 8 gol.\n3. Tarik di antara tendangan kapan saja. Jika kiper menahan, taruhan hilang.',
    ru: '1. Нажмите «Ставка», затем одну из 9 целей в воротах (3 слева, 3 в центре, 3 справа — вверху, посередине или внизу) или смахните мяч к ней.\n2. Вратарь закрывает одну сторону (лево, центр или право): 2 удара из 3 залетают. Каждый гол поднимает по лестнице: ×1,44, ×2,16, ×3,24 … до ×24,60 после 8 голов.\n3. Забирайте выигрыш между ударами когда хотите. Если вратарь отбил — ставка проиграна.',
    de: '1. Tippe auf „Setzen“, dann auf eines der 9 Ziele im Tor (3 links, 3 Mitte, 3 rechts — oben, mittig oder unten) oder wische den Ball dorthin.\n2. Der Torwart deckt eine Seite (links, Mitte oder rechts): 2 von 3 Schüssen gehen rein. Jedes Tor bringt dich die Leiter hoch: ×1,44, ×2,16, ×3,24 … bis ×24,60 nach 8 Toren.\n3. Zahl dir zwischen den Schüssen jederzeit aus. Hält der Torwart, ist der Einsatz verloren.',
    hi: '1. «दांव» दबाएँ, फिर गोल के 9 निशानों में से एक दबाएँ (3 बाएँ, 3 बीच, 3 दाएँ — ऊपर, बीच या नीचे), या गेंद को उसकी ओर स्वाइप करें।\n2. गोलकीपर एक तरफ़ बचाता है (बाएँ, बीच या दाएँ): 3 में से 2 शॉट गोल होते हैं। हर गोल सीढ़ी चढ़ाता है: ×1.44, ×2.16, ×3.24 … 8 गोल के बाद ×24.60 तक।\n3. शॉट्स के बीच जब चाहें कैश आउट करें। गोलकीपर रोक ले तो दांव हारते हैं।',
    zh: '1. 点「下注」，然后点球门里 9 个目标之一（左 3、中 3、右 3 — 高、中、低），或把足球滑向目标。\n2. 守门员只守一侧（左、中或右）：每 3 脚射门进 2 球。每进一球倍数上升：×1.44、×2.16、×3.24 … 进 8 球最高 ×24.60。\n3. 两次射门之间随时可以兑现。被守门员扑出则输掉下注。'
  } });
})(window.D6 = window.D6 || {});
