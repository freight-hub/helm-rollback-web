import { red, grey, lightBlue, teal, purple, orange } from '@material-ui/core/colors';
import { createMuiTheme, Theme } from '@material-ui/core/styles';
import type { PaletteOptions } from '@material-ui/core/styles/createPalette';

const palette: PaletteOptions = {
  type: 'light',
  error: {
    main: red.A400,
  },
};
const typography = {
  fontFamily: 'Inter, sans-serif',
};

function createColorTheme(color: Record<string, string>) {
  return createMuiTheme({
    palette: {
      ...palette,
      primary: {
        main: color[300],
      },
      secondary: {
        main: color[400],
      },
      background: {
        default: color[900],
      },
    },
    typography,
  });
}

// Our red theme is custom (kinda maroon)
const specialRed = {
  300: '#fa6167',
  400: '#fbb6b9',
  900: '#57080A',
};

const colorThemes: Record<string, Theme | undefined> = {
  red: createColorTheme(specialRed),
  grey: createColorTheme(grey),
  blue: createColorTheme(lightBlue),
  teal: createColorTheme(teal),
  purple: createColorTheme(purple),
  orange: createColorTheme(orange),
};

export function getTheme(themeName: string) {
  return colorThemes[themeName] || createColorTheme(grey);
}
