/**
 * Program 
 */
import { FileReader } from '../file/FileReader';
import { parentPort, workerData } from 'worker_threads';

const start = async (options: {
    command: "start",
    src: string,
    dest: string,
    depth: number,
    displayWindowId: string,
    widgetKey: string,
}) => {
    if (options["src"].endsWith(".edl") || options["src"].endsWith(".stp") || options["src"].endsWith(".bob") || options["src"].endsWith(".plt")) {
        await FileReader.readEdlAndSaveTdl(
            options["src"], // sourceFile: string,
            options["dest"], // destinationFolder: string,
            undefined, // profile: Profile | undefined = undefined,
            true, // convertEdlSuffix: boolean = false,
            parentPort,
        )
    } else {
        await FileReader.readEdlFolderAndSaveTdls(
            options["src"], // sourceFolder: string,
            options["dest"], // destinationFolder: string,
            options["depth"], // maxDepth: number = 100,
            undefined, // hashFile: string | undefined = undefined,
            true, // convertEdlSuffix: boolean = false
            parentPort,
        );
    }
}

console.log('Received data from main thread:', workerData);

start(workerData).then(() => {
    parentPort?.postMessage({
        type: "all-files-conversion-finished",
        status: "success",
    });
    // when the work finishes, the "exit" event is emitted, the main process will update with renderer process
    parentPort?.postMessage('========================= File converter completed =====================!');
})
