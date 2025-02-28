import { BaseWidgetSidebar } from "../../widgets/BaseWidget/BaseWidgetSidebar";
import * as React from "react";

export abstract class SidebarComponent {
    _sidebar: BaseWidgetSidebar;

    constructor(sidebar: BaseWidgetSidebar) {
        this._sidebar = sidebar;
    }

    // --------------------------- JSX ---------------------

    // when the widget is changed, e.g. by mouse move, the sidebar values should be updated
    // must be overloaded inside _Element
    _updateFromWidget = (propertyValue: any) => { };
    getUpdateFromWidget = () => {
        return this._updateFromWidget;
    };

    abstract _Element: ({ hideText }: any) => JSX.Element;

    // update widget's apperance from sidebar
    abstract updateWidget: (event: any, propertyValue: number | string | number[] | string[] | boolean | undefined) => void;

    // --------------------- getters ---------------------

    _ElementInputLabel = ({ value, setValue, children, readableText, updater }: any) => {
        return (
            <div
                onClick={() => {
                    this.getSidebar().getSidebarLargeInput().createElement(value, setValue, readableText, updater);
                }}
            >
                {children}
            </div>
        )
    }

    getElement = (hideText: boolean = false) => {
        return <this._Element hideText={hideText}></this._Element>;
    };

    getSidebar = () => {
        return this._sidebar;
    };

    getMainWidget = () => {
        return this.getSidebar().getMainWidget();
    };

    getStyle = () => {
        return this.getMainWidget().getStyle();
    };

    getText = () => {
        return this.getMainWidget().getText();
    };

    getFormStyle = () => {
        return this.getSidebar().getFormStyle();
    };

    getInputStyle = () => {
        return this.getSidebar().getInputStyle();
    };

    getWidgetKey = () => {
        return this.getMainWidget().getWidgetKey();
    };


    _BlockTitle = ({ children }: any) => {
        return (
            <div
                style={{
                    marginTop: 2,
                    marginBottom: 2,
                    width: "100%",
                    display: "inline-flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                {children}
            </div>
        );
    };


    _HorizontalLine = () => {
        return <div>&nbsp;</div>;
    };

    _BlockBody = ({ children }: any) => {
        return (
            <div
                style={{
                    display: "inline-flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    marginTop: 2,
                    marginBottom: 2,
                    width: "100%",
                }}
            >
                {" "}
                {children}
            </div>
        );
    };
}
