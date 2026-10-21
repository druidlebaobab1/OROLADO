<?php
// v2900 — skill9 games (owner request, round 5 games): 12 more « You're in control » games, theme RACING & REFLEXES, one
// gesture each: Moto Wheelie, Drift King, Horse Jumper, Skate Tricks (js/games/skill9.js), Penguin Slide, Snowboard Jump,
// Surf Rider, Jet Ski Race (skill9b.js), Kart Dash, Desert Rally, Rooftop Ninja, Lava Escape (skill9c.js). Original names and drawings.
// MIXED MODE like every other « You're in control » game (casino_ext.php 'skill'): the multiplier grows ×e^(rate·s) on the
// SERVER clock, the server draws the secret end at start (crash law: 94 % return whatever the player or a robot does); a
// mistake only loses earlier, a cash-out is paid only if it arrives before the secret end, at the server's multiplier.
// rate 0.03 (like round 6): ×2 after 23 s. Catalogue: js/games/cat-skill9.js.
return [
  'motowheelie'  => ['type' => 'skill', 'name' => 'Moto Wheelie',   'rate' => 0.03],
  'driftking'    => ['type' => 'skill', 'name' => 'Drift King',     'rate' => 0.03],
  'horsejump'    => ['type' => 'skill', 'name' => 'Horse Jumper',   'rate' => 0.03],
  'skatetricks'  => ['type' => 'skill', 'name' => 'Skate Tricks',   'rate' => 0.03],
  // js/games/skill9b.js
  'penguinslide' => ['type' => 'skill', 'name' => 'Penguin Slide',  'rate' => 0.03],
  'snowjump'     => ['type' => 'skill', 'name' => 'Snowboard Jump', 'rate' => 0.03],
  'surfrider'    => ['type' => 'skill', 'name' => 'Surf Rider',     'rate' => 0.03],
  'jetskirace'   => ['type' => 'skill', 'name' => 'Jet Ski Race',   'rate' => 0.03],
  // js/games/skill9c.js
  'kartdash'     => ['type' => 'skill', 'name' => 'Kart Dash',      'rate' => 0.03],
  'desertrally'  => ['type' => 'skill', 'name' => 'Desert Rally',   'rate' => 0.03],
  'rooftopninja' => ['type' => 'skill', 'name' => 'Rooftop Ninja',  'rate' => 0.03],
  'lavaescape'   => ['type' => 'skill', 'name' => 'Lava Escape',    'rate' => 0.03],
];
