import { Avatar, Paper, Button, Typography, Link } from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { setLinkProps } from 'hookrouter';
import PropTypes from 'prop-types';
import React from 'react';

import logo from './../../forto_150.png';

const useStyles = makeStyles(theme => ({
  paper: {
    margin: theme.spacing(2, 0),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.primary.main,
    display: 'grid',
    alignItems: 'center',
    gridTemplateColumns: 'min-content 1fr max-content',
    gridGap: theme.spacing(0, 2),
    [theme.breakpoints.down('xs')]: {
      gridTemplateAreas: [
        'logo title',
        'logo environment',
        '__   userInfo',
        '__   logout',
      ].map(x => `'${x}'`).join(' '),
    },
    [theme.breakpoints.only('sm')]: {
      gridTemplateAreas: [
        'logo title       title',
        'logo environment logout',
        '__   userInfo    logout',
      ].map(x => `'${x}'`).join(' '),
    },
    [theme.breakpoints.up('md')]: {
      gridTemplateAreas: [
        'logo title       userInfo logout',
        'logo environment userInfo logout',
      ].map(x => `'${x}'`).join(' '),
    },
  },
  logo: {
    gridArea: 'logo',
    width: 64,
    height: 64,
  },
  title: {
    gridArea: 'title',
    lineHeight: 1.1,
    padding: theme.spacing(0.5, 0),
  },
  environment: {
    gridArea: 'environment',
    textTransform: 'uppercase',
    lineHeight: 1.2,
    padding: theme.spacing(0.5, 0),
  },
  userInfo: {
    gridArea: 'userInfo',
    lineHeight: 1.2,
    padding: theme.spacing(0.5, 0),
  },
  logout: {
    gridArea: 'logout',
  },
}));

export default function AppHeader(props) {
  const { email, environment, isMock } = props?.userData ?? {};
  const [ handle, domain ] = email?.split('@') ?? [];

  const theme = useTheme();
  const classes = useStyles(theme);

  const doLogout = () => {
    // works because the cookie isn't HttpOnly (as of writing)
    document.cookie = "helm-rollback-web= ; expires = Thu, 01 Jan 1970 00:00:00 GMT"
    document.location.reload();
  };

  return (
    <Paper className={classes.paper}>

      <Avatar className={classes.logo} src={logo} alt="logo" />

      <Typography className={classes.title} variant="h4" component="h1">
        <Link  {...setLinkProps({
          href: `/`,
        })} style={{ color: 'inherit' }}>
          Helm Rollback Tool
        </Link>
      </Typography>

      <Typography className={classes.environment} variant="subtitle1">
        <strong>{environment || 'unknown'}</strong> environment
      </Typography>

      {email ? (<>
        <Typography className={classes.userInfo} variant="subtitle1" component="p">
          <strong>{handle}</strong>@{domain}
        </Typography>

        <Button className={classes.logout} variant="contained"
            color="secondary"
            onClick={doLogout}
            disabled={isMock}
          >Log out</Button>
      </>) : null}

    </Paper>
  );
}
AppHeader.propTypes = {
  environment: PropTypes.string.isRequired,
  userData: PropTypes.shape({
    email: PropTypes.string,
    environment: PropTypes.string,
    isMock: PropTypes.bool,
  }).isRequired,
};
