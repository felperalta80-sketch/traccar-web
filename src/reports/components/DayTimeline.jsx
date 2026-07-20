import { makeStyles } from 'tss-react/mui';
import { useTheme, alpha } from '@mui/material/styles';
import { IconButton, Skeleton, Tooltip, Typography } from '@mui/material';
import TripOriginIcon from '@mui/icons-material/TripOrigin';
import PlaceIcon from '@mui/icons-material/Place';
import RouteIcon from '@mui/icons-material/Route';
import { useTranslation } from '../../common/components/LocalizationProvider';
import {
  formatTime,
  formatDistance,
  formatSpeed,
  formatDurationCompact,
} from '../../common/util/formatter';
import AddressValue from '../../common/components/AddressValue';

// Línea de tiempo vertical del recorrido de un día: viajes y paradas
// encadenados cronológicamente sobre un riel. Cada tramo es una tarjeta con el
// filete de color del sistema (verde = en marcha, gris = detenido), con el mismo
// tratamiento que DeviceRow (radio 9, filete 3px, sombra e insets) para que el
// panel se lea igual que la lista de dispositivos.
const CARD_GAP = 5; // separación entre tarjetas (igual que DeviceRow)
const CARD_INSET = 6; // sangría lateral (igual que DeviceRow)
const RAIL_CHANNEL = 28; // canal izquierdo reservado al riel y los nodos

const useStyles = makeStyles()((theme) => ({
  summary: {
    display: 'flex',
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#F0F0F0',
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  summaryCell: {
    flex: 1,
    minWidth: 0,
    padding: theme.spacing(1, 0.75),
    textAlign: 'center',
    '& + &': {
      borderLeft: `1px solid ${theme.palette.divider}`,
    },
  },
  summaryKey: {
    display: 'block',
    fontFamily: theme.fonts.head,
    fontSize: theme.typography.label.fontSize,
    fontWeight: theme.typography.label.fontWeight,
    letterSpacing: theme.typography.label.letterSpacing,
    textTransform: theme.typography.label.textTransform,
    color: theme.palette.text.secondary,
    lineHeight: 1.4,
  },
  summaryValue: {
    display: 'block',
    fontFamily: theme.fonts.head,
    fontWeight: 700,
    fontSize: theme.typography.body1.fontSize,
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1.3,
  },
  rail: {
    position: 'relative',
    // Riel a 13px del borde (12 + mitad de 2). Las tarjetas arrancan en el canal
    // (28px); arriba/abajo/derecha llevan el mismo inset que la lista.
    padding: `${CARD_INSET}px ${CARD_INSET}px ${CARD_INSET}px ${RAIL_CHANNEL}px`,
    '&::before': {
      content: '""',
      position: 'absolute',
      left: theme.spacing(1.5),
      top: theme.spacing(2.5),
      bottom: theme.spacing(2.5),
      width: 2,
      backgroundColor: theme.palette.divider,
    },
  },
  entry: {
    position: 'relative',
    '& + &': {
      marginTop: CARD_GAP,
    },
  },
  node: {
    position: 'absolute',
    // -20px desde la tarjeta (28px) => borde en 8, centro en 13 = eje del riel.
    left: 8 - RAIL_CHANNEL,
    top: theme.spacing(1.75),
    width: 10,
    height: 10,
    borderRadius: '50%',
    // Halo del color del panel (paper) para separar el nodo del riel.
    border: `2px solid ${theme.palette.background.paper}`,
  },
  card: {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderLeftWidth: 3,
    borderRadius: 9,
    padding: theme.spacing(1.25, 1.5),
    boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 1px 2px rgba(16, 24, 40, 0.06)',
  },
  clickable: {
    cursor: 'pointer',
    '&:hover': {
      borderColor: theme.palette.text.secondary,
    },
  },
  // Seleccionado: mismo tinte neutro que la fila de dispositivo, para que el
  // tramo abierto en el mapa se lea sin depender solo del filete de color.
  selected: {
    backgroundColor:
      theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.06)'
        : alpha(theme.palette.ink.main, 0.05),
    borderColor:
      theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.22)'
        : alpha(theme.palette.ink.main, 0.22),
  },
  head: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(0.5),
  },
  replay: {
    marginLeft: theme.spacing(-0.5),
    marginRight: theme.spacing(-0.5),
    flexShrink: 0,
    '& svg': {
      fontSize: 16,
      width: 16,
      height: 16,
    },
  },
  time: {
    fontFamily: theme.fonts.head,
    fontWeight: 700,
    fontSize: theme.typography.body2.fontSize,
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1.35,
  },
  duration: {
    marginLeft: 'auto',
    flexShrink: 0,
    fontSize: theme.typography.caption.fontSize,
    color: theme.palette.text.secondary,
    fontVariantNumeric: 'tabular-nums',
  },
  leg: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(0.75),
    fontSize: theme.typography.body2.fontSize,
    lineHeight: 1.4,
    color: theme.palette.text.secondary,
    '& + &': {
      marginTop: theme.dimensions.gapFine,
    },
    '& svg': {
      fontSize: 16,
      width: 16,
      height: 16,
      flexShrink: 0,
      marginTop: 2,
      color: theme.palette.text.disabled,
    },
  },
  metrics: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.75),
    marginTop: theme.spacing(0.75),
  },
  metric: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.dimensions.gapFine,
    backgroundColor:
      theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(28, 37, 54, 0.05)',
    borderRadius: 999,
    padding: theme.spacing(0.25, 1),
    fontSize: theme.typography.caption.fontSize,
    fontVariantNumeric: 'tabular-nums',
    color: theme.palette.text.secondary,
  },
  metricValue: {
    fontFamily: theme.fonts.head,
    fontWeight: 700,
    color: theme.palette.text.primary,
  },
  empty: {
    padding: theme.spacing(5, 2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
}));

export const DayTimelineSummary = ({ summary }) => {
  const { classes } = useStyles();
  const t = useTranslation();

  const cells = [
    { key: t('reportTrips'), value: summary.trips },
    { key: t('sharedDistance'), value: summary.distance },
    { key: t('reportMoving'), value: summary.moving },
    { key: t('reportStopped'), value: summary.stopped },
  ];

  return (
    <div className={classes.summary}>
      {cells.map((cell) => (
        <div key={cell.key} className={classes.summaryCell}>
          <span className={classes.summaryKey}>{cell.key}</span>
          <span className={classes.summaryValue}>{cell.value}</span>
        </div>
      ))}
    </div>
  );
};

export const itemKey = (item) => `${item.type}-${item.startPositionId ?? item.startTime}`;

const DayTimeline = ({
  items,
  loading,
  distanceUnit,
  speedUnit,
  onSelect,
  onReplay,
  selectedKey,
}) => {
  const { classes, cx } = useStyles();
  const theme = useTheme();
  const t = useTranslation();

  if (loading) {
    return (
      <div className={classes.rail}>
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className={classes.entry}>
            <Skeleton variant="rounded" height={index % 2 ? 64 : 96} />
          </div>
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className={classes.empty}>
        <Typography variant="body2">{t('sharedNoData')}</Typography>
      </div>
    );
  }

  return (
    <div className={classes.rail}>
      {items.map((item) => {
        const trip = item.type === 'trip';
        const color = trip ? theme.palette.success.main : theme.palette.neutral.main;
        const key = itemKey(item);
        return (
          <div key={key} className={classes.entry}>
            <span className={classes.node} style={{ backgroundColor: color }} />
            <div
              className={cx(
                classes.card,
                onSelect && classes.clickable,
                selectedKey === key && classes.selected,
              )}
              style={{ borderLeftColor: color }}
              onClick={onSelect ? () => onSelect(item) : undefined}
              role={onSelect ? 'button' : undefined}
              tabIndex={onSelect ? 0 : undefined}
              onKeyDown={
                onSelect
                  ? (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onSelect(item);
                      }
                    }
                  : undefined
              }
            >
              <div className={classes.head}>
                <span className={classes.time}>
                  {`${formatTime(item.startTime, 'clock')} — ${formatTime(item.endTime, 'clock')}`}
                </span>
                <span className={classes.duration}>{formatDurationCompact(item.duration, t)}</span>
                {trip && onReplay && (
                  <Tooltip title={t('reportReplay')}>
                    <IconButton
                      className={classes.replay}
                      size="small"
                      aria-label={t('reportReplay')}
                      // No debe seleccionar el tramo en el mapa: es otra acción.
                      onClick={(event) => {
                        event.stopPropagation();
                        onReplay(item);
                      }}
                    >
                      <RouteIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </div>

              {trip ? (
                <>
                  <div className={classes.leg}>
                    <TripOriginIcon />
                    <AddressValue
                      latitude={item.startLat}
                      longitude={item.startLon}
                      originalAddress={item.startAddress}
                    />
                  </div>
                  <div className={classes.leg}>
                    <PlaceIcon />
                    <AddressValue
                      latitude={item.endLat}
                      longitude={item.endLon}
                      originalAddress={item.endAddress}
                    />
                  </div>
                  <div className={classes.metrics}>
                    <span className={classes.metric}>
                      <span className={classes.metricValue}>
                        {formatDistance(item.distance, distanceUnit, t)}
                      </span>
                    </span>
                    {item.averageSpeed > 0 && (
                      <span className={classes.metric}>
                        {`${t('reportAverageSpeed')} `}
                        <span className={classes.metricValue}>
                          {formatSpeed(item.averageSpeed, speedUnit, t)}
                        </span>
                      </span>
                    )}
                    {item.maxSpeed > 0 && (
                      <span className={classes.metric}>
                        {`${t('reportMaximumSpeed')} `}
                        <span className={classes.metricValue}>
                          {formatSpeed(item.maxSpeed, speedUnit, t)}
                        </span>
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div className={classes.leg}>
                  <PlaceIcon />
                  <AddressValue
                    latitude={item.latitude}
                    longitude={item.longitude}
                    originalAddress={item.address}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DayTimeline;
