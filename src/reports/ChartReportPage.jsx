import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { FormControl, InputLabel, Select, MenuItem, useMediaQuery } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';
import {
  Area,
  Brush,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ReportFilter from './components/ReportFilter';
import { formatTime } from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import usePositionAttributes from '../common/attributes/usePositionAttributes';
import { useCatchCallback } from '../reactHelper';
import { useAttributePreference } from '../common/util/preferences';
import {
  altitudeFromMeters,
  distanceFromMeters,
  speedFromKnots,
  speedToKnots,
  volumeFromLiters,
} from '../common/util/converter';
import useReportStyles from './common/useReportStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';

// Estilos de la vista mobile (métrica única + KPIs).
const useMobileStyles = makeStyles()((theme) => ({
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    padding: theme.spacing(1.5),
    gap: theme.spacing(1.5),
    flex: 1,
  },
  seg: {
    display: 'flex',
    gap: 4,
    backgroundColor: theme.palette.action.hover,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 10,
    padding: 3,
    overflowX: 'auto',
  },
  segButton: {
    appearance: 'none',
    flex: 1,
    minWidth: 'max-content',
    border: 0,
    background: 'none',
    cursor: 'pointer',
    fontFamily: theme.fonts.body,
    fontSize: '0.72rem',
    fontWeight: 700,
    color: theme.palette.text.secondary,
    padding: theme.spacing(0.75, 1.25),
    borderRadius: 7,
    whiteSpace: 'nowrap',
  },
  segActive: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.primary.main,
    boxShadow: '0 1px 2px rgba(16, 24, 40, 0.08)',
  },
  chart: {
    flex: 1,
    minHeight: 220,
  },
  kpis: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: theme.spacing(1),
    flexShrink: 0,
  },
  kpi: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 10,
    padding: theme.spacing(1, 0.75),
    textAlign: 'center',
  },
  kpiLabel: {
    display: 'block',
    fontSize: '0.6rem',
    textTransform: 'uppercase',
    letterSpacing: '.03em',
    color: theme.palette.text.disabled,
  },
  kpiValue: {
    fontFamily: theme.fonts.head,
    fontWeight: 800,
    fontSize: '1.35rem',
    lineHeight: 1.1,
    display: 'block',
    margin: '3px 0 0',
    fontVariantNumeric: 'tabular-nums',
  },
  kpiSub: {
    fontSize: '0.6rem',
    color: theme.palette.text.disabled,
  },
}));

const ChartReportPage = () => {
  const { classes } = useReportStyles();
  const { classes: mobile, cx } = useMobileStyles();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const t = useTranslation();

  const positionAttributes = usePositionAttributes(t);

  const distanceUnit = useAttributePreference('distanceUnit');
  const altitudeUnit = useAttributePreference('altitudeUnit');
  const speedUnit = useAttributePreference('speedUnit');
  const volumeUnit = useAttributePreference('volumeUnit');

  const [items, setItems] = useState([]);
  const [types, setTypes] = useState(['speed']);
  const [selectedTypes, setSelectedTypes] = useState(['speed']);
  const [timeType, setTimeType] = useState('fixTime');
  // En mobile se muestra una sola métrica a la vez (segmented).
  const [activeType, setActiveType] = useState('speed');

  useEffect(() => {
    if (!selectedTypes.includes(activeType)) {
      setActiveType(selectedTypes[0] || 'speed');
    }
  }, [selectedTypes, activeType]);

  const values = items.map((it) =>
    selectedTypes.map((type) => it[type]).filter((value) => value != null),
  );
  const minValue = values.length ? Math.min(...values) : 0;
  const maxValue = values.length ? Math.max(...values) : 100;
  const valueRange = maxValue - minValue;

  // Estadísticas de la métrica activa (para los KPIs de mobile).
  const activeValues = items.map((it) => Number(it[activeType])).filter((v) => !Number.isNaN(v));
  const activeMax = activeValues.length ? Math.max(...activeValues) : 0;
  const activeMin = activeValues.length ? Math.min(...activeValues) : 0;
  const activeAvg = activeValues.length
    ? activeValues.reduce((a, b) => a + b, 0) / activeValues.length
    : 0;
  const activeMaxItem = activeValues.length
    ? items.find((it) => Number(it[activeType]) === activeMax)
    : null;
  const fmt = (v) => parseFloat(v.toFixed(2));

  const onShow = useCatchCallback(
    async ({ deviceIds, from, to }) => {
      const query = new URLSearchParams({ from, to });
      deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
      const response = await fetchOrThrow(`/api/reports/route?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      const positions = await response.json();
      const keySet = new Set();
      const keyList = [];
      const formattedPositions = positions.map((position) => {
        const data = { ...position, ...position.attributes };
        const formatted = {};
        formatted.fixTime = dayjs(position.fixTime).valueOf();
        formatted.deviceTime = dayjs(position.deviceTime).valueOf();
        formatted.serverTime = dayjs(position.serverTime).valueOf();
        Object.keys(data)
          .filter((key) => !['id', 'deviceId'].includes(key))
          .forEach((key) => {
            const value = data[key];
            if (typeof value === 'number') {
              keySet.add(key);
              const definition = positionAttributes[key] || {};
              switch (definition.dataType) {
                case 'speed':
                  if (key == 'obdSpeed') {
                    formatted[key] = speedFromKnots(speedToKnots(value, 'kmh'), speedUnit).toFixed(
                      2,
                    );
                  } else {
                    formatted[key] = speedFromKnots(value, speedUnit).toFixed(2);
                  }
                  break;
                case 'altitude':
                  formatted[key] = altitudeFromMeters(value, altitudeUnit).toFixed(2);
                  break;
                case 'distance':
                  formatted[key] = distanceFromMeters(value, distanceUnit).toFixed(2);
                  break;
                case 'volume':
                  formatted[key] = volumeFromLiters(value, volumeUnit).toFixed(2);
                  break;
                case 'hours':
                  formatted[key] = (value / 1000).toFixed(2);
                  break;
                default:
                  formatted[key] = value;
                  break;
              }
            }
          });
        return formatted;
      });
      Object.keys(positionAttributes).forEach((key) => {
        if (keySet.has(key)) {
          keyList.push(key);
          keySet.delete(key);
        }
      });
      setTypes([...keyList, ...keySet]);
      setItems(formattedPositions);
    },
    [positionAttributes, speedUnit, altitudeUnit, distanceUnit, volumeUnit],
  );

  const colorPalette = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.success.main,
    theme.palette.text.secondary,
  ];

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportChart']}>
      <ReportFilter onShow={onShow} onExport={() => {}} deviceType="single" formats={[]}>
        <div className={classes.filterItem}>
          <FormControl fullWidth>
            <InputLabel>{t('reportChartType')}</InputLabel>
            <Select
              label={t('reportChartType')}
              value={selectedTypes}
              onChange={(e) => setSelectedTypes(e.target.value)}
              multiple
              disabled={!items.length}
            >
              {types.map((key) => (
                <MenuItem key={key} value={key}>
                  {positionAttributes[key]?.name || key}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
        <div className={classes.filterItem}>
          <FormControl fullWidth>
            <InputLabel>{t('reportTimeType')}</InputLabel>
            <Select
              label={t('reportTimeType')}
              value={timeType}
              onChange={(e) => setTimeType(e.target.value)}
              disabled={!items.length}
            >
              <MenuItem value="fixTime">{t('positionFixTime')}</MenuItem>
              <MenuItem value="deviceTime">{t('positionDeviceTime')}</MenuItem>
              <MenuItem value="serverTime">{t('positionServerTime')}</MenuItem>
            </Select>
          </FormControl>
        </div>
      </ReportFilter>
      {items.length > 0 &&
        (desktop ? (
          <div className={classes.chart}>
            <ResponsiveContainer>
              <LineChart
                data={items}
                margin={{
                  top: 10,
                  right: 40,
                  left: 10,
                  bottom: 10,
                }}
              >
                <XAxis
                  stroke={theme.palette.text.primary}
                  dataKey={timeType}
                  type="number"
                  tickFormatter={(value) => formatTime(value, 'time')}
                  domain={['dataMin', 'dataMax']}
                  scale="time"
                />
                <YAxis
                  stroke={theme.palette.text.primary}
                  type="number"
                  tickFormatter={(value) => parseFloat(value.toFixed(2))}
                  domain={[minValue - valueRange / 5, maxValue + valueRange / 5]}
                />
                <CartesianGrid stroke={theme.palette.divider} strokeDasharray="3 3" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme.palette.background.default,
                    color: theme.palette.text.primary,
                  }}
                  formatter={(value, key) => [value, positionAttributes[key]?.name || key]}
                  labelFormatter={(value) => formatTime(value, 'seconds')}
                />
                <Brush
                  dataKey={timeType}
                  height={30}
                  stroke={theme.palette.primary.main}
                  tickFormatter={() => ''}
                />
                {selectedTypes.map((type, index) => (
                  <Line
                    key={type}
                    type="monotone"
                    dataKey={type}
                    stroke={colorPalette[index % colorPalette.length]}
                    dot={false}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className={mobile.wrap}>
            <div className={mobile.seg}>
              {selectedTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={cx(mobile.segButton, type === activeType && mobile.segActive)}
                  onClick={() => setActiveType(type)}
                >
                  {positionAttributes[type]?.name || type}
                </button>
              ))}
            </div>
            <div className={mobile.chart}>
              <ResponsiveContainer>
                <ComposedChart data={items} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                  <defs>
                    <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={0.22} />
                      <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    stroke={theme.palette.text.secondary}
                    dataKey={timeType}
                    type="number"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => formatTime(value, 'time')}
                    domain={['dataMin', 'dataMax']}
                    scale="time"
                  />
                  <YAxis
                    stroke={theme.palette.text.secondary}
                    type="number"
                    width={34}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => parseFloat(value.toFixed(2))}
                    domain={['auto', 'auto']}
                  />
                  <CartesianGrid stroke={theme.palette.divider} strokeDasharray="3 3" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme.palette.background.default,
                      color: theme.palette.text.primary,
                      fontSize: 12,
                    }}
                    formatter={(value) => [
                      value,
                      positionAttributes[activeType]?.name || activeType,
                    ]}
                    labelFormatter={(value) => formatTime(value, 'seconds')}
                  />
                  <Area
                    type="monotone"
                    dataKey={activeType}
                    stroke="none"
                    fill="url(#chartFill)"
                    connectNulls
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey={activeType}
                    stroke={theme.palette.primary.main}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                    connectNulls
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className={mobile.kpis}>
              <div
                className={mobile.kpi}
                style={{ borderColor: alpha(theme.palette.primary.main, 0.3) }}
              >
                <span className={mobile.kpiLabel}>{t('reportMaximum')}</span>
                <span className={mobile.kpiValue} style={{ color: theme.palette.primary.main }}>
                  {fmt(activeMax)}
                </span>
                {activeMaxItem && (
                  <span className={mobile.kpiSub}>
                    {formatTime(activeMaxItem[timeType], 'time')}
                  </span>
                )}
              </div>
              <div className={mobile.kpi}>
                <span className={mobile.kpiLabel}>{t('reportAverage')}</span>
                <span className={mobile.kpiValue}>{fmt(activeAvg)}</span>
              </div>
              <div className={mobile.kpi}>
                <span className={mobile.kpiLabel}>{t('reportMinimum')}</span>
                <span className={mobile.kpiValue}>{fmt(activeMin)}</span>
              </div>
            </div>
          </div>
        ))}
    </PageLayout>
  );
};

export default ChartReportPage;
