<?php
declare(strict_types=1);
/**
 * Fabrique la page orolado.online (dossier decouvrir/) en 11 langues à partir de la page française
 * (scripts/decouvrir-source-fr.html) et des traductions (scripts/decouvrir-langues.txt, colonnes séparées par « || »).
 * Anglais = page par défaut (decouvrir/index.html), les autres dans decouvrir/xx/index.html.
 * Chaque page dit à Google quelles versions existent (hreflang), a son propre « canonical » et un sélecteur de langue.
 * Lancer : php scripts/decouvrir-langues.php
 */
$root = dirname(__DIR__);
$src = file_get_contents($root . '/scripts/decouvrir-source-fr.html');
$src = str_replace("\r\n", "\n", $src);
$lines = array_values(array_filter(explode("\n", str_replace("\r", '', file_get_contents($root . '/scripts/decouvrir-langues.txt'))), 'strlen'));
$langs = explode('||', array_shift($lines));
$rows = [];
foreach ($lines as $i => $l) {
  $c = explode('||', $l);
  if (count($c) !== count($langs)) { fwrite(STDERR, 'Ligne ' . ($i + 2) . ' : ' . count($c) . " colonnes\n"); exit(1); }
  $rows[] = $c;
}
// Les plus longs d'abord (certaines phrases en contiennent d'autres).
usort($rows, static fn($a, $b) => strlen($b[0]) <=> strlen($a[0]));

$names = ['en' => 'English', 'fr' => 'Français', 'es' => 'Español', 'pt' => 'Português', 'ar' => 'العربية', 'tr' => 'Türkçe',
  'de' => 'Deutsch', 'ru' => 'Русский', 'id' => 'Bahasa Indonesia', 'vi' => 'Tiếng Việt', 'hi' => 'हिन्दी'];
$locales = ['en' => 'en-US', 'fr' => 'fr-FR', 'es' => 'es-ES', 'pt' => 'pt-BR', 'ar' => 'ar-u-nu-latn', 'tr' => 'tr-TR',
  'de' => 'de-DE', 'ru' => 'ru-RU', 'id' => 'id-ID', 'vi' => 'vi-VN', 'hi' => 'hi-IN'];
$order = ['en', 'fr', 'es', 'pt', 'ar', 'tr', 'de', 'ru', 'id', 'vi', 'hi'];
$url = static fn(string $l): string => 'https://orolado.online/decouvrir/' . ($l === 'en' ? '' : $l . '/');

$alt = '';
foreach ($order as $l) $alt .= '  <link rel="alternate" hreflang="' . $l . '" href="' . $url($l) . "\">\n";
$alt .= '  <link rel="alternate" hreflang="x-default" href="' . $url('en') . "\">\n";

$css = "    /* Sélecteur de langue */\n"
  . "    .lang{display:inline-flex;align-items:center;gap:4px;margin-left:auto;border:1px solid var(--line);border-radius:10px;padding:0 4px 0 8px;background:rgba(255,255,255,.05);color:var(--txt);font-size:14px}\n"
  . "    .lang select{background:transparent;color:var(--txt);border:0;font:700 13px \"Plus Jakarta Sans\",system-ui,sans-serif;padding:8px 2px;max-width:112px;outline:none}\n"
  . "    .lang option{color:#111}\n"
  . "    [dir=rtl] .tape,[dir=rtl] .live svg,[dir=rtl] .tk .p{direction:ltr}\n"
  . "    [dir=rtl] .lang{margin-left:0;margin-right:auto}\n"
  . "    @media (max-width:420px){ .lang select{max-width:78px} }\n";

$total = 0;
foreach ($order as $col => $l) {
  $k = array_search($l, $langs, true);
  $h = $src;
  $miss = [];
  if ($l !== 'fr') {
    foreach ($rows as $r) {
      if (strpos($h, $r[0]) === false) { $miss[] = $r[0]; continue; }
      $h = str_replace($r[0], $r[$k], $h);
    }
  }
  $h = str_replace(['\'fr-FR\'', "Intl.DisplayNames(['fr']", '"inLanguage":"fr"'],
    ["'" . $locales[$l] . "'", "Intl.DisplayNames(['" . $l . "']", '"inLanguage":"' . $l . '"'], $h);
  $h = str_replace('<html lang="fr">', '<html lang="' . $l . '"' . ($l === 'ar' ? ' dir="rtl"' : '') . '>', $h);
  $h = str_replace('<link rel="canonical" href="https://orolado.online/decouvrir/">', '<link rel="canonical" href="' . $url($l) . "\">\n" . rtrim($alt), $h);
  $h = str_replace('<meta property="og:url" content="https://orolado.online/decouvrir/">', '<meta property="og:url" content="' . $url($l) . '">', $h);
  $h = str_replace("    @media (max-width:860px){\n      .hero{", $css . "    @media (max-width:860px){\n      .hero{", $h);
  // Sélecteur de langue dans la barre du haut (avant le bouton doré).
  $opts = '';
  foreach ($order as $o) $opts .= '<option value="' . $url($o) . '"' . ($o === $l ? ' selected' : '') . '>' . $names[$o] . '</option>';
  $sel = '<label class="lang" title="Language"><span aria-hidden="true">🌐</span><select aria-label="Language" onchange="try{localStorage.setItem(\'oroLangPick\',this.value)}catch(e){}location.href=this.value">' . $opts . '</select></label>' . "\n    ";
  $h = preg_replace('~(<header>\s*<div class="wrap nav">\s*<a class="brand"[^\n]*\n\s*)~', '$1' . $sel, $h, 1, $c);
  if (!$c) { fwrite(STDERR, "Sélecteur non posé ($l)\n"); exit(1); }
  // Page anglaise (par défaut) : un visiteur dont le téléphone est dans une autre langue disponible y est envoyé
  // (une seule fois, jamais les robots ; son choix manuel est retenu).
  if ($l === 'en') {
    $auto = "<script>(function(){try{if(localStorage.getItem('oroLangPick')||/bot|crawl|spider|slurp|lighthouse/i.test(navigator.userAgent))return;var L=" . json_encode(array_values(array_diff($order, ['en']))) . ",n=String((navigator.languages&&navigator.languages[0])||navigator.language||'').slice(0,2).toLowerCase();if(L.indexOf(n)>=0)location.replace('/decouvrir/'+n+'/'+location.search+location.hash);}catch(e){}})();</script>\n";
    $h = str_replace("  <meta charset=\"UTF-8\">\n", "  <meta charset=\"UTF-8\">\n  " . $auto, $h);
  }
  $dir = $root . '/decouvrir' . ($l === 'en' ? '' : '/' . $l);
  if (!is_dir($dir)) mkdir($dir, 0775, true);
  file_put_contents($dir . '/index.html', $h);
  // Phrases françaises restées (contrôle).
  $left = [];
  if ($l !== 'fr') foreach ($rows as $r) if (strpos($h, $r[0]) !== false && $r[0] !== $r[$k]) $left[] = mb_substr($r[0], 0, 40);
  echo str_pad($l, 3) . ' ' . str_pad((string) strlen($h), 7, ' ', STR_PAD_LEFT) . ' octets'
    . ($miss ? ' | absentes de la source : ' . count($miss) : '') . ($left ? ' | NON traduites : ' . implode(' / ', $left) : '') . "\n";
  $total++;
}
echo "$total pages.\n";
