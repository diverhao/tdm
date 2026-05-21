import { ArchiverAppliance } from "./ArchiverAppliance";

export class ArchiverAppliances {
    private _appliances: ArchiverAppliance[] = [];

    constructor(retrievalUrls: string[]) {
        const urls = this.processUrls(retrievalUrls);
        for (const url of urls) {
            this._appliances.push(new ArchiverAppliance(url));
        }
    }
    getAppliances = () => {
        return this._appliances;
    }

    requestArchiveData = async (channelName: string, startTime: number, endTime: number, optimize: boolean): Promise<([number[], number[]] | undefined)[]> => {
        const result: ([number[], number[]] | undefined)[] = [];
        for (const appliance of this.getAppliances()) {
            const oneResult = await appliance.requestArchiveData(channelName, startTime, endTime, optimize);
            result.push(oneResult);
        }
        return result;
    }

    processUrls = (urls: string[]) => {
        const result: string[] = [];
        const seen = new Set<string>();
        for (let url of urls) {
            url = url.trim();
            if (!url.startsWith("http://")) {
                url = "http://" + url;
            }
            if (url.endsWith("/")) {
                url = url.substring(0, url.length - 1);
            }
            if (!seen.has(url)) {
                seen.add(url);
                result.push(url);
            }
        }
        return result;
    }
}
