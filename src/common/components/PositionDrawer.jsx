import { Fragment, useEffect, useState } from 'react';
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
  Link,
  Collapse,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTranslation } from './LocalizationProvider';
import PositionValue from './PositionValue';
import usePositionAttributes from '../attributes/usePositionAttributes';
import { useAdministrator } from '../util/permissions';
import { usePreference } from '../util/preferences';
import { formatAddress } from '../util/formatter';
import { useCatch } from '../../reactHelper';
import fetchOrThrow from '../util/fetchOrThrow';

// Detalle del dispositivo seleccionado, abierto lateralmente (como el panel de
// alarmas). Admin ve la columna "Parámetro" (clave cruda); todos ven Nombre y
// Valor, con el nombre cayendo a la clave para que ninguna fila quede sin nombre.
// La red y la dirección se expanden inline (colapsables), sin navegar.
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
  collapseToggle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  },
  collapseChevron: {
    fontSize: 20,
    transition: 'transform .15s ease',
  },
  collapseChevronOpen: {
    transform: 'rotate(180deg)',
  },
  collapseDetail: {
    padding: theme.spacing(1.5, 2),
    backgroundColor: theme.palette.action.hover,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  nestedCell: {
    padding: 0,
    borderBottom: 'none',
  },
}));

// Acepta un objeto de red o una cadena JSON.
const parseNetwork = (value) => {
  let net = value;
  if (typeof net === 'string') {
    try {
      net = JSON.parse(net);
    } catch {
      return null;
    }
  }
  return net && typeof net === 'object' ? net : null;
};

const PositionDrawer = ({ position, open, onClose }) => {
  const { classes, cx } = useStyles();
  const t = useTranslation();

  const positionAttributes = usePositionAttributes(t);
  const administrator = useAdministrator();

  const geocoderEnabled = useSelector((state) => state.session.server.geocoderEnabled);
  const coordinateFormat = usePreference('coordinateFormat');

  const [networkOpen, setNetworkOpen] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [address, setAddress] = useState();

  const deviceName = useSelector((state) =>
    position ? state.devices.items[position.deviceId]?.name : null,
  );

  const columns = administrator ? 3 : 2;

  const network = parseNetwork(position?.attributes?.network);
  const { cellTowers, wifiAccessPoints, ...networkRest } = network || {};

  useEffect(() => {
    setAddress(position?.address);
    setAddressOpen(false);
    setNetworkOpen(false);
  }, [position?.id, position?.address]);

  const loadAddress = useCatch(async () => {
    if (!position || address || !geocoderEnabled) {
      return;
    }
    const query = new URLSearchParams({
      latitude: position.latitude,
      longitude: position.longitude,
    });
    const response = await fetchOrThrow(`/api/server/geocode?${query.toString()}`);
    setAddress(await response.text());
  });

  const toggleAddress = () => {
    setAddressOpen((prev) => {
      if (!prev) {
        loadAddress();
      }
      return !prev;
    });
  };

  const addressText =
    address ||
    (position
      ? formatAddress(
          { latitude: position.latitude, longitude: position.longitude },
          coordinateFormat,
        )
      : '');

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

  const collapseToggle = (label, isOpen, onToggle) => (
    <Link
      component="button"
      type="button"
      underline="none"
      className={classes.collapseToggle}
      onClick={onToggle}
    >
      {label}
      <ExpandMoreIcon
        className={cx(classes.collapseChevron, isOpen && classes.collapseChevronOpen)}
      />
    </Link>
  );

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
            <Fragment key={row.key}>
              <TableRow>
                {administrator && <TableCell>{row.key}</TableCell>}
                <TableCell>{positionAttributes[row.key]?.name || row.key}</TableCell>
                <TableCell>
                  {row.key === 'address' &&
                    collapseToggle(t('sharedShowAddress'), addressOpen, toggleAddress)}
                  {row.key === 'network' &&
                    collapseToggle(t('sharedInfoTitle'), networkOpen, () =>
                      setNetworkOpen((prev) => !prev),
                    )}
                  {row.key !== 'address' && row.key !== 'network' && (
                    <PositionValue
                      position={position}
                      property={row.property}
                      attribute={row.attribute}
                    />
                  )}
                </TableCell>
              </TableRow>
              {row.key === 'address' && (
                <TableRow>
                  <TableCell className={classes.nestedCell} colSpan={columns}>
                    <Collapse in={addressOpen} timeout="auto" unmountOnExit>
                      <div className={classes.collapseDetail}>
                        <Typography variant="body2">{addressText}</Typography>
                      </div>
                    </Collapse>
                  </TableCell>
                </TableRow>
              )}
              {row.key === 'network' && (
                <TableRow>
                  <TableCell className={classes.nestedCell} colSpan={columns}>
                    <Collapse in={networkOpen} timeout="auto" unmountOnExit>
                      {network ? (
                        <div className={classes.collapseDetail}>
                          {Object.keys(networkRest).length > 0 && (
                            <Table size="small">
                              <TableBody>
                                {Object.entries(networkRest).map(([key, value]) => (
                                  <TableRow key={key}>
                                    <TableCell>{key}</TableCell>
                                    <TableCell>
                                      {value !== null && typeof value === 'object'
                                        ? JSON.stringify(value)
                                        : String(value)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                          {cellTowers?.length > 0 && (
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>MCC</TableCell>
                                  <TableCell>MNC</TableCell>
                                  <TableCell>LAC</TableCell>
                                  <TableCell>CID</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {cellTowers.map((cell) => (
                                  <TableRow key={cell.cellId}>
                                    <TableCell>{cell.mobileCountryCode}</TableCell>
                                    <TableCell>{cell.mobileNetworkCode}</TableCell>
                                    <TableCell>{cell.locationAreaCode}</TableCell>
                                    <TableCell>{cell.cellId}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                          {wifiAccessPoints?.length > 0 && (
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>MAC</TableCell>
                                  <TableCell>RSSI</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {wifiAccessPoints.map((wifi) => (
                                  <TableRow key={wifi.macAddress}>
                                    <TableCell>{wifi.macAddress}</TableCell>
                                    <TableCell>{wifi.signalStrength}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </div>
                      ) : (
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          className={classes.collapseDetail}
                        >
                          {t('sharedNoData')}
                        </Typography>
                      )}
                    </Collapse>
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </Drawer>
  );
};

export default PositionDrawer;
