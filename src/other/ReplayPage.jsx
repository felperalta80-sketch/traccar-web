import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  IconButton,
  Paper,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';
import TuneIcon from '@mui/icons-material/Tune';
import DownloadIcon from '@mui/icons-material/Download';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FastForwardIcon from '@mui/icons-material/FastForward';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MapView from '../map/core/MapView';
import MapRoutePath from '../map/MapRoutePath';
import MapRoutePoints from '../map/MapRoutePoints';
import MapPositions from '../map/MapPositions';
import { formatTime, formatSpeed } from '../common/util/formatter';
import { useAttributePreference } from '../common/util/preferences';
import ReportFilter from '../reports/components/ReportFilter';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useCatchCallback } from '../reactHelper';
import MapCamera from '../map/MapCamera';
import MapGeofence from '../map/MapGeofence';
import StatusCard from '../common/components/StatusCard';
import MapScale from '../map/MapScale';
import BackIcon from '../common/components/BackIcon';
import fetchOrThrow from '../common/util/fetchOrThrow';
import MapOverlay from '../map/overlay/MapOverlay';

const useStyles = makeStyles()((theme) => ({
  root: {
    height: '100%',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    zIndex: 3,
    left: 0,
    top: 0,
    margin: theme.spacing(1.5),
    width: theme.dimensions.drawerWidthDesktop,
    // Card Ubimax: superficie única redondeada con sombra (como ModuleMenuLayout).
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.spacing(2),
    overflow: 'hidden',
    boxShadow: theme.shadows[6],
    [theme.breakpoints.down('md')]: {
      width: '100%',
      margin: 0,
      borderRadius: 0,
      boxShadow: 'none',
    },
  },
  header: {
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  title: {
    flexGrow: 1,
  },
  slider: {
    width: '100%',
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  speed: {
    marginTop: theme.spacing(1),
    '& .MuiToggleButton-root': {
      flex: 1,
      padding: theme.spacing(0.25, 1),
      textTransform: 'none',
    },
  },
  formControlLabel: {
    height: '100%',
    width: '100%',
    paddingRight: theme.spacing(1),
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(2),
  },
  // --- Mobile: mapa a pantalla completa + barra inferior compacta ---
  mTop: {
    position: 'fixed',
    top: theme.spacing(1.5),
    left: theme.spacing(1.5),
    right: theme.spacing(1.5),
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    zIndex: 4,
  },
  mBtn: {
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[3],
    '&:hover': {
      backgroundColor: theme.palette.background.paper,
    },
  },
  mTitle: {
    flex: 1,
    minWidth: 0,
    backgroundColor: theme.palette.background.paper,
    borderRadius: 999,
    padding: theme.spacing(1, 1.75),
    boxShadow: theme.shadows[3],
    fontFamily: theme.fonts.head,
    fontWeight: 700,
    fontSize: '0.8125rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  mBottom: {
    position: 'fixed',
    left: theme.spacing(1.5),
    right: theme.spacing(1.5),
    // Por encima de la barra de módulos que App muestra en mobile.
    bottom: `calc(${theme.dimensions.bottomBarHeight}px + ${theme.spacing(1.5)})`,
    zIndex: 4,
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 16,
    boxShadow: theme.shadows[6],
    padding: theme.spacing(1.25, 1.5),
  },
  mInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(1.5),
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    fontVariantNumeric: 'tabular-nums',
    marginBottom: theme.spacing(0.5),
  },
  mInfoSpeed: {
    fontFamily: theme.fonts.head,
    fontWeight: 800,
    color: theme.palette.text.primary,
  },
  mBar: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.25),
  },
  mBarSlider: {
    flex: 1,
    margin: theme.spacing(0, 1),
  },
  mIdx: {
    fontSize: '0.6875rem',
    color: theme.palette.text.disabled,
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums',
  },
  mSheet: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.spacing(2, 2, 0, 0),
    boxShadow: theme.shadows[8],
    padding: theme.spacing(2),
    maxHeight: '85%',
    overflowY: 'auto',
  },
}));

// Rumbo (grados) del punto a hacia b, para orientar el pin en el sentido de
// marcha durante la interpolación.
const bearing = (a, b) => {
  const toRad = (d) => (d * Math.PI) / 180;
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};

const ReplayPage = () => {
  const t = useTranslation();
  const { classes } = useStyles();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const speedUnit = useAttributePreference('speedUnit');
  const navigate = useNavigate();
  const frameRef = useRef(0);
  const stateRef = useRef({ index: 0, progress: 0 });

  const [searchParams] = useSearchParams();

  const defaultDeviceId = useSelector((state) => state.devices.selectedId);

  const [positions, setPositions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selectedDeviceId, setSelectedDeviceId] = useState(defaultDeviceId);
  const [showCard, setShowCard] = useState(false);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  // progress = fracción (0..1) del tramo entre positions[index] y el siguiente,
  // para animar el marcador de forma fluida en vez de saltar de punto a punto.
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  stateRef.current = { index, progress };

  const loaded = Boolean(from && to && !loading && positions.length);

  const deviceName = useSelector((state) => {
    if (selectedDeviceId) {
      const device = state.devices.items[selectedDeviceId];
      if (device) {
        return device.name;
      }
    }
    return null;
  });

  useEffect(() => {
    if (!from && !to) {
      setPositions([]);
    }
  }, [from, to, setPositions]);

  // Reproducción fluida: un bucle de animación avanza un "frame" fraccional a
  // 500/speed ms por punto; de él se derivan el índice entero (slider/tiempo) y
  // el progreso del tramo (interpolación del marcador).
  useEffect(() => {
    if (!playing || positions.length < 2) {
      return undefined;
    }
    const maxFrame = positions.length - 1;
    frameRef.current = stateRef.current.index + stateRef.current.progress;
    let raf;
    let last = null;
    const tick = (now) => {
      if (last === null) {
        last = now;
      }
      frameRef.current += (now - last) / (500 / speed);
      last = now;
      if (frameRef.current >= maxFrame) {
        setIndex(maxFrame);
        setProgress(0);
        setPlaying(false);
        return;
      }
      const whole = Math.floor(frameRef.current);
      setIndex(whole);
      setProgress(frameRef.current - whole);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, positions]);

  const onPointClick = useCallback(
    (_, index) => {
      setIndex(index);
      setProgress(0);
    },
    [setIndex],
  );

  const onMarkerClick = useCallback(
    (positionId) => {
      setShowCard(!!positionId);
    },
    [setShowCard],
  );

  // Posición interpolada del marcador: mezcla positions[index] con el siguiente
  // punto según progress, y orienta el pin por el rumbo del tramo.
  const currentPosition = useMemo(() => {
    const a = positions[index];
    if (!a) {
      return null;
    }
    const b = positions[index + 1];
    if (!b || progress <= 0) {
      return a;
    }
    const moved = a.latitude !== b.latitude || a.longitude !== b.longitude;
    return {
      ...a,
      latitude: a.latitude + (b.latitude - a.latitude) * progress,
      longitude: a.longitude + (b.longitude - a.longitude) * progress,
      course: moved ? bearing(a, b) : a.course,
    };
  }, [positions, index, progress]);

  const onShow = useCatchCallback(
    async ({ deviceIds, from, to }) => {
      const deviceId = deviceIds.find(() => true);
      setLoading(true);
      setSelectedDeviceId(deviceId);
      const query = new URLSearchParams({ deviceId, from, to });
      try {
        const response = await fetchOrThrow(`/api/positions?${query.toString()}`);
        setIndex(0);
        const positions = await response.json();
        setPositions(positions);
        if (!positions.length) {
          throw Error(t('sharedNoData'));
        }
        setFilterOpen(false);
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  const handleDownload = () => {
    const query = new URLSearchParams({ deviceId: selectedDeviceId, from, to });
    window.location.assign(`/api/positions/kml?${query.toString()}`);
  };

  return (
    <div className={classes.root}>
      <MapView>
        <MapOverlay />
        <MapGeofence />
        <MapRoutePath positions={positions} />
        <MapRoutePoints positions={positions} onClick={onPointClick} showSpeedControl />
        {currentPosition && (
          <MapPositions
            positions={[currentPosition]}
            onMarkerClick={onMarkerClick}
            titleField="fixTime"
            markerImage="pin"
            showLabels={!playing}
          />
        )}
      </MapView>
      <MapScale position="bottom-right" />
      <MapCamera positions={positions} />
      {desktop ? (
        <div className={classes.sidebar}>
          <Paper elevation={0} className={classes.header}>
            <Toolbar>
              <IconButton edge="start" sx={{ mr: 2 }} onClick={() => navigate(-1)}>
                <BackIcon />
              </IconButton>
              <Typography variant="h6" className={classes.title}>
                {t('reportReplay')}
              </Typography>
              {loaded && (
                <>
                  <IconButton onClick={handleDownload}>
                    <DownloadIcon />
                  </IconButton>
                  <IconButton edge="end" onClick={() => setFilterOpen((open) => !open)}>
                    <TuneIcon />
                  </IconButton>
                </>
              )}
            </Toolbar>
          </Paper>
          <Paper elevation={0} className={classes.content}>
            {loaded && !filterOpen && (
              <>
                <Typography variant="subtitle1" align="center">
                  {deviceName}
                </Typography>
                <Slider
                  className={classes.slider}
                  max={positions.length - 1}
                  step={null}
                  marks={positions.map((_, index) => ({ value: index }))}
                  value={index}
                  onChange={(_, index) => {
                    setIndex(index);
                    setProgress(0);
                  }}
                />
                <div className={classes.controls}>
                  <Typography variant="caption">{`${index + 1}/${positions.length}`}</Typography>
                  <IconButton
                    onClick={() => {
                      setIndex((index) => index - 1);
                      setProgress(0);
                    }}
                    disabled={playing || index <= 0}
                  >
                    <FastRewindIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => setPlaying(!playing)}
                    disabled={index >= positions.length - 1}
                  >
                    {playing ? <PauseIcon /> : <PlayArrowIcon />}
                  </IconButton>
                  <IconButton
                    onClick={() => {
                      setIndex((index) => index + 1);
                      setProgress(0);
                    }}
                    disabled={playing || index >= positions.length - 1}
                  >
                    <FastForwardIcon />
                  </IconButton>
                  <Typography variant="caption">
                    {formatTime(positions[index].fixTime, 'seconds')}
                  </Typography>
                </div>
                <ToggleButtonGroup
                  exclusive
                  fullWidth
                  size="small"
                  value={speed}
                  onChange={(_, value) => value && setSpeed(value)}
                  className={classes.speed}
                >
                  {[0.5, 1, 2, 4].map((value) => (
                    <ToggleButton key={value} value={value}>
                      {`${value}x`}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </>
            )}
            <div style={{ display: loaded && !filterOpen ? 'none' : 'block' }}>
              <ReportFilter onShow={onShow} deviceType="single" loading={loading} />
            </div>
          </Paper>
        </div>
      ) : (
        <>
          <div className={classes.mTop}>
            <IconButton className={classes.mBtn} onClick={() => navigate(-1)}>
              <BackIcon />
            </IconButton>
            <div className={classes.mTitle}>{deviceName || t('reportReplay')}</div>
            {loaded && (
              <>
                <IconButton className={classes.mBtn} onClick={handleDownload}>
                  <DownloadIcon />
                </IconButton>
                <IconButton className={classes.mBtn} onClick={() => setFilterOpen((open) => !open)}>
                  <TuneIcon />
                </IconButton>
              </>
            )}
          </div>
          {loaded && !filterOpen && (
            <div className={classes.mBottom}>
              <div className={classes.mInfo}>
                <span className={classes.mInfoSpeed}>
                  {formatSpeed(positions[index].speed, speedUnit, t)}
                </span>
                <span>{formatTime(positions[index].fixTime, 'seconds')}</span>
              </div>
              <div className={classes.mBar}>
                <IconButton
                  size="small"
                  onClick={() => {
                    setIndex((index) => index - 1);
                    setProgress(0);
                  }}
                  disabled={playing || index <= 0}
                >
                  <FastRewindIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => setPlaying(!playing)}
                  disabled={index >= positions.length - 1}
                >
                  {playing ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => {
                    setIndex((index) => index + 1);
                    setProgress(0);
                  }}
                  disabled={playing || index >= positions.length - 1}
                >
                  <FastForwardIcon />
                </IconButton>
                <Slider
                  className={classes.mBarSlider}
                  size="small"
                  max={positions.length - 1}
                  step={null}
                  marks={positions.map((_, index) => ({ value: index }))}
                  value={index}
                  onChange={(_, index) => {
                    setIndex(index);
                    setProgress(0);
                  }}
                />
                <span className={classes.mIdx}>{`${index + 1}/${positions.length}`}</span>
              </div>
              <ToggleButtonGroup
                exclusive
                fullWidth
                size="small"
                value={speed}
                onChange={(_, value) => value && setSpeed(value)}
                className={classes.speed}
              >
                {[0.5, 1, 2, 4].map((value) => (
                  <ToggleButton key={value} value={value}>
                    {`${value}x`}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </div>
          )}
          {(!loaded || filterOpen) && (
            <div className={classes.mSheet}>
              <ReportFilter onShow={onShow} deviceType="single" loading={loading} />
            </div>
          )}
        </>
      )}
      {showCard && index < positions.length && (
        <StatusCard
          deviceId={selectedDeviceId}
          position={positions[index]}
          onClose={() => setShowCard(false)}
          disableActions
        />
      )}
    </div>
  );
};

export default ReplayPage;
