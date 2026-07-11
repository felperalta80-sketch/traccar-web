import { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
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
  Tabs,
  Tab,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useTheme, alpha } from '@mui/material/styles';
import TuneIcon from '@mui/icons-material/Tune';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from '../common/components/LocalizationProvider';
import { devicesActions } from '../store';
import usePersistedState from '../common/util/usePersistedState';
import DeviceRow from './DeviceRow';

const useStyles = makeStyles()((theme) => ({
  toolbar: {
    display: 'flex',
    gap: theme.spacing(1),
    // Sin el min-height/gutters por defecto de MuiToolbar: así el buscador no
    // queda centrado en 64px y el aire top = gap(buscador↔pestañas) = bottom.
    // El selector .MuiToolbar-root gana a la regla .MuiToolbar-regular.
    '&.MuiToolbar-root': {
      minHeight: 'auto',
      padding: theme.spacing(1, 1.25, 0),
    },
  },
  search: {
    borderRadius: 10,
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
    margin: theme.spacing(1, 1.25, 1),
    padding: theme.spacing(0.25, 0.5),
    backgroundColor: theme.palette.action.hover,
    borderRadius: 8,
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
      flexDirection: 'row',
      gap: theme.spacing(0.5),
      padding: theme.spacing(0.5),
      textTransform: 'none',
      fontSize: '0.66rem',
      fontWeight: 600,
      lineHeight: 1.2,
      whiteSpace: 'nowrap',
      borderRadius: 8,
      color: theme.palette.text.secondary,
    },
    '& .MuiTab-root.Mui-selected': {
      color: theme.palette.primary.main,
      backgroundColor: alpha(theme.palette.primary.main, 0.14),
    },
    '& .m-count': {
      fontSize: '0.66rem',
      fontWeight: 700,
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
  const t = useTranslation();

  const groups = useSelector((state) => state.groups.items);
  const devices = useSelector((state) => state.devices.items);
  const devicesOpen = useSelector((state) => state.devices.panelOpen);
  const geofences = useSelector((state) => state.geofences.items);

  const toolbarRef = useRef();
  const inputRef = useRef();
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [devicesAnchorEl, setDevicesAnchorEl] = useState(null);
  // Agrupar o no la lista por grupos (persistente por usuario, se sincroniza
  // con DeviceList vía usePersistedState).
  const [devicesGrouped, setDevicesGrouped] = usePersistedState('devicesGrouped', true);

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
      {devicesOpen && (
        <Toolbar ref={toolbarRef} disableGutters className={classes.toolbar}>
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
                style: {
                  width: `calc(${toolbarRef.current?.clientWidth}px - ${theme.spacing(4)})`,
                },
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
                    <Checkbox
                      checked={devicesGrouped}
                      onChange={(e) => setDevicesGrouped(e.target.checked)}
                    />
                  }
                  label={t('sharedGroupDevices')}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filterMap}
                      onChange={(e) => setFilterMap(e.target.checked)}
                    />
                  }
                  label={t('sharedFilterMap')}
                />
              </FormGroup>
            </div>
          </Popover>
        </Toolbar>
      )}
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
