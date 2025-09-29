import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import { Media } from "../../widgets/Media/Media";

/**
 * Represents the X component in sidebar. <br>
 *
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to
 * update this sidebar component from widget.
 */
export class SidebarMediaOpenFile extends SidebarComponent {
    constructor(sidebar: BaseWidgetSidebar) {
        super(sidebar);
    }

    _Element = () => {
        const [fileName, setFileName] = React.useState<string>(this.getText()["fileName"]);

        this._updateFromWidget = (newFileName: string) => {
            this.getText()["fileName"] = newFileName;
            setFileName(newFileName);

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
                        {this.getMainWidget() instanceof Media ? <b>File</b> : "File"}
                        {/* <div
                            style={{
                                display: g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode() === "web" ? "" : "none",
                                color: "rgba(255,0,0,1)",
                            }}
                        >
                            NA in web browser.
                        </div> */}
                        <div
                            onClick={() => {
                                // to get the file name
                                const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                                const displayWindowId = displayWindowClient.getWindowId();
                                displayWindowClient
                                    .getIpcManager()
                                    .sendFromRendererProcess("select-a-file", {
                                        options: {
                                            displayWindowId: displayWindowId,
                                            widgetKey: this.getMainWidget().getWidgetKey(),
                                            filterType: "media",
                                        }
                                    });
                            }}
                            style={{
                                // display: g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode() === "web" ? "none" : "",
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
                </this._BlockTitle>
                <this._BlockBody>
                    <form onSubmit={(event: React.FormEvent<HTMLFormElement>) => this.updateWidget(event, fileName)} style={this.getFormStyle()}>
                        <this._ElementInputLabel
                            value={fileName}
                            setValue={setFileName}
                            readableText={"Media file name"}
                            updater={(newValue: string) => { this.updateWidget(undefined, newValue) }}
                        >
                            Name:
                        </this._ElementInputLabel>
                        <input
                            // the same with as dropdown menu in SidebarLineStyle, which is an <input /> element with 70% width
                            style={{
                                ...this.getInputStyle(),
                                width: "65.6%",
                                // color: g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode() === "web" ? "rgba(150,150,150,1)" : "rgba(0,0,0,1)",
                            }}
                            type="string"
                            name="fileName"
                            value={fileName}
                            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                const newVal = event.target.value;
                                setFileName(newVal);
                            }}
                            // readOnly={g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode() === "web" ? true : false}
                            // must use enter to change the value
                            onBlur={(event: any) => {
                                if (this.getText()["fileName"] !== fileName) {
                                    setFileName(this.getText()["fileName"]);
                                }
                            }}
                        />
                    </form>
                </this._BlockBody>
            </>
        );
    };

    updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event?.preventDefault();

        const oldVal = this.getText()["fileName"];
        if (propertyValue === oldVal) {
            return;
        } else {
            this.getText()["fileName"] = propertyValue;
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };
}
