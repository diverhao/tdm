import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import { CanvasSidebar } from "../Canvas/CanvasSidebar";
import { GlobalVariables } from "../../global/GlobalVariables";

/**
 * Represents the X component in sidebar. <br>
 *
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to
 * update this sidebar component from widget.
 */
// export class SidebarCanvasScript extends SidebarComponent {
export class SidebarCanvasScript {
    _sidebar: CanvasSidebar;
    _updateFromWidget = (propertyValue: any) => { };
    getUpdateFromWidget = () => {
        return this._updateFromWidget;
    };
    constructor(sidebar: CanvasSidebar) {
        this._sidebar = sidebar;
    }

    getElement = () => {
        return <this._Element></this._Element>;
    };

    getSidebar = () => {
        return this._sidebar;
    };

    getMainWidget = () => {
        return this.getSidebar().getMainWidget();
    };

    getStyle = () => {
        return this.getMainWidget().getStyle();
    };

    // getFormStyle = () => {
    // 	return this.getSidebar().getFormStyle();
    // };

    // getInputStyle = () => {
    // 	return this.getSidebar().getInputStyle();
    // };

    getWidgetKey = () => {
        return this.getMainWidget().getWidgetKey();
    };

    _Element = () => {
        const [script, setScript] = React.useState<string>(`${this.getMainWidget().getScript()}`);

        this._updateFromWidget = (newFileName: string) => {
            this.getMainWidget().setScript(newFileName);
            setScript(newFileName);

            const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
            history.registerAction();

            g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
            g_widgets1.addToForceUpdateWidgets("GroupSelection2");

            g_flushWidgets();
        };

        return (
            <>
                <this._BlockTitle>
                    <div
                        style={{
                            display: "inline-flex",
                            flexDirection: "row",
                            justifyContent: "space-between",
                            width: "100%",
                            alignItems: "center",
                        }}
                    >
                        <b>Script</b>
                        {/* <div style={{
                            // display: g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode() === "web" ? "inline-flex": "none",
                            color: "red",
                        }}>
                            NA in web browser.
                        </div> */}
                        <div style={{
                            // display: g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode() === "web" ? "none" : "inline-flex"
                            display: "inline-flex",
                        }}>
                            <div
                                onClick={() => {
                                    // to edit the file
                                    const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                                    const displayWindowId = displayWindowClient.getWindowId();
                                    g_widgets1.openTextEditorWindow({
                                        displayWindowId: displayWindowId, // for showing the error message
                                        widgetKey: this.getWidgetKey(),
                                        fileName: this.getMainWidget().getScript(), // practically the only info that we need, because we are going to open it in a new window
                                        manualOpen: false,  // do not show dialog
                                        openNewWindow: true, // open in new TextEditor window
                                    });
                                }}
                            >
                                <img
                                    src={`../../../webpack/resources/webpages/modify-symbol.svg`}
                                    style={{
                                        width: 20,
                                        height: 15,
                                        objectFit: "scale-down",
                                    }}
                                ></img>
                            </div>
                            <div
                                onClick={() => {
                                    // to get the file name
                                    const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                                    const displayWindowId = displayWindowClient.getWindowId();
                                    displayWindowClient.getIpcManager().sendFromRendererProcess("select-a-file", {
                                        displayWindowId: displayWindowId,
                                        widgetKey: this.getMainWidget().getWidgetKey(),
                                        filterType: "script",
                                    });
                                }}
                            >
                                <img
                                    src={`../../../webpack/resources/webpages/open-file-symbol.svg`}
                                    style={{
                                        width: 20,
                                        height: 15,
                                        objectFit: "scale-down",
                                    }}
                                ></img>
                            </div>
                        </div>
                    </div>
                </this._BlockTitle>
                <this._BlockBody>
                    <form onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidget(event, script)} style={this._formStyle}>
                        <div>Path:</div>
                        <input
                            // the same with as dropdown menu in SidebarLineStyle, which is an <input /> element with 70% width
                            style={{
                                ...this._inputStyle, width: "70%",
                                // color: g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode() === "web" ? "rgba(150,150,150,1)" : "rgba(0,0,0,1)" 
                            }
                            }
                            type="string"
                            name="script"
                            value={script}
                            // readOnly={g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode() === "web" ? true : false}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                const newVal = event.target.value;
                                setScript(newVal);
                            }}
                            // must use enter to change the value
                            onBlur={(event: any) => {
                                if (this.getMainWidget().getScript() !== script) {
                                    setScript(`${this.getMainWidget().getScript()}`);
                                }
                            }}
                        />
                    </form>
                </this._BlockBody>
            </>
        );
    };

    updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event.preventDefault();

        const oldVal = this.getMainWidget().getScript();
        if (propertyValue === oldVal) {
            return;
        } else {
            this.getMainWidget().setScript(`${propertyValue}`);
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };

    _BlockTitle = ({ children }: any) => {
        return (
            <div
                style={{
                    marginTop: 2,
                    marginBottom: 2,
                    width: "100%",
                    display: "inline-flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                {children}
            </div>
        );
    };

    _HorizontalLine = () => {
        return <div>&nbsp;</div>;
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

    _inputStyle: Record<string, any> = {
        width: "70%",
        fontFamily: GlobalVariables.defaultFontFamily,
        fontSize: GlobalVariables.defaultFontSize,
    };

    _formStyle: Record<string, any> = {
        display: "inline-flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 2,
        marginBottom: 2,
    };
}
