import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import * as GlobalMethods from "../../global/GlobalMethods"
import { TcaChannel } from "../../channel/TcaChannel";
import { v4 as uuidv4 } from "uuid";

/**
 * Represents the X component in sidebar. <br>
 *
 * It provides: (1) the JSX element, (2) the method to udpate the widget from sidebar, and (3) the method to
 * update this sidebar component from widget.
 */
export class SidebarChannelName extends SidebarComponent {
    constructor(sidebar: BaseWidgetSidebar) {
        super(sidebar);
    }

    _Element = () => {
        // const [channelName, setChannelName] = React.useState<string>(this.getMainWidget().getChannelNames()[0]);
        const channelNameRaw = this.getMainWidget().getChannelNamesLevel0()[0];
        const [channelName, setChannelName] = React.useState<string>(channelNameRaw === undefined ? "" : channelNameRaw);
        const [channeNameColor, setChanneNameColor] = React.useState<string>(
            // GlobalMethods.validateChannelName(this.getMainWidget().getChannelNames()[0]) ? "black" : "red"
            // GlobalMethods.validateChannelName(this.getMainWidget().getUnprocessedChannelNames()[0]) ? "black" : "red"
            TcaChannel.checkChannelName(this.getMainWidget().getChannelNamesLevel0()[0]) !== undefined ? "black" : "red"
        );



        const inputElementRef = React.useRef<any>(null);
        const labelElementRef = React.useRef<any>(null);
        const formElementRef = React.useRef<any>(null);

        // channel name hint
        const [showChannelNameHint, setShowChannelNameHint] = React.useState(false);
        const ChannelNameHintElement = g_widgets1.getRoot().getDisplayWindowClient().getChannelNameHint()._Element;
        const [channelNameHintElementDimension, setChannelNameHintElementDimension] = React.useState({ width: 0, maxHeight: 0, left: 0, top: 0 });
        const [channelNameHintData, setChannelNameHintData] = React.useState<string[]>([]);

        const selectHint = (channelName: string) => {
            this.updateWidget(undefined, channelName);
            setChannelName(channelName);
            setShowChannelNameHint(false)
        }

        return (
            <form
                ref={formElementRef}
                onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                    this.updateWidget(event, channelName);
                    // setChanneNameColor(GlobalMethods.validateChannelName(channelName) ? "black" : "red");
                    setChanneNameColor(TcaChannel.checkChannelName(channelName) !== undefined ? "black" : "red");
                    setShowChannelNameHint(false);
                }}
                style={{ ...this.getFormStyle(), position: "relative" }}
            >
                <this._ElementInputLabel
                    value={channelName}
                    setValue={setChannelName}
                    readableText={"Channel Name"}
                    updater={(newValue: string) => this.updateWidget(undefined, newValue)}
                >
                    Name:
                </this._ElementInputLabel>

                <input
                    ref={inputElementRef}
                    style={{ ...this.getInputStyle(), color: channeNameColor }}
                    type="string"
                    name="channel-name"
                    value={channelName}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        const newVal = event.target.value;
                        setChannelName(newVal);
                        setChanneNameColor(TcaChannel.checkChannelName(newVal) !== undefined ? "black" : "red");

                        // send query for channel name if there are more than 1 character input
                        if (newVal.trim().length >= 2) {
                            const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                            const queryStr = displayWindowClient.generateChannelLookupQuery(newVal);
                            if (queryStr !== "") {
                                fetch(queryStr)
                                    .then(res => res.json())
                                    .then((data: any) => {
                                        console.log(data);
                                        if (Object.keys(data).length > 0 && inputElementRef.current !== null && formElementRef.current !== null) {

                                            const rectInput = inputElementRef.current.getBoundingClientRect();
                                            const recForm = formElementRef.current.getBoundingClientRect();
                                            setChannelNameHintElementDimension({
                                                left: 0,// rectInput.left - recForm.left,
                                                top: rectInput.top - recForm.top + rectInput.height,
                                                width: recForm.width - 5,
                                                maxHeight: 200,
                                            })
                                            setChannelNameHintData(Object.keys(data));
                                            setShowChannelNameHint(true);
                                        } else {
                                            setChannelNameHintData(data);
                                            setShowChannelNameHint(false);
                                        }
                                    })
                            }
                        }
                    }}
                    // must use enter to change the value
                    onBlur={(event: any) => {
                        setShowChannelNameHint(false);
                        setChannelNameHintData([]);

                        // const orig = this.getMainWidget().getChannelNames()[0];
                        const orig = this.getMainWidget().getChannelNamesLevel0()[0];
                        if (orig !== channelName) {
                            setChannelName(orig);
                            // setChanneNameColor(GlobalMethods.validateChannelName(orig) ? "black" : "red");
                            setChanneNameColor(TcaChannel.checkChannelName(orig) !== undefined ? "black" : "red");
                        }
                    }}
                />
                <ChannelNameHintElement
                    show={showChannelNameHint}
                    additionalStyle={channelNameHintElementDimension}
                    channelNames={channelNameHintData}
                    selectHint={selectHint}
                ></ChannelNameHintElement>
            </form >
        );
    };

    updateWidget = (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        event?.preventDefault();

        // const oldVal = this.getMainWidget().getChannelNames()[0];
        const oldVal = this.getMainWidget().getChannelNamesLevel0()[0];

        if (propertyValue === oldVal) {
            return;
        } else {
            // this.getMainWidget().changeChannelName(`${propertyValue}`);
            this.getMainWidget().getChannelNamesLevel0()[0] = `${propertyValue}`;
        }

        const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
        history.registerAction();

        g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        g_widgets1.addToForceUpdateWidgets("GroupSelection2");

        g_flushWidgets();
    };
}
