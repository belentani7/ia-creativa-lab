import React, { useRef, useState } from 'react';
import { Repository } from '../types';
import { RepoIcon } from './RepoIcon';
import { ExternalLink, Star, GitFork, ArrowUpRight, Sparkles, BookOpen, Layers } from 'lucide-react';
import { motion } from 'motion/react';

interface RepoCardProps {
  repo: Repository;
  onInspectIcon: (repo: Repository) => void;
  index: number;
}

export const RepoCard: React.FC<RepoCardProps> = ({ repo, onInspectIcon, index }) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setMousePos({ x, y });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!cardRef.current || e.touches.length === 0) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.touches[0].clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.touches[0].clientY - rect.top) / rect.height) * 100));
    setMousePos({ x, y });
  };

  return (
    <motion.article
      ref={cardRef}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, delay: Math.min(index * 0.05, 0.4), ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      className={`group relative overflow-hidden rounded-[30px] transition-all duration-700 ${
        repo.isEducation ? 'ring-1 ring-purple-400/30' : ''
      }`}
      style={{
        backgroundColor: 'rgba(4, 2, 8, 0.82)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        border: `1px solid ${
          isHovered
            ? 'rgba(216, 180, 254, 0.4)'
            : repo.isEducation
            ? 'rgba(192, 132, 252, 0.28)'
            : 'rgba(168, 85, 247, 0.16)'
        }`,
        boxShadow: isHovered
          ? `0 24px 70px rgba(0, 0, 0, 0.95), 0 0 50px ${repo.iconConfig.haloColor}, inset 0 1px 1px rgba(255, 255, 255, 0.25)`
          : `0 16px 50px rgba(0, 0, 0, 0.85), 0 0 25px ${
              repo.isEducation ? 'rgba(192, 132, 252, 0.15)' : 'rgba(126, 34, 206, 0.08)'
            }, inset 0 1px 0 rgba(255, 255, 255, 0.08)`,
      }}
    >
      {/* ── Reactive Liquid Spotlight Layer (moves with mouse/touch) ── */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-700"
        style={{
          background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, ${repo.iconConfig.puffGlow} 0%, transparent 55%)`,
          opacity: isHovered ? 0.85 : 0.25,
          filter: 'blur(24px)',
        }}
      />

      {/* ── Fine Light Edge Highlight pseudo ── */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255, 255, 255, 0.12) 0%, transparent 60%)`,
        }}
      />

      <div className="relative z-10 p-6 sm:p-8 flex flex-col justify-between h-full">
        {/* Top Header Row */}
        <div>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              {/* Clickable Icon with bespoke HD trigger */}
              <div onClick={() => onInspectIcon(repo)} title="Clic para inspeccionar icono en 4K Studio">
                <RepoIcon
                  glyphType={repo.iconConfig.glyphType}
                  name={repo.name}
                  size="md"
                  isEducation={repo.isEducation}
                  accentColor={repo.iconConfig.accentColor}
                  haloColor={repo.iconConfig.haloColor}
                  puffGlow={repo.iconConfig.puffGlow}
                />
              </div>

              <div>
                {/* Priority Label */}
                <div className="flex items-center gap-2 mb-1">
                  {repo.isEducation ? (
                    <span className="inline-flex items-center gap-1.5 font-mono text-[9px] tracking-[0.18em] uppercase text-purple-200 bg-purple-950/80 border border-purple-400/40 px-2.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(192,132,252,0.3)]">
                      <BookOpen className="w-2.5 h-2.5 text-purple-300" />
                      EDUCACIÓN · PRIORIDAD 0{repo.priorityOrder}
                    </span>
                  ) : (
                    <span className="font-mono text-[9px] tracking-[0.16em] uppercase text-purple-300/60 bg-white/[0.03] border border-white/[0.08] px-2.5 py-0.5 rounded-full">
                      PÚBLICA · 0{repo.priorityOrder}
                    </span>
                  )}
                  <span className="font-mono text-[9px] text-purple-300/40">
                    {repo.primaryLanguage}
                  </span>
                </div>

                {/* Repository Title */}
                <h3
                  onClick={() => onInspectIcon(repo)}
                  className="text-lg sm:text-xl font-medium tracking-tight text-white hover:text-purple-200 cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  {repo.name}
                  <span className="text-purple-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    ↗
                  </span>
                </h3>
              </div>
            </div>

            {/* Quick Inspect Icon Button */}
            <button
              onClick={() => onInspectIcon(repo)}
              className="flex items-center gap-1 font-mono text-[10px] text-purple-300/70 hover:text-white bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/20 hover:border-purple-400/50 px-3 py-1.5 rounded-xl transition-all shadow-[0_0_12px_rgba(168,85,247,0.15)] shrink-0"
            >
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span className="hidden sm:inline">Icono HD</span>
            </button>
          </div>

          {/* Description */}
          <p className="text-sm font-light leading-relaxed text-purple-100/70 mb-5">
            {repo.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-6">
            {repo.tags.map((tag) => (
              <span
                key={tag}
                className="font-mono text-[9px] tracking-wider uppercase px-2 py-0.5 rounded-md bg-white/[0.03] border border-purple-400/10 text-purple-300/70"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Footer Meta & External Links */}
        <div className="pt-4 border-t border-purple-500/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs font-mono text-purple-300/60">
            {repo.stats.metrics && (
              <span className="text-purple-200/80 font-medium">
                {repo.stats.metrics}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-purple-400/80" />
              {repo.stats.stars}
            </span>
            <span className="flex items-center gap-1">
              <GitFork className="w-3 h-3 text-purple-400/80" />
              {repo.stats.forks}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {repo.liveUrl && (
              <a
                href={repo.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] text-purple-300/80 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 transition-colors flex items-center gap-1"
                title="Abrir despliegue en vivo"
              >
                <span>Live</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            )}

            <a
              href={repo.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] text-white bg-purple-900/40 hover:bg-purple-900/70 px-2.5 py-1 rounded-lg border border-purple-400/30 transition-colors flex items-center gap-1"
              title="Ver en GitHub"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </motion.article>
  );
};
