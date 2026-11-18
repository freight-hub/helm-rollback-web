import { useEffect, useState } from 'react';

import { DefaultRollbackApi, DeployerInfo } from './rollback-api';

export type DeployerState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ok'; info: DeployerInfo };

/** Rollbacks are only allowed once we know the release is not deployed by Flux. */
export function canRollBack(state: DeployerState): boolean {
  return state.status === 'ok' && state.info.deployedBy !== 'flux';
}

export function useDeployer(namespace: string, releaseName: string): DeployerState {
  const [state, setState] = useState<DeployerState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ status: 'loading' });
    DefaultRollbackApi.getDeployer(namespace, releaseName)
      .then(info => { if (active) setState({ status: 'ok', info }); })
      .catch(e => {
        console.error('Deployer lookup failed', e);
        if (active) setState({ status: 'error' });
      });
    return () => { active = false; };
  }, [namespace, releaseName]);

  return state;
}
