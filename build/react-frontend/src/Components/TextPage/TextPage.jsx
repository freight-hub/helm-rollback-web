import { Typography, Paper } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import React from 'react';

const useStyles = makeStyles({
  container: {
    maxWidth: '50em',
    margin: '5em auto 2em',
    padding: '2em',
    textAlign: 'center',
  },
});

export default function TextPage(props) {
  const classes = useStyles();

  return (
    <Paper className={classes.container}>

      <Typography variant="h3" gutterBottom>
        {props.title}
      </Typography>

      <Typography variant="p" gutterBottom>
        {props.children}
      </Typography>

    </Paper>
  );
}
TextPage.propTypes = {
  title: PropTypes.string.isRequired,
};
