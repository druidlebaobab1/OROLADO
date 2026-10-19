<?php
// casa (owner request, round 6) — 24 new Casino games: 12 video slots + 12 instant-win games (js/games/casa1.js · casa2.js · casa3.js).
// Everything is drawn on the server (casino_ext.php: random_int over the weights below); the browser only paints the drawn line
// (view.i) or the winning option (view.w). Each fiche is checked at load (RTP ≤ 94.5 % or ignored); every one here returns
// 93.5–94 % (exact sums + simulation: scripts/test-cg-casa.php).
//
// SLOTS — the line list is built from the pay table by the same rule as js/games/casa1.js (ROWS): line 0 = no win, then
//   L5 (5×3, 10 lines) : symbol s (best first) × 3 / 4 / 5 from the left, then scatters 3 / 4 anywhere ;
//   W5 (5×3, 243 ways) : symbol s × 3 / 4 / 5 reels × ways 1 / 2 / 4 (pay × ways) ;
//   A  (pays anywhere) : symbol s × count band 1 / 2 / 3 ;
//   R33 (3×3, 5 lines) : symbol s × 3 in a line ;
//   R3 (3 reels, 1 line): symbol s × 3, then 2 cherries, then 1 cherry.
// Weights: chance ∝ pay^-a, a chosen so that the hit rate is the slot's target and the return is 93.8 % (rounded down).
$casaSlot = static function (string $name, string $kind, array $pays, array $scat, float $hit): array {
  $m = [];
  if ($kind === 'L5') { foreach ($pays as $p) foreach ($p as $v) $m[] = (float) $v; foreach ($scat as $v) $m[] = (float) $v; }
  elseif ($kind === 'W5') { foreach ($pays as $p) foreach ($p as $v) foreach ([1, 2, 4] as $w) $m[] = round($v * $w, 2); }
  elseif ($kind === 'A') { foreach ($pays as $p) foreach ($p as $v) $m[] = (float) $v; }
  elseif ($kind === 'R33') { foreach ($pays as $v) $m[] = (float) $v; }
  else { foreach ($pays as $v) $m[] = (float) $v; foreach ($scat as $v) $m[] = (float) $v; } // R3 : 3 alike, then cherries
  $rtp = 0.938;
  $H = static function (float $a) use ($m, $rtp) { $s0 = 0.0; $s1 = 0.0; foreach ($m as $v) { $s0 += $v ** -$a; $s1 += $v ** (1 - $a); } return $rtp * $s0 / $s1; };
  $lo = 0.0; $hi = 4.0;
  for ($i = 0; $i < 60; $i++) { $mid = ($lo + $hi) / 2; if ($H($mid) < $hit) $lo = $mid; else $hi = $mid; }
  $a = ($lo + $hi) / 2; $s1 = 0.0; foreach ($m as $v) $s1 += $v ** (1 - $a);
  $c = $rtp / $s1; $T = 10000000; $out = []; $sum = 0;
  foreach ($m as $v) { $w = max(1, (int) floor($c * $v ** -$a * $T)); $out[] = [$v, $w]; $sum += $w; }
  array_unshift($out, [0, $T - $sum]);
  return ['type' => 'table', 'name' => $name, 'out' => $out];
};
// hand tables: the losing line (weight null) is computed so that the return is just under 93.8 %
$casaFill = static function (string $name, array $rows): array {
  $w = 0.0; $ev = 0.0; $k = -1;
  foreach ($rows as $j => $r) { if ($r[1] === null) { $k = $j; continue; } $w += $r[1]; $ev += $r[0] * $r[1]; }
  $rows[$k][1] = (int) ceil($ev / 0.938 - $w);
  return ['type' => 'table', 'name' => $name, 'out' => $rows];
};
return [
  /* ------------------------------------------------------------------ 12 slots */
  // Scarab Sun (Egypt, 5×3 10 lines) — sun disc, Anubis, cat, eye, lotus, ankh, papyrus; scatter = golden scarab
  'scarab' => $casaSlot('Scarab Sun', 'L5', [[6, 30, 200], [4, 15, 80], [3, 10, 40], [2, 6, 20], [1.2, 4, 12], [0.6, 2, 8], [0.4, 1.5, 5]], [10, 50], 0.30),
  // Kraken Deep (ocean, 243 ways) — kraken, anchor, octopus, jellyfish, shell, starfish
  'kraken' => $casaSlot('Kraken Deep', 'W5', [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 3, 12], [0.6, 2, 8], [0.4, 1.2, 5]], [], 0.33),
  // Donut Shop (candy, 3×3 5 lines) — golden donut, cupcake, ice cream, macaron, lollipop, candy
  'donut' => $casaSlot('Donut Shop', 'R33', [50, 20, 10, 6, 4, 2], [], 0.22),
  // Cherry Bar (classic 3 reels, 1 line) — 777, triple BAR, BAR, bell, plum, cherry ; then 2 cherries, 1 cherry
  'cherrybar' => $casaSlot('Cherry Bar', 'R3', [100, 40, 20, 10, 6, 4], [2, 0.5], 0.30),
  // UFO Invasion (space, 5×4 pays anywhere: 6–7 / 8–9 / 10+ alike)
  'ufo' => $casaSlot('UFO Invasion', 'A', [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 4, 12], [0.8, 2.5, 8], [0.5, 1.5, 5], [0.3, 1, 3]], [], 0.28),
  // Koi Fortune (Asia, 3×3 5 lines) — golden koi, lantern, lucky cat, fan, coin, bamboo
  'koi' => $casaSlot('Koi Fortune', 'R33', [60, 25, 12, 6, 3, 1.5], [], 0.25),
  // Gold Train (wild west, 5×3 10 lines) — locomotive, sheriff star, gold bag, revolver, boot, horseshoe, cactus; scatter = dynamite
  'goldtrain' => $casaSlot('Gold Train', 'L5', [[8, 40, 250], [5, 15, 75], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], [8, 40], 0.29),
  // Viking Raid (243 ways) — longship, helmet, axe, shield, horn, rune
  'viking' => $casaSlot('Viking Raid', 'W5', [[6, 25, 120], [3, 10, 50], [2, 6, 25], [1.2, 4, 12], [0.8, 2, 8], [0.4, 1.2, 5]], [], 0.30),
  // Safari King (jungle, 5×3 10 lines) — lion, elephant, giraffe, zebra, parrot, banana, leaf; scatter = sunset
  'safari' => $casaSlot('Safari King', 'L5', [[6, 30, 150], [4, 15, 60], [3, 10, 40], [2, 6, 20], [1, 4, 12], [0.6, 2, 6], [0.4, 1.5, 5]], [10, 40], 0.31),
  // Ruby Mine (gems, 6×5 pays anywhere: 8–9 / 10–11 / 12+ alike)
  'rubymine' => $casaSlot('Ruby Mine', 'A', [[6, 25, 120], [4, 12, 50], [2.5, 8, 25], [1.5, 5, 15], [1, 3, 10], [0.6, 2, 6], [0.4, 1.2, 4]], [], 0.27),
  // Pumpkin Night (Halloween, 243 ways) — jack-o'-lantern, witch hat, ghost, bat, potion, candy corn
  'pumpkin' => $casaSlot('Pumpkin Night', 'W5', [[5, 20, 100], [3, 12, 40], [2, 6, 20], [1, 3, 10], [0.6, 2, 8], [0.4, 1.2, 4]], [], 0.32),
  // Medusa (Greek gods, 5×3 10 lines) — Medusa, Pegasus, helmet, harp, amphora, laurel, olive; scatter = golden temple
  'medusa' => $casaSlot('Medusa', 'L5', [[10, 50, 300], [5, 20, 80], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], [12, 60], 0.28),

  /* ------------------------------------------------------------------ 12 instant-win games */
  // Win Numbers (scratch card) — prize found under the scratched numbers: none, ×0.5 … ×200
  'scratchwin' => $casaFill('Win Numbers', [[0, null], [0.5, 2500], [1, 1500], [2, 900], [5, 300], [10, 100], [50, 12], [200, 2]]),
  // Mystery Boxes — the chosen gift box holds: empty, ×0.5, ×1.2, ×2, ×5, ×15, ×100
  'pickbox' => $casaFill('Mystery Boxes', [[0, null], [0.5, 2600], [1.2, 2000], [2, 900], [5, 280], [15, 60], [100, 4]]),
  // Lucky Ladder — the climber stops on rung 1…10 (line i = rung i+1): 1–2 lose, 3 ×0.5 … 10 ×100
  'ladder' => $casaFill('Lucky Ladder', [[0, null], [0, 1800], [0.5, 1600], [1, 1300], [1.5, 1000], [2.5, 600], [4, 300], [8, 120], [20, 30], [100, 4]]),
  // Hi-Lo Run — 6 cards (13 ranks, any suit): rises in a row from the first card 0…5 — exact counts out of 13^6. RTP 93.68 %
  'hilorun' => ['type' => 'table', 'name' => 'Hi-Lo Run', 'out' => [[0, 2599051], [0.6, 1599416], [2.3, 507507], [9.2, 104104], [50, 15015], [400, 1716]]],
  // Red Envelopes — 3 envelopes, the prize is their total; each line = one fixed trio (js/games/casa2.js ENV)
  'envelope' => $casaFill('Red Envelopes', [[0, null], [0.4, 2200], [0.7, 1800], [1.2, 1300], [1.5, 900], [2.5, 500], [5, 200], [12, 60], [24, 15], [104, 2]]),
  // Treasure Map — 4 islands, the treasure is on island 0 / 1 / 2 / 3 with chance 40 · 30 · 20 · 10 % → ×2.35 · ×3.13 · ×4.7 · ×9.4
  'treasure' => ['type' => 'pick', 'name' => 'Treasure Map', 'opts' => [0.4, 0.3, 0.2, 0.1]],
  // Lucky 21 — 3 cards (13 ranks, A = 11 or 1, faces 10), exact counts out of 2 197: 7-7-7 ×100, 21 ×5.4, 20 ×3, 19 ×2, 18 ×0.6. RTP 93.61 %
  'flip21' => ['type' => 'table', 'name' => 'Lucky 21', 'out' => [[0, 1526], [0.6, 151], [2, 159], [3, 165], [5.4, 195], [100, 1]]],
  // Balloon Darts — 3 darts: balloons popped 0 / 1 / 2 / 3, then 3 with the golden balloon
  'popdarts' => $casaFill('Balloon Darts', [[0, null], [0.4, 3000], [1.5, 2400], [4, 900], [25, 40]]),
  // Egg Hunt — 3 bushes searched: eggs found (silver / gold): 1s, 2s, 3s, 1g, 1g1s, 1g2s, 2g, 2g1s, 3g
  'egghunt' => $casaFill('Egg Hunt', [[0, null], [0.5, 2600], [1.5, 1300], [5, 300], [2, 900], [3, 500], [6, 150], [12, 50], [20, 20], [100, 3]]),
  // Crab Shells — 4 shells, the pearl is under one ×3.76
  'shells' => ['type' => 'pick', 'name' => 'Crab Shells', 'opts' => [0.25, 0.25, 0.25, 0.25]],
  // Color Wheel — 20 segments: red 9 · blue 6 · green 4 · gold 1 → ×2.08 · ×3.13 · ×4.7 · ×18.8
  'colorwheel' => ['type' => 'pick', 'name' => 'Color Wheel', 'opts' => [0.45, 0.3, 0.2, 0.05]],
  // Lucky Numbers — ball machine, numbers 1–10, the chosen number ×9.4
  'luckyten' => ['type' => 'pick', 'name' => 'Lucky Numbers', 'opts' => array_fill(0, 10, 0.1)],
];
