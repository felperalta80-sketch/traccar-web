import { makeStyles } from 'tss-react/mui';
import { IconButton, TextField } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import dayjs from 'dayjs';
import { useTranslation } from '../../common/components/LocalizationProvider';

// Selector de un día para reportes cronológicos: flechas anterior/siguiente y
// campo de fecha nativo. Trabaja con dayjs y no permite avanzar al futuro,
// porque no hay recorrido que mostrar más allá de hoy.
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
  label: {
    fontFamily: theme.fonts.head,
    fontSize: theme.typography.label.fontSize,
    fontWeight: theme.typography.label.fontWeight,
    letterSpacing: theme.typography.label.letterSpacing,
    textTransform: theme.typography.label.textTransform,
    color: theme.palette.text.secondary,
    textAlign: 'center',
    lineHeight: 1.4,
  },
}));

const DayNavigator = ({ day, onChange }) => {
  const { classes } = useStyles();
  const t = useTranslation();

  const isToday = day.isSame(dayjs(), 'day');

  return (
    <div>
      <div className={classes.label}>{day.format('dddd')}</div>
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
          size="small"
          value={day.format('YYYY-MM-DD')}
          slotProps={{ htmlInput: { max: dayjs().format('YYYY-MM-DD') } }}
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
    </div>
  );
};

export default DayNavigator;
