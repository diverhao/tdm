import * as React from "react";
import { v4 as uuidv4, validate as uuidValidate } from "uuid";
import { GlobalVariables } from "../../common/GlobalVariables";

import {
    ElementUpDownButtonOnSidebar,
    ElementProfileBlockNameInput,
    ElementArrayPropertyItem,
    ElementArrayPropertyItemRight,
} from "./MainWindowStyledComponents";
import { MainWindowClient, mainWindowState } from "../../mainProcess/windows/MainWindow/MainWindowClient";
import { ElementDropDownMenu } from "../helperWidgets/SharedElements/DropDownMenu";
import { ElementRectangleButton } from "../helperWidgets/SharedElements/RectangleButton";
import { Log } from "../../common/Log";
import * as GlobalMethods from "../../common/GlobalMethods"
import { Profile } from "../../mainProcess/profile/Profile";

/**
 * Represents the profile editor. This editor edits one profile.  <br>
 *
 * It creates a local copy of profile JSON object. This object is updated internally. The upper-level
 * profiles object is updated only when we try to save the changes.
 *
 * Structure of the profiles object: profiles -- profile -- category -- property -- item (for array or map value) <br>
 * 
 * each category is an object, it contains a "DESCRIPTION_${uuid}" field and various properties
 * 
 * each property is an object, it has a "DESCRIPTION" field, a "value" field, and an optional "choices" field
 * 
 * the "value" field is a string, a string array, or a [string, string] array. The function who uses the value should parse the
 * string or string array.
 * 
 */
export class MainWindowProfileEditPage {
    private _mainWindowClient: MainWindowClient;

    // the category name that is being selected, 
    // it is initialized as the first category name when we navigate to this page
    private _selectedCategoryName: string = "";

    // the profile name when this page is opened
    // used when we disgard the changes
    private _origProfileName: string = "";

    // the profile object that is being edited, it is a copy of the clicked profile
    // every time we return to the startup page, it should be reset to the below value
    private _localProfile: Record<string, any> = { undefined: "I am not defined yet" };

    private _forceUpdatePage: any = () => { };

    private newArrayPropertyItemAddress: string[] = [];

    constructor(mainWindowClient: MainWindowClient) {
        this._mainWindowClient = mainWindowClient;
    }


    // ------------------------- main element ----------------------

    private _Element = ({ profileName }: any) => {
        const style = {
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
        } as React.CSSProperties;

        // save the original profile name, in case we want to disgard the changes
        this.setOrigProfileName(profileName);
        // assign the local profile name
        const [localProfileName, setLocalProfileName] = React.useState(profileName);
        const [, updateState] = React.useState({});
        const forceUpdate = () => updateState({});
        this._forceUpdatePage = forceUpdate;

        /**
         * (1) make a local profile copy if it is not asssigned yet, this copy is a hard copy from the selected profile
         * 
         * (2) set the selected category name as the first category name
         * 
         * this block is invoked when we select to edit the profile from start page
         */
        if (this.getLocalProfile()["undefined"] === "I am not defined yet") {
            const profiles = this.getMainWindowClient().getProfiles();
            this.setLocalProfile(JSON.parse(JSON.stringify(profiles[profileName])) as Record<string, any>);
            // select the first category
            const firstCategoryName = Object.keys(this.getLocalProfile())[0];
            if (firstCategoryName !== undefined) {
                this.setSelectedCategoryName(firstCategoryName);
            } else {
                this.setSelectedCategoryName("");
            }
        }



        return (
            <>
                <div
                    style={style}
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
                    <this._ElementTitle profileName={profileName} localProfileName={localProfileName} setLocalProfileName={setLocalProfileName} />
                    <this._ElementBody></this._ElementBody>
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

    /**
     * title area: the profile name and the control buttons for this page
     */
    private _ElementTitle = ({ profileName, localProfileName, setLocalProfileName }: any) => {

        const style = {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px",
            borderBottom: "solid rgb(64,64,64) 1px",
        } as React.CSSProperties;

        const changeLocalProfileName = (event: any) => {
            event.preventDefault();
            setLocalProfileName(event.target.value);
        };

        return (
            <div
                style={style}
            >
                <div>
                    <ElementProfileBlockNameInput value={localProfileName} onChange={changeLocalProfileName}></ElementProfileBlockNameInput>
                </div>
                <this._ElementTitleControls profileName={profileName} localProfileName={localProfileName} />
            </div>
        )
    }

    private _ElementBody = () => {

        const style = {
            display: "inline-flex",
            flexDirection: "row",
            paddingTop: "12px",
            height: "100%",
            overflow: "hidden",
        } as React.CSSProperties;


        return (
            <div
                style={style}
            >
                <this._ElementSidebar></this._ElementSidebar>
                <this._ElementCategory></this._ElementCategory>
            </div>
        )
    }

    getElement = (profileName: string): React.JSX.Element => {
        return <this._Element profileName={profileName}></this._Element>;
    };

    private _ElementSidebar = () => {

        const style = {
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            maxWidth: "20%",
            minWidth: "20%",
            fontSize: "13px",
            boxSizing: "border-box",
            overflow: "clip",
        } as React.CSSProperties;

        const selectCategory = (event: any, categoryName: string) => {
            if (event) {
                event.target.style.fontWeight = "bold";
            }
            this.setSelectedCategoryName(categoryName);
            this._forceUpdatePage();
        };

        const moveCategoryUp = (name: string) => {
            const oldIndex = Object.keys(this.getLocalProfile()).indexOf(name);
            if (oldIndex < 1) {
                return;
            }
            const newIndex = oldIndex - 1;
            const propertyValue = this.getLocalProfile()[name];
            delete this.getLocalProfile()[name];
            GlobalMethods.insertToObject(name, propertyValue, this.getLocalProfile(), newIndex);
            this._forceUpdatePage();
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
            GlobalMethods.insertToObject(categoryName, propertyValue, localProfile, newIndex);
            this._forceUpdatePage();
        };


        return (
            <div
                style={style}
            >
                {/* cateogry names on sidebar */}
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
                <this._ElementSidebarControls selectCategory={selectCategory}></this._ElementSidebarControls>
            </div>
        )
    }

    private _ElementSidebarControls = ({ selectCategory }: any) => {

        const style = {
            display: "inline-flex",
            flexDirection: "row",
            height: 30,
            width: "100%",
            alignItems: "center",
            justifyContent: "space-between",
        } as React.CSSProperties;

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
            this._forceUpdatePage();
        };

        const addWebServerCategory = () => {
            const categoryJson = Profile.generateWebServerCategory() as Record<string, any>;
            const categoryName = Object.keys(categoryJson)[0]; // should be "Web Server"
            if (Object.keys(this.getLocalProfile()).includes(categoryName)) {
                Log.error("Web Server category already exists");
                return;
            }
            this.getLocalProfile()[categoryName] = JSON.parse(JSON.stringify(categoryJson[categoryName]));
            selectCategory(undefined, categoryName);
            this._forceUpdatePage();
        }

        const addWebServerCategory_SNS = () => {
            const categoryJson = Profile.generateWebServerCategory_SNS() as Record<string, any>;
            const categoryName = Object.keys(categoryJson)[0]; // should be "Web Server"
            if (Object.keys(this.getLocalProfile()).includes(categoryName)) {
                Log.error("Web Server category already exists");
                return;
            }
            this.getLocalProfile()[categoryName] = JSON.parse(JSON.stringify(categoryJson[categoryName]));
            selectCategory(undefined, categoryName);
            this._forceUpdatePage();
        }

        const addArchiveCategory_SNS = () => {
            const categoryJson = Profile.generateArchiveCategory_SNS() as Record<string, any>;
            const categoryName = Object.keys(categoryJson)[0]; // should be "Web Server"
            if (Object.keys(this.getLocalProfile()).includes(categoryName)) {
                Log.error("Archieve category already exists");
                return;
            }
            this.getLocalProfile()[categoryName] = JSON.parse(JSON.stringify(categoryJson[categoryName]));
            selectCategory(undefined, categoryName);
            this._forceUpdatePage();
        }

        const dropDownMenuCallbacks: Record<string, any> = {
            "Add Empty Category": () => { addCategory() },
            // "Add Web Server Category": () => { addWebServerCategory() },
        };

        if (this.getMainWindowClient().getSite() === "sns-office-engineer") {
            dropDownMenuCallbacks["Add Web Server Category for SNS"] = () => { addWebServerCategory_SNS() };
            dropDownMenuCallbacks["Add Archive Category for SNS"] = () => { addArchiveCategory_SNS() };
        }

        return (
            <div
                style={style}
            >
                <div style={{
                    display: "inline-flex",
                    paddingLeft: 12,
                    width: "100%",
                }}>
                    <ElementDropDownMenu
                        callbacks={dropDownMenuCallbacks}
                    ></ElementDropDownMenu>
                </div>
            </div>
        )
    }

    private _ElementTitleControls = ({ localProfileName, profileName }: any) => {

        const style = {
            display: "flex",
            justifyContent: "space-between",
            flexDirection: "row",
        } as React.CSSProperties;

        const doDeleteThisProfile = () => {
            const profiles = this.getMainWindowClient().getProfiles();
            delete profiles[this.getOrigProfileName()];
            this.getMainWindowClient().saveProfiles();
            this.getMainWindowClient().setState(mainWindowState.start);
            this.getMainWindowClient().forceUpdate({})
            this.resetLocalProfile()

        };

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
                        info: {
                            // command: string | undefined,
                            messageType: "error", // | "warning" | "info", // symbol
                            humanReadableMessages: [`New profile name ${localProfileName} conflicts with an existing profile name.`], // each string has a new line
                            rawMessages: [], // string[], // computer generated messages
                            // buttons: type_DialogMessageBoxButton[] | undefined,
                            // attachment: any,
                        }
                    })

                    return;
                }

                this.renameObjProperty(this.getOrigProfileName(), localProfileName, profiles);
                profiles[localProfileName] = JSON.parse(JSON.stringify(this.getLocalProfile()));
            }

            // send this._profiles back to main process which saves it to hard drive
            this.getMainWindowClient().saveProfiles();

            this.getMainWindowClient().setState(mainWindowState.start);
            this.getMainWindowClient().forceUpdate({})
            this.resetLocalProfile()
        };

        const toDeleteThisProfile = () => {
            // bring up prompt
            // this.getMainWindowClient().getPrompt().createElement("delete-profile", { doDeleteThisProfile: doDeleteThisProfile, profileName: profileName });
            const ipcManager = this.getMainWindowClient().getIpcManager()
            const prompt = this.getMainWindowClient().getPrompt();
            ipcManager.handleDialogShowMessageBox(undefined, {
                info: {
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
                }
            })
        }

        const disgardChanges = async () => {
            // reset local data
            this.setSelectedCategoryName("");
            this.setLocalProfile({ undefined: "I am not defined yet" });
            this.getMainWindowClient().setState(mainWindowState.start);
            this.getMainWindowClient().forceUpdate({})
            this.resetLocalProfile()

        };

        return (
            <div
                style={style}
            >
                <ElementRectangleButton marginRight={10} handleClick={disgardChanges}>Disgard changes</ElementRectangleButton>
                <ElementRectangleButton marginRight={10} handleClick={saveAndReturn}>Save and return</ElementRectangleButton>
                <ElementRectangleButton
                    defaultBackgroundColor={"red"}
                    highlightBackgroundColor={"rgba(255,0,0,0.8)"}
                    handleClick={toDeleteThisProfile}>
                    Delete this profile
                </ElementRectangleButton>
            </div>

        )
    }

    /**
     * display contents of one category
     * 
     * contents is a reference, modifying it would directly modify the localProfile.current
     */
    private _ElementCategory = ({ }: any) => {

        const style = {
            display: "flex",
            flexDirection: "column",
            width: "100%",
            paddingLeft: 10,
            paddingBottom: 30,
            borderLeft: "solid 1px rgb(190, 190, 190)",
            boxSizing: "border-box",
            overflow: "auto",
        } as React.CSSProperties;

        const selectedCategoryName = this.getSelectedCategoryName();
        const localProfile = this.getLocalProfile();
        const category = localProfile[selectedCategoryName];
        const propertyNames = Object.keys(category);
        // const [filteredPropertyNames, setFilteredPropertyNames] = React.useState<string[]>([]);
        const [filterText, setFilterText] = React.useState("");

        if (category === undefined) {
            return (
                <div>
                    <h2>{`Category ${this.getSelectedCategoryName()} does not exist`}</h2>
                </div>
            );
        }

        return (
            <div
                style={style}
            >
                {/* category title */}
                <this._ElementCategoryTitle></this._ElementCategoryTitle>

                {/* Filter */}
                <this._ElementCategoryFilter
                    category={category}
                    skipFilter={selectedCategoryName === "About"}
                    filterText={filterText}
                    setFilterText={setFilterText}
                ></this._ElementCategoryFilter>

                {/* category content: each property */}
                {propertyNames.map((propertyName: string, index: number) => {
                    const property = category[propertyName];
                    const propertyValue = property["value"];
                    const propertyDescription = property["DESCRIPTION"];
                    const propertyChoices = property["choices"];
                    const propertyType = property["type"];

                    if (
                        filterText.trim() !== "" &&
                        !propertyName.toLowerCase().includes(filterText.trim().toLowerCase()) &&
                        !`${propertyDescription}`.toLowerCase().includes(filterText.trim().toLowerCase())) {
                        // filtered
                        return null;
                    } else if (propertyName.startsWith("DESCRIPTION_") && uuidValidate(propertyName.replace("DESCRIPTION_", ""))) {
                        // DESCRIPTION_${uuid} property, it is shown in the category title, not as a regular property
                        return null;
                    } else if (typeof property !== "object") {
                        // property must be an object that has "value" field and "DESCRIPTION" field
                        return null;
                    } else if (typeof propertyDescription !== "string") {
                        // the "DESCRIPTION" must be a string
                        return null;
                    } else if (typeof propertyValue !== "string" && Array.isArray(propertyValue) === false) {
                        // the "value" field must be a string or a string array
                        return null;
                    } else {
                        if (Array.isArray(propertyValue) && propertyType === undefined) {
                            return (
                                <this._ElementArrayProperty
                                    key={`${selectedCategoryName}-${propertyName}-${index}`}
                                    propertyName={propertyName}
                                    category={category}
                                ></this._ElementArrayProperty>
                            );
                        } else if (Array.isArray(propertyValue) && propertyType === "[string,string][]") {
                            return (
                                <this._ElementMapProperty
                                    key={`${selectedCategoryName}-${propertyName}-${index}`}
                                    propertyName={propertyName}
                                    category={category}
                                ></this._ElementMapProperty>
                            );
                        } else if (Array.isArray(propertyChoices)) {
                            return (
                                <this._ElementChoiceProperty
                                    key={`${selectedCategoryName}-${propertyName}-${index}`}
                                    propertyName={propertyName}
                                    category={category}
                                >
                                </this._ElementChoiceProperty>
                            )
                        } else {
                            return (
                                <this._ElementPrimitiveProperty
                                    key={`${selectedCategoryName}-${propertyName}-${index}`}
                                    propertyName={propertyName}
                                    category={category}
                                ></this._ElementPrimitiveProperty>
                            );
                        }
                    }
                })}
            </div>
        );
    };

    private _ElementCategoryFilter = ({ skipFilter, filterText, setFilterText }: any) => {
        const style = {
            display: "inline-flex",
            paddingLeft: 7,
            paddingRight: 7,
            paddingTop: 5,
            paddingBottom: 5,
        } as React.CSSProperties;

        const inputStyle = {
            fontSize: 13,
            paddingLeft: 2,
            paddingRight: 2,
            paddingTop: 1,
            paddingBottom: 1,
            margin: 0,
            outline: "none",
            border: "1px solid rgb(190, 190, 190)",
            width: "40%",
            marginBottom: 3,
        } as React.CSSProperties;

        if (skipFilter) {
            return null;
        }

        return (
            <div style={style}>
                <input style={inputStyle}
                    value={filterText}
                    placeholder={"Filter properties"}
                    spellCheck={false}
                    onChange={(event: any) => {
                        setFilterText(event.target.value);
                    }}
                >
                </input>
            </div>
        )
    }

    private _ElementCategoryTitle = ({ }: any) => {

        const style = {
            display: "flex",
            flexDirection: "column",
            // width: "100%",
            // justifyContent: "space-between",
            marginBottom: 7,
        } as React.CSSProperties;

        const styleDiv = {
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
        } as React.CSSProperties;

        const [isEditing, setIsEditing] = React.useState(false);
        const [categoryName, setCategoryName] = React.useState(this.getSelectedCategoryName());
        const [categoryDescription, setCategoryDescription] = React.useState(this.getSelectedCategoryDescription());

        // make sure localCategoryName is up to date
        React.useEffect(() => {
            setCategoryName(this.getSelectedCategoryName());
            setCategoryDescription(this.getSelectedCategoryDescription());
        }, [this.getSelectedCategoryName(), this.getSelectedCategoryDescription()]);

        return (
            <div
                style={style}
            >
                <div
                    style={styleDiv}
                >
                    <this._ElementCategoryTitleName
                        categoryName={categoryName}
                        setCategoryName={setCategoryName}
                        isEditing={isEditing}
                    />

                    <this._ElementCategoryTitleControl
                        isEditing={isEditing}
                        setCategoryName={setCategoryName}
                        setCategoryDescription={setCategoryDescription}
                        setIsEditing={setIsEditing}
                        categoryName={categoryName}
                        categoryDescription={categoryDescription}
                    />
                </div>
                <this._ElementCategoryTitleDescription
                    categoryDescription={categoryDescription}
                    setCategoryDescription={setCategoryDescription}
                    isEditing={isEditing}
                />
            </div>
        );
    };

    private _ElementCategoryTitleName = ({ categoryName, setCategoryName, isEditing }: any) => {

        const inputStyle = {
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
        } as React.CSSProperties;

        const divStyle = {
            fontSize: 25,
            paddingLeft: 7,
            paddingRight: 7,
            paddingTop: 5,
            paddingBottom: 5,
            marginBottom: 3,
        } as React.CSSProperties;

        return (
            isEditing === true ?
                <input
                    style={inputStyle}
                    value={categoryName}
                    onChange={(event: any) => {
                        event.preventDefault();
                        setCategoryName(event.target.value);
                    }}
                ></input>
                :
                <div
                    style={divStyle}
                >
                    {categoryName}
                </div>
        )
    }

    /**
     * When the title is being edited, the 2 buttons "OK" and "Cancel" are displayed;
     * 
     * when the title is not being edited, we show the dropdown menu with 4 options: edit, delete, add primitive property, add array property
     */
    private _ElementCategoryTitleControl = ({ isEditing, setCategoryName, setCategoryDescription, setIsEditing, categoryName, categoryDescription }: any) => {

        const style = {
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
        } as React.CSSProperties;

        const addPrimitive = () => {
            let name = "new-primitive";
            const category = this.getLocalProfile()[this.getSelectedCategoryName()];
            while (category[name] !== undefined) {
                name = `${name}-1`;
            }
            const value = "new-value";
            category[name] = { DESCRIPTION: `This is a scalar property.`, value: value };
            this._forceUpdatePage();
        };

        const addChoices = () => {
            let name = "new-choices";
            const category = this.getLocalProfile()[this.getSelectedCategoryName()];
            while (category[name] !== undefined) {
                name = `${name}-1`;
            }
            const value = "new-choice-1";
            const choices = ["new-choice-1", "new-choice-2"]
            category[name] = { DESCRIPTION: `This is a choice menu.`, value: value, choices: choices };
            this._forceUpdatePage();
        };

        const addMap = () => {
            let name = "new-map";
            const category = this.getLocalProfile()[this.getSelectedCategoryName()];
            while (category[name] !== undefined) {
                name = `${name}-1`;
            }
            const value = [["key-1", "value-1"], ["key-2", "value-2"]];
            const type = "[string,string][]";
            category[name] = { DESCRIPTION: `This is a map property. Left column is the name, right column is the value.`, value: value, type: type };
            this._forceUpdatePage();
        };

        const addArray = () => {
            let name = "new-array";
            const category = this.getLocalProfile()[this.getSelectedCategoryName()];
            while (category[name] !== undefined) {
                name = `${name}-1`;
            }
            const value = ["new-value-0", "new-value-1"];
            category[name] = { DESCRIPTION: `This is an array property.`, value: value };
            this._forceUpdatePage();
        };

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

            this._forceUpdatePage();
        };

        const renameCategoryAndUpdateDescription = () => {
            // check duplicate
            const categoryNames = Object.keys(this.getLocalProfile());
            const categoryIndex = categoryNames.indexOf(this.getSelectedCategoryName());
            categoryNames.splice(categoryIndex, 1);
            if (categoryNames.includes(categoryName)) {
                const ipcManager = this.getMainWindowClient().getIpcManager();
                ipcManager.handleDialogShowMessageBox(undefined, {
                    info: {
                        // command: string | undefined,
                        messageType: "error", // | "warning" | "info", // symbol
                        humanReadableMessages: [`${categoryName} conflicts with an existing category name.`], // each string has a new line
                        rawMessages: [], // string[], // computer generated messages
                        // buttons: type_DialogMessageBoxButton[] | undefined,
                        // attachment: any,
                    }
                })
                return;
            }

            this.renameObjProperty(this.getSelectedCategoryName(), categoryName, this.getLocalProfile());
            setIsEditing(false);
            this.setSelectedCategoryName(categoryName);
            this.setSelectedCategoryDescription(categoryDescription);
            this._forceUpdatePage();
        };

        return (
            isEditing ?
                <div
                    style={style}
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
                            setCategoryName(this.getSelectedCategoryName());
                            setCategoryDescription(this.getSelectedCategoryDescription());
                            setIsEditing(false);
                        }}
                    >
                        Cancel
                    </ElementRectangleButton>
                </div>
                :
                <ElementDropDownMenu
                    callbacks={{
                        "Edit category title": () => { setIsEditing(true) },
                        "Delete category": deleteCategory,
                        "Add primitive type data": addPrimitive,
                        "Add array type data": addArray,
                        "Add choices type data": addChoices,
                        "Add map type data": addMap
                    }}
                ></ElementDropDownMenu>
        )
    }

    private _ElementCategoryTitleDescription = ({ categoryDescription, setCategoryDescription, isEditing }: any) => {

        const styleDiv = {
            color: "rgb(180, 180, 180)",
            fontSize: 13,
            width: "70%",
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: "rgba(0,0,0,0)",
            paddingLeft: 6,
            paddingRight: 6,
            paddingTop: 3,
            paddingBottom: 3,
            margin: 0,
        } as React.CSSProperties;

        const styleInput = {
            fontSize: 13,
            paddingLeft: 6,
            paddingRight: 6,
            paddingTop: 3,
            paddingBottom: 3,
            margin: 0,
            outline: "none",
            border: "1px solid rgb(190, 190, 190)",
            width: "70%",
        } as React.CSSProperties;

        return (
            isEditing ?
                <input
                    style={styleInput}
                    value={categoryDescription}
                    onChange={(event: any) => {
                        event.preventDefault();
                        setCategoryDescription(event.target.value);
                    }}
                ></input>
                :
                <div
                    style={styleDiv}
                >
                    {this.getSelectedCategoryDescription()} &nbsp;
                </div>
        )
    }

    private _ElementPropertyTitle = ({ propertyName, category }: any) => {
        const [isEditing, setIsEditing] = React.useState(false);
        const [localPropertyName, setLocalPropertyName] = React.useState(propertyName);
        const [localPropertyDescription, setLocalPropertyDescription] = React.useState(category[propertyName]["DESCRIPTION"]);
        // if this property is an environment property 
        const envOs = this.getMainWindowClient().getEnvOs();
        const envDefault = this.getMainWindowClient().getEnvDefault();
        const envOsValue = envOs[propertyName];
        const envDefaultValue = envDefault[propertyName];
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
                    <this._ElementPropertyTitleName
                        isEditing={isEditing}
                        localPropertyName={localPropertyName}
                        setLocalPropertyName={setLocalPropertyName}
                    />
                    <this._ElementPropertyTitleControl
                        isEditing={isEditing}
                        category={category}
                        propertyName={propertyName}
                        localPropertyName={localPropertyName}
                        setLocalPropertyName={setLocalPropertyName}
                        localPropertyDescription={localPropertyDescription}
                        setLocalPropertyDescription={setLocalPropertyDescription}
                        setIsEditing={setIsEditing}
                    />
                </div>
                <this._ElementPropertyDescription
                    isEditing={isEditing}
                    envOsValue={envOsValue}
                    envDefaultValue={envDefaultValue}
                    localPropertyDescription={localPropertyDescription}
                    setLocalPropertyDescription={setLocalPropertyDescription}
                />
            </div>
        )
    };

    private _ElementPropertyTitleName = ({ isEditing, localPropertyName, setLocalPropertyName }: any) => {
        return (
            isEditing ?
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
                :
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
                    {localPropertyName}
                </div>
        )
    }

    private _ElementPropertyTitleControl = ({ isEditing, category, propertyName, localPropertyName, setLocalPropertyName, localPropertyDescription, setLocalPropertyDescription, setIsEditing }: any) => {

        const deleteProperty = () => {
            delete category[propertyName];
            this._forceUpdatePage();
        };

        const renamePropertyAndUpdateDescription = () => {
            // check duplicate
            const propertyNames = Object.keys(category);
            const propertyIndex = propertyNames.indexOf(propertyName);
            propertyNames.splice(propertyIndex, 1);
            if (propertyNames.includes(localPropertyName)) {
                const ipcManager = this.getMainWindowClient().getIpcManager();
                ipcManager.handleDialogShowMessageBox(undefined, {
                    info: {
                        // command: string | undefined,
                        messageType: "error", // | "warning" | "info", // symbol
                        humanReadableMessages: [`${localPropertyName} conflicts with an existing property name.`], // each string has a new line
                        rawMessages: [], // string[], // computer generated messages
                        // buttons: type_DialogMessageBoxButton[] | undefined,
                        // attachment: any,
                    }
                })
                return;
            }

            // update description
            category[propertyName]["DESCRIPTION"] = localPropertyDescription;
            this.renameObjProperty(propertyName, localPropertyName, category);
            setIsEditing(false);
            this._forceUpdatePage();
        };

        const moveUpProperty = () => {
            const index = Object.keys(category).indexOf(propertyName);
            if (index < 1) {
                return;
            }
            const origProperty = category[propertyName];
            delete category[propertyName];
            GlobalMethods.insertToObject(propertyName, origProperty, category, index - 1);
            this._forceUpdatePage();
        };
        const moveDownProperty = () => {
            const index = Object.keys(category).indexOf(propertyName);
            if (index < 0 || index >= Object.keys(category).length - 1) {
                return;
            }
            const origProperty = category[propertyName];
            delete category[propertyName];
            GlobalMethods.insertToObject(propertyName, origProperty, category, index + 1);
            this._forceUpdatePage();
        };

        return (
            isEditing ?
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
                        OK
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
                            setIsEditing(false);
                        }}
                    >
                        Cancel
                    </ElementRectangleButton>
                </div>
                :
                <ElementDropDownMenu
                    callbacks={{
                        "Edit property title": () => setIsEditing(true),
                        "Delete property": deleteProperty,
                        "Move up": moveUpProperty,
                        "Move down": moveDownProperty,
                    }}
                ></ElementDropDownMenu>

        )
    }

    private _ElementPropertyDescription = ({ isEditing, localPropertyDescription, setLocalPropertyDescription, envOsValue, envDefaultValue }: any) => {
        return (
            isEditing ?
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        flexDirection: "column",
                        color: "rgb(180, 180, 180)",
                        fontSize: 13,
                        width: "70%",
                        margin: 0,
                        marginTop: 2,
                        paddingTop: 4,
                        paddingBottom: 4,
                        paddingLeft: 7,
                        paddingRight: 7,

                    }}
                >
                    <input
                        style={{
                            fontSize: 13,
                            margin: 0,
                            outline: "none",
                            border: "solid 1px rgb(190, 190, 190)",
                            width: "100%",
                            marginBottom: 2,
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
                    <this._ElementPropertyDefaultOsValues envDefaultValue={envDefaultValue} envOsValue={envOsValue}></this._ElementPropertyDefaultOsValues>
                </div>
                :
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        flexDirection: "column",
                        color: "rgb(180, 180, 180)",
                        fontSize: 13,
                        width: "70%",
                        margin: 0,
                        marginTop: 2,
                        paddingTop: 4,
                        paddingBottom: 4,
                        paddingLeft: 7,
                        paddingRight: 7,
                    }}
                >
                    <div style={{
                        margin: 0,
                        marginBottom: 2,
                        borderWidth: 1,
                        borderStyle: "solid",
                        borderColor: "rgba(0,0,0,0)",
                        paddingTop: 3,
                        paddingBottom: 3,
                        paddingLeft: 6,
                        paddingRight: 6,
                    }}>
                        {localPropertyDescription} &nbsp;
                    </div>
                    <this._ElementPropertyDefaultOsValues envDefaultValue={envDefaultValue} envOsValue={envOsValue}></this._ElementPropertyDefaultOsValues>
                </div>
        )
    }

    private _ElementPropertyDefaultOsValues = ({ envDefaultValue, envOsValue }: any) => {
        return (
            envDefaultValue === undefined ? null :
                <table style={{
                    color: "rgb(180, 180, 180)",
                    fontSize: 13,
                    width: "100%",
                    backgroundColor: "rgba(90, 90, 90, 1)",
                    paddingLeft: 6,
                    paddingRight: 6,
                }}>
                    <col style={{ width: "30%" }}>
                    </col>
                    <col style={{ width: "70%" }}>
                    </col>
                    <tr>
                        <td>
                            Default:
                        </td>
                        <td>
                            {`${envDefaultValue}`}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            Operating system:
                        </td>
                        <td>
                            {envOsValue === undefined ? "DO NOT SET" : `${envOsValue}`}
                        </td>
                    </tr>
                </table>
        )
    }

    private _ElementArrayProperty = ({ propertyName, category }: any) => {
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
                <this._ElementPropertyTitle propertyName={propertyName} category={category}></this._ElementPropertyTitle>
                <this._ElementArrayPropertyValue propertyName={propertyName} category={category}></this._ElementArrayPropertyValue>
            </div>
        );
    };

    private _ElementMapProperty = ({ propertyName, category }: any) => {
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
                <this._ElementPropertyTitle propertyName={propertyName} category={category}></this._ElementPropertyTitle>
                <this._ElementMapPropertyValue propertyName={propertyName} category={category}></this._ElementMapPropertyValue>
            </div>
        );
    };

    private _ElementPrimitiveProperty = ({ propertyName, category }: any) => {
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
                <this._ElementPropertyTitle propertyName={propertyName} category={category}></this._ElementPropertyTitle>
                <this._ElementPrimitivePropertyValue propertyName={propertyName} category={category}></this._ElementPrimitivePropertyValue>
            </div>
        );
    };


    private _ElementChoiceProperty = ({ propertyName, category }: any) => {
        const refElement = React.useRef<any>(null);
        const [isEditing, setIsEditing] = React.useState(false);

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
                <this._ElementPropertyTitle propertyName={propertyName} category={category}></this._ElementPropertyTitle>
                <this._ElementChoicePropertyValue propertyName={propertyName} category={category} isEditing={isEditing}></this._ElementChoicePropertyValue>
                <this._ElementChoicePropertyControls category={category} propertyName={propertyName} isEditing={isEditing} setIsEditing={setIsEditing} />
            </div>
        );
    };

    private _ElementChoicePropertyValue = ({ propertyName, category, isEditing }: any) => {
        const [localPropertyValue, setLocalPropertyValue] = React.useState(category[propertyName]["value"]);
        const choices = category[propertyName]["choices"];

        const styleDropDownMenu = {
            display: "flex",
            alignItems: "center",
            marginTop: 6,
            marginLeft: 7,
        } as React.CSSProperties;

        const styleChoices = {
            display: "flex",
            alignItems: "flex-start",
            marginTop: 6,
            marginLeft: 7,
            flexDirection: "column"
        } as React.CSSProperties;

        return (
            isEditing ?
                <div style={styleChoices}>
                    {choices.map((choice: string, index: number) => {
                        return (
                            <this._ElementChoicePropertyChoicesItem
                                choice={choice}
                                index={index}
                                category={category}
                                propertyName={propertyName}
                            >
                            </this._ElementChoicePropertyChoicesItem>
                        )
                    })}
                </div>
                :
                <div
                    style={styleDropDownMenu}
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
        )
    }

    private _ElementChoicePropertyChoicesItem = ({ choice, index, category, propertyName }: any) => {
        const [localChoice, setLocalChoice] = React.useState(choice);
        const [showControl, setShowControl] = React.useState(false);
        const elementRef = React.useRef<any>(null);

        const style = {
            display: "flex",
            flexDirection: "row",
            boxSizing: "border-box",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            marginBottom: 2,

        } as React.CSSProperties;

        const styleInput = {
            backgroundColor: "rgba(0,0,0,0)",
            width: "30%",
            border: "solid 1px rgb(190, 190, 190)",
            paddingLeft: "6px",
            outline: "none",
            fontSize: "13px",
            background: "white",
        } as React.CSSProperties;

        const deleteChoice = () => {
            const property = category[propertyName];
            const choices = property["choices"];
            choices.splice(index, 1);
            this._forceUpdatePage();
        }

        return (
            <div style={style}
                ref={elementRef}
                onMouseEnter={() => {
                    if (elementRef.current !== null) {
                        elementRef.current.style["backgroundColor"] = "rgba(239, 239, 239, 1)";
                    }
                    setShowControl(true);
                }}
                onMouseLeave={() => {
                    if (elementRef.current !== null) {
                        elementRef.current.style["backgroundColor"] = "rgba(239, 239, 239, 0)";
                    }
                    setShowControl(false);
                }}
            >
                <input
                    style={styleInput}
                    value={localChoice}
                    onChange={(event: any) => {
                        setLocalChoice(event.target.value);
                        const property = category[propertyName];
                        const choices = property["choices"];
                        choices[index] = event.target.value;
                    }}
                >
                </input>

                <ElementArrayPropertyItemRight
                    additionalStyle={{
                        display: showControl === true ? "inline-flex" : "none",
                        height: 19.5,
                    }}
                    onClick={() => {
                        deleteChoice();
                    }}
                >
                    <img
                        style={{
                            height: "10px",
                        }}
                        src={`../../../webpack/resources/webpages/delete-symbol.svg`}
                    ></img>
                </ElementArrayPropertyItemRight>

            </div>
        )
    }

    private _ElementChoicePropertyControls = ({ category, propertyName, isEditing, setIsEditing }: any) => {
        const addChoice = () => {
            const choices = category[propertyName]["choices"];
            let newChoiceName = "new-choice";
            while (true) {
                if (choices.includes(newChoiceName)) {
                    newChoiceName = newChoiceName + "-1";
                } else {
                    break;
                }
            }
            choices.push(newChoiceName);
            this._forceUpdatePage();
        }

        const style = {
            display: "flex",
            alignItems: "center",
            marginTop: 6,
            marginLeft: 7,
        } as React.CSSProperties;


        return (
            isEditing ?
                <div style={style}>
                    <ElementRectangleButton
                        marginRight={10}
                        paddingTop={3}
                        paddingBottom={3}
                        paddingLeft={5}
                        paddingRight={5}
                        handleClick={() => { addChoice() }}
                    >
                        Add choice
                    </ElementRectangleButton>
                    <ElementRectangleButton
                        marginRight={10}
                        paddingTop={3}
                        paddingBottom={3}
                        paddingLeft={5}
                        paddingRight={5}
                        handleClick={() => { setIsEditing(false); this._forceUpdatePage() }}
                    >
                        OK
                    </ElementRectangleButton>
                </div>
                :
                <div
                    style={style}
                >

                    <ElementRectangleButton
                        marginRight={10}
                        paddingTop={3}
                        paddingBottom={3}
                        paddingLeft={5}
                        paddingRight={5}
                        handleClick={() => { setIsEditing(true); this._forceUpdatePage() }}
                    >
                        Edit choices
                    </ElementRectangleButton>
                </div>
        )
    }

    private _ElementPrimitivePropertyValue = ({ propertyName, category }: any) => {
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


    private _ElementArrayPropertyValue = ({ propertyName, category }: any) => {
        const style = {
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            paddingLeft: 7,
            marginTop: 4,
        } as React.CSSProperties;

        return (
            <div
                style={style}
            >
                {category[propertyName]["value"].map((element: string, index: number) => {
                    return (
                        <this._ElementArrayPropertyValueItem
                            key={`${propertyName}-${element}-${index}`}
                            propertyName={propertyName}
                            // string array
                            propertyValue={category[propertyName]["value"]}
                            // type of element, e.g. "string" or "[string, string]", if it is undefined, its type is "string"
                            propertyType={category[propertyName]["type"]}
                            // index in the string array
                            index={index}
                        ></this._ElementArrayPropertyValueItem>
                    );
                })}
                <this._ElementArrayPropertyAddItemButton
                    category={category}
                    propertyName={propertyName}
                />
            </div>
        );
    };

    private _ElementMapPropertyValue = ({ propertyName, category }: any) => {
        const style = {
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            paddingLeft: 7,
            marginTop: 4,
        } as React.CSSProperties;

        return (
            <div
                style={style}
            >
                {category[propertyName]["value"].map((element: [string, string], index: number) => {
                    return (
                        <this._ElementMapPropertyValueItem
                            key={`${propertyName}-${element}-${index}`}
                            propertyName={propertyName}
                            // string array
                            propertyValue={category[propertyName]["value"]}
                            // type of element, fixed as "[string,string][]"
                            propertyType={category[propertyName]["type"]}
                            // index in the string array
                            index={index}
                        ></this._ElementMapPropertyValueItem>
                    );
                })}
                <this._ElementArrayPropertyAddItemButton
                    category={category}
                    propertyName={propertyName}
                />
            </div>
        );
    };

    private _ElementArrayPropertyAddItemButton = ({ category, propertyName }: any) => {

        const style = {
            marginTop: "5px",
            marginBottom: "6px",
        } as React.CSSProperties;

        const addItem = () => {
            if (category[propertyName]["type"] === "[string,string][]") {
                const stringArray = category[propertyName]["value"];
                stringArray.push(["", ""]);
            } else {
                const stringArray = category[propertyName]["value"];
                stringArray.push("");
            }
            this._forceUpdatePage();
        };

        return (
            <div
                style={style}
            >
                <ElementRectangleButton
                    marginRight={10}
                    paddingTop={3}
                    paddingBottom={3}
                    paddingLeft={5}
                    paddingRight={5}
                    handleClick={(event: any) => {
                        addItem();
                        const stringArray = category[propertyName]["value"];
                        this.setNewArrayPropertyItemAddress([this.getSelectedCategoryName(), propertyName, stringArray.length - 1]);
                    }}
                >
                    Add item
                </ElementRectangleButton>
            </div>
        )
    }

    // propertyValue is a string array
    private _ElementArrayPropertyValueItem = ({ propertyName, propertyValue, index }: any) => {
        const [localItemValue, setLocalItemValue] = React.useState(propertyValue[index]);

        const [isEditing, setIsEditing] = React.useState(false);
        const refSubElement = React.useRef<any>(null);

        React.useEffect(() => {
            if (propertyName === this.getNewArrayPropertyItemAddress()[1] && index === this.getNewArrayPropertyItemAddress()[2]) {
                setIsEditing(true);
                this.setNewArrayPropertyItemAddress([]);
            }
        }, [])

        return (
            <ElementArrayPropertyItem refSubElement={refSubElement}>
                <this._ElementArrayPropertyValueItemContent
                    isEditing={isEditing}
                    localItemValue={localItemValue}
                    setLocalItemValue={setLocalItemValue}
                ></this._ElementArrayPropertyValueItemContent>
                <this._ElementArrayAndMapPropertyValueItemControls
                    propertyValue={propertyValue}
                    index={index}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    setLocalItemValue={setLocalItemValue}
                    localItemValue={localItemValue}
                    refSubElement={refSubElement}
                ></this._ElementArrayAndMapPropertyValueItemControls>
            </ElementArrayPropertyItem>
        )
    };

    private _ElementArrayPropertyValueItemContent = ({ isEditing, localItemValue, setLocalItemValue }: any) => {

        console.log("render me", focus, isEditing, localItemValue, this.getNewArrayPropertyItemAddress())

        const inputRef = React.useRef<any>(null);

        const style = {
            backgroundColor: "rgba(0,0,0,0)",
            width: "70%",
            border: "solid 1px rgb(190, 190, 190)",
            paddingLeft: "6px",
            outline: "none",
            fontSize: "13px",
            background: "white",
        } as React.CSSProperties;

        if (isEditing) {
            return (
                <input
                    ref={inputRef}
                    style={style}
                    value={localItemValue}
                    onChange={(event: any) => {
                        event.preventDefault();
                        setLocalItemValue(event.target.value);
                    }}
                ></input>
            );
        } else {
            return (
                <div
                    style={{
                        paddingLeft: "7px",
                        fontSize: "13px",
                    }}
                >
                    {localItemValue}
                </div>
            );
        }
    };

    // propertyValue is an array with elements in form of 2-element string array ["ABC", "DEF"].
    private _ElementMapPropertyValueItem = ({ propertyValue, index, propertyName }: any) => {
        const [localItemValue, setLocalItemValue] = React.useState(propertyValue[index]);

        const [isEditing, setIsEditing] = React.useState(false);
        const refSubElement = React.useRef<any>(null);

        React.useEffect(() => {
            if (propertyName === this.getNewArrayPropertyItemAddress()[1] && index === this.getNewArrayPropertyItemAddress()[2]) {
                setIsEditing(true);
                this.setNewArrayPropertyItemAddress([]);
            }
        }, [])

        return (
            <ElementArrayPropertyItem refSubElement={refSubElement}>

                <this._ElementMapPropertyValueItemContent
                    isEditing={isEditing}
                    localItemValue={localItemValue}
                    setLocalItemValue={setLocalItemValue}
                ></this._ElementMapPropertyValueItemContent>
                <this._ElementArrayAndMapPropertyValueItemControls
                    propertyValue={propertyValue}
                    index={index}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    setLocalItemValue={setLocalItemValue}
                    localItemValue={localItemValue}
                    refSubElement={refSubElement}
                ></this._ElementArrayAndMapPropertyValueItemControls>

            </ElementArrayPropertyItem>
        )
    };

    private _ElementMapPropertyValueItemContent = ({ isEditing, localItemValue, setLocalItemValue }: any) => {
        const style = {
            display: "flex",
            flexDirection: "row",
            width: "80%",
            paddingLeft: "6px",
            outline: "none",
            fontSize: "13px",
            fontFamily: GlobalVariables.defaultFontFamily,
        } as React.CSSProperties;

        const styleInput = {
            backgroundColor: "rgba(0,0,0,0)",
            width: "45%",
            border: "solid 1px rgb(190, 190, 190)",
            paddingLeft: "6px",
            outline: "none",
            fontSize: "13px",
            background: "white",
            boxSizing: "border-box",
            fontFamily: GlobalVariables.defaultFontFamily,
        } as React.CSSProperties;

        const styleDiv = {
            width: "45%",
            border: "solid 1px rgba(190, 190, 190, 0)",
            paddingLeft: "6px",
            outline: "none",
            fontSize: "13px",
            boxSizing: "border-box",
            fontFamily: GlobalVariables.defaultFontFamily,
        } as React.CSSProperties;

        if (isEditing) {
            return (
                <div style={style}>
                    <input
                        style={styleInput}
                        value={localItemValue[0]}
                        onChange={(event: any) => {
                            event.preventDefault();
                            setLocalItemValue([event.target.value, localItemValue[1]]);
                        }}
                    ></input>{" "}
                    <input
                        style={styleInput}
                        value={localItemValue[1]}
                        onChange={(event: any) => {
                            event.preventDefault();
                            setLocalItemValue([localItemValue[0], event.target.value]);
                        }}
                    ></input>{" "}
                </div>
            );
        } else {
            return (
                <div style={style}>
                    <div
                        style={styleDiv}
                    >
                        {localItemValue[0]}
                    </div>
                    <div
                        style={styleDiv}
                    >
                        {localItemValue[1]}
                    </div>
                </div>
            );
        }
    };

    /**
     * The controls buttons on each item for map and array property
     */
    private _ElementArrayAndMapPropertyValueItemControls = ({ propertyValue, index, isEditing, setIsEditing, setLocalItemValue, localItemValue, refSubElement }: any) => {

        const deleteItem = () => {
            propertyValue.splice(index, 1);
            this._forceUpdatePage();
        };

        const moveUp = () => {
            if (index === 0) {
                return;
            } else {
                const itemValue = propertyValue[index];
                propertyValue.splice(index, 1);
                propertyValue.splice(index - 1, 0, itemValue);
            }
            this._forceUpdatePage();
        };

        const moveDown = () => {
            if (index === propertyValue.length - 1) {
                return;
            } else {
                const itemValue = propertyValue[index];
                propertyValue.splice(index, 1);
                propertyValue.splice(index + 1, 0, itemValue);
            }
            this._forceUpdatePage();
        };

        return (
            isEditing ?
                <div
                    // ref={refSubElement}
                    style={{
                        display: "inline-flex",
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
                            setIsEditing(false);
                            this._forceUpdatePage();
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
                            setIsEditing(false);
                            this._forceUpdatePage();
                        }}
                    >
                        Cancel
                    </ElementRectangleButton>
                </div>
                :
                <div
                    style={{
                        display: "none",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                    ref={refSubElement}
                >
                    <ElementArrayPropertyItemRight
                        onClick={() => {
                            setIsEditing(true);
                            this._forceUpdatePage();
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
        )
    }


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
        GlobalMethods.insertToObject(newName, value, obj, index);
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

    resetLocalProfile = () => {
        this.setLocalProfile({ undefined: "I am not defined yet" });
    }

    getOrigProfileName = () => {
        return this._origProfileName;
    };
    setOrigProfileName = (newName: string) => {
        this._origProfileName = newName;
    }

    getSelectedCategoryDescription = () => {
        const selectedCategoryName = this.getSelectedCategoryName();
        const selectedCategoryContents = this.getLocalProfile()[selectedCategoryName];
        if (selectedCategoryContents === undefined) {
            return "";
        }
        for (let itemName of Object.keys(selectedCategoryContents)) {
            if (itemName.startsWith("DESCRIPTION_")) {
                const id = itemName.split("_")[1];
                if (uuidValidate(id)) {
                    return selectedCategoryContents[itemName];
                }
            }
        }
        return "";
    };

    setSelectedCategoryDescription = (newDescription: string) => {
        const selectedCategoryName = this.getSelectedCategoryName();
        const selectedCategoryContents = this.getLocalProfile()[selectedCategoryName];
        if (selectedCategoryContents === undefined) {
            return;
        }
        for (let itemName of Object.keys(selectedCategoryContents)) {
            if (itemName.startsWith("DESCRIPTION_")) {
                const id = itemName.split("_")[1];
                if (uuidValidate(id)) {
                    selectedCategoryContents[itemName] = newDescription;
                    return;
                }
            }
        }
    };

    getNewArrayPropertyItemAddress = () => {
        return this.newArrayPropertyItemAddress;
    }
    setNewArrayPropertyItemAddress = (newAddress: string[]) => {
        this.newArrayPropertyItemAddress = newAddress;
    }
}
