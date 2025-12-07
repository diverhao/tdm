import * as fs from "fs";
// import parser from "xml2json";
import path from "path";
import { Profile } from "../profile/Profile";
import { v4 as uuidv4 } from "uuid";
import { BobPropertyConverter } from "../windows/DisplayWindow/BobPropertyConverter";
import { EdlConverter } from "../windows/DisplayWindow/EdlConverter";
import * as os from "os";
import { Log } from "../../common/Log";
import { MessagePort } from "worker_threads";
import { StpConverter } from "../windows/DisplayWindow/StpConverter";
import xml2js from 'xml2js';
import { type_tdl } from "../../common/GlobalVariables";

export class FileReader {
    static fetchWithTimeout = async (url: string, timeout: number = 10) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        const response = await fetch(url, {
            // ...options,
            // signal: controller.signal,
        });
        clearTimeout(id);
        return response.json();
    };

    /**
     * Read a JSON file from hard drive or network. <br>
     *
     * First, it tries to read from local hard drive, then tries network, at last it will try to
     * create the non-exist file with empty contents. If all these measures fail,
     * throw an exception.
     *
     *
     * @param {string} filePath
     * @returns {Promise<Record<string, any>>} A Promise resolved to an object for JSON file.
     * @throws {Error<string>} when the file cannot be found/read, and the file cannot be created.
     */
    static readJSON = async (filePath: string, readProfileJSON: boolean = false): Promise<Record<string, any>> => {
        let fileContents: Record<string, any> = {};
        // try hard drive
        try {
            fileContents = JSON.parse(fs.readFileSync(filePath).toString());
            Log.debug("-1", `Found file ${filePath} on hard drive`);
            return fileContents;
        } catch (e) {
            Log.error("-1", "Cannot read profile file", filePath, "from local disk");
            Log.error("-1", e);
        }

        // try network
        try {
            fileContents = await this.fetchWithTimeout(filePath);
            Log.debug("-1", `Found file ${filePath} on network`);
            return fileContents;
        } catch (e) {
            Log.error("-1", "Cannot read profile file", filePath, "at network", e);
        }

        if (readProfileJSON) {
            // read file failed, copy the default profile
            try {
                Log.debug("-1", "Trying to create default file", filePath, "from", path.join(__dirname, "../resources/tdls/profiles_default.json"));
                fs.mkdirSync(path.dirname(filePath), { recursive: true });

                fs.copyFileSync(path.join(__dirname, "../resources/tdls/profiles_default.json"), filePath);
                // copy GetStarted.tdl
                fs.copyFileSync(path.join(__dirname, "../resources/tdls/GetStarted.tdl"), path.join(path.dirname(filePath), "GetStarted.tdl"));
                Log.debug("-1", "Created an empty file", filePath);
                Log.debug("-1", "read this file");
                fileContents = JSON.parse(fs.readFileSync(filePath).toString());
                return fileContents;
            } catch (e) {
                Log.error("-1", e);
                throw new Error(`Cannot create empty file ${filePath}`);
            }
        } else {
            throw new Error(`Cannot create empty file ${filePath}`);
        }
    };

    static readJSONsync = (filePath: string, readProfileJSON: boolean = false): Record<string, any> => {
        let fileContents: Record<string, any> = {};
        // try hard drive
        try {
            fileContents = JSON.parse(fs.readFileSync(filePath).toString());
            Log.debug("-1", `Found file ${filePath} on hard drive`);
            return fileContents;
        } catch (e) {
            Log.error("-1", "Cannot read profile file", filePath, "from local disk");
            Log.error("-1", e);
        }

        // try network
        // try {
        //     fileContents = await this.fetchWithTimeout(filePath);
        //     Log.debug("-1", `Found file ${filePath} on network`);
        //     return fileContents;
        // } catch (e) {
        //     Log.error("-1", "Cannot read profile file", filePath, "at network", e);
        // }

        if (readProfileJSON) {
            // read file failed, copy the default profile
            try {
                Log.debug("-1", "Trying to create default file", filePath, "from", path.join(__dirname, "../resources/tdls/profiles_default.json"));
                fs.mkdirSync(path.dirname(filePath), { recursive: true });

                fs.copyFileSync(path.join(__dirname, "../resources/tdls/profiles_default.json"), filePath);
                // copy GetStarted.tdl
                fs.copyFileSync(path.join(__dirname, "../resources/tdls/GetStarted.tdl"), path.join(path.dirname(filePath), "GetStarted.tdl"));
                Log.debug("-1", "Created an empty file", filePath);
                Log.debug("-1", "read this file");
                fileContents = JSON.parse(fs.readFileSync(filePath).toString());
                return fileContents;
            } catch (e) {
                Log.error("-1", e);
                throw new Error(`Cannot create empty file ${filePath}`);
            }
        } else {
            throw new Error(`Cannot create empty file ${filePath}`);
        }
    };

    static readDb = (fileName: string, profile?: Profile, currentTdlFolder?: string) => {
        const fullFileName = this.resolveTdlFileName(fileName, profile, currentTdlFolder);
        if (fullFileName === undefined) {
            Log.debug("-1", "readTdlFile() cannot find file", fileName);
            return undefined;
        }

        const leftParenthesis = uuidv4();
        const rightParenthesis = uuidv4();

        const dbFileContentsRaw = fs.readFileSync(fullFileName, {
            encoding: "utf8",
        });
        return this.parseDb(dbFileContentsRaw);

    }

    static parseDb = (dbFileContentsRaw: string) => {
        // const fullFileName = this.resolveTdlFileName(fileName, profile, currentTdlFolder);
        // if (fullFileName === undefined) {
        //     Log.debug("-1", "readTdlFile() cannot find file", fileName);
        //     return undefined;
        // }

        const leftParenthesis = uuidv4();
        const rightParenthesis = uuidv4();

        // const dbFileContentsRaw = fs.readFileSync(fullFileName, {
        //     encoding: "utf8",
        // });

        // remove comments, take care of ( and ) inside quotes
        const dbFileContentsArray = dbFileContentsRaw.split("\n");
        const dbFileContentsArray1: string[] = [];
        for (let line of dbFileContentsArray) {
            let insideQuote = false;
            let jj = line.length;
            let ii = 0;
            while (true) {
                const char = line[ii];
                if (char === undefined) {
                    break;
                } else if (char === `"`) {
                    insideQuote = !insideQuote;
                } else if (char === "#") {
                    if (!insideQuote) {
                        break;
                    }
                } else if (char === ")") {
                    if (insideQuote) {
                        line = [line.substring(0, ii), rightParenthesis, line.substring(ii + 1)].join("");
                    }
                } else if (char === "(") {
                    if (insideQuote) {
                        line = [line.substring(0, ii), leftParenthesis, line.substring(ii + 1)].join("");
                    }
                }
                ii++;
            }
            dbFileContentsArray1.push(line.substring(0, ii));
        }

        const dbFileContents = dbFileContentsArray1.join("\n");

        let regRecord = /(record([^(]*)\(([^)]*),([^)]*)\)([\n\s\t]*)\{([\n\s\t]*)((((field|info)([^(]*)\(([^),]*),([^)]*)\)([\n\s\t]*))*)|([\n\s\t]*))\}([\n\s\t]*))/g;
        let regRecordHeader = /record([^(]*)\(([^)]*),([^)]*)\)/g;
        let regRecordBody = /(field([^(]*)\(([^),]*),([^)]*)\))|([\n\s\t]*)/g;

        let records = dbFileContents.match(regRecord);
        const result: Record<string, any>[] = [];

        if (Array.isArray(records)) {
            for (let record of records) {
                const resultRecord: Record<string, any> = {};
                const header = record.match(regRecordHeader);
                const body = record.match(regRecordBody);
                // parse header
                if (header === null || header?.length !== 1) {
                    Log.error("-1", "header wrong");
                } else {
                    const headerContent = header[0];
                    const headerContentArray = headerContent
                        .replace(/record([^(]*)\(/, "")
                        .replaceAll(")", "")
                        .replaceAll(`"`, "")
                        .replaceAll(`\n`, "")
                        .split(",");
                    if (headerContentArray.length === 2) {
                        let channelType = headerContentArray[0].trim().replaceAll(rightParenthesis, ")").replaceAll(leftParenthesis, "(");
                        let channelName = headerContentArray[1].trim().replaceAll(rightParenthesis, ")").replaceAll(leftParenthesis, "(");
                        resultRecord["RTYP"] = channelType;
                        resultRecord["NAME"] = channelName;
                    }
                }
                // parse body
                if (Array.isArray(body)) {
                    for (let field of body) {
                        const fieldContentArray = field
                            .replace(/field([^(]*)\(/, "")
                            .replaceAll(")", "")
                            .replaceAll(`"`, "")
                            .replaceAll(`\n`, "")
                            .split(",");
                        if (fieldContentArray.length === 2) {
                            const fieldName = fieldContentArray[0].trim().replaceAll(rightParenthesis, ")").replaceAll(leftParenthesis, "(");
                            const fieldValue = fieldContentArray[1].trim().replaceAll(rightParenthesis, ")").replaceAll(leftParenthesis, "(");
                            resultRecord[fieldName] = fieldValue;
                        }
                    }
                } else {
                    Log.error("-1", "record body wrong");
                }
                result.push(JSON.parse(JSON.stringify(resultRecord)));
            }
        }

        return result;
    };

    // ------------------------- tdl ------------------------------

    static tdlFileType = (tdlFileName: string): string => {
        const tdlFileNameArray = tdlFileName.split(".");
        return tdlFileNameArray[tdlFileNameArray.length - 1];
    };

    // todo
    // check if the tdl is legitimate
    static verifyTdl = (tdl: Record<string, any>) => {
        return true;
    };

    static isRemotePath = (path: string): boolean => {
        if (path.startsWith("http://") || path.startsWith("https://")) {
            return true;
        } else {
            return false;
        }
    };

    /**
     * Obtain the absolute path of a tdl file name. <br>
     *
     * The tdl file name opened from ActionButton already resolved to absolute path. <br>
     *
     * If the path is an absolute path remote path, i.e. in format "http://..."  or "https://...", or  then return it
     */
    static resolveTdlFileName = (tdlFileName: string, profile?: Profile, currentTdlFolder?: string) => {
        // web location
        if (this.isRemotePath(tdlFileName)) {
            return tdlFileName;
        }
        if (currentTdlFolder !== undefined) {
            if (this.isRemotePath(currentTdlFolder) && !this.isRemotePath(tdlFileName)) {
                return `${currentTdlFolder}/${tdlFileName}`;
            }
        }

        // local location
        if (fs.existsSync(tdlFileName) && path.isAbsolute(tdlFileName)) {
            return tdlFileName;
        }

        // const selectedProfile = this.getMainProcess().getProfiles().getSelectedProfile();
        let searchPaths: string[] = [];
        if (profile !== undefined) {
            let searchPathsTmp = profile.getSearchPaths();
            if (searchPathsTmp !== undefined) {
                searchPaths = searchPathsTmp;
            }
        }
        if (currentTdlFolder !== undefined) {
            searchPaths = [currentTdlFolder, ...searchPaths];
        }
        for (let searchPath of searchPaths) {
            // replace $HOME or ${HOME} macro, it is the only macro used in TDM search paths in profile
            searchPath = searchPath.replace("$HOME", os.homedir()).replace("${HOME}", os.homedir());
            const fullPath = path.join(path.resolve(searchPath), tdlFileName);
            if (fs.existsSync(fullPath)) {
                return fullPath;
            }
        }
        Log.error("Cannot find tdl file", tdlFileName, "from", searchPaths);
        return undefined;
    };

    // the tdl file is verified at this step
    // (1) "abc.tdl"
    // (2) "./abc.tdl"
    // (3) "ABC/abc.tdl"
    // (4) "/home/chief-oper/ABC/abc.tdl"
    // (5) "https://ABC.com/abc.tdl"
    // (6) "http://ABC.com/abc.tdl"
    // (7) "ABC.com/abc.tdl"
    static readTdlFile = async (
        tdlFileName: string,
        profile?: Profile,
        currentTdlFolder?: string,
        convertEdlSuffix: boolean = false
    ): Promise<{ tdl: type_tdl; fullTdlFileName: string } | undefined> => {
        const fullTdlFileName = this.resolveTdlFileName(tdlFileName, profile, currentTdlFolder);
        Log.debug("full tdl file name", fullTdlFileName);
        if (fullTdlFileName === undefined) {
            Log.error("readTdlFile() cannot find file", tdlFileName);
            return undefined;
        }
        const tdlFileType = this.tdlFileType(fullTdlFileName);

        let tdl: Record<string, any> = {};
        if (tdlFileType === "tdl") {
            tdl = await this.readJSON(fullTdlFileName);
        } else if (tdlFileType === "bob") {
            const parser = new xml2js.Parser();
            const bobContents = fs.readFileSync(fullTdlFileName, "utf-8");
            // console.log(bobContents)
            const bobJson = await parser.parseStringPromise(bobContents);
            // console.log("parsing finished")
            console.log(JSON.stringify(bobJson, null, 4))
            // console.log("parsing finished 2")

            // ! will be replaced, xml2json has some compatible issue
            // ! let xmlJSON = JSON.parse(parser.toJson(xml));
            // console.log("------------->", JSON.stringify(xmlJSON, null, 2));
            await BobPropertyConverter.parseBob(bobJson["display"], tdl, fullTdlFileName, convertEdlSuffix);
            console.log(JSON.stringify(tdl, null, 4));
        } else if (tdlFileType === "plt") {
            const parser = new xml2js.Parser();
            const pltContents = fs.readFileSync(fullTdlFileName, "utf-8");
            // console.log(bobContents)
            const pltJson = await parser.parseStringPromise(pltContents);
            // console.log("parsing finished")
            console.log(JSON.stringify(pltJson, null, 4))
            // console.log("parsing finished 2")

            // ! will be replaced, xml2json has some compatible issue
            // ! let xmlJSON = JSON.parse(parser.toJson(xml));
            // console.log("------------->", JSON.stringify(xmlJSON, null, 2));
            await BobPropertyConverter.parsePlt(pltJson, tdl);
            console.log(JSON.stringify(tdl, null, 4));
        } else if (tdlFileType === "edl") {
            if (!this.isRemotePath(fullTdlFileName)) {
                const edlContents = fs.readFileSync(fullTdlFileName, "utf-8");
                const edlContentsLines = edlContents.split(/\r?\n/);
                const edlJSON = EdlConverter.convertEdltoJSON(edlContentsLines, 0);
                Log.debug("------------->", JSON.stringify(edlJSON, null, 4));
                EdlConverter.parseEdl(edlJSON, tdl, false, fullTdlFileName, convertEdlSuffix);
                Log.debug("------------>>",JSON.stringify(tdl, null, 4));
            } else {
                // ignore website certificate error
                process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
                const response = await fetch(fullTdlFileName, {});
                const edlContents = await response.text();
                const edlContentsLines = edlContents.split(/\r?\n/);
                const edlJSON = EdlConverter.convertEdltoJSON(edlContentsLines, 0);
                EdlConverter.parseEdl(edlJSON, tdl, false, fullTdlFileName, convertEdlSuffix);
                // console.log(JSON.stringify(tdl, null, 4));
            }
        } else if (tdlFileType === "stp") {
            if (!this.isRemotePath(fullTdlFileName)) {
                const stpContents = fs.readFileSync(fullTdlFileName, "utf-8");
                const stpContentsLines = stpContents.split(/\r?\n/);
                const stpJSON = StpConverter.convertStpToJSON(stpContentsLines);
                Log.debug("------------->", JSON.stringify(stpJSON, null, 4));
                StpConverter.parseStp(stpJSON, tdl);
                // Log.debug(JSON.stringify(tdl, null, 4));
            } else {
                // ignore website certificate error
                process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
                const response = await fetch(fullTdlFileName, {});
                const edlContents = await response.text();
                const edlContentsLines = edlContents.split(/\r?\n/);
                const edlJSON = EdlConverter.convertEdltoJSON(edlContentsLines, 0);
                EdlConverter.parseEdl(edlJSON, tdl, false, fullTdlFileName, convertEdlSuffix);
                // console.log(JSON.stringify(tdl, null, 4));
            }
        } else {
            Log.error("Unknow file type", tdlFileName);
            return undefined;
        }

        if (this.verifyTdl(tdl)) {
            // tdl object is legitimate at this point
            return {
                fullTdlFileName: fullTdlFileName,
                tdl: tdl as type_tdl,
            };
        } else {
            return undefined;
        }
    };

    static readEdlAndSaveTdl = async (
        edlFileName: string,
        destinationFolder: string | undefined = undefined,
        profile: Profile | undefined = undefined,
        convertEdlSuffix: boolean = false,
        parentPort: MessagePort | null | undefined = undefined,
    ) => {
        Log.debug("-1", "Trying to read edl file", edlFileName);

        const t0 = Date.now();
        if (parentPort && destinationFolder && path.isAbsolute(edlFileName)) {
            const destFileName = path.join(destinationFolder, path.basename(edlFileName)).replace(".edl", ".tdl").replace(".stp", ".tdl").replace(".bob", ".tdl").replace(".plt", ".tdl");
            parentPort.postMessage({
                type: "one-file-conversion-started",
                srcFileName: edlFileName,
                destFileName: destFileName,
                status: "converting",
                // timeDurationMs: t1 - t0, // ms
                // numWidgetsOrig: 100, // number of widgets in edl file
                // numWidgetsTdl: 100, // number of widgets in tdl file
            })
        }

        const tdlResult = await this.readTdlFile(edlFileName, profile, undefined, convertEdlSuffix);
        if (tdlResult === undefined) {

            const t1 = Date.now();
            if (parentPort && destinationFolder && path.isAbsolute(edlFileName)) {
                const destFileName = path.join(destinationFolder, path.basename(edlFileName)).replace(".edl", ".tdl").replace(".stp", ".tdl").replace(".bob", ".tdl").replace(".plt", ".tdl");
                parentPort.postMessage({
                    type: "one-file-conversion-finished",
                    srcFileName: edlFileName,
                    destFileName: destFileName,
                    status: "failed",
                    timeDurationMs: t1 - t0, // ms
                    numWidgetsOrig: 100, // number of widgets in edl file
                    numWidgetsTdl: 100, // number of widgets in tdl file
                })
            }

            return undefined;
        } else {
            const tdl = tdlResult["tdl"];
            const fullTdlFileName = tdlResult["fullTdlFileName"];
            let newFullTdlFileName = fullTdlFileName.replace(".edl", ".tdl").replace(".stp", ".tdl").replace(".bob", ".tdl").replace(".plt", ".tdl");
            if (destinationFolder !== undefined) {
                const fileName = path.basename(fullTdlFileName);
                newFullTdlFileName = path.join(destinationFolder, fileName).replace(".edl", ".tdl").replace(".stp", ".tdl").replace(".bob", ".tdl").replace(".plt", ".tdl");
            }
            fs.writeFileSync(
                newFullTdlFileName,
                JSON.stringify(tdl, null, 4)
                // , function (err) {
                // 	if (err) {
                // 		console.log("tdl file", newFullTdlFileName, "save failed.");
                // 		console.log(err);
                // 	} else {
                // 		console.log("tdl file", newFullTdlFileName, "saved.");
                // 	}
                // }
            );

            const t1 = Date.now();
            if (parentPort && destinationFolder && path.isAbsolute(edlFileName)) {
                const destFileName = path.join(destinationFolder, path.basename(edlFileName)).replace(".edl", ".tdl").replace(".stp", ".tdl").replace(".bob", ".tdl").replace(".plt", ".tdl");
                parentPort.postMessage({
                    type: "one-file-conversion-finished",
                    srcFileName: edlFileName,
                    destFileName: destFileName,
                    status: "success",
                    timeDurationMs: t1 - t0, // ms
                    numWidgetsOrig: 100, // number of widgets in edl file
                    numWidgetsTdl: 100, // number of widgets in tdl file
                })
            }
            return tdlResult;
        }
    };

    static readEdlFolderAndSaveTdls = async (
        sourceFolder: string,
        destinationFolder: string,
        maxDepth: number = 100,
        hashFile: string | undefined = undefined,
        convertEdlSuffix: boolean = false,
        parentPort: MessagePort | null | undefined = undefined,
    ) => {
        if (maxDepth === 0) {
            return;
        }

        if (!fs.existsSync(destinationFolder)) {
            // try to make the folder
            fs.mkdirSync(destinationFolder);
        }

        // go through the source folder
        const filesAndFolders = fs.readdirSync(sourceFolder, {
            recursive: false,
        });

        // console.log(filesAndFolders);

        for (let fileAndFolder of filesAndFolders) {
            if (typeof fileAndFolder === "string") {
                const fileAndFolderFullName = path.join(sourceFolder, fileAndFolder);
                // console.log(fileAndFolderFullName, path.extname(fileAndFolderFullName));
                if (path.extname(fileAndFolder) === ".edl") {
                    // edl file
                    await this.readEdlAndSaveTdl(fileAndFolderFullName, destinationFolder, undefined, convertEdlSuffix, parentPort);
                    const t1 = Date.now();
                    if (parentPort) {
                        const destFileName = path.join(destinationFolder, path.basename(fileAndFolderFullName)).replace(".edl", ".tdl");
                    }
                } else if (path.extname(fileAndFolder) === ".stp") {
                    // stp file
                    await this.readEdlAndSaveTdl(fileAndFolderFullName, destinationFolder, undefined, convertEdlSuffix, parentPort);
                    const t1 = Date.now();
                    if (parentPort) {
                        const destFileName = path.join(destinationFolder, path.basename(fileAndFolderFullName)).replace(".stp", ".tdl");
                    }
                } else if (path.extname(fileAndFolder) === ".bob") {
                    // stp file
                    await this.readEdlAndSaveTdl(fileAndFolderFullName, destinationFolder, undefined, convertEdlSuffix, parentPort);
                    const t1 = Date.now();
                    if (parentPort) {
                        const destFileName = path.join(destinationFolder, path.basename(fileAndFolderFullName)).replace(".bob", ".tdl");
                    }
                } else if (path.extname(fileAndFolder) === ".plt") {
                    // stp file
                    await this.readEdlAndSaveTdl(fileAndFolderFullName, destinationFolder, undefined, convertEdlSuffix, parentPort);
                    const t1 = Date.now();
                    if (parentPort) {
                        const destFileName = path.join(destinationFolder, path.basename(fileAndFolderFullName)).replace(".plt", ".tdl");
                    }
                } else {
                    let newFileAndFolderFullName = path.join(destinationFolder, fileAndFolder);
                    if (fs.lstatSync(fileAndFolderFullName).isDirectory()) {
                        // folder
                        await this.readEdlFolderAndSaveTdls(
                            fileAndFolderFullName,
                            newFileAndFolderFullName,
                            maxDepth - 1,
                            hashFile,
                            convertEdlSuffix,
                            parentPort,
                        );
                    } else {
                        // other types of files, copy them over if source and destination folders are different
                        if (sourceFolder !== destinationFolder) {
                            try {
                                // do not quit
                                fs.copyFileSync(fileAndFolderFullName, newFileAndFolderFullName);
                            } catch (e) {
                                Log.error("-1", e);
                            }
                        } else {
                            // do not copy
                        }
                    }
                }
            }
        }
    };

    static readTdlFiles = async (tdlFileNames: string[], profile: Profile, currentTdlFolder?: string, convertEdlSuffix: boolean = false) => {
        const result: { fullTdlFileName: string; tdl: type_tdl }[] = [];
        for (let tdlFileName of tdlFileNames) {
            this.readTdlFile(tdlFileName, profile, currentTdlFolder, convertEdlSuffix).then((tdlFileResult) => {
                if (tdlFileResult !== undefined) {
                    result.push(tdlFileResult);
                } else {
                    Log.error("Cannot read tdl file", tdlFileName);
                }
            });
        }
        return result;
    };

    static getBlankWhiteTdl = () => {
        const result: type_tdl = {
            Canvas: {
                type: "Canvas",
                widgetKey: "Canvas",
                key: "Canvas",
                style: {
                    position: "fixed",
                    display: "inline-block",
                    backgroundColor: "rgba(255, 255, 255, 1)",
                    margin: 0,
                    border: 0,
                    padding: 0,
                    left: 0,
                    top: 0,
                    width: 700,
                    height: 600,
                    overflow: "hidden",
                },
                macros: [],
                replaceMacros: false,
                windowName: "",
                script: "",
                xGridSize: 1,
                yGridSize: 1,
                gridColor: "rgba(128,128,128,1)",
                showGrid: true,
                isUtilityWindow: false,
            },
        };

        return result;
    };

    static getBlankTransparentTdl = () => {
        const result = this.getBlankWhiteTdl();
        result["Canvas"]["style"]["backgroundColor"] = "rgba(0,0,0,0)";
        return result;
    };
    static getBlankRedTdl = () => {
        const result = this.getBlankWhiteTdl();
        result["Canvas"]["style"]["backgroundColor"] = "rgba(255,0,0,1)";
        return result;
    };

    static writeJSON = (fileName: string, data: Record<string, any>) => {
        fs.writeFile(fileName, JSON.stringify(data, null, 4), function (err) {
            // if (err) {
            // 	console.log(err);
            // 	event.sender.send("error-message", err.toString());
            // } else {
            // 	event.sender.send("tdl-file-saved", dataFileName);
            // }
        });
    };

    // ------------------------ dbd ----------------------------

    static leftParenthesis = uuidv4();
    static rightParenthesis = uuidv4();
    static leftBrace = uuidv4();
    static rightBrace = uuidv4();

    // read a dbd file and strip off its
    static readDbdFileRemoveComments = (fullFileName: string) => {
        const dbFileContentsRaw = fs.readFileSync(fullFileName, {
            encoding: "utf8",
        });

        // remove comments, take care of ( and ) inside quotes
        const dbFileContentsArray = dbFileContentsRaw.split("\n");
        const dbFileContentsArray1: string[] = [];
        for (let line of dbFileContentsArray) {
            let insideQuote = false;
            let ii = 0;
            while (true) {
                const char = line[ii];
                if (char === undefined) {
                    break;
                } else if (char === `"`) {
                    insideQuote = !insideQuote;
                } else if (char === "#" || char === "%") {
                    if (!insideQuote) {
                        break;
                    }
                } else if (char === ")") {
                    if (insideQuote) {
                        line = [line.substring(0, ii), this.rightParenthesis, line.substring(ii + 1)].join("");
                    }
                } else if (char === "(") {
                    if (insideQuote) {
                        line = [line.substring(0, ii), this.leftParenthesis, line.substring(ii + 1)].join("");
                    }
                } else if (char === "{") {
                    if (insideQuote) {
                        line = [line.substring(0, ii), this.leftBrace, line.substring(ii + 1)].join("");
                    }
                } else if (char === "}") {
                    if (insideQuote) {
                        line = [line.substring(0, ii), this.rightBrace, line.substring(ii + 1)].join("");
                    }
                }
                ii++;
            }
            dbFileContentsArray1.push(line.substring(0, ii));
        }

        // console.log(dbFileContentsArray1);

        const dbFileContents = dbFileContentsArray1.join("\n");
        return dbFileContents;
    };

    // parse the body part of a recordtype(...){...}
    static parseDbdRecordTypeBody = (recordTypeBody: string, fileName: string) => {
        let regField =
            /(((field([\b\n\t]*)\(([^(]*),([^(]*)\)([\t\n\s]*)\{([\t\n\s]*)((([a-zA-Z0-9]+)\(([^)]*)\)([\t\n\s]*))*)([\t\n\s]*)\})|(include([\t\s\n]*)\"([^"]*)\"))+)/g;

        let regFieldHead = /field([\b\n\t]*)\(([^(]*),([^(]*)\)/g;
        let regFieldBody = /\{([\t\n\s]*)((([a-zA-Z0-9]+)\(([^)]*)\)([\t\n\s]*))*)([\t\n\s]*)\}/g;
        let regFieldBodyElement = /([a-zA-Z0-9]+)\(([^)]*)\)/g;

        let fields = recordTypeBody.match(regField);
        const result: Record<string, any>[] = [];

        if (Array.isArray(fields)) {
            for (let field of fields) {
                // include
                if (field.trim().startsWith("include")) {
                    // console.log(field);
                    let includeFileName = field.replace("include", "").replaceAll(`"`, "").trim();
                    if (!path.isAbsolute(includeFileName)) {
                        includeFileName = path.join(path.dirname(fileName), includeFileName);
                    }
                    const includeFileFields = this.readFieldsDbdFile(includeFileName);
                    for (let includeField of includeFileFields) {
                        result.push(JSON.parse(JSON.stringify(includeField)));
                    }
                } else {
                    // field
                    // console.log("--->", field);
                    const resultField: Record<string, any> = {};
                    const header = field.match(regFieldHead);
                    const body = field.match(regFieldBody);
                    // console.log("==> body", body);
                    // parse header
                    if (header === null || header?.length !== 1) {
                        Log.error("header wrong 1", header);
                    } else {
                        const headerContent = header[0];
                        const headerContentArray = headerContent
                            .replace(/field([^(]*)\(/, "")
                            .replaceAll(")", "")
                            .replaceAll(`"`, "")
                            .replaceAll(`\n`, "")
                            .split(",");
                        if (headerContentArray.length === 2) {
                            let fieldName = headerContentArray[0]
                                .trim()
                                .replaceAll(this.rightParenthesis, ")")
                                .replaceAll(this.leftParenthesis, "(")
                                .replaceAll(this.leftBrace, "{")
                                .replaceAll(this.rightBrace, "}");
                            let fieldType = headerContentArray[1]
                                .trim()
                                .replaceAll(this.rightParenthesis, ")")
                                .replaceAll(this.leftParenthesis, "(")
                                .replaceAll(this.leftBrace, "{")
                                .replaceAll(this.rightBrace, "}");
                            resultField["TYPE"] = fieldType;
                            resultField["NAME"] = fieldName;
                        }
                    }
                    // parse body
                    if (Array.isArray(body)) {
                        if (body.length === 1) {
                            const bodyElements = body[0].match(regFieldBodyElement);
                            if (Array.isArray(bodyElements)) {
                                for (let element of bodyElements) {
                                    let name = element
                                        .split("(")[0]
                                        .replaceAll(this.rightParenthesis, ")")
                                        .replaceAll(this.leftParenthesis, "(")
                                        .replaceAll(this.leftBrace, "{")
                                        .replaceAll(this.rightBrace, "}");
                                    let value = element
                                        .split("(")[1]
                                        .replaceAll(this.rightParenthesis, ")")
                                        .replaceAll(this.leftParenthesis, "(")
                                        .replaceAll(this.leftBrace, "{")
                                        .replaceAll(this.rightBrace, "}");
                                    // console.log("element:", element, element.split("("), name, value);
                                    if (name !== undefined && value !== undefined) {
                                        name = name.trim().replaceAll(")", "").replaceAll(`"`, "");
                                        value = value.trim().replaceAll(")", "").replaceAll(`"`, "");
                                        resultField[name] = value;
                                    }
                                }
                            }
                        }
                    } else {
                        Log.error("record body wrong");
                    }
                    result.push(JSON.parse(JSON.stringify(resultField)));
                }
            }
        }

        // console.log(result);
        return result;
    };

    // parse a menu entry menu(...){choice(..., ...) choice(..., ...) ...}
    static parseDbdMenu = (menuContents: string) => {
        const regMenuHeader = /menu([\s\n\t]*)\(([\s\n\t]*)([a-z0-9A-Z]+)([\s\n\t]*)\)/g;
        const regMenuChoice = /choice([\s\n\t]*)\(([\t\s\n]*)([^)]+),([\s\t\n]*)([^)]+)([\t\s\n]*)\)/g;
        const menuHeaderArray = menuContents.match(regMenuHeader);
        const menuChoiceArray = menuContents.match(regMenuChoice);
        let name = "";
        const result: Record<string, any> = {};
        if (Array.isArray(menuHeaderArray)) {
            if (menuHeaderArray.length === 1) {
                name = menuHeaderArray[0].replace("menu", "").replaceAll("(", "").replaceAll(")", "");
                result["name"] = name;
            }
        }
        const choices: any[] = [];
        if (Array.isArray(menuChoiceArray)) {
            for (let choiceRaw of menuChoiceArray) {
                const choiceArray = choiceRaw.trim().replaceAll("choice", "").replace("(", "").split(",");
                const choiceName = choiceArray[0].trim();
                choiceArray.splice(0, 1);
                const choiceContent = choiceArray
                    .join(",")
                    .replaceAll(`"`, "")
                    .replaceAll(")", "")
                    .replaceAll(this.leftParenthesis, "(")
                    .replaceAll(this.rightParenthesis, ")")
                    .replaceAll(this.leftBrace, "{")
                    .replaceAll(this.rightBrace, "}")
                    .trim();
                choices.push({
                    choiceName: choiceName,
                    choiceContent: choiceContent,
                });
            }
        }
        result["choices"] = choices;
        // console.log(result);
        return result;
    };

    // read a dbd file that only contains a list of fields(...){...}, basically it is dbCommon.dbd
    static readFieldsDbdFile = (fileName: string) => {
        const dbFileContents = this.readDbdFileRemoveComments(fileName).replaceAll("\n", " ");
        return this.parseDbdRecordTypeBody(dbFileContents, fileName);
    };

    // read a *Record.dbd and menu*.dbd file, it may contain menu(...){...} and recordtype(...){...}
    static readRecordTypeDbdFile = (fileName: string) => {
        const result: { menus: Record<string, any>[]; recordTypes: Record<string, any>[] } = { menus: [], recordTypes: [] };
        // the whole file as one string, comments removed
        const dbFileContents = this.readDbdFileRemoveComments(fileName).replaceAll("\n", " ");
        // a 2 and 1/2 feet long regex to find out all recordtype(...){...} entries in a .dbd file
        const regRecordType =
            /recordtype([^(]*)\(([^)]*)\)([\s\t\n]*)\{([\t\s\n]*)(((([\t\n\s]*)include([\t\s\n]*)\"([^"]*)\"([\t\n\s]*))|(([\t\n\s]*)field([\t\s\n]*)\(([^)]*),([^)]*)\)([\t\n\s]*)\{([\t\n\s]*)((([\t\n\s]*)([a-z0-9A-Z]+)([\t\n\s]*)\(([\t\n\s]*)([^)]*)([\t\n\s]*)\)([\t\n\s]*))*)([\t\n\s]*)\}([\t\n\s]*)))*)([\t\s\n]*)\}/g;
        const regRecordTypeHeader = /recordtype([^(]*)\(([^)]*)\)/;
        const regMenu =
            /menu([\s\n\t]*)\(([\s\n\t]*)([a-z0-9A-Z]+)([\s\n\t]*)\)([\s\n\t]*)\{([\s\n\t]*)((([\t\s\n]*)choice([\s\n\t]*)\(([\t\s\n]*)([^)]+),([\s\t\n]*)([^)]+)([\t\s\n]*)\)([\t\s\n]*))*)([\s\n\t]*)\}/g;

        // an array that contains all entries of recordtype(...){...}
        const recordTypesArray = dbFileContents.match(regRecordType);
        const menusArray = dbFileContents.match(regMenu);

        if (Array.isArray(menusArray)) {
            for (let menu of menusArray) {
                const menuResult = this.parseDbdMenu(menu);
                result["menus"].push(menuResult);
            }
        }

        if (Array.isArray(recordTypesArray)) {
            // parase each recordtype(...){...}
            for (let recordType of recordTypesArray) {
                const recordTypeResult: Record<string, any> = {};
                const recordTypeHeaderArray = recordType.match(regRecordTypeHeader);
                if (Array.isArray(recordTypeHeaderArray)) {
                    // recordtype(...)
                    const recordTypeHeader = recordTypeHeaderArray[0];
                    // {...}
                    const body = recordType.replace(recordTypeHeader, "");
                    recordTypeResult["name"] = recordTypeHeader.replace("recordtype", "").replace("(", "").replace(")", "");
                    // parse {field(...){...} field(...){...} ...}, return an array of objects
                    recordTypeResult["fields"] = this.parseDbdRecordTypeBody(body, fileName);
                    result["recordTypes"].push(recordTypeResult);
                }
            }
        }
        return result;
    };
}
