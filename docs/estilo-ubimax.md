---
name: estilo-ubimax
description: Sistema de diseño UbimaxGPS (redesign-v2) — línea visual del panel + tokens reales (color/tipografía/radios/sombras/espaciado/íconos/breakpoints) con valor actual vs canónico
metadata:
  type: reference
  node_type: memory
  originSessionId: 8a69eefd-1fad-4ad5-aedf-65f7ca15724a
---

**Estilo Ubimax**: la línea visual del **panel lateral de dispositivos** (desktop, sobre el mapa) en la rama `redesign-v2`, adoptada como el estilo de marca del producto (elegida entre 5 mockups, originalmente "Operativa"). Implementada y commiteada (`0eaa6c83`). Este documento tiene dos partes: (A) la **línea visual** del panel; (B) el **sistema de diseño real** extraído del código, con "valor actual" (espejo, inconsistencias incluidas) y "valor canónico" (oficial). Las inconsistencias detalladas van en el reporte aparte, no acá.

---

## A. LÍNEA VISUAL (panel lateral, de arriba a abajo)

- **Card unificado**: cabecera + lista + navegación inferior forman un solo card redondeado con sombra. El redondeo/sombra se aplica en `.sidebar` (clip `overflow:hidden`) SOLO cuando la lista está abierta (`sidebarCard`); al colapsar, se quita la sombra y la cabecera flota con su propia `elevation`.
- **Cabecera** (`MainToolbar.jsx`): buscador estilizado (relleno tenue redondeado, lupa al inicio, filtro Tune al final) + **pestañas de estado tipo píldora** (Todos / En línea / Fuera de línea / Desconocido) con contador tenue, a todo el ancho (`justify-content: space-between`), la activa rellena en **tinta `#1C2536`**. Sincronizadas con `filter.statuses`.
- **Lista** (`DeviceList.jsx`): **agrupada por grupo** con encabezados colapsables (chevron + nombre + badge). "Sin grupo" al final; colapso persistido (`deviceGroupsCollapsed`). Virtualizada con `react-window` (alturas mixtas).
- **Filas** (`DeviceRow.jsx`): **franja de estado a la izquierda** (color de conexión vía `--st`), ícono de categoría en círculo con relleno tenue (`mask-image` sobre SVG monocromo), nombre + meta, estado (punto+palabra) con indicadores alarma/ignición/batería.
- **Navegación inferior** (`BottomMenu.jsx`): íconos Material **outlined** (MapOutlined, AssessmentOutlined, SettingsOutlined, AccountCircleOutlined, Logout).

**Principio de estado**: color siempre desde `getStatusColor(item.status)` (online→verde, offline→rojo, unknown→gris), coherente con marcadores del mapa. Solo capa de presentación; reusar filtro/acciones existentes. **Gotcha MUI**: el contenedor interno de `Tabs` es `.MuiTabs-list` (NO `.MuiTabs-flexContainer`) en esta versión.

---

## B. SISTEMA DE DISEÑO — TOKENS REALES

Formato: **Valor actual real** (lo que hay hoy en el código) · **Valor canónico** (oficial, definido por el usuario). Todos los valores canónicos están decididos — no queda ninguno pendiente.

### B.1 Colores

Tokens del theme (`palette.js`): `primary` = `colorPrimary` del servidor ó indigo900/200 · `secondary` = server ó green800/200 · `neutral` = grey500 · `geometry` = `#3bb2d0` · `alwaysDark` = grey900 · `background.default` = grey50/grey900. Estado = vía `getStatusColor` (success/error/neutral). Todo esto es **consistente**.

| Elemento | Valor actual real | Valor canónico |
|---|---|---|
| **Tinta de marca** | Mismo color, sin token, en 2 formatos: `#1C2536` (hex, 4 usos) y `rgba(28,37,54,α)` (8 usos) — `#1C2536` == `rgb(28,37,54)` | **`#1C2536` en HEX**. Para opacidad, **variante tokenizada** (token/función de "tinta con alpha", ej. `alpha(ink, α)`), NO `rgba(...)` suelto. Migrar los 12 usos ↓ |
| **Off-white de fondo** | Tres distintos hardcodeados: `#F5F6F9`, `#E8EAEE`, `#F0F0F0` | **`#F0F0F0`**. `#F5F6F9` y `#E8EAEE` son desviaciones a migrar |
| Blanco de marcadores/controles | `#FFFFFF` (MapPositions.js:232 stroke, :249 text-color · mapUtil.js:238/244/284 stroke/fill canvas · MapView.jsx:35 fondo de controles) | **Canónico intencional**: blanco puro `#FFFFFF` es el valor correcto en estos contextos (bordes de marcador, texto sobre marcador oscuro, fondo de controles). **NO** migrar a off-white ni tokenizar |
| `#fff` de draw | `src/map/draw/theme.js:109/134/158` | **Incierto** — base de mapbox-gl-draw, fuera del rediseño UbimaxGPS |
| Verde del pulso animado | `rgba(46,125,50,…)` (= green800 de MUI) en `src/map/core/mapUtil.js:147` — color del anillo "ping" animado alrededor del marcador | **Token de estado MOVIMIENTO `#22D3A5` (`rgba(34,211,165)`)**. El verde MUI es desviación a migrar al verde de marca. La opacidad animada `(1-t)*0.55` se mantiene. **Nota:** el cambio es visible (el verde de marca es más brillante) — revisar en pantalla al migrar |

**12 usos de la tinta a migrar:**
- HEX `#1C2536` → `src/map/MapPositions.js:217`, `:229` · `src/map/core/mapUtil.js:287`, `:290`
- `rgba(28,37,54,α)` → `src/main/DeviceRow.jsx:55` (0.05 bg sel.), `:57` (0.22 borde sel.), `:62` (0.08) · `src/map/core/MapView.jsx:36` (0.06 borde), `:37` (0.22 y 0.24 sombra, ×2), `:45` (0.08 borderTop), `:48` (0.05 bg)

### B.2 Tipografía

Dos familias, bien definidas: **Lato** (`fonts.head`, títulos h1–h6/subtitles/overline) · **Noto Sans** (`fonts.body`, base). Escala del theme estandarizada: h1 2rem · h2 1.5 · h3 1.25 · h4 1.125 · h5 1 · h6 0.9375 · subtitle1 0.875 · subtitle2 0.8125 · body1 0.875 · body2 0.8125 · button 0.8125 · caption 0.6875 · overline 0.6875.

**Regla canónica:** usar **siempre** la escala del theme. **Prohibido `fontSize` en rem suelto** en componentes.

**Token nuevo `label`** (agregado a la escala) — para labels de metadatos en mayúsculas (ej. sección de `MenuItem`, `locationLabel` de `StatusCard`):
`fontFamily: fonts.head` · `fontSize: 0.625rem` (10px) · `fontWeight: 700` · `letterSpacing: 0.06em` · `textTransform: uppercase`.

| Elemento | Valor actual real | Valor canónico |
|---|---|---|
| Familias + escala del theme | Lato/Noto + escala anterior | Se mantiene. La escala **ahora incluye `label` (10px, Lato 700, uppercase)** como token de metadatos en mayúsculas |
| Tamaños en componentes del rediseño | **Fuera de la escala**, rem ad-hoc: `0.84375`, `0.65625`, `0.59375` (DeviceRow) · `0.72`, `0.66` (StatusCard/ReportCards) · `0.75`, `0.625` (varios) | Mapear cada ad-hoc a un token (sin rem suelto): `0.84375rem` → **body2** · `0.72rem`/`0.66rem`/`0.65625rem` → **caption** · `0.625rem` en labels mayúscula (MenuItem:60, StatusCard:208/251, ReportCards:88) → **label** (token nuevo). **Excepción:** `0.59375rem` de DeviceRow:116/:206 **no** es token de texto — es el estilo del **chip de estado** (peso 700, sin uppercase); se resuelve dentro del estilo de la píldora de estado, no de la escala tipográfica |

### B.3 Radios

**Escala canónica:** `8` base (menores) · `9` cards · `10` controles interactivos · `16` dialogs/sheets · `999` píldoras. `11`, `12` y `6` son desviaciones a migrar. **`8` y `9` coexisten con roles distintos** (8 = base heredado; 9 = card intencional) — no es inconsistencia.

| Categoría | Valor actual real | Valor canónico |
|---|---|---|
| **Base / elementos menores** | `8` (shape.borderRadius, Accordion, Tooltip, StatusCard:268, MainToolbar:68) | **`8`** (base) |
| **Card** | 3 valores para tarjetas equivalentes: **9** (DeviceRow:45, MenuItem:18), **11** (CollectionCards:22), **12** (MuiPaper/MuiCard, ReportCards:23) | **`9`**. `11` y `12` (Paper/Card en components.js, CollectionCards, ReportCards — son cards) son desviaciones a migrar a `9` |
| **Controles interactivos** | `10` (Input, Button, MainToolbar:45/118 buscador) | **`10`** (input/button/campo de búsqueda). Ya consistente en theme y MainToolbar |
| Dialog / bottom-sheet | `16` (MuiDialog, StatusCard:61 móvil, ReplayPage:139) | **`16`** (categoría propia) |
| Píldora | `999` (DeviceRow:121, DeviceList:61, ReportCards:110, StatusCard:132, ReplayPage:120) | **`999`** (categoría propia) |
| Huérfano | `6` (MainToolbar:88) | Desviación → migrar a **`8`** |

### B.4 Sombras

| Elemento | Valor actual real | Valor canónico |
|---|---|---|
| Elevaciones estándar | Tokenizadas `theme.shadows[3/6/8]` (ReplayPage, GeofencesPage, MainPage, ModuleMenuLayout, MainToolbar) | Se mantiene (tokenizado, correcto) |
| Sombras custom | **3 bases de color distintas, ninguna tokenizada**: `rgba(16,24,40,α)` (DeviceRow:49, ChartReportPage:73) · `rgba(28,37,54,α)` (MapView:37) · `rgba(0,0,0,α)` (StatusCard:69 móvil, MainPage:97 drop-shadow) | **Base `rgba(16,24,40,X)`**. `rgba(28,37,54)` y `rgba(0,0,0)` son desviaciones a migrar. Las opacidades (`X`) se mantienen según la elevación de cada caso |

### B.5 Espaciado (relevamiento exhaustivo)

Base `theme.spacing` = 8px. Uso general correcto; los **paddings compuestos asimétricos** son padding legítimo sobre la grilla (ver abajo), no desviaciones.

**Tokens canónicos de espaciado** (nombres oficiales; a crear en `theme.dimensions` durante la migración, no ahora):
- `cardMargin: 1.5` — margen exterior de cards en lista
- `cardPadding: 1.25` — padding interno de contenido de card
- `sheetPadding: 2` — padding de bottom sheets / drawers
- `gap: 1` — separación estándar entre elementos
- `gapTight: 0.5` — separación compacta
- `gapFine: 2px` — separación mínima en inline/tabular (**px crudo intencional, NO múltiplo de 8**)

**Dos convenciones de espaciado (regla canónica):**
- **En `sx` props** (`px`/`py`/`gap` dentro de `sx`): el número es multiplicador de `spacing` MUI. Correcto (ej. `BottomMenu` `gap:0.5` = 4px).
- **En `makeStyles`**: usar `theme.spacing()` para layout. Px crudo permitido **solo** para separaciones finas ≤3px en inline/tabular → formalizar como `gapFine`.

**Frecuencia de `spacing(n)` simple:** 1.5 (19×) · 1 (16×) · 2 (13×) · 0.75 (9×) · 0.5 (9×) · 3 (5×) · 1.25 (4×) · 0.25 (3×) · 4 (2×) · 1.75 (1×) · 0.875 (dentro de compuestos) · 46 (1×, `maxWidth` del form de login = 368px).

**Escala implícita observada (patrón):**
- **Margen de card flotante sobre mapa**: `spacing(1.5)` — consistente en MainPage:34, ReplayPage:50, GeofencesPage:46, ModuleMenuLayout:40.
- **Padding de panel/sheet grande**: `spacing(2)` (ReplayPage:96/182, MainToolbar:114) ó `spacing(1.5)` (ChartReportPage:42).
- **Padding de card de contenido/fila**: zona `spacing(1.25)` (ReportCards:17/24, StatusCard filas, CollectionCards `spacing(1,1.25)`, MenuItem `spacing(0.75,2)`).
- **Gaps de lista/meta**: `spacing(0.5)`–`spacing(1)` (gaps internos); `spacing(0.75)` para columnas de datos.
- **Login**: `spacing(3)` (padding), `spacing(4)` (margen del logo).
- **Bottom-sheet radios**: `spacing(2,2,0,0)` (superior redondeado).

**Paddings compuestos asimétricos (INTENCIONALES, respetan la grilla — no son desviaciones):**
`spacing(1,1.25,0,1.25)` (DeviceRow:69) · `spacing(0.25,1.25,1,1.25)` (DeviceRow:134) · `spacing(0.875,1.25,1,1.25)` (DeviceRow:191) · `spacing(1.25,1,1,1.75)` (StatusCard:82) · `spacing(1.25,1.75,1)` (StatusCard:201) · `spacing(0.75,1.75,1.25)` (StatusCard:233) · `spacing(1,1.25,1)` (MainToolbar:65) · `spacing(1,1.25,0)` (MainToolbar:41) · `spacing(1.5,2,0.5)` (MenuItem:58).
Único outlier: `spacing(0.25,0.875)` (DeviceRow:120, píldora) — el `0.875` se corrige a `1` vía la decisión de la píldora (abajo). No hay más que unificar.

**px hardcodeados que deberían ser spacing** (en makeStyles/tss, `gap: 2` = 2px real, no 16px):
- Padding de píldora inconsistente: `'1px 8px'` (DeviceList:60) vs `'2px 8px'` (ReportCards:109, StatusCard:131) — **mismo contexto, valor distinto**.
- `gap: 2` (DeviceRow:162, ReportCards:82) · `gap: 3` (StatusCard:172) · `gap: 4` (ChartReportPage:48).
- `padding: 3` (ChartReportPage:52) · `margin: '3px 0 0'` (ChartReportPage:104).
- `marginTop: 4` (StatusCard:119) · `marginBottom: 2` (StatusCard:213) · `marginTop: 1` (StatusCard:238, CollectionCards:56).
- (`padding: 0` / `margin: 0` son resets legítimos, no cuentan.)

| Elemento | Valor actual real | Valor canónico |
|---|---|---|
| Base | `theme.spacing` = 8px | Se mantiene |
| Escala nombrada | 1.5 card-margin · 2/1.5 sheet-pad · 1.25 card-content-pad · 0.5–1 gaps · 3 login | **Tokens canónicos**: `cardMargin:1.5` · `cardPadding:1.25` · `sheetPadding:2` · `gap:1` · `gapTight:0.5` · `gapFine:2px` (a crear en `theme.dimensions` en la migración) |
| Compuestos asimétricos | ~9 paddings hand-tuned | **Correctos/intencionales** (respetan la grilla). Único outlier: `spacing(0.25,0.875)` DeviceRow:120 → `0.875`→`1` vía decisión de píldora |
| Píldora | `1px 8px` (DeviceList:60) vs `2px 8px` (ReportCards:109, StatusCard:131) | **`theme.spacing(0.25, 1)` = `2px 8px`**. `1px` vertical (DeviceList) → `0.25`; `0.875` horizontal (DeviceRow:120) → `1` |
| px sueltos (gap/margin) | `gap:2` (DeviceRow:162), `gap:3` (StatusCard:172), etc. | **No son errores.** Dos convenciones (ver arriba): `sx` = multiplicador MUI; `makeStyles` = `theme.spacing()`, con px crudo ≤3px permitido solo en inline/tabular → `gap:2`/`gap:3` = **`gapFine`** |

### B.6 Íconos

| Elemento | Valor actual real | Valor canónico |
|---|---|---|
| Origen | UI = Material (outlined en nav); dominio = SVG Traccar monocromo con `mask-image` | Se mantiene (patrón deliberado) |
| Tamaños | Mezcla px sin escala: 14, 15, 17, 18, 20 (numéricos) + `fontSize="small"` + rem | **Escala de 3: `sm=16px` · `md=20px` · `lg=24px`**. Los valores actuales (14,15,17,18,20 y rem) redondean al más cercano |

### B.7 Breakpoints

| Elemento | Valor actual real | Valor canónico |
|---|---|---|
| Switch desktop/móvil | **Inconsistente**: `up('md')` (900px) dominante (35×, ej. DevicesPage) vs `down('sm')` (600px, 6×, ej. GeofencesPage) y `down('md')` (9×). La franja tablet (600–900) se comporta distinto según componente | **Línea única en `md` (900px)**: abajo = card, arriba = tabla. Los `down('sm')` y `down('md')` sueltos se unifican a la regla `md` |

---

**Why:** el usuario iteró mucho sobre estética y quiere una identidad densa y operativa consistente entre panel y mapa; bautizó la línea "estilo Ubimax". Esta auditoría fija los valores canónicos que él definió (tinta `#1C2536`, card radio 9, off-white `#F0F0F0`) y marca el resto como pendiente de su decisión.

**How to apply:** para cambios futuros respetar el canon (tinta con token de alpha, radio de card 9, off-white `#F0F0F0`, sombras/tipografía/breakpoints según se defina). Documentar valores reales, no inventar. Ver [[redesign-two-experiences]], [[estilo-ubimax-listas]] y el reporte de inconsistencias de la auditoría.
