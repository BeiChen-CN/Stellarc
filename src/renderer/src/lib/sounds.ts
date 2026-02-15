type SoundIntensity = 'low' | 'medium' | 'high'

const audioCtx = () => {
  if (!_ctx) _ctx = new AudioContext()
  return _ctx
}
export { audioCtx }
let _ctx: AudioContext | null = null
let _soundScale = 1

export function setSoundIntensity(intensity: SoundIntensity) {
  _soundScale = intensity === 'low' ? 0.55 : intensity === 'high' ? 1.2 : 1
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  const ctx = audioCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime)
  gain.gain.setValueAtTime(Math.min(0.22, volume * _soundScale), ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + duration)
}

/** Short click sound for spinning slots */
export function playTick() {
  playTone(800, 0.04, 'square', 0.06)
}

/** Slower tick for deceleration phase */
export function playSlowTick() {
  playTone(600, 0.06, 'square', 0.08)
}

/** Celebratory reveal sound — ascending arpeggio */
export function playReveal() {
  const ctx = audioCtx()
  const now = ctx.currentTime
  const notes = [523, 659, 784, 1047] // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now + i * 0.1)
    gain.gain.setValueAtTime(Math.min(0.22, 0.12 * _soundScale), now + i * 0.1)
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now + i * 0.1)
    osc.stop(now + i * 0.1 + 0.3)
  })
}

/** Typewriter key — short noise pulse with bandpass filter, simulating a keypress click (15ms) */
export function playTypewriterKey() {
  const ctx = audioCtx()
  const now = ctx.currentTime
  const bufferSize = Math.floor(ctx.sampleRate * 0.015)
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3))
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(3000, now)
  filter.Q.setValueAtTime(2, now)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(Math.min(0.2, 0.12 * _soundScale), now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015)
  source.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  source.start(now)
}

/** Bounce tick — sine wave 200Hz→80Hz fast sweep, simulating a bounce collision (80ms) */
export function playBounceTick() {
  const ctx = audioCtx()
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(200, now)
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.08)
  gain.gain.setValueAtTime(Math.min(0.2, 0.1 * _soundScale), now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.08)
}

/** Wheel tick — mechanical click as pointer passes a segment */
export function playWheelTick() {
  const ctx = audioCtx()
  const now = ctx.currentTime
  const bufferSize = ctx.sampleRate * 0.02
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15))
  }
  const source = ctx.createBufferSource()
  source.buffer = buffer
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(Math.min(0.2, 0.1 * _soundScale), now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02)
  const filter = ctx.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.setValueAtTime(2000, now)
  source.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  source.start(now)
}
