import { nativeImage, BrowserWindow, MenuItem, Menu, dialog, clipboard, desktopCapturer, webFrame, webContents, Tray, app } from "electron";
import * as path from "path";
import * as url from "url";
import { type_options_createDisplayWindow, WindowAgentsManager } from "../../windows/WindowAgentsManager";
import { CaChannelAgent, DisplayOperations } from "../../channel/CaChannelAgent";
import { type_dbrData, Channel_DBR_TYPES } from "../../../rendererProcess/global/GlobalVariables";
import { type_tdl } from "../../file/FileReader";
import { ContextMenuDesktop } from "./ContextMenuDesktop";
import fs, { read } from "fs";
import { LocalChannelAgent, type_LocalChannel_data } from "../../channel/LocalChannelAgent";
import { ChannelAgentsManager } from "../../channel/ChannelAgentsManager";
import { homedir } from "os";
import { WebSocket } from "ws";
import { Worker } from "worker_threads";
import * as child_process from "child_process";
import { Log } from "../../log/Log";
import { v4 as uuidv4 } from "uuid";
import { generateAboutInfo } from "../../global/GlobalMethods";
import pidusage from "pidusage";
import * as os from "os";
import { getCurrentDateTimeStr } from "../../global/GlobalMethods";
import { Promises } from "epics-tca";

/**
 * The main process side representation of a display window. <br>
 *
 * Its lifecycle comes along with the display window.
 */
export class DisplayWindowAgent {
    /**
     * tdl JSON object, read only
     */
    private _tdl: Record<string, any> = {};

    /**
     * tdl file name. If the tdl JSON object has no corresponding tdl file, it is `""` <br>
     *
     * If the display window (tdl file) is saved as another file, this field is updated.
     */
    private _tdlFileName: string;
    private _windowName: string = "";

    /**
     * UUID, read only
     */
    private readonly _id: string;

    /**
     * Browser window object
     */
    private _browserWindow: BrowserWindow | undefined;

    /**
     * The CA channels (`CaChannelAgent`) this display window has. <br>
     *
     * For each CA channel `CaChannelAgent`, there is a counter part object: `_displayWindowAgents` <br>
     *
     * **Note**: It only contains the MONITOR operation channels, it does not contain the GET/PUT
     * operation channels, as they always have a timeout.
     */
    private _channelAgents: Record<string, CaChannelAgent | LocalChannelAgent> = {};

    /**
     * Manager of this agent
     */
    private _windowAgentsManager: WindowAgentsManager;

    /**
     * External macros and other options. The internal macros are defined in tdl file.
     */
    private readonly _options: Record<string, any>;

    /**
     * setInterval for sending new channel data to display window
     */
    private _sendChannelsDataInterval: NodeJS.Timeout;
    _takeThumbnailInterval: NodeJS.Timeout | undefined = undefined;

    /**
     * New channel data on this display window. Updated in ChannelAgentsManager.
     */
    // private _newChannelData: Record<string, type_dbrData | { value: undefined }> = {};
    private _newChannelData: Record<string, type_dbrData | type_dbrData[] | { value: undefined }> = {};

    /**
     * The context menu is initiated on display window in renderer process, but it is configured and realized in main process.
     */
    private _contextMenu: ContextMenuDesktop;

    private _modified: boolean = false;

    /**
     * base64 image of the thumbnail
     */
    thumbnail: string = "";

    webSocketMonitorClient: WebSocket | undefined;
    webSocketMonitorChannelNames: string[] = [];

    // private _htmlIndex: string = "";

    /**
     * EmbeddedDisplay stuff
     */
    // _parentDisplayWindowId: string | undefined = undefined;
    // _parentWidgetKey: string | undefined = undefined;
    // -100 means it is a regular display window
    // -1 means it is an embedded display mask
    // >= 0 means it is a regular embedded display
    // 10000 means it is the preloaded embedded display
    // _embeddedDisplayIndex: number = -100;
    _isWebpage: boolean = false;
    _boundValues: { x: number; y: number; width: number; height: number } = {
        x: 0,
        y: 0,
        width: 1,
        height: 1,
    };

    getBoundValues = () => {
        return this._boundValues;
    };
    setBoundValues = (newValues: { x: number; y: number; width: number; height: number }) => {
        this._boundValues = JSON.parse(JSON.stringify(newValues));
    };

    private _mainProcessId: string;

    /**
     * This window is hidden. It is changed to true by this.show()
     */
    hiddenWindow: boolean;

    /**
     * If true, this window is in between "close" and "closed", the further "close" event won't do anything.
     * 
     * We can use this bit to control if we want to close the window forcefully
     */
    readyToClose: boolean = false;

    _macros: [string, string][];
    _isUtilityWindow: boolean;

    private _editable: boolean;
    // if this display window is reloadable, if not, the "Reload" in context menu is gone
    private _reloadable: boolean = true;

    creationResolve: any;
    creationReject: any;
    creationPromise: Promise<string> = new Promise((resolve, reject) => {
        this.creationResolve = resolve;
        this.creationReject = reject;
    });

    promises: Promises = new Promises();


    constructor(windowAgentsManager: WindowAgentsManager, options: type_options_createDisplayWindow, id: string) {
        this._windowAgentsManager = windowAgentsManager;
        this._tdl = JSON.parse(JSON.stringify(options))["tdl"];
        this._isUtilityWindow = this._tdl["Canvas"]["isUtilityWindow"] === undefined ? false : this._tdl["Canvas"]["isUtilityWindow"];

        this._tdlFileName = JSON.parse(JSON.stringify(options))["tdlFileName"];
        this._macros = JSON.parse(JSON.stringify(options["macros"]));
        this.updateHash();

        this._editable = options["editable"];
        // mode bit "editing" overrides the "editable" bit
        if (options["mode"] === "editing") {
            this._editable = true;
        }

        this._options = options;
        this.hiddenWindow = options["hide"];
        this._contextMenu = new ContextMenuDesktop(this);
        this._mainProcessId = this.getWindowAgentsManager().getMainProcess().getProcessId();
        // obtain and assign display window ID
        // this.setHtmlIndex(this.getWindowAgentsManager().getMainProcess().obtainDisplayWindowHtmlIndex());
        // if (id === undefined) {
        // 	this._id = this.getHtmlIndex();
        // } else {
        this._id = id;
        // }

        this._sendChannelsDataInterval = setInterval(() => {
            this.checkChannelsState();
            // this._newChannelData is modified in this.addNewChannelData() which is invoked in
            // channel monitor's callback function (in CaChannelAgent.createMonitor())
            if (Object.keys(this._newChannelData).length > 0) {
                this.sendFromMainProcess("new-channel-data", this._newChannelData);
                this._newChannelData = {};
            }
        }, 100);

        this.promises.appendPromise("tca-get-meta", false);
    }


    // ---------------- web socket PV server ---------------------
    setWebSocketMonitorClient = (webSocketMonitorClient: WebSocket | undefined) => {
        this.webSocketMonitorClient = webSocketMonitorClient;
    };

    getWebSocketMonitorClient = () => {
        return this.webSocketMonitorClient;
    };

    getWebSocketMonitorChannelNames = () => {
        return this.webSocketMonitorChannelNames;
    };

    setWebSocketMonitorChannelNames = (newNames: string[]) => {
        this.webSocketMonitorChannelNames = newNames;
    };

    addWebSocketMonitorChannelName = (newName: string) => {
        this.setWebSocketMonitorChannelNames([...new Set([...this.webSocketMonitorChannelNames, newName])]);
    };

    webSocketClientThread: Worker | child_process.ChildProcess | undefined;

    windowAttachedScriptName: string = "";
    windowAttachedScriptPid: number | undefined = undefined;

    // invoked when the display window is switched to editing mode and the display window is a "real" window (not preloaded)
    createWebSocketClientThread = (port: number, script: string) => {
        if (!(script.endsWith(".py") || script.endsWith(".js"))) {
            Log.debug(this.getMainProcessId(), `Script ${script} won't run for window ${this.getId()}.`);
            this.sendFromMainProcess("dialog-show-message-box", {
                // command?: string | undefined,
                messageType: "error", // | "warning" | "info", // symbol
                humanReadableMessages: [`Failed to execute command "${script} from from this window".`, `We can only run python or node.js scripts.`], // each string has a new line
                rawMessages: [``], // computer generated messages
                // buttons?: type_DialogMessageBoxButton[] | undefined,
                // attachment?: any,
            })
            return;
        }
        if (this.webSocketClientThread !== undefined) {
            this.terminateWebSocketClientThread();
        }

        if (
            this.getWindowAgentsManager().preloadedDisplayWindowAgent === this
            // || this.getWindowAgentsManager().preloadedEmbeddedDisplayAgent === this
        ) {
            Log.debug(this.getMainProcessId(), "This is a preloaded display window, skip creating websocket client thread");
            return;
        }

        // once the thread is created, it never sends data back to main process via the thread model.
        // instead, it talks to the main process via WebSocket
        try {
            if (script.endsWith(".py")) {
                Log.info(this.getMainProcessId(), `Create new Python thread for display window ${this.getId()}`);
                const selectedProfile = this.getWindowAgentsManager().getMainProcess().getProfiles().getSelectedProfile();
                if (selectedProfile !== undefined) {
                    const pythonCommand = selectedProfile.getEntry("EPICS Custom Environment", "Python Command");
                    if (pythonCommand !== undefined) {
                        this.webSocketClientThread = child_process.spawn(pythonCommand, [script, `${port}`, this.getId()], {
                            stdio: "inherit", // not pipe!
                        });
                        if (this.webSocketClientThread instanceof child_process.ChildProcess) {
                            this.windowAttachedScriptName = script;
                            this.windowAttachedScriptPid = this.webSocketClientThread.pid;
                        }
                        // output
                        this.webSocketClientThread.stdout?.on("data", (data) => {
                            Log.debug(this.getMainProcessId(), `Python stdout: ${data}`);
                        });
                        this.webSocketClientThread.stderr?.on("data", (data) => {
                            Log.error(this.getMainProcessId(), `Python stderr: ${data}`);
                        });

                    }
                }
            } else if (script.endsWith(".js")) {
                Log.debug(this.getMainProcessId(), `Create new Javascript thread on display window ${this.getId()}`);
                this.webSocketClientThread = new Worker(script, {
                    workerData: {
                        mainProcessId: this.getMainProcessId(),
                        displayWindowId: this.getId(),
                        port: port,
                        script: script,
                    },
                });
                this.windowAttachedScriptName = script;
                this.windowAttachedScriptPid = process.pid;
            }
        } catch (e) {
            Log.error(this.getMainProcessId(), e);
        }

        // prevent popup window upon error
        this.webSocketClientThread?.on("error", (err: Error) => {
            Log.error(this.getMainProcessId(), err);
            this.sendFromMainProcess("dialog-show-message-box", {
                // command?: string | undefined,
                messageType: "error", // | "warning" | "info", // symbol
                humanReadableMessages: [`Failed to execute command "${script}"`], // each string has a new line
                rawMessages: [`${err}`], // computer generated messages
                // buttons?: type_DialogMessageBoxButton[] | undefined,
                // attachment?: any,
            })
        });
    };

    // invoked when (1) the display window closed, or (2) the display window is switched to editing mode
    terminateWebSocketClientThread = () => {
        Log.debug(this.getMainProcessId(), `Terminate websocket client thread for display window ${this.getId()}`);

        if (this.webSocketClientThread instanceof Worker) {
            this.webSocketClientThread.terminate();
        } else if (this.webSocketClientThread instanceof child_process.ChildProcess) {
            this.webSocketClientThread.kill();
        } else {
            Log.debug(this.getMainProcessId(), "There was no worker thread for WebSocket client");
        }
    };

    removeWebSocketMonitorChannels = () => {
        for (const channelName of this.getWebSocketMonitorChannelNames()) {
            this.removeChannel(channelName);
        }
    }

    // -----------------------------------------------


    // -------------------- channels -----------------------
    // General behaviros for the GET/GET_META/PUT/PUT_META/MONITR operations
    // (1) they will create or connect the channel if the channel agent does not exist.
    //     This is realized by .addAndConnectChannel() or .addAndConnectLocalChannel() function.
    // (2) Before each operation in CA channel, the displayWindowId must be added to the channel agent's
    //     .displayWindowsOperations, when the operation is finished (or timeout),
    //     the displayWindowId is removed from .displayWindowsOperations
    //     This rule does not apply to Local channel. The Local channel adds to .displayWindowsOperations
    //     only for MONITOR operation.
    // (3) At the end of each operation, the .checkChannelOperations() must be invoked to check
    //     if there is any active operation. If not, remove the channel. This rules does not
    //     apply to the PUT_META operation because this operation is used for initialization of a
    //     Local channel.

    /**
     * GET. Create the channel if not exist. <br>
     *
     * (1) If the channel does not exist, create and connect it. If failed, return `undefined`.
     *     This function is blocked until the PV name is resolved.<br>
     *
     * (2) Get. There is always a time out for this function. <br>
     *
     * (3) Reduce the number of clients on `CaChannelAgent`, and check the lifecycle of the `CaChannelAgent`..
     *
     * @param {string} channelName Channel name
     * 
     * @param {Channel_DBR_TYPES | undefined | string} dbrType the desired DBR type (CA) or the pv rquest (PVA)
     * 
     * @param {number} ioTimeout Time out [second].
     *
     */
    tcaGet = async (channelName: string, ioTimeout: number, dbrType: Channel_DBR_TYPES | undefined | string): Promise<type_dbrData | { value: undefined }> => {
        const windowAgentsManager = this.getWindowAgentsManager();
        const mainProcess = windowAgentsManager.getMainProcess();
        const channelAgentsManager = mainProcess.getChannelAgentsManager();
        const channelType = ChannelAgentsManager.determineChannelType(channelName);
        let result: type_LocalChannel_data | type_dbrData = { value: undefined };

        if (channelType === "ca" || channelType === "pva") {
            // (1)
            const t0 = Date.now();
            const connectSuccess = await this.addAndConnectChannel(channelName, ioTimeout);
            const t1 = Date.now();
            // timeout
            if (t1 - t0 > ioTimeout * 1000) {
                return { value: undefined };
            }
            let channelAgent = channelAgentsManager.getChannelAgent(channelName);
            if (!connectSuccess || channelAgent === undefined || !(channelAgent instanceof CaChannelAgent)) {
                Log.debug(this.getMainProcessId(), `tcaGet: EPICS channel ${channelName} cannot be created/connected.`);
                return { value: undefined };
            }
            // (2)
            const channelProtocol = channelAgent.getProtocol();
            if (channelProtocol === "ca" && (typeof dbrType === "number" || dbrType === undefined)) {
                result = await channelAgent.get(this.getId(), dbrType, ioTimeout);
            } else if (channelProtocol === "pva" && typeof dbrType === "string") {
                result = await channelAgent.getPva(this.getId(), ioTimeout);
            }
        } else {
            // (1)
            const connectSuccess = this.addAndConnectLocalChannel(channelName);
            let channelAgent = channelAgentsManager.getChannelAgent(channelName);
            if (!connectSuccess || channelAgent === undefined || !(channelAgent instanceof LocalChannelAgent)) {
                Log.debug(this.getMainProcessId(), `tcaGet: Local channel ${channelName} cannot be created/connected.`);
                return result;
            }
            // (2)
            result = channelAgent.getDbrData();
        }

        // (3)
        if (this.checkChannelOperations(channelName) === false) {
            this.removeChannel(channelName);
        }
        return result;
    };

    /**
     * Get the meta data from CA/PVA/Local channel, if timeout = undefined, no timeout, no dbr data type specified <br>
     *
     * (1) if the channel agent does not exist, and/or the CA/PVA/Local channel is not connected, create/connect it.<br>
     *     For CA/PVA channel, connecting to the channel does not time out.  <br>
     *     For Local channel, the channel agent creation is synchronous.<br>
     *     Then the corresponding data structure is created. <br>
     *
     * (2) If the channel is CA channel, asynchronously obtain GR and TIME type data, then add the "value count",
     *     server address, and native dbr type to the result.<br>
     *     If the channel is Local channel, synchronously get the dbr data. <br>
     * 
     * (3) If the channel is PVA, get the channel PVA type and the value with pv request "".
     *
     * (4) Check if there is any active operations for this channel. If not, destry it.
     */

    tcaGetMeta = async (channelName: string, ioTimeout: number | undefined): Promise<type_dbrData | type_LocalChannel_data | { value: undefined }> => {
        const windowAgentsManager = this.getWindowAgentsManager();
        const mainProcess = windowAgentsManager.getMainProcess();
        const channelAgentsManager = mainProcess.getChannelAgentsManager();
        const channelType = ChannelAgentsManager.determineChannelType(channelName);
        let result: type_LocalChannel_data | type_dbrData = { value: undefined };

        if (channelType === "ca" || channelType === "pva") {
            const t0 = Date.now();

            let connectSuccess = false;
            connectSuccess = await this.addAndConnectChannel(channelName, ioTimeout);

            const t1 = Date.now();
            // timeout
            if (ioTimeout !== undefined) {
                if (t1 - t0 > ioTimeout * 1000) {
                    return { value: undefined };
                }
            }

            let channelAgent = channelAgentsManager.getChannelAgent(channelName);

            if (!connectSuccess || channelAgent === undefined) {
                Log.debug(this.getMainProcessId(), `tcaGetMeta: EPICS channel ${channelName} cannot be created/connected.`);
                return { value: undefined };
            }


            if (channelAgent instanceof CaChannelAgent) {
                if (channelType === "ca") {
                    // (2)
                    const dbrTypeNum_GR = channelAgent.getDbrTypeNum_GR();
                    if (dbrTypeNum_GR === undefined) {
                        Log.debug(this.getMainProcessId(), `Channel ${channelName} does not have a GR type data.`);
                        return { value: undefined };
                    }
                    // only GET once, the get() method may destroy the channel if there is no user
                    result = await channelAgent.get(this.getId(), dbrTypeNum_GR, ioTimeout);

                    // const dbrTypeNum_TIME = channelAgent.getDbrTypeNum_TIME();
                    // if (dbrTypeNum_TIME === undefined) {
                    // Log.debug(this.getMainProcessId(), `Channel ${channelName} does not have a TIME type data.`);
                    // } else {
                    // const dbrDataTime = await channelAgent.get(this.getId(), dbrTypeNum_GR, ioTimeout);
                    // result = { ...result, ...dbrDataTime };
                    // }

                    if (result.value !== undefined) {
                        result.DBR_TYPE = dbrTypeNum_GR;
                        result.valueCount = channelAgent.getValueCount();
                        result.serverAddress = channelAgent.getServerAddress();
                        result.accessRight = channelAgent.getAccessRight();
                    }
                } else if (channelType === "pva") {
                    // (3)
                    result = await channelAgent.fetchPvaType();
                    // result = await channelAgent.getPva(this.getId(), undefined, ""); // get the full type
                }
            }
        } else {
            // loc://
            // (1) no time out
            let connectSuccess = false;
            connectSuccess = this.addAndConnectLocalChannel(channelName);
            let channelAgent = channelAgentsManager.getChannelAgent(channelName);
            if (!connectSuccess || channelAgent === undefined || !(channelAgent instanceof LocalChannelAgent)) {
                Log.debug(this.getMainProcessId(), `tcaGetMeta: Local channel ${channelName} cannot be created/connected.`);
                return result;
            }

            // (2)
            // no need to add and remove channel operations
            result = channelAgent.getDbrData();
        }

        // (4)
        if (this.checkChannelOperations(channelName) === false) {
            // ! shall we remove channel after get meta?
            // this.removeChannel(channelName);
        }

        this.promises.resolvePromise("tca-get-meta", "");

        return result;
    };



    tcaGetPvaType = async (channelName: string): Promise<undefined | any> => {
        const windowAgentsManager = this.getWindowAgentsManager();
        const mainProcess = windowAgentsManager.getMainProcess();
        const channelAgentsManager = mainProcess.getChannelAgentsManager();
        const channelType = ChannelAgentsManager.determineChannelType(channelName);
        let pvaType: any = undefined;

        if (channelType !== "pva") {
            return undefined;
        }

        let connectSuccess = false;
        connectSuccess = await this.addAndConnectChannel(channelName, undefined);

        let channelAgent = channelAgentsManager.getChannelAgent(channelName);

        if (!connectSuccess || channelAgent === undefined) {
            Log.debug(this.getMainProcessId(), `tcaGetMeta: EPICS channel ${channelName} cannot be created/connected.`);
            return { value: undefined };
        }

        if (channelAgent instanceof CaChannelAgent) {
            // (3)
            pvaType = await channelAgent.fetchPvaType();
        }

        // (4)
        if (this.checkChannelOperations(channelName) === false) {
            // ! shall we remove channel after get meta?
            // this.removeChannel(channelName);
        }

        return JSON.parse(JSON.stringify(pvaType));
    };

    /**
     * Write meta data to LocalChannel, not applicable to CaChannel<br>
     *
     * It can be done once
     */
    tcaPutMeta = (
        channelName: string,
        dbrMetaData: {
            value: number | string | undefined;
            type: "number" | "string" | "enum";
            strings: string[];
        }
    ): void => {
        const channelType = ChannelAgentsManager.determineChannelType(channelName);

        if (channelType !== "local") {
            return;
        }

        const windowAgentsManager = this.getWindowAgentsManager();
        const mainProcess = windowAgentsManager.getMainProcess();
        const channelAgentsManager = mainProcess.getChannelAgentsManager();

        this.addAndConnectLocalChannel(channelName);

        const channelAgent = channelAgentsManager.getChannelAgent(channelName);

        if (channelAgent instanceof LocalChannelAgent && channelAgent.metaDataInitialized === true) {
            channelAgent.metaDataInitialized = true;
            channelAgent.setValue(dbrMetaData["value"]);
            channelAgent.setDbrType(dbrMetaData["type"]);
            channelAgent.setDbrStrings(dbrMetaData["strings"]);
        } else {
            Log.error(this.getMainProcessId(), `Cannot find the agent for local channel ${channelName}`);
        }
    };

    /**
     * PUT <br>
     *
     * Create the channel if not exist.  <br>
     *
     * (1) If the channel does not exist, create and connect it. If failed, return `undefined`. <br>
     *
     * (2) Put if the profile allows <br>
     *
     * (3) Reduce the number of clients on `CaChannelAgent`, and check the lifecycle of the `CaChannelAgent`.
     *
     * @returns {Promise<boolean>} `true` when the PUT command is sent out, `false` when the PUT command is not sent
     */
    tcaPut = async (channelName: string, dbrData: type_dbrData | type_LocalChannel_data, ioTimeout: number, pvaValueField: string): Promise<boolean> => {
        const windowAgentsManager = this.getWindowAgentsManager();
        const mainProcess = windowAgentsManager.getMainProcess();
        const channelAgentsManager = mainProcess.getChannelAgentsManager();
        const channelType = ChannelAgentsManager.determineChannelType(channelName);
        // (1)
        if (channelType === "ca" || channelType === "pva") {
            const t0 = Date.now();
            const connectSuccess = await this.addAndConnectChannel(channelName, ioTimeout);

            const t1 = Date.now();
            // timeout
            if (t1 - t0 > ioTimeout * 1000) {
                return false;
            }
            let channelAgent = channelAgentsManager.getChannelAgent(channelName);
            if (!connectSuccess || channelAgent === undefined || !(channelAgent instanceof CaChannelAgent)) {
                Log.debug(this.getMainProcessId(), `tcaPut: EPICS channel ${channelName} cannot be created/connected.`);
                return false;
            }
            // (2)
            const selectedProfile = this.getWindowAgentsManager().getMainProcess().getProfiles().getSelectedProfile();
            if (selectedProfile === undefined) {
                Log.error(-1, "No profile selected, quit PUT operation.")
                return false;
            }
            const disablePut = selectedProfile.getDisablePut();
            if (`${disablePut}`.toLowerCase() === "yes") {
                Log.warn(-1, "This profile does allow PUT operation for", channelName);
                return false;
            } else {
                if (channelType === "ca") {
                    await channelAgent.put(this.getId(), dbrData, ioTimeout);
                } else {
                    await channelAgent.putPva(this.getId(), dbrData, ioTimeout, pvaValueField);
                }
                
                // log PUT operation: PV name, host name, new value
                Log.info("TCA PUT: ", channelName, os.hostname(), JSON.stringify(dbrData).substring(0, 30))

                // (3)
                // channelAgent.reduceClientsNum();
                if (this.checkChannelOperations(channelName) === false) {
                    this.removeChannel(channelName);
                }
            }
        } else {
            // local channel
            const connectSuccess = this.addAndConnectLocalChannel(channelName);
            let channelAgent = channelAgentsManager.getChannelAgent(channelName);
            if (!connectSuccess || channelAgent === undefined || !(channelAgent instanceof LocalChannelAgent)) {
                Log.debug(this.getMainProcessId(), `tcaPut: Local channel ${channelName} cannot be created/connected.`);
                return false;
            }
            channelAgent.put(this.getId(), dbrData as type_LocalChannel_data);
        }
        return true;
    };

    /**
     * Create a monitor for the channel. <br>
     *
     * (1) If the channel does not exist, create and connect it. The connection attampt never times out. <br>
     *
     * (2) Create the monitor, the callback function adds new data to interval. <br>
     *     PVA and CA channels have same method
     *
     * (3) Check the number of "clients" of `CaChannelAgent`. If no "client", destroy this channel <br>
     *
     * **Note**: The connection never times out. This is
     * different from the GET or PUT operation, where the connection always times out
     *
     * @param {string} channelName Channel name
     * @returns {Promise<boolean>} `true` if sucess, `false` if failed
     */
    tcaMonitor = async (channelName: string): Promise<boolean> => {

        const promiseObj = this.promises.getPromise("tca-get-meta");
        await promiseObj;

        const windowAgentsManager = this.getWindowAgentsManager();
        const mainProcess = windowAgentsManager.getMainProcess();
        const channelAgentsManager = mainProcess.getChannelAgentsManager();
        const channelType = ChannelAgentsManager.determineChannelType(channelName);

        if (channelType == "ca" || channelType == "pva") {
            // (1)
            const connectSuccess = await this.addAndConnectChannel(channelName, undefined);

            let channelAgent = channelAgentsManager.getChannelAgent(channelName);
            if (!connectSuccess || channelAgent === undefined || !(channelAgent instanceof CaChannelAgent)) {
                Log.debug(this.getMainProcessId(), `tcaMonitor: EPICS channel ${channelName} cannot be created/connected.`);
                return false;
            }
            // (2)
            await channelAgent.createMonitor(this.getId());
        } else {
            const connectSuccess = await this.addAndConnectLocalChannel(channelName);
            let channelAgent = channelAgentsManager.getChannelAgent(channelName);
            if (!connectSuccess || channelAgent === undefined || !(channelAgent instanceof LocalChannelAgent)) {
                Log.debug(this.getMainProcessId(), `tcaMonitor: Local channel ${channelName} cannot be created/connected.`);
                return false;
            }
            // (2)
            channelAgent.createMonitor(this.getId());
        }
        // (3)
        // channelAgent.reduceClientsNum();
        if (this.checkChannelOperations(channelName) === false) {
            this.removeChannel(channelName);
        }
        return true;
    };

    // ---------------------------------------------------------------------------------
    /**
     * Clean up the server side for the display window or embedded iframe display.
     *
     * Invoked when we close the display window (event emitted by Electron.js),
     * or the websocket IPC connection is closed (typically for embedded display when its host window
     * is closed). <br>
     *
     * (1) remove all channels, if the channel is not used by any other windows,
     *     it is destroyed. <br>
     *
     * (2) clear interval, stop sending data to this display window <br>
     *
     * (3) remove this DisplayWindowAgent from WindowAgentsManager <br>
     *
     * (6) terminate the websocket IPC connection, and remove the WebSocket client object from server
     * 
     * (8) remove casnooper registration for this window. Shut down ca snooper server if there is no window registered.
     * 
     * (9) update macos dock
     */
    handleWindowClosed = () => {
        Log.info(this.getMainProcessId(), "close display window", this.getId())
        // (7)
        this.getWindowAgentsManager().getMainProcess().releaseDisplayWindowHtmlIndex(this.getId());
        // (1)
        this.removeAllChannels();
        // (2)
        clearInterval(this._sendChannelsDataInterval);
        this._newChannelData = {};
        // (3)
        this.getWindowAgentsManager().removeAgent(this.getId());
        // (4)
        // remove thumbnail interval
        clearInterval(this._takeThumbnailInterval);
        // remove thumbnail on display window
        this.removeThumbnail(this.getId());

        // (5) terminate websocket thread
        this.terminateWebSocketClientThread();

        // check if there is any other BrowserWindow,
        const hasPreloadedBrowserWindow = this.getWindowAgentsManager().preloadedDisplayWindowAgent === undefined ? 0 : 1;
        // const hasPreloadedBrowserView = this.getWindowAgentsManager().preloadedEmbeddedDisplayAgent === undefined ? 0 : 1;
        const numBrowserWindows = Object.keys(this.getWindowAgentsManager().getAgents()).length;


        // if (numBrowserWindows - hasPreloadedBrowserView - hasPreloadedBrowserWindow <= 0) {
        if (numBrowserWindows - hasPreloadedBrowserWindow <= 0) {
            if (this.getWindowAgentsManager().getMainProcess().getMainProcessMode() === "desktop" || this.getWindowAgentsManager().getMainProcess().getMainProcessMode() === "ssh-client") {
                // quit on desktop mode
                this.getWindowAgentsManager().getMainProcess().quit();
            }
        }

        // (6) destroy client object on the WebSocket IPC server
        const mainProcesses = this.getWindowAgentsManager().getMainProcess().getMainProcesses();
        const webSocketIpcManager = mainProcesses.getIpcManager();
        webSocketIpcManager.removeClient(this.getId());

        // (8)
        const mainProcess = this.getWindowAgentsManager().getMainProcess();
        const caSnooperServer = mainProcess.getCaSnooperServer();
        if (caSnooperServer !== undefined) {
            caSnooperServer.stopCaSnooperServer(this.getId());
        }
        const caswServer = mainProcess.getCaswServer();
        if (caswServer !== undefined) {
            caswServer.stopCaswServer(this.getId());
        }

        // (9)
        this.getWindowAgentsManager().setDockMenu();

    };

    // remove all channels, destroy them if necessary
    removeAllChannels = () => {
        for (let channelName of Object.keys(this.getChannelAgents())) {
            this.removeChannel(channelName);
        }
    };

    /**
     * Remove the channel from this display. If no active PUT/GET/MONITOR operation on this channel,
     * destroy the channel. <br>
     *
     * (1) remove the CaChannelAgent from this DisplayWindowAgent <br>
     *
     * (2) remove this DisplayWindowAgent from the CaChannelAgent <br>
     *
     * (3) if this channel is not used by any other display window, destroy the CaChannelAgent and
     *     the corresponding Channel. Even if this display window is still monitoring this channel
     *     or there is outstanding GET/PUT operation initiated from this display window,
     *     it can destroy the channel. <br>
     *
     * @param {string} channelName Channel name.
     *
     */
    removeChannel = (channelName: string) => {
        const channelAgent = this.getChannelAgent(channelName);
        const displayWindowAgent = this;
        if (channelAgent === undefined) {
            return;
        }

        if (channelAgent instanceof CaChannelAgent) {
            const displayWindowId = this.getId();
            const operations = channelAgent.getDisplayWindowOperations(displayWindowId);
            if (operations !== undefined && operations[3] > 0) {
                operations[3] = operations[3] - 1;
                if (operations[3] > 0) {
                    // ! the connecting can be interrupted!
                    // return;
                }
            }
        }

        if (channelAgent instanceof LocalChannelAgent) {
            // (1)
            displayWindowAgent.removeChannelAgent(channelAgent);
            // (2)
            channelAgent.removeDisplayWindowOperations(this.getId());
        } else {
            // (1)
            displayWindowAgent.removeChannelAgent(channelAgent);
            // (2)
            channelAgent.removeDisplayWindowOperations(this.getId());
        }
        // (3)
        if (Object.keys(channelAgent.getDisplayWindowsOperations()).length === 0) {
            channelAgent.checkLifeCycle();
        }
    };

    /**
     * Check if there is any outstanding GET/PUT/MONITOR operations on the channel initiated by this
     * display window. <br>
     *
     * @return {boolean} `true` if there are operations; `false` if there is no operation.
     */
    checkChannelOperations = (channelName: string): boolean => {
        const windowAgentsManager = this.getWindowAgentsManager();
        const mainProcess = windowAgentsManager.getMainProcess();
        const channelAgentsManager = mainProcess.getChannelAgentsManager();
        const channelAgent = channelAgentsManager.getChannelAgent(channelName);
        if (!(channelAgent instanceof LocalChannelAgent || channelAgent instanceof CaChannelAgent)) {
            return false;
        } else {
            const operations = channelAgent.getDisplayWindowOperations(this.getId());
            if (operations === undefined) {
                return false;
            } else {
                let total = operations[0] + operations[1] + operations[2];
                // ! ignore connecting
                // if (operations[3] !== undefined) {
                // 	total = total + operations[3];
                // }
                if (total === 0) {
                    return false;
                } else {
                    return true;
                }
            }
        }
    };

    /**
     * Add and connect a channel from this display <br>
     *
     * If this channel does not exist in ChannelAgentsManager, create the corresponding data structure.
     * Then try to connect this channel with IOC. If connection failed, clean up and return `false`.
     *
     * (1) create `CaChannelAgent` object if not exist for this channel name <br>
     *
     * (2) if the channel did not exist, or if the channel exist but the channel and display window are
     * not linked together, add this `DisplayWindowAgent` to the new `CaChannelAgent` registry <br>
     *
     * (3) if the channel did not exist, add the new `CaChannelAgent` to this `DisplayWindowAgent` registry <br>
     *
     * (4) connect the channel (blocked by `await`). If success, return, if not, remove this channel fromt his display.
     *
     * @param {string} channelName Channel name
     * @param {number | undefined} ioTimeout Time out [second] when try to resolve the channel. `undefined` means never timeout.
     * @returns {Promise<boolean>} `true` when success, `false` when failed.
     * @todo Channel is being connected with timeout t1, and there is another `addAndConnectChannel()` comes in with timeout t2.
     * How to handle this situation. Currently the second one also uses the first timeout.
     *
     */
    addAndConnectChannel = async (channelName: string, ioTimeout: number | undefined = undefined): Promise<boolean> => {
        const windowAgentsManager = this.getWindowAgentsManager();
        const mainProcess = windowAgentsManager.getMainProcess();
        const channelAgentsManager = mainProcess.getChannelAgentsManager();
        // (1)
        let channelAgent = channelAgentsManager.getChannelAgent(channelName);
        if (channelAgent === undefined) {
            channelAgent = channelAgentsManager.createChannelAgent(channelName);

            if (!(channelAgent instanceof CaChannelAgent)) {
                return false;
            }
            const displayWindowAgent = this;
            // (2)
            // channelAgent.addDisplayWindowAgent(displayWindowAgent);
            channelAgent.initDisplayWindowOperations(this.getId());
            // (3)
            displayWindowAgent.addChannelAgent(channelAgent);
        } else {
            if (!(channelAgent instanceof CaChannelAgent)) {
                return false;
            }
            if (channelAgent.getDisplayWindowsOperations()[this.getId()] === undefined) {
                const displayWindowAgent = this;
                // (2)
                // channelAgent.addDisplayWindowAgent(displayWindowAgent);
                channelAgent.initDisplayWindowOperations(this.getId());
                // (3)
                displayWindowAgent.addChannelAgent(channelAgent);
            }
        }
        // (4)
        // blocks here
        channelAgent.addDisplayWindowOperation(this.getId(), DisplayOperations.CONNECT);
        const success = await channelAgent.connect(ioTimeout);
        channelAgent.removeDisplayWindowOperation(this.getId(), DisplayOperations.CONNECT);
        if (!success) {
            this.removeChannel(channelName);
        }
        return success;
    };

    /**
     * Add and connect a channel from this display <br>
     *
     * If this channel does not exist in ChannelAgentsManager, create the corresponding data structure.
     * Then try to connect this channel with IOC. If connection failed, clean up and return `false`.
     *
     * (1) create `CaChannelAgent` object if not exist for this channel name <br>
     *
     * (2) if the channel did not exist, or if the channel exist but the channel and display window are
     * not linked together, add this `DisplayWindowAgent` to the new `CaChannelAgent` registry <br>
     *
     * (3) if the channel did not exist, add the new `CaChannelAgent` to this `DisplayWindowAgent` registry <br>
     *
     * (4) connect the channel (blocked by `await`). If success, return, if not, remove this channel fromt his display.
     *
     * @param {string} channelName Channel name
     * @param {number | undefined} ioTimeout Time out [second] when try to resolve the channel. `undefined` means never timeout.
     * @returns {Promise<boolean>} `true` when success, `false` when failed.
     * @todo Channel is being connected with timeout t1, and there is another `addAndConnectChannel()` comes in with timeout t2.
     * How to handle this situation. Currently the second one also uses the first timeout.
     *
     */
    addAndConnectLocalChannel = (channelName: string): boolean => {
        const windowAgentsManager = this.getWindowAgentsManager();
        const mainProcess = windowAgentsManager.getMainProcess();
        const channelAgentsManager = mainProcess.getChannelAgentsManager();

        // (1)
        let channelAgent = channelAgentsManager.getChannelAgent(channelName);
        if (channelAgent === undefined) {
            channelAgent = channelAgentsManager.createChannelAgent(channelName);
            if (!(channelAgent instanceof LocalChannelAgent)) {
                return false;
            }
            const displayWindowAgent = this;
            // (2)
            // channelAgent.addDisplayWindowAgent(displayWindowAgent);
            channelAgent.initDisplayWindowOperations(this.getId());
            // (3)
            displayWindowAgent.addChannelAgent(channelAgent);
        } else {
            if (!(channelAgent instanceof LocalChannelAgent)) {
                return false;
            }
            if (channelAgent.getDisplayWindowsOperations()[this.getId()] === undefined) {
                const displayWindowAgent = this;
                // (2)
                // channelAgent.addDisplayWindowAgent(displayWindowAgent);
                channelAgent.initDisplayWindowOperations(this.getId());
                // (3)
                displayWindowAgent.addChannelAgent(channelAgent);
            }
        }
        // (4)
        // blocks here
        // const success = await channelAgent.connect(ioTimeout);
        // if (!success) {
        // 	this.removeChannel(channelName);
        // }
        return true;
    };

    /**
     * Add a `CaChannelAgent` to the channel registry.
     *
     * @param {CaChannelAgent} agent The `CaChannelAgent` object
     */
    addChannelAgent = (agent: CaChannelAgent | LocalChannelAgent) => {
        const channelName = agent.getChannelName();
        this.getChannelAgents()[channelName] = agent;
    };

    /**
     * Remove a `CaChannelAgent` from the channel registry.
     *
     * @param {CaChannelAgent} agent The `CaChannelAgent` object
     */
    removeChannelAgent = (agent: CaChannelAgent | LocalChannelAgent) => {
        const channelName = agent.getChannelName();
        delete this.getChannelAgents()[channelName];
    };

    /**
     * Add new data to update interval. The new data will be pushed to display window
     * periodically. <br>
     * 
     * If there is already a data in this._newChannelData, change the data type to Array and
     * push the new data to the end of the array.
     *
     * It is invoked in the monitor listener and the channel state check routine (`this.checkChannelsState()`).
     *
     * @param {string} channelName Channel name
     * @param {type_dbrData} newData The new data
     *
     */
    addNewChannelData = (channelName: string, newData: type_dbrData | type_LocalChannel_data) => {
        if (this._newChannelData[channelName] !== undefined && newData !== undefined) {
            if (Array.isArray(this._newChannelData[channelName])) {
                this._newChannelData[channelName] = [...this._newChannelData[channelName], newData]
            } else {
                this._newChannelData[channelName] = [this._newChannelData[channelName], newData]
            };
        } else {
            this._newChannelData[channelName] = newData;
        }
    };

    /**
     * Check the state of the channel. <br>
     *
     * If the channel is not in "CREATED" state,
     * e.g. in "RESOLVED" or "DISCONNECTED" state, add a `undefined` value to the
     * periodically interval.
     * @todo do it not that frequently
     */
    checkChannelsState = () => {
        for (let channelAgent of Object.values(this.getChannelAgents())) {
            if (channelAgent instanceof LocalChannelAgent) {
                continue;
            }
            const oldState = channelAgent.getOldStateStr();
            const newState = channelAgent.getStateStr();
            if (oldState === "CREATED" && newState !== "CREATED") {
                const channelName = channelAgent.getChannelName();
                this.addNewChannelData(channelName, { value: undefined });
            }
        }
    };

    // --------------------- context menu --------------

    showContextMenu = (mode: string, widgetKeys: string[], options: Record<string, any>) => {
        const contextMenuTemplate = this.getContextMenu().getTemplate(mode, widgetKeys, options);
        if (contextMenuTemplate !== undefined) {
            const menu = Menu.buildFromTemplate(contextMenuTemplate);
            menu.popup();
        } else {
            Log.error(this.getMainProcessId(), "Cannot show context menu");
        }
    };

    showContextMenuSidebar = (mode: string, widgetKeys: string[], options: Record<string, any>) => {
        // const contextMenuTemplate = this.getContextMenu().getTemplate(mode, widgetKeys, options);
        const hasSelection = options["hasSelection"];
        let contextMenuTemplate = [
            {
                label: "Copy",
                accelerator: "CmdOrCtrl+c",
                role: "copy" as any,
                // greg out when there is nothing selected, does not work on macos
                enabled: hasSelection,
            },
            {
                label: "Cut",
                accelerator: "CmdOrCtrl+x",
                role: "cut" as any,
                enabled: hasSelection,
            },
            {
                label: "Paste",
                accelerator: "CmdOrCtrl+v",
                role: "paste" as any,
            },
        ];
        // work around the grey out issue on macos
        if (process.platform === "darwin") {
            if (!hasSelection) {
                contextMenuTemplate = [
                    {
                        label: "Paste",
                        accelerator: "CmdOrCtrl+v",
                        role: "paste" as any,
                    },
                ];
            }
        }
        if (contextMenuTemplate !== undefined) {
            const menu = Menu.buildFromTemplate(contextMenuTemplate);
            menu.popup();
        } else {
            Log.error(this.getMainProcessId(), "Cannot show context menu");
        }
    };

    printToPdf = async () => {
        const browserWindow = this.getBrowserWindow();
        let pdfContentsBufferPromise: any;
        if (browserWindow instanceof BrowserWindow) {
            try {
                let promiseResolved = false;

                const timeoutPromise = new Promise((resolve, reject) => {
                    setTimeout(() => {
                        reject("time out after 1 s");
                    }, 1000);
                });
                // if the pdf cannot be generated in 1 second, consider the printToPDF is problematic
                pdfContentsBufferPromise = browserWindow.webContents.printToPDF({ printBackground: true, pageSize: "Letter" });

                const pdfContentsBuffer = await Promise.race([timeoutPromise, pdfContentsBufferPromise]);

                if (pdfContentsBuffer instanceof Buffer) {
                    // .then((pdfContents: Buffer) => {
                    let pdfFileName = dialog.showSaveDialogSync({ title: "save pdf file", filters: [{ name: "pdf", extensions: ["pdf"] }] });
                    if (pdfFileName === undefined) {
                        Log.debug(this.getMainProcessId(), "pdf file not selected.");
                        return;
                    }
                    fs.writeFile(pdfFileName, pdfContentsBuffer, (err) => {
                        if (err) {
                            this.sendFromMainProcess("dialog-show-message-box",
                                {
                                    messageType: "error",
                                    humanReadableMessages: [`Failed saving pdf as ${pdfFileName}`],
                                    rawMessages: [err.toString()]
                                }
                            )
                        }
                    });
                }
            } catch (e) {
                Log.error(this.getMainProcessId(), e);
            }
            // });
        }
    };

    takeScreenshot = () => {
        const browserWindow = this.getBrowserWindow();
        if (browserWindow === undefined) {
            Log.error(this.getMainProcessId(), "Browser window does not exist");
            return;
        }
        const webContents = browserWindow.webContents;
        webContents.capturePage().then((image: Electron.NativeImage) => {
            let imageFileName = dialog.showSaveDialogSync({
                title: "save image",
                filters: [{ name: "Image Files", extensions: ["png"] }],
            });
            if (imageFileName === undefined) {
                Log.debug(this.getMainProcessId(), "Image file not selected, image not saved");
                return;
            }
            fs.writeFile(imageFileName, image.toPNG(), (err) => {
                if (err) {
                    this.sendFromMainProcess("dialog-show-message-box",
                        {
                            messageType: "error",
                            humanReadableMessages: [`Failed saving screenshot to folder ${imageFileName}`],
                            rawMessages: [err.toString()]
                        }
                    );
                }
            });
        });
    };

    takeScreenshotToFolder = () => {
        const browserWindow = this.getBrowserWindow();
        if (browserWindow === undefined) {
            Log.error(this.getMainProcessId(), "Browser window does not exist");
            return;
        }
        let folder = os.homedir();
        const webContents = browserWindow.webContents;
        webContents.capturePage().then((image: Electron.NativeImage) => {

            const profile = this.getWindowAgentsManager().getMainProcess().getProfiles().getSelectedProfile();
            if (profile !== undefined) {
                const entryValue = profile.getEntry("EPICS Custom Environment", "Image Saving Folder");
                if (entryValue !== undefined) {
                    folder = entryValue.replace("$HOME", os.homedir());
                }
            }
            const imageFileName = path.join(folder, "TDM-screenshot-" + getCurrentDateTimeStr() + ".png");
            fs.writeFile(imageFileName, image.toPNG(), (err) => {
                if (err) {
                    this.sendFromMainProcess("dialog-show-message-box",
                        {
                            messageType: "error",
                            humanReadableMessages: [`Failed saving screenshot to folder ${folder}`],
                            rawMessages: [err.toString()]
                        }
                    )
                }
                // do not show any info on display window, the next image taking command may capture the message banner
                // this.sendFromMainProcess("dialog-show-message-box",
                // {
                //     messageType: "info",
                //     humanReadableMessages: [`Screenshot successfully saved to folder ${imageFileName}`],
                //     rawMessages: []
                // }
                // )
            });
        }).catch((err) => {
            Log.error(this.getMainProcessId(), err)
            this.sendFromMainProcess("dialog-show-message-box",
                {
                    messageType: "error",
                    humanReadableMessages: [`Failed saving screenshot to folder ${folder}`],
                    rawMessages: [err.toString()]
                }
            )
        });
    };

    takeScreenshotToClipboard = () => {
        const browserWindow = this.getBrowserWindow();
        if (browserWindow === undefined) {
            Log.error(this.getMainProcessId(), "Browser window does not exist");
            return;
        }
        const webContents = browserWindow.webContents;
        webContents.capturePage().then((image: Electron.NativeImage) => {
            clipboard.writeImage(image);
        });
    };

    updateThumbnail = (
        displayWindowId: string,
        imageBase64: string | undefined,
        windowName: string | undefined = undefined,
        tdlFileName: string | undefined = undefined
    ) => {
        const mainWindowAgent = this.getWindowAgentsManager().getMainWindowAgent();
        const result: Record<
            string,
            {
                image: string;
                windowName?: string;
                tdlFileName?: string;
            } | null
        > = {};
        if (imageBase64 !== undefined) {
            this.thumbnail = imageBase64;
            const data: {
                image: string;
                windowName?: string;
                tdlFileName?: string;
            } = { image: imageBase64 };
            result[displayWindowId] = data;
            if (windowName !== undefined) {
                data["windowName"] = windowName;
            }
            if (windowName !== undefined) {
                data["tdlFileName"] = tdlFileName;
            }
        } else {
            this.thumbnail = "";
            result[displayWindowId] = null;
        }
        if (mainWindowAgent !== undefined) {
            mainWindowAgent.sendFromMainProcess("new-thumbnail", result);
        } else {
            Log.error(this.getMainProcessId(), "Main window not ready");
        }
    };

    removeThumbnail = (displayWindowId: string) => {
        this.updateThumbnail(displayWindowId, undefined);
    };

    getThumbnail = () => {
        return this.thumbnail;
    }

    takeThumbnail = (windowName: string | undefined = undefined, tdlFileName: string | undefined = undefined) => {
        try {
            const browserWindow = this.getBrowserWindow();
            if (browserWindow instanceof BrowserWindow) {
                const webContents = browserWindow.webContents;
                // console.log("=================== take thumbnail ================\n");
                webContents.capturePage().then((image: Electron.NativeImage) => {
                    const size = image.getSize();
                    let resizedImage: any = image;
                    if (size.height > size.width) {
                        resizedImage = image.resize({
                            height: 100,
                        });
                    } else {
                        resizedImage = image.resize({
                            width: 100,
                        });
                    }
                    const imageBuffer = resizedImage.toPNG();
                    const imageBase64 = imageBuffer.toString("base64");
                    const displayWindowId = this.getId();
                    if (this.readyToClose === false) {
                        this.updateThumbnail(displayWindowId, `data:image/png;base64,${imageBase64}`, windowName, tdlFileName);
                    }
                });
            }
        } catch (e) {
            // ! When the app quits, it may cause an unexpected error that pops up in GUI.
            // ! The worst part is I cannot catch it, as it happens in the worker thread.
            // Log.error(this.getMainProcessId(), e);
        }
    };

    print = () => {
        const browserWindow = this.getBrowserWindow();
        if (browserWindow === undefined) {
            Log.error(this.getMainProcessId(), "Browser window does not exist");
            return;
        }
        browserWindow.webContents.print({
            printBackground: true,
            color: true,
        });
    };

    // ---------------------- IPC ----------------------

    /**
     * send a message from main process IPC websocket server to renderer process websocket client
     * 
     * It is invoked by Logs.sendToLogViewers(), we have to temporarily disable the log mechanism 
     * to avoid stack overflow. In this case, we only send the message out to the renderer process.
     */
    sendFromMainProcess(channel: string, ...args: any[]) {
        if (args[args.length - 1] === "temporarily-disable-log-mechanism") {
            args.splice(args.length - 1, 1);
        }

        const processId = this.getWindowAgentsManager().getMainProcess().getProcessId();
        const ipcManager = this.getWindowAgentsManager().getMainProcess().getMainProcesses().getIpcManager();

        const mainProcessMode = this.getWindowAgentsManager().getMainProcess().getMainProcessMode();

        if (mainProcessMode === "ssh-server") {
            // forward all messages to tcp client in ssh-server mode
            const ipcManagerOnMainProcesses = this.getWindowAgentsManager().getMainProcess().getMainProcesses().getIpcManager();
            const sshServer = ipcManagerOnMainProcesses.getSshServer();
            if (sshServer !== undefined) {
                sshServer.sendToTcpClient(JSON.stringify({ processId: processId, windowId: this.getId(), eventName: channel, data: args }));
            }
        } else {

            const wsClient = ipcManager.getClients()[this.getId()];

            if (wsClient === undefined) {
                // temporarily disable writing the LogViewer to avoid stack overflow
                Log.debug(this.getMainProcessId(), "Cannot find WebSocket IPC client for window", this.getId());
                return;
            }

            try {
                // add processId
                // this._browserWindow?.webContents.send(channel, processId, ...args);
                // wsClient.send(channel, ...[processId, ...args]);
                Log.debug(this.getMainProcessId(), "send from main process:", { processId: processId, windowId: this.getId(), eventName: channel, data: args })
                if (typeof wsClient !== "string") {
                    wsClient.send(JSON.stringify({ processId: processId, windowId: this.getId(), eventName: channel, data: args }));
                }

                if (channel === "new-channel-data") {
                    const webSocketMonitorClient = this.getWebSocketMonitorClient();

                    const webSocketMonitorData: Record<string, any> = {};
                    if (webSocketMonitorClient !== undefined) {
                        for (let channelName of Object.keys(args[0])) {
                            if (this.getWebSocketMonitorChannelNames().includes(channelName)) {
                                webSocketMonitorData[channelName] = { ...args[0][channelName], channelName: channelName };
                            }
                        }
                        if (Object.keys(webSocketMonitorData).length > 0) {
                            webSocketMonitorClient.send(JSON.stringify({ command: "MONITOR", dbrDataObj: webSocketMonitorData }));
                        }
                    }
                }
            } catch (e) {
                Log.error(this.getMainProcessId(), e);
            }
        }
    }

    // --------------------- window --------------------

    startRecordVideo = () => {
        let saveFolder = homedir();
        const selectedProfile = this.getWindowAgentsManager().getMainProcess().getProfiles().getSelectedProfile();
        if (selectedProfile !== undefined) {
            try {
                const saveFolderTmp = selectedProfile.getEntry("EPICS Custom Environment", "Video Saving Folder");
                if (saveFolderTmp === undefined) {
                    throw new Error("Cannot find Video Saving Folder setting");
                }
                if (fs.existsSync(saveFolderTmp)) {
                    fs.accessSync(saveFolderTmp, fs.constants.W_OK);
                    saveFolder = saveFolderTmp;
                }
            } catch (e) {
                Log.error(this.getMainProcessId(), e);
            }
        }

        const browserWindow = this.getBrowserWindow();
        if (browserWindow instanceof BrowserWindow) {
            const windowTitle = browserWindow.getTitle();
            desktopCapturer.getSources({ types: ["window"] }).then(async (sources: Electron.DesktopCapturerSource[]) => {
                for (const source of sources) {
                    Log.debug(this.getMainProcessId(), source.name);
                    // if there are multiple windows that have the same title, the
                    // first one will be picked. This one is the one that
                    // we initiate the context menu
                    if (source.name === windowTitle) {
                        this.sendFromMainProcess("start-record-video", source.id, saveFolder);
                        break;
                    }
                }
            });
        }
    };

    /**
     * Create a display window. <br>
     *
     * Create
     */
    createBrowserWindow = async (httpResponse: any = undefined, options: any = undefined) => {
        const mainProcesMode = this.getWindowAgentsManager().getMainProcess().getMainProcessMode();
        if (mainProcesMode === "ssh-server") {
            // tell client to create a GUI window
            const sshServer = this.getWindowAgentsManager().getMainProcess().getMainProcesses().getIpcManager().getSshServer();
            if (sshServer !== undefined) {
                sshServer.sendToTcpClient(JSON.stringify({ command: "create-display-window-step-2", data: this._options }))
            }
        }
        else {
            if (httpResponse === undefined) { // "desktop", "ssh-client" mode
                const canvasWidgetTdl = this.getTdl().Canvas;
                let windowName = canvasWidgetTdl?.windowName;
                let title = windowName;
                if (title === undefined || title.trim() === "") {
                    if (this.getTdlFileName().trim() !== "") {
                        title = this.getTdlFileName();
                    } else {
                        title = this.getId();
                    }
                }
                const windowOptions: Electron.BrowserWindowConstructorOptions = {
                    width: 800,
                    height: 500,
                    backgroundColor: `rgb(255, 255, 255)`,
                    title: `${title}`,
                    resizable: true,
                    frame: true, // with chrome
                    autoHideMenuBar: true,
                    minWidth: 100,
                    minHeight: 100,
                    show: !this.hiddenWindow, // hide preloaded window
                    icon: path.join(__dirname, '../../../webpack/resources/webpages/tdm-logo.png'),
                    webPreferences: {
                        nodeIntegration: true, // use node.js
                        contextIsolation: false,
                        nodeIntegrationInWorker: true,
                        sandbox: false,
                        webviewTag: true,
                        backgroundThrottling: false,
                        webSecurity: false,
                        defaultFontFamily: {
                            standard: "Arial",
                        }
                    },
                };
                try {
                    await app.whenReady();
                    const window = new BrowserWindow(windowOptions);
                    this._browserWindow = window;
                    this._browserWindow.webContents.setWindowOpenHandler(({ url }) => {
                        Log.debug(this.getMainProcessId(), `open new window ${url}`);
                        return { action: "allow" };
                    });

                    // events
                    // ! in ssh-client mode, once the window is asked to close, close it immeidately
                    // ! otherwise the window-will-be-closed message from main process may never arrive at
                    // ! the renderer process, causing the window hanging 
                    // if (mainProcesMode !== "ssh-client") {
                    this._browserWindow.on("closed", this.handleWindowClosed);
                    this._browserWindow.on("close", (event: Electron.Event) => {
                        // if the window close button is pressed for the first time, or it is not ready to close,
                        // e.g. the file is not saved, do not close the window immediately, instead, call handler
                        if (this.readyToClose === false) {
                            // set the readyToClose to true in case the communication between the 
                            // renderer process and main process is broken.
                            // If we choose to not close the window immediately, it is set back to false in this.handleWindowClose()
                            this.readyToClose = true;
                            event.preventDefault();
                            this.handleWindowClose();
                        } else {
                            // do not do anything
                        }
                    });
                    // }

                    // context menu for editable element, e.g. input box, to show cut/copy/paste options
                    // see https://www.electronjs.org/docs/latest/api/menu-item
                    // this is the the 2nd place that listens to events from renderer process other than the IpcManagerOnMainProcess
                    this._browserWindow.webContents.on("context-menu", (_, props) => {
                        const menu = new Menu();
                        if (props.isEditable) {
                            menu.append(new MenuItem({ label: "Cut", role: "cut" }));
                            menu.append(new MenuItem({ label: "Copy", role: "copy" }));
                            menu.append(new MenuItem({ label: "Paste", role: "paste" }));
                            menu.append(new MenuItem({ label: "mergeAllWindows", role: "mergeAllWindows" }));
                            menu.popup();
                        }
                    });
                    window.once("ready-to-show", () => {
                        // Chrome caches the zoom level of an html
                        // reset the zoom level to 1 each time when a window is opened
                        window.webContents.setZoomFactor(1);
                    });

                    // open development tools
                    // this._window.webContents.openDevTools({ mode: "right" });

                    // the Promise resolves when there is no blocking function running
                    // on webpage, i.e. when all modules in DisplayWindowClient.js are loaded
                    // and DisplayWindowClient object is created

                    // the data URL is used for passing the IPC server port and display window ID to client
                    // in this way, the webContents.send() is no longer used between the renderer process and main process
                    const ipcServerPort = this.getWindowAgentsManager().getMainProcess().getMainProcesses().getIpcManager().getPort();
                    const hostname = this.getWindowAgentsManager().getMainProcess().getMainProcessMode() === "desktop" ?
                        "localhost"
                        : this.getWindowAgentsManager().getMainProcess().getSshClient()?.getServerIP();

                    await window.loadURL(
                        url.format({
                            pathname: path.join(__dirname, `DisplayWindow.html`),
                            protocol: "file:",
                            slashes: true,
                            query: {
                                ipcServerPort: `${ipcServerPort}`,
                                displayWindowId: `${this.getId()}`,
                                hostname: `${hostname}`,
                            },
                        })
                    );
                } catch (e) {
                }
            } else {
                // web mode
                const ipcServerPort = this.getWindowAgentsManager().getMainProcess().getMainProcesses().getIpcManager().getPort();
                const displayWindowId = this.getId();

                const requestMethod = httpResponse.req.method;
                if (requestMethod === "POST") {
                    // when we want to open a new window or refresh a window in web mode, the client sends a POST request
                    // to server, this request eventually arrives at here
                    // the server allocates the resources (basically create this object), 
                    // then reply with the ipc server port and this display window id. 
                    // after received these information, the client will GET the DisplayWindow.html with 
                    // the port and window id.
                    const command = options["postCommand"];
                    const msg = {
                        ipcServerPort: ipcServerPort,
                        displayWindowId: displayWindowId,
                    };
                    Log.debug("-1", "IPC websocket: replay for", command, msg);
                    httpResponse.json(msg);
                } else if (requestMethod === "GET") {

                    // this is from "/" GET request
                    // it is a special way to open a display window, it happens only when we visit the website 
                    // for the first time with "/" path. After that the newly opened window should have a
                    // path like "/DisplayWindow.html?ipcServerPort=7527&displayWindowId=0-5"
                    httpResponse.send(
                        `
                    <!DOCTYPE html>
                    <html>
                    	<head>
                    		<link
                    			rel="stylesheet"
                    			href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css"
                    			integrity="sha384-GvrOXuhMATgEsSwCs4smul74iXGOixntILdUW9XmUC6+HX0sLNAK3q71HotJqlAn"
                    			crossorigin="anonymous"
                    		/>
                    		<link rel="stylesheet" href="../../../../node_modules/xterm/css/xterm.css" />
                    	</head>

                    	<body style="-webkit-print-color-adjust: exact">
                    		<div id="root"></div>
                    		<script>
                    			var exports = {};
                    		</script>
                    		<script type="module" src="/DisplayWindowClient.js"></script>
                            <script type="module">
                    			const urlParams = new URLSearchParams(window.location.search);
                    			const ipcServerPort = urlParams.get("ipcServerPort");
                    			const displayWindowId = urlParams.get("displayWindowId");
                                console.log(window.DisplayWindowClientClass)
                                // new window.DisplayWindowClientClass("${displayWindowId}", ${ipcServerPort})
                                new window.DisplayWindowClientClass("${displayWindowId}", -1)
                    		</script>
                    	</body>
                    </html>
                    `
                    )
                }
            }
        }
    };

    showAboutTdm = () => {
        if (this.getWindowAgentsManager().getMainProcess().getMainProcessMode() === "desktop") {
            // Record<string, string[]>
            this.sendFromMainProcess("show-about-tdm",
                generateAboutInfo()
            )
        }
    }

    /**
     * When the close button is clicked or webContents.close() invoked for the first time, or app.quit() is invoked. <br>
     * 
     * If above actions are called for the second time, close the window.
     *
     * The preloaded windows are closed immediately, without any cleanup. <br>
     *
     * It tells the display window that it will be close, so that some actions can be prepared,
     * e.g. pop up the save tdl prompt. <br>
     */
    handleWindowClose = () => {
        if (
            this.getWindowAgentsManager().preloadedDisplayWindowAgent === this
            // || this.getWindowAgentsManager().preloadedEmbeddedDisplayAgent === this
        ) {
            this.getBrowserWindow()?.webContents.close();
            Log.error(this.getMainProcessId(), `You are trying to close a preloaded display window or preloaded embedded display`);
            return;
        }
        this.sendFromMainProcess("window-will-be-closed");
    };

    getZoomFactor = (): number => {
        const browserWindow = this.getBrowserWindow();
        if (browserWindow instanceof BrowserWindow) {
            return browserWindow.webContents.getZoomFactor();
        } else {
            return 1;
        }
    };

    setZoomFactor = (level: number) => {
        const browserWindow = this.getBrowserWindow();
        if (browserWindow instanceof BrowserWindow) {
            Log.debug(this.getMainProcessId(), this.getId());
            browserWindow.webContents.setZoomFactor(level);
        } else {
            // do nothing
        }
    };

    createWebBrowserWindow = async (url: string) => {

        const mainProcesMode = this.getWindowAgentsManager().getMainProcess().getMainProcessMode();
        if (mainProcesMode === "ssh-server") {
            // tell client to create a GUI window
            const sshServer = this.getWindowAgentsManager().getMainProcess().getMainProcesses().getIpcManager().getSshServer();
            if (sshServer !== undefined) {
                sshServer.sendToTcpClient(JSON.stringify({ command: "create-web-display-window-step-2", data: url }))
            }
        }
        else {

            let width = 900;
            let height = 700;
            let resizable = true;
            const windowOptions = {
                width: width,
                height: height,
                backgroundColor: `rgb(255, 255, 255)`,
                title: "TDM Display Window",
                resizable: resizable,
                // with chrome
                frame: true,
                autoHideMenuBar: true,
                minWidth: 200,
                minHeight: 100,
                show: true,
                webPreferences: {
                    // do not use node.js
                    // nodeIntegration: true,
                    // contextIsolation: false,
                    // nodeIntegrationInWorker: true,
                    // sandbox: false,
                    // webviewTag: true,
                    // backgroundThrottling: false,
                },
            };
            const window = new BrowserWindow(windowOptions);

            // open development tools
            // const webContents = this._window.webContents;
            // window.webContents.openDevTools({ mode: "right" });

            this._browserWindow = window;
            // window.setMenu(null);

            await window.loadURL(url);

            this._browserWindow.on("closed", this.handleWindowClosed);

            var menu = new Menu();
            menu.append(
                new MenuItem({
                    label: "Back",
                    click: () => {
                        if (window.webContents.canGoBack()) {
                            window.webContents.goBack();
                        }
                    },
                })
            );
            menu.append(
                new MenuItem({
                    label: "Forward",
                    click: () => {
                        if (window.webContents.canGoForward()) {
                            window.webContents.goForward();
                        }
                    },
                })
            );
            menu.append(
                new MenuItem({
                    label: "Reload",
                    click: () => {
                        window.webContents.reloadIgnoringCache();
                    },
                })
            );
            menu.append(
                new MenuItem({
                    label: "Copy",
                    click: () => {
                        window.webContents.copy();
                    },
                })
            );
            menu.append(
                new MenuItem({
                    label: "Paste",
                    click: () => {
                        window.webContents.paste();
                    },
                })
            );

            window.webContents.on("context-menu", (event: any, click: any) => {
                event.preventDefault();
                menu.popup();
            });
        }
    };

    // ------------------ embedded window (BrowserView) ------------------

    /**
     * Bring up to front
     */
    show = () => {
        const browserWindow = this.getBrowserWindow();
        if (browserWindow instanceof BrowserWindow) {
            Log.debug(this.getMainProcessId(), `Show display window ${this.getId()} with ${this.getTdlFileName()}`);
            this.hiddenWindow = false;
            browserWindow.show();
        } else {
            Log.error(this.getMainProcessId(), `Error: cannot show window ${this.getId()}`);
        }
    };

    focus = () => {
        const browserWindow = this.getBrowserWindow();
        if (browserWindow instanceof BrowserWindow) {
            if (browserWindow.isMinimizable()) {
                browserWindow.restore();
            }
            browserWindow.focus();
        } else {
            Log.error(this.getMainProcessId(), `Error: cannot focus window ${this.getId()}`);
        }
    };

    close = () => {
        const browserWindow = this.getBrowserWindow();
        if (browserWindow instanceof BrowserWindow) {
            browserWindow.close();
        } else {
            Log.error(this.getMainProcessId(), `Error: cannot close window ${this.getId()}`);
        }
    };

    // ----------------- getters and setters ------------------------

    getWindowAgentsManager = () => {
        return this._windowAgentsManager;
    };
    // getChannelAgentsManager = () => {
    // 	const windowAgentsManager = this.getWindowAgentsManager();
    // 	const mainProcess = windowAgentsManager.getMainProcess();
    // 	return mainProcess.getChannelAgentsManager();
    // };
    getChannelAgents = () => {
        return this._channelAgents;
    };
    getChannelAgent = (channelName: string) => {
        return this.getChannelAgents()[channelName];
    };
    getTdl = (): Record<string, any> => {
        return this._tdl;
    };

    getTdlFileName = () => {
        return this._tdlFileName;
    };

    getId = () => {
        return this._id;
    };

    getBrowserWindow = () => {
        return this._browserWindow;
    };

    getContextMenu = () => {
        return this._contextMenu;
    };

    setIsWebpage = () => {
        this._isWebpage = true;
    };

    isWebpage = () => {
        return this._isWebpage;
    };

    setTdl = (newTdl: Record<string, any>) => {
        this._tdl = newTdl;
    };

    /**
     * set tdl file name, and update hash
     */
    setTdlFileName = (newFileName: string) => {
        this._tdlFileName = newFileName;
        this.updateHash();
    };

    /**
     * set new macros (hard copy), and update hash.
     */
    setMacros = (newMacros: [string, string][]) => {
        this._macros = JSON.parse(JSON.stringify(newMacros));
        this.updateHash();
    }

    getMacros = () => {
        return this._macros;
    }

    setWindowName = (newName: string) => {
        this._windowName = newName;
    };
    getWindowName = () => {
        return this._windowName;
    };



    getMainProcessId = () => {
        return this._mainProcessId;
    };

    // getHtmlIndex = () => {
    // 	return this._htmlIndex;
    // };

    // setHtmlIndex = (newIndex: string) => {
    // 	this._htmlIndex = newIndex;
    // };

    getWebContents = () => {
        const browserWindow = this.getBrowserWindow();
        if (browserWindow !== undefined) {
            return browserWindow.webContents;
        } else {
            return undefined;
        }
    };

    // ------------------------- hash ----------------------------
    /**
     * Calculate hash for this display window based on file name and macros.<br>
     * 
     * If this file name is "", the hash is a random uuid. <br>
     * 
     * When the file name or macros is changed, update the hash.
     */
    static calcHash = (fullTdlFileName: string, macros: [string, string][]) => {
        if (fullTdlFileName === "") {
            return uuidv4();
        } else {
            return fullTdlFileName + JSON.stringify(macros);
        }
    }

    updateHash = () => {
        this.setHash(DisplayWindowAgent.calcHash(this._tdlFileName, this._macros));
    }


    setHash = (newHash: string) => {
        this._hash = newHash;
    }

    _hash: string = uuidv4();

    getHash = () => {
        return this._hash;
    }

    // --------------------------- editable and reloadable ---------------------------

    isEditable = () => {
        return this._editable;
    }
    isReloadable = () => {
        return this._reloadable;
    }

    setEditable = (editable: boolean) => {
        this._editable = editable;
        this.getContextMenu().updateEditable();
    }
    setReloadable = (reloadable: boolean) => {
        this._reloadable = reloadable;
        this.getContextMenu().updateReloadable();
    }

    isModified = () => {
        return this._modified;
    }

    setModified = (newStatus: boolean) => {
        this._modified = newStatus;
    }

    isUtilityWindow = () => {
        return this._isUtilityWindow;
    }

    setIsUtilityWindow = (newValue: boolean) => {
        this._isUtilityWindow = newValue;
    }

    // ---------------------- process info ---------------------------
    getProcessInfo = async (withThumbnail: boolean) => {
        const visible = (this.getWindowAgentsManager().preloadedDisplayWindowAgent === this
            // || this.getWindowAgentsManager().preloadedEmbeddedDisplayAgent === this
        ) ? "No" : "Yes";

        const webContents = this.getWebContents();
        let pid = -1;
        if (webContents !== undefined) {
            pid = webContents.getOSProcessId();
        }

        let usage = {
            "CPU usage [%]": -1,
            "Memory usage [MB]": -1,
            "Uptime [s]": -1,
        }
        if (pid !== -1) {
            usage = await new Promise<{
                "CPU usage [%]": number,
                "Memory usage [MB]": number,
                "Uptime [s]": number,
            }>((resolve, reject) => {
                pidusage(pid, (err: any, stats: any) => {
                    if (err) {
                        resolve({
                            "CPU usage [%]": -1,
                            "Memory usage [MB]": -1,
                            "Uptime [s]": -1,
                        });
                    } else {
                        resolve({
                            "CPU usage [%]": stats["cpu"],
                            "Memory usage [MB]": Math.round(stats["memory"] / 1024 / 1024),
                            "Uptime [s]": Math.round(stats["elapsed"] / 1000),
                        })
                    }
                })
            })
        }


        // embedded display is webpage-like, cannot be edited, not in the scope of electron.js renderer process system
        const result = {
            "Type": "Display Window",
            "Window ID": this.getId(),
            "Visible": visible,
            "TDL file name": this.getTdlFileName(),
            "Window name": this.getWindowName(),
            "Editable": this.isEditable() === true ? "Yes" : "No",
            "Uptime [second]": usage["Uptime [s]"],
            "Process ID": pid,
            "CPU usage [%]": usage["CPU usage [%]"],
            "Memory usage [MB]": usage["Memory usage [MB]"],
            "Thumbnail": withThumbnail ? this.getThumbnail() : "",
            "Script": this.windowAttachedScriptName,
            "Script PID": this.windowAttachedScriptPid === undefined ? "N/A" : `${this.windowAttachedScriptPid}`,
        };
        return result;
    }


}
