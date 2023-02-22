import React from 'react';

const backendPort = process.env.REACT_APP_FLASK_PORT;
const backendIp = window.location.host.split(/(:\d.)/)[0]
const backendHost = `${backendIp}:${backendPort}`;
export {backendHost};
