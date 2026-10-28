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
// hand tables: the losing line (weight null) is computed so that the return is just under 93.8 % (same rule as casa.php)
$cascFill = static function (string $name, array $rows): array {
  $w = 0.0; $ev = 0.0; $k = -1;
  foreach ($rows as $j => $r) { if ($r[1] === null) { $k = $j; continue; } $w += $r[1]; $ev += $r[0] * $r[1]; }
  $rows[$k][1] = (int) ceil($ev / 0.938 - $w);
  return ['type' => 'table', 'name' => $name, 'out' => $rows];
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
  /* ------------------------------------------------------------------ casd (round 8) : 6 machines à sous de plus — mêmes helpers (RTP 93.8 %) */
  // Gold Rush (5×3, 10 lines) — nugget, dynamite, pickaxe, wagon, A K Q; scatter = sheriff star
  'westgold' => $cascSlot('Gold Rush', 'L5', [[8, 40, 250], [5, 15, 80], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], [10, 50], 0.29),
  // Pirate Cove (243 ways) — skull, treasure chest, parrot, A K Q
  'piratecove' => $cascSlot('Pirate Cove', 'W5', [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 3, 12], [0.6, 2, 8], [0.4, 1.2, 5]], [], 0.32),
  // Lucky Clover (3×3, 5 lines) — pot of gold, clover, horseshoe, hat, coin, pint
  'shamrock' => $cascSlot('Clover Riches', 'R33', [50, 20, 10, 6, 3, 2], [], 0.23),
  // Candy Pop (5×4 pays anywhere: 6–7 / 8–9 / 10+ alike) — lollipop, jelly, donut, candy cane, gumdrop, star, heart
  'candypop' => $cascSlot('Candy Pop', 'A', [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 4, 12], [0.8, 2.5, 8], [0.5, 1.5, 5], [0.3, 1, 3]], [], 0.29),
  // Zeus Fury (5×3, 10 lines) — Zeus, lightning bolt, temple, laurel, A K Q; scatter = golden eagle
  'olympus' => $cascSlot('Zeus Fury', 'L5', [[10, 50, 300], [5, 20, 80], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], [12, 60], 0.28),
  // Vegas Nights (243 ways) — neon sign, cocktail, chips stack, A K Q
  'vegasneon' => $cascSlot('Vegas Nights', 'W5', [[6, 25, 120], [3, 10, 50], [2, 6, 25], [1.2, 4, 12], [0.8, 2, 8], [0.4, 1.2, 5]], [], 0.31),
  /* ------------------------------------------------------------------ case (round 9) : 6 machines à sous de plus */
  // Phoenix Rising (5×3, 10 lines) — phoenix, flame, golden egg, feather, A K Q; scatter = sun
  'phoenix' => $cascSlot('Phoenix Rising', 'L5', [[10, 50, 300], [5, 20, 80], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], [12, 60], 0.28),
  // Buffalo Gold (5×4 pays anywhere: 6–7 / 8–9 / 10+ alike) — buffalo, eagle, wolf, elk, A K Q
  'buffalo' => $cascSlot('Buffalo Gold', 'A', [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 4, 12], [0.8, 2.5, 8], [0.5, 1.5, 5], [0.3, 1, 3]], [], 0.29),
  // Joker's Wild (3×3, 5 lines) — joker, lucky 7, bell, cherry, coin, star
  'joker' => $cascSlot('Jokers Wild', 'R33', [50, 20, 10, 6, 3, 2], [], 0.23),
  // Book of Gold (5×3, 10 lines) — explorer, idol, scarab, ankh, A K Q; scatter = golden book
  'bookgold' => $cascSlot('Book of Gold', 'L5', [[8, 40, 250], [5, 15, 80], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], [10, 50], 0.29),
  // Lotus Zen (243 ways) — golden buddha, lotus, koi, A K Q
  'lotus' => $cascSlot('Lotus Zen', 'W5', [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 3, 12], [0.6, 2, 8], [0.4, 1.2, 5]], [], 0.32),
  // Inferno (5×3, 10 lines) — devil, flame, skull, pitchfork, A K Q; scatter = fireball
  'inferno' => $cascSlot('Inferno', 'L5', [[10, 50, 300], [5, 20, 80], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], [12, 60], 0.28),
  /* ------------------------------------------------------------------ lot 3 : 6 machines (casc1.js) */
  'aztecsun' => $cascSlot('Aztec Sun', 'L5', [[10, 50, 300], [5, 20, 80], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], [12, 60], 0.28),
  'dragongold' => $cascSlot('Golden Dragon', 'W5', [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 3, 12], [0.6, 2, 8], [0.4, 1.2, 5]], [], 0.32),
  'fruitburst' => $cascSlot('Fruit Burst', 'R33', [50, 20, 10, 6, 3, 2], [], 0.23),
  'horuseye' => $cascSlot('Eye of Pharaoh', 'L5', [[8, 40, 250], [5, 15, 80], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], [10, 50], 0.29),
  'cosmicgems' => $cascSlot('Cosmic Gems', 'A', [[6, 25, 120], [4, 12, 50], [2.5, 8, 25], [1.5, 5, 15], [1, 3, 10], [0.6, 2, 6], [0.4, 1.2, 4]], [], 0.28),
  'savanna' => $cascSlot('Wild Safari', 'A', [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 4, 12], [0.8, 2.5, 8], [0.5, 1.5, 5], [0.3, 1, 3]], [], 0.29),
  /* ------------------------------------------------------------------ lot 4 : 6 machines (casc1.js) */
  'valhalla' => $cascSlot('Valhalla Gold', 'L5', [[10, 50, 300], [5, 20, 80], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], [12, 60], 0.28),
  'tigergold' => $cascSlot('Tiger Fortune', 'W5', [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 3, 12], [0.6, 2, 8], [0.4, 1.2, 5]], [], 0.32),
  'honeypot' => $cascSlot('Honey Money', 'A', [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 4, 12], [0.8, 2.5, 8], [0.5, 1.5, 5], [0.3, 1, 3]], [], 0.29),
  'piggybank' => $cascSlot('Piggy Bank', 'R33', [50, 20, 10, 6, 3, 2], [], 0.23),
  'atlantis' => $cascSlot('Atlantis Deep', 'W5', [[6, 25, 120], [3, 10, 50], [2, 6, 25], [1.2, 4, 12], [0.8, 2, 8], [0.4, 1.2, 5]], [], 0.31),
  'wizard' => $cascSlot('Wizard Magic', 'L5', [[8, 40, 250], [5, 15, 80], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], [10, 50], 0.29),
  /* ------------------------------------------------------------------ lot 5 : 6 machines (casc1.js) */
  'royalcrown' => $cascSlot('Royal Crown', 'L5', [[8, 40, 250], [5, 15, 80], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], [10, 50], 0.29),
  'luckycat' => $cascSlot('Lucky Cat', 'W5', [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 3, 12], [0.6, 2, 8], [0.4, 1.2, 5]], [], 0.32),
  'wolfmoon' => $cascSlot('Wolf Moon', 'A', [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 4, 12], [0.8, 2.5, 8], [0.5, 1.5, 5], [0.3, 1, 3]], [], 0.29),
  'vampire' => $cascSlot('Vampire Night', 'L5', [[10, 50, 300], [5, 20, 80], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], [12, 60], 0.28),
  'peacock' => $cascSlot('Jade Peacock', 'W5', [[6, 25, 120], [3, 10, 50], [2, 6, 25], [1.2, 4, 12], [0.8, 2, 8], [0.4, 1.2, 5]], [], 0.31),
  'knight' => $cascSlot('Dragon Knight', 'R33', [50, 20, 10, 6, 3, 2], [], 0.23),
  /* ------------------------------------------------------------------ lot 6 : 6 machines (casc1.js) */
  'tikigods' => $cascSlot('Tiki Gods', 'L5', [[10, 50, 300], [5, 20, 80], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], [12, 60], 0.28),
  'icequeen' => $cascSlot('Frozen Queen', 'W5', [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 3, 12], [0.6, 2, 8], [0.4, 1.2, 5]], [], 0.32),
  'caishen' => $cascSlot('God of Wealth', 'L5', [[8, 40, 250], [5, 15, 80], [3, 10, 40], [2, 6, 20], [1, 4, 10], [0.6, 2, 6], [0.4, 1.5, 4]], [10, 50], 0.29),
  'luchador' => $cascSlot('Lucha Legends', 'A', [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 4, 12], [0.8, 2.5, 8], [0.5, 1.5, 5], [0.3, 1, 3]], [], 0.29),
  'fiesta' => $cascSlot('Fiesta Mariachi', 'R33', [50, 20, 10, 6, 3, 2], [], 0.23),
  'genie' => $cascSlot('Magic Genie', 'W5', [[5, 20, 100], [3, 10, 40], [2, 6, 20], [1.2, 3, 12], [0.6, 2, 8], [0.4, 1.2, 5]], [], 0.32),
  /* ------------------------------------------------------------------ 12 instant games (casc2.js · casc3.js) */
  // Potion Lab — two ingredients fall into the cauldron, the brew becomes: smoke (lose), red ×0.5, blue ×1.2, green ×2, purple ×5, rainbow ×20, golden elixir ×100
  'potion' => $cascFill('Potion Lab', [[0, null], [0.5, 2600], [1.2, 2000], [2, 900], [5, 280], [20, 50], [100, 4]]),
  // Bomb Squad — 5 wires on a confetti bomb, the one that stops the timer is wire 0…4 with chance 30 · 25 · 20 · 15 · 10 % → ×3.13 · ×3.76 · ×4.69 · ×6.26 · ×9.39
  'defuse' => ['type' => 'pick', 'name' => 'Bomb Squad', 'opts' => [0.3, 0.25, 0.2, 0.15, 0.1]],
  // Stone Skip — the stone bounces again with chance 3/5 each time: skips 0…9, then 10+ (exact /5^10):
  // 0–1 lose · 2 ×0.5 · 3 ×1 · 4 ×1.6 · 5 ×2.6 · 6 ×4 · 7 ×7 · 8 ×12 · 9 ×20 · 10+ ×50. RTP 93.88 %
  'stoneskip' => ['type' => 'table', 'name' => 'Stone Skip', 'out' => (static function () {
    $o = [];
    foreach ([0, 0, 0.5, 1, 1.6, 2.6, 4, 7, 12, 20] as $k => $m) $o[] = [$m, 2 * 3 ** $k * 5 ** (9 - $k)];
    $o[] = [50, 3 ** 10];
    return $o; })()],
  // Tarot — 3 cards from the 22 major arcana (exact /1 540), lucky cards = Sun, Moon, Star, World: 0 lose · 1 ×1.6 · 2 ×3.55 · 3 ×20. RTP 93.68 %
  'tarot' => ['type' => 'table', 'name' => 'Tarot', 'out' => [[0, 816], [1.6, 612], [3.55, 108], [20, 4]]],
  // Bottle Flip — falls flat (lose), rolls off the table (lose), upright ×0.6, upright after a double flip ×1.5, on its cap ×4, cap after a triple flip ×15, on top of the other bottle ×100
  'bottleflip' => $cascFill('Bottle Flip', [[0, null], [0, 1500], [0.6, 2500], [1.5, 1700], [4, 600], [15, 100], [100, 4]]),
  // Gem Fusion — 4 gems merge two by two; the final gem: dust (lose), amethyst ×0.5, sapphire ×1.2, emerald ×2.5, ruby ×6, diamond ×20, rainbow gem ×150
  'gemfusion' => $cascFill('Gem Fusion', [[0, null], [0.5, 2600], [1.2, 2000], [2.5, 900], [6, 280], [20, 50], [150, 3]]),
  // Cargo Drop — 3 landing pads (big 50 % · medium 30 % · small 20 %), the capsule lands on one → ×1.88 · ×3.13 · ×4.69
  'cargodrop' => ['type' => 'pick', 'name' => 'Cargo Drop', 'opts' => [0.5, 0.3, 0.2]],
  // Mahjong Draw — 3 tiles from 48 (bamboo 1–9 ×4, 3 dragons ×4), exact /17 296: nothing · pair ×2.7 · chow (run) ×10.4 · pung ×50 · dragon pung ×100. RTP 93.74 %
  'mahjong' => ['type' => 'table', 'name' => 'Mahjong Draw', 'out' => [[0, 13632], [2.7, 3168], [10.4, 448], [50, 36], [100, 12]]],
  // Robo Boxing — 3 rounds, each robot hits with power 1–10 (round won 45 % · even 10 % · lost 45 %), exact /10^6, line = rounds (won, lost, even):
  // 0-3-0 · 0-2-1 · 1-2-0 · 0-1-2 lose · 1-1-1 · 0-0-3 draw ×1 · 1-0-2 · 2-1-0 · 2-0-1 win ×1.72 · 3-0-0 KO ×2.4. RTP 93.91 %
  'robobox' => ['type' => 'table', 'name' => 'Robo Boxing', 'out' => [[0, 91125], [0, 60750], [0, 273375], [0, 13500], [1, 121500], [1, 1000], [1.72, 13500], [1.72, 273375], [1.72, 60750], [2.4, 91125]]],
  // Lantern Festival — 5 lanterns, each turns golden with chance 1/5 (exact /3 125): 0 lose · 1 ×0.4 · 2 ×1.6 · 3 ×5 · 4 ×20 · 5 ×200. RTP 93.95 %
  'lantern' => ['type' => 'table', 'name' => 'Lantern Festival', 'out' => [[0, 1024], [0.4, 1280], [1.6, 640], [5, 160], [20, 20], [200, 1]]],
  // Meteor Shower — 3 meteors, each burns up (12/20) or leaves a crystal: blue ×0.2 (5/20) · purple ×0.8 (2/20) · gold ×3.5 (1/20); win = total,
  // 3 gold = ×200. Line = the 3 meteors sorted (a ≤ b ≤ c), exact /8 000. RTP 93.87 %
  'meteor' => ['type' => 'table', 'name' => 'Meteor Shower', 'out' => (static function () {
    $w = [12, 5, 2, 1]; $v = [0, 0.2, 0.8, 3.5]; $o = [];
    for ($a = 0; $a < 4; $a++) for ($b = $a; $b < 4; $b++) for ($c = $b; $c < 4; $c++) {
      $perm = $a === $c ? 1 : ($a === $b || $b === $c ? 3 : 6);
      $o[] = [$a === 3 ? 200.0 : round($v[$a] + $v[$b] + $v[$c], 2), $perm * $w[$a] * $w[$b] * $w[$c]];
    }
    return $o; })()],
  // Curling — the stone stops: past the house (lose), hits the guard (lose), 12-foot ring ×0.5, 8-foot ×1.2, 4-foot ×2.5, button ×6, button + rival stone out ×25, dead centre ×100
  'curling' => $cascFill('Curling', [[0, null], [0, 800], [0.5, 2600], [1.2, 2000], [2.5, 900], [6, 280], [25, 40], [100, 3]]),
];
