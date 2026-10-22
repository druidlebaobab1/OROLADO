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
 *    complémentaires normalisé (seulement si sa somme ≥ attendu : toujours SÛR), marge du réglage, JAMAIS au-dessus de
 *    (moyenne − 0,01), jamais sous 1,01 (choix retiré).
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
const SB_FX_ODDS_TTL = 10800;        // /odds?fixture à la demande : cotes de plus de 3 h
const SB_LIVE_IDS_TTL = 60;          // /fixtures?live=all gardé 60 s (contrôle des paris à moins de 30 min du début)
const SB_LATE = 1800;                // à moins de 30 min du coup d'envoi : contrôle « déjà commencé ? »
const SB_PST_VOID = 172800;          // reporté / pas joué dans les 48 h : annulé
const SB_FINAL = ['FT', 'AET', 'PEN'];
const SB_VOID_ST = ['AWD', 'WO'];
const SB_WAIT_ST = ['PST', 'CANC', 'ABD', 'SUSP', 'INT', 'NS', 'TBD'];
const SB_LIVE_ST = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE'];
const SB_CFG_DEFAULT = ['public' => false, 'live' => true, 'livePublic' => false, 'autosettle' => true, 'sports' => ['foot'],
  'mMain' => 15, 'mSide' => 20, 'mExotic' => 30, 'mLive' => 20, 'mOther' => 15, 'alertStake' => 50, 'alertPot' => 500, 'alertWin' => 200];
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
  $out = SB_CFG_DEFAULT;
  foreach ($out as $k => $v) if (array_key_exists($k, $c)) $out[$k] = is_bool($v) ? (bool) $c[$k] : (is_array($v) ? (array) $c[$k] : (float) $c[$k]);
  return $out;
}
/** Admin : enregistre les réglages (seulement les champs connus, bornés). */
function sb_config_save(array $in): array {
  $cur = sb_config();
  foreach (['public', 'live', 'livePublic', 'autosettle'] as $k) if (array_key_exists($k, $in)) $cur[$k] = (bool) $in[$k];
  foreach (['mMain', 'mSide', 'mExotic', 'mLive', 'mOther'] as $k) if (isset($in[$k]) && is_numeric($in[$k])) $cur[$k] = round(max(2.0, min(40.0, (float) $in[$k])), 1);
  foreach (['alertStake', 'alertPot', 'alertWin'] as $k) if (isset($in[$k]) && is_numeric($in[$k])) $cur[$k] = round(max(0.0, min(1000000.0, (float) $in[$k])), 2);
  sb_with('config.json', static function (array &$s) use ($cur) { $s = $cur; return true; });
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

function sb_budget_take(int $now): bool {
  $day = gmdate('Y-m-d', $now);
  return (bool) sb_with('budget-foot.json', static function (array &$s) use ($day) {
    if (($s['day'] ?? '') !== $day) { $s['day'] = $day; $s['n'] = 0; $s['warned'] = 0; }
    if ((int) $s['n'] >= SB_FOOT_CAP) return false;
    $s['n'] = (int) $s['n'] + 1;
    return true;
  });
}
function sb_budget(int $now = 0): array {
  $now = $now ?: sb_now();
  $b = sb_read('budget-foot.json');
  $used = ($b['day'] ?? '') === gmdate('Y-m-d', $now) ? (int) ($b['n'] ?? 0) : 0;
  return ['used' => $used, 'cap' => SB_FOOT_CAP, 'left' => max(0, SB_FOOT_CAP - $used), 'rem' => $b['rem'] ?? null];
}
/** Une lecture (chemin relatif). Null = pas de clé, budget épuisé, réseau ou erreur API (gardée pour l'admin). */
function sb_get(string $path, int $now = 0): ?array {
  $now = $now ?: sb_now();
  $fake = sb_fake();
  $key = sb_env('APIFOOTBALL_KEY');
  if ($key === '' && !$fake) { sb_note_error('Clé APIFOOTBALL_KEY absente', $now); return null; }
  if (!sb_budget_take($now)) { sb_note_error('Budget du jour atteint (' . SB_FOOT_CAP . ' lectures) : reprise à 0 h UTC', $now); return null; }
  $b = sb_budget($now);
  if ($b['left'] < 300) sb_with('budget-foot.json', static function (array &$s) use ($now) {
    if (!empty($s['warned'])) return false;
    $s['warned'] = 1; sb_alert('⚠️ Paris : budget API presque épuisé', 'Moins de 300 lectures API-Football aujourd\'hui.', $now); return true;
  });
  $rem = null;
  if ($fake) $raw = (string) $fake($path);
  else {
    $ctx = stream_context_create(['http' => ['method' => 'GET', 'timeout' => 15, 'ignore_errors' => true,
      'header' => "x-apisports-key: " . $key . "\r\nAccept: application/json\r\nUser-Agent: OROLADO\r\n"], 'ssl' => ['verify_peer' => true]]);
    $raw = @file_get_contents(SB_FOOT_BASE . $path, false, $ctx, 0, 30000001);
    $raw = is_string($raw) && strlen($raw) <= 30000000 ? $raw : '';
    foreach ((array) ($http_response_header ?? []) as $h) if (preg_match('/^x-ratelimit-requests-remaining:\s*(\d+)/i', (string) $h, $m)) $rem = (int) $m[1];
  }
  $j = json_decode($raw, true);
  if (!is_array($j)) { sb_note_error('Réponse illisible ou réseau (' . preg_replace('/\?.*$/', '', $path) . ')', $now); return null; }
  if ($rem !== null) sb_with('budget-foot.json', static function (array &$s) use ($rem) { $s['rem'] = $rem; return true; });
  $err = $j['errors'] ?? [];
  if (!empty($err)) { sb_note_error('API-Football : ' . (is_array($err) ? implode(' · ', array_map(static fn($v) => is_scalar($v) ? (string) $v : (string) json_encode($v), $err)) : (string) $err), $now); return null; }
  return $j;
}
function sb_get_cached(string $path, int $ttl, int $now = 0): ?array {
  $now = $now ?: sb_now();
  $d = sb_dir() . DIRECTORY_SEPARATOR . 'cache';
  if (!is_dir($d)) @mkdir($d, 0750, true);
  $f = $d . DIRECTORY_SEPARATOR . substr(hash('sha256', $path), 0, 24) . '.json';
  clearstatcache(true, $f);
  if ($ttl > 0 && is_file($f) && filemtime($f) > $now - $ttl) { $j = json_decode((string) @file_get_contents($f), true); if (is_array($j)) return $j; }
  $j = sb_get($path, $now);
  if ($j !== null) { @file_put_contents($f, json_encode($j, JSON_UNESCAPED_UNICODE), LOCK_EX); @touch($f, $now); }
  return $j;
}

/* ------------------------------------------------------------- marchés : lecture des cotes -------------------------- */

/** Famille d'un mk (« ou:2.5 » → « ou »). */
function sb_fam(string $mk): string { $p = strpos($mk, ':'); return $p === false ? $mk : substr($mk, 0, $p); }
/** Nombre de choix d'un groupe complet (null = ouvert : score exact). */
function sb_group_size(string $fam): ?int {
  static $n = ['1x2' => 3, 'dc' => 3, 'dnb' => 2, 'ou' => 2, 'btts' => 2, 'tth' => 2, 'tta' => 2, 'oe' => 2, 'csh' => 2, 'csa' => 2, 'wnh' => 2, 'wna' => 2,
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
  return max(0.02, min(0.4, (float) $m / 100));
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
const SB_FAM_ORDER = ['1x2', 'dc', 'dnb', 'ou', 'btts', 'tth', 'tta', 'oe', 'csh', 'csa', 'wnh', 'wna', 'eh', 'ah', 'ht1x2', 'htdc', 'htou', 'httth', 'httta', 'htbtts', 'htoe', 'htah',
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
      $o = min($o, floor(($a - 0.01) * 100 + 1e-6) / 100); // TOUJOURS au moins 0,01 sous la moyenne
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
    case 'dnb': case 'ah': case 'htah': return ['H', 'A'];
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
    if ($betAt >= $ts) return 'void'; // pari posé après le vrai coup d'envoi
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
function sb_days(int $now): array { return [gmdate('Y-m-d', $now - 86400), gmdate('Y-m-d', $now), gmdate('Y-m-d', $now + 86400), gmdate('Y-m-d', $now + 172800)]; }

/* ------------------------------------------------------------- tâche de fond ---------------------------------------- */

/**
 * Un passage (au plus $max lectures) : index des jours (J 10 min, J+1 60 min, J+2 3 h, J-1 30 min tant que pas tout fini),
 * cotes par pages (J toutes les 2 h, J+1 / J+2 toutes les 3 h ; reprise à la page suivante au passage d'après), résultats.
 */
function sb_job_tick(int $now, int $max = SB_JOB_CALLS): array {
  $calls = 0; $log = [];
  [$dm1, $d0, $d1, $d2] = sb_days($now);
  $st = sb_state();
  $fxEvery = [$d0 => 600, $d1 => 3600, $d2 => 10800, $dm1 => 1800];
  foreach ([$d0, $dm1, $d1, $d2] as $day) {
    if ($calls >= $max) break;
    $idx = sb_day($day);
    $age = $now - (int) ($idx['at'] ?? 0);
    if ($age < $fxEvery[$day]) continue;
    if ($day === $dm1 && $idx && !array_filter((array) ($idx['fx'] ?? []), static fn($r) => !in_array($r['st'] ?? '', array_merge(SB_FINAL, SB_VOID_ST, ['CANC', 'PST', 'ABD']), true))) continue;
    $calls++;
    $log[] = 'fx ' . $day . (sb_import_fixtures($day, $now) ? '' : ' ✗');
  }
  $oddsEvery = [$d0 => 7200, $d1 => 10800, $d2 => 10800];
  $pages = 0;
  foreach ([$d0, $d1, $d2] as $day) {
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
  foreach ((array) glob(sb_dir() . DIRECTORY_SEPARATOR . 'foot-day-*.json') as $p) if (preg_match('/(\d{4}-\d{2}-\d{2})\.json$/', (string) $p, $m) && $m[1] < gmdate('Y-m-d', $now - 3 * 86400)) @unlink((string) $p);
  foreach ((array) glob(sb_dir() . DIRECTORY_SEPARATOR . 'mk' . DIRECTORY_SEPARATOR . 'foot-*.json') as $p) if (preg_match('/foot-(\d+)\.json$/', (string) $p, $m) && !isset($keep[$m[1]]) && filemtime((string) $p) < $now - 86400) @unlink((string) $p);
  foreach ((array) glob(sb_dir() . DIRECTORY_SEPARATOR . 'cache' . DIRECTORY_SEPARATOR . '*.json') as $p) if (filemtime((string) $p) < $now - 86400) @unlink((string) $p);
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
    try { sb_maybe_run(); } catch (Throwable $e) { /* jamais bloquant */ }
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
  $need = []; $upd = []; $calls = 0;
  foreach ($open as $id => $o) {
    $k = $known[$id] ?? null;
    if (is_array($k) && in_array($k['v'] ?? '', ['fin', 'void'], true)) continue; // déjà connu (le règlement suit)
    if (is_array($k) && !empty($k['man'])) continue;
    if ($o['ko'] > $now) continue; // pas encore commencé
    if (isset($idx[$id])) $upd[$id] = sb_classify($idx[$id], $o['ti'], $o['ko'], $now);
    else $need[] = $id;
  }
  foreach (array_chunk($need, 20) as $chunk) {
    if ($calls >= max(0, $maxCalls)) break;
    $calls++;
    $j = sb_get_cached('fixtures?ids=' . implode('-', $chunk) . '&timezone=UTC', 1800, $now);
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
  return $out;
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
    case '1x2': case 'eh': case 'ht1x2': case '2h1x2': case 'dnb': case 'ah': case 'htah': return $one($k);
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
  return in_array((string) ($r['st'] ?? ''), ['NS', 'TBD'], true) && (int) ($r['ts'] ?? 0) > $now && (int) ($r['n'] ?? 0) > 0 && (int) ($r['oat'] ?? 0) > $now - SB_ODDS_MAX_AGE;
}
/** sbList : day 0|1|2 = aujourd'hui / demain / après-demain dans le fuseau du joueur ($tz minutes à l'est d'UTC, ex. 345). */
function sb_list(?array $user, $day, int $tz = 0, int $now = 0): array {
  $now = $now ?: sb_now();
  if (!sb_visible($user)) return ['ok' => false, 'reason' => 'off'];
  $tz = max(-720, min(840, $tz)) * 60;
  if ($day === 'live') return ['ok' => true, 'at' => $now, 'sports' => [['s' => 'foot', 'n' => 'Football', 'live' => 0]], 'lg' => [], 'fx' => []]; // direct : étape suivante
  $d = max(0, min(2, (int) $day));
  $from = (int) (floor(($now + $tz) / 86400) * 86400) - $tz + $d * 86400; $to = $from + 86400;
  $fx = []; $lgs = []; $lgUsed = [];
  foreach (array_unique([gmdate('Y-m-d', $from), gmdate('Y-m-d', $to - 1)]) as $dd) {
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
  return ['ok' => true, 'at' => $now, 'sports' => [['s' => 'foot', 'n' => 'Football', 'live' => 0]], 'lg' => $lgs, 'fx' => $fx];
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
  if (!preg_match('/^foot:(\d+)$/', $fid, $m)) return ['ok' => false, 'reason' => 'param'];
  $f = sb_find($m[1], $now);
  if (!$f) return ['ok' => false, 'reason' => 'closed'];
  $mf = sb_mk_file($m[1]);
  $open = sb_bettable_row($f['row'], $now) && (int) ($mf['at'] ?? 0) > $now - SB_ODDS_MAX_AGE;
  if ((int) ($mf['at'] ?? 0) < $now - SB_FX_ODDS_TTL && (int) $f['row']['ts'] > $now) sb_want_fixture((int) $m[1], $now);
  $mk = [];
  if ($open) foreach ((array) ($mf['mk'] ?? []) as $k => $o) $mk[] = ['mk' => (string) $k, 'o' => $o, 's' => 0];
  $fx = sb_fx_public($m[1], $f['row']) + ['lgn' => (string) ($f['lg']['n'] ?? ''), 'c' => (string) ($f['lg']['c'] ?? '')];
  return ['ok' => true, 'fx' => $fx, 'mk' => $mk, 'rules' => sb_rules()];
}

/* ------------------------------------------------------------- pari (appelé par sp_bet) -------------------------- */

/** ids « en direct » (/fixtures?live=all, gardé 60 s) ; null = indisponible. */
function sb_live_ids(int $now): ?array {
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
  if (!preg_match('/^sb:foot:(\d+):([a-z0-9]+(?::-?\d+(?:\.\d+)?)?)$/', $ev, $m)) return ['ok' => false, 'reason' => 'param'];
  if (!sb_visible($user)) return ['ok' => false, 'reason' => 'closed'];
  [$id, $mk] = [$m[1], $m[2]];
  $f = sb_find($id, $now);
  if (!$f) return ['ok' => false, 'reason' => 'closed'];
  $row = $f['row'];
  $mf = sb_mk_file($id);
  if (!in_array((string) ($row['st'] ?? ''), ['NS', 'TBD'], true) || $now >= (int) $row['ts'] || (int) ($mf['at'] ?? 0) < $now - SB_ODDS_MAX_AGE) return ['ok' => false, 'reason' => 'closed'];
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
    'check' => sb_check_list($now), 'alerts' => array_slice((array) ($st['alerts'] ?? []), 0, 10)];
}
/** Diagnostic : /status (plan, lectures du jour) + paris inconnus vus dans les réponses. */
function sb_admin_diag(int $now = 0): array {
  $now = $now ?: sb_now();
  $j = sb_get('status', $now);
  $r = is_array($j) ? (array) ($j['response'] ?? []) : [];
  $st = sb_state();
  return ['ok' => true, 'status' => $j === null ? null : ['plan' => (string) ($r['subscription']['plan'] ?? ''), 'end' => (string) ($r['subscription']['end'] ?? ''), 'active' => (bool) ($r['subscription']['active'] ?? false),
    'cur' => (int) ($r['requests']['current'] ?? 0), 'max' => (int) ($r['requests']['limit_day'] ?? 0)], 'err' => (string) ($st['err'] ?? ''), 'errAt' => (int) ($st['errAt'] ?? 0),
    'unk' => (array) ($st['unk'] ?? []), 'budget' => sb_budget($now)];
}
/** Bouton « Importer maintenant » (admin) : un passage complet, sans attendre la minute. */
function sb_admin_import(int $now = 0): array {
  $now = $now ?: sb_now();
  if (!sb_has_key()) return ['ok' => false, 'reason' => 'Aucune clé API enregistrée'];
  $r = sb_job_tick($now, 60);
  foreach (sb_take_wanted() as $id) if (sb_import_fixture_odds($id, $now)) $r['calls']++;
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
const SB_CODE_MAX = 50;      // choix au plus (= SP_MAX_SEL)
function sb_code_dir(): string { $d = sb_dir() . DIRECTORY_SEPARATOR . 'codes'; if (!is_dir($d)) @mkdir($d, 0750, true); return $d; }
function sb_code_ok(string $c): bool { return (bool) preg_match('/^[' . SB_CODE_ABC . ']{6}$/', $c); }
/** Un choix (ev, k) → forme du coupon avec la cote ACTUELLE, ou ['skip' => 'closed'|'hidden'|'param']. */
function sb_sel_now(string $ev, string $k, ?array $user, int $now, ?array $manual): array {
  if (str_starts_with($ev, 'sb:')) {
    if (!preg_match('/^sb:foot:\d+:[a-z0-9]+(?::-?\d+(?:\.\d+)?)?$/', $ev) || !preg_match('/^[A-Za-z0-9:\/+]{1,8}$/', $k)) return ['skip' => 'param'];
    if (!sb_visible($user)) return ['skip' => 'hidden'];
    $p = sb_pick($ev, $k, $user, $now, false); // contrôle « déjà commencé ? » (API) refait au moment du pari
    if (empty($p['ok'])) return ['skip' => ($p['reason'] ?? '') === 'param' ? 'param' : 'closed'];
    $s = $p['sel'];
    return ['ev' => $ev, 'k' => $k, 'odd' => (float) $s['odd'], 't' => $s['t'], 'l' => $s['l'], 'mk' => $s['mk'], 'fx' => $s['fx'], 'ko' => $s['ko'], 'h' => $p['team']['h'], 'a' => $p['team']['a']];
  }
  $e = $manual[$ev] ?? null;
  if (!$e) return ['skip' => 'closed'];
  $close = function_exists('sp_close_at') ? sp_close_at($e) : (int) ($e['start'] ?? 0);
  if (($e['status'] ?? '') !== 'open' || !empty($e['hold']) || $now >= $close) return ['skip' => 'closed'];
  foreach ((array) ($e['opts'] ?? []) as $o) if ((string) ($o['k'] ?? '') === $k)
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
