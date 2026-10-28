<?php
// v2850 — skill6 games (owner request, round 6): 24 more « You're in control » games — the classics everybody already
// knows and feels confident at (falling blocks, 2048 merge, maze muncher, bubble shooter, match-3, memory, colour echo,
// piano keys, pong, meteors, sky hopper, fruit catcher, rhythm, rope swing, mini golf, ski slalom) and WAR games (tank
// battle, sniper, gunship, dogfight, trench defense, commando run, alien wave, city shield). Original names and drawings.
// MIXED MODE like every other « You're in control » game (casino_ext.php 'skill'): the multiplier grows ×e^(rate·s) on the
// SERVER clock, the server draws the secret end at start (crash law: 94 % return whatever the player or a robot does); a
// mistake only loses earlier, a cash-out is paid only if it arrives before the secret end, at the server's multiplier.
// A bot cannot farm these games: perfect play never beats 94 %. rate 0.03 (lowest the engine allows): ×2 after 23 s.
// Clients: js/games/skill6.js, skill7.js, skill8.js (8 games each). Catalogue: js/games/cat-skill6.js.
return [
  'blockfall'   => ['type' => 'skill', 'name' => 'Block Fall',     'rate' => 0.03],
  'merge2048'   => ['type' => 'skill', 'name' => 'Merge 2048',     'rate' => 0.03],
  'mazechomp'   => ['type' => 'skill', 'name' => 'Maze Muncher',   'rate' => 0.03],
  'bubblepop'   => ['type' => 'skill', 'name' => 'Bubble Pop',     'rate' => 0.03],
  'gemswap'     => ['type' => 'skill', 'name' => 'Gem Swap',       'rate' => 0.03],
  'memoflip'    => ['type' => 'skill', 'name' => 'Memory Flip',    'rate' => 0.03],
  'echopads'    => ['type' => 'skill', 'name' => 'Echo Pads',      'rate' => 0.03],
  'pianokeys'   => ['type' => 'skill', 'name' => 'Piano Keys',     'rate' => 0.03],
  // war games (owner: "I love war games") — js/games/skill7.js
  'tankbattle'  => ['type' => 'skill', 'name' => 'Tank Battle',    'rate' => 0.03],
  'sniper'      => ['type' => 'skill', 'name' => 'Sniper',         'rate' => 0.03],
  'gunship'     => ['type' => 'skill', 'name' => 'Gunship',        'rate' => 0.03],
  'dogfight'    => ['type' => 'skill', 'name' => 'Dogfight',       'rate' => 0.03],
  'trenchdef'   => ['type' => 'skill', 'name' => 'Trench Defense', 'rate' => 0.03],
  'neonpong'    => ['type' => 'skill', 'name' => 'Neon Pong',      'rate' => 0.03],
  'commando'    => ['type' => 'skill', 'name' => 'Commando Run',   'rate' => 0.03],
  'fruitcatch'  => ['type' => 'skill', 'name' => 'Fruit Catch',    'rate' => 0.03],
  'alienwave'   => ['type' => 'skill', 'name' => 'Alien Wave',     'rate' => 0.03],
  'skyhopper'   => ['type' => 'skill', 'name' => 'Sky Hopper',     'rate' => 0.03],
  'cityshield'  => ['type' => 'skill', 'name' => 'City Shield',    'rate' => 0.03],
  'meteorblast' => ['type' => 'skill', 'name' => 'Meteor Blaster', 'rate' => 0.03],
  'beattap'     => ['type' => 'skill', 'name' => 'Beat Tap',       'rate' => 0.03],
  'ropeswing'   => ['type' => 'skill', 'name' => 'Rope Swing',     'rate' => 0.03],
  'minigolf'    => ['type' => 'skill', 'name' => 'Mini Golf',      'rate' => 0.03],
  'skislalom'   => ['type' => 'skill', 'name' => 'Ski Slalom',     'rate' => 0.03],
  // jeux « qu'on contrôle » (propriétaire) — conduite / course + guerre — js/games/skill8.js
  'roadrace'    => ['type' => 'skill', 'name' => 'Road Race',      'rate' => 0.03],
  'airraid'     => ['type' => 'skill', 'name' => 'Air Raid',       'rate' => 0.03],
];
