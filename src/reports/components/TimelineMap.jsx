import { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import MapView from '../../map/core/MapView';
import MapGeofence from '../../map/MapGeofence';
import MapRoutePath from '../../map/MapRoutePath';
import MapMarkers from '../../map/MapMarkers';
import MapPositions from '../../map/MapPositions';
import MapCamera from '../../map/MapCamera';
import MapScale from '../../map/MapScale';
import { useAsyncTask } from '../../reactHelper';
import fetchOrThrow from '../../common/util/fetchOrThrow';

// Mapa de detalle del tramo elegido en la línea de tiempo. Un viaje se dibuja
// como recorrido con marcadores de inicio y fin; una parada, como un punto
// centrado. Las capas son las mismas que usan TripReportPage y StopReportPage.
const TimelineMap = ({ item }) => {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const [route, setRoute] = useState(null);

  const trip = item?.type === 'trip';
  // En el mapa a pantalla completa de mobile los marcadores de inicio/fin
  // quedaban chicos; se agrandan explícitamente. En desktop van al tamaño normal.
  const markerScale = desktop ? undefined : 1.4;

  useAsyncTask(
    async ({ signal }) => {
      if (!trip) {
        setRoute(null);
        return;
      }
      const query = new URLSearchParams({
        deviceId: item.deviceId,
        from: item.startTime,
        to: item.endTime,
      });
      const response = await fetchOrThrow(`/api/reports/route?${query.toString()}`, {
        headers: { Accept: 'application/json' },
        signal,
      });
      setRoute(await response.json());
    },
    [trip, item?.deviceId, item?.startTime, item?.endTime],
  );

  return (
    <>
      <MapView>
        <MapGeofence />
        {trip && route && (
          <>
            <MapRoutePath positions={route} />
            <MapMarkers
              scale={markerScale}
              markers={[
                { latitude: item.startLat, longitude: item.startLon, image: 'start-success' },
                { latitude: item.endLat, longitude: item.endLon, image: 'finish-error' },
              ]}
            />
          </>
        )}
        {item && !trip && (
          <MapPositions
            positions={[
              {
                deviceId: item.deviceId,
                fixTime: item.startTime,
                latitude: item.latitude,
                longitude: item.longitude,
              },
            ]}
            titleField="fixTime"
          />
        )}
      </MapView>
      <MapScale />
      {trip && route?.length > 0 && <MapCamera positions={route} />}
      {item && !trip && <MapCamera latitude={item.latitude} longitude={item.longitude} />}
    </>
  );
};

export default TimelineMap;
