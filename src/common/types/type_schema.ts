// ========================== Runtime Schema System ==========================
//
// Provides runtime type-checking for objects whose shapes are defined as
// TypeScript types. Since TS types are erased at runtime, we define "schemas"
// — plain JS objects that describe the expected shape — and validate against them.
//
// Usage:
//   1. Define a schema:
//        const mySchema = { name: "string", age: "number" } as const satisfies TypeSchema;
//
//   2. Derive the TS type (no duplication):
//        type MyType = InferType<typeof mySchema>;
//
//   3. Validate at runtime:
//        isOfType(unknownObj, mySchema)  // returns boolean
//
// Supported field descriptors:
//   "string"               — typeof value === "string"
//   "number"               — typeof value === "number"
//   "boolean"              — typeof value === "boolean"
//   "undefined"            — value === undefined
//   "string[]"             — string array
//   "number[]"             — number array
//   "boolean[]"            — boolean array
//   ["string", "undefined"]— union: string | undefined
//   { field: "string" }    — nested object (recursive TypeSchema)
//   { arrayOf: field }     — array of items matching any supported field descriptor
//   { arrayOfUnion: [...] }— array where each item matches one of several schemas (union)
//   { tuple: [...] }       — fixed-length tuple of primitive types
//   { arrayOfTuple: [...] }— array of tuples
//   { literalUnion: [...] }— string literal union (e.g. "Linear" | "Log10")
// ============================================================================

// --- Primitive type tags ---
export type PrimitiveFieldType =
    | "string"
    | "number"
    | "boolean"
    | "undefined"
    | "string[]"
    | "number[]"
    | "boolean[]";

// --- Compound descriptors ---
export type ArrayOfSchema = { arrayOf: FieldType };
export type ArrayOfUnionSchema = { arrayOfUnion: readonly TypeSchema[] };
export type TupleSchema = { tuple: readonly PrimitiveFieldType[] };
export type ArrayOfTupleSchema = { arrayOfTuple: readonly PrimitiveFieldType[] };
export type LiteralUnionSchema = { literalUnion: readonly string[] };
export type DictionaryOfSchema = { dictionaryOf: TypeSchema };

// --- A single field descriptor ---
export type FieldType =
    | PrimitiveFieldType            // e.g. "string"
    | PrimitiveFieldType[]          // e.g. ["string", "undefined"]  (union)
    | TypeSchema                    // nested object
    | ArrayOfSchema                 // array of typed items
    | ArrayOfUnionSchema            // array where each item matches one of several schemas
    | TupleSchema                   // fixed-length tuple of primitive types
    | ArrayOfTupleSchema            // array of tuples
    | LiteralUnionSchema            // string literal union
    | DictionaryOfSchema;           // Record<string, T>

// --- A schema = field name → field descriptor ---
export interface TypeSchema extends Record<string, FieldType> {}

// --- Compile-time type inference from a schema ---

// Distributive helper: maps a union of schemas to a union of inferred types
type InferUnion<T extends TypeSchema> = T extends TypeSchema ? InferType<T> : never;

// Maps each element of a primitive tuple schema to its inferred type
type InferTuple<T extends readonly PrimitiveFieldType[]> = Array<MapSingle<T[number]>>;

type MapSingle<T> =
    T extends "string" ? string :
    T extends "number" ? number :
    T extends "boolean" ? boolean :
    T extends "undefined" ? undefined :
    T extends "string[]" ? string[] :
    T extends "number[]" ? number[] :
    T extends "boolean[]" ? boolean[] :
    T extends ArrayOfUnionSchema ? InferUnion<T["arrayOfUnion"][number]>[] :
    T extends ArrayOfTupleSchema ? InferTuple<T["arrayOfTuple"]>[] :
    T extends TupleSchema ? InferTuple<T["tuple"]> :
    T extends LiteralUnionSchema ? T["literalUnion"][number] :
    T extends ArrayOfSchema ? MapField<T["arrayOf"]>[] :
    T extends DictionaryOfSchema ? Record<string, InferType<T["dictionaryOf"]>> :
    T extends TypeSchema ? { [K in keyof T]: MapField<T[K]> } :
    never;

type MapField<T extends FieldType> =
    T extends PrimitiveFieldType[] ? MapSingle<T[number]> :
    MapSingle<T>;

export type InferType<S extends TypeSchema> = {
    [K in keyof S]: MapField<S[K]>;
};

export type Mutable<T> = {
    -readonly [K in keyof T]: T[K] extends object ? Mutable<T[K]> : T[K];
};
