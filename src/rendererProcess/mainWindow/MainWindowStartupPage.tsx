import * as React from "react";
import * as GlobalMethods from "../global/GlobalMethods";
import { Profile } from "../../mainProcess/profile/Profile";
import { GlobalVariables } from "./GlobalVariables";
import { ElementDropDownMenu } from "../helperWidgets/SharedElements/DropDownMenu";

import { MainWindowClient } from "../../mainProcess/windows/MainWindow/MainWindowClient";

export class MainWindowStartupPage {
    private _mainWindowClient: MainWindowClient;

    constructor(mainWindowClient: MainWindowClient) {
        this._mainWindowClient = mainWindowClient;
    }

    // ------------------- setter and getter ------------------

    getMainWindowClient = () => {
        return this._mainWindowClient;
    };

    // ------------------------ main element --------------------------------

    // public element
    private _Element = ({ }: any) => {
        const [, updateState] = React.useState({});
        const forceUpdate = React.useCallback(() => updateState({}), []);

        const moveProfileUp = (name: string) => {
            const profiles = this.getMainWindowClient().getProfiles();
            const oldIndex = Object.keys(profiles).indexOf(name);
            // not exist or already the first one
            if (oldIndex < 1) {
                return;
            }
            const newIndex = oldIndex - 1;
            const propertyValue = profiles[name];
            delete profiles[name];
            GlobalMethods.insertToObject(name, propertyValue, profiles, newIndex);
            // save to file
            saveAndReturn();
            forceUpdate();
        };

        const moveProfileDown = (name: string) => {
            const profiles = this.getMainWindowClient().getProfiles();
            const oldIndex = Object.keys(profiles).indexOf(name);
            if (oldIndex === Object.keys(profiles).length - 1 || oldIndex < 0) {
                return;
            }
            const newIndex = oldIndex + 1;
            const propertyValue = profiles[name];
            delete profiles[name];
            GlobalMethods.insertToObject(name, propertyValue, profiles, newIndex);
            saveAndReturn();
            forceUpdate();
        };

        const cloneProfile = (name: string) => {
            const profiles = this.getMainWindowClient().getProfiles();
            let newName = `${name}-1`;
            let propertyValue = Profile.generateDefaultProfile();


            if (name === "") {
                newName = "Untitled-1";
            }

            if (profiles[name] !== undefined) {
                propertyValue = JSON.parse(JSON.stringify(profiles[name]));
            }

            while (Object.keys(profiles).includes(newName)) {
                newName = `${newName}-1`;
            }

            const newIndex = Object.keys(profiles).length;

            GlobalMethods.insertToObject(newName, propertyValue, profiles, newIndex);
            saveAndReturn();
            forceUpdate();
        };


        const renameProfile = (oldName: string, newName: string) => {
            this.renameObjProperty(oldName, newName, this.getMainWindowClient().getProfiles());
            saveAndReturn();
            forceUpdate();
        };


        const createSshProfile = () => {
            let name = "";
            const profiles = this.getMainWindowClient().getProfiles();
            let newName = `${name}-1`;
            // let propertyValue = GlobalMethods.generateDefaultProfile();
            let propertyValue = Profile.generateDefaultSshProfile();


            if (name === "") {
                newName = "Untitled-1";
            }

            if (profiles[name] !== undefined) {
                propertyValue = JSON.parse(JSON.stringify(profiles[name]));
            }

            while (Object.keys(profiles).includes(newName)) {
                newName = `${newName}-1`;
            }

            const newIndex = Object.keys(profiles).length;
            console.log("property value", JSON.stringify(propertyValue))
            GlobalMethods.insertToObject(newName, propertyValue, profiles, newIndex);
            saveAndReturn();
            forceUpdate();
        };

        const saveAndReturn = () => {
            const profiles = this.getMainWindowClient().getProfiles();
            // send this._profiles back to main process which saves it to hard drive
            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("save-profiles", profiles);
        };

        return (
            <div
                style={{
                    position: "relative",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    fontFamily: GlobalVariables.defaultFontFamily,
                    fontSize: GlobalVariables.defaultFontSize,
                    fontStyle: GlobalVariables.defaultFontStyle,
                    fontWeight: GlobalVariables.defaultFontWeight,
                }}
                onClick={
                    () => {
                        // hide all drop down menus
                        const dropdownMenuDivs = document.querySelectorAll("[id=dropdown-menu]");
                        for (let dropdownMenuDiv of dropdownMenuDivs) {
                            if (dropdownMenuDiv !== null) {
                                (dropdownMenuDiv as HTMLElement).style["display"] = "none";
                            }
                        }
                    }
                }
            >
                <this._Background />
                <this._TdmLogoElement />
                <this._Title />
                <this._Introduction />
                {/* <StyledProfilesContainer> */}
                <div
                    style={{
                        display: "inline-flex",
                        flexDirection: "row",
                        justifyContent: "center",
                        flexWrap: "wrap",
                        paddingLeft: "10%",
                        paddingRight: "10%",
                    }}
                >

                    {
                        Object.keys(this.getMainWindowClient().getProfiles()).map((profileName, index) => {
                            return (
                                <this._ProfileElement
                                    key={profileName}
                                    profileName={profileName}
                                    index={index}
                                    moveProfileUp={moveProfileUp}
                                    moveProfileDown={moveProfileDown}
                                    cloneProfile={cloneProfile}
                                    renameProfile={renameProfile}
                                />
                            );
                        })
                    }
                    {
                        (this.getMainWindowClient().getMainProcessMode() === "desktop" || this.getMainWindowClient().getMainProcessMode() === "ssh-client") ?
                            <this._ProfileElement
                                profileName={"+"}
                                index={Object.keys(this.getMainWindowClient().getProfiles()).length}
                                isNewProfileElement={true}
                                createSshProfile={createSshProfile}
                                onClick={() => {
                                    cloneProfile("");
                                }}
                            /> : null
                    }
                </div>
                {/* </StyledProfilesContainer > */}
            </div >
        );
    };

    getElement = (): JSX.Element => {
        return <this._Element></this._Element>;
    };

    // ------------------ prompt for errored password --------------

    // ----------------------- background --------------------------

    private _BackgroundElementContainer = ({ fileName, top, left }: any) => {
        return (
            <div
                style={{
                    position: "absolute",
                    width: "70",
                    height: "70",
                    top: `${top}`,
                    left: `${left}`,
                    overflow: "visible",
                }}
            >
                <img src={fileName}></img>
            </div>
        );
    };

    private _Background = () => {
        return (
            <div
                style={{
                    position: "absolute",
                    zIndex: -100,
                    width: "100%",
                    height: "100%",
                    overflow: "visible",
                }}
            >
                <this._BackgroundElementContainer
                    top={20}
                    left={10}
                    fileName={`../../resources/webpages/atom.svg`}
                ></this._BackgroundElementContainer>

                <this._BackgroundElementContainer
                    top={30}
                    left={90}
                    fileName={`../../resources/webpages/star.svg`}
                ></this._BackgroundElementContainer>

                <this._BackgroundElementContainer
                    top={140}
                    left={0}
                    fileName={`../../resources/webpages/dna.svg`}
                ></this._BackgroundElementContainer>

                <this._BackgroundElementContainer
                    top={100}
                    left={40}
                    fileName={`../../resources/webpages/chemistry.svg`}
                ></this._BackgroundElementContainer>
            </div>
        );
    };

    // ----------- logo, title, and description elements --------------------

    private _TdmLogoElement = () => {
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "20%",
                    userSelect: "none",
                }}
            >
                <img src={`../../resources/webpages/tdm-logo.svg`} width="40px" height="40px"></img>
            </div>
        );
    };
    private _Title = () => {
        return <div
            style={{
                color: "#2c2c2c",
                fontSize: 25,
                fontWeight: "normal",
                userSelect: "none",
                marginBottom: 15,
            }}
        >Choose a TDM profile</div>;
    };

    private _Introduction = () => {
        return (
            <div
                style={{
                    // userSelect: "none",
                    marginLeft: "25%",
                    marginRight: "25%",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    flexDirection: "column",
                    fontSize: 15,
                }}
            >
                <div>
                    With TDM Profiles{" "}
                    <span
                        style={{
                            textDecoration: "underline dotted",
                        }}
                    >
                        <this._ProfilesActions />
                    </span>
                    , you can monitor and control EPICS channels in a self-contained consistent environment. Please choose a profile or create a
                    new one. Below are the profiles in file
                </div>
                <this._ProfilesFileName />
            </div>
        );
    };

    private _ProfilesActions = () => {
        if ((this.getMainWindowClient().getMainProcessMode() === "desktop") || this.getMainWindowClient().getMainProcessMode() === "ssh-client") {
            return (
                <ElementDropDownMenu
                    callbacks={{
                        "Open profiles file": () => this.getMainWindowClient().getIpcManager().sendFromRendererProcess("open-profiles"),
                        "Save profiles as": () => {
                            this.getMainWindowClient().getIpcManager().sendFromRendererProcess("save-profiles-as", this.getMainWindowClient().getProfiles())
                        },
                    }}
                    fontSize={15}
                >
                </ElementDropDownMenu>
            );
        } else {
            return <>
                TDM profiles
            </>
        }
    };

    private _ProfilesFileName = () => {
        return (
            <p
                style={{
                    marginTop: 0,
                }}
            >
                {this._mainWindowClient.getProfilesFileName() === "" ? (
                    <>
                        <div style={{ color: "red" }}>
                            Warning: current profiles are not saved on hard drive! Please click{" "}
                            <span
                                onMouseDown={(event: any) => {
                                    event.preventDefault();
                                    this.getMainWindowClient()
                                        .getIpcManager()
                                        .sendFromRendererProcess("save-profiles-as", this.getMainWindowClient().getProfiles());
                                }}
                            >
                                here
                            </span>{" "}
                            to save it.
                        </div>
                    </>
                ) : (
                    this.getMainWindowClient().getProfilesFileName()
                )}
            </p>
        );
    };

    // --------------------- profile block element -------------------------

    private _ProfileElement = ({ profileName, onClick, isNewProfileElement, moveProfileUp, createSshProfile, moveProfileDown, cloneProfile, renameProfile }: any) => {
        let showMoreActionElement = false;
        if (typeof isNewProfileElement === "undefined") {
            showMoreActionElement = true;
        } else if (isNewProfileElement === true) {
            showMoreActionElement = true;
        }

        const handleClick = (event: any) => {
            if (this.getMainWindowClient().getMainProcessMode() === "desktop" || this.getMainWindowClient().getMainProcessMode() === "ssh-client") {
                // tell the main process to create the corresponding EPICS CA context
                // after that, the main process sends back the `after-profile-selected` event
                this.getMainWindowClient().getIpcManager().sendFromRendererProcess("profile-selected", profileName);
            }
            // web-version
            // in the desktop version, the above "profile-selected" event creates the display windows (BrowserWindow) 
            // from main process. In web version, we cannot create a new web browser tab/window from server side.
            // Basically we ask for the ipcServerPort and displayWindowId from web server.
            else {
                const currentSite = window.location.href;
                fetch(`${currentSite}command`, {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        command: "profile-selected",
                        data: profileName
                    })
                }).then((response: any) => {
                    // decode string
                    return response.json()
                }).then(data => {
                    const ipcServerPort = data["ipcServerPort"];
                    const displayWindowId = data["displayWindowId"];
                    window.open(`${currentSite}DisplayWindow.html?ipcServerPort=${ipcServerPort}&displayWindowId=${displayWindowId}`)
                })
            }
        };

        const handleDrop = (event: any) => {
            if (isNewProfileElement) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            if (this.getMainWindowClient().getSelectedProfileName() === "") {
                // if no profile is selected, let the profile button handle the event
                const tdlFileNames: string[] = [];
                for (const file of event.dataTransfer.files) {
                    // full name
                    const tdlFileName = file.path;
                    tdlFileNames.push(tdlFileName);
                }
                this.getMainWindowClient().getIpcManager().sendFromRendererProcess("profile-selected", profileName,
                    {
                        macros: [],
                        settings: "",
                        profile: profileName,
                        alsoOpenDefaults: false,
                        fileNames: tdlFileNames,
                        attach: -1,
                        cwd: "",
                        mainProcessMode: "desktop", // | "web"; // "ssh-server" or "ssh-client" mode process can only be created inside the program
                        httpServerPort: 3000,

                    },
                );
            } else {
                // profile is selected, let document handle this
            }
        }

        return (
            <this._ElementProfileDiv handleDrop={handleDrop}>
                {/* <StyledProfileBlockDiv onClick={onClick ? onClick : handleClick}>{profileName}</StyledProfileBlockDiv> */}
                <this._ElementProfileBlockDiv onClick={onClick ? onClick : handleClick} profileName={profileName}></this._ElementProfileBlockDiv>
                {isNewProfileElement ? <>
                    <ElementDropDownMenu
                        callbacks={{
                            "Add SSH Profile ": () => {
                                createSshProfile();
                            },
                        }}
                    >
                    </ElementDropDownMenu >
                </> : (this.getMainWindowClient().getMainProcessMode() === "desktop" || this.getMainWindowClient().getMainProcessMode() === "ssh-client") ? (
                    <this._MoreActionElement
                        profileName={profileName}
                        moveProfileUp={moveProfileUp}
                        moveProfileDown={moveProfileDown}
                        cloneProfile={cloneProfile}
                        renameProfile={renameProfile}
                    />
                ) : null}
            </this._ElementProfileDiv>
        );
    };

    _ElementProfileDiv = ({ children, handleDrop }: any) => {
        const elementRef = React.useRef<any>(null);
        return (
            <div
                ref={elementRef}
                style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    // fontFamily: "Arial, Helvetica, sans-"serif",
                    width: "120px",
                    height: "120px",
                    borderRadius: "8px",
                    borderColor: "grey",
                    borderWidth: "2px",
                    borderStyle: "none",
                    margin: "10px",
                    boxShadow: "0px 0px 0px 0px white",
                    userSelect: "none",
                    color: "rgb(64, 64, 64)",
                    fontSize: "13px",
                    alignItems: "flex-end",
                    justifyContent: "flex-start",
                    backgroundColor: "rgb(217, 217, 217)",
                }}
                onMouseEnter={() => {
                    if (elementRef.current !== null) {
                        elementRef.current.style["backgroundColor"] = "lightblue";
                        elementRef.current.style["cursor"] = "pointer";
                    }
                }}
                onMouseLeave={() => {
                    if (elementRef.current !== null) {
                        elementRef.current.style["backgroundColor"] = "rgb(217, 217, 217)";
                        elementRef.current.style["cursor"] = "default";
                    }
                }}
                onDrop={handleDrop}
            >
                {children}
            </div>
        )
    }

    _ElementProfileBlockDiv = ({ profileName, onClick }: any) => {
        return (
            <div style={{
                position: "absolute",
                display: "flex",
                width: "100%",
                height: "100%",
                fontSize: "13px",
                textAlign: "center",
                overflowY: "hidden",
                alignItems: "center",
                justifyContent: "center",
            }}
                onClick={onClick}
            >
                {profileName}
            </div>
        )
    }

    private _MoreActionElement = ({ profileName, moveProfileUp, moveProfileDown, cloneProfile }: any) => {
        // const navigate = useNavigate();
        return (
            <ElementDropDownMenu
                callbacks={{
                    Edit: () => {
                        this.getMainWindowClient().setStatus("edit");
                        this.getMainWindowClient().setEditingProfileName(profileName);
                        this.getMainWindowClient().forceUpdate({});
                    },
                    "Move Up": () => {
                        moveProfileUp(profileName)
                    },
                    "Move Down": () => {
                        moveProfileDown(profileName);
                    },
                    "Clone": () => {
                        cloneProfile(profileName)
                    }

                }}
            >
            </ElementDropDownMenu >
        )
    };


    // --------------------- startup page --------------------------

    renameObjProperty = (oldName: string, newName: string, obj: Record<string, any>) => {
        const keys = Object.keys(obj);
        const index = keys.indexOf(oldName);
        if (index === -1) {
            return;
        }
        const value = obj[oldName];
        delete obj[oldName];
        GlobalMethods.insertToObject(newName, value, obj, index);
    };

}
