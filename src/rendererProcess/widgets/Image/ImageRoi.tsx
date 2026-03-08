/**
 * ROI (Region of Interest) elements and resize handlers for the
 * Image widget.
 *
 * Each ROI is a draggable/resizable rectangle overlaid on the image.
 * The four edges can be resized independently; the resulting pixel
 * coordinates are written back to local PVs via {@link updateRoiPvs}.
 */
import * as React from "react";
import type { Image } from "./Image";
import { TcaChannel } from "../../channel/TcaChannel";
import { g_widgets1 } from "../../global/GlobalVariables";
import { Log } from "../../../common/Log";

// ───────────────────── resize handlers ─────────────────────

export const resizeRoiTopHandler = (image: Image, event: MouseEvent | undefined, index: number) => {
    if (event === undefined) {
        return;
    }
    const dx = event.movementX;
    const dy = event.movementY;
    const setRoiTop = image.setRoisTop[index];
    const setRoiHeight = image.setRoisHeight[index];
    if (setRoiHeight === undefined || setRoiTop === undefined) {
        return;
    }
    setRoiTop((oldTop: number) => {
        return Math.max(oldTop + dy, 0);
    });
    setRoiHeight((oldHeight: number) => {
        return Math.max(10, oldHeight - dy);
    });
};

// resizingRoi = false;

export const resizeRoiTopHandlerMouseUp = (image: Image, event: MouseEvent | undefined, index: number) => {
    // image.resizingRoi = false;
    updateRoiPvs(image, index);
    window.removeEventListener("mousemove", image.resizeRoiTopHandlers[index]);
    window.removeEventListener("mouseup", image.resizeRoiTopHandlersMouseUp[index]);
};

export const resizeRoiBottomHandler = (image: Image, event: MouseEvent | undefined, index: number) => {
    if (event === undefined) {
        return;
    }
    const dx = event.movementX;
    const dy = event.movementY;
    const setRoiHeight = image.setRoisHeight[index];
    if (setRoiHeight === undefined) {
        return;
    }

    setRoiHeight((oldHeight: number) => {
        return Math.max(oldHeight + dy, 10);
    });
};

export const resizeRoiBottomHandlerMouseUp = (image: Image, event: MouseEvent | undefined, index: number) => {
    // image.resizingRoi = false;
    updateRoiPvs(image, index);
    window.removeEventListener("mousemove", image.resizeRoiBottomHandlers[index]);
    window.removeEventListener("mouseup", image.resizeRoiBottomHandlersMouseUp[index]);
};

export const resizeRoiLeftHandler = (image: Image, event: MouseEvent | undefined, index: number) => {
    if (event === undefined) {
        return;
    }
    const dx = event.movementX;
    const dy = event.movementY;
    const setRoiLeft = image.setRoisLeft[index];
    const setRoiWidth = image.setRoisWidth[index];
    if (setRoiLeft === undefined || setRoiWidth === undefined) {
        return;
    }

    setRoiLeft((oldLeft: number) => {
        return Math.max(0, oldLeft + dx);
    });
    setRoiWidth((oldWidth: number) => {
        return Math.max(10, oldWidth - dx);
    });
};

export const resizeRoiLeftHandlerMouseUp = (image: Image, event: MouseEvent | undefined, index: number) => {
    // image.resizingRoi = false;
    updateRoiPvs(image, index);
    window.removeEventListener("mousemove", image.resizeRoiLeftHandlers[index]);
    window.removeEventListener("mouseup", image.resizeRoiLeftHandlersMouseUp[index]);
};

export const resizeRoiRightHandler = (image: Image, event: MouseEvent | undefined, index: number) => {
    if (event === undefined) {
        return;
    }
    const dx = event.movementX;
    const dy = event.movementY;
    const setRoiWidth = image.setRoisWidth[index];
    if (setRoiWidth === undefined) {
        return;
    }
    setRoiWidth((oldWidth: number) => {
        return Math.max(10, oldWidth + dx);
    });
};

export const resizeRoiRightHandlerMouseUp = (image: Image, event: MouseEvent | undefined, index: number) => {
    // image.resizingRoi = false;
    updateRoiPvs(image, index);
    window.removeEventListener("mousemove", image.resizeRoiRightHandlers[index]);
    window.removeEventListener("mouseup", image.resizeRoiRightHandlersMouseUp[index]);
};

// ───────────────────── ROI PV update ─────────────────────

/**
 * Write the current ROI rectangle (in image coordinates) back to the
 * four local PVs (x, y, width, height).
 */
export const updateRoiPvs = (image: Image, index: number) => {
    const elementRef = image.roisRef[index];
    const roiData = image.getRegionsOfInterest()[index];
    if (elementRef !== undefined && elementRef.current !== null) {
        if (
            (TcaChannel.checkChannelName(roiData["xPv"]) === "global"
                || TcaChannel.checkChannelName(roiData["xPv"]) === "local")
            &&
            (TcaChannel.checkChannelName(roiData["yPv"]) === "global"
                || TcaChannel.checkChannelName(roiData["yPv"]) === "local")
            &&
            (TcaChannel.checkChannelName(roiData["widthPv"]) === "global"
                || TcaChannel.checkChannelName(roiData["widthPv"]) === "local")
            &&
            (TcaChannel.checkChannelName(roiData["heightPv"]) === "global"
                || TcaChannel.checkChannelName(roiData["heightPv"]) === "local")
        ) {

            const rectRoi = elementRef.current.getBoundingClientRect();

            const xyzTopLeft = image.calcImageXyzFromPixel(rectRoi.left, rectRoi.top);
            // const xyzBottomLeft = image.calcImageXyzFromPixel(rectRoi.left, rectRoi.top + rectRoi.height);
            // const xyzTopRight = image.calcImageXyzFromPixel(rectRoi.left + rectRoi.width, rectRoi.top);
            const xyzBottomRight = image.calcImageXyzFromPixel(rectRoi.left + rectRoi.width, rectRoi.top + rectRoi.height);
            try {

                const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
                const tcaChannelX = g_widgets1.getTcaChannel(roiData["xPv"].split("=")[0] + "@window_" + displayWindowId);
                const tcaChannelY = g_widgets1.getTcaChannel(roiData["yPv"].split("=")[0] + "@window_" + displayWindowId);
                const tcaChannelWidth = g_widgets1.getTcaChannel(roiData["widthPv"].split("=")[0] + "@window_" + displayWindowId);
                const tcaChannelHeight = g_widgets1.getTcaChannel(roiData["heightPv"].split("=")[0] + "@window_" + displayWindowId);
                // console.log("===> ", xyzTopLeft[0], rectRoi);
                if (tcaChannelX.getDbrData()["value"] !== xyzTopLeft[0]) {
                    tcaChannelX.put(displayWindowId, { value: xyzTopLeft[0] }, 1);
                }
                if (tcaChannelY.getDbrData()["value"] !== xyzTopLeft[1]) {
                    tcaChannelY.put(displayWindowId, { value: xyzTopLeft[1] }, 1);
                }
                if (tcaChannelWidth.getDbrData()["value"] !== (xyzBottomRight[0] - xyzTopLeft[0])) {
                    tcaChannelWidth.put(displayWindowId, { value: xyzBottomRight[0] - xyzTopLeft[0] }, 1);
                }
                if (tcaChannelHeight.getDbrData()["value"] !== (xyzBottomRight[1] - xyzTopLeft[1])) {
                    tcaChannelHeight.put(displayWindowId, { value: xyzBottomRight[1] - xyzTopLeft[1] }, 1);
                }

            } catch (e) {
                Log.error(e);
            }
        }
    }
}

// ───────────────────── ElementRoi ─────────────────────

/**
 * A single draggable/resizable ROI rectangle overlaid on the image.
 */
export const ElementRoi = ({ image, index }: { image: Image, index: number }) => {

    const roiData = image.getRegionsOfInterest()[index];
    if (roiData === undefined) {
        return null;
    }

    if (TcaChannel.checkChannelName(roiData["xPv"]) !== "local") {
        return null;
    }

    if (TcaChannel.checkChannelName(roiData["yPv"]) !== "local") {
        return null;
    }

    if (TcaChannel.checkChannelName(roiData["widthPv"]) !== "local") {
        return null;
    }

    if (TcaChannel.checkChannelName(roiData["heightPv"]) !== "local") {
        return null;
    }

    // initialized to a fixed number, after the local channel is created, the value will be updated
    const [top, setTop] = React.useState(10);
    const [left, setLeft] = React.useState(10);
    const [width, setWidth] = React.useState(20);
    const [height, setHeight] = React.useState(20);

    image.setRoisTop[index] = setTop;
    image.setRoisLeft[index] = setLeft;
    image.setRoisWidth[index] = setWidth;
    image.setRoisHeight[index] = setHeight;

    const elementRef = React.useRef<HTMLDivElement>(null);
    image.roisRef[index] = elementRef;

    /**
     * After each rendering, update the local pv values
     */
    React.useEffect(() => {
        // ! there is a bug here, loop
        // updateRoiPvs(image, index);
    })

    return (
        <div
            ref={elementRef}
            style={{
                position: "absolute",
                top: top,
                left: left,
                width: width,
                height: height,
                border: "solid 3px yellow",
                boxSizing: "border-box",
            }}
        >
            {/* top */}
            <div
                style={{
                    position: "absolute",
                    backgroundColor: "red",
                    top: -5,
                    left: 0,
                    width: "100%",
                    height: 10,
                    cursor: "ns-resize",
                }}
                onMouseDown={(event) => {
                    // image.resizingRoi = true;
                    window.addEventListener("mousemove", image.resizeRoiTopHandlers[index]);
                    window.addEventListener("mouseup", image.resizeRoiTopHandlersMouseUp[index]);
                }}
            >
            </div>
            {/* left */}
            <div
                style={{
                    position: "absolute",
                    backgroundColor: "blue",
                    top: 0,
                    left: -5,
                    height: "100%",
                    width: 10,
                    cursor: "ew-resize",

                }}
                onMouseDown={(event) => {
                    // image.resizingRoi = true;
                    window.addEventListener("mousemove", image.resizeRoiLeftHandlers[index]);
                    window.addEventListener("mouseup", image.resizeRoiLeftHandlersMouseUp[index]);
                }}
            >
            </div>
            {/* bottom */}
            <div
                style={{
                    position: "absolute",
                    backgroundColor: "red",
                    bottom: -5,
                    left: 0,
                    height: 10,
                    width: "100%",
                    cursor: "ns-resize",
                }}
                onMouseDown={(event) => {
                    // image.resizingRoi = true;
                    window.addEventListener("mousemove", image.resizeRoiBottomHandlers[index]);
                    window.addEventListener("mouseup", image.resizeRoiBottomHandlersMouseUp[index]);
                }}
            >
            </div>
            {/* right */}
            <div
                style={{
                    position: "absolute",
                    backgroundColor: "cyan",
                    top: 0,
                    right: -5,
                    height: "100%",
                    width: 10,
                    cursor: "ew-resize",
                }}
                onMouseDown={(event) => {
                    // image.resizingRoi = true;
                    window.addEventListener("mousemove", image.resizeRoiRightHandlers[index]);
                    window.addEventListener("mouseup", image.resizeRoiRightHandlersMouseUp[index]);
                }}
            >
            </div>

        </div>
    )
}
