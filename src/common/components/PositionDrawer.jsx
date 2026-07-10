import { useSelector } from 'react-redux';
import {
  Drawer,
  IconButton,
  Toolbar,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from './LocalizationProvider';
import PositionValue from './PositionValue';
import usePositionAttributes from '../attributes/usePositionAttributes';
import { useAdministrator } from '../util/permissions';

// Detalle del dispositivo seleccionado, abierto lateralmente (como el panel de
// alarmas). Admin ve la columna "Parámetro" (clave cruda); todos ven Nombre y
// Valor, con el nombre cayendo a la clave para que ninguna fila quede sin nombre.
const useStyles = makeStyles()((theme) => ({
  drawer: {
    minWidth: theme.dimensions.eventsDrawerWidth,
  },
  toolbar: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(1),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  title: {
    flexGrow: 1,
  },
}));

const PositionDrawer = ({ position, open, onClose }) => {
  const { classes } = useStyles();
  const t = useTranslation();

  const positionAttributes = usePositionAttributes(t);
  const administrator = useAdministrator();

  const deviceName = useSelector((state) =>
    position ? state.devices.items[position.deviceId]?.name : null,
  );

  const rows = position
    ? [
        ...Object.getOwnPropertyNames(position)
          .filter((it) => it !== 'attributes')
          .map((key) => ({ key, property: key, attribute: null })),
        ...Object.getOwnPropertyNames(position.attributes).map((key) => ({
          key,
          property: null,
          attribute: key,
        })),
      ]
    : [];

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Toolbar className={classes.toolbar} disableGutters>
        <Typography variant="h6" className={classes.title} noWrap>
          {deviceName}
        </Typography>
        <IconButton size="small" color="inherit" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Toolbar>
      <Table className={classes.drawer} size="small">
        <TableHead>
          <TableRow>
            {administrator && <TableCell>{t('stateName')}</TableCell>}
            <TableCell>{t('sharedName')}</TableCell>
            <TableCell>{t('stateValue')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.key}>
              {administrator && <TableCell>{row.key}</TableCell>}
              <TableCell>{positionAttributes[row.key]?.name || row.key}</TableCell>
              <TableCell>
                <PositionValue
                  position={position}
                  property={row.property}
                  attribute={row.attribute}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Drawer>
  );
};

export default PositionDrawer;
