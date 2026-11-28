<?php
declare(strict_types=1);
/*
 * 2026-11-28 (propriétaire) — MATCHS VIRTUELS « Ligue OROLADO » : 56 équipes (grands pays + villes des grands clubs), une
 * journée de 28 matchs toutes les 15 minutes, 24 h/24 :
 *   - paris AVANT-MATCH ouverts 15 min (pendant la journée précédente), fermés 10 s avant le coup d'envoi ;
 *   - match de 10 min réelles (1re mi-temps 5 min, 2e mi-temps 5 min ; 90 minutes de jeu affichées), paris EN DIRECT ;
 *   - 5 min ensuite : résultats, classement, et la journée suivante est déjà ouverte.
 *   - saison = matchs aller (55 journées ≈ 13 h 45), puis une nouvelle saison repart à zéro.
 * TIRAGE : le score de chaque match est tiré par le SERVEUR à partir d'une clé secrète (data/sports/vf_secret.php, jamais
 * envoyée) : personne ne peut le deviner ni le changer, et rien du match n'est envoyé au téléphone avant d'avoir eu lieu.
 * Le tirage suit les forces des équipes (une favorite gagne plus souvent, une outsider peut gagner) — JAMAIS selon les mises.
 * COTES : même modèle (Poisson) que le tirage, marge maison VF_MARGE répartie également (cote = (1 − m) / p, comme sb_wodd).
 * Règlement : sb_sel_result → vf_sel_result → sb_settle_mk (mêmes règles, même paiement sp_resolve, même reçu).
 */

const VF_EPOCH = 1795824000;   // 2026-11-28 00:00 UTC : début de la saison 1 (journée 0)
const VF_SLOT = 900;           // une journée toutes les 15 min
const VF_MATCH = 600;          // match : 10 min réelles (2 × 5 min)
const VF_CLOSE = 10;           // avant-match fermé 10 s avant le coup d'envoi
const VF_LIVE_END = 88;        // paris en direct jusqu'à la 88e minute (propriétaire : moins de cadenas)
const VF_GOAL_LOCK = 4;        // marchés suspendus 4 s après un but (le serveur recalcule toujours la cote au moment du pari)
const VF_MARGE = 0.08;         // marge maison des matchs virtuels (propriétaire : 8 %)
const VF_ROUNDS = 55;          // ligue 1 (56 équipes) : 55 journées
const VF_V2 = 40;              // 2026-11-28 (propriétaire : « 60 équipes ») : à partir de la journée 40 (10 h 00 GMT), 60 équipes / 59 journées
/* 2026-11-28 (propriétaire : « mélange les pays et les grands clubs, c'est ce qui fera la spécialité d'OROLADO ») : à partir de la
   journée VF_V3 (11 h 30 GMT), nouvelle saison : 44 pays + 16 grands clubs (villes, couleurs du club, écusson OROLADO), et une vraie
   MI-TEMPS (1re période 4 min 30, pause 1 min, 2e période 4 min 30). Les journées d'avant ne changent pas (paris déjà posés). */
const VF_V3 = 46;
const VF_OUT3 = [16, 18, 27, 59, 44, 50, 54, 55, 53, 52, 51, 46, 45, 48, 49, 40]; // pays peu connus remplacés par les clubs
function vf_ids3(): array { static $ids = null; if ($ids === null) $ids = array_values(array_merge(array_diff(range(0, 59), VF_OUT3), range(60, 75))); return $ids; }
/** [équipes, journées par saison, 1re journée de cette formule, n° de saison de départ, liste des équipes] pour la journée g. */
function vf_cfg(int $g): array {
  if ($g < VF_V2) return [56, VF_ROUNDS, 0, 0, range(0, 55)];
  if ($g < VF_V3) return [60, 59, VF_V2, intdiv(VF_V2 - 1, VF_ROUNDS) + 1, range(0, 59)];
  return [60, 59, VF_V3, intdiv(VF_V3 - 1 - VF_V2, 59) + intdiv(VF_V2 - 1, VF_ROUNDS) + 2, vf_ids3()];
}
/** Mi-temps avec pause (formule 3). */
function vf_ht(int $g): bool { return $g >= VF_V3; }
const VF_H1 = 270; const VF_H2 = 330; // fin de la 1re période / reprise (secondes réelles après le coup d'envoi)

/** Équipes : [nom, type p (pays) | c (ville d'un grand club), force 60-95, couleur, code pays ISO (pays)]. */
const VF_TEAMS = [
  ['Brésil', 'p', 91, '#FACC15', 'br'], ['Argentine', 'p', 92, '#7DD3FC', 'ar'], ['France', 'p', 91, '#2563EB', 'fr'], ['Angleterre', 'p', 89, '#F8FAFC', 'gb'],
  ['Espagne', 'p', 90, '#DC2626', 'es'], ['Portugal', 'p', 88, '#B91C1C', 'pt'], ['Allemagne', 'p', 87, '#E5E7EB', 'de'], ['Italie', 'p', 86, '#1D4ED8', 'it'],
  ['Pays-Bas', 'p', 86, '#F97316', 'nl'], ['Belgique', 'p', 84, '#B91C1C', 'be'], ['Croatie', 'p', 84, '#EF4444', 'hr'], ['Uruguay', 'p', 83, '#38BDF8', 'uy'],
  ['Colombie', 'p', 82, '#FACC15', 'co'], ['Mexique', 'p', 80, '#16A34A', 'mx'], ['États-Unis', 'p', 79, '#1E3A8A', 'us'], ['Japon', 'p', 81, '#1E40AF', 'jp'],
  ['Albanie', 'p', 78, '#DC2626', 'al'], ['Chine', 'p', 68, '#DC2626', 'cn'], ['Bolivie', 'p', 72, '#16A34A', 'bo'], ['Maroc', 'p', 86, '#B91C1C', 'ma'],
  ['Sénégal', 'p', 84, '#16A34A', 'sn'], ['Côte d\'Ivoire', 'p', 83, '#F97316', 'ci'], ['Nigeria', 'p', 81, '#16A34A', 'ng'], ['Égypte', 'p', 80, '#DC2626', 'eg'],
  ['Cameroun', 'p', 78, '#15803D', 'cm'], ['Algérie', 'p', 79, '#16A34A', 'dz'], ['Ghana', 'p', 76, '#FACC15', 'gh'], ['Panama', 'p', 74, '#DC2626', 'pa'],
  // 2026-11-28 (propriétaire : « uniquement des noms de pays ») : plus aucune ville — 60 sélections nationales (mêmes niveaux qu'avant, résultats inchangés)
  ['Danemark', 'p', 93, '#DC2626', 'dk'], ['Suisse', 'p', 90, '#DC2626', 'ch'], ['Grèce', 'p', 80, '#2563EB', 'gr'], ['Suède', 'p', 91, '#FACC15', 'se'],
  ['Pologne', 'p', 90, '#DC2626', 'pl'], ['Autriche', 'p', 89, '#DC2626', 'at'], ['Hongrie', 'p', 83, '#16A34A', 'hu'], ['Turquie', 'p', 91, '#DC2626', 'tr'],
  ['Ukraine', 'p', 84, '#FACC15', 'ua'], ['Serbie', 'p', 85, '#DC2626', 'rs'], ['Norvège', 'p', 86, '#DC2626', 'no'], ['Tchéquie', 'p', 84, '#2563EB', 'cz'],
  ['Roumanie', 'p', 82, '#FACC15', 'ro'], ['Chili', 'p', 85, '#DC2626', 'cl'], ['Canada', 'p', 90, '#DC2626', 'ca'], ['Irlande', 'p', 82, '#16A34A', 'ie'],
  ['Slovaquie', 'p', 81, '#2563EB', 'sk'], ['Équateur', 'p', 82, '#FACC15', 'ec'], ['Paraguay', 'p', 79, '#DC2626', 'py'], ['Australie', 'p', 82, '#FACC15', 'au'],
  ['Pérou', 'p', 83, '#DC2626', 'pe'], ['Iran', 'p', 82, '#16A34A', 'ir'], ['Slovénie', 'p', 80, '#2563EB', 'si'], ['Qatar', 'p', 76, '#7F1D1D', 'qa'],
  ['Costa Rica', 'p', 75, '#2563EB', 'cr'], ['Venezuela', 'p', 72, '#7F1D1D', 've'], ['Islande', 'p', 72, '#2563EB', 'is'], ['Jamaïque', 'p', 73, '#FACC15', 'jm'],
  // 2026-11-28 : 4 pays populaires de plus (ligue de 60, à partir de VF_V2)
  ['Tunisie', 'p', 76, '#DC2626', 'tn'], ['Mali', 'p', 75, '#16A34A', 'ml'], ['RD Congo', 'p', 75, '#38BDF8', 'cd'], ['Bosnie', 'p', 73, '#2563EB', 'ba'],
  // 60-75 : grands clubs (formule 3) — nom de la ville, couleurs du club (2e couleur en 6e place), écusson dessiné par OROLADO
  ['Madrid', 'c', 93, '#F8FAFC', '', '#D4AF37'], ['Barcelone', 'c', 91, '#A50044', '', '#004D98'], ['Manchester', 'c', 92, '#6CABDD', '', '#1C2C5B'], ['Liverpool', 'c', 90, '#C8102E', '', '#F6EB61'],
  ['Londres', 'c', 89, '#EF0107', '', '#FFFFFF'], ['Munich', 'c', 92, '#DC052D', '', '#0066B2'], ['Dortmund', 'c', 85, '#FDE100', '', '#111111'], ['Milan', 'c', 86, '#FB090B', '', '#111111'],
  ['Turin', 'c', 85, '#FFFFFF', '', '#111111'], ['Naples', 'c', 85, '#12A0D7', '', '#FFFFFF'], ['Paris', 'c', 90, '#004170', '', '#DA291C'], ['Marseille', 'c', 82, '#2FAEE0', '', '#FFFFFF'],
  ['Lisbonne', 'c', 83, '#E83030', '', '#FFFFFF'], ['Porto', 'c', 83, '#00428C', '', '#FFFFFF'], ['Amsterdam', 'c', 83, '#D2122E', '', '#FFFFFF'], ['Istanbul', 'c', 81, '#FDB912', '', '#A90432'],
];

function vf_now(): int { return function_exists('sb_now') ? sb_now() : time(); }
function vf_n(int $g = PHP_INT_MAX): int { return vf_cfg($g)[0]; }
/** Clé secrète du tirage (créée une seule fois ; fichier .php : rien n'est lisible même s'il était servi). */
function vf_secret(): string {
  static $s = null; if ($s !== null) return $s;
  $env = trim((string) (getenv('VF_SECRET') ?: ''));
  if (strlen($env) >= 32) return $s = $env;
  $dir = rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'sports'; if (!is_dir($dir)) @mkdir($dir, 0750, true);
  $f = $dir . DIRECTORY_SEPARATOR . 'vf_secret.php';
  if (is_file($f)) { $v = include $f; if (is_string($v) && strlen($v) >= 32) return $s = $v; }
  $v = bin2hex(random_bytes(32));
  $tmp = $f . '.' . bin2hex(random_bytes(4));
  @file_put_contents($tmp, "<?php return '" . $v . "';\n", LOCK_EX); @chmod($tmp, 0600);
  if (!@rename($tmp, $f)) @unlink($tmp); // déjà créé par un autre processus → on relit le sien
  $r = is_file($f) ? include $f : null;
  return $s = (is_string($r) && strlen($r) >= 32) ? $r : $v;
}
/** Générateur de nombres (0 ≤ x < 1) déterministe : flot SHA-256 d'une graine. */
function vf_rng(string $seed): callable {
  $buf = ''; $ctr = 0;
  return static function () use (&$buf, &$ctr, $seed): float {
    if (strlen($buf) < 7) { $buf .= hash('sha256', $seed . '|' . $ctr++, true); }
    $chunk = substr($buf, 0, 7); $buf = substr($buf, 7);
    $n = 0; for ($i = 0; $i < 7; $i++) $n = $n * 256 + ord($chunk[$i]);
    return $n / 72057594037927936.0; // 2^56
  };
}
function vf_slot(int $t): int { return (int) floor(($t - VF_EPOCH) / VF_SLOT); }
function vf_ko(int $g): int { return VF_EPOCH + $g * VF_SLOT; }
function vf_season(int $g): int { [, $R, $b, $o] = vf_cfg($g); return $o + intdiv($g - $b, $R); }
function vf_round(int $g): int { [, $R, $b] = vf_cfg($g); return ($g - $b) % $R; }

/** Ordre des équipes de la saison (public : calendrier) puis tableau « en cercle » → 28 matchs de la journée g. */
function vf_fixtures(int $g): array {
  static $cache = [];
  if (isset($cache[$g])) return $cache[$g];
  $S = vf_season($g); $r = vf_round($g); $n = vf_n($g);
  $ord = vf_cfg($g)[4];
  $rnd = vf_rng('sched|' . $S);
  for ($i = $n - 1; $i > 0; $i--) { $j = (int) floor($rnd() * ($i + 1)); [$ord[$i], $ord[$j]] = [$ord[$j], $ord[$i]]; }
  $rot = array_slice($ord, 1);
  $m = $n - 1;
  $rot = array_merge(array_slice($rot, $r % $m), array_slice($rot, 0, $r % $m));
  $line = array_merge([$ord[0]], $rot);
  $out = [];
  for ($i = 0; $i < $n / 2; $i++) {
    $a = $line[$i]; $b = $line[$n - 1 - $i];
    $out[] = (($r + $i) % 2 === 0) ? [$a, $b] : [$b, $a];
  }
  return $cache[$g] = $out;
}
/** Buts attendus (domicile, extérieur) selon les forces : léger avantage à domicile. */
function vf_lambda(int $h, int $a): array {
  $d = (VF_TEAMS[$h][2] - VF_TEAMS[$a][2]) / 10.0;
  return [max(0.25, min(4.0, 1.42 * exp(0.30 * $d))), max(0.2, min(3.6, 1.12 * exp(-0.30 * $d)))];
}
/** Tirage SECRET d'un match : minutes des buts [['m'=>min,'s'=>'h'|'a'], …] triées. */
function vf_draw(int $g, int $i): array {
  static $cache = [];
  $key = $g . ':' . $i; if (isset($cache[$key])) return $cache[$key];
  $fx = vf_fixtures($g)[$i] ?? null; if (!$fx) return [];
  [$lh, $la] = vf_lambda($fx[0], $fx[1]);
  $rnd = vf_rng(hash_hmac('sha256', 'vf|' . $key, vf_secret()));
  $pois = static function (float $l) use ($rnd): int { $L = exp(-$l); $k = 0; $p = 1.0; do { $k++; $p *= $rnd(); } while ($p > $L && $k < 12); return $k - 1; };
  $gh = $pois($lh); $ga = $pois($la);
  $ev = [];
  for ($k = 0; $k < $gh; $k++) $ev[] = ['m' => 1 + (int) floor($rnd() * 90), 's' => 'h'];
  for ($k = 0; $k < $ga; $k++) $ev[] = ['m' => 1 + (int) floor($rnd() * 90), 's' => 'a'];
  usort($ev, static fn($x, $y) => $x['m'] <=> $y['m']);
  return $cache[$key] = $ev;
}
/** Minute de jeu (0-90) à l'instant t pour la journée g ; -1 avant le coup d'envoi, 90 après la fin. */
function vf_minute(int $g, int $t): int {
  $d = $t - vf_ko($g);
  if ($d < 0) return -1;
  if ($d >= VF_MATCH) return 90;
  if (vf_ht($g)) return $d < VF_H1 ? (int) floor($d * 45 / VF_H1) : ($d < VF_H2 ? 45 : min(90, 45 + (int) floor(($d - VF_H2) * 45 / (VF_MATCH - VF_H2))));
  return (int) floor($d * 90 / VF_MATCH);
}
/** Pause de la mi-temps en cours ? */
function vf_in_ht(int $g, int $t): bool { $d = $t - vf_ko($g); return vf_ht($g) && $d >= VF_H1 && $d < VF_H2; }
/** Instant réel d'un but de la minute m. */
function vf_goal_at(int $g, int $m): int {
  if (vf_ht($g)) return vf_ko($g) + ($m <= 45 ? (int) ceil($m * VF_H1 / 45) : VF_H2 + (int) ceil(($m - 45) * (VF_MATCH - VF_H2) / 45));
  return vf_ko($g) + (int) ceil($m * VF_MATCH / 90);
}
/** État visible à l'instant t (seulement les buts déjà marqués). */
function vf_state(int $g, int $i, int $t): array {
  $min = vf_minute($g, $t); $h = 0; $a = 0; $hh = 0; $ha = 0; $last = 0; $goals = [];
  foreach (vf_draw($g, $i) as $e) {
    $at = vf_goal_at($g, $e['m']);
    if ($at > $t) break;
    if ($e['s'] === 'h') $h++; else $a++;
    if ($e['m'] <= 45) { if ($e['s'] === 'h') $hh++; else $ha++; }
    $last = max($last, $at); $goals[] = [$e['m'], $e['s']];
  }
  return ['min' => $min, 'h' => $h, 'a' => $a, 'hh' => $hh, 'ha' => $ha, 'last' => $last, 'goals' => $goals, 'end' => $t >= vf_ko($g) + VF_MATCH, 'ht' => vf_in_ht($g, $t)];
}

/* ---------- probabilités (Poisson) et cotes ---------- */
function vf_pmf(float $l, int $max = 10): array { $p = []; $e = exp(-$l); $f = 1.0; for ($k = 0; $k <= $max; $k++) { if ($k > 0) $f *= $k; $p[$k] = $e * pow($l, $k) / $f; } return $p; }
/** Matrice des scores FINAUX possibles depuis l'état (h, a) avec la part de match restante r (0-1). */
function vf_matrix(float $lh, float $la, int $h, int $a, float $r): array {
  $ph = vf_pmf($lh * $r); $pa = vf_pmf($la * $r); $out = [];
  foreach ($ph as $x => $px) foreach ($pa as $y => $py) { $p = $px * $py; if ($p > 1e-9) $out[] = [$h + $x, $a + $y, $p]; }
  return $out;
}
function vf_odd(float $p): ?float {
  if ($p < 0.012 || $p > 0.985) return null; // presque sûr / presque impossible : non proposé
  $o = floor((1 - VF_MARGE) / $p * 100) / 100;
  return $o < 1.02 ? null : min(60.0, $o);
}
/** Marchés proposés pour un match de la journée g à l'instant t. null = fermé. */
function vf_markets(int $g, int $i, int $t): ?array {
  $fx = vf_fixtures($g)[$i] ?? null; if (!$fx) return null;
  $ko = vf_ko($g);
  [$lh, $la] = vf_lambda($fx[0], $fx[1]);
  if ($t < $ko - VF_CLOSE) { $h = 0; $a = 0; $hh = 0; $ha = 0; $min = 0; $live = false; }
  else {
    $st = vf_state($g, $i, $t);
    if ($t < $ko || $st['end'] || $st['min'] >= VF_LIVE_END || ($st['last'] && $t - $st['last'] < VF_GOAL_LOCK)) return null; // fermé / suspendu
    $h = $st['h']; $a = $st['a']; $hh = $st['hh']; $ha = $st['ha']; $min = $st['min']; $live = true;
  }
  $r = max(0.0, (90 - $min) / 90);
  $M = vf_matrix($lh, $la, $h, $a, $r);
  $P = static function (callable $f) use ($M): float { $s = 0.0; foreach ($M as [$x, $y, $p]) if ($f($x, $y)) $s += $p; return $s; };
  $mk = [];
  $p1 = $P(fn($x, $y) => $x > $y); $px = $P(fn($x, $y) => $x === $y); $p2 = $P(fn($x, $y) => $x < $y);
  $mk['1x2'] = [['H', vf_odd($p1)], ['D', vf_odd($px)], ['A', vf_odd($p2)]];
  $mk['dc'] = [['HD', vf_odd($p1 + $px)], ['HA', vf_odd($p1 + $p2)], ['DA', vf_odd($px + $p2)]];
  foreach (['1.5', '2.5', '3.5'] as $L) { $po = $P(fn($x, $y) => $x + $y > (float) $L); $mk['ou:' . $L] = [['O', vf_odd($po)], ['U', vf_odd(1 - $po)]]; }
  $pb = $P(fn($x, $y) => $x > 0 && $y > 0); $mk['btts'] = [['Y', vf_odd($pb)], ['N', vf_odd(1 - $pb)]];
  if ($min < 45) { // mi-temps : buts restants avant la 45e
    $rh = max(0.0, (45 - $min) / 90);
    $Mh = vf_matrix($lh, $la, $hh, $ha, $rh);
    $Q = static function (callable $f) use ($Mh): float { $s = 0.0; foreach ($Mh as [$x, $y, $p]) if ($f($x, $y)) $s += $p; return $s; };
    $mk['ht1x2'] = [['H', vf_odd($Q(fn($x, $y) => $x > $y))], ['D', vf_odd($Q(fn($x, $y) => $x === $y))], ['A', vf_odd($Q(fn($x, $y) => $x < $y))]];
    foreach (['0.5', '1.5'] as $L) { $po = $Q(fn($x, $y) => $x + $y > (float) $L); $mk['htou:' . $L] = [['O', vf_odd($po)], ['U', vf_odd(1 - $po)]]; }
  }
  /* 2026-11-28 (propriétaire : « victoire 1re / 2e mi-temps et d'autres options simples, sans triche, toujours notre marge ») :
     toutes réglées avec le seul score final + mi-temps (sb_settle_mk) → jamais de remboursement. Même modèle, même marge. */
  $res = static fn(int $x, int $y): string => $x > $y ? 'H' : ($x === $y ? 'D' : 'A');
  // 2e mi-temps : buts marqués après la 45e seulement
  $M2 = $min < 45 ? vf_matrix($lh, $la, 0, 0, 0.5) : vf_matrix($lh, $la, $h - $hh, $a - $ha, $r);
  $P2 = static function (callable $f) use ($M2): float { $s = 0.0; foreach ($M2 as [$x, $y, $p]) if ($f($x, $y)) $s += $p; return $s; };
  $mk['2h1x2'] = [['H', vf_odd($P2(fn($x, $y) => $x > $y))], ['D', vf_odd($P2(fn($x, $y) => $x === $y))], ['A', vf_odd($P2(fn($x, $y) => $x < $y))]];
  // mi-temps / fin du match (H/H, H/D …)
  $hf = [];
  if ($min < 45) { foreach ($Mh as [$x1, $y1, $p1]) foreach ($M2 as [$x2, $y2, $p2]) { $k = $res($x1, $y1) . '/' . $res($x1 + $x2, $y1 + $y2); $hf[$k] = ($hf[$k] ?? 0) + $p1 * $p2; } }
  else { $k1 = $res($hh, $ha); foreach ($M as [$x, $y, $p]) { $k = $k1 . '/' . $res($x, $y); $hf[$k] = ($hf[$k] ?? 0) + $p; } }
  $mk['htft'] = []; foreach (['H', 'D', 'A'] as $u) foreach (['H', 'D', 'A'] as $v) if (isset($hf[$u . '/' . $v])) $mk['htft'][] = [$u . '/' . $v, vf_odd($hf[$u . '/' . $v])];
  // score exact (0 à 4 buts par équipe), pair / impair, buts de chaque équipe
  $cs = []; foreach ($M as [$x, $y, $p]) if ($x <= 4 && $y <= 4) $cs[$x . ':' . $y] = ($cs[$x . ':' . $y] ?? 0) + $p;
  ksort($cs, SORT_NATURAL); $mk['cs'] = []; foreach ($cs as $k => $p) $mk['cs'][] = [$k, vf_odd($p)];
  $pod = $P(fn($x, $y) => ($x + $y) % 2 === 1); $mk['oe'] = [['O', vf_odd($pod)], ['E', vf_odd(1 - $pod)]];
  foreach (['0.5', '1.5'] as $L) {
    $ph = $P(fn($x, $y) => $x > (float) $L); $mk['tth:' . $L] = [['O', vf_odd($ph)], ['U', vf_odd(1 - $ph)]];
    $pa = $P(fn($x, $y) => $y > (float) $L); $mk['tta:' . $L] = [['O', vf_odd($pa)], ['U', vf_odd(1 - $pa)]];
  }
  foreach ($mk as $k => $os) { $mk[$k] = array_values(array_filter($os, static fn($o) => $o[1] !== null)); if (!$mk[$k]) unset($mk[$k]); }
  return ['live' => $live, 'mk' => $mk];
}

/* ---------- résultats, classement ---------- */
/** Score final (et mi-temps) d'un match terminé ; null s'il n'est pas fini à l'instant t. */
function vf_result(int $g, int $i, int $t): ?array {
  if ($t < vf_ko($g) + VF_MATCH) return null;
  $h = 0; $a = 0; $hh = 0; $ha = 0;
  foreach (vf_draw($g, $i) as $e) { if ($e['s'] === 'h') { $h++; if ($e['m'] <= 45) $hh++; } else { $a++; if ($e['m'] <= 45) $ha++; } }
  return ['ft' => [$h, $a], 'ht' => [$hh, $ha]];
}
/** Classement de la saison de la journée g, avec les journées TERMINÉES à l'instant t (cache par saison). */
function vf_table(int $g, int $t): array {
  $S = vf_season($g); [$nT, $R, $b, $o] = vf_cfg($g); $g0 = $b + ($S - $o) * $R;
  $dir = rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'sports'; if (!is_dir($dir)) @mkdir($dir, 0750, true);
  $f = $dir . DIRECTORY_SEPARATOR . 'vf_table.json';
  $c = is_file($f) ? json_decode((string) @file_get_contents($f), true) : null;
  if (!is_array($c) || (int) ($c['S'] ?? -1) !== $S) $c = ['S' => $S, 'done' => -1, 'tb' => array_fill_keys(vf_cfg($g)[4], [0, 0, 0, 0, 0, 0, ''])];
  $chg = false;
  for ($k = (int) $c['done'] + 1; $g0 + $k <= $g && $k < $R; $k++) {
    $gg = $g0 + $k;
    if ($t < vf_ko($gg) + VF_MATCH) break;
    foreach (vf_fixtures($gg) as $i => [$h, $a]) {
      $r = vf_result($gg, $i, $t)['ft'];
      foreach ([[$h, $r[0], $r[1]], [$a, $r[1], $r[0]]] as [$tm, $gf, $ga]) {
        $row = $c['tb'][$tm];
        $row[0]++; $row[4] += $gf; $row[5] += $ga;
        if ($gf > $ga) { $row[1]++; $row[6] .= 'V'; } elseif ($gf === $ga) { $row[2]++; $row[6] .= 'N'; } else { $row[3]++; $row[6] .= 'D'; }
        $row[6] = substr($row[6], -5);
        $c['tb'][$tm] = $row;
      }
    }
    $c['done'] = $k; $chg = true;
  }
  if ($chg) { $tmp = $f . '.' . getmypid(); @file_put_contents($tmp, json_encode($c), LOCK_EX); @rename($tmp, $f); }
  $out = [];
  foreach ($c['tb'] as $tm => $row) $out[] = ['t' => $tm, 'j' => $row[0], 'v' => $row[1], 'n' => $row[2], 'd' => $row[3], 'bp' => $row[4], 'bc' => $row[5], 'pts' => $row[1] * 3 + $row[2], 'f' => $row[6]];
  usort($out, static fn($x, $y) => [$y['pts'], $y['bp'] - $y['bc'], $y['bp'], $x['t']] <=> [$x['pts'], $x['bp'] - $x['bc'], $x['bp'], $y['t']]);
  return ['S' => $S + 1, 'played' => (int) $c['done'] + 1, 'rows' => $out];
}

/* ---------- historique depuis le lancement (statistiques des joueurs) ---------- */
/** Tous les matchs TERMINÉS depuis la journée 0 : totaux, fiche de chaque équipe, derniers face-à-face (cache incrémental). */
function vf_hist(int $t): array {
  $dir = rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'sports'; if (!is_dir($dir)) @mkdir($dir, 0750, true);
  $f = $dir . DIRECTORY_SEPARATOR . 'vf_hist.json';
  $c = is_file($f) ? json_decode((string) @file_get_contents($f), true) : null;
  if (!is_array($c) || (int) ($c['v'] ?? 0) !== 1) $c = ['v' => 1, 'done' => -1, 'n' => 0, 'g' => 0, 'r' => [0, 0, 0], 'o25' => 0, 'bt' => 0, 'nil' => 0, 'tm' => [], 'hh' => []];
  $chg = false;
  // fiche équipe : [joués, V, N, D, bp, bc, +2,5, les 2 marquent, sans encaisser, dom J, dom pts, ext J, ext pts, forme (10 derniers)]
  for ($g = (int) $c['done'] + 1; $t >= vf_ko($g) + VF_MATCH && $g < (int) $c['done'] + 400; $g++) {
    foreach (vf_fixtures($g) as $i => [$h, $a]) {
      $r = vf_result($g, $i, $t); if (!$r) continue;
      [$x, $y] = $r['ft'];
      $c['n']++; $c['g'] += $x + $y; $c['r'][$x > $y ? 0 : ($x === $y ? 1 : 2)]++;
      if ($x + $y > 2) $c['o25']++; if ($x && $y) $c['bt']++; if (!$x && !$y) $c['nil']++;
      foreach ([[$h, $x, $y, true], [$a, $y, $x, false]] as [$tm, $gf, $ga, $home]) {
        $T = $c['tm'][$tm] ?? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ''];
        $pts = $gf > $ga ? 3 : ($gf === $ga ? 1 : 0);
        $T[0]++; $T[$gf > $ga ? 1 : ($gf === $ga ? 2 : 3)]++; $T[4] += $gf; $T[5] += $ga;
        if ($gf + $ga > 2) $T[6]++; if ($gf && $ga) $T[7]++; if (!$ga) $T[8]++;
        if ($home) { $T[9]++; $T[10] += $pts; } else { $T[11]++; $T[12] += $pts; }
        $T[13] = substr($T[13] . ($gf > $ga ? 'V' : ($gf === $ga ? 'N' : 'D')), -10);
        $c['tm'][$tm] = $T;
      }
      $k = min($h, $a) . '-' . max($h, $a);
      $c['hh'][$k] = array_slice(array_merge($c['hh'][$k] ?? [], [[$g, $h, $a, $x, $y]]), -5);
    }
    $c['done'] = $g; $chg = true;
  }
  if ($chg) { $tmp = $f . '.' . getmypid(); @file_put_contents($tmp, json_encode($c), LOCK_EX); @rename($tmp, $f); }
  return $c;
}

/* ---------- paiement juste après chaque journée (propriétaire : « payer rapidement les joueurs ») ---------- */
/** Une journée virtuelle vient de finir : règlement des coupons tout de suite (une seule fois par journée, sous verrou). */
function vf_settle_due(): void {
  if (!function_exists('sp_resolve') || !function_exists('load_db')) return;
  $t = vf_now(); $g = vf_slot($t); $last = $t >= vf_ko($g) + VF_MATCH ? $g : $g - 1;
  if ($last < 0) return;
  $dir = rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'sports'; if (!is_dir($dir)) @mkdir($dir, 0750, true);
  $f = $dir . DIRECTORY_SEPARATOR . 'vf_paid.at';
  if ((int) @file_get_contents($f) >= $last) return;
  $lk = @fopen($f . '.lock', 'c'); if (!$lk || !flock($lk, LOCK_EX | LOCK_NB)) { if ($lk) fclose($lk); return; }
  try {
    if ((int) @file_get_contents($f) >= $last) return;
    @file_put_contents($f, (string) $last, LOCK_EX); // posé AVANT : jamais deux règlements pour la même journée
    $db = load_db(); if (is_array($db)) sp_resolve($db);
  } finally { flock($lk, LOCK_UN); fclose($lk); }
}

/* ---------- vue envoyée au téléphone ---------- */
function vf_id(int $g, int $i): int { return $g * 100 + $i; }
function vf_split(int $id): array { return [intdiv($id, 100), $id % 100]; }
function vf_view(int $t = 0, bool $lite = false): array {
  $t = $t ?: vf_now();
  $g = vf_slot($t);
  $cur = $t < vf_ko($g) + VF_MATCH ? $g : null; // journée en cours (10 premières minutes du créneau)
  $days = []; $H = vf_hist($t);
  foreach (array_filter([$cur, $g + 1], static fn($x) => $x !== null) as $gg) {
    $rows = [];
    foreach (vf_fixtures($gg) as $i => [$h, $a]) {
      $m = vf_markets($gg, $i, $t);
      $row = ['id' => vf_id($gg, $i), 'h' => $h, 'a' => $a];
      if ($gg === $cur) { $st = vf_state($gg, $i, $t); $row += ['sc' => [$st['h'], $st['a']], 'min' => $st['min'], 'gl' => $st['goals']]; }
      $row['mk'] = $m ? $m['mk'] : null;
      $hk = min($h, $a) . '-' . max($h, $a); if (!empty($H['hh'][$hk])) $row['hh'] = array_reverse($H['hh'][$hk]);
      $rows[] = $row;
    }
    $days[] = ['g' => $gg, 'j' => vf_round($gg) + 1, 'S' => vf_season($gg) + 1, 'ko' => vf_ko($gg), 'live' => $gg === $cur, 'fx' => $rows] + (vf_ht($gg) ? ['hp' => [VF_H1, VF_H2]] : []);
  }
  if ($lite) return ['ok' => true, 'lite' => 1, 'now' => $t, 'slot' => VF_SLOT, 'match' => VF_MATCH, 'close' => VF_CLOSE, 'days' => array_map(static function ($d) { $d['fx'] = array_map(static function ($f) { unset($f['hh']); return $f; }, $d['fx']); return $d; }, $days)];
  $res = [];
  for ($gg = ($cur === null ? $g : $g - 1), $n = 0; $n < 8 && $gg >= 0; $gg--, $n++) {
    $rows = [];
    foreach (vf_fixtures($gg) as $i => [$h, $a]) { $r = vf_result($gg, $i, $t); if ($r) $rows[] = ['h' => $h, 'a' => $a, 'ft' => $r['ft'], 'ht' => $r['ht']]; }
    if ($rows) $res[] = ['g' => $gg, 'j' => vf_round($gg) + 1, 'S' => vf_season($gg) + 1, 'ko' => vf_ko($gg), 'fx' => $rows];
  }
  return ['ok' => true, 'now' => $t, 'slot' => VF_SLOT, 'match' => VF_MATCH, 'close' => VF_CLOSE, 'days' => $days, 'res' => $res, 'tb' => vf_table($cur ?? $g, $t),
    'hs' => ['n' => $H['n'], 'g' => $H['g'], 'r' => $H['r'], 'o25' => $H['o25'], 'bt' => $H['bt'], 'nil' => $H['nil'], 'tm' => $H['tm'], 'since' => VF_EPOCH]];
}
function vf_teams(): array { return array_map(static fn($r) => ['n' => $r[0], 'p' => $r[1] === 'p' ? 1 : 0, 'c' => $r[3], 'cc' => $r[4]] + (isset($r[5]) ? ['c2' => $r[5]] : []), VF_TEAMS); }

/* ---------- branchement sur les paris (sb_pick / sb_sel_result) ---------- */
function vf_pick(string $id, string $mk, string $k, int $now): array {
  if (!ctype_digit($id)) return ['ok' => false, 'reason' => 'param'];
  [$g, $i] = vf_split((int) $id);
  $fx = vf_fixtures($g)[$i] ?? null;
  if (!$fx || $g < vf_slot($now) - 1 || $g > vf_slot($now) + 1) return ['ok' => false, 'reason' => 'closed'];
  $m = vf_markets($g, $i, $now);
  if (!$m) return ['ok' => false, 'reason' => 'closed'];
  $odd = null; foreach ((array) ($m['mk'][$mk] ?? []) as $o) if ((string) $o[0] === $k) $odd = (float) $o[1];
  if ($odd === null) return ['ok' => false, 'reason' => isset($m['mk'][$mk]) ? 'closed' : 'param'];
  $home = VF_TEAMS[$fx[0]][0]; $away = VF_TEAMS[$fx[1]][0];
  $kn = sb_k_name($mk, $k, $home, $away);
  $sel = ['ev' => 'sb:virt:' . $id . ':' . $mk, 'k' => $k, 'odd' => $odd, 't' => $home . ' - ' . $away, 'l' => $mk === '1x2' ? $kn : sb_mk_name($mk) . ' : ' . $kn,
    'mk' => $mk, 'sp' => 'virt', 'fx' => 'virt:' . $id, 'ko' => vf_ko($g), 'ti' => [$fx[0], $fx[1]], 'vf' => 1];
  if ($m['live']) { $st = vf_state($g, $i, $now); $sel['lv'] = 1; $sel['sc'] = [$st['h'], $st['a']]; $sel['m'] = $st['min']; }
  return ['ok' => true, 'grp' => 'fx:virt:' . $id, 'sel' => $sel, 'team' => ['h' => ['n' => $home], 'a' => ['n' => $away]]];
}
function vf_sel_result(string $id, string $mk, array $sel, int $betAt, int $now): ?string {
  if (!ctype_digit($id)) return null;
  [$g, $i] = vf_split((int) $id);
  $fx = vf_fixtures($g)[$i] ?? null; if (!$fx) return null;
  if (isset($sel['ti']) && array_map('intval', (array) $sel['ti']) !== [$fx[0], $fx[1]]) return null; // jamais deviner
  $r = vf_result($g, $i, $now); if (!$r) return null;
  if (empty($sel['lv']) && $betAt >= vf_ko($g) - VF_CLOSE + 2) return 'void'; // avant-match posé trop tard (sécurité)
  if (!empty($sel['lv']) && $betAt >= vf_ko($g) + VF_MATCH) return 'void';
  return sb_settle_mk($mk, (string) ($sel['k'] ?? ''), $r['ft'], $r['ht'], null);
}
