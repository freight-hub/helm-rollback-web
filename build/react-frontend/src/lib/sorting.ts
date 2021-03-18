import { useState } from "react";

interface SortState {
  field: string;
  order: 'asc' | 'desc';
}
export function useSortState(initial: SortState) {
  const [ state, setState ] = useState(initial);

  const handleRequestSort = (property: string) => {
    const isAsc = state.field === property && state.order === 'asc';
    setState({
      field: property,
      order: isAsc ? 'desc' : 'asc',
    });
  };

  return [ state, handleRequestSort ];
}

export function descendingComparator<T>(
  a: T, b: T,
  orderBy: keyof T,
) {
  const aVal = a[orderBy];
  const bVal = b[orderBy];
  if (typeof aVal === 'string' && typeof bVal === 'string') {
    if (!isNaN(parseInt(aVal)) && (!isNaN(parseInt(bVal)))) {
      if (parseInt(bVal) < parseInt(aVal)) {
        return -1;
      }
      if (parseInt(bVal) > parseInt(aVal)) {
        return 1;
      }
      return 0;
    }
  }
  if (bVal < aVal) {
    return -1;
  }
  if (bVal > aVal) {
    return 1;
  }
  return 0;
}

export function stableSort<T>(
  array: T[],
  comparator: (a: T, b: T) => -1 | 0 | 1,
) {
  const stabilizedThis = array.map((el, index) => [ el, index ] as const);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

export function getComparator<T>(
  order: 'asc' | 'desc',
  orderBy: keyof T,
) {
  return order === 'desc'
    ? (a: T, b: T) => descendingComparator(a, b, orderBy)
    : (a: T, b: T) => -descendingComparator(a, b, orderBy);
}
