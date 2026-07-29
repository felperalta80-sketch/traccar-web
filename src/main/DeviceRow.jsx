import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { useTheme, alpha } from '@mui/material/styles';
import { Tooltip, ListItemButton } from '@mui/material';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import Battery60Icon from '@mui/icons-material/Battery60';
import BatteryCharging60Icon from '@mui/icons-material/BatteryCharging60';
import Battery20Icon from '@mui/icons-material/Battery20';
import BatteryCharging20Icon from '@mui/icons-material/BatteryCharging20';
import ErrorIcon from '@mui/icons-material/Error';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { devicesActions } from '../store';
import {
  formatAlarm,
  formatBoolean,
  formatPercentage,
  formatStatus,
  getStatusColor,
  getBatteryStatus,
} from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import { mapIconKey, mapIcons } from '../map/core/preloadImages';
import { useAdministrator } from '../common/util/permissions';
import EngineIcon from '../resources/images/data/engine.svg?react';
import { useAttributePreference } from '../common/util/preferences';

dayjs.extend(relativeTime);

// Separación entre tarjetas y sangría lateral (px). Gaps un toque juntos.
const CARD_GAP = 5;
const CARD_INSET = 6;
const foldBg = (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#F0F0F0');

const useStyles = makeStyles()((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: 0,
    overflow: 'hidden',
    borderRadius: 9,
    border: `1px solid ${theme.palette.divider}`,
    borderLeft: '3px solid var(--st)',
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 1px 2px rgba(16, 24, 40, 0.06)',
    // Seleccionado: se mantiene el filete de color (riel) y el mismo grosor de
    // borde, solo se oscurece; el fondo lleva un tinte neutro sutil para
    // destacarlo del resto sin ser estridente.
    '&.Mui-selected': {
      backgroundColor:
        theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.06)'
          : alpha(theme.palette.ink.main, 0.05),
      borderColor:
        theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.22)'
          : alpha(theme.palette.ink.main, 0.22),
      borderLeftColor: 'var(--st)',
    },
    '&.Mui-selected:hover': {
      backgroundColor:
        theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.09)'
          : alpha(theme.palette.ink.main, 0.08),
    },
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1, 1.25, 0, 1.25),
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 16,
    height: 16,
    backgroundColor: 'currentColor',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.75),
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontFamily: theme.fonts.head,
    fontSize: theme.typography.body2.fontSize,
    fontWeight: 700,
    lineHeight: 1.25,
    color: theme.palette.text.primary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  status: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    fontSize: '0.59375rem',
    fontWeight: 700,
    whiteSpace: 'nowrap',
    flexShrink: 0,
    padding: theme.spacing(0.25, 1),
    borderRadius: 999,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: 'currentColor',
    flexShrink: 0,
  },
  locMetrics: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(0.25, 1.25, 1, 1.25),
  },
  locline: {
    minWidth: 0,
    fontSize: theme.typography.caption.fontSize,
    lineHeight: 1.3,
    color: theme.palette.text.secondary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontVariantNumeric: 'tabular-nums',
  },
  spacer: {
    flex: 1,
  },
  ago: {
    color: theme.palette.text.disabled,
  },
  stats: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.75),
    flexShrink: 0,
    color: theme.palette.text.secondary,
  },
  stat: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.dimensions.gapFine,
    fontSize: theme.typography.caption.fontSize,
    fontVariantNumeric: 'tabular-nums',
    '& svg': {
      fontSize: 16,
      width: 16,
      height: 16,
    },
  },
  expand: {
    appearance: 'none',
    background: 'none',
    border: 0,
    cursor: 'pointer',
    flexShrink: 0,
    alignSelf: 'stretch',
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 0.5),
    color: theme.palette.text.disabled,
  },
  chevron: {
    fontSize: 16,
    transition: 'transform .15s ease',
  },
  chevronOpen: {
    transform: 'rotate(180deg)',
  },
  foldBody: {
    padding: theme.spacing(0.875, 1.25, 1, 1.25),
    borderTop: `1px solid ${theme.palette.divider}`,
    backgroundColor: foldBg(theme),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.75),
  },
  clientBlock: {
    paddingTop: theme.spacing(0.75),
    borderTop: `1px dashed ${theme.palette.divider}`,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  },
  clientLabel: {
    fontSize: '0.59375rem',
    fontWeight: 800,
    letterSpacing: '.05em',
    textTransform: 'uppercase',
    color: theme.palette.text.disabled,
  },
  kv: {
    margin: 0,
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    columnGap: theme.spacing(1.5),
    rowGap: 2,
    fontSize: theme.typography.caption.fontSize,
  },
  kvKey: {
    color: theme.palette.text.disabled,
    whiteSpace: 'nowrap',
  },
  kvVal: {
    margin: 0,
    textAlign: 'end',
    fontWeight: 600,
    color: theme.palette.text.primary,
    overflowWrap: 'anywhere',
  },
  noData: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.palette.text.disabled,
    fontStyle: 'italic',
  },
  success: { color: theme.palette.success.main },
  warning: { color: theme.palette.warning.main },
  error: { color: theme.palette.error.main },
  neutral: { color: theme.palette.neutral.main },
}));

const batteryIcon = (level, charge) => {
  if (level > 70) {
    return charge ? <BatteryChargingFullIcon /> : <BatteryFullIcon />;
  }
  if (level > 30) {
    return charge ? <BatteryCharging60Icon /> : <Battery60Icon />;
  }
  return charge ? <BatteryCharging20Icon /> : <Battery20Icon />;
};

// Los atributos "modelo" y "contacto" viajan como JSON en los campos nativos
// model/contact del dispositivo. Los mostramos tal cual vienen (todas las claves
// en orden); si no parsea o está vacío, la sección dice "Sin datos".
const parseJson = (value) => {
  if (!value) {
    return null;
  }
  if (typeof value === 'object') {
    return value;
  }
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

const renderValue = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
};

const DeviceRow = ({ device, style, expanded, onToggleExpand }) => {
  const { classes, cx } = useStyles();
  const theme = useTheme();
  const dispatch = useDispatch();
  const t = useTranslation();

  const admin = useAdministrator();
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);

  const item = device;
  const selected = selectedDeviceId === item.id;
  const position = useSelector((state) => state.session.positions[item.id]);

  const devicePrimary = useAttributePreference('devicePrimary', 'name');

  const statusKey = getStatusColor(item.status);
  const statusColor = theme.palette[statusKey].main;

  const name = item[devicePrimary] || item.name;

  const locTime = position?.fixTime || item.lastUpdate;
  const modelData = parseJson(item.model);
  const contactData = admin ? parseJson(item.contact) : null;

  const kv = (data) => (
    <dl className={classes.kv}>
      {Object.entries(data).map(([key, value]) => (
        <div key={key} style={{ display: 'contents' }}>
          <dt className={classes.kvKey}>{key}</dt>
          <dd className={classes.kvVal}>{renderValue(value)}</dd>
        </div>
      ))}
    </dl>
  );

  const dataOrNoData = (data) =>
    data ? kv(data) : <span className={classes.noData}>{t('sharedNoData')}</span>;

  return (
    <div
      style={{
        ...style,
        boxSizing: 'border-box',
        paddingTop: CARD_GAP,
        paddingLeft: CARD_INSET,
        paddingRight: CARD_INSET,
      }}
    >
      <ListItemButton
        key={item.id}
        className={classes.root}
        style={{ '--st': statusColor }}
        onClick={() => dispatch(devicesActions.selectId(item.id))}
        disabled={!admin && item.disabled}
        selected={selected}
      >
        <div className={classes.header}>
          <div
            className={classes.iconWrap}
            style={{
              color: statusColor,
              backgroundColor: alpha(statusColor, 0.16),
            }}
          >
            <span
              className={classes.icon}
              style={{
                WebkitMaskImage: `url("${mapIcons[mapIconKey(item.category)]}")`,
                maskImage: `url("${mapIcons[mapIconKey(item.category)]}")`,
              }}
            />
          </div>

          <div className={classes.body}>
            <div className={classes.titleRow}>
              <span className={classes.title}>{name}</span>
              <span
                className={classes.status}
                style={{ color: statusColor, backgroundColor: alpha(statusColor, 0.13) }}
              >
                <span className={classes.dot} />
                {formatStatus(item.status, t)}
              </span>
            </div>
          </div>

          <button
            type="button"
            className={classes.expand}
            title={t('deviceVehicleDetails')}
            onClick={(event) => {
              event.stopPropagation();
              onToggleExpand(item.id);
            }}
          >
            <ExpandMoreIcon className={cx(classes.chevron, expanded && classes.chevronOpen)} />
          </button>
        </div>

        <div className={classes.locMetrics}>
          <span className={classes.locline}>
            {locTime ? dayjs(locTime).format('DD/MM/YY-HH:mm') : '—'}
            {locTime && <span className={classes.ago}>{` · ${dayjs(locTime).fromNow()}`}</span>}
          </span>
          <span className={classes.spacer} />
          {position && (
            <div className={classes.stats}>
              {position.attributes.hasOwnProperty('alarm') && (
                <Tooltip title={`${t('eventAlarm')}: ${formatAlarm(position.attributes.alarm, t)}`}>
                  <span className={cx(classes.stat, classes.error)}>
                    <ErrorIcon />
                  </span>
                </Tooltip>
              )}
              {position.attributes.hasOwnProperty('ignition') && (
                <Tooltip
                  title={`${t('positionIgnition')}: ${formatBoolean(position.attributes.ignition, t)}`}
                >
                  <span
                    className={cx(
                      classes.stat,
                      position.attributes.ignition ? classes.success : classes.neutral,
                    )}
                  >
                    <EngineIcon width={16} height={16} />
                  </span>
                </Tooltip>
              )}
              {position.attributes.hasOwnProperty('batteryLevel') && (
                <Tooltip
                  title={`${t('positionBatteryLevel')}: ${formatPercentage(position.attributes.batteryLevel)}`}
                >
                  <span
                    className={cx(
                      classes.stat,
                      classes[getBatteryStatus(position.attributes.batteryLevel)],
                    )}
                  >
                    {batteryIcon(position.attributes.batteryLevel, position.attributes.charge)}
                    {formatPercentage(position.attributes.batteryLevel)}
                  </span>
                </Tooltip>
              )}
            </div>
          )}
        </div>

        {expanded && (
          <div className={classes.foldBody}>
            {dataOrNoData(modelData)}
            {admin && (
              <div className={classes.clientBlock}>
                <div className={classes.clientLabel}>{t('deviceClient')}</div>
                {dataOrNoData(contactData)}
              </div>
            )}
          </div>
        )}
      </ListItemButton>
    </div>
  );
};

export default DeviceRow;
