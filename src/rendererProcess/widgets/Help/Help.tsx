import * as React from "react";
import { MouseEvent } from "react";
import { GlobalVariables, g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { GroupSelection2 } from "../../helperWidgets/GroupSelection/GroupSelection2";
import * as GlobalMethods from "../../global/GlobalMethods";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
// import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary"
import { Log } from "../../global/Log";
// import { HelpSidebar } from "./HelpSidebar";
// in web mode, we must use BrowserRouter
// in desktop mode, we must use HashRouter to load image
import { HashRouter as Router, useLocation, Routes, Route, Link, useNavigate, ScrollRestoration } from 'react-router-dom';

import { Overview } from "./contents/Overview";
import { TechnicalOverview } from "./contents/TechnicalOverview";
import { GetStarted } from "./contents/GetStarted";
import { Dummy } from "./contents/Dummy";
import { Profile } from "./contents/Profile";
import { Operation } from "./contents/Operation";
import { Edit } from "./contents/Edit";
import { Macro } from "./contents/Macro";

export type type_article = {
    articleName: string,
    linkPath: string,
    element: (widget: Help, linkPath: string) => JSX.Element,
}

export type type_chapter = {
    chapterName: string,
    articles: type_article[];
}

export type type_Help_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
};

/**
 * this widget should not be explicitly created like others
 */
export class Help extends BaseWidget {

    selectedLinkPath = "/Overview";
    selectedChapter = "";
    expandedChapter = "";
    navigationUpdaters: Record<string, any> = {};
    forceUpdate: any = undefined;

    data: (type_article | type_chapter)[] = [
        {
            /**
             * Basic introduction, usage, where to download, source code, 
             * basic images, 
             * 
             */
            articleName: "Overview",
            linkPath: "/Overview",
            element: Overview,
        },
        {
            articleName: "Get Started",
            linkPath: "/GetStarted",
            element: GetStarted,
        },
        {
            articleName: "Technical Overview",
            linkPath: "/TechnicalOverview",
            element: TechnicalOverview,
        },
        {
            articleName: "Profile",
            linkPath: "/Profile",
            element: Profile,
        },
        {
            /**
             * Operating mode, intro to main window and display window, daily use, 
             */
            articleName: "Operate",
            linkPath: "/Operation",
            element: Operation,
        },
        {
            /**
             * Edit mode, not related to a display's detailed properties
             */
            articleName: "Edit Display",
            linkPath: "/Edit",
            element: Edit,
        },
        {
            chapterName: "Basic Topics",
            articles: [
                {
                    articleName: "Macro",
                    linkPath: "/Macro",
                    element: Macro,
                },
                {
                    articleName: "Color",
                    linkPath: "/Color",
                    element: Dummy,
                },
                {
                    articleName: "Font",
                    linkPath: "/Font",
                    element: Dummy,
                },
                {
                    articleName: "Keyboard Shortcut",
                    linkPath: "/KeyboardShortcut",
                    element: Dummy,
                },
                {
                    articleName: "Mouse",
                    linkPath: "/Mouse",
                    element: Dummy,
                },
                {
                    articleName: "Tools",
                    linkPath: "/Tools",
                    element: Dummy,
                },
                {
                    articleName: "EDM",
                    linkPath: "/EDM",
                    element: Dummy,
                },
                {
                    articleName: "Files",
                    linkPath: "/Files",
                    element: Dummy,
                },
                {
                    articleName: "Editing Hisotry",
                    linkPath: "/EditingHistory",
                    element: Dummy,
                },
            ]
        },
        {
            chapterName: "Advanced Topics",
            articles: [
                {
                    articleName: "Command Line Options",
                    linkPath: "/CommandLineOptions",
                    element: Dummy,
                },
                {
                    articleName: "Local PV",
                    linkPath: "/LocalPv",
                    element: Dummy,
                },
                {
                    articleName: "Rule",
                    linkPath: "/Rule",
                    element: Dummy,
                },
                {
                    articleName: "Python Script",
                    linkPath: "/PythonScript",
                    element: Dummy,
                },
                {
                    articleName: "JavaScript Script",
                    linkPath: "/JavaScriptScript",
                    element: Dummy,
                },
            ]
        },
        {
            chapterName: "Tools",
            articles: [
                {
                    articleName: "Probe",
                    linkPath: "/Probe",
                    element: Dummy,
                },
                {
                    articleName: "Data Viewer",
                    linkPath: "/DataViewer",
                    element: Dummy,
                },
                {
                    articleName: "CA Snooper",
                    linkPath: "/CaSnooper",
                    element: Dummy,
                },
                {
                    articleName: "CA Server Watcher",
                    linkPath: "/Casw",
                    element: Dummy,
                },
                {
                    articleName: "Text Editor",
                    linkPath: "/TextEditor",
                    element: Dummy,
                },
                {
                    articleName: "Calculator",
                    linkPath: "/Symbol",
                    element: Dummy,
                },
                {
                    articleName: "Profile & Runtime Info",
                    linkPath: "/ProfileAndRuntimeInfo",
                    element: Dummy,
                },
                {
                    articleName: "TDM Log",
                    linkPath: "/Log",
                    element: Dummy,
                },
            ]
        },
        {
            chapterName: "Static Widgets",
            articles: [
                {
                    articleName: "Label",
                    linkPath: "/Label",
                    element: Dummy,
                },
                {
                    articleName: "Polyline",
                    linkPath: "/Polyline",
                    element: Dummy,
                },
                {
                    articleName: "Arc",
                    linkPath: "/Arc",
                    element: Dummy,
                },
                {
                    articleName: "Rectangle",
                    linkPath: "/Rectangle",
                    element: Dummy,
                },
                {
                    articleName: "Media",
                    linkPath: "/Media",
                    element: Dummy,
                },
                {
                    articleName: "Symbol",
                    linkPath: "/Symbol",
                    element: Dummy,
                },
                {
                    articleName: "Text Symbol",
                    linkPath: "/TextSymbol",
                    element: Dummy,
                },
            ]
        },
        {
            chapterName: "Monitor Widgets",
            articles: [
                {
                    articleName: "Text Update",
                    linkPath: "/TextUpdate",
                    element: Dummy,
                },
                {
                    articleName: "Meter",
                    linkPath: "/Meter",
                    element: Dummy,
                },
                {
                    articleName: "Tank",
                    linkPath: "/Tank",
                    element: Dummy,
                },
                {
                    articleName: "Thermometer",
                    linkPath: "/Thermometer",
                    element: Dummy,
                },
                {
                    articleName: "Binary Image",
                    linkPath: "/BinaryImage",
                    element: Dummy,
                },
                {
                    articleName: "LED",
                    linkPath: "/LED",
                    element: Dummy,
                },
                {
                    articleName: "LED (Multi State)",
                    linkPath: "/LEDMultiState",
                    element: Dummy,
                },
                {
                    articleName: "Byte Monitor",
                    linkPath: "/ByteMonitor",
                    element: Dummy,
                },
            ]

        },
        {
            chapterName: "Control Widgets",
            articles: [
                {
                    articleName: "Text Entry",
                    linkPath: "/TextEntry",
                    element: Dummy,
                },
                {
                    articleName: "Scaled Slider",
                    linkPath: "/ScaledSlider",
                    element: Dummy,
                },
                {
                    articleName: "Spinner",
                    linkPath: "/Spinner",
                    element: Dummy,
                },
                {
                    articleName: "Thumb Wheel",
                    linkPath: "/ThumbWheel",
                    element: Dummy,
                },
                {
                    articleName: "Boolean Button",
                    linkPath: "/Boolean Button",
                    element: Dummy,
                },
                {
                    articleName: "Slide Button",
                    linkPath: "/SlideButton",
                    element: Dummy,
                },
                {
                    articleName: "Check Box",
                    linkPath: "/CheckBox",
                    element: Dummy,
                },
                {
                    articleName: "Choice Button",
                    linkPath: "/ChoiceButton",
                    element: Dummy,
                },
                {
                    articleName: "Combo Box",
                    linkPath: "/ComboBox",
                    element: Dummy,
                },
                {
                    articleName: "Radio Button",
                    linkPath: "/RadioButton",
                    element: Dummy,
                },
            ]

        },
        {
            chapterName: "Complex Widgets",
            articles: [
                {
                    articleName: "Action Button",
                    linkPath: "/ActionButton",
                    element: Dummy,
                },
                {
                    articleName: "Embedded Display",
                    linkPath: "/EmbeddedDisplay",
                    element: Dummy,
                },
                {
                    articleName: "Group",
                    linkPath: "/Group",
                    element: Dummy,
                },
                {
                    articleName: "Probe",
                    linkPath: "/Probe",
                    element: Dummy,
                },
                {
                    articleName: "Data Viewer",
                    linkPath: "/DataViewer",
                    element: Dummy,
                },
                {
                    articleName: "XY Plot",
                    linkPath: "/XYPlot",
                    element: Dummy,
                },
                {
                    articleName: "PV Table",
                    linkPath: "/PvTable",
                    element: Dummy,
                },
                {
                    articleName: "Terminal",
                    linkPath: "/Terminal",
                    element: Dummy,
                },
                {
                    articleName: "Calculator",
                    linkPath: "/Calculator",
                    element: Dummy,
                },
                {
                    articleName: "Channel Graph",
                    linkPath: "/ChannelGraph",
                    element: Dummy,
                },
            ]

        },


    ];
    // level-1 properties in tdl file
    // _type: string;
    // _widgetKey: string;
    // _style: Record<string, any>;
    // _text: Record<string, any>;
    // _channelNames: string[];
    // _groupNames: string[] = undefined;

    // sidebar
    // private _sidebar: TextUpdateSidebar;

    // tmp methods
    // private _tmp_mouseMoveOnResizerListener: any = undefined;
    // private _tmp_mouseUpOnResizerListener: any = undefined;

    // widget-specific channels, these channels are only used by this widget
    // private _tcaChannels: TcaChannel[];

    // used for the situation of shift key pressed + mouse down on a selected widget,
    // so that when the mouse is up, the widget is de-selected
    // its value is changed in 3 places: this.select2(), this._handleMouseMove() and this._handleMouseUp()
    // private _readyToDeselect: boolean = false;

    // _rules: TextUpdateRules;

    constructor(widgetTdl: type_Help_tdl) {
        super(widgetTdl);
        // so that we can click links
        this.setReadWriteType("write");

        this.setStyle({ ...Help._defaultTdl.style, ...widgetTdl.style });
        this.setText({ ...Help._defaultTdl.text, ...widgetTdl.text });

        // this._rules = new TextUpdateRules(this, widgetTdl);

        // this._sidebar = new TextUpdateSidebar(this);
    }

    // ------------------------- event ---------------------------------

    // defined in widget, invoked in sidebar
    // (1) determine which tdl property should be updated
    // (2) calculate new value
    // (3) assign new value
    // (4) add this widget as well as "GroupSelection2" to g_widgets1.forceUpdateWidgets
    // (5) flush
    updateFromSidebar = (event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        // todo: remove this method
    };

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

    // element = <> body (area + resizer) + sidebar </>

    // Body + sidebar
    _ElementRaw = () => {
        this.setRulesStyle({});
        this.setRulesText({});
        const rulesValues = this.getRules()?.getValues();
        if (rulesValues !== undefined) {
            this.setRulesStyle(rulesValues["style"]);
            this.setRulesText(rulesValues["text"]);
        }

        // must do it for every widget
        g_widgets1.removeFromForceUpdateWidgets(this.getWidgetKey());
        this.renderChildWidgets = true;
        React.useEffect(() => {
            this.renderChildWidgets = false;
        });

        return (
            <ErrorBoundary style={this.getStyle()} widgetKey={this.getWidgetKey()} >
                <>
                    <this._ElementBody></this._ElementBody>
                    {this._showSidebar() ? this._sidebar?.getElement() : null}
                </>
            </ErrorBoundary>
        );
    };


    getElementFallbackFunction = () => {
        return this._ElementFallback;
    }

    // Text area and resizers
    _ElementBodyRaw = (): JSX.Element => {
        return (
            // always update the div below no matter the TextUpdateBody is .memo or not
            // TextUpdateResizer does not update if it is .memo
            <div style={this.getElementBodyRawStyle()}>
                <this._ElementArea></this._ElementArea>
                {this._showResizers() ? <this._ElementResizer /> : null}
            </div>
        );
    };

    refScrollElement: any = undefined;

    getScrollbarWidth = () => {
        if (this.refScrollElement !== undefined && this.refScrollElement.current !== null) {
            return this.refScrollElement.current.offsetWidth - this.refScrollElement.current.clientWidth;
        } else {
            return 0;
        }
    }

    // only shows the text, all other style properties are held by upper level _ElementBodyRaw
    _ElementAreaRaw = ({ }: any): JSX.Element => {

        const refElement = React.useRef<any>(null);
        this.refScrollElement = refElement;

        return (
            <div
                ref={refElement}
                style={{
                    display: "inline-flex",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    // userSelect: "none",
                    overflow: "scroll",
                    // whiteSpace: this.getAllText().wrapWord ? "normal" : "pre",
                    whiteSpace: "normal",
                    justifyContent: this.getAllText().horizontalAlign,
                    alignItems: this.getAllText().verticalAlign,
                    fontFamily: this.getAllStyle().fontFamily,
                    fontSize: this.getAllStyle().fontSize,
                    fontStyle: this.getAllStyle().fontStyle,
                    fontWeight: this.getAllStyle().fontWeight,
                    outline: this._getElementAreaRawOutlineStyle(),
                    color: this.getAllStyle()["color"],
                }}
                // title={"tooltip"}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                {/* <div
                    style={{
                        opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
                    }}
                >{`${this._getChannelValue()} ${this.getAllText()["showUnit"] === true ? this._getChannelUnit() : ""}`}</div> */}
                <this._ElementHelp></this._ElementHelp>
            </div>
        );
    };
    // ------------------------------------------------------


    NavigationItem = ({ articleName, linkPath, element, isSelected, insideChapter, chapterName }: any) => {
        const navigate = useNavigate();
        const elementRef = React.useRef<any>(null);
        const [, forceUpdate] = React.useState({});

        this.navigationUpdaters[linkPath] = forceUpdate;
        return (
            <div
                ref={elementRef}
                style={{
                    width: "100%",
                    // backgroundColor: "red",
                    borderLeft: insideChapter === true ? "none" : this.selectedLinkPath === linkPath ? "solid 1px rgba(0, 120, 51, 1)" : "solid 1px rgba(180, 180, 180, 1)",
                    color: this.selectedLinkPath === linkPath ? "rgba(0,120,51,1)" : "rgba(147,147,147,1)",
                    height: insideChapter ? 20 : 25,
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: insideChapter ? 13 : 13,
                    fontWeight: insideChapter ? "thin" : "bold",
                }}
                onClick={() => {
                    const oldSelectedLinkPath = this.selectedLinkPath;
                    this.selectedLinkPath = linkPath;
                    // update old selected link
                    if (this.navigationUpdaters[oldSelectedLinkPath] !== undefined) {
                        this.navigationUpdaters[oldSelectedLinkPath]({});
                    }
                    // no need to update sidebar appearance, only navigate to 
                    navigate(linkPath);

                    const oldSelectedChapter = this.selectedChapter;
                    const oldExpandedChapter = this.expandedChapter;
                    if (!insideChapter) {
                        this.selectedChapter = "";
                        this.expandedChapter = "";
                    } else {
                        this.selectedChapter = chapterName;
                        this.expandedChapter = chapterName;
                    }
                    if (this.navigationUpdaters[this.selectedChapter] !== undefined) {
                        this.navigationUpdaters[this.selectedChapter]({});
                    }
                    if (this.navigationUpdaters[oldSelectedChapter] !== undefined) {
                        this.navigationUpdaters[oldSelectedChapter]({});
                    }
                    if (this.navigationUpdaters[this.expandedChapter] !== undefined) {
                        this.navigationUpdaters[this.expandedChapter]({});
                    }
                    if (this.navigationUpdaters[oldExpandedChapter] !== undefined) {
                        this.navigationUpdaters[oldExpandedChapter]({});
                    }
                    if (this.navigationUpdaters[chapterName] !== undefined) {
                        this.navigationUpdaters[chapterName]();
                    }
                }}
                onMouseEnter={() => {
                    if (elementRef.current !== null) {
                        elementRef.current.style["cursor"] = "pointer";
                        if (this.selectedLinkPath !== linkPath) {
                            elementRef.current.style["color"] = "rgba(30,30,30,1)";
                            if (!insideChapter) {
                                elementRef.current.style["borderLeft"] = "solid 1px rgba(0, 120, 51, 1)";
                            }
                        }
                    }
                }}
                onMouseLeave={() => {
                    if (elementRef.current !== null) {

                        elementRef.current.style["cursor"] = "default";
                        if (this.selectedLinkPath !== linkPath) {
                            elementRef.current.style["color"] = "rgba(147, 147,147,1)";
                            if (!insideChapter) {
                                elementRef.current.style["borderLeft"] = "solid 1px rgba(180, 180, 180, 1)";
                            }
                        }
                    }
                }}
            >
                <div style={{
                    width: "100%",
                    paddingLeft: insideChapter ? 10 : 15,
                    boxSizing: "border-box",

                }}>
                    {
                        (() => {
                            if (insideChapter) {
                                return articleName;
                            } else {
                                return articleName.toUpperCase();
                            }
                        })()
                    }
                </div>
            </div>
        )
    }


    // NavigationChapter = ({ articleName, linkPath, element, isSelected }: any) => {
    NavigationChapter = ({ chapterName, articles, isSelected }: any) => {

        const elementRef = React.useRef<any>(null);
        const elementTitleRef = React.useRef<any>(null);
        const elementDownArrowRef = React.useRef<any>(null);

        const linkPaths = articles.map((article: type_article) => {
            return article["linkPath"];
        })

        const [, forceUpdate] = React.useState({});
        this.navigationUpdaters[chapterName] = forceUpdate;

        return (
            <div
                ref={elementRef}
                style={{
                    width: "100%",
                    borderLeft: linkPaths.includes(this.selectedLinkPath) ? "solid 1px rgba(0, 120, 51, 1)" : "solid 1px rgba(180, 180, 180, 1)",
                    display: "inline-flex",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    fontSize: 14,
                    fontWeight: "thin",
                    flexDirection: "column",
                }}
                onMouseEnter={() => {
                    if (elementRef.current !== null) {
                        if (!linkPaths.includes(this.selectedLinkPath)) {
                            elementRef.current.style["borderLeft"] = "solid 1px rgba(0, 120, 51, 1)";
                        }
                    }
                }}
                onMouseLeave={() => {
                    if (elementRef.current !== null) {
                        if (!linkPaths.includes(this.selectedLinkPath)) {
                            elementRef.current.style["borderLeft"] = "solid 1px rgba(180, 180, 180, 1)";
                        }
                    }
                }}
            >
                {/* chapter title */}
                <div
                    ref={elementTitleRef}
                    style={{
                        width: "100%",
                        paddingLeft: 15,
                        boxSizing: "border-box",
                        height: 25,
                        display: "inline-flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexDirection: "row",
                        fontWeight: "bold",
                        // color: "rgba(120,120,120,1)",
                        opacity: 0.4
                    }}
                    onMouseEnter={() => {
                        if (elementTitleRef.current !== null) {
                            elementTitleRef.current.style["cursor"] = "pointer";
                            // elementTitleRef.current.style["color"] = "rgba(30,30,30,1)";
                            elementTitleRef.current.style["opacity"] = 0.8;
                        }
                        if (elementDownArrowRef.current !== null && this.expandedChapter !== chapterName) {
                            elementDownArrowRef.current.style["display"] = "inline-flex";
                        }
                    }}
                    onMouseLeave={() => {
                        if (elementTitleRef.current !== null) {
                            elementTitleRef.current.style["cursor"] = "default";
                            elementTitleRef.current.style["opacity"] = 0.4;
                        }
                        if (elementDownArrowRef.current !== null && this.expandedChapter !== chapterName) {
                            elementDownArrowRef.current.style["display"] = "none";
                        }
                    }}

                    onClick={() => {
                        // collapse the other chapter
                        const oldExpandedChapter = this.expandedChapter;
                        this.expandedChapter = chapterName;
                        if (oldExpandedChapter !== this.expandedChapter) {
                            if (this.navigationUpdaters[oldExpandedChapter] !== undefined) {
                                this.navigationUpdaters[oldExpandedChapter]({});
                            }
                            if (this.navigationUpdaters[this.expandedChapter] !== undefined) {
                                this.navigationUpdaters[this.expandedChapter]({});
                            }
                        } else {
                            this.expandedChapter = "";
                            if (this.navigationUpdaters[oldExpandedChapter] !== undefined) {
                                this.navigationUpdaters[oldExpandedChapter]({});
                            }
                        }
                    }}
                >
                    <div>{chapterName.toUpperCase()}</div>
                    <div
                        style={{
                            display: this.expandedChapter === chapterName ? "inline-flex" : "none",
                        }}
                        ref={elementDownArrowRef}>
                        {this.expandedChapter === chapterName ? <><img src="../../resources/webpages/arrowUp.svg" width="10px"></img></> : <><img src="../../resources/webpages/arrowDown.svg" width="10px"></img></>}
                    </div>
                </div>
                {/* articles */}
                <div
                    style={{
                        width: "100%",
                        marginLeft: 15,
                        display: this.expandedChapter === chapterName ? "inline-flex" : "none",
                        justifyContent: "flex-start",
                        alignItems: "flex-start",
                        flexDirection: "column",
                    }}>
                    {articles.map((article: type_article, index: number) => {
                        const articleName = article["articleName"];
                        const linkPath = article["linkPath"];
                        const element = article["element"];
                        const insideChapter = true;
                        return <this.NavigationItem
                            key={`${articleName}-${linkPath}-${index}`}
                            articleName={articleName}
                            linkPath={linkPath}
                            element={element}
                            insideChapter={insideChapter}
                            isSelected={false}
                            chapterName={chapterName}
                        ></this.NavigationItem>
                    })}
                </div>
            </div>
        )
    }


    _ElementHelp = () => {
        this.navigationUpdaters = {}

        const [, forceUpdate] = React.useState({});
        this.forceUpdate = forceUpdate;

        const [topBannerWidth, setTopBannerWidth] = React.useState("100%");

        React.useEffect(() => {
            setTopBannerWidth(`calc(100% - ${this.getScrollbarWidth()}px)`);
        }, [])

        // scroll to top, the scroll bar is in the ElementArea, not in the window or the children element
        // the window.scrollTo() does not work
        const ScrollToTop = () => {
            const { pathname } = useLocation();
            React.useEffect(() => {
                if (this.refScrollElement !== undefined && this.refScrollElement.current !== null) {
                    this.refScrollElement.current.scrollTop = 0;
                }
            }, [pathname]);
            return null;
        };

        return (
            <Router>
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        display: "inline-flex",
                        flexDirection: "column",
                        fontFamily: "sans-serif",
                        boxSizing: "border-box",
                        padding: 0,
                        paddingTop: 0,
                        justifyContent: "flex-start",
                        alignItems: "center",
                        // backgroundColor: "rgba(255,255,0,1)",
                    }}>
                    <ScrollToTop></ScrollToTop>
                    {/* top banner, fixed position */}
                    <div style={{
                        display: "inline-flex",
                        justifyContent: "center",
                        alignItems: 'center',
                        position: "fixed",
                        width: topBannerWidth,
                        height: 50,
                        backgroundColor: "#2c2c32",
                        flexDirection: "row",
                        zIndex: 1,
                        boxSizing: "border-box",
                    }}>
                        <div style={{
                            width: 200,
                            paddingLeft: 25,
                            paddingRight: 10,
                            boxSizing: "border-box",
                            display: "inline-flex",
                            alignItems: "center",
                            height: 50,
                        }}>
                            <img src="../../resources/webpages/tdm-logo.svg" height="50%"></img>
                            <div style={{
                                marginLeft: 15,
                                fontSize: 20,
                                fontWeight: "lighter",
                                color: "white",
                            }}>
                                TDM
                            </div>

                        </div>
                        <div style={{
                            maxWidth: 600,
                            boxSizing: "border-box",
                        }}>
                            <div style={{
                                width: 600
                            }}></div>
                        </div> 
                         <div style={{
                            width: 200,
                            paddingLeft: 10,
                            paddingRight: 25,
                            boxSizing: "border-box",
                            backgroundColor: "blue"
                        }}>
                        </div>

                    </div>
                    {/* navigation and contents */}
                    <div style={{
                        marginTop: 50,
                        display: "inline-flex",
                        flexDirection: "row",
                    }}>
                        {/* navigation */}
                        <div style={{
                            width: 230,
                            paddingLeft: 25,
                            paddingRight: 10,
                            boxSizing: "border-box",
                            marginTop: 50,
                            position: "sticky",
                            top: 100,
                            height: 800,
                            display: "inline-flex",
                            flexDirection: "column",
                        }}>
                            {this.data.map((content: type_article | type_chapter, index: number) => {
                                if ("articleName" in content) {
                                    const article = content;
                                    const articleName = article["articleName"];
                                    const linkPath = article["linkPath"];
                                    const element = article["element"];
                                    return <this.NavigationItem
                                        key={`${articleName}-${index}`}
                                        articleName={articleName}
                                        linkPath={linkPath}
                                        element={element}
                                        insideChapter={false} >
                                    </this.NavigationItem>
                                } else if ("chapterName" in content) {
                                    const chapter = content;
                                    const chapterName = chapter["chapterName"];
                                    const articles = chapter["articles"];
                                    return <this.NavigationChapter chapterName={chapterName} articles={articles}></this.NavigationChapter>
                                } else {
                                    return <></>
                                }

                            })}
                        </div>
                        {/* contents, router */}
                        <div style={{
                            // backgroundColor: "rgba(0, 255, 0, 0.5)",
                            width: "calc(100% - 230px)",
                            maxWidth: 700,
                            // paddingRight: 25,
                            boxSizing: "border-box",
                            marginTop: 20,
                            display: "flex",
                        }}>
                            <Routes>
                                <Route
                                    path="/"
                                    key={`root`}
                                    element={Overview(this, "/Overview")}
                                ></Route>
                                {
                                    (() => {
                                        const result: React.ReactElement[] = [];
                                        for (let index = 0; index < this.data.length; index++) {
                                            const content = this.data[index];
                                            if ("articleName" in content) {
                                                // an article
                                                const article = content;
                                                const articleName = article["articleName"];
                                                const linkPath = article["linkPath"] as string;
                                                const element = article["element"];
                                                // instead of <Home />, we use return value of the function
                                                // they run only once
                                                result.push(<Route
                                                    key={`${articleName}-${index}`}
                                                    path={linkPath}
                                                    element={element(this, linkPath)}
                                                />)
                                            } else if ("chapterName" in content) {
                                                // a chapter
                                                const articles = content["articles"];
                                                // map all articles
                                                for (let article of articles) {
                                                    const articleName = article["articleName"];
                                                    const linkPath = article["linkPath"] as string;
                                                    const element = article["element"];
                                                    Log.debug("register route", articleName, linkPath)
                                                    result.push(<Route
                                                        key={`${articleName}-${index}`}
                                                        path={linkPath}
                                                        element={element(this, linkPath)}
                                                    />)

                                                }
                                            } else {
                                                return <></>
                                            }
                                        }
                                        return result;
                                    })()
                                }
                            </Routes>

                        </div>
                        {/* blank patch on the right */}
                        <div style={{
                            width: 200,
                            paddingRight: 25,
                            paddingLeft: 10,
                            boxSizing: "border-box",
                            marginTop: 50,
                        }}>

                        </div>
                    </div>
                </div>
                {/* </div> */}
            </Router >
        );
    };

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());
    _ElementBody = React.memo(this._ElementBodyRaw, () => this._useMemoedElement());

    // defined in super class
    // getElement()
    // getSidebarElement()
    // _ElementResizerRaw
    // _ElementResizer

    // -------------------- helper functions ----------------

    // defined in super class
    // _showSidebar()
    // _showResizers()
    // _useMemoedElement()
    // hasChannel()
    // isInGroup()
    // isSelected()
    // _getElementAreaRawOutlineStyle()

    _parseChannelValueElement = (channelValueElement: number | string | boolean | undefined) => {
        // const channelValue = this.getChannelValueForMonitorWidget(raw);

        if (typeof channelValueElement === "number") {
            const scale = Math.max(this.getAllText()["scale"], 0);
            const format = this.getAllText()["format"];
            if (format === "decimal") {
                return channelValueElement.toFixed(scale);
            } else if (format === "default") {
                const channelName = this.getChannelNames()[0];
                const defaultScale = g_widgets1.getChannelPrecision(channelName);
                if (defaultScale !== undefined) {
                    return channelValueElement.toFixed(defaultScale);
                } else {
                    return channelValueElement.toFixed(scale);
                }
            } else if (format === "exponential") {
                return channelValueElement.toExponential(scale);
            } else if (format === "hexadecimal") {
                return `0x${channelValueElement.toString(16)}`;
            } else if (format === "string") {
                // MacOS ignores the non-displayable characters, but Linux shows rectangle for these characters
                if (channelValueElement >= 32 && channelValueElement <= 126) {
                    return `${String.fromCharCode(channelValueElement)}`;
                } else {
                    return "";
                }
            } else {
                return channelValueElement;
            }
        } else {
            return `${channelValueElement}`;
        }
    };

    // only for TextUpdate and TextEntry
    // they are suitable to display array data in various formats,
    // other types of widgets, such as Meter, Spinner, Tanks, ProgressBar, Thermometer, ScaledSlider are not for array data
    _getChannelValue = (raw: boolean = false) => {
        const channelValue = this.getChannelValueForMonitorWidget(raw);

        if (typeof channelValue === "number" || typeof channelValue === "string") {
            return this._parseChannelValueElement(channelValue);
        } else if (Array.isArray(channelValue)) {
            const result: any[] = [];
            for (let element of channelValue) {
                result.push(this._parseChannelValueElement(element));
            }
            if (this.getAllText()["format"] === "string") {
                return result.join("");
            } else {
                return result;
            }
        } else {
            return channelValue;
        }
    };

    _getChannelSeverity = () => {
        return this._getFirstChannelSeverity();
    };

    _getChannelUnit = () => {
        const unit = this._getFirstChannelUnit();
        if (unit === undefined) {
            return "";
        } else {
            return unit;
        }
    };

    // ----------------------- styles -----------------------

    // defined in super class
    // _resizerStyle
    // _resizerStyles
    // StyledToolTipText
    // StyledToolTip

    // -------------------------- tdl -------------------------------

    // properties when we create a new TextUpdate
    // the level 1 properties all have corresponding public or private variable in the widget

    static _defaultTdl: type_Help_tdl = {
        type: "Help",
        widgetKey: "", // "key" is a reserved keyword
        key: "",
        style: {
            // basics
            position: "absolute",
            display: "inline-block",
            // dimensions
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(255, 255, 255, 1)",
            // angle
            transform: "rotate(0deg)",
            // border, it is different from the "alarmBorder" below,
            borderStyle: "solid",
            borderWidth: 0,
            borderColor: "rgba(0, 0, 0, 1)",
            // font
            color: "rgba(0,0,0,1)",
            fontFamily: GlobalVariables.defaultFontFamily,
            fontSize: GlobalVariables.defaultFontSize * 1.1,
            fontStyle: GlobalVariables.defaultFontStyle,
            fontWeight: GlobalVariables.defaultFontWeight,
            // shows when the widget is selected
            outlineStyle: "none",
            outlineWidth: 1,
            outlineColor: "black",
        },
        text: {
            // text
            horizontalAlign: "flex-start",
            verticalAlign: "flex-start",
            wrapWord: false,
            showUnit: true,
            // actually "alarm outline"
            alarmBorder: true,
            invisibleInOperation: false,
            // default, decimal, exponential, hexadecimal
            format: "default",
            // scale, >= 0
            scale: 0,
        },
        channelNames: [],
        groupNames: [],
        rules: [],
    };

    // not getDefaultTdl(), always generate a new key
    static generateDefaultTdl = (type: string): Record<string, any> => {
        const result = super.generateDefaultTdl(type);
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        return result;
    };


    // static method for generating a widget tdl with external PV name
    static generateWidgetTdl = (utilityOptions: Record<string, any>): type_Help_tdl => {
        // utilityOptions = {} for it
        const result = this.generateDefaultTdl("Help");
        // result.text["externalMacros"] = utilityOptions["externalMacros"];
        // result.text["tdlFileName"] = utilityOptions["tdlFileName"];
        return result as type_Help_tdl;
    };

    // defined in super class
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
    // getUpdateFromWidget()
    // getResizerStyle()
    // getResizerStyles()
    // getRules()

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

    // --------------------- sidebar --------------------------
    createSidebar = () => {
        // if (this._sidebar === undefined) {
        //     this._sidebar = new HelpSidebar(this);
        // }
    }
}
