import { useId, useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { map } from './core/MapView';
import { formatTime, getStatusColor } from '../common/util/formatter';
import { mapIconKey } from './core/preloadImages';
import { useAttributePreference } from '../common/util/preferences';
import { useCatchCallback } from '../reactHelper';
import {
  buildLabelImage,
  findFonts,
  fromMapCoordinates,
  toMapCoordinates,
} from './core/mapUtil';

const MapPositions = ({
  positions,
  onMapClick,
  onMarkerClick,
  showStatus,
  selectedPosition,
  titleField,
  disabled,
  showLabels = true,
}) => {
  const id = useId();
  const clusters = `${id}-clusters`;
  const selected = `${id}-selected`;

  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const iconScale = useAttributePreference('iconScale', desktop ? 0.75 : 1);

  const devices = useSelector((state) => state.devices.items);
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);

  const mapCluster = useAttributePreference('mapCluster', true);
  const directionType = useAttributePreference('mapDirection', 'selected');

  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  const showLabelsRef = useRef(showLabels);
  showLabelsRef.current = showLabels;

  const createFeature = useCallback(
    (devices, position) => {
      const device = devices[position.deviceId];
      let showDirection;
      switch (directionType) {
        case 'none':
          showDirection = false;
          break;
        case 'all':
          showDirection = position.course > 0;
          break;
        default:
          showDirection = position.course > 0;
          break;
      }
      const rawTitle =
        titleField === 'fixTime' ? formatTime(position.fixTime, 'seconds') : device.name;
      const label = rawTitle && rawTitle.length > 20 ? `${rawTitle.slice(0, 20)}…` : rawTitle;
      return {
        id: position.id,
        deviceId: position.deviceId,
        name: device.name,
        fixTime: formatTime(position.fixTime, 'seconds'),
        category: mapIconKey(device.category),
        color: showStatus ? position.attributes.color || getStatusColor(device.status) : 'neutral',
        rotation: position.course,
        direction: showDirection,
        moving: position.speed > 0,
        label,
        labelKey: `label:${label}`,
      };
    },
    [directionType, showStatus, titleField],
  );

  const onMouseEnter = () => (map.getCanvas().style.cursor = 'pointer');
  const onMouseLeave = () => (map.getCanvas().style.cursor = '');

  const onMapClickCallback = useCallback(
    (event) => {
      if (!event.defaultPrevented && onMapClick) {
        const [longitude, latitude] = fromMapCoordinates(event.lngLat.lng, event.lngLat.lat);
        onMapClick(latitude, longitude);
      }
    },
    [onMapClick],
  );

  const onMarkerClickCallback = useCallback(
    (event) => {
      if (disabledRef.current) return;
      event.preventDefault();
      const feature = event.features[0];
      if (onMarkerClick) {
        onMarkerClick(feature.properties.id, feature.properties.deviceId);
      }
    },
    [onMarkerClick],
  );

  const onClusterClick = useCatchCallback(
    async (event) => {
      if (disabledRef.current) return;
      event.preventDefault();
      const features = map.queryRenderedFeatures(event.point, {
        layers: [clusters],
      });
      const clusterId = features[0].properties.cluster_id;
      const zoom = await map.getSource(id).getClusterExpansionZoom(clusterId);
      map.easeTo({
        center: features[0].geometry.coordinates,
        zoom,
      });
    },
    [clusters, id],
  );

  useEffect(() => {
    map.addSource(id, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
      cluster: mapCluster,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    });
    map.addSource(selected, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });
    [id, selected].forEach((source) => {
      map.addLayer({
        id: `${source}-pulse`,
        type: 'symbol',
        source,
        filter: ['all', ['!has', 'point_count'], ['==', 'color', 'success'], ['==', 'moving', true]],
        layout: {
          'icon-image': 'pulse',
          'icon-size': iconScale,
          'icon-allow-overlap': true,
        },
      });
      map.addLayer({
        id: `${source}-label`,
        type: 'symbol',
        source,
        filter: ['!has', 'point_count'],
        layout: {
          visibility: showLabelsRef.current ? 'visible' : 'none',
          'icon-image': ['get', 'labelKey'],
          'icon-allow-overlap': true,
          'icon-anchor': 'bottom',
          'icon-offset': [0, -24],
          'symbol-z-order': 'source',
        },
      });
      map.addLayer({
        id: `direction-${source}`,
        type: 'symbol',
        source,
        filter: ['all', ['!has', 'point_count'], ['==', 'direction', true]],
        layout: {
          'icon-image': 'direction-{color}',
          'icon-size': iconScale,
          'icon-allow-overlap': true,
          'icon-rotate': ['get', 'rotation'],
          'icon-rotation-alignment': 'map',
          'symbol-z-order': 'source',
        },
      });
      map.addLayer({
        id: source,
        type: 'symbol',
        source,
        filter: ['!has', 'point_count'],
        layout: {
          'icon-image': '{category}-{color}',
          'icon-size': iconScale,
          'icon-allow-overlap': true,
          'symbol-z-order': 'source',
        },
      });
      map.on('mouseenter', source, onMouseEnter);
      map.on('mouseleave', source, onMouseLeave);
      map.on('click', source, onMarkerClickCallback);

      map.on('mouseenter', `${source}-label`, onMouseEnter);
      map.on('mouseleave', `${source}-label`, onMouseLeave);
      map.on('click', `${source}-label`, onMarkerClickCallback);
    });
    map.addLayer({
      id: clusters,
      type: 'circle',
      source: id,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#1C2536',
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          16,
          10, 20,
          50, 26,
        ],
        'circle-stroke-width': 3,
        'circle-stroke-color': '#FFFFFF',
        'circle-stroke-opacity': 0.9,
      },
    });
    map.addLayer({
      id: `${clusters}-count`,
      type: 'symbol',
      source: id,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': findFonts(map),
        'text-size': 14,
      },
      paint: {
        'text-color': '#FFFFFF',
      },
    });

    map.on('mouseenter', clusters, onMouseEnter);
    map.on('mouseleave', clusters, onMouseLeave);
    map.on('click', clusters, onClusterClick);
    map.on('click', onMapClickCallback);

    return () => {
      map.off('mouseenter', clusters, onMouseEnter);
      map.off('mouseleave', clusters, onMouseLeave);
      map.off('click', clusters, onClusterClick);
      map.off('click', onMapClickCallback);

      if (map.getLayer(`${clusters}-count`)) {
        map.removeLayer(`${clusters}-count`);
      }
      if (map.getLayer(clusters)) {
        map.removeLayer(clusters);
      }

      [id, selected].forEach((source) => {
        map.off('mouseenter', source, onMouseEnter);
        map.off('mouseleave', source, onMouseLeave);
        map.off('click', source, onMarkerClickCallback);

        map.off('mouseenter', `${source}-label`, onMouseEnter);
        map.off('mouseleave', `${source}-label`, onMouseLeave);
        map.off('click', `${source}-label`, onMarkerClickCallback);

        if (map.getLayer(`${source}-label`)) {
          map.removeLayer(`${source}-label`);
        }
        if (map.getLayer(source)) {
          map.removeLayer(source);
        }
        if (map.getLayer(`direction-${source}`)) {
          map.removeLayer(`direction-${source}`);
        }
        if (map.getLayer(`${source}-pulse`)) {
          map.removeLayer(`${source}-pulse`);
        }
        if (map.getSource(source)) {
          map.removeSource(source);
        }
      });
    };
  }, [
    mapCluster,
    clusters,
    onMarkerClickCallback,
    onClusterClick,
    onMapClickCallback,
    iconScale,
    id,
    selected,
    titleField,
  ]);

  useEffect(() => {
    [id, selected].forEach((source) => {
      const features = positions
        .filter((it) => devices.hasOwnProperty(it.deviceId))
        .filter((it) =>
          source === id ? it.deviceId !== selectedDeviceId : it.deviceId === selectedDeviceId,
        )
        .map((position) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: toMapCoordinates(position.longitude, position.latitude),
          },
          properties: createFeature(devices, position),
        }));
      // Genera (una sola vez, cacheado por hasImage) la imagen horneada de cada
      // label que aparezca, para poder usarla como icon-image del pill.
      features.forEach((feature) => {
        const key = feature.properties.labelKey;
        if (key && feature.properties.label && !map.hasImage(key)) {
          map.addImage(key, buildLabelImage(feature.properties.label), {
            pixelRatio: window.devicePixelRatio,
          });
        }
      });
      map.getSource(source)?.setData({ type: 'FeatureCollection', features });
    });
  }, [
    mapCluster,
    clusters,
    onMarkerClick,
    onClusterClick,
    devices,
    positions,
    selectedPosition,
    createFeature,
    id,
    selected,
    selectedDeviceId,
  ]);

  useEffect(() => {
    [id, selected].forEach((source) => {
      if (map.getLayer(`${source}-label`)) {
        map.setLayoutProperty(`${source}-label`, 'visibility', showLabels ? 'visible' : 'none');
      }
    });
  }, [showLabels, id, selected]);

  return null;
};

export default MapPositions;
