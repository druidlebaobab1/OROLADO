<?php
declare(strict_types=1);
/**
 * 2026-10-22 (propriétaire) — PRÉDICTIONS « Predict » (nom affiché : clé i18n predName, js/i18n-src.js → PRED_NAME ; même mot dans les 12 langues).
 * Événements façon Polymarket / Kalshi / « specials » des bookmakers : crypto, politique, économie, divertissement, sport,
 * tech, monde. Ce sont des QUESTIONS de sports_lib.php (sport « pred ») : mêmes paris (sp_bet), même coupon (simple
 * seulement, groupes de corrélation), même règlement (sp_admin_settle → sp_resolve, payé UNE fois par référence).
 *
 *  - Import (admin) d'une liste JSON : [{id, cat, title_fr, title_en, options:[{k, fr, en, p}], closeAt, resolveAt (ISO UTC),
 *    auto, asset "BTCUSDT", rule {type:above|below, value} | {type:range, ranges:[[lo,hi],…]}, source}].
 *    Cote = floor((1 − m) ÷ p × 100) ÷ 100, au moins 1,01 ; m = marge « mPred » (réglage admin, 20 % par défaut).
 *    Refusé si la maison pouvait perdre à coup sûr (somme des 1/cote < 1). Réimport du même id (ouvert) = cotes remises à jour.
 *  - Paris fermés à closeAt (sp_bet). Question de prix (crypto) : au plus 72 h après la pose des cotes (règle v2810).
 *  - Crypto (auto = true) : cotes RECALCULÉES toutes les 5 min sur le prix actuel (modèle log-normal, pred_reprice_job),
 *    paris suspendus si le prix manque depuis plus de 10 min. Après resolveAt : prix de clôture de la bougie 1 min Binance qui
 *    se FERME à resolveAt (data-api.binance.vision, sinon api.binance.com) → résultat PROPOSÉ dans la liste « à vérifier ».
 *    Prix pile sur une limite / hors des tranches → « à vérifier » sans proposition (jamais deviné). Injoignable → réessayé.
 *  - RÈGLEMENT : TOUJOURS par l'admin (propriétaire, 2026-10-22 : jamais de paiement automatique) — un clic confirme le
 *    résultat proposé (ou un autre choix, ou Annulé = mises rendues) ; liste « Predict » de l'admin avec le lien de la source.
 * Tests : php scripts/test-pred.php (Binance simulé : $GLOBALS['PRED_FAKE_FETCH']).
 */

const PRED_CATS = ['crypto', 'politique', 'economie', 'divertissement', 'sport', 'tech', 'monde'];
const PRED_M_DEFAULT = 20.0;      // marge par défaut (%) — réglage « mPred » de l'admin (carte des paris automatiques)
const PRED_JOB_EVERY = 60;        // tâche de règlement : au plus une fois par minute
const PRED_JOB_FETCH = 6;         // lectures Binance au plus par passage
const PRED_RETRY_MAX = 172800;    // Binance injoignable : réessayé pendant 48 h (puis seulement par l'admin)
// données publiques de marché : data-api.binance.vision d'abord (joignable partout), api.binance.com en secours
const PRED_BINANCE = ['https://data-api.binance.vision/api/v3', 'https://api.binance.com/api/v3'];
const PRED_REPRICE_EVERY = 300;   // cotes des prédictions crypto automatiques recalculées au plus toutes les 5 min
const PRED_PX_FRESH = 60;         // prix utilisé pour les cotes : 60 s au plus (jamais un vieux prix)
const PRED_PX_SUSP = 600;         // prix introuvable depuis plus de 10 min : paris suspendus (cadenas)
const PRED_P_MAX = 0.97;          // choix presque certain (> 97 %) : retiré (pas de pari « gagné d'avance »)
const PRED_P_MIN = 0.02;          // chance minimale prise pour la cote (cote ≤ 40 avec 20 % : la queue du modèle reste prudente)

function pred_is(array $e): bool { return ($e['sport'] ?? '') === 'pred'; }
/** Paris suspendus ? Crypto auto : suspendue par la tâche, ou cotes de plus de 15 min (la tâche ne passe plus : jamais une vieille cote). */
function pred_stale(array $e, int $now): bool {
  if (empty($e['pred']['auto'])) return false;
  return !empty($e['pred']['susp']) || (int) ($e['pred']['pxAt'] ?? 0) < $now - PRED_REPRICE_EVERY - PRED_PX_SUSP;
}
function pred_cat(string $c): string {
  $c = sp_lower(trim($c));
  $c = strtr($c, ['é' => 'e', 'è' => 'e', 'ê' => 'e']);
  $al = ['politics' => 'politique', 'economy' => 'economie', 'eco' => 'economie', 'finance' => 'economie', 'entertainment' => 'divertissement',
    'culture' => 'divertissement', 'divert' => 'divertissement', 'sports' => 'sport', 'technology' => 'tech', 'world' => 'monde', 'geopolitics' => 'monde'];
  $c = $al[$c] ?? $c;
  return in_array($c, PRED_CATS, true) ? $c : '';
}
/** Marge des prédictions (fraction : 0,20). Réglage admin « mPred » (sb_lib.php), 20 % sans lui. */
function pred_margin(): float {
  $m = PRED_M_DEFAULT;
  if (function_exists('sb_config')) { try { $m = (float) (sb_config()['mPred'] ?? PRED_M_DEFAULT); } catch (Throwable $e) { $m = PRED_M_DEFAULT; } }
  return max(0.02, min(0.40, $m / 100));
}
/** Cote d'une chance $p avec la marge $m : floor((1 − m) ÷ p × 100) ÷ 100, au moins 1,01. */
function pred_odd(float $p, float $m): float {
  if ($p <= 0) return 1.01;
  return max(1.01, floor((1 - $m) / $p * 100 + 1e-7) / 100);
}
function pred_ts($v): int {
  if (is_int($v) || (is_numeric($v) && (float) $v > 1e9)) return (int) $v;
  $s = trim((string) $v);
  if ($s === '' || !preg_match('/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/i', $s)) return 0;
  if (!preg_match('/(Z|[+-]\d{2}:?\d{2})$/i', $s)) $s .= 'Z'; // heures en UTC
  $t = strtotime($s);
  return $t === false ? 0 : (int) $t;
}
function pred_num($v): ?float { return is_int($v) || is_float($v) || (is_string($v) && is_numeric($v)) ? (float) $v : null; }
/** Image d'une question crypto (icônes déjà dessinées par le site) d'après l'actif Binance. */
function pred_logo(string $asset): array {
  foreach (['BTC' => 'btc', 'ETH' => 'eth', 'SOL' => 'sol', 'XRP' => 'xrp', 'DOGE' => 'doge'] as $p => $k) if (str_starts_with($asset, $p)) return ['q:' . $k];
  return [];
}

/**
 * Vérifie une ligne du fichier et la transforme en événement (sans id ni dates d'enregistrement).
 * Retour : ['ok' => true, 'ev' => […]] ou ['ok' => false, 'reason' => '…'].
 */
function pred_row(array $r, float $m, int $now): array {
  $sid = substr((string) preg_replace('/[^a-z0-9]/', '', sp_lower((string) ($r['id'] ?? ''))), 0, 40);
  if ($sid === '') return ['ok' => false, 'reason' => 'id manquant'];
  $cat = pred_cat((string) ($r['cat'] ?? ''));
  if ($cat === '') return ['ok' => false, 'reason' => 'catégorie inconnue « ' . sp_clean((string) ($r['cat'] ?? ''), 30) . ' »'];
  $fr = sp_clean((string) ($r['title_fr'] ?? ''), 240); $en = sp_clean((string) ($r['title_en'] ?? ''), 240);
  if (mb_strlen_safe($fr) < 3) return ['ok' => false, 'reason' => 'title_fr manquant'];
  $close = pred_ts($r['closeAt'] ?? ''); $res = pred_ts($r['resolveAt'] ?? '');
  if (!$close) return ['ok' => false, 'reason' => 'closeAt invalide'];
  if (!$res) return ['ok' => false, 'reason' => 'resolveAt invalide'];
  if ($res < $close) return ['ok' => false, 'reason' => 'resolveAt avant closeAt'];
  if ($close < $now + 120) return ['ok' => false, 'reason' => 'closeAt passé'];
  $in = array_values(array_filter((array) ($r['options'] ?? []), 'is_array'));
  if (count($in) < 2 || count($in) > 6) return ['ok' => false, 'reason' => 'il faut 2 à 6 options'];
  $opts = []; $seen = []; $sp = 0.0; $inv = 0.0;
  foreach ($in as $i => $o) {
    $k = substr((string) preg_replace('/[^a-z0-9_]/', '', sp_lower((string) ($o['k'] ?? ''))), 0, 16);
    if ($k === '') $k = 'o' . $i;
    if (isset($seen[$k])) return ['ok' => false, 'reason' => 'option en double : ' . $k];
    $seen[$k] = 1;
    $lf = sp_clean((string) ($o['fr'] ?? ''), 90); $le = sp_clean((string) ($o['en'] ?? ''), 90);
    if ($lf === '') return ['ok' => false, 'reason' => 'option sans texte fr : ' . $k];
    $p = pred_num($o['p'] ?? null);
    if ($p === null || $p < 0.005 || $p > 0.99) return ['ok' => false, 'reason' => 'chance p invalide (0,005 à 0,99) : ' . $k];
    $odd = pred_odd($p, $m);
    $sp += $p; $inv += 1 / $odd;
    $opts[] = ['k' => $k, 'label' => $lf] + ($le !== '' ? ['en' => $le] : []) + ['odd' => $odd, 'p' => round($p, 4)];
  }
  if ($sp < 0.95 || $sp > 1.25) return ['ok' => false, 'reason' => 'somme des chances ' . round($sp, 3) . ' (attendu ≈ 1 : options complètes et exclusives)'];
  if ($inv < 1.0 - 1e-9) return ['ok' => false, 'reason' => 'cotes trop hautes : la maison perdrait à coup sûr (somme des 1/cote < 1)'];
  $auto = !empty($r['auto']);
  $asset = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', (string) ($r['asset'] ?? '')) ?? '');
  $rule = null;
  if ($auto) {
    if ((string) (((array) ($r['rule'] ?? []))['type'] ?? '') === 'best_performer') return ['ok' => false, 'reason' => 'auto : « meilleure crypto » non prise en charge (cotes impossibles à recalculer sans risque)'];
    if (!preg_match('/^[A-Z0-9]{5,20}$/', $asset)) return ['ok' => false, 'reason' => 'auto : actif Binance invalide'];
    $rr = (array) ($r['rule'] ?? []); $t = (string) ($rr['type'] ?? '');
    if ($t === 'above' || $t === 'below') {
      $v = pred_num($rr['value'] ?? null);
      if ($v === null || $v <= 0) return ['ok' => false, 'reason' => 'auto : rule.value invalide'];
      if (count($opts) !== 2) return ['ok' => false, 'reason' => 'auto : above / below = 2 options (oui puis non)'];
      $rule = ['type' => $t, 'value' => $v];
    } elseif ($t === 'range') {
      $rg = array_values((array) ($rr['ranges'] ?? []));
      if (count($rg) !== count($opts)) return ['ok' => false, 'reason' => 'auto : autant de tranches que d\'options'];
      $out = [];
      foreach ($rg as $x) {
        $x = array_values((array) $x);
        $lo = ($x[0] ?? null) === null ? null : pred_num($x[0]); $hi = ($x[1] ?? null) === null ? null : pred_num($x[1]);
        if ((($x[0] ?? null) !== null && $lo === null) || (($x[1] ?? null) !== null && $hi === null) || ($lo !== null && $hi !== null && $lo >= $hi)) return ['ok' => false, 'reason' => 'auto : tranche invalide'];
        $out[] = [$lo, $hi];
      }
      $rule = ['type' => 'range', 'ranges' => $out];
    } elseif ($t === 'best_performer') return ['ok' => false, 'reason' => 'auto : « meilleure crypto » non prise en charge (cotes impossibles à recalculer sans risque)'];
    else return ['ok' => false, 'reason' => 'auto : rule.type inconnu'];
  }
  $df = sp_clean((string) ($r['desc_fr'] ?? ''), 400); $de = sp_clean((string) ($r['desc_en'] ?? ''), 400); // explication courte (fiche de l'événement)
  $src = trim((string) ($r['source'] ?? ''));
  if ($src !== '' && !preg_match('#^https?://[^\s"<>]{3,400}$#', $src)) $src = '';
  return ['ok' => true, 'sid' => $sid, 'ev' => [
    'id' => 'pd' . $sid, 'title' => $fr, 'league' => '', 'sport' => 'pred', 'cat' => $cat, 'start' => $close, 'closeMax' => $close, 'endAt' => $res,
    'opts' => $opts, 'maxStake' => 1000, 'logos' => $auto ? pred_logo($asset) : [],
    'pred' => ['auto' => $auto, 'asset' => $auto ? $asset : '', 'rule' => $rule, 'src' => $src, 'm' => round($m * 100, 1), 'sid' => (string) ($r['id'] ?? '')]
      + ($auto ? ['susp' => 1, 'pxAt' => 0] : []) // crypto auto : AUCUN pari tant que les cotes n'ont pas été calculées sur le prix actuel
      + ($auto && ($vv = pred_num($r['vol'] ?? null)) !== null && $vv > 0 && $vv < 0.5 ? ['vol' => $vv] : []),
  ] + ($en !== '' ? ['i18n' => ['en' => $en]] : []) + ($df !== '' || $de !== '' ? ['desc' => array_filter(['fr' => $df, 'en' => $de], 'strlen')] : [])];
}

/** Admin : importe la liste (tableau ou texte JSON). Retour : ajoutés, mis à jour, refusés (avec la raison). */
function pred_import($list, int $now = 0): array {
  $now = $now ?: time();
  if (is_string($list)) { $list = json_decode($list, true); if (!is_array($list)) return ['ok' => false, 'reason' => 'JSON invalide']; }
  if (isset($list['events']) && is_array($list['events'])) $list = $list['events'];
  if (!is_array($list) || !array_is_list($list)) return ['ok' => false, 'reason' => 'Il faut une liste [ … ]'];
  if (count($list) > 400) return ['ok' => false, 'reason' => '400 événements au plus par import'];
  $m = pred_margin();
  $rows = []; $bad = [];
  foreach ($list as $i => $r) {
    if (!is_array($r)) { $bad[] = ['id' => '#' . $i, 'reason' => 'pas un objet']; continue; }
    $x = pred_row($r, $m, $now);
    if (empty($x['ok'])) { $bad[] = ['id' => (string) ($r['id'] ?? '#' . $i), 'reason' => $x['reason']]; continue; }
    if (isset($rows[$x['ev']['id']])) { $bad[] = ['id' => (string) $r['id'], 'reason' => 'id en double dans le fichier']; continue; }
    $rows[$x['ev']['id']] = $x['ev'];
  }
  $res = sp_with('events.json', static function (array &$s) use ($rows, $now, &$bad) {
    $idx = []; foreach ((array) ($s['e'] ?? []) as $i => $e) $idx[(string) $e['id']] = $i;
    $add = 0; $upd = 0;
    foreach ($rows as $id => $ev) {
      if (isset($idx[$id])) {
        $old = $s['e'][$idx[$id]];
        if (!pred_is($old)) { $bad[] = ['id' => $ev['pred']['sid'], 'reason' => 'id déjà pris par un autre événement']; continue; }
        if (($old['status'] ?? '') !== 'open') { $bad[] = ['id' => $ev['pred']['sid'], 'reason' => 'déjà fermé ou réglé (inchangé)']; continue; }
        if (array_column((array) $old['opts'], 'k') !== array_column($ev['opts'], 'k')) { $bad[] = ['id' => $ev['pred']['sid'], 'reason' => 'options différentes de celles en ligne (inchangé)']; continue; }
        // cotes remises à jour (les paris déjà pris gardent LEUR cote) ; la date des cotes repart de maintenant
        $s['e'][$idx[$id]] = array_merge($old, $ev, ['pricedAt' => $now, 'status' => 'open']);
        unset($s['e'][$idx[$id]]['predChk'], $s['e'][$idx[$id]]['hold']);
        $upd++;
        continue;
      }
      $s['e'][] = $ev + ['status' => 'open', 'createdAt' => $now, 'pricedAt' => $now];
      $add++;
    }
    $s['e'] = sp_prune_events(array_values((array) ($s['e'] ?? [])));
    return ['added' => $add, 'updated' => $upd];
  });
  if (!is_array($res)) return ['ok' => false, 'reason' => 'Fichier des événements occupé, réessayez'];
  return ['ok' => true, 'added' => $res['added'], 'updated' => $res['updated'], 'skipped' => $bad, 'margin' => round($m * 100, 1)];
}

/** La marge mPred a changé : cotes des prédictions OUVERTES recalculées depuis leurs chances (paris déjà pris : leur cote). */
function pred_reprice(?float $m = null): int {
  $m = $m ?? pred_margin();
  return (int) sp_with('events.json', static function (array &$s) use ($m) {
    $n = 0;
    foreach ((array) ($s['e'] ?? []) as $i => $e) {
      if (!pred_is($e) || ($e['status'] ?? '') !== 'open' || !empty($e['pred']['auto'])) continue; // crypto auto : recalculées par pred_reprice_job
      $opts = $e['opts']; $inv = 0.0; $ok = true;
      foreach ($opts as $j => $o) { if (empty($o['p'])) { $ok = false; break; } $opts[$j]['odd'] = pred_odd((float) $o['p'], $m); $inv += 1 / $opts[$j]['odd']; }
      if (!$ok || $inv < 1.0 - 1e-9 || $opts === $e['opts']) continue;
      $s['e'][$i]['opts'] = $opts; $s['e'][$i]['pred']['m'] = round($m * 100, 1); $n++;
    }
    return $n;
  });
}

/* ------------------------------------------------------------- règlement automatique (crypto, Binance) -------------- */

function pred_http(string $url): string {
  $f = $GLOBALS['PRED_FAKE_FETCH'] ?? null;
  if (is_callable($f)) return (string) $f($url);
  return sp_http_get($url, 20000);
}
/** Prix de CLÔTURE de la bougie 1 min qui se FERME à $ts (closeTime = $ts − 1 ms : à 00:00 UTC, la clôture du jour).
 *  ['ok', 'px', 'src'] / ['wait'] / ['ok' => false, 'why']. */
function pred_kline_close(string $asset, int $ts, int $now): array {
  $min = intdiv($ts, 60) * 60 - 60;
  if ($now < $min + 65) return ['ok' => false, 'wait' => true, 'why' => 'bougie pas encore finie'];
  $why = [];
  foreach (PRED_BINANCE as $base) {
    $url = $base . '/klines?symbol=' . rawurlencode($asset) . '&interval=1m&startTime=' . ($min * 1000) . '&limit=1';
    $raw = '';
    try { $raw = pred_http($url); } catch (Throwable $e) { $raw = ''; }
    $j = $raw !== '' ? json_decode($raw, true) : null;
    $host = (string) parse_url($base, PHP_URL_HOST);
    if (!is_array($j) || !isset($j[0]) || !is_array($j[0])) { $why[] = $host . ' : pas de réponse'; continue; }
    $k = $j[0];
    if ((int) ($k[0] ?? 0) !== $min * 1000) { $why[] = $host . ' : bougie d\'une autre minute'; continue; }
    $c = pred_num($k[4] ?? null);
    if ($c === null || $c <= 0) { $why[] = $host . ' : prix illisible'; continue; }
    return ['ok' => true, 'px' => $c, 'src' => $host];
  }
  return ['ok' => false, 'why' => 'Binance injoignable (' . implode(' ; ', $why) . ')'];
}
function pred_eq(float $a, float $b): bool { return abs($a - $b) <= 1e-9 * max(1.0, abs($a), abs($b)); }
/** Choix gagnant d'après le prix, ou ['why'] si ce n'est pas CERTAIN (pile sur une limite, hors des tranches…). */
function pred_outcome(array $e, float $px): array {
  $rule = (array) ($e['pred']['rule'] ?? []); $ks = array_column((array) $e['opts'], 'k');
  $t = (string) ($rule['type'] ?? '');
  if ($t === 'above' || $t === 'below') {
    $v = (float) $rule['value'];
    if (pred_eq($px, $v)) return ['why' => 'prix pile sur la limite ' . $v];
    $yes = in_array('yes', $ks, true) ? 'yes' : (in_array('oui', $ks, true) ? 'oui' : $ks[0]);
    $no = in_array('no', $ks, true) ? 'no' : (in_array('non', $ks, true) ? 'non' : $ks[1]);
    if ($yes === $no) return ['why' => 'options oui / non introuvables'];
    $true = $t === 'above' ? $px > $v : $px < $v;
    return ['k' => $true ? $yes : $no];
  }
  if ($t === 'range') {
    $hit = [];
    foreach ((array) $rule['ranges'] as $i => [$lo, $hi]) {
      if (($lo !== null && pred_eq($px, (float) $lo)) || ($hi !== null && pred_eq($px, (float) $hi))) return ['why' => 'prix pile sur une limite de tranche'];
      if (($lo === null || $px > (float) $lo) && ($hi === null || $px < (float) $hi)) $hit[] = $ks[$i] ?? null;
    }
    if (count($hit) !== 1 || $hit[0] === null) return ['why' => count($hit) ? 'prix dans plusieurs tranches' : 'prix hors de toutes les tranches'];
    return ['k' => $hit[0]];
  }
  return ['why' => 'règle inconnue'];
}
/**
 * Lit le prix Binance des prédictions automatiques dont l'heure est passée et PROPOSE le résultat (predChk.sug) : rien n'est
 * jamais payé ici — l'admin confirme (sp_admin_settle, référence unique par coupon). $force = sans l'attente d'une minute.
 */
function pred_auto_run(?array $db = null, int $now = 0, bool $force = false): array {
  $now = $now ?: (function_exists('sb_now') ? sb_now() : time());
  $at = sp_dir() . DIRECTORY_SEPARATOR . 'pred-job.at';
  clearstatcache(true, $at);
  if (!$force && is_file($at) && filemtime($at) > $now - PRED_JOB_EVERY) return ['ok' => true, 'skip' => 1];
  $lk = @fopen($at . '.lock', 'c');
  if (!$lk || !flock($lk, LOCK_EX | LOCK_NB)) { if ($lk) fclose($lk); return ['ok' => true, 'skip' => 1]; }
  $out = ['ok' => true, 'settled' => 0, 'chk' => 0, 'wait' => 0, 'fetch' => 0, 'log' => []];
  try {
    @touch($at, $now);
    $due = [];
    foreach (sp_events() as $e) {
      if (!pred_is($e) || empty($e['pred']['auto']) || !in_array($e['status'] ?? '', ['open', 'closed'], true)) continue;
      $end = (int) ($e['endAt'] ?? 0);
      if (!$end || $now < $end) continue;
      $c = (array) ($e['predChk'] ?? []);
      if (!empty($c['final'])) continue;                                                     // à vérifier pour toujours (l'admin)
      if (!$force && $c && $now > $end + PRED_RETRY_MAX) continue;                            // injoignable depuis 48 h : l'admin
      if (!$force && $c && (int) ($c['at'] ?? 0) > $now - 300) continue;                       // réessai au plus toutes les 5 min
      $due[] = $e;
    }
    foreach ($due as $e) {
      if ($out['fetch'] >= PRED_JOB_FETCH) break;
      $k = pred_kline_close((string) $e['pred']['asset'], (int) $e['endAt'], $now);
      if (!empty($k['wait'])) { $out['wait']++; continue; }
      $out['fetch']++;
      $chk = null; $win = null;
      if (empty($k['ok'])) $chk = ['why' => (string) $k['why'], 'at' => $now, 'final' => 0];
      else {
        $o = pred_outcome($e, (float) $k['px']);
        if (isset($o['k'])) { $win = (string) $o['k']; $chk = ['why' => 'Résultat proposé d\'après le prix Binance : à confirmer', 'sug' => $win, 'px' => (float) $k['px'], 'src' => $k['src'], 'at' => $now, 'final' => 1]; }
        else $chk = ['why' => (string) $o['why'], 'px' => (float) $k['px'], 'src' => $k['src'], 'at' => $now, 'final' => 1];
      }
      $id = (string) $e['id'];
      sp_with('events.json', static function (array &$s) use ($id, $chk, $k, $now) {
        foreach ((array) ($s['e'] ?? []) as $i => $x) {
          if ($x['id'] !== $id) continue;
          if ($chk) { $chk['n'] = (int) ($x['predChk']['n'] ?? 0) + 1; $s['e'][$i]['predChk'] = $chk; }
          if (!empty($k['ok'])) $s['e'][$i]['predPx'] = ['px' => (float) $k['px'], 'src' => (string) $k['src'], 'at' => $now];
          if (($s['e'][$i]['status'] ?? '') === 'open') $s['e'][$i]['status'] = 'closed'; // l'heure est passée : plus aucun pari
          return true;
        }
        return true;
      });
      // propriétaire (2026-10-22) : JAMAIS de paiement automatique — résultat PROPOSÉ (ou douteux) → liste « à vérifier » de l'admin
      $out['chk']++; if ($win !== null) $out['sug'] = ($out['sug'] ?? 0) + 1;
      $out['log'][] = $e['title'] . ' : ' . ($win !== null ? 'proposé « ' . $win . ' » (prix ' . $k['px'] . ')' : $chk['why']);
      if (empty($e['predChk']) && function_exists('sb_alert')) { try { sb_alert('✋ Predict : résultat à valider', $e['title'] . ' — ' . ($win !== null ? 'proposé : ' . $win : $chk['why']), $now); } catch (Throwable $ex) { /* jamais bloquant */ } }
    }
  } catch (Throwable $ex) {
    $out['log'][] = 'erreur : ' . $ex->getMessage();
  } finally { flock($lk, LOCK_UN); fclose($lk); }
  return $out;
}
/**
 * Prix ACTUEL d'un actif (fiche d'une prédiction crypto) : lu par NOTRE serveur (le téléphone n'appelle jamais Binance),
 * gardé 30 s dans un fichier partagé ; seulement les actifs des prédictions publiées. ['ok', 'px', 'at'] ou ['ok' => false].
 */
function pred_price(string $asset, int $now = 0, bool $any = false): array {
  $now = $now ?: time();
  $asset = strtoupper((string) preg_replace('/[^A-Za-z0-9]/', '', $asset));
  if (!preg_match('/^[A-Z0-9]{5,20}$/', $asset)) return ['ok' => false, 'reason' => 'param'];
  $f = sp_dir() . DIRECTORY_SEPARATOR . 'pred-px-' . $asset . '.json';
  clearstatcache(true, $f);
  $c = is_file($f) ? json_decode((string) @file_get_contents($f), true) : null; $c = is_array($c) ? $c : [];
  $okAt = (int) ($c['okAt'] ?? 0);
  if ((int) ($c['at'] ?? 0) > $now - 30) return $okAt > $now - 30 ? ['ok' => true, 'px' => (float) $c['px'], 'at' => $okAt] : ['ok' => false, 'reason' => 'unavailable', 'okAt' => $okAt];
  if (!$any) {
    $known = false;
    foreach (sp_events() as $e) if (pred_is($e) && ($e['pred']['asset'] ?? '') === $asset && ($e['status'] ?? '') !== 'settled') { $known = true; break; }
    if (!$known) return ['ok' => false, 'reason' => 'param'];
  }
  $px = 0.0;
  foreach (PRED_BINANCE as $base) {
    $j = json_decode(pred_http($base . '/ticker/price?symbol=' . rawurlencode($asset)), true);
    $v = is_array($j) ? pred_num($j['price'] ?? null) : null;
    if ($v !== null && $v > 0 && ($j['symbol'] ?? $asset) === $asset) { $px = $v; break; }
  }
  // échec : noté aussi (jamais plus d'une lecture par actif toutes les 30 s, même si Binance est injoignable) ; le dernier BON prix reste daté
  $c = $px > 0 ? ['px' => $px, 'okAt' => $now, 'at' => $now] : ['px' => (float) ($c['px'] ?? 0), 'okAt' => $okAt, 'at' => $now];
  @file_put_contents($f, json_encode($c), LOCK_EX);
  return $px > 0 ? ['ok' => true, 'px' => $px, 'at' => $now] : ['ok' => false, 'reason' => 'unavailable', 'okAt' => $okAt];
}

/* ------------------------------------------------------------- cotes automatiques des prédictions crypto ------------ */
/*
 * SÉCURITÉ (propriétaire, 2026-10-22) : une prédiction crypto automatique ne garde JAMAIS des cotes fixes pendant des semaines
 * (le prix bouge : quelqu'un parierait sur un choix devenu presque sûr à une vieille cote). Toutes les 5 min au plus :
 *  - prix actuel (pred_price, 60 s au plus) et volatilité journalière de l'actif (champ « vol » du fichier, sinon calculée
 *    sur les 30 dernières clôtures journalières Binance, gardée 24 h) ;
 *  - chance de chaque choix à l'heure de la réponse : modèle log-normal sans dérive (au-dessus / en dessous / tranches) ;
 *  - cote = floor((1 − mPred) ÷ p × 100) ÷ 100, au moins 1,01 ; chance prise au moins 2 % ; choix à plus de 97 % retiré ;
 *  - prix introuvable depuis plus de 10 min (ou jamais calculé) : paris SUSPENDUS (cadenas) — jamais un vieux prix.
 * Un pari prend la cote ACTUELLE du serveur (cote changée → refus « odds », le joueur revoit son ticket).
 */
function pred_ncdf(float $x): float { // fonction de répartition de la loi normale (Abramowitz-Stegun 7.1.26, erreur < 1,5e-7)
  $z = abs($x) / M_SQRT2; $t = 1 / (1 + 0.3275911 * $z);
  $erf = 1 - ((((1.061405429 * $t - 1.453152027) * $t + 1.421413741) * $t - 0.284496736) * $t + 0.254829592) * $t * exp(-$z * $z);
  return $x >= 0 ? 0.5 * (1 + $erf) : 0.5 * (1 - $erf);
}
/** P(prix à l'échéance > $k) : log-normal sans dérive, $s0 prix actuel, $vol volatilité JOURNALIÈRE, $days jours restants. */
function pred_p_above(float $s0, float $k, float $vol, float $days): float {
  if ($k <= 0) return 1.0;
  $sd = $vol * sqrt(max($days, 1 / 1440));
  return pred_ncdf((log($s0 / $k) - $sd * $sd / 2) / $sd);
}
/** Chances des choix d'une règle (above / below / range) ; null si la règle n'est pas prise en charge. */
function pred_model_probs(array $rule, float $s0, float $vol, float $days): ?array {
  $t = (string) ($rule['type'] ?? '');
  if ($t === 'above') { $p = pred_p_above($s0, (float) $rule['value'], $vol, $days); return [$p, 1 - $p]; }
  if ($t === 'below') { $p = pred_p_above($s0, (float) $rule['value'], $vol, $days); return [1 - $p, $p]; }
  if ($t === 'range') {
    $out = [];
    foreach ((array) $rule['ranges'] as [$lo, $hi]) $out[] = max(0.0, ($lo === null ? 1.0 : pred_p_above($s0, (float) $lo, $vol, $days)) - ($hi === null ? 0.0 : pred_p_above($s0, (float) $hi, $vol, $days)));
    return $out;
  }
  return null;
}
/** Volatilité journalière d'un actif : écart-type des rendements log des 30 dernières clôtures journalières Binance (gardé 24 h). */
function pred_vol(string $asset, int $now): ?float {
  $f = sp_dir() . DIRECTORY_SEPARATOR . 'pred-vol-' . $asset . '.json';
  $c = is_file($f) ? json_decode((string) @file_get_contents($f), true) : null;
  if (is_array($c) && (int) ($c['at'] ?? 0) > $now - 86400 && (float) ($c['vol'] ?? 0) > 0) return (float) $c['vol'];
  if (is_array($c) && (int) ($c['try'] ?? 0) > $now - 600) return (float) ($c['vol'] ?? 0) > 0 && (int) ($c['at'] ?? 0) > $now - 3 * 86400 ? (float) $c['vol'] : null;
  $vol = null;
  foreach (PRED_BINANCE as $base) {
    $j = json_decode(pred_http($base . '/klines?symbol=' . rawurlencode($asset) . '&interval=1d&limit=31'), true);
    if (!is_array($j) || count($j) < 21) continue;
    $cl = []; foreach ($j as $k) { $v = is_array($k) ? pred_num($k[4] ?? null) : null; if ($v !== null && $v > 0) $cl[] = $v; }
    if (count($cl) < 21) continue;
    $r = []; for ($i = 1; $i < count($cl); $i++) $r[] = log($cl[$i] / $cl[$i - 1]);
    $m = array_sum($r) / count($r); $v2 = 0.0; foreach ($r as $x) $v2 += ($x - $m) ** 2;
    $vol = sqrt($v2 / (count($r) - 1));
    break;
  }
  if ($vol !== null && $vol > 0) { $vol = max(0.002, min(0.5, $vol)); @file_put_contents($f, json_encode(['vol' => $vol, 'at' => $now, 'try' => $now]), LOCK_EX); return $vol; }
  @file_put_contents($f, json_encode(['vol' => (float) ($c['vol'] ?? 0), 'at' => (int) ($c['at'] ?? 0), 'try' => $now]), LOCK_EX);
  return (float) ($c['vol'] ?? 0) > 0 && (int) ($c['at'] ?? 0) > $now - 3 * 86400 ? (float) $c['vol'] : null; // ancienne mesure (3 jours au plus) : la volatilité bouge lentement
}
/** Nouvelles cotes d'une prédiction auto d'après le prix $s0 : opts mis à jour (off = retiré), ou null si impossible. */
function pred_model_opts(array $e, float $s0, float $vol, float $m, int $now): ?array {
  $days = ((int) $e['endAt'] - $now) / 86400;
  if ($days <= 0) return null;
  $ps = pred_model_probs((array) ($e['pred']['rule'] ?? []), $s0, $vol * (float) ($e['pred']['volX'] ?? 1.1), $days); // volatilité ×1,1 : prudence
  if ($ps === null || count($ps) !== count($e['opts'])) return null;
  $opts = $e['opts'];
  foreach ($opts as $i => $o) {
    $p = (float) $ps[$i];
    $opts[$i]['p'] = round($p, 4);
    if ($p > PRED_P_MAX) { $opts[$i]['off'] = 1; $opts[$i]['odd'] = 1.01; continue; }
    unset($opts[$i]['off']);
    $opts[$i]['odd'] = pred_odd(max($p, PRED_P_MIN), $m);
  }
  return $opts;
}
/**
 * Tâche de fond : recalcule les cotes des prédictions crypto automatiques OUVERTES (au plus toutes les 5 min, $force : tout de
 * suite) ; suspend celles dont le prix manque depuis plus de 10 min. Retour : recalculées, suspendues.
 */
function pred_reprice_job(int $now = 0, bool $force = false): array {
  $now = $now ?: (function_exists('sb_now') ? sb_now() : time());
  $at = sp_dir() . DIRECTORY_SEPARATOR . 'pred-reprice.at';
  clearstatcache(true, $at);
  if (!$force && is_file($at) && filemtime($at) > $now - PRED_REPRICE_EVERY + 5) return ['ok' => true, 'skip' => 1];
  @touch($at, $now);
  $todo = []; $all = [];
  foreach (sp_events() as $e) if (pred_is($e) && !empty($e['pred']['auto']) && ($e['status'] ?? '') === 'open' && $now < (int) ($e['closeMax'] ?? $e['start'])) { $todo[(string) $e['pred']['asset']][] = (string) $e['id']; $all[(string) $e['id']] = $e; }
  $m = pred_margin(); $upd = []; $susp = []; $log = [];
  foreach ($todo as $asset => $ids) {
    $px = pred_price($asset, $now, true);
    $fresh = !empty($px['ok']) && (int) $px['at'] >= $now - PRED_PX_FRESH;
    $vol = null;
    foreach ($ids as $id) {
      $e = $all[$id];
      $v = (float) ($e['pred']['vol'] ?? 0) > 0 ? (float) $e['pred']['vol'] : ($vol ?? ($vol = pred_vol($asset, $now)));
      $opts = $fresh && $v ? pred_model_opts($e, (float) $px['px'], (float) $v, $m, $now) : null;
      if ($opts !== null) { $upd[$id] = ['opts' => $opts, 'px' => (float) $px['px'], 'vol' => (float) $v]; continue; }
      $last = (int) ($e['pred']['pxAt'] ?? 0);
      if (empty($e['pred']['susp']) && $now - $last > PRED_PX_SUSP) { $susp[$id] = 1; $log[] = $e['title'] . ' : suspendu (' . (!$fresh ? 'prix Binance introuvable' : (!$v ? 'volatilité introuvable' : 'règle non calculable')) . ')'; }
    }
  }
  if ($upd || $susp) sp_with('events.json', static function (array &$s) use ($upd, $susp, $now, $m) {
    foreach ((array) ($s['e'] ?? []) as $i => $e) {
      $id = (string) $e['id'];
      if (($e['status'] ?? '') !== 'open') continue;
      if (isset($upd[$id])) {
        $s['e'][$i]['opts'] = $upd[$id]['opts']; $s['e'][$i]['pricedAt'] = $now;
        $s['e'][$i]['pred'] = array_merge((array) $e['pred'], ['susp' => 0, 'pxAt' => $now, 'px0' => $upd[$id]['px'], 'volU' => round($upd[$id]['vol'], 5), 'm' => round($m * 100, 1)]);
      } elseif (isset($susp[$id])) $s['e'][$i]['pred']['susp'] = 1;
    }
    return true;
  });
  return ['ok' => true, 'repriced' => count($upd), 'susp' => count($susp), 'log' => $log];
}
/** Après la réponse au joueur (sb_after_response) : au plus une fois par minute, jamais d'erreur visible. */
function pred_maybe_run(): void {
  // 2026-10-22 (propriétaire : « mets en ligne, ajoute ») : premier lot d'événements importé UNE seule fois (scripts/fixtures/pred-2026-10-22.json)
  try {
    $mark = sp_dir() . DIRECTORY_SEPARATOR . 'pred-seed-2026-10-22.done'; $src = __DIR__ . '/scripts/fixtures/pred-2026-10-22.json';
    if (!is_file($mark) && is_file($src) && @file_put_contents($mark, (string) time(), LOCK_EX) !== false) pred_import((string) file_get_contents($src));
    // 2026-10-22 (propriétaire : « pas de publicité pour d'autres plateformes ») : UNE fois, explications des événements déjà importés
    // réécrites depuis le fichier nettoyé (même id) + plus aucun « Binance / kline / UTC » ; cotes et paris inchangés
    $mk2 = sp_dir() . DIRECTORY_SEPARATOR . 'pred-desc-2026-10-22b.done';
    if (is_file($mark) && !is_file($mk2) && is_file($src) && @file_put_contents($mk2, (string) time(), LOCK_EX) !== false) pred_desc_migrate((string) file_get_contents($src));
  } catch (Throwable $e) { /* jamais bloquant */ }
  try { pred_reprice_job(); } catch (Throwable $e) { /* jamais bloquant */ }
  try { pred_auto_run(); } catch (Throwable $e) { /* jamais bloquant */ }
}

/* ------------------------------------------------------------- textes affichés ------------------------------------ */
/**
 * 2026-10-22 (propriétaire) : aucun nom d'une autre plateforme ni mot technique dans les textes vus par les joueurs
 * (Binance, data-api, kline, UTC, dates ISO) — l'admin garde ses sources. « minuit UTC » → « minuit (GMT) ».
 */
function pred_clean_desc(string $s): string {
  if ($s === '') return '';
  $s = (string) preg_replace('/\b(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}(:\d{2})?Z\b/', '$1', $s);
  $s = (string) preg_replace('/\(\s*(minuit|midnight)\s+UTC\s*\)/iu', '($1 GMT)', $s);
  $s = (string) preg_replace('/\b(minuit|midnight)\s+UTC\b/iu', '$1 (GMT)', $s);
  $s = (string) preg_replace('/\bUTC\b/u', 'GMT', $s);
  $s = (string) preg_replace('/\s*\([^()]*\b(binance|kline|data-api)[^()]*\)/iu', '', $s);
  $s = (string) preg_replace('/\s+(sur|on|chez|from|via|de|du)\s+(data-api\.)?binance(\.vision|\.com)?\b/iu', '', $s);
  $s = (string) preg_replace('/\b(data-api\.)?binance(\.vision|\.com)?\s*/iu', '', $s);
  $s = (string) preg_replace('/\bklines?\b\s*/iu', '', $s);
  $s = (string) preg_replace('/\s{2,}/u', ' ', $s);
  $s = (string) preg_replace('/[ \t]+([.,)])/u', '$1', $s);
  $s = (string) preg_replace('/(\([^()]+\))(\s*\1)+/u', '$1', $s);
  return trim($s);
}
/**
 * Migration (une fois) : explication fr / en des prédictions déjà en ligne remplacée par celle du fichier nettoyé (même id),
 * les autres nettoyées (pred_clean_desc). Ne touche NI aux cotes, NI aux choix, NI aux paris. Retour : nombre modifié.
 */
function pred_desc_migrate(string $json): int {
  $list = json_decode($json, true);
  if (isset($list['events']) && is_array($list['events'])) $list = $list['events'];
  $by = [];
  foreach ((array) $list as $r) {
    if (!is_array($r)) continue;
    $sid = substr((string) preg_replace('/[^a-z0-9]/', '', sp_lower((string) ($r['id'] ?? ''))), 0, 40);
    if ($sid === '') continue;
    $by['pd' . $sid] = array_filter(['fr' => sp_clean((string) ($r['desc_fr'] ?? ''), 400), 'en' => sp_clean((string) ($r['desc_en'] ?? ''), 400)], 'strlen');
  }
  return (int) sp_with('events.json', static function (array &$s) use ($by) {
    $n = 0;
    foreach ((array) ($s['e'] ?? []) as $i => $e) {
      if (!pred_is($e)) continue;
      $old = (array) ($e['desc'] ?? []);
      $d = isset($by[$e['id']]) && $by[$e['id']] ? $by[$e['id']] : $old;
      $d = array_filter(array_map(static fn($v) => pred_clean_desc((string) $v), $d), 'strlen');
      if ($d === $old) continue;
      if ($d) $s['e'][$i]['desc'] = $d; else unset($s['e'][$i]['desc']);
      $n++;
    }
    return $n;
  });
}

/* ------------------------------------------------------------- admin ------------------------------------------------ */

/**
 * Admin : image (petite vignette ronde sur la carte, facultative) et explication fr / en d'une prédiction pas encore réglée.
 * $in : img = data:image/png;base64 (préparée par le navigateur, 200 Ko au plus) | 'none' (retirer) | absent (inchangée),
 * desc_fr / desc_en (vides = retirées). Rien d'autre ne change (cotes, choix, paris).
 */
function pred_admin_edit(string $id, array $in): array {
  $img = null;
  if (isset($in['img']) && $in['img'] !== '') {
    if ($in['img'] === 'none') $img = '';
    else {
      if (strlen((string) $in['img']) > 280000) return ['ok' => false, 'reason' => 'Image trop lourde (200 Ko au plus)'];
      $img = sp_admin_img((string) $in['img']);
      if ($img === '') return ['ok' => false, 'reason' => 'Image illisible (PNG attendu)'];
    }
  }
  $df = array_key_exists('desc_fr', $in) ? sp_clean((string) $in['desc_fr'], 400) : null;
  $de = array_key_exists('desc_en', $in) ? sp_clean((string) $in['desc_en'], 400) : null;
  return sp_with('events.json', static function (array &$s) use ($id, $img, $df, $de) {
    foreach ((array) ($s['e'] ?? []) as $i => $e) {
      if ($e['id'] !== $id || !pred_is($e)) continue;
      if (($e['status'] ?? '') === 'settled') return ['ok' => false, 'reason' => 'Déjà réglée'];
      if ($img !== null) { if ($img === '') unset($s['e'][$i]['img']); else $s['e'][$i]['img'] = $img; }
      $d = (array) ($e['desc'] ?? []);
      if ($df !== null) $d['fr'] = $df;
      if ($de !== null) $d['en'] = $de;
      $d = array_filter($d, 'strlen');
      if ($d) $s['e'][$i]['desc'] = $d; else unset($s['e'][$i]['desc']);
      return ['ok' => true, 'img' => (string) ($s['e'][$i]['img'] ?? ''), 'desc' => $d];
    }
    return ['ok' => false, 'reason' => 'Prédiction introuvable'];
  }) ?? ['ok' => false, 'reason' => 'Fichier occupé, réessayez'];
}

/** Liste « Predict » de l'admin : à vérifier, à régler (heure passée), ouvertes, réglées (30 dernières). */
function pred_admin_list(int $now = 0): array {
  $now = $now ?: time();
  $bets = (array) (sp_with('bets.json', static fn(array &$s) => $s['b'] ?? []) ?: []);
  $nb = []; $in = [];
  foreach ($bets as $b) foreach ((array) ($b['sel'] ?? []) as $x) {
    $ev = (string) ($x['ev'] ?? ''); if (!str_starts_with($ev, 'pd')) continue;
    $nb[$ev] = ($nb[$ev] ?? 0) + 1;
    if (($b['mode'] ?? '') === 'real') $in[$ev] = ($in[$ev] ?? 0) + (float) $b['stake'];
  }
  $rows = [];
  foreach (sp_events() as $e) {
    if (!pred_is($e)) continue;
    $st = (string) ($e['status'] ?? '');
    $grp = $st === 'settled' ? 'done' : (!empty($e['predChk']) ? 'chk' : ($now >= (int) ($e['endAt'] ?? $e['start']) ? 'due' : 'open'));
    $rows[] = ['id' => $e['id'], 'title' => $e['title'], 'en' => (string) ($e['i18n']['en'] ?? ''), 'cat' => (string) ($e['cat'] ?? ''), 'status' => $st, 'grp' => $grp,
      'close' => sp_close_at($e), 'closeAt' => (int) ($e['closeMax'] ?? $e['start']), 'endAt' => (int) ($e['endAt'] ?? 0), 'result' => $e['result'] ?? null, 'settledAt' => (int) ($e['settledAt'] ?? 0),
      'opts' => array_map(static fn($o) => ['k' => $o['k'], 'label' => $o['label'], 'odd' => (float) $o['odd'], 'p' => (float) ($o['p'] ?? 0), 'off' => !empty($o['off'])], (array) $e['opts']),
      'img' => (string) ($e['img'] ?? ''), 'desc' => (array) ($e['desc'] ?? []), 'susp' => !empty($e['pred']['susp']), 'pxAt' => (int) ($e['pred']['pxAt'] ?? 0), 'px0' => (float) ($e['pred']['px0'] ?? 0), 'vol' => (float) ($e['pred']['volU'] ?? $e['pred']['vol'] ?? 0),
      'auto' => !empty($e['pred']['auto']), 'asset' => (string) ($e['pred']['asset'] ?? ''), 'rule' => $e['pred']['rule'] ?? null, 'src' => (string) ($e['pred']['src'] ?? ''),
      'chk' => $e['predChk'] ?? null, 'px' => $e['predPx'] ?? null, 'nb' => $nb[$e['id']] ?? 0, 'in' => round($in[$e['id']] ?? 0, 2), 'm' => $e['pred']['m'] ?? null];
  }
  $ord = ['chk' => 0, 'due' => 1, 'open' => 2, 'done' => 3];
  usort($rows, static fn($a, $b) => [$ord[$a['grp']], $a['grp'] === 'done' ? -$a['settledAt'] : $a['endAt']] <=> [$ord[$b['grp']], $b['grp'] === 'done' ? -$b['settledAt'] : $b['endAt']]);
  $done = 0;
  $rows = array_values(array_filter($rows, static function ($r) use (&$done) { return $r['grp'] !== 'done' || ++$done <= 30; }));
  return ['ok' => true, 'events' => $rows, 'margin' => round(pred_margin() * 100, 1), 'now' => $now];
}
