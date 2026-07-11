import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Rnd } from 'react-rnd';
import {
  Card,
  CardMedia,
  Typography,
  CardActions,
  IconButton,
  Menu,
  MenuItem,
  Link,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useTheme, alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import RouteIcon from '@mui/icons-material/Route';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PendingIcon from '@mui/icons-material/Pending';
import SpeedIcon from '@mui/icons-material/Speed';
import PlaceIcon from '@mui/icons-material/Place';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import NavigationIcon from '@mui/icons-material/Navigation';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { useTranslation } from './LocalizationProvider';
import {
  getStatusColor,
  formatStatus,
  formatSpeed,
  formatAddress,
  formatTime,
  getBatteryStatus,
} from '../util/formatter';
import RemoveDialog from './RemoveDialog';
import PositionDrawer from './PositionDrawer';
import { useDeviceReadonly, useRestriction } from '../util/permissions';
import { devicesActions } from '../../store';
import { useCatch, useCatchCallback } from '../../reactHelper';
import { useAttributePreference, usePreference } from '../util/preferences';
import fetchOrThrow from '../util/fetchOrThrow';
import { mapIconKey, mapIcons } from '../../map/core/preloadImages';
import EngineIcon from '../../resources/images/data/engine.svg?react';

dayjs.extend(relativeTime);

const useStyles = makeStyles()((theme, { desktopPadding }) => ({
  card: {
    pointerEvents: 'auto',
    overflow: 'hidden',
    [theme.breakpoints.up('md')]: {
      width: theme.dimensions.popupMaxWidth,
      borderRadius: 16,
    },
    // Mobile: hoja inferior a ancho completo, solo redondeada arriba, pegada al
    // fondo. Sin sombra inferior; solo una sombra hacia arriba para separarla
    // del contenido de atrás.
    [theme.breakpoints.down('md')]: {
      width: '100%',
      borderRadius: theme.spacing(2, 2, 0, 0),
      boxShadow:
        theme.palette.mode === 'dark'
          ? '0 -6px 18px rgba(16, 24, 40, 0.5)'
          : '0 -4px 16px rgba(16, 24, 40, 0.14)',
    },
  },
  strip: {
    height: 4,
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(1.25),
    padding: theme.spacing(1.25, 1, 1, 1.75),
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    width: 20,
    height: 20,
    backgroundColor: 'currentColor',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontFamily: theme.fonts.head,
    fontWeight: 700,
    fontSize: '0.9375rem',
    lineHeight: 1.2,
    color: theme.palette.text.primary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  subtitle: {
    marginTop: 4,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    flexWrap: 'wrap',
  },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    fontSize: theme.typography.caption.fontSize,
    fontWeight: 700,
    padding: theme.spacing(0.25, 1),
    borderRadius: 999,
    whiteSpace: 'nowrap',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    backgroundColor: 'currentColor',
    flexShrink: 0,
  },
  driver: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    fontSize: theme.typography.caption.fontSize,
    color: theme.palette.text.secondary,
    minWidth: 0,
    '& svg': {
      fontSize: 16,
    },
  },
  media: {
    height: theme.dimensions.popupImageHeight,
    '& > div': {
      color: theme.palette.common.white,
      mixBlendMode: 'difference',
    },
  },
  statusBar: {
    display: 'flex',
    alignItems: 'stretch',
    padding: theme.spacing(1.25, 1),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  seg: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.dimensions.gapFine,
    textAlign: 'center',
    position: 'relative',
    '& + &::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: 2,
      bottom: 2,
      width: 1,
      backgroundColor: theme.palette.divider,
    },
    '& svg': {
      fontSize: 20,
      width: 20,
      height: 20,
    },
  },
  segValue: {
    fontFamily: theme.fonts.head,
    fontWeight: 800,
    fontSize: '0.75rem',
    lineHeight: 1.15,
    // Permite que etiquetas largas ("En movimiento") caigan a dos líneas en vez
    // de desbordar la columna.
    whiteSpace: 'normal',
    wordBreak: 'normal',
  },
  location: {
    padding: theme.spacing(1.25, 1.75, 1),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  locationLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    fontSize: theme.typography.label.fontSize,
    fontWeight: 700,
    letterSpacing: '.05em',
    textTransform: 'uppercase',
    color: theme.palette.text.disabled,
    marginBottom: 2,
    '& svg': {
      fontSize: 16,
    },
  },
  locationText: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    lineHeight: 1.3,
    color: theme.palette.text.primary,
    // Máximo 2 líneas para la dirección.
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  lastLine: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: theme.spacing(0.75),
    padding: theme.spacing(0.75, 1.75, 1.25),
    color: theme.palette.text.secondary,
    fontVariantNumeric: 'tabular-nums',
    '& svg': {
      fontSize: 16,
      marginTop: 1,
    },
  },
  lastText: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  lastLabel: {
    fontSize: '0.6875rem',
    lineHeight: 1.35,
  },
  lastAgo: {
    fontSize: '0.625rem',
    lineHeight: 1.3,
    color: theme.palette.text.disabled,
  },
  detailsLink: {
    marginLeft: 'auto',
    fontSize: '0.6875rem',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  actions: {
    padding: theme.spacing(1),
    gap: theme.spacing(0.25),
    backgroundColor: theme.palette.action.hover,
    borderTop: `1px solid ${theme.palette.divider}`,
    '& .MuiIconButton-root': {
      flex: 1,
      borderRadius: 8,
    },
  },
  root: {
    pointerEvents: 'none',
    position: 'fixed',
    zIndex: 5,
    [theme.breakpoints.up('md')]: {
      left: `calc(50% + ${desktopPadding} / 2)`,
      bottom: theme.spacing(3),
      transform: 'translateX(-50%)',
    },
    // Mobile: hoja inferior modal sobre la barra de módulos, a ancho completo.
    [theme.breakpoints.down('md')]: {
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 6,
      '& > *': {
        width: '100% !important',
      },
    },
  },
}));

const StatusCard = ({ deviceId, position, onClose, disableActions, desktopPadding = 0 }) => {
  const { classes } = useStyles({ desktopPadding });
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useTranslation();

  const readonly = useRestriction('readonly');
  const deviceReadonly = useDeviceReadonly();

  const shareDisabled = useSelector((state) => state.session.server.attributes.disableShare);
  const user = useSelector((state) => state.session.user);
  const device = useSelector((state) => state.devices.items[deviceId]);

  const statusColor = theme.palette[getStatusColor(device?.status)].main;

  const deviceImage = device?.attributes?.deviceImage;

  const geocoderEnabled = useSelector((state) => state.session.server.geocoderEnabled);
  const coordinateFormat = usePreference('coordinateFormat');
  const speedUnit = useAttributePreference('speedUnit');

  const navigationAppLink = useAttributePreference('navigationAppLink');
  const navigationAppTitle = useAttributePreference('navigationAppTitle');

  const attributes = position?.attributes || {};
  const hasIgnition = Object.prototype.hasOwnProperty.call(attributes, 'ignition');
  const hasMotion = Object.prototype.hasOwnProperty.call(attributes, 'motion');
  const ignition = attributes.ignition;
  const motion = attributes.motion;
  const batteryLevel = attributes.batteryLevel;

  const driverUniqueId = attributes.driverUniqueId;
  const driverName = useSelector((state) =>
    driverUniqueId ? state.drivers.items[driverUniqueId]?.name || driverUniqueId : null,
  );

  const [anchorEl, setAnchorEl] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [address, setAddress] = useState();

  // Dirección: usa la que ya trae la posición o la geocodifica una vez al abrir.
  useEffect(() => {
    setAddress(position?.address);
    if (!position || position.address || !geocoderEnabled) {
      return undefined;
    }
    let active = true;
    (async () => {
      try {
        const query = new URLSearchParams({
          latitude: position.latitude,
          longitude: position.longitude,
        });
        const response = await fetchOrThrow(`/api/server/geocode?${query.toString()}`);
        const text = await response.text();
        if (active) {
          setAddress(text);
        }
      } catch {
        // se mantiene el fallback de coordenadas
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, position?.address, geocoderEnabled]);

  const handleRemove = useCatch(async (removed) => {
    if (removed) {
      const response = await fetchOrThrow('/api/devices');
      dispatch(devicesActions.refresh(await response.json()));
    }
    setRemoving(false);
  });

  const handleGeofence = useCatchCallback(async () => {
    const newItem = {
      name: t('sharedGeofence'),
      area: `CIRCLE (${position.latitude} ${position.longitude}, 50)`,
    };
    const response = await fetchOrThrow('/api/geofences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    });
    const item = await response.json();
    await fetchOrThrow('/api/permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: position.deviceId, geofenceId: item.id }),
    });
    navigate(`/settings/geofence/${item.id}`);
  }, [navigate, position, t]);

  // Estado del motor derivado de ignición + movimiento.
  let engineLabel = '—';
  let engineColor = theme.palette.neutral.main;
  if (hasIgnition) {
    if (!ignition) {
      engineLabel = t('deviceEngineOff');
      engineColor = theme.palette.neutral.main;
    } else if (motion) {
      engineLabel = t('deviceEngineOn');
      engineColor = theme.palette.success.main;
    } else {
      engineLabel = t('deviceEngineIdle');
      engineColor = theme.palette.warning.main;
    }
  }

  const motionLabel = hasMotion ? (motion ? t('deviceMoving') : t('deviceStopped')) : '—';
  const motionColor = hasMotion && motion ? theme.palette.success.main : theme.palette.neutral.main;

  const batteryColor =
    batteryLevel != null ? theme.palette[getBatteryStatus(batteryLevel)].main : theme.palette.neutral.main;

  const locationTime = position?.fixTime || device?.lastUpdate;
  const addressText =
    address ||
    (position
      ? formatAddress(
          { latitude: position.latitude, longitude: position.longitude },
          coordinateFormat,
        )
      : '');

  return (
    <>
      <div className={classes.root}>
        {device && (
          <Rnd
            default={{ x: 0, y: 0, width: 'auto', height: 'auto' }}
            enableResizing={false}
            disableDragging={!desktop}
            dragHandleClassName="draggable-header"
            style={{ position: 'relative' }}
          >
            <Card elevation={desktop ? 3 : 0} className={classes.card}>
              <div className={classes.strip} style={{ backgroundColor: statusColor }} />
              <CardMedia
                className={`draggable-header ${deviceImage ? classes.media : ''}`}
                image={deviceImage && `/api/media/${device.uniqueId}/${deviceImage}`}
              >
                <div className={classes.header}>
                  <div
                    className={classes.avatar}
                    style={{ color: statusColor, backgroundColor: alpha(statusColor, 0.16) }}
                  >
                    <span
                      className={classes.avatarIcon}
                      style={{
                        WebkitMaskImage: `url("${mapIcons[mapIconKey(device.category)]}")`,
                        maskImage: `url("${mapIcons[mapIconKey(device.category)]}")`,
                      }}
                    />
                  </div>
                  <div className={classes.headerText}>
                    <Typography className={classes.title}>{device.name}</Typography>
                    <div className={classes.subtitle}>
                      <span
                        className={classes.pill}
                        style={{ color: statusColor, backgroundColor: alpha(statusColor, 0.15) }}
                      >
                        <span className={classes.dot} />
                        {formatStatus(device.status, t)}
                      </span>
                      {driverName && (
                        <span className={classes.driver}>
                          <PersonIcon />
                          {driverName}
                        </span>
                      )}
                    </div>
                  </div>
                  <IconButton size="small" onClick={onClose} onTouchStart={onClose}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </div>
              </CardMedia>
              {position && (
                <>
                  <div className={classes.statusBar}>
                    <div className={classes.seg}>
                      <EngineIcon width={20} height={20} style={{ color: engineColor }} />
                      <span className={classes.segValue} style={{ color: engineColor }}>
                        {engineLabel}
                      </span>
                    </div>
                    <div className={classes.seg}>
                      <NavigationIcon style={{ color: motionColor }} />
                      <span className={classes.segValue} style={{ color: motionColor }}>
                        {motionLabel}
                      </span>
                    </div>
                    <div className={classes.seg}>
                      <SpeedIcon style={{ color: theme.palette.text.secondary }} />
                      <span className={classes.segValue}>{formatSpeed(position.speed, speedUnit, t)}</span>
                    </div>
                    <div className={classes.seg}>
                      <BatteryFullIcon style={{ color: batteryColor }} />
                      <span className={classes.segValue} style={{ color: batteryColor }}>
                        {batteryLevel != null ? `${batteryLevel}%` : '—'}
                      </span>
                    </div>
                  </div>
                  <div className={classes.location}>
                    <div className={classes.locationLabel}>
                      <PlaceIcon />
                      {t('deviceCurrentLocation')}
                    </div>
                    <div className={classes.locationText}>{addressText}</div>
                  </div>
                  <div className={classes.lastLine}>
                    <AccessTimeIcon />
                    <div className={classes.lastText}>
                      <span className={classes.lastLabel}>
                        {`${t('deviceLastReport')}: ${locationTime ? formatTime(locationTime, 'minutes') : '—'}`}
                      </span>
                      {locationTime && (
                        <span className={classes.lastAgo}>{dayjs(locationTime).fromNow()}</span>
                      )}
                    </div>
                    <Link
                      component="button"
                      type="button"
                      onClick={() => setDetailsOpen(true)}
                      className={classes.detailsLink}
                      underline="hover"
                    >
                      {t('sharedShowDetails')}
                    </Link>
                  </div>
                </>
              )}
              <CardActions className={classes.actions} disableSpacing>
                <Tooltip title={t('sharedExtra')}>
                  <IconButton
                    color="secondary"
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    disabled={!position}
                  >
                    <PendingIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('reportReplay')}>
                  <IconButton
                    onClick={() => navigate(`/replay?deviceId=${deviceId}`)}
                    disabled={disableActions || !position}
                  >
                    <RouteIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('commandTitle')}>
                  <IconButton
                    onClick={() => navigate(`/settings/device/${deviceId}/command`)}
                    disabled={disableActions}
                  >
                    <SendIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('sharedEdit')}>
                  <IconButton
                    onClick={() => navigate(`/settings/device/${deviceId}`)}
                    disabled={disableActions || deviceReadonly}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('sharedRemove')}>
                  <IconButton
                    color="error"
                    onClick={() => setRemoving(true)}
                    disabled={disableActions || deviceReadonly}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Rnd>
        )}
      </div>
      {position && (
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
          <MenuItem
            onClick={() => navigate(`/stream?deviceId=${deviceId}`)}
            disabled={position.protocol !== 'jt808'}
          >
            {t('linkLiveVideo')}
          </MenuItem>
          {!readonly && <MenuItem onClick={handleGeofence}>{t('sharedCreateGeofence')}</MenuItem>}
          <MenuItem
            component="a"
            target="_blank"
            href={`https://www.google.com/maps/search/?api=1&query=${position.latitude}%2C${position.longitude}`}
          >
            {t('linkGoogleMaps')}
          </MenuItem>
          <MenuItem
            component="a"
            target="_blank"
            href={`https://maps.apple.com/?ll=${position.latitude},${position.longitude}`}
          >
            {t('linkAppleMaps')}
          </MenuItem>
          <MenuItem
            component="a"
            target="_blank"
            href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${position.latitude}%2C${position.longitude}&heading=${position.course}`}
          >
            {t('linkStreetView')}
          </MenuItem>
          {navigationAppTitle && navigationAppLink && (
            <MenuItem
              component="a"
              target="_blank"
              href={navigationAppLink
                .replace('{latitude}', position.latitude)
                .replace('{longitude}', position.longitude)}
            >
              {navigationAppTitle}
            </MenuItem>
          )}
          {!shareDisabled && !user.temporary && (
            <MenuItem onClick={() => navigate(`/settings/device/${deviceId}/share`)}>
              <Typography color="secondary">{t('sharedShare')}</Typography>
            </MenuItem>
          )}
        </Menu>
      )}
      <RemoveDialog
        open={removing}
        endpoint="devices"
        itemId={deviceId}
        onResult={(removed) => handleRemove(removed)}
      />
      <PositionDrawer
        position={position}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />
    </>
  );
};

export default StatusCard;
