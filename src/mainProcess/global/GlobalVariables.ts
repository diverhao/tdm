
// Global variables in main process


// export let logs: Logs = new Logs();

// there are 3 types of websocket services, below are their starting port
// they are dynamically assigned: if the port is occupied, tdm will find the next available port
// for IPC communication between renderer process and main process
export const websocketIpcServerPort = 7527;
// for display window attached script communication with main process
export const websocketPvServerPort = 8527;
// for opening tdl files from command line in attached manner
export const websocketOpenerServerPort = 9527;

// TCP server port on ssh server
// this port is dynamically assigned, it will try 100 times
export const sshTcpServerPort = 5555;

// http server port for web mode
// this port is static, it can be assigned from user input using --http-server-port, 
// if the port is not available, quit
export const httpServerPort = 3000;

