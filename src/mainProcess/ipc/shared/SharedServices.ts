import { dialog } from "electron";
import { IpcManagerOnMainProcess } from "../../mainProcess/IpcManagerOnMainProcess";
import { DisplayWindowAgent } from "../../windows/DisplayWindow/DisplayWindowAgent";
import { MainWindowAgent } from "../../windows/MainWindow/MainWindowAgent";
import { IpcEventArgType } from "../../../common/IpcEventArgType";
import { Log } from "../../../common/Log";


export const showDisplayWindowNotification = (displayWindowAgent: DisplayWindowAgent,
    messageType: "error" | "info" | "warning",
    humanReadableMessage: string[],
    rawMessages: string[],
) => {
    displayWindowAgent.sendFromMainProcess("dialog-show-message-box", {
        info: {
            messageType: messageType,
            humanReadableMessages: humanReadableMessage,
            rawMessages: rawMessages,
        }
    })
}
