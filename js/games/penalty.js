/* v2807 — Penalty rebuilt again (owner request: "like the big providers' Penalty Shoot-Out"): night stadium in perspective
   (floodlights, stands, LED boards, striped pitch, goal with 3-D net), a real goalkeeper drawn in SVG who dives to the
   side the server drew (high / low, then falls on the grass), curved ball flight with spin + shadow, net shake on goals,
   6 clean aim zones, a series of up to 8 shots on the multiplier ladder, cash out between shots.
   Server unchanged: K.multi('penalty', 'start' | 'shoot' {aim: 0..2, h: 0|2} | 'cash' | 'state') — same payouts. */
(function (D6) {
  'use strict';
  var K = D6.CasinoKit, $ = K.$;
  var T = {
    en: { bet: 'Bet', cash: 'Cash out', pick: 'Choose where to shoot', goal: 'Goal!', save: 'Saved!' },
    fr: { bet: 'Miser', cash: 'Encaisser', pick: 'Choisis où tirer', goal: 'But !', save: 'Arrêté !' },
    es: { bet: 'Apostar', cash: 'Retirar', pick: 'Elige dónde chutar', goal: '¡Gol!', save: '¡Parada!' },
    pt: { bet: 'Apostar', cash: 'Sacar', pick: 'Escolha onde chutar', goal: 'Gol!', save: 'Defesa!' },
    ar: { bet: 'راهن', cash: 'اسحب', pick: 'اختر مكان التسديد', goal: 'هدف!', save: 'تصدّى!' },
    tr: { bet: 'Bahis', cash: 'Bozdur', pick: 'Şut yerini seç', goal: 'Gol!', save: 'Kurtardı!' },
    vi: { bet: 'Cược', cash: 'Rút tiền', pick: 'Chọn hướng sút', goal: 'Vào!', save: 'Cản phá!' },
    id: { bet: 'Pasang', cash: 'Tarik', pick: 'Pilih arah tendangan', goal: 'Gol!', save: 'Ditepis!' },
    ru: { bet: 'Ставка', cash: 'Забрать', pick: 'Выберите, куда бить', goal: 'Гол!', save: 'Отбил!' },
    de: { bet: 'Setzen', cash: 'Auszahlen', pick: 'Wähle dein Ziel', goal: 'Tor!', save: 'Gehalten!' },
    hi: { bet: 'दांव', cash: 'कैश आउट', pick: 'शॉट की जगह चुनें', goal: 'गोल!', save: 'बचाव!' },
    zh: { bet: '下注', cash: '兑现', pick: '选择射门方向', goal: '进球！', save: '扑救！' }
  };
  function L() { return Object.assign({}, T.en, T[K.lang()] || {}); }
  var ROWS = 8;
  // même échelle que le serveur : floor(0,96 × 1,5^k × 100) / 100
  var LADDER = []; for (var i = 1; i <= ROWS; i++) LADDER.push(Math.floor(0.96 * Math.pow(1.5, i) * 100 + 1e-6) / 100);
  /* scène 360 × 300 : but (cadre avant) x 72→288, y 72→168 ; point de penalty (180, 262) */
  var GX0 = 72, GX1 = 288, GY0 = 72, GY1 = 168, SPOT = [180, 262], BR = 12;
  // 6 cibles : [colonne serveur 0..2, hauteur serveur 0 (haut) | 2 (bas), x, y]
  var ZONES = [[0, 0, 108, 95], [1, 0, 180, 95], [2, 0, 252, 95], [0, 2, 108, 145], [1, 2, 180, 145], [2, 2, 252, 145]];
  var HIP = [180, 132]; // hanche du gardien debout
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
  function keeperReady() {
    return '<g class="pk-pose">' +
      '<path d="M-8-33L-15-19L-17-6M8-33L15-19L17-6" fill="none" stroke="url(#pkSkin)" stroke-width="6.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M-15-17L-17-6M15-17L17-6" stroke="#FBBF24" stroke-width="6.6" stroke-linecap="round"/><path d="M-15.6-14h1.6M14-14h1.6" stroke="#6D28D9" stroke-width="3"/>' +
      '<path d="M-23-2c0-4 3-6 7-5l4 1c1 3 0 5-2 5h-8c-1 0-1 0-1-1zM23-2c0-4-3-6-7-5l-4 1c-1 3 0 5 2 5h8c1 0 1 0 1-1z" fill="#111827"/>' +
      '<path d="M-12-44H12L14-30H3L0-35L-3-30H-14z" fill="#1E1B4B"/><path d="M-13-37H-2M2-37H13" stroke="#FBBF24" stroke-width="1" opacity=".7"/>' +
      '<path d="M-13-63L-25-55L-33-49M13-63L25-55L33-49" fill="none" stroke="url(#pkShirt)" stroke-width="6.2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M-15-66Q0-70 15-66L12-42Q0-40-12-42z" fill="url(#pkShirt)"/><path d="M-4-67.5L0-62L4-67.5" fill="none" stroke="#6D28D9" stroke-width="2"/>' +
      '<path d="M-14-58L-12-43M14-58L12-43" stroke="#6D28D9" stroke-width="1.6" opacity=".8"/><circle cx="6" cy="-58" r="2.2" fill="#6D28D9"/>' +
      '<g class="pk-glove"><circle cx="-36" cy="-47" r="5.6" fill="#F8FAFC"/><path d="M-39.5-50.5a5 5 0 0 1 5-1" stroke="#22C55E" stroke-width="1.8" fill="none"/><circle cx="36" cy="-47" r="5.6" fill="#F8FAFC"/><path d="M39.5-50.5a5 5 0 0 0-5-1" stroke="#22C55E" stroke-width="1.8" fill="none"/></g>' +
      '<rect x="-3" y="-72" width="6" height="7" rx="2" fill="#A0652F"/>' +
      '<ellipse cx="0" cy="-78" rx="6.8" ry="8" fill="url(#pkSkin)"/><ellipse cx="-6.8" cy="-77" rx="1.4" ry="2.2" fill="#A0652F"/><ellipse cx="6.8" cy="-77" rx="1.4" ry="2.2" fill="#A0652F"/>' +
      '<path d="M-7-79Q-7-88 0-88Q7-88 7-79Q5-84 0-84Q-5-84-7-79z" fill="#1F130A"/><path d="M-3.2-78.5h1.6M1.6-78.5h1.6" stroke="#1F130A" stroke-width="1.3" stroke-linecap="round"/>' +
      '</g>';
  }
  // pose « plongeon » (bras tendus), origine = la hanche
  function keeperDive() {
    return '<g class="pk-pose">' +
      '<path d="M-4 4L-6 20L-5 33M4 4L10 18L7 29" fill="none" stroke="url(#pkSkin)" stroke-width="6.2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M-6 21L-5 33M10 19L7 29" stroke="#FBBF24" stroke-width="6.4" stroke-linecap="round"/>' +
      '<path d="M-9 33c-1 3 0 5 3 5h6c1-2 0-4-3-5zM5 29c-2 3-1 5 2 5h6c1-2 0-4-3-5z" fill="#111827"/>' +
      '<path d="M-10-7H10L11 7H2L0 3L-2 7H-11z" fill="#1E1B4B"/>' +
      '<path d="M-10-27L-13-44L-9-58M10-27L13-44L9-58" fill="none" stroke="url(#pkShirt)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M-12-29Q0-32 12-29L10-5Q0-3-10-5z" fill="url(#pkShirt)"/><path d="M-11-21L-10-6M11-21L10-6" stroke="#6D28D9" stroke-width="1.6" opacity=".8"/>' +
      '<g class="pk-glove"><circle cx="-9" cy="-62" r="5.6" fill="#F8FAFC"/><circle cx="9" cy="-62" r="5.6" fill="#F8FAFC"/><path d="M-12-58h6M6-58h6" stroke="#22C55E" stroke-width="1.8"/></g>' +
      '<ellipse cx="0" cy="-38" rx="6.6" ry="7.8" fill="url(#pkSkin)"/><path d="M-6.8-39Q-7-47.5 0-47.5Q7-47.5 6.8-39Q5-44 0-44Q-5-44-6.8-39z" fill="#1F130A"/>' +
      '</g>';
  }
  function scene() {
    var stars = '';
    for (var s = 0; s < 34; s++) stars += '<circle cx="' + (-180 + K.seeded(s, 1) * 720).toFixed(0) + '" cy="' + (-260 + K.seeded(s, 2) * 290).toFixed(0) + '" r="' + (0.4 + K.seeded(s, 3) * 0.9).toFixed(1) + '"/>';
    var ads = '';
    [-420, -230, -40, 400, 590, 780].forEach(function (ax) { ads += '<text x="' + ax + '" y="160.2" text-anchor="middle">OROLADO</text>'; }); // jamais derrière le but
    var zones = ZONES.map(function (z, j) {
      return '<g class="pk-z" data-z="' + j + '"><rect x="' + (z[2] - 31) + '" y="' + (z[3] - 21) + '" width="62" height="42" rx="9"/>' +
        '<g class="pk-ret" transform="translate(' + z[2] + ' ' + z[3] + ')"><circle r="9"/><circle r="2.2" class="pk-dot"/><path d="M0-14v5M0 9v5M-14 0h5M9 0h5"/></g></g>';
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
        '<radialGradient id="pkGBall" cx="36%" cy="30%" r="72%"><stop offset="0" stop-color="#fff"/><stop offset=".7" stop-color="#E5E7EB"/><stop offset="1" stop-color="#8B95A5"/></radialGradient>' +
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
      '<g id="pkShadow" transform="translate(180 168)"><ellipse rx="22" ry="3.6" fill="#000" opacity=".35"/></g>' +
      '<g id="pkKp" transform="translate(180 168)">' + keeperReady() + '</g>' +
      '<g id="pkDv" transform="translate(180 132)" style="display:none">' + keeperDive() + '</g>' +
      // poteaux et barre (devant le filet et le gardien)
      '<rect x="67.5" y="69" width="5" height="100" rx="2" fill="url(#pkPost)"/><rect x="287.5" y="69" width="5" height="100" rx="2" fill="url(#pkPost)"/><rect x="67.5" y="67.5" width="225" height="5" rx="2.5" fill="url(#pkBar)"/>' +
      // zones de tir
      '<g class="pk-zones">' + zones + '</g>' +
      // ballon + ombre + traînée
      '<g id="pkBShadow" transform="translate(' + SPOT[0] + ' ' + (SPOT[1] + 10) + ')"><ellipse rx="11" ry="3" fill="#000" opacity=".4"/></g>' +
      '<g id="pkTrail" opacity="0"><circle r="' + BR + '" fill="#fff" opacity=".18"/><circle r="' + BR + '" fill="#fff" opacity=".1"/><circle r="' + BR + '" fill="#fff" opacity=".05"/></g>' +
      '<g id="pkBall" transform="translate(' + SPOT[0] + ' ' + SPOT[1] + ')"><circle r="' + BR + '" fill="url(#pkGBall)"/><g id="pkSpin">' +
        '<path d="M0-4.6l4.4 3.2-1.7 5.2h-5.4l-1.7-5.2z" fill="#1F2937"/><path d="M0-4.6V-11.4M4.4-1.4l6.4-2.2M2.7 3.8l3.9 5.8M-2.7 3.8l-3.9 5.8M-4.4-1.4l-6.4-2.2" stroke="#1F2937" stroke-width="1.3"/>' +
        '<path d="M-7.5-9.5l3-2.4M7.5-9.5l-3-2.4M11.6 2l-.6 3.8M-11.6 2l.6 3.8M-3 11.6h6" stroke="#1F2937" stroke-width="2.6" stroke-linecap="round"/></g>' +
        '<circle r="' + BR + '" fill="none" stroke="#000" stroke-opacity=".25"/><ellipse cx="-4" cy="-5" rx="4" ry="2.6" fill="#fff" opacity=".55"/></g>' +
      '</svg>';
  }

  /* ------------------------------------------------------------------ petites aides d'animation */
  function ease(k) { return 1 - Math.pow(1 - k, 3); }
  function easeIn(k) { return k * k; }
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
  // où va le gardien : [hanche x, hanche y, angle] (pose plongeon) — ou null = pose debout
  function divePose(col, h) {
    if (col === 1) return h === 0 ? [180, 138, 0, 0.92] : null;
    var sg = col === 0 ? -1 : 1, hx = col === 0 ? 108 : 252, hy = h === 0 ? 95 : 145, a = h === 0 ? 68 : 95;
    var r = a * D2R, L = 62;
    return [hx - sg * L * Math.sin(r), hy + L * Math.cos(r), sg * a, 1];
  }

  K.register('penalty', function (box, x) {
    var l = L(), g = null, busy = false, nShot = 0;
    box.classList.add('cg-game', 'cg-penalty');
    box.innerHTML = '<div class="cg-stage pn-stage">' +
        '<div class="pn-lad" id="pnLad">' + LADDER.map(function (m, k) { return '<span data-k="' + k + '"><i>' + (k + 1) + '</i><b class="fit">×' + nf(m, 2) + '</b></span>'; }).join('') + '</div>' +
        '<div class="pn-field">' + scene() + '<div class="pn-flash" id="pnFlash"><b class="fit"></b></div><div class="pn-tip"><b class="fit" id="pnTip"></b></div></div>' +
      '</div>' + K.stakePanel(l.bet);
    K.bindStake(box);
    var go = $('csGo'), kp = $('pkKp'), dv = $('pkDv'), kShadow = $('pkShadow'), ball = $('pkBall'), spin = $('pkSpin'), bSh = $('pkBShadow'), trail = $('pkTrail'), net = $('pkNet');
    var lite = function () { return document.documentElement.classList.contains('oro-lite'); };
    function live() { return g && !g.done; }
    // la scène remplit toute la place : la zone utile (but, gardien, point de penalty) reste visible, le décor s'étend autour
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
    function standing(dy, sy) {
      dv.style.display = 'none'; kp.style.display = '';
      kp.setAttribute('transform', 'translate(180 ' + (168 + (dy || 0)).toFixed(1) + ') scale(' + (sy ? (2 - sy).toFixed(3) + ' ' + sy.toFixed(3) : '1') + ')');
      kShadow.setAttribute('transform', 'translate(180 168)');
    }
    function diving(x, y, a, s) {
      kp.style.display = 'none'; dv.style.display = '';
      dv.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + a.toFixed(1) + ') scale(' + (s || 1).toFixed(3) + ')');
      kShadow.setAttribute('transform', 'translate(' + x.toFixed(1) + ' 168) scale(' + (1 + Math.abs(a) / 120).toFixed(2) + ' 1)');
    }
    function reset() {
      standing(0); setBall(SPOT[0], SPOT[1], 1, 0); setBShadow(SPOT[0], SPOT[1] + 10, 1, 1);
      trail.setAttribute('opacity', '0'); net.removeAttribute('transform'); ball.style.opacity = '';
    }
    function flash(txt, cls) {
      var f = $('pnFlash'), b = f.firstChild;
      f.className = 'pn-flash'; K.setText(b, txt); void f.offsetWidth; f.className = 'pn-flash on ' + cls;
    }
    // idle : le gardien se balance d'un pied sur l'autre (comme les vrais) — très léger
    var idleT = 0;
    function idle(now) {
      if (!box.isConnected) return;
      if (!busy && !lite()) { var t = (now || 0) / 1000; standing(Math.sin(t * 3.2) * 1.2, 1 - Math.abs(Math.sin(t * 1.6)) * 0.025); kp.setAttribute('transform', kp.getAttribute('transform') + ' translate(' + (Math.sin(t * 1.6) * 3).toFixed(2) + ' 0)'); }
      idleT = requestAnimationFrame(idle); K.S.raf = idleT;
    }

    async function shoot(zi) {
      if (!live() || busy) return;
      busy = true; paint(); cancelAnimationFrame(idleT);
      var z = ZONES[zi];
      box.querySelectorAll('.pk-z').forEach(function (t) { t.classList.toggle('sel', +t.getAttribute('data-z') === zi); });
      var r = await K.multi('penalty', 'shoot', { aim: z[0], h: z[1] });
      if (!box.isConnected) return;
      if (!r) { busy = false; paint(); K.S.raf = idleT = requestAnimationFrame(idle); return; }
      nShot++;
      var shot = (r.shots || [])[(r.shots || []).length - 1] || [z[0], z[1], 1, 1];
      var kcol = +shot[2], goal = !!+shot[3];
      // hauteur du plongeon : sur le ballon s'il a deviné la bonne colonne, sinon au hasard (dessin)
      var kh = kcol === z[0] ? z[1] : (K.seeded(nShot, zi + 3) < 0.5 ? 0 : 2);
      var pose = divePose(kcol, kh);
      var fast = lite(), TB = fast ? 300 : 560, TK = fast ? 260 : 430, delay = fast ? 0 : 70;
      var tx = z[2], ty = z[3], cxp = (SPOT[0] + tx) / 2 + (tx - 180) * 0.35 + (tx === 180 ? 18 : 0), cyp = Math.min(SPOT[1], ty) - 40 - (z[1] === 0 ? 22 : 0);
      var endS = 0.42, trailOn = !fast;
      // 1) tir + plongeon en même temps
      var hist = [];
      await anim(box, TB, function (k) {
        var t = ease(k), bx = bez(SPOT[0], cxp, tx, t), by = bez(SPOT[1], cyp, ty, t), s = 1 - (1 - endS) * t;
        setBall(bx, by, s, k * 900);
        var gy = SPOT[1] + 10 + (168 - SPOT[1] - 10) * t;
        setBShadow(bx, gy, s, Math.max(0.15, 1 - (gy - by) / 120));
        if (trailOn) {
          hist.unshift([bx, by, s]); if (hist.length > 9) hist.pop();
          trail.setAttribute('opacity', '1');
          [2, 5, 8].forEach(function (h, j) { var p = hist[Math.min(h, hist.length - 1)]; trail.children[j].setAttribute('transform', 'translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ') scale(' + p[2].toFixed(3) + ')'); });
        }
        var kk = Math.max(0, Math.min(1, (k * TB - delay) / TK)), e = ease(kk);
        if (!pose) standing(-6 * Math.sin(Math.PI * e), 1 - 0.1 * e); // ballon au centre bas : il se baisse
        else if (pose[2] === 0) { if (kk > 0) diving(180, HIP[1] + (pose[1] - HIP[1]) * e - 10 * Math.sin(Math.PI * e), 0, 1 - (1 - pose[3]) * e); } // saut sur place, bras en l'air
        else if (kk > 0) diving(180 + (pose[0] - 180) * e, HIP[1] + (pose[1] - HIP[1]) * e - 14 * Math.sin(Math.PI * e), pose[2] * e, 1);
      });
      trail.setAttribute('opacity', '0');
      if (!box.isConnected) return;
      g = r;
      // 2) suite : filet qui tremble ou ballon repoussé ; le gardien retombe sur la pelouse
      var fall = pose && pose[2] !== 0 ? anim(box, fast ? 200 : 420, function (k) {
        var e = easeIn(k), a = pose[2] + (pose[2] > 0 ? 1 : -1) * (100 - Math.abs(pose[2])) * e;
        diving(pose[0] + (pose[0] - 180) * 0.08 * e, pose[1] + (158 - pose[1]) * e, a, 1);
      }) : Promise.resolve();
      if (goal) {
        flash(l.goal, 'goal');
        var ix = tx, iy = ty;
        await anim(box, fast ? 260 : 700, function (k) {
          var s1 = Math.min(1, k * 4), bx = tx + (tx - 180) * 0.07 * s1, by = ty + 5 * s1 + (k > 0.25 ? (150 - ty) * easeIn((k - 0.25) / 0.75) : 0);
          setBall(bx, Math.min(by, 150), endS - 0.05 * s1, 900 + k * 200);
          setBShadow(bx, 154, endS, 0.5);
          if (!fast) { var d = Math.exp(-k * 4.2) * Math.cos(k * 26); net.setAttribute('transform', 'translate(' + ((ix - 180) * 0.02 * d).toFixed(2) + ' ' + (2.6 * d).toFixed(2) + ')'); }
        });
        net.removeAttribute('transform');
      } else {
        flash(l.save, 'save');
        var side = z[0] === 0 ? -1 : z[0] === 2 ? 1 : (K.seeded(nShot, 9) < 0.5 ? -1 : 1), central = z[0] === 1;
        var ex = central ? 180 + side * 50 : tx + side * 80, ey = central ? 226 : 176, ec = central ? 0.9 : 0.5, pk = central ? ty - 30 : ty - 24;
        await anim(box, fast ? 260 : 640, function (k) {
          var bx = tx + (ex - tx) * k, by = bez(ty, pk, ey, k), s = endS + (ec - endS) * k;
          setBall(bx, by, s, 900 - k * 500); setBShadow(bx, central ? 168 + (ey + 10 - 168) * k : 168 + 8 * k, s, 0.5);
          ball.style.opacity = String(1 - Math.max(0, k - 0.7) / 0.3);
        });
      }
      await fall;
      if (!box.isConnected) return;
      paintLadder();
      if (r.done) K.resultLine(box, r);
      await K.sleep(fast ? 200 : 650);
      if (!box.isConnected) return;
      reset();
      if (ball.animate) ball.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220 });
      box.querySelectorAll('.pk-z.sel').forEach(function (t) { t.classList.remove('sel'); });
      busy = false; paint();
      K.S.raf = idleT = requestAnimationFrame(idle);
    }
    box.querySelectorAll('.pk-z').forEach(function (t) { t.addEventListener('click', function () { shoot(+t.getAttribute('data-z')); }); });
    go.addEventListener('click', async function () {
      if (busy) return;
      busy = true; paint();
      var r = await K.multi('penalty', live() ? 'cash' : 'start');
      if (!box.isConnected) return;
      busy = false;
      if (r) { g = r; if (r.done) K.resultLine(box, r); else $('pnFlash').className = 'pn-flash'; }
      paint();
    });
    reset(); paint();
    K.S.raf = idleT = requestAnimationFrame(idle);
    K.multi('penalty', 'state', null, true).then(function (r) { if (r && !r.done && box.isConnected && !g) { g = r; paint(); } });
  }, { rules: {
    en: '1. Tap “Bet”, then tap one of the 6 targets in the goal to shoot.\n2. The keeper dives to one side (left, centre or right). Each goal climbs the ladder: ×1.44, ×2.16, ×3.24 … up to ×24.60 after 8 goals.\n3. Cash out between shots whenever you want. If the keeper saves, the stake is lost.',
    fr: '1. Touche « Miser », puis touche une des 6 cibles dans le but pour tirer.\n2. Le gardien plonge d’un côté (gauche, centre ou droite). Chaque but fait monter l’échelle : ×1,44, ×2,16, ×3,24 … jusqu’à ×24,60 après 8 buts.\n3. Encaisse entre deux tirs quand tu veux. Si le gardien arrête, la mise est perdue.',
    es: '1. Toca «Apostar» y luego uno de los 6 objetivos de la portería para chutar.\n2. El portero se lanza a un lado (izquierda, centro o derecha). Cada gol sube la escalera: ×1,44, ×2,16, ×3,24 … hasta ×24,60 tras 8 goles.\n3. Retira entre tiros cuando quieras. Si el portero para, pierdes la apuesta.',
    pt: '1. Toque em «Apostar» e depois num dos 6 alvos do gol para chutar.\n2. O goleiro pula para um lado (esquerda, centro ou direita). Cada gol sobe a escada: ×1,44, ×2,16, ×3,24 … até ×24,60 após 8 gols.\n3. Saque entre os chutes quando quiser. Se o goleiro defender, a aposta é perdida.',
    ar: '1. اضغط «راهن» ثم اضغط أحد الأهداف الخمسة في المرمى للتسديد.\n2. يقفز الحارس إلى جهة (يسار أو وسط أو يمين). كل هدف يرفعك في السلّم: ×1.44، ×2.16، ×3.24 … حتى ×24.60 بعد 8 أهداف.\n3. اسحب بين التسديدات متى شئت. إذا صدّ الحارس تخسر الرهان.',
    tr: '1. «Bahis»e dokun, sonra şut için kaledeki 6 hedeften birine dokun.\n2. Kaleci bir tarafa atlar (sol, orta ya da sağ). Her gol seni merdivende yükseltir: ×1,44, ×2,16, ×3,24 … 8 golde ×24,60’a kadar.\n3. Şutlar arasında istediğin an bozdur. Kaleci kurtarırsa bahis kaybedilir.',
    vi: '1. Chạm «Cược», rồi chạm một trong 6 mục tiêu trong khung thành để sút.\n2. Thủ môn đổ người về một phía (trái, giữa hoặc phải). Mỗi bàn thắng leo thang: ×1,44, ×2,16, ×3,24 … đến ×24,60 sau 8 bàn.\n3. Rút tiền giữa các cú sút bất cứ lúc nào. Thủ môn cản được thì mất tiền cược.',
    id: '1. Ketuk «Pasang», lalu ketuk salah satu dari 6 sasaran di gawang untuk menendang.\n2. Kiper melompat ke satu sisi (kiri, tengah, atau kanan). Tiap gol menaikkan tangga: ×1,44, ×2,16, ×3,24 … sampai ×24,60 setelah 8 gol.\n3. Tarik di antara tendangan kapan saja. Jika kiper menahan, taruhan hilang.',
    ru: '1. Нажмите «Ставка», затем одну из 6 целей в воротах, чтобы ударить.\n2. Вратарь прыгает в сторону (влево, в центр или вправо). Каждый гол поднимает по лестнице: ×1,44, ×2,16, ×3,24 … до ×24,60 после 8 голов.\n3. Забирайте выигрыш между ударами когда хотите. Если вратарь отбил — ставка проиграна.',
    de: '1. Tippe auf „Setzen“, dann auf eines der 6 Ziele im Tor, um zu schießen.\n2. Der Torwart springt in eine Ecke (links, Mitte oder rechts). Jedes Tor bringt dich die Leiter hoch: ×1,44, ×2,16, ×3,24 … bis ×24,60 nach 8 Toren.\n3. Zahl dir zwischen den Schüssen jederzeit aus. Hält der Torwart, ist der Einsatz verloren.',
    hi: '1. «दांव» दबाएँ, फिर शॉट के लिए गोल के 6 निशानों में से एक दबाएँ।\n2. गोलकीपर एक तरफ़ कूदता है (बाएँ, बीच या दाएँ)। हर गोल सीढ़ी चढ़ाता है: ×1.44, ×2.16, ×3.24 … 8 गोल के बाद ×24.60 तक।\n3. शॉट्स के बीच जब चाहें कैश आउट करें। गोलकीपर रोक ले तो दांव हारते हैं।',
    zh: '1. 点「下注」，然后点球门里 6 个目标之一射门。\n2. 守门员扑向一侧（左、中或右）。每进一球倍数上升：×1.44、×2.16、×3.24 … 进 8 球最高 ×24.60。\n3. 两次射门之间随时可以兑现。被守门员扑出则输掉下注。'
  } });
})(window.D6 = window.D6 || {});
