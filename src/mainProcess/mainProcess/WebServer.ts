import express, { Express } from "express";
import http from "http";
import session from "express-session";
import { IncomingMessage, ServerResponse } from "http";
import { Log } from "../../common/Log";
import path from "path";
import { MainProcess } from "../mainProcess/MainProcess";
import { DisplayWindowAgent } from "../windows/DisplayWindow/DisplayWindowAgent";
import { FileReader } from "../file/FileReader";
import { type_options_createDisplayWindow } from "../windows/WindowAgentsManager";
import { type_tdl } from "../../common/GlobalVariables";

export class WebServer {
    _server: Express | undefined;
    _mainProcess: MainProcess;
    _port: number;
    private _httpServer: http.Server | undefined;

    constructor(mainProcess: MainProcess, port: number) {
        this._port = port;
        this._mainProcess = mainProcess;
        // this.obtainLdapOptions()
        this.createServer();
    }


    createServer = () => {

        const server = express();
        const httpServer = http.createServer(server);

        // ----------------------- midware stack ----------------------------
        // all incoming http request need to go through the midwares

        // parse JSON, increase the limit to 10 MB, we can get json via req.data
        server.use(express.json({ limit: 10 * 1024 * 1024 }));
        server.use(express.urlencoded({ limit: 10 * 1024 * 1024, extended: true }));

        // passport.js and session
        // express-session midware, passport.js depends on it
        server.use(session({
            secret: "secretKey",
            resave: false,
            saveUninitialized: true
        }));

        server.use(express.static(path.join(__dirname, "../../webpack")));
        server.use("/webpack", express.static(path.join(__dirname, "../../webpack")));

        // ----------------------- GET --------------------------------

        server.get("/", async (request: IncomingMessage, response: any, next: any) => {
            Log.info("New http connection coming in from", request.socket.address());
            // read first tdl file
            const tdlResult = await this.readFirstTdl();
            if (tdlResult === undefined) {
                return;
            }
            const displayWindowAgent = await this.createFirstDisplayWindowAgent(tdlResult);
            if (displayWindowAgent === undefined) {
                return;
            }
            if (displayWindowAgent instanceof DisplayWindowAgent) {
                response.redirect(`/DisplayWindow.html?displayWindowId=${displayWindowAgent.getId()}`)
                const lifeCycleManager = displayWindowAgent.getDisplayWindowLifeCycleManager();
                // after the ipc is connected
                lifeCycleManager.createBrowserWindow({}, true);
            }
        });

        // ------------------------ POST -----------------------------------


        // HTTP POST requests
        // normally the communication should be through websocket, but some commands can only be done in http
        server.post("/command",
            async (request: any, response: any) => {
                // the received JSON is automatically parsed
                const command = request.body["command"];
                Log.debug("Received POST request from", request.socket.address(), "command =", command);
                const data = request.body["data"];
                if (command === "profile-selected") {
                    // const profileName = data;
                    // this.getMainProcess().getIpcManager().handleProfileSelected(undefined, {
                    //     selectedProfileName: profileName,
                    //     args: undefined,
                    //     httpResponse: response,
                    // });
                } else if (command === "open-tdl-file") {
                    const options = data;
                    options["postCommand"] = command;
                    // const {displayWindowId, tdlFileName, mode, macros,editable, replaceMacros } = options;
                    // Log.info(data);
                    // this.getMainProcess().getIpcManager().handleOpenTdlFiles(undefined,
                    //     {
                    //         options: options,
                    //     }
                    // );

                    // response.redirect(`<html>OKOKOK</html>`)
                    response.json({
                        abc: 333,
                    })
                } else if (command === "duplicate-display") {
                    // const options = data;
                    // Log.debug(data);
                    // this.getMainProcess().getIpcManager().handleDuplicateDisplay(undefined,
                    //     {
                    //         options: options,
                    //         httpResponse: response,
                    //     }
                    // );
                } else if (command === "create-utility-display-window") {
                    // const utilityType = data["utilityType"];
                    // const utilityOptions = data["utilityOptions"];
                    // Log.debug(data);
                    // this.getMainProcess().getIpcManager().createUtilityDisplayWindow(undefined,
                    //     {
                    //         utilityType: utilityType,
                    //         utilityOptions: utilityOptions,
                    //         httpResponse: response,
                    //     }
                    // );
                } else if (command === "create-new-display-in-web-mode") {
                    // Log.debug(data);
                    // this.getMainProcess().getWindowAgentsManager().createBlankDisplayWindow(response);
                } else if (command === "media") {
                    // Log.debug(data);
                    // try {
                    //     const fullFileName = data["fullFileName"];
                    //     const fileBuffer = fs.readFileSync(fullFileName);
                    //     const fileBase64Str = fileBuffer.toString("base64");
                    //     response.send(JSON.stringify({ content: fileBase64Str }));
                    // } catch (e) {
                    //     Log.error("Cannot read file", data["imageFileName"])
                    //     response.send(JSON.stringify({ image: "" }));
                    // }
                } else if (command === "get-ipc-server-port") {
                    // sent out during the DisplayWindow.html is loading, before the DisplayWindowClient object is created, the html file has had the 
                    // display window ID, but needs the websocket IPC server port
                    // after the html page obtains this port, it will 
                    // this is not sent via IpcManagerOnDisplayWindow.sendPostRequestCommand()
                    // it is directly sent through fetch API, beacuse the DisplayWindowClient is not created yet!
                    response.json({
                        ipcServerPort: this.getMainProcess().getIpcManager().getPort(),
                    });

                } else if (command === "create-display-window-agent") {
                    // when a webpage refreshes, the server needs to re-create the DisplayWindowAgent object

                    // the data contains the information of the page page
                    const { tdlFileNames, mode, editable, macros, currentTdlFolder } = JSON.parse(data);
                    const tdlFileName = tdlFileNames[0];
                    const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
                    const windowId = "0";

                    // create the DisplayWindowAgent object for this web page, then send
                    // back the display window ID, so that the webpage can proceed to load with 
                    const windowAgentsManager = this.getMainProcess().getWindowAgentsManager();

                    // read the file
                    const tdlResult = await FileReader.readTdlFile(tdlFileName, selectedProfile, currentTdlFolder)
                    if (tdlResult !== undefined) {
                        const tdl = tdlResult["tdl"];
                        const fullTdlFileName = tdlResult["fullTdlFileName"];
                        const options: type_options_createDisplayWindow = {
                            tdl: tdl,
                            mode: mode,
                            editable: editable,
                            tdlFileName: fullTdlFileName,
                            macros: macros,
                            replaceMacros: false,
                            hide: false,
                            windowId: windowId,
                        };
                        const displayWindowId = windowAgentsManager.obtainDisplayWindowId();
                        await windowAgentsManager.createDisplayWindowAgent(options, displayWindowId);
                        const ipcServerPort = this.getMainProcess().getIpcManager().getPort();
                        response.json({
                            command: "create-display-window-agent",
                            data: {
                                displayWindowId: displayWindowId,
                                ipcServerPort: ipcServerPort,
                            }
                        })
                    } else {
                        Log.error(`Failed to refresh the webpage for file ${tdlFileName}`);
                    }
                }
            });


        httpServer.listen(this.getPort(), "127.0.0.1");

        this._httpServer = httpServer;
        this._server = server;
    };

    readFirstTdl = async (): Promise<{ tdl: type_tdl; fullTdlFileName: string; } | undefined> => {
        const mainProcess = this.getMainProcess();
        const profiles = mainProcess.getProfiles();
        const windowAgentsManager = mainProcess.getWindowAgentsManager();
        const selectedProfile = profiles.getSelectedProfile();
        if (selectedProfile === undefined) {
            return undefined;
        }

        let tdlFileNames: string[] = selectedProfile.getEntry("EPICS Custom Environment", "Default TDL Files");
        let tdlFileName = tdlFileNames[0];
        if (typeof tdlFileName !== "string") {
            Log.error("No default TDL files");
            return undefined;
        }
        let macros = selectedProfile.getMacros();
        let currentTdlFolder: undefined | string = undefined;
        const mode = selectedProfile.getMode() as "editing" | "operating";
        const editable = selectedProfile.getEditable();

        const tdlResult = await FileReader.readTdlFile(tdlFileName, selectedProfile, currentTdlFolder)
        if (tdlResult === undefined) {
            Log.error("Cannot read tdl files", tdlFileNames);
            return undefined;
        }

        return tdlResult;
    }

    createFirstDisplayWindowAgent = async (tdlResult: { tdl: type_tdl; fullTdlFileName: string; }): Promise<DisplayWindowAgent | undefined> => {

        const mainProcess = this.getMainProcess();
        const windowAgentsManager = mainProcess.getWindowAgentsManager();
        const profiles = mainProcess.getProfiles();
        const selectedProfile = profiles.getSelectedProfile();
        if (selectedProfile === undefined) {
            return undefined;
        }
        let macros = selectedProfile.getMacros();
        const mode = selectedProfile.getMode() as "editing" | "operating";
        const editable = selectedProfile.getEditable();

        const tdl = tdlResult["tdl"];
        const fullTdlFileName = tdlResult["fullTdlFileName"];
        const options: type_options_createDisplayWindow = {
            tdl: tdl,
            mode: mode,
            editable: editable,
            tdlFileName: fullTdlFileName,
            macros: macros,
            replaceMacros: false,
            hide: false,
        };
        const displayWindowId = windowAgentsManager.obtainDisplayWindowId();
        const displayWindowAgent = await windowAgentsManager.createDisplayWindowAgent(options, displayWindowId);
        return displayWindowAgent;
    }

    getServer = () => {
        return this._server;
    };

    getPort = () => {
        return this._port;
    };

    setPort = (newPort: number) => {
        this._port = newPort;
    };

    getMainProcess = () => {
        return this._mainProcess;
    };

    getHttpServer = () => {
        return this._httpServer;
    }

}
