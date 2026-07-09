import { useEffect, useReducer, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { List } from 'react-window';
import { ButtonBase } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { devicesActions } from '../store';
import { useAsyncTask } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import usePersistedState from '../common/util/usePersistedState';
import DeviceRow from './DeviceRow';
import fetchOrThrow from '../common/util/fetchOrThrow';

const GROUP_HEIGHT = 40;
const DEVICE_HEIGHT = 57;

const useStyles = makeStyles()((theme) => ({
  list: {
    height: '100%',
    direction: theme.direction,
  },
  groupHeader: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: theme.spacing(0.75),
    padding: theme.spacing(0, 1.5),
    backgroundColor: theme.palette.action.hover,
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  groupChevron: {
    fontSize: 19,
    color: theme.palette.text.secondary,
    transition: 'transform .15s ease',
  },
  groupChevronCollapsed: {
    transform: 'rotate(-90deg)',
  },
  groupName: {
    flex: 1,
    minWidth: 0,
    textAlign: 'start',
    fontFamily: theme.fonts.head,
    fontSize: '0.75rem',
    fontWeight: 700,
    color: theme.palette.text.primary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  groupCount: {
    fontSize: '0.6875rem',
    fontWeight: 800,
    color: theme.palette.text.secondary,
    fontVariantNumeric: 'tabular-nums',
    padding: '1px 8px',
    borderRadius: 999,
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
  },
}));

const GroupHeader = ({ style, group, onToggle }) => {
  const { classes, cx } = useStyles();
  return (
    <div style={style}>
      <ButtonBase className={classes.groupHeader} onClick={() => onToggle(group.id)} focusRipple>
        <ExpandMoreIcon
          className={cx(classes.groupChevron, group.collapsed && classes.groupChevronCollapsed)}
        />
        <span className={classes.groupName}>{group.name}</span>
        <span className={classes.groupCount}>{group.count}</span>
      </ButtonBase>
    </div>
  );
};

const DeviceListRow = ({ index, style, rows, onToggle }) => {
  const row = rows[index];
  if (row.type === 'group') {
    return <GroupHeader style={style} group={row} onToggle={onToggle} />;
  }
  return <DeviceRow style={style} device={row.device} />;
};

const DeviceList = ({ devices }) => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const t = useTranslation();

  const groups = useSelector((state) => state.groups.items);

  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const [collapsed, setCollapsed] = usePersistedState('deviceGroupsCollapsed', []);

  useEffect(() => {
    const interval = setInterval(forceUpdate, 60000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  useAsyncTask(
    async ({ signal }) => {
      const response = await fetchOrThrow('/api/devices', { signal });
      dispatch(devicesActions.refresh(await response.json()));
    },
    [dispatch],
  );

  const onToggle = useCallback(
    (groupId) =>
      setCollapsed((prev) =>
        prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId],
      ),
    [setCollapsed],
  );

  const noGroupLabel = t('groupNoGroup');

  // Aplana los dispositivos filtrados en cabecera de grupo + filas, respetando
  // los grupos colapsados. Los grupos con nombre van alfabéticos y "sin grupo"
  // queda al final.
  const rows = useMemo(() => {
    const buckets = new Map();
    devices.forEach((device) => {
      const groupId = device.groupId || 0;
      if (!buckets.has(groupId)) {
        buckets.set(groupId, []);
      }
      buckets.get(groupId).push(device);
    });
    const entries = [...buckets.entries()].sort(([a], [b]) => {
      if (!a) {
        return 1;
      }
      if (!b) {
        return -1;
      }
      return (groups[a]?.name || '').localeCompare(groups[b]?.name || '');
    });
    const result = [];
    entries.forEach(([groupId, list]) => {
      const isCollapsed = collapsed.includes(groupId);
      result.push({
        type: 'group',
        id: groupId,
        name: groupId ? groups[groupId]?.name || '' : noGroupLabel,
        count: list.length,
        collapsed: isCollapsed,
      });
      if (!isCollapsed) {
        list.forEach((device) => result.push({ type: 'device', device }));
      }
    });
    return result;
  }, [devices, groups, collapsed, noGroupLabel]);

  return (
    <List
      className={classes.list}
      rowComponent={DeviceListRow}
      rowCount={rows.length}
      rowHeight={(index) => (rows[index].type === 'group' ? GROUP_HEIGHT : DEVICE_HEIGHT)}
      rowProps={{ rows, onToggle }}
      overscanCount={5}
    />
  );
};

export default DeviceList;
