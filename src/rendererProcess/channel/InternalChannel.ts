import { type_InternalChannelValue, verifyChannelName } from "../../common/Epics";
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
 * Assume the provided channel name is a legitimate internal name. These are acceptabl input arg
 * loc://ABC@window_1        // default is a number with 0 value
 * loc://ABC@window_1  = 3.2
 * loc://ABC@window_1  = "ABC"
 * loc://ABC@window_1  = ["A", "B"]
 * loc://ABC@window_1  = [1,2,3]
 * loc://ABC@window_1:["OFF", "ON"] // default to 0
 * loc://ABC@window_1:["OFF", "ON"] = 1
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
    // full name, including display window ID
    private readonly _channelName: string = "";
    private _value: type_InternalChannelValue = 0;
    private _enumChoices: string[] = []; // enum type

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
     * channel name. A local channel may additionally contain TDM's generated
     * `@window_<id>` suffix, which is validated separately from the PV name.
     *
     * @returns `undefined` when the channel name, expression, initial value, or
     * enum definition is invalid.
     */
    parseChannelNameExpr = (channelNameExpr: string): {
        channelName: string, // include display window ID
        enumChoices: string[],
        value: type_InternalChannelValue,
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

        let channelNameIsValid = verifyChannelName(channelNameBody);
        if (protocol === "loc://") {
            const windowSuffixIndex = channelNameBody.lastIndexOf("@window_");
            if (windowSuffixIndex !== -1) {
                const pvName = channelNameBody.slice(0, windowSuffixIndex);
                const displayWindowId = channelNameBody.slice(windowSuffixIndex + "@window_".length);
                channelNameIsValid = verifyChannelName(pvName)
                    && displayWindowId !== ""
                    && verifyChannelName(displayWindowId);
            }
        }
        if (!channelNameIsValid) {
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
        const windowId = displayWindowClient.getWindowId();

        
        ipcManager.sendFromRendererProcess("ia-get-meta",
            {
                channelName: this.getChannelName(),
            }
        );
        try {
            let message: type_dbrData | type_LocalChannel_data = await this.getIoPromise(ioId);
            this.appendToDbrData(message);
            return message;
        } catch (e) {
            this.appendToDbrData({ value: undefined });
            return { value: undefined };
        }
    };

    get = () => {

    }

    put = () => {

    }

    // ------------------------ getter and setters -----------------------

    isLocal = () => {
        return this.getChannelName().startsWith("loc://");
    }

    getDisplayWindowId = (): string | undefined => {
        if (this.isLocal()) {
            const parts = this.getChannelName().split("@");
            if (parts.length === 2) {
                return parts[1];
            } else {
                Log.error("Wrong display window ID in local channel");
                return undefined;
            }
        } else {
            return undefined;
        }
    }

    getEnumChoices = () => {
        return this._enumChoices;
    }

    getValue = () => {
        return this._value;
    }

    getChannelName = () => {
        return this._channelName;
    }
    
}
