import { v4 as uuidv4 } from "uuid";
import { Log } from "./Log";

// -------------------- color -----------------------

/**
 * Convert an array of 4 numbers to "rgba()" string representing a color
 * 
 * First 3 numbers in array must be between 0 and 255, last one must be between 0 and 100.
 * 
 * fallback to black color if there is anything wrong
 */
export const rgbaArrayToRgbaStr = (rgbaArray: number[]): string => {
    let fallbackColor = "rgba(0,0,0,1)";

    // if there are more than 4 elements
    if (rgbaArray.length !== 4) {
        return fallbackColor;
    }

    // if there are less than 4 elements
    // NaN is false when comparing with any number
    if (typeof rgbaArray[0] !== "number" || rgbaArray[0] > 255 || rgbaArray[0] < 0) {
        return fallbackColor;
    }
    if (typeof rgbaArray[1] !== "number" || rgbaArray[1] > 255 || rgbaArray[1] < 0) {
        return fallbackColor;
    }
    if (typeof rgbaArray[2] !== "number" || rgbaArray[2] > 255 || rgbaArray[2] < 0) {
        return fallbackColor;
    }
    if (typeof rgbaArray[3] !== "number" || rgbaArray[3] > 100 || rgbaArray[3] < 0) {
        return fallbackColor;
    }

    // fractional numbers are fine for rgba color
    const rStr = rgbaArray[0].toString();
    const gStr = rgbaArray[1].toString();
    const bStr = rgbaArray[2].toString();
    const aStr = (rgbaArray[3] / 100).toString();
    return "rgba(" + rStr + "," + gStr + "," + bStr + "," + aStr + ")";
};

/**
 * Convert a RGBA string such as "rgba(10, 100, 200, 0.5)" to a 4-number array like [10, 100, 200, 50]
 * 
 * fallback to black color if there is anything wrong
 */
export const rgbaStrToRgbaArray = (rgbaString: string) => {
    let fallbackColor = [0, 0, 0, 100];
    try {
        let rgbaArray = JSON.parse(rgbaString.replace("rgba", "").replace("(", "[").replace(")", "]"));
        // type check the result
        if (!Array.isArray(rgbaArray)) {
            return [0, 0, 0, 100];
        }

        // if there are more than 4 elements
        if (rgbaArray.length !== 4) {
            return fallbackColor;
        }

        // if there are less than 4 elements
        // NaN is false when comparing with any number
        if (typeof rgbaArray[0] !== "number" || rgbaArray[0] > 255 || rgbaArray[0] < 0) {
            return fallbackColor;
        }
        if (typeof rgbaArray[1] !== "number" || rgbaArray[1] > 255 || rgbaArray[1] < 0) {
            return fallbackColor;
        }
        if (typeof rgbaArray[2] !== "number" || rgbaArray[2] > 255 || rgbaArray[2] < 0) {
            return fallbackColor;
        }
        if (typeof rgbaArray[3] !== "number" || rgbaArray[3] > 1 || rgbaArray[3] < 0) {
            return fallbackColor;
        }

        rgbaArray[3] = rgbaArray[3] * 100;
        return rgbaArray;
    } catch (e) {
        return fallbackColor;
    }
};

// --------------------- angle ----------------------

/**
 * Find angle value from a string like "...(-37.8 deg)..." to an integer -38
 * 
 * Fallback to 0 if there is anything wrong
 */
export const parseCSSAngle = (str: string): number => {
    let fallbackAngle = 0;
    // array of string or null
    const angles = str.trim().match(/\(([\s]*)([+-]?)([0-9]+)(\.[0-9]+)?([\s]*)deg([\s]*)\)/g);
    if (angles !== null && angles.length === 1) {
        const angleStr = angles[0].replace("(", "").replace(")", "").replace("deg", "");
        const angle = parseInt(angleStr);
        if (!isNaN(angle)) {
            return Math.round(angle);
        }
    }
    return fallbackAngle;
};

/**
 * Replace the angle in "...rotate(-38.6 deg)..."
 */
export const replaceCSSAngle = (angle: number, str: string): string => {
    const index1 = str.indexOf("rotate") + 6;
    const index2 = str.indexOf("deg");

    const str1 = str.slice(0, index1);
    const str2 = str.slice(index2);
    const angleInt = Math.round(angle);
    const result = `${str1}(${angleInt}${str2}`;
    return result;
};

// ----------------- map, object operations -------------------

/**
 * Insert a new entry to a particular index in map
 */
export const insertToMapAtIndex = (map: Map<string, any>, index: number, newKey: string, newValue: any) => {
    const keys = [...map.keys()];
    const values = [...map.values()];
    map.clear();
    // insert
    keys.splice(index, 0, newKey);
    values.splice(index, 0, newValue);
    for (let ii = 0; ii < keys.length; ii++) {
        const key = keys[ii];
        const value = values[ii];
        map.set(key, value);
    }
};

/**
 * Delete a map entry at the index
 * 
 * Return the deleted key-value
 */
export const deleteFromMapAtIndex = (map: Map<string, any>, index: number): [string, any] => {
    const keys = [...map.keys()];
    const values = [...map.values()];
    const key = keys[index];
    const value = values[index];
    map.clear();
    // insert
    keys.splice(index, 1);
    values.splice(index, 1);
    for (let ii = 0; ii < keys.length; ii++) {
        const key = keys[ii];
        const value = values[ii];
        map.set(key, value);
    }
    return [key, value];
};

/**
 * Insert one or more new entries to the map, after a particular key.
 */
export const insertToMapAfterKey = <K, V>(map: Map<K, V>, afterKey: K, entriesToInsert: [K, V][]) => {
    const newMap = new Map<K, V>();
    for (const [key, value] of map) {
        newMap.set(key, value);
        if (key === afterKey) {
            for (const [insertKey, insertValue] of entriesToInsert) {
                newMap.set(insertKey, insertValue);
            }
        }
    }
    return newMap;
};

/**
 * Insert a name-value pair to an object at a particular index
 */
export const insertToObjectAtIndex = (obj: Record<string, any>, index: number, propertyName: string, propertyValue: any) => {
    // save keys and values
    const keys = Object.keys(obj);
    const values = Object.values(obj);
    // empty the object
    for (let key of keys) {
        delete obj[key];
    }
    // insert new key and value
    keys.splice(index, 0, propertyName);
    values.splice(index, 0, propertyValue);
    // refill the object
    for (let ii = 0; ii < keys.length; ii++) {
        const key = keys[ii];
        const value = values[ii];
        obj[key] = value;
    }
};

/**
 * Merge two arrays or two plain objects into a new top-level value.
 *
 * Top-level arrays are merged by index. Objects are merged recursively, while
 * nested arrays and other non-plain-object values from `source` replace the
 * corresponding values in `target`.
 *
 * Set `clone` to `false` for structural sharing of nested values, such as
 * high-frequency DBR updates containing waveform arrays.
 */
export const deepMerge = (target: any, source: any, clone: boolean = true): any => {
    const isPlainObject = (value: any): value is Record<string, any> => {
        if (typeof value !== "object" || value === null) {
            return false;
        }
        const prototype = Object.getPrototypeOf(value);
        return prototype === Object.prototype || prototype === null;
    };

    const merge = (targetValue: any, sourceValue: any): any => {
        if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
            const result = [...targetValue];
            sourceValue.forEach((value, index) => result[index] = value);
            return result;
        }

        if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
            const result = { ...targetValue };
            for (const key of Object.keys(sourceValue)) {
                const targetChild = targetValue[key];
                const sourceChild = sourceValue[key];
                result[key] = isPlainObject(targetChild) && isPlainObject(sourceChild)
                    ? merge(targetChild, sourceChild)
                    : sourceChild;
            }
            return result;
        }

        throw new TypeError("deepMerge expects two arrays or two plain objects");
    };

    const result = merge(target, source);
    return clone ? structuredClone(result) : result;
};



// ---------------------------------- plot ticks -------------------------
// for widget: XYPlot, ScaledSlider, Thermometer, Tank, and Meter
// Meter does not use refineTicks() as the dial size is unknown, user needs to manually
// adjust the number of ticks

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

// -------------------- color -------------------------

/**
 * Verify if a string represents a valid rgba color, i.e. "rgba(255, 255, 255 ,1)"
 */
export const isValidRgbaColor = (color: string): boolean => {
    const rgbaRegex = /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(0?\.?\d+|1)\s*\)$/;

    if (!rgbaRegex.test(color)) return false;

    const match = color.match(rgbaRegex)!;
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);

    // Check if RGB values are in valid range (0-255)
    return r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255;
}

/**
 * Return if the operating system is running in dark mode.
 */
export const isDarkMode = () => window.matchMedia("(prefers-color-scheme: dark)").matches;




const _RGBA_COLORS: string[] = [
    "rgba(255, 0, 0, 1)",
    "rgba(0, 200, 0, 1)",
    "rgba(0, 0, 255, 1)",
    "rgba(255, 165, 0, 1)",
    "rgba(128, 0, 128, 1)",
    "rgba(0, 206, 209, 1)",
    "rgba(255, 20, 147, 1)",
    "rgba(0, 128, 0, 1)",
    "rgba(255, 215, 0, 1)",
    "rgba(70, 130, 180, 1)",
    "rgba(255, 69, 0, 1)",
    "rgba(0, 255, 127, 1)",
    "rgba(138, 43, 226, 1)",
    "rgba(255, 140, 0, 1)",
    "rgba(30, 144, 255, 1)",
    "rgba(220, 20, 60, 1)",
    "rgba(0, 191, 255, 1)",
    "rgba(50, 205, 50, 1)",
    "rgba(255, 105, 180, 1)",
    "rgba(100, 149, 237, 1)",
    "rgba(255, 99, 71, 1)",
    "rgba(0, 250, 154, 1)",
    "rgba(173, 255, 47, 1)",
    "rgba(255, 0, 255, 1)",
    "rgba(64, 224, 208, 1)",
    "rgba(255, 215, 180, 1)",
    "rgba(0, 128, 128, 1)",
    "rgba(210, 105, 30, 1)",
    "rgba(147, 112, 219, 1)",
    "rgba(255, 160, 122, 1)",
    "rgba(0, 139, 139, 1)",
    "rgba(255, 228, 0, 1)",
    "rgba(127, 255, 0, 1)",
    "rgba(186, 85, 211, 1)",
    "rgba(255, 127, 80, 1)",
    "rgba(32, 178, 170, 1)",
    "rgba(240, 128, 128, 1)",
    "rgba(0, 206, 64, 1)",
    "rgba(255, 182, 193, 1)",
    "rgba(65, 105, 225, 1)",
    "rgba(255, 83, 13, 1)",
    "rgba(0, 168, 107, 1)",
    "rgba(205, 92, 92, 1)",
    "rgba(72, 209, 204, 1)",
    "rgba(255, 218, 185, 1)",
    "rgba(0, 100, 148, 1)",
    "rgba(218, 165, 32, 1)",
    "rgba(152, 251, 152, 1)",
    "rgba(255, 36, 0, 1)",
    "rgba(0, 71, 171, 1)",
];

export const generateRgbaColor = (index: number): string => {
    return _RGBA_COLORS[index % _RGBA_COLORS.length];
};

export const generateWidgetKey = (type: string) => {
    return `${type}_${uuidv4()}`
}


/**
 * Check if a string is a data URI (e.g., data:image/png;base64,...)
 */
export const isDataUri = (str: string): boolean => {
    return str.startsWith('data:');
};


export const isRemotePath = (path: string) => {
    if (path.startsWith("http://") || path.startsWith("https://")) {
        return true;
    } else {
        return false;
    }
};

export const mapXYsToPointsWebGl = (xData: number[], yData: number[], xMin: number, xMax: number, yMin: number, yMax: number,) => {

    const len = Math.min(xData.length, yData.length);
    const result = new Float32Array(len * 3);

    for (let ii = 0; ii < len; ii++) {
        const x = xData[ii];
        const y = yData[ii];
        let pointX = -1 + (2 / (xMax - xMin)) * (x - xMin);
        let pointY = -1 + (2 / (yMax - yMin)) * (y - yMin);
        if (isNaN(pointX) || isNaN(pointY)) {
            pointX = 0;
            pointY = 0;
        }

        result[3 * ii] = pointX;
        result[3 * ii + 1] = pointY;
        result[3 * ii + 2] = 0;
    }
    return result;

}

export const mapPointToXy = (
    pointX: number,
    pointY: number,
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    width: number,
    height: number,
): [number, number] => {
    const x = xMin + pointX / width * (xMax - xMin);
    const y = yMax - pointY / height * (yMax - yMin);

    if (isNaN(x) || isNaN(y)) {
        return [0, 0];
    }
    return [x, y];
}

export const calcWebGlShadeColor = (rgbaColor: string) => {
    // "rgba(255, 0, 0, 1)" --> "1.0, 0.0, 0.0, 1.0"
    const color1 = rgbaColor.replace("rgba", "").replace("rgb", "").replace("(", "").replace(")", "");
    const colorStrs = color1.split(",");

    let result: string = "";
    if (colorStrs.length !== 4) {
        return "0.0, 0.0, 0.0, 1.0";
    }

    for (let ii = 0; ii < colorStrs.length; ii++) {
        const colorStr = colorStrs[ii];
        const colorNum = parseFloat(colorStr);
        if (isNaN(colorNum)) {
            return "0.0, 0.0, 0.0, 1.0";
        }
        if (ii < 3) {
            result = result + `${colorNum / 255}` + ", ";
        } else {
            result = result + `${colorNum}`;
        }
    }
    return result;
}





export const generateNewWidgetKey = (): string => {
    return uuidv4();
};

export function arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = "";
    var bytes = new Uint8Array(buffer);
    let len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}
