<?php
declare(strict_types=1);
/**
 * 2026-10-23 (propriétaire) — NOTIFICATIONS AUTOMATIQUES : 2 petites notifications par jour à TOUS les abonnés
 * (appareils de l'admin compris : le jour où elles n'arrivent plus, quelque chose est cassé).
 *
 *  - Créneaux (UTC) : 12:00 et 19:30 (Côte d'Ivoire 12:00 / 19:30, Mexique-Colombie 6-7 h / 13:30-14:30, Népal 17:45 / 01:15).
 *    Un créneau en retard de plus de 3 h (aucune visite) est sauté : jamais une vieille notification la nuit.
 *  - Contenu tiré des VRAIES données du site, jamais inventé : Paris (data/sports/sb : matchs du jour, direct, grand
 *    match, cote qui bouge) ou Trade (data/feed : indice qui monte / baisse fort en 6 h, plusieurs heures dans le même
 *    sens). Thème alterné d'un créneau à l'autre et d'un jour à l'autre ; si un thème n'a pas de données, l'autre ;
 *    si aucun n'en a : rien n'est envoyé (créneau noté « pas de données »).
 *  - Langue de chaque appareil : fr, en, es, pt (sinon anglais, langue par défaut du site).
 *  - Déclenchement SANS cron : après la réponse des requêtes joueurs (api.php) et admin (admin.php). Coût sans travail :
 *    deux stat() (data/push/daily.next dont la date = heure du prochain créneau, data/push/daily_job.on pendant un envoi).
 *    Verrou non bloquant : un seul processus envoie ; le créneau est réservé une seule fois (jamais deux envois).
 *  - Envoi par paquets de 30 (une langue par paquet), au plus ~10 s de démarrage de paquets par requête (limite FPM 30 s) ;
 *    la suite part à la requête suivante. Position avancée AVANT chaque paquet : un appareil ne reçoit jamais deux fois.
 *  - Abonnés partis (404 / 410) effacés comme ailleurs (push_send_rows).
 * Fichiers : data/push/daily.json (réglage, créneaux, envoi en cours, dernier envoi), daily.next, daily_job.on, daily.lock.
 * Tests : php scripts/test-notif-daily.php (faux envoi, fausses données).
 */

const ND_SLOTS = [[12, 0], [19, 30]];   // heures UTC des 2 créneaux du jour
const ND_LATE = 10800;                    // créneau manqué de plus de 3 h : sauté
const ND_BATCH = 30;                      // appareils par paquet
const ND_BUDGET = 10.0;                   // secondes : plus de nouveau paquet après ce délai (FPM coupe à 30 s)
const ND_JOB_MAX = 10800;                 // un envoi pas fini 3 h après le créneau : abandonné (message périmé)
const ND_LANGS = ['fr', 'en', 'es', 'pt'];
const ND_MAX_PER_DAY = 2;

function nd_dir(): string { return push_dir(); }
function nd_state_file(): string { return nd_dir() . '/daily.json'; }
function nd_next_file(): string { return nd_dir() . '/daily.next'; }
function nd_job_marker(): string { return nd_dir() . '/daily_job.on'; }
function nd_now(): int { return (int) ($GLOBALS['ND_NOW'] ?? 0) ?: time(); }

function nd_state(): array {
  $j = json_decode((string) @file_get_contents(nd_state_file()), true);
  $j = is_array($j) ? $j : [];
  $j['on'] = array_key_exists('on', $j) ? (int) !empty($j['on']) : 1; // allumé par défaut
  foreach (['slots', 'kinds', 'odds'] as $k) $j[$k] = is_array($j[$k] ?? null) ? $j[$k] : [];
  return $j;
}
function nd_state_save(array $s): void {
  if (count($s['slots']) > 30) $s['slots'] = array_slice($s['slots'], -30, null, true);
  $f = nd_state_file();
  $tmp = $f . '.tmp' . bin2hex(random_bytes(3));
  if (@file_put_contents($tmp, json_encode($s, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)) !== false) @rename($tmp, $f);
}

/* ------------------------------------------------------------- créneaux --------------------------------------------- */

/** Créneaux [ts, clé, n° 0|1] du jour UTC de $day0 (minuit UTC). */
function nd_day_slots(int $day0): array {
  $o = [];
  foreach (ND_SLOTS as $i => [$h, $m]) $o[] = [$day0 + $h * 3600 + $m * 60, gmdate('Y-m-d', $day0) . '#' . ($i + 1), $i];
  return $o;
}
/** Prochain créneau strictement après $now. */
function nd_next_slot(int $now): array {
  $d0 = intdiv($now, 86400) * 86400;
  foreach ([$d0, $d0 + 86400] as $d) foreach (nd_day_slots($d) as $s) if ($s[0] > $now) return $s;
  return nd_day_slots($d0 + 86400)[0];
}
/** Créneaux passés (≤ $now) des dernières 24 h, du plus ancien au plus récent. */
function nd_past_slots(int $now): array {
  $d0 = intdiv($now, 86400) * 86400; $o = [];
  foreach ([$d0 - 86400, $d0] as $d) foreach (nd_day_slots($d) as $s) if ($s[0] <= $now && $s[0] > $now - 86400) $o[] = $s;
  return $o;
}
function nd_set_next(int $ts): void {
  $f = nd_next_file();
  @file_put_contents($f, (string) $ts);
  @touch($f, $ts); // la DATE du fichier = heure du prochain créneau (un simple stat() suffit pour savoir s'il est dû)
  clearstatcache(true, $f);
}

/** Quelque chose à faire ? (deux stat() au plus — appelé à la fin de chaque requête joueur). */
function nd_due(int $now): bool {
  if (is_file(nd_job_marker())) return true;
  $f = nd_next_file();
  clearstatcache(true, $f);
  if (!is_file($f)) return true;
  return (int) @filemtime($f) <= $now;
}

/** Fin des requêtes (api.php, admin.php) : rend la réponse d'abord, puis fait le travail. Jamais d'erreur visible. */
function nd_after_response(): void {
  static $done = false;
  if ($done) return;
  $done = true;
  try {
    $now = nd_now();
    if (!nd_due($now)) return;
    if (PHP_SAPI === 'cli' && !isset($GLOBALS['ND_NOW'])) return; // ligne de commande (scripts de test d'api.php) : seulement si demandé
    if (PHP_SAPI !== 'cli') {
      if (!function_exists('fastcgi_finish_request')) return; // jamais faire attendre un joueur
      try { fastcgi_finish_request(); } catch (Throwable $e) { /* déjà fait */ }
    }
    @ignore_user_abort(true);
    nd_tick($now);
  } catch (Throwable $e) { /* jamais bloquant */ }
}

/**
 * Un passage (sous verrou NON bloquant) : continue l'envoi en cours, ou réserve le créneau dû et commence l'envoi.
 * Retour : ce qui a été fait (pour les tests).
 */
function nd_tick(int $now, ?float $budget = null): array {
  $lk = @fopen(nd_dir() . '/daily.lock', 'c');
  if (!$lk || !flock($lk, LOCK_EX | LOCK_NB)) { if ($lk) fclose($lk); return ['busy' => true]; }
  $out = ['claimed' => null, 'batches' => 0];
  try {
    $s = nd_state();
    if (empty($s['job'])) {
      foreach (nd_past_slots($now) as [$ts, $key, $no]) {
        if (isset($s['slots'][$key])) continue;
        if ($now - $ts > ND_LATE) { $s['slots'][$key] = ['st' => 'late', 'at' => $now]; continue; }
        if (!$s['on']) { $s['slots'][$key] = ['st' => 'off', 'at' => $now]; continue; }
        $day = substr($key, 0, 10); $n = 0;
        foreach ($s['slots'] as $k2 => $v2) if (substr((string) $k2, 0, 10) === $day && ($v2['st'] ?? '') === 'sent') $n++;
        if ($n >= ND_MAX_PER_DAY) { $s['slots'][$key] = ['st' => 'cap', 'at' => $now]; continue; }
        $msg = nd_build($now, $ts, $no, $s, true);
        if (!$msg) { $s['slots'][$key] = ['st' => 'nodata', 'at' => $now]; continue; }
        // réservé AVANT tout envoi : ce créneau ne partira jamais une 2e fois
        $s['slots'][$key] = ['st' => 'sent', 'at' => $now, 'theme' => $msg['theme'], 'kind' => $msg['kind'], 't' => $msg['msgs']['fr'][0], 'b' => $msg['msgs']['fr'][1]];
        $s['kinds'][] = $msg['kind']; $s['kinds'] = array_slice($s['kinds'], -6);
        $s['job'] = ['key' => $key, 'ts' => $ts, 'url' => $msg['url'], 'msgs' => $msg['msgs'], 'langs' => ND_LANGS, 'li' => 0, 'cur' => '',
          'sent' => 0, 'fail' => 0, 'gone' => 0, 'devices' => 0, 'err' => ''];
        $s['last'] = ['key' => $key, 'at' => $now, 'theme' => $msg['theme'], 'kind' => $msg['kind'], 't' => $msg['msgs']['fr'][0], 'b' => $msg['msgs']['fr'][1],
          'sent' => 0, 'fail' => 0, 'gone' => 0, 'devices' => 0, 'done' => false, 'err' => ''];
        $out['claimed'] = $key;
        break; // un seul créneau à la fois (l'autre, s'il y en a un, au passage suivant)
      }
      nd_state_save($s);
    }
    if (!empty($s['job'])) {
      @touch(nd_job_marker());
      $t0 = microtime(true);
      $budget = $budget ?? ND_BUDGET;
      do { // au moins un paquet par passage ; un nouveau paquet seulement avant ND_BUDGET secondes
        if ($now - (int) $s['job']['ts'] > ND_JOB_MAX) { $s['job']['err'] = 'abandonné (trop tard)'; nd_job_finish($s); break; }
        if (!nd_job_step($s)) { nd_job_finish($s); break; }
        $out['batches']++;
      } while (!empty($s['job']) && microtime(true) - $t0 < $budget);
      nd_state_save($s);
      if (empty($s['job'])) @unlink(nd_job_marker());
    }
    nd_set_next(nd_next_slot($now)[0]);
  } finally { flock($lk, LOCK_UN); fclose($lk); }
  return $out;
}

/** Langue de notification d'un appareil. */
function nd_lang(string $l): string { return in_array($l, ND_LANGS, true) ? $l : 'en'; }

/** Un paquet (une langue). Position enregistrée AVANT l'envoi. Retour : reste-t-il des appareils ? */
function nd_job_step(array &$s): bool {
  $j = &$s['job'];
  $langs = (array) $j['langs'];
  while ((int) $j['li'] < count($langs)) {
    $lang = (string) $langs[(int) $j['li']];
    $rows = []; $last = (string) $j['cur'];
    foreach (push_sub_files() as $f) {
      $name = basename($f, '.json');
      if ($j['cur'] !== '' && strcmp($name, (string) $j['cur']) <= 0) continue;
      $r = json_decode((string) @file_get_contents($f), true);
      if (!is_array($r) || nd_lang((string) ($r['lang'] ?? '')) !== $lang) continue;
      $rows[] = $r; $last = $name;
      if (count($rows) >= ND_BATCH) break;
    }
    if (!$rows) { $j['li'] = (int) $j['li'] + 1; $j['cur'] = ''; continue; }
    $j['cur'] = $last;
    nd_state_save($s); // position gardée AVANT l'envoi (arrêt brutal : ces appareils ne recevront pas deux fois)
    [$t, $b] = $j['msgs'][$lang] ?? $j['msgs']['en'];
    $res = push_send_rows($rows, push_payload($t, $b, (string) $j['url']));
    $j['devices'] += count($rows);
    foreach (['sent', 'gone', 'fail'] as $k) $j[$k] += (int) ($res[$k] ?? 0);
    if (!empty($res['err']) && $j['err'] === '') $j['err'] = (string) $res['err'];
    foreach (['sent', 'gone', 'fail', 'devices', 'err'] as $k) $s['last'][$k] = $j[$k];
    return true;
  }
  return false;
}
function nd_job_finish(array &$s): void {
  if (!empty($s['job'])) {
    foreach (['sent', 'gone', 'fail', 'devices', 'err'] as $k) $s['last'][$k] = $s['job'][$k];
    $s['last']['done'] = true; $s['last']['end'] = nd_now();
    $key = (string) $s['job']['key'];
    if (isset($s['slots'][$key])) foreach (['sent', 'fail', 'gone'] as $k) $s['slots'][$key][$k] = $s['job'][$k];
  }
  $s['job'] = null;
}

/* ------------------------------------------------------------- données (lecture seule) -------------------------------- */

function nd_load_sb(): void {
  if (!function_exists('sb_day') && is_file(__DIR__ . '/sports_lib.php')) { try { require_once __DIR__ . '/sports_lib.php'; } catch (Throwable $e) { /* pas de Paris */ } }
}
/** Réglages Paris (null : pas de Paris sur ce serveur). Tests : $GLOBALS['ND_FAKE_SB'] = ['cfg' => …, 'days' => [J => …], 'live' => …]. */
function nd_sb_cfg(): ?array {
  if (isset($GLOBALS['ND_FAKE_SB'])) return is_array($GLOBALS['ND_FAKE_SB']['cfg'] ?? null) ? $GLOBALS['ND_FAKE_SB']['cfg'] : null;
  nd_load_sb();
  if (!function_exists('sb_config')) return null;
  try { return sb_config(); } catch (Throwable $e) { return null; }
}
function nd_sb_day(string $d): array {
  if (isset($GLOBALS['ND_FAKE_SB'])) return (array) ($GLOBALS['ND_FAKE_SB']['days'][$d] ?? []);
  return function_exists('sb_day') ? sb_day($d) : [];
}
function nd_sb_live(): array {
  if (isset($GLOBALS['ND_FAKE_SB'])) return (array) ($GLOBALS['ND_FAKE_SB']['live'] ?? []);
  return function_exists('sb_live_data') ? sb_live_data() : [];
}
const ND_LIVE_ST = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE'];
const ND_BIG_P = 8; // Ligue des champions, Angleterre, Espagne, Italie, Allemagne, France, Ligue Europa, Conference League

/** Candidats Paris (du plus fort au plus faible). Chaque candidat : kind + données réelles. */
function nd_paris_candidates(int $now, array &$snap): array {
  $cfg = nd_sb_cfg();
  if (!$cfg || empty($cfg['public'])) return [];
  $rows = []; $lgs = [];
  foreach ([gmdate('Y-m-d', $now), gmdate('Y-m-d', $now + 86400)] as $d) {
    $day = nd_sb_day($d);
    if ((int) ($day['at'] ?? 0) < $now - 6 * 3600) continue; // index trop vieux : on ne s'en sert pas
    foreach ((array) ($day['fx'] ?? []) as $id => $r) if (is_array($r)) $rows[(string) $id] = $r;
    foreach ((array) ($day['lg'] ?? []) as $id => $l) if (is_array($l)) $lgs[(string) $id] = $l;
  }
  $odds = static function (array $r) use ($now): ?array {
    if ((int) ($r['oat'] ?? 0) < $now - 28800) return null; // cotes de plus de 8 h : plus jouables sur le site, jamais montrées
    $o = [];
    foreach ((array) ($r['o'] ?? []) as $p) if (is_array($p) && isset($p[0], $p[1]) && is_numeric($p[1])) $o[(string) $p[0]] = (float) $p[1];
    return isset($o['H'], $o['D'], $o['A']) ? $o : null;
  };
  $prio = static fn(array $r): int => (int) ($lgs[(string) ($r['lg'] ?? '')]['p'] ?? 100);
  $c = [];
  // 1) en direct maintenant (même règle de visibilité que le site : grands championnats seulement si liveAll est éteint)
  if (!empty($cfg['live']) && !empty($cfg['livePublic'])) {
    $big = defined('SB_LIVE_BIG') ? SB_LIVE_BIG : [];
    $vis = static fn(array $r): bool => !empty($cfg['liveAll']) || !$big || in_array((int) ($r['lg'] ?? 0), $big, true);
    $live = nd_sb_live(); $n = null;
    if ((int) ($live['fat'] ?? 0) >= $now - 300) {
      $n = 0; foreach ((array) ($live['fx'] ?? []) as $r) if (is_array($r) && in_array((string) ($r['st'] ?? ''), ND_LIVE_ST, true) && $vis($r)) $n++;
    } else {
      $fresh = (int) (nd_sb_day(gmdate('Y-m-d', $now))['at'] ?? 0) >= $now - 900;
      if ($fresh) { $n = 0; foreach ($rows as $r) if (in_array((string) ($r['st'] ?? ''), ND_LIVE_ST, true) && (int) ($r['ts'] ?? 0) > $now - 4 * 3600 && $vis($r)) $n++; }
    }
    if ($n !== null && $n >= 3) $c[] = ['kind' => 'live', 'n' => $n];
  }
  // 2) grand match à venir (dans 30 min … 12 h), avec ses cotes
  $best = null;
  foreach ($rows as $id => $r) {
    $ts = (int) ($r['ts'] ?? 0);
    if (!in_array((string) ($r['st'] ?? ''), ['NS', 'TBD'], true) || $ts < $now + 1800 || $ts > $now + 12 * 3600) continue;
    $o = $odds($r); $p = $prio($r);
    if (!$o || $p > ND_BIG_P || (string) ($r['h'][1] ?? '') === '' || (string) ($r['a'][1] ?? '') === '') continue;
    if ($best === null || [$p, $ts] < [$best['p'], $best['ts']]) $best = ['kind' => 'big', 'p' => $p, 'ts' => $ts, 'in' => $ts - $now, 'h' => (string) $r['h'][1], 'a' => (string) $r['a'][1], 'o' => $o];
  }
  if ($best) $c[] = $best;
  // 3) cote qui a bougé depuis le dernier créneau (photo des cotes gardée à chaque créneau réservé)
  $mv = null; $newSnap = [];
  foreach ($rows as $id => $r) {
    $ts = (int) ($r['ts'] ?? 0); $o = $odds($r);
    if (!$o || !in_array((string) ($r['st'] ?? ''), ['NS', 'TBD'], true) || $ts < $now + 1800 || $ts > $now + 36 * 3600 || $prio($r) > 20) continue;
    $newSnap[$id] = ['H' => $o['H'], 'A' => $o['A'], 'at' => $now];
    $old = $snap[$id] ?? null;
    if (!is_array($old) || (int) ($old['at'] ?? 0) < $now - 30 * 3600 || (int) ($r['oat'] ?? 0) <= (int) $old['at']) continue;
    foreach (['H' => 'h', 'A' => 'a'] as $k => $side) {
      $from = (float) ($old[$k] ?? 0); $to = $o[$k];
      if ($from < 1.01 || $to < 1.01) continue;
      $ch = abs($to / $from - 1);
      if ($ch >= 0.12 && ($mv === null || $ch > $mv['ch'])) $mv = ['kind' => 'odds', 'ch' => $ch, 'team' => (string) ($r[$side][1] ?? ''), 'h' => (string) ($r['h'][1] ?? ''), 'a' => (string) ($r['a'][1] ?? ''), 'from' => $from, 'to' => $to];
    }
  }
  if ($mv && $mv['team'] !== '') $c[] = $mv;
  if ($newSnap) $snap = array_slice($newSnap, 0, 300, true);
  // 4) nombre de matchs à parier dans les 12 prochaines heures
  $n = 0;
  foreach ($rows as $r) { $ts = (int) ($r['ts'] ?? 0); if (in_array((string) ($r['st'] ?? ''), ['NS', 'TBD'], true) && $ts > $now && $ts <= $now + 12 * 3600 && $odds($r)) $n++; }
  if ($n >= 5) $c[] = ['kind' => 'count', 'n' => $n];
  return $c;
}

/** Mouvements des indices de trading. Tests : $GLOBALS['ND_FAKE_TRADE'] = [['id','name','pct','streak'], …]. */
function nd_trade_data(int $now): array {
  if (isset($GLOBALS['ND_FAKE_TRADE'])) return (array) $GLOBALS['ND_FAKE_TRADE'];
  if (!function_exists('orolado_feed_assets') && is_file(__DIR__ . '/feed_lib.php')) { try { require_once __DIR__ . '/feed_lib.php'; } catch (Throwable $e) { return []; } }
  if (!function_exists('orolado_feed_state_read') || !function_exists('orolado_feed_read')) return [];
  $out = [];
  $hour = intdiv(3600 * 1000, OROLADO_TICK_MS);
  $nowTick = intdiv($now * 1000, OROLADO_TICK_MS);
  foreach (array_keys(orolado_feed_assets()) as $id) {
    $st = orolado_feed_state_read($id); // lecture seule : on ne fait jamais avancer la courbe ici
    if (!$st || $nowTick - $st['n'] > 2400 || $st['c'] <= 0) continue; // courbe pas à jour (plus de 10 min) : ignorée
    $px = [(int) $st['c']];
    for ($k = 1; $k <= 10; $k++) { $v = orolado_feed_read($id, $st['n'] - $k * $hour, $st['n'] - $k * $hour)[0] ?? 0; if ($v <= 0) break; $px[] = (int) $v; }
    if (count($px) < 7) continue;
    $pct = ($px[0] / $px[6] - 1) * 100;
    $streak = 0; $dir = 0;
    for ($k = 0; $k + 1 < count($px); $k++) {
      $d = $px[$k] <=> $px[$k + 1];
      if ($d === 0 || ($dir !== 0 && $d !== $dir)) break;
      $dir = $d; $streak++;
    }
    $name = orolado_feed_asset_name($id);
    if ($name !== '') $out[] = ['id' => $id, 'name' => $name, 'pct' => $pct, 'streak' => $dir * $streak];
  }
  return $out;
}
function nd_trade_candidates(int $now): array {
  $c = []; $mv = null; $sk = null;
  foreach (nd_trade_data($now) as $a) {
    $pct = (float) ($a['pct'] ?? 0); $str = (int) ($a['streak'] ?? 0);
    if (abs($pct) >= 2.0 && ($mv === null || abs($pct) > abs($mv['pct']))) $mv = ['kind' => 'move', 'name' => (string) $a['name'], 'pct' => $pct, 'id' => (string) ($a['id'] ?? '')];
    if (abs($str) >= 5 && ($sk === null || abs($str) > abs($sk['n']))) $sk = ['kind' => 'streak', 'name' => (string) $a['name'], 'n' => $str, 'id' => (string) ($a['id'] ?? '')];
  }
  if ($mv) $c[] = $mv;
  if ($sk) $c[] = $sk;
  return $c;
}

/* ------------------------------------------------------------- textes ----------------------------------------------- */

function nd_num(float $v, int $dec, string $l): string { return number_format($v, $dec, $l === 'en' ? '.' : ',', $l === 'en' ? ',' : ' '); }
function nd_odd(float $v, string $l): string { return nd_num($v, 2, $l); }
function nd_dur(int $s): string { $m = (int) round($s / 60); return $m < 60 ? $m . ' min' : intdiv($m, 60) . ' h' . ($m % 60 ? ' ' . str_pad((string) ($m % 60), 2, '0', STR_PAD_LEFT) : ''); }
function nd_pct(float $p, string $l): string {
  $s = ($p >= 0 ? '+' : '−') . nd_num(abs($p), 1, $l);
  return $l === 'fr' || $l === 'es' ? $s . "\u{202F}%" : $s . '%';
}

/** [titre, message] d'un candidat dans une langue. */
function nd_text(array $c, string $l): array {
  $l = nd_lang($l);
  $T = [
    'live' => ['fr' => ['🔴 %d matchs en direct', 'Pariez maintenant : les cotes bougent à chaque minute.'], 'en' => ['🔴 %d matches live now', 'Bet now — the odds move every minute.'],
      'es' => ['🔴 %d partidos en vivo', 'Apuesta ya: las cuotas cambian cada minuto.'], 'pt' => ['🔴 %d jogos ao vivo', 'Aposte agora: as odds mudam a cada minuto.']],
    'count' => ['fr' => ['⚽ %d matchs à parier', 'Coups d’envoi dans les 12 prochaines heures. Faites votre coupon !'], 'en' => ['⚽ %d matches to bet on', 'Kick-offs in the next 12 hours. Build your bet slip!'],
      'es' => ['⚽ %d partidos para apostar', 'Comienzan en las próximas 12 horas. ¡Arma tu cupón!'], 'pt' => ['⚽ %d jogos para apostar', 'Começam nas próximas 12 horas. Monte seu bilhete!']],
    'big' => ['fr' => 'Coup d’envoi dans %s · 1 : %s · X : %s · 2 : %s', 'en' => 'Kick-off in %s · 1: %s · X: %s · 2: %s', 'es' => 'Comienza en %s · 1: %s · X: %s · 2: %s', 'pt' => 'Começa em %s · 1: %s · X: %s · 2: %s'],
    'odds' => ['fr' => ['📊 Cote en mouvement', '%s – %s : %s passe de %s à %s.'], 'en' => ['📊 Odds on the move', '%s – %s: %s from %s to %s.'],
      'es' => ['📊 Cuota en movimiento', '%s – %s: %s pasa de %s a %s.'], 'pt' => ['📊 Odd em movimento', '%s – %s: %s passou de %s para %s.']],
    'move' => ['fr' => ['%s %s %s en 6 h', 'Le marché bouge fort. Venez trader !'], 'en' => ['%s %s %s in 6 h', 'The market is moving. Come and trade!'],
      'es' => ['%s %s %s en 6 h', 'El mercado se mueve. ¡Ven a operar!'], 'pt' => ['%s %s %s em 6 h', 'O mercado está se mexendo. Venha operar!']],
    'streakU' => ['fr' => '%s %s : %d heures de hausse d’affilée', 'en' => '%s %s: up %d hours in a row', 'es' => '%s %s: %d horas seguidas al alza', 'pt' => '%s %s: %d horas seguidas de alta'],
    'streakD' => ['fr' => '%s %s : %d heures de baisse d’affilée', 'en' => '%s %s: down %d hours in a row', 'es' => '%s %s: %d horas seguidas a la baja', 'pt' => '%s %s: %d horas seguidas de queda'],
    'streakB' => ['fr' => 'Et maintenant, hausse ou baisse ? À vous de jouer.', 'en' => 'Up or down next? Your call.', 'es' => '¿Y ahora, sube o baja? Tú decides.', 'pt' => 'E agora, sobe ou desce? Você decide.'],
  ];
  switch ($c['kind']) {
    case 'live': case 'count': [$t, $b] = $T[$c['kind']][$l]; return [sprintf($t, (int) $c['n']), $b];
    case 'big': return ['🔥 ' . $c['h'] . ' – ' . $c['a'], sprintf($T['big'][$l], nd_dur((int) $c['in']), nd_odd($c['o']['H'], $l), nd_odd($c['o']['D'], $l), nd_odd($c['o']['A'], $l))];
    case 'odds': [$t, $b] = $T['odds'][$l]; return [$t, sprintf($b, $c['h'], $c['a'], $c['team'], nd_odd($c['from'], $l), nd_odd($c['to'], $l))];
    case 'move': [$t, $b] = $T['move'][$l]; return [sprintf($t, $c['pct'] >= 0 ? '📈' : '📉', $c['name'], nd_pct((float) $c['pct'], $l)), $b];
    case 'streak': return [sprintf($T[$c['n'] > 0 ? 'streakU' : 'streakD'][$l], $c['n'] > 0 ? '📈' : '📉', $c['name'], abs((int) $c['n'])), $T['streakB'][$l]];
  }
  return ['', ''];
}

/**
 * Message d'un créneau : thème alterné (créneau et jour), autre thème si pas de données, null si rien de vrai à dire.
 * $commit = true : la photo des cotes est gardée dans $s (créneau réel) ; false : aperçu / test admin (rien n'est changé).
 */
function nd_build(int $now, int $slotTs, int $slotNo, array &$s, bool $commit): ?array {
  $prefer = ((intdiv($slotTs, 86400) + $slotNo) % 2 === 0) ? 'paris' : 'trade';
  $snap = (array) ($s['odds'] ?? []);
  $paris = null; $trade = null;
  $get = static function (string $th) use ($now, &$snap, &$paris, &$trade): array {
    if ($th === 'paris') return $paris ??= nd_paris_candidates($now, $snap);
    return $trade ??= nd_trade_candidates($now);
  };
  $recent = array_slice((array) ($s['kinds'] ?? []), -3);
  $pick = null; $theme = '';
  foreach ([$prefer, $prefer === 'paris' ? 'trade' : 'paris'] as $th) {
    $cands = $get($th);
    if (!$cands) continue;
    // le plus fort qui n'a pas servi récemment (sinon le plus fort) : de la variété, toujours du vrai
    foreach ($cands as $c) if (!in_array($c['kind'], $recent, true)) { $pick = $c; break; }
    $pick = $pick ?? $cands[0];
    $theme = $th;
    break;
  }
  if ($paris === null) $get('paris'); // photo des cotes prise à chaque créneau (pour « cote en mouvement » au suivant)
  if ($commit) $s['odds'] = $snap;
  if (!$pick) return null;
  $msgs = [];
  foreach (ND_LANGS as $l) $msgs[$l] = nd_text($pick, $l);
  return ['theme' => $theme, 'kind' => $pick['kind'], 'url' => $theme === 'paris' ? '/?paris=1' : '/?trade=1', 'msgs' => $msgs];
}

/* ------------------------------------------------------------- admin ------------------------------------------------ */

function nd_set_on(bool $on): array {
  $lk = @fopen(nd_dir() . '/daily.lock', 'c');
  if ($lk) flock($lk, LOCK_EX);
  try { $s = nd_state(); $s['on'] = $on ? 1 : 0; nd_state_save($s); }
  finally { if ($lk) { flock($lk, LOCK_UN); fclose($lk); } }
  return nd_info();
}

function nd_info(): array {
  $now = nd_now(); $s = nd_state(); $nx = nd_next_slot($now);
  $hist = [];
  foreach (array_reverse($s['slots'], true) as $k => $v) { $hist[] = ['key' => (string) $k] + (array) $v; if (count($hist) >= 6) break; }
  return ['ok' => true, 'on' => (bool) $s['on'], 'next' => ['at' => $nx[0], 'key' => $nx[1]], 'slotsUtc' => array_map(static fn($x) => sprintf('%02d:%02d', $x[0], $x[1]), ND_SLOTS),
    'last' => $s['last'] ?? null, 'sending' => !empty($s['job']), 'hist' => $hist, 'test' => $s['test'] ?? null,
    'fpm' => function_exists('fastcgi_finish_request'), 'subs' => count(push_sub_files())];
}

/** Bouton « Envoyer maintenant à mes appareils (test) » : le message du PROCHAIN créneau, aux appareils admin seulement. */
function nd_test_admin(): array {
  $now = nd_now(); $s = nd_state(); [$ts, $key, $no] = nd_next_slot($now);
  $msg = nd_build($now, $ts, $no, $s, false);
  if (!$msg) return ['ok' => false, 'reason' => 'Pas de données réelles pour l’instant (ni Paris ni Trade) : rien à envoyer.'];
  $rows = push_admin_rows();
  $res = ['sent' => 0, 'gone' => 0, 'fail' => 0, 'devices' => count($rows)];
  $by = [];
  foreach ($rows as $r) $by[nd_lang((string) ($r['lang'] ?? ''))][] = $r;
  foreach ($by as $l => $rs) {
    [$t, $b] = $msg['msgs'][$l];
    $r = push_send_rows($rs, push_payload($t, $b, $msg['url']));
    foreach (['sent', 'gone', 'fail'] as $k) $res[$k] += (int) ($r[$k] ?? 0);
    if (!empty($r['err']) && empty($res['err'])) $res['err'] = (string) $r['err'];
    if (!empty($r['codes'])) $res['codes'] = (array) ($res['codes'] ?? []) + (array) $r['codes'];
  }
  $lk = @fopen(nd_dir() . '/daily.lock', 'c');
  if ($lk) flock($lk, LOCK_EX);
  try { $s2 = nd_state(); $s2['test'] = ['at' => $now, 't' => $msg['msgs']['fr'][0], 'b' => $msg['msgs']['fr'][1], 'sent' => $res['sent'], 'devices' => $res['devices']]; nd_state_save($s2); }
  finally { if ($lk) { flock($lk, LOCK_UN); fclose($lk); } }
  return ['ok' => $res['sent'] > 0, 'theme' => $msg['theme'], 'kind' => $msg['kind'], 'title' => $msg['msgs']['fr'][0], 'body' => $msg['msgs']['fr'][1], 'url' => $msg['url'],
    'res' => $res, 'why' => push_why($res)];
}
