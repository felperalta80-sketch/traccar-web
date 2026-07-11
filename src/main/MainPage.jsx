import { lazy, Suspense, useEffect } from 'react';
import { Paper } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useDispatch, useSelector } from 'react-redux';
import { useOutletContext } from 'react-router-dom';
import DeviceList from './DeviceList';
import BottomMenu from '../common/components/BottomMenu';
import StatusCard from '../common/components/StatusCard';
import { devicesActions } from '../store';
import MainToolbar from './MainToolbar';
import { useAttributePreference } from '../common/util/preferences';
import logoHorizontal from '../resources/images/logo-horizontal.svg';

// El mapa persistente vive en App (desktop). MainPage renderiza el panel de la
// lista sobre él, y en mobile su propio mapa.
const MainMap = lazy(() => import('./MainMap'));

const useStyles = makeStyles()((theme) => ({
  root: {
    height: '100%',
  },
  sidebar: {
    pointerEvents: 'none',
    display: 'flex',
    flexDirection: 'column',
    [theme.breakpoints.up('md')]: {
      position: 'fixed',
      left: 0,
      top: 0,
      height: `calc(100% - ${theme.spacing(3)})`,
      width: theme.dimensions.drawerWidthDesktop,
      margin: theme.spacing(1.5),
      zIndex: 3,
    },
    [theme.breakpoints.down('md')]: {
      height: '100%',
      width: '100%',
    },
  },
  sidebarCard: {
    [theme.breakpoints.up('md')]: {
      borderRadius: theme.spacing(2),
      overflow: 'hidden',
      boxShadow: theme.shadows[6],
    },
  },
  header: {
    pointerEvents: 'auto',
    zIndex: 6,
  },
  headerFloating: {
    [theme.breakpoints.up('md')]: {
      borderRadius: '10px',
      overflow: 'hidden',
      border: `1px solid ${theme.palette.divider}`,
    },
    // En mobile el header va pegado arriba a ancho completo (sin redondeo, que
    // contra el borde de la pantalla creaba una esquina rara); solo borde inferior.
    [theme.breakpoints.down('md')]: {
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
  },
  footer: {
    pointerEvents: 'auto',
    zIndex: 5,
  },
  middle: {
    flex: 1,
    display: 'grid',
    minHeight: 0,
  },
  contentMap: {
    pointerEvents: 'auto',
    gridArea: '1 / 1',
  },
  contentList: {
    pointerEvents: 'auto',
    gridArea: '1 / 1',
    zIndex: 4,
    display: 'flex',
    minHeight: 0,
  },
  // Logo discreto en la esquina superior izquierda, solo en la vista de mapa
  // (lista colapsada). Decorativo: no intercepta clics.
  mapLogo: {
    position: 'fixed',
    top: theme.spacing(2),
    left: theme.spacing(2),
    height: 26,
    width: 'auto',
    opacity: 0.85,
    zIndex: 3,
    pointerEvents: 'none',
    userSelect: 'none',
    filter: 'drop-shadow(0 1px 2px rgba(16, 24, 40, 0.18))',
    '@media print': {
      display: 'none',
    },
  },
}));

const MainPage = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const theme = useTheme();

  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const mapOnSelect = useAttributePreference('mapOnSelect', true);

  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const devicesOpen = useSelector((state) => state.devices.panelOpen);

  const {
    filteredDevices,
    filteredPositions,
    selectedPosition,
    keyword,
    setKeyword,
    filter,
    setFilter,
    filterSort,
    setFilterSort,
    filterMap,
    setFilterMap,
    onEventsClick,
  } = useOutletContext();

  useEffect(() => {
    if (!desktop && mapOnSelect && selectedDeviceId) {
      dispatch(devicesActions.setPanelOpen(false));
    }
  }, [dispatch, desktop, mapOnSelect, selectedDeviceId]);

  return (
    <div className={classes.root}>
      {!devicesOpen && <img src={logoHorizontal} alt="" className={classes.mapLogo} />}
      <div className={`${classes.sidebar} ${devicesOpen ? classes.sidebarCard : ''}`}>
        {devicesOpen && (
          <Paper square elevation={0} className={classes.header}>
            <MainToolbar
              filteredDevices={filteredDevices}
              keyword={keyword}
              setKeyword={setKeyword}
              filter={filter}
              setFilter={setFilter}
              filterSort={filterSort}
              setFilterSort={setFilterSort}
              filterMap={filterMap}
              setFilterMap={setFilterMap}
            />
          </Paper>
        )}
        <div className={classes.middle}>
          {!desktop && (
            <div className={classes.contentMap}>
              <Suspense fallback={null}>
                <MainMap
                  filteredPositions={filteredPositions}
                  selectedPosition={selectedPosition}
                  onEventsClick={onEventsClick}
                />
              </Suspense>
            </div>
          )}
          <Paper
            square
            elevation={0}
            className={classes.contentList}
            style={devicesOpen ? {} : { visibility: 'hidden' }}
          >
            <DeviceList devices={filteredDevices} />
          </Paper>
        </div>
        {desktop && (
          <div className={classes.footer}>
            <BottomMenu floating={!devicesOpen} />
          </div>
        )}
      </div>
      {selectedDeviceId && (
        <StatusCard
          deviceId={selectedDeviceId}
          position={selectedPosition}
          onClose={() => dispatch(devicesActions.selectId(null))}
          desktopPadding={theme.dimensions.drawerWidthDesktop}
        />
      )}
    </div>
  );
};

export default MainPage;
