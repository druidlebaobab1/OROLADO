<?php
// v2819 — skill4 games (owner request, round 5): 8 new « You're in control » games in MIXED MODE (like Aviator, but the
// player plays), inspired by the most played simple mobile games: a war shooter, a zombie defence, brick breaker, snake,
// helix tower, color jump, and two games for girls (cupcake decorating, a princess walking through the dress-colour gates).
// The multiplier grows ×e^(rate·s); the server draws the secret end at start (crash law: 94 % return whatever the player
// does); a mistake only loses earlier. rate 0.03 (lowest the engine allows): ×2 after 23 s, ×5 after 54 s, ×10 after 77 s.
// Clients: js/games/skill4.js (airstrike, zombiesiege, brickbreak, neonsnake) and js/games/skill5.js (the 4 others).
return [
  'airstrike'   => ['type' => 'skill', 'name' => 'Air Strike',     'rate' => 0.03],
  'zombiesiege' => ['type' => 'skill', 'name' => 'Zombie Siege',   'rate' => 0.03],
  'brickbreak'  => ['type' => 'skill', 'name' => 'Brick Breaker',  'rate' => 0.03],
  'neonsnake'   => ['type' => 'skill', 'name' => 'Neon Snake',     'rate' => 0.03],
  'helixdrop'   => ['type' => 'skill', 'name' => 'Helix Drop',     'rate' => 0.03],
  'colorjump'   => ['type' => 'skill', 'name' => 'Color Jump',     'rate' => 0.03],
  'cupcake'     => ['type' => 'skill', 'name' => 'Cupcake Party',  'rate' => 0.03],
  'princess'    => ['type' => 'skill', 'name' => 'Princess Rush',  'rate' => 0.03],
];
