<?php
declare(strict_types=1);

require_once dirname(__DIR__) . '/orolado_lib.php';
orolado_load_env();

orolado_flutterwave_callback($_GET);
