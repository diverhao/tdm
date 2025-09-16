import * as React from "react";
import { g_widgets1 } from "../../global/GlobalVariables";
import { BaseWidget } from "../BaseWidget/BaseWidget";
import { type_rules_tdl } from "../BaseWidget/BaseWidgetRules";
import { MediaRules } from "./MediaRules";
import { MediaSidebar } from "./MediaSidebar";
import * as path from "path";
import { ErrorBoundary } from "../../helperWidgets/ErrorBoundary/ErrorBoundary";
import { g_flushWidgets } from "../../helperWidgets/Root/Root";
import {Log} from "../../../mainProcess/log/Log";

export type type_Media_tdl = {
    type: string;
    widgetKey: string;
    key: string;
    style: Record<string, any>;
    text: Record<string, any>;
    channelNames: string[];
    groupNames: string[];
    rules: type_rules_tdl;
};

export class Media extends BaseWidget {
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

    _rules: MediaRules;
    base64Content: string = "";
    mediaFileName: string = "";

    constructor(widgetTdl: type_Media_tdl) {
        super(widgetTdl);
        this.setReadWriteType("read");

        this.setStyle({ ...Media._defaultTdl.style, ...widgetTdl.style });
        this.setText({ ...Media._defaultTdl.text, ...widgetTdl.text });

        this._rules = new MediaRules(this, widgetTdl);

        // this._sidebar = new MediaSidebar(this);
    }

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
        this.setRulesStyle({});
        this.setRulesText({});
        const rulesValues = this.getRules()?.getValues();
        if (rulesValues !== undefined) {
            this.setRulesStyle(rulesValues["style"]);
            this.setRulesText(rulesValues["text"]);
        }
        this.setAllStyle({...this.getStyle(), ...this.getRulesStyle()});
        this.setAllText({...this.getText(), ...this.getRulesText()});

        // must do it for every widget
        g_widgets1.removeFromForceUpdateWidgets(this.getWidgetKey());
        this.renderChildWidgets = true;
        React.useEffect(() => {
            this.renderChildWidgets = false;
        });

        // React.useEffect(() => {this.resolveFileName()}, [])

        return (
            <ErrorBoundary style={this.getStyle()} widgetKey={this.getWidgetKey()}>
                <>
                    <this._ElementBody></this._ElementBody>
                    {this._showSidebar() ? this._sidebar?.getElement() : null}
                </>
            </ErrorBoundary>
        );
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
        return (
            // <div
            <div
                style={{
                    display: "inline-flex",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    userSelect: "none",
                    position: "absolute",
                    overflow: "visible",
                    whiteSpace: this.getAllText().wrapWord ? "normal" : "pre",
                    justifyContent: this.getAllText().horizontalAlign,
                    alignItems: this.getAllText().verticalAlign,
                    fontFamily: this.getAllStyle().fontFamily,
                    fontSize: this.getAllStyle().fontSize,
                    fontStyle: this.getAllStyle().fontStyle,
                    fontWeight: this.getAllStyle().fontWeight,
                    outline: this._getElementAreaRawOutlineStyle(),
                    backgroundColor: this.getAllText()["invisibleInOperation"] ? "rgba(0,0,0,0)" : this._getElementAreaRawBackgroundStyle(),
                }}
                // title={"tooltip"}
                onMouseDown={this._handleMouseDown}
                onDoubleClick={this._handleMouseDoubleClick}
            >
                {this._ElementMedia()}
            </div>
        );
    };

    calcPictureWidth = () => { };

    handleSelectAFile = (options: Record<string, any>, fileName: string) => {
        this.getSidebar()?.updateFromWidget(undefined, "select-a-file", fileName);
    };

    // picture, local or remote: <img />
    // pdf, local or remote: <object />
    // video, local file: <video />
    // video, remote file: <video />
    // video, remote stream: <iframe />

    _ElementMedia = () => {

        this.resolveFileName();

        const fileType = this.getMediaType(this.getAllText()["fileName"]);
        if (fileType === "picture") {
            return <this._ElementPicture></this._ElementPicture>;
        } else if (fileType === "pdf") {
            return <this._ElementPdf></this._ElementPdf>;
        } else if (fileType === "video-local-file") {
            return <this._ElementVideoLocalFile></this._ElementVideoLocalFile>;
        } else if (fileType === "video-remote-stream") {
            return <this._ElementVideoRemoteStream></this._ElementVideoRemoteStream>;
        } else {
            return (
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: "red",
                        opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : this.getAllText()["opacity"],
                    }}
                >
                    Error
                </div>
            );
        }
    };

    getMediaType = (fileName: string): "picture" | "pdf" | "video-local-file" | "video-remote-stream" | "NA" => {
        const pictureTypes = ["jpg", "jpeg", "bmp", "png", "svg", "gif"];
        const pdfTypes = ["pdf"];
        const localVideoFileTypes = ["mp4", "ogg", "webm", "mp3", "mov"];

        const fileNameArray = fileName.split(".");
        const fileType = fileNameArray[fileNameArray.length - 1].toLowerCase();

        if (pictureTypes.includes(fileType)) {
            return "picture";
        } else if (pdfTypes.includes(fileType)) {
            return "pdf";
        } else if (localVideoFileTypes.includes(fileType)) {
            return "video-local-file";
        } else {
            if (fileName.substring(0, 4) === "http") {
                return "video-remote-stream";
            } else {
                return "NA";
            }
        }
    };

    _ElementPicture = () => {
        return (
            <img
                src={g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode() === "ssh-client" || g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode() === "web" ?
                    this.base64Content : this.resolveFileName()}
                style={{
                    objectFit: this.getAllText()["stretchToFit"] ? "fill" : "contain",
                    opacity: this.getAllText()["invisibleInOperation"] === true && !g_widgets1.isEditing() ? 0 : this.getAllText()["opacity"],
                }}
                alt="..."
                width={this.getAllStyle()["width"]}
                height={this.getAllStyle()["height"]}
            ></img>
        );
    };

    isRemotePath = (path: string) => {
        if (path.startsWith("http://") || path.startsWith("https://")) {
            return true;
        } else {
            return false;
        }
    };

    resolveFileName = () => {
        const rawFileName = this.getAllText()["fileName"];

        // in web mode, when this.mediaFileName is different from this.getAllText["fileName"], we fetch the media file
        if ((g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode() === "web" && this.mediaFileName !== rawFileName) || (g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode() === "ssh-client" && this.mediaFileName !== rawFileName)) {
            // full image path
            let fullFileName = "";

            if (this.isRemotePath(rawFileName)) {
                this.mediaFileName = rawFileName;
                this.base64Content = rawFileName;
                return;
            }

            if (path.isAbsolute(rawFileName)) {
                fullFileName = rawFileName;
            } else {
                const tdlFileName = g_widgets1.getRoot().getDisplayWindowClient().getTdlFileName();
                if (!path.isAbsolute(tdlFileName)) {
                    Log.error("Error in resolving image file name");
                    this.base64Content = "";
                    return;
                }
                fullFileName = path.join(path.dirname(tdlFileName), rawFileName);
            }
            this.mediaFileName = rawFileName;

            if (this.getMediaType(this.mediaFileName) !== "picture" && this.getMediaType(this.mediaFileName) !== "pdf") {
                this.base64Content = "";
                g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
                g_widgets1.addToForceUpdateWidgets("GroupSelection2");
                g_flushWidgets();
                return;
            }

            if (g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode() === "web") {
                g_widgets1.getRoot().getDisplayWindowClient().getIpcManager().sendFromRendererProcess("get-media-content", {
                    fullFileName: fullFileName,
                    widgetKey: this.getWidgetKey(),
                    displayWindowId: g_widgets1.getRoot().getDisplayWindowClient().getWindowId(),
                })
                // g_widgets1
                //     .getRoot()
                //     .getDisplayWindowClient()
                //     .getIpcManager()
                //     .sendPostRequestCommand("media", { fullFileName: fullFileName })
                //     .then((response: any) => {
                //         // decode string
                //         return response.json();
                //     })
                //     .then((data) => {
                //         if (data["content"] !== "") {
                //             if (this.getMediaType(this.mediaFileName) === "picture") {
                //                 this.base64Content = `data:image/png;base64,${data["content"]}`;
                //             } else if (this.getMediaType(this.mediaFileName) === "pdf") {
                //                 this.base64Content = `data:application/pdf;base64, ${encodeURI(data["content"])}`;
                //             } else {
                //                 this.base64Content = "";
                //             }
                //         } else {
                //             this.base64Content = "";
                //         }
                //         g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
                //         g_widgets1.addToForceUpdateWidgets("GroupSelection2");
                //         g_flushWidgets();
                //     });
            } else if ((g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode() === "ssh-client")) {
                //todo: what is this? get-ssh-file does not exist on main process
                // Log.info("try to obtain file from ssh host")
                // g_widgets1.getRoot().getDisplayWindowClient().getIpcManager().sendFromRendererProcess("get-ssh-file", {
                //     displayWindowId: g_widgets1.getRoot().getDisplayWindowClient().getWindowId(),
                //     widgetKey: this.getWidgetKey(),
                //     fullFileName: fullFileName,
                // })
            }
        }
        // else if (g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode() === "ssh-client" && this.mediaFileName !== rawFileName) {

        //     let fullFileName = "";

        //     if (this.isRemotePath(rawFileName)) {
        //         this.mediaFileName = rawFileName;
        //         this.base64Content = rawFileName;
        //         return;
        //     }

        //     if (path.isAbsolute(rawFileName)) {
        //         fullFileName = rawFileName;
        //     } else {
        //         const tdlFileName = g_widgets1.getRoot().getDisplayWindowClient().getTdlFileName();
        //         if (!path.isAbsolute(tdlFileName)) {
        //             console.log("Error in resolving image file name");
        //             this.base64Content = "";
        //             return;
        //         }
        //         fullFileName = path.join(path.dirname(tdlFileName), rawFileName);
        //     }
        //     this.mediaFileName = rawFileName;

        //     if (this.getMediaType(this.mediaFileName) !== "picture" && this.getMediaType(this.mediaFileName) !== "pdf") {
        //         this.base64Content = "";
        //         g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
        //         g_widgets1.addToForceUpdateWidgets("GroupSelection2");
        //         g_flushWidgets();
        //         return;
        //     }
        //     // todo: should be kept?
        //     // image file contents, base64 format
        //     // if (this.getAllText()["fileContents"] !== "" && this.getAllText()["fileContents"] !== undefined) {
        //     //     return `${this.getAllText()["fileContents"]}`;
        //     // }

        //     // const rawFileName = this.getAllText()["fileName"];
        //     // let fullFileName = rawFileName;

        //     // if (this.isRemotePath(this.getAllText()["fileName"])) {
        //     //     // return rawFileName;
        //     //     fullFileName = rawFileName;
        //     // }

        //     // if (path.isAbsolute(rawFileName)) {
        //     //     // return rawFileName;
        //     //     fullFileName = rawFileName;
        //     // }

        //     // const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
        //     // // full name
        //     // const currentTdlFileFullName = displayWindowClient.getTdlFileName();
        //     // if (path.isAbsolute(currentTdlFileFullName)) {
        //     //     // return path.join(path.dirname(currentTdlFileFullName), rawFileName);
        //     //     fullFileName = path.join(path.dirname(currentTdlFileFullName), rawFileName);;
        //     // } else {
        //     //     const tdlFullFileName = g_widgets1.getRoot().getDisplayWindowClient().getTdlFileName();
        //     //     if (tdlFullFileName !== "") {
        //     //         const dirName = path.dirname(tdlFullFileName);
        //     //         // return path.join(dirName, rawFileName);
        //     //         fullFileName = path.join(dirName, rawFileName);

        //     //     } else {
        //     //         // we cannot determine the current file's path
        //     //         // return rawFileName;
        //     //         fullFileName = rawFileName;
        //     //     }
        //     // }

        //     // todo: read remote file
        //     console.log("try to obtain file from ssh host")
        //     g_widgets1.getRoot().getDisplayWindowClient().getIpcManager().sendFromRendererProcess("get-ssh-file", {
        //         displayWindowId: g_widgets1.getRoot().getDisplayWindowClient().getWindowId(),
        //         widgetKey: this.getWidgetKey(),
        //         fullFileName: fullFileName,
        //     })

        // }
        else { // "desktop" mode
            // image file contents, base64 format
            if (this.getAllText()["fileContents"] !== "" && this.getAllText()["fileContents"] !== undefined) {
                return `${this.getAllText()["fileContents"]}`;
            }

            const rawFileName = this.getAllText()["fileName"];

            if (this.isRemotePath(this.getAllText()["fileName"])) {
                return rawFileName;
            }

            if (path.isAbsolute(rawFileName)) {
                return rawFileName;
            }

            const displayWindowClient = g_widgets1.getRoot().getDisplayWindowClient();
            // full name
            const currentTdlFileFullName = displayWindowClient.getTdlFileName();
            if (path.isAbsolute(currentTdlFileFullName)) {
                return path.join(path.dirname(currentTdlFileFullName), rawFileName);
            } else {
                const tdlFullFileName = g_widgets1.getRoot().getDisplayWindowClient().getTdlFileName();
                if (tdlFullFileName !== "") {
                    const dirName = path.dirname(tdlFullFileName);
                    return path.join(dirName, rawFileName);
                } else {
                    // we cannot determine the current file's path
                    return rawFileName;
                }
            }
        }
    };

    updateFileContents = (contents: string) => {
        if (this.base64Content !== `data:image/png;base64,${contents}` && this.base64Content !== `data:application/pdf;base64, ${encodeURI(contents)}`) {
            if (this.getMediaType(this.getAllText()["fileName"]) === "picture") {
                this.base64Content = `data:image/png;base64,${contents}`;
            } else if (this.getMediaType(this.getAllText()["fileName"]) === "pdf") {
                this.base64Content = `data:application/pdf;base64, ${encodeURI(contents)}`;
            } else {
                this.base64Content = "";
            }
            g_widgets1.addToForceUpdateWidgets(this.getWidgetKey());
            g_widgets1.addToForceUpdateWidgets("GroupSelection2");
            g_flushWidgets();
        } else {
            Log.debug("image is the same, do not update");
        }
    }

    _ElementPdf = () => {
        // so that the mouse can control pdf
        this.setReadWriteType("write");
        return (
            <>
                {/* <object data={`${this.getAllText()["fileName"]}`} type="application/pdf" width="100%" height="100%"> */}
                <object
                    data={g_widgets1.getRoot().getDisplayWindowClient().getMainProcessMode() === "web" ? this.base64Content : this.resolveFileName()}
                    type="application/pdf"
                    width="100%"
                    height="100%"
                >
                    <p>Unable to display PDF file.</p>
                </object>
                {/* mask in editing mode */}
                {g_widgets1.isEditing() ? (
                    <div
                        style={{
                            width: g_widgets1.isEditing() ? "100%" : "0px",
                            height: g_widgets1.isEditing() ? "100%" : "0px",
                            // height: "100%",
                            position: "absolute",
                            top: 0,
                            left: 0,
                            backgroundColor: "rgba(0,0,0,0.5)",
                        }}
                    ></div>
                ) : null}
            </>
        );
    };

    // supports local .mp4, .ogg, .webm, .mp3, .mov
    // not supported: local .mkv, .avi, .wmv
    _ElementVideoLocalFile = () => {
        // so that the mouse can control video
        this.setReadWriteType("write");
        return (
            <video preload="none" width="100%" height="100%" controls>
                {/* <source src={this.getAllText()["fileName"]} type="video/mp4"></source> */}
                <source src={this.resolveFileName()} type="video/mp4"></source>
            </video>
        );
    };

    // not supported: .mov, .avi, mp4, ogg
    // _ElementVideoRemoteFile = () => {
    // 	return (
    // 		<video preload="none" width="100%" height="100%" controls>
    // 			<source src={this.getAllText()["fileName"]} type="video/mp4"></source>
    // 		</video>
    // 	);
    // };

    // supports: youtube,
    // todo more tests, particularly axis camera
    _ElementVideoRemoteStream = () => {
        return (
            <>
                <iframe
                    width="100%"
                    height="100%"
                    src={this.getAllText()["fileName"]}
                    // frameBorder="0"
                    // allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    // allowFullScreen
                    // title="Embedded video"
                    style={{
                        position: "absolute",
                    }}
                />
                {g_widgets1.isEditing() ? (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            position: "absolute",
                            top: 0,
                            left: 0,
                            backgroundColor: "rgba(0,0,0,0)",
                        }}
                    ></div>
                ) : null}
            </>
        );
    };

    // ------------------------- rectangle ------------------------------------

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

    _getChannelValue = () => {
        const value = this._getFirstChannelValue();
        if (value === undefined) {
            return "";
        } else {
            return value;
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

    static _defaultTdl: type_Media_tdl = {
        type: "Media",
        widgetKey: "", // "key" is a reserved keyword
        key: "",
        style: {
            // basics
            position: "absolute",
            display: "inline-flex",
            // dimensions
            left: 0,
            top: 0,
            width: 100,
            height: 100,
            backgroundColor: "rgba(0, 0, 0, 0)",
            transform: "rotate(0deg)",
            color: "rgba(0,0,0,1)",
            // border, it is different from the "alarmBorder" below
            borderStyle: "solid",
            borderWidth: 0,
            borderColor: "rgba(0, 0, 0, 1)",
            // shows when the widget is selected
            outlineStyle: "none",
            outlineWidth: 1,
            outlineColor: "black",
        },
        text: {
            // media file name, could be picture types, pdf, or video type
            fileName: "../../../mainProcess/resources/webpages/tdm-logo.svg",
            // opacity
            opacity: 1,
            // for picture
            stretchToFit: false,
            invisibleInOperation: false,
            fileContents: "",
            // actually "alarm outline"
            alarmBorder: true,
            alarmBackground: false,
            alarmLevel: "MINOR",
        },
        channelNames: [],
        groupNames: [],
        rules: [],
    };

    // not getDefaultTdl(), always generate a new key
    static generateDefaultTdl = (type: string): Record<string, any> => {
        // defines type, widgetKey, and key
        const result = super.generateDefaultTdl(type);
        result.style = JSON.parse(JSON.stringify(this._defaultTdl.style));
        result.text = JSON.parse(JSON.stringify(this._defaultTdl.text));
        result.channelNames = JSON.parse(JSON.stringify(this._defaultTdl.channelNames));
        result.groupNames = JSON.parse(JSON.stringify(this._defaultTdl.groupNames));
        return result;
    };

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
    createSidebar = () => {
        if (this._sidebar === undefined) {
            this._sidebar = new MediaSidebar(this);
        }
    };

    jobsAsOperatingModeBegins() {
        const fileType = this.getMediaType(this.getText()["fileName"]);
        if (fileType === "picture") {
            this.setReadWriteType("read");
        } else {
            this.setReadWriteType("write");
        }
        super.jobsAsEditingModeBegins();
    }

}
