import React, { useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Button, Container, Typography, Table, TableBody, TableCell, TableContainer, TableRow, Paper } from '@material-ui/core';

import EnhancedTableHead from '../EnhancedTableHead/EnhancedTableHead.jsx';
import { stableSort, getComparator } from '../../util/sorting.js';

const loginURL = "/login-status"
const releasesURL = "/helm-list"

const headCells = [
  { id: 'namespace', numeric: false, disablePadding: true, label: 'Namespace' },
  { id: 'name', numeric: false, disablePadding: true, label: 'Release Name' },
  { id: 'chart', numeric: false, disablePadding: true, label: 'Chart' },
  { id: 'revision', numeric: true, disablePadding: false, label: 'Revision' },
  { id: 'updated', numeric: false, disablePadding: true, label: 'Release Date' },
  { id: 'app_version', numeric: true, disablePadding: false, label: 'Version' },
  { id: 'action', numeric: true, disablePadding: false, label: 'Action' },
];
const sampleData = [{"name":"booking-core","namespace":"yarrrnicorns","revision":"8","updated":"2021-03-03 15:21:34.343751141 +0000 UTC","status":"deployed","chart":"booking-core-0.1.0","app_version":"22b7727ddd5454a427701fb9fddf4c28e8258ce0"},{"name":"booking-request-core","namespace":"nexus","revision":"11","updated":"2021-02-26 10:22:06.122757189 +0000 UTC","status":"deployed","chart":"booking-request-core-0.1.0","app_version":"02f27dacc475a4e3a806eb0165faeab6310045a7"},{"name":"currency-core","namespace":"yarrrnicorns","revision":"4","updated":"2021-03-01 08:45:44.291841847 +0000 UTC","status":"deployed","chart":"currency-core-0.1.0","app_version":"ab46f0e145de72be0ad855fd6fc8ca3c2ac39ad1"},{"name":"customer-core","namespace":"nexus","revision":"4","updated":"2021-03-02 13:57:06.443292751 +0000 UTC","status":"deployed","chart":"customer-core-0.1.0","app_version":"22002d5f9ca8771dcf6ab9ea864243f814c54f0b"},{"name":"datadog","namespace":"datadog","revision":"28","updated":"2020-04-25 12:02:35.302967792 +0200 CEST","status":"deployed","chart":"datadog-2.0.14","app_version":"7"},{"name":"external-dns","namespace":"sre-tooling","revision":"16","updated":"2020-04-25 12:02:35.0378666 +0200 CEST","status":"deployed","chart":"external-dns-2.20.15","app_version":"0.7.1"},{"name":"foreign-currency-exchange-core","namespace":"yarrrnicorns","revision":"5","updated":"2021-03-04 16:30:43.515086591 +0000 UTC","status":"deployed","chart":"foreign-currency-exchange-core-0.1.0","app_version":"2ac86025a7ac3498eea512c18bbdd3fc4da709e8"},{"name":"fortox-backend","namespace":"pomato","revision":"1074","updated":"2021-03-05 08:24:06.466948093 +0000 UTC","status":"deployed","chart":"fortox-backend-0.1.0","app_version":"680972d0ba47bcbcf7fa062743fbc0aea400e3fc"},{"name":"freight-gate","namespace":"tnt","revision":"12","updated":"2021-03-04 14:17:38.865137759 +0000 UTC","status":"deployed","chart":"freight-gate-0.1.0","app_version":"050ea74ce57e55467d89dd7104ccec8eaa40f136"},{"name":"quotation-core","namespace":"yarrrnicorns","revision":"6","updated":"2021-03-03 15:25:04.966585948 +0000 UTC","status":"deployed","chart":"quotation-core-0.1.0","app_version":"38219213b375e0c5a2a413866e09eb8f9a40b9d5"},{"name":"schedules-core","namespace":"yarrrnicorns","revision":"4","updated":"2021-03-01 16:58:29.737290727 +0000 UTC","status":"deployed","chart":"schedules-core-0.1.0","app_version":"f4ea8357cffc0123da40514c0e7ccf181261bb04"},{"name":"shipment-health","namespace":"tnt","revision":"14","updated":"2021-03-03 08:37:36.571528852 +0000 UTC","status":"deployed","chart":"shipment-health-0.1.0","app_version":"1780d1213cf50f692a3f40d856b2b8add7031883"},{"name":"tms","namespace":"frontend","revision":"101","updated":"2021-03-04 16:43:24.911018479 +0000 UTC","status":"deployed","chart":"tms-0.1.0","app_version":"cb1bd0cf4d0d08130360b523db0c5864339a3417"},{"name":"transport-plan","namespace":"tnt","revision":"22","updated":"2021-03-05 02:58:19.889637962 +0000 UTC","status":"deployed","chart":"transport-plan-0.1.0","app_version":"7d64c5195f1f3c2b3d0e4aef0670bd0173638b8d"},{"name":"transportplan-redis","namespace":"tnt","revision":"3","updated":"2020-11-04 09:02:04.047425 +0100 CET","status":"deployed","chart":"redis-10.6.12","app_version":"5.0.9"},{"name":"unleash","namespace":"sre-tooling","revision":"13","updated":"2021-01-28 08:48:47.189032409 +0000 UTC","status":"deployed","chart":"unleash-0.1.0","app_version":"67e9b20ce66cabc65f6d85a6ab0072ee90a966d8"},{"name":"websocket-core","namespace":"nexus","revision":"3","updated":"2021-02-25 16:24:51.482020158 +0000 UTC","status":"deployed","chart":"websocket-core-0.1.0","app_version":"8410731f42075e6519e57c4bcf29e5ba798cb353"}]
const sampleLoginData = {"email":"fake@forto.com"}

export default function LoginOrReleases() {
  const useStyles = makeStyles({
    table: {
      minWidth: 650,
    },
  });
  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState('name');
  const [appState, setAppState] = React.useState({});
  const [releasesState, setReleasesState] = React.useState({loading:true,'releaseData':[]});
  const classes = useStyles();

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  useEffect(() => {
    if (window.location.href.split("/")[2].substr(0,14) === "localhost:3000") {
      setAppState({userData: sampleLoginData, loading: false })
    } else {
      let actualURL = loginURL
      fetch(actualURL).then((res) => res.json().then((data)=>{
        setAppState({userData: data, loading: false })
      }));
    }
  }, [setAppState]);

  useEffect(() => {
    if (window.location.href.split("/")[2].substr(0,14) === "localhost:3000") {
      setReleasesState({releasesData: sampleData, loading: false })
    } else {
      let actualURL = releasesURL
      fetch(actualURL).then((res) => res.json().then((data)=>{
        setReleasesState({releasesData: data, loading: false })
      }));
    }
  }, [setReleasesState]);

  let dd = appState.userData;
  let releases = releasesState.releasesData;
  if (window.location.href.split("/")[2].substr(0,14) === "localhost:3000") {
      dd = sampleLoginData
  }
  if (dd == null || !dd.hasOwnProperty("email") || dd.email == null) {
    return(
      <Container>
        <Typography variant="h5" component="h2" gutterBottom>
          Tool to rollback releases that are installed, to be used by engineers and product managers alike.
        </Typography>
        <Typography variant="h6" component="p" gutterBottom>
          To view releases, log in above.
        </Typography>
      </Container>
    );
  } else {
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
                  <Button variant="contained" color="primary" href={`/release/${release.namespace}/${release.name}`}>🔍</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }
}
