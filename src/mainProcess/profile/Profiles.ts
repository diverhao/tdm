import fs from "fs";
import path from "path";
import { Profile } from "./Profile";
import { v4 as uuidv4, validate as uuidValidate } from "uuid";
const fetch = (...args: any[]) => import("node-fetch").then(({ default: fetch }: any) => fetch(...(args as any)));
import { Log } from "../log/Log";
import { FileReader } from "../file/FileReader";

/**
 * Represents the profiles contained in the JSON-style file. If the file cannot be read/written, the profiles are always
 * manipulated in memory.
 */
export class Profiles {
    private _profiles: Record<string, Profile> = {};
    private _filePath: string = "";
    private _selectedProfileName: string = "";

    constructor(filePath: string, profilesJson: Record<string, any>) {
        this.updateProfiles(filePath, profilesJson);
    }

    updateProfiles = (filePath: string, profilesJson: Record<string, any>) => {
        this._filePath = filePath;
        for (let profileName in profilesJson) {
            this._profiles[profileName] = new Profile(profileName, profilesJson[profileName]);
        }
    }


    createProfiles = (filePath: string) => {
        const profilesJson = Profiles.readProfilesJsonSync(filePath);
        if (profilesJson !== undefined) {
            this.updateProfiles(filePath, profilesJson);
        } else {
            // file does not exist
            // test if file can be created 
            try {
                // (3)
                fs.mkdirSync(path.dirname(filePath), { recursive: true });
                fs.openSync(filePath, "wx");
                this.updateProfiles(filePath, {});
                this.save();
            } catch (e) {
                // (4)
                // re-throw
                throw new Error("File does not exist and cannot be created.");
            }
        }
    }


    // --------------------- read file -----------------------------------


    /**
     * Read profiles file in synchronous manner. The profile is validated.
     * 
     * @returns the profiles json object if the file exists and is valid, otherwise `undefined`
     */
    static readProfilesJsonSync = (filePath: string): Record<string, any> | undefined => {
        // test if file exists
        const fileExists = fs.existsSync(filePath);
        if (fileExists) {
            try {
                // (1)
                let profilesJson: Record<string, any> = FileReader.readJSONsync(filePath, false);
                // throws an exception, re-throw below
                Profiles.validateProfiles(profilesJson);
                return profilesJson
            } catch (e) {
                // (2)
                return undefined;
            }
        } else {
            return undefined;
        }
    };


    /**
     * Save profiles <br>
     *
     * It must have a valid .filePath field, otherwise it will refuse to save.
     * @throws {Error<string>} when the Profile is not associated with any file (in-memory) or 
     * when there is an error saving file.
     */
    save = () => {
        if (this.getFilePath() === "") {
            const errMsg = "This Profiles is not associated with any file.";
            throw new Error(errMsg);
        } else {
            try {
                fs.writeFileSync(this.getFilePath(), JSON.stringify(this.serialize(), null, 4));
            } catch (e) {
                const errMsg = `Cannot save Profiles to ${this.getFilePath()}.`;
                throw new Error(errMsg);
            }
        }
    };

    // ------------------ validate JSON -----------------

    /**
     * Check profiles JSON object <br>
     *
     * profiles --> profile --> category --> entry
     *
     * Example format:
     *    .
     *    ├── profile_1
     *    │   ├── EPICS Custom Environment
     *    │   │   ├── DESCRIPTION_3439f8f9-0010-4d60-ba8b-5a01fbfd4830: "The customized EPICS environment"
     *    │   │   ├── Default Search Paths
     *    │   │   │   ├── DESCRIPTION: "Default search path"
     *    │   │   │   └── value: ["./", "/home/ringop/opi/"]
     *    │   │   └── Default TDL Files
     *    │   │       ├── DESCRIPTION: "tdl files that are opened upon the profile is selected."
     *    │   │       └── value: ["./rf/rfAll.tdl", "/home/ringphy/test01.tdl", "magnetAll.tdl"]
     *    │   ├── EPICS Environment
     *    │   │   ├── DESCRIPTION_3439f8f9-0010-4d60-ba8b-5a01fbfd4830: "The basic EPICS environment"
     *    │   │   ├── EPICS_CA_ADDR_LIST
     *    │   │   │   ├── DESCRIPTION: "The hosts for PV name search"
     *    │   │   │   └── value: ["192.168.1.1", "linac.fel.duke.edu", "10.1.20.255"]
     *    │   │   └── EPICS_CA_AUTO_ADDR_LIST: ""
     *    │   │       ├── DESCRIPTION: "If the "broadcast addresses are used in the PV name search. [Yes|No]"
     *    │   │       └── value: "Yes"
     *    │   └── SQL Database
     *    │       ├── DESCRIPTION_3439f8f9-0010-4d60-ba8b-5a01fbfd4830: "SQL database configuration."
     *    │       ├── IP_Address
     *    │       │   ├── DESCRIPTION: "SQL server IP address"
     *    │       │   └── value: "1.2.3.4"
     *    │       └── Users
     *    │           ├── DESCRIPTION: "Database users"
     *    │           └── value: ["John Doe", "Jane Doe"]
     *    ├── profile_2 ...
     *    └── profile_3 ...
     *
     * @param {Record<string, any>} profilesJSON The JSON format profiles
     * @throws {Error<string>} when the format is wrong
     */
    static validateProfiles = (profilesJSON: Record<string, any>) => {
        for (let profileName of Object.keys(profilesJSON)) {
            const profile = profilesJSON[profileName];
            if (typeof profile !== "object") {
                const errMsg = `Profile ${profileName} is not an object.`;
                throw new Error(errMsg);
            }
            this.validateProfile(profileName, profile);
        }
    };

    static validateProfile = (profileName: string, profile: Record<string, any>) => {
        for (let categoryName of Object.keys(profile)) {
            const category = profile[categoryName];
            if (typeof category !== "object") {
                const errMsg = `Profile ${profileName}'s category ${categoryName} is not an object.`;
                throw new Error(errMsg);
            }
            this.validateCategory(categoryName, category);
        }
    };

    static validateCategory = (categoryName: string, category: Record<string, any>) => {
        let hasDescription = false;

        for (let entryName of Object.keys(category)) {
            const entry = category[entryName];
            // a description
            if (entryName.includes("DESCRIPTION_") && uuidValidate(entryName.split("_")[1])) {
                hasDescription = true;
                if (typeof entry !== "string") {
                    const errMsg = `Category ${categoryName}'s description is not a string.`;
                    throw new Error(errMsg);
                }
            }
            // a regular entry
            else {
                if (typeof entry !== "object") {
                    const errMsg = `Category ${categoryName}'s entry ${entryName} is not an object.`;
                    throw new Error(errMsg);
                }
                this.validateEntry(entryName, entry);
            }
        }
        if (!hasDescription) {
            const descriptionName = `DESCRIPTION_${uuidv4()}`;
            category[descriptionName] = "Put your description here.";
        }
    };

    static validateEntry = (entryName: string, entry: Record<string, any>) => {
        let hasDescription = false;
        for (let key of Object.keys(entry)) {
            if (key === "value") {
                const val = entry[key];
                this.validateVal(entryName, val);
            } else if (key === "DESCRIPTION") {
                hasDescription = true;
                const val = entry[key];
                if (typeof val !== "string") {
                    const errMsg = `Entry ${entryName}'s description is not a string.`;
                    Log.error('-1', errMsg);
                    // throw new Error(errMsg);
                }
            } else if (key === "type") {
                const val = entry[key];
                if (typeof val !== "string") {
                    const errMsg = `Entry ${entryName}'s type is not a string.`;
                    Log.error('-1', errMsg);
                    // throw new Error(errMsg);
                }
            } else if (key === "choices") {
                const val = entry[key];
                if (!Array.isArray(val)) {
                    const errMsg = `Entry ${entryName}'s choices is not a string array.`;
                    Log.error('-1', errMsg);
                    // throw new Error(errMsg);
                }
            } else {
                const errMsg = `Entry ${entryName} should not have a ${key} property.`;
                Log.error('-1', errMsg);
                // no need to throw
                // throw new Error(errMsg);
            }
        }
        if (!hasDescription) {
            entry["DESCRIPTION"] = "Put your description here.";
        }
    };

    static validateVal = (entryName: string, val: any) => {
        if (!(Array.isArray(val) || typeof val === "string")) {
            const errMsg = `Entry ${entryName}'s value is not a string or array.`;
            throw new Error(errMsg);
        }

        if (Array.isArray(val)) {
            for (let element of val) {
                if (typeof element !== "string" && !Array.isArray(element)) {
                    const errMsg = `Entry ${entryName}'s value is not a string array.`;
                    throw new Error(errMsg);
                }
            }
        }
    }

    // ------------------ getters -----------------------

    /**
     * Get the Profile object
     *
     * @param {string} name Profile name. Returns `undefined` when  such profile does not exist.
     */
    getProfile = (name: string): Profile | undefined => {
        return this._profiles[name];
    };

    getFirstProfile = (): Profile | undefined => {
        const profileNames = Object.keys(this._profiles);
        if (profileNames.length >= 2) {
            // the first "profile" is 
            return this._profiles[profileNames[1]];
        } else {
            return undefined;
        }
    };

    getFirstProfileName = (): string => {
        const profileNames = Object.keys(this._profiles);
        if (profileNames.length >= 2) {
            // the first "profile" is
            return profileNames[1];
        } else {
            return "";
        }
    };

    /**
     * Get the selected profile name
     *
     * @returns {string} Selected profile name. If no profile is selected, returns empty string
     */
    getSelectedProfileName = (): string => {
        return this._selectedProfileName;
    };

    setSelectedProfileName = (name: string) => {
        if (this.getProfile(name) === undefined) {
            const errMsg = `No such a profile ${name}`;
            throw new Error(errMsg);
        }
        this._selectedProfileName = name;
    }

    /**
     * Get the selected Profile object
     *
     * @returns {Profile | undefined} If selected profile does not exist or no profile is selected, returns `undefined`
     */
    getSelectedProfile = (): Profile | undefined => {
        return this._profiles[this._selectedProfileName];
    };

    /**
     * Get the
     */
    getProfiles = (): Record<string, Profile> => {
        return this._profiles;
    };

    /**
     * get Profile names
     */
    getProfileNames = (): string[] => {
        return Object.keys(this._profiles);
    };

    getLogFile = () => {
        try {
            const profile = this.getProfile("For All Profiles");
            const logfile = profile?.getEntry("Log", "General Log File");
            if (logfile !== undefined) {
                return logfile
            } else {
                return "";
            }
        } catch (e) {
            return "";
        }
    }

    /**
     * Serialize the profiles. <br>
     * 
     * If a default profile category is not in the current profile, add it.
     */
    serialize = (): Record<string, Record<string, any>> => {
        const profilesObj: Record<string, Record<string, any>> = {};
        const defaultGeneralProfile = Profile.generateDefaultProfile();


        // if the input JSON object does not have "For All Profiles" profile, add one in the beginning
        if (Object.keys(this._profiles).includes("For All Profiles") === false) {
            const forAllProfilesProfileObj = Profile.generateForAllProfilesProfile();
            profilesObj["For All Profiles"] = forAllProfilesProfileObj;
        }


        for (const profileName in this._profiles) {
            const profile = this._profiles[profileName];
            let profileObj = JSON.parse(JSON.stringify(profile.getContents()));

            // special case: "For All Profiles" profile
            if (profileName === "For All Profiles") {
                // do not merge with default profile, it is not a real profile
            } else {

                let defaultProfile = JSON.parse(JSON.stringify(defaultGeneralProfile));

                // special one: only keep "About" and "SSH Configuration" categories
                for (let categoryName of Object.keys(defaultProfile)) {
                    const defaultCategoryContents = defaultProfile[categoryName];
                    if (profileObj[categoryName] !== undefined) {
                        profileObj[categoryName] = { ...defaultCategoryContents, ...profileObj[categoryName] };
                    } else {
                        if (categoryName === "About") {
                            profileObj = { "About": defaultCategoryContents, ...profileObj };
                        } else {
                            profileObj[categoryName] = { ...defaultCategoryContents };
                        }
                    }
                }
            }
            profilesObj[profileName] = profileObj;
        }


        // make a hard copy
        return JSON.parse(JSON.stringify(profilesObj));
    };

    getFilePath = () => {
        return this._filePath;
    };
}
