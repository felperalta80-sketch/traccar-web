---
name: estilo-ubimax-listas
description: Estilo Ubimax para listas de módulos (Reportes/Ajustes/Cuenta) — item con tile de icono + título + descripción + secciones
metadata: 
  node_type: memory
  type: project
  originSessionId: 8a69eefd-1fad-4ad5-aedf-65f7ca15724a
---

Estilo visual acordado para las listas de opciones de los módulos (menús de
Reportes, Ajustes y Cuenta). Es el "estilo 1" elegido entre 3 mockups y quedó
como convención reutilizable, coherente con las tarjetas de la lista de
dispositivos ([[estilo-ubimax]]).

**Componente base:** `src/common/components/MenuItem.jsx`
- Cada opción: **tile de icono** (34px, `borderRadius:9`, fondo `action.hover`,
  borde `divider`, icono `text.secondary` a 20px) + **título** en `theme.fonts.head`
  (Lato, 700, 0.8125rem) + **descripción** (subtítulo, 0.6875rem, `text.disabled`),
  ambos con truncado por elipsis.
- Prop nueva `subtitle` (va al `secondary` del `ListItemText`).
- Seleccionado: el tile se tiñe con `primary` (`tileSelected`).
- Export nombrado `MenuSection` = encabezado de sección (`ListSubheader`
  `disableSticky`, uppercase, Lato 800, 0.625rem, `letterSpacing .08em`,
  `text.disabled`). Reemplaza los `<Divider>` que separaban grupos.

**Aplicado en:**
- `src/reports/components/ReportsMenu.jsx` — secciones `reportTitle` ("Reportes")
  y `sharedTools` ("Herramientas"). Un solo `<List>`.
- `src/settings/components/SettingsMenu.jsx` — secciones `sharedGeneral` y
  `sharedAdministration` (esta última solo para manager). Un solo `<List>`.
- `src/settings/AccountPage.jsx` — item Configuración con descripción.

**Descripciones (i18n):** claves nuevas en `es.json` y `en.json` con sufijo
`Desc` (`reportCombinedDesc`, `settingsPreferencesDesc`, `accountConfigurationDesc`,
etc.). `t(key)` devuelve `undefined` si falta la clave → el subtítulo se omite con
gracia en idiomas sin traducir (por eso solo se cargaron es/en). Encabezados nuevos:
`sharedTools`, `sharedGeneral`, `sharedAdministration`.

Si se agregan opciones nuevas a estos menús, pasarles `subtitle={t('...Desc')}` y
crear la clave en es/en para mantener el estilo.
