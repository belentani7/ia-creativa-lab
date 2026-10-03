import React, { useEffect, useRef } from 'react';
import { LightingMode } from '../types';

interface PlasmaCanvasProps {
  mode: LightingMode;
  interactive?: boolean;
}

export const PlasmaCanvas: React.FC<PlasmaCanvasProps> = ({ mode, interactive = true }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mousePos = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0.5,
    y: 0.5,
    targetX: 0.5,
    targetY: 0.5,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let time = 0;
    let width = 0;
    let height = 0;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.min(width, 1920);
      canvas.height = Math.min(height, 1080);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      mousePos.current.targetX = e.clientX / window.innerWidth;
      mousePos.current.targetY = e.clientY / window.innerHeight;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!interactive || e.touches.length === 0) return;
      mousePos.current.targetX = e.touches[0].clientX / window.innerWidth;
      mousePos.current.targetY = e.touches[0].clientY / window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Mode-specific configuration
    // ultra-noir-3: extreme 3% lux, peak brightness around 10-14 on a 255 scale
    // hbo-noir: cinematic HBO deep purple, peak brightness around 35-50
    // liquid-bloom: expressive fluid ultraviolet, peak around 80-110
    const getModeParams = () => {
      switch (mode) {
        case 'ultra-noir-3':
          return {
            maxBrightness: 8, // Strictly 3% lux liquid light ceiling
            saturation: 0.9,
            speed: 0.0005,
            palette: [
              [0, 0, 1],
              [1, 0, 3],
              [2, 1, 5],
              [4, 1, 8],
              [6, 2, 11],
              [3, 1, 6],
              [1, 0, 3],
              [0, 0, 1],
            ],
            haloMultiplier: 1.2,
            milkyPower: 0.03,
          };
        case 'hbo-noir':
          return {
            maxBrightness: 46,
            saturation: 1.2,
            speed: 0.001,
            palette: [
              [4, 1, 9],
              [12, 4, 25],
              [26, 9, 52],
              [48, 18, 92],
              [72, 28, 135],
              [40, 15, 80],
              [18, 6, 36],
              [6, 2, 12],
            ],
            haloMultiplier: 16,
            milkyPower: 0.15,
          };
        case 'liquid-bloom':
        default:
          return {
            maxBrightness: 95,
            saturation: 1.5,
            speed: 0.0016,
            palette: [
              [10, 3, 22],
              [35, 12, 68],
              [70, 24, 132],
              [115, 45, 195],
              [155, 75, 235],
              [85, 30, 155],
              [40, 14, 82],
              [15, 5, 30],
            ],
            haloMultiplier: 32,
            milkyPower: 0.28,
          };
      }
    };

    // Low-resolution plasma grid for silky 60fps performance with smooth interpolation
    const step = 8;

    const render = () => {
      time += 1;
      // Smooth mouse damping
      mousePos.current.x += (mousePos.current.targetX - mousePos.current.x) * 0.04;
      mousePos.current.y += (mousePos.current.targetY - mousePos.current.y) * 0.04;

      const { maxBrightness, speed, palette, haloMultiplier, milkyPower } = getModeParams();
      const cw = canvas.width;
      const ch = canvas.height;

      const gridW = Math.ceil(cw / step);
      const gridH = Math.ceil(ch / step);
      const imgData = ctx.createImageData(gridW, gridH);
      const data = imgData.data;

      const mx = mousePos.current.x * gridW;
      const my = mousePos.current.y * gridH;
      const palLen = palette.length;

      for (let y = 0; y < gridH; y++) {
        for (let x = 0; x < gridW; x++) {
          const idx = (y * gridW + x) * 4;

          // Multi-frequency sinusoidal interference
          const v1 = Math.sin(x * 0.035 + time * speed * 2.2);
          const v2 = Math.sin(y * 0.045 - time * speed * 1.8);
          const v3 = Math.sin((x + y) * 0.025 + time * speed * 2.8);
          const dx = x - mx;
          const dy = y - my;
          const distMouse = Math.sqrt(dx * dx + dy * dy);
          const mouseWave = Math.cos(distMouse * 0.08 - time * speed * 3.5);

          const combined = (v1 + v2 + v3 + mouseWave + 4) / 8;
          const scaled = combined * (palLen - 1);
          const idx1 = Math.floor(scaled);
          const idx2 = Math.min(idx1 + 1, palLen - 1);
          const frac = scaled - idx1;

          const c1 = palette[idx1];
          const c2 = palette[idx2];

          let r = c1[0] + (c2[0] - c1[0]) * frac;
          let g = c1[1] + (c2[1] - c1[1]) * frac;
          let b = c1[2] + (c2[2] - c1[2]) * frac;

          // Reactive interactive halo around cursor
          const halo = Math.max(0, 1 - distMouse / (gridW * 0.35));
          if (halo > 0) {
            r += halo * haloMultiplier * 0.6;
            g += halo * haloMultiplier * 0.25;
            b += halo * haloMultiplier;
          }

          // Ambient milky puff diffusion
          const puffNoise = Math.sin(x * 0.1 - y * 0.12 + time * 0.015);
          if (puffNoise > 0.4) {
            r += puffNoise * milkyPower * 25;
            g += puffNoise * milkyPower * 10;
            b += puffNoise * milkyPower * 45;
          }

          // Enforce bounds and 3% lux limits
          data[idx] = Math.min(maxBrightness, Math.max(0, Math.floor(r)));
          data[idx + 1] = Math.min(maxBrightness, Math.max(0, Math.floor(g)));
          data[idx + 2] = Math.min(maxBrightness, Math.max(0, Math.floor(b)));
          data[idx + 3] = 255;
        }
      }

      // Draw scaled up to full canvas with bicubic image smoothing for silky blur
      const offscreen = document.createElement('canvas');
      offscreen.width = gridW;
      offscreen.height = gridH;
      const offCtx = offscreen.getContext('2d');
      if (offCtx) {
        offCtx.putImageData(imgData, 0, 0);
        ctx.clearRect(0, 0, cw, ch);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(offscreen, 0, 0, cw, ch);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [mode, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 w-full h-full"
      style={{
        opacity: mode === 'ultra-noir-3' ? 0.95 : 0.85,
      }}
    />
  );
};
