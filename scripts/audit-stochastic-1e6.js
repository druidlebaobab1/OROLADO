'use strict';

var path = require('path');
var core = require(path.join(__dirname, '..', 'js', 'engine.js'));

var PER_PROFILE = 200000;
var PAYOUT = 1.88;
var PROFILE = 'real';
var P_STAR = core.winProb(PAYOUT, PROFILE);
var PROFIT = core.profitPct(PAYOUT) / 100;
var EV_UNIT = P_STAR * PROFIT - (1 - P_STAR);
var NODE = process.versions.node;

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

function round4(n) {
  return Math.round(Number(n) * 10000) / 10000;
}

function pct(n) {
  return (100 * n).toFixed(4) + '%';
}

function usd(n) {
  var s = round2(n);
  return (s < 0 ? '-' : '') + '$' + Math.abs(s).toFixed(2);
}

function zTest(wins, n, p0) {
  var phat = wins / n;
  var se = Math.sqrt(p0 * (1 - p0) / n);
  return (phat - p0) / se;
}

function decisiveN(acc) {
  return acc.wins + acc.losses;
}

function decisiveRate(acc) {
  var d = decisiveN(acc);
  return d ? acc.wins / d : 0;
}

function zDecisive(acc, p0) {
  return zTest(acc.wins, decisiveN(acc), p0);
}

function settleOne(entry, side, durationSec) {
  return core.settle({
    entryPrice: entry,
    durationSec: durationSec,
    side: side,
    payout: PAYOUT,
    profile: PROFILE
  });
}

function pnlOf(verdict, stake) {
  if (verdict.voided) return 0;
  if (verdict.won) return round2(stake * PROFIT);
  return round2(-stake);
}

function newAcc() {
  return {
    n: 0,
    wins: 0,
    losses: 0,
    voids: 0,
    stakeSum: 0,
    pnl: 0,
    nan: 0,
    negPrice: 0,
    negStake: 0,
    negExit: 0,
    callN: 0,
    callW: 0,
    putN: 0,
    putW: 0,
    ruins: 0,
    visualWouldWin: 0,
    visualN: 0
  };
}

function record(acc, verdict, stake, side) {
  acc.n += 1;
  acc.stakeSum += stake;
  if (!(stake > 0) || !isFinite(stake)) acc.negStake += 1;
  if (!verdict || !isFinite(verdict.exitPrice)) acc.nan += 1;
  else if (verdict.exitPrice < 0) acc.negExit += 1;
  if (verdict.voided) acc.voids += 1;
  else if (verdict.won) acc.wins += 1;
  else acc.losses += 1;
  acc.pnl += pnlOf(verdict, stake);
  if (side === 'put') {
    acc.putN += 1;
    if (verdict.won) acc.putW += 1;
  } else {
    acc.callN += 1;
    if (verdict.won) acc.callW += 1;
  }
}

function profile1(n) {
  var acc = newAcc();
  var stakes = [1, 2, 3, 4, 5];
  var i;
  for (i = 0; i < n; i++) {
    var stake = stakes[i % 5];
    var side = (i & 1) ? 'put' : 'call';
    var entry = 5000 + (i % 97) * 13.37;
    var v = settleOne(entry, side, 5);
    record(acc, v, stake, side);
  }
  acc.label = 'Profil 1 — mises fixes 1$ a 5$';
  return acc;
}

function profile2(n) {
  var acc = newAcc();
  var bank0 = 100000;
  var bank = bank0;
  var base = 1;
  var stake = base;
  var maxStake = 512;
  var i;
  for (i = 0; i < n; i++) {
    if (bank < 1) {
      acc.ruins += 1;
      bank = bank0;
      stake = base;
    }
    if (stake > bank) stake = round2(bank);
    if (!(stake >= 1)) {
      acc.ruins += 1;
      bank = bank0;
      stake = base;
    }
    var side = (i % 3 === 0) ? 'put' : 'call';
    var v = settleOne(7340.8, side, 5);
    var delta = pnlOf(v, stake);
    bank = round2(bank + delta);
    record(acc, v, stake, side);
    if (v.voided) {
      /* mise rendue : on conserve l'echelon */
    } else if (v.won) {
      stake = base;
    } else {
      stake = round2(Math.min(maxStake, stake * 2));
    }
  }
  acc.bankFinal = bank;
  acc.label = 'Profil 2 — martingale pure (doublement apres perte)';
  return acc;
}

function profile3(n) {
  var acc = newAcc();
  var base = 10120.4;
  var price = base;
  var vel = 0;
  var lastSign = 'call';
  var i;
  for (i = 0; i < n; i++) {
    var shock = (Math.random() + Math.random() + Math.random() - 1.5) * 0.006 * price;
    vel = 0.78 * vel + shock;
    var next = price + vel;
    next += (base - next) * 0.012;
    if (next < base * 0.88) next = base * 0.88;
    if (next > base * 1.12) next = base * 1.12;
    if (!(next > 0) || !isFinite(next)) {
      acc.negPrice += 1;
      next = price;
      vel = 0;
    }
    var visSign = next >= price ? 'call' : 'put';
    var side = lastSign;
    var v = settleOne(price, side, 5);
    record(acc, v, 2, side);
    acc.visualN += 1;
    if (visSign === side) acc.visualWouldWin += 1;
    lastSign = visSign;
    price = next;
  }
  acc.label = 'Profil 3 — suiveur de tendance (tick visuel t-1)';
  return acc;
}

function profile4(n) {
  var acc = newAcc();
  var i;
  var burst = 0;
  for (i = 0; i < n; i++) {
    burst = (burst + 1) % 20;
    var stake = burst < 10 ? 1 : 1.5;
    var side = (Math.random() < 0.5) ? 'call' : 'put';
    var v = settleOne(13000.42, side, 5);
    record(acc, v, stake, side);
  }
  acc.label = 'Profil 4 — haute frequence (rafales)';
  return acc;
}

function profile5(n) {
  var acc = newAcc();
  var sessions = 4;
  var each = n / sessions;
  var s;
  var i;
  for (s = 0; s < sessions; s++) {
    for (i = 0; i < each; i++) {
      var side = ((s + i) & 1) ? 'put' : 'call';
      var stake = 1 + (s % 5);
      var v = settleOne(3890.2 + s * 17.5, side, 10);
      record(acc, v, stake, side);
    }
  }
  acc.sessions = sessions;
  acc.label = 'Profil 5 — multi-sessions paralleles (4 comptes)';
  return acc;
}

function expectPnl(acc) {
  return acc.stakeSum * EV_UNIT;
}

function fail(msg) {
  console.error('\nECHEC AUDIT : ' + msg);
  process.exit(1);
}

function dump(acc) {
  var wr = acc.n ? acc.wins / acc.n : 0;
  var wrD = decisiveRate(acc);
  var z = zDecisive(acc, P_STAR);
  console.log('');
  console.log(acc.label);
  console.log('  iterations     : ' + acc.n);
  console.log('  wins / losses  : ' + acc.wins + ' / ' + acc.losses + '  (voids ' + acc.voids + ')');
  console.log('  win rate brut  : ' + pct(wr));
  console.log('  win rate net   : ' + pct(wrD) + '   (p*=' + pct(P_STAR) + ', z=' + z.toFixed(3) + ')');
  console.log('  CALL win rate  : ' + (acc.callN ? pct(acc.callW / acc.callN) : 'n/a') + '  n=' + acc.callN);
  console.log('  PUT  win rate  : ' + (acc.putN ? pct(acc.putW / acc.putN) : 'n/a') + '  n=' + acc.putN);
  console.log('  volume mise    : ' + usd(acc.stakeSum));
  console.log('  PnL joueur     : ' + usd(acc.pnl));
  console.log('  esperance theo : ' + usd(expectPnl(acc)));
  console.log('  PnL maison     : ' + usd(-acc.pnl));
  console.log('  NaN / prix<0 / mise<0 / exit<0 : ' + acc.nan + ' / ' + acc.negPrice + ' / ' + acc.negStake + ' / ' + acc.negExit);
  if (acc.ruins != null && acc.label.indexOf('martingale') >= 0) {
    console.log('  ruines refill  : ' + acc.ruins);
    console.log('  bank final     : ' + usd(acc.bankFinal));
  }
  if (acc.visualN) {
    console.log('  contre-factuel visuel (si le tick t-1 prediait t) : ' + pct(acc.visualWouldWin / acc.visualN));
  }
  return z;
}

if (!core || !core.settle || !core.SEALED) fail('module stochastique introuvable');
if (!Object.isFrozen(core.SEALED)) fail('SEALED n est pas fige par Object.freeze');
if (!Object.isFrozen(core.SEALED.WIN_P_REAL)) fail('WIN_P_REAL n est pas fige');

var mem0 = process.memoryUsage();
var t0 = Date.now();
console.log('============================================================');
console.log('AUDIT STOCHASTIQUE OROLADO — 1 000 000 de paris');
console.log('Node ' + NODE + '  |  payout 1.88  |  p* reel=' + P_STAR);
console.log('EV structurelle joueur / $1 : ' + round4(EV_UNIT) + '  (maison ' + round4(-EV_UNIT) + ')');
console.log('SEALED.SIGMA=' + core.SEALED.SIGMA + '  frozen=' + Object.isFrozen(core.SEALED));
console.log('============================================================');

var a1 = profile1(PER_PROFILE);
var a2 = profile2(PER_PROFILE);
var a3 = profile3(PER_PROFILE);
var a4 = profile4(PER_PROFILE);
var a5 = profile5(PER_PROFILE);
var all = [a1, a2, a3, a4, a5];
var z1 = dump(a1);
var z2 = dump(a2);
var z3 = dump(a3);
var z4 = dump(a4);
var z5 = dump(a5);

var tot = newAcc();
var k;
for (k = 0; k < all.length; k++) {
  var a = all[k];
  tot.n += a.n;
  tot.wins += a.wins;
  tot.losses += a.losses;
  tot.voids += a.voids;
  tot.stakeSum += a.stakeSum;
  tot.pnl += a.pnl;
  tot.nan += a.nan;
  tot.negPrice += a.negPrice;
  tot.negStake += a.negStake;
  tot.negExit += a.negExit;
}
tot.label = 'TOTAL 5 profils';
dump(tot);

var mem1 = process.memoryUsage();
var ms = Date.now() - t0;
console.log('');
console.log('--- Integrite runtime ---');
console.log('  duree            : ' + ms + ' ms');
console.log('  heapUsed         : ' + (mem1.heapUsed / 1048576).toFixed(1) + ' Mo (delta ' + ((mem1.heapUsed - mem0.heapUsed) / 1048576).toFixed(1) + ' Mo)');
console.log('  rss              : ' + (mem1.rss / 1048576).toFixed(1) + ' Mo');

if (tot.n !== 1000000) fail('total iterations != 1000000 (' + tot.n + ')');
if (tot.nan || tot.negPrice || tot.negStake || tot.negExit) fail('NaN / negatif detecte');
if (tot.pnl >= 0) fail('PnL joueur global positif — esperance maison non preservee');
z1 = zDecisive(a1, P_STAR);
z2 = zDecisive(a2, P_STAR);
z3 = zDecisive(a3, P_STAR);
z4 = zDecisive(a4, P_STAR);
z5 = zDecisive(a5, P_STAR);
if (Math.abs(z1) > 4) fail('Profil 1 hors hasard structurel |z|>4');
if (Math.abs(z2) > 4) fail('Profil 2 (martingale) a biaise le taux — independance rompue');
if (Math.abs(z3) > 4) fail('Profil 3 suiveur hors p* — inertie encore exploitable');
if (Math.abs(z4) > 4) fail('Profil 4 HFT hors p*');
if (Math.abs(z5) > 4) fail('Profil 5 multi-sessions hors p*');
if (a2.pnl >= 0) fail('Martingale PnL joueur non negatif');
if (a3.visualN && (a3.visualWouldWin / a3.visualN) <= 0.54) {
  fail('Le proxy visuel n a pas d inertie — le test du suiveur n est pas discriminant');
}
var wr3 = decisiveRate(a3);
if (wr3 > 0.50) fail('Suiveur de tendance > 50% — inertie encore exploitable');

console.log('');
console.log('VERDICT : SUCCES sur 1 000 000 de paris.');
console.log('  - Esperance structurelle maison preservee (PnL joueur ' + usd(tot.pnl) + ').');
console.log('  - Martingale en echec statistique (taux ~ p*, ruines=' + a2.ruins + ', PnL ' + usd(a2.pnl) + ').');
console.log('  - Suiveur de tendance aligne sur p*=' + pct(P_STAR) + ' (observe ' + pct(wr3) + '), inertie visuelle non transmissible au reglement.');
console.log('  - Aucun NaN, prix negatif, mise negative ni plantage memoire.');
process.exit(0);
