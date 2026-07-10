import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import { googleProtocol } from 'maplibre-google-maps';
import { Protocol } from 'pmtiles';
import { useRef, useLayoutEffect, useEffect, useState, useMemo } from 'react';
import { useTheme, GlobalStyles } from '@mui/material';
import MapSwitcher from '../control/MapSwitcher';
import { useAttributePreference, usePreference } from '../../common/util/preferences';
import usePersistedState from '../../common/util/usePersistedState';
import { mapImages } from './preloadImages';
import { preparePin } from './mapUtil';
import useMapStyles from './useMapStyles';
import { useAsyncTask } from '../../reactHelper';

const element = document.createElement('div');
element.style.width = '100%';
element.style.height = '100%';
element.style.boxSizing = 'initial';

maplibregl.addProtocol('google', googleProtocol);
maplibregl.addProtocol('pmtiles', new Protocol().tile);

// Ícono Material como data URI (para reemplazar los del NavigationControl).
const navIcon = (path) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23333333'%3E%3Cpath d='${path.replace(
    / /g,
    '%20',
  )}'/%3E%3C/svg%3E")`;

// Estilo Ubimax para los botones del mapa: tarjetas redondeadas tipo píldora,
// con separadores entre botones agrupados e íconos Material.
const mapControlStyles = {
  '.maplibregl-ctrl-group': {
    borderRadius: '8px !important',
    background: '#fff',
    border: '1px solid rgba(28, 37, 54, 0.06)',
    boxShadow: '0 2px 4px rgba(28, 37, 54, 0.22), 0 6px 18px rgba(28, 37, 54, 0.24) !important',
    overflow: 'hidden',
  },
  '.maplibregl-ctrl-group button': {
    width: '29px !important',
    height: '29px !important',
  },
  '.maplibregl-ctrl-group button + button': {
    borderTop: '1px solid rgba(28, 37, 54, 0.08)',
  },
  '.maplibregl-ctrl-group button:hover': {
    backgroundColor: 'rgba(28, 37, 54, 0.05)',
  },
  '.maplibregl-ctrl-group button svg': {
    width: '18px',
    height: '18px',
  },
  '.maplibregl-ctrl-zoom-in .maplibregl-ctrl-icon': {
    backgroundImage: `${navIcon('M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z')} !important`,
    backgroundSize: '18px',
  },
  '.maplibregl-ctrl-zoom-out .maplibregl-ctrl-icon': {
    backgroundImage: `${navIcon('M19 13H5v-2h14z')} !important`,
    backgroundSize: '18px',
  },
  '.maplibregl-ctrl-compass .maplibregl-ctrl-icon': {
    backgroundImage: `${navIcon('M12 2 4.5 20.29l.71.71L12 18l6.79 3 .71-.71z')} !important`,
    backgroundSize: '19px',
  },
};

export const map = new maplibregl.Map({
  container: element,
  attributionControl: false,
  fadeDuration: 0,
});

let ready = false;
const readyListeners = new Set();

const addReadyListener = (listener) => {
  readyListeners.add(listener);
  listener(ready);
};

const removeReadyListener = (listener) => {
  readyListeners.delete(listener);
};

const updateReadyValue = (value) => {
  ready = value;
  readyListeners.forEach((listener) => listener(value));
};

const initMap = async () => {
  if (ready) return;
  if (!map.hasImage('background')) {
    Object.entries(mapImages).forEach(([key, value]) => {
      if (typeof value.render === 'function') {
        map.addImage(key, value, { pixelRatio: 1 });
      } else {
        map.addImage(key, value, {
          pixelRatio: window.devicePixelRatio,
        });
      }
    });
  }
};

const MapView = ({ children }) => {
  const theme = useTheme();

  const containerRef = useRef(null);

  const [mapReady, setMapReady] = useState(false);

  const mapStyles = useMapStyles();
  const activeMapStyles = useAttributePreference(
    'activeMapStyles',
    'locationIqStreets,locationIqDark,openFreeMap',
  );
  const [selectedStyleId, setSelectedStyleId] = usePersistedState(
    'selectedMapStyle',
    usePreference('map', 'locationIqStreets'),
  );
  const mapboxAccessToken = useAttributePreference('mapboxAccessToken');
  const maxZoom = useAttributePreference('web.maxZoom');

  const styles = useMemo(() => {
    const filtered = mapStyles.filter((s) => s.available && activeMapStyles.includes(s.id));
    return filtered.length ? filtered : mapStyles.filter((s) => s.id === 'osm');
  }, [mapStyles, activeMapStyles]);

  useAsyncTask(async () => {
    if (theme.direction === 'rtl') {
      maplibregl.setRTLTextPlugin('/mapbox-gl-rtl-text.js');
    }
  }, [theme.direction]);

  useEffect(() => {
    const attribution = new maplibregl.AttributionControl({ compact: true });
    const navigation = new maplibregl.NavigationControl();
    map.addControl(attribution, theme.direction === 'rtl' ? 'bottom-left' : 'bottom-right');
    map.addControl(navigation, theme.direction === 'rtl' ? 'top-left' : 'top-right');
    return () => {
      map.removeControl(navigation);
      map.removeControl(attribution);
    };
  }, [theme.direction]);

  useEffect(() => {
    if (maxZoom) {
      map.setMaxZoom(maxZoom);
    }
  }, [maxZoom]);

  // Pin del recorrido: se hornea con el color primary (branding del servidor),
  // no hardcodeado. Se re-hornea al cambiar el branding o recargar el estilo
  // (el estilo limpia las imágenes, por eso depende de mapReady).
  useEffect(() => {
    if (!mapReady) {
      return;
    }
    const image = preparePin(theme.palette.primary.main);
    if (map.hasImage('pin')) {
      map.updateImage('pin', image);
    } else {
      map.addImage('pin', image, { pixelRatio: window.devicePixelRatio });
    }
  }, [mapReady, theme.palette.primary.main]);

  useEffect(() => {
    maplibregl.accessToken = mapboxAccessToken;
  }, [mapboxAccessToken]);

  useEffect(() => {
    const style = styles.find((s) => s.id === selectedStyleId);
    if (!style) {
      setSelectedStyleId(styles[0].id);
      return;
    }
    updateReadyValue(false);
    map.coordinateSystem = style.coordinateSystem;
    map.setStyle(style.style, { diff: false });
    map.setTransformRequest(style.transformRequest);
    let timeoutId;
    const waiting = () => {
      if (!map.loaded()) {
        timeoutId = setTimeout(waiting, 33);
      } else {
        initMap();
        updateReadyValue(true);
      }
    };
    map.once('styledata', waiting);
    return () => clearTimeout(timeoutId);
  }, [styles, selectedStyleId, setSelectedStyleId]);

  useEffect(() => {
    const listener = (ready) => setMapReady(ready);
    addReadyListener(listener);
    return () => {
      removeReadyListener(listener);
    };
  }, []);

  useLayoutEffect(() => {
    const currentEl = containerRef.current;
    currentEl.appendChild(element);
    map.resize();
    return () => {
      // `element` es un singleton a nivel de módulo: si otro MapView ya lo
      // adoptó (transición entre una ruta con mapa persistente y otra con mapa
      // propio) puede haber sido movido, así que solo lo quitamos si sigue aquí.
      if (element.parentNode === currentEl) {
        currentEl.removeChild(element);
      }
    };
  }, [containerRef]);

  return (
    <div style={{ width: '100%', height: '100%' }} ref={containerRef}>
      <GlobalStyles styles={mapControlStyles} />
      <MapSwitcher styles={styles} selectedId={selectedStyleId} onSelect={setSelectedStyleId} />
      {mapReady && children}
    </div>
  );
};

export default MapView;
