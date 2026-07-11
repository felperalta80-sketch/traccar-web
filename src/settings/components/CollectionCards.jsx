import { makeStyles } from 'tss-react/mui';
import { Typography } from '@mui/material';
import { useTranslation } from '../../common/components/LocalizationProvider';
import CollectionActions from './CollectionActions';

// Vista de tarjetas para las páginas de colección de Ajustes en mobile (en
// desktop se usa la tabla). Cada ítem es una tarjeta con título, subtítulo
// opcional e iconos de acción (editar/borrar + acciones custom) en línea.
const useStyles = makeStyles()((theme) => ({
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    padding: theme.spacing(0, 2, 10),
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.25),
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 9,
    padding: theme.spacing(1, 1.25),
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
    '& svg': {
      fontSize: 18,
    },
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: theme.fonts.head,
    fontWeight: 700,
    fontSize: '0.8125rem',
    lineHeight: 1.25,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  secondary: {
    fontSize: '0.6875rem',
    color: theme.palette.text.disabled,
    lineHeight: 1.3,
    marginTop: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  actions: {
    flexShrink: 0,
  },
  sentinel: {
    height: 1,
  },
  empty: {
    padding: theme.spacing(4, 2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
    fontSize: '0.8125rem',
  },
}));

const CollectionCards = ({
  items,
  getPrimary,
  getSecondary,
  getIcon,
  editPath,
  endpoint,
  onReload,
  customActions,
  readonly,
  sentinelRef,
  hasMore,
}) => {
  const { classes } = useStyles();
  const t = useTranslation();

  if (!items.length && !hasMore) {
    return <Typography className={classes.empty}>{t('sharedNoData')}</Typography>;
  }

  return (
    <div className={classes.list}>
      {items.map((item) => (
        <div key={item.id} className={classes.card}>
          {getIcon && <span className={classes.avatar}>{getIcon(item)}</span>}
          <div className={classes.text}>
            <div className={classes.name}>{getPrimary(item)}</div>
            {getSecondary && <div className={classes.secondary}>{getSecondary(item)}</div>}
          </div>
          <span className={classes.actions}>
            <CollectionActions
              dense
              itemId={item.id}
              editPath={editPath}
              endpoint={endpoint}
              onReload={onReload}
              customActions={customActions}
              readonly={readonly}
            />
          </span>
        </div>
      ))}
      {hasMore && <div ref={sentinelRef} className={classes.sentinel} />}
    </div>
  );
};

export default CollectionCards;
