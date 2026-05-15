# Post a single "daily analysis" card to Trello list "Analisis" (or TRELLO_ANALYSIS_LIST_NAME).
# Uses same credentials as trello-sync-markdown-docs.ps1

param(
  [string]$ApiKey = $env:TRELLO_API_KEY,
  [string]$Token = $env:TRELLO_TOKEN,
  [string]$BoardId = $env:TRELLO_BOARD_ID,
  [string]$ListName = "",
  [string]$SummaryFile = ""
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($ListName)) {
  $ListName = if ($env:TRELLO_ANALYSIS_LIST_NAME) { $env:TRELLO_ANALYSIS_LIST_NAME } else { "Análisis" }
}

function Read-EnvValue {
  param([string]$FilePath, [string]$Name)
  if (-not (Test-Path $FilePath)) { return $null }
  $pattern = "^\s*$Name\s*=\s*(.+)\s*$"
  foreach ($line in [System.IO.File]::ReadLines($FilePath)) {
    if ($line.StartsWith("#")) { continue }
    $match = [regex]::Match($line, $pattern)
    if (-not $match.Success) { continue }
    $value = $match.Groups[1].Value.Trim()
    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    return $value
  }
  return $null
}

$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
foreach ($envName in @(".env.local", ".env")) {
  $p = Join-Path $repoRoot $envName
  if ([string]::IsNullOrWhiteSpace($ApiKey)) { $ApiKey = Read-EnvValue -FilePath $p -Name "TRELLO_API_KEY" }
  if ([string]::IsNullOrWhiteSpace($Token)) { $Token = Read-EnvValue -FilePath $p -Name "TRELLO_TOKEN" }
  if ([string]::IsNullOrWhiteSpace($BoardId)) {
    $b = Read-EnvValue -FilePath $p -Name "TRELLO_BOARD_ID"
    if ($b) { $BoardId = $b }
  }
}

if ([string]::IsNullOrWhiteSpace($BoardId)) {
  $BoardId = "69b316a06238dae98730288d"
}

if ([string]::IsNullOrWhiteSpace($ApiKey) -or [string]::IsNullOrWhiteSpace($Token)) {
  throw "Missing Trello credentials."
}

function Invoke-TrelloGet {
  param([string]$Path)
  $qk = if ($Path.Contains("?")) { "&" } else { "?" }
  $k = [uri]::EscapeDataString($ApiKey)
  $t = [uri]::EscapeDataString($Token)
  $url = "https://api.trello.com/1/" + $Path + $qk + "key=" + $k + "&token=" + $t
  Invoke-RestMethod $url
}

function Invoke-TrelloPostForm {
  param([string]$Path, [hashtable]$Form)
  $uri = "https://api.trello.com/1/" + $Path
  $Form["key"] = $ApiKey
  $Form["token"] = $Token
  Invoke-RestMethod -Method Post -Uri $uri -Body $Form
}

$listPath = "boards/" + $BoardId + "/lists?cards=none&fields=id,name,closed,pos"
$lists = Invoke-TrelloGet $listPath

function Find-OrCreate-AnalysisList {
  param([string]$Preferred)
  $candidates = @()
  if (-not [string]::IsNullOrWhiteSpace($Preferred)) { $candidates += $Preferred }
  $candidates += "Análisis", "Analisis", "ANALISIS"
  foreach ($c in ($candidates | Select-Object -Unique)) {
    $found = $lists | Where-Object { -not $_.closed -and $_.name -eq $c } | Select-Object -First 1
    if ($found) { return $found.id, $found.name }
  }
  $createName = if (-not [string]::IsNullOrWhiteSpace($Preferred)) { $Preferred } else { "Análisis" }
  $newList = Invoke-TrelloPostForm "lists" @{ idBoard = $BoardId; name = $createName; pos = "bottom" }
  $script:lists += $newList
  return $newList.id, $newList.name
}

$foundList = Find-OrCreate-AnalysisList $ListName
$listId = $foundList[0]
$resolvedListName = $foundList[1]

function Ensure-AnalysisLabel {
  $labelPath = "boards/" + $BoardId + "/labels?fields=id,name,color"
  $labels = Invoke-TrelloGet $labelPath
  $existing = $labels | Where-Object { $_.name -eq "Analisis" -or $_.name -eq "Análisis" } | Select-Object -First 1
  if ($existing) { return $existing.id }
  $newLabel = Invoke-TrelloPostForm "labels" @{ idBoard = $BoardId; name = "Analisis"; color = "purple" }
  return $newLabel.id
}

$labelId = Ensure-AnalysisLabel

$today = Get-Date -Format "yyyy-MM-dd"
$cardName = "[Analisis] Resumen trabajo $today"

$cardsPath = "lists/" + $listId + "/cards?fields=id,name,closed"
$dup = @(Invoke-TrelloGet $cardsPath | Where-Object { -not $_.closed -and $_.name -eq $cardName })
if ($dup.Count -gt 0) {
  $u = $dup[0].shortUrl
  if (-not $u) { $u = $dup[0].url }
  Write-Host "SKIP: ya existe $cardName ($u)"
  exit 0
}

if (-not [string]::IsNullOrWhiteSpace($SummaryFile) -and (Test-Path $SummaryFile)) {
  $body = [System.IO.File]::ReadAllText($SummaryFile, [System.Text.UTF8Encoding]::new($false))
} else {
  $body = @"
## Resumen implementacion (repo v0-social / BFF Next)

### 1. Activity Core System
- **GET /api/activity/core-stream** — stream unificado: eventos, usuarios, grupos, fast_date, trends, fallback_items (nunca vacio).
- Ranking por recencia, proximidad, activity_score y engagement; modos SOCIAL/DATING/BOTH/MEETUP/FAST_DATE.
- **ActivityCoreStreamStrip** en vacios: Feed, Events (meetup/FD), Groups, Tonight.
- Doc: ``docs/sparkd-activity-core-system-trello.md``

### 2. Context-Aware Social Messaging
- **GET /api/chat/context/[id]**, **GET /api/chat/activity/[id]**, **POST /api/chat/action** (+ quick_replies en contexto).
- Cabecera contextual, acciones (Ver evento, Unir al plan, Invitar, Meetup, Fast Date), rail de actividad, respuestas rapidas, tab IA **Plan** (coordination en /api/ai).
- Fast Date: deep link a chat con ``?fdId=...``
- Doc: ``docs/sparkd-context-aware-chat-trello.md``

### 3. Conversion Loop Engine
- **POST /api/loop/track**, **GET /api/loop/insights/[userId]**, **POST /api/loop/trigger**; ConversionLoopCoach en feed.
- Doc: ``docs/sparkd-conversion-loop-engine-trello.md``

### 4. Recommendation Graph v2 (ajuste)
- Ajuste de **overlap_buckets** en agregador de personas compatibles.

### 5. Trello — documentacion en tarjetas
- Script **scripts/trello-sync-markdown-docs.ps1** + **npm run trello:docs:sync**: sube MD de backlog a lista **Docs - Markdown backlog** (sin duplicar por nombre).

---
*Generado automaticamente. Re-ejecutar el script el mismo dia omite si ya existe la tarjeta del dia.*
"@
}

$maxDesc = 16000
if ($body.Length -gt $maxDesc) {
  $body = $body.Substring(0, $maxDesc) + "`n`n(truncado)"
}

$card = Invoke-TrelloPostForm "cards" @{
  idList   = $listId
  name     = $cardName
  desc     = $body
  pos      = "top"
  idLabels = $labelId
}

Write-Host "OK: $($card.shortUrl) - $cardName"
[PSCustomObject]@{ url = $card.shortUrl; name = $cardName; list = $resolvedListName } | ConvertTo-Json
