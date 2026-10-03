import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, BookOpen, ExternalLink, Atom, Waves, ShieldCheck, Sun } from 'lucide-react';
import { Repository } from '../types';

interface LiquidLightArticleDrawerProps {
  repo: Repository | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LiquidLightArticleDrawer: React.FC<LiquidLightArticleDrawerProps> = ({
  repo,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !repo) return null;

  const { liquidLight } = repo;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-2xl">
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 20 }}
        className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl bg-neutral-950 border border-purple-500/35 shadow-[0_0_90px_rgba(168,85,247,0.3)] overflow-hidden text-white"
        style={{
          boxShadow: `0 0 80px ${liquidLight.milkyGlow}, 0 20px 40px rgba(0,0,0,0.9)`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-purple-900/30 bg-black/60">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-2xl border"
              style={{
                backgroundColor: `${liquidLight.hex}20`,
                borderColor: `${liquidLight.hex}60`,
                color: liquidLight.hex,
              }}
            >
              <Atom className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-purple-300/80">
                  FÍSICA FOTÓNICA & LUZ LÍQUIDA
                </span>
                <span className="font-mono text-[10px] font-bold text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-500/30">
                  3% LUX CALIBRADO
                </span>
              </div>
              <h2 className="text-xl font-black text-white mt-0.5">
                {liquidLight.colorName}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/20 text-purple-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 select-text">
          {/* Scientific Paper Card */}
          <div
            className="p-5 rounded-2xl border bg-black/50 space-y-3"
            style={{ borderColor: `${liquidLight.hex}40` }}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-widest text-purple-400/90 font-bold">
                DOCUMENTO CIENTÍFICO REFERENCIADO
              </span>
              <span className="font-mono text-[11px] text-neutral-400">
                Índice de Refracción: <strong>n = {liquidLight.refractiveIndex}</strong>
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
              «{liquidLight.scientificArticle.title}»
            </h3>

            <div className="text-xs font-mono text-purple-300/80 flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-purple-400" />
              <span>{liquidLight.scientificArticle.source}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs sm:text-sm text-purple-100/90 leading-relaxed font-sans">
              {liquidLight.scientificArticle.excerpt}
            </div>
          </div>

          {/* Principle of Plasmatic Milky Light at 3% Lux */}
          <div className="p-5 rounded-2xl bg-black/60 border border-purple-500/20 space-y-3">
            <div className="flex items-center gap-2">
              <Waves className="w-4 h-4 text-purple-400" />
              <h4 className="font-mono text-xs uppercase tracking-wider text-purple-200 font-bold">
                PRINCIPIO DE LUZ LECHOSA PLASMÁTICA (MILKY LIGHT)
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              La luz plasmática milky light sustituye el blanco duro artificial (255, 255, 255) por una
              emisión de fotones coherentes atenuada al <strong>3% de luminancia absoluta (8/255)</strong>.
              Esto emula la física de los difusores moleculares de micro-esferas en pantallas Apple OLED,
              impidiendo el deslumbramiento nocturno y logrando un confort visual absoluto en oscuridad total.
            </p>

            <div className="grid grid-cols-3 gap-2.5 pt-2 text-center font-mono">
              <div className="p-2.5 rounded-xl bg-neutral-900 border border-purple-900/30">
                <span className="text-[10px] text-neutral-400 block">LUMINANCIA MÁX</span>
                <span className="text-sm font-bold text-emerald-400">3.00% LUX</span>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-900 border border-purple-900/30">
                <span className="text-[10px] text-neutral-400 block">DISPERSIÓN</span>
                <span className="text-sm font-bold text-purple-300">MIE LECHOSA</span>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-900 border border-purple-900/30">
                <span className="text-[10px] text-neutral-400 block">REFRACCIÓN</span>
                <span className="text-sm font-bold text-white">n = {liquidLight.refractiveIndex}</span>
              </div>
            </div>
          </div>

          {/* Colorimetric Spectrum Signature */}
          <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl border border-white/20 shadow-lg"
                style={{ backgroundColor: liquidLight.hex }}
              />
              <div>
                <span className="text-xs font-mono font-bold text-white block">
                  {liquidLight.colorName}
                </span>
                <span className="text-[11px] font-mono text-purple-300/70">
                  Código Cromático: {liquidLight.hex}
                </span>
              </div>
            </div>
            <span className="text-xs font-mono text-purple-400">
              Proyecto: {repo.name}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 bg-black/70 border-t border-purple-900/30 text-xs font-mono">
          <span className="text-purple-300/70">
            Física cuántica y óptica adaptativa NOIACORE LAB
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold font-sans transition-all"
          >
            ENTENDIDO
          </button>
        </div>
      </motion.div>
    </div>
  );
};
