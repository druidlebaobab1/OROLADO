<?php
// v2805 — skill1 games (owner request): 6 « You're in control » games in MIXED MODE (like Aviator, but the player plays).
// The multiplier grows ×e^(rate·s); the server draws the secret end at start (same law as the plane: 94 % return).
// A player's mistake (obstacle, missed block, saved shot…) only loses earlier — it can never pay more.
// Rates: ×2 arrives after ln2/rate seconds (0.11 → 6.3 s, 0.10 → 6.9 s, 0.09 → 7.7 s). Client: js/games/skill1.js.
return [
  'spacerun'   => ['type' => 'skill', 'name' => 'Space Runner',  'rate' => 0.11],
  'flappyrock' => ['type' => 'skill', 'name' => 'Flappy Rocket', 'rate' => 0.11],
  'stack'      => ['type' => 'skill', 'name' => 'Tower Stack',   'rate' => 0.10],
  'knifehit'   => ['type' => 'skill', 'name' => 'Star Blades',   'rate' => 0.10],
  'basket'     => ['type' => 'skill', 'name' => 'Basket Shot',   'rate' => 0.09],
  'kicker'     => ['type' => 'skill', 'name' => 'Penalty Kicker', 'rate' => 0.09],
];
