import { Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import WarningIcon from '@material-ui/icons/Warning';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';

import { DefaultRollbackApi } from '../../lib/rollback-api';

const CLUSTER_NANNY_BASE = 'https://cluster-nanny.forto.tools';

const useStyles = makeStyles({
  banner: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75em',
    padding: '1em 1.5em',
    background: '#e65100',
    color: '#fff',
  },
  bannerStandalone: {
    borderRadius: '4px',
    marginBottom: '1em',
  },
});

function detectFlux(revisions) {
  const firstChart = revisions[0]?.chart;
  return !!firstChart && revisions.some(r => r.chart !== firstChart);
}

export default function FluxBanner({ namespace, releaseName, environment, standalone, revisions }) {
  const classes = useStyles();
  const [fetchedIsFlux, setFetchedIsFlux] = React.useState(false);

  useEffect(() => {
    if (revisions != null) return;
    let active = true;
    DefaultRollbackApi.getReleaseHistory(namespace, releaseName)
      .then(data => {
        if (active) setFetchedIsFlux(detectFlux(data));
      })
      .catch(e => {
        console.error('FluxBanner: failed to fetch release history', e);
        if (active) setFetchedIsFlux(false);
      });
    return () => { active = false; };
  }, [namespace, releaseName, revisions]);

  const isFlux = revisions != null ? detectFlux(revisions) : fetchedIsFlux;

  if (!isFlux) return null;

  const url = environment
    ? `${CLUSTER_NANNY_BASE}/environments/by-id/${encodeURIComponent(environment)}/components/by-release-name/${encodeURIComponent(releaseName)}/rollback`
    : null;

  const cx = [classes.banner, standalone && classes.bannerStandalone].filter(Boolean).join(' ');

  return (
    <div className={cx}>
      <WarningIcon fontSize="large" />
      <Typography variant="body1">
        This service is deployed via Flux. Rollbacks should be done in{' '}
        {url ? (
          <a href={url} target="_blank" rel="noreferrer" style={{ color: 'inherit', fontWeight: 'bold', textDecoration: 'underline' }}>
            Cluster Nanny
          </a>
        ) : 'Cluster Nanny'}
        , not here!
      </Typography>
    </div>
  );
}
FluxBanner.propTypes = {
  namespace: PropTypes.string.isRequired,
  releaseName: PropTypes.string.isRequired,
  environment: PropTypes.string,
  standalone: PropTypes.bool,
  revisions: PropTypes.array,
};
