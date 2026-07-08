import { grey } from '@mui/material/colors';
import { createTheme } from '@mui/material';
import { loadImage, prepareIcon } from './mapUtil';

import directionSvg from '../../resources/images/direction.svg';
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
  mapImages.direction = await prepareIcon(await loadImage(directionSvg));

  // Chip: cápsula redondeada de fondo para el label del vehículo.
  // Base chica (18px) para que icon-text-fit la escale sin sobre-restringir
  // el alto: solo los extremos redondeados quedan fijos, el resto se estira.
  const chipCanvas = document.createElement('canvas');
  const chipH = 18;
  const chipW = 60;
  chipCanvas.width = chipW;
  chipCanvas.height = chipH;
  const ctx = chipCanvas.getContext('2d');
  const r = chipH / 2;
  ctx.fillStyle = '#1C2536';
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(chipW - r, 0);
  ctx.arc(chipW - r, r, r, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(r, chipH);
  ctx.arc(r, r, r, Math.PI / 2, -Math.PI / 2);
  ctx.closePath();
  ctx.fill();
  const chipData = ctx.getImageData(0, 0, chipW, chipH);
  mapImages.chip = {
    width: chipW,
    height: chipH,
    data: new Uint8Array(chipData.data),
    // El texto ocupa el rectángulo central; los extremos redondeados no se
    // estiran. Banda central estirable en ambos ejes para 1 o varias líneas.
    content: [r, 1, chipW - r, chipH - 1],
    stretchX: [[r, chipW - r]],
    stretchY: [[r - 1, r + 1]],
  };
  await Promise.all(
    Object.keys(mapIcons).map(async (category) => {
      const results = [];
      ['info', 'success', 'error', 'neutral'].forEach((color) => {
        results.push(
          loadImage(mapIcons[category]).then((icon) => {
            mapImages[`${category}-${color}`] = prepareIcon(
              background,
              icon,
              theme.palette[color].main,
            );
          }),
        );
      });
      await Promise.all(results);
    }),
  );
};
