import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material/styles';
import { Dialog, IconButton, Typography, useMediaQuery } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import dayjs from 'dayjs';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useAttributePreference } from '../common/util/preferences';
import { formatDistance, formatDurationCompact, formatTime } from '../common/util/formatter';
import PageLayout from '../common/components/PageLayout';
import SelectField from '../common/components/SelectField';
import ReportsMenu from './components/ReportsMenu';
import DayNavigator from './components/DayNavigator';
import DayTimeline, { DayTimelineSummary, itemKey } from './components/DayTimeline';
import TimelineMap from './components/TimelineMap';
import useReportStyles from './common/useReportStyles';
import { useAsyncTask } from '../reactHelper';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { deviceEquality } from '../common/util/deviceEquality';

// Recorrido del día: viajes y paradas de un dispositivo en una sola línea de
// tiempo. Combina /api/reports/trips y /api/reports/stops en el mismo rango y
// los intercala por hora de inicio; no hay endpoint nuevo del lado del servidor.
//
// Desktop: mismo lenguaje que el panel de dispositivos (MainPage). Un card
// flotante a la izquierda (ancho drawerWidthDesktop, radio 16, sombra
// shadows[6], margen 12px) sobre el mapa a sangre completa, que muestra el
// tramo elegido. Mobile: el mapa se abre como diálogo a pantalla completa,
// porque no hay ancho para las dos cosas a la vez.
const useStyles = makeStyles()((theme) => ({
  stage: {
    position: 'relative',
    height: '100%',
    overflow: 'hidden',
  },
  mapArea: {
    position: 'absolute',
    inset: 0,
    backgroundColor: theme.palette.background.default,
  },
  mapPlaceholder: {
    position: 'absolute',
    inset: 0,
    // Centrado en la franja de mapa visible, a la derecha del panel flotante.
    paddingLeft: `calc(${theme.dimensions.drawerWidthDesktop} + ${theme.spacing(3)})`,
    display: 'grid',
    placeItems: 'center',
    textAlign: 'center',
    color: theme.palette.text.secondary,
    pointerEvents: 'none',
  },
  panel: {
    position: 'absolute',
    left: 0,
    top: 0,
    margin: theme.spacing(1.5),
    width: theme.dimensions.drawerWidthDesktop,
    height: `calc(100% - ${theme.spacing(3)})`,
    borderRadius: theme.spacing(2),
    overflow: 'hidden',
    boxShadow: theme.shadows[6],
    backgroundColor: theme.palette.background.paper,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    zIndex: 3,
  },
  panelScroll: {
    overflowY: 'auto',
    minHeight: 0,
    flex: 1,
  },
  dialogMap: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  dialogClose: {
    position: 'absolute',
    top: theme.spacing(1.5),
    right: theme.spacing(1.5),
    zIndex: 4,
    backgroundColor: theme.palette.background.paper,
    boxShadow: '0 1px 4px rgba(16, 24, 40, 0.24)',
    '&:hover': {
      backgroundColor: theme.palette.background.paper,
    },
    '& svg': {
      fontSize: 20,
      width: 20,
      height: 20,
    },
  },
  dialogTitle: {
    position: 'absolute',
    top: theme.spacing(1.5),
    left: theme.spacing(1.5),
    zIndex: 4,
    maxWidth: `calc(100% - ${theme.spacing(9)})`,
    backgroundColor: theme.palette.background.paper,
    borderRadius: 999,
    padding: theme.spacing(0.5, 1.5),
    boxShadow: '0 1px 4px rgba(16, 24, 40, 0.24)',
    fontFamily: theme.fonts.head,
    fontWeight: 700,
    fontSize: theme.typography.body2.fontSize,
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
}));

const TimelineReportPage = () => {
  const navigate = useNavigate();
  const { classes } = useReportStyles();
  const { classes: own } = useStyles();
  const t = useTranslation();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const [searchParams, setSearchParams] = useSearchParams();

  const devices = useSelector((state) => state.devices.items, deviceEquality(['id', 'name']));
  const deviceList = useMemo(
    () => Object.values(devices).sort((a, b) => a.name.localeCompare(b.name)),
    [devices],
  );

  const distanceUnit = useAttributePreference('distanceUnit');
  const speedUnit = useAttributePreference('speedUnit');

  const deviceId = Number(searchParams.get('deviceId')) || undefined;
  const dayParam = searchParams.get('day');
  const day = useMemo(() => {
    const parsed = dayParam ? dayjs(dayParam) : null;
    return parsed?.isValid() ? parsed : dayjs();
  }, [dayParam]);
  const dayKey = day.format('YYYY-MM-DD');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params, { replace: true });
  };

  useAsyncTask(
    async ({ signal }) => {
      setSelectedItem(null);
      if (!deviceId) {
        setItems([]);
        return;
      }
      // Se deriva de dayKey (string) y no de day (objeto nuevo en cada render)
      // para que la dependencia del efecto sea estable.
      const selected = dayjs(dayKey);
      const query = new URLSearchParams({
        deviceId,
        from: selected.startOf('day').toISOString(),
        to: selected.endOf('day').toISOString(),
      });
      const options = { headers: { Accept: 'application/json' }, signal };
      setLoading(true);
      try {
        const [trips, stops] = await Promise.all([
          fetchOrThrow(`/api/reports/trips?${query.toString()}`, options).then((it) => it.json()),
          fetchOrThrow(`/api/reports/stops?${query.toString()}`, options).then((it) => it.json()),
        ]);
        const merged = [
          ...trips.map((it) => ({ ...it, type: 'trip' })),
          ...stops.map((it) => ({ ...it, type: 'stop' })),
        ].sort((a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf());
        setItems(merged);
      } finally {
        setLoading(false);
      }
    },
    [deviceId, dayKey],
  );

  const summary = useMemo(() => {
    const trips = items.filter((it) => it.type === 'trip');
    const stops = items.filter((it) => it.type === 'stop');
    const sum = (list, key) => list.reduce((total, it) => total + (it[key] || 0), 0);
    return {
      trips: trips.length,
      distance: formatDistance(sum(trips, 'distance'), distanceUnit, t),
      moving: formatDurationCompact(sum(trips, 'duration'), t),
      stopped: formatDurationCompact(sum(stops, 'duration'), t),
    };
  }, [items, distanceUnit, t]);

  const onReplay = (item) => {
    navigate({
      pathname: '/replay',
      search: new URLSearchParams({
        from: item.startTime,
        to: item.endTime,
        deviceId: item.deviceId,
      }).toString(),
    });
  };

  const selectedLabel = selectedItem
    ? `${formatTime(selectedItem.startTime, 'clock')} — ${formatTime(selectedItem.endTime, 'clock')}`
    : '';

  const controls = (
    <div className={classes.header}>
      <div className={classes.filter}>
        <div className={classes.filterItem}>
          <SelectField
            label={t('reportDevice')}
            data={deviceList}
            value={deviceId}
            onChange={(e) => updateParam('deviceId', e.target.value)}
            fullWidth
          />
        </div>
        <div className={classes.filterItem}>
          <DayNavigator
            day={day}
            onChange={(next) => updateParam('day', next.format('YYYY-MM-DD'))}
          />
        </div>
      </div>
      {deviceId && !loading && <DayTimelineSummary summary={summary} />}
    </div>
  );

  const timeline = (
    <DayTimeline
      items={items}
      loading={loading}
      distanceUnit={distanceUnit}
      speedUnit={speedUnit}
      onSelect={setSelectedItem}
      onReplay={onReplay}
      selectedKey={selectedItem ? itemKey(selectedItem) : null}
    />
  );

  if (desktop) {
    return (
      <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportDayTimeline']}>
        <div className={own.stage}>
          <div className={own.mapArea}>{selectedItem && <TimelineMap item={selectedItem} />}</div>
          {!selectedItem && (
            <div className={own.mapPlaceholder}>
              <Typography variant="body2">{t('reportTimelineSelectHint')}</Typography>
            </div>
          )}
          <div className={own.panel}>
            {controls}
            <div className={own.panelScroll}>{timeline}</div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportDayTimeline']}>
      <div className={classes.container}>
        <div className={classes.containerMain}>
          {controls}
          {timeline}
        </div>
      </div>
      <Dialog fullScreen open={Boolean(selectedItem)} onClose={() => setSelectedItem(null)}>
        <div className={own.dialogMap}>
          {selectedItem && <TimelineMap item={selectedItem} />}
          <span className={own.dialogTitle}>{selectedLabel}</span>
          <IconButton
            className={own.dialogClose}
            aria-label={t('sharedHide')}
            onClick={() => setSelectedItem(null)}
          >
            <CloseIcon />
          </IconButton>
        </div>
      </Dialog>
    </PageLayout>
  );
};

export default TimelineReportPage;
