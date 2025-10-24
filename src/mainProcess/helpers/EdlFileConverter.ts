import path from "path";
import { FileReader } from "../file/FileReader";
import * as fs from "fs";

import crypto from "crypto";
import { convertEpochTimeToString } from "../../rendererProcess/global/GlobalMethods";
import { argv } from "process";

// iterate over all the files in the folder, calculate the MD5, save to a new JSON files
// {file-full-path: md5} -- F2

// a file may be
//  - not changed              -- A
//  - modified                 -- B
//  - moved to another file    -- C
//  - moved from another file  -- D
//  - deleted                  -- E
//  - newly added              -- F

// if there is no old F2 JSON file, then convert all files

// iterate over the old F2 JSON file, try to find the key in new F2 JSON file
//  - if there is no such a key, it means the file is moved to another file (case C) or deleted (case E) --> delete the tdl file
//  - if there is a key, then compare their md5
//    - if md5 are the same, it means the file is not changed (case A) --> do nothing
//    - if md5 are different, it means the file is modified (case B) --> convert the file

// iterate over the new F2 JSON file, try to find the key in old F2 JSON file
//  - if there is no such a key, it means the file is newly added (case F) or moved from another file (case D) --> convert the file
//  - if there is a key, then compare their md5
//    - if the md5 are the same, it means the file is not changed (case A) --> do nothing
//    - if the md5 are different, it means the file is modified (case B) --> convert this file


const exit = (e: Error | string | undefined | any = undefined) => {
    console.log("exit");
    if (e instanceof Error) {
        throw e;
    } else {
        throw new Error(`${e}`);
    }

}

// user input
if (argv[2] === undefined || argv[2] === "-h" || argv[2] === "--help") {
    exit("Usage: EdlFileConveter edl-folder tdl-folder");
}
const edlFolder = argv[2];
const tdlFolder = argv[3];

// variables
const tdlFolderTrash = path.join(tdlFolder, `edl-converter-trash-${convertEpochTimeToString(Date.now()).replace(" ", "_").replace(":", "_")}`)
const jsonFullName = path.join(tdlFolder, "md5.json");
const oldJsonFullName = path.join(tdlFolder, "md5_old.json");
const logFullName = path.join(tdlFolder, "log.txt");
let oldJsonContent: Record<string, string> = {};
// file-full-path vs md5
const jsonContent: Record<string, string> = {};


const toBeDeletedFiles: string[] = [];
const toBeConvertedFiles: string[] = [];
const toBeCopiedFiles: string[] = []

const writeToLog = (text: string) => {
    try {
        console.log(text);
        fs.writeFileSync(logFullName, text + "\n", { flag: "a+" });
    } catch (e) {
        exit(e);
    }
}

// create directories
try {
    fs.mkdirSync(tdlFolder, { recursive: true });
    fs.mkdirSync(tdlFolderTrash, { recursive: true });
} catch (e) {
    writeToLog(`${e}`);
    exit(e);
}

writeToLog(`\n--------------------------------------`)
writeToLog(`Convert ${edlFolder} to ${tdlFolder}`)
writeToLog(`Time: ${convertEpochTimeToString(Date.now())}`)

const iterateFolder = (folderPath: string) => {
    const files = fs.readdirSync(folderPath);
    for (const file of files) {
        const fullPath = path.join(folderPath, file);
        const stat = fs.statSync(fullPath);
        const fileSize = stat.size;
        if (fileSize < 10 * 1024 * 1024) {
            if (stat.isFile()) {
                // console.log("File : ", fullPath);
                const fileContent = fs.readFileSync(fullPath);
                const hash = crypto.createHash('md5');
                hash.update(fileContent);
                jsonContent[fullPath] = hash.digest('hex');
            } else if (stat.isDirectory()) {
                // console.log('Directory : ', fullPath);
                iterateFolder(fullPath);
            } else if (stat.isSymbolicLink()) {
                console.log("Skip symbolic link file", fullPath);
            } else {
                console.log("Skip file", fullPath);
            }
        } else {
            // large file, the md5 is stat
            // console.log("File (too large) : ", fullPath);
            jsonContent[fullPath] = JSON.stringify(stat);
        }
    }
}

const getDestFileName = (srcFileName: string) => {
    return srcFileName.replace(edlFolder, tdlFolder).replace(".edl", ".tdl").replace(".stp", ".tdl").replace(".bob", ".tdl").replace(".plt", ".tdl");
}

const convertFile = (srcFileName: string) => {
    const destFileName = getDestFileName(srcFileName);
    // make sure the destination folder exists
    const destFolderName = path.dirname(destFileName)
    fs.mkdirSync(destFolderName, { recursive: true });

    if (srcFileName.endsWith(".edl") || srcFileName.endsWith(".stp") || srcFileName.endsWith(".bob") || srcFileName.endsWith(".plt")) {
        // convert the file
        toBeConvertedFiles.push(srcFileName);
        FileReader.readEdlAndSaveTdl(srcFileName, destFolderName, undefined, true)
    } else {
        // copy the file
        toBeCopiedFiles.push(srcFileName);
        fs.copyFileSync(srcFileName, destFileName);
    }
}


/**
 * Input is a file in edl folder.
 */
const deleteFile = (srcFileName: string) => {
    const destFileName = getDestFileName(srcFileName);
    toBeDeletedFiles.push(destFileName);
    const trashFileName = destFileName.replace(tdlFolder, tdlFolderTrash);
    const trashFolderName = path.dirname(trashFileName);
    fs.mkdirSync(trashFolderName, { recursive: true });
    fs.renameSync(destFileName, trashFileName);
}


// generate md5 JSON
try {
    iterateFolder(edlFolder)
} catch (e) {
    writeToLog(`${e}`);
    exit(e);
}

// rename old md5 JSON
try {
    fs.renameSync(jsonFullName, oldJsonFullName);
    // read old md5 JSON
    oldJsonContent = JSON.parse(fs.readFileSync(oldJsonFullName).toString());
} catch (e) {
    // no throw
}
// save new md5 JSON
try {
    fs.writeFileSync(jsonFullName, JSON.stringify(jsonContent, null, 4))
} catch (e) {
    writeToLog(`${e}`);
    exit(e);
}


// iterate over the old F2 JSON file, try to find the key in new F2 JSON file
//  - if there is no such a key, it means the file is moved to another file (case C) or deleted (case E) --> delete the tdl file
//  - if there is a key, then compare their md5
//    - if md5 are the same, it means the file is not changed (case A) --> do nothing
//    - if md5 are different, it means the file is modified (case B) --> convert the file
try {
    for (const [fileFullName, oldMd5] of Object.entries(oldJsonContent)) {
        const newMd5 = jsonContent[fileFullName];
        if (newMd5 === undefined) {
            //  - if there is no such a key, it means the file is moved to another file (case C) or deleted (case E) --> delete the tdl file
            deleteFile(fileFullName)
        } else {
            //  - if there is a key, then compare their md5
            if (newMd5 === oldMd5) {
                // - if md5 are the same, it means the file is not changed (case A) --> do nothing
            } else {
                //    - if md5 are different, it means the file is modified (case B) --> convert the file
                convertFile(fileFullName)
            }
        }
    }
} catch (e) {
    writeToLog(`${e}`);
    exit(e);
}



// iterate over the new F2 JSON file, try to find the key in old F2 JSON file
//  - if there is no such a key, it means the file is newly added (case F) or moved from another file (case D) --> convert the file
//  - if there is a key, then compare their md5
//    - if the md5 are the same, it means the file is not changed (case A) --> do nothing
//    - if the md5 are different, it means the file is modified (case B) --> convert the file

try {
    for (const [fileFullName, newMd5] of Object.entries(jsonContent)) {
        const oldMd5 = oldJsonContent[fileFullName];
        if (oldMd5 === undefined) {
            //  - if there is no such a key, it means the file is newly added (case F) or moved from another file (case D) --> convert the file
            convertFile(fileFullName)
        } else {
            //  - if there is a key, then compare their md5
            if (newMd5 === oldMd5) {
                //    - if the md5 are the same, it means the file is not changed (case A) --> do nothing
            } else {
                //    - if the md5 are different, it means the file is modified (case B) --> convert the file
                // we have done this in last for loop
                // convertFile(fileFullName)
            }
        }
    }
} catch (e) {
    writeToLog(`${e}`);
    exit(e);
}


writeToLog("These files are converted");
writeToLog(JSON.stringify(toBeConvertedFiles, null, 4));
writeToLog("These files are copied over");
writeToLog(JSON.stringify(toBeCopiedFiles, null, 4));
writeToLog("These files are deleted");
writeToLog(JSON.stringify(toBeDeletedFiles, null, 4));
writeToLog("If you see this line of text, it means the conversion is successful, otherwise it fails");

