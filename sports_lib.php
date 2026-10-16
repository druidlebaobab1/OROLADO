<?php
declare(strict_types=1);
/**
 * v2690 — PARIS SPORTIFS MANUELS (propriétaire, 2026-10-16).
 *  - L'ADMIN crée les matchs (foot, basket, boxe…) avec SES cotes (serrées), une date de début, et une mise maximale
 *    cachée par coupon ; il peut fermer les paris, puis cliquer le résultat (ou annuler le match : mises rendues).
 *  - Le joueur fait un COUPON d'1 à 10 matchs différents (les cotes se multiplient), dès 0,10 $, en réel ou en démo.
 *  - Coupon gagné = toutes ses sélections gagnées (un match annulé compte ×1). Gain maximal caché par coupon.
 *  - Argent : mise retirée UNE fois (orolado_trade_debit), gain versé UNE fois (orolado_trade_credit_once), comme le casino.
 * Fichiers : data/sports/events.json, data/sports/bets.json (verrou de fichier).
 */

const SP_MIN = 0.10;
const SP_MAX_SEL = 10;
const SP_MAX_WIN = 5000.0;        // gain maximal caché par coupon
const SP_DEFAULT_MAX_STAKE = 50.0; // mise maximale cachée par coupon (modifiable par match dans l'admin)

function sp_dir(): string { $d = rtrim(orolado_data_dir(), '/\\') . DIRECTORY_SEPARATOR . 'sports'; if (!is_dir($d)) @mkdir($d, 0750, true); return $d; }
function sp_with(string $name, callable $fn) {
  if (function_exists('casino_with')) return casino_with(sp_dir() . DIRECTORY_SEPARATOR . $name, $fn);
  $fp = @fopen(sp_dir() . DIRECTORY_SEPARATOR . $name, 'c+');
  if (!$fp) return null;
  flock($fp, LOCK_EX);
  $st = json_decode(stream_get_contents($fp) ?: '', true); if (!is_array($st)) $st = [];
  $before = $st; $res = $fn($st);
  if ($st !== $before) { rewind($fp); ftruncate($fp, 0); fwrite($fp, json_encode($st, JSON_UNESCAPED_UNICODE)); fflush($fp); }
  flock($fp, LOCK_UN); fclose($fp);
  return $res;
}
function sp_events(): array { return (array) (sp_with('events.json', static fn(array &$s) => $s['e'] ?? []) ?: []); }
function sp_clean(string $s, int $max): string { $s = trim(preg_replace('/\s+/u', ' ', strip_tags($s)) ?? ''); return preg_match('/^.{0,' . $max . '}/us', $s, $m) ? $m[0] : ''; }

/** Vue joueur : matchs ouverts (et ceux réglés depuis moins de 3 jours, pour voir le résultat). */
function sp_public_events(int $now = 0): array {
  $now = $now ?: time();
  $out = [];
  foreach (sp_events() as $e) {
    $open = $e['status'] === 'open' && $now < (int) $e['start'];
    if (!$open && !($e['status'] === 'settled' && (int) ($e['settledAt'] ?? 0) > $now - 3 * 86400)) continue;
    $out[] = ['id' => $e['id'], 'title' => $e['title'], 'league' => $e['league'], 'sport' => $e['sport'], 'start' => (int) $e['start'], 'open' => $open,
      'opts' => array_map(static fn($o) => ['k' => $o['k'], 'label' => $o['label'], 'odd' => (float) $o['odd']], $e['opts']), 'result' => $e['result'] ?? null, 'status' => $e['status']];
  }
  usort($out, static fn($a, $b) => [$b['open'], $a['start']] <=> [$a['open'], $b['start']]);
  return $out;
}

/** Admin : crée / modifie un match. $in = title, league, sport, start (timestamp), opts [[label, odd]…], maxStake. */
function sp_admin_save(array $in): array {
  $title = sp_clean((string) ($in['title'] ?? ''), 80);
  if (mb_strlen_safe($title) < 3) return ['ok' => false, 'reason' => 'Titre trop court'];
  $start = (int) ($in['start'] ?? 0);
  if ($start < time() + 60) return ['ok' => false, 'reason' => 'Date de début dans le passé'];
  $opts = [];
  foreach ((array) ($in['opts'] ?? []) as $i => $o) {
    $label = sp_clean((string) ($o['label'] ?? ''), 40);
    $odd = round((float) ($o['odd'] ?? 0), 2);
    if ($label === '') continue;
    if ($odd < 1.01 || $odd > 100) return ['ok' => false, 'reason' => 'Cote invalide : ' . $label];
    $opts[] = ['k' => 'o' . count($opts), 'label' => $label, 'odd' => $odd];
  }
  if (count($opts) < 2 || count($opts) > 6) return ['ok' => false, 'reason' => 'Il faut 2 à 6 choix'];
  $maxStake = max(1.0, min(1000.0, (float) ($in['maxStake'] ?? SP_DEFAULT_MAX_STAKE)));
  $id = preg_replace('/[^a-z0-9]/', '', (string) ($in['id'] ?? '')) ?: ('e' . bin2hex(random_bytes(5)));
  return sp_with('events.json', static function (array &$s) use ($id, $title, $in, $start, $opts, $maxStake) {
    foreach ((array) ($s['e'] ?? []) as $i => $e) {
      if ($e['id'] === $id) {
        if ($e['status'] !== 'open') return ['ok' => false, 'reason' => 'Match déjà fermé ou réglé'];
        // cotes modifiables tant qu'aucun pari n'est pris sur l'ancienne cote (les paris gardent LEUR cote de toute façon)
        $s['e'][$i] = array_merge($e, ['title' => $title, 'league' => sp_clean((string) ($in['league'] ?? ''), 40), 'sport' => sp_clean((string) ($in['sport'] ?? 'foot'), 12), 'start' => $start, 'opts' => $opts, 'maxStake' => $maxStake]);
        return ['ok' => true, 'id' => $id];
      }
    }
    $s['e'][] = ['id' => $id, 'title' => $title, 'league' => sp_clean((string) ($in['league'] ?? ''), 40), 'sport' => sp_clean((string) ($in['sport'] ?? 'foot'), 12), 'start' => $start,
      'opts' => $opts, 'maxStake' => $maxStake, 'status' => 'open', 'createdAt' => time()];
    // on garde au plus 300 matchs (les plus anciens réglés partent)
    if (count($s['e']) > 300) $s['e'] = array_slice($s['e'], -300);
    return ['ok' => true, 'id' => $id];
  });
}
function mb_strlen_safe(string $s): int { return (int) preg_match_all('/./us', $s); }

/** Le joueur parie (coupon). $sel = [[ev, k], …]. */
function sp_bet(array $db, array $user, string $mode, float $stake, array $sel, int $now = 0): array {
  $now = $now ?: time();
  $uid = (string) ($user['id'] ?? '');
  if ($uid === '') return ['ok' => false, 'reason' => 'login'];
  $mode = function_exists('casino_mode') ? casino_mode('real', false, $user) : 'real'; // v2690b : réel seulement (admin : solde de test)
  $stake = floor($stake * 100 + 1e-6) / 100;
  if ($stake + 1e-9 < SP_MIN) return ['ok' => false, 'reason' => 'min'];
  $sel = array_slice(array_values($sel), 0, SP_MAX_SEL + 1);
  if (!$sel || count($sel) > SP_MAX_SEL) return ['ok' => false, 'reason' => 'param'];
  $ev = []; foreach (sp_events() as $e) $ev[$e['id']] = $e;
  $picked = []; $odd = 1.0; $maxStake = 1000.0; $seen = [];
  foreach ($sel as $s) {
    $eid = (string) ($s['ev'] ?? $s[0] ?? ''); $k = (string) ($s['k'] ?? $s[1] ?? '');
    $e = $ev[$eid] ?? null;
    if (!$e || isset($seen[$eid])) return ['ok' => false, 'reason' => 'param'];
    if ($e['status'] !== 'open' || $now >= (int) $e['start']) return ['ok' => false, 'reason' => 'closed'];
    $o = null; foreach ($e['opts'] as $oo) if ($oo['k'] === $k) $o = $oo;
    if (!$o) return ['ok' => false, 'reason' => 'param'];
    $seen[$eid] = 1;
    $picked[] = ['ev' => $eid, 'k' => $k, 'odd' => (float) $o['odd'], 't' => $e['title'], 'l' => $o['label']];
    $odd *= (float) $o['odd'];
    $maxStake = min($maxStake, (float) ($e['maxStake'] ?? SP_DEFAULT_MAX_STAKE));
  }
  $odd = floor($odd * 100) / 100;
  if ($mode === 'real' && $stake > $maxStake + 1e-9) return ['ok' => false, 'reason' => 'max', 'maxStake' => $maxStake];
  if ($mode === 'real' && $stake * $odd > SP_MAX_WIN + 1e-9) return ['ok' => false, 'reason' => 'maxWin'];
  $ref = 'sp_' . bin2hex(random_bytes(9));
  $deb = casino_debit($db, $uid, $mode, $stake, $ref);
  if (empty($deb['ok'])) return ['ok' => false, 'reason' => $deb['reason'] ?? 'unavailable'];
  $bet = ['id' => $ref, 'uid' => $uid, 'mode' => $mode, 'stake' => $stake, 'odd' => $odd, 'pot' => casino_money(min(SP_MAX_WIN, $stake * $odd)), 'sel' => $picked, 'status' => 'open', 'at' => $now];
  sp_with('bets.json', static function (array &$s) use ($bet) { $s['b'][] = $bet; return true; });
  return ['ok' => true, 'bet' => sp_bet_public($bet), 'bal' => $deb['real'] ?? ($deb['demo'] ?? null)];
}

function sp_bet_public(array $b): array {
  return ['id' => $b['id'], 'mode' => $b['mode'], 'stake' => (float) $b['stake'], 'odd' => (float) $b['odd'], 'pot' => (float) $b['pot'], 'status' => $b['status'], 'win' => (float) ($b['win'] ?? 0), 'at' => (int) $b['at'],
    'sel' => array_map(static fn($s) => ['t' => $s['t'], 'l' => $s['l'], 'odd' => (float) $s['odd'], 'r' => $s['r'] ?? null], $b['sel'])];
}
function sp_my_bets(string $uid): array {
  $all = (array) (sp_with('bets.json', static fn(array &$s) => $s['b'] ?? []) ?: []);
  $mine = array_values(array_filter($all, static fn($b) => ($b['uid'] ?? '') === $uid));
  return array_map('sp_bet_public', array_slice(array_reverse($mine), 0, 40));
}

/** Admin : ferme les paris d'un match (plus personne ne peut parier dessus). */
function sp_admin_close(string $eid): array {
  return sp_with('events.json', static function (array &$s) use ($eid) {
    foreach ((array) ($s['e'] ?? []) as $i => $e) if ($e['id'] === $eid && $e['status'] === 'open') { $s['e'][$i]['status'] = 'closed'; return ['ok' => true]; }
    return ['ok' => false, 'reason' => 'Match introuvable ou déjà fermé'];
  });
}

/**
 * Admin : résultat d'un match ($k = choix gagnant, ou 'void' = match annulé). Puis on règle tous les coupons dont TOUS
 * les matchs sont terminés. Paiement une seule fois par coupon (référence unique).
 */
function sp_admin_settle(array $db, string $eid, string $k): array {
  $r = sp_with('events.json', static function (array &$s) use ($eid, $k) {
    foreach ((array) ($s['e'] ?? []) as $i => $e) {
      if ($e['id'] !== $eid) continue;
      if ($e['status'] === 'settled') return ['ok' => false, 'reason' => 'Résultat déjà donné'];
      $valid = $k === 'void'; foreach ($e['opts'] as $o) if ($o['k'] === $k) $valid = true;
      if (!$valid) return ['ok' => false, 'reason' => 'Choix inconnu'];
      $s['e'][$i]['status'] = 'settled'; $s['e'][$i]['result'] = $k; $s['e'][$i]['settledAt'] = time();
      return ['ok' => true];
    }
    return ['ok' => false, 'reason' => 'Match introuvable'];
  });
  if (empty($r['ok'])) return $r;
  return ['ok' => true] + sp_resolve($db);
}

/** Règle les coupons prêts. Retour : nombre de coupons gagnés / perdus / payés. */
function sp_resolve(array $db): array {
  $res = []; foreach (sp_events() as $e) if ($e['status'] === 'settled') $res[$e['id']] = $e['result'];
  $todo = sp_with('bets.json', static function (array &$s) use ($res) {
    $pay = [];
    foreach ((array) ($s['b'] ?? []) as $i => $b) {
      if ($b['status'] !== 'open') continue;
      $lost = false; $ready = true; $odd = 1.0;
      foreach ($b['sel'] as $j => $sel) {
        if (!isset($res[$sel['ev']])) { $ready = false; continue; }
        $rk = $res[$sel['ev']];
        $s['b'][$i]['sel'][$j]['r'] = $rk === 'void' ? 'void' : ($rk === $sel['k'] ? 'won' : 'lost');
        if ($rk === 'void') continue;
        if ($rk !== $sel['k']) $lost = true; else $odd *= (float) $sel['odd'];
      }
      if ($lost) { $s['b'][$i]['status'] = 'lost'; $s['b'][$i]['win'] = 0.0; $pay[] = ['i' => $b['id'], 'uid' => $b['uid'], 'mode' => $b['mode'], 'w' => 0.0, 's' => $b['stake']]; continue; }
      if (!$ready) continue;
      $win = casino_money(min(SP_MAX_WIN, (float) $b['stake'] * (floor($odd * 100) / 100)));
      $s['b'][$i]['status'] = 'won'; $s['b'][$i]['win'] = $win;
      $pay[] = ['i' => $b['id'], 'uid' => $b['uid'], 'mode' => $b['mode'], 'w' => $win, 's' => $b['stake']];
    }
    return $pay;
  }) ?: [];
  $won = 0; $lostN = 0; $paidFail = 0;
  foreach ($todo as $p) {
    $bal = casino_credit($db, (string) $p['uid'], (string) $p['mode'], (float) $p['w'], (string) $p['i']);
    if ($bal === null && $p['mode'] === 'real') { $paidFail++; sp_mark_unpaid((string) $p['i']); continue; }
    casino_stat('sports', (string) $p['mode'], (float) $p['s'], (float) $p['w']);
    if ($p['w'] > 0) $won++; else $lostN++;
  }
  return ['won' => $won, 'lost' => $lostN, 'retry' => $paidFail];
}
/** Base injoignable pendant le paiement : le coupon repasse « ouvert » pour être réglé au prochain clic (référence unique : jamais payé 2 fois). */
function sp_mark_unpaid(string $id): void {
  sp_with('bets.json', static function (array &$s) use ($id) { foreach ($s['b'] as $i => $b) if ($b['id'] === $id) $s['b'][$i]['status'] = 'open'; return true; });
}

/** Admin : liste des matchs avec le total misé par choix (pour voir le risque). */
function sp_admin_list(): array {
  $bets = (array) (sp_with('bets.json', static fn(array &$s) => $s['b'] ?? []) ?: []);
  $exp = [];
  foreach ($bets as $b) {
    if ($b['mode'] !== 'real') continue;
    foreach ($b['sel'] as $s) {
      $exp[$s['ev']][$s['k']]['n'] = ($exp[$s['ev']][$s['k']]['n'] ?? 0) + 1;
      $exp[$s['ev']][$s['k']]['in'] = ($exp[$s['ev']][$s['k']]['in'] ?? 0) + (float) $b['stake'];
      if ($b['status'] === 'open') $exp[$s['ev']][$s['k']]['risk'] = ($exp[$s['ev']][$s['k']]['risk'] ?? 0) + (float) $b['pot'];
    }
  }
  $out = [];
  foreach (array_reverse(sp_events()) as $e) { $e['exp'] = $exp[$e['id']] ?? []; $out[] = $e; }
  return $out;
}
