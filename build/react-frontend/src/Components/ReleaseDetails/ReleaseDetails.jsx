import { Button, Table, TableBody, TableCell, TableContainer, TableRow, Paper, Toolbar, Typography, CircularProgress } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useTitle, setLinkProps } from 'hookrouter';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';

import { DefaultRollbackApi } from "../../lib/rollback-api";
import { stableSort, getComparator } from '../../lib/sorting.js';
import EnhancedTableHead from '../EnhancedTableHead/EnhancedTableHead.jsx';

const headCells = [
  { id: 'revision', numeric: true, disablePadding: false, label: 'Revision' },
  { id: 'updated', numeric: false, disablePadding: false, label: 'Release Date' },
  { id: 'status', numeric: false, disablePadding: false, label: 'Status' },
  { id: 'description', numeric: false, disablePadding: false, label: 'Description' },
  { id: 'chart', numeric: false, disablePadding: false, label: 'Chart' },
  { id: 'app_version', numeric: false, disablePadding: false, label: 'Version' },
  { id: 'action', numeric: true, disablePadding: false, label: '' },
];

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

  if (releasesState.loading) {
    return (
      <Paper className={classes.spinnerWrap}>
        <CircularProgress size="5em" />
      </Paper>
    )
  }

  return (
    <TableContainer component={Paper}>
      <Toolbar>
        <Typography className={classes.title} variant="h6" id="tableTitle" component="div">
          Release History for &nbsp;
          <code>{namespace}</code>/<code>{releaseName}</code>
        </Typography>
      </Toolbar>
      <Table className={classes.table} size="small" aria-label="simple table">
        <EnhancedTableHead
            headCells={headCells}
            order={order}
            orderBy={orderBy}
            onRequestSort={handleRequestSort}
          />
        <TableBody>
        {stableSort(releasesState.revisions, getComparator(order, orderBy))
          .map(row => (
            <TableRow key={row.revision} >
              <TableCell align="right">{row.revision}</TableCell>
              <TableCell>{row.updated.split('.')[0]}</TableCell>
              <TableCell>{row.status}</TableCell>
              <TableCell>{row.description}</TableCell>
              <TableCell>{row.chart}</TableCell>
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


