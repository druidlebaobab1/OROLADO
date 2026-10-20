<?php
declare(strict_types=1);
/**
 * v2426 — Tableau admin, rubrique « F · Cadeaux » : suivre l'Invitation (affiliés et amis invités),
 * le Tournoi démo (cette semaine et la semaine dernière, avec l'e-mail pour récompenser les gagnants),
 * le Bonus dépôt et le Défi du jour.
 * LECTURE SEULE : rien n'est versé ni modifié ici (les cadeaux sont décidés et payés par aff_lib, top_lib,
 * bonus_lib et defi_lib, comme pour les joueurs).
 */
foreach (['aff_lib.php', 'top_lib.php', 'defi_lib.php', 'bonus_lib.php'] as $giftLib) {
  if (is_file(__DIR__ . '/' . $giftLib)) require_once __DIR__ . '/' . $giftLib;
}

/** Lit un petit fichier JSON d'état (sans verrou : simple lecture). */
function admin_gift_json(string $file): array {
  if (!is_file($file)) return [];
  $j = json_decode((string) @file_get_contents($file), true);
  return is_array($j) ? $j : [];
}

/** Fiche courte d'un joueur : numéro ORO, nom, e-mail. */
function admin_gift_who(array $db, string $uid): array {
  $u = $db['users'][$uid] ?? [];
  if (!is_array($u)) $u = [];
  return [
    'id' => (string) ($u['publicId'] ?? '') !== '' ? (string) $u['publicId'] : '—',
    'name' => trim((string) ($u['name'] ?? $u['displayName'] ?? '')) ?: '—',
    'email' => (string) ($u['email'] ?? ''),
    'sb' => (string) ($u['sbId'] ?? ''),
  ];
}

function admin_gift_date($t): string {
  $ts = is_numeric($t) ? (int) $t : (int) strtotime((string) $t);
  return $ts > 0 ? date('d/m/Y H:i', $ts) : '—';
}

/** Les vues de la rubrique Cadeaux. */
function admin_gift_payload(string $view, array $req, array $people): array {
  $db = load_db();
  // La liste des joueurs peut être un tableau ou un OroladoMap (parcourable comme un tableau).
  $users = $db['users'] ?? [];
  if (!is_iterable($users)) $users = [];
  $rows = [];
  $cols = [];
  $summary = '';
  // Adresse IP d'inscription (fiches Supabase), par e-mail : pour repérer quelqu'un qui s'invite lui-même.
  $ipByEmail = [];
  foreach ($people as $p) {
    $e = strtolower(trim((string) ($p['email'] ?? '')));
    if ($e !== '' && !empty($p['ip'])) $ipByEmail[$e] = (string) $p['ip'];
  }
  $row = static function (array $cells, array $who) {
    return ['cells' => $cells, 'userId' => $who['sb'] !== '' ? $who['sb'] : $who['id']];
  };

  if ($view === 'gift_aff' || $view === 'gift_friends') {
    $all = [];
    $friendsAll = [];
    foreach ($users as $uid => $u) {
      if (!function_exists('orolado_aff_owner_name')) break;
      $own = orolado_aff_read(orolado_aff_owner_name((string) $uid));
      $friends = is_array($own['friends'] ?? null) ? $own['friends'] : [];
      if (!$friends && empty($own['clicks'])) continue;
      $who = admin_gift_who($db, (string) $uid);
      $myIp = $ipByEmail[strtolower($who['email'])] ?? '';
      $ipSeen = [];
      $alerts = 0;
      $dep = 0; $total = 0.0;
      foreach ($friends as $f) {
        $fip = (string) ($f['ip'] ?? '');
        $flag = '';
        if ($fip !== '' && $fip === $myIp) $flag = '⚠ même IP que celui qui invite';
        elseif ($fip !== '' && isset($ipSeen[$fip])) $flag = '⚠ même IP qu’un autre ami';
        if ($fip !== '') $ipSeen[$fip] = true;
        if ($flag !== '') $alerts++;
        if (!empty($f['paid'])) $dep++;
        $total += (float) ($f['deposit'] ?? 0);
        $fw = admin_gift_who($db, (string) ($f['uid'] ?? ''));
        $friendsAll[] = ['t' => (int) strtotime((string) ($f['at'] ?? '')), 'cells' => [
          $fw['id'], $fw['email'] !== '' ? $fw['email'] : '—', $who['id'], $who['email'] !== '' ? $who['email'] : '—',
          admin_gift_date($f['at'] ?? ''), admin_money($f['deposit'] ?? 0), admin_money($f['gift'] ?? 0), $flag !== '' ? $flag : '—',
        ], 'who' => $fw];
      }
      $all[] = ['earned' => (float) ($own['earned'] ?? 0), 'cells' => [
        $who['id'], $who['name'], $who['email'] !== '' ? $who['email'] : '—', (string) (int) ($own['clicks'] ?? 0),
        (string) count($friends), (string) $dep, admin_money($total), admin_money($own['earned'] ?? 0),
        $alerts > 0 ? '⚠ ' . $alerts . ' ami(s) à vérifier' : '—',
      ], 'who' => $who];
    }
    if ($view === 'gift_aff') {
      usort($all, static fn($a, $b) => $b['earned'] <=> $a['earned']);
      $cols = ['ID', 'Nom', 'E-mail', 'Clics', 'Amis inscrits', 'Amis qui ont déposé', 'Déposé par ses amis', 'Gagné (5 %)', 'Alerte'];
      $sum = 0.0;
      foreach ($all as $a) { $rows[] = $row($a['cells'], $a['who']); $sum += $a['earned']; }
      $summary = count($all) . ' joueur(s) qui invitent · ' . admin_money($sum) . ' versés aux affiliés (argent libre, retirable)';
    } else {
      usort($friendsAll, static fn($a, $b) => $b['t'] <=> $a['t']);
      $cols = ['Ami (ID)', 'E-mail de l’ami', 'Invité par (ID)', 'E-mail de l’affilié', 'Inscrit le', 'Déposé', 'Gagné par l’affilié', 'Alerte'];
      foreach ($friendsAll as $f) $rows[] = $row($f['cells'], $f['who']);
      $summary = count($friendsAll) . ' ami(s) invité(s) — « même IP » = peut-être la même personne : à vérifier avant de payer un retrait';
    }
  }

  if ($view === 'gift_top' || $view === 'gift_top_prev') {
    if (function_exists('orolado_top_week')) {
      $wk = orolado_top_week($view === 'gift_top' ? time() : time() - 7 * 86400);
      $st = orolado_top_scan($db, $wk);
      $rank = orolado_top_rank($db, $st);
      $cols = ['Rang', 'ID', 'Nom', 'E-mail', 'Points ORO', 'Trades démo', 'Gagnés', 'Misé (démo)', 'Gain net (démo)'];
      foreach ($rank as $r) {
        $who = admin_gift_who($db, (string) $r['uid']);
        $a = $st['users'][$r['uid']] ?? [];
        $rows[] = $row([(string) $r['rank'], $who['id'], $who['name'], $who['email'] !== '' ? $who['email'] : '—', (string) $r['points'],
          (string) $r['trades'], (string) $r['wins'], admin_money($a['stake'] ?? 0), admin_money($a['net'] ?? 0)], $who);
      }
      $summary = 'Semaine ' . $wk['key'] . ' (' . date('d/m', $wk['start']) . ' → ' . date('d/m', $wk['end']) . ') · ' . count($rank)
        . ' joueur(s) classés (20 trades démo minimum) · Points = 1000 × gain net ÷ total misé · récompense à verser à la main';
    }
  }

  if ($view === 'gift_bon') {
    $cols = ['ID', 'Nom', 'E-mail', 'Semaine', 'Activé le', 'Dépôt', 'Bonus prévu', 'Déjà versé', 'Misé depuis le dépôt', 'État'];
    $sumPaid = 0.0; $n = 0;
    $list = [];
    foreach ($users as $uid => $u) {
      if (!function_exists('orolado_bonus_file')) break;
      $st = admin_gift_json(orolado_bonus_file((string) $uid));
      foreach ((array) ($st['weeks'] ?? []) as $key => $w) {
        if (!is_array($w) || empty($w['activatedAt'])) continue;
        $credited = (float) ($w['credited'] ?? 0);
        $target = (float) ($w['target'] ?? 0);
        $state = empty($w['depositId']) ? 'En attente du dépôt' : ($credited + 0.009 >= $target ? 'Plein' : ((int) ($w['until'] ?? 0) < time() ? 'Délai fini' : 'Se remplit'));
        $sumPaid += $credited; $n++;
        $who = admin_gift_who($db, (string) $uid);
        $list[] = ['t' => (int) $w['activatedAt'], 'cells' => [$who['id'], $who['name'], $who['email'] !== '' ? $who['email'] : '—', (string) $key,
          admin_gift_date($w['activatedAt']), empty($w['depositAmount']) ? '—' : admin_money($w['depositAmount']), admin_money($target),
          admin_money($credited), admin_money($w['staked'] ?? 0), $state], 'who' => $who];
      }
    }
    usort($list, static fn($a, $b) => $b['t'] <=> $a['t']);
    foreach ($list as $l) $rows[] = $row($l['cells'], $l['who']);
    $summary = $n . ' bonus activé(s) · ' . admin_money($sumPaid) . ' déjà versés · +1 $ par 30 $ misés, jusqu’à +10 % du dépôt (100 $ minimum), 7 jours';
  }

  if ($view === 'gift_defi') {
    // 2026-10-20 : le Défi tourne sur TOUS les marchés (10 d'origine + indices.json) → noms actuels (avant : liste figée,
    // COBRA affiché « ZUL », ZUL « PYTHON », nouveaux indices en identifiant brut).
    $mkName = static function (string $id): string {
      if (function_exists('admin_asset_name')) return admin_asset_name($id);
      $n = function_exists('orolado_feed_asset_name') ? orolado_feed_asset_name($id) : '';
      return $n !== '' ? $n : strtoupper($id);
    };
    $cols = ['ID', 'Nom', 'E-mail', 'Marché du défi', 'Commencé le', 'Série', 'État', 'Cadeau du jour', 'Défis gagnés', 'Cadeaux reçus (total)'];
    $list = [];
    $today = 0; $paidToday = 0.0;
    foreach ($users as $uid => $u) {
      if (!function_exists('orolado_defi_file')) break;
      $st = admin_gift_json(orolado_defi_file((string) $uid));
      if (empty($st['activatedAt'])) continue;
      $hist = (array) ($st['history'] ?? []);
      $wonN = 0; $sum = 0.0;
      foreach ($hist as $h) if (!empty($h['won'])) { $wonN++; $sum += (float) ($h['reward'] ?? 0); }
      $running = empty($st['finished']) && time() <= (float) ($st['expiresAt'] ?? 0);
      $state = $running ? 'En cours' : (!empty($st['won']) ? 'Gagné' : 'Perdu');
      if (date('Y-m-d', (int) $st['activatedAt']) === date('Y-m-d')) { $today++; if (!empty($st['won'])) $paidToday += (float) ($st['reward'] ?? 0); }
      $who = admin_gift_who($db, (string) $uid);
      $mk = (string) ($st['market'] ?? '');
      $list[] = ['t' => (int) $st['activatedAt'], 'cells' => [$who['id'], $who['name'], $who['email'] !== '' ? $who['email'] : '—',
        $mk !== '' ? $mkName($mk) : '—', admin_gift_date($st['activatedAt']), (int) ($st['streak'] ?? 0) . ' / 5', $state,
        !empty($st['won']) ? admin_money($st['reward'] ?? 0) : '—', (string) $wonN, admin_money($sum)], 'who' => $who];
    }
    usort($list, static fn($a, $b) => $b['t'] <=> $a['t']);
    foreach ($list as $l) $rows[] = $row($l['cells'], $l['who']);
    $summary = $today . ' défi(s) commencé(s) aujourd’hui · ' . admin_money($paidToday) . ' de cadeaux versés aujourd’hui · cadeau = plus petite mise des 5 victoires × 3';
  }

  // Recherche (champ de recherche de l'admin) : ID, e-mail, nom…
  $q = strtolower(trim((string) ($req['q'] ?? '')));
  if ($q !== '') $rows = array_values(array_filter($rows, static fn($r) => str_contains(strtolower(implode(' ', $r['cells'])), $q)));
  [$slice, $total, $page, $pages] = admin_page($rows, $req);
  return ['ok' => true, 'cols' => $cols, 'rows' => $slice, 'total' => $total, 'page' => $page, 'pages' => $pages, 'summary' => $summary, 'actions' => false];
}
