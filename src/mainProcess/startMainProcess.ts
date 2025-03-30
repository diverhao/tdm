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
const args = ArgParser.parseArgs(process.argv);

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
        app.requestSingleInstanceLock({
            attach: -2,
            fileNames: args["fileNames"],
        });
        app.exit()
    }
}

// create a new instance
if (args["attach"] === -1) {
    Log.info('-1', "Creating TDM main processes.");
    const mainProcesses = new MainProcesses(args);
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
                    const firstProfileName = profiles.getProfileNames()[0];

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
         * open-file is fired when double click to open the file on MacOS
         * 
         * windows or Linux never triggers this event. They simply create a new TDM instance when we click the binary or TDL file
         * 
         * On MacOS, double click the application binary on MacOS won't trigger this event, it does nothing
         * But on macOS you can open another TDM instance via running ./TDM inside .app file
         * 
         * this listener must be very early, just after the MainProcesses is create, otherwise the path may not be passed
         * 
         * if the TDM is not started, start the TDM and open the first profile
         * 
         * if one TDM instance is already running, and the one or more TDM processes are already running, then open the display
         * in most recently opened TDM process. If there is no profile selected in this TDM process, select the first
         * profile.
         * 
         * if multiple TDM instances are already running, this open-file event will be 
         * triggered in the first-opened TDM instance
         * 
         */
        /**
         * Emitted when 
         */
        // The below was for opening the TDL file in an existing TDM instance in Linux and Windows. However it may cause
        // issue if there are multiple TDM instances running from different logins of the same user. 
        // It may open the TDL file in another login, the similar issue that Firefox has.
        // Simply in Linux or Windows, clicking the TDL file will open a new TDM instance for this file.
        // You can still use --attach option to open the file in an existing TDM instance
        // ------------------------------------------------------
        // On macOS, if there is no TDM instance running,
        // then it opens a new TDM instance, that's all;
        // if there is already an instance running, it trigger
        // this already-running instance's second-instance event,
        // and it opens another TDM instance, 
        //
        // On macOS, if there is no TDM instance
        // running, it opens a new instance and fire this instance's
        // open-file event; if there is
        // already a TDM instance running, it causes the running 
        // instance to fire the open-file event, and it won't
        // open a new instance.
        // 
        // On Windows or Linux, if there is one TDM instance already running,
        // either clicking the TDL file or open the TDM
        // binary will trigger the second-instance event of the already-running
        // TDM instance. A new TDM instance is opened.
        // They never trigger the open-file event.
        // By default, they will open a new TDM instance.
        //
        // An unrelated variable is the app.requestSingleInstanceLock()
        // we can use this value to do something, e.g. quit() the second instance 
        // immediately

        // if (process.platform === "win32") {

        //     if (!app.requestSingleInstanceLock()) {
        //         // only the non-first instances run this
        //         // writeFileSync(path.join(os.homedir(), "tdm.log"), `----> ${JSON.stringify(process.argv)}\n`, { flag: 'a' });
        //         // if there is a file in process.argv, it means we double click
        //         // the file to open it. Then we open this file in the
        //         // already-running TDM instance, quit the second TDM instance
        //         //  
        //         // if the later instances come with 
        //         for (let ii = 1; ii < process.argv.length; ii++) {
        //             const arg = process.argv[ii];
        //             if (!arg.startsWith("--")) {
        //                 app.exit();
        //                 break;
        //             }
        //         }
        //         // if there is no TDL file in process.argv, it means we are
        //         // double-clicking the TDM binary. In this case we open a 
        //         // new TDM instance
        //     } else {
        //         // only the first TDM instance has this listener
        //         app.on('second-instance', (event, argv, workingDirectory) => {
        //             // If you are running your application with a single instance lock, you should be able to pass the argv file path like this:
        //             // writeFileSync(path.join(os.homedir(), "tdm.log"), `second instance ${JSON.stringify(argv)}\n`, { flag: 'a' });
        //             const tdlFileNames: string[] = [];
        //             for (let ii = 1; ii < argv.length; ii++) {
        //                 const arg = argv[ii];
        //                 if (!arg.startsWith("--")) {
        //                     tdlFileNames.push(arg);
        //                 }
        //             }
        //             if (tdlFileNames.length === 0) {
        //                 return;
        //             }
        //             const filePath = tdlFileNames[0];
        //             // do the job after the app is ready
        //             handleOpenFile(filePath);

        //         });
        //     }
        // } else if (process.platform === "darwin" || process.platform === "linux") {
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
                    mainWindowAgent.sendFromMainProcess("cmd-line-selected-profile", profileNames[0], args);
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
            const cmd = `wmic process where ProcessId=${pid} get Name /value`;
            const output = execSync(cmd).toString().trim();
            return output.split('=')[1]; // Extract the parent process name
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
        if (parentProcess === "explorer.exe") {
            return false;
        } else {
            return true;
        }
    } else if (process.platform === "linux") {

        const hasTerm = !!process.env.TERM;
        const isTTY = process.stdin.isTTY;
        try {
            writeFileSync("/home/haohao/tdmlog.log", JSON.stringify({
                parentProcess: parentProcess,
                hasTerm: hasTerm,
                isTTY: isTTY,
            }, null, 4), {

            })
        } catch (e) {

        }

        if (parentProcess !== null) {
            if (/bash|zsh|fish|sh|dash|tcsh|csh/.test(parentProcess) || hasTerm || isTTY) {
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
