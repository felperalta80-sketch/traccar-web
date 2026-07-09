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

const useStyles = makeStyles()((theme) => ({
  root: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.25),
    padding: theme.spacing(1, 1.5, 1, 2),
    '&.Mui-selected': {
      backgroundColor:
        theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.07)' : 'rgba(28, 37, 54, 0.06)',
    },
    '&.Mui-selected:hover': {
      backgroundColor:
        theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.10)' : 'rgba(28, 37, 54, 0.09)',
    },
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 21,
    height: 21,
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
  title: {
    fontSize: '0.9rem',
    fontWeight: 600,
    lineHeight: 1.35,
    color: theme.palette.text.primary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  meta: {
    marginTop: 1,
    fontSize: '0.75rem',
    lineHeight: 1.35,
    color: theme.palette.text.secondary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontVariantNumeric: 'tabular-nums',
  },
  side: {
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 5,
  },
  status: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontSize: '0.72rem',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    backgroundColor: 'currentColor',
    flexShrink: 0,
  },
  stats: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    color: theme.palette.text.secondary,
  },
  stat: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 3,
    fontSize: '0.72rem',
    fontVariantNumeric: 'tabular-nums',
    '& svg': {
      fontSize: 15,
      width: 15,
      height: 15,
    },
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

const DeviceRow = ({ devices, index, style }) => {
  const { classes, cx } = useStyles();
  const theme = useTheme();
  const dispatch = useDispatch();
  const t = useTranslation();

  const admin = useAdministrator();
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);

  const item = devices[index];
  const selected = selectedDeviceId === item.id;
  const position = useSelector((state) => state.session.positions[item.id]);

  const devicePrimary = useAttributePreference('devicePrimary', 'name');

  const statusKey = getStatusColor(item.status);
  const statusColor = theme.palette[statusKey].main;

  const name = item[devicePrimary] || item.name;

  const metaText = [
    item.model,
    item.uniqueId,
    item.lastUpdate ? dayjs(item.lastUpdate).fromNow() : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div style={style}>
      <ListItemButton
        key={item.id}
        className={classes.root}
        onClick={() => dispatch(devicesActions.selectId(item.id))}
        disabled={!admin && item.disabled}
        selected={selected}
      >
        <div
          className={classes.iconWrap}
          style={{
            color: statusColor,
            backgroundColor: alpha(statusColor, 0.14),
            boxShadow: `inset 0 0 0 1.5px ${alpha(statusColor, 0.5)}`,
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
          <div className={classes.title}>{name}</div>
          <div className={classes.meta}>{metaText}</div>
        </div>

        <div className={classes.side}>
          <span className={cx(classes.status, classes[statusKey])}>
            <span className={classes.dot} />
            {formatStatus(item.status, t)}
          </span>
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
                    <EngineIcon width={15} height={15} />
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
      </ListItemButton>
    </div>
  );
};

export default DeviceRow;
