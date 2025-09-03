import { app } from "electron";
import { readFileSync } from "fs";
import * as os from "os";
import path from "path";
import { Log } from "../log/Log";

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
export const generateAboutInfo = () => {
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
