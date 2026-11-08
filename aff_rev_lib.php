<?php
declare(strict_types=1);
/**
 * AFFILIATION — PART DE REVENU (« revenue share / NGR »), v1 — accord du propriétaire (2026-10-31).
 *
 * Remplace, quand OROLADO_AFF_REV=1, le calcul de gain de l'affilié (celui qui invite) :
 *   - AVANT : 5 % de CHAQUE dépôt de l'ami (aff_lib.php).
 *   - MAINTENANT : 60 % de ce qu'OROLADO a VRAIMENT gardé sur les amis (leur marge réelle).
 *
 * La règle, en une phrase :
 *   Solde affilié = PCT × Σ_amis min( marge_pariée_ami , dépôts_nets_réglés_ami ) − déjà_retiré
 * où « marge pariée » = mises réglées − gains rendus (ce que la caisse a gagné sur ses paris),
 * et « dépôts nets réglés » = dépôts réels (âgés ≥ HOLD) − retraits (plafond anti-chargeback).
 *
 * POURQUOI C'EST INVOLABLE (sans aucune détection) :
 *   - On ne compte QUE l'argent réellement gagné par la caisse (marge réalisée), jamais l'argent
 *     que l'ami possède encore. Donc on ne peut JAMAIS verser plus que PCT × (ce que la maison a gardé).
 *   - On additionne TOUS les amis d'un affilié ensemble, avec report négatif (un ami qui gagne fait
 *     baisser le compteur). Le « surebet » (parier l'opposé sur 2 comptes) laisse la marge à la maison :
 *     le groupe perd la marge, l'affilié n'en touche qu'une part → le tricheur perd toujours (1−PCT).
 *   - Le plafond « dépôts nets réglés » empêche de payer sur de l'argent pas encore confirmé (≥ HOLD h),
 *     ce qui couvre les annulations bancaires (chargebacks).
 *
 * ARGENT : ce fichier ne CALCULE que. Il ne touche à aucun chemin de paiement et ne verse rien tant que
 * l'affilié ne réclame pas (orolado_aff_rev_claim, via l'API), versement idempotent par référence unique.
 * Données à part, sous verrou : data/aff/ (mêmes helpers que aff_lib.php).
 *
 * Liaison ami↔parrain, codes, clics : TOUJOURS gérés par aff_lib.php (inchangé). Ici, SEUL le gain change.
 */

require_once __DIR__ . '/aff_lib.php';

const OROLADO_AFF_REV_PCT_DEFAULT  = 0.60; // part versée à l'affilié sur la marge réelle
const OROLADO_AFF_REV_HOLD_H_DEF   = 24;   // heures avant qu'un dépôt/pari compte (anti-chargeback)

function orolado_aff_rev_enabled(): bool {
  // Actif par défaut (part de revenu 60 %). Pour revenir à l'ancien 5 % : OROLADO_AFF_REV=0.
  $v = getenv('OROLADO_AFF_REV');
  if ($v === false || $v === '') $v = $_ENV['OROLADO_AFF_REV'] ?? '';
  return (string) $v !== '0';
}

/** Pourcentage versé à l'affilié (réglable sans toucher au code : OROLADO_AFF_REV_PCT=60). */
function orolado_aff_rev_pct(): float {
  $v = getenv('OROLADO_AFF_REV_PCT');
  if ($v === false || $v === '') $v = $_ENV['OROLADO_AFF_REV_PCT'] ?? '';
  $p = is_numeric($v) ? (float) $v : OROLADO_AFF_REV_PCT_DEFAULT * 100;
  $p = max(0.0, min(90.0, $p)); // garde-fou : jamais ≥ 100 %, sinon la caisse pourrait perdre
  return $p / 100.0;
}

/** Délai (heures) avant qu'un dépôt ou un pari soit pris en compte. Réglable : OROLADO_AFF_REV_HOLD_H=48. */
function orolado_aff_rev_hold_h(): int {
  $v = getenv('OROLADO_AFF_REV_HOLD_H');
  if ($v === false || $v === '') $v = $_ENV['OROLADO_AFF_REV_HOLD_H'] ?? '';
  $h = is_numeric($v) ? (int) $v : OROLADO_AFF_REV_HOLD_H_DEF;
  return max(0, min(24 * 30, $h));
}

function orolado_aff_rev_name(string $uid): string { return 'rev_' . hash('sha256', 'aff-rev|' . $uid); }

/** Somme des vrais dépôts d'un joueur, réglés depuis ≥ HOLD heures (bonus/défi/admin exclus). */
function orolado_aff_rev_settled_deposits(array $db, string $friendUid, int $cutTs): float {
  $sum = 0.0;
  foreach (orolado_aff_real_deposits($db, $friendUid) as $d) {
    if (($d['ts'] ?? 0) > 0 && (int) $d['ts'] <= $cutTs) $sum += (float) ($d['amount'] ?? 0);
  }
  return orolado_money($sum);
}

/** Somme des retraits PAYÉS/validés d'un joueur (et de ses comptes liés). */
function orolado_aff_rev_withdrawals(array $db, array $ids): float {
  $wd = 0.0;
  $seen = [];
  foreach (($db['withdrawals'] ?? []) as $w) {
    if (!is_array($w)) continue;
    $owner = (string) ($w['userId'] ?? $w['user_id'] ?? '');
    if ($owner === '' || !in_array($owner, $ids, true)) continue;
    $st = strtolower((string) ($w['status'] ?? ''));
    if (!in_array($st, ['approved', 'paid', 'completed', 'success'], true)) continue;
    $wid = (string) ($w['id'] ?? '');
    if ($wid !== '' && isset($seen[$wid])) continue;
    if ($wid !== '') $seen[$wid] = true;
    $wd += orolado_money($w['amount'] ?? 0);
  }
  return orolado_money($wd);
}

/**
 * Marge réelle gagnée par OROLADO sur les paris RÉELS et RÉGLÉS d'un joueur (âgés ≥ HOLD) :
 *   marge = Σ mises − Σ gains rendus (gain si gagné, mise rendue si annulé).
 * Positive quand le joueur perd, négative quand il gagne. UNIQUEMENT le résultat des paris : les cadeaux
 * et crédits admin n'y entrent pas (une perte financée par bonus est déjà écartée par le plafond
 * « dépôts nets réglés » dans orolado_aff_rev_friend).
 */
function orolado_aff_rev_bet_margin(array $db, array $ids, int $cutTs): float {
  $t = orolado_aff_rev_bet_totals($db, $ids, $cutTs);
  return orolado_money($t['s'] - $t['c']);
}

/**
 * 2026-11-08 (tableau de bord affilié) : en UN passage, mises et gains rendus des paris RÉELS réglés de l'ami :
 *   s / c = comptés (réglés depuis ≥ HOLD) ; sAll / cAll = tous, y compris les plus récents (« en attente »).
 */
function orolado_aff_rev_bet_totals(array $db, array $ids, int $cutTs): array {
  $stakes = 0.0;
  $credits = 0.0;
  $stakesAll = 0.0;
  $creditsAll = 0.0;
  $seen = [];
  foreach (orolado_orders_recent($db, $ids, 'real', true) as $o) { // 2026-11-08 (revue) : TOUT l'historique (avant : ~2 jours, puis les trades sortaient du calcul)
    if (!is_array($o)) continue;
    $owner = (string) ($o['userId'] ?? $o['user_id'] ?? '');
    if ($owner === '' || !in_array($owner, $ids, true)) continue;
    if (strtolower((string) ($o['mode'] ?? $o['accountType'] ?? 'demo')) !== 'real') continue;
    $st = strtolower((string) ($o['status'] ?? ''));
    if (!in_array($st, ['won', 'lost', 'void', 'closed'], true)) continue; // réglés seulement (pas 'open')
    $oid = (string) ($o['id'] ?? '');
    if ($oid !== '' && isset($seen[$oid])) continue;
    if ($oid !== '') $seen[$oid] = true;
    // Âge : le pari doit être réglé depuis ≥ HOLD (sinon on attend, anti-annulation).
    $ts = 0;
    foreach (['settledAt', 'closedAt', 'resolvedAt', 'at', 'updatedAt', 'createdAt'] as $k) {
      if (!empty($o[$k])) { $ts = (int) strtotime((string) $o[$k]); if ($ts > 0) break; }
    }
    $stake = orolado_money($o['stake'] ?? 0);
    if ($stake <= 0.009) continue;
    $voided = $st === 'void' || !empty($o['voided']);
    $won = !$voided && ($st === 'won' || !empty($o['won']));
    $payout = (float) ($o['payout'] ?? $o['payoutMult'] ?? 1.88);
    $cr = $voided ? $stake : ($won ? orolado_money($stake * $payout) : 0.0);
    $stakesAll += $stake; $creditsAll += $cr;
    if ($ts > 0 && $ts > $cutTs) continue; // trop récent : pas encore compté (seulement « en attente »)
    $stakes += $stake; $credits += $cr;
  }
  // 2026-11-08 (propriétaire : « mes amis ont joué, rien n'arrive ») — AVANT : seuls les TRADES comptaient. Les parties de
  // CASINO / LIVE / ACTION (journal des parties, argent réel) et les PARIS SPORTIFS réglés comptent maintenant aussi.
  [$cs, $cc, $csA, $ccA] = orolado_aff_rev_casino_margin($ids, $cutTs);
  [$ss, $sc, $ssA, $scA] = orolado_aff_rev_sports_margin($ids, $cutTs);
  $stakes += $cs + $ss; $credits += $cc + $sc;
  $stakesAll += $csA + $ssA; $creditsAll += $ccA + $scA;
  return ['s' => $stakes, 'c' => $credits, 'sAll' => $stakesAll, 'cAll' => $creditsAll];
}

/** Parties réelles (Casino, Live, Action) du journal du joueur, terminées depuis ≥ HOLD : [mises, gains rendus]. */
function orolado_aff_rev_casino_margin(array $ids, int $cutTs): array {
  $st = 0.0; $cr = 0.0; $stA = 0.0; $crA = 0.0;
  if (!function_exists('casino_round_user_file')) return [0.0, 0.0, 0.0, 0.0];
  foreach (array_unique($ids) as $id) {
    $f = casino_round_user_file((string) $id);
    if (!is_file($f) || !($fh = @fopen($f, 'r'))) continue;
    while (($line = fgets($fh)) !== false) {
      $line = trim($line);
      if ($line === '' || $line[0] !== '{') continue;
      $r = json_decode($line, true);
      if (!is_array($r) && ($p = strrpos($line, '{"t":')) > 0) $r = json_decode(substr($line, $p), true);
      if (!is_array($r) || ($r['m'] ?? '') !== 'real') continue;
      $t = (float) ($r['t'] ?? 0);
      $s = (float) ($r['s'] ?? 0);
      if ($t <= 0 || $s <= 0) continue;
      $w = !empty($r['v']) ? $s : (float) ($r['w'] ?? 0);
      $stA += $s; $crA += $w;
      if ($t > $cutTs) continue; // trop récent : compté après le délai (« en attente »)
      $st += $s; $cr += $w;
    }
    fclose($fh);
  }
  return [$st, $cr, $stA, $crA];
}

/** Paris sportifs réels réglés depuis ≥ HOLD : [mises, gains rendus]. Fichier des paris lu une seule fois par requête. */
function orolado_aff_rev_sports_margin(array $ids, int $cutTs): array {
  static $bets = null;
  if ($bets === null) {
    $bets = [];
    if (function_exists('sp_with')) {
      foreach ((array) (sp_with('bets.json', static fn(array &$s) => $s['b'] ?? []) ?: []) as $b) {
        if (!is_array($b) || ($b['mode'] ?? '') !== 'real') continue;
        $u = (string) ($b['uid'] ?? ''); if ($u === '') continue;
        $bets[$u][] = $b;
      }
    }
  }
  $st = 0.0; $cr = 0.0; $stA = 0.0; $crA = 0.0;
  foreach (array_unique($ids) as $id) {
    foreach ($bets[(string) $id] ?? [] as $b) {
      $status = (string) ($b['status'] ?? '');
      if (!in_array($status, ['won', 'lost', 'void'], true)) continue;
      $done = (int) ($b['done'] ?? 0);
      $s = (float) ($b['stake'] ?? 0);
      if ($done <= 0 || $s <= 0) continue;
      $w = $status === 'void' ? $s : (float) ($b['win'] ?? 0);
      $stA += $s; $crA += $w;
      if ($done > $cutTs) continue;
      $st += $s; $cr += $w;
    }
  }
  return [$st, $cr, $stA, $crA];
}

/**
 * NGR d'un ami pour l'affiliation :
 *   ngr = min( marge_pariée , dépôts_nets_réglés )
 * Le plafond « dépôts nets réglés » (dépôts ≥ HOLD − retraits) garantit qu'on ne paie jamais sur de
 * l'argent non confirmé. Peut être négatif (ami qui gagne) → report négatif au niveau de l'affilié.
 */
function orolado_aff_rev_friend(array $db, string $friendUid): array {
  if (function_exists('orolado_is_partner') && orolado_is_partner($db, $friendUid)) return ['uid' => $friendUid, 'margin' => 0.0, 'settledIn' => 0.0, 'deposits' => 0.0, 'withdrawals' => 0.0, 'ngr' => 0.0]; // v3628 : compte partenaire = pas de commission
  $ids = function_exists('orolado_linked_balance_ids') ? orolado_linked_balance_ids($db, $friendUid) : [$friendUid];
  if (!$ids) $ids = [$friendUid];
  $cutTs = time() - orolado_aff_rev_hold_h() * 3600;
  $dep = orolado_aff_rev_settled_deposits($db, $friendUid, $cutTs);
  $wd = orolado_aff_rev_withdrawals($db, $ids);
  $settledIn = orolado_money($dep - $wd);
  $tot = orolado_aff_rev_bet_totals($db, $ids, $cutTs);
  $margin = orolado_money($tot['s'] - $tot['c']);
  $ngr = orolado_money(min($margin, $settledIn));
  // 2026-11-08 (tableau de bord) : « en attente » = ce qui comptera après le délai (parties / dépôts de moins de HOLD h).
  $depAll = orolado_aff_rev_settled_deposits($db, $friendUid, PHP_INT_MAX);
  $marginAll = orolado_money($tot['sAll'] - $tot['cAll']);
  $ngrAll = orolado_money(min($marginAll, orolado_money($depAll - $wd)));
  return ['uid' => $friendUid, 'margin' => $margin, 'settledIn' => $settledIn, 'deposits' => $dep, 'withdrawals' => $wd, 'ngr' => $ngr,
    'staked' => orolado_money($tot['sAll']), 'ngrAll' => $ngrAll, 'depAll' => orolado_money($depAll)];
}

/** Agrégat de TOUS les amis d'un affilié (report négatif inclus : la somme peut être négative). */
function orolado_aff_rev_aggregate(array $db, string $inviterUid): array {
  $own = orolado_aff_read(orolado_aff_owner_name($inviterUid));
  $friends = is_array($own['friends'] ?? null) ? $own['friends'] : [];
  $sum = 0.0; $sumAll = 0.0; $staked = 0.0; $active = 0;
  $rows = [];
  $seen = [];
  foreach ($friends as $f) {
    $fu = (string) ($f['uid'] ?? '');
    if ($fu === '' || isset($seen[$fu])) continue;
    $seen[$fu] = true;
    $r = orolado_aff_rev_friend($db, $fu);
    $sum += $r['ngr'];
    $sumAll += (float) ($r['ngrAll'] ?? $r['ngr']);
    $staked += (float) ($r['staked'] ?? 0);
    if ((float) ($r['staked'] ?? 0) > 0) $active++;
    $rows[] = $r;
  }
  return ['ngr' => orolado_money($sum), 'ngrAll' => orolado_money($sumAll), 'staked' => orolado_money($staked), 'active' => $active, 'friends' => $rows, 'count' => count($rows)];
}

/**
 * Portefeuille d'affiliation (part de revenu), séparé du solde de jeu :
 *   entitled (dû total) = PCT × agrégat NGR, jamais arrondi vers le haut ;
 *   balance (solde affilié) = dû − déjà_retiré  (peut être négatif, comme le −115 $ de 1win) ;
 *   withdrawable = max(0, balance)  (rien à retirer tant que le compteur est sous zéro).
 * Le dû ne peut JAMAIS dépasser PCT × (marge réelle gardée par la caisse) : la caisse garde toujours ≥ (1−PCT).
 */
function orolado_aff_rev_wallet(array $db, string $inviterUid): array {
  $pct = orolado_aff_rev_pct();
  $agg = orolado_aff_rev_aggregate($db, $inviterUid);
  $entitled = orolado_money(floor($pct * $agg['ngr'] * 100) / 100); // arrondi vers le bas
  $rev = orolado_aff_read(orolado_aff_rev_name($inviterUid));
  $withdrawn = orolado_money($rev['withdrawn'] ?? 0);
  $balance = orolado_money($entitled - $withdrawn);
  $minW = function_exists('orolado_min_withdraw') ? orolado_min_withdraw() : 1.0;
  return [
    'pct' => (int) round($pct * 100),
    'holdH' => orolado_aff_rev_hold_h(),
    'ngr' => $agg['ngr'],
    'entitled' => $entitled,
    'withdrawn' => $withdrawn, // = total déjà versé à l'affilié (argent libre)
    'balance' => $balance,
    'withdrawable' => orolado_money(max(0.0, $balance)),
    'minWithdraw' => orolado_money($minW),
    'friendsCount' => $agg['count'],
    'friends' => $agg['friends'],
    // 2026-11-08 (tableau de bord) : en attente (comptera après le délai), volume misé par les amis, amis qui jouent
    'pending' => orolado_money(max(0.0, floor($pct * $agg['ngrAll'] * 100) / 100 - $entitled)),
    'staked' => $agg['staked'],
    'active' => (int) $agg['active'],
    'log' => array_slice(array_reverse((array) ($rev['log'] ?? [])), 0, 10),
  ];
}

/** Seuil « gros dépôt » pour le signal admin (réglable : OROLADO_AFF_BIG_DEP=500). Info seulement. */
function orolado_aff_rev_big_dep(): float {
  $v = getenv('OROLADO_AFF_BIG_DEP');
  if ($v === false || $v === '') $v = $_ENV['OROLADO_AFF_BIG_DEP'] ?? '';
  return is_numeric($v) ? max(0.0, (float) $v) : 500.0;
}

/**
 * SUIVI ADMIN (info seulement, JAMAIS de blocage/ban automatique) : pour chaque affilié connu,
 * ses chiffres (amis, NGR gardé, versé, solde) et des SIGNAUX à regarder à la main :
 *   - sameIp : combien d'amis partagent une même IP d'inscription (grappe la plus grande) ;
 *   - big    : combien d'amis ont déposé un gros montant (≥ seuil) ;
 *   - watch  : vrai si une grappe d'IP ≥ 3 — simple drapeau « à regarder », pas une sanction.
 * L'admin décide seul quoi faire. Un vrai affilié (pubs, vidéos, tests) n'est jamais pénalisé.
 */
function orolado_aff_admin_overview(array $db, array $opts = []): array {
  $ids = orolado_aff_index_ids();
  // Rattrapage : inclure aussi des uid passés par l'appelant (anciens affiliés hors index).
  foreach ((array) ($opts['extra'] ?? []) as $x) { $x = (string) $x; if ($x !== '' && !in_array($x, $ids, true)) $ids[] = $x; }
  $big = orolado_aff_rev_big_dep();
  $rows = [];
  $totalPaid = 0.0;
  $GLOBALS['OROLADO_AFF_DEPIDX'] = orolado_aff_build_deposit_index($db);
  foreach ($ids as $uid) {
    $own = orolado_aff_read(orolado_aff_owner_name($uid));
    $friends = is_array($own['friends'] ?? null) ? $own['friends'] : [];
    if (!$friends) continue;
    $w = orolado_aff_rev_wallet($db, $uid);
    // Signaux (info) : grappes d'IP + gros déposeurs.
    $ipCount = [];
    foreach ($friends as $f) { $ip = (string) ($f['ip'] ?? ''); if ($ip !== '') $ipCount[$ip] = ($ipCount[$ip] ?? 0) + 1; }
    $sameIp = $ipCount ? max($ipCount) : 0;
    $bigN = 0;
    $deposited = 0;
    foreach ((array) ($w['friends'] ?? []) as $fr) {
      if (($fr['deposits'] ?? 0) > 0.009) $deposited++;
      if (($fr['deposits'] ?? 0) >= $big) $bigN++;
    }
    $u = $db['users'][$uid] ?? [];
    $totalPaid += (float) ($w['withdrawn'] ?? 0);
    $rows[] = [
      'uid' => $uid,
      'publicId' => (string) (is_array($u) ? ($u['publicId'] ?? 'ORO-??????') : 'ORO-??????'),
      'name' => (string) (is_array($u) ? ($u['displayName'] ?? '') : ''),
      'friends' => count($friends),
      'deposited' => $deposited,
      'ngr' => orolado_money($w['ngr'] ?? 0),
      'entitled' => orolado_money($w['entitled'] ?? 0), // dû total (60 % du NGR)
      'paid' => orolado_money($w['withdrawn'] ?? 0),      // déjà versé à l'affilié (argent libre)
      'balance' => orolado_money($w['balance'] ?? 0),
      'sameIp' => (int) $sameIp,
      'big' => (int) $bigN,
      'watch' => ($sameIp >= 3),
    ];
  }
  unset($GLOBALS['OROLADO_AFF_DEPIDX']);
  usort($rows, static fn($a, $b) => ($b['watch'] <=> $a['watch']) ?: ($b['paid'] <=> $a['paid']));
  return ['rows' => $rows, 'count' => count($rows), 'totalPaid' => orolado_money($totalPaid), 'bigThreshold' => $big];
}

/**
 * VERSEMENT (vesting) : crédite à l'affilié, en argent LIBRE (retirable ou jouable, comme aujourd'hui),
 * la part de commission qui vient d'être acquise — c.-à-d. ce qui dépasse ce qu'on lui a DÉJÀ versé.
 *   à_verser = entitled − déjà_versé   (seulement si > 0 ; jamais de reprise si le compteur redescend)
 * Idempotent : la référence encode le nouveau total versé, donc même appelé 100 fois, rien n'est payé 2 fois
 * (orolado_trade_credit_once dédouble par référence). Report négatif : si les amis gagnent, entitled
 * baisse sous « déjà_versé » → on ne verse rien de plus tant qu'il n'est pas remonté (high-water).
 * Compte admin (mode test) : versé sur la démo, jamais d'argent réel (via orolado_aff_pay_inviter).
 */
function orolado_aff_rev_run(array $db, string $inviterUid): array {
  if (!orolado_aff_rev_enabled() || $inviterUid === '') return orolado_aff_rev_wallet($db, $inviterUid);
  $iu = $db['users'][$inviterUid] ?? null;
  if (!is_array($iu) || !orolado_aff_allowed($iu + ['id' => $inviterUid])) return orolado_aff_rev_wallet($db, $inviterUid);
  $wallet = orolado_aff_rev_wallet($db, $inviterUid);
  $entitled = orolado_money($wallet['entitled']);
  $rev = orolado_aff_read(orolado_aff_rev_name($inviterUid));
  $paid = orolado_money($rev['withdrawn'] ?? 0);
  $delta = orolado_money(floor(($entitled - $paid) * 100) / 100);
  if ($delta >= 0.01) {
    $newTotal = orolado_money($paid + $delta);
    $ref = 'affrev_' . substr(hash('sha256', $inviterUid . '|' . number_format($newTotal, 2, '.', '')), 0, 20);
    $ok = orolado_aff_pay_inviter($db, $inviterUid, $delta, $ref);
    if ($ok) {
      orolado_aff_with(orolado_aff_rev_name($inviterUid), static function (&$st) use ($newTotal, $delta, $ref) {
        $st['withdrawn'] = $newTotal; // total versé à ce jour (argent libre chez l'affilié)
        if (!isset($st['log']) || !is_array($st['log'])) $st['log'] = [];
        foreach ($st['log'] as $l) if (($l['ref'] ?? '') === $ref) return; // déjà noté
        $st['log'][] = ['ref' => $ref, 'amount' => $delta, 'at' => date('c')];
        $st['log'] = array_slice($st['log'], -500);
      });
      $wallet = orolado_aff_rev_wallet($db, $inviterUid);
      $wallet['justPaid'] = $delta;
      // 2026-11-08 : l'affilié est prévenu (notification + e-mail) — à partir de 0,50 $, au plus une fois toutes les 6 h
      if ($delta >= 0.5 && is_file(__DIR__ . '/notify_lib.php') && orolado_rate_ok('affrev_notify', $inviterUid, 1, 21600)) {
        try { require_once __DIR__ . '/notify_lib.php'; orolado_notify_player($inviterUid, 'aff', $delta); } catch (Throwable $eN) { /* jamais bloquant */ }
      }
    }
  }
  return $wallet;
}
