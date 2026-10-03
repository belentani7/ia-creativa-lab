/* Observatorio Carmesí: the canvas is the visual protagonist; UI behaves like a restrained optical instrument. */
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Crosshair, Pause, Play, RotateCcw } from "lucide-react";

type Star = { x: number; y: number; z: number; pz: number; size: number; seed: number };

const crimson = { current: "#e23b50", cool: "#d9f4ff" };

function Starfield({ redshift, paused, onRedshiftChange }: { redshift: number; paused: boolean; onRedshiftChange: (v: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const raf = useRef<number>(0);
  const stars = useRef<Star[]>([]);
  const pausedRef = useRef(paused);
  const redRef = useRef(redshift);
  pausedRef.current = paused;
  redRef.current = redshift;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const count = 760;
    stars.current = Array.from({ length: count }, (_, i) => ({
      x: (Math.random() - 0.5) * 2200,
      y: (Math.random() - 0.5) * 1400,
      z: Math.random() * 1200 + 1,
      pz: 0,
      size: Math.random() * 1.8 + 0.35,
      seed: Math.random() * Math.PI * 2,
    }));
    let last = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const render = (now: number) => {
      const dt = Math.min((now - last) / 16.67, 2);
      last = now;
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.fillStyle = "rgba(2, 4, 8, 0.42)";
      ctx.fillRect(0, 0, w, h);
      const red = redRef.current / 100;
      const speed = pausedRef.current ? 0 : 7 + red * 6;
      const cx = w / 2 + pointer.current.x * 42;
      const cy = h / 2 + pointer.current.y * 28;
      const focal = Math.min(w, h) * 0.72;

      for (const star of stars.current) {
        star.pz = star.z;
        if (!pausedRef.current) star.z -= speed * dt;
        if (star.z < 1) {
          star.x = (Math.random() - 0.5) * 2200;
          star.y = (Math.random() - 0.5) * 1400;
          star.z = 1200;
          star.pz = star.z;
          star.seed = Math.random() * Math.PI * 2;
        }
        const sx = cx + (star.x / star.z) * focal;
        const sy = cy + (star.y / star.z) * focal;
        const px = cx + (star.x / star.pz) * focal;
        const py = cy + (star.y / star.pz) * focal;
        if (sx < -30 || sx > w + 30 || sy < -30 || sy > h + 30) continue;
        const brightness = Math.min(1, (1200 - star.z) / 950);
        const pulse = 0.72 + Math.sin(now / 800 + star.seed) * 0.18;
        const r = Math.round(217 + (226 - 217) * red);
        const g = Math.round(244 - 185 * red);
        const b = Math.round(255 - 175 * red);
        ctx.globalAlpha = Math.max(0.14, brightness * pulse);
        ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.lineWidth = Math.max(0.45, star.size * brightness);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.stroke();
        if (brightness > 0.86) {
          ctx.globalAlpha *= 0.36 + red * 0.54;
          ctx.fillStyle = crimson.current;
          ctx.beginPath();
          ctx.arc(sx, sy, star.size * (1.5 + red * 1.5), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      raf.current = requestAnimationFrame(render);
    };
    raf.current = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} aria-label="Campo estelar 3D interactivo" onPointerMove={(e) => { pointer.current.x = (e.clientX / window.innerWidth - 0.5) * 2; pointer.current.y = (e.clientY / window.innerHeight - 0.5) * 2; }} onPointerLeave={() => { pointer.current.x = 0; pointer.current.y = 0; }} />;
}

export default function Home() {
  const [redshift, setRedshift] = useState(68);
  const [paused, setPaused] = useState(false);
  return (
    <main className="starfield-page">
      <div className="cosmic-backdrop" />
      <Starfield redshift={redshift} paused={paused} onRedshiftChange={setRedshift} />
      <div className="red-haze" style={{ opacity: redshift / 190 }} />
      <header className="topbar">
        <div className="brand-lockup"><span className="brand-mark"><span /><i /><b /></span><span>RED / SHIFT</span></div>
        <div className="top-status"><span className="status-dot" /> LIVE FIELD <span className="status-separator">/</span> 03:17:42 UTC</div>
      </header>
      <section className="hero-copy">
        <p className="eyebrow"><Crosshair size={13} /> OBSERVATORY 07 — DEEP FIELD</p>
        <h1>Observe<br /><em>the redshift.</em></h1><div className="shift-readout"><span className="shift-spine"><i style={{ height: `${redshift}%` }} /></span><span><b>RED SHIFT INDEX</b><small>{String(Math.round(redshift)).padStart(2, "0")} / 100</small></span></div>
        <p className="intro">A living stellar field rendered in real time. Move through the signal and watch cold light become heat.</p>
        <button className="enter-button" onClick={() => setRedshift((v) => v >= 96 ? 12 : v + 18)}>Enter the stellar field <ArrowUpRight size={17} /></button>
      </section>
      <aside className="instrument-panel">
        <div className="panel-heading"><span>FIELD CONTROL</span><span>07 / 24</span></div>
        <div className="panel-rule" /><div className="vertical-calibration"><span>00</span><i><b style={{ height: `${redshift}%` }} /></i><span>100</span></div>
        <div className="metric"><span>CHROMATIC SHIFT</span><strong>{String(Math.round(redshift)).padStart(2, "0")}<small>%</small></strong></div>
        <input aria-label="Chromatic shift" type="range" min="0" max="100" value={redshift} onChange={(e) => setRedshift(Number(e.target.value))} />
        <div className="range-labels"><span>COOL</span><span>CRIMSON</span></div>
        <div className="metric lower"><span>PARTICLE VELOCITY</span><strong>{paused ? "00.0" : (7 + redshift / 13).toFixed(1)}<small> PX / F</small></strong></div>
        <div className="panel-actions"><button onClick={() => setPaused((v) => !v)} aria-label={paused ? "Reproducir" : "Pausar"}>{paused ? <Play size={14} /> : <Pause size={14} />}</button><button onClick={() => setRedshift(0)} aria-label="Reiniciar shift"><RotateCcw size={14} /></button></div>
        <div className="coordinate-block"><span>RA 14h 28m 37.2s</span><span>DEC −62° 41′ 09.1″</span><span>DEPTH 1.2 × 10<sup>3</sup></span></div>
      </aside>
      <footer className="bottomline"><span>MOVE POINTER TO ALTER PERSPECTIVE</span><span className="footer-line" /><span>NO SIGNAL LOST</span></footer>
    </main>
  );
}
