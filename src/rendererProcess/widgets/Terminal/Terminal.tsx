import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { TerminalSidebar } from "./TerminalSidebar";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
// import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import * as xterm from "@xterm/xterm";
import path from "path";
import { ChannelSeverity } from "../../channel/TcaChannel";
// import { clipboard } from "electron";
// import { homedir } from "os";
import { FitAddon } from "@xterm/addon-fit";
// import { parse } from "mathjs";
import { TerminalIos } from "./TerminalIos";
import { Log } from "../../../common/Log";


export type type_Terminal_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
};

type type_Terminal_command = {
    execute: (...input: any[]) => any;
    cancel: any;
} & Record<string, any>;

export class Terminal extends BaseWidget {
    // level-1 properties in tdl file
    // _type: string;
    // _widgetKey: string;
    // _style: Record<string, any>;
    // _text: Record<string, any>;
    // _channelNames: string[];
    // _groupNames: string[] = undefined;

    // sidebar
    // private _sidebar: TextUpdateSidebar;

    // tmp methods
    // private _tmp_mouseMoveOnResizerListener: any = undefined;
    // private _tmp_mouseUpOnResizerListener: any = undefined;

    // widget-specific channels, these channels are only used by this widget
    // private _tcaChannels: TcaChannel[];

    // used for the situation of shift key pressed + mouse down on a selected widget,
    // so that when the mouse is up, the widget is de-selected
    // its value is changed in 3 places: this.select2(), this._handleMouseMove() and this._handleMouseUp()
    // private _readyToDeselect: boolean = false;

    // _rules: TextUpdateRules;

    _terminal: xterm.Terminal;

    _ios: TerminalIos = TerminalIos.getInstance();

    constructor(widgetTdl: type_Terminal_tdl) {
        super(widgetTdl);
        // this.setReadWriteType("read");

        this.setStyle({ ...Terminal._defaultTdl.style, ...widgetTdl.style });
        this.setText({ ...Terminal._defaultTdl.text, ...widgetTdl.text });

        // this._rules = new TextUpdateRules(this, widgetTdl);

        this._sidebar = new TerminalSidebar(this);

        this._terminal = new xterm.Terminal({
            cursorBlink: true,
            linkHandler: {
                activate: this.webLinksAddonOnClick,
                allowNonHttpProtocols: true,
            },
        });

        window.addEventListener("resize", () => {
            // if it is a utility window
            if (g_widgets1 !== undefined) {
                const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                const isUtilityWindow = displayWindowClient.getIsUtilityWindow();
                if (isUtilityWindow && !g_widgets1.isEditing()) {
                    this._fitAddon.fit();
                }
            }
        });

        this._fitAddon = new FitAddon();
        this.getTerminal().loadAddon(this._fitAddon);

        // for parsing OSC8 format hyperlink
        // this.getTerminal().options.linkHandler = {
        // 	activate: this.webLinksAddonOnClick,
        // 	allowNonHttpProtocols: true,
        // };

        this.getTerminal().onKey(async (input: { key: string; domEvent: KeyboardEvent }) => {
            const key = input["key"];

            if (key.charCodeAt(0) === 13) {
                // Enter, execute command
                if (this.getExecutingCommand() === this.bc) {
                    // calculate bc expressions
                    this.getTerminal().write(`\r\n`);
                    this.bc.execute(this.inputLine);
                    this.addHistory();
                    this.currentHistory = 0;
                    this.inputLine = "";
                } else {
                    this.getTerminal().write(`\r\n`);
                    await this.parseInputLine();
                    this.addHistory();
                    this.currentHistory = 0;
                    this.inputLine = "";
                }
            } else if (key === "\x01") {
                // Ctrl+a
                let result = `\r`; // go to the beginning
                for (let ii = 0; ii < this.getPrompt(false).length; ii++) {
                    result = `${result}\x1B[C`;
                }
                this.getTerminal().write(result);
            } else if (key === "\x05") {
                // Ctrl+e
                let result = `\r`;
                for (let ii = 0; ii < this.inputLine.length + this.getPrompt(false).length; ii++) {
                    result = `${result}\x1B[C`;
                }
                this.getTerminal().write(result);
            } else if (key.charCodeAt(0) === 127) {
                // backspace
                const currentPosition = this.getCursorX() - this.getPromptSize();
                if (currentPosition > 0) {
                    this.inputLine = `${this.inputLine.substring(0, currentPosition - 1)}${this.inputLine.substring(currentPosition)}`;
                    const backNum = this.inputLine.length - currentPosition + 2;
                    let backChars = "";
                    for (let ii = 0; ii < backNum - 1; ii++) {
                        backChars = `${backChars}\x1B[D`;
                    }

                    const result = `\x1b[2K\r${this.getPrompt(false)}${this.inputLine}${backChars}`;
                    this.getTerminal().write(result);
                }
            } else if (key === "\x03" || key === "\x04") {
                // Ctrl-c or Ctrl-d
                this.inputLine = "";
                this.cancelExecutingCommand();
                this.commandFinished();
            } else if (key === "\x1B[D" || key === "\x02") {
                // left arrow or Ctrl+b
                if (this.getCursorX() <= this.getPromptSize()) {
                    // do nothing
                } else {
                    this.getTerminal().write("\x1B[D");
                }
            } else if (key === "\x1B[C" || key === "\x06") {
                // right arrow or Ctrl+f
                if (this.getCursorX() >= this.getPromptSize() + this.inputLine.length) {
                    // do nothing
                } else {
                    this.getTerminal().write("\x1B[C");
                }
            } else if (key === "\x1B[A") {
                // up arrow
                if (this.currentHistory < this.history.length) {
                    this.currentHistory++;
                    const inputLine = this.history[this.history.length - this.currentHistory];
                    if (inputLine !== undefined) {
                        this.inputLine = inputLine;
                        const result = `\x1b[2K\r${this.getPrompt(false)}${this.inputLine}`;
                        this.getTerminal().write(result);
                    }
                }
            } else if (key === "\x1B[B") {
                // down arrow
                if (this.currentHistory > 0) {
                    this.currentHistory--;
                    const inputLine = this.history[this.history.length - this.currentHistory];
                    if (inputLine !== undefined) {
                        this.inputLine = inputLine;
                    } else {
                        this.inputLine = "";
                    }
                    const result = `\x1b[2K\r${this.getPrompt(false)}${this.inputLine}`;
                    this.getTerminal().write(result);
                }
            } else if (key.charCodeAt(0) >= 32 && key.charCodeAt(0) <= 126) {
                // echo text in terminal
                const currentPosition = this.getCursorX() - this.getPromptSize();
                this.inputLine = `${this.inputLine.substring(0, currentPosition)}${key}${this.inputLine.substring(currentPosition)}`;
                const backNum = this.inputLine.length - currentPosition;
                let backChars = "";
                for (let ii = 0; ii < backNum - 1; ii++) {
                    backChars = `${backChars}\x1B[D`;
                }
                // (1) clear the whole line
                // (2) prompt
                // (3) input
                // (4) go back
                const result = `\x1b[2K\r${this.getPrompt(false)}${this.inputLine}${backChars}`;
                this.getTerminal().write(result);
            } else if (key === "\t") {
                this.autoComplete();
            } else {
                // do nothing
            }
        });
        this.initMineData(this.mineGrids, this.mineGrids);
    }
    // -------------------------- terminal command -----------------------


    terminalCommand = async (command: string, args: any[] = []) => {
        const ioId = this.getIos().appendIo("os.homedir", 1, undefined);
        g_widgets1.getRoot().getDisplayWindowClient().getIpcManager().sendFromRendererProcess("terminal-command", {
            displayWindowId: g_widgets1.getRoot().getDisplayWindowClient().getWindowId(),
            // bounce back
            widgetKey: this.getWidgetKey(),
            ioId: ioId,
            // command 
            command: command as "os.homedir" | "os.userInfo" | "fs.readdir" | "fs.stat" | "fs.isDirectory",
            args: args,
        })
        try {
            const result = await this.getIos().getIoPromise(ioId);
            return result;
        } catch (e) {
            // if rejected
            return undefined;
        }
    }
    os_homedir = async () => {
        const result = await this.terminalCommand("os.homedir", []);
        if (result === undefined || result.length < 1) {
            return ""
        } else {
            return `${result[0]}`;
        }
    }


    os_userInfo = async () => {
        const result = await this.terminalCommand("os.userInfo", []);
        if (result === undefined || result.length < 1) {
            return {}
        } else {
            return result[0];
        }
    }

    fs_readdir = async (dirName: string) => {
        const result = await this.terminalCommand("fs.readdir", [dirName]);
        if (result === undefined || result.length < 1) {
            return []
        } else {
            return result[0];
        }
    }

    fs_stat = async (dirOrFileName: string) => {
        const result = await this.terminalCommand("fs.stat", [dirOrFileName]);
        if (result === undefined || result.length < 1) {
            return {}
        } else {
            return result[0];
        }
    }


    fs_isDirectory = async (dirOrFileName: string) => {
        const result = await this.terminalCommand("fs.isDirectory", [dirOrFileName]);
        if (result === undefined || result.length < 1) {
            // return false;
            throw new Error(`Error reading ${dirOrFileName}`);
        } else {
            return result[0];
        }
    }

    getIos = () => {
        return this._ios;
    }

    // ----------------------------------------------------------

    // _linkProvider: xterm.IDisposable;

    // uri must start with [dir] or [tdl]
    webLinksAddonOnClick = async (event: MouseEvent, uri: string, range: any) => {
        let tdlFileName = uri;
        if (tdlFileName.startsWith("[tdl]")) {
            tdlFileName = tdlFileName.replace("[tdl]", "");
            const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
            displayWindowClient.getIpcManager().sendFromRendererProcess("open-tdl-file",
                {
                    options: {
                        tdlFileNames: [tdlFileName],
                        mode: "operating",
                        editable: false,
                        // external macros: user-provided and parent display macros
                        macros: [],
                        replaceMacros: false,
                        currentTdlFolder: this.currentDir,
                        windowId: g_widgets1.getRoot().getDisplayWindowClient().getWindowId(),
                    }
                });
        } else if (tdlFileName.startsWith("[dir]")) {
            tdlFileName = tdlFileName.replace("[dir]", "");
            this.inputLine = `cd ${tdlFileName}`;
            this.getTerminal().write(`\r\n`);
            await this.parseInputLine();
            this.addHistory();
            this.currentHistory = 0;
            this.inputLine = "";
        } else {
            // go to upper level
            // Enter, execute command
            this.getTerminal().write(`\r\n`);
            this.inputLine = `cd ${uri}`;
            await this.parseInputLine();
            this.addHistory();
            this.currentHistory = 0;
            this.inputLine = "";
        }
    };

    _fitAddon: FitAddon;
    // _webLinksAddon: WebLinksAddon;

    // ----------------------- commands --------------------------------
    // pwd, cd, ls, l, llt, tcaget, tcaput, tcamonitor, tdm, open, clear
    // copy, paste
    // tab fill
    // showmacro, setmacro

    currentDir: string = "";

    inputLine: string = "";
    history: string[] = [];
    historySize = 1000;
    currentHistory = 0;

    addHistory = () => {
        this.history.push(this.inputLine);
        if (this.history.length > this.historySize) {
            this.history.splice(0, 1);
        }
    };

    getTerminal = () => {
        return this._terminal;
    };
    getPrompt = (newLine: boolean = true) => {
        if (this.getExecutingCommand() === this.bc) {
            return "bc >> ";
        }

        if (newLine) {
            return "\r\nTDM Terminal $ ";
        } else {
            return "TDM Terminal $ ";
        }
    };

    getCursorX = () => {
        return this.getTerminal().buffer.active.cursorX;
    };
    getCursorY = () => {
        return this.getTerminal().buffer.active.cursorY;
    };

    getPromptSize = () => {
        return this.getPrompt().replaceAll("\r", "").replaceAll("\n", "").length;
    };

    commandFinished = () => {
        this.getTerminal().write(`${this.getPrompt()}`);
    };
    unknownCommand = (line: string) => {
        this.getTerminal().write(`Unknown command ${line}`);
        this.commandFinished();
    };

    // context menu "Copy"
    copyText = () => {
        const text = this.getTerminal().getSelection();
        // clipboard.writeText(text);
    };

    // context menu "Paste"
    pasteText = () => {
        // const text = clipboard.readText();
        // const text1 = text.split("\n")[0];
        // // const cursorX = this.getCursorX();
        // // this.inputLine = [this.inputLine.slice(0, cursorX), text1, this.inputLine.slice(cursorX)].join("");
        // // this.getTerminal().write(text);

        // const currentPosition = this.getCursorX() - this.getPromptSize();
        // this.inputLine = `${this.inputLine.substring(0, currentPosition)}${text1}${this.inputLine.substring(currentPosition)}`;
        // const backNum = this.inputLine.length - currentPosition;
        // let backChars = "";
        // for (let ii = 0; ii < backNum - text1.length; ii++) {
        // 	backChars = `${backChars}\x1B[D`;
        // }
        // // (1) clear the whole line
        // // (2) prompt
        // // (3) input
        // // (4) go back
        // const result = `\x1b[2K\r${this.getPrompt(false)}${this.inputLine}${backChars}`;
        // this.getTerminal().write(result);
    };

    parseInputLine = async () => {
        const mainProcessMode = g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode();
        if (this.inputLine.trim().startsWith("cd ") || this.inputLine.trim() === "cd") {
            if (mainProcessMode === "desktop") {
                this.registerCommand(this.cd);
                this.cd.execute(this.inputLine);
                this.clearExecutingCommand();
            }
            else {
                this.unknownCommand(this.inputLine);
                Log.error("Unknow command", this.inputLine);
            }
        } else if (this.inputLine.trim().startsWith("ls ") || this.inputLine.trim() === "ls") {
            if (mainProcessMode === "desktop") {
                this.registerCommand(this.ls);
                this.ls.execute(this.inputLine);
                this.clearExecutingCommand();
            } else {
                this.unknownCommand(this.inputLine);
                Log.error("Unknow command", this.inputLine);
            }
        } else if (this.inputLine.trim().startsWith("l ") || this.inputLine.trim() === "l") {
            if (mainProcessMode === "desktop") {
                this.registerCommand(this.l);
                this.l.execute(this.inputLine);
                this.clearExecutingCommand();
            } else {
                this.unknownCommand(this.inputLine);
                Log.error("Unknow command", this.inputLine);
            }
        } else if (this.inputLine.trim() === "pwd") {
            if (mainProcessMode === "desktop") {
                this.registerCommand(this.pwd);
                this.pwd.execute(this.inputLine);
                this.clearExecutingCommand();
            } else {
                this.unknownCommand(this.inputLine);
                Log.error("Unknow command", this.inputLine);
            }
        } else if (this.inputLine.trim().startsWith("open")) {
            if (mainProcessMode === "desktop") {
                this.registerCommand(this.open);
                this.open.execute(this.inputLine);
                this.clearExecutingCommand();
            } else {
                this.unknownCommand(this.inputLine);
                Log.error("Unknow command", this.inputLine);
            }

        } else if (this.inputLine.trim().startsWith("tcaget ")) {
            this.registerCommand(this.tcaget);
            await this.tcaget.execute(this.inputLine);
            this.clearExecutingCommand();
        } else if (this.inputLine.trim() === "clear") {
            this.registerCommand(this.clear);
            this.clear.execute(this.inputLine);
            this.clearExecutingCommand();
        } else if (this.inputLine.trim().startsWith("tcaput ")) {
            this.registerCommand(this.tcaget);
            await this.tcaput.execute(this.inputLine);
            this.clearExecutingCommand();
        } else if (this.inputLine.trim().startsWith("tcamonitor ")) {
            this.registerCommand(this.tcamonitor);
            this.tcamonitor.execute(this.inputLine);
            // command is canceled and cleared when press Ctrl-c
            // this.clearExecutingCommand();
        } else if (this.inputLine.trim().startsWith("edit ")) {
            this.registerCommand(this.edit);
            this.edit.execute(this.inputLine);
            // command is canceled and cleared when press Ctrl-c
            this.clearExecutingCommand();
        } else if (this.inputLine.trim() === "bc") {
            this.registerCommand(this.bc);
            this.bc.displayBanner();
            this.bc.execute("");
            // command is canceled and cleared when press Ctrl-c
            // this.clearExecutingCommand();
        } else if (this.inputLine.trim() === "help") {
            this.registerCommand(this.help);
            this.help.execute(this.inputLine);
            this.clearExecutingCommand();
        } else if (this.inputLine.trim() === "bossisaway") {
            // do nothing
            if (this.setShowMineSweeper !== undefined) {
                this.setShowMineSweeper((oldValue: boolean) => {
                    return true;
                });
            }
            this.commandFinished();
            this.clearExecutingCommand();
        } else if (this.inputLine.trim() === "") {
            // do nothing
            this.commandFinished();
        } else {
            this.unknownCommand(this.inputLine);
            Log.error("Unknow command", this.inputLine);
        }
    };

    _executingCommand: type_Terminal_command | undefined = undefined;
    getExecutingCommand = () => {
        return this._executingCommand;
    };

    setExecutingCommand = (newCommand: type_Terminal_command | undefined) => {
        this._executingCommand = newCommand;
    };

    clearExecutingCommand = () => {
        this.setExecutingCommand(undefined);
    };

    registerCommand = (command: type_Terminal_command) => {
        const executingCommand = this.getExecutingCommand();
        if (executingCommand !== undefined) {
            executingCommand.cancel();
        }
        this.setExecutingCommand(command);
    };

    cancelExecutingCommand = () => {
        const executingCommand = this.getExecutingCommand();
        if (executingCommand !== undefined) {
            const cancelFunc = executingCommand.cancel;
            if (cancelFunc !== undefined) {
                cancelFunc();
            }
        }
        this.clearExecutingCommand();
    };

    // todo: macros as options: "-m SYS=RING:,..."
    open: type_Terminal_command = {
        execute: (line: string) => {
            // open abc.tdl
            const tdlFileNameRaw = line.split(" ")[1];
            if (tdlFileNameRaw !== undefined) {
                const tdlFileName = tdlFileNameRaw.trim();
                const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                const fullTdlFileName = displayWindowClient.getTdlFileName();
                const currentTdlFolder = path.dirname(fullTdlFileName);
                const ipcManager = displayWindowClient.getIpcManager();
                ipcManager.sendFromRendererProcess("open-tdl-file",
                    {
                        options: {
                            tdlFileNames: [tdlFileName],
                            mode: "operating",
                            editable: false,
                            macros: [],
                            replaceMacros: false, // not used
                            currentTdlFolder: currentTdlFolder,
                            // openInSameWindow: false,
                            windowId: g_widgets1.getRoot().getDisplayWindowClient().getWindowId(),
                        }
                    });
            }
            this.commandFinished();
        },
        cancel: undefined,
    };

    // todo: more
    help: type_Terminal_command = {
        execute: (line: string) => {
            this.getTerminal().write("this is the help (todo)");
            this.commandFinished();
        },
        cancel: undefined,
    };

    clear: type_Terminal_command = {
        execute: (line: string) => {
            this.getTerminal().clear();
            this.commandFinished();
        },
        cancel: undefined,
    };

    // todo: options
    tcaget: type_Terminal_command = {
        execute: async (line: string) => {
            const lineArray = line.trim().split(" ");
            const ii = 1;
            const channelName = lineArray[ii].trim();
            if (channelName !== undefined) {
                try {
                    const tcaChannel = g_widgets1.getTcaChannel(channelName);
                    const dbrData = await tcaChannel.get(this.getWidgetKey(), 1, undefined, false);
                    if (dbrData !== undefined) {
                        this.getTerminal().write(`${channelName}     ${dbrData["value"]}`);
                    }

                    // do not destroy the channel
                } catch (e) {
                    Log.error(e);
                    const tcaChannel = g_widgets1.createTcaChannel(channelName, this.getWidgetKey());
                    if (tcaChannel !== undefined) {
                        const dbrData = await tcaChannel.get(this.getWidgetKey(), 1, undefined, false);
                        if (dbrData !== undefined) {
                            this.getTerminal().write(`${channelName}     ${dbrData["value"]}`);
                        }

                        tcaChannel.destroy(this.getWidgetKey());
                    }
                }
            } else {
                this.getTerminal().write(`Syntax error for command ${line}`);
            }
            this.commandFinished();
        },
        cancel: undefined,
    };

    // todo: options
    tcaput: type_Terminal_command = {
        execute: async (line: string) => {
            const lineArray = line.trim().split(" ");
            const ii = 1;
            const channelNameRaw = lineArray[1];
            const valueRaw = lineArray[2];
            if (valueRaw !== undefined && channelNameRaw !== undefined) {
                const channelName = channelNameRaw.trim();
                const valueStr = valueRaw.trim();
                const displayWindowId = g_widgets1.getRoot().getDisplayWindowClient().getWindowId();
                try {
                    const tcaChannel = g_widgets1.getTcaChannel(channelName);
                    setTimeout(() => {
                        // cancel getMeta
                        tcaChannel.destroy(this.getWidgetKey());
                    }, 100);
                    await tcaChannel.getMeta(this.getWidgetKey());
                    // value is always string, TcaChannel can prase it
                    // do not block
                    tcaChannel.put(displayWindowId, { value: valueStr }, 1);
                    const dbrData = await tcaChannel.get(this.getWidgetKey(), 1, undefined, false);
                    if (dbrData !== undefined) {
                        this.getTerminal().write(`${channelName}     ${dbrData["value"]}`);
                    }

                    // do not destroy the channel
                } catch (e) {
                    Log.error(e);
                    const tcaChannel = g_widgets1.createTcaChannel(channelName, this.getWidgetKey());
                    if (tcaChannel !== undefined) {
                        setTimeout(() => {
                            // cancel getMeta
                            tcaChannel.destroy(this.getWidgetKey());
                        }, 1000);
                        // value is always string, TcaChannel can prase it
                        const oldDbrData = await tcaChannel.getMeta(this.getWidgetKey());
                        // do not block
                        tcaChannel.put(displayWindowId, { value: valueStr }, 1);
                        const dbrData = await tcaChannel.get(this.getWidgetKey(), 1, undefined, false);
                        if (dbrData !== undefined) {
                            this.getTerminal().write(`Old : ${channelName}     ${oldDbrData["value"]}\n\r`);
                            this.getTerminal().write(`New : ${channelName}     ${dbrData["value"]}`);
                        }
                        tcaChannel.destroy(this.getWidgetKey());
                    }
                }
            } else {
                this.getTerminal().write(`Syntax error for command ${line}`);
            }

            this.commandFinished();
        },
        cancel: undefined,
    };

    tcamonitor: type_Terminal_command = {
        execute: (line: string) => {
            const lineArray = line.trim().split(" ");
            const ii = 1;
            const channelName = lineArray[ii].trim();
            if (channelName !== undefined) {
                try {
                    this.getChannelNamesLevel0().push(channelName);
                    const tcaChannel = g_widgets1.getTcaChannel(channelName);
                    tcaChannel.monitor();
                    // do not destroy the channel
                } catch (e) {
                    const tcaChannel = g_widgets1.createTcaChannel(channelName, this.getWidgetKey());
                    if (tcaChannel !== undefined) {
                        tcaChannel.monitor();
                    }
                    // tcaChannel.destroy(this.getWidgetKey());
                }
            } else {
                this.getTerminal().write(`Syntax error for command ${line}`);
            }
        },
        cancel: () => {
            try {
                const channelName = this.getChannelNamesLevel0()[0];
                const tcaChannel = g_widgets1.getTcaChannel(channelName);
                tcaChannel.destroy(this.getWidgetKey());
                this.getChannelNamesLevel0().length = 0;
            } catch (e) {
                Log.error(e);
            }
        },
    };

    edit: type_Terminal_command = {
        execute: (line: string) => {
            const lineArray = line.trim().split(" ");
            lineArray.splice(0, 1);
            let fileName = lineArray.join(" ").trim();

            if (fileName !== undefined) {
                if (!path.isAbsolute(fileName)) {
                    fileName = path.join(this.currentDir, fileName);
                }
                const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
                g_widgets1.openTextEditorWindow({
                    displayWindowId: displayWindowClient.getWindowId(),
                    widgetKey: this.getWidgetKey(),
                    fileName: fileName, // when "", do not open anything, when not "", open whatever we have
                    manualOpen: false, // use dialog to open, valid only when fileName is empty (""), if true, open the dialog to choose file, if false, open whatever we have
                    openNewWindow: true, // open in new TextEditor window, without using the dialog
                })
            } else {
                this.getTerminal().write(`Syntax error for command ${line}`);
            }
        },
        cancel: undefined,
    };

    mapDbrDataWitNewData = (channelNames: string[]) => {
        const channelName = channelNames[0];
        const value = g_widgets1.getChannelValue(channelName);
        if (value !== undefined && this.getExecutingCommand() === this.tcamonitor) {
            const timeStamp = g_widgets1.getChannelTimeStamp(channelName);
            const timeStampStr = `${timeStamp}`.split(/\s+/).slice(1, 5).join(" ");
            const severity = g_widgets1.getChannelSeverity(channelName);
            const severityStr = ChannelSeverity[severity];
            this.getTerminal().write(`${channelName}  ${timeStampStr}   ${value}  ${severityStr}\r\n`);
        }
    };

    cd: type_Terminal_command = {
        execute: async (line: string) => {
            let newDir = line.trim().split(" ")[1];
            if (newDir === undefined) {
                newDir = await this.os_homedir();
            }

            if (!path.isAbsolute(newDir)) {
                newDir = path.join(this.currentDir, newDir);
            }

            try {
                // const fsStat = fs.statSync(newDir);
                // if (fsStat.isDirectory()) {
                //     this.currentDir = newDir;
                // }
                if (await this.fs_isDirectory(newDir)) {
                    this.currentDir = newDir;
                }
            } catch (e) {
                // todo show error message
                Log.error(e);
            }

            this.commandFinished();
        },
        cancel: undefined,
    };

    currentLsDir: string = "";

    autoComplete = async () => {
        const inputLineArray = this.inputLine.trim().split(/\s+/);

        let inputLineOrig = this.inputLine;

        if (
            this.inputLine.startsWith("ls ") ||
            this.inputLine.startsWith("cd ") ||
            this.inputLine.startsWith("l ") ||
            this.inputLine.startsWith("open ") ||
            this.inputLine.startsWith("tdm ")
        ) {
            const inputLineArray = this.inputLine.trim().split(/\s+/);
            if (this.inputLine.endsWith("/")) {
                let dir = inputLineArray[1];
                if (!path.isAbsolute(dir)) {
                    dir = path.join(this.currentDir, dir);
                }
                // read
                try {
                    // const dirContents = fs.readdirSync(dir);
                    this.getTerminal().write(`\r\n`);
                    this.ls.execute(this.inputLine);
                    // this.getTerminal().write(this.inputLine);
                    this.clearExecutingCommand();
                    this.commandFinished();
                    this.getTerminal().write(this.inputLine);
                } catch (e) {
                    Log.error(e);
                }
                return;
            }

            if (inputLineArray.length === 1) {
                // ls or cd, show current folder
                try {
                    this.getTerminal().write("\r\n");
                    this.registerCommand(this.ls);
                    this.ls.execute("ls");
                    this.clearExecutingCommand();
                    this.getTerminal().write(inputLineOrig);
                } catch (e) {
                    Log.error(e);
                }
            } else {
                // ls or cd with parameter
                const parameter = inputLineArray[1];
                let parameterDirName = path.dirname(parameter);
                const parameterBaseName = path.basename(parameter);
                if (!path.isAbsolute(parameter)) {
                    parameterDirName = path.join(this.currentDir, parameterDirName);
                }

                if (parameterBaseName === "") {
                    // ls abc/def/ TAB
                    this.getTerminal().write("\r\n");
                    this.registerCommand(this.ls);
                    this.ls.execute(`ls ${parameterDirName}`);
                    this.clearExecutingCommand();
                    this.getTerminal().write(inputLineOrig);
                } else {
                    // ls abc/de TAB
                    try {
                        // match beginnings
                        // const dirContents = fs.readdirSync(parameterDirName);
                        const dirContents = await this.fs_readdir(parameterDirName);
                        const resultArray: string[] = [];
                        for (let content of dirContents) {
                            if (content.startsWith(parameterBaseName)) {
                                resultArray.push(content);
                            }
                        }

                        if (resultArray.length === 1) {
                            // only one match, it may be a file or folder
                            const result = resultArray[0].replace(parameterBaseName, "");
                            const isDir = await this.fs_isDirectory(`${path.join(parameterDirName, resultArray[0])}`);
                            if (isDir) {
                                let slash = "/";
                                if (this.inputLine.endsWith("/")) {
                                    slash = "";
                                }
                                this.inputLine = `${this.inputLine}${result}${slash}`;
                                // this.getTerminal().write(`\x1b[1;32m${result}${slash}\x1b[0;37m`);
                                this.getTerminal().write(`${result}${slash}`);
                            } else {
                                this.inputLine = `${this.inputLine}${result} `;
                                this.getTerminal().write(`${result} `);
                            }
                        } else if (resultArray.length > 1) {
                            // multiple matches
                            let firstResult = resultArray[0];
                            let patchLength = parameterBaseName.length;
                            let patchLoopOn: boolean = true;
                            for (let ii = parameterBaseName.length + 1; ii < firstResult.length + 1; ii++) {
                                const subStr = firstResult.substring(0, ii);
                                for (let jj = 1; jj < resultArray.length; jj++) {
                                    const nthResult = resultArray[jj];
                                    if (nthResult.startsWith(subStr)) {
                                        continue;
                                    } else {
                                        patchLength = ii - 1;
                                        patchLoopOn = false;
                                        break;
                                    }
                                }
                                if (patchLoopOn === false) {
                                    break;
                                } else {
                                    patchLength = ii;
                                }
                            }

                            const patchStr = firstResult.substring(0, patchLength).replace(parameterBaseName, "");
                            this.inputLine = `${this.inputLine}${patchStr}`;

                            this.getTerminal().writeln("");

                            for (let file of resultArray) {
                                let fileLink = file;
                                try {
                                    const isDir = await this.fs_isDirectory(path.join(parameterDirName, file));
                                    if (isDir) {
                                        fileLink = `\x1b[1;32m${file}\x1b[0;37m`;
                                    } else if (file.endsWith(".tdl") || file.endsWith(".edl")) {
                                        // OSC 8 hyperlink
                                        // fileLink = `\x1b]8;;${path.join(parameterDirName, file)}\x07${file}\x1b]8;;\x07`;
                                        fileLink = `\x1b[1;31m${file}\x1b[0;37m`;
                                    } else {
                                        fileLink = `${file}`;
                                    }
                                    this.getTerminal().writeln(fileLink);
                                } catch (e) {
                                    Log.error(e);
                                }
                            }
                            this.clearExecutingCommand();
                            this.commandFinished();
                            this.getTerminal().write(this.inputLine);
                        } else {
                            // no match, do nothing
                        }
                    } catch (e) { }
                }
            }
        }
    };

    // ls abc/
    // ls abc.tdl
    ls: type_Terminal_command = {
        execute: async (line: string) => {
            let dir = this.currentDir;
            if (line.trim().split(/\s+/).length > 1) {
                const parameter = line.trim().split(/\s+/)[1].trim();
                // dir = line.split(/\s+/)[1].trim();
                if (path.isAbsolute(parameter)) {
                    dir = parameter;
                } else {
                    dir = path.join(dir, parameter);
                }
            }
            try {
                const isDirectory = await this.fs_isDirectory(dir);
                // const dirStat = fs.statSync(dir);
                // if (dirStat.isDirectory()) {
                if (isDirectory) {
                    try {
                        // const resultArray = fs.readdirSync(dir);
                        const resultArray = await this.fs_readdir(dir);

                        this.getTerminal().writeln(`\x1b]8;;[dir]${dir}\x07[.]\x1b]8;;\x07`);
                        this.getTerminal().writeln(`\x1b]8;;[dir]${path.join(dir, "..")}\x07[..]\x1b]8;;\x07`);

                        for (let file of resultArray) {
                            let fileLink = file;
                            try {
                                const isDir = await this.fs_isDirectory(path.join(dir, file));
                                // const fileStats = fs.statSync(path.join(dir, file));
                                if (isDir) {
                                    fileLink = `\x1b]8;;[dir]${path.join(dir, file)}\x07\x1b[1;32m${file}\x1b[0;37m\x1b]8;;\x07`;
                                } else if (file.endsWith(".tdl") || file.endsWith(".edl")) {
                                    // OSC 8 hyperlink
                                    fileLink = `\x1b]8;;[tdl]${path.join(dir, file)}\x07\x1b[1;31m${file}\x1b[0;37m\x1b]8;;\x07`;
                                } else {
                                    fileLink = `${file}`;
                                }
                                this.getTerminal().writeln(fileLink);
                            } catch (e) {
                                Log.error(e);
                            }
                        }
                    } catch (e) {
                        this.getTerminal().write("File or folder read error.");
                    }
                } else {
                    // file
                    let file = path.basename(dir);
                    let fileLink = dir;
                    try {
                        const isDir = await this.fs_isDirectory(dir);
                        if (isDir) {
                            fileLink = `\x1b]8;;[tdl]${dir}\x07\x1b[1;32m${file}\x1b[0;37m\x1b]8;;\x07`;
                        } else if (file.endsWith(".tdl") || file.endsWith(".edl")) {
                            // OSC 8 hyperlink
                            fileLink = `\x1b]8;;[tdl]${dir}\x07\x1b[1;31m${file}\x1b[0;37m\x1b]8;;\x07`;
                        } else {
                            fileLink = `${file}`;
                        }
                        this.getTerminal().writeln(fileLink);
                    } catch (e) {
                        Log.error(e);
                    }
                }
            } catch (e) {
                Log.error(e);
                this.getTerminal().write("File or folder read error.");
            }

            this.commandFinished();
        },
        cancel: undefined,
    };

    // ls abc/
    // ls abc.tdl
    l: type_Terminal_command = {
        execute: async (line: string) => {
            let dir = this.currentDir;
            if (line.trim().split(/\s+/).length > 1) {
                const parameter = line.trim().split(/\s+/)[1].trim();
                // dir = line.split(/\s+/)[1].trim();
                if (path.isAbsolute(parameter)) {
                    dir = parameter;
                } else {
                    dir = path.join(dir, parameter);
                }
            }

            try {
                const isDir = await this.fs_isDirectory(dir);
                // const dirStat = fs.statSync(dir);
                const dirStat = await this.fs_stat(dir);

                if (isDir) {
                    try {
                        const resultArray = await this.fs_readdir(dir);

                        this.getTerminal().writeln(`\x1b]8;;[dir]${dir}\x07[.]\x1b]8;;\x07`);
                        this.getTerminal().writeln(`\x1b]8;;[dir]${path.join(dir, "..")}\x07[..]\x1b]8;;\x07`);

                        for (let file of resultArray) {
                            let fileLink = file;
                            try {
                                // const fileStats = fs.statSync(path.join(dir, file));
                                const fileStats = await this.fs_stat(path.join(dir, file));
                                const fileInfoStr = await this.getFileInfoStr(fileStats);
                                const isDir = await this.fs_isDirectory(path.join(dir, file));
                                if (isDir) {
                                    // OSC 8 hyperlink
                                    fileLink = `\x1b]8;;[dir]${path.join(dir, file)}\x07\x1b[1;32m${file}\x1b[0;37m\x1b]8;;\x07`;
                                } else if (file.endsWith(".tdl") || file.endsWith(".edl")) {
                                    // OSC 8 hyperlink
                                    fileLink = `\x1b]8;;[tdl]${path.join(dir, file)}\x07\x1b[1;31m${file}\x1b[0;37m\x1b]8;;\x07`;
                                } else {
                                    fileLink = `${file}`;
                                }
                                this.getTerminal().writeln(`${fileInfoStr}  ${fileLink}`);
                            } catch (e) {
                                Log.error(e);
                            }
                        }
                    } catch (e) {
                        this.getTerminal().write("File or folder read error.");
                    }
                } else {
                    // list one file
                    let file = path.basename(dir);
                    let fileLink = dir;
                    const fileInfoStr = await this.getFileInfoStr(dirStat);

                    if (file.endsWith(".tdl") || file.endsWith(".edl")) {
                        // OSC 8 hyperlink
                        fileLink = `\x1b]8;;[tdl]${path.join(dir, file)}\x07\x07\x1b[1;31m${file}\x07\x1b[0;37m\x1b]8;;\x07`;
                    } else {
                        fileLink = `${file}`;
                    }
                    this.getTerminal().writeln(`${fileInfoStr}  ${fileLink}`);
                }
            } catch (e) {
                Log.error(e);
                this.getTerminal().write("File or folder read error: cannot read file stats");
            }

            this.commandFinished();
        },
        cancel: undefined,
    };

    getFileInfoStr = async (fileStats: Record<string, any>) => {
        // -rw-r--r--     1 1h7   1551083765    67K Oct 26 12:55 myjob.log
        const uid = fileStats["uid"];
        let userName = `${uid}`;
        const gid = fileStats["gid"];
        const timeStamp = fileStats["mtime"];
        const size = fileStats["size"];
        const mode = fileStats["mode"];
        let permissionStr = "";
        const osUserInfo = await this.os_userInfo();
        if (uid === osUserInfo["uid"]) {
            userName = osUserInfo["username"];
        }

        // const isDir = 

        // if (fileStats.isDirectory()) {
        //     permissionStr = `${permissionStr}d`;
        // } else {
        //     permissionStr = `${permissionStr}-`;
        // }

        const permissions = "rwxrwxrwx";

        for (let ii = 8; ii >= 0; ii--) {
            if (((mode >> ii) & 1) === 1) {
                permissionStr = `${permissionStr}${permissions[8 - ii]}`;
            } else {
                permissionStr = `${permissionStr}-`;
            }
        }

        let humanSize = `${size}B`;
        if (size >= 1024 && size < 1024 * 1024) {
            humanSize = `${Math.round(size / 1024)}K`;
        } else if (size >= 1024 * 1024 && size < 1024 * 1024 * 1024) {
            humanSize = `${Math.round(size / 1024 / 1024)}M`;
        } else if (size >= 1024 * 1024 * 1024) {
            humanSize = `${Math.round(size / 1024 / 1024 / 1024)}G`;
        }

        const humanSizeLen = humanSize.length;
        for (let ii = 0; ii < 5 - humanSizeLen; ii++) {
            humanSize = ` ${humanSize}`;
        }

        // let timeStampStr = `${timeStamp}`;
        const timeStampArray = `${timeStamp}`.split(/\s+/);
        const timeStampStr = timeStampArray.slice(1, 5).join(" ");

        const fileInfoStr = `${permissionStr}  ${userName}  ${gid}  ${humanSize}  ${timeStampStr}`;
        return fileInfoStr;
    };

    pwd: type_Terminal_command = {
        execute: (line: string) => {
            if (line.trim().split(" ").length === 1) {
                const result = `${this.currentDir}`;
                this.getTerminal().write(result);
            } else {
                // ...
            }
            this.commandFinished();
        },
        cancel: undefined,
    };

    bc: type_Terminal_command = {
        execute: (line: string) => {
            let result: string | boolean | number = "";
            try {
                // parse the line, with ; as separator
                const commands = line.split(";");

                for (let commandRaw of commands) {
                    // assign variable
                    const commandRawArray = commandRaw.split("=");
                    if (commandRawArray.length === 1) {
                        // normal evaluation
                        // todo: test
                        // const commandParse = parse(commandRaw);
                        // result = commandParse.evaluate(this.bcVariables);
                    } else if (commandRawArray.length === 2) {
                        const variableRaw = commandRawArray[0];
                        if (variableRaw.trim().includes(" ")) {
                            throw new Error("Syntax error");
                        }
                        // process RHS, and
                        //todo uncomment, test parse
                        // const commandParse = parse(commandRawArray[1]);
                        // result = commandParse.evaluate(this.bcVariables);
                        // this.bcVariables[variableRaw.trim()] = result;
                    } else {
                        throw new Error("Syntax error");
                    }
                }
            } catch (e) {
                Log.error(e);
                result = `${e}`;
            }
            if (result === undefined) {
                result = "";
            }
            this.getTerminal().writeln(`${result}`);
            this.getTerminal().write("bc >> ");
        },
        cancel: () => {
            // this.inputLine = "";
            // this.commandFinished();
            this.bcVariables = {};
        },
        displayBanner: () => {
            this.getTerminal().writeln("-------------------------------------------");
            this.getTerminal().writeln("  This is a bc-like calculator, which can ");
            this.getTerminal().writeln("  do simple calculations.");
            this.getTerminal().writeln("  Type Ctrl-d to quit.");
            this.getTerminal().writeln("-------------------------------------------");
        },
    };

    bcVariables: Record<string, number | boolean | string> = {};

    // ------------------------- event ---------------------------------

    // defined in widget, invoked in sidebar
    // (1) determine which tdl property should be updated
    // (2) calculate new value
    // (3) assign new value
    // (4) add this widget as well as "GroupSelection2" to g_widgets1.forceUpdateWidgets
    // (5) flush
    updateFromSidebar = (event: any, propertyName: string, propertyValue: number | string | number[] | string[] | boolean | undefined) => {
        // todo: remove this method
    };

    // defined in super class
    // _handleMouseDown()
    // _handleMouseMove()
    // _handleMouseUp()
    // _handleMouseDownOnResizer()
    // _handleMouseMoveOnResizer()
    // _handleMouseUpOnResizer()
    // _handleMouseDoubleClick()

    // ----------------------------- geometric operations ----------------------------

    // defined in super class
    // simpleSelect()
    // selectGroup()
    // select()
    // simpleDeSelect()
    // deselectGroup()
    // deSelect()
    // move()
    // resize()

    // ------------------------------ group ------------------------------------

    // defined in super class
    // addToGroup()
    // removeFromGroup()

    // ------------------------------ elements ---------------------------------

    // element = <> body (area + resizer) + sidebar </>

    // Body + sidebar
    _ElementRaw = () => {
        this._initCurrentDir();

        this.setRulesStyle({});
        this.setRulesText({});
        const rulesValues = this.getRules()?.getValues();
        if (rulesValues !== undefined) {
            this.setRulesStyle(rulesValues["style"]);
            this.setRulesText(rulesValues["text"]);
        }

        this.setAllStyle({ ...this.getStyle(), ...this.getRulesStyle() });
        this.setAllText({ ...this.getText(), ...this.getRulesText() });

        // must do it for every widget
        g_widgets1.removeFromForceUpdateWidgets(this.getWidgetKey());
        this.renderChildWidgets = true;
        React.useEffect(() => {
            this.renderChildWidgets = false;
        });

        return (
            <ErrorBoundary style={this.getStyle()} widgetKey={this.getWidgetKey()}>
                <>
                    <this._ElementBody></this._ElementBody>
                    {this._showSidebar() ? this._sidebar?.getElement() : null}
                </>
            </ErrorBoundary>
        );
    };

    getElementFallbackFunction = () => {
        return this._ElementFallback;
    };

    // Text area and resizers
    _ElementBodyRaw = (): React.JSX.Element => {
        return (
            // always update the div below no matter the TextUpdateBody is .memo or not
            // TextUpdateResizer does not update if it is .memo
            <div style={this.getElementBodyRawStyle()}>
                <this._ElementArea></this._ElementArea>
                {this._showResizers() ? <this._ElementResizer /> : null}
            </div>
        );
    };

    // only shows the text, all other style properties are held by upper level _ElementBodyRaw
    _ElementAreaRaw = ({ }: any): React.JSX.Element => {
        const [showMineSweeper, setShowMineSweeper] = React.useState(false);
        this.setShowMineSweeper = setShowMineSweeper;
        return (
            <div
                style={{
                    display: "inline-flex",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    userSelect: "none",
                    overflow: "hidden",
                    whiteSpace: this.getAllText().wrapWord ? "normal" : "pre",
                    justifyContent: this.getAllText().horizontalAlign,
                    alignItems: this.getAllText().verticalAlign,
                    fontFamily: this.getAllStyle().fontFamily,
                    fontSize: this.getAllStyle().fontSize,
                    fontStyle: this.getAllStyle().fontStyle,
                    fontWeight: this.getAllStyle().fontWeight,
                    outline: this._getElementAreaRawOutlineStyle(),
                    color: this.getAllStyle()["color"],
                }}
                // title={"tooltip"}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                <this._ElementTerminal></this._ElementTerminal>
                {showMineSweeper === true ? <this._ElementMineSweeper></this._ElementMineSweeper> : null}
            </div>
        );
    };

    // showMineSweeper = true;
    setShowMineSweeper: any;

    mineData: number[][] = [];
    mineRevealed: boolean[][] = [];
    mineChecked: boolean[][] = [];
    mineFlagged: boolean[][] = [];
    forceUpdateMineField: any;
    // mineExplode: boolean = false;
    mineStatus: "playing" | "exploded" | "not-started" = "not-started";

    initMineData = (dimensionX: number, dimensionY: number) => {
        const percentile = 20;

        // initialize
        const data: number[][] = [];
        for (let ii = 0; ii < dimensionX; ii++) {
            const dataii: number[] = [];
            for (let jj = 0; jj < dimensionY; jj++) {
                dataii.push(0);
            }
            data.push(dataii);
        }

        for (let ii = 0; ii < dimensionX; ii++) {
            for (let jj = 0; jj < dimensionY; jj++) {
                const hasMine = Math.random() * 100 < percentile ? true : false;
                if (hasMine) {
                    data[ii][jj] = -1;

                    for (let offsetX = -1; offsetX < 2; offsetX++) {
                        for (let offsetY = -1; offsetY < 2; offsetY++) {
                            if (offsetX === 0 && offsetY === 0) {
                                continue;
                            }
                            let kk = ii - offsetX;
                            let ll = jj - offsetY;
                            data[kk] !== undefined && data[kk][ll] !== undefined && data[kk][ll] !== -1 ? (data[kk][ll] = data[kk][ll] + 1) : null;
                        }
                    }
                } else {
                }
            }
        }
        this.mineData = data;

        const revealed: boolean[][] = [];
        for (let ii = 0; ii < dimensionX; ii++) {
            const revealedii: boolean[] = [];
            for (let jj = 0; jj < dimensionY; jj++) {
                revealedii.push(false);
            }
            revealed.push(revealedii);
        }
        this.mineRevealed = revealed;

        const checked: boolean[][] = [];
        for (let ii = 0; ii < dimensionX; ii++) {
            const checkedii: boolean[] = [];
            for (let jj = 0; jj < dimensionY; jj++) {
                checkedii.push(false);
            }
            checked.push(checkedii);
        }
        this.mineChecked = checked;

        const flagged: boolean[][] = [];
        for (let ii = 0; ii < dimensionX; ii++) {
            const flaggedii: boolean[] = [];
            for (let jj = 0; jj < dimensionY; jj++) {
                flaggedii.push(false);
            }
            flagged.push(flaggedii);
        }
        this.mineFlagged = flagged;
    };

    getMineSize = () => {
        if (typeof this.getAllStyle()["width"] !== "number" || typeof this.getAllStyle()["width"] !== "number") {
            const size = Math.min(window.innerWidth, window.innerHeight);
            return size;
        } else {
            const size = Math.min(this.getAllStyle()["width"], this.getAllStyle()["height"]);
            return size;
        }
    };

    _ElementMineSweeper = () => {
        const [, forceUpdate] = React.useState({});
        this.forceUpdateMineField = forceUpdate;
        const [success, setSuccess] = React.useState(false);
        const smileyFaceElementRef = React.useRef<any>(null);
        const returnElementRef = React.useRef<any>(null);
        React.useEffect(() => {
            if (this.checkMineField()) {
                setSuccess(true);
            }
        });

        return (
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    backgroundColor: "rgba(255,255,255,1)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <div
                    style={{
                        width: this.getMineSize() * 0.9,
                        height: this.getMineSize(),
                        backgroundColor: "rgba(255, 255, 255, 1)",
                        display: "inline-flex",
                        flexDirection: "column",
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            height: "10%",
                            display: "inline-flex",
                            overflow: "visible",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <div>
                            <form>
                                <select
                                    onChange={(event: any) => {
                                        const difficulty = event.target.value;
                                        if (difficulty === "easy") {
                                            this.mineGrids = 8;
                                            setSuccess(false);
                                            this.resetMine();
                                        } else if (difficulty === "medium") {
                                            this.mineGrids = 12;
                                            setSuccess(false);
                                            this.resetMine();
                                        } else if (difficulty === "hard") {
                                            this.mineGrids = 20;
                                            setSuccess(false);
                                            this.resetMine();
                                        } else {
                                            // do nothing
                                        }
                                    }}
                                    defaultValue={
                                        this.mineGrids === 8 ? "easy" : this.mineGrids === 12 ? "medium" : this.mineGrids === 20 ? "hard" : ""
                                    }
                                >
                                    <option value={"easy"}>Easy</option>
                                    <option value={"medium"}>Medium</option>
                                    <option value={"hard"}>Hard</option>
                                </select>
                            </form>
                        </div>
                        <div
                            ref={smileyFaceElementRef}
                            style={{
                                aspectRatio: "1/1",
                                height: "50%",
                                overflow: "visible",
                            }}
                        >
                            {(() => {
                                return (
                                    <div
                                        onClick={() => {
                                            this.resetMine();
                                            setSuccess(false);
                                        }}
                                        onMouseEnter={() => {
                                            if (smileyFaceElementRef.current !== null) {
                                                smileyFaceElementRef.current.style["outline"] = "solid 5px rgba(180,180,180,1)";
                                                smileyFaceElementRef.current.style["cursor"] = "pointer";
                                            }
                                        }}
                                        onMouseLeave={() => {
                                            if (smileyFaceElementRef.current !== null) {
                                                smileyFaceElementRef.current.style["outline"] = "none";
                                                smileyFaceElementRef.current.style["cursor"] = "default";
                                            }
                                        }}
                                    >
                                        <svg viewBox="0 0 100 100" overflow="visible">
                                            <circle cx="50" cy="50" r="50" fill="rgba(255,255,0,1)" stroke="rgba(0,0,0,1)" strokeWidth="10" />
                                            <ellipse cx="35" cy="30" rx="5" ry="9" fill="rgba(0,0,0,1)" stroke="rgba(0,0,0,1)" strokeWidth="10" />
                                            <ellipse cx="65" cy="30" rx="5" ry="9" fill="rgba(0,0,0,1)" stroke="rgba(0,0,0,1)" strokeWidth="10" />
                                            {(() => {
                                                if (success) {
                                                    // good
                                                    return <path d="M 20 60 A 35 35 0 0 0 80 60" stroke="black" strokeWidth="5" fill="none"></path>;
                                                } else if (this.mineStatus === "exploded") {
                                                    // bad
                                                    return <path d="M 20 80 A 35 35 0 0 1 80 80" stroke="black" strokeWidth="5" fill="none"></path>;
                                                } else {
                                                    // ugly
                                                    return <path d="M 20 70 L 80 70" stroke="black" strokeWidth="5" fill="none"></path>;
                                                }
                                            })()}
                                        </svg>
                                    </div>
                                );
                            })()}

                            {/* {success ? "Success" : this.mineStatus === "exploded" ? "Boom" : ""} */}
                        </div>
                        <div
                            ref={returnElementRef}
                            onClick={() => {
                                this.setShowMineSweeper((oldValue: boolean) => {
                                    return false;
                                });
                            }}
                            style={{
                                backgroundColor: "rgba(180,180,180,1)",
                                borderRadius: 3,
                                paddingLeft: 10,
                                paddingRight: 10,
                                paddingTop: 3,
                                paddingBottom: 3,
                                display: "inline-flex",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                            onMouseEnter={() => {
                                if (returnElementRef.current !== null) {
                                    returnElementRef.current.style["cursor"] = "pointer";
                                    returnElementRef.current.style["backgroundColor"] = "rgba(200, 200, 200, 1)";
                                }
                            }}
                            onMouseLeave={() => {
                                if (returnElementRef.current !== null) {
                                    returnElementRef.current.style["cursor"] = "default";
                                    returnElementRef.current.style["backgroundColor"] = "rgba(180, 180, 180, 1)";
                                }
                            }}
                        >
                            Return
                        </div>
                    </div>
                    <div
                        style={{
                            width: "100%",
                            height: "90%",
                            backgroundColor: "rgba(255, 255, 255, 1)",
                            display: "inline-flex",
                            flexDirection: "column",
                        }}
                    >
                        {this.mineData.map((xData: number[], ii: number) => {
                            return (
                                <div
                                    style={{
                                        display: "inline-flex",
                                        flexDirection: "row",
                                        height: `${this.getStyle()["height"] / this.mineGrids}px`,
                                        width: "100%",
                                    }}
                                >
                                    {xData.map((data: number, jj: number) => {
                                        return <this._ElementField ii={ii} jj={jj}></this._ElementField>;
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    mineGrids = 8;

    _ElementField = ({ ii, jj }: any) => {
        return (
            <div
                style={{
                    display: "inline-flex",
                    width: (this.getMineSize() * 0.9) / this.mineGrids,
                    height: (this.getMineSize() * 0.9) / this.mineGrids,
                    backgroundColor: "rgba(255, 255, 255, 1)",
                    justifyContent: "center",
                    alignItems: "center",
                }}
                onClick={() => {
                    Log.debug("click", ii, jj);
                }}
            >
                <this._ElementField1 ii={ii} jj={jj}></this._ElementField1>
            </div>
        );
    };

    _ElementField1 = ({ ii, jj }: any) => {
        const value = this.mineData[ii][jj];
        const revealed = this.mineRevealed[ii][jj];
        const checked = this.mineChecked[ii][jj];
        const flagged = this.mineFlagged[ii][jj];

        if (value === -1) {
            return (
                // mine
                <div
                    style={{
                        backgroundColor: "rgba(220, 220, 220, 1)",
                        color: this.mineStatus === "exploded" ? "rgba(1, 1, 1, 1)" : flagged ? "rgba(0,0,0,1)" : "rgba(180, 180, 180, 0)",
                        width: "100%",
                        height: "100%",
                        justifyContent: "center",
                        alignItems: "center",
                        display: "inline-flex",
                        outline: "solid 2px black",
                        fontSize: Math.floor((this.getMineSize() / this.mineGrids) * 0.6),
                        userSelect: "none",
                        // opacity: this.mineExplode === true? 1:0,
                    }}
                    onClick={(event: React.MouseEvent) => {
                        event.preventDefault();
                        if (this.mineStatus === "exploded") {
                            return;
                        }
                        if (this.mineStatus === "not-started") {
                            // restart the game
                            Log.info("restart game");
                            this.resetMine();
                            return;
                        }
                        this.mineStatus = "exploded";
                        this.forceUpdateMineField({});
                    }}
                    onAuxClick={(event: React.MouseEvent) => {
                        event.preventDefault();
                        if (this.mineStatus === "exploded") {
                            return;
                        }

                        this.mineFlagged[ii][jj] = !flagged;
                        this.forceUpdateMineField({});
                    }}
                >
                    {/* {flagged?"F":"&#128163"}; */}
                    {(() => {
                        if (this.mineStatus === "exploded") {
                            // return "B";
                            return <div>&#128163;</div>;
                        } else {
                            if (flagged) {
                                // return "\u2691";
                                return <div>&#128681;</div>;
                            } else {
                                return <div>&#128163;</div>;
                                // return "B";
                            }
                        }
                    })()}
                    {/* {this.mineStatus === "exploded" ? "B" : flagged ? "\u2691" : "B"} */}
                </div>
            );
        } else {
            return (
                // number
                // 0, 1, 2, ..., 8
                <div
                    style={{
                        backgroundColor: revealed ? "rgba(225, 225, 0, 1)" : "rgba(220,220,220,1)",
                        color:
                            this.mineStatus === "exploded"
                                ? "rgba(0,0,0,1)"
                                : revealed
                                    ? "rgba(0, 0, 0, 1)"
                                    : flagged
                                        ? "rgba(0, 0, 0, 1)"
                                        : "rgba(180, 180, 180, 0)",
                        width: "100%",
                        height: "100%",
                        justifyContent: "center",
                        alignItems: "center",
                        display: "inline-flex",
                        outline: "solid 2px black",
                        fontSize: Math.floor((this.getMineSize() / this.mineGrids) * 0.6),
                        userSelect: "none",
                    }}
                    onClick={(event: React.MouseEvent) => {
                        // event.preventDefault();

                        if (this.mineStatus === "exploded") {
                            return;
                        }
                        this.checkMineBlock(ii, jj);
                        this.forceUpdateMineField({});
                        if (this.mineStatus === "not-started") {
                            this.mineStatus = "playing";
                        }
                    }}
                    onAuxClick={(event: React.MouseEvent) => {
                        if (this.mineStatus === "exploded") {
                            return;
                        }
                        event.preventDefault();
                        this.mineFlagged[ii][jj] = !flagged;

                        this.forceUpdateMineField({});
                    }}
                >
                    {/* {this.mineStatus === "exploded" ? (value === 0 ? "" : value) : flagged ? "\u2691" : value === 0 ? "" : value} */}
                    {(() => {
                        if (this.mineStatus === "exploded") {
                            if (value === 0) {
                                return "";
                            } else {
                                return value;
                            }
                        } else {
                            if (flagged) {
                                return <div>&#128681;</div>;
                            } else {
                                if (value === 0) {
                                    return "";
                                } else {
                                    return value;
                                }
                            }
                        }
                    })()}
                </div>
            );
        }
    };

    resetMine = () => {
        this.initMineData(this.mineGrids, this.mineGrids);
        this.mineStatus = "not-started";
        this.forceUpdateMineField({});
    };

    checkMineField = () => {
        let success = true;
        for (let ii = 0; ii < this.mineData.length; ii++) {
            for (let jj = 0; jj < this.mineData[ii].length; jj++) {
                const value = this.mineData[ii][jj];
                const revealed = this.mineRevealed[ii][jj];
                if (value !== -1 && !revealed) {
                    success = false;
                    break;
                } else {
                }
            }
        }
        return success;
    };

    // if this block is hidden, and its value is 0, then
    // reveal itself, and reveal all its neighbors
    checkMineBlock = (ii: number, jj: number) => {
        if (this.mineData[ii] !== undefined && this.mineData[ii][jj] !== undefined) {
            if (this.mineChecked[ii][jj] === true) {
                return;
            }
            this.mineChecked[ii][jj] = true;
            if (this.mineData[ii][jj] === 0) {
                for (let offsetX = -1; offsetX < 2; offsetX++) {
                    for (let offsetY = -1; offsetY < 2; offsetY++) {
                        const kk = ii + offsetX;
                        const ll = jj + offsetY;
                        this.revealMineBlock(kk, ll);
                        // if this block is not revealed and this block is 0
                        if (this.mineChecked[kk] !== undefined && this.mineChecked[kk][ll] !== undefined && this.mineChecked[kk][ll] === false) {
                            this.checkMineBlock(kk, ll);
                        }
                    }
                }
            } else if (this.mineData[ii][jj] === -1) {
                this.mineStatus = "exploded";
            } else if (this.mineData[ii][jj] >= 0 && this.mineData[ii][jj] <= 8) {
                this.revealMineBlock(ii, jj);
            }
        }
    };

    // passively reveal the mine block
    revealMineBlock = (ii: number, jj: number) => {
        if (this.mineData[ii] !== undefined && this.mineData[ii][jj] !== undefined) {
            this.mineRevealed[ii][jj] = true;
            // if (this.mineData[ii][jj] < 50 && this.mineData[ii][jj] >= 0) {
            // 	this.mineData[ii][jj] = this.mineData[ii][jj] + 100;
            // } else if (this.mineData[ii][jj] === -1) {
            // 	// do nothing
            // }
        }
    };

    initialized: boolean = false;

    _initCurrentDir = async () => {
        const mainProcessMode = g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode();
        if (g_widgets1 !== undefined && this.currentDir === "" && mainProcessMode === "desktop") {
            const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
            const fullTdlFileName = displayWindowClient.getTdlFileName();
            if (path.isAbsolute(fullTdlFileName)) {
                this.currentDir = path.dirname(fullTdlFileName);
            } else {
                this.currentDir = await this.os_homedir();
            }
        } else {
            // this.currentDir = "/abcd";
        }
    };

    // override
    jobsAsOperatingModeBegins() {
        this._initCurrentDir();
        this._fitAddon.fit();
    }
    // override
    jobsAsEditingModeBegins() {
        this._initCurrentDir();
        this._fitAddon.fit();
        this.getChannelNamesLevel0().length = 0;
    }

    bannderArray: string[] = [
        ``,
        `-------------- Welcome to use TDM terminal ------------------`,
        `  This terminal provides basic functionality to interact`,
        `  with TDM and EPICS channels.`,
        `  Type "help" for more info`,
        `-------------------------------------------------------------`,
        ``,
    ];

    oldRef: any;

    _ElementTerminal = () => {
        const terminalRef = React.useRef<any>(null);
        this.getTerminal().options.fontFamily = this.getAllStyle()["fontFamily"];
        this.getTerminal().options.fontSize = this.getAllStyle()["fontSize"];

        React.useEffect(() => {
            if (this.oldRef !== terminalRef.current && terminalRef.current !== null) {
                this.oldRef = terminalRef.current;
                this.getTerminal().open(terminalRef.current);
                this._fitAddon.fit();

                this.getTerminal().write(this.bannderArray.join("\r\n"));
                this.getTerminal().write(`${this.getPrompt()}`);
            }
        });

        return (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                }}
            >
                <div
                    id="terminal"
                    ref={terminalRef}
                    style={{
                        // position: "absolute",
                        // top: 0,
                        // left: 0,
                        backgroundColor: "black",
                        width: "100%",
                        height: "100%",
                        paddingLeft: 10,
                        paddingRight: 10,
                        // opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : 1,
                    }}
                ></div>
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        // width: "100%",
                        // height: "100%",
                        width: g_widgets1.isEditing() === true ? "100%" : 0,
                        height: g_widgets1.isEditing() === true ? "100%" : 0,
                        backgroundColor: "rgba(255, 0,0, 0)",
                    }}
                ></div>
            </div>
        );
    };

    _Element = React.memo(this._ElementRaw, () => this._useMemoedElement());
    _ElementArea = React.memo(this._ElementAreaRaw, () => this._useMemoedElement());
    _ElementBody = React.memo(this._ElementBodyRaw, () => this._useMemoedElement());

    // defined in super class
    // getElement()
    // getSidebarElement()
    // _ElementResizerRaw
    // _ElementResizer

    // -------------------- helper functions ----------------

    // defined in super class
    // _showSidebar()
    // _showResizers()
    // _useMemoedElement()
    // hasChannel()
    // isInGroup()
    // isSelected()
    // _getElementAreaRawOutlineStyle()

    // only for TextUpdate and TextEntry
    // they are suitable to display array data in various formats,
    // other types of widgets, such as Meter, Spinner, Tanks, ProgressBar, Thermometer, ScaledSlider are not for array data
    _getChannelValue = (raw: boolean = false) => {
        const channelValue = this.getChannelValueForMonitorWidget(raw);

        if (typeof channelValue === "number" || typeof channelValue === "string") {
            return this._parseChannelValueElement(channelValue);
        } else if (Array.isArray(channelValue)) {
            const result: any[] = [];
            for (let element of channelValue) {
                result.push(this._parseChannelValueElement(element));
            }
            if (this.getAllText()["format"] === "string") {
                return result.join("");
            } else {
                return result;
            }
        } else {
            return channelValue;
        }
    };

    _getChannelSeverity = () => {
        return this._getFirstChannelSeverity();
    };

    _getChannelUnit = () => {
        const unit = this._getFirstChannelUnit();
        if (unit === undefined) {
            return "";
        } else {
            return unit;
        }
    };

    // ----------------------- styles -----------------------

    // defined in super class
    // _resizerStyle
    // _resizerStyles
    // StyledToolTipText
    // StyledToolTip

    // -------------------------- tdl -------------------------------

    // properties when we create a new TextUpdate
    // the level 1 properties all have corresponding public or private variable in the widget

    static _defaultTdl: type_Terminal_tdl = {
        type: "Terminal",
        widgetKey: "", // "key" is a reserved keyword
        key: "",
        style: {
            // basics
            position: "absolute",
            display: "inline-flex",
            // dimensions
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(240, 240, 240, 1)",
            // angle
            transform: "rotate(0deg)",
            // border, it is different from the "alarmBorder" below,
            borderStyle: "solid",
            borderWidth: 0,
            borderColor: "rgba(0, 0, 0, 1)",
            // font
            color: "rgba(0,0,0,1)",
            fontFamily: "Courier Prime",
            fontSize: 14,
            fontStyle: "normal",
            fontWeight: "normal",
            // shows when the widget is selected
            outlineStyle: "none",
            outlineWidth: 1,
            outlineColor: "black",
        },
        text: {
            // text
            horizontalAlign: "flex-start",
            verticalAlign: "flex-start",
            wrapWord: false,
            showUnit: true,
            // actually "alarm outline"
            alarmBorder: true,
            invisibleInOperation: false,
            // default, decimal, exponential, hexadecimal
            format: "default",
            // scale, >= 0
            scale: 0,
        },
        channelNames: [],
        groupNames: [],
        rules: [],
    };

    // not getDefaultTdl(), always generate a new key
    static generateDefaultTdl = (type: string): Record<string, any> => {
        const result = super.generateDefaultTdl(type);
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        return result;
    };

    // static method for generating a widget tdl with external PV name
    static generateWidgetTdl = (utilityOptions: Record<string, any>): type_Terminal_tdl => {
        // utilityOptions = {} for it
        const result = this.generateDefaultTdl("Terminal");
        // result.text["externalMacros"] = utilityOptions["externalMacros"];
        // result.text["tdlFileName"] = utilityOptions["tdlFileName"];
        return result as type_Terminal_tdl;
    };

    // defined in super class
    // getTdlCopy()

    // --------------------- getters -------------------------

    // defined in super class
    // getType()
    // getWidgetKey()
    // getStyle()
    // getText()
    // getSidebar()
    // getGroupName()
    // getGroupNames()
    // getUpdateFromWidget()
    // getResizerStyle()
    // getResizerStyles()
    // getRules()

    // ---------------------- setters -------------------------

    // ---------------------- channels ------------------------

    // defined in super class
    // getChannelNames()
    // expandChannelNames()
    // getExpandedChannelNames()
    // setExpandedChannelNames()
    // expandChannelNameMacro()

    // ------------------------ z direction --------------------------

    // defined in super class
    // moveInZ()
    // -------------------------- sidebar ---------------------------
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new TerminalSidebar(this);
        }
    }
}
