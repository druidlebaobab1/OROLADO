<?php
// v2812 — skill3 games (owner request): three endless RUNNERS (with Hamster Run they form the first row of "You're in
// control") + Orbit Switch. MIXED MODE (casino_ext.php 'skill'): the multiplier grows ×e^(rate·s), the server draws the
// secret end at start (crash law: 94 % return whatever the player does); a mistake only loses earlier.
// rate 0.03 (lowest the engine allows): ×2 after 23 s, ×5 after 54 s, ×10 after 77 s of play. Client: js/games/skill3.js.
return [
  'highway'    => ['type' => 'skill', 'name' => 'Highway Rush', 'rate' => 0.03],
  'jungledash' => ['type' => 'skill', 'name' => 'Jungle Dash',  'rate' => 0.03],
  'metrodash'  => ['type' => 'skill', 'name' => 'Metro Dash',   'rate' => 0.03],
  'orbit'      => ['type' => 'skill', 'name' => 'Orbit Switch', 'rate' => 0.03],
];
