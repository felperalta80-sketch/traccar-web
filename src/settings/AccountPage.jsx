import { List, Button } from '@mui/material';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import { useSelector } from 'react-redux';
import ModuleMenuLayout from '../common/components/ModuleMenuLayout';
import MenuItem from '../common/components/MenuItem';
import { useTranslation } from '../common/components/LocalizationProvider';
import useLogout from '../common/util/useLogout';

// Módulo Cuenta: mismas líneas que Ajustes/Reportes, con "Configuración" y un
// botón de cerrar sesión al pie de la sección.
const AccountPage = () => {
  const t = useTranslation();
  const logout = useLogout();

  const userId = useSelector((state) => state.session.user.id);

  return (
    <ModuleMenuLayout
      title="settingsUser"
      footer={
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={logout}
        >
          {t('loginLogout')}
        </Button>
      }
    >
      <List>
        <MenuItem
          title={t('sharedConfiguration')}
          subtitle={t('accountConfigurationDesc')}
          link={`/settings/user/${userId}`}
          icon={<SettingsOutlinedIcon />}
        />
      </List>
    </ModuleMenuLayout>
  );
};

export default AccountPage;
