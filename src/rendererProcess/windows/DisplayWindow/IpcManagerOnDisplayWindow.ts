import { DisplayWindowClient } from "./DisplayWindowClient";
import { g_widgets1 } from "../../../rendererProcess/global/GlobalVariables";
import { rendererWindowStatus, type_widget } from "../../../rendererProcess/global/Widgets";
import { g_flushWidgets } from "../../../rendererProcess/helperWidgets/Root/Root";
import { DataViewer } from "../../../rendererProcess/widgets/DataViewer/DataViewer";
import { BaseWidget } from "../../../rendererProcess/widgets/BaseWidget/BaseWidget";
import { ScaledSlider } from "../../../rendererProcess/widgets/ScaledSlider/ScaledSlider";
import { Spinner } from "../../../rendererProcess/widgets/Spinner/Spinner";
import { EmbeddedDisplay } from "../../../rendererProcess/widgets/EmbeddedDisplay/EmbeddedDisplay";
import { Canvas } from "../../../rendererProcess/helperWidgets/Canvas/Canvas";
import { XYPlot } from "../../../rendererProcess/widgets/XYPlot/XYPlot";
import { Terminal } from "../../../rendererProcess/widgets/Terminal/Terminal";
import { Log } from "../../../common/Log";
import { Media } from "../../../rendererProcess/widgets/Media/Media";
import { GlobalVariables } from "../../../common/GlobalVariables";
import { FontsData } from "../../../rendererProcess/global/FontsData";
import { ProfilesViewer } from "../../../rendererProcess/widgets/ProfilesViewer/ProfilesViewer";
import { CaSnooper } from "../../../rendererProcess/widgets/CaSnooper/CaSnooper";
import { Casw } from "../../../rendererProcess/widgets/Casw/Casw";
import { TextEditor } from "../../../rendererProcess/widgets/TextEditor/TextEditor";
import { LogViewer } from "../../../rendererProcess/widgets/LogViewer/LogViewer";
import { PvMonitor } from "../../../rendererProcess/widgets/PvMonitor/PvMonitor";
import { FileConverter } from "../../../rendererProcess/widgets/FileConverter/FileConverter";
import { ChannelSeverity, pvaValueDisplayType, TcaChannel } from "../../../rendererProcess/channel/TcaChannel";
import { ChannelGraph } from "../../../rendererProcess/widgets/ChannelGraph/ChannelGraph";
import { Probe } from "../../../rendererProcess/widgets/Probe/Probe";
import { Repeater } from "../../../rendererProcess/widgets/Repeater/Repeater";
import { FileBrowser } from "../../../rendererProcess/widgets/FileBrowser/FileBrowser";
import { SeqGraph } from "../../../rendererProcess/widgets/SeqGraph/SeqGraph";
import { Image } from "../../../rendererProcess/widgets/Image/Image";
import { IpcEventArgType, IpcEventArgType2 } from "../../../common/IpcEventArgType";
import { Table } from "../../widgets/Table/Table";


/**
 * Manage IPC messages sent from main process for main window. <br>
 *
 * This IPC manager is for `MainWindowClient` object
 * 
 * It uses a random port between 4000 and 4999
 */
export class IpcManagerOnDisplayWindow {
    private _displayWindowClient: DisplayWindowClient;
    ipcServerPort: number = -1;
    private _websocketClient: undefined | WebSocket = undefined;
    eventListeners: Record<string, (evnet: any, ...args: any) => any> = {};


    constructor(displayWindowClient: DisplayWindowClient, ipcServerPort: number) {
        this._displayWindowClient = displayWindowClient;
        this.setIpcServerPort(ipcServerPort);

        setInterval(() => {
            this.checkIpcConnection();
        }, 10000)
    }

    /**
     * Check if the websocket-based IPC connection is alive. If not, reconnect.
     */
    checkIpcConnection = () => {
        const websocketClient = this.getWebSocketClient();
        if (websocketClient === undefined) {
            this.connectIpcServer(true);
        } else if (websocketClient.readyState === WebSocket.CLOSED) {
            Log.error("websocket IPC is closed, re-connect")
            this.connectIpcServer(true);
        }
        // else: it is good, do nothing
    }

    connectIpcServer = (reconnect: boolean = false) => {

        Log.info(`Trying to ${reconnect === true ? "re-" : ""}connect to ipc server`, this.getDisplayWindowClient().getWindowId(), this.ipcServerPort);
        if (this.getIpcServerPort() === -1) {
            return;
        }
        let serverAddress = `wss://127.0.0.1:${this.getIpcServerPort()}`;
        if (this.getDisplayWindowClient().getMainProcessMode() === "web") {
            const host = window.location.host.split(":")[0];
            Log.info("Web mode host:", host);
            serverAddress = `wss://${host}:${this.getIpcServerPort()}`;
        }

        const mainProcessMode = this.getDisplayWindowClient().getMainProcessMode();

        const client = new WebSocket(serverAddress);

        client.onopen = () => {
            Log.info("Successfully connected to ipc server", this.getDisplayWindowClient().getWindowId(), this.ipcServerPort);
            this.setWebSocketClient(client);

            if (reconnect === true) {
                // remove prompt
                this.getDisplayWindowClient().getPrompt().removeElement();
            }

            this.sendFromRendererProcess("websocket-ipc-connected-on-display-window",
                {
                    processId: this.getDisplayWindowClient().getProcessId(),
                    windowId: this.getDisplayWindowClient().getWindowId(),
                    reconnect: reconnect,
                }
            )
        };

        client.onerror = (err: any) => {
            Log.error("IPC websocket client error:", err)
        }

        client.onclose = (ev: CloseEvent) => {
            Log.error("IPC websocket connection closed", ev, ev.code, ev.reason);
            // show a message on the display window
            this.handleDialogShowMessageBox(undefined, {
                info: {
                    messageType: "error",
                    humanReadableMessages: [`Window lost connection with TDM main service. ${mainProcessMode === "desktop" ? "Trying to reconnect ..." : ""}`],
                    rawMessages: []
                }
            })
        }

        client.onmessage = (event: MessageEvent) => {
            const messageBuffer = event.data;
            // const message = JSON.parse(messageBuffer.toString(), (key, value) =>
            //     value === null ? undefined : value);
            const message = JSON.parse(messageBuffer);
            this.replaceNullWithUndefined(message);
            this.handleMessage(message);
        };
    };


    replaceNullWithUndefined = (obj: Record<string, any>) => {
        if (obj && typeof obj === "object" && !Array.isArray(obj)) {
            for (const key in obj) {
                if (obj[key] === null) {
                    obj[key] = undefined;
                } else if (typeof obj[key] === "object") {
                    this.replaceNullWithUndefined(obj[key]);
                }
            }
        }
    }


    handleMessage = (message: { processId: number; windowId: string; eventName: string; data: any[] }) => {
        const processId = message["processId"];
        const eventName = message["eventName"];
        const windowId = message["windowId"];
        const callback = this.eventListeners[eventName];
        if (callback !== undefined) {
            // invoke callback
            const data = message["data"];
            callback(undefined, ...data);
        }
    };

    ipcRenderer = {
        // strip off the processId
        on: (channel: string, callback: (event: any, ...args: any) => any) => {
            this.eventListeners[channel] = callback;
        },
    };

    sendFromRendererProcess = <T extends keyof IpcEventArgType>(
        channelName: T,
        data: IpcEventArgType[T]
    ): void => {
        Log.debug("send message to IPC server", channelName);
        const processId = this.getDisplayWindowClient().getProcessId();
        if (processId !== "") {
            const wsClient = this.getWebSocketClient();
            if (wsClient !== undefined) {
                wsClient.send(
                    JSON.stringify({
                        processId: processId,
                        windowId: this.getDisplayWindowClient().getWindowId(),
                        eventName: channelName,
                        data: [data], // Wrap in array to match your existing format
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

            const displayWindowClient = this.getDisplayWindowClient();
            const mode = displayWindowClient.getMainProcessMode();

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
                                fileContent: "",
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
                    // must use preload.js to resolve the full file path
                    const electronAPI = (window as any).electronAPI;
                    if (electronAPI !== undefined && electronAPI.getFilePath !== undefined) {
                        const tdlFileName = electronAPI.getFilePath(file);
                        tdlFileNames.push(tdlFileName);
                    }
                }

                if (g_widgets1 !== undefined) {
                    Log.info("File Path of dragged files: ", tdlFileNames);
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
                        this.sendFromRendererProcess("open-tdl-file",
                            {
                                options: {
                                    tdlFileNames: tdlFileNames,
                                    mode: mode as "editing" | "operating",
                                    // manually opened, always editable
                                    editable: true,
                                    // use parent window's macros
                                    macros: externalMacros,
                                    replaceMacros: true,
                                    // currentTdlFolder?: string;
                                    windowId: this.getDisplayWindowClient().getWindowId(),
                                }
                            }
                        );
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

    /**
     * Start to listen to events from main process.
     */
    startToListen = () => {
        this.ipcRenderer.on("context-menu-command", this.handleContextMenuCommand);
        this.ipcRenderer.on("new-channel-data", this.handleNewChannelData);
        this.ipcRenderer.on("new-archive-data", this.handleNewArchiveData);
        this.ipcRenderer.on("new-tdl", this.handleNewTdl);
        this.ipcRenderer.on("selected-profile-contents", this.handleSelectedProfileContents);
        this.ipcRenderer.on("tca-get-result", this.handleTcaGetResult);
        this.ipcRenderer.on("tca-put-result", this.handleTcaPutResult);

        this.ipcRenderer.on("fetch-pva-type", this.handleFetchPvaType);
        this.ipcRenderer.on("dialog-show-message-box", this.handleDialogShowMessageBox);
        this.ipcRenderer.on("dialog-show-input-box", this.handleDialogShowInputBox);
        this.ipcRenderer.on("tdl-file-saved", this.handleTdlFileSaved);
        this.ipcRenderer.on("select-a-file", this.handleSelectAFile);
        this.ipcRenderer.on("widget-specific-action", this.handleWidgetSpecificAction);
        this.ipcRenderer.on("local-font-names", this.handleLocalFontNames);
        this.ipcRenderer.on("load-db-file-contents", this.handleLoadDbFileContents);

        this.ipcRenderer.on("get-symbol-gallery", this.handleGetSymbolGallery);

        this.ipcRenderer.on("start-record-video", this.handleStartRecordVideo);

        this.ipcRenderer.on("window-will-be-closed", this.handleWindowWillBeClosed);

        this.ipcRenderer.on("obtained-iframe-uuid", this.handleObtainedIframeUuid);
        this.ipcRenderer.on("read-embedded-display-tdl", this.handleReadEmbeddedDisplayTdl);

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
        this.ipcRenderer.on("update-text-editor-file-name", this.handleUpdateTextEditorFileName)
        this.ipcRenderer.on("update-text-editor-modified-status", this.handleUpdateTextEditorModifiedStatus)
        this.ipcRenderer.on("new-log", this.handleNewLog)
        this.ipcRenderer.on("file-converter-command", this.handleFileConverterCommand);
        // file browser
        this.ipcRenderer.on("fetch-folder-content", this.handleFetchFolderContent);
        this.ipcRenderer.on("file-browser-command", this.handleFileBrowserCommand);
        this.ipcRenderer.on("fetch-thumbnail", this.handleFetchThumbnail)

        // site info
        this.ipcRenderer.on("site-info", this.handleSiteInfo)
        this.ipcRenderer.on("display-window-id-for-open-tdl-file", this.handleDisplayWindowIdForOpenTdlFile)

        this.ipcRenderer.on("get-media-content", this.handleGetMediaContent)

        this.ipcRenderer.on("pong", this.handlePong)

        this.ipcRenderer.on("bounce-back", this.handleBounceBack);
    };


    // ----------------------- event handlers -----------------------------

    handleContextMenuCommand = async (event: any, options: IpcEventArgType2["context-menu-command"]) => {
        const { command, subcommand } = options;
        Log.info("context menu command:", command, "subcommand", subcommand);
        // editing mode
        if (command === "create-widget") {
            if (subcommand === "text-update") {
                g_widgets1.createWidgetFromMouse("TextUpdate");
            } else if (subcommand === "binary-image") {
                g_widgets1.createWidgetFromMouse("BinaryImage");
            } else if (subcommand === "table") {
                g_widgets1.createWidgetFromMouse("Table");
            } else if (subcommand === "image") {
                g_widgets1.createWidgetFromMouse("Image");
            } else if (subcommand === "repeater") {
                g_widgets1.createWidgetFromMouse("Repeater");
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
            } else if (subcommand === "seq-graph") {
                g_widgets1.createWidgetFromMouse("SeqGraph");
            } else if (subcommand === "embedded-display") {
                g_widgets1.createWidgetFromMouse("EmbeddedDisplay");
            } else if (subcommand === "group") {
                g_widgets1.createWidgetFromMouse("Group");
            } else if (subcommand === "action-button") {
                g_widgets1.createWidgetFromMouse("ActionButton");
            } else if (subcommand === "pv-monitor") {
                g_widgets1.createWidgetFromMouse("PvMonitor");
            } else if (subcommand === "file-browser") {
                g_widgets1.createWidgetFromMouse("FileBrowser");
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
            // } else if (command === "create-new-display-in-web-mode") {
            //     this.handleCreateNewDisplayInWebMode();
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
        } else if (command === "file-browser") {
            g_widgets1.openFileBrowserWindow(subcommand as [string, boolean]);
        } else if (command === "data-viewer") {
            g_widgets1.openDataViewerWindow(subcommand as string[]);
        } else if (command === "terminal") {
            g_widgets1.openTerminalWindow();
        } else if (command === "channel-graph") {
            g_widgets1.openChannelGraphWindow(subcommand as string[]);
        } else if (command === "seq-graph") {
            g_widgets1.openSeqGraphWindow();
        } else if (command === "calculator") {
            g_widgets1.openCalculatorWindow();
        } else if (command === "help") {
            g_widgets1.openHelpWindow();
        }
    };

    handleObtainedIframeUuid = (
        event: string,
        options: IpcEventArgType2["obtained-iframe-uuid"]
    ) => {
        const widget = g_widgets1.getWidget2(options["widgetKey"]);
        if (widget instanceof Repeater) {
            widget.loadHtml(options["iframeDisplayId"]);
            widget.setIframeBackgroundColor(options["tdlBackgroundColor"]);
        }
    };

    handleReadEmbeddedDisplayTdl = (
        event: string,
        data: IpcEventArgType2["read-embedded-display-tdl"]
    ) => {
        const embeddedDisplayWidget = g_widgets1.getWidget(data["widgetKey"]);
        if (!(embeddedDisplayWidget instanceof EmbeddedDisplay)) {
            return;
        }

        embeddedDisplayWidget.loadDisplayFromTdl(data);
    }

    handleRequestEpicsDbd = (event: string, result: IpcEventArgType2["request-epics-dbd"]) => {
        const widget = g_widgets1.getWidget(result["widgetKey"]);
        if (widget instanceof ChannelGraph || widget instanceof Probe) {
            widget.processDbd({
                menus: result["menus"],
                recordTypes: result["recordTypes"],
            })
        }

    }

    handleTdlFileSaved = (event: string, data: IpcEventArgType2["tdl-file-saved"]) => {
        const { newTdlFileName } = data;
        Log.debug("TDL file saved to", newTdlFileName);
        this.getDisplayWindowClient().setTdlFileName(newTdlFileName);
        if (this.getDisplayWindowClient().getWindowTitleType() === "file-name") {
            this.sendFromRendererProcess("set-window-title",
                {
                    windowId: this.getDisplayWindowClient().getWindowId(),
                    newTitle: newTdlFileName,
                }
            );
        }
        this.getDisplayWindowClient().getActionHistory().setModified(false);
        this.getDisplayWindowClient().updateWindowTitle();
    };

    // only in display mode
    handleCreateNewDisplayInWebMode = () => {
        this.sendFromRendererProcess("create-blank-display-window", {
            windowId: this.getDisplayWindowClient().getWindowId(),
        })
    };


    handleSelectedProfileContents = (event: string, data: IpcEventArgType2["selected-profile-contents"]) => {
        const { contents } = data;
        this.getDisplayWindowClient().setProfileContents(contents);


        try {
            const presetColors = this.getDisplayWindowClient().getProfileCategory("Preset Colors");
            if (presetColors === undefined) {
                return;
            }
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
     * 
     * @param event
     * 
     * @param newDbrData a dictionary of channel name and its new dbr data
     */
    handleNewChannelData = (event: string, data: IpcEventArgType2["new-channel-data"]) => {
        const { newDbrData } = data;

        Log.info("received data", JSON.stringify(newDbrData, null, 4));

        let channelNames = Object.keys(newDbrData);

        // special widgets that has new dbr data mapping, this mapping should only occurs once
        const dbrDataMappedWidgetKeys: string[] = [];
        const dbrDataMappedWidgets: type_widget[] = [];

        for (let channelName of channelNames) {
            try {
                // (1)
                let tcaChannels: TcaChannel[] = [];
                const tcaChannel = g_widgets1.getTcaChannel(channelName);
                if (tcaChannel.getProtocol() === "pva") {
                    // tcaChannels = g_widgets1.getTcaSubPvaChannels(channelName);
                    tcaChannels.push(g_widgets1.getTcaChannel(channelName));
                } else {
                    try {
                        tcaChannels.push(tcaChannel);
                    } catch (e) {
                        Log.error(e);
                    }
                    try {
                        tcaChannels.push(g_widgets1.getTcaChannel(channelName + ".SEVR"));
                    } catch (e) {
                        Log.error(e);
                    }
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
                        tcaChannel.appendToDbrData({ value: undefined, severity: ChannelSeverity.NOT_CONNECTED });
                    } else {
                        // (a) normal situation
                        // (b) if the epics channel is softly destroyed (IOC offline, network down), it sends
                        //     {value: undefined, severity: 3}, but the `value: undefined` is not serialized 
                        //     in websocket transmission. So, we only receive {severity: 3}. In this case, the below 
                        //     appendToDbrData() won't assign "undefined" to the value. Instead, the last valid
                        //     value is kept. We use this feature (bug) to keep the old value, so that something 
                        //     can be displayed in the widget. The widget only updates the severity and the corresponding 
                        //     severity outline.
                        // console.log("append to data", data)
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
                            if (widget instanceof DataViewer || widget instanceof XYPlot || widget instanceof Terminal || widget instanceof ChannelGraph || widget instanceof SeqGraph || widget instanceof Image) {
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
            if (widget instanceof XYPlot || widget instanceof Terminal || widget instanceof ChannelGraph || widget instanceof SeqGraph || widget instanceof Image) {
                console.log("OKOKOK")
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

    handleNewArchiveData = (event: string, data: IpcEventArgType2["new-archive-data"]) => {
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
    handleTcaGetResult = (event: string, data: IpcEventArgType2["tca-get-result"]) => {
        const { ioId, newDbrData, widgetKey } = data;
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


    // (1) resolve IO, letting TcaChannel.get() to continue, writing the data to TcaChannel
    // (2) determine which widgets should be re-rendered
    // (3) flush widgets
    handleTcaPutResult = (event: string, result: IpcEventArgType2["tca-put-result"]) => {
        // console.log(newDbrData);
        // console.log("receive", JSON.stringify(newDbrData));
        const readWriteIos = g_widgets1.getReadWriteIos();
        // lift the block of PUT operation
        readWriteIos.resolveIo(result["ioId"], result);
    };

    handleFetchPvaType = (event: string, data: IpcEventArgType2["fetch-pva-type"]) => {
        const { ioId, channelName, fullPvaType } = data;
        try {
            const readWriteIos = g_widgets1.getReadWriteIos();
            // lift the block of GET operation
            readWriteIos.resolveIo(ioId, fullPvaType);

            const channel = g_widgets1.getTcaChannel(channelName);
            channel.setFullPvaType(fullPvaType);
            channel.setPvaValueDisplayType(pvaValueDisplayType.PRIMITIVE_VALUE_FIELD);
        } catch (e) {
            const readWriteIos = g_widgets1.getReadWriteIos();
            readWriteIos.rejectIo(ioId, `${e}`);
            Log.error(`${e}`);
        }
    };



    handleNewTdl = (
        event: string,
        options: IpcEventArgType2["new-tdl"]
    ) => {
        Log.info("Received a new-tdl", options);
        this.getDisplayWindowClient().getIpcManager().sendFromRendererProcess("ping", {
            displayWindowId: this.getDisplayWindowClient().getWindowId(),
            id: "0",
            time: performance.now(),
        })
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

    handleSelectAFile = (event: string, data: IpcEventArgType2["select-a-file"]) => {
        const { options, fileName } = data;
        const widgetKey = options["widgetKey"];
        if (widgetKey === undefined) {
            Log.error("select-a-file has no widget key");
            return;
        }

        try {
            const widget = g_widgets1.getWidget2(widgetKey);
            if (widget instanceof BaseWidget) {
                if (widget.handleSelectAFile) {
                    widget.handleSelectAFile(options, fileName);
                }
            } else if (widget instanceof Canvas) {
                widget.handleSelectAFile(options, fileName);
            }
        } catch (e) {
            Log.error(e);
        }
    };

    handleWidgetSpecificAction = (event: undefined, data: IpcEventArgType2["widget-specific-action"]) => {
        const { widgetKey, actionName } = data;
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
        if (widgetKey.includes("LogViewer") || widgetKey.includes("PvMonitor") || widgetKey.includes("CaSnooper") || widgetKey.includes("Casw") || widgetKey.includes("FileConverter") || widgetKey.includes("Table")) {
            try {
                const widget = g_widgets1.getWidget2(widgetKey);
                if ((widget instanceof LogViewer) || (widget instanceof PvMonitor) || (widget instanceof CaSnooper) || (widget instanceof Casw) || (widget instanceof FileConverter) || (widget instanceof Table)) {
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

    handleStartRecordVideo = (event: string, data: IpcEventArgType2["start-record-video"]) => {
        const { sourceId, folder } = data;
        const displayWindowClient = this.getDisplayWindowClient();
        const videoRecorder = displayWindowClient.getVideoRecorder();
        videoRecorder.setSourceId(sourceId);
        videoRecorder.start(folder);
    };

    /**
     * Handles a window close request by checking for unsaved display, text editor,
     * or data viewer changes and prompting the user to save, discard, or cancel.
     */
    handleWindowWillBeClosed = (event: string, data: IpcEventArgType2["window-will-be-closed"]) => {
        Log.info("window will be closed");
        const displayWindowClient = this.getDisplayWindowClient();
        const history = displayWindowClient.getActionHistory();
        const isUtilityWindow = displayWindowClient.getIsUtilityWindow();
        const displayWindowId = displayWindowClient.getWindowId();
        const tdlFileName = displayWindowClient.getTdlFileName();
        const prompt = displayWindowClient.getPrompt();

        const canvas = g_widgets1.getWidget("Canvas");
        let windowName = "";
        if (canvas instanceof Canvas) {
            windowName = canvas.getWindowName();
        }

        const sendUserSelect = (
            select: IpcEventArgType["window-will-be-closed-user-select"]["select"],
            widgetKey: string,
            fileName: string,
            fileContent: string,
            dataType: IpcEventArgType["window-will-be-closed-user-select"]["dataType"],
        ) => {
            prompt.removeElement();
            this.sendFromRendererProcess("window-will-be-closed-user-select", {
                displayWindowId,
                widgetKey,
                select,
                fileName,
                fileContent,
                dataType,
            });
        };

        let widgetKey = "";
        let fileName = "";
        let fileContent = "";
        let dataType: IpcEventArgType["window-will-be-closed-user-select"]["dataType"] = "tdl";
        let humanReadableMessage = "This window has unsaved changes.";
        let shouldPrompt = false;

        if (isUtilityWindow && windowName.startsWith("TDM Text Editor")) {
            for (const widget of g_widgets1.getWidgets2().values()) {
                if (widget instanceof TextEditor && widget.getModified()) {
                    widgetKey = widget.getWidgetKey();
                    fileName = widget.getFileName();
                    fileContent = widget.getFileContent();
                    dataType = "text";
                    humanReadableMessage = "Save changes to the text file before closing?";
                    shouldPrompt = true;
                    break;
                }
            }
        } else if (isUtilityWindow && windowName.startsWith("TDM Data Viewer")) {
            for (const widget of g_widgets1.getWidgets2().values()) {
                if (widget instanceof DataViewer && widget.hasData()) {
                    widgetKey = widget.getWidgetKey();
                    fileContent = JSON.stringify(widget.getPlot().prepareExportData(), null, 4);
                    dataType = "data-viewer";
                    humanReadableMessage = "Save Data Viewer data before closing?";
                    shouldPrompt = true;
                    break;
                }
            }
        } else if (history.getModified()) {
            fileName = tdlFileName;
            fileContent = JSON.stringify(displayWindowClient.generateTdl(), null, 4);
            dataType = "tdl";
            humanReadableMessage = "Save changes to this display before closing?";
            shouldPrompt = true;
        }

        if (!shouldPrompt) {
            sendUserSelect("don't save", "", "", "", "tdl");
            return;
        }

        prompt.createElement("dialog-message-box", {
            command: "window-will-be-closed-confirm",
            messageType: "warning",
            humanReadableMessages: [humanReadableMessage],
            rawMessages: [],
            buttons: [
                {
                    text: "Save",
                    handleClick: () => {
                        sendUserSelect("save", widgetKey, fileName, fileContent, dataType);
                    },
                },
                {
                    text: "Don't Save",
                    handleClick: () => {
                        sendUserSelect("don't save", widgetKey, fileName, fileContent, dataType);
                    },
                },
                {
                    text: "Cancel",
                    handleClick: () => {
                        sendUserSelect("cancel", widgetKey, fileName, fileContent, dataType);
                    },
                },
            ],
        });
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

    handleSshFileContents = (event: string, data: IpcEventArgType2["ssh-file-contents"]) => {
        // find the widget
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

    handleShowAboutTdm = (event: string, info: IpcEventArgType2["show-about-tdm"]) => {
        this.getDisplayWindowClient().getPrompt().createElement("about-tdm", info);
    }

    handleFileConverterCommand = (event: string, info: IpcEventArgType2["file-converter-command"]) => {
        const widget = g_widgets1.getWidget2(info["widgetKey"]);
        if (widget instanceof FileConverter) {
            widget.handleNewData(info);
        }
    }

    handleFetchFolderContent = (event: string, message: IpcEventArgType2["fetch-folder-content"]) => {
        const widget = g_widgets1.getWidget(message["widgetKey"]);
        if (widget instanceof FileBrowser) {
            if (message["success"] !== false) {
                widget.updateFolderContent(message["folderContent"]);
            } else {
                // failed
                widget.handleFetchFolderContentFailed();
            }
        }
    }

    handleFileBrowserCommand = (event: string, message: IpcEventArgType2["file-browser-command"]) => {
        const widget = g_widgets1.getWidget(message["widgetKey"]);
        if (widget instanceof FileBrowser) {
            widget.handleFileBrowserCommand(message);
        }
    }

    handleFetchThumbnail = (event: string, message: IpcEventArgType2["fetch-thumbnail"]) => {
        const widget = g_widgets1.getWidget(message["widgetKey"]);
        if (widget instanceof FileBrowser) {
            widget.updateThumbnail(message);
        }
    }

    handleSiteInfo = (event: string, siteInfo: IpcEventArgType2["site-info"]) => {
        const displayWindowClient = this.getDisplayWindowClient();
        displayWindowClient.setSite(siteInfo["site"]);
    }

    handleDialogShowMessageBox = (event: undefined, data: IpcEventArgType2["dialog-show-message-box"]) => {
        const { info } = data;
        const command = info["command"];
        if (command === undefined) {
        } else if (command === "hide") {
            this.getDisplayWindowClient().getPrompt().removeElement();
        } else if (command === "quit-tdm-process-confirm") {
            const buttons = info["buttons"];
            if (buttons !== undefined && buttons.length === 2) {
                buttons[0]["handleClick"] = () => {
                    this.sendFromRendererProcess("quit-tdm-process", {
                        confirmToQuit: true
                    });
                };
            }
        }

        this.getDisplayWindowClient().getPrompt().createElement("dialog-message-box", info);
    };

    handleDialogShowInputBox = (event: undefined, data: IpcEventArgType2["dialog-show-input-box"]) => {
        const { info } = data;
        const prompt = this.getDisplayWindowClient().getPrompt();
        const shouldCreateElement = prompt.getPromptInputBoxHandlers().handleDialogShowInputBox(
            info,
            (channelName, payload) => {
                this.sendFromRendererProcess(channelName, payload);
            }
        );

        if (shouldCreateElement) {
            prompt.createElement("dialog-input-box", info);
        }
    };


    handleLocalFontNames = (event: string, data: IpcEventArgType2["local-font-names"]) => {
        const { localFontNames } = data;
        FontsData.g_localFonts = localFontNames;
    }

    handleLoadDbFileContents = (event: string, data: IpcEventArgType2["load-db-file-contents"]) => {
        const widgets = g_widgets1.getWidgets2().values();
        for (const widget of widgets) {
            if (widget instanceof ChannelGraph) {
                widget.loadDbFile(data["dbFileName"], data["dbFileContents"]);
                break;
            }
        }
    }

    handleGetSymbolGallery = (event: string, data: IpcEventArgType2["get-symbol-gallery"]) => {
        const { widgetKey, page, pageImages, pageNames } = data;
        const symbolGallery = this.getDisplayWindowClient().getSymbolGallery();
        const symbolGalleryHolderWidgetKey = symbolGallery.getHolderWidgetKey();
        if (widgetKey === symbolGalleryHolderWidgetKey) {
            // the widget is still holding the symbol gallery
            symbolGallery.setPageImages(pageImages);
            symbolGallery.setPageNames(pageNames);
            symbolGallery.setSelectedPage(page);
            symbolGallery.forceUpdate({});
        } else {
            // close the page, clean up data
            symbolGallery.removeElement();
        }
    }

    handleTerminalCommandResult = (event: string, result: IpcEventArgType2["terminal-command-result"]) => {
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

    handleProcessesInfo = (event: string, data: IpcEventArgType2["processes-info"]) => {
        try {
            const widget = g_widgets1.getWidget2(data["widgetKey"]);
            if (widget instanceof ProfilesViewer) {
                widget.updateProcessesInfo(data["processesInfo"]);
            }
        } catch (e) {
            Log.error(e);
        }
    }


    handleEpicsStats = (event: string, data: IpcEventArgType2["epics-stats"]) => {
        try {
            const widget = g_widgets1.getWidget2(data["widgetKey"]);
            if (widget instanceof ProfilesViewer) {
                widget.updateEpicsStats(data["epicsStats"]);
            }
        } catch (e) {
            Log.error(e);
        }
    }

    handleCaSnooperData = (event: string, data: IpcEventArgType2["ca-snooper-data"]) => {
        const widgets = g_widgets1.getWidgets2();
        for (let widget of widgets.values()) {
            if (widget instanceof CaSnooper) {
                widget.handleNewData(data["data"]);
                return;
            }
        }
    }

    handleCaswData = (event: string, data: IpcEventArgType2["ca-sw-data"]) => {
        const widgets = g_widgets1.getWidgets2();
        for (let widget of widgets.values()) {
            if (widget instanceof Casw) {
                widget.handleNewData(data["data"]);
                return;
            }
        }
    }

    handleTextFileContents = (event: string, result: IpcEventArgType2["text-file-contents"]) => {
        if (result["widgetKey"].startsWith("TextEditor_")) {
            const widget = g_widgets1.getWidget(result["widgetKey"]);
            if (widget instanceof TextEditor) {
                widget.updateFileContents({
                    fileName: result["fileName"],
                    fileContent: result["fileContent"],
                    readable: result["readable"],
                    writable: result["writable"],
                })
            }
        }
    }

    handleUpdateTextEditorFileName = (event: string, status: IpcEventArgType2["update-text-editor-file-name"]) => {
        const widget = g_widgets1.getWidget(status["widgetKey"]);
        if (widget instanceof TextEditor) {
            widget.updateFileName(status["fileName"]);
        } else {
            Log.error("Cannot update TextEditor file name: widget is missing or not TextEditor", status["widgetKey"]);
        }
    }

    handleUpdateTextEditorModifiedStatus = (event: string, status: IpcEventArgType2["update-text-editor-modified-status"]) => {
        const widget = g_widgets1.getWidget(status["widgetKey"]);
        if (widget instanceof TextEditor) {
            widget.setModified(false);
            widget.upateWindowTitle(widget.getFileName());
        } else {
            Log.error("Cannot update TextEditor modified status: widget is missing or not TextEditor", status["widgetKey"]);
        }
    }

    handleNewLog = (event: string, result: IpcEventArgType2["new-log"]) => {
        const { data } = result;
        const widgetKey = data["widgetKey"];
        const widget = g_widgets1.getWidget(widgetKey);
        if (widget instanceof LogViewer) {
            widget.addNewLogData(data);
        }
    }

    handleDisplayWindowIdForOpenTdlFile = (event: string, data: IpcEventArgType2["display-window-id-for-open-tdl-file"]) => {
        const { displayWindowId } = data;
        const currentSite = `https://${window.location.host}/`;
        const href = `${currentSite}DisplayWindow.html?displayWindowId=${displayWindowId}`;
        window.open(href, "_blank", "noopener, noreferrer")
    }

    /**
     * the data coming in is a data uri, in form of "data:image..." or "data:application/...."
     * 
     * the svg file is converted to uri instead of raw file content
     */
    handleGetMediaContent = (event: string, data: IpcEventArgType2["get-media-content"]) => {
        const { content, widgetKey } = data;
        const widget = g_widgets1.getWidget(widgetKey);
        if (widget instanceof Media) {
            widget.setBase64Content(content);

            g_widgets1.addToForceUpdateWidgets(widgetKey);
            g_widgets1.addToForceUpdateWidgets("GroupSelection2");
            g_flushWidgets();
        }
    }

    handlePong = (event: string, data: IpcEventArgType2["pong"]) => {
        Log.info("Round trip time for ping-pong initiated by this Display Window:", performance.now() - data["time"], "ms");
    }

    handleBounceBack = (event: string, message: IpcEventArgType2["bounce-back"]) => {
        const { eventName, data } = message;
        this.sendFromRendererProcess(eventName as any, data);
    }

    getWebSocketClient = () => {
        return this._websocketClient;
    }

    setWebSocketClient = (newClient: WebSocket) => {
        this._websocketClient = newClient;
    }
}
