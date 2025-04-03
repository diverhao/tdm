import {app} from "electron";
import * as os from "os";


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
    }
}


/**
 * Year-Month-Day:Hour:Minute:Second.Millisecond
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
  