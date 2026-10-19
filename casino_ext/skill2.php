<?php
// v2805 — skill2 games (owner request): six "You're in control" games in MIXED MODE (casino_ext.php 'skill').
// The secret end follows the crash law (94 % return); 'rate' only sets how fast the multiplier grows (×2 after ln2/rate s).
// v2812 (owner: the multiplier grew too fast) → 0.03 everywhere: ×2 after 23 s, ×5 after 54 s, ×10 after 77 s.
return [
  'archer'   => ['type' => 'skill', 'name' => 'Star Archer',    'rate' => 0.03],
  'slicer'   => ['type' => 'skill', 'name' => 'Fruit Slicer',   'rate' => 0.03],
  'chicken'  => ['type' => 'skill', 'name' => 'Chicken Road',   'rate' => 0.03],
  'hamster'  => ['type' => 'skill', 'name' => 'Hamster Run',    'rate' => 0.03],
  'dodge'    => ['type' => 'skill', 'name' => 'Asteroid Dodge', 'rate' => 0.03],
  'dartspro' => ['type' => 'skill', 'name' => 'Darts Pro',      'rate' => 0.03],
];
