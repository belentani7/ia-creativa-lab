import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Clapperboard,
  Clipboard,
  ExternalLink,
  FileText,
  Film,
  Image as ImageIcon,
  Layers3,
  Library,
  Link2,
  LockKeyhole,
  Mic2,
  Music2,
  PanelLeft,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  Trash2,
  WandSparkles,
  Zap,
} from "lucide-react";

type MediaType = "Imagen" | "Vídeo" | "Voz" | "Música";
type Section = "studio" | "library" | "guide";

type Tool = {
  name: string;
  category: MediaType | "Editor";
  descriptor: string;
  detail: string;
  badge: string;
  badgeTone: "mint" | "lilac" | "peach" | "blue";
  url: string;
  note: string;
};

const mediaTypes: { label: MediaType; icon: typeof ImageIcon; accent: string; helper: string }[] = [
  { label: "Imagen", icon: ImageIcon, accent: "peach", helper: "escena, personaje, producto" },
  { label: "Vídeo", icon: Film, accent: "lilac", helper: "shot, movimiento, cámara" },
  { label: "Voz", icon: Mic2, accent: "mint", helper: "locución, doblaje, narración" },
  { label: "Música", icon: Music2, accent: "blue", helper: "tema, disco, identidad sonora" },
];

const tools: Tool[] = [
  { name: "Hailuo / MiniMax", category: "Vídeo", descriptor: "Text-to-video e image-to-video", detail: "Clips cortos con movimiento humano y prompts cinematográficos.", badge: "Créditos gratis", badgeTone: "lilac", url: "https://hailuoai.video/", note: "La cuota, duración y marca de agua dependen de la región y del plan." },
  { name: "Kling AI", category: "Vídeo", descriptor: "Movimiento y consistencia", detail: "Buena opción para probar cámara, acción y continuidad de personaje.", badge: "Free tier", badgeTone: "peach", url: "https://klingai.com/", note: "Puede haber cola y límites diarios en el nivel gratuito." },
  { name: "Pika", category: "Vídeo", descriptor: "Efectos y transformaciones", detail: "Útil para clips breves, estilizados y efectos visuales rápidos.", badge: "Créditos iniciales", badgeTone: "mint", url: "https://pika.art/", note: "Revisa licencia y marca de agua antes de uso comercial." },
  { name: "Leonardo AI", category: "Imagen", descriptor: "Imagen y edición generativa", detail: "Explora estilos, referencias y variaciones desde el navegador.", badge: "Free tier", badgeTone: "mint", url: "https://leonardo.ai/", note: "Las generaciones gratuitas y los derechos dependen del plan." },
  { name: "Ideogram", category: "Imagen", descriptor: "Texto dentro de imágenes", detail: "Especialmente práctico para carteles, portadas y conceptos visuales.", badge: "Créditos gratis", badgeTone: "peach", url: "https://ideogram.ai/", note: "Consulta el plan actual y las condiciones de publicación." },
  { name: "Adobe Firefly", category: "Editor", descriptor: "Generar, rellenar y editar", detail: "Editor web para retoque, composición y creación asistida.", badge: "Prueba gratis", badgeTone: "blue", url: "https://firefly.adobe.com/", note: "Puede pedir cuenta Adobe y limitar créditos generativos." },
  { name: "ElevenLabs", category: "Voz", descriptor: "Texto a voz y clonación", detail: "Locuciones, idiomas y voces personalizadas para tus proyectos.", badge: "Free tier", badgeTone: "blue", url: "https://elevenlabs.io/", note: "Clona solamente tu voz o una voz con autorización explícita." },
  { name: "MiniMax Voice", category: "Voz", descriptor: "Clonación desde una muestra", detail: "Prueba de voz con una grabación limpia y corta.", badge: "Prueba limitada", badgeTone: "lilac", url: "https://www.minimax.io/audio/voices-cloning", note: "La página indica muestras de 10–60 s; la disponibilidad cambia." },
  { name: "Suno", category: "Música", descriptor: "Canciones completas", detail: "Ideas de temas, demos y discos conceptuales desde un prompt.", badge: "Créditos diarios", badgeTone: "peach", url: "https://suno.com/", note: "Revisa el uso comercial, la atribución y la licencia del plan." },
  { name: "Udio", category: "Música", descriptor: "Composición y estilos", detail: "Bocetos musicales y exploración de géneros con letra propia.", badge: "Free tier", badgeTone: "mint", url: "https://www.udio.com/", note: "Los límites y permisos para exportar pueden cambiar." },
];

const starterIdeas: Record<MediaType, string> = {
  Imagen: "Retrato editorial de una protagonista adulta en un estudio de luz ámbar, mirada segura, estética de portada independiente",
  Vídeo: "Una protagonista adulta cruza un pasillo de hotel con luz de neón y se detiene frente a cámara",
  Voz: "Una narradora presenta el primer capítulo de una ficción sonora nocturna, íntima y elegante",
  Música: "Un disco conceptual de pop alternativo nocturno sobre deseo, autonomía y una ciudad que no duerme",
};

const defaultPrompt = `Create a polished editorial image of an adult protagonist in a warm amber studio, confident gaze, intimate but non-explicit mood, cinematic softbox lighting, 50mm lens, shallow depth of field, premium independent magazine cover aesthetic. Preserve adult age, clear consent, tasteful styling, natural anatomy and realistic hands. Avoid minors, coercion, explicit sexual acts, nudity, fetishized violence, identity imitation, extra fingers, text artifacts, watermark.`;

function AppMark() {
  return (
    <div className="brand-lockup">
      <div className="brand-mark"><Sparkles size={17} strokeWidth={2.4} /></div>
      <div>
        <div className="brand-name">LUCID<span>/</span>LAB</div>
        <div className="brand-sub">creative prompt desk</div>
      </div>
    </div>
  );
}

function Home() {
  const [section, setSection] = useState<Section>("studio");
  const [media, setMedia] = useState<MediaType>("Imagen");
  const [idea, setIdea] = useState(starterIdeas.Imagen);
  const [style, setStyle] = useState("Editorial cinematográfico");
  const [framing, setFraming] = useState("Retrato / plano medio");
  const [mood, setMood] = useState("Íntimo, seguro, sofisticado");
  const [negative, setNegative] = useState("menores, coerción, sexo explícito, violencia sexual, manos deformes, texto ilegible, watermark");
  const [adultSafe, setAdultSafe] = useState(true);
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("lucid-presets") || "[]"); } catch { return []; }
  });
  const [toast, setToast] = useState("");

  useEffect(() => {
    localStorage.setItem("lucid-presets", JSON.stringify(saved));
  }, [saved]);

  const filteredTools = useMemo(() => {
    const query = search.toLowerCase().trim();
    return tools.filter((tool) => {
      const matchesSection = section === "studio" ? true : section === "library" ? true : tool.category === media || tool.category === "Editor";
      const matchesSearch = !query || `${tool.name} ${tool.category} ${tool.descriptor}`.toLowerCase().includes(query);
      return matchesSection && matchesSearch;
    });
  }, [search, section, media]);

  const visibleTools = section === "studio" ? tools.filter((tool) => tool.category === media || (media === "Imagen" && tool.category === "Editor")).slice(0, 4) : filteredTools;

  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  const selectMedia = (type: MediaType) => {
    setMedia(type);
    setIdea(starterIdeas[type]);
    if (type === "Imagen") setPrompt(defaultPrompt);
    else setPrompt("");
  };

  const composePrompt = () => {
    const safety = adultSafe ? "adult-only subject, clear consent, tasteful and non-explicit treatment" : "keep the content suitable for a general audience";
    const generated = `${idea.trim() || starterIdeas[media]}. Format: ${media}. Style: ${style}. Framing and technical direction: ${framing}. Mood: ${mood}. ${safety}. Build a coherent, production-ready result with precise details, lighting, texture and subject continuity. Avoid: ${negative}.`;
    setPrompt(generated);
    flash("Prompt compuesto");
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      flash("Copiado al portapapeles");
      window.setTimeout(() => setCopied(false), 1600);
    } catch { flash("Selecciona el texto para copiarlo"); }
  };

  const savePreset = () => {
    const name = `${media} · ${new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}`;
    setSaved((current) => [name, ...current.filter((item) => item !== name)].slice(0, 6));
    flash("Preset guardado en este navegador");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <AppMark />
        <div className="side-label">Workspace</div>
        <nav className="side-nav" aria-label="Navegación principal">
          <button className={section === "studio" ? "nav-item active" : "nav-item"} onClick={() => setSection("studio")}><WandSparkles size={17} /><span>Estudio</span><span className="nav-count">01</span></button>
          <button className={section === "library" ? "nav-item active" : "nav-item"} onClick={() => setSection("library")}><Library size={17} /><span>Directorio IA</span><span className="nav-count">10</span></button>
          <button className={section === "guide" ? "nav-item active" : "nav-item"} onClick={() => setSection("guide")}><FileText size={17} /><span>Guía rápida</span></button>
        </nav>
        <div className="sidebar-spacer" />
        <div className="privacy-card">
          <div className="privacy-icon"><LockKeyhole size={15} /></div>
          <div><strong>Sin modelos locales</strong><p>Este hub no guarda tus archivos ni necesita GPU.</p></div>
        </div>
        <div className="side-footer"><span className="status-dot" /> navegador listo <span className="version">v0.1</span></div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand"><PanelLeft size={18} /><span>Lucid/Lab</span></div>
          <div className="breadcrumb"><span>Workspace</span><ChevronDown size={13} /><b>{section === "studio" ? "Estudio" : section === "library" ? "Directorio IA" : "Guía rápida"}</b></div>
          <div className="top-actions"><span className="online"><span className="status-dot" /> sin conexión API</span><button className="icon-button" aria-label="Ajustes"><Settings2 size={18} /></button></div>
        </header>

        {section === "guide" ? (
          <div className="page-wrap guide-wrap">
            <div className="eyebrow"><ShieldCheck size={14} /> empezar sin GPU</div>
            <h1>Tu laboratorio creativo,<br /><em>sin montar servidores.</em></h1>
            <p className="lead">Usa este panel como una mesa de preparación. Aquí diseñas prompts, guardas presets y saltas al proveedor que tenga créditos gratuitos disponibles.</p>
            <div className="guide-grid">
              <div className="guide-step"><span>01</span><h3>Define la intención</h3><p>Elige imagen, vídeo, voz o música. Describe la escena y deja que el panel ordene la dirección creativa.</p></div>
              <div className="guide-step"><span>02</span><h3>Compón y revisa</h3><p>Incluye cámara, ritmo, sonido, referencias y límites. El texto se queda en tu navegador.</p></div>
              <div className="guide-step"><span>03</span><h3>Abre una herramienta</h3><p>Prueba varias opciones con créditos gratuitos. Las cuotas, licencias y marcas de agua cambian por proveedor.</p></div>
            </div>
            <div className="policy-note"><ShieldCheck size={18} /><div><strong>Contenido adulto responsable</strong><p>El hub permite trabajar una estética adulta sensual o sugerente, pero no está pensado para menores, coerción, suplantación ni sexualidad explícita. Para clonar voz, usa solo tu voz o una autorización verificable.</p></div></div>
          </div>
        ) : section === "library" ? (
          <div className="page-wrap library-wrap">
            <div className="page-heading-row"><div><div className="eyebrow"><Layers3 size={14} /> herramientas externas</div><h1>Directorio <em>IA</em></h1><p>Una selección de puertas de entrada web. “Gratis” suele significar créditos, límites o cola.</p></div><div className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar proveedor..." /></div></div>
            <div className="filter-row">{["Todos", "Imagen", "Vídeo", "Voz", "Música", "Editor"].map((item) => <button key={item} className={item === "Todos" || item === media ? "filter-chip selected" : "filter-chip"} onClick={() => item !== "Todos" && setMedia(item as MediaType)}>{item}</button>)}</div>
            <div className="tool-grid library-grid">{filteredTools.map((tool) => <ToolCard key={tool.name} tool={tool} onOpen={() => flash(`Abriendo ${tool.name}`)} />)}</div>
          </div>
        ) : (
          <div className="page-wrap">
            <section className="hero-row">
              <div><div className="eyebrow"><span className="eyebrow-line" /> prompt desk / 01</div><h1>Hazlo visual.<br /><em>Hazlo tuyo.</em></h1><p className="lead">Un escritorio ligero para pasar de una idea a un prompt listo para imagen, vídeo, voz o música — sin instalar modelos.</p></div>
              <div className="hero-orbit" aria-hidden="true"><div className="orbit orbit-a" /><div className="orbit orbit-b" /><div className="orbit-core"><Sparkles size={22} /></div><span className="orbit-tag tag-a">PROMPT</span><span className="orbit-tag tag-b">REMIX</span><span className="orbit-tag tag-c">EXPORT</span></div>
            </section>

            <section className="studio-grid">
              <div className="composer-card">
                <div className="card-topline"><div><span className="card-index">01</span><span className="card-kicker">creative brief</span></div><span className="autosave"><span className="status-dot" /> guardado local</span></div>
                <div className="media-tabs">{mediaTypes.map(({ label, icon: Icon, accent, helper }) => <button key={label} className={media === label ? `media-tab active ${accent}` : "media-tab"} onClick={() => selectMedia(label)}><Icon size={17} /><span>{label}</span><small>{helper}</small></button>)}</div>
                <div className="field-block"><label>Tu idea base</label><textarea value={idea} onChange={(event) => setIdea(event.target.value)} placeholder="Describe lo que quieres crear..." /></div>
                <div className="field-row"><div className="field-block"><label>Dirección / estilo</label><div className="select-wrap"><select value={style} onChange={(event) => setStyle(event.target.value)}><option>Editorial cinematográfico</option><option>Realismo naturalista</option><option>3D de autor</option><option>Anime sofisticado</option><option>Documental analógico</option></select><ChevronDown size={15} /></div></div><div className="field-block"><label>Encuadre / formato</label><div className="select-wrap"><select value={framing} onChange={(event) => setFraming(event.target.value)}><option>Retrato / plano medio</option><option>Primer plano íntimo</option><option>Plano general narrativo</option><option>9:16 vertical</option><option>16:9 panorámico</option></select><ChevronDown size={15} /></div></div></div>
                <div className="field-row"><div className="field-block"><label>Atmósfera</label><input value={mood} onChange={(event) => setMood(event.target.value)} /></div><div className="field-block"><label>Evitar / negative prompt</label><input value={negative} onChange={(event) => setNegative(event.target.value)} /></div></div>
                <div className="safety-row"><div className="safety-copy"><ShieldCheck size={17} /><div><strong>Marco adulto responsable</strong><span>Solo personas adultas, consentimiento claro y tratamiento no explícito.</span></div></div><button className={adultSafe ? "toggle on" : "toggle"} onClick={() => setAdultSafe(!adultSafe)} aria-label="Activar marco adulto responsable"><span /></button></div>
                <div className="composer-actions"><button className="button primary" onClick={composePrompt}><WandSparkles size={16} /> Componer prompt <span className="button-key">⌘ ↵</span></button><button className="button ghost" onClick={savePreset}><Plus size={16} /> Guardar preset</button></div>
              </div>

              <div className="output-column">
                <div className="output-card"><div className="card-topline"><div><span className="card-index">02</span><span className="card-kicker">ready to use</span></div><button className="copy-button" onClick={copyPrompt}>{copied ? <Check size={15} /> : <Clipboard size={15} />} {copied ? "copiado" : "copiar"}</button></div><div className="prompt-output">{prompt || <span className="output-placeholder">Tu prompt aparecerá aquí cuando compongas la idea.</span>}</div><div className="output-meta"><span><Zap size={14} /> optimizado para {media.toLowerCase()}</span><span>{prompt.length} caracteres</span></div></div>
                <div className="quick-card"><div className="quick-title"><span>Atajos de flujo</span><SlidersHorizontal size={15} /></div><button onClick={() => { setMood("Sensual, elegante, sugerente"); setNegative("menores, coerción, explícito, violencia, deformidades, artefactos"); flash("Tono sensual seguro aplicado"); }}><span className="quick-icon peach"><Sparkles size={15} /></span><span><b>Sensual sin cruzar límites</b><small>adulto · sugerente · no explícito</small></span><ArrowUpRight size={15} /></button><button onClick={() => { setStyle("Cinemático de alto contraste"); setFraming("9:16 vertical"); flash("Preset vertical aplicado"); }}><span className="quick-icon lilac"><Clapperboard size={15} /></span><span><b>Shot vertical para vídeo</b><small>cámara · movimiento · 9:16</small></span><ArrowUpRight size={15} /></button></div>
              </div>
            </section>

            <section className="tools-section"><div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> según tu formato</div><h2>Abre y <em>prueba.</em></h2></div><button className="text-button" onClick={() => setSection("library")}>Ver directorio completo <ArrowUpRight size={15} /></button></div><div className="tool-grid">{visibleTools.map((tool) => <ToolCard key={tool.name} tool={tool} onOpen={() => flash(`Abriendo ${tool.name}`)} />)}</div></section>

            <section className="bottom-row"><div className="saved-card"><div className="section-heading compact"><div><div className="eyebrow"><span className="eyebrow-line" /> tus presets</div><h2>Biblioteca <em>local.</em></h2></div><Library size={18} /></div>{saved.length === 0 ? <div className="empty-state"><FileText size={17} /><span>Aún no has guardado presets.<br /><small>Se quedarán en este navegador.</small></span></div> : <div className="preset-list">{saved.map((item) => <div className="preset-row" key={item}><span className="preset-dot" /><span>{item}</span><Trash2 size={14} onClick={() => setSaved((current) => current.filter((entry) => entry !== item))} /></div>)}</div>}</div><div className="note-card"><div className="note-number">03</div><div><span className="card-kicker">nota de uso</span><h3>Gratis no siempre significa libre de límites.</h3><p>Antes de publicar, comprueba créditos, marca de agua, derechos comerciales y políticas de contenido de cada proveedor.</p><a href="https://help.openai.com/" target="_blank" rel="noreferrer">verifica siempre los términos <ExternalLink size={13} /></a></div></div></section>
          </div>
        )}
      </main>
      {toast && <div className="toast"><Check size={15} /> {toast}</div>}
    </div>
  );
}

function ToolCard({ tool, onOpen }: { tool: Tool; onOpen: () => void }) {
  const Icon = tool.category === "Vídeo" ? Film : tool.category === "Voz" ? Mic2 : tool.category === "Música" ? Music2 : tool.category === "Editor" ? WandSparkles : ImageIcon;
  return <article className="tool-card"><div className="tool-card-top"><div className={`tool-icon ${tool.badgeTone}`}><Icon size={17} /></div><span className={`tool-badge ${tool.badgeTone}`}>{tool.badge}</span></div><div className="tool-category">{tool.category}</div><h3>{tool.name}</h3><p className="tool-descriptor">{tool.descriptor}</p><p className="tool-detail">{tool.detail}</p><div className="tool-footer"><span className="tool-note"><ShieldCheck size={12} /> {tool.note}</span><a href={tool.url} target="_blank" rel="noreferrer" className="open-tool" onClick={onOpen} aria-label={`Abrir ${tool.name}`}><Link2 size={14} /></a></div></article>;
}

export default Home;
