import { List } from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import DrawIcon from '@mui/icons-material/Draw';
import NotificationsIcon from '@mui/icons-material/Notifications';
import FolderIcon from '@mui/icons-material/Folder';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import BuildIcon from '@mui/icons-material/Build';
import PeopleIcon from '@mui/icons-material/People';
import TodayIcon from '@mui/icons-material/Today';
import SendIcon from '@mui/icons-material/Send';
import DnsIcon from '@mui/icons-material/Dns';
import HelpIcon from '@mui/icons-material/Help';
import PaymentIcon from '@mui/icons-material/Payment';
import CampaignIcon from '@mui/icons-material/Campaign';
import CalculateIcon from '@mui/icons-material/Calculate';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useAdministrator, useManager, useRestriction } from '../../common/util/permissions';
import useFeatures from '../../common/util/useFeatures';
import MenuItem, { MenuSection } from '../../common/components/MenuItem';

const SettingsMenu = () => {
  const t = useTranslation();
  const location = useLocation();

  const readonly = useRestriction('readonly');
  const admin = useAdministrator();
  const manager = useManager();
  const userId = useSelector((state) => state.session.user.id);
  const supportLink = useSelector((state) => state.session.server.attributes.support);
  const billingLink = useSelector((state) => state.session.user.attributes.billingLink);

  const features = useFeatures();

  return (
    <>
      <List>
        <MenuSection>{t('sharedGeneral')}</MenuSection>
        <MenuItem
          title={t('sharedPreferences')}
          subtitle={t('settingsPreferencesDesc')}
          link="/settings/preferences"
          icon={<TuneIcon />}
          selected={location.pathname === '/settings/preferences'}
        />
        {!readonly && (
          <>
            <MenuItem
              title={t('sharedNotifications')}
              subtitle={t('settingsNotificationsDesc')}
              link="/settings/notifications"
              icon={<NotificationsIcon />}
              selected={location.pathname.startsWith('/settings/notification')}
            />
            <MenuItem
              title={t('settingsUser')}
              subtitle={t('settingsUserDesc')}
              link={`/settings/user/${userId}`}
              icon={<PersonIcon />}
              selected={location.pathname === `/settings/user/${userId}`}
            />
            {admin && (
              <MenuItem
                title={t('deviceTitle')}
                subtitle={t('settingsDevicesDesc')}
                link="/settings/devices"
                icon={<DnsIcon />}
                selected={location.pathname.startsWith('/settings/device')}
              />
            )}
            <MenuItem
              title={t('sharedGeofences')}
              subtitle={t('settingsGeofencesDesc')}
              link="/geofences"
              icon={<DrawIcon />}
              selected={location.pathname.startsWith('/settings/geofence')}
            />
            {!features.disableGroups && (
              <MenuItem
                title={t('settingsGroups')}
                subtitle={t('settingsGroupsDesc')}
                link="/settings/groups"
                icon={<FolderIcon />}
                selected={location.pathname.startsWith('/settings/group')}
              />
            )}
            {!features.disableDrivers && (
              <MenuItem
                title={t('sharedDrivers')}
                subtitle={t('settingsDriversDesc')}
                link="/settings/drivers"
                icon={<PersonIcon />}
                selected={location.pathname.startsWith('/settings/driver')}
              />
            )}
            {!features.disableCalendars && (
              <MenuItem
                title={t('sharedCalendars')}
                subtitle={t('settingsCalendarsDesc')}
                link="/settings/calendars"
                icon={<TodayIcon />}
                selected={location.pathname.startsWith('/settings/calendar')}
              />
            )}
            {!features.disableComputedAttributes && (
              <MenuItem
                title={t('sharedComputedAttributes')}
                subtitle={t('settingsAttributesDesc')}
                link="/settings/attributes"
                icon={<CalculateIcon />}
                selected={location.pathname.startsWith('/settings/attribute')}
              />
            )}
            {!features.disableMaintenance && (
              <MenuItem
                title={t('sharedMaintenance')}
                subtitle={t('settingsMaintenanceDesc')}
                link="/settings/maintenances"
                icon={<BuildIcon />}
                selected={location.pathname.startsWith('/settings/maintenance')}
              />
            )}
            {!features.disableSavedCommands && (
              <MenuItem
                title={t('sharedSavedCommands')}
                subtitle={t('settingsCommandsDesc')}
                link="/settings/commands"
                icon={<SendIcon />}
                selected={location.pathname.startsWith('/settings/command')}
              />
            )}
          </>
        )}
        {billingLink && (
          <MenuItem
            title={t('userBilling')}
            subtitle={t('settingsBillingDesc')}
            link={billingLink}
            icon={<PaymentIcon />}
          />
        )}
        {supportLink && (
          <MenuItem
            title={t('settingsSupport')}
            subtitle={t('settingsSupportDesc')}
            link={supportLink}
            icon={<HelpIcon />}
          />
        )}
        {manager && (
          <>
            <MenuSection>{t('sharedAdministration')}</MenuSection>
            <MenuItem
              title={t('serverAnnouncement')}
              subtitle={t('settingsAnnouncementDesc')}
              link="/settings/announcement"
              icon={<CampaignIcon />}
              selected={location.pathname === '/settings/announcement'}
            />
            {admin && (
              <MenuItem
                title={t('settingsServer')}
                subtitle={t('settingsServerDesc')}
                link="/settings/server"
                icon={<SettingsIcon />}
                selected={location.pathname === '/settings/server'}
              />
            )}
            <MenuItem
              title={t('settingsUsers')}
              subtitle={t('settingsUsersDesc')}
              link="/settings/users"
              icon={<PeopleIcon />}
              selected={
                location.pathname.startsWith('/settings/user') &&
                location.pathname !== `/settings/user/${userId}`
              }
            />
          </>
        )}
      </List>
    </>
  );
};

export default SettingsMenu;
