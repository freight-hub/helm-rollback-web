import { Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import WarningIcon from '@material-ui/icons/Warning';
import PropTypes from 'prop-types';
import React from 'react';

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
  link: {
    color: 'inherit',
    fontWeight: 'bold',
    textDecoration: 'underline',
  },
});

function clusterNannyUrl(environment, component) {
  if (!environment) return CLUSTER_NANNY_BASE;
  const env = `${CLUSTER_NANNY_BASE}/environments/by-id/${encodeURIComponent(environment)}`;
  return component
    ? `${env}/components/by-name/${encodeURIComponent(component)}/rollback`
    : env;
}

export default function FluxBanner({ deployer, environment, standalone }) {
  const classes = useStyles();

  const isFlux = deployer.status === 'ok' && deployer.info.deployedBy === 'flux';
  if (!isFlux && deployer.status !== 'error') return null;

  const url = clusterNannyUrl(environment, isFlux ? deployer.info.component : null);
  const link = (
    <a href={url} target="_blank" rel="noreferrer" className={classes.link}>Cluster Nanny</a>
  );
  const cx = [classes.banner, standalone && classes.bannerStandalone].filter(Boolean).join(' ');

  return (
    <div className={cx}>
      <WarningIcon fontSize="large" />
      <Typography variant="body1">
        {isFlux
          ? <>This service is deployed by Pipeline v2 (Flux), so it can&apos;t be rolled back here. A rollback here would be undone by Flux within the hour. Roll it back in {link}.</>
          : <>Could not check how this service is deployed, so rollback is turned off. Reload to try again, or roll back in {link}.</>}
      </Typography>
    </div>
  );
}
FluxBanner.propTypes = {
  deployer: PropTypes.shape({
    status: PropTypes.oneOf(['loading', 'error', 'ok']).isRequired,
    info: PropTypes.shape({
      deployedBy: PropTypes.string.isRequired,
      component: PropTypes.string,
    }),
  }).isRequired,
  environment: PropTypes.string,
  standalone: PropTypes.bool,
};
