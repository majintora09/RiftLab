param(
  [string]$InputDir = "public/characters/raw",
  [string]$OutputDir = "public/characters/portraits",
  [int]$Size = 512,
  [int]$Padding = 34
)

Add-Type -AssemblyName System.Drawing

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$inPath = Join-Path $root $InputDir
$outPath = Join-Path $root $OutputDir
New-Item -ItemType Directory -Force -Path $outPath | Out-Null

function Get-Slug([string]$name) {
  $map = @{
    "A-Gohan" = "adult-gohan"
    "Android-21" = "android-21-majin"
    "Lab-coat" = "android-21-lab-coat"
    "DBS-Broly" = "dbs-broly"
    "Z-Broly" = "dbz-broly"
    "Freeza" = "frieza"
    "Gogeta-SS4" = "ssj4-gogeta"
    "ssj4-goku-daima" = "ssj4-goku-daima"
    "Vegeta-Blue" = "vegeta-blue"
    "Super-Baby" = "super-baby-2"
    "Vegito" = "vegito-blue"
  }

  if ($map.ContainsKey($name)) {
    return $map[$name]
  }

  return $name.ToLowerInvariant() -replace '\s+', '-' -replace '[^a-z0-9-]', ''
}

function Get-AlphaBounds([System.Drawing.Bitmap]$bitmap) {
  $minX = $bitmap.Width
  $minY = $bitmap.Height
  $maxX = -1
  $maxY = -1

  for ($y = 0; $y -lt $bitmap.Height; $y++) {
    for ($x = 0; $x -lt $bitmap.Width; $x++) {
      $pixel = $bitmap.GetPixel($x, $y)
      if ($pixel.A -gt 12) {
        if ($x -lt $minX) { $minX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }

  if ($maxX -lt 0) {
    return New-Object System.Drawing.Rectangle 0, 0, $bitmap.Width, $bitmap.Height
  }

  return New-Object System.Drawing.Rectangle $minX, $minY, ($maxX - $minX + 1), ($maxY - $minY + 1)
}

Get-ChildItem -Path $inPath -File | Where-Object { $_.Extension -match '^\.(png|jpg|jpeg)$' } | ForEach-Object {
  $source = $null
  $canvas = $null
  $graphics = $null
  try {
    $source = [System.Drawing.Bitmap]::FromFile($_.FullName)
    $bounds = Get-AlphaBounds $source
    $usable = $Size - ($Padding * 2)
    $scale = [Math]::Min($usable / $bounds.Width, $usable / $bounds.Height)
    $drawW = [int][Math]::Round($bounds.Width * $scale)
    $drawH = [int][Math]::Round($bounds.Height * $scale)
    $drawX = [int][Math]::Round(($Size - $drawW) / 2)
    $drawY = [int][Math]::Round(($Size - $drawH) / 2)

    $canvas = New-Object System.Drawing.Bitmap $Size, $Size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($canvas)
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $destRect = New-Object System.Drawing.Rectangle $drawX, $drawY, $drawW, $drawH
    $graphics.DrawImage($source, $destRect, $bounds, [System.Drawing.GraphicsUnit]::Pixel)

    $slug = Get-Slug $_.BaseName
    $target = Join-Path $outPath "$slug.png"
    $canvas.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "Wrote $target"
  } finally {
    if ($graphics) { $graphics.Dispose() }
    if ($canvas) { $canvas.Dispose() }
    if ($source) { $source.Dispose() }
  }
}
