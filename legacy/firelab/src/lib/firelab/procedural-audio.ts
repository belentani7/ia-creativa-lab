// BELENTANI FIRELAB — procedural music synthesis (server only)
// Deterministic, dependency-free audio rendering. This is REAL synthesis
// (oscillators, envelopes, drums, delay, limiter) driven by rules parsed from
// the prompt — it is NOT a neural model and is labeled as such everywhere it
// surfaces in the UI ("procedural synthesis — rule-based, not a neural model").
//
// Contract: synthesizeMusicWav(prompt, durationSec, seed) → 44.1 kHz stereo
// 16-bit WAV buffer + composition metadata (key / mode / tempo).

const SAMPLE_RATE = 44100

// ---------- deterministic randomness ----------

export function hashString(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---------- music theory ----------

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

/** Chord: semitone offset from the key root + triad intervals. */
interface Chord {
  offset: number
  intervals: number[]
}

const PROGRESSIONS: Record<string, { label: string; chords: Chord[] }> = {
  minor: {
    label: 'i–VI–III–VII',
    chords: [
      { offset: 0, intervals: [0, 3, 7] }, // i
      { offset: 8, intervals: [0, 4, 7] }, // VI
      { offset: 3, intervals: [0, 4, 7] }, // III
      { offset: 10, intervals: [0, 4, 7] }, // VII
    ],
  },
  major: {
    label: 'I–V–vi–IV',
    chords: [
      { offset: 0, intervals: [0, 4, 7] }, // I
      { offset: 7, intervals: [0, 4, 7] }, // V
      { offset: 9, intervals: [0, 3, 7] }, // vi
      { offset: 5, intervals: [0, 4, 7] }, // IV
    ],
  },
}

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

/** Pick scale, tempo and key root from prompt keywords + hash. */
function composePlan(prompt: string, rng: () => number) {
  const p = prompt.toLowerCase()
  const dark = /dark|sad|epic|moody|noir|melanchol|tense|ominous|brooding/.test(p)
  const dorian = /mystic|dream|hypnot|psychedel|mystical/.test(p)
  const fast = /fast|upbeat|energetic|driving|intense|drum.?n.?bass|riding/.test(p)
  const slow = /chill|slow|ambient|calm|drone|glacial|sparse/.test(p)

  const mode: 'minor' | 'major' | 'dorian' = dorian ? 'dorian' : dark ? 'minor' : 'major'
  // dorian borrows the minor progression color but with a raised 6th arpeggio pool
  const progression = mode === 'major' ? PROGRESSIONS.major : PROGRESSIONS.minor

  const tempo = fast
    ? 118 + Math.floor(rng() * 22) // 118–140
    : slow
      ? 70 + Math.floor(rng() * 12) // 70–82
      : 90 + Math.floor(rng() * 20) // 90–110

  const rootPc = Math.floor(rng() * 12) // key root pitch class
  const rootMidi = 48 + rootPc // C3..B3

  const arpDiv = fast ? 4 : slow ? 2 : rng() > 0.5 ? 4 : 2 // notes per beat (16th vs 8th)
  const swing = /swing|shuffle|jazzy/.test(p)

  return {
    key: `${NOTE_NAMES[rootPc]} ${mode === 'dorian' ? 'dorian' : mode}`,
    mode,
    tempo,
    rootMidi,
    progression,
    arpDiv,
    swing,
  }
}

// ---------- tiny DSP helpers ----------

/** Simple one-pole lowpass (used for noise shaping). */
function lowpassSignal(x: Float32Array, alpha: number): Float32Array {
  const out = new Float32Array(x.length)
  let y = 0
  for (let i = 0; i < x.length; i++) {
    y += alpha * (x[i] - y)
    out[i] = y
  }
  return out
}

/** Write a mono event into the stereo mix with constant-power pan (0=L, 1=R). */
function addNote(
  left: Float32Array,
  right: Float32Array,
  startSample: number,
  lengthSamples: number,
  pan: number,
  amplitude: number,
  render: (t: number) => number
): void {
  const s = Math.max(0, startSample)
  const end = Math.min(left.length, startSample + lengthSamples)
  const gl = Math.cos(pan * Math.PI * 0.5)
  const gr = Math.sin(pan * Math.PI * 0.5)
  for (let i = s; i < end; i++) {
    const v = render(i - startSample) * amplitude
    left[i] += v * gl
    right[i] += v * gr
  }
}

/** Perlin-free value noise burst helper. */
function noiseVoice(
  left: Float32Array,
  right: Float32Array,
  startSample: number,
  lengthSamples: number,
  pan: number,
  amplitude: number,
  rng: () => number,
  decayTau: number
): void {
  const raw = new Float32Array(lengthSamples)
  for (let i = 0; i < lengthSamples; i++) raw[i] = rng() * 2 - 1
  // crude bandpass: raw minus its lowpassed self
  const lp = lowpassSignal(raw, 0.18)
  const band = new Float32Array(lengthSamples)
  for (let i = 0; i < lengthSamples; i++) band[i] = raw[i] - lp[i]
  addNote(left, right, startSample, lengthSamples, pan, amplitude, (t) => {
    const env = Math.exp(-t / decayTau)
    return band[t] * env
  })
}

/** Canonical 44-byte WAV (PCM16 stereo) writer. */
export function pcmToWav(left: Float32Array, right: Float32Array, sampleRate: number): Buffer {
  const frames = left.length
  const dataBytes = frames * 4 // 2 channels * 2 bytes
  const buffer = Buffer.alloc(44 + dataBytes)
  buffer.write('RIFF', 0, 'ascii')
  buffer.writeUInt32LE(36 + dataBytes, 4)
  buffer.write('WAVE', 8, 'ascii')
  buffer.write('fmt ', 12, 'ascii')
  buffer.writeUInt32LE(16, 16) // PCM chunk size
  buffer.writeUInt16LE(1, 20) // PCM format
  buffer.writeUInt16LE(2, 22) // channels
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * 4, 28) // byte rate
  buffer.writeUInt16LE(4, 32) // block align
  buffer.writeUInt16LE(16, 34) // bits per sample
  buffer.write('data', 36, 'ascii')
  buffer.writeUInt32LE(dataBytes, 40)
  let o = 44
  for (let i = 0; i < frames; i++) {
    const l = Math.max(-1, Math.min(1, left[i]))
    const r = Math.max(-1, Math.min(1, right[i]))
    buffer.writeInt16LE(Math.round(l * 32767), o)
    buffer.writeInt16LE(Math.round(r * 32767), o + 2)
    o += 4
  }
  return buffer
}

// ---------- the composer ----------

export interface MusicSynthResult {
  buffer: Buffer
  meta: { key: string; mode: string; tempo: number }
}

export function synthesizeMusicWav(prompt: string, durationSec: number, seed?: number): MusicSynthResult {
  const rng = mulberry32((hashString(prompt) + (seed ?? 0)) >>> 0)
  const plan = composePlan(prompt, rng)

  const totalFrames = Math.max(1, Math.round(durationSec * SAMPLE_RATE))
  const left = new Float32Array(totalFrames)
  const right = new Float32Array(totalFrames)
  const leadBus = new Float32Array(totalFrames) // delay is applied to lead only

  const beatSec = 60 / plan.tempo
  const barSec = beatSec * 4
  const chordSec = barSec * 2 // 2-bar changes
  const chordCount = Math.ceil(durationSec / chordSec)

  for (let ci = 0; ci < chordCount; ci++) {
    const chord = plan.progression.chords[ci % plan.progression.chords.length]
    const chordStart = ci * chordSec
    const chordFrames = Math.min(totalFrames, Math.round((chordStart + chordSec) * SAMPLE_RATE))
    const startSample = Math.round(chordStart * SAMPLE_RATE)

    // ---- 1. pad: sustained chord, sine + detuned sine, slow ADSR ----
    for (let ni = 0; ni < chord.intervals.length; ni++) {
      const midi = plan.rootMidi + chord.offset + chord.intervals[ni]
      const f = midiToFreq(midi)
      const fDet = f * 1.003 // slight detune for width
      const attack = Math.min(0.9, chordSec * 0.18)
      const release = Math.min(1.4, chordSec * 0.3)
      const pan = ni === 0 ? 0.42 : ni === 1 ? 0.5 : 0.58
      const length = chordFrames - startSample
      if (length <= 0) continue
      addNote(left, right, startSample, length, pan, 0.16, (t) => {
        const ts = t / SAMPLE_RATE
        // ADSR: slow attack into sustain, release near the end
        const a = Math.min(1, ts / attack)
        const rel = Math.max(0, Math.min(1, (ts - (length / SAMPLE_RATE - release)) / release))
        const env = a * (ts > length / SAMPLE_RATE - release ? rel : 1)
        return (Math.sin(2 * Math.PI * f * ts) + 0.55 * Math.sin(2 * Math.PI * fDet * ts)) * env
      })
    }

    // ---- 2. bass: chord root, one octave down, triangle-ish ----
    const bassMidi = plan.rootMidi + chord.offset - 12
    const bassF = midiToFreq(bassMidi)
    const beatsInChord = Math.floor(chordSec / beatSec)
    for (let b = 0; b < beatsInChord; b++) {
      // one note per beat, slightly longer envelope on beat 0
      const noteStart = chordStart + b * beatSec
      if (noteStart >= durationSec) break
      const noteLen = b % 4 === 0 ? beatSec * 1.6 : beatSec * 0.85
      const startSample2 = Math.round(noteStart * SAMPLE_RATE)
      const len2 = Math.round(noteLen * SAMPLE_RATE)
      addNote(left, right, startSample2, len2, 0.5, b % 4 === 0 ? 0.3 : 0.22, (t) => {
        const ts = t / SAMPLE_RATE
        const env = Math.min(1, ts / 0.006) * Math.exp(-ts / (noteLen * 0.5))
        // triangle-ish: fundamental + a touch of 3rd harmonic
        return (Math.sin(2 * Math.PI * bassF * ts) + 0.09 * Math.sin(6 * Math.PI * bassF * ts)) * env
      })
    }

    // ---- 3. arpeggio lead: 8th/16th pattern over chord tones ----
    const arpNotes = [...chord.intervals, chord.intervals[0] + 12, chord.intervals[1] + 12]
    const arpStep = beatSec / plan.arpDiv
    const steps = Math.floor(chordSec / arpStep)
    for (let s = 0; s < steps; s++) {
      if (rng() < 0.12) continue // rests keep it musical
      const noteStart = chordStart + s * arpStep + (plan.swing && s % 2 === 1 ? arpStep * 0.18 : 0)
      if (noteStart >= durationSec) break
      const midi = plan.rootMidi + 12 + chord.offset + arpNotes[Math.floor(rng() * arpNotes.length)]
      const f = midiToFreq(midi)
      const velocity = 0.7 + rng() * 0.3
      const noteLen = arpStep * 1.15
      const startSample3 = Math.round(noteStart * SAMPLE_RATE)
      const len3 = Math.round(noteLen * SAMPLE_RATE)
      const noteStartSample = startSample3
      const lenFinal = Math.min(len3, totalFrames - noteStartSample)
      if (lenFinal <= 0) continue
      addNote(leadBus, leadBus, startSample3, len3, 0.5, 0.13 * velocity, (t) => {
        const ts = t / SAMPLE_RATE
        const env = Math.min(1, ts / 0.004) * Math.exp(-ts / (noteLen * 0.4))
        // square-ish with limited harmonics (band-limited-ish)
        const ph = 2 * Math.PI * f * ts
        return (Math.sin(ph) + Math.sin(3 * ph) / 6 + Math.sin(5 * ph) / 25) * env
      })
    }

    // ---- 4. drums ----
    const beats = Math.floor(chordSec / beatSec)
    for (let b = 0; b < beats; b++) {
      const noteStart = chordStart + b * beatSec
      if (noteStart >= durationSec) break
      const bStart = Math.round(noteStart * SAMPLE_RATE)

      // kick — pitch-swept sine 120→40 Hz over ~80 ms, on beats 0 & 2
      if (b % 2 === 0) {
        const lenK = Math.round(0.11 * SAMPLE_RATE)
        const lenK2 = Math.min(lenK, totalFrames - bStart)
        if (lenK2 > 0) {
          addNote(left, right, bStart, lenK, 0.5, 0.55, (t) => {
            const ts = t / SAMPLE_RATE
            // phase integral of a 120→40 Hz exponential sweep (τ = 30 ms)
            const phase = 2 * Math.PI * (40 * ts + (120 - 40) * 0.03 * (1 - Math.exp(-ts / 0.03)))
            const env = Math.exp(-ts / 0.045)
            return Math.sin(phase) * env
          })
        }
      }

      // snare — bandpassed noise burst on beats 2 & 4 (backbeat)
      if (b % 4 === 1 || b % 4 === 3) {
        const lenS = Math.round(0.16 * SAMPLE_RATE)
        const lenS2 = Math.min(lenS, totalFrames - bStart)
        if (lenS2 > 0) noiseVoice(left, right, bStart, lenS2, 0.5, 0.24, rng, 0.06)
      }

      // hats — short bright noise every 8th with random skips
      const eighth = beatSec / 2
      const eighths = Math.floor(beatSec / eighth)
      for (let e = 0; e < eighths; e++) {
        if (rng() < 0.28) continue
        const hStart = bStart + Math.round(e * eighth * SAMPLE_RATE)
        const lenH = Math.round(0.05 * SAMPLE_RATE)
        const lenH2 = Math.min(lenH, totalFrames - hStart)
        if (lenH2 <= 0) continue
        // bright: highpass-ish (raw - lowpass with fast alpha)
        const raw = new Float32Array(lenH2)
        for (let i = 0; i < lenH2; i++) raw[i] = rng() * 2 - 1
        const lp = lowpassSignal(raw, 0.6)
        const bright = new Float32Array(lenH2)
        for (let i = 0; i < lenH2; i++) bright[i] = raw[i] - lp[i]
        const panH = e % 2 === 0 ? 0.47 : 0.53
        addNote(left, right, hStart, lenH2, panH, 0.1, (t) => {
          const env = Math.exp(-t / 0.012)
          return bright[t] * env
        })
      }
    }
  }

  // ---- 5. global: feedback delay on the lead bus (~280 ms, 0.25) ----
  const delaySamples = Math.round(0.28 * SAMPLE_RATE)
  const leadOut = new Float32Array(totalFrames)
  for (let i = 0; i < totalFrames; i++) {
    leadOut[i] = leadBus[i] + (i >= delaySamples ? 0.25 * leadOut[i - delaySamples] : 0)
  }
  for (let i = 0; i < totalFrames; i++) {
    const v = leadOut[i]
    const gl = Math.cos(0.58 * Math.PI * 0.5) // lead slightly right
    const gr = Math.sin(0.58 * Math.PI * 0.5)
    left[i] += v * gl
    right[i] += v * gr
  }

  // ---- soft-clip limiter (tanh) + peak normalize to −1 dBFS ----
  for (let i = 0; i < totalFrames; i++) {
    left[i] = Math.tanh(left[i] * 1.15)
    right[i] = Math.tanh(right[i] * 1.15)
  }
  let peak = 0
  for (let i = 0; i < totalFrames; i++) {
    peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]))
  }
  const target = Math.pow(10, -1 / 20) // −1 dBFS
  if (peak > 0) {
    const gain = target / peak
    for (let i = 0; i < totalFrames; i++) {
      left[i] *= gain
      right[i] *= gain
    }
  }

  const buffer = pcmToWav(left, right, SAMPLE_RATE)
  return {
    buffer,
    meta: { key: plan.key, mode: plan.mode, tempo: plan.tempo },
  }
}
