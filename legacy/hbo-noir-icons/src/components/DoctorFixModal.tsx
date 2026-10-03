import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Stethoscope,
  X,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Copy,
  Check,
  Download,
  Terminal,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Globe,
  FileCode,
  ArrowUpRight,
  Code2,
  ChevronRight,
  Zap,
  BookOpen,
} from 'lucide-react';
import { Repository } from '../types';
import { gitHubSync, BelentaniProfileState, DoctorFixDiagnostic } from '../services/githubSync';
import { DoctorFixGenerator, GeneratedFixFile } from '../services/doctorFix';
import { appleHaptics } from '../utils/appleHaptics';

interface DoctorFixModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRepo?: Repository | null;
  onSelectRepo?: (repo: Repository) => void;
}

export const DoctorFixModal: React.FC<DoctorFixModalProps> = ({
  isOpen,
  onClose,
  initialRepo,
  onSelectRepo,
}) => {
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'capabilities' | 'generator'>('diagnosis');
  const [syncState, setSyncState] = useState<BelentaniProfileState>(gitHubSync.getState());
  const [selectedRepoId, setSelectedRepoId] = useState<string>(initialRepo?.id || 'manosabiertas');
  const [filterMode, setFilterMode] = useState<'all' | 'webs-only' | 'needs-attention'>('all');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<'pages' | 'phalanx' | 'security' | 'readme' | 'python' | 'cli'>('pages');

  // Sync state subscription
  useEffect(() => {
    const unsub = gitHubSync.subscribe((st) => setSyncState({ ...st }));
    return unsub;
  }, []);

  useEffect(() => {
    if (initialRepo) {
      setSelectedRepoId(initialRepo.id);
    }
  }, [initialRepo]);

  if (!isOpen) return null;

  const currentRepo = syncState.repositories.find((r) => r.id === selectedRepoId) || syncState.repositories[0];
  const diagnostic: DoctorFixDiagnostic | undefined = syncState.diagnostics[currentRepo?.id || ''];

  const filteredRepos = syncState.repositories.filter((r) => {
    if (filterMode === 'webs-only') return !!r.liveUrl;
    if (filterMode === 'needs-attention') {
      const diag = syncState.diagnostics[r.id];
      return diag && diag.healthScore < 85;
    }
    return true;
  });

  const getFileForCurrentRepo = (): GeneratedFixFile | { filename: string; language: string; description: string; content: string } => {
    if (!currentRepo) {
      return DoctorFixGenerator.generatePagesWorkflow('belentani-app');
    }
    switch (selectedFileType) {
      case 'pages':
        return DoctorFixGenerator.generatePagesWorkflow(currentRepo.name);
      case 'phalanx':
        return DoctorFixGenerator.generatePhalanxWorkflow();
      case 'security':
        return DoctorFixGenerator.generateSecurityPolicy(currentRepo.name);
      case 'readme':
        return DoctorFixGenerator.generateReadme(currentRepo);
      case 'python':
        return DoctorFixGenerator.generatePythonDoctorScript(currentRepo.name);
      case 'cli':
        return {
          filename: 'gh_commands.sh',
          language: 'bash',
          description: 'Comandos oficiales de GitHub CLI para configurar metadatos, homepage y despliegue.',
          content: DoctorFixGenerator.generateGhCliCommands(currentRepo),
        };
      default:
        return DoctorFixGenerator.generatePagesWorkflow(currentRepo.name);
    }
  };

  const currentFile = getFileForCurrentRepo();

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    appleHaptics.playSpringSnap();
    setCopiedFile(label);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const handleSyncRefresh = async () => {
    appleHaptics.playCrownTick(1.2);
    await gitHubSync.syncWithGitHub(true);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-5xl h-[88vh] bg-black/95 rounded-3xl border border-purple-500/30 shadow-[0_0_60px_rgba(168,85,247,0.18)] flex flex-col overflow-hidden font-mono"
        >
          {/* Header Bar */}
          <div className="h-14 px-5 bg-purple-950/40 border-b border-purple-500/20 flex items-center justify-between select-none">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                <Stethoscope className="w-4 h-4 text-purple-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white tracking-wide">
                    DOCTOR FIX // CLÍNICA DE REPOSITORIOS GITHUB
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                    @belentani7
                  </span>
                </div>
                <div className="text-[10px] text-purple-300/60">
                  Explorador, auto-despliegue de webs y blindaje automático en GitHub
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncRefresh}
                disabled={syncState.isLoading}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-neutral-300 hover:text-white transition-all cursor-pointer"
                title="Sincronizar ahora con la API de GitHub"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncState.isLoading ? 'animate-spin text-purple-400' : ''}`} />
                <span className="hidden sm:inline">Sincronizar API</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer"
                title="Cerrar Doctor Fix"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Sub-Tabs & Telemetry */}
          <div className="px-5 py-2.5 bg-black/60 border-b border-purple-500/15 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveTab('diagnosis');
                  appleHaptics.playCrownTick(0.8);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer font-bold ${
                  activeTab === 'diagnosis'
                    ? 'bg-purple-600/40 text-white border border-purple-400/60 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                    : 'text-neutral-400 hover:text-white bg-white/5'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>🩺 Diagnóstico & Repos</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('capabilities');
                  appleHaptics.playCrownTick(0.8);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer font-bold ${
                  activeTab === 'capabilities'
                    ? 'bg-purple-600/40 text-white border border-purple-400/60 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                    : 'text-neutral-400 hover:text-white bg-white/5'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>🚀 Qué Puede Hacer Por Ti</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('generator');
                  appleHaptics.playCrownTick(0.8);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer font-bold ${
                  activeTab === 'generator'
                    ? 'bg-purple-600/40 text-white border border-purple-400/60 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                    : 'text-neutral-400 hover:text-white bg-white/5'
                }`}
              >
                <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>🛠️ Generador & Auto-Fix</span>
              </button>
            </div>

            {/* Live Stats Pill */}
            <div className="flex items-center gap-3 text-[11px] text-neutral-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Globe className="w-3.5 h-3.5" />
                <span>{syncState.activeWebsCount} Webs Desplegadas Activas</span>
              </span>
              <span className="text-neutral-600">·</span>
              <span>{syncState.publicReposCount} Repositorios</span>
              <span className="text-neutral-600">·</span>
              <span className="text-purple-300">Sync: {syncState.lastSyncTime}</span>
            </div>
          </div>

          {/* Modal Main Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* ════════════════════════════════════════════════════════════════
                TAB 1: DIAGNOSTICS & REPOS
               ════════════════════════════════════════════════════════════════ */}
            {activeTab === 'diagnosis' && (
              <div className="space-y-5">
                {/* Profile Summary Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-black to-purple-950/30 border border-purple-500/25 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <img
                      src={syncState.avatarUrl}
                      alt={syncState.username}
                      className="w-12 h-12 rounded-2xl border border-purple-400/40 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                    />
                    <div>
                      <div className="text-white font-bold flex items-center gap-2">
                        <span>Pedro Belentani (@{syncState.username})</span>
                        <a
                          href={`https://github.com/${syncState.username}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-purple-400 hover:text-white transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <div className="text-xs text-neutral-400 max-w-xl">{syncState.bio}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href="/doctor_fix.py"
                      download="doctor_fix.py"
                      className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-white text-xs transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-purple-300" />
                      <span>Descargar doctor_fix.py</span>
                    </a>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-purple-300/80 mr-1">Filtrar:</span>
                    <button
                      onClick={() => setFilterMode('all')}
                      className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                        filterMode === 'all'
                          ? 'bg-purple-900/60 text-white font-bold border border-purple-400/50'
                          : 'bg-white/5 text-neutral-400 hover:text-white'
                      }`}
                    >
                      Todos ({syncState.repositories.length})
                    </button>
                    <button
                      onClick={() => setFilterMode('webs-only')}
                      className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1 ${
                        filterMode === 'webs-only'
                          ? 'bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-500/50'
                          : 'bg-white/5 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Globe className="w-3 h-3 text-emerald-400" />
                      <span>Solo Webs Desplegadas ({syncState.activeWebsCount})</span>
                    </button>
                    <button
                      onClick={() => setFilterMode('needs-attention')}
                      className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                        filterMode === 'needs-attention'
                          ? 'bg-amber-950/60 text-amber-300 font-bold border border-amber-500/50'
                          : 'bg-white/5 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span>Requieren Atención Dr. Fix</span>
                    </button>
                  </div>
                </div>

                {/* Repos Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[48vh] overflow-y-auto pr-1">
                  {filteredRepos.map((repo) => {
                    const diag = syncState.diagnostics[repo.id];
                    const isSelected = repo.id === selectedRepoId;

                    return (
                      <div
                        key={repo.id}
                        onClick={() => {
                          setSelectedRepoId(repo.id);
                          onSelectRepo?.(repo);
                          appleHaptics.playCrownTick(0.8);
                        }}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-purple-950/30 border-purple-400/70 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                            : 'bg-black/60 border-white/10 hover:border-purple-500/30 hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: repo.liquidLight.hex }}
                            />
                            <span className="font-bold text-white text-sm hover:text-purple-300 transition-colors">
                              {repo.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {diag && (
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                  diag.healthScore >= 85
                                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                                    : diag.healthScore >= 65
                                    ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                                    : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                                }`}
                              >
                                Salud: {diag.healthScore}%
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                          {repo.tagline || repo.description}
                        </p>

                        {/* Status indicators */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-[10px]">
                          <div className="flex items-center gap-3">
                            {repo.liveUrl ? (
                              <a
                                href={repo.liveUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 text-emerald-400 font-bold hover:underline"
                              >
                                <Globe className="w-3 h-3" />
                                <span>Web Activa ↗</span>
                              </a>
                            ) : (
                              <span className="flex items-center gap-1 text-amber-400/80">
                                <AlertCircle className="w-3 h-3" />
                                <span>Sin Web Desplegada</span>
                              </span>
                            )}
                            <span className="text-neutral-500">{repo.primaryLanguage}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRepoId(repo.id);
                                setActiveTab('generator');
                                appleHaptics.playSpringSnap();
                              }}
                              className="px-2 py-0.5 rounded bg-purple-900/40 hover:bg-purple-900/70 border border-purple-400/30 text-purple-200 text-[10px] transition-all"
                            >
                              Auto-Fix 🛠️
                            </button>
                            <a
                              href={repo.githubUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-neutral-400 hover:text-white"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                TAB 2: WHAT DOCTOR FIX CAN DO FOR YOU (CAPABILITIES)
               ════════════════════════════════════════════════════════════════ */}
            {activeTab === 'capabilities' && (
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/25">
                  <div className="text-white font-bold text-base flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>¿QUÉ PUEDE HACER DOCTOR FIX POR PEDRO BELENTANI CUANDO ESTÉS EN GITHUB?</span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Doctor Fix es tu asistente de arquitectura y clínica de repositorios. Cuando estés trabajando en tus proyectos en GitHub, Doctor Fix explora, diagnostica y ejecuta de forma autónoma las siguientes tareas críticas:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Cap 1: Auto-Deploy to GitHub Pages */}
                  <div className="p-4 rounded-2xl bg-black/70 border border-purple-500/20 space-y-2 hover:border-purple-400/50 transition-all">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <Globe className="w-4 h-4" />
                      <span>1. Despliegue Continuo a GitHub Pages</span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      Para los repositorios que no tienen web viva, Doctor Fix genera un workflow automatizado con <code className="text-purple-300">actions/deploy-pages@v4</code>. Cada vez que hagas <code className="text-white">git push</code>, la web se compila y queda en línea en <strong className="text-emerald-400">belentani7.github.io/&lt;repo&gt;/</strong> sin tocar servidores.
                    </p>
                    <div className="pt-1">
                      <button
                        onClick={() => {
                          setSelectedFileType('pages');
                          setActiveTab('generator');
                        }}
                        className="text-xs text-purple-300 underline hover:text-white cursor-pointer"
                      >
                        → Ver y copiar workflow de despliegue
                      </button>
                    </div>
                  </div>

                  {/* Cap 2: Blindaje Phalanx Shield CI/CD */}
                  <div className="p-4 rounded-2xl bg-black/70 border border-purple-500/20 space-y-2 hover:border-purple-400/50 transition-all">
                    <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                      <ShieldCheck className="w-4 h-4" />
                      <span>2. Blindaje Phalanx Shield en CI/CD</span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      Instala una GitHub Action que en cada pull request o commit audita secretos, verifica las sumas criptográficas SHA-256 del manifiesto <code className="text-purple-300">.noiacore_manifest.json</code> y repara automáticamente saltos de línea LF y permisos.
                    </p>
                    <div className="pt-1">
                      <button
                        onClick={() => {
                          setSelectedFileType('phalanx');
                          setActiveTab('generator');
                        }}
                        className="text-xs text-purple-300 underline hover:text-white cursor-pointer"
                      >
                        → Ver y copiar workflow de Phalanx Shield
                      </button>
                    </div>
                  </div>

                  {/* Cap 3: Curación de Metadatos & SEO en GitHub */}
                  <div className="p-4 rounded-2xl bg-black/70 border border-purple-500/20 space-y-2 hover:border-purple-400/50 transition-all">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                      <Terminal className="w-4 h-4" />
                      <span>3. Automatización con GitHub CLI (`gh`)</span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      Genera los comandos exactos para configurar con 1 clic en la consola la <code className="text-amber-300">homepage</code> de tu web activa, la descripción oficial y las etiquetas (#education, #wcag-aaa, #liquid-light) para que tus repos destaquen en las búsquedas de GitHub.
                    </p>
                    <div className="pt-1">
                      <button
                        onClick={() => {
                          setSelectedFileType('cli');
                          setActiveTab('generator');
                        }}
                        className="text-xs text-amber-300 underline hover:text-white cursor-pointer"
                      >
                        → Ver comandos de GitHub CLI
                      </button>
                    </div>
                  </div>

                  {/* Cap 4: Estandarización de Documentación & Badges */}
                  <div className="p-4 rounded-2xl bg-black/70 border border-purple-500/20 space-y-2 hover:border-purple-400/50 transition-all">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                      <FileCode className="w-4 h-4" />
                      <span>4. README Pro con Badges de Luz Líquida & SECURITY.md</span>
                    </div>
                    <p className="text-xs text-neutral-300 leading-relaxed">
                      Crea la documentación estándar con badges en vivo de estado (Live Demo, Phalanx Shield, MIT License, 3% Lux) y la política de divulgación responsable <code className="text-cyan-300">SECURITY.md</code> requerida para proyectos de impacto público.
                    </p>
                    <div className="pt-1">
                      <button
                        onClick={() => {
                          setSelectedFileType('security');
                          setActiveTab('generator');
                        }}
                        className="text-xs text-cyan-300 underline hover:text-white cursor-pointer"
                      >
                        → Ver plantillas de documentación
                      </button>
                    </div>
                  </div>
                </div>

                {/* Cap 5: Script Autónomo Portable */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/30 to-black border border-purple-500/30 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-white font-bold text-sm flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-purple-400" />
                      <span>Script Autónomo Portable: doctor_fix.py</span>
                    </div>
                    <div className="text-xs text-neutral-400 mt-1">
                      Ejecútalo en cualquier terminal o en GitHub Codespaces: <code className="text-white">python3 doctor_fix.py --fix</code>
                    </div>
                  </div>

                  <a
                    href="/doctor_fix.py"
                    download="doctor_fix.py"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Descargar doctor_fix.py</span>
                  </a>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                TAB 3: GENERATOR & AUTO-FIX WORKSPACE
               ════════════════════════════════════════════════════════════════ */}
            {activeTab === 'generator' && (
              <div className="space-y-4">
                {/* Selector Bar */}
                <div className="p-3.5 rounded-2xl bg-black/70 border border-purple-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-300 font-bold">Repositorio Objetivo:</span>
                    <select
                      value={selectedRepoId}
                      onChange={(e) => {
                        setSelectedRepoId(e.target.value);
                        appleHaptics.playCrownTick(0.8);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-400/40 text-white font-bold focus:outline-none cursor-pointer"
                    >
                      {syncState.repositories.map((r) => (
                        <option key={r.id} value={r.id} className="bg-black text-white">
                          {r.name} {r.liveUrl ? '(Web Activa)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {currentRepo?.liveUrl && (
                    <a
                      href={currentRepo.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 font-bold hover:bg-emerald-900/50 transition-all text-[11px]"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Visitar Web Actual: {currentRepo.name} ↗</span>
                    </a>
                  )}
                </div>

                {/* File Type Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <button
                    onClick={() => setSelectedFileType('pages')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold ${
                      selectedFileType === 'pages'
                        ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                        : 'bg-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    🚀 deploy-pages.yml
                  </button>

                  <button
                    onClick={() => setSelectedFileType('phalanx')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold ${
                      selectedFileType === 'phalanx'
                        ? 'bg-purple-950/70 text-purple-300 border border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                        : 'bg-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    🛡️ phalanx_shield.yml
                  </button>

                  <button
                    onClick={() => setSelectedFileType('security')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold ${
                      selectedFileType === 'security'
                        ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                        : 'bg-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    📋 SECURITY.md
                  </button>

                  <button
                    onClick={() => setSelectedFileType('readme')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold ${
                      selectedFileType === 'readme'
                        ? 'bg-amber-950/70 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                        : 'bg-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    📝 README.md
                  </button>

                  <button
                    onClick={() => setSelectedFileType('cli')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold ${
                      selectedFileType === 'cli'
                        ? 'bg-yellow-950/70 text-yellow-300 border border-yellow-500/50 shadow-[0_0_12px_rgba(234,179,8,0.3)]'
                        : 'bg-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    ⚡ GitHub CLI (gh)
                  </button>

                  <button
                    onClick={() => setSelectedFileType('python')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer font-bold ${
                      selectedFileType === 'python'
                        ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
                        : 'bg-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    🐍 doctor_fix.py
                  </button>
                </div>

                {/* Code Preview & Actions Card */}
                <div className="rounded-2xl bg-black/90 border border-purple-500/30 overflow-hidden flex flex-col">
                  {/* File Meta Header */}
                  <div className="px-4 py-2.5 bg-purple-950/40 border-b border-purple-500/20 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-purple-400" />
                      <span className="font-bold text-white">{currentFile.filename}</span>
                      <span className="text-neutral-500">·</span>
                      <span className="text-neutral-400">{currentFile.description}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(currentFile.content, currentFile.filename)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-white text-xs transition-all cursor-pointer"
                      >
                        {copiedFile === currentFile.filename ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar Archivo</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Code Box */}
                  <div className="p-4 bg-black/80 max-h-[42vh] overflow-y-auto font-mono text-[11px] leading-relaxed text-neutral-200">
                    <pre className="whitespace-pre-wrap">{currentFile.content}</pre>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="h-12 px-5 bg-purple-950/30 border-t border-purple-500/20 flex items-center justify-between text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-neutral-300">Doctor Fix v2.1.0 listo para GitHub @belentani7</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
