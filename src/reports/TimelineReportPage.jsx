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
// Desktop: la línea de tiempo queda fija a la izquierda y el mapa ocupa el
// resto, mostrando el tramo elegido. Mobile: el mapa se abre como diálogo a
// pantalla completa, porque no hay ancho para las dos cosas a la vez.
const useStyles = makeStyles()((theme) => ({
  split: {
    height: '100%',
    display: 'flex',
    alignItems: 'stretch',
    minHeight: 0,
  },
  pane: {
    width: theme.dimensions.timelinePaneWidth,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    backgroundColor: theme.palette.background.paper,
    borderRight: `1px solid ${theme.palette.divider}`,
  },
  paneScroll: {
    overflowY: 'auto',
    minHeight: 0,
    flex: 1,
  },
  mapPane: {
    flex: 1,
    minWidth: 0,
    position: 'relative',
  },
  mapPlaceholder: {
    position: 'absolute',
    inset: 0,
    display: 'grid',
    placeItems: 'center',
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    backgroundColor: theme.palette.background.default,
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
        <div className={own.split}>
          <div className={own.pane}>
            {controls}
            <div className={own.paneScroll}>{timeline}</div>
          </div>
          <div className={own.mapPane}>
            {selectedItem ? (
              <TimelineMap item={selectedItem} />
            ) : (
              <div className={own.mapPlaceholder}>
                <Typography variant="body2">{t('reportTimelineSelectHint')}</Typography>
              </div>
            )}
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
