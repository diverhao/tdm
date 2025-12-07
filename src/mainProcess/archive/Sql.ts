import oracledb, { ResultSet } from 'oracledb';
import { Log } from '../../common/Log';

export enum SqlState {
    "DISCONNECTED",
    "CONNECTING",
    "CONNECTED",
};

export class Sql {
    private _connection: oracledb.Connection | undefined = undefined;
    private _state: SqlState = SqlState["DISCONNECTED"];
    private _periodicTask: NodeJS.Timeout;
    private _dialect: "oracle" | "mysql" | "elasticsearch" = "oracle";
    private readonly _userName: string = '';
    private readonly _password: string = "";

    // SNS connection
    // connectionString = `
    //     (DESCRIPTION=
    //     (LOAD_BALANCE=OFF)
    //     (FAILOVER=ON)
    //     (ADDRESS=(PROTOCOL=TCP)(HOST=snsappa.sns.ornl.gov)(PORT=1610))
    //     (ADDRESS=(PROTOCOL=TCP)(HOST=snsappb.sns.ornl.gov)(PORT=1610))
    //     (CONNECT_DATA=(SERVICE_NAME=prod_controls))
    //     )
    //     `;
    connectionString = "";

    constructor(input: {
        userName: string,
        password: string,
        connectionString: string,
    }) {
        this._userName = input["userName"];
        this._password = input["password"];
        this.connectionString = input["connectionString"].replaceAll("\\n", "\n");
        this.connectDb();
        this._periodicTask = setInterval(() => {
            // this.periodicTaskFunc();
        }, 2000)
    }

    periodicTaskFunc = async () => {

        if (this.getState() === SqlState.CONNECTING) {
            Log.info("-1", "We are connecting to SQL db.");
            return;
        }

        await this.checkConnectionStatus();

        if (this.getState() === SqlState.CONNECTED) {
            Log.info("-1", "We are connected to SQL db.");
            return;
        } else {
            Log.error("-1", "Seems like the SQL db connection is broken, re-connect.")
            this.reconnectDb()
        }
    }

    connectDb = async () => {
        if (this.getState() === SqlState.CONNECTED || this.getState() === SqlState.CONNECTING) {
            Log.info("-1", "We already initiated to connect SQL db, be patient ...");
            return;
        }
        this.setState(SqlState.CONNECTING);
        try {
            this.setConnection(await oracledb.getConnection(
                {
                    user: this.getUserName(),
                    password: this.getPassword(),
                    connectionString: this.connectionString,
                }
            ));
            this.setState(SqlState.CONNECTED);
            Log.info("-1", "Successfully connected to Oracle Database");
        } catch (e) {
            this.setState(SqlState.DISCONNECTED);
            this.setConnection(undefined);
            Log.error("-1", e);
        }
    }

    disconnectDb = () => {
        this.setState(SqlState["DISCONNECTED"]);
        const connection = this.getConnection();
        if (connection !== undefined) {
            connection.close();
            this.setConnection(undefined);
        }
    }

    reconnectDb = async () => {
        if (this.getState() === SqlState.CONNECTED || this.getState() === SqlState.CONNECTING) {
            // console.log("We already initiated to connect SQL db, be patient ...");
            return;
        }
        this.disconnectDb();
        await this.connectDb();
    }

    // time format: "2013-05-21 00:00:00"
    getChannelData = async (channelName: string, startTime: string, endTime: string) => {
        const queryString = `
            SELECT s.smpl_time AS Time, s.float_val AS Value, e.name AS Severity, m.name as Status
            FROM chan_arch.sample s
            JOIN chan_arch.channel c  ON c.channel_id = s.channel_id
            JOIN chan_arch.severity e ON e.severity_id = s.severity_id
            JOIN chan_arch.status m   ON m.status_id = s.status_id
            WHERE c.name='${channelName}'
            AND s.smpl_time BETWEEN TO_DATE('${startTime}', 'YYYY-MM-DD HH24:MI:SS') AND TO_DATE('${endTime}', 'YYYY-MM-DD HH24:MI:SS')
            ORDER BY smpl_time ASC
            `;
        return this.executeQuery(queryString);
    }

    getChannelDataForDataViewer = async (channelName: string, startTime: number, endTime: number): Promise<[number[], number[]] | undefined> => {
        const connection = this.getConnection();
        if (connection === undefined) {
            return undefined;
        }

        if (this.getState() !== SqlState.CONNECTED) {
            return undefined;
        }

        // get channel ID
        const channelIdData = await this.getChannelIdFromChannelName(channelName);
        if (channelIdData === undefined) {
            return undefined;
        }
        const channelIdRows = channelIdData["rows"] as number[][];
        const channelId = channelIdRows[0][0];
        if (typeof channelId !== "number") {
            return undefined;
        }

        // PL/SQL query
        const sql = `
        BEGIN
          :out_param := chan_arch.archive_reader_pkg.get_browser_data(:channel_id, :start_time, :end_time, :count);
        END;
      `;

        // get the cursor
        const execResult = await connection.execute(
            sql,
            {
                out_param: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }, // OUT parameter for result set (cursor)
                channel_id: channelId,
                start_time: new Date(startTime),
                end_time: new Date(endTime),
                count: 6000, // total number of data we want to fetch
            },
            {
                fetchArraySize: 1000,
                resultSet: true,
            }
        );

        const outBinds = execResult.outBinds as any;
        if (outBinds === undefined) {
            return undefined;
        }

        let cursor = outBinds.out_param as ResultSet<any>;
        if (cursor === undefined) {
            return undefined;
        }

        const numRows = 1000;
        const numColumns = cursor.metaData.length;
        let rows = await cursor.getRows(numRows); // each transmission send 1000 rows of data

        // const result: [number, number][] = [];
        const x: number[] = [];
        const y: number[] = [];
        while (rows.length > 0) {
            for (const row of rows) {
                if (numColumns === 9) {
                    // down sampled data
                    // [
                    //     2,                        // index, invalide data has index of -1
                    //     2025-03-01T09:00:04.937Z, // time stamp, string
                    //     null,                     // severity
                    //     null,                     // alarm
                    //     1711419.2919311523,       // min value
                    //     1712502.6889038086,       // max value
                    //     1712129.4284871418,       // average value
                    //     null,                     //
                    //     3                         // # of data in this time span
                    // ]
                    const timeStampe = row[1];
                    const valMin = row[4];
                    const valMax = row[5];
                    const valAvg = row[6];
                    if (timeStampe instanceof Date && typeof valMin === "number" && typeof valMax === "number" && typeof valAvg === "number") {
                        x.push(timeStampe.getTime());
                        x.push(timeStampe.getTime());
                        x.push(timeStampe.getTime());

                        y.push(valMin);
                        y.push(valMax);
                        y.push(valAvg);
                    }
                } else {
                    // full data, each row corresponds to one data
                    // [ 2025-03-01T08:59:59.937Z, 8, 35, null, 1709252.630493164, null ]
                    const timeStampe = row[0];
                    const val = row[4];
                    if (timeStampe instanceof Date && typeof val === "number") {
                        x.push(timeStampe.getTime());
                        y.push(val);
                    }
                }
            }
            rows = await cursor.getRows(numRows); // fetch multiple rows each time
        }

        await cursor.close();
        return [x, y];
    }


    getChannelIdFromChannelName = async (channelName: string) => {
        const queryString = `
            SELECT channel_id 
            FROM chan_arch.channel 
            WHERE NAME='${channelName}'
            `;
        return this.executeQuery(queryString);
    }

    getChannelDataFromChannelId = async (channelId: number, startTime: string, endTime: string) => {
        const queryString = `
            SELECT * 
            FROM chan_arch.sample
            WHERE channel_id=${channelId}
            AND smpl_time BETWEEN TO_DATE('${startTime}', 'YYYY-MM-DD HH24:MI:SS') AND TO_DATE('${endTime}', 'YYYY-MM-DD HH24:MI:SS')
            `;
        return this.executeQuery(queryString);
    }

    executeQuery = async (queryString: string) => {
        const connection = this.getConnection();
        if (connection !== undefined && this.getState() === SqlState.CONNECTED) {
            try {
                const result = await connection.execute(queryString);
                return result;
            } catch (e) {
                this.reconnectDb();
                return undefined;
            }
        } else {
            this.reconnectDb();
            return undefined;
        }
    }


    checkConnectionStatus = async () => {
        const connection = this.getConnection();
        if (connection === undefined) {
            return SqlState.DISCONNECTED;
        }
        try {
            await connection.ping();
            console.log("Connection is active.");
            return SqlState.CONNECTED;
        } catch (err) {
            console.error("Connection lost:", err);
            return SqlState.DISCONNECTED;
        }
    }


    getState = () => {
        return this._state;
    }

    getPeriodicTask = () => {
        return this._periodicTask;
    }

    setState = (newState: SqlState) => {
        this._state = newState;
    }

    getConnection = () => {
        return this._connection;
    }

    setConnection = (newConnection: oracledb.Connection | undefined) => {
        this._connection = newConnection;
    }

    getDialect = () => {
        return this._dialect;
    }

    setDialect = (newDialect: "oracle" | "mysql" | "elasticsearch") => {
        this._dialect = newDialect;
    }

    quit = () => {
        this.disconnectDb();
        clearInterval(this.getPeriodicTask())
    }

    getUserName = () => {
        return this._userName;
    }

    getPassword = () => {
        return this._password;
    }

}