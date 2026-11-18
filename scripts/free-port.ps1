$port = if ($args[0]) { [int]$args[0] } else { 3001 }

for ($attempt = 1; $attempt -le 5; $attempt++) {
  $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue

  if (-not $connections) {
    break
  }

  foreach ($connection in $connections) {
    $processId = $connection.OwningProcess
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue

    if ($process) {
      Write-Host "Liberando porta ${port}: processo $($process.Name) (PID $processId)"
      Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
  }

  Start-Sleep -Milliseconds 300
}

$remaining = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($remaining) {
  Write-Error "Não foi possível liberar a porta $port."
  exit 1
}

Write-Host "Porta $port liberada."
