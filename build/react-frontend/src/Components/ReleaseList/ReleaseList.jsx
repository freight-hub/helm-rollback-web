import { Button, Table, TableBody, TableCell, TableContainer, TableRow, Toolbar, Paper, Typography, CircularProgress, Link } from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import { useTitle, setLinkProps } from 'hookrouter';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';

import { DefaultRollbackApi } from "../../lib/rollback-api";
import { stableSort, getComparator, useSortState } from '../../lib/sorting.ts';
import EnhancedTableHead from '../EnhancedTableHead/EnhancedTableHead.jsx';
import StatusIcon from '../StatusIcon/StatusIcon.tsx';
import Timestamp from '../Timestamp/Timestamp.tsx';

const headCells = [
  { id: 'namespace', numeric: false, disablePadding: false, label: 'Namespace' },
  { id: 'name', numeric: false, disablePadding: false, label: 'Release Name' },
  { id: 'chart', numeric: false, disablePadding: false, label: 'Chart' },
  { id: 'updated', numeric: false, disablePadding: false, label: 'Release Date' },
  { id: 'revision', numeric: true, disablePadding: false, label: 'Revision' },
  { id: 'action', numeric: false, disablePadding: false, label: '' },
];

const useStyles = makeStyles({
  spinnerWrap: {
    textAlign: 'center',
    padding: '2em',
  },
  releaseSummaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'min-content 1fr',
    gridTemplateAreas: "'icon release' 'icon updated'",
  },
});

export default function ReleaseList(props) {
  useTitle(`Release List - Helm Rollback`);
  const { allReleases, namespace } = props;

  const theme = useTheme();
  const classes = useStyles();
  const [ releaseOrder, setReleaseOrder ] = useSortState({ field: 'name', order: 'asc' });
  const [ nsOrder, setNsOrder ] = useSortState({ field: 'namespace', order: 'asc' });

  const [ releasesState, setReleasesState ] = React.useState({ loading: true, list: [] });
  useEffect(() => {
    DefaultRollbackApi.getReleaseList().then((data) => {
      setReleasesState({ list: data, loading: false })
    });
  }, [ setReleasesState ]);

  const [ nsList, setNsList ] = React.useState([]);
  useEffect(() => {
    const namespaceMap = releasesState.list.reduce((map, rel) => {
      const existing = map.get(rel.namespace);
      if (!existing || existing.updated < rel.updated) {
        map.set(rel.namespace, rel);
      }
      return map;
    }, new Map());
    setNsList(Array.from(namespaceMap.values()));
  }, [ setNsList, releasesState ]);

  const releases = releasesState.list;

  if (releasesState.loading) {
    return (
      <Paper className={classes.spinnerWrap}>
        <CircularProgress size="5em" />
      </Paper>
    )
  }

  if (namespace) {
    const ourReleases = releases.filter(x => x.namespace === namespace);
    return (
      <TableContainer component={Paper}>
        <Toolbar>
          <Typography className={classes.title} variant="h6" id="tableTitle" component="div">
            Helm Releases in <code>{namespace}</code>
          </Typography>
        </Toolbar>
        <Table className={classes.table} size="small" aria-label="simple table">
          <EnhancedTableHead
              headCells={headCells.slice(1)}
              order={releaseOrder.order}
              orderBy={releaseOrder.field}
              onRequestSort={setReleaseOrder}
            />
          <TableBody>
          {stableSort(ourReleases, getComparator(releaseOrder.order, releaseOrder.field))
            .map(release => (
              <TableRow key={`${release.namespace}/${release.name}`} >
                <TableCell>
                  <Link color="inherit" {...setLinkProps({
                      href: `/release/${release.namespace}/${release.name}`,
                    })} style={{ display: 'block' }}>
                    <StatusIcon status={release.status} />
                    {release.name}
                  </Link>
                </TableCell>
                <TableCell>{release.chart}</TableCell>
                <TableCell><Timestamp date={release.updated} /></TableCell>
                <TableCell align="right">#{release.revision}</TableCell>
                <TableCell align="right">
                  <Button variant="contained" {...setLinkProps({
                    href: `/release/${release.namespace}/${release.name}`,
                  })}><ChevronRightIcon /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  if (allReleases) {
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
              order={releaseOrder.order}
              orderBy={releaseOrder.field}
              onRequestSort={setReleaseOrder}
            />
          <TableBody>
          {stableSort(releases, getComparator(releaseOrder.order, releaseOrder.field))
            .map(release => (
              <TableRow key={`${release.namespace}/${release.name}`} >
                <TableCell>{release.namespace}</TableCell>
                <TableCell>
                  <Link color="inherit" {...setLinkProps({
                      href: `/release/${release.namespace}/${release.name}`,
                    })} style={{ display: 'block' }}>
                    <StatusIcon status={release.status} />
                    {release.name}
                  </Link>
                </TableCell>
                <TableCell>{release.chart}</TableCell>
                <TableCell><Timestamp date={release.updated} /></TableCell>
                <TableCell align="right">#{release.revision}</TableCell>
                <TableCell align="right">
                  <Button variant="contained" {...setLinkProps({
                    href: `/release/${release.namespace}/${release.name}`,
                  })}><ChevronRightIcon /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
      <TableContainer component={Paper}>
        <Toolbar>
          <Typography className={classes.title} variant="h6" id="tableTitle" component="div">
            Namespace Listing
          </Typography>
        </Toolbar>
        <Table className={classes.table} size="small" aria-label="simple table">
          <EnhancedTableHead
              headCells={[
                { id: 'namespace', numeric: false, disablePadding: false, label: 'Namespace' },
                { id: 'updated', numeric: false, disablePadding: false, label: 'Most Recently Deployed' },
                { id: 'action', numeric: false, disablePadding: false, label: '' },
              ]}
              order={nsOrder.order}
              orderBy={nsOrder.field}
              onRequestSort={setNsOrder}
            />
          <TableBody>
          {stableSort(nsList, getComparator(nsOrder.order, nsOrder.field))
            .map(release => (
              <TableRow key={`${release.namespace}/${release.name}`} >
                <TableCell>
                  <Link color="inherit" {...setLinkProps({
                    href: `/namespace/${release.namespace}`,
                  })} style={{ display: 'block', fontWeight: 500 }}>
                    {release.namespace}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className={classes.releaseSummaryGrid}>
                    <StatusIcon style={{ gridArea: 'icon', alignSelf: 'center' }} status={release.status} />
                    <Link style={{ gridArea: 'release' }} color="inherit" {...setLinkProps({
                        href: `/release/${release.namespace}/${release.name}`,
                      })}>{release.name}</Link>
                    <div style={{ gridArea: 'updated' }}>
                      <Timestamp date={release.updated} />
                    </div>
                  </div>
                </TableCell>
                <TableCell align="right">
                  <Button variant="contained" {...setLinkProps({
                    href: `/namespace/${release.namespace}`,
                  })}><ChevronRightIcon /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <div style={{ margin: theme.spacing(1) }} />

      <TableContainer component={Paper}>
        <Toolbar>
          <Typography className={classes.title} variant="h6" id="tableTitle" component="div">
            Most Recently Deployed
          </Typography>
          <div style={{ flexGrow: 1 }} />
          <Button color="inherit" variant="outlined" {...setLinkProps({
              href: `/all-releases`,
            })}>View All Releases</Button>
        </Toolbar>
        <Table className={classes.table} size="small" aria-label="simple table">
          <EnhancedTableHead
              headCells={[
                { id: 'updated', numeric: false, disablePadding: false, label: 'Deploy Timestamp' },
                { id: 'namespace', numeric: false, disablePadding: false, label: 'Namespace' },
                { id: 'action', numeric: false, disablePadding: false, label: '' },
              ]}
              order={'desc'}
              orderBy={'updated'}
            />
          <TableBody>
          {stableSort(releases, getComparator('desc', 'updated'))
            .slice(0, 10)
            .map(release => (
              <TableRow key={`${release.namespace}/${release.name}`} >
                <TableCell>
                  <div className={classes.releaseSummaryGrid}>
                    <StatusIcon style={{ gridArea: 'icon', alignSelf: 'center' }} status={release.status} />
                    <Link style={{ gridArea: 'release', fontWeight: 500 }} color="inherit" {...setLinkProps({
                        href: `/release/${release.namespace}/${release.name}`,
                      })}>{release.name}</Link>
                    <div style={{ gridArea: 'updated' }}>
                      <Timestamp date={release.updated} />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Link color="inherit" {...setLinkProps({
                    href: `/namespace/${release.namespace}`,
                  })} style={{ display: 'block' }}>
                    {release.namespace}
                  </Link>
                </TableCell>
                <TableCell align="right">
                  <Button variant="contained" {...setLinkProps({
                    href: `/release/${release.namespace}/${release.name}`,
                  })}><ChevronRightIcon /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}
ReleaseList.propTypes = {
  namespace: PropTypes.string,
  allReleases: PropTypes.bool,
};


