/**
 * @packageDocumentation
 * 
 * This file is responsible for starting the main process of the application.
 * It handles command-line arguments, initializes logging, manages single instance locks,
 * and sets up inter-process communication.
 * 
 * It is the entry point for the Electron.js main process.
 * 
 * About opening a file:
 *  - In command line, run `./tdm abc.tdl` or `./tdm --attach -1 abc.tdl`
 *    create a new TDM instance to open the file
 *  - In command line, run `./tdm --attach abc.tdl` or `./tdm --attach -2 abc.tdl`
 *    try to attach file to an existing TDM instance, if there is no existing instance, create a new one
 *  - In command line, run `./tdm --attach 9527 abc.tdl`
 *    try to attach to an existing TDM instance whose listening port is 9527
 *    if this instance does not exist, create a new instance with this listening port
 *    if this listening port is already used by other applications, quit this TDM
 *  - Double click the tdl file in GUI file manager
 *    same as `--attach -2` 
 *  - Drop a file to any TDM window
 *    open this file in this TDM instance
 *  - open a TDL file using `Open file` menu in TDM
 *    open this file in this TDM instance
 */


import { ArgParser } from "./arg/ArgParser";
import { app } from "electron";
import { Log } from "./log/Log";
import path from "path";

/**
 * "site" is defined in package.json. We can use this variable to add
 * customized settings or functionalities to TDM for the specific site.
 * 
 * For example, in "sns-office-user", the default profiles file is the 
 * `profiles-sns-office-user.json` located in the package. It contains a
 * `Archive` category which defines the EPICS archive for SNS.
 * 
 * Available sites: 
 *  - "" (empty), default site for general purpose of use
 *  - sns-office-engineer
 *  - sns-office-user
 */
import { site } from "../../package.json";
import { type_args } from "./mainProcess/IpcEventArgType";
import { openTdlInFirstExistingInstance, openTdlInNewInstance, openTdlInSpecificExistingInstance, processArgsAttach } from "./global/GlobalMethods";
import { defaultWebsocketOpenerServerPort } from "./global/GlobalVariables";
// import { type_sshServerConfig } from "./mainProcesses/SshClient";

/**
 * `true` for the first TDM instance 
 * 
 * `false` for the later TDM instances
 */
app.requestSingleInstanceLock();


/**
 * Print TDM banner in command line. 
 * 
 * It includes version number, build date, and the commit hash of the current version. It also provides a
 * help on how to use TDM.
 */
ArgParser.printTdmBanner();

/**
 * load command line arguments
 */
const args: type_args = ArgParser.parseArgs(process.argv, site);

/**
 * Here is the site-specific profile file
 */
if (site === "sns-office-user") {
    args["settings"] = path.join(__dirname, "resources/profiles/profiles-sns-office-user.json");
} // add more site-specific profiles here


console.error = console.log;
Log.info('-1', "Input arguments:", args);


processArgsAttach(args);

if (args["attach"] === -1) {
    // `--attach`'s role ends, use a real port
    args["attach"] = defaultWebsocketOpenerServerPort;
    openTdlInNewInstance(args);
} else if (args["attach"] === -2) {
    const success = openTdlInFirstExistingInstance(args);
    if (success === true) {
        // do nothing, the file is opened in another instance, this instance quits
        app.exit()
    } else {
        // there was no existing instance, open a new instance
        // `--attach`'s role ends, use a real port
        args["attach"] = defaultWebsocketOpenerServerPort;
        openTdlInNewInstance(args);
    }
} else if (args["attach"] > 0 && args["attach"] < 65536) {
    // asynchronously try to open the file in a specific existing instance
    openTdlInSpecificExistingInstance(args).then((success: boolean) => {
        if (success === true) {
            // do nothing, the file is opened in another instance, this instance quits
            app.quit();
        } else {
            // open a new instance with this particular port number
            // if this port is occupied by other applications, quit
            openTdlInNewInstance(args);
        }
    });
} else {
    // this situation should never happen because ArgParser has already handled wrong args["attach"] values
    Log.fatal('-1', `Wrong args["attach"] value ${args["attach"]}`);
    app.quit();
}




// const createProcess = (
//     // callback: ((mainProcess: MainProcess, args: type_args) => any) | undefined = undefined,
//     mainProcessMode: "desktop" | "web" | "ssh-server" | "ssh-client" = "desktop",
//     mainProcessId?: string | undefined,
//     sshServerConfig?: type_sshServerConfig & { callingProcessId: string }
// ) => {
//     // there should be only one main process in "web" mode
//     // if (mainProcessMode === "web") {
//     //     if (this.getProcesses().length >= 1) {
//     //         Log.info('-1', "The web mode only host one process");
//     //         return this.getProcesses()[0];
//     //     }
//     // }

//     // assign process ID
//     // let processIds: string[] = [];
//     // for (let ii = 0; ii < this.getProcesses().length; ii++) {
//     //     const process = this.getProcesses()[ii];
//     //     processIds.push(process.getProcessId());
//     // }
//     // let newProcessId = "0";
//     // if (mainProcessId === undefined) {
//     //     // automatically assign
//     //     let maxId = -1;
//     //     for (let existingProcessId of processIds) {
//     //         maxId = Math.max(maxId, parseInt(existingProcessId));
//     //     }
//     //     newProcessId = `${maxId + 1}`;
//     // } else {
//     //     // todo: id collission, occurs in ssh client mode
//     //     newProcessId = mainProcessId;
//     // }
//     // Log.info('-1', `Creating TDM process #${newProcessId} in ${mainProcessMode} mode`);

//     this.readLocalFontNames();

//     const newProcess = new MainProcess(this, newProcessId, callback, mainProcessMode, sshServerConfig);
//     // this.getProcesses().push(newProcess);
//     return newProcess;
// };
