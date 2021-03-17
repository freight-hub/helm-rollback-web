
export function descendingComparator(a, b, orderBy) {
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

export function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [ el, index ]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

export function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}
