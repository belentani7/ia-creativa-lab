# Firefly Studio - Requisitos Verificables y Arquitectura

## 1. Resumen de Requisitos
- **Estudio Creativo (Landing & Studio):** Interfaz en dark mode inspirada en Adobe Firefly, con navegación fluida y selector de módulos creativos avanzados.
- **Text-to-Image:** Generación a partir de un prompt de texto, con control de dimensiones, ratio y pasos.
- **Relleno Generativo (Generative Fill):** Pintado de máscaras interactivas sobre imágenes subidas por el usuario, combinadas con prompts de inpainting.
- **Referencia de Estilo (Style Reference):** Inyección de estilo mediante FLUX.1 Redux (imagen base + imagen de referencia de estilo + slider de intensidad).
- **Ajuste Paramétrico (Adjust / InstructPix2Pix):** Modificación de iluminación, ambiente y estilo mediante instrucciones de lenguaje natural procesadas por InstructPix2Pix.
- **Galería Personal:** Historial de creaciones del usuario guardado en base de datos con visualización, descarga y eliminación.
- **Autenticación:** Exclusiva mediante Manus OAuth.
- **Backend & Almacenamiento:** tRPC con FastAPI/Express, llamadas a `generateImage()` (Manus Image Generation API) y almacenamiento S3 mediante `storagePut()`.

## 2. Verificación del proveedor disponible

La API de imágenes disponible en el entorno expone actualmente `MODEL_GEMINI_2_5_FLASH_IMAGE_PREVIEW` y `MODEL_GPT_IMAGE_2`. No expone identificadores dedicados para FLUX.1 Redux ni InstructPix2Pix. Por ello, el backend mantiene los perfiles creativos solicitados y los traduce a prompts de edición con referencias originales, usando `MODEL_GPT_IMAGE_2` como fallback permitido por la propia API cuando el modelo dedicado no está disponible. La respuesta marca `resolvedFallback: true` y la interfaz muestra esta condición para no presentar como dedicado un motor que el proveedor no expone.

Cuando la API incorpore un modelo compatible, el resolver lo seleccionará automáticamente mediante coincidencia por identificador, sin cambiar el contrato de la interfaz.

## 3. Refinamiento interno de prompts

Antes de cada inferencia, el servidor transforma el prompt original en una versión optimizada para el módulo creativo seleccionado. El refinador trabaja exclusivamente en servidor mediante el LLM integrado, devuelve una respuesta JSON estructurada y no expone razonamiento interno al cliente.

La mejora es iterativa, pero deliberadamente acotada: se realizan como máximo tres pasadas y se detiene antes si la puntuación alcanza el umbral de saturación o si la mejora entre pasadas deja de ser material. Esta convergencia controlada evita bucles infinitos, latencia impredecible y consumo ilimitado. Si el proveedor LLM no está disponible, se utiliza un enriquecimiento determinista que conserva la intención original y añade las restricciones del lienzo.

Cada generación persiste el prompt original, el prompt optimizado, el número de iteraciones LLM y la puntuación de calidad. El historial conserva así la versión realmente enviada al motor de imágenes, mientras que la interfaz permite reutilizarla sin mostrar la cadena interna de razonamiento.
