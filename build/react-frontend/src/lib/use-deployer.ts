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
  const key = `${namespace}/${releaseName}`;
  const [result, setResult] = useState<{ key: string; state: DeployerState } | null>(null);

  useEffect(() => {
    let active = true;
    DefaultRollbackApi.getDeployer(namespace, releaseName)
      .then(info => { if (active) setResult({ key, state: { status: 'ok', info } }); })
      .catch(e => {
        console.error('Deployer lookup failed', e);
        if (active) setResult({ key, state: { status: 'error' } });
      });
    return () => { active = false; };
  }, [key, namespace, releaseName]);

  // A result for another release must never show, even for the one render
  // before the effect for this release runs.
  return result?.key === key ? result.state : { status: 'loading' };
}
