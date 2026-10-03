import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';

interface RepoIconProps {
  glyphType: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'cinema';
  isEducation?: boolean;
  accentColor?: string;
  haloColor?: string;
  puffGlow?: string;
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
}

export const RepoIcon: React.FC<RepoIconProps> = ({
  glyphType,
  name,
  size = 'md',
  isEducation = false,
  accentColor = '#c084fc',
  haloColor = 'rgba(192, 132, 252, 0.45)',
  puffGlow = 'rgba(168, 85, 247, 0.3)',
  interactive = true,
  onClick,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mouseCoord, setMouseCoord] = useState({ x: 50, y: 50 });
  const cardRef = useRef<HTMLDivElement | null>(null);

  const sizeClasses = {
    sm: 'w-10 h-10 rounded-xl',
    md: 'w-16 h-16 rounded-2xl',
    lg: 'w-24 h-24 rounded-3xl',
    xl: 'w-44 h-44 sm:w-56 sm:h-56 rounded-[36px]',
    cinema: 'w-64 h-64 sm:w-80 sm:h-80 md:w-[380px] md:h-[380px] rounded-[48px]',
  };

  const iconSvgSizes = {
    sm: 'w-6 h-6',
    md: 'w-9 h-9',
    lg: 'w-14 h-14',
    xl: 'w-28 h-28 sm:w-36 sm:h-36',
    cinema: 'w-40 h-40 sm:w-52 sm:h-52 md:w-64 md:h-64',
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setMouseCoord({ x, y });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!interactive || !cardRef.current || e.touches.length === 0) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.touches[0].clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.touches[0].clientY - rect.top) / rect.height) * 100));
    setMouseCoord({ x, y });
  };

  // Render the distinctive procedural vector glyph
  const renderGlyph = () => {
    switch (glyphType) {
      // 1. OPEN-SCHOOL (Education Priority 1)
      case 'open-school-portal':
        return (
          <svg viewBox="0 0 100 100" className={`${iconSvgSizes[size]} transition-transform duration-700`}>
            <defs>
              <linearGradient id="grad-portal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f3e8ff" />
                <stop offset="50%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#7e22ce" />
              </linearGradient>
              <filter id="glow-portal" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {/* Outer Concentric Gateway */}
            <circle cx="50" cy="50" r="38" fill="none" stroke="url(#grad-portal)" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.6" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="#a855f7" strokeWidth="1.5" opacity="0.8" />
            {/* Modular Archway / Knowledge Steps */}
            <path d="M 32 68 L 32 44 Q 50 22 68 44 L 68 68" fill="none" stroke="url(#grad-portal)" strokeWidth="2.2" strokeLinecap="round" filter="url(#glow-portal)" />
            {/* WCAG Accessible Core & Graduation Diamond */}
            <polygon points="50,26 62,38 50,50 38,38" fill="rgba(192, 132, 252, 0.2)" stroke="#e9d5ff" strokeWidth="1.6" />
            <circle cx="50" cy="38" r="3" fill="#ffffff" filter="url(#glow-portal)" />
            {/* Offline-First Modular Base Pillars */}
            <line x1="28" y1="72" x2="72" y2="72" stroke="url(#grad-portal)" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="36" y1="78" x2="64" y2="78" stroke="#a855f7" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
            {/* Radiating Rays */}
            <line x1="50" y1="12" x2="50" y2="18" stroke="#e9d5ff" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="24" y1="26" x2="28" y2="30" stroke="#c084fc" strokeWidth="1.2" />
            <line x1="76" y1="26" x2="72" y2="30" stroke="#c084fc" strokeWidth="1.2" />
          </svg>
        );

      // 2. UX-ACADEMY-PROFESSIONAL-PROGRAM (Education Priority 2)
      case 'ux-caliper-matrix':
        return (
          <svg viewBox="0 0 100 100" className={`${iconSvgSizes[size]} transition-transform duration-700`}>
            <defs>
              <linearGradient id="grad-caliper" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#581c87" />
              </linearGradient>
            </defs>
            {/* Golden Ratio Viewport Frame */}
            <rect x="22" y="24" width="56" height="52" rx="6" fill="rgba(168, 85, 247, 0.08)" stroke="#a855f7" strokeWidth="1.4" strokeDasharray="6 2" />
            {/* Golden Ratio Spiral / Curve Arc */}
            <path d="M 28 68 A 44 44 0 0 1 72 24" fill="none" stroke="url(#grad-caliper)" strokeWidth="2" strokeLinecap="round" />
            {/* Precision Caliper Blades */}
            <path d="M 28 32 L 42 50 L 28 64" fill="none" stroke="#e9d5ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 72 32 L 58 50 L 72 64" fill="none" stroke="#e9d5ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            {/* Center Measurement Node (Trilingual Axis ES-CAT-EN) */}
            <circle cx="50" cy="50" r="5" fill="#a855f7" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="1.5" fill="#ffffff" />
            {/* Precision Metric Ticks */}
            <line x1="50" y1="20" x2="50" y2="28" stroke="#c084fc" strokeWidth="1.5" />
            <line x1="50" y1="72" x2="50" y2="80" stroke="#c084fc" strokeWidth="1.5" />
            <line x1="18" y1="50" x2="26" y2="50" stroke="#c084fc" strokeWidth="1.5" />
            <line x1="74" y1="50" x2="82" y2="50" stroke="#c084fc" strokeWidth="1.5" />
          </svg>
        );

      // 3. MANOS ABIERTAS (Education Priority 3)
      case 'hands-open-shield':
        return (
          <svg viewBox="0 0 100 100" className={`${iconSvgSizes[size]} transition-transform duration-700`}>
            <defs>
              <linearGradient id="grad-hands" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fdf4ff" />
                <stop offset="60%" stopColor="#d946ef" />
                <stop offset="100%" stopColor="#701a75" />
              </linearGradient>
            </defs>
            {/* Humanitarian Aegis Shield */}
            <path d="M 50 14 Q 74 20 74 46 Q 74 72 50 86 Q 26 72 26 46 Q 26 20 50 14 Z" fill="rgba(217, 70, 239, 0.1)" stroke="#d946ef" strokeWidth="1.4" />
            {/* Stylized Open Benevolent Hands */}
            <path d="M 32 58 Q 38 70 50 72 Q 62 70 68 58 Q 62 48 50 56 Q 38 48 32 58 Z" fill="rgba(244, 114, 182, 0.2)" stroke="url(#grad-hands)" strokeWidth="1.8" />
            <path d="M 34 50 Q 42 38 50 46 Q 58 38 66 50" fill="none" stroke="#fdf4ff" strokeWidth="1.6" strokeLinecap="round" />
            {/* Digital Empowerment Spark / CV Quill Crest */}
            <circle cx="50" cy="34" r="5" fill="#fdf4ff" />
            <line x1="50" y1="22" x2="50" y2="28" stroke="#fdf4ff" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="50" cy="54" r="2" fill="#d946ef" />
          </svg>
        );

      // 4. LINGUAFORGE (Education Priority 4)
      case 'lingua-acoustic-forge':
        return (
          <svg viewBox="0 0 100 100" className={`${iconSvgSizes[size]} transition-transform duration-700`}>
            <defs>
              <linearGradient id="grad-forge" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#581c87" />
              </linearGradient>
            </defs>
            {/* Forge Anvil Base Shape */}
            <path d="M 24 64 L 76 64 L 66 76 L 34 76 Z" fill="rgba(192, 132, 252, 0.15)" stroke="#c084fc" strokeWidth="1.6" />
            {/* Acoustic Polyglot Waveforms */}
            <path d="M 22 46 Q 32 30 42 46 T 62 46 T 78 46" fill="none" stroke="url(#grad-forge)" strokeWidth="2.2" strokeLinecap="round" />
            <path d="M 26 52 Q 36 40 46 52 T 66 52 T 74 52" fill="none" stroke="#a855f7" strokeWidth="1.4" opacity="0.7" />
            {/* Harmonic Hammer & Translation Beam */}
            <polygon points="50,18 58,30 42,30" fill="url(#grad-forge)" stroke="#ffffff" strokeWidth="1.2" />
            <line x1="50" y1="30" x2="50" y2="40" stroke="#f3e8ff" strokeWidth="1.8" />
            <circle cx="50" cy="46" r="3.5" fill="#ffffff" />
          </svg>
        );

      // 5. LOCAL-AGENT (Education Priority 5)
      case 'local-silicon-monolith':
        return (
          <svg viewBox="0 0 100 100" className={`${iconSvgSizes[size]} transition-transform duration-700`}>
            <defs>
              <linearGradient id="grad-silicon" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#3b0764" />
              </linearGradient>
            </defs>
            {/* Hexagonal Processor Die */}
            <polygon points="50,18 78,34 78,66 50,82 22,66 22,34" fill="rgba(168, 85, 247, 0.1)" stroke="url(#grad-silicon)" strokeWidth="1.8" />
            {/* Local Circuit Buses */}
            <rect x="36" y="36" width="28" height="28" rx="4" fill="rgba(192, 132, 252, 0.2)" stroke="#e9d5ff" strokeWidth="1.5" />
            {/* Terminal Chevron Prompt */}
            <path d="M 44 45 L 49 50 L 44 55" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="53" y1="55" x2="57" y2="55" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" />
            {/* Air-gapped Offline Pins */}
            <circle cx="50" cy="24" r="2" fill="#c084fc" />
            <circle cx="72" cy="50" r="2" fill="#c084fc" />
            <circle cx="50" cy="76" r="2" fill="#c084fc" />
            <circle cx="28" cy="50" r="2" fill="#c084fc" />
          </svg>
        );

      // 6. VOICE CLONE LAB (Education Priority 6)
      case 'vocal-formant-prism':
        return (
          <svg viewBox="0 0 100 100" className={`${iconSvgSizes[size]} transition-transform duration-700`}>
            <defs>
              <linearGradient id="grad-vocal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fdf4ff" />
                <stop offset="50%" stopColor="#e879f9" />
                <stop offset="100%" stopColor="#86198f" />
              </linearGradient>
            </defs>
            {/* Vocal Chord Diamond / Rhombus */}
            <polygon points="50,16 80,50 50,84 20,50" fill="rgba(232, 121, 249, 0.1)" stroke="url(#grad-vocal)" strokeWidth="1.8" />
            {/* 47-Stems Audio Spectrum Ribbons */}
            <line x1="32" y1="50" x2="68" y2="50" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            <line x1="36" y1="42" x2="64" y2="42" stroke="#e879f9" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="36" y1="58" x2="64" y2="58" stroke="#e879f9" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="42" y1="34" x2="58" y2="34" stroke="#c084fc" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="42" y1="66" x2="58" y2="66" stroke="#c084fc" strokeWidth="1.2" strokeLinecap="round" />
            {/* Central Formant Resonance Core */}
            <circle cx="50" cy="50" r="4.5" fill="#fdf4ff" />
          </svg>
        );

      // 7. CRUZANDO EL CHARCO (Public Sanctuary)
      case 'sanctuary-beacon-compass':
        return (
          <svg viewBox="0 0 100 100" className={`${iconSvgSizes[size]} transition-transform duration-700`}>
            <defs>
              <linearGradient id="grad-sanctuary" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
            {/* Safe Harbor Outer Ring */}
            <circle cx="50" cy="50" r="34" fill="none" stroke="url(#grad-sanctuary)" strokeWidth="1.5" strokeDasharray="4 2" />
            {/* Transatlantic Wave Arc */}
            <path d="M 22 66 Q 36 54 50 66 T 78 66" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
            {/* L'Hospitalet / Barcelona Sanctuary Beacon Compass */}
            <polygon points="50,20 56,44 50,50 44,44" fill="#f472b6" stroke="#ffffff" strokeWidth="1" />
            <polygon points="50,80 56,56 50,50 44,56" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
            {/* Radial Inclusion Star */}
            <circle cx="50" cy="50" r="3" fill="#ffffff" />
            <line x1="28" y1="50" x2="72" y2="50" stroke="#f472b6" strokeWidth="1.2" strokeDasharray="1 3" />
          </svg>
        );

      // 8. PVC-U-CORE (Public Enterprise Governance)
      case 'governance-cipher-kernel':
        return (
          <svg viewBox="0 0 100 100" className={`${iconSvgSizes[size]} transition-transform duration-700`}>
            <defs>
              <linearGradient id="grad-gov" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#9333ea" />
                <stop offset="100%" stopColor="#4c1d95" />
              </linearGradient>
            </defs>
            {/* Cryptographic Compliance Outer Ring */}
            <circle cx="50" cy="50" r="35" fill="rgba(147, 51, 234, 0.12)" stroke="url(#grad-gov)" strokeWidth="1.8" />
            {/* HIPAA / GDPR Triple Verification Nodes */}
            <circle cx="50" cy="18" r="4" fill="#c084fc" stroke="#ffffff" strokeWidth="1" />
            <circle cx="78" cy="66" r="4" fill="#c084fc" stroke="#ffffff" strokeWidth="1" />
            <circle cx="22" cy="66" r="4" fill="#c084fc" stroke="#ffffff" strokeWidth="1" />
            {/* Inner Cryptographic Invariant Keyhole / Seal */}
            <polygon points="50,30 68,62 32,62" fill="none" stroke="#e9d5ff" strokeWidth="1.8" />
            <circle cx="50" cy="50" r="6" fill="#ffffff" />
            <line x1="50" y1="50" x2="50" y2="58" stroke="#4c1d95" strokeWidth="2" />
          </svg>
        );

      // 9. DUCK ECOSYSTEM (Public Creative Audio)
      case 'cyber-duck-synth':
        return (
          <svg viewBox="0 0 100 100" className={`${iconSvgSizes[size]} transition-transform duration-700`}>
            <defs>
              <linearGradient id="grad-duck" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#581c87" />
              </linearGradient>
            </defs>
            {/* Angular Cybernetic Duck Head Geometry */}
            <path d="M 30 62 L 30 38 Q 42 22 58 24 L 78 36 L 56 46 L 54 62 Z" fill="rgba(168, 85, 247, 0.18)" stroke="url(#grad-duck)" strokeWidth="2" strokeLinejoin="round" />
            {/* Synth Emitter Beak Wave */}
            <path d="M 58 36 L 82 40 L 58 46" fill="rgba(244, 114, 182, 0.25)" stroke="#f472b6" strokeWidth="1.8" />
            {/* Futuristic Studio Cybernetic Eye */}
            <circle cx="46" cy="34" r="3.5" fill="#ffffff" />
            {/* Equalizer Frequency Grid on Neck */}
            <line x1="36" y1="52" x2="48" y2="52" stroke="#c084fc" strokeWidth="1.6" />
            <line x1="36" y1="57" x2="44" y2="57" stroke="#c084fc" strokeWidth="1.6" />
            <line x1="36" y1="62" x2="50" y2="62" stroke="#c084fc" strokeWidth="1.6" />
          </svg>
        );

      // 10. META-SKILL (Public AI Routing)
      case 'neural-router-singularity':
        return (
          <svg viewBox="0 0 100 100" className={`${iconSvgSizes[size]} transition-transform duration-700`}>
            <defs>
              <linearGradient id="grad-router" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#7e22ce" />
              </linearGradient>
            </defs>
            {/* Multi-directional Routing Octahedron */}
            <polygon points="50,16 76,40 50,50 24,40" fill="rgba(192, 132, 252, 0.25)" stroke="url(#grad-router)" strokeWidth="1.6" />
            <polygon points="50,84 76,60 50,50 24,60" fill="rgba(168, 85, 247, 0.15)" stroke="url(#grad-router)" strokeWidth="1.6" />
            {/* Zero-Token Conduits */}
            <line x1="50" y1="16" x2="50" y2="84" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            <line x1="16" y1="50" x2="84" y2="50" stroke="url(#grad-router)" strokeWidth="1.8" strokeLinecap="round" />
            {/* 16-Archetype Peripheral Node Crystals */}
            <circle cx="50" cy="50" r="6" fill="#ffffff" />
            <circle cx="50" cy="50" r="2.5" fill="#581c87" />
            <circle cx="24" cy="40" r="2.5" fill="#e9d5ff" />
            <circle cx="76" cy="40" r="2.5" fill="#e9d5ff" />
            <circle cx="24" cy="60" r="2.5" fill="#e9d5ff" />
            <circle cx="76" cy="60" r="2.5" fill="#e9d5ff" />
          </svg>
        );

      // 11. BELENTANI / NOIACORE LAB (Flagship Singular Core)
      case 'neural-core-singularity':
        return (
          <svg viewBox="0 0 100 100" className={`${iconSvgSizes[size]} transition-transform duration-700`}>
            <defs>
              <radialGradient id="grad-singularity" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#c084fc" />
                <stop offset="80%" stopColor="#7e22ce" />
                <stop offset="100%" stopColor="#020104" />
              </radialGradient>
            </defs>
            {/* Deep HBO Max Noir Outer Rings */}
            <circle cx="50" cy="50" r="37" fill="none" stroke="#e9d5ff" strokeWidth="1.2" strokeDasharray="6 3" opacity="0.6" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="#a855f7" strokeWidth="1.8" />
            {/* Faceted Obsidian Core */}
            <polygon points="50,22 72,36 72,64 50,78 28,64 28,36" fill="url(#grad-singularity)" stroke="#ffffff" strokeWidth="1.8" />
            {/* High-frequency Singularity Pulse */}
            <circle cx="50" cy="50" r="7" fill="#ffffff" />
            <circle cx="50" cy="50" r="3" fill="#3b0764" />
          </svg>
        );

      // 12. CARQUIDEC (Public Architecture)
      case 'bioclimatic-voronoi-lattice':
        return (
          <svg viewBox="0 0 100 100" className={`${iconSvgSizes[size]} transition-transform duration-700`}>
            <defs>
              <linearGradient id="grad-voronoi" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#d8b4fe" />
                <stop offset="100%" stopColor="#6b21a8" />
              </linearGradient>
            </defs>
            {/* Voronoi Parametric Tessellation */}
            <path d="M 50 18 L 68 28 L 62 50 L 50 44 Z" fill="rgba(216, 180, 254, 0.2)" stroke="url(#grad-voronoi)" strokeWidth="1.6" />
            <path d="M 50 18 L 32 28 L 38 50 L 50 44 Z" fill="rgba(192, 132, 252, 0.15)" stroke="url(#grad-voronoi)" strokeWidth="1.6" />
            <path d="M 62 50 L 74 68 L 50 78 L 50 44 Z" fill="rgba(168, 85, 247, 0.25)" stroke="url(#grad-voronoi)" strokeWidth="1.6" />
            <path d="M 38 50 L 26 68 L 50 78 L 50 44 Z" fill="rgba(147, 51, 234, 0.2)" stroke="url(#grad-voronoi)" strokeWidth="1.6" />
            {/* Bioclimatic Solar Incidence Ray */}
            <circle cx="50" cy="44" r="3.5" fill="#ffffff" />
            <line x1="18" y1="18" x2="36" y2="34" stroke="#fef08a" strokeWidth="1.5" strokeDasharray="2 2" />
          </svg>
        );

      // 13. BELENTANI OMEGA (Public Creative Ecosystem)
      case 'omega-harmonic-glyph':
        return (
          <svg viewBox="0 0 100 100" className={`${iconSvgSizes[size]} transition-transform duration-700`}>
            <defs>
              <linearGradient id="grad-omega" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#7e22ce" />
              </linearGradient>
            </defs>
            {/* Greek Omega Symbol sculpted in fine neon wire */}
            <path
              d="M 24 74 L 38 74 Q 40 50 50 32 Q 60 50 62 74 L 76 74"
              fill="none"
              stroke="url(#grad-omega)"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Omega Loop Dome */}
            <circle cx="50" cy="44" r="18" fill="none" stroke="#e9d5ff" strokeWidth="2.4" strokeDasharray="50 18" strokeDashoffset="14" />
            {/* Audio Loop Coils inside */}
            <circle cx="50" cy="44" r="8" fill="rgba(192, 132, 252, 0.25)" stroke="#ffffff" strokeWidth="1.4" />
            <circle cx="50" cy="44" r="2.5" fill="#c084fc" />
          </svg>
        );

      // 14. AGENTGUARD (Public Security)
      case 'aegis-firewall-shield':
        return (
          <svg viewBox="0 0 100 100" className={`${iconSvgSizes[size]} transition-transform duration-700`}>
            <defs>
              <linearGradient id="grad-aegis" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fda4af" />
                <stop offset="50%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#881337" />
              </linearGradient>
            </defs>
            {/* Firewall Sentinel Shield */}
            <polygon points="50,16 78,30 78,60 50,84 22,60 22,30" fill="rgba(244, 63, 94, 0.12)" stroke="url(#grad-aegis)" strokeWidth="1.8" />
            {/* Circuit Breaker Core */}
            <circle cx="50" cy="50" r="14" fill="rgba(192, 132, 252, 0.15)" stroke="#fda4af" strokeWidth="1.5" />
            <polygon points="50,38 58,48 50,48 50,62 42,52 50,52" fill="#ffffff" />
            <circle cx="50" cy="24" r="2" fill="#fda4af" />
            <circle cx="50" cy="76" r="2" fill="#fda4af" />
          </svg>
        );

      // 15. LINUX-POWER (Oro Solar Kernel)
      case 'linux-power-tux-glyph':
        return (
          <svg viewBox="0 0 100 100" className={`${iconSvgSizes[size]} transition-transform duration-700`}>
            <defs>
              <linearGradient id="grad-tux" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#854d0e" />
              </linearGradient>
            </defs>
            {/* Geometric Tux Penguin Silhouette with Solar Arc */}
            <path d="M 50 18 C 42 18 36 26 36 38 C 36 48 30 58 24 66 C 22 68 24 72 28 72 L 72 72 C 76 72 78 68 76 66 C 70 58 64 48 64 38 C 64 26 58 18 50 18 Z" fill="rgba(234, 179, 8, 0.12)" stroke="url(#grad-tux)" strokeWidth="1.8" />
            {/* Golden Beak / Kernel Crystal */}
            <polygon points="50,34 56,42 44,42" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.2" />
            <circle cx="43" cy="30" r="2" fill="#ffffff" />
            <circle cx="57" cy="30" r="2" fill="#ffffff" />
            {/* Terminal Prompt Chevron */}
            <path d="M 42 56 L 48 61 L 42 66" fill="none" stroke="#fef08a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="52" y1="66" x2="58" y2="66" stroke="#fef08a" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        );

      // Fallback default
      default:
        return (
          <svg viewBox="0 0 100 100" className={`${iconSvgSizes[size]}`}>
            <circle cx="50" cy="50" r="32" fill="none" stroke="#c084fc" strokeWidth="2" />
            <circle cx="50" cy="50" r="8" fill="#ffffff" />
          </svg>
        );
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onClick={onClick}
      className={`relative group flex items-center justify-center select-none cursor-pointer transition-all duration-700 ${sizeClasses[size]} ${className}`}
      style={{
        // Thick reactive real glass styling with ultra-noir backdrop
        backgroundColor: 'rgba(5, 1, 9, 0.88)',
        backdropFilter: 'blur(32px) saturate(180%)',
        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
        // Fine 1px luminous edge with halo
        border: `1px solid ${isHovered ? 'rgba(233, 213, 255, 0.55)' : isEducation ? 'rgba(192, 132, 252, 0.35)' : 'rgba(168, 85, 247, 0.22)'}`,
        boxShadow: isHovered
          ? `0 16px 50px rgba(0, 0, 0, 0.95), 0 0 45px ${haloColor}, inset 0 1px 1px rgba(255, 255, 255, 0.35)`
          : `0 12px 35px rgba(0, 0, 0, 0.9), 0 0 25px ${isEducation ? 'rgba(192, 132, 252, 0.2)' : 'rgba(147, 51, 234, 0.12)'}, inset 0 1px 0 rgba(255, 255, 255, 0.12)`,
      }}
    >
      {/* ─── 1. "Puff Puff" Diffuse Smoke Layer ─── */}
      <div
        className="absolute -inset-3 pointer-events-none rounded-[inherit] transition-opacity duration-700"
        style={{
          background: `radial-gradient(circle at ${mouseCoord.x}% ${mouseCoord.y}%, ${puffGlow} 0%, transparent 68%)`,
          filter: 'blur(20px)',
          opacity: isHovered ? 0.95 : 0.45,
        }}
      />

      {/* ─── 2. Reactive Liquid Glass Surface Reflection ─── */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[inherit] overflow-hidden"
        style={{
          background: `radial-gradient(circle at ${mouseCoord.x}% ${mouseCoord.y}%, rgba(255, 255, 255, 0.14) 0%, transparent 55%)`,
        }}
      >
        {/* Subtle glass reflection diagonal sweep */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, transparent 40%, rgba(192, 132, 252, 0.15) 80%, transparent 100%)',
          }}
        />
      </div>

      {/* ─── 3. Education Star Beacon badge if prioritized ─── */}
      {isEducation && size !== 'sm' && (
        <span
          className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-purple-500 text-[8px] font-bold text-black ring-2 ring-black shadow-[0_0_10px_#c084fc]"
          title="Repositorio de Educación Prioritario"
        >
          ★
        </span>
      )}

      {/* ─── 4. The Bespoke Animated Glyph ─── */}
      <motion.div
        animate={{
          scale: isHovered ? 1.08 : 1,
          rotate: isHovered ? 2 : 0,
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="relative z-10 flex items-center justify-center drop-shadow-[0_0_16px_rgba(192,132,252,0.4)]"
      >
        {renderGlyph()}
      </motion.div>

      {/* ─── 5. Fine Corner Luminous Accents (HBO Max Style) ─── */}
      <div className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-purple-200/40 pointer-events-none" />
      <div className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-purple-200/40 pointer-events-none" />
    </div>
  );
};
