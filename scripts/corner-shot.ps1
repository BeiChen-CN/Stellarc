Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WC {
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  public struct RECT { public int Left, Top, Right, Bottom; }
}
"@
[WC]::SetProcessDPIAware() | Out-Null
Add-Type -AssemblyName System.Drawing
$proc = Get-Process electron -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if (-not $proc) { Write-Host "NO-WINDOW"; exit 1 }
$rect = New-Object WC+RECT
[WC]::GetWindowRect($proc.MainWindowHandle, [ref]$rect) | Out-Null
$margin = 30
$x = $rect.Left - $margin; $y = $rect.Top - $margin
$w = ($rect.Right - $rect.Left) + 2 * $margin
$h = 160
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($x, $y, 0, 0, $bmp.Size)
$g.Dispose()
$bmp.Save("C:\Stellarc\test-results\corner-top.png")
$bmp.Dispose()
# 左上角放大
$bmp2 = New-Object System.Drawing.Bitmap(120, 120)
$g2 = [System.Drawing.Graphics]::FromImage($bmp2)
$g2.CopyFromScreen($rect.Left, $rect.Top, 0, 0, $bmp2.Size)
$g2.Dispose()
$big = New-Object System.Drawing.Bitmap($bmp2, 360, 360)
$big.Save("C:\Stellarc\test-results\corner-zoom.png")
$big.Dispose(); $bmp2.Dispose()
Write-Host "SAVED"
