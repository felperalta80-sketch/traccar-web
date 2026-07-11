import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { Table, TableBody, TableCell, TableHead, TableRow, useMediaQuery } from '@mui/material';
import ReportFilter from './components/ReportFilter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import ReportCards from './components/ReportCards';
import ResizeHandle from './components/ResizeHandle';
import { useCatchCallback } from '../reactHelper';
import MapView from '../map/core/MapView';
import useReportStyles from './common/useReportStyles';
import TableShimmer from '../common/components/TableShimmer';
import MapCamera from '../map/MapCamera';
import MapGeofence from '../map/MapGeofence';
import { formatTime, getStatusColor } from '../common/util/formatter';
import { prefixString } from '../common/util/stringUtils';
import MapMarkers from '../map/MapMarkers';
import MapRouteCoordinates from '../map/MapRouteCoordinates';
import MapScale from '../map/MapScale';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { deviceEquality } from '../common/util/deviceEquality';

const columnsArray = [
  ['eventTime', 'positionFixTime'],
  ['type', 'sharedType'],
];
const columnsMap = new Map(columnsArray);

const CombinedReportPage = () => {
  const { classes } = useReportStyles();
  const t = useTranslation();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const devices = useSelector((state) => state.devices.items, deviceEquality(['id', 'name']));

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const formatValue = (event, key) => {
    switch (key) {
      case 'eventTime':
        return formatTime(event.eventTime, 'seconds');
      case 'type':
        return t(prefixString('event', event.type));
      default:
        return event[key];
    }
  };

  const eventColor = (event) => {
    switch (event.type) {
      case 'alarm':
        return theme.palette.error.main;
      case 'deviceOverspeed':
      case 'deviceFuelDrop':
        return theme.palette.warning.main;
      case 'deviceOnline':
      case 'ignitionOn':
      case 'deviceMoving':
      case 'geofenceEnter':
        return theme.palette.success.main;
      case 'deviceOffline':
      case 'ignitionOff':
      case 'deviceStopped':
      case 'geofenceExit':
        return theme.palette.neutral.main;
      default:
        return theme.palette.primary.main;
    }
  };

  const itemsCoordinates = useMemo(() => items.flatMap((item) => item.route), [items]);

  const createMarkers = () =>
    items.flatMap((item) =>
      item.events
        .map((event) => item.positions.find((p) => event.positionId === p.id))
        .filter((position) => position != null)
        .map((position) => ({
          latitude: position.latitude,
          longitude: position.longitude,
        })),
    );

  const onShow = useCatchCallback(async ({ deviceIds, groupIds, from, to }) => {
    const query = new URLSearchParams({ from, to });
    deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
    groupIds.forEach((groupId) => query.append('groupId', groupId));
    setLoading(true);
    try {
      const response = await fetchOrThrow(`/api/reports/combined?${query.toString()}`);
      setItems(await response.json());
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportCombined']}>
      <div className={classes.container}>
        {Boolean(items.length) && (
          <>
            <div className={classes.containerMap}>
              <MapView>
                <MapGeofence />
                {items.map((item) => (
                  <MapRouteCoordinates
                    key={item.deviceId}
                    name={devices[item.deviceId].name}
                    coordinates={item.route}
                    deviceId={item.deviceId}
                  />
                ))}
                <MapMarkers markers={createMarkers()} />
              </MapView>
              <MapScale />
              <MapCamera coordinates={itemsCoordinates} />
            </div>
            <ResizeHandle />
          </>
        )}
        <div className={classes.containerMain}>
          <div className={classes.header}>
            <ReportFilter onShow={onShow} deviceType="multiple" loading={loading} />
          </div>
          {desktop ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('sharedDevice')}</TableCell>
                  <TableCell>{t('positionFixTime')}</TableCell>
                  <TableCell>{t('sharedType')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading ? (
                  items.flatMap((item) =>
                    item.events.map((event, index) => (
                      <TableRow key={event.id}>
                        <TableCell>{index ? '' : devices[item.deviceId].name}</TableCell>
                        <TableCell>{formatTime(event.eventTime, 'seconds')}</TableCell>
                        <TableCell>{t(prefixString('event', event.type))}</TableCell>
                      </TableRow>
                    )),
                  )
                ) : (
                  <TableShimmer columns={3} />
                )}
              </TableBody>
            </Table>
          ) : (
            <ReportCards
              items={items.flatMap((item) =>
                item.events.map((event) => ({ ...event, deviceId: item.deviceId })),
              )}
              columns={['eventTime', 'type']}
              columnsMap={columnsMap}
              formatValue={formatValue}
              rowName={(event) => devices[event.deviceId]?.name || event.deviceId}
              rowKey={(event) => event.id}
              rowColor={(event) =>
                devices[event.deviceId]
                  ? theme.palette[getStatusColor(devices[event.deviceId].status)].main
                  : theme.palette.primary.main
              }
              chipColumns={['type']}
              chipColor={eventColor}
              loading={loading}
            />
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default CombinedReportPage;
