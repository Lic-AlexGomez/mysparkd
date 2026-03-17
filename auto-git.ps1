while ($true) {
  # Verifica si hay cambios
  $changes = git status --porcelain

  if ($changes -ne "") {
    Write-Host "Cambios detectados, haciendo commit..."

    git add .

    # Generar mensaje automático (con IA si tienes aicommits)
    try {
      $msg = aicommits
    } catch {
      $msg = "auto: update $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    }

    git commit -m "$msg"
    git push
  } else {
    Write-Host "Sin cambios..."
  }

  # Espera 5 minutos
  Start-Sleep -Seconds 60
}