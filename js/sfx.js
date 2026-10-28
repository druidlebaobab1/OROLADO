/* v2832 — SONS DU CASINO (propriétaire : « chaque jeu a son son ; un son agréable quand on gagne, AUCUN son quand on perd
   (petite vibration), un petit bouton en haut pour couper le son »).
   Tout est SYNTHÉTISÉ ici (WebAudio : oscillateurs, bruit, enveloppes, filtres) — aucun fichier audio.
   - Un seul AudioContext pour tout le site (partagé avec les sons du trading de js/app.js : window.__oroAC),
     créé au premier toucher (iPhone : déverrouillage sur un geste).
   - Volume général doux (0,3) + compresseur léger ; nombre de voix limité ; rien quand l'onglet est caché.
   - Chaque jeu a un THÈME (famille : roue, rouleaux, avion, cartes…) + une petite mélodie de gain propre au jeu
     (note de départ, motif et tempo tirés du nom du jeu).
   - Perte : vibration courte (Android ; l'iPhone ne vibre pas depuis un site) + v2851 : petit motif d'échec doux et bas.
   - v2851 : AMBIANCE pendant chaque partie + vrais bruitages d'action (explosion, tir, zombie, pas, cha-ching…) : voir plus bas.
   - Bouton muet : localStorage 'oro_sfx' = 'on' | 'off' (par défaut : son activé).
   API : D6.Sfx.play(évènement, options, clé du jeu) · win(rapport gain/mise) · lose() · game(clé) · on() · set(bool) · button(el)
   Évènements : launch go tick stop step act hit card roll flip rise ball chip shot reveal. */
(function (D6) {
  'use strict';
  var AC = window.AudioContext || window.webkitAudioContext;
  var ctx = null, out = null, nbuf = null, active = 0, cur = '', memOn = null, last = {}, btns = [];
  var LOG = [];

  function lite() { return document.documentElement.classList.contains('oro-lite'); }
  function isOn() {
    if (memOn !== null) return memOn;
    var v = null; try { v = localStorage.getItem('oro_sfx'); } catch (e) { v = null; }
    memOn = v !== 'off';
    return memOn;
  }
  function ensure() {
    if (!AC) return null;
    // 2026-10-21 : le contexte partagé a pu être refait (son bloqué sur iPhone) → on suit toujours le contexte du site
    if (window.__oroAC && ctx !== window.__oroAC) { ctx = window.__oroAC; out = null; }
    if (!ctx || ctx.state === 'closed') { try { ctx = window.__oroAC = new AC(); out = null; } catch (e) { ctx = null; } }
    return ctx;
  }
  // 2026-10-21 (propriétaire : « je dois souvent actualiser la page pour retrouver le son ») : sur iPhone, après un appel, une
  // autre appli ou la veille, le son peut rester « interrompu » et ne revient jamais. À chaque toucher, on le relance ; s'il
  // ne repart pas, on refait un contexte neuf (pendant le toucher, ce qui est permis), sans recharger la page.
  function revive() {
    if (!isOn() || !AC) return;
    var c = ensure(); if (!c) return;
    if (c.state === 'running') return;
    try { var pr = c.resume(); if (pr && pr.catch) pr.catch(function () { /* ignore */ }); } catch (e) { /* ignore */ }
    try { var b = c.createBuffer(1, 1, 22050), sN = c.createBufferSource(); sN.buffer = b; sN.connect(c.destination); sN.start(0); } catch (e) { /* ignore */ }
    if (c.state === 'running') return;
    // pas reparti tout de suite : contexte neuf, créé et lancé PENDANT ce toucher
    try {
      var old = c, nc = new AC();
      window.__oroAC = nc; ctx = nc; out = null;
      try { bedKill(0); } catch (eK) { /* ignore */ }
      try { nc.resume(); } catch (eR) { /* ignore */ }
      try { var b2 = nc.createBuffer(1, 1, 22050), s2 = nc.createBufferSource(); s2.buffer = b2; s2.connect(nc.destination); s2.start(0); } catch (e2) { /* ignore */ }
      setTimeout(function () { try { if (old && old.state !== 'closed' && old !== window.__oroAC) old.close(); } catch (eC) { /* ignore */ } }, 400);
    } catch (eN) { /* ignore */ }
  }
  // contexte prêt à jouer maintenant (sinon : rien, jamais de sons en retard qui sortiraient d'un coup)
  function ready() {
    if (!isOn() || document.hidden) return null;
    var c = ensure(); if (!c) return null;
    if (c.state === 'running') return c;
    if (c.state !== 'closed') { // suspendu ou « interrompu » (iPhone)
      try { c.resume(); } catch (e) { /* ignore */ }
      var ua = navigator.userActivation;
      if (ua && ua.isActive) return c;
      if (c.state === 'suspended' && c.__oroIdle) return c; // mis en veille par nous (moteur déjà déverrouillé) : il repart
    }
    return null;
  }
  // 2026-10-21 (propriétaire : « le petit rond de son dans Safari ») : quand plus rien ne sonne, on met le moteur de son en
  // veille → Safari n'affiche plus l'icône de son. Il repart tout seul au son suivant. Validé : pour tout le monde.
  function idleOk() { return true; } // essai admin validé par le propriétaire (2026-10-21) : pour tout le monde
  setInterval(function () {
    var c = window.__oroAC;
    if (!c || c.state !== 'running' || !idleOk()) return;
    if (active > 0 || (B && B.nodes) || Date.now() - (window.__oroSndAt || 0) < 2500) return;
    try { c.__oroIdle = true; var pr = c.suspend(); if (pr && pr.catch) pr.catch(function () { /* ignore */ }); } catch (e) { /* ignore */ }
  }, 1500);
  function base() { return lite() ? 0.5 : 0.58; } // 2026-10-21 (propriétaire : « augmente bien le son ») : ~2× plus fort
  function bus(c) {
    if (out && out.context === c) return out;
    var g = c.createGain(); g.gain.value = isOn() ? base() : 0;
    var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 8500; lp.Q.value = 0.5; // chaleur : jamais d'aigus durs
    var cp = null;
    try { cp = c.createDynamicsCompressor(); cp.threshold.value = -16; cp.knee.value = 10; cp.ratio.value = 3.5; cp.attack.value = 0.004; cp.release.value = 0.2; } catch (e) { cp = null; }
    g.connect(lp);
    if (cp) { lp.connect(cp); cp.connect(c.destination); } else lp.connect(c.destination);
    out = g;
    return g;
  }
  function cap() { return lite() ? 8 : 18; }
  function room(n, prio) { return active + n <= cap() * (prio ? 2 : 1); }
  function track(src) {
    active++; window.__oroSndAt = Date.now();
    src.onended = function () { active = Math.max(0, active - 1); try { src.disconnect(); } catch (e) { /* ignore */ } };
  }
  // une note : attaque douce, extinction naturelle
  function tone(c, o) {
    var t = c.currentTime + (o.t || 0), d = Math.max(0.03, o.d || 0.2), a = Math.min(o.a || 0.006, d * 0.5), v = o.v || 0.2;
    var osc = c.createOscillator(), g = c.createGain(), node = osc;
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + (o.gd || d));
    if (o.det) osc.detune.setValueAtTime(o.det, t);
    if (o.lp) { var f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; osc.connect(f); node = f; }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    node.connect(g); g.connect(bus(c));
    osc.start(t); osc.stop(t + d + 0.05);
    track(osc);
  }
  // un souffle (bruit filtré) : clics, frottements, élans
  function noise(c, o) {
    if (!nbuf || nbuf.sampleRate !== c.sampleRate) {
      var n = Math.floor(c.sampleRate * 2); nbuf = c.createBuffer(1, n, c.sampleRate);
      var ch = nbuf.getChannelData(0); for (var i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1;
    }
    var t = c.currentTime + (o.t || 0), d = Math.max(0.012, o.d || 0.1), a = Math.min(o.a || 0.002, d * 0.5), v = o.v || 0.15;
    var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = nbuf;
    f.type = o.ft || 'bandpass'; f.frequency.setValueAtTime(o.f || 2000, t); if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + d); f.Q.value = o.q || 1;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f); f.connect(g); g.connect(bus(c));
    s.start(t, Math.random() * 0.4); s.stop(t + d + 0.05);
    track(s);
  }

  /* ---------- instruments (mélodies de gain) ---------- */
  var INS = {
    bell: function (c, f, t, v, d) { tone(c, { f: f, t: t, v: v, d: d * 1.3, a: 0.004 }); if (!lite()) { tone(c, { f: f * 2.0, t: t, v: v * 0.22, d: d * 0.6 }); tone(c, { f: f * 2.76, t: t, v: v * 0.08, d: d * 0.35 }); } },
    marimba: function (c, f, t, v, d) { tone(c, { f: f, t: t, v: v, d: Math.min(0.5, d), a: 0.003 }); if (!lite()) tone(c, { f: f * 4, t: t, v: v * 0.12, d: 0.07, a: 0.002 }); },
    keys: function (c, f, t, v, d) { tone(c, { f: f, t: t, v: v * 0.75, d: d * 1.2, type: 'triangle', lp: 2600, a: 0.008 }); if (!lite()) tone(c, { f: f * 2, t: t, v: v * 0.14, d: d * 0.5 }); },
    synth: function (c, f, t, v, d) { tone(c, { f: f, t: t, v: v * 0.55, d: d, type: 'triangle', det: -7, lp: 3200, a: 0.012 }); if (!lite()) tone(c, { f: f, t: t, v: v * 0.4, d: d, det: 7, a: 0.012 }); },
    pluck: function (c, f, t, v, d) { tone(c, { f: f, t: t, v: v, d: Math.min(0.45, d), type: 'triangle', lp: 2200, a: 0.003 }); },
    warm: function (c, f, t, v, d) { tone(c, { f: f, t: t, v: v * 0.6, d: d, type: 'triangle', lp: 1900, a: 0.015 }); if (!lite()) tone(c, { f: f / 2, t: t, v: v * 0.25, d: d * 0.8, a: 0.02 }); },
    glass: function (c, f, t, v, d) { tone(c, { f: f, t: t, v: v * 0.8, d: d * 1.4, a: 0.004 }); if (!lite()) tone(c, { f: f * 3.01, t: t, v: v * 0.1, d: d * 0.5 }); }
  };

  /* ---------- recettes (effets) : (c, P = thème, a = options) ---------- */
  var R = {
    click: function (c, P, a) { noise(c, { f: 3000 + (P.h % 7) * 160, q: 6, d: 0.022, v: 0.2 * (a.v || 1) }); tone(c, { f: 1500 + (P.h % 5) * 90, d: 0.035, v: 0.05 * (a.v || 1), a: 0.001 }); },
    peg: function (c, P, a) { var p = a.p || 0; tone(c, { f: P.r * 2 * (1 + p * 0.6), d: 0.07, v: 0.09, a: 0.002 }); noise(c, { f: 4200, q: 5, d: 0.015, v: 0.06 }); },
    reel: function (c, P) { noise(c, { f: 1300 + (P.h % 4) * 120, q: 3, d: 0.022, v: 0.1 }); },
    clunk: function (c, P) { tone(c, { f: 160, f2: 90, d: 0.13, v: 0.38, a: 0.002 }); noise(c, { ft: 'lowpass', f: 700, d: 0.06, v: 0.18 }); },
    thunk: function (c, P) { tone(c, { f: 230, f2: 130, d: 0.15, v: 0.28, a: 0.002 }); tone(c, { f: P.r * 2, t: 0.02, d: 0.25, v: 0.05 }); },
    whoosh: function (c, P) { noise(c, { f: 450, f2: 1700, q: 0.8, d: 0.38, v: 0.11, a: 0.09 }); },
    lever: function (c, P) { noise(c, { f: 2600, q: 4, d: 0.02, v: 0.16 }); tone(c, { f: 180, f2: 110, d: 0.1, v: 0.22, a: 0.002 }); noise(c, { t: 0.05, f: 500, f2: 1500, q: 0.9, d: 0.3, v: 0.08, a: 0.06 }); },
    chip: function (c, P) { noise(c, { f: 4300, q: 5, d: 0.025, v: 0.17 }); noise(c, { t: 0.05, f: 3800, q: 5, d: 0.025, v: 0.13 }); tone(c, { f: 2500, d: 0.05, v: 0.04 }); },
    takeoff: function (c, P) { noise(c, { ft: 'lowpass', f: 260, f2: 1300, d: 1.5, v: 0.13, a: 0.35 }); tone(c, { f: 85 + (P.h % 4) * 6, f2: 190, d: 1.3, v: 0.1, type: 'triangle', lp: 700, a: 0.3 }); },
    rise: function (c, P, a) { var n = Math.min(10, a.n || 0); INS.glass(c, P.r * Math.pow(2, PENTA[n % PENTA.length] / 12) * (n >= PENTA.length ? 2 : 1), 0, 0.1, 0.3); },
    rattle: function (c, P) { var n = lite() ? 3 : 6; for (var i = 0; i < n; i++) { var t = i * 0.05 + Math.random() * 0.03; noise(c, { t: t, f: 1700 + Math.random() * 900, q: 6, d: 0.03, v: 0.16 }); tone(c, { t: t, f: 600 + Math.random() * 300, d: 0.035, v: 0.04 }); } },
    swish: function (c, P) { noise(c, { ft: 'bandpass', f: 2600, f2: 5200, q: 0.7, d: 0.13, v: 0.09, a: 0.025 }); },
    flip: function (c, P, a) { var dur = (a.d || 1500) / 1000, n = lite() ? 4 : 8; INS.bell(c, 2350, 0, 0.09, 0.2); for (var i = 1; i < n; i++) { var k = i / n, t = dur * (1 - Math.pow(1 - k, 0.55)); tone(c, { t: t, f: 1900 + (i % 2) * 260, d: 0.06, v: 0.035, a: 0.002 }); } },
    pop: function (c, P) { tone(c, { f: P.r * 0.62, f2: P.r, d: 0.12, v: 0.18, a: 0.004 }); },
    gem: function (c, P, a) { var k = Math.max(0, (a.k || 1) - 1), f = note(P, PENTA[k % PENTA.length] + (k >= PENTA.length ? 12 : 0)); INS.glass(c, f, 0, 0.16, 0.4); if (!lite()) tone(c, { t: 0.04, f: f * 2, d: 0.2, v: 0.04 }); },
    pump: function (c, P, a) { var k = Math.min(12, a.k || 1); noise(c, { f: 500 + k * 30, f2: 1000 + k * 60, q: 1.2, d: 0.2, v: 0.1, a: 0.05 }); tone(c, { f: 200 + k * 14, f2: 250 + k * 18, d: 0.16, v: 0.08, a: 0.03 }); },
    kick: function (c, P) { tone(c, { f: 130, f2: 55, d: 0.16, v: 0.45, a: 0.002 }); noise(c, { ft: 'lowpass', f: 1300, d: 0.05, v: 0.2 }); noise(c, { t: 0.04, f: 900, f2: 2600, q: 0.8, d: 0.25, v: 0.06, a: 0.04 }); },
    bell2: function (c, P) { INS.bell(c, P.r * 1.5, 0, 0.1, 0.35); INS.bell(c, P.r * 1.5, 0.2, 0.1, 0.45); },
    gallop: function (c, P) { [0, 0.085, 0.17].forEach(function (t, i) { tone(c, { t: t, f: 120 - i * 10, f2: 75, d: 0.07, v: 0.2, a: 0.002 }); noise(c, { t: t, ft: 'lowpass', f: 500, d: 0.04, v: 0.1 }); }); },
    zoom: function (c, P) { noise(c, { f: 300, f2: 1100, q: 1, d: 0.32, v: 0.08, a: 0.08 }); tone(c, { f: 110, f2: 210, d: 0.3, v: 0.06, type: 'sawtooth', lp: 480, a: 0.06 }); },
    ding: function (c, P, a) { var k = a.k || 0; INS.glass(c, note(P, PENTA[k % 5] + 12), 0, 0.09, 0.3); },
    shot: function (c, P) { tone(c, { f: 1150, f2: 300, d: 0.13, v: 0.08, type: 'triangle', a: 0.003 }); noise(c, { t: 0.1, ft: 'lowpass', f: 700, d: 0.25, v: 0.1, a: 0.01 }); },
    jump: function (c, P) { tone(c, { f: P.r * 0.6, f2: P.r * 1.25, d: 0.11, v: 0.12, a: 0.004 }); },
    flap: function (c, P) { noise(c, { f: 700, f2: 1600, q: 1, d: 0.11, v: 0.09, a: 0.02 }); tone(c, { f: P.r * 0.8, f2: P.r, d: 0.07, v: 0.04 }); },
    throwit: function (c, P) { noise(c, { f: 1100, f2: 3200, q: 1, d: 0.15, v: 0.09, a: 0.025 }); },
    tok: function (c, P) { INS.marimba(c, P.r * 0.75, 0, 0.16, 0.2); },
    pew: function (c, P) { tone(c, { f: 1050, f2: 420, d: 0.09, v: 0.07, type: 'triangle', a: 0.002 }); },
    blip: function (c, P) { tone(c, { f: P.r * 1.5, d: 0.06, v: 0.08, a: 0.003 }); },
    coin: function (c, P) { var f = P.r * 2; tone(c, { f: f, d: 0.07, v: 0.08, a: 0.002 }); tone(c, { t: 0.06, f: f * 1.335, d: 0.16, v: 0.08, a: 0.002 }); },
    scratch: function (c, P) { noise(c, { ft: 'highpass', f: 3500, d: 0.05, v: 0.05, a: 0.01 }); },
    ball: function (c, P, a) { var k = a.k || 0; tone(c, { f: P.r * 0.5 * (1 + (k % 5) * 0.06), f2: P.r * 0.8, d: 0.09, v: 0.13, a: 0.003 }); noise(c, { f: 2500, q: 3, d: 0.02, v: 0.06 }); },
    hitball: function (c, P, a) { INS.marimba(c, note(P, PENTA[(a.k || 0) % PENTA.length] + 12), 0, 0.14, 0.3); },
    pins: function (c, P) { for (var i = 0; i < (lite() ? 3 : 7); i++) { var t = 0.02 + Math.random() * 0.22; noise(c, { t: t, f: 1500 + Math.random() * 1500, q: 4, d: 0.05, v: 0.12 }); tone(c, { t: t, f: 500 + Math.random() * 400, d: 0.06, v: 0.04 }); } },
    roll: function (c, P) { noise(c, { ft: 'lowpass', f: 300, f2: 600, d: 0.6, v: 0.1, a: 0.1 }); },
    open: function (c, P) { tone(c, { f: 260, f2: 180, d: 0.12, v: 0.15, type: 'triangle', lp: 1200 }); noise(c, { t: 0.03, f: 1800, f2: 3600, q: 0.8, d: 0.2, v: 0.06, a: 0.03 }); },
    claw: function (c, P) { noise(c, { f: 900, q: 8, d: 0.12, v: 0.06, a: 0.02 }); tone(c, { f: 220, f2: 260, d: 0.1, v: 0.05, type: 'triangle', lp: 900 }); }
  };
  var PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
  function note(P, semi) { return P.r * Math.pow(2, semi / 12); }

  /* ---------- familles de jeux : instrument de gain + effet de chaque évènement ---------- */
  var FAM = {
    wheel: { ins: 'marimba', sp: 0.09, launch: 'whoosh', tick: 'click', stop: 'thunk' },
    live: { ins: 'marimba', sp: 0.1, launch: 'chip', go: 'whoosh', tick: 'click', stop: 'thunk' },
    slots: { ins: 'bell', sp: 0.075, launch: 'lever', tick: 'reel', stop: 'clunk' },
    crash: { ins: 'synth', sp: 0.085, launch: 'chip', go: 'takeoff', tick: 'rise', rise: 'rise' },
    limbo: { ins: 'synth', sp: 0.08, launch: 'whoosh', tick: 'rise' },
    dice: { ins: 'pluck', sp: 0.08, launch: 'rattle', roll: 'rattle', stop: 'thunk' },
    cards: { ins: 'keys', sp: 0.1, launch: 'swish', tick: 'swish', card: 'swish', step: 'gem', stop: 'tok' },
    pick: { ins: 'glass', sp: 0.085, launch: 'pop', step: 'gem', reveal: 'gem' },
    balloon: { ins: 'pluck', sp: 0.08, launch: 'pop', step: 'pump' },
    coin: { ins: 'bell', sp: 0.08, launch: 'chip', flip: 'flip' },
    balls: { ins: 'marimba', sp: 0.08, launch: 'pop', tick: 'peg', ball: 'ball', step: 'hitball', stop: 'thunk' },
    scratch: { ins: 'bell', sp: 0.08, launch: 'swish', tick: 'scratch', reveal: 'gem' },
    chests: { ins: 'bell', sp: 0.09, launch: 'pop', reveal: 'open' },
    sport: { ins: 'warm', sp: 0.1, launch: 'pop', act: 'kick', step: 'gem', stop: 'thunk' },
    bowling: { ins: 'warm', sp: 0.1, launch: 'roll', stop: 'pins' },
    horses: { ins: 'warm', sp: 0.11, launch: 'chip', go: 'bell2', tick: 'gallop', stop: 'bell2' },
    cars: { ins: 'synth', sp: 0.09, launch: 'chip', go: 'zoom', tick: 'zoom', stop: 'bell2' },
    cups: { ins: 'marimba', sp: 0.09, launch: 'swish', tick: 'tok', reveal: 'open' },
    show: { ins: 'keys', sp: 0.1, launch: 'chip', go: 'bell2', tick: 'ding', shot: 'shot', stop: 'bell2' },
    fleet: { ins: 'synth', sp: 0.09, launch: 'chip', go: 'bell2', tick: 'shot', stop: 'bell2' },
    claw: { ins: 'pluck', sp: 0.09, launch: 'chip', go: 'bell2', tick: 'claw', stop: 'bell2' },
    run: { ins: 'pluck', sp: 0.075, launch: 'pop', act: 'jump', hit: 'coin' },
    fly: { ins: 'synth', sp: 0.08, launch: 'pop', act: 'flap', hit: 'coin' },
    throwg: { ins: 'marimba', sp: 0.08, launch: 'pop', act: 'throwit', hit: 'tok' },
    build: { ins: 'marimba', sp: 0.085, launch: 'pop', act: 'tok', hit: 'blip' },
    shoot: { ins: 'synth', sp: 0.08, launch: 'pop', act: 'pew', hit: 'blip' },
    arcade: { ins: 'pluck', sp: 0.075, launch: 'pop', act: 'blip', hit: 'coin' }
  };
  var DEF = { launch: 'pop', go: 'whoosh', tick: 'click', stop: 'thunk', step: 'gem', act: 'blip', hit: 'coin', card: 'swish', roll: 'rattle',
    flip: 'flip', rise: 'rise', ball: 'ball', chip: 'chip', shot: 'shot', reveal: 'gem', kick: 'kick', pins: 'pins', open: 'open' };
  var MAP = {
    wheel: 'wheel', wheel2: 'wheel', miniroul: 'wheel', colorpred: 'wheel',
    roulette: 'live', cryptox: 'live', planets: 'live',
    slots: 'slots', candy: 'slots', gatesgold: 'slots', fruitparty: 'slots', bookstars: 'slots', pharaoh: 'slots', spacegems: 'slots', wildwest: 'slots',
    aztec: 'slots', ocean: 'slots', dragonf: 'slots', panda: 'slots', clover: 'slots', cosmic7: 'slots', diamond: 'slots', jungle: 'slots',
    crash: 'crash', jet: 'crash', rocket: 'crash', limbo: 'limbo',
    dice: 'dice', sicbo: 'dice', luckydice: 'dice',
    dragon: 'cards', baccarat: 'cards', andar: 'cards', highcard: 'cards', reddog: 'cards', teenpatti: 'cards', vpoker: 'cards', war: 'cards', hilo: 'cards',
    mines: 'pick', tower: 'pick', apple: 'pick', balloon: 'balloon', coin: 'coin', rps: 'cups',
    lotto: 'balls', keno: 'balls', keno80: 'balls', plinko: 'balls', plinko2: 'balls', gemcount: 'show',
    scratch: 'scratch', chests: 'chests', penalty: 'sport', goal: 'sport', darts: 'throwg', colors: 'wheel', bowling: 'bowling',
    horses: 'horses', race: 'cars', catwalk: 'show', fleets: 'fleet', claw: 'claw', cups: 'cups', thimbles: 'cups',
    hamster: 'run', highway: 'run', jungledash: 'run', metrodash: 'run', spacerun: 'run', princess: 'run', chicken: 'run',
    flappyrock: 'fly', dodge: 'fly', orbit: 'fly', colorjump: 'fly', helixdrop: 'fly',
    knifehit: 'throwg', basket: 'throwg', archer: 'throwg', dartspro: 'throwg', slicer: 'throwg',
    stack: 'build', starbridge: 'build', cupcake: 'build',
    airstrike: 'shoot', zombiesiege: 'shoot', brickbreak: 'arcade', neonsnake: 'arcade'
  };
  // casb (round 6) : familles des jeux de tables, cartes, dés et hasard d'arcade
  Object.assign(MAP, { blackjack: 'cards', tcpoker: 'cards', holdem: 'cards', niuniu: 'cards', acerace: 'cards', trente: 'cards', clocksol: 'cards',
    yatzy: 'dice', crownanchor: 'dice', derby: 'dice', ceelo: 'dice', shipcrew: 'dice', dblroul: 'wheel', twinwheel: 'wheel', twoup: 'coin', fantan: 'cups',
    pachinko: 'balls', skeeball: 'balls', amida: 'pick', ducks: 'cups', dreidel: 'wheel', oracle: 'show', rpsduel: 'cups', cometqueen: 'crash' });
  /* ---- casa (round 6) : 12 machines à sous + 12 jeux instantanés (js/games/casa1-3.js) ---- */
  Object.assign(MAP, { baccaratlive: 'cards', andarlive: 'cards', teenpattilive: 'cards', pokerlive: 'cards', redblacklive: 'cards', lucky7live: 'cards', bustlive: 'cards', diceduellive: 'dice', peryalive: 'dice', bingolive: 'balls', lotto649live: 'balls', megaballlive: 'balls' }); // 2026-10-21 : live4
  Object.assign(MAP, { scarab: 'slots', kraken: 'slots', donut: 'slots', cherrybar: 'slots', ufo: 'slots', koi: 'slots', goldtrain: 'slots', viking: 'slots',
    safari: 'slots', rubymine: 'slots', pumpkin: 'slots', medusa: 'slots', scratchwin: 'scratch', pickbox: 'chests', ladder: 'pick', hilorun: 'cards',
    envelope: 'chests', treasure: 'pick', flip21: 'cards', popdarts: 'throwg', egghunt: 'pick', shells: 'cups', colorwheel: 'wheel', luckyten: 'balls' });
  /* ---- fin casa ---- */
  /* ---- casc (round 7) : 12 machines à sous + 12 jeux instantanés (js/games/casc1-3.js) ---- */
  Object.assign(MAP, { samurai: 'slots', mermaid: 'slots', carnival: 'slots', jazzclub: 'slots', oasis: 'slots', arctic: 'slots', steampunk: 'slots', cybercity: 'slots',
    fairy: 'slots', dinopark: 'slots', sushibar: 'slots', disco: 'slots', potion: 'pick', robobox: 'sport', bottleflip: 'throwg', tarot: 'cards',
    curling: 'sport', lantern: 'show', cargodrop: 'claw', gemfusion: 'pick', mahjong: 'cards', stoneskip: 'throwg', meteor: 'balls', defuse: 'show' });
  /* ---- casc lots 1-3 (rounds 8-10) : 18 machines à sous de plus ---- */
  Object.assign(MAP, { westgold: 'slots', piratecove: 'slots', shamrock: 'slots', candypop: 'slots', olympus: 'slots', vegasneon: 'slots',
    phoenix: 'slots', buffalo: 'slots', joker: 'slots', bookgold: 'slots', lotus: 'slots', inferno: 'slots',
    aztecsun: 'slots', dragongold: 'slots', fruitburst: 'slots', horuseye: 'slots', cosmicgems: 'slots', savanna: 'slots',
    valhalla: 'slots', tigergold: 'slots', honeypot: 'slots', piggybank: 'slots', atlantis: 'slots', wizard: 'slots',
    royalcrown: 'slots', luckycat: 'slots', wolfmoon: 'slots', vampire: 'slots', peacock: 'slots', knight: 'slots',
    tikigods: 'slots', icequeen: 'slots', caishen: 'slots', luchador: 'slots', fiesta: 'slots', genie: 'slots' });
  /* ---- fin casc ---- */
  /* v2850 — round 6 « Tu contrôles » (js/games/skill6.js, skill7.js, skill8.js) : famille de sons de chaque jeu */
  Object.assign(MAP, { blockfall: 'build', merge2048: 'build', mazechomp: 'arcade', bubblepop: 'arcade', gemswap: 'arcade', memoflip: 'build', echopads: 'arcade', pianokeys: 'build',
    tankbattle: 'shoot', sniper: 'shoot', gunship: 'shoot', dogfight: 'shoot',
    trenchdef: 'shoot', commando: 'run', alienwave: 'shoot', cityshield: 'shoot', neonpong: 'arcade', meteorblast: 'shoot', skyhopper: 'fly', fruitcatch: 'arcade',
    beattap: 'arcade', ropeswing: 'fly', minigolf: 'throwg', skislalom: 'run' });
  /* v3019 : 16 jeux en direct live5 */
  Object.assign(MAP, { dogracelive: 'horses', camelracelive: 'horses', snailracelive: 'show', chickenracelive: 'horses', monsterlive: 'cars',
    boatracelive: 'cars', spaceracelive: 'cars', penaltylive: 'sport', basketlive: 'sport', boxinglive: 'sport', tennislive: 'sport',
    cricketlive: 'sport', archerylive: 'throwg', fishinglive: 'show', balloonlive: 'balloon', volcanolive: 'crash' });
  /* v3013 : 12 courses (skill9) */
  Object.assign(MAP, { motowheelie: 'run', driftking: 'run', horsejump: 'run', jetskirace: 'run', kartdash: 'run', desertrally: 'run',
    surfrider: 'fly', penguinslide: 'fly', skatetricks: 'fly', snowjump: 'fly', rooftopninja: 'fly', lavaescape: 'fly' });
  /* ---------- v2850 : 12 jeux en direct live3 (bloc à part) ---------- */
  Object.assign(MAP, { dtlive: 'cards', hilolive: 'cards', sicbolive: 'dice', kenolive: 'balls', lucky10: 'balls', moneywheel: 'wheel', coinlive: 'coin',
    pegdrop: 'balls', football: 'sport', bullseye: 'throwg', ladderlive: 'cups', moonshot: 'crash' });
  // notes de départ (do5, ré5, mi5, fa5, sol5, la4, si4…) : chaque jeu tire la sienne, son motif et son tempo
  var ROOTS = [3, 5, 7, 8, 10, 0, 2, -2, 1];
  var PATS = [[0, 4, 7, 12], [0, 2, 4, 7, 12], [4, 7, 12, 16], [0, 7, 12, 16], [7, 9, 12, 16], [0, 4, 9, 12], [0, 4, 7, 9, 12], [2, 4, 7, 14]];
  function hash(s) { var h = 2166136261; s = String(s || ''); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  var TH = {};
  function theme(k) {
    k = k || cur || 'casino';
    if (TH[k]) return TH[k];
    var h = hash(k), fam = MAP[k] || ['pick', 'wheel', 'cards', 'balls'][h % 4], F = FAM[fam];
    var P = { k: k, h: h, fam: fam, F: F, r: 440 * Math.pow(2, ROOTS[h % ROOTS.length] / 12), pat: PATS[(h >>> 4) % PATS.length], sp: F.sp * (0.92 + ((h >>> 9) % 5) * 0.04) };
    TH[k] = P;
    return P;
  }
  var GAP = { click: 38, reel: 55, peg: 30, scratch: 70, tick: 38, swish: 45, gallop: 260, zoom: 200, tok: 60, coin: 60, blip: 50, pew: 50, jump: 70, flap: 60, throwit: 70, claw: 120, ding: 80, ball: 40, gem: 40 };
  function gate(name) {
    var now = performance.now(), g = (GAP[name] || 25) * (lite() ? 1.6 : 1);
    if (last[name] && now - last[name] < g) return false;
    last[name] = now; return true;
  }
  function note2log(e, k, n) { LOG.push({ e: e, k: k, n: n, t: Math.round(performance.now()) }); if (LOG.length > 400) LOG.splice(0, 100); }
  function casinoOpen() { var m = document.getElementById('casinoModal'); return !m || m.classList.contains('active'); }

  function play(ev, a, k) {
    a = a || {};
    var c = ready(); if (!c || !casinoOpen()) return false;
    var P = theme(k), name = a.as || (ev === 'crash' && CRASH_KEY[P.k]) || P.F[ev] || DEF[ev] || ev, fn = R[name];
    if (!fn) return false;
    if (!gate(name)) return false;
    var prio = ev === 'stop' || ev === 'launch' || ev === 'go';
    if (!room(prio ? 2 : 3, prio)) return false;
    try { fn(c, P, a); } catch (e) { return false; }
    note2log(ev, P.k, name);
    return true;
  }
  // gain : petite mélodie propre au jeu ; gros gain (×5) : pluie de pièces ; très gros (×25) : étincelles + accord
  function win(ratio, k) {
    var c = ready(); if (!c) return false;
    var P = theme(k), ins0 = INS[P.F.ins] || INS.bell, sp = P.sp, pat = P.pat;
    // v2851 : juste après le « cha-ching » d'un encaissement, la mélodie part un peu plus tard (pas de bouillie)
    var ofs = last.cashout && performance.now() - last.cashout < 400 ? 0.16 : 0, ins = ofs ? function (c1, f, t, v, d) { ins0(c1, f, t + ofs, v, d); } : ins0;
    ratio = Number(ratio) || 0;
    if (ratio < 1.01) { // petit retour (×0,5, égalité) : deux notes discrètes
      ins(c, note(P, pat[0]), 0, 0.12, 0.25); ins(c, note(P, pat[1]), sp, 0.12, 0.4);
      note2log('win', P.k, 'small'); return true;
    }
    for (var i = 0; i < pat.length; i++) { var lastN = i === pat.length - 1; ins(c, note(P, pat[i]), i * sp, lastN ? 0.2 : 0.17, lastN ? 0.9 : 0.32); }
    var end = pat.length * sp, lvl = 'win';
    if (ratio >= 5) {
      lvl = 'big';
      var n = lite() ? 5 : 12;
      for (var j = 0; j < n; j++) tone(c, { t: end * 0.5 + Math.random() * 0.9, f: 1900 + Math.random() * 2300, d: 0.2, v: 0.03 + Math.random() * 0.025, a: 0.002 });
      ins(c, note(P, pat[0] - 12), end, 0.1, 0.9);
    }
    if (ratio >= 25) {
      lvl = 'jackpot';
      var m = lite() ? 4 : 8;
      for (var q = 0; q < m; q++) INS.glass(c, note(P, 24 + PENTA[q % 5] + (q >= 5 ? 12 : 0)), end + 0.25 + q * 0.045, 0.05, 0.3);
      var t2 = end + 0.25 + m * 0.045 + 0.08;
      [0, 4, 7, 12].forEach(function (s) { ins(c, note(P, s), t2, 0.08, 1.4); });
    }
    note2log('win', P.k, lvl);
    return true;
  }
  var vibN = 0;
  function lose() {
    if (!isOn() || document.hidden) return false;
    try { if (navigator.vibrate) { navigator.vibrate(25); vibN++; } } catch (e) { /* ignore */ }
    // v2851 (propriétaire : « quand il perd on va sentir ») : petit motif d'échec, doux et bas (jamais agressif)
    var c = ready(), st = false;
    if (c && casinoOpen()) { try { R.fail(c, theme(cur), {}); st = true; } catch (e) { st = false; } }
    note2log('lose', cur, st ? 'sting' : 'vib');
    return true;
  }

  /* =====================================================================================================================
     v2851 — AMBIANCE DE PARTIE + BRUITAGES D'ACTION (propriétaire : « les jeux n'ont pas de vrai son, on ne sent pas
     l'action » ; « quand il perd on va sentir »). Toujours 100 % synthétisé, aucun fichier.
     1) AMBIANCE (« bed ») pendant qu'une partie tourne : boucle douce propre au thème du jeu, qui monte avec le
        multiplicateur / le suspense (coureurs : rythme + pas qui accélèrent ; avions/fusées : moteur dont la note monte ;
        guerre / zombies : tambours tendus, bataille au loin, grognements ; course : moteurs + foule ; machines à sous :
        rouleaux qui tournent ; tables : salle de casino feutrée ; live : pouls de suspense pendant le tirage).
        ≤ 3 sons continus (oscillateur, souffle en boucle, LFO) + des petites frappes programmées → ≤ 4 voix ; nœuds
        réutilisés pendant la partie, une petite horloge (100 ms) seulement quand une ambiance existe ; rien quand l'onglet
        est caché, le son coupé ou le casino fermé ; mode « lite » (vieux Android) : 2 sons continus, frappes allégées.
     2) BRUITAGES : boom (explosion), engine (moteur qui rugit), takeoff, gun, blast (cible touchée), zombie, bump (obstacle),
        footstep, jump, whoosh, coin, cashout (« cha-ching »), fail (perte), near (frôlé), cd (compte à rebours), crowd.
     API (gardez ces noms) :
       D6.Sfx.amb(jeuOuThème, true|false, intensité 0..1) — démarre / met à jour / arrête l'ambiance (appel à chaque image
         possible : une mise à jour ne coûte qu'une affectation). Thèmes : engine jet rocket run arcade war zombie race horses
         reel table suspense sport.
       D6.Sfx.play('boom' | 'gun' | 'hit' | 'zombie' | 'step' | 'jump' | 'whoosh' | 'coin' | 'cashout' | 'fail' | 'tick' |
         'reel' | 'crowd' | 'engine' | 'takeoff' | 'bump' | 'near' …, options, clé du jeu)
       D6.Sfx.bed() → état de l'ambiance (tests). Le kit du casino (js/casino.js) branche tout ça au début / à la fin des
       parties ; les jeux n'ajoutent qu'une ligne quand il faut (moteur de l'avion, tirage live…). */
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  // une voix « parlée » (grognement, moteur) : oscillateur → passe-bande
  function voc(c, o) {
    var t = c.currentTime + (o.t || 0), d = o.d || 0.5, osc = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
    osc.type = o.type || 'sawtooth'; osc.frequency.setValueAtTime(o.f, t); if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + d);
    f.type = o.ft || 'bandpass'; f.frequency.value = o.bp || 600; f.Q.value = o.q || 3;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(o.v || 0.05, t + (o.a || 0.08)); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    osc.connect(f); f.connect(g); g.connect(bus(c)); osc.start(t); osc.stop(t + d + 0.05); track(osc);
  }
  var R2 = {
    // grosse explosion (avion / fusée / mine) : coup sourd + souffle qui s'éteint + débris
    boom: function (c, P, a) {
      var s = a.s || 1, L = lite();
      tone(c, { f: 92, f2: 30, d: 1.05, v: 0.5 * s, a: 0.004 });
      noise(c, { ft: 'lowpass', f: 1700, f2: 100, d: 1.35, v: 0.36 * s, a: 0.003 });
      if (!L) { noise(c, { t: 0.01, f: 2400, f2: 500, q: 0.8, d: 0.35, v: 0.12 * s }); for (var i = 0; i < 4; i++) noise(c, { t: 0.18 + Math.random() * 0.6, f: 900 + Math.random() * 1500, q: 3, d: 0.04, v: 0.05 * s }); }
    },
    blast: function (c, P, a) { var s = a.s || 1; tone(c, { f: 120, f2: 42, d: 0.28, v: 0.26 * s, a: 0.003 }); noise(c, { ft: 'lowpass', f: 1300, f2: 180, d: 0.38, v: 0.2 * s, a: 0.002 }); },
    gun: function (c, P) { noise(c, { f: 1900, f2: 700, q: 0.9, d: 0.07, v: 0.2, a: 0.001 }); tone(c, { f: 150, f2: 55, d: 0.1, v: 0.22, a: 0.001 }); if (!lite()) noise(c, { t: 0.04, ft: 'lowpass', f: 600, d: 0.22, v: 0.05, a: 0.01 }); },
    zombie: function (c, P) { voc(c, { f: 150 + Math.random() * 30, f2: 68, d: 0.55, bp: 520, q: 4, v: 0.1 }); noise(c, { ft: 'lowpass', f: 650, d: 0.14, v: 0.16 }); },
    groan: function (c, P, a) { voc(c, { f: 105 + Math.random() * 40, f2: 72, d: 0.95, bp: 480 + Math.random() * 160, q: 5, v: 0.06 * (a.v || 1), a: 0.25 }); },
    bump: function (c, P) { tone(c, { f: 190, f2: 58, d: 0.24, v: 0.36, a: 0.002 }); noise(c, { ft: 'lowpass', f: 900, d: 0.11, v: 0.22 }); tone(c, { t: 0.03, f: 880, f2: 380, d: 0.14, v: 0.04, type: 'triangle', a: 0.003 }); },
    footstep: function (c, P, a) { var s = a.v || 1, o = a.t || 0; noise(c, { t: o, ft: 'lowpass', f: 380 + (a.alt ? 60 : 0), d: 0.055, v: 0.08 * s }); tone(c, { t: o, f: a.alt ? 96 : 84, f2: 58, d: 0.06, v: 0.08 * s, a: 0.002 }); },
    jump: function (c, P) { tone(c, { f: P.r * 0.6, f2: P.r * 1.25, d: 0.11, v: 0.12, a: 0.004 }); noise(c, { f: 600, f2: 1800, q: 1, d: 0.12, v: 0.05, a: 0.02 }); },
    engine: function (c, P) { voc(c, { f: 70, f2: 190, d: 0.7, ft: 'lowpass', bp: 900, q: 1, v: 0.09, a: 0.06 }); noise(c, { ft: 'lowpass', f: 300, f2: 1400, d: 0.7, v: 0.07, a: 0.1 }); },
    cashout: function (c, P) { // « cha-ching » : tiroir-caisse + deux clochettes + pièces
      noise(c, { ft: 'highpass', f: 3200, d: 0.07, v: 0.1, a: 0.002 });
      INS.bell(c, 2093, 0.04, 0.09, 0.32); INS.bell(c, 2637, 0.12, 0.09, 0.5);
      if (!lite()) for (var i = 0; i < 4; i++) tone(c, { t: 0.18 + i * 0.05, f: 3000 + Math.random() * 1500, d: 0.08, v: 0.025, a: 0.002 });
      last.cashout = performance.now();
    },
    // perte : deux notes qui descendent, feutrées et basses (on sent la perte, sans agresser)
    fail: function (c, P) {
      var f = P.r * 0.5;
      tone(c, { f: f, d: 0.22, v: 0.09, type: 'triangle', lp: 1100, a: 0.01 });
      tone(c, { t: 0.17, f: f * 0.84, f2: f * 0.79, d: 0.5, v: 0.09, type: 'triangle', lp: 900, a: 0.012 });
      tone(c, { t: 0.17, f: f * 0.42, d: 0.45, v: 0.05, a: 0.02 });
    },
    near: function (c, P) { tone(c, { f: 220, d: 0.6, v: 0.05, a: 0.2 }); tone(c, { f: 233, d: 0.6, v: 0.04, a: 0.2 }); tone(c, { f: 70, f2: 45, d: 0.12, v: 0.18 }); tone(c, { t: 0.2, f: 70, f2: 45, d: 0.12, v: 0.12 }); },
    cd: function (c, P, a) { tone(c, { f: a.last ? 1568 : 1046, d: a.last ? 0.16 : 0.06, v: 0.07, a: 0.002 }); },
    crowd: function (c, P, a) { var s = a.v || 1; noise(c, { f: 1100, f2: 1500, q: 0.5, d: 1.5, v: 0.09 * s, a: 0.3 }); if (!lite()) noise(c, { t: 0.1, f: 2600, q: 0.8, d: 1.1, v: 0.03 * s, a: 0.3 }); }
  };
  Object.keys(R2).forEach(function (n) { R[n] = R2[n]; });
  GAP.footstep = 60; GAP.gun = 70; GAP.zombie = 90; GAP.blast = 70; GAP.bump = 200; GAP.boom = 300; GAP.cashout = 250; GAP.fail = 400; GAP.crowd = 600; GAP.engine = 300; GAP.cd = 300;
  // familles : le geste et l'objet touché ont un vrai bruitage ; « crash » = l'obstacle / la fin de la partie
  FAM.war = { ins: 'synth', sp: 0.08, launch: 'pop', act: 'gun', hit: 'blast', crash: 'boom' };
  FAM.zombie = { ins: 'synth', sp: 0.08, launch: 'pop', act: 'gun', hit: 'zombie', crash: 'bump' };
  MAP.airstrike = 'war'; MAP.zombiesiege = 'zombie';
  FAM.run.step = 'footstep'; FAM.run.act = 'jump'; FAM.run.crash = 'bump';
  FAM.fly.crash = 'boom'; FAM.build.crash = 'bump'; FAM.throwg.crash = 'bump'; FAM.arcade.crash = 'bump'; FAM.shoot.crash = 'boom'; FAM.crash.crash = 'boom';
  DEF.crash = 'bump'; DEF.near = 'near'; DEF.cashout = 'cashout'; DEF.fail = 'fail';
  var CRASH_KEY = { flappyrock: 'boom', dodge: 'boom', orbit: 'bump', mines: 'blast', balloon: 'blast', stack: 'bump' };

  /* ---------- ambiances : réglages en fonction de l'intensité i (0 → 1) ---------- */
  function fs(f) { return typeof f === 'function' ? f : function () { return f; }; }
  var BEDS = {
    engine: { vol: 1, start: 'takeoff', d: { type: 'sawtooth', f: function (i) { return 50 + 78 * i; }, lp: function (i) { return 260 + 950 * i; }, v: function (i) { return 0.06 + 0.035 * i; } },
      d2: { type: 'triangle', mul: 2.004, v: 0.022 }, n: { ft: 'lowpass', f: function (i) { return 260 + 1300 * i; }, q: 0.7, v: function (i) { return 0.03 + 0.05 * i; } },
      lfo: { f: function (i) { return 9 + 8 * i; }, to: 'dg', depth: 0.35 } },
    jet: { vol: 1, start: 'takeoff', d: { type: 'sawtooth', f: function (i) { return 70 + 110 * i; }, lp: function (i) { return 400 + 1500 * i; }, v: function (i) { return 0.05 + 0.03 * i; } },
      d2: { type: 'triangle', mul: 4.01, v: 0.011 }, n: { ft: 'bandpass', f: function (i) { return 800 + 1700 * i; }, q: 0.8, v: function (i) { return 0.03 + 0.04 * i; } },
      lfo: { f: function (i) { return 5 + 4 * i; }, to: 'dg', depth: 0.2 } },
    rocket: { vol: 1, start: 'takeoff', d: { type: 'sawtooth', f: function (i) { return 40 + 58 * i; }, lp: function (i) { return 210 + 700 * i; }, v: function (i) { return 0.05 + 0.03 * i; } },
      n: { ft: 'lowpass', f: function (i) { return 420 + 1800 * i; }, q: 0.6, v: function (i) { return 0.05 + 0.065 * i; } },
      lfo: { f: function (i) { return 12 + 10 * i; }, to: 'ng', depth: 0.3 } },
    run: { vol: 1, start: 'whoosh', d: { type: 'triangle', f: function (i, P) { return P.r / 8; }, lp: 480, v: 0.028 },
      n: { ft: 'highpass', f: 3200, q: 0.5, v: function (i) { return 0.006 + 0.014 * i; } },
      bpm: function (i) { return 112 + 58 * i; },
      beat: function (c, P, n, T, i, V) { // une croche : un pas (gauche / droite), grosse caisse au temps, charleston à contretemps, basse
        var o = T - c.currentTime;
        R.footstep(c, P, { t: o, v: 0.55 * V, alt: n % 2 });
        if (n % 4 === 0) tone(c, { t: o, f: 118, f2: 46, d: 0.13, v: 0.11 * V, a: 0.002 });
        if (n % 2 === 1 && i > 0.2) noise(c, { t: o, ft: 'highpass', f: 7000, d: 0.025, v: 0.022 * V });
        if (n % 8 === 0 && !lite()) tone(c, { t: o, f: note(P, [0, 0, 5, 7][(n >> 3) % 4] - 24), d: 0.22, v: 0.06 * V, type: 'triangle', lp: 700, a: 0.004 });
      } },
    arcade: { vol: 1, d: { type: 'sine', f: function (i, P) { return P.r / 4; }, lp: 700, v: 0.024 },
      bpm: function (i) { return 100 + 52 * i; },
      beat: function (c, P, n, T, i, V) {
        var o = T - c.currentTime;
        tone(c, { t: o, f: note(P, PENTA[(n * 3 + (n >> 3)) % 5] - 12), d: 0.13, v: 0.034 * V, type: 'triangle', lp: 1800, a: 0.003 });
        if (n % 4 === 0) tone(c, { t: o, f: 110, f2: 45, d: 0.12, v: 0.09 * V, a: 0.002 });
        if (n % 2 === 1 && i > 0.3 && !lite()) noise(c, { t: o, ft: 'highpass', f: 7500, d: 0.02, v: 0.018 * V });
      } },
    war: { vol: 1, d: { type: 'sawtooth', f: 55, lp: function (i) { return 190 + 160 * i; }, v: function (i) { return 0.04 + 0.02 * i; } },
      n: { ft: 'lowpass', f: 170, q: 0.7, v: function (i) { return 0.022 + 0.02 * i; } }, lfo: { f: 0.25, to: 'nf', depth: 60 },
      bpm: function (i) { return 92 + 40 * i; },
      beat: function (c, P, n, T, i, V) { // tambours tendus
        var o = T - c.currentTime, k = n % 8;
        if (k === 0 || k === 3 || k === 4) tone(c, { t: o, f: k === 3 ? 150 : 120, f2: 72, d: 0.22, v: 0.14 * V, a: 0.003 });
        if (k === 6) noise(c, { t: o, f: 1700, q: 0.8, d: 0.1, v: 0.06 * V });
        if (i > 0.55 && k === 7 && !lite()) noise(c, { t: o, f: 1700, q: 0.8, d: 0.07, v: 0.04 * V });
      },
      rp: [1.6, 4.2],
      rnd: function (c, P, i, V) { // bataille au loin : explosion sourde ou rafale
        if (Math.random() < 0.5) { noise(c, { ft: 'lowpass', f: 260, f2: 80, d: 0.9, v: 0.07 * V, a: 0.01 }); tone(c, { f: 70, f2: 34, d: 0.7, v: 0.07 * V, a: 0.005 }); }
        else { var m = 3 + Math.floor(Math.random() * 3); for (var j = 0; j < m; j++) noise(c, { t: j * 0.075, f: 1800 + Math.random() * 600, q: 2, d: 0.03, v: 0.028 * V }); }
      } },
    zombie: { vol: 1, d: { type: 'sawtooth', f: 46, lp: 175, v: 0.045 }, n: { ft: 'bandpass', f: 320, q: 2, v: function (i) { return 0.012 + 0.012 * i; } },
      lfo: { f: 0.15, to: 'df', depth: 3 },
      bpm: function (i) { return 76 + 46 * i; },
      beat: function (c, P, n, T, i, V) { var o = T - c.currentTime; if (n % 2 === 0) { tone(c, { t: o, f: 72, f2: 40, d: 0.14, v: 0.16 * V, a: 0.003 }); tone(c, { t: o + 0.16, f: 66, f2: 40, d: 0.12, v: 0.1 * V, a: 0.003 }); } },
      rp: [2, 5], rnd: function (c, P, i, V) { R.groan(c, P, { v: V }); } },
    race: { vol: 1, start: 'engine', d: { type: 'sawtooth', f: function (i) { return 64 + 66 * i; }, lp: function (i) { return 500 + 1000 * i; }, v: function (i) { return 0.045 + 0.02 * i; } },
      lfo: { f: 0.6, to: 'df', depth: 16 }, n: { ft: 'bandpass', f: 1000, q: 0.6, v: function (i) { return 0.02 + 0.03 * i; } },
      rp: [3, 6], rnd: function (c, P, i, V) { R.crowd(c, P, { v: 0.35 * V }); } },
    horses: { vol: 1, d: { type: 'triangle', f: function (i, P) { return P.r / 8; }, lp: 300, v: 0.02 }, n: { ft: 'bandpass', f: 1000, q: 0.6, v: function (i) { return 0.022 + 0.03 * i; } },
      bpm: function (i) { return 118 + 40 * i; },
      beat: function (c, P, n, T, i, V) { if (n % 2) return; var o = T - c.currentTime; [0, 0.07, 0.14].forEach(function (d, j) { tone(c, { t: o + d, f: 115 - j * 12, f2: 70, d: 0.06, v: 0.09 * V, a: 0.002 }); }); if (!lite()) noise(c, { t: o, ft: 'lowpass', f: 500, d: 0.05, v: 0.05 * V }); },
      rp: [4, 7], rnd: function (c, P, i, V) { R.crowd(c, P, { v: 0.4 * V }); } },
    reel: { vol: 1, d: { type: 'sawtooth', f: 36, lp: 150, v: 0.03 }, n: { ft: 'bandpass', f: 1500, q: 1.6, v: function (i) { return 0.03 + 0.015 * i; } },
      lfo: { f: 18, to: 'ng', depth: 0.3 } },
    table: { vol: 1, d: { type: 'triangle', f: function (i, P) { return P.r / 4; }, lp: 500, v: 0.012 }, n: { ft: 'lowpass', f: 420, q: 0.5, v: 0.02 },
      lfo: { f: 0.23, to: 'ng', depth: 0.4 },
      rp: [1.5, 4], rnd: function (c, P, i, V) { noise(c, { f: 4000, q: 6, d: 0.02, v: 0.02 * V }); noise(c, { t: 0.06, f: 3700, q: 6, d: 0.02, v: 0.016 * V }); } },
    suspense: { vol: 1, d: { type: 'sine', f: function (i, P) { return P.r / 4 * (1 + 0.5 * i); }, lp: function (i) { return 600 + 500 * i; }, v: function (i) { return 0.028 + 0.02 * i; } },
      d2: { type: 'sine', mul: 1.498, v: 0.011 }, n: { ft: 'bandpass', f: 2400, q: 0.7, v: function (i) { return 0.004 + 0.01 * i; } },
      bpm: function (i) { return 66 + 56 * i; },
      beat: function (c, P, n, T, i, V) { if (n % 2) return; var o = T - c.currentTime; tone(c, { t: o, f: 68, f2: 42, d: 0.13, v: 0.13 * V, a: 0.003 }); if (!lite()) tone(c, { t: o + 0.17, f: 62, f2: 40, d: 0.11, v: 0.08 * V, a: 0.003 }); } },
    sport: { vol: 1, start: 'crowd', n: { ft: 'bandpass', f: 1000, q: 0.55, v: function (i) { return 0.03 + 0.03 * i; } }, lfo: { f: 0.18, to: 'ng', depth: 0.35 },
      bpm: function () { return 96; },
      beat: function (c, P, n, T, i, V) { var k = n % 8; if ((k === 0 || k === 3) && i > 0.15) tone(c, { t: T - c.currentTime, f: 92, f2: 55, d: 0.2, v: 0.09 * V, a: 0.003 }); },
      rp: [3, 6], rnd: function (c, P, i, V) { R.crowd(c, P, { v: 0.3 * V }); } }
  };
  var BED_OF = {
    crash: 'engine', jet: 'jet', rocket: 'rocket', flappyrock: 'rocket', airstrike: 'war', zombiesiege: 'zombie', fleets: 'war',
    race: 'race', highway: 'race', horses: 'horses',
    hamster: 'run', jungledash: 'run', metrodash: 'run', spacerun: 'run', princess: 'run', chicken: 'run',
    basket: 'sport', archer: 'sport', dartspro: 'sport', penalty: 'sport', goal: 'sport', bowling: 'sport', golf: 'sport', skijump: 'sport', cricket: 'sport',
    pool: 'sport', tennis: 'sport', striker: 'sport', horseshoe: 'sport', darts: 'sport',
    cluster: 'reel', megaways: 'reel', coinlink: 'reel',
    mines: 'suspense', tower: 'suspense', apple: 'suspense', balloon: 'suspense', safe: 'suspense', fireworks: 'suspense', bingo: 'suspense', limbo: 'suspense',
    hilo: 'suspense', catwalk: 'suspense', gemcount: 'suspense', claw: 'suspense',
    pinata: 'arcade', pinball: 'arcade', moles: 'arcade', coinpush: 'table', fishing: 'table', gumball: 'table', jewelbox: 'table', domino: 'table',
    nails: 'table', daisy: 'table', bouquet: 'table', goldpan: 'table', snakes: 'table', craps: 'table', checkers: 'table', connect4: 'table'
  };
  var BED_FAM = { wheel: 'suspense', live: 'suspense', slots: 'reel', crash: 'engine', limbo: 'suspense', dice: 'table', cards: 'table', pick: 'suspense',
    balloon: 'suspense', coin: 'table', balls: 'suspense', scratch: 'table', chests: 'table', sport: 'sport', bowling: 'sport', horses: 'horses', cars: 'race',
    cups: 'table', show: 'suspense', fleet: 'war', claw: 'suspense', run: 'run', fly: 'arcade', throwg: 'arcade', build: 'arcade', shoot: 'war', arcade: 'arcade',
    war: 'war', zombie: 'zombie' };
  function bedOf(k) { return BED_OF[k] || BED_FAM[theme(k).fam] || 'table'; }

  var B = null, bedT = 0;
  function bedInfo() {
    if (!B) return null;
    var nd = B.nodes, v = nd ? ['dO', 'd2O', 'nS', 'lO'].filter(function (x) { return nd[x]; }).length : 0;
    return { key: B.key, theme: B.th, src: B.src, i: Math.round(B.iv * 100) / 100, m: B.m || null, playing: !!nd, voices: v, beats: B.n };
  }
  function bedBuild(c) {
    var S = BEDS[B.th], P = B.P, L = lite(), t = c.currentTime, i = B.iv, nd = {};
    nd.g = c.createGain(); nd.g.gain.setValueAtTime(0.0001, t); nd.g.gain.linearRampToValueAtTime(S.vol * (L ? 0.85 : 1), t + 0.45); nd.g.connect(bus(c));
    if (S.d) {
      nd.dO = c.createOscillator(); nd.dO.type = S.d.type; nd.dO.frequency.value = fs(S.d.f)(i, P);
      nd.dF = c.createBiquadFilter(); nd.dF.type = 'lowpass'; nd.dF.frequency.value = fs(S.d.lp)(i, P); nd.dF.Q.value = 0.7;
      nd.dG = c.createGain(); nd.dG.gain.value = fs(S.d.v)(i, P);
      nd.dO.connect(nd.dF); nd.dF.connect(nd.dG); nd.dG.connect(nd.g); nd.dO.start(t);
      if (S.d2 && !L) { nd.d2O = c.createOscillator(); nd.d2O.type = S.d2.type; nd.d2O.frequency.value = nd.dO.frequency.value * S.d2.mul; nd.d2G = c.createGain(); nd.d2G.gain.value = S.d2.v; nd.d2O.connect(nd.d2G); nd.d2G.connect(nd.dF); nd.d2O.start(t); }
    }
    if (S.n) {
      if (!nbuf || nbuf.sampleRate !== c.sampleRate) noise(c, { d: 0.02, v: 0.0001 }); // crée le bruit partagé
      nd.nS = c.createBufferSource(); nd.nS.buffer = nbuf; nd.nS.loop = true;
      nd.nF = c.createBiquadFilter(); nd.nF.type = S.n.ft; nd.nF.frequency.value = fs(S.n.f)(i, P); nd.nF.Q.value = S.n.q || 0.7;
      nd.nG = c.createGain(); nd.nG.gain.value = fs(S.n.v)(i, P);
      nd.nS.connect(nd.nF); nd.nF.connect(nd.nG); nd.nG.connect(nd.g); nd.nS.start(t, Math.random() * 1.5);
    }
    if (S.lfo && !L) {
      var tgt = S.lfo.to === 'dg' ? nd.dG && nd.dG.gain : S.lfo.to === 'ng' ? nd.nG && nd.nG.gain : S.lfo.to === 'nf' ? nd.nF && nd.nF.frequency : nd.dO && nd.dO.frequency;
      if (tgt) {
        nd.lO = c.createOscillator(); nd.lO.frequency.value = fs(S.lfo.f)(i, P); nd.lG = c.createGain();
        var base0 = S.lfo.to === 'dg' ? nd.dG.gain.value : S.lfo.to === 'ng' ? nd.nG.gain.value : 1;
        nd.lG.gain.value = (S.lfo.to === 'dg' || S.lfo.to === 'ng') ? base0 * S.lfo.depth : S.lfo.depth;
        nd.lO.connect(nd.lG); nd.lG.connect(tgt); nd.lO.start(t);
      }
    }
    B.nodes = nd; B.next = 0; B.rndAt = 0; B.bornA = t;
  }
  function bedKill(fade) { // arrête les sons (l'envie d'ambiance reste, sauf si bedOff)
    if (!B || !B.nodes) return;
    var nd = B.nodes; B.nodes = null;
    try {
      var c = nd.g.context, t = c.currentTime, f = Math.max(0.03, fade || 0.05);
      nd.g.gain.cancelScheduledValues(t); nd.g.gain.setValueAtTime(nd.g.gain.value, t); nd.g.gain.linearRampToValueAtTime(0.0001, t + f);
      ['dO', 'd2O', 'nS', 'lO'].forEach(function (x) { if (nd[x]) { try { nd[x].stop(t + f + 0.05); } catch (e) { /* ignore */ } } });
      setTimeout(function () { try { nd.g.disconnect(); } catch (e) { /* ignore */ } }, (f + 0.2) * 1000);
    } catch (e) { /* ignore */ }
  }
  function bedOff(fade) {
    if (!B) return;
    note2log('amb', B.key, 'off');
    bedKill(fade); B = null;
    clearInterval(bedT); bedT = 0;
  }
  function bedMute(off) { if (off) bedKill(0.05); }
  function bedSet(c, nd, S, i, P) {
    var t = c.currentTime, k = 0.25;
    if (nd.dO) { var f = fs(S.d.f)(i, P); nd.dO.frequency.setTargetAtTime(f, t, k); nd.dF.frequency.setTargetAtTime(fs(S.d.lp)(i, P), t, k); nd.dG.gain.setTargetAtTime(fs(S.d.v)(i, P), t, k); if (nd.d2O) nd.d2O.frequency.setTargetAtTime(f * S.d2.mul, t, k); }
    if (nd.nS) { nd.nF.frequency.setTargetAtTime(fs(S.n.f)(i, P), t, k); nd.nG.gain.setTargetAtTime(fs(S.n.v)(i, P), t, k); }
    if (nd.lO) nd.lO.frequency.setTargetAtTime(fs(S.lfo.f)(i, P), t, k);
  }
  function bedLoop() {
    if (!B) { clearInterval(bedT); bedT = 0; return; }
    var now = Date.now();
    if (!casinoOpen() || (cur && B.key !== cur) || (B.ttl && now > B.ttl)) { bedOff(0.5); return; } // casino fermé, autre jeu, partie oubliée
    if (!isOn() || document.hidden) { bedKill(0.05); return; } // muet / onglet caché : silence total (l'ambiance revient après)
    var c = ready(); if (!c) return; // iPhone pas encore déverrouillé
    var S = BEDS[B.th], P = B.P;
    // intensité : horloge du multiplicateur (jeux d'adresse), valeur donnée par le jeu, ou montée douce avec le temps
    var i = B.i;
    if (B.clk) { var el = now / 1000 + B.clk.off - B.clk.t0, m = Math.exp(B.clk.rate * Math.max(0, el)); B.m = Math.round(m * 100) / 100; i = clamp01(Math.log(m) / Math.log(8)); }
    else if (B.auto) i = Math.max(B.i, 1 - Math.exp(-(now - B.born) / 18000));
    B.iv += (i - B.iv) * 0.3;
    if (!B.nodes) bedBuild(c);
    var nd = B.nodes;
    if (Math.abs(B.iv - (B.ivSet || -1)) > 0.01) { B.ivSet = B.iv; try { bedSet(c, nd, S, B.iv, P); } catch (e) { /* ignore */ } }
    var V = Math.min(1, (c.currentTime - B.bornA) / 0.5) * (lite() ? 0.8 : 1);
    if (S.bpm && S.beat) {
      var stp = 30 / S.bpm(B.iv, P), ahead = c.currentTime + (lite() ? 0.3 : 0.22);
      if (B.next < c.currentTime) B.next = c.currentTime + 0.04;
      while (B.next < ahead) { if (room(2)) { try { S.beat(c, P, B.n, B.next, B.iv, V); } catch (e) { /* ignore */ } } B.n++; B.next += stp; }
    }
    if (S.rnd) {
      if (!B.rndAt) B.rndAt = c.currentTime + S.rp[0];
      else if (c.currentTime >= B.rndAt) { if (room(3)) { try { S.rnd(c, P, B.iv, V); } catch (e) { /* ignore */ } } B.rndAt = c.currentTime + (S.rp[0] + Math.random() * (S.rp[1] - S.rp[0])) * (1.25 - 0.5 * B.iv); }
    }
  }
  /* amb(jeu ou thème, on, intensité 0..1, o) — o (kit du casino) : { clk: {rate, t0, off}, ttl: ms, fresh: 1, src } */
  function amb(k, on, i, o) {
    o = o || {};
    var th = null;
    if (k && BEDS[k] && (k !== cur || (!MAP[k] && !BED_OF[k]))) { th = k; k = cur || k; } // un nom de thème (« war », « race »…) sauf si c'est le jeu ouvert
    k = k || cur;
    if (!on) { if (B && (!k || k === '*' || B.key === k)) bedOff(o.fade == null ? 0.6 : o.fade); return false; }
    if (!k) return false;
    var num = typeof i === 'number' && isFinite(i), now = Date.now();
    if (B && B.key === k && (!th || B.th === th)) {
      if (num) { B.i = clamp01(i); if (!o.keepAuto) B.auto = false; }
      if (o.clk) B.clk = o.clk;
      B.ttl = o.ttl ? now + o.ttl : B.ttl;
      return true;
    }
    if (B) bedOff(0.25);
    th = th || bedOf(k);
    B = { key: k, th: th, P: theme(k), src: o.src || 'game', i: num ? clamp01(i) : 0, iv: num ? clamp01(i) : 0, auto: !num || !!o.keepAuto, clk: o.clk || null, born: now,
      ttl: o.ttl ? now + o.ttl : 0, nodes: null, n: 0, next: 0, rndAt: 0, bornA: 0 };
    note2log('amb', k, th);
    if (o.fresh && BEDS[th].start) play(BEDS[th].start, null, k);
    clearInterval(bedT); bedT = setInterval(bedLoop, lite() ? 150 : 100);
    bedLoop();
    return true;
  }
  // 2026-10-21 (propriétaire : « le rond rouge quand on sort de l'appli ») : site caché / quitté → moteur de son mis en veille
  // (pour tout le monde) ; il repart au retour (premier toucher ou son suivant).
  function sleepNow() { var c = window.__oroAC; if (!c || c.state !== 'running') return; try { c.__oroIdle = true; var pr = c.suspend(); if (pr && pr.catch) pr.catch(function () { /* ignore */ }); } catch (e) { /* ignore */ } }
  document.addEventListener('visibilitychange', function () { if (document.hidden) { bedKill(0.03); setTimeout(function () { if (document.hidden) sleepNow(); }, 60); } else if (B) bedLoop(); });
  window.addEventListener('pagehide', function () { bedKill(0.03); sleepNow(); });
  window.addEventListener('blur', function () { setTimeout(function () { if (document.hidden) sleepNow(); }, 300); });

  /* ---------- bouton muet ---------- */
  var LBL = { en: 'Sound', fr: 'Son', es: 'Sonido', pt: 'Som', ar: 'الصوت', tr: 'Ses', vi: 'Âm thanh', id: 'Suara', ru: 'Звук', de: 'Ton', hi: 'ध्वनि', zh: '声音' };
  var ICO_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="sp" d="M4 9.5h3.2L11.5 6v12l-4.3-3.5H4z"/><path class="wv" d="M15 9.2a4 4 0 0 1 0 5.6M17.6 6.8a7.4 7.4 0 0 1 0 10.4"/></svg>';
  var ICO_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="sp" d="M4 9.5h3.2L11.5 6v12l-4.3-3.5H4z"/><path class="wv" d="M15.5 9.5l5 5M20.5 9.5l-5 5"/></svg>';
  function paintBtns() {
    var l = (document.documentElement.lang || 'en').slice(0, 2), on = isOn();
    btns = btns.filter(function (b) { return b.isConnected; });
    btns.forEach(function (b) {
      var want = on ? 'on' : 'off';
      if (b.getAttribute('data-snd') !== want) { b.innerHTML = on ? ICO_ON : ICO_OFF; b.setAttribute('data-snd', want); }
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      var t = LBL[l] || LBL.en; if (b.getAttribute('aria-label') !== t) { b.setAttribute('aria-label', t); b.title = t; }
    });
  }
  function set(on) {
    memOn = !!on;
    try { localStorage.setItem('oro_sfx', on ? 'on' : 'off'); } catch (e) { /* ignore */ }
    if (out) { try { out.gain.cancelScheduledValues(out.context.currentTime); out.gain.setValueAtTime(on ? base() : 0, out.context.currentTime); } catch (e) { /* ignore */ } }
    paintBtns();
    bedMute(!on);
    if (on) { revive(); var c = ensure(); setTimeout(function () { var c2 = ready(); if (c2) { INS.glass(c2, 784, 0, 0.09, 0.25); INS.glass(c2, 1047, 0.08, 0.08, 0.35); note2log('ui', '', 'on'); } }, 30); }
  }
  function button(b) {
    if (!b || b._sfx) return b;
    b._sfx = 1; b.type = 'button'; b.className = (b.className ? b.className + ' ' : '') + 'cs-snd';
    b.addEventListener('click', function (e) { e.stopPropagation(); set(!isOn()); });
    btns.push(b); paintBtns();
    return b;
  }
  document.addEventListener('oro:lang', paintBtns);
  if (window.MutationObserver) new MutationObserver(paintBtns).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  // déverrouillage au premier geste (iPhone : un son muet joué pendant le toucher)
  function unlock() { revive(); }
  ['pointerdown', 'touchend', 'click', 'keydown'].forEach(function (ev) { document.addEventListener(ev, unlock, { passive: true, capture: true }); });

  D6.Sfx = { play: play, win: win, lose: lose, on: isOn, set: set, button: button, theme: theme, amb: amb, bed: bedInfo,
    game: function (k) { cur = k || ''; }, log: LOG, vib: function () { return vibN; }, fam: function (k) { return theme(k).fam; } };
})(window.D6 = window.D6 || {});
