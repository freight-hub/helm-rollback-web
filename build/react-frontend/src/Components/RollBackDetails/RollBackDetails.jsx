import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Paper } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useTitle } from 'hookrouter';

import { DefaultRollbackApi } from "../../lib/rollback-api";

const useStyles = makeStyles({
  paper: {
    padding: '2em',
    width: '50em',
    margin: '0 auto',
  },
});

export default function RollBackDetails(props) {
  const { namespace, releaseName, revision } = props;
  useTitle(`${releaseName} - ${namespace} - Helm Rollback`);
  const classes = useStyles();

  const [commandText, setCommandText] = React.useState(false);
  useEffect(() => {
    DefaultRollbackApi
      .performRollback(namespace, releaseName, revision)
      .then(setCommandText)
  }, [setCommandText, namespace, releaseName, revision]);

  if (commandText === false) {
    return (
      <Paper className={classes.paper}>
        <p>Waiting for helm command to finish.... This usually happens immediately.</p>
      </Paper>
    )
  } else {
    return (
      <Paper className={classes.paper}>
        <pre>{commandText}</pre>
      </Paper>
    )
  }
}
RollBackDetails.propTypes = {
  namespace: PropTypes.string.isRequired,
  releaseName: PropTypes.string.isRequired,
  revision: PropTypes.string.isRequired,
};


