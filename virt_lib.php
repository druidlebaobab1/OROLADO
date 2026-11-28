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
const VF_LIVE_END = 85;        // paris en direct jusqu'à la 85e minute
const VF_GOAL_LOCK = 12;       // marchés suspendus 12 s après un but
const VF_MARGE = 0.08;         // marge maison des matchs virtuels (propriétaire : 8 %)
const VF_ROUNDS = 55;          // 56 équipes → 55 journées (matchs aller)

/** Équipes : [nom, type p (pays) | c (ville d'un grand club), force 60-95, couleur, code pays ISO (pays)]. */
const VF_TEAMS = [
  ['Brésil', 'p', 91, '#FACC15', 'br'], ['Argentine', 'p', 92, '#7DD3FC', 'ar'], ['France', 'p', 91, '#2563EB', 'fr'], ['Angleterre', 'p', 89, '#F8FAFC', 'gb'],
  ['Espagne', 'p', 90, '#DC2626', 'es'], ['Portugal', 'p', 88, '#B91C1C', 'pt'], ['Allemagne', 'p', 87, '#E5E7EB', 'de'], ['Italie', 'p', 86, '#1D4ED8', 'it'],
  ['Pays-Bas', 'p', 86, '#F97316', 'nl'], ['Belgique', 'p', 84, '#B91C1C', 'be'], ['Croatie', 'p', 84, '#EF4444', 'hr'], ['Uruguay', 'p', 83, '#38BDF8', 'uy'],
  ['Colombie', 'p', 82, '#FACC15', 'co'], ['Mexique', 'p', 80, '#16A34A', 'mx'], ['États-Unis', 'p', 79, '#1E3A8A', 'us'], ['Japon', 'p', 81, '#1E40AF', 'jp'],
  ['Corée du Sud', 'p', 78, '#DC2626', 'kr'], ['Chine', 'p', 68, '#DC2626', 'cn'], ['Arabie saoudite', 'p', 72, '#15803D', 'sa'], ['Maroc', 'p', 86, '#B91C1C', 'ma'],
  ['Sénégal', 'p', 84, '#16A34A', 'sn'], ['Côte d\'Ivoire', 'p', 83, '#F97316', 'ci'], ['Nigeria', 'p', 81, '#16A34A', 'ng'], ['Égypte', 'p', 80, '#DC2626', 'eg'],
  ['Cameroun', 'p', 78, '#15803D', 'cm'], ['Algérie', 'p', 79, '#16A34A', 'dz'], ['Ghana', 'p', 76, '#FACC15', 'gh'], ['Afrique du Sud', 'p', 74, '#FACC15', 'za'],
  ['Madrid', 'c', 93, '#F8FAFC', ''], ['Barcelone', 'c', 90, '#1E3A8A', ''], ['Séville', 'c', 80, '#DC2626', ''], ['Manchester', 'c', 91, '#7DD3FC', ''],
  ['Liverpool', 'c', 90, '#DC2626', ''], ['Londres', 'c', 89, '#EF4444', ''], ['Newcastle', 'c', 83, '#111827', ''], ['Munich', 'c', 91, '#DC2626', ''],
  ['Dortmund', 'c', 84, '#FACC15', ''], ['Leverkusen', 'c', 85, '#DC2626', ''], ['Milan', 'c', 86, '#B91C1C', ''], ['Turin', 'c', 84, '#F8FAFC', ''],
  ['Rome', 'c', 82, '#B45309', ''], ['Naples', 'c', 85, '#38BDF8', ''], ['Paris', 'c', 90, '#1E3A8A', ''], ['Marseille', 'c', 82, '#7DD3FC', ''],
  ['Monaco', 'c', 81, '#DC2626', ''], ['Lille', 'c', 82, '#DC2626', ''], ['Lyon', 'c', 79, '#2563EB', ''], ['Amsterdam', 'c', 82, '#DC2626', ''],
  ['Lisbonne', 'c', 83, '#DC2626', ''], ['Porto', 'c', 82, '#2563EB', ''], ['Istanbul', 'c', 80, '#FACC15', ''], ['Le Caire', 'c', 76, '#DC2626', ''],
  ['Casablanca', 'c', 75, '#16A34A', ''], ['Abidjan', 'c', 72, '#F97316', ''], ['Dakar', 'c', 72, '#16A34A', ''], ['Johannesburg', 'c', 73, '#FACC15', ''],
];

function vf_now(): int { return function_exists('sb_now') ? sb_now() : time(); }
function vf_n(): int { return count(VF_TEAMS); }
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
function vf_season(int $g): int { return intdiv($g, VF_ROUNDS); }
function vf_round(int $g): int { return $g % VF_ROUNDS; }

/** Ordre des équipes de la saison (public : calendrier) puis tableau « en cercle » → 28 matchs de la journée g. */
function vf_fixtures(int $g): array {
  static $cache = [];
  if (isset($cache[$g])) return $cache[$g];
  $S = vf_season($g); $r = vf_round($g); $n = vf_n();
  $ord = range(0, $n - 1);
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
  return (int) floor($d * 90 / VF_MATCH);
}
/** Instant réel d'un but de la minute m. */
function vf_goal_at(int $g, int $m): int { return vf_ko($g) + (int) ceil($m * VF_MATCH / 90); }
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
  return ['min' => $min, 'h' => $h, 'a' => $a, 'hh' => $hh, 'ha' => $ha, 'last' => $last, 'goals' => $goals, 'end' => $t >= vf_ko($g) + VF_MATCH];
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
  $S = vf_season($g); $g0 = $S * VF_ROUNDS;
  $dir = rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'sports'; if (!is_dir($dir)) @mkdir($dir, 0750, true);
  $f = $dir . DIRECTORY_SEPARATOR . 'vf_table.json';
  $c = is_file($f) ? json_decode((string) @file_get_contents($f), true) : null;
  if (!is_array($c) || (int) ($c['S'] ?? -1) !== $S) $c = ['S' => $S, 'done' => -1, 'tb' => array_fill(0, vf_n(), [0, 0, 0, 0, 0, 0, ''])];
  $chg = false;
  for ($k = (int) $c['done'] + 1; $g0 + $k <= $g && $k < VF_ROUNDS; $k++) {
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

/* ---------- vue envoyée au téléphone ---------- */
function vf_id(int $g, int $i): int { return $g * 100 + $i; }
function vf_split(int $id): array { return [intdiv($id, 100), $id % 100]; }
function vf_view(int $t = 0): array {
  $t = $t ?: vf_now();
  $g = vf_slot($t);
  $cur = $t < vf_ko($g) + VF_MATCH ? $g : null; // journée en cours (10 premières minutes du créneau)
  $days = [];
  foreach (array_filter([$cur, $g + 1]) as $gg) {
    $rows = [];
    foreach (vf_fixtures($gg) as $i => [$h, $a]) {
      $m = vf_markets($gg, $i, $t);
      $row = ['id' => vf_id($gg, $i), 'h' => $h, 'a' => $a];
      if ($gg === $cur) { $st = vf_state($gg, $i, $t); $row += ['sc' => [$st['h'], $st['a']], 'min' => $st['min'], 'gl' => $st['goals']]; }
      $row['mk'] = $m ? $m['mk'] : null;
      $rows[] = $row;
    }
    $days[] = ['g' => $gg, 'j' => vf_round($gg) + 1, 'S' => vf_season($gg) + 1, 'ko' => vf_ko($gg), 'live' => $gg === $cur, 'fx' => $rows];
  }
  $res = [];
  for ($gg = ($cur === null ? $g : $g - 1), $n = 0; $n < 4 && $gg >= 0; $gg--, $n++) {
    $rows = [];
    foreach (vf_fixtures($gg) as $i => [$h, $a]) { $r = vf_result($gg, $i, $t); if ($r) $rows[] = ['h' => $h, 'a' => $a, 'ft' => $r['ft'], 'ht' => $r['ht']]; }
    if ($rows) $res[] = ['g' => $gg, 'j' => vf_round($gg) + 1, 'S' => vf_season($gg) + 1, 'ko' => vf_ko($gg), 'fx' => $rows];
  }
  return ['ok' => true, 'now' => $t, 'slot' => VF_SLOT, 'match' => VF_MATCH, 'close' => VF_CLOSE, 'days' => $days, 'res' => $res, 'tb' => vf_table($cur ?? $g, $t)];
}
function vf_teams(): array { return array_map(static fn($r) => ['n' => $r[0], 'p' => $r[1] === 'p' ? 1 : 0, 'c' => $r[3], 'cc' => $r[4]], VF_TEAMS); }

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
