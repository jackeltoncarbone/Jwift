# Relaunch the connect-mode Chrome (:9222, profile ~/.chrome-mcp) so its tabs always render: occluded and
# background windows are not throttled, so document.visibilityState stays 'visible' and a canvas app keeps
# its frame loop. Optional first argument: the URL to open (default the jiv gallery).
param([string]$Url = 'https://localhost:6767/dev/jiv')
$existing = Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object { $_.CommandLine -match 'remote-debugging-port=9222' -and $_.CommandLine -notmatch '--type=' } | Select-Object -First 1
$exe = if ($existing) { ($existing.CommandLine -replace '^"([^"]+)".*$', '$1') } else { 'C:\Program Files\Google\Chrome\Application\chrome.exe' }
if (-not (Test-Path $exe)) { $exe = "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe" }
if ($existing) { Stop-Process -Id $existing.ProcessId -Force -ErrorAction SilentlyContinue; Start-Sleep -Seconds 2 }
$args = @(
  '--remote-debugging-port=9222',
  "--user-data-dir=$env:USERPROFILE\.chrome-mcp",
  '--ignore-certificate-errors',
  '--no-first-run',
  '--window-size=1440,900',
  '--window-position=0,0',
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding',
  '--disable-background-timer-throttling',
  '--disable-features=CalculateNativeWinOcclusion',
  $Url
)
Start-Process -FilePath $exe -ArgumentList $args | Out-Null
$deadline = (Get-Date).AddSeconds(20)
do { Start-Sleep -Milliseconds 500; try { $list = Invoke-RestMethod http://127.0.0.1:9222/json/list -ErrorAction Stop } catch { $list = $null } } while (-not $list -and (Get-Date) -lt $deadline)
if ($list) { "chrome up: " + (($list | Where-Object type -eq 'page' | ForEach-Object url) -join ' | ') } else { Write-Error 'chrome did not answer on :9222'; exit 1 }
