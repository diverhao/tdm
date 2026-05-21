import { Log } from "../../common/Log";

export type type_ArchiverApplianceDataElement = {
    secs: number;
    val: number | number[];
    nanos: number;
    severity: number;
    status: number;
    fields?: Record<string, string>;
};

export type type_ArchiverApplianceData = {
    meta: {
        name: string;
        [key: string]: string;
    };
    data: type_ArchiverApplianceDataElement[];
};

/**
 * type guard for received data
 */
export const verifyArchiverApplianceData = (archiveData: any): boolean => {
    return true;
};


export class ArchiverAppliance {
    // mpex-ics-srv004.ornl.gov:17668/retrieval
    private readonly _retrievalUrl: string;

    // timeout 30 seconds
    readonly fetchTimeOutMs = 30000;

    constructor(retrievalUrl: string) {
        retrievalUrl = retrievalUrl.trim();
        if (!retrievalUrl.startsWith("http://")) {
            retrievalUrl = "http://" + retrievalUrl;
        }
        if (retrievalUrl.endsWith("/")) {
            retrievalUrl = retrievalUrl.substring(0, retrievalUrl.length - 1);
        }
        this._retrievalUrl = retrievalUrl;
    }

    getRetrievalUrl() {
        return this._retrievalUrl;
    }

    requestArchiveData = async (channelName: string, startTime: number, endTime: number, optimize: boolean): Promise<[number[], number[]] | undefined> => {
        try {
            const archiveData = await this.fetchData(channelName, startTime, endTime, optimize);
            if (archiveData === undefined) {
                Log.error("Cannot obtain archive data for", channelName, "from", startTime, "to", endTime);
                return undefined;
            }
            const data = this.convertArchiveData(archiveData);
            return data;
        } catch (e) {
            Log.error("Failed to request archive data", e);
            return undefined;
        }
    }

    convertArchiveData = (archiveData: type_ArchiverApplianceData) => {
        const channelName = archiveData["meta"]["name"];
        const data = archiveData["data"];
        const times: number[] = [];
        const values: number[] = [];
        for (const element of data) {
            const time = element["secs"] * 1000 + element['nanos'] / 1000000;
            const value = element["val"];
            if (typeof value === "number") {
                times.push(time);
                values.push(value);
            } else if (Array.isArray(value)) {
                // [mean, std, min, max, count]
                const average = value[0];
                const min = value[2];
                const max = value[3];
                if (typeof min !== "number" || typeof max !== "number" || typeof average !== "number") {
                    throw new Error("Archiver data type error: not a number");
                }
                times.push(time);
                times.push(time);
                times.push(time);
                values.push(min);
                values.push(max);
                values.push(average);
            } else {
                throw new Error("Archiver data type error: not a number or number array");
            }
        }

        const result: [number[], number[]] = [times, values];
        return result;
    }


    fetchData = async (channelName: string, from: number, to: number, optmized: boolean) => {

        const controller = new AbortController();

        const timeout = setTimeout(() => {
            controller.abort();
        }, this.fetchTimeOutMs);

        const baseUrl = `${this.getRetrievalUrl()}/data/getData.json`;
        const fromIso = new Date(from).toISOString();
        const toIso = new Date(to).toISOString();
        let pv = channelName;
        if (optmized === true) {
            pv = "optimized_3000(" + pv + ")";
        }

        const params = new URLSearchParams({
            pv: pv,
            from: fromIso,
            to: toIso,
        });

        const url = `${baseUrl}?${params.toString()}`;

        let response: Response;

        try {
            response = await fetch(url,
                {
                    signal: controller.signal,
                }
            );
        } catch (error) {
            throw new Error(`Network error while contacting Archiver Appliance: ${String(error)}`);
        } finally {
            clearTimeout(timeout);
        }

        const bodyText = await response.text();

        if (!response.ok) {
            throw new Error(
                `Archiver request failed: ${response.status} ${response.statusText}\n${bodyText}`
            );
        }

        try {
            const result = JSON.parse(bodyText)[0];
            if (verifyArchiverApplianceData(result) === true) {
                console.log("aaabbb--------<<<<<<<<<<<")
                return result;
            } else {
                Log.error("Archiver returned a non-compilant data");
                throw new Error(`Archiver returned a wrong type JSON response:\n${bodyText.slice(0, 500)}`);
            }

        } catch {
            throw new Error(`Archiver returned non-JSON response:\n${bodyText.slice(0, 500)}`);
        }

    }
}
