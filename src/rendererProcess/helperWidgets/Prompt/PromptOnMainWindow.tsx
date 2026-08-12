import * as React from "react";
import { MainWindowClient } from "../../windows/MainWindow/MainWindowClient";
import { Prompt } from "./Prompt"
import { ElementRectangleButton } from "../SharedElements/RectangleButton";
import { liquidGlassStyle, liquidGlassStyleDark } from "../../global/GlobalVariables";

export class PromptOnMainWindow extends Prompt {

    private _mainWindowClient: MainWindowClient;
    private _loadingCount = 0;

    constructor(mainWindowClient: MainWindowClient) {
        super();
        this._mainWindowClient = mainWindowClient;
        // this.getNameElementMap()["ssh-password-input"] = this._ElemenPromptSshPasswordInput;

    }


    getMainWindowClient = () => {
        return this._mainWindowClient;
    }

    getBackgroundStyle = () => {return liquidGlassStyleDark};

}
