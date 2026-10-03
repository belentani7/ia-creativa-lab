import React from 'react';
import { LightingMode, RepoCategory } from '../types';
import { Sparkles, Moon, Flame, Sun, Search, BookOpen, Globe, Shield, Terminal, Volume2, Stethoscope, RefreshCw } from 'lucide-react';

interface HudHeaderProps {
  lightingMode: LightingMode;
  onLightingChange: (mode: LightingMode) => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  educationCount: number;
  totalPublicCount: number;
  activeWebsCount?: number;
  onOpenDoctorFix?: () => void;
  onSyncGithub?: () => void;
  isSyncing?: boolean;
}

export const HudHeader: React.FC<HudHeaderProps> = ({
  lightingMode,
  onLightingChange,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  educationCount,
  totalPublicCount,
  activeWebsCount = 0,
  onOpenDoctorFix,
  onSyncGithub,
  isSyncing = false,
}) => {
  return (
    <header className="relative z-30 pt-6 pb-4">
      {/* Top Floating Telemetry Capsule (HBO Max Style) */}
      <div className="mx-auto max-w-5xl px-4 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-full border border-purple-400/20 bg-black/60 px-5 py-2.5 backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(168,85,247,0.12)]">
          {/* Operator Brand */}
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500 shadow-[0_0_10px_#a855f7]" />
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs tracking-[0.2em] font-medium text-purple-200 uppercase">
                BELENTANI // NEURAL CORE
              </span>
              <span className="hidden sm:inline-block font-mono text-[10px] text-purple-400/50">
                · BCN / L'Hospitalet
              </span>
            </div>
          </div>

          {/* Center Utility: Doctor Fix & Live Sync */}
          <div className="flex items-center gap-2">
            {onOpenDoctorFix && (
              <button
                onClick={onOpenDoctorFix}
                className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-purple-900/60 to-purple-800/40 hover:from-purple-800/80 hover:to-purple-700/60 border border-purple-400/40 text-white font-mono text-[11px] shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all cursor-pointer font-medium"
                title="Abrir Doctor Fix - Clínica de Repositorios y Despliegue en GitHub"
              >
                <Stethoscope className="w-3.5 h-3.5 text-purple-300" />
                <span>🩺 Doctor Fix</span>
              </button>
            )}

            {onSyncGithub && (
              <button
                onClick={onSyncGithub}
                disabled={isSyncing}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white font-mono text-[10px] transition-all cursor-pointer"
                title="Sincronizar Repositorios con GitHub @belentani7"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-purple-400' : ''}`} />
                <span className="hidden md:inline">Sync</span>
              </button>
            )}
          </div>

          {/* Lighting Mode Selector */}
          <div className="flex items-center gap-1.5 bg-purple-950/40 p-1 rounded-full border border-purple-500/20">
            <button
              onClick={() => onLightingChange('ultra-noir-3')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-wider transition-all ${
                lightingMode === 'ultra-noir-3'
                  ? 'bg-purple-900/80 text-white shadow-[0_0_15px_rgba(192,132,252,0.4)] border border-purple-400/50'
                  : 'text-purple-300/60 hover:text-white'
              }`}
              title="Modo 3% Lux: Negro absoluto con luz ultra tenue en bordes"
            >
              <Moon className="w-3 h-3" />
              <span>3% Lux</span>
            </button>

            <button
              onClick={() => onLightingChange('hbo-noir')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-wider transition-all ${
                lightingMode === 'hbo-noir'
                  ? 'bg-purple-900/80 text-white shadow-[0_0_15px_rgba(192,132,252,0.4)] border border-purple-400/50'
                  : 'text-purple-300/60 hover:text-white'
              }`}
              title="Estilo HBO Max: Noir purple atmosférico cinematográfico"
            >
              <Sparkles className="w-3 h-3" />
              <span>HBO Noir</span>
            </button>

            <button
              onClick={() => onLightingChange('liquid-bloom')}
              className={`flex items-center gap-1 px-3 py-1 rounded-full font-mono text-[10px] uppercase tracking-wider transition-all ${
                lightingMode === 'liquid-bloom'
                  ? 'bg-purple-900/80 text-white shadow-[0_0_15px_rgba(192,132,252,0.4)] border border-purple-400/50'
                  : 'text-purple-300/60 hover:text-white'
              }`}
              title="Luz líquida plasmática reactiva"
            >
              <Flame className="w-3 h-3" />
              <span>Liquid</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Headline and Statement */}
      <div className="mx-auto max-w-5xl px-4 text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/20 bg-purple-950/30 text-purple-300 font-mono text-[10px] tracking-[0.25em] uppercase mb-4 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
          <Sparkles className="w-3 h-3 text-purple-400" />
          ICONOGRAFÍA REACTIVA · TODAS LAS REPOS PÚBLICAS
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extralight tracking-tight text-white mb-4">
          Luz <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-purple-400 to-purple-600 drop-shadow-[0_0_35px_rgba(192,132,252,0.4)]">Líquida</span> en el Vacío.
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base font-light text-purple-200/70 leading-relaxed mb-8">
          Colección de iconos para todas las repos públicas con <strong className="text-purple-200 font-medium">las de educación primero</strong>. Estética HBO Max noir purple, bordes con fina luz, cristal líquido reactivo grueso y difuminados de alta resolución.
        </p>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xl mx-auto mb-6">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar repositorio, tecnología o concepto..."
              className="w-full rounded-2xl border border-purple-500/25 bg-black/60 pl-11 pr-4 py-2.5 text-sm text-white placeholder-purple-300/40 backdrop-blur-xl focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400/50 shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-purple-400/70 hover:text-white"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Filter Badges with Education Highlighted First */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
          <button
            onClick={() => onFilterChange('webs-live')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full font-mono text-xs tracking-wider uppercase transition-all ${
              activeFilter === 'webs-live'
                ? 'bg-emerald-600/50 text-white border border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                : 'bg-emerald-950/40 text-emerald-300/80 border border-emerald-500/30 hover:border-emerald-300'
            }`}
            title="Mostrar únicamente las aplicaciones y webs desplegadas en vivo"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>🌐 WEBS EN VIVO ({activeWebsCount})</span>
          </button>

          <button
            onClick={() => onFilterChange('education')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full font-mono text-xs tracking-wider uppercase transition-all ${
              activeFilter === 'education'
                ? 'bg-purple-600/50 text-white border border-purple-300 shadow-[0_0_20px_rgba(192,132,252,0.4)]'
                : 'bg-purple-950/40 text-purple-300/80 border border-purple-400/30 hover:border-purple-300'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-300" />
            <span>★ EDUCACIÓN PRIMERO ({educationCount})</span>
          </button>

          <button
            onClick={() => onFilterChange('all')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono text-xs tracking-wider uppercase transition-all ${
              activeFilter === 'all'
                ? 'bg-purple-900/50 text-white border border-purple-400 shadow-[0_0_15px_rgba(192,132,252,0.3)]'
                : 'bg-black/40 text-purple-300/60 border border-purple-500/20 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Todas las Públicas ({totalPublicCount})</span>
          </button>

          <button
            onClick={() => onFilterChange('ai-agents')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono text-xs tracking-wider uppercase transition-all ${
              activeFilter === 'ai-agents'
                ? 'bg-purple-900/50 text-white border border-purple-400 shadow-[0_0_15px_rgba(192,132,252,0.3)]'
                : 'bg-black/40 text-purple-300/60 border border-purple-500/20 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>IA & Agentes</span>
          </button>

          <button
            onClick={() => onFilterChange('systems-core')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono text-xs tracking-wider uppercase transition-all ${
              activeFilter === 'systems-core'
                ? 'bg-purple-900/50 text-white border border-purple-400 shadow-[0_0_15px_rgba(192,132,252,0.3)]'
                : 'bg-black/40 text-purple-300/60 border border-purple-500/20 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Sistemas & Kernel</span>
          </button>

          <button
            onClick={() => onFilterChange('creative-audio')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono text-xs tracking-wider uppercase transition-all ${
              activeFilter === 'creative-audio'
                ? 'bg-purple-900/50 text-white border border-purple-400 shadow-[0_0_15px_rgba(192,132,252,0.3)]'
                : 'bg-black/40 text-purple-300/60 border border-purple-500/20 hover:text-white'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Audio & Estudio</span>
          </button>
        </div>
      </div>
    </header>
  );
};
