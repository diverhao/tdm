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
                        const element = entry[ii].toString();
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

    getLdapDistinguishedName = () => {
        return this.getEntry("Web Server", "LDAP Distinguished Name");
    }

    getHttpsKeyFile = () => {
        return this.getEntry("Web Server", "Https Key File");
    }

    getHttpsCertificate = () => {
        return this.getEntry("Web Server", "Https Certificate");
    }

    isSshConfig = () => {
        return this._isSshConfig;
    }


    // all atomic data must be string type, e.g. "localhost", "42"
    static generateDefaultProfile = (): Record<string, any> => {
        return {
            "About": {
                "DESCRIPTION_3439f8f9-0010-4d60-ba8b-5a01fbfd4830": "Description of this profile.",
            },
            "EPICS Environment": {
                "DESCRIPTION_3439f8f9-0010-4d60-ba8b-5a01fbfd4830": "Basic EPIC Environment",
                "EPICS_CA_ADDR_LIST": { value: ["localhost"], DESCRIPTION: "Hosts where the EPICS data come from. Format: hostName, hostName:port, ipAddress, or ipAddress:port " },
                "EPICS_CA_AUTO_ADDR_LIST": { value: "Yes", DESCRIPTION: "Whether to search PV name in local network.", choices: ["Yes", "No"] },
            },
            "EPICS Custom Environment": {
                "DESCRIPTION_3439f8f9-0010-4d60-ba8b-5a01fbfd4830": "Custom EPICS environment.",
                "Default TDL Files": { value: [], DESCRIPTION: "Open these tdl files when this profile starts to run. It could be an absolute path, relative path, or a web path." },
                "Default Search Paths": { value: ["./", "$HOME"], DESCRIPTION: "Paths where TDM looks for the relative path tdl files. Note: web path is not honored in TDM." },
                // speical type for "Default Mode"
                "Default Mode": { value: "operating", DESCRIPTION: "Mode for default tdl files.", choices: ["operating", "editing"] },
                // manually opened displays and newly created blank displays are always editable
                "Editable": { value: "No", DESCRIPTION: "Whether the default TDL files and the TDLs opened from them are editable. The newly created TDL files are always editable.", choices: ["Yes", "No"] },
                // manually opened displays and newly created blank displays are always editable
                "Manually Opened TDL Editable": { value: "Yes", DESCRIPTION: "Whether the manually opened TDL files and the TDL opened from them are editable.", choices: ["Yes", "No"] },
                // manually opened displays and newly created blank displays are always editable
                "Manually Opened TDL Mode": { value: "operating", DESCRIPTION: "The mode for manually opened TDL files.", choices: ["operating", "editing"] },
                // speical type for "Macros"
                Macros: { value: [], DESCRIPTION: "Macros for default tdl files. Left column is the macro name, right column is the macro value.", type: "[string,string][]" },
                "Log file": { value: " ", DESCRIPTION: "Logs of this profile are written to this file. If empty, the logs are output to default output device." },
                "Video Saving Folder": { value: " ", DESCRIPTION: "Save video files to this folder. Default is HOME folder." },
                "Image Saving Folder": { value: " ", DESCRIPTION: "Automatically save image files to this folder. Default is HOME folder." },
                "Python Command": { value: "python3", DESCRIPTION: "The python command for running script attached to the display windows. You can add options to it." }
            },
            "Preset Colors": {
                "DESCRIPTION_3439f8f9-0010-4d60-ba8b-5a01fbfd4830": "Colors.",
                Background: { value: ["255", "255", "255", "100"], DESCRIPTION: "Background color" },
                Attention: { value: ["255", "160", "0", "100"], DESCRIPTION: "Attention color" },
                "Button Background": { value: ["210", "210", "210", "100"], DESCRIPTION: "Button's background color" },
                Disconnected: { value: ["200", "0", "200", "80"], DESCRIPTION: "color" },
                Invalid: { value: ["255", "0", "255", "100"], DESCRIPTION: "color" },
                Major: { value: ["255", "0", "0", "100"], DESCRIPTION: "color" },
                Minor: { value: ["255", "128", "0", "100"], DESCRIPTION: "color" },
                Off: { value: ["60", "100", "60", "100"], DESCRIPTION: "color" },
                OK: { value: ["0", "255", "0", "100"], DESCRIPTION: "color" },
                On: { value: ["0", "255", "0", "100"], DESCRIPTION: "color" },
                "Read Background": { value: ["240", "240", "240", "100"], DESCRIPTION: "color" },
                Stop: { value: ["255", "0", "0", "100"], DESCRIPTION: "color" },
                Text: { value: ["0", "0", "0", "100"], DESCRIPTION: "color" },
                "Write Background": { value: ["128", "255", "255", "100"], DESCRIPTION: "color" },
                "Header Background": { value: ["77", "77", "77", "100"], DESCRIPTION: "color" },
                "Header Foreground": { value: ["255", "255", "255", "100"], DESCRIPTION: "color" },
                "Active Text": { value: ["255", "255", "0", "100"], DESCRIPTION: "color" },
                Grid: { value: ["128", "128", "128", "100"], DESCRIPTION: "color" },
            },
        };
    };

    // all atomic data must be string type, e.g. "localhost", "42"
    static generateDefaultSshProfile = () => {
        return {
            "About": {
                "DESCRIPTION_3439f8f9-0010-4d60-ba8b-5a01fbfd4830": "This is an SSH profile, it will load profiles on remote ssh.",
            },
            ...this.generateDefaultSshCategory(),
        };
    };
    static generateDefaultSshCategory = () => {
        return {
            "SSH Configuration": {
                "DESCRIPTION_3439f8f9-0010-4d60-ba8b-5a01fbfd4830": "Configurations for SSH connection. Do not change this category name",
                "Host Name/IP Address": {
                    value: "1.2.3.4",
                    DESCRIPTION: "Host name or IP address of the ssh host, cannot be empty."
                },
                "Port": {
                    value: "22",
                    DESCRIPTION: "SSH port, its value is usually 22",
                },
                "User Name": {
                    value: "username",
                    DESCRIPTION: "User name to login the SSH host",
                },
                "TDM Command": {
                    value: "tdm",
                    DESCRIPTION: "The command to be executed upon ssh login, usually tdm binary"
                },
                "Private Key File": {
                    value: "/path/to/private/key",
                    DESCRIPTION: "Private key to login",
                }
            },
        };
    };

    static generateWebServerCategory = () => {
        return {
            "Web Server": {
                "DESCRIPTION_691a2740-e41f-4dac-94d8-d614af03d100": "The web server configurations.",
                "LDAP URI": {
                    "DESCRIPTION": "LDAP URI.",
                    "value": "ldap://localhost:3890"
                },
                "LDAP Distinguished Name": {
                    "DESCRIPTION": "User's distinguished name. The ${username} will be replaced with the user's input user name.",
                    "value": "uid=${username},ou=users,dc=example,dc=com"
                },
                "Https Key File": {
                    "DESCRIPTION": "HTTPS key file.",
                    "value": "/path/to/server.key"
                },
                "Https Certificate": {
                    "DESCRIPTION": "HTTPS certificate.",
                    "value": "/path/to/server.cert"
                }
            },
        }
    }
}
