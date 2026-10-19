<?php
// v2807 — more3 (owner request: complete lobby rows). Each fiche is checked at load: RTP must be ≤ 94.5 %, else ignored.
// Star Bowling — one roll at 10 pins; line i (0…10) = i pins knocked down, line 11 = golden strike (the gold head pin).
// Payouts: 6 pins ×0.3 · 7 ×0.8 · 8 ×1.2 · 9 ×1.8 · strike ×3.25 · golden strike ×15. Exact RTP 93.58 % (scripts/test-cg-more3.php).
// The browser knocks down EXACTLY that number of pins (view.i).
return [
  'bowling' => ['type' => 'table', 'name' => 'Star Bowling', 'out' => [
    [0, 400], [0, 300], [0, 400], [0, 600], [0, 800], [0, 1000], [0.3, 1300], [0.8, 1500], [1.2, 1400], [1.8, 1200], [3.25, 1070], [15, 30]]],
];
