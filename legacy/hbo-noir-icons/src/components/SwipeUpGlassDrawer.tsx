import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronUp,
  X,
  Play,
  Copy,
  Check,
  Star,
  Layers,
  BookOpen,
  Sparkles,
  Github,
  Atom,
  Eye
} from 'lucide-react';
import { Repository } from '../types';
import { RepoIcon } from './RepoIcon';

interface SwipeUpGlassDrawerProps {
  repo: Repository;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onInspectIcon: (repo: Repository) => void;
  onOpenArticle?: (repo: Repository) => void;
}

export const SwipeUpGlassDrawer: React.FC<SwipeUpGlassDrawerProps> = ({
  repo,
  isOpen,
  onToggle,
  onClose,
  onInspectIcon,
  onOpenArticle,
}) => {
  const [copied, setCopied] = React.useState(false);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    // If swiped UP by > 40px, open
    if (diff > 40 && !isOpen) {
      onToggle();
    }
    // If swiped DOWN by > 40px, close
    else if (diff < -40 && isOpen) {
      onClose();
    }
    touchStartY.current = null;
  };

  const handleCopySvg = () => {
    const code = `<!-- Belentani 4K Monoglyph: ${repo.name} -->
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f3e8ff" />
      <stop offset="100%" stop-color="${repo.liquidLight.hex}" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="28" fill="#000000" stroke="${repo.iconConfig.accentColor}" stroke-width="1.5" />
  <circle cx="50" cy="50" r="24" fill="none" stroke="url(#g)" stroke-width="3" />
</svg>`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 flex flex-col items-center pointer-events-auto select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ─── Horizontal Suspended Glass Screen (Non-square, Cinema Aspect) ─── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-5xl max-h-[85vh] sm:max-h-[75vh] overflow-y-auto rounded-t-[36px] sm:rounded-t-[44px] bg-neutral-950/95 border-t border-x border-white/20 p-6 sm:p-8 backdrop-blur-3xl shadow-[0_-25px_80px_rgba(0,0,0,0.95)] select-text"
          >
            {/* Real Glass 45 deg Specular Highlight Overlay */}
            <div
              className="absolute inset-0 pointer-events-none rounded-t-[36px] sm:rounded-t-[44px]"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.02) 20%, transparent 40%, rgba(255,255,255,0.04) 70%, transparent 100%)',
              }}
            />

            {/* Ambient Caustic Halo at Top Edge */}
            <div
              className="absolute top-0 inset-x-0 h-1 blur-sm pointer-events-none opacity-60"
              style={{ backgroundColor: repo.liquidLight.hex }}
            />

            {/* Grab Bar Handle */}
            <div
              onClick={onClose}
              className="w-16 h-1.5 rounded-full bg-white/30 hover:bg-white/60 mx-auto mb-5 cursor-pointer transition-colors"
              title="Cerrar ventana glass"
            />

            {/* ─── Top Bar with Metadata & Close Button ─── */}
            <div className="relative z-10 flex items-start justify-between gap-4 pb-4 border-b border-white/10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {repo.isEducation ? (
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                      ★ EDUCACIÓN ABIERTA · PRIORIDAD FUNDACIONAL
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono uppercase tracking-wider text-purple-300/90 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/50">
                      {repo.category.toUpperCase()}
                    </span>
                  )}
                  <span className="text-xs font-mono text-neutral-400">
                    ID: {repo.id} · Orden #{repo.priorityOrder}
                  </span>
                </div>

                <div className="flex flex-wrap items-baseline gap-3">
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
                    {repo.name}
                  </h2>
                  <span
                    className="font-mono text-sm uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-white/15"
                    style={{ color: repo.liquidLight.hex }}
                  >
                    0-TEXTO: «{repo.singleWord}»
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-mono text-neutral-300">
                  {repo.tagline}
                </p>
              </div>

              <button
                onClick={onClose}
                className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/15 text-neutral-300 hover:text-white transition-all cursor-pointer"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ─── Two-Column Horizontal Cinema Layout ─── */}
            <div className="relative z-10 mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Left Column (7 cols): Architecture, Pillars & Science */}
              <div className="md:col-span-7 space-y-5">
                {/* Architecture & Mission */}
                <div className="space-y-2">
                  <h3 className="font-mono text-xs uppercase tracking-widest text-neutral-400">
                    ARQUITECTURA & MISIÓN
                  </h3>
                  <p className="text-sm sm:text-base text-neutral-200 leading-relaxed font-sans">
                    {repo.longDescription || repo.description}
                  </p>
                </div>

                {/* Technical Features & Pillars */}
                {repo.iconConfig.features && repo.iconConfig.features.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-mono text-xs uppercase tracking-widest text-neutral-400">
                      PILARES DEL SISTEMA
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {repo.iconConfig.features.map((feat, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-mono text-neutral-200"
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: repo.liquidLight.hex }}
                          />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Scientific Article on Liquid Light / Polariton Condensate */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                      <Atom className="w-4 h-4 text-purple-400" />
                      <span className="uppercase tracking-wider">FÍSICA DE LUZ LÍQUIDA ASOCIADA</span>
                    </div>
                    {onOpenArticle && (
                      <button
                        onClick={() => onOpenArticle(repo)}
                        className="text-xs font-mono text-purple-300 hover:text-white underline cursor-pointer"
                      >
                        Leer Paper Completo →
                      </button>
                    )}
                  </div>
                  <div className="text-sm font-bold text-white font-sans">
                    {repo.liquidLight.scientificArticle.title}
                  </div>
                  <p className="text-xs text-neutral-400 font-mono line-clamp-2">
                    {repo.liquidLight.scientificArticle.excerpt}
                  </p>
                </div>

                {/* Telemetry & Stats */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs font-mono">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-neutral-200">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: repo.languageColor }}
                    />
                    <span>{repo.primaryLanguage}</span>
                  </div>

                  {repo.stats.stars > 0 && (
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-neutral-200">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400/80" />
                      <span>{repo.stats.stars} Stars</span>
                    </div>
                  )}

                  {repo.stats.modules && (
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-neutral-200">
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                      <span>{repo.stats.modules} Módulos</span>
                    </div>
                  )}

                  <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-neutral-300">
                    <span>{repo.stats.metrics || 'Producción 100%'}</span>
                  </div>
                </div>
              </div>

              {/* Right Column (5 cols): Procedural 4K Glyph + Direct Cinema Actions */}
              <div className="md:col-span-5 flex flex-col items-center justify-between p-6 rounded-3xl bg-black/60 border border-white/15 space-y-6">
                {/* 4K Procedural Monoglyph Display */}
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="relative cursor-pointer" onClick={() => onInspectIcon(repo)}>
                    <RepoIcon
                      iconConfig={repo.iconConfig}
                      primaryLanguage={repo.primaryLanguage}
                      languageColor={repo.languageColor}
                      size="xl"
                      lightingMode="ultra-noir-3"
                    />
                  </div>
                  <span className="font-mono text-xs text-neutral-400 mt-3">
                    Longitud de Onda: {repo.liquidLight.colorName} (n = {repo.liquidLight.refractiveIndex})
                  </span>
                </div>

                {/* Cinema Action Triggers */}
                <div className="w-full space-y-2.5">
                  <a
                    href={repo.liveUrl || repo.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-neutral-200 text-black font-bold text-xs font-sans tracking-wide transition-all shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                  >
                    <Play className="w-4 h-4 fill-black text-black" />
                    <span>EXPLORAR DEMO EN VIVO</span>
                  </a>

                  <button
                    onClick={() => {
                      onClose();
                      onInspectIcon(repo);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/20 text-white font-medium text-xs font-sans tracking-wide transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>INSPECCIÓN 4K VECTORIAL</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopySvg}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl bg-black/70 hover:bg-neutral-900 border border-white/15 text-neutral-300 hover:text-white text-xs font-mono transition-all"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">COPIADO</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-purple-400" />
                          <span>COPIAR SVG</span>
                        </>
                      )}
                    </button>

                    <a
                      href={repo.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-2xl bg-black/70 hover:bg-neutral-900 border border-white/15 text-neutral-300 hover:text-white transition-all"
                      title="Ver Repositorio en GitHub"
                    >
                      <Github className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
