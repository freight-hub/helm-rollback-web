import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTitle } from 'hookrouter';

import { DefaultRollbackApi } from "../../lib/rollback-api";

export default function RollBackDetails(props) {
  const { namespace, releaseName, revision } = props;
  useTitle(`${releaseName} - ${namespace} - Helm Rollback`);

  const [commandText, setCommandText] = React.useState(false);
  useEffect(() => DefaultRollbackApi
    .performRollback(namespace, releaseName, revision)
    .then(setCommandText)
  , [setCommandText, namespace, releaseName, revision]);

  if (commandText === false) {
    return (
      <p>Waiting for helm command to finish.... This usually happens immediately.</p>
    )
  } else {
    return (
      <div>
        <pre>{commandText.result}</pre>
      </div>
    )
  }
}
RollBackDetails.propTypes = {
  namespace: PropTypes.string.isRequired,
  releaseName: PropTypes.string.isRequired,
  revision: PropTypes.string.isRequired,
};


