<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * 2026-10-22 — PARIS AUTOMATIQUES (sb_lib.php, étape 1 : football avant-match). AUCUN accès à internet : les réponses
 * viennent de scripts/fixtures/sb/ (format API-Football v3 supposé). Fausse caisse, dossier temporaire.
 * Vérifie : marges (≤ moyenne − 0,01, ≥ 1,01, marge du réglage), règlement de chaque marché (mi-temps, 2e mi-temps,
 * AET), annulations (pari tardif, reporté > 48 h, AWD), sp_bet + sp_resolve de bout en bout (payé UNE fois), admin seul.
 * Lancer : php scripts/test-sb.php
 */
$tmp = sys_get_temp_dir() . '/orolado_sb_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data/archive', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'aff_lib.php', 'casino_lib.php', 'sports_lib.php', 'sb_lib.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
putenv('APIFOOTBALL_KEY=test-secret-key-123');
putenv('ADMIN_EMAIL=admin@orolado.com');
$bal = []; $keys = []; $credits = 0;
$GLOBALS['OROLADO_FAKE_RPC'] = function (string $fn, array $a) use (&$bal, &$keys, &$credits) {
  $u = $a['p_user'];
  if ($fn === 'debit_real') { if (($bal[$u] ?? 0) + 1e-9 < $a['p_amount']) return ['ok' => false, 'reason' => 'insufficient']; $bal[$u] = round(($bal[$u] ?? 0) - $a['p_amount'], 2); return ['ok' => true, 'real' => $bal[$u]]; }
  if ($fn === 'resolve_trade') { $k = $u . '|' . $a['p_order']; if (!isset($keys[$k])) { $keys[$k] = 1; $credits++; $bal[$u] = round(($bal[$u] ?? 0) + $a['p_amount'], 2); } return ['ok' => true, 'real' => $bal[$u]]; }
  return null;
};
$GLOBALS['OROLADO_FAKE_HTTP'] = function () { return []; };
$FX = __DIR__ . '/fixtures/sb/';
$asked = []; $alt = [];
$GLOBALS['SB_FAKE_FETCH'] = function (string $path) use ($FX, &$asked, &$alt): string {
  $asked[] = $path;
  if (isset($alt[$path])) return $alt[$path][0] === '{' ? $alt[$path] : (string) file_get_contents($FX . $alt[$path]);
  $map = [
    'fixtures?date=2026-10-22&timezone=UTC' => 'fixtures-2026-10-22.json',
    'fixtures?date=2026-10-23&timezone=UTC' => 'fixtures-2026-10-23.json',
    'odds?date=2026-10-22&timezone=UTC&page=1' => 'odds-2026-10-22-p1.json',
    'odds?date=2026-10-22&timezone=UTC&page=2' => 'odds-2026-10-22-p2.json',
    'odds?date=2026-10-23&timezone=UTC&page=1' => 'odds-2026-10-23-p1.json',
    'fixtures?live=all&timezone=UTC' => 'fixtures-live.json',
    'status' => 'status.json',
  ];
  if (isset($map[$path])) return (string) file_get_contents($FX . $map[$path]);
  return '{"get":"x","parameters":[],"errors":[],"results":0,"paging":{"current":1,"total":1},"response":[]}';
};
$GLOBALS['SB_FAKE_PUSH'] = [];
require $tmp . '/orolado_lib.php'; require $tmp . '/trade_lib.php'; require $tmp . '/aff_lib.php'; require $tmp . '/casino_lib.php'; require $tmp . '/sports_lib.php';
foreach (['seed-2026-10', 'seed-2026-10b', 'seed-2026-10c', 'seed-2026-10d', 'seed-2026-10e', 'market-2026-10-21', 'draw-2026-10', 'stale-2026-10'] as $fl) @file_put_contents(sp_dir() . DIRECTORY_SEPARATOR . $fl . '.done', '1');
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
$T = static fn(string $s): int => (int) strtotime($s . ' UTC');
$at = static function (string $s) use ($T): int { $GLOBALS['SB_NOW'] = $T($s); return $T($s); };
$A = 'aaaaaaaa-1111-2222-3333-444444444444'; $B = 'bbbbbbbb-1111-2222-3333-444444444444'; $ADM = 'dddddddd-1111-2222-3333-444444444444';
$db = blank_db();
$db['users']['u_a'] = ['id' => 'u_a', 'email' => 'a@gmail.com', 'role' => 'user', 'sbId' => $A];
$db['users']['u_b'] = ['id' => 'u_b', 'email' => 'b@gmail.com', 'role' => 'user', 'sbId' => $B];
$db['users']['u_adm'] = ['id' => 'u_adm', 'email' => 'admin@orolado.com', 'role' => 'admin', 'sbId' => $ADM];
save_db(orolado_data_file(), $db); $bal[$A] = 1000.0; $bal[$B] = 1000.0; $bal[$ADM] = 1000.0;
$ua = $db['users']['u_a']; $ub = $db['users']['u_b']; $uadm = $db['users']['u_adm'];
$odd = static function (string $fid, string $mk, string $k): ?float { foreach ((array) (sb_mk_file($fid)['mk'][$mk] ?? []) as $o) if ($o[0] === $k) return (float) $o[1]; return null; };

echo "1) Réglages par défaut, visibilité\n";
$c = sb_config();
check('défauts : public NON, résultats automatiques OUI, marges 10/12/18/12/10, alertes 50/500/200', $c['public'] === false && $c['autosettle'] === true && $c['mMain'] == 10 && $c['mSide'] == 12 && $c['mExotic'] == 18 && $c['mLive'] == 12 && $c['mOther'] == 10 && $c['alertStake'] == 50 && $c['alertPot'] == 500 && $c['alertWin'] == 200);
$NOW = $at('2026-10-22 08:00');
check('joueur : sbList refusé (admin seul)', sb_list($ua, 0, 0, $NOW)['reason'] === 'off');
check('visiteur : sbList refusé', sb_list(null, 0, 0, $NOW)['reason'] === 'off');
check('admin : sbList ouvert (vide avant import)', sb_list($uadm, 0, 0, $NOW)['ok'] === true && sb_list($uadm, 0, 0, $NOW)['fx'] === []);

echo "2) Import (fixtures J-1…J+2, cotes paginées)\n";
$r = sb_admin_import($NOW);
check('import : lectures fixtures + odds (pages 1 et 2 de J, J+1, J+2)', $r['ok'] && in_array('odds?date=2026-10-22&timezone=UTC&page=2', $asked, true) && in_array('fixtures?date=2026-10-21&timezone=UTC', $asked, true) && in_array('odds?date=2026-10-24&timezone=UTC&page=1', $asked, true), implode(' | ', $r['log']));
check('budget compté', sb_budget($NOW)['used'] === count($asked), sb_budget($NOW)['used'] . ' / ' . count($asked));
$idx = sb_day('2026-10-22');
check('index du jour : 4 matchs, compétitions avec drapeau / logo / priorité', count($idx['fx']) === 4 && $idx['lg']['39']['p'] === 2 && $idx['lg']['386']['p'] === 30 && str_starts_with($idx['lg']['39']['f'], 'https://media.api-sports.io/'));
check('match sans cotes (9005) : n = 0', (int) ($idx['fx']['9005']['n'] ?? 0) === 0);
$m1 = sb_mk_file('9001')['mk'] ?? [];
$fams = array_unique(array_map('sb_fam', array_keys($m1)));
$want = ['1x2', 'dc', 'dnb', 'ou', 'btts', 'tth', 'tta', 'oe', 'csh', 'csa', 'wnh', 'wna', 'eh', 'ah', 'ht1x2', 'htou', 'htbtts', '2h1x2', 'htft', 'cs', 'rbtts', 'rou', 'eg', 'hsh'];
check('9001 : les 24 familles de marchés de la spec', !array_diff($want, $fams), implode(',', array_diff($want, $fams)));
check('ordre : 1x2 en premier, ou:1.5 avant ou:2.5', array_keys($m1)[0] === '1x2' && array_search('ou:1.5', array_keys($m1)) < array_search('ou:2.5', array_keys($m1)));
check('ah : demi-lignes seulement (-1.5, 0.5), pas -0.25', isset($m1['ah:-1.5'], $m1['ah:0.5']) && !isset($m1['ah:-0.25']));
check('eh:-1 (3 choix) ; eg avec « 6+ » ; hsh 1/2/X', count($m1['eh:-1'] ?? []) === 3 && in_array('6+', array_column($m1['eg'] ?? [], 0), true) && array_column($m1['hsh'], 0) === ['1', '2', 'X']);
check('ou:3.5 (1 seul bookmaker) : pas proposé', !isset($m1['ou:3.5']));
$files = array_map('basename', glob(sb_dir() . '/*.json'));
check('stockage compact : index par jour + marchés par match', in_array('foot-day-2026-10-22.json', $files, true) && is_file(sb_dir() . '/mk/foot-9001.json') && filesize(sb_dir() . '/foot-day-2026-10-22.json') < 20000);

// moyennes indépendantes (3 bons bookmakers ; le 4e « Bizarre » a un 1x2 incohérent → écarté)
$oj = json_decode((string) file_get_contents($FX . 'odds-2026-10-22-p1.json'), true);
$avg = []; $cnt = [];
foreach ($oj['response'][0]['bookmakers'] as $bk) { if ($bk['id'] === 99) continue; foreach ($bk['bets'] as $bt) foreach ($bt['values'] as $v) { $avg[$bt['name']][$v['value']] = ($avg[$bt['name']][$v['value']] ?? 0) + (float) $v['odd']; $cnt[$bt['name']][$v['value']] = ($cnt[$bt['name']][$v['value']] ?? 0) + 1; } }
foreach ($avg as $n => $vs) foreach ($vs as $v => $s) $avg[$n][$v] = $s / $cnt[$n][$v];
$mw = $avg['Match Winner']; $S = 1 / $mw['Home'] + 1 / $mw['Draw'] + 1 / $mw['Away'];
$exp = static function (float $a, float $S, float $m, float $e = 1.0): float { $p = (1 / $a) / max(1, $S / $e); return max(0, min(floor((1 - $m) / $p * 100 + 1e-6) / 100, floor(($a - 0.01) * 100 + 1e-6) / 100)); };
check('1x2 : cotes exactes (moyenne de 3 bookmakers, normalisée, marge 10 %)', $odd('9001', '1x2', 'H') === $exp($mw['Home'], $S, 0.10) && $odd('9001', '1x2', 'D') === $exp($mw['Draw'], $S, 0.10) && $odd('9001', '1x2', 'A') === $exp($mw['Away'], $S, 0.10),
  json_encode($m1['1x2']) . ' attendu ' . $exp($mw['Home'], $S, 0.10) . '/' . $exp($mw['Draw'], $S, 0.10) . '/' . $exp($mw['Away'], $S, 0.10));
$inv = 0; foreach ($m1['1x2'] as $o) $inv += 1 / $o[1];
check('1x2 : marge réelle ≥ 10 % (Σ 1/cote ≥ 1/0,90)', $inv >= 1 / 0.90 - 1e-9, (string) round($inv, 4));
$inv = 0; foreach ($m1['dc'] as $o) $inv += 1 / $o[1];
check('double chance : groupe attendu 2 (Σ 1/cote ≥ 2/0,90)', $inv >= 2 / 0.90 - 1e-9, (string) round($inv, 4));
$inv = 0; foreach ($m1['htft'] as $o) $inv += 1 / $o[1];
check('htft (exotique) : marge ≥ 18 %', $inv >= 1 / 0.82 - 1e-9, (string) round($inv, 4));
$inv = 0; foreach ($m1['ht1x2'] as $o) $inv += 1 / $o[1];
check('ht1x2 (autres) : marge ≥ 12 %', $inv >= 1 / 0.88 - 1e-9, (string) round($inv, 4));
// TOUTES les cotes : ≤ moyenne − 0,01 et ≥ 1,01
$unk = []; $bad = [];
foreach ($oj['response'][0]['bookmakers'] as $bk) { if ($bk['id'] === 99) continue; foreach ($bk['bets'] as $bt) { $vals = []; foreach ($bt['values'] as $v) $vals[] = ['value' => $v['value'], 'odd' => (string) $avg[$bt['name']][$v['value']]]; foreach (sb_parse_bet($bt['name'], $vals, $unk) as [$mk, $k, $a]) { $o = $odd('9001', $mk, $k); if ($o !== null && ($o > floor(($a - 0.01) * 100 + 1e-6) / 100 + 1e-9 || $o < 1.01)) $bad[] = "$mk/$k $o > $a"; } } break; }
$n = 0; foreach ($m1 as $mk => $os) foreach ($os as $o) { $n++; if ($o[1] < 1.01) $bad[] = "$mk/{$o[0]} < 1.01"; }
check('TOUTES les cotes (' . $n . ') : ≤ moyenne − 0,01 et ≥ 1,01', !$bad, implode(' ; ', array_slice($bad, 0, 4)));
$m2 = sb_mk_file('9002')['mk'] ?? [];
check('9002 : handicap asiatique à la convention inverse → retiré (contrôle contre 1x2)', isset($m2['1x2']) && !isset($m2['ah:-1.5']));
check('9002 : ou:2.5 avec 2 bookmakers → pas proposé (3 exigés) ; tth:1.5 avec 2 → proposé', !isset($m2['ou:2.5']) && isset($m2['tth:1.5']));
$st = sb_state();
check('diagnostic : paris / valeurs inconnus gardés (Corners, Exact Score = Other, AH -0.25, contrôle ah)', isset($st['unk']['Corners Over Under'], $st['unk']['Exact Score = Other'], $st['unk']['Asian Handicap = Home -0.25']) && (bool) array_filter(array_keys($st['unk']), static fn($k) => str_contains($k, 'ah retiré')), implode(' | ', array_keys($st['unk'] ?? [])));

echo "3) sbList / sbMatch (formes de la spec)\n";
$L = sb_list($uadm, 0, 0, $NOW);
$ids = array_column($L['fx'], 'id');
check('sbList J (UTC) : 9003, 9001, 9002 (par heure), pas 9005 (sans cotes)', $ids === ['foot:9003', 'foot:9001', 'foot:9002'], implode(',', $ids));
$f = $L['fx'][1];
check('fx : id, lg, ts, st, m, h{n,lo}, a{n,lo}, sc, o{mk:1x2,o}, n, live, susp', $f['id'] === 'foot:9001' && $f['lg'] === 39 && $f['st'] === 'NS' && $f['h']['n'] === 'Home FC' && str_contains($f['h']['lo'], '/teams/101') && $f['o']['mk'] === '1x2' && count($f['o']['o']) === 3 && $f['n'] === count($m1) && $f['live'] === 0 && $f['susp'] === 0 && array_key_exists('sc', $f));
check('lg : [{id,n,c,f,lo,p}] triés par priorité', array_column($L['lg'], 'id') === [39, 386] && isset($L['lg'][0]['n'], $L['lg'][0]['c'], $L['lg'][0]['f'], $L['lg'][0]['lo'], $L['lg'][0]['p']) && $L['sports'][0]['s'] === 'foot');
check('sbList J+1 : 9004', array_column(sb_list($uadm, 1, 0, $NOW)['fx'], 'id') === ['foot:9004']);
check('fuseau Népal (+345 min) : 9002 (20:00 UTC = 01:45 locale) passe à demain', array_column(sb_list($uadm, 0, 345, $NOW)['fx'], 'id') === ['foot:9003', 'foot:9001'] && in_array('foot:9002', array_column(sb_list($uadm, 1, 345, $NOW)['fx'], 'id'), true));
$M = sb_match($uadm, 'foot:9001', $NOW);
check('sbMatch : fx + mk[{mk,o,s}] + règles', $M['ok'] && $M['fx']['id'] === 'foot:9001' && $M['mk'][0]['mk'] === '1x2' && $M['mk'][0]['s'] === 0 && count($M['mk']) === count($m1) && str_contains($M['rules'], '48 h'));
check('sbMatch : joueur refusé (admin seul)', sb_match($ua, 'foot:9001', $NOW)['ok'] === false);

echo "4) Pari (sp_bet) : admin seul, contrôles\n";
$o1 = $odd('9001', '1x2', 'H');
$r = sp_bet(load_db(), $ua, 'real', 1, [['ev' => 'sb:foot:9001:1x2', 'k' => 'H', 'odd' => $o1]], $NOW);
check('joueur (public éteint) : refusé', $r['ok'] === false && $r['reason'] === 'closed' && $bal[$A] == 1000.0);
$r = sp_bet(load_db(), $uadm, 'real', 1, [['ev' => 'sb:foot:9001:1x2', 'k' => 'H', 'odd' => $o1], ['ev' => 'sb:foot:9001:ou:2.5', 'k' => 'O']], $NOW);
check('deux choix du même match : refusé (corr)', $r['ok'] === false && $r['reason'] === 'corr');
$r = sp_bet(load_db(), $uadm, 'real', 1, [['ev' => 'sb:foot:9001:1x2', 'k' => 'H', 'odd' => 9.99]], $NOW);
check('cote affichée différente : refus « odds » avec la cote actuelle', $r['ok'] === false && $r['reason'] === 'odds' && abs($r['odds'][0]['odd'] - $o1) < 1e-9);
$r = sp_bet(load_db(), $uadm, 'real', 1, [['ev' => 'sb:foot:9001:zz', 'k' => 'H']], $NOW);
check('marché inconnu : refusé', $r['ok'] === false);
$r = sp_bet(load_db(), $uadm, 'real', 1, [['ev' => 'sb:foot:9003:1x2', 'k' => 'H']], $NOW);
check('9003 à 20 min du début et présent dans /fixtures?live=all : refusé « closed »', $r['ok'] === false && $r['reason'] === 'closed' && in_array('fixtures?live=all&timezone=UTC', $asked, true));
$r = sp_bet(load_db(), $uadm, 'real', 1, [['ev' => 'sb:foot:9001:1x2', 'k' => 'H']], $NOW);
check('admin : pari accepté sur un match à 10 h du début (pas de lecture « live »)', $r['ok'] === true && $bal[$ADM] == 999.0);
$sel = $r['bet']['sel'][0] ?? [];
check('spBet → choix public avec mk / k / sp / fx', ($sel['mk'] ?? '') === '1x2' && ($sel['k'] ?? '') === 'H' && ($sel['fx'] ?? '') === 'foot:9001' && $sel['t'] === 'Home FC - Away FC' && $sel['l'] === 'Home FC');

sb_config_save(['public' => true, 'alertWin' => 100]);
$alt['fixtures?live=all&timezone=UTC'] = '{"errors":[],"response":[]}';
@array_map('unlink', glob(sb_dir() . '/cache/*.json'));
$r = sp_bet(load_db(), $ub, 'real', 2, [['ev' => 'sb:foot:9003:ou:2.5', 'k' => 'O']], $NOW);
check('public : joueur B parie sur 9003 (pas encore commencé selon l\'API)', $r['ok'] === true, json_encode($r));
$b6 = $r['bet']['id'] ?? '';
$r = sp_admin_save(['title' => 'Manuel A – Manuel B', 'league' => 'Liga', 'sport' => 'foot', 'start' => $NOW + 86400 * 5, 'opts' => [['label' => 'A', 'odd' => 2.0], ['label' => 'B', 'odd' => 1.8]]]);
$e1 = $r['id'];
$r1 = sp_bet(load_db(), $ua, 'real', 10, [['ev' => 'sb:foot:9001:1x2', 'k' => 'H']], $NOW);
$cO = $odd('9001', 'ou:2.5', 'O'); $c2 = $odd('9002', '1x2', 'D');
$r2 = sp_bet(load_db(), $ua, 'real', 5, [['ev' => 'sb:foot:9001:ou:2.5', 'k' => 'O'], ['ev' => 'sb:foot:9002:1x2', 'k' => 'D'], ['ev' => $e1, 'k' => 'o0']], $NOW);
$cH = $odd('9001', 'ht1x2', 'H');
$GLOBALS['SB_FAKE_PUSH'] = [];
$r3 = sp_bet(load_db(), $ub, 'real', 60, [['ev' => 'sb:foot:9001:ht1x2', 'k' => 'H']], $NOW);
$r7 = sp_bet(load_db(), $ua, 'real', 3, [['ev' => 'sb:foot:9004:1x2', 'k' => 'H']], $NOW);
check('coupons : simple, combiné SB + match manuel, mi-temps, J+1', $r1['ok'] && $r2['ok'] && $r3['ok'] && $r7['ok'] && abs($r2['bet']['odd'] - floor($cO * $c2 * 2.0 * 100 + 1e-6) / 100) < 1e-9, json_encode([$r1['ok'], $r2, $r3['ok'], $r7['ok']]));
check('alerte admin : grosse mise (≥ 50 $)', count($GLOBALS['SB_FAKE_PUSH']) === 1 && str_contains($GLOBALS['SB_FAKE_PUSH'][0][0], 'grosse mise'));
// pari « tardif » : à 17:30 (le match est prévu à 18:00 dans l'index, mais le VRAI coup d'envoi sera 17:00)
$NOW2 = $at('2026-10-22 17:25');
$r = sp_bet(load_db(), $ub, 'real', 1, [['ev' => 'sb:foot:9001:1x2', 'k' => 'H']], $NOW2);
check('cotes de plus de 8 h : plus de pari (jamais un vieux prix)', $r['ok'] === false && $r['reason'] === 'closed');
sb_admin_import($NOW2);
$NOW3 = $at('2026-10-22 17:30');
$r5 = sp_bet(load_db(), $ub, 'real', 4, [['ev' => 'sb:foot:9001:1x2', 'k' => 'H']], $NOW3);
check('après réimport : pari à 17:30 accepté (index : début 18:00)', $r5['ok'] === true, json_encode($r5));
$r = sp_bet(load_db(), $ub, 'real', 1, [['ev' => 'sb:foot:9001:1x2', 'k' => 'H']], $at('2026-10-22 18:00'));
check('au coup d\'envoi : fermé', $r['ok'] === false && $r['reason'] === 'closed');
$mine = sp_my_bets('u_a');
check('spMine : choix SB avec mk / k ; choix manuel sans (comme avant)', ($mine[0]['sel'][0]['mk'] ?? '') === '1x2' && !isset($mine[1]['sel'][2]['mk']) && ($mine[1]['sel'][0]['mk'] ?? '') === 'ou:2.5');

echo "5) Résultats + règlement automatique\n";
$balA0 = $bal[$A]; $balB0 = $bal[$B];
sb_config_save(['autosettle' => false]);
$alt['fixtures?date=2026-10-22&timezone=UTC'] = 'fixtures-2026-10-22-final.json';
$NOW4 = $at('2026-10-22 23:00');
$t = sb_job_tick($NOW4);
$res = sb_results();
check('résultats automatiques ÉTEINTS : 9001 « proposé », rien payé', ($res['9001']['v'] ?? '') === 'prop' && $bal[$A] == $balA0 && $bal[$B] == $balB0, json_encode($res['9001'] ?? null));
check('« à vérifier » : 9001 (proposé) et 9003 (équipes différentes)', count(array_filter(sb_check_list($NOW4), static fn($x) => in_array($x['id'], ['foot:9001', 'foot:9003'], true))) === 2, json_encode(array_column(sb_check_list($NOW4), 'id')));
check('alerte admin : résultat à vérifier', (bool) array_filter($GLOBALS['SB_FAKE_PUSH'], static fn($p) => str_contains($p[0], 'vérifier')));
sb_config_save(['autosettle' => true]);
$at('2026-10-22 23:15');
$t = sb_job_tick($T('2026-10-22 23:15'));
$res = sb_results();
check('9001 FT (vrai coup d\'envoi 17:00) / 9002 AET : « fin » ; 9003 « chk »', ($res['9001']['v'] ?? '') === 'fin' && ($res['9002']['v'] ?? '') === 'fin' && $res['9002']['ft'] === [1, 1] && ($res['9003']['v'] ?? '') === 'chk', json_encode($t['results']));
$bets = []; foreach ((array) sp_with('bets.json', static fn(array &$s) => $s['b'] ?? []) as $b) $bets[$b['id']] = $b;
$w1 = floor(10 * $o1 * 100 + 1e-6) / 100;
check('simple 1x2 H (2-1) : gagné, payé 10 × cote', $bets[$r1['bet']['id']]['status'] === 'won' && abs($bets[$r1['bet']['id']]['win'] - $w1) < 0.001);
check('mi-temps 1-0 : ht1x2 H gagné (60 $)', $bets[$r3['bet']['id']]['status'] === 'won' && abs($bets[$r3['bet']['id']]['win'] - floor(60 * $cH * 100 + 1e-6) / 100) < 0.001);
check('pari posé à 17:30, vrai coup d\'envoi 17:00 → ANNULÉ (mise rendue)', $bets[$r5['bet']['id']]['status'] === 'void' && ($bets[$r5['bet']['id']]['sel'][0]['r'] ?? '') === 'void' && abs($bets[$r5['bet']['id']]['win'] - 4) < 0.001);
check('combiné : 2 choix SB gagnés (3 buts ; AET 1-1 à 90 min → nul), match manuel pas fini → ouvert', $bets[$r2['bet']['id']]['status'] === 'open' && $bets[$r2['bet']['id']]['sel'][0]['r'] === 'won' && $bets[$r2['bet']['id']]['sel'][1]['r'] === 'won');
check('9003 (équipes différentes) : jamais deviné → ouvert', $bets[$b6]['status'] === 'open');
check('alerte admin : gros gain versé (≥ 100 $)', (bool) array_filter($GLOBALS['SB_FAKE_PUSH'], static fn($p) => str_contains($p[0], 'gros gain versé')));
$expA = round($balA0 + $w1, 2);
check('solde A = avant + gain (payé une fois)', abs($bal[$A] - $expA) < 0.001, $bal[$A] . ' / ' . $expA);
$cr = $credits; sp_resolve(load_db()); sb_job_tick($T('2026-10-22 23:30'));
check('sp_resolve relancé : aucun paiement en plus', $credits === $cr && abs($bal[$A] - $expA) < 0.001);
$r = sp_admin_settle(load_db(), $e1, 'o0');
$b2 = null; foreach ((array) sp_with('bets.json', static fn(array &$s) => $s['b'] ?? []) as $b) if ($b['id'] === $r2['bet']['id']) $b2 = $b;
check('match manuel réglé (ancien chemin) → combiné gagné, payé', $r['ok'] && $b2['status'] === 'won' && abs($b2['win'] - floor(5 * $b2['odd'] * 100 + 1e-6) / 100) < 0.001 && abs($bal[$A] - round($expA + $b2['win'], 2)) < 0.001);
$chk = sb_check_list($T('2026-10-22 23:30'));
check('« à vérifier » : 9003 seulement', array_column($chk, 'id') === ['foot:9003'], json_encode($chk));
check('saisie admin : mi-temps > fin refusée', sb_admin_result(load_db(), 'foot:9003', [2, 0], [1, 0], false)['ok'] === false);
$r = sb_admin_result(load_db(), 'foot:9003', [1, 0], [3, 0], false);
$b = null; foreach ((array) sp_with('bets.json', static fn(array &$s) => $s['b'] ?? []) as $x) if ($x['id'] === $b6) $b = $x;
check('saisie admin 1-0 / 3-0 : plus de 2,5 buts gagné ; plus rien à vérifier', $r['ok'] && $b['status'] === 'won' && sb_check_list($T('2026-10-22 23:30')) === []);

echo "6) Reporté (> 48 h) → annulé\n";
$alt['fixtures?ids=9004&timezone=UTC'] = 'fixtures-ids-9004-pst.json';
$balA1 = $bal[$A];
sb_job_tick($at('2026-10-24 00:00'));
check('9004 reporté (PST), < 48 h : en attente', (sb_results()['9004']['v'] ?? '') === 'wait' && $bal[$A] == $balA1);
sb_job_tick($at('2026-10-25 20:00'));
$b = null; foreach ((array) sp_with('bets.json', static fn(array &$s) => $s['b'] ?? []) as $x) if ($x['id'] === $r7['bet']['id']) $b = $x;
check('pas joué 48 h après le début prévu : annulé, 3 $ rendus', $b['status'] === 'void' && abs($bal[$A] - ($balA1 + 3)) < 0.001);

echo "7) Règlement de chaque marché (score des 90 min, mi-temps, 2e mi-temps)\n";
$FT = [2, 1]; $HT = [0, 1]; // 0-1 à la mi-temps, 2-1 à la fin (2e mi-temps 2-0)
$cases = [
  ['1x2', 'H', 'won'], ['1x2', 'D', 'lost'], ['dc', 'HD', 'won'], ['dc', 'DA', 'lost'], ['dc', 'HA', 'won'], ['dnb', 'H', 'won'], ['dnb', 'A', 'lost'],
  ['ou:2.5', 'O', 'won'], ['ou:3.5', 'O', 'lost'], ['ou:3.5', 'U', 'won'], ['btts', 'Y', 'won'], ['tth:1.5', 'O', 'won'], ['tta:1.5', 'U', 'won'],
  ['oe', 'O', 'won'], ['oe', 'E', 'lost'], ['csh', 'N', 'won'], ['csa', 'Y', 'lost'], ['wnh', 'N', 'won'], ['wna', 'Y', 'lost'],
  ['eh:-1', 'D', 'won'], ['eh:-1', 'H', 'lost'], ['eh:1', 'H', 'won'], ['ah:-1.5', 'A', 'won'], ['ah:-0.5', 'H', 'won'], ['ah:1.5', 'A', 'lost'],
  ['ht1x2', 'A', 'won'], ['htou:0.5', 'O', 'won'], ['htbtts', 'N', 'won'], ['2h1x2', 'H', 'won'], ['2h1x2', 'D', 'lost'],
  ['htft', 'A/H', 'won'], ['htft', 'H/H', 'lost'], ['cs', '2:1', 'won'], ['cs', '1:2', 'lost'], ['rbtts', 'H/Y', 'won'], ['rbtts', 'H/N', 'lost'],
  ['rou:2.5', 'H/O', 'won'], ['rou:2.5', 'H/U', 'lost'], ['eg', '3', 'won'], ['eg', '6+', 'lost'], ['hsh', '2', 'won'], ['hsh', 'X', 'lost'],
];
$bad = [];
foreach ($cases as [$mk, $k, $w]) { $g = sb_settle_mk($mk, $k, $FT, $HT); if ($g !== $w) $bad[] = "$mk/$k=$g≠$w"; }
check(count($cases) . ' cas (2-1, mi-temps 0-1)', !$bad, implode(' ', $bad));
check('dnb sur nul : annulé ; eg 6+ sur 4-3 ; hsh X sur 1-1 / 2-2', sb_settle_mk('dnb', 'H', [1, 1], null) === 'void' && sb_settle_mk('eg', '6+', [4, 3], null) === 'won' && sb_settle_mk('hsh', 'X', [2, 2], [1, 1]) === 'won');
check('marché de mi-temps sans score de mi-temps : pas réglé (null)', sb_settle_mk('ht1x2', 'H', [1, 0], null) === null && sb_settle_mk('1x2', 'H', [1, 0], null) === 'won');
check('choix invalide : pas réglé (null)', sb_settle_mk('1x2', 'Z', [1, 0], null) === null && sb_settle_mk('ah:-1', 'H', [3, 0], null) === null);

echo "8) Règles d'annulation (unités)\n";
$sel = ['ev' => 'sb:foot:777:1x2', 'k' => 'H', 'ko' => $T('2026-10-22 18:00'), 'ti' => [1, 2]];
$fin = ['777' => ['v' => 'fin', 'ts' => $T('2026-10-22 18:00'), 'ti' => [1, 2], 'ft' => [1, 0], 'ht' => [0, 0], 'at' => $T('2026-10-22 21:00')]];
check('pari avant le début : gagné', sb_sel_result($sel, $T('2026-10-22 17:59'), $fin, $T('2026-10-22 21:00'), true) === 'won');
check('pari à la seconde du vrai début : annulé', sb_sel_result($sel, $T('2026-10-22 18:00'), $fin, $T('2026-10-22 21:00'), true) === 'void');
$late = $fin; $late['777']['ts'] = $T('2026-10-24 19:00');
check('joué plus de 48 h après le début prévu : annulé', sb_sel_result($sel, $T('2026-10-22 10:00'), $late, $T('2026-10-25 00:00'), true) === 'void');
$cl = sb_classify(['st' => 'AWD', 'ts' => 1, 'h' => [1], 'a' => [2]], [1, 2], 1, 10);
check('AWD / WO : annulé', $cl['v'] === 'void' && sb_classify(['st' => 'WO', 'ts' => 1, 'h' => [1], 'a' => [2]], [1, 2], 1, 10)['v'] === 'void' && sb_sel_result($sel, 0, ['777' => $cl], 10, true) === 'void');
check('AET : score des 90 min (score.fulltime)', sb_classify(['st' => 'AET', 'ts' => 1, 'h' => [1], 'a' => [2], 'ft' => [1, 1], 'g' => [2, 1]], [1, 2], 1, 10)['ft'] === [1, 1]);
check('AET sans score des 90 min : à vérifier', sb_classify(['st' => 'AET', 'ts' => 1, 'h' => [1], 'a' => [2], 'g' => [2, 1]], [1, 2], 1, 10)['v'] === 'chk');
check('PEN : score des 90 min', sb_classify(['st' => 'PEN', 'ts' => 1, 'h' => [1], 'a' => [2], 'ft' => [0, 0]], [1, 2], 1, 10)['v'] === 'fin');
check('équipes différentes : à vérifier', sb_classify(['st' => 'FT', 'ts' => 1, 'h' => [1], 'a' => [3], 'ft' => [0, 0]], [1, 2], 1, 10)['v'] === 'chk');
$wait = ['777' => ['v' => 'wait', 'ts' => $T('2026-10-22 18:00'), 'at' => $T('2026-10-24 19:00')]];
check('reporté : 47 h → attente ; 49 h → annulé ; résultats auto éteints → jamais annulé seul', sb_sel_result($sel, 0, $wait, $T('2026-10-24 17:00'), true) === null && sb_sel_result($sel, 0, $wait, $T('2026-10-24 19:00'), true) === 'void' && sb_sel_result($sel, 0, $wait, $T('2026-10-24 19:00'), false) === null);
check('id du match différent : pas réglé', sb_sel_result(['ev' => 'sb:foot:778:1x2', 'k' => 'H'] + $sel, 0, $fin, 10, true) === null);
check('équipes du pari différentes du résultat : pas réglé', sb_sel_result(['ti' => [1, 9]] + $sel, 0, $fin, 10, true) === null);

echo "9) Budget, erreurs, diagnostic (jamais la clé)\n";
$D = sb_admin_diag($T('2026-10-26 10:00'));
check('diagnostic : plan Pro, lectures 12 / 7500, paris inconnus', $D['ok'] && $D['status']['plan'] === 'Pro' && $D['status']['max'] === 7500 && isset($D['unk']['Corners Over Under']));
$alt['status'] = '{"errors":{"token":"bad key test-secret-key-123"},"response":[]}';
sb_admin_diag($T('2026-10-26 10:01'));
check('erreur API gardée pour l\'admin, clé masquée', str_contains(sb_state()['err'], 'API-Football') && !str_contains(sb_state()['err'], 'test-secret-key-123'), sb_state()['err']);
sb_with('budget-foot.json', static function (array &$s) use ($T) { $s['day'] = gmdate('Y-m-d', $T('2026-10-26 10:00')); $s['n'] = SB_FOOT_CAP; return true; });
$n0 = count($asked);
check('budget de 7 000 atteint : plus aucune lecture', sb_get('status', $T('2026-10-26 11:00')) === null && count($asked) === $n0 && str_contains(sb_state()['err'], 'Budget'));
check('statut admin : budget, config, à vérifier', ($s = sb_admin_status($T('2026-10-26 11:00')))['ok'] && $s['budget']['used'] === SB_FOOT_CAP && $s['budget']['cap'] === 7000 && $s['config']['public'] === true);
check('réglages bornés (marge 99 → 40, négatif → 2)', ($cc = sb_config_save(['mMain' => 99, 'mSide' => -5])['config'])['mMain'] == 40 && $cc['mSide'] == 2);
$leak = false; foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($tmp . '/data', FilesystemIterator::SKIP_DOTS)) as $fi) if (str_contains((string) file_get_contents((string) $fi), 'test-secret-key-123')) $leak = true;
check('la clé n\'est écrite dans AUCUN fichier', !$leak);

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exec('rm -rf ' . escapeshellarg($tmp));
exit($fail ? 1 : 0);
