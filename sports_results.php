<?php
declare(strict_types=1);
/**
 * 2026-10-21 (propriétaire : « beaucoup de matchs finis attendent la validation ») — RÉSULTATS PROPOSÉS (aide à l'admin).
 *
 *  - Pour chaque événement fini (début il y a plus de 2 h) et pas encore réglé, le serveur cherche le SCORE FINAL dans des
 *    sources publiques GRATUITES, sans clé payante :
 *      1. ESPN (site.api.espn.com/apis/site/v2/sports/<sport>/<ligue>/scoreboard?dates=AAAAMMJJ) — seulement « fini »
 *         (STATUS_FULL_TIME / STATUS_FINAL, completed = true) ; prolongation / tirs au but (AET / PEN) : rien n'est proposé ;
 *      2. TheSportsDB (clé gratuite 123, déjà utilisée pour les logos) — eventsday.php puis searchevents.php ; seulement « FT ».
 *  - L'événement est relié au match de la source par la date (± 36 h) et le NOM des deux équipes (minuscules, sans accents,
 *    sans FC / AC / SC…, « Utd » = « United », surnoms connus : PSG, Man City, Barça…), avec une note de ressemblance.
 *  - Depuis le score, le serveur PROPOSE le choix gagnant, seulement quand il est CERTAIN : 1 · N · 2 (et « nul = remboursé »
 *    → Annulé), double chance, plus / moins de N buts ou points, les deux équipes marquent, score exact. Tout le reste
 *    (buteur, questions spéciales, prix, F1…) : rien n'est proposé, « à valider à la main ».
 *  - Confiance « sûr » : les deux sources donnent le même score, ou une source finie avec les deux noms d'équipe identiques.
 *    Sinon « à vérifier ». Sources en désaccord : rien n'est proposé.
 *  - RIEN N'EST JAMAIS RÉGLÉ ICI : aucun argent ne bouge. L'admin clique « Valider », ce qui appelle l'action EXISTANTE
 *    sp_settle → sp_admin_settle (mêmes paiements, même sécurité qu'un clic à la main).
 *  - Cache : chaque adresse lue est gardée 10 minutes (data/sports/results-cache/), au plus SPR_MAX_FETCH lectures par clic.
 * Tests : php scripts/test-sp-results.php (fichiers d'exemple dans scripts/fixtures/, aucun accès à internet).
 */

const SPR_MIN_AGE = 7200;        // début il y a plus de 2 h
const SPR_MAX_AGE = 864000;      // au-delà de 10 jours : plus cherché automatiquement
const SPR_WINDOW = 129600;       // ± 36 h entre l'heure de l'événement et celle de la source
const SPR_CACHE_TTL = 600;       // 10 min par adresse
const SPR_MAX_FETCH = 45;       // lectures sur internet au plus par clic de l'admin
const SPR_MIN_SIM = 0.75;        // ressemblance minimale des noms d'équipe
const SPR_ESPN = 'https://site.api.espn.com/apis/site/v2/sports/';
const SPR_TSDB = 'https://www.thesportsdb.com/api/v1/json/123/';
const SPR_SOCCER_LEAGUES = ['uefa.champions', 'uefa.europa', 'eng.1', 'esp.1', 'ita.1', 'ger.1', 'fra.1'];

/* ---------------------------------------------------------------- noms d'équipe ---------------------------------------- */

/** Minuscules sans accents, sans ponctuation. */
function spr_ascii(string $s): string {
  $s = function_exists('mb_strtolower') ? mb_strtolower($s, 'UTF-8') : strtolower($s);
  $s = strtr($s, ['á' => 'a', 'à' => 'a', 'â' => 'a', 'ä' => 'a', 'ã' => 'a', 'å' => 'a', 'ā' => 'a', 'ą' => 'a', 'æ' => 'ae', 'ç' => 'c', 'ć' => 'c', 'č' => 'c',
    'é' => 'e', 'è' => 'e', 'ê' => 'e', 'ë' => 'e', 'ē' => 'e', 'ę' => 'e', 'ě' => 'e', 'í' => 'i', 'ì' => 'i', 'î' => 'i', 'ï' => 'i', 'ı' => 'i', 'ñ' => 'n', 'ń' => 'n', 'ň' => 'n',
    'ó' => 'o', 'ò' => 'o', 'ô' => 'o', 'ö' => 'o', 'õ' => 'o', 'ø' => 'o', 'ő' => 'o', 'œ' => 'oe', 'ú' => 'u', 'ù' => 'u', 'û' => 'u', 'ü' => 'u', 'ů' => 'u', 'ű' => 'u',
    'ý' => 'y', 'ÿ' => 'y', 'ş' => 's', 'ș' => 's', 'ś' => 's', 'š' => 's', 'ğ' => 'g', 'ł' => 'l', 'ž' => 'z', 'ź' => 'z', 'ż' => 'z', 'ř' => 'r', 'ť' => 't', 'ț' => 't',
    'ď' => 'd', 'đ' => 'd', 'ß' => 'ss', '&' => ' and ', '’' => ' ', "'" => ' ']);
  if (preg_match('/[^\x00-\x7F]/', $s) && function_exists('iconv')) { $t = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s); if (is_string($t) && $t !== '') $s = strtolower($t); }
  return trim((string) preg_replace('/\s+/', ' ', (string) preg_replace('/[^a-z0-9]+/', ' ', $s)));
}
/** Surnoms → nom de référence (après spr_ascii et retrait des sigles). */
function spr_aliases(): array {
  static $a = null;
  if ($a !== null) return $a;
  $g = [
    'psg' => ['paris saint germain', 'paris sg', 'paris st germain', 'paris saint germain fc'],
    'paris fc' => ['paris'],
    'manchester city' => ['man city', 'manchester c', 'mancity'],
    'manchester united' => ['man united', 'man utd', 'manchester utd', 'man u', 'manutd'],
    'barcelona' => ['barca', 'barcelone', 'fc barcelona', 'barcelona fc'],
    'bayern' => ['bayern munich', 'bayern munchen', 'bayern muenchen', 'bayern munique', 'fc bayern'],
    'inter' => ['inter milan', 'internazionale', 'inter milano', 'internazionale milano'],
    'milan' => ['ac milan', 'milan ac'],
    'atletico madrid' => ['atletico', 'atletico de madrid', 'atl madrid', 'atleti'],
    'marseille' => ['olympique marseille', 'om'],
    'lyon' => ['olympique lyonnais', 'ol', 'olympique lyon'],
    'lille' => ['losc', 'losc lille'],
    'brest' => ['stade brestois', 'stade brestois 29'],
    'rennes' => ['stade rennais'],
    'nice' => ['ogc nice'],
    'monaco' => ['as monaco'],
    'auxerre' => ['aj auxerre'],
    'tottenham' => ['tottenham hotspur', 'spurs london'],
    'newcastle' => ['newcastle united', 'newcastle utd'],
    'leeds' => ['leeds united', 'leeds utd'],
    'brighton' => ['brighton and hove albion', 'brighton hove albion', 'brighton hove'],
    'wolverhampton' => ['wolves', 'wolverhampton wanderers'],
    'west ham' => ['west ham united', 'west ham utd'],
    'nottingham forest' => ['nottm forest', 'nottingham', 'forest'],
    'hull' => ['hull city'],
    'coventry' => ['coventry city'],
    'athletic bilbao' => ['athletic club', 'athletic', 'ath bilbao'],
    'real sociedad' => ['sociedad'],
    'celta vigo' => ['celta', 'rc celta'],
    'betis' => ['real betis', 'real betis balompie'],
    'sevilla' => ['seville', 'sevilla fc'],
    'napoli' => ['naples', 'ssc napoli'],
    'roma' => ['as roma'],
    'juventus' => ['juve'],
    'leverkusen' => ['bayer leverkusen', 'bayer 04 leverkusen', 'bayer 04'],
    'dortmund' => ['borussia dortmund', 'bvb'],
    'monchengladbach' => ['borussia monchengladbach', 'gladbach', 'b monchengladbach'],
    'stuttgart' => ['vfb stuttgart'],
    'leipzig' => ['rb leipzig', 'rasenballsport leipzig'],
    'hoffenheim' => ['tsg hoffenheim', 'tsg 1899 hoffenheim', 'hoffenheim 1899'],
    'sturm graz' => ['sk sturm graz', 'sturm'],
    'psv' => ['psv eindhoven'],
    'club brugge' => ['club bruges', 'brugge', 'bruges'],
    'sporting cp' => ['sporting', 'sporting lisbon', 'sporting clube de portugal'],
    'porto' => ['fc porto'],
    'benfica' => ['sl benfica'],
    'slavia prague' => ['slavia praha', 'slavia'],
    'aek athens' => ['aek', 'aek athens fc'],
    'besiktas' => ['besiktas jk'],
    'galatasaray' => ['galatasaray sk'],
    'fenerbahce' => ['fenerbahce sk'],
    'bodo glimt' => ['bodo', 'glimt'],
    'como' => ['como 1907'],
    'minnesota timberwolves' => ['minnesota t wolves', 'timberwolves', 't wolves', 'wolves minnesota'],
    'oklahoma city thunder' => ['okc thunder', 'okc', 'oklahoma city'],
    'philadelphia 76ers' => ['76ers', 'sixers', 'philadelphia sixers'],
    'los angeles lakers' => ['la lakers', 'lakers'],
    'los angeles clippers' => ['la clippers', 'clippers'],
    'golden state warriors' => ['warriors', 'golden state'],
  ];
  $a = [];
  foreach ($g as $canon => $list) { $a[$canon] = $canon; foreach ($list as $x) $a[$x] = $canon; }
  return $a;
}
/** Nom « de référence » d'une équipe : sans accents, sans sigles (FC, AC, SC…), « utd » = « united », puis surnoms. */
function spr_canon(string $name): string {
  $s = spr_ascii($name);
  $raw = $s;
  $toks = [];
  foreach (explode(' ', $s) as $t) {
    if ($t === '' || in_array($t, ['fc', 'cf', 'ac', 'sc', 'afc', 'as', 'ss', 'ssc', 'us', 'rc', 'ogc', 'ca', 'cd', 'ud', 'sl', 'sk', 'bv', 'vfb', 'vfl', 'rb', 'tsg', 'fk', 'sv', 'jk', 'de', 'del', 'the', 'calcio'], true)) continue;
    if (preg_match('/^(18|19|20)\d\d$/', $t)) continue; // années (1899, 1907…)
    $toks[] = $t === 'utd' ? 'united' : $t;
  }
  $s = implode(' ', $toks);
  $al = spr_aliases();
  if (isset($al[$raw])) return $al[$raw];
  if (isset($al[$s])) return $al[$s];
  return $s !== '' ? $s : $raw;
}
/** Ressemblance de deux noms d'équipe (0 à 1). 1 = même équipe (même nom de référence). */
function spr_sim(string $a, string $b): float {
  $x = spr_canon($a); $y = spr_canon($b);
  if ($x === '' || $y === '') return 0.0;
  if ($x === $y) return 1.0;
  $tx = explode(' ', $x); $ty = explode(' ', $y);
  // tous les mots du nom court sont dans le nom long (« Heat » / « Miami Heat », « Leverkusen » / « Bayer Leverkusen »)
  [$s, $l] = count($tx) <= count($ty) ? [$tx, $ty] : [$ty, $tx];
  $cont = !array_diff($s, $l) && strlen(implode('', $s)) >= 4 ? 0.85 : 0.0;
  if ($cont > 0) return $cont;
  similar_text($x, $y, $pct);
  $sim = round($pct / 100, 3);
  // mots différents des deux côtés (« manchester CITY » / « manchester UNITED ») : jamais assez ressemblant
  $ux = array_values(array_diff($tx, $ty)); $uy = array_values(array_diff($ty, $tx));
  if ($ux && $uy && count($ux) < count($tx)) { similar_text(implode(' ', $ux), implode(' ', $uy), $p2); if ($p2 < 60) $sim = min($sim, 0.6); }
  return $sim;
}
/** Meilleure ressemblance entre un nom et plusieurs écritures du même club (ESPN : nom long, court, ville…). */
function spr_sim_any(string $a, array $names): float {
  $m = 0.0; foreach ($names as $n) if (is_string($n) && $n !== '') $m = max($m, spr_sim($a, $n));
  return $m;
}
function spr_exact_any(string $a, array $names): bool {
  $c = spr_canon($a); foreach ($names as $n) if (is_string($n) && $n !== '' && spr_canon($n) === $c) return true;
  return false;
}

/* ---------------------------------------------------------------- sources ---------------------------------------------- */

/** Matchs d'une réponse ESPN « scoreboard » : liste de [src, lg, ts, home[], away[], hs, as, final, st]. */
function spr_parse_espn(array $j, string $sport = 'soccer', string $lg = ''): array {
  $out = [];
  foreach ((array) ($j['events'] ?? []) as $e) {
    if (!is_array($e)) continue;
    $c = (array) (($e['competitions'] ?? [])[0] ?? []);
    $h = null; $a = null;
    foreach ((array) ($c['competitors'] ?? []) as $x) { if (($x['homeAway'] ?? '') === 'home') $h = $x; elseif (($x['homeAway'] ?? '') === 'away') $a = $x; }
    if (!$h || !$a) continue;
    $ty = (array) (($e['status'] ?? [])['type'] ?? []);
    $st = (string) ($ty['name'] ?? '');
    $done = !empty($ty['completed']) && ($ty['state'] ?? 'post') === 'post';
    // football : temps réglementaire seulement (prolongation / tirs au but = pas proposé) ; basket / NFL : fini (prolongation comprise)
    $final = $done && ($sport === 'soccer' ? in_array($st, ['STATUS_FULL_TIME', 'STATUS_FINAL'], true) : !in_array($st, ['STATUS_POSTPONED', 'STATUS_CANCELED', 'STATUS_ABANDONED', 'STATUS_FORFEIT', 'STATUS_SUSPENDED'], true));
    $names = static fn(array $x): array => array_values(array_unique(array_filter(array_map('strval', [$x['team']['displayName'] ?? '', $x['team']['shortDisplayName'] ?? '', $x['team']['name'] ?? '', $x['team']['location'] ?? '']))));
    $hs = $h['score'] ?? null; $as = $a['score'] ?? null;
    if (is_array($hs)) $hs = $hs['value'] ?? $hs['displayValue'] ?? null;
    if (is_array($as)) $as = $as['value'] ?? $as['displayValue'] ?? null;
    $num = is_numeric($hs) && is_numeric($as);
    $out[] = ['src' => 'ESPN', 'lg' => $lg !== '' ? $lg : (string) ((($j['leagues'] ?? [])[0] ?? [])['slug'] ?? ''), 'ts' => (int) strtotime((string) ($e['date'] ?? '')), 'home' => $names($h), 'away' => $names($a),
      'hs' => $num ? (int) $hs : null, 'as' => $num ? (int) $as : null, 'final' => $final && $num, 'st' => $st];
  }
  return $out;
}
/** Matchs d'une réponse TheSportsDB (eventsday / searchevents / eventspastleague). */
function spr_parse_tsdb(array $j, string $sport = 'soccer'): array {
  $out = [];
  foreach ((array) ($j['events'] ?? $j['event'] ?? []) as $e) {
    if (!is_array($e)) continue;
    $sp = strtolower((string) ($e['strSport'] ?? ''));
    if ($sp !== '' && $sp !== ['soccer' => 'soccer', 'basketball' => 'basketball', 'football' => 'american football'][$sport]) continue;
    $ts = !empty($e['strTimestamp']) ? (int) strtotime((string) $e['strTimestamp'] . (preg_match('/(Z|[+-]\d\d:?\d\d)$/', (string) $e['strTimestamp']) ? '' : ' UTC'))
      : (int) strtotime(trim((string) ($e['dateEvent'] ?? '') . ' ' . (string) ($e['strTime'] ?? '12:00:00')) . ' UTC');
    $st = trim((string) ($e['strStatus'] ?? ''));
    $hs = $e['intHomeScore'] ?? null; $as = $e['intAwayScore'] ?? null;
    $num = is_numeric($hs) && is_numeric($as);
    $okSt = $sport === 'soccer' ? ['FT', 'Match Finished'] : ['FT', 'AOT', 'Match Finished', 'Final'];
    $out[] = ['src' => 'TheSportsDB', 'lg' => (string) ($e['strLeague'] ?? ''), 'ts' => $ts, 'home' => [(string) ($e['strHomeTeam'] ?? '')], 'away' => [(string) ($e['strAwayTeam'] ?? '')],
      'hs' => $num ? (int) $hs : null, 'as' => $num ? (int) $as : null, 'final' => $num && in_array($st, $okSt, true), 'st' => $st];
  }
  return $out;
}
/**
 * Le match de la source qui correspond aux 2 équipes de l'événement ($h, $a dans l'ordre du titre), ± SPR_WINDOW autour de $ts.
 * Retour : ['g' => match, 'swap' => bool (la source les donne dans l'autre sens), 'sim' => note, 'exact' => bool] ou null
 * (rien d'assez ressemblant, ou deux matchs trop proches pour choisir).
 */
function spr_match(string $h, string $a, int $ts, array $games): ?array {
  $best = null; $second = 0.0;
  foreach ($games as $g) {
    if ($ts > 0 && abs((int) $g['ts'] - $ts) > SPR_WINDOW) continue;
    $d = min(spr_sim_any($h, $g['home']), spr_sim_any($a, $g['away']));
    $r = min(spr_sim_any($h, $g['away']), spr_sim_any($a, $g['home']));
    $swap = $r > $d; $sim = max($d, $r);
    if ($sim < SPR_MIN_SIM) continue;
    $exact = $swap ? (spr_exact_any($h, $g['away']) && spr_exact_any($a, $g['home'])) : (spr_exact_any($h, $g['home']) && spr_exact_any($a, $g['away']));
    $cand = ['g' => $g, 'swap' => $swap, 'sim' => $sim, 'exact' => $exact];
    if (!$best || $sim > $best['sim'] + 1e-9 || ($exact && !$best['exact'])) { if ($best) $second = max($second, $best['sim']); $best = $cand; }
    else $second = max($second, $sim);
  }
  if ($best && !$best['exact'] && $second >= $best['sim'] - 0.05) return null; // deux matchs aussi ressemblants : on ne choisit pas
  return $best;
}

/* ---------------------------------------------------------------- événement → match ------------------------------------ */

/** Sport + compétition ESPN d'un événement. ['soccer', ['eng.1']] / ['basketball', ['nba']] / ['football', ['nfl']] ; null = pas géré. */
function spr_sport(array $e): ?array {
  $sp = (string) ($e['sport'] ?? '');
  $lg = spr_ascii((string) ($e['league'] ?? ''));
  $tt = spr_ascii((string) ($e['title'] ?? ''));
  if (preg_match('/\bnba\b/', $lg) || ($sp === 'basket' && $lg === '')) return ['basketball', ['nba']];
  if (preg_match('/\bnfl\b/', $lg)) return ['football', ['nfl']];
  if ($sp === 'basket') return ['basketball', ['nba']];
  $soccer = $sp === 'foot' || (in_array($sp, ['event'], true) && preg_match('/\bbuts?\b|equipes marquent|both teams|\bgoals?\b|score exact|ligue|league|liga|serie a|bundesliga|champions|europa/', $tt . ' ' . $lg));
  if (!$soccer) return null;
  $map = [['/premier league/', 'eng.1'], ['/championship/', 'eng.2'], ['/champions/', 'uefa.champions'], ['/conference/', 'uefa.europa.conf'], ['/europa/', 'uefa.europa'],
    ['/laliga|la liga|\bliga\b(?! portugal)/', 'esp.1'], ['/serie a/', 'ita.1'], ['/bundesliga/', 'ger.1'], ['/ligue 1/', 'fra.1'], ['/eredivisie/', 'ned.1'], ['/liga portugal|primeira/', 'por.1'], ['/\bmls\b/', 'usa.1']];
  foreach ($map as [$rx, $code]) if (preg_match($rx, $lg)) return ['soccer', [$code]];
  return ['soccer', SPR_SOCCER_LEAGUES];
}
/** Les 2 équipes (ordre du titre) et la question éventuelle : ['h', 'a', 'q' => texte de la question ou ''] ; null = pas un match. */
function spr_teams(array $e): ?array {
  $t = trim((string) ($e['title'] ?? ''));
  if (preg_match('/^combien de (?:buts|points)(?: y aura-t-il)? (?:dans|entre|pendant)\s+(.+?)\s+(?:-|–|—|vs\.?|contre)\s+(.+?)\s*\?$/iu', $t, $m)) return ['h' => trim($m[1]), 'a' => trim($m[2]), 'q' => $t];
  if (preg_match('/^(.+?)\s+(?:-|–|—|vs\.?|VS|contre)\s+(.+?)\s*:\s*(.+)$/u', $t, $m) && !str_contains($m[1], ':')) return ['h' => trim($m[1]), 'a' => trim($m[2]), 'q' => trim($m[3])];
  if (str_contains($t, ':') || str_contains($t, '?')) return null;
  $tm = sp_title_teams($t);
  return $tm ? ['h' => trim($tm[0]), 'a' => trim($tm[1]), 'q' => ''] : null;
}
/** Heure de référence du match : début, ou (fin prévue − 2 h) si la fermeture des paris était bien avant le coup d'envoi. */
function spr_ref_ts(array $e): int {
  $s = (int) ($e['start'] ?? 0); $end = (int) ($e['endAt'] ?? 0);
  return $end > $s + 4 * 3600 ? $end - 7200 : $s;
}

/* ---------------------------------------------------------------- score → choix gagnant -------------------------------- */

function spr_num(string $s): float { return (float) str_replace(',', '.', $s); }
/** Question Oui / Non tirée du titre → fonction (buts domicile, buts extérieur) → bool, ou null si on ne sait pas. */
function spr_question_rule(string $q): ?array {
  $x = spr_ascii($q); $rules = [];
  if (preg_match('/deux equipes marquent|both teams (?:to )?score|\bbtts\b/', $x)) $rules[] = ['Les deux équipes marquent', static fn(int $h, int $a): bool => $h > 0 && $a > 0];
  if (preg_match('/\b(\d+) (?:buts|but|points|goals) ou plus\b|\b(\d+) or more (?:goals|points)\b/', $x, $m)) { $n = (int) ($m[1] !== '' ? $m[1] : $m[2]); $rules[] = [$n . ' ou plus', static fn(int $h, int $a): bool => $h + $a >= $n]; }
  if (preg_match('/\b(?:plus de|over) (\d+(?: \d+)?)\b/', $x, $m)) { $v = spr_num(str_replace(' ', '.', $m[1])); if (abs($v - floor($v) - 0.5) < 1e-9) $rules[] = ['Plus de ' . $v, static fn(int $h, int $a): bool => $h + $a > $v]; }
  if (preg_match('/\b(?:moins de|under) (\d+(?: \d+)?)\b/', $x, $m)) { $v = spr_num(str_replace(' ', '.', $m[1])); if (abs($v - floor($v) - 0.5) < 1e-9) $rules[] = ['Moins de ' . $v, static fn(int $h, int $a): bool => $h + $a < $v]; }
  return count($rules) === 1 ? $rules[0] : null; // 0 ou plusieurs lectures possibles : on ne propose rien
}
/** Un choix → fonction (h, a) → bool. $h / $a = noms des équipes (ordre du titre), $q = règle de la question Oui / Non. Null = inconnu. */
function spr_opt_rule(string $label, array $hn, array $an, ?array $q): ?callable {
  $l = spr_ascii($label);
  if (preg_match('/^(oui|yes|si|sim|ja)$/', $l)) return $q ? $q[1] : null;
  if (preg_match('/^(non|no|nao|nein)$/', $l)) return $q ? static fn(int $h, int $a): bool => !($q[1])($h, $a) : null;
  if (preg_match('/^(nul|match nul|draw|x|n|egalite|tie|empate)$/', $l)) return static fn(int $h, int $a): bool => $h === $a;
  if ($l === '1x') return static fn(int $h, int $a): bool => $h >= $a;
  if ($l === 'x2') return static fn(int $h, int $a): bool => $a >= $h;
  if ($l === '12') return static fn(int $h, int $a): bool => $h !== $a;
  if (preg_match('/^(\d+) (?:a|-) (\d+) (?:buts?|points?|goals?)$/', $l, $m)) { $lo = (int) $m[1]; $hi = (int) $m[2]; return static fn(int $h, int $a): bool => $h + $a >= $lo && $h + $a <= $hi; }
  if (preg_match('/^(\d+) (?:buts?|points?|goals?) ou plus$|^(\d+) or more(?: goals| points)?$/', $l, $m)) { $n = (int) (($m[1] ?? '') !== '' ? $m[1] : $m[2]); return static fn(int $h, int $a): bool => $h + $a >= $n; }
  if (preg_match('/^(?:plus de|over) (\d+(?: \d+)?)(?: buts?| points?| goals?)?$/', $l, $m)) { $v = spr_num(str_replace(' ', '.', $m[1])); if (abs($v - floor($v) - 0.5) > 1e-9) return null; return static fn(int $h, int $a): bool => $h + $a > $v; }
  if (preg_match('/^(?:moins de|under) (\d+(?: \d+)?)(?: buts?| points?| goals?)?$/', $l, $m)) { $v = spr_num(str_replace(' ', '.', $m[1])); if (abs($v - floor($v) - 0.5) > 1e-9) return null; return static fn(int $h, int $a): bool => $h + $a < $v; }
  if (preg_match('/^(?:aucun but|0 but|0 buts)$/', $l)) return static fn(int $h, int $a): bool => $h + $a === 0;
  if (preg_match('/^(\d+) (\d+)$/', $l, $m) && preg_match('/^\s*\d+\s*[-:–]\s*\d+\s*$/u', $label)) { $x = (int) $m[1]; $y = (int) $m[2]; return static fn(int $h, int $a): bool => $h === $x && $a === $y; } // score exact (ordre du titre)
  // « PSG ou nul » / « nul ou Barça » / « PSG ou Barça » (double chance)
  if (preg_match('/^(.+?) ou (.+)$/', $l, $m)) {
    $side = static function (string $p) use ($hn, $an): ?string {
      if (preg_match('/^(nul|match nul|x|n)$/', $p)) return 'D';
      $sh = spr_sim_any($p, $hn); $sa = spr_sim_any($p, $an);
      if ($sh >= 0.7 && $sh - $sa >= 0.15) return 'H';
      if ($sa >= 0.7 && $sa - $sh >= 0.15) return 'A';
      return null;
    };
    $p = $side(trim($m[1])); $r = $side(trim($m[2]));
    if ($p && $r && $p !== $r) { $set = [$p => 1, $r => 1]; return static fn(int $h, int $a): bool => isset($set[$h > $a ? 'H' : ($h < $a ? 'A' : 'D')]); }
    return null;
  }
  // nom d'une équipe → cette équipe gagne
  $sh = spr_sim_any($label, $hn); $sa = spr_sim_any($label, $an);
  if ($sh >= 0.7 && $sh - $sa >= 0.15) return static fn(int $h, int $a): bool => $h > $a;
  if ($sa >= 0.7 && $sa - $sh >= 0.15) return static fn(int $h, int $a): bool => $a > $h;
  return null;
}
/**
 * Choix gagnant CERTAIN d'un événement depuis le score ($h, $a dans l'ordre du titre).
 * Retour : ['k' => clé du choix | 'void' | null, 'label' => texte, 'market' => type, 'why' => explication si rien n'est proposé].
 */
function spr_derive(array $e, array $tm, int $h, int $a, array $hn = [], array $an = []): array {
  $hn = array_values(array_unique(array_merge([$tm['h']], $hn))); $an = array_values(array_unique(array_merge([$tm['a']], $an)));
  $q = $tm['q'] !== '' && !preg_match('/^combien/i', $tm['q']) ? spr_question_rule($tm['q']) : null;
  $opts = array_values((array) ($e['opts'] ?? []));
  $market = $tm['q'] === '' ? 'Résultat du match' : ($q ? $q[0] : 'Question');
  if ($tm['q'] !== '' && preg_match('/combien|buts|points|goals/i', $tm['q']) && !$q) $market = 'Nombre de buts / points';
  $win = []; $rules = [];
  foreach ($opts as $o) {
    $r = spr_opt_rule((string) ($o['label'] ?? ''), $hn, $an, $q);
    if (!$r) return ['k' => null, 'label' => '', 'market' => $market, 'why' => 'Choix « ' . (string) ($o['label'] ?? '') . ' » : pas déduit du score — à valider à la main'];
    $rules[] = $r;
    if ($r($h, $a)) $win[] = $o;
  }
  if (count($opts) < 2) return ['k' => null, 'label' => '', 'market' => $market, 'why' => 'Pas assez de choix'];
  if (count($win) === 1) return ['k' => (string) $win[0]['k'], 'label' => (string) $win[0]['label'], 'market' => $market, 'why' => ''];
  if (!$win && $h === $a && $tm['q'] === '' && preg_match('/nul\s*=\s*rembours|tie\s*=\s*refund/iu', (string) ($e['league'] ?? '')))
    return ['k' => 'void', 'label' => 'Annulé / nul (mises rendues)', 'market' => $market, 'why' => ''];
  return ['k' => null, 'label' => '', 'market' => $market, 'why' => $win ? 'Plusieurs choix gagnants — à valider à la main' : 'Aucun choix gagnant — à valider à la main'];
}

/* ---------------------------------------------------------------- lecture (cache 10 min) -------------------------------- */

function spr_cache_dir(): string { $d = sp_dir() . DIRECTORY_SEPARATOR . 'results-cache'; if (!is_dir($d)) @mkdir($d, 0750, true); return $d; }
/** Lit une adresse (cache 10 min, échec gardé 10 min aussi : jamais de rafale vers la source). $budget = lectures encore permises. */
function spr_get(string $url, int &$budget): ?array {
  $f = spr_cache_dir() . DIRECTORY_SEPARATOR . substr(hash('sha256', $url), 0, 24) . '.json';
  if (is_file($f) && filemtime($f) > time() - SPR_CACHE_TTL) { $j = json_decode((string) @file_get_contents($f), true); return is_array($j) && $j ? $j : null; }
  if ($budget <= 0) return null;
  $budget--;
  // tests (scripts/test-sp-results.php) : réponses d'exemple au lieu d'internet ; le cache et le budget restent les mêmes
  $fake = $GLOBALS['SPR_FAKE_FETCH'] ?? null;
  $raw = is_callable($fake) ? (string) $fake($url) : sp_http_get($url, 3000000);
  $j = json_decode($raw, true);
  @file_put_contents($f, is_array($j) ? $raw : '{}', LOCK_EX);
  return is_array($j) ? $j : null;
}
/** Jours UTC (AAAAMMJJ) à demander pour un match : jour du match (+ veille pour les sports américains : ESPN range par jour US). */
function spr_days(int $ts, string $sport): array {
  $d = [gmdate('Ymd', $ts)];
  if ($sport !== 'soccer') $d[] = gmdate('Ymd', $ts - 86400);
  return array_values(array_unique($d));
}
/** Saison TheSportsDB (« 2026-2027 » en foot / NBA à partir de juillet, « 2026 » en NFL). */
function spr_season(int $ts, string $sport): string {
  $y = (int) gmdate('Y', $ts); $mo = (int) gmdate('n', $ts);
  if ($sport === 'football') return (string) ($mo >= 3 ? $y : $y - 1);
  return $mo >= 7 ? $y . '-' . ($y + 1) : ($y - 1) . '-' . $y;
}

/* ---------------------------------------------------------------- proposition pour un événement ------------------------ */

/** Étape 1 (ESPN) : le match correspondant, ou null. $budget = lectures internet encore permises (partagées). */
function spr_find_espn(array $e, array $tm, array $sp, int &$budget): ?array {
  [$sport, $leagues] = $sp;
  $ts = spr_ref_ts($e);
  foreach ($leagues as $lg) {
    $games = [];
    foreach (spr_days($ts, $sport) as $day) {
      $j = spr_get(SPR_ESPN . $sport . '/' . $lg . '/scoreboard?dates=' . $day, $budget);
      if ($j) $games = array_merge($games, spr_parse_espn($j, $sport, $lg));
    }
    $m = spr_match($tm['h'], $tm['a'], $ts, $games);
    if ($m) return $m;
  }
  return null;
}
/** Étape 2 (TheSportsDB) : le jour entier (une lecture partagée par tous les matchs du jour) puis la recherche par noms. */
function spr_find_tsdb(array $e, array $tm, array $sp, ?array $espnHit, int &$budget): ?array {
  $sport = $sp[0];
  $ts = spr_ref_ts($e);
  $j = spr_get(SPR_TSDB . 'eventsday.php?d=' . gmdate('Y-m-d', $ts) . '&s=' . ['soccer' => 'Soccer', 'basketball' => 'Basketball', 'football' => 'American%20Football'][$sport], $budget);
  if ($j && ($m = spr_match($tm['h'], $tm['a'], $ts, spr_parse_tsdb($j, $sport)))) return $m;
  $pairs = [];
  if ($espnHit) $pairs[] = [$espnHit['g']['home'][0] ?? '', $espnHit['g']['away'][0] ?? ''];
  $pairs[] = [$tm['h'], $tm['a']];
  $seen = [];
  foreach ($pairs as [$x, $y]) {
    if ($x === '' || $y === '') continue;
    $q = str_replace(' ', '_', trim($x)) . '_vs_' . str_replace(' ', '_', trim($y));
    if (isset($seen[$q])) continue;
    $seen[$q] = 1;
    $j = spr_get(SPR_TSDB . 'searchevents.php?e=' . rawurlencode($q) . '&s=' . rawurlencode(spr_season($ts, $sport)), $budget);
    if ($j && ($m = spr_match($tm['h'], $tm['a'], $ts, spr_parse_tsdb($j, $sport)))) return $m;
  }
  return null;
}
/** Proposition pour UN événement (null = pas un match qu'on sait chercher : à valider à la main). */
function spr_event_proposal(array $e, int &$budget): ?array {
  $tm = spr_teams($e); $sp = spr_sport($e);
  if (!$tm || !$sp) return null;
  $espn = spr_find_espn($e, $tm, $sp, $budget);
  $tsdb = $espn && !$espn['g']['final'] ? null : spr_find_tsdb($e, $tm, $sp, $espn, $budget); // pas fini chez ESPN : inutile de chercher ailleurs
  return spr_combine($e, $tm, array_values(array_filter([$espn, $tsdb])));
}
/** Combine les matchs trouvés (0, 1 ou 2 sources) → proposition affichée à l'admin. */
function spr_combine(array $e, array $tm, array $found): array {
  $base = ['id' => (string) $e['id'], 'title' => (string) $e['title'], 'league' => (string) ($e['league'] ?? ''), 'sport' => (string) ($e['sport'] ?? ''), 'start' => (int) ($e['start'] ?? 0),
    'status' => (string) ($e['status'] ?? ''), 'teams' => [$tm['h'], $tm['a']], 'srcs' => [], 'score' => null, 'conf' => '', 'k' => null, 'label' => '', 'market' => '', 'why' => ''];
  $fin = [];
  foreach ($found as $m) {
    $g = $m['g'];
    $h = $m['swap'] ? $g['as'] : $g['hs']; $a = $m['swap'] ? $g['hs'] : $g['as']; // score dans l'ordre du titre
    $base['srcs'][] = ['src' => $g['src'], 'lg' => $g['lg'], 'home' => $g['home'][0] ?? '', 'away' => $g['away'][0] ?? '', 'hs' => $g['hs'], 'as' => $g['as'], 'st' => $g['st'], 'final' => $g['final'], 'sim' => $m['sim'], 'exact' => $m['exact'], 'at' => $g['ts']];
    if ($g['final']) $fin[] = ['h' => $h, 'a' => $a, 'exact' => $m['exact'], 'g' => $g, 'swap' => $m['swap']];
  }
  if (!$found) { $base['why'] = 'Match pas trouvé dans les sources'; return $base; }
  if (!$fin) { $base['why'] = 'Pas encore fini (ou prolongation / tirs au but) — à valider à la main'; return $base; }
  $scores = array_unique(array_map(static fn($f) => $f['h'] . '-' . $f['a'], $fin));
  if (count($scores) > 1) { $base['why'] = 'Les sources ne donnent pas le même score — à vérifier à la main'; $base['conf'] = 'verifier'; return $base; }
  $h = $fin[0]['h']; $a = $fin[0]['a'];
  $base['score'] = [$h, $a];
  // « sûr » : une source finie avec les deux noms identiques, ou deux sources finies d'accord avec des noms très ressemblants
  $exact = false; foreach ($fin as $f) if ($f['exact']) $exact = true;
  $close = count($fin) >= 2; foreach ($found as $m) if ($m['g']['final'] && $m['sim'] < 0.85) $close = false;
  $base['conf'] = $exact || $close ? 'sur' : 'verifier';
  $hn = []; $an = [];
  foreach ($fin as $f) { $hn = array_merge($hn, $f['swap'] ? $f['g']['away'] : $f['g']['home']); $an = array_merge($an, $f['swap'] ? $f['g']['home'] : $f['g']['away']); }
  $d = spr_derive($e, $tm, $h, $a, $hn, $an);
  $base['k'] = $d['k']; $base['label'] = $d['label']; $base['market'] = $d['market']; $base['why'] = $d['why'];
  return $base;
}
/**
 * Admin : propositions pour tous les événements finis (début il y a plus de 2 h, moins de 10 jours) et pas réglés.
 * Lecture seule : aucun événement, aucun pari, aucun solde n'est modifié ici.
 */
function spr_admin_proposals(int $now = 0): array {
  $now = $now ?: time();
  if (function_exists('set_time_limit')) @set_time_limit(90);
  $budget = SPR_MAX_FETCH;
  $list = []; $manual = 0;
  $evs = array_values(array_filter(sp_events(), static fn($e) => ($e['status'] ?? '') !== 'settled' && (int) ($e['start'] ?? 0) <= $now - SPR_MIN_AGE && (int) ($e['start'] ?? 0) >= $now - SPR_MAX_AGE));
  usort($evs, static fn($x, $y) => (int) $x['start'] <=> (int) $y['start']);
  // 1er passage : ESPN pour tous (source principale) ; 2e passage : TheSportsDB (lectures restantes)
  $todo = [];
  foreach ($evs as $e) {
    $tm = sp_is_price($e) ? null : spr_teams($e); $sp = $tm ? spr_sport($e) : null;
    if (!$tm || !$sp) { $manual++; continue; }
    try { $espn = spr_find_espn($e, $tm, $sp, $budget); } catch (Throwable $ex) { $espn = null; }
    $todo[] = [$e, $tm, $sp, $espn];
  }
  foreach ($todo as [$e, $tm, $sp, $espn]) {
    try { $tsdb = $espn && !$espn['g']['final'] ? null : spr_find_tsdb($e, $tm, $sp, $espn, $budget); } catch (Throwable $ex) { $tsdb = null; }
    $list[] = spr_combine($e, $tm, array_values(array_filter([$espn, $tsdb])));
  }
  return ['ok' => true, 'list' => $list, 'manual' => $manual, 'fetchLeft' => $budget, 'at' => $now];
}
