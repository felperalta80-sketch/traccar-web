import { AppBar, IconButton, Toolbar, Typography } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from './LocalizationProvider';
import BackIcon from './BackIcon';

const useStyles = makeStyles()((theme) => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  toolbar: {
    zIndex: 1,
    '@media print': {
      display: 'none',
    },
  },
  content: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    [theme.breakpoints.up('md')]: {
      // Espacio para que el bottom flotante (abajo-izquierda) no tape contenido.
      paddingBottom: theme.spacing(10),
    },
  },
}));

const PageTitle = ({ breadcrumbs }) => {
  const t = useTranslation();
  return (
    <Typography variant="h6" color="textPrimary" noWrap>
      {t(breadcrumbs[breadcrumbs.length - 1])}
    </Typography>
  );
};

// Flujo: bottom -> página de opciones (índice) -> página de la opción.
// El botón "atrás" vuelve al índice de la sección (o al mapa desde el índice).
const PageLayout = ({ breadcrumbs, children }) => {
  const { classes } = useStyles();
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    const path = location.pathname;
    if (path.startsWith('/settings/')) {
      navigate('/settings');
    } else if (path.startsWith('/reports/')) {
      navigate('/reports');
    } else {
      navigate('/');
    }
  };

  return (
    <div className={classes.root}>
      <AppBar className={classes.toolbar} position="static" color="inherit" elevation={1}>
        <Toolbar>
          <IconButton color="inherit" edge="start" sx={{ mr: 2 }} onClick={handleBack}>
            <BackIcon />
          </IconButton>
          <PageTitle breadcrumbs={breadcrumbs} />
        </Toolbar>
      </AppBar>
      <div className={classes.content}>{children}</div>
    </div>
  );
};

export default PageLayout;
