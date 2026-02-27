# UX_AUDIT.md — Generador Inteligente de Clips

**Versión auditada:** Prototipo funcional v0.1 (mock AI)
**Fecha de auditoría:** Febrero 2026
**Tipo:** Auditoría de UX y producto — sin cambios de código

---

## 1. Resumen Ejecutivo

El Generador Inteligente de Clips tiene una propuesta de valor sólida y bien definida: extraer momentos virales de contenido largo usando IA. El diseño visual es ambicioso y cuidado — la tipografía pesada, los radios extremos y la paleta indigo/slate crean una identidad de herramienta profesional moderna. Sin embargo, la arquitectura de pantallas está sobredimensionada para la tarea real: el flujo tiene 7 estados distintos donde podrían ser 3 o 4, y los puntos de mayor fricción están exactamente en los momentos más críticos para el usuario (configuración inicial, curación de clips, obtención del resultado).

El problema central no es estético sino conceptual: **la herramienta trata cada paso del proceso como una pantalla separada, cuando el usuario solo quiere una cosa: pasar de su video a sus clips descargados con el mínimo de interrupciones posible.** Los estados de carga intermedios, la pantalla de resultados incompleta y la ausencia total de persistencia convierten un flujo de trabajo profesional en una experiencia descartable. El prototipo demuestra que el problema del producto está resuelto en la cabeza de sus creadores, pero aún no está resuelto para el usuario.

---

## 2. Análisis del Flujo Actual

### Diagrama de flujo (actual)

```
UPLOAD
  │
  ├─ [click en zona de drop] → archivo simulado aparece
  │
  ├─ [formulario de config aparece] → style, platform, keywords, minScore
  │
  └─ [Empezar Análisis] ──►  INITIAL_PROCESSING (5s, auto-avanza)
                                    │
                                    └──► PREVIEW (3 tabs)
                                            │
                                            ├─ [Re-analizar] → ADJUSTMENT_MODAL
                                            │                        │
                                            │                        └──► RE_ANALYSIS (3s, auto-avanza)
                                            │                                  │
                                            │                                  └──► PREVIEW
                                            │
                                            ├─ [Nuevo Clip] → MANUAL_CLIP_MODAL
                                            │
                                            └─ [Generar N Clips] ──► GENERATING (auto-avanza)
                                                                            │
                                                                            └──► RESULTS
                                                                                    │
                                                                                    ├─ [Descargar ZIP] → alert()
                                                                                    ├─ [Ir a Biblioteca] → LIBRARY
                                                                                    ├─ [Generar más] → PREVIEW (BUG: clips vacíos)
                                                                                    └─ [Nuevo Video] → UPLOAD

HEADER: Logo → UPLOAD | Nuevo → UPLOAD | Biblioteca → LIBRARY
  └─ [solo si LIBRARY && activeClips > 0] → botón "Análisis en Curso" → PREVIEW
```

### Problemas estructurales del flujo

**1. Dos pantallas de carga son una de más.**
`INITIAL_PROCESSING` y `RE_ANALYSIS` son la misma pantalla con una prop diferente (`type: 'initial' | 'reanalysis'`). Ambas se auto-resuelven tras un timer y navegan al mismo destino: `PREVIEW`. Ocupan un estado de la máquina de estados y una pantalla entera para algo que en una aplicación real podría ser un overlay sobre `PREVIEW` o un estado de loading inline. El usuario no tiene nada que hacer en esas pantallas excepto esperar. El tiempo de espera es un artificio del mock, no de la arquitectura de la IA.

**2. `GENERATING` es una pantalla innecesaria en este contexto.**
La pantalla de generación procesa clips uno a uno en secuencia durante ~3-6 segundos en total. En la versión real, el procesamiento de video será asíncrono y potencialmente largo (minutos). La arquitectura actual anticipa mal ese caso: si la generación real tarda 5 minutos, el usuario no puede hacer nada más en la app. Si tarda 5 segundos, la pantalla no aporta valor. En ninguno de los dos casos es la solución correcta.

**3. `RESULTS` está partida del concepto correcto.**
La pantalla de resultados muestra únicamente los clips con `isNew: true`. Esto parece correcto hasta que el usuario navega ahí desde Biblioteca o tras un refresco accidental: entonces ve clips históricos o nada. El concepto de "recién generados" es efímero y no está persistido, lo que hace que esa pantalla sea inutilizable como referencia.

**4. El flujo "Generar más" está roto en origen.**
`onGenerateMore` en `ResultsScreen` llama a `setCurrentScreen(Screen.PREVIEW)` directamente. En ese momento, `activeClips` ya fue vaciado por `onGenerationComplete` (línea 92 de App.tsx: `setActiveClips([])`). El usuario llega a `PREVIEW` con cero clips, el sticky bottom bar muestra "Generar 0 Clips" desactivado, y el tab "Clips Sugeridos (0)" confirma que no hay nada. Este bug no es un edge case: es el flujo explícito del botón principal de la pantalla de resultados.

**5. La navegación header es inconsistente con el estado de la app.**
El header tiene "Nuevo" y el logo, ambos disparando `handleGoToUpload`. Si el usuario está en `PREVIEW` con 5 clips curados y hace clic accidentalmente en el logo, pierde todo sin confirmación. No hay ningún mecanismo de protección. La única señal de sesión activa es el botón "Análisis en Curso", que además solo aparece **si el usuario ya está en LIBRARY**, no en ninguna otra pantalla.

---

## 3. Auditoría por Pantalla

### 3.1 UploadScreen

**El manual de usuario interrumpe el flujo.**
El componente `UserManual` — cuatro tarjetas que explican el proceso — se renderiza entre el headline y la zona de drop. Para un usuario que ya conoce la herramienta (que es el caso tras la primera sesión), esto es ruido permanente que empuja la zona de acción hacia abajo. No es colapsable, no recuerda si ya fue leído, y aparece en cada visita a Upload. Un onboarding progresivo o una versión colapsada sería más respetuosa del espacio para usuarios recurrentes.

**El archivo se "sube" antes de configurar, pero la configuración determina el análisis.**
El flujo actual es: clic en zona de drop → archivo "seleccionado" → configuración aparece. Esto es correcto en intención, pero la implementación hace que la zona de drop muestre "Arrastra tu video/audio aquí o haz clic para buscar" y al hacer clic ya carga el archivo simulado. No hay diálogo de selección real, ni drag & drop real. Para una herramienta real, el punto crítico de UX es aquí: el usuario debe poder ver cuánto tardará la transcripción antes de comprometerse con el análisis.

**Los parámetros tienen sobrecarga cognitiva para una primera sesión.**
La pantalla de configuración post-upload pide simultáneamente: estilo de clip (5 opciones), plataforma (4 opciones), palabras clave y score mínimo. Cuatro dimensiones de decisión antes de saber nada sobre lo que la IA va a encontrar. Una solución mejor sería permitir que la IA analice con defaults inteligentes y que el usuario ajuste **después de ver los resultados**, no antes de verlos.

**El botón "Restablecer por defecto" es inaccesible en mobile.**
El botón de reset de parámetros está colocado a la derecha del título de sección, en el mismo flex container que el label "Ajustes Pre-Análisis". En mobile, el label se oculta pero el botón permanece. Sin embargo, compite visualmente con el título y no queda claro que es una acción y no un descriptor.

**La etiqueta "Listo para Analizar" con el punto verde pulsante es prematura.**
El archivo aún no ha sido validado, procesado ni subido. Mostrar feedback positivo animado en este punto construye una expectativa falsa. El estado real del sistema es "archivo seleccionado localmente", no "listo para analizar".

---

### 3.2 ProcessingScreen (INITIAL_PROCESSING y RE_ANALYSIS)

**El usuario no tiene control ni puede escapar.**
Durante 5 segundos (o 3 en re-análisis), el usuario ve una barra de progreso avanzar. No hay botón de cancelar, no hay forma de ajustar parámetros mientras espera, y no puede hacer nada más. En la versión real con IA de verdad, estos tiempos serán de 30-60+ segundos. Una pantalla de bloqueo total durante ese tiempo es inaceptable para una herramienta profesional.

**"Tiempo restante: ~N segundos" es un cálculo falso que desorienta.**
La estimación del tiempo restante se calcula como `Math.max(0, Math.ceil((100 - progress) * (type === 'initial' ? 0.05 : 0.03)))`. Esto produce valores como "~5 segundos", "~4 segundos", etc. en descenso lineal. En una IA real, el tiempo es variable y esta precisión falsa generará desconfianza cuando no se cumpla.

**El re-análisis reutiliza la transcripción pero la UI no lo explota suficientemente.**
El texto "Transcripción guardada (reutilizada)" en el primer paso del re-análisis es correcto conceptualmente: la transcripción ya existe y solo se re-analiza con nuevos parámetros. Pero este ahorro de tiempo/costo debería destacarse más prominentemente como ventaja de la herramienta, no sepultarse como un paso más de la lista.

**Dos pantallas de carga idénticas con nombres de estados distintos en el enum.**
`INITIAL_PROCESSING` y `RE_ANALYSIS` son estados separados en el enum `Screen`. Esta separación tiene sentido para renderizar el tipo correcto en `ProcessingScreen`, pero crea dos entradas en la máquina de estados para lo que es conceptualmente una sola operación. A medida que la app crezca, esto complica el razonamiento sobre el estado global.

---

### 3.3 PreviewScreen

**El tab "Resumen" tiene el problema de los tabs que no son tabs.**
El tab "Resumen" muestra estadísticas del análisis (clips encontrados, score promedio, duración total), el clip destacado y un ranking top-5. El botón "Editar clips" al final del ranking navega al tab "Clips Sugeridos". Este es el único flujo de avance progresivo entre tabs, pero está enterrado al final de una pantalla larga. La mayoría de usuarios que lleguen al Resumen directamente no sabrán que deben ir a "Clips" para hacer el trabajo real.

**Todos los clips llegan seleccionados por defecto — curar es un anti-patrón.**
Los `mockClips` tienen `selected: true`. Esto significa que el botón sticky dice "Generar 3 Clips" desde el primer segundo, y el usuario puede generar todo sin revisar nada. El diseño de la herramienta sugiere que la curación es el valor central (el hook de la IA, el score, la justificación expandible), pero el comportamiento por defecto la hace irrelevante. Esto corrompe el modelo mental de la herramienta: ¿para qué sirve el score si todo se genera igual?

**La barra sticky inferior tiene tres acciones con jerarquía visual equivocada.**
El sticky bar tiene: "Re-analizar" | "Nuevo Clip" | "Generar N Clips". Las tres tienen peso visual similar. "Re-analizar" y "Nuevo Clip" son acciones de preparación; "Generar" es el CTA principal. La jerarquía debería ser mucho más clara. Además, "Re-analizar" en la barra sticky abre el `AdjustmentModal`, pero el mismo modal se puede abrir desde el tab "Clips" a través del dropdown "Configuración IA" — dos rutas distintas al mismo modal sin señalización.

**El tab "Transcripción" es una isla de funcionalidad desconectada.**
La transcripción tiene un feature genuinamente valioso: hover en una línea → botón para crear clip manual con el tiempo pre-rellenado. Pero al activar este botón, la lógica hace `setActiveTab('clips')` — cambia de tab mientras abre el modal. Cuando el modal se cierra, el usuario está en el tab Clips, no en Transcripción donde estaba trabajando. Rompe el flujo de lectura de la transcripción.

**El buscador de transcripción filtra solo por texto exacto en español sin normalización.**
El filtro usa `.toLowerCase().includes(searchQuery.toLowerCase())`. Esto no maneja acentos: buscar "análisis" no encontrará "analisis" ni viceversa. Para una herramienta de contenido en español, la búsqueda sin normalización de diacríticos es un bug funcional encubierto como feature.

**El `ClipCard` mezcla curación y edición en el mismo componente.**
El ClipCard combina: checkbox de selección, controles ±5s de inicio/fin, indicador de duración, y el panel expandible de justificación IA. Esta es mucha densidad informacional en un solo componente. El ajuste de ±5s es útil, pero la granularidad de 5 segundos puede ser insuficiente (y sin pre-visualización del resultado del corte, el usuario ajusta a ciegas).

---

### 3.4 GenerationScreen

**El usuario está bloqueado durante la "renderización" sin razón aparente.**
La pantalla de generación procesa clips secuencialmente a razón de ~2 segundos por clip. Con 3 clips, el proceso dura ~6 segundos. Durante ese tiempo el usuario solo puede mirar. El mensaje "No cierres esta pestaña durante el proceso" refuerza la sensación de estar atrapado. En el mundo real (procesamiento de video real), esto sería un trabajo background con notificación.

**El progreso global empieza en 0% aunque el primero se "complete" al 33%.**
`globalProgress` empieza en 0 y sube de golpe al 33% cuando termina el primer clip (si hay 3). La barra de progreso da saltos en lugar de avanzar continuamente, lo que no refleja el progreso real del sistema y genera ansiedad innecesaria.

**No hay resumen de lo que se está generando.**
La pantalla muestra la lista de clips en cola, pero no recuerda al usuario qué parámetros se usaron para elegirlos. Si el usuario llega a esta pantalla y no está seguro de qué clips seleccionó, no tiene forma de saberlo sin cancelar.

---

### 3.5 ResultsScreen

**La acción principal (descarga) es un `alert()`.**
`handleDownloadAll` llama a `alert("Iniciando descarga de " + clips.length + " clips en formato ZIP...")`. Esto es el punto culminante de todo el flujo — el usuario finalmente tiene sus clips — y la respuesta del sistema es un diálogo nativo del navegador con texto plano. No hay descarga real, no hay feedback de progreso, no hay URL, no hay nada. El botón es el más grande y prominente de la pantalla, y es una promesa rota.

**El video mostrado es Big Buck Bunny — no tiene ninguna relación con el contenido del usuario.**
Todos los clips expandidos muestran el mismo video de muestra: `BigBuckBunny.mp4#t=10,30`. El poster es una imagen aleatoria de picsum.photos generada con el `clip.id` como seed. El usuario que llega a esta pantalla esperando ver su clip cortado ve un conejo animado. Esto destruye la credibilidad del prototipo en una demo.

**"Generar más" está irremediablemente roto.**
El botón "Generar más" llama a `setCurrentScreen(Screen.PREVIEW)` cuando `activeClips` ya está vacío. No solo el flujo falla funcionalmente — la pantalla de Preview resultante muestra el tab "Clips Sugeridos (0)" y la barra sticky con "Generar 0 Clips" desactivado. No hay mensaje de error, no hay guía, no hay camino de recuperación.

**La pantalla de resultados muestra clips de toda la biblioteca, no solo los nuevos.**
`ResultsScreen` recibe `generatedClips` completos (incluyendo el clip histórico "Claves de Inversión 2024" hardcodeado en el estado inicial de App.tsx). Luego filtra con `.filter(c => c.isNew)` para mostrar solo los recientes. Pero si `isNew` se pierde (por ejemplo, en un flujo re-abierto o futuro sistema de persistencia), la pantalla mostrará todo el historial mezclado con "Nuevo" badges.

**El botón "Descargar Clip MP4" individual tampoco hace nada.**
Dentro de cada clip expandido hay un botón "Descargar Clip MP4" que no tiene `onClick`. Al hacer clic, no ocurre nada — ni alert, ni feedback, ni error. En combinación con el "Descargar ZIP" que dispara un alert, el resultado es una pantalla con cuatro botones de descarga donde uno dispara un alert, los demás son decorativos, y ninguno descarga nada.

---

### 3.6 LibraryScreen

**La Biblioteca convive incómodamente con el concepto de "proyecto activo".**
Si el usuario tiene un análisis en curso y navega a Biblioteca, la pantalla muestra un callout prominente "Análisis en curso: podcast_episodio_42_final.mp4". Esto es correcto. Pero el header también debería mostrar esta señal, y solo lo hace exactamente cuando `currentScreen === Screen.LIBRARY && hasActiveProject`. La condición es demasiado restrictiva: el usuario que está en Processing o Preview tampoco tiene señal de sesión activa en el header.

**"Por Proyectos" muestra un botón "Nuevo Proyecto" en cada grupo de proyecto.**
En la vista Por Proyectos, cada card de video tiene un botón "Nuevo Proyecto" que llama a `onNewVideo`. Esto es correcto en funcionalidad, pero colocarlo dentro de cada proyecto existente crea una ambigüedad: ¿es "nuevo proyecto para este video" o "nuevo proyecto en general"? La respuesta es lo segundo, pero el contexto sugiere lo primero.

**El "Viral Ranking Historial" con Top 3 es decorativo sin acciones claras.**
La sección de ranking global en modo dark (fondo `slate-900`) muestra los 3 mejores clips de toda la biblioteca. Cada tarjeta tiene un botón "Detalles" que abre el modal del clip. El modal tiene "Descargar MP4" (que dispara `alert()`) y "Compartir Link" (que no tiene `onClick`). Dos acciones, cero funcionamiento.

**"Limpiar Biblioteca" es una acción destructiva de primer nivel sin fricción suficiente.**
El botón "Limpiar Biblioteca" está en la parte superior de la sección de contenido, junto al título "Proyectos (Videos Procesados)". Tiene color rojo sutil pero es texto plano pequeño. Sí abre un modal de confirmación, pero el texto del modal dice "Esta acción es irreversible y eliminará todos los N clips generados y su historial de análisis" — y no hay ninguna opción de exportar antes de borrar.

**La vista "Todos los Clips" en grid de 4 columnas trunca demasiado.**
En la vista `all-clips`, las tarjetas están en un grid `grid-cols-4`. El título del clip usa `truncate` y el hook usa `line-clamp-3`. Con títulos largos en 4 columnas estrechas, los usuarios no pueden comparar clips sin abrirlos uno a uno. La densidad supera la utilidad.

---

### 3.7 Header y Navegación Global

**"Análisis en Curso" solo aparece en una pantalla de las siete.**
La condición `hasActiveProject && currentScreen === Screen.LIBRARY` hace que el indicador de sesión activa en el header sea invisible en todas las pantallas excepto Biblioteca. Si el usuario está en Upload, Results o en cualquier otro estado, no hay señal de que tiene un análisis sin terminar. Esto es especialmente problemático si el usuario navega a "Nuevo" desde el header mid-session.

**"Nuevo" y el logo hacen lo mismo: ambos van a Upload.**
El logo (onclick → `handleGoToUpload`) y el botón "Nuevo" (onclick → `handleGoToUpload`) ejecutan la misma función. Si el usuario tiene un análisis activo, cualquiera de los dos lo destruye silenciosamente. No hay confirmación, no hay advertencia, no hay "¿seguro que quieres abandonar tu sesión actual?".

**El header no refleja el estado de la pantalla activa.**
Solo "Biblioteca" tiene un estado visual activo (`text-indigo-600`). Las otras pantallas no tienen indicador de ubicación. El usuario en Processing, Preview o Generation no tiene ninguna señal en el header de dónde está ni de cómo volver.

**El contador de clips en Biblioteca (`clipCount`) cuenta clips históricos más nuevos.**
El badge numérico en "Biblioteca" muestra `generatedClips.length`, que incluye el clip hardcodeado "Claves de Inversión 2024" desde el estado inicial. En la primera carga de la app (sin haber hecho nada), el contador ya muestra "1". Esto confunde al usuario sobre el estado real de su biblioteca.

---

## 4. Propuesta de Flujo Restructurado

### Diagrama de flujo propuesto

```
UPLOAD + CONFIG
  │
  │   [Archivo seleccionado + parámetros opcionales]
  │
  └──► WORKSPACE (pantalla central unificada)
          │
          ├─── Estado: ANALIZANDO (loader inline, no pantalla separada)
          │                │
          │                └──► [Análisis completo] → clips aparecen en el panel
          │
          ├─── Panel izquierdo: Lista de clips (IA + Manuales)
          │    └─ Cada clip: checkbox, score, timestamps editables, hook expandible
          │
          ├─── Panel derecho/tab: Transcripción con diarización
          │    └─ Click en línea → clip manual pre-rellenado (sin cambio de tab)
          │
          ├─── Sidebar/drawer: Parámetros de análisis (sin modal separado)
          │    └─ [Actualizar análisis] → re-analiza inline, reemplaza clips
          │
          └─── Acción principal: [Generar clips seleccionados]
                    │
                    └──► GENERANDO (overlay o barra de progreso, no pantalla separada)
                              │
                              └──► RESULTADOS (inline en Workspace o pantalla simple)
                                        │
                                        ├─ Previsualización real del clip
                                        ├─ Descarga individual funcional
                                        └─ [Volver al Workspace del mismo video]

HEADER: Logo | [Video activo: nombre.mp4 ●] | Biblioteca
```

### Justificación de cada cambio

**Fusionar Upload y Config en una sola pantalla.**
El flujo actual de "clic para seleccionar → archivo aparece → config aparece" simula dos pasos donde debería ser uno. La configuración de parámetros debe estar disponible desde el inicio, con defaults inteligentes y la posibilidad de ajustar. El CTA principal es "Analizar" y debería estar visible desde el momento en que hay un archivo.

**Eliminar ProcessingScreen como pantalla bloqueante y convertirla en estado inline.**
El análisis (inicial o de re-análisis) debería ocurrir como un estado del Workspace, no como una pantalla que expulsa al usuario. Un loader inline o un skeleton en el panel de clips — "Gemini está analizando tu contenido..." — permite que el usuario continúe leyendo la transcripción o ajustando parámetros mientras espera. Esto es especialmente crítico para el re-análisis, donde el usuario ya tiene contexto de la sesión.

**Convertir Preview en un Workspace persistente.**
En lugar de tabs (Resumen / Clips / Transcripción), el Workspace debería tener un layout de dos paneles: el panel de clips a la izquierda (con un resumen colapsable al tope) y la transcripción a la derecha en móviles o en una vista dividida en desktop. Los parámetros de análisis deberían ser un drawer lateral o un panel expandible, no un modal independiente. Esto elimina el AdjustmentModal como entidad separada y el estado RE_ANALYSIS del enum.

**Convertir GenerationScreen en un overlay o una barra de estado.**
La "generación" (exportación real de clips) debería ocurrir en background con una barra de progreso persistente en el header o un toast. Para el mock actual con 5 segundos de duración, un overlay semi-transparente con progreso es suficiente y no bloquea el contexto. Para la versión real con procesamiento de minutos, debe ser asíncrono con notificación.

**Eliminar ResultsScreen como pantalla separada y convertirla en un estado del Workspace.**
Tras la generación, los clips deberían marcarse como "generados" dentro del mismo Workspace y mostrarse con indicadores de descarga disponibles. El usuario no necesita una pantalla nueva para ver lo que ya vio en Preview. Lo que necesita es la acción de descarga funcionando.

**Simplificar la navegación del Header.**
Logo → homepage/upload. Un indicador siempre visible del video en sesión activa (no condicional). Biblioteca siempre accesible. Si el usuario intenta salir con sesión activa, una confirmación concisa: "Tienes un análisis en curso. ¿Quieres abandonarlo?"

### Reducción de estados

```
ACTUAL:  UPLOAD → INITIAL_PROCESSING → PREVIEW → RE_ANALYSIS → GENERATING → RESULTS → LIBRARY
         (7 estados + 2 modales)

PROPUESTO: UPLOAD → WORKSPACE → LIBRARY
           (3 estados + estados de carga inline)
```

---

## 5. Gaps Funcionales y Mejoras

### Prioridad Alta — Bloquean el uso real

**A1. La descarga no funciona.**
Toda la cadena de valor de la herramienta termina en `alert()`. No hay descarga real de ningún clip ni de ningún ZIP. Antes de cualquier otra mejora de UX, la acción primaria debe funcionar. Aunque sea una descarga de un archivo de prueba genérico, el flujo debe ser completo.

**A2. El video de previsualización no tiene relación con el contenido.**
Mostrar Big Buck Bunny como "Vista Previa" del clip del usuario es incompatible con una herramienta profesional. Si no es posible generar el clip real, la previsualización debería mostrar un placeholder honesto ("Previsualización disponible tras la generación real") en lugar de contenido ficticio.

**A3. El flujo "Generar más" está roto.**
`onGenerateMore` en ResultsScreen navega a Preview con `activeClips` vacío. Esto no es un edge case — es el botón principal de una pantalla crítica. Debe corregirse o eliminarse hasta que el flujo sea coherente.

**A4. No hay persistencia.**
Un refresh del navegador destruye todo el estado de la sesión. Para una herramienta de trabajo — donde el usuario puede tardar 20-30 minutos en curar clips de un podcast de 1 hora — perder el trabajo por un refresco accidental es inaceptable. localStorage o sessionStorage para el estado de `activeClips` y `generatedClips` es el mínimo viable.

**A5. Navegar a "Nuevo" sin confirmación destruye la sesión activa.**
No hay protección ante la pérdida de trabajo. Un `beforeunload` o una confirmación modal básica debe existir cuando `activeClips.length > 0` y el usuario intenta navegar fuera.

---

### Prioridad Media — Degradan la experiencia significativamente

**M1. Clips seleccionados por defecto anulan el propósito de la curación.**
Si todos los clips vienen con `selected: true`, el usuario genera todo sin curar nada. La selección por defecto debería ser ninguno (o solo el clip con score más alto, si se quiere facilitar un flujo rápido). El proceso de curación — leer la justificación IA, ajustar timestamps, deseleccionar lo irrelevante — es el diferencial de la herramienta.

**M2. Thumbnails aleatorios de picsum.photos rompen la confianza.**
Las imágenes de picsum.photos son fotos de stock aleatorias sin relación con el contenido. Una thumbnail genérica o un placeholder con el nombre del clip y su timestamp sería más honesto y menos confuso que una foto de arquitectura o naturaleza como "vista previa" del clip.

**M3. La transcripción es un mock completamente desconectado del video.**
La transcripción de muestra tiene 4 grupos de 2 líneas cada uno, cubre de 00:00 a 02:25, y el video "subido" dura 45:12. La proporción es tan absurda que cualquier usuario que intente usar la transcripción para crear un clip manual en el minuto 30 del video encontrará que ese tiempo no existe en la transcripción.

**M4. El score de clips manuales es siempre 10.**
En `ManualClipModal`, el clip se crea con `score: 10` hardcodeado. En el ClipCard, los clips manuales ocultan el score con un "M". Pero en la Biblioteca, la card de clip manual mostraría "10" si se usara el score directamente. Esto no es un bug crítico pero sí una incoherencia conceptual: ¿un clip manual vale siempre más que cualquier sugerencia IA?

**M5. El AdjustmentModal duplica campos del UploadScreen sin ligarlos visualmente.**
Los parámetros de estilo, plataforma, keywords y score están en UploadScreen (pre-análisis) y en AdjustmentModal (re-análisis). Son los mismos campos, pero con estilos ligeramente diferentes. Si el usuario cambia el estilo en AdjustmentModal, ¿cómo sabe que esos parámetros ya no son los del Upload original? No hay indicación de "parámetros actuales vs. originales".

**M6. La búsqueda en transcripción no normaliza diacríticos.**
Para una herramienta de contenido en español, buscar "análisis" y no encontrar "analisis" (o viceversa) es un bug funcional. La normalización Unicode básica con `normalize('NFD').replace(/[\u0300-\u036f]/g, '')` resolvería el caso más común.

**M7. El contador del header ya muestra "1" sin haber hecho nada.**
El clip hardcodeado "Claves de Inversión 2024" en el estado inicial de App.tsx hace que el badge de Biblioteca muestre "1" desde el primer render. Esto no es estado real del usuario — es un mock de ejemplo que no debe contaminar los indicadores de navegación.

---

### Prioridad Baja — Mejoras de pulido

**B1. El `UserManual` debería colapsar tras la primera visita.**
Las cuatro tarjetas de onboarding son útiles la primera vez. En visitas posteriores deberían estar colapsadas o ausentes. Sin persistencia esto no es posible ahora, pero es el comportamiento correcto cuando se implemente localStorage.

**B2. Los ±5s en ClipCard no permiten edición directa del timestamp.**
El único control de precisión para timestamps es el ajuste de ±5s. Para un clip que empieza en 12:47 y el usuario quiere 12:51, son dos clics. Para ir de 00:00 a 12:47, son 153 clics. El diseño debería incluir un input directo de timestamp además de (no en lugar de) los botones de ajuste rápido.

**B3. El campo "Duración Ideal (s)" en AdjustmentModal acepta valores inválidos.**
Los inputs `durationMin` y `durationMax` son `type="number"` sin validación de que `min < max` ni de rangos razonables para clips virales. Un usuario puede poner `durationMin: 500` y `durationMax: 10` sin ninguna advertencia.

**B4. "Compartir Link Directo" en ResultsScreen no tiene `onClick`.**
El botón existe, está visible, y no hace nada. Igual que "Copiar Link Directo" — el nombre cambia pero el comportamiento (ninguno) es el mismo.

**B5. La animación `animate-pulse` en el indicador "Listo para Analizar" es semánticamente incorrecta.**
El punto verde pulsante señala urgencia o actividad en curso. "Listo para analizar" es un estado estático, no activo. La animación de pulso debería reservarse para estados genuinamente activos (procesando, analizando).

**B6. El footer menciona "Gemini 2.5 Pro" en una herramienta completamente mockeada.**
El footer dice "Potenciado por Gemini 2.5 Pro". En el estado actual del prototipo, no hay ninguna llamada a Gemini. En una demo con stakeholders o usuarios reales, este texto puede crear expectativas incorrectas sobre la madurez del producto.

---

## 6. Principios de Rediseño

### Principio 1: El contexto del video nunca debe perderse

El usuario subió un video. Toda la herramienta existe en función de ese video. Cualquier pantalla, modal o estado que haga desaparecer el contexto de ese video — su nombre, su duración, los clips identificados — es un fallo de diseño. El workspace debe ser persistente y el video debe ser el anchor de toda la sesión. Navegar a Biblioteca no debe borrar la sesión activa. Navegar a Resultados no debe vaciar los clips activos.

### Principio 2: Las pantallas de espera son el peor lugar para bloquear al usuario

El modelo de "pantalla de carga → auto-avance → nueva pantalla" funciona para flujos lineales de consumo (onboarding, checkout). No funciona para flujos de trabajo donde el usuario tiene agencia. Un creador de contenido que está esperando el análisis de su podcast de 45 minutos debería poder leer la transcripción mientras espera, no contemplar una barra de progreso. Los estados de carga deben ser inline, no bloqueantes.

### Principio 3: La curación es el producto, no la generación

La diferencia entre esta herramienta y un script de Python que corta el video por timestamps es la capa de inteligencia: el score, el hook, la justificación, la categoría. Si los clips vienen todos seleccionados por defecto y el usuario puede generar sin curar, esa capa de inteligencia es ornamental. El diseño debe hacer la curación el paso central e inevitable, no una opción que el usuario puede ignorar. Que la acción de generar requiera al menos una decisión activa de selección es un mínimo.

### Principio 4: Las promesas rotas son peores que las funciones ausentes

Un botón que dice "Descargar ZIP" y ejecuta un `alert()` no es un placeholder — es una promesa rota. Un video que se llama "Vista Previa" y muestra Big Buck Bunny no es un mock honesto — es una expectativa falsa. En un prototipo es preferible ocultar una función que no existe (`v1.0 — próximamente`) que mostrarla con comportamiento ficticio. Cada promesa rota destruye más confianza que cualquier feature ausente.

### Principio 5: La arquitectura de estados debe reflejar el modelo mental del usuario, no la conveniencia técnica

El usuario piensa en términos de: "tengo un video", "tengo clips identificados", "quiero descargar esos clips". No piensa en `Screen.INITIAL_PROCESSING`, `Screen.RE_ANALYSIS` ni `Screen.GENERATING`. Cada estado del enum que no corresponde a un lugar distinto en el modelo mental del usuario es un estado que probablemente debería ser un subestado o un overlay, no una pantalla completa. El enum actual tiene 7 valores; el modelo mental del usuario probablemente tiene 3.

---

*Auditoría elaborada sobre análisis completo del código fuente. Todas las observaciones están fundamentadas en comportamiento concreto identificado en los archivos App.tsx, types.ts, y los componentes de pantalla y UI.*
