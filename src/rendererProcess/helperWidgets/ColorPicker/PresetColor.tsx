import * as React from "react";
import { rgb2hex } from "./Helper";
import { GlobalVariables } from "../../../common/GlobalVariables";
import { g_widgets1 } from "../../global/GlobalVariables";

const PresetColorRaw = ({ setOveredColorName, selectedColorName, setSelectedColorName, colorName, handleColorUpdate }: any) => {
    const PresetColorList = GlobalVariables.presetColors;

    const rgb: [number, number, number, number] = PresetColorList[colorName];

    const [showCheckMark, setShowCheckMark] = React.useState<boolean>(selectedColorName === colorName ? true : false);

    React.useEffect(() => {
        setShowCheckMark(selectedColorName === colorName ? true : false);
    }, [selectedColorName]);

    const handleMouseOver = () => {
        setOveredColorName(colorName);
    };
    const handleMouseOut = () => {
        setOveredColorName("");
    };

    const handleClick = () => {
        setSelectedColorName((oldColorName: string) => {
            if (oldColorName !== colorName) {
                handleColorUpdate([...rgb]);
                const history = g_widgets1.getRoot().getDisplayWindowClient().getActionHistory();
                history.registerAction();
                return colorName;
            } else {
                return oldColorName;
            }
        });
    };
    const opacityStyleBG2 = `.opacity-style-bg2 { background: repeating-conic-gradient(#c0c0c0 0% 25%, transparent 0% 50%) 50% / 20px 20px}`;

    return (
        <div
            style={{
                display: "inline-block",
                position: "relative",
                // ~ 6 colors each row
                width: "13%",
                aspectRatio: "1/1",
                borderRadius: 3,
                margin: 2,
            }}
        >
            <div
                style={{
                    position: "absolute",
                    height: "100%",
                    width: "100%",
                    top: 0,
                    left: 0,
                    borderStyle: "none",
                    borderRadius: 2,
                    display: "inline-block",
                }}
                className={"opacity-style-bg2"}
            >
                <style>{opacityStyleBG2}</style>
            </div>

            <ElementColorBlock presetColor={rgb} onClick={handleClick} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}></ElementColorBlock>
            <CheckMark rgb={rgb} show={showCheckMark} />
        </div>
    );
};

export const PresetColor = React.memo(PresetColorRaw);

// -------------------- sub elements ----------------------

const CheckMark = ({ rgb, show }: any) => {
    const checkmarkColor = rgb[3] < 66 ? "black" : rgb[0] + rgb[1] + rgb[2] > 400 ? "rgba(0,0,0,1)" : "rgba(255,255,255,1)";

    return (
        <div
            style={{
                position: "absolute",
                display: show ? "inline-block" : "none",
                transform: "rotate(45deg)",
                left: "30%",
                top: "12%",
                width: "30%",
                height: "50%",
                borderBottom: `3px solid ${checkmarkColor}`,
                borderRight: `3px solid ${checkmarkColor}`,
            }}
        ></div>
    );
};

const ElementColorBlock = ({presetColor, onClick, onMouseOver, onMouseOut}: any) => {
    const refElement = React.useRef<any>(null);
    return (
        <div
            ref={refElement}
            style={{
                left: 0,
                top: 0,
                position: "absolute",
                display: "inline-block",
                width: "100%",
                height: "100%",
                // opacity: ${(props) => props.presetColor[3] / 100};
                opacity: `${presetColor[3] / 100}`,
                borderRadius: 3,
                borderStyle: "solid",
                borderWidth: 1,
                boxSizing: "border-box",
                // background: ${(props) => `rgb(${props.presetColor[0]}, ${props.presetColor[1]}, ${props.presetColor[2]})`};
                background: `rgb(${presetColor[0]}, ${presetColor[1]}, ${presetColor[2]})`,
                // boxShadow: 0px 0px 0px 0px ${(props) => rgb2hex(props.presetColor)};
                boxShadow: `0px 0px 0px 0px ${rgb2hex(presetColor)}`,
                textAlign: "center",
                transitionDuration: "100ms",
                padding: 5,
                flex: 8,
            }}
            onMouseEnter = {() => {
                if (refElement.current !== null) {
                    refElement.current.style["boxShadow"] = `0px 0px 1px 1px rgb(${presetColor[0]}, ${presetColor[1]}, ${presetColor[2]})`;
                }
                onMouseOver();
            }}
            onMouseLeave = {() => {
                if (refElement.current !== null) {
                    refElement.current.style["boxShadow"] = `0px 0px 0px 0px ${rgb2hex(presetColor)}`;
                }
                onMouseOut();
            }}
            onClick={onClick}
        >
        </div>
    )
}
