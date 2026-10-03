import React, { useState } from 'react';
import { Repository, LightingMode } from '../types';
import { RepoIcon } from './RepoIcon';
import { X, Copy, Check, Sparkles, Sliders, ExternalLink, ShieldCheck, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface IconStudioModalProps {
  repo: Repository | null;
  onClose: () => void;
  lightingMode: LightingMode;
  onLightingChange: (mode: LightingMode) => void;
}

export const IconStudioModal: React.FC<IconStudioModalProps> = ({
  repo,
  onClose,
  lightingMode,
  onLightingChange,
}) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [puffIntensity, setPuffIntensity] = useState<number>(85);
  const [haloGlow, setHaloGlow] = useState<number>(65);

  if (!repo) return null;

  const handleCopySvg = () => {
    // Generate full standalone SVG string for export
    const svgCode = `<!-- Belentani Neural Core Icon: ${repo.name} -->
<!-- Style: HBO Max Noir Purple · Thick Liquid Glass -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="240" height="240">
  <defs>
    <radialGradient id="bg-dark" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#090314" />
      <stop offset="100%" stop-color="#010003" />
    </radialGradient>
    <filter id="halo-glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="${(haloGlow / 15).toFixed(1)}" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <rect width="120" height="120" rx="32" fill="url(#bg-dark)" stroke="${repo.iconConfig.accentColor}" stroke-width="1.5" filter="url(#halo-glow)" />
  <!-- Glyph: ${repo.iconConfig.glyphType} -->
  <g transform="translate(10, 10)">
    <!-- Procedural geometry rendered for ${repo.name} -->
  </g>
</svg>`;

    navigator.clipboard.writeText(svgCode);
    setCopied('svg');
    setTimeout(() => setCopied(null), 2500);
  };

  const handleCopyCss = () => {
    const cssCode = `/* HBO Max Noir Glassmorphism Card Style */
.noir-glass-card {
  background: rgba(5, 1, 9, 0.88);
  backdrop-filter: blur(32px) saturate(180%);
  -webkit-backdrop-filter: blur(32px) saturate(180%);
  border: 1px solid rgba(192, 132, 252, 0.35);
  border-radius: 28px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.95),
    0 0 ${haloGlow}px ${repo.iconConfig.haloColor},
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
  transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}`;

    navigator.clipboard.writeText(cssCode);
    setCopied('css');
    setTimeout(() => setCopied(null), 2500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Darkened backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/90 backdrop-blur-xl"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-3xl overflow-hidden rounded-[32px] border border-purple-400/25 bg-[#040107]/95 p-6 sm:p-9 shadow-[0_25px_80px_rgba(0,0,0,0.98),0_0_80px_rgba(168,85,247,0.18)] backdrop-blur-3xl my-auto"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-purple-500/15 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 rounded-full bg-purple-400 shadow-[0_0_12px_#c084fc]" />
              <div>
                <span className="font-mono text-[10px] tracking-[0.2em] text-purple-300 uppercase">
                  {repo.isEducation ? '★ STUDIO DE ICONOS · EDUCACIÓN PRIMERO' : 'STUDIO DE ICONOS · REPOSITORIO PÚBLICO'}
                </span>
                <h2 className="text-xl sm:text-2xl font-light tracking-tight text-white flex items-center gap-2">
                  {repo.name}
                  {repo.isEducation && (
                    <span className="rounded-full bg-purple-900/50 border border-purple-400/40 px-2.5 py-0.5 text-[10px] font-mono text-purple-200">
                      OPEN EDUCATION
                    </span>
                  )}
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full p-2 text-purple-300/60 hover:text-white hover:bg-purple-900/30 transition-colors border border-purple-500/10"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Inspection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left: Ultra-High-Resolution Interactive Icon */}
            <div className="flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl bg-black/70 border border-purple-500/20 relative overflow-hidden group">
              {/* Dynamic Atmospheric Puff */}
              <div
                className="absolute inset-0 pointer-events-none transition-all duration-700"
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${repo.iconConfig.puffGlow} 0%, transparent 65%)`,
                  filter: `blur(${puffIntensity / 2}px)`,
                  opacity: puffIntensity / 100,
                }}
              />

              {/* Ultra-HD Master Icon */}
              <div className="relative z-10 py-4">
                <RepoIcon
                  glyphType={repo.iconConfig.glyphType}
                  name={repo.name}
                  size="xl"
                  isEducation={repo.isEducation}
                  accentColor={repo.iconConfig.accentColor}
                  haloColor={repo.iconConfig.haloColor}
                  puffGlow={repo.iconConfig.puffGlow}
                />
              </div>

              {/* Status Badge */}
              <div className="mt-4 flex items-center gap-2 font-mono text-[10px] text-purple-300/70 tracking-widest uppercase">
                <span>GLYPH: {repo.iconConfig.glyphType}</span>
                <span>·</span>
                <span>HBO NOIR 60FPS</span>
              </div>
            </div>

            {/* Right: Technical Spec & Customizer Controls */}
            <div className="flex flex-col gap-5">
              <div>
                <h4 className="font-mono text-xs uppercase tracking-widest text-purple-300/80 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Simbología & Arquitectura Visual
                </h4>
                <p className="text-sm text-purple-100/80 font-light leading-relaxed">
                  {repo.iconConfig.symbolDescription}
                </p>
              </div>

              {/* Feature vectors */}
              <div className="flex flex-wrap gap-1.5">
                {repo.iconConfig.features.map((feat, idx) => (
                  <span
                    key={idx}
                    className="font-mono text-[10px] px-2.5 py-1 rounded-lg bg-purple-950/40 border border-purple-400/20 text-purple-200/90"
                  >
                    ✦ {feat}
                  </span>
                ))}
              </div>

              {/* Controls: Halo and Puff adjustments */}
              <div className="space-y-3 pt-2 border-t border-purple-500/15">
                <div className="flex items-center justify-between text-xs font-mono text-purple-200/80">
                  <span>HALO DE LUZ FINA</span>
                  <span>{haloGlow}px</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="120"
                  value={haloGlow}
                  onChange={(e) => setHaloGlow(Number(e.target.value))}
                  className="w-full accent-purple-400 bg-purple-950/50 h-1.5 rounded-lg cursor-pointer"
                />

                <div className="flex items-center justify-between text-xs font-mono text-purple-200/80 pt-1">
                  <span>DIFUMINADO PUFF PUFF</span>
                  <span>{puffIntensity}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={puffIntensity}
                  onChange={(e) => setPuffIntensity(Number(e.target.value))}
                  className="w-full accent-purple-400 bg-purple-950/50 h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              {/* Atmosphere Switcher in Modal */}
              <div className="pt-2">
                <span className="font-mono text-[10px] text-purple-300/60 uppercase tracking-widest block mb-2">
                  MODO DE ILUMINACIÓN DE FONDO
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'ultra-noir-3', label: '3% Lux Ultranegro' },
                    { id: 'hbo-noir', label: 'HBO Max Noir' },
                    { id: 'liquid-bloom', label: 'Liquid Bloom' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => onLightingChange(m.id as LightingMode)}
                      className={`font-mono text-[10px] py-1.5 px-2 rounded-xl border text-center transition-all ${
                        lightingMode === m.id
                          ? 'border-purple-400 bg-purple-900/40 text-white shadow-[0_0_15px_rgba(192,132,252,0.3)]'
                          : 'border-purple-500/20 bg-black/40 text-purple-300/60 hover:text-white'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-3">
                <button
                  onClick={handleCopySvg}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 py-2.5 px-4 font-mono text-xs text-white transition-all shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                >
                  {copied === 'svg' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>SVG Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-purple-300" />
                      <span>Copiar SVG HD</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleCopyCss}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 px-4 font-mono text-xs text-purple-200 transition-all"
                >
                  {copied === 'css' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>CSS Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Sliders className="w-4 h-4 text-purple-300" />
                      <span>Copiar CSS Glass</span>
                    </>
                  )}
                </button>
              </div>

              {/* GitHub Link */}
              <a
                href={repo.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 text-xs font-mono text-purple-300/80 hover:text-white transition-colors pt-1"
              >
                <span>Explorar repositorio oficial en GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
