/**
 * Tokens de color del tema.
 *
 * POR QUE EXISTE: los mismos colores se usan en TypeScript (canvas, estilos
 * en linea) y en CSS. Tenerlos en un solo sitio evita que el azul del canvas
 * y el azul del boton se vayan separando con el tiempo.
 *
 * Los nombres coinciden con las variables CSS de theme/global.css.
 */

export const colors = {
  /** Fondo principal, casi negro azulado. */
  azul950: '#05070f',
  azul900: '#0a0e1c',
  azul800: '#121a30',
  /** Azul de marca, para acentos y bordes activos. */
  azulReal: '#1e3a8a',
  /** Cian de interaccion: foco, enlaces, estados activos. */
  cian: '#22d3ee',
  cianHi: '#67e8f9',
  /** Oro de marca, reservado para lo que debe destacar de verdad. */
  oro: '#c9a227',
  oroMed: '#a8861f',
  oroHi: '#e8c65a',
  /** Texto principal y secundario. */
  txt: '#e8ecf5',
  txtSuave: '#9aa4bd',
} as const;

export type ThemeColors = typeof colors;
