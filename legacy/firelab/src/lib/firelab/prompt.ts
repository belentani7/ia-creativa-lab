// BELENTANI FIRELAB — prompt engine (shared client + server)
// Prompt Builder segments, style presets and edit-instruction templates.

export interface PromptSegments {
  subject: string
  environment: string
  lighting: string
  camera: string
  lens: string
  composition: string
  aesthetic: string
  color: string
  mood: string
  extras: string
}

export const PROMPT_SEGMENT_FIELDS: {
  key: keyof PromptSegments
  label: string
  placeholder: string
}[] = [
  { key: 'subject', label: 'Subject', placeholder: 'a powerful black stallion' },
  { key: 'environment', label: 'Environment', placeholder: 'dark misty void, minimal studio' },
  { key: 'lighting', label: 'Lighting', placeholder: 'dramatic rim light, low key' },
  { key: 'camera', label: 'Camera', placeholder: 'Hasselblad, three-quarter profile' },
  { key: 'lens', label: 'Lens / Optics', placeholder: '85mm f/1.4, shallow depth of field' },
  { key: 'composition', label: 'Composition', placeholder: 'centered, negative space' },
  { key: 'aesthetic', label: 'Aesthetic', placeholder: 'editorial, cinematic' },
  { key: 'color', label: 'Color', placeholder: 'monochrome with ember accents' },
  { key: 'mood', label: 'Mood', placeholder: 'controlled, powerful, quiet' },
  { key: 'extras', label: 'Extras', placeholder: 'fine grain, high detail' },
]

export function assemblePrompt(segments: PromptSegments, base = ''): string {
  const parts = [base.trim(), ...PROMPT_SEGMENT_FIELDS.map((f) => segments[f.key]?.trim())].filter(
    Boolean
  )
  return parts.join(', ')
}

export interface StylePreset {
  id: string
  label: string
  suffix: string
}

export const STYLE_PRESETS: StylePreset[] = [
  { id: 'none', label: 'None', suffix: '' },
  {
    id: 'cinematic',
    label: 'Cinematic',
    suffix: 'cinematic photography, anamorphic, dramatic lighting, film still, color graded, 35mm grain',
  },
  {
    id: 'editorial',
    label: 'Editorial',
    suffix: 'high-end editorial photography, studio lighting, crisp detail, magazine quality',
  },
  {
    id: 'analog',
    label: 'Analog Film',
    suffix: 'analog film photography, Kodak Portra 400, soft halation, natural grain, candid',
  },
  {
    id: 'studio',
    label: 'Studio Product',
    suffix: 'studio product photography, seamless background, softbox lighting, commercial, ultra sharp',
  },
  {
    id: 'fineart',
    label: 'Fine Art',
    suffix: 'fine art photography, museum quality, sculptural light, refined palette, large format',
  },
  {
    id: 'ethereal',
    label: 'Ethereal',
    suffix: 'ethereal atmosphere, soft diffusion, pastel haze, dreamlike, delicate gradients',
  },
  {
    id: 'noir',
    label: 'Noir',
    suffix: 'film noir, chiaroscuro, deep shadows, high contrast black and white, venetian blind light',
  },
  {
    id: 'brutal',
    label: 'Brutalist',
    suffix: 'brutalist aesthetic, raw concrete, hard geometry, overcast light, documentary',
  },
  {
    id: 'illustration',
    label: 'Illustration',
    suffix: 'refined digital illustration, painterly texture, art direction, sophisticated palette',
  },
]

export function styleSuffix(styleId: string | undefined): string {
  return STYLE_PRESETS.find((s) => s.id === styleId)?.suffix ?? ''
}

export type EditMode = 'fill' | 'remove' | 'expand' | 'background' | 'variations' | 'refine'

/**
 * Instruction templates for image editing. The built-in engine receives
 * image + instruction (no raw mask channel), so the client marks the masked
 * region with a solid magenta fill and the instruction references it.
 */
export function buildEditInstruction(mode: EditMode, userPrompt: string, hasMask: boolean): string {
  const p = userPrompt.trim()
  const region = hasMask ? 'the region covered by the solid magenta overlay' : 'the image'
  switch (mode) {
    case 'fill':
      return `Edit ${region} only: ${
        p || 'fill naturally with surroundings'
      }. Blend the new content seamlessly with the rest of the image — match lighting, perspective, grain and color. Keep every pixel outside the magenta region exactly unchanged. Photorealistic, high quality.`
    case 'remove':
      return `Remove the object/content in ${region}. Reconstruct the hidden background plausibly and seamlessly — continue surfaces, textures, lighting and perspective from the surrounding areas. Keep every pixel outside the magenta region exactly unchanged. Photorealistic result, no traces of the removed object.`
    case 'expand':
      return `The magenta-marked border areas are missing content: extend the scene naturally into them. Continue the existing image outwards — same style, lighting, perspective, color and level of detail, seamless transition. Keep the original (non-magenta) pixels exactly unchanged.`
    case 'background':
      return p
        ? `Replace the entire background with: ${p}. Keep the main subject exactly as it is — same pose, identity, lighting direction and detail. Integrate the subject naturally into the new background (consistent shadows and color). High quality composite.`
        : `Isolate the main subject and place it on a completely flat, uniform, pure chroma-key green background (#00FF00), evenly lit with no gradients, no shadows on the background, no green spill on the subject. Keep the subject exactly unchanged — same pose, identity, colors, lighting and detail. The background must be one solid flat green color edge to edge.`
    case 'variations':
      return `Create a variation of this image: ${
        p || 'same subject and mood, fresh interpretation'
      }. Keep the overall composition, subject identity and aesthetic recognisable while exploring the change. High quality, same style.`
    case 'refine':
      return `Enhance and refine this image: ${
        p || 'increase detail, sharpen micro-texture, clean artifacts, improve lighting and tonal richness'
      }. Keep composition, subject and style exactly the same. Subtle, professional retouch quality.`
    default:
      return p
  }
}

export const ENHANCE_SYSTEM_PROMPT = `You are a world-class prompt engineer for generative image models, trained in cinematic and editorial photography language. Rewrite the user's idea into ONE single rich English prompt (60-120 words) as a comma-separated chain of concrete visual directives: subject and its precise appearance, pose/action, wardrobe or texture, environment, lighting design, camera and lens language, composition, color palette, mood, and finishing quality words. No headings, no lists, no explanations, no quotes — output ONLY the final prompt text on a single line. Never mention that you are rewriting.`

export const ENHANCE_SYSTEM_PROMPT_EDITORIAL = `You are a creative director at a high-end fashion magazine writing generative image prompts. Rewrite the user's idea into ONE single English prompt (60-120 words), comma-separated: subject with precise physical detail and styling, set design, lighting design (key, rim, practicals), camera format and lens, framing, palette, atmosphere, and finishing words. Output ONLY the prompt text on one line. No explanations.`
