import * as React from "react";
import { calcSidebarWidth, GlobalVariables } from "../../global/GlobalVariables";
import { Collapsible } from "../ColorPicker/Collapsible";
import { Canvas } from "./Canvas";
import { SidebarCanvasScript } from "../SidebarComponents/SidebarCanvasScript";
import { Log } from "../../../mainProcess/log/Log";
import { g_widgets1 } from "../../global/GlobalVariables";
import * as GlobalMethods from "../../global/GlobalMethods";
import { g_flushWidgets } from "../Root/Root";
import { ElementMacroInput, ElementMacroTr, ElementButton, ElementMacroTd } from "../SharedElements/MacrosTable";
import { SidebarLargeInput } from "../../widgets/BaseWidget/SidebarLargeInput";
import { zIndex } from "html2canvas/dist/types/css/property-descriptors/z-index";

export class CanvasSidebar {
    private _widgetKey: string;
    private _mainWidget: Canvas;
    private _sidebarCanvasScript: SidebarCanvasScript;
    private _sidebarLargeInput: SidebarLargeInput;

    // mock up definiton to silence TypeScript
    updateFromWidget = (event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean) => { };

    constructor(canvas: Canvas) {
        this._mainWidget = canvas;
        this._widgetKey = this._mainWidget.getWidgetKey() + "_sidbar";
        this._sidebarCanvasScript = new SidebarCanvasScript(this);
        this._sidebarLargeInput = new SidebarLargeInput();
    }

    getSidebarCanvasScript = () => {
        return this._sidebarCanvasScript;
    }

    // ---------------------- elements ------------------------
    private _Element = () => {
        // when we move the widget out of vertical range, the sidebar width is not calculated correctly due to the asynchronous 
        // calculation of window size, 
        // check the window vertical scrollbar width one more time to have a correct sidebar width
        const [sidebarWidthUpdater, setSidebarWidthUpdater] = React.useState<number>(calcSidebarWidth());
        React.useEffect(() => {
            if (sidebarWidthUpdater !== calcSidebarWidth()) {
                setSidebarWidthUpdater(calcSidebarWidth());
                g_widgets1.updateSidebar(true);
            }
        })

        // for updating sidebar display
        const [width, setWidth] = React.useState<number>(this._mainWidget.getStyle().width);
        const [height, setHeight] = React.useState<number>(this._mainWidget.getStyle().height);
        const [windowName, setWindowName] = React.useState<string>(this._mainWidget.getWindowName());
        // const [macros, setMacros] = React.useState<[string, string][]>(this._mainWidget.getMacros());
        const [xGridSize, setXGridSize] = React.useState<number>(this._mainWidget.getXGridSize())
        const [yGridSize, setYGridSize] = React.useState<number>(this._mainWidget.getYGridSize())

        const [showGrid, setShowGrid] = React.useState<boolean>(this._mainWidget.getShowGrid())

        // defined in sidebar, invoked from main widget
        const _updateFromWidget = React.useCallback(
            (event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean): void => {
                switch (propertyName) {
                    case "width":
                        setWidth(propertyValue as number);
                        break;
                    case "height":
                        setHeight(propertyValue as number);
                        break;
                    case "select-a-file":
                        this.getSidebarCanvasScript().getUpdateFromWidget()(propertyValue as string);
                        break;

                    default:
                        Log.error("Unknown property from sidebar: ", propertyName);
                }
            },
            []
        );
        this.updateFromWidget = _updateFromWidget;

        // update locally
        const updateValue = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
            const newVal = event.target.value;
            switch (event.target.name) {
                case "width":
                    setWidth(parseInt(newVal));
                    break;
                case "height":
                    setHeight(parseInt(newVal));
                    break;
                case "windowName":
                    setWindowName(newVal as string);
                    break;
                //illegal name
                default:
                    Log.error("Sidebar illegal name", event.target.name);
                    throw new Error();
            }
        }, []);

        return (
            <div style={{ ...this._style, width: calcSidebarWidth() }}
                onMouseDown={this.handleMouseDown}
            >
                <h3>Canvas</h3>
                <div
                    style={{
                        marginTop: 2,
                        marginBottom: 2,
                    }}
                >
                    <b>Window</b>
                </div>

                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        marginTop: 2,
                        marginBottom: 2,
                    }}
                >
                    <form
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.getUpdateFromSidebar()(event, "windowName", windowName)}
                        style={this._formStyle}
                    >
                        <this._ElementInputLabel
                            value={`${windowName}`}
                            setValue={setWindowName}
                            readableText={"Window Title"}
                            updater={(newValue: string) => this.getUpdateFromSidebar()(undefined, "windowName", newValue)}
                        >
                            Title:
                        </this._ElementInputLabel>
                        <input
                            style={this._inputStyle}
                            type="text"
                            name="windowName"
                            value={windowName}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateValue(event)}
                            onBlur={(event: any) => {
                                if (this._mainWidget.getWindowName() !== windowName) {
                                    setWindowName(this._mainWidget.getWindowName());
                                }
                            }}
                        />
                    </form>
                </div>


                <this._HorizontalLine />

                <div
                    style={{
                        marginTop: 2,
                        marginBottom: 2,
                    }}
                >
                    <b>Position</b>
                </div>
                {/* width and height */}
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        marginTop: 2,
                        marginBottom: 2,
                    }}
                >
                    <form
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.getUpdateFromSidebar()(event, "width", width)}
                        style={this._formStyle}
                    >
                        <div>Width:</div>
                        <input
                            style={this._inputStyle}
                            type="number"
                            name="width"
                            value={width}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateValue(event)}
                            onBlur={(event: any) => {
                                if (parseInt(this._mainWidget.getStyle().width) !== width) {
                                    setWidth(parseInt(this._mainWidget.getStyle().width));
                                }
                            }}
                        />
                    </form>

                    <form
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.getUpdateFromSidebar()(event, "height", height)}
                        style={{
                            display: "inline-flex",
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: 2,
                            marginBottom: 2,
                        }}
                    >
                        <div>Height:</div>
                        <input
                            style={this._inputStyle}
                            type="number"
                            name="height"
                            value={height}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateValue(event)}
                            onBlur={(event: any) => {
                                if (parseInt(this._mainWidget.getStyle().height) !== height) {
                                    setHeight(parseInt(this._mainWidget.getStyle().height));
                                }
                            }}
                        />
                    </form>
                </div>

                <this._HorizontalLine />
                <div
                    style={{
                        marginTop: 2,
                        marginBottom: 2,
                    }}
                >
                    <b>Channel</b>
                </div>
                {/* macros */}
                <this._Macros />

                <this._HorizontalLine />

                <this._BlockBody>
                    {this.getSidebarCanvasScript().getElement()}
                </this._BlockBody>{" "}
                <this._HorizontalLine />

                <div
                    style={{
                        marginTop: 2,
                        marginBottom: 2,
                    }}
                >
                    <b>Background</b>
                </div>
                {/* background color */}
                <Collapsible
                    rgbColorStr={this._mainWidget.getStyle().backgroundColor}
                    updateFromSidebar={this.getUpdateFromSidebar()}
                    title={"Color"}
                    eventName={"background-color"}
                />

                <this._HorizontalLine />
                <div
                    style={{
                        marginTop: 2,
                        marginBottom: 2,
                    }}
                >
                    <b>Grids</b>
                </div>

                {/* x grid size */}
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        marginTop: 2,
                        marginBottom: 2,
                    }}
                >
                    <form
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            event.preventDefault()
                            this._mainWidget.setXGridSize(xGridSize);

                            const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
                            history.registerAction();

                            g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
                            g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                            g_flushWidgets();

                        }}
                        style={this._formStyle}
                    >
                        <div>X size:</div>
                        <input
                            style={this._inputStyle}
                            type="text"
                            name="xGridSize"
                            value={xGridSize}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                const value = parseInt(event.target.value);
                                if (!isNaN(value)) {
                                    setXGridSize(parseInt(event.target.value));
                                } else {
                                    Log.error("X Grid Size is not a number, cannot change it");
                                }
                            }}
                            onBlur={(event: any) => {
                                if (this._mainWidget.getXGridSize() !== xGridSize) {
                                    setXGridSize(this._mainWidget.getXGridSize());
                                }
                            }}
                        />
                    </form>
                </div>
                {/* y grid size */}
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        marginTop: 2,
                        marginBottom: 2,
                    }}
                >
                    <form
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                            event.preventDefault()
                            this._mainWidget.setYGridSize(yGridSize);
                            const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
                            history.registerAction();
                            g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
                            g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                            g_flushWidgets();

                        }}
                        style={this._formStyle}
                    >
                        <div>Y size:</div>
                        <input
                            style={this._inputStyle}
                            type="text"
                            name="yGridSize"
                            value={yGridSize}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                const value = parseInt(event.target.value);
                                if (!isNaN(value)) {
                                    setYGridSize(parseInt(event.target.value));
                                } else {
                                    Log.error("Y Grid Size is not a number, cannot change it");
                                }
                            }}
                            onBlur={(event: any) => {
                                if (this._mainWidget.getYGridSize() !== yGridSize) {
                                    setYGridSize(this._mainWidget.getYGridSize());
                                }
                            }}
                        />
                    </form>
                </div>
                {/* grid color */}
                <Collapsible
                    rgbColorStr={this._mainWidget.getGridColor()}
                    updateFromSidebar={(event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
                        // this.updateWidget(event, propertyValue);
                        const newVal = GlobalMethods.rgbaArrayToRgbaStr(propertyValue as number[]);
                        const oldVal = this._mainWidget.getGridColor();
                        if (newVal === oldVal) {
                            return;
                        } else {
                            this._mainWidget.setGridColor(newVal);
                        }

                        // the history is handled inside Collapsible

                        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
                        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                        g_flushWidgets();

                    }}
                    title={"Color"}
                    eventName={"grid-color"}
                />
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 2,
                        marginBottom: 2,
                        width: "100%",
                    }}
                >
                    <div>Show Grids:</div>
                    <form
                        style={{
                            display: "inline-flex",
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            // marginTop: 2,
                            // marginBottom: 2,
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={showGrid}
                            onChange={(event: any) => {
                                // this.updateWidget(event, !invisibleInOperation);
                                this._mainWidget.setShowGrid(!showGrid);

                                g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
                                g_widgets1.addToForceUpdateWidgets("GroupSelection2");
                                g_flushWidgets();

                                setShowGrid((prevVal: boolean) => {
                                    return !prevVal;
                                });
                            }}
                        />
                    </form>
                </div>
                {this.getSidebarWidgetsList().getElement()}

            </div >
        );
    };


    _BlockTitle = ({ children }: any) => {
        return (
            <div
                style={{
                    marginTop: 2,
                    marginBottom: 2,
                    width: "100%",
                }}
            >
                {children}
            </div>
        );
    };



    _BlockBody = ({ children }: any) => {
        return (
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    marginTop: 2,
                    marginBottom: 2,
                    width: "100%",
                }}
            >
                {" "}
                {children}
            </div>
        );
    };

    getElement = (): JSX.Element => {
        return <this._Element key={this._widgetKey}></this._Element>;
    };

    _ElementInputLabel = ({ value, setValue, children, readableText, updater }: any) => {
        return (
            <div
                onClick={() => {
                    this.getSidebarLargeInput().createElement(value, setValue, readableText, updater);
                }}
            >
                {children}
            </div>
        )
    }

    private _Macros = () => {
        const [macros1, setMacros1] = React.useState<[string, string][]>(JSON.parse(JSON.stringify(this._mainWidget.getMacros())));
        const [showContents, setShowContents] = React.useState<boolean>(true);
        const refAddMacro = React.useRef<any>(null);

        const updateValue = (event: any, property: "name" | "value", index: number) => {
            event.preventDefault();

            if (property === "name") {
                setMacros1((prevVal: [string, string][]) => {
                    const newVal: [string, string][] = JSON.parse(JSON.stringify(prevVal));
                    newVal[index] = [event.target.value, newVal[index][1]];
                    return newVal;
                });
            } else {
                setMacros1((prevVal: [string, string][]) => {
                    const newVal: [string, string][] = JSON.parse(JSON.stringify(prevVal));
                    newVal[index] = [newVal[index][0], event.target.value];
                    return newVal;
                });
            }
        };

        //todo: empty key, empty value is allowed
        return (
            <>
                <div style={this._macroLineStyle}>
                    <div>Macros</div>
                    <div
                        style={{
                            fontSize: 18,
                            display: "inline-flex",
                            justifyContent: "center",
                            alignItems: "center",
                            color: "black",
                            cursor: "pointer",
                        }}
                        onClick={() => {
                            setShowContents((prevVal: boolean) => {
                                return !prevVal;
                            });
                        }}
                    >
                        {showContents ? <>&#9663;</> : <>&#9657;</>}
                    </div>
                </div>
                <div
                    style={{
                        display: showContents ? "inline-block" : "none",
                        width: "100%",
                    }}
                >
                    <table
                        style={{
                            margin: 0,
                            padding: 0,
                            borderSpacing: 0,
                            width: "100%",
                        }}
                    >
                        <tbody>
                            <ElementMacroTr index={0}>
                                <ElementMacroTd style={{ width: "40%" }}>
                                    <b>Name</b>
                                </ElementMacroTd>
                                <ElementMacroTd
                                    style={{
                                        borderLeft: "1px solid #dddddd",
                                        paddingLeft: 3,
                                        width: "50%",
                                    }}
                                >
                                    <b>Value</b>
                                </ElementMacroTd>
                                <ElementMacroTd
                                    style={{
                                        width: "10%",
                                    }}
                                >
                                    <ElementButton
                                        onClick={() => {
                                            setMacros1((prevVal: [string, string][]) => {
                                                let newName = "";
                                                const newVal = JSON.parse(JSON.stringify(prevVal));
                                                newVal.push([newName, ""]);
                                                this.getUpdateFromSidebar()(undefined, "macros", newVal);
                                                return newVal;
                                            });
                                        }}
                                    >
                                        <img
                                            src={`../../../webpack/resources/webpages/add-symbol.svg`}
                                            style={{
                                                width: "60%",
                                                height: "60%",
                                            }}
                                        ></img>

                                        {/* &#65291; */}
                                    </ElementButton>
                                </ElementMacroTd>
                            </ElementMacroTr>
                            {macros1.map((item: [string, string], index: number) => {
                                const name = item[0];
                                const value = item[1];
                                return (
                                    <ElementMacroTr key={`${this.getWidgetKey()}-macros-${index}`} index={index + 1}>
                                        <ElementMacroTd style={{ width: "40%" }}>
                                            <form
                                                onSubmit={(event: React.FormEvent<HTMLFormElement>) =>
                                                    this.getUpdateFromSidebar()(event, "macros", macros1)
                                                }
                                                style={this._macroFormStyle}
                                            >
                                                <ElementMacroInput
                                                    type="text"
                                                    value={name}
                                                    placeholder={"name"}
                                                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateValue(event, "name", index)}
                                                    onBlur={(event: any) => {
                                                        if (this._mainWidget.getMacros()[index][0] !== name) {
                                                            setMacros1(JSON.parse(JSON.stringify(this._mainWidget.getMacros())));
                                                        }
                                                    }}
                                                />
                                            </form>
                                        </ElementMacroTd>
                                        <ElementMacroTd
                                            style={{
                                                borderLeft: "1px solid #dddddd",
                                                width: "50%",
                                            }}
                                        >
                                            <form
                                                onSubmit={(event: React.FormEvent<HTMLFormElement>) =>
                                                    this.getUpdateFromSidebar()(event, "macros", macros1)
                                                }
                                                style={{ ...this._macroFormStyle, paddingLeft: 3 }}
                                            >
                                                <ElementMacroInput
                                                    type="text"
                                                    value={value}
                                                    placeholder={"value"}
                                                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateValue(event, "value", index)}
                                                    onBlur={(event: any) => {
                                                        if (this._mainWidget.getMacros()[index][1] !== value) {
                                                            setMacros1(JSON.parse(JSON.stringify(this._mainWidget.getMacros())));
                                                        }
                                                    }}
                                                />
                                            </form>
                                        </ElementMacroTd>
                                        <ElementMacroTd style={{ width: "10%" }}>
                                            <ElementButton
                                                onClick={() => {
                                                    setMacros1((prevVal: [string, string][]) => {
                                                        const newVal = JSON.parse(JSON.stringify(prevVal));
                                                        newVal.splice(index, 1);
                                                        this.getUpdateFromSidebar()(undefined, "macros", newVal);
                                                        return newVal;
                                                    });
                                                }}
                                            >
                                                <img
                                                    src={`../../../webpack/resources/webpages/delete-symbol.svg`}
                                                    style={{
                                                        width: "50%",
                                                        height: "50%",
                                                    }}
                                                ></img>

                                            </ElementButton>
                                        </ElementMacroTd>
                                    </ElementMacroTr>
                                );
                            })}
                        </tbody>
                    </table>
                    <div style={this._macroLineStyle}>
                        <div
                            ref={refAddMacro}
                            style={{
                                display: "inline-flex",
                                justifyContent: "center",
                                alignItems: "center",
                                color: "rgba(100,100,100,1)",
                                cursor: "pointer",
                            }}
                            onClick={() => {
                                setMacros1((prevVal: [string, string][]) => {
                                    let newName = "";
                                    const newVal = JSON.parse(JSON.stringify(prevVal));
                                    newVal.push([newName, ""]);
                                    this.getUpdateFromSidebar()(undefined, "macros", newVal);
                                    return newVal;
                                });
                            }}
                            onMouseEnter={() => {
                                if (refAddMacro.current !== null) {
                                    refAddMacro.current.style["color"] = "rgba(0,0,0,1)";
                                }
                            }}
                            onMouseLeave={() => {
                                if (refAddMacro.current !== null) {
                                    refAddMacro.current.style["color"] = "rgba(100,100,100,1)";
                                }
                            }}
                        >


                            &#65291;
                        </div>
                        <div>&nbsp;</div>
                    </div>
                </div>
            </>
        );
    };

    private _HorizontalLine = () => {
        return <div>&nbsp;</div>;
    };

    // ----------------------- mouse events --------------------
    /**
     * Right click button on side bar: copy/paste/cut, same as BaseWidgetSidebar
     */
    handleMouseDown = (event: React.MouseEvent) => {

        const activeElement = document.activeElement;

        if (event.button === 2 && g_widgets1.isEditing() && activeElement instanceof HTMLInputElement) {
            const hasSelection = window.getSelection() === null ? false : window.getSelection()?.toString() !== "";
            g_widgets1.getRoot().getDisplayWindowClient().getIpcManager().sendFromRendererProcess(
                "show-context-menu-sidebar",
                g_widgets1.isEditing() ? "editing" : "operating",
                g_widgets1.getRoot().getDisplayWindowClient().getWindowId(),
                [],
                { hasSelection: hasSelection },
            )
        }
    }
    // ---------------------- getters -------------------------

    getWidgetKey = (): string => {
        return this._widgetKey;
    };

    getMainWidget = (): Canvas => {
        return this._mainWidget;
    };

    // defined in widget, invoked in sidebar
    getUpdateFromSidebar = (): ((
        event: any,
        propertyName: string,
        propertyValue: number | string | number[] | string[] | [string, string][]
    ) => void) => {
        return this._mainWidget.updateFromSidebar;
    };
    getSidebarWidgetsList = () => {
        return g_widgets1.getSidebarWidgetsList();
    }

    getSidebarLargeInput = () => {
        return this._sidebarLargeInput;
    }
    // ---------------------- style ---------------------------

    private _style: Record<string, any> = {
        // inline-flex
        display: "inline-flex",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        flexDirection: "column",
        // not "absolute"
        position: "fixed",
        // it is not a good practice to manaully assign a z-index to an element
        // but seems there is no other choices
        // zIndex: GlobalVariables.CanvasSidebarZIndex,
        zIndex: 0,
        // box model
        top: 0,
        right: 0,
        margin: 0,
        padding: GlobalVariables.sidebarBorderWidth,
        borderWidth: 0,
        // width: GlobalVariables.sidebarWidth,
        width: 100, // replace by calcSidebarWidth()
        height: "100%",
        overflowX: "hidden",
        overflowY: "scroll",
        userSelect: "none",
        // background color
        backgroundColor: "rgba(255,255,255,1)",
        // separator
        borderStyle: "solid",
        borderLeftWidth: GlobalVariables.sidebarBorderWidth,
        borderColor: "red",
        boxSizing: "border-box",
    };

    private _inputStyle: Record<string, any> = {
        width: "70%",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
    };

    private _formStyle: Record<string, any> = {
        display: "inline-flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 2,
        marginBottom: 2,
    };

    private _macroFormStyle: Record<string, any> = {
        display: "inline-flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 2,
        marginBottom: 2,
        width: "95%",
    };

    private _macroLineStyle: Record<string, any> = {
        display: "inline-flex",
        position: "relative",
        flexDirection: "Row",
        width: "100%",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 2,
        marginBottom: 2,
    };

    // _ElementMacroInput = ({ type, value, placeholder, onChange, onBlur }: any) => {
    //     const refElement = React.useRef<any>(null);
    //     return <input
    //         ref={refElement}
    //         type={type}
    //         spellCheck={false}
    //         placeholder={placeholder}
    //         onChange={onChange}
    //         value={value}
    //         style={{
    //             width: "100%",
    //             padding: 0,
    //             margin: 0,
    //             border: 0,
    //             outline: "none",
    //             backgroundColor: "rgba(0, 0, 0, 0)",
    //             cursor: "text",
    //         }}
    //         onFocus={() => {
    //             if (refElement.current !== null) {
    //                 refElement.current.style["color"] = "blue";
    //             }
    //         }}
    //         onBlur={(event: any) => {
    //             if (refElement.current !== null) {
    //                 refElement.current.style["color"] = "rgba(0,0,0,1)";
    //             }
    //             onBlur(event);
    //         }}
    //     >
    //     </input>
    // }

    // _ElementMacroTr = ({ index, children }: any) => {
    //     return (
    //         <tr
    //             style={{
    //                 backgroundColor: index % 2 === 1 ? "rgba(245, 245, 245, 0)" : "rgba(245, 245, 245, 1)",
    //             }}
    //         >
    //             {children}
    //         </tr>
    //     )
    // }

    // _ElementMacroTd = ({ children, style }: any) => {
    //     return (
    //         <td
    //             style={{
    //                 padding: 0,
    //                 margin: 0,
    //                 ...style
    //             }}
    //         >
    //             {children}
    //         </td>
    //     )
    // }

    // ElementButton = ({ children, onClick }: any) => {
    //     const refElement = React.useRef<any>(null);
    //     return (
    //         <div
    //             ref={refElement}
    //             style={{
    //                 width: 20,
    //                 aspectRatio: "1/1",
    //                 opacity: 0.3,
    //                 display: "inline-flex",
    //                 justifyContent: "center",
    //                 alignItems: "center",
    //                 cursor: "pointer",
    //             }}
    //             onMouseEnter={() => {
    //                 if (refElement.current !== null) {
    //                     refElement.current.style["opacity"] = 1;
    //                 }
    //             }}
    //             onMouseLeave={() => {
    //                 if (refElement.current !== null) {
    //                     refElement.current.style["opacity"] = 0.3;
    //                 }
    //             }}
    //             onClick={() => {
    //                 onClick()
    //             }}
    //         >
    //             {children}
    //         </div>
    //     )
    // }


}
