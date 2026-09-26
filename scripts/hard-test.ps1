# OROLADO - test dur : milliers de faux joueurs sur des mois (depots, bonus, retraits, chanceux).
# Usage : powershell -ExecutionPolicy Bypass -File scripts\hard-test.ps1
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Add-Type -TypeDefinition ([IO.File]::ReadAllText((Join-Path $here 'HardTest.cs'))) -Language CSharp
$out = @()
$out += [HardTest]::Report(90, 100, 0.00, 40)
$out += [HardTest]::Report(90, 100, 0.03, 40)
$out += [HardTest]::Report(90, 200, 0.03, 40)
$txt = $out -join "`r`n"
[IO.File]::WriteAllText((Join-Path $here 'rapport-test-dur.txt'), $txt, (New-Object Text.UTF8Encoding $false))
$txt
