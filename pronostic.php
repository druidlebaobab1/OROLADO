<?php
declare(strict_types=1);
/**
 * 2026-11-23 (propriétaire : « pages Google, pub gratuite, puissant comme les grandes plateformes ») — PAGES « PRONOSTIC »
 * publiques, lisibles par Google, en français (public : Côte d'Ivoire, Sénégal…) :
 *   /pronostic.php                  → matchs du jour et de demain (grands championnats d'abord), lien vers chaque match
 *   /pronostic.php?m=<equipes>-<id> → une page par match : cotes, probabilités, avis calculé à partir des cotes, forme et
 *                                     face-à-face (si déjà en mémoire), bouton « Parier sur ce match » (ouvre le match dans Paris)
 *   /pronostic.php?sitemap=1        → plan de ces pages pour Google
 * Lecture des fichiers locaux SEULEMENT (jamais d'appel au fournisseur : les robots de Google ne coûtent rien) ; pages gardées
 * 10 min (liste 5 min, plan 30 min). Rien si Paris n'est pas public.
 */
require_once __DIR__ . '/orolado_lib.php';
if (is_file(__DIR__ . '/casino_lib.php')) require_once __DIR__ . '/casino_lib.php';
require_once __DIR__ . '/sports_lib.php';
if (!function_exists('sb_find')) require_once __DIR__ . '/sb_lib.php';

const PRON_BASE = 'https://www.orolado.com';

function pron_e(string $s): string { return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function pron_slug(string $s): string {
  $t = function_exists('iconv') ? (string) @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s) : $s;
  if ($t === '') $t = $s;
  return trim((string) preg_replace('/[^a-z0-9]+/', '-', strtolower($t)), '-') ?: 'match';
}
// (le serveur web n'applique pas les adresses courtes de .htaccess : adresses avec « ?m= », lues telles quelles par Google)
const PRON_HOME = PRON_BASE . '/pronostic.php';
function pron_url(string $id, array $row): string { return PRON_HOME . '?m=' . pron_slug((string) ($row['h'][1] ?? '') . '-' . (string) ($row['a'][1] ?? '')) . '-' . $id; }
function pron_cache(string $name, int $ttl, callable $make): string {
  $d = sb_dir() . DIRECTORY_SEPARATOR . 'cache'; if (!is_dir($d)) @mkdir($d, 0750, true);
  $f = $d . DIRECTORY_SEPARATOR . $name;
  clearstatcache(true, $f);
  if (is_file($f) && filemtime($f) > time() - $ttl) return (string) file_get_contents($f);
  $out = $make();
  if ($out !== '') @file_put_contents($f, $out, LOCK_EX);
  return $out;
}
function pron_day_fr(int $ts): string {
  $j = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][(int) gmdate('w', $ts)];
  $m = ['', 'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'][(int) gmdate('n', $ts)];
  return $j . ' ' . (int) gmdate('j', $ts) . ' ' . $m . ' ' . gmdate('Y', $ts);
}
function pron_odd(array $mk, string $m, string $k): ?float { foreach ((array) ($mk[$m] ?? []) as $o) if ((string) $o[0] === $k && is_numeric($o[1])) return (float) $o[1]; return null; }
/** Probabilités (marge retirée) d'un marché : [k => p]. */
function pron_probs(array $mk, string $m): array {
  $inv = []; foreach ((array) ($mk[$m] ?? []) as $o) if (is_numeric($o[1]) && (float) $o[1] > 1) $inv[(string) $o[0]] = 1 / (float) $o[1];
  $t = array_sum($inv); if ($t <= 0) return [];
  foreach ($inv as $k => $v) $inv[$k] = $v / $t;
  return $inv;
}
function pron_head(string $title, string $desc, string $canon, string $jsonld = '', bool $index = true): string {
  return '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' .
    '<title>' . pron_e($title) . '</title><meta name="description" content="' . pron_e($desc) . '"><link rel="canonical" href="' . pron_e($canon) . '">' .
    ($index ? '' : '<meta name="robots" content="noindex,follow">') .
    '<meta property="og:type" content="website"><meta property="og:site_name" content="OROLADO"><meta property="og:title" content="' . pron_e($title) . '"><meta property="og:description" content="' . pron_e($desc) . '"><meta property="og:url" content="' . pron_e($canon) . '">' .
    '<meta property="og:image" content="' . PRON_BASE . '/icons/icon-512.png"><meta name="theme-color" content="#0B0906"><link rel="icon" href="/favicon.ico">' . $jsonld .
    '<style>' .
    ':root{--bg:#0B0906;--card:#17130D;--line:rgba(255,255,255,.08);--gold:#F5C542;--mute:#B8AA8A;--txt:#F3EAD7;--ok:#4ADE80}' .
    '*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--txt);font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif}' .
    'a{color:var(--gold);text-decoration:none}.w{max-width:760px;margin:0 auto;padding:16px}header.top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-bottom:1px solid var(--line);max-width:760px;margin:0 auto}' .
    '.logo{font-weight:900;letter-spacing:3px;color:var(--gold);font-size:20px}.cta{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 18px;border-radius:12px;background:linear-gradient(180deg,#FDE68A,#F2B33D);color:#1A1205!important;font-weight:800}' .
    '.cta.s{padding:8px 14px;font-size:14px}.crumb{color:var(--mute);font-size:13px;margin:4px 0 12px}h1{font-size:24px;line-height:1.25;margin:6px 0 6px}h2{font-size:18px;margin:22px 0 10px}' .
    '.meta{color:var(--mute);font-size:14px}.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px;margin:12px 0}' .
    '.teams{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;text-align:center}.teams img{width:56px;height:56px;object-fit:contain}.teams b{display:block;font-size:17px}.vs{color:var(--mute);font-weight:800}' .
    '.odds{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.odds div{background:rgba(255,255,255,.05);border-radius:12px;padding:10px;text-align:center}.odds small{display:block;color:var(--mute);font-size:12px}.odds b{color:var(--gold);font-size:20px}.odds i{display:block;font-style:normal;color:var(--txt);font-size:12px;margin-top:2px}' .
    '.odds.two{grid-template-columns:repeat(2,1fr)}.tip{border-left:4px solid var(--gold)}.tip p{margin:6px 0}.pill{display:inline-grid;place-items:center;min-width:24px;height:24px;margin:0 2px;border-radius:6px;font-size:12px;font-weight:800;color:#fff}.W{background:#16A34A}.D{background:#6B7280}.L{background:#DC2626}' .
    '.row{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid var(--line)}.row:first-child{border-top:0}.list a.m{display:grid;grid-template-columns:52px 1fr auto;gap:10px;align-items:center;padding:10px 0;border-top:1px solid var(--line);color:var(--txt)}' .
    '.list a.m:first-of-type{border-top:0}.list .t{color:var(--mute);font-weight:700}.list .o{color:var(--gold);font-weight:800;font-size:14px;white-space:nowrap}.lg{display:flex;align-items:center;gap:8px;font-weight:800;margin:0 0 4px}.lg img{width:22px;height:16px;object-fit:cover;border-radius:2px}' .
    'footer{color:var(--mute);font-size:12px;text-align:center;padding:24px 16px 40px}' .
    '</style></head><body><header class="top"><a class="logo" href="/">OROLADO</a><a class="cta s" href="/">Ouvrir OROLADO</a></header>';
}
function pron_foot(): string {
  return '<footer>OROLADO · Les pronostics et probabilités sont calculés à partir des cotes : aucun résultat n\'est garanti. 18+ · Jouez avec modération.<br><a href="/pronostic.php">Tous les pronostics</a> · <a href="/">orolado.com</a></footer></body></html>';
}

/** Page d'un match. */
function pron_match(string $id): ?string {
  $now = time();
  $f = sb_find($id, $now);
  $row = $f['row'] ?? null; $lg = (array) ($f['lg'] ?? []);
  if (!is_array($row)) return null;
  $h = (string) ($row['h'][1] ?? ''); $a = (string) ($row['a'][1] ?? ''); $ts = (int) ($row['ts'] ?? 0);
  if ($h === '' || $a === '') return null;
  $mf = sb_mk_file($id); $mk = (array) ($mf['mk'] ?? []);
  $p = pron_probs($mk, '1x2'); $po = pron_probs($mk, 'ou:2.5'); $pb = pron_probs($mk, 'btts');
  $lgn = trim((string) ($lg['n'] ?? '')); $lgc = trim((string) ($lg['c'] ?? ''));
  $canon = pron_url($id, $row);
  $when = pron_day_fr($ts) . ' à ' . gmdate('H:i', $ts) . ' (heure d\'Abidjan / Dakar, GMT)';
  $started = $ts <= $now;
  // avis calculé à partir des cotes (sans promesse)
  $avis = []; $pick = '';
  if ($p) {
    $ph = $p['H'] ?? 0; $pa = $p['A'] ?? 0; $pd = $p['D'] ?? 0;
    $fav = $ph >= $pa ? $h : $a; $pf = max($ph, $pa);
    if ($pf >= 0.6) { $avis[] = pron_e($fav) . ' est <b>largement favori</b> : environ <b>' . round($pf * 100) . ' %</b> de chances de gagner d\'après les cotes.'; $pick = 'Victoire ' . $fav; }
    elseif ($pf >= 0.45) { $avis[] = pron_e($fav) . ' est <b>légèrement favori</b> (' . round($pf * 100) . ' %), le nul reste possible (' . round($pd * 100) . ' %).'; $pick = $fav . ' ou nul (double chance)'; }
    else { $avis[] = 'Match <b>très ouvert</b> : ' . pron_e($h) . ' ' . round($ph * 100) . ' %, nul ' . round($pd * 100) . ' %, ' . pron_e($a) . ' ' . round($pa * 100) . ' %.'; $pick = 'Match nul ou moins de 2,5 buts'; }
  }
  if ($po) { $pov = $po['O'] ?? 0;
    if ($pov >= 0.58) { $avis[] = 'On attend des buts : <b>plus de 2,5 buts</b> à environ ' . round($pov * 100) . ' %.'; $pick .= ($pick ? ' · ' : '') . 'Plus de 2,5 buts'; }
    elseif ($pov <= 0.42) { $avis[] = 'Match plutôt <b>fermé</b> : moins de 2,5 buts à environ ' . round((1 - $pov) * 100) . ' %.'; }
    else $avis[] = 'Nombre de buts incertain : plus de 2,5 buts à environ ' . round($pov * 100) . ' %.';
  }
  if ($pb) $avis[] = 'Les deux équipes marquent : environ <b>' . round(($pb['Y'] ?? 0) * 100) . ' %</b>.';
  // forme / face-à-face déjà en mémoire (aucun appel)
  $hid = (int) ($row['h'][0] ?? 0); $aid = (int) ($row['a'][0] ?? 0); $form = '';
  if ($hid && $aid && function_exists('sb_form_rows')) {
    $jh = sb_cache_peek('fixtures?team=' . $hid . '&last=5', 7 * 86400, $now); $ja = sb_cache_peek('fixtures?team=' . $aid . '&last=5', 7 * 86400, $now); $jx = sb_cache_peek('fixtures/headtohead?h2h=' . $hid . '-' . $aid . '&last=5', 7 * 86400, $now);
    $pill = static function (array $rows, int $t): string { $o = ''; foreach (sb_form_wdl($rows, $t) as $k) $o .= '<span class="pill ' . $k . '">' . ['W' => 'V', 'D' => 'N', 'L' => 'D'][$k] . '</span>'; return $o; };
    if ($jh || $ja) $form .= '<h2>Forme des équipes (5 derniers matchs)</h2><div class="card">' . ($jh ? '<div class="row"><span>' . pron_e($h) . '</span><span>' . $pill(sb_form_rows($jh), $hid) . '</span></div>' : '') . ($ja ? '<div class="row"><span>' . pron_e($a) . '</span><span>' . $pill(sb_form_rows($ja), $aid) . '</span></div>' : '') . '</div>';
    if ($jx && ($hh = sb_form_rows($jx))) {
      $form .= '<h2>Face-à-face ' . pron_e($h) . ' – ' . pron_e($a) . '</h2><div class="card">';
      foreach ($hh as $m) $form .= '<div class="row"><span class="meta">' . gmdate('d/m/Y', $m['ts']) . '</span><span>' . pron_e($m['h'][1]) . ' <b>' . $m['g'][0] . ' - ' . $m['g'][1] . '</b> ' . pron_e($m['a'][1]) . '</span></div>';
      $form .= '</div>';
    }
  }
  $o3 = static function (string $lab, ?float $o, ?float $pp): string { return '<div><small>' . pron_e($lab) . '</small><b>' . ($o ? number_format($o, 2) : '—') . '</b>' . ($pp ? '<i>' . round($pp * 100) . ' %</i>' : '') . '</div>'; };
  $odds = '';
  if ($p) $odds .= '<h2>Cotes ' . pron_e($h) . ' – ' . pron_e($a) . '</h2><div class="card"><div class="odds">' . $o3('1 · ' . $h, pron_odd($mk, '1x2', 'H'), $p['H'] ?? null) . $o3('Nul', pron_odd($mk, '1x2', 'D'), $p['D'] ?? null) . $o3('2 · ' . $a, pron_odd($mk, '1x2', 'A'), $p['A'] ?? null) . '</div>';
  if ($p && ($dc = pron_probs($mk, 'dc')) !== []) $odds .= '<p class="meta" style="margin:12px 0 6px">Double chance</p><div class="odds">' . $o3('1X', pron_odd($mk, 'dc', 'HD'), null) . $o3('12', pron_odd($mk, 'dc', 'HA'), null) . $o3('X2', pron_odd($mk, 'dc', 'DA'), null) . '</div>';
  if ($po) $odds .= '<p class="meta" style="margin:12px 0 6px">Total de buts 2,5</p><div class="odds two">' . $o3('Plus de 2,5', pron_odd($mk, 'ou:2.5', 'O'), $po['O'] ?? null) . $o3('Moins de 2,5', pron_odd($mk, 'ou:2.5', 'U'), $po['U'] ?? null) . '</div>';
  if ($pb) $odds .= '<p class="meta" style="margin:12px 0 6px">Les deux équipes marquent</p><div class="odds two">' . $o3('Oui', pron_odd($mk, 'btts', 'Y'), $pb['Y'] ?? null) . $o3('Non', pron_odd($mk, 'btts', 'N'), $pb['N'] ?? null) . '</div>';
  if ($odds) $odds .= '</div>';
  $title = 'Pronostic ' . $h . ' – ' . $a . ' : cotes et analyse | OROLADO';
  $desc = 'Pronostic ' . $h . ' – ' . $a . ' (' . ($lgn !== '' ? $lgn . ', ' : '') . pron_day_fr($ts) . ') : cotes, probabilités, forme et face-à-face. Pariez sur OROLADO.';
  $ld = '<script type="application/ld+json">' . json_encode(['@context' => 'https://schema.org', '@type' => 'SportsEvent', 'name' => $h . ' – ' . $a, 'sport' => 'Football', 'startDate' => gmdate('c', $ts),
    'url' => $canon, 'eventStatus' => 'https://schema.org/EventScheduled', 'location' => ['@type' => 'Place', 'name' => $lgn !== '' ? $lgn : 'Football'],
    'homeTeam' => ['@type' => 'SportsTeam', 'name' => $h], 'awayTeam' => ['@type' => 'SportsTeam', 'name' => $a], 'competitor' => [['@type' => 'SportsTeam', 'name' => $h], ['@type' => 'SportsTeam', 'name' => $a]]], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . '</script>';
  $logo = static fn(string $u): string => $u !== '' ? '<img src="' . pron_e($u) . '" alt="" loading="lazy" width="56" height="56">' : '';
  $go = '/?m=foot:' . $id;
  // autres matchs du même championnat
  $more = '';
  if (!empty($f['day'])) { $j = sb_day((string) $f['day']); $k = 0;
    foreach ((array) ($j['fx'] ?? []) as $oid => $r) { if ((string) $oid === $id || (int) ($r['lg'] ?? 0) !== (int) ($row['lg'] ?? -1) || (int) ($r['ts'] ?? 0) < $now) continue;
      $more .= '<a class="m" href="' . pron_e(pron_url((string) $oid, $r)) . '"><span class="t">' . gmdate('H:i', (int) $r['ts']) . '</span><span>' . pron_e(($r['h'][1] ?? '') . ' – ' . ($r['a'][1] ?? '')) . '</span><span class="o">›</span></a>'; if (++$k >= 8) break; } }
  return pron_head($title, $desc, $canon, $ld, $ts > $now - 3 * 86400) . '<main class="w">' .
    '<div class="crumb"><a href="/pronostic.php">Pronostics</a> › ' . pron_e(trim($lgc . ' · ' . $lgn, ' ·')) . '</div>' .
    '<h1>Pronostic ' . pron_e($h) . ' – ' . pron_e($a) . '</h1><div class="meta">' . pron_e(($lgn !== '' ? $lgn . ($lgc !== '' ? ' (' . $lgc . ')' : '') . ' · ' : '') . $when) . '</div>' .
    '<div class="card"><div class="teams"><div>' . $logo((string) ($row['h'][2] ?? '')) . '<b>' . pron_e($h) . '</b></div><span class="vs">' . ($started ? 'En cours / terminé' : gmdate('H:i', $ts)) . '</span><div>' . $logo((string) ($row['a'][2] ?? '')) . '<b>' . pron_e($a) . '</b></div></div>' .
    '<p style="text-align:center;margin:14px 0 0"><a class="cta" href="' . pron_e($go) . '">Parier sur ce match ›</a></p></div>' .
    ($avis ? '<h2>Notre analyse</h2><div class="card tip">' . implode('', array_map(static fn($t) => '<p>' . $t . '</p>', $avis)) . ($pick !== '' ? '<p>👉 Piste : <b>' . pron_e($pick) . '</b></p>' : '') . '<p class="meta">Probabilités tirées des cotes, marge retirée. Aucun résultat n\'est garanti.</p></div>' : '') .
    $odds . $form .
    '<p style="text-align:center;margin:20px 0"><a class="cta" href="' . pron_e($go) . '">Voir tous les paris du match sur OROLADO ›</a></p>' .
    ($more ? '<h2>Autres matchs · ' . pron_e($lgn) . '</h2><div class="card list">' . $more . '</div>' : '') .
    '</main>' . pron_foot();
}

/** Liste : matchs d'aujourd'hui et de demain (pas encore commencés), grands championnats d'abord. */
function pron_list(): array {
  $now = time(); $out = [];
  foreach ([gmdate('Y-m-d', $now), gmdate('Y-m-d', $now + 86400), gmdate('Y-m-d', $now + 2 * 86400)] as $d) {
    $j = sb_day($d);
    foreach ((array) ($j['fx'] ?? []) as $id => $r) {
      if (!is_array($r) || (int) ($r['ts'] ?? 0) < $now - 1800 || (int) ($r['n'] ?? 0) <= 0) continue;
      $l = (array) ($j['lg'][(string) ($r['lg'] ?? '')] ?? []);
      $out[(string) $id] = ['id' => (string) $id, 'r' => $r, 'l' => $l, 'p' => (int) ($l['p'] ?? 100)];
    }
  }
  uasort($out, static fn($a, $b) => ($a['p'] <=> $b['p']) ?: ((int) $a['r']['ts'] <=> (int) $b['r']['ts']));
  return $out;
}
function pron_index(): string {
  $L = array_slice(pron_list(), 0, 220, true); $by = [];
  foreach ($L as $x) { $k = (string) ($x['r']['lg'] ?? ''); $by[$k] = $by[$k] ?? ['l' => $x['l'], 'm' => []]; $by[$k]['m'][] = $x; }
  $html = '';
  foreach ($by as $g) {
    $html .= '<div class="card list"><p class="lg">' . (!empty($g['l']['f']) ? '<img src="' . pron_e((string) $g['l']['f']) . '" alt="" loading="lazy">' : '') . pron_e(trim(((string) ($g['l']['c'] ?? '')) . ' · ' . ((string) ($g['l']['n'] ?? '')), ' ·')) . '</p>';
    foreach ($g['m'] as $x) { $r = $x['r']; $o = (array) ($r['o'] ?? []); $os = [];
      foreach ($o as $z) if (isset($z[1])) $os[] = number_format((float) $z[1], 2);
      $html .= '<a class="m" href="' . pron_e(pron_url($x['id'], $r)) . '"><span class="t">' . gmdate('d/m H:i', (int) $r['ts']) . '</span><span>' . pron_e(($r['h'][1] ?? '') . ' – ' . ($r['a'][1] ?? '')) . '</span><span class="o">' . pron_e(implode(' · ', $os)) . '</span></a>'; }
    $html .= '</div>';
  }
  return pron_head('Pronostics foot du jour : cotes et analyses | OROLADO', 'Pronostics football d\'aujourd\'hui et de demain : Ligue des champions, Premier League, Ligue 1, Liga, championnats africains… Cotes, probabilités, forme des équipes. Pariez sur OROLADO.', PRON_HOME) .
    '<main class="w"><h1>Pronostics foot du jour</h1><p class="meta">Cotes, probabilités et analyse de chaque match. Heures en GMT (Abidjan, Dakar).</p>' .
    ($html !== '' ? $html : '<div class="card">Aucun match pour le moment. Revenez bientôt.</div>') .
    '<p style="text-align:center;margin:20px 0"><a class="cta" href="/">Parier sur OROLADO ›</a></p></main>' . pron_foot();
}
function pron_sitemap(): string {
  $x = '<?xml version="1.0" encoding="UTF-8"?>' . "\n" . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
  $x .= '<url><loc>' . PRON_HOME . '</loc><changefreq>hourly</changefreq><priority>0.9</priority></url>' . "\n";
  foreach (array_slice(pron_list(), 0, 2000, true) as $m) $x .= '<url><loc>' . pron_e(pron_url($m['id'], $m['r'])) . '</loc><lastmod>' . gmdate('Y-m-d') . '</lastmod><changefreq>hourly</changefreq><priority>0.7</priority></url>' . "\n";
  return $x . '</urlset>' . "\n";
}

// ----------------------------------------------------------------------------------------------- réponse
try {
  if (!(bool) (sb_config()['public'] ?? false)) { http_response_code(404); echo 'Not found'; exit; }
  if (isset($_GET['sitemap'])) {
    header('Content-Type: application/xml; charset=utf-8'); header('Cache-Control: public, max-age=1800');
    echo pron_cache('pron-sitemap.xml', 1800, 'pron_sitemap'); exit;
  }
  $id = preg_match('/^\d{3,12}$/', (string) ($_GET['id'] ?? '')) ? (string) $_GET['id'] : (preg_match('/-(\d{3,12})$/', (string) ($_GET['m'] ?? ''), $mm) ? $mm[1] : '');
  header('Content-Type: text/html; charset=utf-8'); header('Cache-Control: public, max-age=300');
  if ($id === '') { echo pron_cache('pron-index.html', 300, 'pron_index'); exit; }
  $page = pron_cache('pron-' . $id . '.html', 600, static fn() => (string) pron_match($id));
  if ($page === '') { http_response_code(404); echo pron_head('Match introuvable | OROLADO', 'Ce match n\'est plus disponible.', PRON_HOME, '', false) . '<main class="w"><h1>Match introuvable</h1><p><a class="cta" href="/pronostic.php">Voir les pronostics du jour ›</a></p></main>' . pron_foot(); exit; }
  echo $page;
} catch (Throwable $e) {
  error_log('OROLADO pronostic ' . $e->getMessage());
  http_response_code(503); echo 'Service momentanément indisponible.';
}
