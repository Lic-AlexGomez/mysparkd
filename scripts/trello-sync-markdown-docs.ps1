# Sync docs backlog markdown into Trello cards (one card per file, full body in description).
# Requires: TRELLO_API_KEY, TRELLO_TOKEN in .env / .env.local / environment
# Optional: TRELLO_BOARD_ID, TRELLO_DOCS_LIST_NAME (default list name: Docs - Markdown backlog)

param(
  [string]$ApiKey = $env:TRELLO_API_KEY,
  [string]$Token = $env:TRELLO_TOKEN,
  [string]$BoardId = $env:TRELLO_BOARD_ID,
  [string]$ListName = "",
  [string]$DocsRoot = ""
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($ListName)) {
  $ListName = if ($env:TRELLO_DOCS_LIST_NAME) { $env:TRELLO_DOCS_LIST_NAME } else { "Docs - Markdown backlog" }
}

if ([string]::IsNullOrWhiteSpace($DocsRoot)) {
  $DocsRoot = Join-Path $PSScriptRoot "..\docs"
  $DocsRoot = [System.IO.Path]::GetFullPath($DocsRoot)
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
  throw "Missing Trello credentials. Set TRELLO_API_KEY and TRELLO_TOKEN in .env or environment."
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

function Ensure-List {
  param([string]$Name)
  $existing = $lists | Where-Object { -not $_.closed -and $_.name -eq $Name } | Select-Object -First 1
  if ($existing) { return $existing.id }
  $newList = Invoke-TrelloPostForm "lists" @{ idBoard = $BoardId; name = $Name; pos = "bottom" }
  $script:lists += $newList
  return $newList.id
}

$listId = Ensure-List $ListName

function Ensure-DocsLabel {
  $labelPath = "boards/" + $BoardId + "/labels?fields=id,name,color"
  $labels = Invoke-TrelloGet $labelPath
  $existing = $labels | Where-Object { $_.name -eq "Docs MD" } | Select-Object -First 1
  if ($existing) { return $existing.id }
  $newLabel = Invoke-TrelloPostForm "labels" @{ idBoard = $BoardId; name = "Docs MD"; color = "blue" }
  return $newLabel.id
}

$docsLabelId = Ensure-DocsLabel

$cardsPath = "lists/" + $listId + "/cards?fields=id,name,closed"
$existingCards = Invoke-TrelloGet $cardsPath
$existingNames = New-Object "System.Collections.Generic.HashSet[string]"
foreach ($c in $existingCards) {
  if (-not $c.closed) { [void]$existingNames.Add($c.name) }
}

$files = Get-ChildItem -Path $DocsRoot -File -ErrorAction SilentlyContinue | Where-Object {
  $n = $_.Name
  ($n -like "sparkd-*-trello*.md") -or
  ($n -eq "sparkd-tonight-trello-cards.md") -or
  ($n -like "TRELLO_*.md")
}

$unique = $files | Sort-Object FullName -Unique
$created = 0
$skipped = 0
$maxDesc = 15000

foreach ($file in $unique) {
  $base = $file.Name
  $cardName = "[Docs MD] $base"
  if ($existingNames.Contains($cardName)) {
    Write-Host "SKIP (exists): $cardName"
    $skipped++
    continue
  }

  $raw = [System.IO.File]::ReadAllText($file.FullName, [System.Text.UTF8Encoding]::new($false))
  if ($raw.Length -gt $maxDesc) {
    $raw = $raw.Substring(0, $maxDesc) + "`n`n(truncated for Trello desc limit)"
  }

  $desc = "Source: docs/$base (repo)`n`n" + $raw

  $card = Invoke-TrelloPostForm "cards" @{
    idList   = $listId
    name     = $cardName
    desc     = $desc
    pos      = "bottom"
    idLabels = $docsLabelId
  }

  Write-Host "OK: $($card.shortUrl) - $cardName"
  [void]$existingNames.Add($cardName)
  $created++
}

[PSCustomObject]@{
  listId   = $listId
  listName = $ListName
  boardId  = $BoardId
  created  = $created
  skipped  = $skipped
  total    = $unique.Count
} | ConvertTo-Json
