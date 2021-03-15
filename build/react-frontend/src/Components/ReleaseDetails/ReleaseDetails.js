import React, { useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Button, Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Paper } from '@material-ui/core';
import PropTypes from 'prop-types';
import 'react-confirm-alert/src/react-confirm-alert.css';

const sampleData = [{"revision":4,"updated":"2020-07-01T08:02:46.685420988Z","status":"superseded","chart":"unleash-0.1.0","app_version":"b4563c9baa7617b137d8b272b7882968452ee952","description":"Upgrade complete"},{"revision":5,"updated":"2020-07-02T07:52:45.2940391Z","status":"superseded","chart":"unleash-0.1.0","app_version":"4ef59b8397f0f20e20a8955682829454a7031618","description":"Upgrade complete"},{"revision":6,"updated":"2020-07-02T11:04:21.905965626Z","status":"superseded","chart":"unleash-0.1.0","app_version":"87202bbfe0c323a26d7646261b8fdc60577fd1d4","description":"Upgrade complete"},{"revision":7,"updated":"2020-07-02T11:19:52.505235401Z","status":"superseded","chart":"unleash-0.1.0","app_version":"9ad5627b22f8a04708a3590a01cd1c0f5ee0fe60","description":"Upgrade complete"},{"revision":8,"updated":"2020-07-02T12:06:32.407068701Z","status":"superseded","chart":"unleash-0.1.0","app_version":"eadca9f31526d68a9d6fac17f32918d814f7398e","description":"Upgrade complete"},{"revision":9,"updated":"2020-07-03T10:11:12.806231454Z","status":"superseded","chart":"unleash-0.1.0","app_version":"cc75c65ffdca5dc085df96a4b15107df43a4bfa7","description":"Upgrade complete"},{"revision":10,"updated":"2020-10-07T12:48:20.868948428Z","status":"superseded","chart":"unleash-0.1.0","app_version":"1c6111dbef0c74e3d12c68e7d67f031b6e790dd1","description":"Upgrade complete"},{"revision":11,"updated":"2020-10-08T08:04:06.065204968Z","status":"superseded","chart":"unleash-0.1.0","app_version":"8ac30783abeab398a3ab2d82488983de9f919772","description":"Upgrade complete"},{"revision":12,"updated":"2020-10-09T13:49:15.64685762Z","status":"superseded","chart":"unleash-0.1.0","app_version":"6368e944160609e840b120666c0494dd3e1c8f3c","description":"Upgrade complete"},{"revision":13,"updated":"2021-01-28T08:48:47.189032409Z","status":"deployed","chart":"unleash-0.1.0","app_version":"67e9b20ce66cabc65f6d85a6ab0072ee90a966d8","description":"Upgrade complete"}]
const sampleLoginData = {"email":"fake@forto.com"}
const loginURL = "/login-status"

const headCells = [
  { id: 'revision', numeric: true, disablePadding: true, label: 'Revision' },
  { id: 'updated', numeric: false, disablePadding: true, label: 'Release Date' },
  { id: 'status', numeric: false, disablePadding: true, label: 'Status' },
  { id: 'chart', numeric: false, disablePadding: true, label: 'Chart' },
  { id: 'app_version', numeric: true, disablePadding: false, label: 'Version' },
  { id: 'action', numeric: true, disablePadding: false, label: 'Action' },
];


function descendingComparator(a, b, orderBy) {
  if (!isNaN(parseInt(a[orderBy])) && (!isNaN(parseInt(b[orderBy])))) {
    if (parseInt(b[orderBy]) < parseInt(a[orderBy])) {
      return -1;
    }
    if (parseInt(b[orderBy]) > parseInt(a[orderBy])) {
      return 1;
    }
    return 0;
  }
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function EnhancedTableHead(props) {
  const { classes, order, orderBy, onRequestSort } = props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            padding={headCell.disablePadding ? 'none' : 'default'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <span className={classes.visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </span>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}
EnhancedTableHead.propTypes = {
  classes: PropTypes.object.isRequired,
  numSelected: PropTypes.number.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  onSelectAllClick: PropTypes.func.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired,
};

export default function ReleaseDetails() {
  const useStyles = makeStyles({
    table: {
      minWidth: 650,
    },
  });
  const [appState, setAppState] = React.useState('userData');
  const [releasesState, setReleasesState] = React.useState({loading:true,'releaseData':[]});
  const [order, setOrder] = React.useState('listOrder');
  const [orderBy, setOrderBy] = React.useState('listOrderBy');
  const classes = useStyles();
  const namespace = window.location.href.split("/")[4]
  const releasename = window.location.href.split("/")[5]
  const releasesURL = "/helm-history/"+namespace+"/"+releasename

  const handleRequestSort = (event, property) => {
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
      <TableContainer component={Paper}
          order={order}
          orderBy={orderBy}
          onRequestSort={handleRequestSort}>
        <Table className={classes.table} size="small" aria-label="simple table">
          <EnhancedTableHead onRequestSort={handleRequestSort}>
            <TableRow>
              <TableCell>Release Name</TableCell>
              <TableCell align="right">Revision</TableCell>
            </TableRow>
          </EnhancedTableHead>
          <TableBody>
          {stableSort(releases, getComparator(order, orderBy))
            .map((row, index) => {
              const labelId = `enhanced-table-${index}`;
              let rollbackhref = "/rollback/"+namespace+"/"+releasename+"/"+row.revision
              return (
                <TableRow key={row.name} >
                  <TableCell align="right">
                    {row.revision}
                  </TableCell>
                  <TableCell align="right">{row.updated}</TableCell>
                  <TableCell>
                    {row.status}
                  </TableCell>
                  <TableCell>
                    {row.chart}
                  </TableCell>
                  <TableCell align="right">{row.app_version}</TableCell>
                  <TableCell align="right"><Button variant="contained" color="primary" href={rollbackhref}>↩️</Button></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }
}
