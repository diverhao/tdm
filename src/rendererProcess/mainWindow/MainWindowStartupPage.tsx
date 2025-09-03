import * as React from "react";
import * as GlobalMethods from "../global/GlobalMethods";
import { Profile } from "../../mainProcess/profile/Profile";
import { GlobalVariables } from "./GlobalVariables";
import { ElementDropDownMenu } from "../helperWidgets/SharedElements/DropDownMenu";
import { Log } from "../../mainProcess/log/Log";
import { SidebarLargeInput } from "../widgets/BaseWidget/SidebarLargeInput";

import { MainWindowClient, mainWindowState } from "../../mainProcess/windows/MainWindow/MainWindowClient";


export class MainWindowStartupPage {
    private _mainWindowClient: MainWindowClient;
    forceUpdate: any = () => { }
    private _largeInput: SidebarLargeInput = new SidebarLargeInput();

    constructor(mainWindowClient: MainWindowClient) {
        this._mainWindowClient = mainWindowClient;
    }

    // ----------------------- methods -----------------------------

    /**
     * Save the profiles to hard drive.
     * 
     * If the profiles failed to be saved, only show warning message, do not revert the profile on this page.
     */
    private saveProfile = () => {
        const profiles = this.getMainWindowClient().getProfiles();
        Log.debug("Trying to save profiles to hard drive ...");
        this.getMainWindowClient().getIpcManager().sendFromRendererProcess("save-profiles", profiles);
    };

    /**
     * Move the profile up, save the profiles, and update the display.
     */
    private moveProfileUp = (name: string) => {
        const profiles = this.getMainWindowClient().getProfiles();
        const profileNames = Object.keys(profiles);
        const oldIndex = profileNames.indexOf(name);
        if (oldIndex < 1) {
            Log.error("Failed to move the profile up: it either does not exist or it is already the first profile.");
            return;
        }
        const newIndex = oldIndex - 1;
        const propertyValue = profiles[name];
        delete profiles[name];
        GlobalMethods.insertToObject(name, propertyValue, profiles, newIndex);
        this.saveProfile();
        this.forceUpdate();
    };

    /**
     * Move the profile down, save the profiles, and update the display.
     */
    private moveProfileDown = (name: string) => {
        const profiles = this.getMainWindowClient().getProfiles();
        const oldIndex = Object.keys(profiles).indexOf(name);
        if (oldIndex === Object.keys(profiles).length - 1 || oldIndex < 0) {
            Log.error("Failed to move the profile up: it either does not exist or it is already the last profile.");
            return;
        }
        const newIndex = oldIndex + 1;
        const propertyValue = profiles[name];
        delete profiles[name];
        GlobalMethods.insertToObject(name, propertyValue, profiles, newIndex);
        this.saveProfile();
        this.forceUpdate();
    };

    /**
     * Create a new blank profile, save the profile and update the display.
     * 
     * If name is an empty string, create a new blank profile with name Untitled-1.
     */
    private cloneProfile = (name: string) => {
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
        this.saveProfile();
        this.forceUpdate();
    };

    /**
     * Create a ssh profile, save the profiles, and update the display.
     * 
     * the ssh profile contains special entries.
     */
    private createSshProfile = () => {
        let name = "";
        const profiles = this.getMainWindowClient().getProfiles();
        let newName = `${name}-1`;
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
        GlobalMethods.insertToObject(newName, propertyValue, profiles, newIndex);
        this.saveProfile();
        this.forceUpdate();
    };


    // ------------------------ elements --------------------------------

    private _Element = ({ }: any) => {
        const [, updateState] = React.useState({});
        this.forceUpdate = () => { updateState({}) };
        const style = {
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
        } as React.CSSProperties;

        return (
            <div
                style={style}
            >
                <this._ElementBackground />
                <this._ElementTdmLogo />
                <this._ElementTitle />
                <this._ElementIntroduction />
                <this._ElementProfiles />
            </div >
        );
    };

    getElement = (): JSX.Element => {
        return <this._Element></this._Element>;
    };

    // ---------------------- child elements -----------------------------

    /**
     * profiles buttons and add-new-profile button
     */
    private _ElementProfiles = () => {
        const profiles = this.getMainWindowClient().getProfiles();
        const profilesNames = Object.keys(profiles);
        const style = {
            display: "inline-flex",
            flexDirection: "row",
            justifyContent: "center",
            flexWrap: "wrap",
            paddingLeft: "10%",
            paddingRight: "10%",
        } as React.CSSProperties;

        return (
            <div
                style={style}
            >
                {/* profiles buttons */}
                {
                    profilesNames.map((profileName, index) => {
                        if (profileName === "For All Profiles") {
                            return null;
                        } else {
                            return (
                                <this._ElementProfile
                                    key={`${profileName}-${index}`}
                                    profileName={profileName}
                                    index={index}
                                />
                            );
                        }
                    })
                }
                {/* add-new-profile button */}
                <this._ElementNewProfile />
            </div>
        )
    }

    /**
     * container for background pictures
     */
    private _ElementBackgroundContainer = ({ fileName, top, left }: any) => {
        const style = {
            position: "absolute",
            width: "70",
            height: "70",
            top: `${top}`,
            left: `${left}`,
            overflow: "visible",
        } as React.CSSProperties;

        return (
            <div
                style={style}
            >
                <img src={fileName}></img>
            </div>
        );
    };

    /**
     * background for this page
     */
    private _ElementBackground = () => {
        const style = {
            position: "absolute",
            zIndex: -100,
            width: "100%",
            height: "100%",
            overflow: "visible",
        } as React.CSSProperties;

        return (
            <div
                style={style}
            >
                <this._ElementBackgroundContainer
                    top={20}
                    left={10}
                    fileName={`../../resources/webpages/atom.svg`}
                ></this._ElementBackgroundContainer>

                <this._ElementBackgroundContainer
                    top={30}
                    left={90}
                    fileName={`../../resources/webpages/star.svg`}
                ></this._ElementBackgroundContainer>

                <this._ElementBackgroundContainer
                    top={140}
                    left={0}
                    fileName={`../../resources/webpages/dna.svg`}
                ></this._ElementBackgroundContainer>

                <this._ElementBackgroundContainer
                    top={100}
                    left={40}
                    fileName={`../../resources/webpages/chemistry.svg`}
                ></this._ElementBackgroundContainer>
            </div>
        );
    };

    /**
     * TDM logo on top of the window
     */
    private _ElementTdmLogo = () => {
        const style = {
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "20%",
            userSelect: "none",
        } as React.CSSProperties;

        return (
            <div
                style={style}
            >
                <img src={`../../resources/webpages/tdm-logo.svg`} width="40px" height="40px"></img>
            </div>
        );
    };

    /**
     * the "Choose a TDM profile" title on top
     */
    private _ElementTitle = () => {
        const style = {
            color: "#2c2c2c",
            fontSize: 25,
            fontWeight: "normal",
            userSelect: "none",
            marginBottom: 15,
        } as React.CSSProperties;

        return <div
            style={style}
        >Choose a TDM profile</div>;
    };

    /**
     * Brief introduction to TDM and the concept of profile
     */
    private _ElementIntroduction = () => {
        const logFileOkToUse = this.getLogFileFromProfiles() === this.getMainWindowClient().getLogFileName() && this.getMainWindowClient().getLogFileName().trim() !== "";
        const style = {
            marginLeft: "25%",
            marginRight: "25%",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            flexDirection: "column",
            fontSize: 15,
            marginBottom: 15,
        } as React.CSSProperties;

        return (
            <div
                style={style}
            >
                <div>
                    With TDM Profiles{" "}
                    <span
                        style={{
                            textDecoration: "underline dotted",
                        }}
                    >
                        <this._ElementProfilesActions />
                    </span>
                    , you can monitor and control EPICS channels in a self-contained consistent environment. Please choose a profile or create a
                    new one. Below are the profiles stored in
                </div>
                <this._ElementProfilesFileName />
                <div>
                    {
                        logFileOkToUse === true ?
                            `TDM is writing log to ${this.getLogFileFromProfiles()}.`
                            :
                            this.getLogFileFromProfiles().trim() === "" ?
                                `Log file is not set in setting file.`
                                :
                                `Log file is set as ${this.getLogFileFromProfiles()}, but it is not accessible. Please provide an absolute file name path that is writable.`
                    }
                    {" "}
                    Click {" "}
                    <span
                        style={{
                            cursor: "pointer",
                            textDecoration: "underline dotted",
                        }}
                        onMouseDown={() => {
                            this._largeInput.createElement(this.getLogFileFromProfiles(), (newValue: "string") => { }, "Log File Name", (newValue: string) => {
                                this.setLogFileToProfile(newValue);
                                this.getMainWindowClient().saveProfiles();
                                this.forceUpdate();
                            })
                        }}
                    >
                        here
                    </span> {" "}
                    to change it.
                </div>
            </div>
        );
    };

    getLogFileFromProfiles = () => {
        try {
            const profiles = this.getMainWindowClient().getProfiles();
            const logFileName = profiles["For All Profiles"]["Log"]["General Log File"]["value"];
            if (typeof logFileName === "string") {
                return logFileName;
            } else {
                return "";
            }
        } catch (e) {
            return "";
        }
    }

    setLogFileToProfile = (newName: string) => {
        try {
            const profiles = this.getMainWindowClient().getProfiles();
            profiles["For All Profiles"]["Log"]["General Log File"]["value"] = newName;
            console.log("==========XXX OKOKIK")
            return true;
        } catch (e) {
            console.log("==========XXX")
            return false;
        }

    }

    /**
     * Dropdown menu for actions applicable to the profile.
     */
    private _ElementProfilesActions = () => {
        const mainProcessMode = this.getMainWindowClient().getMainProcessMode();

        return (
            (mainProcessMode === "desktop" || mainProcessMode === "ssh-client") ?
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
                :
                <>
                    TDM profiles
                </>
        )
    };

    /**
     * the profile name in <_ElementIntroduction />
     */
    private _ElementProfilesFileName = () => {
        const profilesFileName = this.getMainWindowClient().getProfilesFileName();
        const style = {
            marginTop: 0
        } as React.CSSProperties;

        return (
            <p
                style={style}
            >
                {profilesFileName === "" ? (
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
                    profilesFileName
                )}
            </p>
        );
    };


    /**
     * the create-a-new-profile block
     */
    private _ElementNewProfile = () => {
        const mainProcessMode = this.getMainWindowClient().getMainProcessMode();
        return (
            (mainProcessMode === "desktop" || mainProcessMode === "ssh-client") ?
                <this._ElementProfileWrapper>
                    <this._ElementProfileBlock profileName={"+"}></this._ElementProfileBlock>
                    <ElementDropDownMenu
                        callbacks={{
                            "Add SSH Profile ": () => {
                                this.createSshProfile();
                            },
                        }}
                    >
                    </ElementDropDownMenu >
                </this._ElementProfileWrapper>
                : null
        )
    }

    /**
     * block for one profile 
     */
    private _ElementProfile = ({ profileName }: any) => {
        return (
            <this._ElementProfileWrapper profileName={profileName}>
                <this._ElementProfileBlock profileName={profileName} />
                <this._ElementMoreAction profileName={profileName} />
            </this._ElementProfileWrapper>
        );
    };

    /**
     * hold the appearance of the profile block
     */
    private _ElementProfileWrapper = ({ children }: any) => {
        const elementRef = React.useRef<any>(null);
        const style = {
            position: "relative",
            display: "flex",
            flexDirection: "column",
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
        } as React.CSSProperties;

        const handleMouseEnter = () => {
            if (elementRef.current !== null) {
                elementRef.current.style["backgroundColor"] = "lightblue";
                elementRef.current.style["cursor"] = "pointer";
            }
        };

        const handleMouseLeave = () => {
            if (elementRef.current !== null) {
                elementRef.current.style["backgroundColor"] = "rgb(217, 217, 217)";
                elementRef.current.style["cursor"] = "default";
            }
        };

        return (
            <div
                ref={elementRef}
                style={style}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {children}
            </div>
        )
    }

    /**
     * hold the functionalities of the profile block
     */
    private _ElementProfileBlock = ({ profileName }: any) => {

        const mainProcessMode = this.getMainWindowClient().getMainProcessMode();

        // when the user drags and drops tdl files to this particular profile element,
        // we select this profile and open these tdl files
        const handleDrop = React.useCallback((event: any) => {
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
                this.getMainWindowClient().getIpcManager().sendFromRendererProcess("profile-selected",
                    {
                        profileName: profileName,
                        args: {
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
                    }
                );
            } else {
                // profile is already selected, window knows using which profile to open the tdl files
            }
        }, [profileName])


        // memorize the function
        const handleClick = React.useCallback((event: any) => {
            // the create-a-new-profile block: create a new profile
            if (profileName === "+") {
                this.cloneProfile("");
                return;
            }

            if (mainProcessMode === "desktop" || mainProcessMode === "ssh-client") {
                Log.info("Selected profile", profileName);
                // tell the main process to create the corresponding EPICS CA context
                // after that, the main process sends back the `after-profile-selected` event
                this.getMainWindowClient().getIpcManager().sendFromRendererProcess("profile-selected", profileName);
            }
            // web-version
            // in the desktop version, the above "profile-selected" event creates the display windows (BrowserWindow) 
            // from main process. In web version, we cannot create a new web browser tab/window from server side.
            // Basically we ask for the ipcServerPort and displayWindowId from web server.
            else if (mainProcessMode === "web") {
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
                    // window.open(`${currentSite}DisplayWindow.html?ipcServerPort=${ipcServerPort}&displayWindowId=${displayWindowId}`)
                    window.open(`${currentSite}DisplayWindow.html?displayWindowId=${displayWindowId}`)
                })
            }
        }, [profileName, mainProcessMode]);

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
                onClick={handleClick}
                onDrop={handleDrop}
            >
                {profileName}
            </div>
        )
    }

    /**
     * Dropdown menu for actions of a profile block
     */
    private _ElementMoreAction = ({ profileName }: any) => {
        const mainProcessMode = this.getMainWindowClient().getMainProcessMode();
        const dropdownMenuCallbacks = {
            Edit: () => {
                this.getMainWindowClient().setState(mainWindowState.edit);
                this.getMainWindowClient().setEditingProfileName(profileName);
                this.getMainWindowClient().forceUpdate({});
            },
            "Move Up": () => {
                this.moveProfileUp(profileName)
            },
            "Move Down": () => {
                this.moveProfileDown(profileName);
            },
            "Clone": () => {
                this.cloneProfile(profileName)
            },
        };

        return (
            (mainProcessMode === "desktop" || mainProcessMode === "ssh-client") ?
                <ElementDropDownMenu callbacks={dropdownMenuCallbacks} /> : null
        )
    };


    // --------------------- methods --------------------------

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

    // ------------------- setter and getter ------------------

    getMainWindowClient = () => {
        return this._mainWindowClient;
    };
}
