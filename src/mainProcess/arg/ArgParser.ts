import { app } from "electron";
import path from "path";
import os from "os";
import { httpServerPort } from "../global/GlobalVariables";
import { Log } from "../log/Log";
import { type_log_levels } from "../log/Log";

export type type_args = {
    macros: [string, string][];
    settings: string;
    profile: string;
    alsoOpenDefaults: boolean;
    fileNames: string[];
    attach: number;
    cwd: string;
    mainProcessMode: "desktop" | "web" | "ssh-server"; // "ssh-client" mode process can only be created inside the program
    httpServerPort: number;
    site: string;
};

// For whatever reason, "npm start" ignores all elements starting with "--" in process.argv, 
// "--settings ~/.tdm/profiles.json" becomes "~/.tdm/profile.json"
// In deveopment mode, we cannot pass anything started with "--" to electron
let dashdash = "--";
// if (app.isPackaged) {
//     dashdash = "--";
// }

const dashdashMacros = `${dashdash}macros`;
const dashdashSettings = `${dashdash}settings`;
const dashdashProfile = `${dashdash}profile`;
const dashdashAlsoOpenDefaults = `${dashdash}also-open-defaults`;
const dashdashHttpServerPort = `${dashdash}http-server-port`;
const dashdashAttach = `${dashdash}attach`;
const dashdashHelp = `${dashdash}help`;
const dashdashLogLevel = `${dashdash}log-level`;
const dashdashLogStackTrace = `${dashdash}log-stack-trace`;
const dashMainProcessMode = `${dashdash}main-process-mode`; // "web" | "desktop"

export class ArgParser {
    constructor() { }

    static printHelp = () => console.log(`
TDM [options]

Options:
  --help                                  Show this help
  --attach 9527                           Open the TDL files in an exisiting TDM process 9527
                                          The TDM process number is uniqe across the operating system
                                          It can be found on the TDM main window
                                          If this option is absent, it will open a new TDM instance
  --attach                                Open the TDL files in the first opened TDM instance. If there is no 
                                          TDL instance running, create a new one.
  --settings /home/ringop/custom.json     Configuration file for profiles
                                          If this option is absent, it will load $HOME/.tdm/profiles.json
  --profile "Control Room"                The profile that will be selected
                                          If this options is absent, no profile is selected
  --macros "SYS=ring, SUB_SYS=bpm"        Macros for the TDL files
  --log-level level                       Log level in main process, could be fatal, error, warn, info, debug, or trace
  --log-stack-trace                       If the log prints stack trace
  --also-open-defaults                    Open default TDL files for the selected profile
                                          If this option is absent, default TDL files are not opened 
  --main-process-mode web                 Run the web server
  --http-server-port 3000                 Web server port
  navwogif.tdl /home/ringop/main.tdl      TDL file names

-----------------------------------------------
`);

    static parseArgs = (argv: string[], site: string) => {
        this.printHelp();
        const result: type_args = {
            macros: [],
            settings: path.join(`${os.homedir()}`, ".tdm/profiles.json"),
            profile: "",
            alsoOpenDefaults: false,
            fileNames: [],
            attach: -1,
            cwd: process.cwd(),
            mainProcessMode: "desktop",
            httpServerPort: httpServerPort,
            site: site,
        };

        // the process.argv is different for development mode and packaged TDM
        let ii0 = 2;
        if (app.isPackaged) {
            ii0 = 1;
        }

        try {
            for (let ii = ii0; ii < argv.length; ii++) {
                const arg = argv[ii];
                if (arg === dashdashMacros) {
                    ii++;
                    result["macros"] = this.parseMacros(argv[ii]);
                } else if (arg === dashdashHelp) {
                    // this.printHelp();
                    // exit the application, 
                    // do not use app.quit(), that will continue the electron for a while
                    app.exit();
                } else if (arg === dashdashSettings) {
                    ii++;
                    result["settings"] = this.parseSettings(argv[ii]);
                } else if (arg === dashdashProfile) {
                    ii++;
                    result["profile"] = this.parseProfile(argv[ii]);
                } else if (arg === dashdashLogLevel) {
                    ii++;
                    this.parseLogLevel(argv[ii]);
                } else if (arg === dashdashLogStackTrace) {
                    this.parseLogStackTrace();
                } else if (arg === dashdashAttach) {
                    const port = this.parseAttach(argv[ii + 1]);
                    if (port === -2) {
                        // try to attach to the existing instance
                    } else if (port === -1) {
                        // do not attach, open this is instance
                    } else {
                        // attach to a specific instance
                        ii++;
                    }
                    result["attach"] = port;
                } else if (arg === dashdashAlsoOpenDefaults) {
                    result["alsoOpenDefaults"] = true;
                } else if (arg === dashdashHttpServerPort) {
                    ii++;
                    result["httpServerPort"] = this.parseHttpServerPort(argv[ii]);;
                } else if (arg === dashMainProcessMode) {
                    ii++;
                    // there are only 2 modes: desktop and web
                    // the ssh-client mode is a mode selected in desktop if the profile contains ssh configuration
                    if (argv[ii] === "desktop") {
                        result["mainProcessMode"] = "desktop";
                    } else if (argv[ii] === "web") {
                        result["mainProcessMode"] = "web";
                    } else if (argv[ii] === "ssh-server") {
                        result["mainProcessMode"] = "ssh-server";
                    } else {
                        throw new Error("Error at --main-process-mode")
                    }
                } else {
                    // file names
                    result.fileNames.push(arg);
                }
            }
        } catch (e) {
            const resultTmp: type_args = {
                macros: [],
                settings: "",
                profile: "",
                alsoOpenDefaults: false,
                fileNames: [],
                attach: -1,
                cwd: process.cwd(),
                mainProcessMode: "desktop",
                httpServerPort: 3000,
                site: site,
            };
            return resultTmp;
        }
        return result;
    };

    static parseSettings = (settingsRawStr: string) => {
        if (settingsRawStr.startsWith("-")) {
            throw new Error("Error at --settings");
        }
        return settingsRawStr;
    };


    static parseHttpServerPort = (httpServerPortRawStr: string) => {
        if (httpServerPortRawStr.startsWith("-")) {
            throw new Error("Error at --settings");
        }
        const httpServerPort = parseInt(httpServerPortRawStr);
        if (typeof httpServerPort === "number") {
            return httpServerPort;
        } else {
            throw new Error("Error at --settings");
        }
    };

    static parseProfile = (profileRawStr: string) => {
        if (profileRawStr.startsWith("-")) {
            throw new Error("Error at --profile");
        }
        return profileRawStr;
    };

    static parseLogLevel = (logLevelRawStr: string) => {
        const logLevel = type_log_levels[logLevelRawStr as keyof typeof type_log_levels];
        if (logLevel !== undefined) {
            Log.setLogLevel(logLevel);
        } else {
            Log.error("-1", "Error parsing --log-level argument", logLevelRawStr);
        }
    }

    static parseLogStackTrace = () => {
        Log.setUseStackTrace(true);
    }

    static parseMacros = (macrosRawStr: string) => {
        if (macrosRawStr.startsWith("-")) {
            throw new Error("Error at --macros");
        }
        const result: [string, string][] = [];
        const reg = /[^=]+\=(\s*)[^\s]+/g;
        const macrosRawArray = macrosRawStr.replaceAll(`"`, "").replaceAll(`,`, " ").match(reg);
        if (macrosRawArray !== null) {
            for (let macroRaw of macrosRawArray) {
                const macroRawArray = macroRaw.split("=");
                if (macroRawArray.length === 2) {
                    const name = macroRawArray[0].trim();
                    const value = macroRawArray[1].trim();
                    result.push([name, value]);
                }
            }
        }
        return result;
    };

    static parseAttach = (portRawStr: string) => {

        if (portRawStr.trim().startsWith("--") || portRawStr.trim().endsWith(".tdl") || portRawStr.trim().endsWith(".edl") || portRawStr.trim().endsWith(".bob")) {
            // throw new Error("Error at --attach");
            // try to attach to an existing TDM instance
            // "--xxx --attach --xxx --xxx
            return -2;
        }
        const port = parseInt(portRawStr);
        if (!isNaN(port)) {
            // "--attach 9527"
            return port;
        } else {
            // wrong format
            // "--attach abcd"
            return -1;
        }
    };

    static printTdmBanner = () =>
        console.log(`
-----------------------------------------------
      Welcome to use TDM Display Manager      
-----------------------------------------------
`);
}
