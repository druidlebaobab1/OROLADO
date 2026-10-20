<?php
// casc (owner request, round 7) — 24 more Casino games: 12 video slots (js/games/casc1.js) + 12 instant games (js/games/casc2.js, casc3.js).
// Same engine and same rules as casino_ext/casa.php: the server draws (casino_ext.php, random_int over the weights below), the
// browser paints exactly the drawn line (view.i) or the winning option (view.w). Each fiche is checked at load (RTP ≤ 94.5 % or
// ignored); every one here returns 93.5–94 % (exact sums + simulation: scripts/test-cg-casc.php).
// SLOTS: the line list is built from the pay table by the same rule as js/games/casc1.js (ROWS) — see casino_ext/casa.php.
$cascSlot = static function (string $name, string $kind, array $pays, array $scat, float $hit): array {
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
return [
  /* ------------------------------------------------------------------ 12 slots */
  // Samurai (5×3, 10 lines) — kabuto, katanas, sakura, torii, A K Q; scatter = rising sun
  'samurai' => $cascSlot('Samurai', 'L5', [[8, 40, 250], [5, 15, 80], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], [10, 50], 0.29),
  // Mermaid Lagoon (243 ways) — mermaid tail, pearl shell, seahorse, A K Q
  'mermaid' => $cascSlot('Mermaid Lagoon', 'W5', [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 3, 12], [0.6, 2, 8], [0.4, 1.2, 5]], [], 0.32),
  // Carnival (5×3, 10 lines) — Venetian mask, jester hat, feather, drum, A K Q; scatter = big top
  'carnival' => $cascSlot('Carnival', 'L5', [[6, 30, 200], [4, 15, 75], [3, 10, 40], [2, 6, 20], [1.2, 4, 12], [0.6, 2, 6], [0.4, 1.5, 5]], [10, 40], 0.30),
  // Jazz Club (243 ways) — saxophone, microphone, vinyl, A K Q
  'jazzclub' => $cascSlot('Jazz Club', 'W5', [[6, 25, 120], [3, 10, 50], [2, 6, 25], [1.2, 4, 12], [0.8, 2, 8], [0.4, 1.2, 5]], [], 0.31),
  // Desert Oasis (3×3, 5 lines) — golden camel, palm, genie lamp, dates, jar, sun
  'oasis' => $cascSlot('Desert Oasis', 'R33', [50, 20, 10, 6, 3, 2], [], 0.23),
  // Arctic (243 ways) — polar bear, penguin, igloo, A K Q
  'arctic' => $cascSlot('Arctic', 'W5', [[5, 20, 100], [3, 12, 40], [2, 6, 20], [1, 3, 10], [0.6, 2, 8], [0.4, 1.2, 4]], [], 0.33),
  // Steampunk (5×3, 10 lines) — airship, top hat, gears, pocket watch, A K Q; scatter = golden key
  'steampunk' => $cascSlot('Steampunk', 'L5', [[10, 50, 300], [5, 20, 80], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], [12, 60], 0.28),
  // Cyber City (6×5 pays anywhere: 8–9 / 10–11 / 12+ alike) — robot, chip, neon heart, bolt, drone, prism, coin
  'cybercity' => $cascSlot('Cyber City', 'A', [[6, 25, 120], [4, 12, 50], [2.5, 8, 25], [1.5, 5, 15], [1, 3, 10], [0.6, 2, 6], [0.4, 1.2, 4]], [], 0.28),
  // Fairy Forest (5×4 pays anywhere: 6–7 / 8–9 / 10+ alike) — wand, mushroom house, butterfly, flower, ladybug, acorn, leaf
  'fairy' => $cascSlot('Fairy Forest', 'A', [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 4, 12], [0.8, 2.5, 8], [0.5, 1.5, 5], [0.3, 1, 3]], [], 0.29),
  // Dino Park (5×3, 10 lines) — T-rex, volcano, dino egg, bone, A K Q; scatter = amber
  'dinopark' => $cascSlot('Dino Park', 'L5', [[6, 30, 200], [4, 15, 80], [3, 10, 40], [2, 6, 20], [1.2, 4, 12], [0.6, 2, 8], [0.4, 1.5, 5]], [10, 50], 0.31),
  // Sushi Bar (3×3, 5 lines) — golden nigiri, maki, onigiri, dumpling, tea, chopsticks
  'sushibar' => $cascSlot('Sushi Bar', 'R33', [60, 25, 12, 6, 3, 1.5], [], 0.25),
  // Disco Night (3×3, 5 lines) — disco ball, roller skate, cassette, star glasses, lips, bolt
  'disco' => $cascSlot('Disco Night', 'R33', [50, 20, 10, 6, 4, 2], [], 0.22),
];
