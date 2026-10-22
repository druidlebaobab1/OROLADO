<?php
declare(strict_types=1);
/**
 * 2026-10-22 (propriétaire) — PARIS AUTOMATIQUES « SB » (API-Football v3), ÉTAPE 1 : FOOTBALL AVANT-MATCH SEULEMENT.
 * Spécification commune : ids, clés de marchés (mk), clés de choix (k), formes JSON de sbList / sbMatch.
 *
 *  - Clé : UNIQUEMENT APIFOOTBALL_KEY (data/.env, lue par orolado_load_env) ; jamais écrite, jamais journalisée, jamais renvoyée.
 *  - ADMIN SEUL tant que config.public est faux (réglage dans l'admin, data/sports/sb/config.json).
 *  - Budget : 7 000 lectures / jour (UTC) au plus pour le football (plan Pro 7 500).
 *  - Lectures de l'API UNIQUEMENT après la réponse au joueur (sb_after_response, fastcgi_finish_request) ou par le bouton
 *    admin « Importer maintenant ». Une seule exception : pari à moins de 30 min du coup d'envoi → /fixtures?live=all
 *    (gardé 60 s) pour refuser un match déjà commencé.
 *  - Import : /fixtures?date=J (J-1 … J+2, toutes les compétitions) et /odds?date=J&page=N (toutes les compétitions avec
 *    cotes), /odds?fixture=ID à la demande (page d'un match, cotes de plus de 3 h).
 *  - Cotes : moyenne des bookmakers par choix (≥ 3 bookmakers pour 1x2 / dc / ou / btts, ≥ 2 pour le reste), groupe de choix
 *    complémentaires normalisé (seulement si sa somme ≥ attendu : toujours SÛR), marge du réglage (rien d'autre),
 *    jamais sous 1,01 (choix retiré).
 *  - Règlement AUTOMATIQUE (config.autosettle, vrai par défaut) : score des 90 min (score.fulltime, aussi pour AET / PEN),
 *    mi-temps = score.halftime. ANNULÉ (mise rendue pour ce choix) : pari posé à / après le vrai coup d'envoi ; match reporté /
 *    annulé / arrêté (PST CANC ABD SUSP INT) pas joué dans les 48 h du coup d'envoi prévu ; AWD / WO. Seulement si le
 *    numéro du match ET des deux équipes sont exactement ceux du pari ; tout le reste → « à vérifier » (admin).
 *    Paiement : le chemin EXISTANT sp_resolve / casino_credit (référence unique : jamais payé deux fois).
 * Fichiers (data/sports/sb/) : config.json, state.json (tâches, erreurs, diagnostic), budget-foot.json,
 *   foot-day-AAAA-MM-JJ.json (index du jour), mk/foot-<id>.json (marchés d'un match), results.json, cache/ (lectures gardées).
 * Tests : php scripts/test-sb.php (aucun accès à internet : scripts/fixtures/sb/).
 */

const SB_FOOT_BASE = 'https://v3.football.api-sports.io/';
const SB_FOOT_CAP = 7000;            // lectures / jour au plus (UTC)
const SB_JOB_EVERY = 60;             // tâche de fond : au plus une fois par minute
const SB_JOB_CALLS = 30;             // lectures au plus par passage de la tâche de fond
const SB_ODDS_PAGES_RUN = 12;        // pages /odds?date au plus par passage
const SB_ODDS_MAX_AGE = 28800;       // cotes de plus de 8 h : plus de pari (jamais un vieux prix)
const SB_FX_ODDS_TTL = 600;          // /odds?fixture à la demande (match ouvert) : cotes de plus de 10 min
const SB_LIVE_IDS_TTL = 60;          // /fixtures?live=all gardé 60 s (contrôle des paris à moins de 30 min du début)
const SB_LATE = 1800;                // à moins de 30 min du coup d'envoi : contrôle « déjà commencé ? »
const SB_PST_VOID = 172800;          // reporté / pas joué dans les 48 h : annulé
const SB_FINAL = ['FT', 'AET', 'PEN'];
const SB_VOID_ST = ['AWD', 'WO'];
const SB_WAIT_ST = ['PST', 'CANC', 'ABD', 'SUSP', 'INT', 'NS', 'TBD'];
const SB_LIVE_ST = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE'];
const SB_CFG_DEFAULT = ['public' => false, 'live' => true, 'livePublic' => true, 'liveAll' => false, 'autosettle' => true, 'sports' => ['foot', 'basket', 'hockey', 'handball', 'volley', 'rugby', 'baseball', 'amfoot', 'afl', 'mma'],
  'mMain' => 15, 'mSide' => 20, 'mExotic' => 30, 'mLive' => 20, 'mOther' => 15, 'mPred' => 20, 'alertStake' => 50, 'alertPot' => 500, 'alertWin' => 200, 'liveLastMin' => 88]; // mPred : prédictions Predict (pred_lib.php)
/**
 * 2026-10-22 (propriétaire : « on retire le direct, on l'essaie seulement sur les grands championnats ») : direct limité à ces
 * compétitions (données rapides) tant que le réglage « liveAll » est éteint (admin compris).
 */
const SB_LIVE_BIG = [2, 3, 848, 39, 140, 135, 78, 61, 94, 88, 203, 1, 4, 5, 6, 9, 15, 32, 34, 45, 48, 66, 81, 137, 143, 531];
/** Compétitions en tête de liste (p petit = en haut) ; les autres : 100 (par pays). */
const SB_TOP_LEAGUES = [2 => 1, 39 => 2, 140 => 3, 135 => 4, 78 => 5, 61 => 6, 3 => 7, 848 => 8, 1 => 9, 4 => 10, 6 => 11, 12 => 12, 20 => 13, 5 => 14, 9 => 15, 13 => 16, 94 => 17, 88 => 18, 203 => 19, 253 => 20];
const SB_TOP_COUNTRIES = ['ivory-coast' => 30, 'cote-d-ivoire' => 30, 'senegal' => 31, 'cameroon' => 32, 'nigeria' => 33, 'ghana' => 34, 'morocco' => 35, 'france' => 36];

/* ------------------------------------------------------------- réglages / fichiers ---------------------------------- */

function sb_env(string $k): string {
  if (function_exists('orolado_load_env')) orolado_load_env();
  $v = getenv($k);
  return is_string($v) ? trim($v) : '';
}
/** Heure (tests : $GLOBALS["SB_NOW"]). */
function sb_now(): int { return (int) ($GLOBALS['SB_NOW'] ?? 0) ?: time(); }
function sb_fake(): ?callable { $f = $GLOBALS['SB_FAKE_FETCH'] ?? null; return is_callable($f) ? $f : null; }
function sb_has_key(): bool { return sb_env('APIFOOTBALL_KEY') !== '' || sb_fake() !== null; }
function sb_dir(): string { $d = sp_dir() . DIRECTORY_SEPARATOR . 'sb'; if (!is_dir($d)) @mkdir($d . DIRECTORY_SEPARATOR . 'mk', 0750, true); return $d; }
function sb_with(string $name, callable $fn) { sb_dir(); return sp_with('sb' . DIRECTORY_SEPARATOR . $name, $fn); }
function sb_read(string $name): array {
  $f = sb_dir() . DIRECTORY_SEPARATOR . $name;
  if (!is_file($f)) return [];
  $j = json_decode((string) @file_get_contents($f), true);
  return is_array($j) ? $j : [];
}
function sb_config(): array {
  $c = sb_read('config.json');
  // 2026-10-22 (propriétaire : « mettons en direct ») : une seule fois, Public allumé et marges au moins 15/20/30/20/15
  if (empty($c['mig1'])) {
    sb_with('config.json', static function (array &$s) {
      if (!empty($s['mig1'])) return true;
      $s['public'] = true; $s['mig1'] = 1;
      foreach (['mMain' => 15, 'mSide' => 20, 'mExotic' => 30, 'mLive' => 20, 'mOther' => 15] as $k => $v) $s[$k] = max($v, (float) ($s[$k] ?? 0));
      return true;
    });
    $c = sb_read('config.json');
  }
  // 2026-10-22 (propriétaire : « tout le direct pour tout le monde, tout de suite ») : une seule fois, Direct + Direct public allumés
  if (empty($c['mig2'])) {
    sb_with('config.json', static function (array &$s) { if (!empty($s['mig2'])) return true; $s['live'] = true; $s['livePublic'] = true; $s['mig2'] = 1; return true; });
    $c = sb_read('config.json');
  }
  // 2026-10-22 (propriétaire : « 2,5 % pour tout, le direct un peu plus ») : une seule fois, 2,5 % avant-match (tous les marchés, tous les sports), 5 % en direct
  if (empty($c['mig3'])) {
    sb_with('config.json', static function (array &$s) {
      if (!empty($s['mig3'])) return true;
      $s['mig3'] = 1;
      foreach (['mMain' => 2.5, 'mSide' => 2.5, 'mExotic' => 2.5, 'mLive' => 5, 'mOther' => 2.5] as $k => $v) $s[$k] = $v;
      return true;
    });
    $c = sb_read('config.json');
  }
  // 2026-10-22 (propriétaire : « les autres sports ») : une seule fois, tous les sports allumés (avant : football seul enregistré)
  // 2026-10-22 (propriétaire : « le direct à 4 ») : une seule fois, marge du direct 4 %
  if (empty($c['mig5'])) {
    sb_with('config.json', static function (array &$s) { if (!empty($s['mig5'])) return true; $s['mLive'] = 4; $s['mig5'] = 1; return true; });
    $c = sb_read('config.json');
  }
  // 2026-10-22 (propriétaire) : une seule fois, marge des prédictions « Predict » 20 % (l'admin peut la changer ensuite)
  if (empty($c['mig6'])) {
    sb_with('config.json', static function (array &$s) { if (!empty($s['mig6'])) return true; $s['mPred'] = 20; $s['mig6'] = 1; return true; });
    $c = sb_read('config.json');
  }
  // 2026-10-22 (propriétaire : « plus de direct, de grosses cotes, marge 2 % sur tous les sports ») : une seule fois,
  // marge 2 % avant-match (football et autres sports), direct limité aux grands championnats
  if (empty($c['mig7'])) {
    sb_with('config.json', static function (array &$s) {
      if (!empty($s['mig7'])) return true;
      $s['mig7'] = 1; $s['liveAll'] = false;
      foreach (['mMain', 'mSide', 'mExotic', 'mOther'] as $k) $s[$k] = 2;
      return true;
    });
    $c = sb_read('config.json');
  }
  // 2026-10-22 (propriétaire : « essaie 1 % ») : une seule fois, marge avant-match 1 % (football et autres sports)
  if (empty($c['mig8'])) {
    sb_with('config.json', static function (array &$s) {
      if (!empty($s['mig8'])) return true;
      $s['mig8'] = 1;
      foreach (['mMain', 'mSide', 'mExotic', 'mOther'] as $k) $s[$k] = 1;
      return true;
    });
    $c = sb_read('config.json');
  }
  if (empty($c['mig4'])) {
    sb_with('config.json', static function (array &$s) { if (!empty($s['mig4'])) return true; $s['sports'] = SB_CFG_DEFAULT['sports']; $s['mig4'] = 1; return true; });
    $c = sb_read('config.json');
  }
  $out = SB_CFG_DEFAULT;
  foreach ($out as $k => $v) if (array_key_exists($k, $c)) $out[$k] = is_bool($v) ? (bool) $c[$k] : (is_array($v) ? (array) $c[$k] : (float) $c[$k]);
  return $out;
}
/** Admin : enregistre les réglages (seulement les champs connus, bornés). */
function sb_config_save(array $in): array {
  $cur = sb_config();
  foreach (['public', 'live', 'livePublic', 'liveAll', 'autosettle'] as $k) if (array_key_exists($k, $in)) $cur[$k] = (bool) $in[$k];
  foreach (['mMain', 'mSide', 'mExotic', 'mLive', 'mOther', 'mPred'] as $k) if (isset($in[$k]) && is_numeric($in[$k])) $cur[$k] = round(max(1.0, min(40.0, (float) $in[$k])), 1);
  foreach (['alertStake', 'alertPot', 'alertWin'] as $k) if (isset($in[$k]) && is_numeric($in[$k])) $cur[$k] = round(max(0.0, min(1000000.0, (float) $in[$k])), 2);
  if (isset($in['sports']) && is_array($in['sports'])) $cur['sports'] = array_values(array_intersect(SB_CFG_DEFAULT['sports'], array_map('strval', $in['sports'])));
  if (isset($in['liveLastMin']) && is_numeric($in['liveLastMin'])) $cur['liveLastMin'] = (float) max(45, min(90, (int) $in['liveLastMin'])); // direct : plus de pari à partir de cette minute
  sb_with('config.json', static function (array &$s) use ($cur) { $s = $cur + ['mig1' => 1, 'mig2' => 1, 'mig3' => 1, 'mig4' => 1, 'mig5' => 1, 'mig6' => 1, 'mig7' => 1, 'mig8' => 1]; return true; });
  return ['ok' => true, 'config' => $cur];
}
function sb_visible(?array $user): bool {
  if ($user && function_exists('orolado_is_admin_user') && orolado_is_admin_user($user)) return true;
  return (bool) sb_config()['public'];
}
function sb_state(): array { return sb_read('state.json'); }
function sb_note_error(string $msg, int $now = 0): void {
  $key = sb_env('APIFOOTBALL_KEY');
  $msg = mb_substr($key !== '' ? str_replace($key, '***', $msg) : $msg, 0, 240); // jamais la clé, même par accident
  sb_with('state.json', static function (array &$s) use ($msg, $now) { $s['err'] = $msg; $s['errAt'] = $now ?: sb_now(); return true; });
}

/* ------------------------------------------------------------- alertes admin ---------------------------------------- */

/** Notification admin (téléphone), envoyée APRÈS la réponse au joueur ; gardée aussi dans state.json (30 dernières). */
function sb_alert(string $title, string $body, int $now = 0): void {
  $now = $now ?: sb_now();
  sb_with('state.json', static function (array &$s) use ($title, $body, $now) {
    $s['alerts'] = array_slice(array_merge([['t' => $title, 'b' => $body, 'at' => $now]], (array) ($s['alerts'] ?? [])), 0, 30);
    return true;
  });
  if (isset($GLOBALS['SB_FAKE_PUSH'])) { $GLOBALS['SB_FAKE_PUSH'][] = [$title, $body]; return; }
  static $queue = null;
  if ($queue === null) {
    $queue = [];
    register_shutdown_function(static function () use (&$queue) {
      if (!$queue) return;
      if (function_exists('fastcgi_finish_request')) { try { fastcgi_finish_request(); } catch (Throwable $e) { /* déjà fait */ } }
      if (!function_exists('push_notify_admin') && is_file(__DIR__ . '/push_lib.php')) { try { require_once __DIR__ . '/push_lib.php'; } catch (Throwable $e) { return; } }
      if (!function_exists('push_notify_admin')) return;
      foreach ($queue as [$t, $b]) { try { push_notify_admin($t, $b, '/admin.php'); } catch (Throwable $e) { /* jamais bloquant */ } }
    });
  }
  $queue[] = [$title, $body];
}

/* ------------------------------------------------------------- lecture de l'API (budget, cache) --------------------- */

/**
 * Plafond du jour : SB_FOOT_CAP (abonnement Pro, 7 500 / jour), ou PLUS si l'abonnement a été monté (Ultra, Mega…) :
 * l'API renvoie ce qui reste dans la journée (« rem ») → plafond = utilisé + reste − 300 (marge), jamais sous SB_FOOT_CAP.
 */
function sb_foot_cap(int $now = 0): int {
  $now = $now ?: sb_now();
  $b = sb_read('budget-foot.json');
  if (($b['day'] ?? '') !== gmdate('Y-m-d', $now) || !is_numeric($b['rem'] ?? null)) return SB_FOOT_CAP;
  return max(SB_FOOT_CAP, (int) ($b['n'] ?? 0) + (int) $b['rem'] - 300);
}
function sb_budget_take(int $now): bool {
  $day = gmdate('Y-m-d', $now); $cap = sb_foot_cap($now);
  return (bool) sb_with('budget-foot.json', static function (array &$s) use ($day, $cap) {
    if (($s['day'] ?? '') !== $day) { $s['day'] = $day; $s['n'] = 0; $s['warned'] = 0; }
    if ((int) $s['n'] >= $cap) return false;
    $s['n'] = (int) $s['n'] + 1;
    return true;
  });
}
function sb_budget(int $now = 0): array {
  $now = $now ?: sb_now();
  $b = sb_read('budget-foot.json');
  $used = ($b['day'] ?? '') === gmdate('Y-m-d', $now) ? (int) ($b['n'] ?? 0) : 0;
  $cap = sb_foot_cap($now);
  return ['used' => $used, 'cap' => $cap, 'left' => max(0, $cap - $used), 'rem' => $b['rem'] ?? null];
}
/**
 * Une lecture (chemin relatif). Null = pas de clé, budget épuisé, réseau ou erreur API (gardée pour l'admin).
 * $sp = 'foot' (API-Football, budget-foot.json) ou un autre sport (SB_O_SPORTS : hôte v1.<sport>.api-sports.io, plan gratuit,
 * budget-<sport>.json ; $kind = 'od' cotes, 'rs' résultats, '' matchs).
 */
function sb_get(string $path, int $now = 0, string $sp = 'foot', string $kind = ''): ?array {
  $now = $now ?: sb_now();
  $o = $sp !== 'foot';
  if ($o && !isset(SB_O_SPORTS[$sp])) return null;
  $err = static function (string $m) use ($o, $sp, $now): void { if ($o) sb_o_note_error($sp, $m, $now); else sb_note_error($m, $now); };
  $fake = sb_fake();
  $key = sb_env('APIFOOTBALL_KEY');
  if ($key === '' && !$fake) { $err('Clé APIFOOTBALL_KEY absente'); return null; }
  if ($o) {
    if (!sb_o_budget_take($sp, $now, $kind)) return null; // plafond du jour (jamais dépassé)
  } else {
    if (!sb_budget_take($now)) { $err('Budget du jour atteint (' . sb_foot_cap($now) . ' lectures) : reprise à 0 h UTC'); return null; }
    $b = sb_budget($now);
    if ($b['left'] < 300) sb_with('budget-foot.json', static function (array &$s) use ($now) {
      if (!empty($s['warned'])) return false;
      $s['warned'] = 1; sb_alert('⚠️ Paris : budget API presque épuisé', 'Moins de 300 lectures API-Football aujourd\'hui.', $now); return true;
    });
  }
  $rem = null;
  if ($fake) $raw = (string) $fake($o ? $sp . ':' . $path : $path);
  else {
    $ctx = stream_context_create(['http' => ['method' => 'GET', 'timeout' => 15, 'ignore_errors' => true,
      'header' => "x-apisports-key: " . $key . "\r\nAccept: application/json\r\nUser-Agent: OROLADO\r\n"], 'ssl' => ['verify_peer' => true]]);
    $raw = @file_get_contents(($o ? 'https://' . SB_O_SPORTS[$sp]['h'] . '.api-sports.io/' : SB_FOOT_BASE) . $path, false, $ctx, 0, 30000001);
    $raw = is_string($raw) && strlen($raw) <= 30000000 ? $raw : '';
    foreach ((array) ($http_response_header ?? []) as $h) if (preg_match('/^x-ratelimit-requests-remaining:\s*(\d+)/i', (string) $h, $m)) $rem = (int) $m[1];
  }
  $j = json_decode($raw, true);
  if (!is_array($j)) { $err('Réponse illisible ou réseau (' . preg_replace('/\?.*$/', '', $path) . ')'); return null; }
  if ($rem !== null) sb_with($o ? 'budget-' . $sp . '.json' : 'budget-foot.json', static function (array &$s) use ($rem) { $s['rem'] = $rem; return true; });
  $e = $j['errors'] ?? [];
  if (!empty($e)) { $err(($o ? SB_O_SPORTS[$sp]['n'] : 'API-Football') . ' : ' . (is_array($e) ? implode(' · ', array_map(static fn($v) => is_scalar($v) ? (string) $v : (string) json_encode($v), $e)) : (string) $e)); return null; }
  return $j;
}
function sb_get_cached(string $path, int $ttl, int $now = 0, string $sp = 'foot', string $kind = ''): ?array {
  $now = $now ?: sb_now();
  $d = sb_dir() . DIRECTORY_SEPARATOR . 'cache';
  if (!is_dir($d)) @mkdir($d, 0750, true);
  $f = $d . DIRECTORY_SEPARATOR . substr(hash('sha256', ($sp === 'foot' ? '' : $sp . ':') . $path), 0, 24) . '.json';
  clearstatcache(true, $f);
  if ($ttl > 0 && is_file($f) && filemtime($f) > $now - $ttl) { $j = json_decode((string) @file_get_contents($f), true); if (is_array($j)) return $j; }
  $j = sb_get($path, $now, $sp, $kind);
  if ($j !== null) { @file_put_contents($f, json_encode($j, JSON_UNESCAPED_UNICODE), LOCK_EX); @touch($f, $now); }
  return $j;
}

/* ------------------------------------------------------------- marchés : lecture des cotes -------------------------- */

/** Famille d'un mk (« ou:2.5 » → « ou »). */
function sb_fam(string $mk): string { $p = strpos($mk, ':'); return $p === false ? $mk : substr($mk, 0, $p); }
/** Nombre de choix d'un groupe complet (null = ouvert : score exact). */
function sb_group_size(string $fam): ?int {
  static $n = ['12' => 2, '1x2' => 3, 'dc' => 3, 'dnb' => 2, 'ou' => 2, 'btts' => 2, 'tth' => 2, 'tta' => 2, 'oe' => 2, 'csh' => 2, 'csa' => 2, 'wnh' => 2, 'wna' => 2,
    'eh' => 3, 'ah' => 2, 'ht1x2' => 3, 'htou' => 2, 'htbtts' => 2, '2h1x2' => 3, 'htft' => 9, 'rbtts' => 6, 'rou' => 6, 'eg' => 7, 'hsh' => 3,
    'htdc' => 3, '2hdc' => 3, '2hbtts' => 2, 'htoe' => 2, '2hoe' => 2, '2hou' => 2, 'httth' => 2, 'httta' => 2, 'htah' => 2];
  return $n[$fam] ?? null;
}
function sb_expected(string $fam): float { return in_array($fam, ['dc', 'htdc', '2hdc'], true) ? 2.0 : 1.0; }
function sb_min_books(string $fam): int { return in_array($fam, ['1x2', 'dc', 'ou', 'btts'], true) ? 3 : 2; }
function sb_margin(string $fam, array $cfg): float {
  if (in_array($fam, ['1x2', 'dc', 'dnb', 'ou', 'btts'], true)) $m = $cfg['mMain'];
  elseif (in_array($fam, ['cs', 'htcs', 'htft', 'eg', 'rbtts', 'rou'], true)) $m = $cfg['mExotic'];
  else $m = $cfg['mSide'];
  return max(0.01, min(0.4, (float) $m / 100));
}
/** Ligne canonique : 2.5 → « 2.5 », -1 → « -1 », 0 → « 0 ». */
function sb_line(float $x): string { if (abs($x) < 1e-9) return '0'; $s = rtrim(rtrim(number_format($x, 2, '.', ''), '0'), '.'); return $s; }
function sb_half(float $x): bool { return abs(abs(fmod($x, 1.0)) - 0.5) < 1e-9; }
/** « Over 2.5 » → ['O', 2.5] ; null si non reconnu. */
function sb_ou_val(string $v): ?array {
  if (!preg_match('/^(over|under)\s*([0-9]+(?:\.[0-9]+)?)$/i', trim($v), $m)) return null;
  return [strtolower($m[1]) === 'over' ? 'O' : 'U', (float) $m[2]];
}
const SB_RES = ['home' => 'H', 'draw' => 'D', 'away' => 'A', '1' => 'H', 'x' => 'D', '2' => 'A'];
const SB_YN = ['yes' => 'Y', 'no' => 'N'];

/**
 * Une offre d'un bookmaker (nom du pari API + valeurs) → liste de [mk, k, cote]. Les noms / valeurs inconnus vont dans
 * $unk (diagnostic admin), jamais d'erreur. Format supposé (API-Football v3, /odds) : values = [{value, odd}], handicaps
 * écrits du point de vue de l'équipe à DOMICILE pour les trois choix (« Home -1 », « Draw -1 », « Away -1 ») — vérifié en plus
 * contre 1x2 (sb_markets) : une autre convention est rejetée, jamais mal payée.
 */
function sb_parse_bet(string $name, array $values, array &$unk): array {
  $n = strtolower(trim((string) preg_replace('/\s+/', ' ', $name)));
  $out = [];
  $bad = static function (string $v) use (&$unk, $name) { $k = mb_substr($name . ' = ' . $v, 0, 80); $unk[$k] = ($unk[$k] ?? 0) + 1; };
  // 2026-10-22 : lignes entières / quarts (2.0, 2.25, ±0.75…) et lignes hors bornes : écartées EXPRÈS (pas réglables simplement)
  // → pas dans le diagnostic « paris non reconnus » (elles le noyaient) ; seuls les noms / valeurs vraiment inconnus y vont.
  $quiet = false;
  $line = static function (float $x, float $min, float $max, bool $half = true) use (&$quiet): bool { $ok = $x >= $min - 1e-9 && $x <= $max + 1e-9 && (!$half || sb_half($x)); if (!$ok) $quiet = true; return $ok; };
  $n = (string) preg_replace('/\s*\(\s*/', ' (', $n); // « Home Team Total Goals(1st Half) » → « home team total goals (1st half) »
  foreach ($values as $vv) {
    $quiet = false;
    if (!is_array($vv)) continue;
    $v = trim((string) ($vv['value'] ?? ''));
    $odd = $vv['odd'] ?? null;
    if (!is_numeric($odd)) continue;
    $odd = (float) $odd;
    if ($odd <= 1.0 || $odd > 1000) continue; // cote incohérente : ignorée
    $lv = strtolower($v);
    $r = null;
    switch ($n) {
      case 'match winner': case 'fulltime result': case '1x2':
        if (isset(SB_RES[$lv])) $r = ['1x2', SB_RES[$lv]]; break;
      case 'double chance':
        $dc = ['home/draw' => 'HD', '1x' => 'HD', 'home/away' => 'HA', '12' => 'HA', 'draw/away' => 'DA', 'x2' => 'DA'];
        if (isset($dc[$lv])) $r = ['dc', $dc[$lv]]; break;
      case 'home/away': case 'draw no bet':
        if ($lv === 'home' || $lv === '1') $r = ['dnb', 'H']; elseif ($lv === 'away' || $lv === '2') $r = ['dnb', 'A']; break;
      case 'goals over/under': case 'total goals': case 'over/under':
        if (($o = sb_ou_val($v)) && $line($o[1], 0.5, 7.5)) $r = ['ou:' . sb_line($o[1]), $o[0]]; break;
      case 'goals over/under first half': case 'first half goals over/under':
        if (($o = sb_ou_val($v)) && $line($o[1], 0.5, 3.5)) $r = ['htou:' . sb_line($o[1]), $o[0]]; break;
      case 'both teams score': case 'both teams to score':
        if (isset(SB_YN[$lv])) $r = ['btts', SB_YN[$lv]]; break;
      case 'both teams score - first half': case 'both teams to score - first half':
        if (isset(SB_YN[$lv])) $r = ['htbtts', SB_YN[$lv]]; break;
      case 'total - home': case 'home team total goals':
        if (($o = sb_ou_val($v)) && $line($o[1], 0.5, 5.5)) $r = ['tth:' . sb_line($o[1]), $o[0]]; break;
      case 'total - away': case 'away team total goals':
        if (($o = sb_ou_val($v)) && $line($o[1], 0.5, 5.5)) $r = ['tta:' . sb_line($o[1]), $o[0]]; break;
      case 'odd/even':
        if ($lv === 'odd') $r = ['oe', 'O']; elseif ($lv === 'even') $r = ['oe', 'E']; break;
      case 'clean sheet - home': if (isset(SB_YN[$lv])) $r = ['csh', SB_YN[$lv]]; break;
      case 'clean sheet - away': if (isset(SB_YN[$lv])) $r = ['csa', SB_YN[$lv]]; break;
      case 'win to nil - home': if (isset(SB_YN[$lv])) $r = ['wnh', SB_YN[$lv]]; break;
      case 'win to nil - away': if (isset(SB_YN[$lv])) $r = ['wna', SB_YN[$lv]]; break;
      case 'handicap result': case 'european handicap':
        if (preg_match('/^(home|draw|away)\s*([+-]?\d+(?:\.0+)?)$/i', $v, $m) && $line((float) $m[2], -4, 4, false))
          $r = ['eh:' . sb_line((float) $m[2]), SB_RES[strtolower($m[1])]]; break;
      case 'asian handicap':
        if (preg_match('/^(home|away)\s*([+-]?\d+(?:\.\d+)?)$/i', $v, $m) && $line((float) $m[2], -5.5, 5.5))
          $r = ['ah:' . sb_line((float) $m[2]), SB_RES[strtolower($m[1])]]; break;
      case 'first half winner':
        if (isset(SB_RES[$lv])) $r = ['ht1x2', SB_RES[$lv]]; break;
      case 'second half winner':
        if (isset(SB_RES[$lv])) $r = ['2h1x2', SB_RES[$lv]]; break;
      case 'ht/ft double': case 'halftime/fulltime':
        if (preg_match('/^(home|draw|away)\s*\/\s*(home|draw|away)$/i', $v, $m)) $r = ['htft', SB_RES[strtolower($m[1])] . '/' . SB_RES[strtolower($m[2])]]; break;
      case 'exact score': case 'correct score':
        if (preg_match('/^(\d{1,2})\s*[:\-]\s*(\d{1,2})$/', $v, $m) && (int) $m[1] <= 9 && (int) $m[2] <= 9) $r = ['cs', (int) $m[1] . ':' . (int) $m[2]]; break;
      case 'results/both teams score': case 'result/both teams score':
        if (preg_match('/^(home|draw|away)\s*\/\s*(yes|no)$/i', $v, $m)) $r = ['rbtts', SB_RES[strtolower($m[1])] . '/' . SB_YN[strtolower($m[2])]]; break;
      case 'result/total goals':
        if (preg_match('/^(home|draw|away)\s*\/\s*(over|under)\s*([0-9.]+)$/i', $v, $m) && $line((float) $m[3], 0.5, 5.5))
          $r = ['rou:' . sb_line((float) $m[3]), SB_RES[strtolower($m[1])] . '/' . (strtolower($m[2]) === 'over' ? 'O' : 'U')]; break;
      case 'exact goals number':
        if (preg_match('/^[0-5]$/', $lv)) $r = ['eg', $lv];
        elseif (preg_match('/^(6\+|more 5|more than 5|over 5\.5|6 or more|6 and more)$/', $lv)) $r = ['eg', '6+']; break;
      case 'highest scoring half':
        $hs = ['1st half' => '1', 'first half' => '1', '2nd half' => '2', 'second half' => '2', 'draw' => 'X', 'equal' => 'X', 'x' => 'X'];
        if (isset($hs[$lv])) $r = ['hsh', $hs[$lv]]; break;
      // 2026-10-22 : marchés vus dans le vrai flux (réglés avec score.halftime + score.fulltime)
      case 'goals over/under - second half': case 'goals over/under second half': case 'second half goals over/under':
        if (($o = sb_ou_val($v)) && $line($o[1], 0.5, 4.5)) $r = ['2hou:' . sb_line($o[1]), $o[0]]; break;
      case 'double chance - first half': case 'double chance first half':
        $dc = ['home/draw' => 'HD', '1x' => 'HD', 'home/away' => 'HA', '12' => 'HA', 'draw/away' => 'DA', 'x2' => 'DA'];
        if (isset($dc[$lv])) $r = ['htdc', $dc[$lv]]; break;
      case 'double chance - second half': case 'double chance second half':
        $dc = ['home/draw' => 'HD', '1x' => 'HD', 'home/away' => 'HA', '12' => 'HA', 'draw/away' => 'DA', 'x2' => 'DA'];
        if (isset($dc[$lv])) $r = ['2hdc', $dc[$lv]]; break;
      case 'both teams to score - second half': case 'both teams score - second half':
        if (isset(SB_YN[$lv])) $r = ['2hbtts', SB_YN[$lv]]; break;
      case 'correct score - first half': case 'exact score - first half':
        if (preg_match('/^(\d{1,2})\s*[:\-]\s*(\d{1,2})$/', $v, $m) && (int) $m[1] <= 9 && (int) $m[2] <= 9) $r = ['htcs', (int) $m[1] . ':' . (int) $m[2]]; break;
      case 'odd/even - first half':
        if ($lv === 'odd') $r = ['htoe', 'O']; elseif ($lv === 'even') $r = ['htoe', 'E']; break;
      case 'odd/even - second half':
        if ($lv === 'odd') $r = ['2hoe', 'O']; elseif ($lv === 'even') $r = ['2hoe', 'E']; break;
      case 'home team total goals (1st half)':
        if (($o = sb_ou_val($v)) && $line($o[1], 0.5, 3.5)) $r = ['httth:' . sb_line($o[1]), $o[0]]; break;
      case 'away team total goals (1st half)':
        if (($o = sb_ou_val($v)) && $line($o[1], 0.5, 3.5)) $r = ['httta:' . sb_line($o[1]), $o[0]]; break;
      case 'asian handicap first half':
        if (preg_match('/^(home|away)\s*([+-]?\d+(?:\.\d+)?)$/i', $v, $m) && $line((float) $m[2], -3.5, 3.5))
          $r = ['htah:' . sb_line((float) $m[2]), SB_RES[strtolower($m[1])]]; break;
      default:
        $unk[mb_substr($name, 0, 80)] = ($unk[mb_substr($name, 0, 80)] ?? 0) + 1;
        return [];
    }
    if ($r === null) { if (!$quiet) $bad($v); continue; }
    $out[] = [$r[0], $r[1], $odd];
  }
  return $out;
}

/** Ordre d'affichage des familles et des choix. */
const SB_FAM_ORDER = ['12', '1x2', 'dc', 'dnb', 'ou', 'btts', 'tth', 'tta', 'oe', 'csh', 'csa', 'wnh', 'wna', 'eh', 'ah', 'ht1x2', 'htdc', 'htou', 'httth', 'httta', 'htbtts', 'htoe', 'htah',
  '2h1x2', '2hdc', '2hou', '2hbtts', '2hoe', 'htft', 'cs', 'htcs', 'rbtts', 'rou', 'eg', 'hsh'];
/** Rang d'un choix dans son marché (ordre de sb_valid_k ; score exact : 1:0, 2:0 … par buts domicile puis extérieur). */
function sb_k_rank(string $k, string $fam = ''): int {
  if (preg_match('/^(\d+):(\d+)$/', $k, $m)) return 1000 + (int) $m[1] * 10 + (int) $m[2];
  $i = array_search($k, sb_valid_k($fam), true);
  return $i === false ? 999 : (int) $i;
}
function sb_mk_cmp(string $a, string $b): int {
  $fa = array_search(sb_fam($a), SB_FAM_ORDER, true); $fb = array_search(sb_fam($b), SB_FAM_ORDER, true);
  if ($fa !== $fb) return (int) $fa <=> (int) $fb;
  $la = (float) substr($a, strlen(sb_fam($a)) + 1); $lb = (float) substr($b, strlen(sb_fam($b)) + 1);
  return $la <=> $lb;
}

/**
 * Bookmakers (réponse /odds, un match) → nos cotes : mk => [[k, cote], …]. $unk reçoit les paris / valeurs inconnus.
 * 1) par bookmaker : groupe complet dont la somme des 1/cote < 0,98 × attendu → ce groupe de ce bookmaker est écarté ;
 * 2) moyenne par choix (≥ 3 ou 2 bookmakers) ; 3) p = (1/moy) / max(1, Σ/attendu) ; 4) cote = ⌊(1 − m)/p⌋ (centimes),
 *    ≤ moy − 0,01, ≥ 1,01 ; 5) handicaps contrôlés contre 1x2 (signe / convention) sinon retirés.
 */
function sb_markets(array $bookmakers, array $cfg, array &$unk): array {
  $sum = []; $cnt = [];
  foreach ($bookmakers as $bk) {
    if (!is_array($bk)) continue;
    $mine = [];
    foreach ((array) ($bk['bets'] ?? []) as $bet) {
      if (!is_array($bet)) continue;
      foreach (sb_parse_bet((string) ($bet['name'] ?? ''), (array) ($bet['values'] ?? []), $unk) as [$mk, $k, $odd]) $mine[$mk][$k] = $odd;
    }
    foreach ($mine as $mk => $ks) {
      $fam = sb_fam($mk); $size = sb_group_size($fam);
      $inv = 0.0; foreach ($ks as $o) $inv += 1 / $o;
      if ($size !== null && count($ks) >= $size && $inv < 0.98 * sb_expected($fam)) continue; // bookmaker incohérent sur ce marché
      foreach ($ks as $k => $o) { $sum[$mk][$k] = ($sum[$mk][$k] ?? 0) + $o; $cnt[$mk][$k] = ($cnt[$mk][$k] ?? 0) + 1; }
    }
  }
  $out = []; $pH = [];
  foreach ($sum as $mk => $ks) {
    $fam = sb_fam($mk);
    $avg = [];
    foreach ($ks as $k => $s) if ($cnt[$mk][$k] >= sb_min_books($fam)) $avg[$k] = $s / $cnt[$mk][$k];
    if (!$avg) continue;
    $inv = 0.0; foreach ($avg as $a) $inv += 1 / $a;
    $norm = max(1.0, $inv / sb_expected($fam));
    $m = sb_margin($fam, $cfg);
    $row = [];
    foreach ($avg as $k => $a) {
      $p = (1 / $a) / $norm;
      $o = floor((1 - $m) / $p * 100 + 1e-6) / 100;
      // 2026-10-22 (propriétaire : « plus haut que 1xBet ») : plus de plafond « moyenne − 0,01 » ; seule la marge du réglage compte
      if ($o < 1.01) continue;
      $row[] = [(string) $k, round($o, 2)];
      if ($k === 'H') $pH[$mk] = $p;
    }
    if (!$row) continue;
    usort($row, static fn($x, $y) => sb_k_rank($x[0], $fam) <=> sb_k_rank($y[0], $fam));
    $out[$mk] = $row;
  }
  // handicaps : contrôle du signe contre 1x2 (ah:-0.5 H = victoire domicile ; une ligne négative ne peut pas être plus probable)
  // (handicap 1re mi-temps « htah » : contrôlé contre le résultat à la mi-temps « ht1x2 »)
  foreach ($out as $mk => $row) {
    $fam = sb_fam($mk);
    if ($fam !== 'ah' && $fam !== 'eh' && $fam !== 'htah') continue;
    $p1 = $pH[$fam === 'htah' ? 'ht1x2' : '1x2'] ?? null;
    $h = (float) substr($mk, strlen($fam) + 1); $p = $pH[$mk] ?? null;
    $ok = $p1 !== null && $p !== null && ($h < 0 ? $p <= $p1 + 0.05 : ($h > 0 ? $p >= $p1 - 0.05 : abs($p - $p1) <= 0.05));
    if (!$ok) { unset($out[$mk]); $unk['(contrôle) ' . $fam . ' retiré : signe / convention à vérifier'] = ($unk['(contrôle) ' . $fam . ' retiré : signe / convention à vérifier'] ?? 0) + 1; }
  }
  uksort($out, 'sb_mk_cmp');
  return $out;
}

/* ------------------------------------------------------------- règlement d'un choix --------------------------------- */

/** Résultat d'un choix : 'won' | 'lost' | 'void' | null (impossible : données manquantes ou marché inconnu). */
function sb_settle_mk(string $mk, string $k, array $ft, ?array $ht): ?string {
  if (count($ft) !== 2 || !is_numeric($ft[0]) || !is_numeric($ft[1])) return null;
  [$h, $a] = [(int) $ft[0], (int) $ft[1]];
  $fam = sb_fam($mk); $x = (float) substr($mk, strlen($fam) + 1);
  $res = static fn(int $p, int $q): string => $p > $q ? 'H' : ($p < $q ? 'A' : 'D');
  $needHt = in_array($fam, ['ht1x2', 'htou', 'htbtts', '2h1x2', 'htft', 'hsh', 'htdc', '2hdc', '2hbtts', 'htcs', 'htoe', '2hoe', '2hou', 'httth', 'httta', 'htah'], true);
  if ($needHt && ($ht === null || count($ht) !== 2 || !is_numeric($ht[0]) || !is_numeric($ht[1]))) return null;
  [$hh, $ha] = $needHt ? [(int) $ht[0], (int) $ht[1]] : [0, 0];
  if ($needHt && ($hh > $h || $ha > $a)) return null; // mi-temps incohérente : à vérifier
  $t = $h + $a; $r = $res($h, $a);
  $win = null; // choix gagnant (comparé à $k) ; ou résultat direct
  switch ($fam) {
    case '1x2': $win = $r; break;
    case 'dc': if (!in_array($k, ['HD', 'HA', 'DA'], true)) return null; return str_contains($k, $r) ? 'won' : 'lost';
    case 'dnb': if ($r === 'D') return in_array($k, ['H', 'A'], true) ? 'void' : null; $win = $r; break;
    case 'ou': $win = $t > $x ? 'O' : 'U'; break;
    case 'btts': $win = $h > 0 && $a > 0 ? 'Y' : 'N'; break;
    case 'tth': $win = $h > $x ? 'O' : 'U'; break;
    case 'tta': $win = $a > $x ? 'O' : 'U'; break;
    case 'oe': $win = $t % 2 === 1 ? 'O' : 'E'; break;
    case 'csh': $win = $a === 0 ? 'Y' : 'N'; break;
    case 'csa': $win = $h === 0 ? 'Y' : 'N'; break;
    case 'wnh': $win = $h > $a && $a === 0 ? 'Y' : 'N'; break;
    case 'wna': $win = $a > $h && $h === 0 ? 'Y' : 'N'; break;
    case 'eh': $d = $h + $x - $a; $win = $d > 0 ? 'H' : ($d < 0 ? 'A' : 'D'); break;
    case 'ah': if (!sb_half($x)) return null; $win = $h + $x - $a > 0 ? 'H' : 'A'; break;
    case 'ht1x2': $win = $res($hh, $ha); break;
    case 'htou': $win = $hh + $ha > $x ? 'O' : 'U'; break;
    case 'htbtts': $win = $hh > 0 && $ha > 0 ? 'Y' : 'N'; break;
    case '2h1x2': $win = $res($h - $hh, $a - $ha); break;
    case 'htft': $win = $res($hh, $ha) . '/' . $r; break;
    case 'cs': if (!preg_match('/^\d+:\d+$/', $k)) return null; $win = $h . ':' . $a; break;
    case 'rbtts': $win = $r . '/' . ($h > 0 && $a > 0 ? 'Y' : 'N'); break;
    case 'rou': $win = $r . '/' . ($t > $x ? 'O' : 'U'); break;
    case 'eg': $win = $t >= 6 ? '6+' : (string) $t; break;
    case 'hsh': $g1 = $hh + $ha; $g2 = $t - $g1; $win = $g1 > $g2 ? '1' : ($g1 < $g2 ? '2' : 'X'); break;
    // 2026-10-22 : 1re mi-temps = score.halftime ; 2e mi-temps = score.fulltime − score.halftime (90 min)
    case 'htdc': if (!in_array($k, ['HD', 'HA', 'DA'], true)) return null; return str_contains($k, $res($hh, $ha)) ? 'won' : 'lost';
    case '2hdc': if (!in_array($k, ['HD', 'HA', 'DA'], true)) return null; return str_contains($k, $res($h - $hh, $a - $ha)) ? 'won' : 'lost';
    case '2hbtts': $win = $h - $hh > 0 && $a - $ha > 0 ? 'Y' : 'N'; break;
    case 'htcs': if (!preg_match('/^\d+:\d+$/', $k)) return null; $win = $hh . ':' . $ha; break;
    case 'htoe': $win = ($hh + $ha) % 2 === 1 ? 'O' : 'E'; break;
    case '2hoe': $win = ($t - $hh - $ha) % 2 === 1 ? 'O' : 'E'; break;
    case '2hou': $win = $t - $hh - $ha > $x ? 'O' : 'U'; break;
    case 'httth': $win = $hh > $x ? 'O' : 'U'; break;
    case 'httta': $win = $ha > $x ? 'O' : 'U'; break;
    case 'htah': if (!sb_half($x)) return null; $win = $hh + $x - $ha > 0 ? 'H' : 'A'; break;
    default: return null;
  }
  if (!in_array($k, sb_valid_k($fam), true) && $fam !== 'cs' && $fam !== 'htcs') return null;
  return $k === $win ? 'won' : 'lost';
}
function sb_valid_k(string $fam): array {
  switch ($fam) {
    case '1x2': case 'eh': case 'ht1x2': case '2h1x2': return ['H', 'D', 'A'];
    case 'dc': case 'htdc': case '2hdc': return ['HD', 'HA', 'DA'];
    case 'dnb': case 'ah': case 'htah': case '12': return ['H', 'A'];
    case 'ou': case 'tth': case 'tta': case 'htou': case '2hou': case 'httth': case 'httta': return ['O', 'U'];
    case 'oe': case 'htoe': case '2hoe': return ['O', 'E'];
    case 'btts': case 'htbtts': case '2hbtts': case 'csh': case 'csa': case 'wnh': case 'wna': return ['Y', 'N'];
    case 'htft': $o = []; foreach (['H', 'D', 'A'] as $p) foreach (['H', 'D', 'A'] as $q) $o[] = $p . '/' . $q; return $o;
    case 'rbtts': $o = []; foreach (['H', 'D', 'A'] as $p) foreach (['Y', 'N'] as $q) $o[] = $p . '/' . $q; return $o;
    case 'rou': $o = []; foreach (['H', 'D', 'A'] as $p) foreach (['O', 'U'] as $q) $o[] = $p . '/' . $q; return $o;
    case 'eg': return ['0', '1', '2', '3', '4', '5', '6+'];
    case 'hsh': return ['1', '2', 'X'];
  }
  return [];
}
function sb_results(): array { return (array) (sb_read('results.json')['fx'] ?? []); }
/**
 * Un choix SB d'un coupon : 'won' | 'lost' | 'void' | null (pas encore réglable). $betAt = heure du pari.
 * Règles : pari à / après le VRAI coup d'envoi → annulé ; joué plus de 48 h après le coup d'envoi prévu (ko du pari) → annulé ;
 * reporté / annulé / arrêté et pas joué 48 h après → annulé (si autosettle, sinon l'admin décide) ; AWD / WO → annulé.
 */
function sb_sel_result(array $sel, int $betAt, array $results, int $now = 0, ?bool $auto = null): ?string {
  $now = $now ?: sb_now();
  if (preg_match('/^sb:([a-z]+):(\d+):(.+)$/', (string) ($sel['ev'] ?? ''), $mo) && $mo[1] !== 'foot') return sb_o_sel_result($mo[1], $mo[2], $mo[3], $sel, $betAt, $now, $auto); // autres sports
  if (!preg_match('/^sb:foot:(\d+):/', (string) ($sel['ev'] ?? ''), $m)) return null;
  $r = $results[$m[1]] ?? null;
  if (!is_array($r)) return null;
  $v = (string) ($r['v'] ?? '');
  $ko = (int) ($sel['ko'] ?? 0);
  $auto = $auto ?? (bool) sb_config()['autosettle'];
  if ($v === 'void') return 'void';
  if ($v === 'fin') {
    if (isset($sel['ti'], $r['ti']) && array_map('intval', (array) $sel['ti']) !== array_map('intval', (array) $r['ti'])) return null; // jamais deviner
    $ts = (int) ($r['ts'] ?? 0);
    if ($ts <= 0) return null;
    if ($ko > 0 && $ts > $ko + SB_PST_VOID) return 'void';
    if ($betAt >= $ts && empty($sel['lv'])) return 'void'; // pari posé après le vrai coup d'envoi (sauf pari EN DIRECT : c'est voulu)
    return sb_settle_mk(substr((string) $sel['ev'], strlen('sb:foot:' . $m[1] . ':')), (string) ($sel['k'] ?? ''), (array) ($r['ft'] ?? []), isset($r['ht']) ? (array) $r['ht'] : null);
  }
  if ($v === 'wait' && $auto && $ko > 0 && $now > $ko + SB_PST_VOID && (int) ($r['at'] ?? 0) > $now - 7200) return 'void';
  return null;
}

/* ------------------------------------------------------------- index des matchs (par jour) -------------------------- */

function sb_day_file(string $day): string { return 'foot-day-' . $day . '.json'; }
function sb_day(string $day): array { return sb_read(sb_day_file($day)); }
function sb_slug(string $s): string { return trim((string) preg_replace('/[^a-z0-9]+/', '-', strtolower($s)), '-'); }
function sb_pair($p): ?array { return is_array($p) && is_numeric($p['home'] ?? null) && is_numeric($p['away'] ?? null) ? [(int) $p['home'], (int) $p['away']] : null; }
/** Une ligne de la réponse /fixtures → ligne compacte de l'index (null si illisible). */
function sb_fx_row(array $r): ?array {
  $f = (array) ($r['fixture'] ?? []); $lg = (array) ($r['league'] ?? []); $tm = (array) ($r['teams'] ?? []);
  $id = (int) ($f['id'] ?? 0); $hid = (int) ($tm['home']['id'] ?? 0); $aid = (int) ($tm['away']['id'] ?? 0);
  if ($id <= 0 || $hid <= 0 || $aid <= 0 || (int) ($f['timestamp'] ?? 0) <= 0) return null;
  $sc = (array) ($r['score'] ?? []);
  return ['ts' => (int) $f['timestamp'], 'st' => strtoupper((string) ($f['status']['short'] ?? '')), 'm' => is_numeric($f['status']['elapsed'] ?? null) ? (int) $f['status']['elapsed'] : null,
    'mx' => is_numeric($f['status']['extra'] ?? null) ? (int) $f['status']['extra'] : 0, // arrêts de jeu annoncés (« +6 min »)
    'p1' => (int) ($f['periods']['first'] ?? 0), 'p2' => (int) ($f['periods']['second'] ?? 0), // début des mi-temps (horloge exacte à la seconde)
    'lg' => (int) ($lg['id'] ?? 0),
    'h' => [$hid, mb_substr((string) ($tm['home']['name'] ?? ''), 0, 60), (string) ($tm['home']['logo'] ?? '')],
    'a' => [$aid, mb_substr((string) ($tm['away']['name'] ?? ''), 0, 60), (string) ($tm['away']['logo'] ?? '')],
    'g' => sb_pair($r['goals'] ?? null), 'ht' => sb_pair($sc['halftime'] ?? null), 'ft' => sb_pair($sc['fulltime'] ?? null)];
}
function sb_lg_row(array $lg): array {
  $id = (int) ($lg['id'] ?? 0); $c = (string) ($lg['country'] ?? '');
  return ['n' => mb_substr((string) ($lg['name'] ?? ''), 0, 60), 'c' => mb_substr($c, 0, 40), 'f' => (string) ($lg['flag'] ?? ''), 'lo' => (string) ($lg['logo'] ?? ''),
    'p' => SB_TOP_LEAGUES[$id] ?? (SB_TOP_COUNTRIES[sb_slug($c)] ?? 100)];
}
/** /fixtures?date=J (1 lecture, toutes les compétitions) → index du jour (cotes déjà calculées gardées). */
function sb_import_fixtures(string $day, int $now): bool {
  $j = sb_get('fixtures?date=' . $day . '&timezone=UTC', $now);
  if ($j === null) return false;
  $fx = []; $lgs = [];
  foreach ((array) ($j['response'] ?? []) as $r) {
    if (!is_array($r) || !($row = sb_fx_row($r))) continue;
    $fx[(string) (int) $r['fixture']['id']] = $row;
    if ($row['lg'] > 0 && !isset($lgs[$row['lg']])) $lgs[(string) $row['lg']] = sb_lg_row((array) $r['league']);
  }
  sb_with(sb_day_file($day), static function (array &$s) use ($fx, $lgs, $now) {
    $old = (array) ($s['fx'] ?? []);
    foreach ($fx as $id => $row) foreach (['o', 'n', 'oat'] as $k) if (isset($old[$id][$k])) $fx[$id][$k] = $old[$id][$k];
    $s = ['at' => $now, 'lg' => $lgs, 'fx' => $fx];
    return true;
  });
  return true;
}
/** Enregistre les marchés calculés d'un match (fichier à lui) et le résumé (1x2, nombre) dans l'index du jour. */
function sb_store_markets(array $rows, int $now): int {
  $byDay = [];
  foreach ($rows as $id => $mk) {
    $id = (string) (int) $id;
    sb_with('mk' . DIRECTORY_SEPARATOR . 'foot-' . $id . '.json', static function (array &$s) use ($mk, $now) { $s = ['at' => $now, 'mk' => $mk]; return true; });
    $byDay[$id] = ['o' => $mk['1x2'] ?? null, 'n' => count($mk), 'oat' => $now];
  }
  if (!$byDay) return 0;
  $n = 0;
  foreach (sb_days($now) as $day) {
    $f = sb_dir() . DIRECTORY_SEPARATOR . sb_day_file($day);
    if (!is_file($f)) continue;
    $n += (int) sb_with(sb_day_file($day), static function (array &$s) use (&$byDay) {
      $c = 0;
      foreach ($byDay as $id => $sum) if (isset($s['fx'][$id])) { $s['fx'][$id] = array_merge($s['fx'][$id], $sum); unset($byDay[$id]); $c++; }
      return $c;
    });
  }
  return $n;
}
/** Une réponse /odds (une page) → marchés par match. Les paris / valeurs inconnus vont dans le diagnostic. */
function sb_odds_to_rows(array $j, array &$unk): array {
  $cfg = sb_config(); $out = [];
  foreach ((array) ($j['response'] ?? []) as $r) {
    if (!is_array($r)) continue;
    $id = (int) ($r['fixture']['id'] ?? 0);
    if ($id <= 0) continue;
    $mk = sb_markets((array) ($r['bookmakers'] ?? []), $cfg, $unk);
    if ($mk) $out[(string) $id] = $mk;
  }
  return $out;
}
function sb_note_unknown(array $unk): void {
  if (!$unk) return;
  sb_with('state.json', static function (array &$s) use ($unk) {
    $u = (array) ($s['unk'] ?? []);
    foreach ($unk as $k => $n) $u[$k] = (int) ($u[$k] ?? 0) + (int) $n;
    arsort($u);
    $s['unk'] = array_slice($u, 0, 80, true);
    return true;
  });
}
/** /odds?fixture=ID (page d'un match, à la demande). */
function sb_import_fixture_odds(int $id, int $now): bool {
  $j = sb_get('odds?fixture=' . $id, $now);
  if ($j === null) return false;
  $unk = []; $rows = sb_odds_to_rows($j, $unk); sb_note_unknown($unk);
  sb_store_markets($rows, $now);
  return true;
}
/** J-1 … J+2 (UTC). */
// 2026-10-22 (propriétaire) : avant-match jusqu'à J+14 → J-1, J, J+1 … J+14 (UTC) ; jamais un match sans cotes
const SB_DAYS_AHEAD = 14;
function sb_days(int $now): array { $o = []; for ($i = -1; $i <= SB_DAYS_AHEAD; $i++) $o[] = gmdate('Y-m-d', $now + $i * 86400); return $o; }

/* ------------------------------------------------------------- tâche de fond ---------------------------------------- */

/**
 * Un passage (au plus $max lectures) : index des jours (J 10 min, J+1 60 min, J+2 3 h, J-1 30 min tant que pas tout fini),
 * cotes par pages (J toutes les 2 h, J+1 / J+2 toutes les 3 h ; reprise à la page suivante au passage d'après), résultats.
 */
function sb_job_tick(int $now, int $max = SB_JOB_CALLS): array {
  $calls = 0; $log = [];
  $D = sb_days($now); [$dm1, $d0, $d1, $d2] = $D; $mid = array_slice($D, 4, 5); $lat = array_slice($D, 9); $far = array_merge($mid, $lat); // J+3…J+7 · J+8…J+14
  $st = sb_state();
  // 2026-10-22 (propriétaire : « les cotes sont toujours basses ») : une seule fois, toutes les cotes J…J+14 relues tout de suite (marge 2,5 % partout)
  if (empty($st['rp1'])) { sb_with('state.json', static function (array &$s) { if (!empty($s['rp1'])) return true; $s['od'] = []; $s['rp1'] = 1; return true; }); $st = sb_state(); }
  // 2026-10-22 (propriétaire : « marge 2 % ») : une seule fois, toutes les cotes relues avec la nouvelle marge
  if (empty($st['rp2'])) { sb_with('state.json', static function (array &$s) { if (!empty($s['rp2'])) return true; $s['od'] = []; $s['rp2'] = 1; return true; }); $st = sb_state(); }
  // 2026-10-22 (propriétaire : « 1 % ») : idem, relecture avec la marge 1 %
  if (empty($st['rp3'])) { sb_with('state.json', static function (array &$s) { if (!empty($s['rp3'])) return true; $s['od'] = []; $s['rp3'] = 1; return true; }); $st = sb_state(); }
  $fxEvery = [$d0 => 600, $d1 => 3600, $d2 => 10800, $dm1 => 1800] + array_fill_keys($mid, 21600) + array_fill_keys($lat, 43200); // J+3…J+7 : 6 h ; J+8…J+14 : 12 h
  foreach (array_merge([$d0, $dm1, $d1, $d2], $far) as $day) {
    if ($calls >= $max) break;
    $idx = sb_day($day);
    $age = $now - (int) ($idx['at'] ?? 0);
    if ($age < $fxEvery[$day]) continue;
    if ($day === $dm1 && $idx && !array_filter((array) ($idx['fx'] ?? []), static fn($r) => !in_array($r['st'] ?? '', array_merge(SB_FINAL, SB_VOID_ST, ['CANC', 'PST', 'ABD']), true))) continue;
    $calls++;
    $log[] = 'fx ' . $day . (sb_import_fixtures($day, $now) ? '' : ' ✗');
  }
  // jour chargé (week-end) : si les lectures du jour vont plus vite que prévu, cotes du jour toutes les 2 h (le direct garde sa part)
  $bud = sb_budget($now); $tight = $bud['used'] > $bud['cap'] * 0.75 * min(1.0, ($now % 86400) / 86400 + 0.15);
  $oddsEvery = [$d0 => $tight ? 7200 : 1800, $d1 => 10800, $d2 => 10800] + array_fill_keys($mid, 43200) + array_fill_keys($lat, 86400); // cotes : J toutes les 30 min (2026-10-22, marge 2,5 %) ; J+3…J+7 12 h ; J+8…J+14 24 h
  $pages = 0;
  foreach (array_merge([$d0, $d1, $d2], $far) as $day) {
    if ($calls >= $max || $pages >= SB_ODDS_PAGES_RUN) break;
    if (!is_file(sb_dir() . DIRECTORY_SEPARATOR . sb_day_file($day))) continue;
    $c = (array) ($st['od'][$day] ?? []);
    $next = (int) ($c['next'] ?? 0);
    if ($next === 0) { if ($now - (int) ($c['start'] ?? 0) < $oddsEvery[$day]) continue; $next = 1; $c = ['start' => $now, 'next' => 1, 'total' => 1]; }
    $unk = [];
    while ($next > 0 && $calls < $max && $pages < SB_ODDS_PAGES_RUN) {
      $calls++; $pages++;
      $j = sb_get('odds?date=' . $day . '&timezone=UTC&page=' . $next, $now);
      if ($j === null) { $log[] = 'odds ' . $day . ' p' . $next . ' ✗'; $next = 0; $c['err'] = $now; break; }
      $rows = sb_odds_to_rows($j, $unk);
      $stored = sb_store_markets($rows, $now);
      $tot = max(1, min(200, (int) ($j['paging']['total'] ?? 1)));
      $log[] = 'odds ' . $day . ' p' . $next . '/' . $tot . ' (' . $stored . ')';
      $c['total'] = $tot;
      $next = $next < $tot ? $next + 1 : 0;
    }
    $c['next'] = $next;
    sb_note_unknown($unk);
    sb_with('state.json', static function (array &$s) use ($day, $c) { $s['od'][$day] = $c; return true; });
  }
  $res = sb_results_job($now, $max - $calls);
  $calls += (int) ($res['calls'] ?? 0);
  if ($calls > 0) sb_with('state.json', static function (array &$s) use ($now, $log) {
    $s['lastImport'] = $now; $s['log'] = array_slice($log, 0, 20);
    if (isset($s['od'])) foreach (array_keys((array) $s['od']) as $d) if ($d < gmdate('Y-m-d', $now - 86400)) unset($s['od'][$d]);
    return true;
  });
  sb_prune($now);
  return ['calls' => $calls, 'log' => $log, 'results' => $res];
}
/** Ménage (au plus une fois par heure) : index de plus de 3 jours, marchés des matchs passés, cache. */
function sb_prune(int $now): void {
  $f = sb_dir() . DIRECTORY_SEPARATOR . 'prune.at';
  if (is_file($f) && filemtime($f) > $now - 3600) return;
  @touch($f, $now);
  $keep = [];
  foreach (sb_days($now) as $d) foreach ((array) (sb_day($d)['fx'] ?? []) as $id => $r) $keep[(string) $id] = 1;
  foreach ((array) glob(sb_dir() . DIRECTORY_SEPARATOR . 'foot-day-*.json') as $p) if (preg_match('/(\d{4}-\d{2}-\d{2})\.json$/', (string) $p, $m) && $m[1] < gmdate('Y-m-d', $now - 3 * 86400)) {
    $pend = false; try { sb_res_day($m[1], $now, $pend); } catch (Throwable $e) { /* résultats : jamais bloquant */ } // gardé en petit fichier (30 jours)
    @unlink((string) $p);
  }
  sb_res_prune($now);
  foreach ((array) glob(sb_dir() . DIRECTORY_SEPARATOR . 'mk' . DIRECTORY_SEPARATOR . 'foot-*.json') as $p) if (preg_match('/foot-(\d+)\.json$/', (string) $p, $m) && !isset($keep[$m[1]]) && filemtime((string) $p) < $now - 86400) @unlink((string) $p);
  foreach ((array) glob(sb_dir() . DIRECTORY_SEPARATOR . 'cache' . DIRECTORY_SEPARATOR . '*.json') as $p) if (filemtime((string) $p) < $now - 86400) @unlink((string) $p);
  try { sb_o_prune($now); } catch (Throwable $e) { /* autres sports : jamais bloquant */ }
}
/** Après la réponse au joueur : au plus une fois par minute, un seul à la fois, jamais d'erreur visible. */
function sb_maybe_run(int $now = 0): ?array {
  $now = $now ?: sb_now();
  if (!sb_has_key()) return null;
  $at = sb_dir() . DIRECTORY_SEPARATOR . 'job.at';
  clearstatcache(true, $at);
  if (is_file($at) && filemtime($at) > $now - SB_JOB_EVERY) return null;
  $lk = @fopen($at . '.lock', 'c');
  if (!$lk || !flock($lk, LOCK_EX | LOCK_NB)) { if ($lk) fclose($lk); return null; }
  try {
    clearstatcache(true, $at);
    if (is_file($at) && filemtime($at) > $now - SB_JOB_EVERY) return null;
    @touch($at, $now); // posé AVANT : jamais deux passages de suite, même si celui-ci échoue
    $r = sb_job_tick($now);
    foreach (sb_take_wanted() as $id) if (sb_import_fixture_odds($id, $now)) $r['calls']++;
    return $r;
  } catch (Throwable $e) {
    sb_note_error('Tâche : ' . $e->getMessage(), $now);
    return null;
  } finally { flock($lk, LOCK_UN); fclose($lk); }
}
/** api.php : à appeler pour les actions paris (sp* / sb*) ; travail fait APRÈS la réponse (sinon rien : jamais ralentir). */
function sb_after_response(): void {
  if (PHP_SAPI === 'cli' || !function_exists('fastcgi_finish_request')) return;
  static $on = false;
  if ($on) return;
  $on = true;
  register_shutdown_function(static function () {
    try { fastcgi_finish_request(); } catch (Throwable $e) { /* déjà fait */ }
    try { sb_live_tick(); } catch (Throwable $e) { /* jamais bloquant */ }
    try { sb_maybe_run(); } catch (Throwable $e) { /* jamais bloquant */ }
    try { sb_res_fetch_wanted(sb_now()); } catch (Throwable $e) { /* jamais bloquant */ }
    try { sb_o_maybe_run(); } catch (Throwable $e) { /* autres sports : jamais bloquant */ }
    try { if (function_exists('pred_maybe_run')) pred_maybe_run(); } catch (Throwable $e) { /* prédictions Predict : jamais bloquant */ }
  });
}
/** Page d'un match ouverte, cotes de plus de 3 h → demandé (au plus une fois par 3 h et par match, 20 par heure en tout). */
function sb_want_fixture(int $id, int $now): void {
  sb_with('state.json', static function (array &$s) use ($id, $now) {
    $w = (array) ($s['want'] ?? []);
    if ((int) ($s['wantTry'][$id] ?? 0) > $now - SB_FX_ODDS_TTL) return false;
    $h = (array) ($s['wantHour'] ?? []); $h = array_values(array_filter($h, static fn($t) => (int) $t > $now - 3600));
    if (count($h) >= 20) return false;
    $h[] = $now; $s['wantHour'] = $h;
    $w[] = $id; $s['want'] = array_values(array_unique($w));
    $t = (array) ($s['wantTry'] ?? []); $t[$id] = $now; $s['wantTry'] = array_slice($t, -300, null, true);
    return true;
  });
  sb_after_response();
}
function sb_take_wanted(): array {
  return (array) sb_with('state.json', static function (array &$s) { $w = array_slice((array) ($s['want'] ?? []), 0, 10); $s['want'] = array_slice((array) ($s['want'] ?? []), 10); return $w; });
}

/* ------------------------------------------------------------- résultats + règlement automatique ------------------- */

/** Matchs SB avec des coupons ouverts : id API → [ko, ti, mk…]. */
function sb_open_fixtures(): array {
  $out = [];
  foreach ((array) (sp_with('bets.json', static fn(array &$s) => $s['b'] ?? []) ?: []) as $b) {
    if (($b['status'] ?? '') !== 'open') continue;
    foreach ((array) ($b['sel'] ?? []) as $s) {
      if (!preg_match('/^sb:foot:(\d+):/', (string) ($s['ev'] ?? ''), $m) || isset($s['r'])) continue;
      $o = $out[$m[1]] ?? ['ko' => PHP_INT_MAX, 'ti' => $s['ti'] ?? null, 't' => (string) ($s['t'] ?? ''), 'n' => 0];
      $o['ko'] = min($o['ko'], (int) ($s['ko'] ?? 0)); $o['n']++;
      $out[$m[1]] = $o;
    }
  }
  return $out;
}
/** Classe un état API : fin / void / wait / live / chk, avec contrôle des numéros d'équipes. */
function sb_classify(array $row, ?array $ti, int $ko, int $now): array {
  $st = (string) ($row['st'] ?? '');
  $base = ['st' => $st, 'ts' => (int) ($row['ts'] ?? 0), 'ti' => [(int) ($row['h'][0] ?? 0), (int) ($row['a'][0] ?? 0)], 'at' => $now];
  if ($ti !== null && array_map('intval', $ti) !== $base['ti']) return $base + ['v' => 'chk', 'why' => 'Équipes différentes de celles du pari'];
  if (in_array($st, SB_FINAL, true)) {
    $ft = $row['ft'] ?? null;
    if ($ft === null && $st === 'FT') $ft = $row['g'] ?? null;
    if (!is_array($ft)) return $base + ['v' => 'chk', 'why' => 'Fini (' . $st . ') sans score des 90 min'];
    return $base + ['v' => 'fin', 'ft' => $ft, 'ht' => $row['ht'] ?? null];
  }
  if (in_array($st, SB_VOID_ST, true)) return $base + ['v' => 'void', 'why' => 'Match attribué sur tapis vert (' . $st . ')'];
  if (in_array($st, SB_WAIT_ST, true)) return $base + ['v' => 'wait', 'why' => $st];
  if (in_array($st, SB_LIVE_ST, true)) return $base + ['v' => ($now > $ko + 5 * 3600 ? 'chk' : 'live'), 'why' => $now > $ko + 5 * 3600 ? 'Toujours « en cours » 5 h après le début' : ''];
  return $base + ['v' => 'chk', 'why' => 'État inconnu : ' . $st];
}
/**
 * Résultats des matchs qui ont des coupons ouverts : index du jour (frais) ou /fixtures?ids=… (20 par lecture, gardé 30 min),
 * puis règlement par sp_resolve (chemin de paiement existant). autosettle faux → résultats « prop » (l'admin valide).
 */
function sb_results_job(int $now, int $maxCalls = 3, ?array $db = null): array {
  $open = sb_open_fixtures();
  $known = sb_results();
  $auto = (bool) sb_config()['autosettle'];
  $idx = [];
  foreach (sb_days($now) as $d) { $j = sb_day($d); if ((int) ($j['at'] ?? 0) > $now - 3600) foreach ((array) ($j['fx'] ?? []) as $id => $r) $idx[(string) $id] = $r; }
  // 2026-10-22 (propriétaire : « payer vite ») : le flux du direct (lu toutes les ~10 s) donne la fin du match tout de suite
  $Lv = sb_live_data();
  if ($now - (int) ($Lv['fat'] ?? 0) <= 120) foreach ((array) ($Lv['fx'] ?? []) as $id => $r) if (in_array((string) ($r['st'] ?? ''), SB_FINAL, true) && is_array($r['ft'] ?? null)) $idx[(string) $id] = $r;
  $need = []; $upd = []; $calls = 0;
  foreach ($open as $id => $o) {
    $k = $known[$id] ?? null;
    if (is_array($k) && in_array($k['v'] ?? '', ['fin', 'void'], true)) continue; // déjà connu (le règlement suit)
    if (is_array($k) && !empty($k['man'])) continue;
    if ($o['ko'] > $now) continue; // pas encore commencé
    $late = $now > $o['ko'] + 105 * 60 && !in_array((string) ($idx[$id]['st'] ?? ''), array_merge(SB_FINAL, SB_VOID_ST), true); // devrait être fini : relu directement
    if (isset($idx[$id]) && !$late) $upd[$id] = sb_classify($idx[$id], $o['ti'], $o['ko'], $now);
    else $need[] = $id;
  }
  foreach (array_chunk($need, 20) as $chunk) {
    if ($calls >= max(0, $maxCalls)) break;
    $calls++;
    $j = sb_get_cached('fixtures?ids=' . implode('-', $chunk) . '&timezone=UTC', 180, $now); // 3 min (avant 30) : gains payés vite
    if ($j === null) break;
    $seen = [];
    foreach ((array) ($j['response'] ?? []) as $r) if (is_array($r) && ($row = sb_fx_row($r))) { $id = (string) (int) $r['fixture']['id']; if (isset($open[$id])) { $upd[$id] = sb_classify($row, $open[$id]['ti'], $open[$id]['ko'], $now); $seen[$id] = 1; } }
    foreach ($chunk as $id) if (!isset($seen[$id]) && $now > $open[$id]['ko'] + 6 * 3600) $upd[$id] = ['v' => 'chk', 'why' => 'Match introuvable dans l\'API', 'at' => $now, 'ts' => 0, 'st' => ''];
  }
  $newFinal = 0; $newChk = [];
  if ($upd) {
    sb_with('results.json', static function (array &$s) use ($upd, $auto, $now, &$newFinal, &$newChk, $open) {
      foreach ($upd as $id => $r) {
        $old = (array) ($s['fx'][$id] ?? []);
        if (!empty($old['man'])) continue;
        if (!$auto && in_array($r['v'], ['fin', 'void'], true)) $r['v'] = 'prop'; // l'admin valide
        if (in_array($r['v'], ['fin', 'void'], true)) $newFinal++;
        if (in_array($r['v'], ['chk', 'prop'], true) && ($old['v'] ?? '') !== $r['v']) $newChk[] = ($open[$id]['t'] ?? $id) . ' : ' . ($r['why'] ?? 'à valider');
        $r['t'] = $open[$id]['t'] ?? ($old['t'] ?? '');
        $s['fx'][$id] = $r;
      }
      foreach ((array) ($s['fx'] ?? []) as $id => $r) if ((int) ($r['at'] ?? 0) < $now - 40 * 86400) unset($s['fx'][$id]);
      return true;
    });
  }
  foreach (array_slice($newChk, 0, 5) as $msg) sb_alert('✋ Paris : résultat à vérifier', $msg, $now);
  $settled = null;
  // aussi les annulations « reporté > 48 h » (décidées au moment du règlement) : sp_resolve si un choix peut être réglé
  $pstDue = false;
  foreach ($open as $id => $o) if (($upd[$id]['v'] ?? ($known[$id]['v'] ?? '')) === 'wait' && $now > $o['ko'] + SB_PST_VOID) $pstDue = true;
  if ($newFinal > 0 || ($pstDue && $auto)) {
    $db = $db ?? (function_exists('load_db') ? load_db() : null);
    if (is_array($db)) $settled = sp_resolve($db);
  }
  return ['calls' => $calls, 'updated' => count($upd), 'final' => $newFinal, 'settled' => $settled];
}
/** Admin : score saisi à la main (HT + FT) ou « annuler » pour un match → règlement (chemin existant). */
function sb_admin_result(array $db, string $fid, ?array $ht, ?array $ft, bool $void, int $now = 0): array {
  $now = $now ?: sb_now();
  if (preg_match('/^([a-z]+):(\d+)$/', $fid, $mo) && $mo[1] !== 'foot') return isset(SB_O_SPORTS[$mo[1]]) ? sb_o_admin_result($db, $mo[1], $mo[2], $ft, $void, $now) : ['ok' => false, 'reason' => 'Match inconnu'];
  if (!preg_match('/^(?:foot:)?(\d+)$/', $fid, $m)) return ['ok' => false, 'reason' => 'Match inconnu'];
  $id = $m[1];
  $open = sb_open_fixtures();
  $known = sb_results();
  if (!isset($open[$id]) && !isset($known[$id])) return ['ok' => false, 'reason' => 'Aucun pari ouvert sur ce match'];
  if (!$void) {
    $ok = static fn($p) => is_array($p) && count($p) === 2 && is_numeric($p[0]) && is_numeric($p[1]) && (int) $p[0] >= 0 && (int) $p[1] >= 0 && (int) $p[0] <= 30 && (int) $p[1] <= 30;
    if (!$ok($ft) || !$ok($ht)) return ['ok' => false, 'reason' => 'Score invalide (mi-temps et fin)'];
    $ft = [(int) $ft[0], (int) $ft[1]]; $ht = [(int) $ht[0], (int) $ht[1]];
    if ($ht[0] > $ft[0] || $ht[1] > $ft[1]) return ['ok' => false, 'reason' => 'La mi-temps ne peut pas dépasser la fin'];
  }
  $o = $open[$id] ?? null; $k = (array) ($known[$id] ?? []);
  $ts = (int) ($k['ts'] ?? 0) ?: (int) ($o['ko'] ?? 0);
  $row = $void ? ['v' => 'void', 'why' => 'Annulé par l\'admin'] : ['v' => 'fin', 'ft' => $ft, 'ht' => $ht, 'st' => 'FT'];
  $row += ['ts' => $ts, 'ti' => $o['ti'] ?? ($k['ti'] ?? null), 't' => $o['t'] ?? ($k['t'] ?? ''), 'at' => $now, 'man' => 1];
  if ($row['ti'] === null) unset($row['ti']);
  sb_with('results.json', static function (array &$s) use ($id, $row) { $s['fx'][$id] = $row; return true; });
  return ['ok' => true] + sp_resolve($db);
}
/** Admin : liste « Résultats à vérifier » (anomalies, propositions si autosettle faux, reportés > 48 h sans décision). */
function sb_check_list(int $now = 0): array {
  $now = $now ?: sb_now();
  $open = sb_open_fixtures(); $known = sb_results(); $out = [];
  foreach ($open as $id => $o) {
    $r = (array) ($known[$id] ?? []);
    $v = (string) ($r['v'] ?? '');
    $late = $o['ko'] > 0 && $now > $o['ko'] + 6 * 3600 && !in_array($v, ['fin', 'void'], true);
    if (in_array($v, ['chk', 'prop'], true) || ($v === 'wait' && $now > $o['ko'] + SB_PST_VOID) || ($late && $v !== 'wait'))
      $out[] = ['id' => 'foot:' . $id, 't' => $o['t'], 'ko' => $o['ko'], 'n' => $o['n'], 'v' => $v ?: 'none', 'why' => (string) ($r['why'] ?? ($v === '' ? 'Pas de résultat reçu' : '')), 'st' => (string) ($r['st'] ?? ''),
        'ft' => $r['ft'] ?? null, 'ht' => $r['ht'] ?? null];
  }
  return array_merge($out, sb_o_check_list($now)); // + autres sports
}

/* ------------------------------------------------------------- libellés (français ; le téléphone traduit mk / k) ---- */

function sb_mk_name(string $mk): string {
  $fam = sb_fam($mk); $x = str_replace('.', ',', substr($mk, strlen($fam) + 1));
  $n = ['1x2' => 'Résultat', 'dc' => 'Double chance', 'dnb' => 'Remboursé si nul', 'ou' => 'Buts (plus/moins de ' . $x . ')', 'btts' => 'Les deux équipes marquent',
    'tth' => 'Buts domicile (' . $x . ')', 'tta' => 'Buts extérieur (' . $x . ')', 'oe' => 'Total de buts pair/impair', 'csh' => 'Domicile n\'encaisse pas', 'csa' => 'Extérieur n\'encaisse pas',
    'wnh' => 'Domicile gagne sans encaisser', 'wna' => 'Extérieur gagne sans encaisser', 'eh' => 'Handicap (' . $x . ')', 'ah' => 'Handicap asiatique (' . $x . ')',
    'ht1x2' => 'Résultat à la mi-temps', 'htou' => 'Buts 1re mi-temps (' . $x . ')', 'htbtts' => 'Les deux marquent en 1re mi-temps', '2h1x2' => 'Résultat 2e mi-temps',
    'htft' => 'Mi-temps / fin', 'cs' => 'Score exact', 'rbtts' => 'Résultat + les deux marquent', 'rou' => 'Résultat + buts (' . $x . ')', 'eg' => 'Nombre exact de buts', 'hsh' => 'Mi-temps la plus prolifique',
    'htdc' => 'Double chance 1re mi-temps', '2hdc' => 'Double chance 2e mi-temps', '2hbtts' => 'Les deux marquent en 2e mi-temps', 'htcs' => 'Score exact 1re mi-temps',
    'htoe' => 'Buts pair/impair 1re mi-temps', '2hoe' => 'Buts pair/impair 2e mi-temps', '2hou' => 'Buts 2e mi-temps (' . $x . ')', 'httth' => 'Buts domicile 1re mi-temps (' . $x . ')',
    'httta' => 'Buts extérieur 1re mi-temps (' . $x . ')', 'htah' => 'Handicap asiatique 1re mi-temps (' . $x . ')'];
  return $n[$fam] ?? $mk;
}
function sb_k_name(string $mk, string $k, string $home, string $away): string {
  $fam = sb_fam($mk);
  $one = static fn(string $c): string => $c === 'H' ? $home : ($c === 'A' ? $away : 'Nul');
  $yn = static fn(string $c): string => $c === 'Y' ? 'Oui' : 'Non';
  $ou = static fn(string $c): string => $c === 'O' ? 'Plus' : 'Moins';
  switch ($fam) {
    case '1x2': case 'eh': case 'ht1x2': case '2h1x2': case 'dnb': case 'ah': case 'htah': case '12': return $one($k);
    case 'dc': case 'htdc': case '2hdc': return ['HD' => $home . ' ou nul', 'HA' => $home . ' ou ' . $away, 'DA' => 'Nul ou ' . $away][$k] ?? $k;
    case 'ou': case 'tth': case 'tta': case 'htou': case '2hou': case 'httth': case 'httta': return $ou($k);
    case 'oe': case 'htoe': case '2hoe': return $k === 'O' ? 'Impair' : 'Pair';
    case 'btts': case 'htbtts': case '2hbtts': case 'csh': case 'csa': case 'wnh': case 'wna': return $yn($k);
    case 'htcs': return str_replace(':', ' - ', $k);
    case 'htft': $p = explode('/', $k); return count($p) === 2 ? $one($p[0]) . ' / ' . $one($p[1]) : $k;
    case 'rbtts': $p = explode('/', $k); return count($p) === 2 ? $one($p[0]) . ' + ' . ($p[1] === 'Y' ? 'les deux marquent' : 'pas les deux') : $k;
    case 'rou': $p = explode('/', $k); return count($p) === 2 ? $one($p[0]) . ' + ' . strtolower($ou($p[1])) : $k;
    case 'cs': return str_replace(':', ' - ', $k);
    case 'eg': return $k . ' but' . ($k === '0' || $k === '1' ? '' : 's');
    case 'hsh': return ['1' => '1re mi-temps', '2' => '2e mi-temps', 'X' => 'Égalité'][$k] ?? $k;
  }
  return $k;
}
function sb_rules(): string {
  return 'Football : résultat des 90 minutes + arrêts de jeu (prolongation et tirs au but non comptés). Paris fermés au coup d\'envoi ; '
    . 'pari posé après le vrai coup d\'envoi : remboursé. Match reporté, arrêté ou annulé et pas joué dans les 48 h : remboursé. '
    . 'Match attribué sur tapis vert : remboursé. « Remboursé si nul » : mise rendue en cas de nul.';
}

/* ------------------------------------------------------------- vue joueur (fichiers locaux seulement) -------------- */

/** Un match de l'index → forme commune (spec : fx). */
function sb_fx_public(string $id, array $r): array {
  return ['id' => 'foot:' . $id, 'lg' => (int) ($r['lg'] ?? 0), 'ts' => (int) ($r['ts'] ?? 0), 'st' => (string) ($r['st'] ?? ''), 'm' => $r['m'] ?? null,
    'h' => ['n' => (string) ($r['h'][1] ?? ''), 'lo' => (string) ($r['h'][2] ?? '')], 'a' => ['n' => (string) ($r['a'][1] ?? ''), 'lo' => (string) ($r['a'][2] ?? '')],
    'sc' => $r['g'] ?? null, 'o' => !empty($r['o']) ? ['mk' => '1x2', 'o' => $r['o']] : null, 'n' => (int) ($r['n'] ?? 0), 'live' => 0, 'susp' => 0];
}
function sb_bettable_row(array $r, int $now): bool {
  return in_array((string) ($r['st'] ?? ''), ['NS', 'TBD'], true) && (int) ($r['ts'] ?? 0) > $now && (int) ($r['n'] ?? 0) > 0 && (int) ($r['oat'] ?? 0) > $now - sb_odds_max_age((int) ($r['ts'] ?? 0), $now);
}
/** Âge maximal des cotes : 8 h ; match à plus de 60 h (relu toutes les 12 h) : 13 h ; à plus de 7 jours (relu toutes les 24 h) : 25 h. */
function sb_odds_max_age(int $ko, int $now): int { return $ko - $now > 604800 ? 90000 : ($ko - $now > 216000 ? 46800 : SB_ODDS_MAX_AGE); }
/** sbList : day 0|1|2 = aujourd'hui / demain / après-demain dans le fuseau du joueur ($tz minutes à l'est d'UTC, ex. 345). */
function sb_list(?array $user, $day, int $tz = 0, int $now = 0, bool $cnt = false, string $sp = 'foot'): array {
  $now = $now ?: sb_now();
  if (!sb_visible($user)) return ['ok' => false, 'reason' => 'off'];
  $tz = max(-720, min(840, $tz)) * 60;
  if ($day === 'live') return sb_live_list($user, $now);
  if ($sp !== 'foot') return sb_o_list($user, $sp, $day, $tz, $now, $cnt); // autres sports (avant-match seulement)
  // « Tout » (day = 'all') : tous les matchs ouverts aux paris, de maintenant à J+14 (une seule réponse)
  $all = $day === 'all';
  $d = $all ? 0 : max(0, min(SB_DAYS_AHEAD, (int) $day));
  $from = (int) (floor(($now + $tz) / 86400) * 86400) - $tz + $d * 86400; $to = $from + ($all ? (SB_DAYS_AHEAD + 1) * 86400 : 86400);
  $fx = []; $lgs = []; $lgUsed = [];
  $dates = []; for ($t = $from; $t < $to; $t += 86400) $dates[] = gmdate('Y-m-d', $t); $dates[] = gmdate('Y-m-d', $to - 1);
  foreach (array_unique($dates) as $dd) {
    $j = sb_day($dd);
    foreach ((array) ($j['fx'] ?? []) as $id => $r) {
      $ts = (int) ($r['ts'] ?? 0);
      if ($ts < $from || $ts >= $to || !sb_bettable_row($r, $now)) continue;
      $fx[(string) $id] = sb_fx_public((string) $id, $r);
      $lgUsed[(int) $r['lg']] = 1;
    }
    foreach ((array) ($j['lg'] ?? []) as $lid => $l) if (isset($lgUsed[(int) $lid]) && !isset($lgs[(int) $lid])) $lgs[(int) $lid] = ['id' => (int) $lid] + (array) $l;
  }
  $lgs = array_values(array_filter($lgs, static fn($l) => isset($lgUsed[$l['id']])));
  usort($lgs, static fn($a, $b) => [(int) $a['p'], (string) $a['c'], (string) $a['n']] <=> [(int) $b['p'], (string) $b['c'], (string) $b['n']]);
  $fx = array_values($fx);
  usort($fx, static fn($a, $b) => [$a['ts'], $a['id']] <=> [$b['ts'], $b['id']]);
  sb_after_response();
  $out = ['ok' => true, 'at' => $now, 'sports' => sb_sports_list($user, $now), 'lg' => $lgs, 'fx' => $fx];
  if ($cnt) $out['days'] = sb_day_counts($tz, $now);
  return $out;
}
/** Nombre de matchs ouverts aux paris par jour du joueur (0 … 14) — le « 📅 Date » de Populaire ; gardé 2 min par fuseau. */
function sb_day_counts(int $tzSec, int $now): array {
  $f = sb_dir() . DIRECTORY_SEPARATOR . 'cache' . DIRECTORY_SEPARATOR . 'daycnt' . $tzSec . '.json';
  clearstatcache(true, $f);
  if (is_file($f) && filemtime($f) > $now - 120 && is_array($c = json_decode((string) @file_get_contents($f), true)) && count($c) === SB_DAYS_AHEAD + 1) return array_map('intval', $c);
  $base = (int) (floor(($now + $tzSec) / 86400) * 86400) - $tzSec;
  $c = array_fill(0, SB_DAYS_AHEAD + 1, 0);
  foreach (sb_days($now) as $dd) foreach ((array) (sb_day($dd)['fx'] ?? []) as $r) {
    $i = (int) floor(((int) ($r['ts'] ?? 0) - $base) / 86400);
    if ($i >= 0 && $i <= SB_DAYS_AHEAD && sb_bettable_row((array) $r, $now)) $c[$i]++;
  }
  if (!is_dir(dirname($f))) @mkdir(dirname($f), 0750, true);
  @file_put_contents($f, json_encode($c));
  return $c;
}
/**
 * 2026-10-22 (propriétaire : « que les nouveaux voient que le site est actif ») — RÉSULTATS des 30 derniers jours :
 * sbResults {day: 0…-6 (puces) | date: 'AAAA-MM-JJ' (calendrier, 30 jours)} → matchs TERMINÉS de ce jour (fuseau du joueur)
 * des grands championnats (SB_TOP_LEAGUES / pays suivis) et des championnats où nous avons eu des cotes, même pour un match
 * que nous n'avons pas proposé. Sources : index du jour (J-1, J : déjà lus) ; sinon petit fichier par jour
 * res/res-AAAA-MM-JJ.json {at, done, lg, fx:{id:{ts, lg, st, h:[n, logo], a:[n, logo], ft, ht}}} — écrit depuis l'index
 * (aucun appel) ou, s'il manque, lu UNE fois par /fixtures?date=J (APRÈS la réponse, ≤ 1 lecture par date ; jour complet
 * jamais relu ; jour incomplet relu au plus toutes les 6 h). Fichiers de plus de 30 jours effacés.
 * fx : {id, lg, ts, st, h:{n,lo}, a:{n,lo}, ft:[h,a], ht:[h,a]|null}.
 */
const SB_RES_DAYS = 30;
const SB_RES_RETRY = 21600; // jour incomplet : nouvelle lecture au plus toutes les 6 h
function sb_res_dir(): string { $d = sb_dir() . DIRECTORY_SEPARATOR . 'res'; if (!is_dir($d)) @mkdir($d, 0750, true); return $d; }
function sb_res_name(string $day): string { return 'res' . DIRECTORY_SEPARATOR . 'res-' . $day . '.json'; }
function sb_res_file(string $day): array { sb_res_dir(); return sb_read(sb_res_name($day)); }
/** Championnats où nous avons eu des cotes (gardés 60 jours) : {lg: dernier jour}. */
function sb_res_odds_lgs(): array { sb_res_dir(); return (array) (sb_read('res' . DIRECTORY_SEPARATOR . 'lgs.json')['l'] ?? []); }
function sb_res_keep_lg(int $lg, array $l, array $oddsLg): bool { return $lg > 0 && (((int) ($l['p'] ?? 100)) < 100 || isset($oddsLg[(string) $lg])); }
/** Ligne d'index / de /fixtures → ligne compacte de résultat (null si pas terminé ou sans score). */
function sb_res_row(array $r): ?array {
  if (!in_array((string) ($r['st'] ?? ''), SB_FINAL, true)) return null;
  $ft = is_array($r['ft'] ?? null) ? $r['ft'] : (is_array($r['g'] ?? null) ? $r['g'] : null);
  if (!$ft) return null;
  return ['ts' => (int) ($r['ts'] ?? 0), 'lg' => (int) ($r['lg'] ?? 0), 'st' => (string) $r['st'], 'h' => [(string) ($r['h'][1] ?? ''), (string) ($r['h'][2] ?? '')],
    'a' => [(string) ($r['a'][1] ?? ''), (string) ($r['a'][2] ?? '')], 'ft' => [(int) $ft[0], (int) $ft[1]], 'ht' => is_array($r['ht'] ?? null) ? [(int) $r['ht'][0], (int) $r['ht'][1]] : null];
}
/** Index du jour {lg, fx} → fichier de résultats du jour (grands championnats + ceux de nos cotes). */
function sb_res_from_index(string $day, array $idx, int $now): array {
  $odds = [];
  foreach ((array) ($idx['fx'] ?? []) as $r) if (!empty($r['o']) || (int) ($r['n'] ?? 0) > 0) $odds[(string) (int) ($r['lg'] ?? 0)] = $day;
  if ($odds) sb_with('res' . DIRECTORY_SEPARATOR . 'lgs.json', static function (array &$s) use ($odds, $now) {
    $l = array_replace((array) ($s['l'] ?? []), $odds);
    $lim = gmdate('Y-m-d', $now - 60 * 86400); $l = array_filter($l, static fn($d) => (string) $d >= $lim);
    if ($l === (array) ($s['l'] ?? [])) return false;
    $s['l'] = $l; return true;
  });
  $oddsLg = sb_res_odds_lgs() + $odds;
  $fx = []; $lgs = []; $open = 0;
  foreach ((array) ($idx['fx'] ?? []) as $id => $r) {
    $l = (array) ($idx['lg'][(string) (int) ($r['lg'] ?? 0)] ?? []);
    if (!sb_res_keep_lg((int) ($r['lg'] ?? 0), $l, $oddsLg)) continue;
    $row = sb_res_row((array) $r);
    if (!$row) { if (!in_array((string) ($r['st'] ?? ''), array_merge(SB_VOID_ST, ['CANC', 'PST', 'ABD', 'SUSP', 'INT']), true)) $open++; continue; }
    $fx[(string) $id] = $row;
    $lgs[(string) $row['lg']] = ['n' => (string) ($l['n'] ?? ''), 'c' => (string) ($l['c'] ?? ''), 'f' => (string) ($l['f'] ?? ''), 'p' => (int) ($l['p'] ?? 100)];
  }
  return ['at' => $now, 'done' => $day < gmdate('Y-m-d', $now) && ($open === 0 || $day < gmdate('Y-m-d', $now - 2 * 86400)), 'lg' => $lgs, 'fx' => $fx];
}
/** Résultats d'un jour UTC : index (s'il existe) recopié dans le petit fichier ; sinon le petit fichier ; sinon demandé. */
function sb_res_day(string $day, int $now, bool &$pending): array {
  $idx = sb_day($day);
  if ($idx && !empty($idx['fx'])) {
    $old = sb_res_file($day);
    if ($old && (int) ($old['at'] ?? 0) >= (int) ($idx['at'] ?? 0)) return $old;
    $res = sb_res_from_index($day, $idx, (int) ($idx['at'] ?? 0) ?: $now);
    sb_with(sb_res_name($day), static function (array &$s) use ($res) { $s = $res; return true; });
    return $res;
  }
  $f = sb_res_file($day);
  if ($day >= gmdate('Y-m-d', $now)) return $f; // aujourd'hui : l'index du jour (tâche de fond) suffit
  if (!$f || (empty($f['done']) && (int) ($f['at'] ?? 0) < $now - SB_RES_RETRY)) { if (sb_res_want($day, $now)) $pending = $pending || !$f; }
  return $f;
}
/** Jour à lire (après la réponse) : au plus une demande par date et par 6 h. Vrai si une lecture est prévue. */
function sb_res_want(string $day, int $now): bool {
  return (bool) sb_with('state.json', static function (array &$s) use ($day, $now) {
    $t = (array) ($s['resTry'] ?? []);
    if ((int) ($t[$day] ?? 0) > $now - SB_RES_RETRY) return false;
    $w = (array) ($s['resWant'] ?? []);
    if (in_array($day, $w, true)) return true;
    $w[] = $day; $s['resWant'] = array_slice($w, -10); return true;
  });
}
/** Lecture des jours demandés (APRÈS la réponse ; aussi depuis l'import de l'admin) : ≤ $max lectures /fixtures?date=J. */
function sb_res_fetch_wanted(int $now, int $max = 1): int {
  if (!sb_has_key()) return 0;
  $days = (array) sb_with('state.json', static function (array &$s) use ($now, $max) {
    $w = array_values((array) ($s['resWant'] ?? [])); $t = (array) ($s['resTry'] ?? []); $take = [];
    while ($w && count($take) < $max) { $d = (string) array_shift($w); if ((int) ($t[$d] ?? 0) > $now - SB_RES_RETRY) continue; $take[] = $d; $t[$d] = $now; }
    $lim = gmdate('Y-m-d', $now - (SB_RES_DAYS + 2) * 86400);
    $t = array_filter($t, static fn($v, $k) => (string) $k >= $lim, ARRAY_FILTER_USE_BOTH);
    if (!$take && $w === array_values((array) ($s['resWant'] ?? []))) return [];
    $s['resWant'] = $w; $s['resTry'] = $t; return $take;
  });
  $n = 0;
  foreach ($days as $day) {
    if (!is_string($day) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $day) || $day < gmdate('Y-m-d', $now - SB_RES_DAYS * 86400) || $day > gmdate('Y-m-d', $now)) continue;
    if (sb_budget($now)['left'] <= SB_LIVE_RESERVE) break; // jamais dans la réserve
    $j = sb_get('fixtures?date=' . $day . '&timezone=UTC', $now);
    $n++;
    if ($j === null) continue;
    $idx = ['fx' => [], 'lg' => []];
    foreach ((array) ($j['response'] ?? []) as $r) {
      if (!is_array($r) || !($row = sb_fx_row($r))) continue;
      $idx['fx'][(string) (int) $r['fixture']['id']] = $row;
      if ($row['lg'] > 0 && !isset($idx['lg'][(string) $row['lg']])) $idx['lg'][(string) $row['lg']] = sb_lg_row((array) $r['league']);
    }
    $res = sb_res_from_index($day, $idx, $now);
    sb_with(sb_res_name($day), static function (array &$s) use ($res) { $s = $res; return true; });
  }
  return $n;
}
/** Ménage : fichiers de résultats de plus de 30 jours. */
function sb_res_prune(int $now): void {
  $lim = gmdate('Y-m-d', $now - SB_RES_DAYS * 86400);
  foreach ((array) glob(sb_res_dir() . DIRECTORY_SEPARATOR . 'res-*.json') as $p) if (preg_match('/res-(\d{4}-\d{2}-\d{2})\.json$/', (string) $p, $m) && $m[1] < $lim) @unlink((string) $p);
}
function sb_results_list(?array $user, $day, int $tz = 0, int $now = 0, $date = null): array {
  $now = $now ?: sb_now();
  if (!sb_visible($user)) return ['ok' => false, 'reason' => 'off'];
  $tz = max(-720, min(840, $tz)) * 60;
  $today = (int) (floor(($now + $tz) / 86400) * 86400) - $tz;
  if (is_string($date) && preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $date, $mm) && checkdate((int) $mm[2], (int) $mm[3], (int) $mm[1])) $d = (int) round(((int) gmmktime(0, 0, 0, (int) $mm[2], (int) $mm[3], (int) $mm[1]) - $tz - $today) / 86400);
  else $d = (int) $day;
  $d = max(1 - SB_RES_DAYS, min(0, $d));
  $from = $today + $d * 86400; $to = $from + 86400;
  $fx = []; $lgs = []; $pending = false;
  foreach (array_unique([gmdate('Y-m-d', $from), gmdate('Y-m-d', $to - 1)]) as $dd) {
    if ($dd > gmdate('Y-m-d', $now)) continue;
    $j = sb_res_day($dd, $now, $pending);
    foreach ((array) ($j['fx'] ?? []) as $id => $r) {
      $ts = (int) ($r['ts'] ?? 0);
      if ($ts < $from || $ts >= $to) continue;
      $fx[(string) $id] = ['id' => 'foot:' . $id, 'lg' => (int) $r['lg'], 'ts' => $ts, 'st' => (string) $r['st'],
        'h' => ['n' => (string) ($r['h'][0] ?? ''), 'lo' => (string) ($r['h'][1] ?? '')], 'a' => ['n' => (string) ($r['a'][0] ?? ''), 'lo' => (string) ($r['a'][1] ?? '')],
        'ft' => array_map('intval', (array) $r['ft']), 'ht' => is_array($r['ht'] ?? null) ? array_map('intval', $r['ht']) : null];
      if (!isset($lgs[(int) $r['lg']]) && isset($j['lg'][(string) $r['lg']])) $lgs[(int) $r['lg']] = ['id' => (int) $r['lg']] + (array) $j['lg'][(string) $r['lg']];
    }
  }
  $lgs = array_values($lgs);
  usort($lgs, static fn($a, $b) => [(int) ($a['p'] ?? 100), (string) ($a['c'] ?? ''), (string) ($a['n'] ?? '')] <=> [(int) ($b['p'] ?? 100), (string) ($b['c'] ?? ''), (string) ($b['n'] ?? '')]);
  $fx = array_values($fx);
  usort($fx, static fn($a, $b) => [$a['ts'], $a['id']] <=> [$b['ts'], $b['id']]);
  if ($pending) sb_after_response();
  return ['ok' => true, 'at' => $now, 'day' => $d, 'date' => gmdate('Y-m-d', $from + $tz), 'pending' => $pending, 'lg' => $lgs, 'fx' => $fx];
}
/** Index + marchés d'un match (id API) ; null si inconnu. */
function sb_find(string $id, int $now): ?array {
  foreach (sb_days($now) as $d) { $j = sb_day($d); if (isset($j['fx'][$id])) return ['row' => (array) $j['fx'][$id], 'lg' => (array) ($j['lg'][(string) $j['fx'][$id]['lg']] ?? []), 'day' => $d]; }
  return null;
}
function sb_mk_file(string $id): array { return sb_read('mk' . DIRECTORY_SEPARATOR . 'foot-' . $id . '.json'); }
/** sbMatch : tous les marchés d'un match. */
function sb_match(?array $user, string $fid, int $now = 0): array {
  $now = $now ?: sb_now();
  if (!sb_visible($user)) return ['ok' => false, 'reason' => 'off'];
  if (preg_match('/^([a-z]+):(\d+)$/', $fid, $mo) && $mo[1] !== 'foot') return sb_o_match($mo[1], $mo[2], $now); // autres sports
  if (!preg_match('/^foot:(\d+)$/', $fid, $m)) return ['ok' => false, 'reason' => 'param'];
  if (($lm = sb_live_match($user, $m[1], $now)) !== null) return $lm; // en direct (étape 3)
  $f = sb_find($m[1], $now);
  if (!$f) return ['ok' => false, 'reason' => 'closed'];
  $mf = sb_mk_file($m[1]);
  $open = sb_bettable_row($f['row'], $now) && (int) ($mf['at'] ?? 0) > $now - sb_odds_max_age((int) $f['row']['ts'], $now);
  if ((int) ($mf['at'] ?? 0) < $now - SB_FX_ODDS_TTL && (int) $f['row']['ts'] > $now) sb_want_fixture((int) $m[1], $now);
  $mk = [];
  if ($open) foreach ((array) ($mf['mk'] ?? []) as $k => $o) $mk[] = ['mk' => (string) $k, 'o' => $o, 's' => 0];
  $fx = sb_fx_public($m[1], $f['row']) + ['lgn' => (string) ($f['lg']['n'] ?? ''), 'c' => (string) ($f['lg']['c'] ?? '')];
  return ['ok' => true, 'fx' => $fx, 'mk' => $mk, 'rules' => sb_rules()];
}

/* ------------------------------------------------------------- pari (appelé par sp_bet) -------------------------- */

/** ids « en direct » (/fixtures?live=all, gardé 60 s) ; null = indisponible. */
function sb_live_ids(int $now): ?array {
  $L = sb_live_data(); // direct déjà lu il y a moins de 60 s : pas de lecture en plus
  if ((int) ($L['fat'] ?? 0) > $now - SB_LIVE_IDS_TTL) { $ids = []; foreach ((array) ($L['fx'] ?? []) as $i => $r) if (empty($r['end'])) $ids[(string) $i] = 1; return $ids; }
  $j = sb_get_cached('fixtures?live=all&timezone=UTC', SB_LIVE_IDS_TTL, $now);
  if ($j === null) return null;
  $ids = [];
  foreach ((array) ($j['response'] ?? []) as $r) if (is_array($r) && ($i = (int) ($r['fixture']['id'] ?? 0)) > 0) $ids[(string) $i] = 1;
  return $ids;
}
/**
 * Un choix SB d'un coupon : contrôle (visibilité, match pas commencé, cotes fraîches) et cote ACTUELLE du serveur.
 * Retour ['ok' => true, 'sel' => [ev, k, odd, t, l, mk, sp, fx, ko, ti], 'grp' => 'fx:foot:ID'] ou ['ok' => false, 'reason'].
 */
function sb_pick(string $ev, string $k, ?array $user, int $now, bool $liveCheck = true): array {
  if (preg_match('/^sb:([a-z]+):(\d+):([a-z0-9]+(?::-?\d+(?:\.\d+)?)?)$/', $ev, $mo) && $mo[1] !== 'foot') { // autres sports : avant-match seulement
    if (!sb_visible($user)) return ['ok' => false, 'reason' => 'closed'];
    return sb_o_pick($mo[1], $mo[2], $mo[3], $k, $now);
  }
  if (!preg_match('/^sb:foot:(\d+):([a-z0-9]+(?::-?\d+(?:\.\d+)?)?)$/', $ev, $m)) return ['ok' => false, 'reason' => 'param'];
  if (!sb_visible($user)) return ['ok' => false, 'reason' => 'closed'];
  [$id, $mk] = [$m[1], $m[2]];
  $lp = sb_live_pick($id, $mk, $k, $user, $now); // match EN DIRECT (étape 3) : marchés du direct
  if ($lp !== null) return $lp;
  $f = sb_find($id, $now);
  if (!$f) return ['ok' => false, 'reason' => 'closed'];
  $row = $f['row'];
  $mf = sb_mk_file($id);
  if (!in_array((string) ($row['st'] ?? ''), ['NS', 'TBD'], true) || $now >= (int) $row['ts'] || (int) ($mf['at'] ?? 0) < $now - sb_odds_max_age((int) $row['ts'], $now)) return ['ok' => false, 'reason' => 'closed'];
  $odd = null;
  foreach ((array) ($mf['mk'][$mk] ?? []) as $o) if ((string) ($o[0] ?? '') === $k) $odd = (float) $o[1];
  if ($odd === null || $odd < 1.01) return ['ok' => false, 'reason' => 'param'];
  if ($liveCheck && (int) $row['ts'] - $now < SB_LATE) { $live = sb_live_ids($now); if ($live !== null && isset($live[$id])) return ['ok' => false, 'reason' => 'closed']; }
  $home = (string) ($row['h'][1] ?? ''); $away = (string) ($row['a'][1] ?? '');
  $kn = sb_k_name($mk, $k, $home, $away);
  return ['ok' => true, 'grp' => 'fx:foot:' . $id, 'sel' => ['ev' => $ev, 'k' => $k, 'odd' => $odd, 't' => $home . ' - ' . $away, 'l' => $mk === '1x2' ? $kn : sb_mk_name($mk) . ' : ' . $kn,
    'mk' => $mk, 'sp' => 'foot', 'fx' => 'foot:' . $id, 'ko' => (int) $row['ts'], 'ti' => [(int) ($row['h'][0] ?? 0), (int) ($row['a'][0] ?? 0)]],
    'team' => ['h' => ['n' => $home, 'lo' => (string) ($row['h'][2] ?? '')], 'a' => ['n' => $away, 'lo' => (string) ($row['a'][2] ?? '')]]];
}
/** Alertes admin après un pari SB (grosse mise, gros gain possible). */
function sb_alert_bet(array $bet, int $now = 0): void {
  $c = sb_config();
  $stake = (float) $bet['stake']; $pot = (float) $bet['pot'];
  if ($c['alertStake'] > 0 && $stake + 1e-9 >= $c['alertStake']) sb_alert('💰 Paris : grosse mise', number_format($stake, 2, ',', ' ') . ' $ (cote ' . $bet['odd'] . ') · ' . ($bet['sel'][0]['t'] ?? ''), $now);
  elseif ($c['alertPot'] > 0 && $pot + 1e-9 >= $c['alertPot']) sb_alert('🎯 Paris : gros gain possible', number_format($pot, 2, ',', ' ') . ' $ possibles (mise ' . number_format($stake, 2, ',', ' ') . ' $)', $now);
}
/** Alerte admin après un paiement SB (gros gain versé). */
function sb_alert_win(float $win, int $now = 0): void {
  $c = sb_config();
  if ($c['alertWin'] > 0 && $win + 1e-9 >= $c['alertWin']) sb_alert('🏆 Paris : gros gain versé', number_format($win, 2, ',', ' ') . ' $ payés', $now);
}

/* ------------------------------------------------------------- admin ------------------------------------------------ */

function sb_admin_status(int $now = 0): array {
  $now = $now ?: sb_now();
  $st = sb_state();
  $nFx = 0; $nOdds = 0;
  foreach (array_slice(sb_days($now), 1) as $d) foreach ((array) (sb_day($d)['fx'] ?? []) as $r) { $nFx++; if (sb_bettable_row((array) $r, $now)) $nOdds++; }
  return ['ok' => true, 'key' => sb_env('APIFOOTBALL_KEY') !== '', 'config' => sb_config(), 'budget' => sb_budget($now), 'lastImport' => (int) ($st['lastImport'] ?? 0),
    'err' => (string) ($st['err'] ?? ''), 'errAt' => (int) ($st['errAt'] ?? 0), 'log' => (array) ($st['log'] ?? []), 'fixtures' => $nFx, 'withOdds' => $nOdds,
    'check' => sb_check_list($now), 'alerts' => array_slice((array) ($st['alerts'] ?? []), 0, 10), 'other' => sb_o_admin($now)];
}
/** Diagnostic : /status (plan, lectures du jour) + paris inconnus vus dans les réponses. */
function sb_admin_diag(int $now = 0): array {
  $now = $now ?: sb_now();
  $j = sb_get('status', $now);
  $r = is_array($j) ? (array) ($j['response'] ?? []) : [];
  $st = sb_state();
  return ['ok' => true, 'status' => $j === null ? null : ['plan' => (string) ($r['subscription']['plan'] ?? ''), 'end' => (string) ($r['subscription']['end'] ?? ''), 'active' => (bool) ($r['subscription']['active'] ?? false),
    'cur' => (int) ($r['requests']['current'] ?? 0), 'max' => (int) ($r['requests']['limit_day'] ?? 0)], 'err' => (string) ($st['err'] ?? ''), 'errAt' => (int) ($st['errAt'] ?? 0),
    'unk' => (array) ($st['unk'] ?? []), 'unkLive' => (array) ($st['unkLive'] ?? []), 'unkOther' => (array) ($st['ounk'] ?? []), 'budget' => sb_budget($now), 'live' => sb_live_admin($now)];
}
/** Bouton « Importer maintenant » (admin) : un passage complet, sans attendre la minute. */
function sb_admin_import(int $now = 0): array {
  $now = $now ?: sb_now();
  if (!sb_has_key()) return ['ok' => false, 'reason' => 'Aucune clé API enregistrée'];
  $r = sb_job_tick($now, 60);
  foreach (sb_take_wanted() as $id) if (sb_import_fixture_odds($id, $now)) $r['calls']++;
  $r['calls'] += sb_res_fetch_wanted($now, 3); // jours de résultats demandés par les joueurs
  // autres sports : au plus 4 lectures chacun (plan gratuit : 10 / minute)
  foreach (array_keys(SB_O_SPORTS) as $sp) { $o = sb_o_tick($sp, $now, 4); $r['calls'] += $o['calls']; $r['log'] = array_merge($r['log'], $o['log']); }
  return ['ok' => true] + $r + ['status' => sb_admin_status($now)];
}

/* ------------------------------------------------------------- code de coupon (« booking code ») -------------------- */
/*
 * 2026-10-22 (étape 2) — CODE DE COUPON comme Bet9ja / SportyBet : le ticket (choix seulement, jamais la mise) est gardé
 * 7 jours sous un code de 6 caractères (A-Z 2-9, sans 0 / O / 1 / I). Un fichier par code : data/sports/sb/codes/XXXXXX.json
 * (créé en exclusif : jamais deux tickets sous le même code). Choix acceptés : matchs SB (« sb:foot:<id>:<mk> ») encore
 * ouverts avec ce choix dans leurs marchés, et les anciens matchs / questions de events.json (ids de spList) encore ouverts.
 * Au chargement, les cotes sont RELUES (le pari prend toujours la cote actuelle du serveur) ; un match commencé / fermé, ou
 * invisible pour ce joueur (SB pas encore public), est sauté et compté. Jamais d'appel à l'API ici.
 */
const SB_CODE_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SB_CODE_TTL = 604800;  // 7 jours
const SB_CODE_MAX = 1000;    // choix au plus (= SP_MAX_SEL)
function sb_code_dir(): string { $d = sb_dir() . DIRECTORY_SEPARATOR . 'codes'; if (!is_dir($d)) @mkdir($d, 0750, true); return $d; }
function sb_code_ok(string $c): bool { return (bool) preg_match('/^[' . SB_CODE_ABC . ']{6}$/', $c); }
/** Un choix (ev, k) → forme du coupon avec la cote ACTUELLE, ou ['skip' => 'closed'|'hidden'|'param']. */
function sb_sel_now(string $ev, string $k, ?array $user, int $now, ?array $manual): array {
  if (str_starts_with($ev, 'sb:')) {
    if (!preg_match('/^sb:[a-z]+:\d+:[a-z0-9]+(?::-?\d+(?:\.\d+)?)?$/', $ev) || !preg_match('/^[A-Za-z0-9:\/+]{1,8}$/', $k)) return ['skip' => 'param'];
    if (!sb_visible($user)) return ['skip' => 'hidden'];
    $p = sb_pick($ev, $k, $user, $now, false); // contrôle « déjà commencé ? » (API) refait au moment du pari
    if (empty($p['ok'])) return ['skip' => ($p['reason'] ?? '') === 'param' ? 'param' : 'closed'];
    $s = $p['sel'];
    return ['ev' => $ev, 'k' => $k, 'odd' => (float) $s['odd'], 't' => $s['t'], 'l' => $s['l'], 'mk' => $s['mk'], 'fx' => $s['fx'], 'ko' => $s['ko'], 'h' => $p['team']['h'], 'a' => $p['team']['a']] + (!empty($s['lv']) ? ['lv' => 1] : []);
  }
  $e = $manual[$ev] ?? null;
  if (!$e) return ['skip' => 'closed'];
  $close = function_exists('sp_close_at') ? sp_close_at($e) : (int) ($e['start'] ?? 0);
  if (($e['status'] ?? '') !== 'open' || !empty($e['hold']) || $now >= $close) return ['skip' => 'closed'];
  if (function_exists('pred_stale') && ($e['sport'] ?? '') === 'pred' && pred_stale($e, $now)) return ['skip' => 'closed']; // Predict crypto suspendue
  foreach ((array) ($e['opts'] ?? []) as $o) if ((string) ($o['k'] ?? '') === $k && empty($o['off']))
    return ['ev' => $ev, 'k' => $k, 'odd' => (float) $o['odd'], 't' => (string) $e['title'], 'l' => (string) $o['label'], 'ko' => $close,
      'q' => function_exists('sp_is_question') && sp_is_question($e), 'grp' => function_exists('sp_corr_groups') ? array_values(sp_corr_groups($e)) : []];
  return ['skip' => 'param'];
}
/** Choix → choix valides (un seul par match / groupe lié), cotes actuelles. Retour [sel, nombres sautés]. */
function sb_sel_check(array $sel, ?array $user, int $now): array {
  $manual = null; $out = []; $grp = []; $sk = ['closed' => 0, 'hidden' => 0, 'param' => 0];
  foreach (array_slice(array_values($sel), 0, SB_CODE_MAX) as $s) {
    $ev = is_array($s) ? (string) ($s['ev'] ?? $s[0] ?? '') : ''; $k = is_array($s) ? (string) ($s['k'] ?? $s[1] ?? '') : '';
    if ($ev === '' || $k === '' || strlen($ev) > 80) { $sk['param']++; continue; }
    if ($manual === null && !str_starts_with($ev, 'sb:')) { $manual = []; if (function_exists('sp_events')) foreach (sp_events() as $e) $manual[(string) $e['id']] = $e; }
    $r = sb_sel_now($ev, $k, $user, $now, $manual);
    if (isset($r['skip'])) { $sk[$r['skip']]++; continue; }
    $g = isset($r['fx']) ? ['fx:' . $r['fx']] : ['ev:' . $ev];
    foreach ((array) ($r['grp'] ?? []) as $gg) $g[] = (string) $gg;
    if (array_intersect($g, array_keys($grp))) { $sk['param']++; continue; }
    foreach ($g as $gg) $grp[$gg] = 1;
    $out[] = $r;
  }
  return [$out, $sk];
}
/** sbCodeSave {sel:[{ev,k}]} → {ok, code, n, skip}. Visiteur accepté (aucun argent ici ; limite par connexion dans api.php). */
function sb_code_save(?array $user, array $sel, int $now = 0): array {
  $now = $now ?: sb_now();
  if (!$sel || count($sel) > SB_CODE_MAX) return ['ok' => false, 'reason' => 'param'];
  [$ok, $sk] = sb_sel_check($sel, $user, $now);
  if (!$ok) return ['ok' => false, 'reason' => $sk['closed'] ? 'closed' : 'param'];
  $keep = array_map(static fn($s) => [$s['ev'], $s['k']], $ok);
  $dir = sb_code_dir();
  if (random_int(1, 40) === 1) foreach ((array) glob($dir . DIRECTORY_SEPARATOR . '*.json') as $f) if ((int) @filemtime($f) < time() - SB_CODE_TTL - 86400) @unlink($f); // ménage de temps en temps
  for ($i = 0; $i < 12; $i++) {
    $c = ''; for ($j = 0; $j < 6; $j++) $c .= SB_CODE_ABC[random_int(0, strlen(SB_CODE_ABC) - 1)];
    $f = $dir . DIRECTORY_SEPARATOR . $c . '.json';
    $old = sb_code_read($c);
    if ($old !== null && (int) ($old['at'] ?? 0) < $now - SB_CODE_TTL) @unlink($f); // code expiré : réutilisable
    $fp = @fopen($f, 'x');
    if (!$fp) continue;
    fwrite($fp, json_encode(['at' => $now, 's' => $keep], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)); fclose($fp);
    return ['ok' => true, 'code' => $c, 'n' => count($keep), 'skip' => array_sum($sk)];
  }
  return ['ok' => false, 'reason' => 'busy'];
}
function sb_code_read(string $c): ?array {
  if (!sb_code_ok($c)) return null;
  $f = sb_code_dir() . DIRECTORY_SEPARATOR . $c . '.json';
  if (!is_file($f)) return null;
  $j = json_decode((string) @file_get_contents($f), true);
  return is_array($j) ? $j : null;
}
/** sbCodeLoad {code} → {ok, code, sel:[…cotes actuelles…], skip, hidden}. Aussi {sel:[…]} sans code : relire les cotes du ticket. */
function sb_code_load(?array $user, string $code, int $now = 0, ?array $sel = null): array {
  $now = $now ?: sb_now();
  if ($sel === null) {
    $code = strtoupper(trim($code));
    $j = sb_code_read($code);
    if ($j === null || (int) ($j['at'] ?? 0) < $now - SB_CODE_TTL) return ['ok' => false, 'reason' => 'nocode'];
    $sel = (array) ($j['s'] ?? []);
  } else { $code = ''; if (count($sel) > SB_CODE_MAX) return ['ok' => false, 'reason' => 'param']; }
  [$ok, $sk] = sb_sel_check($sel, $user, $now);
  return ['ok' => true, 'code' => $code, 'sel' => $ok, 'skip' => $sk['closed'] + $sk['param'], 'hidden' => $sk['hidden']];
}

/* ------------------------------------------------------------- PARIS EN DIRECT (étape 3) ---------------------------- */
/*
 * 2026-10-22 (propriétaire : « le direct comme bet365 / MyStake ») — FOOTBALL EN DIRECT. Repris du prototype (apif_lib.php,
 * « PARIS EN DIRECT ») : /odds/live, délai d'acceptation de 5 s + relecture, règles de suspension.
 *  - Visible : admin si config.live ; tout le monde si config.live ET config.livePublic ET config.public.
 *  - À LA DEMANDE : seulement si quelqu'un qui peut voir le direct a demandé sbLive / un match en direct dans les 60 s
 *    (fichier live-demand.at) ET qu'il y a des matchs en cours : /odds/live au plus toutes les 15 s, /fixtures?live=all au
 *    plus toutes les 30 s (score, minute, événements : buts, cartons, changements, VAR) — APRÈS la réponse au joueur, sous
 *    un verrou non bloquant (un seul lecteur), cache partagé (live.json). Réserve : plus aucune lecture du direct quand il
 *    reste ≤ 1 000 lectures dans le budget du jour (avant-match et résultats d'abord). Statistiques
 *    /fixtures/statistics?fixture=ID d'un match ouvert au plus toutes les 60 s, seulement s'il reste > 1 500 lectures.
 *  - Marchés (réglés comme l'avant-match sur le score des 90 min) : 1x2, dc, dnb, ou:<x.5>, btts, tth / tta:<x.5>.
 *    « Prochain but », mi-temps, handicaps asiatiques du direct (réglés sur le reste du match), corners, cartons : NON.
 *    Noms de paris inconnus → diagnostic admin (« unkLive »). Marge mLive, même formule (≤ cote du flux − 0,01, ≥ 1,01) ;
 *    groupe COMPLET exigé ; lignes déjà jouées retirées (plus de 2,5 à 3-0, « les deux marquent » à 1-1…).
 *  - SUSPENDU (cadenas) : l'API marque suspendu / bloqué / arrêté / fini, données de plus de 20 s, minute ≥ liveLastMin
 *    (88 par défaut, réglable), prolongation, ou score qui vient de changer (différent de la lecture précédente, ou de
 *    /fixtures).
 *  - Pari : choix relu côté serveur, ATTENTE de 5 s, relecture forcée de /odds/live, puis refus si suspendu ou score
 *    changé (« susp »), règle « si la cote change » ($acc) sinon. Combinable avec d'autres matchs. Choix gardé avec lv = 1,
 *    score et minute du moment ; coupon live = 1. Règlement : comme l'avant-match (score des 90 min), sans l'annulation
 *    « posé après le coup d'envoi ».
 */
const SB_LIVE_ODDS_TTL = 15;        // /odds/live : au plus toutes les 15 s (partagé)
const SB_LIVE_FX_TTL = 30;          // /fixtures?live=all : au plus toutes les 30 s
const SB_LIVE_STALE = 20;           // données de plus de 20 s : suspendu
const SB_LIVE_DELAY = 8;            // délai d'acceptation d'un pari en direct (2026-10-22 : 8 s, avant 5)
const SB_LIVE_DEMAND = 60;          // quelqu'un a regardé le direct dans les 60 s
const SB_LIVE_RESERVE = 1000;       // lectures gardées pour l'avant-match et les résultats
const SB_LIVE_STATS_TTL = 60;       // statistiques d'un match ouvert : au plus toutes les 60 s
const SB_LIVE_STATS_MIN_LEFT = 1500; // … seulement s'il reste plus de 1 500 lectures
const SB_LIVE_KEEP_END = 600;       // match sorti du flux : gardé 10 min (« Fin du match »)
// 2026-10-22 (propriétaire : « les joueurs adorent le direct ») : + pair / impair, 1re mi-temps (seulement pendant la 1re mi-temps, avant la 43e)
const SB_LIVE_FAMS = ['1x2', 'dc', 'dnb', 'ou', 'btts', 'tth', 'tta', 'oe', 'ht1x2', 'htou'];

function sb_live_visible(?array $user): bool {
  $c = sb_config();
  if (!$c['live']) return false;
  if ($user && function_exists('orolado_is_admin_user') && orolado_is_admin_user($user)) return true;
  return $c['livePublic'] && $c['public'];
}
function sb_live_file_at(string $name): int { $f = sb_dir() . DIRECTORY_SEPARATOR . $name; clearstatcache(true, $f); return is_file($f) ? (int) filemtime($f) : 0; }
/** Quelqu'un regarde le direct (au plus une écriture toutes les 5 s). */
function sb_live_demand(int $now): void {
  if (sb_live_file_at('live-demand.at') <= $now - 5) @touch(sb_dir() . DIRECTORY_SEPARATOR . 'live-demand.at', $now);
}
function sb_live_wanted(int $now): bool { return sb_live_file_at('live-demand.at') > $now - SB_LIVE_DEMAND; }
function sb_live_data(): array { return sb_read('live.json'); }
/** Matchs peut-être en cours d'après les index du jour (pour décider de lire /fixtures?live=all). */
function sb_live_maybe(int $now): bool {
  foreach ([gmdate('Y-m-d', $now - 86400), gmdate('Y-m-d', $now)] as $d) foreach ((array) (sb_day($d)['fx'] ?? []) as $r) {
    $ts = (int) ($r['ts'] ?? 0); $st = (string) ($r['st'] ?? '');
    if (in_array($st, SB_LIVE_ST, true) && $ts > $now - 4 * 3600) return true;
    if (in_array($st, ['NS', 'TBD'], true) && $ts <= $now + 120 && $ts > $now - 3 * 3600) return true;
  }
  return false;
}

/** Événements d'une ligne /fixtures (buts, cartons, changements, VAR) → forme compacte du tracker. */
function sb_live_events(array $r): array {
  $hid = (int) ($r['teams']['home']['id'] ?? 0); $out = [];
  foreach ((array) ($r['events'] ?? []) as $e) {
    if (!is_array($e)) continue;
    $type = strtolower((string) ($e['type'] ?? '')); $det = strtolower((string) ($e['detail'] ?? ''));
    if ($type === 'goal') { if (str_contains($det, 'missed')) continue; $t = 'goal'; $d = str_contains($det, 'own') ? 'og' : (str_contains($det, 'penalty') ? 'pen' : ''); }
    elseif ($type === 'card') { $t = 'card'; $d = str_contains($det, 'red') || str_contains($det, 'second') ? 'red' : 'yellow'; }
    elseif ($type === 'subst') { $t = 'subst'; $d = ''; }
    elseif ($type === 'var') { $t = 'var'; $d = mb_substr((string) ($e['detail'] ?? ''), 0, 40); }
    else continue;
    $tid = (int) ($e['team']['id'] ?? 0);
    $out[] = ['t' => (int) ($e['time']['elapsed'] ?? 0), 'x' => is_numeric($e['time']['extra'] ?? null) ? (int) $e['time']['extra'] : 0, 'type' => $t, 'team' => $tid === $hid ? 'h' : 'a',
      'detail' => $d, 'player' => mb_substr((string) ($e['player']['name'] ?? ''), 0, 40)];
  }
  return array_slice($out, -40);
}
/** /fixtures?live=all → live.json (fx). Matchs sortis du flux après la 80e : gardés 10 min (« Fin du match »). */
function sb_live_store_fixtures(array $j, int $now): int {
  $fx = []; $lgs = [];
  foreach ((array) ($j['response'] ?? []) as $r) {
    if (!is_array($r) || !($row = sb_fx_row($r))) continue;
    $row['ev'] = sb_live_events($r);
    $rc = [0, 0]; foreach ($row['ev'] as $e) if ($e['type'] === 'card' && $e['detail'] === 'red') $rc[$e['team'] === 'h' ? 0 : 1]++;
    $row['rc'] = $rc;
    $fx[(string) (int) $r['fixture']['id']] = $row;
    if ($row['lg'] > 0) $lgs[(string) $row['lg']] = sb_lg_row((array) $r['league']);
  }
  sb_with('live.json', static function (array &$s) use (&$fx, $lgs, $now) {
    // reprise de la 2e mi-temps vue par nous (si l'API ne donne pas periods.second) : gardée d'une lecture à l'autre
    foreach ($fx as $id => $row) {
      $old = (array) ($s['fx'][$id] ?? []);
      $fx[$id]['mt'] = isset($old['m'], $old['mt']) && $old['m'] === ($row['m'] ?? null) ? (int) $old['mt'] : $now; // quand NOUS avons vu cette minute pour la 1re fois
      // « 0:00 » estimé depuis la minute de l'API (vue ~30 s après son vrai début) ; gardé tant qu'il reste cohérent (horloge fluide)
      if (is_numeric($row['m'] ?? null) && in_array((string) ($row['st'] ?? ''), ['1H', '2H', 'ET'], true)) {
        $cand = $now - (int) $row['m'] * 60 - 30; $oz = isset($old['zf']) ? (int) $old['zf'] : null;
        $fx[$id]['zf'] = $oz !== null && ($old['st'] ?? '') === $row['st'] && abs($cand - $oz) <= 45 ? $oz : $cand;
      }
      if (!empty($old['p2o'])) $fx[$id]['p2o'] = (int) $old['p2o'];
      elseif (($row['st'] ?? '') === '2H' && in_array($old['st'] ?? '', ['HT', '1H'], true)) $fx[$id]['p2o'] = $now - 5;
    }
    foreach ((array) ($s['fx'] ?? []) as $id => $old) {
      if (isset($fx[$id])) continue;
      $end = (int) ($old['end'] ?? 0) ?: $now;
      if ($end > $now - SB_LIVE_KEEP_END && (int) ($old['m'] ?? 0) >= 80) { $old['end'] = $end; $old['st'] = in_array($old['st'] ?? '', SB_FINAL, true) ? $old['st'] : 'FT'; $fx[$id] = $old; }
    }
    $s['fx'] = $fx; $s['lg'] = array_replace((array) ($s['lg'] ?? []), $lgs); $s['fat'] = $now;
    if (count($s['lg']) > 400) $s['lg'] = array_slice($s['lg'], -400, null, true);
    return true;
  });
  return count($fx);
}

/**
 * Une entrée de /odds/live → nos marchés : mk => [[k, cote, suspendu 0|1], …]. Format supposé (API-Football v3) :
 * odds[] = {id, name, values[{value, odd, handicap, main, suspended}]}. Noms / valeurs inconnus → $unk (jamais d'erreur).
 * $sc = score actuel [h, a] : les lignes déjà jouées sont retirées.
 */
function sb_live_markets(array $r, array $cfg, array $sc, array &$unk): array {
  $raw = [];
  $names = ['1x2' => ['fulltime result', 'match winner', '1x2', 'full time result', 'match result', '3way result'], 'dc' => ['double chance'], 'dnb' => ['draw no bet', 'home/away'],
    'ou' => ['over/under line', 'match goals', 'goals over/under', 'total goals', 'over/under', 'total - goals'], 'btts' => ['both teams to score', 'both teams score'],
    'tth' => ['home team total goals', 'home team goals', 'total - home', 'home team - total goals'], 'tta' => ['away team total goals', 'away team goals', 'total - away', 'away team - total goals'],
    'oe' => ['odd/even', 'goals odd/even', 'odd/even goals', 'total - odd/even'],
    'ht1x2' => ['1x2 (1st half)', '1st half winner', 'first half winner', 'half time result', '1x2 - 1st half', 'fulltime result (1st half)', '1st half - 1x2'],
    'htou' => ['over/under (1st half)', 'over/under line (1st half)', '1st half goals', 'first half goals', 'goals over/under first half', '1st half - total goals', 'over/under 1st half']];
  foreach ((array) ($r['odds'] ?? []) as $b) {
    if (!is_array($b)) continue;
    $name = (string) ($b['name'] ?? ''); $n = strtolower(trim((string) preg_replace('/\s+/', ' ', $name)));
    $fam = null; foreach ($names as $f => $list) if (in_array($n, $list, true)) $fam = $f;
    if ($fam === null) { $kk = mb_substr($name, 0, 80); $unk[$kk] = ($unk[$kk] ?? 0) + 1; continue; }
    foreach ((array) ($b['values'] ?? []) as $v) {
      if (!is_array($v) || !is_numeric($v['odd'] ?? null)) continue;
      $odd = (float) $v['odd']; if ($odd <= 1.0 || $odd > 1000) continue;
      $val = trim((string) ($v['value'] ?? '')); $lv = strtolower($val); $s = !empty($v['suspended']) ? 1 : 0;
      $mk = null; $k = null;
      if (($fam === '1x2' || $fam === 'ht1x2') && isset(SB_RES[$lv])) { $mk = $fam; $k = SB_RES[$lv]; }
      elseif ($fam === 'oe') { if ($lv === 'odd') { $mk = 'oe'; $k = 'O'; } elseif ($lv === 'even') { $mk = 'oe'; $k = 'E'; } }
      elseif ($fam === 'dc') { $dc = ['home/draw' => 'HD', '1x' => 'HD', 'home/away' => 'HA', '12' => 'HA', 'draw/away' => 'DA', 'x2' => 'DA']; if (isset($dc[$lv])) { $mk = 'dc'; $k = $dc[$lv]; } }
      elseif ($fam === 'dnb') { if ($lv === 'home' || $lv === '1') { $mk = 'dnb'; $k = 'H'; } elseif ($lv === 'away' || $lv === '2') { $mk = 'dnb'; $k = 'A'; } }
      elseif ($fam === 'btts' && isset(SB_YN[$lv])) { $mk = 'btts'; $k = SB_YN[$lv]; }
      elseif (in_array($fam, ['ou', 'tth', 'tta', 'htou'], true)) {
        // « Over » + handicap « 2.5 », ou « Over 2.5 »
        $o = sb_ou_val($val);
        if ($o === null && in_array($lv, ['over', 'under'], true) && is_numeric($v['handicap'] ?? null)) $o = [$lv === 'over' ? 'O' : 'U', (float) $v['handicap']];
        if ($o !== null && sb_half($o[1]) && $o[1] >= 0.5 && $o[1] <= ($fam === 'ou' ? 9.5 : 5.5)) { $mk = $fam . ':' . sb_line($o[1]); $k = $o[0]; }
        elseif ($o !== null) continue; // ligne entière / quart : écartée exprès (silencieux)
      }
      if ($mk === null) { $kk = mb_substr($name . ' = ' . $val, 0, 80); $unk[$kk] = ($unk[$kk] ?? 0) + 1; continue; }
      $raw[$mk][$k] = [$odd, $s];
    }
  }
  [$h, $a] = [(int) ($sc[0] ?? 0), (int) ($sc[1] ?? 0)];
  $m = max(0.02, min(0.4, (float) $cfg['mLive'] / 100));
  $out = [];
  foreach ($raw as $mk => $ks) {
    $fam = sb_fam($mk); $x = (float) substr($mk, strlen($fam) + 1);
    if (count($ks) < (int) sb_group_size($fam)) continue; // groupe complet exigé
    // déjà joué : retiré (jamais de « cadeau » sur un vieux prix)
    if ((($fam === 'ou' || $fam === 'htou') && $h + $a > $x) || ($fam === 'tth' && $h > $x) || ($fam === 'tta' && $a > $x) || ($fam === 'btts' && $h > 0 && $a > 0)) continue;
    $inv = 0.0; foreach ($ks as $z) $inv += 1 / $z[0];
    $exp = sb_expected($fam);
    if ($inv < 0.98 * $exp || $inv > 1.35 * $exp) { $kk = '(contrôle) direct ' . $fam . ' incohérent'; $unk[$kk] = ($unk[$kk] ?? 0) + 1; continue; }
    $norm = max(1.0, $inv / $exp);
    $row = [];
    foreach ($ks as $k => $z) {
      $p = (1 / $z[0]) / $norm;
      $our = floor((1 - $m) / $p * 100 + 1e-6) / 100;
      $our = min($our, floor(($z[0] - 0.01) * 100 + 1e-6) / 100);
      if ($our < 1.01) continue;
      $row[] = [(string) $k, round($our, 2), $z[1]];
    }
    if (!$row) continue;
    usort($row, static fn($p1, $p2) => sb_k_rank($p1[0], $fam) <=> sb_k_rank($p2[0], $fam));
    $out[$mk] = $row;
  }
  uksort($out, 'sb_mk_cmp');
  return $out;
}
/** /odds/live → live.json (od) : score, minute, état, marchés ; « chg » = score différent de la lecture précédente. */
function sb_live_store_odds(array $j, int $now): int {
  $cfg = sb_config(); $od = []; $unk = [];
  foreach ((array) ($j['response'] ?? []) as $r) {
    if (!is_array($r) || ($id = (int) ($r['fixture']['id'] ?? 0)) <= 0) continue;
    $sc = [(int) ($r['teams']['home']['goals'] ?? 0), (int) ($r['teams']['away']['goals'] ?? 0)];
    $st = (array) ($r['status'] ?? []);
    $od[(string) $id] = ['sc' => $sc, 'm' => is_numeric($r['fixture']['status']['elapsed'] ?? null) ? (int) $r['fixture']['status']['elapsed'] : null,
      'ti' => [(int) ($r['teams']['home']['id'] ?? 0), (int) ($r['teams']['away']['id'] ?? 0)],
      'blk' => !empty($st['blocked']) || !empty($st['stopped']) ? 1 : 0, 'fin' => !empty($st['finished']) ? 1 : 0,
      'sec' => preg_match('/^(\d{1,3}):(\d{2})$/', (string) ($r['fixture']['status']['seconds'] ?? ''), $sm) ? (int) $sm[1] * 60 + (int) $sm[2] : null, 'sat' => $now, // horloge du fournisseur (« 63:10 ») au moment de la lecture
      'up' => is_string($r['update'] ?? null) && ($u = strtotime((string) $r['update'])) ? (int) $u : 0, // dernière mise à jour des cotes de CE match chez le fournisseur
      'mk' => sb_live_markets($r, $cfg, $sc, $unk), 'r1' => sb_live_raw1x2($r)];
  }
  $maxUp = 0; foreach ($od as $o) $maxUp = max($maxUp, (int) $o['up']);
  foreach ($od as $id => $o) $od[$id]['lag'] = $o['up'] > 0 && $maxUp > 0 ? $maxUp - $o['up'] : 0; // retard de CE match sur le plus frais du flux
  sb_with('live.json', static function (array &$s) use (&$od, $now) {
    $old = (array) ($s['od'] ?? []);
    foreach ($od as $id => $o) {
      $od[$id]['chg'] = isset($old[$id]['sc']) && $old[$id]['sc'] !== $o['sc'] ? 1 : 0;
      // 2026-10-22 (propriétaire : « verrouiller AVANT les autres ») : le bookmaker bouge ses cotes AVANT que le score / l'action
      // n'apparaisse dans le flux. Saut brusque du 1 · X · 2 (chance d'un résultat qui bouge de 6 points ou plus d'une lecture
      // à l'autre) → match verrouillé 30 s (« saut »). Même chose quand le flux bascule en « bloqué ».
      $jmp = (int) ($old[$id]['jmp'] ?? 0);
      $pa = sb_live_p1x2((array) ($old[$id]['r1'] ?? [])); $pb = sb_live_p1x2((array) ($o['r1'] ?? [])); // cotes BRUTES du fournisseur
      $jsd = (string) ($old[$id]['jsd'] ?? '');
      if ($pa && $pb) foreach ($pb as $k => $p) if (isset($pa[$k]) && abs($p - $pa[$k]) >= 0.04) {
        $jmp = $now; $dh = ($pb['H'] ?? 0) - ($pa['H'] ?? 0); $da = ($pb['A'] ?? 0) - ($pa['A'] ?? 0);
        $jsd = $dh >= $da ? 'h' : 'a'; break; // l'équipe dont la chance monte = celle qui attaque (vraie donnée du bookmaker)
      }
      if ($jsd !== '') $od[$id]['jsd'] = $jsd;
      if (!empty($o['blk']) && empty($old[$id]['blk'])) $jmp = $now;
      if ($od[$id]['chg']) $jmp = $now; // score changé : 90 s de cadenas
      // horloge : « 0:00 » du fournisseur lissé (petits écarts ignorés, jamais de saut quand « seconds » manque)
      $pz = isset($old[$id]['z']) ? (int) $old[$id]['z'] : null;
      $nz = is_int($o['sec'] ?? null) ? $now - (int) $o['sec'] : null;
      if ($nz !== null && ($pz === null || abs($nz - $pz) > 20)) $pz = $nz;
      if ($pz !== null) $od[$id]['z'] = $pz;
      if ($jmp) $od[$id]['jmp'] = $jmp;
    }
    $s['od'] = $od; $s['at'] = $now;
    return true;
  });
  if ($unk) sb_with('state.json', static function (array &$s) use ($unk) {
    $u = (array) ($s['unkLive'] ?? []);
    foreach ($unk as $k => $n) $u[$k] = (int) ($u[$k] ?? 0) + (int) $n;
    arsort($u); $s['unkLive'] = array_slice($u, 0, 60, true);
    return true;
  });
  return count($od);
}
/** Cotes brutes 1 · X · 2 du fournisseur pour un match du flux : [[k, cote], …]. */
function sb_live_raw1x2(array $r): array {
  foreach ((array) ($r['odds'] ?? []) as $b) {
    $n = strtolower(trim((string) ($b['name'] ?? '')));
    if (!in_array($n, ['fulltime result', 'match winner', '1x2', 'full time result', 'match result', '3way result'], true)) continue;
    $out = [];
    foreach ((array) ($b['values'] ?? []) as $v) { $lv = strtolower(trim((string) ($v['value'] ?? ''))); if (isset(SB_RES[$lv]) && is_numeric($v['odd'] ?? null)) $out[] = [SB_RES[$lv], (float) $v['odd']]; }
    return $out;
  }
  return [];
}
/** 1 · X · 2 du direct → chances normalisées [k => p] (null si incomplet). */
function sb_live_p1x2(array $row): ?array {
  $inv = []; foreach ($row as $z) if (isset($z[0], $z[1]) && (float) $z[1] > 1.0) $inv[(string) $z[0]] = 1 / (float) $z[1];
  if (count($inv) < 2) return null;
  $t = array_sum($inv); foreach ($inv as $k => $v) $inv[$k] = $v / $t;
  return $inv;
}
const SB_LIVE_JUMP_LOCK = 90; // secondes de cadenas après un saut de cote, un passage en « bloqué » ou un changement de score (propriétaire : « même 1 min 30, ce n'est pas grave »)
function sb_live_budget_ok(int $now, int $left = SB_LIVE_RESERVE): bool { return sb_budget($now)['left'] > $left; }
/**
 * 2026-10-22 (propriétaire : « le direct verrouille 1 à 2 min trop tard ») : rythme du direct selon les lectures qui restent
 * aujourd'hui — le plus vite possible (cotes toutes les 5 s, matchs toutes les 10 s) sans jamais vider le budget ;
 * au plus lent : 15 s / 30 s (comme avant). Abonnement monté (plus de lectures) → automatiquement plus rapide.
 */
function sb_live_ttls(int $now): array {
  $b = sb_budget($now);
  $secLeft = max(600, 86400 - ($now % 86400));
  $avail = $b['left'] - SB_LIVE_RESERVE - (int) (2500 * $secLeft / 86400); // avant-match + résultats du reste de la journée
  if ($avail <= 0) return [SB_LIVE_ODDS_TTL, SB_LIVE_FX_TTL];
  $t = (int) ceil(1.67 * 0.35 * $secLeft / $avail); // le direct est regardé ~1/3 de la journée (lecture seulement s'il y a quelqu'un) 
  $t = max(5, min(SB_LIVE_ODDS_TTL, $t));
  return [$t, max(15, min(SB_LIVE_FX_TTL, (int) ceil(1.5 * $t)))]; // matchs : l'API les met à jour toutes les 15 s (doc)
}
/**
 * Tâche du direct (APRÈS la réponse) : seulement s'il y a de la demande (60 s), un seul lecteur à la fois (verrou non
 * bloquant), jamais dans la réserve. Retour : liste des lectures faites (tests / admin).
 */
function sb_live_tick(int $now = 0): array {
  $now = $now ?: sb_now();
  if (!sb_has_key() || !sb_config()['live'] || !sb_live_wanted($now) || !sb_live_budget_ok($now)) return [];
  $lk = @fopen(sb_dir() . DIRECTORY_SEPARATOR . 'live.lock', 'c');
  if (!$lk || !flock($lk, LOCK_EX | LOCK_NB)) { if ($lk) fclose($lk); return []; }
  $done = [];
  try {
    $L = sb_live_data();
    [$ttlO, $ttlF] = sb_live_ttls($now);
    $fat = (int) ($L['fat'] ?? 0);
    if ($now - $fat >= $ttlF && (!empty($L['fx']) || sb_live_maybe($now) || $now - $fat >= 300)) {
      $j = sb_get('fixtures?live=all&timezone=UTC', $now);
      if ($j !== null) { sb_live_store_fixtures($j, $now); $done[] = 'fixtures'; }
      else sb_with('live.json', static function (array &$s) use ($now) { $s['fat'] = $now; return true; }); // erreur : pas de nouvel essai avant 30 s
      $L = sb_live_data();
    }
    $cfgL = sb_config();
    $live = array_filter((array) ($L['fx'] ?? []), static fn($r) => empty($r['end']) && sb_live_big((array) $r, $cfgL)); // pas de lecture des cotes pour les petits championnats
    if ($live && $now - (int) ($L['at'] ?? 0) >= $ttlO && sb_live_budget_ok($now)) {
      $j = sb_get('odds/live', $now);
      if ($j !== null) { sb_live_store_odds($j, $now); $done[] = 'odds'; }
    }
    // statistiques des matchs ouverts (au plus 3, toutes les 60 s, s'il reste de quoi)
    $w = (array) (sb_state()['lstw'] ?? []);
    foreach (array_slice(array_keys(array_filter($w, static fn($t) => (int) $t > $now - SB_LIVE_DEMAND)), 0, 3) as $id) {
      if (!isset($live[(string) $id]) || !sb_live_budget_ok($now, SB_LIVE_STATS_MIN_LEFT)) continue;
      if (sb_cache_peek('fixtures/statistics?fixture=' . (int) $id, SB_LIVE_STATS_TTL, $now) !== null) continue;
      if (sb_get_cached('fixtures/statistics?fixture=' . (int) $id, SB_LIVE_STATS_TTL, $now) !== null) $done[] = 'stats ' . $id;
    }
  } catch (Throwable $e) {
    sb_note_error('Direct : ' . $e->getMessage(), $now);
  } finally { flock($lk, LOCK_UN); fclose($lk); }
  return $done;
}
/** Relecture FORCÉE de /odds/live (pari en direct, après les 5 s) : attend le lecteur en cours ; rien si lu il y a ≤ 1 s. */
function sb_live_refresh_now(int $now): bool {
  if (!sb_has_key() || !sb_live_budget_ok($now)) return false;
  $lk = @fopen(sb_dir() . DIRECTORY_SEPARATOR . 'live.lock', 'c');
  if (!$lk || !flock($lk, LOCK_EX)) { if ($lk) fclose($lk); return false; }
  try {
    if ((int) (sb_live_data()['at'] ?? 0) >= $now - 1) return true;
    $j = sb_get('odds/live', $now);
    if ($j === null) return false;
    sb_live_store_odds($j, $now);
    return true;
  } finally { flock($lk, LOCK_UN); fclose($lk); }
}
/** Lecture gardée encore fraîche (sans appel) ; null sinon. */
function sb_cache_peek(string $path, int $ttl, int $now): ?array {
  $f = sb_dir() . DIRECTORY_SEPARATOR . 'cache' . DIRECTORY_SEPARATOR . substr(hash('sha256', $path), 0, 24) . '.json';
  clearstatcache(true, $f);
  if (!is_file($f) || ($ttl > 0 && filemtime($f) <= $now - $ttl)) return null;
  $j = json_decode((string) @file_get_contents($f), true);
  return is_array($j) ? $j : null;
}
/** Statistiques gardées d'un match (≤ 15 min) → {shots, shotsOn, poss, corners, yellow, red, attacks, dangerous} : [h, a]. */
function sb_live_stats(string $id, array $row, int $now): ?array {
  $j = sb_cache_peek('fixtures/statistics?fixture=' . (int) $id, 900, $now);
  if (!$j) return null;
  $map = ['total shots' => 'shots', 'shots on goal' => 'shotsOn', 'ball possession' => 'poss', 'corner kicks' => 'corners', 'yellow cards' => 'yellow', 'red cards' => 'red', 'attacks' => 'attacks', 'dangerous attacks' => 'dangerous',
    'fouls' => 'fouls', 'offsides' => 'offsides', 'goalkeeper saves' => 'saves']; // 2026-10-22 : + fautes, hors-jeu, arrêts (onglet Informations)
  $out = [];
  foreach ((array) ($j['response'] ?? []) as $t) {
    if (!is_array($t)) continue;
    $tid = (int) ($t['team']['id'] ?? 0);
    $side = $tid === (int) ($row['h'][0] ?? -1) ? 0 : ($tid === (int) ($row['a'][0] ?? -1) ? 1 : -1);
    if ($side < 0) continue;
    foreach ((array) ($t['statistics'] ?? []) as $s) {
      $k = is_array($s) ? ($map[strtolower(trim((string) ($s['type'] ?? '')))] ?? null) : null;
      if ($k === null) continue;
      $v = $s['value'] ?? null; $v = is_string($v) ? (float) rtrim($v, '%') : (is_numeric($v) ? (float) $v : 0.0);
      $out[$k] = $out[$k] ?? [0, 0]; $out[$k][$side] = abs($v - round($v)) < 1e-9 ? (int) round($v) : round($v, 1);
    }
  }
  return $out ?: null;
}

/*
 * 2026-10-22 (propriétaire : « sous les logos, c'est vide ; mets les statistiques du match comme les grands ») — sbStats :
 * statistiques d'un match EN DIRECT dont la page est ouverte (onglet « Informations »). Réponse immédiate avec ce qui est gardé
 * (≤ 15 min) ; si la lecture gardée a plus de 60 s, UNE lecture /fixtures/statistics?fixture=ID (verrou non bloquant par match,
 * au plus une tentative par minute et par match, même en cas d'erreur), APRÈS la réponse quand le serveur le permet (sinon
 * dans cette requête-ci, qui n'est pas celle de la page). Comptée dans le budget du jour (sb_get) et jamais dans la réserve
 * (il doit rester plus de SB_LIVE_RESERVE lectures). Cartons : comptés aussi à partir des événements déjà lus (aucun appel).
 * Rien d'autre que des statistiques publiques du match ; la clé n'est jamais renvoyée.
 */
const SB_LIVE_STATS_KEYS = ['poss', 'shots', 'shotsOn', 'corners', 'attacks', 'dangerous', 'fouls', 'offsides', 'saves', 'yellow', 'red'];
function sb_live_stats_lockf(string $id): string {
  $d = sb_dir() . DIRECTORY_SEPARATOR . 'cache'; if (!is_dir($d)) @mkdir($d, 0750, true);
  return $d . DIRECTORY_SEPARATOR . 'st-' . (int) $id . '.try';
}
/** Une lecture des statistiques d'un match (si rien de frais, pas d'autre lecteur, pas d'essai depuis 60 s, budget hors réserve). */
function sb_live_stats_fetch(string $id, int $now): bool {
  $path = 'fixtures/statistics?fixture=' . (int) $id;
  if (sb_cache_peek($path, SB_LIVE_STATS_TTL, $now) !== null) return false;
  if (!sb_has_key() || !sb_live_budget_ok($now)) return false;
  $f = sb_live_stats_lockf($id);
  $lk = @fopen($f, 'c');
  if (!$lk || !flock($lk, LOCK_EX | LOCK_NB)) { if ($lk) fclose($lk); return false; }
  try {
    clearstatcache(true, $f);
    $tried = (int) @file_get_contents($f);
    if ($tried > $now - SB_LIVE_STATS_TTL) return false; // déjà essayé dans la minute (réussi ou non)
    if (sb_cache_peek($path, SB_LIVE_STATS_TTL, $now) !== null) return false;
    ftruncate($lk, 0); rewind($lk); fwrite($lk, (string) $now); fflush($lk);
    return sb_get_cached($path, SB_LIVE_STATS_TTL, $now) !== null;
  } finally { flock($lk, LOCK_UN); fclose($lk); }
}
/** Cartons jaunes / rouges comptés sur les événements gardés (h, a). */
function sb_live_cards(array $row): array {
  $y = [0, 0]; $r = [0, 0];
  foreach ((array) ($row['ev'] ?? []) as $e) {
    if (!is_array($e) || ($e['type'] ?? '') !== 'card') continue;
    $i = ($e['team'] ?? '') === 'a' ? 1 : 0;
    if (($e['detail'] ?? '') === 'red') $r[$i]++; else $y[$i]++;
  }
  return ['yellow' => $y, 'red' => $r];
}
function sb_live_stats_api(?array $user, string $fid, int $now = 0): array {
  $now = $now ?: sb_now();
  if (!preg_match('/^foot:(\d{1,12})$/', $fid, $m)) return ['ok' => false, 'reason' => 'bad'];
  if (!sb_visible($user) || !sb_live_visible($user)) return ['ok' => false, 'reason' => 'off'];
  $id = $m[1];
  $v = sb_live_view($id, sb_live_data(), $now, sb_config());
  if (!$v) return ['ok' => false, 'reason' => 'notLive'];
  sb_live_demand($now);
  $pend = 0;
  $path = 'fixtures/statistics?fixture=' . (int) $id;
  if (empty($v['row']['end']) && sb_cache_peek($path, SB_LIVE_STATS_TTL, $now) === null && sb_has_key() && sb_live_budget_ok($now)) {
    $after = PHP_SAPI !== 'cli' && PHP_SAPI !== 'cli-server' && function_exists('fastcgi_finish_request') && empty($GLOBALS['SB_STATS_INLINE']);
    if ($after) {
      $pend = 1;
      register_shutdown_function(static function () use ($id, $now) {
        try { fastcgi_finish_request(); } catch (Throwable $e) { /* déjà fait */ }
        try { sb_live_stats_fetch($id, $now); } catch (Throwable $e) { /* jamais bloquant */ }
      });
    } else {
      try { sb_live_stats_fetch($id, $now); } catch (Throwable $e) { sb_note_error('Statistiques : ' . $e->getMessage(), $now); }
    }
  }
  $st = (array) (sb_live_stats($id, $v['row'], $now) ?? []);
  if (!empty($v['row']['ev'])) foreach (sb_live_cards($v['row']) as $k => $p) if (!isset($st[$k]) || array_sum($p) > array_sum((array) $st[$k])) $st[$k] = $p;
  $out = [];
  foreach (SB_LIVE_STATS_KEYS as $k) if (isset($st[$k]) && is_array($st[$k])) $out[$k] = [0 + ($st[$k][0] ?? 0), 0 + ($st[$k][1] ?? 0)];
  return ['ok' => true, 'id' => 'foot:' . $id, 'stats' => $out ?: null, 'pend' => $pend, 'at' => $now];
}

/**
 * Vue d'un match en direct (fichier live.json, aucune lecture d'API) : null si ce match n'est pas dans le direct.
 * ['row' => ligne /fixtures, 'od' => ligne /odds/live|null, 'sc', 'm', 'st', 'susp' (match entier), 'mk' => [mk => [[k, cote, s]]]]
 */
function sb_live_big(array $row, array $cfg): bool { return !empty($cfg['liveAll']) || in_array((int) ($row['lg'] ?? 0), SB_LIVE_BIG, true); }
function sb_live_view(string $id, array $L, int $now, array $cfg): ?array {
  $row = $L['fx'][$id] ?? null;
  if (!is_array($row) || (!empty($row['end']) && (int) $row['end'] < $now - SB_LIVE_KEEP_END)) return null;
  if (!sb_live_big($row, $cfg)) return null; // petits championnats : pas de direct (ni liste, ni match, ni pari)
  $od = $L['od'][$id] ?? null;
  $ti = [(int) ($row['h'][0] ?? 0), (int) ($row['a'][0] ?? 0)];
  if (is_array($od) && array_map('intval', (array) ($od['ti'] ?? [])) !== $ti) $od = null; // jamais un autre match
  $fresh = is_array($od) && $now - (int) ($L['at'] ?? 0) <= SB_LIVE_STALE;
  $sc = is_array($od) ? (array) $od['sc'] : (is_array($row['g'] ?? null) ? (array) $row['g'] : [0, 0]);
  $sc = [(int) ($sc[0] ?? 0), (int) ($sc[1] ?? 0)];
  $m = is_array($od) && $od['m'] !== null ? (int) $od['m'] : (int) ($row['m'] ?? 0);
  $fxFresh = $now - (int) ($L['fat'] ?? 0) <= 60;
  $scoreMoved = is_array($od) && (!empty($od['chg']) || ($fxFresh && is_array($row['g'] ?? null) && array_map('intval', $row['g']) !== $sc));
  $st = (string) ($row['st'] ?? '');
  // 2026-10-22 (propriétaire : « 1xBet verrouille pendant la vidéo, nous non ») : moments chauds → cadenas : vidéo (VAR) dans les
  // 2 dernières minutes, but ou carton rouge dans la dernière minute (comme les grands sites)
  $hot = false;
  foreach (array_reverse((array) ($row['ev'] ?? [])) as $e) {
    $et = (int) ($e['t'] ?? 0); $ty = (string) ($e['type'] ?? '');
    if ($ty === 'var' && $et >= $m - 2) { $hot = true; break; }
    if (($ty === 'goal' || ($ty === 'card' && ($e['detail'] ?? '') === 'red')) && $et >= $m - 1) { $hot = true; break; }
  }
  // cotes de ce match en retard de plus de 90 s sur les autres matchs du flux (fournisseur figé pour ce match) → cadenas
  $odStale = is_array($od) && (int) ($od['lag'] ?? 0) > 180; // (un match calme n'a pas de raison de changer de cote : seulement un flux vraiment figé)
  $jumped = is_array($od) && (int) ($od['jmp'] ?? 0) > $now - SB_LIVE_JUMP_LOCK;
  $susp = !$fresh || $odStale || $jumped || !empty($od['blk']) || !empty($od['fin']) || !empty($row['end']) || $m >= (int) $cfg['liveLastMin'] || $scoreMoved || $hot
    || !in_array($st, ['1H', 'HT', '2H'], true); // prolongation / tirs au but : plus de pari (règlement sur les 90 min)
  if (!empty($row['end'])) $sc = is_array($row['g'] ?? null) ? array_map('intval', $row['g']) : $sc;
  $mk = is_array($od) ? (array) $od['mk'] : [];
  // marchés de la 1re mi-temps : seulement pendant la 1re mi-temps, jusqu'à la 42e
  if ($st !== '1H' || $m >= 43) foreach (array_keys($mk) as $k) if (in_array(sb_fam((string) $k), ['ht1x2', 'htou'], true)) unset($mk[$k]);
  return ['row' => $row, 'od' => $od, 'sc' => $sc, 'm' => $m, 'st' => $st, 'susp' => $susp, 'mk' => $mk];
}
/**
 * 2026-10-22 (propriétaire : « l'horloge a plus d'une minute de retard sur 1xBet ») : secondes de jeu calculées depuis le
 * VRAI début de la mi-temps (fixture.periods), à la seconde près — et non depuis le moment où la minute a changé chez nous.
 * null si inconnu (le téléphone garde l'ancienne horloge).
 */
function sb_live_clock(string $st, array $r, int $now, ?array $od = null): ?int {
  // 2026-10-22 (propriétaire : « l'horloge est en avance de plus de 2 min » / « elle recommence ») — ordre de confiance :
  //  1) l'horloge du FOURNISSEUR des cotes (fixture.status.seconds « 63:10 », lue toutes les quelques secondes) ;
  //  2) sinon la minute de l'API au moment où NOUS l'avons vue changer (mt) ; jamais l'heure prévue du coup d'envoi.
  if (!in_array($st, ['1H', '2H', 'ET'], true)) return null;
  $m = is_numeric($r['m'] ?? null) ? (int) $r['m'] : null;
  if (is_array($od) && isset($od['z']) && is_numeric($od['z'])) {
    $k = $now - (int) $od['z'];
    if ($m === null || ($k >= ($m - 1) * 60 && $k < ($m + 3) * 60)) return $k;
  }
  if (is_array($od) && is_int($od['sec'] ?? null) && (int) ($od['sat'] ?? 0) > 0) {
    $k = (int) $od['sec'] + max(0, $now - (int) $od['sat']);
    if ($m === null || ($k >= ($m - 1) * 60 && $k < ($m + 3) * 60)) return $k;
  }
  if ($m !== null && isset($r['zf']) && is_numeric($r['zf'])) { $k = $now - (int) $r['zf']; if ($k >= ($m - 1) * 60 && $k < ($m + 2) * 60) return $k; }
  if ($m !== null && (int) ($r['mt'] ?? 0) > 0) return $m * 60 + min(119, max(0, $now - (int) $r['mt']));
  return null;
}
/** Forme commune (spec : fx) d'un match en direct. kz = heure (s) du « 0:00 » de l'horloge : le téléphone compte seul, sans jamais revenir en arrière. */
function sb_live_fx_public(string $id, array $v): array {
  $r = $v['row']; $mk = $v['mk'];
  $o = isset($mk['1x2']) ? ['mk' => '1x2', 'o' => array_map(static fn($z) => [$z[0], $z[1]], $mk['1x2'])] : null;
  $s1 = $v['susp'] || (isset($mk['1x2']) && array_sum(array_column($mk['1x2'], 2)) > 0);
  return ['id' => 'foot:' . $id, 'lg' => (int) ($r['lg'] ?? 0), 'ts' => (int) ($r['ts'] ?? 0), 'st' => $v['st'], 'm' => $v['m'],
    'h' => ['n' => (string) ($r['h'][1] ?? ''), 'lo' => (string) ($r['h'][2] ?? '')], 'a' => ['n' => (string) ($r['a'][1] ?? ''), 'lo' => (string) ($r['a'][2] ?? '')],
    'sc' => $v['sc'], 'o' => $o, 'n' => count($mk), 'live' => 1, 'susp' => $s1 ? 1 : 0, 'rc' => (array) ($r['rc'] ?? [0, 0]), 'end' => !empty($r['end']) ? 1 : 0,
    'ofd' => is_array($v['od']) ? 1 : 0, 'mx' => (int) ($r['mx'] ?? 0), 'dg' => is_array($v['od']) && (int) ($v['od']['jmp'] ?? 0) > sb_now() - 20 ? (string) ($v['od']['jsd'] ?? '') : '', 'k' => ($kk = sb_live_clock($v['st'], $r, sb_now(), is_array($v['od']) ? $v['od'] : null)), 'kz' => $kk !== null ? sb_now() - $kk : null, 'ht' => is_array($r['ht'] ?? null) ? array_map('intval', (array) $r['ht']) : null]; // dans le flux des cotes du direct (montré même sans 1 · X · 2 : cadenas)
}
/** Nombre de matchs du direct (onglet « Direct ») — aucun appel ; -1 = pas d'onglet Direct pour ce joueur. */
function sb_live_count(?array $user, int $now): int {
  if (!sb_live_visible($user)) return -1;
  $L = sb_live_data();
  $cfg = sb_config();
  if ($now - (int) ($L['fat'] ?? 0) <= 180) { $od = (array) ($L['od'] ?? []); return count(array_filter((array) ($L['fx'] ?? []), static fn($r, $id) => empty($r['end']) && isset($od[(string) $id]) && sb_live_big((array) $r, $cfg), ARRAY_FILTER_USE_BOTH)); }
  $n = 0;
  foreach ([gmdate('Y-m-d', $now - 86400), gmdate('Y-m-d', $now)] as $d) foreach ((array) (sb_day($d)['fx'] ?? []) as $r) if (in_array((string) ($r['st'] ?? ''), SB_LIVE_ST, true) && (int) ($r['ts'] ?? 0) > $now - 4 * 3600 && sb_live_big((array) $r, $cfg)) $n++;
  return $n;
}
/** sbLive / sbList day « live » : matchs en direct (par compétition) avec score, minute, cotes 1x2, cadenas. */
function sb_live_list(?array $user, int $now = 0): array {
  $now = $now ?: sb_now();
  if (!sb_visible($user) || !sb_live_visible($user)) return ['ok' => false, 'reason' => 'off'];
  sb_live_demand($now); sb_after_response();
  $L = sb_live_data(); $cfg = sb_config();
  $fx = []; $used = [];
  foreach ((array) ($L['fx'] ?? []) as $id => $r) {
    $v = sb_live_view((string) $id, $L, $now, $cfg);
    if (!$v) continue;
    if (!is_array($v['od']) && empty($r['end'])) continue; // 2026-10-22 (propriétaire : « jamais un match sans cotes ») : pas de cotes en direct → pas affiché
    $fx[] = sb_live_fx_public((string) $id, $v); $used[(int) ($r['lg'] ?? 0)] = 1;
  }
  $lgs = [];
  foreach ((array) ($L['lg'] ?? []) as $lid => $l) if (isset($used[(int) $lid])) $lgs[] = ['id' => (int) $lid] + (array) $l;
  usort($lgs, static fn($a, $b) => [(int) $a['p'], (string) $a['c'], (string) $a['n']] <=> [(int) $b['p'], (string) $b['c'], (string) $b['n']]);
  usort($fx, static fn($a, $b) => [$a['end'], $a['ts'], $a['id']] <=> [$b['end'], $b['ts'], $b['id']]);
  $n = count(array_filter($fx, static fn($f) => !$f['end']));
  return ['ok' => true, 'at' => $now, 'oat' => (int) ($L['at'] ?? 0), 'n' => $n, 'sports' => [['s' => 'foot', 'n' => 'Football', 'live' => $n]], 'lg' => $lgs, 'fx' => $fx];
}
function sb_live_rules(): string {
  return 'Direct : résultat des 90 minutes + arrêts de jeu (score final, buts déjà marqués compris). Pari accepté après 5 s si le score '
    . 'et la cote n\'ont pas changé ; marchés suspendus après un but, une alerte, ou en fin de match.';
}
/** sbMatch d'un match en direct : marchés du direct (s = suspendu), tracker (événements, statistiques). null = pas en direct. */
function sb_live_match(?array $user, string $id, int $now): ?array {
  if (!sb_live_visible($user)) return null;
  $L = sb_live_data(); $cfg = sb_config();
  $v = sb_live_view($id, $L, $now, $cfg);
  if (!$v) return null;
  sb_live_demand($now);
  sb_with('state.json', static function (array &$s) use ($id, $now) {
    $w = array_filter((array) ($s['lstw'] ?? []), static fn($t) => (int) $t > $now - SB_LIVE_DEMAND);
    if ((int) ($w[$id] ?? 0) > $now - 10) return false;
    $w[$id] = $now; $s['lstw'] = $w; return true;
  });
  sb_after_response();
  $mk = [];
  foreach ($v['mk'] as $k => $o) $mk[] = ['mk' => (string) $k, 'o' => array_map(static fn($z) => [$z[0], $z[1]], $o), 's' => $v['susp'] || array_sum(array_column($o, 2)) > 0 ? 1 : 0];
  $lg = (array) ($L['lg'][(string) ($v['row']['lg'] ?? 0)] ?? []);
  $fx = sb_live_fx_public($id, $v) + ['lgn' => (string) ($lg['n'] ?? ''), 'c' => (string) ($lg['c'] ?? '')];
  return ['ok' => true, 'fx' => $fx, 'mk' => $mk, 'trk' => ['events' => (array) ($v['row']['ev'] ?? []), 'stats' => sb_live_stats($id, $v['row'], $now)], 'rules' => sb_live_rules(), 'oat' => (int) ($L['at'] ?? 0)];
}
/** Choix d'un match en direct (sb_pick) : null = pas en direct (avant-match normal). */
function sb_live_pick(string $id, string $mk, string $k, ?array $user, int $now): ?array {
  $L = sb_live_data();
  if (!isset($L['fx'][$id])) return null;
  if (!sb_live_visible($user)) return ['ok' => false, 'reason' => 'closed'];
  $v = sb_live_view($id, $L, $now, sb_config());
  if (!$v) return ['ok' => false, 'reason' => 'closed']; // petit championnat (direct limité) ou match sorti du flux
  $fam = sb_fam($mk);
  if (!in_array($fam, SB_LIVE_FAMS, true) || !in_array($k, sb_valid_k($fam), true)) return ['ok' => false, 'reason' => 'closed'];
  if ($v['susp']) return ['ok' => false, 'reason' => 'susp'];
  $odd = null; $s = 0;
  foreach ((array) ($v['mk'][$mk] ?? []) as $o) if ((string) $o[0] === $k) { $odd = (float) $o[1]; $s = (int) ($o[2] ?? 0); }
  if ($odd === null || $s || array_sum(array_column((array) ($v['mk'][$mk] ?? []), 2)) > 0) return ['ok' => false, 'reason' => 'susp'];
  $row = $v['row']; $home = (string) ($row['h'][1] ?? ''); $away = (string) ($row['a'][1] ?? '');
  $kn = sb_k_name($mk, $k, $home, $away);
  return ['ok' => true, 'live' => 1, 'grp' => 'fx:foot:' . $id, 'sel' => ['ev' => 'sb:foot:' . $id . ':' . $mk, 'k' => $k, 'odd' => $odd, 't' => $home . ' - ' . $away,
    'l' => ($mk === '1x2' ? $kn : sb_mk_name($mk) . ' : ' . $kn) . ' (direct ' . $v['sc'][0] . '-' . $v['sc'][1] . ', ' . $v['m'] . '\')',
    'mk' => $mk, 'sp' => 'foot', 'fx' => 'foot:' . $id, 'ko' => (int) ($row['ts'] ?? 0), 'ti' => [(int) ($row['h'][0] ?? 0), (int) ($row['a'][0] ?? 0)],
    'lv' => 1, 'sc' => $v['sc'], 'm' => $v['m']],
    'team' => ['h' => ['n' => $home, 'lo' => (string) ($row['h'][2] ?? '')], 'a' => ['n' => $away, 'lo' => (string) ($row['a'][2] ?? '')]]];
}
/** Attente d'acceptation (tests : $GLOBALS['SB_SLEEP'] remplace l'attente et renvoie l'heure d'après). */
function sb_live_wait(int $sec, int $now): int {
  $f = $GLOBALS['SB_SLEEP'] ?? null;
  if (is_callable($f)) return (int) $f($sec, $now);
  sleep($sec);
  return max($now + $sec, time());
}
/**
 * Pari avec des choix EN DIRECT (sp_bet, avant de prendre l'argent) : ATTENTE de 5 s, relecture forcée de /odds/live, puis
 * chaque choix du direct relu : suspendu / fermé / score changé → refus « susp » ; cote changée → règle $acc (refus « odds »
 * avec les nouvelles cotes, sinon la nouvelle cote est prise). Retour null = accepté ($picked = cotes relues, $now = après).
 */
function sb_live_accept(array &$picked, string $acc, ?array $user, int &$now): ?array {
  $now2 = sb_live_wait(SB_LIVE_DELAY, $now);
  sb_live_refresh_now($now2);
  $chg = []; $L = sb_live_data(); $cfg = sb_config();
  foreach ($picked as $i => $p) {
    if (empty($p['lv'])) continue;
    $id = (string) preg_replace('/^sb:foot:(\d+):.*$/', '$1', (string) $p['ev']);
    $v = sb_live_view($id, $L, $now2, $cfg);
    if ($v && $v['sc'] !== $p['sc']) return ['ok' => false, 'reason' => 'susp', 'why' => 'goal', 'ev' => $p['ev']]; // but pendant l'attente
    $r = sb_pick((string) $p['ev'], (string) $p['k'], $user, $now2);
    if (empty($r['ok']) || empty($r['live'])) return ['ok' => false, 'reason' => 'susp', 'ev' => $p['ev']];
    $n = $r['sel'];
    if ($n['sc'] !== $p['sc']) return ['ok' => false, 'reason' => 'susp', 'why' => 'goal', 'ev' => $p['ev']];
    $new = (float) $n['odd']; $old = (float) $p['odd'];
    if (abs($new - $old) > 0.004 && ($acc === 'none' || ($acc === 'up' && $new < $old))) { $chg[] = ['ev' => $p['ev'], 'k' => $p['k'], 'odd' => $new]; continue; }
    $picked[$i] = $n;
  }
  $now = $now2;
  return $chg ? ['ok' => false, 'reason' => 'odds', 'odds' => $chg] : null;
}
/** Admin : état du direct (diagnostic). */
function sb_live_admin(int $now): array {
  $L = sb_live_data();
  return ['on' => (bool) sb_config()['live'], 'wanted' => sb_live_wanted($now), 'fx' => count((array) ($L['fx'] ?? [])), 'od' => count((array) ($L['od'] ?? [])),
    'fat' => (int) ($L['fat'] ?? 0), 'at' => (int) ($L['at'] ?? 0)];
}

/* ------------------------------------------------------------- AUTRES SPORTS (avant-match seulement) ---------------- */
/*
 * 2026-10-22 (propriétaire : « choisir le SPORT : Football, Basket, Hockey… chacun avec ses matchs ») — BASKET, HOCKEY,
 * HANDBALL, VOLLEY, RUGBY, BASEBALL, FOOTBALL AMÉRICAIN, AFL, MMA. AVANT-MATCH SEULEMENT (pas de direct). Pas de tennis.
 *  - API-Sports, plans GRATUITS (≈ 100 lectures / jour / sport, 10 / minute) avec la MÊME clé APIFOOTBALL_KEY (jamais écrite,
 *    jamais journalisée, jamais renvoyée). Notre plafond DUR : SB_O_CAP = 90 lectures / jour (UTC) / sport (budget-<sport>.json).
 *  - Tâche de fond (APRÈS la réponse au joueur, sb_after_response) : au plus une fois par minute, UN seul sport par passage
 *    (chacun son tour), au plus SB_O_RUN = 6 lectures par passage (sous les 10 / minute du plan gratuit).
 *  - Lectures par jour et par sport, au plus :
 *      /games?date=J (MMA : /fights?date=J) : J toutes les 3 h (8), J+1 toutes les 6 h (4), J+2 toutes les 12 h (2),
 *        J-1 toutes les 3 h tant que tout n'est pas fini (≤ 8, en pratique 1 ou 2)                          ≤ 22
 *      /odds?league=L&season=S : UNE lecture = les cotes de TOUS les matchs du championnat ; relue toutes les 4 h quand un
 *        match commence dans les 24 h, sinon toutes les 12 h ; grands championnats d'abord, puis le plus tôt  ≤ 45 (SB_O_ODDS_DAY)
 *        (repli /odds?game=ID — MMA : /odds?fight=ID — si le plan refuse la lecture par championnat, dans les mêmes 45)
 *      /games?id=ID (MMA : /fights?id=ID) : résultat d'un match avec des coupons ouverts absent de l'index    ≤ 12 (SB_O_RES_DAY)
 *    Total ≤ 79 < 90. Plan gratuit limité à quelques dates (« try from A to B ») : la fenêtre est retenue 24 h, les autres
 *    dates ne sont plus demandées ; « limite du jour atteinte » → plus rien ce jour-là pour ce sport.
 *  - Un match n'est montré QUE s'il a des cotes fraîches (≤ 9 h ; match à plus de 24 h : ≤ 26 h) et pas commencé.
 *  - Fichiers (data/sports/sb/) : <sport>-day-AAAA-MM-JJ.json (index du jour), mk/<sport>-<id>.json (marchés),
 *    results-<sport>.json (résultats), budget-<sport>.json. ids : match « basket:123 », choix « sb:basket:123:<mk> ».
 *  - Marchés (mk → k) ; marge : réglage mOther (tous les marchés) ; ≥ 2 bookmakers ; même formule que le football
 *    (≤ moyenne − 0,01, ≥ 1,01, groupe normalisé seulement si sa somme ≥ 1) :
 *      12        vainqueur, PROLONGATION / TIRS AU BUT / MANCHES SUPPLÉMENTAIRES COMPRIS ; égalité finale → remboursé   H A
 *      1x2       résultat du TEMPS RÉGLEMENTAIRE (basket 4 quart-temps, hockey 3 périodes, handball 60 min, rugby 80 min,
 *                football américain 4 quart-temps, AFL 4 quart-temps)                                           H D A
 *      ou:<x.5>  total plus / moins (lignes en .5 seulement)                                                    O U
 *      ah:<x.5>  handicap (ligne du point de vue de l'équipe à domicile ; .5 seulement)                          H A
 *    Score utilisé par sport pour ou / ah (SB_O_SPORTS « tot » / « hcp ») : fo = score final (prolongation comprise),
 *    rg = temps réglementaire, pts = points de tous les sets (volley), sets = sets gagnés (volley).
 *  - Règlement automatique (même chemin sp_resolve / casino_credit, référence unique) : seulement si le numéro du match ET
 *    des deux équipes sont ceux du pari ; pari posé à / après le vrai début → remboursé ; reporté / annulé / arrêté pas joué
 *    dans les 48 h → remboursé ; attribué sur tapis vert (AWD / WO / AW) → remboursé ; données manquantes → « à vérifier ».
 */
const SB_O_CAP = 90;            // lectures / jour / sport, au plus (plan gratuit : 100)
const SB_O_ODDS_DAY = 45;       // dont lectures de cotes
const SB_O_RES_DAY = 12;        // dont lectures de résultats (/games?id=)
const SB_O_RUN = 6;             // lectures au plus par passage (plan gratuit : 10 / minute)
const SB_O_EVERY = 60;          // tâche : au plus une fois par minute
const SB_O_AHEAD = 2;           // J-1 … J+2
const SB_O_FIN = ['FT', 'AOT', 'AP', 'AET'];
const SB_O_VOID = ['AWD', 'WO', 'AW'];
const SB_O_WAIT = ['NS', 'TBD', 'POST', 'PST', 'CANC', 'SUSP', 'INTR', 'INT', 'ABD', 'DEL'];
/** Sports : hôte API, nom, point d'entrée (games / fights), marchés offerts, score du total (tot) et du handicap (hcp), marché de la liste (pref). */
const SB_O_SPORTS = [
  'basket'   => ['h' => 'v1.basketball', 'n' => 'Basketball', 'ep' => 'games', 'op' => 'game', 'x' => ['12', '1x2', 'ou', 'ah'], 'tot' => 'fo', 'hcp' => 'fo', 'pref' => '12', 'max' => 400],
  'hockey'   => ['h' => 'v1.hockey', 'n' => 'Hockey', 'ep' => 'games', 'op' => 'game', 'x' => ['12', '1x2', 'ou', 'ah'], 'tot' => 'rg', 'hcp' => 'rg', 'pref' => '1x2', 'max' => 25],
  'handball' => ['h' => 'v1.handball', 'n' => 'Handball', 'ep' => 'games', 'op' => 'game', 'x' => ['12', '1x2', 'ou', 'ah'], 'tot' => 'rg', 'hcp' => 'rg', 'pref' => '1x2', 'max' => 120],
  'volley'   => ['h' => 'v1.volleyball', 'n' => 'Volleyball', 'ep' => 'games', 'op' => 'game', 'x' => ['12', 'ou', 'ah'], 'tot' => 'pts', 'hcp' => 'sets', 'pref' => '12', 'max' => 400],
  'rugby'    => ['h' => 'v1.rugby', 'n' => 'Rugby', 'ep' => 'games', 'op' => 'game', 'x' => ['12', '1x2', 'ou', 'ah'], 'tot' => 'rg', 'hcp' => 'rg', 'pref' => '1x2', 'max' => 200],
  'baseball' => ['h' => 'v1.baseball', 'n' => 'Baseball', 'ep' => 'games', 'op' => 'game', 'x' => ['12', 'ou', 'ah'], 'tot' => 'fo', 'hcp' => 'fo', 'pref' => '12', 'max' => 40],
  'amfoot'   => ['h' => 'v1.american-football', 'n' => 'American football', 'ep' => 'games', 'op' => 'game', 'x' => ['12', '1x2', 'ou', 'ah'], 'tot' => 'fo', 'hcp' => 'fo', 'pref' => '12', 'max' => 150],
  'afl'      => ['h' => 'v1.afl', 'n' => 'AFL', 'ep' => 'games', 'op' => 'game', 'x' => ['12', '1x2', 'ou', 'ah'], 'tot' => 'fo', 'hcp' => 'fo', 'pref' => '12', 'max' => 400],
  'mma'      => ['h' => 'v1.mma', 'n' => 'MMA', 'ep' => 'fights', 'op' => 'fight', 'x' => ['12'], 'tot' => 'fo', 'hcp' => 'fo', 'pref' => '12', 'max' => 0],
];
/** Grandes compétitions (nom exact, sans casse) : en tête de liste et dans « Top ». */
const SB_O_TOP = [
  'basket' => ['nba' => 1, 'euroleague' => 2, 'eurocup' => 5, 'acb' => 6, 'bal' => 3, 'basketball africa league' => 3, 'wnba' => 8, 'lnb' => 9, 'pro a' => 9, 'nbl' => 10, 'bbl' => 11, 'lega a' => 12, 'champions league' => 7, 'ncaa' => 13],
  'hockey' => ['nhl' => 1, 'khl' => 2, 'shl' => 3, 'liiga' => 4, 'del' => 5, 'nl' => 6, 'champions hockey league' => 7, 'ahl' => 8],
  'handball' => ['ehf champions league' => 1, 'champions league' => 1, 'bundesliga' => 2, 'starligue' => 3, 'liqui moly hbl' => 2, 'asobal' => 4, 'liga asobal' => 4, 'ehf european league' => 5],
  'volley' => ['superlega' => 1, 'champions league' => 2, 'cev champions league' => 2, 'plusliga' => 3, 'ligue a' => 4, 'efeler ligi' => 5, 'superliga' => 6],
  'rugby' => ['six nations' => 1, 'top 14' => 2, 'premiership' => 3, 'premiership rugby' => 3, 'super rugby' => 4, 'champions cup' => 5, 'united rugby championship' => 6, 'rugby championship' => 7, 'world cup' => 1, 'pro d2' => 8],
  'baseball' => ['mlb' => 1, 'npb' => 2, 'kbo' => 3],
  'amfoot' => ['nfl' => 1, 'ncaa' => 2, 'cfl' => 3],
  'afl' => ['afl' => 1, 'aflw' => 2],
  'mma' => ['ufc' => 1, 'bellator' => 2, 'pfl' => 3, 'one' => 4],
];

function sb_o_ok(string $sp): bool { return isset(SB_O_SPORTS[$sp]) && in_array($sp, (array) sb_config()['sports'], true); }
function sb_o_dayf(string $sp, string $day): string { return $sp . '-day-' . $day . '.json'; }
function sb_o_day(string $sp, string $day): array { return sb_read(sb_o_dayf($sp, $day)); }
function sb_o_days(int $now): array { $o = []; for ($i = -1; $i <= SB_O_AHEAD; $i++) $o[] = gmdate('Y-m-d', $now + $i * 86400); return $o; }
function sb_o_results(string $sp): array { return (array) (sb_read('results-' . $sp . '.json')['fx'] ?? []); }
function sb_o_mk_file(string $sp, string $id): array { return sb_read('mk' . DIRECTORY_SEPARATOR . $sp . '-' . $id . '.json'); }

/* ---------- budget (par sport) et erreurs ---------- */
function sb_o_budget_take(string $sp, int $now, string $kind = ''): bool {
  $day = gmdate('Y-m-d', $now);
  return (bool) sb_with('budget-' . $sp . '.json', static function (array &$s) use ($day, $kind) {
    if (($s['day'] ?? '') !== $day) $s = ['day' => $day, 'n' => 0, 'od' => 0, 'rs' => 0];
    if ((int) ($s['n'] ?? 0) >= SB_O_CAP) return false;
    if ($kind === 'od' && (int) ($s['od'] ?? 0) >= SB_O_ODDS_DAY) return false;
    if ($kind === 'rs' && (int) ($s['rs'] ?? 0) >= SB_O_RES_DAY) return false;
    $s['n'] = (int) ($s['n'] ?? 0) + 1;
    if ($kind !== '') $s[$kind] = (int) ($s[$kind] ?? 0) + 1;
    return true;
  });
}
function sb_o_budget(string $sp, int $now): array {
  $b = sb_read('budget-' . $sp . '.json');
  $same = ($b['day'] ?? '') === gmdate('Y-m-d', $now);
  return ['used' => $same ? (int) ($b['n'] ?? 0) : 0, 'cap' => SB_O_CAP, 'odds' => $same ? (int) ($b['od'] ?? 0) : 0, 'res' => $same ? (int) ($b['rs'] ?? 0) : 0, 'rem' => $b['rem'] ?? null];
}
/** Erreur d'un sport (jamais la clé) ; « try from A to B » = fenêtre de dates du plan gratuit ; limite du jour ; saison refusée. */
function sb_o_note_error(string $sp, string $msg, int $now): void {
  $key = sb_env('APIFOOTBALL_KEY');
  $msg = mb_substr($key !== '' ? str_replace($key, '***', $msg) : $msg, 0, 240);
  sb_with('state.json', static function (array &$s) use ($sp, $msg, $now) {
    $s['oerr'][$sp] = ['m' => $msg, 'at' => $now];
    if (preg_match('/(\d{4}-\d{2}-\d{2})\D{1,12}(\d{4}-\d{2}-\d{2})/', $msg, $m) && stripos($msg, 'date') !== false) $s['owin'][$sp] = [$m[1], $m[2], $now];
    if (preg_match('/request limit|limit for the day|requests per day/i', $msg)) $s['ostop'][$sp] = gmdate('Y-m-d', $now);
    if (stripos($msg, 'season') !== false) $s['osea'][$sp] = $now; // lecture des cotes par championnat refusée → par match (24 h)
    return true;
  });
}
/** Date demandable pour ce sport (fenêtre du plan gratuit gardée 24 h ; limite du jour atteinte : rien). */
function sb_o_day_ok(string $sp, string $day, array $st, int $now): bool {
  if (($st['ostop'][$sp] ?? '') === gmdate('Y-m-d', $now)) return false;
  $w = $st['owin'][$sp] ?? null;
  if (is_array($w) && count($w) === 3 && (int) $w[2] > $now - 86400) return $day >= (string) $w[0] && $day <= (string) $w[1];
  return true;
}

/* ---------- lecture d'une réponse /games (formes différentes selon le sport : défensif) ---------- */
function sb_o_int($v): ?int {
  if (is_numeric($v)) return (int) $v;
  if (is_array($v)) foreach (['total', 'score', 'points'] as $k) if (is_numeric($v[$k] ?? null)) return (int) $v[$k];
  return null;
}
/** Une période : « 2-1 » (hockey) ou {home, away}. */
function sb_o_period($p): ?array {
  if (is_string($p) && preg_match('/^\s*(\d+)\s*[-:]\s*(\d+)\s*$/', $p, $m)) return [(int) $m[1], (int) $m[2]];
  if (is_array($p) && is_numeric($p['home'] ?? null) && is_numeric($p['away'] ?? null)) return [(int) $p['home'], (int) $p['away']];
  return null;
}
function sb_o_sum(array $parts): ?array { $h = 0; $a = 0; foreach ($parts as $p) { if ($p === null) return null; $h += $p[0]; $a += $p[1]; } return $parts ? [$h, $a] : null; }
/**
 * Scores d'un match fini : fo = final (prolongation comprise ; volley = sets ; MMA = [1,0] / [0,1]), rg = temps
 * réglementaire (null si on ne peut pas le savoir), pts = points de tous les sets (volley).
 */
function sb_o_scores(string $sp, array $r, array $g, string $st): array {
  $sc = (array) ($r['scores'] ?? ($g['scores'] ?? []));
  $per = (array) ($r['periods'] ?? ($g['periods'] ?? []));
  if ($sp === 'mma') {
    $f = (array) ($r['fighters'] ?? []);
    $w1 = !empty($f['first']['winner']); $w2 = !empty($f['second']['winner']);
    return ['fo' => $w1 !== $w2 ? ($w1 ? [1, 0] : [0, 1]) : null, 'rg' => null, 'pts' => null];
  }
  $h = sb_o_int($sc['home'] ?? null); $a = sb_o_int($sc['away'] ?? null);
  $fo = $h !== null && $a !== null ? [$h, $a] : null;
  $rg = null;
  if ($sp === 'basket' || $sp === 'amfoot' || $sp === 'afl') {
    $q = []; for ($i = 1; $i <= 4; $i++) { $x = $sc['home']['quarter_' . $i] ?? null; $y = $sc['away']['quarter_' . $i] ?? null; $q[] = is_numeric($x) && is_numeric($y) ? [(int) $x, (int) $y] : null; }
    $rg = sb_o_sum($q);
  } elseif ($sp === 'hockey') {
    $rg = sb_o_sum([sb_o_period($per['first'] ?? null), sb_o_period($per['second'] ?? null), sb_o_period($per['third'] ?? null)]);
  } elseif ($sp === 'handball' || $sp === 'rugby') {
    $rg = sb_o_sum([sb_o_period($per['first'] ?? null), sb_o_period($per['second'] ?? null)]);
  }
  if ($rg === null && $st === 'FT' && $fo !== null && $sp !== 'baseball' && $sp !== 'volley') $rg = $fo; // fini dans le temps réglementaire
  if ($rg !== null && $fo !== null && ($rg[0] > $fo[0] || $rg[1] > $fo[1])) $rg = null; // incohérent : à vérifier
  $pts = null;
  if ($sp === 'volley' && $fo !== null) {
    $sets = [];
    foreach (['first', 'second', 'third', 'fourth', 'fifth'] as $k) { $p = sb_o_period($per[$k] ?? null); if ($p !== null && $p[0] + $p[1] > 0) $sets[] = $p; }
    if (count($sets) === $fo[0] + $fo[1] && count($sets) >= 3) $pts = sb_o_sum($sets);
  }
  return ['fo' => $fo, 'rg' => $rg, 'pts' => $pts];
}
function sb_o_prio(string $sp, string $name, string $country): int {
  $n = strtolower(trim($name));
  $p = SB_O_TOP[$sp][$n] ?? null;
  if ($p === null && $sp === 'mma') foreach (SB_O_TOP['mma'] as $k => $v) if (str_starts_with($n, $k)) { $p = $v; break; }
  return $p ?? (SB_TOP_COUNTRIES[sb_slug($country)] ?? 100);
}
/** Une ligne /games (ou /fights) → [id, ligne d'index, compétition] ; null si illisible. */
function sb_o_row(string $sp, array $r): ?array {
  $g = is_array($r['game'] ?? null) ? (array) $r['game'] : $r; // football américain / AFL : {game:{id, date, status}, league, teams, scores}
  $id = (int) ($g['id'] ?? ($r['id'] ?? 0));
  $ts = (int) ($g['timestamp'] ?? ($r['timestamp'] ?? 0));
  $d = $g['date'] ?? ($r['date'] ?? null);
  if ($ts <= 0 && is_array($d)) $ts = (int) ($d['timestamp'] ?? 0);
  if ($ts <= 0 && is_string($d) && $d !== '') $ts = (int) (strtotime($d) ?: 0);
  $stt = $g['status'] ?? ($r['status'] ?? []);
  $st = strtoupper(trim((string) (is_array($stt) ? ($stt['short'] ?? '') : $stt)));
  $lg = (array) ($r['league'] ?? []);
  $co = is_array($r['country'] ?? null) ? (array) $r['country'] : (is_array($lg['country'] ?? null) ? (array) $lg['country'] : ['name' => is_string($lg['country'] ?? null) ? $lg['country'] : '']);
  if ($sp === 'mma') {
    $f = (array) ($r['fighters'] ?? []);
    $h = (array) ($f['first'] ?? []); $a = (array) ($f['second'] ?? []);
    $ev = trim((string) ($r['slug'] ?? ($lg['name'] ?? 'MMA')));
    $lid = $ev === '' ? 1 : (int) (crc32(strtolower($ev)) & 0x3fffffff) + 1;
    $lgRow = ['n' => mb_substr($ev !== '' ? $ev : 'MMA', 0, 60), 'c' => mb_substr((string) ($r['category'] ?? ''), 0, 40), 'f' => '', 'lo' => '', 'p' => sb_o_prio('mma', $ev, '')];
    $sea = '';
  } else {
    $tm = (array) ($r['teams'] ?? ($g['teams'] ?? []));
    $h = (array) ($tm['home'] ?? []); $a = (array) ($tm['away'] ?? []);
    $lid = (int) ($lg['id'] ?? 0);
    $lgRow = ['n' => mb_substr((string) ($lg['name'] ?? ''), 0, 60), 'c' => mb_substr((string) ($co['name'] ?? ''), 0, 40), 'f' => (string) ($co['flag'] ?? ''), 'lo' => (string) ($lg['logo'] ?? ''),
      'p' => sb_o_prio($sp, (string) ($lg['name'] ?? ''), (string) ($co['name'] ?? ''))];
    $sea = is_scalar($lg['season'] ?? null) ? (string) $lg['season'] : '';
  }
  $hid = (int) ($h['id'] ?? 0); $aid = (int) ($a['id'] ?? 0);
  if ($id <= 0 || $ts <= 0 || $hid <= 0 || $aid <= 0 || $hid === $aid || $lid <= 0) return null;
  $row = ['ts' => $ts, 'st' => $st, 'lg' => $lid, 'sea' => mb_substr($sea, 0, 12),
    'h' => [$hid, mb_substr((string) ($h['name'] ?? ''), 0, 60), (string) ($h['logo'] ?? '')], 'a' => [$aid, mb_substr((string) ($a['name'] ?? ''), 0, 60), (string) ($a['logo'] ?? '')]];
  if (in_array($st, SB_O_FIN, true)) $row += sb_o_scores($sp, $r, $g, $st);
  return [(string) $id, $row, $lgRow];
}

/* ---------- cotes ---------- */
const SB_O_N12 = ['home/away', 'match winner', 'winner', 'moneyline', 'money line', 'to win', 'fight winner', 'to win the fight', 'home/away (incl. overtime)', 'home/away (including overtime)',
  'match winner (incl. overtime)', 'winner (incl. overtime)', '2way result', '2-way result', '12', 'home/away (incl. ot)', 'fight result'];
const SB_O_N1X2 = ['3way result', '3-way result', '1x2', 'match result', 'fulltime result', 'full time result', 'regular time result', '3way result (regular time)', '1x2 (regular time)', 'result', '3way result - regular time'];
const SB_O_NOU = ['over/under', 'total', 'totals', 'over/under (incl. overtime)', 'over/under (including overtime)', 'total points', 'total goals', 'total runs', 'goals over/under',
  'points over/under', 'runs over/under', 'over/under (incl. ot)', 'total - incl. overtime', 'over/under points'];
const SB_O_NAH = ['asian handicap', 'handicap', 'point spread', 'spread', 'run line', 'puck line', 'asian handicap (incl. overtime)', 'handicap (incl. overtime)', 'set handicap', 'sets handicap', 'asian handicap (sets)', 'asian handicap (incl. ot)'];
/**
 * Un pari d'un bookmaker → [[mk, k, cote], …] ; noms / valeurs inconnus → $unk (diagnostic), jamais d'erreur.
 * Handicap : la convention (« Away -5.5 » = ligne du domicile, ou « Away +5.5 » = ligne de l'équipe) est déduite des
 * paires de cotes (somme des 1/cote ≈ 1) ; indécidable → écarté. Puis contrôlé contre le vainqueur (sb_o_markets).
 * $names = [domicile, extérieur] (MMA : les noms des combattants peuvent servir de valeur).
 */
function sb_o_parse_bet(string $sp, string $name, array $values, array $names, array &$unk): array {
  $n = strtolower(trim((string) preg_replace('/\s+/', ' ', $name)));
  $C = SB_O_SPORTS[$sp];
  $bad = static function (string $k) use (&$unk, $sp) { $k = mb_substr($sp . ' · ' . $k, 0, 90); $unk[$k] = ($unk[$k] ?? 0) + 1; };
  $fam = in_array($n, SB_O_N12, true) ? '12' : (in_array($n, SB_O_N1X2, true) ? '1x2' : (in_array($n, SB_O_NOU, true) ? 'ou' : (in_array($n, SB_O_NAH, true) ? 'ah' : null)));
  if ($fam === null) { $bad($name); return []; }
  $vals = [];
  foreach ($values as $vv) {
    if (!is_array($vv) || !is_numeric($vv['odd'] ?? null)) continue;
    $odd = (float) $vv['odd'];
    if ($odd <= 1.0 || $odd > 1000) continue;
    $vals[] = [trim((string) ($vv['value'] ?? '')), $odd, $vv['handicap'] ?? null];
  }
  // un « vainqueur » avec un nul = résultat en 3 choix (temps réglementaire) ; un « 3 choix » sans nul reste un 3 choix incomplet
  if ($fam === '12') foreach ($vals as $v) if (in_array(strtolower($v[0]), ['draw', 'x', 'tie'], true)) { $fam = '1x2'; break; }
  if (!in_array($fam, $C['x'], true)) { $bad($name . ' (pas proposé)'); return []; }
  $nm = [strtolower(trim((string) ($names[0] ?? ''))), strtolower(trim((string) ($names[1] ?? '')))];
  $out = [];
  if ($fam === '12' || $fam === '1x2') {
    foreach ($vals as [$v, $odd]) {
      $lv = strtolower($v);
      $k = SB_RES[$lv] ?? ($lv === 'tie' ? 'D' : ($lv !== '' && $lv === $nm[0] ? 'H' : ($lv !== '' && $lv === $nm[1] ? 'A' : null)));
      if ($k === null || ($fam === '12' && $k === 'D')) { $bad($name . ' = ' . $v); continue; }
      $out[] = [$fam, $k, $odd];
    }
    return $out;
  }
  if ($fam === 'ou') {
    foreach ($vals as [$v, $odd, $hc]) {
      $o = sb_ou_val($v);
      if ($o === null && in_array(strtolower($v), ['over', 'under'], true) && is_numeric($hc)) $o = [strtolower($v) === 'over' ? 'O' : 'U', (float) $hc];
      if ($o === null) { $bad($name . ' = ' . $v); continue; }
      if (!sb_half($o[1]) || $o[1] < 0.5 || $o[1] > 999.5) continue; // lignes entières / quarts : écartées exprès (silencieux)
      $out[] = ['ou:' . sb_line($o[1]), $o[0], $odd];
    }
    return $out;
  }
  // handicap
  $H = []; $A = [];
  foreach ($vals as [$v, $odd, $hc]) {
    if (preg_match('/^(home|away|1|2)\s*([+-]?\d+(?:\.\d+)?)$/i', $v, $m)) { $side = in_array(strtolower($m[1]), ['home', '1'], true) ? 'H' : 'A'; $x = (float) $m[2]; }
    elseif (in_array(strtolower($v), ['home', 'away', '1', '2'], true) && is_numeric($hc)) { $side = in_array(strtolower($v), ['home', '1'], true) ? 'H' : 'A'; $x = (float) $hc; }
    else { $bad($name . ' = ' . $v); continue; }
    if (!sb_half($x) || abs($x) > 150) continue; // lignes entières / quarts : écartées exprès
    if ($side === 'H') $H[sb_line($x)] = $odd; else $A[sb_line($x)] = $odd;
  }
  $fit = static function (float $p, float $q): bool { $s = 1 / $p + 1 / $q; return $s >= 0.98 && $s <= 1.2; };
  $cHome = 0; $cTeam = 0;
  foreach ($H as $x => $o) { if (isset($A[$x]) && $fit($o, $A[$x])) $cHome++; $y = sb_line(-(float) $x); if (isset($A[$y]) && $fit($o, $A[$y])) $cTeam++; }
  if ($cHome === $cTeam) { if ($H || $A) $bad($name . ' (convention du handicap indécidable)'); return []; }
  foreach ($H as $x => $o) {
    $y = $cHome > $cTeam ? $x : sb_line(-(float) $x);
    if (!isset($A[$y])) continue; // groupe complet seulement
    $out[] = ['ah:' . $x, 'H', $o];
    $out[] = ['ah:' . $x, 'A', $A[$y]];
  }
  return $out;
}
/** Marge des autres sports : réglage « mOther » pour tous leurs marchés (2026-10-22 : 2,5 %). */
function sb_o_margin(string $fam, array $cfg): float { return max(0.01, min(0.4, (float) $cfg['mOther'] / 100)); }
/** Bookmakers d'un match → nos marchés mk => [[k, cote], …] (même formule et mêmes contrôles que le football). */
function sb_o_markets(string $sp, array $bookmakers, array $cfg, array $names, array &$unk): array {
  $sum = []; $cnt = [];
  foreach ($bookmakers as $bk) {
    if (!is_array($bk)) continue;
    $mine = [];
    foreach ((array) ($bk['bets'] ?? []) as $bet) {
      if (!is_array($bet)) continue;
      foreach (sb_o_parse_bet($sp, (string) ($bet['name'] ?? ''), (array) ($bet['values'] ?? []), $names, $unk) as [$mk, $k, $odd]) $mine[$mk][$k] = $odd;
    }
    foreach ($mine as $mk => $ks) {
      $mk = (string) $mk; $fam = sb_fam($mk); $size = (int) sb_group_size($fam); // (string : « 12 » devient une clé entière en PHP)
      $inv = 0.0; foreach ($ks as $o) $inv += 1 / $o;
      if (count($ks) >= $size && $inv < 0.98) continue; // bookmaker incohérent sur ce marché
      foreach ($ks as $k => $o) { $sum[$mk][$k] = ($sum[$mk][$k] ?? 0) + $o; $cnt[$mk][$k] = ($cnt[$mk][$k] ?? 0) + 1; }
    }
  }
  $out = []; $pr = [];
  foreach ($sum as $mk => $ks) {
    $mk = (string) $mk; $fam = sb_fam($mk);
    $avg = [];
    foreach ($ks as $k => $s) if ($cnt[$mk][$k] >= 2) $avg[$k] = $s / $cnt[$mk][$k];
    if (!$avg) continue;
    $inv = 0.0; foreach ($avg as $a) $inv += 1 / $a;
    $norm = max(1.0, $inv);
    $m = sb_o_margin($fam, $cfg);
    $row = [];
    foreach ($avg as $k => $a) {
      $p = (1 / $a) / $norm;
      $o = floor((1 - $m) / $p * 100 + 1e-6) / 100;
      // 2026-10-22 (propriétaire : « plus haut que 1xBet ») : plus de plafond « moyenne − 0,01 » ; seule la marge du réglage compte
      if ($o < 1.01) continue;
      $row[] = [(string) $k, round($o, 2)];
      $pr[$mk][$k] = $p;
    }
    if (!$row) continue;
    usort($row, static fn($x, $y) => sb_k_rank($x[0], $fam) <=> sb_k_rank($y[0], $fam));
    $out[$mk] = $row;
  }
  // handicap : contrôle du signe contre le vainqueur (12, sinon 1x2 sans le nul) — une autre convention est retirée, jamais mal payée
  $ref = isset($pr['12']['H'], $pr['12']['A']) ? $pr['12']['H'] / ($pr['12']['H'] + $pr['12']['A'])
    : (isset($pr['1x2']['H'], $pr['1x2']['A']) ? $pr['1x2']['H'] / ($pr['1x2']['H'] + $pr['1x2']['A']) : null);
  foreach (array_keys($out) as $mk) {
    $mk = (string) $mk;
    if (sb_fam($mk) !== 'ah') continue;
    $h = (float) substr($mk, 3); $p = isset($pr[$mk]['H'], $pr[$mk]['A']) ? $pr[$mk]['H'] / ($pr[$mk]['H'] + $pr[$mk]['A']) : null;
    $ok = $ref !== null && $p !== null && ($h < 0 ? $p <= $ref + 0.05 : $p >= $ref - 0.05) && count($out[$mk]) === 2;
    if (!$ok) { unset($out[$mk]); $kk = $sp . ' · (contrôle) handicap retiré : signe / convention à vérifier'; $unk[$kk] = ($unk[$kk] ?? 0) + 1; }
  }
  uksort($out, static fn($a, $b) => sb_mk_cmp((string) $a, (string) $b));
  return $out;
}
/** Marché montré dans la liste (1 · 2 ou 1 · X · 2). */
function sb_o_main(string $sp, array $mk): ?string {
  $p = SB_O_SPORTS[$sp]['pref'];
  foreach ([$p, $p === '12' ? '1x2' : '12'] as $k) if (isset($mk[$k]) && count($mk[$k]) >= ($k === '1x2' ? 3 : 2)) return $k;
  return null;
}
/** Enregistre les marchés (fichier par match) et le résumé dans l'index du jour (seulement les matchs connus). */
function sb_o_store(string $sp, array $rows, int $now): int {
  $sum = [];
  foreach ($rows as $id => $mk) {
    $id = (string) (int) $id;
    $main = sb_o_main($sp, $mk);
    sb_with('mk' . DIRECTORY_SEPARATOR . $sp . '-' . $id . '.json', static function (array &$s) use ($mk, $now) { $s = ['at' => $now, 'mk' => $mk]; return true; });
    $sum[$id] = ['o' => $main ? $mk[$main] : null, 'om' => $main, 'n' => $main ? count($mk) : 0, 'oat' => $now];
  }
  $n = 0;
  foreach (sb_o_days($now) as $day) {
    if (!$sum || !is_file(sb_dir() . DIRECTORY_SEPARATOR . sb_o_dayf($sp, $day))) continue;
    $n += (int) sb_with(sb_o_dayf($sp, $day), static function (array &$s) use (&$sum) {
      $c = 0;
      foreach ($sum as $id => $x) if (isset($s['fx'][$id])) { $s['fx'][$id] = array_merge($s['fx'][$id], $x); unset($sum[$id]); $c++; }
      return $c;
    });
  }
  return $n;
}
/** Réponse /odds → marchés par match connu de l'index. */
function sb_o_odds_rows(string $sp, array $j, array $known, array &$unk): array {
  $cfg = sb_config(); $out = [];
  foreach ((array) ($j['response'] ?? []) as $r) {
    if (!is_array($r)) continue;
    $id = (string) (int) ($r['game']['id'] ?? ($r['fight']['id'] ?? ($r['id'] ?? 0)));
    if (!isset($known[$id])) continue;
    $k = $known[$id];
    $mk = sb_o_markets($sp, (array) ($r['bookmakers'] ?? []), $cfg, [(string) ($k['h'][1] ?? ''), (string) ($k['a'][1] ?? '')], $unk);
    if ($mk) $out[$id] = $mk;
  }
  return $out;
}
function sb_o_note_unknown(array $unk): void {
  if (!$unk) return;
  sb_with('state.json', static function (array &$s) use ($unk) {
    $u = (array) ($s['ounk'] ?? []);
    foreach ($unk as $k => $n) $u[$k] = (int) ($u[$k] ?? 0) + (int) $n;
    arsort($u); $s['ounk'] = array_slice($u, 0, 80, true);
    return true;
  });
}
/** Âge maximal des cotes : 9 h ; match à plus de 24 h (relu toutes les 12 h) : 26 h. */
function sb_o_max_age(int $ko, int $now): int { return $ko - $now > 86400 ? 93600 : 32400; }
function sb_o_bettable(array $r, int $now): bool {
  return in_array((string) ($r['st'] ?? ''), ['NS', 'TBD'], true) && (int) ($r['ts'] ?? 0) > $now && (int) ($r['n'] ?? 0) > 0 && !empty($r['o'])
    && (int) ($r['oat'] ?? 0) > $now - sb_o_max_age((int) ($r['ts'] ?? 0), $now);
}

/* ---------- tâche de fond ---------- */
function sb_o_import_day(string $sp, string $day, int $now): bool {
  sb_with('state.json', static function (array &$s) use ($sp, $day, $now) { $s['ofa'][$sp][$day] = $now; return true; }); // essai noté : jamais de relance en boucle
  $j = sb_get(SB_O_SPORTS[$sp]['ep'] . '?date=' . $day . '&timezone=UTC', $now, $sp);
  if ($j === null) return false;
  $fx = []; $lgs = [];
  foreach ((array) ($j['response'] ?? []) as $r) {
    if (!is_array($r) || !($p = sb_o_row($sp, $r))) continue;
    [$id, $row, $lg] = $p;
    $fx[$id] = $row;
    if (!isset($lgs[(string) $row['lg']])) $lgs[(string) $row['lg']] = $lg;
  }
  sb_with(sb_o_dayf($sp, $day), static function (array &$s) use ($fx, $lgs, $now) {
    $old = (array) ($s['fx'] ?? []);
    foreach ($fx as $id => $row) foreach (['o', 'om', 'n', 'oat'] as $k) if (isset($old[$id][$k])) $fx[$id][$k] = $old[$id][$k];
    $s = ['at' => $now, 'lg' => $lgs, 'fx' => $fx];
    return true;
  });
  return true;
}
/** Matchs à venir (pas commencés, dans les 3 jours) d'un sport : id → ligne. */
function sb_o_upcoming(string $sp, int $now): array {
  $out = [];
  foreach (sb_o_days($now) as $d) foreach ((array) (sb_o_day($sp, $d)['fx'] ?? []) as $id => $r)
    if (in_array((string) ($r['st'] ?? ''), ['NS', 'TBD'], true) && (int) ($r['ts'] ?? 0) > $now + 300 && (int) $r['ts'] < $now + 3 * 86400) $out[(string) $id] = (array) $r;
  return $out;
}
/** Cotes : championnats (ou matchs) dont les cotes sont à relire, grands d'abord puis le plus tôt ; au plus $max lectures. */
function sb_o_odds_job(string $sp, int $now, int $max, array &$log): int {
  if ($max <= 0) return 0;
  $bu = sb_o_budget($sp, $now);
  if ($bu['odds'] >= SB_O_ODDS_DAY || $bu['used'] >= SB_O_CAP) return 0; // plafond des cotes du jour
  $up = sb_o_upcoming($sp, $now);
  if (!$up) return 0;
  $st = sb_state();
  $lgP = [];
  foreach (sb_o_days($now) as $d) foreach ((array) (sb_o_day($sp, $d)['lg'] ?? []) as $lid => $l) $lgP[(string) $lid] = (int) ($l['p'] ?? 100);
  $every = static fn(int $ts): int => $ts - $now < 86400 ? 14400 : 43200;
  $perGame = $sp === 'mma' || (int) ($st['osea'][$sp] ?? 0) > $now - 86400;
  $calls = 0; $unk = [];
  if (!$perGame) {
    $L = [];
    foreach ($up as $id => $r) {
      $k = (string) $r['lg'];
      if (($r['sea'] ?? '') === '') continue;
      $L[$k] = $L[$k] ?? ['sea' => (string) $r['sea'], 't' => PHP_INT_MAX, 'p' => $lgP[$k] ?? 100];
      $L[$k]['t'] = min($L[$k]['t'], (int) $r['ts']);
    }
    $due = array_filter($L, static fn($l, $k) => $now - (int) ($st['oo'][$sp][$k] ?? 0) >= $every($l['t']), ARRAY_FILTER_USE_BOTH);
    uksort($due, static fn($a, $b) => [$due[$a]['p'], $due[$a]['t']] <=> [$due[$b]['p'], $due[$b]['t']]);
    foreach ($due as $lid => $l) {
      if ($calls >= $max) break;
      $calls++;
      sb_with('state.json', static function (array &$s) use ($sp, $lid, $now) { $s['oo'][$sp][(string) $lid] = $now; return true; });
      $j = sb_get('odds?league=' . (int) $lid . '&season=' . rawurlencode($l['sea']), $now, $sp, 'od');
      if ($j === null) { $log[] = $sp . ' odds lg' . $lid . ' ✗'; if ((int) (sb_state()['osea'][$sp] ?? 0) > $now - 60) { $perGame = true; break; } continue; }
      $n = sb_o_store($sp, sb_o_odds_rows($sp, $j, $up, $unk), $now);
      $tot = max(1, min(10, (int) ($j['paging']['total'] ?? 1)));
      for ($pg = 2; $pg <= $tot && $calls < $max; $pg++) {
        $calls++;
        $j2 = sb_get('odds?league=' . (int) $lid . '&season=' . rawurlencode($l['sea']) . '&page=' . $pg, $now, $sp, 'od');
        if ($j2 === null) break;
        $n += sb_o_store($sp, sb_o_odds_rows($sp, $j2, $up, $unk), $now);
      }
      $log[] = $sp . ' odds lg' . $lid . ' (' . $n . ')';
    }
  }
  if ($perGame && $calls < $max) { // repli : un match à la fois (grands championnats, puis le plus tôt), seulement les 36 prochaines heures
    $G = array_filter($up, static fn($r, $id) => (int) $r['ts'] < $now + 129600 && $now - (int) ($st['og'][$sp][$id] ?? 0) >= $every((int) $r['ts']), ARRAY_FILTER_USE_BOTH);
    uksort($G, static fn($a, $b) => [$lgP[(string) $G[$a]['lg']] ?? 100, (int) $G[$a]['ts']] <=> [$lgP[(string) $G[$b]['lg']] ?? 100, (int) $G[$b]['ts']]);
    foreach (array_slice($G, 0, max(0, min(3, $max - $calls)), true) as $id => $r) {
      $calls++;
      sb_with('state.json', static function (array &$s) use ($sp, $id, $now) {
        $s['og'][$sp][(string) $id] = $now;
        if (count($s['og'][$sp]) > 400) $s['og'][$sp] = array_slice($s['og'][$sp], -300, null, true);
        return true;
      });
      $j = sb_get('odds?' . SB_O_SPORTS[$sp]['op'] . '=' . (int) $id, $now, $sp, 'od');
      if ($j === null) { $log[] = $sp . ' odds ' . $id . ' ✗'; continue; }
      $log[] = $sp . ' odds ' . $id . ' (' . sb_o_store($sp, sb_o_odds_rows($sp, $j, $up, $unk), $now) . ')';
    }
  }
  sb_o_note_unknown($unk);
  return $calls;
}
/** Un passage pour UN sport : index des jours, résultats des coupons ouverts, cotes. Au plus $max lectures. */
function sb_o_tick(string $sp, int $now, int $max = SB_O_RUN): array {
  $calls = 0; $log = [];
  if (!sb_o_ok($sp)) return ['calls' => 0, 'log' => []];
  if (sb_o_budget($sp, $now)['used'] >= SB_O_CAP || (sb_state()['ostop'][$sp] ?? '') === gmdate('Y-m-d', $now)) return ['calls' => 0, 'log' => []]; // plafond du jour
  $D = sb_o_days($now); [$dm1, $d0, $d1, $d2] = $D;
  $every = [$d0 => 10800, $d1 => 21600, $d2 => 43200, $dm1 => 10800];
  $st = sb_state();
  foreach ([$d0, $d1, $dm1, $d2] as $day) {
    if ($calls >= $max) break;
    if (!sb_o_day_ok($sp, $day, $st, $now)) continue;
    $idx = sb_o_day($sp, $day);
    if ($now - max((int) ($idx['at'] ?? 0), (int) ($st['ofa'][$sp][$day] ?? 0)) < $every[$day]) continue;
    if ($day === $dm1 && $idx && !array_filter((array) ($idx['fx'] ?? []), static fn($r) => !in_array((string) ($r['st'] ?? ''), array_merge(SB_O_FIN, SB_O_VOID, ['CANC', 'POST', 'PST', 'ABD']), true))) continue;
    $calls++;
    $log[] = $sp . ' ' . SB_O_SPORTS[$sp]['ep'] . ' ' . $day . (sb_o_import_day($sp, $day, $now) ? '' : ' ✗');
    $st = sb_state();
  }
  $res = sb_o_results_job($sp, $now, sb_o_budget($sp, $now)['res'] < SB_O_RES_DAY ? min(2, $max - $calls) : 0);
  $calls += (int) $res['calls'];
  $calls += sb_o_odds_job($sp, $now, $max - $calls, $log);
  if ($calls > 0) sb_with('state.json', static function (array &$s) use ($sp, $now, $log) {
    $s['olast'][$sp] = $now; $s['olog'][$sp] = array_slice($log, 0, 12);
    foreach (array_keys((array) ($s['ofa'][$sp] ?? [])) as $d) if ($d < gmdate('Y-m-d', $now - 2 * 86400)) unset($s['ofa'][$sp][$d]);
    return true;
  });
  return ['calls' => $calls, 'log' => $log, 'results' => $res];
}
/** Après la réponse : au plus une fois par minute, un sport à la fois (chacun son tour : le premier qui a du travail). */
function sb_o_maybe_run(int $now = 0): ?array {
  $now = $now ?: sb_now();
  if (!sb_has_key()) return null;
  $at = sb_dir() . DIRECTORY_SEPARATOR . 'jobo.at';
  clearstatcache(true, $at);
  if (is_file($at) && filemtime($at) > $now - SB_O_EVERY) return null;
  $lk = @fopen($at . '.lock', 'c');
  if (!$lk || !flock($lk, LOCK_EX | LOCK_NB)) { if ($lk) fclose($lk); return null; }
  try {
    clearstatcache(true, $at);
    if (is_file($at) && filemtime($at) > $now - SB_O_EVERY) return null;
    @touch($at, $now);
    $sps = array_values(array_filter(array_keys(SB_O_SPORTS), 'sb_o_ok'));
    if (!$sps) return null;
    $rr = (int) (sb_state()['orr'] ?? 0);
    for ($i = 0; $i < count($sps); $i++) {
      $sp = $sps[($rr + $i) % count($sps)];
      $r = sb_o_tick($sp, $now);
      if ($r['calls'] > 0 || $i === count($sps) - 1) {
        $next = ($rr + $i + 1) % count($sps);
        sb_with('state.json', static function (array &$s) use ($next) { $s['orr'] = $next; return true; });
        return ['sport' => $sp] + $r;
      }
    }
    return null;
  } catch (Throwable $e) {
    sb_note_error('Autres sports : ' . $e->getMessage(), $now);
    return null;
  } finally { flock($lk, LOCK_UN); fclose($lk); }
}

/* ---------- résultats et règlement ---------- */
function sb_o_open(string $sp): array {
  $out = [];
  foreach ((array) (sp_with('bets.json', static fn(array &$s) => $s['b'] ?? []) ?: []) as $b) {
    if (($b['status'] ?? '') !== 'open') continue;
    foreach ((array) ($b['sel'] ?? []) as $s) {
      if (!preg_match('/^sb:' . $sp . ':(\d+):/', (string) ($s['ev'] ?? ''), $m) || isset($s['r'])) continue;
      $o = $out[$m[1]] ?? ['ko' => PHP_INT_MAX, 'ti' => $s['ti'] ?? null, 't' => (string) ($s['t'] ?? ''), 'n' => 0];
      $o['ko'] = min($o['ko'], (int) ($s['ko'] ?? 0)); $o['n']++;
      $out[$m[1]] = $o;
    }
  }
  return $out;
}
function sb_o_classify(string $sp, array $row, ?array $ti, int $ko, int $now): array {
  $st = (string) ($row['st'] ?? '');
  $base = ['st' => $st, 'ts' => (int) ($row['ts'] ?? 0), 'ti' => [(int) ($row['h'][0] ?? 0), (int) ($row['a'][0] ?? 0)], 'at' => $now];
  if ($ti !== null && array_map('intval', $ti) !== $base['ti']) return $base + ['v' => 'chk', 'why' => 'Équipes différentes de celles du pari'];
  if (in_array($st, SB_O_FIN, true)) {
    if (!is_array($row['fo'] ?? null)) return $base + ['v' => 'chk', 'why' => 'Fini (' . $st . ') sans score lisible'];
    return $base + ['v' => 'fin', 'fo' => $row['fo'], 'rg' => $row['rg'] ?? null, 'pts' => $row['pts'] ?? null];
  }
  if (in_array($st, SB_O_VOID, true)) return $base + ['v' => 'void', 'why' => 'Attribué sur tapis vert (' . $st . ')'];
  if (in_array($st, SB_O_WAIT, true)) return $base + ['v' => 'wait', 'why' => $st];
  $late = $now > $ko + ($sp === 'mma' ? 12 : 8) * 3600;
  return $base + ['v' => $late ? 'chk' : 'live', 'why' => $late ? 'Toujours « en cours » longtemps après le début (' . $st . ')' : ''];
}
/**
 * Résultats des matchs avec des coupons ouverts : index du jour (déjà lu) ; sinon /games?id=ID (2 par passage, 12 / jour,
 * gardé 1 h) 3 h après le début ; puis règlement par sp_resolve (chemin de paiement existant).
 */
function sb_o_results_job(string $sp, int $now, int $maxCalls = 2, ?array $db = null): array {
  $open = sb_o_open($sp);
  if (!$open) return ['calls' => 0, 'updated' => 0, 'final' => 0, 'settled' => null];
  $known = sb_o_results($sp);
  $auto = (bool) sb_config()['autosettle'];
  $idx = [];
  foreach (sb_o_days($now) as $d) foreach ((array) (sb_o_day($sp, $d)['fx'] ?? []) as $id => $r) $idx[(string) $id] = (array) $r;
  $upd = []; $calls = 0;
  foreach ($open as $id => $o) {
    $k = $known[$id] ?? null;
    if (is_array($k) && (in_array($k['v'] ?? '', ['fin', 'void'], true) || !empty($k['man']))) continue;
    if ($o['ko'] > $now) continue;
    $r = $idx[(string) $id] ?? null;
    if ($r !== null && !in_array((string) ($r['st'] ?? ''), ['NS', 'TBD'], true)) { $c = sb_o_classify($sp, $r, $o['ti'], $o['ko'], $now); if ($c['v'] !== 'live') { $upd[$id] = $c; continue; } }
    if ($now < $o['ko'] + 3 * 3600 || $calls >= $maxCalls) { if ($r !== null) $upd[$id] = sb_o_classify($sp, $r, $o['ti'], $o['ko'], $now); continue; }
    $calls++;
    $j = sb_get_cached(SB_O_SPORTS[$sp]['ep'] . '?id=' . (int) $id . '&timezone=UTC', 3600, $now, $sp, 'rs');
    if ($j === null) continue;
    $seen = false;
    foreach ((array) ($j['response'] ?? []) as $rr) if (is_array($rr) && ($p = sb_o_row($sp, $rr)) && $p[0] === (string) $id) { $upd[$id] = sb_o_classify($sp, $p[1], $o['ti'], $o['ko'], $now); $seen = true; }
    if (!$seen && $now > $o['ko'] + 12 * 3600) $upd[$id] = ['v' => 'chk', 'why' => 'Match introuvable dans l\'API', 'at' => $now, 'ts' => 0, 'st' => ''];
  }
  $newFinal = 0; $newChk = [];
  if ($upd) sb_with('results-' . $sp . '.json', static function (array &$s) use ($upd, $auto, $now, &$newFinal, &$newChk, $open) {
    foreach ($upd as $id => $r) {
      $old = (array) ($s['fx'][$id] ?? []);
      if (!empty($old['man'])) continue;
      if (!$auto && in_array($r['v'], ['fin', 'void'], true)) $r['v'] = 'prop';
      if (in_array($r['v'], ['fin', 'void'], true)) $newFinal++;
      if (in_array($r['v'], ['chk', 'prop'], true) && ($old['v'] ?? '') !== $r['v']) $newChk[] = ($open[$id]['t'] ?? $id) . ' : ' . ($r['why'] ?? 'à valider');
      $r['t'] = $open[$id]['t'] ?? ($old['t'] ?? '');
      $s['fx'][$id] = $r;
    }
    foreach ((array) ($s['fx'] ?? []) as $id => $r) if ((int) ($r['at'] ?? 0) < $now - 40 * 86400) unset($s['fx'][$id]);
    return true;
  });
  foreach (array_slice($newChk, 0, 5) as $msg) sb_alert('✋ Paris (' . SB_O_SPORTS[$sp]['n'] . ') : résultat à vérifier', $msg, $now);
  $pst = false;
  foreach ($open as $id => $o) if (($upd[$id]['v'] ?? ($known[$id]['v'] ?? '')) === 'wait' && $now > $o['ko'] + SB_PST_VOID) $pst = true;
  $settled = null;
  if ($newFinal > 0 || ($pst && $auto)) { $db = $db ?? (function_exists('load_db') ? load_db() : null); if (is_array($db)) $settled = sp_resolve($db); }
  return ['calls' => $calls, 'updated' => count($upd), 'final' => $newFinal, 'settled' => $settled];
}
/** Un choix (mk, k) d'après le résultat : 'won' | 'lost' | 'void' | null (données manquantes). */
function sb_o_settle(string $sp, string $mk, string $k, array $r): ?string {
  if (!isset(SB_O_SPORTS[$sp])) return null;
  $fam = sb_fam($mk);
  if (!in_array($k, sb_valid_k($fam), true) || !in_array($fam, SB_O_SPORTS[$sp]['x'], true)) return null;
  $x = (float) substr($mk, strlen($fam) + 1);
  $C = SB_O_SPORTS[$sp];
  $pair = static function ($p): ?array { return is_array($p) && count($p) === 2 && is_numeric($p[0] ?? null) && is_numeric($p[1] ?? null) ? [(int) $p[0], (int) $p[1]] : null; };
  $base = static fn(string $w): ?array => $pair($r[$w === 'sets' ? 'fo' : $w] ?? null);
  switch ($fam) {
    case '12': $s = $base('fo'); if ($s === null) return null; if ($s[0] === $s[1]) return 'void'; $win = $s[0] > $s[1] ? 'H' : 'A'; break;
    case '1x2': $s = $base('rg'); if ($s === null) return null; $win = $s[0] > $s[1] ? 'H' : ($s[0] < $s[1] ? 'A' : 'D'); break;
    case 'ou': if (!sb_half($x)) return null; $s = $base($C['tot']); if ($s === null) return null; $win = $s[0] + $s[1] > $x ? 'O' : 'U'; break;
    case 'ah': if (!sb_half($x)) return null; $s = $base($C['hcp']); if ($s === null) return null; $win = $s[0] + $x - $s[1] > 0 ? 'H' : 'A'; break;
    default: return null;
  }
  return $k === $win ? 'won' : 'lost';
}
/** sb_sel_result pour un autre sport (mêmes règles d'annulation que le football). */
function sb_o_sel_result(string $sp, string $id, string $mk, array $sel, int $betAt, int $now, ?bool $auto): ?string {
  if (!isset(SB_O_SPORTS[$sp])) return null;
  $r = sb_o_results($sp)[$id] ?? null;
  if (!is_array($r)) return null;
  $v = (string) ($r['v'] ?? '');
  $ko = (int) ($sel['ko'] ?? 0);
  $auto = $auto ?? (bool) sb_config()['autosettle'];
  if ($v === 'void') return 'void';
  if ($v === 'fin') {
    if (isset($sel['ti'], $r['ti']) && array_map('intval', (array) $sel['ti']) !== array_map('intval', (array) $r['ti'])) return null; // jamais deviner
    $ts = (int) ($r['ts'] ?? 0);
    if ($ts <= 0) return null;
    if ($ko > 0 && $ts > $ko + SB_PST_VOID) return 'void';
    if ($betAt >= $ts) return 'void'; // pari posé au / après le vrai début
    return sb_o_settle($sp, $mk, (string) ($sel['k'] ?? ''), $r);
  }
  if ($v === 'wait' && $auto && $ko > 0 && $now > $ko + SB_PST_VOID && (int) ($r['at'] ?? 0) > $now - 7200) return 'void';
  return null;
}

/* ---------- libellés (français ; le téléphone traduit mk / k) et règles ---------- */
function sb_o_mk_name(string $sp, string $mk): string {
  $fam = sb_fam($mk); $x = str_replace('.', ',', substr($mk, strlen($fam) + 1));
  $u = ['basket' => 'points', 'volley' => 'points', 'amfoot' => 'points', 'afl' => 'points', 'rugby' => 'points', 'baseball' => 'points (runs)'][$sp] ?? 'buts';
  return ['12' => $sp === 'mma' ? 'Vainqueur du combat' : 'Vainqueur (prolongation comprise)', '1x2' => 'Résultat (temps réglementaire)', 'ou' => 'Total de ' . $u . ' (plus/moins de ' . $x . ')',
    'ah' => ($sp === 'volley' ? 'Handicap en sets (' : 'Handicap (') . $x . ')'][$fam] ?? $mk;
}
function sb_o_rules(string $sp): string {
  $r = [
    'basket' => 'Basket : vainqueur et handicap / total prolongations comprises ; 1 · X · 2 sur les 4 quart-temps.',
    'hockey' => 'Hockey : 1 · X · 2, total et handicap sur le temps réglementaire (3 périodes) ; vainqueur prolongation et tirs au but compris.',
    'handball' => 'Handball : 1 · X · 2, total et handicap sur les 60 minutes ; vainqueur prolongation et jets de 7 m compris.',
    'volley' => 'Volley : vainqueur du match ; handicap en sets ; total = points de tous les sets.',
    'rugby' => 'Rugby : 1 · X · 2, total et handicap sur les 80 minutes ; vainqueur prolongation comprise (égalité : remboursé).',
    'baseball' => 'Baseball : vainqueur, total et handicap manches supplémentaires comprises.',
    'amfoot' => 'Football américain : vainqueur, total et handicap prolongation comprise ; 1 · X · 2 sur les 4 quart-temps.',
    'afl' => 'AFL : score final ; vainqueur : égalité remboursée.',
    'mma' => 'MMA : vainqueur du combat ; nul ou sans décision : remboursé.',
  ];
  return ($r[$sp] ?? '') . ' Paris fermés au début ; pari posé après le vrai début : remboursé. Match reporté, arrêté ou annulé et pas joué dans les 48 h : remboursé.';
}

/* ---------- vue joueur ---------- */
function sb_o_fx_public(string $sp, string $id, array $r): array {
  return ['id' => $sp . ':' . $id, 'lg' => (int) ($r['lg'] ?? 0), 'ts' => (int) ($r['ts'] ?? 0), 'st' => (string) ($r['st'] ?? ''), 'm' => null,
    'h' => ['n' => (string) ($r['h'][1] ?? ''), 'lo' => (string) ($r['h'][2] ?? '')], 'a' => ['n' => (string) ($r['a'][1] ?? ''), 'lo' => (string) ($r['a'][2] ?? '')],
    'sc' => null, 'o' => !empty($r['o']) ? ['mk' => (string) ($r['om'] ?? '12'), 'o' => $r['o']] : null, 'n' => (int) ($r['n'] ?? 0), 'live' => 0, 'susp' => 0];
}
/** Fichiers d'index d'un sport qui peuvent contenir des matchs entre $from et $to. */
function sb_o_day_files(string $sp, int $from, int $to): array {
  $out = [];
  for ($t = $from - 86400; $t < $to + 86400; $t += 86400) $out[] = gmdate('Y-m-d', $t);
  return array_values(array_unique($out));
}
/** Sports proposés (onglets) : Football d'abord, puis seulement les sports qui ont des matchs ouverts aux paris (gardé 60 s). */
function sb_sports_list(?array $user, int $now): array {
  $out = [['s' => 'foot', 'n' => 'Football', 'live' => sb_live_count($user, $now)]];
  foreach (sb_o_counts($now) as $sp => $n) if ($n > 0 && sb_o_ok($sp)) $out[] = ['s' => $sp, 'n' => SB_O_SPORTS[$sp]['n'], 'live' => 0, 'c' => $n];
  return $out;
}
function sb_o_counts(int $now): array {
  $f = sb_dir() . DIRECTORY_SEPARATOR . 'cache' . DIRECTORY_SEPARATOR . 'spcnt.json';
  clearstatcache(true, $f);
  if (is_file($f) && filemtime($f) > $now - 60 && filemtime($f) <= $now && is_array($c = json_decode((string) @file_get_contents($f), true))) return $c;
  $c = [];
  foreach (array_keys(SB_O_SPORTS) as $sp) { $n = 0; foreach (sb_o_days($now) as $d) foreach ((array) (sb_o_day($sp, $d)['fx'] ?? []) as $r) if (sb_o_bettable((array) $r, $now)) $n++; $c[$sp] = $n; }
  if (!is_dir(dirname($f))) @mkdir(dirname($f), 0750, true);
  @file_put_contents($f, json_encode($c)); @touch($f, $now);
  return $c;
}
/** sbList d'un autre sport : même forme que le football (day 0…14 dans le fuseau du joueur, ou 'all'). */
function sb_o_list(?array $user, string $sp, $day, int $tzSec, int $now, bool $cnt): array {
  if (!sb_o_ok($sp)) return ['ok' => true, 'at' => $now, 'sports' => sb_sports_list($user, $now), 'lg' => [], 'fx' => []] + ($cnt ? ['days' => array_fill(0, SB_DAYS_AHEAD + 1, 0)] : []);
  $all = $day === 'all';
  $d = $all ? 0 : max(0, min(SB_DAYS_AHEAD, (int) $day));
  $base = (int) (floor(($now + $tzSec) / 86400) * 86400) - $tzSec;
  $from = $base + $d * 86400; $to = $from + ($all ? (SB_DAYS_AHEAD + 1) * 86400 : 86400);
  $fx = []; $lgs = [];
  $days = array_fill(0, SB_DAYS_AHEAD + 1, 0);
  $files = $cnt ? sb_o_day_files($sp, $base, $base + (SB_DAYS_AHEAD + 1) * 86400) : sb_o_day_files($sp, $from, $to);
  foreach ($files as $dd) {
    $j = sb_o_day($sp, $dd);
    foreach ((array) ($j['fx'] ?? []) as $id => $r) {
      if (!sb_o_bettable((array) $r, $now)) continue;
      $ts = (int) $r['ts'];
      if ($cnt) { $i = (int) floor(($ts - $base) / 86400); if ($i >= 0 && $i <= SB_DAYS_AHEAD) $days[$i]++; }
      if ($ts < $from || $ts >= $to || isset($fx[(string) $id])) continue;
      $fx[(string) $id] = sb_o_fx_public($sp, (string) $id, (array) $r);
      $lid = (int) $r['lg'];
      if (!isset($lgs[$lid]) && isset($j['lg'][(string) $lid])) $lgs[$lid] = ['id' => $lid] + (array) $j['lg'][(string) $lid];
    }
  }
  $lgs = array_values($lgs);
  usort($lgs, static fn($a, $b) => [(int) ($a['p'] ?? 100), (string) ($a['c'] ?? ''), (string) ($a['n'] ?? '')] <=> [(int) ($b['p'] ?? 100), (string) ($b['c'] ?? ''), (string) ($b['n'] ?? '')]);
  $fx = array_values($fx);
  usort($fx, static fn($a, $b) => [$a['ts'], $a['id']] <=> [$b['ts'], $b['id']]);
  sb_after_response();
  $out = ['ok' => true, 'at' => $now, 'sports' => sb_sports_list($user, $now), 'lg' => $lgs, 'fx' => $fx];
  if ($cnt) $out['days'] = $days;
  return $out;
}
function sb_o_find(string $sp, string $id, int $now): ?array {
  foreach (sb_o_days($now) as $d) { $j = sb_o_day($sp, $d); if (isset($j['fx'][$id])) return ['row' => (array) $j['fx'][$id], 'lg' => (array) ($j['lg'][(string) $j['fx'][$id]['lg']] ?? [])]; }
  return null;
}
/** sbMatch d'un autre sport : tous les marchés (aucune lecture d'API). */
function sb_o_match(string $sp, string $id, int $now): array {
  if (!sb_o_ok($sp)) return ['ok' => false, 'reason' => 'closed'];
  $f = sb_o_find($sp, $id, $now);
  if (!$f) return ['ok' => false, 'reason' => 'closed'];
  $mf = sb_o_mk_file($sp, $id);
  $open = sb_o_bettable($f['row'], $now) && (int) ($mf['at'] ?? 0) > $now - sb_o_max_age((int) $f['row']['ts'], $now);
  $mk = [];
  if ($open) foreach ((array) ($mf['mk'] ?? []) as $k => $o) $mk[] = ['mk' => (string) $k, 'o' => $o, 's' => 0];
  sb_after_response();
  return ['ok' => true, 'fx' => sb_o_fx_public($sp, $id, $f['row']) + ['lgn' => (string) ($f['lg']['n'] ?? ''), 'c' => (string) ($f['lg']['c'] ?? ''), 'sp' => $sp], 'mk' => $mk, 'rules' => sb_o_rules($sp)];
}
/** Choix d'un autre sport (sp_bet / code de coupon) : pas commencé, cotes fraîches, cote ACTUELLE du serveur. */
function sb_o_pick(string $sp, string $id, string $mk, string $k, int $now): array {
  if (!sb_o_ok($sp)) return ['ok' => false, 'reason' => 'closed'];
  $f = sb_o_find($sp, $id, $now);
  if (!$f) return ['ok' => false, 'reason' => 'closed'];
  $row = $f['row'];
  $mf = sb_o_mk_file($sp, $id);
  if (!in_array((string) ($row['st'] ?? ''), ['NS', 'TBD'], true) || $now >= (int) $row['ts'] || (int) ($mf['at'] ?? 0) < $now - sb_o_max_age((int) $row['ts'], $now)) return ['ok' => false, 'reason' => 'closed'];
  if (!in_array(sb_fam($mk), SB_O_SPORTS[$sp]['x'], true)) return ['ok' => false, 'reason' => 'param'];
  $odd = null;
  foreach ((array) ($mf['mk'][$mk] ?? []) as $o) if ((string) ($o[0] ?? '') === $k) $odd = (float) $o[1];
  if ($odd === null || $odd < 1.01) return ['ok' => false, 'reason' => 'param'];
  $home = (string) ($row['h'][1] ?? ''); $away = (string) ($row['a'][1] ?? '');
  $kn = sb_k_name($mk, $k, $home, $away);
  return ['ok' => true, 'grp' => 'fx:' . $sp . ':' . $id, 'sel' => ['ev' => 'sb:' . $sp . ':' . $id . ':' . $mk, 'k' => $k, 'odd' => $odd, 't' => $home . ' - ' . $away,
    'l' => in_array($mk, ['12', '1x2'], true) ? sb_o_mk_name($sp, $mk) . ' : ' . $kn : sb_o_mk_name($sp, $mk) . ' : ' . $kn,
    'mk' => $mk, 'sp' => $sp, 'fx' => $sp . ':' . $id, 'ko' => (int) $row['ts'], 'ti' => [(int) ($row['h'][0] ?? 0), (int) ($row['a'][0] ?? 0)]],
    'team' => ['h' => ['n' => $home, 'lo' => (string) ($row['h'][2] ?? '')], 'a' => ['n' => $away, 'lo' => (string) ($row['a'][2] ?? '')]]];
}

/* ---------- admin ---------- */
/** État par sport (budget, erreurs, matchs, avec cotes) pour la carte « Paris » de l'admin. */
function sb_o_admin(int $now): array {
  $st = sb_state(); $out = [];
  foreach (array_keys(SB_O_SPORTS) as $sp) {
    $n = 0; $w = 0;
    foreach (sb_o_days($now) as $d) foreach ((array) (sb_o_day($sp, $d)['fx'] ?? []) as $r) { $n++; if (sb_o_bettable((array) $r, $now)) $w++; }
    $out[$sp] = ['n' => SB_O_SPORTS[$sp]['n'], 'on' => sb_o_ok($sp), 'budget' => sb_o_budget($sp, $now), 'fixtures' => $n, 'withOdds' => $w, 'last' => (int) ($st['olast'][$sp] ?? 0),
      'err' => (string) ($st['oerr'][$sp]['m'] ?? ''), 'errAt' => (int) ($st['oerr'][$sp]['at'] ?? 0), 'win' => $st['owin'][$sp] ?? null];
  }
  return $out;
}
/** Anomalies des autres sports pour « Résultats à vérifier ». */
function sb_o_check_list(int $now): array {
  $out = [];
  foreach (array_keys(SB_O_SPORTS) as $sp) {
    $open = sb_o_open($sp); if (!$open) continue;
    $known = sb_o_results($sp);
    foreach ($open as $id => $o) {
      $r = (array) ($known[$id] ?? []); $v = (string) ($r['v'] ?? '');
      $late = $o['ko'] > 0 && $now > $o['ko'] + 8 * 3600 && !in_array($v, ['fin', 'void'], true);
      if (in_array($v, ['chk', 'prop'], true) || ($v === 'wait' && $now > $o['ko'] + SB_PST_VOID) || ($late && $v !== 'wait'))
        $out[] = ['id' => $sp . ':' . $id, 'sp' => $sp, 't' => SB_O_SPORTS[$sp]['n'] . ' · ' . $o['t'], 'ko' => $o['ko'], 'n' => $o['n'], 'v' => $v ?: 'none',
          'why' => (string) ($r['why'] ?? ($v === '' ? 'Pas de résultat reçu' : '')), 'st' => (string) ($r['st'] ?? ''), 'ft' => $r['fo'] ?? null, 'ht' => null];
    }
  }
  return $out;
}
/** Admin : score final saisi (pris aussi comme temps réglementaire) ou « annuler » pour un match d'un autre sport. */
function sb_o_admin_result(array $db, string $sp, string $id, ?array $ft, bool $void, int $now): array {
  $open = sb_o_open($sp); $known = sb_o_results($sp);
  if (!isset($open[$id]) && !isset($known[$id])) return ['ok' => false, 'reason' => 'Aucun pari ouvert sur ce match'];
  if (!$void) {
    if (!is_array($ft) || count($ft) !== 2 || !is_numeric($ft[0] ?? null) || !is_numeric($ft[1] ?? null) || (int) $ft[0] < 0 || (int) $ft[1] < 0 || (int) $ft[0] > 999 || (int) $ft[1] > 999) return ['ok' => false, 'reason' => 'Score invalide'];
    $ft = [(int) $ft[0], (int) $ft[1]];
  }
  $o = $open[$id] ?? null; $k = (array) ($known[$id] ?? []);
  $row = $void ? ['v' => 'void', 'why' => 'Annulé par l\'admin'] : ['v' => 'fin', 'fo' => $ft, 'rg' => $ft, 'pts' => null, 'st' => 'FT'];
  $row += ['ts' => (int) ($k['ts'] ?? 0) ?: (int) ($o['ko'] ?? 0), 'ti' => $o['ti'] ?? ($k['ti'] ?? null), 't' => $o['t'] ?? ($k['t'] ?? ''), 'at' => $now, 'man' => 1];
  if ($row['ti'] === null) unset($row['ti']);
  sb_with('results-' . $sp . '.json', static function (array &$s) use ($id, $row) { $s['fx'][$id] = $row; return true; });
  return ['ok' => true] + sp_resolve($db);
}
/** Ménage des autres sports (appelé par sb_prune) : index de plus de 3 jours, marchés des matchs passés. */
function sb_o_prune(int $now): void {
  $keep = [];
  foreach (array_keys(SB_O_SPORTS) as $sp) foreach (sb_o_days($now) as $d) foreach ((array) (sb_o_day($sp, $d)['fx'] ?? []) as $id => $r) $keep[$sp . '-' . $id] = 1;
  $lim = gmdate('Y-m-d', $now - 3 * 86400);
  foreach ((array) glob(sb_dir() . DIRECTORY_SEPARATOR . '*-day-*.json') as $p) if (preg_match('/([a-z]+)-day-(\d{4}-\d{2}-\d{2})\.json$/', (string) $p, $m) && isset(SB_O_SPORTS[$m[1]]) && $m[2] < $lim) @unlink((string) $p);
  foreach ((array) glob(sb_dir() . DIRECTORY_SEPARATOR . 'mk' . DIRECTORY_SEPARATOR . '*.json') as $p) if (preg_match('/([a-z]+)-(\d+)\.json$/', (string) $p, $m) && isset(SB_O_SPORTS[$m[1]]) && !isset($keep[$m[1] . '-' . $m[2]]) && filemtime((string) $p) < $now - 86400) @unlink((string) $p);
}
