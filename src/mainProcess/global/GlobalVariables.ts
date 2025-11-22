
// Global variables in main process


// export let logs: Logs = new Logs();

// there are 3 types of websocket services, below are their starting port
// they are dynamically assigned: if the port is occupied, tdm will find the next available port
// for IPC communication between renderer process and main process
// export const defaultWebsocketIpcServerPort = 7527;
// for display window attached script communication with main process
export const websocketPvServerPort = 8527;
// for opening tdl files from command line in attached manner
export const defaultWebsocketOpenerServerPort = 9527;

// TCP server port on ssh server
// this port is dynamically assigned, it will try 100 times
export const sshTcpServerPort = 5555;

// http server port for web mode
// this port is static, it can be assigned from user input using --http-server-port, 
// if the port is not available, quit
export const defaultWebServerPort = 3000;

// magic words printed by the TDM in ssh-server mode indicating that it has
// successfully created a TCP server. The ssh-client can obtain the TCP server port
// based on this string
export const tcpPortStr = "we have successfully created TCP server on port;"