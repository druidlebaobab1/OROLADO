<?php
declare(strict_types=1);

/**
 * OROLADO — historiques durables (compte réel).
 *
 * Avant : l'historique venait surtout du téléphone (effacé à la déconnexion) et s'arrêtait
 * à 20 lignes. Maintenant le SERVEUR lit la base Supabase (faite pour durer des années)
 * + le fichier local en secours, et renvoie les lignes page par page.
 *   - Finances : dépôts, bonus, retraits — jusqu'à 2 000 lignes par joueur.
 *   - Trades réels : jusqu'à 2 000 derniers trades par joueur.
 * Le mode démo n'est pas stocké ici (il reste sur le téléphone, 100 derniers trades).
 */

const OROLADO_HISTORY_MAX = 2000;

function orolado_history_sb(string $path): ?array {
  $hdrs = supabase_admin_headers();
  $url = rtrim(supabase_project_url(), '/');
  if (!$hdrs || $url === '') return null;
  $rows = supabase_http($url . '/rest/v1/' . $path, $hdrs);
  return is_array($rows) ? $rows : null;
}

function orolado_history_ids(array $db, string $uid): array {
  $ids = [$uid];
  $pay = orolado_balance_uuid($db, $uid);
  if ($pay !== '' && $pay !== $uid) $ids[] = $pay;
  return $ids;
}

/** Un bonus = crédit envoyé par l'administration (opérateur « admin », référence adm_…). */
function orolado_history_is_bonus(array $d): bool {
  $op = strtolower(trim((string) ($d['operator'] ?? '')));
  $ref = (string) ($d['id'] ?? $d['ref'] ?? $d['reference'] ?? '');
  return $op === 'admin' || str_starts_with($ref, 'adm_');
}

function orolado_history_wd_status(string $st): string {
  $st = strtoupper(trim($st));
  if (in_array($st, ['PAID', 'APPROVED', 'SUCCESS', 'COMPLETED'], true)) return 'COMPLETED';
  if (in_array($st, ['REJECT', 'REJECTED', 'DENIED', 'CANCELED', 'CANCELLED'], true)) return 'REJECTED';
  return 'PENDING';
}

/**
 * Historique financier d'un joueur, du plus récent au plus ancien.
 * $isAdmin : l'administrateur voit ses propres crédits comme des dépôts normaux.
 */
function orolado_finance_history(array $db, string $uid, bool $isAdmin, int $offset, int $limit): array {
  $ids = orolado_history_ids($db, $uid);
  $rows = [];
  $push = static function (array $r) use (&$rows) {
    $key = ($r['kind'] === 'withdraw' ? 'w:' : 'd:') . $r['ref'];
    if ($r['ref'] === '' || isset($rows[$key])) return;
    $rows[$key] = $r;
  };
  $depRow = static function (array $d, string $at) use ($isAdmin): array {
    $bonus = !$isAdmin && orolado_history_is_bonus($d);
    return [
      'at' => $at,
      'ref' => (string) ($d['reference'] ?? $d['id'] ?? $d['ref'] ?? ''),
      'amount' => orolado_money($d['amount'] ?? 0),
      'kind' => $bonus ? 'bonus' : 'deposit',
      'status' => 'COMPLETED',
      'gateway' => $bonus ? 'OROLADO' : (string) ($d['operator'] ?? $d['op'] ?? ''),
    ];
  };

  // 1) Base Supabase (durable).
  foreach ($ids as $id) {
    if (!preg_match(OROLADO_UUID_RE, $id)) continue;
    $q = 'user_id=eq.' . rawurlencode($id) . '&order=created_at.desc&limit=' . OROLADO_HISTORY_MAX;
    foreach ((array) orolado_history_sb('deposits?' . $q . '&select=id,amount,status,operator,reference,created_at,completed_at') as $d) {
      if (!is_array($d)) continue;
      $st = strtoupper((string) ($d['status'] ?? ''));
      if (!in_array($st, ['COMPLETED', 'PAID', 'SUCCESS', 'APPROVED'], true)) continue;
      $push($depRow($d, (string) ($d['completed_at'] ?? $d['created_at'] ?? '')));
    }
    foreach ((array) orolado_history_sb('withdrawals?' . $q . '&select=id,amount,status,operator,reference,created_at') as $w) {
      if (!is_array($w) || orolado_wd_is_hidden_from_player($w)) continue;
      $push([
        'at' => (string) ($w['created_at'] ?? ''),
        'ref' => (string) ($w['id'] ?? $w['reference'] ?? ''),
        'amount' => -abs(orolado_money($w['amount'] ?? 0)),
        'kind' => 'withdraw',
        'status' => orolado_history_wd_status((string) ($w['status'] ?? '')),
        'gateway' => (string) ($w['operator'] ?? ''),
      ]);
    }
  }

  // 2) Fichier local (secours si la base ne répond pas, et anciens enregistrements).
  foreach (($db['deposits'] ?? []) as $d) {
    if (!is_array($d) || !in_array((string) ($d['userId'] ?? ''), $ids, true)) continue;
    $st = strtoupper((string) ($d['status'] ?? ''));
    if (!in_array($st, ['COMPLETED', 'PAID', 'SUCCESS', 'APPROVED'], true)) continue;
    $push($depRow($d, (string) ($d['paidAt'] ?? $d['at'] ?? $d['createdAt'] ?? '')));
  }
  foreach (($db['withdrawals'] ?? []) as $w) {
    if (!is_array($w) || !in_array((string) ($w['userId'] ?? ''), $ids, true)) continue;
    if (orolado_wd_is_hidden_from_player($w)) continue;
    $push([
      'at' => (string) ($w['at'] ?? $w['createdAt'] ?? ''),
      'ref' => (string) ($w['id'] ?? ''),
      'amount' => -abs(orolado_money($w['amount'] ?? 0)),
      'kind' => 'withdraw',
      'status' => orolado_history_wd_status((string) ($w['status'] ?? '')),
      'gateway' => (string) ($w['operator'] ?? ''),
    ]);
  }

  $rows = array_values(array_filter($rows, static fn($r) => abs((float) $r['amount']) > 0.0));
  usort($rows, static fn($a, $b) => strcmp((string) $b['at'], (string) $a['at']));
  $rows = array_slice($rows, 0, OROLADO_HISTORY_MAX);
  return ['total' => count($rows), 'rows' => array_slice($rows, max(0, $offset), max(1, min(200, $limit)))];
}

/** Trades RÉELS terminés d'un joueur, du plus récent au plus ancien (page par page). */
function orolado_trade_history(array $db, string $uid, int $offset, int $limit): array {
  $limit = max(1, min(200, $limit));
  $offset = max(0, min(OROLADO_HISTORY_MAX - 1, $offset));
  $ids = orolado_history_ids($db, $uid);
  $rows = [];
  $seen = [];
  foreach ($ids as $id) {
    if (!preg_match(OROLADO_UUID_RE, $id)) continue;
    $sb = orolado_history_sb('orders?user_id=eq.' . rawurlencode($id) . '&mode=eq.real&status=in.(won,lost,void)'
      . '&select=id,asset_id,side,stake,duration,payout,entry_price,exit_price,net,status,created_at'
      . '&order=created_at.desc&offset=' . $offset . '&limit=' . $limit);
    foreach ((array) $sb as $o) {
      if (!is_array($o) || isset($seen[$o['id'] ?? ''])) continue;
      $seen[(string) $o['id']] = 1;
      $rows[] = [
        'id' => (string) $o['id'],
        'at' => (string) ($o['created_at'] ?? ''),
        'assetId' => (string) ($o['asset_id'] ?? ''),
        'side' => (($o['side'] ?? '') === 'put') ? 'put' : 'call',
        'stake' => orolado_money($o['stake'] ?? 0),
        'duration' => (int) ($o['duration'] ?? 0),
        'payout' => (float) ($o['payout'] ?? 1.88),
        'entryPrice' => isset($o['entry_price']) ? (float) $o['entry_price'] : null,
        'exitPrice' => isset($o['exit_price']) ? (float) $o['exit_price'] : null,
        'net' => orolado_money($o['net'] ?? 0),
        'status' => (string) ($o['status'] ?? ''),
        'mode' => 'real',
      ];
    }
  }
  // Secours : si la base ne répond pas, les trades récents du fichier local.
  if (!$rows && $offset === 0) {
    foreach (array_reverse($db['orders'] ?? []) as $o) {
      if (!is_array($o) || ($o['mode'] ?? '') !== 'real' || !in_array((string) ($o['userId'] ?? ''), $ids, true)) continue;
      $st = (string) ($o['status'] ?? '');
      if (!in_array($st, ['won', 'lost', 'void'], true)) continue;
      $rows[] = orolado_trade_public($o) + ['at' => date('c', (int) ($o['at'] ?? time()))];
      if (count($rows) >= $limit) break;
    }
  }
  usort($rows, static fn($a, $b) => strcmp((string) $b['at'], (string) $a['at']));
  return ['rows' => $rows, 'more' => count($rows) >= $limit && $offset + $limit < OROLADO_HISTORY_MAX];
}

/**
 * Archivage : les trades terminés depuis plus de 2 jours quittent orolado.json (relu à chaque
 * action) pour des fichiers mensuels data/archive/orders-AAAA-MM.jsonl. Le site reste rapide
 * même avec des milliers de joueurs par jour ; rien n'est perdu (Supabase + archives).
 */
function orolado_archive_orders(): int {
  $flag = orolado_data_dir() . '/archive/.last';
  if (is_file($flag) && time() - (int) @filemtime($flag) < 600) return 0;
  if (!is_dir(orolado_data_dir() . '/archive')) @mkdir(orolado_data_dir() . '/archive', 0755, true);
  @touch($flag);
  $cut = microtime(true) - 2 * 86400;
  $moved = 0;
  with_db_lock(function ($box) use ($cut, &$moved) {
    $keep = [];
    $byMonth = [];
    foreach (($box->db['orders'] ?? []) as $o) {
      $done = is_array($o) && in_array((string) ($o['status'] ?? ''), ['won', 'lost', 'void', 'closed'], true);
      $at = is_array($o) ? (float) ($o['settledAt'] ?? $o['at'] ?? 0) : 0;
      if ($done && $at > 0 && $at < $cut) {
        $byMonth[date('Y-m', (int) ($o['at'] ?? time()))][] = json_encode($o, JSON_UNESCAPED_UNICODE);
      } else {
        $keep[] = $o;
      }
    }
    if (!$byMonth) return ['ok' => true, 'skip_write' => true];
    // L'archive est écrite AVANT de retirer quoi que ce soit : en cas d'échec, on ne touche à rien.
    foreach ($byMonth as $ym => $lines) {
      $ok = @file_put_contents(orolado_data_dir() . '/archive/orders-' . $ym . '.jsonl', implode("\n", $lines) . "\n", FILE_APPEND | LOCK_EX);
      if ($ok === false) return ['ok' => false, 'skip_write' => true];
    }
    $moved = count($box->db['orders']) - count($keep);
    $box->db['orders'] = $keep;
    return ['ok' => true];
  });
  return $moved;
}
