
/**
 * Creates the default contents of the special "For All Profiles" entry in
 * `profiles.json`.
 *
 * This entry stores application-wide settings shared by every profile and is
 * not a visible profile. It currently contains the general log-file
 * configuration.
 *
 * @returns A new object containing the default application-wide settings.
 */
export const generateForAllProfilesProfile = (): Record<string, any> => {
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

/**
 * Creates the default configuration for a TDM profile.
 *
 * It can be used as the template for a new profile.
 * 
 * Primitive values are always represented as strings, for example `"localhost"` and `"42"`.
 * 
 * A "profiles.json" has 4 layers
 *  - profile
 *  - category
 *  - entry
 *  - DESCRIPTION, value, and other fields
 *
 * A value of an entry can be a
 *  - string, as long as the value is a primitive type data, like "42", "localhost"
 * 
 * @returns A new object containing the default profile configuration.
 */
export const generateDefaultProfile = (): Record<string, any> => {
    return {
        "About": {
            "DESCRIPTION_3439f8f9-0010-4d60-ba8b-5a01fbfd4830":
                "The default TDM profile includes the following configurable categories:\n\n" +
                " - EPICS CA Settings: Configures Channel Access channel discovery, connections, and network behavior.\n\n" +
                " - EPICS PVA Settings: Configures PV Access channel discovery, connections, and network behavior.\n\n" +
                " - epics-tca Settings: Provides advanced transport and timing options for the epics-tca client library.\n\n" +
                " - EPICS Custom Environment: Controls startup displays, channel behavior, file locations, macros, and external integrations.\n\n" +
                " - Preset Colors: Defines named RGBA colors available to displays and widgets.\n\n" +
                "You can also add or remove categories and fields to meet the needs of your application."
        },
        "EPICS CA Settings": {
            "DESCRIPTION_5f17d09e-fc05-43f2-88a2-d8f989b00c60": "EPICS Channel Access (CA) settings are applied in the following order of precedence, from lowest to highest: " +
                "EPICS defaults, operating-system environment variables, and user-defined values. Configure user-defined values here. " +
                "To ignore a user-defined property and allow a lower-priority value to apply, set it to \"DO NOT SET\" (without quotation marks).",
            "EPICS_CA_ADDR_LIST": {
                "DESCRIPTION": "Network destinations used to search for EPICS Channel Access channels. Each entry may be a host name or IP address, "
                    + "optionally followed by a port. To ignore this user-defined list and use a lower-priority setting, set its only entry to \"DO NOT SET\" (without quotation marks).",
                "value": [
                    "DO NOT SET"
                ]
            },
            "EPICS_CA_AUTO_ADDR_LIST": {
                "DESCRIPTION": "Controls whether TDM automatically searches local-network broadcast addresses for EPICS Channel Access channels. Choose \"YES\" to enable this behavior, \"NO\" to disable it, or \"DO NOT SET\" to use a lower-priority setting.",
                "value": "YES",
                "choices": [
                    "YES",
                    "NO",
                    "DO NOT SET"
                ]
            },
            "EPICS_CA_CONN_TMO": {
                "DESCRIPTION": "The number of seconds the Channel Access client waits without receiving a beacon from an IOC before sending a TCP echo request to verify the connection.",
                "value": "DO NOT SET"
            },
            "EPICS_CA_MAX_ARRAY_BYTES": {
                "DESCRIPTION": "The maximum array-transfer size, in bytes, for Channel Access data. This setting is retained for configuration compatibility but is not currently used by epics-tca.",
                "value": "DO NOT SET"
            },
            "EPICS_CA_MAX_SEARCH_PERIOD": {
                "DESCRIPTION": "The maximum interval, in seconds, between repeated searches for an unresolved Channel Access channel. Search intervals increase up to this limit.",
                "value": "DO NOT SET"
            },
            "EPICS_TS_MIN_WEST": {
                "DESCRIPTION": "The local time-zone offset expressed as minutes west of GMT, as used by legacy EPICS timestamps. This setting is retained for compatibility but is not currently used by epics-tca.",
                "value": "DO NOT SET"
            },
            "EPICS_CA_REPEATER_PORT": {
                "DESCRIPTION": "The UDP port used by the local Channel Access repeater to receive IOC beacons and client registrations. The default port is 5065. If another repeater is already listening on this port, epics-tca uses the existing repeater.",
                "value": "DO NOT SET"
            },
            "EPICS_CA_NAME_SERVERS": {
                "DESCRIPTION": "Addresses of EPICS Channel Access name servers for channel discovery. This setting is retained for configuration compatibility but is not currently used by epics-tca.",
                "value": [
                    "DO NOT SET"
                ]
            },
            "EPICS_CA_BEACON_PERIOD": {
                "DESCRIPTION": "The expected maximum interval, in seconds, between beacons from a Channel Access IOC. epics-tca uses this interval when checking inactive TCP connections.",
                "value": "DO NOT SET"
            },
            "EPICS_CA_SERVER_PORT": {
                "DESCRIPTION": "The default UDP destination port for Channel Access search requests when an address does not specify a port. It is also the standard TCP port for Channel Access servers. The default port is 5064.",
                "value": "DO NOT SET"
            },
        },
        "EPICS PVA Settings": {
            "DESCRIPTION_099a9c8f-23ec-4b21-ae76-5dfb78e6ea6f": "EPICS PV Access (PVA) settings are applied in the following order of precedence, from lowest to highest: " +
                "EPICS defaults, operating-system environment variables, and user-defined values. Configure user-defined values here. " +
                "To ignore a user-defined property and allow a lower-priority value to apply, set it to \"DO NOT SET\" (without quotation marks).",
            "EPICS_PVA_ADDR_LIST": {
                "DESCRIPTION": "Network destinations used to search for PV Access channels. Each entry may be a host name or IP address, optionally followed by a port. To ignore this user-defined list and use a lower-priority setting, set its only entry to \"DO NOT SET\" (without quotation marks).",
                "value": [
                    "DO NOT SET"
                ]
            },
            "EPICS_PVA_AUTO_ADDR_LIST": {
                "DESCRIPTION": "Controls whether TDM automatically searches local-network broadcast addresses for PV Access channels. Choose \"YES\" to enable this behavior, \"NO\" to disable it, or \"DO NOT SET\" to use a lower-priority setting.",
                "value": "DO NOT SET",
                "choices": [
                    "YES",
                    "NO",
                    "DO NOT SET"
                ]
            },
            "EPICS_PVA_SERVER_PORT": {
                "DESCRIPTION": "The default TCP port used by PV Access servers. The standard port is 5075. This client-side setting is retained for compatibility but is not currently used by epics-tca.",
                "value": "DO NOT SET"
            },
            "EPICS_PVA_BROADCAST_PORT": {
                "DESCRIPTION": "The UDP port used for PV Access channel-search requests and IOC beacons. epics-tca sends searches to and listens for beacons on this port. The default port is 5076.",
                "value": "DO NOT SET"
            },
            "EPICS_PVA_CONN_TMO": {
                "DESCRIPTION": "The PV Access TCP inactivity timeout, in seconds. epics-tca sends periodic echo requests and closes an unresponsive connection after this timeout is exceeded.",
                "value": "DO NOT SET"
            },
            "EPICS_PVA_NAME_SERVERS": {
                "DESCRIPTION": "Addresses of PV Access name servers for channel discovery. This setting is retained for configuration compatibility but is not currently used by epics-tca.",
                "value": [
                    "DO NOT SET"
                ]
            },
            "EPICS_PVA_BEACON_PERIOD": {
                "DESCRIPTION": "The expected maximum interval, in seconds, between beacons from a PV Access IOC. This setting is retained for compatibility but is not currently used by epics-tca.",
                "value": "DO NOT SET"
            }
        },
        "epics-tca Settings": {
            "DESCRIPTION_2df940c1-e4e6-45f2-a243-c696e5aae3e7": "Advanced transport and timing settings for epics-tca, the client library that provides TDM with Channel Access and PV Access communication.",
            "EPICS_CA_MIN_SEARCH_PERIOD": {
                "DESCRIPTION": "The minimum interval, in seconds, between searches for an unresolved Channel Access channel. Increasing this value reduces search traffic but may delay channel discovery.",
                "value": "DO NOT SET"
            },
            "EPICS_CA_GET_TIMEOUT_DEFAULT": {
                "DESCRIPTION": "The default timeout, in seconds, for Channel Access get operations. This setting is defined for compatibility but is not currently used by epics-tca.",
                "value": "DO NOT SET"
            },
            "EPICS_CA_SCHEDULING_PRIORITY_DEFAULT": {
                "DESCRIPTION": "The default server scheduling priority requested when a Channel Access channel is created. Valid values range from 0 to 100; the epics-tca default is 1.",
                "value": "DO NOT SET"
            },
            "EPICS_CA_TCP_RE_SEARCH_CHAN_TIMESPAN": {
                "DESCRIPTION": "A time span, in seconds, intended to randomize channel re-search delays after a TCP connection is lost. This setting is not currently used by epics-tca.",
                "value": "DO NOT SET"
            },
            "EPICS_CA_TCP_RE_SEARCH_CHAN_TIMEOUT": {
                "DESCRIPTION": "The intended delay, in seconds, before re-searching for a channel after its TCP transport is destroyed. This setting is not currently used by epics-tca.",
                "value": "DO NOT SET"
            },
            "EPICS_CA_REPEATER_REGISTER_TIMEOUT": {
                "DESCRIPTION": "The interval, in seconds, between attempts to register this client with the Channel Access repeater. Registration attempts stop after one succeeds.",
                "value": "DO NOT SET"
            },
            "EPICS_CA_TCP_INACTIVE_TIMEOUT": {
                "DESCRIPTION": "The TCP inactivity interval, in seconds, after which epics-tca sends an echo request. Unlike EPICS_CA_CONN_TMO, this check is based on TCP traffic rather than IOC beacons.",
                "value": "DO NOT SET"
            },
            "EPICS_CA_BEACON_TIMEOUT": {
                "DESCRIPTION": "The inactivity interval, in seconds, used to retire stored IOC beacon information. This cleanup conserves resources and does not itself change channel connections.",
                "value": "DO NOT SET"
            },
            "EPICS_CA_MAX_UDP_BUFFER": {
                "DESCRIPTION": "The maximum size, in bytes, of a UDP packet containing batched Channel Access search requests.",
                "value": "DO NOT SET"
            },
            "EPICS_CA_REPEATER_CLIENT_CHECK_TIME": {
                "DESCRIPTION": "The interval, in seconds, at which the Channel Access repeater checks registered clients and releases resources for clients that are no longer running.",
                "value": "DO NO TUSE"
            },
            "EPICS_CA_REPEATER_THREAD_CHECK_TIME": {
                "DESCRIPTION": "The interval, in seconds, at which epics-tca checks whether the Channel Access repeater is running and starts or restarts it when necessary.",
                "value": "DO NOT SET"
            },
            "EPICS_PVA_MIN_SEARCH_PERIOD": {
                "DESCRIPTION": "The minimum interval, in seconds, between searches for an unresolved PV Access channel. Search intervals increase from this initial value.",
                "value": "DO NOT SET"
            },
            "EPICS_PVA_MAX_SEARCH_PERIOD": {
                "DESCRIPTION": "The maximum interval, in seconds, between repeated searches for an unresolved PV Access channel.",
                "value": "DO NOT SET"
            }
        },
        "EPICS Custom Environment": {
            "DESCRIPTION_3439f8f9-0010-4d60-ba8b-5a01fbfd4830": "Application and EPICS-related settings that control startup displays, channel behavior, file locations, and external integrations.",
            "Default TDL Files": { value: [], DESCRIPTION: "Display files that TDM opens automatically when this profile starts. Each entry may be an absolute path, a path resolved through Default Search Paths, or a web URL where supported." },
            "Default Search Paths": { value: ["./", "$HOME"], DESCRIPTION: "Local directories searched, in order, when TDM resolves a relative display-file path. Web URLs are not supported as search paths." },
            // speical type for "Default Mode"
            "Default Mode": { value: "operating", DESCRIPTION: "The initial mode for display files opened automatically when this profile starts: operating or editing.", choices: ["operating", "editing"] },
            // manually opened displays and newly created blank displays are always editable
            "Editable": { value: "No", DESCRIPTION: "Controls whether default display files and displays opened from them may be edited. Newly created blank displays are always editable.", choices: ["Yes", "No"] },
            // manually opened displays and newly created blank displays are always editable
            "Manually Opened TDL Editable": { value: "Yes", DESCRIPTION: "Controls whether manually opened display files and displays opened from them may be edited.", choices: ["Yes", "No"] },
            // manually opened displays and newly created blank displays are always editable
            "Manually Opened TDL Mode": { value: "operating", DESCRIPTION: "The initial mode for manually opened display files: operating or editing.", choices: ["operating", "editing"] },
            "Disable PUT": {
                "DESCRIPTION": "Controls whether Channel Access and PV Access write operations, such as caput and pvput, are blocked. Choose \"YES\" to disable writes or \"NO\" to allow them.",
                "value": "NO",
                "choices": [
                    "NO",
                    "YES",
                ]
            },
            "Default Protocol": {
                "DESCRIPTION": "The protocol used when a channel name does not specify one. An explicit \"ca://\" or \"pva://\" prefix overrides this setting.",
                "value": "CA",
                "choices": [
                    "CA",
                    "PVA",
                ]
            },
            "Archiver Appliance Retrieval Address": {
                value: [],
                DESCRIPTION: "EPICS Archiver Appliance retrieval endpoints used to query historical data. Example: 127.0.0.1:17668/retrieval."
            },
            "File Browser Bookmarks": {
                "DESCRIPTION": "Bookmarks displayed in the File Browser. Each row contains a file or folder path and its Web-mode write permission: \"YES\" allows creating, modifying, and renaming items; \"NO\" provides read-only access.",
                "value": [],
                "type": "[string,string][]"
            },
            "Symbol Library": {
                "DESCRIPTION": "Local folders that TDM scans for custom symbols to include in the Symbol Gallery.",
                "value": []
            },
            // speical type for "Macros"
            Macros: { value: [], DESCRIPTION: "Name-value macros applied to display files opened automatically when this profile starts. Each row contains a macro name and its value.", type: "[string,string][]" },
            "EPICS Log Level": { value: "error", DESCRIPTION: "The minimum severity level emitted by the epics-tca library. Messages below this level are suppressed.", choices: ["trace", "debug", "info", "warn", "error", "fatal"] },
            "Video Saving Folder": { value: " ", DESCRIPTION: "The folder where TDM saves video recordings. If the folder is blank, unavailable, or not writable, TDM uses the current user's home folder." },
            "Image Saving Folder": { value: " ", DESCRIPTION: "The folder where TDM saves captured images. If the folder is blank, unavailable, or not writable, TDM uses the current user's home folder." },
            "Python Command": { value: "python3", DESCRIPTION: "The command used to run Python scripts attached to display windows. Command-line options may be included." },
            "Channel Lookup Server Address": { value: " ", DESCRIPTION: "The base URL of the channel lookup service used to search for channel names. Example: http://localhost:3000." }
        },
        "Preset Colors": {
            "DESCRIPTION_3439f8f9-0010-4d60-ba8b-5a01fbfd4830": "Named colors available to displays and widgets. Each value contains red, green, blue, and opacity components.",
            Background: { value: ["255", "255", "255", "100"], DESCRIPTION: "The default display background color." },
            Attention: { value: ["255", "160", "0", "100"], DESCRIPTION: "The color used to draw attention to an item or state." },
            "Button Background": { value: ["210", "210", "210", "100"], DESCRIPTION: "The default background color for buttons." },
            Disconnected: { value: ["200", "0", "200", "80"], DESCRIPTION: "The color used when a channel is disconnected." },
            Invalid: { value: ["255", "0", "255", "100"], DESCRIPTION: "The color used for invalid channel values or states." },
            Major: { value: ["255", "0", "0", "100"], DESCRIPTION: "The color used for a major alarm severity." },
            Minor: { value: ["255", "128", "0", "100"], DESCRIPTION: "The color used for a minor alarm severity." },
            Off: { value: ["60", "100", "60", "100"], DESCRIPTION: "The color used to represent an off state." },
            OK: { value: ["0", "255", "0", "100"], DESCRIPTION: "The color used to represent a normal or OK state." },
            On: { value: ["0", "255", "0", "100"], DESCRIPTION: "The color used to represent an on state." },
            "Read Background": { value: ["240", "240", "240", "100"], DESCRIPTION: "The default background color for read-only values and controls." },
            Stop: { value: ["255", "0", "0", "100"], DESCRIPTION: "The color used to represent a stopped state or stop action." },
            Text: { value: ["0", "0", "0", "100"], DESCRIPTION: "The default text color." },
            "Write Background": { value: ["128", "255", "255", "100"], DESCRIPTION: "The default background color for writable values and controls." },
            "Header Background": { value: ["77", "77", "77", "100"], DESCRIPTION: "The default background color for headers." },
            "Header Foreground": { value: ["255", "255", "255", "100"], DESCRIPTION: "The default foreground color for header content." },
            "Active Text": { value: ["255", "255", "0", "100"], DESCRIPTION: "The text color used for active or selected items." },
            Grid: { value: ["128", "128", "128", "100"], DESCRIPTION: "The default color for grid lines." },
        },
    };
};

/**
 * Creates the SNS-specific archive configuration category.
 *
 * The generated category contains the Oracle database credentials and
 * connection string used to access the SNS archive.
 *
 * @returns A new object containing the default SNS archive configuration.
 */
export const generateArchiveCategory_SNS = () => {
    return {
        "Archieve": {
            "DESCRIPTION_691a2740-e41f-4dac-94d8-d614ad03d100": "The SNS archive configurations.",
            "Oracle database username": {
                "DESCRIPTION": "The user name for Oracle database.",
                "value": "sns_reports"
            },
            "Oracle database password": {
                "DESCRIPTION": "Password.",
                "value": "sns"
            },
            "Oracle database connection string": {
                "DESCRIPTION": "Connection string.",
                "value": "(DESCRIPTION=\\n        (LOAD_BALANCE=OFF)\\n        (FAILOVER=ON)\\n        (ADDRESS=(PROTOCOL=TCP)(HOST=snsappa.sns.ornl.gov)(PORT=1610))\\n        (ADDRESS=(PROTOCOL=TCP)(HOST=snsappb.sns.ornl.gov)(PORT=1610))\\n        (CONNECT_DATA=(SERVICE_NAME=prod_controls))\\n        )"
            }
        },
    }
}
