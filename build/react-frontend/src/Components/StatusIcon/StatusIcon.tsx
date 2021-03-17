import { green, red, grey, yellow } from '@material-ui/core/colors';
import { makeStyles } from '@material-ui/core/styles';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import InfoIcon from '@material-ui/icons/Info';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import PropTypes from 'prop-types';
import React from 'react';

const useStyles = makeStyles({
  wrap: {
    display: 'inline-block',
    verticalAlign: 'middle',
    margin: '0 0.5em',
  },
});


export default function StatusIcon({ status }: {
  status: string;
}) {
  const classes = useStyles();

  let Icon = InfoIcon;
  let color: string = yellow[500];
  if (status === 'deployed') {
    Icon = CheckCircleIcon;
    color = green[500];
  }
  if (status === 'failed') {
    Icon = ErrorIcon;
    color = red[500];
  }
  if (status === 'superseded') {
    Icon = RadioButtonUncheckedIcon;
    color = grey[300];
  }

  return (
    <abbr className={classes.wrap} title={status}>
      <Icon style={{ color }} />
    </abbr>
  );
}
StatusIcon.propTypes = {
  status: PropTypes.string.isRequired,
};
