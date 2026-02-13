import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  w: number
  h: number
  color: string
  rotation: number
  rotationSpeed: number
  gravity: number
  wobble: number
  wobbleSpeed: number
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--tertiary))',
  '#FFD700',
  '#FF6B6B',
  '#4ECDC4',
  '#A78BFA',
  '#FB923C',
  '#34D399'
]

export function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!active) {
      particlesRef.current = []
      return
    }
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvas.offsetWidth * window.devicePixelRatio
    canvas.height = canvas.offsetHeight * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const w = canvas.offsetWidth
    const h = canvas.offsetHeight

    // Spawn particles from top area, spread wider
    const particles: Particle[] = []
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: w * 0.1 + Math.random() * w * 0.8,
        y: -10 - Math.random() * 60,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 1.5 + 0.5,
        w: Math.random() * 10 + 5,
        h: Math.random() * 6 + 3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.15,
        gravity: 0.03 + Math.random() * 0.03,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.03 + Math.random() * 0.03
      })
    }
    particlesRef.current = particles

    const duration = 6000
    const startTime = performance.now()
    let lastTime = startTime

    const animate = (now: number) => {
      const elapsed = now - startTime
      if (elapsed > duration) {
        ctx.clearRect(0, 0, w, h)
        return
      }

      const dt = (now - lastTime) / 16.667 // normalize to ~60fps step
      lastTime = now

      ctx.clearRect(0, 0, w, h)
      for (const p of particles) {
        p.vy += p.gravity * dt
        p.wobble += p.wobbleSpeed * dt
        p.x += (p.vx + Math.sin(p.wobble) * 0.5) * dt
        p.y += p.vy * dt
        p.vx *= Math.pow(0.995, dt)
        p.rotation += p.rotationSpeed * dt

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.fillStyle = p.color
        const progress = elapsed / duration
        ctx.globalAlpha = progress < 0.7 ? 1 : Math.max(0, 1 - (progress - 0.7) / 0.3)
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  }, [active])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-50"
      style={{ width: '100%', height: '100%' }}
    />
  )
}
