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
      ['name' => 'VAULT_TRON_ADDRESS', 'title' => 'Mon Trust Wallet : TRON (USDT, TRX)', 'ico' => '🏦', 'show' => true,
        'what' => 'Le site envoie ici, tout seul, l’argent déposé par les joueurs. Dans Trust Wallet : Recevoir → USDT → réseau TRON (TRC20) → Copier. Commence par T. Ce n’est pas un secret. Ne donne JAMAIS tes 12 mots.',
        'how' => 'Recevoir → USDT → TRON → Copier', 'fmt' => '/^T[1-9A-HJ-NP-Za-km-z]{33}$/', 'fmtTxt' => 'T + 33 caractères',
        'fmtBad' => 'Ce n’est pas une adresse TRON (elle commence par T et fait 34 caractères). Dans Trust Wallet : Recevoir → USDT → TRON → Copier.'],
      // 2026-11-11 (propriétaire : « des cases pour tout en même temps ») : adresses Trust Wallet des autres réseaux,
      // gardées dès maintenant ; chaque réseau s'en sert automatiquement le jour où son moteur est branché.
      ['name' => 'VAULT_EVM_ADDRESS', 'title' => 'Mon Trust Wallet : Ethereum / BNB / Polygon / Base', 'ico' => '🔷', 'show' => true,
        'what' => 'Dans Trust Wallet : Recevoir → « USDT Ethereum » → Copier (commence par 0x). La même adresse sert pour ETH, BNB (BEP20), Polygon et Base. PAS « BNB Beacon Chain » (bnb1…).',
        'how' => 'Recevoir → USDT Ethereum → Copier', 'fmt' => '/^0x[0-9a-fA-F]{40}$/', 'fmtTxt' => '0x + 40 caractères',
        'fmtBad' => 'Ce n’est pas une adresse Ethereum (elle commence par 0x et fait 42 caractères). Dans Trust Wallet : Recevoir → USDT Ethereum → Copier.'],
      ['name' => 'VAULT_BTC_ADDRESS', 'title' => 'Mon Trust Wallet : Bitcoin', 'ico' => '🟠', 'show' => true,
        'what' => 'Dans Trust Wallet : Recevoir → « BTC Bitcoin » → Copier (commence par bc1).', 'how' => 'Recevoir → BTC → Copier',
        'fmt' => '/^(bc1[02-9ac-hj-np-z]{11,71}|[13][1-9A-HJ-NP-Za-km-z]{25,34})$/', 'fmtTxt' => 'bc1…',
        'fmtBad' => 'Ce n’est pas une adresse Bitcoin (elle commence par bc1). Dans Trust Wallet : Recevoir → BTC → Copier.'],
      ['name' => 'VAULT_SOL_ADDRESS', 'title' => 'Mon Trust Wallet : Solana', 'ico' => '🟣', 'show' => true,
        'what' => 'Dans Trust Wallet : Recevoir → « SOL Solana » → Copier.', 'how' => 'Recevoir → SOL → Copier',
        'fmt' => '/^[1-9A-HJ-NP-Za-km-z]{32,44}$/', 'fmtTxt' => '32 à 44 caractères',
        'fmtBad' => 'Ce n’est pas une adresse Solana. Dans Trust Wallet : Recevoir → SOL → Copier.'],
      ['name' => 'VAULT_TON_ADDRESS', 'title' => 'Mon Trust Wallet : TON', 'ico' => '💎', 'show' => true,
        'what' => 'Dans Trust Wallet : Recevoir → « TON » → Copier (commence par UQ).', 'how' => 'Recevoir → TON → Copier',
        'fmt' => '/^(UQ|EQ|0Q|kQ)[A-Za-z0-9_-]{46}$/', 'fmtTxt' => 'UQ… (48 caractères)',
        'fmtBad' => 'Ce n’est pas une adresse TON (elle commence par UQ). Dans Trust Wallet : Recevoir → TON → Copier.'],
      ['name' => 'VAULT_LTC_ADDRESS', 'title' => 'Mon Trust Wallet : Litecoin', 'ico' => '🔵', 'show' => true,
        'what' => 'Dans Trust Wallet : Recevoir → « LTC Litecoin » → Copier (commence par ltc1).', 'how' => 'Recevoir → LTC → Copier',
        'fmt' => '/^(ltc1[02-9ac-hj-np-z]{11,71}|[LM3][1-9A-HJ-NP-Za-km-z]{26,33})$/', 'fmtTxt' => 'ltc1…',
        'fmtBad' => 'Ce n’est pas une adresse Litecoin (elle commence par ltc1). Dans Trust Wallet : Recevoir → LTC → Copier.'],
      ['name' => 'VAULT_DOGE_ADDRESS', 'title' => 'Mon Trust Wallet : Dogecoin', 'ico' => '🟡', 'show' => true,
        'what' => 'Dans Trust Wallet : Recevoir → « DOGE Dogecoin » → Copier (commence par D).', 'how' => 'Recevoir → DOGE → Copier',
        'fmt' => '/^D[1-9A-HJ-NP-Za-km-z]{25,34}$/', 'fmtTxt' => 'D…',
        'fmtBad' => 'Ce n’est pas une adresse Dogecoin (elle commence par D). Dans Trust Wallet : Recevoir → DOGE → Copier.'],
    ]],
    ['cat' => 'Dépôts crypto : voir les paiements arriver', 'items' => [
      ['name' => 'TATUM_API_KEY', 'title' => 'Tatum (66 réseaux)', 'ico' => '🟪', 'what' => 'Les « yeux » pour Bitcoin, Ethereum, BNB, Polygon, Base, Solana, TON, Litecoin, Dogecoin, XRP… (et secours de TRON).', 'url' => 'https://dashboard.tatum.io', 'how' => 'Tableau de bord → API Keys → Mainnet → copier', 'fmt' => '/^t-[0-9a-f]{6,}[A-Za-z0-9_-]*$/', 'fmtTxt' => 't-…', 'fmtBad' => 'Ce n’est pas une clé Tatum (elle commence par t-). Dans Tatum : API Keys → Mainnet → bouton copier.'],
      ['name' => 'TRONGRID_API_KEY', 'title' => 'TronGrid', 'ico' => '🟥', 'what' => 'USDT TRC20 et TRX (réseau TRON). Le plus utilisé en Afrique.', 'url' => 'https://www.trongrid.io/register', 'how' => 'Clés API → Créer', 'fmt' => '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', 'fmtTxt' => 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'],
      ['name' => 'NODEREAL_API_KEY', 'title' => 'NodeReal', 'ico' => '🟨', 'what' => 'USDT BEP20 et BNB (BNB Chain / Binance).', 'url' => 'https://nodereal.io/meganode', 'how' => 'Create API key → BNB Smart Chain'],
      ['name' => 'BLOCKCYPHER_TOKEN', 'title' => 'BlockCypher', 'ico' => '🟧', 'what' => 'Bitcoin, Litecoin, Dogecoin.', 'url' => 'https://accounts.blockcypher.com/signup', 'how' => 'Le « Token » est sur la page d’accueil du compte'],
      ['name' => 'ETHERSCAN_API_KEY', 'title' => 'Etherscan', 'ico' => '🟦', 'what' => 'USDT ERC20, ETH, USDC, Polygon, Arbitrum, Base.', 'url' => 'https://etherscan.io/register', 'how' => 'API Keys → Add'],
      ['name' => 'HELIUS_API_KEY', 'title' => 'Helius', 'ico' => '🟪', 'what' => 'Solana (SOL, USDT et USDC sur Solana).', 'url' => 'https://dashboard.helius.dev/signup', 'how' => 'API Keys'],
      ['name' => 'TONCENTER_API_KEY', 'title' => 'TON Center', 'ico' => '💎', 'what' => 'TON et USDT sur TON.', 'url' => 'https://t.me/tonapibot', 'how' => 'Le robot Telegram donne la clé'],
    ]],
    // 2026-11-15 (propriétaire) : clé de l'API Conversions du pixel OROLADO — les DÉPÔTS sont envoyés à Facebook par le serveur
    // (marche même avec un bloqueur de pub). Clé secrète : collée ici par le propriétaire, jamais dans le code ni dans le chat.
    ['cat' => '📣 Publicité Facebook', 'items' => [
      ['name' => 'META_ACCESS_TOKEN', 'title' => 'Facebook : clé de l’API Conversions', 'ico' => '📣',
        'what' => 'Envoie chaque dépôt à ton pixel OROLADO directement depuis le serveur (plus fiable que le pixel seul).',
        'url' => 'https://business.facebook.com/events_manager2', 'how' => 'Events Manager → pixel OROLADO → Settings → Conversions API → Generate access token → Copier'],
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
    case 'VAULT_EVM_ADDRESS':
      if (preg_match('/[a-f]/', substr($v, 2)) && preg_match('/[A-F]/', substr($v, 2)) && function_exists('coffre_keccak256')) {
        // Lettres majuscules/minuscules mélangées = somme de contrôle (EIP-55) : une faute de frappe est détectée.
        $h = bin2hex(coffre_keccak256(strtolower(substr($v, 2))));
        for ($i = 0; $i < 40; $i++) { $c = $v[$i + 2]; if (ctype_alpha($c) && (ctype_upper($c) !== (hexdec($h[$i]) >= 8))) return ['ok' => false, 'msg' => 'Adresse invalide (une lettre est fausse ?). Recopie-la avec le bouton « Copier » de Trust Wallet.']; }
      }
      return ['ok' => true, 'msg' => 'Adresse valide ✓ gardée. Ce réseau (ETH, BNB, Polygon, Base) sera branché bientôt : rien d’autre à faire.'];
    case 'VAULT_BTC_ADDRESS': case 'VAULT_LTC_ADDRESS': case 'VAULT_DOGE_ADDRESS':
      $uc = ['VAULT_BTC_ADDRESS' => 'btc', 'VAULT_LTC_ADDRESS' => 'ltc', 'VAULT_DOGE_ADDRESS' => 'doge'][$name];
      if (function_exists('cutxo_addr_ok') && !cutxo_addr_ok($uc, $v)) return ['ok' => false, 'msg' => 'Adresse invalide (une lettre est fausse ?). Recopie-la avec le bouton « Copier » de Trust Wallet.'];
      return ['ok' => true, 'msg' => 'Adresse valide ✓ L’argent des joueurs partira ici. Vérifie que c’est bien TON adresse : ' . substr($v, 0, 6) . '…' . substr($v, -6) . '. Suite : admin → 🏦 Coffre.'];
    case 'VAULT_SOL_ADDRESS': case 'VAULT_TON_ADDRESS':
      return ['ok' => true, 'msg' => 'Adresse gardée ✓. Ce réseau sera branché bientôt : rien d’autre à faire.'];
    case 'VAULT_TRON_ADDRESS':
      if (!function_exists('coffre_addr_ok') || !coffre_addr_ok($v)) return ['ok' => false, 'msg' => 'Adresse TRON invalide (une lettre est fausse ?). Recopie-la avec le bouton « Copier » de Trust Wallet.'];
      $tk = keys_value('TRONGRID_API_KEY');
      if ($tk === '') return ['ok' => false, 'msg' => 'Adresse valide. Il manque la clé TronGrid (plus bas) : sans elle le site ne voit pas l’argent arriver.'];
      [$c, $r] = keys_http('https://api.trongrid.io/v1/accounts/' . $v, 'GET', null, ['TRON-PRO-API-KEY: ' . $tk, 'Accept: application/json']);
      if ($c !== 200) return ['ok' => true, 'msg' => 'Adresse valide ✓ (TronGrid n’a pas répondu au test, code ' . $c . '). Suite : admin → 🏦 Coffre.'];
      return ['ok' => true, 'msg' => 'Adresse valide ✓ L’argent des joueurs partira ici. Vérifie que c’est bien TON adresse : ' . substr($v, 0, 6) . '…' . substr($v, -6) . '. Suite : admin → 🏦 Coffre.'];
    case 'TATUM_API_KEY':
      // Test réel sur plusieurs réseaux : la clé lit-elle bien Bitcoin, Ethereum, BNB, Solana ?
      $ok = []; $ko = [];
      foreach (['bitcoin-mainnet' => ['getblockcount', []], 'ethereum-mainnet' => ['eth_blockNumber', []], 'bsc-mainnet' => ['eth_blockNumber', []], 'solana-mainnet' => ['getSlot', []]] as $net => [$m, $prm]) {
        [$c, $r] = keys_http('https://' . $net . '.gateway.tatum.io/', 'POST', json_encode(['jsonrpc' => '2.0', 'id' => 1, 'method' => $m, 'params' => $prm]), ['Content-Type: application/json', 'x-api-key: ' . $v]);
        $nm = ['bitcoin-mainnet' => 'Bitcoin', 'ethereum-mainnet' => 'Ethereum', 'bsc-mainnet' => 'BNB', 'solana-mainnet' => 'Solana'][$net];
        if ($c === 200 && str_contains($r, '"result"')) $ok[] = $nm; else $ko[] = $nm . ' (code ' . $c . ')';
      }
      if (!$ok) return ['ok' => false, 'msg' => 'Tatum refuse la clé : ' . implode(', ', $ko)];
      return ['ok' => true, 'msg' => 'Tatum répond ✓ ' . implode(', ', $ok) . ($ko ? ' — pas encore : ' . implode(', ', $ko) : '')];
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
    case 'META_ACCESS_TOKEN':
      $px = function_exists('orolado_meta_pixel_id') ? orolado_meta_pixel_id() : '987866443886391';
      [$c, $r] = keys_http('https://graph.facebook.com/v25.0/' . rawurlencode($px) . '?fields=id,name&access_token=' . rawurlencode($v));
      if ($c === 200 && str_contains($r, '"id"')) return ['ok' => true, 'msg' => 'Facebook accepte la clé ✓ pour le pixel ' . $px . '. Les dépôts seront envoyés tout seuls.'];
      return ['ok' => false, 'msg' => 'Facebook refuse la clé pour le pixel ' . $px . ' (code ' . $c . '). Vérifie que tu l’as générée DANS le pixel OROLADO (Settings → Conversions API).'];
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
  // 2026-11-15 (propriétaire : « quand il copie-colle, ça peut ajouter des choses ») : TOUS les caractères invisibles du téléphone
  // (espaces spéciaux, retours à la ligne, tiret conditionnel, liants, marques de direction) sont retirés, pour TOUTES les clés.
  $v = preg_replace('/[\x{00A0}\x{00AD}\x{1680}\x{180E}\x{2000}-\x{200F}\x{2028}-\x{202F}\x{205F}-\x{206F}\x{3000}\x{FEFF}\s]+/u', ' ', $val) ?? $val;
  $v = trim($v, " \t\n\r\"'`«»“”‘’");
  if (preg_match('/^' . preg_quote($name, '/') . '\s*[=:]?\s*(.+)$/i', $v, $m)) $v = trim($m[1], " \"'`«»“”‘’");
  if ($fmt !== '' && str_starts_with($name, 'VAULT_')) {
    // Adresses de portefeuille : JAMAIS un morceau découpé dans un texte (une adresse coupée = argent perdu).
    // On garde seulement un « mot » collé qui correspond EN ENTIER au format.
    foreach (preg_split('/[\s,;:()\[\]<>"\'«»]+/u', $v) ?: [] as $tok) if ($tok !== '' && preg_match($fmt, $tok)) return $tok;
    return str_replace(' ', '', $v);
  }
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
  if (str_starts_with($name, 'VAULT_')) {
    // Adresse fausse (somme de contrôle) → refusée AVANT d'être enregistrée.
    $chk = keys_test($name, $val);
    if ($chk['ok'] === false && str_contains((string) $chk['msg'], 'invalide')) return ['ok' => false, 'reason' => $chk['msg']];
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
