import { grey } from '@mui/material/colors';
import { createTheme } from '@mui/material';
import { loadImage, prepareIcon, prepareMarker, prepareDirection, createPulse } from './mapUtil';

import backgroundSvg from '../../resources/images/background.svg';
import animalSvg from '../../resources/images/icon/animal.svg';
import bicycleSvg from '../../resources/images/icon/bicycle.svg';
import boatSvg from '../../resources/images/icon/boat.svg';
import busSvg from '../../resources/images/icon/bus.svg';
import carSvg from '../../resources/images/icon/car.svg';
import camperSvg from '../../resources/images/icon/camper.svg';
import craneSvg from '../../resources/images/icon/crane.svg';
import defaultSvg from '../../resources/images/icon/default.svg';
import startSvg from '../../resources/images/icon/start.svg';
import finishSvg from '../../resources/images/icon/finish.svg';
import helicopterSvg from '../../resources/images/icon/helicopter.svg';
import motorcycleSvg from '../../resources/images/icon/motorcycle.svg';
import personSvg from '../../resources/images/icon/person.svg';
import planeSvg from '../../resources/images/icon/plane.svg';
import scooterSvg from '../../resources/images/icon/scooter.svg';
import shipSvg from '../../resources/images/icon/ship.svg';
import tractorSvg from '../../resources/images/icon/tractor.svg';
import trailerSvg from '../../resources/images/icon/trailer.svg';
import trainSvg from '../../resources/images/icon/train.svg';
import tramSvg from '../../resources/images/icon/tram.svg';
import truckSvg from '../../resources/images/icon/truck.svg';
import vanSvg from '../../resources/images/icon/van.svg';

export const mapIcons = {
  animal: animalSvg,
  bicycle: bicycleSvg,
  boat: boatSvg,
  bus: busSvg,
  car: carSvg,
  camper: camperSvg,
  crane: craneSvg,
  default: defaultSvg,
  finish: finishSvg,
  helicopter: helicopterSvg,
  motorcycle: motorcycleSvg,
  person: personSvg,
  plane: planeSvg,
  scooter: scooterSvg,
  ship: shipSvg,
  start: startSvg,
  tractor: tractorSvg,
  trailer: trailerSvg,
  train: trainSvg,
  tram: tramSvg,
  truck: truckSvg,
  van: vanSvg,
};

export const mapIconKey = (category) => {
  switch (category) {
    case 'offroad':
    case 'pickup':
      return 'car';
    case 'trolleybus':
      return 'bus';
    default:
      return mapIcons.hasOwnProperty(category) ? category : 'default';
  }
};

export const mapImages = {};

const theme = createTheme({
  palette: {
    neutral: { main: grey[500] },
  },
});

export default async () => {
  const background = await loadImage(backgroundSvg);
  mapImages.background = await prepareIcon(background);

  // Flecha de rumbo dibujada por color de estado, pegada al borde del círculo
  ['info', 'success', 'error', 'neutral'].forEach((color) => {
    mapImages[`direction-${color}`] = prepareDirection(theme.palette[color].main);
  });

  // Halo tipo sonar (verde) para los dispositivos online
  mapImages.pulse = createPulse();

  // Chip: cápsula redondeada de fondo para el label del vehículo.
  // Base chica (18px) para que icon-text-fit la escale sin sobre-restringir
  // el alto: solo los extremos redondeados quedan fijos, el resto se estira.
  const chipCanvas = document.createElement('canvas');
  const chipH = 18;
  const chipW = 60;
  chipCanvas.width = chipW;
  chipCanvas.height = chipH;
  const ctx = chipCanvas.getContext('2d');
  const cy = chipH / 2;
  const lineWidth = 1.5;
  const m = lineWidth / 2 + 0.5; // margen para que el filete no se recorte
  const r = cy - m; // radio de los extremos (con inset)
  ctx.beginPath();
  ctx.moveTo(cy, m);
  ctx.lineTo(chipW - cy, m);
  ctx.arc(chipW - cy, cy, r, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(cy, chipH - m);
  ctx.arc(cy, cy, r, Math.PI / 2, -Math.PI / 2);
  ctx.closePath();
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = '#1C2536';
  ctx.stroke();
  const chipData = ctx.getImageData(0, 0, chipW, chipH);
  mapImages.chip = {
    width: chipW,
    height: chipH,
    data: new Uint8Array(chipData.data),
    // El texto ocupa el rectángulo central; los extremos redondeados no se
    // estiran. Banda central estirable en ambos ejes para 1 o varias líneas.
    content: [cy, m, chipW - cy, chipH - m],
    stretchX: [[cy, chipW - cy]],
    stretchY: [[cy - 1, cy + 1]],
  };
  await Promise.all(
    Object.keys(mapIcons).map(async (category) => {
      const results = [];
      ['info', 'success', 'error', 'neutral'].forEach((color) => {
        results.push(
          loadImage(mapIcons[category]).then((icon) => {
            mapImages[`${category}-${color}`] = prepareMarker(icon, theme.palette[color].main);
          }),
        );
      });
      await Promise.all(results);
    }),
  );
};
