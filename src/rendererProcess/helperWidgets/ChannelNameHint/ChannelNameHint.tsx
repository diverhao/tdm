import * as React from "react";
import { GlobalVariables } from "../../global/GlobalVariables";

export class ChannelNameHint {
    constructor() { }

    _Element = ({ show, additionalStyle, channelNames, selectHint}: { show: boolean, additionalStyle: Record<string, any>, channelNames: string[], selectHint: any}) => {

        if (show === true) {
            return (
                <div
                    style={{
                        position: "absolute",
                        background: "rgba(255,255,255,1)",
                        border: "solid 1px rgba(0,0,0,1)",
                        borderRadius: 2,
                        overflowY: "auto",
                        display: "inline-flex",
                        flexDirection: "column",
                        padding: 3,
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        fontFamily: GlobalVariables.defaultFontFamily,
                        fontSize: GlobalVariables.defaultFontSize * 0.7,
                        ...additionalStyle
                    }}
                >
                    {channelNames.map((channelName: string) => {
                        return (
                            <this._ElementLine channelName={channelName} selectHint={selectHint}></this._ElementLine>
                        )
                    })}
                </div>
            )
        } else {
            return null
        }
    }

    _ElementLine = ({ channelName , selectHint}: { channelName: string, selectHint: any }) => {
        const elementRef = React.useRef<any>(null);
        return (
            <div
                ref={elementRef}
                style={{
                    display: "inline-flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    position: "relative",
                    cursor: "default",
                    overflow: "hidden",
                    width: "100%",
                    flexShrink: 0,
                    userSelect: "none",
                    padding: 2,
                    boxSizing: "border-box",
                }}
                onMouseEnter={() => {
                    if (elementRef.current !== null) {
                        elementRef.current.style["backgroundColor"] = "#c1eeff";
                    }
                }}
                onMouseLeave={() => {
                    if (elementRef.current !== null) {
                        elementRef.current.style["backgroundColor"] = "rgba(200, 200, 200, 0)";
                    }
                }}
                onMouseDown={() => {
                    selectHint(channelName)
                }}
            >
                {channelName}
            </div>
        )
    }

}