import { v4 as uuidv4, validate as uuidValidate } from "uuid";

export class Profile {
    private _contents: Record<string, any>;
    _name: string;
    private _isSshConfig: boolean = false;

    constructor(name: string, contents: Record<string, any>) {
        this._contents = contents;
        this._name = name;
        // the profile may be an ssh config
        if (Object.keys(contents).includes("SSH Configuration")) {
            this._isSshConfig = true;
        }
    }


    convertToTcaInput = (): Record<string, any> => {
        const contentsCopy = JSON.parse(JSON.stringify(this._contents));

        for (let categoryName of Object.keys(this._contents)) {
            const category = this._contents[categoryName];
            const categoryCopy = contentsCopy[categoryName];

            for (const entryName of Object.keys(category)) {
                if (entryName.includes("DESCRIPTION_") && uuidValidate(entryName.split("_")[1])) {
                    delete categoryCopy[entryName];
                    continue;
                }

                const entry = category[entryName]["value"];

                // convert number/string array to string separated by space
                if (Array.isArray(entry)) {
                    let result = "";
                    for (let ii = 0; ii < entry.length; ii++) {
                        let elementRaw = entry[ii];
                        // special case: if the user sets "DO NOT SET" for the following properties,
                        //               replace it to an invalid IP address 0.0.0.0.0 so that this
                        //               property is ignored. 
                        if (entryName === "EPICS_CA_ADDR_LIST"
                            || entryName === "EPICS_PVA_ADDR_LIST"
                            || entryName === "EPICS_CA_NAME_SERVERS"
                            || entryName === "EPICS_PVA_NAME_SERVERS"
                        ) {
                            if (elementRaw === "DO NOT SET") {
                                elementRaw = "0.0.0.0.0";
                            }
                        }
                        const element = elementRaw.toString();
                        result = `${result} ${element}`;
                    }
                    categoryCopy[entryName] = result.trim();
                } else {
                    // convert number/string to string
                    categoryCopy[entryName] = entry.toString().trim();
                }
            }
        }
        return contentsCopy;
    };

    getContents = () => {
        return this._contents;
    };
    getName = () => {
        return this._name;
    };

    getSearchPaths = (): string[] | undefined => {
        return this._contents["EPICS Custom Environment"]["Default Search Paths"]["value"];
    };

    toIpcMessage = (): Record<string, any> => {
        let tmp: Record<string, any> = {};
        tmp[this._name] = this._contents;
        return { tmp };
    };

    getCategory = (categoryName: string) => {
        return this._contents[categoryName];
    };

    getMacros = () => {
        const macros = this._contents["EPICS Custom Environment"]["Macros"];
        if (macros === undefined) {
            return []
        } else {
            return macros["value"];
        }
    }

    getMode = () => {
        const mode = this._contents["EPICS Custom Environment"]["Default Mode"];
        if (mode === undefined) {
            return "operating";
        } else {
            return mode["value"];
        }
    }

    getManuallyOpenedTdlMode = () => {
        const mode = this._contents["EPICS Custom Environment"]["Manually Opened TDL Mode"];
        if (mode === undefined) {
            return "operating";
        } else {
            return mode["value"];
        }
    }

    getEditable = () => {
        const editable = this._contents["EPICS Custom Environment"]["Editable"];
        if (editable === undefined) {
            return false;
        } else {
            return editable["value"] === "Yes" ? true : false;
        }
    }

    getManuallyOpenedTdlEditable = () => {
        const editable = this._contents["EPICS Custom Environment"]["Manually Opened TDL Editable"];
        if (editable === undefined) {
            return false;
        } else {
            return editable["value"] === "Yes" ? true : false;
        }
    }

    getEntry = (categoryName: string, entryName: string) => {
        const category = this.getCategory(categoryName);
        if (category !== undefined) {
            const entry = category[entryName];
            if (entry !== undefined) {
                return entry["value"];
            }
        }
        return undefined;
    };


    getLdapUri = () => {
        return this.getEntry("Web Server", "LDAP URI");
    }


    getLdapBindCredentials = () => {
        return this.getEntry("Web Server", "LDAP Bind Credential");
    }

    getLdapSearchBase = () => {
        return this.getEntry("Web Server", "LDAP Search Base");
    }
    getLdapSearchFilter = () => {
        return this.getEntry("Web Server", "LDAP Search Filter");
    }
    getLdapSearchScope = () => {
        return this.getEntry("Web Server", "LDAP Search Scope");
    }

    getLdapDistinguishedName = () => {
        return this.getEntry("Web Server", "LDAP Distinguished Name");
    }

    getHttpsKeyFile = () => {
        return this.getEntry("Web Server", "Https Key File");
    }

    getHttpsCertificate = () => {
        return this.getEntry("Web Server", "Https Certificate");
    }

    getEpicsLogLevel = () => {
        return this.getEntry("EPICS Custom Environment", "EPICS Log Level");
    }

    getDisablePut = () => {
        return this.getEntry("EPICS Custom Environment", "Disable PUT");
    }


    isSshConfig = () => {
        return this._isSshConfig;
    }

}
