/**
 * Sintesis de voz.
 *
 * POR QUE EXISTE: la persona usuaria puede estar mirando la prenda, no la
 * pantalla. Poder escuchar la descripcion sin levantar la vista cambia si el
 * resultado se entiende o no.
 *
 * USA LA VOZ DEL SISTEMA (Web Speech API), no un servicio externo: no manda
 * texto a ningun servidor ni necesita clave. Si el navegador no la soporta,
 * speak() no hace nada en vez de lanzar un error que rompa la pantalla.
 */

export interface SpeakOptions {
  /** Idioma en formato BCP 47, por ejemplo 'es-ES'. */
  lang?: string;
  /** Velocidad; 1 es lo normal. */
  rate?: number;
  /** Tono; 1 es lo normal. */
  pitch?: number;
}

function synth(): SpeechSynthesis | null {
  if (typeof window === 'undefined') return null;
  return window.speechSynthesis ?? null;
}

const tts = {
  /** Indica si el navegador puede hablar. */
  isSupported(): boolean {
    return synth() !== null;
  },

  /**
   * Lee el texto en voz alta.
   * Corta lo que estuviera sonando antes: dos frases solapadas no se
   * entienden y suenan a fallo.
   */
  speak(text: string, options: SpeakOptions = {}): void {
    const s = synth();
    if (!s || !text.trim()) return;
    s.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.lang ?? 'es-ES';
    utterance.rate = options.rate ?? 1;
    utterance.pitch = options.pitch ?? 1;
    s.speak(utterance);
  },

  /** Detiene la lectura en curso. */
  stop(): void {
    synth()?.cancel();
  },
};

export default tts;
