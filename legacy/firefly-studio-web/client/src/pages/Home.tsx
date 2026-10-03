import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { filterQuickActions, type DiscoverFilter } from "@/lib/hubFilters";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowUpRight,
  AudioLines,
  Brush,
  Check,
  ChevronRight,
  Clapperboard,
  Clock3,
  Compass,
  Download,
  Eraser,
  FileAudio,
  Headphones,
  ImageIcon,
  ImagePlus,
  Layers3,
  Library,
  Loader2,
  LogIn,
  Menu,
  Mic2,
  MousePointer2,
  Music2,
  Palette,
  PanelLeft,
  PlayCircle,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Video,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type PointerEvent } from "react";

const modes = [
  { id: "text-to-image", label: "Generar", description: "Texto a imagen", icon: Wand2, accent: "violet" },
  { id: "generative-fill", label: "Relleno", description: "Edita con una máscara", icon: Brush, accent: "cyan" },
  { id: "style-reference", label: "Estilo", description: "Referencia visual", icon: Palette, accent: "pink" },
  { id: "parametric-adjust", label: "Ajustar", description: "Edita con instrucciones", icon: Layers3, accent: "amber" },
] as const;

const workspaces = [
  { id: "image", label: "Imagen", icon: ImageIcon, state: "activo" },
  { id: "audio", label: "Audio", icon: AudioLines, state: "activo" },
  { id: "video", label: "Vídeo", icon: Video, state: "próximamente" },
  { id: "discover", label: "Explorar", icon: Compass, state: "activo" },
  { id: "library", label: "Biblioteca", icon: Library, state: "activo" },
] as const;

type Mode = (typeof modes)[number]["id"];
type Workspace = (typeof workspaces)[number]["id"];

type StudioResult = {
  id?: number;
  imageUrl: string;
  engine?: string;
  providerModel?: string;
  resolvedFallback?: boolean;
  originalPrompt?: string;
  optimizedPrompt?: string;
  optimizationIterations?: number;
  optimizationQualityScore?: number;
};

type AudioResult = {
  id?: number;
  audioUrl: string;
  transcript: string;
  fileName: string;
  language?: string | null;
  durationSeconds?: number | null;
};

const examples = [
  { title: "Botánica nocturna", subtitle: "Editorial · 16:9", prompt: "Bodegón editorial de botánica luminiscente, pétalos translúcidos, sombras violeta profundas y dirección de arte refinada", className: "art-violet" },
  { title: "Geometría silenciosa", subtitle: "Arquitectura · 4:3", prompt: "Interior brutalista sereno, geometría escultórica, luz suave de mañana, piedra y metal cepillado, composición cinematográfica", className: "art-blue" },
  { title: "Ritual de cromo", subtitle: "Producto · 1:1", prompt: "Fotografía de producto de alta gama, objeto de cromo flotando sobre vidrio negro, reflejos iridiscentes e iluminación de estudio", className: "art-pink" },
  { title: "Archivo futuro", subtitle: "Retrato · 3:4", prompt: "Retrato expresivo de un archivo futuro, piel nacarada, tejido cobalto, luz escultórica y estética fine art", className: "art-amber" },
];

const dimensions: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "4:3": { width: 1152, height: 864 },
  "3:4": { width: 864, height: 1152 },
  "16:9": { width: 1344, height: 768 },
  "9:16": { width: 768, height: 1344 },
  "3:2": { width: 1152, height: 768 },
  "2:3": { width: 768, height: 1152 },
};

const imageModes = new Set<Mode>(["text-to-image", "generative-fill", "style-reference", "parametric-adjust"]);
const supportedAudioTypes = new Set(["audio/webm", "audio/mpeg", "audio/mp3", "audio/wav", "audio/wave", "audio/ogg", "audio/m4a", "audio/mp4"]);

function notifyComingSoon(label: string) {
  toast.info(`${label} está preparado para una próxima integración de proveedor.`, {
    description: "El estudio no simula resultados de herramientas que aún no están conectadas.",
  });
}

function readFileAsDataUrl(file: File, maxBytes: number) {
  return new Promise<string>((resolve, reject) => {
    if (file.size > maxBytes) {
      reject(new Error(`El archivo supera el límite de ${Math.floor(maxBytes / (1024 * 1024))} MB.`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
}

function UploadCard({ label, helper, value, onChange, compact = false }: { label: string; helper: string; value?: string; onChange: (value: string) => void; compact?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Elige un archivo de imagen válido.");
      return;
    }
    try {
      onChange(await readFileAsDataUrl(file, 10 * 1024 * 1024));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo leer la imagen.");
    }
  };

  return (
    <button type="button" onClick={() => inputRef.current?.click()} className={`upload-card group ${compact ? "min-h-[122px]" : "min-h-[170px]"}`}>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
      {value ? (
        <div className="relative h-full w-full overflow-hidden rounded-[18px]">
          <img src={value} alt={label} className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080811] via-transparent to-transparent" />
          <span className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-left text-xs font-medium text-white"><span>{label}</span><Check className="h-4 w-4 text-cyan-300" /></span>
        </div>
      ) : (
        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
          <span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-white/70 transition group-hover:border-cyan-300/40 group-hover:bg-cyan-300/10 group-hover:text-cyan-200"><ImagePlus className="h-5 w-5" /></span>
          <span><strong className="block text-sm font-medium text-white/90">{label}</strong><span className="mt-1 block text-xs leading-5 text-white/40">{helper}</span></span>
        </div>
      )}
    </button>
  );
}

function MaskEditor({ image, onMaskChange }: { image?: string; onMaskChange: (mask: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [brushSize, setBrushSize] = useState(52);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 900;
    canvas.height = 580;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
  }, [image]);

  const locate = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * canvas.width, y: ((event.clientY - rect.top) / rect.height) * canvas.height };
  };

  const emitMask = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const output = document.createElement("canvas");
    output.width = canvas.width;
    output.height = canvas.height;
    const ctx = output.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, output.width, output.height);
    ctx.drawImage(canvas, 0, 0);
    onMaskChange(output.toDataURL("image/png"));
  };

  const startDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!image) return;
    drawing.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = locate(event);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(point.x + 0.1, point.y + 0.1);
    ctx.stroke();
  };

  const draw = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const point = locate(event);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!drawing.current) return;
    drawing.current = false;
    emitMask();
  };

  return (
    <div className="space-y-3">
      <div className="mask-editor group">
        {image ? <img src={image} alt="Imagen base para máscara" className="absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_40%,rgba(119,91,255,.18),transparent_45%)]"><div className="text-center"><MousePointer2 className="mx-auto mb-3 h-6 w-6 text-violet-200/70" /><p className="text-sm font-medium text-white/80">Sube una imagen para empezar a marcar</p><p className="mt-1 text-xs text-white/40">Pinta encima del área que quieres transformar</p></div></div>}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] bg-[size:32px_32px] opacity-30" />
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full cursor-crosshair touch-none" onPointerDown={startDrawing} onPointerMove={draw} onPointerUp={stopDrawing} onPointerCancel={stopDrawing} />
        <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-white/60 backdrop-blur-md"><Brush className="h-3 w-3 text-cyan-300" /> Pintar máscara</div>
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-3 py-2 backdrop-blur-md"><Eraser className="h-4 w-4 text-white/50" /><Slider value={[brushSize]} min={18} max={120} step={2} onValueChange={value => setBrushSize(value[0] ?? 52)} className="flex-1" /><span className="w-8 text-right text-[11px] text-white/50">{brushSize}</span></div>
      </div>
    </div>
  );
}

function GeneratedArtwork({ result }: { result: StudioResult }) {
  return <div className="result-artwork group"><img src={result.imageUrl} alt="Resultado generado" className="h-full w-full object-contain" /><div className="result-overlay"><div><span className="rounded-full border border-white/15 bg-black/35 px-2.5 py-1 text-[10px] text-white/65 backdrop-blur-md">{result.engine ?? "Manus Image Generation"}</span>{result.resolvedFallback && <span className="ml-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[10px] text-amber-100/70">fallback</span>}</div><a className="download-button" href={result.imageUrl} download="belentani-studio.png"><Download className="h-4 w-4" /> Descargar</a></div></div>;
}

function EmptyArtwork({ mode }: { mode: Mode }) {
  return <div className="relative flex min-h-[430px] flex-1 items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-[#0e0d19] shadow-2xl shadow-black/20"><div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(141,92,255,.20),transparent_30%),radial-gradient(circle_at_80%_90%,rgba(50,215,255,.14),transparent_30%)]" /><div className="relative max-w-sm px-6 text-center"><div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-[22px] border border-white/10 bg-white/[0.06] shadow-2xl shadow-violet-950/30"><Sparkles className="h-7 w-7 text-violet-200" /></div><p className="text-lg font-semibold tracking-[-0.02em] text-white/90">Tu lienzo creativo está listo</p><p className="mt-2 text-sm leading-6 text-white/45">{mode === "text-to-image" ? "Escribe una idea en el prompt y deja que el estudio construya el primer frame." : "Configura tus referencias en el panel lateral para empezar a editar."}</p><div className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-white/35"><Zap className="h-3 w-3 text-amber-200" /> Motor del estudio en línea</div></div></div>;
}

export default function Home() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace>("image");
  const [mode, setMode] = useState<Mode>("text-to-image");
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState("1:1");
  const [steps, setSteps] = useState(4);
  const [styleStrength, setStyleStrength] = useState(78);
  const [baseImage, setBaseImage] = useState<string>();
  const [styleImage, setStyleImage] = useState<string>();
  const [maskImage, setMaskImage] = useState<string>();
  const [result, setResult] = useState<StudioResult>();
  const [audioResult, setAudioResult] = useState<AudioResult>();
  const [discoverFilter, setDiscoverFilter] = useState<DiscoverFilter>("all");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryTab, setLibraryTab] = useState<"images" | "audio">("images");
  const [progress, setProgress] = useState(0);
  const [fillPreview, setFillPreview] = useState<"mask" | "result">("mask");
  const [lighting, setLighting] = useState([54]);
  const [atmosphere, setAtmosphere] = useState([66]);
  const [fidelity, setFidelity] = useState([72]);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const historyInput = useMemo(() => ({ limit: 24 }), []);
  const imageHistoryQuery = trpc.studio.history.useQuery(historyInput, { enabled: isAuthenticated, retry: false });
  const audioHistoryQuery = trpc.audio.history.useQuery({ limit: 12 }, { enabled: isAuthenticated, retry: false });
  const catalogQuery = trpc.hub.catalog.useQuery(undefined, { staleTime: 60_000 });
  const generateMutation = trpc.studio.generate.useMutation({
    onSuccess: data => {
      setResult(data);
      setFillPreview("result");
      setProgress(100);
      imageHistoryQuery.refetch();
      toast.success("Imagen creada", { description: `${(data.optimizationIterations ?? 0) > 0 ? `Prompt refinado en ${data.optimizationIterations} iteraciones` : "Prompt enriquecido localmente"}${data.resolvedFallback ? "; se usó el fallback disponible del proveedor" : ""}.` });
    },
    onError: error => {
      setProgress(0);
      toast.error("No se pudo generar la imagen", { description: error.message });
    },
  });
  const removeImageMutation = trpc.studio.remove.useMutation({
    onSuccess: () => {
      imageHistoryQuery.refetch();
      toast.success("Creación eliminada de tu biblioteca");
    },
    onError: error => toast.error("No se pudo eliminar", { description: error.message }),
  });
  const transcribeMutation = trpc.audio.transcribe.useMutation({
    onSuccess: data => {
      setAudioResult({
        id: data.id,
        audioUrl: data.url,
        transcript: data.transcript,
        fileName: data.fileName,
        language: data.language,
        durationSeconds: data.durationSeconds,
      });
      audioHistoryQuery.refetch();
      toast.success("Audio transcrito", { description: "El archivo y el texto se han guardado en tu biblioteca personal." });
    },
    onError: error => toast.error("No se pudo transcribir el audio", { description: error.message }),
  });
  const removeAudioMutation = trpc.audio.remove.useMutation({
    onSuccess: () => {
      audioHistoryQuery.refetch();
      toast.success("Transcripción eliminada de tu biblioteca");
    },
    onError: error => toast.error("No se pudo eliminar", { description: error.message }),
  });

  useEffect(() => setFillPreview("mask"), [mode]);
  useEffect(() => {
    if (!generateMutation.isPending) return;
    setProgress(12);
    const interval = window.setInterval(() => setProgress(current => Math.min(current + Math.round(Math.random() * 8 + 3), 92)), 700);
    return () => window.clearInterval(interval);
  }, [generateMutation.isPending]);

  const activeMode = modes.find(item => item.id === mode) ?? modes[0];
  const ActiveIcon = activeMode.icon;
  const modePrompt = mode === "parametric-adjust"
    ? `Ajusta iluminación a ${lighting[0]}%, atmósfera a ${atmosphere[0]}% y fidelidad de estilo a ${fidelity[0]}%. ${prompt}`
    : prompt;

  const switchWorkspace = (next: Workspace) => {
    if (next === "video") {
      notifyComingSoon("Vídeo");
      return;
    }
    if (next === "library") {
      setShowLibrary(true);
      return;
    }
    setWorkspace(next);
    setMobileNavOpen(false);
  };

  const submitGeneration = () => {
    if (!isAuthenticated) {
      toast.info("Inicia sesión con Manus para guardar tus creaciones");
      startLogin();
      return;
    }
    if (!prompt.trim()) {
      toast.error("Escribe un prompt antes de generar");
      return;
    }
    if ((mode === "generative-fill" || mode === "style-reference" || mode === "parametric-adjust") && !baseImage) {
      toast.error("Falta la imagen base", { description: "Sube una imagen para continuar con este módulo." });
      return;
    }
    if (mode === "generative-fill" && !maskImage) {
      toast.error("Pinta una máscara antes de generar");
      return;
    }
    if (mode === "style-reference" && !styleImage) {
      toast.error("Añade una imagen de estilo para continuar");
      return;
    }
    const size = dimensions[ratio];
    generateMutation.mutate({
      mode,
      prompt: modePrompt,
      aspectRatio: ratio as "1:1" | "4:3" | "3:4" | "16:9" | "9:16" | "3:2" | "2:3",
      width: size.width,
      height: size.height,
      steps,
      styleStrength: styleStrength / 100,
      imageBase64: baseImage,
      styleImageBase64: styleImage,
      maskBase64: maskImage,
    });
  };

  const selectExample = (example: (typeof examples)[number]) => {
    setWorkspace("image");
    setMode("text-to-image");
    setPrompt(example.prompt);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearStudio = () => {
    setResult(undefined);
    setPrompt("");
    setBaseImage(undefined);
    setStyleImage(undefined);
    setMaskImage(undefined);
    setProgress(0);
    setFillPreview("mask");
  };

  const handleAudioChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!isAuthenticated) {
      toast.info("Inicia sesión con Manus para transcribir y guardar el audio");
      startLogin();
      return;
    }
    const mimeType = file.type || "audio/mpeg";
    if (!supportedAudioTypes.has(mimeType)) {
      toast.error("Formato no compatible", { description: "Usa WEBM, MP3, WAV, OGG o M4A." });
      return;
    }
    try {
      const audioDataUrl = await readFileAsDataUrl(file, 16 * 1024 * 1024);
      transcribeMutation.mutate({
        audioDataUrl,
        fileName: file.name || "audio",
        mimeType: mimeType as "audio/webm" | "audio/mpeg" | "audio/mp3" | "audio/wav" | "audio/wave" | "audio/ogg" | "audio/m4a" | "audio/mp4",
        language: "es",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo leer el audio.");
    } finally {
      event.target.value = "";
    }
  };

  const activateQuickAction = (action: { id: string; label: string; mode: string; availability: "active" | "planned" }) => {
    if (action.availability !== "active") {
      notifyComingSoon(action.label);
      return;
    }
    if (action.mode === "audio") {
      setWorkspace("audio");
      return;
    }
    if (!imageModes.has(action.mode as Mode)) return;
    setWorkspace("image");
    setMode(action.mode as Mode);
    const actionPrompts: Record<string, string> = {
      "generate-image": "Construye una imagen editorial precisa con luz cinematográfica, composición intencional y materiales expresivos.",
      "edit-image": "Refina la iluminación y el ambiente de la imagen manteniendo el sujeto y el encuadre.",
      "generative-fill": "Integra un nuevo detalle de manera coherente dentro del área enmascarada.",
      "expand-image": "Extiende la escena más allá del borde con una continuación coherente de luz, textura y perspectiva.",
      "remove-object": "Elimina el elemento marcado y reconstruye el fondo de forma imperceptible.",
      "style-reference": "Traslada el lenguaje visual de la referencia sin cambiar el sujeto principal.",
    };
    setPrompt(actionPrompts[action.id] ?? "");
    if (action.mode !== "text-to-image") {
      toast.info(`${action.label}: carga una imagen base para empezar.`);
    }
  };

  const catalog = catalogQuery.data;
  const quickActions = catalog?.quickActions ?? [];
  const filteredQuickActions = filterQuickActions(quickActions, discoverFilter);
  const discoverFilters = [
    { id: "all", label: "Todo" },
    { id: "active", label: "Activas" },
    { id: "image", label: "Imagen" },
    { id: "audio", label: "Audio" },
    { id: "video", label: "Vídeo" },
    { id: "planned", label: "Próximas" },
  ] as const;

  return (
    <div className="studio-shell min-h-screen overflow-x-hidden bg-[#080810] text-white">
      <header className="topbar sticky top-0 z-40 border-b border-white/[0.07] bg-[#090912]/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3"><button type="button" onClick={() => setMobileNavOpen(value => !value)} className="icon-button lg:hidden" aria-label="Abrir navegación"><Menu className="h-5 w-5" /></button><div className="brand-mark"><Sparkles className="h-4 w-4" /></div><div><div className="flex items-center gap-2"><span className="text-[15px] font-semibold tracking-[-0.02em] text-white">Belentani</span><span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-violet-200">Studio</span></div><p className="hidden text-[10px] tracking-[0.18em] text-white/30 sm:block">LABORATORIO CREATIVO</p></div></div>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Navegación principal"><button type="button" className={`nav-link ${workspace === "image" ? "nav-link-active" : ""}`} onClick={() => switchWorkspace("image")}>Crear</button><button type="button" className={`nav-link ${workspace === "discover" ? "nav-link-active" : ""}`} onClick={() => switchWorkspace("discover")}>Explorar</button><button type="button" className="nav-link" onClick={() => setShowLibrary(true)}>Biblioteca</button></nav>
          <div className="flex items-center gap-2"><div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] text-white/45 sm:flex"><span className="status-dot" /> Servicios activos</div>{isAuthenticated ? <button type="button" onClick={logout} className="user-chip" title="Cerrar sesión"><span className="avatar">{(user?.name ?? "U").slice(0, 1).toUpperCase()}</span><span className="hidden max-w-[100px] truncate text-xs text-white/70 sm:inline">{user?.name ?? "Creator"}</span><ChevronRight className="h-3.5 w-3.5 rotate-90 text-white/30" /></button> : <Button onClick={startLogin} size="sm" className="rounded-full bg-white text-[#11111b] hover:bg-violet-100"><LogIn className="mr-1.5 h-3.5 w-3.5" /> Entrar</Button>}</div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1500px]">
        <aside className={`${mobileNavOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-[72px] left-0 z-30 w-[255px] border-r border-white/[0.07] bg-[#0a0a13] p-4 transition-transform duration-200 lg:sticky lg:top-[72px] lg:block lg:h-[calc(100vh-72px)] lg:w-[230px] lg:translate-x-0 lg:bg-transparent lg:p-5`}>
          <div className="mb-5 flex items-center justify-between lg:hidden"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Espacios</span><button type="button" className="icon-button" onClick={() => setMobileNavOpen(false)} aria-label="Cerrar navegación"><X className="h-4 w-4" /></button></div>
          <div className="mb-5"><p className="eyebrow mb-3">Crear</p><div className="space-y-1.5">{workspaces.map(item => { const Icon = item.icon; const active = (item.id === "image" && workspace === "image") || (item.id === "audio" && workspace === "audio") || (item.id === "discover" && workspace === "discover"); return <button type="button" key={item.id} onClick={() => switchWorkspace(item.id)} className={`module-link ${active ? "module-link-active" : ""}`} aria-current={active ? "page" : undefined}><span className={`module-icon module-icon-${item.id === "audio" ? "cyan" : item.id === "discover" ? "pink" : item.id === "video" ? "amber" : "violet"}`}><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1 text-left"><strong className="block text-[13px] font-medium">{item.label}</strong><small className="mt-0.5 block truncate text-[10px] text-white/35">{item.state === "activo" ? "Disponible" : "Proveedor pendiente"}</small></span>{item.state === "activo" ? <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,.65)]" /> : <span className="soon-tag">pronto</span>}</button>; })}</div></div>
          <div className="side-divider" />
          <div className="space-y-1.5"><p className="eyebrow mb-3">Biblioteca</p><button type="button" onClick={() => { setLibraryTab("images"); setShowLibrary(true); }} className="secondary-link"><Clock3 className="h-4 w-4" /> Imágenes <span className="ml-auto rounded-full bg-white/[0.07] px-2 py-0.5 text-[10px] text-white/45">{imageHistoryQuery.data?.length ?? 0}</span></button><button type="button" onClick={() => { setLibraryTab("audio"); setShowLibrary(true); }} className="secondary-link"><Headphones className="h-4 w-4" /> Audio <span className="ml-auto rounded-full bg-white/[0.07] px-2 py-0.5 text-[10px] text-white/45">{audioHistoryQuery.data?.length ?? 0}</span></button></div>
          <div className="absolute bottom-5 left-4 right-4 hidden rounded-2xl border border-violet-300/10 bg-gradient-to-br from-violet-500/[0.10] to-cyan-400/[0.05] p-4 lg:block"><div className="mb-3 flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-xl bg-violet-400/15 text-violet-200"><Sparkles className="h-3.5 w-3.5" /></span><span className="text-xs font-medium text-white/75">Un solo espacio</span></div><p className="text-[11px] leading-5 text-white/40">Imagen activa, audio disponible y módulos futuros descritos con transparencia.</p></div>
        </aside>

        <main className="min-w-0 flex-1 px-4 pb-16 pt-7 sm:px-6 lg:px-8 lg:pt-10">
          {workspace === "image" && <>
            <div className="mb-7 flex flex-col justify-between gap-5 xl:flex-row xl:items-end"><div><div className="mb-3 flex items-center gap-2 text-[11px] text-white/35"><span className="inline-flex items-center gap-1.5"><PanelLeft className="h-3.5 w-3.5" /> Crear</span><ChevronRight className="h-3 w-3" /><span className="text-white/60">{activeMode.label}</span></div><h1 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">Convierte ideas en <span className="gradient-text">lenguaje visual.</span></h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">Un laboratorio de imagen con dirección, edición guiada, memoria de prompts y resultados en S3.</p></div><div className="flex items-center gap-2"><button type="button" onClick={clearStudio} className="ghost-button"><Plus className="h-4 w-4" /> Nuevo lienzo</button><button type="button" onClick={() => setShowLibrary(true)} className="ghost-button"><Layers3 className="h-4 w-4" /> Biblioteca <ArrowUpRight className="h-3.5 w-3.5" /></button></div></div>

            <section className="workspace-grid">
              <div className="workspace-stage">
                <div className="stage-toolbar"><div className="flex items-center gap-2"><span className={`tool-mode-dot ${activeMode.accent}`} /><span className="text-xs font-medium text-white/75">{activeMode.label}</span><span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-white/30">{ratio}</span></div>{mode === "generative-fill" && result ? <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1"><button type="button" onClick={() => setFillPreview("mask")} className={`rounded-full px-2 py-1 text-[10px] transition ${fillPreview === "mask" ? "bg-white/10 text-white" : "text-white/35"}`}>Máscara</button><button type="button" onClick={() => setFillPreview("result")} className={`rounded-full px-2 py-1 text-[10px] transition ${fillPreview === "result" ? "bg-cyan-300/15 text-cyan-100" : "text-white/35"}`}>Resultado</button></div> : <div className="flex items-center gap-1"><span className="text-[10px] text-white/30">Borrador</span><span className="h-1.5 w-1.5 rounded-full bg-amber-300/80" /></div>}</div>
                {mode === "generative-fill" ? (result && fillPreview === "result" ? <GeneratedArtwork result={result} /> : <MaskEditor image={baseImage} onMaskChange={setMaskImage} />) : result ? <GeneratedArtwork result={result} /> : <EmptyArtwork mode={mode} />}
                <div className="stage-footer"><div className="flex items-center gap-2 text-[11px] text-white/35"><span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-cyan-300" /> Guardado automático</span><span className="h-3 w-px bg-white/10" /><span>{result ? "1 variación lista" : "Sin variaciones todavía"}</span></div><div className="flex items-center gap-1"><button type="button" className="tool-button" onClick={() => notifyComingSoon("Deshacer")} aria-label="Deshacer"><span>↶</span></button><button type="button" className="tool-button" onClick={() => notifyComingSoon("Rehacer")} aria-label="Rehacer"><span>↷</span></button></div></div>
              </div>

              <aside className="control-panel">
                <div className="panel-header"><div><p className="eyebrow">Dirección creativa</p><h2 className="mt-1 text-base font-semibold text-white/90">Dale forma al encuadre</h2></div><span className="panel-number">01</span></div>
                <div className="control-section"><div className="section-heading"><span>Herramienta</span><span className="section-count">04</span></div><div className="grid grid-cols-2 gap-2">{modes.map(item => { const Icon = item.icon; const selected = mode === item.id; return <button type="button" key={item.id} onClick={() => setMode(item.id)} className={`rounded-xl border px-3 py-2.5 text-left transition ${selected ? "border-violet-300/35 bg-violet-300/10 text-white" : "border-white/10 bg-white/[0.025] text-white/55 hover:border-white/20 hover:text-white"}`} aria-pressed={selected}><span className="flex items-center gap-2 text-[11px] font-medium"><Icon className="h-3.5 w-3.5" /> {item.label}</span></button>; })}</div></div>
                <div className="prompt-block"><label className="field-label" htmlFor="prompt">Prompt</label><Textarea id="prompt" value={prompt} onChange={event => setPrompt(event.target.value)} placeholder={mode === "generative-fill" ? "Describe qué debe aparecer dentro de la máscara..." : mode === "style-reference" ? "Describe cómo la referencia debe transformar la imagen base..." : mode === "parametric-adjust" ? "Describe el ambiente o edición final..." : "Una habitación silenciosa, objetos de cromo y luz de última hora..."} className="prompt-input" /><div className="mt-2 flex items-center justify-between text-[10px] text-white/30"><span>El estudio lo refina antes de generar.</span><span>{prompt.length}/4000</span></div>{result?.optimizedPrompt && <div className="mt-3 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.04] p-3"><div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.14em] text-cyan-100/70"><Sparkles className="h-3 w-3" /> Último prompt refinado</span><span className="text-[10px] text-white/35">{result.optimizationIterations ?? 0} iteraciones · {result.optimizationQualityScore ?? 0}/100</span></div><p className="mt-2 line-clamp-3 text-[11px] leading-5 text-white/55">{result.optimizedPrompt}</p><button type="button" onClick={() => setPrompt(result.optimizedPrompt ?? "")} className="mt-2 text-[10px] text-cyan-100/70 transition hover:text-white">Usar última versión refinada</button></div>}</div>

                {mode === "generative-fill" && <div className="control-section"><div className="section-heading"><span>Imagen de origen</span><span className="section-count">01</span></div><UploadCard label="Imagen base" helper="PNG o JPG de hasta 10 MB" value={baseImage} onChange={setBaseImage} compact /></div>}
                {mode === "style-reference" && <div className="control-section"><div className="section-heading"><span>Pila de referencias</span><span className="section-count">02</span></div><div className="grid grid-cols-2 gap-2"><UploadCard label="Imagen base" helper="Tu lienzo" value={baseImage} onChange={setBaseImage} compact /><UploadCard label="Imagen de estilo" helper="Dirección visual" value={styleImage} onChange={setStyleImage} compact /></div><div className="slider-row mt-4"><div className="flex items-center justify-between"><label className="field-label">Intensidad de estilo</label><span className="slider-value">{styleStrength}%</span></div><Slider value={[styleStrength]} onValueChange={value => setStyleStrength(value[0] ?? 78)} min={0} max={100} step={1} className="mt-3" /></div></div>}
                {mode === "parametric-adjust" && <div className="control-section space-y-4"><div className="section-heading"><span>Ajuste fino</span><span className="section-count">03</span></div>{[["Iluminación", lighting, setLighting, "amber"], ["Atmósfera", atmosphere, setAtmosphere, "cyan"], ["Fidelidad de estilo", fidelity, setFidelity, "violet"]].map(([label, value, setter, accent]) => <div key={String(label)}><div className="flex items-center justify-between"><label className="field-label">{String(label)}</label><span className={`slider-value slider-${String(accent)}`}>{(value as number[])[0]}%</span></div><Slider value={value as number[]} onValueChange={setter as (value: number[]) => void} min={0} max={100} step={1} className="mt-3" /></div>)}</div>}
                <div className="control-section"><div className="section-heading"><span>Formato</span><span className="section-count">{dimensions[ratio]?.width} × {dimensions[ratio]?.height}</span></div><div className="ratio-grid">{Object.keys(dimensions).map(item => <button type="button" key={item} onClick={() => setRatio(item)} className={`ratio-button ${ratio === item ? "ratio-button-active" : ""}`} aria-pressed={ratio === item}><span className="ratio-icon" style={{ aspectRatio: item.replace(":", "/") }} /><span>{item}</span></button>)}</div><div className="mt-4 flex items-center justify-between"><label className="field-label">Pasadas de calidad</label><div className="stepper"><button type="button" onClick={() => setSteps(value => Math.max(4, value - 1))} aria-label="Reducir pasadas">−</button><span>{steps}</span><button type="button" onClick={() => setSteps(value => Math.min(50, value + 1))} aria-label="Aumentar pasadas">+</button></div></div></div>
                <div className="panel-action"><Button onClick={submitGeneration} disabled={generateMutation.isPending || authLoading} className="generate-button"><span className="generate-shine" /><span className="relative flex items-center gap-2">{generateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{generateMutation.isPending ? "Optimizando y componiendo..." : isAuthenticated ? "Generar imagen" : "Entrar y generar"}</span><span className="relative text-[10px] text-white/55">{generateMutation.isPending ? `~${progress}%` : "⌘ ↵"}</span></Button>{generateMutation.isPending && <><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><p className="mt-2 text-center text-[10px] text-cyan-100/45">Progreso estimado mientras responde el proveedor.</p></>}<p className="mt-2 text-center text-[10px] leading-4 text-white/28">Al generar, aceptas explorar de forma responsable.</p></div>
              </aside>
            </section>
            <section className="mt-12"><div className="mb-5 flex items-end justify-between"><div><p className="eyebrow">Puntos de partida</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-white/90">Empieza con una dirección</h2></div><button type="button" className="text-xs text-white/45 transition hover:text-white" onClick={() => setPrompt("Estudio visual con contraste de materiales, luz cinematográfica y una composición editorial.")}>Usar lienzo vacío <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></button></div><div className="example-grid">{examples.map(example => <button type="button" key={example.title} onClick={() => selectExample(example)} className={`example-card ${example.className}`}><span className="example-glow" /><span className="example-copy"><strong>{example.title}</strong><small>{example.subtitle}</small></span><span className="example-arrow"><ArrowUpRight className="h-4 w-4" /></span></button>)}</div></section>
          </>}

          {workspace === "audio" && <section className="mx-auto max-w-5xl"><div className="mb-8"><p className="eyebrow">Audio activo</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">Convierte voz en <span className="gradient-text">texto editable.</span></h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">La transcripción se realiza con el servicio de audio disponible, conserva el archivo en S3 y guarda el resultado en tu biblioteca privada.</p></div><div className="grid gap-5 lg:grid-cols-[1fr_.9fr]"><div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/20 sm:p-7"><div className="flex items-start justify-between gap-4"><div><div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.08] text-cyan-100"><Mic2 className="h-5 w-5" /></div><h2 className="text-lg font-semibold text-white/90">Transcribir archivo</h2><p className="mt-2 max-w-md text-sm leading-6 text-white/45">WEBM, MP3, WAV, OGG o M4A, hasta 16 MB. El procesamiento se inicia solo cuando eliges un archivo.</p></div><span className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-cyan-100/70">Disponible</span></div><input ref={audioInputRef} type="file" accept="audio/webm,audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/mp4,audio/m4a" className="hidden" onChange={handleAudioChange} /><button type="button" onClick={() => audioInputRef.current?.click()} disabled={transcribeMutation.isPending} className="mt-7 flex min-h-40 w-full flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-[radial-gradient(circle_at_50%_0%,rgba(103,232,249,.1),transparent_55%)] px-6 text-center transition hover:border-cyan-300/35 hover:bg-cyan-300/[0.04] disabled:cursor-wait disabled:opacity-70"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.07] text-cyan-100">{transcribeMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileAudio className="h-5 w-5" />}</span><strong className="mt-4 text-sm font-medium text-white/90">{transcribeMutation.isPending ? "Transcribiendo con precisión..." : "Elegir archivo de audio"}</strong><span className="mt-1 text-xs text-white/40">Los archivos se conservan bajo tu cuenta en el almacenamiento administrado.</span></button></div><div className="rounded-[28px] border border-white/10 bg-[#0d0d17] p-5 sm:p-7">{audioResult ? <><div className="flex items-center justify-between gap-3"><div><p className="eyebrow">Último resultado</p><h2 className="mt-1 text-lg font-semibold text-white/90">{audioResult.fileName}</h2></div><span className="rounded-full border border-violet-300/15 bg-violet-300/[0.08] px-2.5 py-1 text-[10px] text-violet-100/70">{audioResult.language?.toUpperCase() ?? "AUTO"}</span></div><audio controls className="mt-5 w-full" src={audioResult.audioUrl}>Tu navegador no permite reproducir audio.</audio><p className="mt-5 max-h-64 overflow-y-auto whitespace-pre-wrap text-sm leading-7 text-white/65">{audioResult.transcript}</p><button type="button" onClick={() => navigator.clipboard.writeText(audioResult.transcript).then(() => toast.success("Transcripción copiada"))} className="mt-5 text-xs text-cyan-100/70 transition hover:text-white">Copiar texto</button></> : <div className="flex min-h-72 flex-col items-center justify-center text-center"><AudioLines className="h-8 w-8 text-white/20" /><p className="mt-4 text-sm font-medium text-white/70">Tu transcripción aparecerá aquí</p><p className="mt-2 max-w-xs text-xs leading-5 text-white/35">No se crean ejemplos inventados: el panel muestra únicamente resultados reales de tu cuenta.</p></div>}</div></div></section>}

          {workspace === "discover" && <section><div className="mb-8"><p className="eyebrow">Explorar herramientas</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">Un mapa práctico para <span className="gradient-text">empezar a crear.</span></h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">Acciones rápidas conectadas a flujos reales. Las herramientas que dependen de un proveedor futuro se identifican antes de que las elijas.</p></div><div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{catalog?.categories.map(category => <div key={category.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-white/80">{category.label}</span><span className={`rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] ${category.availability === "active" ? "bg-cyan-300/10 text-cyan-100/70" : "bg-amber-300/10 text-amber-100/70"}`}>{category.availability === "active" ? "activo" : "pronto"}</span></div><p className="mt-3 text-[11px] leading-5 text-white/40">{category.description}</p></div>)}</div><div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Filtros de herramientas">{discoverFilters.map(filter => <button type="button" key={filter.id} role="tab" aria-selected={discoverFilter === filter.id} onClick={() => setDiscoverFilter(filter.id)} className={`rounded-full border px-3 py-1.5 text-xs transition ${discoverFilter === filter.id ? "border-cyan-300/35 bg-cyan-300/[0.1] text-cyan-50" : "border-white/10 bg-white/[0.03] text-white/45 hover:border-white/20 hover:text-white"}`}>{filter.label}</button>)}</div><p className="mb-4 text-xs text-white/35" aria-live="polite">{filteredQuickActions.length} {filteredQuickActions.length === 1 ? "herramienta visible" : "herramientas visibles"}</p><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{filteredQuickActions.map(action => { const icon = action.mode === "audio" ? AudioLines : action.mode === "video" ? Clapperboard : action.mode === "voice" ? Mic2 : action.mode === "music" ? Music2 : action.id === "remove-object" ? Eraser : action.id === "expand-image" ? ArrowUpRight : Wand2; const Icon = icon; return <button type="button" key={action.id} onClick={() => activateQuickAction(action)} className="group rounded-[22px] border border-white/10 bg-white/[0.025] p-5 text-left transition hover:-translate-y-0.5 hover:border-violet-300/25 hover:bg-white/[0.05]"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-violet-100 transition group-hover:border-violet-300/30 group-hover:bg-violet-300/10"><Icon className="h-4 w-4" /></span><span className={`rounded-full px-2 py-1 text-[9px] uppercase tracking-[0.12em] ${action.availability === "active" ? "bg-cyan-300/10 text-cyan-100/70" : "bg-amber-300/10 text-amber-100/70"}`}>{action.availability === "active" ? "abrir" : "próximo"}</span></div><strong className="mt-5 block text-sm font-medium text-white/85">{action.label}</strong><small className="mt-1 block text-xs leading-5 text-white/40">{action.availability === "active" ? "Inicia un flujo disponible en Belentani Studio." : "Requiere un proveedor que aún no está conectado."}</small></button>; })}</div>{filteredQuickActions.length === 0 && <div className="mt-3 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/40">No hay herramientas en este filtro todavía.</div>}</section>}

          {!isAuthenticated && <section className="login-strip mt-10"><div className="flex items-center gap-4"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-violet-200"><LogIn className="h-5 w-5" /></div><div><h3 className="text-sm font-semibold text-white/90">Tu estudio, guardado</h3><p className="mt-1 text-xs leading-5 text-white/45">Inicia sesión con Manus OAuth para guardar imágenes, transcripciones y tu historial creativo.</p></div></div><Button onClick={startLogin} variant="outline" className="mt-4 rounded-full border-white/15 bg-white/[0.04] text-white hover:bg-white/10 sm:mt-0">Entrar con Manus <ChevronRight className="ml-1 h-4 w-4" /></Button></section>}
        </main>
      </div>

      {showLibrary && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="library-title"><div className="gallery-modal"><div className="flex items-start justify-between border-b border-white/[0.07] p-5 sm:p-7"><div><p className="eyebrow">Biblioteca personal</p><h2 id="library-title" className="mt-1 text-2xl font-semibold tracking-[-0.04em]">Tu biblioteca creativa</h2><p className="mt-2 text-sm text-white/40">Recupera imágenes, prompts optimizados y transcripciones reales de tu cuenta.</p><div className="mt-4 flex gap-2" role="tablist" aria-label="Tipos de contenido"><button type="button" role="tab" aria-selected={libraryTab === "images"} onClick={() => setLibraryTab("images")} className={`rounded-full px-3 py-1.5 text-xs transition ${libraryTab === "images" ? "bg-white text-black" : "bg-white/[0.06] text-white/55 hover:text-white"}`}>Imágenes</button><button type="button" role="tab" aria-selected={libraryTab === "audio"} onClick={() => setLibraryTab("audio")} className={`rounded-full px-3 py-1.5 text-xs transition ${libraryTab === "audio" ? "bg-white text-black" : "bg-white/[0.06] text-white/55 hover:text-white"}`}>Audio</button></div></div><button type="button" className="icon-button" onClick={() => setShowLibrary(false)} aria-label="Cerrar biblioteca"><X className="h-4 w-4" /></button></div><div className="max-h-[65vh] overflow-y-auto p-5 sm:p-7">{!isAuthenticated ? <div className="empty-gallery"><LogIn className="mx-auto mb-4 h-6 w-6 text-violet-200" /><p className="text-sm font-medium text-white/80">Inicia sesión para ver tu biblioteca</p><Button onClick={startLogin} className="mt-5 rounded-full bg-white text-black hover:bg-violet-100">Entrar con Manus</Button></div> : libraryTab === "images" ? imageHistoryQuery.isLoading ? <div className="empty-gallery"><Loader2 className="mx-auto mb-4 h-6 w-6 animate-spin text-white/45" /><p className="text-sm text-white/45">Cargando imágenes...</p></div> : imageHistoryQuery.data?.length ? <div className="gallery-grid">{imageHistoryQuery.data.map(item => <div key={item.id} className="gallery-item"><img src={item.imageUrl} alt={item.prompt} /><div className="gallery-item-overlay"><span className="flex min-w-0 items-center gap-2"><span className="max-w-[62%] truncate text-[11px] text-white/80" title={item.optimizedPrompt ?? item.prompt}>{item.optimizedPrompt ?? item.prompt}</span>{item.optimizationQualityScore > 0 && <span className="shrink-0 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-1.5 py-0.5 text-[9px] text-cyan-100/65">refinado {item.optimizationQualityScore}/100</span>}</span><div className="flex items-center gap-1"><button type="button" onClick={() => { setPrompt(item.optimizedPrompt ?? item.prompt); setWorkspace("image"); setShowLibrary(false); toast.success("Prompt restaurado", { description: "La versión persistida está lista para volver a generar." }); }} className="mini-action" aria-label="Restaurar prompt" title="Restaurar prompt"><Wand2 className="h-3.5 w-3.5" /></button><a href={item.imageUrl} download={`belentani-${item.id}.png`} className="mini-action" aria-label="Descargar"><Download className="h-3.5 w-3.5" /></a><button type="button" onClick={() => removeImageMutation.mutate({ id: item.id })} className="mini-action mini-action-danger" aria-label="Eliminar"><Trash2 className="h-3.5 w-3.5" /></button></div></div></div>)}</div> : <div className="empty-gallery"><ImagePlus className="mx-auto mb-4 h-6 w-6 text-white/30" /><p className="text-sm text-white/50">Aún no tienes imágenes guardadas.</p></div> : audioHistoryQuery.isLoading ? <div className="empty-gallery"><Loader2 className="mx-auto mb-4 h-6 w-6 animate-spin text-white/45" /><p className="text-sm text-white/45">Cargando transcripciones...</p></div> : audioHistoryQuery.data?.length ? <div className="space-y-3">{audioHistoryQuery.data.map(item => <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><FileAudio className="h-4 w-4 shrink-0 text-cyan-100/70" /><strong className="truncate text-sm text-white/80">{item.fileName}</strong><span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[9px] text-white/45">{item.language?.toUpperCase() ?? "AUTO"}</span></div><p className="mt-3 max-h-20 overflow-hidden text-xs leading-5 text-white/45">{item.transcript}</p></div><div className="flex shrink-0 items-center gap-1"><button type="button" onClick={() => { setAudioResult(item); setWorkspace("audio"); setShowLibrary(false); }} className="mini-action" aria-label="Abrir transcripción"><PlayCircle className="h-3.5 w-3.5" /></button><a href={item.audioUrl} download={item.fileName} className="mini-action" aria-label="Descargar audio"><Download className="h-3.5 w-3.5" /></a><button type="button" onClick={() => removeAudioMutation.mutate({ id: item.id })} className="mini-action mini-action-danger" aria-label="Eliminar transcripción"><Trash2 className="h-3.5 w-3.5" /></button></div></div></article>)}</div> : <div className="empty-gallery"><Headphones className="mx-auto mb-4 h-6 w-6 text-white/30" /><p className="text-sm text-white/50">Aún no tienes transcripciones guardadas.</p></div>}</div></div></div>}
    </div>
  );
}
