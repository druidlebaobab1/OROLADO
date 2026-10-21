<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * 2026-10-21 — RÉSULTATS PROPOSÉS des paris (sports_results.php). AUCUN accès à internet : les réponses ESPN / TheSportsDB
 * viennent de scripts/fixtures/ (vraies réponses du 20/10/2026 raccourcies + exemples fabriqués). Fausse caisse, dossier
 * temporaire : rien ne part en ligne. Vérifie : noms d'équipe (surnoms, accents), 1 · N · 2, nul = remboursé, double chance,
 * plus / moins, les deux équipes marquent, score exact, match pas fini ignoré, prolongation ignorée, nom trop différent ignoré,
 * sources en désaccord, rien n'est réglé tout seul, et la validation passe par sp_admin_settle (même chemin qu'à la main).
 */
$tmp = sys_get_temp_dir() . '/orolado_spres_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data/archive', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'aff_lib.php', 'casino_lib.php', 'sports_lib.php', 'sports_results.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
$bal = []; $keys = [];
$GLOBALS['OROLADO_FAKE_RPC'] = function (string $fn, array $a) use (&$bal, &$keys) {
  $u = $a['p_user'];
  if ($fn === 'debit_real') { if (($bal[$u] ?? 0) + 1e-9 < $a['p_amount']) return ['ok' => false, 'reason' => 'insufficient']; $bal[$u] = round(($bal[$u] ?? 0) - $a['p_amount'], 2); return ['ok' => true, 'real' => $bal[$u]]; }
  if ($fn === 'resolve_trade') { $k = $u . '|' . $a['p_order']; if (!isset($keys[$k])) { $keys[$k] = 1; $bal[$u] = round(($bal[$u] ?? 0) + $a['p_amount'], 2); } return ['ok' => true, 'real' => $bal[$u]]; }
  return null;
};
$GLOBALS['OROLADO_FAKE_HTTP'] = function () { return []; };
// réponses des sources : adresse → fichier d'exemple ; tout le reste = réponse vide (comme une source sans résultat)
$FX = __DIR__ . '/fixtures/';
$asked = [];
$GLOBALS['SPR_FAKE_FETCH'] = function (string $url) use ($FX, &$asked): string {
  $asked[] = $url;
  $map = [
    'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard?dates=20261020' => 'espn-uefa.champions-20261020.json',
    'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=20261020' => 'espn-nba-20261020.json',
    'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.europa/scoreboard?dates=20261022' => 'espn-uefa.europa-20261022-synthetic.json',
    'https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d=2026-10-20&s=Soccer' => 'tsdb-eventsday-2026-10-20.json',
    'https://www.thesportsdb.com/api/v1/json/123/eventsday.php?d=2026-10-22&s=Soccer' => 'tsdb-eventsday-2026-10-22-synthetic.json',
    'https://www.thesportsdb.com/api/v1/json/123/searchevents.php?e=Liverpool_vs_Villarreal&s=2026-2027' => 'tsdb-search-liverpool-villarreal.json',
  ];
  return isset($map[$url]) ? (string) file_get_contents($FX . $map[$url]) : '{}';
};
require $tmp . '/orolado_lib.php'; require $tmp . '/trade_lib.php'; require $tmp . '/aff_lib.php'; require $tmp . '/casino_lib.php'; require $tmp . '/sports_lib.php'; require $tmp . '/sports_results.php';
foreach (['seed-2026-10', 'seed-2026-10b', 'seed-2026-10c', 'seed-2026-10d', 'seed-2026-10e', 'market-2026-10-21', 'draw-2026-10', 'stale-2026-10'] as $fl) @file_put_contents(sp_dir() . DIRECTORY_SEPARATOR . $fl . '.done', '1'); // pas de publication automatique
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
$T = static fn(string $s): int => (int) strtotime($s . ' UTC');

echo "1) Noms d'équipe (surnoms, accents, sigles)\n";
foreach ([['PSG', 'Paris Saint-Germain'], ['Man Utd', 'Manchester United'], ['Man City', 'Manchester City'], ['Atlético Madrid', 'Atletico de Madrid'], ['Beşiktaş', 'Besiktas JK'],
  ['Bayern Munich', 'FC Bayern München'], ['Inter', 'Internazionale'], ['AC Milan', 'Milan'], ['Minnesota T-Wolves', 'Minnesota Timberwolves'], ['Olympique de Marseille', 'Marseille'],
  ['FC Barcelona', 'Barcelone'], ['RC Lens', 'Lens'], ['Leeds United', 'Leeds Utd'], ['Bodo/Glimt', 'Bodø/Glimt'], ['TSG 1899 Hoffenheim', 'Hoffenheim'], ['LOSC Lille', 'Lille'], ['Fenerbahçe', 'Fenerbahce']] as [$x, $y])
  check("« $x » = « $y »", spr_sim($x, $y) === 1.0, (string) spr_sim($x, $y));
check('« Heat » ressemble à « Miami Heat » (mot contenu)', spr_sim('Heat', 'Miami Heat') >= SPR_MIN_SIM);
foreach ([['Manchester United', 'Manchester City'], ['Celtic', 'Celta Vigo'], ['Real Madrid', 'Real Sociedad'], ['PSG', 'Paris FC'], ['Inter', 'AC Milan'], ['Liverpool', 'Villarreal'], ['Napoli', 'Nice']] as [$x, $y])
  check("« $x » ≠ « $y » (ressemblance trop faible)", spr_sim($x, $y) < SPR_MIN_SIM, (string) spr_sim($x, $y));

echo "2) Lecture des sources\n";
$ucl = spr_parse_espn(json_decode((string) file_get_contents($FX . 'espn-uefa.champions-20261020.json'), true), 'soccer', 'uefa.champions');
check('ESPN Ligue des champions 20/10 : 9 matchs finis lus', count($ucl) === 9 && count(array_filter($ucl, fn($g) => $g['final'])) === 9);
$syn = spr_parse_espn(json_decode((string) file_get_contents($FX . 'espn-uefa.europa-20261022-synthetic.json'), true), 'soccer', 'uefa.europa');
$byId = []; foreach ($syn as $g) $byId[$g['home'][0]] = $g;
check('ESPN : match en cours → PAS fini', $byId['SK Sturm Graz']['final'] === false);
check('ESPN : match pas commencé → PAS fini', $byId['Celtic']['final'] === false);
check('ESPN : prolongation (AET) → PAS retenu en football', $byId['TSG Hoffenheim']['final'] === false);
$ts = spr_parse_tsdb(json_decode((string) file_get_contents($FX . 'tsdb-eventsday-2026-10-22-synthetic.json'), true));
check('TheSportsDB : 2 matchs « FT » finis, « NS » pas fini', count(array_filter($ts, fn($g) => $g['final'])) === 2 && !$ts[2]['final']);
check('TheSportsDB : heure lue en UTC', $ts[0]['ts'] === $T('2026-10-22 19:00'));
$m = spr_match('PSG', 'FC Barcelona', $T('2026-10-20 19:00'), $ucl);
check('PSG – FC Barcelona relié à « Paris Saint-Germain – Barcelona » 4-2, noms identiques', $m && $m['exact'] && $m['g']['hs'] === 4 && $m['g']['as'] === 2 && !$m['swap']);
$m = spr_match('Barcelona', 'PSG', $T('2026-10-20 19:00'), $ucl);
check('titre dans l’autre sens : relié quand même (sens inversé noté)', $m && $m['swap']);
check('mauvaise date (5 jours plus tard) : pas relié', spr_match('PSG', 'FC Barcelona', $T('2026-10-25 19:00'), $ucl) === null);
check('Manchester United – AEK : pas relié à Manchester City – AEK', spr_match('Manchester United', 'Bournemouth', $T('2026-10-20 19:00'), $ucl) === null && spr_match('Manchester United', 'AEK Athens', $T('2026-10-20 19:00'), $ucl) === null);

echo "3) Score → choix gagnant (seulement si c'est certain)\n";
$ev = static fn(string $title, array $labels, string $sport = 'foot', string $league = 'Ligue 1'): array => ['id' => 'x', 'title' => $title, 'league' => $league, 'sport' => $sport,
  'opts' => array_map(static fn($l, $i) => ['k' => $l === 'Nul' ? 'oD' : 'o' . $i, 'label' => $l, 'odd' => 2.0], $labels, array_keys($labels))];
$d = static function (array $e, int $h, int $a): array { $tm = spr_teams($e); return spr_derive($e, $tm, $h, $a); };
$e = $ev('Olympique de Marseille - Paris Saint-Germain', ['Marseille', 'Nul', 'PSG']);
check('1 · N · 2 : 2-1 → Marseille', $d($e, 2, 1)['k'] === 'o0');
check('1 · N · 2 : 1-1 → Nul', $d($e, 1, 1)['k'] === 'oD');
check('1 · N · 2 : 0-3 → PSG (surnom)', $d($e, 0, 3)['k'] === 'o2');
$e = $ev('PSG - FC Barcelona', ['PSG', 'Barcelona'], 'foot', 'Ligue des champions · nul = remboursé');
check('2 choix « nul = remboursé » : 2-2 → Annulé (mises rendues)', $d($e, 2, 2)['k'] === 'void');
$e2 = $ev('PSG - FC Barcelona', ['PSG', 'Barcelona'], 'foot', 'Ligue des champions');
check('2 choix SANS la règle : 2-2 → rien proposé (à la main)', $d($e2, 2, 2)['k'] === null);
$e = $ev('Lyon - Lens : double chance', ['Lyon ou nul', 'Lens']);
check('double chance « Lyon ou nul » / « Lens » : 1-1 → Lyon ou nul', $d($e, 1, 1)['k'] === 'o0');
check('double chance : 0-1 → Lens', $d($e, 0, 1)['k'] === 'o1');
$e = $ev('Lyon - Lens', ['1X', '12', 'X2']);
check('« 1X / 12 / X2 » ensemble : 2 choix gagnants → rien proposé', $d($e, 2, 0)['k'] === null);
$e = $ev('Bournemouth – Milan : les deux équipes marquent ?', ['Oui', 'Non'], 'event', 'Ligue Europa');
check('les deux équipes marquent : 1-1 → Oui', $d($e, 1, 1)['k'] === 'o0');
check('les deux équipes marquent : 2-0 → Non', $d($e, 2, 0)['k'] === 'o1');
$e = $ev('Beşiktaş – Crystal Palace : 3 buts ou plus dans le match ?', ['Oui', 'Non'], 'event');
check('3 buts ou plus : 2-1 → Oui', $d($e, 2, 1)['k'] === 'o0');
check('3 buts ou plus : 1-1 → Non', $d($e, 1, 1)['k'] === 'o1');
$e = $ev('Lakers – Warriors : plus de 234,5 points au total ?', ['Oui', 'Non'], 'event', 'NBA · total de points');
check('plus de 234,5 points : 120-115 → Oui', $d($e, 120, 115)['k'] === 'o0');
check('plus de 234,5 points : 110-110 → Non', $d($e, 110, 110)['k'] === 'o1');
$e = $ev('Combien de buts dans PSG – Barcelone ?', ['0 à 2 buts', '3 buts ou plus'], 'event', 'Ligue des champions');
check('« 0 à 2 buts » / « 3 buts ou plus » : 4-2 → 3 ou plus', $d($e, 4, 2)['k'] === 'o1');
check('« 0 à 2 buts » / « 3 buts ou plus » : 0-0 → 0 à 2', $d($e, 0, 0)['k'] === 'o0');
$e = $ev('Lens - Lille : plus ou moins', ['Plus de 2,5 buts', 'Moins de 2,5 buts']);
check('plus / moins de 2,5 buts : 2-1 → plus', $d($e, 2, 1)['k'] === 'o0');
check('plus / moins de 2,5 buts : 1-0 → moins', $d($e, 1, 0)['k'] === 'o1');
$e = $ev('Lens - Lille : score exact', ['1-0', '2-1', '1-1', '0-2']);
check('score exact : 2-1 → « 2-1 »', $d($e, 2, 1)['k'] === 'o1');
check('score exact absent de la liste : 3-3 → rien', $d($e, 3, 3)['k'] === null);
$e = $ev('Lens - Lille : premier buteur', ['Openda', 'David', 'Aucun']);
check('premier buteur : rien proposé (à valider à la main)', $d($e, 1, 0)['k'] === null && str_contains($d($e, 1, 0)['why'], 'main'));
$e = $ev('Lens - Lille : plus de 2 buts ?', ['Oui', 'Non']);
check('« plus de 2 buts » (ligne entière, ambiguë) : rien proposé', $d($e, 2, 0)['k'] === null);
check('question Bitcoin / F1 / Ballon d’Or : pas un match', spr_teams(['title' => 'F1 GP des États-Unis : Leclerc ou Hamilton, qui finit devant ?']) === null && spr_teams(['title' => 'Bitcoin au-dessus de 82 000 $ le vendredi 23 octobre à 12 h (UTC) ?']) === null);

echo "4) Liste de l'admin (événements finis, sources d'exemple, aucun paiement)\n";
$db = blank_db();
$A = 'aaaaaaaa-1111-2222-3333-444444444444';
$db['users']['u_a'] = ['id' => 'u_a', 'email' => 'a@gmail.com', 'role' => 'user', 'sbId' => $A];
$db['vault']['u_a'] = ['demo' => 1000, 'real' => 100];
save_db(orolado_data_file(), $db); $bal[$A] = 100.0;
$mk = static function (string $id, string $title, string $league, string $sport, string $start, array $labels, string $end = '') use ($T): array {
  $o = []; foreach ($labels as $i => $l) $o[] = ['k' => $l === 'Nul' ? 'oD' : 'o' . $i, 'label' => $l, 'odd' => 2.0];
  return ['id' => $id, 'title' => $title, 'league' => $league, 'sport' => $sport, 'start' => $T($start), 'opts' => $o, 'status' => 'open', 'createdAt' => $T('2026-10-17 00:00'), 'logos' => []] + ($end !== '' ? ['endAt' => $T($end)] : []);
};
$events = [
  $mk('epsg', 'PSG - FC Barcelona', 'Ligue des champions · nul = remboursé', 'foot', '2026-10-20 16:45', ['PSG', 'Barcelona'], '2026-10-20 21:00'),
  $mk('eliv', 'Liverpool - Villarreal', 'Ligue des champions', 'foot', '2026-10-20 19:00', ['Liverpool', 'Nul', 'Villarreal']),
  $mk('estu', 'VfB Stuttgart - Atlético Madrid', 'Ligue des champions · nul = remboursé', 'foot', '2026-10-20 16:45', ['Stuttgart', 'Atlético'], '2026-10-20 21:00'),
  $mk('epor', 'FC Porto - PSV Eindhoven', 'Ligue des champions', 'foot', '2026-10-20 19:00', ['Porto', 'Nul', 'PSV']),
  $mk('egoal', 'Combien de buts dans PSG – Barcelone ?', 'Ligue des champions', 'event', '2026-10-20 19:00', ['0 à 2 buts', '3 buts ou plus']),
  $mk('edet', 'Detroit Pistons - Boston Celtics', 'NBA · match d’ouverture', 'basket', '2026-10-20 18:30', ['Pistons', 'Celtics'], '2026-10-20 22:00'),
  $mk('ekni', 'New York Knicks - Philadelphia 76ers', 'NBA · match d’ouverture', 'basket', '2026-10-20 22:30', ['Knicks', '76ers'], '2026-10-21 02:00'),
  $mk('espu', 'San Antonio Spurs - Oklahoma City Thunder', 'NBA · match d’ouverture', 'basket', '2026-10-21 01:00', ['Spurs', 'Thunder'], '2026-10-21 04:30'),
  $mk('ebou', 'Bournemouth - AC Milan', 'Ligue Europa', 'foot', '2026-10-22 19:00', ['Bournemouth', 'Nul', 'Milan']),
  $mk('ebtts', 'Bournemouth – Milan : les deux équipes marquent ?', 'Ligue Europa', 'event', '2026-10-22 19:00', ['Oui', 'Non']),
  $mk('ebes', 'Beşiktaş – Crystal Palace : 3 buts ou plus dans le match ?', 'Ligue Europa', 'event', '2026-10-22 19:00', ['Oui', 'Non']),
  $mk('estg', 'Sturm Graz - Olympique de Marseille', 'Ligue Europa', 'foot', '2026-10-22 16:45', ['Sturm Graz', 'Nul', 'Marseille']),
  $mk('ehof', 'Hoffenheim - Olympique Lyonnais', 'Ligue Europa', 'foot', '2026-10-22 19:00', ['Hoffenheim', 'Nul', 'Lyon']),
  $mk('emun', 'Manchester United - AEK Athens', 'Ligue des champions', 'foot', '2026-10-20 19:00', ['Man United', 'Nul', 'AEK']),
  $mk('ebtc', 'Bitcoin au-dessus de 82 000 $ le vendredi 23 octobre à 12 h (UTC) ?', 'Bitcoin · prix Coinbase', 'event', '2026-10-21 12:00', ['Oui', 'Non']),
  $mk('ef1', 'F1 GP des États-Unis : Leclerc ou Hamilton, qui finit devant ?', 'Formule 1 · duel', 'event', '2026-10-20 20:00', ['Leclerc', 'Hamilton']),
  $mk('esoon', 'Celtic - Celta Vigo', 'Ligue Europa', 'foot', '2026-10-22 22:00', ['Celtic', 'Nul', 'Celta']), // commencé il y a moins de 2 h → pas listé
];
$done = $mk('edone', 'Napoli - Bodo/Glimt', 'Ligue des champions', 'foot', '2026-10-20 19:00', ['Napoli', 'Nul', 'Bodo']); $done['status'] = 'settled'; $done['result'] = 'o0'; $done['settledAt'] = $T('2026-10-20 22:00');
$events[] = $done;
sp_with('events.json', static function (array &$s) use ($events) { $s['e'] = $events; return true; });
// un pari réel sur Liverpool (pour vérifier que RIEN n'est payé sans le clic de l'admin)
sp_with('bets.json', static function (array &$s) { $s['b'] = [['id' => 'sp_test1', 'uid' => 'aaaaaaaa-1111-2222-3333-444444444444', 'mode' => 'real', 'stake' => 10.0, 'odd' => 2.0, 'pot' => 20.0,
  'sel' => [['ev' => 'eliv', 'k' => 'o0', 'odd' => 2.0, 't' => 'Liverpool - Villarreal', 'l' => 'Liverpool']], 'status' => 'open', 'at' => (int) strtotime('2026-10-19 10:00 UTC')]]; return true; });
$before = [(string) file_get_contents(sp_dir() . '/events.json'), (string) file_get_contents(sp_dir() . '/bets.json')];
$now = $T('2026-10-22 23:30');
$r = spr_admin_proposals($now);
$P = []; foreach ($r['list'] as $p) $P[$p['id']] = $p;
$sc = static fn(string $id): string => isset($P[$id]['score']) && $P[$id]['score'] ? implode('-', $P[$id]['score']) : '-';
check('réponse ok', $r['ok'] === true);
check('rien n’est modifié (événements, paris) par la recherche', $before === [(string) file_get_contents(sp_dir() . '/events.json'), (string) file_get_contents(sp_dir() . '/bets.json')]);
check('solde du joueur inchangé (aucun paiement automatique)', $bal[$A] === 100.0);
check('PSG – Barça : 4-2, choix « PSG », sûr (ESPN, noms identiques)', ($P['epsg']['k'] ?? '') === 'o0' && $sc('epsg') === '4-2' && $P['epsg']['conf'] === 'sur', json_encode($P['epsg'] ?? null, JSON_UNESCAPED_UNICODE));
check('Liverpool – Villarreal : 4-3, « Liverpool », sûr, 2 sources d’accord', ($P['eliv']['k'] ?? '') === 'o0' && $sc('eliv') === '4-3' && $P['eliv']['conf'] === 'sur' && count($P['eliv']['srcs']) === 2, json_encode($P['eliv']['srcs'] ?? null));
check('Stuttgart – Atlético 1-1, « nul = remboursé » → Annulé', ($P['estu']['k'] ?? '') === 'void' && $sc('estu') === '1-1');
check('Porto – PSV 0-1 → PSV', ($P['epor']['k'] ?? '') === 'o2');
check('Combien de buts PSG – Barcelone (6) → 3 buts ou plus', ($P['egoal']['k'] ?? '') === 'o1');
check('NBA : Pistons 121-113 → Pistons', ($P['edet']['k'] ?? '') === 'o0' && $sc('edet') === '121-113');
check('NBA : Knicks 100-106 76ers → 76ers', ($P['ekni']['k'] ?? '') === 'o1');
check('NBA : Spurs – Thunder (jour US de la veille chez ESPN) → Thunder', ($P['espu']['k'] ?? '') === 'o1' && $sc('espu') === '104-116');
check('Bournemouth – Milan 1-1 → Nul, sûr (2 sources)', ($P['ebou']['k'] ?? '') === 'oD' && $P['ebou']['conf'] === 'sur');
check('Bournemouth – Milan : les deux équipes marquent → Oui', ($P['ebtts']['k'] ?? '') === 'o0');
check('Beşiktaş – Palace : sources en désaccord (2-1 / 2-0) → rien proposé, à vérifier', isset($P['ebes']) && $P['ebes']['k'] === null && $P['ebes']['conf'] === 'verifier', json_encode($P['ebes'] ?? null, JSON_UNESCAPED_UNICODE));
check('Sturm Graz – Marseille en cours → rien proposé', isset($P['estg']) && $P['estg']['k'] === null && $P['estg']['score'] === null);
check('Hoffenheim – Lyon après prolongation → rien proposé', isset($P['ehof']) && $P['ehof']['k'] === null);
check('Manchester United – AEK : pas relié à Man City – AEK → rien proposé', isset($P['emun']) && $P['emun']['k'] === null && !$P['emun']['srcs'], json_encode($P['emun']['srcs'] ?? null));
check('Bitcoin / F1 : pas cherchés (à la main)', !isset($P['ebtc']) && !isset($P['ef1']) && $r['manual'] === 2);
check('commencé il y a moins de 2 h : pas listé', !isset($P['esoon']));
check('déjà réglé : pas listé', !isset($P['edone']));
check('chaque adresse demandée une seule fois', count($asked) === count(array_unique($asked)), count($asked) . ' demandes');
check('au plus ' . SPR_MAX_FETCH . ' lectures', count($asked) <= SPR_MAX_FETCH);

echo "5) Validation = action EXISTANTE (sp_admin_settle), un clic de l'admin\n";
$st = sp_admin_settle(load_db(), 'eliv', (string) $P['eliv']['k']);
check('« Valider » Liverpool : réglé, le pari gagné est payé une fois (10 × 2 = 20 $)', !empty($st['ok']) && $st['won'] === 1 && $bal[$A] === 120.0, json_encode($st));
check('deuxième clic refusé (jamais payé deux fois)', empty(sp_admin_settle(load_db(), 'eliv', 'o0')['ok']) && $bal[$A] === 120.0);
$r2 = spr_admin_proposals($now);
check('l’événement réglé n’est plus proposé', !in_array('eliv', array_column($r2['list'], 'id'), true));

echo "\n" . ($fail ? "ÉCHEC : $fail test(s) sur " . ($pass + $fail) : "OK : $pass tests") . "\n";
exit($fail ? 1 : 0);
