import * as React from "react";
import { v4 as uuidv4, validate as uuidValidate } from "uuid";
import { GlobalVariables } from "./GlobalVariables";

import {
    ElementUpDownButtonOnSidebar,
    ElementProfileBlockNameInput,
    ElementArrayPropertyItem,
    ElementArrayPropertyItemRight,
} from "./MainWindowStyledComponents";
import { MainWindowClient } from "../../mainProcess/windows/MainWindow/MainWindowClient";
import { ElementDropDownMenu } from "../helperWidgets/SharedElements/DropDownMenu";
import { ElementRectangleButton } from "../helperWidgets/SharedElements/RectangleButton";
import { Log } from "../global/Log";
import { Profile } from "../../mainProcess/profile/Profile";

/**
 * Represents the profile editor. This editor edits one profile.  <br>
 *
 * It creates a local copy of profile JSON object. This object is updated internally. The upper-level
 * profiles object is updated only when we try to save the changes.
 *
 * Structure of the profiles object: profiles -- profile -- category -- property -- item (for array value) <br>
 */
export class MainWindowProfileEditPage {
    private _mainWindowClient: MainWindowClient;

    private _origProfileName: string = "";
    private _selectedCategoryName: string = "";
    private _localProfile: Record<string, any> = { undefined: "I am not defined yet" };

    private _forceUpdateWholePage: any;

    constructor(mainWindowClient: MainWindowClient) {
        this._mainWindowClient = mainWindowClient;
    }

    // ------------------------- helper functions ---------------------

    insertToObject = (propertyName: string, propertyValue: any, obj: Record<string, any>, index: number) => {
        // save keys and values
        const keys = Object.keys(obj);
        const values = Object.values(obj);
        // empty the object
        for (let key of keys) {
            delete obj[key];
        }
        // insert new key and value
        keys.splice(index, 0, propertyName);
        values.splice(index, 0, propertyValue);
        // refill the object
        for (let ii = 0; ii < keys.length; ii++) {
            const key = keys[ii];
            const value = values[ii];
            obj[key] = value;
        }
    };

    // ------------------------- main element ----------------------

    private _Element = ({ profileName }: any) => {
        // obtain inputs
        // const location = useLocation();
        // navigate to other pages
        // const navigate = useNavigate();
        // this._origProfileName = location.state.profileName;
        this._origProfileName = profileName;

        // the local copy is not initialized yet
        if (this.getLocalProfile()["undefined"] === "I am not defined yet") {
            const profiles = this.getMainWindowClient().getProfiles();
            this.setLocalProfile(JSON.parse(JSON.stringify(profiles[this._origProfileName])) as Record<string, any>);
            // select the first category
            const firstCategoryName = Object.keys(this.getLocalProfile())[0];
            if (firstCategoryName !== undefined) {
                this.setSelectedCategoryName(firstCategoryName);
            } else {
                this.setSelectedCategoryName("");
            }
        }

        const [localProfileName, setLocalProfileName] = React.useState(this._origProfileName);
        // const [deletingThisProfile, setDeletingThisProfile] = React.useState(false);

        const [, updateState] = React.useState({});
        const forceUpdate = () => updateState({});
        this._forceUpdateWholePage = forceUpdate;

        const saveAndReturn = () => {
            // update profiles at MainWindowClient
            const profiles = this.getMainWindowClient().getProfiles();

            // if profile name is not changed
            if (this.getOrigProfileName() === localProfileName) {
                profiles[localProfileName] = JSON.parse(JSON.stringify(this.getLocalProfile()));
            }
            // if changed
            else {
                // check duplicate
                const profileNames = Object.keys(profiles);
                const profileIndex = profileNames.indexOf(this.getOrigProfileName());
                profileNames.splice(profileIndex, 1);
                if (profileNames.includes(localProfileName)) {
                    // this.getMainWindowClient()
                    //     .getIpcManager()
                    //     .sendFromRendererProcess(
                    //         "show-message-box",
                    //         this.getMainWindowClient().getWindowId(),
                    //         `New profile name ${localProfileName} conflicts with an existing profile name.`
                    //     );
                    const ipcManager = this.getMainWindowClient().getIpcManager();
                    ipcManager.handleDialogShowMessageBox(undefined, {
                        // command: string | undefined,
                        messageType: "error", // | "warning" | "info", // symbol
                        humanReadableMessages: [`New profile name ${localProfileName} conflicts with an existing profile name.`], // each string has a new line
                        rawMessages: [], // string[], // computer generated messages
                        // buttons: type_DialogMessageBoxButton[] | undefined,
                        // attachment: any,

                    })

                    return;
                }

                this.renameObjProperty(this.getOrigProfileName(), localProfileName, profiles);
                profiles[localProfileName] = JSON.parse(JSON.stringify(this.getLocalProfile()));
            }

            // send this._profiles back to main process which saves it to hard drive
            this.getMainWindowClient().saveProfiles();

            // go to /
            // navigate("/");
            this.getMainWindowClient().setStatus("start");
            this.getMainWindowClient().forceUpdate({})
        };

        const disgardChanges = async () => {
            // reset local data
            this.setSelectedCategoryName("");
            this.setLocalProfile({ undefined: "I am not defined yet" });
            this.getMainWindowClient().setStatus("start");
            this.getMainWindowClient().forceUpdate({})
        };

        // const toDeleteThisProfile = () => {
        // 	setDeletingThisProfile(true);
        // };

        const doDeleteThisProfile = () => {
            const profiles = this.getMainWindowClient().getProfiles();
            delete profiles[this.getOrigProfileName()];
            this.getMainWindowClient().saveProfiles();
            this.getMainWindowClient().setStatus("start");
            this.getMainWindowClient().forceUpdate({})
            // navigate("/");
        };

        // const cancelDeleteThisProfile = () => {
        // 	setDeletingThisProfile(false);
        // };

        const selectCategory = (event: any, categoryName: string) => {
            if (event) {
                event.target.style.fontWeight = "bold";
            }
            this.setSelectedCategoryName(categoryName);
            forceUpdate();
        };

        const moveCategoryUp = (name: string) => {
            const oldIndex = Object.keys(this.getLocalProfile()).indexOf(name);
            if (oldIndex < 1) {
                return;
            }
            const newIndex = oldIndex - 1;
            const propertyValue = this.getLocalProfile()[name];
            delete this.getLocalProfile()[name];
            this.insertToObject(name, propertyValue, this.getLocalProfile(), newIndex);
            forceUpdate();
        };

        const moveCategoryDown = (categoryName: string) => {
            const localProfile = this.getLocalProfile();
            const oldIndex = Object.keys(localProfile).indexOf(categoryName);
            if (oldIndex === Object.keys(localProfile).length - 1 || oldIndex < 0) {
                Log.error("Error in move category down");
                return;
            }
            const newIndex = oldIndex + 1;
            const propertyValue = localProfile[categoryName];
            delete localProfile[categoryName];
            this.insertToObject(categoryName, propertyValue, localProfile, newIndex);
            forceUpdate();
        };

        const changeLocalProfileName = (event: any) => {
            event.preventDefault();
            setLocalProfileName(event.target.value);
        };

        const generateEmptyCategory = (): Record<string, any> => {
            let result: Record<string, any> = {};
            result[`DESCRIPTION_${uuidv4()}`] = "Description of the category.";
            return result;
        };

        const addCategory = () => {
            let newName = "New Category";
            while (Object.keys(this.getLocalProfile()).includes(newName)) {
                newName = `${newName}-1`;
            }
            this.getLocalProfile()[newName] = JSON.parse(JSON.stringify(generateEmptyCategory()));
            selectCategory(undefined, newName);
            forceUpdate();
        };

        const addSshCategory = () => {
            const sshCategory = Profile.generateDefaultSshCategory();
            let newName = Object.keys(sshCategory)[0];
            while (Object.keys(this.getLocalProfile()).includes(newName)) {
                Log.error("There is already a ssh category");
                // todo: show error message
                return;
            }
            this.getLocalProfile()[newName] = Object.values(sshCategory)[0];
            selectCategory(undefined, newName);
            forceUpdate();
        }

        const toDeleteThisProfile = () => {
            // bring up prompt
            // this.getMainWindowClient().getPrompt().createElement("delete-profile", { doDeleteThisProfile: doDeleteThisProfile, profileName: profileName });
            const ipcManager = this.getMainWindowClient().getIpcManager()
            const prompt = this.getMainWindowClient().getPrompt();
            ipcManager.handleDialogShowMessageBox(undefined, {
                // command?: string | undefined,
                messageType: "warning", // | "info", // symbol
                humanReadableMessages: [`This action will permanently delete profile ${profileName}. It cannot be undone`, `Are you ABSOLUTELY sure to delete this it?`], // each string has a new line
                rawMessages: [], // computer generated messages
                buttons: [
                    {
                        text: "Delete",
                        handleClick: () => {
                            doDeleteThisProfile();
                            prompt.startEventListeners();
                            prompt.removeElement();
                        }
                    },
                    {
                        text: "Do Not Delete",
                        handleClick: () => {
                            prompt.startEventListeners();
                            prompt.removeElement();
                        }
                    }
                ],
            })
        }

        return (
            <>
                <div
                    style={{
                        position: "relative",
                        // flex extends over the whole screen
                        display: "flex",
                        flexFlow: "column",
                        fontFamily: GlobalVariables.defaultFontFamily,
                        fontSize: GlobalVariables.defaultFontSize,
                        fontStyle: GlobalVariables.defaultFontStyle,
                        fontWeight: GlobalVariables.defaultFontWeight,
                        height: "100%",
                        overflow: "hidden",
                    }}
                    onClick={
                        () => {
                            const dropdownMenuDivs = document.querySelectorAll("[id=dropdown-menu]");
                            for (let dropdownMenuDiv of dropdownMenuDivs) {
                                if (dropdownMenuDiv !== null) {
                                    (dropdownMenuDiv as HTMLElement).style["display"] = "none";
                                }
                            }
                        }
                    }
                >
                    {/* title */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "12px",
                            borderBottom: "solid rgb(64,64,64) 1px",
                        }}
                    >
                        <div>
                            <ElementProfileBlockNameInput value={localProfileName} onChange={changeLocalProfileName}></ElementProfileBlockNameInput>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                flexDirection: "row",
                            }}
                        >
                            <ElementRectangleButton handleClick={disgardChanges}>Disgard changes</ElementRectangleButton>
                            &nbsp;&nbsp;
                            <ElementRectangleButton handleClick={saveAndReturn}>Save and return</ElementRectangleButton>
                            &nbsp;&nbsp;
                            <ElementRectangleButton
                                defaultBackgroundColor={"red"}
                                highlightBackgroundColor={"rgba(255,0,0,0.8)"}
                                handleClick={toDeleteThisProfile}>
                                Delete this profile
                            </ElementRectangleButton>
                        </div>
                    </div>

                    {/* body */}
                    <div
                        style={{
                            display: "inline-flex",
                            flexDirection: "row",
                            // flex: "1 1 auto", // ensures the viewport is filled up
                            // justifyContent: "space-between",
                            // alignItems: "flex-start",
                            // paddingTop: "5px",
                            paddingTop: "12px",
                            height: "100%",
                            // overflowY: "auto", // a local scrollbar
                            // userSelect: "none",
                            // backgroundColor: "rgba(255,0,0,0.5)",
                            overflow: "hidden",
                        }}
                    >
                        {/* sidebar */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                                maxWidth: "20%",
                                minWidth: "20%",
                                fontSize: "13px",
                                // overflow: "clip",
                                boxSizing: "border-box",
                                overflow: "clip",
                            }}
                        >
                            {Object.keys(this.getLocalProfile()).map((categoryName: string, index: number) => {
                                return (
                                    <this._ElementSidebarCategory
                                        categoryName={categoryName}
                                        index={index}
                                        selectCategory={selectCategory}
                                        moveCategoryUp={moveCategoryUp}
                                        moveCategoryDown={moveCategoryDown}
                                    >
                                    </this._ElementSidebarCategory>
                                );
                            })}

                            <div
                                style={{
                                    display: "inline-flex",
                                    flexDirection: "row",
                                    height: 30,
                                    width: "100%",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                }}
                            >
                                <div style={{
                                    display: "inline-flex",
                                    paddingLeft: 12,
                                    width: "100%",
                                }}>
                                    <ElementDropDownMenu
                                        callbacks={{
                                            "Add Empty Category": () => { addCategory() },
                                            // "Add SSH Category": () => { addSshCategory() },
                                        }}
                                    ></ElementDropDownMenu>

                                </div>

                            </div>

                        </div>

                        {/* contents */}
                        <this._Category></this._Category>
                    </div>
                </div >
            </>
        );
    };

    _ElementSidebarCategory = ({ categoryName, index, selectCategory, moveCategoryUp, moveCategoryDown }: any) => {
        const refCategory = React.useRef<any>(null);
        const refUpDownArrows = React.useRef<any>(null);
        return (
            <div
                ref={refCategory}
                style={{
                    display: "inline-flex",
                    flexDirection: "row",
                    height: 30,
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: categoryName === this.getSelectedCategoryName() ? "rgba(200, 200, 200, 0.5)" : "rgba(200, 200, 200, 0)",
                    borderLeft: `solid 2px ${categoryName === this.getSelectedCategoryName() ? "rgba(255, 0, 0, 1)" : "rgba(200, 200, 200, 0)"}`,
                }}
                onMouseEnter={() => {
                    if (refCategory.current !== null) {
                        refCategory.current.style["cursor"] = "pointer";
                        refCategory.current.style["backgroundColor"] = "rgba(200,200,200,0.5)";
                    }
                    if (refUpDownArrows.current !== null) {
                        refUpDownArrows.current.style["display"] = "inline-flex";
                    }
                }}
                onMouseLeave={() => {
                    if (refCategory.current !== null) {
                        refCategory.current.style["cursor"] = "default";
                        if (categoryName !== this.getSelectedCategoryName()) {
                            refCategory.current.style["backgroundColor"] = "rgba(200,200,200,0)";
                        }
                    }
                    if (refUpDownArrows.current !== null) {
                        refUpDownArrows.current.style["display"] = "none";
                    }
                }}
            >
                <div
                    style={{
                        display: "inline-flex",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontWeight: categoryName === this.getSelectedCategoryName() ? "bold" : "normal",
                        height: "100%",
                        width: "80%",
                        justifyContent: "flex-start",
                        alignItems: 'center',
                        // not paddingLeft
                        paddingLeft: "12px",
                        boxSizing: "border-box",
                    }}
                    onClick={(event: any) => {
                        selectCategory(event, categoryName);
                    }}
                >
                    {categoryName}
                </div>
                <div
                    ref={refUpDownArrows}
                    style={{
                        width: "20%",
                        display: "none",
                        flexDirection: "row",
                    }}
                >
                    <ElementUpDownButtonOnSidebar
                        additionalStyle={{
                            fontSize: 19,
                        }}
                        handleClick={(event: any) => {
                            event.stopPropagation();
                            moveCategoryUp(categoryName);
                        }}
                    >
                        &#8593;
                    </ElementUpDownButtonOnSidebar>
                    <ElementUpDownButtonOnSidebar
                        additionalStyle={{
                            fontSize: 19,
                        }}
                        handleClick={(event: any) => {
                            event.stopPropagation();
                            moveCategoryDown(categoryName);
                        }}
                    >
                        &#8595;
                    </ElementUpDownButtonOnSidebar>
                </div>
            </div>
        )
    }

    getElement = (profileName: string): JSX.Element => {
        return <this._Element profileName={profileName}></this._Element>;
    };

    // contents is a reference, modifying it would directly modify the localProfile.current
    private _Category = ({ }: any) => {
        if (this.getLocalProfile()[this.getSelectedCategoryName()] === undefined) {
            return (
                <div>
                    <h2>{`Category ${this.getSelectedCategoryName()} does not exist`}</h2>
                </div>
            );
        }
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    // minWidth: "80%",
                    paddingLeft: 10,
                    paddingBottom: 30,
                    borderLeft: "solid 1px rgb(190, 190, 190)",
                    boxSizing: "border-box",
                    overflow: "auto",
                }}
            >
                <this._CategoryTitle></this._CategoryTitle>
                {Object.keys(this.getLocalProfile()[this.getSelectedCategoryName()]).map((propertyName: string, index: number) => {
                    const category = this.getLocalProfile()[this.getSelectedCategoryName()];
                    if ((propertyName.split("_")[0] === "DESCRIPTION" && uuidValidate(propertyName.split("_")[1])) || category[propertyName] === "") {
                        return null;
                    } else {
                        // names "value" and "DESCRIPTION" are fixed
                        const propertyValue = category[propertyName]["value"];
                        const propertyDescription = category[propertyName]["DESCRIPTION"];
                        if (propertyValue === "") {
                            return null;
                        }
                        if (Array.isArray(propertyValue)) {
                            return (
                                <this._ArrayProperty
                                    key={`${propertyName}-${index}`}
                                    propertyName={propertyName}
                                    category={category}
                                ></this._ArrayProperty>
                            );
                        } else {
                            return (
                                <this._PrimitiveProperty
                                    key={`${propertyName}-${index}`}
                                    propertyName={propertyName}
                                    category={category}
                                ></this._PrimitiveProperty>
                            );
                        }
                    }
                })}
            </div>
        );
    };

    getSelectedCategoryDescription = () => {
        const categoryContents = this.getLocalProfile()[this.getSelectedCategoryName()];
        if (categoryContents === undefined) {
            return "";
        }
        for (let itemName of Object.keys(categoryContents)) {
            if (itemName.includes("DESCRIPTION_")) {
                const id = itemName.split("_")[1];
                if (uuidValidate(id)) {
                    return categoryContents[itemName];
                }
            }
        }
        return "";
    };

    setSelectedCategoryDescription = (newDescription: string) => {
        const categoryContents = this.getLocalProfile()[this.getSelectedCategoryName()];
        if (categoryContents === undefined) {
            return;
        }
        for (let itemName of Object.keys(categoryContents)) {
            if (itemName.includes("DESCRIPTION_")) {
                const id = itemName.split("_")[1];
                if (uuidValidate(id)) {
                    categoryContents[itemName] = newDescription;
                    return;
                }
            }
        }
    };

    private _CategoryTitle = ({ }: any) => {
        // const description = this.getCategoryDescription();
        const [editingMode, setEditingMode] = React.useState(false);
        const [localCategoryName, setLocalCategoryName] = React.useState(this.getSelectedCategoryName());
        const [localCategoryDescription, setLocalCategoryDescription] = React.useState(this.getSelectedCategoryDescription());

        // make sure localCategoryName is up to date
        React.useEffect(() => {
            setLocalCategoryName(this.getSelectedCategoryName());
            setLocalCategoryDescription(this.getSelectedCategoryDescription());
        }, [this.getSelectedCategoryName(), this.getSelectedCategoryDescription()]);

        const deleteCategory = () => {
            // highlight the next category
            const localProfile = this.getLocalProfile();
            const oldIndex = Object.keys(localProfile).indexOf(this.getSelectedCategoryName());
            let newIndex = oldIndex;
            if (oldIndex === -1) {
                Log.error("Error updating category title");
                return;
            }
            // if the old selected category is the last one, select the
            if (oldIndex === Object.keys(localProfile).length - 1) {
                newIndex = oldIndex - 1;
            }

            // delete the data
            delete this.getLocalProfile()[this.getSelectedCategoryName()];

            if (newIndex < 0) {
                this.setSelectedCategoryName("");
                Log.error("Error updating category title, there is no category");
            } else {
                this.setSelectedCategoryName(Object.keys(localProfile)[newIndex]);
            }

            this._forceUpdateWholePage();
        };

        const renameCategoryAndUpdateDescription = () => {
            // check duplicate
            const categoryNames = Object.keys(this.getLocalProfile());
            const categoryIndex = categoryNames.indexOf(this.getSelectedCategoryName());
            categoryNames.splice(categoryIndex, 1);
            if (categoryNames.includes(localCategoryName)) {
                // this.getMainWindowClient()
                //     .getIpcManager()
                //     .sendFromRendererProcess(
                //         "show-message-box",
                //         this.getMainWindowClient().getWindowId(),
                //         `${localCategoryName} conflicts with an existing category name.`
                //     );
                const ipcManager = this.getMainWindowClient().getIpcManager();
                ipcManager.handleDialogShowMessageBox(undefined, {
                    // command: string | undefined,
                    messageType: "error", // | "warning" | "info", // symbol
                    humanReadableMessages: [`${localCategoryName} conflicts with an existing category name.`], // each string has a new line
                    rawMessages: [], // string[], // computer generated messages
                    // buttons: type_DialogMessageBoxButton[] | undefined,
                    // attachment: any,
                })
                return;
            }

            this.renameObjProperty(this.getSelectedCategoryName(), localCategoryName, this.getLocalProfile());
            setEditingMode(false);
            this.setSelectedCategoryName(localCategoryName);
            this.setSelectedCategoryDescription(localCategoryDescription);
            this._forceUpdateWholePage();
        };

        const addPrimitive = () => {
            let name = "new-primitive";
            const category = this.getLocalProfile()[this.getSelectedCategoryName()];
            while (category[name] !== undefined) {
                name = `${name}-1`;
            }
            const value = "new-value";
            category[name] = { DESCRIPTION: `${name} description`, value: value };
            this._forceUpdateWholePage();
        };

        const addArray = () => {
            let name = "new-array";
            const category = this.getLocalProfile()[this.getSelectedCategoryName()];
            while (category[name] !== undefined) {
                name = `${name}-1`;
            }
            const value = ["new-value-0", "new-value-1"];
            category[name] = { DESCRIPTION: `${name} description`, value: value };
            this._forceUpdateWholePage();
        };

        if (editingMode === true) {
            return (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        marginBottom: 7,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            width: "100%",
                            justifyContent: "space-between",
                        }}
                    >
                        <input
                            style={{
                                fontSize: 25,
                                paddingLeft: 6,
                                paddingRight: 6,
                                paddingTop: 4,
                                paddingBottom: 4,
                                margin: 0,
                                outline: "none",
                                border: "1px solid rgb(190, 190, 190)",
                                width: "70%",
                                marginBottom: 3,
                            }}
                            value={localCategoryName}
                            onChange={(event: any) => {
                                event.preventDefault();
                                setLocalCategoryName(event.target.value);
                            }}
                        ></input>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <ElementRectangleButton
                                marginRight={12}
                                paddingTop={3}
                                paddingBottom={3}
                                paddingLeft={5}
                                paddingRight={5}
                                handleClick={renameCategoryAndUpdateDescription}
                            >
                                OK
                            </ElementRectangleButton>
                            <ElementRectangleButton
                                marginRight={5}
                                paddingTop={3}
                                paddingBottom={3}
                                paddingLeft={5}
                                paddingRight={5}
                                handleClick={(event: any) => {
                                    setLocalCategoryName(this.getSelectedCategoryName());
                                    setLocalCategoryDescription(this.getSelectedCategoryDescription());
                                    setEditingMode(false);
                                }}
                            >
                                Cancel
                            </ElementRectangleButton>
                        </div>
                    </div>
                    <div>
                        <input
                            style={{
                                fontSize: 13,
                                paddingLeft: 6,
                                paddingRight: 6,
                                paddingTop: 3,
                                paddingBottom: 3,
                                margin: 0,
                                outline: "none",
                                border: "1px solid rgb(190, 190, 190)",
                                width: "70%",
                            }}
                            value={localCategoryDescription}
                            onChange={(event: any) => {
                                event.preventDefault();
                                setLocalCategoryDescription(event.target.value);
                            }}
                        ></input>
                    </div>
                </div>
            );
        } else {
            return (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        marginBottom: 7,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            width: "100%",
                            justifyContent: "space-between",
                            marginBottom: 3,
                            paddingRight: 13,
                            boxSizing: "border-box",
                        }}
                    >
                        <div
                            style={{
                                fontSize: 25,
                                paddingLeft: 7,
                                paddingRight: 7,
                                paddingTop: 5,
                                paddingBottom: 5,
                            }}
                        >
                            {this.getSelectedCategoryName()}
                        </div>
                        <ElementDropDownMenu
                            callbacks={{
                                "Edit": () => { setEditingMode(true) },
                                "Delete": deleteCategory,
                                "Add primitive type data": addPrimitive,
                                "Add array type data": addArray,
                            }}
                        ></ElementDropDownMenu>
                    </div>
                    <div
                        style={{
                            color: "rgb(180, 180, 180)",
                            fontSize: 13,
                            width: "70%",
                            paddingLeft: 7,
                            paddingRight: 7,
                            paddingTop: 4,
                            paddingBottom: 4,
                        }}
                    >
                        {this.getSelectedCategoryDescription()} &nbsp;
                    </div>
                </div>
            );
        }
    };

    private _PrimitiveProperty = ({ propertyName, category }: any) => {
        const refElement = React.useRef<any>(null);
        return (
            <div
                ref={refElement}
                style={{
                    paddingTop: 8,
                    paddingBottom: 11,
                    paddingLeft: 13,
                    paddingRight: 13,
                }}
                onMouseEnter={() => {
                    if (refElement.current !== null) {
                        refElement.current.style["backgroundColor"] = "rgb(248, 248, 248, 1)";
                    }
                }}
                onMouseLeave={() => {
                    if (refElement.current !== null) {
                        refElement.current.style["backgroundColor"] = "rgb(248, 248, 248, 0)";
                    }
                }}
            >
                <this._PrimitivePropertyTitle propertyName={propertyName} category={category}></this._PrimitivePropertyTitle>
                <this._PrimitivePropertyValue propertyName={propertyName} category={category}></this._PrimitivePropertyValue>
            </div>
        );
    };
    private _ArrayProperty = ({ propertyName, category }: any) => {
        const refElement = React.useRef<any>(null);
        const propertyValue = category[propertyName];
        const addItem = () => {
            const stringArray = category[propertyName]["value"];
            stringArray.push("");
            this._forceUpdateWholePage();
        };
        return (
            <div
                ref={refElement}
                style={{
                    paddingTop: 8,
                    paddingBottom: 11,
                    paddingLeft: 13,
                    paddingRight: 13,
                }}
                onMouseEnter={() => {
                    if (refElement.current !== null) {
                        refElement.current.style["backgroundColor"] = "rgb(248, 248, 248, 1)";
                    }
                }}
                onMouseLeave={() => {
                    if (refElement.current !== null) {
                        refElement.current.style["backgroundColor"] = "rgb(248, 248, 248, 0)";
                    }
                }}
            >
                <this._ArrayPropertyTitle propertyName={propertyName} category={category}></this._ArrayPropertyTitle>
                <this._ArrayPropertyValue propertyName={propertyName} category={category}></this._ArrayPropertyValue>
            </div>
        );
    };

    private _PrimitivePropertyTitle = ({ propertyName, category }: any) => {
        const [editingMode, setEditingMode] = React.useState(false);
        const [localPropertyName, setLocalPropertyName] = React.useState(propertyName);
        const [localPropertyDescription, setLocalPropertyDescription] = React.useState(category[propertyName]["DESCRIPTION"]);

        const deleteProperty = () => {
            delete category[propertyName];
            this._forceUpdateWholePage();
        };

        const renamePropertyAndUpdateDescription = () => {
            // check duplicate
            const propertyNames = Object.keys(category);
            const propertyIndex = propertyNames.indexOf(propertyName);
            propertyNames.splice(propertyIndex, 1);
            if (propertyNames.includes(localPropertyName)) {
                // this.getMainWindowClient()
                //     .getIpcManager()
                //     .sendFromRendererProcess(
                //         "show-message-box",
                //         this.getMainWindowClient().getWindowId(),
                //         `${localPropertyName} conflicts with an existing property name.`
                //     );
                const ipcManager = this.getMainWindowClient().getIpcManager();
                ipcManager.handleDialogShowMessageBox(undefined, {
                    // command: string | undefined,
                    messageType: "error", // | "warning" | "info", // symbol
                    humanReadableMessages: [`${localPropertyName} conflicts with an existing property name.`], // each string has a new line
                    rawMessages: [], // string[], // computer generated messages
                    // buttons: type_DialogMessageBoxButton[] | undefined,
                    // attachment: any,

                })
                return;
            }

            // update description
            category[propertyName]["DESCRIPTION"] = localPropertyDescription;
            this.renameObjProperty(propertyName, localPropertyName, category);
            setEditingMode(false);
            this._forceUpdateWholePage();
        };

        const [textAreaHeight, setTextAreaHeight] = React.useState(20);

        const textInputRef = React.useRef(null);
        const moveUpProperty = () => {
            const index = Object.keys(category).indexOf(propertyName);
            if (index < 1) {
                return;
            }
            const origProperty = category[propertyName];
            delete category[propertyName];
            this.insertToObject(propertyName, origProperty, category, index - 1);
            this._forceUpdateWholePage();
        };
        const moveDownProperty = () => {
            const index = Object.keys(category).indexOf(propertyName);
            if (index < 0 || index >= Object.keys(category).length - 1) {
                return;
            }
            const origProperty = category[propertyName];
            delete category[propertyName];
            this.insertToObject(propertyName, origProperty, category, index + 1);
            this._forceUpdateWholePage();
        };

        if (editingMode) {
            return (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <input
                            style={{
                                fontSize: 13,
                                margin: 0,
                                outline: "none",
                                border: "solid 1px rgb(190, 190, 190)",
                                width: "70%",
                                fontWeight: "bold",
                                paddingLeft: 6,
                                paddingRight: 6,
                                paddingTop: 3,
                                paddingBottom: 3,
                            }}
                            value={localPropertyName}
                            onChange={(event: any) => {
                                event.preventDefault();
                                setLocalPropertyName(event.target.value);
                            }}
                        ></input>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <ElementRectangleButton
                                marginRight={12}
                                paddingTop={3}
                                paddingBottom={3}
                                paddingLeft={5}
                                paddingRight={5}
                                handleClick={(event: any) => {
                                    renamePropertyAndUpdateDescription();
                                }}
                            >
                                Save
                            </ElementRectangleButton>
                            <ElementRectangleButton
                                marginRight={5}
                                paddingTop={3}
                                paddingBottom={3}
                                paddingLeft={5}
                                paddingRight={5}
                                handleClick={(event: any) => {
                                    setLocalPropertyName(propertyName);
                                    setLocalPropertyDescription(category[propertyName]["DESCRIPTION"]);
                                    setEditingMode(false);
                                }}
                            >
                                Cancel
                            </ElementRectangleButton>
                        </div>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            color: "rgb(180, 180, 180)",
                            fontSize: 13,
                            marginTop: 2,
                        }}
                    >
                        <input
                            style={{
                                fontSize: 13,
                                margin: 0,
                                outline: "none",
                                border: "solid 1px rgb(190, 190, 190)",
                                width: "70%",
                                paddingLeft: 6,
                                paddingRight: 6,
                                paddingTop: 3,
                                paddingBottom: 3,
                            }}
                            value={localPropertyDescription}
                            onChange={(event: any) => {
                                event.preventDefault();
                                setLocalPropertyDescription(event.target.value);
                            }}
                        ></input>
                    </div>
                </div>
            );
        } else {
            return (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 13,
                                fontWeight: "bold",
                                paddingTop: 4,
                                paddingBottom: 4,
                                paddingLeft: 7,
                                paddingRight: 7,
                            }}
                        >
                            {propertyName}
                        </div>

                        <ElementDropDownMenu
                            callbacks={{
                                "Edit": () => setEditingMode(true),
                                "Delete": deleteProperty,
                                "Move up": moveUpProperty,
                                "Move down": moveDownProperty,
                            }}
                        ></ElementDropDownMenu>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            color: "rgb(180, 180, 180)",
                            fontSize: 13,
                            width: "70%",
                            marginTop: 2,
                            paddingTop: 4,
                            paddingBottom: 4,
                            paddingLeft: 7,
                            paddingRight: 7,
                        }}
                    >
                        {localPropertyDescription} &nbsp;
                    </div>
                </div>
            );
        }
    };

    private _ArrayPropertyTitle = this._PrimitivePropertyTitle;

    private _PrimitivePropertyValue = ({ propertyName, category }: any) => {
        const [localPropertyValue, setLocalPropertyValue] = React.useState(category[propertyName]["value"]);

        if (category[propertyName]["choices"] !== undefined) {
            return (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        marginTop: 6,
                        marginLeft: 7,
                    }}
                >
                    <select
                        value={localPropertyValue}
                        onChange={(event: any) => {
                            event.preventDefault();
                            const newValue = `${event.target.value}`;
                            setLocalPropertyValue(newValue);
                            category[propertyName]["value"] = newValue;

                        }}
                    >
                        {category[propertyName]["choices"].map((choice: string) => {
                            return <option value={choice}>{choice}</option>;
                        })}
                    </select>
                </div>
            );
        } else {
            return (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        marginTop: 6,
                        marginLeft: 7,
                    }}
                >
                    <form
                        style={{
                            margin: 0,
                        }}
                        onSubmit={(event: any) => {
                            event.preventDefault();
                            category[propertyName]["value"] = localPropertyValue;
                        }}
                    >
                        <input
                            style={{
                                border: "1px solid rgb(190, 190, 190)",
                                outline: "none",
                                paddingLeft: "6px",
                                paddingRight: "6px",
                                paddingTop: 3,
                                paddingBottom: 3,
                                margin: 0,
                                // height: "24px",
                                fontSize: "13px",
                            }}
                            value={localPropertyValue}
                            onChange={(event: any) => {
                                event.preventDefault();
                                setLocalPropertyValue(event.target.value);
                            }}
                            onBlur={(event: any) => {
                                event.preventDefault();
                                setLocalPropertyValue(category[propertyName]["value"]);
                            }}
                        ></input>{" "}
                    </form>
                </div>
            );
        }
    };

    private _ArrayPropertyValue = ({ propertyName, category }: any) => {
        const addItem = () => {
            if (category[propertyName]["type"] === "[string,string][]") {
                const stringArray = category[propertyName]["value"];
                stringArray.push(["", ""]);
            } else {
                const stringArray = category[propertyName]["value"];
                stringArray.push("");
            }
            this._forceUpdateWholePage();
        };

        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    paddingLeft: 7,
                    marginTop: 4,
                }}
            >
                {category[propertyName]["value"].map((element: string, index: number) => {
                    return (
                        <this._ArrayPropertyValueItem
                            key={`${propertyName}-${element}-${index}`}
                            // string array
                            propertyValue={category[propertyName]["value"]}
                            // type of element, e.g. "string" or "[string, string]", if it is undefined, its type is "string"
                            propertyType={category[propertyName]["type"]}
                            // index in the string array
                            index={index}
                        ></this._ArrayPropertyValueItem>
                    );
                })}
                <div
                    style={{
                        marginTop: "5px",
                        marginBottom: "6px",
                    }}
                >
                    <ElementRectangleButton
                        marginRight={10}
                        paddingTop={3}
                        paddingBottom={3}
                        paddingLeft={5}
                        paddingRight={5}
                        handleClick={(event: any) => {
                            addItem();
                        }}
                    >
                        Add item
                    </ElementRectangleButton>
                </div>
            </div>
        );
    };

    // propertyValue is a string array
    private _ArrayPropertyValueItem = ({ propertyValue, index, propertyType }: any) => {
        const [localItemValue, setLocalItemValue] = React.useState(propertyValue[index]);
        const [editingMode, setEditingMode] = React.useState(false);
        const refSubElementType1 = React.useRef<any>(null);
        const refSubElementType2 = React.useRef<any>(null);
        const refSubElementType3 = React.useRef<any>(null);
        const refSubElementType4 = React.useRef<any>(null);

        const deleteItem = () => {
            propertyValue.splice(index, 1);
            this._forceUpdateWholePage();
        };

        const moveUp = () => {
            if (index === 0) {
                return;
            } else {
                const itemValue = propertyValue[index];
                propertyValue.splice(index, 1);
                propertyValue.splice(index - 1, 0, itemValue);
            }
            this._forceUpdateWholePage();
        };

        const moveDown = () => {
            if (index === propertyValue.length - 1) {
                return;
            } else {
                const itemValue = propertyValue[index];
                propertyValue.splice(index, 1);
                propertyValue.splice(index + 1, 0, itemValue);
            }
            this._forceUpdateWholePage();
        };

        if (propertyType !== undefined && propertyType.replace(" ", "") === "[string,string][]") {
            if (editingMode) {
                return (
                    <ElementArrayPropertyItem refSubElement={refSubElementType1}>
                        <input
                            style={{
                                backgroundColor: "rgba(0,0,0,0)",
                                width: "30%",
                                border: "solid 1px rgb(190, 190, 190)",
                                paddingLeft: "6px",
                                outline: "none",
                                fontSize: "13px",
                                background: "white",
                            }}
                            value={localItemValue[0]}
                            onChange={(event: any) => {
                                event.preventDefault();
                                setLocalItemValue([event.target.value, localItemValue[1]]);
                            }}
                        ></input>{" "}
                        <input
                            style={{
                                backgroundColor: "rgba(0,0,0,0)",
                                width: "30%",
                                border: "solid 1px rgb(190, 190, 190)",
                                paddingLeft: "6px",
                                outline: "none",
                                fontSize: "13px",
                                background: "white",
                            }}
                            value={localItemValue[1]}
                            onChange={(event: any) => {
                                event.preventDefault();
                                setLocalItemValue([localItemValue[0], event.target.value]);
                            }}
                        ></input>{" "}
                        <div
                            ref={refSubElementType1}
                            style={{
                                display: "none",
                            }}
                        >
                            <ElementRectangleButton
                                marginRight={10}
                                paddingTop={3}
                                paddingBottom={3}
                                paddingLeft={5}
                                paddingRight={5}
                                handleClick={(event: any) => {
                                    propertyValue[index] = localItemValue;
                                    setEditingMode(false);
                                    this._forceUpdateWholePage();
                                }}
                            >
                                OK
                            </ElementRectangleButton>

                            <ElementRectangleButton
                                marginRight={10}
                                paddingTop={3}
                                paddingBottom={3}
                                paddingLeft={5}
                                paddingRight={5}
                                handleClick={(event: any) => {
                                    setLocalItemValue(propertyValue[index]);
                                    setEditingMode(false);
                                    this._forceUpdateWholePage();
                                }}
                            >
                                Cancel
                            </ElementRectangleButton>
                        </div>
                    </ElementArrayPropertyItem>
                );
            } else {
                return (
                    <ElementArrayPropertyItem refSubElement={refSubElementType2}>
                        <div
                            style={{
                                paddingLeft: "7px",
                                fontSize: "13px",
                            }}
                        >
                            {localItemValue[0]}
                        </div>
                        <div
                            style={{
                                paddingLeft: "7px",
                                fontSize: "13px",
                            }}
                        >
                            {localItemValue[1]}
                        </div>
                        <div
                            style={{
                                display: "none",
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                            ref={refSubElementType2}
                        >
                            <ElementArrayPropertyItemRight
                                onClick={() => {
                                    setEditingMode(true);
                                    this._forceUpdateWholePage();
                                }}
                            >
                                <img
                                    style={{
                                        height: "15px",
                                    }}
                                    src={`../../../webpack/resources/webpages/modify-symbol.svg`}
                                ></img>
                            </ElementArrayPropertyItemRight>
                            <ElementArrayPropertyItemRight
                                onClick={() => {
                                    deleteItem();
                                }}
                            >
                                <img
                                    style={{
                                        height: "13px",
                                    }}
                                    src={`../../../webpack/resources/webpages/delete-symbol.svg`}
                                ></img>
                            </ElementArrayPropertyItemRight>
                            <ElementArrayPropertyItemRight
                                onClick={() => {
                                    moveUp();
                                }}
                            >
                                &#8593;
                            </ElementArrayPropertyItemRight>
                            <ElementArrayPropertyItemRight
                                onClick={() => {
                                    moveDown();
                                }}
                            >
                                &#8595;
                            </ElementArrayPropertyItemRight>
                        </div>
                    </ElementArrayPropertyItem>
                );
            }
        } else {
            if (editingMode) {
                return (
                    <ElementArrayPropertyItem refSubElement={refSubElementType3}>
                        <input
                            style={{
                                backgroundColor: "rgba(0,0,0,0)",
                                width: "70%",
                                border: "solid 1px rgb(190, 190, 190)",
                                paddingLeft: "6px",
                                outline: "none",
                                fontSize: "13px",
                                background: "white",
                            }}
                            value={localItemValue}
                            onChange={(event: any) => {
                                event.preventDefault();
                                setLocalItemValue(event.target.value);
                            }}
                        ></input>{" "}
                        <div
                            ref={refSubElementType3}
                            style={{
                                display: "none",
                            }}
                        >
                            <ElementRectangleButton
                                marginRight={10}
                                paddingTop={3}
                                paddingBottom={3}
                                paddingLeft={5}
                                paddingRight={5}
                                handleClick={(event: any) => {
                                    propertyValue[index] = localItemValue;
                                    setEditingMode(false);
                                    this._forceUpdateWholePage();
                                }}
                            >
                                OK
                            </ElementRectangleButton>
                            <ElementRectangleButton
                                paddingTop={3}
                                paddingBottom={3}
                                paddingLeft={5}
                                paddingRight={5}
                                handleClick={(event: any) => {
                                    setLocalItemValue(propertyValue[index]);
                                    setEditingMode(false);
                                    this._forceUpdateWholePage();
                                }}
                            >
                                Cancel
                            </ElementRectangleButton>
                        </div>
                    </ElementArrayPropertyItem>
                );
            } else {
                return (
                    <ElementArrayPropertyItem refSubElement={refSubElementType4}>
                        <div
                            style={{
                                paddingLeft: "7px",
                                fontSize: "13px",
                            }}
                        >
                            {localItemValue}
                        </div>
                        <div
                            style={{
                                display: "none",
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                            ref={refSubElementType4}
                        >
                            <ElementArrayPropertyItemRight
                                onClick={() => {
                                    setEditingMode(true);
                                    this._forceUpdateWholePage();
                                }}
                            >
                                <img
                                    style={{
                                        height: "15px",
                                    }}
                                    src={`../../../webpack/resources/webpages/modify-symbol.svg`}
                                ></img>
                            </ElementArrayPropertyItemRight>
                            <ElementArrayPropertyItemRight
                                onClick={() => {
                                    deleteItem();
                                }}
                            >
                                <img
                                    style={{
                                        height: "13px",
                                    }}
                                    src={`../../../webpack/resources/webpages/delete-symbol.svg`}
                                ></img>
                            </ElementArrayPropertyItemRight>
                            <ElementArrayPropertyItemRight
                                onClick={() => {
                                    moveUp();
                                }}
                            >
                                &#8593;
                            </ElementArrayPropertyItemRight>
                            <ElementArrayPropertyItemRight
                                onClick={() => {
                                    moveDown();
                                }}
                            >
                                &#8595;
                            </ElementArrayPropertyItemRight>
                        </div>
                    </ElementArrayPropertyItem>
                );
            }
        }
    };


    // -------------------- helper functions --------------------

    // todo: new name collides with existing name
    renameObjProperty = (oldName: string, newName: string, obj: Record<string, any>) => {
        const keys = Object.keys(obj);
        const index = keys.indexOf(oldName);
        if (index === -1) {
            return;
        }
        const value = obj[oldName];
        delete obj[oldName];
        this.insertToObject(newName, value, obj, index);
    };

    // --------------------- getters and setters ----------------
    getMainWindowClient = () => {
        return this._mainWindowClient;
    };

    getLocalProfile = () => {
        return this._localProfile;
    };
    getSelectedCategoryName = () => {
        return this._selectedCategoryName;
    };
    setLocalProfile = (newLocalProfile: Record<string, any>) => {
        this._localProfile = newLocalProfile;
    };
    setSelectedCategoryName = (newCategoryName: string) => {
        this._selectedCategoryName = newCategoryName;
    };
    getOrigProfileName = () => {
        return this._origProfileName;
    };
}
