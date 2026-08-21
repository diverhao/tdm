import { v4 as uuidv4 } from "uuid";

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

/**
 * Predefined random colors
 */
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

/**
 * Return a pre-defined color according to the index
 * 
 * There are 50 candidate colors. If the provided index is larger than 50, it returns
 * the modular value.
 */
export const generateRgbaColor = (index: number): string => {
    return _RGBA_COLORS[index % _RGBA_COLORS.length];
};


// --------------------- angle ----------------------

/**
 * Find the angle value from a string like "...(-37.8 deg)...", return the integer, like -38
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
 * 
 * Return the updated angle string
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
 * Insert a new entry to an index in map
 */
export const insertToMapAtIndex = (map: Map<string, any>, index: number, newKey: string, newValue: any): void => {
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
 * Return the deleted [key, value]
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


// -------------------- widget key, URI, and others -------------------------


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

export function arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = "";
    var bytes = new Uint8Array(buffer);
    let len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

