import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Aperture,
  ArrowDownToLine,
  ArrowUpRight,
  AudioLines,
  Brush,
  ChevronDown,
  Clapperboard,
  Copy,
  Crop,
  Eraser,
  Expand,
  FileImage,
  Film,
  Grid2X2,
  ImagePlus,
  Images,
  Layers3,
  LayoutGrid,
  Lightbulb,
  Menu,
  MoreHorizontal,
  MousePointer2,
  Palette,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  Sparkles,
  SquarePen,
  SunMedium,
  Upload,
  WandSparkles,
  X,
  ZoomIn,
} from "lucide-react";

type Mode = "Imagen" | "Vídeo" | "Audio" | "Tableros";
type ActionKey = "generate" | "video" | "expand" | "fill" | "remove" | "edit";

type Palette = {
  name: string;
  start: string;
  end: string;
  accent: string;
  mood: string;
};

const palettes: Record<string, Palette> = {
  Auto: { name: "Auto", start: "#101b3d", end: "#f19a65", accent: "#72a7ff", mood: "equilibrado" },
  Cinematográfico: { name: "Cinematográfico", start: "#0b111b", end: "#bd5f3a", accent: "#f3b17e", mood: "dramático" },
  Luminoso: { name: "Luminoso", start: "#5b8de7", end: "#f7d18d", accent: "#fff5d6", mood: "abierto" },
  Nocturno: { name: "Nocturno", start: "#080d1d", end: "#3d267a", accent: "#9d8bff", mood: "etéreo" },
  Editorial: { name: "Editorial", start: "#1d222b", end: "#c8a78b", accent: "#f6dfc4", mood: "refinado" },
};

const quickActions: Array<{ key: ActionKey; label: string; detail: string; icon: typeof WandSparkles; accent: string }> = [
  { key: "generate", label: "Generar imagen", detail: "Crea una imagen a partir de una indicación", icon: WandSparkles, accent: "blue" },
  { key: "video", label: "Generar vídeo", detail: "Prepara una secuencia desde tu idea", icon: Film, accent: "orange" },
  { key: "expand", label: "Ampliar imagen", detail: "Extiende el lienzo más allá de sus bordes", icon: Expand, accent: "lavender" },
  { key: "fill", label: "Relleno generativo", detail: "Añade detalles a una composición", icon: Brush, accent: "mint" },
  { key: "remove", label: "Quitar objeto", detail: "Limpia elementos no deseados", icon: Eraser, accent: "rose" },
  { key: "edit", label: "Editar imagen", detail: "Ajusta una imagen con instrucciones", icon: SquarePen, accent: "gold" },
];

const inspirations = [
  { label: "Caricaturizar", icon: Aperture, className: "card-sky", prompt: "retrato editorial convertido en ilustración gráfica" },
  { label: "Generar música", icon: AudioLines, className: "card-violet", prompt: "paisaje sonoro cálido y cinematográfico" },
  { label: "Relleno generativo", icon: ImagePlus, className: "card-peach", prompt: "añadir flores silvestres al fondo" },
  { label: "Generar vídeo", icon: Clapperboard, className: "card-ink", prompt: "plano secuencia lento sobre una ciudad de neón" },
  { label: "Generar voz", icon: AudioLines, className: "card-lilac", prompt: "narración íntima y pausada" },
  { label: "Mejorar imagen", icon: SunMedium, className: "card-sand", prompt: "luz suave y detalle de alta fidelidad" },
];

const recentPrompts = [
  { title: "Jardín de medianoche", meta: "hace 2 min", style: "Nocturno", filter: "hue-rotate(18deg) saturate(1.35)" },
  { title: "Estudio de cerámica", meta: "ayer", style: "Editorial", filter: "sepia(.22) saturate(.9)" },
  { title: "Horizonte líquido", meta: "ayer", style: "Luminoso", filter: "hue-rotate(155deg) saturate(1.25)" },
];

function BrandMark() {
  return (
    <div className="brand-mark" aria-label="Lumen Local Studio">
      <span className="brand-orbit brand-orbit-one" />
      <span className="brand-orbit brand-orbit-two" />
      <span className="brand-dot" />
    </div>
  );
}

function AppIcon({ icon: Icon, label, active = false, onClick }: { icon: typeof WandSparkles; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button className={`rail-button ${active ? "is-active" : ""}`} aria-label={label} title={label} onClick={onClick}>
      <Icon size={19} strokeWidth={active ? 2.25 : 1.8} />
    </button>
  );
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("Imagen");
  const [prompt, setPrompt] = useState("Un paisaje de montaña flotando sobre un mar de nubes, luz de amanecer...");
  const [style, setStyle] = useState("Auto");
  const [aspect, setAspect] = useState("16:9");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAt, setGeneratedAt] = useState("Generación local lista");
  const [showMore, setShowMore] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [activeRail, setActiveRail] = useState("create");
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedPalette = palettes[style];

  const compositionStyle = useMemo(() => ({
    background: `radial-gradient(circle at 72% 24%, ${selectedPalette.accent}55 0 9%, transparent 31%), radial-gradient(circle at 20% 82%, ${selectedPalette.end}77 0 3%, transparent 28%), linear-gradient(135deg, ${selectedPalette.start}, ${selectedPalette.end})`,
  }), [selectedPalette]);

  const runGeneration = () => {
    if (!prompt.trim()) {
      toast.error("Escribe una indicación para comenzar");
      return;
    }
    setIsGenerating(true);
    setGeneratedAt("Construyendo composición local…");
    window.setTimeout(() => {
      setIsGenerating(false);
      setGeneratedAt(`Variación creada · ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
      toast.success("Composición creada sin conexión a APIs");
    }, 760);
  };

  const chooseAction = (action: ActionKey) => {
    if (action === "generate") {
      setMode("Imagen");
      document.getElementById("prompt-box")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (action === "video") setMode("Vídeo");
    toast(`${quickActions.find((item) => item.key === action)?.label} · modo de demostración local`);
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona un archivo de imagen");
      return;
    }
    setUploadedImage(URL.createObjectURL(file));
    toast.success("Imagen cargada en tu navegador");
  };

  const downloadComposition = () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900"><defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${selectedPalette.start}"/><stop offset="1" stop-color="${selectedPalette.end}"/></linearGradient><radialGradient id="glow"><stop stop-color="${selectedPalette.accent}" stop-opacity=".95"/><stop offset="1" stop-color="${selectedPalette.accent}" stop-opacity="0"/></radialGradient></defs><rect width="1600" height="900" fill="url(#bg)"/><circle cx="1160" cy="260" r="420" fill="url(#glow)" opacity=".68"/><circle cx="270" cy="780" r="250" fill="${selectedPalette.end}" opacity=".52"/><path d="M500 900C660 690 720 530 910 370C1050 252 1250 190 1600 90V900Z" fill="${selectedPalette.accent}" opacity=".12"/><text x="86" y="770" font-family="Georgia, serif" font-size="46" fill="white" opacity=".92">${prompt.replace(/[&<>]/g, "").slice(0, 54)}</text><text x="88" y="820" font-family="Arial, sans-serif" font-size="18" letter-spacing="3" fill="white" opacity=".6">LUMEN LOCAL · ${style.toUpperCase()}</text></svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "lumen-local-composicion.svg";
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Composición descargada");
  };

  return (
    <div className="app-shell">
      <aside className="app-rail">
        <div className="rail-brand"><BrandMark /></div>
        <div className="rail-group">
          <AppIcon icon={Sparkles} label="Crear" active={activeRail === "create"} onClick={() => setActiveRail("create")} />
          <AppIcon icon={Images} label="Mis creaciones" active={activeRail === "library"} onClick={() => { setActiveRail("library"); toast("Biblioteca local · próximamente"); }} />
          <AppIcon icon={Grid2X2} label="Inspiración" active={activeRail === "inspire"} onClick={() => { setActiveRail("inspire"); document.getElementById("inspiration")?.scrollIntoView({ behavior: "smooth" }); }} />
        </div>
        <div className="rail-bottom">
          <AppIcon icon={Settings2} label="Ajustes" onClick={() => toast("Ajustes locales · próximamente")} />
          <div className="avatar">LM</div>
        </div>
      </aside>

      <main className="main-stage">
        <header className="topbar">
          <div className="mobile-brand"><BrandMark /><span>Lumen</span></div>
          <div className="breadcrumb"><span>Estudio</span><ChevronDown size={15} /></div>
          <div className="topbar-actions">
            <span className="offline-pill"><span className="status-dot" /> Sin conexión</span>
            <button className="icon-button" aria-label="Buscar" onClick={() => toast("La búsqueda local estará disponible pronto")}><Search size={18} /></button>
            <button className="avatar avatar-small" aria-label="Perfil">LM</button>
          </div>
        </header>

        <section className="hero-section">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> ESTUDIO CREATIVO LOCAL</div>
            <h1>Crear cualquier cosa<span className="title-mark">.</span></h1>
            <p>Explora una idea, dale forma y llévala a tu lienzo. Todo sucede en tu navegador.</p>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <img src="/manus-storage/lumen-hero_f3544468.jpg" alt="" />
            <div className="hero-visual-label"><span>01</span><span>Materia / luz / forma</span></div>
          </div>
        </section>

        <section className="workspace-section" id="prompt-box">
          <div className="section-heading">
            <div>
              <span className="section-kicker">01 / IDEA</span>
              <h2>¿Qué quieres imaginar?</h2>
            </div>
            <button className="text-button" onClick={() => { setPrompt(""); toast("Indicación vaciada"); }}><RotateCcw size={15} /> Limpiar</button>
          </div>
          <div className="prompt-card">
            <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Describe una imagen, una escena o una atmósfera..." aria-label="Describe lo que deseas generar" />
            <div className="prompt-footer">
              <div className="prompt-tools">
                <input ref={inputRef} type="file" accept="image/*" onChange={handleUpload} className="sr-only" />
                <button className="ghost-tool" onClick={() => inputRef.current?.click()}><Upload size={16} /> <span>Cargar imagen</span></button>
                <span className="tool-separator" />
                <button className="ghost-tool" onClick={() => setShowMore((value) => !value)}><MoreHorizontal size={17} /> <span>Más</span></button>
              </div>
              <button className="generate-button" onClick={runGeneration} disabled={isGenerating}>
                {isGenerating ? <span className="loader" /> : <Sparkles size={17} />}
                {isGenerating ? "Creando" : "Generar"}
                <span className="button-arrow">↗</span>
              </button>
            </div>
          </div>
          {showMore && (
            <div className="more-panel">
              <span>Detalle</span><button className="tiny-select">Alto <ChevronDown size={13} /></button>
              <span>Semilla</span><button className="tiny-select">Aleatoria <ChevronDown size={13} /></button>
              <span>Contenido</span><button className="tiny-select">Seguro <ChevronDown size={13} /></button>
            </div>
          )}
          <div className="prompt-suggestions">
            <span>Prueba:</span>
            {["retrato de luz azul", "paisaje onírico", "producto editorial"].map((suggestion) => <button key={suggestion} onClick={() => setPrompt(suggestion)}>{suggestion}</button>)}
          </div>
        </section>

        <section className="canvas-section">
          <div className="section-heading canvas-heading">
            <div><span className="section-kicker">02 / LIENZO</span><h2>Tu espacio de juego</h2></div>
            <div className="canvas-actions">
              <span className="generation-status"><span className="status-dot blue-dot" /> {generatedAt}</span>
              <button className="small-icon-button" aria-label="Descargar composición" onClick={downloadComposition}><ArrowDownToLine size={17} /></button>
              <button className="small-icon-button" aria-label="Ampliar vista" onClick={() => toast("Vista ampliada · usa el zoom del navegador para explorar")}><ZoomIn size={17} /></button>
            </div>
          </div>
          <div className="canvas-layout">
            <div className="canvas-frame">
              <div className={`canvas-art ${isGenerating ? "is-generating" : ""}`} style={compositionStyle}>
                <div className="art-grain" />
                <div className="art-orb art-orb-one" />
                <div className="art-orb art-orb-two" />
                <div className="art-ribbon ribbon-one" />
                <div className="art-ribbon ribbon-two" />
                {uploadedImage && <img src={uploadedImage} className="uploaded-overlay" alt="Imagen cargada" />}
                <div className="canvas-caption"><span>Composición 01</span><span>{aspect} · {style}</span></div>
                <div className="canvas-center-note"><Sparkles size={18} /><span>{isGenerating ? "Variando la atmósfera" : "Composición local"}</span></div>
              </div>
              <div className="canvas-toolbar">
                <div className="toolbar-left"><button className="tool-icon active" aria-label="Seleccionar"><MousePointer2 size={16} /></button><button className="tool-icon" aria-label="Recortar" onClick={() => toast("Recorte local · próximamente")}><Crop size={16} /></button><button className="tool-icon" aria-label="Capas" onClick={() => toast("Capas locales · próximamente")}><Layers3 size={16} /></button></div>
                <div className="zoom-label">100%</div>
                <button className="tool-icon" aria-label="Más herramientas"><MoreHorizontal size={16} /></button>
              </div>
            </div>
            <aside className="canvas-controls">
              <div className="control-card">
                <div className="control-label"><span>Estilo visual</span><Palette size={15} /></div>
                <div className="style-grid">{Object.keys(palettes).map((item) => <button key={item} className={`style-chip ${style === item ? "selected" : ""}`} onClick={() => setStyle(item)}><span className="style-swatch" style={{ background: `linear-gradient(135deg, ${palettes[item].start}, ${palettes[item].end})` }} />{item}</button>)}</div>
              </div>
              <div className="control-card">
                <div className="control-label"><span>Proporción</span><Crop size={15} /></div>
                <div className="aspect-grid">{["1:1", "4:5", "16:9", "9:16"].map((item) => <button key={item} className={`aspect-chip ${aspect === item ? "selected" : ""}`} onClick={() => setAspect(item)}><span className={`aspect-shape ratio-${item.replace(":", "-")}`} />{item}</button>)}</div>
              </div>
              <div className="local-note"><Lightbulb size={16} /><span><strong>Motor local</strong> · esta demo crea variaciones visuales directamente en tu navegador.</span></div>
            </aside>
          </div>
        </section>

        <section className="quick-section">
          <div className="section-heading"><div><span className="section-kicker">03 / HERRAMIENTAS</span><h2>Empieza por aquí</h2></div><button className="view-all" onClick={() => toast("Mostrando todas las herramientas locales")}>Ver todo <ArrowUpRight size={15} /></button></div>
          <div className="quick-grid">{quickActions.map(({ key, label, detail, icon: Icon, accent }) => <button key={key} className="quick-card" onClick={() => chooseAction(key)}><span className={`quick-icon icon-${accent}`}><Icon size={19} /></span><span className="quick-content"><strong>{label}</strong><small>{detail}</small></span><ArrowUpRight size={16} className="quick-arrow" /></button>)}</div>
        </section>

        <section className="inspiration-section" id="inspiration">
          <div className="section-heading"><div><span className="section-kicker">04 / DESCUBRE</span><h2>Un poco de inspiración</h2></div><button className="view-all" onClick={() => toast("Galería de inspiración local")}>Explorar galería <ArrowUpRight size={15} /></button></div>
          <div className="inspiration-grid">{inspirations.map(({ label, icon: Icon, className, prompt: inspirationPrompt }) => <button className={`inspiration-card ${className}`} key={label} onClick={() => { setPrompt(inspirationPrompt); toast(`Idea cargada · ${label}`); }}><span className="inspiration-icon"><Icon size={18} /></span><span className="inspiration-label">{label}</span><ArrowUpRight size={15} /></button>)}</div>
        </section>

        <section className="recent-section">
          <div className="section-heading"><div><span className="section-kicker">05 / RECIENTE</span><h2>Vuelve a tus ideas</h2></div><button className="view-all" onClick={() => toast("Biblioteca local · próximamente")}>Ver biblioteca <ArrowUpRight size={15} /></button></div>
          <div className="recent-grid">{recentPrompts.map((item) => <button className="recent-card" key={item.title} onClick={() => { setPrompt(item.title); setStyle(item.style); }}><div className="recent-thumb" style={{ filter: item.filter, backgroundImage: "url('/manus-storage/lumen-hero_f3544468.jpg')" }}><span>{item.style}</span></div><div className="recent-meta"><strong>{item.title}</strong><span>{item.meta}</span><Copy size={14} /></div></button>)}</div>
        </section>

        <footer className="footer"><div className="footer-brand"><BrandMark /><span>Lumen Local Studio</span></div><span>Creado para explorar. Sin cuenta · sin API · sin enviar tus datos.</span><span>v0.1.0</span></footer>
      </main>
      <button className="mobile-menu" aria-label="Abrir menú"><Menu size={20} /></button>
    </div>
  );
}

export { Home };

// Keep an explicit reference to the unused icon imports in this intentionally icon-rich UI.
void LayoutGrid;
void Plus;
void X;
