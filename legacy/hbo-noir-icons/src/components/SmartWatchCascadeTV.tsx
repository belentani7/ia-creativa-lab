import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Github,
  Sliders,
  Maximize2,
  Terminal,
  BookOpen,
  Atom,
  RefreshCw,
  Eye,
  Layers,
  Activity,
  Tv,
  Smartphone,
  Watch,
  Monitor,
  Radio,
  Share2,
  ChevronUp
} from 'lucide-react';
import { Repository, LightingMode, AppViewVersion, DeviceExperience } from '../types';
import { RepoIcon } from './RepoIcon';
import { SwipeUpGlassDrawer } from './SwipeUpGlassDrawer';

interface SmartWatchCascadeTVProps {
  repositories: Repository[];
  lightingMode: LightingMode;
  onLightingChange: (mode: LightingMode) => void;
  onInspectIcon: (repo: Repository) => void;
  onOpenStudioWorkbench: () => void;
  onSwitchVersion: (version: AppViewVersion) => void;
  onOpenRulesModal: () => void;
  onOpenCliBackend: () => void;
  onOpenLiquidLightArticle: (repo: Repository) => void;
}

export const SmartWatchCascadeTV: React.FC<SmartWatchCascadeTVProps> = ({
  repositories,
  lightingMode,
  onLightingChange,
  onInspectIcon,
  onOpenStudioWorkbench,
  onSwitchVersion,
  onOpenRulesModal,
  onOpenCliBackend,
  onOpenLiquidLightArticle,
}) => {
  // Sort with education repositories strictly first
  const sortedRepos = useMemo(() => {
    return [...repositories].sort((a, b) => {
      if (a.isEducation && !b.isEducation) return -1;
      if (!a.isEducation && b.isEducation) return 1;
      return a.priorityOrder - b.priorityOrder;
    });
  }, [repositories]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [deviceExperience, setDeviceExperience] = useState<DeviceExperience>('tv');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [crownRotation, setCrownRotation] = useState(0);
  const [isDraggingCrown, setIsDraggingCrown] = useState(false);
  const [autoSyncTime, setAutoSyncTime] = useState(new Date().toLocaleTimeString());
  const [autoSyncCount, setAutoSyncCount] = useState(214);
  const [isCopied, setIsCopied] = useState(false);

  // Pointer micro-distortion state for physics and real material response
  const [tilt, setTilt] = useState<{ x: number; y: number; sheenX: number; sheenY: number }>({
    x: 0,
    y: 0,
    sheenX: 0,
    sheenY: 0,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const crownStartYRef = useRef<number>(0);

  const currentRepo = sortedRepos[currentIndex] || sortedRepos[0];

  // Periodic automatic updates ticker (Backend auto-sync daemon simulation)
  useEffect(() => {
    const timer = setInterval(() => {
      setAutoSyncTime(new Date().toLocaleTimeString());
      setAutoSyncCount((prev) => prev + 1);
    }, 4200);
    return () => clearInterval(timer);
  }, []);

  // Navigation handlers with toroidal wrap
  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % sortedRepos.length);
    setCrownRotation((prev) => prev + 25.7);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + sortedRepos.length) % sortedRepos.length);
    setCrownRotation((prev) => prev - 25.7);
  };

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
    setCrownRotation(index * 25.7);
  };

  // Keyboard navigation & CLI backtick listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === '~') {
        e.preventDefault();
        onOpenCliBackend();
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        goToNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        goToPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sortedRepos.length]);

  // Wheel scrolling (Smart Watch Cascade feel)
  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) > 28) {
      if (e.deltaY > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
  };

  // Pointer micro-distortion handler
  const handlePanelMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      x: x * 4.5,
      y: -y * 4.5,
      sheenX: x * 24,
      sheenY: y * 24,
    });
  };

  const handlePanelMouseLeave = () => {
    setTilt({ x: 0, y: 0, sheenX: 0, sheenY: 0 });
  };

  // Apple Watch Digital Crown drag handling
  const handleCrownMouseDown = (e: React.MouseEvent) => {
    setIsDraggingCrown(true);
    crownStartYRef.current = e.clientY;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingCrown) return;
      const deltaY = e.clientY - crownStartYRef.current;
      if (Math.abs(deltaY) > 20) {
        if (deltaY > 0) {
          goToNext();
        } else {
          goToPrev();
        }
        crownStartYRef.current = e.clientY;
      }
    };

    const handleMouseUp = () => {
      setIsDraggingCrown(false);
    };

    if (isDraggingCrown) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingCrown]);

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      className="relative w-full h-full min-h-screen flex flex-col justify-between bg-black text-white font-sans overflow-hidden select-none"
    >
      {/* ─── 1. TOP STATUS & NAVIGATION BAR (Apple High-End Glass) ─── */}
      <header className="relative z-30 flex flex-wrap items-center justify-between px-4 sm:px-8 py-3 bg-black/80 border-b border-purple-950/30 backdrop-blur-3xl gap-2">
        {/* Left Brand & Auto-Update Pulse */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shadow-[0_0_12px_currentColor]"
              style={{
                backgroundColor: currentRepo.liquidLight.hex,
                color: currentRepo.liquidLight.hex,
              }}
            />
            <span className="font-bold tracking-wider text-sm sm:text-base text-white font-mono">
              PEDRO BELENTANI
            </span>
          </div>

          <span className="hidden md:inline text-neutral-600">|</span>

          {/* Auto-Update Pulse Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/60 border border-purple-500/20 text-[11px] font-mono text-purple-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>SYNC #{autoSyncCount} ({autoSyncTime})</span>
          </div>
        </div>

        {/* Center: 4 Dedicated Device Experiences (Smart Watch → Mobile → Desktop → TV) */}
        <div className="flex items-center bg-black/90 p-1 rounded-2xl border border-purple-500/30 text-xs font-mono">
          <button
            onClick={() => setDeviceExperience('smartwatch')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all ${
              deviceExperience === 'smartwatch'
                ? 'bg-purple-600 text-white font-bold shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'text-purple-300/70 hover:text-white'
            }`}
            title="Experiencia Smart Watch: Mínimo táctil absoluto con corona rotatoria"
          >
            <Watch className="w-3.5 h-3.5" />
            <span className="hidden md:inline">SMART WATCH</span>
          </button>

          <button
            onClick={() => setDeviceExperience('mobile')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all ${
              deviceExperience === 'mobile'
                ? 'bg-purple-600 text-white font-bold shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'text-purple-300/70 hover:text-white'
            }`}
            title="Experiencia Móvil: Cascada 3D vertical + Pantalla glass suspendida"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden md:inline">MÓVIL</span>
          </button>

          <button
            onClick={() => setDeviceExperience('desktop')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all ${
              deviceExperience === 'desktop'
                ? 'bg-purple-600 text-white font-bold shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'text-purple-300/70 hover:text-white'
            }`}
            title="Experiencia Desktop: Escaparate cinematográfico con ángulo de Brewster"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden md:inline">DESKTOP</span>
          </button>

          <button
            onClick={() => setDeviceExperience('tv')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all ${
              deviceExperience === 'tv'
                ? 'bg-purple-600 text-white font-bold shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'text-purple-300/70 hover:text-white'
            }`}
            title="Experiencia TV: Composición teatral horizontal 16:9 con halo bias lighting"
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="hidden md:inline">TV 16:9</span>
          </button>
        </div>

        {/* Right Controls: Motor de Reglas, CLI Backend & 3% Lux */}
        <div className="flex items-center gap-2">
          {/* Rules Engine Button */}
          <button
            onClick={onOpenRulesModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-400/40 text-purple-200 hover:text-white text-xs font-mono transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)]"
            title="Abrir Motor de Reglas Generativo (20 Categorías & 20.000 Reglas)"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span className="font-bold hidden sm:inline">MOTOR DE REGLAS</span>
            <span className="font-bold sm:hidden">REGLAS</span>
          </button>

          {/* CLI Backend Trigger */}
          <button
            onClick={onOpenCliBackend}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-purple-500/30 text-purple-200 hover:text-white text-xs font-mono transition-all shadow-[0_0_12px_rgba(168,85,247,0.2)]"
            title="Abrir Consola CLI de Administración Interna (Atajo: tecla [ ` ])"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline font-bold">CLI</span>
          </button>

          {/* 3% Lux Mode Button */}
          <button
            onClick={() =>
              onLightingChange(lightingMode === 'ultra-noir-3' ? 'liquid-bloom' : 'ultra-noir-3')
            }
            className={`px-2.5 py-1.5 rounded-2xl text-xs font-mono border transition-all ${
              lightingMode === 'ultra-noir-3'
                ? 'bg-purple-950 border-purple-400 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                : 'bg-black/60 border-purple-900/30 text-purple-300/70 hover:text-white'
            }`}
            title="3% Lux Líquida Estricta (8/255 RGB)"
          >
            3% LUX
          </button>
        </div>
      </header>

      {/* ─── 2. MAIN STAGE: 4 DEDICATED ARCHITECTURAL EXPERIENCES ─── */}
      <main className="relative flex-1 flex items-center justify-center p-3 sm:p-6 md:p-8 overflow-hidden">
        {/* Ambient Backlight (Bias Lighting) Cast on the virtual wall behind the display */}
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-700 opacity-25"
          style={{
            background: `radial-gradient(circle at center, ${currentRepo.liquidLight.hex} 0%, transparent 60%)`,
          }}
        />

        {/* ─── EXPERIENCE A: SMART WATCH (Mínimo Absoluto Táctil) ─── */}
        {deviceExperience === 'smartwatch' && (
          <div className="relative flex flex-col items-center justify-center animate-in zoom-in-95 duration-400">
            {/* Apple Watch Titanium Case Casing with Ceramic Back and Sapphire Curved Crystal */}
            <div className="relative w-80 h-96 sm:w-96 sm:h-[420px] rounded-[52px] bg-neutral-900/90 border-4 border-neutral-700/80 p-5 shadow-[0_0_80px_rgba(0,0,0,0.95),inset_0_0_20px_rgba(255,255,255,0.1)] flex flex-col justify-between overflow-hidden">
              {/* Sapphire Glass 45 deg Specular Arc */}
              <div
                className="absolute inset-0 pointer-events-none z-30 rounded-[48px]"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.02) 25%, transparent 45%, rgba(255,255,255,0.05) 75%, transparent 100%)',
                }}
              />

              {/* Top Watch Complications Bar */}
              <div className="relative z-20 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span className="text-emerald-400 font-bold">16:45 BARCELONA</span>
                <div className="flex items-center gap-1 text-purple-300">
                  <span
                    className="w-2 h-2 rounded-full animate-ping"
                    style={{ backgroundColor: currentRepo.liquidLight.hex }}
                  />
                  <span>3% LUX</span>
                </div>
              </div>

              {/* Center Watch Face: Monumental 0-Text Word + 4K Procedural Monoglyph */}
              <div className="relative z-20 flex flex-col items-center justify-center text-center my-auto space-y-3">
                {/* 4K Monoglyph with Sub-surface Radial Glow */}
                <div
                  className="relative cursor-pointer"
                  onClick={() => onInspectIcon(currentRepo)}
                >
                  <div
                    className="absolute inset-0 rounded-full blur-2xl opacity-40"
                    style={{ backgroundColor: currentRepo.liquidLight.hex }}
                  />
                  <RepoIcon
                    iconConfig={currentRepo.iconConfig}
                    primaryLanguage={currentRepo.primaryLanguage}
                    languageColor={currentRepo.languageColor}
                    size="lg"
                    lightingMode="ultra-noir-3"
                  />
                </div>

                {/* Monumental Single Word */}
                <h1
                  className="text-3xl sm:text-4xl font-black font-mono tracking-tighter uppercase"
                  style={{ color: currentRepo.liquidLight.hex }}
                >
                  {currentRepo.singleWord}
                </h1>

                <p className="text-xs text-neutral-300 font-mono tracking-wide line-clamp-2 max-w-[240px]">
                  {currentRepo.name}
                </p>
              </div>

              {/* Bottom Watch Bar: Index Indicator & Swipe-Up Details Trigger */}
              <div className="relative z-20 flex items-center justify-between pt-2 border-t border-white/10 text-xs font-mono">
                <span className="text-neutral-400">
                  #{currentIndex + 1} / {sortedRepos.length}
                </span>

                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="flex items-center gap-1 text-purple-300 hover:text-white px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 transition-all cursor-pointer"
                >
                  <span>DETALLES</span>
                  <ChevronUp className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Smart Watch External Physical Digital Crown Attached to Right Side */}
            <div className="absolute -right-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 z-40">
              <button
                onClick={goToPrev}
                className="p-1.5 rounded-full bg-neutral-800 hover:bg-purple-950 border border-purple-500/40 text-purple-300 hover:text-white transition-all shadow-lg"
                title="Girar Corona Arriba (Anterior)"
              >
                <ChevronLeft className="w-3.5 h-3.5 rotate-90" />
              </button>

              <div
                onMouseDown={handleCrownMouseDown}
                className="w-5 h-20 rounded-lg bg-neutral-800 border-2 border-purple-400/50 flex flex-col justify-around py-1 cursor-ns-resize overflow-hidden shadow-xl"
                title="Arrastra para rotar la corona táctil"
              >
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="w-full h-[1.5px] bg-neutral-500" />
                ))}
              </div>

              <button
                onClick={goToNext}
                className="p-1.5 rounded-full bg-neutral-800 hover:bg-purple-950 border border-purple-500/40 text-purple-300 hover:text-white transition-all shadow-lg"
                title="Girar Corona Abajo (Siguiente)"
              >
                <ChevronRight className="w-4 h-4 rotate-90" />
              </button>
            </div>
          </div>
        )}

        {/* ─── EXPERIENCE B: MOBILE (Cascada Vertical + Ventana Glass Flotante) ─── */}
        {deviceExperience === 'mobile' && (
          <div className="relative w-full max-w-md h-[78vh] flex flex-col justify-between animate-in zoom-in-95 duration-400">
            {/* Mobile Vertical 3D Cascade Stack */}
            <div className="relative flex-1 flex flex-col items-center justify-center p-4 space-y-4">
              {/* Previous Floating Card Preview */}
              <div
                onClick={goToPrev}
                className="w-full h-16 rounded-2xl bg-neutral-950/60 border border-white/10 opacity-35 hover:opacity-70 transition-all flex items-center justify-between px-5 cursor-pointer filter blur-[1px] transform -translate-y-2 scale-95"
              >
                <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
                  {sortedRepos[(currentIndex - 1 + sortedRepos.length) % sortedRepos.length].singleWord}
                </span>
                <span className="text-xs text-neutral-300">
                  {sortedRepos[(currentIndex - 1 + sortedRepos.length) % sortedRepos.length].name}
                </span>
              </div>

              {/* Active Mobile Horizontal Glass Card */}
              <motion.div
                key={currentRepo.id}
                initial={{ opacity: 0.8, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full rounded-3xl bg-neutral-950/90 border border-white/20 p-6 flex flex-col justify-between shadow-[0_0_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
                style={{ borderColor: `${currentRepo.liquidLight.hex}70` }}
              >
                {/* 45 deg Specular Highlight */}
                <div
                  className="absolute inset-0 pointer-events-none rounded-3xl"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 30%, transparent 50%, rgba(255,255,255,0.03) 75%, transparent 100%)',
                  }}
                />

                <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs font-mono">
                  <span
                    className="font-bold px-2 py-0.5 rounded-full border"
                    style={{
                      borderColor: currentRepo.liquidLight.hex,
                      color: currentRepo.liquidLight.hex,
                    }}
                  >
                    0-TEXTO: «{currentRepo.singleWord}»
                  </span>
                  <span className="text-neutral-400">#{currentIndex + 1} de {sortedRepos.length}</span>
                </div>

                <div className="flex items-center gap-4 my-4">
                  <div className="shrink-0" onClick={() => onInspectIcon(currentRepo)}>
                    <RepoIcon
                      iconConfig={currentRepo.iconConfig}
                      primaryLanguage={currentRepo.primaryLanguage}
                      languageColor={currentRepo.languageColor}
                      size="lg"
                      lightingMode="ultra-noir-3"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {currentRepo.name}
                    </h2>
                    <p className="text-xs text-neutral-300 font-sans mt-1 line-clamp-2">
                      {currentRepo.description}
                    </p>
                  </div>
                </div>

                {/* Direct Action */}
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="w-full mt-2 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <ChevronUp className="w-4 h-4 text-purple-400" />
                  <span>DESLIZA HACIA ARRIBA · VENTANA GLASS</span>
                </button>
              </motion.div>

              {/* Next Floating Card Preview */}
              <div
                onClick={goToNext}
                className="w-full h-16 rounded-2xl bg-neutral-950/60 border border-white/10 opacity-35 hover:opacity-70 transition-all flex items-center justify-between px-5 cursor-pointer filter blur-[1px] transform translate-y-2 scale-95"
              >
                <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
                  {sortedRepos[(currentIndex + 1) % sortedRepos.length].singleWord}
                </span>
                <span className="text-xs text-neutral-300">
                  {sortedRepos[(currentIndex + 1) % sortedRepos.length].name}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ─── EXPERIENCE C: DESKTOP (Escaparate Cinematográfico con Refracción e Inercia) ─── */}
        {deviceExperience === 'desktop' && (
          <div className="relative w-full max-w-6xl flex items-center justify-center perspective-[1400px] animate-in zoom-in-95 duration-400">
            {/* Previous Card with Brewster Angle 3D Perspective */}
            <div
              onClick={goToPrev}
              className="hidden lg:block absolute left-4 z-10 w-[42%] aspect-[16/9] rounded-3xl opacity-25 hover:opacity-50 transition-all duration-500 cursor-pointer filter blur-[2px] transform -translate-x-24 scale-90 rotate-y-20 bg-neutral-950/80 border border-white/15 p-6"
              style={{
                borderColor: `${sortedRepos[(currentIndex - 1 + sortedRepos.length) % sortedRepos.length].liquidLight.hex}40`,
              }}
            >
              <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
                {sortedRepos[(currentIndex - 1 + sortedRepos.length) % sortedRepos.length].singleWord}
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                {sortedRepos[(currentIndex - 1 + sortedRepos.length) % sortedRepos.length].name}
              </h3>
            </div>

            {/* Central Active Desktop Showcase Screen with Pointer Micro-Distortion */}
            <motion.div
              key={currentRepo.id}
              onMouseMove={handlePanelMouseMove}
              onMouseLeave={handlePanelMouseLeave}
              initial={{ scale: 0.96, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-20 w-full max-w-4xl aspect-[16/9] rounded-[36px] bg-neutral-950/90 border border-white/20 p-8 flex flex-col justify-between shadow-[0_0_80px_rgba(0,0,0,0.95)] backdrop-blur-3xl transition-transform duration-100"
              style={{
                transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
                borderColor: `${currentRepo.liquidLight.hex}60`,
              }}
            >
              {/* Dynamic 45 deg Specular Highlight Tracking Pointer */}
              <div
                className="absolute inset-0 pointer-events-none rounded-[36px] transition-transform duration-100"
                style={{
                  transform: `translate(${tilt.sheenX}px, ${tilt.sheenY}px)`,
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.02) 28%, transparent 48%, rgba(255,255,255,0.04) 75%, transparent 100%)',
                }}
              />

              {/* Desktop Header */}
              <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/10 font-mono text-xs">
                <span
                  className="px-3 py-1 rounded-full border font-bold"
                  style={{
                    borderColor: currentRepo.liquidLight.hex,
                    color: currentRepo.liquidLight.hex,
                  }}
                >
                  0-TEXTO: «{currentRepo.singleWord}»
                </span>
                <span className="text-neutral-400">ESCAPARATE CINEMATOGRÁFICO #{currentIndex + 1}</span>
              </div>

              {/* Desktop Center Row */}
              <div className="relative z-10 grid grid-cols-12 gap-8 items-center my-auto">
                <div className="col-span-8 space-y-3">
                  <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight font-sans">
                    {currentRepo.name}
                  </h1>
                  <p className="text-sm sm:text-base text-neutral-300 leading-relaxed font-sans line-clamp-3">
                    {currentRepo.description}
                  </p>
                </div>

                <div
                  className="col-span-4 flex justify-center cursor-pointer"
                  onClick={() => onInspectIcon(currentRepo)}
                >
                  <RepoIcon
                    iconConfig={currentRepo.iconConfig}
                    primaryLanguage={currentRepo.primaryLanguage}
                    languageColor={currentRepo.languageColor}
                    size="xl"
                    lightingMode="ultra-noir-3"
                  />
                </div>
              </div>

              {/* Desktop Bottom Controls */}
              <div className="relative z-10 flex items-center justify-between pt-4 border-t border-white/10 font-mono text-xs">
                <div className="flex items-center gap-4 text-neutral-400">
                  <span>★ {currentRepo.stats.stars} Stars</span>
                  <span>{currentRepo.primaryLanguage}</span>
                  <span className="text-purple-300">n = {currentRepo.liquidLight.refractiveIndex}</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="px-4 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-500/30 text-purple-200 transition-all cursor-pointer"
                  >
                    Abrir Pantalla Glass
                  </button>
                  <a
                    href={currentRepo.liveUrl || currentRepo.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold transition-all"
                  >
                    Ver Demo
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Next Card with Brewster Angle 3D Perspective */}
            <div
              onClick={goToNext}
              className="hidden lg:block absolute right-4 z-10 w-[42%] aspect-[16/9] rounded-3xl opacity-25 hover:opacity-50 transition-all duration-500 cursor-pointer filter blur-[2px] transform translate-x-24 scale-90 -rotate-y-20 bg-neutral-950/80 border border-white/15 p-6"
              style={{
                borderColor: `${sortedRepos[(currentIndex + 1) % sortedRepos.length].liquidLight.hex}40`,
              }}
            >
              <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
                {sortedRepos[(currentIndex + 1) % sortedRepos.length].singleWord}
              </span>
              <h3 className="text-xl font-bold text-white mt-1">
                {sortedRepos[(currentIndex + 1) % sortedRepos.length].name}
              </h3>
            </div>
          </div>
        )}

        {/* ─── EXPERIENCE D: TV (Composición Teatral Panorámica 16:9) ─── */}
        {deviceExperience === 'tv' && (
          <div className="relative w-full max-w-5xl flex items-center justify-center perspective-[1200px] animate-in zoom-in-95 duration-400">
            {/* Previous Card (Cascading Left with 3D Smart Watch tilt) */}
            {sortedRepos.length > 1 && (
              <div
                onClick={goToPrev}
                className="hidden lg:block absolute left-2 xl:-left-12 z-10 w-[55%] aspect-video rounded-3xl opacity-20 hover:opacity-40 transition-all duration-500 cursor-pointer pointer-events-auto filter blur-[2px] transform -translate-x-32 scale-85 rotate-y-18 bg-black/70 border border-white/10 shadow-2xl overflow-hidden"
                style={{
                  borderColor: `${sortedRepos[(currentIndex - 1 + sortedRepos.length) % sortedRepos.length].liquidLight.hex}40`,
                }}
              >
                <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-white/5 to-transparent">
                  <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
                    {sortedRepos[(currentIndex - 1 + sortedRepos.length) % sortedRepos.length].singleWord}
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">
                    {sortedRepos[(currentIndex - 1 + sortedRepos.length) % sortedRepos.length].name}
                  </h3>
                </div>
              </div>
            )}

            {/* ─── THE CENTERPIECE: HORIZONTAL WIDESCREEN TV WINDOW (NO CUADRAO) ─── */}
            <motion.div
              key={currentRepo.id}
              onMouseMove={handlePanelMouseMove}
              onMouseLeave={handlePanelMouseLeave}
              initial={{ scale: 0.96, opacity: 0.7, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-20 w-full aspect-[16/9] max-w-4xl rounded-3xl sm:rounded-[36px] bg-neutral-950/90 border border-purple-500/30 overflow-hidden flex flex-col justify-between transition-all duration-300"
              style={{
                transform: `perspective(1000px) rotateX(${tilt.y * 0.7}deg) rotateY(${tilt.x * 0.7}deg)`,
                boxShadow: `0 0 70px ${currentRepo.liquidLight.milkyGlow}, 0 25px 60px rgba(0,0,0,0.95)`,
                borderColor: `${currentRepo.liquidLight.hex}50`,
              }}
            >
              {/* Real Glass Glossy Double Sheen Highlights with pointer tracking */}
              <div
                className="absolute inset-0 pointer-events-none z-30 transition-transform duration-100"
                style={{
                  transform: `translate(${tilt.sheenX}px, ${tilt.sheenY}px)`,
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 28%, transparent 45%, rgba(255,255,255,0.04) 65%, transparent 100%)',
                }}
              />

              {/* TV Bezel Fine Inner Reflection (1px Caustic Rim) */}
              <div className="absolute inset-0 rounded-[36px] border border-white/10 pointer-events-none z-30" />

              {/* TV Top Bezel: Dynamic Island / Status Display */}
              <div className="relative z-20 flex items-center justify-between px-5 sm:px-8 py-3.5 bg-black/60 border-b border-purple-900/25 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] sm:text-xs font-bold text-white px-2.5 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/30">
                    {currentRepo.isEducation ? '⭐ PRIORIDAD EDUCACIÓN' : 'SISTEMA'}
                  </span>
                  <span className="text-neutral-500 text-xs hidden sm:inline">|</span>
                  <span className="font-mono text-[11px] text-purple-300/80 hidden sm:inline">
                    Ítem {currentIndex + 1} de {sortedRepos.length}
                  </span>
                </div>

                <button
                  onClick={() => onOpenLiquidLightArticle(currentRepo)}
                  className="flex items-center gap-2 px-3 py-1 rounded-full border bg-black/50 hover:bg-black/80 transition-all text-xs font-mono"
                  style={{
                    borderColor: `${currentRepo.liquidLight.hex}70`,
                    color: currentRepo.liquidLight.hex,
                  }}
                  title="Abrir Artículo Científico de Luz Líquida"
                >
                  <Atom className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '9s' }} />
                  <span className="font-bold">{currentRepo.liquidLight.colorName}</span>
                  <BookOpen className="w-3 h-3 opacity-70" />
                </button>
              </div>

              {/* TV Screen Core Content (Horizontal Widescreen Composition) */}
              <div className="relative z-20 flex-1 flex flex-col md:flex-row items-center justify-between px-6 sm:px-10 py-4 sm:py-6 gap-6">
                <div className="flex-1 flex flex-col justify-center space-y-2 sm:space-y-3 text-left">
                  {/* 0-Text Single Powerful Word in Monumental Fluid Gradient */}
                  <div className="font-black text-4xl sm:text-6xl md:text-7xl tracking-tighter uppercase leading-none select-none">
                    <span
                      className="bg-clip-text text-transparent"
                      style={{
                        backgroundImage: `linear-gradient(135deg, #ffffff 10%, ${currentRepo.liquidLight.hex} 75%, #050308 100%)`,
                        filter: `drop-shadow(0 0 35px ${currentRepo.liquidLight.milkyGlow})`,
                      }}
                    >
                      {currentRepo.singleWord}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
                    {currentRepo.name}
                  </h2>

                  <p className="text-xs sm:text-sm text-neutral-300 font-sans max-w-lg leading-relaxed line-clamp-2 sm:line-clamp-3">
                    {currentRepo.description}
                  </p>

                  <div
                    onClick={() => onOpenLiquidLightArticle(currentRepo)}
                    className="inline-flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-purple-500/20 hover:border-purple-400/40 text-[11px] font-mono text-purple-200/90 cursor-pointer transition-all max-w-md"
                  >
                    <Atom className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="truncate">
                      Paper: «{currentRepo.liquidLight.scientificArticle.title}»
                    </span>
                  </div>
                </div>

                {/* Right Column: 4K Procedural Liquid Monoglyph with Milky Light Aura */}
                <div
                  onClick={() => onInspectIcon(currentRepo)}
                  className="relative shrink-0 flex items-center justify-center cursor-pointer group"
                  title="Haga clic para inspeccionar en 4K Studio"
                >
                  <div
                    className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full filter blur-3xl opacity-35 transition-all duration-700"
                    style={{ backgroundColor: currentRepo.liquidLight.hex }}
                  />

                  <div className="relative w-36 h-36 sm:w-48 sm:h-48 rounded-3xl bg-black/65 border border-white/15 p-4 flex items-center justify-center shadow-2xl backdrop-blur-2xl group-hover:scale-105 transition-transform duration-300">
                    <RepoIcon
                      iconConfig={currentRepo.iconConfig}
                      primaryLanguage={currentRepo.primaryLanguage}
                      languageColor={currentRepo.languageColor}
                      size="xl"
                      lightingMode="ultra-noir-3"
                    />

                    <div className="absolute inset-0 rounded-3xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-xs font-mono text-white backdrop-blur-sm">
                      <Maximize2 className="w-4 h-4 text-purple-400" />
                      <span>INSPECCIONAR 4K</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* TV Bottom Bezel: Metrics, GitHub Link & Quick Actions */}
              <div className="relative z-20 flex flex-wrap items-center justify-between px-5 sm:px-8 py-3 bg-black/75 border-t border-purple-900/25 backdrop-blur-xl text-xs font-mono">
                <div className="flex items-center gap-3 text-neutral-400">
                  <span>★ {currentRepo.stats.stars} Stars</span>
                  <span>•</span>
                  <span>⑂ {currentRepo.stats.forks} Forks</span>
                  <span>•</span>
                  <span className="text-purple-300">{currentRepo.primaryLanguage}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200 text-xs transition-all cursor-pointer"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>DETALLES GLASS</span>
                  </button>

                  <a
                    href={currentRepo.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>GITHUB</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Next Card (Cascading Right with 3D Smart Watch tilt) */}
            {sortedRepos.length > 1 && (
              <div
                onClick={goToNext}
                className="hidden lg:block absolute right-2 xl:-right-12 z-10 w-[55%] aspect-video rounded-3xl opacity-20 hover:opacity-40 transition-all duration-500 cursor-pointer pointer-events-auto filter blur-[2px] transform translate-x-32 scale-85 -rotate-y-18 bg-black/70 border border-white/10 shadow-2xl overflow-hidden"
                style={{
                  borderColor: `${sortedRepos[(currentIndex + 1) % sortedRepos.length].liquidLight.hex}40`,
                }}
              >
                <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-bl from-white/5 to-transparent">
                  <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
                    {sortedRepos[(currentIndex + 1) % sortedRepos.length].singleWord}
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1">
                    {sortedRepos[(currentIndex + 1) % sortedRepos.length].name}
                  </h3>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── 3. APPLE WATCH DIGITAL CROWN INTERACTIVE ROTARY SLIDER (Attached on right) ─── */}
        <div className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2">
          <button
            onClick={goToPrev}
            className="p-2 rounded-full bg-black/60 hover:bg-purple-950/80 border border-purple-500/30 text-purple-300 hover:text-white transition-all"
            title="Proyecto Anterior"
          >
            <ChevronLeft className="w-4 h-4 rotate-90" />
          </button>

          <div
            onMouseDown={handleCrownMouseDown}
            className="group relative w-7 h-28 sm:w-8 sm:h-32 rounded-2xl bg-neutral-900 border-2 border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.3)] flex flex-col items-center justify-center cursor-ns-resize overflow-hidden"
            title="Arrastra verticalmente para rotar la corona digital estilo Smart Watch"
            style={{
              borderColor: `${currentRepo.liquidLight.hex}70`,
            }}
          >
            <div
              className="w-full h-full flex flex-col justify-around py-1 transition-transform duration-200"
              style={{
                transform: `translateY(${((crownRotation % 20) - 10)}px)`,
              }}
            >
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="w-full h-[2px] bg-gradient-to-r from-transparent via-purple-300/40 to-transparent"
                />
              ))}
            </div>

            <div
              className="absolute w-2 h-2 rounded-full shadow-md pointer-events-none"
              style={{ backgroundColor: currentRepo.liquidLight.hex }}
            />
          </div>

          <button
            onClick={goToNext}
            className="p-2 rounded-full bg-black/60 hover:bg-purple-950/80 border border-purple-500/30 text-purple-300 hover:text-white transition-all"
            title="Proyecto Siguiente"
          >
            <ChevronRight className="w-4 h-4 rotate-90" />
          </button>

          <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-widest [writing-mode:vertical-lr] mt-1 opacity-70">
            CROWN
          </span>
        </div>
      </main>

      {/* ─── 4. BOTTOM SMART WATCH CRAWLER TRAY (14 Proyectos en Riel Háptico) ─── */}
      <footer className="relative z-30 px-4 sm:px-8 py-3 bg-black/80 border-t border-purple-950/30 backdrop-blur-2xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={goToPrev}
            className="p-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 flex items-center gap-2 overflow-x-auto py-1 no-scrollbar justify-center">
            {sortedRepos.map((repo, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={repo.id}
                  onClick={() => goToIndex(idx)}
                  className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-purple-950 border border-purple-400 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                      : 'bg-black/50 border border-purple-900/20 text-neutral-400 hover:text-white hover:bg-purple-950/30'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: repo.liquidLight.hex }}
                  />
                  <span className="font-bold">{repo.singleWord}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={goToNext}
            className="p-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* ─── 5. SWIPE-UP SUSPENDED HORIZONTAL GLASS SCREEN ─── */}
      <SwipeUpGlassDrawer
        repo={currentRepo}
        isOpen={isDrawerOpen}
        onToggle={() => setIsDrawerOpen((prev) => !prev)}
        onClose={() => setIsDrawerOpen(false)}
        onInspectIcon={onInspectIcon}
        onOpenArticle={onOpenLiquidLightArticle}
      />
    </div>
  );
};
