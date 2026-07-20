import { makeStyles } from 'tss-react/mui';
import { IconButton, TextField } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import dayjs from 'dayjs';
import { useTranslation } from '../../common/components/LocalizationProvider';

// Selector de un día para reportes cronológicos: flechas anterior/siguiente y
// campo de fecha nativo. Trabaja con dayjs y no permite avanzar al futuro,
// porque no hay recorrido que mostrar más allá de hoy. El nombre del día es el
// label flotante del campo, para que el control quede estructuralmente igual al
// selector de dispositivo (label + campo) y ambos se alineen en la fila.
const useStyles = makeStyles()((theme) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  },
  nav: {
    flexShrink: 0,
  },
  field: {
    flex: 1,
    minWidth: 0,
  },
}));

const DayNavigator = ({ day, onChange }) => {
  const { classes } = useStyles();
  const t = useTranslation();

  const isToday = day.isSame(dayjs(), 'day');
  const weekday = day.format('dddd');
  const label = weekday.charAt(0).toUpperCase() + weekday.slice(1);

  return (
    <div className={classes.root}>
      <IconButton
        className={classes.nav}
        size="small"
        aria-label={t('reportPreviousDay')}
        onClick={() => onChange(day.subtract(1, 'day'))}
      >
        <ChevronLeftIcon fontSize="small" />
      </IconButton>
      <TextField
        className={classes.field}
        type="date"
        label={label}
        value={day.format('YYYY-MM-DD')}
        slotProps={{
          htmlInput: { max: dayjs().format('YYYY-MM-DD') },
          inputLabel: { shrink: true },
        }}
        onChange={(e) => {
          const next = dayjs(e.target.value);
          if (next.isValid()) {
            onChange(next);
          }
        }}
      />
      <IconButton
        className={classes.nav}
        size="small"
        aria-label={t('reportNextDay')}
        disabled={isToday}
        onClick={() => onChange(day.add(1, 'day'))}
      >
        <ChevronRightIcon fontSize="small" />
      </IconButton>
    </div>
  );
};

export default DayNavigator;
