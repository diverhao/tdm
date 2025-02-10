import { MainProcess } from "./MainProcess";
import { WsOpenerServer } from "../wsOpener/WsOpenerServer";
import { type_args } from "../arg/ArgParser";
import { sshTcpServerPort, httpServerPort } from "../global/GlobalVariables";
import { Log } from "../log/Log";
import { app, BrowserWindow, Menu } from "electron";
import { IpcManagerOnMainProcesses } from "./IpcManagerOnMainProcesses";
import { websocketIpcServerPort, websocketOpenerServerPort } from "../global/GlobalVariables";
import { HttpServer } from "./HttpServer";
import { type_sshServerConfig } from "./SshClient";
import { ApplicationMenu } from "./ApplicationMenu";
import { LocalFontsReader } from "../file/LocalFontsReader";
import * as fs from "fs";
import { Profiles } from "../profile/Profiles";
import { FileReader } from "../file/FileReader";

export class MainProcesses {
    _processes: MainProcess[] = [];
    readonly _profilesFileName: string;
    _wsOpenerServer: WsOpenerServer;
    _ipcManager: IpcManagerOnMainProcesses;
    _httpServer: HttpServer | undefined = undefined;
    _applicationMenu: ApplicationMenu;
    _localFontNames: string[] = [];
    _sshServerSelfDestructionCountDown: NodeJS.Timeout | undefined = undefined;

    constructor(args: type_args) {

        this._profilesFileName = args["settings"];
        // if this profile is not found, show profile-selection page
        // 9527 is the starting port for opener server, if this port is being used, increase it until there is an available one
        this._wsOpenerServer = new WsOpenerServer(this, websocketOpenerServerPort);
        // menubar on top of the window or top of the screen
        this._applicationMenu = new ApplicationMenu(this);

        // unlike above websocket ports which are dynamically assigned, the http server port is static
        if (args["mainProcessMode"] === "web") {
            // this port is not dynamically assigned, if this port is not available, quit
            let port = args["httpServerPort"];
            if (typeof port !== "number") {
                port = httpServerPort; // default 3000
            }

            // read profiles file for https certificate and key file names
            // this is done before creating the Profiles object
            // then create the HttpServer object
            const profilesJson = this.readProfilesJsonFromFileSync();
            const firstProfileJson = Object.values(profilesJson)[0];
            if (firstProfileJson === undefined) {
                throw new Error("Web mode: no profile. Quit");
            }
            const webServerCategoryJson = firstProfileJson["Web Server"];
            if (webServerCategoryJson === undefined) {
                throw new Error("Web mode: no Web Server cateogry in first profile. Quit");
            }
            const httpsKeyFileProperty = webServerCategoryJson["Https Key File"];
            const httpsCertificateProperty = webServerCategoryJson["Https Certificate"];
            if (httpsKeyFileProperty === undefined || httpsCertificateProperty === undefined) {
                throw new Error("Web mode: https key file or certificate property not defined in profile. Quit");
            }
            const httpsKeyFileName = httpsKeyFileProperty["value"];
            const httpsCertificateFileName = httpsCertificateProperty["value"];
            if (httpsKeyFileName === undefined || httpsCertificateFileName === undefined) {
                throw new Error("Web mode: https key file name or certificate file name not defined in profile. Quit");
            }

            const ldapUriProperty = webServerCategoryJson["LDAP URI"]
            if (ldapUriProperty === undefined) {
                throw new Error("");
            }
            const ldapDistinguishedNameProperty = webServerCategoryJson["LDAP Distinguished Name"]
            if (ldapDistinguishedNameProperty === undefined) {
                throw new Error("");
            }
            const ldapSearchBaseProperty = webServerCategoryJson["LDAP Search Base"]
            if (ldapSearchBaseProperty === undefined) {
                throw new Error("");
            }
            const ldapSearchFilterProperty = webServerCategoryJson["LDAP Search Filter"]
            if (ldapSearchFilterProperty === undefined) {
                throw new Error("");
            }
            const ldapSearchScopeProperty = webServerCategoryJson["LDAP Search Scope"]
            if (ldapSearchScopeProperty === undefined) {
                throw new Error("");
            }
            const ldapUri = ldapUriProperty["value"];
            const ldapDistinguishedName = ldapDistinguishedNameProperty["value"];
            const ldapSearchBase = ldapSearchBaseProperty["value"];
            const ldapSearchFilter = ldapSearchFilterProperty["value"];
            const ldapSearchScope =  ldapSearchScopeProperty["value"];
    

            const httpsOptions: {url: string, bindDN: string, searchBase: string, searchFilter: string, searchScope: string, key: Buffer, cert: Buffer} = {
                url: ldapUri,
                bindDN: ldapDistinguishedName,
                // bindCredentials: ldapBindCredentials,
                searchBase: ldapSearchBase,
                searchFilter: ldapSearchFilter,
                searchScope: ldapSearchScope,
                key: fs.readFileSync(httpsKeyFileName),
                cert: fs.readFileSync(httpsCertificateFileName),
            };

            this._httpServer = new HttpServer(this, port);
            this._httpServer.setHttpsOptions(httpsOptions);
            this._httpServer.setLdapOptions(httpsOptions);
            this._httpServer.createServer();

            // in web mode, the websocket (wss://) server port must be the same as the https port
            const websocketIpcServerPort = port;
            this._ipcManager = new IpcManagerOnMainProcesses(this, websocketIpcServerPort, this._httpServer.getHttpsServer());

        } else if (args["mainProcessMode"] === "desktop") {
            this._ipcManager = new IpcManagerOnMainProcesses(this, websocketIpcServerPort);
            // Create a custom menu template
            this.getApplicationMenu().createApplicationMenu()
        } else if (args["mainProcessMode"] === "ssh-server") {
            this._ipcManager = new IpcManagerOnMainProcesses(this, websocketIpcServerPort);
            // self destruction count down until tcp server heartbeat starts to run
            this.startSshServerSelfDestructionCountDown();
            this.getIpcManager().createSshServer();
            // if this port is occupied, use the next available one
            // it will retry 100 times
            this.getIpcManager().getSshServer()?.createTcpServer(sshTcpServerPort);
        } else {
            throw new Error(`Unrecognized mode ${args["mainProcessMode"]}`);
        }
    }

    quit = () => {
        Log.debug("-1", "------------------------ quit main processes ------------------------------");
        // quit Websocket Opener Server
        this.getWsOpenerServer().quit();
        // quit electron
        app.quit();
        // better not be used
        process.exit();
    };
    removeProcess = (processId: string) => {
        for (let ii = 0; ii < this.getProcesses().length; ii++) {
            const process = this.getProcesses()[ii];
            if (processId === process.getProcessId()) {
                this.getProcesses().splice(ii, 1);
                return;
            }
        }
    };

    /**
     * Create a MainProcess. <br>
     *
     * In "web" mode, there is only one main process that can be created.
     *
     * The callback function is executed after the main window gui is created. <br>
     *
     * The callback is not invoked in web mode <br>
     */
    createProcess = (
        callback: ((mainProcess: MainProcess) => any) | undefined = undefined,
        mainProcessMode: "desktop" | "web" | "ssh-server" | "ssh-client" = "desktop",
        mainProcessId: string | undefined = undefined,
        sshServerConfig?: type_sshServerConfig & { callingProcessId: string }
    ) => {
        // there should be only one main process in "web" mode
        if (mainProcessMode === "web") {
            if (this.getProcesses().length >= 1) {
                Log.info('-1', "The web mode only host one process");
                return this.getProcesses()[0];
            }
        }

        // process ID
        let processIds: string[] = [];
        for (let ii = 0; ii < this.getProcesses().length; ii++) {
            const process = this.getProcesses()[ii];
            processIds.push(process.getProcessId());
        }
        let newProcessId = "0";
        if (mainProcessId === undefined) {
            // automatically assign
            let maxId = -1;
            for (let existingProcessId of processIds) {
                maxId = Math.max(maxId, parseInt(existingProcessId));
            }
            newProcessId = `${maxId + 1}`;
        } else {
            // todo: id collission
            newProcessId = mainProcessId;
        }
        Log.info('-1', `Creating TDM process #${newProcessId} in ${mainProcessMode} mode`);

        // read local fonts
        LocalFontsReader.readLocalFontsMeta().then((fontsMeta: {
            family: string;
            subFamily: string;
            postscriptName: string;
            fontFullFileName: string;
        }[]) => {
            for (let fontMeta of fontsMeta) {
                // const fullFontName = fontMeta["family"] + " " + fontMeta["subFamily"];
                const fullFontName = fontMeta["family"];
                if (fullFontName.startsWith(".")) {
                    continue;
                }
                this._localFontNames.push(fullFontName);
            }
            this._localFontNames = [...new Set(this._localFontNames)].sort();
        })

        const newProcess = new MainProcess(this, newProcessId, this.getProfilesFileName(), callback, mainProcessMode, sshServerConfig);
        this.getProcesses().push(newProcess);
        return newProcess;
    };

    // getters

    getProcesses = () => {
        return this._processes;
    };

    getProfilesFileName = () => {
        return this._profilesFileName;
    };

    getWsOpenerServer = () => {
        return this._wsOpenerServer;
    };

    getProcess = (processId: string): MainProcess | undefined => {
        for (let process of this._processes) {
            if (processId === process.getProcessId()) {
                return process;
            }
        }
        return undefined;
    };

    getIpcManager = () => {
        return this._ipcManager;
    };

    getHttpServer = () => {
        return this._httpServer;
    };

    getApplicationMenu = () => {
        return this._applicationMenu;
    }

    getLocalFontNames = () => {
        return this._localFontNames;
    }
    startSshServerSelfDestructionCountDown = () => {
        // self destruct after 15 seconds unless it is cleared by http 
        this._sshServerSelfDestructionCountDown = setTimeout(() => {
            this.quit();
        }, 15 * 1000);
    }
    clearSshServerSelfDestructionCountDown = () => {
        clearTimeout(this._sshServerSelfDestructionCountDown);
    }

    /**
     * For web mode reading the profiles file content
     */
    readProfilesJsonFromFileSync = (): Record<string, any> => {
        // test if file exists
        const filePath = this._profilesFileName;
        const fileExists = fs.existsSync(filePath);
        if (fileExists) {
            try {
                // (1)
                let profilesFileContents: Record<string, any> = FileReader.readJSONsync(filePath, false);
                // throws an exception, re-throw below
                Profiles.validateProfiles(profilesFileContents);
                return profilesFileContents
            } catch (e) {
                // (2)
                throw new Error("This is not a valid profiles file");
            }
        } else {
            throw new Error("Profiles file does not exist.");
        }
    };

}

