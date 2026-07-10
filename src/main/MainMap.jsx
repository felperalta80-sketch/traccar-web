import { useCallback } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useDispatch, useSelector } from 'react-redux';
import MapView from '../map/core/MapView';
import MapSelectedDevice from '../map/main/MapSelectedDevice';
import MapAccuracy from '../map/main/MapAccuracy';
import MapGeofence from '../map/MapGeofence';
import MapCurrentLocation from '../map/MapCurrentLocation';
import PoiMap from '../map/main/PoiMap';
import MapPadding from '../map/MapPadding';
import { devicesActions } from '../store';
import MapDefaultCamera from '../map/main/MapDefaultCamera';
import MapLiveRoutes from '../map/main/MapLiveRoutes';
import MapPositions from '../map/MapPositions';
import MapOverlay from '../map/overlay/MapOverlay';
import MapScale from '../map/MapScale';
import MapNotification from '../map/control/MapNotification';
import MapLabels from '../map/control/MapLabels';
import useFeatures from '../common/util/useFeatures';
import usePersistedState from '../common/util/usePersistedState';

const MainMap = ({ filteredPositions, selectedPosition, onEventsClick }) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const eventsAvailable = useSelector((state) => !!state.events.items.length);

  const features = useFeatures();

  const [showLabels, setShowLabels] = usePersistedState('mapShowNames', true);

  const onMarkerClick = useCallback(
    (_, deviceId) => {
      dispatch(devicesActions.selectId(deviceId));
    },
    [dispatch],
  );

  return (
    <>
      <MapView>
        <MapOverlay />
        <MapGeofence />
        <MapAccuracy positions={filteredPositions} />
        <MapLiveRoutes deviceIds={filteredPositions.map((p) => p.deviceId)} />
        <MapPositions
          positions={filteredPositions}
          onMarkerClick={onMarkerClick}
          selectedPosition={selectedPosition}
          showStatus
          showLabels={showLabels}
        />
        <MapDefaultCamera filteredPositions={filteredPositions} />
        <MapSelectedDevice />
        <PoiMap />
        <MapLabels enabled={showLabels} onToggle={() => setShowLabels(!showLabels)} />
        {!features.disableEvents && (
          <MapNotification enabled={eventsAvailable} onClick={onEventsClick} />
        )}
      </MapView>
      <MapScale />
      <MapCurrentLocation />
      {desktop && (
        <MapPadding
          start={
            parseInt(theme.dimensions.drawerWidthDesktop, 10) + parseInt(theme.spacing(1.5), 10)
          }
        />
      )}
    </>
  );
};

export default MainMap;
