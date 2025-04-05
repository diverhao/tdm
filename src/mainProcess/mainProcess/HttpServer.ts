import express, { Express } from "express";
import https from "https";
// import cors from "cors";

import passport from "passport";
import LdapStrategy from "passport-ldapauth";

import session from "express-session";

import { IncomingMessage, ServerResponse } from "http";
import { MainProcesses } from "./MainProcesses";
import * as fs from "fs";
import { Log } from "../log/Log";
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
        // this.createServer();
    }

    isAuthenticated(req: any, res: any, next: any) {
        if (req.isAuthenticated()) {
            return next(); // Proceed to the requested route if authenticated
        } else {
            return res.status(403).send("Access Denied. Please <a href='/'>log in</a>.");
        }
    }

    setLdapOptions = (newOptions: { url: string, bindDN: string, searchBase: string, searchFilter: string, searchScope: string, key: Buffer, cert: Buffer }) => {
        this.LDAP_OPTIONS = {
            server: {
                ...this.LDAP_OPTIONS.server,
                url: newOptions.url,
                bindDN: newOptions.bindDN,
                // bindCredentials: ldapBindCredentials,
                searchBase: newOptions.searchBase,
                searchFilter: newOptions.searchFilter,
                searchScope: newOptions.searchScope as any,
            },
        };

    }

    LDAP_OPTIONS: LdapStrategy.Options = {
        server: {
            url: "ldap://localhost:3890",
            bindDN: "",
            bindCredentials: "",
            searchBase: "ou=users,dc=example,dc=com",
            searchFilter: "(uid={{username}})",
            searchScope: "sub",
            tlsOptions: { rejectUnauthorized: false },
        },
    };

    // this server must be created after the main 
    createServer = () => {
        this._server = express();

        Log.info("LDAP options:", this.LDAP_OPTIONS);
        // LDAP
        passport.use(new LdapStrategy(this.LDAP_OPTIONS));
        passport.serializeUser((user, done) => done(null, user));
        passport.deserializeUser((user: any, done) => done(null, user));

        this._server.use(session({
            secret: "secretKey",
            resave: false,
            saveUninitialized: true
        }));
        this.getServer()?.use(express.json({ limit: 10 * 1024 * 1024 })); // Increase the limit to 10 MB
        this.getServer()?.use(express.urlencoded({ limit: 10 * 1024 * 1024, extended: true }));
        // this._server.use(express.json()); // Middleware to parse JSON requests
        this._server.use(passport.initialize());
        this._server.use(passport.session());

        // CORS
        // Allow all origins (or specify a specific origin)
        // this._server.use(cors(
        //     {
        //         origin: "*",
        //         methods: ['GET', 'POST'],
        //         allowedHeaders: ['Content-Type', 'Authorization'],

        //     }
        // ));


        // Skip authentication for specific routes (like "/" and "/login")
        this._server.use((req: any, res: any, next: any) => {
            if (req.path === '/' || req.path === '/login' || req.path.startsWith("/resources/webpages/")) {
                return next(); // Skip authentication for these routes
            }
            this.isAuthenticated(req, res, next); // Apply authentication middleware to all other routes
        });

        this.getServer()?.use(session({
            secret: 'supersecretkey',
            resave: false,
            saveUninitialized: true
        }));


        // start http server
        this.getServer()?.get("/main", (request: IncomingMessage, response: any, next: any) => {
            Log.info("0", "New https connection coming in from", request.socket.address());
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



        // ----------------- LDAP -------------------------



        // root access to login page
        this.getServer()?.get("/", (req: any, res: any, next: any) => {
            if (req.session.user) {
                // Already logged in!
                return res.redirect('/main');
            }
            res.sendFile(path.join(__dirname, "../../webpack/resources/webpages/login.html"))
        });

        // LDAP Authentication Route
        this.getServer()?.post('/login',

            passport.authenticate("ldapauth", { session: true }),

            (req: any, res: any) => {
                // const { username, password } = req.body;
                const mainProcess = this.getMainProcesses().getProcess("0");
                if (mainProcess === undefined) {
                    Log.error("-1", "Cannot find main process 0 in web mode. Quit.")
                    return;
                }
                const selectedProfile = mainProcess.getProfiles().getSelectedProfile();
                if (selectedProfile === undefined) {
                    Log.error("-1", "Profile not selected in web mode. Quit.")
                    return;
                }

                // store session
                req.session.user = {
                    username: req.body.username
                };

                res.redirect('/main');  // Redirect to the protected page
            }
        );



        // main window
        this.getServer()?.post("/command",
            (request: any, response: any) => {
                const command = request.body["command"];
                Log.debug("-1", "Received POST request from", request.socket.address(), "command =", command);
                const data = request.body["data"];
                if (command === "profile-selected") {
                    const profileName = data;
                    this.getMainProcesses().getProcess("0")?.getIpcManager().handleProfileSelected(undefined, profileName, undefined, response);
                } else if (command === "open-tdl-file") {
                    const options = data;
                    options["postCommand"] = command;
                    Log.debug("-1", data);
                    this.getMainProcesses().getProcess("0")?.getIpcManager().handleOpenTdlFiles(undefined, options, response);
                } else if (command === "duplicate-display") {
                    const options = data;
                    Log.debug("-1", data);
                    this.getMainProcesses().getProcess("0")?.getIpcManager().handleDuplicateDisplay(undefined, options, response);
                } else if (command === "create-utility-display-window") {
                    const utilityType = data["utilityType"];
                    const utilityOptions = data["utilityOptions"];
                    Log.debug("-1", data);
                    this.getMainProcesses().getProcess("0")?.getIpcManager().createUtilityDisplayWindow(undefined, utilityType, utilityOptions, response);
                } else if (command === "create-new-display-in-web-mode") {
                    Log.debug("-1", data);
                    this.getMainProcesses().getProcess("0")?.getWindowAgentsManager().createBlankDisplayWindow(response);
                } else if (command === "media") {
                    Log.debug("-1", data);
                    try {
                        const fullFileName = data["fullFileName"];
                        const fileBuffer = fs.readFileSync(fullFileName);
                        const fileBase64Str = fileBuffer.toString("base64");
                        response.send(JSON.stringify({ content: fileBase64Str }));
                    } catch (e) {
                        Log.error("-1", "Cannot read file", data["imageFileName"])
                        response.send(JSON.stringify({ image: "" }));
                    }
                }
            });

        this.getServer()?.use(express.static(path.join(__dirname, "../../webpack")));
        this.getServer()?.use("/webpack", express.static(path.join(__dirname, "../../webpack")));

        // this.getServer()
        //     ?.listen(this.getPort())
        //     .on("error", (err: any) => {
        //         Log.error("-1", "Cannot create http server", err);
        //         Log.error("-1", "Quit program");
        //         this.getMainProcesses().quit();
        //     });


        const httpsOptions = this.getHttpsOptions();
        // Create HTTPS server
        if (httpsOptions === undefined) {
            return;
        }
        this._httpsServer = https.createServer(httpsOptions, this.getServer()).listen(this.getPort(), () => {
            Log.info(`HTTPS Server running on https://localhost:${this.getPort()}`);
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

    setHttpsOptions = (newOptions: { key: Buffer, cert: Buffer }) => {
        this._httpsOptions = newOptions;
    }

    getHttpsOptions = () => {
        return this._httpsOptions;
    }

}
