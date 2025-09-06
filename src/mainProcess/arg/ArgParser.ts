import { app } from "electron";
import path from "path";
import os from "os";
import { httpServerPort } from "../global/GlobalVariables";
import { Log } from "../log/Log";
import { type_log_levels } from "../log/Log";
import { generateAboutInfo } from "../global/GlobalMethods";
import { type_args } from "../mainProcess/IpcEventArgType";


const dashdashMacros = `--macros`;
const dashdashSettings = `--settings`;
const dashdashProfile = `--profile`;
const dashdashAlsoOpenDefaults = `--also-open-defaults`;
const dashdashHttpServerPort = `--http-server-port`;
const dashdashAttach = `--attach`;
const dashdashHelp = `--help`;
const dashdashLogLevel = `--log-level`;
const dashdashLogStackTrace = `--log-stack-trace`;
const dashMainProcessMode = `--main-process-mode`; // "web" | "desktop"

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
  --settings /home/ringop/custom.json     Profiles file
                                          If this option is absent, it will load $HOME/.tdm/profiles.json
  --profile "Control Room"                The profile that will be selected
                                          If this options is absent, the user needs to select a profile manually in GUI
  --macros "SYS=ring, SUB_SYS=bpm"        Macros for all the TDL files in this TDM instance
  --log-level level                       Log level in main process, could be fatal, error, warn, info, debug, or trace
  --log-stack-trace                       If the log prints stack trace
  --also-open-defaults                    Open default TDL files for the selected profile
                                          If this option is absent, default TDL files are not opened 
  --main-process-mode web                 Run the web server
  --http-server-port 3000                 Web server port if the main process mode is web
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

    static printTdmBanner = () => {
        const aboutInfo = generateAboutInfo();
        console.log(`
-----------------------------------------------
      Welcome to use TDM Display Manager
      Version: ${aboutInfo["Version"]}
      Build Date: ${aboutInfo["Build Date"]}
      Based on Electron.js ${aboutInfo["Electron"]}, 
               Node.js ${aboutInfo["Node.js"]} and 
               Chromium ${aboutInfo["Chromium"]}
      License: ${aboutInfo["License"]}
-----------------------------------------------
`)
    };
}
