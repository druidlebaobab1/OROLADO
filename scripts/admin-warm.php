<?php
declare(strict_types=1);
// 2026-11-23 (propriétaire : « le tableau admin affiche — partout ») — PRÉPARATEUR DES CHIFFRES ADMIN.
// Le serveur web (PHP-FPM) coupe toute demande au bout de 30 s. Avec les vraies données, relire Supabase (joueurs,
// dépôts, retraits, trades) puis calculer les compteurs dépasse ce temps : la demande était tuée → « — ».
// Ce script tourne À PART (ligne de commande, sans limite de temps), lancé par la page admin (admin_warm_kick).
// Il recalcule les copies en mémoire toutes les ~20 s tant que l'admin est là, puis s'arrête 10 min après.
// Il ne fait que LIRE et écrire des copies (data/…cache) : aucun argent, aucune écriture dans la base.
//   php scripts/admin-warm.php          → boucle (un seul à la fois)
//   php scripts/admin-warm.php --once   → une ronde (appelée par la boucle, processus neuf à chaque fois)
if (PHP_SAPI !== 'cli') exit;
@set_time_limit(0);
ignore_user_abort(true);
chdir(dirname(__DIR__));
define('OROLADO_ADMIN_WARM', true);
define('OROLADO_ADMIN_FUNCS_ONLY', true);
require dirname(__DIR__) . '/admin.php';

$once = in_array('--once', $argv ?? [], true);

if ($once) {
  $log = [];
  $step = static function (string $key, callable $fn) use (&$log): void {
    $t = microtime(true);
    $GLOBALS['ADMIN_FORCE_KEY'] = $key;
    try { $fn(); $log[] = $key . ' ' . round(microtime(true) - $t, 1) . 's'; }
    catch (Throwable $e) { $log[] = $key . ' ERREUR ' . $e->getMessage(); }
    $GLOBALS['ADMIN_FORCE_KEY'] = '';
  };
  // 1) données de base (Supabase) — 2) compteurs calculés dessus
  $step('profiles_epoch2', static fn() => admin_profiles());
  $step('wd_epoch3', static fn() => admin_withdrawals());
  $step('deposits_epoch3', static fn() => admin_deposits());
  $step('orders_epoch3', static fn() => admin_orders());
  $step('badges_epoch5', static fn() => admin_badges());
  $step('inscrits_n_epoch4', static fn() => admin_inscrits_count());
  $step('board_watch2', static fn() => admin_board_issues_raw());
  @file_put_contents(admin_cache_file('admin_warm.last'), date('c') . ' ' . implode(' · ', $log) . "\n");
  exit;
}

$lk = fopen(admin_cache_file('admin_warm.lock'), 'c');
if (!$lk || !flock($lk, LOCK_EX | LOCK_NB)) exit; // déjà en marche
$php = PHP_BINARY !== '' ? PHP_BINARY : 'php';
$seen = admin_cache_file('admin_warm.seen');
$start = time();
while (true) {
  clearstatcache(true, $seen);
  $last = is_file($seen) ? (int) filemtime($seen) : 0;
  if (time() - $last > 600 || time() - $start > 6 * 3600) break; // admin parti depuis 10 min (ou 6 h au plus)
  $t = time();
  passthru(escapeshellarg($php) . ' ' . escapeshellarg(__FILE__) . ' --once > /dev/null 2>&1');
  $wait = 20 - (time() - $t);
  sleep(max(2, $wait));
}
flock($lk, LOCK_UN);
fclose($lk);
