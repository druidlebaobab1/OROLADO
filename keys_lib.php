<?php
declare(strict_types=1);
/**
 * 2026-11-10 (propriétaire : « un endroit où tous nos appels sont rangés : il clique, il colle, ça va directement ») —
 * page admin « 🔑 Clés & connexions ».
 *
 * - Les clés sont rangées dans data/.env (dossier fermé au web : data/.htaccess « Require all denied »), fichier 0600.
 *   Elles sont lues par tout le site comme les autres réglages (orolado_load_env).
 * - Elles ne sont JAMAIS renvoyées au navigateur : seulement « configurée », la date, le résultat du dernier test.
 * - Une clé déjà réglée chez l'hébergeur (variable d'environnement / .env racine) garde la priorité : on le signale.
 * - Les noms vitaux du site (Supabase, admin…) ne peuvent pas être écrits d'ici.
 */

function keys_catalog(): array {
  return [
    // 2026-11-11 : le coffre = le portefeuille du propriétaire (Trust Wallet). Adresse PUBLIQUE (pas un secret) : elle s'affiche.
    ['cat' => '🏦 Mon coffre : où part l’argent des joueurs (sans OxaPay)', 'items' => [
      ['name' => 'VAULT_TRON_ADDRESS', 'title' => 'Mon Trust Wallet : adresse USDT (réseau TRON)', 'ico' => '🏦', 'show' => true,
        'what' => 'Le site envoie ici, tout seul, l’argent déposé par les joueurs. Dans Trust Wallet : Recevoir → USDT → réseau TRON (TRC20) → Copier. Commence par T. Ce n’est pas un secret. Ne donne JAMAIS tes 12 mots.',
        'how' => 'Recevoir → USDT → TRON → Copier', 'fmt' => '/^T[1-9A-HJ-NP-Za-km-z]{33}$/', 'fmtTxt' => 'T + 33 caractères',
        'fmtBad' => 'Ce n’est pas une adresse TRON (elle commence par T et fait 34 caractères). Dans Trust Wallet : Recevoir → USDT → TRON → Copier.'],
    ]],
    ['cat' => 'Dépôts crypto : voir les paiements arriver', 'items' => [
      ['name' => 'TRONGRID_API_KEY', 'title' => 'TronGrid', 'ico' => '🟥', 'what' => 'USDT TRC20 et TRX (réseau TRON). Le plus utilisé en Afrique.', 'url' => 'https://www.trongrid.io/register', 'how' => 'Clés API → Créer', 'fmt' => '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', 'fmtTxt' => 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'],
      ['name' => 'NODEREAL_API_KEY', 'title' => 'NodeReal', 'ico' => '🟨', 'what' => 'USDT BEP20 et BNB (BNB Chain / Binance).', 'url' => 'https://nodereal.io/meganode', 'how' => 'Create API key → BNB Smart Chain'],
      ['name' => 'BLOCKCYPHER_TOKEN', 'title' => 'BlockCypher', 'ico' => '🟧', 'what' => 'Bitcoin, Litecoin, Dogecoin.', 'url' => 'https://accounts.blockcypher.com/signup', 'how' => 'Le « Token » est sur la page d’accueil du compte'],
      ['name' => 'ETHERSCAN_API_KEY', 'title' => 'Etherscan', 'ico' => '🟦', 'what' => 'USDT ERC20, ETH, USDC, Polygon, Arbitrum, Base.', 'url' => 'https://etherscan.io/register', 'how' => 'API Keys → Add'],
      ['name' => 'HELIUS_API_KEY', 'title' => 'Helius', 'ico' => '🟪', 'what' => 'Solana (SOL, USDT et USDC sur Solana).', 'url' => 'https://dashboard.helius.dev/signup', 'how' => 'API Keys'],
      ['name' => 'TONCENTER_API_KEY', 'title' => 'TON Center', 'ico' => '💎', 'what' => 'TON et USDT sur TON.', 'url' => 'https://t.me/tonapibot', 'how' => 'Le robot Telegram donne la clé'],
    ]],
    ['cat' => 'Paiements', 'items' => [
      ['name' => 'OXAPAY_MERCHANT_KEY', 'title' => 'OxaPay — dépôts', 'ico' => '💳', 'what' => 'Clé « Merchant » d’OxaPay (dépôts crypto par OxaPay).', 'url' => 'https://app.oxapay.com', 'how' => 'Merchant service → API key'],
      ['name' => 'OXAPAY_PAYOUT_KEY', 'title' => 'OxaPay — retraits', 'ico' => '💸', 'what' => 'Clé « Payout » d’OxaPay (retraits crypto automatiques, plus tard).', 'url' => 'https://app.oxapay.com', 'how' => 'Payout service → API key'],
    ]],
  ];
}

function keys_known(): array {
  $o = [];
  foreach (keys_catalog() as $c) foreach ($c['items'] as $it) $o[$it['name']] = $it;
  return $o;
}

/** Noms qu'on n'écrit jamais d'ici (le site en dépend pour fonctionner ou se protéger). */
function keys_forbidden(string $name): bool {
  return (bool) preg_match('/^(SUPABASE|ADMIN|OROLADO|SESSION|DB_|DATABASE|APP_|PHP|PATH|HOME|SERVER|HTTP|SMTP_PASS|COFFRE)/', $name);
}

function keys_env_file(): string { return orolado_data_dir() . '/.env'; }
function keys_meta_file(): string { return orolado_data_dir() . '/keys_meta.json'; }

function keys_read_env(): array {
  $o = [];
  foreach ((array) @file(keys_env_file(), FILE_IGNORE_NEW_LINES) as $l) {
    if (preg_match('/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/', (string) $l, $m)) $o[$m[1]] = trim($m[2], " \t\"'");
  }
  return $o;
}

function keys_write_env(string $name, ?string $val): bool {
  $f = keys_env_file();
  $fp = @fopen($f, 'c+');
  if (!$fp) return false;
  flock($fp, LOCK_EX);
  $raw = stream_get_contents($fp);
  $lines = $raw === false || $raw === '' ? [] : preg_split('/\r?\n/', $raw);
  $out = []; $done = false;
  foreach ($lines as $l) {
    if (trim((string) $l) === '') continue;
    if (preg_match('/^\s*' . preg_quote($name, '/') . '\s*=/', (string) $l)) {
      if ($val !== null && !$done) { $out[] = $name . '=' . $val; $done = true; }
      continue;
    }
    $out[] = (string) $l;
  }
  if ($val !== null && !$done) $out[] = $name . '=' . $val;
  ftruncate($fp, 0); rewind($fp);
  $ok = fwrite($fp, $out ? implode("\n", $out) . "\n" : '') !== false;
  fflush($fp); flock($fp, LOCK_UN); fclose($fp);
  @chmod($f, 0600);
  return $ok;
}

function keys_meta(): array {
  $j = json_decode((string) @file_get_contents(keys_meta_file()), true);
  return is_array($j) ? $j : [];
}

function keys_meta_set(string $name, ?array $row): void {
  $m = keys_meta();
  if ($row === null) unset($m[$name]); else $m[$name] = array_merge($m[$name] ?? [], $row);
  @file_put_contents(keys_meta_file(), json_encode($m, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
  @chmod(keys_meta_file(), 0600);
}

/** La clé est-elle aussi réglée chez l'hébergeur (variable d'environnement ou .env à la racine) ? Elle y a la priorité. */
function keys_host_has(string $name, array $fileBefore): bool {
  foreach ((array) @file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES) as $l) {
    if (preg_match('/^\s*' . preg_quote($name, '/') . '\s*=\s*(.+)$/', (string) $l, $m) && trim($m[1], " \t\"'") !== '') return true;
  }
  $env = getenv($name); // data/.env est aussi chargé dans l'environnement : ce n'est « l'hébergeur » que si la valeur diffère
  return is_string($env) && trim($env) !== '' && trim($env) !== (string) ($fileBefore[$name] ?? '');
}

/** Valeur effective (hébergeur d'abord, puis data/.env) — reste sur le serveur. */
function keys_value(string $name): string {
  $file = keys_read_env();
  if (keys_host_has($name, $file)) { $env = getenv($name); if (is_string($env) && trim($env) !== '') return trim($env); }
  return (string) ($file[$name] ?? '');
}

function keys_http(string $url, string $method = 'GET', ?string $body = null, array $hdr = []): array {
  if (!function_exists('curl_init')) return [0, ''];
  $ch = curl_init($url);
  $o = [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 12, CURLOPT_CONNECTTIMEOUT => 6, CURLOPT_HTTPHEADER => $hdr];
  if ($method === 'POST') { $o[CURLOPT_POST] = true; $o[CURLOPT_POSTFIELDS] = $body ?? ''; }
  curl_setopt_array($ch, $o);
  $raw = curl_exec($ch);
  $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  return [$code, is_string($raw) ? $raw : ''];
}

/** Teste la clé auprès de son service. Retour : ['ok' => bool|null, 'msg' => texte] (null = pas de test possible). */
function keys_test(string $name, string $v): array {
  if ($v === '') return ['ok' => false, 'msg' => 'Aucune clé enregistrée'];
  $json = ['Content-Type: application/json'];
  switch ($name) {
    case 'VAULT_TRON_ADDRESS':
      if (!function_exists('coffre_addr_ok') || !coffre_addr_ok($v)) return ['ok' => false, 'msg' => 'Adresse TRON invalide (une lettre est fausse ?). Recopie-la avec le bouton « Copier » de Trust Wallet.'];
      $tk = keys_value('TRONGRID_API_KEY');
      if ($tk === '') return ['ok' => false, 'msg' => 'Adresse valide. Il manque la clé TronGrid (plus bas) : sans elle le site ne voit pas l’argent arriver.'];
      [$c, $r] = keys_http('https://api.trongrid.io/v1/accounts/' . $v, 'GET', null, ['TRON-PRO-API-KEY: ' . $tk, 'Accept: application/json']);
      if ($c !== 200) return ['ok' => true, 'msg' => 'Adresse valide ✓ (TronGrid n’a pas répondu au test, code ' . $c . '). Suite : admin → 🏦 Coffre.'];
      return ['ok' => true, 'msg' => 'Adresse valide ✓ L’argent des joueurs partira ici. Vérifie que c’est bien TON adresse : ' . substr($v, 0, 6) . '…' . substr($v, -6) . '. Suite : admin → 🏦 Coffre.'];
    case 'TRONGRID_API_KEY':
      [$c, $r] = keys_http('https://api.trongrid.io/wallet/getnowblock', 'POST', '{}', array_merge($json, ['TRON-PRO-API-KEY: ' . $v]));
      return ($c === 200 && str_contains($r, 'block_header')) ? ['ok' => true, 'msg' => 'TronGrid répond : la clé fonctionne'] : ['ok' => false, 'msg' => 'TronGrid refuse la clé (code ' . $c . ')'];
    case 'NODEREAL_API_KEY':
      [$c, $r] = keys_http('https://bsc-mainnet.nodereal.io/v1/' . rawurlencode($v), 'POST', '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}', $json);
      return ($c === 200 && str_contains($r, '"result"')) ? ['ok' => true, 'msg' => 'NodeReal (BNB Chain) répond : la clé fonctionne'] : ['ok' => false, 'msg' => 'NodeReal refuse la clé (code ' . $c . ')'];
    case 'BLOCKCYPHER_TOKEN':
      [$c, $r] = keys_http('https://api.blockcypher.com/v1/btc/main?token=' . rawurlencode($v));
      return ($c === 200 && str_contains($r, '"height"')) ? ['ok' => true, 'msg' => 'BlockCypher répond : la clé fonctionne'] : ['ok' => false, 'msg' => 'BlockCypher refuse la clé (code ' . $c . ')'];
    case 'ETHERSCAN_API_KEY':
      [$c, $r] = keys_http('https://api.etherscan.io/v2/api?chainid=1&module=proxy&action=eth_blockNumber&apikey=' . rawurlencode($v));
      $j = json_decode($r, true);
      return ($c === 200 && is_array($j) && isset($j['result']) && str_starts_with((string) $j['result'], '0x')) ? ['ok' => true, 'msg' => 'Etherscan répond : la clé fonctionne'] : ['ok' => false, 'msg' => 'Etherscan refuse la clé' . (is_array($j) && !empty($j['result']) ? ' : ' . substr((string) $j['result'], 0, 80) : ' (code ' . $c . ')')];
    case 'HELIUS_API_KEY':
      [$c, $r] = keys_http('https://mainnet.helius-rpc.com/?api-key=' . rawurlencode($v), 'POST', '{"jsonrpc":"2.0","id":1,"method":"getSlot"}', $json);
      return ($c === 200 && str_contains($r, '"result"')) ? ['ok' => true, 'msg' => 'Helius (Solana) répond : la clé fonctionne'] : ['ok' => false, 'msg' => 'Helius refuse la clé (code ' . $c . ')'];
    case 'TONCENTER_API_KEY':
      [$c, $r] = keys_http('https://toncenter.com/api/v2/getMasterchainInfo', 'GET', null, ['X-API-Key: ' . $v]);
      return ($c === 200 && str_contains($r, '"ok":true')) ? ['ok' => true, 'msg' => 'TON Center répond : la clé fonctionne'] : ['ok' => false, 'msg' => 'TON Center refuse la clé (code ' . $c . ')'];
    case 'OXAPAY_MERCHANT_KEY':
    case 'OXAPAY_PAYOUT_KEY':
      [$c, $r] = keys_http('https://api.oxapay.com/v1/payment?size=1&page=1', 'GET', null, ['merchant_api_key: ' . $v, 'Content-Type: application/json']);
      if ($name === 'OXAPAY_MERCHANT_KEY') return ($c === 200 && str_contains($r, '"data"')) ? ['ok' => true, 'msg' => 'OxaPay répond : la clé fonctionne'] : ['ok' => false, 'msg' => 'OxaPay refuse la clé (code ' . $c . ')'];
      return ['ok' => null, 'msg' => 'Enregistrée. Elle sera testée quand les retraits automatiques seront branchés.'];
  }
  return ['ok' => null, 'msg' => 'Enregistrée (pas de test automatique pour cette clé)'];
}

/** Payload de la page (aucune valeur de clé). */
function keys_status(): array {
  $file = keys_read_env(); $meta = keys_meta(); $known = keys_known();
  $row = static function (string $name, array $it) use ($file, $meta): array {
    $host = keys_host_has($name, $file);
    $m = $meta[$name] ?? [];
    if (!empty($it['show'])) $it['value'] = keys_value($name); // adresse publique : on la montre pour vérifier
    return $it + ['set' => $host || (($file[$name] ?? '') !== ''), 'source' => $host ? 'hébergeur' : (($file[$name] ?? '') !== '' ? 'admin' : ''),
      'updatedAt' => (string) ($m['updatedAt'] ?? ''), 'by' => (string) ($m['by'] ?? ''), 'test' => $m['test'] ?? null];
  };
  $cats = [];
  foreach (keys_catalog() as $c) {
    $items = [];
    foreach ($c['items'] as $it) { unset($it['fmt']); $items[] = $row($it['name'], $it); }
    $cats[] = ['cat' => $c['cat'], 'items' => $items];
  }
  $custom = [];
  foreach (array_keys($file) as $n) {
    if (isset($known[$n]) || keys_forbidden($n)) continue; // clé maîtresse du coffre etc. : jamais affichée ni supprimable
    $custom[] = $row($n, ['name' => $n, 'title' => $n, 'ico' => '🔑', 'what' => 'Clé ajoutée à la main.', 'custom' => true]);
  }
  if ($custom) $cats[] = ['cat' => 'Autres clés', 'items' => $custom];
  return ['ok' => true, 'cats' => $cats];
}

/**
 * 2026-11-11 (propriétaire : « la clé est complète mais elle est refusée ») — nettoie ce qui est collé depuis un téléphone :
 * espaces / retours à la ligne / caractères invisibles, guillemets, et un nom collé devant (« TRONGRID_API_KEY= … »).
 * Si la clé attendue a un format connu (TronGrid = UUID), on la retrouve dans le texte collé.
 */
function keys_clean(string $name, string $val, string $fmt = ''): string {
  $v = preg_replace('/[\x{00A0}\x{1680}\x{2000}-\x{200F}\x{2028}\x{2029}\x{202F}\x{205F}\x{3000}\x{FEFF}\s]+/u', ' ', $val) ?? $val;
  $v = trim($v, " \t\n\r\"'`«»“”‘’");
  if (preg_match('/^' . preg_quote($name, '/') . '\s*[=:]?\s*(.+)$/i', $v, $m)) $v = trim($m[1], " \"'`«»“”‘’");
  if ($fmt !== '') {
    // ex. TronGrid : on cherche le motif xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx n'importe où dans le texte collé
    $inner = trim($fmt, '/i');
    $inner = preg_replace('/^\^|\$$/', '', $inner);
    if (preg_match('/' . $inner . '/i', $v, $m)) return $m[0];
  }
  return str_replace(' ', '', $v);
}

function keys_set(string $name, string $val, string $by): array {
  $name = strtoupper(trim($name));
  $known = keys_known();
  $val = keys_clean($name, $val, (string) ($known[$name]['fmt'] ?? ''));
  if (!isset($known[$name])) {
    if (!preg_match('/^[A-Z][A-Z0-9_]{2,48}$/', $name)) return ['ok' => false, 'reason' => 'Nom invalide : lettres MAJUSCULES, chiffres et _ (ex. MON_SERVICE_API_KEY)'];
    if (keys_forbidden($name)) return ['ok' => false, 'reason' => 'Ce nom est réservé au fonctionnement du site : il ne peut pas être changé d’ici.'];
  }
  $fmt = $known[$name]['fmt'] ?? '';
  if ($fmt !== '' && !preg_match($fmt, $val) && !empty($known[$name]['fmtBad'])) return ['ok' => false, 'reason' => $known[$name]['fmtBad']];
  if ($fmt !== '' && !preg_match($fmt, $val)) {
    $n = strlen($val);
    return ['ok' => false, 'reason' => 'Ce n’est pas une clé ' . ($known[$name]['title'] ?? '') . ' complète (' . $n . ' caractères reçus, il en faut 36 au format ' . $known[$name]['fmtTxt'] . '). Recopiez-la depuis le site (bouton « copier » à côté de la clé).'];
  }
  if (!preg_match('/^[A-Za-z0-9_\-.:]{8,300}$/', $val)) return ['ok' => false, 'reason' => 'Clé invalide (' . strlen($val) . ' caractères, dont des caractères inattendus). Recopiez-la avec le bouton « copier » du site.'];
  $before = keys_read_env();
  if (!keys_write_env($name, $val)) return ['ok' => false, 'reason' => 'Écriture impossible sur le serveur'];
  $t = keys_test($name, $val);
  keys_meta_set($name, ['updatedAt' => date('c'), 'by' => $by, 'test' => ['at' => date('c'), 'ok' => $t['ok'], 'msg' => $t['msg']]]);
  $hostWins = keys_host_has($name, $before);
  return ['ok' => true, 'test' => $t, 'hostWins' => $hostWins];
}

function keys_retest(string $name): array {
  $t = keys_test($name, keys_value($name));
  keys_meta_set($name, ['test' => ['at' => date('c'), 'ok' => $t['ok'], 'msg' => $t['msg']]]);
  return ['ok' => true, 'test' => $t];
}

function keys_delete(string $name): array {
  $name = strtoupper(trim($name));
  if (!preg_match('/^[A-Z][A-Z0-9_]{2,48}$/', $name) || keys_forbidden($name)) return ['ok' => false, 'reason' => 'Nom invalide'];
  if (!keys_write_env($name, null)) return ['ok' => false, 'reason' => 'Écriture impossible sur le serveur'];
  keys_meta_set($name, null);
  return ['ok' => true];
}
