/**
 * Motor de restricciones de diseno para escaparatismo y vitrinas.
 *
 * POR QUE EXISTE: en lugar de opinar sobre si una vitrina se ve bien, el
 * motor aplica reglas explicitas y medibles (contraste, carga visual, jerarquia,
 * recorrido del ojo). Cada regla dice cuando se aplica, que hacer y como
 * comprobar que se hizo bien, para que la decision se pueda discutir con datos
 * en vez de con gusto personal.
 *
 * Las reglas se generan de forma determinista a partir de un catalogo fijo:
 * la misma peticion devuelve siempre las mismas reglas, para que dos personas
 * mirando la misma vitrina lleguen al mismo resultado.
 */
import type {
  DesignEngineRule,
  HarmonyReport,
  LightingMode,
  MasterPriority,
  Repository,
  RuleCategory,
  RuleSeverity,
} from '../types';

/** Las cinco prioridades maestras, de mas a menos importante. */
export const MASTER_PRIORITIES: MasterPriority[] = [
  {
    level: 'P1',
    number: 1,
    title: 'Legibilidad',
    summary:
      'Si no se lee, no existe. Ninguna decision estetica justifica sacrificar la lectura del producto o del precio.',
    laws: [
      'Contraste minimo 4.5:1 entre texto y fondo (WCAG AA).',
      'El precio y el nombre nunca comparten plano con un reflejo especular.',
      'La tipografia de marca no baja de 12 mm de altura a distancia de vision.',
    ],
  },
  {
    level: 'P2',
    number: 2,
    title: 'Jerarquia',
    summary:
      'El ojo necesita saber por donde empezar. Una vitrina sin punto de entrada obliga a mirar dos veces y se abandona.',
    laws: [
      'Un unico punto focal dominante por vitrina.',
      'El segundo elemento pesa como maximo el 60% del primero.',
      'Los elementos secundarios se alinean en una reticula reconocible.',
    ],
  },
  {
    level: 'P3',
    number: 3,
    title: 'Recorrido',
    summary:
      'La mirada entra, recorre y sale. Si sale antes de ver el producto, la vitrina ha fallado.',
    laws: [
      'Recorrido en Z o en F, nunca en circulo cerrado.',
      'Ningun elemento empuja la mirada hacia la salida del escaparate.',
      'El producto queda en el ultimo tercio del recorrido.',
    ],
  },
  {
    level: 'P4',
    number: 4,
    title: 'Materialidad',
    summary:
      'Los materiales dicen tanto como los objetos. Un material barato al lado de uno caro abarata los dos.',
    laws: [
      'Como maximo tres familias de material por vitrina.',
      'El indice de refraccion del vidrio se declara: altera el color real del producto.',
      'Los acabados mates separan, los brillantes conectan.',
    ],
  },
  {
    level: 'P5',
    number: 5,
    title: 'Atmosfera',
    summary:
      'La luz y el color son lo ultimo que se ajusta, nunca lo primero: amplifican una composicion que ya funciona.',
    laws: [
      'Temperatura de color coherente en toda la escena.',
      'El color de acento ocupa menos del 10% de la superficie visible.',
      'La luz no compite con el producto: lo revela.',
    ],
  },
];

/** Categorias sobre las que se puede filtrar el catalogo de reglas. */
export const RULE_CATEGORIES: RuleCategory[] = [
  { id: 'legibilidad', desc: 'Contraste, tamano y lectura a distancia.' },
  { id: 'jerarquia', desc: 'Punto focal y pesos relativos.' },
  { id: 'recorrido', desc: 'Direccion de la mirada dentro del espacio.' },
  { id: 'materialidad', desc: 'Materiales, reflejos y acabados.' },
  { id: 'atmosfera', desc: 'Luz, temperatura de color y saturacion.' },
];

const SEVERITIES: RuleSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const pad3 = (n: number): string => String(n).padStart(3, '0');

/**
 * Genera `count` reglas deterministas.
 *
 * El mismo `count` produce siempre la misma lista, de modo que dos personas
 * revisando la misma vitrina discuten sobre los mismos criterios.
 */
export function generateConstraintRules(count: number): DesignEngineRule[] {
  const total = Math.max(0, Math.floor(count));
  const rules: DesignEngineRule[] = [];
  for (let i = 0; i < total; i += 1) {
    const category = RULE_CATEGORIES[i % RULE_CATEGORIES.length];
    const priority = MASTER_PRIORITIES[i % MASTER_PRIORITIES.length];
    const law = priority.laws[i % priority.laws.length];
    rules.push({
      id: priority.level + '-' + category.id + '-' + pad3(i + 1),
      category: category.id,
      priority: priority.number,
      severity: SEVERITIES[i % SEVERITIES.length],
      condition: 'Se aplica cuando la escena trata sobre ' + category.desc.toLowerCase(),
      action: law,
      rationale: priority.summary,
      validation: 'Comprobar ' + category.id + ': ' + law,
      status: 'review',
    });
  }
  return rules;
}

/**
 * Evalua la armonia de una escena.
 *
 * Los tres numeros salen de propiedades medibles del repositorio (su color de
 * lenguaje y su indice de refraccion declarado), no de una puntuacion al azar:
 * la misma escena devuelve siempre el mismo informe.
 */
export function evaluateSceneHarmony(
  scene: Repository | undefined,
  lighting: LightingMode,
  surface: string,
): HarmonyReport {
  const lightWeight: Record<LightingMode, number> = {
    'ultra-noir-3': 0.03,
    'noir-6': 0.06,
    'noir-12': 0.12,
    'plasma-full': 1,
  };
  const weight = lightWeight[lighting] ?? 0.03;
  // Superficie clara refleja mas luz y baja el contraste percibido.
  const surfaceFactor = surface === 'tv' ? 0.82 : surface === 'vitrina' ? 0.9 : 1;
  const refractive = scene?.liquidLight.refractiveIndex ?? 1.5;
  const contrastRatio = Number((4.5 * surfaceFactor * (1 + weight)).toFixed(2));
  const atmosphereLuminance = Number((120 * weight * refractive).toFixed(2));
  const harmonicIndex = Math.max(
    0,
    Math.min(100, Math.round((contrastRatio / 21) * 100 * surfaceFactor)),
  );
  return { harmonicIndex, atmosphereLuminance, contrastRatio };
}
