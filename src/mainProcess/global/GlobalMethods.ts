import { app } from "electron";
import { readFileSync } from "fs";
import * as os from "os";
import path from "path";
import { Log } from "../log/Log";
import { type_about_info, type_args } from "../mainProcess/IpcEventArgType";
import { execSync } from "child_process";

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
 * (1) if there is no existing TDM instance running, open it in a new instance
 *     `args["attach"]` is changed to 1
 * 
 * (2) if there is already one or more TDM instance running, 
 *     open files in the 1st TDM instance that is already running,
 *     and quit this current TDM
 */
export const openTdlInExistingInstance = (args: type_args) => {
    if (app.requestSingleInstanceLock() === true) {
        // (1)
        Log.info("This is the only TDM instance running on this computer, we open the files here")
        args["attach"] = -1;
    } else if (app.requestSingleInstanceLock() === false) {
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
            attach: -2,
            fileNames: fileNames,
        });
        app.exit()
    }
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
 * read and process `args["attach"]`
 *  - -1: create a new instance
 *  - -2: try to attach to an existing TDM instance, if there is no instance running, create a new one
 *    value of `args["attach"]` is changed to -1 if there is no instance running
 *  - 9527: try to attach to the existing TDM instance, if it does not exist, create a new one
 *    value of `args["attach"]` is changed to -1 if there is no instance running
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

    /**
     * try to open the tdl file from existing TDM instance
     * 
     * if there exists a TDM instance, open the file in that one and quit this
     * 
     * if there is no TDM instance running, continue and open files in this instance
     * the args["attach"] is modified to -1
     */
    if (args["attach"] === -2) {
        openTdlInExistingInstance(args);
    }
}
