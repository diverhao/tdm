import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { ElementRectangleButton, ElementRectangleButtonDefaultBackgroundColor } from "../../helperWidgets/SharedElements/RectangleButton";

export type type_ProfilesViewer_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
};

export class ProfilesViewer extends BaseWidget {
    showProcessInfo = false;
    showEpicsStats = false;

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
    }[] = [];

    epicsStats: {
        udp: Record<string, any>,
        tcp: Record<string, Record<string, any>>,
    } = {
            udp: {},
            tcp: {},
        }


    constructor(widgetTdl: type_ProfilesViewer_tdl) {
        super(widgetTdl);

        this.setStyle({ ...ProfilesViewer._defaultTdl.style, ...widgetTdl.style });
        this.setText({ ...ProfilesViewer._defaultTdl.text, ...widgetTdl.text });

        // assign the sidebar
        // this._sidebar = new ProfilesViewerSidebar(this);

        // dynamically load css and js
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = '../../../webpack/resources/css/prism.css'; // Make sure the path is correct relative to your HTML file
        document.head.appendChild(css);
        const js = document.createElement('script');
        js.src = '../../../webpack/resources/js/prism.js';
        js.type = 'text/javascript';
        document.head.appendChild(js);

        // periodically request processes info
        this.addSchedule(
            setInterval(() => {
                if (this.showProcessInfo === true) {
                    this.requestProcessesInfo();
                }
                if (this.showEpicsStats === true) {
                    this.requestEpicsStats();
                }
            }, 1000)
        )
    }

    requestProcessesInfo = () => {
        if (g_widgets1 !== undefined) {
            const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
            g_widgets1.getRoot().getDisplayWindowClient().getIpcManager().sendFromRendererProcess("processes-info", {
                displayWindowId: displayWindowClient.getWindowId(),
                widgetKey: this.getWidgetKey(),
                withThumbnail: true,
            })
        }
    }

    requestEpicsStats = () => {
        if (g_widgets1 !== undefined) {
            const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
            g_widgets1.getRoot().getDisplayWindowClient().getIpcManager().sendFromRendererProcess("epics-stats", {
                displayWindowId: displayWindowClient.getWindowId(),
                widgetKey: this.getWidgetKey(),
            })
        }
    }

    // ------------------------- event ---------------------------------
    // concretize abstract method
    // empty
    updateFromSidebar = (event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean | undefined) => { };

    // defined in super class
    // _handleMouseDown()
    // _handleMouseMove()
    // _handleMouseUp()
    // _handleMouseDownOnResizer()
    // _handleMouseMoveOnResizer()
    // _handleMouseUpOnResizer()
    // _handleMouseDoubleClick()

    // ----------------------------- geometric operations ----------------------------

    // defined in super class
    // simpleSelect()
    // selectGroup()
    // select()
    // simpleDeSelect()
    // deselectGroup()
    // deSelect()
    // move()
    // resize()

    // ------------------------------ group ------------------------------------

    // defined in super class
    // addToGroup()
    // removeFromGroup()

    // ------------------------------ elements ---------------------------------

    // concretize abstract method
    _ElementRaw = () => {
        this.setAllStyle({ ...this.getStyle(), ...this.getRulesStyle() });
        this.setAllText({ ...this.getText(), ...this.getRulesText() });

        // must do it for every widget
        g_widgets1.removeFromForceUpdateWidgets(this.getWidgetKey());
        this.renderChildWidgets = true;
        React.useEffect(() => {
            this.renderChildWidgets = false;
        });

        return (
            <ErrorBoundary style={this.getStyle()} widgetKey={this.getWidgetKey()}>
                <>
                    <this._ElementBody></this._ElementBody>
                </>
            </ErrorBoundary>
        );
    };

    _ElementBodyRaw = (): JSX.Element => {
        return (
            <div
                style={
                    this.getElementBodyRawStyle()
                }
            >
                <this._ElementArea></this._ElementArea>
            </div>
        );
    };

    // only shows the text, all other style properties are held by upper level _ElementBodyRaw
    _ElementAreaRaw = ({ }: any): JSX.Element => {
        const [selection, setSelection] = React.useState("profiles");

        return (
            <div
                style={{
                    padding: 40,
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        marginBottom: "20px",
                    }}
                >
                    <ElementRectangleButton
                        defaultBackgroundColor={selection === "profiles" ? ElementRectangleButtonDefaultBackgroundColor : "grey"}
                        marginRight={10}
                        handleClick={() => {
                            setSelection("profiles");
                            this.showProcessInfo = false;
                            this.showEpicsStats = false;
                        }}>
                        Profiles
                    </ElementRectangleButton>

                    <ElementRectangleButton
                        defaultBackgroundColor={selection === "epics-ca-env" ? ElementRectangleButtonDefaultBackgroundColor : "grey"}
                        marginRight={10}
                        handleClick={() => {
                            setSelection("epics-ca-env");
                            this.showProcessInfo = false;
                            this.showEpicsStats = false;
                        }}>
                        EPICS Environments
                    </ElementRectangleButton>

                    <ElementRectangleButton
                        defaultBackgroundColor={selection === "processes-info" ? ElementRectangleButtonDefaultBackgroundColor : "grey"}
                        marginRight={10}
                        handleClick={() => {
                            setSelection("processes-info");
                            if (this.showProcessInfo === false) {
                                this.requestProcessesInfo();
                            }
                            this.showProcessInfo = true;
                            this.showEpicsStats = false;
                        }}>
                        Processes
                    </ElementRectangleButton>

                    <ElementRectangleButton
                        defaultBackgroundColor={selection === "epics-stats" ? ElementRectangleButtonDefaultBackgroundColor : "grey"}
                        marginRight={10}
                        handleClick={() => {
                            setSelection("epics-stats");
                            this.showProcessInfo = false;
                            this.showEpicsStats = true;
                        }}>
                        EPICS Network Statistics
                    </ElementRectangleButton>
                </div>

                <this._ElementProfiles show={selection === "profiles"}></this._ElementProfiles>
                <this._ElementEpicsCaEnv show={selection === "epics-ca-env"}></this._ElementEpicsCaEnv>
                <this._ElementProcesses show={selection === "processes-info"}></this._ElementProcesses>
                <this._ElementEpicsStats show={selection === "epics-stats"}></this._ElementEpicsStats>
            </div>
        );
    };

    _ElementEpicsStats = ({ show }: any) => {

        return <div style={
            {
                display: show ? "inline-flex" : "none",
                flexDirection: 'column',
            }
        }>
            <div style={{
                color: "rgba(100, 100, 100, 1)",
            }}>
                <p>
                    The EPICS network traffic for Channel Access. The byte rate only counts the payload in TCP or UDP packets.
                </p>
            </div>
            <h3>
                UDP
            </h3>
            <table>

                <col style={{ width: "70%" }}></col>
                <col style={{ width: "30%" }}></col>
                {Object.keys(this.epicsStats["udp"]).map((name: string, index: number) => {
                    const value = this.epicsStats["udp"][name];
                    if (name.toLowerCase().includes("time")) {
                        return null
                    }
                    return <tr key={`${name}-${index}`}
                        style={{
                            backgroundColor: index % 2 === 0 ? "rgba(230, 230, 230, 1)" : ""
                        }}
                    >
                        <td>{name.replace(/([A-Z])/g, ' $1').toLowerCase()}</td>
                        <td>{value}</td>
                    </tr>
                })}
            </table>
            <h3>
                TCP
            </h3>
            <table>
                <col style={{ width: "70%" }}></col>
                <col style={{ width: "30%" }}></col>
                {Object.keys(this.epicsStats["tcp"]).map((hostName: string, index: number) => {
                    const hostInfo = this.epicsStats["tcp"][hostName];
                    return <>
                        <tr>
                            <td><b>{`${hostName.split(":")[0]}:${hostName.split(":")[1]}`}</b></td>
                            <td></td>
                        </tr>
                        {Object.keys(hostInfo).map((name: string, index: number) => {
                            const value = this.epicsStats["tcp"][hostName][name];
                            if (name.toLowerCase().includes("time")) {
                                return null
                            }
                            return <tr key={`${name}-${index}`}
                                style={{
                                    backgroundColor: index % 2 === 0 ? "rgba(230, 230, 230, 1)" : ""
                                }}
                            >
                                <td>{name.replace(/([A-Z])/g, ' $1').toLowerCase()}</td>
                                <td>{value}</td>
                            </tr>
                        })}
                        <tr>
                            <td>&nbsp;</td>
                            <td></td>
                        </tr>
                    </>
                })}
            </table>
        </div>
    }

    _ElementSelectionButton = ({ text, selectionText, selection, onMouseDown }: any) => {
        const elementRef = React.useRef<any>(null);
        return <div
            ref={elementRef}
            style={{
                backgroundColor: selectionText === selection ? "rgba(18, 108, 179, 1)" : "grey",
                borderRadius: 3,
                padding: 5,
                paddingTop: 3,
                paddingBottom: 3,
                boxSizing: "border-box",
                color: "rgba(255, 255, 255, 1)",
                marginRight: 10,
            }}
            onMouseEnter={() => {
                if (elementRef.current !== null) {
                    elementRef.current.style["cursor"] = "pointer";
                    elementRef.current.style["opacity"] = 0.9;
                }
            }}
            onMouseLeave={() => {
                if (elementRef.current !== null) {
                    elementRef.current.style["cursor"] = "default";
                    elementRef.current.style["opacity"] = 1;
                }
            }}
            onMouseDown={onMouseDown}
        >
            {text}
        </div>

    }

    _ElementProfiles = ({ show }: any) => {
        return (
            <div style={{
                display: show ? "inline-flex" : "none",
                flexDirection: 'column',
            }}>
                <div style={{
                    color: "rgba(100, 100, 100, 1)",
                    marginTop: 10,
                    marginBottom: 10,
                }}>
                    You are currently using profile <code>{this.getText()["selected-profile-name"]["Selected profile"]}</code>.
                </div>
                <div>
                    <hr></hr>
                </div>
                {`${this.getText()["profilesFileName"]}`}
                <div>
                    <hr></hr>
                </div>
                {Object.keys(this.getText()["profiles"]).map((profileName: string) => {
                    const profileJson = this.getText()["profiles"][profileName];
                    return (
                        <this._ElementProfileButton
                            profileName={profileName}
                            profileJson={profileJson}
                        >
                        </this._ElementProfileButton>
                    )
                })
                }
            </div>
        )
    }

    _ElementProfileButton = ({ profileName, profileJson }: any) => {
        const [showJson, setShowJson] = React.useState(true);
        return (
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "column",
                    marginTop: 15,
                }}>
                <div style={{
                    marginBottom: 10,
                    cursor: "pointer",
                }}
                    onMouseDown={() => {
                        setShowJson(!showJson);
                    }}
                >
                    {profileName}
                    {showJson ?
                        <img src="../../../webpack/resources/webpages/arrowDown.svg" style={{
                            width: 8,
                            height: 8,
                            marginLeft: 15,
                        }}></img>
                        :
                        <img src="../../../webpack/resources/webpages/arrowUp.svg" style={{
                            width: 8,
                            height: 8,
                            marginLeft: 15,
                        }}></img>
                    }
                </div>
                <div style={{
                    display: showJson ? "inline-flex" : "none",
                }}>
                    <code className="language-javascript" style={{
                        whiteSpace: "pre",
                    }}>
                        {
                            JSON.stringify(profileJson, null, 4)
                        }
                    </code>
                </div>
            </div>
        )
    }

    _ElementEpicsCaEnv = ({ show }: any) => {
        return (
            <div style={{
                display: show ? "inline-flex" : "none",
                flexDirection: 'column',
            }}>
                <div>
                    <hr></hr>
                </div>
                It shows the various
                <div>
                    <hr></hr>
                </div>
                {Object.keys(this.getText()["epics-ca-env"]).map((profileName: string) => {
                    const profileJson = this.getText()["epics-ca-env"][profileName];
                    return (
                        <this._ElementProfileButton
                            profileName={profileName}
                            profileJson={profileJson}
                        >
                        </this._ElementProfileButton>
                    )
                })
                }
            </div>
        )
    }


    _ElementProcesses = ({ show }: any) => {
        // "Type": "Display Window",
        // "Window ID": this.getId(),
        // "Visible": visible,
        // "TDL file name": this.getTdlFileName(),
        // "Window name": this.getWindowName(),
        // "Editable": this.isEditable() === true ? "Yes" : "No",
        // "Uptime [second]": usage["Uptime [s]"],
        // "Process ID": this.getWebContents() === undefined ? -1 : this.getWebContents()?.getOSProcessId(),
        // "CPU usage [%]": usage["CPU usage [%]"],
        // "Memory usage [MB]": usage["Memory usage [MB]"],
        // "Thumbnail": withThumbnail ? this.getThumbnail() : "",
        // "Script": string,
        // "Script PID": string,

        return (<div
            style={{
                width: "100%",
                display: show ? "inline-flex" : "none",
                flexDirection: "column",
            }}
        >
            {this.processesInfo.map((processInfo: {
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
            }, index: number) => {
                return (
                    <div style={{
                        width: "100%",
                        display: "inline-flex",
                        flexDirection: "column",
                    }}
                        key={`${processInfo["Window ID"]}-${index}`}
                    >
                        <div><hr></hr></div>
                        <div style={{
                            width: "100%",
                            display: "inline-flex",
                            flexDirection: "row",
                        }}>
                            {/* thumbnail */}
                            <div style={{
                                width: "29%",
                                display: "inline-flex",
                                justifyContent: "center",
                                alignItems: "center",
                            }}>
                                <this._ElementThumbnail
                                    displayWindowId={processInfo["Window ID"]}
                                    imageBase64={processInfo["Thumbnail"]}
                                    visible={processInfo["Visible"]}
                                    type={processInfo["Type"]}
                                    index={index}
                                >
                                </this._ElementThumbnail>
                            </div>
                            <div style={{
                                display: "inline-flex",
                                width: "1%",
                            }}></div>
                            {/* table */}
                            <div style={{
                                width: "70%",
                                display: "inline-flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                            }}>
                                {Object.keys(processInfo).map((propertyName: string, index: number) => {
                                    const propertyValue = processInfo[propertyName as keyof typeof processInfo];
                                    // each line
                                    if (propertyName === "Thumbnail") {
                                        return null;
                                    }
                                    else {
                                        return (
                                            <div style={{
                                                width: "100%",
                                                display: "inline-flex",
                                                flexDirection: "row",
                                                backgroundColor: index % 2 === 0 ? "rgba(200, 200, 200, 1)" : "rgba(255, 255, 255,1)",
                                            }}>
                                                <div style={{
                                                    width: "45%",
                                                    display: "inline-flex",
                                                    justifyContent: "flex-end",
                                                    alignItems: "flex-end",
                                                }}>
                                                    {propertyName}
                                                </div>
                                                <div style={{
                                                    display: "inline-flex",
                                                    width: "3%",
                                                }}>
                                                    &nbsp;
                                                </div>
                                                <div style={{
                                                    display: "inline-flex",
                                                    width: "45%",
                                                }}>
                                                    {propertyValue}
                                                </div>
                                            </div>
                                        )
                                    }
                                })}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>)
    }

    updateProcessesInfo = (processesInfo: {
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
    }[]) => {
        this.processesInfo = processesInfo;
        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_flushWidgets();
    }


    updateEpicsStats = (epicsStats: {
        udp: Record<string, any>,
        tcp: Record<string, Record<string, any>>,
    }) => {
        this.epicsStats = epicsStats;
        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_flushWidgets();
    }


    _ElementThumbnail = ({ displayWindowId, imageBase64, visible, type, index }: any) => {
        const elementRef = React.useRef<any>(null);
        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
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
                    if (visible === "Yes") {
                        event.preventDefault();
                        if (event.button === 0) {
                            if (type === "Display Window") {
                                displayWindowClient.getIpcManager().sendFromRendererProcess("focus-window", displayWindowId);
                            }
                            else if (type === "Main Window") {
                                displayWindowClient.getIpcManager().sendFromRendererProcess("bring-up-main-window");
                            }
                        }
                    }
                }}
                // mid click, onClick is only for left button
                onAuxClick={(event: React.MouseEvent) => {
                    if (visible === "Yes") {
                        event.preventDefault();
                        if (event.button === 1) {
                            displayWindowClient.getIpcManager().sendFromRendererProcess("close-window", displayWindowId);
                            g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
                            g_flushWidgets();
                            this.processesInfo.splice(index, 1);
                        }
                    }
                }}
                onMouseEnter={() => {
                    if (visible === "Yes") {
                        if (elementRef.current !== null) {
                            elementRef.current["style"]["outline"] = "solid 2px rgba(150,150,150,1)";
                            elementRef.current["style"]["cursor"] = "pointer";
                        }
                    }
                }}
                onMouseLeave={() => {
                    if (visible === "Yes") {
                        if (elementRef.current !== null) {
                            elementRef.current["style"]["outline"] = "none";
                            elementRef.current["style"]["cursor"] = "default";
                        }
                    }
                }}
            >
                {imageBase64 === "" ? null :
                    <img style={{ width: "100%", height: "100%", objectFit: "contain" }} src={imageBase64}></img>
                }
            </div>
        );
    };


    // concretize abstract method
    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());
    _ElementBody = React.memo(this._ElementBodyRaw, () => this._useMemoedElement());

    // defined in super class
    // getElement()
    // getSidebarElement()

    // -------------------- helper functions ----------------

    // defined in super class
    // _showSidebar()
    // _showResizers()
    // _useMemoedElement()
    // hasChannel()
    // isInGroup()
    // isSelected()
    // _getElementAreaRawOutlineStyle()

    _getChannelValue = () => {
        return this._getFirstChannelValue();
    };
    _getChannelSeverity = () => {
        return this._getFirstChannelSeverity();
    };
    _getChannelUnit = () => {
        return this._getFirstChannelUnit();
    };

    // ----------------------- styles -----------------------

    // defined in super class

    // _resizerStyle
    // _resizerStyles
    // StyledToolTipText
    // StyledToolTip

    // -------------------------- tdl -------------------------------

    // override BaseWidget
    static _defaultTdl: type_ProfilesViewer_tdl = {
        type: "ProfilesViewer",
        widgetKey: "", // "key" is a reserved keyword
        key: "",
        // the style for outmost div
        // these properties are explicitly defined in style because they are
        // (1) different from default CSS settings, or
        // (2) they may be modified
        style: {
            position: "absolute",
            display: "inline-block",
            backgroundColor: "rgba(255, 255,255, 1)",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            boxSizing: "border-box",
            overflow: "scroll",
            outlineStyle: "none",
            // do not use outline in full screen widget, it will cause an extra horizontal scroll bar on bottom
            // outlineWidth: 1,
            // outlineColor: "black",
            transform: "rotate(0deg)",
            color: "rgba(0,0,0,1)",
            borderStyle: "solid",
            borderWidth: 0,
            borderColor: "rgba(255, 0, 0, 1)",
        },
        // the ElementBody style
        text: {},
        channelNames: [],
        groupNames: [],
        rules: [],
    };

    // override
    static generateDefaultTdl = (type: string) => {
        // defines type, widgetKey, and key
        const result = super.generateDefaultTdl(type) as type_ProfilesViewer_tdl;
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        return result;
    };

    // static method for generating a widget tdl with external PV name
    static generateWidgetTdl = (utilityOptions: Record<string, any>): type_ProfilesViewer_tdl => {
        const result = this.generateDefaultTdl("ProfilesViewer");
        result.text = utilityOptions as Record<string, any>;
        return result;
    };

    // getTdlCopy()

    // --------------------- getters -------------------------

    // defined in super class
    // getType()
    // getWidgetKey()
    // getStyle()
    // getText()
    // getSidebar()
    // getGroupName()
    // getGroupNames()
    // getupdateFromWidget()
    // getResizerStyle()
    // getResizerStyles()

    // ---------------------- setters -------------------------

    // ---------------------- channels ------------------------

    // defined in super class

    // getChannelNames()
    // expandChannelNames()
    // getExpandedChannelNames()
    // setExpandedChannelNames()
    // expandChannelNameMacro()

    // ------------------------ z direction --------------------------

    // defined in super class
    // moveInZ()
    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
    }
}
