import React, { useState, useEffect } from 'react';
import { REPOSITORIES } from './data/repositories';
import { Repository, LightingMode, AppViewVersion, AppleCascadeMode } from './types';
import { PlasmaCanvas } from './components/PlasmaCanvas';
import { Cascade3DStream } from './components/Cascade3DStream';
import { SmartWatchCascadeTV } from './components/SmartWatchCascadeTV';
import { NetflixGrandScreen } from './components/NetflixGrandScreen';
import { ZeroTextScreen } from './components/ZeroTextScreen';
import { HarmoniaEscaparatismoModal } from './components/HarmoniaEscaparatismoModal';
import { LiquidLightArticleDrawer } from './components/LiquidLightArticleDrawer';
import { DevOpsCliBackend } from './components/DevOpsCliBackend';
import { IconStudioModal } from './components/IconStudioModal';
import { CustomIconStudio } from './components/CustomIconStudio';
import { DoctorFixModal } from './components/DoctorFixModal';
import { gitHubSync } from './services/githubSync';
import { X, Layers } from 'lucide-react';
import { appleHaptics } from './utils/appleHaptics';

export default function App() {
  // Defaulting strictly to 3% liquid light (ultra-noir-3) as requested
  const [lightingMode, setLightingMode] = useState<LightingMode>('ultra-noir-3');
  // Primary view version: 'cascade-3d' (Identical 3D Suspended Glass Stream matching image.png)
  const [viewVersion, setViewVersion] = useState<AppViewVersion>('cascade-3d');
  // Apple Cascade Transition Mode ('wallet-stack' | 'cover-flow' | 'cylinder-crown')
  const [appleMode, setAppleMode] = useState<AppleCascadeMode>('wallet-stack');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [targetRepoIndex, setTargetRepoIndex] = useState<number | null>(null);

  // Dynamic GitHub Sync state (Live from @belentani7)
  const [syncState, setSyncState] = useState(gitHubSync.getState());
  const repositories = syncState.repositories;

  // Modals & Drawers
  const [show1000RulesModal, setShow1000RulesModal] = useState<boolean>(false);
  const [showCliBackend, setShowCliBackend] = useState<boolean>(false);
  const [isDoctorFixOpen, setIsDoctorFixOpen] = useState<boolean>(false);
  const [doctorFixRepo, setDoctorFixRepo] = useState<Repository | undefined>(undefined);
  const [selectedRepoForArticle, setSelectedRepoForArticle] = useState<Repository | null>(null);
  const [selectedRepoForModal, setSelectedRepoForModal] = useState<Repository | null>(null);
  const [showStudioWorkbench, setShowStudioWorkbench] = useState<boolean>(false);

  // Subscribe to live GitHub Sync service on mount
  useEffect(() => {
    const unsubscribe = gitHubSync.subscribe((newState) => {
      setSyncState(newState);
    });
    // Trigger initial background sync
    gitHubSync.syncWithGitHub(false);
    return unsubscribe;
  }, []);

  // Global listener for backend CLI shortcut (backtick key ` or ~)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === '~') {
        e.preventDefault();
        setShowCliBackend((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-black text-[#e8e0f5] font-sans selection:bg-purple-900 selection:text-white">
      {/* ─── 1. Ultra-Dark 3% Liquid Light Plasma Canvas ─── */}
      <PlasmaCanvas mode={lightingMode} />

      {/* ─── 2. Faint Milky Diffuse Clouds (3% lux ceiling) ─── */}
      <div
        className="fixed inset-0 pointer-events-none z-[1] transition-opacity duration-1000"
        style={{
          opacity: lightingMode === 'ultra-noir-3' ? 0.04 : lightingMode === 'hbo-noir' ? 0.16 : 0.3,
          background: `
            radial-gradient(ellipse at 25% 25%, rgba(192, 132, 252, 0.08) 0%, transparent 55%),
            radial-gradient(ellipse at 75% 75%, rgba(147, 51, 234, 0.06) 0%, transparent 65%),
            radial-gradient(ellipse at 50% 50%, rgba(216, 180, 254, 0.03) 0%, transparent 70%)
          `,
          filter: 'blur(90px)',
        }}
      />

      {/* ─── 3. HBO Max Cinematic Grain Texture ─── */}
      <div
        className="fixed inset-0 pointer-events-none z-[2] opacity-[0.025] mix-blend-screen"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ─── 4. Active Experience Version Switcher ─── */}
      <div className="relative z-10 w-full h-full">
        {viewVersion === 'cascade-3d' ? (
          <Cascade3DStream
            repositories={repositories}
            lightingMode={lightingMode}
            onLightingChange={setLightingMode}
            onInspectIcon={(repo) => setSelectedRepoForModal(repo)}
            onOpenRulesModal={() => setShow1000RulesModal(true)}
            onOpenCliBackend={() => setShowCliBackend(true)}
            onOpenLiquidLightArticle={(repo) => setSelectedRepoForArticle(repo)}
            onOpenDoctorFix={(repo) => {
              setDoctorFixRepo(repo);
              setIsDoctorFixOpen(true);
            }}
            appleMode={appleMode}
            onAppleModeChange={setAppleMode}
            soundEnabled={soundEnabled}
            onToggleSound={() => {
              const next = appleHaptics.toggleMute();
              setSoundEnabled(next);
            }}
            targetRepoIndex={targetRepoIndex}
            onSelectRepoIndex={setTargetRepoIndex}
          />
        ) : viewVersion === 'smartwatch-cascade' ? (
          <SmartWatchCascadeTV
            repositories={repositories}
            lightingMode={lightingMode}
            onLightingChange={setLightingMode}
            onInspectIcon={(repo) => setSelectedRepoForModal(repo)}
            onOpenStudioWorkbench={() => setShowStudioWorkbench(true)}
            onSwitchVersion={setViewVersion}
            onOpenRulesModal={() => setShow1000RulesModal(true)}
            onOpenCliBackend={() => setShowCliBackend(true)}
            onOpenLiquidLightArticle={(repo) => setSelectedRepoForArticle(repo)}
          />
        ) : viewVersion === 'zero-text' ? (
          <ZeroTextScreen
            repositories={repositories}
            lightingMode={lightingMode}
            onLightingChange={setLightingMode}
            onInspectIcon={(repo) => setSelectedRepoForModal(repo)}
            onSwitchVersion={setViewVersion}
            onOpenRulesModal={() => setShow1000RulesModal(true)}
            onOpenStudioWorkbench={() => setShowStudioWorkbench(true)}
          />
        ) : (
          <NetflixGrandScreen
            repositories={repositories}
            lightingMode={lightingMode}
            onLightingChange={setLightingMode}
            onInspectIcon={(repo) => setSelectedRepoForModal(repo)}
            onSwitchVersion={setViewVersion}
            onOpenRulesModal={() => setShow1000RulesModal(true)}
            onOpenStudioWorkbench={() => setShowStudioWorkbench(true)}
          />
        )}
      </div>

      {/* ─── 5. 1,000 Reglas de Diseño, Armonía, Escaparatismo y Real Glass Glossy ─── */}
      <HarmoniaEscaparatismoModal
        isOpen={show1000RulesModal}
        onClose={() => setShow1000RulesModal(false)}
      />

      {/* ─── 6. Liquid Light Scientific Articles Drawer (Polaritons & Superfluidity) ─── */}
      <LiquidLightArticleDrawer
        repo={selectedRepoForArticle}
        isOpen={Boolean(selectedRepoForArticle)}
        onClose={() => setSelectedRepoForArticle(null)}
      />

      {/* ─── 7. DevOps CLI Backend Terminal (Accessed internally via [ ` ] or button) ─── */}
      <DevOpsCliBackend
        isOpen={showCliBackend}
        onClose={() => setShowCliBackend(false)}
        onOpenDoctorFix={(repo) => {
          setDoctorFixRepo(repo);
          setIsDoctorFixOpen(true);
        }}
        onSelectRepo={(repoId) => {
          const idx = repositories.findIndex(
            (r) => r.id.toLowerCase() === repoId.toLowerCase() || r.name.toLowerCase().includes(repoId.toLowerCase())
          );
          if (idx !== -1) {
            setTargetRepoIndex(idx);
            setViewVersion('cascade-3d');
          }
        }}
        onOpenArticle={(repoId) => {
          const r = repositories.find(
            (repo) => repo.id.toLowerCase() === repoId.toLowerCase() || repo.name.toLowerCase().includes(repoId.toLowerCase())
          );
          if (r) setSelectedRepoForArticle(r);
        }}
        onInspectIcon={(repoId) => {
          const r = repositories.find(
            (repo) => repo.id.toLowerCase() === repoId.toLowerCase() || repo.name.toLowerCase().includes(repoId.toLowerCase())
          );
          if (r) setSelectedRepoForModal(r);
        }}
        onOpenRules={() => setShow1000RulesModal(true)}
        onOpenHarmonia={() => setShow1000RulesModal(true)}
        onSwitchView={(v) => setViewVersion(v)}
        onChangeLighting={(m) => setLightingMode(m)}
        onChangeAppleMode={(m) => {
          setAppleMode(m);
          setViewVersion('cascade-3d');
        }}
        onToggleSound={(enable) => {
          const next = enable !== undefined ? appleHaptics.toggleMute(!enable) : appleHaptics.toggleMute();
          setSoundEnabled(next);
          return next;
        }}
      />

      {/* ─── 8. 4K High-Resolution Icon Studio Modal ─── */}
      <IconStudioModal
        repo={selectedRepoForModal}
        onClose={() => setSelectedRepoForModal(null)}
        lightingMode={lightingMode}
        onLightingChange={setLightingMode}
      />

      {/* ─── 9. Doctor Fix Agent: Clínica de Repositorios, Despliegues & Blindaje GitHub ─── */}
      <DoctorFixModal
        isOpen={isDoctorFixOpen}
        onClose={() => setIsDoctorFixOpen(false)}
        initialRepo={doctorFixRepo}
      />

      {/* ─── 10. Custom Icon Studio Drawer / Laboratory Modal ─── */}
      {showStudioWorkbench && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-3xl overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl my-8 bg-black/95 border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(168,85,247,0.25)]">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-purple-500/20">
              <div>
                <h3 className="text-base font-mono uppercase tracking-wider text-white">
                  LABORATORIO DE ICONOS PROCEDURALES EN VIVO
                </h3>
                <p className="text-xs font-mono text-purple-300/60 mt-0.5">
                  Prueba de halo fino, puff puff y dispersión cromática para repositorios públicos
                </p>
              </div>
              <button
                onClick={() => setShowStudioWorkbench(false)}
                className="p-1.5 rounded-xl border border-purple-500/20 bg-purple-950/40 text-purple-300 hover:text-white hover:border-purple-400/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <CustomIconStudio />
          </div>
        </div>
      )}
    </div>
  );
}
