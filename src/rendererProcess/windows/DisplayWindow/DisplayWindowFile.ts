import { Terminal } from "@xterm/xterm";
import { type_tdl } from "../../../common/GlobalVariables";
import { Log } from "../../../common/Log";
import { g_widgets1 } from "../../global/GlobalVariables";
import { rendererWindowStatus } from "../../global/Widgets";
import { Root } from "../../helperWidgets/Root/Root";
import { DataViewer } from "../../widgets/DataViewer/DataViewer";
import { FileConverter } from "../../widgets/FileConverter/FileConverter";
import { LogViewer } from "../../widgets/LogViewer/LogViewer";
import { ProfilesViewer } from "../../widgets/ProfilesViewer/ProfilesViewer";
import { PvTable } from "../../widgets/PvTable/PvTable";
import { TdlViewer } from "../../widgets/TdlViewer/TdlViewer";
import { TextEditor } from "../../widgets/TextEditor/TextEditor";
import { DisplayWindowClient } from "./DisplayWindowClient";
import { Calculator } from "../../widgets/Calculator/Calculator";
import { ChannelGraph } from "../../widgets/ChannelGraph/ChannelGraph";
import { SeqGraph } from "../../widgets/SeqGraph/SeqGraph";
import { FileBrowser } from "../../widgets/FileBrowser/FileBrowser";
import { CaSnooper } from "../../widgets/CaSnooper/CaSnooper";
import { Talhk } from "../../widgets/Talhk/Talhk";
import { Casw } from "../../widgets/Casw/Casw";
import { PvMonitor } from "../../widgets/PvMonitor/PvMonitor";
import { Probe } from "../../widgets/Probe/Probe";
import { BaseWidget } from "../../widgets/BaseWidget/BaseWidget";
import { toBlob } from "dom-to-image-more";
import { convertEpochTimeToString, isDataUri, isRemotePath } from "../../../common/GlobalMethods";
import path from "path";

export class DisplayWindowFile {
    private readonly _displayWindowClient: DisplayWindowClient;

    constructor(displayWindowClient: DisplayWindowClient) {
        this._displayWindowClient = displayWindowClient;
    }

    /**
     * After the renderer window is created, the main process immediately sends the tdl file to
     * this window for rendering. Or, when the window reloads, the tdl is re-sent from main process. <br>
     *
     * (1) if it is a utility window which has a fixed format, append the utility widget to the tdl, the original tdl should be a blank Canvas <br>
     *
     * (2) create the Root object for this display window, g_widgets1 is also created with all widgets defined in the tdl <br>
     *
     * (3) render the page with Root._Element, with initialMode mode (g_widgets1._rendererWindowStatus's initial value)
     *     but the channels are not created yet <br>
     *
     * (4) set mode to the initialMode ("editing" | "operating"), the TCA channels do not need to be destroyed, they should have been
     *     take care of in previous step, i.e. in the load-tdl-file event sent from renderer process to main process.
     *     if necessary, the channels are created at this step <br>
     *
     * (5) set window title. If the "window name" is empty, switch to "file name"<br>
     *
     * (6) clean and update history
     */
    updateTdl = (
        newTdl: type_tdl,
        tdlFileName: string,
        initialModeStr: "editing" | "operating",
        editable: boolean,
        externalMacros: [string, string][],
        useExternalMacros: boolean,
        utilityType?: "Probe" | "PvTable" | "DataViewer" | "ProfilesViewer" | "LogViewer" | "TdlViewer" | "TextEditor" | "Terminal" | "Calculator" | "ChannelGraph" | "Help" | "CaSnooper" | "Casw" | "PvMonitor" | "FileConverter" | "Talhk" | "FileBrowser" | "SeqGraph" | undefined,
        utilityOptions?: Record<string, any>
    ) => {
        Log.info("new tdl ", newTdl, utilityType, editable)
        this.getDisplayWindowClient().setTdlFileName(tdlFileName);
        // (1)
        let initialMode: rendererWindowStatus.editing | rendererWindowStatus.operating = rendererWindowStatus.editing;
        if (initialModeStr === "editing") {
            initialMode = rendererWindowStatus.editing;
        } else {
            initialMode = rendererWindowStatus.operating;
        }

        if (
            utilityType === "Probe" ||
            utilityType === "PvTable" ||
            utilityType === "DataViewer" ||
            utilityType === "ProfilesViewer" ||
            utilityType === "LogViewer" ||
            utilityType === "TdlViewer" ||
            utilityType === "TextEditor" ||
            utilityType === "Calculator" ||
            utilityType === "Terminal" ||
            utilityType === "ChannelGraph" ||
            utilityType === "CaSnooper" ||
            utilityType === "Casw" ||
            utilityType === "PvMonitor" ||
            utilityType === "FileConverter" ||
            utilityType === "Help" ||
            utilityType === "FileBrowser" ||
            utilityType === "Talhk" ||
            utilityType === "SeqGraph"
        ) {
            if (utilityOptions !== undefined) {
                this._appendUtilityWidgetTdl(newTdl, utilityType, utilityOptions);
                initialMode = rendererWindowStatus.operating;
            }
        }
        // (2)
        const rootElement = new Root(newTdl, this.getDisplayWindowClient(), initialMode, editable, externalMacros, useExternalMacros);
        // (3)
        this.getDisplayWindowClient().getRoot().render(rootElement.getElement());
        // (4)
        g_widgets1.setMode(initialMode, true, false);
        // (5)
        this.getDisplayWindowClient().setWindowTitleType("window-name");
        this.getDisplayWindowClient().updateWindowTitle();
        const canvasTdl = newTdl["Canvas"];
        if (canvasTdl["windowName"].trim() === "") {
            this.getDisplayWindowClient().setWindowTitleType("file-name");
            this.getDisplayWindowClient().updateWindowTitle();
        }
        // (6)
        this.getDisplayWindowClient().getActionHistory().clearHistory();
        // the tdl is read from hard drive, the modified bit must be false (as the runtime TDL is the same as the saved TDL file)
        this.getDisplayWindowClient().getActionHistory().setModified(false);
        this.getDisplayWindowClient().getActionHistory().registerAction(true);
        Log.info("Data structure for new tdl created.")
    };

    undo = () => {
        if (!g_widgets1.isEditing()) {
            return;
        }
        const oldTdl = this.getDisplayWindowClient().getActionHistory().popTdl();
        if (oldTdl === undefined) {
            return;
        }
        const mode = rendererWindowStatus.editing;
        const editable = g_widgets1.getRoot().getEditable();
        const externalMacros = g_widgets1.getRoot().getExternalMacros();
        const useExternalMacros = g_widgets1.getRoot().getUseExternalMacros();
        const rootElement = new Root(oldTdl, this.getDisplayWindowClient(), mode, editable, externalMacros, useExternalMacros);
        this.getDisplayWindowClient().getRoot().render(rootElement.getElement());
        // the window is resized to fit the Canvas size
        g_widgets1.setMode(rendererWindowStatus.editing, true, false);
        // window title, anyway
        if (this.getDisplayWindowClient().getWindowTitleType() === "window-name") {
            this.getDisplayWindowClient().updateWindowTitle();
        }
    };

    redo = () => {
        if (!g_widgets1.isEditing()) {
            return;
        }
        const nextTdl = this.getDisplayWindowClient().getActionHistory().unpopTdl();
        if (nextTdl === undefined) {
            return;
        }
        const mode = rendererWindowStatus.editing;
        const editable = g_widgets1.getRoot().getEditable();
        const externalMacros = g_widgets1.getRoot().getExternalMacros();
        const useExternalMacros = g_widgets1.getRoot().getUseExternalMacros();
        const rootElement = new Root(nextTdl, this.getDisplayWindowClient(), mode, editable, externalMacros, useExternalMacros);
        this.getDisplayWindowClient().getRoot().render(rootElement.getElement());
        g_widgets1.setMode(rendererWindowStatus.editing, true, false);
        if (this.getDisplayWindowClient().getWindowTitleType() === "window-name") {
            this.getDisplayWindowClient().updateWindowTitle();
        }
    };

    /**
     * Append the utility widget to a tdl JSON object
     */
    private _appendUtilityWidgetTdl = (
        tdl: type_tdl,
        utilityType: "Probe" | "PvTable" | "DataViewer" | "ProfilesViewer" | "LogViewer" | "TdlViewer" | "TextEditor" | "Terminal" | "Calculator" | "ChannelGraph" | "Help" | "CaSnooper" | "Casw" | "PvMonitor" | "FileConverter" | "Talhk" | "FileBrowser" | "SeqGraph",
        utilityOptions: Record<string, any>
    ) => {
        if (utilityType === "Probe") {
            const widgetTdl = Probe.generateWidgetTdl(utilityOptions);
            const widgetKey = widgetTdl.widgetKey;
            const style = widgetTdl.style;
            style.boxSizing = "border-box";
            tdl[widgetKey] = widgetTdl;
            tdl["Canvas"].style.backgroundColor = "rgba(255, 255, 255, 1)";
        } else if (utilityType === "PvMonitor") {
            const widgetTdl = PvMonitor.generateWidgetTdl(utilityOptions);
            const widgetKey = widgetTdl.widgetKey;
            widgetTdl.style.width = "100%";
            widgetTdl.style.height = "100%";
            widgetTdl.style.boxSizing = "border-box";
            widgetTdl.style.padding = "20px";
            widgetTdl.style.paddingRight = "0px";
            widgetTdl.text.alarmBorder = false;
            widgetTdl.style.borderWidth = 0;
            tdl[widgetKey] = widgetTdl;
            tdl["Canvas"].style.backgroundColor = "rgba(255, 255, 255, 1)";
        } else if (utilityType === "PvTable") {
            //todo:
            // newTdl["PvTable"] = PvTable.generateWidgetTdl(utilityOptions);

            // todo: this window should not be editable, in editing mode, it is a mess
            const widgetTdl = PvTable.generateWidgetTdl(utilityOptions);
            const widgetKey = widgetTdl.widgetKey;
            widgetTdl.style.width = "100%";
            widgetTdl.style.height = "100%";
            widgetTdl.style.boxSizing = "border-box";
            widgetTdl.style.padding = 20;
            tdl[widgetKey] = widgetTdl;
            tdl["Canvas"].style.backgroundColor = "rgba(255, 255, 255, 1)";
        } else if (utilityType === "DataViewer") {
            // todo: this window should not be editable, in editing mode, it is a mess
            const widgetTdl = DataViewer.generateWidgetTdl(utilityOptions);
            const widgetKey = widgetTdl.widgetKey;
            widgetTdl.text.singleWidget = true;
            widgetTdl.style.width = window.innerWidth;
            widgetTdl.style.height = window.innerHeight;
            widgetTdl.style.boxSizing = "border-box";
            widgetTdl.style.borderWidth = 0;
            // widgetTdl.style.padding = 5;
            tdl[widgetKey] = widgetTdl;
            tdl["Canvas"].style.backgroundColor = "rgba(255, 255, 255, 1)";
        } else if (utilityType === "ProfilesViewer") {
            const widgetTdl = ProfilesViewer.generateWidgetTdl(utilityOptions);
            const widgetKey = widgetTdl.widgetKey;
            // widgetTdl.text.singleWidget = true;
            // widgetTdl.style.boxSizing = "border-box";
            // widgetTdl.style.padding = 5;


            // casw has a DataViewer
            const widgetTdl2 = DataViewer.generateDefaultTdl();
            const widgetKey2 = widgetTdl2.widgetKey;
            // will be lively updated upon window resize and view switch
            widgetTdl2.style.width = 666;
            widgetTdl2.style.height = 333;
            widgetTdl2.channelNames = ["loc://lastSecondCount=0"];
            widgetTdl2.text["title"] = "";

            // put Casw on top of XYPlot, so that the mouse click/down reaches Casw
            tdl[widgetKey] = widgetTdl;
            tdl[widgetKey2] = widgetTdl2;

            tdl["Canvas"].style.backgroundColor = "rgba(255, 255, 255, 1)";
        } else if (utilityType === "LogViewer") {
            const widgetTdl = LogViewer.generateWidgetTdl(utilityOptions);
            const widgetKey = widgetTdl.widgetKey;
            // widgetTdl.text.singleWidget = true;
            // widgetTdl.style.boxSizing = "border-box";
            // widgetTdl.style.padding = 5;
            widgetTdl.style.width = "100%";
            widgetTdl.style.height = "100%";
            widgetTdl.style.boxSizing = "border-box";
            widgetTdl.style.padding = "20px";
            widgetTdl.style.paddingRight = "0px";
            widgetTdl.text.alarmBorder = false;
            widgetTdl.style.borderWidth = 0;
            tdl[widgetKey] = widgetTdl;
            tdl["Canvas"].style.backgroundColor = "rgba(255, 255, 255, 1)";
        } else if (utilityType === "TdlViewer") {
            const widgetTdl = TdlViewer.generateWidgetTdl(utilityOptions);
            const widgetKey = widgetTdl.widgetKey;
            // widgetTdl.text.singleWidget = true;
            // widgetTdl.style.boxSizing = "border-box";
            // widgetTdl.style.padding = 5;
            tdl[widgetKey] = widgetTdl;
            tdl["Canvas"].style.backgroundColor = "rgba(255, 0, 255, 1)";
        } else if (utilityType === "TextEditor") {
            const widgetTdl = TextEditor.generateWidgetTdl(utilityOptions);
            const widgetKey = widgetTdl.widgetKey;
            widgetTdl.style.width = window.innerWidth;
            widgetTdl.style.height = window.innerHeight;
            // widgetTdl.text.singleWidget = true;
            // widgetTdl.style.boxSizing = "border-box";
            // widgetTdl.style.padding = 5;
            tdl[widgetKey] = widgetTdl;
            tdl["Canvas"].style.backgroundColor = "rgba(255, 0, 255, 1)";
        } else if (utilityType === "FileConverter") {
            const widgetTdl = FileConverter.generateWidgetTdl(utilityOptions);
            const widgetKey = widgetTdl.widgetKey;
            widgetTdl.style.width = "100%";
            widgetTdl.style.height = "100%";
            // widgetTdl.text.singleWidget = true;
            widgetTdl.style.boxSizing = "border-box";
            widgetTdl.style.padding = 20;
            tdl[widgetKey] = widgetTdl;
            tdl["Canvas"].style.backgroundColor = "rgba(255, 0, 255, 1)";
        } else if (utilityType === "Terminal") {
            // // default size is 100%
            // const widgetTdl = Terminal.generateWidgetTdl(utilityOptions);
            // const widgetKey = widgetTdl.widgetKey;
            // // widgetTdl.text.singleWidget = true;
            // // widgetTdl.style.boxSizing = "border-box";
            // // widgetTdl.style["top"] = 0;
            // tdl[widgetKey] = widgetTdl;
            // tdl["Canvas"].style.backgroundColor = "rgba(0, 0, 0, 1)";
        } else if (utilityType === "Calculator") {
            const widgetTdl = Calculator.generateWidgetTdl(utilityOptions);
            const widgetKey = widgetTdl.widgetKey;
            widgetTdl.style.width = window.innerWidth;
            widgetTdl.style.height = window.innerHeight;
            tdl[widgetKey] = widgetTdl;
            // tdl["Canvas"].style.backgroundColor = "rgba(0, 0, 0, 1)";
        } else if (utilityType === "ChannelGraph") {
            // default size is 100%
            const widgetTdl = ChannelGraph.generateWidgetTdl(utilityOptions);
            const widgetKey = widgetTdl.widgetKey;
            widgetTdl.style.width = window.innerWidth;
            widgetTdl.style.height = window.innerHeight;
            // widgetTdl.style.boxSizing = "border-box";
            // widgetTdl.style.padding = "20px";

            // widgetTdl.text.singleWidget = true;
            // widgetTdl.style.boxSizing = "border-box";
            // widgetTdl.style["top"] = 0;
            tdl[widgetKey] = widgetTdl;
            // tdl["Canvas"].style.backgroundColor = "rgba(0, 0, 0, 1)";
        } else if (utilityType === "SeqGraph") {
            // default size is 100%
            const widgetTdl = SeqGraph.generateWidgetTdl(utilityOptions);
            const widgetKey = widgetTdl.widgetKey;
            widgetTdl.style.width = "100%";
            widgetTdl.style.height = "100%";
            // widgetTdl.style.boxSizing = "border-box";
            // widgetTdl.style.padding = "20px";

            // widgetTdl.text.singleWidget = true;
            // widgetTdl.style.boxSizing = "border-box";
            // widgetTdl.style["top"] = 0;
            tdl[widgetKey] = widgetTdl;
            // tdl["Canvas"].style.backgroundColor = "rgba(0, 0, 0, 1)";
        } else if (utilityType === "FileBrowser") {
            // default size is 100%
            const widgetTdl = FileBrowser.generateWidgetTdl(utilityOptions);
            const widgetKey = widgetTdl.widgetKey;
            widgetTdl.style.width = "100%";
            widgetTdl.style.height = "100%";
            // widgetTdl.style.boxSizing = "border-box";
            // widgetTdl.style.padding = "20px";

            // widgetTdl.text.singleWidget = true;
            // widgetTdl.style.boxSizing = "border-box";
            // widgetTdl.style["top"] = 0;
            tdl[widgetKey] = widgetTdl;
            // tdl["Canvas"].style.backgroundColor = "rgba(0, 0, 0, 1)";
        } else if (utilityType === "CaSnooper") {
            // default size is 100%
            const widgetTdl = CaSnooper.generateWidgetTdl(utilityOptions);
            const widgetKey = widgetTdl.widgetKey;
            widgetTdl.style.width = "100%";
            widgetTdl.style.height = "100%";
            widgetTdl.style.boxSizing = "border-box";
            widgetTdl.style.padding = "20px";

            const widgetTdl2 = DataViewer.generateDefaultTdl();
            const widgetKey2 = widgetTdl2.widgetKey;
            // will be lively updated upon window resize and view switch
            widgetTdl2.style.width = 666;
            widgetTdl2.style.height = 333;
            widgetTdl2.channelNames = ["loc://lastSecondCount=0"];
            widgetTdl2.text["title"] = "# of packets / s";

            tdl[widgetKey] = widgetTdl;
            tdl[widgetKey2] = widgetTdl2;
        } else if (utilityType === "Talhk") {
            // default size is 100%
            const widgetTdl = Talhk.generateWidgetTdl(utilityOptions); // set server address from utilityOptions
            widgetTdl.style.width = "100%";
            widgetTdl.style.height = "100%";
            widgetTdl.style.boxSizing = "border-box";
            tdl["Canvas"].style.backgroundColor = "rgba(255, 255, 255, 1)";

            // widgetTdl.style.padding = "20px";
            const widgetKey = widgetTdl.widgetKey;
            tdl[widgetKey] = widgetTdl;
        } else if (utilityType === "Casw") {
            // default size is 100%
            const widgetTdl = Casw.generateWidgetTdl(utilityOptions);
            const widgetKey = widgetTdl.widgetKey;
            widgetTdl.style.width = "100%";
            widgetTdl.style.height = "100%";
            widgetTdl.style.boxSizing = "border-box";
            widgetTdl.style.padding = "20px";

            // casw has a DataViewer
            const widgetTdl2 = DataViewer.generateDefaultTdl();
            const widgetKey2 = widgetTdl2.widgetKey;
            // will be lively updated upon window resize and view switch
            widgetTdl2.style.width = 666;
            widgetTdl2.style.height = 333;
            widgetTdl2.channelNames = ["loc://lastSecondCount=0"];
            widgetTdl2.text["title"] = "# of packets / second";

            // put Casw on top of XYPlot, so that the mouse click/down reaches Casw
            tdl[widgetKey] = widgetTdl;
            tdl[widgetKey2] = widgetTdl2;
        }
    };

    /**
     * Generate JSON object for this display window. <br>
     * 2 special widgets, GroupSelection2 and MouseSelectionRegion, are not included. <br>
     *
     * @returns {Record<string, any>} JSON object that represent this display.
     * @throws {Error<string>} when there is an error
     */
    generateTdl = (): Record<string, any> => {
        let result: Record<string, any> = {};
        try {
            const specialWidgetKeys = ["GroupSelection2", "MouseSelectionRegion"];
            for (let [widgetKey, widget] of g_widgets1.getWidgets2()) {
                if (!specialWidgetKeys.includes(widgetKey)) {
                    if ((widget instanceof BaseWidget) && widget.getEmbeddedDisplayWidgetKey() !== "") {
                        // only if it is not a child of an EmbeddedDisplay
                        continue;
                    }
                    result[widgetKey] = widget.getTdlCopy(false);
                }
            }
        } catch (e) {
            Log.error(e);
            const errMsg = "Failed to generate tdl JSON object for this display.";
            throw new Error(errMsg);
        }
        return result;
    };

    showTdlFileContents = () => {
        const tdl = this.generateTdl();
        const externalMacros = g_widgets1.getRoot().getExternalMacros();
        const tdlFileName = this.getDisplayWindowClient().getTdlFileName();
        this.getDisplayWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window",
            {
                utilityType: "TdlViewer",
                utilityOptions: {
                    tdl: tdl,
                    externalMacros: externalMacros,
                    tdlFileName: tdlFileName,
                },
                windowId: this.getDisplayWindowClient().getWindowId(),
            }
        );
    };

    /**
     * Save tdl file at the current display window state. <br>
     *
     * @param {string} tdlFileName The file name that will be saved.
     *                             An empty file name "" means it is saved as. In this case, a prompt will pop up.
     */
    saveTdl = async (tdlFileName0: string) => {
        let tdlFileName: string | undefined = tdlFileName0;
        if (this.getDisplayWindowClient().getMainProcessMode() === "web") {
            if (tdlFileName === "") {
                // user input file name
                const prompt = this.getDisplayWindowClient().getPrompt();
                tdlFileName = await prompt.showInputBox({
                    title: "",
                    text: "Input full path for the file",
                    defaultContent: "",
                });
                // canceled
                if (tdlFileName === undefined) {
                    return;
                }
            }
        }
        this.getDisplayWindowClient().getIpcManager().sendFromRendererProcess("save-tdl-file",
            {
                windowId: this.getDisplayWindowClient().getWindowId(),
                tdl: this.generateTdl() as type_tdl,
                tdlFileName1: tdlFileName
            }
        );
    };

    /**
     * Download the current display window state as a TDL file in web mode. <br>
     *
     * @param {string} tdlFileName The suggested file name for the downloaded TDL file.
     */
    downloadTdl = (tdlFileName: string) => {
        if (this.getDisplayWindowClient().getMainProcessMode() === "web") {
            // save tdl to local computer
            const tdl = this.generateTdl();
            const blob = new Blob([JSON.stringify(tdl, null, 4)], { type: 'text/json' });
            this.downloadData(blob, tdlFileName);
            return;
        } else {
            Log.error("Download TDL is only available in web mode");
        }
    }

    downloadData = async (blob: Blob, suggestedName: string, description: string = "", applicationKey: string = "application/json", applicationValue: string[] = [".tdl", ".json"]) => {
        if (this.getDisplayWindowClient().getMainProcessMode() !== "web") {
            return;
        }
        try {
            const accept: Record<string, any> = {};
            accept[applicationKey] = applicationValue;

            // showSaveFilePicker is not recognized by window object
            if ((window as any).showSaveFilePicker !== undefined) {
                const fileHandle = await (window as any).showSaveFilePicker({
                    suggestedName: suggestedName, // Default file name
                    types: [
                        {
                            description: description,
                            accept: accept,
                        },
                    ],
                });
                const writable = await fileHandle.createWritable();
                await writable.write(blob);
                await writable.close();
            } else {
                // safari, firefox, or opera does not support the showSaveFilePicker API
                Log.debug("there is no showSaveFilePicker API, directly download the tdl file");
                const downloadLink = document.createElement('a');
                downloadLink.href = URL.createObjectURL(blob);
                downloadLink.download = 'Untitled.tdl';
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                this.getDisplayWindowClient().getIpcManager().handleDialogShowMessageBox(undefined,
                    {
                        info: {
                            messageType: "info",
                            humanReadableMessages: ["You have successfully downloaded the data or file.",
                                "However, this web browser does not support naming this file.",
                                `According to the context, you may want to rename the file to ${suggestedName}.`,
                                "Using Chromium-based web browser can help to solve this issue."
                            ],
                            rawMessages: [],
                        }
                    }
                )
            }
        } catch (e) {
            // "AbortError" is not an error, we just canceled it
            if (`${e}`.includes("AbortError")) {
                return;
            }
            Log.error("Error on saving data file", e);
            this.getDisplayWindowClient().getIpcManager().handleDialogShowMessageBox(undefined,
                {
                    info: {
                        messageType: "error",
                        humanReadableMessages: ["Failed to save data or file."],
                        rawMessages: [`${e}`],
                    }
                }
            )
        }

    }

    downloadScreenshot = async () => {
        if (this.getDisplayWindowClient().getMainProcessMode() !== "web") {
            return;
        }
        try {
            const blob = await toBlob(document.body);
            if (blob !== null) {
                const dateNowStr = convertEpochTimeToString(Date.now());
                const suggestedName = `TDM-screenshot-${dateNowStr}.png`;
                const description = 'Screenshot Image';
                const applicationKey = "application/image";
                const applicationValue = [".png"];
                this.downloadData(blob, suggestedName, description, applicationKey, applicationValue);
            }
        } catch (err) {
            Log.error('Error capturing screenshot:', err);
        }
    }

    /**
     * In web mode, open a local file in web browser. 
     * 
     * @param fileBlob Optional local file blob.
     *                 If provided, read this blob directly instead of opening the browser's
     *                 file picker. This is used by drag-and-drop in web mode.
     */
    openLocalTdlFileInWebMode = async (fileBlob: Blob | undefined = undefined) => {
        if (this.getDisplayWindowClient().getMainProcessMode() !== "web") {
            return;
        }

        if (fileBlob === undefined) {
            fileBlob = await this.readLocalTdlFile();
        }
        if (fileBlob === undefined) {
            return;
        }

        Log.debug("Open TDL file", fileBlob);
        const reader = new FileReader();
        reader.onload = (event: any) => {
            const tdlStr = event.target.result;
            const tdl = JSON.parse(tdlStr);
            this.getDisplayWindowClient().getIpcManager().sendFromRendererProcess("open-tdl-file", {
                options: {
                    tdl: tdl,
                    // tdl file name is empty, otherwise it will be a file on server
                    tdlFileNames: [""],
                    mode: g_widgets1.isEditing() ? "editing" : "operating",
                    editable: true,
                    macros: [],
                    replaceMacros: true,
                    currentTdlFolder: undefined,
                    windowId: this.getDisplayWindowClient().getWindowId(),
                }
            });
        };
        reader.readAsText(fileBlob);
    }

    /**
     * Open file on server in web mode
     * 
     * @param fileName TDL file path on the server.
     *                 If `undefined`, prompt the user to type a server-side file path.
     *                 The path must be absolute
     */
    openServerTdlFileInWebMode = async (fileName?: string) => {
        if (this.getDisplayWindowClient().getMainProcessMode() !== "web") {
            return;
        }

        // user needs to input a name
        if (fileName === undefined) {

            const ipcManager = this.getDisplayWindowClient().getIpcManager();

            const prompt = this.getDisplayWindowClient().getPrompt();
            const result = await prompt.showInputBox({
                title: "",
                text: "Input file name on server",
                defaultContent: "",
            });
            if (result === undefined) {
                // user canceled
                return;
            } else {
                fileName = result;
            }
        }

        this.getDisplayWindowClient().getIpcManager().sendFromRendererProcess("open-tdl-file", {
            options: {
                tdlFileNames: [fileName],
                mode: g_widgets1.isEditing() ? "editing" : "operating",
                editable: true,
                // external macros: user-provided and parent display macros
                macros: [],
                replaceMacros: true,
                // currentTdlFolder: currentTdlFolder,
                windowId: this.getDisplayWindowClient().getWindowId(),
            }
        })

    }

    readLocalTdlFile = async () => {
        try {
            const [handle] = await (window as any).showOpenFilePicker({
                multiple: false,
                types: [
                    {
                        description: "TDM files",
                        accept: {
                            "application/json": [".tdl", ".json"],
                            "text/plain": [".txt"],
                        },
                    },
                ],
            });

            const file = await handle.getFile();
            // const fileContentStr = await file.text();
            // const fileContent = JSON.parse(fileContentStr);
            // const fileName = await file.name;
            return file;
        } catch (e) {
            // user cancelled => AbortError
            return undefined;
        }
    }


    /**
     * Open a text file inside 
     */
    openTextFileInTextEditorInWebMode = (widget: TextEditor, fileName: string | undefined = undefined, fileBlob: Blob | undefined = undefined) => {
        if (fileName === undefined) {
            // manually open a local file
            const inputElement = document.createElement("input");
            inputElement.type = "file";
            inputElement.style.display = "none";
            inputElement.addEventListener("change", (event: any) => {
                const fileName = event.target.files[0];
                Log.debug("TextEditor reads file", fileName);
                const reader = new FileReader();
                reader.onload = (event: any) => {
                    const fileContents = event.target.result;
                    widget.updateFileContents({
                        fileName: fileName,
                        fileContent: fileContents,
                        readable: true,
                        writable: true,
                    })
                };
                reader.readAsText(fileName);
                event.target.remove();
            })
            document.body.appendChild(inputElement);
            inputElement.click();
        } else if (fileName !== undefined && fileBlob !== undefined) {
            // drag-and-drop a file to the browser window
            Log.debug("TextEditor reads file", fileName, fileBlob);
            const reader = new FileReader();
            reader.onload = (event: any) => {
                const fileContents = event.target.result;
                widget.updateFileContents({
                    fileName: fileName,
                    fileContent: fileContents,
                    readable: true,
                    writable: true,
                })
            };
            reader.readAsText(fileBlob);
        }
    }

    /**
     * Pop up file selector.
     */
    manualOpenTdl = (status: rendererWindowStatus) => {
        const statusStr = rendererWindowStatus[status];
        // this.getDisplayWindowClient().getIpcManager().sendFromRendererProcess("open-tdl-file", undefined, statusStr, false, [], false);
        // this.getDisplayWindowClient().getIpcManager().sendFromRendererProcess("open-tdl-file", {
        //     // tdlFileNames?: string[];
        //     mode: statusStr,
        //     editable: false,
        //     macros: [],
        //     replaceMacros: false,
        //     // currentTdlFolder?: string;
        // });

        this.getDisplayWindowClient().getIpcManager().sendFromRendererProcess("open-tdl-file",
            {
                options: {
                    // tdlFileNames?: string[];
                    mode: statusStr as "operating" | "editing", // seems like it is disgarded
                    editable: false, // seems like it is disgarded
                    macros: [],
                    replaceMacros: false,
                    // currentTdlFolder?: string;
                    windowId: this.getDisplayWindowClient().getWindowId(),
                }
            });

    };

    /**
     * Resolve a path name for, mostly images
     * 
     * a path may be 
     *  - a relative path
     *  - an absolute path
     *  - a http/https path
     *  - a data uri, data:xxx
     */
    resolvePath = (pathName: string): string => {

        if (isDataUri(pathName)) {
            return pathName;
        } else if (isRemotePath(pathName)) {
            return pathName;
        } else if (path.isAbsolute(pathName)) {
            return pathName;
        } else {
            // relative path name
            const mainProcessMode = this.getDisplayWindowClient().getMainProcessMode();
            if (mainProcessMode === "desktop") {
                // w.r.t. the tdl file
                const tdlFileFullName = this.getDisplayWindowClient().getTdlFileName();
                if (path.isAbsolute(tdlFileFullName)) {
                    // if tdl file is located on hard drive
                    const tdlDirName = tdlFileFullName
                    return path.join(tdlDirName, pathName);
                } else {
                    // good luck
                    return pathName;
                }
            } else {
                return pathName;
            }
        }
    }

    getDisplayWindowClient = () => {
        return this._displayWindowClient;
    };
}
