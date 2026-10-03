# MiSaaS — Mission Control

Frontend SaaS premium con hero WebGL para orquestación de agentes autónomos. Landing page + dashboard operativo, sin dependencias de build: HTML, CSS y JavaScript puro.

![stack](https://img.shields.io/badge/stack-HTML%20%2B%20CSS%20%2B%20JS-00f3ff) ![webgl](https://img.shields.io/badge/WebGL-Three.js-d4af37) ![license](https://img.shields.io/badge/license-MIT-34d399)

## Qué incluye

| Página | Descripción |
|---|---|
| `index.html` | Landing con núcleo de partículas WebGL (shader propio), bento de producto, terminal en vivo, precios y CTA |
| `app.html` | Dashboard operativo: KPIs con sparklines, gráfica de rendimiento interactiva, tabla de agentes con filtros, feed en vivo |

## Características

- **Hero WebGL** — 4.600 partículas en esfera áurea con ruido procedural en el vertex shader, blending aditivo, parallax de ratón y pausa automática al ocultar la pestaña.
- **Diseño premium** — tema oscuro, un solo acento (cian `#00f3ff`), glassmorphism real con bordes y profundidad, grano de película, scanlines y rejilla técnica.
- **Dashboard funcional** — gráfica de área con animación de entrada y crosshair, sparklines por KPI, filtros por estado, búsqueda con `Ctrl+K`, switches por agente y logs que se actualizan solos.
- **Rendimiento** — cero frameworks, cero build, DPR limitado a 2, animaciones pausadas fuera de viewport, `prefers-reduced-motion` respetado en todo.
- **Accesibilidad** — canvas decorativos con `aria-hidden`, switches con `role="switch"`, contraste de texto ≥ 4.5:1, fallback CSS si WebGL no está disponible.

## Estructura

```
MiSaaS/
├── index.html
├── app.html
├── assets/
│   ├── css/main.css        # design system completo (tokens, componentes, responsive)
│   └── js/
│       ├── webgl-core.js   # escena WebGL reutilizable (clase CoreScene)
│       ├── landing.js      # interacciones de la landing
│       └── dashboard.js    # lógica del dashboard
├── README.md
└── LICENSE
```

## Arranque

No requiere instalación. Abre `index.html` en el navegador, o sirve la carpeta:

```bash
cd C:\Users\USER\Desktop\MiSaaS
python -m http.server 8080
# http://localhost:8080
```

Three.js se carga desde CDN (`unpkg`). Si no hay red o WebGL, la página funciona igual: el canvas se oculta y queda el fondo CSS.

## Personalización

- **Colores y tipografía**: variables CSS en `:root` (`assets/css/main.css`). Cambia `--accent` para recolorear todo el sistema.
- **Núcleo WebGL**: parámetros en la llamada a `CoreScene` (`count`, `radius`, `size`, `turbulence`, `speed`). El shader vive en `webgl-core.js`.
- **Datos**: los agentes, logs y actividad del dashboard están en arrays al inicio de `dashboard.js`, listos para sustituir por una API real.

## Licencia

MIT © 2026 Pedro Belentani. Ver [LICENSE](LICENSE).
