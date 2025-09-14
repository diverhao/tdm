import express, { Express } from "express";
import https from "https";
// import cors from "cors";

import passport from "passport";
import LdapStrategy from "passport-ldapauth";

import session from "express-session";

import { IncomingMessage, ServerResponse } from "http";
import * as fs from "fs";
import { Log } from "../log/Log";
import path from "path";
import { Profile } from "../profile/Profile";
import { Profiles } from "../profile/Profiles";
import { MainProcess } from "../mainProcess/MainProcess";
import { DisplayWindowAgent } from "../windows/DisplayWindow/DisplayWindowAgent";

export class WebServer {
    _server: Express | undefined;
    _mainProcess: MainProcess;
    _port: number;
    _httpsOptions: { key: Buffer, cert: Buffer } | undefined = undefined;
    _httpsServer: https.Server | undefined = undefined;
    _authenticationMethod: "No authentication" | "LDAP" = "No authentication";

    constructor(mainProcess: MainProcess, port: number) {
        this._port = port;
        this._mainProcess = mainProcess;
        this.obtainLdapOptions()
        this.createServer();
    }

    // ------------------------ authentication ----------------------------

    /**
     * Set the authentication method used for this website
     */
    setAuthenticationMethod = (method: "No authentication" | "LDAP") => {
        this._authenticationMethod = method;
    }


    // -------------------------- LDAP -----------------------------------

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

    /**
     * Read the LDAP options from profiles JSON file (not from the MainProcess or MainProcesses)
     * This should be done before the profile is selected, so the web server will choose the first valid
     * profile and use its LDAP and http options.
     */
    obtainLdapOptions = () => {

        // read profiles file for https certificate and key file names
        // this is done before creating the Profiles object
        // then create the HttpServer object
        const profilesFileName = this.getMainProcess().getProfiles().getFilePath();
        const profilesJson = Profiles.readProfilesJsonSync(profilesFileName);
        if (profilesJson === undefined) {
            throw new Error("Web mode: failed to read profiles file. Quit");
        }
        let firstProfileJson = Object.values(profilesJson)[0];
        if (Object.keys(profilesJson)[0] === "For All Profiles") {
            firstProfileJson = Object.values(profilesJson)[1];
        }
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

        const authenticationMethodProperty = webServerCategoryJson["Authentication Method"];
        if (authenticationMethodProperty === undefined) {
            throw new Error("Web mode: Authentication Method not defined in profile. Quit");
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
        const ldapSearchScope = ldapSearchScopeProperty["value"];
        const authenticationMethod = authenticationMethodProperty["value"];


        const ldapOptions: { url: string, bindDN: string, searchBase: string, searchFilter: string, searchScope: string } = {
            url: ldapUri,
            bindDN: ldapDistinguishedName,
            // bindCredentials: ldapBindCredentials,
            searchBase: ldapSearchBase,
            searchFilter: ldapSearchFilter,
            searchScope: ldapSearchScope,
        };
        const httpsOptions = {
            key: fs.readFileSync(httpsKeyFileName),
            cert: fs.readFileSync(httpsCertificateFileName),
        }
        this.setHttpsOptions(httpsOptions);
        this.setLdapOptions(ldapOptions);
        this.setAuthenticationMethod(authenticationMethod);

    }

    setLdapOptions = (newOptions: { url: string, bindDN: string, searchBase: string, searchFilter: string, searchScope: string }) => {
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


    createServer = () => {

        // create Express.js web server
        this._server = express();

        Log.info("Authentication method for web server:", this._authenticationMethod);
        if (this._authenticationMethod === "LDAP") {
            Log.info("LDAP options:", this.LDAP_OPTIONS);
        }

        // ------------ LDAP authentication ------------------------

        // tell passport.js to use LDAP authentication strategy
        passport.use(new LdapStrategy(this.LDAP_OPTIONS));
        passport.serializeUser((user, done) => done(null, user));
        passport.deserializeUser((user: any, done) => done(null, user));

        // ----------------------- midware stack ----------------------------
        // all incoming http request need to go through the midwares

        // parse JSON, increase the limit to 10 MB, we can get json via req.data
        this._server.use(express.json({ limit: 10 * 1024 * 1024 }));
        this._server.use(express.urlencoded({ limit: 10 * 1024 * 1024, extended: true }));

        // passport.js and session
        // express-session midware, passport.js depends on it
        this._server.use(session({
            secret: "secretKey",
            resave: false,
            saveUninitialized: true
        }));
        // init passport.js
        this._server.use(passport.initialize());
        // add .user, .isAuthenticated(), to req
        this._server.use(passport.session());


        // authentication
        this._server.use((req: any, res: any, next: any) => {
            // Skip authentication for these routes
            if (req.path === '/' || req.path === '/login' || req.path.startsWith("/resources/webpages/")) {
                // proceed to next midware
                next();
                return;
            }

            if (this._authenticationMethod === "No authentication") {
                // no authentication
                next();
                return;
            } else if (this._authenticationMethod === "LDAP") {
                // the authentication happens in the `/login` POST, after that the req.isAuthenticated() is always true
                if (req.isAuthenticated()) {
                    next(); // Proceed to the requested route if authenticated
                    return
                } else {
                    // next() is not invoked, midware chain stops here
                    res.status(403).send("Access Denied. Please <a href='/'>log in</a>.");
                    return;
                }
            }
        });

        this._server.use(express.static(path.join(__dirname, "../../webpack")));
        this._server.use("/webpack", express.static(path.join(__dirname, "../../webpack")));

        // ----------------------- GET --------------------------------

        // root access to login page
        this._server.get("/", (req: any, res: any, next: any) => {

            if (req.isAuthenticated && req.isAuthenticated()) {
                // Already logged in!
                return res.redirect('/main');
            }
            if (this._authenticationMethod === "LDAP") {
                // use LDAP login
                res.sendFile(path.join(__dirname, "../../webpack/resources/webpages/login.html"))
            } else if (this._authenticationMethod === "No authentication") {
                // same as the "/login" POST request
                const mainProcess = this.getMainProcess();
                if (mainProcess === undefined) {
                    Log.error("-1", "Cannot find main process 0 in web mode. Quit.")
                    return;
                }
                const selectedProfile = mainProcess.getProfiles().getSelectedProfile();
                if (selectedProfile === undefined) {
                    Log.error("-1", "Profile not selected in web mode. Quit.")
                    return;
                }

                req.session.user = "ABC"

                res.redirect('/main');  // Redirect to the protected page
            }
        });

        // start http server
        this._server.get("/main", async (request: IncomingMessage, response: any, next: any) => {
            Log.info("0", "New https connection coming in from", request.socket.address());
            // there shoul have been a main process with id = "0" running
            const mainProcess = this.getMainProcess();
            if (mainProcess === undefined) {
                Log.error("Main process not running");
                return;
            }
            // the selected profile name is set when MainProcess is created
            const profileName = mainProcess.getProfiles().getSelectedProfileName();
            // select the first profile
            // invoke DisplayWidnowAgent.createBrowserWindow() to send a html page to client
            // mainProcess.getIpcManager().handleProfileSelected(undefined, profileName, undefined, response);
            const displayWindowAgent = await mainProcess.getIpcManager().handleProfileSelected(undefined, {
                selectedProfileName: profileName,
                args: undefined,
            });
            if (displayWindowAgent instanceof DisplayWindowAgent) {
                response.redirect(`/DisplayWindow.html?displayWindowId=${displayWindowAgent.getId()}`)
            }


        });


        // ------------------------ POST -----------------------------------

        this._server.post('/login',

            // authentication midware
            (req: any, res: any, next: any) => {
                if (this._authenticationMethod === "LDAP") {
                    const ldapMidware = passport.authenticate("ldapauth", { session: true });
                    ldapMidware(req, res, next);
                    return;
                } else if (this._authenticationMethod === "No authentication") {
                    // proceed
                    next();
                    return;
                } else {
                    // proceed
                    next();
                    return;
                }
            },

            // invoked only when the authentication midware calls next()
            (req: any, res: any, next: any) => {
                const mainProcess = this.getMainProcess();
                if (mainProcess === undefined) {
                    Log.error("-1", "Cannot find main process 0 in web mode. Quit.")
                    return;
                }
                const selectedProfile = mainProcess.getProfiles().getSelectedProfile();
                if (selectedProfile === undefined) {
                    Log.error("-1", "Profile not selected in web mode. Quit.")
                    return;
                }

                res.redirect('/main');  // Redirect to the protected page
            }
        );

        // HTTP POST requests
        // normally the communication should be through websocket, but some commands can only be done in http
        this._server.post("/command",
            (request: any, response: any) => {
                // the received JSON is automatically parsed
                const command = request.body["command"];
                Log.debug("-1", "Received POST request from", request.socket.address(), "command =", command);
                const data = request.body["data"];
                if (command === "profile-selected") {
                    // const profileName = data;
                    // this.getMainProcess().getIpcManager().handleProfileSelected(undefined, {
                    //     selectedProfileName: profileName,
                    //     args: undefined,
                    //     httpResponse: response,
                    // });
                } else if (command === "open-tdl-file") {
                    console.log("command open tdl file ============================= 1")
                    // const options = data;
                    // options["postCommand"] = command;
                    // Log.info("-1", data);
                    // this.getMainProcess().getIpcManager().handleOpenTdlFiles(undefined,
                    //     {
                    //         options: options,
                    //         httpResponse: response,
                    //     }
                    // );
                } else if (command === "duplicate-display") {
                    const options = data;
                    Log.debug("-1", data);
                    this.getMainProcess().getIpcManager().handleDuplicateDisplay(undefined,
                        {
                            options: options,
                            httpResponse: response,
                        }
                    );
                } else if (command === "create-utility-display-window") {
                    const utilityType = data["utilityType"];
                    const utilityOptions = data["utilityOptions"];
                    Log.debug("-1", data);
                    this.getMainProcess().getIpcManager().createUtilityDisplayWindow(undefined,
                        {
                            utilityType: utilityType,
                            utilityOptions: utilityOptions,
                            httpResponse: response,
                        }
                    );
                } else if (command === "create-new-display-in-web-mode") {
                    Log.debug("-1", data);
                    this.getMainProcess().getWindowAgentsManager().createBlankDisplayWindow(response);
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
                } else if (command === "get-ipc-server-port") {
                    response.json({
                        ipcServerPort: this.getMainProcess().getIpcManager().getPort(),
                    });

                }
            });

        // ----------------------- https ------------------------------
        const httpsOptions = this.getHttpsOptions();
        if (httpsOptions === undefined) {
            return;
        }
        // listen to all network interfaces
        this._httpsServer = https.createServer(httpsOptions, this.getServer()).listen(this.getPort(), "0.0.0.0", () => {
            Log.info(`HTTPS Server running on port ${this.getPort()}`);
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

    getMainProcess = () => {
        return this._mainProcess;
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
