<?php
// v2805 — more1 games (owner request): 15 instant games for the list « All games ». Each fiche is checked at load:
// RTP must be ≤ 94.5 %, else the game is ignored. Every table / option below returns 93.5–94 % (scripts/test-cg-more1.php).
// The browser draws a scene that matches the drawn line (view.i) or the winning option (view.w) exactly.
return [
  // Plinko — 12 rows, 13 bins; weights = exact binomial C(12, k) (the ball goes right k times out of 12). 93.75 %
  'plinko2' => ['type' => 'table', 'name' => 'Plinko', 'out' => [
    [29, 1], [9, 12], [4, 66], [2, 220], [1.1, 495], [0.5, 792], [0.3, 924], [0.5, 792], [1.1, 495], [2, 220], [4, 66], [9, 12], [29, 1]]],
  // Goal — one shot on a 3-zone goal: the keeper saves 1 time in 3 (line 0), else goal ×1.41 (line 1). 94 %
  'goal' => ['type' => 'table', 'name' => 'Goal', 'out' => [[0, 1], [1.41, 2]]],
  // Mini Roulette — 13 numbers 0–12, bet on one number ×12.22 (pick = the number). 94 %
  'miniroul' => ['type' => 'pick', 'name' => 'Mini Roulette', 'opts' => array_fill(0, 13, 1 / 13)],
  // Keno 80 — 5 numbers chosen on 80, 20 balls drawn; line i = i hits; exact hypergeometric weights
  // C(5,i)·C(75,20−i) ÷ 11 176 532 778 020. 93.74 %
  'keno80' => ['type' => 'table', 'name' => 'Keno 80', 'out' => [[0, 71862], [0, 128325], [1, 85550], [3, 26550], [17, 3825], [325, 204]]],
  // Thimbles — 3 cups, the ball is under one ×2.82. 94 %
  'thimbles' => ['type' => 'pick', 'name' => 'Thimbles', 'opts' => [1 / 3, 1 / 3, 1 / 3]],
  // Cups & Balls — 5 cups ×4.69. 93.8 %
  'cups' => ['type' => 'pick', 'name' => 'Cups & Balls', 'opts' => [0.2, 0.2, 0.2, 0.2, 0.2]],
  // Higher Card — a 7 is shown; next card (Ace low, 13 ranks) Lower (A–6) / Seven / Higher (8–K). Only Lower and Higher
  // are offered (×2.03) — a 7 loses both. 93.69 %
  'highcard' => ['type' => 'pick', 'name' => 'Higher Card', 'opts' => [6 / 13, 1 / 13, 6 / 13]],
  // Red Dog — single deck, 2 cards then a 3rd: lines 0 trips ×12, 1 pair push, 2 consecutive push, then for spread
  // 1…11 a win line (×8, ×5.5, ×3, ×2 …) and a lose line. Exact counts of 52·51·50 deals. 93.9 %
  'reddog' => ['type' => 'table', 'name' => 'Red Dog', 'out' => [
    [12, 312], [1, 7488], [1, 19200],
    [8, 1408], [0, 16192], [5.5, 2560], [0, 13440], [3, 3456], [0, 10944], [2, 4096], [0, 8704], [2, 4480], [0, 6720], [2, 4608], [0, 4992],
    [2, 4480], [0, 3520], [2, 4096], [0, 2304], [2, 3456], [0, 1344], [2, 2560], [0, 640], [2, 1408], [0, 192]]],
  // Casino War — one card each from one deck: Player ×1.99 (8/17), Dealer ×1.99 (8/17), Tie ×15.97 (1/17). 93.65–93.94 %
  'war' => ['type' => 'pick', 'name' => 'Casino War', 'opts' => [8 / 17, 8 / 17, 1 / 17]],
  // Andar Bahar — Andar / Bahar ×1.88. 94 %
  'andar' => ['type' => 'pick', 'name' => 'Andar Bahar', 'opts' => [0.5, 0.5]],
  // Teen Patti — 3-card hand of 22 100: trail ×40, pure sequence ×36, sequence ×7, color ×4, pair ×2, high card 0. 93.76 %
  'teenpatti' => ['type' => 'table', 'name' => 'Teen Patti', 'out' => [[40, 52], [36, 48], [7, 720], [4, 1096], [2, 3744], [0, 16440]]],
  // Video Poker — one 5-card deal of 2 598 960 (Jacks or Better): royal ×1000, straight flush ×200, four ×80, full ×30,
  // flush ×16, straight ×12, three ×8, two pair ×5.5, jacks or better ×2.8, low pair 0, nothing 0. 93.98 %
  'vpoker' => ['type' => 'table', 'name' => 'Video Poker', 'out' => [
    [1000, 4], [200, 36], [80, 624], [30, 3744], [16, 5108], [12, 10200], [8, 54912], [5.5, 123552], [2.8, 337920], [0, 760320], [0, 1302540]]],
  // Color Prediction — 20 beads: 9 green ×2.08, 2 violet ×9.39, 9 red ×2.08. 93.6–93.9 %
  'colorpred' => ['type' => 'pick', 'name' => 'Color Game', 'opts' => [0.45, 0.1, 0.45]],
  // Lucky Dice — sum of 2 dice: Under 7 ×2.25 (15/36), 7 ×5.64 (6/36), Over 7 ×2.25 (15/36). 93.75–94 %
  'luckydice' => ['type' => 'pick', 'name' => 'Lucky Dice', 'opts' => [15 / 36, 6 / 36, 15 / 36]],
  // Money Wheel — 54 segments 1 (24) · 2 (16) · 5 (7) · 10 (4) · 20 (2) · 40 (1); bet on one symbol:
  // ×2.11 · ×3.17 · ×7.25 · ×12.69 · ×25.38 · ×50.76. 93.78–94 %
  'wheel2' => ['type' => 'pick', 'name' => 'Money Wheel', 'opts' => [24 / 54, 16 / 54, 7 / 54, 4 / 54, 2 / 54, 1 / 54]],
];
