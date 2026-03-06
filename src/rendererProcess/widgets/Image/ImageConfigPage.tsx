import * as React from "react";
import type { Image } from "./Image";
import { ElementSwitchColorMap, ElementZrange } from "./ImageColorMapUi";

// ─── Config bar (bottom toolbar) ──────────────────────────────────────

/**
 * The bottom toolbar bar containing gear icon, Z-range, zoom/play buttons,
 * hint text, and cursor coordinate readout.
 */
export const ElementConfigBar = ({ image }: { image: Image }) => {
    return (
        <div
            style={{
                height: image.configHeight,
                display: "inline-flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center"
            }}
        >
            <div
                style={{
                    height: image.configHeight,
                    display: "inline-flex",
                    flexDirection: "row",
                    justifyContent: "flex-start",
                    alignItems: "center"
                }}
            >
                {/* <this._ElementXrange></this._ElementXrange>
                    <this._ElementYrange></this._ElementYrange> */}
                {/* config page */}
                <img
                    onMouseDown={(event) => {
                        event.stopPropagation();
                        if (image.showConfigPage === true) {
                            image.showConfigPage = false;

                        } else {
                            image.showConfigPage = true;

                        }
                        image.forceUpdate({});
                    }}
                    onMouseOver={() => {
                        image.setHintText("More options");
                    }}
                    onMouseLeave={() => {
                        image.setHintText("");
                    }}

                    src={"../../../webpack/resources/webpages/settings.svg"}
                    width={image.configHeight}
                ></img>
                {/* color map range */}
                <ElementZrange image={image} />
                <ElementZoomInButton image={image} />
                <ElementResetViewToFullButton image={image} />
                <ElementZoomOutButton image={image} />
                <ElementHint image={image} />
            </div>
            {/* cursor coordinate */}
            <ElementXyzCursorValues image={image} />
        </div>
    )
}

// ─── Config page overlay (More options popup) ─────────────────────────

/**
 * The config page overlay that appears when clicking the gear icon.
 * Contains X/Y range inputs and color map selector.
 */
export const ElementConfigPage = ({ image }: { image: Image }) => {
    return (
        <div style={{
            position: "absolute",
            // width: "100%",
            // height: "100%",
            top: 5,
            left: 5,
            padding: 20,
            boxSizing: "border-box",
            borderRadius: 10,
            backgroundColor: "rgba(150,150,150,0.5)",
            backdropFilter: "blur(10px)",
            border: "1px solid white",
            outline: "1px solid black",
            textShadow: `
      -0.5px -0.5px 0 white,
       0.5px -0.5px 0 white,
      -0.5px  0.5px 0 white,
       0.5px  0.5px 0 white
    `
        }}
            onMouseDown={(event) => {
                event.stopPropagation();
            }}
        >
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "column",
                    // maxWidth: "20%",
                    // backgroundColor: "yellow",
                }}
            >
                <ElementXrange image={image} />
                <ElementYrange image={image} />
                {/* <this._ElementZrange></this._ElementZrange> */}
                <ElementSwitchColorMap image={image} />
                {/* <this._ElementXyzCursorValues></this._ElementXyzCursorValues> */}
            </div>
            {/* <this._ElementZoomInButton /> */}
            {/* <this._ElementZoomOutButton /> */}
            {/* <this._ElementResetViewToFullButton /> */}
            {/* <div
                style={{
                    width: 20,
                    height: 20,
                    backgroundColor: "blue",
                }}
                onClick={() => {
                    this.showConfigPage = false;
                    this.forceUpdate({});
                }}
            >
            </div> */}

        </div>
    )
}

// ─── Hint text ────────────────────────────────────────────────────────

/**
 * Displays a hint text below the toolbar buttons.
 * The hint text is set via `image.setHintText()`.
 */
export const ElementHint = ({ image }: { image: Image }) => {
    const [hintText, setHintText] = React.useState("");
    image.setHintText = setHintText;
    return (
        <div
            style={{
                color: "rgba(150, 150, 150, 1)"
            }}
        >
            {hintText}
        </div>
    )
}

// ─── Toolbar buttons ──────────────────────────────────────────────────

/**
 * Button that sets the view and plot area to the manual xMin/xMax/yMin/yMax range
 */
export const ElementZoomInButton = ({ image }: { image: Image }) => {
    return (
        <div
            style={{
                // position: "absolute",
                // zIndex: 1000,
                // right: 0,
                // bottom: 100,
                // backgroundColor: "rgba(255, 255,0, 0.5)",
                // width: 100,
                // height: 100,
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
            }}
            onMouseOver={() => {
                image.setHintText("Set XY to manual range");
            }}
            onMouseLeave={() => {
                image.setHintText("");
            }}

            onMouseDown={() => {
                // console.log("Zoom In clicked");
                // this.zoomImage(this.zoomLevel * 1.1, 75, 35)
                image.setImageXyRange();
            }}>
            <img src={"../../../webpack/resources/webpages/scale-y.svg"} width={image.configHeight}></img>
        </div>
    );
}

/**
 * Button that resets the view to show the full image
 */
export const ElementResetViewToFullButton = ({ image }: { image: Image }) => {
    return (
        <div
            style={{
                // position: "absolute",
                // zIndex: 1000,
                // right: 0,
                // bottom: 200,
                // backgroundColor: "rgba(255, 255,0, 0.5)",
                // width: 100,
                // height: 100,
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",

            }}
            onMouseOver={() => {
                image.setHintText("See full image");
            }}
            onMouseLeave={() => {
                image.setHintText("");
            }}

            onMouseDown={() => {
                // console.log("Zoom In clicked");
                // this.zoomImage(this.zoomLevel * 1.1, 75, 35)
                image.resetViewToFull();
            }}>
            <img src={"../../../webpack/resources/webpages/scale-2y.svg"} width={image.configHeight}></img>

        </div>
    );
}

/**
 * Play/pause button that controls whether the image updates with new data
 */
export const ElementZoomOutButton = ({ image }: { image: Image }) => {
    const [playing, setPlaying] = React.useState(image.playing);
    return (
        <div
            style={{
                // position: "absolute",
                // zIndex: 1000,
                // right: 0,
                // bottom: 0,
                // backgroundColor: "rgba(255, 255,0, 0.5)",
                // width: 100,
                // height: 100,
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",

            }}
            onMouseOver={() => {
                image.setHintText(playing === true ? "Stop image update" : "Start image update");
            }}
            onMouseLeave={() => {
                image.setHintText("");
            }}

            onMouseDown={() => {
                // console.log("Zoom Out clicked");
                // this.zoomImage(this.zoomLevel / 1.1, 75, 35)
                image.setHintText(playing === false ? "Stop image update" : "Start image upate");

                image.setPlaying(!playing);
                setPlaying(!playing);
                if (image.playing === true) {
                    // update immediately
                    image.forceUpdateImage({});
                }

            }}>
            <img src={playing === true ? "../../../webpack/resources/webpages/pause.svg" : "../../../webpack/resources/webpages/play.svg"} width={image.configHeight}></img>

            {/* {playing === true ? "Pause" : "Play"} */}
        </div>
    );
}

// ─── Cursor coordinate readout ────────────────────────────────────────

/**
 * Displays the (x, y, z) coordinates under the cursor
 */
export const ElementXyzCursorValues = ({ image }: { image: Image }) => {
    const [values, setValues] = React.useState([0, 0, 0]);
    image.setXyzCursorValues = setValues;
    return (
        image.lastMouesPositions[0] === -10000 ?
            null :
            <div>
                ({values[0]}, {values[1]}, {values[2]})
            </div>
    )
}

// ─── X / Y range inputs ──────────────────────────────────────────────

/**
 * Input fields for setting the X axis min/max range
 */
export const ElementXrange = ({ image }: { image: Image }) => {
    const [xMin, setXmin] = React.useState(`${image.getXmin()}`);
    const [xMax, setXmax] = React.useState(`${image.getXmax()}`);
    return (
        <div
            style={{
                display: "inline-flex",
                flexDirection: "column",
                width: "100%",
            }}
        >
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "100%",
                    marginBottom: 3,
                    alignItems: "center",
                }}
            >
                <div>X min.:</div>
                <form
                    onSubmit={
                        (event: React.FormEvent<HTMLFormElement>) => {
                            event.preventDefault();
                            let value = parseFloat(xMin);
                            if (isNaN(value)) {
                                setXmin(`${image.getText()["xMin"]}`);
                                return;
                            }
                            image.getText()["xMin"] = value;
                            // this.forceUpdateImage({});
                            image.setImageXyRange();
                        }
                    }
                >
                    <input
                        style={{
                            width: "5em",
                            outline: "none",
                            border: "1px solid black",
                        }}
                        value={xMin}
                        type={"text"}
                        onChange={(event) => {
                            const valueStr = event.target.value;
                            setXmin(valueStr);
                        }}
                        onBlur={(event) => {
                            if (`${image.getText()["xMin"]}` !== xMin) {
                                setXmax(`${image.getText()["xMin"]}`)
                            }
                        }}

                    >
                    </input>
                </form>
            </div>
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "100%",
                    marginBottom: 3,
                    alignItems: "center",
                }}
            >
                <div>X max.:</div>
                <form
                    onSubmit={
                        (event: React.FormEvent<HTMLFormElement>) => {
                            event.preventDefault();
                            let value = parseFloat(xMax);
                            if (isNaN(value)) {
                                setXmax(`${image.getText()["xMax"]}`);
                                return;
                            }
                            image.getText()["xMax"] = value;
                            // this.forceUpdateImage({});
                            image.setImageXyRange();

                        }
                    }
                >
                    <input
                        style={{
                            width: "5em",
                            outline: "none",
                            border: "1px solid black",
                        }}
                        value={xMax}
                        type={"text"}
                        onChange={(event) => {
                            const valueStr = event.target.value;
                            setXmax(valueStr);
                        }}
                        onBlur={(event) => {
                            if (`${image.getText()["xMax"]}` !== xMax) {
                                setXmax(`${image.getText()["xMax"]}`)
                            }
                        }}
                    >
                    </input>
                </form>
            </div>
        </div>
    )
}


/**
 * Input fields for setting the Y axis min/max range
 */
export const ElementYrange = ({ image }: { image: Image }) => {
    const [yMin, setYmin] = React.useState(`${image.getText()["yMin"]}`);
    const [yMax, setYmax] = React.useState(`${image.getText()["yMax"]}`);
    // const [autoXY, setAutoXY] = React.useState(this.getText()["autoXY"]);
    return (
        <div
            style={{
                display: "inline-flex",
                flexDirection: "column",
                width: "100%",
            }}
        >
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "100%",
                    marginBottom: 3,
                    alignItems: "center",
                }}
            >
                <div>Y min.:</div>

                <form
                    onSubmit={
                        (event: React.FormEvent<HTMLFormElement>) => {
                            event.preventDefault();
                            let value = parseFloat(yMin);
                            if (isNaN(value)) {
                                setYmin(`${image.getText()["yMin"]}`);
                                return;
                            }
                            image.getText()["yMin"] = value;
                            image.setImageXyRange()
                        }
                    }
                >
                    <input
                        style={{
                            width: "5em",
                            outline: "none",
                            border: "1px solid black",
                        }}
                        value={yMin}
                        type={"text"}
                        onChange={(event) => {
                            const valueStr = event.target.value;
                            setYmin(valueStr);
                        }}
                        onBlur={(event) => {
                            if (`${image.getText()["yMin"]}` !== yMin) {
                                setYmax(`${image.getText()["yMin"]}`)
                            }
                        }}

                    >
                    </input>
                </form>
            </div>
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "100%",
                    marginBottom: 3,
                    alignItems: "center",
                }}
            >
                <div>Y max.:</div>


                <form
                    onSubmit={
                        (event: React.FormEvent<HTMLFormElement>) => {
                            event.preventDefault();
                            let value = parseFloat(yMax);
                            if (isNaN(value)) {
                                setYmax(`${image.getText()["yMax"]}`);
                                return;
                            }
                            image.getText()["yMax"] = value;
                            image.setImageXyRange()
                        }
                    }
                >
                    <input
                        style={{
                            width: "5em",
                            outline: "none",
                            border: "1px solid black",
                        }}
                        value={yMax}
                        type={"text"}
                        onChange={(event) => {
                            const valueStr = event.target.value;
                            setYmax(valueStr);
                        }}
                        onBlur={(event) => {
                            if (`${image.getText()["yMax"]}` !== yMax) {
                                setYmax(`${image.getText()["yMax"]}`)
                            }
                        }}
                    >
                    </input>
                </form>
            </div>
            {/* <input
                type={"checkbox"}
                checked={autoXY}
                onChange={(event) => {
                    this.getText()["autoXY"] = !autoXY;
                    setAutoXY(!autoXY);
                    // this.processData();
                    this.resetImage();
                    this.forceUpdateImage({});
                }}
            >
            </input> */}

        </div>
    )
}
