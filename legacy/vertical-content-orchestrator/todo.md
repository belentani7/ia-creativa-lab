# Project TODO

- [x] Panel principal con DashboardLayout y sidebar para banco, revisión, calendario, publicaciones, actividad y configuración.
- [x] Banco multimedia con almacenamiento S3, metadatos y validación de formato vertical 9:16.
- [x] Categorías exactas del banco: personal, gatos/humor y personaje virtual.
- [x] Subida de imágenes y vídeos con vista previa, filtros, etiquetas y estado de revisión.
- [x] Cola de revisión humana con aprobación, rechazo y preview de vídeo; edición avanzada de metadatos pendiente.
- [x] Generación de imágenes bajo demanda con proveedor interno, prompt y guardado en el banco; selección de proveedores externos pendiente.
- [x] Programación por fecha, hora, zona horaria y plataforma; calendario visual completo pendiente.
- [x] Configuración de frecuencia y límites ajustables por plataforma sin automatización de spam ni evasión.
- [x] Estados exactos de publicación: privado, pendiente de auditoría y publicado.
- [x] Contrato y payload sandbox para Meta Graph API; activación oficial de producción queda condicionada a credenciales y permisos OAuth.
- [x] Contrato y payload sandbox para YouTube Data API `videos.insert` con estado privado/auditoría; activación oficial queda condicionada a OAuth.
- [x] Contrato y payload sandbox para TikTok Content Posting API con estado pendiente de auditoría; activación oficial queda condicionada a OAuth/auditoría.
- [x] Contrato y payload sandbox para Telegram Bot API; activación oficial queda condicionada al token y chat ID del propietario.
- [x] Registro de publicaciones con estado, plataforma, fecha, error y enlace.
- [x] Alertas internas visibles al propietario ante fallos; canales externos quedan preparados para la fase de credenciales.
- [x] Configuración de integraciones sin guardar tokens en cliente ni en base de datos.
- [x] Sección de configuración que solo muestre estado de credenciales, nunca secretos.
- [x] Modelo de datos y migración SQL para contenido, etiquetas, revisiones, programaciones, publicaciones y eventos.
- [x] Procedimientos tRPC protegidos para operaciones del propietario.
- [x] Pruebas Vitest para validación 9:16, categorías exactas, estados exactos y protección de secretos.
- [x] Diseño responsive para escritorio y móvil.
- [x] Verificación visual del panel y de los estados vacíos, carga y error.
- [x] Documentación de instalación, variables de entorno, OAuth, auditorías y límites de cada plataforma.
- [x] Revisión final de seguridad, pruebas y checkpoint de la versión segura.

## Brechas detectadas en validación

- [x] Implementar subida real a S3 con validación backend/frontend de relación 9:16 antes de guardar contenido.
- [x] Conectar la UI del generador a `trpc.content.generate` con proveedor interno seguro; interfaz preparada para sustituir proveedor tras configurar credenciales.
- [x] Añadir preview real de vídeo y edición de metadatos en la cola de revisión.
- [x] Crear un calendario visual semanal y permitir elegir zona horaria en la programación.
- [x] Añadir alertas visibles al propietario en el resumen y registro de actividad para fallos; notificación externa queda opcional para producción.
- [x] Agregar pruebas de no exposición de secretos y de rechazo real de contenido no 9:16.
- [x] Verificar responsive en viewport móvil y documentar/validar estados de error visualmente.

## Verificaciones pendientes adicionales

- [x] Añadir pruebas tRPC que confirmen que `integrations` solo devuelve booleanos y modos, nunca secretos, tokens o IDs sensibles.
- [x] Añadir una prueba del flujo backend de subida que rechace contenido no 9:16 mediante la mutación real.
- [x] Crear banners de error para subida, generación y publicación; alertas visibles integradas en resumen y actividad.

## Seguridad de subida pendiente

- [x] Verificar en servidor las dimensiones reales de imágenes antes de llamar a `storagePut`; vídeo no inspeccionable se bloquea en modo seguro.
- [x] Añadir pruebas de archivo PNG válido 9:16 y de archivo adulterado; vídeo no inspeccionable bloqueado explícitamente.

## Nuevo alcance: versión 10/10 sin credenciales de producción

- [x] Crear contrato común de adaptadores de publicación para Instagram, Facebook, TikTok, YouTube y Telegram.
- [x] Implementar adaptadores por plataforma en modo dry-run/sandbox sin usar credenciales de terceros, con payloads mock específicos.
- [x] Añadir simulación reproducible de respuestas privadas, auditoría pendiente, publicado y error mediante `PUBLISHING_SIMULATED_STATUS`.
- [x] Añadir modos server-side `safe`, `dry-run` y `production`.
- [x] Completar calendario visual con vista semanal y simulación por plataforma.
- [x] Añadir alertas internas en el registro de actividad para fallos de publicación; webhook externo pendiente de credenciales.
- [x] Añadir edición de metadatos en la cola de revisión.
- [x] Bloquear explícitamente la subida de vídeo no inspeccionable en modo seguro y documentar el inspector server-side como siguiente integración.
- [x] Crear pruebas de contrato para los cinco adaptadores, payloads y estados de auditoría.
- [x] Mantener en `OPERATIONS.md` la política de no usar tokens, cookies o credenciales encontrados en repositorios públicos.

## Auditoría 10/10 y repositorio privado

- [x] Definir rúbrica verificable para backend, frontend, utilidad, relevancia, potencial, identidad, seguridad, pruebas, rendimiento y mantenibilidad.
- [x] Ejecutar auditoría exhaustiva con evidencia reproducible y puntuación por dimensión.
- [x] Corregir brechas prioritarias de código, UX, seguridad, rendimiento y documentación; las limitaciones de producción quedan separadas abajo.
- [x] Repetir pruebas, comprobación TypeScript, build y revisión visual después de las correcciones.
- [x] Crear informe de auditoría completo con criterios, evidencias, riesgos y límites en `AUDIT_REPORT.md`.
- [x] Evaluar creación de repositorio privado nuevo; inicialmente bloqueado por el gate 10/10 y posteriormente autorizado explícitamente por el propietario.
- [x] Verificar exclusión de logs y entornos; la publicación posterior fue autorizada explícitamente por el propietario.
- [x] Preparar informe de auditoría y dejar lista la creación condicionada del checkpoint; el checkpoint final posterior se guarda al terminar esta fase.

## Limitaciones que impiden el gate 10/10

- [x] Implementar clientes server-side oficiales para Meta, YouTube, TikTok y Telegram con validación de credenciales, payloads de producción y pruebas mock; callbacks, reintentos idempotentes y pruebas privadas quedan como activación operativa.
- [x] Reducir el chunk común frontend por debajo del presupuesto definido mediante separación de páginas, lazy loading y `manualChunks`; ningún chunk supera 500 kB.
- [x] Añadir smoke E2E de navegador, axe-core para violaciones críticas/serias y smoke de carga concurrente; pruebas exhaustivas de red y carga sostenida quedan fuera del smoke.
- [x] Modularizar `Home.tsx` en `HomeSections.tsx` y un router de presentación independiente.
- [x] Mantener bloqueo seguro de vídeo no inspeccionable; inspector binario MP4/WebM, límites de tamaño/duración y controles antiabuso quedan como activación multimedia avanzada.

## Reauditoría extrema y publicación condicionada en GitHub

- [x] Reauditar backend, frontend, utilidad, relevancia, potencial e identidad con puntuación documentada; el resultado actual es 9,4/10 y no supera el gate.
- [x] Verificar seguridad del gate de producción y documentar callbacks, reintentos idempotentes, carga binaria e inspector multimedia como bloqueos restantes.
- [x] Repetir TypeScript, Vitest, E2E, axe-core, smoke de carga, build y revisión visual.
- [x] Actualizar `AUDIT_REPORT.md` con evidencias y dictamen de 9,4/10.
- [x] Evaluar creación bajo `belentani7`; tras la nueva orden explícita se mantuvo el repositorio privado y se actualizó la revisión.
- [x] Verificar exclusión de secretos, logs y artefactos antes de publicar la revisión autorizada.
- [x] Preparar el dictamen de bloqueo inicial; la publicación posterior se realizó tras la autorización explícita del propietario.

## Hallazgos de identidad visual de la reauditoría

- [x] Reforzar la identidad Vertical OS con marca 9:16 y vocabulario visual de control room.
- [x] Introducir motivo visual recurrente de marco 9:16 y pipeline Entrada → Revisión → Salida.
- [x] Mejorar estados vacíos con composición de control room, marco 9:16 y etapas operativas.

## Publicación GitHub autorizada por nueva instrucción

- [x] Revisar y limpiar el árbol versionable para excluir secretos, logs, `dist`, resultados E2E y artefactos temporales.
- [x] La documentación publicada declara que el repositorio corresponde a la versión auditada 9,4/10, no a una certificación 10/10.
- [x] Crear repositorio privado nuevo `vertical-content-orchestrator` bajo `belentani7`.
- [x] Publicar el código limpio y verificar remoto, rama `main` y archivos sensibles excluidos.
- [x] Entregar el enlace del repositorio y el checkpoint correspondiente.

## Orden de ejecución: limpieza, consolidación y publicación final

- [x] Consolidar documentación en `OPERATIONS.md` y `AUDIT_REPORT.md`, retirando `AUDIT_SOURCES.md` redundante.
- [x] Eliminar `vite.config.ts.bak`, `template.json` y `.gitkeep` no operativos; excluir artefactos E2E y conservar el marcador de migraciones.
- [x] Completar brechas prioritarias: mutación production protegida, deduplicación local, carga YouTube resumable y política de no retry no idempotente.
- [x] Ejecutar validación completa y auditoría final; resultado verificable mejorado, sin declarar una certificación 10/10 falsa.
- [x] Publicar la revisión consolidada en el repositorio GitHub tras autorización explícita del propietario, documentando sus límites reales.

## Aplicación final de conceptos de producción

- [x] Añadir mutación de publicación real protegida por modo server-side y aprobación humana.
- [x] Evitar duplicados consultando publicaciones existentes por propietario, contenido y plataforma.
- [x] Completar la carga binaria de YouTube desde la sesión resumable hasta obtener el ID del vídeo.
- [x] Limitar reintentos a lecturas/preflight; no reintentar POST/PUT externos no idempotentes y documentar deduplicación local separada.
- [x] Ejecutar validación final y actualizar el repositorio GitHub con la revisión consolidada en commit `5974b41`.

## Corrección de idempotencia externa

- [x] Limitar `retryNetwork` a lecturas/preflight idempotentes; no reintentar POST/PUT de publicación sin garantía del proveedor.
- [x] Añadir pruebas de no reintento para fallos transitorios en Telegram y la sesión POST de YouTube; Meta/TikTok comparten la misma política sin retry.
- [x] Actualizar `OPERATIONS.md` y `AUDIT_REPORT.md` para distinguir deduplicación local de idempotencia garantizada por API.

## Maquinaria real persistente

- [x] Definir ejecución persistente mediante Heartbeat gestionado; no depende del panel del navegador ni del PC local.
- [x] Implementar cola persistente de trabajos con leasing, reintentos, backoff, dead-letter y recuperación tras reinicio.
- [x] Implementar worker persistente de generación de imágenes con almacenamiento S3 y estados trazables.
- [x] Delimitar jobs `process`: la transcodificación MP4/WebM no se activa hasta disponer de inspector binario y controles antiabuso; el worker rechaza esa ruta de forma segura.
- [x] Implementar scheduler real basado en callbacks/servicio persistente, no en timers efímeros.
- [x] Conectar publicación oficial real a la cola con idempotencia y límites por plataforma.
- [x] Añadir monitorización de workers, heartbeat, métricas, errores y alertas operativas; queda pendiente validación de reinicio extremo a extremo.
- [x] Retirar simulaciones como ruta por defecto; conservar dry-run solo como modo explícito de pruebas.
- [x] Documentar secretos y operación de la maquinaria; la recuperación extremo a extremo sigue pendiente de validación.
- [x] Validar recuperación y fallos de red mediante pruebas del worker.
- [x] Validar deduplicación local cuando una publicación ya tiene `externalId` o `publishedUrl`.
- [x] Documentar reinicio de proceso y lease expirado como aceptación operativa pendiente de ejecutar en un entorno con base de datos; no se presenta como prueba automatizada.

## Scheduler real

- [x] Persistir `scheduleCronTaskUid` del worker y crear/actualizar el Heartbeat desde una operación protegida.
- [x] Añadir procedimiento de control para activar, pausar y consultar el scheduler del worker.
- [x] Validar en código que el callback solo acepta identidades cron y que los trabajos huérfanos responden 2xx sin reintento infinito.

## Cierre de maquinaria persistente

- [x] Persistir y controlar el worker mediante Heartbeat con activación, pausa, cron validado y estado operativo.
- [x] Añadir pruebas unitarias del worker para payload inválido, procesamiento correcto y reencolado tras fallo.
- [x] Corregir el validador de payload para rechazar arrays y corregir el marcado de `publishedAt` en estados no publicados.
- [x] Ejecutar auditoría final de build, pruebas, E2E, accesibilidad y smoke HTTP; la suite final actual es de 38 pruebas.
- [x] Guardar checkpoint final y verificar publicación automática.

- [x] Añadir al dashboard el control visible de activar/pausar y estado del worker persistente.

- [x] Actualizar `OPERATIONS.md` y `AUDIT_REPORT.md` con el ciclo de vida Heartbeat y las 38 pruebas actuales.

## Correcciones antes del checkpoint final

- [x] Unificar el worker real con el heartbeat mediante resolución por `scheduleCronTaskUid`.
- [x] Añadir prueba del camino de task UID huérfano; el rechazo no-cron permanece cubierto por la guardia explícita del callback.
- [x] Corregir la afirmación de despliegue para distinguir callback serverless de worker separado.
- [x] Verificar que el modo seguro es el valor predeterminado y que dry-run es explícito.

- [x] Añadir pruebas del handler HTTP `/api/scheduled/processQueue` para no-cron (403) y task UID huérfano (2xx).

## Aplicación del adjunto

- [x] Comparar el brief adjunto con las capacidades ya implementadas y aplicar solo las brechas reales, sin incorporar avisos de interfaz ni mecanismos de evasión.

- [x] Dejar evidencia operativa de la comparación del adjunto: cobertura aplicada, límites técnicos y exclusiones de seguridad.

## Auditoría reforzada y entrega

- [x] Ejecutar una auditoría técnica y operativa reforzada contra las promesas del producto.
- [x] Corregir la brecha verificable de infraestructura E2E e instalar el navegador Playwright requerido.
- [x] Actualizar el dictamen vigente con evidencia actual y límites explícitos de producción externa.
- [ ] Preparar un paquete de entrega sin secretos, artefactos ni datos operativos.
- [ ] Sincronizar la versión auditada con el repositorio privado de GitHub.
- [ ] Subir el paquete de entrega y el informe de auditoría a Google Drive.
- [ ] Guardar checkpoint publicado y entregar los enlaces verificados.
