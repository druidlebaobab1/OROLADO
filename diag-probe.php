<?php
/**
 * Sonde de diagnostic TEMPORAIRE (à supprimer après contrôle).
 * Ne renvoie que des booléens : aucune clé n'est exposée.
 * Accès protégé par un jeton aléatoire passé en ?k=
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

$TOKEN = '7f3c1a9be4d25806af1c93d7e0b45a62';
if (!hash_equals($TOKEN, (string) ($_GET['k'] ?? ''))) {
  http_response_code(404);
  echo json_encode(['ok' => false]);
  exit;
}

require_once __DIR__ . '/orolado_lib.php';
orolado_load_env();

$out = ['ok' => true];

// 1. Lecture du .env côté serveur : présence uniquement, jamais les valeurs.
$out['env'] = [
  'fichier_present' => is_file(__DIR__ . '/.env'),
  'MAKETOU_API_KEY' => maketou_api_key() !== '',
  'SUPABASE_URL' => supabase_project_url() !== '',
  'SUPABASE_ANON_KEY' => supabase_anon_key() !== '',
  'SUPABASE_SERVICE_ROLE_KEY' => supabase_service_key() !== '',
  'service_role_pret' => supabase_admin_ready(),
];

$hdrs = supabase_admin_headers();
$base = supabase_project_url();

function probe_http(string $url, array $headers, ?string $body, string $method): array {
  $ch = curl_init($url);
  $opts = [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10, CURLOPT_HTTPHEADER => $headers];
  if ($method === 'POST') { $opts[CURLOPT_POST] = true; $opts[CURLOPT_POSTFIELDS] = $body ?? '{}'; }
  elseif ($method !== 'GET') { $opts[CURLOPT_CUSTOMREQUEST] = $method; if ($body !== null) $opts[CURLOPT_POSTFIELDS] = $body; }
  curl_setopt_array($ch, $opts);
  $raw = curl_exec($ch);
  $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  return ['http' => $code, 'json' => json_decode((string) $raw, true), 'raw' => substr((string) $raw, 0, 200)];
}

if (!$hdrs) {
  $out['supabase'] = ['joignable' => false, 'raison' => 'service_role absente'];
  echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
  exit;
}

// 2. Connexion Supabase avec la clé service_role.
$vaults = probe_http($base . '/rest/v1/vaults?select=user_id,real&limit=1', $hdrs, null, 'GET');
$out['supabase'] = [
  'joignable' => $vaults['http'] === 200,
  'http' => $vaults['http'],
];

// 3. resolve_trade exécutable par service_role, sans effet de bord (p_order vide).
$dry = probe_http($base . '/rest/v1/rpc/resolve_trade', $hdrs, json_encode([
  'p_user' => '00000000-0000-0000-0000-000000000000',
  'p_order' => '',
  'p_amount' => 0,
]), 'POST');
$dryJson = is_array($dry['json']) && isset($dry['json'][0]) ? $dry['json'][0] : $dry['json'];
$out['resolve_trade'] = [
  'executable_par_service_role' => $dry['http'] === 200,
  'reponse_a_vide' => $dryJson,
];

// 4. Addition de 5 règlements simultanés (+1 chacun), puis compensation -5.
$uid = $vaults['json'][0]['user_id'] ?? '';
$soldeAvant = isset($vaults['json'][0]['real']) ? (int) $vaults['json'][0]['real'] : null;
if ($uid === '' || $soldeAvant === null) {
  $out['concurrence'] = ['lance' => false, 'raison' => 'aucun vault disponible'];
  echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
  exit;
}

$tag = 'diag_' . bin2hex(random_bytes(5));
$orders = [];
for ($i = 1; $i <= 5; $i++) $orders[] = $tag . '_' . $i;

// Vrai parallélisme : les 5 requêtes partent ensemble, comme 5 trades qui expirent.
$mh = curl_multi_init();
$handles = [];
foreach ($orders as $oid) {
  $ch = curl_init($base . '/rest/v1/rpc/resolve_trade');
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_HTTPHEADER => $hdrs,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode(['p_user' => $uid, 'p_order' => $oid, 'p_amount' => 1]),
  ]);
  curl_multi_add_handle($mh, $ch);
  $handles[$oid] = $ch;
}
$running = null;
do { curl_multi_exec($mh, $running); curl_multi_select($mh, 0.2); } while ($running > 0);
$reponses = [];
foreach ($handles as $oid => $ch) {
  $reponses[$oid] = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_multi_remove_handle($mh, $ch);
  curl_close($ch);
}
curl_multi_close($mh);

$apres = probe_http($base . '/rest/v1/vaults?select=real&user_id=eq.' . rawurlencode($uid), $hdrs, null, 'GET');
$soldeApres = isset($apres['json'][0]['real']) ? (int) $apres['json'][0]['real'] : null;

// Rejeu d'un ordre déjà réglé : doit être refusé sans recréditer.
$rejeu = probe_http($base . '/rest/v1/rpc/resolve_trade', $hdrs, json_encode([
  'p_user' => $uid, 'p_order' => $orders[0], 'p_amount' => 1,
]), 'POST');
$rejeuJson = is_array($rejeu['json']) && isset($rejeu['json'][0]) ? $rejeu['json'][0] : $rejeu['json'];
$apresRejeu = probe_http($base . '/rest/v1/vaults?select=real&user_id=eq.' . rawurlencode($uid), $hdrs, null, 'GET');
$soldeApresRejeu = isset($apresRejeu['json'][0]['real']) ? (int) $apresRejeu['json'][0]['real'] : null;

// Compensation : on remet le solde exactement à sa valeur initiale.
probe_http($base . '/rest/v1/rpc/resolve_trade', $hdrs, json_encode([
  'p_user' => $uid, 'p_order' => $tag . '_compensation', 'p_amount' => -5,
]), 'POST');
$final = probe_http($base . '/rest/v1/vaults?select=real&user_id=eq.' . rawurlencode($uid), $hdrs, null, 'GET');
$soldeFinal = isset($final['json'][0]['real']) ? (int) $final['json'][0]['real'] : null;

// Nettoyage des lignes de diagnostic.
probe_http($base . '/rest/v1/trade_settlements?order_id=like.' . rawurlencode($tag . '%'), $hdrs, null, 'DELETE');
$reste = probe_http($base . '/rest/v1/trade_settlements?select=order_id&order_id=like.' . rawurlencode($tag . '%'), $hdrs, null, 'GET');

$out['concurrence'] = [
  'utilisateur_teste' => substr($uid, 0, 8) . '…',
  'codes_http_des_5_appels_paralleles' => array_values($reponses),
  'solde_avant' => $soldeAvant,
  'solde_apres_5_credits_de_1' => $soldeApres,
  'addition_correcte' => ($soldeApres === $soldeAvant + 5),
  'rejeu_du_meme_ordre' => $rejeuJson,
  'solde_apres_rejeu' => $soldeApresRejeu,
  'pas_de_double_credit' => ($soldeApresRejeu === $soldeApres),
  'solde_final_apres_compensation' => $soldeFinal,
  'solde_restaure' => ($soldeFinal === $soldeAvant),
  'lignes_diag_restantes' => is_array($reste['json']) ? count($reste['json']) : null,
];

echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
