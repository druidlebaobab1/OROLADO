// node scripts/test-cg-casa-grids.js [n] — every slot line of js/games/casa1.js can be drawn: the grid built for line i
// pays exactly line i (and a losing line shows no win). Prints the line multipliers as JSON for scripts/test-cg-casa.php.
global.window = { D6: {} }; global.document = { documentElement: { classList: { contains: function () { return false; } } } };
require(require('path').join(__dirname, '../js/games/casa1.js'));
var S = window.D6.CasaSlots, n = +process.argv[2] || 60, bad = 0, out = {};
S.ORDER.forEach(function (k) {
  var d = S.TH[k], R = S.rowsOf(d); out[k] = R.map(function (r) { return r.m; });
  R.forEach(function (row, i) {
    for (var t = 0; t < n; t++) {
      var b = S.buildGrid(d, row);
      if (!b) { bad++; console.error('FAIL ' + k + ' line ' + i + ' ' + JSON.stringify(row)); break; }
      var W = S.evalGrid(d, b.g), m = W.reduce(function (a, w) { return a + w.m; }, 0);
      if (Math.abs(m - row.m) > 1e-9 || W.length > 1) { bad++; console.error('MISMATCH ' + k + ' line ' + i); break; }
    }
  });
});
console.log(JSON.stringify({ bad: bad, rows: out }));
