import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  Check,
  CircleDashed,
  Clock3,
  FileImage,
  Film,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";

const categories = ["personal", "gatos/humor", "personaje virtual"] as const;
const platforms = [
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "telegram",
] as const;
const publicationStatuses = [
  "privado",
  "pendiente de auditoría",
  "publicado",
] as const;

type Category = (typeof categories)[number];

function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <div
          className="relative mt-1 hidden h-14 w-10 shrink-0 items-center justify-center rounded-[12px] border-2 border-primary/70 bg-primary/[0.06] shadow-[0_0_0_4px_hsl(var(--primary)/0.06)] sm:flex"
          aria-hidden="true"
        >
          <span className="h-7 w-1 rounded-full bg-primary" />
          <span className="absolute bottom-2 h-1 w-4 rounded-full bg-primary/40" />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            {eyebrow} <span className="text-muted-foreground/50">/ 9:16</span>
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      {action}
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  hint: string;
  icon: typeof FileImage;
  tone: string;
}) {
  return (
    <Card className="border-border/70 bg-card/80 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">
              {value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          </div>
          <div className={`rounded-2xl p-3 ${tone}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    publicado: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
    privado: "border-slate-400/30 bg-slate-400/10 text-slate-700",
    "pendiente de auditoría":
      "border-amber-500/30 bg-amber-500/10 text-amber-700",
    pending: "border-amber-500/30 bg-amber-500/10 text-amber-700",
    approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
    rejected: "border-rose-500/30 bg-rose-500/10 text-rose-700",
  };
  return (
    <Badge variant="outline" className={styles[status] ?? ""}>
      {status}
    </Badge>
  );
}

export function Overview() {
  const { data: stats, isLoading } = trpc.dashboard.useQuery();
  const { data: activity = [] } = trpc.activity.useQuery();
  const { data: integrations } = trpc.integrations.useQuery();
  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="Control room"
        title="Todo el flujo, en un solo lugar"
        description="Gestiona activos verticales, revisión humana, programación y publicación oficial sin perder la trazabilidad de cada pieza."
        action={
          <Button
            onClick={() =>
              toast.info("Selecciona Banco multimedia para añadir una pieza")
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Añadir contenido
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Banco multimedia"
          value={isLoading ? "—" : (stats?.totalContent ?? 0)}
          hint="piezas registradas"
          icon={FileImage}
          tone="bg-violet-500/10 text-violet-700"
        />
        <MetricCard
          label="Pendiente de revisión"
          value={isLoading ? "—" : (stats?.pendingReview ?? 0)}
          hint="requieren tu decisión"
          icon={ShieldCheck}
          tone="bg-amber-500/10 text-amber-700"
        />
        <MetricCard
          label="Programado"
          value={isLoading ? "—" : (stats?.scheduled ?? 0)}
          hint="publicaciones activas"
          icon={CalendarDays}
          tone="bg-sky-500/10 text-sky-700"
        />
        <MetricCard
          label="Publicado"
          value={isLoading ? "—" : (stats?.published ?? 0)}
          hint="confirmado por API"
          icon={Send}
          tone="bg-emerald-500/10 text-emerald-700"
        />
      </div>
      {activity.some(item => item.type === "error") && (
        <Card className="border-rose-500/30 bg-rose-500/[0.05] shadow-sm">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              <div>
                <p className="font-medium text-rose-800">
                  Hay errores que requieren atención
                </p>
                <p className="mt-1 text-sm text-rose-700">
                  {activity.filter(item => item.type === "error").length}{" "}
                  evento(s) de publicación o integración están registrados.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => window.location.assign("/activity")}
            >
              Ver actividad
            </Button>
          </CardContent>
        </Card>
      )}
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Actividad reciente</CardTitle>
            <CardDescription>
              Últimos eventos del espacio de trabajo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <EmptyState
                icon={CircleDashed}
                title="Aún no hay actividad"
                description="Cuando subas, revises o programes una pieza aparecerá aquí."
              />
            ) : (
              <div className="space-y-4">
                {activity.slice(0, 6).map(item => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
                      <Clock3 className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{item.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Conectividad</CardTitle>
            <CardDescription>
              Solo se muestran estados; los secretos nunca aparecen aquí.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {platforms.map(platform => {
              const item = integrations?.[platform];
              return (
                <div
                  key={platform}
                  className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-3"
                >
                  <div>
                    <p className="text-sm font-medium capitalize">{platform}</p>
                    <p className="text-xs text-muted-foreground">
                      {item?.mode ?? "API oficial"}
                    </p>
                  </div>
                  <StatusBadge
                    status={item?.configured ? "configurado" : "sin configurar"}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function ContentBank() {
  const { data: items = [], isLoading, refetch } = trpc.content.list.useQuery();
  const fileInput = useRef<HTMLInputElement>(null);
  const create = trpc.content.create.useMutation({
    onSuccess: () => {
      toast.success("Contenido añadido a revisión");
      refetch();
    },
    onError: error => toast.error(error.message),
  });
  const upload = trpc.content.upload.useMutation({
    onSuccess: () => {
      toast.success("Archivo subido y enviado a revisión");
      refetch();
    },
    onError: error => toast.error(error.message),
  });
  const generate = trpc.content.generate.useMutation({
    onSuccess: () => {
      toast.success("Generación encolada para el worker persistente");
      refetch();
    },
    onError: error => toast.error(error.message),
  });
  const [form, setForm] = useState({
    title: "",
    category: "personal" as Category,
    mediaType: "image" as "image" | "video",
    mediaUrl: "",
    prompt: "",
  });
  const submit = () => {
    if (!form.title || !form.mediaUrl)
      return toast.error("Añade un título y una URL de archivo");
    create.mutate({ ...form, source: "upload" });
  };
  const readDimensions = (file: File) =>
    new Promise<{ width: number; height: number }>((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const element = file.type.startsWith("image/")
        ? new Image()
        : document.createElement("video");
      element.onloadedmetadata = () => {
        const width = file.type.startsWith("image/")
          ? (element as HTMLImageElement).naturalWidth
          : (element as HTMLVideoElement).videoWidth;
        const height = file.type.startsWith("image/")
          ? (element as HTMLImageElement).naturalHeight
          : (element as HTMLVideoElement).videoHeight;
        URL.revokeObjectURL(objectUrl);
        resolve({ width, height });
      };
      element.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("No se pudieron leer las dimensiones"));
      };
      element.src = objectUrl;
    });
  const handleFile = async (file?: File) => {
    if (!file) return;
    try {
      const dimensions = await readDimensions(file);
      const reader = new FileReader();
      reader.onload = () =>
        upload.mutate({
          title: file.name.replace(/\.[^/.]+$/, ""),
          category: form.category,
          mediaType: file.type.startsWith("video/") ? "video" : "image",
          fileName: file.name,
          mimeType: file.type,
          dataUrl: String(reader.result),
          ...dimensions,
        });
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo leer el archivo"
      );
    }
  };
  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="Biblioteca"
        title="Banco multimedia"
        description="Centraliza tus imágenes y vídeos verticales. Toda pieza entra en revisión antes de poder programarse."
        action={
          <>
            <input
              ref={fileInput}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={e => handleFile(e.target.files?.[0])}
            />
            <Button
              variant="outline"
              onClick={() => fileInput.current?.click()}
              disabled={upload.isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              {upload.isPending ? "Subiendo…" : "Subir archivo"}
            </Button>
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        {upload.error && (
          <div className="col-span-full flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/[0.05] p-4 text-sm text-rose-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{upload.error.message}</span>
          </div>
        )}
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Registrar una pieza</CardTitle>
            <CardDescription>
              Formato recomendado: 1080 × 1920, relación 9:16.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input
                className="mt-2"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Ej. Gato descubre la caja"
              />
            </div>
            <div>
              <Label>Categoría</Label>
              <select
                className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.category}
                onChange={e =>
                  setForm({ ...form, category: e.target.value as Category })
                }
              >
                {categories.map(category => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Tipo</Label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["image", "video"] as const).map(type => (
                  <Button
                    key={type}
                    type="button"
                    variant={form.mediaType === type ? "default" : "outline"}
                    onClick={() => setForm({ ...form, mediaType: type })}
                  >
                    {type === "image" ? (
                      <FileImage className="mr-2 h-4 w-4" />
                    ) : (
                      <Film className="mr-2 h-4 w-4" />
                    )}
                    {type === "image" ? "Imagen" : "Vídeo"}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label>URL del archivo</Label>
              <Input
                className="mt-2"
                value={form.mediaUrl}
                onChange={e => setForm({ ...form, mediaUrl: e.target.value })}
                placeholder="https://…"
              />
            </div>
            <Button
              className="w-full"
              onClick={submit}
              disabled={create.isPending}
            >
              {create.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Enviar a revisión
            </Button>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Piezas registradas</CardTitle>
                <CardDescription>
                  {items.length} en el espacio de trabajo.
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingState />
            ) : items.length === 0 ? (
              <EmptyState
                icon={FileImage}
                title="Tu banco está vacío"
                description="Registra una URL de archivo para probar el flujo de revisión."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map(item => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-border/70 p-4"
                  >
                    <div className="mb-4 flex aspect-[9/16] items-center justify-center overflow-hidden rounded-xl bg-muted">
                      {item.mediaType === "image" ? (
                        <img
                          src={item.mediaUrl}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Film className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.category}
                        </p>
                      </div>
                      <StatusBadge status={item.reviewStatus} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Card className="border-border/70 bg-violet-500/[0.04] shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 font-medium">
              <Sparkles className="h-4 w-4 text-violet-600" />
              Generación de imágenes bajo demanda
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              El proveedor se configura en Integraciones; las imágenes generadas
              entran siempre como pendientes de revisión.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() =>
              document
                .getElementById("generator-panel")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Abrir generador
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function ReviewQueue() {
  const {
    data: queue = [],
    isLoading,
    refetch,
  } = trpc.content.reviewQueue.useQuery();
  const review = trpc.content.review.useMutation({
    onSuccess: () => {
      toast.success("Decisión guardada");
      refetch();
    },
    onError: e => toast.error(e.message),
  });
  const metadata = trpc.content.updateMetadata.useMutation({
    onSuccess: () => {
      toast.success("Metadatos guardados");
      refetch();
    },
    onError: e => toast.error(e.message),
  });
  const [drafts, setDrafts] = useState<
    Record<number, { title: string; category: Category }>
  >({});
  const draft = (item: (typeof queue)[number]) =>
    drafts[item.id] ?? { title: item.title, category: item.category };
  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="Control humano"
        title="Cola de revisión"
        description="Aprueba o rechaza cada pieza antes de que entre en el calendario. La publicación automática nunca salta esta etapa."
      />
      <Card className="border-border/70 shadow-sm">
        <CardContent className="p-6">
          {isLoading ? (
            <LoadingState />
          ) : queue.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No hay piezas pendientes"
              description="El contenido nuevo aparecerá aquí para tu aprobación."
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {queue.map(item => {
                const current = draft(item);
                return (
                  <Card
                    key={item.id}
                    className="overflow-hidden border-border/70"
                  >
                    <div className="flex aspect-[9/16] items-center justify-center bg-muted">
                      {item.mediaType === "image" ? (
                        <img
                          src={item.mediaUrl}
                          alt={current.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <video
                          src={item.mediaUrl}
                          controls
                          className="h-full w-full object-cover"
                          aria-label={current.title}
                        />
                      )}
                    </div>
                    <CardContent className="space-y-4 p-4">
                      <div>
                        <Label>Título</Label>
                        <Input
                          className="mt-2"
                          value={current.title}
                          onChange={e =>
                            setDrafts({
                              ...drafts,
                              [item.id]: { ...current, title: e.target.value },
                            })
                          }
                        />
                        <Label className="mt-3 block">Categoría</Label>
                        <select
                          className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={current.category}
                          onChange={e =>
                            setDrafts({
                              ...drafts,
                              [item.id]: {
                                ...current,
                                category: e.target.value as Category,
                              },
                            })
                          }
                        >
                          {categories.map(category => (
                            <option key={category}>{category}</option>
                          ))}
                        </select>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {item.mediaType} · revisión pendiente
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                          metadata.mutate({
                            contentId: item.id,
                            title: current.title,
                            category: current.category,
                          })
                        }
                        disabled={metadata.isPending}
                      >
                        Guardar metadatos
                      </Button>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          onClick={() =>
                            review.mutate({
                              contentId: item.id,
                              status: "rejected",
                            })
                          }
                          disabled={review.isPending}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Rechazar
                        </Button>
                        <Button
                          onClick={() =>
                            review.mutate({
                              contentId: item.id,
                              status: "approved",
                            })
                          }
                          disabled={review.isPending}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Aprobar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function SchedulePage() {
  const { data: schedules = [] } = trpc.schedules.list.useQuery();
  const { data: content = [] } = trpc.content.list.useQuery();
  const create = trpc.schedules.create.useMutation({
    onSuccess: () => toast.success("Publicación programada"),
    onError: e => toast.error(e.message),
  });
  const dryRun = trpc.publications.publishDryRun.useMutation({
    onSuccess: result => toast.success(`${result.platform}: ${result.status}`),
    onError: e => toast.error(e.message),
  });
  const [contentId, setContentId] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [scheduledAt, setScheduledAt] = useState("");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  );
  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="Distribución"
        title="Programación"
        description="Organiza las piezas aprobadas por plataforma. Las ejecuciones respetan la cadencia configurada y dejan un registro de auditoría."
        action={
          <Button
            onClick={() =>
              document
                .getElementById("schedule-form")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva programación
          </Button>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
        <Card id="schedule-form" className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Nueva programación</CardTitle>
            <CardDescription>
              Solo aparecen piezas aprobadas en producción.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Pieza aprobada</Label>
              <select
                className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={contentId}
                onChange={e => setContentId(e.target.value)}
              >
                <option value="">Seleccionar…</option>
                {content
                  .filter(item => item.reviewStatus === "approved")
                  .map(item => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <Label>Plataforma</Label>
              <select
                className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm capitalize"
                value={platform}
                onChange={e => setPlatform(e.target.value)}
              >
                {platforms.map(item => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Fecha y hora</Label>
              <Input
                className="mt-2"
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
              />
            </div>
            <div>
              <Label>Zona horaria</Label>
              <select
                className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
              >
                <option>{timezone}</option>
                <option value="UTC">UTC</option>
                <option value="Europe/Madrid">Europe/Madrid</option>
                <option value="America/Mexico_City">America/Mexico_City</option>
                <option value="America/Bogota">America/Bogota</option>
              </select>
            </div>
            <Button
              className="w-full"
              disabled={!contentId || !scheduledAt || create.isPending}
              onClick={() =>
                create.mutate({
                  contentId: Number(contentId),
                  platform: platform as (typeof platforms)[number],
                  scheduledAt: new Date(scheduledAt),
                  timezone,
                })
              }
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              Programar
            </Button>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Calendario operativo</CardTitle>
            <CardDescription>
              {schedules.length} publicaciones en cola.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {schedules.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Calendario vacío"
                description="Aprueba contenido y crea tu primera programación."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
                {Array.from({ length: 7 }, (_, offset) => {
                  const day = new Date();
                  day.setHours(0, 0, 0, 0);
                  day.setDate(day.getDate() - day.getDay() + offset);
                  const dayItems = schedules.filter(item => {
                    const date = new Date(item.scheduledAt);
                    return date.getDay() === offset;
                  });
                  return (
                    <div
                      key={offset}
                      className="min-h-40 rounded-xl border border-border/70 bg-muted/20 p-3"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {day.toLocaleDateString(undefined, {
                          weekday: "short",
                        })}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {day.getDate()}
                      </p>
                      <div className="mt-3 space-y-2">
                        {dayItems.length === 0 ? (
                          <p className="text-xs text-muted-foreground/70">
                            Sin piezas
                          </p>
                        ) : (
                          dayItems.map(item => (
                            <div
                              key={item.id}
                              className="rounded-lg bg-background p-2 shadow-sm"
                            >
                              <p className="truncate text-xs font-medium capitalize">
                                {item.platform}
                              </p>
                              <p className="mt-1 truncate text-[11px] text-muted-foreground">
                                {new Date(item.scheduledAt).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" }
                                )}
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="mt-1 h-7 w-full px-1 text-[11px]"
                                onClick={() =>
                                  dryRun.mutate({
                                    contentId: item.contentId,
                                    platform: item.platform,
                                  })
                                }
                                disabled={dryRun.isPending}
                              >
                                Simular
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function Publications() {
  const { data: publications = [], isLoading } =
    trpc.publications.list.useQuery();
  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="Distribución"
        title="Publicaciones"
        description="Consulta el estado de cada entrega y distingue entre aceptación de la API, auditoría pendiente y publicación pública."
      />
      <Card className="border-border/70 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingState />
          ) : publications.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Send}
                title="Sin publicaciones todavía"
                description="Las entregas creadas desde el calendario aparecerán aquí."
              />
            </div>
          ) : (
            <div className="divide-y divide-border/70">
              {publications.map(item => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium capitalize">{item.platform}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.createdAt.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={item.status} />
                      {item.publishedUrl && (
                        <a
                          href={item.publishedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          Abrir <ArrowUpRight className="inline h-3 w-3" />
                        </a>
                      )}
                    </div>
                    {item.errorMessage && (
                      <p className="max-w-xs text-right text-xs text-rose-600">
                        {item.errorMessage}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function ActivityPage() {
  const { data: activity = [] } = trpc.activity.useQuery();
  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="Observabilidad"
        title="Registro de actividad"
        description="Una línea temporal auditable de subidas, revisiones, programaciones, publicaciones y errores."
      />
      <Card className="border-border/70 shadow-sm">
        <CardContent className="p-6">
          {activity.length === 0 ? (
            <EmptyState
              icon={CircleDashed}
              title="Sin eventos registrados"
              description="El registro se completa automáticamente al operar el panel."
            />
          ) : (
            <div className="space-y-4">
              {activity.map(item => (
                <div
                  key={item.id}
                  className="flex gap-3 border-b border-border/60 pb-4 last:border-0"
                >
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <ActivityIcon type={item.type} />
                  </div>
                  <div>
                    <p className="text-sm">{item.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString()}{" "}
                      {item.platform ? `· ${item.platform}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function Integrations() {
  const { data: integrations } = trpc.integrations.useQuery();
  const workerQuery = trpc.worker.status.useQuery(undefined, {
    refetchInterval: 30_000,
  });
  const workerHeartbeat = workerQuery.data?.heartbeats?.[0];
  const [workerCron, setWorkerCron] = useState("0 * * * * *");
  const scheduleWorker = trpc.worker.schedule.useMutation({
    onSuccess: result => {
      toast.success(
        result.reused
          ? "El scheduler persistente ya estaba configurado"
          : "Scheduler persistente activado"
      );
      workerQuery.refetch();
    },
    onError: error => toast.error(error.message),
  });
  const setWorkerEnabled = trpc.worker.setEnabled.useMutation({
    onSuccess: result => {
      toast.success(result.enabled ? "Worker reanudado" : "Worker pausado");
      workerQuery.refetch();
    },
    onError: error => toast.error(error.message),
  });
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("personaje virtual");
  const generate = trpc.content.generate.useMutation({
    onSuccess: () => {
      toast.success("Generación encolada para el worker persistente");
      setPrompt("");
      setTitle("");
    },
    onError: e => toast.error(e.message),
  });
  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="Conexiones"
        title="Integraciones y generación"
        description="Configura las variables de entorno del servidor. El cliente solo recibe estados booleanos y nunca tokens ni secretos."
      />
      <Card className="border-primary/25 bg-primary/[0.035] shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock3 className="h-5 w-5 text-primary" />
            Worker persistente
          </CardTitle>
          <CardDescription>
            Ejecuta la cola en el servidor mediante Heartbeat aunque tu
            ordenador esté apagado. El cron usa UTC y seis campos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <Label htmlFor="worker-cron">Frecuencia cron UTC</Label>
              <Input
                id="worker-cron"
                className="mt-2 font-mono"
                value={workerCron}
                onChange={event => setWorkerCron(event.target.value)}
                placeholder="0 * * * * *"
                aria-describedby="worker-cron-help"
              />
              <p
                id="worker-cron-help"
                className="mt-2 text-xs text-muted-foreground"
              >
                Formato: segundo minuto hora día-mes mes día-semana. Mínimo: una
                ejecución por minuto.
              </p>
            </div>
            <Button
              onClick={() => scheduleWorker.mutate({ cron: workerCron })}
              disabled={
                scheduleWorker.isPending ||
                Boolean(workerHeartbeat?.scheduleCronTaskUid)
              }
            >
              {scheduleWorker.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {workerHeartbeat?.scheduleCronTaskUid
                ? "Scheduler configurado"
                : "Activar scheduler"}
            </Button>
          </div>
          <Separator />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span
                className={`h-2.5 w-2.5 rounded-full ${workerHeartbeat?.status === "degraded" ? "bg-rose-500" : workerHeartbeat?.status === "running" ? "bg-emerald-500" : "bg-slate-400"}`}
                aria-hidden="true"
              />
              <div>
                <p className="font-medium">
                  Estado: {workerHeartbeat?.status ?? "sin heartbeat"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {workerHeartbeat?.lastSeenAt
                    ? `Última señal: ${new Date(workerHeartbeat.lastSeenAt).toLocaleString()}`
                    : "Aún no se ha ejecutado ninguna señal del worker."}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() =>
                setWorkerEnabled.mutate({
                  enabled: workerHeartbeat?.status !== "running",
                })
              }
              disabled={
                setWorkerEnabled.isPending ||
                !workerHeartbeat?.scheduleCronTaskUid
              }
            >
              {setWorkerEnabled.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {workerHeartbeat?.status === "running"
                ? "Pausar worker"
                : "Reanudar worker"}
            </Button>
          </div>
          {workerHeartbeat?.lastError && (
            <div className="rounded-lg border border-rose-500/25 bg-rose-500/[0.06] p-3 text-sm text-rose-700">
              Último error: {workerHeartbeat.lastError}
            </div>
          )}
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {platforms.map(platform => {
          const item = integrations?.[platform];
          return (
            <Card key={platform} className="border-border/70 shadow-sm">
              <CardContent className="flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-muted p-3">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium capitalize">{platform}</p>
                    <p className="text-xs text-muted-foreground">
                      {item?.mode ?? "API oficial"}
                    </p>
                  </div>
                </div>
                <StatusBadge
                  status={item?.configured ? "configurado" : "sin configurar"}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
      {generate.error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/[0.05] p-4 text-sm text-rose-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{generate.error.message}</span>
        </div>
      )}
      <Card id="generator-panel" className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-violet-600" />
            Generador de imágenes
          </CardTitle>
          <CardDescription>
            La solicitud se guarda en la cola y el worker la convierte en
            contenido pendiente de revisión.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Título</Label>
              <Input
                className="mt-2"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Nombre de la pieza"
              />
            </div>
            <div>
              <Label>Categoría</Label>
              <select
                className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={category}
                onChange={e => setCategory(e.target.value as Category)}
              >
                {categories.map(item => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>
          <Textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describe una imagen vertical original…"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Se añade una instrucción 9:16 y se conserva la revisión humana.
            </p>
            <Button
              onClick={() => generate.mutate({ title, category, prompt })}
              disabled={!prompt || !title || generate.isPending}
            >
              {generate.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generar imagen
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="border-amber-500/30 bg-amber-500/[0.04] shadow-sm">
        <CardContent className="flex gap-3 p-5">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-medium">Estado de auditoría</p>
            <p className="mt-1 text-sm text-muted-foreground">
              YouTube y TikTok pueden aceptar una subida y mantenerla privada
              hasta que la aplicación supere su auditoría. El panel conserva ese
              estado y no lo presenta como publicación pública.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileImage;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="relative flex h-20 w-14 items-center justify-center rounded-[16px] border-2 border-primary/35 bg-primary/[0.05] shadow-[0_0_0_5px_hsl(var(--primary)/0.05)]">
        <span className="h-9 w-1 rounded-full bg-primary/70" />
        <span className="absolute bottom-3 h-1 w-5 rounded-full bg-primary/35" />
        <Icon className="absolute -right-5 -top-3 h-5 w-5 rounded-full bg-background p-0.5 text-primary" />
      </div>
      <p className="mt-5 font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      <div className="mt-5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        <span>Entrada</span>
        <span className="h-px w-5 bg-border" />
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        <span>Revisión</span>
        <span className="h-px w-5 bg-border" />
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span>Salida</span>
      </div>
    </div>
  );
}
export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
export function ActivityIcon({ type }: { type: string }) {
  return type === "error" ? (
    <AlertTriangle className="h-3.5 w-3.5" />
  ) : type === "publish" ? (
    <Send className="h-3.5 w-3.5" />
  ) : type === "schedule" ? (
    <CalendarDays className="h-3.5 w-3.5" />
  ) : type === "review" ? (
    <ShieldCheck className="h-3.5 w-3.5" />
  ) : (
    <FileImage className="h-3.5 w-3.5" />
  );
}

/* Router moved to Home.tsx. */
/* export default function Home() {
  const [location] = useLocation();
  const content =
    location === "/content" ? (
      <ContentBank />
    ) : location === "/review" ? (
      <ReviewQueue />
    ) : location === "/schedule" ? (
      <SchedulePage />
    ) : location === "/publications" ? (
      <Publications />
    ) : location === "/activity" ? (
      <ActivityPage />
    ) : location === "/integrations" ? (
      <Integrations />
    ) : (
      <Overview />
    );
  return <div className="mx-auto w-full max-w-[1500px]">{content}</div>;
} */
