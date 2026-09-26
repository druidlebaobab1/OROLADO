# OROLADO - detail jour par jour + reserve de caisse.
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Add-Type -TypeDefinition ([IO.File]::ReadAllText((Join-Path $here 'HardTest.cs'))) -Language CSharp
[HardTest]::DailyDetail(90, 100, 0.03, 100, 60, 89)
[HardTest]::DailyDetail(180, 100, 0.03, 60, 170, 170)