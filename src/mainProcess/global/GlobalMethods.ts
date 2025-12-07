import WebSocket from "ws";
import { app } from "electron";
import { readFileSync } from "fs";
import * as os from "os";
import path from "path";
import { Log } from "../../common/Log";
import { type_about_info, type_args } from "../../common/IpcEventArgType";
import { execSync } from "child_process";
import { MainProcess } from "../mainProcess/MainProcess";
import { MainWindowAgent } from "../windows/MainWindow/MainWindowAgent";
// import { MainProcesses } from "../mainProcesses/MainProcesses";
import * as selfsigned from "selfsigned";
// import Main from "electron/main";

/**
 * @packageDocumentation
 * 
 * This file is contains the global methods used in the main process of the TDM application.
 * It should only be imported by files in the main process as it uses some node.js specific modules such as `fs` and `os`.
 * It cannot be imported by files in the renderer process.
 */


/**
 * Generate the "About" information for the application.
 * This includes authors, organizations, versions of Electron, TDM, OS, license, Chromium, Node.js, V8, and build date.
 * 
 * @returns An object containing the "About" information.
 */
export const generateAboutInfo = (): type_about_info => {
    const authors = ["Hao Hao (haoh@ornl.gov)", "Bixiao Zhao (zhao.bixiao@gmail.com)"];
    const organizations = ["Oak Ridge National Laboratory", "Knox County Schools"];
    // "process" is a electron.js specfic function
    const electronVersion = [process.versions.electron];
    const tdmVersion = [app.getVersion()];
    const osVersion = [os.version()];
    const license = ["MIT"];
    const chromeVersion = [process.versions.chrome];
    const nodeVersion = [process.versions.node];
    const v8Version = [process.versions.v8];

    // Path to your app's package.json inside resources
    let buildDate = "N/A";
    try {
        const pkgPath = path.join(app.getAppPath(), "package.json");
        const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
        buildDate = pkg.buildDate ? pkg.buildDate : "N/A";
    } catch (e) {
        Log.error("Failed to read package.json to get build date.");
    }

    return {
        "Authors": authors,
        "Organizations": organizations,
        "Electron": electronVersion,
        "Version": tdmVersion,
        "Operating System": osVersion,
        "License": license,
        "Chromium": chromeVersion,
        "Node.js": nodeVersion,
        "V8": v8Version,
        "Build Date": [buildDate],
    }
}


/**
 * Get the current date and time as a formatted string.
 *
 * @param useAsFileName - Whether to format the date for use in a file name.
 * 
 * @returns The formatted date and time string. If `useAsFileName` is true, the format is `YYYY-MM-DD_HH-MM-SS_mmm`.
 *          Otherwise, the format is `YYYY-MM-DD HH:MM:SS.mmm`.
 */
export const getCurrentDateTimeStr = (useAsFileName: boolean = false) => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

    // note: : is not allowed as a file name
    if (useAsFileName === true) {
        return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}_${milliseconds}`;
    } else {
        return `${year}-${month}-${day}-${hours}:${minutes}:${seconds}.${milliseconds}`;
    }
}

// ------------------------- startMainProcess.ts --------------------------

/**
 * open the file in existing TDM instance, invoked only when `args["attach"] === -2`
 * 
 * (1) if there is no existing TDM instance running, simply return
 *     `args["attach"]` will be changed to -1 and the file will be opened in a new TDM instance
 * 
 * (2) if there is already one or more TDM instance running, 
 *     open files in the 1st TDM instance that is already running,
 *     and quit this current TDM
 * 
 * @returns `true` if the file is opened in another instance and this instance is quit; 
 *          `false` if there is no existing TDM instance running
 */
export const openTdlInFirstExistingInstance = (args: type_args): boolean => {

    const mainProcessMode = args["mainProcessMode"];
    if (mainProcessMode === "ssh-server") {
        return false;
    }

    const isFirstInstance = app.requestSingleInstanceLock();
    if (isFirstInstance === true) {
        // (1)
        Log.info("This was no exisiting instance running. Actually this is the first instance. We will open the files in here.")
        return false;
    } else {
        // (2)
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
            fileNames: fileNames,
        });
        return true;
    }
}

/**
 * Open TDL files in a specific TDM instance which is identified by the WebSocket opener port.
 * 
 * @param args The command line arguments containing the `attach` port number.
 * 
 * @returns A promise that resolves to `true` if the file is opened in another instance, then this instance quits;
 *         `false` if there is no existing TDM instance running on the specified port.
 * 
 */
export const openTdlInSpecificExistingInstance = async (args: type_args): Promise<boolean> => {
    const port = args["attach"];

    let setSuccess: any = undefined;;
    let promise = new Promise<boolean>((resolve, reject) => {
        setSuccess = resolve;
    })

    // (1) connect to the websocket port
    // it is a temporary websocket client, telling another TDM process
    // that I want to do something on your process, then I'll close and quit after
    // sending out the message.
    const ws = new WebSocket(`ws://127.0.0.1:${port}`);
    ws.on("open", () => {
        // (2) send process.argv
        ws.send(JSON.stringify(args));
        // (3) quit
        Log.info('-1', `Send data to WebSocket Opener Sever port ${port}`);
    });
    ws.on("close", () => {
        Log.error('-1', "Socket closed by server");
        setSuccess(false);
    });
    ws.on("error", (err: Error) => {
        Log.error('-1', err);
        setSuccess(false);
    });

    ws.on("message", (data: WebSocket.RawData) => {
        try {
            const message = JSON.parse(data.toString());
            if (message !== undefined && message["messageDelivered"] !== undefined && message["messageDelivered"] === "success") {
                Log.info('-1', `The message is successfully delivered to the TDM instance listening on port ${port}. This instance is going to quit.`);
                // success = true;
                setSuccess(true);
            }
        } catch (e) {
            // do nothing
            setSuccess(false);
        }
    })

    // timeout after 1 second
    setTimeout(() => {
        setSuccess(false);
    }, 1000);

    const success = await promise;
    return success;

}

/**
 * Open tdl files in a new TDM instance
 * 
 * For this newly created instance, it listens to the "open-file" for TDL files
 * opened in MacOS file manager, and to "second-instance" for TDL files opened in
 * Linux and Windows file managers.
 * 
 * If in "ssh-server" mode, only create main process
 * 
 * @param args The command line arguments for the new TDM instance.
 */
export const openTdlInNewInstance = (args: type_args) => {

    const mainProcessMode = args["mainProcessMode"];

    if (mainProcessMode === "ssh-server") {
        const mainProcess = new MainProcess(args, cmdLineCallback, mainProcessMode, undefined);
        return;
    }

    /**
     * Only emitted on MacOS when double click the TDL file in Finder
     *
     * The tdl file is opened in TDM's first instance
     * 
     * @param filePath the path of the TDL file to be opened in another TDM instance.
     *                 It is passed in by MacOS Finder, it is always an absolute path.
     */
    app.on("open-file", (event: any, filePath: string) => {
        event.preventDefault();
        // this instance is the first instance of TDM
        if (app.requestSingleInstanceLock() === true) {
            openTdlFileAsRequestedByAnotherInstance(filePath, mainProcess);
        }
    })


    /** 
     * This event will be emitted inside the primary TDM instance
     * when a second/third/... TDM instance is being opened from command line or file manager,
     * and that instance is calling app.requestSingleInstanceLock()
     * 
     * If `requestSingleInstanceLock()` contains no argument, this event listener will ignore the event
     * 
     * If `requestSingleInstanceLock()` contains an argument, it will be passed to this event listener as 
     * `argsFrom2ndInstance`.
     * 
     * (1) if the file is opened in command line, it should always sends null out,
     *     then this TDM instance does nothing
     * 
     * (2) if the file is opened in GUI file browser, it sends the file names being clicked,
     *     this TDM instance will open the first file
     * 
     * @param argsFrom2ndInstance `{fileNames: string[]}` The arguments passed from the second TDM instance.
     */
    app.on('second-instance', (event: any, argv: any, workingDirectory: any, argsFrom2ndInstance: any) => {

        console.log("\n\n second instance requests: \n\n", argsFrom2ndInstance)

        // (1)
        if (argsFrom2ndInstance === null) {
            return;
        }

        // (2)
        const filePath = argsFrom2ndInstance["fileNames"][0];
        if (typeof filePath === "string") {
            openTdlFileAsRequestedByAnotherInstance(filePath, mainProcess);
        } else {
            Log.error(-1, "The file path provided by the 2nd instance is not valid.");
        }
    });

    const mainProcess = new MainProcess(args, cmdLineCallback, mainProcessMode, undefined);
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

export function isStartedFromShell() {
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

/**
 * if the TDL file is opened in GUI file manager in Linux or Windows, modify `args["attach"]` to -2
 * 
 * if the main process mode is "ssh-server", change attach to -1
 */
export const processArgsAttach = (args: type_args) => {
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
            args["attach"] = -2; // -2 means we are trying to open file from file manager
        }
    }

    if (args["mainProcessMode"] === "ssh-server") {
        args["attach"] = -1;
    }
}

/**
 * open tdl file as requested by another TDM instance
 * 
 * (1) the path must be absolute path if it is provided by other than args
 * 
 * (2) it will open the file in the last created MainProcess
 * 
 * (3) if the current TDM instance has not selected a profile, then honor the requested profile
 * 
 * (4) if already selected a profile, then ignore the requested profile
 */
export const openTdlFileAsRequestedByAnotherInstance = (filePath: string, mainProcess: MainProcess, args?: type_args) => {

    const mainProcesMode = mainProcess.getMainProcessMode();

    if (mainProcesMode === "ssh-server") {
        return;
    }

    // (1)
    if (path.isAbsolute(filePath) === false && args === undefined) {
        Log.error("-1", `The file path ${filePath} is not an absolute path. Cannot open it.`);
        return;
    }

    // "blocks" until the app is ready
    app.whenReady().then(() => {
        // (2)
        // const processes = mainProcesses.getProcesses();
        // const mainProcess = processes[processes.length - 1];
        // if (mainProcess === undefined) {
        // return;
        // }

        // const profiles = mainProcess.getMainProcesses().getProfiles();
        const profiles = mainProcess.getProfiles();
        const selectedProfile = profiles.getSelectedProfile();

        const cwd = args === undefined ? "" : args["cwd"];
        const macros = args === undefined ? [] : args["macros"];
        const fileNames = args === undefined ? [filePath] : args["fileNames"];

        if (selectedProfile === undefined) {
            // (3)
            const firstProfileName = profiles.getFirstProfileName();
            const passedProfileName = args === undefined ? "" : args["profile"];
            const profileName = passedProfileName === undefined || profiles.getProfile(passedProfileName) === undefined ? firstProfileName : passedProfileName;
            if (profileName === undefined) {
                // there is no profile available, stop
                return;
            }

            console.log("profile names:", profileName, passedProfileName, firstProfileName)

            mainProcess.getIpcManager().handleProfileSelected(undefined,
                {
                    selectedProfileName: profileName,
                    args: {
                        macros: macros,
                        cwd: cwd,
                        fileNames: fileNames,
                        settings: "", // ignored
                        profile: profileName, // ignored, will use the above selectedProfileName
                        alsoOpenDefaults: false, // ignored
                        attach: -1, // ignored as the attach port is set when the MainProcesses is created
                        flexibleAttach: true, // ignored, same reason as above
                        httpServerPort: 3000, // ignored, same reason as above
                        site: "", // ignored
                        mainProcessMode: "desktop", // this function is called only in desktop mode
                    },
                }
            )
            return;

        } else {
            // (4)
            const editable = `${selectedProfile.getEntry("EPICS Custom Environment", "Manually Opened TDL Editable")}`.toUpperCase() === "YES" ? true : false;
            mainProcess.getIpcManager().handleOpenTdlFiles(
                undefined,
                {
                    options: {
                        // tdl?: type_tdl;
                        tdlFileNames: fileNames,
                        mode: "operating", // always operating
                        editable: editable,
                        // external macros: user-provided and parent display macros
                        macros: macros,
                        replaceMacros: false,
                        // currentTdlFolder?: string;
                        windowId: "0", // let main window take the burden
                    },
                }
            )
        }

    }
    )
}

/**
 * todo: try to eliminate it!
 * 
 * It takes the command line arguments to run in main process.
 */
export const cmdLineCallback = (mainProcess: MainProcess, args: type_args) => {
    // command line selected profile and command line tdl files
    const windowAgentsManager = mainProcess.getWindowAgentsManager();
    const cmdLineSelectedProfile = args["profile"];
    const cmdLineOpenFileNames = args["fileNames"];
    // const profileNames = mainProcess.getMainProcesses().getProfiles().getProfileNames();
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

export const generateKeyAndCert = () => {
    // generate self-signed certificate for https server

    // const attrs = [{ name: "commonName", value: "localhost" }];
    // const pems = selfsigned.generate(attrs, { days: 1000 });

    const attrs = [{ name: 'commonName', value: '127.0.0.1' }];
    const altNames = [
        // { type: 2, value: 'localhost' }, // DNS
        { type: 7, ip: '127.0.0.1' },    // IP v4
        // { type: 7, ip: '::1' }           // IP v6
    ];

    const pems = selfsigned.generate(attrs, {
        days: 365,
        keySize: 2048,
        algorithm: 'sha256',
        extensions: [
            { name: 'basicConstraints', cA: false },
            { name: 'subjectAltName', altNames }
        ]
    });


    return pems;


}

