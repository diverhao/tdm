import { type_macros_tdl } from "./types/type_widget_tdl";


export class Macros {
    private arr: type_macros_tdl = [];

    constructor(arr: type_macros_tdl) {
        for (const macro of arr) {
            let name = macro[0];
            let value = macro[1];
            if (typeof name === "string" && typeof value === "string" && name.length > 0) {
                this.arr.push([name, value]);
            }
        }
    }

    /**
     * Create Macros object from a string like "SYS = RNG, SUBSYS = VAC"
     */
    static fromStr = (str: string): Macros => {
        const macroStrs = str.split(",");
        let macrosArr: type_macros_tdl = [];
        for (const macroStr of macroStrs) {
            const macroRaw = macroStr.split("=");
            const nameRaw = macroRaw[0];
            const valueRaw = macroRaw[1];
            if (typeof nameRaw === "string" && typeof valueRaw === "string" && nameRaw.length > 0) {
                macrosArr.push([nameRaw.trim(), valueRaw.trim()]);
            }
        }
        return new Macros(macrosArr);
    }

    static fromMacros = (...macrosArray: Macros[]) => {
        let totalArr: type_macros_tdl = [];
        for (const macros of macrosArray) {
            totalArr.push(...macros.getArr());
        }
        return new Macros(totalArr);
    }

    add = (name: string, value: string) => {
        this.getArr().push([name, value]);
    }

    insert = (name: string, value: string, index: number) => {
        this.getArr().splice(index, 0, [name, value]);
    }

    removeByIndex = (index: number) => {
        this.getArr().splice(index, 1);
    }

    removeByName = (name: string) => {
        let index = -1;
        for (const macro of this.getArr()) {
            index = index + 1;
            const key = macro[0];
            if (name === key) {
                this.getArr().splice(index, 1);
                return;
            }
        }
    }

    replace = (index: number, name: string, value: string) => {
        let macroArr = this.getArr()[index];
        if (macroArr !== undefined) {
            macroArr[0] = name;
            macroArr[1] = value;
        }
    }


    /**
     * Apply this Macros to the input string, replacing all the macros recursively
     * 
     * The macro in the front has higher priority
     */
    apply = (input: string) => {
        const MAX_COUNT = 10;

        // limit the recursive less than 6 times
        // limit the result length < 128 characters
        for (let count = 0; count < MAX_COUNT; count++) {
            const before = input;
            for (const macro of this.getArr()) {
                const name = macro[0];
                const value = macro[1];
                input = input.replaceAll("${" + name + "}", value).replaceAll("$(" + name + ")", value);
            }
            // converge
            if (input === before) {
                break;
            }
            // prevent exponential increase of string length if "A = ${A}${A}"
            if (input.length > 128) {
                break;
            }
        }
        return input;
    }


    /**
     * Format the macros as a table for logging and display.
     * 
     * Use in in this way: console.log(`${macros}`)
     */
    toString = (): string => {
        const formatCell = (value: string): string => {
            return value.replaceAll("\r", "\\r").replaceAll("\n", "\\n").replaceAll("\t", "\\t");
        };

        const rows = this.getArr().map(([name, value]) => [formatCell(name), formatCell(value)] as const);
        const nameWidth = Math.max("Name".length, ...rows.map(([name]) => name.length));
        const valueWidth = Math.max("Value".length, ...rows.map(([, value]) => value.length));
        const border = `+-${"-".repeat(nameWidth)}-+-${"-".repeat(valueWidth)}-+`;
        const formatRow = (name: string, value: string): string => {
            return `| ${name.padEnd(nameWidth)} | ${value.padEnd(valueWidth)} |`;
        };

        return [
            border,
            formatRow("Name", "Value"),
            border,
            ...rows.map(([name, value]) => formatRow(name, value)),
            border,
        ].join("\n");
    }

    /**
     * Get the string format of the macro, like "SYS = RNG, SUBSYS = DIAG"
     */
    getStr = () => {
        let str = "";
        for (const [name, value] of this.getArr()) {
            str = str + `, ${name} = ${value}`;
        }
        if (str.length > 0) {
            str = str.slice(1);
        }
        return str;
    }

    isEmpty = () => {
        return this.getArr().length === 0;
    }

    getValue = (name: string): string | undefined => {
        for (let macro of this.getArr()) {
            let key = macro[0];
            if (name === key) {
                return macro[1];
            }
        }
        return undefined;
    }


    getArr = (): type_macros_tdl => {
        return this.arr;
    }

}
