<?php
require "orolado_lib.php";

$stake = 1;
$payout = 5.0;

$credit = orolado_trade_credit(true, false, $stake, $payout);
$net = orolado_money($credit - $stake);

echo "Payout: $payout\n";
echo "Stake: $stake\n";
echo "Credit: $credit\n";
echo "Net: $net\n";
?>
