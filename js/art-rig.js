/* OROLADO — D6.Rig : people with real proportions for the canvas games (v2860, owner: "pas sérieux, amateur").
   A 3D skeleton (hips, knees, ankles, toes, shoulders, elbows, wrists, head) posed by a cycle phase, projected for a view
   from behind (runners), from the front (catwalk, keeper) or from the side (space runner). Every body part is a smooth,
   tapered, shaded shape (light from the upper left, darker far side) — muscles, clothes, hair, shoes.
   ONLY used to PRE-DRAW sprite frames once per size (never per frame): light on old Android.
   API: Rig.sheet(w, h, dpr, opts, n) → n frames of a cycle; Rig.one(w, h, dpr, opts) → one frame;
        opts = { view: 'back'|'front'|'side', pose: 'run'|'walk'|'catwalk'|'stand'|'jump'|'slide'|'kick'|'dive', ph: 0..1, pal }
        Rig.draw(ctx, h, opts) draws a person h px tall, feet at (0, 0). Rig.shade(hex, k), Rig.SKINS, Rig.HAIRS. */
(function () {
  'use strict';
  var D6 = window.D6 = window.D6 || {};
  var T2 = Math.PI * 2, PI = Math.PI;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function shade(hex, k) { // k < 0 darker, k > 0 lighter
    if (!hex || hex.charAt(0) !== '#') return hex;
    if (hex.length === 4) hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    var n = parseInt(hex.slice(1, 7), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255, t = k < 0 ? 0 : 255, a = Math.abs(k);
    r = Math.round(r + (t - r) * a); g = Math.round(g + (t - g) * a); b = Math.round(b + (t - b) * a);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }
  function warm(hex, k) { // shadows of skin are warmer (a little red), not grey
    var d = shade(hex, -k), n = parseInt(d.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    r = Math.min(255, Math.round(r * 1.06)); b = Math.round(b * 0.9);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  /* ------------------------------------------------------------------ POSE — 3D joints (y down from the top of the head, unit = height) */
  function pose(o) {
    var p = o.pal || {}, fem = p.build === 'f', k = o.pose || 'stand', ph = (o.ph || 0) * T2;
    var J = { legs: [], arms: [], lean: 0, rot: 0, hipX: 0, tilt: 0, hipY: 0.5, shTilt: 0, headTurn: 0, flight: 0, fem: fem };
    var Lt = 0.245, Ls = 0.243, La = 0.168, Lf = 0.148;
    for (var s = -1; s <= 1; s += 2) {
      var f = ph + (s > 0 ? PI : 0), sf = Math.sin(f), cf = Math.cos(f);
      var th = 0, kn = 0.05, ar = 0.06, el = 0.2, ab = 0.08, cross = 0, fo = 0;
      if (k === 'run') {
        th = 0.2 + 0.64 * sf;
        kn = 0.28 + 1.65 * Math.pow(Math.max(0, Math.cos(f + 0.45)), 1.25);
        ar = -0.78 * sf - 0.05; el = 1.25 + 0.45 * (0.5 - 0.5 * sf); ab = 0.1;
      } else if (k === 'walk') {
        th = 0.04 + 0.36 * sf; kn = 0.06 + 0.62 * Math.pow(Math.max(0, Math.cos(f + 0.7)), 2);
        ar = -0.32 * sf; el = 0.22 + 0.18 * (0.5 - 0.5 * sf); ab = 0.08;
      } else if (k === 'catwalk') {
        th = 0.05 + 0.34 * sf; kn = 0.05 + 0.55 * Math.pow(Math.max(0, Math.cos(f + 0.75)), 2);
        ar = -0.24 * sf; el = 0.18 + 0.12 * (0.5 - 0.5 * sf); ab = 0.1; cross = 0.85;
      } else if (k === 'stand') {
        th = 0.02; kn = 0.05; ar = 0.04 + 0.02 * Math.sin(ph); el = 0.16; ab = 0.1;
      } else if (k === 'jump') {
        th = s < 0 ? 1.05 : 0.45; kn = s < 0 ? 1.85 : 1.25; ar = s < 0 ? 2.55 : 2.35; el = 0.35; ab = 0.32;
      } else if (k === 'slide') {
        th = s < 0 ? 1.42 : 1.0; kn = s < 0 ? 0.08 : 2.35; ar = s < 0 ? 0.55 : 0.2; el = 0.5; ab = 1.05;
      } else if (k === 'kick') { // the kicking leg (s > 0) swung forward
        th = s > 0 ? 1.0 : -0.12; kn = s > 0 ? 0.35 : 0.22; ar = s > 0 ? -0.8 : 0.9; el = 0.45; ab = 0.5;
      } else if (k === 'dive') { // keeper diving: legs together, arms stretched above the head
        th = 0.15 + s * 0.05; kn = 0.3; ar = 2.95; el = 0.08; ab = 0.18;
      } else if (k === 'ready') { // keeper crouch: knees bent, arms open
        th = 0.55; kn = 1.0; ar = 0.55; el = 0.55; ab = 0.55; fo = 0.03;
      }
      J.legs.push({ s: s, th: th, kn: kn, cross: cross, f: f, fo: fo });
      J.arms.push({ s: s, ar: ar, el: el, ab: ab, f: f });
    }
    var sL = Math.sin(ph);
    if (k === 'run') { J.lean = 0.14; J.rot = 0.07 * -sL; J.tilt = 0.012 * sL; J.flight = 0.02 * Math.max(0, Math.sin(2 * ph - 0.9)); }
    if (k === 'walk') { J.rot = 0.04 * -sL; J.tilt = 0.008 * sL; J.lean = 0.03; }
    if (k === 'catwalk') { J.hipX = 0.022 * sL; J.tilt = 0.022 * sL; J.shTilt = -0.012 * sL; J.rot = 0.05 * -sL; J.lean = -0.04; }
    if (k === 'stand') { J.breath = 0.003 * Math.sin(ph); }
    if (k === 'jump') { J.lean = 0.05; }
    if (k === 'slide') { J.lean = -0.55; J.hipY = 0.83; }
    if (k === 'kick') { J.lean = -0.12; J.rot = 0.12; }
    if (k === 'ready') { J.lean = 0.3; }
    if (k === 'dive') { J.lean = 0; }
    J.Lt = Lt; J.Ls = Ls; J.La = La; J.Lf = Lf; J.k = k;
    return J;
  }
  // 3D skeleton from the pose
  function build(J) {
    var fem = J.fem, hipY = J.hipY, lean = J.lean, B = {};
    function up(hgt, x, dz) { return [x + J.hipX * (1 - hgt * 2.2), hipY - hgt * Math.cos(lean), hgt * Math.sin(lean) + (dz || 0)]; }
    var shW = fem ? 0.098 : 0.117, wW = fem ? 0.07 : 0.088, hW = fem ? 0.112 : 0.1;
    B.legs = J.legs.map(function (L) {
      var s = L.s, hip = [J.hipX + s * (fem ? 0.058 : 0.055), hipY + s * J.tilt, s * J.rot * 0.35];
      var kx = hip[0] + s * 0.008 - s * L.cross * 0.02 + s * L.fo;
      var knee = [kx, hip[1] + J.Lt * Math.cos(L.th), hip[2] + J.Lt * Math.sin(L.th)];
      var sa = L.th - L.kn, ax = J.hipX * 0.4 + s * (0.06 - L.cross * 0.075) + s * L.fo * 1.6;
      var ank = [ax, knee[1] + J.Ls * Math.cos(sa), knee[2] + J.Ls * Math.sin(sa)];
      var psi = clamp(sa + 1.4, -0.4, 1.5);
      if (J.k === 'catwalk' || J.k === 'walk') psi = clamp(sa + 1.45, 0.2, 1.5);
      var toe = [ank[0] + s * 0.004, ank[1] + 0.075 * Math.cos(psi), ank[2] + 0.075 * Math.sin(psi)];
      return { s: s, hip: hip, knee: knee, ank: ank, toe: toe, psi: psi, sa: sa };
    });
    var low = 0;
    B.legs.forEach(function (L) { low = Math.max(low, L.ank[1] + 0.024, L.toe[1] + 0.012); });
    var dy = 0.99 - low - (J.flight || 0);
    if (J.k === 'slide') dy = 0.99 - Math.max(low, hipY + 0.06);
    if (J.k === 'jump' || J.k === 'dive') dy = 0.99 - low;
    function mv(q) { q[1] += dy; return q; }
    B.legs.forEach(function (L) { mv(L.hip); mv(L.knee); mv(L.ank); mv(L.toe); });
    var br = J.breath || 0;
    B.sh = [-1, 1].map(function (s) { var q = mv(up(0.302 + br, s * shW, s * -J.rot * 0.6)); q[1] += s * J.shTilt; return q; });
    B.pit = [-1, 1].map(function (s) { var q = mv(up(0.235, s * (shW - 0.012), s * -J.rot * 0.45)); q[1] += s * J.shTilt * 0.7; return q; });
    B.waist = [-1, 1].map(function (s) { return mv(up(0.1, s * wW, s * -J.rot * 0.15)); });
    B.hipS = [-1, 1].map(function (s) { var q = mv(up(0.015, s * hW, s * J.rot * 0.3)); q[1] += s * J.tilt; return q; });
    B.crotch = mv(up(-0.04, 0, 0));
    B.neck = mv(up(0.335 + br, 0, 0));
    B.head = mv(up(0.425 + br, 0, 0.012));
    B.arms = J.arms.map(function (A, i) {
      var s = A.s, S0 = B.sh[i], sh = [S0[0] - s * 0.012, S0[1] + 0.014, S0[2]];
      var ca = Math.cos(A.ab), sb = Math.sin(A.ab);
      var arL = A.ar + (J.k === 'run' ? lean * 0.6 : 0);
      var el = [sh[0] + s * J.La * sb, sh[1] + J.La * Math.cos(arL) * ca, sh[2] + J.La * Math.sin(arL) * ca];
      var fa = arL + A.el, inw = J.k === 'run' ? -0.32 * Math.max(0, Math.sin(fa)) : 0;
      var ab2 = A.ab * 0.6 + inw;
      var wr = [el[0] + s * J.Lf * Math.sin(ab2), el[1] + J.Lf * Math.cos(fa) * Math.cos(ab2), el[2] + J.Lf * Math.sin(fa) * Math.cos(ab2)];
      var d = [wr[0] - el[0], wr[1] - el[1], wr[2] - el[2]], dl = Math.hypot(d[0], d[1], d[2]) || 1;
      var hd = [wr[0] + d[0] / dl * 0.055, wr[1] + d[1] / dl * 0.055, wr[2] + d[2] / dl * 0.055];
      return { s: s, sh: sh, el: el, wr: wr, hd: hd };
    });
    return B;
  }

  /* ------------------------------------------------------------------ DRAW */
  function draw(c, h, o) {
    var p = o.pal || {}, v = o.view || 'back', J = pose(o), B = build(J), fem = J.fem, k = J.k;
    var suit = !!p.suit, skin = p.skin || '#D9A066', top = p.top || ['#64748B', '#334155'], bot = p.bottom || ['#334155', '#1E293B'], legsOf = p.legs || 'pants';
    var LIGHT = v === 'front' ? 1 : -1; // light from the upper left of the screen
    // projection: y grows downwards, unit = h, origin at the top of the head; the canvas origin is at the feet
    function P(q) {
      if (v === 'side') return [q[2] * h, q[1] * h, 1 + q[0] * 0.25];
      if (v === 'front') return [-q[0] * (1 + q[2] * 0.15) * h, (q[1] + q[2] * 0.22) * h, 1 + q[2] * 0.15];
      return [q[0] * (1 - q[2] * 0.16) * h, (q[1] - q[2] * 0.3) * h, 1 - q[2] * 0.16];
    }
    function depth(q) { return v === 'side' ? -q[0] : v === 'front' ? q[2] : -q[2]; }
    c.save(); c.translate(0, -h); c.lineCap = 'round'; c.lineJoin = 'round';

    // a tapered capsule chain: nodes [[x, y, r], ...] in px, drawn as one union path
    function chain(nodes) {
      c.beginPath();
      for (var i = 0; i < nodes.length - 1; i++) {
        var A = nodes[i], Bn = nodes[i + 1], dx = Bn[0] - A[0], dy = Bn[1] - A[1], d = Math.hypot(dx, dy);
        if (d < Math.abs(A[2] - Bn[2]) + 0.01) { var bg = A[2] > Bn[2] ? A : Bn; c.moveTo(bg[0] + bg[2], bg[1]); c.arc(bg[0], bg[1], bg[2], 0, T2); continue; }
        var th = Math.atan2(dy, dx), al = Math.acos(clamp((A[2] - Bn[2]) / d, -1, 1));
        c.moveTo(A[0] + Math.cos(th + al) * A[2], A[1] + Math.sin(th + al) * A[2]);
        c.arc(A[0], A[1], A[2], th + al, th - al + T2);
        c.arc(Bn[0], Bn[1], Bn[2], th - al, th + al);
        c.closePath();
      }
    }
    // fill the current path with a cylinder shading across the axis a → b (light side, base, core shadow, reflected light)
    function cyl(a, b, r, col, dark, far) {
      var dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
      if (nx * LIGHT < 0 || (Math.abs(nx) < 0.05 && ny > 0)) { nx = -nx; ny = -ny; }
      var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, g = c.createLinearGradient(mx + nx * r, my + ny * r, mx - nx * r, my - ny * r);
      var base = far ? shade(col, -0.16) : col;
      g.addColorStop(0, shade(base, far ? 0.04 : 0.2)); g.addColorStop(0.3, base); g.addColorStop(0.72, dark ? dark(base, 0.26) : shade(base, -0.26)); g.addColorStop(1, dark ? dark(base, 0.16) : shade(base, -0.14));
      c.fillStyle = g; c.fill();
    }
    function pt(q) { return P(q); }
    function lerp3(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
    function circle(x, y, r, col) { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, T2); c.fill(); }

    /* ---------------- legs */
    var skinDark = function (b, kk) { return warm(b, kk); };
    function thigh(L, far) {
      var H0 = pt(L.hip), K0 = pt(L.knee), M = pt(lerp3(L.hip, L.knee, 0.45)), cloth = legsOf === 'pants' || legsOf === 'shorts' || legsOf === 'tights' || suit;
      var col = suit ? '#E8ECF2' : legsOf === 'tights' ? (p.tights || skin) : cloth ? bot[0] : skin, add = suit ? 0.016 : legsOf === 'pants' ? 0.008 : 0;
      var r0 = (fem ? 0.056 : 0.054) + add, r1 = (fem ? 0.05 : 0.048) + add, r2 = 0.033 + add;
      chain([[H0[0], H0[1], r0 * h * H0[2]], [M[0], M[1], r1 * h * M[2]], [K0[0], K0[1], r2 * h * K0[2]]]);
      cyl(H0, K0, r0 * h, col, cloth && !suit ? null : skinDark, far);
      if (legsOf === 'shorts' && !suit) { var S1 = pt(lerp3(L.hip, L.knee, 0.55)); chain([[H0[0], H0[1], (r0 + 0.008) * h], [S1[0], S1[1], (r1 + 0.01) * h]]); cyl(H0, S1, r0 * h, bot[0], null, far); }
      if (cloth && !suit && legsOf === 'pants') { // folds behind the knee
        c.strokeStyle = 'rgba(0,0,0,.16)'; c.lineWidth = 0.006 * h; c.beginPath(); c.moveTo(K0[0] - r2 * h * 0.7, K0[1] - 0.012 * h); c.quadraticCurveTo(K0[0], K0[1] - 0.004 * h, K0[0] + r2 * h * 0.7, K0[1] - 0.014 * h); c.stroke();
      }
    }
    function shin(L, far) {
      var K0 = pt(L.knee), C0 = pt(lerp3(L.knee, L.ank, 0.3)), A0 = pt(L.ank), pants = legsOf === 'pants';
      var col = suit ? '#E8ECF2' : legsOf === 'tights' ? (p.tights || skin) : pants ? bot[0] : skin, add = suit ? 0.017 : pants ? 0.01 : 0;
      chain([[K0[0], K0[1], (0.033 + add) * h * K0[2]], [C0[0], C0[1], (0.037 + add) * h * C0[2]], [A0[0], A0[1], (0.02 + add * 1.2) * h * A0[2]]]);
      cyl(K0, A0, 0.037 * h, col, pants || suit ? null : skinDark, far);
      if (suit) { // knee joint ring
        c.strokeStyle = '#94A3B8'; c.lineWidth = 0.012 * h; c.beginPath(); c.arc(K0[0], K0[1], 0.04 * h, 0, T2); c.stroke();
      }
      foot(L, far);
    }
    function foot(L, far) {
      var A0 = pt(L.ank), T0 = pt(L.toe), shoe = suit ? '#CBD5E1' : p.shoe || '#1E293B', sole = suit ? '#475569' : p.sole || '#E2E8F0';
      var big = suit ? 1.35 : 1, heel = p.heels && !suit;
      var soleUp = v === 'back' && L.psi < 0.75; // the foot flicked up behind: the sole faces the camera
      if (v === 'side' || !soleUp) { // sole layer under the shoe
        chain([[A0[0], A0[1] + 0.012 * h, 0.022 * h * big], [T0[0], T0[1] + 0.008 * h, 0.016 * h * big]]); c.fillStyle = shade(sole, far ? -0.2 : 0); c.fill();
      }
      chain([[A0[0], A0[1], 0.024 * h * big], [T0[0], T0[1], (heel ? 0.012 : 0.019) * h * big]]);
      if (soleUp) { var sg = c.createLinearGradient(A0[0] - 0.025 * h, 0, A0[0] + 0.025 * h, 0); sg.addColorStop(0, shade(sole, 0.1)); sg.addColorStop(1, shade(sole, -0.25)); c.fillStyle = sg; c.fill(); c.strokeStyle = shade(shoe, 0); c.lineWidth = 0.006 * h; c.stroke(); var Q = pt(lerp3(L.ank, L.toe, 0.42)); c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 0.004 * h; c.beginPath(); c.moveTo(Q[0] - 0.016 * h, Q[1]); c.lineTo(Q[0] + 0.016 * h, Q[1]); c.stroke(); return; }
      cyl(A0, T0, 0.024 * h, shoe, null, far);
      if (v === 'back' && !heel) { // heel counter seen from behind: a real shoe, not a ball
        var hw = 0.026 * h * big, hy0 = A0[1] - 0.014 * h, hh = 0.036 * h * big;
        var gh = c.createLinearGradient(A0[0] - hw, 0, A0[0] + hw, 0); gh.addColorStop(0, shade(shoe, 0.25)); gh.addColorStop(0.45, shoe); gh.addColorStop(1, shade(shoe, -0.35));
        c.fillStyle = gh; rr(c, A0[0] - hw, hy0, hw * 2, hh, hw * 0.7); c.fill();
        c.fillStyle = sole; rr(c, A0[0] - hw * 0.98, hy0 + hh - 0.011 * h, hw * 1.96, 0.011 * h, 0.005 * h); c.fill();
        c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(A0[0] - hw * 0.5, hy0 + 0.006 * h, hw * 0.35, hh * 0.45);
        if (p.stripeShoe) { c.fillStyle = p.stripeShoe; c.fillRect(A0[0] - hw, hy0 + hh * 0.45, hw * 2, 0.006 * h); }
        return;
      }
      if (heel) { c.fillStyle = shade(shoe, -0.3); c.fillRect(A0[0] - 0.005 * h, A0[1], 0.01 * h, 0.034 * h); }
      else if (!suit) { c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(A0[0] - LIGHT * 0.006 * h, A0[1] - 0.006 * h, 0.009 * h, 0.006 * h, 0, 0, T2); c.fill(); }
    }

    /* ---------------- arms */
    function arm(A, far) {
      var S0 = pt(A.sh), E0 = pt(A.el), W0 = pt(A.wr), H0 = pt(A.hd), M0 = pt(lerp3(A.sh, A.el, 0.4)), F0 = pt(lerp3(A.el, A.wr, 0.35));
      var sl = suit ? 'long' : p.sleeve || 'short', cl = suit ? '#E8ECF2' : top[0], add = suit ? 0.014 : sl === 'long' ? 0.006 : 0;
      var ru = (fem ? 0.027 : 0.032) + add, rm = (fem ? 0.024 : 0.03) + add, re = (fem ? 0.019 : 0.022) + add, rf = (fem ? 0.021 : 0.025) + add, rw = (fem ? 0.014 : 0.016) + add * 0.8;
      chain([[S0[0], S0[1], ru * h], [M0[0], M0[1], rm * h], [E0[0], E0[1], re * h]]);
      cyl(S0, E0, ru * h, sl === 'none' || sl === 'short' ? skin : cl, sl === 'none' || sl === 'short' ? skinDark : null, far);
      if (sl === 'short') { var Q = pt(lerp3(A.sh, A.el, 0.46)); chain([[S0[0], S0[1], (ru + 0.005) * h], [Q[0], Q[1], (rm + 0.004) * h]]); cyl(S0, Q, ru * h, cl, null, far); c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 0.004 * h; c.stroke(); }
      chain([[E0[0], E0[1], re * h], [F0[0], F0[1], rf * h], [W0[0], W0[1], rw * h]]);
      cyl(E0, W0, rf * h, sl === 'long' ? cl : skin, sl === 'long' ? null : skinDark, far);
      if (suit) { c.strokeStyle = '#94A3B8'; c.lineWidth = 0.01 * h; c.beginPath(); c.arc(E0[0], E0[1], re * h * 1.05, 0, T2); c.stroke(); }
      // hand (a soft fist for running, an open hand otherwise) / glove
      var hc = suit ? '#94A3B8' : p.gloves || skin, fist = k === 'run' || k === 'slide';
      if (fist) { chain([[W0[0], W0[1], rw * h], [H0[0] * 0.6 + W0[0] * 0.4, H0[1] * 0.6 + W0[1] * 0.4, (fem ? 0.02 : 0.023) * h * (suit ? 1.3 : 1)]]); }
      else chain([[W0[0], W0[1], rw * h], [H0[0], H0[1], (fem ? 0.014 : 0.017) * h * (suit ? 1.3 : 1)]]);
      cyl(W0, H0, 0.02 * h, hc, suit ? null : skinDark, far);
      if (p.cuff && !suit) { c.strokeStyle = p.cuff; c.lineWidth = 0.01 * h; c.beginPath(); c.moveTo(W0[0] - rw * h, W0[1]); c.lineTo(W0[0] + rw * h, W0[1]); c.stroke(); }
    }

    /* ---------------- torso (back / front) */
    function torsoBF() {
      var sh = B.sh.map(pt), pit = B.pit.map(pt), wa = B.waist.map(pt), hp = B.hipS.map(pt), cr = pt(B.crotch), nk = pt(B.neck);
      var L = v === 'front' ? 1 : 0, R = 1 - L; // screen-left / right index
      var top0 = suit ? '#E8ECF2' : top[0], top1 = suit ? '#94A3B8' : top[1];
      // hips / seat (pants or skirt)
      var skirt = legsOf === 'skirt' || legsOf === 'dress';
      if (!skirt) {
        c.beginPath(); c.moveTo(wa[L][0], wa[L][1]); c.quadraticCurveTo(hp[L][0] - LIGHT * 0.004 * h, (wa[L][1] + hp[L][1]) / 2, hp[L][0], hp[L][1]);
        c.quadraticCurveTo(hp[L][0] + 0.004 * h * (L ? -1 : 1), cr[1] + 0.02 * h, cr[0] - 0.02 * h, cr[1] + 0.03 * h); c.lineTo(cr[0] + 0.02 * h, cr[1] + 0.03 * h);
        c.quadraticCurveTo(hp[R][0], cr[1] + 0.02 * h, hp[R][0], hp[R][1]); c.quadraticCurveTo(hp[R][0], (wa[R][1] + hp[R][1]) / 2, wa[R][0], wa[R][1]); c.closePath();
        var pc = suit ? '#E8ECF2' : legsOf === 'tights' ? (p.shorts || p.tights || skin) : bot[0], g = c.createLinearGradient(hp[L][0], 0, hp[R][0], 0);
        g.addColorStop(0, shade(pc, 0.1)); g.addColorStop(0.45, pc); g.addColorStop(1, shade(pc, -0.2)); c.fillStyle = g; c.fill();
        if (v === 'front' && !suit && legsOf === 'pants') { c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 0.005 * h; c.beginPath(); c.moveTo((wa[0][0] + wa[1][0]) / 2, wa[0][1] + 0.015 * h); c.quadraticCurveTo((wa[0][0] + wa[1][0]) / 2 + 0.012 * h, cr[1] - 0.01 * h, cr[0], cr[1] + 0.02 * h); c.stroke(); }
        if (v === 'back' && !suit) { // seat seam + pockets
          c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 0.005 * h; c.beginPath(); c.moveTo((wa[0][0] + wa[1][0]) / 2, wa[0][1] + 0.01 * h); c.lineTo(cr[0], cr[1] + 0.02 * h); c.stroke();
          if (legsOf === 'pants') [0, 1].forEach(function (i) { var px = (hp[i][0] * 0.55 + cr[0] * 0.45), py = (wa[i][1] + hp[i][1]) / 2 + 0.012 * h; c.strokeStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.moveTo(px - 0.022 * h, py); c.lineTo(px + 0.022 * h, py); c.lineTo(px + 0.018 * h, py + 0.035 * h); c.lineTo(px - 0.018 * h, py + 0.035 * h); c.closePath(); c.stroke(); });
        }
      }
      // chest / back
      var bodyB = 0.425; // shirt hem height
      c.beginPath();
      var nl = [nk[0] - 0.036 * h, nk[1] + 0.008 * h], nr = [nk[0] + 0.036 * h, nk[1] + 0.008 * h];
      var hemL = [wa[L][0] * 0.5 + hp[L][0] * 0.5, (wa[L][1] + hp[L][1]) / 2 + 0.01 * h], hemR = [wa[R][0] * 0.5 + hp[R][0] * 0.5, (wa[R][1] + hp[R][1]) / 2 + 0.01 * h];
      if (skirt || p.long) { hemL = [hp[L][0], hp[L][1]]; hemR = [hp[R][0], hp[R][1]]; }
      c.moveTo(nl[0], nl[1]);
      c.quadraticCurveTo(sh[L][0] * 0.55 + nl[0] * 0.45, sh[L][1] - 0.022 * h, sh[L][0] - (L ? -1 : 1) * 0.004 * h, sh[L][1] - 0.012 * h); // trapezius
      c.quadraticCurveTo(sh[L][0] - (L ? -1 : 1) * 0.03 * h, sh[L][1] + 0.01 * h, pit[L][0], pit[L][1]); // deltoid
      c.quadraticCurveTo(wa[L][0] - (L ? -1 : 1) * 0.002 * h, (pit[L][1] + wa[L][1]) / 2, wa[L][0], wa[L][1]); // lats → waist
      c.quadraticCurveTo(hemL[0], hemL[1] - 0.02 * h, hemL[0], hemL[1]);
      c.quadraticCurveTo((hemL[0] + hemR[0]) / 2, hemL[1] + 0.012 * h, hemR[0], hemR[1]);
      c.quadraticCurveTo(hemR[0], hemR[1] - 0.02 * h, wa[R][0], wa[R][1]);
      c.quadraticCurveTo(wa[R][0] + (L ? -1 : 1) * 0.002 * h, (pit[R][1] + wa[R][1]) / 2, pit[R][0], pit[R][1]);
      c.quadraticCurveTo(sh[R][0] + (L ? -1 : 1) * 0.03 * h, sh[R][1] + 0.01 * h, sh[R][0] + (L ? -1 : 1) * 0.004 * h, sh[R][1] - 0.012 * h);
      c.quadraticCurveTo(sh[R][0] * 0.55 + nr[0] * 0.45, sh[R][1] - 0.022 * h, nr[0], nr[1]);
      c.closePath();
      var x0 = Math.min(sh[0][0], sh[1][0]) - 0.03 * h, x1 = Math.max(sh[0][0], sh[1][0]) + 0.03 * h;
      var tg = c.createLinearGradient(x0, 0, x1, 0); tg.addColorStop(0, shade(top0, 0.16)); tg.addColorStop(0.35, top0); tg.addColorStop(0.75, shade(top0, -0.12)); tg.addColorStop(1, shade(top1, -0.15));
      c.fillStyle = tg; c.fill();
      c.save(); c.clip();
      var vg = c.createLinearGradient(0, nk[1], 0, hemL[1]); vg.addColorStop(0, 'rgba(255,255,255,.16)'); vg.addColorStop(0.25, 'rgba(255,255,255,0)'); vg.addColorStop(0.8, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.22)');
      c.fillStyle = vg; c.fillRect(x0, nk[1], x1 - x0, hemL[1] - nk[1] + 0.03 * h);
      if (p.stripe) { c.fillStyle = p.stripe; c.fillRect(x0, (pit[0][1] + wa[0][1]) / 2 - 0.008 * h, x1 - x0, 0.018 * h); }
      if (p.pattern) p.pattern(c, h, x0, nk[1], x1 - x0, hemL[1] - nk[1], v);
      var mid = (nk[0] + (wa[0][0] + wa[1][0]) / 2) / 2;
      if (v === 'back' && !suit) {
        // spine crease, shoulder blades, fabric folds at the waist
        c.strokeStyle = 'rgba(0,0,0,.13)'; c.lineWidth = 0.007 * h; c.beginPath(); c.moveTo(nk[0], nk[1] + 0.03 * h); c.quadraticCurveTo(mid, (nk[1] + wa[0][1]) / 2, (wa[0][0] + wa[1][0]) / 2, wa[0][1]); c.stroke();
        [0, 1].forEach(function (i) { var bx = sh[i][0] * 0.62 + nk[0] * 0.38, by = sh[i][1] + 0.05 * h; c.strokeStyle = 'rgba(0,0,0,.1)'; c.lineWidth = 0.006 * h; c.beginPath(); c.arc(bx, by, 0.035 * h, i ? 0.2 : PI - 1.4, i ? 1.4 : PI - 0.2); c.stroke(); c.fillStyle = 'rgba(255,255,255,.07)'; c.beginPath(); c.ellipse(bx, by - 0.012 * h, 0.03 * h, 0.022 * h, 0, 0, T2); c.fill(); });
        c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = 0.005 * h;
        for (var i = 0; i < 3; i++) { var fy = wa[0][1] + (i - 1) * 0.018 * h; c.beginPath(); c.moveTo(wa[0][0] + 0.01 * h, fy); c.quadraticCurveTo(mid, fy + 0.012 * h * (i % 2 ? -1 : 1), wa[1][0] - 0.012 * h, fy + 0.004 * h); c.stroke(); }
      }
      if (v === 'front' && !suit) {
        // collarbones, chest shading, waist folds
        c.strokeStyle = 'rgba(0,0,0,.1)'; c.lineWidth = 0.005 * h;
        if (fem) { [0, 1].forEach(function (i) { var bx = (sh[i][0] + nk[0]) / 2, by = pit[i][1] + 0.004 * h, bg3 = c.createRadialGradient(bx - 0.008 * h, by - 0.01 * h, 0, bx, by, 0.04 * h); bg3.addColorStop(0, 'rgba(255,255,255,.16)'); bg3.addColorStop(0.7, 'rgba(255,255,255,0)'); bg3.addColorStop(1, 'rgba(0,0,0,.08)'); c.fillStyle = bg3; c.beginPath(); c.arc(bx, by, 0.04 * h, 0, T2); c.fill(); }); }
        else { c.beginPath(); c.moveTo(nk[0], pit[0][1] - 0.005 * h); c.lineTo(nk[0], wa[0][1] - 0.02 * h); c.stroke(); }
      }
      c.restore();
      if (suit) { // chest control box + flag patch
        var cx = nk[0], cy = (pit[0][1] + wa[0][1]) / 2;
        if (v === 'front') { c.fillStyle = '#CBD5E1'; c.fillRect(cx - 0.04 * h, cy - 0.025 * h, 0.08 * h, 0.05 * h); c.fillStyle = '#22C55E'; c.fillRect(cx - 0.03 * h, cy - 0.015 * h, 0.012 * h, 0.012 * h); c.fillStyle = '#F43F5E'; c.fillRect(cx - 0.012 * h, cy - 0.015 * h, 0.012 * h, 0.012 * h); }
        else { // life-support pack on the back
          var px0 = Math.min(sh[0][0], sh[1][0]) + 0.012 * h, pw = Math.abs(sh[1][0] - sh[0][0]) - 0.024 * h;
          var lg = c.createLinearGradient(px0, 0, px0 + pw, 0); lg.addColorStop(0, '#F1F5F9'); lg.addColorStop(0.5, '#CBD5E1'); lg.addColorStop(1, '#64748B');
          c.fillStyle = lg; rr(c, px0, sh[0][1] - 0.01 * h, pw, 0.2 * h, 0.03 * h); c.fill();
          c.fillStyle = '#334155'; c.fillRect(px0 + pw * 0.2, sh[0][1] + 0.05 * h, pw * 0.6, 0.012 * h); c.fillRect(px0 + pw * 0.2, sh[0][1] + 0.08 * h, pw * 0.6, 0.012 * h);
        }
      }
      if (p.bag && v === 'back' && !suit) { // backpack with straps
        var bx0 = Math.min(sh[0][0], sh[1][0]) + 0.03 * h, bw = Math.abs(sh[1][0] - sh[0][0]) - 0.06 * h, by0 = sh[0][1] + 0.025 * h, bh = 0.15 * h;
        c.strokeStyle = shade(p.bag[1], -0.2); c.lineWidth = 0.014 * h; c.beginPath(); c.moveTo(sh[0][0] + 0.02 * h, sh[0][1] - 0.005 * h); c.lineTo(bx0 + 0.01 * h, by0 + 0.02 * h); c.moveTo(sh[1][0] - 0.02 * h, sh[1][1] - 0.005 * h); c.lineTo(bx0 + bw - 0.01 * h, by0 + 0.02 * h); c.stroke();
        var bg2 = c.createLinearGradient(bx0, 0, bx0 + bw, 0); bg2.addColorStop(0, shade(p.bag[0], 0.15)); bg2.addColorStop(0.5, p.bag[0]); bg2.addColorStop(1, p.bag[1]);
        c.fillStyle = bg2; rr(c, bx0, by0, bw, bh, 0.03 * h); c.fill();
        c.fillStyle = shade(p.bag[1], -0.1); rr(c, bx0 + bw * 0.12, by0 + bh * 0.5, bw * 0.76, bh * 0.42, 0.02 * h); c.fill();
        c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(bx0 + bw * 0.12, by0 + bh * 0.5, bw * 0.76, 0.006 * h);
        c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(bx0 + bw * 0.1, by0 + 0.008 * h, bw * 0.8, 0.008 * h);
        c.fillStyle = '#FCD34D'; c.fillRect(bx0 + bw / 2 - 0.006 * h, by0 + bh * 0.62, 0.012 * h, 0.018 * h);
      }
      if (p.deco) p.deco(c, h, P, B, v);
    }
    function rr(cx, x, y, w, hh, r) { r = Math.min(r, w / 2, hh / 2); cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + hh, r); cx.arcTo(x + w, y + hh, x, y + hh, r); cx.arcTo(x, y + hh, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }

    /* ---------------- torso (side view, facing right) */
    function torsoSide() {
      var nk = pt(B.neck), shp = pt(B.sh[0]), wa = pt(B.waist[0]), hp = pt(B.hipS[0]), cr = pt(B.crotch);
      var ln = J.lean, f = function (dz, dy, base) { return [base[0] + dz * h * Math.cos(ln) + dy * h * Math.sin(ln), base[1] + dy * h * Math.cos(ln) - dz * h * Math.sin(ln)]; };
      var top0 = suit ? '#E8ECF2' : top[0];
      if (suit) { // backpack behind
        var b0 = f(-0.085, 0.0, shp), bpg = c.createLinearGradient(b0[0] - 0.07 * h, 0, b0[0] + 0.01 * h, 0); bpg.addColorStop(0, '#94A3B8'); bpg.addColorStop(0.5, '#E2E8F0'); bpg.addColorStop(1, '#CBD5E1'); c.fillStyle = bpg; rr(c, b0[0] - 0.07 * h, b0[1] - 0.01 * h, 0.08 * h, 0.21 * h, 0.025 * h); c.fill(); c.fillStyle = '#94A3B8'; c.fillRect(b0[0] - 0.07 * h, b0[1] + 0.06 * h, 0.08 * h, 0.012 * h);
      }
      var sx = suit ? 1.3 : 1, fb = f(0.078 * sx, 0.03, shp), ff = f(0.075 * sx, 0.0, wa), bb = f(-0.07 * sx, 0.03, shp), bw = f(-0.062 * sx, 0.0, wa), hb = f(-0.075 * sx, 0.0, hp), hf = f(0.07 * sx, 0.0, hp);
      c.beginPath(); c.moveTo(nk[0] - 0.03 * h, nk[1]); c.quadraticCurveTo(bb[0] - 0.01 * h, bb[1] - 0.04 * h, bb[0], bb[1]); c.quadraticCurveTo(bw[0] - 0.012 * h, (bb[1] + bw[1]) / 2, bw[0], bw[1]);
      c.quadraticCurveTo(hb[0] - 0.02 * h, hb[1], cr[0] - 0.02 * h, cr[1] + 0.02 * h); c.lineTo(cr[0] + 0.03 * h, cr[1] + 0.02 * h); c.quadraticCurveTo(hf[0] + 0.01 * h, hf[1], ff[0], ff[1]);
      c.quadraticCurveTo(fb[0] + 0.02 * h, (fb[1] + ff[1]) / 2, fb[0], fb[1]); c.quadraticCurveTo(fb[0], nk[1] + 0.01 * h, nk[0] + 0.03 * h, nk[1]); c.closePath();
      var g = c.createLinearGradient(bb[0], 0, fb[0], 0); g.addColorStop(0, shade(top0, -0.22)); g.addColorStop(0.45, top0); g.addColorStop(0.8, shade(top0, 0.1)); g.addColorStop(1, shade(top0, -0.08));
      c.fillStyle = g; c.fill();
      c.save(); c.clip();
      var pc = suit ? '#DDE3EA' : bot[0], wy = (wa[1] + hp[1]) / 2 - 0.005 * h;
      if (!suit && legsOf !== 'skirt' && legsOf !== 'dress') { c.fillStyle = pc; c.fillRect(bb[0] - 0.1 * h, wy, 0.3 * h, 0.3 * h); c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(bb[0] - 0.1 * h, wy, 0.3 * h, 0.008 * h); }
      if (suit) { c.fillStyle = '#94A3B8'; c.fillRect(bb[0] - 0.1 * h, wy, 0.3 * h, 0.012 * h); c.fillStyle = '#F97316'; c.fillRect(fb[0] - 0.035 * h, fb[1] + 0.04 * h, 0.03 * h, 0.02 * h); }
      if (p.stripe) { c.fillStyle = p.stripe; c.fillRect(bb[0] - 0.1 * h, (fb[1] + ff[1]) / 2, 0.3 * h, 0.016 * h); }
      c.restore();
    }

    /* ---------------- head */
    function head() {
      var Hc = pt(B.head), x = Hc[0], y = Hc[1], r = 0.058 * h, hc = p.hair || '#2B1B10', hd = shade(hc, -0.4), hl = shade(hc, 0.25), st = p.style || 'short';
      var nk = pt(B.neck), skD = warm(skin, 0.22);
      // neck
      if (suit) { helmet(x, y, r); return; }
      chain([[nk[0], nk[1] + 0.01 * h, 0.028 * h], [x, y + r * 0.4, 0.026 * h]]); cyl([nk[0], nk[1]], [x, y], 0.028 * h, skin, skinDark);
      if (v === 'back') {
        // long hair falls over the back first
        if (st === 'long' || st === 'wavy' || st === 'braids' || st === 'bob') {
          var ln = st === 'bob' ? 0.95 : st === 'long' ? 2.4 : st === 'wavy' ? 2.2 : 2.6;
          var g0 = c.createLinearGradient(x - r, 0, x + r, 0); g0.addColorStop(0, hl); g0.addColorStop(0.5, hc); g0.addColorStop(1, hd);
          c.fillStyle = g0; c.beginPath(); c.moveTo(x - r * 1.02, y - r * 0.1);
          if (st === 'wavy') { for (var i = 0; i <= 4; i++) c.quadraticCurveTo(x - r * (1.18 - (i % 2) * 0.12), y + r * ln * (i + 0.5) / 5, x - r * (1.08 - i * 0.05), y + r * ln * (i + 1) / 5); }
          else c.quadraticCurveTo(x - r * 1.2, y + r * ln * 0.6, x - r * 0.75, y + r * ln);
          c.quadraticCurveTo(x, y + r * (ln + 0.18), x + r * 0.75, y + r * ln);
          c.quadraticCurveTo(x + r * 1.2, y + r * ln * 0.6, x + r * 1.02, y - r * 0.1); c.closePath(); c.fill();
          c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 0.004 * h; for (i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(x + i * r * 0.22, y); c.quadraticCurveTo(x + i * r * 0.3, y + r * ln * 0.6, x + i * r * 0.2, y + r * ln * 0.95); c.stroke(); }
          if (st === 'braids') { c.strokeStyle = hd; c.lineWidth = r * 0.25; [-0.45, 0.45].forEach(function (q) { c.beginPath(); c.moveTo(x + q * r, y + r * 0.5); c.lineTo(x + q * r * 1.1, y + r * 2.9); c.stroke(); }); }
        }
        // ears, skull
        [-1, 1].forEach(function (s) { c.fillStyle = skin; c.beginPath(); c.ellipse(x + s * r * 0.95, y + r * 0.12, r * 0.2, r * 0.3, s * 0.15, 0, T2); c.fill(); c.fillStyle = skD; c.beginPath(); c.ellipse(x + s * r * 0.97, y + r * 0.14, r * 0.09, r * 0.17, 0, 0, T2); c.fill(); });
        var sg = c.createRadialGradient(x - r * 0.4, y - r * 0.3, r * 0.1, x, y, r * 1.1); sg.addColorStop(0, shade(skin, 0.1)); sg.addColorStop(1, skD);
        c.fillStyle = sg; c.beginPath(); c.ellipse(x, y, r * 0.92, r * 1.02, 0, 0, T2); c.fill();
        // hair cap seen from behind (hairline at the nape), with strands
        var nape = st === 'buzz' ? 0.45 : st === 'short' || st === 'curly' ? 0.62 : 0.7;
        var hg = c.createLinearGradient(x - r, y - r, x + r, y + r); hg.addColorStop(0, hl); hg.addColorStop(0.45, hc); hg.addColorStop(1, hd);
        c.fillStyle = hg; c.beginPath(); c.moveTo(x - r * 0.95, y + r * 0.05);
        c.bezierCurveTo(x - r * 1.05, y - r * 0.9, x - r * 0.5, y - r * 1.12, x, y - r * 1.1);
        c.bezierCurveTo(x + r * 0.5, y - r * 1.12, x + r * 1.05, y - r * 0.9, x + r * 0.95, y + r * 0.05);
        c.quadraticCurveTo(x + r * 0.9, y + r * nape, x + r * 0.5, y + r * (nape + 0.1));
        c.quadraticCurveTo(x, y + r * (nape + 0.22), x - r * 0.5, y + r * (nape + 0.1));
        c.quadraticCurveTo(x - r * 0.9, y + r * nape, x - r * 0.95, y + r * 0.05); c.closePath(); c.fill();
        if (st !== 'buzz') { c.strokeStyle = shade(hc, 0.32); c.globalAlpha = 0.5; c.lineWidth = 0.004 * h; for (i = 0; i < 9; i++) { var a = PI * (1.08 + i * 0.1); c.beginPath(); c.moveTo(x + Math.cos(a) * r * 0.3, y - r * 0.55 + Math.sin(a) * r * 0.2); c.quadraticCurveTo(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.7, x + Math.cos(a) * r * 0.85, y + r * 0.3 * (i % 3)); c.stroke(); } c.globalAlpha = 1; }
        c.fillStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.ellipse(x - r * 0.35, y - r * 0.6, r * 0.35, r * 0.14, -0.5, 0, T2); c.fill();
        if (st === 'bun') { circle(x, y - r * 0.55, r * 0.42, hc); circle(x - r * 0.12, y - r * 0.66, r * 0.16, hl); }
        if (st === 'pony') { var sw = Math.sin((o.ph || 0) * T2 * 2) * r * 0.35; c.strokeStyle = hc; c.lineWidth = r * 0.5; c.beginPath(); c.moveTo(x, y - r * 0.3); c.quadraticCurveTo(x + sw * 2, y + r * 0.8, x + sw * 3, y + r * 1.9); c.stroke(); circle(x, y - r * 0.32, r * 0.17, shade(hc, -0.5)); }
        if (st === 'afro' || st === 'curly') { var R2 = st === 'afro' ? 1.3 : 1.0; for (i = 0; i < 14; i++) { var a2 = PI * 0.95 + i / 13 * PI * 1.1; circle(x + Math.cos(a2) * r * R2 * 0.9, y - r * 0.05 + Math.sin(a2) * r * R2, r * (st === 'afro' ? 0.36 : 0.25), i % 2 ? hc : hd); } }
      } else if (v === 'front') {
        if (st === 'long' || st === 'wavy' || st === 'braids' || st === 'bob') { var ln2 = st === 'bob' ? 1.0 : 2.3; c.fillStyle = hd; c.beginPath(); c.moveTo(x - r * 1.05, y - r * 0.2); c.quadraticCurveTo(x - r * 1.3, y + r * ln2 * 0.7, x - r * 0.9, y + r * ln2); c.lineTo(x + r * 0.9, y + r * ln2); c.quadraticCurveTo(x + r * 1.3, y + r * ln2 * 0.7, x + r * 1.05, y - r * 0.2); c.closePath(); c.fill(); }
        if (st === 'afro') { var ag = c.createRadialGradient(x - r * 0.4, y - r * 0.6, r * 0.2, x, y - r * 0.2, r * 1.5); ag.addColorStop(0, hl); ag.addColorStop(1, hd); c.fillStyle = ag; c.beginPath(); c.arc(x, y - r * 0.25, r * 1.45, 0, T2); c.fill(); }
        [-1, 1].forEach(function (s) { c.fillStyle = skD; c.beginPath(); c.ellipse(x + s * r * 0.93, y + r * 0.12, r * 0.15, r * 0.25, 0, 0, T2); c.fill(); });
        // face: oval with a jaw
        var fg = c.createRadialGradient(x - r * 0.3, y - r * 0.2, r * 0.1, x, y + r * 0.1, r * 1.15); fg.addColorStop(0, shade(skin, 0.12)); fg.addColorStop(0.7, skin); fg.addColorStop(1, skD);
        c.fillStyle = fg; c.beginPath(); c.moveTo(x - r * 0.9, y - r * 0.1); c.bezierCurveTo(x - r * 0.95, y - r * 1.1, x + r * 0.95, y - r * 1.1, x + r * 0.9, y - r * 0.1);
        c.bezierCurveTo(x + r * 0.88, y + r * (fem ? 0.6 : 0.7), x + r * 0.35, y + r * 1.05, x, y + r * 1.08); c.bezierCurveTo(x - r * 0.35, y + r * 1.05, x - r * 0.88, y + r * (fem ? 0.6 : 0.7), x - r * 0.9, y - r * 0.1); c.fill();
        face(x, y, r);
        // hair on top + fringe / parting
        var hg2 = c.createLinearGradient(x, y - r * 1.1, x, y); hg2.addColorStop(0, hl); hg2.addColorStop(1, hc);
        c.fillStyle = hg2; c.beginPath();
        if (st === 'buzz') { c.ellipse(x, y - r * 0.45, r * 0.93, r * 0.62, 0, PI, T2); c.fill(); }
        else {
          c.moveTo(x - r * 0.98, y + r * 0.2); c.bezierCurveTo(x - r * 1.12, y - r * 1.25, x + r * 1.12, y - r * 1.25, x + r * 0.98, y + r * 0.2);
          if (st === 'short' || st === 'curly' || st === 'afro') c.quadraticCurveTo(x + r * 0.82, y - r * 0.55, x + r * 0.1, y - r * 0.55);
          else c.quadraticCurveTo(x + r * 0.7, y - r * 0.75, x + r * 0.08, y - r * 0.62);
          c.quadraticCurveTo(x - r * 0.6, y - r * 0.5, x - r * 0.98, y + r * 0.2); c.closePath(); c.fill();
        }
        if (st === 'long' || st === 'wavy' || st === 'braids') { c.fillStyle = hc; [-1, 1].forEach(function (s) { c.beginPath(); c.moveTo(x + s * r * 0.98, y - r * 0.2); c.quadraticCurveTo(x + s * r * 1.15, y + r * 1.0, x + s * r * 0.8, y + r * 1.9); c.lineTo(x + s * r * 0.7, y + r * 0.4); c.closePath(); c.fill(); }); }
        if (st === 'bun') { circle(x, y - r * 1.05, r * 0.42, hc); }
        if (st === 'curly') for (var j = 0; j < 9; j++) { var a3 = PI + j / 8 * PI; circle(x + Math.cos(a3) * r * 0.92, y - r * 0.2 + Math.sin(a3) * r * 0.9, r * 0.26, j % 2 ? hc : hd); }
        c.fillStyle = 'rgba(255,255,255,.2)'; c.beginPath(); c.ellipse(x - r * 0.35, y - r * 0.75, r * 0.32, r * 0.1, -0.3, 0, T2); c.fill();
      } else { // side profile facing right
        var sg2 = c.createRadialGradient(x - r * 0.1, y - r * 0.3, r * 0.1, x, y, r * 1.1); sg2.addColorStop(0, shade(skin, 0.1)); sg2.addColorStop(1, skD);
        c.fillStyle = sg2; c.beginPath(); c.moveTo(x - r * 0.85, y + r * 0.2); c.bezierCurveTo(x - r * 1.0, y - r * 1.15, x + r * 0.95, y - r * 1.2, x + r * 0.9, y - r * 0.15);
        c.lineTo(x + r * 1.12, y + r * 0.2); c.lineTo(x + r * 0.92, y + r * 0.32); c.quadraticCurveTo(x + r * 0.95, y + r * 0.85, x + r * 0.45, y + r * 0.95); c.quadraticCurveTo(x - r * 0.2, y + r * 0.95, x - r * 0.4, y + r * 0.7); c.closePath(); c.fill();
        c.fillStyle = '#1F2937'; c.beginPath(); c.ellipse(x + r * 0.58, y - r * 0.05, r * 0.08, r * 0.11, 0, 0, T2); c.fill();
        c.strokeStyle = shade(hc, -0.2); c.lineWidth = r * 0.08; c.beginPath(); c.moveTo(x + r * 0.42, y - r * 0.28); c.lineTo(x + r * 0.75, y - r * 0.3); c.stroke();
        c.fillStyle = skD; c.beginPath(); c.ellipse(x - r * 0.1, y + r * 0.05, r * 0.17, r * 0.24, 0, 0, T2); c.fill();
        c.fillStyle = hc; c.beginPath(); c.moveTo(x - r * 0.9, y + r * 0.3); c.bezierCurveTo(x - r * 1.1, y - r * 1.2, x + r * 0.9, y - r * 1.3, x + r * 0.85, y - r * 0.5); c.quadraticCurveTo(x + r * 0.2, y - r * 0.6, x + r * 0.05, y - r * 0.2); c.quadraticCurveTo(x - r * 0.3, y + r * 0.1, x - r * 0.5, y + r * 0.6); c.closePath(); c.fill();
        if (st === 'pony' || st === 'long') { c.strokeStyle = hc; c.lineWidth = r * 0.45; c.beginPath(); c.moveTo(x - r * 0.7, y - r * 0.4); c.quadraticCurveTo(x - r * 1.6, y + r * 0.2, x - r * 1.7, y + r * 1.2); c.stroke(); }
      }
      if (p.hat) p.hat(c, x, y, r / 1.15 * 1.15, v);
    }
    function face(x, y, r) {
      var ec = p.eyes || '#3B2416', skD = warm(skin, 0.25);
      [-1, 1].forEach(function (s) {
        var ex = x + s * r * 0.36, ey = y + r * 0.08;
        c.fillStyle = 'rgba(0,0,0,.12)'; c.beginPath(); c.ellipse(ex, ey - r * 0.04, r * 0.22, r * 0.12, 0, 0, T2); c.fill(); // eye socket
        c.fillStyle = '#F8FAFC'; c.beginPath(); c.moveTo(ex - r * 0.18, ey); c.quadraticCurveTo(ex, ey - r * 0.13, ex + r * 0.18, ey); c.quadraticCurveTo(ex, ey + r * 0.09, ex - r * 0.18, ey); c.fill();
        circle(ex + s * r * 0.01, ey, r * 0.085, ec); circle(ex + s * r * 0.01, ey, r * 0.04, '#0B0B0B'); circle(ex - r * 0.03, ey - r * 0.035, r * 0.025, '#fff');
        c.strokeStyle = p.lash ? '#111' : 'rgba(40,20,10,.55)'; c.lineWidth = r * (p.lash ? 0.06 : 0.035); c.beginPath(); c.moveTo(ex - r * 0.19, ey + r * 0.01); c.quadraticCurveTo(ex, ey - r * 0.15, ex + r * 0.2, ey - r * 0.01); c.stroke();
        c.strokeStyle = shade(p.hair || '#2B1B10', -0.1); c.lineWidth = r * (fem ? 0.055 : 0.08); c.beginPath(); c.moveTo(ex - s * r * 0.18, ey - r * 0.2); c.quadraticCurveTo(ex + s * r * 0.02, ey - r * 0.3, ex + s * r * 0.22, ey - r * 0.2); c.stroke();
        if (fem) { c.fillStyle = 'rgba(244,114,182,.18)'; c.beginPath(); c.ellipse(x + s * r * 0.52, y + r * 0.45, r * 0.18, r * 0.1, 0, 0, T2); c.fill(); }
      });
      // nose (shadow on one side + nostrils)
      c.strokeStyle = skD; c.lineWidth = r * 0.06; c.beginPath(); c.moveTo(x + r * 0.06, y + r * 0.05); c.quadraticCurveTo(x + r * 0.12, y + r * 0.35, x + r * 0.02, y + r * 0.45); c.stroke();
      c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x - r * 0.07, y + r * 0.47, r * 0.04, r * 0.02, 0, 0, T2); c.ellipse(x + r * 0.08, y + r * 0.47, r * 0.04, r * 0.02, 0, 0, T2); c.fill();
      // lips
      var lc = p.lips || warm(skin, 0.3);
      c.fillStyle = lc; c.beginPath(); c.moveTo(x - r * 0.22, y + r * 0.66); c.quadraticCurveTo(x - r * 0.1, y + r * 0.58, x, y + r * 0.62); c.quadraticCurveTo(x + r * 0.1, y + r * 0.58, x + r * 0.22, y + r * 0.66); c.quadraticCurveTo(x, y + r * (fem ? 0.8 : 0.74), x - r * 0.22, y + r * 0.66); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = r * 0.025; c.beginPath(); c.moveTo(x - r * 0.21, y + r * 0.66); c.quadraticCurveTo(x, y + r * 0.69, x + r * 0.21, y + r * 0.66); c.stroke();
      if (p.beard) { c.fillStyle = p.beard; c.globalAlpha = 0.55; c.beginPath(); c.moveTo(x - r * 0.85, y + r * 0.2); c.quadraticCurveTo(x - r * 0.8, y + r * 1.1, x, y + r * 1.12); c.quadraticCurveTo(x + r * 0.8, y + r * 1.1, x + r * 0.85, y + r * 0.2); c.quadraticCurveTo(x + r * 0.5, y + r * 0.85, x, y + r * 0.8); c.quadraticCurveTo(x - r * 0.5, y + r * 0.85, x - r * 0.85, y + r * 0.2); c.fill(); c.globalAlpha = 1; }
    }
    function helmet(x, y, r) {
      var R = r * 1.55;
      var g = c.createRadialGradient(x - R * 0.35, y - R * 0.4, R * 0.1, x, y, R); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.6, '#E2E8F0'); g.addColorStop(1, '#94A3B8');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, R, 0, T2); c.fill();
      c.strokeStyle = '#94A3B8'; c.lineWidth = 0.012 * h; c.beginPath(); c.arc(x, y + R * 0.1, R * 0.98, PI * 0.2, PI * 0.8); c.stroke();
      if (v === 'back') { c.fillStyle = 'rgba(0,0,0,.08)'; c.beginPath(); c.arc(x + R * 0.2, y + R * 0.1, R * 0.75, 0, T2); c.fill(); return; }
      var vx = v === 'side' ? x + R * 0.3 : x, vw = v === 'side' ? R * 0.62 : R * 0.72;
      var vg = c.createLinearGradient(vx - vw, y - R * 0.5, vx + vw, y + R * 0.5); vg.addColorStop(0, '#FEF3C7'); vg.addColorStop(0.25, '#F59E0B'); vg.addColorStop(0.6, '#92400E'); vg.addColorStop(1, '#1C1917');
      c.fillStyle = '#475569'; c.beginPath(); c.ellipse(vx, y - R * 0.02, vw * 1.08, R * 0.64, 0, 0, T2); c.fill();
      c.fillStyle = vg; c.beginPath(); c.ellipse(vx, y - R * 0.02, vw, R * 0.56, 0, 0, T2); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 0.008 * h; c.beginPath(); c.ellipse(vx, y - R * 0.02, vw * 0.78, R * 0.4, 0, PI * 1.1, PI * 1.45); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(vx - vw * 0.35, y - R * 0.25, vw * 0.14, R * 0.08, -0.5, 0, T2); c.fill();
    }

    /* ---------------- skirt / dress (over the thighs) */
    function skirt() {
      var hp = B.hipS.map(pt), wa = B.waist.map(pt), sk = p.skirt || top, sl = p.skirtLen || 0.2, ph = (o.ph || 0) * T2;
      var fl = 0.03 + 0.03 * Math.sin(ph), sw = 0.025 * Math.sin(ph);
      var L = v === 'front' ? 1 : 0, R = 1 - L, dir = L ? -1 : 1;
      var bl = [hp[L][0] - dir * (fl + 0.01) * h + sw * h, hp[L][1] + sl * h], br = [hp[R][0] + dir * (fl + 0.01) * h + sw * h, hp[R][1] + sl * h];
      c.beginPath(); c.moveTo(wa[L][0], wa[L][1]); c.quadraticCurveTo(hp[L][0] - dir * 0.01 * h, hp[L][1], bl[0], bl[1]);
      c.quadraticCurveTo((bl[0] + br[0]) / 2, bl[1] + 0.025 * h, br[0], br[1]); c.quadraticCurveTo(hp[R][0] + dir * 0.01 * h, hp[R][1], wa[R][0], wa[R][1]); c.closePath();
      var g = c.createLinearGradient(bl[0], 0, br[0], 0); g.addColorStop(0, shade(sk[0], 0.15)); g.addColorStop(0.4, sk[0]); g.addColorStop(1, sk[1]); c.fillStyle = g; c.fill();
      c.strokeStyle = 'rgba(0,0,0,.14)'; c.lineWidth = 0.005 * h;
      for (var i = 1; i < 4; i++) { var t = i / 4; c.beginPath(); c.moveTo(wa[L][0] + (wa[R][0] - wa[L][0]) * t, wa[L][1] + 0.02 * h); c.quadraticCurveTo(bl[0] + (br[0] - bl[0]) * t + sw * h * 0.5, (wa[L][1] + bl[1]) / 2, bl[0] + (br[0] - bl[0]) * t, bl[1] + 0.008 * h); c.stroke(); }
      if (p.skirtDeco) p.skirtDeco(c, h, bl, br, wa);
    }

    /* ---------------- ordering */
    var items = [];
    var legSort = B.legs.slice().sort(function (a, b) { return depth(a.ank) - depth(b.ank); });
    var farS = v === 'side' ? 1 : 0; // side view: the right limbs (s = +1) are the far ones
    if (v === 'side') {
      B.legs.forEach(function (L) { var far = L.s === farS; items.push({ d: far ? -10 : 10, f: function () { thigh(L, far); shin(L, far); } }); });
      B.arms.forEach(function (A) { var far = A.s === farS; items.push({ d: far ? -11 : 11, f: function () { arm(A, far); } }); });
      items.push({ d: 0, f: torsoSide }); items.push({ d: 1, f: head });
    } else {
      legSort.forEach(function (L, i) {
        items.push({ d: -20 + i, f: function () { thigh(L, false); } });
        var nearCam = depth(L.ank) > 0.1 && v === 'back';
        items.push({ d: nearCam ? 1.5 : -18 + i, f: function () { shin(L, false); } });
      });
      items.push({ d: 0, f: torsoBF });
      if (legsOf === 'skirt' || legsOf === 'dress') items.push({ d: 0.5, f: skirt });
      B.arms.forEach(function (A) { var dd = depth(A.hd) * 0.5 + depth(A.el) * 0.5; items.push({ d: dd > 0.04 ? 3 + dd : dd < -0.02 ? -5 + dd : 2, f: function () { arm(A, false); } }); });
      items.push({ d: 2.5, f: head });
      if (v === 'back' && k === 'slide') items.forEach(function (it) { if (it.f === head) it.d = 2.5; });
    }
    items.sort(function (a, b) { return a.d - b.d; });
    items.forEach(function (it) { it.f(); });
    c.restore();
  }

  function one(w, h, dpr, o) {
    var cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w * dpr)); cv.height = Math.max(1, Math.ceil(h * dpr));
    var x = cv.getContext('2d'); x.scale(dpr, dpr); x.translate(w / 2, h * 0.99); draw(x, h * (o.scale || 0.96), o); cv.w = w; cv.h = h;
    return cv;
  }
  function sheet(w, h, dpr, o, n) {
    var fr = [];
    for (var i = 0; i < n; i++) fr.push(one(w, h, dpr, Object.assign({}, o, { ph: i / n })));
    return fr;
  }
  var SKINS = ['#F6D3B8', '#EBB98F', '#D9A066', '#C08552', '#9C6640', '#7A4A2C', '#5A3520', '#3F2516'];
  var HAIRS = ['#1A1110', '#2B1B10', '#4A2E1A', '#7B4A26', '#B07A3E', '#D9B26A', '#8C2F1B', '#3B3B3B'];
  D6.Rig = { draw: draw, one: one, sheet: sheet, shade: shade, warm: warm, SKINS: SKINS, HAIRS: HAIRS, pose: pose };
})();
