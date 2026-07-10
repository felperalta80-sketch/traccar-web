import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Paper, BottomNavigation, BottomNavigationAction, Badge } from '@mui/material';
import { alpha } from '@mui/material/styles';

import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import FormatListBulletedOutlinedIcon from '@mui/icons-material/FormatListBulletedOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import LogoutIcon from '@mui/icons-material/Logout';

import { devicesActions } from '../../store';
import { useTranslation } from './LocalizationProvider';
import { useRestriction } from '../util/permissions';
import useLogout from '../util/useLogout';

const BottomMenu = ({ floating = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const t = useTranslation();
  const logout = useLogout();

  const readonly = useRestriction('readonly');
  const disableReports = useRestriction('disableReports');
  const devicesOpen = useSelector((state) => state.devices.panelOpen);
  const user = useSelector((state) => state.session.user);
  const socket = useSelector((state) => state.session.socket);

  const currentSelection = () => {
    if (location.pathname === '/account' || location.pathname === `/settings/user/${user.id}`) {
      return 'account';
    }
    if (location.pathname.startsWith('/settings')) {
      return 'settings';
    }
    if (location.pathname.startsWith('/reports')) {
      return 'reports';
    }
    if (location.pathname === '/') {
      return devicesOpen ? 'list' : 'map';
    }
    return null;
  };

  const handleSelection = (event, value) => {
    switch (value) {
      case 'list':
        dispatch(devicesActions.setPanelOpen(true));
        navigate('/');
        break;
      case 'map':
        dispatch(devicesActions.setPanelOpen(false));
        navigate('/');
        break;
      case 'reports':
        navigate('/reports');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'account':
        navigate('/account');
        break;
      case 'logout':
        logout();
        break;
      default:
        break;
    }
  };

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        // Fondo neutral (un toque más oscuro que el blanco) en modo claro;
        // en oscuro se mantiene el paper del theme.
        backgroundColor: theme.palette.mode === 'light' ? '#E8EAEE' : undefined,
        ...(floating
          ? { borderRadius: theme.spacing(2), overflow: 'hidden', boxShadow: 6 }
          : {
              borderTop: 1,
              borderColor: 'divider',
              // En mobile la barra queda pegada al borde inferior; una línea
              // muy sutil abajo la separa de los botones del sistema del teléfono.
              [theme.breakpoints.down('md')]: {
                borderBottom: `1px solid ${
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.045)'
                }`,
              },
            }),
      })}
    >
      <BottomNavigation
        value={currentSelection()}
        onChange={handleSelection}
        showLabels
        sx={(theme) => ({
          height: 'auto',
          px: 1.25,
          py: 1,
          gap: 0.5,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 0,
            padding: theme.spacing(0.75, 0.5),
            borderRadius: theme.spacing(1.5),
          },
          '& .MuiBottomNavigationAction-root.Mui-selected': {
            backgroundColor: alpha(theme.palette.primary.main, 0.12),
          },
          // El label del ítem seleccionado no crece (MUI lo pasa de 12→14px):
          // ese cambio de altura causaba un pestañeo al cambiar de módulo.
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.75rem',
            '&.Mui-selected': {
              fontSize: '0.75rem',
            },
          },
        })}
      >
        <BottomNavigationAction
          label={t('mapTitle')}
          icon={
            <Badge color="error" variant="dot" overlap="circular" invisible={socket !== false}>
              <MapOutlinedIcon />
            </Badge>
          }
          value="map"
        />
        <BottomNavigationAction
          label={t('sharedList')}
          icon={<FormatListBulletedOutlinedIcon />}
          value="list"
        />
        {!disableReports && (
          <BottomNavigationAction
            label={t('reportTitle')}
            icon={<AssessmentOutlinedIcon />}
            value="reports"
          />
        )}
        {!readonly && (
          <BottomNavigationAction
            label={t('settingsTitle')}
            icon={<SettingsOutlinedIcon />}
            value="settings"
          />
        )}
        {readonly ? (
          <BottomNavigationAction label={t('loginLogout')} icon={<LogoutIcon />} value="logout" />
        ) : (
          <BottomNavigationAction
            label={t('settingsUser')}
            icon={<AccountCircleOutlinedIcon />}
            value="account"
          />
        )}
      </BottomNavigation>
    </Paper>
  );
};

export default BottomMenu;
