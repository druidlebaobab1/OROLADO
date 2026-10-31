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
  $v = getenv('OROLADO_AFF_REV');
  if ($v === false || $v === '') $v = $_ENV['OROLADO_AFF_REV'] ?? '';
  return (string) $v === '1';
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
  $stakes = 0.0;
  $credits = 0.0;
  $seen = [];
  foreach (orolado_orders_recent($db, $ids, 'real') as $o) {
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
    if ($ts > 0 && $ts > $cutTs) continue; // trop récent : pas encore compté
    $stake = orolado_money($o['stake'] ?? 0);
    if ($stake <= 0.009) continue;
    $voided = $st === 'void' || !empty($o['voided']);
    $won = !$voided && ($st === 'won' || !empty($o['won']));
    $payout = (float) ($o['payout'] ?? $o['payoutMult'] ?? 1.88);
    $stakes += $stake;
    if ($voided) $credits += $stake;
    else if ($won) $credits += orolado_money($stake * $payout);
  }
  // marge = ce que la caisse a gardé sur les PARIS (mises − gains rendus).
  return orolado_money($stakes - $credits);
}

/**
 * NGR d'un ami pour l'affiliation :
 *   ngr = min( marge_pariée , dépôts_nets_réglés )
 * Le plafond « dépôts nets réglés » (dépôts ≥ HOLD − retraits) garantit qu'on ne paie jamais sur de
 * l'argent non confirmé. Peut être négatif (ami qui gagne) → report négatif au niveau de l'affilié.
 */
function orolado_aff_rev_friend(array $db, string $friendUid): array {
  $ids = function_exists('orolado_linked_balance_ids') ? orolado_linked_balance_ids($db, $friendUid) : [$friendUid];
  if (!$ids) $ids = [$friendUid];
  $cutTs = time() - orolado_aff_rev_hold_h() * 3600;
  $dep = orolado_aff_rev_settled_deposits($db, $friendUid, $cutTs);
  $wd = orolado_aff_rev_withdrawals($db, $ids);
  $settledIn = orolado_money($dep - $wd);
  $margin = orolado_aff_rev_bet_margin($db, $ids, $cutTs);
  $ngr = orolado_money(min($margin, $settledIn));
  return ['uid' => $friendUid, 'margin' => $margin, 'settledIn' => $settledIn, 'deposits' => $dep, 'withdrawals' => $wd, 'ngr' => $ngr];
}

/** Agrégat de TOUS les amis d'un affilié (report négatif inclus : la somme peut être négative). */
function orolado_aff_rev_aggregate(array $db, string $inviterUid): array {
  $own = orolado_aff_read(orolado_aff_owner_name($inviterUid));
  $friends = is_array($own['friends'] ?? null) ? $own['friends'] : [];
  $sum = 0.0;
  $rows = [];
  $seen = [];
  foreach ($friends as $f) {
    $fu = (string) ($f['uid'] ?? '');
    if ($fu === '' || isset($seen[$fu])) continue;
    $seen[$fu] = true;
    $r = orolado_aff_rev_friend($db, $fu);
    $sum += $r['ngr'];
    $rows[] = $r;
  }
  return ['ngr' => orolado_money($sum), 'friends' => $rows, 'count' => count($rows)];
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
    'withdrawn' => $withdrawn,
    'balance' => $balance,
    'withdrawable' => orolado_money(max(0.0, $balance)),
    'minWithdraw' => orolado_money($minW),
    'friendsCount' => $agg['count'],
    'friends' => $agg['friends'],
  ];
}
