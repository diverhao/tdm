import { v4 as uuidv4 } from "uuid";
import { Log } from "./Log";

export const rgbaArrayToRgbaStr = (rgbaArray: number[]): string => {
    const rStr = rgbaArray[0].toString();
    const gStr = rgbaArray[1].toString();
    const bStr = rgbaArray[2].toString();
    const aStr = (rgbaArray[3] / 100).toString();
    return "rgba(" + rStr + "," + gStr + "," + bStr + "," + aStr + ")";
};

export const rgbaStrToRgbaArray = (rgbaString: string) => {
    let tmp = JSON.parse(rgbaString.replace("rgba", "").replace("(", "[").replace(")", "]"));
    tmp[3] = tmp[3] * 100;
    return tmp;
};

// allowed character in channel name
// a-z A-Z 0-9 _ - : . [ ] < > ;
// export const validateChannelName = (channelName: string): boolean => {
//     const reg = new RegExp("^[0-9a-zA-Z_\\-:\\.\\[\\]<>;\\}\\{\\(\\)\\$]*$");
//     return reg.test(channelName);
// };

// get angle value from string "transform ...rotate(37deg) ..."
export const parseIntAngle = (transformStr: string): number => {
    const thetaRaw = transformStr.trim().match(/\(([\s]*)([0-9]+)([\s]*)deg([\s]*)\)/g);
    if (thetaRaw !== null && thetaRaw.length === 1) {
        const thetaStr = thetaRaw[0].replace("(", "").replace(")", "").replace("deg", "");
        const theta = parseInt(thetaStr);
        if (!isNaN(theta)) {
            return theta;
        }
    }
    Log.error("Error converting angle", transformStr);
    return 0;
    // let result = parseInt(transformStr.split("rotate")[1].split("deg")[0].replace("(", ""));
    // return result;
};

// insert a number to string "transform ...rotate(37deg) ..."
export const insertIntAngle = (newVal: number, str: string): string => {
    const index1 = str.indexOf("rotate") + 6;
    const index2 = str.indexOf("deg");

    const str1 = str.slice(0, index1);
    const str2 = str.slice(index2);
    const result = `${str1}(${newVal}${str2}`;
    return result;
};

/**
 * Insert an entry [index, object] to a particular index in map
 */
export const insertToMap = (map: Map<string, any>, index: number, newKey: string, newValue: any) => {
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
 * Delete a map entry according to the index
 */
export const deleteFromMap = (map: Map<string, any>, index: number): [string, any] => {
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

export const generateNewWidgetKey = (): string => {
    // return performance.now().toString() + "_" + Math.random().toString();
    return uuidv4();
};

// input format "1234567890.123456789" since 1990-01-01
// output format
export const parseTimeStamp = (inputStr: string): string => {
    try {
        const us0 = Date.UTC(90, 0, 1, 0, 0, 0, 0);
        const value = parseInt(inputStr.split(".")[0]);
        const ns = parseInt(inputStr.split(".")[1]);
        let us = value * 1000 + ns * 1e-6;
        let dateStr = new Date(us + us0).toString();
        let dateStr1 = dateStr.replace(" GMT", `.${ns * 1e-3} GMT`);
        let dateStr1Split = dateStr1.split(" ");
        return `${dateStr1Split[1]} ${dateStr1Split[2]} ${dateStr1Split[3]} ${dateStr1Split[4]}`;
    } catch (e) {
        return "0";
    }
};

// input: 1048260866.330080000 seconds since 1990-01-01 UTC
// output: "2023-03-25 12:34:56.789" local
export const converEpicsTimeStampToString = (msSince1990UTC: number): string => {
    try {
        const ms1990UTC = Date.UTC(90, 0, 1, 0, 0, 0, 0);
        // const value = seconds;
        // const ns = nanoSeconds;
        // let msSince1990UTC = value * 1000 + ns * 1e-6;

        const timezoneOffsetMs = new Date().getTimezoneOffset() * 60 * 1000;

        let dateStr = new Date(msSince1990UTC + ms1990UTC - timezoneOffsetMs).toISOString().replace("T", " ").replace("Z", "");
        return dateStr;
    } catch (e) {
        return "0";
    }
};

export const convertDateObjToString = (date: Date) => {
    // Extract individual components
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
    // Construct the formatted date string
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

/**
 * input: 1048260866.330080000 seconds since 1990-01-01 UTC
 * output: "2023-03-25 12:34:56.789" local
 */
export const converEpicsTimeStampToEpochTime = (msSince1990UTC: number): number => {
    const ms1990UTC = Date.UTC(90, 0, 1, 0, 0, 0, 0);
    return msSince1990UTC + ms1990UTC;
};

export const converEpochTimeToEpicsTimeStamp = (epochTimeMs: number): number => {
    const ms1990UTC = Date.UTC(90, 0, 1, 0, 0, 0, 0);
    return epochTimeMs - ms1990UTC;
};

// "2023-03-25 10:00:00.000" local time
export const getCurrentTimeString = () => {
    const nowMs = Date.now();
    const timezoneOffsetMs = new Date().getTimezoneOffset() * 60 * 1000;
    let dateStr = new Date(nowMs - timezoneOffsetMs).toISOString().replace("T", " ").replace("Z", "");
    return dateStr;
};

// input: -10*1000, 
// output; the time stamp of the time 10 seconds ago, in format of "2024-01-01 12:23:45.123"
export const getLocalOffsetMsTimeString = (offset: number) => {
    const nowMs = Date.now() + offset;
    const timezoneOffsetMs = new Date().getTimezoneOffset() * 60 * 1000;
    let dateStr = new Date(nowMs - timezoneOffsetMs).toISOString().replace("T", " ").replace("Z", "");
    return dateStr;
};

// convert a string "2024-01-23T01:23:45.123Z" to ms since epoch
export const convertIso8601TimeToEpochTime = (iso8601Time: string) => {
    const date = new Date(iso8601Time);
    const millisecondsSinceEpoch = date.getTime();
    return millisecondsSinceEpoch;
}

// convert ms since epoch to a string "2024-01-23T01:23:45.123Z"
export const convertEpochtimeToIso8601Time = (msSinceEpoch: number) => {
    const date = new Date(msSinceEpoch);
    const isoString = date.toISOString();
    return isoString;
}
/**
 * Convert epich time in milliseconds to format "2024-06-20 21:21:27.123"
 */
export const convertEpochTimeToString = (msSince1970UTC: number) => {
    const timezoneOffsetMs = new Date().getTimezoneOffset() * 60 * 1000;
    let dateStr = new Date(msSince1970UTC - timezoneOffsetMs).toISOString().replace("T", " ").replace("Z", "");
    return dateStr;
};

// string in local time: "2023-03-25 22:25:08.123" to ms since epoch
export const convertLocalTimeStringToEpochTime = (localTimeString: string) => {
    return new Date(localTimeString).getTime();
};

export const insertToObject = (propertyName: string, propertyValue: any, obj: Record<string, any>, index: number) => {
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


export function arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = "";
    var bytes = new Uint8Array(buffer);
    let len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// ---------------------------------- plot ticks -------------------------
// for widget: XYPlot, ScaledSlider, Thermometer, Tank, and Meter
// Meter does not use refineTicks() as the dial size is unknown, user needs to manually
// adjust the number of ticks

/**
 * calculate the last digit, e.g. 0.01234567 --> 1.234567e-2 --> [1.234567, -2] --> [1, -2]
 */
// in XYPlotPlot, ScaledSlider
const roundNumber = (num: number) => {
    const num1 = Math.round(parseFloat(num.toExponential().split("e")[0]));
    const num2 = parseInt(num.toExponential().split("e")[1]);
    // 5e-2 --> [5, -2]
    return [num1, num2];
    // return parseFloat(`${num1}e${num2}`);
};

/**
 * Given min and max values of the ticks, as well as the number of ticks, calculate the tick values.
 * 
 * The key is reducing the artificial trailing numbers, e.g. 6.9000000000001 or 6.899999999999999 should be 6.9
 */
export const calcTicks = (valMin: number, valMax: number, numTicks: number = 11, scale: "linear" | "log10" = "linear"): number[] => {
    const dValArray = roundNumber((valMax - valMin) / (Math.max(numTicks, 2) - 1));
    const dVal = parseFloat(`${dValArray[0]}e${dValArray[1]}`);
    const fixedDigit = Math.max(-1 * dValArray[1], 0);
    const valMinInt = Math.ceil(valMin / dVal);
    const valMaxInt = Math.floor(valMax / dVal);
    const result: number[] = [];
    for (let ii = valMinInt; ii <= valMaxInt; ii++) {
        result.push(parseFloat((ii * dVal).toFixed(fixedDigit)));
    }
    return result;
};

/**
 * The ticks may be too long, e.g. [0, 0.2, 0.4, 0.6, 0.8, 1] is overcrowded for the scale. 
 * 
 * This function reduces the ticks by calculating the spacing between 2 adjacent ticks, making sure their spacing is 
 * less than the unitLength, which is typically half of the font size 
 */
export const refineTicks = (rawTicks: number[], unitLength: number, elementRef: any, direction: "horizontal" | "vertical"): string[] => {
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

    let elementHeight = 100;
    if (elementRef.current !== null) {
        if (direction === "horizontal") {
            elementHeight = elementRef.current.offsetWidth;
        } else {
            elementHeight = elementRef.current.offsetHeight;
        }
    } else {
        return result;
    }
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


/**
 * Year-Month-Day:Hour:Minute:Second.Millisecond
 */
export const getCurrentDateTimeStr = (useAsFileName: boolean = false) => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

    // note: : is not allowed as a file name
    if (useAsFileName === true) {
        return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}_${milliseconds}`;
    } else {
        return `${year}-${month}-${day}-${hours}:${minutes}:${seconds}.${milliseconds}`;
    }
}



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
 * Convert a floating point number to most human-readable string
 * 
 * 1.2345678 --> 1.23
 * 12345678  --> 1.2e7
 * 
 */
export const convertNumberToStringAuto = () => {

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
        const structType = JSON.parse(JSON.stringify(type));
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
        const unionType = JSON.parse(JSON.stringify(type));
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
        console.log("NA encountered")
    }
    return {
        key: undefined,
        data: undefined
    }

}


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
        return JSON.parse(JSON.stringify({ ...obj1, ...obj2 }));
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