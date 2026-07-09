import { useDispatch, useSelector } from 'react-redux';
import { Divider, Typography, IconButton, Toolbar, List, ListItem, Paper } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useNavigate } from 'react-router-dom';
import MapView from '../map/core/MapView';
import MapCurrentLocation from '../map/MapCurrentLocation';
import { useTranslation } from '../common/components/LocalizationProvider';
import MapGeocoder from '../map/control/MapGeocoder';
import SelectField from '../common/components/SelectField';
import { devicesActions } from '../store';
import MapPositions from '../map/MapPositions';
import { useCatch } from '../reactHelper';
import MapScale from '../map/MapScale';
import BackIcon from '../common/components/BackIcon';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { deviceEquality } from '../common/util/deviceEquality';

const useStyles = makeStyles()((theme) => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  content: {
    flexGrow: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'row',
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column-reverse',
    },
  },
  drawer: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.background.paper,
    // Card flotante redondeado Ubimax sobre el mapa (como ModuleMenuLayout).
    [theme.breakpoints.up('sm')]: {
      position: 'fixed',
      zIndex: 3,
      left: 0,
      top: 0,
      margin: theme.spacing(1.5),
      width: theme.dimensions.drawerWidthDesktop,
      borderRadius: theme.spacing(2),
      overflow: 'hidden',
      boxShadow: theme.shadows[6],
    },
    [theme.breakpoints.down('sm')]: {
      height: theme.dimensions.drawerHeightPhone,
    },
  },
  mapContainer: {
    flexGrow: 1,
  },
  title: {
    flexGrow: 1,
  },
}));

const EmulatorPage = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useTranslation();

  const devices = useSelector(
    (state) => state.devices.items,
    deviceEquality(['id', 'name', 'uniqueId']),
  );
  const deviceId = useSelector((state) => state.devices.selectedId);
  const positions = useSelector((state) => state.session.positions);

  const handleClick = useCatch(async (latitude, longitude) => {
    if (deviceId) {
      if (window.location.protocol === 'https:') {
        const params = new URLSearchParams();
        params.append('id', devices[deviceId].uniqueId);
        params.append('lat', latitude);
        params.append('lon', longitude);
        await fetchOrThrow(window.location.origin, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });
      } else {
        const params = new URLSearchParams();
        params.append('id', devices[deviceId].uniqueId);
        params.append('lat', latitude);
        params.append('lon', longitude);
        await fetchOrThrow(`http://${window.location.hostname}:5055?${params.toString()}`, {
          method: 'POST',
          mode: 'no-cors',
        });
      }
    }
  });

  return (
    <div className={classes.root}>
      <div className={classes.content}>
        <Paper elevation={0} className={classes.drawer}>
          <Toolbar>
            <IconButton edge="start" sx={{ mr: 2 }} onClick={() => navigate(-1)}>
              <BackIcon />
            </IconButton>
            <Typography variant="h6" className={classes.title}>
              {t('sharedEmulator')}
            </Typography>
          </Toolbar>
          <Divider />
          <List>
            <ListItem>
              <SelectField
                label={t('reportDevice')}
                data={Object.values(devices).sort((a, b) => a.name.localeCompare(b.name))}
                value={deviceId}
                onChange={(e) => dispatch(devicesActions.selectId(e.target.value))}
                fullWidth
              />
            </ListItem>
          </List>
        </Paper>
        <div className={classes.mapContainer}>
          <MapView>
            <MapPositions
              positions={Object.values(positions)}
              onMapClick={handleClick}
              showStatus
            />
          </MapView>
          <MapScale />
          <MapCurrentLocation />
          <MapGeocoder />
        </div>
      </div>
    </div>
  );
};

export default EmulatorPage;
