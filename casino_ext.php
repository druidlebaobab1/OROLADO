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
const CASINO_EXT_MAX_MULT = 50.0; // 2026-11-28 (propriétaire : « enlève les ×300, maximum ×50 ») : machines du casino, plus aucun gain au-delà de ×50
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
      if (($d['type'] ?? '') === 'table') $d = casino_ext_house($d); // 2026-11-28 : marge 15 %, gros gains bien plus rares
      $defs[$k] = $d;
    }
  }
  return $defs;
}
/**
 * 2026-11-28 (propriétaire : « marge 15 % sur tous les jeux casino, et réduis fortement les gros gains ») — appliqué à chaque fiche
 * 'table' au chargement (le navigateur ne dessine que la ligne tirée : rien à changer chez lui) :
 *   1) gros gains bien plus rares : poids ÷ 6 pour ×40 et plus, ÷ 3 pour ×15 à ×40, ÷ 1,5 pour ×5 à ×15 ;
 *   2) la ligne « perdu » (×0) grandit pour que le retour aux joueurs soit exactement CASINO_EDGE (85 %).
 * Fiche sans ligne ×0 : toutes ses lignes gagnantes sont réduites dans la même proportion, la plus petite absorbe le reste.
 */
function casino_ext_house(array $d): array {
  $src = (array) $d['out'];
  $z = -1; foreach ($src as $j => $o) if ((float) $o[0] <= 0) { $z = $j; break; }
  $mi = 0; foreach ($src as $j => $o) if ((float) $o[0] > 0 && ((float) $src[$mi][0] <= 0 || (float) $o[0] < (float) $src[$mi][0])) $mi = $j;
  // gros gains réduits avec une force t (1 = pleine force) ; on baisse t si la table ne peut pas atteindre 85 % autrement
  $build = static function (float $t) use ($src, $z, $mi) {
    $out = $src;
    foreach ($out as $j => $o) { $m = (float) $o[0]; if ($m <= 0) continue; if ($m > CASINO_EXT_MAX_MULT) { $out[$j][1] = 0.0; continue; } $f = $m >= 40 ? 6.0 : ($m >= 15 ? 3.0 : ($m >= 5 ? 1.5 : 1.0)); $out[$j][1] = (float) $o[1] / (1 + $t * ($f - 1)); } // au-delà de ×50 : jamais tiré
    $Wg = 0.0; $Eg = 0.0; foreach ($out as $j => $o) if ($j !== $z) { $Wg += (float) $o[1]; $Eg += (float) $o[0] * (float) $o[1]; }
    if ($z >= 0) { $wz = $Eg / CASINO_EDGE - $Wg; if ($wz < 0) return null; $out[$z][1] = $wz; return $out; }
    // pas de ligne ×0 : le plus petit gain (s'il est sous 0,85) prend le poids qui ramène le retour à 85 %
    $m0 = (float) $out[$mi][0]; if ($m0 >= CASINO_EDGE) return null;
    $Wo = $Wg - (float) $out[$mi][1]; $Eo = $Eg - $m0 * (float) $out[$mi][1];
    $w0 = ($Eo - CASINO_EDGE * $Wo) / (CASINO_EDGE - $m0); if ($w0 <= 0) return null;
    $out[$mi][1] = $w0; return $out;
  };
  for ($t = 1.0; $t >= -0.001; $t -= 0.05) { $o = $build(max(0.0, $t)); if ($o !== null) { $d['out'] = $o; return $d; } }
  return $d; // (cas impossible : la fiche garde ses poids d'origine, déjà ≤ 94,5 %)
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
    // v2810 : vérifier → retirer → enregistrer sous le verrou du joueur (deux départs simultanés : une seule mise retirée)
    // 2026-11-28 (propriétaire : vidéo publicitaire, il ajoute lui-même « vidéo de démonstration » sur sa pub) — MODE VIDÉO :
    // Trench Defense, COMPTE ADMIN seulement, mise ≤ 1 $, allumé par le téléphone du propriétaire (orolado.com/?video=30) :
    // la partie monte jusqu'au multiplicateur choisi (2 à 100). Joueurs : jamais.
    $vid = (float) ($p['video'] ?? 0);
    if ($vid < 2) { // bouton 🎬 du tableau admin (data/video_mode.json, s'éteint tout seul après 6 h)
      $vf = rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'video_mode.json';
      $vj = is_file($vf) ? (json_decode((string) @file_get_contents($vf), true) ?: []) : [];
      if ((int) ($vj['until'] ?? 0) > time()) $vid = (float) ($vj['x'] ?? 0);
    }
    $vidOn = $g === 'trenchdef' && $vid >= 2 && $vid <= 100 && $stake <= 1.0 && function_exists('orolado_is_admin_user') && orolado_is_admin_user($user);
    return casino_user_lock($uid, static function () use ($db, $uid, $file, $g, $mode, $stake, $now, $vidOn, $vid) {
      $cur = casino_with($file, static fn(array &$st) => $st['g'][$g] ?? null);
      if (is_array($cur) && empty($cur['done'])) return ['ok' => true, 'resume' => 1, 'now' => $now] + casino_skill_public($g, $cur, $now);
      if (is_array($cur) && empty($cur['paid']) && (float) ($cur['win'] ?? 0) > 0) return ['ok' => false, 'reason' => 'unavailable']; // gain pas encore versé
      $ref = 'cs_' . bin2hex(random_bytes(9));
      $deb = casino_debit($db, $uid, $mode, $stake, $ref);
      if (empty($deb['ok'])) return ['ok' => false, 'reason' => $deb['reason'] ?? 'unavailable'];
      $x = ['ref' => $ref, 'mode' => $mode, 'stake' => $stake, 't0' => $now, 'c' => $vidOn ? round($vid * 1.08, 2) : casino_crash_point(), 'done' => 0];
      casino_with($file, static function (array &$st) use ($g, $x) { $st['g'][$g] = $x; return true; });
      return ['ok' => true, 'now' => $now, 'bal' => $mode === 'demo' ? ($deb['demo'] ?? null) : ($deb['real'] ?? null)] + casino_skill_public($g, $x, $now);
    });
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
      if ($act === 'cash' && $m < (float) $x['c']) { $x['out'] = $m; $x['win'] = casino_win((float) $x['stake'], $m); $x['why'] = 'cash'; }
      else { $x['out'] = 0; $x['win'] = 0.0; $x['why'] = $act === 'fail' ? 'fail' : 'end'; }
      $st['g'][$g] = $x;
      return $x;
    });
    if (!is_array($r)) return ['ok' => false, 'reason' => 'noGame'];
    return empty($r['paid']) ? casino_finish($db, $uid, $g, $r, $now) : (['ok' => true, 'now' => $now] + casino_skill_public($g, $r, $now));
  }
  return ['ok' => false, 'reason' => 'param'];
}
