import { Paper, Button, CircularProgress, Toolbar, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useTitle, setLinkProps } from 'hookrouter';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';

import { DefaultRollbackApi } from "../../lib/rollback-api";

const useStyles = makeStyles({
  paper: {
    width: '50em',
    margin: '0 auto',
  },
  paperPadding: {
    padding: '0 2em 2em',
  },
});

export default function RollBackDetails(props) {
  const { namespace, releaseName, revision } = props;
  useTitle(`${releaseName} - ${namespace} - Helm Rollback`);
  const classes = useStyles();

  const [ commandText, setCommandText ] = React.useState(false);
  useEffect(() => {
    DefaultRollbackApi
      .performRollback(namespace, releaseName, revision)
      .then(setCommandText)
  }, [ setCommandText, namespace, releaseName, revision ]);

  const toolbar = (
    <Toolbar>
      <Typography className={classes.title} variant="h6" id="tableTitle" component="div">
        Rollback of &nbsp;
        <code>{namespace}</code>/<code>{releaseName}</code>
      </Typography>
    </Toolbar>
  );

  if (commandText === false) {
    return (
      <Paper className={classes.paper} style={{ textAlign: 'center' }}>
        {toolbar}
        <div className={classes.paperPadding}>
          <p>Waiting for helm command to finish.... This usually happens immediately.</p>
          <CircularProgress size="5em" />
        </div>
      </Paper>
    )
  } else {
    return (
      <Paper className={classes.paper}>
        {toolbar}
        <div className={classes.paperPadding}>
          <pre>{commandText}</pre>
          <Button variant="contained" color="secondary" {...setLinkProps({
            href: `/release/${namespace}/${releaseName}`,
          })}>Back to release history</Button>
        </div>
      </Paper>
    )
  }
}
RollBackDetails.propTypes = {
  namespace: PropTypes.string.isRequired,
  releaseName: PropTypes.string.isRequired,
  revision: PropTypes.string.isRequired,
};


