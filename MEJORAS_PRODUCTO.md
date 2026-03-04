# 4 Mejoras de producto para equipos de video (El Confidencial)

## Contexto
El producto actual (AI Clip Master V2) permite subir un video/audio, analizar con IA para detectar clips virales, editarlos y descargar copy para publicar. Estas mejoras apuntan a cubrir necesidades reales de equipos de redaccion y social media en medios como El Confidencial.

---

## 1. Notas internas por clip (comentarios de equipo)

### Por que
En un flujo editorial real, el periodista que genera los clips necesita dejar indicaciones al editor ("este clip necesita subtitulos", "cortar los primeros 2 segundos de muletilla", "prioridad alta para la home"). Actualmente no hay forma de anotar clips.

### Que hacer
- Campo `notes?: string` en `Clip` (`types.ts`)
- En las cards de clip del detalle de proyecto: icono de nota (`StickyNote2` de MUI) que al hacer click despliega un `TextField` multiline inline
- Badge numerico si hay nota (para saber de un vistazo que clips tienen anotaciones)
- En el `ClipEditorDialog.tsx`: seccion de notas debajo del copy para publicar
- Las notas se incluiran en el export CSV/JSON (ver mejora 2)

### Archivos a tocar
| Archivo | Cambio |
|---|---|
| `types.ts` | Anadir `notes?: string` a `Clip` |
| `screens/LibraryScreen.tsx` | Icono nota + TextField expandible en las cards del detalle de proyecto, pasar handler de cambio |
| `components/ClipEditorDialog.tsx` | Seccion de notas en el panel derecho, debajo de los controles de tiempo |
| `App.tsx` | El handler `handleUpdateClip` ya cubre esto (actualiza clip completo) |

### Esfuerzo estimado: ~2h

---

## 2. Exportar proyecto completo (CSV / JSON)

### Por que
Un equipo de redaccion necesita compartir los clips seleccionados con editores, social media managers y produccion. Actualmente solo se puede copiar el copy clip por clip o descargar metadatos individuales en `.txt`. Un export masivo ahorra tiempo y permite integrarse con herramientas como hojas de calculo o CMS internos.

### Que hacer
- Boton **"Exportar proyecto"** en la vista de detalle de proyecto (`LibraryScreen.tsx`, junto a "Regenerar nuevos clips")
- Menu con dos opciones: CSV y JSON
- CSV con columnas: `#, Titulo, Inicio, Fin, Duracion, Score, Caption, Hashtags, CTA, Notas`
- JSON con toda la data estructurada del array de clips
- Funcion utilitaria `exportClipsToCSV(clips: Clip[]): string` en `utils.ts`

### Archivos a tocar
| Archivo | Cambio |
|---|---|
| `utils.ts` | Funciones `exportClipsToCSV()` y `exportClipsToJSON()` |
| `screens/LibraryScreen.tsx` | Boton de export con Menu (CSV/JSON) en la barra de acciones del detalle de proyecto |

### Esfuerzo estimado: ~2h

---

## 3. Etiquetas de seccion tematica por clip

### Por que
En medios como El Confidencial, los videos largos (entrevistas, debates, programas) cubren multiples temas. Saber que un clip trata sobre "economia", "politica exterior" o "tecnologia" permite al equipo de social media asignar rapidamente cada clip al canal o cuenta correcta.

### Que hacer
- Anadir campo `tags: string[]` al tipo `Clip` en `types.ts`
- Los tags se generarian por la IA (mock por ahora con 1-3 tags por clip en `mockData.ts`)
- Mostrar los tags como `<Chip>` debajo del titulo en las cards del detalle de proyecto
- Permitir editar/anadir tags manualmente (chip "+" → TextField inline)
- Filtro por tag en la vista de proyecto (chips clicables arriba de la lista, similar al filtro por categoria existente)

### Archivos a tocar
| Archivo | Cambio |
|---|---|
| `types.ts` | Anadir `tags?: string[]` a `Clip` |
| `mockData.ts` | Anadir tags a los clips mock (ej: "Inteligencia Artificial", "Productividad", "Futuro") |
| `screens/LibraryScreen.tsx` | Renderizar chips de tags en cards, chip "+" para anadir, barra de filtro por tags |
| `App.tsx` | El handler `handleUpdateClip` ya cubre la actualizacion |

### Esfuerzo estimado: ~3h

---

## 4. Vista de timeline visual del video completo

### Por que
Actualmente los clips se ven como una lista/grid. Un editor de video necesita entender rapidamente como se distribuyen los clips a lo largo del video original: hay huecos? se solapan? se concentran al inicio? Una barra de timeline proporciona esta vision de un vistazo.

### Que hacer
- Componente `ProjectTimeline` que muestra una barra horizontal representando la duracion total del video
- Cada clip se renderiza como un bloque coloreado posicionado proporcionalmente (`left` y `width` en %)
- Tooltip on hover con titulo, score y duracion del clip
- Click en bloque → abre el editor de ese clip
- Se muestra en la parte superior de la vista de detalle de proyecto, entre el header y los filtros

### Archivos a tocar
| Archivo | Cambio |
|---|---|
| `components/ProjectTimeline.tsx` | **Nuevo componente** - barra horizontal con bloques posicionados por clip |
| `screens/LibraryScreen.tsx` | Integrar `ProjectTimeline` en la vista de detalle, pasando clips y duracion total |

### Esfuerzo estimado: ~2.5h

---

## Orden de implementacion recomendado

| # | Mejora | Razon |
|---|---|---|
| 1 | Notas internas | Mas rapido, desbloquea flujo editorial basico |
| 2 | Exportar proyecto | Alto impacto inmediato, depende de notas para incluirlas |
| 3 | Etiquetas tematicas | Organizacion a escala |
| 4 | Timeline visual | Mejora visual significativa, independiente |

## Verificacion post-implementacion
1. `npx tsc --noEmit` limpio despues de cada feature
2. Visual en localhost:3000:
   - Notas se guardan y persisten en la sesion, visibles en cards y editor
   - Export descarga archivo CSV/JSON con datos correctos (incluyendo notas)
   - Tags visibles en clips, editables inline, filtrables por chip
   - Timeline muestra bloques posicionados correctamente con tooltips
