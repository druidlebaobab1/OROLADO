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
const SP_MAX_SEL = 50; // 2026-10-21 (propriétaire : « autant de matchs qu'ils veulent ») : 50 matchs par coupon (avant 10) ; gain toujours plafonné (SP_MAX_WIN)
const SP_MAX_WIN = 1000000000.0; // 2026-10-20 (propriétaire) : aucune limite (mise ni gain) ; v2779 : 6 000 $
const SP_DEFAULT_MAX_STAKE = 50.0; // (plus utilisé depuis v2779 : pas de mise maximale ; gardé pour les anciens matchs)
const SP_MY_BETS = 300;            // v2779 : « Mes paris » montre les 300 derniers coupons
/*
 * v2810 — SÉCURITÉ ARGENT des prédictions (audit du 19/10/2026) :
 *  1. Combinés : une question (type « event » / crypto / politique) se joue en SIMPLE seulement ; et deux choix du même
 *     « groupe de corrélation » (même match / mêmes équipes le même jour, même actif, même GP…) sont refusés dans un coupon.
 *  2. Cotes périmées : une question de PRIX (crypto, Bourse, or…) ferme au plus tard 72 h après la pose de ses cotes
 *     (pricedAt) ; l'admin peut remettre des cotes à jour (sp_admin_odds), ce qui rouvre une fenêtre de 72 h.
 *     Plafond de mises par choix sur chaque question (500 $ par défaut, réglable par événement : champ « cap »).
 *  3. Gains arrondis au cent INFÉRIEUR (jamais au plus proche).
 */
const SP_Q_CAP = 500.0;            // total des mises réelles par choix d'une question (0 sur un match = pas de plafond)
const SP_PRICE_TTL = 259200;       // 72 h : durée maximale d'ouverture d'une question de prix après la pose de ses cotes
const SP_Q_SPORTS = ['event', 'crypto', 'politique'];
function sp_floor2(float $v): float { return floor($v * 100 + 1e-6) / 100; }
function sp_is_question(array $e): bool { return in_array((string) ($e['sport'] ?? ''), SP_Q_SPORTS, true); }
/** L'actif d'une question de prix (btc, eth, gold, tesla…), '' si aucun. */
function sp_asset(array $e): string {
  foreach ((array) ($e['logos'] ?? []) as $l) if (preg_match('/^q:(btc|eth|sol|xrp|doge|gold)$/', (string) $l, $m)) return $m[1];
  $t = sp_lower((string) ($e['title'] ?? '') . ' ' . (string) ($e['league'] ?? ''));
  foreach (['btc' => '/bitcoin|\bbtc\b/u', 'eth' => '/ethereum|\beth\b|\bether\b/u', 'sol' => '/solana|\bsol\b/u', 'xrp' => '/\bxrp\b|ripple/u', 'doge' => '/dogecoin|\bdoge\b/u',
    'gold' => '/\bgold\b|lbma|l’or\b|l\'or\b|\bor\s+au-dessus/u', 'spx' => '/s&p|sp500|s&amp;p/u', 'ndx' => '/nasdaq/u', 'dji' => '/dow jones/u', 'cac' => '/cac ?40/u',
    'tsla' => '/tesla/u', 'aapl' => '/apple/u', 'nvda' => '/nvidia/u', 'msft' => '/microsoft/u', 'amzn' => '/amazon/u', 'goog' => '/google|alphabet/u', 'meta' => '/\bmeta\b/u'] as $k => $rx)
    if (preg_match($rx, $t)) return $k;
  return '';
}
/** Question de PRIX (cote vite périmée) : crypto, action, indice, or… */
function sp_is_price(array $e): bool {
  if (!sp_is_question($e)) return false;
  if (($e['sport'] ?? '') === 'crypto') return true;
  foreach ((array) ($e['logos'] ?? []) as $l) if (preg_match('/^q:(btc|eth|sol|xrp|doge|chart|gold)$/', (string) $l)) return true;
  if (sp_asset($e) !== '') return true;
  $t = sp_lower((string) ($e['title'] ?? '') . ' ' . (string) ($e['league'] ?? ''));
  return (bool) preg_match('/crypto|bourse|\bprix\b|\bprice\b|\bcours\b|cotation|au-dessus de|en dessous de|au-dessous de|\babove\b|\bbelow\b/u', $t);
}
/** Groupes de corrélation d'un événement : deux choix d'un même groupe ne vont jamais dans le même coupon. */
function sp_corr_groups(array $e): array {
  $g = [];
  if (!empty($e['grp'])) $g[] = 'x:' . sp_lower((string) $e['grp']);
  $t = sp_lower((string) ($e['title'] ?? '') . ' ' . (string) ($e['league'] ?? ''));
  $day = gmdate('Y-m-d', (int) ($e['start'] ?? 0));
  if (sp_is_question($e)) {
    $g[] = 'q'; // toutes les questions ensemble (de toute façon : simples seulement)
    if (sp_is_price($e)) {
      $g[] = 'px';
      $a = sp_asset($e);
      if ($a !== '') $g[] = 'asset:' . $a;
      if (in_array($a, ['btc', 'eth', 'sol', 'xrp', 'doge'], true) || ($e['sport'] ?? '') === 'crypto' || str_contains($t, 'crypto')) $g[] = 'crypto';
      elseif ($a !== '' && $a !== 'gold') $g[] = 'stocks';
    }
    if (preg_match('/\bf1\b|formule 1|formula 1|grand prix|\bgp\b/u', $t)) { $g[] = 'f1'; $g[] = 'f1:' . $day; }
    if (preg_match('/ballon d|award|oscar|trophée|trophy|\bmvp\b|golden boy|élection|election/u', $t)) $g[] = 'award';
  }
  $tm = sp_title_teams((string) ($e['title'] ?? ''));
  if ($tm) {
    $n = array_map(static fn($x) => trim((string) preg_replace('/[^\p{L}\p{N}]+/u', '', (string) preg_replace('/\b(fc|as|ac|cf|sc|ss|us|rc|ogc|ca|afc|cd|ud|sl|sk|bv|vfb|rb)\b\.?/u', '', sp_lower((string) $x)))), $tm);
    sort($n);
    $g[] = 'm:' . $day . ':' . implode('|', $n); // même match (publié deux fois, dans un sens ou dans l'autre) le même jour
  } elseif (!sp_is_question($e)) $g[] = 'm:' . $day . ':' . sp_lower((string) ($e['title'] ?? ''));
  return array_values(array_unique($g));
}
/** Heure réelle de fermeture des paris : le début, ou plus tôt pour une question de prix (72 h après la pose des cotes). */
function sp_close_at(array $e): int {
  $c = (int) ($e['start'] ?? 0);
  if (sp_is_price($e)) {
    $p = (int) ($e['pricedAt'] ?? $e['createdAt'] ?? 0);
    if ($p > 0) $c = min($c, $p + SP_PRICE_TTL);
  }
  return $c;
}
/** Plafond des mises réelles par choix (0 = aucun). Questions : 500 $ par défaut ; champ « cap » réglable par l'admin. */
function sp_cap(array $e): float {
  $c = (float) ($e['cap'] ?? 0);
  if ($c > 0) return $c;
  return sp_is_question($e) ? SP_Q_CAP : 0.0;
}

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
    $close = sp_close_at($e); // v2810 : question de prix fermée 72 h après ses cotes
    if (!empty($e['hold']) && $e['status'] !== 'settled') continue; // 2026-10-21 : en attente de vraies cotes du marché → caché, aucun pari
    $open = $e['status'] === 'open' && $now < $close;
    // 2026-10-22 (propriétaire) : un match fini disparaît de la liste (plus de « Résultats » affichés 3 jours) ; « Mes paris » garde l'historique
    if (!$open) continue;
    $out[] = ['id' => $e['id'], 'title' => $e['title'], 'league' => $e['league'], 'sport' => $e['sport'], 'start' => $close, 'open' => $open, 'q' => sp_is_question($e), 'grp' => sp_corr_groups($e),
      'opts' => array_map(static fn($o) => ['k' => $o['k'], 'label' => $o['label'], 'odd' => (float) $o['odd']], $e['opts']), 'result' => $e['result'] ?? null, 'status' => $e['status'], 'logos' => array_values(array_map('strval', (array) ($e['logos'] ?? []))), 'i18n' => !empty($e['i18n']) ? (object) $e['i18n'] : null];
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
  $given = array_values(array_filter(array_map('strval', (array) ($in['logos'] ?? [])), static fn($l) => (bool) preg_match('#^(img/teams/[a-z0-9-]{2,30}\.png|q:(btc|eth|sol|xrp|doge|us|ball|vote|fire|star|race|trophy|film|chart|gold))$#', $l)));
  if ($given) $logos = $given; // v2755 : logos fournis (suggestions) — pas de recherche sur internet
  elseif (!empty($in['noFetch'])) $logos = []; // v2787 : publication automatique — les logos seront cherchés plus tard, un par un (jamais d'attente)
  elseif (!in_array($sportK, ['event', 'crypto', 'politique'], true) && ($tm = sp_title_teams($title))) {
    try { $logos = [sp_team_logo($tm[0]), sp_team_logo($tm[1])]; } catch (Throwable $e) { $logos = []; }
  }
  // v2734 : images mises par l'admin (prioritaires sur les logos trouvés tout seuls)
  $i1 = sp_admin_img((string) ($in['img1'] ?? '')); $i2 = sp_admin_img((string) ($in['img2'] ?? ''));
  if ($i1 !== '' || $i2 !== '') { $logos = [$i1 !== '' ? $i1 : ($logos[0] ?? ''), $i2 !== '' ? $i2 : ($logos[1] ?? '')]; }
  $endAt = (int) ($in['endAt'] ?? 0); if ($endAt && $endAt < $start) $endAt = 0;
  $tr = []; foreach ((array) ($in['i18n'] ?? []) as $lg => $tx) if (preg_match('/^[a-z]{2}$/', (string) $lg) && is_string($tx) && $tx !== '') $tr[(string) $lg] = sp_clean($tx, 120); // v2789 : titre traduit // v2787 : heure de fin réelle (pour prévenir l'admin au bon moment)
  // v2810 : date de la pose des cotes (une question de prix ferme au plus tard 72 h après) et plafond de mises par choix
  $now = time();
  $pricedAt = (int) ($in['pricedAt'] ?? 0); $pricedAt = $pricedAt > 0 ? min($pricedAt, $now) : $now;
  $cap = max(0.0, min(100000.0, round((float) ($in['cap'] ?? 0), 2)));
  return sp_with('events.json', static function (array &$s) use ($id, $title, $in, $start, $opts, $maxStake, $logos, $endAt, $tr, $pricedAt, $cap) {
    $fix = static function (array $e) use ($pricedAt): array { // v2810 : question de prix → fermeture ≤ cotes + 72 h (heure de réponse gardée dans endAt)
      $e['pricedAt'] = $pricedAt;
      if (!sp_is_price($e)) return $e;
      $e['closeMax'] = (int) $e['start'];
      if (empty($e['endAt'])) $e['endAt'] = (int) $e['start'];
      $e['start'] = min((int) $e['start'], $pricedAt + SP_PRICE_TTL);
      return $e;
    };
    foreach ((array) ($s['e'] ?? []) as $i => $e) {
      if ($e['id'] === $id) {
        if ($e['status'] !== 'open') return ['ok' => false, 'reason' => 'Match déjà fermé ou réglé'];
        // v2810 : les clés des choix restent les mêmes (oD du nul…) : un pari déjà pris garde SON choix
        $old = array_values((array) ($e['opts'] ?? []));
        if (count($old) === count($opts)) foreach ($opts as $j => $o) $opts[$j]['k'] = (string) $old[$j]['k'];
        // cotes modifiables tant qu'aucun pari n'est pris sur l'ancienne cote (les paris gardent LEUR cote de toute façon)
        $s['e'][$i] = $fix(array_merge($e, ['title' => $title, 'league' => sp_clean((string) ($in['league'] ?? ''), 40), 'sport' => sp_clean((string) ($in['sport'] ?? 'foot'), 12), 'start' => $start, 'opts' => $opts, 'maxStake' => $maxStake, 'logos' => $logos] + ($endAt ? ['endAt' => $endAt] : []) + ($tr ? ['i18n' => $tr] : []) + ($cap > 0 ? ['cap' => $cap] : [])));
        unset($s['e'][$i]['hold']); // 2026-10-21 : cotes reposées par l'admin → plus en attente
        return ['ok' => true, 'id' => $id];
      }
    }
    $s['e'][] = $fix(['id' => $id, 'title' => $title, 'league' => sp_clean((string) ($in['league'] ?? ''), 40), 'sport' => sp_clean((string) ($in['sport'] ?? 'foot'), 12), 'start' => $start,
      'opts' => $opts, 'maxStake' => $maxStake, 'status' => 'open', 'createdAt' => time(), 'logos' => $logos] + ($endAt ? ['endAt' => $endAt] : []) + ($tr ? ['i18n' => $tr] : []) + ($cap > 0 ? ['cap' => $cap] : []));
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
/** v2789 : une question Bitcoin dans les 12 langues du site (le titre français reste le principal). */
function sp_btc_q(int $p, string $d, string $h): array {
  $fr = number_format($p, 0, ',', ' '); $en = number_format($p, 0, '.', ',');
  return ['en' => "Bitcoin above $$en on $d at $h UTC?", 'es' => "¿Bitcoin por encima de $fr $ el $d a las $h UTC?", 'pt' => "Bitcoin acima de $fr $ em $d às $h UTC?",
    'ar' => "هل سيكون البيتكوين فوق $en $ يوم $d الساعة $h UTC؟", 'tr' => "Bitcoin $d saat $h UTC'de $en $ üzerinde mi?", 'vi' => "Bitcoin trên $fr $ vào $d lúc $h UTC?",
    'id' => "Bitcoin di atas $fr $ pada $d pukul $h UTC?", 'ru' => "Биткоин выше $fr $ $d в $h UTC?", 'de' => "Bitcoin über $fr $ am $d um $h UTC?",
    'hi' => "क्या $d को $h UTC पर बिटकॉइन $en $ से ऊपर होगा?", 'zh' => "比特币在 $d $h UTC 是否高于 $en 美元？"];
}
function sp_suggestions2(): array {
  $t = static fn(string $s): int => (int) strtotime($s . ' UTC');
  $nul = ' · nul = remboursé';
  return [
    ['Paris FC - Stade Rennais', 'Ligue 1' . $nul, 'foot', $t('2026-10-18 10:30'), [['Paris FC', 1.95], ['Rennes', 1.75]], ['img/teams/paris-fc.png', 'img/teams/rennes.png'], $t('2026-10-18 22:30')],
    ['Le Havre - AJ Auxerre', 'Ligue 1' . $nul, 'foot', $t('2026-10-18 10:30'), [['Le Havre', 1.80], ['Auxerre', 1.88]], ['img/teams/le-havre.png', 'img/teams/auxerre.png'], $t('2026-10-18 22:30')],
    ['Osasuna - Racing Santander', 'LaLiga' . $nul, 'foot', $t('2026-10-18 10:30'), [['Osasuna', 1.70], ['Racing', 2.00]], ['img/teams/osasuna.png', 'img/teams/racing-santander.png'], $t('2026-10-18 22:30')],
    ['Celta Vigo - Alavés', 'LaLiga' . $nul, 'foot', $t('2026-10-18 10:30'), [['Celta', 1.72], ['Alavés', 1.98]], ['img/teams/celta-vigo.png', 'img/teams/alaves.png'], $t('2026-10-18 22:30')],
    ['Málaga - Real Sociedad', 'LaLiga' . $nul, 'foot', $t('2026-10-18 10:30'), [['Málaga', 1.95], ['Real Sociedad', 1.75]], ['img/teams/malaga.png', 'img/teams/real-sociedad.png'], $t('2026-10-18 22:30')],
    ['Leeds United - Manchester United', 'Premier League' . $nul, 'foot', $t('2026-10-18 12:30'), [['Leeds', 1.68], ['Man United', 2.02]], ['img/teams/leeds.png', 'img/teams/man-united.png'], $t('2026-10-18 16:00')],
    ['PSG - FC Barcelona', 'Ligue des champions' . $nul, 'foot', $t('2026-10-20 16:45'), [['PSG', 1.65], ['Barcelona', 1.95]], ['img/teams/psg.png', 'img/teams/barcelona.png'], $t('2026-10-20 21:00')],
    ['VfB Stuttgart - Atlético Madrid', 'Ligue des champions' . $nul, 'foot', $t('2026-10-20 16:45'), [['Stuttgart', 1.88], ['Atlético', 1.80]], ['img/teams/stuttgart.png', 'img/teams/atletico-madrid.png'], $t('2026-10-20 21:00')],
    ['FC Porto - PSV Eindhoven', 'Ligue des champions' . $nul, 'foot', $t('2026-10-20 16:45'), [['Porto', 1.75], ['PSV', 1.95]], ['img/teams/porto.png', 'img/teams/psv.png'], $t('2026-10-20 21:00')],
    ['Detroit Pistons - Boston Celtics', 'NBA · match d’ouverture', 'basket', $t('2026-10-20 18:30'), [['Pistons', 1.80], ['Celtics', 1.88]], ['img/teams/detroit-pistons.png', 'img/teams/boston-celtics.png'], $t('2026-10-20 22:00')],
    ['New York Knicks - Philadelphia 76ers', 'NBA · match d’ouverture', 'basket', $t('2026-10-20 22:30'), [['Knicks', 1.70], ['76ers', 2.00]], ['img/teams/new-york-knicks.png', 'img/teams/philadelphia-76ers.png'], $t('2026-10-21 02:00')],
    ['San Antonio Spurs - Oklahoma City Thunder', 'NBA · match d’ouverture', 'basket', $t('2026-10-21 01:00'), [['Spurs', 1.88], ['Thunder', 1.80]], ['img/teams/san-antonio-spurs.png', 'img/teams/okc-thunder.png'], $t('2026-10-21 04:30')],
    ['Como - Manchester United', 'Ligue des champions' . $nul, 'foot', $t('2026-10-21 16:45'), [['Como', 1.85], ['Man United', 1.85]], ['img/teams/como.png', 'img/teams/man-united.png'], $t('2026-10-21 21:00')],
    ['Lille - Galatasaray', 'Ligue des champions' . $nul, 'foot', $t('2026-10-21 16:45'), [['Lille', 1.75], ['Galatasaray', 1.95]], ['img/teams/lille.png', 'img/teams/galatasaray.png'], $t('2026-10-21 21:00')],
    ['Bayern Munich - Arsenal', 'Ligue des champions' . $nul, 'foot', $t('2026-10-21 16:45'), [['Bayern', 1.62], ['Arsenal', 2.10]], ['img/teams/bayern.png', 'img/teams/arsenal.png'], $t('2026-10-21 21:00')],
    ['Club Brugge - RC Lens', 'Ligue des champions' . $nul, 'foot', $t('2026-10-21 16:45'), [['Club Brugge', 1.85], ['Lens', 1.85]], ['img/teams/club-brugge.png', 'img/teams/lens.png'], $t('2026-10-21 21:00')],
    ['Real Betis - Feyenoord', 'Ligue des champions' . $nul, 'foot', $t('2026-10-21 16:45'), [['Betis', 1.72], ['Feyenoord', 1.98]], ['img/teams/real-betis.png', 'img/teams/feyenoord.png'], $t('2026-10-21 21:00')],
    ['Bitcoin au-dessus de 82 000 $ le vendredi 23 octobre à 12 h (UTC) ?', 'Bitcoin · prix Coinbase', 'event', $t('2026-10-21 12:00'), [['Oui', 1.85], ['Non', 1.80]], ['q:btc'], $t('2026-10-23 12:05'), sp_btc_q(82000, '23/10', '12:00')],
    ['Chelsea - Tottenham', 'Premier League' . $nul, 'foot', $t('2026-10-24 11:00'), [['Chelsea', 1.70], ['Tottenham', 2.00]], ['img/teams/chelsea.png', 'img/teams/tottenham.png'], $t('2026-10-24 19:00')],
    ['Coventry City - Fulham', 'Premier League' . $nul, 'foot', $t('2026-10-24 11:00'), [['Coventry', 1.92], ['Fulham', 1.78]], ['img/teams/coventry.png', 'img/teams/fulham.png'], $t('2026-10-24 19:00')],
    ['Aston Villa - Manchester City', 'Premier League' . $nul, 'foot', $t('2026-10-24 11:00'), [['Aston Villa', 1.98], ['Man City', 1.72]], ['img/teams/aston-villa.png', 'img/teams/man-city.png'], $t('2026-10-24 21:30')],
    ['Volkanovski - Evloev', 'UFC 333 · titre poids plumes', 'mma', $t('2026-10-24 14:00'), [['Volkanovski', 1.85], ['Evloev', 1.85]], [], $t('2026-10-25 00:30')],
    ['Crystal Palace - Newcastle', 'Premier League' . $nul, 'foot', $t('2026-10-25 12:00'), [['Crystal Palace', 1.85], ['Newcastle', 1.85]], ['img/teams/crystal-palace.png', 'img/teams/newcastle.png'], $t('2026-10-25 19:00')],
    ['Hull City - Brentford', 'Premier League' . $nul, 'foot', $t('2026-10-25 12:00'), [['Hull City', 1.95], ['Brentford', 1.75]], ['img/teams/hull-city.png', 'img/teams/brentford.png'], $t('2026-10-25 19:00')],
    ['Sunderland - Leeds United', 'Premier League' . $nul, 'foot', $t('2026-10-25 12:00'), [['Sunderland', 1.80], ['Leeds', 1.90]], ['img/teams/sunderland.png', 'img/teams/leeds.png'], $t('2026-10-25 19:00')],
    ['Manchester United - Bournemouth', 'Premier League' . $nul, 'foot', $t('2026-10-25 12:00'), [['Man United', 1.68], ['Bournemouth', 2.02]], ['img/teams/man-united.png', 'img/teams/bournemouth.png'], $t('2026-10-25 19:00')],
    ['Bitcoin au-dessus de 80 000 $ le samedi 31 octobre à 12 h (UTC) ?', 'Bitcoin · prix Coinbase', 'event', $t('2026-10-29 12:00'), [['Oui', 1.72], ['Non', 1.98]], ['q:btc'], $t('2026-10-31 12:05'), sp_btc_q(80000, '31/10', '12:00')],
    ['Bonfim - Brady', 'UFC Fight Night · Las Vegas', 'mma', $t('2026-11-07 20:00'), [['Bonfim', 1.88], ['Brady', 1.80]], [], $t('2026-11-08 07:00')],
    ['Bitcoin au-dessus de 83 000 $ le dimanche 15 novembre à 12 h (UTC) ?', 'Bitcoin · prix Coinbase', 'event', $t('2026-11-13 12:00'), [['Oui', 1.90], ['Non', 1.80]], ['q:btc'], $t('2026-11-15 12:05'), sp_btc_q(83000, '15/11', '12:00')],
  ];
}
/*
 * v2807 (propriétaire, 18/10/2026) — 3e SÉRIE : matchs et prédictions façon Polymarket / Kalshi / grands bookmakers, du 24/10 au 30/11.
 * Seulement des événements avec une HEURE DE FIN EXACTE et des chances PROCHES (chaque camp entre 40 et 60 % ; foot : 2 équipes
 * proches + nul 27 %). Cote = 0,94 ÷ chance (marge maison 6 %, comme sp_add_draw). Paris fermés au coup d'envoi / départ ;
 * questions de prix : fermées 2 jours avant l'heure de la réponse. Chaque événement a son image (écusson rangé dans img/teams/ —
 * même source que sp_team_logo — ou icône dessinée « q:… »). Vérifié le 18/10/2026 : calendriers officiels (TheSportsDB, clubs,
 * F1 « start times 2026 »), prix Coinbase (BTC 81 900 $, ETH 2 400 $, SOL 104 $, XRP 1,30 $, DOGE 0,079 $), Yahoo Finance
 * (S&P 500 7 660, or 4 200 $, NVDA 214 $, TSLA 355 $, AAPL 343 $), cotes Ballon d'Or (Yamal 10/11, Kane 6/5). Heures en UTC.
 */
function sp_p2o(float $p): float { return max(1.01, floor(0.94 / $p * 100) / 100); }
/** une question « prix au-dessus de … » dans les 12 langues ($v = valeur affichée telle quelle, $d = jj/mm, $h = heure UTC ou '' = clôture de la Bourse). */
function sp_px_q(string $name, string $v, string $d, string $h): array {
  // « 2 400 $ » (écriture française) → « $2,400 » pour l'anglais, l'arabe, le turc, le hindi et le chinois (comme sp_btc_q)
  $w = preg_match('/^([0-9 ]+)(?:[.,]([0-9]+))? \$$/', $v, $mm) ? '$' . str_replace(' ', ',', $mm[1]) . (isset($mm[2]) ? '.' . $mm[2] : '') : str_replace(' ', ',', $v);
  return sp_px_q2($name, $v, $w, $d, $h);
}
function sp_px_q2(string $name, string $v, string $w, string $d, string $h): array {
  if ($h === '') return ['en' => "{$name} above {$w} at the close on {$d}?", 'es' => "¿{$name} por encima de {$v} al cierre del {$d}?", 'pt' => "{$name} acima de {$v} no fechamento de {$d}?",
    'ar' => "هل سيكون {$name} فوق {$w} عند إغلاق {$d}؟", 'tr' => "{$name} {$d} kapanışında {$w} üzerinde mi?", 'vi' => "{$name} trên {$v} khi đóng cửa ngày {$d}?",
    'id' => "{$name} di atas {$v} saat penutupan {$d}?", 'ru' => "{$name} выше {$v} на закрытии {$d}?", 'de' => "{$name} über {$v} zum Handelsschluss am {$d}?",
    'hi' => "क्या {$d} को बंद होने पर {$name} {$w} से ऊपर होगा?", 'zh' => "{$name} 在 {$d} 收盘时是否高于 {$w}？"];
  return ['en' => "{$name} above {$w} on {$d} at {$h} UTC?", 'es' => "¿{$name} por encima de {$v} el {$d} a las {$h} UTC?", 'pt' => "{$name} acima de {$v} em {$d} às {$h} UTC?",
    'ar' => "هل سيكون {$name} فوق {$w} يوم {$d} الساعة {$h} UTC؟", 'tr' => "{$name} {$d} saat {$h} UTC'de {$w} üzerinde mi?", 'vi' => "{$name} trên {$v} vào {$d} lúc {$h} UTC?",
    'id' => "{$name} di atas {$v} pada {$d} pukul {$h} UTC?", 'ru' => "{$name} выше {$v} {$d} в {$h} UTC?", 'de' => "{$name} über {$v} am {$d} um {$h} UTC?",
    'hi' => "क्या {$d} को {$h} UTC पर {$name} {$w} से ऊपर होगा?", 'zh' => "{$name} 在 {$d} {$h} UTC 是否高于 {$w}？"];
}
/** duel F1 : « qui finit devant ? » (si les deux abandonnent : l'admin choisit « Annulé », mises rendues). */
function sp_f1_q(string $gp, string $a, string $b): array {
  return ['en' => "F1 {$gp} GP: {$a} or {$b}, who finishes ahead?", 'es' => "F1 GP de {$gp}: ¿{$a} o {$b}, quién termina delante?", 'pt' => "F1 GP de {$gp}: {$a} ou {$b}, quem termina à frente?",
    'ar' => "فورمولا 1 جائزة {$gp} الكبرى: {$a} أم {$b}، من ينهي في المقدمة؟", 'tr' => "F1 {$gp} GP: {$a} mı {$b} mi, kim önde bitirir?", 'vi' => "F1 GP {$gp}: {$a} hay {$b}, ai về trước?",
    'id' => "F1 GP {$gp}: {$a} atau {$b}, siapa finis lebih depan?", 'ru' => "Ф1, Гран-при {$gp}: {$a} или {$b} — кто финиширует выше?", 'de' => "F1 GP {$gp}: {$a} oder {$b}, wer kommt vorne an?",
    'hi' => "F1 {$gp} GP: {$a} या {$b}, कौन आगे रहेगा?", 'zh' => "F1 {$gp} 大奖赛：{$a} 还是 {$b} 名次更靠前？"];
}
function sp_suggestions3(): array {
  $t = static fn(string $s): int => (int) strtotime($s . ' UTC');
  $D = SP_DRAW_P;
  // foot : [domicile, chance], [extérieur, chance] ; le nul prend 27 %, les deux équipes se partagent le reste
  $foot = static function (string $title, string $lg, string $ko, string $h, float $ph, string $a, string $lh, string $la) use ($t, $D): array {
    $pa = 1 - $D - $ph; $k = $t($ko);
    return [$title, $lg, 'foot', $k, [[$h, sp_p2o($ph)], ['Nul', sp_p2o($D)], [$a, sp_p2o($pa)]], ['img/teams/' . $lh . '.png', 'img/teams/' . $la . '.png'], $k + 7200];
  };
  $duo = static function (string $title, string $lg, string $sport, string $ko, string $h, float $ph, string $a, array $logos, int $len, array $tr = []) use ($t): array {
    $k = $t($ko);
    return [$title, $lg, $sport, $k, [[$h, sp_p2o($ph)], [$a, sp_p2o(1 - $ph)]], $logos, $k + $len, $tr];
  };
  // question Oui / Non : fermée à $close, réponse à $end
  $yn = static function (string $title, string $lg, string $close, string $end, float $pYes, string $img, array $tr) use ($t): array {
    return [$title, $lg, 'event', $t($close), [['Oui', sp_p2o($pYes)], ['Non', sp_p2o(1 - $pYes)]], ['q:' . $img], $t($end), $tr];
  };
  $tm = static fn(string $s): string => 'img/teams/' . $s . '.png';
  $PL = 'Premier League'; $LL = 'LaLiga'; $SA = 'Serie A'; $BL = 'Bundesliga'; $L1 = 'Ligue 1'; $CL = 'Ligue des champions';
  $nba = 'NBA'; $nfl = 'NFL · nul = remboursé'; $f1 = 'Formule 1 · duel'; $cb = 'Crypto · prix Coinbase'; $bo = 'Bourse de New York';
  return [
    // ---------- FOOTBALL (1 · N · 2) ----------
    $foot('Napoli - AS Roma', $SA, '2026-10-24 16:00', 'Napoli', 0.39, 'Roma', 'napoli', 'roma'),
    $foot('Valencia - Villarreal', $LL, '2026-10-24 16:30', 'Valencia', 0.34, 'Villarreal', 'valencia', 'villarreal'),
    $foot('Liverpool - Brighton', $PL, '2026-10-25 14:00', 'Liverpool', 0.41, 'Brighton', 'liverpool', 'brighton'),
    $foot('FC Barcelona - Real Madrid', $LL . ' · El Clásico', '2026-10-25 20:00', 'Barcelona', 0.42, 'Real Madrid', 'barcelona', 'real-madrid'),
    $foot('Chelsea - Manchester United', $PL, '2026-10-31 12:30', 'Chelsea', 0.40, 'Man United', 'chelsea', 'man-united'),
    $foot('Bayer Leverkusen - VfB Stuttgart', $BL, '2026-10-31 14:30', 'Leverkusen', 0.40, 'Stuttgart', 'leverkusen', 'stuttgart'),
    $foot('AC Milan - Inter', $SA . ' · derby', '2026-10-31 19:45', 'Milan', 0.34, 'Inter', 'ac-milan', 'inter'),
    $foot('Liverpool - Arsenal', $PL, '2026-11-01 16:30', 'Liverpool', 0.36, 'Arsenal', 'liverpool', 'arsenal'),
    $foot('Juventus - Napoli', $SA, '2026-11-01 19:45', 'Juventus', 0.38, 'Napoli', 'juventus', 'napoli'),
    $foot('Athletic Bilbao - Real Sociedad', $LL . ' · derby basque', '2026-11-01 20:00', 'Athletic', 0.41, 'Real Sociedad', 'athletic-bilbao', 'real-sociedad'),
    $foot('Atlético Madrid - Bayern Munich', $CL, '2026-11-03 20:00', 'Atlético', 0.34, 'Bayern', 'atletico-madrid', 'bayern'),
    $foot('Villarreal - PSG', $CL, '2026-11-03 20:00', 'Villarreal', 0.32, 'PSG', 'villarreal', 'psg'),
    $foot('Borussia Dortmund - Real Betis', $CL, '2026-11-04 20:00', 'Dortmund', 0.42, 'Betis', 'dortmund', 'real-betis'),
    $foot('RB Leipzig - Manchester City', $CL, '2026-11-04 20:00', 'Leipzig', 0.32, 'Man City', 'leipzig', 'man-city'),
    $foot('Manchester United - Aston Villa', $PL, '2026-11-08 16:30', 'Man United', 0.38, 'Aston Villa', 'man-united', 'aston-villa'),
    $foot('RC Lens - Olympique de Marseille', $L1, '2026-11-08 19:45', 'Lens', 0.37, 'Marseille', 'lens', 'marseille'),
    $foot('Atlético Madrid - FC Barcelona', $LL, '2026-11-08 20:00', 'Atlético', 0.35, 'Barcelona', 'atletico-madrid', 'barcelona'),
    $foot('Newcastle - Arsenal', $PL, '2026-11-21 17:30', 'Newcastle', 0.34, 'Arsenal', 'newcastle', 'arsenal'),
    $foot('Liverpool - Manchester United', $PL, '2026-11-22 16:30', 'Liverpool', 0.42, 'Man United', 'liverpool', 'man-united'),
    $foot('Atalanta - Inter', $SA, '2026-11-22 19:45', 'Atalanta', 0.34, 'Inter', 'atalanta', 'inter'),
    $foot('Club Brugge - Liverpool', $CL, '2026-11-25 20:00', 'Club Brugge', 0.32, 'Liverpool', 'club-brugge', 'liverpool'),
    $foot('Arsenal - Manchester City', $PL, '2026-11-29 16:30', 'Arsenal', 0.38, 'Man City', 'arsenal', 'man-city'),
    $foot('Borussia Dortmund - Bayer Leverkusen', $BL, '2026-11-29 18:30', 'Dortmund', 0.40, 'Leverkusen', 'dortmund', 'leverkusen'),
    // ---------- NBA (pas de nul : prolongation) ----------
    $duo('Miami Heat - Detroit Pistons', $nba, 'basket', '2026-10-24 00:00', 'Heat', 0.47, 'Pistons', [$tm('miami-heat'), $tm('detroit-pistons')], 10800),
    $duo('Atlanta Hawks - Houston Rockets', $nba, 'basket', '2026-10-25 00:30', 'Hawks', 0.47, 'Rockets', [$tm('atlanta-hawks'), $tm('houston-rockets')], 10800),
    $duo('New York Knicks - Detroit Pistons', $nba, 'basket', '2026-10-28 00:00', 'Knicks', 0.52, 'Pistons', [$tm('new-york-knicks'), $tm('detroit-pistons')], 10800),
    $duo('San Antonio Spurs - Minnesota T-Wolves', $nba, 'basket', '2026-11-01 00:00', 'Spurs', 0.56, 'Timberwolves', [$tm('san-antonio-spurs'), $tm('minnesota-timberwolves')], 10800),
    $duo('New York Knicks - Cleveland Cavaliers', $nba, 'basket', '2026-11-12 00:00', 'Knicks', 0.52, 'Cavaliers', [$tm('new-york-knicks'), $tm('cleveland-cavaliers')], 10800),
    // ---------- NFL (match nul très rare = mises rendues) ----------
    $duo('Buffalo Bills - Baltimore Ravens', $nfl, 'autre', '2026-11-01 18:00', 'Bills', 0.54, 'Ravens', [$tm('buffalo-bills'), $tm('baltimore-ravens')], 12600),
    $duo('Detroit Lions - Minnesota Vikings', $nfl, 'autre', '2026-11-01 18:00', 'Lions', 0.52, 'Vikings', [$tm('detroit-lions'), $tm('minnesota-vikings')], 12600),
    $duo('Denver Broncos - Kansas City Chiefs', $nfl, 'autre', '2026-11-01 21:25', 'Broncos', 0.50, 'Chiefs', [$tm('denver-broncos'), $tm('kansas-city-chiefs')], 12600),
    // ---------- FORMULE 1 : duels (qui finit devant ; les deux abandonnent = mises rendues) ----------
    $duo('F1 GP des États-Unis : Leclerc ou Hamilton, qui finit devant ?', $f1, 'event', '2026-10-25 20:00', 'Leclerc', 0.50, 'Hamilton', ['q:race'], 9000, sp_f1_q('United States', 'Leclerc', 'Hamilton')),
    $duo('F1 GP du Mexique : Verstappen ou Russell, qui finit devant ?', $f1, 'event', '2026-11-01 20:00', 'Verstappen', 0.50, 'Russell', ['q:race'], 9000, sp_f1_q('Mexico City', 'Verstappen', 'Russell')),
    $duo('F1 GP du Brésil : Leclerc ou Hamilton, qui finit devant ?', $f1, 'event', '2026-11-08 17:00', 'Leclerc', 0.50, 'Hamilton', ['q:race'], 9000, sp_f1_q('São Paulo', 'Leclerc', 'Hamilton')),
    $duo('F1 GP de Las Vegas : Verstappen ou Russell, qui finit devant ?', $f1, 'event', '2026-11-22 04:00', 'Verstappen', 0.50, 'Russell', ['q:race'], 9000, sp_f1_q('Las Vegas', 'Verstappen', 'Russell')),
    // ---------- STARS / BUZZ ----------
    $yn('Ballon d’Or 2026 (lundi 26/10, Londres) : Lamine Yamal sacré ?', 'Ballon d’Or · stars', '2026-10-25 12:00', '2026-10-26 22:30', 0.52, 'trophy',
      ['en' => 'Ballon d’Or 2026 (Mon 26/10, London): will Lamine Yamal win?', 'es' => 'Balón de Oro 2026 (lunes 26/10, Londres): ¿lo gana Lamine Yamal?', 'pt' => 'Bola de Ouro 2026 (seg. 26/10, Londres): Lamine Yamal vence?',
       'ar' => 'الكرة الذهبية 2026 (الاثنين 26/10، لندن): هل يفوز لامين يامال؟', 'tr' => 'Ballon d’Or 2026 (26/10 Pazartesi, Londra): Lamine Yamal kazanır mı?', 'vi' => 'Quả bóng vàng 2026 (thứ Hai 26/10, London): Lamine Yamal đoạt giải?',
       'id' => 'Ballon d’Or 2026 (Senin 26/10, London): Lamine Yamal menang?', 'ru' => 'Золотой мяч 2026 (пн 26/10, Лондон): победит Ламин Ямаль?', 'de' => 'Ballon d’Or 2026 (Mo. 26.10., London): Gewinnt Lamine Yamal?',
       'hi' => 'बैलन डी’ओर 2026 (सोमवार 26/10, लंदन): क्या लामिन यमाल जीतेंगे?', 'zh' => '2026 金球奖（10月26日周一，伦敦）：亚马尔能获奖吗？']),
    $yn('Nouveau Hunger Games : plus de 75 M$ au 1er week-end aux USA (20-22/11) ?', 'Box-office USA · cinéma', '2026-11-19 23:00', '2026-11-22 20:00', 0.50, 'film',
      ['en' => 'New Hunger Games film: over $75M on its US opening weekend (20-22/11)?', 'es' => 'Nueva película de Los Juegos del Hambre: ¿más de 75 M$ en su estreno en EE. UU. (20-22/11)?', 'pt' => 'Novo Jogos Vorazes: mais de 75 mi $ na estreia nos EUA (20-22/11)?',
       'ar' => 'فيلم ألعاب الجوع الجديد: أكثر من 75 مليون $ في أول عطلة بأمريكا (20-22/11)؟', 'tr' => 'Yeni Açlık Oyunları: ABD açılış hafta sonu 75 milyon $ üstü mü (20-22/11)?', 'vi' => 'Hunger Games mới: hơn 75 triệu $ cuối tuần ra mắt ở Mỹ (20-22/11)?',
       'id' => 'Hunger Games baru: lebih dari 75 juta $ di pekan perdana AS (20-22/11)?', 'ru' => 'Новые «Голодные игры»: больше 75 млн $ за стартовый уикенд в США (20-22/11)?', 'de' => 'Neuer Tribute-von-Panem-Film: über 75 Mio. $ am US-Startwochenende (20.-22.11.)?',
       'hi' => 'नई हंगर गेम्स फ़िल्म: अमेरिका में पहले वीकेंड (20-22/11) 75 मिलियन $ से ज़्यादा?', 'zh' => '新《饥饿游戏》：北美首周末（11/20-22）票房超 7500 万美元？']),
    // ---------- BOURSE / ACTU ÉCO ----------
    $yn('Tesla au-dessus de 350 $ à la clôture du vendredi 30 octobre ?', $bo, '2026-10-28 20:00', '2026-10-30 20:15', 0.52, 'chart', sp_px_q('Tesla', '350 $', '30/10', '')),
    $yn('Apple au-dessus de 340 $ à la clôture du vendredi 30 octobre ?', $bo, '2026-10-28 20:00', '2026-10-30 20:15', 0.53, 'chart', sp_px_q('Apple', '340 $', '30/10', '')),
    $yn('Nvidia au-dessus de 215 $ à la clôture du vendredi 20 novembre ?', $bo . ' · résultats Nvidia', '2026-11-17 21:00', '2026-11-20 21:15', 0.50, 'chart', sp_px_q('Nvidia', '215 $', '20/11', '')),
    $yn('S&P 500 au-dessus de 7 700 points à la clôture du vendredi 20 novembre ?', $bo, '2026-11-18 21:00', '2026-11-20 21:15', 0.50, 'chart', sp_px_q('S&P 500', '7 700', '20/11', '')),
    $yn('L’or au-dessus de 4 200 $ l’once le vendredi 27/11 (prix LBMA de 15 h UTC) ?', 'Or · prix LBMA', '2026-11-25 15:00', '2026-11-27 15:30', 0.50, 'gold', sp_px_q('Gold (LBMA)', '4 200 $', '27/11', '15:00')),
    // ---------- CRYPTO (prix Coinbase à l'heure dite ; fermé 2 jours avant) ----------
    $yn('Bitcoin au-dessus de 82 000 $ le dimanche 1er novembre à 0 h (UTC) ?', $cb, '2026-10-30 00:00', '2026-11-01 00:05', 0.50, 'btc', sp_btc_q(82000, '01/11', '00:00')),
    $yn('Bitcoin au-dessus de 80 000 $ le dimanche 22 novembre à 12 h (UTC) ?', $cb, '2026-11-20 12:00', '2026-11-22 12:05', 0.58, 'btc', sp_btc_q(80000, '22/11', '12:00')),
    $yn('Bitcoin au-dessus de 85 000 $ le lundi 30 novembre à 12 h (UTC) ?', $cb, '2026-11-28 12:00', '2026-11-30 12:05', 0.42, 'btc', sp_btc_q(85000, '30/11', '12:00')),
    $yn('Ethereum au-dessus de 2 400 $ le samedi 31 octobre à 12 h (UTC) ?', $cb, '2026-10-29 12:00', '2026-10-31 12:05', 0.50, 'eth', sp_px_q('Ethereum', '2 400 $', '31/10', '12:00')),
    $yn('Ethereum au-dessus de 2 500 $ le lundi 30 novembre à 12 h (UTC) ?', $cb, '2026-11-28 12:00', '2026-11-30 12:05', 0.42, 'eth', sp_px_q('Ethereum', '2 500 $', '30/11', '12:00')),
    $yn('Solana au-dessus de 105 $ le dimanche 8 novembre à 12 h (UTC) ?', $cb, '2026-11-06 12:00', '2026-11-08 12:05', 0.48, 'sol', sp_px_q('Solana', '105 $', '08/11', '12:00')),
    $yn('XRP au-dessus de 1,30 $ le dimanche 15 novembre à 12 h (UTC) ?', $cb, '2026-11-13 12:00', '2026-11-15 12:05', 0.50, 'xrp', sp_px_q('XRP', '1,30 $', '15/11', '12:00')),
    $yn('Dogecoin au-dessus de 0,08 $ le samedi 7 novembre à 12 h (UTC) ?', $cb, '2026-11-05 12:00', '2026-11-07 12:05', 0.49, 'doge', sp_px_q('Dogecoin', '0,08 $', '07/11', '12:00')),
  ];
}
/*
 * 2026-10-21 (propriétaire : « Paris : trop peu d'événements ») — 4e SÉRIE : les grands événements réels de la semaine
 * (Ligue Europa J3 du jeudi 22/10, Ligue 1 / Serie A / Bundesliga du week-end, NBA) + quelques questions façon
 * « Combien de buts dans PSG – Barcelone ? ». Matchs PROCHES choisis d'après les cotes des bookmakers relevées le 20/10/2026
 * (Megapari via oddscalendar.com, moyenne des bookmakers UK via bettingodds.com, DraftKings via scoresandstats.com / gainblers.com).
 * Cotes OROLADO = cote du marché BAISSÉE (sp_m2o) : ×0,92 jusqu'à 2,50 (2,00 → 1,84), ×0,90 jusqu'à 4,00, ×0,88 au-delà —
 * la maison garde toujours plus que 6 % (somme des 1/cote ≥ 1/0,94, vérifié par scripts/test-paris-seed4.php).
 * Heures en UTC = coup d'envoi / début réel (heure d'été en Europe jusqu'au 25/10 à 1 h UTC, aux États-Unis jusqu'au 1/11).
 * Fin réelle : foot +2 h, NBA +3 h (l'admin est prévenu à ce moment-là et donne le résultat ; « Annulé » = mises rendues).
 */
function sp_m2o(float $m): float { $k = $m <= 2.5 ? 0.92 : ($m <= 4.0 ? 0.90 : 0.88); return max(1.01, floor($m * $k * 100 + 1e-6) / 100); }
/** Cotes d'un événement : si les cotes relevées gardent déjà une grosse marge (moyenne des bookmakers UK ≈ 8-11 %), on les
 *  ramène d'abord à une marge de bookmaker normale (4 %) puis on baisse avec sp_m2o — chaque cote reste SOUS la cote du marché. */
function sp_mset(array $m): array {
  $s = 0.0; foreach ($m as $v) $s += 1 / $v;
  $f = $s > 1.04 ? $s / 1.04 : 1.0;
  return array_map(static fn($v) => min(sp_m2o($v * $f), floor($v * 0.95 * 100) / 100), $m);
}
function sp_suggestions4(): array {
  $t = static fn(string $s): int => (int) strtotime($s . ' UTC');
  $tm = static fn(string $s): string => 'img/teams/' . $s . '.png';
  // foot 1 · N · 2 : cotes du marché [domicile, nul, extérieur]
  $foot = static function (string $title, string $lg, string $ko, string $h, string $a, array $m, string $lh, string $la) use ($t, $tm): array {
    $k = $t($ko); $o = sp_mset($m);
    return [$title, $lg, 'foot', $k, [[$h, $o[0]], ['Nul', $o[1]], [$a, $o[2]]], [$tm($lh), $tm($la)], $k + 7200];
  };
  // NBA (pas de nul : prolongation) : cotes du marché [domicile, extérieur]
  $nba = static function (string $title, string $ko, string $h, string $a, array $m, string $lh, string $la) use ($t, $tm): array {
    $k = $t($ko); $o = sp_mset($m);
    return [$title, 'NBA', 'basket', $k, [[$h, $o[0]], [$a, $o[1]]], [$tm($lh), $tm($la)], $k + 10800];
  };
  // question Oui / Non (simple seulement) : cotes du marché (ou probabilité du modèle cité) [oui, non]
  $yn = static function (string $title, string $lg, string $ko, int $len, array $m, string $img, array $tr) use ($t): array {
    $k = $t($ko); $o = sp_mset($m);
    return [$title, $lg, 'event', $k, [['Oui', $o[0]], ['Non', $o[1]]], [$img], $k + $len, $tr];
  };
  $EL = 'Ligue Europa'; $L1 = 'Ligue 1'; $SA = 'Serie A'; $BL = 'Bundesliga';
  return [
    // mer. 21/10 — NBA : Heat -115 / Wolves -105 (DraftKings, 20/10)
    $nba('Miami Heat - Minnesota T-Wolves', '2026-10-21 23:30', 'Heat', 'Timberwolves', [1.87, 1.95], 'miami-heat', 'minnesota-timberwolves'),
    // jeu. 22/10 2 h UTC — NBA : Lakers -225 / Warriors +185 ; total 234,5 points à -110 / -110 (DraftKings, 20/10)
    $nba('Los Angeles Lakers - Golden State Warriors', '2026-10-22 02:00', 'Lakers', 'Warriors', [1.44, 2.85], 'los-angeles-lakers', 'golden-state-warriors'),
    $yn('Lakers – Warriors : plus de 234,5 points au total ?', 'NBA · total de points', '2026-10-22 02:00', 10800, [1.91, 1.91], $tm('los-angeles-lakers'),
      ['en' => 'Lakers – Warriors: over 234.5 total points?', 'es' => 'Lakers – Warriors: ¿más de 234,5 puntos en total?', 'pt' => 'Lakers – Warriors: mais de 234,5 pontos no total?',
       'ar' => 'ليكرز – ووريورز: أكثر من 234.5 نقطة في المجموع؟', 'tr' => 'Lakers – Warriors: toplam 234,5 sayı üstü mü?', 'vi' => 'Lakers – Warriors: tổng trên 234,5 điểm?',
       'id' => 'Lakers – Warriors: total lebih dari 234,5 poin?', 'ru' => 'Лейкерс – Уорриорз: больше 234,5 очков в сумме?', 'de' => 'Lakers – Warriors: über 234,5 Punkte insgesamt?',
       'hi' => 'लेकर्स – वॉरियर्स: कुल 234.5 से ज़्यादा अंक?', 'zh' => '湖人 – 勇士：总分超过 234.5 分？']),
    // jeu. 22/10 — Ligue Europa J3 (18 h 45 / 21 h heure de Paris = 16 h 45 / 19 h UTC ; cotes Megapari et moyenne UK)
    $foot('Sturm Graz - Olympique de Marseille', $EL, '2026-10-22 16:45', 'Sturm Graz', 'Marseille', [3.60, 3.73, 2.06], 'sturm-graz', 'marseille'),
    $foot('Bournemouth - AC Milan', $EL, '2026-10-22 19:00', 'Bournemouth', 'Milan', [2.15, 3.67, 3.40], 'bournemouth', 'ac-milan'),
    $yn('Bournemouth – Milan : les deux équipes marquent ?', $EL, '2026-10-22 19:00', 7200, [1.82, 2.22], 'q:ball',
      ['en' => 'Bournemouth – Milan: will both teams score?', 'es' => 'Bournemouth – Milan: ¿marcan ambos equipos?', 'pt' => 'Bournemouth – Milan: ambas as equipes marcam?',
       'ar' => 'بورنموث – ميلان: هل يسجل الفريقان؟', 'tr' => 'Bournemouth – Milan: iki takım da gol atar mı?', 'vi' => 'Bournemouth – Milan: cả hai đội cùng ghi bàn?',
       'id' => 'Bournemouth – Milan: kedua tim mencetak gol?', 'ru' => 'Борнмут – Милан: обе забьют?', 'de' => 'Bournemouth – Milan: Treffen beide Teams?',
       'hi' => 'बोर्नमाउथ – मिलान: क्या दोनों टीमें गोल करेंगी?', 'zh' => '伯恩茅斯 – AC米兰：两队都有进球？']),
    $foot('Beşiktaş - Crystal Palace', $EL, '2026-10-22 19:00', 'Beşiktaş', 'Crystal Palace', [2.15, 3.81, 3.29], 'besiktas', 'crystal-palace'),
    $yn('Beşiktaş – Crystal Palace : 3 buts ou plus dans le match ?', $EL, '2026-10-22 19:00', 7200, [1.61, 2.63], 'q:ball',
      ['en' => 'Beşiktaş – Crystal Palace: 3 or more goals in the match?', 'es' => 'Beşiktaş – Crystal Palace: ¿3 goles o más en el partido?', 'pt' => 'Beşiktaş – Crystal Palace: 3 gols ou mais no jogo?',
       'ar' => 'بشكتاش – كريستال بالاس: 3 أهداف أو أكثر في المباراة؟', 'tr' => 'Beşiktaş – Crystal Palace: maçta 3 veya daha fazla gol?', 'vi' => 'Beşiktaş – Crystal Palace: trận đấu có từ 3 bàn trở lên?',
       'id' => 'Beşiktaş – Crystal Palace: 3 gol atau lebih di laga ini?', 'ru' => 'Бешикташ – Кристал Пэлас: 3 гола и больше в матче?', 'de' => 'Beşiktaş – Crystal Palace: 3 oder mehr Tore im Spiel?',
       'hi' => 'बेशिक्ताश – क्रिस्टल पैलेस: मैच में 3 या ज़्यादा गोल?', 'zh' => '贝西克塔斯 – 水晶宫：全场 3 球或以上？']),
    $foot('Hoffenheim - Olympique Lyonnais', $EL, '2026-10-22 19:00', 'Hoffenheim', 'Lyon', [1.95, 3.75, 3.00], 'hoffenheim', 'lyon'),
    $foot('Celtic - Celta Vigo', $EL, '2026-10-22 19:00', 'Celtic', 'Celta', [2.62, 3.50, 2.40], 'celtic', 'celta-vigo'),
    // ven. 23/10
    $foot('Stade Brestois - OGC Nice', $L1, '2026-10-23 18:45', 'Brest', 'Nice', [2.20, 3.50, 3.00], 'brest', 'nice'),
    $nba('Boston Celtics - New York Knicks', '2026-10-23 23:00', 'Celtics', 'Knicks', [1.76, 2.10], 'boston-celtics', 'new-york-knicks'),
    // sam. 24/10
    $foot('Cagliari - Bologna', $SA, '2026-10-24 13:00', 'Cagliari', 'Bologna', [3.00, 3.00, 2.40], 'cagliari', 'bologna'),
    $foot('RC Lens - Paris FC', $L1, '2026-10-24 18:45', 'Lens', 'Paris FC', [2.25, 3.60, 2.75], 'lens', 'paris-fc'),
    // dim. 25/10 (heure d'hiver en Europe : 15 h à Paris = 14 h UTC)
    $foot('AS Monaco - LOSC Lille', $L1, '2026-10-25 14:00', 'Monaco', 'Lille', [2.10, 3.40, 3.25], 'monaco', 'lille'),
    $foot('Hoffenheim - Bayer Leverkusen', $BL, '2026-10-25 14:30', 'Hoffenheim', 'Leverkusen', [2.62, 3.80, 2.30], 'hoffenheim', 'leverkusen'),
    // PSG – Lyon (20 h 45 à Paris = 19 h 45 UTC) : plus de 2,5 buts 61 % (modèle sportsedge ; 1,61 chez 1xBet au dernier PSG – OL)
    $yn('PSG – Lyon : 3 buts ou plus dans le match ?', $L1, '2026-10-25 19:45', 7200, [1.61, 2.56], 'q:ball',
      ['en' => 'PSG – Lyon: 3 or more goals in the match?', 'es' => 'PSG – Lyon: ¿3 goles o más en el partido?', 'pt' => 'PSG – Lyon: 3 gols ou mais no jogo?',
       'ar' => 'باريس سان جيرمان – ليون: 3 أهداف أو أكثر في المباراة؟', 'tr' => 'PSG – Lyon: maçta 3 veya daha fazla gol?', 'vi' => 'PSG – Lyon: trận đấu có từ 3 bàn trở lên?',
       'id' => 'PSG – Lyon: 3 gol atau lebih di laga ini?', 'ru' => 'ПСЖ – Лион: 3 гола и больше в матче?', 'de' => 'PSG – Lyon: 3 oder mehr Tore im Spiel?',
       'hi' => 'PSG – ल्यों: मैच में 3 या ज़्यादा गोल?', 'zh' => '巴黎圣日耳曼 – 里昂：全场 3 球或以上？']),
  ];
}
/*
 * 2026-10-21 (propriétaire : « 15-20 nouveaux grands événements avant la pub ») — 5e SÉRIE : Ligue des champions,
 * journées 4 (mar. 3 et mer. 4/11) et 5 (mar. 24 et mer. 25/11). Affiches et heures vérifiées le 21/10/2026 sur la page
 * officielle UEFA « 2026/27 Champions League: all the league phase fixtures » (21 h heure de Paris sauf 18 h 45 indiqué ;
 * novembre = heure d'hiver : 21 h = 20 h UTC, 18 h 45 = 17 h 45 UTC). Seuls les matchs pas encore publiés (les séries 3/4 ont
 * déjà Atlético – Bayern, Villarreal – PSG, Dortmund – Betis, Leipzig – City, Brugge – Liverpool).
 * Cotes : chances 1 · N · 2 estimées (niveau des équipes, domicile), cote = 0,94 ÷ chance arrondie VERS LE BAS (sp_p2o) :
 * la maison garde toujours au moins 6 % (somme des 1/cote ≥ 1/0,94), comme les séries 3 / 4. Fin réelle = coup d'envoi + 2 h.
 */
function sp_suggestions5(): array {
  $t = static fn(string $s): int => (int) strtotime($s . ' UTC');
  $foot = static function (string $title, string $ko, string $h, string $a, float $ph, float $pd, float $pa, string $lh, string $la) use ($t): array {
    $k = $t($ko);
    return [$title, 'Ligue des champions', 'foot', $k, [[$h, sp_p2o($ph)], ['Nul', sp_p2o($pd)], [$a, sp_p2o($pa)]], ['img/teams/' . $lh . '.png', 'img/teams/' . $la . '.png'], $k + 7200];
  };
  return [
    // J4 — mardi 3 novembre
    $foot('Galatasaray - VfB Stuttgart', '2026-11-03 17:45', 'Galatasaray', 'Stuttgart', 0.40, 0.26, 0.34, 'galatasaray', 'stuttgart'),
    $foot('FC Barcelona - Aston Villa', '2026-11-03 20:00', 'Barcelona', 'Aston Villa', 0.62, 0.20, 0.18, 'barcelona', 'aston-villa'),
    $foot('Feyenoord - Inter', '2026-11-03 20:00', 'Feyenoord', 'Inter', 0.28, 0.26, 0.46, 'feyenoord', 'inter'),
    $foot('Manchester United - AS Roma', '2026-11-03 20:00', 'Man United', 'Roma', 0.47, 0.27, 0.26, 'man-united', 'roma'),
    // J4 — mercredi 4 novembre
    $foot('AEK Athens - Real Madrid', '2026-11-04 17:45', 'AEK', 'Real Madrid', 0.16, 0.20, 0.64, 'aek-athens', 'real-madrid'),
    $foot('Fenerbahçe - Liverpool', '2026-11-04 17:45', 'Fenerbahçe', 'Liverpool', 0.25, 0.24, 0.51, 'fenerbahce', 'liverpool'),
    $foot('FC Porto - Napoli', '2026-11-04 20:00', 'Porto', 'Napoli', 0.38, 0.29, 0.33, 'porto', 'napoli'),
    $foot('PSV Eindhoven - Club Brugge', '2026-11-04 20:00', 'PSV', 'Club Brugge', 0.50, 0.25, 0.25, 'psv', 'club-brugge'),
    $foot('RC Lens - Como', '2026-11-04 20:00', 'Lens', 'Como', 0.42, 0.28, 0.30, 'lens', 'como'),
    $foot('Slavia Prague - Arsenal', '2026-11-04 20:00', 'Slavia', 'Arsenal', 0.17, 0.23, 0.60, 'slavia-praha', 'arsenal'),
    // J5 — mardi 24 novembre
    $foot('Galatasaray - Aston Villa', '2026-11-24 17:45', 'Galatasaray', 'Aston Villa', 0.38, 0.26, 0.36, 'galatasaray', 'aston-villa'),
    $foot('Arsenal - Borussia Dortmund', '2026-11-24 20:00', 'Arsenal', 'Dortmund', 0.58, 0.22, 0.20, 'arsenal', 'dortmund'),
    $foot('Manchester City - Napoli', '2026-11-24 20:00', 'Man City', 'Napoli', 0.57, 0.23, 0.20, 'man-city', 'napoli'),
    $foot('Real Madrid - PSV Eindhoven', '2026-11-24 20:00', 'Real Madrid', 'PSV', 0.65, 0.19, 0.16, 'real-madrid', 'psv'),
    // J5 — mercredi 25 novembre
    $foot('Inter - VfB Stuttgart', '2026-11-25 20:00', 'Inter', 'Stuttgart', 0.55, 0.24, 0.21, 'inter', 'stuttgart'),
    $foot('LOSC Lille - Bayern Munich', '2026-11-25 20:00', 'Lille', 'Bayern', 0.22, 0.23, 0.55, 'lille', 'bayern'),
    $foot('PSG - AS Roma', '2026-11-25 20:00', 'PSG', 'Roma', 0.60, 0.22, 0.18, 'psg', 'roma'),
    $foot('Sporting CP - Manchester United', '2026-11-25 20:00', 'Sporting', 'Man United', 0.43, 0.26, 0.31, 'sporting', 'man-united'),
  ];
}
/*
 * 2026-10-21 (propriétaire : « les cotes ne doivent pas être nos estimations ») — VRAIES COTES DU MARCHÉ.
 * Source : cote MOYENNE des bookmakers affichée par betexplorer.com (pages « fixtures » de chaque compétition, colonne 1 X 2,
 * nombre de bookmakers indiqué), relevée le 21/10/2026 vers 05:00 UTC ; l'adresse de chaque match est gardée ci-dessous.
 * Calcul (sp_mkt_odds) : cote moyenne → probabilité (1/cote), normalisée (somme = 1), puis cote OROLADO = 0,94 ÷ probabilité
 * arrondie VERS LE BAS (marge maison 6 %), et toujours au moins 0,01 SOUS la cote moyenne du marché.
 * Seuls les événements publiés par les séries (sp_suggestions…) changent. Ceux qui n'ont pas de cote du marché avec au moins
 * 3 bookmakers (pas encore cotés, questions spéciales, MMA, F1, Ballon d'Or, box-office, NFL…) passent « en attente »
 * (hold : cachés, aucun pari ; l'admin les rouvre en posant de vraies cotes). Paris déjà pris : intacts (chaque pari garde SA cote).
 */
function sp_market_2026_10_21(): array {
  return [
    'Como - Manchester United' => [[2.15, 3.81, 3.05], 11, 'https://www.betexplorer.com/football/europe/champions-league/como-manchester-united/UTWLyE6T/'],  // 11 bookmakers
    'Lille - Galatasaray' => [[2.22, 3.70, 3.00], 11, 'https://www.betexplorer.com/football/europe/champions-league/lille-galatasaray/nRzlASTh/'],  // 11 bookmakers
    'Bayern Munich - Arsenal' => [[2.04, 3.85, 3.28], 11, 'https://www.betexplorer.com/football/europe/champions-league/bayern-munich-arsenal/OIffEkYO/'],  // 11 bookmakers
    'Club Brugge - RC Lens' => [[1.97, 4.06, 3.35], 11, 'https://www.betexplorer.com/football/europe/champions-league/club-brugge-lens/hC5ThCtS/'],  // 11 bookmakers
    'Real Betis - Feyenoord' => [[1.57, 4.61, 5.00], 11, 'https://www.betexplorer.com/football/europe/champions-league/betis-feyenoord/CjRjR5nf/'],  // 11 bookmakers
    'Miami Heat - Minnesota T-Wolves' => [[1.83, 1.99], 4, 'https://www.betexplorer.com/basketball/usa/nba/miami-heat-minnesota-timberwolves/p2lSBos3/'],  // 4 bookmakers
    'Los Angeles Lakers - Golden State Warriors' => [[1.45, 2.81], 4, 'https://www.betexplorer.com/basketball/usa/nba/los-angeles-lakers-golden-state-warriors/WInzAPBF/'],  // 4 bookmakers
    'Sturm Graz - Olympique de Marseille' => [[3.48, 3.63, 2.03], 3, 'https://www.betexplorer.com/football/europe/europa-league/sturm-graz-marseille/OKaB8iRE/'],  // 3 bookmakers
    'Bournemouth - AC Milan' => [[2.07, 3.68, 3.30], 3, 'https://www.betexplorer.com/football/europe/europa-league/bournemouth-ac-milan/OWgU2DyA/'],  // 3 bookmakers
    'Beşiktaş - Crystal Palace' => [[2.33, 3.62, 2.93], 3, 'https://www.betexplorer.com/football/europe/europa-league/besiktas-crystal-palace/WpNi9biD/'],  // 3 bookmakers
    'Hoffenheim - Olympique Lyonnais' => [[2.10, 3.82, 3.18], 3, 'https://www.betexplorer.com/football/europe/europa-league/hoffenheim-lyon/0lLMoF1B/'],  // 3 bookmakers
    'Celtic - Celta Vigo' => [[2.70, 3.50, 2.50], 3, 'https://www.betexplorer.com/football/europe/europa-league/celtic-celta-vigo/4CbZfmF5/'],  // 3 bookmakers
    'Stade Brestois - OGC Nice' => [[2.21, 3.45, 3.09], 12, 'https://www.betexplorer.com/football/france/ligue-1/brest-nice/bXIA0PLG/'],  // 12 bookmakers
    'Chelsea - Tottenham' => [[1.69, 4.22, 4.44], 10, 'https://www.betexplorer.com/football/england/premier-league/chelsea-tottenham/GKNFEr23/'],  // 10 bookmakers
    'Coventry City - Fulham' => [[2.95, 3.47, 2.34], 10, 'https://www.betexplorer.com/football/england/premier-league/coventry-fulham/OpRNCMWF/'],  // 10 bookmakers
    'Aston Villa - Manchester City' => [[4.42, 4.12, 1.71], 10, 'https://www.betexplorer.com/football/england/premier-league/aston-villa-manchester-city/lEVTjuAd/'],  // 10 bookmakers
    'Cagliari - Bologna' => [[3.09, 3.07, 2.43], 12, 'https://www.betexplorer.com/football/italy/serie-a/cagliari-bologna/OnWnTsYg/'],  // 12 bookmakers
    'Napoli - AS Roma' => [[2.78, 3.33, 2.48], 10, 'https://www.betexplorer.com/football/italy/serie-a/napoli-as-roma/SzXZwanC/'],  // 10 bookmakers
    'Valencia - Villarreal' => [[3.21, 3.63, 2.13], 10, 'https://www.betexplorer.com/football/spain/laliga/valencia-villarreal/ELhT9X9m/'],  // 10 bookmakers
    'RC Lens - Paris FC' => [[2.29, 3.59, 2.83], 12, 'https://www.betexplorer.com/football/france/ligue-1/lens-paris-fc/UJurrH5k/'],  // 12 bookmakers
    'Crystal Palace - Newcastle' => [[2.86, 3.59, 2.36], 10, 'https://www.betexplorer.com/football/england/premier-league/crystal-palace-newcastle-utd/fXmefEGl/'],  // 10 bookmakers
    'Hull City - Brentford' => [[4.35, 3.89, 1.76], 10, 'https://www.betexplorer.com/football/england/premier-league/hull-city-brentford/tln3hho1/'],  // 10 bookmakers
    'Sunderland - Leeds United' => [[2.90, 3.23, 2.51], 10, 'https://www.betexplorer.com/football/england/premier-league/sunderland-leeds/ImWz7i0f/'],  // 10 bookmakers
    'Manchester United - Bournemouth' => [[1.86, 3.86, 3.92], 10, 'https://www.betexplorer.com/football/england/premier-league/manchester-united-bournemouth/CjTS8DVs/'],  // 10 bookmakers
    'Liverpool - Brighton' => [[2.13, 3.82, 3.12], 10, 'https://www.betexplorer.com/football/england/premier-league/liverpool-brighton/t8xcEZ7K/'],  // 10 bookmakers
    'AS Monaco - LOSC Lille' => [[2.11, 3.36, 3.36], 12, 'https://www.betexplorer.com/football/france/ligue-1/monaco-lille/2Nzx4bS8/'],  // 12 bookmakers
    'Hoffenheim - Bayer Leverkusen' => [[2.70, 3.98, 2.31], 10, 'https://www.betexplorer.com/football/germany/bundesliga/hoffenheim-bayer-leverkusen/WKgSBVY2/'],  // 10 bookmakers
    'FC Barcelona - Real Madrid' => [[1.60, 5.38, 4.14], 10, 'https://www.betexplorer.com/football/spain/laliga/barcelona-real-madrid/6ZoODtBL/'],  // 10 bookmakers
    'Chelsea - Manchester United' => [[1.89, 3.92, 3.69], 6, 'https://www.betexplorer.com/football/england/premier-league/chelsea-manchester-united/OWc65atm/'],  // 6 bookmakers
    'Bayer Leverkusen - VfB Stuttgart' => [[1.78, 4.31, 3.72], 7, 'https://www.betexplorer.com/football/germany/bundesliga/bayer-leverkusen-vfb-stuttgart/nFCn4vXg/'],  // 7 bookmakers
    'Liverpool - Arsenal' => [[3.19, 3.59, 2.14], 6, 'https://www.betexplorer.com/football/england/premier-league/liverpool-arsenal/xxDTaeAO/'],  // 6 bookmakers
    'Athletic Bilbao - Real Sociedad' => [[2.01, 3.56, 3.58], 4, 'https://www.betexplorer.com/football/spain/laliga/ath-bilbao-real-sociedad/Mody8Bv0/'],  // 4 bookmakers
  ];
}
/** cotes OROLADO depuis les cotes moyennes du marché (même ordre : 1 · N · 2, ou domicile · extérieur). */
function sp_mkt_odds(array $m): array {
  $inv = 0.0; foreach ($m as $v) $inv += 1 / (float) $v;
  $out = [];
  foreach ($m as $v) {
    $p = (1 / (float) $v) / $inv;
    $o = floor(0.94 / $p * 100 + 1e-6) / 100;
    $o = min($o, floor((float) $v * 100 + 1e-6) / 100 - 0.01); // toujours SOUS la cote du marché
    $out[] = max(1.01, round($o, 2));
  }
  return $out;
}
/** Applique les cotes du marché (une fois, voir sp_autoseed_once). Retour : ['priced' => n, 'held' => n]. */
function sp_market_fix(int $now = 0): array {
  $now = $now ?: time();
  $seeded = [];
  foreach ([sp_suggestions(), sp_suggestions2(), sp_suggestions3(), sp_suggestions4(), sp_suggestions5()] as $list) foreach ($list as $row) $seeded[sp_lower((string) $row[0])] = 1;
  $mk = [];
  foreach (sp_market_2026_10_21() as $t => $row) $mk[sp_lower((string) $t)] = $row;
  return (array) sp_with('events.json', static function (array &$s) use ($seeded, $mk, $now) {
    $priced = 0; $held = 0;
    foreach ((array) ($s['e'] ?? []) as $i => $e) {
      if (($e['status'] ?? '') !== 'open' || !isset($seeded[sp_lower((string) ($e['title'] ?? ''))])) continue; // événements de l'admin : pas touchés
      $row = $mk[sp_lower((string) $e['title'])] ?? null;
      $opts = array_values((array) ($e['opts'] ?? []));
      $ok = $row && (int) $row[1] >= 3 && count($row[0]) === count($opts) && (count($opts) !== 3 || preg_match('/^(nul|draw|x)$/i', trim((string) $opts[1]['label'])));
      if (!$ok) { if (empty($e['hold'])) { $s['e'][$i]['hold'] = 'market'; $held++; } continue; }
      $odds = sp_mkt_odds($row[0]);
      foreach ($opts as $j => $o) $s['e'][$i]['opts'][$j]['odd'] = $odds[$j]; // mêmes clés (o0 / oD / o1) : les paris pris gardent leur choix ET leur cote
      $s['e'][$i]['mkt'] = ['src' => (string) $row[2], 'avg' => array_map('floatval', $row[0]), 'n' => (int) $row[1], 'at' => $now];
      unset($s['e'][$i]['hold']);
      $priced++;
    }
    return ['priced' => $priced, 'held' => $held];
  });
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
  // v2807 : 3e série (matchs et prédictions serrés jusqu'au 30/11, chacun avec son image), une seule fois aussi
  $flag3 = sp_dir() . DIRECTORY_SEPARATOR . 'seed-2026-10c.done';
  if (!is_file($flag3)) {
    @file_put_contents($flag3, (string) time());
    try { sp_admin_seed(sp_suggestions3()); } catch (Throwable $e) { @unlink($flag3); }
  }
  // 2026-10-21 : 4e série (grands matchs réels de la semaine + questions), une seule fois aussi
  $flag5 = sp_dir() . DIRECTORY_SEPARATOR . 'seed-2026-10d.done';
  if (!is_file($flag5)) {
    @file_put_contents($flag5, (string) time());
    try { sp_admin_seed(sp_suggestions4()); } catch (Throwable $e) { @unlink($flag5); }
  }
  // 2026-10-21 (b) : 5e série (Ligue des champions J4 et J5, 18 matchs), une seule fois aussi
  $flag6 = sp_dir() . DIRECTORY_SEPARATOR . 'seed-2026-10e.done';
  if (!is_file($flag6)) {
    @file_put_contents($flag6, (string) time());
    try { sp_admin_seed(sp_suggestions5()); } catch (Throwable $e) { @unlink($flag6); }
  }
  sp_draw_once(); // v2802 : le nul revient au football (matchs encore sans pari)
  // 2026-10-21 (propriétaire : « pas nos propres estimations ») : vraies cotes du marché sur les événements publiés par les séries,
  // ceux sans cote du marché sont mis en attente (cachés). Une seule fois, APRÈS toutes les séries et le nul.
  $flag7 = sp_dir() . DIRECTORY_SEPARATOR . 'market-2026-10-21.done';
  if (!is_file($flag7)) {
    @file_put_contents($flag7, (string) time());
    try { sp_market_fix(); } catch (Throwable $e) { @unlink($flag7); }
  }
  // v2810 : questions de prix aux cotes périmées → fermées 72 h après leurs cotes (une seule fois ; la règle s'applique aussi à chaque pari)
  $flag4 = sp_dir() . DIRECTORY_SEPARATOR . 'stale-2026-10.done';
  if (!is_file($flag4)) {
    @file_put_contents($flag4, (string) time());
    try { sp_stale_fix(); } catch (Throwable $e) { @unlink($flag4); }
  }
}
/**
 * v2802 (propriétaire) : le NUL revient au football. Les matchs de foot ouverts « nul = remboursé » (2 choix) sur lesquels
 * PERSONNE n'a encore parié reçoivent le choix « Nul » avec sa cote, comme les grands sites (1 · N · 2) ; la règle
 * « nul = remboursé » est retirée de ces matchs-là seulement. Un match qui a déjà des paris garde sa règle (promise aux joueurs).
 * Cotes : chances des 2 équipes reprises des anciennes cotes, nul 27 %, cote = 0,94 ÷ chance (marge maison 6 %).
 * Les paris gardent la clé du choix (o0, o1) : rien ne bouge pour eux ; le nul a sa propre clé « oD ».
 */
const SP_DRAW_P = 0.27;
function sp_add_draw(array $e): array {
  if (($e['sport'] ?? '') !== 'foot' || count((array) ($e['opts'] ?? [])) !== 2) return $e;
  $a = (float) $e['opts'][0]['odd']; $b = (float) $e['opts'][1]['odd'];
  if ($a <= 1 || $b <= 1) return $e;
  $p1 = 1 / $a; $p2 = 1 / $b; $t = $p1 + $p2;
  $odd = static fn(float $p): float => max(1.01, floor(0.94 / $p * 100) / 100);
  $o1 = $e['opts'][0]; $o2 = $e['opts'][1];
  $o1['odd'] = $odd($p1 / $t * (1 - SP_DRAW_P)); $o2['odd'] = $odd($p2 / $t * (1 - SP_DRAW_P));
  $e['opts'] = [$o1, ['k' => 'oD', 'label' => 'Nul', 'odd' => $odd(SP_DRAW_P)], $o2];
  $e['league'] = trim((string) preg_replace('/\s*·\s*nul = remboursé\s*$/u', '', (string) ($e['league'] ?? '')));
  return $e;
}
function sp_draw_once(): int {
  $flag = sp_dir() . DIRECTORY_SEPARATOR . 'draw-2026-10.done';
  if (is_file($flag)) return 0;
  @file_put_contents($flag, (string) time()); // une seule fois, même si deux joueurs ouvrent en même temps
  try {
    $bets = (array) (sp_with('bets.json', static fn(array &$s) => $s['b'] ?? []) ?: []);
    $used = [];
    foreach ($bets as $bt) foreach ((array) ($bt['sel'] ?? []) as $sel) $used[(string) ($sel['ev'] ?? '')] = 1;
    return (int) sp_with('events.json', static function (array &$s) use ($used) {
      $n = 0;
      foreach ((array) ($s['e'] ?? []) as $i => $e) {
        if (($e['status'] ?? '') !== 'open' || isset($used[(string) $e['id']])) continue;
        if (strpos((string) ($e['league'] ?? ''), 'nul = remboursé') === false) continue;
        $ne = sp_add_draw($e);
        if ($ne !== $e) { $s['e'][$i] = $ne; $n++; }
      }
      return $n;
    });
  } catch (Throwable $ex) { @unlink($flag); return 0; }
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
  $added = 0; $skipped = 0; $pm = sp_seed_priced();
  foreach (($list ?? sp_suggestions()) as $row) {
    [$title, $league, $sport, $start, $opts, $logos] = $row; $endAt = (int) ($row[6] ?? 0); $tr = (array) ($row[7] ?? []);
    // v2810 : les cotes des listes datent de leur vérification (17-18/10) : une question de prix déjà périmée n'est pas publiée
    $pAt = $pm[sp_lower($title)] ?? time();
    $close = sp_close_at(['title' => $title, 'league' => $league, 'sport' => $sport, 'start' => $start, 'logos' => $logos, 'pricedAt' => $pAt]);
    if (isset($have[sp_lower($title)]) || $close < time() + 120) { $skipped++; continue; }
    $r = sp_admin_save(['title' => $title, 'league' => $league, 'sport' => $sport, 'start' => $start, 'maxStake' => 1000, 'logos' => $logos, 'noFetch' => true, 'endAt' => $endAt, 'i18n' => $tr, 'pricedAt' => $pAt,
      'opts' => array_map(static fn($o) => ['label' => $o[0], 'odd' => $o[1]], $opts)]);
    if (!empty($r['ok'])) $added++; else $skipped++;
  }
  return ['ok' => true, 'added' => $added, 'skipped' => $skipped];
}
/** v2810 : date de pose des cotes des listes toutes prêtes (titre en minuscules → horodatage) : 1re et 2e séries le 17/10, 3e le 18/10. */
function sp_seed_priced(): array {
  static $m = null;
  if ($m !== null) return $m;
  $m = [];
  foreach ([[sp_suggestions(), '2026-10-17 00:00'], [sp_suggestions2(), '2026-10-17 00:00'], [sp_suggestions3(), '2026-10-18 00:00'], [sp_suggestions4(), '2026-10-20 12:00'], [sp_suggestions5(), '2026-10-21 00:00']] as [$list, $d])
    foreach ($list as $row) { $k = sp_lower((string) $row[0]); $m[$k] = min($m[$k] ?? PHP_INT_MAX, (int) strtotime($d . ' UTC')); }
  return $m;
}
/**
 * v2810 — cotes périmées : chaque question de PRIX encore ouverte ferme au plus tard 72 h après la pose de ses cotes.
 * Idempotent. Seuls changent : l'heure de fermeture (seulement PLUS TÔT, jamais dans le passé), et les repères pricedAt /
 * closeMax / endAt (heure de la réponse, pour que l'admin soit prévenu au bon moment). Cotes, choix et paris ne bougent pas.
 */
function sp_stale_fix(int $now = 0): int {
  $now = $now ?: time();
  $pm = sp_seed_priced();
  return (int) sp_with('events.json', static function (array &$s) use ($now, $pm) {
    $n = 0;
    foreach ((array) ($s['e'] ?? []) as $i => $e) {
      if (($e['status'] ?? '') !== 'open' || !sp_is_price($e)) continue;
      $start = (int) $e['start'];
      if (empty($e['pricedAt'])) {
        $p = (int) ($e['createdAt'] ?? 0) ?: $now;
        if (isset($pm[sp_lower((string) $e['title'])])) $p = min($p, $pm[sp_lower((string) $e['title'])]);
        $e['pricedAt'] = $p;
      }
      if (empty($e['closeMax'])) $e['closeMax'] = $start;
      if (empty($e['endAt'])) $e['endAt'] = $start; // l'ancienne fermeture : l'admin n'est pas prévenu plus tôt qu'avant
      $close = min($start, (int) $e['pricedAt'] + SP_PRICE_TTL);
      if ($close < $start && $now < $start) $e['start'] = max($close, $now); // plus tôt seulement ; déjà dépassé = fermé tout de suite
      if ($e !== $s['e'][$i]) { $s['e'][$i] = $e; $n++; }
    }
    return $n;
  });
}
/**
 * v2810 — Admin : REMET À JOUR les cotes d'un événement ouvert ($odds = [clé du choix => cote]) et, au besoin, son plafond
 * de mises par choix ($cap, 0 = défaut). Les clés des choix ne changent pas ; les paris déjà pris gardent LEUR cote.
 * La date des cotes repart de maintenant : une question de prix rouvre pour 72 h au plus (jamais après sa fermeture d'origine).
 */
function sp_admin_odds(string $eid, array $odds, ?float $cap = null, int $now = 0): array {
  $now = $now ?: time();
  return sp_with('events.json', static function (array &$s) use ($eid, $odds, $cap, $now) {
    foreach ((array) ($s['e'] ?? []) as $i => $e) {
      if ($e['id'] !== $eid) continue;
      if ($e['status'] !== 'open') return ['ok' => false, 'reason' => 'Événement fermé ou réglé'];
      $inv = 0.0;
      foreach ($e['opts'] as $j => $o) {
        $v = isset($odds[$o['k']]) ? round((float) $odds[$o['k']], 2) : (float) $o['odd'];
        if ($v < 1.01 || $v > 100) return ['ok' => false, 'reason' => 'Cote invalide : ' . $o['label']];
        $e['opts'][$j]['odd'] = $v; $inv += 1 / $v;
      }
      if ($inv < 1.0 - 1e-9) return ['ok' => false, 'reason' => 'Cotes trop hautes : la maison perdrait à coup sûr (somme des 1/cote < 1). Marge conseillée : 6 % (cote = 0,94 ÷ chance).'];
      if ($cap !== null) { $c = max(0.0, min(100000.0, round($cap, 2))); if ($c > 0) $e['cap'] = $c; else unset($e['cap']); }
      $e['pricedAt'] = $now;
      unset($e['hold']); // 2026-10-21 : l'admin a posé de nouvelles cotes → l'événement en attente de cotes réapparaît
      if (sp_is_price($e)) {
        $max = (int) ($e['closeMax'] ?? 0) ?: (int) $e['start'];
        $e['closeMax'] = $max;
        if (empty($e['endAt'])) $e['endAt'] = $max;
        $e['start'] = min($max, $now + SP_PRICE_TTL);
        if ($e['start'] <= $now) return ['ok' => false, 'reason' => 'Trop tard : la fermeture prévue est passée'];
      }
      $s['e'][$i] = $e;
      return ['ok' => true, 'id' => $eid, 'start' => (int) $e['start'], 'opts' => $e['opts'], 'cap' => sp_cap($e)];
    }
    return ['ok' => false, 'reason' => 'Match introuvable'];
  });
}
/** Les deux équipes d'un titre « A - B » / « A vs B » (comme l'affichage du joueur). */
function sp_title_teams(string $t): array {
  $m = preg_split('/\s+(?:-|–|—|vs\.?|VS|contre)\s+/u', $t);
  return is_array($m) && count($m) === 2 ? $m : [];
}

/** Le joueur parie (coupon). $sel = [[ev, k], …]. */
/** $acc (réglage du joueur « si la cote change ») : 'none' = toujours demander (refus « odds » si une cote a bougé),
 *  'up' = accepter seulement les hausses (refus si une cote a BAISSÉ), 'any' = accepter tout changement. Le pari prend
 *  toujours la cote ACTUELLE du serveur (jamais celle envoyée par le téléphone). */
function sp_bet(array $db, array $user, string $mode, float $stake, array $sel, int $now = 0, string $acc = 'none'): array {
  $acc = in_array($acc, ['any', 'up'], true) ? $acc : 'none';
  $now = $now ?: time();
  $uid = (string) ($user['id'] ?? '');
  if ($uid === '') return ['ok' => false, 'reason' => 'login'];
  $mode = function_exists('casino_mode') ? casino_mode('real', false, $user) : 'real'; // v2690b : réel seulement (admin : solde de test)
  $stake = floor($stake * 100 + 1e-6) / 100;
  if ($stake + 1e-9 < SP_MIN) return ['ok' => false, 'reason' => 'min'];
  $sel = array_slice(array_values($sel), 0, SP_MAX_SEL + 1);
  if (!$sel || count($sel) > SP_MAX_SEL) return ['ok' => false, 'reason' => 'param'];
  $ev = []; foreach (sp_events() as $e) $ev[$e['id']] = $e;
  $picked = []; $odd = 1.0; $seen = []; $grp = []; $caps = []; $chg = [];
  $multi = count($sel) > 1;
  foreach ($sel as $s) {
    $eid = (string) ($s['ev'] ?? $s[0] ?? ''); $k = (string) ($s['k'] ?? $s[1] ?? '');
    $e = $ev[$eid] ?? null;
    if (!$e || isset($seen[$eid])) return ['ok' => false, 'reason' => 'param'];
    if ($e['status'] !== 'open' || !empty($e['hold']) || $now >= sp_close_at($e)) return ['ok' => false, 'reason' => 'closed']; // 2026-10-21 : « hold » = en attente de vraies cotes ; v2810 : question de prix fermée 72 h après ses cotes
    $o = null; foreach ($e['opts'] as $oo) if ($oo['k'] === $k) $o = $oo;
    if (!$o) return ['ok' => false, 'reason' => 'param'];
    // v2810 : une question (prédiction) se joue en SIMPLE seulement ; jamais deux choix d'un même groupe dans un coupon
    if ($multi && sp_is_question($e)) return ['ok' => false, 'reason' => 'single'];
    foreach (sp_corr_groups($e) as $g) { if (isset($grp[$g])) return ['ok' => false, 'reason' => 'corr']; $grp[$g] = 1; }
    $seen[$eid] = 1;
    if (($c = sp_cap($e)) > 0) $caps[$eid . '|' . $k] = $c;
    // 2026-10-21 (propriétaire) : le téléphone envoie la cote qu'il a AFFICHÉE ; si l'admin l'a changée entre-temps, refus
    // « odds » (cotes changées) avec les nouvelles cotes — le joueur revoit son ticket et confirme. (Ancienne page sans cote : accepté.)
    if (is_array($s) && isset($s['odd']) && is_numeric($s['odd']) && $acc !== 'any' && ($acc === 'up' ? (float) $o['odd'] < round((float) $s['odd'], 2) - 0.004 : abs(round((float) $s['odd'], 2) - (float) $o['odd']) > 0.004)) $chg[] =['ev' => $eid, 'k' => $k, 'odd' => (float) $o['odd']];
    $picked[] = ['ev' => $eid, 'k' => $k, 'odd' => (float) $o['odd'], 't' => $e['title'], 'l' => $o['label']];
    $odd *= (float) $o['odd'];
  }
  if ($chg) return ['ok' => false, 'reason' => 'odds', 'odds' => $chg];
  $odd = floor($odd * 100 + 1e-6) / 100; // v2765 : 2,30 reste 2,30 (avant : 2,29 à cause de l arrondi)
  // v2779 (propriétaire) : pas de mise maximale ; seul le GAIN d'un coupon est plafonné (6 000 $)
  if ($mode === 'real' && $stake * $odd > SP_MAX_WIN + 1e-9) return ['ok' => false, 'reason' => 'maxWin', 'maxStake' => floor(SP_MAX_WIN / $odd * 100) / 100];
  $ref = 'sp_' . bin2hex(random_bytes(9));
  $bet = ['id' => $ref, 'uid' => $uid, 'mode' => $mode, 'stake' => $stake, 'odd' => $odd, 'pot' => sp_floor2(min(SP_MAX_WIN, $stake * $odd)), 'sel' => $picked, 'status' => 'open', 'at' => $now];
  /* 2026-10-21 (propriétaire) — ORDRE SÛR pour TOUS les paris (avant : seulement les questions avec plafond) : 1) le coupon est
     ÉCRIT d'abord (état « pend » : jamais montré, jamais réglé) sous le verrou des paris, avec le plafond de mises par choix
     vérifié au même moment ; 2) la mise est retirée (casino_debit, une seule fois par référence) ; 3) le coupon passe « open ».
     Refus net de la caisse (solde insuffisant…) → le coupon réservé est retiré (rien n'a été pris). Erreur inattendue pendant
     le retrait (on ne sait pas si l'argent est parti) → le coupon reste « pend » marqué « chk » pour l'admin : jamais de
     remboursement automatique, jamais d'effacement. */
  $res = sp_with('bets.json', static function (array &$s) use ($bet, $caps, $mode) {
    if ($mode === 'real' && $caps) { // v2810 : plafond de mises par choix — vérifié ET réservé sous le verrou (deux paris en même temps ne passent pas tous les deux)
      $used = [];
      foreach ((array) ($s['b'] ?? []) as $b) {
        if (($b['mode'] ?? '') !== 'real' || ($b['status'] ?? '') === 'void') continue;
        foreach ((array) ($b['sel'] ?? []) as $x) { $key = ($x['ev'] ?? '') . '|' . ($x['k'] ?? ''); if (isset($caps[$key])) $used[$key] = ($used[$key] ?? 0) + (float) $b['stake']; }
      }
      $left = PHP_FLOAT_MAX;
      foreach ($caps as $key => $c) $left = min($left, $c - ($used[$key] ?? 0));
      if ($bet['stake'] > $left + 1e-9) return ['ok' => false, 'reason' => 'cap', 'maxStake' => max(0.0, sp_floor2($left))];
    }
    $bet['status'] = 'pend'; $s['b'][] = $bet; // réservé (pas encore payé : jamais réglé, jamais montré)
    return ['ok' => true];
  });
  if (!is_array($res)) return ['ok' => false, 'reason' => 'unavailable']; // rien d'écrit → rien n'est retiré
  if (empty($res['ok'])) return $res;
  $deb = null; $state = 'unknown';
  try {
    $deb = casino_debit($db, $uid, $mode, $stake, $ref);
    // refus NET (solde insuffisant / démo occupée) → coupon retiré ; toute autre erreur = issue inconnue → gardé pour l'admin
    $state = !empty($deb['ok']) ? 'open' : (in_array((string) ($deb['reason'] ?? ''), ['insufficient', 'busy'], true) ? 'refused' : 'unknown');
  } finally {
    $mark = static function (array &$s) use ($ref, $state) {
      foreach ((array) ($s['b'] ?? []) as $i => $b) {
        if (($b['id'] ?? '') !== $ref) continue;
        if ($state === 'open') $s['b'][$i]['status'] = 'open';
        elseif ($state === 'refused') array_splice($s['b'], $i, 1);
        else $s['b'][$i]['chk'] = 1; // issue inconnue : gardé « pend » pour vérification par l'admin
        return true;
      }
      return true;
    };
    if (sp_with('bets.json', $mark) !== true && $state === 'open') sp_with('bets.json', $mark); // une 2e tentative (fichier occupé)
  }
  if (empty($deb['ok'])) return ['ok' => false, 'reason' => $deb['reason'] ?? 'unavailable'];
  $bet['status'] = 'open';
  return ['ok' => true, 'bet' => sp_bet_public($bet), 'bal' => $deb['real'] ?? ($deb['demo'] ?? null)];
}

function sp_bet_public(array $b): array {
  return ['id' => $b['id'], 'mode' => $b['mode'], 'stake' => (float) $b['stake'], 'odd' => (float) $b['odd'], 'pot' => (float) $b['pot'], 'status' => $b['status'], 'win' => (float) ($b['win'] ?? 0), 'at' => (int) $b['at'], 'done' => (int) ($b['done'] ?? 0),
    'sel' => array_map(static fn($s) => ['t' => $s['t'], 'l' => $s['l'], 'odd' => (float) $s['odd'], 'r' => $s['r'] ?? null], $b['sel'])];
}
function sp_my_bets(string $uid): array {
  $all = (array) (sp_with('bets.json', static fn(array &$s) => $s['b'] ?? []) ?: []);
  $mine = array_values(array_filter($all, static fn($b) => ($b['uid'] ?? '') === $uid && ($b['status'] ?? '') !== 'pend'));
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
      $win = sp_floor2(min(SP_MAX_WIN, (float) $b['stake'] * (floor($odd * 100 + 1e-6) / 100))); // v2810 : arrondi au cent INFÉRIEUR
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
  // v2807 : après le résultat, combien de paris ont GAGNÉ / PERDU sur cet événement (« test » = dont paris en mode démo)
  $res = []; $all = [];
  foreach ($bets as $b) foreach ((array) ($b['sel'] ?? []) as $s) {
    $all[$s['ev']] = ($all[$s['ev']] ?? 0) + 1;
    $r = (string) ($s['r'] ?? ''); if ($r === '') continue;
    $res[$s['ev']][$r] = ($res[$s['ev']][$r] ?? 0) + 1;
    if (($b['mode'] ?? '') !== 'real') $res[$s['ev']]['test'] = ($res[$s['ev']]['test'] ?? 0) + 1;
  }
  $out = [];
  foreach (array_reverse(sp_events()) as $e) { $e['exp'] = $exp[$e['id']] ?? []; $e['res'] = $res[$e['id']] ?? []; $e['nb'] = $all[$e['id']] ?? 0;
    $e['close'] = sp_close_at($e); $e['capEff'] = sp_cap($e); $e['isQ'] = sp_is_question($e); $e['isPx'] = sp_is_price($e); $out[] = $e; } // v2810
  return $out;
}
/**
 * v2807 (propriétaire) — Admin : TOUS les paris posés sur un événement, avec, après le résultat, qui a GAGNÉ et qui a PERDU.
 * Lecture seule (aucun argent ne bouge ici). Par pari : joueur, choix, mise, cote du choix, état de CE choix (won / lost / void /
 * en attente) et état du coupon entier (un combiné peut perdre sur un autre match), gain versé.
 */
function sp_admin_event_bets(string $eid): array {
  $ev = null; foreach (sp_events() as $e) if ($e['id'] === $eid) $ev = $e;
  if (!$ev) return ['ok' => false, 'reason' => 'Match introuvable'];
  $lbl = []; foreach ((array) $ev['opts'] as $o) $lbl[$o['k']] = (string) $o['label'];
  $rows = [];
  foreach ((array) (sp_with('bets.json', static fn(array &$s) => $s['b'] ?? []) ?: []) as $b) {
    foreach ((array) ($b['sel'] ?? []) as $s) {
      if (($s['ev'] ?? '') !== $eid) continue;
      $rows[] = ['id' => (string) $b['id'], 'uid' => (string) $b['uid'], 'mode' => (string) $b['mode'], 'at' => (int) $b['at'], 'k' => (string) $s['k'], 'pick' => $lbl[$s['k']] ?? (string) ($s['l'] ?? ''),
        'stake' => (float) $b['stake'], 'odd' => (float) $s['odd'], 'cOdd' => (float) $b['odd'], 'n' => count((array) $b['sel']), 'r' => (string) ($s['r'] ?? ''),
        'status' => (string) $b['status'], 'win' => (float) ($b['win'] ?? 0), 'pot' => (float) $b['pot']];
    }
  }
  usort($rows, static fn($a, $b) => $b['at'] <=> $a['at']);
  return ['ok' => true, 'ev' => ['id' => $ev['id'], 'title' => $ev['title'], 'status' => $ev['status'], 'result' => $ev['result'] ?? null, 'opts' => $ev['opts']], 'bets' => $rows];
}
