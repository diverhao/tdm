import * as React from "react";
import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import { g_widgets1 } from "../../global/GlobalVariables";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import { SidebarComponent } from "./SidebarComponent";
import * as GlobalMethods from "../../global/GlobalMethods"
import { TcaChannel } from "../../channel/TcaChannel";

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

        return (
            <form
                onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
                    this.updateWidget(event, channelName);
                    // setChanneNameColor(GlobalMethods.validateChannelName(channelName) ? "black" : "red");
                    setChanneNameColor(TcaChannel.checkChannelName(channelName) !== undefined ? "black" : "red");
                }}
                style={this.getFormStyle()}
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
                    style={{ ...this.getInputStyle(), color: channeNameColor }}
                    type="string"
                    name="channel-name"
                    value={channelName}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        const newVal = event.target.value;
                        setChannelName(newVal);
                        setChanneNameColor(TcaChannel.checkChannelName(newVal) !== undefined ? "black" : "red");
                    }}
                    // must use enter to change the value
                    onBlur={(event: any) => {
                        // const orig = this.getMainWidget().getChannelNames()[0];
                        const orig = this.getMainWidget().getChannelNamesLevel0()[0];
                        if (orig !== channelName) {
                            setChannelName(orig);
                            // setChanneNameColor(GlobalMethods.validateChannelName(orig) ? "black" : "red");
                            setChanneNameColor(TcaChannel.checkChannelName(orig) !== undefined ? "black" : "red");
                        }
                    }}
                />
            </form>
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
