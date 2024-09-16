import oracledb from 'oracledb';
import { logs } from '../global/GlobalVariables';

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
            this.periodicTaskFunc();
        }, 2000)
    }

    periodicTaskFunc = () => {
        if (this.getState() === SqlState.CONNECTED || this.getState() === SqlState.CONNECTING) {
            logs.info("-1", "We are either connected to SQL db or connecting to SQL db.");
            return;
        } else {
            logs.error("-1", "Seems like the SQL db connection is broken, re-connect.")
            this.reconnectDb()
        }
    }

    connectDb = async () => {
        if (this.getState() === SqlState.CONNECTED || this.getState() === SqlState.CONNECTING) {
            logs.info("-1", "We already initiated to connect SQL db, be patient ...");
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
            logs.info("-1", "Successfully connected to Oracle Database");
        } catch (e) {
            this.setState(SqlState.DISCONNECTED);
            this.setConnection(undefined);
            logs.error("-1", e);
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

    // runApp = async () => {
    //     let connection;
    //     const JdbcConnectionString = `
    //   (DESCRIPTION=
    //     (LOAD_BALANCE=OFF)
    //     (FAILOVER=ON)
    //     (ADDRESS=(PROTOCOL=TCP)(HOST=snsappa.sns.ornl.gov)(PORT=1610))
    //     (ADDRESS=(PROTOCOL=TCP)(HOST=snsappb.sns.ornl.gov)(PORT=1610))
    //     (CONNECT_DATA=(SERVICE_NAME=prod_controls))
    //   )`;


    //     try {
    //         connection = await oracledb.getConnection(
    //             {
    //                 user: "sns_reports",
    //                 password: "sns",
    //                 connectionString: JdbcConnectionString
    //             }
    //         );
    //         console.log("Successfully connected to Oracle Database");

    //         // Execute the SQL query
    //         // const result = await connection.execute(`
    //         //     SELECT 'SCL_Diag:BLM_Dev_Mov02:Fast60PulsesTotalLoss',  GRP_ID, CHANNEL_ID
    //         //     FROM CHAN_ARCH.CHANNEL
    //         //     WHERE ROWNUM <= 20
    //         // `);

    //         // const result1 = await connection.execute(`
    //         // SELECT channel_id 
    //         // FROM chan_arch.channel 
    //         // WHERE NAME='RTBT_Diag:BCM25I:Power60'
    //         // `)

    //         // const result2 = await connection.execute(
    //         //     `
    //         // SELECT * 
    //         // FROM chan_arch.sample
    //         // WHERE channel_id=79588
    //         // AND smpl_time BETWEEN TIMESTAMP'2013-05-21 00:00:00' AND TIMESTAMP'2013-05-21 01:00:00'
    //         // `);

    //         // const result3 = await connection.execute(
    //         //     `
    //         //     SELECT smpl_time 
    //         //     FROM chan_arch.sample 
    //         //     WHERE channel_id=79588
    //         //     AND smpl_time <= TO_DATE('2013-05-21 01:00:00', 'YYYY-MM-DD HH24:MI:SS')
    //         //     ORDER BY smpl_time DESC
    //         //     FETCH FIRST 100 ROWS ONLY
    //         //     `
    //         // );

    //         // const result4 = await connection.execute(
    //         //     `
    //         //    SELECT * 
    //         //    FROM chan_arch.sample
    //         //    WHERE channel_id=79588
    //         //    AND smpl_time BETWEEN TO_DATE('2013-05-21 00:00:00', 'YYYY-MM-DD HH24:MI:SS') AND TO_DATE('2013-05-21 01:00:00', 'YYYY-MM-DD HH24:MI:SS')
    //         //    `
    //         // )

    //         console.log(performance.now())
    //         // takes about 1.2 s
    //         // const result5 = await connection.execute(
    //         //     `
    //         //     SELECT *
    //         //     FROM chan_arch.sample
    //         //     WHERE channel_id = (
    //         //       SELECT channel_id 
    //         //       FROM chan_arch.channel 
    //         //       WHERE NAME = 'RTBT_Diag:BCM25I:Power60'
    //         //     )
    //         //     AND smpl_time BETWEEN TO_DATE('2013-05-21 00:00:00', 'YYYY-MM-DD HH24:MI:SS') AND TO_DATE('2013-05-21 01:00:00', 'YYYY-MM-DD HH24:MI:SS')
    //         //     FETCH FIRST 100 ROWS ONLY
    //         //     `
    //         // );

    //         // about 1.3 s
    //         const result6 = await connection.execute(
    //             `
    //         SELECT s.smpl_time AS Time, s.float_val AS Value, e.name AS Severity, m.name as Status
    //         FROM chan_arch.sample s
    //         JOIN chan_arch.channel c  ON c.channel_id = s.channel_id
    //         JOIN chan_arch.severity e ON e.severity_id = s.severity_id
    //         JOIN chan_arch.status m   ON m.status_id = s.status_id
    //         WHERE c.name='RTBT_Diag:BCM25I:Power60'
    //         AND s.smpl_time BETWEEN TO_DATE('2013-05-21 00:00:00', 'YYYY-MM-DD HH24:MI:SS') AND TO_DATE('2013-05-21 01:00:00', 'YYYY-MM-DD HH24:MI:SS')
    //         ORDER BY smpl_time ASC
    //         `
    //         )

    //         console.log(performance.now())

    //         // const result3 = await connection.execute(
    //         //     `
    //         //     SELECT channel_id 
    //         //     FROM chan_arch.channel 
    //         //     WHERE name='RTBT_Diag:BCM25I:Power60'
    //         //     `
    //         // )

    //         console.log(result6);

    //     } catch (err) {
    //         console.error(err);
    //     } finally {
    //         if (connection) {
    //             try {
    //                 await connection.close();
    //             } catch (err) {
    //                 console.error(err);
    //             }
    //         }
    //     }
    // }


}