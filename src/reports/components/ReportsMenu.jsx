import { List } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import TimelineIcon from '@mui/icons-material/Timeline';
import PauseCircleFilledIcon from '@mui/icons-material/PauseCircleFilled';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PlaceIcon from '@mui/icons-material/Place';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BarChartIcon from '@mui/icons-material/BarChart';
import RouteIcon from '@mui/icons-material/Route';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import NotesIcon from '@mui/icons-material/Notes';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useAdministrator, useRestriction } from '../../common/util/permissions';
import MenuItem, { MenuSection } from '../../common/components/MenuItem';

const ReportsMenu = () => {
  const t = useTranslation();
  const location = useLocation();

  const admin = useAdministrator();
  const readonly = useRestriction('readonly');

  const buildLink = (path) => {
    const sourceParams = new URLSearchParams(location.search);
    const deviceIds = sourceParams.getAll('deviceId');
    const groupIds = sourceParams.getAll('groupId');
    if (!deviceIds.length && !groupIds.length) {
      return path;
    }
    const params = new URLSearchParams();
    if (
      path === '/reports/chart' ||
      path === '/reports/route' ||
      path === '/reports/timeline' ||
      path === '/replay'
    ) {
      const [firstDeviceId] = deviceIds;
      if (firstDeviceId != null) {
        params.append('deviceId', firstDeviceId);
      }
    } else {
      deviceIds.forEach((deviceId) => params.append('deviceId', deviceId));
      groupIds.forEach((groupId) => params.append('groupId', groupId));
    }
    const search = params.toString();
    return search ? `${path}?${search}` : path;
  };

  return (
    <>
      <List>
        <MenuSection>{t('reportTitle')}</MenuSection>
        <MenuItem
          title={t('reportCombined')}
          subtitle={t('reportCombinedDesc')}
          link={buildLink('/reports/combined')}
          icon={<StarIcon />}
          selected={location.pathname === '/reports/combined'}
        />
        <MenuItem
          title={t('reportEvents')}
          subtitle={t('reportEventsDesc')}
          link={buildLink('/reports/events')}
          icon={<NotificationsActiveIcon />}
          selected={location.pathname === '/reports/events'}
        />
        <MenuItem
          title={t('sharedGeofences')}
          subtitle={t('reportGeofencesDesc')}
          link={buildLink('/reports/geofences')}
          icon={<PlaceIcon />}
          selected={location.pathname === '/reports/geofences'}
        />
        <MenuItem
          title={t('reportTrips')}
          subtitle={t('reportTripsDesc')}
          link={buildLink('/reports/trips')}
          icon={<PlayCircleFilledIcon />}
          selected={location.pathname === '/reports/trips'}
        />
        <MenuItem
          title={t('reportStops')}
          subtitle={t('reportStopsDesc')}
          link={buildLink('/reports/stops')}
          icon={<PauseCircleFilledIcon />}
          selected={location.pathname === '/reports/stops'}
        />
        <MenuItem
          title={t('reportSummary')}
          subtitle={t('reportSummaryDesc')}
          link={buildLink('/reports/summary')}
          icon={<FormatListBulletedIcon />}
          selected={location.pathname === '/reports/summary'}
        />
        <MenuItem
          title={t('reportDayTimeline')}
          subtitle={t('reportDayTimelineDesc')}
          link={buildLink('/reports/timeline')}
          icon={<ScheduleIcon />}
          selected={location.pathname === '/reports/timeline'}
        />
        <MenuItem
          title={t('reportChart')}
          subtitle={t('reportChartDesc')}
          link={buildLink('/reports/chart')}
          icon={<TrendingUpIcon />}
          selected={location.pathname === '/reports/chart'}
        />
        <MenuItem
          title={t('reportReplay')}
          subtitle={t('reportReplayDesc')}
          link={buildLink('/replay')}
          icon={<RouteIcon />}
        />
        <MenuItem
          title={t('reportPositions')}
          subtitle={t('reportPositionsDesc')}
          link={buildLink('/reports/route')}
          icon={<TimelineIcon />}
          selected={location.pathname === '/reports/route'}
        />
        <MenuSection>{t('sharedTools')}</MenuSection>
        <MenuItem
          title={t('sharedLogs')}
          subtitle={t('reportLogsDesc')}
          link="/reports/logs"
          icon={<NotesIcon />}
          selected={location.pathname === '/reports/logs'}
        />
        {!readonly && (
          <MenuItem
            title={t('reportScheduled')}
            subtitle={t('reportScheduledDesc')}
            link="/reports/scheduled"
            icon={<EventRepeatIcon />}
            selected={location.pathname === '/reports/scheduled'}
          />
        )}
        {admin && (
          <MenuItem
            title={t('statisticsTitle')}
            subtitle={t('reportStatisticsDesc')}
            link="/reports/statistics"
            icon={<BarChartIcon />}
            selected={location.pathname === '/reports/statistics'}
          />
        )}
        {admin && (
          <MenuItem
            title={t('reportAudit')}
            subtitle={t('reportAuditDesc')}
            link="/reports/audit"
            icon={<VerifiedUserIcon />}
            selected={location.pathname === '/reports/audit'}
          />
        )}
      </List>
    </>
  );
};

export default ReportsMenu;
