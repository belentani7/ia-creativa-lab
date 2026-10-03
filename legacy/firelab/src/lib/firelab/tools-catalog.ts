// BELENTANI FIRELAB — Tools Catalog (client-safe pure data, no 'use client')
//
// A RECIPE BOOK over real capabilities. Every entry maps to a native panel and
// (optionally) a prompt template that is prefilled into that panel's input when
// the recipe is opened. Availability is resolved live against the provider
// list — nothing here fakes a capability the runtime does not have.
//
// Braces in templates (e.g. {subject}) are literal placeholders the user edits
// after the template lands in the panel.

import type { Capability } from './types'
import type { ToolId } from './store'

export type CatalogCategory =
  | 'image'
  | 'video'
  | 'audio'
  | 'voice'
  | 'text'
  | 'reference'
  | 'utility'

export type CatalogBadge = 'native' | 'template' | 'local' | 'experimental'

/** Store field a promptTemplate prefills when the recipe is opened. */
export type PrefillField =
  | 'prompt'
  | 'negativePrompt'
  | 'speechText'
  | 'searchQuery'
  | 'variationsGuidance'

export interface CatalogTool {
  /** kebab-case id */
  id: string
  /** display name */
  name: string
  /** one line, editorial voice */
  tagline: string
  category: CatalogCategory
  /** native panel to switch to (from the store's ToolId union) */
  tool?: ToolId
  /** prefilled into the panel's prompt (or the field named by prefillField) */
  promptTemplate?: string
  /** which store field the template prefills; default derived from `tool` */
  prefillField?: PrefillField
  /** capability used for live availability resolution */
  capabilities?: Capability[]
  /** utility/editor ops — always available */
  local?: boolean
  /** search keywords */
  tags: string[]
  badge?: CatalogBadge
}

export const CATEGORIES: { id: CatalogCategory; label: string; blurb: string }[] = [
  {
    id: 'image',
    label: 'Image',
    blurb: 'Stills — from the hearth of text → image to fill, expand, upscale and grade.',
  },
  {
    id: 'video',
    label: 'Video',
    blurb: 'Motion — describe a shot, or animate the canvas as a start frame.',
  },
  {
    id: 'audio',
    label: 'Audio',
    blurb: 'Music beds and grooves from a sentence of description.',
  },
  {
    id: 'voice',
    label: 'Voice',
    blurb: 'Speech synthesis and transcription — the studio speaks and listens.',
  },
  {
    id: 'text',
    label: 'Text',
    blurb: 'Prompt craft — rewrites, keyword packs and language cheat-sheets.',
  },
  {
    id: 'reference',
    label: 'Reference',
    blurb: 'Reference hunting before the first pixel is generated.',
  },
  {
    id: 'utility',
    label: 'Utility',
    blurb: 'Local pixel math — instant, offline, undo-able.',
  },
]

/**
 * Capability each native panel actually exercises — used to resolve live
 * availability for catalog entries that don't carry an explicit capability.
 */
export const TOOL_CAPABILITY: Partial<Record<ToolId, Capability>> = {
  generate: 'textToImage',
  fill: 'inpainting',
  remove: 'removeObject',
  expand: 'outpainting',
  background: 'removeBackground',
  upscale: 'upscale',
  variations: 'variations',
  'text-to-video': 'textToVideo',
  'image-to-video': 'imageToVideo',
  music: 'textToMusic',
  speech: 'textToSpeech',
  transcribe: 'speechToText',
  'image-search': 'imageSearch',
  // 'adjust' has no capability — it is local-only pixel math.
}

/** Default store field a template prefills, derived from the target panel. */
export function defaultPrefillField(tool: ToolId | undefined): PrefillField {
  switch (tool) {
    case 'speech':
      return 'speechText'
    case 'image-search':
      return 'searchQuery'
    case 'variations':
      return 'variationsGuidance'
    default:
      return 'prompt'
  }
}

// ————————————————————————————————————————————————————————————————
// IMAGE — 42
// ————————————————————————————————————————————————————————————————

const IMAGE_TOOLS: CatalogTool[] = [
  {
    id: 'text-to-image',
    name: 'Text to Image',
    tagline: 'The hearth — describe anything and the warmest engine answers with an image.',
    category: 'image',
    tool: 'generate',
    capabilities: ['textToImage'],
    tags: ['image', 'generate', 'prompt', 'diffusion', 't2i', 'still'],
    badge: 'native',
  },
  {
    id: 'cinematic-still',
    name: 'Cinematic Still',
    tagline: 'One frame lifted from a film that was never shot — anamorphic, backlit, graded.',
    category: 'image',
    tool: 'generate',
    promptTemplate:
      'cinematic film still, {shot}: 35mm anamorphic, shallow depth of field, volumetric backlight, moody color grade, film grain, {subject}',
    tags: ['cinematic', 'film', 'anamorphic', 'still', 'movie', '35mm', 'backlight'],
    badge: 'template',
  },
  {
    id: 'editorial-portrait',
    name: 'Editorial Portrait',
    tagline: 'Window light and an 85mm — the magazine-cover read of a face.',
    category: 'image',
    tool: 'generate',
    promptTemplate:
      'editorial portrait photograph, soft window light, 85mm f/1.4, natural skin texture, muted palette, magazine cover composition, {subject}',
    tags: ['portrait', 'editorial', 'magazine', 'window light', '85mm', 'face'],
    badge: 'template',
  },
  {
    id: 'product-shot',
    name: 'Product Shot',
    tagline: 'Seamless backdrop, three-point studio — the commercial hero shot.',
    category: 'image',
    tool: 'generate',
    promptTemplate:
      'premium product photograph on seamless backdrop, three-point studio lighting, glossy reflections, macro detail, commercial advertising aesthetic, {product}',
    tags: ['product', 'commercial', 'studio', 'packshot', 'advertising', 'ecommerce'],
    badge: 'template',
  },
  {
    id: 'logo-concept',
    name: 'Logo Concept',
    tagline: 'A geometric mark with honest negative space — brand identity territory.',
    category: 'image',
    tool: 'generate',
    promptTemplate:
      'minimal vector logo mark for {brand}, geometric construction, negative space, flat design, black on off-white, high contrast, brand identity',
    tags: ['logo', 'brand', 'identity', 'vector', 'mark', 'minimal'],
    badge: 'template',
  },
  {
    id: 'icon-set',
    name: 'Icon Set',
    tagline: 'One concept, one accent color, one consistent stroke — UI iconography.',
    category: 'image',
    tool: 'generate',
    promptTemplate:
      'flat icon of {concept}, rounded 2px stroke, single accent color, centered on 1024 grid, consistent line weight, UI iconography',
    tags: ['icon', 'ui', 'interface', 'flat', 'vector', 'stroke'],
    badge: 'template',
  },
  {
    id: 'album-cover',
    name: 'Album Cover',
    tagline: 'Square-format artwork with a duotone spine — a record you can almost hear.',
    category: 'image',
    tool: 'generate',
    promptTemplate:
      'album cover artwork, {genre} aesthetic, bold graphic composition, limited duotone palette, grain texture, square format, no text',
    tags: ['album', 'cover', 'music', 'artwork', 'duotone', 'square', 'record'],
    badge: 'template',
  },
  {
    id: 'book-cover',
    name: 'Book Cover',
    tagline: 'A single-image metaphor with room left for the title.',
    category: 'image',
    tool: 'generate',
    promptTemplate:
      'book cover illustration for a {genre} novel, evocative single-image metaphor, cinematic lighting, negative space for title, portrait format',
    tags: ['book', 'cover', 'novel', 'illustration', 'publishing', 'portrait format'],
    badge: 'template',
  },
  {
    id: 'poster-design',
    name: 'Poster Design',
    tagline: 'Swiss discipline, screen-print grit — 2:3 and proud of it.',
    category: 'image',
    tool: 'generate',
    promptTemplate:
      'graphic poster, swiss typography space, bold {style} composition, screen-print texture, high contrast, 2:3 portrait',
    tags: ['poster', 'graphic', 'swiss', 'typography', 'screen-print', 'print'],
    badge: 'template',
  },
  {
    id: 'character-concept',
    name: 'Character Concept',
    tagline: 'Full body, three-quarter light, costume detail — the concept sheet that sells a cast.',
    category: 'image',
    tool: 'generate',
    promptTemplate:
      'character concept sheet, full body, {archetype}, three-quarter lighting, muted earth palette, costume detail, concept art, neutral background',
    tags: ['character', 'concept art', 'sheet', 'archetype', 'costume', 'full body'],
    badge: 'template',
  },
  {
    id: 'environment-concept',
    name: 'Environment Concept',
    tagline: 'God rays over an epic scale — the establishing painting for worlds that do not exist.',
    category: 'image',
    tool: 'generate',
    promptTemplate:
      'environment concept art, {biome}, atmospheric perspective, god rays, painterly matte, epic scale, rule of thirds',
    tags: ['environment', 'concept art', 'world', 'biome', 'god rays', 'matte'],
    badge: 'template',
  },
  {
    id: 'matte-painting',
    name: 'Matte Painting',
    tagline: 'Production-grade establishing shot — layered atmosphere, photographic realism.',
    category: 'image',
    tool: 'generate',
    promptTemplate:
      'digital matte painting, {scene}, epic establishing shot, layered atmosphere, photographic realism, film production quality',
    tags: ['matte painting', 'establishing', 'film', 'atmosphere', 'epic', 'vista'],
    badge: 'template',
  },
  {
    id: 'isometric-illustration',
    name: 'Isometric Illustration',
    tagline: 'Clean geometry at 45 degrees — game-art tidiness with soft occlusion.',
    category: 'image',
    tool: 'generate',
    promptTemplate:
      'isometric illustration of {subject}, clean geometry, soft ambient occlusion, pastel palette, 45-degree projection, game art style',
    tags: ['isometric', 'illustration', 'game art', 'geometry', 'pastel', 'projection'],
    badge: 'template',
  },
  {
    id: 'watercolor-sketch',
    name: 'Watercolor Sketch',
    tagline: 'Wet-on-wet washes, bleeding edges — the sketchbook that survived the rain.',
    category: 'image',
    tool: 'generate',
    promptTemplate:
      'loose watercolor sketch of {subject}, wet-on-wet washes, paper grain, limited palette, artistic bleeding edges',
    tags: ['watercolor', 'sketch', 'painterly', 'wash', 'paper', 'loose'],
    badge: 'template',
  },
  {
    id: 'ink-linework',
    name: 'Ink Linework',
    tagline: 'Crosshatched engraving discipline — every line earns its place.',
    category: 'image',
    tool: 'generate',
    promptTemplate:
      'black ink line drawing of {subject}, crosshatching, variable line weight, engraving style, high detail, cream paper',
    tags: ['ink', 'linework', 'engraving', 'crosshatch', 'drawing', 'monochrome'],
    badge: 'template',
  },
  {
    id: 'pixel-scene',
    name: 'Pixel Art Scene',
    tagline: '16-bit palette discipline, dithered shade — the era when pixels were pixels.',
    category: 'image',
    tool: 'generate',
    promptTemplate:
      'pixel art scene of {subject}, 16-bit era palette, dithered shading, crisp pixel clusters, retro game aesthetic',
    tags: ['pixel art', 'retro', '16-bit', 'game', 'dither', 'sprite'],
    badge: 'template',
  },
  {
    id: 'render-look',
    name: '3D Render Look',
    tagline: 'Soft global illumination and subsurface scattering — the octane sheen.',
    category: 'image',
    tool: 'generate',
    promptTemplate:
      'stylized 3D render of {subject}, soft global illumination, subsurface scattering, octane render, pastel studio lighting',
    tags: ['3d', 'render', 'octane', 'cgi', 'global illumination', 'stylized'],
    badge: 'template',
  },
  {
    id: 'claymation',
    name: 'Claymation Style',
    tagline: 'Plasticine fingerprints under stop-motion set light — handmade, imperfect, alive.',
    category: 'image',
    tool: 'generate',
    promptTemplate:
      'claymation render of {subject}, handmade plasticine texture, fingerprint imperfections, stop-motion set lighting',
    tags: ['claymation', 'clay', 'stop-motion', 'plasticine', 'handmade', 'plastic'],
    badge: 'template',
  },
  {
    id: 'film-look',
    name: 'Analogue Film Look',
    tagline: 'Portra 400 halation and imperfect focus — nostalgia you can measure in grain.',
    category: 'image',
    tool: 'generate',
    promptTemplate:
      'photograph of {subject}, kodak portra 400, halation, natural grain, imperfect focus, nostalgic tones',
    tags: ['film', 'analog', 'portra', 'grain', 'halation', 'nostalgic', '35mm'],
    badge: 'template',
  },
  {
    id: 'cyberpunk-scene',
    name: 'Cyberpunk Scene',
    tagline: 'Rain-slick asphalt, neon signage, teal-magenta haze — the future at night.',
    category: 'image',
    tool: 'generate',
    promptTemplate:
      'cyberpunk street scene, neon signage reflections, rain-slick asphalt, teal and magenta haze, blade-runner atmosphere, {location}',
    tags: ['cyberpunk', 'neon', 'rain', 'night', 'sci-fi', 'blade runner', 'dystopia'],
    badge: 'template',
  },
  {
    id: 'fantasy-landscape',
    name: 'Fantasy Landscape',
    tagline: 'Golden hour over painterly clouds — an epic vista with a matte finish.',
    category: 'image',
    tool: 'generate',
    promptTemplate:
      'fantasy landscape painting, {landmark}, golden hour, painterly clouds, epic vista, matte finish',
    tags: ['fantasy', 'landscape', 'golden hour', 'painterly', 'epic', 'vista'],
    badge: 'template',
  },
  {
    id: 'scifi-concept',
    name: 'Sci-Fi Concept',
    tagline: 'Worn metal and industrial paneling — retro-futurism that has been used hard.',
    category: 'image',
    tool: 'generate',
    promptTemplate:
      'hard sci-fi concept of {subject}, industrial paneling, worn metal, cool rim light, retro-futurist utilitarian design',
    tags: ['sci-fi', 'science fiction', 'industrial', 'concept', 'retro-futurism', 'hard sf'],
    badge: 'template',
  },
  {
    id: 'street-photo',
    name: 'Street Photography Look',
    tagline: 'The decisive moment at 28mm — available light, subtle grain, city air.',
    category: 'image',
    tool: 'generate',
    promptTemplate:
      'candid street photograph, decisive moment, {city} atmosphere, available light, 28mm perspective, subtle grain',
    tags: ['street', 'photography', 'candid', 'documentary', '28mm', 'city'],
    badge: 'template',
  },
  {
    id: 'food-styling',
    name: 'Food Styling Shot',
    tagline: 'Steam wisps under window light — editorial food styling, macro-honest.',
    category: 'image',
    tool: 'generate',
    promptTemplate:
      'food photograph of {dish}, steam wisps, rustic props, directional window light, macro texture, editorial food styling',
    tags: ['food', 'culinary', 'styling', 'editorial', 'macro', 'restaurant'],
    badge: 'template',
  },
  {
    id: 'interior-viz',
    name: 'Interior Design Viz',
    tagline: 'Warm afternoon light across scandinavian restraint — architectural interior at 16:9.',
    category: 'image',
    tool: 'generate',
    promptTemplate:
      'interior visualization of {room}, warm afternoon light, minimalist scandinavian furniture, architectural photography, 16:9',
    tags: ['interior', 'architecture', 'scandinavian', 'room', 'viz', 'furniture'],
    badge: 'template',
  },
  {
    id: 'archi-render',
    name: 'Architectural Render',
    tagline: 'Golden-hour exterior, cast shadows, clean glass — Corbusian materiality.',
    category: 'image',
    tool: 'generate',
    promptTemplate:
      'architectural visualization of {building}, golden hour exterior, cast shadows, clean glass reflections, corbusian materiality',
    tags: ['architecture', 'render', 'building', 'exterior', 'golden hour', 'glass'],
    badge: 'template',
  },
  {
    id: 'fashion-look',
    name: 'Fashion Lookbook',
    tagline: 'Studio strobes, editorial posing, seamless backdrop — the Vogue page.',
    category: 'image',
    tool: 'generate',
    promptTemplate:
      'fashion lookbook photograph, {garment}, studio strobe, editorial posing, seamless backdrop, vogue aesthetic',
    tags: ['fashion', 'lookbook', 'editorial', 'garment', 'strobe', 'vogue'],
    badge: 'template',
  },
  {
    id: 'sticker-pack',
    name: 'Sticker Pack',
    tagline: 'Die-cut, bold outline, glossy finish — playful, isolated, ready to peel.',
    category: 'image',
    tool: 'generate',
    promptTemplate:
      'die-cut sticker illustration of {subject}, bold outline, glossy finish, playful palette, isolated on white',
    tags: ['sticker', 'die-cut', 'emoji', 'pack', 'playful', 'glossy'],
    badge: 'template',
  },
  {
    id: 'seamless-pattern',
    name: 'Seamless Pattern',
    tagline: 'A tile that never betrays its seam — surface design with even rhythm.',
    category: 'image',
    tool: 'generate',
    promptTemplate:
      'seamless tileable pattern of {motif}, flat vector style, even rhythm, surface design, repeating wallpaper',
    tags: ['pattern', 'seamless', 'tile', 'wallpaper', 'surface', 'repeat'],
    badge: 'template',
  },
  {
    id: 'texture-map',
    name: 'Texture Map',
    tagline: 'Albedo-clean, shadow-free, 4K — the PBR-ready material sheet.',
    category: 'image',
    tool: 'generate',
    promptTemplate:
      'PBR-ready {material} texture, even diffuse lighting, seamless tile, 4K detail, albedo map, no shadows',
    tags: ['texture', 'pbr', 'material', 'albedo', 'tile', 'game dev'],
    badge: 'template',
  },
  {
    id: 'double-exposure',
    name: 'Double Exposure',
    tagline: 'A silhouette and a landscape fused in luminous overlap — darkroom poetry.',
    category: 'image',
    tool: 'variations',
    promptTemplate:
      'double exposure composite: silhouette of {subject} blended with {texture scene}, luminous overlap, monochrome base',
    tags: ['double exposure', 'composite', 'silhouette', 'blend', 'monochrome', 'surreal'],
    badge: 'template',
  },
  {
    id: 'style-transfer',
    name: 'Style Transfer (Image → Image)',
    tagline: 'The native image → image pass — re-photograph the canvas through a new visual language.',
    category: 'image',
    tool: 'variations',
    capabilities: ['imageToImage'],
    tags: ['style transfer', 'image to image', 'i2i', 'reinterpret', 'restyle'],
    badge: 'native',
  },
  {
    id: 'color-grade-transfer',
    name: 'Color Grade Transfer',
    tagline: 'Same composition, new blood — a blockbuster or noir grade over the canvas image.',
    category: 'image',
    tool: 'variations',
    promptTemplate:
      're-photograph the canvas image with {grade: teal-orange blockbuster / bleach bypass / moody noir} color grade, preserving composition',
    tags: ['color grade', 'grading', 'teal orange', 'noir', 'bleach bypass', 'look'],
    badge: 'template',
  },
  {
    id: 'sketch-to-render',
    name: 'Sketch → Render',
    tagline: 'Keep the linework proportions, add material and light — sketch to photoreal.',
    category: 'image',
    tool: 'variations',
    promptTemplate:
      'render this sketch into a photoreal {subject}, keep linework proportions, add material and light',
    tags: ['sketch', 'render', 'photoreal', 'linework', 'concept', 'study'],
    badge: 'template',
  },
  {
    id: 'variations',
    name: 'Variations',
    tagline: 'The native reinterpretation engine — same subject, re-imagined.',
    category: 'image',
    tool: 'variations',
    capabilities: ['variations'],
    tags: ['variations', 'explore', 'reinterpretation', 'alternatives'],
    badge: 'native',
  },
  {
    id: 'generative-fill',
    name: 'Generative Fill',
    tagline: 'Paint a mask, describe the content — the native inpainting pass blends it in.',
    category: 'image',
    tool: 'fill',
    capabilities: ['inpainting'],
    tags: ['fill', 'inpainting', 'mask', 'brush', 'edit', 'generative fill'],
    badge: 'native',
  },
  {
    id: 'expand',
    name: 'Generative Expand',
    tagline: 'Grow the canvas and let the model continue the scene — outpainting, native.',
    category: 'image',
    tool: 'expand',
    capabilities: ['outpainting'],
    tags: ['expand', 'outpainting', 'canvas', 'uncrop', 'wider'],
    badge: 'native',
  },
  {
    id: 'remove-object',
    name: 'Remove Object',
    tagline: 'Mask it away, let the background close the wound — native object removal.',
    category: 'image',
    tool: 'remove',
    capabilities: ['removeObject'],
    tags: ['remove', 'erase', 'object', 'retouch', 'cleanup'],
    badge: 'native',
  },
  {
    id: 'remove-background',
    name: 'Remove Background',
    tagline: 'AI chroma-green pass plus local keying — transparent PNG out the other side.',
    category: 'image',
    tool: 'background',
    capabilities: ['removeBackground'],
    tags: ['background', 'remove background', 'transparent', 'png', 'keying', 'cutout'],
    badge: 'native',
  },
  {
    id: 'upscale',
    name: 'Upscale',
    tagline: 'Local resample + unsharp always works; an AI refinement pass joins when a provider has it.',
    category: 'image',
    tool: 'upscale',
    capabilities: ['upscale'],
    local: true,
    tags: ['upscale', 'resolution', 'sharpen', 'refine', '4k', 'resample'],
    badge: 'native',
  },
  {
    id: 'remix',
    name: 'Remix (Describe + Regen)',
    tagline: 'Keep the subject, re-imagine everything else — a re-gen guided by your words.',
    category: 'image',
    tool: 'variations',
    promptTemplate:
      'remix the canvas image as {new context}, keep the subject identity, re-imagine everything else',
    tags: ['remix', 'regenerate', 'reimagine', 'recontextualize', 'redress'],
    badge: 'template',
  },
  {
    id: 'enhance-prompt-image',
    name: 'Prompt Enhance',
    tagline: 'The Enhance button, documented — an LLM rewrite of your idea into rich prompt language.',
    category: 'image',
    tool: 'generate',
    capabilities: ['promptEnhance'],
    tags: ['enhance', 'prompt', 'rewrite', 'llm', 'improve'],
    badge: 'native',
  },
]

// ————————————————————————————————————————————————————————————————
// VIDEO — 20
// ————————————————————————————————————————————————————————————————

const VIDEO_TOOLS: CatalogTool[] = [
  {
    id: 'text-to-video',
    name: 'Text to Video',
    tagline: 'Describe a shot, get motion — the native video pass (cogvideox-3 in this runtime).',
    category: 'video',
    tool: 'text-to-video',
    capabilities: ['textToVideo'],
    tags: ['video', 'text to video', 'motion', 'shot', 'clip', 't2v'],
    badge: 'native',
  },
  {
    id: 'cinematic-clip',
    name: 'Cinematic Clip',
    tagline: 'A slow dolly-in with anamorphic flare and volumetric haze — the shot list, spoken.',
    category: 'video',
    tool: 'text-to-video',
    promptTemplate:
      'cinematic slow dolly-in on {subject}, anamorphic flare, shallow focus, volumetric haze, filmic grade',
    tags: ['cinematic', 'dolly', 'anamorphic', 'film', 'clip', 'camera move'],
    badge: 'template',
  },
  {
    id: 'product-broll',
    name: 'Product B-Roll',
    tagline: 'Macro orbit, lighting sweep, specular highlights — commercial b-roll in one sentence.',
    category: 'video',
    tool: 'text-to-video',
    promptTemplate:
      'product b-roll, macro orbit around {product}, studio lighting sweep, specular highlights, commercial aesthetic',
    tags: ['product', 'b-roll', 'commercial', 'orbit', 'macro', 'advertising'],
    badge: 'template',
  },
  {
    id: 'logo-sting',
    name: 'Logo Sting',
    tagline: 'Particles converge into a mark, then the light bursts — the reveal, earned.',
    category: 'video',
    tool: 'text-to-video',
    promptTemplate:
      'abstract logo reveal sting, particles converging into {brand mark concept}, dark background, dramatic light burst',
    tags: ['logo', 'sting', 'reveal', 'ident', 'particles', 'branding'],
    badge: 'template',
  },
  {
    id: 'nature-loop',
    name: 'Nature Loop',
    tagline: 'Gentle parallax wind under volumetric light — a seamless five-second breath.',
    category: 'video',
    tool: 'text-to-video',
    promptTemplate:
      'seamless nature loop, {landscape}, gentle parallax wind, soft volumetric light, 5 seconds',
    tags: ['nature', 'loop', 'landscape', 'seamless', 'ambient', 'looping'],
    badge: 'template',
  },
  {
    id: 'city-timelapse',
    name: 'City Timelapse',
    tagline: 'Day collapses into night, traffic becomes light trails — the long-exposure city.',
    category: 'video',
    tool: 'text-to-video',
    promptTemplate:
      'city timelapse, {city} traffic light trails, day-to-night transition, long exposure streaks',
    tags: ['timelapse', 'city', 'traffic', 'day to night', 'long exposure', 'urban'],
    badge: 'template',
  },
  {
    id: 'abstract-loop',
    name: 'Abstract Motion Loop',
    tagline: 'Fluid ink in water at macro distance — a hypnotic, seamless rhythm.',
    category: 'video',
    tool: 'text-to-video',
    promptTemplate:
      'abstract generative motion loop, {palette} fluid ink in water, macro, hypnotic rhythm, seamless',
    tags: ['abstract', 'loop', 'fluid', 'ink', 'macro', 'hypnotic'],
    badge: 'template',
  },
  {
    id: 'social-reel',
    name: 'Social Vertical Reel',
    tagline: 'Whip-pans and punchy color in 9:16 — trend-ready before breakfast.',
    category: 'video',
    tool: 'text-to-video',
    promptTemplate:
      'vertical social reel of {subject}, dynamic whip-pan transitions, punchy colors, trend-ready, 9:16',
    tags: ['social', 'reel', 'vertical', '9:16', 'tiktok', 'shorts', 'whip pan'],
    badge: 'template',
  },
  {
    id: 'animatic',
    name: 'Animatic (Storyboard)',
    tagline: 'Sketchy linework with 2D camera moves — storyboard pacing before the polish.',
    category: 'video',
    tool: 'text-to-video',
    promptTemplate:
      'rough animatic of {scene}, sketchy linework, 2D camera moves, storyboard pacing',
    tags: ['animatic', 'storyboard', 'sketch', 'previs', 'planning'],
    badge: 'template',
  },
  {
    id: 'animated-poster',
    name: 'Animated Poster',
    tagline: 'Parallax layers and drifting light particles — a poster that breathes.',
    category: 'video',
    tool: 'text-to-video',
    promptTemplate:
      'animated poster of {subject}, subtle parallax layers, drifting light particles, title-safe composition',
    tags: ['poster', 'animated', 'parallax', 'motion graphics', 'cinemagraph poster'],
    badge: 'template',
  },
  {
    id: 'liquid-ink',
    name: 'Liquid / Ink Motion',
    tagline: 'A macro drop of pigment blooming in water — fine art on a black ground.',
    category: 'video',
    tool: 'text-to-video',
    promptTemplate:
      'macro ink drop in water, {color} pigment plumes, slow motion, black background, fine art',
    tags: ['ink', 'liquid', 'macro', 'slow motion', 'fine art', 'pigment'],
    badge: 'template',
  },
  {
    id: 'particle-flow',
    name: 'Particle Flow',
    tagline: 'A million glowing particles assembling a subject out of the dark void.',
    category: 'video',
    tool: 'text-to-video',
    promptTemplate:
      'GPU particle simulation, {million} glowing particles forming {subject}, dark void, ambient motion',
    tags: ['particles', 'simulation', 'gpu', 'glow', 'void', 'abstract'],
    badge: 'template',
  },
  {
    id: 'kinetic-type',
    name: 'Kinetic Typography',
    tagline: 'Type in motion — experimental, because text rendering in video models is still unreliable.',
    category: 'video',
    tool: 'text-to-video',
    promptTemplate:
      'kinetic typography of the phrase {phrase}, bold grotesque letters, rhythmic scale and tracking, high contrast',
    tags: ['typography', 'kinetic', 'type', 'text', 'motion design', 'experimental'],
    badge: 'experimental',
  },
  {
    id: 'image-to-video',
    name: 'Image → Video (Animate Still)',
    tagline: 'The canvas image becomes the first frame — the native animate-a-still pass.',
    category: 'video',
    tool: 'image-to-video',
    capabilities: ['imageToVideo'],
    tags: ['image to video', 'animate', 'still', 'i2v', 'first frame'],
    badge: 'native',
  },
  {
    id: 'cinemagraph',
    name: 'Photo Cinemagraph',
    tagline: 'Animate one element, freeze the rest — the seamless loop that only whispers.',
    category: 'video',
    tool: 'image-to-video',
    promptTemplate:
      'animate only {element} of this still, subtle seamless loop, everything else motionless, cinemagraph',
    tags: ['cinemagraph', 'loop', 'subtle', 'photo', 'living photo'],
    badge: 'template',
  },
  {
    id: 'character-turnaround',
    name: 'Character Turnaround',
    tagline: 'A slow 360 on the studio turntable — identity held, every angle revealed.',
    category: 'video',
    tool: 'image-to-video',
    promptTemplate:
      'slow 360 rotation of this character, consistent identity, neutral studio turntable',
    tags: ['turnaround', 'character', 'rotation', '360', 'model sheet', 'turntable'],
    badge: 'template',
  },
  {
    id: 'ken-burns',
    name: 'Pan & Zoom (Ken Burns)',
    tagline: 'The documentary classic — a slow push-in with a little parallax depth.',
    category: 'video',
    tool: 'image-to-video',
    promptTemplate:
      'slow ken burns push-in on this image, gentle parallax depth, documentary feel',
    tags: ['ken burns', 'pan', 'zoom', 'documentary', 'push in', 'parallax'],
    badge: 'template',
  },
  {
    id: 'first-frame-story',
    name: 'First Frame → Story',
    tagline: 'Continue the shot as a scene — natural camera continuation, coherent motion.',
    category: 'video',
    tool: 'image-to-video',
    promptTemplate:
      'continue this shot as a {mood} scene, natural camera continuation, coherent motion',
    tags: ['first frame', 'story', 'continuation', 'scene', 'sequence'],
    badge: 'template',
  },
  {
    id: 'loop-artwork',
    name: 'Loop an Artwork',
    tagline: 'A breathing, hypnotic cycle with no cuts — the artwork that never ends.',
    category: 'video',
    tool: 'image-to-video',
    promptTemplate:
      'seamlessly loop this artwork, breathing motion, hypnotic cycle, no cuts',
    tags: ['loop', 'artwork', 'seamless', 'breathing', 'cycle', 'endless'],
    badge: 'template',
  },
  {
    id: 'video-style-remix',
    name: 'Video Style Remix',
    tagline: 'Re-render the frame in a new style and animate it — an experimental i2v chain.',
    category: 'video',
    tool: 'image-to-video',
    promptTemplate:
      're-render this frame in {style} and animate it, keep composition and subject',
    tags: ['remix', 'style', 're-render', 'restyle', 'video', 'experimental'],
    badge: 'experimental',
  },
]

// ————————————————————————————————————————————————————————————————
// AUDIO — 14
// ————————————————————————————————————————————————————————————————

const AUDIO_TOOLS: CatalogTool[] = [
  {
    id: 'text-to-music',
    name: 'Text to Music',
    tagline: 'Describe a groove, get a bed — procedural synth now, musicgen with a key.',
    category: 'audio',
    tool: 'music',
    capabilities: ['textToMusic'],
    tags: ['music', 'text to music', 'audio', 'soundtrack', 'score', 'synth'],
    badge: 'native',
  },
  {
    id: 'lofi-loop',
    name: 'Lo-Fi Loop',
    tagline: 'Dusty vinyl crackle over mellow keys — the loop that studies, works and drifts to.',
    category: 'audio',
    tool: 'music',
    promptTemplate:
      'lo-fi hip hop loop, dusty vinyl crackle, mellow keys, soft swing drums, warm tape saturation',
    tags: ['lofi', 'lo-fi', 'chill', 'vinyl', 'study', 'hip hop'],
    badge: 'template',
  },
  {
    id: 'synthwave',
    name: 'Synthwave Track',
    tagline: 'Arpeggiated saws and gated drums — neon nostalgia at a steady 80.',
    category: 'audio',
    tool: 'music',
    promptTemplate:
      'retro synthwave, arpeggiated saw bass, gated reverb drums, neon nostalgia, 80 BPM',
    tags: ['synthwave', 'retrowave', '80s', 'neon', 'arpeggio', 'outrun'],
    badge: 'template',
  },
  {
    id: 'ambient-pad',
    name: 'Ambient Pad',
    tagline: 'An evolving drone with granular detail — space you can stand inside.',
    category: 'audio',
    tool: 'music',
    promptTemplate:
      'deep ambient pad, evolving drone texture, sparse granular detail, meditation tempo',
    tags: ['ambient', 'drone', 'pad', 'meditation', 'granular', 'calm'],
    badge: 'template',
  },
  {
    id: 'epic-trailer',
    name: 'Epic Trailer Cue',
    tagline: 'Staccato ostinato, rising braams, choir swell — the cue that sells the spectacle.',
    category: 'audio',
    tool: 'music',
    promptTemplate:
      'epic trailer cue, staccato ostinato, rising braams, choir swell, cinematic percussion, minor key',
    tags: ['trailer', 'epic', 'cinematic', 'braam', 'choir', 'ostinato'],
    badge: 'template',
  },
  {
    id: 'corporate-uplift',
    name: 'Corporate Uplifting',
    tagline: 'Bright plucks on a steady four-on-floor — optimism by the yard.',
    category: 'audio',
    tool: 'music',
    promptTemplate:
      'uplifting corporate underscore, bright plucks, steady four-on-floor, optimistic major key',
    tags: ['corporate', 'uplifting', 'presentation', 'optimistic', 'commercial', 'background'],
    badge: 'template',
  },
  {
    id: 'hiphop-beat',
    name: 'Hip-Hop Beat',
    tagline: 'Fat kick, crisp snare, chopped-sample feel — headnod mathematics at 90 BPM.',
    category: 'audio',
    tool: 'music',
    promptTemplate:
      'boom bap hip hop beat, fat kick, crisp snare, chopped sample feel, headnod groove, 90 BPM',
    tags: ['hip hop', 'beat', 'boom bap', 'drums', '90 bpm', 'headnod'],
    badge: 'template',
  },
  {
    id: 'house-groove',
    name: 'House Groove',
    tagline: 'Rolling bassline, shuffled hats, filtered chords — warm club air at 124.',
    category: 'audio',
    tool: 'music',
    promptTemplate:
      'deep house groove, rolling bassline, shuffled hats, filtered chords, warm club feel, 124 BPM',
    tags: ['house', 'deep house', 'club', 'groove', '124 bpm', 'dance'],
    badge: 'template',
  },
  {
    id: 'jazz-lounge',
    name: 'Jazz Lounge',
    tagline: 'Brushed drums, walking bass, smoky sax — the late set at the corner table.',
    category: 'audio',
    tool: 'music',
    promptTemplate:
      'late-night jazz lounge trio, brushed drums, walking bass, smoky sax lead, relaxed swing',
    tags: ['jazz', 'lounge', 'sax', 'swing', 'trio', 'late night'],
    badge: 'template',
  },
  {
    id: 'folk-acoustic',
    name: 'Folk Acoustic',
    tagline: 'Fingerpicked guitar and brushed mandolin, close-mic intimate.',
    category: 'audio',
    tool: 'music',
    promptTemplate:
      'indie folk acoustic, fingerpicked guitar, brushed mandolin, intimate close-mic warmth',
    tags: ['folk', 'acoustic', 'indie', 'guitar', 'mandolin', 'intimate'],
    badge: 'template',
  },
  {
    id: 'cinematic-minimal',
    name: 'Cinematic Minimal',
    tagline: 'A sparse piano motif over a low string pulse — tension and space, nothing wasted.',
    category: 'audio',
    tool: 'music',
    promptTemplate:
      'minimal cinematic score, sparse piano motif, low strings pulse, tension and space',
    tags: ['minimal', 'cinematic', 'score', 'piano', 'tension', 'sparse'],
    badge: 'template',
  },
  {
    id: 'chiptune',
    name: 'Chiptune Loop',
    tagline: 'Square-wave lead, noise-channel percussion — the NES tracker lives.',
    category: 'audio',
    tool: 'music',
    promptTemplate:
      'chiptune loop, 8-bit square lead, noise-channel percussion, NES tracker aesthetic',
    tags: ['chiptune', '8-bit', 'nes', 'retro game', 'square wave', 'tracker'],
    badge: 'template',
  },
  {
    id: 'drum-track',
    name: 'Drum Track',
    tagline: 'Drums alone — punchy kick, tight snare, ghost-note hats, fill every four.',
    category: 'audio',
    tool: 'music',
    promptTemplate:
      'drum track only: punchy kick, tight snare, ghost-note hats, fill every 4 bars, {genre} groove',
    tags: ['drums', 'percussion', 'beat', 'groove', 'stems', 'backing'],
    badge: 'template',
  },
  {
    id: 'soundbed',
    name: 'Soundbed (30 s)',
    tagline: 'A neutral wash for voiceover — soft pads, sub anchor, no melody to fight the words.',
    category: 'audio',
    tool: 'music',
    promptTemplate:
      'neutral soundbed for voiceover, soft pad wash, sub-bass anchor, no melody, 30 seconds',
    tags: ['soundbed', 'voiceover', 'bed', 'underscore', 'neutral', 'narration'],
    badge: 'template',
  },
]

// ————————————————————————————————————————————————————————————————
// VOICE — 8
// ————————————————————————————————————————————————————————————————

const VOICE_TOOLS: CatalogTool[] = [
  {
    id: 'text-to-speech',
    name: 'Text to Speech',
    tagline: 'Seven voices, one text area — the native speech engine reads it back.',
    category: 'voice',
    tool: 'speech',
    capabilities: ['textToSpeech'],
    tags: ['speech', 'tts', 'voice', 'narration', 'text to speech', 'audio'],
    badge: 'native',
  },
  {
    id: 'narrator-vo',
    name: 'Narrator Voiceover',
    tagline: 'The movie-trailer register, loaded and ready — edit the line, pick the voice.',
    category: 'voice',
    tool: 'speech',
    promptTemplate: 'In a world of endless canvases, one ember remains.',
    tags: ['narrator', 'voiceover', 'vo', 'trailer', 'movie', 'narration'],
    badge: 'template',
  },
  {
    id: 'audiobook-chapter',
    name: 'Audiobook Chapter Read',
    tagline: 'A chapter opening read at book pace — warm, patient, unhurried.',
    category: 'voice',
    tool: 'speech',
    promptTemplate:
      'Chapter One. The studio was quiet, the machines patient, and the ember still warm.',
    tags: ['audiobook', 'chapter', 'book', 'read', 'long form', 'narration'],
    badge: 'template',
  },
  {
    id: 'podcast-intro',
    name: 'Podcast Intro Read',
    tagline: 'The show-open read — bright, branded, and straight to the point.',
    category: 'voice',
    tool: 'speech',
    promptTemplate:
      'Welcome back to FireLab Sessions — where local engines and open tools collide.',
    tags: ['podcast', 'intro', 'show', 'open', 'radio', 'host'],
    badge: 'template',
  },
  {
    id: 'character-voice',
    name: 'Character Voice',
    tagline: 'Sculpt a character read by pairing voice and speed — xiaochen slow, jam formal, chuichui playful.',
    category: 'voice',
    tool: 'speech',
    tags: ['character', 'voice acting', 'speed', 'persona', 'casting'],
    badge: 'template',
  },
  {
    id: 'fast-draft',
    name: 'Fast-Draft Voice',
    tagline: 'A quick read at 1.5× for timing cuts and drafts — the panel opens pre-set to speed.',
    category: 'voice',
    tool: 'speech',
    tags: ['draft', 'fast', 'speed', 'scratch', 'timing', 'preview'],
    badge: 'template',
  },
  {
    id: 'transcribe-audio',
    name: 'Transcribe Audio',
    tagline: 'Drop an audio file, get the words — the native speech → text pass.',
    category: 'voice',
    tool: 'transcribe',
    capabilities: ['speechToText'],
    tags: ['transcribe', 'asr', 'speech to text', 'audio', 'dictation', 'whisper'],
    badge: 'native',
  },
  {
    id: 'voice-to-prompt',
    name: 'Voice → Prompt',
    tagline: 'Say the prompt out loud, transcribe it, then fire it straight into Text to Image.',
    category: 'voice',
    tool: 'transcribe',
    tags: ['voice', 'prompt', 'workflow', 'hands free', 'dictate', 'use as prompt'],
    badge: 'template',
  },
]

// ————————————————————————————————————————————————————————————————
// TEXT — 12
// ————————————————————————————————————————————————————————————————

const TEXT_TOOLS: CatalogTool[] = [
  {
    id: 'prompt-enhance',
    name: 'Prompt Enhance',
    tagline: 'Switches to Generate and fires the Enhance pass — an LLM rewrite of your current prompt.',
    category: 'text',
    tool: 'generate',
    capabilities: ['promptEnhance'],
    tags: ['enhance', 'prompt', 'rewrite', 'llm', 'improve', 'cinematic'],
    badge: 'native',
  },
  {
    id: 'negative-builder',
    name: 'Negative Prompt Builder',
    tagline: 'A battle-tested starter block for the negative field — shown by providers that take negatives.',
    category: 'text',
    tool: 'generate',
    promptTemplate:
      'blurry, low contrast, jpeg artifacts, watermark, text, logo, signature, extra limbs, deformed hands, oversaturated, flat lighting',
    prefillField: 'negativePrompt',
    tags: ['negative', 'negative prompt', 'exclude', 'avoid', 'blocklist'],
    badge: 'template',
  },
  {
    id: 'prompt-variations',
    name: 'Prompt Variations (×5)',
    tagline: 'Run Enhance repeatedly for five distinct rewrites — each pass takes the last result further.',
    category: 'text',
    tool: 'generate',
    promptTemplate: 'five distinct one-paragraph rewrites of: {prompt}',
    tags: ['variations', 'rewrites', 'iterations', 'prompt', 'options'],
    badge: 'template',
  },
  {
    id: 'moodboard-words',
    name: 'Moodboard Words',
    tagline: 'Twenty art-directed keywords, grouped by light, palette, texture and mood.',
    category: 'text',
    tool: 'generate',
    promptTemplate:
      'a moodboard of words for {subject}: 20 evocative, art-directed keywords grouped by light, palette, texture, mood',
    tags: ['moodboard', 'words', 'keywords', 'art direction', 'language'],
    badge: 'template',
  },
  {
    id: 'style-keywords',
    name: 'Style Keyword Pack',
    tagline: 'A dense comma-separated kit — lens, light, grade, palette, era, mood.',
    category: 'text',
    tool: 'generate',
    promptTemplate:
      'dense style keyword pack for {style} image prompts: lens, light, grade, palette, era, mood — comma separated',
    tags: ['style', 'keywords', 'pack', 'cheat sheet', 'lens', 'grade'],
    badge: 'template',
  },
  {
    id: 'cinematic-rewrite',
    name: 'Cinematic Rewrite',
    tagline: 'Your idea, rewritten with shot, lens, lighting, grade and grain.',
    category: 'text',
    tool: 'generate',
    promptTemplate:
      'rewrite this as a cinematic prompt: {prompt} — shot, lens, lighting, grade, grain',
    tags: ['cinematic', 'rewrite', 'film', 'prompt', 'lens'],
    badge: 'template',
  },
  {
    id: 'editorial-rewrite',
    name: 'Editorial Rewrite',
    tagline: 'Your idea, rewritten as a magazine brief — publication, mood, styling, lens.',
    category: 'text',
    tool: 'generate',
    promptTemplate:
      'rewrite this as an editorial photography prompt: {prompt} — publication, mood, styling, lens',
    tags: ['editorial', 'rewrite', 'magazine', 'photography', 'prompt'],
    badge: 'template',
  },
  {
    id: 'general-rewrite',
    name: 'General Rewrite',
    tagline: 'Clarity and visual specificity — the plain-clothes rewrite pass.',
    category: 'text',
    tool: 'generate',
    promptTemplate: 'rewrite for clarity and visual specificity: {prompt}',
    tags: ['rewrite', 'clarity', 'specificity', 'general', 'prompt'],
    badge: 'template',
  },
  {
    id: 'prompt-shortener',
    name: 'Prompt Shortener',
    tagline: 'Under thirty words, nothing visual lost — the distillation pass.',
    category: 'text',
    tool: 'generate',
    promptTemplate:
      'compress to under 30 words without losing visual information: {prompt}',
    tags: ['shorten', 'compress', 'distill', 'concise', 'prompt'],
    badge: 'template',
  },
  {
    id: 'prompt-expander',
    name: 'Prompt Expander',
    tagline: 'Concrete details, materials and light — grow the prompt until it photographs itself.',
    category: 'text',
    tool: 'generate',
    promptTemplate: 'expand with concrete visual details, materials, and light: {prompt}',
    tags: ['expand', 'detail', 'materials', 'light', 'rich prompt'],
    badge: 'template',
  },
  {
    id: 'camera-language',
    name: 'Camera Language Helper',
    tagline: 'The cheat-sheet for a shot type — angle, lens, distance, movement, and what each says.',
    category: 'text',
    tool: 'generate',
    promptTemplate:
      'camera language cheat-sheet for {shot type}: angle, lens, distance, movement, and what each communicates',
    tags: ['camera', 'lens', 'angle', 'shot', 'movement', 'language'],
    badge: 'template',
  },
  {
    id: 'lighting-language',
    name: 'Lighting Language Helper',
    tagline: 'The cheat-sheet for a mood — key style, ratio, temperature, practical sources.',
    category: 'text',
    tool: 'generate',
    promptTemplate:
      'lighting design cheat-sheet for {mood}: key style, ratio, color temperature, practical sources',
    tags: ['lighting', 'light design', 'mood', 'ratio', 'temperature', 'practicals'],
    badge: 'template',
  },
]

// ————————————————————————————————————————————————————————————————
// REFERENCE — 4
// ————————————————————————————————————————————————————————————————

const REFERENCE_TOOLS: CatalogTool[] = [
  {
    id: 'find-references',
    name: 'Find Reference Images',
    tagline: 'Web image lookup through the built-in engine — captioned results, one click to canvas.',
    category: 'reference',
    tool: 'image-search',
    capabilities: ['imageSearch'],
    tags: ['reference', 'search', 'images', 'web', 'moodboard', 'inspiration'],
    badge: 'native',
  },
  {
    id: 'moodboard-search',
    name: 'Moodboard Search',
    tagline: 'A whole moodboard in one query — photography collections, pre-filtered.',
    category: 'reference',
    tool: 'image-search',
    promptTemplate: '{subject} moodboard photography collection',
    tags: ['moodboard', 'search', 'collection', 'reference', 'board'],
    badge: 'template',
  },
  {
    id: 'color-reference',
    name: 'Color Reference Search',
    tagline: 'Hunt a palette in the wild — photographs that already live in your colors.',
    category: 'reference',
    tool: 'image-search',
    promptTemplate: '{palette} color palette photography',
    tags: ['color', 'palette', 'reference', 'search', 'grade'],
    badge: 'template',
  },
  {
    id: 'style-reference',
    name: 'Style Reference Search',
    tagline: 'Find the aesthetic before you chase it — style-named photography from the web.',
    category: 'reference',
    tool: 'image-search',
    promptTemplate: '{style} aesthetic photography',
    tags: ['style', 'aesthetic', 'reference', 'search', 'look'],
    badge: 'template',
  },
]

// ————————————————————————————————————————————————————————————————
// UTILITY — 10 (all local)
// ————————————————————————————————————————————————————————————————

const UTILITY_TOOLS: CatalogTool[] = [
  {
    id: 'crop',
    name: 'Crop',
    tagline: 'Center-crop to a target aspect — mask-aware, one undo step, no provider needed.',
    category: 'utility',
    tool: 'adjust',
    local: true,
    tags: ['crop', 'aspect', 'trim', 'framing', 'local'],
    badge: 'local',
  },
  {
    id: 'flip-horizontal',
    name: 'Flip Horizontal',
    tagline: 'Mirror the frame — the mask travels with it, still aligned.',
    category: 'utility',
    tool: 'adjust',
    local: true,
    tags: ['flip', 'mirror', 'horizontal', 'transform', 'local'],
    badge: 'local',
  },
  {
    id: 'flip-vertical',
    name: 'Flip Vertical',
    tagline: 'Turn the frame upside down — mask carried, alignment kept.',
    category: 'utility',
    tool: 'adjust',
    local: true,
    tags: ['flip', 'vertical', 'mirror', 'transform', 'local'],
    badge: 'local',
  },
  {
    id: 'rotate-90',
    name: 'Rotate 90°',
    tagline: 'Quarter turn — the canvas re-dimensions itself around the turn.',
    category: 'utility',
    tool: 'adjust',
    local: true,
    tags: ['rotate', '90', 'turn', 'orientation', 'local'],
    badge: 'local',
  },
  {
    id: 'grayscale',
    name: 'Grayscale',
    tagline: 'Drain the color, keep the light — one-click monochrome.',
    category: 'utility',
    tool: 'adjust',
    local: true,
    tags: ['grayscale', 'monochrome', 'black and white', 'grade', 'local'],
    badge: 'local',
  },
  {
    id: 'warm-grade',
    name: 'Warm Grade',
    tagline: 'Sepia-warm saturation mix — the amber end of the scale.',
    category: 'utility',
    tool: 'adjust',
    local: true,
    tags: ['warm', 'sepia', 'grade', 'tone', 'amber', 'local'],
    badge: 'local',
  },
  {
    id: 'cool-grade',
    name: 'Cool Grade',
    tagline: 'A cool hue shift with a breath of brightness — the tungsten antidote.',
    category: 'utility',
    tool: 'adjust',
    local: true,
    tags: ['cool', 'grade', 'hue', 'tone', 'local'],
    badge: 'local',
  },
  {
    id: 'contrast-brightness',
    name: 'Contrast & Brightness',
    tagline: 'Two sliders, live preview, one undo step on release.',
    category: 'utility',
    tool: 'adjust',
    local: true,
    tags: ['contrast', 'brightness', 'tone', 'sliders', 'levels', 'local'],
    badge: 'local',
  },
  {
    id: 'vignette',
    name: 'Vignette',
    tagline: 'A radial darkening at the edges — attention, guided inward.',
    category: 'utility',
    tool: 'adjust',
    local: true,
    tags: ['vignette', 'radial', 'edges', 'focus', 'local'],
    badge: 'local',
  },
  {
    id: 'sharpen',
    name: 'Sharpen',
    tagline: 'A 3×3 convolution pass — edge acutance, dialled by hand.',
    category: 'utility',
    tool: 'adjust',
    local: true,
    tags: ['sharpen', 'unsharp', 'detail', 'convolution', 'acutance', 'local'],
    badge: 'local',
  },
]

export const TOOLS_CATALOG: CatalogTool[] = [
  ...IMAGE_TOOLS,
  ...VIDEO_TOOLS,
  ...AUDIO_TOOLS,
  ...VOICE_TOOLS,
  ...TEXT_TOOLS,
  ...REFERENCE_TOOLS,
  ...UTILITY_TOOLS,
]
