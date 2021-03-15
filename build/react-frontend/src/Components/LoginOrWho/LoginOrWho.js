import React, { useEffect } from 'react';
import { Typography, Button } from '@material-ui/core';

const dataURL = "/login-status"
const sampleLoginData = {"email":"fake@forto.com"}

export default function LoginOrWho() {
  const [appState, setAppState] = React.useState('userData')
  useEffect(() => {
    let actualURL = dataURL
    fetch(actualURL).then((res) => res.json().then((data)=>{
    setAppState({userData: data, loading: false })
    }));
  }, [setAppState]);

  let dd = appState.userData;
  if (window.location.href.split("/")[2].substr(0,14) === "localhost:3000") {
    console.log("DEBUG MODE")
    dd = sampleLoginData
  }
  if (dd == null || !dd.hasOwnProperty("email") || dd.email == null) {
    return(
      <Button className="MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedPrimary LoginButton" variant="contained" color="primary" href="/login">
        Log in with Google
      </Button>
    );
  } else {
    return (
      <Typography variant="h6" component="p" gutterBottom>
        Logged in as {dd.email}
      </Typography>
    );
  }
}
