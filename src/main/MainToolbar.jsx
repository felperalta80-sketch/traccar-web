import { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Toolbar,
  IconButton,
  OutlinedInput,
  InputAdornment,
  Popover,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Badge,
  ListItemButton,
  ListItemText,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import TuneIcon from '@mui/icons-material/Tune';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useDeviceReadonly } from '../common/util/permissions';
import { devicesActions } from '../store';
import DeviceRow from './DeviceRow';

const useStyles = makeStyles()((theme) => ({
  toolbar: {
    display: 'flex',
    gap: theme.spacing(1),
  },
  search: {
    borderRadius: 11,
    backgroundColor: theme.palette.action.hover,
    fontSize: '0.8125rem',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'transparent',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.divider,
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.main,
      borderWidth: '1px',
    },
  },
  searchIcon: {
    color: theme.palette.text.disabled,
    marginLeft: theme.spacing(-0.5),
  },
  tabs: {
    minHeight: 'auto',
    margin: theme.spacing(0, 1.5, 1.25),
    padding: theme.spacing(0.75),
    backgroundColor: theme.palette.action.hover,
    borderRadius: 10,
    '& .MuiTabs-indicator': {
      display: 'none',
    },
    '& .MuiTabs-list': {
      width: '100%',
      justifyContent: 'space-between',
    },
    '& .MuiTab-root': {
      flex: '0 0 auto',
      minWidth: 0,
      minHeight: 'auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 1,
      padding: theme.spacing(0.25, 0.75),
      textTransform: 'none',
      fontSize: '0.6875rem',
      fontWeight: 600,
      lineHeight: 1.25,
      whiteSpace: 'nowrap',
      color: theme.palette.text.secondary,
    },
    '& .MuiTab-root.Mui-selected': {
      color: theme.palette.primary.main,
    },
    '& .m-count': {
      fontSize: '0.85rem',
      fontWeight: 700,
      lineHeight: 1.1,
      fontVariantNumeric: 'tabular-nums',
      color: theme.palette.text.primary,
    },
    '& .Mui-selected .m-count': {
      color: theme.palette.primary.main,
    },
  },
  filterPaper: {
    borderRadius: theme.spacing(2),
    marginTop: theme.spacing(1),
    overflow: 'hidden',
    boxShadow: theme.shadows[8],
  },
  filterPanel: {
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(2),
    gap: theme.spacing(1.75),
    width: theme.dimensions.drawerWidthTablet,
    '& .MuiOutlinedInput-root': {
      borderRadius: 10,
      backgroundColor: theme.palette.action.hover,
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'transparent',
      },
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.divider,
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.primary.main,
        borderWidth: '1px',
      },
    },
    '& .MuiInputBase-input': {
      fontSize: '0.8125rem',
    },
    '& .MuiInputLabel-root': {
      fontSize: '0.8125rem',
    },
    '& .MuiFormControlLabel-label': {
      fontSize: '0.8125rem',
    },
  },
  filterHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(0.25),
    paddingBottom: theme.spacing(1),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  filterTitle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    fontFamily: theme.fonts.head,
    fontSize: '0.8125rem',
    fontWeight: 700,
    color: theme.palette.text.primary,
  },
}));

const MainToolbar = ({
  filteredDevices,
  keyword,
  setKeyword,
  filter,
  setFilter,
  filterSort,
  setFilterSort,
  filterMap,
  setFilterMap,
}) => {
  const { classes } = useStyles();
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useTranslation();

  const deviceReadonly = useDeviceReadonly();

  const groups = useSelector((state) => state.groups.items);
  const devices = useSelector((state) => state.devices.items);
  const devicesOpen = useSelector((state) => state.devices.panelOpen);
  const devicesLoaded = useSelector((state) => state.devices.loaded);
  const geofences = useSelector((state) => state.geofences.items);

  const toolbarRef = useRef();
  const inputRef = useRef();
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [devicesAnchorEl, setDevicesAnchorEl] = useState(null);

  const deviceStatusCount = (status) =>
    Object.values(devices).filter((d) => d.status === status).length;

  // Pestaña activa derivada del filtro de estado (sincronizada con el popover):
  // vacío = Todos, un único estado = esa pestaña, combinación = ninguna resaltada.
  const statusTab = (() => {
    const statuses = filter.statuses;
    if (!statuses.length) {
      return 'all';
    }
    if (statuses.length === 1) {
      return statuses[0];
    }
    return false;
  })();

  const handleStatusTab = (_, value) => {
    setFilter({ ...filter, statuses: value === 'all' ? [] : [value] });
  };

  const tabLabel = (text, count) => (
    <>
      {text}
      <span className="m-count">{count}</span>
    </>
  );

  return (
    <>
      <Toolbar ref={toolbarRef} className={classes.toolbar}>
        <OutlinedInput
          ref={inputRef}
          className={classes.search}
          placeholder={t('sharedSearchDevices')}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onFocus={() => setDevicesAnchorEl(toolbarRef.current)}
          onBlur={() => setDevicesAnchorEl(null)}
          startAdornment={
            <InputAdornment position="start">
              <SearchIcon fontSize="small" className={classes.searchIcon} />
            </InputAdornment>
          }
          endAdornment={
            <InputAdornment position="end">
              <IconButton
                size="small"
                edge="end"
                onClick={() => setFilterAnchorEl(inputRef.current)}
              >
                <Badge
                  color="info"
                  variant="dot"
                  invisible={
                    !filter.statuses.length && !filter.groups.length && !filter.geofences.length
                  }
                >
                  <TuneIcon fontSize="small" />
                </Badge>
              </IconButton>
            </InputAdornment>
          }
          size="small"
          fullWidth
        />
        <Popover
          open={!!devicesAnchorEl && !devicesOpen}
          anchorEl={devicesAnchorEl}
          onClose={() => setDevicesAnchorEl(null)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: Number(theme.spacing(2).slice(0, -2)),
          }}
          marginThreshold={0}
          slotProps={{
            paper: {
              style: { width: `calc(${toolbarRef.current?.clientWidth}px - ${theme.spacing(4)})` },
            },
          }}
          elevation={1}
          disableAutoFocus
          disableEnforceFocus
        >
          {filteredDevices.slice(0, 3).map((device) => (
            <DeviceRow key={device.id} device={device} />
          ))}
          {filteredDevices.length > 3 && (
            <ListItemButton
              alignItems="center"
              onClick={() => dispatch(devicesActions.setPanelOpen(true))}
            >
              <ListItemText primary={t('notificationAlways')} style={{ textAlign: 'center' }} />
            </ListItemButton>
          )}
        </Popover>
        <Popover
          open={!!filterAnchorEl}
          anchorEl={filterAnchorEl}
          onClose={() => setFilterAnchorEl(null)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          slotProps={{ paper: { className: classes.filterPaper } }}
        >
          <div className={classes.filterPanel}>
            <div className={classes.filterHeader}>
              <span className={classes.filterTitle}>
                <TuneIcon fontSize="small" />
                {t('sharedFilters')}
              </span>
              <IconButton
                size="small"
                edge="end"
                onClick={() => setFilterAnchorEl(null)}
                sx={{ my: -0.5 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </div>
            <FormControl>
              <InputLabel>{t('deviceStatus')}</InputLabel>
              <Select
                label={t('deviceStatus')}
                value={filter.statuses}
                onChange={(e) => setFilter({ ...filter, statuses: e.target.value })}
                multiple
              >
                <MenuItem value="online">{`${t('deviceStatusOnline')} (${deviceStatusCount('online')})`}</MenuItem>
                <MenuItem value="offline">{`${t('deviceStatusOffline')} (${deviceStatusCount('offline')})`}</MenuItem>
                <MenuItem value="unknown">{`${t('deviceStatusUnknown')} (${deviceStatusCount('unknown')})`}</MenuItem>
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel>{t('settingsGroups')}</InputLabel>
              <Select
                label={t('settingsGroups')}
                value={filter.groups}
                onChange={(e) => setFilter({ ...filter, groups: e.target.value })}
                multiple
              >
                {Object.values(groups)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((group) => (
                    <MenuItem key={group.id} value={group.id}>
                      {group.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel>{t('sharedGeofences')}</InputLabel>
              <Select
                label={t('sharedGeofences')}
                value={filter.geofences}
                onChange={(e) => setFilter({ ...filter, geofences: e.target.value })}
                multiple
              >
                {Object.values(geofences)
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((geofence) => (
                    <MenuItem key={geofence.id} value={geofence.id}>
                      {geofence.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel>{t('sharedSortBy')}</InputLabel>
              <Select
                label={t('sharedSortBy')}
                value={filterSort}
                onChange={(e) => setFilterSort(e.target.value)}
              >
                <MenuItem value="">{'\u00a0'}</MenuItem>
                <MenuItem value="name">{t('sharedName')}</MenuItem>
                <MenuItem value="lastUpdate">{t('deviceLastUpdate')}</MenuItem>
              </Select>
            </FormControl>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox checked={filterMap} onChange={(e) => setFilterMap(e.target.checked)} />
                }
                label={t('sharedFilterMap')}
              />
            </FormGroup>
          </div>
        </Popover>
        <IconButton
          edge="end"
          onClick={() => navigate('/settings/device')}
          disabled={deviceReadonly}
        >
          <Tooltip
            open={!deviceReadonly && devicesLoaded && Object.keys(devices).length === 0}
            title={t('deviceRegisterFirst')}
            arrow
          >
            <AddIcon />
          </Tooltip>
        </IconButton>
      </Toolbar>
      <Tabs className={classes.tabs} value={statusTab} onChange={handleStatusTab}>
        <Tab value="all" label={tabLabel(t('sharedAll'), Object.keys(devices).length)} />
        <Tab
          value="online"
          label={tabLabel(t('deviceStatusOnline'), deviceStatusCount('online'))}
        />
        <Tab
          value="offline"
          label={tabLabel(t('deviceStatusOffline'), deviceStatusCount('offline'))}
        />
        <Tab
          value="unknown"
          label={tabLabel(t('deviceStatusUnknown'), deviceStatusCount('unknown'))}
        />
      </Tabs>
    </>
  );
};

export default MainToolbar;
