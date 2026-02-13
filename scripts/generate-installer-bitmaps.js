/**
 * Generate high-quality NSIS installer bitmap images
 * - installerHeader.bmp: 150x57 (top banner on directory/install pages)
 * - installerSidebar.bmp: 164x314 (welcome/finish sidebar)
 * - uninstallerSidebar.bmp: 164x314
 */
const fs = require('fs')
const path = require('path')

function createBMP(width, height, pixelData) {
  const rowSize = Math.ceil((width * 3) / 4) * 4
  const pixelDataSize = rowSize * height
  const fileSize = 54 + pixelDataSize
  const buf = Buffer.alloc(fileSize)
  buf.write('BM', 0)
  buf.writeUInt32LE(fileSize, 2)
  buf.writeUInt32LE(0, 6)
  buf.writeUInt32LE(54, 10)
  buf.writeUInt32LE(40, 14)
  buf.writeInt32LE(width, 18)
  buf.writeInt32LE(height, 22)
  buf.writeUInt16LE(1, 26)
  buf.writeUInt16LE(24, 28)
  buf.writeUInt32LE(0, 30)
  buf.writeUInt32LE(pixelDataSize, 34)
  buf.writeInt32LE(2835, 38)
  buf.writeInt32LE(2835, 42)
  buf.writeUInt32LE(0, 46)
  buf.writeUInt32LE(0, 50)
  for (let y = height - 1; y >= 0; y--) {
    const rowOffset = 54 + (height - 1 - y) * rowSize
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 3
      const dstIdx = rowOffset + x * 3
      buf[dstIdx] = pixelData[srcIdx + 2]
      buf[dstIdx + 1] = pixelData[srcIdx + 1]
      buf[dstIdx + 2] = pixelData[srcIdx]
    }
  }
  return buf
}

function lerp(a, b, t) { return Math.round(a + (b - a) * t) }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

function lerpColor(c1, c2, t) {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)]
}

function setPixel(data, w, h, x, y, color, alpha = 1) {
  x = Math.round(x); y = Math.round(y)
  if (x < 0 || x >= w || y < 0 || y >= h) return
  const idx = (y * w + x) * 3
  data[idx] = lerp(data[idx], color[0], alpha)
  data[idx + 1] = lerp(data[idx + 1], color[1], alpha)
  data[idx + 2] = lerp(data[idx + 2], color[2], alpha)
}

function fillRect(data, w, h, x0, y0, rw, rh, color, alpha = 1) {
  for (let y = y0; y < y0 + rh; y++)
    for (let x = x0; x < x0 + rw; x++)
      setPixel(data, w, h, x, y, color, alpha)
}

function drawCircleAA(data, w, h, cx, cy, radius, color, alpha = 1) {
  const r2 = (radius + 1) * (radius + 1)
  for (let dy = -radius - 1; dy <= radius + 1; dy++) {
    for (let dx = -radius - 1; dx <= radius + 1; dx++) {
      if (dx * dx + dy * dy > r2) continue
      const dist = Math.sqrt(dx * dx + dy * dy)
      const aa = clamp(radius - dist + 0.8, 0, 1) * alpha
      if (aa > 0) setPixel(data, w, h, cx + dx, cy + dy, color, aa)
    }
  }
}

function drawRoundedRect(data, w, h, x0, y0, rw, rh, radius, color, alpha = 1) {
  for (let y = y0; y < y0 + rh; y++) {
    for (let x = x0; x < x0 + rw; x++) {
      let inside = true
      const corners = [
        [x0 + radius, y0 + radius],
        [x0 + rw - radius - 1, y0 + radius],
        [x0 + radius, y0 + rh - radius - 1],
        [x0 + rw - radius - 1, y0 + rh - radius - 1]
      ]
      if (x < x0 + radius && y < y0 + radius) {
        const d = Math.sqrt((x - corners[0][0]) ** 2 + (y - corners[0][1]) ** 2)
        if (d > radius) inside = false
      } else if (x > x0 + rw - radius - 1 && y < y0 + radius) {
        const d = Math.sqrt((x - corners[1][0]) ** 2 + (y - corners[1][1]) ** 2)
        if (d > radius) inside = false
      } else if (x < x0 + radius && y > y0 + rh - radius - 1) {
        const d = Math.sqrt((x - corners[2][0]) ** 2 + (y - corners[2][1]) ** 2)
        if (d > radius) inside = false
      } else if (x > x0 + rw - radius - 1 && y > y0 + rh - radius - 1) {
        const d = Math.sqrt((x - corners[3][0]) ** 2 + (y - corners[3][1]) ** 2)
        if (d > radius) inside = false
      }
      if (inside) setPixel(data, w, h, x, y, color, alpha)
    }
  }
}

// Gradient fill for entire image
function fillGradient(data, w, h, topColor, bottomColor, angle = 0) {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let t
      if (angle === 0) {
        t = y / (h - 1)
      } else {
        // Diagonal gradient
        t = (x / w * 0.3 + y / h * 0.7)
      }
      const idx = (y * w + x) * 3
      data[idx] = lerp(topColor[0], bottomColor[0], t)
      data[idx + 1] = lerp(topColor[1], bottomColor[1], t)
      data[idx + 2] = lerp(topColor[2], bottomColor[2], t)
    }
  }
}

// Draw a graduation cap icon
function drawGradCapIcon(data, w, h, cx, cy, size, color) {
  // Cap top (diamond)
  for (let dy = -Math.floor(size * 0.4); dy <= Math.floor(size * 0.4); dy++) {
    const progress = 1 - Math.abs(dy) / (size * 0.4)
    const halfW = Math.floor(size * progress)
    for (let dx = -halfW; dx <= halfW; dx++) {
      setPixel(data, w, h, cx + dx, cy + dy - Math.floor(size * 0.15), color)
    }
  }
  // Tassel line
  for (let dy = 0; dy < size * 0.6; dy++) {
    setPixel(data, w, h, cx + size, cy - Math.floor(size * 0.15) + dy, color)
    if (dy > size * 0.4) {
      setPixel(data, w, h, cx + size - 1, cy - Math.floor(size * 0.15) + dy, color)
      setPixel(data, w, h, cx + size + 1, cy - Math.floor(size * 0.15) + dy, color)
    }
  }
  // Tassel ball
  drawCircleAA(data, w, h, cx + size, cy + Math.floor(size * 0.45), Math.floor(size * 0.15), color)
}

// Draw decorative dots pattern
function drawDotPattern(data, w, h, color, alpha, spacing, radius) {
  for (let y = spacing; y < h; y += spacing) {
    for (let x = spacing; x < w; x += spacing) {
      drawCircleAA(data, w, h, x, y, radius, color, alpha)
    }
  }
}

const buildDir = path.join(__dirname, '..', 'build')

// Color palette
const PRIMARY = [79, 70, 229]       // indigo-600
const PRIMARY_LIGHT = [129, 140, 248] // indigo-400
const PRIMARY_DARK = [55, 48, 163]   // indigo-800
const ACCENT = [168, 85, 247]        // purple-500
const WHITE = [255, 255, 255]
const WHITE_90 = [245, 245, 255]

// ============ HEADER: 150x57 ============
function generateHeader() {
  const w = 150, h = 57
  const data = Buffer.alloc(w * h * 3)

  // Gradient background: white to very light indigo
  fillGradient(data, w, h, [252, 252, 255], [240, 238, 255], 1)

  // Subtle dot pattern
  drawDotPattern(data, w, h, PRIMARY_LIGHT, 0.06, 12, 1)

  // Left accent bar
  for (let y = 8; y < h - 8; y++) {
    const t = (y - 8) / (h - 16)
    const c = lerpColor(PRIMARY, ACCENT, t)
    for (let x = 0; x < 3; x++) {
      setPixel(data, w, h, x, y, c)
    }
  }

  // Icon circle
  drawCircleAA(data, w, h, 22, 28, 14, PRIMARY, 0.12)
  drawCircleAA(data, w, h, 22, 28, 11, PRIMARY, 0.2)
  drawGradCapIcon(data, w, h, 22, 28, 7, PRIMARY)

  // Decorative line
  for (let x = 42; x < 140; x++) {
    const t = (x - 42) / 98
    const a = Math.sin(t * Math.PI) * 0.15
    setPixel(data, w, h, x, h - 6, PRIMARY_LIGHT, a)
    setPixel(data, w, h, x, h - 5, PRIMARY, a * 0.7)
  }

  // Small accent circles
  drawCircleAA(data, w, h, 135, 15, 4, ACCENT, 0.08)
  drawCircleAA(data, w, h, 120, 42, 3, PRIMARY_LIGHT, 0.1)

  const bmp = createBMP(w, h, data)
  fs.writeFileSync(path.join(buildDir, 'installerHeader.bmp'), bmp)
  console.log('Generated installerHeader.bmp (150x57)')
}

// ============ SIDEBAR: 164x314 ============
function generateSidebar(filename) {
  const w = 164, h = 314
  const data = Buffer.alloc(w * h * 3)

  // Rich gradient background
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ty = y / (h - 1)
      const tx = x / (w - 1)
      const t = ty * 0.8 + tx * 0.2
      const c = lerpColor(
        lerpColor(PRIMARY, PRIMARY_DARK, t),
        lerpColor(ACCENT, PRIMARY_DARK, t),
        tx * 0.4
      )
      const idx = (y * w + x) * 3
      data[idx] = c[0]; data[idx + 1] = c[1]; data[idx + 2] = c[2]
    }
  }

  // Subtle dot grid
  drawDotPattern(data, w, h, WHITE, 0.04, 20, 1)

  // Large decorative circles (background)
  drawCircleAA(data, w, h, -10, 40, 60, WHITE, 0.04)
  drawCircleAA(data, w, h, 180, 180, 80, WHITE, 0.03)
  drawCircleAA(data, w, h, 30, 280, 50, WHITE, 0.04)

  // Ring decorations
  for (let a = 0; a < Math.PI * 2; a += 0.02) {
    const rx = 82 + Math.cos(a) * 52
    const ry = 110 + Math.sin(a) * 52
    setPixel(data, w, h, Math.round(rx), Math.round(ry), WHITE, 0.08)
  }
  for (let a = 0; a < Math.PI * 2; a += 0.03) {
    const rx = 82 + Math.cos(a) * 58
    const ry = 110 + Math.sin(a) * 58
    setPixel(data, w, h, Math.round(rx), Math.round(ry), WHITE, 0.04)
  }

  // Main icon: white circle with gradient cap
  drawCircleAA(data, w, h, 82, 110, 38, WHITE, 0.15)
  drawCircleAA(data, w, h, 82, 110, 32, WHITE, 0.9)
  drawGradCapIcon(data, w, h, 82, 110, 14, PRIMARY)

  // App name area - "Stellarc" rendered as decorative bar
  drawRoundedRect(data, w, h, 32, 162, 100, 3, 1, WHITE, 0.5)

  // Tagline area - thin line
  drawRoundedRect(data, w, h, 47, 175, 70, 2, 1, WHITE, 0.25)

  // Feature dots with lines
  const features = [200, 220, 240, 260]
  features.forEach((fy, i) => {
    // Dot
    drawCircleAA(data, w, h, 35, fy, 3, WHITE, 0.6)
    // Line
    const lineW = [80, 65, 72, 55][i]
    drawRoundedRect(data, w, h, 45, fy - 1, lineW, 2, 1, WHITE, 0.2)
  })

  // Bottom accent line
  for (let x = 20; x < w - 20; x++) {
    const t = (x - 20) / (w - 40)
    const a = Math.sin(t * Math.PI) * 0.4
    setPixel(data, w, h, x, h - 16, WHITE, a)
  }

  // Corner accents
  drawCircleAA(data, w, h, 15, 15, 6, WHITE, 0.06)
  drawCircleAA(data, w, h, w - 15, h - 15, 6, WHITE, 0.06)

  const bmp = createBMP(w, h, data)
  fs.writeFileSync(path.join(buildDir, filename), bmp)
  console.log(`Generated ${filename} (${w}x${h})`)
}

generateHeader()
generateSidebar('installerSidebar.bmp')
generateSidebar('uninstallerSidebar.bmp')
console.log('All installer bitmaps generated!')
