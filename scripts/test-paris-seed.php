<?php
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * v2787 — Paris remplis automatiquement : événements SERRÉS ajoutés une seule fois, anciens événements pas serrés retirés
 * (seulement si personne n'a parié dessus), heure de fin gardée pour prévenir l'admin au bon moment. Dossier temporaire.
 */
$tmp = sys_get_temp_dir() . '/orolado_pseed_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data/archive', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'aff_lib.php', 'casino_lib.php', 'sports_lib.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
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
require $tmp . '/orolado_lib.php'; require $tmp . '/trade_lib.php'; require $tmp . '/aff_lib.php'; require $tmp . '/casino_lib.php'; require $tmp . '/sports_lib.php';
@file_put_contents(sp_dir() . DIRECTORY_SEPARATOR . 'seed-2026-10.done', '1');
@file_put_contents(sp_dir() . DIRECTORY_SEPARATOR . 'seed-2026-10c.done', '1'); @file_put_contents(sp_dir() . DIRECTORY_SEPARATOR . 'seed-2026-10d.done', '1'); // v2807 : la 3e série a son propre test (test-paris-seed3.php)
$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }
$A = 'aaaaaaaa-1111-2222-3333-444444444444';
$db = blank_db();
$db['users']['u_a'] = ['id' => 'u_a', 'email' => 'a@gmail.com', 'role' => 'user', 'sbId' => $A];
save_db(orolado_data_file(), $db); $bal[$A] = 100.0;
$t = time() + 7200;
// 2 anciens événements PAS serrés : un sans pari (doit partir), un avec un pari (doit rester)
$r1 = sp_admin_save(['title' => 'Vieux test - Sans pari', 'start' => $t, 'opts' => [['label' => 'A', 'odd' => 1.38], ['label' => 'B', 'odd' => 2.9]]]);
$r2 = sp_admin_save(['title' => 'Vieux test - Avec pari', 'start' => $t, 'opts' => [['label' => 'A', 'odd' => 1.30], ['label' => 'B', 'odd' => 3.4]]]);
$r3 = sp_admin_save(['title' => 'Bon match - Serré', 'start' => $t, 'opts' => [['label' => 'A', 'odd' => 1.85], ['label' => 'B', 'odd' => 1.85]]]);
$bet = sp_bet(load_db(), $db['users']['u_a'], 'real', 2, [['ev' => $r2['id'], 'k' => 'o0']]);
check('un joueur parie sur l’ancien événement pas serré', !empty($bet['ok']));
$ev = sp_public_events();
$ids = array_column($ev, 'id');
check('ancien événement PAS serré sans pari : retiré', !in_array($r1['id'], $ids, true));
check('ancien événement pas serré AVEC un pari : gardé (honnête)', in_array($r2['id'], $ids, true));
check('événement serré déjà là : gardé', in_array($r3['id'], $ids, true));
$new = array_values(array_filter(sp_events(), static fn($e) => isset($e['endAt'])));
check('nouveaux événements publiés tout seuls', count($new) >= 20, (string) count($new));
// v2802 (propriétaire) : le foot sans pari reçoit le NUL (1 · N · 2, cotes plus hautes) ; les autres sports restent serrés à 2 choix
$foot3 = static fn($e) => ($e['sport'] ?? '') === 'foot' && count($e['opts']) === 3 && $e['opts'][1]['label'] === 'Nul';
$loose = array_filter($new, static fn($e) => !$foot3($e) && !sp_is_tight($e));
check('les nouveaux hors foot sont SERRÉS (cotes entre 1,55 et 2,30)', !$loose, implode(' | ', array_column($loose, 'title')));
$bad = array_filter($new, static fn($e) => ($e['sport'] ?? '') === 'foot' ? !$foot3($e) : count($e['opts']) !== 2);
check('foot : 3 choix avec le Nul · autres sports : 2 choix', !$bad, implode(' | ', array_column($bad, 'title')));
$btc = array_values(array_filter(sp_public_events(), static fn($e) => str_starts_with((string) $e['title'], 'Bitcoin')));
check('questions Bitcoin traduites (anglais, chinois…)', $btc && isset(((array) $btc[0]['i18n'])['en'], ((array) $btc[0]['i18n'])['zh']), $btc ? json_encode($btc[0]['i18n'], JSON_UNESCAPED_UNICODE) : '');
$badEnd = array_filter($new, static fn($e) => (int) $e['endAt'] <= (int) $e['start']);
check('heure de fin toujours APRÈS la fermeture des paris', !$badEnd);
$far = array_filter($new, static fn($e) => (int) $e['start'] > time() + 32 * 86400);
check('aucun événement à plus d’un mois', !$far);
$n1 = count(sp_events()); sp_public_events(); sp_public_events();
check('jamais ajoutés deux fois', count(sp_events()) === $n1);
// notification admin : seulement après la vraie fin
$first = $new[0];
sp_remind_admin((int) $first['start'] + 9000 < (int) $first['endAt'] ? (int) $first['start'] + 9000 : (int) $first['endAt'] - 60);
$after = array_values(array_filter(sp_events(), static fn($e) => $e['id'] === $first['id']))[0];
check('pas de « résultat à donner » avant la vraie fin', empty($after['askedAt']));
sp_remind_admin((int) $first['endAt'] + 5);
$after = array_values(array_filter(sp_events(), static fn($e) => $e['id'] === $first['id']))[0];
check('« résultat à donner » après la vraie fin', !empty($after['askedAt']));
// match nul = remboursé : l'admin choisit « Annulé » → la mise revient
$foot = array_values(array_filter($new, static fn($e) => $e['sport'] === 'foot'))[0];
$bal[$A] = 50.0;
$b = sp_bet(load_db(), $db['users']['u_a'], 'real', 5, [['ev' => $foot['id'], 'k' => 'o0']]);
sp_admin_settle(load_db(), $foot['id'], 'void');
check('match nul (« Annulé ») : 5 $ rendus', !empty($b['ok']) && abs($bal[$A] - 50.0) < 0.001, (string) $bal[$A]);
echo "\nRÉSULTAT : $pass OK, $fail échec(s)\n";
exit($fail ? 1 : 0);
