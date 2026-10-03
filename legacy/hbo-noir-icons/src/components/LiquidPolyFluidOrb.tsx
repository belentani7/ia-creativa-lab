import React, { useEffect, useRef, useState } from 'react';

interface LiquidPolyFluidOrbProps {
  repoId: string;
  colorHex: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
}

// 4K Hardware-Accelerated WebGL Chromatic Dispersion Fluid Shader
const VERTEX_SHADER = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform vec3 u_color;
uniform float u_chromatic;
varying vec2 vUv;

// Simplex 3D noise for organic liquid deformation
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0 );
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
  float n_ = 0.142857142857;
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}

// Thin-film interference (Rainbow oil sheen / Gasoline on water)
vec3 spectralSheen(float cosTheta, float t) {
  float delta = (1.0 - cosTheta) * 6.28318 + t * 1.5;
  vec3 col;
  col.r = 0.5 + 0.5 * cos(delta + 0.0);
  col.g = 0.5 + 0.5 * cos(delta + 2.094);
  col.b = 0.5 + 0.5 * cos(delta + 4.188);
  return col;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  vec2 mouseNorm = (u_mouse - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  
  float distToCenter = length(uv);
  float sphereRadius = 0.38;

  // Liquid ripple distortion from mouse
  float mouseInfluence = smoothstep(0.4, 0.0, length(uv - mouseNorm));
  vec2 distortedUv = uv + (uv - mouseNorm) * mouseInfluence * 0.12;

  // Multi-frequency fluid noise
  vec3 noiseCoord = vec3(distortedUv * 3.2, u_time * 0.45);
  float n1 = snoise(noiseCoord);
  float n2 = snoise(noiseCoord * 2.1 + vec3(4.2, 1.3, -2.1));
  float fluidDeform = (n1 * 0.07 + n2 * 0.035);

  float d = length(distortedUv) - (sphereRadius + fluidDeform);

  // Soft milky light outside the sphere (Mie scattering ambient corona)
  float corona = smoothstep(0.48, 0.22, length(uv));
  vec3 milkyLight = u_color * corona * 0.35;

  if (d > 0.0) {
    // Ethereal diffuse gas / vapor aura (dreamy light)
    float edgeFog = exp(-d * 24.0) * 0.4;
    vec3 aura = mix(u_color, vec3(1.0), 0.25) * edgeFog;
    gl_FragColor = vec4(milkyLight + aura, edgeFog * 0.65);
    return;
  }

  // Inside the 3D fluid sphere: reconstruct normal
  float z = sqrt(max(0.0, pow(sphereRadius + fluidDeform, 2.0) - dot(distortedUv, distortedUv)));
  vec3 normal = normalize(vec3(distortedUv, z));
  
  // Normal perturbation by fluid gradient
  normal.x += (snoise(noiseCoord + vec3(0.02, 0.0, 0.0)) - n1) * 2.0;
  normal.y += (snoise(noiseCoord + vec3(0.0, 0.02, 0.0)) - n1) * 2.0;
  normal = normalize(normal);

  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  float NdotV = max(dot(normal, viewDir), 0.0);

  // Chromatic dispersion (RGB refraction separation)
  float etaR = 1.12;
  float etaG = 1.18;
  float etaB = 1.25;

  vec3 refrR = refract(-viewDir, normal, 1.0 / etaR);
  vec3 refrG = refract(-viewDir, normal, 1.0 / etaG);
  vec3 refrB = refract(-viewDir, normal, 1.0 / etaB);

  // Rainbow oil sheen / Gasoline on water thin-film spectrum
  vec3 oilFilm = spectralSheen(NdotV, u_time * 0.5);

  // Internal milky volume scattering
  vec3 corePlasma = mix(u_color, vec3(1.0), 0.4);
  vec3 baseColor = mix(u_color * 0.4, corePlasma, pow(NdotV, 1.8));

  // Combine RGB dispersion channels
  vec3 fluidR = baseColor * (1.0 + refrR.z * 0.5) * oilFilm.r;
  vec3 fluidG = baseColor * (1.0 + refrG.z * 0.5) * oilFilm.g;
  vec3 fluidB = baseColor * (1.0 + refrB.z * 0.5) * oilFilm.b;
  vec3 composite = vec3(fluidR.r, fluidG.g, fluidB.b);

  // Real Thick Glass Fresnel reflection rim (Apple Glass specular lip)
  float fresnel = pow(1.0 - NdotV, 3.5);
  vec3 glassRim = mix(vec3(1.0), oilFilm, 0.6) * fresnel * 1.8;

  // Dual specular highlights (high-energy light source)
  vec3 light1 = normalize(vec3(-0.6, 0.8, 1.2));
  vec3 light2 = normalize(vec3(0.5, -0.7, 0.9));
  vec3 h1 = normalize(light1 + viewDir);
  vec3 h2 = normalize(light2 + viewDir);
  float spec1 = pow(max(dot(normal, h1), 0.0), 48.0) * 1.6;
  float spec2 = pow(max(dot(normal, h2), 0.0), 32.0) * 0.9;
  vec3 specular = vec3(spec1) + oilFilm * spec2;

  // Final 4K tone-mapped pixel
  vec3 finalColor = composite + glassRim + specular + milkyLight * 0.5;
  float alpha = smoothstep(0.005, -0.015, d);

  gl_FragColor = vec4(finalColor, alpha);
}
`;

export const LiquidPolyFluidOrb: React.FC<LiquidPolyFluidOrbProps> = ({
  repoId,
  colorHex,
  className = '',
  size = 'lg',
  interactive = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 100,
    y: 100,
    targetX: 100,
    targetY: 100,
  });
  const [webglSupported, setWebglSupported] = useState<boolean>(true);

  // Sizing definitions for high-DPI
  const dimensionMap = {
    sm: { px: 130 },
    md: { px: 190 },
    lg: { px: 280 },
    xl: { px: 360 },
  };
  const baseDim = dimensionMap[size].px;

  // Parse HEX color into RGB floats
  const parseHex = (hex: string): [number, number, number] => {
    let cleaned = hex.replace('#', '');
    if (cleaned.length === 3) {
      cleaned = cleaned.split('').map((c) => c + c).join('');
    }
    const num = parseInt(cleaned, 16);
    return [
      ((num >> 16) & 255) / 255,
      ((num >> 8) & 255) / 255,
      (num & 255) / 255,
    ];
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // High-DPI 4K rendering scaling (Retina pixel ratio)
    const dpr = Math.min(window.devicePixelRatio || 2, 2.5);
    canvas.width = baseDim * dpr;
    canvas.height = baseDim * dpr;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
      powerPreference: 'high-performance',
    });

    if (!gl) {
      setWebglSupported(false);
      return;
    }

    // Compile Shaders
    const createShader = (type: number, src: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn(gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vs = createShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) {
      setWebglSupported(false);
      return;
    }

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setWebglSupported(false);
      return;
    }

    gl.useProgram(program);

    // Quad geometry
    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0,
      ]),
      gl.STATIC_DRAW
    );

    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uRes = gl.getUniformLocation(program, 'u_resolution');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');
    const uColor = gl.getUniformLocation(program, 'u_color');

    const rgb = parseHex(colorHex);
    gl.uniform3f(uColor, rgb[0], rgb[1], rgb[2]);
    gl.uniform2f(uRes, canvas.width, canvas.height);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let startTime = performance.now();

    const render = () => {
      const elapsed = (performance.now() - startTime) * 0.001;

      // Smooth pointer lerp
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.08;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.08;

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(uMouse, mouseRef.current.x * dpr, (baseDim - mouseRef.current.y) * dpr);
      gl.uniform3f(uColor, rgb[0], rgb[1], rgb[2]);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(quadBuffer);
    };
  }, [colorHex, baseDim]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseRef.current.targetX = e.clientX - rect.left;
    mouseRef.current.targetY = e.clientY - rect.top;
  };

  const handleMouseLeave = () => {
    mouseRef.current.targetX = baseDim * 0.5;
    mouseRef.current.targetY = baseDim * 0.5;
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: baseDim, height: baseDim }}
    >
      {/* ─── 1. Ultra-Deep Milky Light Ambient Caustic Scatter (Miky Dreamy Light) ─── */}
      <div
        className="absolute rounded-full pointer-events-none transition-all duration-700 blur-2xl opacity-75"
        style={{
          width: baseDim * 0.85,
          height: baseDim * 0.85,
          background: `radial-gradient(circle, ${colorHex}90 0%, ${colorHex}35 45%, transparent 75%)`,
          filter: 'blur(35px)',
        }}
      />

      {/* ─── 2. 4K WebGL Poly-Fluid Canvas (Gasoline on Water / Chromatic Dispersion) ─── */}
      {webglSupported ? (
        <canvas
          ref={canvasRef}
          className="relative z-10 w-full h-full pointer-events-none drop-shadow-[0_20px_45px_rgba(0,0,0,0.95)]"
          style={{ width: baseDim, height: baseDim }}
        />
      ) : (
        /* Fallback High-Fidelity SVG if WebGL is disabled */
        <div
          className="relative z-10 rounded-full border border-white/30 flex items-center justify-center"
          style={{
            width: baseDim * 0.75,
            height: baseDim * 0.75,
            background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${colorHex} 45%, #050208 100%)`,
            boxShadow: `0 0 50px ${colorHex}80, inset 0 0 25px rgba(255,255,255,0.7)`,
          }}
        />
      )}

      {/* ─── 3. Thick Glass Specular Micro-Glare (Optical Brewster Angle Glint) ─── */}
      <div
        className="absolute top-1/4 left-1/4 w-3 h-3 rounded-full bg-white blur-[0.8px] opacity-90 pointer-events-none z-20"
        style={{
          boxShadow: '0 0 12px #ffffff, 0 0 24px rgba(255,255,255,0.8)',
        }}
      />
    </div>
  );
};
