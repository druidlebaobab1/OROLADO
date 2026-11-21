<?php
declare(strict_types=1);
// Script de maintenance : uniquement en ligne de commande, jamais depuis internet.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * 2026-11-21 (propriétaire : « les amis de mes affiliés ont disparu de leur page Invitation ») — DIAGNOSTIC d'un affilié.
 * LECTURE SEULE : rien n'est modifié, rien n'est versé.
 *
 * Donne toutes les fiches locales de la MÊME personne (id local u_…, id Supabase, autres fiches au même e-mail, liens déjà
 * retenus), et pour chacune : e-mail, id Supabase, numéro ORO-…, identifiant R…, connexions ouvertes, et ses données
 * d'affiliation (amis, compteurs, codes, versements 60 %). Puis la fiche « maison » et ce que sa page Invitation montre.
 *
 * Usage :  php scripts/aff-diagnose.php RYRP912            (identifiant R… affiché)
 *          php scripts/aff-diagnose.php ORO-123456         (numéro ORO-…)
 *          php scripts/aff-diagnose.php marc@gmail.com     (e-mail)
 *          php scripts/aff-diagnose.php u_ab12… | <uuid>   (id interne / id Supabase)
 *          … --all   (liste TOUS les amis de chaque fiche, au lieu des 30 premiers)
 *          … --json  (sortie JSON)
 */
require_once __DIR__ . '/../orolado_lib.php';
require_once __DIR__ . '/../aff_lib.php';
if (is_file(__DIR__ . '/../aff_rev_lib.php')) require_once __DIR__ . '/../aff_rev_lib.php';
if (is_file(__DIR__ . '/../live_lib.php')) require_once __DIR__ . '/../live_lib.php';

$args = array_slice($argv, 1);
$all = in_array('--all', $args, true);
$asJson = in_array('--json', $args, true);
$q = '';
foreach ($args as $a) if ($a !== '' && $a[0] !== '-') $q = trim($a);
if ($q === '') { fwrite(STDERR, "Usage : php scripts/aff-diagnose.php <ID R… | ORO-… | e-mail | id> [--all] [--json]\n"); exit(2); }

$db = load_db();
$users = $db['users'] ?? [];
$rmap = []; $rinv = [];
if (function_exists('live_ids_file')) { $m = live_read_json(live_ids_file(), []); $rmap = (array) ($m['r'] ?? []); $rinv = (array) ($m['ri'] ?? []); }

// 1) Point de départ : toutes les fiches qui correspondent à ce qui est tapé.
$start = [];
if (is_array($users[$q] ?? null)) $start[$q] = 'id';
if (isset($rinv[strtoupper($q)]) && is_array($users[(string) $rinv[strtoupper($q)]] ?? null)) $start[(string) $rinv[strtoupper($q)]] = 'identifiant R…';
if (str_contains($q, '@')) foreach (orolado_users_by_email($db, strtolower($q)) as $k => $_) $start[(string) $k] = 'e-mail';
if (orolado_aff_is_uuid($q)) foreach (orolado_users_by_sb($db, $q) as $k => $_) $start[(string) $k] = 'id Supabase';
if (!$start) {
  $qu = strtoupper($q);
  foreach ($users as $k => $u) {
    if (!is_array($u)) continue;
    if (strtoupper((string) ($u['publicId'] ?? '')) === $qu || strtoupper((string) ($rmap[(string) $k] ?? '')) === $qu) $start[(string) $k] = 'numéro';
  }
}
if (!$start) { echo "Aucune fiche locale ne correspond à « $q ».\n"; exit(1); }

// 2) Toutes les fiches de la personne (index + liens retenus), sans rien écrire.
$ids = [];
foreach (array_keys($start) as $s) {
  foreach (orolado_aff_live_ids($db, (string) $s) as $x) $ids[$x] = true;
  foreach (orolado_aff_stored_ids((string) $s) as $x) $ids[$x] = true;
}
$grp = orolado_aff_group($db, (string) array_key_first($start), false);
foreach ($grp['ids'] as $x) $ids[$x] = true;

$out = ['query' => $q, 'found' => $start, 'home' => $grp['home'], 'ids' => []];
foreach (array_keys($ids) as $id) {
  $id = (string) $id;
  $u = is_array($users[$id] ?? null) ? $users[$id] : null;
  $lines = orolado_aff_fr_lines($id);
  $own = orolado_aff_read(orolado_aff_owner_name($id));
  $rev = function_exists('orolado_aff_rev_name') ? orolado_aff_read(orolado_aff_rev_name($id)) : [];
  $inv = orolado_aff_read(orolado_aff_inv_name($id));
  $lnk = orolado_aff_read(orolado_aff_link_name($id));
  $codeD = orolado_aff_code($id);
  $codeOwner = (string) (orolado_aff_read('code_' . $codeD)['uid'] ?? '');
  $sess = orolado_sessions_of_user($db, $id);
  $lastSess = '';
  foreach ($sess as $s) { $t = (string) ($s['at'] ?? ''); if (strcmp($t, $lastSess) > 0) $lastSess = $t; }
  $friends = [];
  foreach ($lines as $l) {
    $fu = (string) $l['u'];
    $fr = is_array($users[$fu] ?? null) ? $users[$fu] : null;
    $friends[] = ['uid' => $fu, 'existe' => $fr !== null, 'publicId' => (string) ($fr['publicId'] ?? ''), 'R' => (string) ($rmap[$fu] ?? ''),
      'email' => (string) ($fr['email'] ?? ''), 'sbId' => (string) ($fr['sbId'] ?? ''), 'inscrit' => (string) ($l['a'] ?? ''), 'code' => (string) ($l['c'] ?? '')];
  }
  $out['ids'][$id] = [
    'fiche' => $u ? 'oui' : 'NON (aucune fiche locale)',
    'champ id' => (string) ($u['id'] ?? ''), 'email' => (string) ($u['email'] ?? ''), 'originalEmail' => (string) ($u['originalEmail'] ?? ''),
    'sbId' => (string) ($u['sbId'] ?? ''), 'publicId' => (string) ($u['publicId'] ?? ''), 'R' => (string) ($rmap[$id] ?? ''),
    'nom' => (string) ($u['displayName'] ?? ''), 'créé' => (string) ($u['createdAt'] ?? ''), 'vu' => (string) ($u['lastSeen'] ?? ''),
    'google' => strtolower((string) ($u['authProvider'] ?? '')) === 'google', 'role' => (string) ($u['role'] ?? ''),
    'connexions' => count($sess), 'dernièreConnexion' => $lastSess,
    'amis (lignes)' => count($lines), 'own.n' => (int) ($own['n'] ?? 0), 'own.nPaid' => (int) ($own['nPaid'] ?? 0), 'clics' => (int) ($own['clicks'] ?? 0),
    'codesPerso' => array_values((array) ($own['codes'] ?? [])), 'codeParDéfaut' => $codeD, 'codeParDéfaut→' => $codeOwner,
    'ancien5%' => (float) ($own['earned'] ?? 0), 'versé60%' => (float) ($rev['withdrawn'] ?? 0), 'versements' => count((array) ($rev['log'] ?? [])),
    'enCours' => $rev['pending'] ?? null, 'invitéPar' => (string) ($inv['inviter'] ?? ''), 'lienRetenu' => $lnk ?: null,
    'amis' => $all ? $friends : array_slice($friends, 0, 30),
  ];
}
$union = orolado_aff_group_fr_lines((string) array_key_first($start), $db);
$out['page'] = ['amis (toutes fiches, sans doublon)' => count($union), 'lien affiché' => orolado_aff_code($grp['home'] ?: (string) array_key_first($start))];
if (function_exists('orolado_aff_rev_paid_all')) $out['page']['déjà versé 60 % (toutes fiches)'] = orolado_aff_rev_paid_all((string) array_key_first($start), $db);

if ($asJson) { echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n"; exit(0); }

echo "Recherche : $q\n";
foreach ($start as $k => $how) echo "  trouvé par $how : $k\n";
echo "\nFiches de la même personne (" . count($out['ids']) . ") — fiche maison : " . ($grp['home'] ?: '—') . "\n";
foreach ($out['ids'] as $id => $r) {
  echo "\n■ $id" . ($id === $grp['home'] ? '   ← MAISON (amis, lien, versements)' : '') . "\n";
  foreach ($r as $k => $v) {
    if ($k === 'amis') continue;
    if (is_array($v)) $v = json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (is_bool($v)) $v = $v ? 'oui' : 'non';
    if ($v === '' || $v === null || $v === '[]') continue;
    echo '    ' . $k . str_repeat(' ', max(1, 19 - mb_strlen((string) $k))) . $v . "\n";
  }
  if ($r['amis']) {
    echo "    amis rangés sous cette fiche :\n";
    foreach ($r['amis'] as $f) {
      echo '      - ' . $f['uid'] . ($f['existe'] ? '' : ' (FICHE INTROUVABLE)') . ' · ' . ($f['R'] ?: '—') . ' · ' . ($f['publicId'] ?: '—') . ' · ' . ($f['email'] ?: '—')
        . ($f['sbId'] !== '' ? ' · sb ' . $f['sbId'] : '') . ' · inscrit ' . ($f['inscrit'] ?: '—') . "\n";
    }
    if (!$all && $r['amis (lignes)'] > 30) echo "      … (" . ($r['amis (lignes)'] - 30) . " de plus : --all)\n";
  }
}
echo "\nCe que montre sa page Invitation (après la correction 2026-11-21) :\n";
foreach ($out['page'] as $k => $v) echo '  ' . $k . ' : ' . $v . "\n";
echo "\nÀ lire : si ses amis sont sous une fiche et que ses connexions (« connexions ») sont sur une AUTRE fiche, c'était la cause.\n";
