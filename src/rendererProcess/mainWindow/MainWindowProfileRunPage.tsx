import * as React from "react";
import { GlobalVariables } from "./GlobalVariables";

import { MainWindowClient } from "../../mainProcess/windows/MainWindow/MainWindowClient";
import { ElementRectangleButton } from "../helperWidgets/SharedElements/RectangleButton";

export class MainWindowProfileRunPage {
    private _profiles: Record<string, any>;
    private readonly _selectedProfile: Record<string, any>;
    private readonly _selectedProfileName: string = "";
    private _mainWindowClient: MainWindowClient;

    constructor(mainWindowClient: MainWindowClient) {
        this._mainWindowClient = mainWindowClient;
        this._selectedProfileName = mainWindowClient.getSelectedProfileName();
        // make local copies
        this._profiles = JSON.parse(JSON.stringify(mainWindowClient.getProfiles()));
        this._selectedProfile = JSON.parse(JSON.stringify(mainWindowClient.getSelectedProfile()));
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
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("open-tdl-file", {
                // tdlFileNames?: string[];
                mode: "operating",
                editable: false,
                macros: [],
                replaceMacros: false,
                // currentTdlFolder?: string;
                windowId: this.getMainWindowClient().getWindowId(),
            });
        };
        const [, forceUpdate] = React.useState({});

        this.forceUpdateWsOpenerPort = () => {
            forceUpdate({});
        };

        const showProfileInfo = (event: any) => {
            // window id
            // no tdl file name, no macro, do not replace macro
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window", "ProfilesViewer", {});
        };
        const showLogInfo = (event: any) => {
            // window id
            // no tdl file name, no macro, do not replace macro
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window", "LogViewer", {});
        };

        const newTdmProcess = (event: any) => {
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("new-tdm-process");
        }
        const openDefaultDisplayWindows = (event: any) => {
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("open-default-display-windows");
        }

        // utility windows
        const openProbeWindow = () => {
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window", "Probe", { channelNames: [] });
        }

        const openChannelGraphWindow = () => {
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window", "ChannelGraph", {channelNames: []});
        }

        const openPvMonitorWindow = () => {
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window", "PvMonitor", { channelNames: [] });
        }

        const openCaSnooperWindow = () => {
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window", "CaSnooper", {});
        }
        const openCaswWindow = () => {
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window", "Casw", {});
        }
        const openFileConverterWindow = () => {
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window", "FileConverter", {});
        }
        const openPvTablesWindow = () => {
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window", "PvTable", { channelNames: [] });
        }

        const openDataViewerWindow = () => {
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window", "DataViewer", { channelNames: [] });
        }
        const openCalculatorWindow = () => {
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window", "Calculator", {});
        }
        const openTerminalWindow = () => {
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window", "Terminal", {});
        }
        const openTextEditorWindow = () => {
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window", "TextEditor", { fileName: "" });
        }
        const openHelpWindow = () => {
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("create-utility-display-window", "Help", {});
        }
        const quitTdmProcess =  () => {
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("quit-tdm-process");
        }


        const buttonFunctions: Record<string, any> = {
            "Open file": openFile,
            "Create new display": this.createNewDisplay,
            "Open default windows": openDefaultDisplayWindows,
            "Data Viewer": openDataViewerWindow,
            "Probe": openProbeWindow,
            "Channel Graph": openChannelGraphWindow,
            "PV Table": openPvTablesWindow,
            "PV Monitor": openPvMonitorWindow,
            "CaSnooper": openCaSnooperWindow,
            "Casw": openCaswWindow,
            "Calculator": openCalculatorWindow,
            "Terminal": openTerminalWindow,
            "Text Editor": openTextEditorWindow,
            "Profile and runtime info": showProfileInfo,
            "TDM Log": showLogInfo,
            "New TDM process": newTdmProcess,
            "File Converter": openFileConverterWindow,
            "Help": openHelpWindow,
            "Exit": quitTdmProcess,
        };

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

    _ElementThumbnail = ({ displayWindowId, imageBase64, setWindowName, setTdlFileName }: any) => {
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
                        this.getMainWindowClient().getIpcManager().sendFromRendererProcess("focus-window", displayWindowId);
                    }
                }}
                // mid click, onClick is only for left button
                onAuxClick={(event: React.MouseEvent) => {
                    event.preventDefault();
                    if (event.button === 1) {
                        this.getMainWindowClient().getIpcManager().sendFromRendererProcess("close-window", displayWindowId);
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
            | null
        >
    ) => {
        for (let displayWindowId of Object.keys(data)) {
            const value = data[displayWindowId];
            if (value === null) {
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
        // event.preventDefault();
        // this.getMainWindowClient().getIpcManager().sendFromRendererProcess("open-tdl-file", "");
        this.getMainWindowClient().getIpcManager().sendFromRendererProcess("open-tdl-file", {
            tdlFileNames: [],
            mode: "editing",
            editable: true,
            macros: [],
            replaceMacros: false,
            // currentTdlFolder?: string;
            windowId: this.getMainWindowClient().getWindowId(),
        });
    };
}
