import { Toolbar, Typography } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useTranslation } from './LocalizationProvider';

// Índice de opciones de un módulo (Ajustes/Reportes/Cuenta) con la misma línea
// que la lista de dispositivos: panel flotante a la izquierda sobre el mapa
// (persistente, en App) en desktop, ancho completo en mobile.
const useStyles = makeStyles()((theme) => ({
  panel: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.background.paper,
    pointerEvents: 'auto',
    [theme.breakpoints.up('md')]: {
      position: 'fixed',
      left: theme.spacing(1.5),
      top: theme.spacing(1.5),
      width: theme.dimensions.drawerWidthDesktop,
      // deja lugar abajo para el bottom flotante
      height: `calc(100% - ${theme.spacing(1.5)} - 90px)`,
      borderRadius: theme.spacing(2),
      overflow: 'hidden',
      boxShadow: theme.shadows[6],
      zIndex: 3,
    },
    [theme.breakpoints.down('md')]: {
      height: '100%',
    },
  },
  header: {
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  content: {
    flex: 1,
    overflowY: 'auto',
  },
  footer: {
    padding: theme.spacing(1.5),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
}));

const ModuleMenuLayout = ({ title, footer, children }) => {
  const { classes } = useStyles();
  const t = useTranslation();

  return (
    <div className={classes.panel}>
      <Toolbar className={classes.header}>
        <Typography variant="h6" noWrap>
          {t(title)}
        </Typography>
      </Toolbar>
      <div className={classes.content}>{children}</div>
      {footer && <div className={classes.footer}>{footer}</div>}
    </div>
  );
};

export default ModuleMenuLayout;
