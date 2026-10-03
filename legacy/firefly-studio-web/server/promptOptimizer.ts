import { invokeLLM, listLLMModels } from "./_core/llm";
import type { StudioMode } from "./imageService";

const MAX_ITERATIONS = 3;
const SATURATION_SCORE = 95;
const MIN_MEANINGFUL_IMPROVEMENT = 4;

export type PromptOptimizationInput = {
  mode: StudioMode;
  prompt: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  steps?: number;
  styleStrength?: number;
};

export type PromptOptimizationResult = {
  originalPrompt: string;
  optimizedPrompt: string;
  iterations: number;
  qualityScore: number;
  saturated: boolean;
};

type OptimizerResponse = {
  optimized_prompt: string;
  quality_score: number;
  improved: boolean;
  saturated: boolean;
};

let optimizerModel: string | undefined;

function clampScore(value: unknown) {
  const score = typeof value === "number" ? value : Number(value);
  return Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0;
}

function modeBrief(mode: StudioMode) {
  switch (mode) {
    case "generative-fill":
      return "edición localizada con máscara: conservar lo no enmascarado y describir una integración coherente";
    case "style-reference":
      return "transferencia de estilo: conservar sujeto y composición base, traducir lenguaje visual de la referencia";
    case "parametric-adjust":
      return "edición instructiva: preservar identidad, encuadre y detalles importantes mientras se aplica el cambio";
    default:
      return "generación de imagen desde texto con dirección visual completa";
  }
}

async function resolveOptimizerModel() {
  if (optimizerModel !== undefined) return optimizerModel;

  try {
    const catalog = await listLLMModels();
    const ids = catalog.data.map(model => model.id);
    const preferred = [
      "claude-opus-4-7",
      "gpt-5.5",
      "gemini-3.1-pro-preview",
      "claude-sonnet-4-6",
      "gpt-5",
      "gpt-5-mini",
    ];
    optimizerModel = preferred.find(id => ids.includes(id)) ?? ids[0];
  } catch (error) {
    console.warn("[PromptOptimizer] Could not discover LLM catalog; using provider default", error);
    optimizerModel = undefined;
  }

  return optimizerModel;
}

function safeJson(content: unknown): OptimizerResponse | undefined {
  if (typeof content !== "string") return undefined;
  try {
    const parsed = JSON.parse(content) as Partial<OptimizerResponse>;
    if (typeof parsed.optimized_prompt !== "string" || !parsed.optimized_prompt.trim()) return undefined;
    return {
      optimized_prompt: parsed.optimized_prompt.trim(),
      quality_score: clampScore(parsed.quality_score),
      improved: Boolean(parsed.improved),
      saturated: Boolean(parsed.saturated),
    };
  } catch {
    return undefined;
  }
}

function fallbackPrompt(input: PromptOptimizationInput) {
  const constraints = [
    input.aspectRatio ? `Composición ${input.aspectRatio}.` : "",
    input.width && input.height ? `Lienzo objetivo de ${input.width} × ${input.height} píxeles.` : "",
    input.steps ? `Acabado deliberado en ${input.steps} pasadas de calidad.` : "",
    input.mode === "style-reference" ? `Intensidad de referencia visual ${Math.round((input.styleStrength ?? 0.8) * 100)}%.` : "",
  ].filter(Boolean).join(" ");
  return `${input.prompt.trim()} ${constraints}`.trim();
}

export async function optimizePrompt(input: PromptOptimizationInput): Promise<PromptOptimizationResult> {
  const originalPrompt = input.prompt.trim();
  if (!originalPrompt) {
    return {
      originalPrompt,
      optimizedPrompt: originalPrompt,
      iterations: 0,
      qualityScore: 0,
      saturated: true,
    };
  }

  let currentPrompt = originalPrompt;
  let previousScore = 0;
  let iterations = 0;
  let saturated = false;
  let qualityScore = 0;

  try {
    const model = await resolveOptimizerModel();

    for (let pass = 0; pass < MAX_ITERATIONS; pass += 1) {
      const response = await invokeLLM({
        model,
        maxTokens: 700,
        messages: [
          {
            role: "system",
            content: [
              "Eres un director de arte experto en prompts para generación y edición de imágenes.",
              "Mejora el prompt sin inventar sujetos, texto, marcas, personas o requisitos que el usuario no haya pedido.",
              "Hazlo específico, visual, controlable y compatible con un motor de imágenes.",
              "Conserva la intención original. Añade únicamente detalles útiles: sujeto, composición, cámara, luz, materiales, atmósfera, color, acabado y restricciones.",
              "No muestres razonamiento, análisis ni explicaciones. Devuelve exclusivamente el JSON solicitado.",
            ].join(" "),
          },
          {
            role: "user",
            content: JSON.stringify({
              task: modeBrief(input.mode),
              original_prompt: originalPrompt,
              current_draft: currentPrompt,
              canvas: {
                aspect_ratio: input.aspectRatio ?? "1:1",
                width: input.width,
                height: input.height,
                quality_passes: input.steps ?? 4,
                style_strength: input.styleStrength,
              },
              pass: pass + 1,
              instruction: "Devuelve el mejor siguiente borrador. Si ya no hay una mejora material, conserva el borrador y marca saturated=true.",
            }),
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "optimized_image_prompt",
            strict: true,
            schema: {
              type: "object",
              properties: {
                optimized_prompt: { type: "string", minLength: 2 },
                quality_score: { type: "integer", minimum: 0, maximum: 100 },
                improved: { type: "boolean" },
                saturated: { type: "boolean" },
              },
              required: ["optimized_prompt", "quality_score", "improved", "saturated"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0]?.message.content;
      const parsed = safeJson(content);
      if (!parsed) break;

      iterations = pass + 1;
      qualityScore = parsed.quality_score;
      const improvement = qualityScore - previousScore;
      currentPrompt = parsed.optimized_prompt;
      saturated = parsed.saturated || qualityScore >= SATURATION_SCORE || (pass > 0 && improvement < MIN_MEANINGFUL_IMPROVEMENT);
      previousScore = qualityScore;
      if (saturated) break;
    }
  } catch (error) {
    console.warn("[PromptOptimizer] Falling back to deterministic prompt enrichment", error);
  }

  if (iterations === 0) {
    currentPrompt = fallbackPrompt(input);
    qualityScore = 60;
    saturated = true;
  }

  return {
    originalPrompt,
    optimizedPrompt: currentPrompt,
    iterations,
    qualityScore,
    saturated,
  };
}

export const promptOptimizerLimits = {
  maxIterations: MAX_ITERATIONS,
  saturationScore: SATURATION_SCORE,
  minMeaningfulImprovement: MIN_MEANINGFUL_IMPROVEMENT,
};
