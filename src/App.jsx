import { lazy, Suspense, useState, useCallback, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useMediaQuery, useTheme } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import BottomMenu from './common/components/BottomMenu';
import SocketController from './SocketController';
import CachingController from './CachingController';
import { useCatch, useAsyncTask } from './reactHelper';
import { sessionActions } from './store';
import UpdateController from './UpdateController';
import MotionController from './main/MotionController';
import TermsDialog from './common/components/TermsDialog';
import Loader from './common/components/Loader';
import fetchOrThrow from './common/util/fetchOrThrow';
import usePersistedState from './common/util/usePersistedState';
import useFilter from './main/useFilter';
import EventsDrawer from './main/EventsDrawer';

// Mapa persistente a nivel de layout: se monta una sola vez y los paneles de
// cada módulo flotan por encima, así cambiar de módulo no lo remonta (sin
// parpadeo). En desktop; en mobile cada ruta maneja su propio contenido.
const MainMap = lazy(() => import('./main/MainMap'));

const useStyles = makeStyles()((theme) => ({
  map: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  page: {
    flexGrow: 1,
    overflow: 'auto',
    [theme.breakpoints.up('md')]: {
      position: 'relative',
      zIndex: 1,
    },
  },
  // Solo en rutas shell: deja pasar los clics al mapa persistente detrás
  // (los paneles flotantes reactivan pointerEvents sobre sí mismos).
  pageClickThrough: {
    [theme.breakpoints.up('md')]: {
      pointerEvents: 'none',
    },
  },
  menu: {
    zIndex: 4,
    '@media print': {
      display: 'none',
    },
  },
  menuFloating: {
    position: 'fixed',
    left: theme.spacing(1.5),
    bottom: theme.spacing(1.5),
    width: theme.dimensions.drawerWidthDesktop,
    zIndex: 4,
    pointerEvents: 'none',
    '& > *': {
      pointerEvents: 'auto',
    },
    '@media print': {
      display: 'none',
    },
  },
}));

const App = () => {
  const { classes, cx } = useStyles();
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const isMap = location.pathname === '/';
  // Rutas "shell": muestran el mapa persistente detrás de un panel flotante.
  // El resto de sub-páginas (replay, reportes de detalle, geo-zonas, etc.)
  // traen su propio mapa, así que aquí NO se monta el persistente para no
  // duplicar la instancia singleton de MapView.
  const mapShellPaths = ['/', '/reports', '/settings', '/account'];
  const showPersistentMap = desktop && mapShellPaths.includes(location.pathname);
  // En estas rutas el panel doca su propia barra inferior en desktop (los
  // índices vía ModuleMenuLayout; el Recorrido del día en su propio panel), así
  // que App no renderiza la barra flotante para no duplicarla.
  const navDockPaths = ['/reports', '/settings', '/account', '/reports/timeline'];
  const panelDocksNav = desktop && navDockPaths.includes(location.pathname);

  const newServer = useSelector((state) => state.session.server.newServer);
  const termsUrl = useSelector((state) => state.session.server.attributes.termsUrl);
  const user = useSelector((state) => state.session.user);

  const positions = useSelector((state) => state.session.positions);
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);

  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = usePersistedState('deviceFilter', {
    statuses: [],
    groups: [],
    geofences: [],
  });
  const [filterSort, setFilterSort] = usePersistedState('filterSort', '');
  const [filterMap, setFilterMap] = usePersistedState('filterMap', false);

  const [filteredDevices, setFilteredDevices] = useState([]);
  const [filteredPositions, setFilteredPositions] = useState([]);

  const [eventsOpen, setEventsOpen] = useState(false);
  const onEventsClick = useCallback(() => setEventsOpen(true), []);

  const selectedPosition = filteredPositions.find(
    (position) => selectedDeviceId && position.deviceId === selectedDeviceId,
  );

  useFilter(
    keyword,
    filter,
    filterSort,
    filterMap,
    positions,
    setFilteredDevices,
    setFilteredPositions,
  );

  const outletContext = useMemo(
    () => ({
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
    }),
    [
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
    ],
  );

  const acceptTerms = useCatch(async () => {
    const response = await fetchOrThrow(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...user, attributes: { ...user.attributes, termsAccepted: true } }),
    });
    dispatch(sessionActions.updateUser(await response.json()));
  });

  useAsyncTask(
    async ({ signal }) => {
      if (!user) {
        const response = await fetch('/api/session', { signal });
        if (response.ok) {
          dispatch(sessionActions.updateUser(await response.json()));
        } else {
          window.sessionStorage.setItem(
            'postLogin',
            window.location.pathname + window.location.search,
          );
          navigate(newServer ? '/register' : '/login', { replace: true });
        }
      }
      return null;
    },
    [user, dispatch, navigate, newServer],
  );

  if (user == null) {
    return <Loader />;
  }
  if (termsUrl && !user.attributes.termsAccepted) {
    return <TermsDialog open onCancel={() => navigate('/login')} onAccept={() => acceptTerms()} />;
  }
  return (
    <>
      <SocketController />
      <CachingController />
      <UpdateController />
      <MotionController />
      {showPersistentMap && (
        <div className={classes.map}>
          <Suspense fallback={null}>
            <MainMap
              filteredPositions={filteredPositions}
              selectedPosition={selectedPosition}
              onEventsClick={onEventsClick}
            />
          </Suspense>
        </div>
      )}
      <div className={cx(classes.page, { [classes.pageClickThrough]: showPersistentMap })}>
        <Outlet context={outletContext} />
      </div>
      <EventsDrawer open={eventsOpen} onClose={() => setEventsOpen(false)} />
      {desktop ? (
        !isMap &&
        !panelDocksNav && (
          <div className={classes.menuFloating}>
            <BottomMenu floating />
          </div>
        )
      ) : (
        <div className={classes.menu}>
          <BottomMenu />
        </div>
      )}
    </>
  );
};

export default App;
