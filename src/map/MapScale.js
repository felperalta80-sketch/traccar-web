import maplibregl from 'maplibre-gl';
import { useEffect, useMemo } from 'react';
import { useTheme } from '@mui/material';
import { useAttributePreference } from '../common/util/preferences';
import { map } from './core/MapView';

const MapScale = ({ position }) => {
  const theme = useTheme();

  const distanceUnit = useAttributePreference('distanceUnit');

  const control = useMemo(() => new maplibregl.ScaleControl(), []);

  useEffect(() => {
    const anchor = position || (theme.direction === 'rtl' ? 'bottom-right' : 'bottom-left');
    map.addControl(control, anchor);
    return () => map.removeControl(control);
  }, [control, theme.direction, position]);

  useEffect(() => {
    switch (distanceUnit) {
      case 'mi':
        control.setUnit('imperial');
        break;
      case 'nmi':
        control.setUnit('nautical');
        break;
      case 'km':
      default:
        control.setUnit('metric');
        break;
    }
  }, [control, distanceUnit]);

  return null;
};

export default MapScale;
