<?php
// casb — 23 table / card / dice / arcade-chance instant games + 1 crash game for the Casino list (owner request, round 6).
// Each fiche is checked at load (casino_ext_check): RTP must be ≤ 94.5 %, else ignored. Every table / option here returns
// 93.6–94.0 % (scripts/test-cg-casb.php recomputes the exact sums and simulates real draws).
// Weights are the NATURAL frequencies of the rules the browser plays (js/games/casb1…7.js draws a deal / roll that gives
// exactly the drawn line): exact counts where enumerable, otherwise 10⁶-round simulations (per million).
return [
  /* ---------------------------------------------------------------- cards (casb1.js) */
  // Blackjack — infinite shoe, player follows simple basic strategy, dealer stands on 17: lose · push · win ×1.94 · blackjack ×2.2. 93.85 %
  'blackjack' => ['type' => 'table', 'name' => 'Blackjack', 'out' => [[0, 480360], [1, 86575], [1.94, 387774], [2.2, 45291]]],
  // Three Card Poker vs dealer (one deck): lose · tie ×1 · win ×1.9 · dealer does not qualify (Q-high) ×1.4 ·
  // ante bonus whatever the dealer holds: straight ×2.5 · three of a kind ×6 · straight flush ×10. 93.67 %
  'tcpoker' => ['type' => 'table', 'name' => 'Three Card Poker', 'out' => [[0, 454512], [1, 654], [1.9, 215032], [1.4, 292525], [2.5, 32705], [6, 2377], [10, 2195]]],
  // Casino Hold'em — 2 cards each + 5 on the board, best 5 of 7: lose · tie ×1 · win ×1.75 · bonus whatever the dealer holds:
  // flush ×2.2 · full house ×2.6 · four of a kind ×6 · straight flush ×20. 93.83 %
  'holdem' => ['type' => 'table', 'name' => 'Casino Hold’em', 'out' => [[0, 475753], [1, 37670], [1.75, 428307], [2.2, 30543], [2.6, 25680], [6, 1703], [20, 343]]],
  // Niu Niu — 5 cards (exact count of the 2 598 960 hands): no bull · bull 1…9 · bull-bull (niu niu) · five face cards.
  // bull 1–6 ×0.6 · bull 7–9 ×2.2 · niu niu ×3.45 · five dukes ×50. 93.76 %
  'niuniu' => ['type' => 'table', 'name' => 'Niu Niu', 'out' => [[0, 872128], [0.6, 171304], [0.6, 168096], [0.6, 171304], [0.6, 168096], [0.6, 177424], [0.6, 168096],
    [2.2, 171304], [2.2, 168096], [2.2, 171304], [3.45, 191016], [50, 792]]],
  /* ---------------------------------------------------------------- cards (casb2.js) */
  // Ace Race — the 4 aces race, each card turned moves the ace of its suit; first to 6 wins: pick a suit ×3.76. 94 %
  'acerace' => ['type' => 'pick', 'name' => 'Ace Race', 'opts' => [0.25, 0.25, 0.25, 0.25]],
  // Trente et Quarante — Noir / Rouge rows dealt past 30, the lower total wins; equal totals (11 %) = the bank wins.
  // Noir ×2.11 · Rouge ×2.11 (option 2, the tie, is not offered). 93.9 %
  'trente' => ['type' => 'pick', 'name' => '30 & 40', 'opts' => [0.445, 0.445, 0.11]],
  // Clock Patience — cards turned before the 4th king: 1–29 · 30–39 lose · 40–47 ×0.6 · 48–51 ×1.6 · all 52 (solitaire won) ×3.9. 93.64 %
  'clocksol' => ['type' => 'table', 'name' => 'Clock Patience', 'out' => [[0, 87752], [0, 216305], [0.6, 354245], [1.6, 264674], [3.9, 77024]]],
  /* ---------------------------------------------------------------- dice (casb3.js) */
  // Yatzy — 5 dice, 3 rolls, the most common face is kept: nothing / pairs · three of a kind ×0.5 · full house ×1.2 · four ×1.6 · yatzy ×5.3. 93.78 %
  'yatzy' => ['type' => 'table', 'name' => 'Yatzy', 'out' => [[0, 255706], [0.5, 288551], [1.2, 211037], [1.6, 204497], [5.3, 40209]]],
  // Crown & Anchor — 3 dice, the chosen symbol appears 0 / 1 / 2 / 3 times (exact /216): ×0 · ×1.9 · ×3.3 · ×11. 93.98 %
  'crownanchor' => ['type' => 'table', 'name' => 'Crown & Anchor', 'out' => [[0, 125], [1.9, 75], [3.3, 15], [11, 1]]],
  // Dice Derby — 6 horses, a die roll moves its horse one step; horse 1…6 needs 4…9 steps (exact win chances): ×0.94 ÷ chance. 93.9–94 %
  'derby' => ['type' => 'pick', 'name' => 'Dice Derby', 'opts' => [0.494294, 0.26175, 0.133586, 0.065531, 0.030871, 0.013968]],
  // Cee-Lo — player and banker each roll 3 dice until a result (exact /11 664): lose · push ×1 · win on a point ×1.82 · win with trips ×2 · win with 4-5-6 ×2. 93.96 %
  'ceelo' => ['type' => 'table', 'name' => 'Cee-Lo', 'out' => [[0, 5118], [1, 1428], [1.82, 3915], [2, 591], [2, 612]]],
  // Ship, Captain & Crew — 5 dice, 3 rolls: 6 then 5 then 4, the 2 other dice are the cargo: no crew · cargo 2–7 ×0.6 · 8–9 ×1.9 · 10–11 ×3 · 12 ×6.5. 93.82 %
  'shipcrew' => ['type' => 'table', 'name' => 'Ship & Crew', 'out' => [[0, 459274], [0.6, 12323], [0.6, 24615], [0.6, 36814], [0.6, 42268], [0.6, 51288], [0.6, 62215],
    [1.9, 112668], [1.9, 81808], [3, 54037], [3, 39607], [6.5, 23083]]],
  /* ---------------------------------------------------------------- wheels & coins (casb4.js) */
  // Double Ball Roulette — European wheel, 2 balls (exact /1369): red-red ×3.97 · one of each ×1.98 · black-black ×3.97 · a zero ×17.62. 93.9–94 %
  'dblroul' => ['type' => 'pick', 'name' => 'Double Roulette', 'opts' => [324 / 1369, 648 / 1369, 324 / 1369, 73 / 1369]],
  // Twin Wheel — outer wheel (12) × inner wheel (8), every pair equally likely: line = outer·8 + inner. 93.75 %
  'twinwheel' => ['type' => 'table', 'name' => 'Twin Wheel', 'out' => (static function () {
    $o = []; foreach ([0, 1, 0, 2, 0, 1, 0, 1, 0, 1, 0, 6] as $a) foreach ([0.4, 1, 0.6, 1.5, 0.4, 1, 0.6, 2] as $b) $o[] = [round($a * $b, 2), 1]; return $o; })()],
  // Two-Up — two coins: Heads ×3.76 · Odds ×1.88 · Tails ×3.76. 94 %
  'twoup' => ['type' => 'pick', 'name' => 'Two-Up', 'opts' => [0.25, 0.5, 0.25]],
  // Fan-Tan — beans removed 4 by 4, the remainder 1 / 2 / 3 / 4 ×3.76. 94 %
  'fantan' => ['type' => 'pick', 'name' => 'Fan-Tan', 'opts' => [0.25, 0.25, 0.25, 0.25]],
  /* ---------------------------------------------------------------- arcade chance (casb5.js) */
  // Pachinko — drain · start pocket, reels miss · tulip ×0.5 · side pocket ×2 · three alike ×10 · 7-7-7 ×100. 93.79 %
  'pachinko' => ['type' => 'table', 'name' => 'Pachinko', 'out' => [[0, 1991], [0, 1000], [0.5, 2000], [2, 1200], [10, 200], [100, 6]]],
  // Lucky Ladder — 5 pots under a ladder lottery, each equally likely: ×0 · ×0.3 · ×0.8 · ×1.6 · ×2. 94 %
  'ladder' => ['type' => 'table', 'name' => 'Lucky Ladder', 'out' => [[0, 1], [0.3, 1], [0.8, 1], [1.6, 1], [2, 1]]],
  // Skee-Ball — 5 balls, holes 10/20/30/40/50/100 (30/25/18/12/10/5 %), exact total law (÷1000): <150 · 150+ ×1.45 · 200+ ×2.6 · 250+ ×5.5 · 300+ ×20 · 350+ ×100. 93.88 %
  'skeeball' => ['type' => 'table', 'name' => 'Skee-Ball', 'out' => [[0, 6058493], [1.45, 2582892], [2.6, 1065068], [5.5, 243699], [20, 43148], [100, 6700]]],
  // Lucky Ducks — the hooked duck shows: nothing · ×0.5 · ×1 · ×2 · ×5 · ×20 · golden duck ×100. 93.80 %
  'ducks' => ['type' => 'table', 'name' => 'Lucky Ducks', 'out' => [[0, 2759], [0.5, 2600], [1, 1800], [2, 900], [5, 300], [20, 60], [100, 3]]],
  /* ---------------------------------------------------------------- arcade chance (casb6.js) */
  // Dreidel — 4 equal sides: Shin ×0 · Hei ×0.7 · Nun ×1 · Gimel ×2.06. 94 %
  'dreidel' => ['type' => 'table', 'name' => 'Dreidel', 'out' => [[0, 1], [0.7, 1], [1, 1], [2.06, 1]]],
  // Oracle Ball — 20-sided answer: Yes (10) ×1.88 · Maybe (5) ×3.76 · No (5) ×3.76. 94 %
  'oracle' => ['type' => 'pick', 'name' => 'Oracle Ball', 'opts' => [0.5, 0.25, 0.25]],
  // RPS Duel — rock, paper, scissors against the robot: lose · draw ×1 · win ×1.82. 94 %
  'rpsduel' => ['type' => 'table', 'name' => 'RPS Duel', 'out' => [[0, 1], [1, 1], [1.82, 1]]],
  /* ---------------------------------------------------------------- crash (casb7.js) */
  // Comet Queen — Aviator-style: the multiplier rises (×e^(0.12·s)), the server secretly drew the end at start (same law as the plane, 94 %); cash out before.
  'cometqueen' => ['type' => 'skill', 'name' => 'Comet Queen', 'rate' => 0.12],
];
