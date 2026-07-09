import { parse, stringify } from 'wellknown';
import turfCircle from '@turf/circle';
import gcoord from 'gcoord';
import { map } from './MapView';

const coordinateSystem = (id) => {
  switch (id) {
    case 'gcj02':
      return gcoord.GCJ02;
    default:
      return gcoord.WGS84;
  }
};

export const toMapCoordinates = (longitude, latitude) =>
  map.coordinateSystem
    ? gcoord.transform([longitude, latitude], gcoord.WGS84, coordinateSystem(map.coordinateSystem))
    : [longitude, latitude];

export const fromMapCoordinates = (longitude, latitude) =>
  map.coordinateSystem
    ? gcoord.transform([longitude, latitude], coordinateSystem(map.coordinateSystem), gcoord.WGS84)
    : [longitude, latitude];

const transformGeometry = (geometry, from, to) => ({
  ...geometry,
  coordinates: gcoord.transform(structuredClone(geometry.coordinates), from, to),
});

export const loadImage = (url) =>
  new Promise((imageLoaded) => {
    const image = new Image();
    image.onload = () => imageLoaded(image);
    image.src = url;
  });

const canvasTintImage = (image, color) => {
  const canvas = document.createElement('canvas');
  canvas.width = image.width * devicePixelRatio;
  canvas.height = image.height * devicePixelRatio;
  canvas.style.width = `${image.width}px`;
  canvas.style.height = `${image.height}px`;

  const context = canvas.getContext('2d');

  context.save();
  context.fillStyle = color;
  context.globalAlpha = 1;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = 'destination-atop';
  context.globalAlpha = 1;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  context.restore();

  return canvas;
};

// Mezcla un color hex con blanco. amount=0..1 (1 = blanco puro).
const lightenColor = (color, amount) => {
  const hex = color.replace('#', '');
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map((c) => c + c)
          .join('')
      : hex;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const mix = (v) => Math.round(v + (255 - v) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
};

// Marcador circular: relleno con tinte muy claro del color de estado, aro del
// color, y el ícono de categoría tinteado con ese color (con sombra sutil).
export const prepareMarker = (icon, color) => {
  const size = 48;
  const canvas = document.createElement('canvas');
  canvas.width = size * devicePixelRatio;
  canvas.height = size * devicePixelRatio;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;

  const s = canvas.width;
  const context = canvas.getContext('2d');
  const cx = s / 2;
  const cy = s / 2;
  const ring = s * 0.03;
  const radius = s * 0.4 - ring / 2;

  // Fondo: círculo con tinte muy claro del color + sombra
  context.save();
  context.shadowColor = 'rgba(0, 0, 0, 0.3)';
  context.shadowBlur = s * 0.06;
  context.shadowOffsetY = s * 0.02;
  context.beginPath();
  context.arc(cx, cy, radius, 0, 2 * Math.PI);
  context.fillStyle = lightenColor(color, 0.9);
  context.fill();
  context.restore();

  // Aro del color de estado
  context.beginPath();
  context.arc(cx, cy, radius, 0, 2 * Math.PI);
  context.lineWidth = ring;
  context.strokeStyle = color;
  context.stroke();

  // Ícono de categoría tinteado con el color de estado
  const iconSize = s * 0.46;
  context.drawImage(
    canvasTintImage(icon, color),
    (s - iconSize) / 2,
    (s - iconSize) / 2,
    iconSize,
    iconSize,
  );

  return context.getImageData(0, 0, s, s);
};

// Halo tipo sonar: imagen animada (StyleImageInterface) que MapLibre
// re-renderiza cada frame. Círculo verde suave que se expande y se desvanece en
// loop; se usa como icon-image en una capa filtrada a los dispositivos online.
export const createPulse = () => {
  const size = 120;
  return {
    width: size,
    height: size,
    data: new Uint8Array(size * size * 4),
    onAdd() {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      this.context = canvas.getContext('2d');
    },
    render() {
      const duration = 1800;
      const t = (performance.now() % duration) / duration;
      const context = this.context;
      const radius = (size / 2) * t;
      context.clearRect(0, 0, size, size);
      context.beginPath();
      context.arc(size / 2, size / 2, radius, 0, 2 * Math.PI);
      context.fillStyle = `rgba(46, 125, 50, ${(1 - t) * 0.55})`;
      context.fill();
      this.data = context.getImageData(0, 0, size, size).data;
      map.triggerRepaint();
      return true;
    },
  };
};

// Flecha de rumbo dibujada vectorialmente (nítida), como un "pico" cuya base
// nace en el borde del círculo del marcador y apunta hacia afuera. Rumbo 0 =
// arriba; la capa la rota con icon-rotate según el course. Usa el mismo tamaño
// base (48) que prepareMarker para que, con el mismo icon-size, quede pegada.
export const prepareDirection = (color) => {
  // Canvas 64px (más grande que el marcador 48) para dejar margen transparente
  // a la punta de la flecha y su filete blanco sin recortarlos. La geometría va
  // en px absolutos que coinciden con el radio del círculo de prepareMarker
  // (48 * 0.4 - ring/2 ≈ 18.5), así con el mismo icon-size queda pegada al aro.
  const dpr = devicePixelRatio;
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;

  const s = canvas.width;
  const context = canvas.getContext('2d');
  const cx = s / 2;
  const cy = s / 2;
  const radius = 21.5 * dpr; // un poco afuera del borde del círculo (gap con el aro)
  const halfWidth = 7 * dpr;
  const height = 9 * dpr; // largo hacia afuera

  context.beginPath();
  context.moveTo(cx, cy - radius - height); // punta hacia arriba (rumbo 0)
  context.lineTo(cx - halfWidth, cy - radius + dpr);
  context.lineTo(cx + halfWidth, cy - radius + dpr);
  context.closePath();
  // Flecha sólida del color de estado (como el aro), sin filete.
  context.fillStyle = color;
  context.fill();

  return context.getImageData(0, 0, s, s);
};

// Pill "horneado": imagen completa (fondo blanco + borde + nombre ya dibujado)
// para el label del vehículo. Al ser un ícono sólido (y no chip + texto), cuando
// dos se superponen el de arriba tapa por completo al de abajo — MapLibre dibuja
// el ícono como una unidad, en vez de dibujar todos los textos al final.
export const buildLabelImage = (text) => {
  const dpr = devicePixelRatio;
  const fontSize = 10;
  const font = `bold ${fontSize}px "Open Sans", Roboto, "Helvetica Neue", Arial, sans-serif`;
  const padX = 11;
  const padY = 3;
  const border = 1.1;

  const measure = document.createElement('canvas').getContext('2d');
  measure.font = font;
  const textWidth = Math.ceil(measure.measureText(text).width);

  const height = Math.round(fontSize + padY * 2 + border * 2);
  const width = textWidth + padX * 2;

  const canvas = document.createElement('canvas');
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const context = canvas.getContext('2d');
  context.scale(dpr, dpr);

  const m = border / 2 + 0.25;
  const r = height / 2 - m;
  context.beginPath();
  context.moveTo(height / 2, m);
  context.lineTo(width - height / 2, m);
  context.arc(width - height / 2, height / 2, r, -Math.PI / 2, Math.PI / 2);
  context.lineTo(height / 2, height - m);
  context.arc(height / 2, height / 2, r, Math.PI / 2, -Math.PI / 2);
  context.closePath();
  context.fillStyle = '#FFFFFF';
  context.fill();
  context.lineWidth = border;
  context.strokeStyle = '#1C2536';
  context.stroke();

  context.fillStyle = '#1C2536';
  context.font = font;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, width / 2, height / 2 + 0.5);

  return context.getImageData(0, 0, canvas.width, canvas.height);
};

export const prepareIcon = (background, icon, color) => {
  const canvas = document.createElement('canvas');
  canvas.width = background.width * devicePixelRatio;
  canvas.height = background.height * devicePixelRatio;
  canvas.style.width = `${background.width}px`;
  canvas.style.height = `${background.height}px`;

  const context = canvas.getContext('2d');
  context.drawImage(background, 0, 0, canvas.width, canvas.height);

  if (icon) {
    const iconRatio = 0.5;
    const imageWidth = canvas.width * iconRatio;
    const imageHeight = canvas.height * iconRatio;
    context.drawImage(
      canvasTintImage(icon, color),
      (canvas.width - imageWidth) / 2,
      (canvas.height - imageHeight) / 2,
      imageWidth,
      imageHeight,
    );
  }

  return context.getImageData(0, 0, canvas.width, canvas.height);
};

export const reverseCoordinates = (it) => {
  if (!it) {
    return it;
  }
  if (Array.isArray(it)) {
    if (it.length === 2 && typeof it[0] === 'number' && typeof it[1] === 'number') {
      return [it[1], it[0]];
    }
    return it.map((it) => reverseCoordinates(it));
  }
  return {
    ...it,
    coordinates: reverseCoordinates(it.coordinates),
  };
};

export const geofenceToFeature = (theme, item) => {
  let geometry;
  if (item.area.indexOf('CIRCLE') > -1) {
    const coordinates = item.area
      .replace(/CIRCLE|\(|\)|,/g, ' ')
      .trim()
      .split(/ +/);
    const options = { steps: 32, units: 'meters' };
    const polygon = turfCircle(
      toMapCoordinates(Number(coordinates[1]), Number(coordinates[0])),
      Number(coordinates[2]),
      options,
    );
    geometry = polygon.geometry;
  } else {
    geometry = reverseCoordinates(parse(item.area));
    if (map.coordinateSystem) {
      geometry = transformGeometry(geometry, gcoord.WGS84, coordinateSystem(map.coordinateSystem));
    }
  }
  return {
    id: item.id,
    type: 'Feature',
    geometry,
    properties: {
      name: item.name,
      color: item.attributes.color || theme.palette.geometry.main,
      width: item.attributes.mapLineWidth || 2,
      opacity: item.attributes.mapLineOpacity || 1,
    },
  };
};

export const geometryToArea = (geometry) => {
  const normalized = map.coordinateSystem
    ? transformGeometry(geometry, coordinateSystem(map.coordinateSystem), gcoord.WGS84)
    : geometry;
  return stringify(reverseCoordinates(normalized));
};

export const findFonts = (map) => {
  const { glyphs } = map.getStyle();
  if (glyphs.startsWith('https://tiles.openfreemap.org')) {
    return ['Noto Sans Regular'];
  }
  if (glyphs.startsWith('https://api.os.uk')) {
    return ['Source Sans Pro Regular'];
  }
  return ['Open Sans Regular', 'Arial Unicode MS Regular'];
};
