import ReactDOM from "react-dom/client";
import { TreePage } from "./TreePage";
import { TablePage } from "./TablePage";
import { AreaPage } from "./AreaPage";


import { Talhk } from "../Talhk";
import { g_widgets1 } from "../../../global/GlobalVariables";
import { g_flushWidgets } from "../../../helperWidgets/Root/Root";

export class BasePage {
    constructor(mainWidget: Talhk, serverAddress: string) { 
        this._mainWidget = mainWidget;
        this._serverAddress = serverAddress;


    }

    // ------------------ desktop version only -----------------------


    _mainWidget: Talhk;
    _serverAddress: string;

    resourcePath = "../../../webpack/resources/webpages/"

    getServerAddress = () => {
        return this._serverAddress
    }

    getMainWidget = () => {
        return this._mainWidget
    }

    refreshPage = (page: TreePage | AreaPage | TablePage) => {
        // root.render(page.getElement());
        // this.getMainWidget().switchView(newPage)

        g_widgets1.addToForceUpdateWidgets(this.getMainWidget().getWidgetKey());
        g_flushWidgets()
        // the requested data comes in "new-data" event, 
        // the new-data will be handled separately for difference Page
        this.requestData([]);

    }

    requestData(path: string[]) { }

    getHostName = () => {
        return this.getServerAddress().replace("http://", "").split(":")[0];        
    }

}