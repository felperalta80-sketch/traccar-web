import { useMemo } from 'react';
import { createTheme } from '@mui/material/styles';
import palette from './palette';
import dimensions from './dimensions';
import components from './components';

// Estilo Ubimax — 2 fuentes en todo el proyecto:
//   head = Lato (títulos/encabezados), body = Noto Sans (cuerpo/UI/datos)
const fonts = {
  head: '"Lato", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
  body: '"Noto Sans", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
};

export default (server, darkMode, direction) =>
  useMemo(
    () =>
      createTheme({
        // Jerarquía de tamaños estandarizada para toda la app.
        typography: {
          fontFamily: fonts.body,
          h1: { fontFamily: fonts.head, fontWeight: 700, fontSize: '2rem' },
          h2: { fontFamily: fonts.head, fontWeight: 700, fontSize: '1.5rem' },
          h3: { fontFamily: fonts.head, fontWeight: 700, fontSize: '1.25rem' },
          h4: { fontFamily: fonts.head, fontWeight: 700, fontSize: '1.125rem' },
          h5: { fontFamily: fonts.head, fontWeight: 700, fontSize: '1rem' },
          h6: { fontFamily: fonts.head, fontWeight: 700, fontSize: '0.9375rem' },
          subtitle1: { fontFamily: fonts.head, fontWeight: 600, fontSize: '0.875rem' },
          subtitle2: { fontFamily: fonts.head, fontWeight: 600, fontSize: '0.8125rem' },
          body1: { fontSize: '0.875rem' },
          body2: { fontSize: '0.8125rem' },
          button: { fontWeight: 600, fontSize: '0.8125rem', textTransform: 'none' },
          caption: { fontSize: '0.6875rem' },
          label: {
            fontFamily: fonts.head,
            fontWeight: 700,
            fontSize: '0.625rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          },
          overline: {
            fontFamily: fonts.head,
            fontWeight: 700,
            fontSize: '0.6875rem',
            letterSpacing: '0.08em',
          },
        },
        shape: {
          borderRadius: 8,
        },
        palette: palette(server, darkMode),
        direction,
        dimensions,
        fonts,
        components,
      }),
    [server, darkMode, direction],
  );
