<?php
/**
 * v2538 — TEST DE FLUIDITÉ (à lancer avant chaque mise en ligne qui touche au CSS ou au JS de l'écran).
 * Il refuse les erreurs qui ont rendu le site lent en octobre 2026 :
 *  1) règles CSS « :has() » posées sur la page entière (body/html/.pad…) → chaque petit changement (prix, solde)
 *     obligeait le téléphone à revérifier TOUTE la page (~15 ms à chaque fois sur téléphone).
 *     À la place : étiquettes posées par app.js (body.oro-real, body.oro-shown, .hz-*, .pad[data-hz-odds]).
 *  2) « void x.offsetWidth » (recalcul forcé de la page) dans app.js / fit.js → utiliser deux requestAnimationFrame.
 *  3) les pauses des éléments cachés et le mode léger (html.oro-lite) doivent rester en place.
 * Usage : php scripts/test-fluidite.php   (0 échec attendu)
 */
$root = dirname(__DIR__);
$ok = 0; $ko = 0;
function check($cond, $label, $detail = '') {
    global $ok, $ko;
    if ($cond) { $ok++; echo "  OK   $label\n"; }
    else { $ko++; echo "  ÉCHEC $label" . ($detail !== '' ? "  ($detail)" : '') . "\n"; }
}
$css = [];
foreach (['css/app.css', 'css/galaxy.css', 'css/auth.css', 'css/tv.css'] as $f) {
    $p = "$root/$f";
    if (is_file($p)) $css[$f] = file_get_contents($p);
}
// Seules ces règles :has() LOCALES sont permises (elles ne regardent qu'une petite zone d'une fenêtre).
$allowed = [
    '.field:has(#err-otpCode.otp-wait-live.on)',
    '.wd-modal-head:has(#closeWithdraw.hidden)',
    '.field:not(:has(textarea))',
];
echo "1) Règles « :has() » coûteuses\n";
$bad = [];
foreach ($css as $f => $s) {
    if (!preg_match_all('/([^\s,{}>+~]*):(?:not\()?has\(/', $s, $m, PREG_OFFSET_CAPTURE)) continue;
    foreach ($m[0] as $hit) {
        $pos = $hit[1];
        $frag = substr($s, $pos, 80);
        $okHit = false;
        foreach ($allowed as $a) {
            if (strpos($frag, $a) === 0 || strpos(substr($s, max(0, $pos - 12), 100), $a) !== false) { $okHit = true; break; }
        }
        if (!$okHit) $bad[] = $f . ' ligne ' . (substr_count(substr($s, 0, $pos), "\n") + 1) . ' : ' . trim(substr($frag, 0, 60));
    }
}
check(!$bad, 'aucune règle :has() sur la page entière', implode(' | ', array_slice($bad, 0, 5)));

echo "2) Recalculs forcés (void …offsetWidth)\n";
foreach (['js/app.js', 'js/fit.js'] as $f) {
    $s = (string) @file_get_contents("$root/$f");
    $n = preg_match_all('/void\s+[^;]*\.(offsetWidth|offsetHeight)/', $s);
    // Restants connus et rares (clic sur un bouton, ouverture d'une fenêtre) : au plus 4 dans app.js, 1 dans fit.js.
    $max = $f === 'js/app.js' ? 4 : 1;
    check($n <= $max, "$f : $n recalcul(s) forcé(s) (maximum $max, jamais dans une boucle)");
}
$app = (string) @file_get_contents("$root/js/app.js");
check(strpos($app, 'function paintModeExtras') !== false && !preg_match('/function paintModeExtras[\s\S]{0,700}void\s+b\.offsetWidth/', $app),
    'éclat du solde sans recalcul forcé (paintModeExtras)');

echo "3) Garde-fous en place\n";
check(strpos($app, 'function hasFlags') !== false, 'étiquettes body.oro-real / oro-shown / hz-* (hasFlags) présentes');
check(strpos($app, 'function liteWatch') !== false, 'détecteur du mode léger (liteWatch) présent');
$a = $css['css/app.css'] ?? '';
check(strpos($a, '#oroLoader.off,#oroLoader.off *') !== false, 'écran de chargement : animations en pause une fois caché');
check(strpos($a, '#drawerProfile:not(.on) *') !== false, 'profil fermé : animations en pause');
check(strpos($a, 'html.oro-lite body') !== false, 'règles du mode léger présentes');
$fit = (string) @file_get_contents("$root/js/fit.js");
check(strpos($fit, 'el._fitOk && el._fitTxt === txt') !== false, 'fit.js ne relit pas les cases qui n’ont pas changé');

echo "\nRÉSULTAT : $ok OK, $ko échec(s)\n";
exit($ko ? 1 : 0);
