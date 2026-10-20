// node scripts/test-cg-casc-inst.js [n] — the 12 instant games of js/games/casc2.js · casc3.js: for every server line, the scene the
// browser builds (n tries per line) shows exactly that line, and the exact counts of the natural rules (tiles, rounds, meteors, cards).
// Prints JSON for scripts/test-cg-casc.php.
global.window = { D6: {} };
var path = require('path');
require(path.join(__dirname, '../js/games/casc2.js'));
require(path.join(__dirname, '../js/games/casc3.js'));
var L = window.D6.CascLogic, n = +process.argv[2] || 200, bad = [], ex = {};
function no(w) { bad.push(w); }
// Stone Skip
for (var i = 0; i < 11; i++) for (var t = 0; t < n; t++) { var s = L.skips(i); if (i < 10 ? s !== i : s < 10) { no('stoneskip ' + i); break; } }
// Tarot: i lucky cards, 3 different cards of 0…21
for (i = 0; i < 4; i++) for (t = 0; t < n; t++) { var h = L.tarot(i); if (h.length !== 3 || new Set(h).size !== 3 || h.some(function (x) { return x < 0 || x > 21; }) || L.tarotCount(h) !== i) { no('tarot ' + i); break; } }
var C = [0, 0, 0, 0]; for (var a = 0; a < 22; a++) for (var b = a + 1; b < 22; b++) for (var c = b + 1; c < 22; c++) C[L.tarotCount([a, b, c])]++;
ex.tarot = C;
// Mahjong: the hand drawn for line i has class i; exact counts over the C(48,3) hands
for (i = 0; i < 5; i++) for (t = 0; t < n; t++) { var m = L.mahjong(i), cnt = {}; m.forEach(function (k) { cnt[k] = (cnt[k] || 0) + 1; }); if (m.length !== 3 || L.mjClass(m) !== i || Object.keys(cnt).some(function (k) { return cnt[k] > 4 || k < 0 || k > 11; })) { no('mahjong ' + i); break; } }
var M = [0, 0, 0, 0, 0]; for (a = 0; a < 48; a++) for (b = a + 1; b < 48; b++) for (c = b + 1; c < 48; c++) M[L.mjClass([a >> 2, b >> 2, c >> 2])]++;
ex.mahjong = M;
// Robo Boxing: rounds = the line's (won, lost, even), powers 1–10, pay as on the server; exact counts over 100^3 power pairs
for (i = 0; i < 10; i++) for (t = 0; t < n; t++) {
  var R = L.robobox(i), w = 0, l = 0, e = 0;
  R.forEach(function (p) { if (p[0] < 1 || p[0] > 10 || p[1] < 1 || p[1] > 10) w = -9; if (p[0] > p[1]) w++; else if (p[0] < p[1]) l++; else e++; });
  if (R.length !== 3 || w !== L.ROBO[i][0] || l !== L.ROBO[i][1] || e !== L.ROBO[i][2] || L.roboPay(R) !== L.rows.robobox[i]) { no('robobox ' + i); break; }
}
var RW = L.ROBO.map(function () { return 0; }), ROUND = { w: 45, l: 45, t: 10 };
['w', 'l', 't'].forEach(function (x) { ['w', 'l', 't'].forEach(function (y) { ['w', 'l', 't'].forEach(function (z) {
  var k = [x, y, z], cw = k.filter(function (q) { return q === 'w'; }).length, cl = k.filter(function (q) { return q === 'l'; }).length;
  RW[L.ROBO.findIndex(function (r) { return r[0] === cw && r[1] === cl; })] += ROUND[x] * ROUND[y] * ROUND[z];
}); }); });
var pairs = { w: 0, l: 0, t: 0 }; for (a = 1; a <= 10; a++) for (b = 1; b <= 10; b++) pairs[a > b ? 'w' : a < b ? 'l' : 't']++;
if (pairs.w !== 45 || pairs.l !== 45 || pairs.t !== 10) no('robobox round odds');
ex.robobox = RW;
// Lantern: i golden lanterns of 5
for (i = 0; i < 6; i++) for (t = 0; t < n; t++) { var g = L.lantern(i); if (g.length !== 5 || g.reduce(function (s2, x) { return s2 + x; }, 0) !== i) { no('lantern ' + i); break; } }
// Meteor: the 3 meteors shown = the line (any order), total = server pay; exact counts (12/5/2/1 per meteor) over 20^3
var MW = [12, 5, 2, 1];
ex.meteor = L.MET.map(function (T) { var perm = T[0] === T[2] ? 1 : T[0] === T[1] || T[1] === T[2] ? 3 : 6; return perm * MW[T[0]] * MW[T[1]] * MW[T[2]]; });
for (i = 0; i < L.MET.length; i++) {
  var tot = L.MET[i].reduce(function (s2, x) { return s2 + L.METV[x]; }, 0); if (L.MET[i][0] === 3) tot = 200;
  if (Math.abs(tot - L.rows.meteor[i]) > 1e-9) no('meteor pay ' + i);
  for (t = 0; t < n; t++) { var mt = L.meteor(i).slice().sort(); if (mt.join() !== L.MET[i].join()) { no('meteor ' + i); break; } }
}
// Curling: the stone stops in the line's ring
var RING = { 2: 2, 3: 3, 4: 4, 5: 5, 6: 5, 7: 7 };
for (i = 2; i < 8; i++) for (t = 0; t < n; t++) if (L.curlRing(L.curlD(i)) !== RING[i]) { no('curling ' + i); break; }
console.log(JSON.stringify({ bad: bad, rows: L.rows, picks: L.picks, exact: ex }));
