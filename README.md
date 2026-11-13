# ia-creativa-lab

Este repositorio conserva un workbench interno de investigación creativa. No es una aplicación pública ni una nueva plataforma independiente.

La entrada pública única es [Belentani AI Lab](https://www.belentani.es/ai-lab). Los accesos de Vercel y GitHub Pages de este repositorio se derivan allí para evitar publicar el contenido interno.

El archivo de trabajo se conserva dentro de `legacy/`, con sus pruebas de integridad en `tests/`. La CI valida que las 24 carpetas originales sigan completas, que no se mezclen proyectos y que el workbench no ejecute HTML o código externo de forma insegura.

Para revisar el workbench de forma local:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
node --check workbench/studio.js
node --test tests/workbench.test.mjs
```

La plataforma, navegación y experiencias publicables viven en [www.belentani.es](https://www.belentani.es/).
