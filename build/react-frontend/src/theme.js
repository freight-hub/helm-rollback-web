import { red } from '@material-ui/core/colors';
import { createMuiTheme } from '@material-ui/core/styles';

const palette = {
  type: 'light',
  error: {
    main: red.A400,
  },
};
const typography = {
  fontFamily: 'Inter, sans-serif',
};

export const blueTheme = createMuiTheme({
  palette: {
    ...palette,
    primary: {
      main: '#61dafb',
    },
    secondary: {
      main: '#b5ecfb',
    },
    background: {
      default: '#122b80',
    },
  },
  typography,
});

export const redTheme = createMuiTheme({
  palette: {
    ...palette,
    primary: {
      main: '#fa6167',
    },
    secondary: {
      main: '#fbb6b9',
    },
    background: {
      default: '#57080A',
    },
  },
  typography,
});
