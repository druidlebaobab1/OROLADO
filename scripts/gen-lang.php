<?php
declare(strict_types=1);
// Script : uniquement en ligne de commande.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
/**
 * v2962 (propriétaire) — PAGES PAR LANGUE pour Google : orolado.com/en/, /es/, /pt/… (même site, même domaine).
 * Chaque page est une copie de index.html avec le titre et la description traduits, sa propre adresse (canonical)
 * et les liens « hreflang » vers toutes les autres langues : Google montre à chacun la version de sa langue.
 * Le visiteur arrive ensuite sur le site normal, déjà dans sa langue (l'adresse redevient orolado.com/).
 *
 * À LANCER APRÈS CHAQUE MODIFICATION DE index.html :   php scripts/gen-lang.php
 * Vérifier sans rien écrire :                           php scripts/gen-lang.php --check   (code 1 = pages à refaire)
 */
$root = dirname(__DIR__);
$site = 'https://www.orolado.com/';
// La racine (orolado.com/) reste en français (choix du propriétaire) et sert aussi de version par défaut.
$L = [
  'en' => ['OROLADO – Synthetic Indices Trading, Live Casino & Sports Betting', 'Trade synthetic indices 24/7, play 200+ live casino games and bet on sports. Chat with your friends. Free demo account.', 'en_US'],
  'es' => ['OROLADO – Trading de índices sintéticos, Casino en vivo y Apuestas deportivas', 'Opera índices sintéticos 24/7, juega a más de 200 juegos de casino en vivo y apuesta en deportes. Chatea con tus amigos. Cuenta demo gratis.', 'es_ES'],
  'pt' => ['OROLADO – Trading de índices sintéticos, Cassino ao vivo e Apostas esportivas', 'Negocie índices sintéticos 24h por dia, jogue mais de 200 jogos de cassino ao vivo e aposte em esportes. Converse com seus amigos. Conta demo grátis.', 'pt_BR'],
  'ar' => ['OROLADO – تداول المؤشرات الاصطناعية، كازينو مباشر ومراهنات رياضية', 'تداول المؤشرات الاصطناعية على مدار الساعة، والعب أكثر من 200 لعبة كازينو مباشر وراهن على الرياضة. تحدّث مع أصدقائك. حساب تجريبي مجاني.', 'ar_AR'],
  'tr' => ['OROLADO – Sentetik Endeks Ticareti, Canlı Casino ve Spor Bahisleri', 'Sentetik endekslerde 7/24 işlem yapın, 200’den fazla canlı casino oyunu oynayın ve spora bahis yapın. Arkadaşlarınızla sohbet edin. Ücretsiz demo hesap.', 'tr_TR'],
  'vi' => ['OROLADO – Giao dịch chỉ số tổng hợp, Casino trực tiếp & Cá cược thể thao', 'Giao dịch chỉ số tổng hợp 24/7, chơi hơn 200 trò casino trực tiếp và cá cược thể thao. Trò chuyện với bạn bè. Tài khoản demo miễn phí.', 'vi_VN'],
  'id' => ['OROLADO – Trading Indeks Sintetis, Kasino Live & Taruhan Olahraga', 'Trading indeks sintetis 24/7, mainkan lebih dari 200 game kasino live dan pasang taruhan olahraga. Ngobrol dengan teman. Akun demo gratis.', 'id_ID'],
  'ru' => ['OROLADO – Торговля синтетическими индексами, живое казино и ставки на спорт', 'Торгуйте синтетическими индексами 24/7, играйте в более чем 200 игр живого казино и делайте ставки на спорт. Общайтесь с друзьями. Бесплатный демо-счёт.', 'ru_RU'],
  'de' => ['OROLADO – Handel mit synthetischen Indizes, Live-Casino & Sportwetten', 'Handeln Sie synthetische Indizes rund um die Uhr, spielen Sie über 200 Live-Casino-Spiele und wetten Sie auf Sport. Chatten Sie mit Freunden. Kostenloses Demokonto.', 'de_DE'],
  'hi' => ['OROLADO – सिंथेटिक इंडेक्स ट्रेडिंग, लाइव कैसीनो और स्पोर्ट्स बेटिंग', 'सिंथेटिक इंडेक्स में 24/7 ट्रेड करें, 200 से ज़्यादा लाइव कैसीनो गेम खेलें और खेलों पर दांव लगाएँ। दोस्तों से चैट करें। मुफ़्त डेमो खाता।', 'hi_IN'],
  'zh' => ['OROLADO – 合成指数交易、真人娱乐场与体育投注', '全天候交易合成指数，畅玩 200 多款真人娱乐场游戏，投注体育赛事。与好友聊天。免费模拟账户。', 'zh_CN'],
];
$check = in_array('--check', $argv, true);
$h = static fn(string $s): string => htmlspecialchars($s, ENT_QUOTES | ENT_HTML5, 'UTF-8');

$src = (string) file_get_contents($root . '/index.html');
// 1) liens hreflang (racine = français + version par défaut), posés aussi sur la racine
$alt = "<!-- hreflang:start -->\n" .
  '  <link rel="alternate" hreflang="fr" href="' . $site . "\">\n" .
  implode('', array_map(static fn($l) => '  <link rel="alternate" hreflang="' . $l . '" href="' . $site . $l . "/\">\n", array_keys($L))) .
  '  <link rel="alternate" hreflang="x-default" href="' . $site . "\">\n  <!-- hreflang:end -->";
$base = preg_replace('#\s*<!-- hreflang:start -->.*?<!-- hreflang:end -->#s', '', $src);
$rootHtml = preg_replace('#(<link rel="canonical" href="[^"]*">)#', "$1\n  " . $alt, $base, 1);

$out = [$root . '/index.html' => $rootHtml];
// textes de la racine (à remplacer dans chaque copie)
preg_match('#<title>(.*?)</title>#s', $base, $mt);
preg_match('#<meta name="description" content="([^"]*)">#', $base, $md);
$rootT = $mt[1] ?? ''; $rootD = $md[1] ?? '';
foreach ($L as $code => [$title, $desc, $loc]) {
  $p = $rootHtml;
  $p = str_replace($rootT, $h($title), $p);
  $p = str_replace('content="' . $rootD . '"', 'content="' . $h($desc) . '"', $p);
  $p = preg_replace('#<html lang="[^"]*" dir="[^"]*"#', '<html lang="' . $code . '" dir="' . ($code === 'ar' ? 'rtl' : 'ltr') . '"', $p, 1);
  $p = str_replace('<meta property="og:locale" content="fr_FR">', '<meta property="og:locale" content="' . $loc . '">', $p);
  $p = preg_replace('#<link rel="canonical" href="[^"]*">#', '<link rel="canonical" href="' . $site . $code . '/">', $p, 1);
  $p = str_replace('<meta property="og:url" content="' . $site . '">', '<meta property="og:url" content="' . $site . $code . '/">', $p);
  // adresses relatives (css/, js/, icons/…) → depuis la racine du site
  $p = preg_replace('#\b(src|href)="(?!https?:|//|/|\#|data:|mailto:|tel:|javascript:)#', '$1="/', $p);
  // tout premier dans <head> : la langue est choisie, puis l'adresse redevient orolado.com/ (le site marche comme d'habitude).
  // Robots (Google…) : l'adresse reste /xx/ (un rechargement les ramène sur cette page traduite) ; <base> sert les fichiers depuis la racine.
  $boot = '<script>try{sessionStorage.setItem("orolado_lang_session","' . $code . '")}catch(e){}try{if(!/bot|crawl|spider|slurp|lighthouse/i.test(navigator.userAgent))history.replaceState(null,"","/"+location.search+location.hash)}catch(e){}</script>';
  $p = preg_replace('#<head>#', "<head>\n  " . $boot . "\n  <base href=\"/\">", $p, 1);
  $p = str_replace('<!DOCTYPE html>', "<!DOCTYPE html>\n<!-- Fichier généré par scripts/gen-lang.php depuis index.html : ne pas modifier à la main. -->", $p);
  $out[$root . '/' . $code . '/index.html'] = $p;
}
// sitemap : une adresse par langue, avec ses équivalents
$sm = (string) file_get_contents($root . '/sitemap.xml');
$sm = preg_replace('#\s*<!-- lang:start -->.*?<!-- lang:end -->#s', '', $sm);
$links = '';
foreach (array_merge([''], array_keys($L)) as $c) {
  $links .= '<xhtml:link rel="alternate" hreflang="' . ($c === '' ? 'fr' : $c) . '" href="' . $site . ($c === '' ? '' : $c . '/') . '"/>';
}
$links .= '<xhtml:link rel="alternate" hreflang="x-default" href="' . $site . '"/>';
$items = '';
foreach (array_keys($L) as $c) $items .= "\n  <url><loc>" . $site . $c . '/</loc><changefreq>daily</changefreq><priority>0.9</priority>' . $links . '</url>';
$sm = str_replace('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">', $sm);
$sm = preg_replace('#(<url><loc>' . preg_quote($site, '#') . '</loc>.*?)(</url>)#', '$1' . $links . '$2', preg_replace('#<xhtml:link[^>]*/>#', '', $sm), 1);
$sm = str_replace('</urlset>', '  <!-- lang:start -->' . $items . "\n  <!-- lang:end -->\n</urlset>", $sm);
$out[$root . '/sitemap.xml'] = $sm;

$stale = 0;
foreach ($out as $f => $c) {
  if ((is_file($f) ? file_get_contents($f) : null) === $c) continue;
  $stale++;
  if ($check) { echo "À refaire : " . substr($f, strlen($root) + 1) . "\n"; continue; }
  if (!is_dir(dirname($f))) mkdir(dirname($f), 0755, true);
  file_put_contents($f, $c);
  echo "Écrit : " . substr($f, strlen($root) + 1) . "\n";
}
if ($check) { echo $stale ? "PAS À JOUR : lancez php scripts/gen-lang.php\n" : "OK : pages par langue à jour\n"; exit($stale ? 1 : 0); }
echo $stale ? "Terminé ($stale fichier(s)).\n" : "Rien à changer.\n";
