import { readFileSync, writeFileSync } from "fs";
import WebSocket from "ws";
import net from "net";
import { ArgParser, type_args } from "./arg/ArgParser";
import { MainProcesses } from "./mainProcess/MainProcesses";
import { app } from "electron";
import { MainProcess } from "./mainProcess/MainProcess";
import { MainWindowAgent } from "./windows/MainWindow/MainWindowAgent";
import { Log } from "./log/Log";
import path from "path";
import os from "os";
import { execSync } from "child_process";

/**
 * "site" is defined in package.json. We can use this variable to add
 * customized settings or functionalities to TDM for the specific site.
 * 
 * For example, in "sns-office-user", the default profiles file is the 
 * `profiles-sns-office-user.json` located in the package. It contains a
 * `Archive` category which defines the EPICS archive for SNS.
 * 
 * Available sites: 
 *  - "" (empty)
 *  - sns-office-engineer
 *  - sns-office-user
 */
import {site} from "../../package.json";

// true for the first TDM instance 
// false for the later TDM instances
// const isTheFirstApp = app.requestSingleInstanceLock();
app.requestSingleInstanceLock();

// Disable error dialogs by overriding
// dialog.showErrorBox = (title: string, content: string) => {
//     console.log(`${title}\n${content}`);
// };

// log for non-MainProcess, id is -1, always output to console
// it is used in this script, MainProcesses and WsOpenerServer
// logs.addLog("-1", "trace", undefined, "");

ArgParser.printTdmBanner();

// in development mode, process.argv may look like if we run
// npm start --settings abcd
// [
//   '/Users/1h7/projects/tdm/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron',
//   '.',
//   'abcd'
// ]
// 
// in packaged TDM, process.argv may look like this if we run
// ./TDM --settings abcd
// [ 
//     '/Applications/TDM.app/Contents/MacOS/TDM', 
//     '--settings', 
//     'abcd' 
// ]
// console.log("process.argv:", process.argv);
const args = ArgParser.parseArgs(process.argv, site);

if (site === "sns-office-user") {
    args["settings"] = path.join(__dirname, "resources/profiles/profiles-sns-office-user.json");
}

// if (args["mainProcessMode"] === "ssh-server") {
// app.commandLine.appendSwitch("disable-gpu");
// }

console.error = console.log;

Log.info('-1', "Input arguments:", args);

// let continueInThisInstance = true;

/**
 * When we double-click a TDL file in file manager, TDM will first try to open this file
 * in the existing instance. If it cannot find one, then create a new TDM instance.
 * 
 *  - on MacOS, it is handled by "open-file" event listener
 *  - on Linux or Windows, it is handled by "second-instance" event listener
 */
if (process.platform === "linux" || process.platform === "win32") {
    if (isStartedFromShell() === false) {
        Log.info("This TDM process is invoked by opening a file from file manager.")
        args["attach"] = -2;
    }
}

if (args["attach"] === -2) {
    Log.info("Try to open files in the 1st TDM instance")
    if (app.requestSingleInstanceLock() === true) {
        Log.info("This is the first instance, we open the files here")
        args["attach"] = -1;
    } else if (app.requestSingleInstanceLock() === false) {
        // there is already at least one TDM instances running, open files in the first instance
        // quit this instance
        Log.info("TDL files are goning to be opened in another instance. We will terminate this instance.")
        const cwd = args["cwd"];
        const fileNames: string[] = [];
        for (let fileName of args["fileNames"]) {
            if (path.isAbsolute(fileName) === false) {
                fileNames.push(path.join(cwd, fileName));
            } else {
                fileNames.push(fileName);
            }
        }
        app.requestSingleInstanceLock({
            attach: -2,
            fileNames: fileNames,
        });
        app.exit()
    }
}

// create a new instance
if (args["attach"] === -1) {
    Log.info('-1', "Creating TDM main processes.");
    const mainProcesses = new MainProcesses(args);

    mainProcesses.enableLogToFile();
    /**
     * In ssh-server mode, the createProcess() is invoked after we receive the process Id from ssh client
     */
    if (args["mainProcessMode"] !== "ssh-server") {

        const handleOpenFile = (path: string) => {

            // do the job after the app is ready
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
                        mainProcess.getIpcManager().handleProfileSelected(undefined, firstProfileName,
                            {
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
                            undefined)
                    }
                } else {
                    // open this file if a profile is selected
                    const editable = `${selectedProfile.getEntry("EPICS Custom Environment", "Manually Opened TDL Editable")}`.toUpperCase() === "YES" ? true : false;
                    mainProcess.getIpcManager().handleOpenTdlFiles(
                        undefined,
                        {
                            // tdl?: type_tdl;
                            tdlFileNames: [path],
                            mode: "operating",
                            editable: editable,
                            // external macros: user-provided and parent display macros
                            macros: [],
                            replaceMacros: false,
                            // currentTdlFolder?: string;
                        },
                        undefined
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
         * This file is opened in TDM's first instance
         */
        app.on("open-file", (event: any, filePath: string) => {
            event.preventDefault();
            if (app.requestSingleInstanceLock() === true) {
                handleOpenFile(filePath);
            }
        })

        /** 
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
                    mainWindowAgent.sendFromMainProcess("cmd-line-selected-profile", firstProfileName, args);
                } else {
                    // do nothing
                    Log.info('-1', "User did not provided a profile, show main window.");
                }
            } else if (cmdLineSelectedProfile === "" && cmdLineOpenFileNames.length === 0) {
                Log.info('-1', "User did not provided a profile, show main window.");
                // do nothing
            } else if (cmdLineSelectedProfile !== "" && cmdLineOpenFileNames.length === 0) {
                if (profileNames.includes(cmdLineSelectedProfile)) {
                    mainWindowAgent.sendFromMainProcess("cmd-line-selected-profile", cmdLineSelectedProfile, args);
                } else {
                    // do nothing
                    Log.error('-1', "The profile name provided in command line does not exist. You can select a profile from the main window.");
                }
            } else if (cmdLineSelectedProfile !== "" && cmdLineOpenFileNames.length > 0) {
                if (profileNames.includes(cmdLineSelectedProfile)) {
                    mainWindowAgent.sendFromMainProcess("cmd-line-selected-profile", cmdLineSelectedProfile, args);
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
            args["mainProcessMode"],
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




function getParentProcessName() {
    if (process.platform === "win32") {
        try {
            const pid = process.ppid; // Get Parent Process ID
            const output = execSync(`powershell -Command "(Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -eq ${pid} }).CommandLine"`).toString().trim();
            return output; // Extract the parent process name
        } catch (err) {
            return null;
        }
    } else if (process.platform === "linux") {
        try {
            const ppid = process.ppid; // Get Parent Process ID
            const cmdline = readFileSync(`/proc/${ppid}/cmdline`, 'utf-8');
            return cmdline.split('\0')[0]; // Extract the executable name
        } catch (err) {
            return null; // If there's an error, return null
        }
    } else {
        return null;
    }
}
function isStartedFromShell() {
    // bash, zsh, caja, ...
    const parentProcess = getParentProcessName();
    if (process.platform === "win32") {
        if (parentProcess?.toLowerCase().includes("explorer.exe")) {
            return false;
        } else {
            return true;
        }
    } else if (process.platform === "linux") {

        // const hasTerm = !!process.env.TERM;
        const isTTY = process.stdin.isTTY;
        // console.log("Linux", parentProcess, hasTerm, isTTY)
        // try {
        //     writeFileSync("/home/1h7/tdmlog.log", JSON.stringify({
        //         parentProcess: parentProcess,
        //         // hasTerm: hasTerm,
        //         isTTY: isTTY,
        //     }, null, 4), {

        //     })
        // } catch (e) {

        // }

        if (parentProcess !== null) {
            if (/bash|zsh|fish|sh|dash|tcsh|csh/.test(parentProcess) || isTTY) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    } else {
        return false;
    }

}
