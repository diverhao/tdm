import * as React from "react";
import { GroupSelection2 } from "./GroupSelection2";
import { calcSidebarWidth, g_widgets1, GlobalVariables } from "../../global/GlobalVariables";
import { Log } from "../../global/Log";

export class GroupSelectionSidebar2 {
    private _widgetKey: string;
    private _mainWidget: GroupSelection2;
    // assigned inside _Element
    // mock up definition to silence TypeScript 
    updateFromWidget = (event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean) => { };

    constructor(textUpdate: GroupSelection2) {
        this._mainWidget = textUpdate;
        this._widgetKey = this._mainWidget.getWidgetKey() + "-sidebar";
    }
    // ------------------------------------- elements --------------------------------------

    private _Element = () => {
        // when we move the widget out of vertical range, the sidebar width is not calculated correctly due to the asynchronous 
        // calculation of window size, 
        // check the window vertical scrollbar width one more time to have a correct sidebar width
        const [sidebarWidthUpdater, setSidebarWidthUpdater] = React.useState<number>(calcSidebarWidth());
        React.useEffect(() => {
            console.log("===================+++++++++++++++++++++++++++++++++++++ aaa", calcSidebarWidth(), sidebarWidthUpdater )
            if (sidebarWidthUpdater !== calcSidebarWidth()) {
                console.log("===================+++++++++++++++++++++++++++++++++++++", calcSidebarWidth(), sidebarWidthUpdater )
                setSidebarWidthUpdater(calcSidebarWidth());
                g_widgets1.updateSidebar(true);
            }
        })

        // this element is always rendered after the GroupSelection2.calcSize(), the _leftShown is always up-to-date
        const [left, setLeft] = React.useState<number>(this._mainWidget._leftShown);
        const [top, setTop] = React.useState<number>(this._mainWidget._topShown);
        const [width, setWidth] = React.useState<number>(this._mainWidget._widthShown);
        const [height, setHeight] = React.useState<number>(this._mainWidget._heightShown);

        // useCallback
        const updateFromWidget = React.useCallback(
            (event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean) => {
                switch (propertyName) {
                    case "left":
                        setLeft(propertyValue as number);
                        break;
                    case "top":
                        setTop(propertyValue as number);
                        break;
                    case "width":
                        setWidth(propertyValue as number);
                        break;
                    case "height":
                        setHeight(propertyValue as number);
                        break;
                    default:
                        Log.error("Unknown property from sidebar: ", propertyName);
                        return;
                }
            },
            []
        );

        this.updateFromWidget = updateFromWidget;

        const updateValue = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
            const newVal = event.target.value;
            switch (event.target.name) {
                case "left":
                    setLeft(parseInt(newVal));
                    break;
                case "top":
                    setTop(parseInt(newVal));
                    break;
                case "width":
                    setWidth(parseInt(newVal));
                    break;
                case "height":
                    setHeight(parseInt(newVal));
                    break;
                //illegal values
                default:
                    Log.error("Sidebar illegal value");
                    throw new Error();
            }
        }, []);

        return (
            <div style={{ ...this._sidebarStyle, width: calcSidebarWidth() }}>
                <h3>{this._mainWidget.getWidgets().size} Widgets Selected</h3>
                {/* ---------------- positions -------------------------- */}
                <this._BlockTitle>
                    <b>Position</b>
                </this._BlockTitle>
                <this._BlockBody>
                    <form
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.getUpdateFromSidebar()(event, "left", left)}
                        style={this._defaultFormStyle}
                    >
                        <div>X:</div>
                        <input
                            style={this._defaultInputStyle}
                            type="number"
                            name="left"
                            value={left}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateValue(event)}
                            // must use enter to change the value
                            onBlur={(event: any) => {
                                setLeft(this._mainWidget._leftShown);
                            }}
                        />
                    </form>{" "}
                    <form
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.getUpdateFromSidebar()(event, "top", top)}
                        style={this._defaultFormStyle}
                    >
                        <div>Y:</div>
                        <input
                            style={this._defaultInputStyle}
                            type="number"
                            name="top"
                            value={top}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateValue(event)}
                            // must use enter to change the value
                            onBlur={(event: any) => {
                                setTop(this._mainWidget._topShown);
                            }}
                        />
                    </form>
                    <form
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.getUpdateFromSidebar()(event, "width", width)}
                        style={this._defaultFormStyle}
                    >
                        <div>Width:</div>
                        <input
                            style={this._defaultInputStyle}
                            type="number"
                            name="width"
                            value={width}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateValue(event)}
                            // must use enter to change the value
                            onBlur={(event: any) => {
                                setWidth(this._mainWidget._widthShown);
                            }}
                        />
                    </form>
                    <form
                        onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.getUpdateFromSidebar()(event, "height", height)}
                        style={this._defaultFormStyle}
                    >
                        <div>Height:</div>
                        <input
                            style={this._defaultInputStyle}
                            type="number"
                            name="height"
                            value={height}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => updateValue(event)}
                            // must use enter to change the value
                            onBlur={(event: any) => {
                                setHeight(this._mainWidget._heightShown);
                            }}
                        />
                    </form>
                    {this.getSidebarWidgetsList().getElement()}
                </this._BlockBody>
            </div>
        );
    };

    getElement = () => {
        return <this._Element key={this._widgetKey} />;
    };

    // ----------------------------------- styles ----------------------------

    _sidebarStyle: Record<string, any> = {
        // inline-flex
        display: "inline-flex",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        flexDirection: "column",
        // not "absolute"
        position: "fixed",
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
        // background 
        backgroundColor: "rgba(255,255,255,1)",
        // separator
        borderStyle: "solid",
        borderLeftWidth: GlobalVariables.sidebarBorderWidth,
        borderColor: "red",
        boxSizing: "border-box",
    };
    private _BlockBody = ({ children }: any) => {
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

    private _BlockTitle = ({ children }: any) => {
        return (
            <div
                style={{
                    marginTop: 2,
                    marginBottom: 2,
                }}
            >
                {children}
            </div>
        );
    };

    private _defaultInputStyle: Record<string, any> = {
        width: "70%",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
    };

    private _defaultFormStyle: Record<string, any> = {
        display: "inline-flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 2,
        marginBottom: 2,
    };

    // -------------------------------- getters ------------------------------

    getUpdateFromSidebar = (): ((event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean) => void) => {
        return this._mainWidget.updateFromSidebar;
    };

    getSidebarWidgetsList = () => {
        return g_widgets1.getSidebarWidgetsList();
    }
}
