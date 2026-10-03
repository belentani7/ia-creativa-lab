import React from 'react';
import { Repository } from '../types';
import { RepoIcon } from './RepoIcon';
import { Sparkles, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';

interface IconGalleryStripProps {
  repositories: Repository[];
  onSelectRepo: (repo: Repository) => void;
  selectedRepoId?: string;
}

export const IconGalleryStrip: React.FC<IconGalleryStripProps> = ({
  repositories,
  onSelectRepo,
  selectedRepoId,
}) => {
  const educationRepos = repositories.filter((r) => r.isEducation);
  const otherRepos = repositories.filter((r) => !r.isEducation);

  return (
    <section className="relative z-20 mx-auto max-w-5xl px-4 mb-16">
      {/* Container with HBO Max Noir glass styling */}
      <div className="rounded-[36px] border border-purple-500/20 bg-black/70 p-6 sm:p-8 backdrop-blur-3xl shadow-[0_20px_70px_rgba(0,0,0,0.95),0_0_60px_rgba(168,85,247,0.1)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-purple-500/15">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2 w-2 rounded-full bg-purple-400 shadow-[0_0_10px_#c084fc]" />
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-purple-200">
              MATRIZ DE ICONOS REACTIVOS · ALTA RESOLUCIÓN
            </h2>
          </div>
          <span className="font-mono text-[10px] text-purple-300/60 uppercase tracking-widest">
            {repositories.length} ICONOS VECTORES · CLIC PARA ABRIR EN 4K STUDIO
          </span>
        </div>

        {/* 1. Education Repositories Icons Section (FIRST) */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-900/40 border border-purple-400/30 text-purple-200 font-mono text-[10px] tracking-wider uppercase shadow-[0_0_15px_rgba(192,132,252,0.25)]">
              <BookOpen className="w-3 h-3 text-purple-300" />
              1. REPOS DE EDUCACIÓN & APRENDIZAJE ABIERTO (PRIORIDAD)
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-purple-500/30 to-transparent" />
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
            {educationRepos.map((repo, idx) => {
              const isSelected = selectedRepoId === repo.id;
              return (
                <motion.div
                  key={repo.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelectRepo(repo)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-purple-900/30 border border-purple-400 shadow-[0_0_20px_rgba(192,132,252,0.3)]'
                      : 'hover:bg-purple-950/30 border border-transparent hover:border-purple-500/20'
                  }`}
                >
                  <RepoIcon
                    glyphType={repo.iconConfig.glyphType}
                    name={repo.name}
                    size="md"
                    isEducation={true}
                    accentColor={repo.iconConfig.accentColor}
                    haloColor={repo.iconConfig.haloColor}
                    puffGlow={repo.iconConfig.puffGlow}
                  />
                  <span className="font-mono text-[10px] text-center text-purple-200 truncate w-full">
                    {repo.name}
                  </span>
                  <span className="font-mono text-[8px] text-purple-400/60 uppercase">
                    0{repo.priorityOrder} · {repo.primaryLanguage}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* 2. Other Public Repositories Icons Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-purple-300/70 font-mono text-[10px] tracking-wider uppercase">
              <Sparkles className="w-3 h-3 text-purple-400" />
              2. REPOS PÚBLICAS GENERALES & ECOSISTEMAS
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-purple-500/20 to-transparent" />
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {otherRepos.map((repo) => {
              const isSelected = selectedRepoId === repo.id;
              return (
                <motion.div
                  key={repo.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelectRepo(repo)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-purple-900/30 border border-purple-400 shadow-[0_0_15px_rgba(192,132,252,0.3)]'
                      : 'hover:bg-purple-950/20 border border-transparent hover:border-purple-500/20'
                  }`}
                >
                  <RepoIcon
                    glyphType={repo.iconConfig.glyphType}
                    name={repo.name}
                    size="sm"
                    isEducation={false}
                    accentColor={repo.iconConfig.accentColor}
                    haloColor={repo.iconConfig.haloColor}
                    puffGlow={repo.iconConfig.puffGlow}
                  />
                  <span className="font-mono text-[9px] text-center text-purple-200/80 truncate w-full">
                    {repo.name}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
