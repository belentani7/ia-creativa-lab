import { generateImage, listImageModels } from "./_core/imageGeneration";
import type { GenerateImageOptions, ImageModelInfo } from "./_core/imageGeneration";
import { optimizePrompt } from "./promptOptimizer";

export type StudioMode =
  | "text-to-image"
  | "generative-fill"
  | "style-reference"
  | "parametric-adjust";

export type StudioGenerationInput = {
  mode: StudioMode;
  prompt: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  steps?: number;
  styleStrength?: number;
  imageBase64?: string;
  styleImageBase64?: string;
  maskBase64?: string;
};

export type StudioGenerationResult = {
  imageUrl: string;
  imageKey: string;
  engine: string;
  providerModel?: string;
  resolvedFallback: boolean;
  originalPrompt: string;
  optimizedPrompt: string;
  optimizationIterations: number;
  optimizationQualityScore: number;
};

const DEFAULT_PROVIDER_MODEL = "MODEL_GPT_IMAGE_2";
let modelCache: ImageModelInfo[] | null = null;

function normalize(value: string | undefined) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function base64ToOriginalImage(value: string | undefined, fallbackMimeType = "image/png") {
  if (!value) return undefined;
  const match = value.match(/^data:([^;]+);base64,([\s\S]*)$/);
  if (match) return { b64Json: match[2], mimeType: match[1] };
  return { b64Json: value.replace(/^data:[^,]+,/, ""), mimeType: fallbackMimeType };
}

async function getAvailableModels() {
  if (modelCache) return modelCache;
  try {
    const response = await listImageModels();
    modelCache = response.models;
  } catch (error) {
    console.warn("[ImageService] Could not list provider models; using default model", error);
    modelCache = [];
  }
  return modelCache;
}

async function resolveModel(mode: StudioMode) {
  const models = await getAvailableModels();
  const candidates = mode === "style-reference"
    ? ["flux1redux", "fluxredux", "model_flux_1_redux", "redux"]
    : mode === "parametric-adjust"
      ? ["instructpix2pix", "instructpix2pix", "model_instruct_pix2pix"]
      : [];

  const match = models.find(model => {
    const haystack = `${normalize(model.model)}${normalize(model.id)}`;
    return candidates.some(candidate => haystack.includes(normalize(candidate)));
  });

  return {
    providerModel: match?.model ?? DEFAULT_PROVIDER_MODEL,
    resolvedFallback: !match && candidates.length > 0,
  };
}

function keyFromUrl(url: string) {
  return url.replace(/^\/manus-storage\//, "");
}

function buildPrompt(input: StudioGenerationInput, resolvedFallback: boolean, prompt: string) {
  const ratio = input.aspectRatio ? `Use a ${input.aspectRatio} composition.` : "";
  const size = input.width && input.height
    ? `Target canvas ${input.width} by ${input.height} pixels.`
    : "";
  const steps = input.steps ? `Use a deliberate ${input.steps}-step quality pass.` : "";

  if (input.mode === "style-reference") {
    return [
      "Creative mode: STYLE REFERENCE.",
      "The second attached image is the style reference. Preserve the subject and composition from the first attached image while translating its color language, material, lighting and visual rhythm.",
      `Style reference intensity: ${Math.round((input.styleStrength ?? 0.8) * 100)}%.`,
      prompt,
      ratio,
      size,
      steps,
      resolvedFallback ? "The provider model is an approved fallback; prioritize faithful style transfer." : "Use the dedicated FLUX.1 Redux style-reference engine.",
    ].filter(Boolean).join(" ");
  }

  if (input.mode === "parametric-adjust") {
    return [
      "Creative mode: PARAMETRIC ADJUST.",
      "Apply the requested edit to the attached base image while preserving identity, framing and important details.",
      prompt,
      ratio,
      size,
      steps,
      resolvedFallback ? "The provider model is an approved fallback for the requested InstructPix2Pix behavior." : "Use the dedicated InstructPix2Pix editing engine.",
    ].filter(Boolean).join(" ");
  }

  if (input.mode === "generative-fill") {
    return [
      "Creative mode: GENERATIVE FILL.",
      "The first attached image is the base image and the second attached image is a binary mask where white pixels identify the area to replace. Keep all black-mask regions unchanged and create a seamless, photorealistic continuation inside white-mask regions.",
      prompt,
      ratio,
      size,
      steps,
    ].filter(Boolean).join(" ");
  }

  return [
    "Creative mode: TEXT TO IMAGE.",
    prompt,
    ratio,
    size,
    steps,
  ].filter(Boolean).join(" ");
}

export async function generateStudioImage(input: StudioGenerationInput): Promise<StudioGenerationResult> {
  if (!input.prompt.trim()) throw new Error("Prompt cannot be empty");
  const optimization = await optimizePrompt(input);
  const { providerModel, resolvedFallback } = await resolveModel(input.mode);
  const originalImages: NonNullable<GenerateImageOptions["originalImages"]> = [];

  if (input.mode === "style-reference") {
    const base = base64ToOriginalImage(input.imageBase64);
    const style = base64ToOriginalImage(input.styleImageBase64);
    if (!base || !style) throw new Error("Style Reference requires a base image and a style image");
    if (!base.b64Json || !style.b64Json) throw new Error("Style Reference images contain invalid data");
    originalImages.push(base, style);
  } else if (input.mode === "generative-fill") {
    const base = base64ToOriginalImage(input.imageBase64);
    const mask = base64ToOriginalImage(input.maskBase64, "image/png");
    if (!base || !mask) throw new Error("Generative Fill requires a base image and a mask");
    if (!base.b64Json || !mask.b64Json) throw new Error("Generative Fill images contain invalid data");
    originalImages.push(base, mask);
  } else if (input.mode === "parametric-adjust") {
    const base = base64ToOriginalImage(input.imageBase64);
    if (!base) throw new Error("Parametric Adjust requires a base image");
    if (!base.b64Json) throw new Error("Parametric Adjust base image contains invalid data");
    originalImages.push(base);
  }

  const result = await generateImage({
    prompt: buildPrompt(input, resolvedFallback, optimization.optimizedPrompt),
    originalImages,
    model: providerModel,
    quality: providerModel === DEFAULT_PROVIDER_MODEL ? "high" : undefined,
  });

  if (!result.url) throw new Error("Image provider returned no image URL");

  return {
    imageUrl: result.url,
    imageKey: keyFromUrl(result.url),
    engine: input.mode === "style-reference"
      ? "FLUX.1 Redux"
      : input.mode === "parametric-adjust"
        ? "InstructPix2Pix"
        : input.mode === "generative-fill"
          ? "Generative Fill"
          : "Manus Image Generation",
    providerModel,
    resolvedFallback,
    originalPrompt: optimization.originalPrompt,
    optimizedPrompt: optimization.optimizedPrompt,
    optimizationIterations: optimization.iterations,
    optimizationQualityScore: optimization.qualityScore,
  };
}
