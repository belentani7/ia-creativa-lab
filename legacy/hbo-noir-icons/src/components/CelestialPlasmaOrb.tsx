import React from 'react';

interface CelestialPlasmaOrbProps {
  repoId: string;
  colorHex: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const CelestialPlasmaOrb: React.FC<CelestialPlasmaOrbProps> = ({
  repoId,
  colorHex,
  className = '',
  size = 'lg',
}) => {
  // Dimensions based on size
  const sizeMap = {
    sm: { w: 120, h: 120, radius: 46 },
    md: { w: 180, h: 180, radius: 72 },
    lg: { w: 260, h: 220, radius: 95 },
    xl: { w: 340, h: 280, radius: 125 },
  };

  const { w, h, radius } = sizeMap[size];
  const cx = w * 0.52;
  const cy = h * 0.48;

  // Custom visual variations based on repo
  const isManosAbiertas = repoId === 'ManosAbiertas' || colorHex === '#ef4444';
  const isLinguaAberta = repoId === 'lingua-aberta' || colorHex === '#6366f1';
  const isCruzando = repoId === 'Cruzando-el-charco' || colorHex === '#10b981';
  const isOpenSchool = repoId === 'open-school' || colorHex === '#3b82f6';

  // Primary palette derivation
  const mainColor = colorHex;
  const secondaryColor = isManosAbiertas
    ? '#ff2a55'
    : isLinguaAberta
    ? '#818cf8'
    : isCruzando
    ? '#34d399'
    : isOpenSchool
    ? '#60a5fa'
    : colorHex;

  const coreGlow = isManosAbiertas
    ? '#ffffff'
    : isLinguaAberta
    ? '#e0e7ff'
    : isCruzando
    ? '#ecfdf5'
    : '#eff6ff';

  const deepBase = isManosAbiertas
    ? '#500713'
    : isLinguaAberta
    ? '#1e1b4b'
    : isCruzando
    ? '#064e3b'
    : '#172554';

  const uid = `orb-${repoId}`;

  return (
    <div
      className={`relative flex items-center justify-center pointer-events-none select-none ${className}`}
      style={{ width: w, height: h }}
    >
      {/* ─── Ambient Sub-Surface Caustic Glow Behind the Sphere ─── */}
      <div
        className="absolute rounded-full filter blur-3xl opacity-60 transition-all duration-700 pointer-events-none"
        style={{
          width: radius * 2.2,
          height: radius * 2.2,
          background: `radial-gradient(circle, ${mainColor}80 0%, ${secondaryColor}30 50%, transparent 80%)`,
        }}
      />

      {/* ─── The 3D High-Fidelity Celestial Plasma Sphere (SVG Vectorized Art) ─── */}
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width="100%"
        height="100%"
        className="relative z-10 overflow-visible"
      >
        <defs>
          {/* Deep Shadow Filter */}
          <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur2" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id={`${uid}-flare`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="f1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="f2" />
            <feMerge>
              <feMergeNode in="f1" />
              <feMergeNode in="f2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Sphere Volume Shading Gradient */}
          <radialGradient
            id={`${uid}-sphere-base`}
            cx="40%"
            cy="36%"
            r="65%"
            fx="38%"
            fy="32%"
          >
            <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.95" />
            <stop offset="25%" stopColor={mainColor} stopOpacity="0.9" />
            <stop offset="65%" stopColor={deepBase} stopOpacity="0.85" />
            <stop offset="90%" stopColor="#050204" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.98" />
          </radialGradient>

          {/* Core White Hot Plasma Glow */}
          <radialGradient
            id={`${uid}-plasma-core`}
            cx="45%"
            cy="42%"
            r="45%"
            fx="43%"
            fy="40%"
          >
            <stop offset="0%" stopColor={coreGlow} stopOpacity="1" />
            <stop offset="20%" stopColor={secondaryColor} stopOpacity="0.9" />
            <stop offset="60%" stopColor={mainColor} stopOpacity="0.6" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* Glass Shell Specular Highlight (Fresnel Glass Lip) */}
          <linearGradient
            id={`${uid}-glass-rim`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="25%" stopColor={secondaryColor} stopOpacity="0.6" />
            <stop offset="60%" stopColor="transparent" stopOpacity="0" />
            <stop offset="85%" stopColor={mainColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.3" />
          </linearGradient>

          {/* Diagonal Glass Sheen Reflection Arc */}
          <linearGradient
            id={`${uid}-sheen`}
            x1="20%"
            y1="0%"
            x2="80%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="30%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="60%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>

          {/* Plasma Flare Linear Ribbon */}
          <linearGradient
            id={`${uid}-ribbon`}
            x1="0%"
            y1="30%"
            x2="100%"
            y2="70%"
          >
            <stop offset="0%" stopColor="transparent" stopOpacity="0" />
            <stop offset="20%" stopColor={mainColor} stopOpacity="0.4" />
            <stop offset="50%" stopColor={secondaryColor} stopOpacity="0.95" />
            <stop offset="70%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="85%" stopColor={mainColor} stopOpacity="0.6" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* ─── 1. Outer Ethereal Plasma Flares & Ribbons (Like image.png) ─── */}
        <g opacity="0.85" filter={`url(#${uid}-glow)`}>
          {/* Swirling celestial ribbon cutting diagonally across */}
          <path
            d={`M ${cx - radius * 1.5} ${cy + radius * 0.4}
               C ${cx - radius * 0.8} ${cy - radius * 0.9},
                 ${cx + radius * 0.4} ${cy - radius * 1.2},
                 ${cx + radius * 1.5} ${cy - radius * 0.3}
               C ${cx + radius * 1.2} ${cy + radius * 0.8},
                 ${cx - radius * 0.2} ${cy + radius * 1.3},
                 ${cx - radius * 1.5} ${cy + radius * 0.4} Z`}
            fill={`url(#${uid}-ribbon)`}
            opacity="0.65"
          />

          {/* Secondary dynamic orbital plasma filament */}
          <path
            d={`M ${cx - radius * 1.2} ${cy + radius * 0.2}
               Q ${cx - radius * 0.3} ${cy - radius * 0.9} ${cx + radius * 1.1} ${cy - radius * 0.5}
               Q ${cx + radius * 1.4} ${cy + radius * 0.5} ${cx} ${cy + radius * 0.95}
               Z`}
            fill="none"
            stroke={secondaryColor}
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.8"
          />
        </g>

        {/* ─── 2. Main 3D Spherical Glass Body ─── */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill={`url(#${uid}-sphere-base)`}
          filter="drop-shadow(0 20px 30px rgba(0,0,0,0.9))"
        />

        {/* ─── 3. Internal Swirling Fluid Plasma Vortex ─── */}
        <g clipPath={`url(#${uid}-clip)`}>
          <clipPath id={`${uid}-clip`}>
            <circle cx={cx} cy={cy} r={radius - 1} />
          </clipPath>

          {/* Internal Hot Core Glow */}
          <circle
            cx={cx - radius * 0.12}
            cy={cy - radius * 0.1}
            r={radius * 0.75}
            fill={`url(#${uid}-plasma-core)`}
            filter={`url(#${uid}-glow)`}
          />

          {/* Swirling Plasma Tendril 1 */}
          <path
            d={`M ${cx - radius * 0.7} ${cy + radius * 0.4}
               C ${cx - radius * 0.4} ${cy - radius * 0.5},
                 ${cx + radius * 0.2} ${cy - radius * 0.8},
                 ${cx + radius * 0.7} ${cy - radius * 0.1}
               C ${cx + radius * 0.4} ${cy + radius * 0.5},
                 ${cx - radius * 0.2} ${cy + radius * 0.7},
                 ${cx - radius * 0.7} ${cy + radius * 0.4} Z`}
            fill={mainColor}
            opacity="0.8"
            filter={`url(#${uid}-glow)`}
          />

          {/* Swirling Plasma Tendril 2 (Intense Hot Filament) */}
          <path
            d={`M ${cx - radius * 0.5} ${cy - radius * 0.2}
               Q ${cx} ${cy - radius * 0.65} ${cx + radius * 0.6} ${cy + radius * 0.1}
               Q ${cx + radius * 0.2} ${cy + radius * 0.6} ${cx - radius * 0.3} ${cy + radius * 0.3}
               Z`}
            fill={secondaryColor}
            opacity="0.85"
          />

          {/* Dense White-Hot Energy Point (Star Flare in Core) */}
          <ellipse
            cx={cx - radius * 0.05}
            cy={cy - radius * 0.08}
            rx={radius * 0.22}
            ry={radius * 0.18}
            fill="#ffffff"
            opacity="0.95"
            filter={`url(#${uid}-flare)`}
          />

          {/* Starburst rays if Lingua-aberta or general supernova */}
          {isLinguaAberta && (
            <g opacity="0.95" filter={`url(#${uid}-flare)`}>
              <line
                x1={cx - radius * 0.7}
                y1={cy - radius * 0.08}
                x2={cx + radius * 0.6}
                y2={cy - radius * 0.08}
                stroke="#ffffff"
                strokeWidth="2.5"
              />
              <line
                x1={cx - radius * 0.05}
                y1={cy - radius * 0.7}
                x2={cx - radius * 0.05}
                y2={cy + radius * 0.5}
                stroke="#ffffff"
                strokeWidth="2.5"
              />
            </g>
          )}

          {/* Liquid glass inner refraction ring */}
          <circle
            cx={cx}
            cy={cy}
            r={radius - 4}
            fill="none"
            stroke={`url(#${uid}-glass-rim)`}
            strokeWidth="2"
            opacity="0.75"
          />
        </g>

        {/* ─── 4. Top Glass Spherical Specular Arc (Fresnel Reflection) ─── */}
        <ellipse
          cx={cx - radius * 0.28}
          cy={cy - radius * 0.38}
          rx={radius * 0.52}
          ry={radius * 0.28}
          fill={`url(#${uid}-sheen)`}
          transform={`rotate(-22 ${cx - radius * 0.28} ${cy - radius * 0.38})`}
        />

        {/* Outer Fine Glass Rim Stroke (3D Refraction Lip) */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={`url(#${uid}-glass-rim)`}
          strokeWidth="1.8"
          opacity="0.9"
        />

        {/* Intense Specular Highlight Dot on Top Left Rim */}
        <circle
          cx={cx - radius * 0.55}
          cy={cy - radius * 0.55}
          r="4"
          fill="#ffffff"
          opacity="0.95"
          filter={`url(#${uid}-glow)`}
        />
      </svg>
    </div>
  );
};
