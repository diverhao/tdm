/**
 * ROI (Region of Interest) overlay elements for the Image widget.
 *
 * Each ROI is stored in **image-pixel coordinates** (matching the axes)
 * and rendered as a CSS-positioned rectangle overlay on the three.js canvas.
 * The overlay automatically tracks with pan/zoom because screen positions
 * are recomputed from the current view range (`imageInfo`) on every render.
 *
 * Interactions:
 * - **Move**: mouseDown on the ROI interior → drag to reposition
 * - **Resize**: mouseDown on an edge handle → drag to resize
 * - On mouseUp the updated image-pixel position/size is written to the
 *   four EPICS PVs (x, y, width, height) defined in `regionsOfInterest`.
 */
import * as React from "react";
import type { ImagePlot } from "./ImagePlot";
import { TcaChannel } from "../../channel/TcaChannel";
import { g_widgets1 } from "../../global/GlobalVariables";
import { Log } from "../../../common/Log";

// ────────────────────── PV helpers ──────────────────────

/** Check if a PV name is a non-empty, recognized channel. */
const isValidRoiPv = (pvName: string): boolean => {
    if (!pvName) return false;
    const kind = TcaChannel.checkChannelName(pvName);
    return kind !== undefined;
};

/**
 * Build the channel-key that `g_widgets1.getTcaChannel()` expects.
 *
 * - **local / global** channels: strip the `=initValue` suffix and
 *   append `@window_<id>` (matching what `processChannelNames` produces).
 * - **ca / pva** channels: use the raw PV name as-is.
 */
const roiChannelKey = (pvName: string): string => {
    const kind = TcaChannel.checkChannelName(pvName);
    if (kind === "local" || kind === "global") {
        const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
        return pvName.split("=")[0] + "@window_" + displayWindowId;
    }
    return pvName;
};

/**
 * Read the current numeric value of a channel PV.
 * Returns `defaultValue` when the PV name is empty or the channel
 * is not yet available.
 */
export function readRoiPvValue(pvName: string, defaultValue: number): number;
export function readRoiPvValue(pvName: string, defaultValue: undefined): number | undefined;
export function readRoiPvValue(pvName: string, defaultValue: number | undefined): number | undefined {
    if (!isValidRoiPv(pvName)) return defaultValue;
    try {
        const channel = g_widgets1.getTcaChannel(roiChannelKey(pvName));
        const val = channel.getDbrData()["value"];
        if (typeof val === "number") return val;
    } catch (_e) {
        /* channel may not be available yet */
    }
    // Fallback: parse initial value from PV name  (e.g. "loc://roi_x=42")
    const parts = pvName.split("=");
    if (parts.length >= 2) {
        const parsed = parseFloat(parts[parts.length - 1]);
        if (!isNaN(parsed)) return parsed;
    }
    return defaultValue;
}

/** Write a numeric value to a channel PV.
 *  Silently skipped when the PV name is empty. */
const writeRoiPvValue = (pvName: string, value: number) => {
    console.log("write ROI pv")
    if (!isValidRoiPv(pvName)) return;
    try {
        const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
        const channel = g_widgets1.getTcaChannel(roiChannelKey(pvName));
        channel.put(displayWindowId, { value: value }, 1);
    } catch (e) {
        Log.error("ROI writeRoiPvValue failed for", pvName, "value", value, e);
    }
};

// ────────────────────── ElementRois ──────────────────────

/**
 * Renders all ROI overlays for the image plot.
 * Positioned as an absolute overlay on top of the three.js canvas.
 */
export const ElementRois = ({ plot }: { plot: ImagePlot }) => {
    const rois = plot.getMainWidget().getRegionsOfInterest();
    if (rois.length === 0 || g_widgets1.isEditing()) {
        return null;
    }
    return (
        <div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                overflow: "hidden",
                zIndex: 1,
            }}
        >
            {rois.map((roi, index) => (
                <ElementRoi key={index} plot={plot} index={index} roiData={roi} />
            ))}
        </div>
    );
};

// ────────────────────── ElementRoi ──────────────────────

/** Screen pixels for each edge resize hit-area. */
const HANDLE_THICKNESS = 6;
/** Minimum ROI dimension in image pixels. */
const MIN_ROI_SIZE = 1;

/**
 * A single ROI rectangle overlaid on the image.
 *
 * Coordinates in image-pixel space:
 * - `roiX` : left edge   (X increases rightward)
 * - `roiY` : bottom edge (Y increases upward, matching the axis)
 * - `roiW` : width
 * - `roiH` : height
 *
 * The rectangle covers `[roiX, roiX+roiW] × [roiY, roiY+roiH]` in image space.
 */
const ElementRoi = ({
    plot,
    index,
    roiData,
}: {
    plot: ImagePlot;
    index: number;
    roiData: {
        xPv: string;
        yPv: string;
        widthPv: string;
        heightPv: string;
        color: string;
    };
}) => {
    // ── state: image-pixel coordinates ──
    // Seeded from PV values when available; otherwise use sensible defaults
    // so the ROI box is always visible.
    const DEFAULT_XY = 20;
    const DEFAULT_WH = 50;

    const [roiX, setRoiX] = React.useState(() => readRoiPvValue(roiData.xPv, DEFAULT_XY));
    const [roiY, setRoiY] = React.useState(() => readRoiPvValue(roiData.yPv, DEFAULT_XY));
    const [roiW, setRoiW] = React.useState(
        () => Math.max(MIN_ROI_SIZE, readRoiPvValue(roiData.widthPv, DEFAULT_WH))
    );
    const [roiH, setRoiH] = React.useState(
        () => Math.max(MIN_ROI_SIZE, readRoiPvValue(roiData.heightPv, DEFAULT_WH))
    );

    // Register state setters so ImagePlot.updateRoisFromPvs() can push
    // PV-driven updates into this component.
    React.useEffect(() => {
        plot.roiUpdaters.set(index, { setRoiX, setRoiY, setRoiW, setRoiH });
        return () => { plot.roiUpdaters.delete(index); };
    }, [plot, index]);

    /** Write the rounded image-pixel position/size to the four PVs. */
    const writePvs = (x: number, y: number, w: number, h: number) => {
        writeRoiPvValue(roiData.xPv, Math.round(x));
        writeRoiPvValue(roiData.yPv, Math.round(y));
        writeRoiPvValue(roiData.widthPv, Math.round(w));
        writeRoiPvValue(roiData.heightPv, Math.round(h));
    };

    // ── coordinate conversion ──

    const info = plot.getImageInfo();
    const { imageShownXmin, imageShownXmax, imageShownYmin, imageShownYmax } = info;
    const plotW = plot.getPlotWidth();
    const plotH = plot.getPlotHeight();
    const xRange = imageShownXmax - imageShownXmin;
    const yRange = imageShownYmax - imageShownYmin;

    if (xRange <= 0 || yRange <= 0 || plotW <= 0 || plotH <= 0) {
        return null;
    }

    // image-pixel → screen-pixel CSS values
    const screenLeft = ((roiX - imageShownXmin) / xRange) * plotW;
    const screenTop = ((imageShownYmax - roiY - roiH) / yRange) * plotH;
    const screenWidth = (roiW / xRange) * plotW;
    const screenHeight = (roiH / yRange) * plotH;

    // conversion factors for drag deltas (constant during a drag session)
    const imgPerScreenX = xRange / plotW;
    const imgPerScreenY = yRange / plotH;

    const borderColor = roiData.color || "yellow";

    // ── move handler ──

    const handleMoveStart = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        let curX = roiX;
        let curY = roiY;
        const curW = roiW;
        const curH = roiH;

        const onMove = (ev: MouseEvent) => {
            curX += ev.movementX * imgPerScreenX;
            curY -= ev.movementY * imgPerScreenY; // screen Y is flipped
            setRoiX(curX);
            setRoiY(curY);
        };
        const onUp = () => {
            writePvs(curX, curY, curW, curH);
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    };

    // ── resize handlers ──

    /**
     * Screen-top edge = image-space top (roiY + roiH).
     * Dragging up (negative screen dY) increases roiH; roiY unchanged.
     */
    const handleResizeTopStart = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        let curH = roiH;
        const onMove = (ev: MouseEvent) => {
            const dImgY = -ev.movementY * imgPerScreenY;
            curH = Math.max(MIN_ROI_SIZE, curH + dImgY);
            setRoiH(curH);
        };
        const onUp = () => {
            writePvs(roiX, roiY, roiW, curH);
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    };

    /**
     * Screen-bottom edge = image-space bottom (roiY).
     * Dragging down (positive screen dY, negative image dY) decreases roiY,
     * increases roiH.
     */
    const handleResizeBottomStart = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        let curY = roiY;
        let curH = roiH;
        const onMove = (ev: MouseEvent) => {
            const dImgY = -ev.movementY * imgPerScreenY;
            const newY = curY + dImgY;
            const newH = curH - dImgY;
            if (newH >= MIN_ROI_SIZE) {
                curY = newY;
                curH = newH;
                setRoiY(curY);
                setRoiH(curH);
            }
        };
        const onUp = () => {
            writePvs(roiX, curY, roiW, curH);
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    };

    /**
     * Screen-left edge = image-space left (roiX).
     * Dragging left (negative screen dX, negative image dX) decreases roiX,
     * increases roiW.
     */
    const handleResizeLeftStart = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        let curX = roiX;
        let curW = roiW;
        const onMove = (ev: MouseEvent) => {
            const dImgX = ev.movementX * imgPerScreenX;
            const newX = curX + dImgX;
            const newW = curW - dImgX;
            if (newW >= MIN_ROI_SIZE) {
                curX = newX;
                curW = newW;
                setRoiX(curX);
                setRoiW(curW);
            }
        };
        const onUp = () => {
            writePvs(curX, roiY, curW, roiH);
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    };

    /**
     * Screen-right edge = image-space right (roiX + roiW).
     * Dragging right increases roiW; roiX unchanged.
     */
    const handleResizeRightStart = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        let curW = roiW;
        const onMove = (ev: MouseEvent) => {
            const dImgX = ev.movementX * imgPerScreenX;
            curW = Math.max(MIN_ROI_SIZE, curW + dImgX);
            setRoiW(curW);
        };
        const onUp = () => {
            writePvs(roiX, roiY, curW, roiH);
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    };

    // ── render ──

    return (
        <div
            style={{
                position: "absolute",
                left: screenLeft,
                top: screenTop,
                width: screenWidth,
                height: screenHeight,
                pointerEvents: "none",
            }}
        >
            {/* Visible border */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    border: `2px solid ${borderColor}`,
                    boxSizing: "border-box",
                    pointerEvents: "none",
                }}
            />

            {/* Move handle (interior) */}
            <div
                style={{
                    position: "absolute",
                    top: HANDLE_THICKNESS / 2,
                    left: HANDLE_THICKNESS / 2,
                    right: HANDLE_THICKNESS / 2,
                    bottom: HANDLE_THICKNESS / 2,
                    cursor: "move",
                    pointerEvents: "auto",
                }}
                onMouseDown={handleMoveStart}
            />

            {/* Top resize handle */}
            <div
                style={{
                    position: "absolute",
                    top: -HANDLE_THICKNESS / 2,
                    left: HANDLE_THICKNESS / 2,
                    right: HANDLE_THICKNESS / 2,
                    height: HANDLE_THICKNESS,
                    cursor: "ns-resize",
                    pointerEvents: "auto",
                }}
                onMouseDown={handleResizeTopStart}
            />

            {/* Bottom resize handle */}
            <div
                style={{
                    position: "absolute",
                    bottom: -HANDLE_THICKNESS / 2,
                    left: HANDLE_THICKNESS / 2,
                    right: HANDLE_THICKNESS / 2,
                    height: HANDLE_THICKNESS,
                    cursor: "ns-resize",
                    pointerEvents: "auto",
                }}
                onMouseDown={handleResizeBottomStart}
            />

            {/* Left resize handle */}
            <div
                style={{
                    position: "absolute",
                    left: -HANDLE_THICKNESS / 2,
                    top: HANDLE_THICKNESS / 2,
                    bottom: HANDLE_THICKNESS / 2,
                    width: HANDLE_THICKNESS,
                    cursor: "ew-resize",
                    pointerEvents: "auto",
                }}
                onMouseDown={handleResizeLeftStart}
            />

            {/* Right resize handle */}
            <div
                style={{
                    position: "absolute",
                    right: -HANDLE_THICKNESS / 2,
                    top: HANDLE_THICKNESS / 2,
                    bottom: HANDLE_THICKNESS / 2,
                    width: HANDLE_THICKNESS,
                    cursor: "ew-resize",
                    pointerEvents: "auto",
                }}
                onMouseDown={handleResizeRightStart}
            />
        </div>
    );
};
