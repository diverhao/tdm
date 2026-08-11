import { Log } from "../../../common/Log";

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

