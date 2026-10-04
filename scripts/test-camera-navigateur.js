/*
 * TEST DE LA CAMÉRA DES COURBES (à coller dans la console du navigateur, sur le site, en DÉMO).
 * v2338 — à refaire après TOUT changement de js/chart.js. Pour chaque marché : 60 s sans trade, puis 5 trades
 * (90 % 5 s et 10 s, ×5 30 s, ×10 et ×50 1 min) et 60 s avec trades. Mesures toutes les 0,1 s :
 *   sj  = plus grand changement de taille du cadre en 0,1 s (%)     → doit rester ≈ 0
 *   n1  = nombre de changements de taille de plus de 1 %             → doit rester ≈ 0
 *   mj  = plus grand glissement du cadre en 0,1 s (% de sa hauteur)  → petit (< 3 %)
 *   hmin / hmax = position du prix dans la hauteur (%)               → entre ~20 et ~80
 *   clic = changement de taille du cadre juste après les clics (%)   → ≈ 0
 * Résultat v2338 : 0 changement de taille sur 9 marchés ; ORO 999 s'agrandit seulement pour ses grands pics.
 * Utilisation : coller ce fichier, puis  await testCamera(['v100','stable'])  (≈ 2 min par marché).
 */
window.testCamera = async function (ids) {
  ids = ids || ['v100', 'stable', 'apex500', 'horizon50', 'crash300', 'goldtrend', 'boomspike', 'nexusprime', 'v75', 'titanpulse'];
  var C = D6.Chart;
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  async function sample(ms) {
    var out = [];
    var t0 = Date.now();
    while (Date.now() - t0 < ms) {
      var d = C.markDebug();
      if (d.hi > d.lo) out.push({ lo: d.lo, hi: d.hi, p: d.price });
      await wait(100);
    }
    return out;
  }
  function stats(s) {
    var sj = 0, mj = 0, hmin = 1, hmax = 0, n1 = 0;
    for (var i = 1; i < s.length; i++) {
      var a = s[i - 1], b = s[i];
      var sa = a.hi - a.lo, sb = b.hi - b.lo;
      var x = Math.abs(sb - sa) / sa;
      sj = Math.max(sj, x);
      if (x > 0.01) n1++;
      mj = Math.max(mj, Math.abs((b.hi + b.lo) / 2 - (a.hi + a.lo) / 2) / sa);
      var f = (b.p - b.lo) / (b.hi - b.lo);
      hmin = Math.min(hmin, f);
      hmax = Math.max(hmax, f);
    }
    return { sj: +(100 * sj).toFixed(1), n1: n1, mj: +(100 * mj).toFixed(1), hmin: Math.round(100 * hmin), hmax: Math.round(100 * hmax) };
  }
  function odds(s) { document.querySelector('.odds-chip[data-odds="' + s + '"]').click(); }
  function dur(s) { document.querySelector('.dur-chip[data-dur="' + s + '"]').click(); }
  var res = [];
  for (var k = 0; k < ids.length; k++) {
    var id = ids[k];
    document.querySelector('.asset-chip[data-asset="' + id + '"]').click();
    await wait(5000);
    var a = await sample(60000);
    var before = a[a.length - 1];
    var plan = [['1.9', '5', 'call'], ['5', '30', 'put'], ['10', '60', 'call'], ['50', '60', 'put'], ['1.9', '10', 'put']];
    for (var j = 0; j < plan.length; j++) {
      odds(plan[j][0]); dur(plan[j][1]);
      if (plan[j][2] === 'call') window.oroUi.call(); else window.oroUi.put();
      await wait(350);
    }
    var b = await sample(60000);
    var after = b[10] || b[0];
    odds('1.9'); dur('5');
    var r = { id: id, sans: stats(a), avec: stats(b), clic: +(100 * ((after.hi - after.lo) / (before.hi - before.lo) - 1)).toFixed(1) };
    console.log(JSON.stringify(r));
    res.push(r);
  }
  return res;
};
