import React from 'react';

//const backendPort = process.env.REACT_APP_FLASK_PORT;
//const backendIp = window.location.host.split(/(:\d.)/)[0];
const host = process.env.REACT_APP_API_URL;
//const backendHost = `${backendIp}:${backendPort}`;
const backendHost = `${host}`;
export {backendHost};
