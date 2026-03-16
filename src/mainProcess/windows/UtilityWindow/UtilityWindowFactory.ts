import * as fs from "fs";
import * as os from "os";
import path from "path";
import { Log } from "../../../common/Log";
import { type_Canvas_tdl, type_tdl } from "../../../common/GlobalVariables";
import { WindowAgentsManager } from "../WindowAgentsManager";
import type { type_options_createDisplayWindow } from "../WindowAgentsManager";
import { type_utilityWindowType } from "../../../common/types/type_widget_tdl";

// stores static methods for creating utility windows
// does not have BrowserWindow, should not be compared to "class MainWindow" or "class DisplayWindow"
export class UtilityWindowFactory {
    private readonly _windowAgentsManager: WindowAgentsManager;
    constructor(windowAgentsManager: WindowAgentsManager) {
        this._windowAgentsManager = windowAgentsManager;
    }

    // -------------------- utility options builders ----------------------

    private buildProfilesUtilityOptions = (): Record<string, any> => {
        const mainProcess = this.getMainProcess();
        return {
            profiles: mainProcess.getProfiles().serialize(),
            profilesFileName: mainProcess.getProfiles().getFilePath(),
        };
    };

    private buildEpicsCaEnvUtilityOptions = (): Record<string, any> => {
        const context = this.getMainProcess().getChannelAgentsManager().getContext();
        if (context === undefined) {
            return {};
        }
        const envInstance = context.getEnvInstance();
        if (envInstance === undefined) {
            return {};
        }
        return {
            "Values used in TDM runtime": envInstance.getEnv(),
            "TDM uses": envInstance.getEnvSource(),
            "User defined": envInstance.getEnvUser(),
            "Operating system defined": envInstance.getEnvOs(),
            "EPICS default": envInstance.getEnvDefault(),
        };
    };

    private buildProfilesViewerUtilityOptions = (): Record<string, any> => {
        const mainProcess = this.getMainProcess();
        const utilityOptions = this.buildProfilesUtilityOptions();
        utilityOptions["epics-ca-env"] = this.buildEpicsCaEnvUtilityOptions();
        utilityOptions["selected-profile-name"] = { "Selected profile": mainProcess.getProfiles().getSelectedProfileName() };
        utilityOptions["log-file-name"] = mainProcess.getLogFileName();
        utilityOptions["log-file-name-in-profiles"] = mainProcess.getProfiles().getLogFile();
        return utilityOptions;
    };

    private buildTdlViewerUtilityOptions = (utilityOptions: Record<string, any>): Record<string, any> => {
        const nextUtilityOptions = { ...utilityOptions };
        const tdl = nextUtilityOptions["tdl"];
        let scriptFullFileName = "";
        let scriptFileContents = "";

        if (tdl !== undefined) {
            const canvasTdl = tdl["Canvas"];
            if (canvasTdl !== undefined) {
                const scriptFileName = canvasTdl["script"];
                if (typeof scriptFileName === "string" && scriptFileName.trim() !== "") {
                    if (scriptFileName.trim().endsWith(".py") || scriptFileName.trim().endsWith(".js")) {
                        if (path.isAbsolute(scriptFileName)) {
                            scriptFullFileName = scriptFileName;
                        } else {
                            scriptFullFileName = path.join(nextUtilityOptions["tdlFileName"], scriptFileName);
                        }
                        try {
                            scriptFileContents = fs.readFileSync(scriptFullFileName, "utf-8");
                        } catch (e) {
                            Log.error("Cannot read script file", scriptFullFileName, e);
                        }
                    } else {
                        scriptFullFileName = scriptFileName;
                        scriptFileContents = "TDM can only run Python or JavaScript script.";
                    }
                }
            }
        }

        nextUtilityOptions["scriptFullFileName"] = scriptFullFileName;
        nextUtilityOptions["scriptFileContents"] = scriptFileContents;
        return nextUtilityOptions;
    };

    private buildCaSnooperUtilityOptions = (): Record<string, any> => {
        const utilityOptions = this.buildProfilesUtilityOptions();
        utilityOptions["EPICS_CA_SERVER_PORT"] = this.getEpicsPort("EPICS_CA_SERVER_PORT");
        return utilityOptions;
    };

    private buildCaswUtilityOptions = (): Record<string, any> => {
        const utilityOptions = this.buildProfilesUtilityOptions();
        utilityOptions["EPICS_CA_REPEATER_PORT"] = this.getEpicsPort("EPICS_CA_REPEATER_PORT");
        return utilityOptions;
    };

    private buildFileBrowserUtilityOptions = (utilityOptions: Record<string, any>): Record<string, any> => {
        if (utilityOptions["path"] !== "$HOME") {
            return utilityOptions;
        }
        return {
            ...utilityOptions,
            path: os.homedir(),
        };
    };

    private buildUtilityOptions = (
        utilityType: type_utilityWindowType,
        utilityOptions: Record<string, any>,
    ): Record<string, any> => {
        let nextUtilityOptions = utilityOptions;

        if (utilityType === "ProfilesViewer") {
            nextUtilityOptions = this.buildProfilesViewerUtilityOptions();
        } else if (utilityType === "TdlViewer") {
            nextUtilityOptions = this.buildTdlViewerUtilityOptions(utilityOptions);
        } else if (utilityType === "CaSnooper") {
            nextUtilityOptions = this.buildCaSnooperUtilityOptions();
        } else if (utilityType === "Casw") {
            nextUtilityOptions = this.buildCaswUtilityOptions();
        } else if (utilityType === "FileBrowser") {
            nextUtilityOptions = this.buildFileBrowserUtilityOptions(utilityOptions);
        }

        return nextUtilityOptions;
    };

    private buildCreateDisplayWindowOptions = (
        utilityType: type_utilityWindowType,
        utilityOptions: Record<string, any>,
        windowId: string,
    ): type_options_createDisplayWindow => {
        const tdl = UtilityWindowFactory.creatUtilityBlankTdl(utilityType) as type_tdl;
        return {
            tdl: tdl,
            mode: "operating" as "editing" | "operating",
            editable: this.isEditableUtilityWindow(utilityType),
            tdlFileName: "",
            macros: [],
            replaceMacros: false,
            hide: false,
            utilityType: utilityType,
            utilityOptions: utilityOptions,
            windowId: windowId,
        };
    };

    createUtilityDisplayWindow = async (
        utilityType: type_utilityWindowType,
        utilityOptions: Record<string, any>,
        windowId: string,
    ) => {
        const windowAgentsManager = this.getWindowAgentsManager();

        try {
            const resolvedUtilityOptions = this.buildUtilityOptions(utilityType, utilityOptions);
            const windowOptions = this.buildCreateDisplayWindowOptions(utilityType, resolvedUtilityOptions, windowId);
            const displayWindowAgent = await windowAgentsManager.createDisplayWindow(windowOptions);

            if (displayWindowAgent === undefined) {
                Log.error(`Cannot create display window for utility ${utilityType}`);
                return;
            }
        } catch (e) {
            Log.error(e);
        }
    };

    // ---------------------- blank TDL builders --------------------

    private static buildCanvasStyle = (
        width: number,
        height: number,
        backgroundColor: string = `rgba(232,232,232,1)`,
        extraStyle: Record<string, any> = {},
    ) => {
        return {
            position: "absolute",
            display: "inline-block",
            backgroundColor: backgroundColor,
            margin: 0,
            border: 0,
            padding: 0,
            left: 0,
            top: 0,
            height: height,
            width: width,
            overflow: "hidden",
            ...extraStyle,
        };
    };

    private static buildCanvasTdl = (
        windowName: string,
        width: number,
        height: number,
        backgroundColor: string = `rgba(232,232,232,1)`,
        extraStyle: Record<string, any> = {},
    ) => {
        return {
            Canvas: {
                type: "Canvas",
                widgetKey: "Canvas",
                key: "Canvas",
                style: UtilityWindowFactory.buildCanvasStyle(width, height, backgroundColor, extraStyle),
                macros: [],
                replaceMacros: false,
                windowName: windowName,
                script: "",
                xGridSize: 1,
                yGridSize: 1,
                gridColor: "rgba(128,128,128,1)",
                showGrid: true,
                isUtilityWindow: true,
            } as type_Canvas_tdl,
        };
    };

    private static buildProbeBlankTdl = () => {
        return UtilityWindowFactory.buildCanvasTdl("TDM Probe", 500, 500);
    };

    private static buildPvTableBlankTdl = () => {
        return UtilityWindowFactory.buildCanvasTdl("TDM PV Table", 1024, 700);
    };

    private static buildDataViewerBlankTdl = () => {
        return UtilityWindowFactory.buildCanvasTdl("TDM Data Viewer", 800, 500);
    };

    private static buildProfilesViewerBlankTdl = () => {
        return UtilityWindowFactory.buildCanvasTdl("TDM Profiles Viewer", 800, 500);
    };

    private static buildLogViewerBlankTdl = () => {
        return UtilityWindowFactory.buildCanvasTdl("TDM Log Viewer", 800, 500);
    };

    private static buildTerminalBlankTdl = () => {
        return UtilityWindowFactory.buildCanvasTdl("TDM Terminal", 800, 500, `rgba(0, 0, 0,1)`);
    };

    private static buildChannelGraphBlankTdl = () => {
        return UtilityWindowFactory.buildCanvasTdl("TDM Channel Graph", 800, 500);
    };

    private static buildSeqGraphBlankTdl = () => {
        return UtilityWindowFactory.buildCanvasTdl("TDM Seq Graph", 800, 500);
    };

    private static buildCalculatorBlankTdl = () => {
        return UtilityWindowFactory.buildCanvasTdl("TDM Calculator", 500, 500, `rgba(255, 255, 255, 1)`);
    };

    private static buildTdlViewerBlankTdl = () => {
        return UtilityWindowFactory.buildCanvasTdl("TDM TDL Viewer", 800, 500, `rgba(232,232,232,1)`, {
            boxSizing: "border-box",
        });
    };

    private static buildTextEditorBlankTdl = () => {
        return UtilityWindowFactory.buildCanvasTdl("TDM Text Editor", 800, 500, `rgba(232,232,232,1)`, {
            boxSizing: "border-box",
        });
    };

    private static buildHelpBlankTdl = () => {
        return UtilityWindowFactory.buildCanvasTdl("TDM Help", 1200, 1000);
    };

    private static buildCaSnooperBlankTdl = () => {
        return UtilityWindowFactory.buildCanvasTdl("TDM CA Snooper", 1050, 800);
    };

    private static buildCaswBlankTdl = () => {
        return UtilityWindowFactory.buildCanvasTdl("TDM CA Snooper", 1050, 800);
    };

    private static buildFileConverterBlankTdl = () => {
        return UtilityWindowFactory.buildCanvasTdl("TDM File Converter", 1050, 800);
    };

    private static buildPvMonitorBlankTdl = () => {
        return UtilityWindowFactory.buildCanvasTdl("TDM PV Monitor", 1050, 800);
    };

    private static buildFileBrowserBlankTdl = () => {
        return UtilityWindowFactory.buildCanvasTdl("TDM File Browser", 1050, 800);
    };

    private static buildTalhkBlankTdl = () => {
        return UtilityWindowFactory.buildCanvasTdl("T Alarm Handler Kit", 1050, 800);
    };

    static creatUtilityBlankTdl = (
        utilityType: type_utilityWindowType
    ) => {
        const builders: Record<type_utilityWindowType, () => Record<string, type_Canvas_tdl>> = {
            Probe: UtilityWindowFactory.buildProbeBlankTdl,
            PvTable: UtilityWindowFactory.buildPvTableBlankTdl,
            DataViewer: UtilityWindowFactory.buildDataViewerBlankTdl,
            ProfilesViewer: UtilityWindowFactory.buildProfilesViewerBlankTdl,
            LogViewer: UtilityWindowFactory.buildLogViewerBlankTdl,
            TdlViewer: UtilityWindowFactory.buildTdlViewerBlankTdl,
            TextEditor: UtilityWindowFactory.buildTextEditorBlankTdl,
            Terminal: UtilityWindowFactory.buildTerminalBlankTdl,
            Calculator: UtilityWindowFactory.buildCalculatorBlankTdl,
            ChannelGraph: UtilityWindowFactory.buildChannelGraphBlankTdl,
            CaSnooper: UtilityWindowFactory.buildCaSnooperBlankTdl,
            Casw: UtilityWindowFactory.buildCaswBlankTdl,
            PvMonitor: UtilityWindowFactory.buildPvMonitorBlankTdl,
            Help: UtilityWindowFactory.buildHelpBlankTdl,
            FileConverter: UtilityWindowFactory.buildFileConverterBlankTdl,
            Talhk: UtilityWindowFactory.buildTalhkBlankTdl,
            FileBrowser: UtilityWindowFactory.buildFileBrowserBlankTdl,
            SeqGraph: UtilityWindowFactory.buildSeqGraphBlankTdl,
        };

        const builder = builders[utilityType];
        return builder === undefined ? {} : builder();
    };

    // -------------------- helpers ----------------------

    private getEpicsPort = (envName: "EPICS_CA_SERVER_PORT" | "EPICS_CA_REPEATER_PORT"): number => {
        const context = this.getMainProcess().getChannelAgentsManager().getContext();
        if (context === undefined) {
            return -1;
        }

        const envInstance = context.getEnvInstance();
        if (envInstance === undefined) {
            return -1;
        }

        const env = envInstance.getEnv();
        if (typeof env === "number" || typeof env === "string" || Array.isArray(env) || env === undefined) {
            return -1;
        }

        const port = env[envName];
        return typeof port === "number" ? port : -1;
    };
    private isEditableUtilityWindow = (utilityType: type_utilityWindowType): boolean => {
        return utilityType === "DataViewer"
            || utilityType === "Probe"
            || utilityType === "ChannelGraph"
            || utilityType === "PvTable"
            || utilityType === "PvMonitor"
            || utilityType === "SeqGraph";
    };


    // --------------------- getters ---------------------

    getWindowAgentsManager = () => {
        return this._windowAgentsManager;
    };

    private getMainProcess = () => {
        return this.getWindowAgentsManager().getMainProcess();
    };

}
