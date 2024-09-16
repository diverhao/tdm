import express, { Express } from "express";
const bodyParser = require('body-parser');

import { IncomingMessage, ServerResponse } from "http";
import * as BodyParser from "body-parser";
import { MainProcesses } from "./MainProcesses";
import * as fs from "fs";
import { logs } from "../global/GlobalVariables";
import path from "path";

export class HttpServer {
    _server: Express | undefined;
    _mainProcesses: MainProcesses;
    _port: number;

    constructor(mainProcesses: MainProcesses, port: number) {
        this._port = port;
        this._mainProcesses = mainProcesses;
        this.createServer();
    }
    createServer = () => {
        this._server = express();

        // start http server
        this.getServer()?.get("/", (request: IncomingMessage, response: any, next: any) => {
            // this.getMainProcesses().getProcess("0")?.getWindowAgentsManager().createMainWindow(response)
            const mainProcess = this.getMainProcesses().getProcess("0");
            if (mainProcess === undefined) {
                return;
            }
            const profileName = mainProcess.getProfiles().getSelectedProfileName();
            mainProcess.getIpcManager().handleProfileSelected(undefined, profileName, undefined, response);
        });

        this.getServer()?.use(express.json({ limit: 10 * 1024 * 1024 })); // Increase the limit to 10 MB
        this.getServer()?.use(express.urlencoded({ limit: 10 * 1024 * 1024, extended: true }));

        // main window
        this.getServer()?.post("/command",
            // this.getJsonParser(), 
            (request: any, response: any) => {
                logs.debug("-1", request.url);
                const command = request.body["command"];
                const data = request.body["data"];
                if (command === "profile-selected") {
                    const profileName = data;
                    this.getMainProcesses().getProcess("0")?.getIpcManager().handleProfileSelected(undefined, profileName, undefined, response);
                } else if (command === "open-tdl-file") {
                    const options = data;
                    logs.debug("-1", data);
                    this.getMainProcesses().getProcess("0")?.getIpcManager().handleOpenTdlFiles(undefined, options, response);
                } else if (command === "duplicate-display") {
                    const options = data;
                    logs.debug("-1", data);
                    this.getMainProcesses().getProcess("0")?.getIpcManager().handleDuplicateDisplay(undefined, options, response);
                } else if (command === "create-utility-display-window") {
                    const utilityType = data["utilityType"];
                    const utilityOptions = data["utilityOptions"];
                    logs.debug("-1", data);
                    this.getMainProcesses().getProcess("0")?.getIpcManager().createUtilityDisplayWindow(undefined, utilityType, utilityOptions, response);
                } else if (command === "create-new-display-in-web-mode") {
                    logs.debug("-1", data);
                    this.getMainProcesses().getProcess("0")?.getWindowAgentsManager().createBlankDisplayWindow(response);
                } else if (command === "media") {
                    logs.debug("-1", data);
                    try {
                        const fullFileName = data["fullFileName"];
                        const fileBuffer = fs.readFileSync(fullFileName);
                        const fileBase64Str = fileBuffer.toString("base64");
                        response.send(JSON.stringify({ content: fileBase64Str }));
                    } catch (e) {
                        logs.error("-1", "Cannot read file", data["imageFileName"])
                        response.send(JSON.stringify({ image: "" }));
                    }
                    // console.log("\n\n\n", imageBase64Str)
                    // this.getMainProcesses().getProcess("0")?.getIpcManager().handleOpenTdlFiles(undefined, data, response);
                }
            });

        this.getServer()?.use(express.static(path.join(__dirname, "../../webpack")));
        this.getServer()?.use("/webpack", express.static(path.join(__dirname, "../../webpack")));

        this.getServer()
            ?.listen(this.getPort())
            .on("error", (err: any) => {
                logs.error("-1", "Cannot create http server", err);
                logs.error("-1", "Quit program");
                this.getMainProcesses().quit();
            });
    };

    getServer = () => {
        return this._server;
    };

    getPort = () => {
        return this._port;
    };

    setPort = (newPort: number) => {
        this._port = newPort;
    };

    // getJsonParser = () => {
    //     return this._jsonParser;
    // };

    // getUrlEncodeParser = () => {
    //     return this._urlencodedParser;
    // };

    getMainProcesses = () => {
        return this._mainProcesses;
    };
}
