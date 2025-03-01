import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { PvTable } from "./PvTable";
import { ElementRectangleButton } from "../../helperWidgets/SharedElements/RectangleButton";
import { ElementMacrosTable } from "../../helperWidgets/SharedElements/MacrosTable";

export class PvTableSettings {
    _mainWidget: PvTable;
    constructor(pvTable: PvTable) {
        this._mainWidget = pvTable;
    }

    getMainWidget = () => {
        return this._mainWidget;
    };

    _Element = () => {
        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: "rgba(255,255,255,1)",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    // overflow: "scroll",
                }}
            >
                <div
                    style={{
                        width: "90%",
                        // height: "90%",
                        left: "5%",
                        display: "inline-flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        position: "relative",
                    }}
                >
                    <div
                        style={{
                            position: "relative",
                            width: "80%",
                            display: "inline-flex",
                            flexDirection: "column",
                            justifyContent: "flex-start",
                            alignItems: "center",
                        }}
                    >
                        <div style={{ width: "100%" }}>
                            <h2>Macros</h2>
                        </div>
                        <ElementMacrosTable
                            headlineName1={"Name"}
                            headlineName2={"Value"}
                            macrosData={this.getMainWidget().getMacros()} // [string, string][]

                        ></ElementMacrosTable>
                    </div>
                    <this._ElementFieldNames></this._ElementFieldNames>
                    <this._ElementMultipleChannels></this._ElementMultipleChannels>
                    <ElementRectangleButton
                        handleClick={() => {
                            // macros do not need to update

                            if (this._updateChannelNames !== undefined) {
                                this._updateChannelNames();
                            }
                            if (this._updateFieldNames !== undefined) {
                                this._updateFieldNames();
                            }
                            // this.getMainWidget().setExpanedBaseChannelNames();
                            // this.getMainWidget().expandAndExtractChannelNames();
                            const mainWidget = this.getMainWidget();
                            mainWidget.processChannelNames()

                            g_widgets1.connectAllTcaChannels(true);

                            mainWidget.showSettings = false;
                            g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
                            g_flushWidgets();
                        }}
                    >
                        OK
                    </ElementRectangleButton>
                    <div>
                        &nbsp;
                    </div>
                </div>
            </div>
        );
    };

    _updateChannelNames: (() => void) | undefined = undefined;

    getElement = () => {
        return <this._Element></this._Element>;
    };

    _ElementMultipleChannels = () => {
        const [channelNamesStr, setChannelNamesStr] = React.useState(`${this.getMainWidget().getChannelNamesLevel5()}`.replaceAll(",", "\n"));

        const updateChannelNames = () => {
            const oldBaseChannelNames = this.getMainWidget().getChannelNamesLevel5();

            const channelNames = channelNamesStr.split(/[,|\t|\n|\s]+/);
            for (let oldChannelName of oldBaseChannelNames) {
                if (!channelNames.includes(oldChannelName)) {
                    g_widgets1.removeTcaChannel(oldChannelName, this.getMainWidget().getWidgetKey());
                }
            }
            this.getMainWidget().getChannelNamesLevel5().length = 0;
            for (let channelName of channelNames) {
                if (channelName.trim() !== "") {
                    this.getMainWidget().getChannelNamesLevel5().push(channelName.trim());
                }
            }
        };

        this._updateChannelNames = updateChannelNames;

        return (
            <div
                style={{
                    width: "80%",
                    // height: "80%",
                    marginTop: "20px",
                }}
            >
                <div style={{ width: "100%" }}>
                    <h2>Channels</h2>
                    <p> Put one or more channel names in box below. Channel names can be separated by comma, space, or new line.</p>
                </div>

                <form
                    spellCheck={false}
                    style={{
                        width: "100%",
                        // height: "100%",
                        // marginTop: "20px",
                    }}
                >
                    <textarea
                        style={{
                            width: "95%",
                            // height: "100%",
                            height: 200,
                            padding: "5px",
                            margin: "0px",
                            resize: "none",
                            fontSize: this.getMainWidget().getStyle()["fontSize"],
                        }}
                        onChange={(event: any) => {
                            event.preventDefault();
                            setChannelNamesStr(event.target.value);
                        }}
                        value={channelNamesStr}
                    ></textarea>
                </form>
            </div>
        );
    };

    _updateFieldNames: any = undefined;

    _ElementFieldNames = () => {
        const [fieldNamesStr, setFieldNamessStr] = React.useState(`${this.getMainWidget().getFieldlNames()}`.replaceAll(",", "\n"));

        const updateFieldNames = () => {
            const oldFieldNames = this.getMainWidget().getFieldlNames();

            const fieldNames = fieldNamesStr.split(/[,|\t|\n|\s]+/);
            // for (let oldFieldName of oldFieldNames) {
            // 	if (!fieldNames.includes(oldFieldName)) {
            // 		g_widgets1.removeTcaChannel(oldChannelName, this.getMainWidget().getWidgetKey());
            // 	}
            // }
            this.getMainWidget().getFieldlNames().length = 0;
            for (let fieldName of fieldNames) {
                if (fieldName.trim() !== "") {
                    this.getMainWidget().getFieldlNames().push(fieldName);
                }
            }
        };

        this._updateFieldNames = updateFieldNames;

        return (
            <div
                style={{
                    width: "80%",
                    // height: "80%",
                    marginTop: "20px",
                }}
            >
                <div style={{ width: "100%" }}>
                    <h2>Fields</h2>
                    <p> Put one or more fields in box below. They can be separated by comma, space, or new line.</p>
                </div>

                <form
                    spellCheck={false}
                    style={{
                        width: "100%",
                        // height: "100%",
                        // marginTop: "20px",
                    }}
                >
                    <textarea
                        style={{
                            width: "95%",
                            // height: "100%",
                            height: 200,
                            padding: "5px",
                            margin: "0px",
                            resize: "none",
                            fontSize: this.getMainWidget().getStyle()["fontSize"],
                        }}
                        onChange={(event: any) => {
                            event.preventDefault();
                            setFieldNamessStr(event.target.value);
                        }}
                        value={fieldNamesStr}
                    ></textarea>
                </form>
            </div>
        );
    };


}
