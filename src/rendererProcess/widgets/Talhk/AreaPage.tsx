import * as React from "react";
import ReactDOM from "react-dom/client";
import { MainPage } from "./MainPage";

export class AreaPage {

    private _editing: boolean = false;
    private _mainPage: MainPage;

    expandingAll: boolean = true;
    onlyShowAlarmingPvs: boolean = false;
    setEngineName = (name: string) => { };

    setHint: any = (hint: string) => { };
    showOperations: boolean = true;
    forceUpdateElements: string[] = [];
    showConfigMiniPage: boolean = false;

    selectedPathStr = "";
    mouseOnPathStr = "";

    // private _mainPage: MainPage;
    _forceUpdate: (input: any) => void = () => { };
    // setEngineName = (name: string) => { };
    constructor(mainPage: MainPage) {
        this._mainPage = mainPage;
    }

    _Element = () => {
        return (
            <div>
                Area page
                <this._ElementPageView></this._ElementPageView>
            </div>
        )
    }

    _ElementPageView = () => {
        return (
            <select
                value={"AreaPage"}
                onChange={(event: any) => {
                    console.log(event.target.value)
                    if (event.target.value === "AreaPage") {
                        return;
                    } else {
                        this.getMainPage().switchView(event.target.value);
                    }
                }}
            >
                <option value="TreePage">Tree </option>
                <option value="TablePage">Table </option>
                <option value="AreaPage">Area </option>
            </select>
        )
    }

    getElement = () => {
        return (
            <this._Element></this._Element>
        )
    }

    getMainPage = () => {
        return this._mainPage;
    }
}