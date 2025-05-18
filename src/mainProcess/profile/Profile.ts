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

    static generateForAllProfilesProfile = (): Record<string, any> => {
        return (
            {
                "About": {
                    "DESCRIPTION_3439f8f9-0010-4d60-ba8b-5a01fbfd4830": "This is not a profile. It contains the information that is independent from any profile."
                },
                "Log": {
                    "DESCRIPTION_5f17d09e-fc05-43f2-88a2-d8f989b00c6b": "For log",
                    "General Log File": {
                        "value": " ",
                        "DESCRIPTION": "Logs of this profile are written to this file. If empty, the logs are output to default output device."
                    }
                }

            }
        )
    };

    // all atomic data must be string type, e.g. "localhost", "42"
    static generateDefaultProfile = (): Record<string, any> => {
        return {
            "About": {
                "DESCRIPTION_3439f8f9-0010-4d60-ba8b-5a01fbfd4830": "Description of this profile.",
            },
            "EPICS CA Settings": {
                "DESCRIPTION_5f17d09e-fc05-43f2-88a2-d8f989b00c60": "EPICS Channel Access Settings. If you want to ignore a property defined by user, set its value to \"DO NOT SET\" (quotes not included).",
                "EPICS_CA_ADDR_LIST": {
                    "DESCRIPTION": "Computers that the TDM searches for the EPICS channels. If you want to ignore the setting, set one entry to \"DO NOT SET\" (quotes not included).",
                    "value": [
                        "DO NOT SET"
                    ]
                },
                "EPICS_CA_AUTO_ADDR_LIST": {
                    "DESCRIPTION": "Whether to search EPICS channels in local network using broadcast address.",
                    "value": "YES",
                    "choices": [
                        "YES",
                        "NO",
                        "DO NOT SET"
                    ]
                },
                "EPICS_CA_NAME_SERVERS": {
                    "DESCRIPTION": "This variable is not used in epics-tca.",
                    "value": [
                        "DO NOT SET"
                    ]
                },
                "EPICS_CA_CONN_TMO": {
                    "DESCRIPTION": "If the client has not seen a beacon from EPICS IOC for EPICS_CA_CONN_TMO seconds, send an echo message.",
                    "value": "DO NOT SET"
                },
                "EPICS_CA_BEACON_PERIOD": {
                    "DESCRIPTION": "The maximum period for beacons sent from EPICS IOC. This property is not used by epics-tca.",
                    "value": "DO NOT SET"
                },
                "EPICS_CA_REPEATER_PORT": {
                    "DESCRIPTION": "The Channel Access repeater port used by epics-tca. If there is another CA repeater running, this setting is ignored.",
                    "value": "DO NOT SET"
                },
                "EPICS_CA_SERVER_PORT": {
                    "DESCRIPTION": "The port that the EPICS IOC uses for data transmission. This port also serves as the UDP channel search port. This setting is not used by epics-tca.",
                    "value": "DO NOT SET"
                },
                "EPICS_CA_MAX_ARRAY_BYTES": {
                    "DESCRIPTION": "The maximum size of the array for EPICS data. This property is not used by epics-tca.",
                    "value": "DO NOT SET"
                },
                "EPICS_CA_MAX_SEARCH_PERIOD": {
                    "DESCRIPTION": "The maximum search period (in unit of second) of the EPICS channel search.",
                    "value": "DO NOT SET"
                },
                "EPICS_TS_MIN_WEST": {
                    "DESCRIPTION": "Number of positive minutes west of GMT. This setting is not used by epics-tca.",
                    "value": "DO NOT SET"
                }
            },
            "EPICS PVA Settings": {
                "DESCRIPTION_099a9c8f-23ec-4b21-ae76-5dfb78e6ea6f": "EPICS PV Access Settings. If you want to ignore a property defined by user, set its value to \"DO NOT SET\" (quotes not included).  ",
                "EPICS_PVA_ADDR_LIST": {
                    "DESCRIPTION": "The computers that the epics-tca searches for the channels.",
                    "value": [
                        "DO NOT SET"
                    ]
                },
                "EPICS_PVA_AUTO_ADDR_LIST": {
                    "DESCRIPTION": "Whether to search the PVA channel in local network through broadcast address.",
                    "value": "DO NOT SET",
                    "choices": [
                        "YES",
                        "NO",
                        "DO NOT SET"
                    ]
                },
                "EPICS_PVA_SERVER_PORT": {
                    "DESCRIPTION": "The port that EPICS IOC uses for data transmission. epics-tca does not this setting.",
                    "value": "DO NOT SET"
                },
                "EPICS_PVA_BROADCAST_PORT": {
                    "DESCRIPTION": "The epics-tca listens to this port for beacons from IOC. This port also serves as the UDP channel search port.",
                    "value": "DO NOT SET"
                },
                "EPICS_PVA_CONN_TMO": {
                    "DESCRIPTION": "If the epics-tca has not received beacon for this time, send an echo message.",
                    "value": "DO NOT SET"
                },
                "EPICS_PVA_NAME_SERVERS": {
                    "DESCRIPTION": "Name servers for channel search. epics-tca does not use this setting.",
                    "value": [
                        "DO NOT SET"
                    ]
                },
                "EPICS_PVA_BEACON_PERIOD": {
                    "DESCRIPTION": "The maximum period for beacons sent from IOC.",
                    "value": "DO NOT SET"
                }
            },
            "epics-tca Settings": {
                "DESCRIPTION_2df940c1-e4e6-45f2-a243-c696e5aae3e7": "Settings for the epics-tca library. This library is the backend of the Channel Access and PV Access.",
                "EPICS_CA_MIN_SEARCH_PERIOD": {
                    "DESCRIPTION": "The minimum search period (in unit of second) for a channel. Making it larger will relieve the network traffic.",
                    "value": "DO NOT SET"
                },
                "EPICS_CA_GET_TIMEOUT_DEFAULT": {
                    "DESCRIPTION": "The default GET channel value time out. Unit is second. It is not currently used.",
                    "value": "DO NOT SET"
                },
                "EPICS_CA_SCHEDULING_PRIORITY_DEFAULT": {
                    "DESCRIPTION": "Default priority of CA channel scheduling. It is always 1.",
                    "value": "DO NOT SET"
                },
                "EPICS_CA_TCP_RE_SEARCH_CHAN_TIMESPAN": {
                    "DESCRIPTION": "This setting is not used in epics-tca. Unit is second.",
                    "value": "DO NOT SET"
                },
                "EPICS_CA_TCP_RE_SEARCH_CHAN_TIMEOUT": {
                    "DESCRIPTION": "This setting is currently not used in epics-tca. Unit is second.",
                    "value": "DO NOT SET"
                },
                "EPICS_CA_REPEATER_REGISTER_TIMEOUT": {
                    "DESCRIPTION": "Try to register this epics-tca client to CA repeater at this rate. Once the registration succeeds, it is ignored. Unit is second.",
                    "value": "DO NOT SET"
                },
                "EPICS_CA_TCP_INACTIVE_TIMEOUT": {
                    "DESCRIPTION": "If the TCP connection has no data after this time interval, send an echo. It is similar to EPICS_CA_CONN_TMO. But the later one relies on beacon. Unit is second.",
                    "value": "DO NOT SET"
                },
                "EPICS_CA_BEACON_TIMEOUT": {
                    "DESCRIPTION": "If the epics-tca has not received the beacon within this time interval, clear the resource for this beacon in epics-tca. It is just for saving resources, it does not affect the connection.",
                    "value": "DO NOT SET"
                },
                "EPICS_CA_MAX_UDP_BUFFER": {
                    "DESCRIPTION": "The maximum size of the UDP channel search packet. Unit is byte.",
                    "value": "DO NOT SET"
                },
                "EPICS_CA_REPEATER_CLIENT_CHECK_TIME": {
                    "DESCRIPTION": "Used by CA repeater to periodically check if the registered clients are still alive. If not, release the resource. Unit is second.",
                    "value": "DO NO TUSE"
                },
                "EPICS_CA_REPEATER_THREAD_CHECK_TIME": {
                    "DESCRIPTION": "Periodically check if the CA repeater is still alive. If not, (re)start the CA repeater. Unit is second.",
                    "value": "DO NOT SET"
                },
                "EPICS_PVA_MIN_SEARCH_PERIOD": {
                    "DESCRIPTION": "The minimum PVA channel search period. Unit is second.",
                    "value": "DO NOT SET"
                },
                "EPICS_PVA_MAX_SEARCH_PERIOD": {
                    "DESCRIPTION": "the maximum PVA channel search period.",
                    "value": "DO NOT SET"
                }
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
                "Disable PUT": {
                    "DESCRIPTION": "Whether to disable the PUT (like caput/pvput ...) operation for CA/PVA channels.",
                    "value": "NO",
                    "choices": [
                        "NO",
                        "YES",
                    ]
                },
                // speical type for "Macros"
                Macros: { value: [], DESCRIPTION: "Macros for default tdl files. Left column is the macro name, right column is the macro value.", type: "[string,string][]" },
                "EPICS Log Level": { value: "error", DESCRIPTION: "The log level for EPICS library (epics-tca).", choices: ["trace", "debug", "info", "warn", "error", "fatal"] },
                "Video Saving Folder": { value: " ", DESCRIPTION: "Automatically save video files to this folder. Fallback is HOME folder." },
                "Image Saving Folder": { value: " ", DESCRIPTION: "Automatically save image files to this folder. Fallback is HOME folder." },
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
                "LDAP Search Base": {
                    "DESCRIPTION": "Search base for the LDAP.",
                    "value": "ou=users,dc=example,dc=com"
                },
                "LDAP Search Filter": {
                    "DESCRIPTION": "Search filter for the LDAP. The ${username} will be replaced with the user's input user name.",
                    "value": "(uid={{username}})"
                },
                "LDAP Search Scope": {
                    "DESCRIPTION": "The search scope for LDAP.",
                    "value": "sub"
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


    static generateWebServerCategory_SNS = () => {
        return {
            "Web Server": {
                "DESCRIPTION_691a2740-e41f-4dac-94d8-d615af03d100": "The web server configurations for SNS control system.",
                "Authentication Method": {
                    "DESCRIPTION": "What authentication method to login the website.",
                    "value": "No authentication",
                    "choices": [
                        "No authentication",
                        "LDAP",
                    ]
                },
                "LDAP URI": {
                    "DESCRIPTION": "LDAP URI.",
                    "value": "ldaps://ldapu.ornl.gov"
                },
                "LDAP Distinguished Name": {
                    "DESCRIPTION": "User's distinguished name. The ${username} will be replaced with the user's input user name.",
                    "value": ""
                },
                "LDAP Search Base": {
                    "DESCRIPTION": "Search base for the LDAP.",
                    "value": "ou=Users,dc=ornl,dc=gov"
                },
                "LDAP Search Filter": {
                    "DESCRIPTION": "Search filter for the LDAP. The ${username} will be replaced with the user's input user name.",
                    "value": "(uid={{username}})"
                },
                "LDAP Search Scope": {
                    "DESCRIPTION": "The search scope for LDAP.",
                    "value": "sub"
                },
                "Https Key File": {
                    "DESCRIPTION": "HTTPS key file.",
                    "value": "/Users/1h7/projects2/javascript/test89-https-express/server.key"
                },
                "Https Certificate": {
                    "DESCRIPTION": "HTTPS certificate.",
                    "value": "/Users/1h7/projects2/javascript/test89-https-express/server.cert"
                }
            },
        }
    }

    static generateArchiveCategory_SNS = () => {
        return {
            "Archieve": {
                "DESCRIPTION_691a2740-e41f-4dac-94d8-d614ad03d100": "The SNS archive configurations.",
                "Oracle database username": {
                    "DESCRIPTION": "The user name for Oracle database.",
                    "value": "sns_reports"
                },
                "Oracle database password": {
                    "DESCRIPTION": "Password.",
                    "value": "You guess"
                },
                "Oracle database connection string": {
                    "DESCRIPTION": "Connection string.",
                    "value": "Guess again"
                }
            },
        }
    }

}
