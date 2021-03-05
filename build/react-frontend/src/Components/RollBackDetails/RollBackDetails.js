import { LazyLog, ScrollFollow  } from 'react-lazylog';
import  React, {useEffect} from 'react';
import { Container } from '@material-ui/core';

function RollBackDetails() {
    const namespace = window.location.href.split("/")[4]
    const releasename = window.location.href.split("/")[5]
    const revision = window.location.href.split("/")[6]
    const fullURL = "/dorollback/"+namespace+"/"+releasename+"/"+revision
    return (
        
         <ScrollFollow
        startFollowing={true}
        render={({ follow, onScroll }) => (
            <LazyLog height={1000} url={fullURL} /> 
        )}
        />
    )
}


export default RollBackDetails;
