<?php
declare(strict_types=1);

// 2026-11-19 — retour de la page de paiement GeniusPay : vérification puis retour sur le site (?deposit=success&ref=…).
require_once dirname(__DIR__) . '/orolado_lib.php';
orolado_load_env();
@set_time_limit(25);
orolado_geniuspay_return($_GET);
