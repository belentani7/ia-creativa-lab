# Dirección visual — Red Starfield

## Enfoques considerados

### Theme Name: Observatorio Carmesí
Very Brief Intro: Una experiencia cósmica editorial y científica, con oscuridad mineral, estrellas precisas y un rojo que aparece como un fenómeno astronómico. Busca asombro silencioso y profundidad.
Probability: 0.04

### Theme Name: Solar Flare Ritual
Very Brief Intro: Un universo más dramático y ceremonial, donde la transformación roja se siente como una activación energética. Contraste intenso, halos cálidos y movimiento hipnótico.
Probability: 0.07

### Theme Name: Orbital Instrument
Very Brief Intro: Una interfaz experimental inspirada en instrumentos de observación espacial, con capas, coordenadas y controles mínimos alrededor de un campo estelar vivo.
Probability: 0.02

## Enfoque elegido: Observatorio Carmesí

### Design Movement
Ciencia ficción editorial contemporánea, combinada con visualización científica de datos y minimalismo brutalista refinado.

### Core Principles
1. La profundidad debe percibirse antes que cualquier decoración.
2. El rojo es un fenómeno progresivo, no un simple color de fondo.
3. La interfaz se mantiene contenida y deja respirar al campo estelar.
4. Cada interacción debe sentirse como ajustar un instrumento óptico.

### Color Philosophy
El negro carbón representa el vacío y permite que cada estrella tenga presencia física. El blanco frío y el azul acero pertenecen a la fase estable del universo. El rojo carmesí aparece lentamente como una señal de transformación; no se usa como degradado ornamental, sino como estado visual con energía y temperatura.

### Layout Paradigm
Composición asimétrica de pantalla completa: la escena 3D ocupa el lienzo y los controles viven en una columna lateral estrecha, como una consola de observatorio. El centro permanece visualmente libre para que la cámara y las partículas sean protagonistas.

### Signature Elements
- Una línea de estado vertical que se calienta de azul acero a rojo carmesí.
- Etiquetas de coordenadas pequeñas, monoespaciadas y casi cartográficas.
- Un halo rojo radial que crece con la progresión cromática sin ocultar las estrellas.

### Interaction Philosophy
El cursor funciona como un campo gravitacional suave: desplaza ligeramente la perspectiva y altera la densidad aparente de las partículas. Los controles son discretos, directos y reversibles.

### Animation
La cámara avanza lentamente en profundidad con parallax de capas. Las estrellas lejanas titilan con baja amplitud; las cercanas escalan y dejan trazas cortas. La transición cromática dura varios segundos y combina interpolación de color, aumento de bloom y ligera expansión del halo. El movimiento se pausa o reduce con `prefers-reduced-motion`.

### Typography System
Titulares en Space Grotesk, con peso 500 y tracking ajustado. Microcopy, coordenadas y valores en IBM Plex Mono. La jerarquía usa mayúsculas pequeñas, números amplios y mucho espacio negativo, evitando textos largos sobre la escena.

### Brand Essence
Un observatorio interactivo para sentir cómo un universo cambia de estado; dirigido a experiencias digitales inmersivas que quieren parecer instrumentos, no plantillas. Personalidad: preciso, hipnótico, tectónico.

### Brand Voice
Los titulares son breves y evocadores; los CTA suenan a acción instrumental, nunca a marketing genérico.
- “Observe the red shift.”
- “Enter the stellar field.”

### Wordmark & Logo
Un símbolo abstracto sin texto: cuatro puntos orbitales alrededor de un núcleo desplazado, formando una constelación incompleta que sugiere movimiento y cambio de eje.

### Signature Brand Color
Carmesí de desplazamiento: `#E23B50`, usado únicamente cuando la transformación alcanza un estado perceptible.

## Decisión de implementación
La primera entrega será un asset frontend React autocontenido, sin video: canvas 2D de alto rendimiento con proyección pseudo-3D, interacción de puntero, controles de intensidad y transición de estrellas blancas/azules a carmesí. La estética visual seguirá estrictamente Observatorio Carmesí.

## Style Decisions
- El rojo debe leerse como un evento astronómico progresivo.
- El campo de estrellas siempre domina visualmente a la interfaz.
- Evitar gradientes morados, tarjetas redondeadas genéricas y layouts centrados.
- Usar controles mínimos, angulares y de apariencia instrumental.
