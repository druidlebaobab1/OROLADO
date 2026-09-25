# OROLADO - calibration des lignes objectif + preuve du retour joueur.
# Usage : powershell -ExecutionPolicy Bypass -File scripts\fair-calib.ps1 [-Prove] [-Trades 20000]
# (fichier en ASCII : PowerShell 5 lit mal les accents sans BOM)
param(
  [switch]$Prove,
  [int]$Samples = 4000000,
  [int]$Trades = 20000,
  [int]$MaxTicks = 2400
)
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$root = Split-Path -Parent $here
Add-Type -TypeDefinition ([IO.File]::ReadAllText((Join-Path $here 'FairCalib.cs'))) -Language CSharp
$utf8 = New-Object Text.UTF8Encoding $false

$sw = [Diagnostics.Stopwatch]::StartNew()
$table = [FairCalib]::BuildTable($Samples)
$json = [FairCalib]::TableJson($table)
$stamp = (Get-Date).ToString('yyyy-MM-dd HH:mm')

$php = @'
<?php
// GENERE par scripts/fair-calib.ps1 le __STAMP__ - ne pas modifier a la main.
// [strike, call x5, call x10, call x50, put x5, put x10, put x50] = mouvements relatifs.
function orolado_fair_table(): array {
  static $t = null;
  if ($t === null) $t = json_decode('__JSON__', true);
  return $t;
}
'@
$php = $php.Replace('__STAMP__', $stamp).Replace('__JSON__', $json)
[IO.File]::WriteAllText((Join-Path $root 'fair_table.php'), $php + "`n", $utf8)

$js = @'
/* GENERE par scripts/fair-calib.ps1 le __STAMP__ - ne pas modifier a la main. */
(function (root) { var D6 = root.D6 = root.D6 || {}; D6.FAIR_TABLE = __JSON__; })(typeof window !== 'undefined' ? window : this);
'@
$js = $js.Replace('__STAMP__', $stamp).Replace('__JSON__', $json)
[IO.File]::WriteAllText((Join-Path $root 'js\fair_table.js'), $js + "`n", $utf8)
Write-Host ("Table ecrite ({0:n1} s)" -f $sw.Elapsed.TotalSeconds)

if ($Prove) {
  $sw.Restart()
  $csv = [FairCalib]::Prove($table, $Trades, $MaxTicks)
  $out = Join-Path $root 'scripts\preuve-equite.csv'
  [IO.File]::WriteAllText($out, $csv, $utf8)
  Write-Host ("Preuve ecrite : {0} ({1:n1} s)" -f $out, $sw.Elapsed.TotalSeconds)
  ($csv -split "`n") | Select-Object -Last 2
}
