/**
 * Tipos compartidos de la experiencia BELENTANI Neural Icons.
 *
 * POR QUE EXISTE ESTE ARCHIVO: la app se sirve como codigo fuente en el
 * repositorio, y las interfaces describen la forma exacta que consumen
 * App.tsx y los componentes. Sin el, Vite no puede resolver las rutas
 * relativas y la compilacion falla.
 *
 * Las formas de aqui NO son inventadas: cada campo se deduce del uso real
 * de los componentes (repo.stats.stars, repo.iconConfig.accentColor, etc.).
 */

/** Categoria tematica de un repositorio dentro del catalogo. */
export type RepositoryCategory =
  | 'education'
  | 'art'
  | 'tooling'
  | 'audio'
  | 'web'
  | 'archive';

/** Lenguaje principal declarado por GitHub. */
export type PrimaryLanguage =
  | 'TypeScript'
  | 'JavaScript'
  | 'Python'
  | 'Java'
  | 'HTML'
  | 'CSS'
  | 'Shell'
  | 'GLSL'
  | (string & {});

/** Etiqueta tematica asociada a un repositorio. */
export interface Tag {
  id: string;
  label: string;
  category?: RepositoryCategory;
}

/** Metricas publicas del repositorio, tal como las expone la API de GitHub. */
export interface RepositoryStats {
  stars: number;
  forks: number;
  /** Numero de modulos o piezas publicadas dentro del repositorio. */
  modules?: number;
  /** Metricas adicionales de presentacion (clave -> valor). */
  metrics?: Record<string, number | string>;
}

/** Descripcion visual del icono generado para el repositorio. */
export interface IconConfig {
  /** Tipo de glifo base que dibuja el estudio de iconos. */
  glyphType: string;
  /** Texto humano que explica que representa el simbolo. */
  symbolDescription: string;
  accentColor: string;
  haloColor: string;
  puffGlow: number;
  /** Rasgos visuales activados para este icono. */
  features?: string[];
}

/**
 * Descripcion fisica de la "luz liquida" asociada al repositorio.
 * Los campos imitan propiedades opticas reales (indice de refraccion)
 * porque el fondo se renderiza con un canvas que las usa como uniformes.
 */
export interface LiquidLight {
  colorName: string;
  /** Color en notacion hex, usado directamente por el canvas. */
  hex: string;
  milkyGlow: number;
  refractiveIndex: number;
  /** Referencia o nota divulgativa que acompana al efecto. */
  scientificArticle?: string;
}

/** Un repositorio tal como lo presenta la experiencia. */
export interface Repository {
  id: string;
  name: string;
  tagline: string;
  description: string;
  longDescription: string;
  githubUrl: string;
  liveUrl?: string;
  primaryLanguage: PrimaryLanguage;
  languageColor: string;
  category: RepositoryCategory;
  tags: Tag[];
  stats: RepositoryStats;
  iconConfig: IconConfig;
  liquidLight: LiquidLight;
  /** Una sola palabra que resume el proyecto; se usa en las pantallas minimalistas. */
  singleWord: string;
  /** Marca los repositorios de contenido educativo (ManosAbiertas, Open School...). */
  isEducation: boolean;
  /** Orden explicito de aparicion; menor va antes. */
  priorityOrder: number;
}

/**
 * Modos de iluminacion. Los valores literales salen de los useState de App.tsx
 * y de las comparaciones lightingMode === '...' repartidas por los componentes.
 */
export type LightingMode =
  | 'ultra-noir-3'
  | 'noir-6'
  | 'noir-12'
  | 'plasma-full';

/** Vistas principales de la aplicacion. */
export type AppViewVersion =
  | 'cascade-3d'
  | 'smartwatch'
  | 'netflix'
  | 'zero-text';

/** Modo de cascada de Apple (haptics + transiciones). */
export type AppleCascadeMode = 'off' | 'subtle' | 'cinematic';
/** Categoria de una regla del motor de restricciones de diseno. */
export interface RuleCategory {
  /** Identificador corto usado como clave y en las comparaciones. */
  id: string;
  /** Descripcion que se muestra al pasar el raton. */
  desc: string;
}

/** Gravedad de una regla incumplida. */
export type RuleSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

/** Estado de aplicacion de una regla dentro de una escena concreta. */
export type RuleStatus = 'pass' | 'fail' | 'review';

/** Una regla generada por el motor de restricciones. */
export interface DesignEngineRule {
  id: string;
  category: string;
  /** Numero de prioridad maestro al que pertenece la regla. */
  priority: number;
  severity: RuleSeverity;
  /** Cuando se aplica la regla, en lenguaje natural. */
  condition: string;
  /** Que hay que hacer cuando se cumple la condicion. */
  action: string;
  /** Por que importa; es lo que hace la regla defendible ante otra persona. */
  rationale: string;
  /** Como comprobar que se ha aplicado bien. */
  validation: string;
  status?: RuleStatus;
}

/** Una prioridad maestra del sistema de diseno. */
export interface MasterPriority {
  level: string;
  number: number;
  title: string;
  summary: string;
  /** Principios o normas asociadas a esta prioridad. */
  laws: string[];
}

/** Resultado de evaluar la armonia de una escena. */
export interface HarmonyReport {
  /** Indice de armonia de 0 a 100. */
  harmonicIndex: number;
  /** Luminancia media de la atmosfera, en cd/m2. */
  atmosphereLuminance: number;
  /** Relacion de contraste medida; 4.5 es el minimo legible de WCAG AA. */
  contrastRatio: number;
}
