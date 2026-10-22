<?php
declare(strict_types=1);
/**
 * v2426 — Tableau admin, rubrique « F · Cadeaux » : suivre l'Invitation (affiliés et amis invités),
 * le Tournoi démo (cette semaine et la semaine dernière, avec l'e-mail pour récompenser les gagnants),
 * le Bonus dépôt et le Défi du jour.
 * LECTURE SEULE pour les vues : les cadeaux sont décidés et payés par aff_lib, top_lib, bonus_lib et defi_lib.
 * Seule exception (2026-10-21, propriétaire) : « Payer tout le monde » du Tournoi démo (admin_top_pay_*, plus bas),
 * qui verse de petits montants décroissants aux classés par le même crédit que « Ajuster » (admin_credit_player,
 * passé en paramètre), avec un registre data/top_paid_<semaine>.json pour ne jamais payer deux fois.
 */
foreach (['aff_lib.php', 'top_lib.php', 'defi_lib.php', 'bonus_lib.php', 'bonus_kick_lib.php'] as $giftLib) {
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
      $cols = ['Rang', 'ID', 'Nom', 'E-mail', 'Points ORO', 'Trades démo', 'Gagnés', 'Misé (démo)', 'Gain net (démo)', 'Payé'];
      $paid = admin_top_paid_read($wk['key']);
      $nPaid = 0; $sumPaid = 0.0;
      foreach ($rank as $r) {
        $who = admin_gift_who($db, (string) $r['uid']);
        $a = $st['users'][$r['uid']] ?? [];
        $pe = $paid[(string) $r['uid']] ?? null;
        if (is_array($pe) && !empty($pe['ok'])) { $nPaid++; $sumPaid += (float) ($pe['amount'] ?? 0); }
        $rows[] = $row([(string) $r['rank'], $who['id'], $who['name'], $who['email'] !== '' ? $who['email'] : '—', (string) $r['points'],
          (string) $r['trades'], (string) $r['wins'], admin_money($a['stake'] ?? 0), admin_money($a['net'] ?? 0), admin_top_paid_label($pe)], $who);
      }
      $summary = 'Semaine ' . $wk['key'] . ' (' . date('d/m', $wk['start']) . ' → ' . date('d/m', $wk['end']) . ') · ' . count($rank)
        . ' joueur(s) classés (20 trades démo minimum) · Points = 1000 × gain net ÷ total misé · ' . $nPaid . ' déjà payé(s)'
        . ($sumPaid > 0 ? ' (' . admin_money($sumPaid) . ' par le bouton)' : '');
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

/* ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
 * 2026-10-21 (propriétaire) — Tournoi démo : « Payer tout le monde ».
 * Un clic paie TOUS les classés (à partir du rang « fromRank », 1 par défaut ; les rangs déjà payés à la main se
 * marquent avant avec « Marquer comme déjà payés ») : un petit bonus qui descend en ligne droite du « premier »
 * (0,90 $) au « dernier » (0,20 $ = au moins deux mises minimum de 0,10 $), arrondi au cent INFÉRIEUR, jamais sous
 * le minimum. Chaque versement est un bonus admin ordinaire (admin_credit_player = action « adjust », motif
 * « Bonus tournoi démo — semaine … — rang … », mêmes règles de retrait que les autres bonus admin) et est
 * inscrit dans data/top_paid_<semaine>.json AVANT de passer au suivant :
 *   { uid: { rank, amount, at, ok, [mail: sent|failed|none], [manual], [pending], [error] } }
 * L'e-mail au joueur est CELUI du crédit à la main (orolado_notify_player, appelé par admin_credit_player) ; s'il ne
 * part pas, le crédit reste fait (« mail: failed » dans le registre). Un appel paie un petit paquet (5) et répond
 * « more » : la page rappelle jusqu'à la fin ; page fermée en cours → re-cliquer reprend où c'était, sans double paiement.
 * - ok = true          → déjà payé (bouton ou « à la main ») : jamais repayé ;
 * - pending = true     → paiement commencé mais pas terminé (coupure) : jamais repayé tout seul, à vérifier ;
 * - ok = false + error → le crédit a été refusé : sera retenté au prochain clic.
 * ───────────────────────────────────────────────────────────────────────────────────────────────────────────── */

const ADMIN_TOP_PAY_MAX_CAP = 5.0; // jamais plus de 5 $ par joueur (le minimum de retrait) par ce bouton

function admin_top_pay_week(string $week, ?int $now = null): array {
  $now = $now ?? time();
  return orolado_top_week($week === 'prev' ? $now - 7 * 86400 : $now);
}

function admin_top_paid_file(string $key): string {
  return rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'top_paid_' . preg_replace('/[^0-9W-]/', '', $key) . '.json';
}

function admin_top_paid_read(string $key): array {
  return admin_gift_json(admin_top_paid_file($key));
}

/** Lecture-modification-écriture du registre, sous verrou (fichier écrit en entier, puis vidé sur disque). */
function admin_top_paid_with(string $key, callable $fn) {
  return admin_gift_led_with(admin_top_paid_file($key), $fn);
}

/** Registre (fichier JSON) lu-modifié-écrit sous verrou. */
function admin_gift_led_with(string $file, callable $fn) {
  $fp = @fopen($file, 'c+');
  if (!$fp) throw new RuntimeException('Registre des paiements illisible : ' . basename($file));
  flock($fp, LOCK_EX);
  try {
    $led = json_decode(stream_get_contents($fp) ?: '', true);
    if (!is_array($led)) $led = [];
    $out = $fn($led);
    $json = json_encode($led, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    rewind($fp);
    ftruncate($fp, 0);
    if ($json === false || fwrite($fp, $json) !== strlen($json)) throw new RuntimeException('Registre des paiements : écriture impossible');
    fflush($fp);
    return $out;
  } finally {
    flock($fp, LOCK_UN);
    fclose($fp);
  }
}

function admin_top_paid_label($e): string {
  if (!is_array($e)) return '—';
  if (!empty($e['pending'])) return '⚠ À vérifier (paiement interrompu)';
  if (!empty($e['ok'])) return !empty($e['manual']) ? 'Oui (à la main)' : 'Oui · ' . admin_money($e['amount'] ?? 0)
    . (($e['mail'] ?? '') === 'sent' ? ' · e-mail envoyé' : (($e['mail'] ?? '') === 'failed' ? ' · ⚠ e-mail non parti' : (($e['mail'] ?? '') === 'none' ? ' · sans e-mail' : '')));
  return '✗ Erreur : ' . (string) ($e['error'] ?? '?');
}

/**
 * Montants pour $n joueurs : du premier ($max) au dernier ($min) en ligne droite, arrondis au cent inférieur.
 * Calcul en cents entiers (aucune erreur d'arrondi) : a(i) = ⌊ (max·(n−1) − (max−min)·i) ÷ (n−1) ⌋ cents.
 */
function admin_top_pay_amounts(int $n, float $max, float $min): array {
  if ($n <= 0) return [];
  $maxC = (int) round($max * 100);
  $minC = (int) round($min * 100);
  if ($n === 1) return [$maxC / 100];
  $out = [];
  for ($i = 0; $i < $n; $i++) {
    $c = intdiv($maxC * ($n - 1) - ($maxC - $minC) * $i, $n - 1);
    $c = max($minC, min($maxC, $c));
    $out[] = $c / 100;
  }
  return $out;
}

/** Paramètres du formulaire, vérifiés (vides → valeurs par défaut 1 / 0,90 / 0,20). */
function admin_top_pay_params(array $req): array {
  $num = static fn(string $k, $def) => (isset($req[$k]) && $req[$k] !== '' && is_numeric(str_replace(',', '.', (string) $req[$k])))
    ? (float) str_replace(',', '.', (string) $req[$k]) : $def;
  $week = (string) ($req['week'] ?? 'cur') === 'prev' ? 'prev' : 'cur';
  $from = (int) $num('fromRank', 1);
  $max = round((float) $num('max', 0.90), 2);
  $min = round((float) $num('min', 0.20), 2);
  if ($from < 1 || $from > 100000) return ['ok' => false, 'reason' => 'Rang de départ invalide'];
  if ($min < 0.01) return ['ok' => false, 'reason' => 'Le montant du dernier doit être d’au moins 0,01 $'];
  if ($max < $min) return ['ok' => false, 'reason' => 'Le montant du premier doit être au moins égal à celui du dernier'];
  if ($max > ADMIN_TOP_PAY_MAX_CAP) return ['ok' => false, 'reason' => 'Montant du premier trop grand (5 $ au plus)'];
  return ['ok' => true, 'week' => $week, 'fromRank' => $from, 'max' => $max, 'min' => $min];
}

/**
 * Le plan : tous les classés à partir de fromRank, avec leur montant (calculé sur TOUTE la liste, payés compris,
 * pour que les montants ne bougent pas quand certains sont déjà payés), leur état dans le registre, et une
 * empreinte « sig » (semaine + paramètres + rang/joueur/montant) qui change si le classement bouge.
 */
function admin_top_pay_plan(array $db, array $p, ?int $now = null): array {
  if (!function_exists('orolado_top_week')) return ['ok' => false, 'reason' => 'Tournoi indisponible'];
  $wk = admin_top_pay_week($p['week'], $now);
  $st = orolado_top_scan($db, $wk);
  $rank = array_values(array_filter(orolado_top_rank($db, $st), static fn($r) => (int) $r['rank'] >= $p['fromRank']));
  $amounts = admin_top_pay_amounts(count($rank), $p['max'], $p['min']);
  $led = admin_top_paid_read($wk['key']);
  $rows = [];
  $sig = [$wk['key'], $p['fromRank'], sprintf('%.2f', $p['max']), sprintf('%.2f', $p['min'])];
  $total = 0.0; $count = 0; $already = 0; $check = 0;
  foreach ($rank as $i => $r) {
    $uid = (string) $r['uid'];
    $who = admin_gift_who($db, $uid);
    $u = is_array($db['users'][$uid] ?? null) ? $db['users'][$uid] : [];
    $e = $led[$uid] ?? null;
    $state = 'todo';
    if (is_array($e) && !empty($e['pending'])) { $state = 'check'; $check++; }
    elseif (is_array($e) && !empty($e['ok'])) { $state = 'paid'; $already++; }
    $amt = $amounts[$i];
    if ($state === 'todo') { $total += $amt; $count++; }
    $sig[] = $r['rank'] . ':' . $uid . ':' . sprintf('%.2f', $amt);
    $rows[] = [
      'rank' => (int) $r['rank'], 'uid' => $uid,
      'payId' => $who['sb'] !== '' ? $who['sb'] : $uid,
      'id' => $who['id'], 'name' => $who['name'], 'email' => $who['email'],
      'publicId' => (string) ($u['publicId'] ?? ''),
      'points' => (int) $r['points'], 'amount' => $amt, 'state' => $state, 'paid' => admin_top_paid_label($e),
    ];
  }
  return [
    'ok' => true, 'week' => $wk['key'], 'weekStart' => $wk['start'], 'weekEnd' => $wk['end'], 'running' => time() <= $wk['end'],
    'fromRank' => $p['fromRank'], 'max' => $p['max'], 'min' => $p['min'],
    'rows' => $rows, 'count' => $count, 'total' => round($total, 2), 'already' => $already, 'check' => $check,
    'sig' => substr(hash('sha256', implode('|', $sig)), 0, 16),
  ];
}

/** Aperçu (rien n'est payé). */
function admin_top_pay_preview(array $req, ?array $db = null): array {
  $p = admin_top_pay_params($req);
  if (empty($p['ok'])) return $p;
  return admin_top_pay_plan($db ?? load_db(), $p);
}

/**
 * Paie, un par un, les joueurs « à payer » du plan. $pay($payId, $amount, $motif, $hint) doit renvoyer
 * ['ok' => true, …] ou ['ok' => false, 'reason' => …] (dans l'admin : admin_credit_player).
 * $limit > 0 : au plus $limit versements par appel (l'écran rappelle jusqu'à la fin, pour montrer l'avancement).
 * S'arrête au PREMIER refus. Jamais deux paiements en même temps (verrou), jamais deux fois le même joueur (registre).
 */
function admin_top_pay_run(array $req, callable $pay, int $limit = 0, ?array $db = null): array {
  if ((string) ($req['confirm'] ?? '') !== 'PAYER') return ['ok' => false, 'reason' => 'Confirmation manquante : tapez PAYER'];
  $p = admin_top_pay_params($req);
  if (empty($p['ok'])) return $p;
  $plan = admin_top_pay_plan($db ?? load_db(), $p);
  if (empty($plan['ok'])) return $plan;
  if (!empty($req['sig']) && (string) $req['sig'] !== $plan['sig']) {
    return ['ok' => false, 'reason' => 'Le classement ou les montants ont changé depuis l’aperçu : refaites « Aperçu » avant de payer.', 'changed' => true];
  }
  $key = $plan['week'];
  $lk = @fopen(admin_top_paid_file($key) . '.run.lock', 'c');
  if (!$lk || !flock($lk, LOCK_EX | LOCK_NB)) {
    if ($lk) fclose($lk);
    return ['ok' => false, 'reason' => 'Un paiement du tournoi est déjà en cours (autre onglet ?). Attendez qu’il finisse.'];
  }
  $paid = 0; $sum = 0.0; $skipped = 0; $errors = []; $done = []; $mailFailed = [];
  try {
    foreach ($plan['rows'] as $r) {
      if ($r['state'] !== 'todo') { $skipped++; continue; }
      if ($limit > 0 && $paid >= $limit) break;
      $uid = $r['uid'];
      $amt = (float) $r['amount'];
      // Réservation dans le registre AVANT de payer (relu sous verrou : déjà payé entre-temps → on saute).
      $go = admin_top_paid_with($key, static function (array &$led) use ($uid, $r, $amt): bool {
        $e = $led[$uid] ?? null;
        if (is_array($e) && (!empty($e['ok']) || !empty($e['pending']))) return false;
        $led[$uid] = ['rank' => $r['rank'], 'amount' => $amt, 'at' => date('c'), 'ok' => false, 'pending' => true];
        return true;
      });
      if (!$go) { $skipped++; continue; }
      $motif = 'Bonus tournoi démo — semaine ' . $key . ' — rang ' . $r['rank'];
      $GLOBALS['OROLADO_NOTIFY_LAST'] = null;
      try {
        $res = $pay($r['payId'], $amt, $motif, ['email' => $r['email'], 'publicId' => $r['publicId']]);
      } catch (Throwable $e) {
        // Plantage pendant le crédit : on ne sait pas s'il est passé → la ligne reste « à vérifier » (jamais repayée seule).
        $errors[] = ['rank' => $r['rank'], 'id' => $r['id'], 'email' => $r['email'], 'amount' => $amt,
          'reason' => 'Erreur pendant le paiement (' . $e->getMessage() . ') : vérifiez le solde du joueur, puis marquez-le payé'];
        break;
      }
      $ok = is_array($res) && !empty($res['ok']);
      $reason = $ok ? '' : (string) (is_array($res) ? ($res['reason'] ?? 'Échec') : 'Échec');
      // E-mail au joueur (le même que pour un crédit à la main, envoyé par admin_credit_player) : noté, jamais bloquant.
      $nl = $GLOBALS['OROLADO_NOTIFY_LAST'] ?? null;
      $mail = $ok ? (is_array($nl) ? (string) ($nl['mail'] ?? 'none') : 'none') : '';
      admin_top_paid_with($key, static function (array &$led) use ($uid, $r, $amt, $ok, $reason, $mail): void {
        $led[$uid] = ['rank' => $r['rank'], 'amount' => $amt, 'at' => date('c'), 'ok' => $ok] + ($ok ? ['mail' => $mail] : ['error' => $reason]);
      });
      if ($ok && $mail === 'failed') $mailFailed[] = $r['rank'];
      if (!$ok) {
        $errors[] = ['rank' => $r['rank'], 'id' => $r['id'], 'email' => $r['email'], 'amount' => $amt, 'reason' => $reason];
        break; // on s'arrête au premier refus
      }
      $paid++; $sum += $amt;
      $done[] = ['rank' => $r['rank'], 'id' => $r['id'], 'amount' => $amt];
    }
  } finally {
    flock($lk, LOCK_UN);
    fclose($lk);
  }
  if (function_exists('admin_bust_cache')) admin_bust_cache();
  $left = admin_top_pay_plan($db ?? load_db(), $p);
  return [
    'ok' => !$errors, 'week' => $key, 'paid' => $paid, 'total' => round($sum, 2), 'skipped' => $skipped, 'errors' => $errors,
    'done' => $done, 'remaining' => (int) ($left['count'] ?? 0), 'remainingTotal' => (float) ($left['total'] ?? 0),
    'more' => !$errors && (int) ($left['count'] ?? 0) > 0, 'mailFailed' => $mailFailed,
    'reason' => $errors ? ('Arrêt au rang ' . $errors[0]['rank'] . ' (' . $errors[0]['id'] . ') : ' . $errors[0]['reason']) : '',
  ];
}

/** Marque des rangs comme « déjà payés à la main » (sans rien verser) : ils ne seront jamais payés par le bouton. */
function admin_top_pay_mark(array $req, ?array $db = null): array {
  $week = (string) ($req['week'] ?? 'cur') === 'prev' ? 'prev' : 'cur';
  $ranks = array_values(array_unique(array_filter(array_map('intval', (array) ($req['ranks'] ?? [])), static fn($n) => $n >= 1)));
  if (!$ranks) return ['ok' => false, 'reason' => 'Aucun rang à marquer'];
  $db = $db ?? load_db();
  $wk = admin_top_pay_week($week);
  $byRank = [];
  foreach (orolado_top_rank($db, orolado_top_scan($db, $wk)) as $r) $byRank[(int) $r['rank']] = (string) $r['uid'];
  $marked = []; $already = []; $missing = [];
  admin_top_paid_with($wk['key'], static function (array &$led) use ($ranks, $byRank, &$marked, &$already, &$missing): void {
    foreach ($ranks as $n) {
      $uid = $byRank[$n] ?? '';
      if ($uid === '') { $missing[] = $n; continue; }
      $e = $led[$uid] ?? null;
      if (is_array($e) && !empty($e['ok'])) { $already[] = $n; continue; }
      $led[$uid] = ['rank' => $n, 'amount' => 0, 'at' => date('c'), 'ok' => true, 'manual' => true]
        + (is_array($e) && !empty($e['pending']) ? ['wasPending' => true] : []);
      $marked[] = $n;
    }
  });
  if (function_exists('admin_bust_cache')) admin_bust_cache();
  return ['ok' => true, 'week' => $wk['key'], 'marked' => $marked, 'already' => $already, 'missing' => $missing];
}

/* -------------------------------------------------------------------------------------------------------------------
 * 2026-10-22 (propriétaire) — « 🎁 Bonus à tous » : le même petit bonus (ex. 0,20 $) à TOUS les joueurs, par le même
 * crédit que « Ajuster » (admin_credit_player : solde réel + e-mail « Vous avez reçu … » dans sa langue).
 * Registre data/bonus_all_<jour>-<cents>.json : un même jour, un même montant n'est JAMAIS versé deux fois au même joueur
 * (double clic, page rechargée, deux onglets). Exclus : comptes de la maison / admin, suspendus, bannis, supprimés.
 * ------------------------------------------------------------------------------------------------------------------- */
const ADMIN_ALL_PAY_MAX = 5.0;

function admin_all_paid_file(string $key): string {
  return rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'bonus_all_' . preg_replace('/[^0-9-]/', '', $key) . '.json';
}

function admin_all_pay_params(array $req, ?int $now = null): array {
  $raw = str_replace(',', '.', trim((string) ($req['amount'] ?? '')));
  if ($raw === '' || !is_numeric($raw)) return ['ok' => false, 'reason' => 'Montant invalide'];
  $amt = round((float) $raw, 2);
  if ($amt < 0.01) return ['ok' => false, 'reason' => 'Le montant doit être d’au moins 0,01 $'];
  if ($amt > ADMIN_ALL_PAY_MAX) return ['ok' => false, 'reason' => 'Montant trop grand (5 $ au plus par joueur)'];
  return ['ok' => true, 'amount' => $amt, 'key' => gmdate('Ymd', $now ?? time()) . '-' . (int) round($amt * 100)];
}

/** Joueurs à qui verser : [['id' => uuid, 'email', 'name', 'publicId']] ; $players = liste des profils (admin_profiles()). */
function admin_all_pay_players(array $players, callable $isHouse): array {
  $out = []; $seen = [];
  foreach ($players as $p) {
    if (!is_array($p)) continue;
    $id = (string) ($p['id'] ?? '');
    if (!preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $id) || isset($seen[$id])) continue;
    if (in_array(strtolower((string) ($p['role'] ?? '')), ['suspended', 'banned', 'deleted', 'admin'], true)) continue;
    $em = strtolower(trim((string) ($p['email'] ?? '')));
    if ($em !== '' && function_exists('orolado_is_reserved_admin_email') && orolado_is_reserved_admin_email($em)) continue;
    if ($isHouse($id, $p)) continue;
    $seen[$id] = 1;
    $out[] = ['id' => $id, 'email' => $em, 'name' => trim((string) ($p['name'] ?? '')), 'publicId' => (string) ($p['publicId'] ?? '')];
  }
  return $out;
}

/** Aperçu : combien de joueurs, total, déjà payés aujourd'hui avec ce montant. */
function admin_all_pay_preview(array $req, array $players, ?int $now = null): array {
  $p = admin_all_pay_params($req, $now);
  if (empty($p['ok'])) return $p;
  $led = admin_gift_json(admin_all_paid_file($p['key']));
  $todo = 0; $paid = 0; $check = 0; $mail = 0;
  foreach ($players as $r) {
    $e = $led[$r['id']] ?? null;
    if (is_array($e) && !empty($e['pending'])) $check++;
    elseif (is_array($e) && !empty($e['ok'])) $paid++;
    else { $todo++; if ($r['email'] !== '') $mail++; }
  }
  return ['ok' => true, 'key' => $p['key'], 'amount' => $p['amount'], 'players' => count($players), 'count' => $todo, 'withMail' => $mail,
    'total' => round($todo * $p['amount'], 2), 'already' => $paid, 'check' => $check];
}

/**
 * Verse, un par un, au plus $limit joueurs (l'écran rappelle tant que « more »). Réservation dans le registre AVANT le
 * crédit ; plantage pendant le crédit → « à vérifier », jamais reversé tout seul. S'arrête au premier refus.
 */
function admin_all_pay_run(array $req, array $players, callable $pay, int $limit = 5, ?int $now = null, int $maxSec = 20): array {
  if ((string) ($req['confirm'] ?? '') !== 'PAYER') return ['ok' => false, 'reason' => 'Confirmation manquante : tapez PAYER'];
  $p = admin_all_pay_params($req, $now);
  if (empty($p['ok'])) return $p;
  $key = $p['key']; $amt = $p['amount']; $file = admin_all_paid_file($key);
  $lk = @fopen($file . '.run.lock', 'c');
  if (!$lk || !flock($lk, LOCK_EX | LOCK_NB)) {
    if ($lk) fclose($lk);
    return ['ok' => false, 'busy' => true, 'reason' => 'Un envoi du bonus est déjà en cours (autre onglet ?). Attendez qu’il finisse.'];
  }
  $paid = 0; $errors = []; $mailFailed = 0; $t0 = microtime(true);
  try {
    foreach ($players as $r) {
      if ($paid >= $limit || microtime(true) - $t0 > $maxSec) break;
      $uid = $r['id'];
      $go = admin_gift_led_with($file, static function (array &$led) use ($uid, $amt): bool {
        if (isset($led[$uid])) return false;
        $led[$uid] = ['amount' => $amt, 'at' => date('c'), 'ok' => false, 'pending' => true];
        return true;
      });
      if (!$go) continue;
      $GLOBALS['OROLADO_NOTIFY_LAST'] = null;
      try {
        $res = $pay($uid, $amt, 'Bonus offert à tous', ['email' => $r['email'], 'publicId' => $r['publicId']]);
      } catch (Throwable $e) {
        $errors[] = ['id' => $uid, 'email' => $r['email'], 'reason' => 'Erreur pendant le crédit (' . $e->getMessage() . ') : vérifiez le solde du joueur'];
        break;
      }
      $ok = is_array($res) && !empty($res['ok']);
      $reason = $ok ? '' : (string) (is_array($res) ? ($res['reason'] ?? 'Échec') : 'Échec');
      $nl = $GLOBALS['OROLADO_NOTIFY_LAST'] ?? null;
      $mail = $ok ? (is_array($nl) ? (string) ($nl['mail'] ?? 'none') : 'none') : '';
      admin_gift_led_with($file, static function (array &$led) use ($uid, $amt, $ok, $reason, $mail): void {
        if ($ok) $led[$uid] = ['amount' => $amt, 'at' => date('c'), 'ok' => true, 'mail' => $mail];
        else unset($led[$uid]); // refusé (rien versé) : pourra être retenté
      });
      if (!$ok) { $errors[] = ['id' => $uid, 'email' => $r['email'], 'reason' => $reason]; break; }
      if ($mail === 'failed') $mailFailed++;
      $paid++;
    }
  } finally {
    flock($lk, LOCK_UN);
    fclose($lk);
  }
  if (function_exists('admin_bust_cache')) admin_bust_cache();
  $left = admin_all_pay_preview($req, $players, $now);
  return ['ok' => !$errors, 'paid' => $paid, 'total' => round($paid * $amt, 2), 'mailFailed' => $mailFailed, 'errors' => $errors,
    'remaining' => (int) ($left['count'] ?? 0), 'more' => !$errors && (int) ($left['count'] ?? 0) > 0,
    'reason' => $errors ? ('Arrêt (' . ($errors[0]['email'] ?: $errors[0]['id']) . ') : ' . $errors[0]['reason']) : ''];
}

/*
 * Envoi EN ARRIÈRE-PLAN (propriétaire : « je ne peux pas rester sur la page ») : l'admin lance, peut fermer la page.
 * data/bonus_all_job.json garde l'envoi en cours ; le serveur s'appelle lui-même (127.0.0.1, jeton secret de l'envoi)
 * par paquets de ~15 s jusqu'à la fin. Si la chaîne s'arrête (redémarrage…), la page admin la relance (état > 60 s).
 */
function admin_all_job_file(): string {
  return rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'bonus_all_job.json';
}
function admin_all_job_read(): array { return admin_gift_json(admin_all_job_file()); }
function admin_all_job_update(callable $fn) { return admin_gift_led_with(admin_all_job_file(), $fn); }

/** Nouvel envoi (refusé si un autre tourne encore). */
function admin_all_job_start(array $req, string $adminUid, string $adminEmail, ?int $now = null): array {
  if ((string) ($req['confirm'] ?? '') !== 'PAYER') return ['ok' => false, 'reason' => 'Confirmation manquante : tapez PAYER'];
  $p = admin_all_pay_params($req, $now);
  if (empty($p['ok'])) return $p;
  $now = $now ?? time();
  $token = bin2hex(random_bytes(16));
  $busy = admin_all_job_update(static function (array &$j) use ($p, $now, $token, $adminUid, $adminEmail): bool {
    if (!empty($j['active']) && (int) ($j['lastAt'] ?? 0) > $now - 120) return true;
    $j = ['key' => $p['key'], 'amount' => $p['amount'], 'token' => $token, 'active' => true, 'uid' => $adminUid, 'by' => $adminEmail,
      'startedAt' => $now, 'lastAt' => $now, 'paid' => 0, 'total' => 0.0, 'mailFailed' => 0, 'reason' => '', 'finishedAt' => 0];
    return false;
  });
  if ($busy) return ['ok' => false, 'reason' => 'Un envoi du bonus est déjà en cours. Attendez qu’il finisse (ou mettez-le en pause).'];
  if (function_exists('orolado_bonus_all_marker')) @touch(orolado_bonus_all_marker());
  return ['ok' => true, 'token' => $token];
}

/** État pour la page (sans le jeton). */
function admin_all_job_status(): array {
  $j = admin_all_job_read();
  if (!$j) return ['job' => false];
  unset($j['token'], $j['uid']);
  // compteur en direct : lu dans le registre (avance joueur par joueur, pas seulement à la fin d'un paquet)
  $led = admin_gift_json(admin_all_paid_file((string) ($j['key'] ?? '')));
  $ok = 0; foreach ($led as $e) if (is_array($e) && !empty($e['ok'])) $ok++;
  $j['paid'] = max((int) ($j['paid'] ?? 0), $ok);
  $j['total'] = round(max((float) ($j['total'] ?? 0), $ok * (float) ($j['amount'] ?? 0)), 2);
  return ['job' => true] + $j;
}

/** Un paquet en arrière-plan ; renvoie 'next' (relancer), 'busy', 'done', 'stop' ou 'bad'. */
function admin_all_job_step(string $token, array $players, callable $pay, ?int $now = null): string {
  $j = admin_all_job_read();
  if (!$j || empty($j['active']) || !hash_equals((string) ($j['token'] ?? ''), $token)) return 'bad';
  admin_all_job_update(static function (array &$x) use ($token): void { if (hash_equals((string) ($x['token'] ?? ''), $token)) $x['lastAt'] = time(); });
  if (function_exists('orolado_bonus_all_marker')) @touch(orolado_bonus_all_marker());
  $r = admin_all_pay_run(['amount' => (string) $j['amount'], 'confirm' => 'PAYER'], $players, $pay, 200, $now, 15);
  if (!empty($r['busy'])) return 'busy';
  $out = 'next';
  admin_all_job_update(static function (array &$x) use ($token, $r, &$out): void {
    if (!hash_equals((string) ($x['token'] ?? ''), $token)) { $out = 'bad'; return; }
    $x['paid'] = (int) ($x['paid'] ?? 0) + (int) $r['paid'];
    $x['total'] = round((float) ($x['total'] ?? 0) + (float) $r['total'], 2);
    $x['mailFailed'] = (int) ($x['mailFailed'] ?? 0) + (int) $r['mailFailed'];
    $x['remaining'] = (int) $r['remaining'];
    $x['lastAt'] = time();
    if (empty($r['ok'])) { $x['active'] = false; $x['reason'] = 'Arrêt : ' . (string) $r['reason']; $out = 'stop'; }
    elseif (empty($r['more'])) { $x['active'] = false; $x['finishedAt'] = time(); $x['reason'] = 'Terminé : tout le monde a reçu.'; $out = 'done'; }
    elseif (empty($x['active'])) $out = 'stop'; // mis en pause pendant le paquet
  });
  if (function_exists('orolado_bonus_all_marker')) { if ($out === 'next') @touch(orolado_bonus_all_marker()); elseif ($out !== 'busy') @unlink(orolado_bonus_all_marker()); }
  return $out;
}
