# Vertical OS — guía operativa

## Alcance de esta versión

El panel centraliza el banco multimedia, la revisión humana, la generación de imágenes, la programación, el historial de publicaciones y el estado de las integraciones. Las categorías permitidas son exactamente `personal`, `gatos/humor` y `personaje virtual`. Los estados públicos de publicación son exactamente `privado`, `pendiente de auditoría` y `publicado`.

Todo contenido nuevo queda pendiente de revisión. El flujo previsto es **subida o generación → validación 9:16 → revisión humana → programación → entrega oficial → registro del estado devuelto por la plataforma**. Las identidades realistas deben ser sintéticas u obtener consentimiento verificable; el panel no incorpora suplantación ni evasión de controles.

## Almacenamiento y seguridad

Los binarios se suben al almacenamiento seguro del proyecto mediante `storagePut`. La base de datos solo conserva URL y clave de almacenamiento junto con metadatos. La validación 9:16 se aplica en el backend verificando las dimensiones binarias reales de imágenes PNG, GIF y JPEG antes de llamar a `storagePut`. El modo seguro bloquea las subidas de vídeo porque todavía no incorpora un inspector binario server-side para MP4/WebM que verifique dimensiones y metadatos reales; esta es una integración pendiente y no se debe sustituir por confianza en `width`/`height` enviados por el cliente.

Las credenciales nunca se guardan en cliente ni en la base de datos. La interfaz recibe únicamente `{ configured, mode }`. Las variables previstas para las integraciones oficiales son:

| Plataforma           | Variables de servidor previstas                                          |
| -------------------- | ------------------------------------------------------------------------ |
| Instagram y Facebook | `META_ACCESS_TOKEN`, `INSTAGRAM_BUSINESS_ACCOUNT_ID`, `FACEBOOK_PAGE_ID` |
| YouTube              | `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN`    |
| TikTok               | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_ACCESS_TOKEN`       |
| Telegram             | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`                                 |

No se deben activar publicaciones públicas hasta completar OAuth, permisos, revisión y pruebas privadas de cada aplicación. La mutación real exige `PUBLISHING_MODE=production` y `PRODUCTION_PUBLISH_CONFIRMATION=I_UNDERSTAND`; YouTube completa la sesión `videos.insert` resumable y conserva el vídeo en privado. YouTube y TikTok pueden aceptar una subida y mantenerla privada mientras el proyecto no haya superado su auditoría; por eso el registro separa aceptación privada, auditoría pendiente y publicación pública.

## Programación

La UI guarda la fecha, plataforma y zona horaria. El servidor aplica intervalos mínimos y cupos diarios conservadores por plataforma. Pueden ajustarse mediante `PLATFORM_LIMITS_JSON` en el entorno server-side; el conteo diario se calcula usando la zona horaria elegida, no la del servidor. La interfaz nunca permite desactivar los controles para aumentar actividad artificial o evadir límites.

La UI guarda la fecha, plataforma y zona horaria. Los trabajos recurrentes deben ejecutarse mediante callbacks gestionados en `/api/scheduled/*`, no mediante `setInterval` ni temporizadores en proceso. La mutación `publications.publish` ejecuta el modo server-side configurado, exige contenido aprobado y evita registros duplicados locales por propietario, pieza y plataforma. La idempotencia externa no se presume: no se reintentan automáticamente POST/PUT no idempotentes sin garantía del proveedor.

## Ejecución recomendada

La variante más segura es el panel gestionado con generación y publicación bajo demanda, manteniendo los archivos en almacenamiento externo y la aplicación sin procesos multimedia pesados persistentes. La generación local con ComfyUI/Wan puede añadirse como worker independiente cuando se disponga de GPU; no conviene exigirla a un PC con 8 GB de RAM sin GPU confirmada.

## Comandos de verificación

```bash
pnpm check
pnpm test -- --run
```

La configuración de las variables se debe realizar mediante el gestor de secretos del proyecto. Nunca se deben pegar tokens en JSX, en commits, en SQL ni en la base de datos. Para pruebas se usan únicamente mocks locales, respuestas fijadas y sandboxes oficiales; queda prohibido buscar, reutilizar o incorporar tokens, cookies, refresh tokens o credenciales de terceros encontrados en GitHub, Hugging Face, foros, logs o archivos públicos.


## Worker persistente y Heartbeat

El worker persistente se ejecuta como callback server-side mediante Forge Heartbeat y no depende de que el ordenador del propietario permanezca encendido. No es un proceso separado del servidor web ni un timer local: la persistencia la proporciona el scheduler gestionado y el estado durable la base de datos. Desde **Integraciones y generación** se configura una expresión cron UTC de seis campos, se activa una única tarea para el propietario y se puede pausar o reanudar el scheduler. El callback válido es `POST /api/scheduled/processQueue`; solo acepta identidades cron autenticadas por el SDK y responde 2xx sin reintento infinito cuando el task UID ya no corresponde a un worker existente.

La cola usa leasing persistente, límite de lote, backoff y recuperación de trabajos cuyo lease expiró. La generación de imágenes se encola como `kind: generate`, se procesa server-side mediante el proveedor interno, se guarda en S3 y crea contenido `pending` para revisión humana. Los jobs `process` de transcodificación general permanecen bloqueados hasta incorporar inspector MP4/WebM y controles antiabuso. Cada ejecución actualiza `worker_heartbeats` con estado `idle`, `running` o `degraded`, última señal, último trabajo y último error. Los trabajos de publicación se deduplican localmente antes de entrar en cola; un fallo de un POST/PUT externo se registra y se reencola según la política de backoff, pero no se repite ciegamente la solicitud externa no idempotente.

La comprobación mínima de esta versión es `pnpm check`, `pnpm test -- --run` y `pnpm build`. La suite actual cubre **38 pruebas Vitest**, incluyendo generación persistente de imágenes, deduplicación, recuperación tras fallo, rechazo no-cron y task UID huérfano. Antes de activar producción deben completarse OAuth, permisos, pruebas privadas y el inspector binario MP4/WebM; el vídeo no inspeccionable sigue bloqueado por seguridad.

## Cobertura del brief operativo adjunto

La comparación del brief adjunto con la implementación actual confirma que el alcance seguro solicitado ya está aplicado. El banco acepta contenido de vídeo e imagen vertical 9:16, la revisión humana precede a la distribución, la generación de imágenes se encola server-side y se guarda en S3, y la cola persistente distribuye publicaciones mediante adaptadores oficiales para Instagram, Facebook, TikTok, YouTube y Telegram. El dashboard permite ajustar frecuencia, límites y scheduler Heartbeat sin depender del PC local.

| Elemento del brief | Aplicación verificable | Decisión operativa |
| --- | --- | --- |
| Contenido 9:16 de foto y vídeo | Validación de ratio, S3, banco y revisión | Aplicado; el vídeo no inspeccionable permanece bloqueado |
| Generación con varios modelos | Capa server-side intercambiable y generación de imágenes encolada | Aplicado para el proveedor interno; proveedores externos requieren credenciales y revisión |
| Publicación persistente en cinco canales | `queue_jobs`, worker, Heartbeat y adaptadores oficiales | Aplicado en modo seguro; producción requiere OAuth, permisos y pruebas privadas |
| Control humano de contenido medio | Estados `pending`, aprobación y cola de revisión | Aplicado |
| Automatización masiva, evasión o simulación de actividad | No existe ruta de scraping, evasión, spam ni reintento ciego | Excluido por seguridad, políticas de plataforma y fiabilidad |
| Persona realista o sexualización de una persona real | No se automatiza suplantación ni sexualización sin consentimiento explícito | Excluido; solo identidad sintética o material autorizado |
| Extracción automática de stories, destacados o perfiles ajenos | No se usan cookies, scraping ni acceso no autorizado | Excluido; solo APIs oficiales y contenido propio autorizado |

Por tanto, el adjunto no introduce una brecha funcional segura que justifique otra integración inmediata. Los siguientes incrementos reales son el inspector MP4/WebM, la transcodificación general y la conexión OAuth de producción, cada uno con pruebas y límites específicos antes de activarse.
