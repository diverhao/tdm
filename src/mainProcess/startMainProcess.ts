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
 *  - Double click the tdl file
 *    same as above
 */


import WebSocket from "ws";
import { ArgParser } from "./arg/ArgParser";
import { MainProcesses } from "./mainProcess/MainProcesses";
import { app } from "electron";
import { MainProcess } from "./mainProcess/MainProcess";
import { MainWindowAgent } from "./windows/MainWindow/MainWindowAgent";
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
import { isStartedFromShell, openTdlInExistingInstance, processArgsAttach } from "./global/GlobalMethods";

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

/**
 * if `--attach -1`, keep running this TDM instance
 * 
 * if `--attach 9527`, try to attach to a TDM instance listening to port 9527 and quit this one
 */
if (args["attach"] === -1) {
    Log.info('-1', "Creating TDM main processes.");
    const mainProcesses = new MainProcesses(args);

    mainProcesses.enableLogToFile();
    const mainProcesMode = args["mainProcessMode"];
    if (mainProcesMode === "ssh-server") {
        /**
         * In ssh-server mode, the invocation of createProcess() is deferred 
         * to after we receive the process Id from ssh client
         */
    } else {
        // desktop and web mode
        const handleOpenFile = (path: string) => {

            // "blocks" until the app is ready
            app.whenReady().then(() => {
                const processes = mainProcesses.getProcesses();
                // we use the process that is created at last
                const mainProcess = processes[processes.length - 1];
                if (mainProcess === undefined) {
                    // there should be a main process running
                    return;
                }
                const openFilePath = path;
                if (openFilePath === "" && openFilePath === undefined) {
                    return;
                }
                const profiles = mainProcess.getProfiles();
                const selectedProfile = profiles.getSelectedProfile();

                if (selectedProfile === undefined) {
                    // if there is no profile selected, use the first available profile
                    let firstProfileName = ""
                    for (const profileName of profiles.getProfileNames()) {
                        if (profileName !== "For All Profiles") {
                            firstProfileName = profileName;
                            break;
                        }
                    }


                    if (firstProfileName === undefined) {
                        // there is no profile defined, do
                        return;
                    } else {
                        // select the first profile, then open the double-clicked tdl file
                        mainProcess.getIpcManager().handleProfileSelected(undefined,
                            {
                                selectedProfileName: firstProfileName,
                                args: {
                                    macros: [],
                                    settings: "",
                                    profile: firstProfileName,
                                    alsoOpenDefaults: false,
                                    fileNames: [openFilePath],
                                    attach: -1,
                                    cwd: "",
                                    mainProcessMode: "desktop", // | "web"; // "ssh-server" or "ssh-client" mode process can only be created inside the program
                                    httpServerPort: 3000,
                                    site: site,
                                },
                                httpResponse: undefined
                            }
                        )
                    }
                } else {
                    // open this file if a profile is selected
                    const editable = `${selectedProfile.getEntry("EPICS Custom Environment", "Manually Opened TDL Editable")}`.toUpperCase() === "YES" ? true : false;
                    mainProcess.getIpcManager().handleOpenTdlFiles(
                        undefined,
                        {
                            options: {
                                // tdl?: type_tdl;
                                tdlFileNames: [path],
                                mode: "operating",
                                editable: editable,
                                // external macros: user-provided and parent display macros
                                macros: [],
                                replaceMacros: false,
                                // currentTdlFolder?: string;
                            },
                            httpResponse: undefined
                        }
                    )
                }

            }
            )
        }

        /**
         * For MacOS only
         * 
         * This event is emitted only when we double click the TDL file, i.e. "open abc.tdl" in command line
         * 
         * The tdl file is opened in TDM's first instance
         */
        app.on("open-file", (event: any, filePath: string) => {
            console.log("open --------------------------- file", filePath)
            event.preventDefault();
            if (app.requestSingleInstanceLock() === true) {
                handleOpenFile(filePath);
            }
        })

        /** 
         * This event is emitted when a second/third/... TDM instance is being opened 
         * and that instance is calling app.requestSingleInstanceLock()
         * 
         * this event is emitted when we run another "TDM ..." from command line
         * 
         * double-click TDL file in MacOS does not emit this event
         * 
         * double-click TDL file in Windows or Linux emits this event
         * 
         * If the command is like "TDM ... --attach ...", the TDL files are opened in TDM's first instance
         * 
         * If the command is like "TDM ... --attach 9527 ...", the TDL files are opened in that particular TDM instance
         * 
         * If the command is like "TDM ..." without any "--attach" option, the TDL files are opened in a new TDM instance
        */
        app.on('second-instance', (event: any, argv: any, workingDirectory: any, argsFrom2ndInstance: any) => {
            if (app.requestSingleInstanceLock() === true) {
                Log.info(-1, "Another TDM instance is started with args", argsFrom2ndInstance);

                if (argsFrom2ndInstance === null) {
                    return;
                }

                // the 2nd instance is asking for to open the files in this instance
                if (argsFrom2ndInstance["attach"] === -2) {

                    Log.info(-1, "Its TDL files are going to be opened here. That instance is closed immediately.")

                    const filePath = argsFrom2ndInstance["fileNames"][0];
                    if (typeof filePath === "string") {
                        handleOpenFile(filePath);
                    }
                }
            }
        });
        // }

        const cmdLineCallback = (mainProcess: MainProcess) => {
            // command line selected profile and command line tdl files
            const windowAgentsManager = mainProcess.getWindowAgentsManager();
            const cmdLineSelectedProfile = args["profile"];
            const cmdLineOpenFileNames = args["fileNames"];
            const profileNames = mainProcess.getProfiles().getProfileNames();
            const mainWindowAgent = windowAgentsManager.getMainWindowAgent();
            if (!(mainWindowAgent instanceof MainWindowAgent)) {
                return;
            }
            // ensure that the command line selected profile is in the profiles
            if (cmdLineSelectedProfile === "" && cmdLineOpenFileNames.length > 0) {
                if (profileNames.length > 0) {
                    let firstProfileName = ""
                    for (const profileName of profileNames) {
                        if (profileName !== "For All Profiles") {
                            firstProfileName = profileName;
                            break;
                        }
                    }
                    mainWindowAgent.sendFromMainProcess("cmd-line-selected-profile",
                        {
                            cmdLineSelectedProfile: firstProfileName,
                            args
                        }
                    );
                } else {
                    // do nothing
                    Log.info('-1', "User did not provided a profile, show main window.");
                }
            } else if (cmdLineSelectedProfile === "" && cmdLineOpenFileNames.length === 0) {
                Log.info('-1', "User did not provided a profile, show main window.");
                // do nothing
            } else if (cmdLineSelectedProfile !== "" && cmdLineOpenFileNames.length === 0) {
                if (profileNames.includes(cmdLineSelectedProfile)) {
                    mainWindowAgent.sendFromMainProcess("cmd-line-selected-profile",
                        {
                            cmdLineSelectedProfile, args
                        }
                    );
                } else {
                    // do nothing
                    Log.error('-1', "The profile name provided in command line does not exist. You can select a profile from the main window.");
                }
            } else if (cmdLineSelectedProfile !== "" && cmdLineOpenFileNames.length > 0) {
                if (profileNames.includes(cmdLineSelectedProfile)) {
                    mainWindowAgent.sendFromMainProcess("cmd-line-selected-profile",
                        {
                            cmdLineSelectedProfile, args
                        }
                    );
                } else {
                    // do nothing
                    Log.error('-1', "The profile name provided in command line does not exist. You can select a profile from the main window.");
                }
            }
        };

        // crate a TDM process with callback function that uses the command line parameters
        mainProcesses.createProcess(
            // this callback won't be invoked if the main process is in "web" mode
            cmdLineCallback,
            mainProcesMode,
            undefined, // main process id, automatically assign
            undefined, // default one is always desktop or web mode
        );
    }
} else if (args["attach"] > 0) {
    // when we use "attach"
    // (a) the "settings" options is ignored
    // (b) if the profile is opened, then attach it, if not, open this profile
    // (c) if no profile is given in command line, open in the first avaiable profile, if no profile is opened, open one
    const port = args["attach"];
    // (1) connect to the websocket port
    // it is a temporary websocket client, telling another TDM process
    // that I want to do something on your process, then I'll close and quit after
    // sending out the message.
    const ws = new WebSocket(`ws://localhost:${port}`);
    ws.on("open", () => {
        // (2) send process.argv
        ws.send(JSON.stringify(args));
        // (3) quit
        Log.info('-1', `Send data to WebSocket Opener Sever port ${port}`);
        setTimeout(() => {
            // make sure the data is sent out
            ws.close();
            app.quit();
        }, 500);
    });
    ws.on("close", () => {
        Log.error('-1', "Socket closed by server");
    });
    ws.on("error", (err: Error) => {
        // do nothing
        Log.error('-1', err);
        ws.close();
        app.quit();
    });
}


