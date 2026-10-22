# ia-creativa-lab

Repositorio unificado (propuesta v2, local, sin publicar). Reúne **24** repos de `belentani7`: 13 públicos y 11 privados.

**Nivel de visibilidad recomendado: PRIVADO.** Contiene repos privados o de terceros: no debe publicarse como repo público.

Cada carpeta de `legacy/` conserva el contenido del repo original sin reescribirlo. El historial git no se conserva (decisión de aplanado, 2026-10-02).

## Origen de cada bloque

| Carpeta | Repo original | KB | Vis. | Sitio vivo | Descripción (de GitHub) |
|---|---|--:|:--:|---|---|
| `legacy/firelab` | [`firelab`](https://github.com/belentani7/firelab) | 471 | priv | — | BELENTANI // FIRELAB - Local-first generative creative studio (Next.js + Prisma) |
| `legacy/vertical-content-orchestrator` | [`vertical-content-orchestrator`](https://github.com/belentani7/vertical-content-orchestrator) | 352 | priv | — | Orquestador de contenido vertical - pipeline para Reels/Shorts/TikTok. |
| `legacy/fashion-stylist-ai` | [`fashion-stylist-ai`](https://github.com/belentani7/fashion-stylist-ai) | 318 | pub | pages+vercel | AI-powered fashion stylist — visual recommendation engine using computer vision and style  |
| `legacy/firefly-studio-web` | [`firefly-studio-web`](https://github.com/belentani7/firefly-studio-web) | 286 | priv | — | Firefly Studio - web del estudio creativo audiovisual. |
| `legacy/hbo-noir-icons` | [`hbo-noir-icons`](https://github.com/belentani7/hbo-noir-icons) | 201 | pub | pages | Pack de iconos noir inspirado en la estética HBO. Desplegado en Vercel. |
| `legacy/creative-ai-hub` | [`creative-ai-hub`](https://github.com/belentani7/creative-ai-hub) | 169 | priv | — | creative-ai-hub |
| `legacy/red-starfield-frontend` | [`red-starfield-frontend`](https://github.com/belentani7/red-starfield-frontend) | 164 | priv | — | Frontend con campo de estrellas rojo: pieza visual interactiva. |
| `legacy/lumena` | [`lumena`](https://github.com/belentani7/lumena) | 162 | priv | — | Estudio creativo local en español para generar composiciones visuales procedurales, cargar |
| `legacy/lumen-local-studio` | [`lumen-local-studio`](https://github.com/belentani7/lumen-local-studio) | 161 | priv | — | Lumen Local Studio - cliente Vite/React + servidor, local-first |
| `legacy/cinematic-prompt-formatter` | [`cinematic-prompt-formatter`](https://github.com/belentani7/cinematic-prompt-formatter) | 99 | pub | pages+vercel | Translate cinematic language into optimized prompts for Stable Diffusion, Flux, and SDXL m |
| `legacy/scroll-world` | [`scroll-world`](https://github.com/belentani7/scroll-world) | 57 | priv | — | https://github.com/user-attachments/assets/b08e641e-985b-4bd4-83ff-6750272d0c37 |
| `legacy/comfyui-json-compiler` | [`comfyui-json-compiler`](https://github.com/belentani7/comfyui-json-compiler) | 55 | pub | pages+vercel | Translate natural language creative briefs into valid ComfyUI JSON workflows using LLMs. |
| `legacy/gpu-cost-optimizer` | [`gpu-cost-optimizer`](https://github.com/belentani7/gpu-cost-optimizer) | 43 | pub | pages+vercel | Optimize GPU compute costs in diffusion pipelines by up to 70%. |
| `legacy/latent-consistency-bench` | [`latent-consistency-bench`](https://github.com/belentani7/latent-consistency-bench) | 43 | pub | pages+vercel | Benchmarking visual consistency in AI-generated content. |
| `legacy/temporal-artifact-detector` | [`temporal-artifact-detector`](https://github.com/belentani7/temporal-artifact-detector) | 43 | pub | pages+vercel | Python tool for detecting flickering and temporal artifacts in AI-generated videos. |
| `legacy/llm-vfx-orchestrator` | [`llm-vfx-orchestrator`](https://github.com/belentani7/llm-vfx-orchestrator) | 41 | pub | pages+vercel | Autonomous VFX pipeline orchestration using LLMs connected to ComfyUI APIs. |
| `legacy/pbr-validator` | [`pbr-validator`](https://github.com/belentani7/pbr-validator) | 38 | pub | pages+vercel | Validates PBR texture sets for correctness and compatibility with game engines. |
| `legacy/misaas` | [`misaas`](https://github.com/belentani7/misaas) | 31 | pub | pages+vercel | Frontend SaaS premium con hero WebGL para orquestación de agentes autónomos. Landing page  |
| `legacy/ai-fashion-app-frontend` | [`ai-fashion-app-frontend`](https://github.com/belentani7/ai-fashion-app-frontend) | 30 | pub | pages | Proyecto frontend del ecosistema Belentani. |
| `legacy/neon` | [`neon`](https://github.com/belentani7/neon) | 29 | priv | — | Neon — cyberpunk visual experiment and generative art playground |
| `legacy/opendesign` | [`opendesign`](https://github.com/belentani7/opendesign) | 17 | pub | pages+vercel | Recopilación abierta de sistemas de diseño y maquetas de referencia. |
| `legacy/ai-fashion-app-server` | [`ai-fashion-app-server`](https://github.com/belentani7/ai-fashion-app-server) | 15 | priv | — | Proyecto server del ecosistema Belentani. |
| `legacy/premium-effects-registry` | [`premium-effects-registry`](https://github.com/belentani7/premium-effects-registry) | 11 | pub | — | Curated collection of 50+ GitHub repos for premium frontend visual effects — liquid logos, |
| `legacy/premium-effects` | [`premium-effects`](https://github.com/belentani7/premium-effects) | 9 | priv | — | Colección curada de 50+ repos GitHub para efectos visuales premium en frontend |


## Límite de importación del índice privado

La carga local rechaza índices que alteren las **24 identidades** y rutas conservadas, tamaños o textos fuera de límites, visibilidades distintas de las históricas y referencias de archivos que escapen de \`legacy/<identidad>/\`. Se utiliza \`textContent\` en la interfaz, nunca HTML arbitrario de los archivos importados. El índice sigue siendo privado y su importación no autoriza publicar ningún snapshot.

## Archivo de consulta privado — Workbench (octubre de 2026)

Se ha añadido una **interfaz editorial de consulta y búsqueda**, no una fusión de nuevas aplicaciones. `index.html`, `workbench/studio.css` y `workbench/studio.js` implementan una biblioteca corporativa de los **24 snapshots originales**, con búsqueda por identidad/propósito, filtros de visibilidad **histórica** y acceso a un archivo real de cada carpeta. El catálogo estructurado es `catalog.json`.

**Regla central:** cada carpeta `legacy/<nombre>/` permanece intacta y con su identidad propia. El Workbench **no crea repositorios**, no genera nombres de proyectos a partir de conversaciones y no combina productos diferentes. Se revisaron las 24 rutas; en `lumena` el punto de entrada válido es `client/index.html` porque el snapshot no incluye README. Las tarjetas enlazan a documentos de su propio directorio.

### Abrir de forma privada

En una máquina autorizada, desde la raíz del repositorio:

    python3 -m http.server 8000 --bind 127.0.0.1

Abre `http://127.0.0.1:8000`. El navegador consulta `catalog.json` desde el mismo origen; no carga bibliotecas externas ni envía credenciales. El servidor es local **solo si se mantiene unido a 127.0.0.1**. No abrirlo en una dirección pública, no desplegarlo en GitHub Pages/Vercel y no compartir capturas que revelen información privada de otros productos.

### Contrato de calidad

    node --check workbench/studio.js
    node --test tests/workbench.test.mjs

El test revisa que los directorios reales coincidan exactamente con las 24 identidades de origen, que cada enlace local apunte a un archivo existente, que el portal se mantenga `noindex`, y que los filtros no inyecten HTML. La CI **solo valida** el archivo: no tiene job de despliegue.

La tabla original anterior registra tamaños y visibilidad del inventario histórico fechado en 2026-10-02. **No es una lectura de permisos actuales** y `noindex` no sustituye controles de acceso. El código privado o de terceros no obtiene automáticamente licencias de redistribución por estar archivado aquí.

**Estado:** implementación guardada en una rama y PR de revisión. Es un producto **interno**, no una web pública; antes de cualquier redistribución se deben separar los materiales autorizados y verificar derechos y visibilidad actual. Todos los proyectos individuales siguen siendo independientes.
