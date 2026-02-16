import { Paper, Button, CircularProgress, Typography } from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { Link as RouterLink } from 'raviger';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';

import { useTitle } from "../../lib/use-title";
import { DefaultRollbackApi } from "../../lib/rollback-api";

const useStyles = makeStyles(theme => ({
  grid: {
    display: 'grid',
    gridGap: theme.spacing(2),
    [theme.breakpoints.up('md')]: {
      gridTemplateColumns: '3fr 2fr',
      alignItems: 'flex-start',
    },
  },
  paperPadding: {
    padding: theme.spacing(2, 3),
  },
  buttonBox: {
    textAlign: 'center',
    padding: theme.spacing(1, 2, 1),
  },
}));

export default function RollBackDetails(props) {
  const { namespace, releaseName, revision } = props;
  useTitle(`${releaseName} - ${namespace} - Helm Rollback`);

  const theme = useTheme()
  const classes = useStyles(theme);

  // idle --UI-> triggered --EFFECT-> running --API-> done
  const [ commandState, setCommandState ] = React.useState('idle');
  function triggerRollback() {
    if (commandState !== 'idle') return;
    setCommandState('triggered');
  }

  const [ commandText, setCommandText ] = React.useState('');
  useEffect(() => {
    if (commandState !== 'triggered') return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCommandState('running');

    DefaultRollbackApi
      .performRollback(namespace, releaseName, revision)
      .then(setCommandText)
      .then(() => setCommandState('done'))
  }, [
    commandState, setCommandState,
    setCommandText,
    namespace, releaseName, revision,
  ]);

  const sp = (
    <span style={{ whiteSpace: 'break-spaces' }}> </span>
  );

  function RollbackCard () { switch (commandState) {

    case 'idle': {
      return (<>
        <p>
          Are you sure you want to rollback to this release?
        </p>
        <p>
          This action will start bringing up the desired Kubernetes Pods nearly immediately.
        </p>
        <div className={classes.buttonBox}>
          <Button variant="contained" color="primary" onClick={triggerRollback}>
            🚨 🚨 Begin rollback process now! 🚨 🚨
          </Button>
        </div>
      </>);
    }

    case 'running': {
      return (
        <div style={{ textAlign: 'center' }}>
          <p>Waiting for helm command to finish.... This usually happens immediately.</p>
          <CircularProgress size="5em" />
        </div>
      );
    }

    case 'done': {
      return (
        <pre>{commandText}</pre>
      );
    }

    default: { // triggered
      return (
          <p>Rollack state: {commandState}</p>
      );
    }
  }}

  const logParams = new URLSearchParams({
    query: [
      `kube_namespace:${namespace}`,
      `kube_app_instance:${releaseName}`,
    ].join(' '),
    cols: [
      'cluster_name',
      'pod_name',
    ].join(','),
    live: 'true',
    stream_sort: 'desc',
  });

  return (
    <div className={classes.grid}>

      <Paper className={classes.paper}>
        <div className={classes.paperPadding}>

        <Button variant="outlined" component={RouterLink}
            href={`/release/${namespace}/${releaseName}`}
            style={{ float: 'right' }}>Back to release history</Button>

          <Typography className={classes.title} variant="h6" id="tableTitle" component="div">
            Rollback of &nbsp;
            <code>{namespace}</code>/<code>{releaseName}</code>
          </Typography>
          {RollbackCard()}
        </div>
      </Paper>

      <Paper className={classes.paper}>
        <div className={classes.paperPadding}>
          <Typography className={classes.title} variant="h6" id="tableTitle" component="div">
            Information
          </Typography>
          <p>
            Please note that a Helm rollback will usually be reset by the next successful deployment from CI.
          </p>
          <p>
            To monitor the related pods, use a kubectl command such as:
          </p>
          <p style={{ whiteSpace: 'nowrap' }}>
            <code>kubectl get pods{sp}--namespace {namespace}{sp}-l app.kubernetes.io/instance={releaseName}{sp}--watch</code>
          </p>
          <p>
            <a href={`https://app.datadoghq.eu/logs?${logParams}`} target="_blank" rel="noreferrer">
              View application logs in Datadog
            </a>
          </p>
        </div>
      </Paper>
    </div>
  )
}
RollBackDetails.propTypes = {
  namespace: PropTypes.string.isRequired,
  releaseName: PropTypes.string.isRequired,
  revision: PropTypes.string.isRequired,
};
