<?php
// v2781 (propriétaire) — MARGE DE LA MAISON : les jeux où la chance NE se voit PAS rendent environ 94 % (marge 6 %) ;
// les jeux où la chance se voit (cartes, roulette, pièce, dés, coffres…) gardent les gains des grands sites (retour 95 à 99 %).
// Calcul exact quand c'est possible, sinon 400 000 parties simulées avec les VRAIS tirages du serveur (casino_instant).
// Ligne de commande seulement ; rien n'est écrit, aucun compte touché.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
chdir(__DIR__ . '/..');
require 'casino_lib.php';
$ok = 0; $ko = 0;
function chk(string $name, float $rtp, float $lo = 0.925, float $hi = 0.9425): void {
  global $ok, $ko;
  $good = $rtp >= $lo && $rtp <= $hi;
  $good ? $ok++ : $ko++;
  printf("  %s %-34s retour %5.2f %%  · marge %4.2f %%\n", $good ? 'OK   ' : 'ÉCHEC', $name, 100 * $rtp, 100 * (1 - $rtp));
}
function sim(string $g, array $p, int $n = 400000): float { $s = 0.0; for ($i = 0; $i < $n; $i++) $s += (float) casino_instant($g, $p, 1)['mult']; return $s / $n; }
echo "Calcul exact\n";
chk('Pile ou face', 0.5 * CASINO_COIN_MULT, 0.84, 0.995);
chk('Dés (duel)', 15 / 36 * CASINO_DICE_DUEL + 6 / 36, 0.84, 0.995);
chk('Pierre-feuille-ciseaux', CASINO_RPS_MULT / 3 + 1 / 3, 0.84, 0.995);
chk('Course auto (6 voitures)', CASINO_RACE_MULT / 6, 0.84, 0.995);
chk('Penalty (1 tir)', 2 / 3 * CASINO_PENALTY_MULT, 0.84, 0.995);
for ($k = 1; $k <= 8; $k++) $pen[] = pow(2 / 3, $k) * casino_pen_mult($k);
chk('Penalty (encaisser après 1 à 8 buts)', min($pen), 0.84, 0.995); chk('Penalty (meilleur moment)', max($pen), 0.84, 0.995);
foreach (['red' => 'Roulette rouge/noir/pair/impair', 'd1' => 'Roulette douzaine', 'n7' => 'Roulette numéro'] as $b => $nm) { $s = 0; for ($n = 0; $n <= 36; $n++) $s += casino_roulette_mult($b, $n); chk($nm, $s / 37, 0.84, 0.995); }
chk('Crypto Live (15 cryptos)', CASINO_CRYPTOX_MULT / 15, 0.84, 0.995);
chk('Chevaux Live (10 chevaux)', CASINO_HORSES_MULT / 10, 0.84, 0.995);
$w = 0; $t = 0; foreach (CASINO_WHEEL as [$m, $c]) { $w += $m * $c; $t += $c; } chk('Roue casino', $w / $t);
$s = 0; foreach (CASINO_SLOTS as [, $m, $c]) $s += $m * $c; chk('Machine à sous', $s / 1000);
$s = 0; foreach (CASINO_SCRATCH as [$m, $c]) $s += $m * $c; chk('Grattage', $s / 1000);
$s = 0; foreach (CASINO_DARTS as [$m, $c]) $s += $m * $c; chk('Fléchettes', $s / 10000);
$s = 0; for ($k = 0; $k <= 8; $k++) { $c = 1; for ($j = 0; $j < $k; $j++) $c = $c * (8 - $j) / ($j + 1); $s += $c / 256 * CASINO_PLINKO[$k]; } chk('Cascade (plinko)', $s);
$C = fn($n, $k) => $k < 0 || $k > $n ? 0 : array_product(range(1, max(1, $n))) / (array_product(range(1, max(1, $k))) * array_product(range(1, max(1, $n - $k))));
$s = 0; for ($h = 0; $h <= 3; $h++) $s += $C(3, $h) * $C(17, 5 - $h) / $C(20, 5) * CASINO_KENO[$h]; chk('Keno', $s);
$d = 0; $tie = 0; for ($a = 1; $a <= 13; $a++) for ($b = 1; $b <= 13; $b++) { if ($a > $b) $d += 2.0; elseif ($a === $b) { $d += 0.5; $tie += 12.0; } } chk('Dragon Tigre (Dragon)', $d / 169, 0.84, 0.995); chk('Dragon Tigre (Égalité)', $tie / 169, 0.84, 0.995);
$s = 0; for ($a = 1; $a <= 6; $a++) for ($b = 1; $b <= 6; $b++) for ($c = 1; $c <= 6; $c++) { $sum = $a + $b + $c; if (!($a === $b && $b === $c) && $sum <= 10) $s += 2.0; } chk('Sic Bo (Petit)', $s / 216, 0.84, 0.995);
chk('Coffres (1 sur 3)', 2.85 / 3, 0.84, 0.995);
chk('Limbo / Avion / Jet / Fusée (toute cible)', CASINO_EDGE); // P(résultat ≥ x) = 0,94 / x
foreach ([[1, 1], [3, 3], [5, 5], [10, 2]] as [$m, $k]) { $p = 1; for ($j = 0; $j < $k; $j++) $p *= (25 - $m - $j) / (25 - $j); chk("Mines ($m mines, $k cases)", $p * casino_mines_mult($m, $k)); }
foreach ([1, 4, 8] as $k) chk("La Tour ($k étages)", pow(2 / 3, $k) * casino_tower_mult($k));
foreach ([1, 5, 10] as $k) chk("Ballon ($k souffles)", pow(0.9, $k) * casino_balloon_mult($k));
foreach ([[1, 3], [2, 5], [4, 2]] as [$lv, $k]) chk("Verger ($lv pourrie(s), $k étages)", pow((5 - $lv) / 5, $k) * casino_apple_mult($k, $lv));
foreach ([3, 7, 11] as $a) chk("Hi-Lo (carte $a, plus haut)", (14 - $a) / 13 * casino_hilo_mult($a, true));
echo "Simulation (400 000 parties chacune, vrais tirages du serveur)\n";
chk('Baccara (Joueur)', sim('baccarat', ['bet' => 'player']), 0.84, 0.995);
chk('Baccara (Banque)', sim('baccarat', ['bet' => 'banker']), 0.84, 0.995);
chk('Baccara (Égalité)', sim('baccarat', ['bet' => 'tie']), 0.80, 0.90);
chk('Couleurs (vert)', sim('colors', ['bet' => 'green']), 0.92, 0.95);
chk('Limbo ×2 (simulé)', sim('limbo', ['target' => 2]), 0.92, 0.95);
chk('Machine à sous (simulée)', sim('slots', []), 0.92, 0.955);
echo "\nRÉSULTAT : $ok OK, $ko échec(s)\n";
exit($ko ? 1 : 0);
