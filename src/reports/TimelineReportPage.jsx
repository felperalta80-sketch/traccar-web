import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useAttributePreference } from '../common/util/preferences';
import { formatDistance, formatDurationCompact } from '../common/util/formatter';
import PageLayout from '../common/components/PageLayout';
import SelectField from '../common/components/SelectField';
import ReportsMenu from './components/ReportsMenu';
import DayNavigator from './components/DayNavigator';
import DayTimeline, { DayTimelineSummary } from './components/DayTimeline';
import useReportStyles from './common/useReportStyles';
import { useAsyncTask } from '../reactHelper';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { deviceEquality } from '../common/util/deviceEquality';

// Recorrido del día: viajes y paradas de un dispositivo en una sola línea de
// tiempo. Combina /api/reports/trips y /api/reports/stops en el mismo rango y
// los intercala por hora de inicio; no hay endpoint nuevo del lado del servidor.
const TimelineReportPage = () => {
  const navigate = useNavigate();
  const { classes } = useReportStyles();
  const t = useTranslation();

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

  // Solo los viajes tienen un tramo que reproducir; una parada es un punto.
  const onSelect = (item) => {
    if (item.type !== 'trip') {
      return;
    }
    navigate({
      pathname: '/replay',
      search: new URLSearchParams({
        from: item.startTime,
        to: item.endTime,
        deviceId: item.deviceId,
      }).toString(),
    });
  };

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportDayTimeline']}>
      <div className={classes.container}>
        <div className={classes.containerMain}>
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
          <DayTimeline
            items={items}
            loading={loading}
            distanceUnit={distanceUnit}
            speedUnit={speedUnit}
            onSelect={onSelect}
          />
        </div>
      </div>
    </PageLayout>
  );
};

export default TimelineReportPage;
