import React, { useEffect } from 'react';

const sampleData = ["command not run, we're in frontend dev mode"]
export default function RollBackDetails() {

  const namespace = window.location.href.split("/")[4]
  const releasename = window.location.href.split("/")[5]
  const revision = window.location.href.split("/")[6]
  const [commandState, setCommandState] = React.useState({loading:true,'commandData':[]});
  const fullURL = "/dorollback/"+namespace+"/"+releasename+"/"+revision

  useEffect(() => {
    if (window.location.href.split("/")[2].substr(0,14) === "localhost:3000") {
      setCommandState({commandData: sampleData, loading: false })
    } else {
      let actualURL = fullURL
      fetch(actualURL).then((res) => res.json().then((data)=>{
        setCommandState({commandData: data, loading: false })
      }));
    }
  }, [setCommandState, fullURL]);

  if (commandState.loading) {
    return (
      <p>Waiting for helm command to finish.... Seems streaming data into react is actually hard and noone bothers maintaining a nice component for this. :(</p>
    )
  } else {
    return (
      <div>
        <tt>{commandState.commandData}</tt>
      </div>
    )
  }
}
