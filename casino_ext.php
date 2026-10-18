<?php
declare(strict_types=1);
/**
 * v2804 (propriétaire) — MOTEUR DES NOUVEAUX JEUX (beaucoup de jeux sans réécrire l'argent à chaque fois).
 *
 * Chaque nouveau jeu est DÉCRIT par une petite fiche (fichiers casino_ext/<groupe>.php qui renvoient [clé => fiche]).
 * Le serveur tire tout (random_int) et paie avec les mêmes fonctions éprouvées que les autres jeux (casino_debit,
 * casino_credit, casino_finish, casino_stat, casino_hist_add). Trois sortes de fiches :
 *
 *  - 'table' : jeu instantané à tableau de gains — 'out' => [[multiplicateur, poids], …]. Le serveur tire une ligne
 *              selon les poids ; le navigateur dessine la scène de cette ligne (view.i).
 *  - 'pick'  : le joueur choisit une option (p.pick) — 'opts' => [chance, …] (total 1). Le serveur tire l'option gagnante
 *              selon les chances ; gain = 0,94 ÷ chance de l'option choisie (view.w = option gagnante).
 *  - 'skill' : jeu « où tu contrôles » en MODE MIXTE (comme Aviator) — le multiplicateur monte avec le temps
 *              (×e^(rate·s)) ; le serveur a tiré EN SECRET au départ le moment où la partie s'arrête (même loi que
 *              l'avion : retour 94 %). L'adresse du joueur sert à éviter les obstacles (une faute = partie perdue) et
 *              à choisir quand encaisser. Un navigateur trafiqué ne peut pas gagner plus : le serveur ne paie que si
 *              l'encaissement arrive AVANT le moment secret, au multiplicateur de SON horloge.
 *
 * SÉCURITÉ : au chargement, chaque fiche 'table' / 'pick' est vérifiée — si le retour aux joueurs dépasse 94,5 %,
 * la fiche est ignorée (le jeu n'existe pas). Les clés déjà prises par les anciens jeux sont refusées.
 */

const CASINO_EXT_RTP_MAX = 0.945;
const CASINO_SKILL_MAX_S = 180.0; // une partie « où tu contrôles » dure au plus 3 minutes

/** Toutes les fiches valides (chargées une seule fois). */
function casino_ext_defs(): array {
  static $defs = null;
  if ($defs !== null) return $defs;
  $defs = [];
  foreach (glob(__DIR__ . '/casino_ext/*.php') ?: [] as $f) {
    $list = (static function (string $f) { return include $f; })($f);
    if (!is_array($list)) continue;
    foreach ($list as $k => $d) {
      $k = (string) $k;
      if (!preg_match('/^[a-z][a-z0-9]{1,15}$/', $k) || in_array($k, CASINO_GAMES, true) || isset($defs[$k]) || !is_array($d)) continue;
      $ok = casino_ext_check($d);
      if ($ok !== true) { error_log('OROLADO casino_ext: fiche ' . $k . ' ignorée (' . $ok . ')'); continue; }
      $defs[$k] = $d;
    }
  }
  return $defs;
}
/** true si la fiche est sûre, sinon la raison. */
function casino_ext_check(array $d) {
  $t = (string) ($d['type'] ?? '');
  if ($t === 'table') {
    $out = (array) ($d['out'] ?? []); $w = 0.0; $ev = 0.0;
    if (count($out) < 2 || count($out) > 200) return 'table : 2 à 200 lignes';
    foreach ($out as $o) {
      if (!is_array($o) || count($o) < 2) return 'table : ligne invalide';
      $m = (float) $o[0]; $p = (float) $o[1];
      if ($m < 0 || $m > 10000 || $p <= 0) return 'table : multiplicateur ou poids invalide';
      $w += $p; $ev += $m * $p;
    }
    return $ev / $w <= CASINO_EXT_RTP_MAX ? true : sprintf('table : retour %.2f %% > 94,5 %%', $ev / $w * 100);
  }
  if ($t === 'pick') {
    $opts = array_map('floatval', (array) ($d['opts'] ?? []));
    if (count($opts) < 2 || count($opts) > 60) return 'pick : 2 à 60 options';
    foreach ($opts as $p) if ($p <= 0 || $p >= 1) return 'pick : chance invalide';
    return abs(array_sum($opts) - 1) < 1e-6 ? true : 'pick : total des chances ≠ 1';
  }
  if ($t === 'skill') {
    $r = (float) ($d['rate'] ?? 0);
    return $r >= 0.03 && $r <= 0.4 ? true : 'skill : rate entre 0,03 et 0,4';
  }
  return 'type inconnu';
}
function casino_ext_type(string $g): string { $d = casino_ext_defs()[$g] ?? null; return $d ? (string) $d['type'] : ''; }
function casino_ext_keys(): array { return array_keys(casino_ext_defs()); }
/** Noms affichés dans l'admin (fiche 'name'). */
function casino_ext_names(): array { $o = []; foreach (casino_ext_defs() as $k => $d) $o[$k] = (string) ($d['name'] ?? $k); return $o; }
/** Gain ÷ mise d'une option 'pick' (0,94 ÷ chance, arrondi vers le bas). */
function casino_ext_pick_mult(float $p): float { return floor(CASINO_EDGE / $p * 100) / 100; }

/** Jeu instantané ('table' ou 'pick') : ['mult', 'view'] ou ['err']. */
function casino_ext_instant(string $g, array $p): array {
  $d = casino_ext_defs()[$g] ?? null;
  if (!$d) return ['err' => 'game'];
  if ($d['type'] === 'table') {
    $tot = 0; foreach ($d['out'] as $o) $tot += (int) round((float) $o[1] * 1000000);
    $r = random_int(1, max(1, $tot)); $acc = 0; $i = 0;
    foreach ($d['out'] as $j => $o) { $acc += (int) round((float) $o[1] * 1000000); if ($r <= $acc) { $i = $j; break; } }
    return ['mult' => (float) $d['out'][$i][0], 'view' => ['i' => $i]];
  }
  if ($d['type'] === 'pick') {
    $opts = array_map('floatval', $d['opts']); $n = count($opts);
    if (!isset($p['pick']) || !preg_match('/^\d{1,2}$/', (string) $p['pick']) || (int) $p['pick'] >= $n) return ['err' => 'param'];
    $pick = (int) $p['pick'];
    $r = random_int(1, 1000000000) / 1000000000; $acc = 0.0; $w = $n - 1;
    foreach ($opts as $j => $q) { $acc += $q; if ($r <= $acc) { $w = $j; break; } }
    return ['mult' => $w === $pick ? casino_ext_pick_mult($opts[$pick]) : 0.0, 'view' => ['w' => $w, 'pick' => $pick]];
  }
  return ['err' => 'game'];
}

/* ------------------------------------------------------------------ mode mixte « où tu contrôles » */
function casino_skill_rate(string $g): float { return (float) (casino_ext_defs()[$g]['rate'] ?? 0.1); }
/** Multiplicateur après $s secondes de jeu (arrondi vers le bas, au centième). */
function casino_skill_mult(string $g, float $s): float { return max(1.0, floor(exp(casino_skill_rate($g) * max(0.0, $s)) * 100) / 100); }
/** Secondes de jeu pour atteindre le multiplicateur $c. */
function casino_skill_secs(string $g, float $c): float { return $c <= 1.0 ? 0.0 : log($c) / casino_skill_rate($g); }

/** Ce que le navigateur peut voir (le moment secret n'apparaît qu'une fois la partie finie). */
function casino_skill_public(string $g, array $st, float $now): array {
  $o = ['game' => $g, 'mode' => (string) $st['mode'], 'stake' => (float) $st['stake'], 'done' => !empty($st['done']) ? 1 : 0, 'win' => (float) ($st['win'] ?? 0),
    't0' => (float) $st['t0'], 'rate' => casino_skill_rate($g), 'ref' => substr(hash('sha256', (string) $st['ref']), 0, 10)];
  if (!empty($st['done'])) { $o['c'] = (float) $st['c']; $o['out'] = (float) ($st['out'] ?? 0); $o['why'] = (string) ($st['why'] ?? ''); }
  return $o;
}
/** Règle la partie si le moment secret est passé (ou si elle a dépassé 3 minutes). */
function casino_skill_settle(array $db, string $uid, string $file, string $g, float $now): ?array {
  $r = casino_with($file, static function (array &$st) use ($g, $now) {
    $x = $st['g'][$g] ?? null;
    if (!is_array($x) || !empty($x['done'])) return $x;
    $el = $now - (float) $x['t0'];
    if ($el < casino_skill_secs($g, (float) $x['c']) && $el < CASINO_SKILL_MAX_S) return $x;
    $x['done'] = 1; $x['out'] = 0; $x['win'] = 0.0; $x['why'] = 'end';
    $st['g'][$g] = $x;
    return $x;
  });
  if (is_array($r) && !empty($r['done']) && empty($r['paid'])) casino_finish($db, $uid, $g, $r, $now);
  return $r;
}
/** Actions : start (mise) · state (où en est la partie) · cash (encaisser) · fail (le joueur a raté un obstacle). */
function casino_skill_act(array $db, array $user, string $g, string $act, string $mode, float $stake, array $p): array {
  $uid = (string) ($user['id'] ?? '');
  if ($uid === '') return ['ok' => false, 'reason' => 'login'];
  $file = casino_user_file($uid);
  $now = microtime(true);
  $cur = casino_skill_settle($db, $uid, $file, $g, $now);
  if ($act === 'start') {
    if (is_array($cur) && !empty($cur['done']) && empty($cur['paid'])) {
      $fin = casino_finish($db, $uid, $g, $cur, $now);
      if (($fin['bal'] ?? null) === null && $cur['mode'] === 'real' && (float) ($cur['win'] ?? 0) > 0) return ['ok' => false, 'reason' => 'unavailable'];
    }
    if (is_array($cur) && empty($cur['done'])) return ['ok' => true, 'resume' => 1, 'now' => $now] + casino_skill_public($g, $cur, $now);
    $stake = floor($stake * 100 + 1e-6) / 100;
    if ($e = casino_check_stake($stake, $g)) return ['ok' => false, 'reason' => $e];
    $mode = casino_mode($mode, false, $user);
    $ref = 'cs_' . bin2hex(random_bytes(9));
    $deb = casino_debit($db, $uid, $mode, $stake, $ref);
    if (empty($deb['ok'])) return ['ok' => false, 'reason' => $deb['reason'] ?? 'unavailable'];
    $x = ['ref' => $ref, 'mode' => $mode, 'stake' => $stake, 't0' => $now, 'c' => casino_crash_point(), 'done' => 0];
    casino_with($file, static function (array &$st) use ($g, $x) { $st['g'][$g] = $x; return true; });
    return ['ok' => true, 'now' => $now, 'bal' => $mode === 'demo' ? ($deb['demo'] ?? null) : ($deb['real'] ?? null)] + casino_skill_public($g, $x, $now);
  }
  if (!is_array($cur)) return ['ok' => false, 'reason' => 'noGame'];
  if (!empty($cur['done'])) return empty($cur['paid']) ? casino_finish($db, $uid, $g, $cur, $now) : (['ok' => true, 'now' => $now] + casino_skill_public($g, $cur, $now));
  if ($act === 'state') return ['ok' => true, 'now' => $now] + casino_skill_public($g, $cur, $now);
  if ($act === 'cash' || $act === 'fail') {
    $r = casino_with($file, static function (array &$st) use ($g, $now, $act) {
      $x = $st['g'][$g] ?? null;
      if (!is_array($x) || !empty($x['done'])) return $x;
      $m = casino_skill_mult($g, $now - (float) $x['t0']);
      $x['done'] = 1;
      if ($act === 'cash' && $m < (float) $x['c']) { $x['out'] = $m; $x['win'] = casino_money(min(CASINO_MAX_WIN, (float) $x['stake'] * $m)); $x['why'] = 'cash'; }
      else { $x['out'] = 0; $x['win'] = 0.0; $x['why'] = $act === 'fail' ? 'fail' : 'end'; }
      $st['g'][$g] = $x;
      return $x;
    });
    if (!is_array($r)) return ['ok' => false, 'reason' => 'noGame'];
    return empty($r['paid']) ? casino_finish($db, $uid, $g, $r, $now) : (['ok' => true, 'now' => $now] + casino_skill_public($g, $r, $now));
  }
  return ['ok' => false, 'reason' => 'param'];
}
