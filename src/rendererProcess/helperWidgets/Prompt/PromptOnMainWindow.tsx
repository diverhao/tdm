import * as React from "react";
import { MainWindowClient } from "../../windows/MainWindow/MainWindowClient";
import { Prompt } from "./Prompt"
import { ElementRectangleButton } from "../SharedElements/RectangleButton";

export class PromptOnMainWindow extends Prompt {

    private _mainWindowClient: MainWindowClient;
    private _loadingCount = 0;

    constructor(mainWindowClient: MainWindowClient) {
        super();
        this._mainWindowClient = mainWindowClient;
        this.getNameElementMap()["ssh-password-input"] = this._ElemenPromptSshPasswordInput;

        setInterval(() => {
            this._loadingCount++;
            this._loadingCount = this._loadingCount % 3;
        }, 1000)
    }

    _ElemenPromptSshPasswordInput = ({ args }: any) => {
        // will be add back after clicking OK or Cancel
        this.removeEventListeners();

        // {
        //   state: "init" | "error",
        //   callingMainProcessId: string,
        //   username: string
        //   hostname: string
        // }
        const data = args[0];

        const [password, setPasword] = React.useState("");
        const sshMainProcessId: string = data["callingMainProcessId"];
        const username: string = data["username"];
        const hostname: string = data["hostname"];

        return (
            <this._ElementBackground>
                <div>Input password for {username}@{hostname}</div>
                <div style={{
                    fontSize: 12,
                    color: "rgba(150, 150, 150, 1)",

                }}>You have about 15 seconds to input the password.</div>
                <this._ElementForm
                    handleSubmit={(event: any) => {
                        event.preventDefault();
                        this.getMainWindowClient().getIpcManager().sendFromRendererProcess("ssh-password-prompt-result", {
                            password: password,
                            sshMainProcessId: sshMainProcessId,
                        })
                        this.startEventListeners();
                        this.removeElement();
                    }}
                    widthPercent={90}
                >
                    <this._ElementInput
                        autoFocus={true}
                        value={password}
                        handleChange={(event: any) => {
                            event.preventDefault();
                            setPasword(event.target.value);
                        }}
                        type="password"
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
                            // event.preventDefault();
                            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("ssh-password-prompt-result", {
                                password: password,
                                sshMainProcessId: sshMainProcessId,
                            })
                            this.startEventListeners();
                            this.removeElement();
                        }}
                        text={"Submit"}
                    >
                        Submit
                    </ElementRectangleButton>
                    &nbsp; &nbsp; &nbsp; &nbsp;
                    <ElementRectangleButton
                        handleClick={(event: React.MouseEvent) => {
                            // event.preventDefault();
                            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("ssh-password-prompt-result", {
                                password: "",
                                sshMainProcessId: sshMainProcessId,
                            })
                            this.startEventListeners();
                            this.removeElement();
                        }}
                    >
                        Cancel
                    </ElementRectangleButton>
                </div>
            </this._ElementBackground>)

    }

    getMainWindowClient = () => {
        return this._mainWindowClient;
    }

}