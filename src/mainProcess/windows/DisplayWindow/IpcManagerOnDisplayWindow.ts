import { DisplayWindowClient } from "./DisplayWindowClient";
import { g_widgets1 } from "../../../rendererProcess/global/GlobalVariables";
import { rendererWindowStatus, type_widget, Widgets } from "../../../rendererProcess/global/Widgets";
import { type_dbrData } from "../../../rendererProcess/global/GlobalVariables";
import { g_flushWidgets } from "../../../rendererProcess/helperWidgets/Root/Root";
import { type_tdl } from "../../file/FileReader";
import { DataViewer } from "../../../rendererProcess/widgets/DataViewer/DataViewer";
import { PvTable } from "../../../rendererProcess/widgets/PvTable/PvTable";
import { BaseWidget } from "../../../rendererProcess/widgets/BaseWidget/BaseWidget";
import { ScaledSlider } from "../../../rendererProcess/widgets/ScaledSlider/ScaledSlider";
import { Spinner } from "../../../rendererProcess/widgets/Spinner/Spinner";
import { EmbeddedDisplay } from "../../../rendererProcess/widgets/EmbeddedDisplay/EmbeddedDisplay";
import { type_LocalChannel_data } from "../../channel/LocalChannelAgent";
import { Canvas } from "../../../rendererProcess/helperWidgets/Canvas/Canvas";
import { XYPlot } from "../../../rendererProcess/widgets/XYPlot/XYPlot";
import { Terminal } from "../../../rendererProcess/widgets/Terminal/Terminal";
import { Log } from "../../log/Log";
import { Media } from "../../../rendererProcess/widgets/Media/Media";
import { GlobalVariables } from "../../../rendererProcess/global/GlobalVariables";
import { FontsData } from "../../../rendererProcess/global/FontsData";
import { ProfilesViewer } from "../../../rendererProcess/widgets/ProfilesViewer/ProfilesViewer";
import { CaSnooper } from "../../../rendererProcess/widgets/CaSnooper/CaSnooper";
import { Casw } from "../../../rendererProcess/widgets/Casw/Casw";
import { TextEditor } from "../../../rendererProcess/widgets/TextEditor/TextEditor";
import { LogViewer, type_logData } from "../../../rendererProcess/widgets/LogViewer/LogViewer";
import { PvMonitor } from "../../../rendererProcess/widgets/PvMonitor/PvMonitor";
import { type_DialogInputBox, type_DialogMessageBox } from "../../../rendererProcess/helperWidgets/Prompt/Prompt";
import { FileConverter } from "../../../rendererProcess/widgets/FileConverter/FileConverter";
import { TcaChannel } from "../../../rendererProcess/channel/TcaChannel";
import { ChannelGraph } from "../../../rendererProcess/widgets/ChannelGraph/ChannelGraph";
import { Probe } from "../../../rendererProcess/widgets/Probe/Probe";
import { Table } from "../../../rendererProcess/widgets/Table/Table";

// var recorder;
// var blobs = [];


export enum ChannelSeverity {
    NO_ALARM,
    MINOR,
    MAJOR,
    INVALID,
}
/**
 * Manage IPC messages sent from main process for main window. <br>
 *
 * This IPC manager is for `MainWindowClient` object
 */
export class IpcManagerOnDisplayWindow {
    private _displayWindowClient: DisplayWindowClient;
    ipcServerPort: number = -1;

    constructor(displayWindowClient: DisplayWindowClient, ipcServerPort: number) {
        this._displayWindowClient = displayWindowClient;
        this.setIpcServerPort(ipcServerPort);


    }

    connectIpcServer = () => {

        Log.info("Trying to connect to ipc server", this.getDisplayWindowClient().getWindowId(), this.ipcServerPort);
        if (this.getIpcServerPort() === -1) {
            return;
        }

        let serverAddress = `ws://localhost:${this.getIpcServerPort()}`;
        if (this.getDisplayWindowClient().getMainProcessMode() === "web") {
            const host = window.location.host.split(":")[0];
            Log.info("Web mode host:", host);
            serverAddress = `wss://${host}:${this.getIpcServerPort()}`;
        }
        const client = new WebSocket(serverAddress);
        client.onopen = () => {
            Log.info("Successfully connected to ipc server", this.getDisplayWindowClient().getWindowId(), this.ipcServerPort);
            this.wsClient = client;
            // this.sendFromRendererProcess("websocket-ipc-connected");
            this.wsClient.send(
                JSON.stringify({
                    processId: this.getDisplayWindowClient().getProcessId(),
                    windowId: this.getDisplayWindowClient().getWindowId(),
                    eventName: "websocket-ipc-connected",
                    data: [{
                        processId: this.getDisplayWindowClient().getProcessId(),
                        windowId: this.getDisplayWindowClient().getWindowId(),
                    }],
                })
            );

        };

        client.onerror = (err: any) => {
            Log.error("IPC websocket client error:", err)
        }

        client.onmessage = (event: any) => {
            const messageBuffer = event.data;
            const message = JSON.parse(messageBuffer.toString(), (key, value) =>
                value === null ? undefined : value);
            this.parseMessage(message);
        };
    };

    parseMessage = (message: { processId: number; windowId: string; eventName: string; data: any[] }) => {
        const processId = message["processId"];
        const eventName = message["eventName"];
        const windowId = message["windowId"];
        // console.log("received message from main process via websocket IPC", message)

        // find callback for this event
        const callback = this.eventListeners[eventName];
        if (callback !== undefined) {
            // invoke callback
            const data = message["data"];
            callback(undefined, ...data);
        }
    };

    wsClient: WebSocket | undefined;

    eventListeners: Record<string, (evnet: any, ...args: any) => any> = {};

    ipcRenderer = {
        // strip off the processId
        on: (channel: string, callback: (event: any, ...args: any) => any) => {
            this.eventListeners[channel] = callback;
        },
    };

    sendFromRendererProcess = (channelName: string, ...args: any[]) => {

        const processId = this.getDisplayWindowClient().getProcessId();
        if (processId !== "") {
            if (this.wsClient !== undefined) {
                this.wsClient.send(
                    JSON.stringify({
                        processId: processId,
                        windowId: this.getDisplayWindowClient().getWindowId(),
                        eventName: channelName,
                        data: args,
                    })
                );
            }
        } else {
            Log.error("This display window does not have a process Id yet.");
        }
    };

    getIpcRenderer = () => {
        return this.ipcRenderer;
    };

    getDisplayWindowClient = (): DisplayWindowClient => {
        return this._displayWindowClient;
    };

    /**
     * Start to listen to events from main process.
     */

    // listens to all events from main process
    startToListen = () => {
        this.ipcRenderer.on("context-menu-command", this.handleContextMenuCommand);
        this.ipcRenderer.on("new-channel-data", this.handleNewChannelData);
        this.ipcRenderer.on("new-archive-data", this.handleNewArchiveData);
        this.ipcRenderer.on("new-tdl", this.handleNewTdl);
        this.ipcRenderer.on("selected-profile-contents", this.handleSelectedProfileContents);
        this.ipcRenderer.on("tca-get-result", this.handleTcaGetResult);
        this.ipcRenderer.on("tca-get-pva-type-result", this.handleTcaGetPvaTypeResult);
        this.ipcRenderer.on("dialog-show-message-box", this.handleDialogShowMessageBox);
        this.ipcRenderer.on("dialog-show-input-box", this.handleDialogShowInputBox);
        this.ipcRenderer.on("tdl-file-saved", this.handleTdlFileSaved);
        this.ipcRenderer.on("select-a-file", this.handleSelectAFile);
        this.ipcRenderer.on("widget-specific-action", this.handleWidgetSpecificAction);
        this.ipcRenderer.on("local-font-names", this.handleLocalFontNames);
        this.ipcRenderer.on("db-file-contents", this.handleDbFileContents);

        this.ipcRenderer.on("start-record-video", this.handleStartRecordVideo);

        this.ipcRenderer.on("window-will-be-closed", this.handleWindowWillBeClosed);

        this.ipcRenderer.on("obtained-iframe-uuid", this.handleObtainedIframeUuid);

        this.ipcRenderer.on("request-epics-dbd", this.handleRequestEpicsDbd);

        // ssh-client requested a file from ssh-server, here is the contents of the
        // file sent from ssh server
        this.ipcRenderer.on("ssh-file-contents", this.handleSshFileContents);
        this.ipcRenderer.on("show-about-tdm", this.handleShowAboutTdm);

        this.ipcRenderer.on("terminal-command-result", this.handleTerminalCommandResult);

        this.ipcRenderer.on("processes-info", this.handleProcessesInfo)
        this.ipcRenderer.on("epics-stats", this.handleEpicsStats)
        this.ipcRenderer.on("ca-snooper-data", this.handleCaSnooperData)
        this.ipcRenderer.on("ca-sw-data", this.handleCaswData)
        this.ipcRenderer.on("text-file-contents", this.handleTextFileContents)
        this.ipcRenderer.on("save-text-file-status", this.handleSaveTextFileStatus)
        this.ipcRenderer.on("new-log", this.handleNewLog)
        this.ipcRenderer.on("file-converter-command", this.handleFileConverterCommand);
    };

    handleObtainedIframeUuid = (
        event: any,
        options: {
            widgetKey: string;
            iframeDisplayId: string;
            tdlBackgroundColor: string;

        }
    ) => {
        const widget = g_widgets1.getWidget2(options["widgetKey"]);
        if (widget instanceof EmbeddedDisplay) {
            widget.loadHtml(options["iframeDisplayId"]);
            widget.setIframeBackgroundColor(options["tdlBackgroundColor"]);
        } else if (widget instanceof Table) {
            widget.loadHtml(options["iframeDisplayId"]);
            widget.setIframeBackgroundColor(options["tdlBackgroundColor"]);
        }
    };

    handleRequestEpicsDbd = (event: any, result: {
        widgetKey: string;
        menus: Record<string, any>,
        recordTypes: Record<string, any>,
    }) => {
        const widget = g_widgets1.getWidget(result["widgetKey"]);
        if (widget instanceof ChannelGraph || widget instanceof Probe) {
            widget.processDbd({
                menus: result["menus"],
                recordTypes: result["recordTypes"],
            })
        }

    }

    /**
     * Drag and drop one or more tdl files to the DisplayWindow to open the files. <br>
     *
     * New windows inherit the parent window's macros.
     */
    startToListenDragAndDrop = () => {

        document.addEventListener("drop", (event: any) => {
            event.preventDefault();

            // do not listen to drag and drop in ssh-client mode
            if (this.getDisplayWindowClient().getMainProcessMode() === "ssh-client") {
                return;
            }

            event.stopPropagation();
            // `TextEditor` utility window
            const canvas = g_widgets1.getWidget("Canvas");
            let windowName = "";
            if (canvas instanceof Canvas) {
                windowName = canvas.getWindowName();
            }
            if (windowName.startsWith("TDM Text Editor")) {
                // find the `TextEditor` widget
                let widgetKey = "";
                let fileName = "";
                let fileFullName = "";
                let fileBlob: undefined | Blob = undefined;
                if (event.dataTransfer.files.length > 0) {
                    // for web mode, the web mode does not have .path, which is the full path of the file
                    fileName = event.dataTransfer.files[0].name;
                    fileBlob = event.dataTransfer.files[0];
                    // for desktop and ssh-client mode, it is the full path of the file
                    fileFullName = event.dataTransfer.files[0].path;
                }
                for (let widget of [...g_widgets1.getWidgets().values()]) {
                    if (widget instanceof TextEditor) {
                        widgetKey = widget.getWidgetKey();
                        if (this.getDisplayWindowClient().getMainProcessMode() === "web") {
                            // do not open a new tab
                            if (fileBlob !== undefined) {
                                this.getDisplayWindowClient().openTextFileInTextEditorInWebMode(widget, fileName, fileBlob);
                            }
                        } else {
                            g_widgets1.openTextEditorWindow({
                                displayWindowId: this.getDisplayWindowClient().getWindowId(),
                                widgetKey: widgetKey,
                                fileName: fileFullName,
                                manualOpen: false,
                                openNewWindow: false,
                            })
                        }
                        return;
                    }
                }
            } else {
                // regular display window
                const tdlFileNames: string[] = [];
                for (const file of event.dataTransfer.files) {
                    // full name
                    const tdlFileName = file.path;
                    tdlFileNames.push(tdlFileName);
                }
                if (g_widgets1 !== undefined) {
                    Log.debug("File Path of dragged files: ", tdlFileNames);
                    let mode = "operating";
                    if (g_widgets1.isEditing()) {
                        mode = "editing";
                    }
                    // external macros
                    const canvas = g_widgets1.getWidget2("Canvas") as Canvas;
                    const externalMacros = canvas.getAllMacros();
                    Log.debug("external macors", externalMacros);
                    if (this.getDisplayWindowClient().getMainProcessMode() === "web") {
                        // for web mode, the web mode does not have .path, which is the full path of the file
                        const fileBlob = event.dataTransfer.files[0];
                        if (fileBlob !== undefined) {
                            const fileName = event.dataTransfer.files[0].name;
                            this.getDisplayWindowClient().openTdlFileInWebMode(fileName, fileBlob);
                        }
                    } else {
                        this.sendFromRendererProcess("open-tdl-file", {
                            tdlFileNames: tdlFileNames,
                            mode: mode,
                            // manually opened, always editable
                            editable: true,
                            // use parent window's macros
                            macros: externalMacros,
                            replaceMacros: true,
                            // currentTdlFolder?: string;
                            windowId: this.getDisplayWindowClient().getWindowId(),
                        });
                    }
                }
            }
        });

        document.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.stopPropagation();
        });

        document.addEventListener("dragenter", (event) => {
            Log.debug("File is in the Drop Space");
        });

        document.addEventListener("dragleave", (event) => {
            Log.debug("File has left the Drop Space");
        });
    };

    // ----------------------- event handlers -----------------------------

    handleContextMenuCommand = (event: any, command: string, subcommand: string | string[] | undefined) => {
        Log.debug("context menu command:", command, "subcommand", subcommand);
        // editing mode
        if (command === "create-widget") {
            if (subcommand === "text-update") {
                g_widgets1.createWidgetFromMouse("TextUpdate");
            } else if (subcommand === "help") {
                g_widgets1.createWidgetFromMouse("Help");
            } else if (subcommand === "binary-image") {
                g_widgets1.createWidgetFromMouse("BinaryImage");
            } else if (subcommand === "table") {
                g_widgets1.createWidgetFromMouse("Table");
            } else if (subcommand === "terminal") {
                g_widgets1.createWidgetFromMouse("Terminal");
            } else if (subcommand === "calculator") {
                g_widgets1.createWidgetFromMouse("Calculator");
            } else if (subcommand === "label") {
                g_widgets1.createWidgetFromMouse("Label");
            } else if (subcommand === "meter") {
                g_widgets1.createWidgetFromMouse("Meter");
            } else if (subcommand === "tank") {
                g_widgets1.createWidgetFromMouse("Tank");
            } else if (subcommand === "thermometer") {
                g_widgets1.createWidgetFromMouse("Thermometer");
            } else if (subcommand === "text-entry") {
                g_widgets1.createWidgetFromMouse("TextEntry");
            } else if (subcommand === "scaled-slider") {
                g_widgets1.createWidgetFromMouse("ScaledSlider");
            } else if (subcommand === "spinner") {
                g_widgets1.createWidgetFromMouse("Spinner");
            } else if (subcommand === "thumb-wheel") {
                g_widgets1.createWidgetFromMouse("ThumbWheel");
            } else if (subcommand === "choice-button") {
                g_widgets1.createWidgetFromMouse("ChoiceButton");
            } else if (subcommand === "check-box") {
                g_widgets1.createWidgetFromMouse("CheckBox");
            } else if (subcommand === "slide-button") {
                g_widgets1.createWidgetFromMouse("SlideButton");
            } else if (subcommand === "boolean-button") {
                g_widgets1.createWidgetFromMouse("BooleanButton");
            } else if (subcommand === "radio-button") {
                g_widgets1.createWidgetFromMouse("RadioButton");
            } else if (subcommand === "combo-box") {
                g_widgets1.createWidgetFromMouse("ComboBox");
            } else if (subcommand === "polyline") {
                g_widgets1.createWidgetFromMouse("Polyline");
            } else if (subcommand === "arc") {
                g_widgets1.createWidgetFromMouse("Arc");
            } else if (subcommand === "rectangle") {
                g_widgets1.createWidgetFromMouse("Rectangle");
            } else if (subcommand === "media") {
                g_widgets1.createWidgetFromMouse("Media");
            } else if (subcommand === "symbol") {
                g_widgets1.createWidgetFromMouse("Symbol");
            } else if (subcommand === "text-symbol") {
                g_widgets1.createWidgetFromMouse("TextSymbol");
            } else if (subcommand === "led") {
                g_widgets1.createWidgetFromMouse("LED");
            } else if (subcommand === "led-multi-state") {
                g_widgets1.createWidgetFromMouse("LEDMultiState");
            } else if (subcommand === "byte-monitor") {
                g_widgets1.createWidgetFromMouse("ByteMonitor");
            } else if (subcommand === "probe") {
                g_widgets1.createWidgetFromMouse("Probe");
            } else if (subcommand === "pv-table") {
                g_widgets1.createWidgetFromMouse("PvTable");
            } else if (subcommand === "data-viewer") {
                g_widgets1.createWidgetFromMouse("DataViewer");
            } else if (subcommand === "xy-plot") {
                g_widgets1.createWidgetFromMouse("XYPlot");
            } else if (subcommand === "channel-graph") {
                g_widgets1.createWidgetFromMouse("ChannelGraph");
            } else if (subcommand === "embedded-display") {
                g_widgets1.createWidgetFromMouse("EmbeddedDisplay");
            } else if (subcommand === "group") {
                g_widgets1.createWidgetFromMouse("Group");
            } else if (subcommand === "action-button") {
                g_widgets1.createWidgetFromMouse("ActionButton");
            } else if (subcommand === "pv-monitor") {
                g_widgets1.createWidgetFromMouse("PvMonitor");
            }
        } else if (command === "select-all-widgets") {
            g_widgets1.selectAllWidgets(true);
        } else if (command === "execute-display") {
            g_widgets1.setMode(rendererWindowStatus.operating, true, true);
        } else if (command === "reload-display") {
            g_widgets1.loadTdlFile();
        } else if (command === "save-display") {
            g_widgets1.getRoot().getDisplayWindowClient().saveTdl(this.getDisplayWindowClient().getTdlFileName());
        } else if (command === "save-display-as") {
            g_widgets1.getRoot().getDisplayWindowClient().saveTdl("");
        } else if (command === "toggle-title") {
            g_widgets1.getRoot().getDisplayWindowClient().toggleWindowTitle();
        } else if (command === "copy-widgets") {
            g_widgets1.copySelectedWidgets();
        } else if (command === "paste-widgets") {
            g_widgets1.pasteSelectedWidgets(true);
        } else if (command === "cut-widgets") {
            g_widgets1.cutSelectedWidgets(true);
        } else if (command === "delete-widgets") {
            g_widgets1.removeSelectedWidgets(true);
        } else if (command === "duplicate-widgets") {
            g_widgets1.duplicateSelectedWidgets(true);
        } else if (command === "undo") {
            this.getDisplayWindowClient().undo();
        } else if (command === "redo") {
            this.getDisplayWindowClient().redo();
        } else if (command === "group-widgets") {
            g_widgets1.groupSelectedWidgets();
        } else if (command === "ungroup-widgets") {
            g_widgets1.ungroupSelectedWidgets();
        } else if (command === "align-widgets") {
            g_widgets1.alignSelectedWidgets(subcommand as "left" | "center" | "right" | "top" | "middle" | "bottom", true);
        } else if (command === "bring-widgets-to") {
            g_widgets1.moveSelectedWidgetsInZ(subcommand as "front" | "forward" | "back" | "backward", true);
        } else if (command === "distribute-widgets") {
            g_widgets1.distributeSelectedWidgets(subcommand as "left" | "center" | "right" | "top" | "middle" | "bottom", true);
        } else if (command === "match-widgets-size") {
            g_widgets1.matchWidgetsSize(subcommand as "width" | "height", true);
        } else if (command === "show-tdl-file-contents") {
            this.getDisplayWindowClient().showTdlFileContents();
        } else if (command === "create-new-display-in-web-mode") {
            this.handleCreateNewDisplayInWebMode();
        } else if (command === "open-display-in-ssh-mode") {
            this.handleOpenDisplayInSshMode();
        }

        // operating mode
        else if (command === "edit-display") {
            g_widgets1.setMode(rendererWindowStatus.editing, true, true);
        } else if (command === "copy-display-contents") {
            g_widgets1.copyDisplayContents();
        } else if (command === "copy-widget-pv-names") {
            g_widgets1.copyWidgetChannelNames(subcommand as string[]);
        } else if (command === "copy-widget-pv-values") {
            g_widgets1.copyWidgetChannelValues(subcommand as string[]);
        } else if (command === "copy-all-pv-values") {
            g_widgets1.copyAllChannelValues();
        } else if (command === "copy-all-pv-names") {
            g_widgets1.copyAllChannelNames();
        } else if (command === "duplicate-display") {
            g_widgets1.duplicateDisplay();
        } else if (command === "probe") {
            g_widgets1.openProbeWindow(subcommand as string[]);
        } else if (command === "pv-table") {
            g_widgets1.openPvTableWindow(subcommand as string[]);
        } else if (command === "pv-monitor") {
            g_widgets1.openPvMonitorWindow(subcommand as string[]);
        } else if (command === "data-viewer") {
            g_widgets1.openDataViewerWindow(subcommand as string[]);
        } else if (command === "terminal") {
            g_widgets1.openTerminalWindow();
        } else if (command === "channel-graph") {
            g_widgets1.openChannelGraphWindow(subcommand as string[]);
        } else if (command === "calculator") {
            g_widgets1.openCalculatorWindow();
        } else if (command === "help") {
            g_widgets1.openHelpWindow();
        }
    };

    handleTdlFileSaved = (event: any, newTdlFileName: string) => {
        Log.debug("TDL file saved to", newTdlFileName);
        this.getDisplayWindowClient().setTdlFileName(newTdlFileName);
        if (this.getDisplayWindowClient().getWindowTitleType() === "file-name") {
            this.sendFromRendererProcess("set-window-title", this.getDisplayWindowClient().getWindowId(), newTdlFileName);
        }
        this.getDisplayWindowClient().getActionHistory().setModified(false);
        this.getDisplayWindowClient().updateWindowTitle();
    };

    // only in display mode
    handleCreateNewDisplayInWebMode = () => {
        const currentSite = `https://${window.location.host}/`;

        this.sendPostRequestCommand("create-new-display-in-web-mode", {})
            .then((response: any) => {
                // decode string
                return response.json();
            })
            .then((data) => {
                const ipcServerPort = data["ipcServerPort"];
                const displayWindowId = data["displayWindowId"];
                window.open(`${currentSite}DisplayWindow.html?ipcServerPort=${ipcServerPort}&displayWindowId=${displayWindowId}`);
            });
    };


    handleSelectedProfileContents = (event: any, contents: Record<string, any>) => {
        this.getDisplayWindowClient().setProfileContents(contents);


        try {
            const presetColors = this.getDisplayWindowClient().getProfileCategory("Preset Colors");
            for (let colorName of Object.keys(presetColors)) {
                const colorObject = presetColors[colorName];
                const rgb = colorObject["value"];
                if (Array.isArray(rgb)) {
                    if (
                        rgb.length === 4 &&
                        parseInt(rgb[0]) >= 0 &&
                        parseInt(rgb[0]) <= 255 &&
                        parseInt(rgb[1]) >= 0 &&
                        parseInt(rgb[1]) <= 255 &&
                        parseInt(rgb[2]) >= 0 &&
                        parseInt(rgb[2]) <= 255 &&
                        parseInt(rgb[3]) >= 0 &&
                        parseInt(rgb[3]) <= 100
                    ) {
                        GlobalVariables.presetColors[colorName] = [parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2]), parseInt(rgb[3])];
                    }
                }
            }
        } catch (e) {
            Log.error("Error reading preset colors", e);
        }
    };




    /**
     * New channel data arrives.
     * 
     * (1) append new data to each TcaChannel
     * 
     * (2) find which widgets should be updated, add them to g_widgets1.forceUpdateWidgets
     * 
     * (3) if the widget has mapDbrDataWitNewData() method, do it, do it once
     * 
     * (4) flush widgets
     */
    handleNewChannelData = (event: any, newDbrData: Record<string, type_dbrData | type_dbrData[] | type_LocalChannel_data | undefined>) => {

        Log.debug("received data", JSON.stringify(newDbrData, null, 4));

        let channelNames = Object.keys(newDbrData);

        // special widgets that has new dbr data mapping, this mapping should only occurs once
        const dbrDataMappedWidgetKeys: string[] = [];
        const dbrDataMappedWidgets: type_widget[] = [];

        for (let channelName of channelNames) {
            try {
                // (1)
                let tcaChannels: TcaChannel[] = [];
                if (channelName.startsWith("pva://")) {
                    tcaChannels = g_widgets1.getTcaSubPvaChannels(channelName);
                } else {
                    tcaChannels = [g_widgets1.getTcaChannel(channelName)];
                }

                for (let tcaChannel of tcaChannels) {

                    if (tcaChannel === undefined) {
                        // in case the channel is destroyed in renderer process but still in main process
                        // does not always happen
                        continue;
                    }

                    let data = newDbrData[channelName];
                    if (data === undefined) {
                        // the reason may be the IOC is offline, network glitch, or other issues that is not initiated
                        // by the channel access client
                        tcaChannel.appendToDbrData({ value: undefined, severity: ChannelSeverity.INVALID });
                    } else {
                        // (a) normal situation
                        // (b) if the epics channel is softly destroyed (IOC offline, network down), it sends
                        //     {value: undefined, severity: 3}, but the `value: undefined` is not serialized 
                        //     in websocket transmission. So, we only receive {severity: 3}. In this case, the below 
                        //     appendToDbrData() won't assign "undefined" to the value. Instead, the last valid
                        //     value is kept. We use this feature (bug) to keep the old value, so that something 
                        //     can be displayed in the widget. The widget only updates the severity and the corresponding 
                        //     severity outline.
                        tcaChannel.appendToDbrData(data);
                    }
                    // (2)
                    const widgetKeys = tcaChannel.getWidgetKeys();
                    for (let widgetKey of widgetKeys) {
                        g_widgets1.addToForceUpdateWidgets(widgetKey);

                        // (3)
                        const widget = g_widgets1.getWidget2(widgetKey);
                        if (!dbrDataMappedWidgetKeys.includes(widgetKey)) {
                            if (widget instanceof DataViewer) {
                                // do not force update this widget upon new DBR data arrival, use its own mechanism to trigger the update
                                g_widgets1.removeFromForceUpdateWidgets(widgetKey);
                            }
                            if (widget instanceof DataViewer || widget instanceof XYPlot || widget instanceof Terminal || widget instanceof ChannelGraph) {
                                dbrDataMappedWidgets.push(widget);
                                dbrDataMappedWidgetKeys.push(widgetKey)
                            }
                        }
                    }
                }
            } catch (e) {
                Log.error(e);
            }
        }

        for (const widget of dbrDataMappedWidgets) {
            if (widget instanceof XYPlot || widget instanceof Terminal || widget instanceof ChannelGraph) {
                widget.mapDbrDataWitNewData(Object.keys(newDbrData));
            } else if (widget instanceof DataViewer) {
                // remove force update, use the internal interval to update
                g_widgets1.removeFromForceUpdateWidgets(widget.getWidgetKey());
                widget.mapDbrDataWitNewData(newDbrData);
            }
        }

        // (4)
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");
        g_flushWidgets();
    };

    handleNewArchiveData = (event: any, data: {
        displayWindowId: string,
        widgetKey: string,
        channelName: string,
        startTime: number, // ms since epoch // "2024-01-01 01:23:45", no ms
        endTime: number,
        archiveData: [number[], number[]],
    }) => {
        if (g_widgets1.isEditing()) {
            return;
        }
        g_widgets1.removeFromForceUpdateWidgets(data["widgetKey"]);
        const widget = g_widgets1.getWidget2(data["widgetKey"]);
        if (widget instanceof DataViewer) {
            // we may get empty data
            if (data["archiveData"][0].length > 0 && data["archiveData"][1].length > 0) {
                widget.mapDbrDataWitNewArchiveData(data);
                // immediately update the plot
                widget.updatePlot(true);
            }
        }
    }

    // (1) resolve IO, letting TcaChannel.get() to continue, writing the data to TcaChannel
    // (2) determine which widgets should be re-rendered
    // (3) flush widgets
    handleTcaGetResult = (event: any, ioId: number, widgetKey: string | undefined, newDbrData: type_dbrData) => {
        // console.log(newDbrData);
        // console.log("receive", JSON.stringify(newDbrData));
        const readWriteIos = g_widgets1.getReadWriteIos();
        // lift the block of GET operation
        readWriteIos.resolveIo(ioId, newDbrData);
        // if the tca-get operation is initiated by no widget `undefined`,
        // all widgets are flsuhed
        if (widgetKey === undefined) {
            for (let key of [...g_widgets1.getWidgets().keys()]) {
                g_widgets1.addToForceUpdateWidgets(key);
            }
        } else {
            g_widgets1.addToForceUpdateWidgets(widgetKey);
        }
        g_flushWidgets();
    };

    handleTcaGetPvaTypeResult = (event: any, channelName: string, widgetKey: string | undefined, pvaType: any) => {
        try {
            const channel = g_widgets1.getTcaChannel(channelName);
            channel.setPvaType(pvaType);
        } catch (e) {
            Log.error(`${e}`);
        }
    };



    handleNewTdl = (
        event: any,
        options: {
            newTdl: type_tdl;
            tdlFileName: string; // full name, or ""
            initialModeStr: "editing" | "operating";
            editable: boolean;
            externalMacros: [string, string][];
            useExternalMacros: boolean;
            utilityType: "Probe" | "PvTable" | "DataViewer" | "ProfilesViewer" | "LogViewer" | "TdlViewer" | "TextEditor" | "Terminal" | "Calculator" | "ChannelGraph" | "Help" | "Casw" | "PvMonitor" | "CaSnooper" | "FileConverter";
            utilityOptions: Record<string, any>;
        }
    ) => {
        Log.info("Received a new-tdl");
        this.getDisplayWindowClient().updateTdl(
            options["newTdl"],
            options["tdlFileName"],
            options["initialModeStr"],
            options["editable"],
            options["externalMacros"],
            options["useExternalMacros"],
            options["utilityType"],
            options["utilityOptions"]
        );
    };

    handleSelectAFile = (event: any, options: Record<string, any>, fileName: string) => {
        const widgetKey = options["widgetKey"];
        if (widgetKey === undefined) {
            Log.error("select-a-file has no widget key");
            return;
        }

        try {
            const widget = g_widgets1.getWidget2(widgetKey);
            if (widget instanceof BaseWidget) {
                const handleSelectAFile = (widget as any).handleSelectAFile;
                if (handleSelectAFile) {
                    handleSelectAFile(options, fileName);
                }
            } else if (widget instanceof Canvas) {
                const handleSelectAFile = (widget as any).handleSelectAFile;
                if (handleSelectAFile) {
                    handleSelectAFile(options, fileName);
                }
            }
        } catch (e) {
            Log.error(e);
        }
    };

    handleWidgetSpecificAction = (event: any, widgetKey: string, actionName: string) => {
        if (widgetKey.includes("ScaledSlider")) {
            try {
                const widget = g_widgets1.getWidget2(widgetKey) as ScaledSlider;
                if (actionName === "open-settings") {
                    widget.openSettings();
                }
            } catch (e) {
                Log.error(e);
            }
        }
        if (widgetKey.includes("Spinner")) {
            try {
                const widget = g_widgets1.getWidget2(widgetKey) as Spinner;
                if (actionName === "open-settings") {
                    widget.openSettings();
                }
            } catch (e) {
                Log.error(e);
            }
        }
        if (widgetKey.includes("Terminal")) {
            try {
                const widget = g_widgets1.getWidget2(widgetKey) as Terminal;
                if (actionName === "copy-terminal-text") {
                    widget.copyText();
                } else if (actionName === "paste-terminal-text") {
                    widget.pasteText();
                }
            } catch (e) {
                Log.error(e);
            }
        }
        if (widgetKey.includes("ChannelGraph")) {
            try {
                const widget = g_widgets1.getWidget2(widgetKey) as ChannelGraph;
                if (actionName === "show-settings") {
                    widget.setShowConfigPage(true);
                } else if (actionName === "clear-graph") {
                    widget.clearGraph();
                }
            } catch (e) {
                Log.error(e);
            }
        }
        if (widgetKey.includes("LogViewer") || widgetKey.includes("PvMonitor") || widgetKey.includes("CaSnooper") || widgetKey.includes("Casw") || widgetKey.includes("FileConverter")) {
            try {
                const widget = g_widgets1.getWidget2(widgetKey);
                if ((widget instanceof LogViewer) || (widget instanceof PvMonitor) || (widget instanceof CaSnooper) || (widget instanceof Casw) || (widget instanceof FileConverter)) {
                    type typeA = (keyof typeof widget.mouseRightButtonDownContextMenuActions);
                    const action = widget.mouseRightButtonDownContextMenuActions[actionName as typeA];
                    if (action !== undefined) {
                        action();
                    }
                }
            } catch (e) {
                Log.error(e);
            }
        }
    };

    handleStartRecordVideo = (event: any, sourceId: string, folder: string) => {
        const displayWindowClient = this.getDisplayWindowClient();
        const videoRecorder = displayWindowClient.getVideoRecorder();
        videoRecorder.setSourceId(sourceId);
        videoRecorder.start(folder);
    };

    handleWindowWillBeClosed = (event: any) => {
        Log.info("window will be closed")
        const history = this.getDisplayWindowClient().getActionHistory();
        const isUtilityWindow = this.getDisplayWindowClient().getIsUtilityWindow();
        const displayWindowId = this.getDisplayWindowClient().getWindowId();
        const tdlFileName = this.getDisplayWindowClient().getTdlFileName();
        const tdl = this.getDisplayWindowClient().generateTdl();

        const canvas = g_widgets1.getWidget("Canvas");
        let windowName = "";
        if (canvas instanceof Canvas) {
            windowName = canvas.getWindowName();
        }

        // windows that can be closed immediately
        // (1) window is not modified since opening
        // (2) utility window: Text Editor and Data Viewer
        if (history.getCurrentTdlIndex() > 0
            || tdlFileName === ""
            || (isUtilityWindow && windowName.startsWith("TDM Text Editor"))
            || (isUtilityWindow && windowName.startsWith("TDM Data Viewer"))
        ) {
            // don't close window yet, pop up save dialog
            if (isUtilityWindow) {
                // utility window: close immediately except modified TextEditor
                // if it is a Text Editor utility window
                if (windowName.startsWith("TDM Text Editor")) {
                    // find the widget
                    let textEditorWidget: TextEditor | undefined = undefined;
                    for (let widget of g_widgets1.getWidgets2().values()) {
                        if (widget instanceof TextEditor) {
                            textEditorWidget = widget;
                            break;
                        }
                    }
                    // if it is modified, bring up the prompt
                    if (this.getDisplayWindowClient().getTextEditorModified() === true) {
                        if (textEditorWidget !== undefined) {
                            this.sendFromRendererProcess("window-will-be-closed", {
                                displayWindowId: displayWindowId,
                                close: false,
                                tdlFileName: undefined,
                                tdl: undefined,
                                // TextEditor utility window specific contents
                                textEditorFileName: textEditorWidget.getFileName(),
                                textEditorContents: textEditorWidget.getFileContents(),
                                widgetKey: textEditorWidget.getWidgetKey(),
                            });
                            return;
                        }
                    }
                } else if (windowName.startsWith("TDM Data Viewer")) {
                    // if it contains any trace data, bring up the prompt to Save/Do not save/Cancel
                    let dataViewerWidget: DataViewer | undefined = undefined;
                    for (let widget of g_widgets1.getWidgets2().values()) {
                        if (widget instanceof DataViewer) {
                            dataViewerWidget = widget;
                            break;
                        }
                    }
                    if (dataViewerWidget !== undefined) {
                        console.log(dataViewerWidget.hasData())
                        if (dataViewerWidget.hasData() === true) {
                            this.sendFromRendererProcess("window-will-be-closed", {
                                displayWindowId: displayWindowId,
                                close: false,
                                tdlFileName: undefined,
                                tdl: undefined,
                                widgetKey: dataViewerWidget.getWidgetKey(),
                            });
                            return;
                        }
                    }
                }

                this.sendFromRendererProcess("window-will-be-closed", {
                    displayWindowId: displayWindowId,
                    close: true,
                });
            } else {
                Log.debug("Window for TDL", tdlFileName, "will be closed", history.getCurrentTdlIndex());
                // regular window, save it
                this.sendFromRendererProcess("window-will-be-closed", {
                    displayWindowId: displayWindowId,
                    close: !this.getDisplayWindowClient().getActionHistory().getModified(),
                    tdlFileName: tdlFileName, // if "", the window is an in-memory window
                    tdl: tdl,
                });
                this.sendFromRendererProcess("window-will-be-closed", displayWindowId, tdlFileName, false);
            }
        } else {
            // window that has not been modified, close immediately
            this.sendFromRendererProcess("window-will-be-closed", {
                displayWindowId: displayWindowId,
                close: true,
            });
        }
    };

    getIpcServerPort = () => {
        return this.ipcServerPort;
    };

    setIpcServerPort = (newPort: number) => {
        this.ipcServerPort = newPort;
    };

    sendPostRequestCommand = (command: string, data: Record<string, any>) => {
        const currentSite = `https://${window.location.host}/`;
        Log.debug("currentSite = ", currentSite);
        return fetch(`${currentSite}command`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                command: command,
                data: data,
            }),
        });
    };

    handleSshFileContents = (event: any, data: {
        displayWindowId: string,
        widgetKey: string,
        fullFileName: string,
        fileContents: string,
    }) => {
        // find the widget
        Log.debug("----------------->, we get the file contents", data["fileContents"])
        const widget = g_widgets1.getWidget2(data["widgetKey"]);
        if (widget instanceof Media) {
            widget.updateFileContents(data["fileContents"]);
        }
    }

    /**
     * in desktop mode, the open display prompt is handled in main process using OS-dependent API
     * in ssh-client mode, we cannot use the same API, as we are opening the files on remote computer
     * instead, we show the prompt using a div element, and send 'open-tdl-file' in the end
     */
    handleOpenDisplayInSshMode = () => {
        this.getDisplayWindowClient().getPrompt().createElement("open-display-in-ssh-mode");
    }

    handleShowAboutTdm = (event: any, info: {
        authors: string[],
    }) => {
        this.getDisplayWindowClient().getPrompt().createElement("about-tdm", info);
    }

    handleFileConverterCommand = (event: any, info: {
        type: "one-file-conversion-started" | "one-file-conversion-finished" | "all-file-conversion-finished",
        widgetKey: string,
        srcFileName?: string,
        destFileName?: string,
        status: "success" | "converting",
        timeDurationMs?: number, // ms
        numWidgetsOrig?: number, // number of widgets in edl file
        numWidgetsTdl?: number, // number of widgets in tdl file
    }) => {
        const widget = g_widgets1.getWidget2(info["widgetKey"]);
        if (widget instanceof FileConverter) {
            widget.handleNewData(info);
        }
    }

    // handleErrorMessage = (event: any, info: {
    //     messageType: "error" | "warnng" | "info",
    //     humanReadableMessages: string[],
    //     rawMessages: string[],
    // }) => {
    //     Log.info('received error message', info)
    //     this.getDisplayWindowClient().getPrompt().createElement("error-message", info);
    // }

    handleDialogShowMessageBox = (event: any, info: type_DialogMessageBox) => {
        const command = info["command"];
        if (command === undefined) {
        } else if (command === "hide") {
            this.getDisplayWindowClient().getPrompt().removeElement();
        } else if (command === "quit-tdm-process-confirm") {
            const buttons = info["buttons"];
            if (buttons !== undefined && buttons.length === 2) {
                buttons[0]["handleClick"] = () => {
                    this.sendFromRendererProcess("quit-tdm-process", true);
                };
            }
        } else if (command === "window-will-be-closed-confirm") {
            const buttons = info["buttons"];
            if (buttons !== undefined && buttons.length === 3) {
                const attachment = info["attachment"];
                buttons[0]["handleClick"] = () => {
                    const widgetKey = attachment["widgetKey"];
                    if (widgetKey !== undefined) {
                        const widget = g_widgets1.getWidget2(widgetKey);
                        if (widget instanceof DataViewer) {
                            const data = widget.getPlot().prepareExportData();
                            this.sendFromRendererProcess("window-will-be-closed",
                                { ...{ ...attachment, dataViewerData: data }, saveConfirmation: "Save" }
                            );
                            return;
                        }
                    }

                    this.sendFromRendererProcess("window-will-be-closed",
                        { ...attachment, saveConfirmation: "Save" }
                    );
                };
                buttons[1]["handleClick"] = () => {
                    this.sendFromRendererProcess("window-will-be-closed",
                        { ...attachment, saveConfirmation: "Don't Save" }
                    );
                };
                buttons[2]["handleClick"] = () => {
                    this.sendFromRendererProcess("window-will-be-closed",
                        { ...attachment, saveConfirmation: "Cancel" }
                    );
                };
            }
        } else if (command === "open-text-file-large-confirm") {
            const buttons = info["buttons"];
            if (buttons !== undefined && buttons.length === 2) {
                const attachment = info["attachment"];
                // Yes
                buttons[0]["handleClick"] = () => {
                    // this command is from TextEditor window, we should use open-text-file event
                    this.sendFromRendererProcess("open-text-file-in-text-editor",
                        { ...attachment, largeFileConfirmOpen: "Yes" }
                    );
                };
                // No
                buttons[1]["handleClick"] = () => {
                    // do nothing, do not send back the attachment, otherwise
                    // the open file dialog pops again
                    // this.sendFromRendererProcess("open-text-file",
                    //     { ...attachment, largeFileConfirmOpen: "No" }
                    // );
                };
            }

        }
        this.getDisplayWindowClient().getPrompt().createElement("dialog-message-box", info);
    };

    handleDialogShowInputBox = (event: any, info: type_DialogInputBox) => {
        const command = info["command"];
        const prompt = this.getDisplayWindowClient().getPrompt();
        if (command === "save-tdl-file") {
            const buttons = info["buttons"];
            const attachment = info["attachment"];
            // OK, Cancel
            if (buttons !== undefined && buttons.length === 2) {
                buttons[0]["handleClick"] = () => {
                    const tdlFileName = prompt.getDialogInputBoxText();
                    if (tdlFileName !== "") {
                        attachment["tdlFileName1"] = prompt.getDialogInputBoxText();
                        this.sendFromRendererProcess("save-tdl-file",
                            ...Object.values(attachment)
                        );
                    }
                };
                buttons[1]["handleClick"] = () => {
                };
            }
        } else if (command === "hide") {
            this.getDisplayWindowClient().getPrompt().removeElement();
        } else if (command === "window-will-be-closed") {
            const buttons = info["buttons"];
            const attachment = info["attachment"];
            // OK, Cancel
            if (buttons !== undefined && buttons.length === 2) {
                buttons[0]["handleClick"] = () => {
                    const tdlFileName = prompt.getDialogInputBoxText();
                    if (tdlFileName !== "") {
                        attachment["tdlFileName"] = tdlFileName;
                        this.sendFromRendererProcess("window-will-be-closed",
                            attachment
                        );
                    }
                };
                buttons[1]["handleClick"] = () => {
                };
            }
        } else if (command === "save-data-to-file") {
            const buttons = info["buttons"];
            const attachment = info["attachment"];
            // OK, Cancel
            if (buttons !== undefined && buttons.length === 2) {
                buttons[0]["handleClick"] = () => {
                    const fileName = prompt.getDialogInputBoxText();
                    if (fileName !== "") {
                        attachment["fileName"] = fileName;
                        this.sendFromRendererProcess("save-data-to-file",
                            attachment
                        );
                    }
                };
                buttons[1]["handleClick"] = () => {
                };
            }
        } else if (command === "data-viewer-export-data") {
            const buttons = info["buttons"];
            const attachment = info["attachment"];
            // OK, Cancel
            if (buttons !== undefined && buttons.length === 2) {
                buttons[0]["handleClick"] = () => {
                    const fileName = prompt.getDialogInputBoxText();
                    if (fileName !== "") {
                        attachment["fileName1"] = fileName;
                        this.sendFromRendererProcess("data-viewer-export-data",
                            ...Object.values(attachment)
                        );
                    }
                };
                buttons[1]["handleClick"] = () => {
                };
            }
        } else if (command === "save-text-file") {
            const buttons = info["buttons"];
            const attachment = info["attachment"];
            // OK, Cancel
            if (buttons !== undefined && buttons.length === 2) {
                buttons[0]["handleClick"] = () => {
                    const fileName = prompt.getDialogInputBoxText();
                    if (fileName !== "") {
                        attachment["fileName"] = fileName;
                        this.sendFromRendererProcess("save-text-file",
                            attachment
                        );
                    }
                };
                buttons[1]["handleClick"] = () => {
                };
            }
        } else if (command === "select-a-file") {
            const buttons = info["buttons"];
            const attachment = info["attachment"];
            // OK, Cancel
            if (buttons !== undefined && buttons.length === 2) {
                buttons[0]["handleClick"] = () => {
                    const fileName = prompt.getDialogInputBoxText();
                    if (fileName !== "") {
                        this.sendFromRendererProcess("select-a-file",
                            attachment,
                            fileName
                        );
                    }
                };
                buttons[1]["handleClick"] = () => {
                };
            }
        } else if (command === "open-text-file") {
            // this command is initiated from a TextEditor window, we should use "open-text-file" event
            const buttons = info["buttons"];
            const attachment = info["attachment"];
            // OK, Cancel
            if (buttons !== undefined && buttons.length === 2) {
                buttons[0]["handleClick"] = () => {
                    const fileName = prompt.getDialogInputBoxText();
                    if (fileName !== "") {
                        attachment["fileName"] = fileName;
                        this.sendFromRendererProcess("open-text-file-in-text-editor",
                            attachment,
                        );
                    }
                };
                buttons[1]["handleClick"] = () => {
                };
            }
        } else if (command === "open-tdl-file") {
            const buttons = info["buttons"];
            const attachment = info["attachment"];
            // OK, Cancel
            if (buttons !== undefined && buttons.length === 2) {
                buttons[0]["handleClick"] = () => {
                    const tdlFileName = prompt.getDialogInputBoxText();
                    if (tdlFileName !== "") {
                        attachment["tdlFileNames"] = [tdlFileName];
                        this.sendFromRendererProcess("open-tdl-file",
                            attachment
                        );
                    }
                };
                buttons[1]["handleClick"] = () => {
                    // this.sendFromRendererProcess("quit-tdm-process", true);
                };
            }
        }

        this.getDisplayWindowClient().getPrompt().createElement("dialog-input-box", info);
    };


    handleLocalFontNames = (event: any, localFontNames: string[]) => {
        FontsData.g_localFonts = localFontNames;
    }

    handleDbFileContents = (event: any, data: {
        displayWindowId: string,
        fileName: string,
        db: Record<string, any>[]
    }) => {

        const widgets = g_widgets1.getWidgets2().values();
        for (const widget of widgets) {
            if (widget instanceof ChannelGraph) {
                widget.loadDbFile(data["fileName"], data["db"]);
                break;
            }
        }
    }

    handleTerminalCommandResult = (event: any, result: {
        widgetKey: string,
        ioId: number,
        command: string,
        result: any[],
    }) => {
        try {
            const widget = g_widgets1.getWidget2(result["widgetKey"]);
            if (widget instanceof Terminal) {
                const ios = widget.getIos();
                ios.resolveIo(result["ioId"], result["result"]);
            } else {
                Log.error("Widget", result["widgetKey"], "should not use terminal command");
            }
        } catch (e) {
            Log.error("cannot find widget", result["widgetKey"]);
        }
    }

    handleProcessesInfo = (event: any, data: {
        widgetKey: string,
        processesInfo: {
            "Type": string;
            "Window ID": string;
            "Visible": string;
            "TDL file name": string;
            "Window name": string;
            "Editable": string;
            "Uptime [second]": number;
            "Process ID": number;
            "CPU usage [%]": number;
            "Memory usage [MB]": number;
            "Thumbnail": string;
        }[];
    }) => {
        try {
            const widget = g_widgets1.getWidget2(data["widgetKey"]);
            if (widget instanceof ProfilesViewer) {
                widget.updateProcessesInfo(data["processesInfo"]);
            }
        } catch (e) {
            Log.error(e);
        }
    }


    handleEpicsStats = (event: any, data: {
        widgetKey: string,
        epicsStats: {
            udp: Record<string, any>,
            tcp: Record<string, Record<string, any>>,
        };
    }) => {
        try {
            const widget = g_widgets1.getWidget2(data["widgetKey"]);
            if (widget instanceof ProfilesViewer) {
                widget.updateEpicsStats(data["epicsStats"]);
            }
        } catch (e) {
            Log.error(e);
        }
    }

    handleCaSnooperData = (event: any, data: {
        data: {
            msSinceEpoch: number,
            channelName: string,
            ip: string, // source IP address
            port: number, // source port
        }[],
    }) => {
        const widgets = g_widgets1.getWidgets2();
        for (let widget of widgets.values()) {
            if (widget instanceof CaSnooper) {
                widget.handleNewData(data["data"]);
                return;
            }
        }
    }

    handleCaswData = (event: any, data: {
        data: {
            msSinceEpoch: number,
            channelName: string,
            ip: string, // source IP address
            port: number, // source port
        }[],
    }) => {
        const widgets = g_widgets1.getWidgets2();
        for (let widget of widgets.values()) {
            if (widget instanceof Casw) {
                widget.handleNewData(data["data"]);
                return;
            }
        }
    }

    handleTextFileContents = (event: any, result: {
        displayWindowId: string,
        widgetKey: string
        fileName: string,
        fileContents: string,
        readable: boolean,
        writable: boolean,
    }) => {
        if (result["widgetKey"].startsWith("TextEditor_")) {
            const widget = g_widgets1.getWidget(result["widgetKey"]);
            if (widget instanceof TextEditor) {
                widget.loadFileContents({
                    fileName: result["fileName"],
                    fileContents: result["fileContents"],
                    readable: result["readable"],
                    writable: result["writable"],
                })
            }
        }
    }

    handleSaveTextFileStatus = (event: any, status: {
        displayWindowId: string,
        widgetKey: string,
        status: "success" | "fail",
        fileName: string
    }) => {
        if (status["widgetKey"].startsWith("TextEditor_")) {
            const widget = g_widgets1.getWidget(status["widgetKey"]);
            if (widget instanceof TextEditor) {
                widget.setWindowName(status["fileName"], false);
                widget.setFileName(status["fileName"], false);
                widget.setModified(false);
                // re-render
                if (widget.setFileNameState !== undefined) {
                    widget.setFileNameState(status["fileName"]);
                }
                if (status["status"] === "success") {
                    widget.setWritable(true);
                }
            }
        }
    }

    handleNewLog = (event: any, data: type_logData) => {
        const widgetKey = data["widgetKey"];
        const widget = g_widgets1.getWidget(widgetKey);
        if (widget instanceof LogViewer) {
            widget.addNewLogData(data);
        }
    }
}
