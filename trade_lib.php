<?php
declare(strict_types=1);

/**
 * OROLADO — passage et règlement des trades (jeu équitable).
 *
 * Règles de l'argent (réel) :
 *   - MOINS : la mise est retirée UNE fois, à l'ouverture, par la base (debit_real : refuse si solde
 *     insuffisant, jamais de solde négatif). Un fichier marqueur empêche un 2e débit sur un retry.
 *   - PLUS  : au règlement, gain (mise × cote) ou mise rendue (égalité) crédités UNE fois par la base
 *     (resolve_trade : la clé orderId bloque tout 2e crédit, même simultané).
 *   - Perte : rien à faire, la mise est déjà partie.
 * Aucune écriture « valeur absolue » du solde ici : uniquement des + et − atomiques.
 *
 * Le résultat ne vient JAMAIS du navigateur : le serveur lit le prix d'expiration dans son flux.
 */

require_once __DIR__ . '/feed_lib.php';

const OROLADO_UUID_RE = '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i';

function orolado_trade_rpc(string $fn, array $args): ?array {
  // Tests locaux uniquement (scripts/test-trades.php) : fausse caisse, jamais en ligne.
  if (PHP_SAPI === 'cli' && isset($GLOBALS['OROLADO_FAKE_RPC']) && is_callable($GLOBALS['OROLADO_FAKE_RPC'])) {
    return ($GLOBALS['OROLADO_FAKE_RPC'])($fn, $args);
  }
  $hdrs = supabase_admin_headers();
  $url = rtrim(supabase_project_url(), '/');
  if (!$hdrs || $url === '') return null;
  $res = supabase_http($url . '/rest/v1/rpc/' . $fn, $hdrs, json_encode($args, JSON_PRESERVE_ZERO_FRACTION), 'POST');
  if (is_array($res) && isset($res[0]) && is_array($res[0])) $res = $res[0];
  return is_array($res) ? $res : null;
}

/**
 * Retire la mise une seule fois. Retour : ['ok' => true, 'real' => solde après]
 * ou ['ok' => false, 'reason' => 'insufficient'|'unavailable'].
 */
function orolado_trade_debit(string $payId, string $orderId, float $stake): array {
  $stake = orolado_money($stake);
  if ($stake <= 0 || $orderId === '' || !preg_match(OROLADO_UUID_RE, $payId)) {
    return ['ok' => false, 'reason' => 'unavailable'];
  }
  $dir = orolado_data_dir() . '/stakes';
  if (!is_dir($dir)) @mkdir($dir, 0755, true);
  $key = hash('sha256', $payId . '|' . $orderId);
  $marker = $dir . '/' . $key . '.ok';
  $fp = @fopen($dir . '/' . $key . '.lock', 'c');
  if (!$fp || !flock($fp, LOCK_EX)) {
    if ($fp) fclose($fp);
    return ['ok' => false, 'reason' => 'unavailable'];
  }
  try {
    if (is_file($marker)) {
      $meta = json_decode((string) @file_get_contents($marker), true);
      // 'duplicate' : CETTE demande n'a rien débité (la mise a été prise par une autre demande du même ordre).
      return ['ok' => true, 'real' => orolado_money($meta['real'] ?? 0), 'duplicate' => true, 'refunded' => !empty($meta['refunded'])];
    }
    $rpc = orolado_trade_rpc('debit_real', ['p_user' => $payId, 'p_amount' => $stake]);
    if (!$rpc) return ['ok' => false, 'reason' => 'unavailable'];
    if (empty($rpc['ok'])) {
      return ['ok' => false, 'reason' => (($rpc['reason'] ?? '') === 'insufficient') ? 'insufficient' : 'unavailable'];
    }
    $real = orolado_money($rpc['real'] ?? 0);
    @file_put_contents($marker, json_encode(['at' => date('c'), 'stake' => $stake, 'real' => $real]));
    return ['ok' => true, 'real' => $real];
  } finally {
    flock($fp, LOCK_UN);
    fclose($fp);
  }
}

/** Note sur le marqueur de débit que la mise de cet ordre a été rendue (une demande répétée ne la reprend pas). */
function orolado_trade_debit_mark_refunded(string $payId, string $orderId): void {
  $dir = orolado_data_dir() . '/stakes';
  $key = hash('sha256', $payId . '|' . $orderId);
  $marker = $dir . '/' . $key . '.ok';
  $fp = @fopen($dir . '/' . $key . '.lock', 'c');
  if (!$fp || !flock($fp, LOCK_EX)) {
    if ($fp) fclose($fp);
    return;
  }
  try {
    $meta = is_file($marker) ? json_decode((string) @file_get_contents($marker), true) : null;
    if (!is_array($meta)) $meta = [];
    $meta['refunded'] = date('c');
    @file_put_contents($marker, json_encode($meta));
  } finally {
    flock($fp, LOCK_UN);
    fclose($fp);
  }
}

/**
 * Clé « une seule fois » d'un trade réel dans Supabase (trade_settlements.order_id est UNIQUE pour TOUS les
 * joueurs, et l'id d'ordre est choisi par le téléphone) : rangée par joueur, pour qu'aucun id choisi ne puisse
 * occuper la clé d'un autre crédit (dépôt « dep_… », retrait « wdr_… », trade d'un autre joueur…).
 * $kind : 'trs' règlement, 'trr' mise rendue (ordre non enregistré), 'trd' mise rendue (débit en double).
 * Les ordres ouverts AVANT ce changement n'ont pas de 'settleKey' et se règlent toujours avec leur id (une fois).
 */
function orolado_trade_key(string $kind, string $payId, string $oid): string {
  return $kind . '_' . substr(hash('sha256', strtolower($payId)), 0, 16) . '_' . $oid;
}

/**
 * Crédite une seule fois par clé (gain, égalité, remboursement). Montant 0 = marque juste réglé.
 * Retour : solde réel après, ou null si la base ne répond pas (on réessaiera plus tard).
 */
function orolado_trade_credit_once(string $payId, string $key, float $amount): ?float {
  if ($key === '' || !preg_match(OROLADO_UUID_RE, $payId)) return null;
  $rpc = orolado_trade_rpc('resolve_trade', ['p_user' => $payId, 'p_order' => $key, 'p_amount' => orolado_money(max(0, $amount))]);
  if (!$rpc || empty($rpc['ok'])) return null;
  return orolado_money($rpc['real'] ?? 0);
}

function orolado_trade_find(array $db, string $uid, string $oid): ?array {
  foreach (($db['orders'] ?? []) as $o) {
    if (is_array($o) && ($o['id'] ?? '') === $oid && ($o['userId'] ?? '') === $uid) return $o;
  }
  return null;
}

/** Vue publique d'un ordre (ce que le navigateur reçoit). */
function orolado_trade_public(array $o): array {
  $tickMs = OROLADO_TICK_MS;
  $st = (string) ($o['status'] ?? 'open');
  $out = [
    'id' => (string) ($o['id'] ?? ''),
    'assetId' => (string) ($o['assetId'] ?? ''),
    'side' => (($o['side'] ?? '') === 'put') ? 'put' : 'call',
    'stake' => orolado_money($o['stake'] ?? 0),
    'payout' => (float) ($o['payout'] ?? 1.88),
    'duration' => (int) ($o['duration'] ?? 10),
    'mode' => (($o['mode'] ?? 'demo') === 'real') ? 'real' : 'demo',
    'status' => $st,
    'entryPrice' => isset($o['entryCents']) ? ((int) $o['entryCents']) / 100 : (float) ($o['openPrice'] ?? 0),
    'barrier' => isset($o['barrierCents']) ? ((int) $o['barrierCents']) / 100 : null,
    'entryTick' => isset($o['entryTick']) ? (int) $o['entryTick'] : null,
    'expiryTick' => isset($o['expiryTick']) ? (int) $o['expiryTick'] : null,
    'startTime' => isset($o['entryTick']) ? ((int) $o['entryTick']) * $tickMs : (int) round(((float) ($o['openedAt'] ?? $o['at'] ?? 0)) * 1000),
    'expiryTime' => isset($o['expiryTick']) ? ((int) $o['expiryTick']) * $tickMs : (int) round(((float) ($o['expiryAt'] ?? 0)) * 1000),
    'settled' => $st !== 'open',
  ];
  if ($st !== 'open') {
    $out['won'] = $st === 'won';
    $out['voided'] = $st === 'void';
    $out['net'] = orolado_money($o['net'] ?? 0);
    $out['exitPrice'] = isset($o['exitCents']) ? ((int) $o['exitCents']) / 100 : (isset($o['closePrice']) ? (float) $o['closePrice'] : null);
  }
  return $out;
}

/** Gains potentiels (mise × cote) des trades réels encore ouverts. */
function orolado_trade_exposure(array $db, string $assetId = '', string $uid = ''): float {
  $sum = 0.0;
  foreach (($db['orders'] ?? []) as $o) {
    if (!is_array($o) || ($o['status'] ?? '') !== 'open' || ($o['mode'] ?? '') !== 'real') continue;
    if ($assetId !== '' && ($o['assetId'] ?? '') !== $assetId) continue;
    if ($uid !== '' && ($o['userId'] ?? '') !== $uid) continue;
    $sum += orolado_money($o['stake'] ?? 0) * (float) ($o['payout'] ?? 1.88);
  }
  return $sum;
}

/**
 * Ouvre un trade. $req = données du navigateur (mise, sens, durée, actif, cote, id, mode).
 * Le prix d'entrée et la ligne objectif sont décidés ICI, jamais par le navigateur.
 */
/** v2359 : prix du clic accepté jusqu'à 1,5 s en arrière (6 prix de 250 ms). */
if (!defined('OROLADO_CLICK_MAX_TICKS')) define('OROLADO_CLICK_MAX_TICKS', 12); // 2026-10-19 (propriétaire) : 3 s, le trade reste TOUJOURS au clic
/**
 * v2654 : prix du clic accordé seulement après 30 clics mesurés sans comportement de robot.
 * 2026-10-19 : ne sert plus qu'à la DÉMO. En RÉEL, le prix d'entrée est TOUJOURS le prix à l'arrivée de l'ordre
 * (un script choisissait le meilleur des 6 derniers prix comme « prix du clic » : 117 % à 162 % de retour).
 */
if (!defined('OROLADO_CLICK_TRUST_AFTER')) define('OROLADO_CLICK_TRUST_AFTER', 30);
/**
 * 2026-10-19 (propriétaire : « là où il a appuyé, c'est là que ça prend ») : en RÉEL, le prix du clic revient, borné :
 *  - au plus 2 prix (0,5 s) avant l'arrivée de l'ordre (avant : 6 prix au choix = la faille du « meilleur des 6 ») ;
 *  - mise ≤ OROLADO_CLICK_REAL_MAX_STAKE (au-delà : prix d'arrivée) : ce qu'un script peut gagner avant d'être repéré
 *    reste petit (mesuré : « meilleur de 2 prix » = 102 % à 116 % de retour, ×50 5 s) ;
 *  - repérage robot plus sévère en réel (z ≥ 3 dès 8 « bons sens », soit ~10 trades pour un script) : le compte repasse
 *    au prix d'arrivée. Un joueur honnête (moitié-moitié) n'est presque jamais touché, et même alors il garde un jeu
 *    exactement équitable (prix d'arrivée).
 */
if (!defined('OROLADO_CLICK_REAL_TICKS')) define('OROLADO_CLICK_REAL_TICKS', 2);
if (!defined('OROLADO_CLICK_REAL_MAX_STAKE')) define('OROLADO_CLICK_REAL_MAX_STAKE', 20);

/** RÉEL : prix du clic accordé ? (score réel clickFav / clickUnfav du compte, seuil plus sévère que l'étiquette admin) */
function orolado_click_real_trusted(array $row, array $me): bool {
  foreach ([$row, $me] as $u) {
    $fav = (int) ($u['clickFav'] ?? 0);
    $unfav = (int) ($u['clickUnfav'] ?? 0);
    $n = $fav + $unfav;
    if ($fav >= 8 && $n > 0 && ($fav - $unfav) / sqrt($n) >= 3.0) return false;
  }
  return true;
}

/**
 * DÉMO seulement : prix du clic accordé ? Compteurs DÉMO à part (clickFavDemo / clickUnfavDemo) : la démo ne
 * compte plus dans le score robot du compte (admin, retraits) ni dans quoi que ce soit du réel. Les anciens
 * compteurs (clickFav / clickUnfav, qui mélangeaient démo et réel avant ce changement) comptent dans le
 * nombre de clics vus, pour que les joueurs déjà « connus » gardent le prix du clic en démo.
 */
function orolado_click_demo_trusted(array $row, array $me): bool {
  $demo = ['clickFav' => (int) ($row['clickFavDemo'] ?? 0), 'clickUnfav' => (int) ($row['clickUnfavDemo'] ?? 0)];
  // 2026-10-19 : plus d'attente de 30 clics (les nouveaux joueurs voyaient le trait sauter) ; seul un robot repéré perd le prix du clic.
  return orolado_click_edge_reason($demo) === ''
    && orolado_click_edge_reason($row) === '' && orolado_click_edge_reason($me) === '';
}

/**
 * v2359 : comportement de robot. Entre le clic et l'arrivée de l'ordre, le prix a souvent déjà bougé :
 * un joueur honnête a choisi son sens AVANT ce mouvement, il tombe juste ~1 fois sur 2 (clickFav ≈ clickUnfav).
 * Un robot qui lit les prix en direct choisit le sens APRÈS l'avoir vu et prétend avoir cliqué avant :
 * il tombe juste bien plus souvent. v2361 : vrai calcul de probabilité (écart en « sigmas » :
 * (bon sens − mauvais sens) / √total ≥ 4,5). Mesuré : toutes les habitudes humaines (hasard, suivre ou
 * contrer la tendance, toujours acheter…) donnent 50,0 % sur 600 000 prix réels ; 0 humain sur 20 000
 * marqué à tort après 3 000 trades chacun ; robot attrapé après ~34 trades, ~133 s'il ne triche qu'une
 * fois sur deux, ~500 une fois sur quatre. Simple étiquette pour l'admin : ne bloque rien.
 * Renvoie la raison (texte) ou ''.
 */
function orolado_click_edge_reason(array $u): string {
  $fav = (int) ($u['clickFav'] ?? 0);
  $unfav = (int) ($u['clickUnfav'] ?? 0);
  $n = $fav + $unfav;
  if ($fav < 12 || $n <= 0) return '';
  $z = ($fav - $unfav) / sqrt($n);
  if ($z >= 4.5) {
    return 'Robot probable : choisit trop souvent le sens que le prix a déjà pris depuis son clic (' . $fav . ' fois contre ' . $unfav . ' ; un humain fait moitié-moitié)';
  }
  return '';
}

/**
 * 2026-10-20 (propriétaire : « une vraie solution, comme les grandes plateformes ») — même mesure, mais PONDÉRÉE PAR LA MISE.
 * Un robot malin joue honnêtement de petites mises (score par trade « normal ») et ne triche que sur les grosses : ici
 * chaque trade compte pour sa mise. clickW = Σ(+mise si « fav », −mise si « unfav »), clickW2 = Σ mise², clickWn = nombre.
 * Écart en sigmas : clickW / √clickW2. Pour un humain (sens choisi avant le mouvement), quelle que soit la façon de miser,
 * la probabilité d'atteindre 4,5 est < 1 sur 25 000 (inégalité de Hoeffding) ; le robot qui triche sur les grosses mises
 * y arrive vite. Renvoie la raison (texte) ou ''.
 */
function orolado_click_edge_weighted(array $u): string {
  $w = (float) ($u['clickW'] ?? 0);
  $w2 = (float) ($u['clickW2'] ?? 0);
  $n = (int) ($u['clickWn'] ?? 0);
  if ($n < 12 || $w <= 0 || $w2 <= 0) return '';
  $z = $w / sqrt($w2);
  if ($z >= 4.5) {
    return 'Robot probable (mises pondérées) : ses GROSSES mises tombent trop souvent dans le sens que le prix a déjà pris depuis son clic (écart ' . number_format($z, 1, ',', '') . ' ; un humain reste proche de 0)';
  }
  return '';
}

/** Robot repéré par l'une OU l'autre mesure (par trade, ou pondérée par la mise). */
function orolado_click_robot_reason(array $u): string {
  $why = orolado_click_edge_reason($u);
  return $why !== '' ? $why : orolado_click_edge_weighted($u);
}

/**
 * 2026-10-20 — MODE TEST (accord du propriétaire : d'abord sur son compte). La mesure pondérée est enregistrée pour TOUS
 * les comptes réels et affichée dans l'admin (étiquette, retraits « ⚠️ » à vérifier) ; mais elle ne retire le prix du clic
 * qu'aux comptes ADMIN tant que le propriétaire ne l'a pas validée. Pour l'activer pour tout le monde : mettre
 * OROLADO_ROBOT_W_ALL à true (après son accord).
 */
if (!defined('OROLADO_ROBOT_W_ALL')) define('OROLADO_ROBOT_W_ALL', false);
function orolado_click_weighted_applies(array $u): bool {
  return OROLADO_ROBOT_W_ALL || strtolower((string) ($u['role'] ?? '')) === 'admin';
}
/** Prix du clic refusé (réel) : robot par trade (tous), ou pondéré (tous si validé, sinon comptes admin seulement). */
function orolado_click_real_blocked(array $u): bool {
  if (orolado_click_edge_reason($u) !== '') return true;
  return orolado_click_weighted_applies($u) && orolado_click_edge_weighted($u) !== '';
}

/**
 * Réponse à une demande en double (même ordre, mise déjà prise par une autre demande) : renvoie l'ordre déjà
 * enregistré, en l'attendant un court instant si l'autre demande est encore en train de l'écrire. Ne débite,
 * ne crédite et n'écrit RIEN.
 */
function orolado_trade_place_duplicate(string $uid, string $oid, bool $refunded): array {
  if ($refunded) return ['ok' => false, 'duplicate' => true, 'reason' => 'Ordre non enregistré, mise rendue'];
  $waitMs = (int) (defined('OROLADO_DUP_WAIT_MS') ? OROLADO_DUP_WAIT_MS : 2500);
  $until = microtime(true) + $waitMs / 1000;
  do {
    $o = orolado_trade_find(load_db(), $uid, $oid);
    if ($o) return ['ok' => true, 'duplicate' => true, 'order' => orolado_trade_public($o)];
    if (microtime(true) >= $until) break;
    usleep(100000);
  } while (true);
  return ['ok' => false, 'duplicate' => true, 'pending' => true, 'reason' => 'Ordre déjà en cours d’enregistrement, vérifiez vos trades ouverts'];
}

/** seenTick acceptable : récent (au plus OROLADO_CLICK_MAX_TICKS avant l'arrivée), jamais dans le futur. */
function orolado_click_tick_ok(int $seenTick, int $arrivalTick): bool {
  return $seenTick > 0 && $seenTick < $arrivalTick && $seenTick >= $arrivalTick - OROLADO_CLICK_MAX_TICKS;
}

/**
 * Choix du prix d'entrée (fonction pure, testée par scripts/test-trade-exploits.php).
 * Prix du clic si $demoTrusted (= compte sans comportement de robot) et seenTick valable ; en RÉEL, seenTick au plus
 * OROLADO_CLICK_REAL_TICKS avant l'arrivée. Sinon : prix et tick d'ARRIVÉE. 'move' = mesure anti-robot ('fav' / 'unfav' / '').
 */
function orolado_trade_pick_entry(string $mode, string $side, int $arrivalTick, int $arrivalCents, int $seenTick, ?int $seenCents, bool $demoTrusted): array {
  $out = ['tick' => $arrivalTick, 'cents' => $arrivalCents, 'lag' => 0, 'move' => ''];
  if (!orolado_click_tick_ok($seenTick, $arrivalTick) || $seenCents === null || $seenCents <= 0) return $out;
  if ($arrivalCents !== $seenCents) {
    $out['move'] = (($side === 'call') === ($arrivalCents > $seenCents)) ? 'fav' : 'unfav';
  }
  // 2026-10-19 (propriétaire : « comme mes jeux fonctionnaient avant ») : réel et démo, même fenêtre que le clic accepté
  // (OROLADO_CLICK_MAX_TICKS, 1,5 s), toutes mises.
  if ($demoTrusted) {
    $out['tick'] = $seenTick;
    $out['cents'] = $seenCents;
    $out['lag'] = $arrivalTick - $seenTick;
  }
  return $out;
}

function orolado_trade_place(array $me, array $req): array {
  $uid = (string) ($me['id'] ?? '');
  $stake = orolado_money($req['stake'] ?? 0);
  $side = (($req['side'] ?? '') === 'put') ? 'put' : 'call';
  $duration = orolado_fair_duration((int) ($req['duration'] ?? 10));
  $mode = (($req['mode'] ?? '') === 'real') ? 'real' : 'demo';
  $payout = orolado_fair_mult((float) ($req['payout'] ?? $req['odds'] ?? 1.88));
  $assetId = orolado_feed_asset_id((string) ($req['assetId'] ?? ''));
  $oid = preg_replace('/[^a-zA-Z0-9_\-.]/', '', (string) ($req['id'] ?? '')) ?? '';
  if ($uid === '' || $oid === '' || strlen($oid) > 64) return ['ok' => false, 'reason' => 'Ordre invalide'];
  if ($assetId === '') return ['ok' => false, 'reason' => 'Actif inconnu'];
  if ($stake < 1) return ['ok' => false, 'reason' => 'Mise minimum : 1 $'];
  $maxPay = orolado_limit_max_payout();
  if ($mode === 'real' && $maxPay > 0 && $stake * $payout > $maxPay + 0.001) {
    $maxStake = floor(($maxPay / $payout) * 100) / 100;
    return ['ok' => false, 'reason' => 'Mise maximum pour cette cote : ' . number_format($maxStake, 2, '.', ' ') . ' $', 'limit' => true];
  }

  $db = load_db();
  $dup = orolado_trade_find($db, $uid, $oid);
  if ($dup) return ['ok' => true, 'duplicate' => true, 'order' => orolado_trade_public($dup)];

  $payId = $uid;
  if ($mode === 'real') {
    $resolved = orolado_balance_uuid($db, $uid);
    // Joueur sans coffre Supabase (inscription miroir ratée) : on le crée maintenant.
    if ($resolved === '' && function_exists('orolado_ensure_balance_uuid')) $resolved = orolado_ensure_balance_uuid($uid);
    if ($resolved !== '') $payId = $resolved;
    if (!preg_match(OROLADO_UUID_RE, $payId)) return ['ok' => false, 'reason' => 'Coffre réel introuvable'];
    $expo = $stake * $payout;
    $lim = orolado_limit_asset_exposure();
    if ($lim > 0 && orolado_trade_exposure($db, $assetId) + $expo > $lim) {
      return ['ok' => false, 'reason' => 'Volume maximum atteint sur cet actif, réessayez dans quelques secondes', 'limit' => true];
    }
    $lim = orolado_limit_user_exposure();
    if ($lim > 0 && orolado_trade_exposure($db, '', $uid) + $expo > $lim) {
      return ['ok' => false, 'reason' => 'Trop de gains potentiels ouverts, attendez la fin d’un trade', 'limit' => true];
    }
  }

  // Prix d'entrée = prix à l'instant où l'ordre est ARRIVÉ sur le serveur (heure notée par PHP
  // à la réception), pas après la lecture du fichier et les appels à la base : avant, plus le
  // serveur était lent, plus le trait se posait loin du clic. Sûr : à cet instant, le joueur
  // ne connaît pas encore le prix suivant.
  $st = orolado_feed_advance($assetId);
  $entryTick = $st['n'];
  $entryCents = $st['c'];
  $arrivedMs = (int) floor((float) ($_SERVER['REQUEST_TIME_FLOAT'] ?? microtime(true)) * 1000);
  $arrivedTick = orolado_feed_tick_at($arrivedMs);
  // Au plus 10 s en arrière (40 ticks) : l'entrée reste collée au clic même si le serveur
  // est lent (2 s faisait sauter l'entrée à l'écran quand le serveur était chargé).
  if ($arrivedTick < $entryTick && $arrivedTick >= $entryTick - 40) {
    $atArrival = orolado_feed_price_at($assetId, $arrivedTick);
    if ($atArrival !== null && $atArrival > 0) {
      $entryTick = $arrivedTick;
      $entryCents = (int) $atArrival;
    }
  }
  // Prix du CLIC (seenTick : numéro du prix que le téléphone affichait au clic, au plus OROLADO_CLICK_MAX_TICKS en
  // arrière, jamais dans le futur).
  // 2026-10-19 (audit, faille d'argent réel) : en RÉEL, le prix d'entrée et l'heure de départ sont TOUJOURS ceux de
  // l'ARRIVÉE de l'ordre. Avant, un compte « de confiance » pouvait envoyer comme seenTick le meilleur des 6 derniers
  // prix (v100 5 s ×1,9 : 117 % de retour ; ×50 : 162 %), et la confiance s'obtenait avec 30 trades DÉMO.
  // Pourquoi pas « le pire des deux (clic, arrivée) » : mesuré, ça fait perdre ~8 points de retour aux joueurs
  // HONNÊTES (94,6 % → 86,8 % sur v100 5 s ×1,9) ; le prix d'arrivée garde le jeu exactement équitable pour eux.
  // Le téléphone affiche l'entrée / la ligne / l'expiration renvoyées par le serveur (Engine.confirmTrade).
  // En DÉMO (pas d'argent) : le prix du clic reste accordé aux comptes sans comportement de robot (rond et ligne
  // au même endroit que le clic, comme avant).
  // Mesure anti-robot : on note si le prix a déjà bougé DANS le sens choisi entre le clic et l'arrivée (fav) ou
  // contre lui (unfav). RÉEL → clickFav / clickUnfav (score robot de l'admin, retraits « suspects »).
  // DÉMO → clickFavDemo / clickUnfavDemo (ne servent qu'au prix du clic en démo, jamais au score du compte).
  $arrivalTick = $entryTick;
  $arrivalCents = $entryCents;
  $seenTick = (isset($req['seenTick']) && is_numeric($req['seenTick'])) ? (int) $req['seenTick'] : 0;
  $seenCents = null;
  if (orolado_click_tick_ok($seenTick, $arrivalTick)) {
    $p = orolado_feed_price_at($assetId, $seenTick);
    if ($p !== null && $p > 0) $seenCents = (int) $p;
  }
  $meRow = (isset($db['users'][$uid]) && is_array($db['users'][$uid])) ? $db['users'][$uid] : $me;
  // 2026-10-19 (propriétaire) : RÉEL → prix du clic pour tous, toutes mises (seul un compte marqué « robot » dans l'admin ne l'a pas).
  $demoTrusted = $seenCents !== null && ($mode === 'demo'
    ? orolado_click_demo_trusted($meRow, $me)
    : (!orolado_click_real_blocked($meRow) && !orolado_click_real_blocked($me)));
  $pick = orolado_trade_pick_entry($mode, $side, $arrivalTick, $arrivalCents, $seenTick, $seenCents, $demoTrusted);
  $entryTick = $pick['tick'];
  $entryCents = $pick['cents'];
  $clickLag = $pick['lag'];
  $clickMove = $pick['move'];
  $expiryTick = $entryTick + intdiv($duration * 1000, OROLADO_TICK_MS);
  $barrierCents = orolado_fair_barrier($assetId, $duration, $side, $payout, $entryCents);

  $realAfter = null;
  if ($mode === 'real') {
    $deb = orolado_trade_debit($payId, $oid, $stake);
    if (empty($deb['ok'])) {
      return ['ok' => false, 'reason' => ($deb['reason'] ?? '') === 'insufficient' ? 'Solde insuffisant' : 'Caisse indisponible, réessayez'];
    }
    if (!empty($deb['duplicate'])) {
      // 2026-10-19 (audit, faille d'argent réel) : la mise de cet ordre a déjà été prise par une AUTRE demande
      // (même id envoyé plusieurs fois en même temps). CETTE demande n'a rien débité : elle ne crée JAMAIS
      // d'ordre (sinon elle pourrait l'enregistrer avec une autre mise / un autre sens que ceux payés) et ne
      // rend JAMAIS rien (avant : « dupref_ » + clé au hasard → +mise par demande en trop, 100 $ → 400 $).
      return orolado_trade_place_duplicate($uid, $oid, !empty($deb['refunded']));
    }
    $realAfter = $deb['real'];
  }

  $now = microtime(true);
  $order = [
    'id' => $oid,
    'userId' => $uid,
    'payId' => $payId,
    'stake' => $stake,
    'side' => $side,
    'duration' => $duration,
    'mode' => $mode,
    'accountType' => $mode,
    'assetId' => $assetId,
    'payout' => $payout,
    'payoutMult' => $payout,
    'entryTick' => $entryTick,
    'entryCents' => $entryCents,
    'expiryTick' => $expiryTick,
    'barrierCents' => $barrierCents,
    'openPrice' => $entryCents / 100,
    'won' => null,
    'status' => 'open',
    'at' => $now,
    'openedAt' => $now,
    'expiryAt' => ($expiryTick * OROLADO_TICK_MS) / 1000,
    'stakeTaken' => $mode === 'real',
    'fair' => 1,
    'clickLag' => $clickLag,
    'arrivalTick' => $arrivalTick,
    'arrivalCents' => $arrivalCents,
  ];
  // Clé de règlement rangée par joueur (voir orolado_trade_key) ; gardée dans l'ordre : elle ne change jamais.
  if ($mode === 'real') $order['settleKey'] = orolado_trade_key('trs', $payId, $oid);
  $placed = with_db_lock(function ($box) use ($order, $uid, $mode, $stake, $realAfter, $clickMove) {
    $locked =& $box->db;
    if (!isset($locked['orders']) || !is_array($locked['orders'])) $locked['orders'] = [];
    foreach ($locked['orders'] as $o) {
      if (is_array($o) && ($o['id'] ?? '') === $order['id'] && ($o['userId'] ?? '') === $uid) {
        return ['ok' => true, 'duplicate' => true, 'order' => $o, 'skip_write' => true];
      }
    }
    if (!isset($locked['vault'][$uid]) || !is_array($locked['vault'][$uid])) {
      $locked['vault'][$uid] = ['demo' => 1000000, 'real' => 0];
    }
    if ($mode === 'demo') {
      $bal = orolado_money($locked['vault'][$uid]['demo'] ?? 0);
      if ($stake > $bal + 0.009) return ['ok' => false, 'reason' => 'Solde insuffisant', 'skip_write' => true];
      $locked['vault'][$uid]['demo'] = orolado_money($bal - $stake);
      // DÉMO : compteurs à part (prix du clic en démo seulement) ; jamais dans le score robot du compte.
      if ($clickMove !== '' && isset($locked['users'][$uid]) && is_array($locked['users'][$uid])) {
        $k = $clickMove === 'fav' ? 'clickFavDemo' : 'clickUnfavDemo';
        $locked['users'][$uid][$k] = (int) ($locked['users'][$uid][$k] ?? 0) + 1;
      }
    } else {
      $locked['vault'][$uid]['real'] = $realAfter;
      if (isset($locked['users'][$uid]) && is_array($locked['users'][$uid])) {
        $u =& $locked['users'][$uid];
        $u['realStakeVolume'] = orolado_money(($u['realStakeVolume'] ?? 0) + $stake);
        $u['totalWageredSinceDeposit'] = $u['realStakeVolume'];
        $u['requiredWagering'] = orolado_money(($u['realDepositTotal'] ?? 0) * 2);
        $u['realTrades'] = (int) ($u['realTrades'] ?? 0) + 1;
        if ($clickMove === 'fav') $u['clickFav'] = (int) ($u['clickFav'] ?? 0) + 1;
        if ($clickMove === 'unfav') $u['clickUnfav'] = (int) ($u['clickUnfav'] ?? 0) + 1;
        if ($clickMove !== '') { // 2026-10-20 : même mesure pondérée par la mise (orolado_click_edge_weighted)
          $u['clickW'] = round((float) ($u['clickW'] ?? 0) + ($clickMove === 'fav' ? $stake : -$stake), 2);
          $u['clickW2'] = round((float) ($u['clickW2'] ?? 0) + $stake * $stake, 2);
          $u['clickWn'] = (int) ($u['clickWn'] ?? 0) + 1;
        }
        if (function_exists('orolado_apply_wager_progress')) orolado_apply_wager_progress($u, $stake);
        unset($u);
      }
    }
    $locked['orders'][] = $order;
    return ['ok' => true, 'order' => $order, 'vault' => $locked['vault'][$uid]];
  });

  // Ici, en réel, CETTE demande a vraiment débité la mise (les doublons sont sortis plus haut, sans rien débiter).
  if (empty($placed['ok'])) {
    // Mise prise par CETTE demande mais ordre non enregistré (fichier impossible à ouvrir) : il n'existe ni dans
    // le JSON ni dans Supabase (supabase_put_order vient après) → on la rend, clé fixe par joueur + ordre
    // (jamais deux fois), et le marqueur de débit le note (un renvoi du même ordre ne la reprend pas).
    if ($mode === 'real') {
      if (orolado_trade_credit_once($payId, orolado_trade_key('trr', $payId, $oid), $stake) !== null) {
        orolado_trade_debit_mark_refunded($payId, $oid);
      }
    }
    return ['ok' => false, 'reason' => $placed['reason'] ?? 'Ordre refusé'];
  }
  if (!empty($placed['duplicate'])) {
    // L'ordre existe déjà alors que CETTE demande vient de débiter (marqueur de débit perdu) : on rend CE débit,
    // clé fixe par joueur + ordre → une seule fois, quel que soit le nombre de demandes.
    if ($mode === 'real') orolado_trade_credit_once($payId, orolado_trade_key('trd', $payId, $oid), $stake);
    return ['ok' => true, 'duplicate' => true, 'order' => orolado_trade_public($placed['order'])];
  }

  if ($mode === 'real' && function_exists('supabase_put_order')) {
    // v2349 : copie d'archive dans Supabase faite APRÈS la réponse au téléphone quand c'est possible (le trade
    // est déjà enregistré et la mise déjà débitée) → le trait arrive plus vite. En ligne de commande : tout de suite.
    $putRow = [
      'id' => $oid, 'asset_id' => $assetId, 'side' => $side, 'stake' => $stake, 'duration' => $duration,
      'mode' => 'real', 'payout' => $payout, 'entry_price' => $entryCents / 100, 'status' => 'open',
    ];
    if (isset($GLOBALS['OROLADO_AFTER']) && is_array($GLOBALS['OROLADO_AFTER'])) {
      $GLOBALS['OROLADO_AFTER'][] = static function () use ($payId, $putRow) { supabase_put_order($payId, $putRow); };
    } else {
      supabase_put_order($payId, $putRow);
    }
  }
  return ['ok' => true, 'order' => orolado_trade_public($order), 'vault' => $placed['vault']];
}

/**
 * Règle un trade arrivé à expiration. Idempotent : appelé 10 fois, crédite 1 fois.
 * Retour : ['ok' => true, 'order' => ..., 'vault' => ...] ou ['ok' => false, 'pending' => true].
 */
function orolado_trade_settle(string $uid, string $oid): array {
  $db = load_db();
  $o = orolado_trade_find($db, $uid, $oid);
  if (!$o) return ['ok' => false, 'reason' => 'Ordre introuvable'];
  if (($o['status'] ?? '') !== 'open') {
    return ['ok' => true, 'order' => orolado_trade_public($o), 'vault' => $db['vault'][$uid] ?? null];
  }
  $mode = (($o['mode'] ?? 'demo') === 'real') ? 'real' : 'demo';
  $stake = orolado_money($o['stake'] ?? 0);
  $payout = (float) ($o['payout'] ?? 1.88);
  $side = (($o['side'] ?? '') === 'put') ? 'put' : 'call';

  if (!isset($o['expiryTick'], $o['barrierCents'])) {
    // Ordre ouvert avant la mise à jour (ancien système) : mise rendue, personne n'est lésé.
    $verdict = 'void';
    $exitCents = null;
  } else {
    $asset = orolado_feed_asset_id((string) ($o['assetId'] ?? ''));
    if ($asset === '') {
      $verdict = 'void';
      $exitCents = null;
    } else {
      $st = orolado_feed_advance($asset);
      $expiryTick = (int) $o['expiryTick'];
      if ($st['n'] < $expiryTick) {
        return ['ok' => false, 'pending' => true, 'reason' => 'Position encore ouverte', 'retryMs' => ($expiryTick - $st['n']) * OROLADO_TICK_MS + 60];
      }
      $exitCents = orolado_feed_price_at($asset, $expiryTick);
      $verdict = $exitCents === null ? 'void' : orolado_fair_verdict($side, $exitCents, (int) $o['barrierCents']);
    }
  }
  $credit = orolado_fair_credit($verdict, $stake, $payout);
  $net = $verdict === 'won' ? orolado_money($credit - $stake) : ($verdict === 'void' ? 0.0 : orolado_money(-$stake));

  $realAfter = null;
  if ($mode === 'real') {
    $payId = (string) ($o['payId'] ?? '');
    if (!preg_match(OROLADO_UUID_RE, $payId)) $payId = orolado_balance_uuid($db, $uid);
    // Ancien ordre déjà réglé par l'ancien système (son marqueur existe) : on ne recrédite pas.
    if (!isset($o['expiryTick']) && is_file(orolado_data_dir() . '/settle_' . hash('sha256', $payId . '|' . $oid) . '.ok')) {
      $credit = 0.0;
      $net = 0.0;
    }
    // Clé de règlement : celle notée à l'ouverture (rangée par joueur) ; ordres ouverts avant ce changement :
    // leur id, comme avant → chaque ordre garde UNE seule clé, donc un seul crédit.
    $settleKey = (isset($o['settleKey']) && is_string($o['settleKey']) && $o['settleKey'] !== '') ? $o['settleKey'] : $oid;
    $realAfter = orolado_trade_credit_once($payId, $settleKey, $credit);
    if ($realAfter === null) {
      if (function_exists('orolado_health_event')) {
        orolado_health_event('Trades', 'Le règlement d’un trade réel attend la base (nouvel essai automatique). Si ça dure, la base Supabase est peut-être en panne.', 'warn');
      }
      return ['ok' => false, 'pending' => true, 'reason' => 'Règlement en cours', 'retryMs' => 2000];
    }
  }

  $done = with_db_lock(function ($box) use ($uid, $oid, $mode, $verdict, $credit, $net, $exitCents, $realAfter) {
    $locked =& $box->db;
    foreach ($locked['orders'] as &$row) {
      if (!is_array($row) || ($row['id'] ?? '') !== $oid || ($row['userId'] ?? '') !== $uid) continue;
      if (($row['status'] ?? '') !== 'open') {
        return ['ok' => true, 'order' => $row, 'vault' => $locked['vault'][$uid] ?? null, 'skip_write' => true];
      }
      if (!isset($locked['vault'][$uid]) || !is_array($locked['vault'][$uid])) $locked['vault'][$uid] = ['demo' => 0, 'real' => 0];
      if ($mode === 'demo' && $credit > 0) {
        $locked['vault'][$uid]['demo'] = orolado_money(($locked['vault'][$uid]['demo'] ?? 0) + $credit);
      }
      if ($mode === 'real') {
        $locked['vault'][$uid]['real'] = $realAfter;
        if (isset($locked['users'][$uid]) && is_array($locked['users'][$uid])) {
          if (!isset($locked['users'][$uid]['transactions']) || !is_array($locked['users'][$uid]['transactions'])) {
            $locked['users'][$uid]['transactions'] = [];
          }
          array_unshift($locked['users'][$uid]['transactions'], [
            'id' => 'tr_' . bin2hex(random_bytes(6)),
            'at' => date('c'),
            'type' => $verdict === 'void' ? 'void' : ($verdict === 'won' ? 'win' : 'loss'),
            'amount' => $verdict === 'lost' ? orolado_money(-($row['stake'] ?? 0)) : $credit,
            'note' => $verdict === 'void' ? 'Égalité — mise rendue' : ($verdict === 'won' ? 'Gain' : 'Perte'),
            'mode' => 'real',
          ]);
          $locked['users'][$uid]['transactions'] = array_slice($locked['users'][$uid]['transactions'], 0, 80);        }
      }
      $row['status'] = $verdict;
      $row['won'] = $verdict === 'won';
      $row['voided'] = $verdict === 'void';
      $row['net'] = $net;
      $row['exitCents'] = $exitCents;
      $row['closePrice'] = $exitCents !== null ? $exitCents / 100 : null;
      $row['settledAt'] = microtime(true);
      $row['paidOut'] = true;
      return ['ok' => true, 'order' => $row, 'vault' => $locked['vault'][$uid], 'fresh' => true];
    }
    unset($row);
    return ['ok' => false, 'reason' => 'Ordre introuvable', 'skip_write' => true];
  });
  if (empty($done['ok'])) return $done;

  if ($mode === 'real' && !empty($done['fresh']) && function_exists('supabase_put_order')) {
    supabase_put_order((string) ($o['payId'] ?? $uid), [
      'id' => $oid, 'asset_id' => $o['assetId'] ?? '', 'side' => $side, 'stake' => $stake,
      'duration' => (int) ($o['duration'] ?? 10), 'mode' => 'real', 'payout' => $payout,
      'entry_price' => ((int) ($o['entryCents'] ?? 0)) / 100,
      'exit_price' => $exitCents !== null ? $exitCents / 100 : null,
      'won' => $verdict === 'won', 'net' => $net, 'status' => $verdict,
    ]);
  }
  return ['ok' => true, 'order' => orolado_trade_public($done['order']), 'vault' => $done['vault']];
}

/** Règle les trades expirés d'un joueur (retour sur le site, F5, téléphone réveillé). */
function orolado_trade_settle_due(string $uid, int $max = 25): int {
  $db = load_db();
  $n = 0;
  foreach (($db['orders'] ?? []) as $o) {
    if ($n >= $max) break;
    if (!is_array($o) || ($o['userId'] ?? '') !== $uid || ($o['status'] ?? '') !== 'open') continue;
    $expMs = isset($o['expiryTick']) ? ((int) $o['expiryTick']) * OROLADO_TICK_MS : (int) round(((float) ($o['expiryAt'] ?? 0)) * 1000);
    if ($expMs > orolado_feed_now_ms()) continue;
    $res = orolado_trade_settle($uid, (string) ($o['id'] ?? ''));
    if (!empty($res['ok'])) $n++;
  }
  return $n;
}
