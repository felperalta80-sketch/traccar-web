import { useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import {
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  IconButton,
  useMediaQuery,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAsyncTask } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import ReportCards from './components/ReportCards';
import TableShimmer from '../common/components/TableShimmer';
import RemoveDialog from '../common/components/RemoveDialog';
import fetchOrThrow from '../common/util/fetchOrThrow';

const useStyles = makeStyles()((theme) => ({
  columnAction: {
    width: '1%',
    paddingRight: theme.spacing(1),
  },
}));

const columnsMap = new Map([
  ['type', 'sharedType'],
  ['calendar', 'sharedCalendar'],
]);

const ScheduledPage = () => {
  const { classes } = useStyles();
  const t = useTranslation();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const calendars = useSelector((state) => state.calendars.items);

  const [reloadKey, reload] = useReducer((k) => k + 1, 0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState();

  useAsyncTask(
    async ({ signal }) => {
      void reloadKey;
      setLoading(true);
      try {
        const response = await fetchOrThrow('/api/reports', { signal });
        setItems(await response.json());
      } finally {
        setLoading(false);
      }
    },
    [reloadKey],
  );

  const formatType = (type) => {
    switch (type) {
      case 'events':
        return t('reportEvents');
      case 'route':
        return t('reportPositions');
      case 'summary':
        return t('reportSummary');
      case 'trips':
        return t('reportTrips');
      case 'stops':
        return t('reportStops');
      default:
        return type;
    }
  };

  const formatValue = (item, key) => {
    switch (key) {
      case 'type':
        return formatType(item.type);
      case 'calendar':
        return calendars[item.calendarId]?.name;
      default:
        return item[key];
    }
  };

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportScheduled']}>
      {desktop ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('sharedType')}</TableCell>
              <TableCell>{t('sharedDescription')}</TableCell>
              <TableCell>{t('sharedCalendar')}</TableCell>
              <TableCell className={classes.columnAction} />
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading ? (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{formatType(item.type)}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{calendars[item.calendarId].name}</TableCell>
                  <TableCell className={classes.columnAction} padding="none">
                    <IconButton size="small" onClick={() => setRemovingId(item.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableShimmer columns={4} endAction />
            )}
          </TableBody>
        </Table>
      ) : (
        <ReportCards
          items={items}
          columns={['type', 'calendar']}
          columnsMap={columnsMap}
          formatValue={formatValue}
          rowName={(item) => item.description || formatType(item.type)}
          rowKey={(item) => item.id}
          rowAction={(item) => (
            <IconButton size="small" edge="end" onClick={() => setRemovingId(item.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
          loading={loading}
        />
      )}
      <RemoveDialog
        style={{ transform: 'none' }}
        open={!!removingId}
        endpoint="reports"
        itemId={removingId}
        onResult={(removed) => {
          setRemovingId(null);
          if (removed) {
            reload();
          }
        }}
      />
    </PageLayout>
  );
};

export default ScheduledPage;
