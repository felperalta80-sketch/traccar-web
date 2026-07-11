import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import {
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  IconButton,
  Tooltip,
  useMediaQuery,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlined';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import ReportCards from './components/ReportCards';
import { sessionActions } from '../store';

const useStyles = makeStyles()((theme) => ({
  columnAction: {
    width: '1%',
    paddingLeft: theme.spacing(1),
  },
}));

const columnsMap = new Map([
  ['protocol', 'positionProtocol'],
  ['data', 'commandData'],
]);

const LogsPage = () => {
  const { classes } = useStyles();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useTranslation();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  useEffect(() => {
    dispatch(sessionActions.enableLogs(true));
    return () => dispatch(sessionActions.enableLogs(false));
  }, [dispatch]);

  const items = useSelector((state) => state.session.logs);

  const registerDevice = (uniqueId) => {
    const query = new URLSearchParams({ uniqueId });
    navigate(`/settings/device?${query.toString()}`);
  };

  const statusAction = (item) =>
    item.deviceId ? (
      <IconButton color="success" size="small" disabled>
        <CheckCircleOutlineIcon fontSize="small" />
      </IconButton>
    ) : (
      <Tooltip title={t('loginRegister')}>
        <IconButton color="error" size="small" onClick={() => registerDevice(item.uniqueId)}>
          <HelpOutlineIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    );

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'sharedLogs']}>
      {desktop ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className={classes.columnAction} />
              <TableCell>{t('deviceIdentifier')}</TableCell>
              <TableCell>{t('positionProtocol')}</TableCell>
              <TableCell>{t('commandData')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={index}>
                <TableCell className={classes.columnAction} padding="none">
                  {statusAction(item)}
                </TableCell>
                <TableCell>{item.uniqueId}</TableCell>
                <TableCell>{item.protocol}</TableCell>
                <TableCell>{item.data}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <ReportCards
          items={items}
          columns={['protocol', 'data']}
          columnsMap={columnsMap}
          formatValue={(item, key) => item[key]}
          rowName={(item) => item.uniqueId}
          rowKey={(item, index) => index}
          rowColor={(item) =>
            item.deviceId ? theme.palette.success.main : theme.palette.error.main
          }
          rowAction={statusAction}
          wideColumns={['data']}
          loading={false}
        />
      )}
    </PageLayout>
  );
};

export default LogsPage;
