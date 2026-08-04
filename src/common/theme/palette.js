import { grey, green, indigo } from '@mui/material/colors';

const validatedColor = (color) => (/^#([0-9A-Fa-f]{3}){1,2}$/.test(color) ? color : null);

// Tinta de marca Ubimax (chrome neutro: marcadores, selección, controles del mapa).
export const INK = '#1C2536';

export default (server) => ({
  mode: 'light',
  background: {
    default: grey[50],
  },
  primary: {
    main: validatedColor(server?.attributes?.colorPrimary) || indigo[900],
  },
  secondary: {
    main: validatedColor(server?.attributes?.colorSecondary) || green[800],
  },
  neutral: {
    main: grey[500],
  },
  geometry: {
    main: '#3bb2d0',
  },
  ink: {
    main: INK,
  },
  alwaysDark: {
    main: grey[900],
  },
});
