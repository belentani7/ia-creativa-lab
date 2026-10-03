/**
 * Entrada de voz por reconocimiento del navegador.
 *
 * POR QUE EXISTE: escribir una pista sobre la prenda con el movil en la otra
 * mano es incomodo. Hablar es mas rapido y mas natural.
 *
 * USA LA WEB SPEECH API del navegador. No se envia audio a ningun servidor
 * propio ni hace falta clave. El reconocimiento puede no estar disponible
 * (Firefox, por ejemplo): en ese caso start() avisa por onError y no hace
 * nada mas, en vez de dejar la interfaz escuchando para siempre.
 */

export interface VoiceInputOptions {
  /** Idioma esperado, en formato BCP 47. */
  lang?: string;
  /** Se llama cada vez que hay texto reconocido, aunque sea parcial. */
  onResult: (transcript: string) => void;
  /** Se llama si no se puede escuchar, con el motivo. */
  onError?: (reason: string) => void;
  /** Se llama cuando el reconocimiento termina, con exito o no. */
  onEnd?: () => void;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

let current: SpeechRecognitionLike | null = null;

const voiceInput = {
  isSupported(): boolean {
    return getCtor() !== null;
  },

  /** Empieza a escuchar. Si ya estaba escuchando, reinicia. */
  start(options: VoiceInputOptions): void {
    const Ctor = getCtor();
    if (!Ctor) {
      options.onError?.('Este navegador no permite reconocimiento de voz.');
      return;
    }
    voiceInput.stop();
    const recognition = new Ctor();
    recognition.lang = options.lang ?? 'es-ES';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      let text = '';
      for (let i = 0; i < event.results.length; i += 1) {
        const alternative = event.results[i][0];
        if (alternative) text += alternative.transcript;
      }
      if (text.trim()) options.onResult(text.trim());
    };
    recognition.onerror = (event) => {
      // 'aborted' lo produce nuestro propio stop(); no es un fallo real.
      if (event.error && event.error !== 'aborted') options.onError?.(event.error);
    };
    recognition.onend = () => {
      current = null;
      options.onEnd?.();
    };

    current = recognition;
    recognition.start();
  },

  /** Deja de escuchar. Es seguro llamarlo aunque no se haya empezado. */
  stop(): void {
    if (!current) return;
    try {
      current.stop();
    } catch {
      /* ya estaba parado */
    }
    current = null;
  },
};

export default voiceInput;
