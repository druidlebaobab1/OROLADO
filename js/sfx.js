/* v2832 — SONS DU CASINO (propriétaire : « chaque jeu a son son ; un son agréable quand on gagne, AUCUN son quand on perd
   (petite vibration), un petit bouton en haut pour couper le son »).
   Tout est SYNTHÉTISÉ ici (WebAudio : oscillateurs, bruit, enveloppes, filtres) — aucun fichier audio.
   - Un seul AudioContext pour tout le site (partagé avec les sons du trading de js/app.js : window.__oroAC),
     créé au premier toucher (iPhone : déverrouillage sur un geste).
   - Volume général doux (0,3) + compresseur léger ; nombre de voix limité ; rien quand l'onglet est caché.
   - Chaque jeu a un THÈME (famille : roue, rouleaux, avion, cartes…) + une petite mélodie de gain propre au jeu
     (note de départ, motif et tempo tirés du nom du jeu).
   - Perte : aucun son, vibration courte (Android ; l'iPhone ne vibre pas depuis un site).
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
    if (!ctx) { try { ctx = window.__oroAC || (window.__oroAC = new AC()); } catch (e) { ctx = null; } }
    return ctx;
  }
  // contexte prêt à jouer maintenant (sinon : rien, jamais de sons en retard qui sortiraient d'un coup)
  function ready() {
    if (!isOn() || document.hidden) return null;
    var c = ensure(); if (!c) return null;
    if (c.state === 'running') return c;
    if (c.state === 'suspended') {
      try { c.resume(); } catch (e) { /* ignore */ }
      var ua = navigator.userActivation;
      if (ua && ua.isActive) return c;
    }
    return null;
  }
  function base() { return lite() ? 0.26 : 0.3; }
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
    active++;
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
      var n = Math.floor(c.sampleRate * 0.8); nbuf = c.createBuffer(1, n, c.sampleRate);
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
    var P = theme(k), name = a.as || P.F[ev] || DEF[ev] || ev, fn = R[name];
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
    var P = theme(k), ins = INS[P.F.ins] || INS.bell, sp = P.sp, pat = P.pat;
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
    note2log('lose', cur, 'vib');
    return true;
  }

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
    if (on) { var c = ensure(); if (c && c.state === 'suspended') { try { c.resume(); } catch (e) { /* ignore */ } } setTimeout(function () { var c2 = ready(); if (c2) { INS.glass(c2, 784, 0, 0.09, 0.25); INS.glass(c2, 1047, 0.08, 0.08, 0.35); note2log('ui', '', 'on'); } }, 30); }
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
  var unl = false;
  function unlock() {
    if (!isOn()) return;
    var c = ensure(); if (!c) return;
    if (c.state === 'suspended') { try { c.resume(); } catch (e) { /* ignore */ } }
    if (unl) return; unl = true;
    try { var b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } catch (e) { /* ignore */ }
  }
  ['pointerdown', 'touchend', 'keydown'].forEach(function (ev) { document.addEventListener(ev, unlock, { passive: true, capture: true }); });

  D6.Sfx = { play: play, win: win, lose: lose, on: isOn, set: set, button: button, theme: theme,
    game: function (k) { cur = k || ''; }, log: LOG, vib: function () { return vibN; }, fam: function (k) { return theme(k).fam; } };
})(window.D6 = window.D6 || {});
