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
import { generateDisplayWindowHtml } from "../../common/GlobalMethods";

export class WebServer {
    private _server: Express | undefined;
    private _mainProcess: MainProcess;
    private _port: number;
    private _basePath: string;
    private _httpServer: http.Server | undefined;

    constructor(mainProcess: MainProcess, port: number, basePath: string) {
        this._port = port;
        this._mainProcess = mainProcess;
        this._basePath = this.normalizeBasePath(basePath);
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

        // session 
        server.use(session({
            secret: "secretKey",
            resave: false,
            saveUninitialized: true
        }));

        // ----------------------- GET --------------------------------

        // user visit the base page
        server.get(this.getBaseRoute(), async (request: IncomingMessage, response: any, next: any) => {
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
                response.type("html").send(generateDisplayWindowHtml({
                    basePath: this.getBasePath(),
                    displayWindowId: displayWindowAgent.getId(),
                }));

                const lifeCycleManager = displayWindowAgent.getDisplayWindowLifeCycleManager();
                // after the ipc is connected
                lifeCycleManager.createBrowserWindow({}, true);
            }
        });


        // when we open a new tab from ActionButton for FileBrowser, it first sends command to let main process prepare 
        // the resources, i.e. read TDL file, create DisplayWindowAgent, etc, then main process notify
        // the client that "I'm ready to go", the client initiate such a GET request by `window.open(DisplayWindow.html,...)`
        server.get(this.withBasePath("/DisplayWindow.html"), (request: any, response: any, next: any) => {
            const displayWindowId =
                typeof request.query.displayWindowId === "string"
                    ? request.query.displayWindowId
                    : "";
            if (displayWindowId === "") {
                Log.error("Cannot extrat displayWindowId from GET");
                return;
            }

            const nav = request.query.nav;
            if (nav === "new") {
                response.type("html").send(generateDisplayWindowHtml({
                    basePath: this.getBasePath(),
                    displayWindowId: displayWindowId,
                }));
            } else {
                // no nav param means it's a refresh
                return response.type("html").send(`
                    <html>
                        <h1 style="color:rgba(255, 115, 0, 0.68)">
                            Do not refresh or forward/back TDM web page, use "Reload Display" in right click button.
                        </h1>
                        <img src="${this.withBasePath("/webpack")}/resources/webpages/context-menu-web-mode-reload-display.png" style="width:auto"></img>
                    </html>
                    `);
            }
        })

        server.get(this.withBasePath("/HelpWindow.html"), (request: any, response: any) => {
            response.sendFile(path.join(__dirname, "../../webpack/HelpWindow.html"));
        })

        // todo: test
        server.set("trust proxy", true);

        const authMiddleware = (req: any, res: any, next: any) => {
            const remoteAddr = req.socket.remoteAddress;
            if (remoteAddr !== "127.0.0.1" && remoteAddr !== "::1") {
                return res.status(403).send("Forbidden");
            }

            const user = req.header("x-forwarded-user");
            if (!user) {
                return res.status(401).send("Unauthorized");
            }

            req.session.user = {
                name: user,
                email: req.header("x-forwarded-email") ?? "",
                groups: (req.header("x-forwarded-groups") ?? "").split(",").map((s: string) => s.trim()).filter(Boolean),
            };

            next();
        };

        // server.use(authMiddleware);

        // order matters, put them at last
        server.use(this.getBaseRoute(), express.static(path.join(__dirname, "../../webpack")));
        server.use(this.withBasePath("/webpack"), express.static(path.join(__dirname, "../../webpack")));

        // ------------------------ POST -----------------------------------


        // HTTP POST requests
        // normally the communication should be through websocket, but some commands can only be done in http
        server.post(this.withBasePath("/command"),
            async (request: any, response: any) => {
                // the received JSON is automatically parsed
                const command = request.body["command"];
                Log.debug("Received POST request from", request.socket.address(), "command =", command);
                const data = request.body["data"];
                if (command === "profile-selected") {
                } else {
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

    getBasePath = () => {
        return this._basePath;
    }
    private normalizeBasePath(basePath: string): string {
        if (basePath === "" || basePath === "/") {
            return "";
        }
        return basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
    }

    private getBaseRoute(): string {
        return this._basePath === "" ? "/" : this._basePath;
    }

    withBasePath(suffix: string): string {
        return this._basePath === "" ? suffix : `${this._basePath}${suffix}`;
    }


}
