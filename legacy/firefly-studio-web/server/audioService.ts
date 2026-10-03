import { storageGetSignedUrl, storagePut } from "./storage";
import { transcribeAudio } from "./_core/voiceTranscription";

const MAX_AUDIO_BYTES = 16 * 1024 * 1024;
const ALLOWED_AUDIO_MIME_TYPES = new Set([
  "audio/webm",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/ogg",
  "audio/m4a",
  "audio/mp4",
]);

export type AudioTranscriptionInput = {
  userId: number;
  audioDataUrl: string;
  fileName: string;
  mimeType: string;
  language?: string;
  prompt?: string;
};

function extensionForMimeType(mimeType: string) {
  const extensionByMime: Record<string, string> = {
    "audio/webm": "webm",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "audio/wave": "wav",
    "audio/ogg": "ogg",
    "audio/m4a": "m4a",
    "audio/mp4": "m4a",
  };
  return extensionByMime[mimeType] ?? "audio";
}

function decodeAudioDataUrl(dataUrl: string, mimeType: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match || !ALLOWED_AUDIO_MIME_TYPES.has(match[1])) {
    throw new Error("El archivo de audio debe estar en un formato compatible codificado en Base64");
  }
  if (match[1] !== mimeType) {
    throw new Error("El tipo MIME declarado no coincide con el archivo de audio");
  }
  const buffer = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if (!buffer.length || buffer.length > MAX_AUDIO_BYTES) {
    throw new Error("El audio debe tener un tamaño entre 1 byte y 16 MB");
  }
  return buffer;
}

function safeFileName(name: string, fallbackExtension: string) {
  const basename = name
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 180);
  return basename.includes(".") ? basename : `${basename || "audio"}.${fallbackExtension}`;
}

export async function processAudioTranscription(input: AudioTranscriptionInput) {
  if (!ALLOWED_AUDIO_MIME_TYPES.has(input.mimeType)) {
    throw new Error("Formato de audio no compatible");
  }

  const audioBuffer = decodeAudioDataUrl(input.audioDataUrl, input.mimeType);
  const fileName = safeFileName(input.fileName, extensionForMimeType(input.mimeType));
  const stored = await storagePut(
    `audio/${input.userId}/${Date.now()}-${fileName}`,
    audioBuffer,
    input.mimeType,
  );
  const signedUrl = await storageGetSignedUrl(stored.key);
  const transcription = await transcribeAudio({
    audioUrl: signedUrl,
    language: input.language,
    prompt: input.prompt,
  });

  if ("error" in transcription) {
    throw new Error(transcription.error);
  }

  return {
    ...stored,
    fileName,
    mimeType: input.mimeType,
    transcript: transcription.text.trim(),
    language: transcription.language ?? input.language,
    durationSeconds: transcription.duration ? Math.round(transcription.duration) : undefined,
  };
}

export const audioLimits = {
  maxBytes: MAX_AUDIO_BYTES,
  mimeTypes: Array.from(ALLOWED_AUDIO_MIME_TYPES),
};
