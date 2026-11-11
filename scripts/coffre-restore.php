<?php
declare(strict_types=1);
// Script de récupération : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * Récupération du coffre OROLADO depuis la copie de secours (fichier orolado-coffre-AAAA-MM-JJ.json + mot de passe).
 * Affiche chaque adresse et sa clé privée : une clé peut être importée dans Trust Wallet (Ajouter un portefeuille →
 * J'ai déjà un portefeuille → Tron → Clé privée) pour récupérer l'argent resté sur cette adresse.
 * Usage : php scripts/coffre-restore.php orolado-coffre-2026-11-11.json
 */
$f = $argv[1] ?? '';
$file = json_decode((string) @file_get_contents($f), true);
if (!is_array($file) || ($file['app'] ?? '') !== 'OROLADO coffre') { fwrite(STDERR, "Fichier de copie introuvable ou invalide.\n"); exit(1); }
fwrite(STDOUT, 'Mot de passe : ');
$pass = rtrim((string) fgets(STDIN), "\r\n");
$key = hash_pbkdf2('sha256', $pass, (string) base64_decode($file['salt']), 200000, 32, true);
$p = openssl_decrypt((string) base64_decode($file['data']), 'aes-256-gcm', $key, OPENSSL_RAW_DATA, (string) base64_decode($file['iv']), (string) base64_decode($file['tag']));
$j = is_string($p) ? json_decode($p, true) : null;
if (!is_array($j)) { fwrite(STDERR, "Mot de passe faux.\n"); exit(1); }
echo 'Destination (Trust Wallet) : ' . ($j['dest'] ?? '') . "\n" . count($j['items']) . " clés :\n";
foreach ($j['items'] as $it) echo $it['addr'] . '  ' . $it['uid'] . '  ' . $it['pk'] . "\n";
