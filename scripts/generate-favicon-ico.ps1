$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$publicDir = Join-Path $PSScriptRoot '..\public'
$outputPath = Join-Path $publicDir 'favicon.ico'
$sizes = @(16, 32, 48, 64)

function New-IconBitmap {
  param([int]$Size)

  $bmp = New-Object System.Drawing.Bitmap $Size, $Size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)

  $pad = [Math]::Round($Size * 0.03, 2)
  $corner = [Math]::Round($Size * 0.22, 2)
  $bgRect = [System.Drawing.RectangleF]::new($pad, $pad, ($Size - ($pad * 2)), ($Size - ($pad * 2)))
  $bgPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $corner * 2
  $bgPath.AddArc($bgRect.X, $bgRect.Y, $diameter, $diameter, 180, 90)
  $bgPath.AddArc($bgRect.Right - $diameter, $bgRect.Y, $diameter, $diameter, 270, 90)
  $bgPath.AddArc($bgRect.Right - $diameter, $bgRect.Bottom - $diameter, $diameter, $diameter, 0, 90)
  $bgPath.AddArc($bgRect.X, $bgRect.Bottom - $diameter, $diameter, $diameter, 90, 90)
  $bgPath.CloseFigure()

  $bgBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#FAFAF5'))
  $g.FillPath($bgBrush, $bgPath)
  $borderPen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml('#E2E6E8'), [Math]::Max(1, $Size * 0.046))
  $g.DrawPath($borderPen, $bgPath)

  $circleBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#1E6A72'))
  $circleSize = $Size * 0.63
  $circleX = ($Size - $circleSize) / 2
  $circleY = ($Size - $circleSize) / 2
  $g.FillEllipse($circleBrush, $circleX, $circleY, $circleSize, $circleSize)

  $arrowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $pts = @(
    ([System.Drawing.PointF]::new(($Size * 0.33), ($Size * 0.63))),
    ([System.Drawing.PointF]::new(($Size * 0.33), ($Size * 0.53))),
    ([System.Drawing.PointF]::new(($Size * 0.46), ($Size * 0.40))),
    ([System.Drawing.PointF]::new(($Size * 0.38), ($Size * 0.40))),
    ([System.Drawing.PointF]::new(($Size * 0.44), ($Size * 0.34))),
    ([System.Drawing.PointF]::new(($Size * 0.66), ($Size * 0.34))),
    ([System.Drawing.PointF]::new(($Size * 0.62), ($Size * 0.56))),
    ([System.Drawing.PointF]::new(($Size * 0.56), ($Size * 0.62))),
    ([System.Drawing.PointF]::new(($Size * 0.56), ($Size * 0.53))),
    ([System.Drawing.PointF]::new(($Size * 0.43), ($Size * 0.66))),
    ([System.Drawing.PointF]::new(($Size * 0.51), ($Size * 0.66))),
    ([System.Drawing.PointF]::new(($Size * 0.46), ($Size * 0.71))),
    ([System.Drawing.PointF]::new(($Size * 0.33), ($Size * 0.71)))
  )
  $arrowPath.AddPolygon($pts)
  $arrowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
  $g.FillPath($arrowBrush, $arrowPath)

  $arrowBrush.Dispose()
  $circleBrush.Dispose()
  $borderPen.Dispose()
  $bgBrush.Dispose()
  $bgPath.Dispose()
  $arrowPath.Dispose()
  $g.Dispose()

  return $bmp
}

$images = @()
foreach ($size in $sizes) {
  $bitmap = New-IconBitmap -Size $size
  $stream = New-Object System.IO.MemoryStream
  $bitmap.Save($stream, [System.Drawing.Imaging.ImageFormat]::Png)
  $images += [PSCustomObject]@{
    Size = $size
    Data = $stream.ToArray()
  }
  $stream.Dispose()
  $bitmap.Dispose()
}

$fileStream = [System.IO.File]::Create($outputPath)
$writer = New-Object System.IO.BinaryWriter($fileStream)

$writer.Write([UInt16]0)
$writer.Write([UInt16]1)
$writer.Write([UInt16]$images.Count)

$offset = 6 + (16 * $images.Count)
foreach ($image in $images) {
  $dimension = if ($image.Size -ge 256) { 0 } else { $image.Size }
  $writer.Write([Byte]$dimension)
  $writer.Write([Byte]$dimension)
  $writer.Write([Byte]0)
  $writer.Write([Byte]0)
  $writer.Write([UInt16]1)
  $writer.Write([UInt16]32)
  $writer.Write([UInt32]$image.Data.Length)
  $writer.Write([UInt32]$offset)
  $offset += $image.Data.Length
}

foreach ($image in $images) {
  $writer.Write($image.Data)
}

$writer.Flush()
$writer.Dispose()
$fileStream.Dispose()

Write-Output "Generated $outputPath"
