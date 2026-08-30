Add-Type @"
using System;
using System.Runtime.InteropServices;
public class W2 {
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  public struct RECT { public int Left, Top, Right, Bottom; }
}
"@
[W2]::SetProcessDPIAware() | Out-Null
Add-Type -AssemblyName System.Drawing
$proc = Get-Process electron -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if (-not $proc) { Write-Host "NO-WINDOW"; exit 1 }
$rect = New-Object W2+RECT
[W2]::GetWindowRect($proc.MainWindowHandle, [ref]$rect) | Out-Null
$margin = 70
$x = $rect.Left - $margin; $y = $rect.Top - $margin
$w = ($rect.Right - $rect.Left) + 2 * $margin
$h = ($rect.Bottom - $rect.Top) + 2 * $margin
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($x, $y, 0, 0, $bmp.Size)
$g.Dispose()
$bmp.Save("C:\Stellarc\test-results\ball-now.png")
$bmp.Dispose()
Write-Host ("SAVED rect=" + $rect.Left + "," + $rect.Top + " size=" + ($rect.Right-$rect.Left) + "x" + ($rect.Bottom-$rect.Top))
