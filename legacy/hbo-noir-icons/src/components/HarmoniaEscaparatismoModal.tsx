import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  CheckCircle2,
  Shield,
  Layers,
  Sliders,
  X,
  Search,
  Copy,
  Check,
  Tv,
  Eye,
  Cpu,
  Glasses,
  Activity,
  Gauge,
  BookOpen,
  Filter,
  Flame,
  Scale
} from 'lucide-react';
import {
  generateConstraintRules,
  evaluateSceneHarmony,
  MASTER_PRIORITIES,
  RULE_CATEGORIES
} from '../engine/designConstraintEngine';
import { REPOSITORIES } from '../data/repositories';
import { RuleCategory, DesignEngineRule } from '../types';

interface HarmoniaEscaparatismoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HarmoniaEscaparatismoModal: React.FC<HarmoniaEscaparatismoModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'harmony' | 'priorities'>('rules');
  const [ruleCountTarget, setRuleCountTarget] = useState<number>(20000);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedRule, setSelectedRule] = useState<DesignEngineRule | null>(null);

  // Generate algorithmic constraint rules dynamically from engine
  const allRules = useMemo(() => {
    return generateConstraintRules(ruleCountTarget);
  }, [ruleCountTarget]);

  // Filter rules by category and search
  const filteredRules = useMemo(() => {
    return allRules.filter((r) => {
      const matchCat = selectedCategory === 'ALL' || r.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchCat;
      const matchQuery =
        r.id.toLowerCase().includes(q) ||
        r.condition.toLowerCase().includes(q) ||
        r.action.toLowerCase().includes(q) ||
        r.rationale.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [allRules, selectedCategory, searchQuery]);

  // Current active rule or first in filtered list
  const inspectedRule = selectedRule || filteredRules[0] || allRules[0];

  // Live Harmony Report
  const harmonyReport = useMemo(() => {
    return evaluateSceneHarmony(REPOSITORIES[0], 'ultra-noir-3', 'tv');
  }, []);

  const handleCopyRule = (rule: DesignEngineRule) => {
    const text = `BELENTANI DESIGN CONSTRAINT ENGINE:
RULE ID: ${rule.id}
CATEGORY: ${rule.category}
PRIORITY: ${rule.priority}
SEVERITY: ${rule.severity}
CONDITION: ${rule.condition}
ACTION: ${rule.action}
RATIONALE: ${rule.rationale}
VALIDATION: ${rule.validation}
STATUS: ${rule.status}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAllRules = () => {
    const text = JSON.stringify(filteredRules.slice(0, 500), null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-3xl overflow-hidden animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-[92vh] flex flex-col bg-neutral-950/95 border border-purple-500/30 rounded-3xl sm:rounded-[36px] overflow-hidden shadow-[0_0_80px_rgba(168,85,247,0.25)] select-none">
        {/* Real Glass Specular Sheen at 45 deg */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 25%, transparent 45%, rgba(255,255,255,0.03) 70%, transparent 100%)',
          }}
        />

        {/* ─── MODAL HEADER ─── */}
        <header className="relative z-20 flex flex-wrap items-center justify-between px-6 sm:px-8 py-4 bg-black/80 border-b border-purple-900/30 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-purple-950/80 border border-purple-500/40 text-purple-300">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide font-mono">
                  BELENTANI DESIGN CONSTRAINT ENGINE
                </h2>
                <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-[10px] font-mono text-emerald-400 font-bold">
                  100% CUMPLIMIENTO
                </span>
              </div>
              <p className="text-xs font-mono text-neutral-400">
                Dirección de Arte · 20 Categorías · Armonía Matemática · Escaparatismo & Real Glass Glossy
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
            {/* Tab Selector */}
            <div className="flex items-center bg-black/80 p-1 rounded-2xl border border-purple-500/25 text-xs font-mono">
              <button
                onClick={() => setActiveTab('rules')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  activeTab === 'rules'
                    ? 'bg-purple-600 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                    : 'text-purple-300/70 hover:text-white'
                }`}
              >
                MOTOR DE REGLAS
              </button>
              <button
                onClick={() => setActiveTab('harmony')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  activeTab === 'harmony'
                    ? 'bg-purple-600 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                    : 'text-purple-300/70 hover:text-white'
                }`}
              >
                ARMONÍA MATEMÁTICA
              </button>
              <button
                onClick={() => setActiveTab('priorities')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  activeTab === 'priorities'
                    ? 'bg-purple-600 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                    : 'text-purple-300/70 hover:text-white'
                }`}
              >
                8 PRIORIDADES
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-purple-500/30 text-purple-300 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* ─── TAB 1: GENERATIVE RULE ENGINE (20 CATEGORIES) ─── */}
        {activeTab === 'rules' && (
          <div className="relative z-20 flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Panel: Filters & Rule List */}
            <div className="w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-purple-900/30 bg-black/40">
              {/* Controls Bar: Rule Count Selector & Search */}
              <div className="p-4 sm:p-5 border-b border-purple-900/20 space-y-3 bg-black/60">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {/* Dynamic Rule Target Selector */}
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <span className="text-neutral-400">Escala:</span>
                    {[1000, 5000, 10000, 20000].map((cnt) => (
                      <button
                        key={cnt}
                        onClick={() => setRuleCountTarget(cnt)}
                        className={`px-2.5 py-1 rounded-lg border transition-all ${
                          ruleCountTarget === cnt
                            ? 'bg-purple-950 border-purple-400 text-white font-bold'
                            : 'bg-black/50 border-purple-900/30 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {cnt >= 1000 ? `${cnt / 1000}K` : cnt}
                      </button>
                    ))}
                  </div>

                  <span className="text-[11px] font-mono text-purple-400/80">
                    {filteredRules.length} de {ruleCountTarget} reglas
                  </span>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar por ID (ej. LIGH-0342) o condición..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/70 border border-purple-500/25 text-white placeholder-neutral-500 text-xs font-mono focus:outline-none focus:border-purple-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs"
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                {/* 20 Categories Pills Scroll */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar text-[11px] font-mono">
                  <button
                    onClick={() => setSelectedCategory('ALL')}
                    className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all ${
                      selectedCategory === 'ALL'
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-black/60 border border-purple-900/20 text-neutral-400 hover:text-white'
                    }`}
                  >
                    TODAS (20)
                  </button>
                  {RULE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all ${
                        selectedCategory === cat.id
                          ? 'bg-purple-600 text-white font-bold'
                          : 'bg-black/60 border border-purple-900/20 text-neutral-400 hover:text-white'
                      }`}
                      title={cat.desc}
                    >
                      {cat.id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable Rules List */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 select-none">
                {filteredRules.slice(0, 80).map((rule) => {
                  const isSelected = inspectedRule?.id === rule.id;
                  return (
                    <div
                      key={rule.id}
                      onClick={() => setSelectedRule(rule)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-950/70 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                          : 'bg-black/40 border-purple-900/20 text-neutral-300 hover:bg-purple-950/30 hover:border-purple-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1 text-[11px] font-mono">
                        <span className="font-bold text-purple-400">{rule.id}</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              rule.severity === 'CRITICAL'
                                ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                                : rule.severity === 'HIGH'
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                                : 'bg-purple-950/80 text-purple-300'
                            }`}
                          >
                            {rule.severity}
                          </span>
                          <span className="text-neutral-500">{rule.category}</span>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-200 line-clamp-2">{rule.condition}</p>
                    </div>
                  );
                })}

                {filteredRules.length > 80 && (
                  <div className="text-center py-2 text-xs font-mono text-neutral-500">
                    Mostrando primeras 80 reglas de {filteredRules.length} (usa el buscador para filtrar)
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel: Rule Detailed Inspector Card */}
            <div className="w-full md:w-1/2 flex flex-col justify-between p-6 sm:p-8 bg-black/60 overflow-y-auto">
              <div className="space-y-6">
                {/* Header Badge */}
                <div className="flex items-center justify-between pb-4 border-b border-purple-900/30">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black font-mono text-purple-400">
                        {inspectedRule.id}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-950 border border-purple-500/40 text-xs font-mono text-purple-200">
                        {inspectedRule.priority}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-neutral-400">
                      Categoría: {inspectedRule.category} · Severidad: {inspectedRule.severity}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyRule(inspectedRule)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-500/30 text-purple-200 text-xs font-mono transition-all"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'COPIADA' : 'COPIAR'}</span>
                    </button>
                  </div>
                </div>

                {/* Structured Rule Inspector Fields */}
                <div className="space-y-4 font-mono text-xs">
                  {/* CONDITION */}
                  <div className="p-4 rounded-2xl bg-neutral-900/80 border border-purple-500/20">
                    <div className="text-[10px] uppercase tracking-widest text-purple-400 font-bold mb-1">
                      CONDICIÓN DE DISPARO (CONDITION)
                    </div>
                    <p className="text-white text-sm font-sans leading-relaxed">
                      {inspectedRule.condition}
                    </p>
                  </div>

                  {/* ACTION */}
                  <div className="p-4 rounded-2xl bg-neutral-900/80 border border-emerald-500/20">
                    <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-1">
                      ACCIÓN DETERMINISTA (ACTION)
                    </div>
                    <p className="text-neutral-200 text-sm font-sans leading-relaxed">
                      {inspectedRule.action}
                    </p>
                  </div>

                  {/* RATIONALE */}
                  <div className="p-4 rounded-2xl bg-neutral-900/80 border border-purple-500/20">
                    <div className="text-[10px] uppercase tracking-widest text-purple-300 font-bold mb-1">
                      JUSTIFICACIÓN ÓPTICA & ESTÉTICA (RATIONALE)
                    </div>
                    <p className="text-neutral-300 text-xs font-sans leading-relaxed">
                      {inspectedRule.rationale}
                    </p>
                  </div>

                  {/* VALIDATION */}
                  <div className="p-4 rounded-2xl bg-neutral-900/80 border border-blue-500/20">
                    <div className="text-[10px] uppercase tracking-widest text-blue-400 font-bold mb-1">
                      VALIDACIÓN AUTOMATIZADA (VALIDATION SENSOR)
                    </div>
                    <p className="text-neutral-300 text-xs font-mono">
                      ⚙ {inspectedRule.validation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Export */}
              <div className="pt-6 border-t border-purple-900/30 flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-500">Motor Generativo Belentani v4.8</span>
                <button
                  onClick={handleCopyAllRules}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all"
                >
                  Exportar JSON Filtrado
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: MATHEMATICAL HARMONY SYSTEM & ESCAPARATISMO ─── */}
        {activeTab === 'harmony' && (
          <div className="relative z-20 flex-1 overflow-y-auto p-6 sm:p-10 space-y-8">
            {/* Harmony Quotient Metric Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-3xl bg-black/60 border border-purple-500/30 shadow-xl">
                <div className="text-[11px] font-mono text-purple-400 uppercase tracking-widest">
                  ÍNDICE DE ARMONÍA MATEMÁTICA
                </div>
                <div className="text-4xl font-black font-mono text-white mt-1">
                  {harmonyReport.harmonicIndex}%
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  Cero competencia visual simultánea (Luz, Color, Escala y Movimiento)
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-black/60 border border-emerald-500/30 shadow-xl">
                <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-widest">
                  LUMINANCIA AMBIENTAL
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-300 mt-1">
                  {harmonyReport.atmosphereLuminance}
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  Tope estricto de 8/255 RGB para visión nocturna sin deslumbramiento
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-black/60 border border-purple-500/30 shadow-xl">
                <div className="text-[11px] font-mono text-purple-400 uppercase tracking-widest">
                  CONTRASTE PERCEPTUAL
                </div>
                <div className="text-2xl font-bold font-mono text-white mt-1">
                  {harmonyReport.contrastRatio}
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  WCAG AAA garantizado sobre fondo ultra-negro
                </p>
              </div>
            </div>

            {/* The 3-Tier Hierarchy: Focal Point > Secondary Point > Atmosphere */}
            <div className="p-6 rounded-3xl bg-purple-950/20 border border-purple-500/30 space-y-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white font-mono">
                  JERARQUÍA CINEMATOGRÁFICA: SI TODO GRITA, NADA DESTACA
                </h3>
              </div>
              <p className="text-xs text-neutral-300 max-w-2xl leading-relaxed">
                Cada escena está restringida a tres niveles de presencia visual exactos:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                <div className="p-4 rounded-2xl bg-black/60 border border-purple-500/40">
                  <span className="text-purple-400 font-bold">1. FOCAL POINT</span>
                  <p className="text-white mt-1">
                    Monoglifo 4K + Palabra monumental única (0-Texto). Máxima presencia.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-black/60 border border-white/10">
                  <span className="text-neutral-400 font-bold">2. SECONDARY POINT</span>
                  <p className="text-neutral-300 mt-1">
                    Corona digital rotatoria, bisel horizontal 16:9 y telemetría de sincronización.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-black/60 border border-white/10">
                  <span className="text-neutral-400 font-bold">3. ATMOSPHERE</span>
                  <p className="text-neutral-400 mt-1">
                    Luz lechosa al 3% de lux, halo bias lighting y grano de película HBO Noir.
                  </p>
                </div>
              </div>
            </div>

            {/* The 7 Fundamental Questions of Escaparatismo */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold font-mono text-purple-300 uppercase tracking-wider">
                AUDITORÍA DE LAS 7 PREGUNTAS DEL ESCAPARATISMO
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
                {harmonyReport.escaparatismoChecklist.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-black/50 border border-purple-500/20 flex items-start gap-3"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-mono font-bold text-purple-300 block mb-1">
                        {item.question}
                      </span>
                      <p className="text-neutral-300 leading-relaxed">{item.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: THE 8 MASTER PRIORITIES (JERARQUÍA 0-7) ─── */}
        {activeTab === 'priorities' && (
          <div className="relative z-20 flex-1 overflow-y-auto p-6 sm:p-10 space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-bold font-mono text-white">
                JERARQUÍA MAESTRA DE DISEÑO E INGENIERÍA (LEYES 0 A 7)
              </h3>
              <p className="text-xs text-neutral-400 max-w-3xl leading-relaxed">
                Ninguna regla secundaria puede contradecir una ley superior. La identidad y la composición
                mandan sobre el material, la luz y los detalles de ingeniería.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MASTER_PRIORITIES.map((priority) => (
                <div
                  key={priority.level}
                  className="p-5 rounded-3xl bg-black/60 border border-purple-500/25 space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-purple-900/30">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                        {priority.number}
                      </span>
                      <span className="font-mono font-bold text-white text-sm">
                        {priority.title}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-purple-400">
                      {priority.level}
                    </span>
                  </div>

                  <p className="text-xs text-purple-200/90 font-mono">
                    {priority.summary}
                  </p>

                  <ul className="space-y-1.5 pt-1">
                    {priority.laws.map((law, lIdx) => (
                      <li key={lIdx} className="flex items-start gap-2 text-xs text-neutral-300">
                        <span className="w-1 h-1 rounded-full bg-purple-400 shrink-0 mt-2" />
                        <span>{law}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
