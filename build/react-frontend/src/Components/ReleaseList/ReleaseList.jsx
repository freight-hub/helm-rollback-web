import { Button, Table, TableBody, TableCell, TableContainer, TableRow, Toolbar, Paper, Typography, CircularProgress } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useTitle, setLinkProps } from 'hookrouter';
import React, { useEffect } from 'react';

import { DefaultRollbackApi } from "../../lib/rollback-api";
import { stableSort, getComparator } from '../../lib/sorting.ts';
import EnhancedTableHead from '../EnhancedTableHead/EnhancedTableHead.jsx';
import StatusIcon from '../StatusIcon/StatusIcon.tsx';
import Timestamp from '../Timestamp/Timestamp.tsx';

const headCells = [
  { id: 'namespace', numeric: false, disablePadding: false, label: 'Namespace' },
  { id: 'name', numeric: false, disablePadding: false, label: 'Release Name' },
  { id: 'chart', numeric: false, disablePadding: false, label: 'Chart' },
  { id: 'updated', numeric: false, disablePadding: false, label: 'Release Date' },
  { id: 'revision', numeric: false, disablePadding: false, label: 'Revision' },
  { id: 'action', numeric: false, disablePadding: false, label: '' },
];

const useStyles = makeStyles({
  spinnerWrap: {
    textAlign: 'center',
    padding: '2em',
  },
});

export default function ReleaseList() {
  useTitle(`Release List - Helm Rollback`);

  const [ order, setOrder ] = React.useState('asc');
  const [ orderBy, setOrderBy ] = React.useState('name');
  const [ releasesState, setReleasesState ] = React.useState({ loading: true, list: [] });
  const classes = useStyles();

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  useEffect(() => {
    DefaultRollbackApi.getReleaseList().then((data) => {
      setReleasesState({ list: data, loading: false })
    });
  }, [ setReleasesState ]);

  let releases = releasesState.list;

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
          All Helm Releases
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
        {stableSort(releases, getComparator(order, orderBy))
          .map(release => (
            <TableRow key={`${release.namespace}/${release.name}`} >
              <TableCell>{release.namespace}</TableCell>
              <TableCell>
                <StatusIcon status={release.status} />
                {release.name}
              </TableCell>
              <TableCell>{release.chart}</TableCell>
              <TableCell><Timestamp date={release.updated} /></TableCell>
              <TableCell align="right">#{release.revision}</TableCell>
              <TableCell align="right">
                <Button variant="contained" color="primary" {...setLinkProps({
                  href: `/release/${release.namespace}/${release.name}`,
                })}>🔍</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
