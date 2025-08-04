
import { Log } from "../../../mainProcess/log/Log";
import * as React from "react";
import { HashRouter, Routes, Route, useNavigate, createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';

import { Overview } from "./contents/Overview";
import { TechnicalOverview } from "./contents/TechnicalOverview";
import { GetStarted } from "./contents/GetStarted";
import { Dummy } from "./contents/Dummy";
import { Profile } from "./contents/Profile";
import { Operation } from "./contents/Operation";
import { Edit } from "./contents/Edit";
import { Macro } from "./contents/Macro";
import { ConfigureWebServer } from "./contents/ConfigureWebServer";

export type type_article = {
    articleName: string,
    linkPath: string,
    element: (widget: Help, linkPath: string) => JSX.Element,
}

export type type_chapter = {
    chapterName: string,
    linkPath: string,
    articles: type_article[];
}

/**
 * this widget should not be explicitly created like others
 */
export class Help {

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
            linkPath: "/BasicTopics",
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
            linkPath: "/AdvancedTopics",
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
            linkPath: "/Tools",
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
                {
                    articleName: "File Converter",
                    linkPath: "/FileConverter",
                    element: Dummy,
                },
            ]
        },
        {
            chapterName: "Static Widgets",
            linkPath: "/StaticWidgets",
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
            linkPath: "/MonitorWidgets",
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
            linkPath: "/ControlWidgets",
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
            linkPath: "/ComplexWidgets",
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
        {
            chapterName: "Web Server",
            linkPath: "/WebServer",
            articles: [
                {
                    articleName: "Configure Web Server",
                    linkPath: "/ConfigureWebServer",
                    element: ConfigureWebServer,
                },
            ]

        },


    ];

    constructor() {
        // process data
        for (const item of this.data) {
            if ("chapterName" in item) {
                const chapterLinkPath = item.linkPath;
                for (const article of item.articles) {
                    article.linkPath = chapterLinkPath + article.linkPath;
                }
            }
        }

        window.addEventListener('wheel', function (event) {
            if (event.ctrlKey) {
                event.preventDefault();
                let zoom = Number(document.body.style.zoom) || 1;
                if (event.deltaY < 0) {
                    zoom = Math.min(zoom + 0.1, 3); // zoom in, max 300%
                } else {
                    zoom = Math.max(zoom - 0.1, 0.2); // zoom out, min 20%
                }
                document.body.style.zoom = `${zoom}`;
            }
        }, { passive: false });
    }
    _Element = () => {

        return (
            <this._ElementBody></this._ElementBody>
        );
    };

    getElment = () => {
        return <this._Element></this._Element>;
    }


    _ElementBody = (): JSX.Element => {
        return (
            <this._ElementArea></this._ElementArea>
        );
    };


    _ElementArea = ({ }: any): JSX.Element => {

        return (<this._ElementHelp></this._ElementHelp>);
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
                    borderLeft: insideChapter === true ? "none" : this.selectedLinkPath === linkPath ? "solid 1px rgba(0, 120, 51, 1)" : "solid 1px rgba(220, 220, 220, 1)",
                    color: this.selectedLinkPath === linkPath ? "rgba(0,120,51,1)" : "rgba(47,47,47,1)",
                    height: insideChapter ? 25 : 30,
                    display: "inline-flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: insideChapter ? 12 : 12,
                    fontWeight: 500,
                    flexShrink: 0,

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
                            elementRef.current.style["color"] = "rgba(47, 47,47,1)";
                            if (!insideChapter) {
                                elementRef.current.style["borderLeft"] = "solid 1px rgba(220, 220, 220, 1)";
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
                                return articleName;
                            }
                        })()
                    }
                </div>
            </div>
        )
    }


    NavigationChapter = ({ chapterName, chapterLinkPath, articles, isSelected }: any) => {

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
                    borderLeft: linkPaths.includes(this.selectedLinkPath) ? "solid 1px rgba(0, 120, 51, 1)" : "solid 1px rgba(220, 220, 220, 1)",
                    display: "inline-flex",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    fontSize: 14,
                    fontWeight: "thin",
                    flexDirection: "column",
                    flexShrink: 0,
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
                            elementRef.current.style["borderLeft"] = "solid 1px rgba(220,220,220, 1)";
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
                        height: 30,
                        display: "inline-flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexDirection: "row",
                        fontWeight: 500,
                        color: "rgba(47,47,47,1)",
                        // opacity: 0.4,
                        paddingRight: 5,
                        fontSize: 12,
                        flexShrink: 0,

                    }}
                    onMouseEnter={() => {
                        if (elementTitleRef.current !== null) {
                            elementTitleRef.current.style["cursor"] = "pointer";
                            elementTitleRef.current.style["color"] = "rgba(30,30,30,1)";
                            // elementTitleRef.current.style["opacity"] = 0.8;
                        }
                        if (elementDownArrowRef.current !== null && this.expandedChapter !== chapterName) {
                            elementDownArrowRef.current.style["display"] = "inline-flex";
                        }
                    }}
                    onMouseLeave={() => {
                        if (elementTitleRef.current !== null) {
                            elementTitleRef.current.style["cursor"] = "default";
                            elementTitleRef.current.style["color"] = "rgba(47,47,47,1)";
                            // elementTitleRef.current.style["opacity"] = 0.4;
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
                    {/* chapter name */}
                    <div>{chapterName.toUpperCase()}</div>
                    {/* arrow */}
                    <div
                        style={{
                            display: this.expandedChapter === chapterName ? "inline-flex" : "none",
                        }}
                        ref={elementDownArrowRef}>
                        {this.expandedChapter === chapterName ? <><img src="resources/webpages/arrowUp.svg" width="10px"></img></> : <><img src="resources/webpages/arrowDown.svg" width="10px"></img></>}
                    </div>
                </div>
                {/* article names */}
                <div
                    style={{
                        width: "100%",
                        marginLeft: 15,
                        overflow: "hidden",
                        maxHeight: this.expandedChapter === chapterName ? 500 : 0, // adjust maxHeight as needed
                        opacity: this.expandedChapter === chapterName ? 1 : 0,
                        display: "flex",
                        justifyContent: "flex-start",
                        alignItems: "flex-start",
                        flexDirection: "column",
                        transition: "max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.4s",

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

    // navigation side bar
    _ElementNavigationSidebar = () => {

        const [showSidebar, setShowSidebar] = React.useState(true);
        const sidebarRef = React.useRef<HTMLDivElement>(null);

        React.useEffect(() => {
            function handleResize() {
                if (sidebarRef.current) {
                    setShowSidebar(window.innerWidth >= 800);
                }
            }
            window.addEventListener("resize", handleResize);
            handleResize();
            return () => window.removeEventListener("resize", handleResize);
        }, []);

        return (
            <div
                ref={sidebarRef}
                style={{
                    minWidth: 200,
                    maxWidth: 200,
                    boxSizing: "border-box",
                    display: showSidebar === true ? "inline-flex" : "none",
                    // position: "relative",
                    flexDirection: "column",
                    whiteSpace: "nowrap", // keep text in one line
                    backgroundColor: "rgba(240, 240, 0, 0)",
                    overflowY: "auto", // let vertical scroll
                    scrollbarWidth: "none",
                    flexShrink: 0, // prevent shrinking, should be on every child element
                    position: "sticky",
                    top: 50,                // <-- height of top bar
                    height: "calc(100vh - 100px)", // fill remaining space below top bar
                    zIndex: 2,              // ensure above content if needed

                }}
            >
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
                        return <this.NavigationChapter
                            key={`${chapterName}-${index}`}
                            chapterName={chapterName}
                            articles={articles}
                            chapterLinkPath={chapter["linkPath"]}
                        ></this.NavigationChapter>
                    } else {
                        return <></>
                    }

                })}
            </div>
        )
    }

    _ElementHelp = () => {
        // HashRouter does not use createBrowserRouter, so we use <HashRouter> and <Routes>/<Route>
        const routes = this.data.map((content: type_article | type_chapter, index: number) => {
            if ("articleName" in content) {
                const article = content;
                return (
                    <Route
                        key={`article-${article.linkPath}-${index}`}
                        path={article.linkPath}
                        element={<this._ElementArticleOrChapter {...article} />}
                    />
                );
            } else if ("chapterName" in content) {
                const chapter = content;
                return (
                    chapter.articles.map((article: type_article, index: number) => {
                        return (
                            <Route
                                key={`article-${article.linkPath}-${index}`}
                                path={article.linkPath}
                                element={<this._ElementArticleOrChapter {...article} />}
                            />
                        );
                    })
                );
            } else {
                Log.error("Help.tsx", "Invalid content type in data", content);
                return (
                    <Route
                        key={`invalid-${index}`}
                        path="/404"
                        element={<div>Not Found</div>}
                    />
                );
            }
        });

        return (
            <HashRouter>
                {/* static parts */}
                <Routes>
                    <Route path="/" element={<this.Layout />}>
                        <Route index element={<this._ElementArticleOrChapter articleName="Overview" linkPath="/Overview" element={Overview} />} />
                        {routes}
                    </Route>
                </Routes>
            </HashRouter>
        );
    };


    Layout = () => {
        return (
            <div style={{
                fontFamily: "Inter, sans-serif",
                width: "100%",
                height: "100%",
                display: "inline-flex",
                justifyContent: "flex-start",
                alignItems: "center",
                flexDirection: "column",
                // overflowY: "hidden", // do not hide
                // overflowX: "hidden",
                boxSizing: "border-box",
                backgroundColor: "rgba(0, 255, 255, 0)",


            }}>
                {/* banner */}
                <this._ElementTopBar></this._ElementTopBar>
                {/* below banner */}
                <div style={{
                    width: "100%",
                    height: "100%",
                    display: "inline-flex",
                    flexDirection: "row",
                    position: "relative",
                    boxSizing: "border-box",
                    padding: 50,
                    maxWidth: 1000,
                }}>
                    {/* sidebar for navigation */}
                    <this._ElementNavigationSidebar></this._ElementNavigationSidebar>
                    {/* content */}
                    <Outlet />
                </div>
            </div>
        );
    }

    _ElementTopBar = () => {
        return (
            <div style={{
                position: "relative",
                width: "100%",
                height: 50,
                boxSizing: "border-box",
            }}>
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: 50,
                    backgroundColor: "#2c2c32",
                    display: "inline-flex",
                    justifyContent: "flex-start",
                    alignItems: 'center',
                    flexDirection: "row",
                    zIndex: 3,
                    boxSizing: "border-box",
                    paddingLeft: 50,
                }}>
                    {/* logo and text */}
                    <div style={{
                        boxSizing: "border-box",
                        display: "inline-flex",
                        alignItems: "center",
                        height: "100%",
                    }}>
                        <img src="resources/webpages/tdm-logo.svg" height="50%"></img>
                        <div style={{
                            marginLeft: 15,
                            fontSize: 20,
                            fontWeight: "lighter",
                            color: "white",
                        }}>
                            TDM
                        </div>
                    </div>
                </div>
            </div>
        );
    }


    // content for router, chapter or article
    _ElementArticleOrChapter = ({ articleName, linkPath, element }: any) => {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    boxSizing: "border-box",
                    display: "inline-flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "center",
                }}
            >
                {element(this, linkPath)}
            </div>
        );
    }

}
