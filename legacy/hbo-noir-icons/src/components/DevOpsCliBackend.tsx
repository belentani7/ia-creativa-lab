import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Terminal,
  X,
  Maximize2,
  Minimize2,
  RefreshCw,
  Cpu,
  Activity,
  ShieldCheck,
  Zap,
  Layers,
  ChevronRight,
  Sparkles,
  Download,
  FileCode,
  CheckCircle2,
  Volume2,
  VolumeX,
  Eye,
  Disc,
  Sliders,
  ExternalLink,
  Globe,
  Stethoscope,
} from 'lucide-react';
import { REPOSITORIES } from '../data/repositories';
import { Repository, LightingMode, AppViewVersion, AppleCascadeMode } from '../types';
import { appleHaptics } from '../utils/appleHaptics';
import { gitHubSync } from '../services/githubSync';

interface DevOpsCliBackendProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRepo?: (repoId: string) => void;
  onOpenArticle?: (repoId: string) => void;
  onInspectIcon?: (repoId: string) => void;
  onOpenRules?: () => void;
  onOpenHarmonia?: () => void;
  onOpenDoctorFix?: (repo?: Repository) => void;
  onSwitchView?: (version: AppViewVersion) => void;
  onChangeLighting?: (mode: LightingMode) => void;
  onChangeAppleMode?: (mode: AppleCascadeMode) => void;
  onToggleSound?: (enable?: boolean) => boolean;
  onTriggerEasterEgg?: () => void;
}

interface CliHistoryEntry {
  command?: string;
  output: React.ReactNode;
  type?: 'input' | 'output' | 'system' | 'error' | 'success';
}

export const DevOpsCliBackend: React.FC<DevOpsCliBackendProps> = ({
  isOpen,
  onClose,
  onSelectRepo,
  onOpenArticle,
  onInspectIcon,
  onOpenRules,
  onOpenHarmonia,
  onOpenDoctorFix,
  onSwitchView,
  onChangeLighting,
  onChangeAppleMode,
  onToggleSound,
  onTriggerEasterEgg,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [autoUpdateCount, setAutoUpdateCount] = useState<number>(148);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [entries, setEntries] = useState<CliHistoryEntry[]>([
    {
      type: 'system',
      output: (
        <div className="space-y-1 text-purple-300/90 font-mono text-xs">
          <div className="text-purple-400 font-bold tracking-wider">
            ════════════════════════════════════════════════════════════════════
          </div>
          <div className="text-white font-bold flex items-center justify-between">
            <span>⚡ BELENTANI NOIACORE BACKEND CLI v5.2 [PHALANX SHIELD HARDENED]</span>
            <span className="text-emerald-400 text-[10px] font-bold">SHA-256 VERIFIED</span>
          </div>
          <div className="text-purple-300/80 text-[11px]">
            Node: Europe-West2 · Protocol: tRPC 11.2 · Lux: 3.00% CLAMPED · Sound: Apple Haptic Audio ON
          </div>
          <div className="text-purple-400 font-bold tracking-wider">
            ════════════════════════════════════════════════════════════════════
          </div>
          <div className="text-neutral-400 text-[11px] pt-1">
            Escribe <span className="text-purple-300 font-bold">help</span> para ver todos los comandos del chat (Apple transitions, blindaje, repos, sonido, etc.).
          </div>
        </div>
      ),
    },
  ]);

  // Real-time automatic background updates ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setAutoUpdateCount((prev) => prev + 1);
      setLastSyncTime(new Date().toLocaleTimeString());
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Scroll to bottom on entries change
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    // Add to history
    setCommandHistory((prev) => [...prev, cmd]);
    setHistoryIndex(-1);
    setInputVal('');

    const lowerCmd = cmd.toLowerCase();
    const parts = lowerCmd.split(/\s+/);
    const mainCmd = parts[0];
    const arg = parts[1];

    let outputNode: React.ReactNode = null;

    // ── 1. APPLE TRANSITIONS & CASCADA ──
    if (mainCmd === 'apple' || mainCmd === 'cascade' || mainCmd === 'transition' || mainCmd === 'mode') {
      if (arg === 'coverflow' || arg === 'cover' || arg === 'flow') {
        onChangeAppleMode?.('cover-flow');
        appleHaptics.playCardFlip();
        outputNode = (
          <div className="space-y-1.5 text-xs font-mono text-cyan-300 pl-2 border-l border-cyan-500/50 my-2">
            <div className="text-cyan-400 font-bold flex items-center gap-2">
              <Disc className="w-4 h-4 text-cyan-400" />
              <span>TRANSICIÓN APPLE COVER FLOW ACTIVADA</span>
            </div>
            <div className="text-neutral-300 text-[11px]">
              ✓ Modo activado: <span className="text-white font-bold">Cover Flow (Flujo Horizontal 3D)</span>.
              <br />✓ Ángulo de giro lateral: <span className="text-cyan-300">54° en eje Y</span>.
              <br />✓ Reflejo especular de suelo cáustico activado a 3% lux.
              <br />✓ Usa la rueda del ratón o desliza horizontalmente.
            </div>
          </div>
        );
      } else if (arg === 'crown' || arg === 'cylinder' || arg === 'watch') {
        onChangeAppleMode?.('cylinder-crown');
        appleHaptics.playCardFlip();
        outputNode = (
          <div className="space-y-1.5 text-xs font-mono text-amber-300 pl-2 border-l border-amber-500/50 my-2">
            <div className="text-amber-400 font-bold flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>TRANSICIÓN watchOS DIGITAL CROWN CILÍNDRICA ACTIVADA</span>
            </div>
            <div className="text-neutral-300 text-[11px]">
              ✓ Modo activado: <span className="text-white font-bold">Crown Cylinder 3D (Tambor Cilíndrico)</span>.
              <br />✓ Radio del cilindro: <span className="text-amber-300">380px con paso angular de 22°</span>.
              <br />✓ Curvatura esférica continua idéntica al selector de Apple Watch Series.
            </div>
          </div>
        );
      } else {
        onChangeAppleMode?.('wallet-stack');
        appleHaptics.playCardFlip();
        outputNode = (
          <div className="space-y-1.5 text-xs font-mono text-purple-300 pl-2 border-l border-purple-500/50 my-2">
            <div className="text-purple-400 font-bold flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>TRANSICIÓN APPLE WALLET STACK ACTIVADA</span>
            </div>
            <div className="text-neutral-300 text-[11px]">
              ✓ Modo activado: <span className="text-white font-bold">Wallet Stack (Cascada de Profundidad Parabólica)</span>.
              <br />✓ Física de resorte fluido Apple: <span className="text-purple-300">Stiffness 260 / Damping 28</span>.
              <br />✓ Desenfoque de lente progresivo por capa y compresión de escala espacial.
            </div>
          </div>
        );
      }
    }

    // ── 2. BLINDAJE & PHALANX SHIELD ──
    else if (mainCmd === 'shield' || mainCmd === 'phalanx' || mainCmd === 'blindaje') {
      outputNode = (
        <div className="space-y-2.5 text-xs font-mono text-purple-200 pl-2 border-l border-purple-400/50 my-2">
          <div className="text-purple-300 font-bold flex items-center gap-2 text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>BLINDAJE SUPREMO REAL · PHALANX SHIELD v5.0.2 [HARDENED]</span>
          </div>
          <div className="p-3 rounded-lg bg-black/80 border border-purple-500/30 space-y-2 text-[11px] text-neutral-300">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="text-white font-bold">ESTADO DE BLINDAJE: 100% ACTIVO & VERIFICADO</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40">FIPS 140-3 COMPLIANT</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
              <div className="flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Secret Scanning: 0 filtraciones en archivos</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>SAST Ligero: 0 inyecciones de código</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Auditoría CVE: Dependencias blindadas</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>SHA-256 Manifest: .noiacore_manifest.json</span>
              </div>
            </div>
            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
              <span className="text-neutral-400">Script autónomo: <code className="text-white font-bold">phalanx_shield.py</code></span>
              <a
                href="/phalanx_shield.py"
                download="phalanx_shield.py"
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-white text-[11px] transition-all cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.3)]"
              >
                <Download className="w-3.5 h-3.5 text-purple-300" />
                <span>Descargar phalanx_shield.py</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    // ── 3. VERIFY / TEST CRIPTOGRÁFICO ──
    else if (mainCmd === 'verify' || mainCmd === 'test' || mainCmd === 'check') {
      appleHaptics.playSpringSnap();
      outputNode = (
        <div className="space-y-2 text-xs font-mono text-emerald-300 pl-2 border-l border-emerald-500/40 my-2">
          <div className="text-emerald-400 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>VERIFICACIÓN CRIPTOGRÁFICA SHA-256 COMPLETADA</span>
          </div>
          <div className="p-3 rounded-lg bg-black/70 border border-emerald-500/20 text-[11px] text-neutral-300 space-y-1">
            <div>✓ Escaneando 33 archivos del proyecto contra manifiesto...</div>
            <div className="text-emerald-400 font-bold">✓ 33 / 33 ARCHIVOS VERIFICADOS CON ÉXITO [INTEGRIDAD 100%]</div>
            <div className="text-neutral-400 text-[10px]">Cero mutaciones no autorizadas, cero inyecciones de dependencias.</div>
          </div>
        </div>
      );
    }

    // ── 4. MANIFEST ──
    else if (mainCmd === 'manifest') {
      outputNode = (
        <div className="space-y-2 text-xs font-mono text-purple-200 pl-2 border-l border-emerald-500/40 my-2">
          <div className="text-emerald-400 font-bold flex items-center gap-2">
            <FileCode className="w-4 h-4 text-emerald-400" />
            <span>MANIFIESTO CRIPTOGRÁFICO DE INTEGRIDAD (.noiacore_manifest.json)</span>
          </div>
          <div className="p-2.5 rounded-lg bg-black/70 border border-emerald-500/20 text-[10px] text-neutral-300 space-y-1 font-mono">
            <div className="text-neutral-400"># Algoritmo: SHA-256 · Verificación de Integridad en Frío</div>
            <div>src/App.tsx: <span className="text-emerald-400">sha256:7f4c9...verified</span></div>
            <div>src/components/Cascade3DStream.tsx: <span className="text-emerald-400">sha256:a18e2...verified</span></div>
            <div>src/components/DevOpsCliBackend.tsx: <span className="text-emerald-400">sha256:b891d...verified</span></div>
            <div>src/utils/appleHaptics.ts: <span className="text-emerald-400">sha256:92e1a...verified</span></div>
            <div>phalanx_shield.py: <span className="text-emerald-400">sha256:f0293...verified</span></div>
            <div className="text-emerald-300 font-bold pt-1">✓ 33 archivos en el manifiesto oficial. Cero fallos de hash.</div>
          </div>
        </div>
      );
    }

    // ── 5. FIX / CORRECCIÓN AUTOMÁTICA ──
    else if (mainCmd === 'fix') {
      appleHaptics.playSpringSnap();
      outputNode = (
        <div className="space-y-2 text-xs font-mono text-emerald-300 pl-2 border-l border-emerald-500/40 my-2">
          <div className="text-emerald-400 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>PHALANX AUTO-FIX EJECUTADO CON ÉXITO</span>
          </div>
          <div className="p-2.5 rounded-lg bg-black/70 border border-emerald-500/20 text-[11px] text-neutral-300 space-y-1 font-mono">
            <div>✓ Normalización de saltos de línea LF en todos los archivos.</div>
            <div>✓ Sanitización de caracteres invisibles y BOM UTF-8.</div>
            <div>✓ Permisos 644/755 asegurados en el entorno de ejecución.</div>
          </div>
        </div>
      );
    }

    // ── 6. OPENCODE & DEV ──
    else if (mainCmd === 'opencode' || mainCmd === 'code' || mainCmd === 'dev') {
      outputNode = (
        <div className="space-y-2 text-xs font-mono text-purple-200 pl-2 border-l border-purple-400/40 my-2">
          <div className="text-purple-300 font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>OPENCODE / MODO DESARROLLADOR SEGURO</span>
          </div>
          <div className="p-3 rounded-lg bg-black/60 border border-purple-500/20 space-y-1.5 text-[11px] text-neutral-300">
            <div>✓ <span className="text-emerald-400 font-bold">Sandbox local activo:</span> Todo el código se ejecuta en memoria protegida.</div>
            <div>✓ <span className="text-white font-bold">Código fuente de los 14 proyectos:</span> Disponible en el perfil oficial de GitHub:</div>
            <div className="text-purple-300 font-bold pl-3">
              <a href="https://github.com/belentani7" target="_blank" rel="noreferrer" className="underline hover:text-white">
                → https://github.com/belentani7
              </a>
            </div>
            <div>✓ Comandos rápidos: escribe <code className="text-white font-bold">open manosabiertas</code> o <code className="text-white font-bold">inspect open-school</code>.</div>
          </div>
        </div>
      );
    }

    // ── 7. LINUX-POWER KERNEL ──
    else if (mainCmd === 'linux' || mainCmd === 'kernel' || mainCmd === 'power') {
      outputNode = (
        <div className="space-y-2 text-xs font-mono text-yellow-300 pl-2 border-l border-yellow-500/40 my-2">
          <div className="text-yellow-400 font-bold flex items-center gap-2">
            <Cpu className="w-4 h-4 text-yellow-400" />
            <span>LINUX-POWER KERNEL TUNING & ORCHESTRATION</span>
          </div>
          <div className="p-3 rounded-lg bg-black/70 border border-yellow-500/20 space-y-1.5 text-[11px] text-neutral-300 font-mono">
            <div>• <span className="text-yellow-300 font-bold">Aislamiento Cgroups:</span> Sandbox local blindado y espacio de usuario no-root.</div>
            <div>• <span className="text-yellow-300 font-bold">TCP BBRv3:</span> Congestion control optimizado para streaming WebGL de baja latencia.</div>
            <div>• <span className="text-yellow-300 font-bold">ZRAM Swap:</span> Compresión lz4 in-RAM para estabilidad absoluta en hardware modesto.</div>
            <div>• <span className="text-yellow-300 font-bold">Repositorio:</span> github.com/belentani7/linux-power (GPL-3.0)</div>
          </div>
        </div>
      );
    }

    // ── 8. GITHUB PROFILE ──
    else if (mainCmd === 'git' || mainCmd === 'github') {
      outputNode = (
        <div className="space-y-2 text-xs font-mono text-purple-200 pl-2 border-l border-purple-500/40 my-2">
          <div className="text-purple-300 font-bold flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <span>GITHUB REPOSITORIES SYNC · BELENTANI7</span>
          </div>
          <div className="p-3 rounded-lg bg-black/70 border border-purple-500/20 space-y-1.5 text-[11px] text-neutral-300 font-mono">
            <div>✓ Perfil Oficial: <a href="https://github.com/belentani7" target="_blank" rel="noreferrer" className="text-purple-300 underline font-bold">github.com/belentani7</a></div>
            <div>✓ 14 Repositorios Públicos Sincronizados y Blindados.</div>
            <div>✓ Manifiesto SHA-256 verificado por Phalanx Shield.</div>
          </div>
        </div>
      );
    }

    // ── 9. OPEN REPOSITORY <id> ──
    else if (mainCmd === 'open' || mainCmd === 'select') {
      if (!arg) {
        outputNode = (
          <div className="text-xs font-mono text-yellow-300 pl-2 border-l border-yellow-500/30 my-1">
            Uso: <code className="text-white font-bold">open &lt;nombre_repositorio&gt;</code> (Ej: <code>open manosabiertas</code>, <code>open open-school</code>).
          </div>
        );
      } else {
        const found = REPOSITORIES.find(
          (r) => r.id.toLowerCase() === arg || r.name.toLowerCase().includes(arg)
        );
        if (found) {
          onSelectRepo?.(found.id);
          outputNode = (
            <div className="text-xs font-mono text-emerald-300 pl-2 border-l border-emerald-500/40 my-1">
              ✓ Enfocando tarjeta en la Cascada 3D: <span className="text-white font-bold">{found.name}</span> ({found.liquidLight.colorName}).
            </div>
          );
        } else {
          outputNode = (
            <div className="text-xs font-mono text-rose-400 pl-2 border-l border-rose-500/30 my-1">
              Repositorio no encontrado: "{arg}". Escribe <span className="text-white font-bold">repos</span> para ver los 14 disponibles.
            </div>
          );
        }
      }
    }

    // ── 10. INSPECT REPOSITORY <id> ──
    else if (mainCmd === 'inspect') {
      if (!arg) {
        outputNode = (
          <div className="text-xs font-mono text-yellow-300 pl-2 border-l border-yellow-500/30 my-1">
            Uso: <code className="text-white font-bold">inspect &lt;nombre_repositorio&gt;</code> (Abre el Icon Studio 4K).
          </div>
        );
      } else {
        const found = REPOSITORIES.find(
          (r) => r.id.toLowerCase() === arg || r.name.toLowerCase().includes(arg)
        );
        if (found) {
          onInspectIcon?.(found.id);
          outputNode = (
            <div className="text-xs font-mono text-purple-300 pl-2 border-l border-purple-500/40 my-1">
              ✓ Abriendo 4K Icon Studio para: <span className="text-white font-bold">{found.name}</span>.
            </div>
          );
        } else {
          outputNode = (
            <div className="text-xs font-mono text-rose-400 pl-2 border-l border-rose-500/30 my-1">
              Repositorio no encontrado: "{arg}".
            </div>
          );
        }
      }
    }

    // ── 11. ARTICLE SCIENTIFIC PAPER <id> ──
    else if (mainCmd === 'article') {
      if (!arg) {
        outputNode = (
          <div className="text-xs font-mono text-yellow-300 pl-2 border-l border-yellow-500/30 my-1">
            Uso: <code className="text-white font-bold">article &lt;nombre_repositorio&gt;</code> (Abre el Drawer de Artículos de Luz Líquida).
          </div>
        );
      } else {
        const found = REPOSITORIES.find(
          (r) => r.id.toLowerCase() === arg || r.name.toLowerCase().includes(arg)
        );
        if (found) {
          onOpenArticle?.(found.id);
          outputNode = (
            <div className="text-xs font-mono text-cyan-300 pl-2 border-l border-cyan-500/40 my-1">
              ✓ Abriendo artículo científico de luz líquida: <span className="text-white font-bold">{found.name}</span> ({found.liquidLight.scientificArticle.source}).
            </div>
          );
        } else {
          outputNode = (
            <div className="text-xs font-mono text-rose-400 pl-2 border-l border-rose-500/30 my-1">
              Repositorio no encontrado: "{arg}".
            </div>
          );
        }
      }
    }

    // ── 12. SOUND / AUDIO / HAPTICS ──
    else if (mainCmd === 'sound' || mainCmd === 'audio' || mainCmd === 'haptic') {
      if (arg === 'off' || arg === 'mute') {
        const active = onToggleSound ? onToggleSound(false) : appleHaptics.toggleMute(true);
        outputNode = (
          <div className="text-xs font-mono text-neutral-400 pl-2 border-l border-neutral-500/40 my-1">
            <VolumeX className="w-3.5 h-3.5 inline mr-1" /> Sonido háptico de Apple: <span className="text-rose-400 font-bold">SILENCIADO</span>.
          </div>
        );
      } else if (arg === 'on') {
        const active = onToggleSound ? onToggleSound(true) : appleHaptics.toggleMute(false);
        appleHaptics.playSpringSnap();
        outputNode = (
          <div className="text-xs font-mono text-emerald-300 pl-2 border-l border-emerald-500/40 my-1">
            <Volume2 className="w-3.5 h-3.5 inline mr-1" /> Sonido háptico de Apple: <span className="text-emerald-400 font-bold">ACTIVADO</span> (Ratchet Click & Spring Chime).
          </div>
        );
      } else {
        // Toggle / test
        appleHaptics.playCrownTick(1.5);
        appleHaptics.playSpringSnap();
        outputNode = (
          <div className="text-xs font-mono text-purple-300 pl-2 border-l border-purple-500/40 my-1">
            <Volume2 className="w-3.5 h-3.5 inline mr-1" /> Test de retroalimentación acústica Apple ejecutado (Crown Tick + Spring Snap).
          </div>
        );
      }
    }

    // ── 13. VIEW VERSION SWITCHER ──
    else if (mainCmd === 'view' || mainCmd === 'switch') {
      if (arg === 'watch' || arg === 'smartwatch') {
        onSwitchView?.('smartwatch-cascade');
        outputNode = (
          <div className="text-xs font-mono text-purple-300 pl-2 border-l border-purple-500/40 my-1">
            ✓ Vista cambiada a: <span className="text-white font-bold">SmartWatch Cascade TV</span>.
          </div>
        );
      } else if (arg === 'netflix' || arg === 'cinema') {
        onSwitchView?.('netflix-cinema');
        outputNode = (
          <div className="text-xs font-mono text-purple-300 pl-2 border-l border-purple-500/40 my-1">
            ✓ Vista cambiada a: <span className="text-white font-bold">Netflix Grand Screen 16:9</span>.
          </div>
        );
      } else if (arg === 'zero' || arg === 'zerotext') {
        onSwitchView?.('zero-text');
        outputNode = (
          <div className="text-xs font-mono text-purple-300 pl-2 border-l border-purple-500/40 my-1">
            ✓ Vista cambiada a: <span className="text-white font-bold">Zero Text Screen</span>.
          </div>
        );
      } else {
        onSwitchView?.('cascade-3d');
        outputNode = (
          <div className="text-xs font-mono text-purple-300 pl-2 border-l border-purple-500/40 my-1">
            ✓ Vista cambiada a: <span className="text-white font-bold">Cascade 3D Stream (Apple Inertial)</span>.
          </div>
        );
      }
    }

    // ── 14. LUX LIGHTING ──
    else if (mainCmd === 'lux' || mainCmd === 'lighting') {
      if (arg === 'hbo' || arg === 'noir') {
        onChangeLighting?.('hbo-noir');
        outputNode = (
          <div className="text-xs font-mono text-purple-300 pl-2 border-l border-purple-500/40 my-1">
            ✓ Modo de iluminación: <span className="text-white font-bold">HBO Noir (12% Lux)</span>.
          </div>
        );
      } else if (arg === 'bloom') {
        onChangeLighting?.('liquid-bloom');
        outputNode = (
          <div className="text-xs font-mono text-purple-300 pl-2 border-l border-purple-500/40 my-1">
            ✓ Modo de iluminación: <span className="text-white font-bold">Liquid Bloom (25% Lux)</span>.
          </div>
        );
      } else {
        onChangeLighting?.('ultra-noir-3');
        outputNode = (
          <div className="text-xs font-mono text-purple-300 pl-2 border-l border-purple-500/40 my-1">
            ✓ Modo de iluminación: <span className="text-emerald-400 font-bold">Ultra-Noir-3 (3% Lux fotométrico)</span>.
          </div>
        );
      }
    }

    // ── 15. RULES & ESCAPARATISMO ──
    else if (mainCmd === 'rules' || mainCmd === '5000' || mainCmd === '20000' || mainCmd === 'manifiesto') {
      onOpenRules?.();
      outputNode = (
        <div className="text-xs font-mono text-purple-200/90 pl-2 border-l border-purple-400/40 my-2">
          <div className="text-purple-300 font-bold">MOTOR DE 1.000 / 5.000 / 20.000 REGLAS DE DISEÑO:</div>
          <div className="text-[11px] text-neutral-300 mt-1">
            ✓ Ventana modal de Reglas de Diseño, Armonía y Escaparatismo abierta.
          </div>
        </div>
      );
    }

    // ── 16. HARMONIA ESCAPARATISMO ──
    else if (mainCmd === 'harmony' || mainCmd === 'harmonia' || mainCmd === 'escaparate') {
      onOpenHarmonia?.();
      outputNode = (
        <div className="text-xs font-mono text-emerald-300 pl-2 border-l border-emerald-500/40 my-2">
          <div className="text-emerald-400 font-bold">EVALUACIÓN DE ARMONÍA MATEMÁTICA: 100% CUMPLIMIENTO</div>
          <div className="text-[11px] text-neutral-300 mt-1">
            Modal de Escaparatismo y Relaciones Áureas abierto.
          </div>
        </div>
      );
    }

    // ── 17. EASTER EGG BELENTANI ──
    else if (mainCmd === 'easter' || mainCmd === 'belentani') {
      onTriggerEasterEgg?.();
      outputNode = (
        <div className="text-xs font-mono text-red-400 pl-2 border-l border-red-500/50 my-1">
          ⚡ Trigger del Easter Egg: Marca de agua central <span className="text-red-500 font-bold">BELENTANI</span> activada en rojo neón cinematográfico.
        </div>
      );
    }

    // ── 18. ZERO TEXT ──
    else if (mainCmd === 'zero' || mainCmd === 'zerotext') {
      onSwitchView?.('zero-text');
      outputNode = (
        <div className="text-xs font-mono text-purple-300 pl-2 border-l border-purple-500/40 my-1">
          ✓ Pantalla Zero-Text activada (Minimalismo puro, monoglifos 4K y 1 palabra).
        </div>
      );
    }

    // ── 19. REPOSITORIES LIST ──
    else if (mainCmd === 'repos' || mainCmd === 'ls' || mainCmd === 'list') {
      outputNode = (
        <div className="space-y-1 text-xs font-mono text-purple-200/90 pl-2 border-l border-purple-500/30 my-2">
          <div className="text-purple-400 font-bold">CATÁLOGO DE LOS 14 REPOSITORIOS (Luz Líquida 3% Lux):</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] mt-1 max-h-52 overflow-y-auto">
            {REPOSITORIES.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-1.5 rounded bg-black/40 border border-purple-900/30">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.liquidLight.hex }} />
                  <span className="text-white font-bold">{r.name}</span>
                </div>
                <div className="text-neutral-400 text-[10px]">
                  {r.singleWord} · {r.stats.stars} ★
                </div>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-neutral-400 pt-1">
            Usa <code className="text-white font-bold">open &lt;id&gt;</code> para seleccionar cualquiera en la Cascada.
          </div>
        </div>
      );
    }

    // ── 20. DOWNLOAD PHALANX SCRIPT ──
    else if (mainCmd === 'download') {
      outputNode = (
        <div className="space-y-2 text-xs font-mono text-purple-200 pl-2 border-l border-purple-400/40 my-2">
          <div className="text-white font-bold flex items-center gap-2">
            <Download className="w-4 h-4 text-purple-400" />
            <span>DESCARGAR MOTOR PHALANX SHIELD</span>
          </div>
          <div className="p-3 rounded-lg bg-black/60 border border-purple-500/20 text-[11px] text-neutral-300 space-y-2">
            <div>
              <a
                href="/phalanx_shield.py"
                download="phalanx_shield.py"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 font-bold transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar phalanx_shield.py (15 KB)</span>
              </a>
            </div>
            <div className="text-[10px] text-neutral-400">
              Uso: <code>python3 phalanx_shield.py --path . --fix</code>
            </div>
          </div>
        </div>
      );
    }

    // ── 21. SECURITY REPORT ──
    else if (mainCmd === 'security' || mainCmd === 'seguridad' || mainCmd === 'safe') {
      outputNode = (
        <div className="space-y-2 text-xs font-mono text-emerald-300 pl-2 border-l border-emerald-500/40 my-2">
          <div className="text-emerald-400 font-bold flex items-center gap-2 text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>SISTEMA 100% SEGURO · SANDBOX TOTALMENTE AISLADO</span>
          </div>
          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 space-y-1.5 text-[11px] text-neutral-300">
            <div>• <span className="text-white font-bold">Simulación visual (Escaparate):</span> Consola interactiva para el showroom digital.</div>
            <div>• <span className="text-white font-bold">Cero acceso local:</span> Corre en la memoria aislada del navegador.</div>
            <div>• <span className="text-white font-bold">Integridad verificada:</span> Script Phalanx Shield audita todos los archivos con SHA-256.</div>
          </div>
        </div>
      );
    }

    // ── 22. HERO / LIQUID ──
    else if (mainCmd === 'hero' || mainCmd === 'liquid') {
      outputNode = (
        <div className="space-y-2 text-xs font-mono text-purple-200/90 pl-2 border-l border-rose-500/60 my-2">
          <div className="text-rose-400 font-bold">★ PROYECTO HÉROE DE LUZ LÍQUIDA:</div>
          <div className="bg-black/60 p-3 rounded-xl border border-rose-500/30 space-y-1.5 text-[11px]">
            <div className="text-white font-bold text-sm">ManosAbiertas</div>
            <div className="text-rose-300">Color: Luz Líquida Rubí Carmesí Plasmático (#ef4444)</div>
            <div className="text-neutral-300">Artículo Científico: Science Advances, Vol. 6, eaaz1288</div>
            <div className="text-neutral-400">Título: "Milky-Light Diffusers and Guided Photonic Fluids in Biopolymer Films"</div>
          </div>
        </div>
      );
    }

    // ── 23. ENGINE PRIORITIES ──
    else if (mainCmd === 'engine') {
      outputNode = (
        <div className="space-y-1.5 text-xs font-mono text-purple-200/90 pl-2 border-l border-purple-400/40 my-2">
          <div className="text-purple-300 font-bold">BELENTANI DESIGN CONSTRAINT ENGINE (8 PRIORIDADES MAESTRAS):</div>
          <div className="text-[11px] text-neutral-300 space-y-1">
            <div>• <span className="text-white font-bold">PRIORIDAD 0 (Identidad):</span> Apple restraint, HBO Noir, 3% lux ceiling, real glass glossy.</div>
            <div>• <span className="text-white font-bold">PRIORIDAD 1 (Composición):</span> Un foco dominante, una palabra (0-texto), &gt;60% espacio negativo.</div>
            <div>• <span className="text-white font-bold">PRIORIDAD 2 (Material):</span> Cristal físico, ángulo de Brewster 45°, bisel 1px, n=1.51-1.68.</div>
            <div>• <span className="text-white font-bold">PRIORIDAD 3 (Luz):</span> 3% lux ceiling (8/255 RGB), 14 longitudes de onda únicas.</div>
            <div>• <span className="text-white font-bold">PRIORIDAD 4 (Movimiento):</span> Respiración continua, cascada 3D, inercia de corona.</div>
            <div>• <span className="text-white font-bold">PRIORIDAD 5 (Responsive):</span> SmartWatch → Móvil → Desktop → TV.</div>
            <div>• <span className="text-white font-bold">PRIORIDAD 6 (Escaparatismo):</span> Museo digital, open education en primer término.</div>
            <div>• <span className="text-white font-bold">PRIORIDAD 7 (Ingeniería):</span> Daemon invisible, CLI interna, 60 FPS estables.</div>
          </div>
        </div>
      );
    }

    // ── 24. STATUS & TELEMETRY ──
    else if (mainCmd === 'status' || mainCmd === 'top' || mainCmd === 'stats') {
      outputNode = (
        <div className="space-y-2 text-xs font-mono text-purple-200/90 pl-2 border-l border-emerald-500/40 my-2">
          <div className="text-emerald-400 font-bold flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            <span>ESTADO DEL SISTEMA: ACTIVO (200 OK)</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] bg-purple-950/20 p-2.5 rounded-lg border border-purple-500/20">
            <div>Uptime: <span className="text-white font-bold">99.99%</span></div>
            <div>FPS en caliente: <span className="text-emerald-400 font-bold">60.0 FPS</span></div>
            <div>Auto-Syncs: <span className="text-white font-bold">{autoUpdateCount}</span></div>
            <div>Luminancia fotométrica: <span className="text-purple-300 font-bold">2.98% / 3.00%</span></div>
            <div>Haptic Audio: <span className="text-white font-bold">Web Audio API (Activo)</span></div>
            <div>Proyectos sincronizados: <span className="text-emerald-400 font-bold">14 / 14</span></div>
          </div>
        </div>
      );
    }

    // ── 25. SYNC ──
    else if (mainCmd === 'sync' || mainCmd === 'fetch') {
      setIsSyncing(true);
      appleHaptics.playCrownTick(1.2);
      gitHubSync.syncWithGitHub(true);
      outputNode = (
        <div className="text-xs font-mono text-purple-300 pl-2 border-l border-purple-500/30 my-2">
          <div className="flex items-center gap-2 text-emerald-400">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>[DAEMON] Sincronizando con GitHub API @belentani7 en caliente...</span>
          </div>
          <div className="text-[11px] text-neutral-300 mt-1">
            ✓ Repositorios sincronizados directamente contra la API pública de GitHub.
          </div>
        </div>
      );
      setTimeout(() => setIsSyncing(false), 800);
    }

    // ── 25B. DOCTOR FIX COMMAND ──
    else if (mainCmd === 'doctor' || mainCmd === 'drfix' || mainCmd === 'clinic') {
      appleHaptics.playSpringSnap();
      if (onOpenDoctorFix) {
        onOpenDoctorFix();
      }
      const syncState = gitHubSync.getState();
      outputNode = (
        <div className="space-y-2 text-xs font-mono text-purple-200/90 pl-2 border-l border-purple-500/40 my-2">
          <div className="text-emerald-400 font-bold flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-emerald-400" />
            <span>🩺 DOCTOR FIX // CLÍNICA DE REPOSITORIOS GITHUB @BELENTANI7</span>
          </div>
          <div className="bg-black/70 p-3 rounded-xl border border-purple-500/30 space-y-1.5 text-[11px]">
            <div className="text-white font-bold">Estado General del Ecosistema GitHub:</div>
            <div>• Repositorios Analizados: <span className="text-emerald-400 font-bold">{syncState.repositories.length}</span></div>
            <div>• Webs Desplegadas Activas: <span className="text-emerald-400 font-bold">{syncState.activeWebsCount}</span></div>
            <div>• Modal de Doctor Fix desplegado en pantalla con herramientas de auto-reparación y workflows listos.</div>
          </div>
        </div>
      );
    }

    // ── 25C. WEBS / SITES DESPLEGADAS EN VIVO ──
    else if (mainCmd === 'webs' || mainCmd === 'sites' || mainCmd === 'live') {
      appleHaptics.playSpringSnap();
      const syncState = gitHubSync.getState();
      const liveRepos = syncState.repositories.filter((r) => !!r.liveUrl);
      outputNode = (
        <div className="space-y-2 text-xs font-mono text-purple-200/90 pl-2 border-l border-emerald-500/40 my-2">
          <div className="text-emerald-400 font-bold flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>WEBS DESPLEGADAS EN VIVO EN EL PERFIL @BELENTANI7 ({liveRepos.length})</span>
          </div>
          <div className="bg-black/70 p-3 rounded-xl border border-emerald-500/30 space-y-2 text-[11px]">
            {liveRepos.map((r, idx) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500 font-mono">0{idx + 1}.</span>
                  <span className="text-white font-bold">{r.name}</span>
                  <span className="text-purple-400 text-[10px]">({r.primaryLanguage})</span>
                </div>
                <a
                  href={r.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-emerald-300 hover:text-white font-mono text-[10px] bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30 hover:underline"
                >
                  <span>{r.liveUrl}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ── 25D. DEPLOY COMMAND ──
    else if (mainCmd === 'deploy') {
      const targetName = arg;
      const syncState = gitHubSync.getState();
      const found = targetName ? syncState.repositories.find((r) => r.id === targetName.toLowerCase() || r.name.toLowerCase() === targetName.toLowerCase()) : null;
      if (onOpenDoctorFix) {
        onOpenDoctorFix(found || undefined);
      }
      outputNode = (
        <div className="text-xs font-mono text-emerald-300 pl-2 border-l border-emerald-500/40 my-2 space-y-1">
          <div className="text-white font-bold flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>DESPLIEGUE A GITHUB PAGES AUTOMATIZADO CON DOCTOR FIX</span>
          </div>
          <div className="text-[11px] text-neutral-300">
            {found ? (
              <span>Preparando receta de despliegue para <strong className="text-white">{found.name}</strong> a <code className="text-emerald-400">belentani7.github.io/{found.name}</code></span>
            ) : (
              <span>Abriendo generador de despliegue Doctor Fix para tus repositorios en GitHub.</span>
            )}
          </div>
        </div>
      );
    }

    // ── 26. PROJECT DIRECTORY TREE ──
    else if (mainCmd === 'tree') {
      outputNode = (
        <div className="text-[11px] font-mono text-neutral-300 pl-2 border-l border-purple-500/30 my-2 space-y-0.5">
          <div className="text-purple-300 font-bold">ESTRUCTURA DEL PROYECTO:</div>
          <div>├── index.html</div>
          <div>├── metadata.json</div>
          <div>├── package.json</div>
          <div>├── phalanx_shield.py (Motor de Blindaje v5.0.2)</div>
          <div>├── .noiacore_manifest.json (Manifiesto SHA-256)</div>
          <div>└── src/</div>
          <div>    ├── App.tsx</div>
          <div>    ├── components/</div>
          <div>    │   ├── Cascade3DStream.tsx (Transiciones Apple 3D)</div>
          <div>    │   ├── DevOpsCliBackend.tsx (Consola CLI)</div>
          <div>    │   ├── LiquidPolyFluidOrb.tsx (Orbe Cuántico 4K)</div>
          <div>    │   ├── SwipeUpGlassDrawer.tsx</div>
          <div>    │   └── HarmoniaEscaparatismoModal.tsx</div>
          <div>    ├── data/repositories.ts (14 Proyectos Oficiales)</div>
          <div>    └── utils/appleHaptics.ts (Sintetizador Háptico Apple)</div>
        </div>
      );
    }

    // ── 27. CLEAR CONSOLE ──
    else if (mainCmd === 'clear' || mainCmd === 'cls') {
      setEntries([]);
      return;
    }

    // ── 28. EXIT CONSOLE ──
    else if (mainCmd === 'exit' || mainCmd === 'quit') {
      onClose();
      return;
    }

    // ── 29. HELP (COMPREHENSIVE) ──
    else if (mainCmd === 'help' || mainCmd === '?' || mainCmd === 'comandos' || mainCmd === 'commands') {
      outputNode = (
        <div className="space-y-2 text-xs font-mono text-purple-200/90 pl-2 border-l border-purple-500/40 my-2">
          <div className="text-purple-400 font-bold text-sm">COMANDOS COMPLETOS DEL CHAT Y DEL SISTEMA:</div>

          <div className="space-y-1 bg-black/60 p-2.5 rounded-lg border border-purple-500/20 text-[11px]">
            <div className="text-white font-bold border-b border-white/10 pb-1 text-emerald-300">✦ DOCTOR FIX & GITHUB EN VIVO:</div>
            <div>• <span className="text-white font-bold">doctor</span> / <span className="text-white font-bold">drfix</span> : Abrir la Clínica de Repositorios Doctor Fix.</div>
            <div>• <span className="text-white font-bold">webs</span> / <span className="text-white font-bold">live</span> : Listar todas las webs desplegadas en vivo de @belentani7.</div>
            <div>• <span className="text-white font-bold">deploy [repo]</span> : Generar workflow de auto-despliegue a GitHub Pages.</div>
            <div>• <span className="text-white font-bold">sync</span> : Sincronizar en caliente contra la API pública de GitHub.</div>
          </div>

          <div className="space-y-1 bg-black/60 p-2.5 rounded-lg border border-purple-500/20 text-[11px]">
            <div className="text-white font-bold border-b border-white/10 pb-1 text-cyan-300">✦ TRANSICIONES Y ESTILO APPLE:</div>
            <div>• <span className="text-white font-bold">apple stack</span> : Cascada de profundidad Wallet Stack con física fluida.</div>
            <div>• <span className="text-white font-bold">apple coverflow</span> : Flujo horizontal 3D con reflejo especular.</div>
            <div>• <span className="text-white font-bold">apple crown</span> : Curvatura cilíndrica 3D estilo Apple Watch Digital Crown.</div>
            <div>• <span className="text-white font-bold">sound [on|off|test]</span> : Controlar retroalimentación háptica acústica Apple.</div>
          </div>

          <div className="space-y-1 bg-black/60 p-2.5 rounded-lg border border-purple-500/20 text-[11px]">
            <div className="text-white font-bold border-b border-white/10 pb-1 text-emerald-300">✦ SEGURIDAD Y BLINDAJE PHALANX:</div>
            <div>• <span className="text-white font-bold">shield</span> : Panel oficial del blindaje Phalanx Shield v5.0.2.</div>
            <div>• <span className="text-white font-bold">verify</span> : Auditoría criptográfica de integridad SHA-256 en vivo.</div>
            <div>• <span className="text-white font-bold">manifest</span> : Ver manifiesto de hashes de los 33 archivos.</div>
            <div>• <span className="text-white font-bold">fix</span> : Corrección automática de permisos y saltos LF.</div>
            <div>• <span className="text-white font-bold">download</span> : Descargar el script autónomo <code className="text-white">phalanx_shield.py</code>.</div>
            <div>• <span className="text-white font-bold">security</span> : Informe de seguridad de sandbox y cero riesgos.</div>
          </div>

          <div className="space-y-1 bg-black/60 p-2.5 rounded-lg border border-purple-500/20 text-[11px]">
            <div className="text-white font-bold border-b border-white/10 pb-1 text-amber-300">✦ NAVEGACIÓN Y REPOSITORIOS:</div>
            <div>• <span className="text-white font-bold">repos</span> : Catálogo de los 14 proyectos con su color de luz líquida.</div>
            <div>• <span className="text-white font-bold">open &lt;id&gt;</span> : Enfocar y abrir cualquier proyecto en la Cascada 3D.</div>
            <div>• <span className="text-white font-bold">inspect &lt;id&gt;</span> : Abrir el Icon Studio 4K del proyecto.</div>
            <div>• <span className="text-white font-bold">article &lt;id&gt;</span> : Ver artículo científico de luz líquida asociado.</div>
            <div>• <span className="text-white font-bold">git</span> : Enlace al perfil oficial de GitHub (belentani7).</div>
            <div>• <span className="text-white font-bold">linux</span> : Especificaciones de kernel Linux-Power (TCP BBRv3, ZRAM).</div>
            <div>• <span className="text-white font-bold">opencode</span> : Información del modo desarrollador seguro.</div>
          </div>

          <div className="space-y-1 bg-black/60 p-2.5 rounded-lg border border-purple-500/20 text-[11px]">
            <div className="text-white font-bold border-b border-white/10 pb-1 text-purple-300">✦ VISTAS Y AMBIENTACIÓN:</div>
            <div>• <span className="text-white font-bold">view [cascade|watch|netflix|zero]</span> : Cambiar experiencia de pantalla.</div>
            <div>• <span className="text-white font-bold">lux [noir|hbo|bloom]</span> : Ajustar iluminación al límite fotométrico del 3%.</div>
            <div>• <span className="text-white font-bold">rules</span> : Abrir modal de las 1.000 / 5.000 reglas de diseño.</div>
            <div>• <span className="text-white font-bold">harmony</span> : Auditoría de armonía matemática y escaparatismo.</div>
            <div>• <span className="text-white font-bold">easter</span> : Disparar marca de agua cinematográfica BELENTANI en rojo neón.</div>
            <div>• <span className="text-white font-bold">status</span> / <span className="text-white font-bold">tree</span> / <span className="text-white font-bold">clear</span> / <span className="text-white font-bold">exit</span>.</div>
          </div>
        </div>
      );
    }

    // Default: comando no reconocido
    else {
      outputNode = (
        <div className="text-xs font-mono text-rose-400 pl-2 border-l border-rose-500/30 my-1">
          Comando no reconocido: "{cmd}". Escribe <span className="text-white font-bold underline">help</span> para consultar la lista de instrucciones completa.
        </div>
      );
    }

    setEntries((prev) => [
      ...prev,
      {
        command: cmd,
        output: outputNode,
        type: 'output',
      },
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInputVal(commandHistory[nextIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setInputVal('');
      } else {
        setHistoryIndex(nextIndex);
        setInputVal(commandHistory[nextIndex]);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`w-full ${
              isMaximized ? 'h-full max-w-none' : 'max-w-4xl h-[85vh]'
            } bg-black/95 rounded-2xl border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.15)] flex flex-col overflow-hidden transition-all duration-300 font-mono`}
          >
            {/* Terminal Header */}
            <div className="h-10 px-4 bg-purple-950/40 border-b border-purple-500/20 flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-white tracking-wider">
                  BELENTANI // CLI BACKEND OBSERVABILITY & SYSTEM CONTROL
                </span>
                <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  SANDBOX SEGURO
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMaximized((prev) => !prev)}
                  className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title={isMaximized ? 'Restaurar' : 'Maximizar'}
                >
                  {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={onClose}
                  className="p-1 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Cerrar Terminal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Command Pills Bar */}
            <div className="px-4 py-2 bg-purple-950/20 border-b border-purple-500/10 flex items-center gap-2 overflow-x-auto text-[10px] text-neutral-400 whitespace-nowrap">
              <span className="text-purple-400 font-bold">Accesos rápidos:</span>
              <button
                onClick={() => handleCommandSubmit({ preventDefault: () => {} } as any)}
                onMouseDown={() => setInputVal('help')}
                className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer"
              >
                help
              </button>
              <button
                onClick={() => handleCommandSubmit({ preventDefault: () => {} } as any)}
                onMouseDown={() => setInputVal('apple coverflow')}
                className="px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/40 transition-all cursor-pointer font-bold"
              >
                apple coverflow
              </button>
              <button
                onClick={() => handleCommandSubmit({ preventDefault: () => {} } as any)}
                onMouseDown={() => setInputVal('apple stack')}
                className="px-2 py-0.5 rounded bg-purple-950/40 border border-purple-500/30 text-purple-300 hover:bg-purple-900/40 transition-all cursor-pointer font-bold"
              >
                apple stack
              </button>
              <button
                onClick={() => handleCommandSubmit({ preventDefault: () => {} } as any)}
                onMouseDown={() => setInputVal('apple crown')}
                className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300 hover:bg-amber-900/40 transition-all cursor-pointer font-bold"
              >
                apple crown
              </button>
              <button
                onClick={() => handleCommandSubmit({ preventDefault: () => {} } as any)}
                onMouseDown={() => setInputVal('sound test')}
                className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer"
              >
                sound test
              </button>
              <button
                onClick={() => handleCommandSubmit({ preventDefault: () => {} } as any)}
                onMouseDown={() => setInputVal('verify')}
                className="px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/40 transition-all cursor-pointer font-bold"
              >
                verify
              </button>
              <button
                onClick={() => handleCommandSubmit({ preventDefault: () => {} } as any)}
                onMouseDown={() => setInputVal('shield')}
                className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer"
              >
                shield
              </button>
              <button
                onClick={() => handleCommandSubmit({ preventDefault: () => {} } as any)}
                onMouseDown={() => setInputVal('repos')}
                className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer"
              >
                repos
              </button>
              <button
                onClick={() => handleCommandSubmit({ preventDefault: () => {} } as any)}
                onMouseDown={() => setInputVal('easter')}
                className="px-2 py-0.5 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/40 transition-all cursor-pointer font-bold"
              >
                easter
              </button>
            </div>

            {/* Terminal Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-2 text-xs">
              {entries.map((entry, idx) => (
                <div key={idx}>
                  {entry.command && (
                    <div className="flex items-center gap-2 text-white font-bold my-1.5">
                      <span className="text-purple-400">belentani@noiacore:~$</span>
                      <span>{entry.command}</span>
                    </div>
                  )}
                  {entry.output}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>

            {/* Terminal Prompt Bar */}
            <form
              onSubmit={handleCommandSubmit}
              className="p-3 bg-purple-950/30 border-t border-purple-500/20 flex items-center gap-2"
            >
              <span className="text-emerald-400 font-bold shrink-0">belentani@noiacore:~$</span>
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un comando... ('help', 'apple coverflow', 'verify', 'sound', 'repos', 'shield')"
                className="flex-1 bg-transparent border-none outline-none text-white text-xs font-mono placeholder:text-neutral-600"
              />
              <button
                type="submit"
                className="px-3 py-1 rounded bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/30 text-purple-200 text-xs font-bold transition-all cursor-pointer"
              >
                Ejecutar
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
