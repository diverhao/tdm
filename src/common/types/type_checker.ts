import { Log } from "../Log";
import { FieldType, PrimitiveFieldType, TypeSchema } from "./type_schema";

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
