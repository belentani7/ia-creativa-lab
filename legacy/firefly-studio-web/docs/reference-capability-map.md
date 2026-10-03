# Mapa de Capacidades de Referencia

Los HTML aportados muestran un estudio creativo con categorías de imagen, vídeo, audio, exploración, biblioteca, acciones rápidas y herramientas de producción. Se han usado únicamente como **referencia de categorías de producto y jerarquía de trabajo**. Firefly Studio mantiene una identidad visual, nomenclatura y estructura propias; no reutiliza componentes, código, recursos ni marca de la referencia.

| Categoría observada | Adaptación en Firefly Studio | Estado de implementación |
| --- | --- | --- |
| Generación y edición de imagen | Generar, Relleno, Estilo, Ajustar; más acciones rápidas que encaminan a esos flujos | Activa |
| Ampliar y quitar objeto | Variantes guiadas de Generative Fill que reutilizan la máscara y la inferencia de imagen existente | Activa como flujo guiado |
| Descubrimiento | Centro de herramientas con filtros y ejemplos de inicio | Activo en esta iteración |
| Biblioteca | Historial personal, restauración de prompt, descarga y eliminación del registro | Activa |
| Audio | Transcripción de archivos de audio mediante el servicio Voice Transcription disponible | Activa en esta iteración |
| Vídeo, voz sintética y música | Tarjetas informativas preparadas para una futura integración de proveedor, sin simular resultados | Preparadas, no activas |

## Principios de producto

La aplicación muestra siempre qué herramienta está disponible realmente. Los procesos de imagen y transcripción se ejecutan en servidor a través de los helpers oficiales; las tarjetas de vídeo, voz y música no aceptan trabajos ni presentan resultados ficticios. Esta separación evita promesas de producto que no están respaldadas por un proveedor conectado.

Las acciones rápidas no crean caminos paralelos de inferencia. En su lugar, establecen un contexto de trabajo sobre los cuatro flujos ya soportados, de modo que la persistencia, validación, optimización de prompts y galería sigan usando el mismo contrato robusto.
