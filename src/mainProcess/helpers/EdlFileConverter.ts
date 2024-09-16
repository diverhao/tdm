import { FileReader } from "../file/FileReader";

// before run this script, run `npm rebuild` to match the lib node versions with the electron.js node version

// convert all files in source folder to destination folder
FileReader.readEdlFolderAndSaveTdls("/Users/1h7/tmp/opi/edm-tdl/", "/Users/1h7/tmp/opi/edm-tdl/", 50, undefined, true)
// FileReader.readEdlFolderAndSaveTdls("/Users/1h7/tmp/opi/edm-tdl/hvcm", "/Users/1h7/tmp/opi/edm-tdl/hvcm", 50, undefined, true)

// conver one edl file to tdl and save it
// FileReader.readEdlAndSaveTdl("/Users/1h7/tmp/opi/edm-tdl/navwogif.edl", undefined, undefined, true)
// FileReader.readEdlAndSaveTdl("/Users/1h7/tmp/opi/edm-tdl/ops_ovrvw/RTBT_Overview.edl", undefined, undefined, true)

