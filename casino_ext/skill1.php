<?php
// v2805/v2807 — skill1 games (owner request): 6 « You're in control » games in MIXED MODE (like Aviator, but the player plays).
// The multiplier grows ×e^(rate·s); the server draws the secret end at start (same law as the plane: 94 % return).
// A player's mistake (obstacle, missed block, saved shot…) only loses earlier — it can never pay more.
// Rates: ×2 arrives after ln2/rate seconds (0.11 → 6.3 s, 0.10 → 6.9 s, 0.09 → 7.7 s). Client: js/games/skill1.js.
return [
  'spacerun'   => ['type' => 'skill', 'name' => 'Space Runner',  'rate' => 0.11],
  'flappyrock' => ['type' => 'skill', 'name' => 'Flappy Rocket', 'rate' => 0.11],
  'stack'      => ['type' => 'skill', 'name' => 'Tower Stack',   'rate' => 0.10],
  'knifehit'   => ['type' => 'skill', 'name' => 'Star Blades',   'rate' => 0.10],
  'basket'     => ['type' => 'skill', 'name' => 'Basket Shot',   'rate' => 0.09],
  'starbridge' => ['type' => 'skill', 'name' => 'Star Bridge',   'rate' => 0.09], // v2807 : nouveau (remplace Penalty Kicker)
  // v2807 (propriétaire) : Penalty Kicker a quitté la liste « Tu contrôles » (deux jeux de penalty embrouillaient les joueurs).
  // La fiche reste ICI seulement pour que les anciennes parties se règlent et que l'admin garde son nom et ses chiffres ;
  // le catalogue (js/games/cat-skill1.js) ne l'affiche plus et le navigateur n'a plus de module pour lui.
  'kicker'     => ['type' => 'skill', 'name' => 'Penalty Kicker', 'rate' => 0.09],
];
