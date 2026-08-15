// /**
//  * Read profiles file
//  */
// import fs from 'fs';
// import { Profiles } from "../mainProcess/process/Profiles";

// const readFile = (filePath: string) => {
// 	let profiles = new Profiles(filePath);
// 	profiles.read().then((success: boolean) => {
// 		const names = profiles.getProfileNames();
// 	});
// };

// // read file
// readFile("../../src/test/profiles.json")

// // read a non-exist JSON file
// fs.unlink("./profiles.json", (err) => {});
// readFile("./profiles.json")
// fs.unlink("./profiles.json", (err) => {});

// // use in-memory profiles
// readFile("/profiles.json")

