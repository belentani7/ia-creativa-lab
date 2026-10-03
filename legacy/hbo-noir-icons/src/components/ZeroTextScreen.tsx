import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Sparkles,
  Sliders,
  Maximize2,
  BookOpen,
  Layers
} from 'lucide-react';
import { Repository, LightingMode, AppViewVersion } from '../types';
import { RepoIcon } from './RepoIcon';
import { SwipeUpGlassDrawer } from './SwipeUpGlassDrawer';

interface ZeroTextScreenProps {
  repositories: Repository[];
  lightingMode: LightingMode;
  onLightingChange: (mode: LightingMode) => void;
  onInspectIcon: (repo: Repository) => void;
  onSwitchVersion: (version: AppViewVersion) => void;
  onOpenRulesModal: () => void;
  onOpenStudioWorkbench: () => void;
}

export const ZeroTextScreen: React.FC<ZeroTextScreenProps> = ({
  repositories,
  lightingMode,
  onLightingChange,
  onInspectIcon,
  onSwitchVersion,
  onOpenRulesModal,
  onOpenStudioWorkbench,
}) => {
  // Sort with education repositories strictly first
  const sortedRepos = useMemo(() => {
    const list = [...repositories];
    return list.sort((a, b) => {
      if (a.isEducation && !b.isEducation) return -1;
      if (!a.isEducation && b.isEducation) return 1;
      return a.priorityOrder - b.priorityOrder;
    });
  }, [repositories]);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [direction, setDirection] = useState<number>(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const currentRepo = sortedRepos[currentIndex] || sortedRepos[0];

  const goToNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % sortedRepos.length);
  }, [sortedRepos.length]);

  const goToPrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + sortedRepos.length) % sortedRepos.length);
  }, [sortedRepos.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setIsDrawerOpen(true);
      } else if (e.key === 'ArrowDown' || e.key === 'Escape') {
        e.preventDefault();
        setIsDrawerOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev]);

  // Touch swipe support (left/right for slides, up for drawer)
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    const diffY = touchStartY.current - e.changedTouches[0].clientY;

    // Horizontal swipe (prev/next)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      if (diffX > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
    // Vertical swipe up (open glass drawer)
    else if (diffY > 50 && !isDrawerOpen) {
      setIsDrawerOpen(true);
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.95,
      filter: 'blur(10px)',
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -100 : 100,
      opacity: 0,
      scale: 0.95,
      filter: 'blur(10px)',
      transition: {
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
      },
    }),
  };

  return (
    <div
      className="relative w-full h-[100dvh] flex flex-col justify-between overflow-hidden text-white select-none bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ─── Top Minimalist Control Bar ─── */}
      <header className="relative z-30 flex items-center justify-between px-4 sm:px-8 py-3.5 bg-black/40 backdrop-blur-2xl border-b border-purple-900/15">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-bold tracking-[0.25em] text-white bg-purple-950/80 px-2.5 py-1 rounded-md border border-purple-500/30">
            BELENTANI
          </span>
          <span className="hidden sm:inline-block font-mono text-[11px] uppercase tracking-widest text-purple-300/60 border-l border-purple-800/40 pl-3">
            VERSIÓN 0-TEXTO · 1 PALABRA
          </span>
        </div>

        {/* View Switcher + 5,000 Rules Engine Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Switch to Netflix Catalog Version */}
          <button
            onClick={() => onSwitchVersion('netflix-cinema')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200 hover:text-white text-xs font-mono transition-all"
            title="Cambiar a Versión Catálogo Netflix Completo"
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">VERSIÓN NETFLIX</span>
            <span className="sm:hidden">NETFLIX</span>
          </button>

          {/* 5,000 Rules Inspector Modal Trigger */}
          <button
            onClick={onOpenRulesModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-400/40 text-purple-200 hover:text-white text-xs font-mono transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)]"
            title="Inspeccionar las 5.000 Reglas de Mejoras del Sistema"
          >
            <Sliders className="w-3.5 h-3.5 text-purple-300" />
            <span className="font-bold">5.000 REGLAS</span>
          </button>

          {/* 3% Lux Mode Pill */}
          <button
            onClick={() =>
              onLightingChange(lightingMode === 'ultra-noir-3' ? 'hbo-noir' : 'ultra-noir-3')
            }
            className="px-2.5 py-1.5 rounded-xl bg-black/60 border border-purple-500/25 text-[11px] font-mono text-purple-300 hover:text-white flex items-center gap-1.5"
            title="Ajustar 3% Luz Líquida"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_#c084fc]" />
            <span>3% LUX</span>
          </button>
        </div>
      </header>

      {/* ─── Center Sculptural Stage: Monumental Icon + 1 Single Word ─── */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center px-4">
        {/* Extreme Left Chevron Button */}
        <button
          onClick={goToPrev}
          aria-label="Anterior"
          className="absolute left-2 sm:left-6 md:left-10 z-30 p-3 rounded-2xl bg-black/50 hover:bg-purple-950/70 border border-purple-500/20 hover:border-purple-400/50 text-purple-300 hover:text-white transition-all backdrop-blur-xl group cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 transition-transform group-hover:-translate-x-1" />
        </button>

        {/* Extreme Right Chevron Button */}
        <button
          onClick={goToNext}
          aria-label="Siguiente"
          className="absolute right-2 sm:right-6 md:right-10 z-30 p-3 rounded-2xl bg-black/50 hover:bg-purple-950/70 border border-purple-500/20 hover:border-purple-400/50 text-purple-300 hover:text-white transition-all backdrop-blur-xl group cursor-pointer"
        >
          <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 transition-transform group-hover:translate-x-1" />
        </button>

        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={currentRepo.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex flex-col items-center justify-center text-center max-w-4xl"
          >
            {/* Monumental Procedural Icon (Clicking triggers inspect) */}
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onInspectIcon(currentRepo)}
              className="relative cursor-pointer mb-6 sm:mb-8 group"
            >
              {/* Diffuse 3% Liquid Halo */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none transition-all duration-700 opacity-60 group-hover:opacity-90"
                style={{
                  background: `radial-gradient(circle at center, ${currentRepo.iconConfig.puffGlow} 0%, transparent 70%)`,
                  filter: 'blur(45px)',
                  transform: 'scale(1.3)',
                }}
              />

              {/* The Cinema-Scale Procedural Icon */}
              <RepoIcon
                glyphType={currentRepo.iconConfig.glyphType}
                name={currentRepo.name}
                size="cinema"
                isEducation={currentRepo.isEducation}
                accentColor={currentRepo.iconConfig.accentColor}
                haloColor={currentRepo.iconConfig.haloColor}
                puffGlow={currentRepo.iconConfig.puffGlow}
                interactive={true}
              />
            </motion.div>

            {/* ─── 0 TEXTO: EXACTAMENTE UNA SOLA PALABRA MONUMENTAL ─── */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-[0.18em] sm:tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-b from-white via-[#f3e8ff] to-purple-400/70 drop-shadow-[0_0_35px_rgba(192,132,252,0.25)] select-none font-sans"
            >
              {currentRepo.singleWord}
            </motion.h1>

            {/* Minimal Sub-Tag: Repository Name + Education Pin */}
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="font-mono text-xs sm:text-sm text-purple-300/80 uppercase tracking-widest">
                {currentRepo.name}
              </span>
              {currentRepo.isEducation && (
                <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  ★ EDUCACIÓN
                </span>
              )}
            </div>

            {/* Progress Dots Indicator */}
            <div className="mt-6 flex items-center gap-1.5">
              {sortedRepos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setDirection(i > currentIndex ? 1 : -1);
                    setCurrentIndex(i);
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentIndex
                      ? 'w-6 bg-purple-400 shadow-[0_0_8px_#c084fc]'
                      : 'w-1.5 bg-purple-900/50 hover:bg-purple-700'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ─── Bottom Mobile Glass Swipe-Up Window ─── */}
      <SwipeUpGlassDrawer
        repo={currentRepo}
        isOpen={isDrawerOpen}
        onToggle={() => setIsDrawerOpen(!isDrawerOpen)}
        onClose={() => setIsDrawerOpen(false)}
        onInspectIcon={onInspectIcon}
      />
    </div>
  );
};
