/**
 * Cliente de la API de analisis de imagen.
 *
 * POR QUE EXISTE: las pantallas no deben saber como se llama el endpoint ni
 * como se construye la peticion. Aqui se centraliza la llamada y se traduce
 * la respuesta a los tipos que usan los componentes.
 *
 * MODO DEMO: si no hay VITE_API_BASE configurada, se devuelve un resultado de
 * ejemplo en vez de fallar. Asi la interfaz se puede recorrer entera antes de
 * tener el backend desplegado.
 */

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';

/** Resultado del analisis de una prenda. */
export interface Analysis {
  category: string;
  colors: string[];
  /** Etiquetas descriptivas: tejido, corte, estilo. */
  tags: string[];
  confidence: number;
}

/** Una coincidencia del catalogo. */
export interface Match {
  id: string;
  title: string;
  imageUrl: string;
  price: number;
  /** Puntuacion de parecido con la prenda analizada, de 0 a 1. */
  score: number;
}

async function post<T>(path: string, body: FormData | unknown): Promise<T> {
  const isForm = body instanceof FormData;
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: isForm ? undefined : { 'Content-Type': 'application/json' },
    body: isForm ? body : JSON.stringify(body),
  });
  if (!res.ok) throw new Error('La API respondio ' + res.status);
  return (await res.json()) as T;
}

/** Analiza una imagen subida por la persona usuaria. */
export async function analyzeImage(formData: FormData): Promise<Analysis> {
  if (!BASE) {
    return {
      category: 'top',
      colors: ['#1b1b1f', '#c9a227'],
      tags: ['demo', 'sin-backend'],
      confidence: 0,
    };
  }
  return post<Analysis>('/analyze', formData);
}

/** Busca coincidencias en el catalogo para una categoria dada. */
export async function getMatches(category: string): Promise<Match[]> {
  if (!BASE) return [];
  return post<Match[]>('/matches', { category });
}

/** Genera una imagen de lookbook a partir de la seleccion actual. */
export async function generateLookbook(payload: unknown): Promise<{ image: string }> {
  if (!BASE) return { image: '' };
  return post<{ image: string }>('/lookbook', payload);
}
