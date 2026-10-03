import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Github,
  ChevronRight,
  ChevronLeft,
  Terminal,
  Sparkles,
  Volume2,
  VolumeX,
  Layers,
  Disc,
  Sliders,
  Globe,
  ExternalLink,
  Stethoscope,
  ArrowUpRight,
} from 'lucide-react';
import { Repository, LightingMode, AppleCascadeMode } from '../types';
import { LiquidPolyFluidOrb } from './LiquidPolyFluidOrb';
import { SwipeUpGlassDrawer } from './SwipeUpGlassDrawer';
import { appleHaptics } from '../utils/appleHaptics';

interface Cascade3DStreamProps {
  repositories: Repository[];
  lightingMode: LightingMode;
  onLightingChange: (mode: LightingMode) => void;
  onInspectIcon: (repo: Repository) => void;
  onOpenRulesModal: () => void;
  onOpenCliBackend: () => void;
  onOpenLiquidLightArticle: (repo: Repository) => void;
  onOpenDoctorFix?: (repo?: Repository) => void;
  appleMode?: AppleCascadeMode;
  onAppleModeChange?: (mode: AppleCascadeMode) => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  targetRepoIndex?: number | null;
  onSelectRepoIndex?: (index: number) => void;
}

export const Cascade3DStream: React.FC<Cascade3DStreamProps> = ({
  repositories,
  lightingMode,
  onLightingChange,
  onInspectIcon,
  onOpenRulesModal,
  onOpenCliBackend,
  onOpenLiquidLightArticle,
  onOpenDoctorFix,
  appleMode: externalAppleMode,
  onAppleModeChange,
  soundEnabled: externalSoundEnabled,
  onToggleSound,
  targetRepoIndex,
  onSelectRepoIndex,
}) => {
  const total = repositories.length || 1;
  const defaultIndex = repositories.findIndex((r) => r.id === 'open-school');
  const initialIndex = defaultIndex !== -1 ? defaultIndex : 0;

  // Discrete active index for external states (drawer, dots)
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Internal Apple Cascade Mode with fallback
  const [localAppleMode, setLocalAppleMode] = useState<AppleCascadeMode>('wallet-stack');
  const activeAppleMode = externalAppleMode || localAppleMode;

  const setAppleMode = (mode: AppleCascadeMode) => {
    setLocalAppleMode(mode);
    onAppleModeChange?.(mode);
    appleHaptics.playCardFlip();
  };

  // Sound feedback state
  const [isSoundOn, setIsSoundOn] = useState<boolean>(true);
  const soundActive = externalSoundEnabled !== undefined ? externalSoundEnabled : isSoundOn;

  const toggleSound = () => {
    if (onToggleSound) {
      onToggleSound();
    } else {
      const next = appleHaptics.toggleMute();
      setIsSoundOn(next);
      if (next) appleHaptics.playSpringSnap();
    }
  };

  // Easter egg: high velocity spinning trigger
  const [isEasterEggActive, setIsEasterEggActive] = useState(false);
  const [easterEggOpacity, setEasterEggOpacity] = useState(0);

  // Physics state refs (60 FPS without React re-render cascades)
  const continuousIndexRef = useRef<number>(initialIndex);
  const velocityRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const lastDragCoordRef = useRef<number>(0);
  const lastDragTimeRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);
  const lastHapticIndexRef = useRef<number>(initialIndex);

  // Render state driven by the physics loop
  const [renderPosition, setRenderPosition] = useState<number>(initialIndex);
  const [floatingY, setFloatingY] = useState<number>(0);
  const [floatingRot, setFloatingRot] = useState<number>(0);

  // Tilt coordinates for mouse pointer (Apple interactive glass reflection)
  const [tilt, setTilt] = useState<{ x: number; y: number; sheenX: number; sheenY: number }>({
    x: 0,
    y: 0,
    sheenX: 50,
    sheenY: 50,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Synchronize targetRepoIndex if requested externally (e.g. from CLI `open <id>`)
  useEffect(() => {
    if (targetRepoIndex !== undefined && targetRepoIndex !== null && targetRepoIndex >= 0) {
      const current = continuousIndexRef.current;
      const currentMod = ((Math.round(current) % total) + total) % total;
      let diff = targetRepoIndex - currentMod;
      if (diff > total / 2) diff -= total;
      if (diff < -total / 2) diff += total;
      continuousIndexRef.current = Math.round(current) + diff;
      velocityRef.current = 0;
      appleHaptics.playSpringSnap();
    }
  }, [targetRepoIndex, total]);

  // Main continuous inertial physics & levitation loop
  useEffect(() => {
    let prevTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - prevTime) * 0.001, 0.1);
      prevTime = currentTime;
      timeRef.current += dt;

      // 1. Organic micro-floteo levitation (Apple living UI breath)
      const fY = Math.sin(timeRef.current * 1.8) * 5.0;
      const fRot = Math.sin(timeRef.current * 1.2) * 0.65;
      setFloatingY(fY);
      setFloatingRot(fRot);

      // 2. High-momentum inertial physics simulation
      if (!isDraggingRef.current) {
        // Integrate velocity with smooth Apple friction (0.942)
        continuousIndexRef.current += velocityRef.current;
        velocityRef.current *= 0.942;

        // Easter Egg detection: extreme rotational speed
        const speed = Math.abs(velocityRef.current);
        if (speed > 1.8) {
          setIsEasterEggActive(true);
          setEasterEggOpacity((prev) => Math.min(1, prev + 0.12));
        } else {
          setEasterEggOpacity((prev) => {
            const next = Math.max(0, prev - 0.035);
            if (next <= 0.01) setIsEasterEggActive(false);
            return next;
          });
        }

        // Apple Critically Damped Spring: when velocity slows down, snap with fluid ease
        if (speed < 0.024) {
          velocityRef.current = 0;
          const nearest = Math.round(continuousIndexRef.current);
          const snapDiff = nearest - continuousIndexRef.current;
          continuousIndexRef.current += snapDiff * 0.14; // Fluid Apple spring snap
        }
      }

      // 3. Apple Haptic Crown Click when crossing integer boundaries
      const currentInt = Math.round(continuousIndexRef.current);
      if (currentInt !== lastHapticIndexRef.current) {
        lastHapticIndexRef.current = currentInt;
        appleHaptics.playCrownTick(Math.min(2.0, Math.max(0.6, Math.abs(velocityRef.current) * 1.2)));
      }

      // Update state for render transform
      setRenderPosition(continuousIndexRef.current);

      // Update active discrete repository index
      const normalizedActive = ((Math.round(continuousIndexRef.current) % total) + total) % total;
      setActiveIndex(normalizedActive);
      onSelectRepoIndex?.(normalizedActive);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [total, onSelectRepoIndex]);

  // Wheel listener: Apple fluid momentum impulse
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    const delta = activeAppleMode === 'cover-flow' ? e.deltaX || e.deltaY : e.deltaY;
    const impulse = delta * 0.0035;
    velocityRef.current += impulse;
    velocityRef.current = Math.max(-4.5, Math.min(4.5, velocityRef.current));
  }, [activeAppleMode]);

  // Pointer drag interactions (supports both vertical and horizontal depending on Apple mode)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, a, input')) return;
    isDraggingRef.current = true;
    lastDragCoordRef.current = activeAppleMode === 'cover-flow' ? e.clientX : e.clientY;
    lastDragTimeRef.current = performance.now();
    velocityRef.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const currentCoord = activeAppleMode === 'cover-flow' ? e.clientX : e.clientY;
    const delta = lastDragCoordRef.current - currentCoord;
    const now = performance.now();
    const dt = Math.max(now - lastDragTimeRef.current, 1);

    // Track fling velocity
    velocityRef.current = (delta / dt) * 0.045;

    // Directly update position while dragging
    continuousIndexRef.current += delta * 0.0038;

    lastDragCoordRef.current = currentCoord;
    lastDragTimeRef.current = now;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  // Micro-tilt pointer tracking over active card
  const handleMouseMoveTilt = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({
      x: (px - 0.5) * 12,
      y: -(py - 0.5) * 12,
      sheenX: px * 100,
      sheenY: py * 100,
    });
  };

  const handleMouseLeaveTilt = () => {
    setTilt({ x: 0, y: 0, sheenX: 50, sheenY: 50 });
  };

  // Direct programmatic navigation
  const goToNext = () => {
    velocityRef.current += 0.85;
    appleHaptics.playCrownTick(1.2);
  };

  const goToPrev = () => {
    velocityRef.current -= 0.85;
    appleHaptics.playCrownTick(1.2);
  };

  const goToIndex = (idx: number) => {
    const current = continuousIndexRef.current;
    const currentMod = ((Math.round(current) % total) + total) % total;
    let diff = idx - currentMod;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    continuousIndexRef.current = Math.round(current) + diff;
    velocityRef.current = 0;
    appleHaptics.playSpringSnap();
  };

  // Layer offsets calculation
  const baseInteger = Math.round(renderPosition);
  const fractionalOffset = renderPosition - baseInteger;

  // We render 7 cascade levels for true depth
  const LAYER_OFFSETS = [-3, -2, -1, 0, 1, 2, 3];
  const activeRepo = repositories[activeIndex] || repositories[0];

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseMove={handleMouseMoveTilt}
      onMouseLeave={handleMouseLeaveTilt}
      className="relative w-full h-full flex flex-col justify-between overflow-hidden select-none bg-[#050505] text-white"
      style={{
        touchAction: 'none',
      }}
    >
      {/* ─── 1. ULTRA-MINIMAL TOP GLASS HUD WITH APPLE MODE SWITCHER ─── */}
      <header className="relative z-30 px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: activeRepo.liquidLight.hex }}
            />
            <span className="text-xs font-mono tracking-widest text-neutral-300 uppercase">
              {activeRepo.name}
            </span>
          </div>

          <span className="hidden sm:inline-block text-[11px] font-mono text-neutral-500">
            {String(activeIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
        </div>

        {/* Apple Cascade Mode Selector (Wallet Stack, Cover Flow, Crown Cylinder) */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/[0.03] border border-white/[0.07] backdrop-blur-2xl">
          <button
            onClick={() => setAppleMode('wallet-stack')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono transition-all cursor-pointer ${
              activeAppleMode === 'wallet-stack'
                ? 'bg-white/15 text-white font-medium shadow-[0_2px_10px_rgba(255,255,255,0.1)]'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Apple Wallet Stack (Cascada de Profundidad Parabólica)"
          >
            <Layers className="w-3 h-3 text-purple-400" />
            <span className="hidden md:inline">Wallet Stack</span>
          </button>

          <button
            onClick={() => setAppleMode('cover-flow')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono transition-all cursor-pointer ${
              activeAppleMode === 'cover-flow'
                ? 'bg-white/15 text-white font-medium shadow-[0_2px_10px_rgba(255,255,255,0.1)]'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="Apple Cover Flow (Flujo Horizontal con Reflejo Especular)"
          >
            <Disc className="w-3 h-3 text-cyan-400" />
            <span className="hidden md:inline">Cover Flow</span>
          </button>

          <button
            onClick={() => setAppleMode('cylinder-crown')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono transition-all cursor-pointer ${
              activeAppleMode === 'cylinder-crown'
                ? 'bg-white/15 text-white font-medium shadow-[0_2px_10px_rgba(255,255,255,0.1)]'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
            title="watchOS Crown Cylinder (Curvatura Cilíndrica 3D)"
          >
            <Sliders className="w-3 h-3 text-amber-400" />
            <span className="hidden md:inline">Crown 3D</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Apple Tactile Haptic Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`p-2 rounded-full border transition-all cursor-pointer ${
              soundActive
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20'
                : 'bg-white/[0.04] border-white/[0.08] text-neutral-500 hover:text-neutral-300'
            }`}
            title={soundActive ? 'Sonido Háptico Apple Activo' : 'Sonido Silenciado'}
          >
            {soundActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Doctor Fix Agent Trigger */}
          {onOpenDoctorFix && (
            <button
              onClick={() => onOpenDoctorFix(activeRepo)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-xs font-mono text-purple-300 hover:text-white transition-all cursor-pointer shadow-[0_0_12px_rgba(168,85,247,0.2)]"
              title="Doctor Fix: Diagnóstico, Despliegue de Webs y Blindaje en GitHub"
            >
              <Stethoscope className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Dr. Fix</span>
            </button>
          )}

          {/* CLI Backend Trigger */}
          <button
            onClick={onOpenCliBackend}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-neutral-300 hover:text-white transition-all cursor-pointer"
            title="Terminal CLI Backend (Todos los Comandos)"
          >
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">CLI</span>
          </button>

          {/* Rules Matrix */}
          <button
            onClick={onOpenRulesModal}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-neutral-400 hover:text-white transition-all cursor-pointer"
            title="Matriz de Diseño y Reglas"
          >
            <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Reglas</span>
          </button>
        </div>
      </header>

      {/* ─── 2. THE EASTER EGG: CINEMATIC "BELENTANI" RED NEON WATERMARK ─── */}
      <div
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center z-10 transition-opacity duration-500"
        style={{
          opacity: easterEggOpacity,
        }}
      >
        <div className="font-mono text-4xl sm:text-6xl md:text-7xl font-extralight tracking-[0.42em] text-[#ff0033] drop-shadow-[0_0_35px_rgba(255,0,51,0.65)] select-none uppercase">
          BELENTANI
        </div>
        <div className="mt-2 text-[11px] font-mono tracking-widest text-red-400/80 uppercase">
          ⚡ Apple High Momentum Loop · 3% Lux Photonic
        </div>
      </div>

      {/* ─── 3. 3D MULTI-LAYER INERTIAL CASCADE STAGE (3 APPLE TRANSITION MODES) ─── */}
      <main className="relative z-20 flex-1 flex items-center justify-center perspective-[1400px] overflow-visible px-4">
        <div
          className="relative w-full max-w-[620px] h-[300px] flex items-center justify-center"
          style={{
            transformStyle: 'preserve-3d',
          }}
        >
          {LAYER_OFFSETS.map((offset) => {
            const repoIndexRaw = baseInteger + offset;
            const repoIndex = ((repoIndexRaw % total) + total) % total;
            const repo = repositories[repoIndex];
            if (!repo) return null;

            // Continuous distance from center line
            const dist = offset - fractionalOffset;
            const isCenter = Math.abs(dist) < 0.5;

            // Spatial geometry for the 3 Apple modes:
            let translateX = 0;
            let translateY = 0;
            let translateZ = 0;
            let rotateX = 0;
            let rotateY = 0;
            let scale = 1;
            let opacity = 1;
            let blurAmount = 0;

            if (activeAppleMode === 'cover-flow') {
              // ── Apple Cover Flow (Horizontal 3D flip with reflections) ──
              if (isCenter) {
                translateX = dist * 220;
                translateZ = 90 - Math.abs(dist) * 90;
                rotateY = -dist * 45 + tilt.x * 0.45;
                rotateX = tilt.y * 0.45;
                scale = 1;
                opacity = 1;
                blurAmount = 0;
              } else {
                const sign = Math.sign(dist);
                translateX = dist * 165 + sign * 145;
                translateZ = -140 - Math.abs(dist) * 35;
                rotateY = -sign * 54;
                scale = Math.max(0.70, 0.88 - Math.abs(dist) * 0.05);
                opacity = Math.max(0, 1 - (Math.abs(dist) - 0.4) * 0.28);
                blurAmount = Math.max(0, (Math.abs(dist) - 0.4) * 1.5);
              }
            } else if (activeAppleMode === 'cylinder-crown') {
              // ── watchOS Crown Cylinder (Cylindrical 3D drum rolling) ──
              const angleDeg = dist * 22;
              const angleRad = (angleDeg * Math.PI) / 180;
              const cylinderRadius = 380;
              translateY = Math.sin(angleRad) * cylinderRadius + (isCenter ? floatingY : 0);
              translateZ = (Math.cos(angleRad) - 1) * cylinderRadius;
              rotateX = -angleDeg + (isCenter ? floatingRot + tilt.y * 0.4 : 0);
              rotateY = isCenter ? tilt.x * 0.4 : 0;
              scale = Math.max(0.72, 1 - Math.abs(dist) * 0.07);
              opacity = Math.max(0, 1 - Math.abs(dist) * 0.26);
              blurAmount = Math.abs(dist) * 1.6;
            } else {
              // ── Apple Wallet Stack (Parabolic fluid cascade) ──
              if (dist >= 0) {
                // Stack receding upward/inward
                translateY = dist * 58 + (isCenter ? floatingY : 0);
                translateZ = -dist * 115;
                rotateX = -dist * 14 + (isCenter ? floatingRot + tilt.y * 0.5 : 0);
                rotateY = isCenter ? tilt.x * 0.5 : 0;
                scale = Math.max(0.72, 1 - dist * 0.08);
                opacity = Math.max(0, 1 - dist * 0.27);
                blurAmount = dist * 1.7;
              } else {
                // Forward card dropping down during scroll ejection
                translateY = dist * 75 + (isCenter ? floatingY : 0);
                translateZ = Math.abs(dist) * 45;
                rotateX = -dist * 20 + (isCenter ? floatingRot + tilt.y * 0.5 : 0);
                rotateY = isCenter ? tilt.x * 0.5 : 0;
                scale = Math.max(0.75, 1 - Math.abs(dist) * 0.12);
                opacity = Math.max(0, 1 - Math.abs(dist) * 0.42);
                blurAmount = Math.abs(dist) * 2.0;
              }
            }

            const zIndex = 100 - Math.round(Math.abs(dist) * 15);

            // Active Front Card
            if (isCenter) {
              return (
                <div
                  key={`layer-${repo.id}-${offset}`}
                  className="absolute w-full max-w-[590px] h-[280px] sm:h-[300px] rounded-[30px] p-6 sm:p-7 flex flex-col justify-between transition-shadow duration-300 select-none overflow-hidden"
                  style={{
                    transform: `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`,
                    opacity: opacity,
                    zIndex: zIndex,
                    backgroundColor: 'rgba(9, 9, 11, 0.84)',
                    backdropFilter: 'blur(36px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(36px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    boxShadow: `0 25px 60px rgba(0, 0, 0, 0.95), 0 0 35px ${repo.liquidLight.hex}22, inset 0 1.5px 1.5px rgba(255, 255, 255, 0.28)`,
                    cursor: 'grab',
                  }}
                >
                  {/* Subtle Brewster Specular Glint */}
                  <div
                    className="absolute inset-0 pointer-events-none rounded-[inherit]"
                    style={{
                      background: `radial-gradient(circle at ${tilt.sheenX}% ${tilt.sheenY}%, rgba(255, 255, 255, 0.14) 0%, transparent 60%)`,
                    }}
                  />

                  {/* Top Bar: Language, Category, Status */}
                  <div className="relative z-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: repo.languageColor || '#fff' }}
                      />
                      <span>{repo.primaryLanguage}</span>
                      <span className="text-neutral-600">·</span>
                      <span className="text-neutral-500">{repo.isPublic ? 'Público' : 'Privado'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {repo.isEducation && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/10 border border-purple-500/20 text-purple-300">
                          Educación
                        </span>
                      )}
                      <span className="text-xs font-mono text-neutral-500">
                        #{repo.priorityOrder}
                      </span>
                    </div>
                  </div>

                  {/* Center Content: Clean, High-Contrast Cinematic Layout */}
                  <div className="relative z-20 flex items-center justify-between gap-4 my-auto">
                    <div className="text-left max-w-[340px] sm:max-w-[380px] space-y-2">
                      <h1 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
                        {repo.name}
                      </h1>
                      <p className="text-neutral-400 text-xs sm:text-sm font-normal leading-relaxed line-clamp-2">
                        {repo.tagline || repo.description}
                      </p>
                    </div>

                    {/* Integrated 4K WebGL Fluid Orb */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onInspectIcon(repo);
                      }}
                      className="cursor-pointer hover:scale-105 transition-transform duration-300"
                      title="Inspeccionar Luz Líquida"
                    >
                      <LiquidPolyFluidOrb
                        repoId={repo.id}
                        colorHex={repo.liquidLight.hex}
                        size="sm"
                        interactive={true}
                      />
                    </div>
                  </div>

                  {/* Bottom Actions: Web en Vivo, Doctor Fix, GitHub, Detalles */}
                  <div className="relative z-20 flex items-center justify-between pt-3 border-t border-white/[0.07] gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <a
                        href={repo.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
                        title="Ver Repositorio en GitHub"
                      >
                        <Github className="w-3.5 h-3.5" />
                        <span>belentani7</span>
                      </a>

                      {repo.liveUrl && (
                        <a
                          href={repo.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] font-medium"
                          title={`Abrir Web Desplegada en Vivo: ${repo.liveUrl}`}
                        >
                          <Globe className="w-3 h-3 text-emerald-400 animate-pulse" />
                          <span>Web Viva</span>
                          <ArrowUpRight className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {onOpenDoctorFix && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDoctorFix(repo);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-900/30 hover:bg-purple-900/60 border border-purple-400/30 text-[11px] text-purple-200 hover:text-white transition-all cursor-pointer"
                          title="Diagnosticar y Reparar con Doctor Fix"
                        >
                          <Stethoscope className="w-3 h-3 text-purple-400" />
                          <span>Dr. Fix</span>
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenLiquidLightArticle(repo);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.09] text-[11px] text-neutral-400 hover:text-neutral-200 transition-all cursor-pointer"
                        title="Ver Artículo Científico de Luz Líquida"
                      >
                        <span>Artículo</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsDrawerOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.15] text-xs text-neutral-200 hover:text-white transition-all cursor-pointer"
                      >
                        <span>Detalles</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            // Distant cascading cards (multi-layer upper and lower deck)
            return (
              <div
                key={`layer-${repo.id}-${offset}`}
                onClick={() => goToIndex(repoIndex)}
                className="absolute w-full max-w-[590px] h-[280px] sm:h-[300px] rounded-[30px] p-6 flex flex-col justify-between cursor-pointer transition-all duration-300 overflow-hidden"
                style={{
                  transform: `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`,
                  opacity: opacity,
                  filter: `blur(${blurAmount}px)`,
                  zIndex: zIndex,
                  backgroundColor: 'rgba(7, 7, 9, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}
              >
                <div className="flex items-center justify-between text-xs text-neutral-500 font-mono">
                  <span>{repo.primaryLanguage}</span>
                  <span>#{repo.priorityOrder}</span>
                </div>
                <div className="my-auto">
                  <h3 className="text-xl sm:text-2xl font-light text-neutral-300">
                    {repo.name}
                  </h3>
                  <p className="text-neutral-500 text-xs line-clamp-1 mt-1 font-mono">
                    {repo.singleWord} · {repo.liquidLight.colorName}
                  </p>
                </div>
                <div className="h-4 border-t border-white/[0.04]" />
              </div>
            );
          })}
        </div>
      </main>

      {/* ─── 4. ULTRA-MINIMAL BASIC GLASS FOOTER / PAGINATION ─── */}
      <footer className="relative z-30 px-6 sm:px-10 py-5 flex items-center justify-center pointer-events-auto">
        <div className="flex items-center gap-4 sm:gap-5 px-5 py-2 rounded-full bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl">
          <button
            onClick={goToPrev}
            className="p-1 text-neutral-500 hover:text-white transition-colors cursor-pointer"
            title="Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5">
            {repositories.map((repo, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={repo.id}
                  onClick={() => goToIndex(idx)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    isActive
                      ? 'w-6 h-1.5 bg-white'
                      : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
                  }`}
                  style={{
                    backgroundColor: isActive ? repo.liquidLight.hex : undefined,
                  }}
                  title={repo.name}
                />
              );
            })}
          </div>

          <button
            onClick={goToNext}
            className="p-1 text-neutral-500 hover:text-white transition-colors cursor-pointer"
            title="Siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* ─── 5. SWIPE-UP SUSPENDED GLASS DRAWER ─── */}
      <SwipeUpGlassDrawer
        repo={activeRepo}
        isOpen={isDrawerOpen}
        onToggle={() => setIsDrawerOpen((prev) => !prev)}
        onClose={() => setIsDrawerOpen(false)}
        onInspectIcon={onInspectIcon}
        onOpenArticle={onOpenLiquidLightArticle}
      />
    </div>
  );
};
