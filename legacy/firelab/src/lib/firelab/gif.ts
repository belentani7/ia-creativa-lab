// BELENTANI FIRELAB — dependency-free animated GIF89a encoder (server only)
// Fixed 6×7×6 = 252-color RGB palette, LZW compression with variable-width
// codes and clear-code resets, 60 ms-class frame delays, infinite loop
// extension. Written for the DEMO engine's procedural "video" output —
// honest placeholder motion, clearly labeled, never presented as AI video.
//
// GIF89a spec: https://www.w3.org/Graphics/GIF/spec-gif89a.txt

export interface GifFrame {
  width: number
  height: number
  rgba: Uint8ClampedArray // RGBA, 4 bytes per pixel
}

const MIN_CODE_SIZE = 8 // 256-color palette
const CLEAR_CODE = 256
const EOI_CODE = 257
const FIRST_FREE_CODE = 258
const MAX_CODE = 4095

// ---------- 6×7×6 fixed palette ----------

/** Quantize one pixel to a palette index. */
function paletteIndex(r: number, g: number, b: number): number {
  const r6 = Math.min(5, Math.round((r / 255) * 5))
  const g7 = Math.min(6, Math.round((g / 255) * 6))
  const b6 = Math.min(5, Math.round((b / 255) * 5))
  return (r6 * 7 + g7) * 6 + b6
}

/** The 256-entry global color table bytes (252 used + 4 black padding). */
function globalColorTable(): Buffer {
  const table = Buffer.alloc(256 * 3, 0)
  let i = 0
  for (let r6 = 0; r6 < 6; r6++) {
    for (let g7 = 0; g7 < 7; g7++) {
      for (let b6 = 0; b6 < 6; b6++) {
        table[i * 3] = Math.round((r6 * 255) / 5)
        table[i * 3 + 1] = Math.round((g7 * 255) / 6)
        table[i * 3 + 2] = Math.round((b6 * 255) / 5)
        i++
      }
    }
  }
  return table
}

// ---------- LZW compression (LSB-first bit packing) ----------

class BitWriter {
  private bytes: number[] = []
  private current = 0
  private bitsUsed = 0

  writeCode(code: number, width: number): void {
    this.current |= (code << this.bitsUsed) >>> 0
    this.bitsUsed += width
    while (this.bitsUsed >= 8) {
      this.bytes.push(this.current & 0xff)
      this.current = (this.current >>> 8) >>> 0
      this.bitsUsed -= 8
    }
  }

  flush(): Buffer {
    if (this.bitsUsed > 0) {
      this.bytes.push(this.current & 0xff)
      this.current = 0
      this.bitsUsed = 0
    }
    return Buffer.from(this.bytes)
  }
}

/** GIF LZW: variable-width codes, dictionary reset via clear code at 4095. */
function lzwEncode(indices: Uint8Array): Buffer {
  const writer = new BitWriter()
  // dictionary: maps (prefix code, next symbol) → code. Key packing: the
  // prefix can be up to 4095 (12 bits) and the symbol 8 bits → 20-bit key.
  const dict = new Map<number, number>()
  let codeSize = MIN_CODE_SIZE + 1
  let nextCode = FIRST_FREE_CODE

  const resetDict = () => {
    dict.clear()
    nextCode = FIRST_FREE_CODE
    codeSize = MIN_CODE_SIZE + 1
  }

  writer.writeCode(CLEAR_CODE, codeSize)

  if (indices.length === 0) {
    writer.writeCode(EOI_CODE, codeSize)
    return writer.flush()
  }

  let current = indices[0]
  for (let i = 1; i < indices.length; i++) {
    const symbol = indices[i]
    const key = (current << 8) | symbol
    const found = dict.get(key)
    if (found !== undefined) {
      current = found
      continue
    }
    // emit the prefix, then add (prefix, symbol) to the dictionary
    writer.writeCode(current, codeSize)
    if (nextCode <= MAX_CODE) {
      dict.set(key, nextCode)
      nextCode++
      // Width bump: the decoder's table runs one entry behind the encoder's
      // (it adds no entry for the first code after CLEAR), so the encoder
      // must widen one assignment AFTER 2^codeSize — see classic giflib.
      if (nextCode > (1 << codeSize) && codeSize < 12) codeSize++
    } else {
      // dictionary full — reset via clear code (decoder stays in sync)
      writer.writeCode(CLEAR_CODE, codeSize)
      resetDict()
    }
    current = symbol
  }
  writer.writeCode(current, codeSize)
  writer.writeCode(EOI_CODE, codeSize)
  return writer.flush()
}

/** Wrap a raw LZW stream into ≤255-byte GIF data sub-blocks. */
function dataSubBlocks(raw: Buffer): Buffer {
  const chunks: Buffer[] = []
  for (let i = 0; i < raw.length; i += 255) {
    const chunk = raw.subarray(i, Math.min(i + 255, raw.length))
    chunks.push(Buffer.from([chunk.length]), chunk)
  }
  chunks.push(Buffer.from([0x00])) // block terminator
  return Buffer.concat(chunks)
}

/**
 * Encode frames (identical dimensions expected) into an animated GIF89a.
 * @param delayCs frame delay in hundredths of a second (60 → 60 ms)
 */
export function encodeAnimatedGif(frames: GifFrame[], delayCs: number): Buffer {
  if (frames.length === 0) throw new Error('encodeAnimatedGif: no frames')
  const { width, height } = frames[0]
  for (const f of frames) {
    if (f.width !== width || f.height !== height) {
      throw new Error('encodeAnimatedGif: all frames must share dimensions')
    }
    if (f.rgba.length !== width * height * 4) {
      throw new Error('encodeAnimatedGif: frame rgba size mismatch')
    }
  }

  const parts: Buffer[] = []

  // header + logical screen descriptor
  parts.push(Buffer.from('GIF89a', 'ascii'))
  const lsd = Buffer.alloc(7)
  lsd.writeUInt16LE(width, 0)
  lsd.writeUInt16LE(height, 2)
  lsd[4] = 0xf7 // global color table, 8-bit color resolution, 256 entries
  lsd[5] = 0 // background color index
  lsd[6] = 0 // pixel aspect ratio
  parts.push(lsd)

  // global color table
  parts.push(globalColorTable())

  // NETSCAPE2.0 loop extension (infinite loop)
  const loop = Buffer.alloc(19)
  loop[0] = 0x21
  loop[1] = 0xff
  loop[2] = 0x0b
  loop.write('NETSCAPE2.0', 3, 'ascii')
  loop[14] = 0x03
  loop[15] = 0x01
  loop.writeUInt16LE(0, 16) // loop forever
  // (byte 18 stays 0x00 — block terminator)
  parts.push(loop)

  const gceTemplate = Buffer.alloc(8)
  gceTemplate[0] = 0x21
  gceTemplate[1] = 0xf9
  gceTemplate[2] = 0x04
  gceTemplate[3] = 0x04 // disposal method 1 (do not dispose), no transparency
  gceTemplate.writeUInt16LE(Math.max(1, Math.round(delayCs)), 4)
  // (gce[6] = transparent index — unused; gce[7] = 0x00 terminator)

  for (const frame of frames) {
    // graphic control extension: delay + "do not dispose"
    parts.push(gceTemplate)

    // image descriptor
    const img = Buffer.alloc(10)
    img[0] = 0x2c
    img.writeUInt16LE(0, 1) // left
    img.writeUInt16LE(0, 3) // top
    img.writeUInt16LE(width, 5)
    img.writeUInt16LE(height, 7)
    img[9] = 0x00 // no local color table, no interlace
    parts.push(img)

    // quantize to the fixed palette, then LZW
    const indices = new Uint8Array(width * height)
    for (let p = 0; p < width * height; p++) {
      const o = p * 4
      indices[p] = paletteIndex(frame.rgba[o], frame.rgba[o + 1], frame.rgba[o + 2])
    }
    parts.push(Buffer.from([MIN_CODE_SIZE]))
    parts.push(dataSubBlocks(lzwEncode(indices)))
  }

  parts.push(Buffer.from([0x3b])) // trailer
  return Buffer.concat(parts)
}
