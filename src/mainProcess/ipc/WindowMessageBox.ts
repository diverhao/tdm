import { DisplayWindowAgent } from "../windows/DisplayWindow/DisplayWindowAgent";
import { IpcEventArgType2 } from "../../common/IpcEventArgType";

type type_DialogShowMessageBoxInfo = IpcEventArgType2["dialog-show-message-box"]["info"];
type type_DialogShowMessageBoxExtraInfo = Omit<Partial<type_DialogShowMessageBoxInfo>, "messageType" | "humanReadableMessages" | "rawMessages">;

export function showDisplayWindowNotification(
    displayWindowAgent: DisplayWindowAgent,
    info: type_DialogShowMessageBoxInfo,
): void {
    displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
        info: info,
    });
}

export function showDisplayWindowError(
    displayWindowAgent: DisplayWindowAgent,
    humanReadableMessages: string[],
    rawMessages: string[] = [],
    extraInfo: type_DialogShowMessageBoxExtraInfo = {},
): void {
    showDisplayWindowNotification(displayWindowAgent, {
        ...extraInfo,
        messageType: "error",
        humanReadableMessages,
        rawMessages,
    });
}

export function showDisplayWindowInfo(
    displayWindowAgent: DisplayWindowAgent,
    humanReadableMessages: string[],
    rawMessages: string[] = [],
    extraInfo: type_DialogShowMessageBoxExtraInfo = {},
): void {
    showDisplayWindowNotification(displayWindowAgent, {
        ...extraInfo,
        messageType: "info",
        humanReadableMessages,
        rawMessages,
    });
}

export function showDisplayWindowWarning(
    displayWindowAgent: DisplayWindowAgent,
    humanReadableMessages: string[],
    rawMessages: string[] = [],
    extraInfo: type_DialogShowMessageBoxExtraInfo = {},
): void {
    showDisplayWindowNotification(displayWindowAgent, {
        ...extraInfo,
        messageType: "warning",
        humanReadableMessages,
        rawMessages,
    });
}
