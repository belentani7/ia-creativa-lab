import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Info,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Github,
  Copy,
  Check,
  Pause,
  Sliders,
  Maximize2,
  BookOpen,
  Layers,
  Search,
  X,
  Flame,
  Star,
  GitFork,
  Radio,
  Eye,
  Shield,
  Code,
  Smartphone
} from 'lucide-react';
import { Repository, LightingMode, AppViewVersion } from '../types';
import { RepoIcon } from './RepoIcon';
import { SwipeUpGlassDrawer } from './SwipeUpGlassDrawer';

interface NetflixGrandScreenProps {
  repositories: Repository[];
  lightingMode: LightingMode;
  onLightingChange: (mode: LightingMode) => void;
  onInspectIcon: (repo: Repository) => void;
  onOpenStudioWorkbench: () => void;
  onSwitchVersion?: (version: AppViewVersion) => void;
  onOpenRulesModal?: () => void;
}

export const NetflixGrandScreen: React.FC<NetflixGrandScreenProps> = ({
  repositories,
  lightingMode,
  onLightingChange,
  onInspectIcon,
  onOpenStudioWorkbench,
  onSwitchVersion,
  onOpenRulesModal,
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

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);

  // Filter based on active category and search
  const filteredRepos = useMemo(() => {
    let list = sortedRepos;
    if (activeCategory === 'education') {
      list = list.filter((r) => r.isEducation);
    } else if (activeCategory !== 'all') {
      list = list.filter((r) => r.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.primaryLanguage.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return list.length > 0 ? list : sortedRepos;
  }, [sortedRepos, activeCategory, searchQuery]);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [direction, setDirection] = useState<number>(1);
  const [isAutoplay, setIsAutoplay] = useState<boolean>(false);
  const [autoplayProgress, setAutoplayProgress] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [showThumbnailsBar, setShowThumbnailsBar] = useState<boolean>(true);

  // Keep index within bounds if filtered list changes
  useEffect(() => {
    if (currentIndex >= filteredRepos.length) {
      setCurrentIndex(0);
    }
  }, [filteredRepos.length, currentIndex]);

  const currentRepo = filteredRepos[currentIndex] || sortedRepos[0];

  // Navigation handlers with infinite wrap-around
  const goToNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % filteredRepos.length);
    setAutoplayProgress(0);
  }, [filteredRepos.length]);

  const goToPrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + filteredRepos.length) % filteredRepos.length);
    setAutoplayProgress(0);
  }, [filteredRepos.length]);

  const selectIndex = useCallback(
    (index: number) => {
      setDirection(index > currentIndex ? 1 : -1);
      setCurrentIndex(index);
      setAutoplayProgress(0);
    },
    [currentIndex]
  );

  // Autoplay timer effect
  useEffect(() => {
    if (!isAutoplay) {
      setAutoplayProgress(0);
      return;
    }

    const duration = 7500; // 7.5 seconds per granpantalla slide
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setAutoplayProgress((prev) => {
        if (prev >= 100) {
          goToNext();
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isAutoplay, goToNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goToPrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsAutoplay((prev) => !prev);
      } else if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev]);

  // Wheel debounced navigation
  const wheelLock = useRef(false);
  const handleWheel = (e: React.WheelEvent) => {
    if (wheelLock.current) return;
    if (Math.abs(e.deltaY) > 40 || Math.abs(e.deltaX) > 40) {
      wheelLock.current = true;
      if (e.deltaY > 0 || e.deltaX > 0) {
        goToNext();
      } else {
        goToPrev();
      }
      setTimeout(() => {
        wheelLock.current = false;
      }, 700);
    }
  };

  // Touch swipe support
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
    touchStartX.current = null;
  };

  const handleCopySvg = () => {
    if (!currentRepo) return;
    const svgCode = `<!-- Icono Procedural Belentani Neural Icons 4K: ${currentRepo.name} -->
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f3e8ff" />
      <stop offset="100%" stop-color="#7e22ce" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="28" fill="#000000" stroke="${currentRepo.iconConfig.accentColor}" stroke-width="1.5" />
  <!-- Glyph: ${currentRepo.iconConfig.glyphType} -->
  <circle cx="50" cy="50" r="24" fill="none" stroke="url(#grad)" stroke-width="3" />
</svg>`;
    navigator.clipboard.writeText(svgCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const thumbnailsScrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    if (thumbnailsScrollRef.current) {
      const activeEl = thumbnailsScrollRef.current.children[currentIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentIndex]);

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 120 : -120,
      opacity: 0,
      scale: 0.96,
      filter: 'blur(8px)',
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        duration: 0.55,
        ease: [0.16, 1, 0.3, 1],
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -120 : 120,
      opacity: 0,
      scale: 0.96,
      filter: 'blur(8px)',
      transition: {
        duration: 0.45,
        ease: [0.16, 1, 0.3, 1],
      },
    }),
  };

  return (
    <div
      className="relative w-full h-[100dvh] flex flex-col justify-between overflow-hidden text-white select-none bg-black"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ─── 1. Top Netflix Cinematic HUD ─── */}
      <header className="relative z-30 flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-purple-900/20 bg-black/60 backdrop-blur-2xl">
        {/* Left: Netflix-Style Brand Wordmark */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold tracking-[0.25em] text-white bg-purple-950/80 px-2.5 py-1 rounded-md border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.25)]">
              BELENTANI
            </span>
            <span className="hidden sm:inline-block font-mono text-[11px] uppercase tracking-widest text-purple-300/60 border-l border-purple-800/40 pl-3">
              CATÁLOGO NETFLIX · 1 GRAN PANTALLA
            </span>
          </div>

          {/* Quick Counter */}
          <div className="hidden md:flex items-center gap-1.5 font-mono text-xs text-purple-300/80 bg-purple-950/30 px-3 py-1 rounded-full border border-purple-500/20">
            <span className="text-purple-200 font-semibold">{String(currentIndex + 1).padStart(2, '0')}</span>
            <span className="text-purple-500">/</span>
            <span>{String(filteredRepos.length).padStart(2, '0')}</span>
            {currentRepo?.isEducation && (
              <span className="ml-1 text-[10px] uppercase text-emerald-400 font-bold bg-emerald-950/50 px-1.5 py-0.5 rounded">
                ★ EDUCACIÓN
              </span>
            )}
          </div>
        </div>

        {/* Center: Category Switcher (Education First!) */}
        <div className="hidden lg:flex items-center gap-1 bg-black/60 p-1 rounded-full border border-purple-500/20 backdrop-blur-xl">
          <button
            onClick={() => {
              setActiveCategory('all');
              setCurrentIndex(0);
            }}
            className={`px-3.5 py-1 text-xs font-mono tracking-wider rounded-full transition-all ${
              activeCategory === 'all'
                ? 'bg-purple-900/70 text-white shadow-[0_0_15px_rgba(192,132,252,0.3)] border border-purple-400/40 font-semibold'
                : 'text-purple-300/70 hover:text-white hover:bg-purple-950/40'
            }`}
          >
            TODOS ({sortedRepos.length})
          </button>
          <button
            onClick={() => {
              setActiveCategory('education');
              setCurrentIndex(0);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1 text-xs font-mono tracking-wider rounded-full transition-all ${
              activeCategory === 'education'
                ? 'bg-purple-900/70 text-white shadow-[0_0_15px_rgba(192,132,252,0.3)] border border-purple-400/40 font-semibold'
                : 'text-purple-300/70 hover:text-white hover:bg-purple-950/40'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            <span>EDUCACIÓN PRIMERO</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1 rounded font-bold">
              TOP 1
            </span>
          </button>
          <button
            onClick={() => {
              setActiveCategory('ai-agents');
              setCurrentIndex(0);
            }}
            className={`px-3 py-1 text-xs font-mono tracking-wider rounded-full transition-all ${
              activeCategory === 'ai-agents'
                ? 'bg-purple-900/70 text-white shadow-[0_0_15px_rgba(192,132,252,0.3)] border border-purple-400/40 font-semibold'
                : 'text-purple-300/70 hover:text-white hover:bg-purple-950/40'
            }`}
          >
            IA & AGENTES
          </button>
          <button
            onClick={() => {
              setActiveCategory('systems-core');
              setCurrentIndex(0);
            }}
            className={`px-3 py-1 text-xs font-mono tracking-wider rounded-full transition-all ${
              activeCategory === 'systems-core'
                ? 'bg-purple-900/70 text-white shadow-[0_0_15px_rgba(192,132,252,0.3)] border border-purple-400/40 font-semibold'
                : 'text-purple-300/70 hover:text-white hover:bg-purple-950/40'
            }`}
          >
            SISTEMAS
          </button>
        </div>

        {/* Right: 3% Luz Líquida Controls + Autoplay + Studio */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Version Switcher: Switch to 0-Texto version */}
          {onSwitchVersion && (
            <button
              onClick={() => onSwitchVersion('zero-text')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-200 hover:text-white text-xs font-mono transition-all"
              title="Cambiar a Versión 0-Texto (Una Palabra por Proyecto)"
            >
              <Smartphone className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">0-TEXTO</span>
            </button>
          )}

          {/* 5,000 Rules Inspector Modal Trigger */}
          {onOpenRulesModal && (
            <button
              onClick={onOpenRulesModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-400/40 text-purple-200 hover:text-white text-xs font-mono transition-all shadow-[0_0_12px_rgba(168,85,247,0.2)]"
              title="Inspeccionar las 5.000 Reglas de Mejoras"
            >
              <Sliders className="w-3.5 h-3.5 text-purple-300" />
              <span className="font-bold hidden sm:inline">5.000 REGLAS</span>
              <span className="font-bold sm:hidden">5K</span>
            </button>
          )}

          {/* Lighting Mode Selector - Defaults to 3% Luz Líquida */}
          <div className="flex items-center bg-black/70 p-0.5 rounded-xl border border-purple-500/25">
            <button
              onClick={() => onLightingChange('ultra-noir-3')}
              title="3% Luz Líquida (Predeterminado · Ultranegro Noir)"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                lightingMode === 'ultra-noir-3'
                  ? 'bg-purple-950 text-purple-200 border border-purple-400/50 shadow-[0_0_12px_rgba(168,85,247,0.3)] font-bold'
                  : 'text-purple-400/60 hover:text-purple-200'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_#c084fc]" />
              <span className="text-[11px]">3% LUZ LÍQUIDA</span>
            </button>

            <button
              onClick={() => onLightingChange('hbo-noir')}
              title="5% HBO Noir (Púrpura Profundo)"
              className={`px-2 py-1 rounded-lg text-[11px] font-mono transition-all ${
                lightingMode === 'hbo-noir'
                  ? 'bg-purple-950 text-purple-200 border border-purple-400/50 shadow-[0_0_12px_rgba(168,85,247,0.3)] font-bold'
                  : 'text-purple-400/60 hover:text-purple-200'
              }`}
            >
              HBO NOIR
            </button>
          </div>

          {/* Autoplay Toggle */}
          <button
            onClick={() => setIsAutoplay(!isAutoplay)}
            title={isAutoplay ? 'Pausar avance automático' : 'Activar avance automático (7.5s)'}
            className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-all ${
              isAutoplay
                ? 'bg-purple-900/60 text-white border-purple-400/60 shadow-[0_0_15px_rgba(192,132,252,0.3)]'
                : 'bg-black/60 text-purple-300/70 border-purple-500/20 hover:text-white'
            }`}
          >
            {isAutoplay ? <Pause className="w-3.5 h-3.5 text-purple-300" /> : <Play className="w-3.5 h-3.5 text-purple-300" />}
            <span className="hidden sm:inline text-[11px]">{isAutoplay ? 'AUTO' : 'PLAY'}</span>
          </button>

          {/* Quick Search Button */}
          <button
            onClick={() => setShowSearchModal(true)}
            className="p-1.5 rounded-xl border border-purple-500/20 bg-black/50 text-purple-300 hover:text-white hover:border-purple-400/40 transition-colors"
            title="Buscar en el catálogo (Ctrl+K)"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ─── 2. Grand Billboard Stage (SOLO UNA GRANPANTALLA A LA VEZ) ─── */}
      <main className="relative z-20 flex-1 flex items-center justify-center px-4 sm:px-12 md:px-16 lg:px-20 py-2 sm:py-4">
        {/* Extreme Left Chevron Button (Netflix Style Arrow) */}
        <button
          onClick={goToPrev}
          aria-label="Repositorio anterior"
          className="absolute left-2 sm:left-4 md:left-6 z-30 p-2 sm:p-3 rounded-2xl bg-black/60 hover:bg-purple-950/80 border border-purple-500/20 hover:border-purple-400/60 text-purple-300 hover:text-white transition-all backdrop-blur-xl shadow-[0_0_20px_rgba(0,0,0,0.8)] hover:shadow-[0_0_25px_rgba(168,85,247,0.3)] group cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 transition-transform group-hover:-translate-x-1" />
        </button>

        {/* Extreme Right Chevron Button (Netflix Style Arrow) */}
        <button
          onClick={goToNext}
          aria-label="Siguiente repositorio"
          className="absolute right-2 sm:right-4 md:right-6 z-30 p-2 sm:p-3 rounded-2xl bg-black/60 hover:bg-purple-950/80 border border-purple-500/20 hover:border-purple-400/60 text-purple-300 hover:text-white transition-all backdrop-blur-xl shadow-[0_0_20px_rgba(0,0,0,0.8)] hover:shadow-[0_0_25px_rgba(168,85,247,0.3)] group cursor-pointer"
        >
          <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 transition-transform group-hover:translate-x-1" />
        </button>

        {/* Center Animated Stage with AnimatePresence */}
        <div className="relative w-full max-w-7xl h-full flex items-center justify-center">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={currentRepo.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center"
            >
              {/* ─── Left Side: Cinematic Billboard Information ─── */}
              <div className="lg:col-span-7 flex flex-col justify-center space-y-3 sm:space-y-4 pr-0 lg:pr-4">
                {/* Ranking / Category Badge */}
                <div className="flex flex-wrap items-center gap-2">
                  {currentRepo.isEducation ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-400/40 text-emerald-300 font-mono text-xs uppercase tracking-wider shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-bold">★ EDUCACIÓN ABIERTA · PRIORIDAD #1</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 font-mono text-xs uppercase tracking-wider">
                      <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                      <span>COLECCIÓN PÚBLICA // {currentRepo.category.toUpperCase()}</span>
                    </div>
                  )}

                  <span className="font-mono text-[11px] text-purple-300/60 bg-black/40 px-2 py-0.5 rounded border border-purple-900/30">
                    ID: {currentRepo.id}
                  </span>
                </div>

                {/* Monumental Repository Title */}
                <div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight font-sans drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
                    {currentRepo.name}
                  </h1>
                  <p className="mt-1 font-mono text-xs sm:text-sm text-purple-300/80 tracking-wide">
                    {currentRepo.tagline}
                  </p>
                </div>

                {/* Netflix Metadata Strip */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono">
                  <span className="text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                    99% COINCIDENCIA
                  </span>
                  <span className="text-white/80 bg-white/10 px-2 py-0.5 rounded">2026</span>
                  <span className="text-purple-200 border border-purple-400/40 bg-purple-950/30 px-2 py-0.5 rounded font-semibold">
                    {currentRepo.isEducation ? 'WCAG AAA' : 'OFFLINE-FIRST'}
                  </span>
                  <span className="text-purple-300/70 border border-purple-800/40 px-2 py-0.5 rounded">
                    {currentRepo.license || 'MIT'}
                  </span>
                  <span className="flex items-center gap-1 text-purple-200">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: currentRepo.languageColor }}
                    />
                    <span>{currentRepo.primaryLanguage}</span>
                  </span>
                  {currentRepo.stats.stars > 0 && (
                    <span className="flex items-center gap-1 text-purple-300/70">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400/80" />
                      <span>{currentRepo.stats.stars}</span>
                    </span>
                  )}
                </div>

                {/* Rich Synopsis / Long Description */}
                <p className="text-sm sm:text-base text-[#d8ceec]/90 leading-relaxed max-w-2xl font-sans line-clamp-3 sm:line-clamp-4">
                  {currentRepo.longDescription || currentRepo.description}
                </p>

                {/* Architectural Features Pillars */}
                {currentRepo.iconConfig.features && currentRepo.iconConfig.features.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {currentRepo.iconConfig.features.map((feat, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-950/30 border border-purple-500/20 text-[11px] font-mono text-purple-300/80"
                      >
                        <span className="h-1 w-1 rounded-full bg-purple-400" />
                        <span>{feat}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Netflix Primary Action Row */}
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-2">
                  {/* Primary Netflix Play Button */}
                  <a
                    href={currentRepo.liveUrl || currentRepo.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-xs sm:text-sm font-sans tracking-wide transition-all shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Play className="w-4 h-4 fill-black text-black" />
                    <span>EXPLORAR REPOSITORIO</span>
                  </a>

                  {/* Netflix "+ Info" / 4K Studio Modal Button */}
                  <button
                    onClick={() => onInspectIcon(currentRepo)}
                    className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-400/40 text-purple-200 hover:text-white font-medium text-xs sm:text-sm font-sans tracking-wide transition-all shadow-[0_0_20px_rgba(168,85,247,0.15)] hover:shadow-[0_0_30px_rgba(192,132,252,0.3)] backdrop-blur-xl hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Info className="w-4 h-4 text-purple-400" />
                    <span>INSPECCIONAR ICONO 4K</span>
                  </button>

                  {/* Copy Procedural SVG */}
                  <button
                    onClick={handleCopySvg}
                    title="Copiar código SVG de este icono procedural"
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 sm:py-3 rounded-xl bg-black/60 hover:bg-purple-950/50 border border-purple-500/20 text-purple-300 hover:text-white text-xs font-mono transition-all backdrop-blur-xl"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">¡COPIADO!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-purple-400" />
                        <span>SVG</span>
                      </>
                    )}
                  </button>

                  {/* GitHub Direct Link */}
                  <a
                    href={currentRepo.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 sm:p-3 rounded-xl bg-black/60 hover:bg-purple-950/50 border border-purple-500/20 text-purple-300 hover:text-white transition-all backdrop-blur-xl"
                    title="Ver repositorio en GitHub"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* ─── Right Side: Monumental 4K Procedural Icon Showcase ─── */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center relative py-4 lg:py-0">
                {/* Outer Liquid Halo & Atmospheric Puff Glow */}
                <div
                  className="absolute inset-0 pointer-events-none rounded-full"
                  style={{
                    background: `radial-gradient(circle at center, ${currentRepo.iconConfig.puffGlow} 0%, transparent 70%)`,
                    filter: 'blur(50px)',
                    transform: 'scale(1.2)',
                  }}
                />

                {/* Monumental Icon Container with 3% Lux Fine Halo Border */}
                <motion.div
                  animate={{
                    y: [0, -8, 0],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="relative group cursor-pointer"
                  onClick={() => onInspectIcon(currentRepo)}
                >
                  {/* Fine 1px Light Halo Ring */}
                  <div
                    className="absolute -inset-1.5 rounded-[52px] pointer-events-none transition-all duration-700 opacity-75 group-hover:opacity-100"
                    style={{
                      background: `linear-gradient(135deg, ${currentRepo.iconConfig.accentColor} 0%, transparent 60%, ${currentRepo.iconConfig.accentColor} 100%)`,
                      filter: 'blur(4px)',
                    }}
                  />

                  {/* The Monumental Icon in Cinema Scale */}
                  <div className="relative">
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
                  </div>

                  {/* 4K Resolution & Vector Glyph Badge below */}
                  <div className="mt-3 flex items-center justify-between px-3 py-1.5 rounded-xl bg-black/70 border border-purple-500/20 backdrop-blur-2xl">
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_#c084fc]" />
                      <span className="font-mono text-[10px] text-purple-300 uppercase tracking-widest">
                        GLYPH PROCEDURAL 4K
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-purple-400/80">
                      CLIC PARA AMPLIAR
                    </span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ─── 3. Netflix Bottom Thumbnails Ribbon (Catálogo Infinito) ─── */}
      <footer className="relative z-30 border-t border-purple-900/20 bg-black/80 backdrop-blur-3xl px-4 sm:px-8 py-3">
        {/* Strip Header & Controls */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-widest text-purple-300/80">
              CATÁLOGO INFINITO · {filteredRepos.length} TÍTULOS PÚBLICOS
            </span>
            <span className="text-purple-600">|</span>
            <span className="font-mono text-[10px] text-purple-400/60">
              [← / → FLECHAS DE TECLADO O RUEDA]
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Open Studio Workbench */}
            <button
              onClick={onOpenStudioWorkbench}
              className="inline-flex items-center gap-1 text-[11px] font-mono text-purple-300 hover:text-white transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Laboratorio de Iconos</span>
            </button>
          </div>
        </div>

        {/* Horizontal Thumbnails Scroll Track */}
        <div
          ref={thumbnailsScrollRef}
          className="flex items-center gap-3 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-purple-900/40 scrollbar-track-transparent snap-x"
        >
          {filteredRepos.map((repo, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={repo.id}
                onClick={() => selectIndex(idx)}
                className={`relative flex-shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all snap-center group ${
                  isActive
                    ? 'bg-purple-950/70 border border-purple-400/70 shadow-[0_0_20px_rgba(168,85,247,0.35)] scale-[1.02]'
                    : 'bg-black/50 border border-purple-500/15 hover:border-purple-400/40 hover:bg-purple-950/30 opacity-70 hover:opacity-100'
                }`}
                style={{ minWidth: '180px', maxWidth: '240px' }}
              >
                {/* Mini Procedural Icon */}
                <div className="flex-shrink-0">
                  <RepoIcon
                    glyphType={repo.iconConfig.glyphType}
                    name={repo.name}
                    size="sm"
                    isEducation={repo.isEducation}
                    accentColor={repo.iconConfig.accentColor}
                    haloColor={repo.iconConfig.haloColor}
                    puffGlow={repo.iconConfig.puffGlow}
                    interactive={false}
                  />
                </div>

                {/* Text Metadata */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    {repo.isEducation && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    )}
                    <p className="text-xs font-semibold text-white truncate font-sans">
                      {repo.name}
                    </p>
                  </div>
                  <p className="text-[10px] font-mono text-purple-300/60 truncate">
                    {repo.isEducation ? '★ Educación' : repo.primaryLanguage}
                  </p>
                </div>

                {/* Autoplay Progress Line on Active Item */}
                {isActive && isAutoplay && (
                  <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-purple-900/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-300 shadow-[0_0_8px_#c084fc] transition-all duration-75 ease-linear"
                      style={{ width: `${autoplayProgress}%` }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </footer>

      {/* ─── 4. Quick Jump / Search Modal (Netflix Style) ─── */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-3xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-3xl border border-purple-500/30 bg-black/90 p-6 shadow-[0_0_50px_rgba(168,85,247,0.2)]">
            <div className="flex items-center justify-between pb-4 border-b border-purple-500/20">
              <div className="flex items-center gap-2.5">
                <Search className="w-5 h-5 text-purple-400" />
                <span className="font-mono text-sm font-semibold tracking-wider text-white">
                  BUSCAR EN EL CATÁLOGO DE PEDRO BELENTANI
                </span>
              </div>
              <button
                onClick={() => setShowSearchModal(false)}
                className="p-1 rounded-xl text-purple-400 hover:text-white hover:bg-purple-950/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="mt-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, tecnología, educación, WCAG, IA..."
                autoFocus
                className="w-full px-4 py-3 rounded-2xl bg-purple-950/30 border border-purple-500/30 text-white placeholder-purple-400/50 font-sans focus:outline-none focus:border-purple-400 focus:shadow-[0_0_20px_rgba(192,132,252,0.2)]"
              />
            </div>

            {/* Quick List Results */}
            <div className="mt-4 max-h-72 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-purple-800">
              {filteredRepos.map((repo, idx) => (
                <div
                  key={repo.id}
                  onClick={() => {
                    selectIndex(idx);
                    setShowSearchModal(false);
                  }}
                  className="flex items-center justify-between p-3 rounded-xl bg-purple-950/20 hover:bg-purple-900/40 border border-purple-500/15 hover:border-purple-400/40 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <RepoIcon
                      glyphType={repo.iconConfig.glyphType}
                      name={repo.name}
                      size="sm"
                      isEducation={repo.isEducation}
                      accentColor={repo.iconConfig.accentColor}
                      haloColor={repo.iconConfig.haloColor}
                      puffGlow={repo.iconConfig.puffGlow}
                      interactive={false}
                    />
                    <div>
                      <p className="text-sm font-semibold text-white">{repo.name}</p>
                      <p className="text-xs font-mono text-purple-300/60">{repo.tagline}</p>
                    </div>
                  </div>
                  {repo.isEducation && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                      ★ EDUCACIÓN
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
