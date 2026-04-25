param(
  [string]$ApiKey = $env:TRELLO_API_KEY,
  [string]$Token = $env:TRELLO_TOKEN,
  [string]$BoardId = "69b316a06238dae98730288d",
  [string]$SourceListId = "69b316a06238dae98730288a"
)

$ErrorActionPreference = "Stop"

function Read-EnvValue {
  param(
    [string]$FilePath,
    [string]$Name
  )
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

if ([string]::IsNullOrWhiteSpace($ApiKey) -or [string]::IsNullOrWhiteSpace($Token)) {
  $envFilePath = Join-Path $PSScriptRoot "..\\.env.local"
  if ([string]::IsNullOrWhiteSpace($ApiKey)) {
    $ApiKey = Read-EnvValue -FilePath $envFilePath -Name "TRELLO_API_KEY"
  }
  if ([string]::IsNullOrWhiteSpace($Token)) {
    $Token = Read-EnvValue -FilePath $envFilePath -Name "TRELLO_TOKEN"
  }
}

if ([string]::IsNullOrWhiteSpace($ApiKey) -or [string]::IsNullOrWhiteSpace($Token)) {
  throw "Missing Trello credentials. Set TRELLO_API_KEY/TRELLO_TOKEN in .env.local or pass -ApiKey and -Token."
}

function Invoke-TrelloGet {
  param([string]$Path)
  Invoke-RestMethod "https://api.trello.com/1/$Path&key=$ApiKey&token=$Token"
}

function Invoke-TrelloPut {
  param([string]$Path)
  Invoke-RestMethod -Method Put -Uri "https://api.trello.com/1/$Path&key=$ApiKey&token=$Token" | Out-Null
}

function Invoke-TrelloPost {
  param([string]$Path)
  Invoke-RestMethod -Method Post -Uri "https://api.trello.com/1/$Path&key=$ApiKey&token=$Token"
}

$labels = Invoke-TrelloGet "boards/$BoardId/labels?fields=id,name,color"
$lists = Invoke-TrelloGet "boards/$BoardId/lists?cards=none&fields=id,name,closed,pos"

function Ensure-Label {
  param(
    [string]$Name,
    [string]$Color
  )
  $existing = $script:labels | Where-Object { $_.name -eq $Name } | Select-Object -First 1
  if ($existing) { return $existing.id }
  $newLabel = Invoke-TrelloPost "labels?idBoard=$BoardId&name=$([uri]::EscapeDataString($Name))&color=$Color"
  $script:labels += $newLabel
  return $newLabel.id
}

function Ensure-List {
  param([string]$Name)
  $existing = $script:lists | Where-Object { -not $_.closed -and $_.name -eq $Name } | Select-Object -First 1
  if ($existing) { return $existing.id }
  $newList = Invoke-TrelloPost "lists?idBoard=$BoardId&name=$([uri]::EscapeDataString($Name))&pos=bottom"
  $script:lists += $newList
  return $newList.id
}

$labelMap = @{
  "Prioridad Alta" = (Ensure-Label "Prioridad Alta" "red")
  "Prioridad Media" = (Ensure-Label "Prioridad Media" "yellow")
  "Prioridad Baja" = (Ensure-Label "Prioridad Baja" "green")
  "Backend Auto" = (Ensure-Label "Backend Auto" "blue")
  "Auth" = (Ensure-Label "Auth" "orange")
  "Stories" = (Ensure-Label "Stories" "purple")
  "Bookmarks" = (Ensure-Label "Bookmarks" "green")
  "Reports" = (Ensure-Label "Reports" "red")
  "Groups" = (Ensure-Label "Groups" "sky")
  "Events" = (Ensure-Label "Events" "lime")
  "Chat" = (Ensure-Label "Chat" "pink")
  "Search" = (Ensure-Label "Search" "black")
  "Feed" = (Ensure-Label "Feed" "yellow")
  "Notifications" = (Ensure-Label "Notifications" "orange")
  "Privacy" = (Ensure-Label "Privacy" "red")
  "Analytics" = (Ensure-Label "Analytics" "blue")
  "Admin/Manager" = (Ensure-Label "Admin/Manager" "black")
  "Polls" = (Ensure-Label "Polls" "lime")
}

$listTargets = @{
  "Prioridad Alta" = (Ensure-List "Backend - Alta")
  "Prioridad Media" = (Ensure-List "Backend - Media")
  "Prioridad Baja" = (Ensure-List "Backend - Baja")
}

function Get-PriorityLabelName {
  param([string]$Text)
  if ($Text -match "privacy|seguridad|verify|verification|auth|password|token|api/|endpoint|bookmarks|poll|report|denuncia|follow|seguidores") {
    return "Prioridad Alta"
  }
  if ($Text -match "analytics|dashboard|manager|ui|ux|notifications|sparkling list|close friend") {
    return "Prioridad Media"
  }
  if ($Text -match "refactor|cleanup|nice to have|opcional") {
    return "Prioridad Baja"
  }
  return "Prioridad Media"
}

function Get-CategoryLabels {
  param([string]$Text)
  $categoryNames = New-Object System.Collections.Generic.List[string]
  if ($Text -match "auth|login|register|verify|verification|password|token") { $categoryNames.Add("Auth") }
  if ($Text -match "stor(y|ies)|historia") { $categoryNames.Add("Stories") }
  if ($Text -match "bookmark|guardad") { $categoryNames.Add("Bookmarks") }
  if ($Text -match "report|denuncia|moder") { $categoryNames.Add("Reports") }
  if ($Text -match "group|grupo|member|miembro") { $categoryNames.Add("Groups") }
  if ($Text -match "event|evento|meetup") { $categoryNames.Add("Events") }
  if ($Text -match "chat|message|mensaje") { $categoryNames.Add("Chat") }
  if ($Text -match "search|busqueda|hashtag|mention") { $categoryNames.Add("Search") }
  if ($Text -match "feed|post") { $categoryNames.Add("Feed") }
  if ($Text -match "notification|notific") { $categoryNames.Add("Notifications") }
  if ($Text -match "privacy|privacidad|location|coordenad") { $categoryNames.Add("Privacy") }
  if ($Text -match "analytic|dashboard|metric") { $categoryNames.Add("Analytics") }
  if ($Text -match "manager|admin|panel") { $categoryNames.Add("Admin/Manager") }
  if ($Text -match "poll|encuesta") { $categoryNames.Add("Polls") }
  return $categoryNames | Select-Object -Unique
}

$cards = Invoke-TrelloGet "boards/$BoardId/cards?fields=id,name,idList,idLabels,desc,closed"
$backendCards = $cards | Where-Object { -not $_.closed -and $_.name.StartsWith("[Backend]") }

$priorityCounts = @{
  "Prioridad Alta" = 0
  "Prioridad Media" = 0
  "Prioridad Baja" = 0
}

$categoryCounts = @{}
$movedCounts = @{
  "Backend - Alta" = 0
  "Backend - Media" = 0
  "Backend - Baja" = 0
}

foreach ($card in $backendCards) {
  $text = (($card.name + " " + $card.desc) -as [string]).ToLowerInvariant()
  $priorityName = Get-PriorityLabelName $text
  $categoryNames = Get-CategoryLabels $text

  $labelNames = @("Backend Auto", $priorityName) + $categoryNames
  $labelIds = @()
  foreach ($labelName in ($labelNames | Select-Object -Unique)) {
    if ($labelMap.ContainsKey($labelName)) {
      $labelIds += $labelMap[$labelName]
    }
  }

  $labelsQuery = ($labelIds -join ",")
  Invoke-TrelloPut "cards/$($card.id)/idLabels?value=$labelsQuery"

  $targetListId = $listTargets[$priorityName]
  Invoke-TrelloPut "cards/$($card.id)?idList=$targetListId&pos=top"

  $priorityCounts[$priorityName] = [int]$priorityCounts[$priorityName] + 1
  $targetListName = if ($priorityName -eq "Prioridad Alta") { "Backend - Alta" } elseif ($priorityName -eq "Prioridad Baja") { "Backend - Baja" } else { "Backend - Media" }
  $movedCounts[$targetListName] = [int]$movedCounts[$targetListName] + 1

  foreach ($category in $categoryNames) {
    if (-not $categoryCounts.ContainsKey($category)) { $categoryCounts[$category] = 0 }
    $categoryCounts[$category] = [int]$categoryCounts[$category] + 1
  }
}

$summary = [PSCustomObject]@{
  totalBackendCards = $backendCards.Count
  priorities = $priorityCounts
  movedToLists = $movedCounts
  categories = $categoryCounts.GetEnumerator() | Sort-Object Name | ForEach-Object {
    [PSCustomObject]@{
      label = $_.Name
      count = $_.Value
    }
  }
}

$summary | ConvertTo-Json -Depth 6
