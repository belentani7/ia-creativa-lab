/**
 * Puente con MiniMax para generar el brief de direccion de arte de un icono.
 *
 * POR QUE EXISTE: el estudio de iconos necesita una descripcion de que
 * representa cada simbolo antes de dibujarlo. Escribirla a mano para cientos
 * de repositorios no escala, asi que se delega en un modelo de texto.
 *
 * CLAVE OPCIONAL: si no hay VITE_MINIMAX_API_KEY, isMiniMaxConfigured()
 * devuelve false y la interfaz desactiva el boton con un aviso. La app sigue
 * funcionando sin clave; no se rompe ni se queda cargando para siempre.
 *
 * OJO: en Vite las variables VITE_* acaban en el bundle y son visibles para
 * cualquiera que abra la web. Por eso aqui solo se admite una clave de prueba
 * o de bajo limite, nunca una clave de produccion.
 */

/** Endpoint de chat de MiniMax. */
export const MINIMAX_DESIGN_URL = 'https://api.minimax.chat/v1/text/chatcompletion_v2';

const API_KEY = (import.meta.env.VITE_MINIMAX_API_KEY as string | undefined) ?? '';

/**
 * Indica si hay clave configurada.
 * La interfaz lo usa para desactivar el boton en vez de fallar al pulsarlo.
 */
export function isMiniMaxConfigured(): boolean {
  return API_KEY.trim().length > 0;
}

/** Resultado del brief: nombre corto, descripcion y paleta sugerida. */
export interface IconBrief {
  name: string;
  symbolDescription: string;
  palette: string[];
}

/** Extrae el primer objeto JSON que aparezca en un texto. */
function firstJson(text: string): Record<string, unknown> | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Pide a MiniMax un brief de direccion de arte para `subject`.
 * Devuelve null si no hay clave, si la red falla o si la respuesta no trae
 * un JSON utilizable: quien llama decide que hacer, no se lanza una excepcion
 * que tumbe la pantalla.
 */
export async function generateIconBrief(subject: string): Promise<IconBrief | null> {
  if (!isMiniMaxConfigured()) return null;
  try {
    const res = await fetch(MINIMAX_DESIGN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + API_KEY,
      },
      body: JSON.stringify({
        model: 'MiniMax-Text-01',
        messages: [
          {
            role: 'system',
            content:
              'Eres director de arte. Respondes solo con JSON valido, sin texto alrededor.',
          },
          {
            role: 'user',
            content:
              'Describe un icono para: ' +
              subject +
              '. Devuelve {"name":string,"symbolDescription":string,"palette":string[]} con la paleta en hexadecimal.',
          },
        ],
        temperature: 0.7,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content;
    if (!text) return null;
    const parsed = firstJson(text);
    if (!parsed) return null;
    return {
      name: String(parsed.name ?? subject),
      symbolDescription: String(parsed.symbolDescription ?? ''),
      palette: Array.isArray(parsed.palette) ? parsed.palette.map(String) : [],
    };
  } catch {
    return null;
  }
}
