import * as React from "react";
import { ColorPicker } from "./ColorPicker";
import { GlobalVariables } from "../../global/GlobalVariables";

export const Collapsible = ({ rgbColorStr, updateFromSidebar, title, eventName }: any) => {
    const rgbaStrToRgbaArray = (rgbaString: string) => {
        let tmp = JSON.parse(rgbaString.replace("rgba", "").replace("(", "[").replace(")", "]"));
        tmp[3] = tmp[3] * 100;
        return tmp;
    };

    const rgbColor = rgbaStrToRgbaArray(rgbColorStr);
    const handleColorUpdateCollapsible = (newColor: [number, number, number, number]) => {
        updateFromSidebar(null, eventName, newColor);
    };

    const [colorPickerVisible, setColorPickerVisible] = React.useState(false);

    return (
        <div
            style={{
                display: "inline-flex",
                // backgroundColor: "white",
                flexDirection: "column",
                overflow: "visible",
                // position: "relative",
                width: "100%",
            }}
        >
            <ColorTitle rgb={rgbColor} setColorPickerVisible={setColorPickerVisible} colorPickerVisible={colorPickerVisible} title={title} />
            {colorPickerVisible ? <ColorPicker rgbColor={rgbColor} handleColorUpdate={handleColorUpdateCollapsible}></ColorPicker> : null}
        </div>
    );
};

export const CollapsibleWithoutTitle = ({ rgbColorStr, updateFromSidebar, title, eventName }: any) => {
    const rgbaStrToRgbaArray = (rgbaString: string) => {
        let tmp = JSON.parse(rgbaString.replace("rgba", "").replace("(", "[").replace(")", "]"));
        tmp[3] = tmp[3] * 100;
        return tmp;
    };

    const rgbColor = rgbaStrToRgbaArray(rgbColorStr);
    const handleColorUpdateCollapsible = (newColor: [number, number, number, number]) => {
        updateFromSidebar(null, eventName, newColor);
    };

    const [colorPickerVisible, setColorPickerVisible] = React.useState(false);

    return (
        <div
            style={{
                display: "inline-flex",
                backgroundColor: "white",
                flexDirection: "column",
                overflow: "visible",
                // position: "relative",
                width: "100%",
                overflowX: "hidden",
                overflowY: "hidden",
                border: "1px black solid"
            }}
        >
            {/* <ColorTitle rgb={rgbColor} setColorPickerVisible={setColorPickerVisible} colorPickerVisible={colorPickerVisible} title={title} /> */}
            <ColorPicker rgbColor={rgbColor} handleColorUpdate={handleColorUpdateCollapsible}></ColorPicker>
        </div>
    );
};

// ---------------------- title line ------------------------

const ColorTitle = ({ rgb, setColorPickerVisible, colorPickerVisible, title }: any) => {
    return (
        <div
            style={{
                display: "inline-flex",
                position: "relative",
                flexDirection: "row",
                width: "100%",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 3,
                marginBottom: 3,
            }}
        >
            <div
                style={{
                    display: "inline-flex",
                    position: "relative",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    margin: 0,
                    height: "100%",
                    width: "100%",
                }}
            >
                <div>{title} &nbsp;</div>
                <ColorIndicator
                    handleClick={() => {
                        setColorPickerVisible((prev: boolean) => {
                            return !prev;
                        });
                    }}
                    rgb={rgb}
                />
            </div>
        </div>
    );
};


// ----------------- color indicator on title line --------------------

const ColorIndicator = ({ rgb, handleClick }: any) => {
    const opacityStyleBG2 = `.opacity-style-bg2 { background: repeating-conic-gradient(#c0c0c0 0% 25%, transparent 0% 50%) 50% / 20px 20px}`;
    return (
        <ElementColorIndicatorContainer onClick={handleClick}>
            {/* {rgb} */}
            <div
                style={{
                    // top: 0,
                    // left:0,
                    position: "relative",
                    // height: "50%",
                    height: "15px",
                    aspectRatio: "1/1",
                    borderStyle: "none",
                    borderRadius: 2,
                    display: "inline-block",
                }}
                className={"opacity-style-bg2"}
            >
                <style>{opacityStyleBG2}</style>
            </div>
            <ElementColorBlock presetColor={rgb}></ElementColorBlock>
        </ElementColorIndicatorContainer>
    );
};


const ElementColorBlock = ({presetColor}: any) => {
    return (
        <div
            style={{
                left: 0,
                top: 0,
                position: "absolute",
                display: "inline-block",
                boxSizing: "border-box",
                width: 15,
                aspectRatio: "1/1",
                // opacity: ${(props) => props.presetColor[3] / 100};
                opacity: presetColor[3] / 100,
                borderRadius: 2,
                borderWidth: 1,
                // borderStyle: ${(props) => (props.presetColor[0] + props.presetColor[1] + props.presetColor[2] > GlobalVariables.colorSumChange ? "solid" : "none")};
                borderStyle: presetColor[0] + presetColor[1] + presetColor[2] > GlobalVariables.colorSumChange ? "solid" : "none",
                borderColor: "rgb(230, 230, 230)",
                // background: ${(props) => `rgb(${props.presetColor[0]}, ${props.presetColor[1]}, ${props.presetColor[2]})`};
                background: `rgb(${presetColor[0]}, ${presetColor[1]}, ${presetColor[2]})`,
            }}
        >
        </div>
    )
}

const ElementColorIndicatorContainer = ({ children, onClick }: any) => {
    return (
        <div style={{
            position: "relative",
            height: "100%",
            boxSizing: "border-box",
            cursor: "pointer",
        }}
            onClick={onClick}
        >
            {children}
        </div>
    )
}

