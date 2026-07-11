import { makeStyles } from 'tss-react/mui';
import { useTheme, alpha } from '@mui/material/styles';
import { Skeleton, Typography } from '@mui/material';
import { useTranslation } from '../../common/components/LocalizationProvider';

// Presentación de un reporte como tarjetas, para mobile (en desktop se usa la
// tabla). Cada fila del reporte se convierte en una tarjeta con las columnas
// como pares etiqueta/valor en dos columnas. Reutilizable entre reportes.
//   - wideColumns: claves que se muestran a ancho completo (direcciones).
//   - chipColumns: claves que se muestran como chip de color (tipo de evento);
//     el color lo define chipColor(item, key).
const useStyles = makeStyles()((theme) => ({
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.25),
    padding: theme.spacing(1.25),
  },
  card: {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderLeftWidth: 3,
    borderRadius: 9,
    padding: theme.spacing(1.25, 1.5),
  },
  head: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  name: {
    flex: 1,
    minWidth: 0,
    fontFamily: theme.fonts.head,
    fontWeight: 700,
    fontSize: '0.875rem',
    lineHeight: 1.25,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  action: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    marginRight: theme.spacing(-0.75),
  },
  rows: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    columnGap: theme.spacing(2),
    rowGap: theme.spacing(0.75),
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: theme.spacing(1),
    minWidth: 0,
    borderTop: `1px dashed ${theme.palette.divider}`,
    paddingTop: theme.spacing(0.75),
    fontSize: theme.typography.caption.fontSize,
  },
  key: {
    color: theme.palette.text.secondary,
    whiteSpace: 'nowrap',
  },
  value: {
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
    textAlign: 'right',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  rowWide: {
    gridColumn: '1 / -1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 2,
    minWidth: 0,
    borderTop: `1px dashed ${theme.palette.divider}`,
    paddingTop: theme.spacing(0.75),
  },
  wideKey: {
    fontSize: theme.typography.label.fontSize,
    fontWeight: 700,
    letterSpacing: '.03em',
    textTransform: 'uppercase',
    color: theme.palette.text.disabled,
  },
  wideValue: {
    fontSize: '0.75rem',
    fontWeight: 600,
    lineHeight: 1.3,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    fontSize: theme.typography.caption.fontSize,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 999,
    whiteSpace: 'nowrap',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: 'currentColor',
    flexShrink: 0,
  },
  empty: {
    padding: theme.spacing(4, 2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    fontSize: '0.8125rem',
  },
}));

const ReportCards = ({
  items,
  columns,
  columnsMap,
  columnLabel,
  formatValue,
  rowName,
  rowKey,
  rowColor,
  rowAction,
  wideColumns = [],
  chipColumns = [],
  chipColor,
  loading,
}) => {
  const { classes } = useStyles();
  const theme = useTheme();
  const t = useTranslation();

  // Etiqueta de la columna: por columnLabel (ej. atributos de posición ya
  // resueltos) o traduciendo la clave del columnsMap.
  const labelOf = (key) => (columnLabel ? columnLabel(key) : t(columnsMap.get(key)));

  if (loading) {
    return (
      <div className={classes.list}>
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} variant="rounded" height={150} />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return <Typography className={classes.empty}>{t('sharedNoData')}</Typography>;
  }

  const display = (value) => (value === null || value === undefined || value === '' ? '—' : value);

  return (
    <div className={classes.list}>
      {items.map((item, index) => (
        <div
          key={rowKey(item, index)}
          className={classes.card}
          style={{ borderLeftColor: rowColor ? rowColor(item) : theme.palette.divider }}
        >
          <div className={classes.head}>
            <span className={classes.name}>{rowName(item)}</span>
            {rowAction && <span className={classes.action}>{rowAction(item)}</span>}
          </div>
          <div className={classes.rows}>
            {columns.map((key) => {
              const value = formatValue(item, key);
              const label = labelOf(key);
              if (wideColumns.includes(key)) {
                return (
                  <div key={key} className={classes.rowWide}>
                    <span className={classes.wideKey}>{label}</span>
                    <span className={classes.wideValue}>{display(value)}</span>
                  </div>
                );
              }
              if (chipColumns.includes(key) && value) {
                const color = chipColor ? chipColor(item, key) : theme.palette.primary.main;
                return (
                  <div key={key} className={classes.row}>
                    <span className={classes.key}>{label}</span>
                    <span
                      className={classes.chip}
                      style={{ color, backgroundColor: alpha(color, 0.14) }}
                    >
                      <span className={classes.dot} />
                      {value}
                    </span>
                  </div>
                );
              }
              return (
                <div key={key} className={classes.row}>
                  <span className={classes.key}>{label}</span>
                  <span className={classes.value}>{display(value)}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReportCards;
