<?php
declare(strict_types=1);
/**
 * v2690 — PARIS SPORTIFS MANUELS (propriétaire, 2026-10-16).
 *  - L'ADMIN crée les matchs (foot, basket, boxe…) avec SES cotes (serrées), une date de début, et une mise maximale
 *    cachée par coupon ; il peut fermer les paris, puis cliquer le résultat (ou annuler le match : mises rendues).
 *  - Le joueur fait un COUPON d'1 à 10 matchs différents (les cotes se multiplient), dès 0,10 $, en réel ou en démo.
 *  - Coupon gagné = toutes ses sélections gagnées (un match annulé compte ×1). Gain maximal caché par coupon.
 *  - Argent : mise retirée UNE fois (orolado_trade_debit), gain versé UNE fois (orolado_trade_credit_once), comme le casino.
 * Fichiers : data/sports/events.json, data/sports/bets.json (verrou de fichier).
 */

const SP_MIN = 0.10; // v2779 (propriétaire) : mise minimum 0,10 $ (retour comme avant)
const SP_MAX_SEL = 10;
const SP_MAX_WIN = 6000.0;        // v2779 (propriétaire) : gain maximal caché par coupon = 6 000 $ ; AUCUNE mise maximale
const SP_DEFAULT_MAX_STAKE = 50.0; // (plus utilisé depuis v2779 : pas de mise maximale ; gardé pour les anciens matchs)
const SP_MY_BETS = 300;            // v2779 : « Mes paris » montre les 300 derniers coupons

function sp_dir(): string { $d = rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'sports'; if (!is_dir($d)) @mkdir($d, 0750, true); return $d; }
function sp_with(string $name, callable $fn) {
  if (function_exists('casino_with')) return casino_with(sp_dir() . DIRECTORY_SEPARATOR . $name, $fn);
  $fp = @fopen(sp_dir() . DIRECTORY_SEPARATOR . $name, 'c+');
  if (!$fp) return null;
  flock($fp, LOCK_EX);
  $st = json_decode(stream_get_contents($fp) ?: '', true); if (!is_array($st)) $st = [];
  $before = $st; $res = $fn($st);
  if ($st !== $before) { rewind($fp); ftruncate($fp, 0); fwrite($fp, json_encode($st, JSON_UNESCAPED_UNICODE)); fflush($fp); }
  flock($fp, LOCK_UN); fclose($fp);
  return $res;
}
function sp_events(): array { return (array) (sp_with('events.json', static fn(array &$s) => $s['e'] ?? []) ?: []); }
function sp_clean(string $s, int $max): string { $s = trim(preg_replace('/\s+/u', ' ', strip_tags($s)) ?? ''); return preg_match('/^.{0,' . $max . '}/us', $s, $m) ? $m[0] : ''; }

/** Vue joueur : matchs ouverts (et ceux réglés depuis moins de 3 jours, pour voir le résultat). */
function sp_public_events(int $now = 0): array {
  $now = $now ?: time();
  sp_autoseed_once();
  sp_remind_admin($now);
  // v2787 : un logo d'équipe cherché APRÈS la réponse au joueur (il n'attend jamais)
  static $filled = false;
  if (!$filled && PHP_SAPI !== 'cli') { $filled = true; register_shutdown_function(static function () { if (function_exists('fastcgi_finish_request')) { try { fastcgi_finish_request(); } catch (Throwable $e) { /* ignore */ } } try { sp_logo_fill_one(); } catch (Throwable $e) { /* jamais bloquant */ } }); }
  $out = [];
  foreach (sp_events() as $e) {
    $open = $e['status'] === 'open' && $now < (int) $e['start'];
    if (!$open && !($e['status'] === 'settled' && (int) ($e['settledAt'] ?? 0) > $now - 3 * 86400)) continue;
    $out[] = ['id' => $e['id'], 'title' => $e['title'], 'league' => $e['league'], 'sport' => $e['sport'], 'start' => (int) $e['start'], 'open' => $open,
      'opts' => array_map(static fn($o) => ['k' => $o['k'], 'label' => $o['label'], 'odd' => (float) $o['odd']], $e['opts']), 'result' => $e['result'] ?? null, 'status' => $e['status'], 'logos' => array_values(array_map('strval', (array) ($e['logos'] ?? [])))];
  }
  usort($out, static fn($a, $b) => [$b['open'], $a['start']] <=> [$a['open'], $b['start']]);
  return $out;
}

/** Admin : crée / modifie un match. $in = title, league, sport, start (timestamp), opts [[label, odd]…], maxStake. */
function sp_admin_save(array $in): array {
  $title = sp_clean((string) ($in['title'] ?? ''), 80);
  if (mb_strlen_safe($title) < 3) return ['ok' => false, 'reason' => 'Titre trop court'];
  $start = (int) ($in['start'] ?? 0);
  if ($start < time() + 60) return ['ok' => false, 'reason' => 'Date de début dans le passé'];
  $opts = [];
  foreach ((array) ($in['opts'] ?? []) as $i => $o) {
    $label = sp_clean((string) ($o['label'] ?? ''), 40);
    $odd = round((float) ($o['odd'] ?? 0), 2);
    if ($label === '') continue;
    if ($odd < 1.01 || $odd > 100) return ['ok' => false, 'reason' => 'Cote invalide : ' . $label];
    $opts[] = ['k' => 'o' . count($opts), 'label' => $label, 'odd' => $odd];
  }
  if (count($opts) < 2 || count($opts) > 6) return ['ok' => false, 'reason' => 'Il faut 2 à 6 choix'];
  $maxStake = max(1.0, min(1000.0, (float) ($in['maxStake'] ?? SP_DEFAULT_MAX_STAKE)));
  $id = preg_replace('/[^a-z0-9]/', '', (string) ($in['id'] ?? '')) ?: ('e' . bin2hex(random_bytes(5)));
  // v2713 : logos des 2 équipes (sports d'équipe seulement ; jamais bloquant)
  $logos = [];
  $sportK = sp_clean((string) ($in['sport'] ?? 'foot'), 12);
  $given = array_values(array_filter(array_map('strval', (array) ($in['logos'] ?? [])), static fn($l) => (bool) preg_match('#^(img/teams/[a-z0-9-]{2,30}\.png|q:(btc|us|ball|vote|fire|star))$#', $l)));
  if ($given) $logos = $given; // v2755 : logos fournis (suggestions) — pas de recherche sur internet
  elseif (!empty($in['noFetch'])) $logos = []; // v2787 : publication automatique — les logos seront cherchés plus tard, un par un (jamais d'attente)
  elseif (!in_array($sportK, ['event', 'crypto', 'politique'], true) && ($tm = sp_title_teams($title))) {
    try { $logos = [sp_team_logo($tm[0]), sp_team_logo($tm[1])]; } catch (Throwable $e) { $logos = []; }
  }
  // v2734 : images mises par l'admin (prioritaires sur les logos trouvés tout seuls)
  $i1 = sp_admin_img((string) ($in['img1'] ?? '')); $i2 = sp_admin_img((string) ($in['img2'] ?? ''));
  if ($i1 !== '' || $i2 !== '') { $logos = [$i1 !== '' ? $i1 : ($logos[0] ?? ''), $i2 !== '' ? $i2 : ($logos[1] ?? '')]; }
  $endAt = (int) ($in['endAt'] ?? 0); if ($endAt && $endAt < $start) $endAt = 0; // v2787 : heure de fin réelle (pour prévenir l'admin au bon moment)
  return sp_with('events.json', static function (array &$s) use ($id, $title, $in, $start, $opts, $maxStake, $logos, $endAt) {
    foreach ((array) ($s['e'] ?? []) as $i => $e) {
      if ($e['id'] === $id) {
        if ($e['status'] !== 'open') return ['ok' => false, 'reason' => 'Match déjà fermé ou réglé'];
        // cotes modifiables tant qu'aucun pari n'est pris sur l'ancienne cote (les paris gardent LEUR cote de toute façon)
        $s['e'][$i] = array_merge($e, ['title' => $title, 'league' => sp_clean((string) ($in['league'] ?? ''), 40), 'sport' => sp_clean((string) ($in['sport'] ?? 'foot'), 12), 'start' => $start, 'opts' => $opts, 'maxStake' => $maxStake, 'logos' => $logos] + ($endAt ? ['endAt' => $endAt] : []));
        return ['ok' => true, 'id' => $id];
      }
    }
    $s['e'][] = ['id' => $id, 'title' => $title, 'league' => sp_clean((string) ($in['league'] ?? ''), 40), 'sport' => sp_clean((string) ($in['sport'] ?? 'foot'), 12), 'start' => $start,
      'opts' => $opts, 'maxStake' => $maxStake, 'status' => 'open', 'createdAt' => time(), 'logos' => $logos] + ($endAt ? ['endAt' => $endAt] : []);
    // on garde au plus 300 matchs (les plus anciens réglés partent)
    if (count($s['e']) > 300) $s['e'] = array_slice($s['e'], -300);
    return ['ok' => true, 'id' => $id];
  });
}
function mb_strlen_safe(string $s): int { return (int) preg_match_all('/./us', $s); }
function sp_lower(string $s): string { return function_exists('mb_strtolower') ? mb_strtolower($s, 'UTF-8') : strtolower($s); }

/*
 * v2713 (propriétaire) — LOGOS DES ÉQUIPES automatiques : à la publication d'un match, le serveur cherche une seule fois
 * le logo de chaque équipe (service gratuit TheSportsDB) et en garde une COPIE chez nous (data/sports/logos/).
 * Les téléphones des joueurs le lisent via sp-logo.php (jamais le service extérieur). Pas trouvé = pastille avec la lettre.
 */
function sp_logo_dir(): string { $d = sp_dir() . DIRECTORY_SEPARATOR . 'logos'; if (!is_dir($d)) @mkdir($d, 0750, true); return $d; }
function sp_logo_key(string $name): string { return substr(hash('sha256', sp_lower(trim($name))), 0, 16); }
function sp_http_get(string $url, int $max): string {
  $ctx = stream_context_create(['http' => ['timeout' => 4, 'ignore_errors' => true, 'header' => "User-Agent: OROLADO
"], 'ssl' => ['verify_peer' => true]]);
  $raw = @file_get_contents($url, false, $ctx, 0, $max + 1);
  return is_string($raw) && strlen($raw) <= $max ? $raw : '';
}
function sp_team_logo(string $name): string {
  $name = trim($name);
  if (mb_strlen_safe($name) < 2) return '';
  $k = sp_logo_key($name);
  $f = sp_logo_dir() . DIRECTORY_SEPARATOR . $k . '.png';
  if (is_file($f)) return $k;
  $miss = sp_logo_dir() . DIRECTORY_SEPARATOR . $k . '.miss';
  if (is_file($miss) && filemtime($miss) > time() - 7 * 86400) return ''; // pas trouvé récemment : on ne redemande pas
  // 2 essais au plus : le nom tel quel, puis sans « FC / AS / AC… » et avec quelques noms français → anglais
  $alt = trim(preg_replace('/\b(FC|AS|AC|CF|SC|SS|US|RC|OGC|CA)\b\.?/u', '', strtr($name, ['Barcelone' => 'Barcelona', 'Munich' => 'Munich', 'Séville' => 'Sevilla', 'Naples' => 'Napoli', 'Milan AC' => 'AC Milan', 'Inter Milan' => 'Inter', 'Atlético Madrid' => 'Atletico Madrid', 'Tottenham' => 'Tottenham'])) ?? $name);
  $u = '';
  foreach (array_values(array_unique([$name, $alt])) as $q) {
    if ($q === '') continue;
    $raw = sp_http_get('https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t=' . rawurlencode($q), 200000);
    $j = json_decode($raw, true);
    if (!is_array($j)) return ''; // service occupé / limite de la clé gratuite : on réessaiera plus tard (rien de noté)
    $t = !empty($j['teams'][0]) ? $j['teams'][0] : null;
    $u = is_array($t) ? (string) ($t['strBadge'] ?? $t['strTeamBadge'] ?? '') : '';
    if ($u !== '') break;
  }
  if (!preg_match('#^https://r2\.thesportsdb\.com/images/media/team/badge/[a-z0-9]+\.png$#i', $u)) { @touch($miss); return ''; } // vraiment pas trouvé
  $img = sp_http_get($u . '/tiny', 400000);
  if ($img === '' || substr($img, 0, 4) !== "\x89PNG") return '';
  @file_put_contents($f, $img);
  return is_file($f) ? $k : '';
}
/** v2734 — image envoyée par l'admin (PNG 128 px fait par le navigateur) : gardée chez nous, renvoie sa clé (ou ''). */
function sp_admin_img(string $dataUrl): string {
  if (!preg_match('#^data:image/png;base64,([A-Za-z0-9+/=]+)$#', $dataUrl, $m)) return '';
  $bin = base64_decode($m[1], true);
  if (!is_string($bin) || strlen($bin) < 60 || strlen($bin) > 300000 || substr($bin, 0, 4) !== "\x89PNG") return '';
  $k = substr(hash('sha256', $bin), 0, 16);
  $f = sp_logo_dir() . DIRECTORY_SEPARATOR . $k . '.png';
  if (!is_file($f)) @file_put_contents($f, $bin);
  return is_file($f) ? $k : '';
}
/*
 * v2754 (propriétaire) — SUGGESTIONS prêtes à publier d'un clic depuis l'admin (vrais événements vérifiés le 17/10/2026 :
 * Ligue des champions J3 des 20-21/10, Premier League J8 du 24/10, Bitcoin ~81-83 k$, élections américaines du 3/11).
 * Cotes SERRÉES : la maison garde 7 à 9 % sur chaque question ; mise maximale 20 $ par coupon. Heures en UTC.
 * Rien n'est ajouté deux fois (même titre) ; un événement déjà commencé n'est pas ajouté. L'admin donne ensuite le résultat.
 */
function sp_suggestions(): array {
  $t = static fn(string $s): int => (int) strtotime($s . ' UTC');
  return [
    ['PSG - FC Barcelona', 'Ligue des champions', 'foot', $t('2026-10-20 19:00'), [['PSG', 2.30], ['Nul', 3.40], ['Barcelona', 2.75]], ['img/teams/psg.png', 'img/teams/barcelona.png'], $t('2026-10-20 21:00')],
    ['Liverpool - Villarreal', 'Ligue des champions', 'foot', $t('2026-10-20 19:00'), [['Liverpool', 1.45], ['Nul', 4.30], ['Villarreal', 6.00]], ['img/teams/liverpool.png', 'img/teams/villarreal.png']],
    ['Bayern Munich - Arsenal', 'Ligue des champions', 'foot', $t('2026-10-21 19:00'), [['Bayern', 2.25], ['Nul', 3.50], ['Arsenal', 2.80]], ['img/teams/bayern.png', 'img/teams/arsenal.png'], $t('2026-10-21 21:00')],
    ['Real Madrid - RB Leipzig', 'Ligue des champions', 'foot', $t('2026-10-21 19:00'), [['Real Madrid', 1.50], ['Nul', 4.20], ['Leipzig', 5.50]], ['img/teams/real-madrid.png', 'img/teams/leipzig.png']],
    ['Aston Villa - Manchester City', 'Premier League', 'foot', $t('2026-10-24 11:30'), [['Aston Villa', 3.00], ['Nul', 3.50], ['Man City', 2.20]], ['img/teams/aston-villa.png', 'img/teams/man-city.png'], $t('2026-10-24 21:30')],
    ['Chelsea - Tottenham', 'Premier League', 'foot', $t('2026-10-24 16:30'), [['Chelsea', 2.05], ['Nul', 3.50], ['Tottenham', 3.30]], ['img/teams/chelsea.png', 'img/teams/tottenham.png'], $t('2026-10-24 19:00')],
    ['Combien de buts dans PSG – Barcelone ?', 'Ligue des champions', 'event', $t('2026-10-20 19:00'), [['0 à 2 buts', 2.00], ['3 buts ou plus', 1.75]], ['q:ball']],
    ['Le Bitcoin sera-t-il au-dessus de 85 000 $ le dimanche 25 octobre à 20 h (UTC) ?', 'Bitcoin', 'event', $t('2026-10-24 20:00'), [['Oui', 2.90], ['Non', 1.38]], ['q:btc']],
    ['Le Bitcoin sera-t-il au-dessus de 80 000 $ le samedi 31 octobre à 20 h (UTC) ?', 'Bitcoin', 'event', $t('2026-10-29 20:00'), [['Oui', 1.70], ['Non', 2.00]], ['q:btc']],
    ['Élections américaines (3 nov.) : qui gagnera la Chambre ?', 'Élections américaines', 'event', $t('2026-11-03 12:00'), [['Démocrates', 1.05], ['Républicains', 7.00]], ['q:us']],
  ];
}
/*
 * v2787 (propriétaire) — PARIS REMPLIS avec des événements SERRÉS seulement (2 choix, cotes 1,62 à 2,10, presque pile ou face).
 * Vrais événements vérifiés le 17/10/2026 (calendriers officiels Premier League, Liga, Serie A, Ligue 1, Ligue des champions J3,
 * ouverture NBA du 20/10, UFC 333 et Fight Night du 7/11, Bitcoin ≈ 81 500 $). Football : « Qui gagne ? » — MATCH NUL = MISE
 * REMBOURSÉE (l'admin choisit « Annulé » si le match finit nul). Les cotes sont celles des grands sites, BAISSÉES (la maison garde
 * sa marge). Heures de fermeture en UTC, toujours AVANT le début réel (quand l'heure exacte n'est pas sûre : la plus tôt possible).
 */
function sp_suggestions2(): array {
  $t = static fn(string $s): int => (int) strtotime($s . ' UTC');
  $nul = ' · nul = remboursé';
  return [
    ['Paris FC - Stade Rennais', 'Ligue 1' . $nul, 'foot', $t('2026-10-18 10:30'), [['Paris FC', 1.95], ['Rennes', 1.75]], [], $t('2026-10-18 22:30')],
    ['Le Havre - AJ Auxerre', 'Ligue 1' . $nul, 'foot', $t('2026-10-18 10:30'), [['Le Havre', 1.80], ['Auxerre', 1.88]], [], $t('2026-10-18 22:30')],
    ['Osasuna - Racing Santander', 'LaLiga' . $nul, 'foot', $t('2026-10-18 10:30'), [['Osasuna', 1.70], ['Racing', 2.00]], [], $t('2026-10-18 22:30')],
    ['Celta Vigo - Alavés', 'LaLiga' . $nul, 'foot', $t('2026-10-18 10:30'), [['Celta', 1.72], ['Alavés', 1.98]], [], $t('2026-10-18 22:30')],
    ['Málaga - Real Sociedad', 'LaLiga' . $nul, 'foot', $t('2026-10-18 10:30'), [['Málaga', 1.95], ['Real Sociedad', 1.75]], [], $t('2026-10-18 22:30')],
    ['Leeds United - Manchester United', 'Premier League' . $nul, 'foot', $t('2026-10-18 12:30'), [['Leeds', 1.68], ['Man United', 2.02]], [], $t('2026-10-18 16:00')],
    ['PSG - FC Barcelona', 'Ligue des champions' . $nul, 'foot', $t('2026-10-20 16:45'), [['PSG', 1.65], ['Barcelona', 1.95]], ['img/teams/psg.png', 'img/teams/barcelona.png'], $t('2026-10-20 21:00')],
    ['VfB Stuttgart - Atlético Madrid', 'Ligue des champions' . $nul, 'foot', $t('2026-10-20 16:45'), [['Stuttgart', 1.88], ['Atlético', 1.80]], [], $t('2026-10-20 21:00')],
    ['FC Porto - PSV Eindhoven', 'Ligue des champions' . $nul, 'foot', $t('2026-10-20 16:45'), [['Porto', 1.75], ['PSV', 1.95]], [], $t('2026-10-20 21:00')],
    ['Detroit Pistons - Boston Celtics', 'NBA · match d’ouverture', 'basket', $t('2026-10-20 18:30'), [['Pistons', 1.80], ['Celtics', 1.88]], [], $t('2026-10-20 22:00')],
    ['New York Knicks - Philadelphia 76ers', 'NBA · match d’ouverture', 'basket', $t('2026-10-20 22:30'), [['Knicks', 1.70], ['76ers', 2.00]], [], $t('2026-10-21 02:00')],
    ['San Antonio Spurs - Oklahoma City Thunder', 'NBA · match d’ouverture', 'basket', $t('2026-10-21 01:00'), [['Spurs', 1.88], ['Thunder', 1.80]], [], $t('2026-10-21 04:30')],
    ['Como - Manchester United', 'Ligue des champions' . $nul, 'foot', $t('2026-10-21 16:45'), [['Como', 1.85], ['Man United', 1.85]], [], $t('2026-10-21 21:00')],
    ['Lille - Galatasaray', 'Ligue des champions' . $nul, 'foot', $t('2026-10-21 16:45'), [['Lille', 1.75], ['Galatasaray', 1.95]], [], $t('2026-10-21 21:00')],
    ['Bayern Munich - Arsenal', 'Ligue des champions' . $nul, 'foot', $t('2026-10-21 16:45'), [['Bayern', 1.62], ['Arsenal', 2.10]], ['img/teams/bayern.png', 'img/teams/arsenal.png'], $t('2026-10-21 21:00')],
    ['Club Brugge - RC Lens', 'Ligue des champions' . $nul, 'foot', $t('2026-10-21 16:45'), [['Club Brugge', 1.85], ['Lens', 1.85]], [], $t('2026-10-21 21:00')],
    ['Real Betis - Feyenoord', 'Ligue des champions' . $nul, 'foot', $t('2026-10-21 16:45'), [['Betis', 1.72], ['Feyenoord', 1.98]], [], $t('2026-10-21 21:00')],
    ['Bitcoin au-dessus de 82 000 $ le vendredi 23 octobre à 12 h (UTC) ?', 'Bitcoin · prix Coinbase', 'event', $t('2026-10-21 12:00'), [['Oui', 1.85], ['Non', 1.80]], ['q:btc'], $t('2026-10-23 12:05')],
    ['Chelsea - Tottenham', 'Premier League' . $nul, 'foot', $t('2026-10-24 11:00'), [['Chelsea', 1.70], ['Tottenham', 2.00]], ['img/teams/chelsea.png', 'img/teams/tottenham.png'], $t('2026-10-24 19:00')],
    ['Coventry City - Fulham', 'Premier League' . $nul, 'foot', $t('2026-10-24 11:00'), [['Coventry', 1.92], ['Fulham', 1.78]], [], $t('2026-10-24 19:00')],
    ['Aston Villa - Manchester City', 'Premier League' . $nul, 'foot', $t('2026-10-24 11:00'), [['Aston Villa', 1.98], ['Man City', 1.72]], ['img/teams/aston-villa.png', 'img/teams/man-city.png'], $t('2026-10-24 21:30')],
    ['Volkanovski - Evloev', 'UFC 333 · titre poids plumes', 'mma', $t('2026-10-24 14:00'), [['Volkanovski', 1.85], ['Evloev', 1.85]], [], $t('2026-10-25 00:30')],
    ['Crystal Palace - Newcastle', 'Premier League' . $nul, 'foot', $t('2026-10-25 12:00'), [['Crystal Palace', 1.85], ['Newcastle', 1.85]], [], $t('2026-10-25 19:00')],
    ['Hull City - Brentford', 'Premier League' . $nul, 'foot', $t('2026-10-25 12:00'), [['Hull City', 1.95], ['Brentford', 1.75]], [], $t('2026-10-25 19:00')],
    ['Sunderland - Leeds United', 'Premier League' . $nul, 'foot', $t('2026-10-25 12:00'), [['Sunderland', 1.80], ['Leeds', 1.90]], [], $t('2026-10-25 19:00')],
    ['Manchester United - Bournemouth', 'Premier League' . $nul, 'foot', $t('2026-10-25 12:00'), [['Man United', 1.68], ['Bournemouth', 2.02]], [], $t('2026-10-25 19:00')],
    ['Bitcoin au-dessus de 80 000 $ le samedi 31 octobre à 12 h (UTC) ?', 'Bitcoin · prix Coinbase', 'event', $t('2026-10-29 12:00'), [['Oui', 1.72], ['Non', 1.98]], ['q:btc'], $t('2026-10-31 12:05')],
    ['Bonfim - Brady', 'UFC Fight Night · Las Vegas', 'mma', $t('2026-11-07 20:00'), [['Bonfim', 1.88], ['Brady', 1.80]], [], $t('2026-11-08 07:00')],
    ['Bitcoin au-dessus de 83 000 $ le dimanche 15 novembre à 12 h (UTC) ?', 'Bitcoin · prix Coinbase', 'event', $t('2026-11-13 12:00'), [['Oui', 1.90], ['Non', 1.80]], ['q:btc'], $t('2026-11-15 12:05')],
  ];
}
/** v2787 : un événement est « serré » si chaque cote est entre 1,55 et 2,30 (pas de petite cote contre grosse cote). */
function sp_is_tight(array $e): bool {
  foreach ((array) ($e['opts'] ?? []) as $o) { $v = (float) ($o['odd'] ?? 0); if ($v < 1.55 || $v > 2.30) return false; }
  return count((array) ($e['opts'] ?? [])) >= 2;
}
/** v2787 : retire les événements ouverts PAS serrés sur lesquels personne n'a parié (ceux qui ont des paris restent, par honnêteté). */
function sp_remove_loose(): int {
  $bets = (array) (sp_with('bets.json', static fn(array &$s) => $s['b'] ?? []) ?: []);
  $used = [];
  foreach ($bets as $b) foreach ((array) ($b['sel'] ?? []) as $sel) $used[(string) ($sel['ev'] ?? '')] = 1;
  return (int) sp_with('events.json', static function (array &$s) use ($used) {
    $n = 0; $keep = [];
    foreach ((array) ($s['e'] ?? []) as $e) {
      if (($e['status'] ?? '') === 'open' && !isset($used[(string) $e['id']]) && !sp_is_tight($e)) { $n++; continue; }
      $keep[] = $e;
    }
    if ($n) $s['e'] = $keep;
    return $n;
  });
}
/** v2755 : les suggestions se publient toutes seules la 1re fois que la page des prédictions est ouverte (une seule fois).
 *  v2787 : 2e série (événements serrés) + nettoyage des événements pas serrés, une seule fois aussi. */
function sp_autoseed_once(): void {
  $flag = sp_dir() . DIRECTORY_SEPARATOR . 'seed-2026-10.done';
  if (!is_file($flag)) {
    @file_put_contents($flag, (string) time()); // posé AVANT : jamais deux fois, même si deux joueurs ouvrent en même temps
    try { sp_admin_seed(); } catch (Throwable $e) { @unlink($flag); } // v2759 : en cas d'échec, on réessaiera à la prochaine ouverture
  }
  $flag2 = sp_dir() . DIRECTORY_SEPARATOR . 'seed-2026-10b.done';
  if (!is_file($flag2)) {
    @file_put_contents($flag2, (string) time());
    try { sp_remove_loose(); sp_admin_seed(sp_suggestions2()); } catch (Throwable $e) { @unlink($flag2); }
  }
}
/** v2787 : logos des équipes cherchés PETIT À PETIT (au plus 1 équipe par ouverture de page, jamais d'attente pour personne). */
function sp_logo_fill_one(): void {
  $lock = sp_dir() . DIRECTORY_SEPARATOR . 'logo-fill.at';
  if (is_file($lock) && filemtime($lock) > time() - 20) return; // une recherche toutes les 20 s au plus
  @touch($lock);
  $todo = null;
  foreach (sp_events() as $e) {
    if (($e['status'] ?? '') !== 'open' || in_array((string) ($e['sport'] ?? ''), ['event', 'crypto', 'politique'], true)) continue;
    $lg = array_values((array) ($e['logos'] ?? []));
    if (count(array_filter($lg)) === 2) continue;
    $tm = sp_title_teams((string) $e['title']); if (!$tm) continue;
    $todo = [$e['id'], $tm, $lg]; break;
  }
  if (!$todo) return;
  [$id, $tm, $lg] = $todo;
  $i = empty($lg[0]) ? 0 : 1;
  $k = '';
  try { $k = sp_team_logo((string) $tm[$i]); } catch (Throwable $e) { $k = ''; }
  sp_with('events.json', static function (array &$s) use ($id, $i, $k) {
    foreach ((array) ($s['e'] ?? []) as $j => $e) if ($e['id'] === $id) { $l = array_values((array) ($e['logos'] ?? [])); $l += ['', '']; $l[$i] = $k !== '' ? $k : 'none'; $s['e'][$j]['logos'] = $l; }
    return true;
  });
}
/** v2755 : notification sur le téléphone de l'admin quand un événement est fini et attend son résultat
 *  (match : 2 h 15 après le coup d'envoi ; question : à l'heure de fin). Une seule fois par événement. */
function sp_remind_admin(int $now): void {
  $due = sp_with('events.json', static function (array &$s) use ($now) {
    $list = [];
    foreach ((array) ($s['e'] ?? []) as $i => $e) {
      if (($e['status'] ?? '') !== 'open' && ($e['status'] ?? '') !== 'closed') continue;
      if (!empty($e['askedAt'])) continue;
      $wait = in_array((string) ($e['sport'] ?? ''), ['event', 'crypto', 'politique'], true) ? 0 : 8100;
      if ($now < (!empty($e['endAt']) ? (int) $e['endAt'] : (int) $e['start'] + $wait)) continue; // v2787 : après la VRAIE fin
      $s['e'][$i]['askedAt'] = $now;
      $list[] = (string) $e['title'];
    }
    return $list;
  }) ?: [];
  if (!$due || !is_file(__DIR__ . '/push_lib.php')) return;
  try {
    require_once __DIR__ . '/push_lib.php';
    foreach (array_slice($due, 0, 5) as $t) push_notify_admin('🔮 Résultat à donner', $t . ' — touche pour valider', '/admin.php');
  } catch (Throwable $e) { /* jamais bloquant */ }
}
/** Admin : publie les suggestions qui ne sont pas encore en ligne (et pas encore commencées). */
function sp_admin_seed(?array $list = null): array {
  $have = [];
  foreach (sp_events() as $e) if (($e['status'] ?? '') === 'open') $have[sp_lower((string) $e['title'])] = 1;
  $added = 0; $skipped = 0;
  foreach (($list ?? sp_suggestions()) as $row) {
    [$title, $league, $sport, $start, $opts, $logos] = $row; $endAt = (int) ($row[6] ?? 0);
    if (isset($have[sp_lower($title)]) || $start < time() + 120) { $skipped++; continue; }
    $r = sp_admin_save(['title' => $title, 'league' => $league, 'sport' => $sport, 'start' => $start, 'maxStake' => 1000, 'logos' => $logos, 'noFetch' => true, 'endAt' => $endAt,
      'opts' => array_map(static fn($o) => ['label' => $o[0], 'odd' => $o[1]], $opts)]);
    if (!empty($r['ok'])) $added++; else $skipped++;
  }
  return ['ok' => true, 'added' => $added, 'skipped' => $skipped];
}
/** Les deux équipes d'un titre « A - B » / « A vs B » (comme l'affichage du joueur). */
function sp_title_teams(string $t): array {
  $m = preg_split('/\s+(?:-|–|—|vs\.?|VS|contre)\s+/u', $t);
  return is_array($m) && count($m) === 2 ? $m : [];
}

/** Le joueur parie (coupon). $sel = [[ev, k], …]. */
function sp_bet(array $db, array $user, string $mode, float $stake, array $sel, int $now = 0): array {
  $now = $now ?: time();
  $uid = (string) ($user['id'] ?? '');
  if ($uid === '') return ['ok' => false, 'reason' => 'login'];
  $mode = function_exists('casino_mode') ? casino_mode('real', false, $user) : 'real'; // v2690b : réel seulement (admin : solde de test)
  $stake = floor($stake * 100 + 1e-6) / 100;
  if ($stake + 1e-9 < SP_MIN) return ['ok' => false, 'reason' => 'min'];
  $sel = array_slice(array_values($sel), 0, SP_MAX_SEL + 1);
  if (!$sel || count($sel) > SP_MAX_SEL) return ['ok' => false, 'reason' => 'param'];
  $ev = []; foreach (sp_events() as $e) $ev[$e['id']] = $e;
  $picked = []; $odd = 1.0; $seen = [];
  foreach ($sel as $s) {
    $eid = (string) ($s['ev'] ?? $s[0] ?? ''); $k = (string) ($s['k'] ?? $s[1] ?? '');
    $e = $ev[$eid] ?? null;
    if (!$e || isset($seen[$eid])) return ['ok' => false, 'reason' => 'param'];
    if ($e['status'] !== 'open' || $now >= (int) $e['start']) return ['ok' => false, 'reason' => 'closed'];
    $o = null; foreach ($e['opts'] as $oo) if ($oo['k'] === $k) $o = $oo;
    if (!$o) return ['ok' => false, 'reason' => 'param'];
    $seen[$eid] = 1;
    $picked[] = ['ev' => $eid, 'k' => $k, 'odd' => (float) $o['odd'], 't' => $e['title'], 'l' => $o['label']];
    $odd *= (float) $o['odd'];
  }
  $odd = floor($odd * 100 + 1e-6) / 100; // v2765 : 2,30 reste 2,30 (avant : 2,29 à cause de l arrondi)
  // v2779 (propriétaire) : pas de mise maximale ; seul le GAIN d'un coupon est plafonné (6 000 $)
  if ($mode === 'real' && $stake * $odd > SP_MAX_WIN + 1e-9) return ['ok' => false, 'reason' => 'maxWin', 'maxStake' => floor(SP_MAX_WIN / $odd * 100) / 100];
  $ref = 'sp_' . bin2hex(random_bytes(9));
  $deb = casino_debit($db, $uid, $mode, $stake, $ref);
  if (empty($deb['ok'])) return ['ok' => false, 'reason' => $deb['reason'] ?? 'unavailable'];
  $bet = ['id' => $ref, 'uid' => $uid, 'mode' => $mode, 'stake' => $stake, 'odd' => $odd, 'pot' => casino_money(min(SP_MAX_WIN, $stake * $odd)), 'sel' => $picked, 'status' => 'open', 'at' => $now];
  sp_with('bets.json', static function (array &$s) use ($bet) { $s['b'][] = $bet; return true; });
  return ['ok' => true, 'bet' => sp_bet_public($bet), 'bal' => $deb['real'] ?? ($deb['demo'] ?? null)];
}

function sp_bet_public(array $b): array {
  return ['id' => $b['id'], 'mode' => $b['mode'], 'stake' => (float) $b['stake'], 'odd' => (float) $b['odd'], 'pot' => (float) $b['pot'], 'status' => $b['status'], 'win' => (float) ($b['win'] ?? 0), 'at' => (int) $b['at'], 'done' => (int) ($b['done'] ?? 0),
    'sel' => array_map(static fn($s) => ['t' => $s['t'], 'l' => $s['l'], 'odd' => (float) $s['odd'], 'r' => $s['r'] ?? null], $b['sel'])];
}
function sp_my_bets(string $uid): array {
  $all = (array) (sp_with('bets.json', static fn(array &$s) => $s['b'] ?? []) ?: []);
  $mine = array_values(array_filter($all, static fn($b) => ($b['uid'] ?? '') === $uid));
  return array_map('sp_bet_public', array_slice(array_reverse($mine), 0, SP_MY_BETS));
}

/** Admin : ferme les paris d'un match (plus personne ne peut parier dessus). */
function sp_admin_close(string $eid): array {
  return sp_with('events.json', static function (array &$s) use ($eid) {
    foreach ((array) ($s['e'] ?? []) as $i => $e) if ($e['id'] === $eid && $e['status'] === 'open') { $s['e'][$i]['status'] = 'closed'; return ['ok' => true]; }
    return ['ok' => false, 'reason' => 'Match introuvable ou déjà fermé'];
  });
}

/**
 * Admin : résultat d'un match ($k = choix gagnant, ou 'void' = match annulé). Puis on règle tous les coupons dont TOUS
 * les matchs sont terminés. Paiement une seule fois par coupon (référence unique).
 */
function sp_admin_settle(array $db, string $eid, string $k): array {
  $r = sp_with('events.json', static function (array &$s) use ($eid, $k) {
    foreach ((array) ($s['e'] ?? []) as $i => $e) {
      if ($e['id'] !== $eid) continue;
      if ($e['status'] === 'settled') return ['ok' => false, 'reason' => 'Résultat déjà donné'];
      $valid = $k === 'void'; foreach ($e['opts'] as $o) if ($o['k'] === $k) $valid = true;
      if (!$valid) return ['ok' => false, 'reason' => 'Choix inconnu'];
      $s['e'][$i]['status'] = 'settled'; $s['e'][$i]['result'] = $k; $s['e'][$i]['settledAt'] = time();
      return ['ok' => true];
    }
    return ['ok' => false, 'reason' => 'Match introuvable'];
  });
  if (empty($r['ok'])) return $r;
  return ['ok' => true] + sp_resolve($db);
}

/** Règle les coupons prêts. Retour : nombre de coupons gagnés / perdus / payés. */
function sp_resolve(array $db): array {
  $res = []; foreach (sp_events() as $e) if ($e['status'] === 'settled') $res[$e['id']] = $e['result'];
  $todo = sp_with('bets.json', static function (array &$s) use ($res) {
    $pay = [];
    foreach ((array) ($s['b'] ?? []) as $i => $b) {
      if ($b['status'] !== 'open') continue;
      $lost = false; $ready = true; $odd = 1.0; $live = 0;
      foreach ($b['sel'] as $j => $sel) {
        if (!isset($res[$sel['ev']])) { $ready = false; continue; }
        $rk = $res[$sel['ev']];
        $s['b'][$i]['sel'][$j]['r'] = $rk === 'void' ? 'void' : ($rk === $sel['k'] ? 'won' : 'lost');
        if ($rk === 'void') continue;
        $live++;
        if ($rk !== $sel['k']) $lost = true; else $odd *= (float) $sel['odd'];
      }
      if ($lost) { $s['b'][$i]['status'] = 'lost'; $s['b'][$i]['win'] = 0.0; $s['b'][$i]['done'] = time(); $pay[] = ['i' => $b['id'], 'uid' => $b['uid'], 'mode' => $b['mode'], 'w' => 0.0, 's' => $b['stake']]; continue; }
      if (!$ready) continue;
      $win = casino_money(min(SP_MAX_WIN, (float) $b['stake'] * (floor($odd * 100 + 1e-6) / 100)));
      // v2779 (propriétaire) : tous les matchs du coupon annulés → « Remboursé » (la mise revient, visible dans l'historique et le reçu)
      $s['b'][$i]['status'] = $live === 0 ? 'void' : 'won'; $s['b'][$i]['win'] = $win; $s['b'][$i]['done'] = time();
      $pay[] = ['i' => $b['id'], 'uid' => $b['uid'], 'mode' => $b['mode'], 'w' => $win, 's' => $b['stake']];
    }
    return $pay;
  }) ?: [];
  $won = 0; $lostN = 0; $paidFail = 0;
  foreach ($todo as $p) {
    $bal = casino_credit($db, (string) $p['uid'], (string) $p['mode'], (float) $p['w'], (string) $p['i']);
    if ($bal === null && $p['mode'] === 'real') { $paidFail++; sp_mark_unpaid((string) $p['i']); continue; }
    casino_stat('sports', (string) $p['mode'], (float) $p['s'], (float) $p['w']);
    if ($p['w'] > 0) $won++; else $lostN++;
  }
  return ['won' => $won, 'lost' => $lostN, 'retry' => $paidFail];
}
/** Base injoignable pendant le paiement : le coupon repasse « ouvert » pour être réglé au prochain clic (référence unique : jamais payé 2 fois). */
function sp_mark_unpaid(string $id): void {
  sp_with('bets.json', static function (array &$s) use ($id) { foreach ($s['b'] as $i => $b) if ($b['id'] === $id) $s['b'][$i]['status'] = 'open'; return true; });
}

/** Admin : liste des matchs avec le total misé par choix (pour voir le risque). */
function sp_admin_list(): array {
  $bets = (array) (sp_with('bets.json', static fn(array &$s) => $s['b'] ?? []) ?: []);
  $exp = [];
  foreach ($bets as $b) {
    if ($b['mode'] !== 'real') continue;
    foreach ($b['sel'] as $s) {
      $exp[$s['ev']][$s['k']]['n'] = ($exp[$s['ev']][$s['k']]['n'] ?? 0) + 1;
      $exp[$s['ev']][$s['k']]['in'] = ($exp[$s['ev']][$s['k']]['in'] ?? 0) + (float) $b['stake'];
      if ($b['status'] === 'open') $exp[$s['ev']][$s['k']]['risk'] = ($exp[$s['ev']][$s['k']]['risk'] ?? 0) + (float) $b['pot'];
    }
  }
  $out = [];
  foreach (array_reverse(sp_events()) as $e) { $e['exp'] = $exp[$e['id']] ?? []; $out[] = $e; }
  return $out;
}
