<?php
// v2830 — more4 (owner request, round 5): 26 new instant games for the list « All games », each one a different mechanic.
// Each fiche is checked at load: RTP must be ≤ 94.5 %, else ignored. Every table / option here returns 93.5–94 % (scripts/test-cg-more4.php).
// The browser (js/games/more4a…f.js) draws a scene that matches the drawn line (view.i) or the winning option (view.w) exactly.
return [
  // Coin Pusher — lines = coins pushed over the edge 0…5, then the gold bar. RTP 93.80 %
  'coinpush' => ['type' => 'table', 'name' => 'Coin Pusher', 'out' => [[0, 3866], [0.4, 2600], [1, 1500], [2, 1000], [4, 550], [10, 160], [50, 15]]],
  // Big Catch — empty hook, old boot, sardine, perch, bass, salmon, swordfish, golden fish. RTP 93.79 %
  'fishing' => ['type' => 'table', 'name' => 'Big Catch', 'out' => [[0, 1685], [0, 1500], [0.5, 2400], [1.2, 1800], [2.5, 700], [6, 220], [20, 40], [200, 3]]],
  // Pinball — stars lit by the bumpers: 0–1 (lose), 2, 3, 4, 5, 6, then the ball in the star hole (jackpot). RTP 93.80 %
  'pinball' => ['type' => 'table', 'name' => 'Pinball', 'out' => [[0, 3566], [0.5, 2500], [1, 2000], [2, 1200], [5, 350], [15, 80], [100, 5]]],
  // Horseshoe Toss — total points of 3 shoes (miss 0 · leaner 1 · ringer 3; chances 5/10 · 3/10 · 2/10): 0,1,2,3,4,5,6,7,9 — exact weights /1000. RTP 93.76 %
  'horseshoe' => ['type' => 'table', 'name' => 'Horseshoes', 'out' => [[0, 125], [0, 225], [0, 135], [0.8, 177], [1.2, 180], [2, 54], [3, 60], [5, 36], [14, 8]]],
  // Hole in One — water, bunker, fairway, green, close, tap-in, hole in one. RTP 93.80 %
  'golf' => ['type' => 'table', 'name' => 'Hole in One', 'out' => [[0, 1761], [0, 1500], [0.4, 2400], [1.2, 2400], [3, 900], [8, 180], [100, 6]]],
  // Lucky Polish — 5 nails × 6 colours (7 776 exact): five of a colour, four, full, three, two pairs, pair, rainbow (all different). RTP 93.98 %
  'nails' => ['type' => 'table', 'name' => 'Lucky Nails', 'out' => [[100, 6], [10, 150], [5, 300], [1.5, 1200], [0.8, 1800], [0, 3600], [0.65, 720]]],
  // Jewel Boutique — empty box, earrings, bracelet, necklace, ring, tiara, royal crown. RTP 93.80 %
  'jewelbox' => ['type' => 'table', 'name' => 'Jewel Box', 'out' => [[0, 4112], [0.5, 2700], [1.2, 2000], [2.5, 900], [6, 300], [20, 60], [150, 3]]],
  // Loves Me — petals 5…13 then golden daisy 21: odd count ends on “loves me” (win), even on “not” (lose). RTP 93.80 %
  'daisy' => ['type' => 'table', 'name' => 'Loves Me', 'out' => [[1, 1800], [0, 2400], [1.8, 1500], [0, 1900], [3, 800], [0, 1200], [8, 180], [0, 562], [25, 40], [200, 2]]],
  // Safe Cracker — 0 / 1 / 2 tumblers, then the open safe: cash, gold bars, jewels, diamond. RTP 93.80 %
  'safe' => ['type' => 'table', 'name' => 'Safecracker', 'out' => [[0, 2000], [0, 2605], [0.5, 3000], [1.5, 2200], [4, 700], [12, 150], [100, 6]]],
  // High Striker — puck height levels 1…9, bell, golden bell. RTP 93.80 %
  'striker' => ['type' => 'table', 'name' => 'Strongman', 'out' => [[0, 1015], [0, 1015], [0, 1015], [0, 1017], [0.4, 1500], [0.8, 1500], [1.5, 1300], [3, 600], [6, 250], [20, 60], [150, 3]]],
  // Snakes & Ladders — final square after 3 die rolls (216 exact): row 1 ×0 · row 2 ×0.2 · row 3 ×0.4 · row 4 ×0.8 · row 5 ×1.2 · square 25 ×40. RTP 93.80 %
  'snakes' => ['type' => 'table', 'name' => 'Snakes', 'out' => [[0, 1], [0, 15], [0.2, 7], [0.2, 11], [0.2, 22], [0.2, 17], [0.4, 19], [0.4, 16], [0.4, 15], [0.8, 9], [0.8, 18], [0.8, 9], [0.8, 9], [1.2, 7], [1.2, 31], [1.2, 8], [40, 2]]],
  // Ski Jump — fall, short, 95 m, 105 m, 115 m, 125 m, 135 m, hill record 145 m+. RTP 93.80 %
  'skijump' => ['type' => 'table', 'name' => 'Ski Jump', 'out' => [[0, 2188], [0, 1500], [0.5, 2600], [1.2, 2000], [2.5, 900], [6, 280], [20, 50], [150, 2]]],
  // Fireworks — 3 rockets: no match, two alike, three green / blue / pink / purple / gold. RTP 93.80 %
  'fireworks' => ['type' => 'table', 'name' => 'Fireworks', 'out' => [[0, 3771], [0.5, 4000], [3, 600], [5, 300], [10, 120], [20, 50], [100, 8]]],
  // Gumball Machine — white, blue, green, red, purple, rainbow, gold. RTP 93.80 %
  'gumball' => ['type' => 'table', 'name' => 'Gumball', 'out' => [[0, 3771], [0.5, 2400], [1.2, 2000], [2.5, 800], [6, 250], [20, 50], [150, 4]]],
  // Bingo 75 — 40 balls on a 5×5 card: lines completed 0 / 1 / 2 / 3 / 4+ (weights = simulated frequencies ×10⁶). RTP 93.61 %
  'bingo' => ['type' => 'table', 'name' => 'Bingo 75', 'out' => [[0, 554660], [1.2, 318860], [3, 98950], [8, 22350], [15, 5190]]],
  // Cricket Six — wicket, dot ball, 1 run, 2 runs, four, six, golden six. RTP 93.81 %
  'cricket' => ['type' => 'table', 'name' => 'Cricket Six', 'out' => [[0, 1034], [0, 1500], [0.5, 2400], [1, 1800], [2.5, 900], [6, 300], [50, 8]]],
  // Pool Break — balls potted on the break 0…5, then the 8-ball break. RTP 93.80 %
  'pool' => ['type' => 'table', 'name' => 'Pool Break', 'out' => [[0, 3292], [0.5, 2600], [1.2, 1800], [2.5, 800], [6, 250], [15, 60], [100, 4]]],
  // Piñata — no break, then treats tiers. RTP 93.80 %
  'pinata' => ['type' => 'table', 'name' => 'Piñata', 'out' => [[0, 2293], [0.4, 2800], [1, 2200], [2, 1000], [5, 300], [15, 60], [100, 4]]],
  // Checkers Jump — captures in the king’s chain 0…5. RTP 93.80 %
  'checkers' => ['type' => 'table', 'name' => 'Checkers', 'out' => [[0, 3361], [0.5, 3000], [1.5, 1600], [4, 500], [12, 120], [60, 12]]],
  // Whack-a-Mole — moles hit out of 5 (each 2 in 5, exact binomial /3125). RTP 93.95 %
  'moles' => ['type' => 'table', 'name' => 'Mole Smash', 'out' => [[0, 243], [0, 810], [0.6, 1080], [1.5, 720], [3.5, 240], [11.5, 32]]],
  // Ace Serve — double fault, point lost, rally won, service winner, ace, 220 km/h ace, golden ace. RTP 93.80 %
  'tennis' => ['type' => 'table', 'name' => 'Ace Serve', 'out' => [[0, 1200], [0, 1964], [0.6, 2600], [1.5, 1800], [3, 700], [12, 90], [100, 4]]],
  // Domino Rally — chain stops at 0–9 / 10–19 / 20–29 / 30–39 / all 40 / golden domino. RTP 93.80 %
  'domino' => ['type' => 'table', 'name' => 'Dominoes', 'out' => [[0, 2989], [0.5, 2800], [1.2, 2000], [2.5, 900], [6, 300], [30, 20]]],
  // Gold Rush — grams in the pan 0, 3, 6, 10, 15, 20, 30, 50, 100, 250, 1000 (×grams÷10). RTP 93.80 %
  'goldpan' => ['type' => 'table', 'name' => 'Gold Rush', 'out' => [[0, 1159], [0.3, 2600], [0.6, 1900], [1, 1300], [1.5, 900], [2, 600], [3, 350], [5, 160], [10, 50], [25, 10], [100, 1]]],
  // Four in a Row — lose, win straight, win diagonal, double line or 5 in a row, draw. RTP 93.97 %
  'connect4' => ['type' => 'table', 'name' => '4 in a Row', 'out' => [[0, 4488], [1.25, 3099], [1.8, 1936], [5, 400], [0.5, 76]]],
  // Bouquet Toss — 5 bridesmaids at different distances catch the bouquet 35 · 25 · 20 · 12 · 8 %: ×2.68 · ×3.76 · ×4.69 · ×7.83 · ×11.74 (0.94 ÷ chance, rounded down). 93.8–94 %
  'bouquet' => ['type' => 'pick', 'name' => 'Bouquet', 'opts' => [0.35, 0.25, 0.2, 0.12, 0.08]],
  // Craps — pass line wins 244/495 (×1.90, 93.66 %), don't pass wins the other 251/495 (×1.85, 93.81 %); the browser rolls a real craps sequence.
  'craps' => ['type' => 'pick', 'name' => 'Craps', 'opts' => [244 / 495, 251 / 495]],
];
