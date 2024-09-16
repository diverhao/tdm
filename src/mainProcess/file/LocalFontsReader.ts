import fs from 'fs';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
import { logs } from '../global/GlobalVariables';

/**
 * Collection of methods for reading system font names.
 */
export class LocalFontsReader {
    constructor() {
    }

    // ----------------------- table -----------------------

    static TABLE_COUNT_OFFSET = 4;
    static TABLE_HEAD_OFFSET = 12;
    static TABLE_HEAD_SIZE = 16;
    static TAG_OFFSET = 0;
    static TAG_SIZE = 4;
    static CHECKSUM_OFFSET = this.TAG_OFFSET + this.TAG_SIZE;
    static CHECKSUM_SIZE = 4;
    static CONTENTS_PTR_OFFSET = this.CHECKSUM_OFFSET + this.CHECKSUM_SIZE;
    static CONTENTS_PTR_SIZE = 4;
    static LENGTH_OFFSET = this.TABLE_HEAD_SIZE + this.CONTENTS_PTR_OFFSET;

    static getCount = (data: Buffer) => {
        return data.readUInt16BE(this.TABLE_COUNT_OFFSET);
    };

    static getTableHead = (data: Buffer, name: string) => {
        let numTables = this.getCount(data);

        for (let i = 0; i < numTables; ++i) {
            const offset = this.TABLE_HEAD_OFFSET + i * this.TABLE_HEAD_SIZE;
            const tag = data.slice(offset, offset + this.CONTENTS_PTR_SIZE).toString();

            if (tag === name) {
                const headerInfo = {
                    tag: tag,
                    checksum: data.readUInt32BE(offset + this.CHECKSUM_OFFSET),
                    contents: data.readUInt32BE(offset + this.CONTENTS_PTR_OFFSET),
                    length: data.readUInt32BE(offset + this.LENGTH_OFFSET)
                };
                return headerInfo;
            }
        }
        return undefined;
    }

    // --------------------------- name table -----------------------

    static getNameTable = (data: Buffer) => {
        const nameTableHead = this.getTableHead(data, "name");
        if (nameTableHead === undefined) {
            return undefined;
        } else {
            const ntOffset = nameTableHead.contents;
            const offsetStorage = data.readUInt16BE(ntOffset + 4);
            const numberNameRecords = data.readUInt16BE(ntOffset + 2);

            const storage = offsetStorage + ntOffset;

            let info: Record<string, string> = {};
            for (let ii = 0; ii < numberNameRecords; ii++) {
                const offset = ntOffset + 6 + ii * 12;

                const platformId = data.readUInt16BE(offset);
                const nameId = data.readUInt16BE(offset + 6);
                const stringLength = data.readUInt16BE(offset + 8);
                const stringOffset = data.readUInt16BE(offset + 10);

                if (!info[nameId]) {
                    info[nameId] = '';
                    for (let jj = 0; jj < stringLength; jj++) {
                        let charCode = data[storage + stringOffset + jj];
                        if (charCode === 0) continue;
                        info[nameId] += String.fromCharCode(charCode);
                    }
                }
            }
            return info;
        }
    };

    // --------------------------- post table -----------------------


    static FORMAT_OFFSET = 0;
    static ITALIC_ANGLE_OFFSET = this.FORMAT_OFFSET + 4;
    static UNDERLINE_POSITION_OFFSET = this.ITALIC_ANGLE_OFFSET + 8;
    static UNDERLINE_THICKNESS_OFFSET = this.UNDERLINE_POSITION_OFFSET + 2;
    static IS_FIXED_PITCH_OFFSET = this.UNDERLINE_THICKNESS_OFFSET + 2;

    static fixed16dot16 = (fixed: number) => {
        if (fixed & 0x80000000) {
            // negative number is stored in two's complement
            fixed = -(~fixed + 1);
        }

        return fixed / 65536;
    }


    static getPostTable = (data: Buffer): Record<string, number> | undefined => {
        const postTableHead = this.getTableHead(data, "post");
        if (postTableHead === undefined) {
            return undefined;
        } else {
            const offset = postTableHead.contents;
            let result: Record<string, number> = {};

            result["format"] = this.fixed16dot16(data.readUInt32BE(offset + this.FORMAT_OFFSET))
            result["italicAngle"] = this.fixed16dot16(data.readUInt32BE(offset + this.ITALIC_ANGLE_OFFSET))
            result["underlinePosition"] = data.readInt16BE(offset + this.UNDERLINE_POSITION_OFFSET)
            result["underlineThickness"] = data.readInt16BE(offset + this.UNDERLINE_THICKNESS_OFFSET)
            result["isFixedPitch"] = data.readUInt32BE(offset + this.IS_FIXED_PITCH_OFFSET)
            result["minMemType42"] = data.readUInt32BE(offset + 7)
            result["maxMemType42"] = data.readUInt32BE(offset + 9)
            result["minMemType1"] = data.readUInt32BE(offset + 11)
            result["maxMemType1"] = data.readUInt32BE(offset + 13)
            return result;
        }
    }

    // ------------------------ OS/2 table -------------------------

    static VERSION_OFFSET = 0;
    static WEIGHT_CLASS_OFFSET = 4;

    static getOs2Table = (data: Buffer): Record<string, number> | undefined => {
        const os2TableHead = this.getTableHead(data, "OS/2");
        if (os2TableHead === undefined) {
            return undefined;
        } else {
            const offset = os2TableHead.contents;
            let result: Record<string, number> = {};

            result["version"] = data.readUInt16BE(offset + this.VERSION_OFFSET);
            result["weightClass"] = data.readUInt16BE(offset + this.WEIGHT_CLASS_OFFSET);
            return result;
        }
    };

    // ------------------------- read info ------------------------------------

    static getFontInfoPromise = (fontName: string) => {
        const promise: Promise<undefined | {
            tables: {
                name: Record<string, string>,
                post: Record<string, number>,
                "OS/2": Record<string, number>,
            },
            fontFullFileName: string,
        }> = new Promise((resolve, reject) => {
            fs.readFile(fontName,
                (err: any, data: Buffer) => {
                    if (err !== null) {
                        logs.error("-1", "error reading")
                        resolve(undefined);
                    } else {
                        try {
                            const nameTable = this.getNameTable(data);
                            const postTable = this.getPostTable(data);
                            const os2Table = this.getOs2Table(data);
                            if (nameTable !== undefined && postTable !== undefined && os2Table !== undefined) {
                                resolve({
                                    tables: {
                                        name: nameTable,
                                        post: postTable,
                                        'OS/2': os2Table,
                                    },
                                    fontFullFileName: fontName,
                                });
                            } else {
                                // font file may miss some properties
                                // console.log("Error in font file", fontName)
                                resolve(undefined);
                            }
                        } catch (e) {
                            // console.log(e);
                            resolve(undefined);
                        }
                    }
                }

            )

        })
        return promise;
    }

    // --------------------------- higher level stuff -------------------------

    static getFontFolders = () => {
        const platform = process.platform;
        let folders: string[] = [];
        if (platform === "darwin") {
            folders = [
                path.join('/', 'Library', 'Fonts'),
                path.join('/', 'System', 'Library', 'Fonts')
            ];
            const home = process.env.HOME;
            if (home !== undefined) {
                folders.push(path.join(home, 'Library', 'Fonts'))
            }
        } else if (platform === "linux") {
            folders = [
                path.join('/', 'usr', 'share', 'fonts'),
                path.join('/', 'usr', 'local', 'share', 'fonts')
            ];
            const home = process.env.HOME;
            if (home !== undefined) {
                folders.push(path.join(home, '.fonts'));
                folders.push(path.join(home, '.local', 'share', 'fonts'));
            }
        } else if (platform === "win32") {
            const appDataFolder = process.env.APPDATA;
            if (appDataFolder !== undefined) {
                folders.push(path.join(path.resolve(appDataFolder, '..'), 'Local', 'Microsoft', 'Windows', 'Fonts'));
            }
            const winDir = process.env.windir || process.env.WINDIR;
            if (winDir !== undefined) {
                folders.push(path.join(winDir, 'Fonts'));
            }
        } else {
            logs.error("-1", "OS", platform, "is not recognized");
        }
        return folders;
    }

    static getFontFileNames = async (folderName: string, result: string[]) => {
        logs.debug("-1", "reading", folderName);
        try {
            const entries = await fsPromises.readdir(folderName, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    await this.getFontFileNames(path.join(folderName, entry.name), result);
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name).toLowerCase();
                    if (ext === '.ttf' || ext === '.otf' || ext === '.ttc' || ext === '.dfont') {
                        result.push(path.join(folderName, entry.name));
                    }
                } else {
                    // soft link ...
                    logs.error("-1", "Error: entry", entry.name, "is not a file or folder");
                }
            }
        } catch (e) {
            logs.error("-1", "Error reading folder", folderName, e);
        }
    }

    static readLocalFontsMeta = async () => {
        const fontFiles: string[] = [];
        for (let folder of this.getFontFolders()) {
            await this.getFontFileNames(folder, fontFiles);
        }

        const fontsMetaPromises: Promise<{
            tables: {
                name: Record<string, string>;
                post: Record<string, number>;
                "OS/2": Record<string, number>;
            };
            fontFullFileName: string;
        } | undefined>[] = [];

        // full paths
        for (const fontFile of fontFiles) {
            const fontMetaPromise = this.getFontInfoPromise(fontFile);
            fontsMetaPromises.push(fontMetaPromise);
        }

        const fontsMetaRaw = await Promise.all(fontsMetaPromises);

        const fontsMeta: {
            family: string;
            subFamily: string;
            postscriptName: string;
            fontFullFileName: string;
        }[] = [];

        for (let fontMetaRaw of fontsMetaRaw) {
            if (fontMetaRaw !== undefined) {
                const info = fontMetaRaw.tables?.name;
                const fontFullFileName = fontMetaRaw.fontFullFileName;
                fontsMeta.push(
                    {
                        family: info['16'] ? info['16'] : info['1'],
                        subFamily: info['17'] ? info['17'] : info['2'],
                        postscriptName: info['6'],
                        fontFullFileName: fontFullFileName,
                    }
                )
            }
        }

        return fontsMeta
    }
}