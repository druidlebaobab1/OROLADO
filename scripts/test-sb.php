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
$c0 = sb_config(); // 1re lecture : Public allumé une seule fois (mise en ligne du 2026-10-22), marges au moins 15/20/30/20/15
check('mise en ligne : Public allumé une fois, marges relevées', $c0['public'] === true && $c0['mMain'] == 15 && $c0['mExotic'] == 30);
sb_with('config.json', static function (array &$s) { $s = ['mig1' => 1]; return true; }); // la suite teste le réglage « Public éteint »
$c = sb_config();
check('défauts : public NON, résultats automatiques OUI, marges 15/20/30/20/15, alertes 50/500/200', $c['public'] === false && $c['autosettle'] === true && $c['mMain'] == 15 && $c['mSide'] == 20 && $c['mExotic'] == 30 && $c['mLive'] == 20 && $c['mOther'] == 15 && $c['alertStake'] == 50 && $c['alertPot'] == 500 && $c['alertWin'] == 200);
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
check('1x2 : cotes exactes (moyenne de 3 bookmakers, normalisée, marge 15 %)', $odd('9001', '1x2', 'H') === $exp($mw['Home'], $S, 0.15) && $odd('9001', '1x2', 'D') === $exp($mw['Draw'], $S, 0.15) && $odd('9001', '1x2', 'A') === $exp($mw['Away'], $S, 0.15),
  json_encode($m1['1x2']) . ' attendu ' . $exp($mw['Home'], $S, 0.15) . '/' . $exp($mw['Draw'], $S, 0.15) . '/' . $exp($mw['Away'], $S, 0.15));
$inv = 0; foreach ($m1['1x2'] as $o) $inv += 1 / $o[1];
check('1x2 : marge réelle ≥ 15 % (Σ 1/cote ≥ 1/0,85)', $inv >= 1 / 0.85 - 1e-9, (string) round($inv, 4));
$inv = 0; foreach ($m1['dc'] as $o) $inv += 1 / $o[1];
check('double chance : groupe attendu 2 (Σ 1/cote ≥ 2/0,85)', $inv >= 2 / 0.85 - 1e-9, (string) round($inv, 4));
$inv = 0; foreach ($m1['htft'] as $o) $inv += 1 / $o[1];
check('htft (exotique) : marge ≥ 30 %', $inv >= 1 / 0.70 - 1e-9, (string) round($inv, 4));
$inv = 0; foreach ($m1['ht1x2'] as $o) $inv += 1 / $o[1];
check('ht1x2 (autres) : marge ≥ 20 %', $inv >= 1 / 0.80 - 1e-9, (string) round($inv, 4));
// TOUTES les cotes : ≤ moyenne − 0,01 et ≥ 1,01
$unk = []; $bad = [];
foreach ($oj['response'][0]['bookmakers'] as $bk) { if ($bk['id'] === 99) continue; foreach ($bk['bets'] as $bt) { $vals = []; foreach ($bt['values'] as $v) $vals[] = ['value' => $v['value'], 'odd' => (string) $avg[$bt['name']][$v['value']]]; foreach (sb_parse_bet($bt['name'], $vals, $unk) as [$mk, $k, $a]) { $o = $odd('9001', $mk, $k); if ($o !== null && ($o > floor(($a - 0.01) * 100 + 1e-6) / 100 + 1e-9 || $o < 1.01)) $bad[] = "$mk/$k $o > $a"; } } break; }
$n = 0; foreach ($m1 as $mk => $os) foreach ($os as $o) { $n++; if ($o[1] < 1.01) $bad[] = "$mk/{$o[0]} < 1.01"; }
check('TOUTES les cotes (' . $n . ') : ≤ moyenne − 0,01 et ≥ 1,01', !$bad, implode(' ; ', array_slice($bad, 0, 4)));
$m2 = sb_mk_file('9002')['mk'] ?? [];
check('9002 : handicap asiatique à la convention inverse → retiré (contrôle contre 1x2)', isset($m2['1x2']) && !isset($m2['ah:-1.5']));
check('9002 : ou:2.5 avec 2 bookmakers → pas proposé (3 exigés) ; tth:1.5 avec 2 → proposé', !isset($m2['ou:2.5']) && isset($m2['tth:1.5']));
$st = sb_state();
check('diagnostic : paris / valeurs inconnus gardés (Corners, Exact Score = Other, contrôle ah) ; quarts de ligne (AH -0.25) écartés SANS diagnostic', isset($st['unk']['Corners Over Under'], $st['unk']['Exact Score = Other']) && !isset($st['unk']['Asian Handicap = Home -0.25']) && isset($m1['ah:-1.5']) && (bool) array_filter(array_keys($st['unk']), static fn($k) => str_contains($k, 'ah retiré')), implode(' | ', array_keys($st['unk'] ?? [])));

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

echo "4b) Code de coupon (sbCodeSave / sbCodeLoad)\n";
$nAsk = count($asked);
$r = sb_code_save(null, [['ev' => 'sb:foot:9001:1x2', 'k' => 'H']], $NOW);
check('visiteur (SB pas public) : code refusé pour un match SB invisible', $r['ok'] === false);
$r = sb_code_save($uadm, [['ev' => 'sb:foot:9001:ou:2.5', 'k' => 'O'], ['ev' => 'sb:foot:9002:1x2', 'k' => 'D'], ['ev' => 'sb:foot:9001:1x2', 'k' => 'H'], ['ev' => 'sb:foot:99999:1x2', 'k' => 'H'], ['ev' => 'sb:foot:9002:zz', 'k' => 'H']], $NOW);
$code = (string) ($r['code'] ?? '');
check('admin : code de 6 caractères (A-Z 2-9, sans 0 O 1 I), 2 choix gardés, 3 sautés (même match, inconnu, marché inconnu)', $r['ok'] === true && preg_match('/^[A-HJ-NP-Z2-9]{6}$/', $code) === 1 && $r['n'] === 2 && $r['skip'] === 3, json_encode($r));
$cf = sb_dir() . '/codes/' . $code . '.json';
$cj = json_decode((string) @file_get_contents($cf), true);
check('stocké : codes/XXXXXX.json, choix seulement (ni mise, ni cote)', is_array($cj) && $cj['s'] === [['sb:foot:9001:ou:2.5', 'O'], ['sb:foot:9002:1x2', 'D']] && !str_contains((string) file_get_contents($cf), 'stake'));
$L1 = sb_code_load($uadm, strtolower($code), $NOW + 600);
check('chargement (minuscules acceptées) : 2 choix, cotes ACTUELLES du serveur, équipes + logos', $L1['ok'] && count($L1['sel']) === 2 && $L1['sel'][0]['odd'] === $odd('9001', 'ou:2.5', 'O') && $L1['sel'][1]['odd'] === $odd('9002', '1x2', 'D') && $L1['sel'][0]['h']['n'] === 'Home FC' && $L1['sel'][0]['mk'] === 'ou:2.5' && $L1['sel'][0]['fx'] === 'foot:9001' && $L1['sel'][0]['ko'] > $NOW, json_encode($L1['sel'][0] ?? null));
$L2 = sb_code_load($ua, $code, $NOW + 600);
check('joueur (SB pas public) : choix SB sautés et comptés « hidden »', $L2['ok'] && $L2['sel'] === [] && $L2['hidden'] === 2);
check('code inconnu / mal formé : nocode', sb_code_load(null, 'ZZZZZZ', $NOW)['reason'] === 'nocode' && sb_code_load(null, 'AB0O1I', $NOW)['reason'] === 'nocode' && sb_code_load(null, '../x', $NOW)['reason'] === 'nocode');
check('code de plus de 7 jours : nocode', sb_code_load($uadm, $code, $NOW + 7 * 86400 + 60)['reason'] === 'nocode');
$ko1 = (int) sb_day('2026-10-22')['fx']['9001']['ts'];
$L3 = sb_code_load($uadm, $code, $ko1);
check('match commencé : sauté (compté)', $L3['ok'] && !in_array('sb:foot:9001:ou:2.5', array_column($L3['sel'], 'ev'), true) && $L3['skip'] >= 1);
$L4 = sb_code_load($uadm, '', $NOW, [['ev' => 'sb:foot:9002:1x2', 'k' => 'D']]);
check('sans code, {sel} : relit les cotes du ticket', $L4['ok'] && count($L4['sel']) === 1 && $L4['sel'][0]['odd'] === $odd('9002', '1x2', 'D'));
$rm = sp_admin_save(['title' => 'Code A – Code B', 'league' => 'Liga', 'sport' => 'foot', 'start' => time() + 86400 * 3, 'opts' => [['label' => 'A', 'odd' => 2.1], ['label' => 'B', 'odd' => 1.7]]]);
$em = sp_events(); $emk = ''; foreach ($em as $e) if ($e['id'] === ($rm['id'] ?? '')) $emk = $e['opts'][1]['k'];
$r = sb_code_save(null, [['ev' => $rm['id'] ?? '', 'k' => $emk], ['ev' => 'evt_inconnu', 'k' => 'a']], time());
$L5 = $r['ok'] ? sb_code_load(null, $r['code'], time()) : ['ok' => false];
check('ancien match manuel (spList) : code visiteur accepté, rechargé avec sa cote', $r['ok'] === true && $r['n'] === 1 && $L5['ok'] && count($L5['sel']) === 1 && abs($L5['sel'][0]['odd'] - 1.7) < 1e-9 && $L5['sel'][0]['t'] === 'Code A – Code B', json_encode($r));
check('plus de 50 choix : refusé', sb_code_save($uadm, array_fill(0, 51, ['ev' => 'sb:foot:9001:1x2', 'k' => 'H']), $NOW)['ok'] === false);
$cs = []; for ($i = 0; $i < 25; $i++) { $x = sb_code_save($uadm, [['ev' => 'sb:foot:9002:1x2', 'k' => 'H']], $NOW); $cs[] = $x['code'] ?? ''; }
check('25 codes : tous différents', count(array_unique(array_filter($cs))) === 25);
check('aucune lecture de l\'API pour les codes', count($asked) === $nAsk);
$api = (string) file_get_contents(__DIR__ . '/../api.php');
check('api.php : sbCodeSave / sbCodeLoad limités ($OROLADO_RATE_RULES)', (bool) preg_match("/'sbCodeSave'\s*=>\s*\[\[/", $api) && (bool) preg_match("/'sbCodeLoad'\s*=>\s*\[\[/", $api));

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

echo "7b) Marchés du vrai flux (mi-temps / 2e mi-temps) + quarts de ligne écartés sans diagnostic\n";
$unk = []; $P = [];
$feed = [
  ['Goals Over/Under - Second Half', ['Over 1.5', 'Under 1.5', 'Over 1.25', 'Over 2.0']], ['Double Chance - First Half', ['Home/Draw', 'Home/Away', 'Draw/Away']],
  ['Double Chance - Second Half', ['Home/Draw', 'Draw/Away']], ['Both Teams To Score - Second Half', ['Yes', 'No']], ['Correct Score - First Half', ['1:0', '0:0']],
  ['Odd/Even - First Half', ['Odd', 'Even']], ['Odd/Even - Second Half', ['Odd']], ['Home Team Total Goals(1st Half)', ['Over 0.5', 'Under 0.5']],
  ['Away Team Total Goals(1st Half)', ['Under 0.5']], ['Asian Handicap First Half', ['Home -0.5', 'Away -0.5', 'Home -0.25', 'Away +1']],
  ['Goals Over/Under', ['Over 2.25', 'Under 3.0', 'Over 2.5', 'Over abc']], ['Asian Handicap', ['Home -0.75', 'Home 0', 'Away -1']],
];
foreach ($feed as [$nm, $vs]) foreach (sb_parse_bet($nm, array_map(static fn($v) => ['value' => $v, 'odd' => '1.90'], $vs), $unk) as $o) $P[] = $o[0] . '/' . $o[1];
$wantP = ['2hou:1.5/O', '2hou:1.5/U', 'htdc/HD', 'htdc/HA', 'htdc/DA', '2hdc/HD', '2hdc/DA', '2hbtts/Y', '2hbtts/N', 'htcs/1:0', 'htcs/0:0', 'htoe/O', 'htoe/E', '2hoe/O',
  'httth:0.5/O', 'httth:0.5/U', 'httta:0.5/U', 'htah:-0.5/H', 'htah:-0.5/A', 'ou:2.5/O'];
check('10 nouveaux marchés lus (2hou, htdc, 2hdc, 2hbtts, htcs, htoe, 2hoe, httth, httta, htah demi-lignes)', $P === $wantP, implode(' ', array_diff($P, $wantP)) . ' | manque ' . implode(' ', array_diff($wantP, $P)));
check('quarts / lignes entières (2.25, 3.0, -0.75, 0, -1, htah -0.25) : écartés SANS diagnostic ; valeur vraiment inconnue gardée', array_keys($unk) === ['Goals Over/Under = Over abc'], implode(' | ', array_keys($unk)));
$HT2 = [1, 0]; $FT2 = [2, 2]; $bad = []; // 1re mi-temps 1-0, 2e mi-temps 1-2
$cases = [['2hou:1.5', 'O', 'won'], ['2hou:1.5', 'U', 'lost'], ['htdc', 'HD', 'won'], ['htdc', 'DA', 'lost'], ['2hdc', 'DA', 'won'], ['2hdc', 'HD', 'lost'], ['2hbtts', 'Y', 'won'],
  ['htcs', '1:0', 'won'], ['htcs', '0:0', 'lost'], ['htoe', 'O', 'won'], ['2hoe', 'O', 'won'], ['2hoe', 'E', 'lost'], ['httth:0.5', 'O', 'won'], ['httta:0.5', 'U', 'won'],
  ['htah:-0.5', 'H', 'won'], ['htah:0.5', 'A', 'lost']];
foreach ($cases as [$mk, $k, $w]) { $g = sb_settle_mk($mk, $k, $FT2, $HT2); if ($g !== $w) $bad[] = "$mk/$k=" . var_export($g, true) . "≠$w"; }
check(count($cases) . ' cas (mi-temps 1-0, fin 2-2)', !$bad, implode(' ', $bad));
check('nouveaux marchés sans score de mi-temps : pas réglés (null)', sb_settle_mk('2hou:1.5', 'O', $FT2, null) === null && sb_settle_mk('htcs', '1:0', $FT2, null) === null && sb_settle_mk('htah:0.25', 'H', $FT2, $HT2) === null);
$cf = sb_config();
check('marges : htcs exotique (30 %), les autres de côté (20 %)', abs(sb_margin('htcs', $cf) - 0.30) < 1e-9 && abs(sb_margin('2hou', $cf) - 0.20) < 1e-9 && abs(sb_margin('htdc', $cf) - 0.20) < 1e-9);
$bk = static fn(array $o) => ['bets' => [['name' => 'Double Chance - First Half', 'values' => [['value' => 'Home/Draw', 'odd' => $o[0]], ['value' => 'Home/Away', 'odd' => $o[1]], ['value' => 'Draw/Away', 'odd' => $o[2]]]]]];
$u2 = []; $mm = sb_markets([$bk(['1.25', '1.40', '1.60']), $bk(['1.27', '1.38', '1.62'])], $cf, $u2);
$inv = 0; foreach ($mm['htdc'] ?? [] as $o) $inv += 1 / $o[1];
check('htdc : groupe attendu 2 (Σ 1/cote ≥ 2/0,80)', count($mm['htdc'] ?? []) === 3 && $inv >= 2 / 0.80 - 1e-9, json_encode($mm));
check('libellés français des nouveaux marchés', sb_mk_name('2hou:1.5') === 'Buts 2e mi-temps (1,5)' && sb_k_name('htdc', 'HD', 'A', 'B') === 'A ou nul' && sb_k_name('htcs', '1:0', 'A', 'B') === '1 - 0');
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


echo "10) DIRECT (étape 3) : demande, budget, lecture /odds/live, suspension, 5 s, refus sur but, règlement\n";
$LT = $T('2026-10-27 11:00'); // coup d'envoi du match en direct 9101
$lfx = static function (array $o = []) use ($LT): string {
  $o += ['st' => '2H', 'm' => 63, 'g' => [1, 0], 'ev' => null];
  $ev = $o['ev'] ?? [
    ['time' => ['elapsed' => 23, 'extra' => null], 'team' => ['id' => 501], 'player' => ['name' => 'K. Mbappé'], 'type' => 'Goal', 'detail' => 'Normal Goal'],
    ['time' => ['elapsed' => 41, 'extra' => null], 'team' => ['id' => 502], 'player' => ['name' => 'J. Doe'], 'type' => 'Card', 'detail' => 'Yellow Card'],
    ['time' => ['elapsed' => 55, 'extra' => null], 'team' => ['id' => 502], 'player' => ['name' => 'A. Red'], 'type' => 'Card', 'detail' => 'Red Card'],
    ['time' => ['elapsed' => 58, 'extra' => null], 'team' => ['id' => 501], 'player' => ['name' => 'B. Sub'], 'type' => 'subst', 'detail' => 'Substitution 1'],
    ['time' => ['elapsed' => 60, 'extra' => null], 'team' => ['id' => 501], 'player' => ['name' => 'X'], 'type' => 'Goal', 'detail' => 'Missed Penalty']];
  return json_encode(['errors' => [], 'response' => [[
    'fixture' => ['id' => 9101, 'timestamp' => $LT, 'status' => ['short' => $o['st'], 'elapsed' => $o['m']]],
    'league' => ['id' => 39, 'name' => 'Premier League', 'country' => 'England', 'logo' => 'https://media.api-sports.io/football/leagues/39.png', 'flag' => 'https://media.api-sports.io/flags/gb.svg'],
    'teams' => ['home' => ['id' => 501, 'name' => 'Live Rovers', 'logo' => ''], 'away' => ['id' => 502, 'name' => 'Direct FC', 'logo' => '']],
    'goals' => ['home' => $o['g'][0], 'away' => $o['g'][1]], 'score' => ['halftime' => ['home' => 1, 'away' => 0], 'fulltime' => ['home' => null, 'away' => null]], 'events' => $ev]]]);
};
$lodds = static function (array $o = []): string {
  $o += ['m' => 63, 'g' => [1, 0], 'h' => '1.40', 'blk' => false, 'susp' => false, 'ti' => [501, 502]];
  $V = static fn(string $v, string $odd, $hc = null) => ['value' => $v, 'odd' => $odd, 'handicap' => $hc, 'main' => null, 'suspended' => $o['susp']];
  return json_encode(['errors' => [], 'response' => [[
    'fixture' => ['id' => 9101, 'status' => ['long' => 'Second Half', 'elapsed' => $o['m'], 'seconds' => $o['m'] . ':10']],
    'league' => ['id' => 39], 'teams' => ['home' => ['id' => $o['ti'][0], 'goals' => $o['g'][0]], 'away' => ['id' => $o['ti'][1], 'goals' => $o['g'][1]]],
    'status' => ['stopped' => false, 'blocked' => $o['blk'], 'finished' => false], 'update' => '2026-10-27T12:03:00+00:00',
    'odds' => [
      ['id' => 59, 'name' => 'Fulltime Result', 'values' => [$V('Home', $o['h']), $V('Draw', '4.20'), $V('Away', '9.00')]],
      ['id' => 36, 'name' => 'Over/Under Line', 'values' => [$V('Over', '1.01', '0.5'), $V('Under', '15.0', '0.5'), $V('Over', '1.60', '1.5'), $V('Under', '2.25', '1.5'), $V('Over', '3.10', '2.5'), $V('Under', '1.36', '2.5'), $V('Over', '2.20', '2'), $V('Under', '1.65', '2')]],
      ['id' => 25, 'name' => 'Match Goals', 'values' => [$V('Over 3.5', '7.50'), $V('Under 3.5', '1.08')]],
      ['id' => 69, 'name' => 'Both Teams To Score', 'values' => [$V('Yes', '3.40'), $V('No', '1.30')]],
      ['id' => 49, 'name' => 'Double Chance', 'values' => [$V('Home/Draw', '1.06'), $V('Home/Away', '1.25'), $V('Draw/Away', '3.00')]],
      ['id' => 50, 'name' => 'Draw No Bet', 'values' => [$V('Home', '1.08'), $V('Away', '7.50')]],
      ['id' => 51, 'name' => 'Home Team Total Goals', 'values' => [$V('Over', '2.60', '1.5'), $V('Under', '1.45', '1.5')]],
      ['id' => 19, 'name' => 'Next Goal', 'values' => [$V('1', '2.0'), $V('No goal', '3.0'), $V('2', '3.5')]],
      ['id' => 33, 'name' => 'Asian Handicap', 'values' => [$V('Home', '1.9', '-0.5'), $V('Away', '1.9', '0.5')]],
    ]]]]);
};
$alt['fixtures?live=all&timezone=UTC'] = $lfx();
$alt['odds/live'] = $lodds();
$alt['fixtures/statistics?fixture=9101'] = json_encode(['errors' => [], 'response' => [
  ['team' => ['id' => 501], 'statistics' => [['type' => 'Shots on Goal', 'value' => 5], ['type' => 'Total Shots', 'value' => 11], ['type' => 'Ball Possession', 'value' => '58%'], ['type' => 'Corner Kicks', 'value' => 6], ['type' => 'Yellow Cards', 'value' => 0], ['type' => 'Red Cards', 'value' => null]]],
  ['team' => ['id' => 502], 'statistics' => [['type' => 'Shots on Goal', 'value' => 1], ['type' => 'Total Shots', 'value' => 4], ['type' => 'Ball Possession', 'value' => '42%'], ['type' => 'Corner Kicks', 'value' => 2], ['type' => 'Yellow Cards', 'value' => 1], ['type' => 'Red Cards', 'value' => 1]]]]]);
$L0 = $at('2026-10-27 12:03');
sb_config_save(['public' => true, 'live' => true, 'livePublic' => false]);
$cnt = function (string $p) use (&$asked) { return count(array_filter($asked, static fn($x) => $x === $p)); };
$n0 = count($asked);
check('sans demande (personne ne regarde le direct) : aucune lecture', sb_live_tick($L0) === [] && count($asked) === $n0);
check('direct public éteint : joueur refusé, admin ouvert', sb_live_list($ua, $L0)['ok'] === false && sb_live_list($uadm, $L0)['ok'] === true);
check('sbList : onglet Direct visible pour l\'admin (live ≥ 0), pas pour le joueur (-1)', sb_list($uadm, 0, 0, $L0)['sports'][0]['live'] >= 0 && sb_list($ua, 0, 0, $L0)['sports'][0]['live'] === -1);
$c0 = [$cnt('odds/live'), $cnt('fixtures?live=all&timezone=UTC')];
$t = sb_live_tick($L0);
check('demande : /fixtures?live=all puis /odds/live (1 fois chacun)', $t === ['fixtures', 'odds'] && $cnt('odds/live') === $c0[0] + 1 && $cnt('fixtures?live=all&timezone=UTC') === $c0[1] + 1, json_encode($t));
check('relancé 10 s après : rien (odds ≤ 15 s, fixtures ≤ 30 s)', sb_live_tick($L0 + 10) === []);
check('16 s après : /odds/live seulement', sb_live_tick($L0 + 16) === ['odds']);
check('31 s après : /fixtures?live=all (et /odds/live, 15 s passées)', sb_live_tick($L0 + 31) === ['fixtures', 'odds']);
check('plus de demande après 60 s : plus rien', sb_live_tick($L0 + 75) === [] );
sb_with('budget-foot.json', static function (array &$s) use ($L0) { $s['day'] = gmdate('Y-m-d', $L0); $s['n'] = SB_FOOT_CAP - SB_LIVE_RESERVE; return true; });
sb_live_list($uadm, $L0 + 80);
check('réserve de 1 000 lectures atteinte : plus de direct', sb_live_tick($L0 + 80) === []);
sb_with('budget-foot.json', static function (array &$s) { $s['n'] = 100; return true; });
sb_with('live.json', static function (array &$s) { $s = []; return true; });
sb_config_save(['livePublic' => true]);
$lst = sb_live_list($ua, $L0); sb_live_tick($L0);
$lst = sb_live_list($ua, $L0);
$f = $lst['fx'][0] ?? [];
check('sbLive (joueur, direct public) : match, score 1-0, minute 63, 1x2, compétition', $lst['ok'] && $lst['n'] === 1 && $f['id'] === 'foot:9101' && $f['sc'] === [1, 0] && $f['m'] === 63 && $f['live'] === 1 && $f['susp'] === 0 && ($f['o']['mk'] ?? '') === '1x2' && ($lst['lg'][0]['n'] ?? '') === 'Premier League' && $f['rc'] === [0, 1], json_encode($f));
$M = sb_match($ua, 'foot:9101', $L0);
$mks = array_column($M['mk'], 'mk');
check('marchés du direct : 1x2, dc, dnb, ou:1.5 / 2.5 / 3.5, btts, tth:1.5', !array_diff(['1x2', 'dc', 'dnb', 'ou:1.5', 'ou:2.5', 'ou:3.5', 'btts', 'tth:1.5'], $mks), implode(',', $mks));
check('retirés : ou:0.5 (déjà joué à 1-0), ligne entière ou:2, prochain but, handicap asiatique', !in_array('ou:0.5', $mks, true) && !in_array('ou:2', $mks, true) && !array_filter($mks, static fn($m) => str_starts_with($m, 'ah')));
$u = (array) (sb_state()['unkLive'] ?? []);
check('noms inconnus du direct → diagnostic (Next Goal, Asian Handicap)', isset($u['Next Goal'], $u['Asian Handicap']) && isset(sb_admin_diag($L0)['unkLive']['Next Goal']));
$h1 = null; foreach ($M['mk'] as $m) if ($m['mk'] === '1x2') $h1 = $m['o'][0];
check('marge du direct : H ≤ 1,40 − 0,01 et < cote du flux (marge mLive)', $h1[0] === 'H' && $h1[1] <= 1.39 && $h1[1] >= 1.01, json_encode($h1));
check('tracker : buts / cartons / changement (penalty manqué ignoré)', count($M['trk']['events']) === 4 && $M['trk']['events'][0]['type'] === 'goal' && $M['trk']['events'][0]['team'] === 'h' && $M['trk']['events'][2]['detail'] === 'red' && $M['trk']['events'][3]['type'] === 'subst');
check('statistiques : pas encore lues → null', $M['trk']['stats'] === null);
sb_live_tick($L0 + 16);
$M2 = sb_match($ua, 'foot:9101', $L0 + 16);
check('statistiques lues (match ouvert) : tirs, cadrés, possession, corners, rouges', ($M2['trk']['stats']['shots'] ?? null) === [11, 4] && $M2['trk']['stats']['poss'] === [58, 42] && $M2['trk']['stats']['red'] === [0, 1] && $cnt('fixtures/statistics?fixture=9101') === 1, json_encode($M2['trk']['stats']));
sb_live_tick($L0 + 30);
check('statistiques : pas relues avant 60 s', $cnt('fixtures/statistics?fixture=9101') === 1);

// suspension
$cfg = sb_config();
$view = static fn(int $now) => sb_live_view('9101', sb_live_data(), $now, $cfg);
$base = (int) sb_live_data()['at'];
check('données de plus de 20 s : suspendu', $view($base + 5)['susp'] === false && $view($base + 21)['susp'] === true);
$alt['odds/live'] = $lodds(['m' => 88]); sb_live_refresh_now($base + 2);
check('88e minute : suspendu', $view($base + 2)['susp'] === true && sb_pick('sb:foot:9101:1x2', 'H', $ua, $base + 2)['reason'] === 'susp');
$alt['odds/live'] = $lodds(['blk' => true]); sb_live_refresh_now($base + 4);
check('bloqué par l\'API : suspendu', $view($base + 4)['susp'] === true);
$alt['odds/live'] = $lodds(['susp' => true]); sb_live_refresh_now($base + 6);
check('choix marqués suspendus : cadenas sur le marché (s = 1), pari refusé', sb_match($ua, 'foot:9101', $base + 6)['mk'][0]['s'] === 1 && sb_pick('sb:foot:9101:1x2', 'H', $ua, $base + 6)['reason'] === 'susp');
$alt['odds/live'] = $lodds(['g' => [2, 0]]); sb_live_refresh_now($base + 8);
check('score changé depuis la lecture précédente (but) : suspendu', $view($base + 8)['susp'] === true);
$alt['odds/live'] = $lodds(['g' => [2, 0]]); sb_live_refresh_now($base + 10);
check('… et toujours tant que /fixtures dit encore 1-0', $view($base + 10)['susp'] === true);
$alt['fixtures?live=all&timezone=UTC'] = $lfx(['g' => [2, 0], 'm' => 64]); sb_live_demand($base + 60); sb_live_tick($base + 60);
check('scores d\'accord (2-0) : rouvert ; ou:1.5 retiré (déjà joué)', $view($base + 60)['susp'] === false && !isset($view($base + 60)['mk']['ou:1.5']));
$alt['odds/live'] = $lodds(['ti' => [501, 999]]); sb_live_refresh_now($base + 62);
check('équipes différentes dans /odds/live : jamais utilisé (suspendu)', $view($base + 62)['susp'] === true);
$alt['odds/live'] = $lodds(['g' => [2, 0]]); sb_live_refresh_now($base + 64);
sb_live_refresh_now($base + 66);

// pari en direct : 5 s + relecture
$B0 = $base + 66; $at(gmdate('Y-m-d H:i:s', $B0));
$slept = [];
$next = null; // réponse /odds/live servie APRÈS l'attente
$GLOBALS['SB_SLEEP'] = function (int $sec, int $now) use (&$slept, &$next, &$alt) { $slept[] = $sec; if ($next !== null) $alt['odds/live'] = $next; $GLOBALS['SB_NOW'] = $now + $sec; return $now + $sec; };
$oH = (float) sb_pick('sb:foot:9101:1x2', 'H', $ua, $B0)['sel']['odd'];
$nOdds = $cnt('odds/live'); $b0 = $bal[$A];
$next = $lodds(['g' => [2, 0]]);
$r = sp_bet(load_db(), $ua, 'real', 10, [['ev' => 'sb:foot:9101:1x2', 'k' => 'H', 'odd' => $oH]], $B0);
$bet = $r['bet'] ?? [];
check('pari en direct : attente de 5 s, relecture de /odds/live, accepté', $r['ok'] === true && $slept === [5] && $cnt('odds/live') === $nOdds + 1 && abs($bal[$A] - ($b0 - 10)) < 0.001, json_encode($r));
$raw = null; foreach ((array) sp_with('bets.json', static fn(array &$s) => $s['b'] ?? []) as $b) if ($b['id'] === ($bet['id'] ?? '')) $raw = $b;
check('coupon « live : 1 », choix lv = 1 avec score 2-0 et minute', ($raw['live'] ?? 0) === 1 && ($raw['sel'][0]['lv'] ?? 0) === 1 && $raw['sel'][0]['sc'] === [2, 0] && ($bet['live'] ?? 0) === 1 && ($bet['sel'][0]['lv'] ?? 0) === 1 && $raw['at'] === $B0 + 5);
$slept = []; $b0 = $bal[$A]; $B1 = $B0 + 20; $at(gmdate('Y-m-d H:i:s', $B1)); $alt['odds/live'] = $lodds(['g' => [2, 0]]); sb_live_refresh_now($B1);
$next = $lodds(['g' => [2, 1]]);
$r = sp_bet(load_db(), $ua, 'real', 10, [['ev' => 'sb:foot:9101:1x2', 'k' => 'H', 'odd' => $oH]], $B1);
check('but pendant les 5 s : refusé « susp », rien retiré', $r['ok'] === false && $r['reason'] === 'susp' && $slept === [5] && abs($bal[$A] - $b0) < 0.001, json_encode($r));
$B2 = $B1 + 40; $at(gmdate('Y-m-d H:i:s', $B2)); $alt['odds/live'] = $lodds(['g' => [2, 1]]); $alt['fixtures?live=all&timezone=UTC'] = $lfx(['g' => [2, 1], 'm' => 66]); sb_live_demand($B2); sb_live_tick($B2); sb_live_refresh_now($B2 + 1);
$B2 += 1; $oH2 = (float) sb_pick('sb:foot:9101:1x2', 'H', $ua, $B2)['sel']['odd'];
$next = $lodds(['g' => [2, 1], 'h' => '1.20']);
$r = sp_bet(load_db(), $ua, 'real', 10, [['ev' => 'sb:foot:9101:1x2', 'k' => 'H', 'odd' => $oH2]], $B2);
check('cote changée pendant les 5 s : refusé « odds » avec la nouvelle cote', $r['ok'] === false && $r['reason'] === 'odds' && $r['odds'][0]['odd'] < $oH2 && abs($bal[$A] - $b0) < 0.001, json_encode($r));
$newH = (float) $r['odds'][0]['odd'];
$B3 = $B2 + 6; $at(gmdate('Y-m-d H:i:s', $B3)); $next = $lodds(['g' => [2, 1], 'h' => '1.25']);
$r = sp_bet(load_db(), $ua, 'real', 10, [['ev' => 'sb:foot:9101:1x2', 'k' => 'H', 'odd' => $newH]], $B3, 'any');
check('« tout accepter » : accepté à la cote relue après les 5 s', $r['ok'] === true && $r['bet']['odd'] > $newH, json_encode($r['bet']['odd'] ?? $r));
$B4 = $B3 + 6; $at(gmdate('Y-m-d H:i:s', $B4)); $next = $lodds(['g' => [2, 1], 'h' => '1.25', 'susp' => true]);
$r = sp_bet(load_db(), $ua, 'real', 10, [['ev' => 'sb:foot:9101:btts', 'k' => 'N']], $B4, 'any');
check('btts retiré à 2-1 (déjà joué) : refusé', $r['ok'] === false);
$r = sp_bet(load_db(), $ua, 'real', 10, [['ev' => 'sb:foot:9101:ou:3.5', 'k' => 'U']], $B4, 'any');
check('suspendu pendant les 5 s : refusé « susp »', $r['ok'] === false && $r['reason'] === 'susp', json_encode($r));
$GLOBALS['SB_SLEEP'] = function (int $sec, int $now) use (&$slept) { $slept[] = $sec; $GLOBALS['SB_NOW'] = $now + $sec; return $now + $sec; };
$alt['odds/live'] = $lodds(['g' => [2, 1], 'h' => '1.25']); $B5 = $B4 + 20; $at(gmdate('Y-m-d H:i:s', $B5)); sb_live_refresh_now($B5);
check('pari sur le match AVANT-MATCH déjà commencé par le chemin direct seulement : marché hors direct (eh) refusé', sb_pick('sb:foot:9101:eh:-1', 'H', $ua, $B5)['ok'] === false);
check('admin : état du direct', ($la = sb_live_admin($B5))['fx'] === 1 && $la['od'] === 1 && $la['on'] === true);

// règlement (score des 90 min), jamais annulé « posé après le coup d'envoi »
$live1 = $bet; $balS = $bal[$A];
sb_with('results.json', static function (array &$s) use ($LT, $B5) { $s['fx']['9101'] = ['v' => 'fin', 'st' => 'FT', 'ts' => $LT, 'ti' => [501, 502], 'ft' => [3, 1], 'ht' => [1, 0], 'at' => $B5, 't' => 'Live Rovers - Direct FC']; return true; });
sp_resolve(load_db());
$byId = []; foreach (sp_my_bets('u_a') as $b) $byId[$b['id']] = $b;
check('règlement : 1x2 H gagné à 3-1 (pari posé à 2-0, 63e), payé', ($byId[$live1['id']]['status'] ?? '') === 'won' && $bal[$A] > $balS);
$paid = $bal[$A]; sp_resolve(load_db());
check('jamais payé deux fois', abs($bal[$A] - $paid) < 0.001);
check('choix du direct : jamais « annulé » parce que posé après le coup d\'envoi', sb_sel_result(['ev' => 'sb:foot:9101:1x2', 'k' => 'A', 'lv' => 1], $LT + 3000, ['9101' => ['v' => 'fin', 'ts' => $LT, 'ft' => [0, 1]]], $B5, true) === 'won'
  && sb_sel_result(['ev' => 'sb:foot:9101:1x2', 'k' => 'A'], $LT + 3000, ['9101' => ['v' => 'fin', 'ts' => $LT, 'ft' => [0, 1]]], $B5, true) === 'void');
// fin du match : gardé 10 min, suspendu
$alt['fixtures?live=all&timezone=UTC'] = '{"errors":[],"response":[]}';
sb_with('live.json', static function (array &$s) { $s['fx']['9101']['m'] = 90; return true; });
sb_live_demand($B5 + 60); sb_live_tick($B5 + 60);
$lst = sb_live_list($uadm, $B5 + 61);
check('match sorti du flux après la 80e : gardé « fini » (FT), suspendu, pas compté', ($lst['fx'][0]['end'] ?? 0) === 1 && $lst['fx'][0]['st'] === 'FT' && $lst['fx'][0]['susp'] === 1 && $lst['n'] === 0);
sb_live_tick($B5 + 61 + 700);
$lx = sb_live_list($uadm, $B5 + 61 + 700); check('… puis retiré après 10 min', $lx['fx'] === [], json_encode($lx));
check('config : direct public par défaut + réglage de la dernière minute (borné 45…90)', SB_CFG_DEFAULT['livePublic'] === true && sb_config_save(['liveLastMin' => 120])['config']['liveLastMin'] == 90);

// 2026-10-22 — sbResults : scores finaux des matchs terminés qui ont eu NOS cotes seulement (fichiers locaux)
$RN = $T('2026-11-03 20:00:00'); $GLOBALS['SB_NOW'] = $RN;
sb_with(sb_day_file('2026-11-02'), static function (array &$s) use ($T) {
  $s = ['at' => $T('2026-11-02 23:00:00'), 'lg' => ['39' => ['n' => 'Premier League', 'c' => 'England', 'f' => '', 'lo' => '', 'p' => 2]], 'fx' => [
    '8801' => ['ts' => $T('2026-11-02 15:00:00'), 'st' => 'FT', 'm' => 90, 'lg' => 39, 'h' => [1, 'Res Home', ''], 'a' => [2, 'Res Away', ''], 'g' => [2, 1], 'ht' => [1, 0], 'ft' => [2, 1], 'o' => [['H', 2.0], ['D', 3.2], ['A', 3.5]], 'n' => 12],
    '8802' => ['ts' => $T('2026-11-02 16:00:00'), 'st' => 'FT', 'm' => 90, 'lg' => 39, 'h' => [3, 'Sans Cotes', ''], 'a' => [4, 'Jamais Vu', ''], 'g' => [0, 0], 'ht' => [0, 0], 'ft' => [0, 0]],
    '8803' => ['ts' => $T('2026-11-02 18:00:00'), 'st' => '2H', 'm' => 70, 'lg' => 39, 'h' => [5, 'En Cours', ''], 'a' => [6, 'Pas Fini', ''], 'g' => [1, 1], 'o' => [['H', 2.0], ['D', 3.2], ['A', 3.5]], 'n' => 5]]];
  return true;
});
$rr = sb_results_list($uadm, -1, 0, $RN);
check('sbResults hier : seulement le match terminé AVEC nos cotes (score final + mi-temps)', $rr['ok'] === true && array_column($rr['fx'], 'id') === ['foot:8801'] && $rr['fx'][0]['ft'] === [2, 1] && $rr['fx'][0]['ht'] === [1, 0] && count($rr['lg']) === 1, json_encode($rr));
check('sbResults aujourd\'hui : rien', sb_results_list($uadm, 0, 0, $RN)['fx'] === []);
check('sbResults : jour borné (-5 → -2) et invisible pour qui ne voit pas les paris', sb_results_list($uadm, -5, 0, $RN)['day'] === -2 && (sb_config()['public'] || sb_results_list(null, -1, 0, $RN)['reason'] === 'off'));

echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exec('rm -rf ' . escapeshellarg($tmp));
exit($fail ? 1 : 0);
