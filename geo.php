<?php
/**
 * 2026-10-21 (propriétaire) — pays de la CONNEXION du visiteur (pour afficher l'équivalent de son solde dans sa monnaie,
 * js/localcur.js). Lecture seule : aucun compte, aucun argent. Même détection que les paiements Flutterwave
 * (en-têtes du réseau, sinon api.country.is). Réponse : {"cc":"CI"} (vide si inconnu). Le téléphone garde la réponse 7 jours.
 */
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: private, max-age=86400');
require_once __DIR__ . '/orolado_lib.php';
$cc = '';
try { $cc = function_exists('orolado_flw_ip_country') ? orolado_flw_ip_country() : ''; } catch (Throwable $e) { $cc = ''; }
echo json_encode(['cc' => $cc]);
