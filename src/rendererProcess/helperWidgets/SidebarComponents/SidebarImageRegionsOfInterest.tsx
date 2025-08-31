import { SidebarComponent } from "./SidebarComponent";
import * as React from "react";
import { g_widgets1, GlobalVariables } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../Root/Root";
import { ElementButton } from "../SharedElements/MacrosTable";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import {
    ActionButton,
    type_action_openwebpage_tdl,
    type_action_opendisplay_tdl,
    type_action_writepv_tdl,
    type_action_executecommand_tdl,
    type_action_closedisplaywindow,
} from "../../widgets/ActionButton/ActionButton";
import { SidebarActionOpenDisplayItem } from "./SidebarActionOpenDisplayItem";
import { SidebarActionWritePvItem } from "./SidebarActionWritePvItem";
import { SidebarActionOpenWebpageItem } from "./SidebarActionOpenWebpageItem";
import { SidebarActionExecuteCommandItem } from "./SidebarActionExecuteCommandItem";
import { ActionButtonSidebar } from "../../widgets/ActionButton/ActionButtonSidebar";
import { SidebarActionCloseDisplayWindowItem } from "./SidebarActionCloseDisplayWindowItem";
import { Image, type_Image_roi } from "../../widgets/Image/Image";
import { Collapsible } from "../ColorPicker/Collapsible";
import { rgbaArrayToRgbaStr } from "../../global/GlobalMethods";

export class SidebarImageRegionsOfInterest extends SidebarComponent {
    _forceUpdate: any;

    constructor(sidebar: BaseWidgetSidebar) {
        super(sidebar);
    }

    _Element = () => {
        const [, forceUpdate] = React.useState({});
        const mainWidget = this.getMainWidget() as Image;

        this._forceUpdate = () => {
            forceUpdate({});
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
                            whiteSpace: "nowrap",
                        }}
                    >
                        <b>Regions of Interest</b>
                        <ElementButton
                            onClick={(event: any) => {
                                this.updateWidgetAddRoi(event);
                            }}
                        >
                            <img
                                src={`../../../webpack/resources/webpages/add-symbol.svg`}
                                style={{
                                    width: "60%",
                                    height: "60%",
                                }}
                            ></img>
                        </ElementButton>

                    </div>
                </this._BlockTitle>
                <this._BlockBody>
                    <div
                        style={{
                            display: "inline-flex",
                            flexDirection: "column",
                            position: "relative",
                        }}
                    >
                        {mainWidget.getRegionsOfInterest().map(
                            (
                                roi: type_Image_roi,
                                index: number
                            ) => {
                                return <this._ElementRoi key={index} index={index} roi={roi} />;
                            }
                        )}
                    </div>
                </this._BlockBody>
            </>
        );
    };

    _ElementRoi = ({ roi, index }: { roi: type_Image_roi, index: number }) => {
        const [xPv, setXPv] = React.useState<string>(roi.xPv);
        const [yPv, setYPv] = React.useState<string>(roi.yPv);
        const [widthPv, setWidthPv] = React.useState<string>(roi.widthPv);
        const [heightPv, setHeightPv] = React.useState<string>(roi.heightPv);
        return (
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    width: "100%",
                    whiteSpace: "nowrap",
                }}
            >
                <div
                style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                }}
                >
                    <b># {index + 1}</b>
                    <ElementButton
                        onClick={(event: any) => {
                            this.updateWidgetDeleteRoi(event, index);
                        }}
                    >
                        <img
                            src={`../../../webpack/resources/webpages/delete-symbol.svg`}
                            style={{
                                width: "60%",
                                height: "60%",
                            }}
                        ></img>
                    </ElementButton>

                </div>

                <form
                    onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                        event.preventDefault();
                        roi.xPv = xPv;

                        this._forceUpdate();
                        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
                        history.registerAction();

                        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
                        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                        g_flushWidgets();
                    }}
                    style={this.getFormStyle()}
                >
                    <div>X:</div>
                    <input
                        style={{ ...this.getInputStyle(), width: "60%" }}
                        type="text"
                        value={xPv}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                            const newVal = event.target.value;
                            setXPv(newVal);
                        }}
                        // must use enter to change the value
                        onBlur={(event: any) => {
                            if (roi.xPv !== xPv) {
                                setXPv(roi.xPv);
                            }
                        }}
                    />
                </form>

                <form
                    onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                        event.preventDefault();
                        roi.yPv = yPv;

                        this._forceUpdate();
                        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
                        history.registerAction();

                        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
                        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                        g_flushWidgets();
                    }}
                    style={this.getFormStyle()}
                >
                    <div>Y:</div>
                    <input
                        style={{ ...this.getInputStyle(), width: "60%" }}
                        type="text"
                        value={yPv}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                            const newVal = event.target.value;
                            setYPv(newVal);
                        }}
                        // must use enter to change the value
                        onBlur={(event: any) => {
                            if (roi.yPv !== yPv) {
                                setYPv(roi.yPv);
                            }
                        }}
                    />
                </form>

                <form
                    onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                        event.preventDefault();
                        roi.widthPv = widthPv;

                        this._forceUpdate();
                        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
                        history.registerAction();

                        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
                        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                        g_flushWidgets();
                    }}
                    style={this.getFormStyle()}
                >
                    <div>Width:</div>
                    <input
                        style={{ ...this.getInputStyle(), width: "60%" }}
                        type="text"
                        value={widthPv}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                            const newVal = event.target.value;
                            setWidthPv(newVal);
                        }}
                        // must use enter to change the value
                        onBlur={(event: any) => {
                            if (roi.widthPv !== widthPv) {
                                setWidthPv(roi.widthPv);
                            }
                        }}
                    />
                </form>
                <form
                    onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                        event.preventDefault();
                        roi.heightPv = heightPv;

                        this._forceUpdate();
                        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
                        history.registerAction();

                        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
                        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                        g_flushWidgets();
                    }}
                    style={this.getFormStyle()}
                >
                    <div>Height:</div>
                    <input
                        style={{ ...this.getInputStyle(), width: "60%" }}
                        type="text"
                        value={heightPv}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                            const newVal = event.target.value;
                            setHeightPv(newVal);
                        }}
                        // must use enter to change the value
                        onBlur={(event: any) => {
                            if (roi.heightPv !== heightPv) {
                                setHeightPv(roi.heightPv);
                            }
                        }}
                    />
                </form>
                <Collapsible
                    rgbColorStr={roi.color}
                    updateFromSidebar={(event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean | undefined) => {

                        const newVal = rgbaArrayToRgbaStr(propertyValue as number[]);
                        const oldVal = roi.color;
                        console.log({ newVal, oldVal });
                        if (newVal === oldVal) {
                            return;
                        } else {
                            roi.color = newVal;
                        }

                        this._forceUpdate();
                        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
                        history.registerAction();

                        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
                        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

                        g_flushWidgets();
                    }}
                    title={"Color"}
                    eventName={"color"}
                />
            </div>
        )
    }

    updateWidgetAddRoi = (event: any) => {
        const mainWidget = this.getMainWidget() as Image;
        mainWidget.getRegionsOfInterest().push({
            xPv: "",
            yPv: "",
            widthPv: "",
            heightPv: "",
            color: "rgba(255, 0, 0, 1)", // default red
        });
        this._forceUpdate();

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();

    }


    updateWidgetDeleteRoi = (event: any, index: number) => {
        const mainWidget = this.getMainWidget() as Image;
        mainWidget.getRegionsOfInterest().splice(index, 1);
        this._forceUpdate();

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(mainWidget.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();

    }

    updateWidget = (event: any, propertyValue: string | number | boolean | number[] | string[] | undefined) => { };
}
