/**
 * Generador de parches para los diagnosticos de repositorio.
 *
 * POR QUE EXISTE: DoctorFixModal detecta problemas (sin web, sin descripcion,
 * sin topics) y necesita proponer un archivo concreto que los resuelva. Este
 * modulo convierte un diagnostico en un archivo listo para pegar en GitHub.
 *
 * NO ESCRIBE NADA EN GITHUB. Solo genera texto. Cualquier cambio en un
 * repositorio lo aprueba y lo aplica la persona; el navegador no tiene por que
 * llevar un token con permiso de escritura.
 */
import type { Repository } from '../types';
import type { DoctorFixDiagnostic } from './githubSync';

/** Un archivo propuesto, con su ruta destino y su contenido. */
export interface GeneratedFixFile {
  /** Ruta relativa dentro del repositorio, por ejemplo '.github/FUNDING.yml'. */
  path: string;
  /** Contenido completo del archivo. */
  content: string;
  /** Una linea explicando que arregla y por que. */
  rationale: string;
}

const NL = '\n';

export class DoctorFixGenerator {
  /**
   * Devuelve los archivos que resuelven `diagnostic` en `repo`.
   * Si el diagnostico no tiene parche automatico devuelve lista vacia,
   * en vez de inventar un archivo que no aporta nada.
   */
  static generate(repo: Repository, diagnostic: DoctorFixDiagnostic): GeneratedFixFile[] {
    switch (diagnostic.code) {
      case 'no-description':
        return [
          {
            path: 'README.md',
            content: this.readmeStub(repo),
            rationale:
              'Un README que empieza diciendo que es el proyecto evita que quien llega tenga que leer el codigo para saberlo.',
          },
        ];
      case 'no-homepage':
        return [
          {
            path: '.github/ISSUE_TEMPLATE/config.yml',
            content: this.contactStub(repo),
            rationale:
              'Da un punto de contacto claro cuando el repositorio todavia no tiene web propia.',
          },
        ];
      default:
        return [];
    }
  }

  /** Punto de contacto minimo mientras no exista web publicada. */
  private static contactStub(repo: Repository): string {
    return [
      'blank_issues_enabled: true',
      'contact_links:',
      '  - name: Codigo fuente',
      '    url: ' + repo.githubUrl,
      '    about: Repositorio en GitHub',
      '',
    ].join(NL);
  }

  /** Primera version del README: que es, donde esta y con que licencia. */
  private static readmeStub(repo: Repository): string {
    return [
      '# ' + repo.name,
      '',
      repo.description || 'Descripcion pendiente.',
      '',
      '## Que es',
      '',
      repo.longDescription || repo.description || 'Pendiente de documentar.',
      '',
      '## Donde esta',
      '',
      '- Codigo: ' + repo.githubUrl,
      repo.liveUrl ? '- Web: ' + repo.liveUrl : '- Web: pendiente de publicar',
      '',
      '## Licencia',
      '',
      'Ver el archivo LICENSE del repositorio.',
      '',
    ].join(NL);
  }
}

export default DoctorFixGenerator;
