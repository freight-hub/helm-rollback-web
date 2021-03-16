import React, { useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Button, Table, TableBody, TableCell, TableContainer, TableRow, Paper } from '@material-ui/core';
import { useTitle, setLinkProps } from 'hookrouter';

import EnhancedTableHead from '../EnhancedTableHead/EnhancedTableHead.jsx';
import { stableSort, getComparator } from '../../lib/sorting.js';
import { DefaultRollbackApi } from "../../lib/rollback-api";

const headCells = [
  { id: 'namespace', numeric: false, disablePadding: true, label: 'Namespace' },
  { id: 'name', numeric: false, disablePadding: true, label: 'Release Name' },
  { id: 'chart', numeric: false, disablePadding: true, label: 'Chart' },
  { id: 'revision', numeric: true, disablePadding: false, label: 'Revision' },
  { id: 'updated', numeric: false, disablePadding: true, label: 'Release Date' },
  { id: 'app_version', numeric: true, disablePadding: false, label: 'Version' },
  { id: 'action', numeric: true, disablePadding: false, label: 'Action' },
];

const useStyles = makeStyles({
  table: {
    minWidth: 650,
  },
});

export default function ReleaseList() {
  useTitle(`Release List - Helm Rollback`);

  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState('name');
  const [releasesState, setReleasesState] = React.useState({loading:true,list:[]});
  const classes = useStyles();

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  useEffect(() => {
    DefaultRollbackApi.getReleaseList().then((data) => {
      setReleasesState({list: data, loading: false })
    });
  }, [setReleasesState]);

  let releases = releasesState.list;

  if (releasesState.loading) {
    return <p>Sorry, still loading...</p>
  }
  return (
    <TableContainer component={Paper}>
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
              <TableCell>{release.name}</TableCell>
              <TableCell>{release.chart}</TableCell>
              <TableCell align="right">{release.revision}</TableCell>
              <TableCell align="right">{release.updated}</TableCell>
              <TableCell align="right">{release.app_version}</TableCell>
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
