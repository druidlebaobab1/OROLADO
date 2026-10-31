<?php
declare(strict_types=1);
// Script de test : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * AFFILIATION PART DE REVENU (aff_rev_lib.php) : l'affilié touche 60 % de ce qu'OROLADO a VRAIMENT gardé
 * sur ses amis (marge réelle), tous amis additionnés, avec report négatif et plafond anti-chargeback.
 * On PROUVE ici l'essentiel : la caisse ne peut jamais payer plus que 60 % de son vrai gain — même si
 * un tricheur crée des comptes, hedge (parie l'opposé), ou dépose en masse. Faux Supabase, dossier temporaire.
 */
$tmp = sys_get_temp_dir() . '/orolado_affrev_' . bin2hex(random_bytes(4));
mkdir($tmp . '/data', 0755, true);
foreach (['orolado_lib.php', 'trade_lib.php', 'feed_lib.php', 'fair_table.php', 'aff_lib.php', 'aff_rev_lib.php'] as $f) copy(__DIR__ . '/../' . $f, $tmp . '/' . $f);
putenv('SUPABASE_URL=https://fake.supabase.test');
putenv('SUPABASE_SERVICE_ROLE_KEY=fake-service-key');
putenv('OROLADO_AFF_PUBLIC=1');
putenv('OROLADO_AFF_REV=1');
putenv('OROLADO_AFF_REV_PCT=60');
putenv('OROLADO_AFF_REV_HOLD_H=24');
$GLOBALS['OROLADO_FAKE_HTTP'] = function (string $url, ?string $body, string $method) { return []; };
require $tmp . '/orolado_lib.php';
require $tmp . '/trade_lib.php';
require $tmp . '/aff_rev_lib.php';

$pass = 0; $fail = 0;
function check(string $w, bool $ok, string $d = ''): void { global $pass, $fail; $ok ? $pass++ : $fail++; echo ($ok ? '  OK   ' : '  ÉCHEC ') . $w . ($d !== '' ? "  ($d)" : '') . "\n"; }

$OLD = date('c', time() - 3 * 86400); // réglé depuis 3 jours (passe le hold de 24 h)
$NEW = date('c');                      // tout frais (bloqué par le hold)

function reset_db(): array {
  // Les fichiers data/aff/ (liaisons, portefeuilles) survivent au blank_db : on les efface aussi.
  foreach (glob(orolado_data_dir() . '/aff/*') ?: [] as $p) @unlink($p);
  $db = blank_db();
  $db['users']['admin_master'] = ['id' => 'admin_master', 'email' => 'admin@orolado.com', 'role' => 'admin'];
  save_db(orolado_data_file(), $db);
  return $db;
}
function mkuser(string $uid, string $email): void {
  $db = load_db();
  $db['users'][$uid] = ['id' => $uid, 'email' => $email, 'role' => 'user', 'displayName' => $uid, 'publicId' => 'ORO-' . substr(md5($uid), 0, 6)];
  $db['vault'][$uid] = ['demo' => 1000000, 'real' => 0];
  save_db(orolado_data_file(), $db);
}
function deposit(string $uid, float $amount, string $when, string $op = 'flutterwave'): void {
  $db = load_db();
  $id = ($op === 'admin' ? 'adm_' : 'flw_') . bin2hex(random_bytes(5));
  $db['deposits'][] = ['id' => $id, 'ref' => $id, 'userId' => $uid, 'amount' => $amount, 'status' => 'COMPLETED', 'operator' => $op, 'createdAt' => $when, 'paidAt' => $when];
  save_db(orolado_data_file(), $db);
}
function withdraw(string $uid, float $amount): void {
  $db = load_db();
  $db['withdrawals'][] = ['id' => 'wd_' . bin2hex(random_bytes(5)), 'userId' => $uid, 'amount' => $amount, 'status' => 'approved'];
  save_db(orolado_data_file(), $db);
}
// Pari RÉGLÉ : won=gain rendu (stake*payout) ; lost=rien rendu. 'when' = date de règlement.
function bet(string $uid, float $stake, bool $won, string $when, float $payout = 1.90): void {
  $db = load_db();
  $db['orders'][] = ['id' => 'o_' . bin2hex(random_bytes(5)), 'userId' => $uid, 'mode' => 'real',
    'status' => $won ? 'won' : 'lost', 'won' => $won, 'stake' => $stake, 'payout' => $payout, 'settledAt' => $when, 'createdAt' => $when];
  save_db(orolado_data_file(), $db);
}
/** Vrai gain de la caisse sur un joueur (mises réglées − gains rendus), bets âgés ≥ hold. */
function house_kept(array $db, string $uid): float {
  $cut = time() - 24 * 3600;
  return orolado_aff_rev_bet_margin($db, [$uid], $cut);
}

echo "1) Ami honnête : dépose 100 \$, joue et perd 100 \$ → affilié dû 60 \$, caisse garde 40 \$\n";
reset_db();
mkuser('inv', 'inv@g.com'); mkuser('f1', 'f1@g.com');
$code = (string) orolado_aff_status(load_db(), load_db()['users']['inv'])['code'];
check('ami relié', orolado_aff_attach(load_db(), 'f1', $code));
deposit('f1', 100, $OLD);
// il mise 100 $ au total et perd tout (plusieurs petits paris réglés il y a 3 jours)
bet('f1', 50, false, $OLD); bet('f1', 50, false, $OLD);
$w = orolado_aff_rev_wallet(load_db(), 'inv');
check('marge caisse = 100 $', abs($w['friends'][0]['margin'] - 100) < 0.001, (string) $w['friends'][0]['margin']);
check('NGR = 100 $', abs($w['ngr'] - 100) < 0.001, (string) $w['ngr']);
check('dû affilié = 60 $', abs($w['entitled'] - 60) < 0.001, (string) $w['entitled']);
check('caisse garde 40 $ (100 − 60)', abs((100 - $w['entitled']) - 40) < 0.001);

echo "2) Hold : un dépôt/pari de moins de 24 h ne compte pas encore\n";
reset_db();
mkuser('inv', 'inv@g.com'); mkuser('f1', 'f1@g.com');
$code = (string) orolado_aff_status(load_db(), load_db()['users']['inv'])['code'];
orolado_aff_attach(load_db(), 'f1', $code);
deposit('f1', 100, $NEW); bet('f1', 100, false, $NEW);
$w = orolado_aff_rev_wallet(load_db(), 'inv');
check('tout frais : dû = 0 $ (en attente)', abs($w['entitled']) < 0.001, (string) $w['entitled']);

echo "3) Report négatif : si l'ami gagne, le compteur descend (comme le −115 \$ de 1win)\n";
reset_db();
mkuser('inv', 'inv@g.com'); mkuser('f1', 'f1@g.com');
$code = (string) orolado_aff_status(load_db(), load_db()['users']['inv'])['code'];
orolado_aff_attach(load_db(), 'f1', $code);
deposit('f1', 100, $OLD);
bet('f1', 100, true, $OLD, 1.90); // il gagne : caisse rend 190 → marge = 100 − 190 = −90
$w = orolado_aff_rev_wallet(load_db(), 'inv');
check('marge négative (ami gagnant)', $w['friends'][0]['margin'] < 0, (string) $w['friends'][0]['margin']);
check('NGR plafonné et négatif', $w['ngr'] < 0, (string) $w['ngr']);
check('solde affilié négatif, rien à retirer', $w['balance'] < 0 && abs($w['withdrawable']) < 0.001, 'bal=' . $w['balance']);

echo "4) SUREBET / tricheur : 2 amis, l'un gagne gros l'autre perd gros (paris opposés)\n";
reset_db();
mkuser('inv', 'inv@g.com'); mkuser('fa', 'fa@g.com'); mkuser('fb', 'fb@g.com');
$code = (string) orolado_aff_status(load_db(), load_db()['users']['inv'])['code'];
orolado_aff_attach(load_db(), 'fa', $code); orolado_aff_attach(load_db(), 'fb', $code);
deposit('fa', 1000, $OLD); deposit('fb', 1000, $OLD);
bet('fa', 1000, true, $OLD, 1.90);   // A gagne 1900 : marge A = 1000 − 1900 = −900
bet('fb', 1000, false, $OLD, 1.90);  // B perd 1000 : marge B = +1000
$db = load_db();
$trueKept = house_kept($db, 'fa') + house_kept($db, 'fb'); // = −900 + 1000 = 100 (la marge)
$w = orolado_aff_rev_wallet($db, 'inv');
check('vraie marge totale gardée par la caisse = 100 $', abs($trueKept - 100) < 0.001, (string) $trueKept);
check('dû affilié ≤ 60 % de la vraie marge', $w['entitled'] <= 0.60 * $trueKept + 0.001, 'dû=' . $w['entitled'] . ' max=' . (0.6 * $trueKept));
check('le tricheur ne peut PAS extraire 600 $ (bug évité)', $w['entitled'] < 100, 'dû=' . $w['entitled']);

echo "5) Plafond anti-chargeback : marge gagnée mais dépôts pas encore réglés → pas payé\n";
reset_db();
mkuser('inv', 'inv@g.com'); mkuser('f1', 'f1@g.com');
$code = (string) orolado_aff_status(load_db(), load_db()['users']['inv'])['code'];
orolado_aff_attach(load_db(), 'f1', $code);
deposit('f1', 100, $NEW);          // dépôt frais (pas réglé)
bet('f1', 100, false, $OLD);       // mais pari « vieux »
$w = orolado_aff_rev_wallet(load_db(), 'inv');
check('dépôts nets réglés = 0 → NGR plafonné à 0', $w['ngr'] <= 0.001 && $w['entitled'] <= 0.001, 'ngr=' . $w['ngr']);

echo "6) Bonus/défi/crédits admin de l'ami : jamais comptés comme dépôt ni comme marge\n";
reset_db();
mkuser('inv', 'inv@g.com'); mkuser('f1', 'f1@g.com');
$code = (string) orolado_aff_status(load_db(), load_db()['users']['inv'])['code'];
orolado_aff_attach(load_db(), 'f1', $code);
deposit('f1', 500, $OLD, 'admin'); // bonus admin
$db = load_db();
$db['users']['f1']['transactions'] = [['id' => 'c1', 'type' => 'credit', 'amount' => 300, 'mode' => 'real']];
save_db(orolado_data_file(), $db);
$w = orolado_aff_rev_wallet(load_db(), 'inv');
check('800 $ de bonus/crédits : dépôts réglés = 0', abs($w['friends'][0]['deposits']) < 0.001, (string) $w['friends'][0]['deposits']);
check('dû = 0 $', abs($w['entitled']) < 0.001, (string) $w['entitled']);

echo "7) Masse : 50 comptes déposent 2 \$ et perdent tout → dû 60 \$, caisse garde 40 \$\n";
reset_db();
mkuser('inv', 'inv@g.com');
$code = (string) orolado_aff_status(load_db(), load_db()['users']['inv'])['code'];
for ($i = 0; $i < 50; $i++) { mkuser("m$i", "m$i@g.com"); orolado_aff_attach(load_db(), "m$i", $code); deposit("m$i", 2, $OLD); bet("m$i", 2, false, $OLD); }
$w = orolado_aff_rev_wallet(load_db(), 'inv');
check('50 amis comptés', $w['friendsCount'] === 50, (string) $w['friendsCount']);
check('NGR = 100 $ (50 × 2)', abs($w['ngr'] - 100) < 0.001, (string) $w['ngr']);
check('dû = 60 $, caisse garde 40 $', abs($w['entitled'] - 60) < 0.001, (string) $w['entitled']);

echo "8) INVARIANT ALÉATOIRE (200 scénarios) : dû ≤ 60 % de ce que la caisse a VRAIMENT gardé\n";
$worst = 0.0; $ok = true;
for ($s = 0; $s < 200; $s++) {
  reset_db();
  mkuser('inv', 'inv@g.com');
  $code = (string) orolado_aff_status(load_db(), load_db()['users']['inv'])['code'];
  $nf = random_int(1, 6);
  $trueKept = 0.0;
  $fus = [];
  for ($i = 0; $i < $nf; $i++) {
    $fu = "r$i"; $fus[] = $fu; mkuser($fu, "$fu@g.com"); orolado_aff_attach(load_db(), $fu, $code);
    $dep = random_int(1, 50) * 10;
    deposit($fu, (float) $dep, $OLD);
    $nb = random_int(1, 5);
    for ($b = 0; $b < $nb; $b++) {
      $stake = random_int(1, max(1, (int) ($dep / 2)));
      $won = random_int(0, 100) < 40; // le joueur gagne parfois
      bet($fu, (float) $stake, $won, $OLD, 1.90);
    }
    if (random_int(0, 3) === 0) withdraw($fu, (float) random_int(1, $dep));
  }
  $db = load_db();
  foreach ($fus as $u) $trueKept += house_kept($db, $u);
  $w = orolado_aff_rev_wallet($db, 'inv');
  // La caisse ne doit JAMAIS payer plus que 60 % de ce qu'elle a réellement gardé (marge totale).
  $maxAllowed = 0.60 * max(0.0, $trueKept) + 0.02;
  if ($w['entitled'] > $maxAllowed) { $ok = false; echo "    contre-exemple : dû={$w['entitled']} kept=$trueKept\n"; break; }
  $ratio = $trueKept > 0.01 ? $w['entitled'] / $trueKept : 0.0;
  if ($ratio > $worst) $worst = $ratio;
}
check('200 scénarios : dû ≤ 60 % de la vraie marge (jamais la caisse dans le rouge)', $ok, 'pire ratio = ' . round($worst * 100, 1) . '%');

echo "\n" . ($fail === 0 ? "TOUT EST BON" : "PROBLÈME") . " : $pass OK, $fail échec(s)\n";
exit($fail === 0 ? 0 : 1);
