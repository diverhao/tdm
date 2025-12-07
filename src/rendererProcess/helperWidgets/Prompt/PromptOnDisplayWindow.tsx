import * as React from "react";
import { DisplayWindowClient } from "../../../rendererProcess/windows/DisplayWindow/DisplayWindowClient";
import { g_widgets1 } from "../../global/GlobalVariables";
import path from "path";
import { Prompt } from "./Prompt"
import { ElementRectangleButton } from "../SharedElements/RectangleButton";

export class PromptOnDisplayWindow extends Prompt {

    private _displayWindowClient: DisplayWindowClient;

    constructor(displayWindowClient: DisplayWindowClient) {
        super();
        this._displayWindowClient = displayWindowClient;
        //todo: review it
        this.getNameElementMap()["open-display-in-ssh-mode"] = this._ElementOpenDisplayInSshMode;
    }

    // args: array of input arguments
    _ElementOpenDisplayInSshMode = ({ args }: any) => {
        const [fileName, setFileName] = React.useState("");

        return (<this._ElementBackground>
            <div>Open TDL file on {this.getDisplayWindowClient().getHostname()}</div>
            <div style={{
                fontSize: 12,
                color: "rgba(150, 150, 150, 1)",
            }}>
                You can input absolute path, relative path on {this.getDisplayWindowClient().getHostname()}, or a remote path that starts with http:// or https:// for the TDL file.
            </div>
            <this._ElementForm
                widthPercent={90}
                handleSubmit={(event: React.FormEvent) => {
                    event.preventDefault(); event.preventDefault();
                    let result: string = fileName;

                    if (!(fileName.startsWith("http://") || fileName.startsWith("https://"))) {
                        if ((!path.isAbsolute(fileName))) {
                            const dirName = path.dirname(this.getDisplayWindowClient().getTdlFileName());
                            result = path.join(dirName, fileName);
                        }
                    }
                    this.getDisplayWindowClient().getIpcManager().sendFromRendererProcess("open-tdl-file",
                        {
                            options:
                            {
                                tdlFileNames: [result],
                                mode: "operating",
                                editable: true,
                                macros: [],
                                replaceMacros: true, // not used
                                // currentTdlFolder: currentTdlFolder,
                                // openInSameWindow: false,
                                windowId: this.getDisplayWindowClient().getWindowId(),
                            }
                        });
                    this.removeElement();
                }}
            >
                <this._ElementInput
                    autoFocus={true}
                    value={fileName}
                    handleChange={(event: any) => {
                        event.preventDefault();
                        setFileName(event.target.value);
                    }}
                >
                </this._ElementInput>
            </this._ElementForm>

            <div style={{
                display: "inline-flex",
                width: "100%",
                flexDirection: 'row',
                alignItems: "cener",
                justifyContent: "center",
                margin: 5,
                userSelect: "none",
            }}>
                <ElementRectangleButton
                    handleClick={(event: React.MouseEvent) => {
                        event.preventDefault();
                        const mode = g_widgets1.isEditing() ? "editing" : "operating";
                        this.getDisplayWindowClient().getIpcManager().sendFromRendererProcess("open-tdl-file",
                            {
                                options:
                                {
                                    tdlFileNames: [fileName],
                                    mode: mode,
                                    editable: true,
                                    macros: [],
                                    replaceMacros: true, // not used
                                    // currentTdlFolder: currentTdlFolder,
                                    // openInSameWindow: false,
                                    windowId: this.getDisplayWindowClient().getWindowId(),
                                }
                            });
                        this.removeElement();
                    }}
                >
                    OK
                </ElementRectangleButton>
                &nbsp; &nbsp; &nbsp; &nbsp;
                <ElementRectangleButton
                    handleClick={(event: React.MouseEvent) => {
                        event.preventDefault();
                        this.removeElement();
                    }}
                >
                    Cancel
                </ElementRectangleButton>
            </div>
        </this._ElementBackground>)

    }

    getDisplayWindowClient = () => {
        return this._displayWindowClient;
    }

}