// BELENTANI FIRELAB — server-side asset storage + provider config
import { promises as fs } from 'fs'
import path from 'path'
import sharp from 'sharp'
import { db } from '@/lib/db'

export const ASSET_DIR = path.join(process.cwd(), 'db', 'firelab-assets')
export const CONFIG_FILE = path.join(process.cwd(), 'db', 'firelab-config.json')

export interface GeneratedImageInput {
  base64: string
  mime: string
}

export interface SavedAsset {
  id: string
  url: string
  thumbUrl: string | null
  width: number
  height: number
  mime: string
}

async function ensureDirs() {
  await fs.mkdir(ASSET_DIR, { recursive: true })
}

export function splitDataURL(dataUrl: string): { mime: string; base64: string } {
  const match = /^data:([^;,]+)(;base64)?,([\s\S]*)$/.exec(dataUrl.trim())
  if (!match) throw new Error('Invalid data URL')
  return { mime: match[1], base64: match[3] }
}

function extFor(mime: string): string {
  switch (mime) {
    case 'image/png':
      return 'png'
    case 'image/jpeg':
      return 'jpg'
    case 'image/webp':
      return 'webp'
    case 'image/svg+xml':
      return 'svg'
    case 'image/gif':
      return 'gif'
    case 'video/mp4':
      return 'mp4'
    case 'video/webm':
      return 'webm'
    case 'audio/wav':
    case 'audio/x-wav':
      return 'wav'
    case 'audio/mpeg':
      return 'mp3'
    case 'audio/mp4':
    case 'audio/aac':
      return 'm4a'
    case 'audio/ogg':
      return 'ogg'
    case 'audio/webm':
      return 'weba'
    default:
      return 'bin'
  }
}

/** Persist one generated artifact (image / GIF / video / audio, raw base64 or
 * data URL) as an asset. Raster images get dimensions + a WebP thumbnail;
 * GIFs get an animated thumbnail when sharp succeeds (else no thumb);
 * videos and audio are stored as-is with unknown dimensions. */
export async function saveAsset(
  input: GeneratedImageInput | string,
  kindHint = 'gen'
): Promise<SavedAsset> {
  await ensureDirs()
  const { mime, base64 } =
    typeof input === 'string' ? splitDataURL(input) : { mime: input.mime, base64: input.base64 }
  const buffer = Buffer.from(base64, 'base64')
  if (buffer.length === 0) throw new Error('Empty asset payload')

  let width: number | undefined
  let height: number | undefined
  let thumbName: string | null = null

  const isSvg = mime === 'image/svg+xml'
  const isRasterImage = mime.startsWith('image/') && !isSvg
  const isAnimatedRaster = mime === 'image/gif'

  if (isSvg) {
    const dim = /<svg[^>]*width="(\d+)"[^>]*height="(\d+)"/.exec(buffer.toString('utf8'))
    if (dim) {
      width = Number(dim[1])
      height = Number(dim[2])
    }
  } else if (isRasterImage) {
    // dimensions for images (and GIFs) via sharp metadata — best effort
    try {
      const meta = await sharp(buffer, isAnimatedRaster ? { animated: true } : {}).metadata()
      width = meta.width
      height = meta.height
    } catch {
      // ignore metadata failures
    }
  }

  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}-${kindHint}`
  const fileName = `${id}.${extFor(mime)}`
  await fs.writeFile(path.join(ASSET_DIR, fileName), buffer)

  // thumbnail (webp, 320px) — raster images and GIFs only; video/audio skip
  if (isRasterImage) {
    try {
      const thumbBuffer = await sharp(buffer, isAnimatedRaster ? { animated: true } : {})
        .resize(320, 320, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 72 })
        .toBuffer()
      thumbName = `${id}-thumb.webp`
      await fs.writeFile(path.join(ASSET_DIR, thumbName), thumbBuffer)
    } catch {
      thumbName = null
    }
  }

  await db.asset.create({
    data: { id, file: fileName, thumb: thumbName, mime, bytes: buffer.length, width, height },
  })

  return {
    id,
    url: `/api/firelab/assets/${id}`,
    thumbUrl: thumbName ? `/api/firelab/assets/${id}?t=thumb` : null,
    width: width ?? 0,
    height: height ?? 0,
    mime,
  }
}

/** Backwards-compatible alias — images and every other asset kind alike. */
export const saveImageAsset = saveAsset

export async function saveImages(
  inputs: (GeneratedImageInput | string)[],
  kindHint = 'gen'
): Promise<SavedAsset[]> {
  const results: SavedAsset[] = []
  for (const input of inputs) {
    results.push(await saveAsset(input, kindHint))
  }
  return results
}

/** Plural saver with the canonical name (any asset kind). */
export const saveAssets = saveImages

export async function readAssetFile(
  id: string,
  thumb = false
): Promise<{ buffer: Buffer; mime: string } | null> {
  const row = await db.asset.findUnique({ where: { id } })
  if (!row) return null
  const fileName = thumb ? row.thumb : row.file
  if (!fileName) return null
  try {
    const buffer = await fs.readFile(path.join(ASSET_DIR, fileName))
    const mime = thumb ? 'image/webp' : row.mime
    return { buffer, mime }
  } catch {
    return null
  }
}

// ---- provider order config (persisted, gitignored) ----

export interface FirelabConfig {
  providerOrder?: string[]
}

export async function readConfig(): Promise<FirelabConfig> {
  try {
    const raw = await fs.readFile(CONFIG_FILE, 'utf8')
    return JSON.parse(raw) as FirelabConfig
  } catch {
    return {}
  }
}

export async function writeConfig(config: FirelabConfig): Promise<void> {
  await fs.mkdir(path.dirname(CONFIG_FILE), { recursive: true })
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8')
}
