import * as React from "react";
import { GlobalVariables } from "./GlobalVariables";

import { MainWindowClient } from "../../mainProcess/windows/MainWindow/MainWindowClient";
import { ElementRectangleButton } from "../helperWidgets/SharedElements/RectangleButton";
import { SidebarLargeInput } from "../widgets/BaseWidget/SidebarLargeInput";
import path from "path";

export class MainWindowProfileRunPage {
    private _profiles: Record<string, any>;
    private readonly _selectedProfile: Record<string, any>;
    private readonly _selectedProfileName: string = "";
    private _mainWindowClient: MainWindowClient;
    private _largeInput: SidebarLargeInput;

    constructor(mainWindowClient: MainWindowClient) {
        this._mainWindowClient = mainWindowClient;
        this._selectedProfileName = mainWindowClient.getSelectedProfileName();
        // make local copies
        this._profiles = JSON.parse(JSON.stringify(mainWindowClient.getProfiles()));
        console.log("mainWindowClient.getProfiles()", mainWindowClient.getSelectedProfile(), JSON.stringify(mainWindowClient.getProfiles()));
        this._selectedProfile = JSON.parse(JSON.stringify(mainWindowClient.getSelectedProfile()));
        this._largeInput = new SidebarLargeInput();
    }

    updateProfiles = (newProfiles: Record<string, any>) => {
        this._profiles = JSON.parse(JSON.stringify(newProfiles));
    };

    getMainWindowClient = () => {
        return this._mainWindowClient;
    };

    // ----------------------- profile run page --------------------

    // public element
    ProfileRunPage = () => {
        const tdlOpenerRef = React.useRef<any>(null);
        const refWsOpenerPort = React.useRef<any>(null);
        const openFile = (event: any) => {
            // window id
            // no tdl file name, no macro, do not replace macro
            // this.getMainWindowClient().getIpcManager().sendFromRendererProcess("open-tdl-file", undefined, "operating", false, [], false);
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("open-tdl-file",
                {
                    options: {
                        // tdlFileNames?: string[];
                        mode: "operating",
                        editable: false,
                        macros: [],
                        replaceMacros: false,
                        // currentTdlFolder?: string;
                        windowId: this.getMainWindowClient().getWindowId(),
                    }
                }
            );
        };
        const openRemoteFile = (event: any) => {
            // open the large input
            this._largeInput.createElement("", (newValue: "string") => { }, "Remote TDL File Path", (newValue: string) => {
                this.getMainWindowClient().getIpcManager().sendFromRendererProcess("open-tdl-file",
                    {
                        options: {
                            tdlFileNames: [newValue],
                            mode: "operating",
                            editable: false,
                            macros: [],
                            replaceMacros: false,
                            // currentTdlFolder?: string;
                            windowId: this.getMainWindowClient().getWindowId(),
                        }
                    }
                );
            }, true, "MainWindow")
        };
        // const openFileBrowser = (event: any) => {
        //     this.getMainWindowClient().getIpcManager().sendFromRendererProcess("new-tdm-process");
        // };


        const openFileBrowser = (event: any) => {
            const mainWindowId = this.getMainWindowClient().getWindowId();
            // priority:
            // the valid input path variable which should be an absolute path
            // this tdl file's path
            // the first absolute default TDL file path
            // the first absolute default search path
            // HOME folder
            let openPath = "";

            // try input path
            // try {
            //     const normalized = path.normalize(inputPath);
            //     if (typeof normalized === 'string' && normalized.length > 0 && path.isAbsolute(inputPath)) {
            //         openPath = inputPath;
            //     }
            // } catch {
            // }

            // try this TDL file's folder
            // if (openPath === "") {
            //     const tdlFileName = this.getRoot().getDisplayWindowClient().getTdlFileName();
            //     if (tdlFileName !== "" && path.isAbsolute(tdlFileName)) {
            //         const tdlFilePath = path.dirname(tdlFileName);
            //         openPath = tdlFilePath;
            //     }
            // }

            // try first absoluate default search path
            if (openPath === "") {
                if (this._selectedProfile["EPICS Custom Environment"] !== undefined) {
                    if (this._selectedProfile["EPICS Custom Environment"]["Default TDL Files"] !== undefined) {
                        const defaultTdlFiles = this._selectedProfile["EPICS Custom Environment"]["Default TDL Files"]["value"];
                        if (Array.isArray(defaultTdlFiles)) {
                            for (const tdlFileName of defaultTdlFiles) {
                                if (tdlFileName !== "" && path.isAbsolute(tdlFileName)) {
                                    const tdlFilePath = path.dirname(tdlFileName);
                                    openPath = tdlFilePath;
                                    break;
                                }
                            }
                        }
                    }
                }
            }

            // try first absoluate default search path
            if (openPath === "") {
                if (this._selectedProfile["EPICS Custom Environment"] !== undefined) {
                    if (this._selectedProfile["EPICS Custom Environment"]["Default Search Paths"] !== undefined) {
                        const defaultSearchPaths = this._selectedProfile["EPICS Custom Environment"]["Default Search Paths"]["value"];
                        if (Array.isArray(defaultSearchPaths)) {
                            for (const searchPath of defaultSearchPaths) {
                                if (path.isAbsolute(searchPath)) {
                                    openPath = searchPath;
                                    break;
                                }
                            }
                        }
                    }
                }
            }

            // fall back to home dir
            if (openPath === "") {
                openPath = "$HOME"
            }

            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window",
                {
                    utilityType: "FileBrowser",
                    utilityOptions: { path: openPath, modal: false },
                    windowId: mainWindowId,
                }
            );
        };

        const [, forceUpdate] = React.useState({});

        this.forceUpdateWsOpenerPort = () => {
            forceUpdate({});
        };

        const showProfileInfo = (event: any) => {
            const mainWindowId = this.getMainWindowClient().getWindowId();
            // window id
            // no tdl file name, no macro, do not replace macro
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window",
                {
                    utilityType: "ProfilesViewer",
                    utilityOptions: {},
                    windowId: mainWindowId,
                }
            );
        };
        const showLogInfo = (event: any) => {
            // window id
            const mainWindowId = this.getMainWindowClient().getWindowId();
            // no tdl file name, no macro, do not replace macro
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window",
                {
                    utilityType: "LogViewer",
                    utilityOptions: {},
                    windowId: mainWindowId
                }
            );
        };

        const newTdmProcess = (event: any) => {
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("new-tdm-process", {});
        }
        const openDefaultDisplayWindows = (event: any) => {
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("open-default-display-windows", {
                windowId: this.getMainWindowClient().getWindowId(),
            });
        }

        // utility windows
        const openProbeWindow = () => {
            const mainWindowId = this.getMainWindowClient().getWindowId();
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window",
                {
                    utilityType: "Probe",
                    utilityOptions: { channelNames: [] },
                    windowId: mainWindowId,
                }
            );
        }

        const openChannelGraphWindow = () => {
            const mainWindowId = this.getMainWindowClient().getWindowId();
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window",
                {
                    utilityType: "ChannelGraph",
                    utilityOptions: { channelNames: [] },
                    windowId: mainWindowId,
                }
            );
        }
        const openSeqGraphWindow = () => {
            const mainWindowId = this.getMainWindowClient().getWindowId();
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window",
                {
                    utilityType: "SeqGraph",
                    utilityOptions: {},
                    windowId: mainWindowId,
                }
            );
        }

        const openPvMonitorWindow = () => {
            const mainWindowId = this.getMainWindowClient().getWindowId();
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window",
                {
                    utilityType: "PvMonitor",
                    utilityOptions: { channelNames: [] },
                    windowId: mainWindowId,
                }
            );
        }

        const openCaSnooperWindow = () => {
            const mainWindowId = this.getMainWindowClient().getWindowId();
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window",
                {
                    utilityType: "CaSnooper",
                    utilityOptions: {},
                    windowId: mainWindowId,
                }
            );
        }
        const openCaswWindow = () => {
            const mainWindowId = this.getMainWindowClient().getWindowId();
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window",
                {
                    utilityType: "Casw",
                    utilityOptions: {},
                    windowId: mainWindowId,
                }
            );
        }
        const openFileConverterWindow = () => {
            const mainWindowId = this.getMainWindowClient().getWindowId();
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window",
                {
                    utilityType: "FileConverter",
                    utilityOptions: {},
                    windowId: mainWindowId,
                }
            );
        }
        const openPvTablesWindow = () => {
            const mainWindowId = this.getMainWindowClient().getWindowId();
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window",
                {
                    utilityType: "PvTable",
                    utilityOptions: { channelNames: [] },
                    windowId: mainWindowId,
                }
            );
        }

        const openDataViewerWindow = () => {
            const mainWindowId = this.getMainWindowClient().getWindowId();
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window",
                {
                    utilityType: "DataViewer",
                    utilityOptions: { channelNames: [] },
                    windowId: mainWindowId,
                }
            );
        }
        const openCalculatorWindow = () => {
            const mainWindowId = this.getMainWindowClient().getWindowId();
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window",
                {
                    utilityType: "Calculator",
                    utilityOptions: {},
                    windowId: mainWindowId,
                }
            );
        }
        const openTerminalWindow = () => {
            const mainWindowId = this.getMainWindowClient().getWindowId();
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window",
                {
                    utilityType: "Terminal",
                    utilityOptions: {},
                    windowId: mainWindowId,
                }
            );
        }
        const openTextEditorWindow = () => {
            const mainWindowId = this.getMainWindowClient().getWindowId();
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window",
                {
                    utilityType: "TextEditor",
                    utilityOptions: { fileName: "" },
                    windowId: mainWindowId,
                }
            );
        }
        const openHelpWindow = () => {
            // special character ${tdm_root} is replaced by the main process
            const url = "file://${tdm_root}/dist/webpack/HelpWindow.html";
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("open-webpage", {
                url: url
            });
        }
        const quitTdmProcess = () => {
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("quit-tdm-process", {});
        }
        const openTalhk = () => {
            const mainWindowId = this.getMainWindowClient().getWindowId();
            // todo: include alarm handler server address
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window",
                {
                    utilityType: "Talhk",
                    utilityOptions: { serverAddress: "http://127.0.0.1:4000" },
                    windowId: mainWindowId,
                }
            );
        }


        const buttonFunctions: Record<string, any> = {
            "Open file": openFile,
            "Open file from remote": openRemoteFile,
            "File Browser": openFileBrowser,
            "Create new display": this.createNewDisplay,
            "Open default windows": openDefaultDisplayWindows,
            "Data Viewer": openDataViewerWindow,
            "Probe": openProbeWindow,
            "Channel Graph": openChannelGraphWindow,
            "Seq Graph": openSeqGraphWindow,
            "PV Table": openPvTablesWindow,
            "PV Monitor": openPvMonitorWindow,
            // "Talhk": openTalhk,
            "CaSnooper": openCaSnooperWindow,
            "Casw": openCaswWindow,
            "Calculator": openCalculatorWindow,
            // "Terminal": openTerminalWindow,
            "Text Editor": openTextEditorWindow,
            "Profile and runtime info": showProfileInfo,
            // "TDM Log": showLogInfo,
            "New TDM process": newTdmProcess,
            "File Converter": openFileConverterWindow,
            "Help": openHelpWindow,
            "Exit": quitTdmProcess,
        };

        if (this.getMainWindowClient().getMainProcessMode() === "ssh-client") {
            delete(buttonFunctions["Open file"])
            delete(buttonFunctions["New TDM process"])
        }

        return (
            <div style={{
                display: "flex",
                justifyContent: 'center',
                width: "100%",
                fontFamily: GlobalVariables.defaultFontFamily,
                fontSize: GlobalVariables.defaultFontSize,
                fontStyle: GlobalVariables.defaultFontStyle,
                fontWeight: GlobalVariables.defaultFontWeight,

            }}>
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "column",
                        width: "90%",
                        justifyContent: "center",
                        userSelect: "none",
                    }}
                >
                    <h1></h1>
                    <div style={{
                        display: "inline-flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}>
                        <img src="../../../mainProcess/resources/webpages/tdm-logo.svg" width="40px"></img>
                    </div>
                    <div style={{
                        margin: 5,
                        display: "inline-flex",
                        position: "relative",
                        width: "100%",
                        justifyContent: "center",
                        alignItems: "center",
                    }}>
                        <h1
                            style={{
                                display: "inline-flex"
                            }}
                            onMouseDown={() => {
                                if (tdlOpenerRef.current !== null) {
                                    if (tdlOpenerRef.current.style["display"] === "none") {
                                        tdlOpenerRef.current.style["display"] = "inline-flex";
                                    } else {
                                        tdlOpenerRef.current.style["display"] = "none";
                                    }
                                }
                            }}
                        >
                            {this._selectedProfileName}
                        </h1>
                        <div
                            ref={refWsOpenerPort}
                            style={{
                                position: "absolute",
                                top: 0,
                                right: 0,
                                color: "rgba(0,0,0,0)",
                                userSelect: "none",
                            }}
                            onMouseEnter={() => {
                                if (refWsOpenerPort.current !== null) {
                                    refWsOpenerPort.current.style["color"] = "rgba(0,0,0,1)";
                                }
                            }}
                            onMouseLeave={() => {
                                if (refWsOpenerPort.current !== null) {
                                    refWsOpenerPort.current.style["color"] = "rgba(0,0,0,0)";
                                }
                            }}
                        >
                            {this.getMainWindowClient().getWsOpenerPort()}
                        </div>
                    </div>
                    <div style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        flexWrap: "wrap",
                    }}>
                        {Object.keys(buttonFunctions).map((buttonText: string) => {
                            const func = buttonFunctions[buttonText];
                            return (
                                <ElementRectangleButton
                                    handleClick={func}
                                    marginLeft={5}
                                    marginRight={5}
                                    marginBottom={5}
                                    marginTop={5}
                                    paddingLeft={0}
                                    paddingRight={0}
                                    paddingBottom={0}
                                    paddingTop={0}
                                    additionalStyle={{
                                        width: 100,
                                        height: 40,
                                        textAlign: "center",
                                    }}
                                >
                                    {buttonText}
                                </ElementRectangleButton>
                            )
                        })}
                    </div>
                    <this._ElementThumbnailGallery></this._ElementThumbnailGallery>
                </div>
            </div>
        );
    };

    getElement = () => {
        return <this.ProfileRunPage></this.ProfileRunPage>
    }

    thumbnailGallery: Record<
        string,
        {
            image: string;
            windowName: string;
            tdlFileName: string;
        }
    > = {};

    _ElementThumbnailGallery = () => {
        const [, forceUpdate] = React.useState({});
        this.forceUpdateThumbnailGallery = () => {
            forceUpdate({});
        };
        const [windowName, setWindowName] = React.useState("\u00A0");
        const [tdlFileName, setTdlFileName] = React.useState("\u00A0");
        return (
            <div
                style={{
                    width: "90%",
                    display: "inline-flex",
                    flexDirection: "column",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        display: "inline-flex",
                        flexDirection: "column",
                    }}
                >
                    <div
                        style={{
                            margin: "5px",
                            width: "100%",
                        }}
                    >
                        {windowName === "" ? "\u00A0" : windowName}
                    </div>
                    <div
                        style={{
                            margin: "5px",
                            width: "100%",
                        }}
                    >
                        {tdlFileName === "" ? "\u00A0" : tdlFileName}
                    </div>
                </div>
                <div
                    style={{
                        width: "100%",
                        display: "inline-flex",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                    }}
                >
                    {Object.keys(this.thumbnailGallery).map((displayWindowId: string) => {
                        return (
                            <this._ElementThumbnail
                                key={displayWindowId}
                                displayWindowId={displayWindowId}
                                imageBase64={this.thumbnailGallery[displayWindowId]["image"]}
                                setWindowName={setWindowName}
                                setTdlFileName={setTdlFileName}
                            ></this._ElementThumbnail>
                        );
                    })}
                </div>
            </div>
        );
    };

    _ElementThumbnail = ({ displayWindowId, imageBase64, setWindowName, setTdlFileName }: {
        displayWindowId: string;
        imageBase64: string;
        setWindowName: (newName: string) => void;
        setTdlFileName: (newName: string) => void;
    }) => {
        const elementRef = React.useRef<any>(null);
        return (
            <div
                ref={elementRef}
                style={{
                    width: "100px",
                    height: "100px",
                    overflow: "hidden",
                    borderRadius: "5px",
                    border: "solid 1px rgba(150,150,150,1)",
                    margin: "5px",
                }}
                // left down
                onMouseDown={(event: React.MouseEvent) => {
                    event.preventDefault();
                    if (event.button === 0) {
                        this.getMainWindowClient().getIpcManager().sendFromRendererProcess("focus-window", {displayWindowId: displayWindowId});
                    }
                }}
                // mid click, onClick is only for left button
                onAuxClick={(event: React.MouseEvent) => {
                    event.preventDefault();
                    if (event.button === 1) {
                        this.getMainWindowClient().getIpcManager().sendFromRendererProcess("close-window", {displayWindowId: displayWindowId});
                        setWindowName("");
                        setTdlFileName("");
                    }
                }}
                onMouseEnter={() => {
                    if (elementRef.current !== null) {
                        elementRef.current["style"]["outline"] = "solid 2px rgba(150,150,150,1)";
                        elementRef.current["style"]["cursor"] = "pointer";
                    }
                    const windowName = this.thumbnailGallery[displayWindowId]["windowName"];
                    const tdlFileName = this.thumbnailGallery[displayWindowId]["tdlFileName"];
                    setWindowName(windowName);
                    setTdlFileName(tdlFileName);
                }}
                onMouseLeave={() => {
                    if (elementRef.current !== null) {
                        elementRef.current["style"]["outline"] = "none";
                        elementRef.current["style"]["cursor"] = "default";
                    }
                    setWindowName("");
                    setTdlFileName("");
                }}
            >
                <img style={{ width: "100%", height: "100%", objectFit: "contain" }} src={imageBase64}></img>;
            </div>
        );
    };

    forceUpdateThumbnailGallery = () => { };
    forceUpdateWsOpenerPort = () => { };
    updateThumbnailGallery = (
        data: Record<
            string,
            | {
                image: string;
                windowName?: string;
                tdlFileName?: string;
            }
            | undefined | null
        >
    ) => {
        for (let displayWindowId of Object.keys(data)) {
            const value = data[displayWindowId];
            if (value === null || value === undefined) {
                delete this.thumbnailGallery[displayWindowId];
            } else {
                const imageBase64 = value["image"];
                const windowName = value["windowName"];
                const tdlFileName = value["tdlFileName"];

                if (this.thumbnailGallery[displayWindowId] === undefined) {
                    this.thumbnailGallery[displayWindowId] = { image: "", windowName: "", tdlFileName: "" };
                }

                this.thumbnailGallery[displayWindowId]["image"] = imageBase64;

                if (windowName !== undefined) {
                    this.thumbnailGallery[displayWindowId]["windowName"] = windowName;
                }
                if (tdlFileName !== undefined) {
                    this.thumbnailGallery[displayWindowId]["tdlFileName"] = tdlFileName;
                }
            }
        }
        this.forceUpdateThumbnailGallery();
        // do nothing at first
    };

    createNewDisplay = (event: any) => {
        this.getMainWindowClient().getIpcManager().sendFromRendererProcess("create-blank-display-window",
            {
                windowId: this.getMainWindowClient().getWindowId(),
            }
        );
    };
}
