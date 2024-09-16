import { type_Canvas_tdl } from "../../../rendererProcess/helperWidgets/Canvas/Canvas";

// stores static methods for creating utility windows
// does not have BrowserWindow, should not be compared to "class MainWindow" or "class DisplayWindow"
export class UtilityWindow {
    static creatUtilityBlankTdl = (
        utilityType: "Probe" | "PvTable" | "DataViewer" | "ProfilesViewer" | "LogViewer" | "TdlViewer" | "TextEditor" | "Terminal" | "Calculator" | "ChannelGraph" | "CaSnooper" | "Casw" | "Help" | "PvMonitor" | "FileConverter"
    ) => {
        if (utilityType === "Probe") {
            return {
                Canvas: {
                    type: "Canvas",
                    widgetKey: "Canvas",
                    key: "Canvas",
                    style: {
                        position: "absolute",
                        display: "inline-block",
                        backgroundColor: `rgba(232,232,232,1)`,
                        // all 0
                        margin: 0,
                        border: 0,
                        padding: 0,
                        left: 0,
                        top: 0,
                        height: 500,
                        width: 500,
                        overflow: "hidden",
                    },
                    macros: [],
                    replaceMacros: false,
                    // used as identifier of the widgetTdl
                    windowName: "TDM Probe",
                    script: "",
                    xGridSize: 1,
                    yGridSize: 1,
                    gridColor: "rgba(128,128,128,1)",
                    showGrid: true,
                } as type_Canvas_tdl,
            };
        } else if (utilityType === "PvTable") {
            return {
                Canvas: {
                    type: "Canvas",
                    widgetKey: "Canvas",
                    key: "Canvas",
                    style: {
                        position: "absolute",
                        display: "inline-block",
                        backgroundColor: `rgba(232,232,232,1)`,
                        // all 0
                        margin: 0,
                        border: 0,
                        padding: 0,
                        left: 0,
                        top: 0,
                        height: 900,
                        width: 900,
                        overflow: "hidden",
                    },
                    macros: [],
                    replaceMacros: false,
                    // used as identifier of the widgetTdl
                    windowName: "TDM PV Table",
                    script: "",
                    xGridSize: 1,
                    yGridSize: 1,
                    gridColor: "rgba(128,128,128,1)",
                    showGrid: true,
                } as type_Canvas_tdl,
            };
        } else if (utilityType === "DataViewer") {
            return {
                Canvas: {
                    type: "Canvas",
                    widgetKey: "Canvas",
                    key: "Canvas",
                    style: {
                        position: "absolute",
                        display: "inline-block",
                        backgroundColor: `rgba(232,232,232,1)`,
                        // all 0
                        margin: 0,
                        border: 0,
                        padding: 0,
                        left: 0,
                        top: 0,
                        height: 500,
                        width: 800,
                        overflow: "hidden",
                    },
                    macros: [],
                    replaceMacros: false,
                    // used as identifier of the widgetTdl
                    windowName: "TDM Data Viewer",
                    script: "",
                    xGridSize: 1,
                    yGridSize: 1,
                    gridColor: "rgba(128,128,128,1)",
                    showGrid: true,
                } as type_Canvas_tdl,
            };
        } else if (utilityType === "ProfilesViewer") {
            return {
                Canvas: {
                    type: "Canvas",
                    widgetKey: "Canvas",
                    key: "Canvas",
                    style: {
                        position: "absolute",
                        display: "inline-block",
                        backgroundColor: `rgba(232,232,232,1)`,
                        // all 0
                        margin: 0,
                        border: 0,
                        padding: 0,
                        left: 0,
                        top: 0,
                        height: 500,
                        width: 800,
                        // height: "100%",
                        // width: "100%",
                        overflow: "hidden",
                    },
                    macros: [],
                    replaceMacros: false,
                    // used as identifier of the widgetTdl
                    windowName: "TDM Profiles Viewer",
                    script: "",
                    xGridSize: 1,
                    yGridSize: 1,
                    gridColor: "rgba(128,128,128,1)",
                    showGrid: true,
                } as type_Canvas_tdl,
            };
        } else if (utilityType === "LogViewer") {
            return {
                Canvas: {
                    type: "Canvas",
                    widgetKey: "Canvas",
                    key: "Canvas",
                    style: {
                        position: "absolute",
                        display: "inline-block",
                        backgroundColor: `rgba(232,232,232,1)`,
                        // all 0
                        margin: 0,
                        border: 0,
                        padding: 0,
                        left: 0,
                        top: 0,
                        height: 500,
                        width: 800,
                        // height: "100%",
                        // width: "100%",
                        overflow: "hidden",
                    },
                    macros: [],
                    replaceMacros: false,
                    // used as identifier of the widgetTdl
                    windowName: "TDM Log Viewer",
                    script: "",
                    xGridSize: 1,
                    yGridSize: 1,
                    gridColor: "rgba(128,128,128,1)",
                    showGrid: true,
                } as type_Canvas_tdl,
            };
        } else if (utilityType === "Terminal") {
            return {
                Canvas: {
                    type: "Canvas",
                    widgetKey: "Canvas",
                    key: "Canvas",
                    style: {
                        position: "absolute",
                        display: "inline-block",
                        backgroundColor: `rgba(0, 0, 0,1)`,
                        // all 0
                        margin: 0,
                        border: 0,
                        padding: 0,
                        left: 0,
                        top: 0,
                        height: 500,
                        width: 800,
                        // height: "100%",
                        // width: "100%",
                        overflow: "hidden",
                    },
                    macros: [],
                    replaceMacros: false,
                    // used as identifier of the widgetTdl
                    windowName: "TDM Terminal",
                    script: "",
                    xGridSize: 1,
                    yGridSize: 1,
                    gridColor: "rgba(128,128,128,1)",
                    showGrid: true,
                } as type_Canvas_tdl,
            };
        } else if (utilityType === "ChannelGraph") {
            return {
                Canvas: {
                    type: "Canvas",
                    widgetKey: "Canvas",
                    key: "Canvas",
                    style: {
                        position: "absolute",
                        display: "inline-block",
                        backgroundColor: `rgba(255, 255, 255,1)`,
                        // all 0
                        margin: 0,
                        border: 0,
                        padding: 0,
                        left: 0,
                        top: 0,
                        height: 500,
                        width: 800,
                        // height: "100%",
                        // width: "100%",
                        overflow: "hidden",
                    },
                    macros: [],
                    replaceMacros: false,
                    // used as identifier of the widgetTdl
                    windowName: "TDM Channel Graph",
                    script: "",
                    xGridSize: 1,
                    yGridSize: 1,
                    gridColor: "rgba(128,128,128,1)",
                    showGrid: true,
                } as type_Canvas_tdl,
            };
        } else if (utilityType === "Calculator") {
            return {
                Canvas: {
                    type: "Canvas",
                    widgetKey: "Canvas",
                    key: "Canvas",
                    style: {
                        position: "absolute",
                        display: "inline-block",
                        backgroundColor: `rgba(255, 255, 255, 1)`,
                        // all 0
                        margin: 0,
                        border: 0,
                        padding: 0,
                        left: 0,
                        top: 0,
                        height: 500,
                        width: 500,
                        // height: "100%",
                        // width: "100%",
                        overflow: "hidden",
                    },
                    macros: [],
                    replaceMacros: false,
                    // used as identifier of the widgetTdl
                    windowName: "TDM Calculator",
                    script: "",
                    xGridSize: 1,
                    yGridSize: 1,
                    gridColor: "rgba(128,128,128,1)",
                    showGrid: true,
                } as type_Canvas_tdl,
            };
        } else if (utilityType === "TdlViewer") {
            return {
                Canvas: {
                    type: "Canvas",
                    widgetKey: "Canvas",
                    key: "Canvas",
                    style: {
                        position: "absolute",
                        display: "inline-block",
                        backgroundColor: `rgba(232,232,232,1)`,
                        // all 0
                        margin: 0,
                        border: 0,
                        padding: 0,
                        left: 0,
                        top: 0,
                        height: 500,
                        width: 800,
                        // height: "100%",
                        // width: "100%",
                        overflow: "hidden",
                        boxSizing: "border-box",
                    },
                    macros: [],
                    replaceMacros: false,
                    // used as identifier of the widgetTdl
                    windowName: "TDM TDL Viewer",
                    script: "",
                    xGridSize: 1,
                    yGridSize: 1,
                    gridColor: "rgba(128,128,128,1)",
                    showGrid: true,
                } as type_Canvas_tdl,
            };
        } else if (utilityType === "TextEditor") {
            return {
                Canvas: {
                    type: "Canvas",
                    widgetKey: "Canvas",
                    key: "Canvas",
                    style: {
                        position: "absolute",
                        display: "inline-block",
                        backgroundColor: `rgba(232,232,232,1)`,
                        // all 0
                        margin: 0,
                        border: 0,
                        padding: 0,
                        left: 0,
                        top: 0,
                        height: 500,
                        width: 800,
                        // height: "100%",
                        // width: "100%",
                        overflow: "hidden",
                        boxSizing: "border-box",
                    },
                    macros: [],
                    replaceMacros: false,
                    // used as identifier of the widgetTdl
                    windowName: "TDM Text Editor",
                    script: "",
                    xGridSize: 1,
                    yGridSize: 1,
                    gridColor: "rgba(128,128,128,1)",
                    showGrid: true,
                } as type_Canvas_tdl,
            };
        } else if (utilityType === "Help") {
            return {
                Canvas: {
                    type: "Canvas",
                    widgetKey: "Canvas",
                    key: "Canvas",
                    style: {
                        position: "absolute",
                        display: "inline-block",
                        backgroundColor: `rgba(232,232,232,1)`,
                        // all 0
                        margin: 0,
                        border: 0,
                        padding: 0,
                        left: 0,
                        top: 0,
                        height: 1000,
                        width: 1200,
                        // height: "100%",
                        // width: "100%",
                        overflow: "hidden",
                    },
                    macros: [],
                    replaceMacros: false,
                    // used as identifier of the widgetTdl
                    windowName: "TDM Help",
                    script: "",
                    xGridSize: 1,
                    yGridSize: 1,
                    gridColor: "rgba(128,128,128,1)",
                    showGrid: true,
                } as type_Canvas_tdl,
            };
        } else if (utilityType === "CaSnooper") {
            return {
                Canvas: {
                    type: "Canvas",
                    widgetKey: "Canvas",
                    key: "Canvas",
                    style: {
                        position: "absolute",
                        display: "inline-block",
                        backgroundColor: `rgba(232,232,232,1)`,
                        // all 0
                        margin: 0,
                        border: 0,
                        padding: 0,
                        left: 0,
                        top: 0,
                        height: 800,
                        width: 1050,
                        // height: "100%",
                        // width: "100%",
                        overflow: "hidden",
                    },
                    macros: [],
                    replaceMacros: false,
                    // used as identifier of the widgetTdl
                    windowName: "TDM CA Snooper",
                    script: "",
                    xGridSize: 1,
                    yGridSize: 1,
                    gridColor: "rgba(128,128,128,1)",
                    showGrid: true,
                } as type_Canvas_tdl,
            }
        } else if (utilityType === "Casw") {
            return {
                Canvas: {
                    type: "Canvas",
                    widgetKey: "Canvas",
                    key: "Canvas",
                    style: {
                        position: "absolute",
                        display: "inline-block",
                        backgroundColor: `rgba(232,232,232,1)`,
                        // all 0
                        margin: 0,
                        border: 0,
                        padding: 0,
                        left: 0,
                        top: 0,
                        height: 800,
                        width: 1050,
                        // height: "100%",
                        // width: "100%",
                        overflow: "hidden",
                    },
                    macros: [],
                    replaceMacros: false,
                    // used as identifier of the widgetTdl
                    windowName: "TDM CA Snooper",
                    script: "",
                    xGridSize: 1,
                    yGridSize: 1,
                    gridColor: "rgba(128,128,128,1)",
                    showGrid: true,
                } as type_Canvas_tdl,
            }
        } else if (utilityType === "FileConverter") {
            return {
                Canvas: {
                    type: "Canvas",
                    widgetKey: "Canvas",
                    key: "Canvas",
                    style: {
                        position: "absolute",
                        display: "inline-block",
                        backgroundColor: `rgba(232,232,232,1)`,
                        // all 0
                        margin: 0,
                        border: 0,
                        padding: 0,
                        left: 0,
                        top: 0,
                        height: 800,
                        width: 1050,
                        // height: "100%",
                        // width: "100%",
                        overflow: "hidden",
                    },
                    macros: [],
                    replaceMacros: false,
                    // used as identifier of the widgetTdl
                    windowName: "TDM File Converter",
                    script: "",
                    xGridSize: 1,
                    yGridSize: 1,
                    gridColor: "rgba(128,128,128,1)",
                    showGrid: true,
                } as type_Canvas_tdl,
            }            
        } else if (utilityType === "PvMonitor") {
            return {
                Canvas: {
                    type: "Canvas",
                    widgetKey: "Canvas",
                    key: "Canvas",
                    style: {
                        position: "absolute",
                        display: "inline-block",
                        backgroundColor: `rgba(232,232,232,1)`,
                        // all 0
                        margin: 0,
                        border: 0,
                        padding: 0,
                        left: 0,
                        top: 0,
                        height: 800,
                        width: 1050,
                        // height: "100%",
                        // width: "100%",
                        overflow: "hidden",
                    },
                    macros: [],
                    replaceMacros: false,
                    // used as identifier of the widgetTdl
                    windowName: "TDM PV Monitor",
                    script: "",
                    xGridSize: 1,
                    yGridSize: 1,
                    gridColor: "rgba(128,128,128,1)",
                    showGrid: true,
                } as type_Canvas_tdl,
            };
        } else {
            return {};
        }
    };
}
