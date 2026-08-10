import { v4 as uuidv4 } from "uuid";
import { Log } from "./Log";
import { FieldType, PrimitiveFieldType, TypeSchema } from "./types/type_schema";

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
 * Deep merge 2 objects with all 
 */
export const deepMergeObj = (target: Record<string, any>, source: Record<string, any>) => {
    const result = { ...target };

    for (const key in source) {
        if (
            source[key] &&
            typeof source[key] === "object" &&
            !Array.isArray(source[key]) &&
            typeof target[key] === "object"
        ) {
            result[key] = deepMergeObj(target[key], source[key]);
        } else {
            result[key] = source[key];
        }
    }
    return result;
}


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

// -------------------- macros -------------------------


/**
 * "SYS=RNG, SUBSYS=BPM --> [["SYS", "RNG"], ["SUBSYS", "BPM"]]
 */
export const deserializeMacros = (str: string): [string, string][] => {
    const result: [string, string][] = [];
    const macroStrList = str.split(/[\s\t]*[,]+[\s\t]*/); // ["SYS=RNG", "SUBSYS="BPM]

    try {
        for (const macroStr of macroStrList) {
            const macroKeyValuePair = macroStr.trim().replaceAll(",", "").split(/[\s]*=[\s]*/); // ["SYS", "RNG"]
            if (macroKeyValuePair.length === 2) {
                const key = macroKeyValuePair[0].trim();
                const value = macroKeyValuePair[1].trim();
                if (key !== "") {
                    result.push([key, value]);
                }

            }
        }
        return result;
    } catch (e) {
        return [];
    }
}


/**
 * [["SYS", "RNG"], ["SUBSYS", "BPM"]] --> "SYS=RNG, SUBSYS=BPM"
 */
export const serializeMacros = (macros: [string, string][]) => {
    try {
        let result: string = "";
        for (const macro of macros) {
            const key = macro[0];
            const value = macro[1];
            result = result + key + "=" + value + ", ";
        }
        if (result.endsWith(", ")) {
            result = result.substring(0, result.length - 2);
        }
        return result;
    } catch (e) {
        return "";
    }

}

/**
 * Merge the PVA type and pva data
 */
export const mergePvaTypeAndData = (type: Record<string, any>, key: string | undefined, data: Record<string, any> | number | string | number[] | string[] | Record<string, any>[]) => {

    if (type === undefined) {
        return {
            key: key,
            data: data
        };
    }

    const typeIndex = type["typeIndex"];

    if (
        typeIndex === "0x83" ||
        typeIndex === "0x60" ||
        typeIndex === "0x43" ||
        typeIndex === "0x42" ||
        typeIndex === "0x27" ||
        typeIndex === "0x26" ||
        typeIndex === "0x25" ||
        typeIndex === "0x24" ||
        typeIndex === "0x23" ||
        typeIndex === "0x22" ||
        typeIndex === "0x21" ||
        typeIndex === "0x20" ||
        typeIndex === "0x0") {
        // primitive data
        if (key !== undefined) {
            let typeName = "";
            if (typeIndex === "0x83") {
                typeName = "string(length<=" + type["size"] + ")";
            } else if (typeIndex === "0x60") {
                typeName = "string";
            } else if (typeIndex === "0x43") {
                typeName = "double"
            } else if (typeIndex === "0x42") {
                typeName = "float";
            } else if (typeIndex === "0x27") {
                typeName = "ulong";
            } else if (typeIndex === "0x26") {
                typeName = "uint";
            } else if (typeIndex === "0x25") {
                typeName = "ushort";
            } else if (typeIndex === "0x24") {
                typeName = "ubyte";
            } else if (typeIndex === "0x23") {
                typeName = "long";
            } else if (typeIndex === "0x22") {
                typeName = "int";
            } else if (typeIndex === "0x21") {
                typeName = "short";
            } else if (typeIndex === "0x20") {
                typeName = "byte";
            } else if (typeIndex === "0x0") {
                typeName = "boolean";
            }
            return {
                key: typeName + " " + key,
                data: data,
            }
        } else {
            return {
                data: data,
            }
        }
    } else if (
        typeIndex === "0x78" ||
        typeIndex === "0x70" ||
        typeIndex === "0x68" ||
        typeIndex === "0x5b" ||
        typeIndex === "0x5a" ||
        typeIndex === "0x53" ||
        typeIndex === "0x52" ||
        typeIndex === "0x4b" ||
        typeIndex === "0x4a" ||
        typeIndex === "0x3f" ||
        typeIndex === "0x3e" ||
        typeIndex === "0x3d" ||
        typeIndex === "0x3c" ||
        typeIndex === "0x3b" ||
        typeIndex === "0x3a" ||
        typeIndex === "0x39" ||
        typeIndex === "0x38" ||
        typeIndex === "0x37" ||
        typeIndex === "0x36" ||
        typeIndex === "0x35" ||
        typeIndex === "0x34" ||
        typeIndex === "0x33" ||
        typeIndex === "0x32" ||
        typeIndex === "0x31" ||
        typeIndex === "0x30" ||
        typeIndex === "0x2f" ||
        typeIndex === "0x2e" ||
        typeIndex === "0x2d" ||
        typeIndex === "0x2c" ||
        typeIndex === "0x2b" ||
        typeIndex === "0x2a" ||
        typeIndex === "0x29" ||
        typeIndex === "0x28" ||
        typeIndex === "0x18" ||
        typeIndex === "0x10" ||
        typeIndex === "0x8"
    ) {
        // array of primitive data
        let typeName = "";
        if (typeIndex === "0x78") {
            typeName = "string[" + type["size"] + "]";
        } else if (typeIndex === "0x70") {
            typeName = "string[length<=" + type["size"] + "]";
        } else if (typeIndex === "0x68") {
            typeName = "string[]";
        } else if (typeIndex === "0x5b") {
            typeName = "double[" + type["size"] + "]";
        } else if (typeIndex === "0x5a") {
            typeName = "float[" + type["size"] + "]";
        } else if (typeIndex === "0x53") {
            typeName = "double[length<=" + type["size"] + "]";
        } else if (typeIndex === "0x52") {
            typeName = "float[length<=" + type["size"] + "]";
        } else if (typeIndex === "0x4b") {
            typeName = "double[]";
        } else if (typeIndex === "0x4a") {
            typeName = "float[]";
        } else if (typeIndex === "0x3f") {
            typeName = "ulong[" + type["size"] + "]";
        } else if (typeIndex === "0x3e") {
            typeName = "uint[" + type["size"] + "]";
        } else if (typeIndex === "0x3d") {
            typeName = "ushort[" + type["size"] + "]";
        } else if (typeIndex === "0x3c") {
            typeName = "ubyte[" + type["size"] + "]";
        } else if (typeIndex === "0x3b") {
            typeName = "long[" + type["size"] + "]";
        } else if (typeIndex === "0x3a") {
            typeName = "int[" + type["size"] + "]";
        } else if (typeIndex === "0x39") {
            typeName = "short[" + type["size"] + "]";
        } else if (typeIndex === "0x38") {
            typeName = "byte[" + type["size"] + "]";
        } else if (typeIndex === "0x37") {
            typeName = "ulong[length<=" + type["size"] + "]";
        } else if (typeIndex === "0x36") {
            typeName = "uint[length<=" + type["size"] + "]";
        } else if (typeIndex === "0x35") {
            typeName = "ushort[length<=" + type["size"] + "]";
        } else if (typeIndex === "0x34") {
            typeName = "ubyte[length<=" + type["size"] + "]";
        } else if (typeIndex === "0x33") {
            typeName = "long[length<=" + type["size"] + "]";
        } else if (typeIndex === "0x32") {
            typeName = "int[length<=" + type["size"] + "]";
        } else if (typeIndex === "0x31") {
            typeName = "short[length<=" + type["size"] + "]";
        } else if (typeIndex === "0x30") {
            typeName = "byte[length<=" + type["size"] + "]";
        } else if (typeIndex === "0x2f") {
            typeName = "ulong[]";
        } else if (typeIndex === "0x2e") {
            typeName = "uint[]";
        } else if (typeIndex === "0x2d") {
            typeName = "ushort[]";
        } else if (typeIndex === "0x2c") {
            typeName = "ubyte[]";
        } else if (typeIndex === "0x2b") {
            typeName = "long[]";
        } else if (typeIndex === "0x2a") {
            typeName = "int[]";
        } else if (typeIndex === "0x29") {
            typeName = "short[]";
        } else if (typeIndex === "0x28") {
            typeName = "byte[]";
        } else if (typeIndex === "0x18") {
            typeName = "boolean[" + type["size"] + "]";
        } else if (typeIndex === "0x10") {
            typeName = "boolean[length<=" + type["size"] + "]";
        } else if (typeIndex === "0x8") {
            typeName = "boolean[]";
        }

        if (key !== undefined) {
            return {
                key: typeName + " " + key,
                data: data,
            }
        } else {
            return {
                data: data,
            }
        }

    } else if (
        typeIndex === "0x80"
    ) {
        // struct
        const structName = type["name"];
        const structTmp: Record<string, any> = {};
        for (const [fieldName, fieldData] of Object.entries(data)) {
            const fieldType = type["fields"][fieldName];

            const fieldTmp = mergePvaTypeAndData(fieldType, fieldName, fieldData);
            const newFieldName = fieldTmp["key"];
            const newFieldData = fieldTmp["data"];
            // console.log("\n\n\n", fieldType, fieldName, fieldData, fieldTmp)
            structTmp[newFieldName] = newFieldData;

        }
        return {
            key: "struct " + structName + " " + key,
            data: structTmp
        };
    } else if (
        typeIndex === "0x81"
    ) {
        // union
        const unionName = type["name"];
        if (typeof data === "object") {
            const choiceIndex = (data as any)["index"];
            const choiceName = (Object.keys(type["fields"]) as any)[choiceIndex];
            const choiceData = (data as any)["value"];
            if (choiceData !== undefined && choiceIndex !== undefined) {
                const choiceType = Object.values(type["fields"])[choiceIndex] as any;
                if (choiceType !== undefined && choiceType !== null) {
                    const unionTmp = mergePvaTypeAndData(choiceType, key + " [union " + unionName + "." + choiceName + "]", choiceData) as any;
                    return {
                        key: unionTmp["key"],
                        data: { index: choiceIndex, value: unionTmp["data"] },
                    };
                }
            }
        }

    } else if (
        typeIndex === "0x88"
    ) {
        // struct[]
        const structName = type["name"];
        const structType = structuredClone(type);
        structType["typeIndex"] = "0x80";
        const result: any[] = [];
        if (Array.isArray(data)) {
            for (const structData of data) {
                result.push(mergePvaTypeAndData(structType, structName, structData)["data"]);
            }

        }
        return {
            key: "struct[] " + structName + " " + key,
            data: result
        };

    } else if (
        typeIndex === "0x89"
    ) {
        // union[]
        const unionName = type["name"];
        const unionType = structuredClone(type);
        unionType["typeIndex"] = "0x81";
        const result: any[] = [];
        if (Array.isArray(data)) {
            for (const unionData of data) {
                result.push(mergePvaTypeAndData(unionType, unionName, unionData)["data"]);
            }

        }
        return {
            key: "union[] " + unionName + " " + key,
            data: result
        };
    } else {
        // should not happen
        Log.error("NA encountered")
    }
    return {
        key: undefined,
        data: undefined
    }

}


export const isStringArray = (value: unknown): value is string[] => {
    return Array.isArray(value) && value.every(item => typeof item === 'string');
}

export const isRuleElement = (item: unknown): boolean => {
    return (
        typeof item === 'object' &&
        item !== null &&
        'id' in item &&
        'boolExpression' in item &&
        'propertyName' in item &&
        'propertyValue' in item &&
        typeof (item as any).id === 'string' &&
        typeof (item as any).boolExpression === 'string' &&
        typeof (item as any).propertyName === 'string'
    );
}

export const isRuleElementArray = (value: unknown): boolean => {
    return Array.isArray(value) && value.every(isRuleElement);
}

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


export const deepMerge = (obj1: any, obj2: any): any => {
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
        const result = [...obj1];
        obj2.forEach((val, i) => result[i] = val);
        return result;
    } else {
        return structuredClone({ ...obj1, ...obj2 });
    }
};

export const generateWidgetKey = (type: string) => {
    return `${type}_${uuidv4()}`
}

export const truncateString = (str: string, length: number = 3) => {
    if (str && str.length > length) {
        return str.substring(0, length) + '...';
    }
    return str;
};


/**
 * Check if a string is a data URI (e.g., data:image/png;base64,...)
 */
export const isDataUri = (str: string): boolean => {
    return str.startsWith('data:');
};

/**
 * Extract MIME type from a data URI
 * Example: "data:image/png;base64,..." returns "image/png"
 */
export const getDataUriMimeType = (dataUri: string): string => {
    if (!isDataUri(dataUri)) {
        return "";
    }
    // Format: data:[<mediatype>][;base64],<data>
    const match = dataUri.match(/^data:([^;,]+)/);
    return match ? match[1] : "";
};

/**
 * Determine if a data URI is an image (png, jpg, svg, gif, webp, etc.)
 */
export const isImageDataUri = (dataUri: string): boolean => {
    const mimeType = getDataUriMimeType(dataUri);
    return mimeType.startsWith('image/');
};

/**
 * Determine if a data URI is a PDF
 */
export const isPdfDataUri = (dataUri: string): boolean => {
    const mimeType = getDataUriMimeType(dataUri);
    return mimeType === 'application/pdf';
};

/**
 * Get the specific image type from a data URI
 * Example: "data:image/png;base64,..." returns "png"
 */
export const getImageTypeFromDataUri = (dataUri: string): string => {
    const mimeType = getDataUriMimeType(dataUri);
    if (!mimeType.startsWith('image/')) {
        return "";
    }
    return mimeType.split('/')[1]; // e.g., "png", "svg+xml"
};


export const isRemotePath = (path: string) => {
    if (path.startsWith("http://") || path.startsWith("https://")) {
        return true;
    } else {
        return false;
    }
};

export const mapXyToPointGl = (
    x: number,
    y: number,
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
): [number, number, number] => {

    // min point is -1, max point is 1
    const pointX = -1 + (2 / (xMax - xMin)) * (x - xMin);
    const pointY = -1 + (2 / (yMax - yMin)) * (y - yMin);

    if (isNaN(pointX) || isNaN(pointY)) {
        return [0, 0, 0];
    }

    return [pointX, pointY, 0];
}

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

export const mapXyToPoint = (
    x: number,
    y: number,
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    width: number,
    height: number,
): [number, number] => {
    const pointX = width * (x - xMin) / (xMax - xMin);
    const pointY = height - height * (y - yMin) / (yMax - yMin);

    if (isNaN(pointX) || isNaN(pointY)) {
        return [0, 0];
    }

    return [pointX, pointY];
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

export type type_TypeCheckError = {
    expected: string;
    message: string;
    path: string;
    received: string;
    value: unknown;
    valuePreview: string;
};

const truncateForError = (text: string, maxLength: number = 240) => {
    if (text.length <= maxLength) {
        return text;
    }
    return `${text.slice(0, maxLength)}...`;
};

const describeValue = (value: unknown) => {
    if (typeof value === "string") {
        return truncateForError(JSON.stringify(value));
    }
    if (value === undefined) {
        return "undefined";
    }
    try {
        const serialized = JSON.stringify(value);
        if (serialized !== undefined) {
            return truncateForError(serialized);
        }
    } catch {
        // Fall back to String(value) below.
    }
    return truncateForError(String(value));
};

const describeReceivedType = (value: unknown) => {
    if (value === undefined) {
        return "undefined";
    }
    if (value === null) {
        return "null";
    }
    if (Array.isArray(value)) {
        return "array";
    }
    return typeof value;
};

const describeSchema = (schema: TypeSchema) => {
    return `object {${Object.keys(schema).join(", ")}}`;
};

const describeExpectedType = (expectedType: FieldType | PrimitiveFieldType[] | string): string => {
    if (typeof expectedType === "string") {
        return expectedType;
    }
    if (Array.isArray(expectedType)) {
        return expectedType.map((item) => describeExpectedType(item)).join(" | ");
    }
    if ("arrayOfUnion" in expectedType) {
        const schemas = expectedType.arrayOfUnion as readonly TypeSchema[];
        return `Array<${schemas.map((schema: TypeSchema) => describeSchema(schema)).join(" | ")}>`;
    }
    if ("tuple" in expectedType) {
        const tupleDef = expectedType.tuple as readonly PrimitiveFieldType[];
        return `[${tupleDef.join(", ")}]`;
    }
    if ("arrayOfTuple" in expectedType) {
        const tupleDef = expectedType.arrayOfTuple as readonly PrimitiveFieldType[];
        return `Array<[${tupleDef.join(", ")}]>`;
    }
    if ("literalUnion" in expectedType) {
        const allowed = expectedType.literalUnion as readonly string[];
        return allowed.map((item: string) => JSON.stringify(item)).join(" | ");
    }
    if ("arrayOf" in expectedType) {
        return `Array<${describeExpectedType(expectedType.arrayOf)}>`;
    }
    if ("dictionaryOf" in expectedType) {
        const innerSchema = expectedType.dictionaryOf as TypeSchema;
        return `Record<string, ${describeSchema(innerSchema)}>`;
    }
    return describeSchema(expectedType);
};

const createTypeCheckError = (fieldPath: string, expectedType: FieldType | PrimitiveFieldType[] | string, value: unknown): type_TypeCheckError => {
    const path = fieldPath || "(root)";
    const expected = describeExpectedType(expectedType);
    const received = describeReceivedType(value);
    const valuePreview = describeValue(value);
    return {
        expected,
        message: `[isOfType] Type check failed at "${path}": expected ${expected}, got ${received} (${valuePreview})`,
        path,
        received,
        value,
        valuePreview,
    };
};

function getSingleTypeError(value: unknown, expectedType: FieldType, fieldPath: string = ""): type_TypeCheckError | undefined {
    if (Array.isArray(expectedType)) {
        const matched = expectedType.some((typeCandidate) => getSingleTypeError(value, typeCandidate, fieldPath) === undefined);
        return matched ? undefined : createTypeCheckError(fieldPath, expectedType, value);
    }

    if (expectedType === "undefined") {
        return value === undefined ? undefined : createTypeCheckError(fieldPath, expectedType, value);
    }

    if (value === undefined) {
        return createTypeCheckError(fieldPath, expectedType, value);
    }

    // Array where each item matches one of several schemas: { arrayOfUnion: TypeSchema[] }
    if (typeof expectedType === "object" && !Array.isArray(expectedType) && "arrayOfUnion" in expectedType) {
        if (!Array.isArray(value)) {
            return createTypeCheckError(fieldPath, expectedType, value);
        }
        const schemas = expectedType.arrayOfUnion as TypeSchema[];
        for (let idx = 0; idx < value.length; idx++) {
            const item = value[idx];
            const itemPath = `${fieldPath}[${idx}]`;
            const matched = schemas.some((schema) => getTypeCheckError(item, schema, itemPath) === undefined);
            if (!matched) {
                return createTypeCheckError(itemPath, expectedType, item);
            }
        }
        return undefined;
    }

    // Fixed-length tuple of primitive types: { tuple: PrimitiveFieldType[] }
    if (typeof expectedType === "object" && !Array.isArray(expectedType) && "tuple" in expectedType) {
        const tupleDef = expectedType.tuple as PrimitiveFieldType[];
        if (!Array.isArray(value) || value.length !== tupleDef.length) {
            return createTypeCheckError(fieldPath, expectedType, value);
        }
        for (let ii = 0; ii < tupleDef.length; ii++) {
            const error = getSingleTypeError((value as unknown[])[ii], tupleDef[ii], `${fieldPath}[${ii}]`);
            if (error !== undefined) {
                return error;
            }
        }
        return undefined;
    }

    // Array of fixed-length tuples: { arrayOfTuple: PrimitiveFieldType[] }
    if (typeof expectedType === "object" && !Array.isArray(expectedType) && "arrayOfTuple" in expectedType) {
        const tupleDef = expectedType.arrayOfTuple as PrimitiveFieldType[];
        if (!Array.isArray(value)) {
            return createTypeCheckError(fieldPath, expectedType, value);
        }
        for (let idx = 0; idx < value.length; idx++) {
            const item = value[idx];
            const itemPath = `${fieldPath}[${idx}]`;
            if (!Array.isArray(item) || item.length !== tupleDef.length) {
                return createTypeCheckError(itemPath, expectedType, item);
            }
            for (let ii = 0; ii < tupleDef.length; ii++) {
                const error = getSingleTypeError(item[ii], tupleDef[ii], `${itemPath}[${ii}]`);
                if (error !== undefined) {
                    return error;
                }
            }
        }
        return undefined;
    }

    // String literal union: { literalUnion: string[] }
    if (typeof expectedType === "object" && !Array.isArray(expectedType) && "literalUnion" in expectedType) {
        const allowed = expectedType.literalUnion as string[];
        return typeof value === "string" && allowed.includes(value)
            ? undefined
            : createTypeCheckError(fieldPath, expectedType, value);
    }

    // Array of objects matching a schema: { arrayOf: TypeSchema }
    if (typeof expectedType === "object" && !Array.isArray(expectedType) && "arrayOf" in expectedType) {
        if (!Array.isArray(value)) {
            return createTypeCheckError(fieldPath, expectedType, value);
        }
        const arrayItemType = expectedType.arrayOf as FieldType;
        for (let idx = 0; idx < value.length; idx++) {
            const error = getSingleTypeError(value[idx], arrayItemType, `${fieldPath}[${idx}]`);
            if (error !== undefined) {
                return error;
            }
        }
        return undefined;
    }

    // Dictionary of objects matching a schema: { dictionaryOf: TypeSchema }
    if (typeof expectedType === "object" && !Array.isArray(expectedType) && "dictionaryOf" in expectedType) {
        if (typeof value !== "object" || value === null || Array.isArray(value)) {
            return createTypeCheckError(fieldPath, expectedType, value);
        }
        const innerSchema = expectedType.dictionaryOf as TypeSchema;
        const dict = value as Record<string, unknown>;
        for (const [key, item] of Object.entries(dict)) {
            const error = getTypeCheckError(item, innerSchema, fieldPath ? `${fieldPath}.${key}` : key);
            if (error !== undefined) {
                return error;
            }
        }
        return undefined;
    }

    // Nested schema (object)
    if (typeof expectedType === "object" && !Array.isArray(expectedType)) {
        return getTypeCheckError(value, expectedType, fieldPath);
    }

    switch (expectedType) {
        case "string":
        case "number":
        case "boolean":
            return typeof value === expectedType ? undefined : createTypeCheckError(fieldPath, expectedType, value);
        case "string[]":
            return Array.isArray(value) && value.every((v) => typeof v === "string")
                ? undefined
                : createTypeCheckError(fieldPath, expectedType, value);
        case "number[]":
            return Array.isArray(value) && value.every((v) => typeof v === "number")
                ? undefined
                : createTypeCheckError(fieldPath, expectedType, value);
        case "boolean[]":
            return Array.isArray(value) && value.every((v) => typeof v === "boolean")
                ? undefined
                : createTypeCheckError(fieldPath, expectedType, value);
        default:
            return createTypeCheckError(fieldPath, expectedType, value);
    }
}

export function getTypeCheckError(obj: unknown, schema: TypeSchema, _path: string = ""): type_TypeCheckError | undefined {
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
        return createTypeCheckError(_path, "plain object", obj);
    }

    // Top-level dictionaryOf: every value in obj must match the inner schema
    if ("dictionaryOf" in schema && Object.keys(schema).length === 1) {
        const innerSchema = schema.dictionaryOf as TypeSchema;
        const dict = obj as Record<string, unknown>;
        for (const [key, value] of Object.entries(dict)) {
            const error = getTypeCheckError(value, innerSchema, _path ? `${_path}.${key}` : key);
            if (error !== undefined) {
                return error;
            }
        }
        return undefined;
    }

    const record = obj as Record<string, unknown>;

    for (const [key, expectedType] of Object.entries(schema)) {
        const value = record[key];
        const fieldPath = _path ? `${_path}.${key}` : key;

        // If expectedType is an array, the value must match any of the types in the array
        if (Array.isArray(expectedType)) {
            const matched = expectedType.some((typeCandidate) => getSingleTypeError(value, typeCandidate, fieldPath) === undefined);
            if (!matched) {
                return createTypeCheckError(fieldPath, expectedType, value);
            }
            continue;
        }

        const error = getSingleTypeError(value, expectedType, fieldPath);
        if (error !== undefined) {
            return error;
        }
    }

    return undefined;
}

export function isOfType(obj: unknown, schema: TypeSchema, _path: string = ""): boolean {
    const error = getTypeCheckError(obj, schema, _path);
    if (error !== undefined) {
        Log.error(error.message);
        return false;
    }
    return true;
}

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



export const generateDisplayWindowHtml = (option: { basePath: string, displayWindowId: string }) => {

    const { basePath, displayWindowId } = option;

    return (
        `
<!DOCTYPE html>

<html>
	<head>
	</head>

	<body style="-webkit-print-color-adjust: exact; width: 100%; height: 100%;">
		<div id="root"></div>
		<!-- one solution for Electron's "exports is not defined" error -->
		<!-- We must also change "nodeIntegration" and "contextIsolation" in "app.js" -->
		<!-- https://stackoverflow.com/questions/54619111/typescript-electron-exports-is-not-defined -->
		<!-- another solution for Electron's "exports is not defined" error -->
		<!-- manually define a global variable "exports" -->
		<script>
			var exports = {};
            window.basePath = ${JSON.stringify(basePath)};
		</script>

		<!-- load from webpack package  -->
		<!-- the webpack package is transpiled to ESM module type (import/export), it can be loade by both -->
		<!-- electron.js and browser. The embedded display (iframe) can be correctly displayed in this way. -->
		<!-- it takes a significant amount of time to bundle the stuff -->
		<!-- one significant difference between bundled and un-bundled versions is the __dirname is always / in bundled -->
		<!-- version. In un-bundled version, the __dirname is the .js file's path on hard drive -->
		<!-- The relative path for img (e.g. "../../abc.svg") is w.r.t. this html file. The "file://" prefix should always -->
		<!-- come with absolute path -->
		<!-- it is recommended to use for production -->
		<script type="module" src="${basePath}/webpack/DisplayWindowClient.js"></script>

		<script type="module">
			const urlParams = new URLSearchParams(window.location.search);
			const ipcServerPort = urlParams.get("ipcServerPort");
			// const displayWindowId = urlParams.get("displayWindowId");
            const displayWindowId = ${JSON.stringify(displayWindowId)};
			const hostnameRaw = urlParams.get("hostname"); // might be null
			const hostname = hostnameRaw === null ? undefined : hostnameRaw;
            console.log("display window Id", displayWindowId);
            console.log("ipcServerPort", ipcServerPort, "displayWindowId", displayWindowId);


            const nav = performance.getEntriesByType("navigation")[0];
            const isReload = nav?.type === "reload";
            
            console.log("isReload =", isReload);
          	new window.DisplayWindowClientClass(displayWindowId, parseInt(ipcServerPort), hostname);

		</script>
	</body>
</html>
`
    )
}


export const isDarkMode = () => window.matchMedia("(prefers-color-scheme: dark)").matches;


export const adjustRgba = (color: string, delta: number) => {
    const match = color.match(
        /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/i
    );
    if (!match) {
        return color;
    }

    const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
    const [, r, g, b, a = "1"] = match;

    return `rgba(${clamp(Number(r) + delta)}, ${clamp(Number(g) + delta)}, ${clamp(
        Number(b) + delta
    )}, ${a})`;
};


export const refineMacros = (macros: [string, string][]) => {
    const result: [string, string][] = [];
    const names: string[] = [];
    for (const macro of macros) {
        const name = macro[0];
        if (!(names.includes(name))) {
            names.push(name);
            result.push(macro);
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