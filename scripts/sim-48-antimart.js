'use strict';
/**
 * Sims maison — 48 % sur cote 1.88 + anti-martingale.
 * Pas besoin de compte réel : Monte-Carlo local.
 */
var path = require('path');
var core = require(path.join(__dirname, '..', 'js', 'engine.js'));

var N = 1000000;
var PAYOUT = 1.88;
var PROFIT = core.profitPct(PAYOUT) / 100;
var P48 = core.winProb(PAYOUT, 'real');
var EV_FLAT = P48 * PROFIT - (1 - P48);

function round2(n) { return Math.round(Number(n) * 100) / 100; }
function usd(n) {
  var s = round2(n);
  return (s < 0 ? '-' : '') + '$' + Math.abs(s).toFixed(2);
}
function pct(n) { return (100 * n).toFixed(3) + '%'; }

function antiMartP(baseP, stake, lastStake, lossStreak) {
  var p = Number(baseP);
  var rising = lastStake > 0.009 && stake >= lastStake * 1.75;
  var steps = 0;
  if (lossStreak >= 1 && rising) steps = Math.min(lossStreak, 6);
  else if (lossStreak >= 3 && stake >= lastStake * 1.35) steps = Math.min(lossStreak - 1, 4);
  if (steps <= 0) return p;
  p = p * Math.pow(0.62, steps);
  return Math.max(0.10, Math.min(baseP * 0.55, p));
}

function roll(p) { return Math.random() < p; }

function runFlat(n, bank0, stake) {
  var bank = bank0;
  var wins = 0, losses = 0, ruined = 0;
  var i;
  for (i = 0; i < n; i++) {
    if (bank < stake) { ruined++; bank = bank0; }
    var won = roll(P48);
    if (won) { wins++; bank = round2(bank + stake * PROFIT); }
    else { losses++; bank = round2(bank - stake); }
  }
  return { label: 'Flat ' + stake + '$', n: n, wins: wins, losses: losses, ruined: ruined, bank: bank, pnl: round2(bank - bank0) };
}

function runMartingale(n, bank0, base, maxStake, withShield) {
  var bank = bank0;
  var stake = base;
  var lastStake = 0;
  var lossStreak = 0;
  var wins = 0, losses = 0, ruined = 0, shieldHits = 0;
  var i;
  for (i = 0; i < n; i++) {
    if (bank < base) { ruined++; bank = bank0; stake = base; lossStreak = 0; lastStake = 0; }
    if (stake > bank) stake = round2(bank);
    if (!(stake >= 1)) { ruined++; bank = bank0; stake = base; lossStreak = 0; continue; }
    var p = P48;
    if (withShield) {
      var adj = antiMartP(P48, stake, lastStake, lossStreak);
      if (adj + 0.0001 < P48) shieldHits++;
      p = adj;
    }
    var won = roll(p);
    if (won) {
      wins++;
      bank = round2(bank + stake * PROFIT);
      lastStake = stake;
      stake = base;
      lossStreak = 0;
    } else {
      losses++;
      bank = round2(bank - stake);
      lastStake = stake;
      lossStreak++;
      stake = round2(Math.min(maxStake, stake * 2));
    }
  }
  return {
    label: withShield ? 'Martingale + blindage' : 'Martingale SANS blindage',
    n: n, wins: wins, losses: losses, ruined: ruined, shieldHits: shieldHits,
    bank: bank, pnl: round2(bank - bank0)
  };
}

function runRandom(n, bank0) {
  var bank = bank0;
  var wins = 0, losses = 0, ruined = 0;
  var stakes = [1, 2, 3, 5, 8, 10];
  var i;
  for (i = 0; i < n; i++) {
    var stake = stakes[i % stakes.length];
    if (bank < stake) { ruined++; bank = bank0; }
    var won = roll(P48);
    if (won) { wins++; bank = round2(bank + stake * PROFIT); }
    else { losses++; bank = round2(bank - stake); }
  }
  return { label: 'Mises variables (non-martingale)', n: n, wins: wins, losses: losses, ruined: ruined, bank: bank, pnl: round2(bank - bank0) };
}

function runMultiAccounts(accounts, each) {
  var house = 0;
  var a;
  for (a = 0; a < accounts; a++) {
    var r = runFlat(each, 100, 2);
    house += -r.pnl;
  }
  return { label: accounts + ' comptes × ' + each + ' trades flat 2$', house: round2(house) };
}

function dump(r) {
  var wr = (r.wins + r.losses) ? r.wins / (r.wins + r.losses) : 0;
  console.log('');
  console.log(r.label);
  console.log('  trades        : ' + r.n);
  console.log('  win rate      : ' + pct(wr) + '  (cible flat ~' + pct(P48) + ')');
  console.log('  wins/losses   : ' + r.wins + ' / ' + r.losses);
  if (r.ruined != null) console.log('  ruines        : ' + r.ruined);
  if (r.shieldHits != null) console.log('  coups blindés: ' + r.shieldHits);
  console.log('  PnL joueur    : ' + usd(r.pnl));
  console.log('  PnL maison    : ' + usd(-r.pnl));
}

console.log('=== SIM 48% (1.88) + ANTI-MART ===');
console.log('p*= ' + pct(P48) + '  profit= ' + pct(PROFIT) + '  EV/unité flat= ' + EV_FLAT.toFixed(4) + ' (' + pct(EV_FLAT) + ' maison)');
console.log('iterations/profil = ' + N);

var results = [];
results.push(runFlat(N, 10000, 1));
results.push(runFlat(N, 10000, 5));
results.push(runRandom(N, 10000));
results.push(runMartingale(N, 10000, 1, 512, false));
results.push(runMartingale(N, 10000, 1, 512, true));
results.push(runMartingale(N, 500, 1, 256, true));

results.forEach(dump);

var multi = runMultiAccounts(1000, 1000);
console.log('');
console.log(multi.label);
console.log('  PnL maison totale : ' + usd(multi.house));

var houseOk = results.every(function (r) { return r.pnl < 0; }) && multi.house > 0;
var martShield = results[4];
var martBare = results[3];
if (!(martShield.pnl < martBare.pnl)) {
  console.error('\nECHEC : le blindage devrait aggraver le PnL martingale vs sans blindage');
  process.exit(1);
}
if (!houseOk) {
  console.error('\nECHEC : la maison doit rester gagnante sur tous les profils');
  process.exit(1);
}
if (Math.abs(P48 - 0.48) > 0.0001) {
  console.error('\nECHEC : p* doit être 0.48, reçu ' + P48);
  process.exit(1);
}
console.log('\nOK — maison gagnante partout ; blindage martingale actif ; 48% confirmé sur 1.88.');
process.exit(0);
