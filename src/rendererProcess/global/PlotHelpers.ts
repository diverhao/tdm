// Helper functions for plotting type widgets, such as Scale, DataViewer, XYPlot, Image, Meter, Thermometer

// for widget: XYPlot, ScaledSlider, Thermometer, Tank, and Meter
// Meter does not use refineTicks() as the dial size is unknown, user needs to manually
// adjust the number of ticks

import { Log } from "../../common/Log";

/**
 * Generate tick values for any range and number of ticks
 * 
 * @param valMin - minimum value
 * @param valMax - maximum value
 * @param numTicks - desired number of ticks (can vary ±20%)
 * @param options - optional configuration:
 *   - scale: "linear" (default) or "log10"
 * @returns array of tick values with nice numbers (±20% range and tick count flexibility)
 */
type TickOptions = {
    scale: "Linear" | "Log10";
}

export const calcTicks = (
    valMin: number,
    valMax: number,
    numTicks: number = 11,
    options: TickOptions = { scale: "Linear" }
): number[] => {
    const { scale = "Linear" } = options;

    if (scale === "Log10") {
        return calcTicksLog10(valMin, valMax, numTicks);
    }

    return calcTicksLinear(valMin, valMax, numTicks);
};

/**
 * Linear scale tick generation with nice numbers within ±20% flexibility
 */
const calcTicksLinear = (
    valMin: number,
    valMax: number,
    numTicks: number
): number[] => {
    const range = valMax - valMin;
    const roughTickSize = range / Math.max(numTicks - 1, 1);

    // Find best nice step size with ±20% flexibility
    const step = findBestNiceStepSize(roughTickSize);

    if (step <= 0) {
        return [valMin, valMax];
    }

    const result: number[] = [];

    // Determine decimal places needed
    const fixedDigit = getDecimalPlaces(step);

    // Start from the first tick at or before valMin
    const tickMin = Math.floor(valMin / step) * step;
    const tickMax = Math.ceil(valMax / step) * step;

    for (let tickValue = tickMin; tickValue <= tickMax + 1e-10; tickValue += step) {
        const roundedValue = parseFloat(tickValue.toFixed(fixedDigit));
        if (roundedValue >= valMin - 1e-10 && roundedValue <= valMax + 1e-10) {
            result.push(roundedValue);
        }
    }

    return result.length > 0 ? result : [valMin, valMax];
};

/**
 * Find the best nice step size that keeps decimals minimal
 * Tries step sizes that are 0.8x to 1.2x the rough size
 */
const findBestNiceStepSize = (roughSize: number): number => {
    const tolerance = 0.2; // ±20% tolerance
    const candidates: number[] = [];

    // Generate candidate step sizes by testing nearby nice numbers
    const baseUnit = Math.pow(10, Math.floor(Math.log10(roughSize)));

    // Test multipliers: 1, 2, 5, 10 at current and adjacent magnitude levels
    const testMultipliers = [1, 2, 5, 10];
    const testUnits = [baseUnit / 10, baseUnit, baseUnit * 10];

    for (const unit of testUnits) {
        for (const mult of testMultipliers) {
            const candidate = unit * mult;
            // Check if this step is within ±20% of rough size
            const ratio = candidate / roughSize;
            if (ratio >= 1 - tolerance && ratio <= 1 + tolerance) {
                candidates.push(candidate);
            }
        }
    }

    // If we have candidates, return the one closest to roughSize
    if (candidates.length > 0) {
        return candidates.reduce((best, current) => {
            const bestDiff = Math.abs(best - roughSize);
            const currentDiff = Math.abs(current - roughSize);
            return currentDiff < bestDiff ? current : best;
        });
    }

    // Fallback to the original algorithm if no candidates found
    const unitSize = Math.pow(10, Math.floor(Math.log10(roughSize)));
    const ratio = roughSize / unitSize;

    if (ratio > 5) {
        return unitSize * 10;
    } else if (ratio > 2) {
        return unitSize * 5;
    } else if (ratio > 1) {
        return unitSize * 2;
    } else {
        return unitSize;
    }
};

/**
 * Calculate decimal places needed to represent a step size compactly
 */
const getDecimalPlaces = (step: number): number => {
    if (step >= 1) {
        return 0; // No decimals needed
    }

    // For steps < 1, determine decimal places
    return Math.max(-Math.floor(Math.log10(step)), 0);
};

/**
 * Log10 scale tick generation
 */
const calcTicksLog10 = (valMin: number, valMax: number, numTicks: number): number[] => {
    if (valMin <= 0 || valMax <= 0) {
        Log.error("Log10 scale requires positive values");
        return [valMin, valMax];
    }

    const result: number[] = [];
    const logMin = Math.log10(valMin);
    const logMax = Math.log10(valMax);

    // Generate ticks at powers of 10
    for (let ii = Math.floor(logMin); ii <= Math.ceil(logMax); ii++) {
        const tickValue = Math.pow(10, ii);
        if (tickValue >= valMin - 1e-10 && tickValue <= valMax + 1e-10) {
            result.push(tickValue);
        }
    }

    return result.length > 0 ? result : [valMin, valMax];
};

/**
 * Calculate tick position in unit of pixel
 * 
 * Small tick value has larger position value, the position has larger value on the bottom
 */

export const calcTickPositions = (tickValues: number[], minPvValue: number, maxPvValue: number, fullSize: number, options: TickOptions = { scale: "Linear" }, direction: "horizontal" | "vertical"): number[] => {
    const { scale } = options;
    let useLog10Scale = scale === "Log10" ? true : false;
    const result: number[] = [];

    if (useLog10Scale) {
        minPvValue = Math.log10(minPvValue);
        maxPvValue = Math.log10(maxPvValue);
        for (let tickValue of tickValues) {
            tickValue = Math.log10(tickValue);
            if (minPvValue === Infinity || minPvValue === -Infinity || isNaN(minPvValue)) {
                minPvValue = 0
            }
            if (maxPvValue === Infinity || maxPvValue === -Infinity || isNaN(maxPvValue)) {
                maxPvValue = 0
            }
            if (tickValue === Infinity || tickValue === -Infinity || isNaN(tickValue)) {
                tickValue = 0
            }
            result.push((1 - ((tickValue - minPvValue) / (maxPvValue - minPvValue))) * fullSize);
        }
    } else {
        for (const tickValue of tickValues) {
            result.push((1 - ((tickValue - minPvValue) / (maxPvValue - minPvValue))) * fullSize);
        }
    }
    if (direction === "horizontal") {
        result.forEach((value, index) => { result[index] = fullSize - value });
    }
    return result;
};

/**
 * The ticks may be too long, e.g. [0, 0.2, 0.4, 0.6, 0.8, 1] is overcrowded for the scale. 
 * 
 * This function reduces the ticks by calculating the spacing between 2 adjacent ticks, making sure their spacing is 
 * less than the unitLength, which is typically half of the font size 
 */
export const refineTicks = (rawTicks: number[], unitLength: number, length: number, direction: "horizontal" | "vertical"): string[] => {
    let result: string[] = [];
    // use exponential or regular expression, take whichever is shorter
    for (let ii = 0; ii < rawTicks.length; ii++) {
        const rawExpression = `${rawTicks[ii]}`;
        const exponentialExpression = `${rawTicks[ii].toExponential()}`;
        if (rawExpression.length <= exponentialExpression.length) {
            result.push(rawExpression);
        } else {
            result.push(exponentialExpression);
        }
    }

    let elementHeight = length;
    // if (elementRef.current !== null) {
    //     if (direction === "horizontal") {
    //         elementHeight = elementRef.current.offsetWidth;
    //     } else {
    //         elementHeight = elementRef.current.offsetHeight;
    //     }
    // } else {
    //     return result;
    // }

    // first and last ticks must be kept
    const result1: string[] = [];
    const spacing = elementHeight / (result.length - 1);
    let len = 0;
    for (let ii = 0; ii < result.length; ii++) {
        const tickStr = result[ii];
        if (ii === 0 || ii === result.length - 1) {
            result1.push(tickStr);
            len = len + tickStr.length * unitLength;
        } else if (result.length >= 3 && ii === result.length - 2) {
            // the tick before the last
            const tickStrNext = result[result.length - 1];
            const leni = ii * spacing;
            const a = (tickStr.length * unitLength) / 2
            const b = leni - len - a;
            const c = spacing - a - tickStrNext.length * unitLength;
            if (b >= unitLength * 1.5 && c >= unitLength * 1.5) {
                result1.push(tickStr);
                len = leni + a;
            } else {
                result1.push("");
            }
        } else {
            const leni = ii * spacing;
            const a = (tickStr.length * unitLength) / 2
            const b = leni - len - a;
            if (b >= unitLength * 1.5) {
                result1.push(tickStr);
                len = leni + a;
            } else {
                result1.push("");
            }
        }
    }
    return result1;
};


export const countDuplicates = (arr: any[]) => {
    return arr.reduce((acc: any, val: any) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
    }, {});
}

/**
 * Reduce the data using largestTriangleThreeBuckets
 */
export const downSampleXyData = (xData: number[], yData: number[], threshold: number) => {
    if (threshold >= xData.length || threshold === 0) {
        return [xData, yData]; // No need to downsample
    }

    const xResult: number[] = [];
    const yResult: number[] = [];

    const bucketSize = (xData.length - 2) / (threshold - 2);
    let a = 0; // First point is always included

    xResult.push(xData[a]); // Add first point
    yResult.push(yData[a]); // Add first point

    for (let i = 0; i < threshold - 2; i++) {
        const rangeStart = Math.floor((i + 1) * bucketSize) + 1;
        const rangeEnd = Math.floor((i + 2) * bucketSize) + 1;
        const xRangeData = xData.slice(rangeStart, rangeEnd);
        const yRangeData = yData.slice(rangeStart, rangeEnd);

        let maxArea = -1;
        let chosenIndex = rangeStart;

        // Reference point
        const pointAx = xData[a];
        const pointAy = yData[a];

        // Find the point that forms the largest triangle
        for (let j = 0; j < xRangeData.length; j++) {
            const pointBx = xRangeData[j];
            const pointBy = yRangeData[j];

            const area = Math.abs((pointAx - xData[rangeEnd]) * (pointBy - pointAy) - (pointAx - pointBx) * (yData[rangeEnd] - pointAy));

            if (area > maxArea) {
                maxArea = area;
                chosenIndex = rangeStart + j;
            }
        }

        xResult.push(xData[chosenIndex]);
        yResult.push(yData[chosenIndex]);
        a = chosenIndex; // Move to the chosen point
    }

    xResult.push(xData[xData.length - 1]); // Add last point
    yResult.push(yData[xData.length - 1]); // Add last point

    return [xResult, yResult];
}

/**
 * Find low and high bound indices for the range that the values are >= low and <= high
 * 
 * @param data must be a sorted ascending array
 */
export const binarySearchRange = (data: number[], low: number, high: number): [number, number] => {
    // Find the left boundary (first index where arr[i] >= low)
    let left = binarySearch(data, low, true);

    // Find the right boundary (first index where arr[i] > high)
    // index is inclusive
    let right = Math.min(binarySearch(data, high, false) - 1, data.length);

    // If no valid range exists
    if (left > right) return [-100, -100];

    return ([left, right]);

}

// Standard binary search, mode = true finds first >= target, mode = false finds first > target
const binarySearch = (data: number[], target: number, mode: boolean) => {
    let left = 0;
    let right = data.length;

    while (left < right) {
        let mid = Math.floor((left + right) / 2);

        if (data[mid] < target || (!mode && data[mid] === target)) {
            left = mid + 1;
        } else {
            right = mid;
        }
    }

    return left;
}
