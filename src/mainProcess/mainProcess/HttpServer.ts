import express, { Express } from "express";
const bodyParser = require('body-parser');
import https from "https";

import session from "express-session";
import ldap from 'ldapjs';

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
    _httpsOptions: { key: Buffer, cert: Buffer } | undefined = undefined;
    _httpsServer: https.Server | undefined = undefined;

    constructor(mainProcesses: MainProcesses, port: number) {
        this._port = port;
        this._mainProcesses = mainProcesses;
        this.createServer();
    }

    authGuard = (req: any, res: any, next: any) => {
        if (!req.session.authenticated) {
            return res.status(403).send("Access Denied. Please <a href='/'>log in</a>.");
        }
        next();  // Proceed to the next middleware or route handler
    };

    setHttpsOptions = () => {
        // const mainProcess = this.getMainProcesses().getProcess("0");
        // if (mainProcess === undefined) {
        //     logs.error("-1", "Cannot find main process 0 in web mode. Quit.")
        //     this._httpsOptions = undefined;
        //     return;
        // }
        // const selectedProfile = mainProcess.getProfiles().getSelectedProfile();
        // if (selectedProfile === undefined) {
        //     logs.error("-1", "Profile not selected in web mode. Quit.")
        //     this._httpsOptions = undefined;
        //     return undefined;
        // }
        // const httpsKeyFile = selectedProfile.getHttpsKeyFile();
        // const httpsCertificate = selectedProfile.getHttpsCertificate();
        // if (httpsKeyFile === undefined || httpsCertificate === undefined) {
        //     logs.error("-1", "Https key file or certificate not defined in profile. Cannot proceed web mode server.")
        //     this._httpsOptions = undefined;
        //     return undefined;
        // }

        this._httpsOptions = {
            // key: fs.readFileSync(httpsKeyFile),
            // cert: fs.readFileSync(httpsCertificate),
            key: fs.readFileSync("/Users/1h7/projects2/javascript/test89-https-express/server.key"),
            cert: fs.readFileSync("/Users/1h7/projects2/javascript/test89-https-express/server.cert"),
        }
    }

    // setHttpsOptions = (newOptions: {key: Buffer, cert: Buffer}) => {
    //     this._httpsOptions = newOptions;
    // }

    getHttpsOptions = () => {
        return this._httpsOptions;
    }

    // this server must be created after the main 
    createServer = () => {
        this._server = express();

        this.setHttpsOptions();

        // start http server
        this.getServer()?.get("/main", (request: IncomingMessage, response: any, next: any) => {
            logs.debug("0", "New connection coming in from", request.socket.address());
            // there shoul have been a main process with id = "0" running
            const mainProcess = this.getMainProcesses().getProcess("0");
            if (mainProcess === undefined) {
                return;
            }
            const profileName = mainProcess.getProfiles().getSelectedProfileName();
            // select the first profile
            // invoke DisplayWidnowAgent.createBrowserWindow() to send a html page to client
            mainProcess.getIpcManager().handleProfileSelected(undefined, profileName, undefined, response);
        });


        // this.getServer()?.get("/DisplayWindow.html*", () => {
        //     console.log("--------------- new GET request ------------------");
        // })

        this.getServer()?.use(express.json({ limit: 10 * 1024 * 1024 })); // Increase the limit to 10 MB
        this.getServer()?.use(express.urlencoded({ limit: 10 * 1024 * 1024, extended: true }));

        // ----------------- LDAP -------------------------

        this.getServer()?.use(session({
            secret: 'supersecretkey',
            resave: false,
            saveUninitialized: true
        }));


        this.getServer()?.use((req, res, next) => {
            const excludedRoutes = ['/login', "/"];  // Routes to exclude from authGuard
            if (excludedRoutes.includes(req.path) || req.path.startsWith("/resources/webpages/")) {
                return next();  // Skip authGuard and move to next middleware/route handler
            }
            this.authGuard(req, res, next);  // Apply authGuard to all other routes
        });

        // root access to login page
        this.getServer()?.get("/", (request: IncomingMessage, response: any, next: any) => {
            response.sendFile(path.join(__dirname, "../../webpack/resources/webpages/login.html"))
        });

        // LDAP Authentication Route
        this.getServer()?.post('/login', (req: any, res: any) => {
            const { username, password } = req.body;
            const mainProcess = this.getMainProcesses().getProcess("0");
            if (mainProcess === undefined) {
                logs.error("-1", "Cannot find main process 0 in web mode. Quit.")
                return;
            }
            const selectedProfile = mainProcess.getProfiles().getSelectedProfile();
            if (selectedProfile === undefined) {
                logs.error("-1", "Profile not selected in web mode. Quit.")
                return;
            }
            const ldapUri = selectedProfile.getLdapUri();
            const ldapDistinguishedName = selectedProfile.getLdapDistinguishedName();
            if (ldapUri === undefined || ldapDistinguishedName === undefined) {
                logs.error("-1", "LDAP URI or LDAP Authentication String not defined in profile. Cannot proceed web mode server.")
                return;
            }

            // const client = ldap.createClient({ url: 'ldap://localhost:3890' });
            const client = ldap.createClient({ url: ldapUri });

            // const dn = `uid=${username},ou=users,dc=example,dc=com`;
            const dn = ldapDistinguishedName.replace("${username}", username);

            client.bind(dn, password, (err: any) => {
                if (err) {
                    return res.send("Authentication failed. Check username or password.");
                }

                // Store authentication status in session
                req.session.authenticated = true;
                req.session.username = username;

                client.unbind();
                res.redirect('/main');  // Redirect to the protected page
            });
        });


        // main window
        this.getServer()?.post("/command",
            (request: any, response: any) => {
                const command = request.body["command"];
                logs.debug("-1", "Received POST request from", request.socket.address(), "command =", command);
                const data = request.body["data"];
                if (command === "profile-selected") {
                    const profileName = data;
                    this.getMainProcesses().getProcess("0")?.getIpcManager().handleProfileSelected(undefined, profileName, undefined, response);
                } else if (command === "open-tdl-file") {
                    const options = data;
                    options["postCommand"] = command;
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
                }
            });

        this.getServer()?.use(express.static(path.join(__dirname, "../../webpack")));
        this.getServer()?.use("/webpack", express.static(path.join(__dirname, "../../webpack")));

        // this.getServer()
        //     ?.listen(this.getPort())
        //     .on("error", (err: any) => {
        //         logs.error("-1", "Cannot create http server", err);
        //         logs.error("-1", "Quit program");
        //         this.getMainProcesses().quit();
        //     });


        const httpsOptions = this.getHttpsOptions();
        console.log("--------------------------------------- 1", httpsOptions, this.getPort())
        // Create HTTPS server
        if (httpsOptions === undefined) {
            return;
        }
        this._httpsServer = https.createServer(httpsOptions, this.getServer()).listen(this.getPort(), () => {
            console.log("---------------------------------------")
            console.log("HTTPS Server running on https://localhost");
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

    getMainProcesses = () => {
        return this._mainProcesses;
    };

    getHttpsServer = () => {
        return this._httpsServer;
    }
}
