import { Toolbar, Typography, IconButton } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from './LocalizationProvider';
import BackIcon from './BackIcon';

// Índice de opciones de un módulo (Ajustes/Reportes) con la misma línea que la
// lista de dispositivos: panel flotante a la izquierda en desktop, ancho
// completo en mobile.
const useStyles = makeStyles()((theme) => ({
  root: {
    height: '100%',
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.background.paper,
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
}));

const ModuleMenuLayout = ({ title, children }) => {
  const { classes } = useStyles();
  const navigate = useNavigate();
  const t = useTranslation();

  return (
    <div className={classes.root}>
      <div className={classes.panel}>
        <Toolbar className={classes.header}>
          <IconButton color="inherit" edge="start" sx={{ mr: 2 }} onClick={() => navigate('/')}>
            <BackIcon />
          </IconButton>
          <Typography variant="h6" noWrap>
            {t(title)}
          </Typography>
        </Toolbar>
        <div className={classes.content}>{children}</div>
      </div>
    </div>
  );
};

export default ModuleMenuLayout;
