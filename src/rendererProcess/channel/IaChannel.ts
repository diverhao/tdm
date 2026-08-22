import { type_IaValue, verifyChannelName } from "../../common/Epics";
import { EpicsDate } from "../../common/EpicsTime";
import { Log } from "../../common/Log";
import { g_widgets1 } from "../global/GlobalVariables";


/**
 * An internal channel can carry the following types of data
 *  - number,        loc://ABC, loc://ABC = 3.2
 *  - string,        loc://ABC = "AAA"
 *  - number array,  loc://ABC = [1,2,3]
 *  - string array,  loc://ABC = ["A", "B"]
 *  - enum,          loc://ABC:["OFF", "ON"] = 0
 * 
 * Its value and data type can be changed during runtime.
 * 
 * Assume the provided channel name is a legitimate internal name. These are acceptable input arguments:
 * loc://ABC        // default is a number with 0 value
 * loc://ABC  = 3.2
 * loc://ABC  = "ABC"
 * loc://ABC  = ["A", "B"]
 * loc://ABC  = [1,2,3]
 * loc://ABC:["OFF", "ON"] // default to 0
 * loc://ABC:["OFF", "ON"] = 1
 * 
 * glb://ABC
 * glb://ABC  = 3.2
 * glb://ABC  = "ABC"
 * glb://ABC  = ["A", "B"]
 * glb://ABC  = [1,2,3]
 * glb://ABC:["OFF", "ON"]
 * glb://ABC:["OFF", "ON"] = 1
 */
export class IaChannel {
    private readonly _channelName: string = "";
    private _value: type_IaValue = 0;
    private _enumChoices: string[] = []; // enum type
    private _timeStamp: EpicsDate = EpicsDate.fromEpicsTimeMs(0);

    constructor(channelNameExpr: string) {
        const parsedChannelNameExpr = this.parseChannelNameExpr(channelNameExpr);
        if (parsedChannelNameExpr === undefined) {
            throw new Error(`Invalid internal channel expression: ${channelNameExpr}`);
        }

        this._channelName = parsedChannelNameExpr.channelName;
        this._enumChoices = parsedChannelNameExpr.enumChoices;
        this._value = parsedChannelNameExpr.value;
    }

    /**
     * Parse an internal-channel expression into its canonical name, enum choices,
     * and initial value. An omitted initial value defaults to `0`; an enum value
     * may be either a choice index or a choice string.
     *
     * The channel-name portion follows the same character rules as a CA/PVA
     * channel name. A local channel expression does not contain a display-window
     * suffix; its window ID is obtained from `g_widgets1` when needed.
     *
     * @returns `undefined` when the channel name, expression, initial value, or
     * enum definition is invalid.
     */
    parseChannelNameExpr = (channelNameExpr: string): {
        channelName: string,
        enumChoices: string[],
        value: type_IaValue,
    } | undefined => {
        const expression = channelNameExpr.trim();
        const protocolMatch = expression.match(/^(loc:\/\/|glb:\/\/)/);
        if (protocolMatch === null) {
            return undefined;
        }

        const protocol = protocolMatch[1];
        const expressionWithoutProtocol = expression.slice(protocol.length);
        let equalsIndex = -1;
        let insideString = false;
        let previousCharacterWasEscape = false;
        for (let index = 0; index < expressionWithoutProtocol.length; index++) {
            const character = expressionWithoutProtocol[index];
            if (insideString) {
                if (previousCharacterWasEscape) {
                    previousCharacterWasEscape = false;
                } else if (character === "\\") {
                    previousCharacterWasEscape = true;
                } else if (character === `"`) {
                    insideString = false;
                }
            } else if (character === `"`) {
                insideString = true;
            } else if (character === "=") {
                equalsIndex = index;
                break;
            }
        }
        const nameAndEnumExpr = (
            equalsIndex === -1
                ? expressionWithoutProtocol
                : expressionWithoutProtocol.slice(0, equalsIndex)
        ).trim();
        const initialValueExpr = equalsIndex === -1
            ? undefined
            : expressionWithoutProtocol.slice(equalsIndex + 1).trim();
        if (nameAndEnumExpr === "" || initialValueExpr === "") {
            return undefined;
        }

        let channelNameBody = nameAndEnumExpr;
        let enumChoicesExpr: string | undefined;

        // An enum declaration is a trailing colon followed by a JSON string
        // array. Work backwards so colons and brackets remain legal in the
        // channel name itself.
        for (let colonIndex = nameAndEnumExpr.lastIndexOf(":"); colonIndex >= 0;
            colonIndex = nameAndEnumExpr.lastIndexOf(":", colonIndex - 1)) {
            const possibleEnumChoicesExpr = nameAndEnumExpr.slice(colonIndex + 1).trim();
            if (!possibleEnumChoicesExpr.startsWith("[") || !possibleEnumChoicesExpr.endsWith("]")) {
                continue;
            }

            const possibleEnumBody = possibleEnumChoicesExpr.slice(1, -1).trim();
            if (possibleEnumBody !== "" && !possibleEnumBody.startsWith(`"`)) {
                continue;
            }

            try {
                if (Array.isArray(JSON.parse(possibleEnumChoicesExpr))) {
                    channelNameBody = nameAndEnumExpr.slice(0, colonIndex).trim();
                    enumChoicesExpr = possibleEnumChoicesExpr;
                    break;
                }
            } catch {
                // A malformed enum expression will subsequently fail the
                // regular channel-name validation.
            }
        }

        if (channelNameBody === "") {
            return undefined;
        }

        if (!verifyChannelName(channelNameBody)) {
            return undefined;
        }

        const channelName = `${protocol}${channelNameBody}`;

        try {
            if (enumChoicesExpr !== undefined) {
                const enumChoices: unknown = JSON.parse(enumChoicesExpr);
                if (!Array.isArray(enumChoices)
                    || enumChoices.length === 0
                    || !enumChoices.every((choice) => typeof choice === "string")) {
                    return undefined;
                }

                if (initialValueExpr === undefined) {
                    return { channelName, enumChoices, value: 0 };
                }

                const initialValue: unknown = JSON.parse(initialValueExpr);
                if (typeof initialValue === "number") {
                    if (!Number.isInteger(initialValue)
                        || initialValue < 0
                        || initialValue >= enumChoices.length) {
                        return undefined;
                    }
                    return { channelName, enumChoices, value: initialValue };
                }

                if (typeof initialValue === "string") {
                    const choiceIndex = enumChoices.indexOf(initialValue);
                    if (choiceIndex === -1) {
                        return undefined;
                    }
                    return { channelName, enumChoices, value: choiceIndex };
                }

                return undefined;
            }

            if (initialValueExpr === undefined) {
                return { channelName, enumChoices: [], value: 0 };
            }

            const initialValue: unknown = JSON.parse(initialValueExpr);
            if (typeof initialValue === "number" || typeof initialValue === "string") {
                return { channelName, enumChoices: [], value: initialValue };
            }

            if (Array.isArray(initialValue)) {
                const isNumberArray = initialValue.every((value) => typeof value === "number");
                const isStringArray = initialValue.every((value) => typeof value === "string");
                if (isNumberArray || isStringArray) {
                    return {
                        channelName,
                        enumChoices: [],
                        value: initialValue as number[] | string[],
                    };
                }
            }
        } catch {
            return undefined;
        }

        return undefined;
    }

    // --------------------- GET and PUT ---------------------------------
    getMeta = async (): Promise<void> => {

        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const ipcManager = displayWindowClient.getIpcManager();

        ipcManager.sendFromRendererProcess("ia-get-meta",
            {
                channelName: this.getChannelName(),
            }
        );
    };

    get = async (
        ioTimeout: number,
    ): Promise<void> => {

        const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        const ipcManager = displayWindowClient.getIpcManager();

        ipcManager.sendFromRendererProcess("ia-get",
            {
                channelName: this.getChannelName(),
                ioTimeout: ioTimeout,
            }
        )
    };

    handleGetResult = (secondsSinceEpoch: number, nanoSeconds: number, enumChoices: string[], value: type_IaValue) => {0
        this.setTimeStamp(EpicsDate.fromEpicsTimeMs(secondsSinceEpoch * 1000 + nanoSeconds / 1000000));
        this.setValue(value);
        this.setEnumChoices(enumChoices);
    }

    put = async (iaValueStr: string): Promise<void> => {
        try {
            const value = this.parseInput(iaValueStr);

            let channelName = this.getChannelName();

            g_widgets1
                .getRoot()
                .getDisplayWindowClient()
                .getIpcManager()
                .sendFromRendererProcess("ia-put",
                    {
                        channelName: channelName,
                        value: value,
                    }

                )
        } catch (e) {
            Log.error(e);
        }
    };

    /**
     * Parse input using the cached value's type; non-empty enum choices identify
     * an enum. Arrays accept comma-separated or JSON syntax.
     *
     * An empty cached array is treated as `number[]`; distinguishing it from an
     * empty `string[]` would require storing an explicit value type.
     *
     * @throws When the input cannot be represented by the channel's current type.
     */
    private parseInput = (iaValueStr: string): type_IaValue => {
        const enumChoices = this.getEnumChoices();
        if (enumChoices.length > 0) {
            const input = iaValueStr.trim();
            const choiceIndex = enumChoices.indexOf(input);
            if (choiceIndex !== -1) {
                return choiceIndex;
            }

            if (input === "") {
                throw new Error("Enum input cannot be empty");
            }
            const numericIndex = Number(input);
            if (!Number.isInteger(numericIndex)
                || numericIndex < 0
                || numericIndex >= enumChoices.length) {
                throw new Error(`Invalid enum value: ${iaValueStr}`);
            }
            return numericIndex;
        }

        const currentValue = this.getValue();
        if (typeof currentValue === "number") {
            return this.parseNumberInput(iaValueStr);
        }
        if (typeof currentValue === "string") {
            return iaValueStr;
        }
        if (!Array.isArray(currentValue)) {
            throw new Error("Internal channel has an unsupported value type");
        }

        if (currentValue.length === 0 || currentValue.every((value) => typeof value === "number")) {
            const arrayValue = this.parseArrayInput(iaValueStr);
            return arrayValue.map((value) => {
                if (typeof value !== "string" && typeof value !== "number") {
                    throw new Error(`Invalid number-array element: ${String(value)}`);
                }
                return this.parseNumberInput(String(value));
            });
        }

        if (currentValue.every((value) => typeof value === "string")) {
            const arrayValue = this.parseArrayInput(iaValueStr);
            if (!arrayValue.every((value) => typeof value === "string")) {
                throw new Error("String-array input must contain only strings");
            }
            return arrayValue;
        }

        throw new Error("Internal channel array has mixed element types");
    };

    private parseNumberInput = (valueStr: string): number => {
        const input = valueStr.trim();
        if (input === "") {
            throw new Error("Numeric input cannot be empty");
        }
        const value = Number(input);
        if (!Number.isFinite(value)) {
            throw new Error(`Invalid numeric value: ${valueStr}`);
        }
        return value;
    };

    private parseArrayInput = (valueStr: string): Array<string | number> => {
        const input = valueStr.trim();
        if (input === "") {
            return [];
        }

        if (input.startsWith("[") || input.endsWith("]")) {
            let value: unknown;
            try {
                value = JSON.parse(input);
            } catch {
                throw new Error(`Invalid JSON array: ${valueStr}`);
            }
            if (!Array.isArray(value)) {
                throw new Error(`Expected an array: ${valueStr}`);
            }
            if (!value.every((element) => typeof element === "string" || typeof element === "number")) {
                throw new Error("Array input must contain only strings or numbers");
            }
            return value;
        }

        return valueStr.split(",").map((value) => value.trim());
    };


    // ------------------------ getter and setters -----------------------

    isLocal = () => {
        return this.getChannelName().startsWith("loc://");
    }

    getDisplayWindowId = (): string => {
        return g_widgets1.getRoot().getDisplayWindowClient().getWindowId()
    }

    getEnumChoices = (): string[] => {
        return this._enumChoices;
    }

    setEnumChoices = (newEnumChoices: string[]): void => {
        this._enumChoices = newEnumChoices;
    }

    getValue = (): type_IaValue => {
        return this._value;
    }

    setValue = (newValue: type_IaValue): void => {
        this._value = newValue;
    }

    getTimeStamp = (): EpicsDate => {
        return this._timeStamp;
    }

    setTimeStamp = (newTimeStamp: EpicsDate): void => {
        this._timeStamp = newTimeStamp;
    }

    getChannelName = () => {
        return this._channelName;
    }

}
