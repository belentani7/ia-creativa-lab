/**
 * Sincronizacion con el perfil publico de GitHub de belentani7.
 *
 * POR QUE EXISTE: la app muestra repositorios y webs desplegadas sin que el
 * usuario tenga que recargar ni iniciar sesion. Este modulo mantiene un
 * unico estado en memoria, avisa a quien este suscrito y evita lanzar dos
 * peticiones a la vez.
 *
 * SIN RED: si GitHub no responde o se agota la cuota anonima, se conserva el
 * ultimo estado bueno en vez de dejar la pantalla vacia. La app nunca debe
 * quedarse en blanco por un fallo de red ajeno.
 */
import { REPOSITORIES } from '../data/repositories';
import type { Repository } from '../types';

/** Diagnostico de un repositorio concreto. */
export interface DoctorFixDiagnostic {
  /** Gravedad: informativo, aviso o error real. */
  severity: 'info' | 'warning' | 'error';
  /** Codigo corto para poder filtrar sin comparar textos. */
  code: string;
  /** Explicacion legible de lo que se ha detectado. */
  message: string;
  /** Accion sugerida; vacio si solo es informativo. */
  suggestion?: string;
}

/** Estado completo del perfil, tal como lo consumen los componentes. */
export interface BelentaniProfileState {
  username: string;
  avatarUrl: string;
  bio: string;
  publicReposCount: number;
  /** Numero de repositorios con web publicada y viva. */
  activeWebsCount: number;
  repositories: Repository[];
  /** Diagnosticos indexados por id de repositorio. */
  diagnostics: Record<string, DoctorFixDiagnostic>;
  /** ISO 8601 de la ultima sincronizacion correcta; null si nunca hubo. */
  lastSyncTime: string | null;
  isLoading: boolean;
}

const USERNAME = 'belentani7';
const API = 'https://api.github.com';

const EMPTY: BelentaniProfileState = {
  username: USERNAME,
  avatarUrl: '',
  bio: '',
  publicReposCount: 0,
  activeWebsCount: 0,
  repositories: REPOSITORIES,
  diagnostics: {},
  lastSyncTime: null,
  isLoading: false,
};

type Listener = (state: BelentaniProfileState) => void;

class GitHubSync {
  private state: BelentaniProfileState = EMPTY;
  private listeners = new Set<Listener>();
  private inFlight: Promise<void> | null = null;

  getState(): BelentaniProfileState {
    return this.state;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private set(patch: Partial<BelentaniProfileState>): void {
    this.state = { ...this.state, ...patch };
    for (const fn of this.listeners) fn(this.state);
  }

  /**
   * Trae el perfil y sus repositorios publicos.
   *
   * @param withDiagnostics cuando es true se calcula un diagnostico por
   *   repositorio. Es mas caro, asi que solo se hace cuando el usuario lo pide.
   */
  async syncWithGitHub(withDiagnostics = false): Promise<void> {
    // Si ya hay una sincronizacion en curso, se reutiliza en vez de duplicar.
    if (this.inFlight) return this.inFlight;
    this.inFlight = this.run(withDiagnostics).finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  private async run(withDiagnostics: boolean): Promise<void> {
    this.set({ isLoading: true });
    try {
      const [profileRes, reposRes] = await Promise.all([
        fetch(`${API}/users/${USERNAME}`),
        fetch(`${API}/users/${USERNAME}/repos?per_page=100&sort=updated`),
      ]);
      if (!profileRes.ok || !reposRes.ok) {
        throw new Error(`GitHub respondio ${profileRes.status}/${reposRes.status}`);
      }
      const profile = await profileRes.json();
      const repos = (await reposRes.json()) as Array<{
        id: number;
        name: string;
        description: string | null;
        html_url: string;
        homepage: string | null;
        language: string | null;
        stargazers_count: number;
        forks_count: number;
        topics?: string[];
      }>;
      const mapped: Repository[] = repos.map((r, i) => ({
        id: String(r.id),
        name: r.name,
        tagline: r.description ?? r.name,
        description: r.description ?? '',
        longDescription: r.description ?? '',
        githubUrl: r.html_url,
        liveUrl: r.homepage || undefined,
        primaryLanguage: r.language ?? 'HTML',
        languageColor: '#8b8b8b',
        category: 'archive',
        tags: (r.topics ?? []).map((t) => ({ id: t, label: t.replace(/-/g, ' ') })),
        stats: { stars: r.stargazers_count, forks: r.forks_count },
        iconConfig: {
          glyphType: 'orb',
          symbolDescription: r.name,
          accentColor: '#8b8b8b',
          haloColor: '#8b8b8b',
          puffGlow: 0.35,
        },
        liquidLight: {
          colorName: r.language ?? 'HTML',
          hex: '#8b8b8b',
          milkyGlow: 0.3,
          refractiveIndex: 1.5,
        },
        singleWord: 'obra',
        isEducation: false,
        priorityOrder: i,
      }));
      const diagnostics: Record<string, DoctorFixDiagnostic> = {};
      if (withDiagnostics) {
        for (const repo of mapped) {
          if (!repo.liveUrl) {
            diagnostics[repo.id] = {
              severity: 'info',
              code: 'no-homepage',
              message: 'El repositorio no declara web publicada.',
              suggestion: 'Anade homepage en GitHub si tiene sitio.',
            };
          } else if (!repo.description) {
            diagnostics[repo.id] = {
              severity: 'warning',
              code: 'no-description',
              message: 'Tiene web pero no descripcion.',
              suggestion: 'Escribe una descripcion de una linea.',
            };
          }
        }
      }
      this.set({
        avatarUrl: profile.avatar_url ?? '',
        bio: profile.bio ?? '',
        publicReposCount: profile.public_repos ?? mapped.length,
        activeWebsCount: mapped.filter((r) => !!r.liveUrl).length,
        repositories: mapped,
        diagnostics,
        lastSyncTime: new Date().toISOString(),
        isLoading: false,
      });
    } catch {
      // Se conserva el estado anterior: mejor dato viejo que pantalla vacia.
      this.set({ isLoading: false });
    }
  }
}

export const gitHubSync = new GitHubSync();
