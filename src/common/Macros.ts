

export class Macros {
    private data: Record<string, string> = {};

    /**
     * The later macro will override the previous one.
     */
    constructor(arr: [string, string][]) {
        for (const macro of arr) {
            let name = macro[0];
            let value = macro[1];
            if (typeof name === "string" && typeof value === "string" && name.length > 0) {
                this.data[name] = value;
            }
        }
    }

    /**
     * Create Macros object from a string like "SYS = RNG, SUBSYS = VAC"
     */
    static fromStr = (str: string): Macros => {
        const macroStrs = str.split(",");
        let macrosArr: [string, string][] = [];
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
        let totalArr: [string, string][] = [];
        for (const macros of macrosArray) {
            totalArr.push(...macros.getArr());
        }
        return new Macros(totalArr);
    }

    /**
     * Apply this Macros to the input string, replacing all the macros recursively
     */
    apply = (input: string) => {
        let remainsBefore = -1;
        let remainsAfter = 0;
        const MAX_COUNT = 6;
        let count = 0;

        while (remainsBefore !== remainsAfter || count < MAX_COUNT) {
            remainsBefore = input.split("$").length - 1;
            for (const macro of Object.entries(this.getData())) {
                const name = macro[0];
                const value = macro[1];
                input = input.replaceAll("${" + name + "}", value).replaceAll("$(" + name + ")", value);
            }
            remainsAfter = input.split("$").length - 1;
            count = count + 1;
        }
        return input;
    }

    /**
     * Format the macros as a table for logging and display.
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

    getValue = (name: string): string | undefined => {
        return this.getData()[name];
    }

    getData = (): Record<string, string> => {
        return this.data;
    }

    getArr = (): [string, string][] => {
        return Object.entries(this.getData());
    }

}
