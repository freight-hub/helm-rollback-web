import { Button, Table, TableBody, TableCell, TableContainer, TableRow, Paper, Toolbar, Typography, CircularProgress } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useTitle, setLinkProps } from 'hookrouter';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';

import { DefaultRollbackApi } from "../../lib/rollback-api";
import { stableSort, getComparator } from '../../lib/sorting.ts';
import EnhancedTableHead from '../EnhancedTableHead/EnhancedTableHead.jsx';
import StatusIcon from '../StatusIcon/StatusIcon.tsx';
import Timestamp from '../Timestamp/Timestamp.tsx';

const headCells = [
  { id: 'revision', numeric: true, disablePadding: false, label: 'Revision' },
  { id: 'updated', numeric: false, disablePadding: false, label: 'Release Date' },
  { id: 'status', numeric: false, disablePadding: false, label: 'Status' },
  { id: 'description', numeric: false, disablePadding: false, label: 'Description' },
  { id: 'chart', numeric: false, disablePadding: false, label: 'Chart' },
  { id: 'app_version', numeric: false, disablePadding: false, label: 'Version' },
  { id: 'action', numeric: true, disablePadding: false, label: '' },
];
const headCellsWithoutChart = headCells.filter(x => x.id !== 'chart');

export default function ReleaseDetails(props) {
  const { namespace, releaseName } = props;
  useTitle(`${releaseName} - ${namespace} - Helm Rollback`);

  const useStyles = makeStyles({
    spinnerWrap: {
      textAlign: 'center',
      padding: '2em',
    },
  });

  const [ releasesState, setReleasesState ] = React.useState({ loading: true, revisions: [] });
  const [ order, setOrder ] = React.useState('desc');
  const [ orderBy, setOrderBy ] = React.useState('revision');
  const classes = useStyles();

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  useEffect(() => {
    DefaultRollbackApi.getReleaseHistory(namespace, releaseName).then(data => {
      setReleasesState({ revisions: data, loading: false })
    });
  }, [ setReleasesState, namespace, releaseName ]);

  const firstChart = releasesState.revisions[0]?.chart;
  const allSameChart = firstChart && releasesState.revisions
    .every(x => x.chart === firstChart);

  const toolbar = (
    <Toolbar>
      <Typography className={classes.title} variant="h6" id="tableTitle" component="div">
        Release History for &nbsp;
        <code>{namespace}</code>/<code>{releaseName}</code>
      </Typography>
      <div style={{ flexGrow: 1 }} />
      {allSameChart ? (
        <Typography className={classes.title} variant="h6" component="div">
          Helm chart: &nbsp;
          <code>{firstChart}</code>
        </Typography>
      ) : null}
    </Toolbar>
  );

  if (releasesState.loading) {
    return (
      <Paper>
        {toolbar}
        <div className={classes.spinnerWrap}>
          <CircularProgress size="5em" />
        </div>
      </Paper>
    )
  }

  return (
    <TableContainer component={Paper}>
      {toolbar}
      <Table className={classes.table} size="small" aria-label="simple table">
        <EnhancedTableHead
            headCells={allSameChart ? headCellsWithoutChart : headCells}
            order={order}
            orderBy={orderBy}
            onRequestSort={handleRequestSort}
          />
        <TableBody>
        {stableSort(releasesState.revisions, getComparator(order, orderBy))
          .map(row => (
            <TableRow key={row.revision} >
              <TableCell align="right">{row.revision}</TableCell>
              <TableCell><Timestamp date={row.updated} /></TableCell>
              <TableCell>
                <StatusIcon status={row.status} />
                {row.status}
              </TableCell>
              <TableCell>{row.description}</TableCell>
              {!allSameChart ? (<TableCell>{row.chart}</TableCell>) : null}
              <TableCell><code>{row.app_version}</code></TableCell>
              <TableCell>
                <Button variant="contained" color="primary" {...setLinkProps({
                  href: `/rollback/${namespace}/${releaseName}/${row.revision}`,
                })}>↩️</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
ReleaseDetails.propTypes = {
  namespace: PropTypes.string.isRequired,
  releaseName: PropTypes.string.isRequired,
};


