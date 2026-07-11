import { makeStyles } from 'tss-react/mui';
import { alpha } from '@mui/material/styles';
import { ListItemButton, ListItemText, ListSubheader } from '@mui/material';
import { Link } from 'react-router-dom';

// Estilo Ubimax para listas de módulos (Reportes, Ajustes, Cuenta): cada opción
// es icono en un tile neutral + título (Lato) + descripción corta, agrupadas por
// secciones. Coherente con las tarjetas de la lista de dispositivos.
const useStyles = makeStyles()((theme) => ({
  item: {
    gap: theme.spacing(1.5),
    alignItems: 'center',
    padding: theme.spacing(0.75, 2),
  },
  tile: {
    width: 34,
    height: 34,
    borderRadius: 9,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.palette.action.hover,
    border: `1px solid ${theme.palette.divider}`,
    color: theme.palette.text.secondary,
    '& svg': {
      fontSize: 20,
    },
  },
  tileSelected: {
    backgroundColor: alpha(theme.palette.primary.main, 0.12),
    borderColor: alpha(theme.palette.primary.main, 0.24),
    color: theme.palette.primary.main,
  },
  text: {
    margin: 0,
    minWidth: 0,
    '& .MuiListItemText-primary': {
      fontFamily: theme.fonts.head,
      fontWeight: 700,
      fontSize: '0.8125rem',
      lineHeight: 1.25,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    '& .MuiListItemText-secondary': {
      fontSize: '0.6875rem',
      lineHeight: 1.3,
      color: theme.palette.text.disabled,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  },
  section: {
    lineHeight: 'unset',
    padding: theme.spacing(1.5, 2, 0.5),
    fontFamily: theme.fonts.head,
    fontSize: '0.625rem',
    fontWeight: 800,
    letterSpacing: '.08em',
    textTransform: 'uppercase',
    color: theme.palette.text.disabled,
    backgroundColor: 'transparent',
  },
}));

const MenuItem = ({ title, subtitle, link, icon, selected }) => {
  const { classes, cx } = useStyles();
  return (
    <ListItemButton
      key={link}
      className={classes.item}
      component={Link}
      to={link}
      selected={selected}
    >
      <span className={cx(classes.tile, selected && classes.tileSelected)}>{icon}</span>
      <ListItemText className={classes.text} primary={title} secondary={subtitle} />
    </ListItemButton>
  );
};

export const MenuSection = ({ children }) => {
  const { classes } = useStyles();
  return (
    <ListSubheader className={classes.section} disableSticky>
      {children}
    </ListSubheader>
  );
};

export default MenuItem;
